import { parseNotes } from './study-engine.js';

export function createInitialState() {
  return {
    rawNotes: '',
    passages: [],
    question: '',
    answer: null,
    guide: null,
    quiz: [],
    quizResults: [],
    revision: 0,
    notesError: null,
  };
}

export function replaceNotes(state, rawNotes) {
  const next = {
    ...(state ?? createInitialState()),
    rawNotes,
    passages: [],
    question: '',
    answer: null,
    guide: null,
    quiz: [],
    quizResults: [],
    notesError: null,
    revision: Number.isInteger(state?.revision) ? state.revision + 1 : 1,
  };

  try {
    next.passages = parseNotes(rawNotes);
  } catch (error) {
    next.notesError = error instanceof Error ? error.message : 'These notes could not be read.';
  }

  return next;
}
