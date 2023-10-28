import { parse, HTMLElement } from 'node-html-parser';
import { parseStringToHTMLArray, parseHTMLVote, parseHTMLToVote, Vote, getVoteList, getVotesFromRCV } from '../src/votes'
import { cacheFunction } from '../src/util'

import fs from 'fs';

const html = fs.readFileSync('./test/assets/individual_votes.html', 'utf-8');

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

test('Parses correctly votes', () => {
    // Read file called example.html into a string var using javascript
    var votes: Array<Vote> = parseHTMLToVote(html)
    expect(votes.length).toBe(30);
})

test('Gets corect vote list for 5', async () => {
    var votes: Array<string> = await getVoteList(5)
    expect(votes.length).toBe(5);
}, 50000)

test('Parse vote from list', async () => {
    var votes: Array<string> = await getVoteList(500)
    // sort the votes variable that is a string array

    votes.sort();
    const last_vote = votes[votes.length - 5];
    var result: Array<Vote> = await getVotesFromRCV(last_vote)
    expect(result.length).toBeGreaterThan(0);
}, 50000)

describe('getVoteList', () => {
    it('should return an array of vote identifiers', async () => {
      const votes = await cacheFunction(getVoteList,500);
      expect(Array.isArray(votes)).toBe(true);
      expect(votes.length).toBeGreaterThan(400);
      expect(typeof votes[0]).toBe('string');
    });
  
    it('should throw an error if limit is not a positive number', async () => {
        await expect(getVoteList(-1)).rejects.toThrow('Invalid limit');
        await expect(getVoteList(null as any)).rejects.toThrow('Invalid limit');
        await expect(getVoteList(undefined as any)).rejects.toThrow('Invalid limit');
    });
  });
