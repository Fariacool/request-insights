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
