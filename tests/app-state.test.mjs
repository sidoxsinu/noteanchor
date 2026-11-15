import assert from 'node:assert/strict';
import test from 'node:test';

async function loadStateModule() {
  try {
    return await import('../src/app-state.js');
  } catch (error) {
    if (error.code === 'ERR_MODULE_NOT_FOUND' && error.message.includes('app-state.js')) return {};
    throw error;
  }
}

test('replaceNotes invalidates answers and quizzes from the previous notes', async () => {
  const { createInitialState, replaceNotes } = await loadStateModule();
  assert.equal(typeof createInitialState, 'function', 'createInitialState should exist before its behavior can be tested');
  assert.equal(typeof replaceNotes, 'function', 'replaceNotes should exist before its behavior can be tested');
  const initial = {
    ...createInitialState(),
    question: 'What does photosynthesis store?',
    answer: { text: 'Old answer', citations: [{ id: 'P01', quote: 'Old notes.' }] },
    guide: { summary: 'Old guide', keyIdeas: [] },
    quiz: [{ question: 'Old question', answer: 'Old answer' }],
    quizResults: [{ submitted: true }],
  };

  const next = replaceNotes(initial, 'Plants use sunlight to make glucose.');

  assert.equal(next.rawNotes, 'Plants use sunlight to make glucose.');
  assert.deepEqual(next.passages, [{ id: 'P01', text: 'Plants use sunlight to make glucose.' }]);
  assert.equal(next.question, '');
  assert.equal(next.answer, null);
  assert.equal(next.guide, null);
  assert.deepEqual(next.quiz, []);
  assert.deepEqual(next.quizResults, []);
  assert.equal(next.revision, initial.revision + 1);
});

test('replaceNotes reports oversized input and clears old evidence', async () => {
  const { createInitialState, replaceNotes } = await loadStateModule();
  assert.equal(typeof createInitialState, 'function', 'createInitialState should exist before its behavior can be tested');
  assert.equal(typeof replaceNotes, 'function', 'replaceNotes should exist before its behavior can be tested');
  const initial = {
    ...createInitialState(),
    answer: { text: 'Stale answer' },
    quiz: [{ question: 'Stale question' }],
  };
  const tooLong = 'x'.repeat(12_001);

  const next = replaceNotes(initial, tooLong);

  assert.equal(next.rawNotes, tooLong);
  assert.deepEqual(next.passages, []);
  assert.match(next.notesError, /12,000/);
  assert.equal(next.answer, null);
  assert.deepEqual(next.quiz, []);
  assert.equal(next.revision, initial.revision + 1);
});
