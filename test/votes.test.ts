import { parse, HTMLElement } from 'node-html-parser';
import { parseStringToHTMLArray, parseHTMLVote, parseHTMLToVote, Vote, getVoteList } from '../src/votes'
import fs from 'fs';

const html = fs.readFileSync('./test/example.html', 'utf-8');

test('Code doesn"t crash', () => {
    var result = parseStringToHTMLArray("")
    console.log(result)
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

test('Gets corect vote list', async () => {
    var votes: Array<string> = await getVoteList()
    expect(votes.length).toBeGreaterThan(0);
}, 50000)