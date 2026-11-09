const CODE_LENGTH = 3;

/** The three-letter code of a driver, e.g. `VER`. */
export class DriverCode {
  private constructor(readonly value: string) {}

  /** The code of the data source, or the first three letters of the last name in upper case when there is none (R8). */
  static from(code: string | null, lastName: string): DriverCode {
    if (code) {
      return new DriverCode(code);
    }
    const letters = lastName.replace(/\P{L}/gu, '');
    return new DriverCode(letters.slice(0, CODE_LENGTH).toUpperCase());
  }
}
