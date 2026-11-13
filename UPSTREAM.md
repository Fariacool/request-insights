# Upstream provenance

`upstream/manifest.json` is the machine-readable source of truth. This document explains how those
inputs affect released behavior.

## Current release inputs

| Component | Recorded version | Role | License |
| --- | --- | --- | --- |
| OpenPanel | commit `3060ca10213693cf0385be2713c8743d16733a2b`, checked 2026-09-07 | Attribution composition, UA fallbacks, extra referrers | AGPL-3.0 |
| UAParser.js | `2.0.10` | Browser, OS, and base device parsing | AGPL-3.0-or-later |
| Snowplow referer-parser | schema `5.3`, snapshot 2026-08-27, SHA-256 `889d0235bd5514a3d987962cc3d1c734a7fa9ff570f48e28c8b3e10c72588d68` | Referrer domain database | GPL-3.0 |

The Snowplow source is an immutable date-stamped snapshot. Its original `chatbot` category is
normalized to `ai`, after which OpenPanel's extra-referrer map is applied as the final override.

## OpenPanel review baseline

`openpanel.commit` and `checkedAt` record the source of the derived behavior and remain the values
exposed by `upstreamVersions`. `reviewedCommit` and `reviewedAt` record the latest completed upstream
review. The checker compares upstream `main` against `reviewedCommit`, falling back to `commit` when
no separate review baseline is recorded. A review with no behavior change does not require a release.

### 2026-10-01: issue #7, no port required

- Reviewed commit: `7c4d22ae4b6b20fb08eb5c94a0cd3cfebb3d32ca` (2026-09-28).
- Previous baseline: `3060ca10213693cf0385be2713c8743d16733a2b`.
- [Immutable comparison](https://github.com/Openpanel-dev/openpanel/compare/3060ca10213693cf0385be2713c8743d16733a2b...7c4d22ae4b6b20fb08eb5c94a0cd3cfebb3d32ca),
  reviewed for [issue #7](https://github.com/Fariacool/request-insights/issues/7).
- The only monitored change adds the `./server/share-access` export to
  `packages/common/package.json`. This package does not use that module. UA, referrer, URL/UTM,
  event attribution, and session buffer files are unchanged.
- The OpenPanel `LICENSE.md` blob is unchanged (`0ad25db4bd1d86c452db3f9602ccdbe172438f52`);
  attribution and notices remain applicable.
- No referrer domain additions, removals, renames, or reclassifications; no UA detection, UTM
  precedence, malformed-input, null-shape, public schema, or dependency changes. Runtime output and
  type declarations remain unchanged. Embedded review metadata adds 92 bytes to each ESM/CommonJS
  JavaScript bundle. No parser version bump or Changeset is required.

The security-related titles in the issue are a summary of recent upstream commits, not findings
against this package's derived behavior or dependencies.

### 2026-11-14: repository restructure, no port required

- Reviewed commit: `a5a6eb7d62c9579620ec5e3fbfd4ce760f3d8073` (2026-11-06), 493 commits after the
  previous baseline.
- Previous baseline: `7c4d22ae4b6b20fb08eb5c94a0cd3cfebb3d32ca` (2026-09-28).
- [Immutable comparison](https://github.com/Openpanel-dev/openpanel/compare/7c4d22ae4b6b20fb08eb5c94a0cd3cfebb3d32ca...a5a6eb7d62c9579620ec5e3fbfd4ce760f3d8073).
- Upstream deleted `packages/common` and `apps/worker/src/jobs` and moved every monitored file:

  | Previous path | Current path |
  | --- | --- |
  | `packages/common/server/parser-user-agent.ts` | `packages/shared/src/server/parser-user-agent.ts` |
  | `packages/common/server/parser-user-agent.test.ts` | `packages/core/src/shared/parser-user-agent.test.ts` |
  | `packages/common/server/parse-referrer.ts` | `packages/core/src/shared/parse-referrer.ts` |
  | `packages/common/server/parse-referrer.test.ts` | `packages/core/src/shared/parse-referrer.test.ts` |
  | `packages/common/scripts/get-referrers.ts` | `packages/core/scripts/get-referrers.ts` |
  | `packages/common/src/url.ts` | `packages/shared/src/url.ts` |
  | `packages/db/src/buffers/session-buffer.ts` | `packages/core/src/buffers/session-buffer.ts` |
  | `apps/worker/src/jobs/events.incoming-event.ts` | `packages/core/src/modules/ingest/src/incoming-event-handler.ts` |
  | `packages/common/package.json` | `packages/shared/package.json` |

- Comparing each moved file with its previous path shows no UA, referrer, or URL/UTM behavior change.
  The diffs are formatting and comment removal, equivalent condition rewrites (for example
  `!a && !b` → `!(a || b)`), an explicit return type, and a test-runner switch from `vitest` to
  `bun:test`. `ua-parser-js` stays pinned to `2.0.6` upstream; this package remains on the current
  release, `2.0.10`.
- `parse-referrer.ts` keeps the same `utm_source` → `ref` → `utm_referrer` precedence, the
  `referrers[source]` → `referrers[source.com]` → name lookup fallback, and the same malformed-input
  handling. The ingestion composition still resolves
  `referrerName = utmReferrer?.name || referrer?.name || referrer?.url` and
  `referrerType = utmReferrer?.type || referrer?.type || ''` behind the same same-domain guard.
- `packages/core/src/shared/referrers/index.ts` and the 95-entry extra-referrer map are byte-identical
  to the previous paths, so the bundled referrer data and `upstream/openpanel-extra-referrers.json`
  are unchanged. The OpenPanel `LICENSE.md` blob is unchanged
  (`0ad25db4bd1d86c452db3f9602ccdbe172438f52`).
- New upstream behavior is session/storage modeling this stateless package does not implement:
  session-buffer batching, a 100-group cap, profile-pointer TTLs, session UTM inheritance, and
  merging a client-supplied `__query` under the URL query. Request-level output is unaffected.
- `monitoredPaths` now tracks the current locations so future changes stay visible. `commit`,
  `checkedAt`, and public `upstreamVersions` are unchanged, and `derivedArtifacts` stays pinned to
  the paths at `commit` (`3060ca1`); no parser version bump or Changeset is required.

## Compatibility policy

OpenPanel is a behavioral reference, not a runtime dependency. Relevant upstream behavior is
reimplemented behind this package's own stable, null-safe API. Upstream changes are reviewed rather
than copied blindly.

- Referrer database additions and corrected detections normally produce a patch release.
- A new optional output field normally produces a minor release.
- Removing, renaming, or changing the type or meaning of an output field produces a major release.
- Every update records classification differences in the pull request and changelog.

## Update commands

```sh
# Read-only network check. Refreshes tmp/openpanel and exits non-zero when review is required.
pnpm upstream:check

# Rebuild from the already recorded immutable snapshot.
pnpm upstream:sync-referrers

# Resolve the active 5.3 feed to its immutable date snapshot and update the manifest.
pnpm upstream:sync-referrers --latest
```

The final command changes tracked files and must only be run on an update branch. Follow
[`docs/upstream-sync.md`](./docs/upstream-sync.md) for the complete agent and reviewer workflow.
