import { InvalidNickname } from './player.errors.js';

const MIN_LENGTH = 3;
const MAX_LENGTH = 20;
const ALLOWED_CHARACTERS = /^[A-Za-z0-9_-]+$/;

/**
 * A valid nickname. It can only be created through `create()`,
 * so every Nickname instance follows the rules R1 to R3 of spec 002.
 */
export class Nickname {
  private constructor(readonly value: string) {}

  static create(raw: string): Nickname {
    const value = raw.trim();

    if (value.length < MIN_LENGTH || value.length > MAX_LENGTH) {
      throw new InvalidNickname(`Nickname must be ${MIN_LENGTH} to ${MAX_LENGTH} characters long`);
    }
    if (!ALLOWED_CHARACTERS.test(value)) {
      throw new InvalidNickname('Nickname may contain only letters, digits, "-" and "_"');
    }

    return new Nickname(value);
  }
}
