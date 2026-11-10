import { InMemorySeasonQueries } from '../../../infrastructure/in-memory/in-memory-season-queries.js';
import { RaceNotFound } from '../../season.errors.js';
import { GetRaceHandler } from './get-race.handler.js';
import { GetRaceQuery } from './get-race.query.js';

describe('GetRaceHandler', () => {
  it('throws RaceNotFound for an unknown id', async () => {
    const handler = new GetRaceHandler(new InMemorySeasonQueries());

    await expect(handler.execute(new GetRaceQuery('unknown'))).rejects.toThrow(RaceNotFound);
  });
});
