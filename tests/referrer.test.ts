/* Test cases adapted from OpenPanel under AGPL-3.0. See THIRD_PARTY_NOTICES.md. */
import { describe, expect, it } from 'vitest';

import { parseReferrer } from '../src/referrer.js';

describe('parseReferrer', () => {
  it('classifies known referrers and strips trailing slashes', () => {
    expect(parseReferrer('https://www.google.com/', 'example.com', {})).toEqual({
      name: 'Google',
      type: 'search',
      url: 'https://www.google.com',
    });
  });

  it('normalizes Snowplow chatbot entries to ai', () => {
    expect(parseReferrer('https://beta.character.ai/chat', 'example.com', {}).type).toBe('ai');
  });

  it('lets OpenPanel extras override Snowplow names and types', () => {
    expect(parseReferrer('https://chatgpt.com/', 'example.com', {})).toEqual({
      name: 'ChatGPT',
      type: 'ai',
      url: 'https://chatgpt.com',
    });
  });

  it('preserves unknown and malformed referrers without inventing a type', () => {
    expect(parseReferrer('https://unknown.example/path', 'example.com', {})).toEqual({
      name: 'https://unknown.example/path',
      type: null,
      url: 'https://unknown.example/path',
    });
    expect(parseReferrer('not-a-url', 'example.com', {})).toEqual({
      name: 'not-a-url',
      type: null,
      url: 'not-a-url',
    });
  });

  it('ignores same-domain referrers', () => {
    expect(parseReferrer('https://example.com/previous', 'example.com', {})).toEqual({
      name: null,
      type: null,
      url: null,
    });
  });

  it.each([
    [{ utm_source: 'GoOgLe', ref: 'facebook' }, 'Google', 'search'],
    [{ ref: 'facebook', utm_referrer: 'twitter' }, 'Facebook', 'social'],
    [{ utm_referrer: 'twitter' }, 'Twitter', 'social'],
    [{ utm_source: 'Unknown-Partner' }, 'unknown-partner', null],
  ])('uses campaign-source precedence for %o', (query, name, type) => {
    expect(parseReferrer('https://example.net/', 'example.com', query)).toMatchObject({
      name,
      type,
    });
  });

  it('keeps UTM attribution while removing an internal raw referrer', () => {
    expect(parseReferrer('https://example.com/', 'example.com', { utm_source: 'chatgpt' })).toEqual(
      {
        name: 'ChatGPT',
        type: 'ai',
        url: null,
      },
    );
  });

  it.each([undefined, null, ''])('returns empty attribution for %s', (value) => {
    expect(parseReferrer(value, 'example.com', {})).toEqual({ name: null, type: null, url: null });
  });
});
