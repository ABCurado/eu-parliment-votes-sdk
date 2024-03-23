import { countryData } from './country-data'
import { loadJsonFromUrl } from './util'

export interface Mep {
  id: number
  fullName: string
  img: string | undefined
  account: AccountType[] | undefined
  citizenship: string | undefined
  homepage: string | undefined
  email: string | undefined
  party: string | undefined
  bday: Date | undefined
  age: number | undefined
  country: Country | undefined
  memberships: Membership[] | undefined
}

interface AccountType {
  type: string
  url: string
}

interface Country {
  commonCame: string
  officialName: string
  flag: string
}

export interface Membership {
  corporateBody: string | undefined
  role: string
  org: string
  startDate: Date
  // End date is undefined if the mep is still a member of the corporate body
  endDate: Date | undefined
}

export interface Meps {
  meps: Array<Mep>
  term?: number // The term number
  withDetails?: boolean // Whether to load details
  withData?: boolean // Whether to load membership data
}

// TODO: Add a function that loads the mep details from the api
// The parties of the European Parliament.
// Used in parseParty this method is hard coded for now, in the future we can load them from the api dynamically
// Parties also have change their id over time, so we should also to keep track of that int he future
const parties: { [key: string]: string } = {
  '5148': 'ECR',
  '5152': 'NI',
  '5153': 'EPP',
  '5154': 'SD',
  '5155': 'GREEN_EFA',
  '5704': 'RENEW',
  '6259': 'LEFT',
  '5588': 'ID',
}

/**
 * Loads MEPs (Members of the European Parliament) from the specified term.
 * @param limit The maximum number of MEPs to load. Default is 5.
 * @param term The parliamentary term number. Default is 9.
 * @param loadDetails Specifies whether to load additional details for each MEP. Basic is just name and id. Default is false.
 * @param loadMembershipData Specifies whether to load membership data for each MEP. Default is false.
 * @returns A Promise that resolves to an object containing the loaded MEPs, the term number, and the loading options.
 * @throws Error if an invalid term number is provided.
 */
export const loadMeps = async (
  limit: number = 5,
  term: number = 9,
  loadDetails: boolean = false,
  loadMembershipData: boolean = false
): Promise<Meps> => {
  var params: Object = {
    limit: limit,
  }
  let url: string = ''
  if (term > 0 && term < 10) {
    url = `https://data.europarl.europa.eu/api/v1/meps`
    params = {
      limit: limit,
      'parliamentary-term': term,
    }
  } else if (term == 0) {
    url = `https://data.europarl.europa.eu/api/v1/meps/show-current`
  } else {
    throw new Error('Invalid term number')
  }

  const mepsIds = await loadJsonFromUrl(url, params)
  var meps: Array<Mep>
  if (loadDetails) {
    meps = await Promise.all(
      mepsIds.data.map((mep: { identifier: string }) =>
        loadMep(mep.identifier, loadMembershipData)
      )
    )
  } else {
    meps = await mepsIds.data.map((mep: any) => {
      return {
        id: parseInt(mep.identifier),
        fullName: mep.label,
      }
    })
  }

  return {
    meps: meps,
    term: term,
    withDetails: loadDetails,
    withData: loadMembershipData,
  }
}

/**
 * Loads MEP data from the European Parliament API.
 * @param mepIdentifier - The MEP identifier.
 * @param loadMembershipData - Whether to load membership data.
 * @returns A promise that resolves to an object containing MEP data.
 */
export const loadMep = async (
  mepIdentifier: string,
  loadMembershipData: boolean = false
): Promise<Mep> => {
  const url = `https://data.europarl.europa.eu/api/v1/meps/${mepIdentifier}`
  var response = await loadJsonFromUrl(url, {})
  // Cast id to intiger
  const id = parseInt(mepIdentifier)
  if (typeof id !== 'number') {
    throw new Error('Id is not a number')
  }
  const mep = response.data[0]
  const { img, label, homepage, citizenship, hasEmail, bday, hasMembership } =
    mep
  const age = new Date().getFullYear() - new Date(bday).getFullYear()
  let countryData: Country = loadCountryDataFromUrl(citizenship)
  let account: AccountType[] = []
  if (mep.account) {
    account = mep.account.map((account: any) => {
      return {
        type: account.dcterms_type.split('/').pop(),
        url: account.id,
      }
    })
  }
  let memberships: Array<Membership> = []

  if (loadMembershipData) {
    memberships = await loadMemberships(hasMembership)
  } else {
    memberships = hasMembership.map((element: any) => {
      return {
        corporateBody: element.membershipClassification,
        role: element.role,
        org: element.organization,
        startDate: element.memberDuring.startDate,
        endDate: element.memberDuring.endDate,
      }
    })
  }
  let party: string = parseParty(memberships)
  return {
    id,
    img,
    fullName: label,
    age,
    account,
    homepage,
    citizenship,
    email: hasEmail,
    memberships,
    bday,
    party,
    country: countryData,
  }
}

/**
 * Loads country data from a given URL.
 * @param citizenshipUrl The URL of the citizenship.
 * @returns The country data.
 * @throws Error if unable to parse the code from the URL.
 */
export const loadCountryDataFromUrl = (citizenshipUrl: string): Country => {
  let code: string | undefined = citizenshipUrl.split('/').pop()
  if (code === undefined || code.length !== 3) {
    throw new Error('Unable to parse code from ' + citizenshipUrl)
  }

  return loadCountryData(code)
}

/**
 * Loads country data based on the provided 3-digit country code.
 * @param country3DigitCode The 3-digit country code.
 * @returns The country object containing common name, official name, and flag.
 */
const loadCountryData = (country3DigitCode: string): Country => {
  let countryObject = countryData.filter(
    (country) => country.cca3 === country3DigitCode
  )[0]

  return {
    commonCame: countryObject.name.common,
    officialName: countryObject.name.official,
    flag: countryObject.flag,
  }
}

/**
 * Loads memberships from the given URLs.
 *
 * @param membershipsUrls - An array of URLs to load the memberships from.
 * @param limit - The maximum number of memberships to load (default: 3).
 * @returns A promise that resolves to an array of Membership objects.
 */
const loadMemberships = async (
  membershipsUrls: Array<string>,
  limit = 3
): Promise<Membership[]> => {
  const promises = membershipsUrls
    .slice(0, limit)
    .map(async (membershipsUrl): Promise<Membership> => {
      let membership = await loadJsonFromUrl(membershipsUrl, {})
      return parseMembership(membership)
    })
  return await Promise.all(promises)
}

/**
 * Parses a membership document.
 *
 * @param membershipsDocument - The membership document to parse.
 * @returns A Membership object.
 */
export const parseMembership = (membershipsDocument: any): Membership => {
  // The language to use for the prefLabel of the membership
  const lang = 'en'

  // A membership is an array of properties
  let membershipData = membershipsDocument['@graph']
  let corporateBody = membershipData.find((property: any) =>
    property['@type'].includes('euvoc:CorporateBodyClassification')
  )
  let corporateBodyInEnglish: string | undefined = undefined
  if (corporateBody != undefined) {
    corporateBodyInEnglish = corporateBody['prefLabel'].find(
      (label: any) => label['@language'] === lang
    )['@value']
  }
  let role: string = membershipData
    .find((property: any) => property['@type'].includes('euvoc:Role'))
    ['prefLabel'].find((label: any) => label['@language'] === lang)['@value']
  let org: string = membershipData
    .find((property: any) => property['@type'].includes('org:Organization'))
    ['prefLabel'].find((label: any) => label['@language'] === lang)['@value']
  let dates: any = membershipData.find((property: any) =>
    property['@type'].includes('dcterms:PeriodOfTime')
  )
  let startDate: Date = dates['startDate']
  let endDate: Date = dates['endDate']

  return {
    corporateBody: corporateBodyInEnglish,
    role,
    org,
    startDate,
    endDate,
  }
}

/**
 * Parses the party of a MEP.
 *
 *
 * @param memberships - The memberships of the MEP.
 * @returns The party of the MEP.
 */
export const parseParty = (memberships: Array<Membership>): string => {
  const partyMembership = memberships.find(
    (membership: Membership) =>
      membership.corporateBody?.includes('EP_GROUP') &&
      membership.endDate === undefined
  )
  // TODO: To fix party membership when mep has left parliament
  if (partyMembership === undefined) {
    return ''
  }

  const partyId = partyMembership.org?.split('/')?.pop()
  if (!parties[partyId as keyof typeof parties]) {
    throw new Error(`Unknown party ${partyId}`)
  }
  return parties[partyId as keyof typeof parties]
}
