import { parse, HTMLElement } from 'node-html-parser'

type DocumentType = 'report' | 'motion' | 'amendment' | 'declaration' | 'resolution' | 'opinion' | 'decision' | 'recommendation' | 'communication' | 'statement' | 'other';

interface Document {
    content: string;
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

    
    return {
        content: documentText,
        url: url,
        type,
    };
}