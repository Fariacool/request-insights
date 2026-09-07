import { describe, expect, it } from 'vitest';

import { parseRequestUrl } from '../src/url.js';

describe('parseRequestUrl', () => {
  it('extracts all supported UTM parameters without normalizing their values', () => {
    const result = parseRequestUrl(
      'https://example.com/path?utm_source=Google&utm_medium=CPC&utm_campaign=Spring&utm_term=Shoes&utm_content=Hero',
    );
    expect(result.hostname).toBe('example.com');
    expect(result.utm).toEqual({
      source: 'Google',
      medium: 'CPC',
      campaign: 'Spring',
      term: 'Shoes',
      content: 'Hero',
    });
  });

  it('supports URL objects and decoded query values', () => {
    expect(
      parseRequestUrl(new URL('https://example.com/?utm_campaign=hello%20world')).utm.campaign,
    ).toBe('hello world');
  });

  it('uses the final value for repeated parameters like OpenPanel', () => {
    expect(parseRequestUrl('/?utm_source=first&utm_source=last').utm.source).toBe('last');
  });

  it('supports relative paths without claiming a request hostname', () => {
    const result = parseRequestUrl('/landing?utm_medium=email');
    expect(result.hostname).toBeNull();
    expect(result.utm.medium).toBe('email');
  });

  it.each([undefined, null, '', 'not a URL'])('returns empty data for %s', (value) => {
    expect(parseRequestUrl(value)).toEqual({
      hostname: null,
      query: {},
      utm: { source: null, medium: null, campaign: null, term: null, content: null },
    });
  });
});
