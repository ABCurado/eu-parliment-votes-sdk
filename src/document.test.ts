import { fetchAndParseDocument } from './document'
import { cacheFunction } from './util';


describe('fetchAndParseDocument', () => {
  it('should fetch and parse a document correctly', async () => {
    const documentId = 'A-9-2023-0288';
    const document = await cacheFunction(fetchAndParseDocument,documentId);

    expect(document).toBeDefined();
    expect(document.content).toContain('The European Parliament');
    expect(document.content).not.toContain('Instructs its President to forward this resolution');
    expect(document.type).toEqual('report');
    expect(document.url).toEqual(`https://www.europarl.europa.eu/doceo/document/${documentId}_EN.html`);
  });

  it('should throw an error if the HTTP response is not ok', async () => {
    const documentId = 'invalid-id';
    await expect(fetchAndParseDocument(documentId)).rejects.toThrowError('HTTP error 404');
  });
});