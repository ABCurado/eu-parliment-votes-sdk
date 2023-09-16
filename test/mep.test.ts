import { loadMeps, loadCountryDataFromUrl } from '../src/mep'

test('code runs and array is not null', async () => {
  let meps = await loadMeps(2, 9);
  expect(meps.meps).toHaveLength(2);
}, 50000)



test('code runs for lastest meps and array is not null', async () => {
  let meps = await loadMeps(2, 0);
  expect(meps.meps).toHaveLength(2);
}, 50000)


test('Invalid citizenship country url', () => {
    try {
      loadCountryDataFromUrl("https://invalid-url");
    } catch (e) {
      expect(e).toBeInstanceOf(Error);
    }
})

test('Invalid mandate', async () => {
  try {
    await loadMeps(2, 20);
  } catch (e) {
    expect(e).toEqual(new Error("Invalid term number"));
  }
}, 50000)
