# request-insights

Deterministic, null-safe request metadata parsing for server-side JavaScript. It turns a User-Agent,
request URL, and Referer header into device, browser, operating system, referrer, and UTM insights.

The attribution behavior is derived from OpenPanel, with two deliberate upstream improvements:

- UAParser.js is pinned to a reviewed release instead of following OpenPanel's lockfile.
- Snowplow's actively maintained referers 5.3 database is shipped as an immutable snapshot.

Snowplow's `chatbot` referrer category is normalized to the broader public category `ai`. No network
request is performed while parsing.

## Install

```sh
pnpm add request-insights
```

This package is licensed under AGPL-3.0-or-later. Review the license obligations before using it in
a network service.

## Usage

```ts
import { parseRequestInsights } from 'request-insights';

const insights = parseRequestInsights({
  userAgent: request.headers.get('user-agent'),
  requestUrl: request.url,
  // HTTP intentionally spells this header "Referer".
  referrer: request.headers.get('referer'),
});
```

Example result:

```json
{
  "isServer": false,
  "device": {
    "type": "mobile",
    "brand": "Apple",
    "model": "iPhone"
  },
  "browser": {
    "name": "Mobile Safari",
    "version": "17.0"
  },
  "os": {
    "name": "iOS",
    "version": "17.0"
  },
  "referrer": {
    "name": "ChatGPT",
    "url": "https://chatgpt.com/c/example",
    "type": "ai"
  },
  "utm": {
    "source": "ChatGPT",
    "medium": "referral",
    "campaign": "launch",
    "term": null,
    "content": null
  }
}
```

All unavailable values are `null`, not empty strings. UTM values retain their original case. A
recognized UTM source has attribution precedence over the Referer header, matching OpenPanel's
behavior, while the raw external referrer URL is still retained.

## Runtime behavior

- Missing or non-browser User-Agents are reported as `isServer: true` and device type `server`.
- Same-host referrers are ignored.
- Unknown external referrers keep their original URL as `name` and `url` without inventing a type.
- Repeated query parameters use their final value, matching OpenPanel.
- Parsing is synchronous and performs no I/O.
- The referrer database is bundled, so it adds to the package size. Keep parsing on the server side
  unless that tradeoff is intentional.

The exact inputs used by a release are available at runtime:

```ts
import { upstreamVersions } from 'request-insights';
```

See [UPSTREAM.md](./UPSTREAM.md) for provenance and the update policy.

## Development

```sh
corepack enable
pnpm install
pnpm validate
```

Commits automatically format and lint staged TypeScript/JavaScript/JSON files. Pushes run the full
validation suite. User-visible parsing or data changes require a Changeset:

```sh
pnpm changeset
```

## Privacy

User-Agent, request URLs, and referrer URLs can contain identifying or sensitive information. This
package does not transmit or persist inputs. Applications should avoid logging full values by
default and should apply their own retention and redaction policies.

## Acknowledgements

This project builds on OpenPanel, UAParser.js, and Snowplow's referer-parser database. See
[THIRD_PARTY_NOTICES.md](./THIRD_PARTY_NOTICES.md) for copyright and license details.
