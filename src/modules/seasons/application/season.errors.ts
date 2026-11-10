import { NotFoundError } from '../../../shared/domain/errors.js';

/** The F1 data source cannot be reached or returns data the app cannot read (R3). */
export class F1DataUnavailable extends Error {}

export class RaceNotFound extends NotFoundError {
  constructor(raceId: string) {
    super(`Race "${raceId}" not found`);
  }
}
