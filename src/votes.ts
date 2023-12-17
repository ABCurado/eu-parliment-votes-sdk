import { parse, HTMLElement } from 'node-html-parser'
import { loadMeps, Mep } from './mep'
import { checkNameIsInList } from './util'

export interface DocumentVote {
    ID: string; // ID of the proposal
    title: string; // Title of the porposal
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
        return parseHTMLToDocumentVoteVoteArray(text, meps.meps);
    } catch (e) {
        throw new Error("Tried to query: " + response.url + " But got and invalid html: " + e);
    }
}

export const parseHTMLToDocumentVoteVoteArray = (html: string, meps: Array<Mep>): Array<DocumentVote> => {
    const HTMLVotes: Array<HTMLElement> = parseStringToHTMLArray(html);
    const allVotes: Array<DocumentVote> = []
    var seenVotes: Array<string> = []
    var votes: Array<Vote> = []
    var proposal: DocumentVote = {
        ID: "",
        title: "",
        votes: [],
        finalVote: 0
    }

    for (const htmlVote of HTMLVotes) {
        try {
            var vote = parseHTMLVote(htmlVote, meps)
        }catch(e : any){
            console.log(`Error parsing vote. Votes parsed so far ${seenVotes.length} error: ${e.message}`,)
            continue;
        }

        if (seenVotes.length === 0) {
            proposal = {
                ID: vote.proposalID,
                title: vote.title,
                votes: [],
                finalVote: 0
            }
            seenVotes.push(vote.proposalID)
        }

        if (!seenVotes.includes(vote.proposalID)) {
            proposal.votes = votes
            proposal.finalVote = votes.length - 1
            allVotes.push(proposal)
            seenVotes.push(vote.proposalID)

            proposal = {
                ID: vote.proposalID,
                title: vote.title,
                votes: [],
                finalVote: 0
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