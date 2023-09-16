
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
export const getVoteList = async (): Promise<Array<string>> => {
    const url = "https://data.europarl.europa.eu/api/v1/documents"
    const params = {
        "work-type": "PLENARY_RCV_EP",
        "format": "application/ld+json",
        "offset": 0,
        "limit": 500
    }
    let response = await loadJsonFromUrl(url, params)
    let votes = response.docs.map((doc: { identifier: string; }) => doc.identifier)
    return votes
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
    const titleID: string = title.getElementsByTagName("a")[0].structuredText
    console.log("Parsing: ", titleID, " - ", titleName)

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

    return {
        title: titleName,
        titleID: titleID,
        positive: positive,
        negative: negative,
        abstention: abstention
    };

};