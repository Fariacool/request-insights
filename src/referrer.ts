import referrers from './generated/referrers.js';
import type { ReferrerInsights } from './types.js';

type ReferrerEntry = { readonly name: string; readonly type: string };

const EMPTY_REFERRER: ReferrerInsights = {
  name: null,
  type: null,
  url: null,
  hostname: null,
};

function getUrl(value?: string | null): URL | null {
  if (!value) return null;
  try {
    return new URL(value);
  } catch {
    return null;
  }
}

function getEntry(value: string): ReferrerEntry | undefined {
  return (referrers as Readonly<Record<string, ReferrerEntry>>)[value];
}

function matchReferrer(value: string): ReferrerEntry | undefined {
  const normalized = value.toLowerCase();
  return (
    getEntry(normalized) ??
    getEntry(`${normalized}.com`) ??
    Object.values(referrers).find((entry) => entry.name.toLowerCase() === normalized)
  );
}

export function parseReferrer(
  referrer: string | null | undefined,
  requestHostname: string | null,
  query: Readonly<Record<string, string>>,
): ReferrerInsights {
  const referrerUrl = getUrl(referrer);
  const isInternal = Boolean(
    referrerUrl &&
      requestHostname &&
      referrerUrl.hostname.toLowerCase() === requestHostname.toLowerCase(),
  );
  const rawUrl = referrer && !isInternal ? referrer.replace(/\/+$/, '') || null : null;
  const hostname = referrerUrl && !isInternal ? referrerUrl.hostname.toLowerCase() : null;
  const headerMatch = hostname
    ? (getEntry(hostname) ?? getEntry(hostname.replace(/^www\./, '')))
    : undefined;

  // OpenPanel treats explicit campaign source fields as stronger attribution than the Referer header.
  const campaignSource = query.utm_source ?? query.ref ?? query.utm_referrer;
  if (campaignSource) {
    const normalizedSource = campaignSource.toLowerCase();
    const campaignMatch = matchReferrer(normalizedSource);
    return {
      name: campaignMatch?.name ?? normalizedSource,
      type: campaignMatch?.type ?? null,
      url: rawUrl,
      hostname,
    };
  }

  if (!rawUrl) return { ...EMPTY_REFERRER };

  return {
    name: headerMatch?.name ?? rawUrl,
    type: headerMatch?.type ?? null,
    url: rawUrl,
    hostname,
  };
}
