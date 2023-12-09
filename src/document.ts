import { parse, HTMLElement } from 'node-html-parser';
import OpenAI from "openai";

type DocumentType = 'report' | 'motion' | 'amendment' | 'declaration' | 'resolution' | 'opinion' | 'decision' | 'recommendation' | 'communication' | 'statement' | 'other';

export interface Document {
    content: string;
    summary: Summary;
    type: DocumentType;
    url: string;
}

interface Summary {
    summary: string;
    tags: string[];
}

export async function fetchAndParseDocument(id: string): Promise<Document> {
    const url = `https://www.europarl.europa.eu/doceo/document/${id}_EN.html`;
    const response = await fetch(url);
    if (!response.ok) {
        return {
            content: `HTTP error ${response.status}`,
            url: url,
            summary: {
                summary: "",
                tags: []
            },
            type: "other",
        };
    }
    let type: DocumentType;
    if (id.startsWith('A')) {
        type = 'report';
    } else if (id.startsWith('B')) {
        type = 'motion';
    } else {
        type = 'other';
    }

    const content = await response.text();
    const parsedContent = parse(content);
    var documentText = parsedContent.innerText;
    // Remove anything that comes before the string "The European Parliament"
    documentText = documentText.substring(documentText.indexOf("The European Parliament"));
    // Remove anything that comes after the string "Instructs its President to forward this resolution"
    documentText = documentText.substring(0, documentText.indexOf("Instructs its President to forward this resolution"));

    if (documentText === undefined || documentText === null || documentText === "") {
        return {
            content: `Could not find document text`,
            url: url,
            summary: {
                summary: "",
                tags: []
            },
            type: "other",
        };
    }

    const summary = await summarizeDocument(documentText);

    return {
        content: documentText,
        summary: summary,
        url: url,
        type,
    };
}

export async function summarizeDocument(documentText: string): Promise<Summary> {
    const openai = new OpenAI({
        apiKey: "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",
    });

    const prompt = `You should summarise documents.You will get the content of a document in a multi paragraph format and you need to produce 2 outcomes.
    The first task is a text summary of aproximately 50 words. The writing style should be simple and easy to read you, possibly funny. When possible use emojis and bullet points.
    The second task is to return 5 tags that describe this proposal.
    This is the expected json format {summary: string, tags: string[]}`;

    const response = await openai.chat.completions.create({
        model: "gpt-3.5-turbo-1106",
        messages: [
            { role: "system", content: prompt },
            { role: "user", content: documentText }
        ],
        response_format: { type: "json_object" },
        temperature: 0.3
    });
    const summaryJsonString = response.choices[0].message.content;
    if (summaryJsonString == undefined) {
        throw new Error("OpenAI returned an empty summary");
    }
    // summary is a string with the format json format {summary: string, tags: string[]}. We need to parse it.
    const summary: Summary = JSON.parse(summaryJsonString);
    return summary;
}
