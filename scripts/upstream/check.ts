import { execFile } from 'node:child_process';
import { createHash } from 'node:crypto';
import { mkdir, readFile } from 'node:fs/promises';
import path from 'node:path';
import process from 'node:process';

interface Manifest {
  openpanel: {
    repository: string;
    commit: string;
    reviewedCommit?: string;
    monitoredPaths: string[];
  };
  uaParser: { package: string; version: string };
  referrers: { activeUrl: string; sha256: string; snapshotDate: string };
}

const root = path.resolve(import.meta.dirname, '../..');
const manifest = JSON.parse(
  await readFile(path.join(root, 'upstream/manifest.json'), 'utf8'),
) as Manifest;
const packageJson = JSON.parse(await readFile(path.join(root, 'package.json'), 'utf8')) as {
  dependencies?: Record<string, string>;
};
const headers = { 'user-agent': 'request-insights-updater/1.0' };
const findings: string[] = [];

// Reusable clone; reviews must not depend on the rate-limited GitHub compare API.
const openpanelRepo = process.env.OPENPANEL_REPO ?? path.join(root, 'tmp/openpanel');
const GIT_STATUS: Readonly<Record<string, string>> = {
  A: 'added',
  C: 'copied',
  D: 'removed',
  M: 'modified',
  R: 'renamed',
  T: 'modified',
};

async function getJson<T>(url: string): Promise<T> {
  const response = await fetch(url, { headers });
  if (!response.ok) throw new Error(`Unable to fetch ${url}: HTTP ${response.status}`);
  return response.json() as Promise<T>;
}

function git(args: string[], cwd = openpanelRepo): Promise<string> {
  return new Promise((resolve, reject) => {
    execFile('git', args, { cwd, maxBuffer: 16 * 1024 * 1024 }, (error, stdout) => {
      if (error) reject(error);
      else resolve(stdout.trim());
    });
  });
}

async function refreshOpenpanelMirror(): Promise<void> {
  try {
    await git(['rev-parse', '--git-dir']);
  } catch {
    await mkdir(path.dirname(openpanelRepo), { recursive: true });
    await git(['clone', '--filter=blob:none', manifest.openpanel.repository, openpanelRepo], root);
  }
  await git(['fetch', '--prune', 'origin', 'main']);
}

async function checkOpenpanel(): Promise<void> {
  await refreshOpenpanelMirror();
  const baseline = manifest.openpanel.reviewedCommit ?? manifest.openpanel.commit;
  try {
    await git(['cat-file', '-e', `${baseline}^{commit}`]);
  } catch {
    await git(['fetch', 'origin', baseline]);
  }

  const changed = await git([
    'diff',
    '--name-status',
    baseline,
    'origin/main',
    '--',
    ...manifest.openpanel.monitoredPaths,
  ]);
  const relevantFiles = changed
    .split('\n')
    .filter(Boolean)
    .map((line) => {
      const [status = '', ...paths] = line.split('\t');
      return {
        filename: paths.at(-1) ?? '',
        status: GIT_STATUS[status[0] ?? ''] ?? 'changed',
      };
    });
  if (relevantFiles.length === 0) return;

  const recentCommits = await git([
    'log',
    '--format=%h %s',
    '--max-count=10',
    `${baseline}..origin/main`,
  ]);
  const commitSummary = recentCommits.split('\n').filter(Boolean).reverse().join('; ');
  findings.push(
    `OpenPanel changed ${relevantFiles.map((file) => `${file.filename} (${file.status})`).join(', ')}. Recent commits: ${commitSummary}`,
  );
}

if (packageJson.dependencies?.[manifest.uaParser.package] !== manifest.uaParser.version) {
  findings.push(
    `Local dependency ${manifest.uaParser.package} does not match the recorded ${manifest.uaParser.version}.`,
  );
}

const npmMetadata = await getJson<{ 'dist-tags': { latest: string } }>(
  `https://registry.npmjs.org/${manifest.uaParser.package}`,
);
if (npmMetadata['dist-tags'].latest !== manifest.uaParser.version) {
  findings.push(
    `${manifest.uaParser.package} ${npmMetadata['dist-tags'].latest} is available (recorded ${manifest.uaParser.version}).`,
  );
}

const referrerResponse = await fetch(manifest.referrers.activeUrl, { headers });
if (!referrerResponse.ok)
  throw new Error(`Unable to fetch referrers: HTTP ${referrerResponse.status}`);
const referrerBody = await referrerResponse.text();
const referrerHash = createHash('sha256').update(referrerBody).digest('hex');
if (referrerHash !== manifest.referrers.sha256) {
  findings.push(
    `Snowplow referers 5.3 changed after ${manifest.referrers.snapshotDate} (${manifest.referrers.sha256.slice(0, 12)} -> ${referrerHash.slice(0, 12)}).`,
  );
}

await checkOpenpanel();

if (findings.length === 0) {
  console.log('All recorded upstreams are current.');
  process.exit(0);
}

console.log(
  ['Upstream updates require review:', ...findings.map((finding) => `- ${finding}`)].join('\n'),
);
process.exitCode = 1;
