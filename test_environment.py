"""Exercise the environment tab."""

from pathlib import Path

from playwright.sync_api import Page, expect, sync_playwright
from pytest import fixture

INDEX_URL = f'{(Path(__file__).parent / "index.html").as_uri()}#environment'


@fixture
def page():
    with sync_playwright() as playwright:
        browser = playwright.chromium.launch()
        context = browser.new_context()
        page = context.new_page()
        page.goto(INDEX_URL)
        yield page
        context.close()
        browser.close()


def test_environment_edit_cancel_keeps_empty(page: Page):
    count = page.locator('#count')
    empty_state = page.locator('#empty-state')
    environment_list = page.locator('#environment-list')

    expect(count).to_have_text('0 VARIABLES')
    expect(empty_state).to_be_visible()
    expect(environment_list).to_be_empty()

    page.click('#edit-button')
    page.fill('#environment-definitions', 'FOO = bar')
    page.get_by_role('button', name='CANCEL').click()

    expect(page.locator('#environment-dialog')).not_to_be_visible()
    expect(count).to_have_text('0 VARIABLES')
    expect(empty_state).to_be_visible()
    expect(environment_list).to_be_empty()


def test_environment_save_persists_variable(page: Page):
    count = page.locator('#count')
    empty_state = page.locator('#empty-state')

    expect(count).to_have_text('0 VARIABLES')
    expect(empty_state).to_be_visible()

    page.click('#edit-button')
    page.fill('#environment-definitions', 'FOO = bar')
    page.click('#save-variables')

    expect(page.locator('#environment-dialog')).not_to_be_visible()
    expect(count).to_have_text('1 VARIABLE')
    expect(empty_state).to_be_hidden()
    expect(page.locator('.environment-row')).to_have_count(1)
    expect(page.locator('.environment-row dt')).to_have_text('FOO')
    expect(page.locator('.environment-row dd')).to_have_text('bar')
