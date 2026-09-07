import type { UtmInsights } from './types.js';

const EMPTY_UTM: UtmInsights = {
  source: null,
  medium: null,
  campaign: null,
  term: null,
  content: null,
};

export interface ParsedRequestUrl {
  hostname: string | null;
  query: Readonly<Record<string, string>>;
  utm: UtmInsights;
}

function toNullable(value: string | null): string | null {
  return value === null || value === '' ? null : value;
}

export function parseRequestUrl(input?: string | URL | null): ParsedRequestUrl {
  if (!input) {
    return { hostname: null, query: {}, utm: { ...EMPTY_UTM } };
  }

  try {
    const raw =
      input instanceof URL
        ? input
        : new URL(input, input.startsWith('/') ? 'http://localhost' : undefined);
    const query: Record<string, string> = {};

    // Assignment intentionally makes the final repeated parameter win, matching OpenPanel.
    for (const [key, value] of raw.searchParams) {
      query[key] = value;
    }

    return {
      hostname:
        raw.hostname === 'localhost' && typeof input === 'string' && input.startsWith('/')
          ? null
          : raw.hostname,
      query,
      utm: {
        source: toNullable(query.utm_source ?? null),
        medium: toNullable(query.utm_medium ?? null),
        campaign: toNullable(query.utm_campaign ?? null),
        term: toNullable(query.utm_term ?? null),
        content: toNullable(query.utm_content ?? null),
      },
    };
  } catch {
    return { hostname: null, query: {}, utm: { ...EMPTY_UTM } };
  }
}
