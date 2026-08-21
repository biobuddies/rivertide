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


def test_environment_persists_across_reload(page: Page):
    page.click('#edit-button')
    page.fill('#environment-definitions', 'FOO = bar')
    page.click('#save-variables')

    page.reload()

    expect(page.locator('#count')).to_have_text('1 VARIABLE')
    expect(page.locator('#empty-state')).to_be_hidden()
    expect(page.locator('.environment-row')).to_have_count(1)
    expect(page.locator('.environment-row dt')).to_have_text('FOO')
    expect(page.locator('.environment-row dd')).to_have_text('bar')


def test_environment_edit_prefills_existing(page: Page):
    page.click('#edit-button')
    page.fill('#environment-definitions', 'FOO = bar')
    page.click('#save-variables')

    page.click('#edit-button')

    expect(page.locator('#environment-dialog')).to_be_visible()
    expect(page.locator('#environment-definitions')).to_have_value('FOO = bar')


def test_environment_save_multiple_shows_plural_count(page: Page):
    page.click('#edit-button')
    page.fill('#environment-definitions', 'FOO = bar\nBAZ = qux')
    page.click('#save-variables')

    expect(page.locator('#count')).to_have_text('2 VARIABLES')
    expect(page.locator('.environment-row')).to_have_count(2)
    expect(page.locator('.environment-row dt')).to_have_text(['BAZ', 'FOO'])
    expect(page.locator('.environment-row dd')).to_have_text(['qux', 'bar'])


def test_environment_ignores_comment_lines(page: Page):
    page.click('#edit-button')
    page.fill('#environment-definitions', '# comment\n; comment\n[section]\nFOO = bar')
    page.click('#save-variables')

    expect(page.locator('#count')).to_have_text('1 VARIABLE')
    expect(page.locator('.environment-row')).to_have_count(1)
    expect(page.locator('.environment-row dt')).to_have_text('FOO')


def test_environment_uppercases_variable_names(page: Page):
    page.click('#edit-button')
    page.fill('#environment-definitions', 'foo = bar')
    page.click('#save-variables')

    expect(page.locator('.environment-row dt')).to_have_text('FOO')


def test_environment_invalid_name_keeps_dialog_open(page: Page):
    page.click('#edit-button')
    page.fill('#environment-definitions', '1FOO = bar')
    page.click('#save-variables')

    expect(page.locator('#environment-dialog')).to_be_visible()
    expect(page.locator('#count')).to_have_text('0 VARIABLES')
