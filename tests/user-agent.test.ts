/* Test cases adapted from OpenPanel under AGPL-3.0. See THIRD_PARTY_NOTICES.md. */
import { describe, expect, it } from 'vitest';

import { detectDeviceType, parseUserAgent } from '../src/user-agent.js';

describe('parseUserAgent', () => {
  it('treats an absent user agent as a server event', () => {
    expect(parseUserAgent(null)).toEqual({
      isServer: true,
      device: { type: 'server', brand: null, model: null },
      browser: { name: null, version: null },
      os: { name: null, version: null },
    });
    expect(parseUserAgent()).toEqual(parseUserAgent(null));
  });

  it('parses iPhone and iPad user agents', () => {
    const iphone = parseUserAgent(
      'Mozilla/5.0 (iPhone; CPU iPhone OS 16_5 like Mac OS X) AppleWebKit/605.1.15 (KHTML, like Gecko) Version/16.5 Mobile/15E148 Safari/604.1',
    );
    const ipad = parseUserAgent(
      'Mozilla/5.0 (iPad; CPU OS 16_5 like Mac OS X) AppleWebKit/605.1.15 (KHTML, like Gecko) Version/16.5 Mobile/15E148 Safari/604.1',
    );

    expect(iphone).toMatchObject({
      isServer: false,
      device: { type: 'mobile', brand: 'Apple', model: 'iPhone' },
      browser: { name: 'Mobile Safari', version: '16.5' },
      os: { name: 'iOS', version: '16.5' },
    });
    expect(ipad).toMatchObject({
      device: { type: 'tablet', brand: 'Apple', model: 'iPad' },
      os: { name: 'iOS', version: '16.5' },
    });
  });

  it('recovers an iPadOS version omitted by the base parser', () => {
    expect(
      parseUserAgent(
        'Mozilla/5.0 (iPad; iPadOS 18_0; like Mac OS X) AppleWebKit/605.1.15 (KHTML, like Gecko) Mobile/18.0',
      ).os,
    ).toEqual({ name: 'iOS', version: '18.0' });
  });

  it('parses desktop Chrome without inventing a mobile device', () => {
    const result = parseUserAgent(
      'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/91.0.4472.124 Safari/537.36',
    );
    expect(result).toMatchObject({
      isServer: false,
      device: { type: 'desktop' },
      browser: { name: 'Chrome', version: '91.0.4472.124' },
      os: { name: 'Windows', version: '10' },
    });
  });

  it.each(['Go-http-client/1.0', 'Go Http Client/1.0', 'node-fetch/1.0'])(
    'recognizes the server user agent %s',
    (userAgent) => {
      expect(parseUserAgent(userAgent).isServer).toBe(true);
      expect(parseUserAgent(userAgent).device.type).toBe('server');
    },
  );

  it.each([
    ['App/1.0 (Android 12; Model=POCO X5; Manufacturer=Xiaomi)', 'Xiaomi', 'POCO X5'],
    ['App/1.0 (Android 13; Model=Galaxy S23 Ultra)', 'Samsung', 'Galaxy S23 Ultra'],
    ['App/1.0 (Android 14; Model=Pixel 8 Pro)', 'Google', 'Pixel 8 Pro'],
    ['App/1.0 (Android 13; Model=OnePlus 11; Manufacturer=OnePlus)', 'OnePlus', 'OnePlus 11'],
  ])('extracts app-style device data from %s', (userAgent, brand, model) => {
    expect(parseUserAgent(userAgent)).toMatchObject({
      isServer: false,
      device: { type: 'mobile', brand, model },
    });
  });

  it('returns cached UA results without changing their values', () => {
    const userAgent =
      'Mozilla/5.0 (Linux; Android 13; SM-A505FN) AppleWebKit/537.36 Chrome/120.0.0.0 Mobile Safari/537.36';
    expect(parseUserAgent(userAgent)).toEqual(parseUserAgent(userAgent));
  });
});

describe('detectDeviceType', () => {
  it.each([
    ['Mozilla/5.0 (Linux; Android 10; SM-A505FN) AppleWebKit/537.36', undefined, 'mobile'],
    ['Mozilla/5.0 (Linux; Android 12; SM-T870) AppleWebKit/537.36', undefined, 'tablet'],
    ['', 'Moto G84', 'mobile'],
    ['Mozilla/5.0 (X11; Linux x86_64)', undefined, 'desktop'],
    ['Custom Android Client', undefined, 'mobile'],
  ])('classifies %s', (userAgent, model, expected) => {
    expect(detectDeviceType(userAgent, model)).toBe(expected);
  });
});
