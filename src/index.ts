import { loadMeps } from './mep'
import { getVotesFromRCV,Proposal,Vote } from './votes'
import { cacheFunction,checkNameIsInList } from './util'

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
    for (var proposal of proposalVotes) {
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
export { getProposalVoteList, getVotesFromRCV, Proposal } from './votes';
export { cacheFunction } from './util';
export { Document, fetchAndParseDocument } from './document';
