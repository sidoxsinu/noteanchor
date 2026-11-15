import {
  MAX_NOTE_CHARACTERS,
  buildClozeQuiz,
  buildExtractiveAnswer,
} from './study-engine.js';
import { createInitialState, replaceNotes } from './app-state.js';
import { generateStudyGuide } from './local-model.js';
import './styles.css';

const elementById = (id) => document.getElementById(id);
const ui = {
  notes: elementById('notes-input'),
  upload: elementById('upload-input'),
  count: elementById('notes-count'),
  notesError: elementById('notes-error'),
  question: elementById('question-input'),
  questionForm: elementById('question-form'),
  answerButton: elementById('answer-button'),
  guideButton: elementById('guide-button'),
  quizButton: elementById('quiz-button'),
  sampleButton: elementById('load-sample-button'),
  status: elementById('app-status'),
  output: elementById('output-region'),
};

const SAMPLE_NOTES = [
  'Photosynthesis is the process plants use to convert light energy into stored chemical energy.',
  'Chlorophyll in chloroplasts absorbs light, especially in the blue and red wavelengths.',
  'Light-dependent reactions split water molecules and release oxygen.',
  'These reactions also produce ATP and NADPH, which carry energy to the next stage.',
  'The Calvin cycle uses ATP, NADPH, and carbon dioxide to build sugars.',
].join('\n');

let state = createInitialState();
let quizIndex = 0;
let guideGenerationInProgress = false;

function makeElement(tagName, className = '', text = '') {
  const node = document.createElement(tagName);
  if (className) node.className = className;
  node.textContent = text;
  return node;
}

function setStatus(message, kind = 'neutral') {
  ui.status.textContent = message;
  ui.status.dataset.kind = kind;
}

function renderEmpty(message = 'Start with your notes. Your answer, guide, or quiz will appear here.') {
  ui.output.replaceChildren();
  const empty = makeElement('div', 'empty-state');
  empty.append(makeElement('span', 'empty-index', 'A'));
  empty.append(makeElement('p', '', message));
  ui.output.append(empty);
}

function addCitations(parent, citations) {
  if (!Array.isArray(citations) || citations.length === 0) return;
  const list = makeElement('div', 'source-list');
  for (const citation of citations) {
    const details = document.createElement('details');
    details.className = 'source-item';
    const summary = makeElement('summary', '', `${citation.id} · Source passage`);
    const quote = makeElement('blockquote', '', citation.quote);
    details.append(summary, quote);
    list.append(details);
  }
  parent.append(list);
}

function renderAnswer(answer) {
  ui.output.replaceChildren();
  const card = makeElement('article', 'result-card');
  card.append(makeElement('p', 'result-kicker', answer.supported ? 'Direct evidence match' : 'No supporting passage found'));
  card.append(makeElement('p', 'result-copy', answer.text));
  addCitations(card, answer.citations);
  ui.output.append(card);
}

function renderGuide(guide) {
  ui.output.replaceChildren();
  const card = makeElement('article', 'result-card guide-card');
  card.append(makeElement('p', 'result-kicker', 'Local model · cited draft · verify every claim'));
  card.append(makeElement('h3', 'result-title', 'A short explanation'));
  card.append(makeElement('p', 'result-copy', guide.summary));
  addCitations(card, guide.summaryCitations);
  card.append(makeElement('p', 'model-note', 'Quote matches are checked; they do not prove that each claim follows from the notes. Verify every idea against its source passage.'));

  const ideas = makeElement('div', 'idea-list');
  for (const idea of guide.keyIdeas) {
    const item = makeElement('section', 'idea-item');
    item.append(makeElement('h4', '', idea.title));
    item.append(makeElement('p', '', idea.explanation));
    addCitations(item, idea.citations);
    ideas.append(item);
  }
  card.append(ideas);
  ui.output.append(card);
}

function renderGuideFailure() {
  ui.output.replaceChildren();
  const card = makeElement('article', 'result-card');
  card.append(makeElement('p', 'result-kicker', 'No generated explanation shown'));
  card.append(makeElement('p', 'result-copy', 'The guide could not be validated against your notes. Here are unedited passages you can use instead.'));
  addCitations(card, state.passages.slice(0, 3).map(({ id, text }) => ({ id, quote: text })));
  ui.output.append(card);
}

function renderQuiz() {
  ui.output.replaceChildren();
  if (state.quiz.length === 0) {
    renderEmpty('No clear term could be turned into a recall prompt. Try adding a few complete sentences.');
    return;
  }

  const item = state.quiz[quizIndex];
  const result = state.quizResults[quizIndex];
  const card = makeElement('article', 'result-card quiz-card');
  card.append(makeElement('p', 'result-kicker', `Recall practice · ${quizIndex + 1} of ${state.quiz.length}`));
  card.append(makeElement('h3', 'result-title', item.question));

  if (!result) {
    const form = document.createElement('form');
    form.className = 'quiz-form';
    const label = makeElement('label', '', 'Your answer');
    const input = document.createElement('input');
    input.type = 'text';
    input.autocomplete = 'off';
    input.required = true;
    input.setAttribute('aria-label', 'Your answer to the recall prompt');
    const submit = makeElement('button', 'primary-button', 'Check answer');
    submit.type = 'submit';
    form.append(label, input, submit);
    form.addEventListener('submit', (event) => {
      event.preventDefault();
      const submitted = input.value.trim();
      if (!submitted) return;
      state.quizResults[quizIndex] = {
        correct: submitted.toLocaleLowerCase('en') === item.answer.toLocaleLowerCase('en'),
      };
      renderQuiz();
    });
    card.append(form);
    card.append(makeElement('p', 'answer-hint', 'The source term stays hidden until you check your answer.'));
  } else {
    const message = result.correct
      ? 'Exact term match. Compare it with the passage below.'
      : `Not an exact match. The missing term is “${item.answer}”.`;
    card.append(makeElement('p', result.correct ? 'feedback feedback-good' : 'feedback feedback-review', message));
    card.append(makeElement('p', 'result-copy', item.explanation));
    addCitations(card, item.citations);

    const next = makeElement('button', 'secondary-button next-button', quizIndex + 1 < state.quiz.length ? 'Next prompt' : 'Restart quiz');
    next.type = 'button';
    next.addEventListener('click', () => {
      quizIndex = quizIndex + 1 < state.quiz.length ? quizIndex + 1 : 0;
      if (quizIndex === 0) state.quizResults = [];
      renderQuiz();
    });
    card.append(next);
  }

  ui.output.append(card);
}

function updateNotes() {
  state = replaceNotes(state, ui.notes.value);
  quizIndex = 0;
  ui.count.textContent = `${state.passages.length} ${state.passages.length === 1 ? 'passage' : 'passages'} · ${state.rawNotes.length.toLocaleString('en')} / ${MAX_NOTE_CHARACTERS.toLocaleString('en')}`;
  ui.notesError.textContent = state.notesError ?? '';
  const hasUsableNotes = state.passages.length > 0 && !state.notesError;
  ui.answerButton.disabled = !hasUsableNotes;
  ui.guideButton.disabled = guideGenerationInProgress || !hasUsableNotes;
  ui.quizButton.disabled = !hasUsableNotes;
  renderEmpty();

  if (state.notesError) setStatus(state.notesError, 'error');
  else if (hasUsableNotes) setStatus('Notes updated. Previous results were cleared.', 'success');
  else setStatus('Add notes or load the sample to begin.');
}

ui.notes.addEventListener('input', updateNotes);
ui.sampleButton.addEventListener('click', () => {
  ui.notes.value = SAMPLE_NOTES;
  updateNotes();
  setStatus('Original sample notes loaded.', 'success');
});

ui.upload.addEventListener('change', async () => {
  const file = ui.upload.files?.[0];
  if (!file) return;
  if (!file.name.toLocaleLowerCase('en').endsWith('.txt') && file.type !== 'text/plain') {
    setStatus('Choose a plain-text .txt file.', 'error');
    ui.upload.value = '';
    return;
  }

  try {
    ui.notes.value = await file.text();
    updateNotes();
    setStatus(`Loaded ${file.name}.`, 'success');
  } catch {
    setStatus('That file could not be read. Try pasting its text instead.', 'error');
  } finally {
    ui.upload.value = '';
  }
});

ui.questionForm.addEventListener('submit', (event) => {
  event.preventDefault();
  if (state.passages.length === 0) {
    setStatus('Add notes before looking for evidence.', 'error');
    return;
  }
  const question = ui.question.value.trim();
  if (!question) {
    setStatus('Enter a question first.', 'error');
    ui.question.focus();
    return;
  }

  state.question = question;
  state.answer = buildExtractiveAnswer(question, state.passages);
  state.guide = null;
  state.quiz = [];
  state.quizResults = [];
  renderAnswer(state.answer);
  setStatus(state.answer.supported ? 'Showing exact source passages with matching terms.' : 'No matching evidence was found in these notes.', state.answer.supported ? 'success' : 'notice');
});

ui.guideButton.addEventListener('click', async () => {
  if (guideGenerationInProgress) {
    return;
  }
  if (state.passages.length === 0) {
    setStatus('Add notes before generating a guide.', 'error');
    return;
  }
  const question = ui.question.value.trim() || 'Explain the main ideas in these notes.';
  state.question = question;
  state.answer = null;
  state.guide = null;
  state.quiz = [];
  state.quizResults = [];
  renderEmpty('The optional model is loading in this browser. Your notes remain on this device.');
  const revision = state.revision;
  guideGenerationInProgress = true;
  ui.guideButton.disabled = true;
  ui.guideButton.setAttribute('aria-busy', 'true');

  try {
    const guide = await generateStudyGuide(question, state.passages, (message) => setStatus(message));
    if (state.revision !== revision) {
      setStatus('Notes changed while the guide was in progress. The older draft was discarded.', 'notice');
      return;
    }
    state.guide = guide;
    renderGuide(guide);
    setStatus('Cited draft ready. Check each quote against your notes.', 'success');
  } catch (error) {
    if (state.revision !== revision) {
      setStatus('Notes changed while the guide was in progress. The older draft was discarded.', 'notice');
      return;
    }
    renderGuideFailure();
    setStatus(error instanceof Error ? error.message : 'The local model could not produce a validated guide.', 'error');
  } finally {
    guideGenerationInProgress = false;
    ui.guideButton.disabled = state.passages.length === 0;
    ui.guideButton.setAttribute('aria-busy', 'false');
  }
});

ui.quizButton.addEventListener('click', () => {
  if (state.passages.length === 0) {
    setStatus('Add notes before building a quiz.', 'error');
    return;
  }
  state.answer = null;
  state.guide = null;
  state.quiz = buildClozeQuiz(state.passages);
  state.quizResults = [];
  quizIndex = 0;
  renderQuiz();
  setStatus(state.quiz.length > 0 ? 'Recall prompts were made directly from your notes.' : 'Try adding a few complete sentences.', state.quiz.length > 0 ? 'success' : 'notice');
});

renderEmpty();
setStatus('Add notes or load the sample to begin.');
