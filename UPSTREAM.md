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
# Read-only network check. Exits non-zero when review is required.
pnpm upstream:check

# Rebuild from the already recorded immutable snapshot.
pnpm upstream:sync-referrers

# Resolve the active 5.3 feed to its immutable date snapshot and update the manifest.
pnpm upstream:sync-referrers --latest
```

The final command changes tracked files and must only be run on an update branch. Follow
[`docs/upstream-sync.md`](./docs/upstream-sync.md) for the complete agent and reviewer workflow.
