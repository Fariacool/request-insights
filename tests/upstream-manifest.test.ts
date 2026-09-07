import { readFile } from 'node:fs/promises';

import { describe, expect, it } from 'vitest';

import referrers from '../src/generated/referrers.js';
import manifest from '../upstream/manifest.json' with { type: 'json' };

describe('upstream provenance', () => {
  it('keeps the runtime dependency aligned with the recorded version', async () => {
    const packageJson = JSON.parse(
      await readFile(new URL('../package.json', import.meta.url), 'utf8'),
    ) as {
      dependencies: Record<string, string>;
    };
    expect(packageJson.dependencies[manifest.uaParser.package]).toBe(manifest.uaParser.version);
  });

  it('embeds the immutable Snowplow snapshot identity in generated data', async () => {
    const generated = await readFile(
      new URL('../src/generated/referrers.ts', import.meta.url),
      'utf8',
    );
    expect(generated).toContain(`Snowplow snapshot: ${manifest.referrers.snapshotDate}`);
    expect(generated).toContain(`SHA-256: ${manifest.referrers.sha256}`);
    expect(generated).toContain('chatbot is normalized to ai');
    expect(Object.keys(referrers)).toHaveLength(2_589);
    expect(new Set(Object.values(referrers).map((entry) => entry.type))).not.toContain('chatbot');
  });

  it('keeps the human-readable provenance table aligned', async () => {
    const documentation = await readFile(new URL('../UPSTREAM.md', import.meta.url), 'utf8');
    expect(documentation).toContain(manifest.openpanel.commit);
    expect(documentation).toContain(`\`${manifest.uaParser.version}\``);
    expect(documentation).toContain(`snapshot ${manifest.referrers.snapshotDate}`);
    expect(documentation).toContain(manifest.referrers.sha256);
  });
});
