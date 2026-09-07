import { parseReferrer } from './referrer.js';
import type { RequestInsightsInput, RequestInsightsResult } from './types.js';
import { parseRequestUrl } from './url.js';
import { parseUserAgent } from './user-agent.js';

export function parseRequestInsights(input: RequestInsightsInput): RequestInsightsResult {
  const userAgent = parseUserAgent(input.userAgent);
  const requestUrl = parseRequestUrl(input.requestUrl);

  return {
    isServer: userAgent.isServer,
    device: userAgent.device,
    browser: userAgent.browser,
    os: userAgent.os,
    referrer: parseReferrer(input.referrer, requestUrl.hostname, requestUrl.query),
    utm: requestUrl.utm,
  };
}
