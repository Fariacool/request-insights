import { createHash } from 'node:crypto';
import process from 'node:process';

import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';

import recordedManifest from '../upstream/manifest.json' with { type: 'json' };

const { readFile } = vi.hoisted(() => ({ readFile: vi.fn() }));
vi.mock('node:fs/promises', () => ({ readFile }));

const referrerBody = '{}';
const exited = new Error('check completed');
let manifest: {
  openpanel: { commit: string; reviewedCommit?: string; monitoredPaths: string[] };
  uaParser: { package: string; version: string };
  referrers: { activeUrl: string; sha256: string; snapshotDate: string };
};
let changedFiles: Array<{ filename: string; status: string }>;
let comparisonUrl: string;
let originalExitCode: typeof process.exitCode;

beforeEach(() => {
  vi.resetModules();
  originalExitCode = process.exitCode;
  manifest = structuredClone(recordedManifest);
  manifest.referrers.sha256 = createHash('sha256').update(referrerBody).digest('hex');
  changedFiles = [];
  comparisonUrl = '';
  readFile.mockImplementation(async (filename: string) => {
    if (filename.endsWith('upstream/manifest.json')) return JSON.stringify(manifest);
    if (filename.endsWith('package.json')) {
      return JSON.stringify({ dependencies: { 'ua-parser-js': manifest.uaParser.version } });
    }
    throw new Error(`Unexpected file: ${filename}`);
  });
  vi.stubGlobal('fetch', async (url: string) => {
    if (url === `https://registry.npmjs.org/${manifest.uaParser.package}`) {
      return Response.json({ 'dist-tags': { latest: manifest.uaParser.version } });
    }
    if (url === manifest.referrers.activeUrl) return new Response(referrerBody);
    if (url.startsWith('https://api.github.com/repos/Openpanel-dev/openpanel/compare/')) {
      comparisonUrl = url;
      return Response.json({ files: changedFiles, commits: [] });
    }
    throw new Error(`Unexpected URL: ${url}`);
  });
  vi.spyOn(console, 'log').mockImplementation(() => {});
  vi.spyOn(process, 'exit').mockImplementation(() => {
    throw exited;
  });
});

afterEach(() => {
  process.exitCode = originalExitCode;
  vi.restoreAllMocks();
  vi.unstubAllGlobals();
});

async function runCheck() {
  try {
    await import('../scripts/upstream/check.js');
  } catch (error) {
    if (error !== exited) throw error;
  }
}

describe('upstream review checks', () => {
  it('accepts an already reviewed upstream without advancing source provenance', async () => {
    await runCheck();
    expect(comparisonUrl).toBe(
      `https://api.github.com/repos/Openpanel-dev/openpanel/compare/${manifest.openpanel.reviewedCommit}...main`,
    );
    expect(process.exit).toHaveBeenCalledWith(0);
    expect(console.log).toHaveBeenCalledWith('All recorded upstreams are current.');
    expect(manifest.openpanel.commit).toBe(recordedManifest.openpanel.commit);
  });

  it('uses source provenance when no separate review baseline is recorded', async () => {
    delete manifest.openpanel.reviewedCommit;
    await runCheck();
    expect(comparisonUrl).toBe(
      `https://api.github.com/repos/Openpanel-dev/openpanel/compare/${manifest.openpanel.commit}...main`,
    );
    expect(process.exit).toHaveBeenCalledWith(0);
  });

  it('still flags new monitored changes after the reviewed baseline', async () => {
    changedFiles = [
      { filename: 'packages/common/server/parser-user-agent.ts', status: 'modified' },
    ];
    await runCheck();
    expect(process.exit).not.toHaveBeenCalled();
    expect(process.exitCode).toBe(1);
    expect(console.log).toHaveBeenCalledWith(
      expect.stringContaining('packages/common/server/parser-user-agent.ts (modified)'),
    );
  });
});
