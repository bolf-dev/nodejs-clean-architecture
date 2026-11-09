import { InvalidEmail } from './player.errors.js';

const MAX_LENGTH = 254;
const FORMAT = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

/**
 * A valid email. It can only be created through `create()`,
 * so every Email instance follows the rules R1 and R2 of spec 004.
 */
export class Email {
  private constructor(readonly value: string) {}

  static create(raw: string): Email {
    const value = raw.trim().toLowerCase();

    if (value.length > MAX_LENGTH || !FORMAT.test(value)) {
      throw new InvalidEmail('Email is not valid');
    }

    return new Email(value);
  }
}
