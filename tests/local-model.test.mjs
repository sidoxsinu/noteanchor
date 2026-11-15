import assert from 'node:assert/strict';
import test from 'node:test';

async function loadModelModule() {
  try {
    return await import('../src/local-model.js');
  } catch (error) {
    if (error.code === 'ERR_MODULE_NOT_FOUND' && error.message.includes('local-model.js')) return {};
    throw error;
  }
}

test('extractAssistantText returns the final assistant content from chat output', async () => {
  const { extractAssistantText } = await loadModelModule();
  assert.equal(typeof extractAssistantText, 'function', 'extractAssistantText should exist before its behavior can be tested');
  const output = [{
    generated_text: [
      { role: 'user', content: 'Make a guide.' },
      { role: 'assistant', content: '{"summary":"Grounded summary"}' },
    ],
  }];

  assert.equal(extractAssistantText(output), '{"summary":"Grounded summary"}');
});

test('extractAssistantText accepts a single returned string and rejects unknown output', async () => {
  const { extractAssistantText } = await loadModelModule();
  assert.equal(typeof extractAssistantText, 'function', 'extractAssistantText should exist before its behavior can be tested');
  assert.equal(extractAssistantText([{ generated_text: 'plain output' }]), 'plain output');
  assert.equal(extractAssistantText([]), null);
  assert.equal(extractAssistantText([{ generated_text: [] }]), null);
});

test('createTimeoutFetch aborts a stalled model request and reports a retryable timeout', async () => {
  const { createTimeoutFetch } = await loadModelModule();
  assert.equal(typeof createTimeoutFetch, 'function', 'createTimeoutFetch should be exported before its behavior can be tested');

  let requestAborted = false;
  const fetchImpl = (_input, init) => new Promise((_resolve, reject) => {
    init.signal.addEventListener('abort', () => {
      requestAborted = true;
      reject(new Error('aborted'));
    }, { once: true });
  });

  const timedFetch = createTimeoutFetch(fetchImpl, 5);
  await assert.rejects(
    timedFetch('https://example.test/model-file'),
    /timed out after 1 second/i,
  );
  assert.equal(requestAborted, true);
});

test('createTimeoutFetch forwards an existing caller abort signal', async () => {
  const { createTimeoutFetch } = await loadModelModule();
  assert.equal(typeof createTimeoutFetch, 'function', 'createTimeoutFetch should be exported before its behavior can be tested');

  const caller = new AbortController();
  const fetchImpl = (_input, init) => new Promise((_resolve, reject) => {
    const rejectOnAbort = () => reject(new Error('caller cancelled'));
    if (init.signal.aborted) rejectOnAbort();
    else init.signal.addEventListener('abort', rejectOnAbort, { once: true });
  });
  const request = createTimeoutFetch(fetchImpl, 1000)('https://example.test/model-file', { signal: caller.signal });
  caller.abort();

  await assert.rejects(request, /caller cancelled/);
});

test('browser CPU fallback explicitly selects the WASM backend', async () => {
  const { readFile } = await import('node:fs/promises');
  const source = await readFile(new URL('../src/local-model.js', import.meta.url), 'utf8');
  assert.match(source, /return pipeline\('text-generation', MODEL_ID, \{ \.\.\.options, device: 'wasm' \}\)/);
});
