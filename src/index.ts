import { loadMeps } from './mep'
import { parseHTMLToVote, Vote } from './votes'
import fs from 'fs';

export const checkNameIsInList = (fullName: string, nameList: string[]): boolean => {
    // Normalize the fullName to remove accents and put in lower case
    const normalizeFullName = fullName.normalize("NFD").replace(/[\u0300-\u036f]/g, "").toLowerCase();
    // Split the full name into individual names
    const names = normalizeFullName.split(' ');
    // Normalize the nameList to remove accents and put in lower case
    const normalizeNameList = nameList.map(name => name.normalize("NFD").replace(/[\u0300-\u036f]/g, "").toLowerCase());

    // Check if any of the names are in the list
    for (const name of names) {
        if (normalizeNameList.includes(name)) {
            return true;
        }
    }

    return false;
}


export const loadVoteWithMeps = async () => {
    const html = fs.readFileSync('./test/assets/individual_votes.html', 'utf-8');
    var votes: Array<Vote> = parseHTMLToVote(html)
    var meps = await loadMeps(2, 0);

    for (const mep of meps.meps) {
        var hasVoted = false;
        for (const vote of votes) {
            console.log(`Total: ${vote.positive.length + vote.negative.length + vote.abstention.length}. ${vote.positive.length} positive votes, ${vote.negative.length} negative votes ${vote.abstention.length} abstentions and  votes for vote: ${vote.title} had `)
            if (checkNameIsInList(mep.fullName, vote.positive)) {
                //console.log(`MEP: ${mep.id.toString()}(${mep.fullName}) has voted positive in vote: ${vote.title}(${vote.titleID})`)
                hasVoted = true;
            }
            if (checkNameIsInList(mep.fullName, vote.negative)) {
                //console.log(`MEP: ${mep.id.toString()}(${mep.fullName}) has voted negative in vote: ${vote.title}(${vote.titleID})`)
                hasVoted = true;
            }
            if (checkNameIsInList(mep.fullName, vote.abstention)) {
                //console.log(`MEP: ${mep.id.toString()}(${mep.fullName}) has abstained in vote: ${vote.title}(${vote.titleID})`)
                hasVoted = true;
            } else {
                //console.log(`MEP: ${mep.id.toString()}(${mep.fullName}) has not voted in vote: ${vote.title}(${vote.titleID})`)
            }
        }
        //console.log(`MEP: ${mep.id.toString()}(${mep.fullName}) voted? ${hasVoted}`)
    }
    return true;
}

loadVoteWithMeps();
