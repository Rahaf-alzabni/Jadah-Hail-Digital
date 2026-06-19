"""Capture professional screenshots of the Jadah Hail platform for the report."""
import subprocess
import sys
import time
from pathlib import Path

ROOT = Path(__file__).resolve().parents[1]
SCREENSHOTS = ROOT / 'docs' / 'screenshots'
SCREENSHOTS.mkdir(parents=True, exist_ok=True)

BASE_URL = 'http://localhost:5173'
VIEWPORT = {'width': 1440, 'height': 900}


def ensure_demo_data():
    subprocess.run(
        [sys.executable, 'manage.py', 'load_demo_data'],
        cwd=ROOT, check=False, capture_output=True,
    )


def capture_all():
    try:
        from playwright.sync_api import sync_playwright
    except ImportError:
        print('Playwright not installed — skipping screenshots.')
        return []

    saved = []

    with sync_playwright() as p:
        browser = p.chromium.launch(headless=True)
        page = browser.new_page(viewport=VIEWPORT)
        page.set_default_timeout(30000)

        def shot(name, caption, action=None, wait_ms=2500):
            path = SCREENSHOTS / name
            try:
                if action:
                    action()
                page.wait_for_timeout(wait_ms)
                page.screenshot(path=str(path), full_page=False)
                saved.append((path, caption))
                print(f'Captured: {path.name}')
            except Exception as exc:
                print(f'Failed {name}: {exc}')

        page.goto(BASE_URL, wait_until='networkidle')

        # Switch to English for university report
        try:
            page.get_by_text('English', exact=False).first.click(timeout=5000)
            page.wait_for_timeout(1500)
        except Exception:
            pass

        def nav_click(name):
            page.locator('nav').get_by_role('button', name=name, exact=True).click()

        shot('01_home.png', 'Figure 5 — Home Page: Hero, search, featured places and events')

        shot('02_explore.png', 'Figure 6 — Explore Page: Places grid with search and filters',
             lambda: nav_click('Explore'))

        shot('03_map.png', 'Figure 7 — Interactive Map: Hail landmarks on OpenStreetMap',
             lambda: nav_click('Map'), wait_ms=4000)

        shot('04_routes.png', 'Figure 8 — Routes Page: Suggested tourist routes',
             lambda: nav_click('Routes'))

        shot('05_assistant.png', 'Figure 9 — AI Tourism Assistant: Rule-based chat guide',
             lambda: nav_click('AI Guide'))

        def open_detail():
            nav_click('Explore')
            page.wait_for_timeout(2000)
            page.locator('h3').first.click()

        shot('06_place_details.png', 'Figure 10 — Place Details: Image, description, mini map, reviews',
             open_detail, wait_ms=3500)

        def open_admin():
            page.get_by_role('button', name='Admin Dashboard').click()
            page.wait_for_timeout(2000)

        shot('07_admin_dashboard.png', 'Figure 11 — Admin Dashboard: Overview and analytics',
             open_admin, wait_ms=3000)

        browser.close()

    return saved


if __name__ == '__main__':
    ensure_demo_data()
    results = capture_all()
    if not results:
        sys.exit(0)
    print(f'\nTotal screenshots: {len(results)}')
