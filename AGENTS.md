# Agent instructions

## Upstream-derived behavior

Before changing UA, referrer, URL, UTM, generated data, dependency versions, or public result types,
read `docs/upstream-sync.md` and `upstream/manifest.json` completely.

- Treat `upstream/manifest.json` as authoritative provenance.
- Never fetch data at runtime or commit a mutable upstream response without an immutable URL and
  SHA-256.
- Normalize Snowplow `chatbot` to the public category `ai`.
- Keep OpenPanel-derived code and test attribution intact.
- Do not silently change public classifications. Add regression fixtures and a Changeset.
- Do not publish automatically as part of an upstream synchronization.
- License changes, unexpected domain removals, and public schema changes require human review.

## Quality gates

Run `pnpm validate` before handoff. Generated referrer data must be reproduced with
`pnpm upstream:sync-referrers`; never edit it manually.
