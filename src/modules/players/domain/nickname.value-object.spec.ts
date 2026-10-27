import { Nickname } from './nickname.value-object.js';
import { InvalidNickname } from './player.errors.js';

const LENGTH_ERROR = 'Nickname must be 3 to 20 characters long';
const CHARACTERS_ERROR = 'Nickname may contain only letters, digits, "-" and "_"';

describe('Nickname', () => {
  it('removes leading and trailing whitespace (R1)', () => {
    expect(Nickname.create('  JohnDoe  ').value).toBe('JohnDoe');
  });

  it('keeps the letter case as entered (R5)', () => {
    expect(Nickname.create('JoHnDoE').value).toBe('JoHnDoE');
  });

  it.each(['abc', 'a'.repeat(20)])('accepts "%s", which is 3 to 20 characters long (R2)', (raw) => {
    expect(Nickname.create(raw).value).toBe(raw);
  });

  it.each(['ab', 'a'.repeat(21), '', '  ab  '])('rejects "%s", which is not 3 to 20 characters long (R2)', (raw) => {
    expect(() => Nickname.create(raw)).toThrow(InvalidNickname);
    expect(() => Nickname.create(raw)).toThrow(LENGTH_ERROR);
  });

  it.each(['john_doe', 'john-doe', 'JohnDoe97'])('accepts "%s" with letters, digits, "-" and "_" (R3)', (raw) => {
    expect(Nickname.create(raw).value).toBe(raw);
  });

  it.each(['john!', 'john doe', 'jöhn'])('rejects "%s" with other characters (R3)', (raw) => {
    expect(() => Nickname.create(raw)).toThrow(InvalidNickname);
    expect(() => Nickname.create(raw)).toThrow(CHARACTERS_ERROR);
  });
});
