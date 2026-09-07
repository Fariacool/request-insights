import { describe, expect, it } from 'vitest';

import { parseRequestInsights, upstreamVersions } from '../src/index.js';

describe('parseRequestInsights', () => {
  it('composes UA, referrer, and UTM insights in one stable result', () => {
    expect(
      parseRequestInsights({
        userAgent:
          'Mozilla/5.0 (iPhone; CPU iPhone OS 17_0 like Mac OS X) AppleWebKit/605.1.15 Version/17.0 Mobile/15E148 Safari/604.1',
        requestUrl:
          'https://product.example/welcome?utm_source=ChatGPT&utm_medium=referral&utm_campaign=launch&utm_term=analytics&utm_content=answer',
        referrer: 'https://chatgpt.com/c/123/',
      }),
    ).toEqual({
      isServer: false,
      device: { type: 'mobile', brand: 'Apple', model: 'iPhone' },
      browser: { name: 'Mobile Safari', version: '17.0' },
      os: { name: 'iOS', version: '17.0' },
      referrer: { name: 'ChatGPT', type: 'ai', url: 'https://chatgpt.com/c/123' },
      utm: {
        source: 'ChatGPT',
        medium: 'referral',
        campaign: 'launch',
        term: 'analytics',
        content: 'answer',
      },
    });
  });

  it('returns a complete null-safe shape for a server event', () => {
    expect(parseRequestInsights({})).toEqual({
      isServer: true,
      device: { type: 'server', brand: null, model: null },
      browser: { name: null, version: null },
      os: { name: null, version: null },
      referrer: { name: null, type: null, url: null },
      utm: { source: null, medium: null, campaign: null, term: null, content: null },
    });
  });

  it('exposes the exact upstream versions used by the build', () => {
    expect(upstreamVersions).toMatchObject({
      uaParser: { version: '2.0.10' },
      referrers: { schema: '5.3', snapshotDate: '2026-08-27' },
    });
    expect(upstreamVersions.openpanel.commit).toHaveLength(40);
    expect(upstreamVersions.referrers.sha256).toHaveLength(64);
  });
});
