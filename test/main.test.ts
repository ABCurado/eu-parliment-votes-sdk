import { loadVoteWithMeps } from '../src/index'

test('code runs and array is not null', async () => {
  let result = await loadVoteWithMeps();
  expect(result).toBeTruthy();
})

