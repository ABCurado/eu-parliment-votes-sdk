import { loadJsonFromUrl } from "./util";
import { countryData } from "./country-data";


export type Mep = {
    id: number
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
    memberships: Array<Membership>;
};

type AccountType = {
    type: string;
    url: string;
};

type Country = {
    commonCame: string;
    officialName: string;
    flag: string;
};

export type Membership = {
    corporateBody: string | undefined;
    role: string;
    org: string;
    startDate: Date;
    endDate: Date;
};

type Meps = {
    meps: Array<Mep>;
};

// Create a function that fecthes json data from this endpoint https://data.europarl.europa.eu/api/v1/meps and loads it into a variable called meps
export const loadMeps = async (limit: number = 5, term: number = 9, loadDetails: boolean = false, loadMembershipData: boolean = false): Promise<Meps> => {

    var params: Object = {
        "limit": limit,

    }
    let url: string = "";
    if (term > 0 && term < 10) {
        url = `https://data.europarl.europa.eu/api/v1/meps`;
        params = {
            "limit": limit,
            "parliamentary-term": term
        }
    } else if (term == 0) {
        url = `https://data.europarl.europa.eu/api/v1/meps/show-current`;
    } else {
        throw new Error("Invalid term number");
    }


    const mepsIds = await loadJsonFromUrl(url, params)
    var meps: Array<Mep>
    if (loadDetails) {
        meps = await Promise.all(mepsIds.data.map((mep: { identifier: string; }) => loadMep(mep.identifier, loadMembershipData)));
    } else {
        meps = await mepsIds.data.map((mep: any) => {
            return {
                id: parseInt(mep.identifier),
                fullName: mep.label
            }
        });
    }

    return { meps: meps };
};

/**
 * Loads MEP data from the European Parliament API.
 * @param mepIdentifier - The MEP identifier.
 * @param loadMembershipData - Whether to load membership data.
 * @returns A promise that resolves to an object containing MEP data.
 */
export const loadMep = async (mepIdentifier: string, loadMembershipData: boolean = false): Promise<Mep> => {
    const url = `https://data.europarl.europa.eu/api/v1/meps/${mepIdentifier}`;
    var response = await loadJsonFromUrl(url, {});
    // Cast id to intiger
    const id = parseInt(mepIdentifier);
    const mep = response.data[0];
    const { img, label, homepage, citizenship, hasEmail, bday, hasMembership } = mep;
    const age = new Date().getFullYear() - new Date(bday).getFullYear();
    let countryData: Country = loadCountryDataFromUrl(citizenship);
    let account: AccountType[] = [];
    if (mep.account) {
        account = mep.account.map((account: any) => {
            return {
                type: account.dcterms_type.split("/").pop(),
                url: account.id
            }
        });
    }
    let memberships: Array<Membership> = [];

    if (loadMembershipData) {
        memberships = await loadMemberships(hasMembership);
    } else {
        memberships = hasMembership.map((element: any) => {
            return {
                corporateBody: element.membershipClassification,
                role: element.role,
                org: element.organization,
                startDate: element.memberDuring.startDate,
                endDate: element.memberDuring.endDate
            }
        });
    }
    let party: string = parseParty(memberships);
    return { id, img, fullName: label, age, account, homepage, citizenship, email: hasEmail, memberships, bday, party, country: countryData };
};

export const loadCountryDataFromUrl = (citizenshipUrl: string): Country => {
    let code: string | undefined = citizenshipUrl.split("/").pop();
    if (code === undefined || code.length !== 3) {
        throw new Error("Unable to parse code from " + citizenshipUrl);
    }

    return loadCountryData(code);
}


const loadCountryData = (country3DigitCode: string): Country => {
    let countryObject = countryData.filter((country) => country.cca3 === country3DigitCode)[0];

    return {
        commonCame: countryObject.name.common,
        officialName: countryObject.name.official,
        flag: countryObject.flag
    };
}

const loadMemberships = async (membershipsUrls: Array<string>, limit = 3): Promise<Membership[]> => {
    const promises = membershipsUrls.slice(0, limit).map(async (membershipsUrl): Promise<Membership> => {
        let membership = await loadJsonFromUrl(membershipsUrl, {});
        return parseMembership(membership)
    });
    return await Promise.all(promises);
}

const parseMembership = (membershipsDocument: any): Membership => {
    // The language to use for the prefLabel of the membership
    const lang = "en";

    // A membership is an array of properties
    let membershipData = membershipsDocument["@graph"]
    let corporateBody = membershipData
        .find((property: any) => property["@type"].includes("euvoc:CorporateBodyClassification"))
    let corporateBodyInEnglish: string | undefined = undefined;
    if (corporateBody != undefined) {
        corporateBodyInEnglish = corporateBody['prefLabel']
            .find((label: any) => label["@language"] === lang)["@value"]
    }
    let role: string = membershipData
        .find((property: any) => property["@type"].includes("euvoc:Role"))["prefLabel"]
        .find((label: any) => label["@language"] === lang)["@value"];
    let org: string = membershipData
        .find((property: any) => property["@type"].includes("org:Organization"))["prefLabel"]
        .find((label: any) => label["@language"] === lang)["@value"];
    let dates: any = membershipData
        .find((property: any) => property["@type"].includes("dcterms:PeriodOfTime"));
    let startDate: Date = dates["startDate"];
    let endDate: Date = dates["endDate"];

    return { corporateBody: corporateBodyInEnglish, role, org, startDate, endDate };
}

export const parseParty = (memberships: Array<Membership>): string => {
    const partyMembership = memberships.find((membership: Membership) => membership.corporateBody?.includes("EP_GROUP") && membership.endDate === undefined);
    // TODO: To fix party membership when mep has left parliament
    if (partyMembership === undefined) {
        return "";
    }
    const parties: {[key: string]: string} = {
        "5148": "ECR",
        "5152": "NI",
        "5153": "EPP",
        "5154": "SD",
        "5155": "GREEN_EFA",
        "5704": "RENEW",
        "6259": "LEFT",
        "5588": "ID",        

    };
    const partyId = partyMembership.org?.split("/")?.pop();
    if (!parties[partyId as keyof typeof parties]) {
        throw new Error(`Unknown party ${partyId}`);
    }
    return parties[partyId as keyof typeof parties];
}