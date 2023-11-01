import { loadMeps } from './mep'
import { getVotesFromRCV,Proposal,Vote } from './votes'
import { cacheFunction } from './util'

const checkNameIsInList = (fullName: string, nameList: string[]): boolean => {
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

export type VoteResults = {
    positive: string[];
    negative: string[];
    abstention: string[];
    notVoted: string[];
};

export const loadVoteWithMeps = async (voteRCV: String) => {
    var proposalVotes: Array<Proposal> = await cacheFunction(getVotesFromRCV, voteRCV);
    var meps = await cacheFunction(loadMeps, 1000, 0);

    var votesResults: { [key: string]: VoteResults } = {};
    for(var proposal of proposalVotes){
        for (var vote of proposal.votes) {
            var voteResults: VoteResults = {
                positive: [],
                negative: [],
                abstention: [],
                notVoted: [],
            };
            for (const mep of meps.meps) {
                if (checkNameIsInList(mep.fullName, vote.positive)) {
                    voteResults.positive.push(mep.id.toString());
                } else if (checkNameIsInList(mep.fullName, vote.negative)) {
                    voteResults.negative.push(mep.id.toString());
                } else if (checkNameIsInList(mep.fullName, vote.abstention)) {
                    voteResults.abstention.push(mep.id.toString());
                } else {
                    voteResults.notVoted.push(mep.id.toString());
                }
            }
            vote.positive = voteResults.positive;
            vote.negative = voteResults.negative;
            vote.abstention = voteResults.abstention;
        }
    }
    return proposalVotes;
};

export { loadMeps, loadMep, Mep } from './mep';
export { getProposalVoteList, getVotesFromRCV, Vote } from './votes';
export { cacheFunction } from './util';
