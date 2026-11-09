import { InvalidPassword } from './player.errors.js';

const MIN_LENGTH = 8;
const MAX_LENGTH = 128;

/**
 * A valid plain password (R5 of spec 004), used exactly as entered.
 * It lives only until the application hashes it. The value is a private field,
 * so it does not show up in JSON or in logged objects (R6).
 */
export class Password {
  readonly #value: string;

  private constructor(value: string) {
    this.#value = value;
  }

  static create(raw: string): Password {
    if (raw.length < MIN_LENGTH || raw.length > MAX_LENGTH) {
      throw new InvalidPassword(`Password must be ${MIN_LENGTH} to ${MAX_LENGTH} characters long`);
    }
    return new Password(raw);
  }

  /** The plain password, only for hashing it. */
  reveal(): string {
    return this.#value;
  }
}
