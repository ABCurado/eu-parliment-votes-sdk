
import { parse, HTMLElement } from 'node-html-parser'
import { loadJsonFromUrl } from "./util";

export type Vote = {
    title: string;
    titleID: string;
    positive: Array<string>;
    negative: Array<string>;
    abstention: Array<string>;
};
/*
    URL   'https://data.europarl.europa.eu/api/v1/documents?work-type=PLENARY_RCV_EP&format=application%2Fld%2Bjson&offset=0&limit=500' 
    Payload: 
        {
        "docs": [
            {
            "id": "https://data.europarl.europa.eu/eli/dl/doc/PV-8-2014-07-16-RCV",
            "type": "Work",
            "work_type": "http://publications.europa.eu/resource/authority/resource-type/PLENARY_RCV_EP",
            "identifier": "PV-8-2014-07-16-RCV"
            }, 
            ...
        ]
    }
*/
export const getVoteList = async (limit: number): Promise<Array<string>> => {
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

export const getVotesFromRCV = async (id: string): Promise<Array<Vote>> => {
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
        return parseHTMLToVote(text);
    } catch (e) {
        throw new Error("Tried to query: " + response.url + " But got and invalid html: " + e);
    }
}

export const parseHTMLToVote = (html: string): Array<Vote> => {
    const HTMLVotes: Array<HTMLElement> = parseStringToHTMLArray(html).slice(1);
    const votes: Array<Vote> = []
    for (const vote of HTMLVotes) {
        votes.push(parseHTMLVote(vote))
    }

    return votes;
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
        titleID: titleID,
        positive: positive,
        negative: negative,
        abstention: abstention
    };

};