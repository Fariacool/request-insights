# Upstream synchronization runbook

This procedure is intentionally review-driven. An agent may prepare an update, but must not publish
or silently accept changed classifications.

## 1. Establish the baseline

1. Require a clean worktree and create a branch named `codex/upstream-<component>-YYYYMMDD`.
2. Read `upstream/manifest.json`, `UPSTREAM.md`, and the latest changelog entry.
3. Run `pnpm validate` before changing anything. Stop and report pre-existing failures.
4. Run `pnpm upstream:check` and save its output in the pull-request description, not in the repo.

## 2. Review the source change

### OpenPanel

Compare the recorded commit with upstream `main`, limited initially to `monitoredPaths` from the
manifest. Inspect callers when any monitored symbol changed. Classify each change as UA behavior,
referrer behavior/data, URL/UTM behavior, tests only, dependency/security, or unrelated.

Do not replace local public types or adapters wholesale. Port the smallest behavior change and add
its upstream test or an equivalent regression test. Preserve attribution comments. A license change,
file disappearance, or unexpected generated-data source is a mandatory human-review stop.

### UAParser.js

Read the official changelog, release notes, security advisories, license, and type definitions. Pin
the exact reviewed version in both `package.json` and `upstream/manifest.json`. Regenerate the
lockfile. Do not use a range or `latest` in committed metadata.

### Snowplow referers

Run `pnpm upstream:sync-referrers --latest`. The script resolves the mutable 5.3 feed to the matching
immutable date-stamped snapshot, verifies both bodies match, records the SHA-256, normalizes
`chatbot` to `ai`, applies OpenPanel extras, and regenerates the bundled map.

## 3. Produce a behavior report

Before accepting the update, report:

- upstream old and new versions, commits, dates, URLs, hashes, and licenses;
- added, removed, renamed, and reclassified referrer domains;
- UA fixtures whose device, brand, model, browser, or OS result changed;
- UTM precedence, same-domain, malformed-input, and null-shape changes;
- dependency and package-size differences;
- whether the change is patch, minor, or major and why.

Unexpected removals, large reclassification sets, output schema changes, or weaker security require
human approval before continuing.

## 4. Update durable records

1. Update `upstream/manifest.json` first.
2. Update the table in `UPSTREAM.md` and relevant entries in `THIRD_PARTY_NOTICES.md`.
3. Add or update tests for every intentional behavior difference.
4. Add a Changeset and describe user-visible classification changes.
5. Never store credentials, tokens, request samples containing personal data, or mutable `latest`
   URLs as the release's reproducibility source.

## 5. Verify and hand off

Run, in order:

```sh
pnpm upstream:sync-referrers
pnpm validate
pnpm pack
```

Install the tarball into a fresh temporary ESM and CommonJS consumer and call
`parseRequestInsights`. Confirm `upstreamVersions` matches the manifest. Attach the behavior report
to the pull request. Merge only after CI and required human review pass; release in a separate step.
