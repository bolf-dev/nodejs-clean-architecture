import { readFileSync } from 'node:fs';
import { F1DataUnavailable } from '../../application/season.errors.js';
import { JolpicaF1DataProvider } from './jolpica-f1-data-provider.js';

/** Responses of the Jolpica F1 API recorded once with curl, so the test never calls the real API. */
const FIXTURES: Record<string, string> = {
  '/2026.json?limit=100': 'calendar-2026.json',
  '/2026/last/results.json?limit=100': 'latest-results-2026.json',
  '/2026/drivers.json?limit=100': 'drivers-2026.json',
};

function respondWithFixtures(): void {
  vi.spyOn(globalThis, 'fetch').mockImplementation(async (url) => {
    // The adapter calls fetch with a plain string URL
    const path = (url as string).replace('https://api.jolpi.ca/ergast/f1', '');
    const fixture = FIXTURES[path];
    return fixture === undefined
      ? new Response('Not found', { status: 404 })
      : new Response(readFileSync(`test/fixtures/jolpica/${fixture}`));
  });
}

describe('JolpicaF1DataProvider', () => {
  const provider = new JolpicaF1DataProvider();

  beforeEach(respondWithFixtures);
  afterEach(() => vi.restoreAllMocks());

  it('reads the calendar with the session times in UTC (AC1)', async () => {
    const races = await provider.calendar(2026);

    expect(races).toHaveLength(23);
    expect(races[0]).toEqual({
      round: 1,
      name: 'Australian Grand Prix',
      circuit: 'Albert Park Grand Prix Circuit',
      locality: 'Melbourne',
      country: 'Australia',
      sprintQualifyingAt: null,
      qualifyingAt: new Date('2026-03-07T05:00:00Z'),
      raceAt: new Date('2026-03-08T04:00:00Z'),
    });
    expect(races[1]?.sprintQualifyingAt).toEqual(new Date('2026-03-13T07:30:00Z'));
  });

  it('reads the starters of the latest race with their teams (AC3)', async () => {
    const starters = await provider.latestRaceStarters(2026);

    expect(starters).toHaveLength(22);
    expect(starters[0]).toEqual({
      externalId: 'norris',
      code: 'NOR',
      number: 1,
      firstName: 'Lando',
      lastName: 'Norris',
      team: { id: 'mclaren', name: 'McLaren' },
    });
    expect(starters.filter(({ code }) => code === null).map(({ lastName }) => lastName)).toEqual(['Camara']);
  });

  it('reads the drivers of the season, also those without a code or a number', async () => {
    const drivers = await provider.seasonDrivers(2026);

    expect(drivers).toHaveLength(36);
    expect(drivers.filter(({ code, number }) => code !== null && number !== null)).toHaveLength(24);
  });

  it('fails with F1DataUnavailable when the API cannot be reached (R3)', async () => {
    vi.spyOn(globalThis, 'fetch').mockRejectedValue(new TypeError('fetch failed'));

    await expect(provider.calendar(2026)).rejects.toThrow(F1DataUnavailable);
  });
});
