# Contributing

Install Node.js from `.nvmrc`, enable Corepack, and run `pnpm install`.

Before opening a pull request:

```sh
pnpm validate
pnpm audit:prod
```

Add tests for every behavior change and a Changeset for every user-visible API, parsing, dependency,
or referrer-data change. Upstream-related work must follow `docs/upstream-sync.md` and update
`upstream/manifest.json` together with the human-readable provenance documents.

Do not include real request URLs, referrers, User-Agents containing application identifiers, access
tokens, or other sensitive production data in fixtures.
