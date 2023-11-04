import { parse, HTMLElement } from 'node-html-parser';
import { parseStringToHTMLArray, parseHTMLVote, Vote, Proposal, getVotesFromRCV, parseHTMLToProposalVoteArray, getProposalVoteList } from './votes'
import { cacheFunction } from './util'

import fs from 'fs';

const html = fs.readFileSync('./src/test_assets/individual_votes.html', 'utf-8');

test('Code doesn"t crash', () => {
    var result = parseStringToHTMLArray("")
    expect(result).toBeTruthy();
},)

test('Can parse html', () => {
    // Read file called example.html into a string var using javascript

    var result = parseStringToHTMLArray(html)
    expect(result).toBeTruthy();
})

test('Votes not 0', () => {
    // Read file called example.html into a string var using javascript

    var result = parseStringToHTMLArray(html)
    expect(result.length).toBeGreaterThan(0);
})

test('Parse first vote', () => {
    // Read file called example.html into a string var using javascript
    var votes: HTMLElement = parseStringToHTMLArray(html)[1]
    var result: Vote = parseHTMLVote(votes)
    expect(result).toBeTruthy();
})

test('Title is not empty', () => {
    // Read file called example.html into a string var using javascript
    var votes: HTMLElement = parseStringToHTMLArray(html)[1]
    var result: Vote = parseHTMLVote(votes)
    expect(result.title).not.toBe("");
})


test('Positives is not empty', () => {
    // Read file called example.html into a string var using javascript
    var votes: HTMLElement = parseStringToHTMLArray(html)[1]
    var result: Vote = parseHTMLVote(votes)
    expect(result.positive.length).toBeGreaterThan(0);
})

test('Negatives is not empty', () => {
    // Read file called example.html into a string var using javascript
    var votes: HTMLElement = parseStringToHTMLArray(html)[1]
    var result: Vote = parseHTMLVote(votes)
    expect(result.negative.length).toBeGreaterThan(0);
})

test('Gets corect vote list for 5', async () => {
    var votes: Array<string> = await getProposalVoteList(5)
    expect(votes.length).toBe(5);
}, 50000)

test('Parse vote from list', async () => {
    var votes: Array<string> = await getProposalVoteList(500)
    // sort the votes variable that is a string array

    votes.sort();
    const last_vote = votes[votes.length - 5];
    var result: Array<Proposal> = await getVotesFromRCV(last_vote)
    expect(result.length).toBeGreaterThan(0);
}, 50000)

describe('getProposalVoteList', () => {
    it('should return an array of vote identifiers', async () => {
        const votes = await cacheFunction(getProposalVoteList, 500);
        expect(Array.isArray(votes)).toBe(true);
        expect(votes.length).toBeGreaterThan(400);
        expect(typeof votes[0]).toBe('string');
    });

    it('should throw an error if limit is not a positive number', async () => {
        await expect(getProposalVoteList(-1)).rejects.toThrow('Invalid limit');
        await expect(getProposalVoteList(null as any)).rejects.toThrow('Invalid limit');
        await expect(getProposalVoteList(undefined as any)).rejects.toThrow('Invalid limit');
    });
});

describe('getProposalVoteList', () => {
    it('should throw an error if limit is invalid', async () => {
        await expect(getProposalVoteList(null as any)).rejects.toThrow('Invalid limit');
        await expect(getProposalVoteList(undefined as any)).rejects.toThrow('Invalid limit');
        await expect(getProposalVoteList(-1)).rejects.toThrow('Invalid limit');
    });

    it('should return an array of proposal IDs', async () => {
        const result = await getProposalVoteList(10);
        expect(Array.isArray(result)).toBe(true);
        expect(result.length).toBe(10);
    });
});

describe('getVotesFromRCV', () => {
    it('should throw an error if id is invalid', async () => {
        await expect(getVotesFromRCV('')).rejects.toThrow('Invalid id');
        await expect(getVotesFromRCV(undefined as any)).rejects.toThrow('Invalid id');
        await expect(getVotesFromRCV(null as any)).rejects.toThrow('Invalid id');
    });

    it('should return an array of proposals with votes', async () => {
        const result = await getVotesFromRCV('A-9-2023-0288');
        expect(Array.isArray(result)).toBe(true);
        expect(result.length).toBeGreaterThan(0);
        expect(result[0].ID).toBeDefined();
        expect(result[0].votes).toBeDefined();
        expect(result[0].finalVote).toBeDefined();
    });
});
