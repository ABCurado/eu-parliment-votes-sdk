import { loadVoteWithMeps, VoteResults } from '../src/index';

describe('loadVoteWithMeps', () => {
  it('should return an object with vote results', async () => {
    const vote = "PV-9-2022-11-23-RCV";
    const results = await loadVoteWithMeps(vote);

    expect(results).toBeDefined();
    expect(Object.keys(results).length).toBeGreaterThan(0);

    const voteResult: VoteResults = results[Object.keys(results)[0]];
    expect(voteResult).toBeDefined();
    expect(voteResult.positive).toBeDefined();
    expect(voteResult.negative).toBeDefined();
    expect(voteResult.abstention).toBeDefined();
    expect(voteResult.notVoted).toBeDefined();
  });
  it('should return an object with positive, negative, abstention, and notVoted arrays for each vote', async () => {
    const voteResults = await loadVoteWithMeps('PV-9-2023-06-01-RCV');
    expect(Object.keys(voteResults)).toContain('C9-0161/2023');
    const exampleVoteResults: VoteResults = voteResults['C9-0161/2023'];
    expect(exampleVoteResults.positive.length).toBeGreaterThan(0);
    expect(exampleVoteResults.negative.length).toBeGreaterThan(0);
    expect(exampleVoteResults.abstention.length).toBeGreaterThan(0);
    expect(exampleVoteResults.notVoted.length).toBeGreaterThan(0);
  });
});