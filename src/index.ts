import manifest from '../upstream/manifest.json' with { type: 'json' };

export { parseRequestInsights } from './parse-request-insights.js';
export { parseReferrer } from './referrer.js';
export type {
  BrowserInsights,
  DeviceInsights,
  OsInsights,
  ReferrerInsights,
  RequestInsightsInput,
  RequestInsightsResult,
  UpstreamVersions,
  UtmInsights,
} from './types.js';
export { parseRequestUrl } from './url.js';
export { detectDeviceType, parseUserAgent } from './user-agent.js';

export const upstreamVersions = {
  openpanel: {
    commit: manifest.openpanel.commit,
    checkedAt: manifest.openpanel.checkedAt,
  },
  uaParser: {
    version: manifest.uaParser.version,
  },
  referrers: {
    schema: manifest.referrers.schema,
    snapshotDate: manifest.referrers.snapshotDate,
    sha256: manifest.referrers.sha256,
  },
} as const;
