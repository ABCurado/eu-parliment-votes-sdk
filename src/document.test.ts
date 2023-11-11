import { summarizeDocument, fetchAndParseDocument } from './document';
import { cacheFunction } from './util';


describe('summarizeDocument', () => {
    it('should return a summary of the document text', async () => {
        const documentText = `The European Parliament resolves to adopt the following text. The European Parliament,

        – having regard to the Commission proposal to the European Parliament and the Council (COM(2023)0210 – C9‑0194/2023),
        
        – having regard to Regulation (EU) 2021/691 of the European Parliament and of the Council of 28 April 2021 on the European Globalisation Adjustment Fund for Displaced Workers (EGF) and repealing Regulation (EU) No 1309/2013[1](“EGF Regulation”),
        
        – having regard to Council Regulation (EU, Euratom) 2020/2093 of 17 December 2020 laying down the multiannual financial framework for the years 2021-2027[2], and in particular Article 8 thereof,
        
        – having regard to the Interinstitutional Agreement of 16 December 2020 between the European Parliament, the Council of the European Union and the European Commission on budgetary discipline, on cooperation in budgetary matters and on sound financial management, as well as on new own resources, including a roadmap towards the introduction of new own resources[3] (‘IIA of 16 December 2020’), and in particular point 8 thereof,
        
        – having regard to the trilogue procedure provided for in point 9 of the IIA of 16 December 2020,
        
        – having regard to the opinion of the Committee on Employment and Social Affairs,
        
        – having regard to the letter of the Committee on Regional Development,
        
        – having regard to the report of the Committee on Budgets (A9-0228/2023),
        
        A. whereas the Union has set up legislative and budgetary instruments to provide additional support to workers who are suffering from the consequences of major structural changes in world trade patterns or of the global financial and economic crisis, and to assist their reintegration into the labour market; whereas this assistance is made through a financial support given to workers and the companies for which they worked;
        
        B. whereas Belgium submitted application EGF/2023/001 BE/ LNSA for a financial contribution from the European Globalisation Adjustment Fund (EGF), following 603 redundancies[4] in the economic sector classified under the NACE Revision 2 division 52 (Warehousing and support activities for transportation) in the province Brabant Wallon, within a reference period for the application from 23 August 2022 to 23 December 2022;
        
        C. whereas the application relates to 603 workers made redundant in the companies Logistics Nivelles SA (‘LNSA’) and SuperTransport SA/NV, a supplier of Logistics Nivelles;`;
        const summary = await cacheFunction(summarizeDocument,documentText);
        expect(summary).toBeDefined();
        expect(summary.length).toBeGreaterThan(0);
    });

    it('should return a summary with a maximum of 60 tokens', async () => {
        const documentText = 'The European Parliament resolves to adopt the following text...';
        const summary = await cacheFunction(summarizeDocument,documentText);
        const tokens = summary.split(' ');
        expect(tokens.length).toBeLessThanOrEqual(60);
    });

    it('should return an empty string if the document text is empty', async () => {
        const documentText = '';
        const summary = await cacheFunction(summarizeDocument,documentText);
        expect(summary).toEqual('');
    });
});

describe('fetchAndParseDocument', () => {
    it('should fetch and parse a document correctly', async () => {
        const documentId = 'A-9-2023-0288';
        const document = await cacheFunction(fetchAndParseDocument, documentId);

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