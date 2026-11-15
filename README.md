# NoteAnchor

A source-first study desk that helps students find evidence in their own notes, draft a cited explanation, and practise recall.

[Live demo](https://sidoxsinu.github.io/noteanchor/) · [Source code](https://github.com/sidoxsinu/noteanchor) · [MIT license](LICENSE)

> **Prototype:** NoteAnchor has not been field-tested with a student cohort and has no measured impact data. A citation is a pointer to a matching passage, not proof that an explanation is correct; check the source notes.

## What it does

- Paste notes or open a plain-text `.txt` file (up to 12,000 characters). NoteAnchor splits the material into numbered passages.
- Ask a question and find the most relevant passage, with the exact source quote.
- Optionally generate a short guide in the browser using Qwen2.5-0.5B-Instruct. The app checks that the model's cited passage IDs and quotes match the notes before showing the draft.
- Build a cloze-style recall quiz from the notes. Answers stay hidden until you respond, and feedback points back to the source passage.
- Replace the notes at any time; previous answers, guides, and quiz results are cleared.

Evidence lookup and recall practice work without the optional model. NoteAnchor does not search the web, read PDFs, or claim that generated text is independently fact-checked.

## Try the demo

Open [NoteAnchor on GitHub Pages](https://sidoxsinu.github.io/noteanchor/), load the sample notes or paste your own, then choose **Find evidence**, **Generate cited guide**, or **Build recall quiz**.

The first guide request downloads model files from [Hugging Face](https://huggingface.co/onnx-community/Qwen2.5-0.5B-Instruct) to the browser. A stalled model-file request is aborted after two minutes. Model loading can still take time and use your device's memory; the guide is optional.

## Run locally

Requirements: Node.js 20.19 or later and npm.

```bash
git clone https://github.com/sidoxsinu/noteanchor.git
cd noteanchor
npm ci
npm run dev
```

Open `http://localhost:5173/noteanchor/`. To verify the project or create a production build:

```bash
npm test
npm run build
npm run preview
```

## Privacy and limitations

- Notes are held in the current browser page and are not saved by NoteAnchor after the tab closes. There is no account, application backend, analytics, or cloud sync.
- The optional model performs inference in the browser. Notes are not sent to a hosted inference service. The initial model download does make network requests to Hugging Face.
- The local model is small and may return incomplete or incorrect explanations. NoteAnchor validates citation IDs and exact quote text, not the truth or full meaning of the generated explanation.
- Only plain text is supported; PDF/OCR, collaboration, grades, and persistent note storage are out of scope.

## Development notes

This project was opened and iterated in the AgentFoundry IDE workspace. AgentFoundry's free Smart Code was used for a scoped guide-generation concurrency guard, and the integrated terminal was used for dependency installation, tests, and the production build. No paid plan or paid inference service is used.

The browser model uses [Transformers.js](https://huggingface.co/docs/transformers.js/) and the [ONNX Community Qwen2.5-0.5B-Instruct model](https://huggingface.co/onnx-community/Qwen2.5-0.5B-Instruct). The upstream Qwen model is published under Apache-2.0; see its [model card](https://huggingface.co/Qwen/Qwen2.5-0.5B-Instruct). The NoteAnchor source code is MIT-licensed; see [LICENSE](LICENSE).

## Contributing

Bug reports and focused improvements are welcome through GitHub issues or pull requests. Run `npm test` and `npm run build` before proposing a change. Please do not add unsupported impact claims or send note text to a hosted model without explicit disclosure.

---

Last reviewed: 2026-11-16.
