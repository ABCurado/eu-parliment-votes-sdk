import { summarizeDocument } from './document';
import { fetchAndParseDocument } from './document';

describe('summarizeDocument', () => {
    it('should return a summary and tags for a given document', async () => {
        const documentText = 'The European Parliament is the legislative branch of the European Union. It is composed of 705 members, who are directly elected by the citizens of the EU. The Parliament has three main roles: to pass EU laws, to scrutinize the work of the EU Commission, and to represent the interests of EU citizens.';

        const summary = await summarizeDocument(documentText);

        expect(summary).toHaveProperty('summary');
        expect(summary).toHaveProperty('tags');
        expect(summary.text).not.toBe('');
        expect(summary.tags.length).toBeGreaterThan(0);
    });

    it('should return an empty summary', async () => {
        const documentText = 'This is a test document that should return an empty summary';
        const summary = await summarizeDocument(documentText);
        expect(summary.text).toBe('');
    });
});

describe('fetchAndParseDocument', () => {
    it('should fetch and parse a document', async () => {
        const document = await fetchAndParseDocument('A-9-2023-0228');
        expect(document.content).toBeDefined();
        expect(document.summary).toBeDefined();
        expect(document.type).toBeDefined();
        expect(document.url).toBeDefined();
    });

    it('should throw an error if the document is not found', async () => {
        await expect(fetchAndParseDocument('invalid-id')).rejects.toThrow('HTTP error 404');
    });
});

