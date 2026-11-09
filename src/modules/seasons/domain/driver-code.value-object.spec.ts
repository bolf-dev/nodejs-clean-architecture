import { DriverCode } from './driver-code.value-object.js';

describe('DriverCode', () => {
  it('is the code of the data source', () => {
    expect(DriverCode.from('VER', 'Verstappen').value).toBe('VER');
  });

  it('is the first three letters of the last name in upper case when the source has none (R8)', () => {
    expect(DriverCode.from(null, 'Doe-Smith').value).toBe('DOE');
    expect(DriverCode.from(null, 'de Vries').value).toBe('DEV');
  });
});
