import { Membership, loadCountryDataFromUrl, loadMeps, parseMembership, parseParty } from '../src/mep';

describe('parseMembership', () => {
  it('should parse a membership object', () => {
    const membership = {
      '@graph': [
        {
          '@type': ['euvoc:CorporateBodyClassification'],
          'prefLabel': [
            {
              '@language': 'en',
              '@value': 'Group of the European People\'s Party (Christian Democrats)',
            },
          ],
        },
        {
          '@type': ['euvoc:Role'],
          'prefLabel': [
            {
              '@language': 'en',
              '@value': 'Member',
            },
          ],
        },
        {
          '@type': ['org:Organization'],
          'prefLabel': [
            {
              '@language': 'en',
              '@value': 'Group of the European People\'s Party (Christian Democrats)',
            },
          ],
        },
        {
          '@type': ['dcterms:PeriodOfTime'],
          'startDate': new Date('2019-07-02T00:00:00.000Z'),
          'endDate': undefined,
        },
      ],
    };
    const parsedMembership = parseMembership(membership);
    expect(parsedMembership.corporateBody).toBe('Group of the European People\'s Party (Christian Democrats)');
  });
});

describe('parseParty', () => {
  it('should return the correct party for a given set of memberships', () => {
    const memberships: Membership[] = [
      {
        corporateBody: 'http://data.europa.eu/resource/ep/group/EP_GROUP',
        role: 'Member',
        org: 'http://data.europa.eu/resource/ep/group/5153',
        startDate: new Date('2019-07-02T00:00:00.000Z'),
        endDate: undefined,
      },
      {
        corporateBody: 'http://data.europa.eu/resource/ep/group/EP_GROUP',
        role: 'Member',
        org: 'http://data.europa.eu/resource/ep/group/5155',
        startDate: new Date('2014-07-02T00:00:00.000Z'),
        endDate: new Date('2019-07-02T00:00:00.000Z'),
      },
    ];

    const party = parseParty(memberships);

    expect(party).toEqual('EPP');
  });

  it('should throw an error if the party is unknown', () => {
    const memberships: Membership[] = [
      {
        corporateBody: 'http://data.europa.eu/resource/ep/group/EP_GROUP',
        role: 'Member',
        org: 'http://data.europa.eu/resource/ep/group/1234',
        startDate: new Date('2019-07-02T00:00:00.000Z'),
        endDate: undefined,
      },
    ];

    expect(() => parseParty(memberships)).toThrowError('Unknown party 1234');
  });

  it('should return an empty string if the MEP is not a member of any party', () => {
    const memberships: Membership[] = [
      {
        corporateBody: 'http://data.europa.eu/resource/ep/group/EP_GROUP',
        role: 'Member',
        org: 'http://data.europa.eu/resource/ep/group/5155',
        startDate: new Date('2014-07-02T00:00:00.000Z'),
        endDate: new Date('2019-07-02T00:00:00.000Z'),
      },
    ];

    const party = parseParty(memberships);

    expect(party).toEqual('');
  });
});

test('code runs and array is not null', async () => {
  let meps = await loadMeps(2, 9, true);
  expect(meps.meps).toHaveLength(2);
})


test('code runs for lastest meps and array is not null', async () => {
  let meps = await loadMeps(2, 9);
  expect(meps.meps).toHaveLength(2);
}, 50000)


test('Invalid citizenship country url', () => {
  try {
    loadCountryDataFromUrl("https://invalid-url");
  } catch (e) {
    expect(e).toBeInstanceOf(Error);
  }
})

test('Invalid mandate', async () => {
  try {
    await loadMeps(2, 20);
  } catch (e) {
    expect(e).toEqual(new Error("Invalid term number"));
  }
}, 50000)


describe("loadMeps", () => {
  it("should load 5 meps by default", async () => {
    const result = await loadMeps();
    expect(result.meps.length).toEqual(5);
  });

  it("should load meps for the given parliamentary term", async () => {
    const result = await loadMeps(5, 8);
    expect(result.meps.length).toBeGreaterThan(0);
  });

  it("should load current meps when term is 0", async () => {
    const result = await loadMeps(5, 0);
    expect(result.meps.length).toBeGreaterThan(0);
  });

  it("should throw an error for an invalid term number", async () => {
    await expect(loadMeps(5, 11)).rejects.toThrow("Invalid term number");
  });

  it("should load mep details when loadDetails is true", async () => {
    const result = await loadMeps(200, 0, true);
    expect(result.meps.length).toBeGreaterThan(0);
    expect(result.meps[0].id).toBeDefined();
    expect(result.meps[0].fullName).toBeDefined();
    expect(result.meps[0].account).toBeDefined();
    expect(result.meps[0].citizenship).toBeDefined();
    // TODO: Temporarily not working
    expect(result.meps[0].homepage).toBeDefined();
    expect(result.meps[0].email).toBeDefined();
    expect(result.meps[0].bday).toBeDefined();
    expect(result.meps[0].age).toBeDefined();
    expect(result.meps[0].country).toBeDefined();
    // TODO: To fix memberships
    expect(result.meps[0].memberships).toBeDefined();
  });
});
