import { parse, HTMLElement } from 'node-html-parser';
import OpenAI from "openai";
import { loadJsonFromUrl } from "./util";

type DocumentType = 'report' | 'motion' | 'amendment' | 'declaration' | 'resolution' | 'opinion' | 'decision' | 'recommendation' | 'communication' | 'statement' | 'other';

export interface Document {
    id: string;
    content?: string;
    contentRaw: string;
    summary?: Summary;
    type: DocumentType;
    url: string;
}

interface Summary {
    text: string;
    tags: string[];
}


/**
 * Fetches and parses a document from the EU Parliament website.
 * @param id The document ID.
 * @param summarise Whether to summarise the document.
 * @returns The parsed document.
 */
export async function fetchAndParseDocument(id: string, summarise: boolean = true): Promise<Document> {
    const url = `https://www.europarl.europa.eu/doceo/document/${id}_EN.html`;
    console.log(`Fetching document ${id} from ${url}`);
    const response = await fetch(url);
    if (!response.ok || response.status !== 200) {
        throw new Error(`Failed to fetch document ${id} (${url} - ${response.status})`);
    }
    const content = await response.text();
    if (content.includes("This document does not exist in HTML")) {
        throw new Error(`Document ${id} does not exist in HTML format`);
    }

    // FIXME: This is a hack to get the document type. We should use the API instead. 
    // Not still sure where this information is stored online.
    let type: DocumentType;
    if (id.startsWith('A')) {
        type = 'report';
    } else if (id.startsWith('B')) {
        type = 'motion';
    } else {
        type = 'other';
    }

    const parsedContent = parse(content);
    var documentTextRaw = parsedContent.innerText;

    let summary: Summary | undefined;
    let documentText: string | undefined;
    if (summarise) {

        // FIXME: This needs further cleaning up. 
        // Remove anything that comes before the string "The European Parliament"
        documentText = documentTextRaw.substring(documentTextRaw.indexOf("The European Parliament"));
        // Remove anything that comes after the string "Instructs its President to forward this resolution"
        documentText = documentText.substring(0, documentText.indexOf("Instructs its President to forward this resolution"));

        if (documentText !== undefined && documentText !== null && documentText !== "") {
            summary = await summarizeDocument(documentText);
        }

    }

    return {
        id: id,
        contentRaw: documentTextRaw,
        content: documentText,
        summary: summary,
        url: url,
        type,
    };
}

/**
 * Summarises a document using OpenAI.
 * Expects a environment key OPENAI_API_KEY to be set.
 * @param documentText The document text.
 * @returns The summary.
 * @throws An error if the summary is empty.
 * @throws An error if the the api key is not set.
*/
export async function summarizeDocument(documentText: string): Promise<Summary> {
    const openai = new OpenAI({
        apiKey: process.env.OPENAI_API_KEY,
    });

    const prompt = `You should summarise documents. You will get the content of a document in a multi paragraph format and you need to produce 2 outcomes.
    The first task is a text summary of aproximately 50 words. The writing style should be simple and easy to read you, possibly funny. When possible use emojis and bullet points.
    The second task is to return 5 tags that describe this proposal.
    This is the expected json format {text: string, tags: string[]}`;


    // Remove HTML tags from documentText
    documentText = documentText.replace(/(<([^>]+)>)/gi, "");

    // Replace newline characters with spaces
    documentText = documentText.replace(/(\r\n|\n|\r)/gm, " ");

    if (documentText.length > 16000) {
        documentText = documentText.substring(0, 16000);
    }
    
    const response = await openai.chat.completions.create({
        model: "gpt-3.5-turbo-1106",
        messages: [
            { role: "system", content: prompt },
            { role: "user", content: documentText }
        ],
        response_format: { type: "json_object" },
        temperature: 0.1
    });

    const summaryJsonString = response.choices[0].message.content;
    if (summaryJsonString == undefined) {
        throw new Error("OpenAI returned an empty summary");
    }
    // summary is a string with the format json format {summary: string, tags: string[]}. We need to parse it.
    const summary: Summary = JSON.parse(summaryJsonString);
    return summary;
}
