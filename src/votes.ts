
import { parse, HTMLElement } from 'node-html-parser'
import { loadJsonFromUrl } from "./util";

export type Vote = {
    proposalID: string; // ID of the proposal
    title: string; // Title of the vote and the ammendment if applicable
    positive: Array<string>; // List of mep names that voted yes
    negative: Array<string>; // List of mep names that voted no
    abstention: Array<string>; // List of mep names that abstained
};

export type Proposal = {
    ID: string; // ID of the proposal
    title: string; // Title of the porposal
    votes: Array<Vote>; // List of votes on the proposal
    finalVote: number; // Index of the final vote in the votes array
}

export const getProposalVoteList = async (limit: number): Promise<Array<string>> => {
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
        throw new Error("Votes is not an array")
    }
    return votes
}

// Get vote details by extracing the data from this endpoint https://www.europarl.europa.eu/doceo/document/A-9-2023-0288_EN.html


export const getVotesFromRCV = async (id: string): Promise<Array<Proposal>> => {
    const url = `https://www.europarl.europa.eu/doceo/document/${id}_EN.html`
    if (id === undefined || id === null || id === "") {
        throw new Error("Invalid id")
    }
    let response = await fetch(url)
    if (!response.ok) {
        throw new Error("HTTP error " + response.status);
    }
    const text = await response.text();
    try {
        return parseHTMLToProposalVoteArray(text);
    } catch (e) {
        throw new Error("Tried to query: " + response.url + " But got and invalid html: " + e);
    }
}

export const parseHTMLToProposalVoteArray = (html: string): Array<Proposal> => {
    const HTMLVotes: Array<HTMLElement> = parseStringToHTMLArray(html);
    const allVotes: Array<Proposal> = []
    var seenVotes: Array<string> = []
    var votes: Array<Vote> = []
    var proposal: Proposal = { 
        ID: "",
        title: "",
        votes: [],
        finalVote: 0
    }

    for (const htmlVote of HTMLVotes) {
        try{
            var vote = parseHTMLVote(htmlVote)
        }catch(e){
            console.log("Error parsing vote: " + e)
            continue;
        }

        if(seenVotes.length === 0){
            proposal= {
                ID: vote.proposalID,
                title: vote.title,
                votes: [],
                finalVote: 0
            }
            seenVotes.push(vote.proposalID)
        }

        if (!seenVotes.includes(vote.proposalID) ) {
            proposal.votes = votes
            proposal.finalVote = votes.length - 1
            allVotes.push(proposal)
            seenVotes.push(vote.proposalID)

            proposal= {
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

export const parseHTMLVote = (html: HTMLElement): Vote => {

    const title: HTMLElement = html.getElementsByTagName("table")[0]
    const titleName: string = title.getElementsByTagName("span").map((node) => node.structuredText).join("")

    const titleSpan: HTMLElement[] = title.getElementsByTagName("a")
    var titleID: string
    if (titleSpan === undefined || titleSpan.length === 0) {
        titleID = titleName.match(/([A-Z]{1,2}-[A-Z0-9]{1,3}-[0-9]{4}\/[0-9]{4})|([A-Z][0-9]-[0-9]{4}\/[0-9]{4})/g)?.[0] || ""
    }else{
        titleID = titleSpan[0].structuredText
    }

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
    const abstention: Array<string> = html
        .getElementsByTagName("table")[3]
        .getElementsByTagName("tr")
        .map((party) => party.getElementsByTagName("td")[1].structuredText)
        .flatMap((persons) => persons.split(","))
        .map((mep) => mep.trim())
        .filter((mep) => mep !== "0")
    
    // TODO: Add missing corrections to votes

    return {
        title: titleName,
        proposalID: titleID,
        positive: positive,
        negative: negative,
        abstention: abstention
    };
};