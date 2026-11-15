import { buildStudyPrompt, parseModelJson, validateStudyGuide } from './study-engine.js';

export const MODEL_ID = 'onnx-community/Qwen2.5-0.5B-Instruct';
const MODEL_FILE_TIMEOUT_MS = 120_000;

let generatorPromise = null;
let modelRequestTimedOut = false;

export function createTimeoutFetch(fetchImpl, timeoutMs, onTimeout = () => {}) {
  return (input, init = {}) => {
    const controller = new AbortController();
    const callerSignal = init.signal;
    let timedOut = false;
    const durationSeconds = Math.max(1, Math.ceil(timeoutMs / 1000));
    const timeoutId = setTimeout(() => {
      timedOut = true;
      onTimeout();
      controller.abort();
    }, timeoutMs);
    const forwardCallerAbort = () => controller.abort();

    if (callerSignal?.aborted) {
      forwardCallerAbort();
    } else {
      callerSignal?.addEventListener('abort', forwardCallerAbort, { once: true });
    }

    return Promise.resolve()
      .then(() => fetchImpl(input, { ...init, signal: controller.signal }))
      .catch((error) => {
        if (timedOut) {
          throw new Error(`Model file request timed out after ${durationSeconds} ${durationSeconds === 1 ? 'second' : 'seconds'}.`, { cause: error });
        }
        throw error;
      })
      .finally(() => {
        clearTimeout(timeoutId);
        callerSignal?.removeEventListener('abort', forwardCallerAbort);
      });
  };
}

export function extractAssistantText(output) {
  const generated = Array.isArray(output) ? output[0]?.generated_text : null;
  if (typeof generated === 'string') return generated;
  if (!Array.isArray(generated)) return null;

  for (let index = generated.length - 1; index >= 0; index -= 1) {
    if (generated[index]?.role === 'assistant' && typeof generated[index].content === 'string') {
      return generated[index].content;
    }
  }
  return null;
}

async function loadGenerator(onStatus) {
  if (generatorPromise) return generatorPromise;

  generatorPromise = (async () => {
    modelRequestTimedOut = false;
    const { env, pipeline } = await import('@huggingface/transformers');
    env.fetch = createTimeoutFetch(
      globalThis.fetch.bind(globalThis),
      MODEL_FILE_TIMEOUT_MS,
      () => { modelRequestTimedOut = true; },
    );
    const options = { dtype: 'q4' };

    if (typeof navigator !== 'undefined' && navigator.gpu) {
      try {
        return await pipeline('text-generation', MODEL_ID, { ...options, device: 'webgpu' });
      } catch (error) {
        if (modelRequestTimedOut) throw error;
        onStatus('WebGPU was unavailable, so the model is loading in the slower CPU mode.');
      }
    }

    return pipeline('text-generation', MODEL_ID, { ...options, device: 'wasm' });
  })().catch((error) => {
    generatorPromise = null;
    throw error;
  });

  return generatorPromise;
}

export async function generateStudyGuide(question, passages, onStatus = () => {}) {
  onStatus('Loading the optional local model. Its first use downloads model files to this browser.');

  try {
    const generator = await loadGenerator(onStatus);
    onStatus('Generating a cited guide on this device.');

    const output = await generator(
      [{ role: 'user', content: buildStudyPrompt(question, passages, 'guide') }],
      { max_new_tokens: 512, do_sample: false },
    );
    const guide = parseModelJson(extractAssistantText(output));

    if (!validateStudyGuide(guide, passages)) {
      throw new Error('The local model did not return a guide with valid source quotes. Try again or use evidence lookup.');
    }

    return guide;
  } catch (error) {
    if (modelRequestTimedOut) {
      modelRequestTimedOut = false;
      throw new Error(`A model file request timed out after ${MODEL_FILE_TIMEOUT_MS / 1000} seconds. Check your connection and try again.`, { cause: error });
    }
    throw error;
  }
}
