// Run with: node --test   (Node 18+, no dependencies)
import { test } from 'node:test';
import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import vm from 'node:vm';

const html = readFileSync(new URL('../index.html', import.meta.url), 'utf8');
const scripts = [...html.matchAll(/<script>([\s\S]*?)<\/script>/g)].map(m => m[1]);
const headScript = scripts[0];
const markup = html.replace(/<script>[\s\S]*?<\/script>/g, '');

// Runs the pre-paint theme script against a stubbed browser and returns the theme it picks.
function pickTheme({ saved = null, storageThrows = false, osDark = false } = {}) {
  const documentElement = { dataset: { theme: 'light' } };
  const sandbox = {
    document: { documentElement },
    matchMedia: q => ({ matches: osDark && q === '(prefers-color-scheme: dark)' }),
  };
  Object.defineProperty(sandbox, 'localStorage', {
    get() {
      if (storageThrows) throw new Error('SecurityError: storage blocked');
      return { getItem: () => saved };
    },
  });
  vm.runInNewContext(headScript, sandbox);
  return documentElement.dataset.theme;
}

test('a saved valid theme wins over the OS setting', () => {
  assert.equal(pickTheme({ saved: 'walnut', osDark: true }), 'walnut');
});

test('an unknown saved value falls back to the OS setting', () => {
  assert.equal(pickTheme({ saved: 'neon', osDark: true }), 'dark');
  assert.equal(pickTheme({ saved: 'neon' }), 'light');
});

test('blocked localStorage still honours OS dark mode', () => {
  assert.equal(pickTheme({ storageThrows: true, osDark: true }), 'dark');
});

test('both inline scripts parse', () => {
  assert.equal(scripts.length, 2);
  for (const s of scripts) new vm.Script(s);
});

test('ids are unique and every in-page link has a target', () => {
  const ids = [...html.matchAll(/\sid="([^"]+)"/g)].map(m => m[1]);
  assert.deepEqual(ids.filter((id, i) => ids.indexOf(id) !== i), []);
  const idSet = new Set(ids);
  const missing = [...markup.matchAll(/href="#([^"]*)"/g)].map(m => m[1]).filter(h => !idSet.has(h));
  assert.deepEqual(missing, []);
  const labels = [...html.matchAll(/<label[^>]*\sfor="([^"]+)"/g)].map(m => m[1]).filter(f => !idSet.has(f));
  assert.deepEqual(labels, []);
});

test('every element the script looks up exists', () => {
  const ids = new Set([...html.matchAll(/\sid="([^"]+)"/g)].map(m => m[1]));
  const used = [...scripts[1].matchAll(/getElementById\('([^']+)'\)/g)].map(m => m[1]);
  assert.deepEqual(used.filter(id => !ids.has(id)), []);
  assert.match(html, /class="to-top"/);
});

test('the search count text matches the number of chapters', () => {
  // The script hardcodes "14 topics"; adding or removing a chapter must update it.
  const chapters = html.match(/class="chapter"/g).length;
  assert.equal(chapters, 14);
  assert.match(scripts[1], new RegExp(`of ${chapters} topics match`));
});

test('every chapter has a link in each outline', () => {
  const navs = [...html.matchAll(/<nav[^>]*>([\s\S]*?)<\/nav>/g)].map(m => m[1]);
  assert.ok(navs.length >= 1);
  for (const nav of navs)
    for (let i = 0; i < 14; i++) assert.match(nav, new RegExp(`href="#topic-${i}"`));
});

test('no orphaned link remnants (regression for commit a9920e5)', () => {
  for (const bad of [' .</p>', '<p>.</p>', 'See the  and', '<p> includes', 'The  and'])
    assert.ok(!html.includes(bad), `found "${bad}"`);
});
