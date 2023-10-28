import { loadMeps } from './mep'
import { getVotesFromRCV } from './votes'
import { cacheFunction } from './util'
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
    var votes = await cacheFunction(getVotesFromRCV, "PV-9-2022-11-23-RCV")
    var meps = await cacheFunction(loadMeps, 1000, 0);

    for (const vote of votes) {
        var results = {
            positive: [] as string[],
            negative: [] as string[],
            abstention: [] as string[],
            notVoted: [] as string[]
        }
        for (const mep of meps.meps) {
            if (checkNameIsInList(mep.fullName, vote.positive)) {
                results.positive.push(mep.id.toString());
            } else if (checkNameIsInList(mep.fullName, vote.negative)) {
                results.negative.push(mep.id.toString());
            } else if (checkNameIsInList(mep.fullName, vote.abstention)) {
                results.abstention.push(mep.id.toString());
            } else {
                results.notVoted.push(mep.id.toString());
            }
        }
        console.log(`Vote: ${vote.title}(${vote.titleID}) has ${results.positive.length} positive votes, ${results.negative.length} negative votes, ${results.abstention.length} abstention votes and ${results.notVoted.length} not voted`)
    }
    return true;
}
