import { Email } from './email.value-object.js';
import { InvalidEmail } from './player.errors.js';

describe('Email', () => {
  it('removes leading and trailing whitespace and stores lower case (R1)', () => {
    expect(Email.create('  JohnDoe@Example.COM ').value).toBe('johndoe@example.com');
  });

  it.each(['johndoe@example.com', 'john.doe+f1@mail.example.co.uk'])('accepts "%s" (R2)', (raw) => {
    expect(Email.create(raw).value).toBe(raw);
  });

  it.each(['johndoe', 'john doe@example.com', 'john@example', '@example.com', 'john@@example.com', ''])(
    'rejects "%s" (R2)',
    (raw) => {
      expect(() => Email.create(raw)).toThrow(InvalidEmail);
      expect(() => Email.create(raw)).toThrow('Email is not valid');
    },
  );

  it('accepts 254 characters and rejects 255 (R2)', () => {
    const domain = '@example.com';

    expect(() => Email.create('a'.repeat(254 - domain.length) + domain)).not.toThrow();
    expect(() => Email.create('a'.repeat(255 - domain.length) + domain)).toThrow(InvalidEmail);
  });
});
