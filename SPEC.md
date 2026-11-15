# NoteAnchor — notes you can trace

Status: Publicly deployed prototype. All 24 local Node tests pass; the production build and GitHub Pages deployment succeed. The public JavaScript asset matches the tested GPU-adapter-probe build, and fresh hosted evidence-lookup and answer-hidden-quiz checks pass. Optional local-model generation ran in the local browser check but returned a draft that failed quote validation; the app correctly withheld it. Code for a Billion was submitted as issue #187; timing eligibility is unconfirmed. NoteAnchor cannot be submitted to Homingo because it predates kickoff.

## Objective

Help a student understand their own study notes and practise recalling them. The student pastes notes, asks a question, receives a response linked to exact supporting passages, and can take a quiz derived from those notes. This is a new project, not a reuse or rename of the existing Next-Gen AI Assistant or Pylon.

## Scope and boundaries

- A small, mobile-friendly web application, English first.
- Plain-text notes pasted or uploaded as `.txt`; no PDF/OCR, accounts, collaboration, grades, or external web research.
- One notes-to-study flow: ingest notes → retrieve evidence → optionally generate a cited guide → practise recall.
- No database, no persistent storage of student notes, no analytics, and no invented usage statistics.
- MIT-licensed public GitHub repository with setup steps.
- Development genuinely took place in the AgentFoundry IDE workspace. The free Smart Code workflow was used for a scoped guide-generation concurrency guard; the integrated terminal was used for installation, tests, and build. No paid AgentFoundry plan or paid inference is used.
- Only free services are authorized.

## Product behavior

1. A student can paste notes, see numbered source passages, and load an original bundled sample without an account.
2. Supplied notes are treated as source data, not as instructions that can change application rules.
3. Evidence lookup returns matching note passages and exact quotes. A match is not represented as proof of semantic truth.
4. If notes do not support a question, the app says no matching evidence was found rather than presenting an invented answer.
5. Optional browser-local model output is parsed and checked against source passage IDs and exact quotes before being displayed. Invalid output is rejected.
6. Recall questions are derived from the notes; answers remain hidden until submission, and feedback references the source passage.
7. Replacing notes invalidates previous explanations and quiz results. The guide button remains unavailable while generation is in progress.
8. Input has a 12,000-character limit. Empty or oversized input and invalid model output produce readable messages. Each model-file request has a 120-second timeout; the text-generation API does not document cancellation of already-running local inference.
9. Evidence lookup and quizzes remain available without the optional model. The interface labels the generated guide as an unverified local draft; quote matches do not prove a claim follows from its cited passage.
10. The deployed public demo must be tested end to end before being described as working or submitted.

## Implementation

The frontend uses vanilla JavaScript and Vite, with independently tested note parsing, evidence ranking, citation validation, quiz validation, note-replacement state, and safe text rendering. The optional local generation uses Transformers.js with `onnx-community/Qwen2.5-0.5B-Instruct` in the browser. The upstream Qwen model card lists Apache-2.0; the NoteAnchor source code is MIT-licensed.

## Local verification

- Node test suite: 24 passing tests, including timeout abort, preservation of caller cancellation, explicit WASM selection for browser CPU fallback, and checking for a usable WebGPU adapter rather than API presence alone.
- Browser smoke: empty-state controls, sample notes, evidence lookup, quiz answer hiding, stale-result clearing, text upload, mobile-width check, and no unsolicited model download pass.
- Browser regression: model requests are held locally to verify note edits cannot re-enable the guide button, stale output gets a status, and cleanup resets its busy state.
- `npm run build` succeeds. Vite emits a warning for the optional model-runtime chunk (544 KB uncompressed); it is loaded only when the user requests a guide.
- Public Pages deployment of the tested GPU-adapter probe succeeded: https://github.com/sidoxsinu/noteanchor/actions/runs/43763934927. The hosted demo at https://sidoxsinu.github.io/noteanchor/ serves the matching tested JavaScript asset and passed fresh evidence-lookup and answer-hidden-quiz checks. Optional model inference must not be represented as guaranteed on every device.
- Local real-browser model check: the model executed after the adapter-probe correction, but its draft failed exact-quote validation. The application displayed unedited source passages rather than an unvalidated explanation. A successful generated study guide has not been verified in this environment.

## Event constraints

### Code for a Billion / Bharat Agentic-AI Hackathon 2026

The official page publishes **15 November 2026** as the final submission date but does not specify a cutoff time or timezone. The GitHub issue template remains accessible, but that alone does not establish late eligibility; no official extension or late-acceptance confirmation has been found. At preparation time it is 16 November in India and still 15 November UTC. If a submission is made, use its actual GitHub timestamp and do not claim that it was accepted as on time. The form requires a public repository with setup instructions, a working demo, a track, contact email, and confirmations about AgentFoundry use; scale/impact data must not be invented.

Source: https://codeforindia.org/hackathon and https://github.com/karlmehta/code-for-a-billion/blob/main/.github/ISSUE_TEMPLATE/submission.yml

### Homingo Hack Days 2026

Registration is confirmed as a solo participant in the LLM apps track with Beginner AI experience. Kick-off is 21 November 2026, the build phase is 21 November–6 December, and the final submission window is 4–6 December. Section 09 of the official terms explicitly prohibits submitting anything a participant started building before kick-off, even if it is later made public. NoteAnchor predates kick-off and is therefore not eligible for Homingo. Do not submit this repository there. A separate implementation must begin during the official build phase; only ideas and planning may precede it.

Sources: https://hackathon.homingo.co.in/how-it-works and https://hackathon.homingo.co.in/terms

## Submission status

Code for a Billion: submitted through the official GitHub issue template as https://github.com/karlmehta/code-for-a-billion/issues/187 at 2026-11-15 21:27:58 UTC / 2026-11-16 02:57:58 IST, with the submission label. The entry discloses the deployment timestamp, uncertain cutoff timezone, absence of measured learner impact, AgentFoundry usage, and optional-model limitation. Issue creation is not confirmation of on-time eligibility or judging acceptance.

Homingo: not submitted. NoteAnchor is ineligible because it predates the 21 November kickoff; a separate implementation must start during the permitted build phase. The final submission window is 4–6 December 2026. Do not backdate development, deployment, or submission, and do not claim impact without field evidence.
