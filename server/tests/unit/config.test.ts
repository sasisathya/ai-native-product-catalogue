import { describe, expect, it } from 'vitest';
import { loadConfig } from '../../src/config/config.js';

describe('loadConfig', () => {
  it('accepts exactly five configurable, distinct featured IDs', () => {
    const config = loadConfig({ FEATURED_PRODUCT_IDS: '8,3,12,5,1', PORT: '4100' });
    expect(config.featuredProductIds).toEqual([8, 3, 12, 5, 1]);
    expect(config.port).toBe(4100);
  });

  it.each(['1,2,3,4', '1,2,3,4,4', '1,2,3,4,0', '1,2,3,4,abc', '1,2,3,4,9007199254740992'])('rejects invalid featured product IDs: %s', (ids) => {
    expect(() => loadConfig({ FEATURED_PRODUCT_IDS: ids })).toThrow(/exactly five distinct positive integers/);
  });

  it('rejects invalid ports and non-positive provider timeouts', () => {
    expect(() => loadConfig({ PORT: '70000' })).toThrow(/PORT/);
    expect(() => loadConfig({ PROVIDER_TIMEOUT_MS: '0' })).toThrow(/PROVIDER_TIMEOUT_MS/);
    expect(() => loadConfig({ PROVIDER_TIMEOUT_MS: '999999999999' })).toThrow(/PROVIDER_TIMEOUT_MS/);
  });

  it('selects console email by default and supports SMTP environment configuration', () => {
    expect(loadConfig({}).email).toEqual({ adapter: 'console' });
    expect(loadConfig({
      EMAIL_ADAPTER: 'smtp', SMTP_HOST: 'mail.example.test', SMTP_PORT: '465', SMTP_SECURE: 'true',
      EMAIL_FROM: 'catalogue@example.test', EMAIL_TO: 'sales@example.test',
    }).email).toEqual({
      adapter: 'smtp', host: 'mail.example.test', port: 465, secure: true,
      from: 'catalogue@example.test', to: 'sales@example.test',
    });
  });

  it('rejects SMTP mode without the required destination configuration', () => {
    expect(() => loadConfig({ EMAIL_ADAPTER: 'smtp' })).toThrow(/SMTP_HOST, EMAIL_FROM, and EMAIL_TO/);
    expect(() => loadConfig({ EMAIL_ADAPTER: 'unknown' })).toThrow(/EMAIL_ADAPTER/);
  });
});
