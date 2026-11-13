import { createHash } from 'node:crypto';
import process from 'node:process';

import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';

import recordedManifest from '../upstream/manifest.json' with { type: 'json' };

const { readFile, execFile } = vi.hoisted(() => ({ readFile: vi.fn(), execFile: vi.fn() }));
vi.mock('node:fs/promises', () => ({ readFile, mkdir: vi.fn() }));
vi.mock('node:child_process', () => ({ execFile }));

const referrerBody = '{}';
const exited = new Error('check completed');
let manifest: {
  openpanel: {
    repository: string;
    commit: string;
    reviewedCommit?: string;
    monitoredPaths: string[];
  };
  uaParser: { package: string; version: string };
  referrers: { activeUrl: string; sha256: string; snapshotDate: string };
};
let changedFiles: string;
let diffArgs: string[];
let cloneCalls: number;
let mirrorMissing: boolean;
let originalExitCode: typeof process.exitCode;

beforeEach(() => {
  vi.resetModules();
  originalExitCode = process.exitCode;
  manifest = structuredClone(recordedManifest);
  manifest.referrers.sha256 = createHash('sha256').update(referrerBody).digest('hex');
  changedFiles = '';
  diffArgs = [];
  cloneCalls = 0;
  mirrorMissing = false;
  readFile.mockImplementation(async (filename: string) => {
    if (filename.endsWith('upstream/manifest.json')) return JSON.stringify(manifest);
    if (filename.endsWith('package.json')) {
      return JSON.stringify({ dependencies: { 'ua-parser-js': manifest.uaParser.version } });
    }
    throw new Error(`Unexpected file: ${filename}`);
  });
  execFile.mockImplementation(
    (
      _file: string,
      args: string[],
      _options: unknown,
      callback: (error: Error | null, stdout: string, stderr: string) => void,
    ) => {
      const [command, subcommand] = args;
      if (command === 'rev-parse' && subcommand === '--git-dir') {
        if (mirrorMissing) {
          callback(new Error('not a git repository'), '', '');
          return;
        }
        callback(null, '.git\n', '');
        return;
      }
      if (command === 'clone') {
        cloneCalls += 1;
        callback(null, '', '');
        return;
      }
      if (command === 'fetch' || command === 'cat-file') {
        callback(null, '', '');
        return;
      }
      if (command === 'diff') {
        diffArgs = args;
        callback(null, changedFiles, '');
        return;
      }
      if (command === 'log') {
        callback(null, 'abc1234 fix: something\n', '');
        return;
      }
      callback(new Error(`Unexpected git call: ${args.join(' ')}`), '', '');
    },
  );
  vi.stubGlobal('fetch', async (url: string) => {
    if (url === `https://registry.npmjs.org/${manifest.uaParser.package}`) {
      return Response.json({ 'dist-tags': { latest: manifest.uaParser.version } });
    }
    if (url === manifest.referrers.activeUrl) return new Response(referrerBody);
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
    expect(diffArgs).toContain(manifest.openpanel.reviewedCommit);
    expect(diffArgs).toContain('origin/main');
    expect(diffArgs).toContain('packages/shared/src/server/parser-user-agent.ts');
    expect(process.exit).toHaveBeenCalledWith(0);
    expect(console.log).toHaveBeenCalledWith('All recorded upstreams are current.');
    expect(manifest.openpanel.commit).toBe(recordedManifest.openpanel.commit);
  });

  it('uses source provenance when no separate review baseline is recorded', async () => {
    delete manifest.openpanel.reviewedCommit;
    await runCheck();
    expect(diffArgs).toContain(manifest.openpanel.commit);
    expect(process.exit).toHaveBeenCalledWith(0);
  });

  it('clones the local mirror when it is missing', async () => {
    mirrorMissing = true;
    await runCheck();
    expect(cloneCalls).toBe(1);
    expect(process.exit).toHaveBeenCalledWith(0);
  });

  it('still flags new monitored changes after the reviewed baseline', async () => {
    changedFiles = 'M\tpackages/shared/src/server/parser-user-agent.ts\n';
    await runCheck();
    expect(process.exit).not.toHaveBeenCalled();
    expect(process.exitCode).toBe(1);
    expect(console.log).toHaveBeenCalledWith(
      expect.stringContaining('packages/shared/src/server/parser-user-agent.ts (modified)'),
    );
  });
});
