import { loadJsonFromUrl } from "./util";
import { countryData } from "./country-data";


type Mep = {
    img: string;
    label: string;
    homepage: string;
    account: string;
    citizenship: string;
    hasEmail: string;
    bday: Date;
    age: number;
    country: Country;
    memberships: Array<Membership>;
};

type Country = {
    commonCame: string;
    officialName: string;
    flag: string;
};

type Membership = {
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
export const loadMeps = async (limit: number = 5, term: number = 9): Promise<Meps> => {

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


    const mepsIds = await loadJsonFromUrl(url,  params)
    const meps = await Promise.all(mepsIds.meps.map((mep: { identifier: string; }) => loadMep(mep.identifier)));
    return { meps: meps };
};

// Function that loads detailed information about the meps from the following url `https://data.europarl.europa.eu/person/${mepIdentifier}` and returns it as a json object
export const loadMep = async (mepIdentifier: string): Promise<Mep> => {
    const url = `https://data.europarl.europa.eu/api/v1/meps/${mepIdentifier}`;
    var response = await loadJsonFromUrl(url, {});

    const mep = response["@graph"].filter((property: any) => property["@type"] === "foaf:Person")[0];
    const { img, label, homepage, account, citizenship, hasEmail, bday, hasMembership } = mep;
    const age = new Date().getFullYear() - new Date(bday).getFullYear();
    let countryData: Country = loadCountryDataFromUrl(citizenship);
    let membershipsUrls = await loadMemberships(hasMembership);

    return { img, label, age, homepage, account, citizenship, hasEmail, bday, country: countryData, memberships: membershipsUrls };
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

