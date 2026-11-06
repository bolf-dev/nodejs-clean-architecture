import { inspect } from 'node:util';
import { Password } from './password.value-object.js';
import { InvalidPassword } from './player.errors.js';

describe('Password', () => {
  it.each(['a'.repeat(8), 'a'.repeat(128)])('accepts a password of %#: 8 to 128 characters (R5)', (raw) => {
    expect(Password.create(raw).reveal()).toBe(raw);
  });

  it.each(['a'.repeat(7), 'a'.repeat(129), ''])('rejects a password of %#: not 8 to 128 characters (R5)', (raw) => {
    expect(() => Password.create(raw)).toThrow(InvalidPassword);
    expect(() => Password.create(raw)).toThrow('Password must be 8 to 128 characters long');
  });

  it('keeps whitespace exactly as entered (R5)', () => {
    expect(Password.create('  correct horse  ').reveal()).toBe('  correct horse  ');
  });

  it('does not show the password in JSON or in logged objects (R6)', () => {
    const password = Password.create('correct-horse');

    expect(JSON.stringify(password)).not.toContain('correct-horse');
    expect(inspect(password)).not.toContain('correct-horse');
  });
});
