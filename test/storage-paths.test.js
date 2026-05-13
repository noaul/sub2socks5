import assert from 'node:assert/strict';
import test from 'node:test';
import { access, readFile } from 'node:fs/promises';
import { join } from 'node:path';
import { publicDir, projectDir } from '../src/lib/storage.js';

test('source mode resolves public assets relative to src directory when started from project root', async () => {
  assert.equal(projectDir, process.cwd());
  assert.equal(publicDir, join(process.cwd(), 'src', 'public'));
  await access(join(publicDir, 'index.html'));
});

test('server static asset handling has no local debug file logging', async () => {
  const source = await readFile(new URL('../src/server.js', import.meta.url), 'utf8');

  assert.doesNotMatch(source, /appendFileSync as _appendLog/);
  assert.doesNotMatch(source, /s5debug\.log/);
});
