# Implementation references

## App and model

- Vite's getting-started guide documents a vanilla JavaScript app and npm scripts: https://vite.dev/guide/.
- Vite's shared `base` option controls the project-site path; this repository builds for `/noteanchor/`: https://vite.dev/config/shared-options.html#base.
- Transformers.js documents browser text generation with chat messages and generation options: https://huggingface.co/docs/transformers.js/en/api/pipelines#module_pipelines.TextGenerationPipeline.
- The browser model is `onnx-community/Qwen2.5-0.5B-Instruct`: https://huggingface.co/onnx-community/Qwen2.5-0.5B-Instruct. The upstream Qwen2.5-0.5B-Instruct model card lists Apache-2.0 licensing: https://huggingface.co/Qwen/Qwen2.5-0.5B-Instruct.

## GitHub Pages

- GitHub's custom-workflow guide documents the Pages artifact and required `pages: write` and `id-token: write` permissions: https://docs.github.com/en/pages/getting-started-with-github-pages/using-custom-workflows-with-github-pages.
- The workflow uses the official `actions/checkout@v7`, `actions/setup-node@v7`, `actions/configure-pages@v5`, `actions/upload-pages-artifact@v4`, and `actions/deploy-pages@v4` actions; the current versions and usage were checked against their upstream repositories.
- GitHub's REST API documents creating a Pages site with `build_type: workflow`: https://docs.github.com/en/rest/pages/pages?apiVersion=2022-11-28.

## Event submissions

- Code for a Billion official event page: https://codeforindia.org/hackathon.
- Current structured GitHub submission template and its required project fields: https://github.com/karlmehta/code-for-a-billion/blob/main/.github/ISSUE_TEMPLATE/submission.yml.
- Homingo Hack Days timeline and participation instructions: https://hackathon.homingo.co.in/how-it-works.

## Model request timeout and citation limits

- Transformers.js documents `env.fetch` as a configurable fetch function with an optional request-init argument: https://huggingface.co/docs/transformers.js/en/api/env. NoteAnchor wraps it with an abort after 120 seconds for each stalled model-file request.
- MDN documents that `AbortController.abort()` can abort a fetch request and response-body consumption: https://developer.mozilla.org/en-US/docs/Web/API/AbortController/abort.
- The documented text-generation pipeline and generation-parameters APIs do not expose an `AbortSignal` option for stopping already-running inference: https://huggingface.co/docs/transformers.js/en/api/pipelines#module_pipelines.TextGenerationPipeline and https://huggingface.co/docs/transformers.js/en/api/generation/parameters. The project therefore does not claim to cancel local inference after model loading.
