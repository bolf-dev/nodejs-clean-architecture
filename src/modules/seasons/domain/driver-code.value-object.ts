import { InvalidDriverCode } from './season.errors.js';

const CODE_LENGTH = 3;
// Up to three letters, so a short last name like "Li" still gives a code
const VALID_CODE = /^\p{Lu}{1,3}$/u;

/** The three-letter code of a driver, e.g. `VER`. */
export class DriverCode {
  private constructor(readonly value: string) {}

  /** The code of the data source, or the first three letters of the last name in upper case when there is none (R8). */
  static from(code: string | null, lastName: string): DriverCode {
    const value = code || lastName.replace(/\P{L}/gu, '').slice(0, CODE_LENGTH).toUpperCase();
    if (!VALID_CODE.test(value)) {
      throw new InvalidDriverCode(value);
    }
    return new DriverCode(value);
  }
}
