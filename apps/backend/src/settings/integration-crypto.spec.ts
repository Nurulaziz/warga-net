import { decryptIntegrationValue, encryptIntegrationValue, maskSecret } from './integration-crypto';

describe('integration crypto', () => {
  const previousKey = process.env.INTEGRATION_SETTINGS_KEY;

  beforeAll(() => {
    process.env.INTEGRATION_SETTINGS_KEY = 'test-only-master-key-with-sufficient-entropy';
  });

  afterAll(() => {
    if (previousKey === undefined) delete process.env.INTEGRATION_SETTINGS_KEY;
    else process.env.INTEGRATION_SETTINGS_KEY = previousKey;
  });

  it('mengenkripsi dengan nonce acak dan dapat mendekripsi', () => {
    const first = encryptIntegrationValue('secret-value');
    const second = encryptIntegrationValue('secret-value');
    expect(first).not.toBe(second);
    expect(first).not.toContain('secret-value');
    expect(decryptIntegrationValue(first)).toBe('secret-value');
  });

  it('tidak menampilkan rahasia utuh pada mask', () => {
    expect(maskSecret('SB-Mid-server-example-1234')).toBe('SB-M••••••••1234');
  });
});
