import assert from 'node:assert/strict';
import { readFile } from 'node:fs/promises';
import test from 'node:test';

async function readOrEmpty(path) {
  try {
    return await readFile(new URL(path, import.meta.url), 'utf8');
  } catch (error) {
    if (error.code === 'ENOENT') return '';
    throw error;
  }
}

test('entry page provides accessible note, question, study-action, and output controls', async () => {
  const html = await readOrEmpty('../index.html');
  for (const control of [
    'id="notes-input"',
    'id="upload-input"',
    'id="question-input"',
    'id="answer-button"',
    'id="guide-button"',
    'id="quiz-button"',
    'id="load-sample-button"',
    'id="output-region"',
  ]) {
    assert.ok(html.includes(control), `index.html should include ${control}`);
  }
  assert.match(html, /aria-live="polite"/);
});

test('study actions start disabled until usable notes are added', async () => {
  const html = await readOrEmpty('../index.html');
  for (const id of ['answer-button', 'guide-button', 'quiz-button']) {
    const button = html.match(new RegExp(`<button\\b[^>]*\\bid="${id}"[^>]*>`));
    assert.ok(button, `index.html should include button ${id}`);
    assert.match(button[0], /\sdisabled(?:\s|>|=)/, `${id} should be disabled on an empty page`);
  }
});

test('the guide warning says quote matching does not verify claim support', async () => {
  const html = await readOrEmpty('../index.html');
  assert.match(html, /quote matches are checked; claim support is not verified/i);
});

test('dynamic study content is written as text, not parsed as HTML', async () => {
  const source = await readOrEmpty('../src/main.js');
  assert.match(source, /\.textContent\s*=/);
  assert.doesNotMatch(source, /\.innerHTML\s*=/);
});
