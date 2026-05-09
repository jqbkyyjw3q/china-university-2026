import assert from 'node:assert/strict';
import test from 'node:test';
import { readFile } from 'node:fs/promises';

test('site source exposes all requested research sections', async () => {
  const app = await readFile(new URL('../src/App.tsx', import.meta.url), 'utf8');

  assert.match(app, /官方基准表/);
  assert.match(app, /学校级数据库/);
  assert.match(app, /2026 招生跟踪/);
  assert.match(app, /图表、地图和结论/);
  assert.match(app, /最近10年/);
  assert.match(app, /本科入学/);
  assert.match(app, /硕士毕业/);
  assert.match(app, /博士入学/);
  assert.match(app, /专业大致人数/);
  assert.match(app, /3167/);
  assert.match(app, /489\.97/);
});
