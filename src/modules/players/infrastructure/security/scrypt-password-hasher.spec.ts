import { Password } from '../../domain/password.value-object.js';
import { ScryptPasswordHasher } from './scrypt-password-hasher.js';

describe('ScryptPasswordHasher', () => {
  const hasher = new ScryptPasswordHasher();
  const password = Password.create('correct-horse');

  it('stores a salted scrypt hash, not the password (R6, T2)', async () => {
    const hash = await hasher.hash(password);

    expect(hash).toMatch(/^scrypt\$[^$]+\$[^$]+$/);
    expect(hash).not.toContain('correct-horse');
  });

  it('gives a different hash for the same password, because of the salt', async () => {
    expect(await hasher.hash(password)).not.toBe(await hasher.hash(password));
  });

  it('verifies the right password and rejects a wrong one', async () => {
    const hash = await hasher.hash(password);

    expect(await hasher.verify('correct-horse', hash)).toBe(true);
    expect(await hasher.verify('wrong-horse', hash)).toBe(false);
  });

  it('rejects a hash in another format', async () => {
    expect(await hasher.verify('correct-horse', 'plain-text')).toBe(false);
  });
});
