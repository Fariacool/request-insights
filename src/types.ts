export type NullableString = string | null;

export interface DeviceInsights {
  type: NullableString;
  brand: NullableString;
  model: NullableString;
}

export interface BrowserInsights {
  name: NullableString;
  version: NullableString;
}

export interface OsInsights {
  name: NullableString;
  version: NullableString;
}

export interface ReferrerInsights {
  name: NullableString;
  url: NullableString;
  /** Hostname exactly as parsed from the referrer URL, including subdomains such as `www`. */
  hostname: NullableString;
  /** Canonical traffic category. Snowplow's `chatbot` category is normalized to `ai`. */
  type: NullableString;
}

export interface UtmInsights {
  source: NullableString;
  medium: NullableString;
  campaign: NullableString;
  term: NullableString;
  content: NullableString;
}

export interface RequestInsightsInput {
  userAgent?: string | null;
  requestUrl?: string | URL | null;
  referrer?: string | null;
}

export interface RequestInsightsResult {
  isServer: boolean;
  device: DeviceInsights;
  browser: BrowserInsights;
  os: OsInsights;
  referrer: ReferrerInsights;
  utm: UtmInsights;
}

export interface UpstreamVersions {
  openpanel: {
    commit: string;
    checkedAt: string;
  };
  uaParser: {
    version: string;
  };
  referrers: {
    schema: string;
    snapshotDate: string;
    sha256: string;
  };
}
