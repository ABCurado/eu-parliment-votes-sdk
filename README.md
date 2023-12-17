# eu-parliment-votes-sdk 

This is a project that aims to simply the access to EU parliment data.  
The data is open but certain API's only return html or pdf which is not often the easiest format for developers to build on top of.   
The goal of this package is to simplify this and return everything as simple method call.    

## Examples

TODO

## Data Objects

#### Vote information
``` javascript
    export interface DocumentVote {
        ID: string; // ID of the proposal
        title: string; // Title of the porposal
        votes: Array<Vote>; // List of votes on the proposal
        finalVote: number; // Index of the final vote in the votes array
        date?: Date; // Date of the vote
    }

    export interface Vote {
        proposalID: string; // ID of the proposal
        title: string; // Title of the vote and the ammendment if applicable
        result: VoteResults; // Results of the vote
    };

    export interface VoteResults {
        positive: Array<number>; // List of mep ids that voted yes
        negative: Array<number>; // List of mep ids that voted no
        abstention: Array<number>; // List of mep ids that abstained
        noVote: Array<number>; // List of mep ids that did not vote
    };
```

#### Document information
```javascript
    export interface Document {
        id: string;
        content?: string;
        contentRaw: string;
        summary?: Summary;
        type: DocumentType;
        url: string;
    }

    interface Summary {
        summary: string;
        tags: string[];
    }
```

#### Meps Information
``` javascript
    export interface Mep {
        id: number;
        img: string;
        fullName: string;
        account: AccountType[];
        citizenship: string;
        homepage: string;
        email: string;
        party: string;
        bday: Date;
        age: number;
        country: Country;
        memberships: Membership[];
    }

    interface AccountType {
        type: string;
        url: string;
    };

    interface Country  {
        commonCame: string;
        officialName: string;
        flag: string;
    };

    export interface Membership  {
        corporateBody: string | undefined;
        role: string;
        org: string;
        startDate: Date;
        // End date is undefined if the mep is still a member of the corporate body
        endDate: Date | undefined;
    };

    interface Meps  {
        meps: Array<Mep>;
        term?: number; // The term number
        withDetails?: boolean; // Whether to load details
        withData?: boolean; // Whether to load membership data  
    };
```

### Sources of data

Meps Data - https://data.europarl.europa.eu/api/v1/meps/ + custom data enrichment
Document Data - https://www.europarl.europa.eu/doceo/document

#### Extra
Explain the cache function and why it is necessary
Improve error handle to further improve visibility on api's rate limits

#### Future

This section contains concepts of the eu parliment vote to further extend this project:  
- [ ] Videos from the plenary
- [ ] Transcripts from the plenary
- [ ] Information about the development of the proposals