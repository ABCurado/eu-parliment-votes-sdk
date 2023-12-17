# eu-parliment-votes-sdk 

This is a project that aims to simply the access to EU parliment data.  
The data is open but certain API's only return html or pdf which is not often the easiest format for developers to build on top of.   
The goal of this package is to simplify this and return everything as simple method call.    



## Objects

``` javascript

    export interface Proposal {
        ID: string; // ID of the proposal
        title: string; // Title of the proposal
        votes: Array<Vote>; // List of votes on the proposal
        finalVote: number; // Index of the final vote in the votes array
    }

    export interface Vote {
        proposalID: string; // ID of the proposal, a proposal can have many votes
        title: string; // Title of the vote and the ammendment if applicable
        voteResults: VoteResults
    };

    // Parses the mep names into mep ids
    export type VoteResults = {
        positive: number[];
        negative: number[];
        abstention: number[];
        notVoted: number[];
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


#### Future

This section contains concepts of the eu parliment vote to further extend this project:  
- [ ] Videos from the plenary
- [ ] Transcripts from the plenary
- [ ] Information about the development of the proposals