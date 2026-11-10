import { ValidationError } from '../../../shared/domain/errors.js';

export class PodiumDriversNotDifferent extends ValidationError {
  constructor() {
    super('P1, P2 and P3 must be three different drivers');
  }
}

export class DriverNotInSeason extends ValidationError {
  constructor(code: string, season: number) {
    super(`Driver "${code}" is not a driver of the ${season} season`);
  }
}
