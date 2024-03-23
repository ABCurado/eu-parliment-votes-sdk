import { HTMLElement, parse } from 'node-html-parser'
import { Mep, loadMeps } from './mep'
import { checkNameIsInList, loadJsonFromUrl } from './util'

export interface DocumentVote {
    id: string; // ID of the proposal
    titleRaw: string; // Raw title of the vote
    title?: string; // Title of the vote parsed from the raw title
    votes: Array<Vote>; // List of votes on the proposal
    finalVote: number; // Index of the final vote in the votes array
    date?: Date; // Date of the vote
}

export interface Vote {
    proposalID: string; // ID of the proposal
    title: string; // Title of the vote and the ammendment if applicable
    result: VoteResults; // Results of the vote
};

export interface VoteResults {
    positive: Array<number>; // List of mep ids that voted yes
    negative: Array<number>; // List of mep ids that voted no
    abstention: Array<number>; // List of mep ids that abstained
    noVote: Array<number>; // List of mep ids that did not vote
};

/**
 * Retrieves an array of document identifiers for documents with votes.
 * Roll call votes or RCVs are votes where the MEPs are recorded individually.
 * This method retrieves the document identifiers for all RCVs.
 * @param limit The maximum number of documents to retrieve.
 * @returns A promise that resolves to an array of document identifiers.
 * @throws {Error} If the limit is invalid or if the document list cannot be parsed.
 */
export const getRCVs = async (limit: number): Promise<Array<string>> => {
    const url = "https://data.europarl.europa.eu/api/v1/documents"
    if (limit === undefined || limit === null || limit < 0) {
        throw new Error("Invalid limit")
    }
    const params = {
        "work-type": "PLENARY_RCV_EP",
        "offset": 0,
        "limit": limit
    }
    let response = await loadJsonFromUrl(url, params)
    let votes = await response.data.map((doc: { identifier: string; }) => doc.identifier)

    if (typeof votes !== "object" || !Array.isArray(votes)) {
        throw new Error("Could not parse document list")
    }
    return votes
}

// Get vote details by extracing the data from this endpoint https://www.europarl.europa.eu/doceo/document/A-9-2023-0288_EN.html
export const getVotesFromRCV = async (id: string): Promise<Array<DocumentVote>> => {
    const url = `https://www.europarl.europa.eu/doceo/document/${id}_EN.html`
    if (id === undefined || id === null || id === "") {
        throw new Error("Invalid id")
    }
    let response = await fetch(url)
    if (!response.ok) {
        throw new Error("HTTP error " + response.status);
    }
    const text = await response.text();
    
    const meps = await loadMeps(1000, 0);
    
    try {
        return parseHTMLToDocumentVoteArray(id, text, meps.meps);
    } catch (e) {
        throw new Error("Tried to query: " + response.url + " But got and invalid html: " + e);
    }
}

export const parseHTMLToDocumentVoteArray = (id: string, html: string, meps: Array<Mep>): Array<DocumentVote> => {
    const HTMLVotes: Array<HTMLElement> = parseStringToHTMLArray(html);
    const allVotes: Array<DocumentVote> = []
    var seenVotes: Array<string> = []
    var votes: Array<Vote> = []
    const parts = id.split('-');
    // parts[2] is the year, parts[3] is the month, parts[4] is the day
    const date = new Date(parseInt(parts[2]), parseInt(parts[3]) - 1, parseInt(parts[4]));
        
    var proposal: DocumentVote = {
        id: "",
        titleRaw: "",
        votes: [],
        finalVote: 0,
        date: date
    }

    for (const htmlVote of HTMLVotes) {
        try {
            var vote = parseHTMLVote(htmlVote, meps)
        }catch(e : any){
            const vote: Vote = {
                proposalID: "failed",
                title: "failedToParse",
                result: {
                    positive: [],
                    negative: [],
                    abstention: [],
                    noVote: []
                }
            }
            votes.push(vote)
            continue;
        }

        let title = vote.title
        const regex = /\s-\s(.*?)\s-\s/;
        const match = vote.title.match(regex);
        if (match && match[1]) {
            title = match[1];
        }

        if (seenVotes.length === 0) {
            proposal = {
                id: vote.proposalID,
                titleRaw: vote.title,
                title: title,
                votes: [],
                finalVote: 0,
                date: date
            }
            seenVotes.push(vote.proposalID)
        }

        if (!seenVotes.includes(vote.proposalID)) {
            proposal.votes = votes
            proposal.finalVote = votes.length - 1
            allVotes.push(proposal)
            seenVotes.push(vote.proposalID)

            proposal = {
                id: vote.proposalID,
                titleRaw: vote.title,
                title: title,
                votes: [],
                finalVote: 0,
                date: date
            }
            votes = []

        }
        votes.push(vote)
    }
    allVotes.push(proposal)
    return allVotes;
}

export const parseStringToHTMLArray = (html: string): Array<HTMLElement> => {
    const root = parse(html);
    const votes: Array<HTMLElement> = root.getElementsByTagName("table").filter(table => table.attributes.class === "doc_box_header");
    return votes
};

export const parseMepNamesToID = (meps: Array<Mep>,positive: Array<string>,negative: Array<string>, abstained: Array<string> ): VoteResults => {
    var voteResults: VoteResults = {
        positive: [],
        negative: [],
        abstention: [],
        noVote: [],
    };
    for (const mep of meps) {
        if (checkNameIsInList(mep.fullName, positive)) {
            voteResults.positive.push(mep.id);
        } else if (checkNameIsInList(mep.fullName, negative)) {
            voteResults.negative.push(mep.id);
        } else if (checkNameIsInList(mep.fullName, abstained)) {
            voteResults.abstention.push(mep.id);
        } else {
            voteResults.noVote.push(mep.id);
        }
    }
    return voteResults;
}

export const parseHTMLVote = (html: HTMLElement, meps: Array<Mep>): Vote => {

    const title: HTMLElement = html.getElementsByTagName("table")[0]
    const titleName: string = title.getElementsByTagName("span").map((node) => node.structuredText).join("")

    const titleSpan: HTMLElement[] = title.getElementsByTagName("a")
    var titleID: string
    if (titleSpan === undefined || titleSpan.length === 0) {
        titleID = titleName.match(/([A-Z]{1,2}-[A-Z0-9]{1,3}-[0-9]{4}\/[0-9]{4})|([A-Z][0-9]-[0-9]{4}\/[0-9]{4})/g)?.[0] || ""
    } else {
        titleID = titleSpan[0].structuredText
    }

    // FIXME: Add missing corrections to votes
    // TODO: Make this code easier to read
    const positive: Array<string> = html
        .getElementsByTagName("table")[1]
        .getElementsByTagName("tr")
        .map((party) => party.getElementsByTagName("td")[1].structuredText)
        .flatMap((persons) => persons.split(","))
        .map((mep) => mep.trim()).filter((mep) => mep !== "+")
    const negative: Array<string> = html
        .getElementsByTagName("table")[2]
        .getElementsByTagName("tr")
        .map((party) => party.getElementsByTagName("td")[1].structuredText)
        .flatMap((persons) => persons.split(","))
        .map((mep) => mep.trim())
        .filter((mep) => mep !== "-")
    const abstained: Array<string> = html
        .getElementsByTagName("table")[3]
        .getElementsByTagName("tr")
        .map((party) => party.getElementsByTagName("td")[1].structuredText)
        .flatMap((persons) => persons.split(","))
        .map((mep) => mep.trim())
        .filter((mep) => mep !== "0")

    const voteResults = parseMepNamesToID(meps,positive,negative,abstained)

    return {
        title: titleName,
        proposalID: titleID,
        result: voteResults
    };
};