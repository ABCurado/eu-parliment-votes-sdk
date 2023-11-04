import { loadVoteWithMeps, VoteResults } from './index';

describe('loadVoteWithMeps', () => {
  it('should return an array of proposals with updated vote properties', async () => {
    const voteRCV = 'PV-9-2022-11-23-RCV';
    const result = await loadVoteWithMeps(voteRCV);

    expect(Array.isArray(result)).toBe(true);
    expect(result.length).toBeGreaterThan(0);

    const proposal = result[0];
    expect(proposal).toHaveProperty('votes');
    expect(Array.isArray(proposal.votes)).toBe(true);

    const vote = proposal.votes[0];
    expect(vote).toHaveProperty('positive');
    expect(vote).toHaveProperty('negative');
    expect(vote).toHaveProperty('abstention');
    expect(Array.isArray(vote.positive)).toBe(true);
    expect(Array.isArray(vote.negative)).toBe(true);
    expect(Array.isArray(vote.abstention)).toBe(true);
  });
});