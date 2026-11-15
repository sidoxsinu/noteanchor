import asyncio
import os
import shutil
from playwright.async_api import async_playwright, expect


async def main():
    async with async_playwright() as playwright:
        launch_options = {"headless": True}
        chromium_path = os.environ.get("PLAYWRIGHT_CHROMIUM_EXECUTABLE") or shutil.which("chromium")
        if chromium_path:
            launch_options["executable_path"] = chromium_path
            launch_options["args"] = ["--no-sandbox"]

        browser = await playwright.chromium.launch(**launch_options)
        page = await browser.new_page(viewport={"width": 1280, "height": 900})
        request_started = asyncio.Event()
        release_request = asyncio.Event()
        model_requests = []

        async def hold_model_request(route):
            model_requests.append(route.request.url)
            request_started.set()
            await release_request.wait()
            await route.abort()

        await page.route("https://huggingface.co/**", hold_model_request)
        await page.route("https://hf.co/**", hold_model_request)

        try:
            await page.goto("http://127.0.0.1:5173/noteanchor/", wait_until="networkidle")
            await page.get_by_role("button", name="Use sample notes").click()
            guide_button = page.get_by_role("button", name="Generate cited guide")
            await guide_button.click()
            await asyncio.wait_for(request_started.wait(), timeout=30)

            await expect(guide_button).to_be_disabled()
            await expect(guide_button).to_have_attribute("aria-busy", "true")

            await page.get_by_label("Paste or type your study notes").fill(
                "Cell membranes regulate transport into and out of cells."
            )
            await expect(guide_button).to_be_disabled()
            await expect(guide_button).to_have_attribute("aria-busy", "true")

            release_request.set()
            await expect(guide_button).to_have_attribute("aria-busy", "false", timeout=15000)
            await expect(guide_button).to_be_enabled()
            await expect(page.locator("#app-status")).to_contain_text(
                "Notes changed while the guide was in progress."
            )
            assert model_requests, "The test must hold the explicit model request before editing notes."
            print("Guide busy-state regression passed: edits cannot enable a duplicate run, stale output is discarded with a status, and cleanup restores the control.")
        finally:
            release_request.set()
            await browser.close()


asyncio.run(main())
