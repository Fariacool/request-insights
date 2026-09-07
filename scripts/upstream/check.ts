import { createHash } from 'node:crypto';
import { readFile } from 'node:fs/promises';
import path from 'node:path';
import process from 'node:process';

interface Manifest {
  openpanel: { commit: string; monitoredPaths: string[] };
  uaParser: { package: string; version: string };
  referrers: { activeUrl: string; sha256: string; snapshotDate: string };
}

interface GitHubCompare {
  status?: string;
  files?: Array<{ filename: string; status: string }>;
  commits?: Array<{ sha: string; commit: { message: string } }>;
}

const root = path.resolve(import.meta.dirname, '../..');
const manifest = JSON.parse(
  await readFile(path.join(root, 'upstream/manifest.json'), 'utf8'),
) as Manifest;
const packageJson = JSON.parse(await readFile(path.join(root, 'package.json'), 'utf8')) as {
  dependencies?: Record<string, string>;
};
const headers = {
  'user-agent': 'request-insights-updater/1.0',
  accept: 'application/vnd.github+json',
};
const findings: string[] = [];

async function getJson<T>(url: string): Promise<T> {
  const response = await fetch(url, { headers });
  if (!response.ok) throw new Error(`Unable to fetch ${url}: HTTP ${response.status}`);
  return response.json() as Promise<T>;
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

const comparison = await getJson<GitHubCompare>(
  `https://api.github.com/repos/Openpanel-dev/openpanel/compare/${manifest.openpanel.commit}...main`,
);
const relevantFiles = (comparison.files ?? []).filter((file) =>
  manifest.openpanel.monitoredPaths.includes(file.filename),
);
if (relevantFiles.length > 0) {
  const commitSummary = (comparison.commits ?? [])
    .slice(-10)
    .map((commit) => `${commit.sha.slice(0, 8)} ${commit.commit.message.split('\n')[0]}`)
    .join('; ');
  findings.push(
    `OpenPanel changed ${relevantFiles.map((file) => `${file.filename} (${file.status})`).join(', ')}. Recent commits: ${commitSummary}`,
  );
}

if (findings.length === 0) {
  console.log('All recorded upstreams are current.');
  process.exit(0);
}

console.log(
  ['Upstream updates require review:', ...findings.map((finding) => `- ${finding}`)].join('\n'),
);
process.exitCode = 1;
