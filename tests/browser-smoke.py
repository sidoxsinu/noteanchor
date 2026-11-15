import os
import shutil
from pathlib import Path
from playwright.sync_api import expect, sync_playwright


MODEL_HOST_REQUESTS = []
PAGE_ERRORS = []

with sync_playwright() as playwright:
    launch_options = {"headless": True}
    chromium_path = os.environ.get("PLAYWRIGHT_CHROMIUM_EXECUTABLE") or shutil.which("chromium")
    if chromium_path:
        launch_options["executable_path"] = chromium_path
        launch_options["args"] = ["--no-sandbox"]

    browser = playwright.chromium.launch(**launch_options)
    page = browser.new_page(viewport={"width": 1280, "height": 900})
    page.on("pageerror", lambda error: PAGE_ERRORS.append(str(error)))
    page.on(
        "request",
        lambda request: MODEL_HOST_REQUESTS.append(request.url)
        if "huggingface.co" in request.url or "hf.co" in request.url
        else None,
    )

    page.goto("http://127.0.0.1:5173/noteanchor/", wait_until="networkidle")
    expect(page).to_have_title("NoteAnchor — study from your own notes")
    for action in ["Find evidence", "Generate cited guide", "Build recall quiz"]:
        expect(page.get_by_role("button", name=action)).to_be_disabled()

    page.get_by_role("button", name="Use sample notes").click()
    expect(page.locator("#notes-count")).to_contain_text("5 passages")
    for action in ["Find evidence", "Generate cited guide", "Build recall quiz"]:
        expect(page.get_by_role("button", name=action)).to_be_enabled()

    page.get_by_label("What do you want to understand?").fill(
        "What do light-dependent reactions release?"
    )
    page.get_by_role("button", name="Find evidence").click()
    expect(page.locator("#output-region")).to_contain_text("Direct evidence match")
    expect(page.locator("#output-region")).to_contain_text("P03 · Source passage")
    expect(page.locator("#output-region")).to_contain_text(
        "Light-dependent reactions split water molecules and release oxygen."
    )

    page.get_by_role("button", name="Build recall quiz").click()
    expect(page.locator("#output-region")).to_contain_text("Recall practice · 1 of 5")
    expect(page.locator("#output-region")).not_to_contain_text("Photosynthesis")
    page.get_by_label("Your answer to the recall prompt").fill("starch")
    page.get_by_role("button", name="Check answer").click()
    expect(page.locator("#output-region")).to_contain_text("Not an exact match")
    expect(page.locator("#output-region")).to_contain_text("Photosynthesis")
    expect(page.locator("#output-region")).to_contain_text("P01 · Source passage")

    page.get_by_label("Paste or type your study notes").fill(
        "Cell membranes regulate transport into and out of cells."
    )
    expect(page.locator("#output-region")).to_contain_text("Your answer, guide, or quiz will appear here.")
    expect(page.locator("#output-region")).not_to_contain_text("Photosynthesis")

    upload_path = Path("/tmp/noteanchor-browser-notes.txt")
    upload_path.write_text("Diffusion moves particles down a concentration gradient.")
    page.locator("#upload-input").set_input_files(str(upload_path))
    expect(page.locator("#notes-input")).to_have_value(
        "Diffusion moves particles down a concentration gradient."
    )
    expect(page.locator("#notes-count")).to_contain_text("1 passage")

    page.set_viewport_size({"width": 375, "height": 812})
    page.reload(wait_until="networkidle")
    assert page.evaluate("document.documentElement.scrollWidth <= window.innerWidth"), (
        "The mobile layout should not overflow horizontally."
    )
    assert not PAGE_ERRORS, f"Unexpected browser exceptions: {PAGE_ERRORS}"
    assert not MODEL_HOST_REQUESTS, "The model should not download until the user explicitly requests a guide."

    print(
        "Browser smoke passed: empty-state controls, sample notes, exact evidence, hidden-answer quiz, "
        "note-edit invalidation, text upload, mobile width, and no unsolicited model requests."
    )
    browser.close()
