import { parse, HTMLElement } from 'node-html-parser';
import OpenAI from "openai";

type DocumentType = 'report' | 'motion' | 'amendment' | 'declaration' | 'resolution' | 'opinion' | 'decision' | 'recommendation' | 'communication' | 'statement' | 'other';

export interface Document {
    content: string;
    summary: string;
    type: DocumentType;
    url: string;
}

export async function fetchAndParseDocument(id: string): Promise<Document> {
    const url = `https://www.europarl.europa.eu/doceo/document/${id}_EN.html`;
    const response = await fetch(url);
    if (!response.ok) {
        throw new Error(`HTTP error ${response.status}`);
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

    const summary = await summarizeDocument(documentText);

    return {
        content: documentText,
        summary: summary,
        url: url,
        type,
    };
}

export async function summarizeDocument(documentText: string): Promise<string> {
    const openai = new OpenAI({
        apiKey: "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",
    });
    
    const prompt = `Please summarize the following document. The summary should have around 75 words. Document:\n\n${documentText}`;
    
    const response = await openai.chat.completions.create({
        model: "gpt-3.5-turbo",        
        messages:[ 
            { role: 'user', content: prompt }
        ],
    });
    const summary = response.choices[0]?.message?.content;

    return summary || '';

}