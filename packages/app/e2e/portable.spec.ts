/**
 * The portable single file, opened the way someone actually opens it: by double-clicking it.
 *
 * A browser refuses to load an ES module script over file://, so the ordinary build cannot be run
 * from a flash drive without a server. desktop.portable_build.why_it_matters says campus and
 * corporate machines frequently forbid installation, and such a machine may have no way to run a
 * local server either. docs/metrika-offline.html inlines the script and the stylesheet so an
 * inline module executes rather than being fetched.
 *
 * See DEVIATIONS.md, D-21.
 */

import { expect, test } from '@playwright/test';
import { resolve } from 'node:path';

const PORTABLE = `file://${resolve(import.meta.dirname, '../../../docs/metrika-offline.html')}`;

test.describe('the portable single file', () => {
  test('renders the whole corpus from the file system, with no server at all', async ({ page }) => {
    const failures: string[] = [];
    page.on('pageerror', (error) => failures.push(error.message));
    page.on('console', (message) => {
      if (message.type() === 'error') failures.push(message.text());
    });

    await page.goto(PORTABLE);

    // The formula tree is built from the registry, so a full tree means the corpus came across.
    await expect(page.locator('.mk-tree__label')).not.toHaveCount(0);
    expect(await page.locator('.mk-tree__label').count()).toBeGreaterThan(80);

    // Nothing may be reported as broken, in particular nothing blocked by the content policy.
    expect(failures, `console and page errors: ${failures.join(' | ')}`).toHaveLength(0);
  });

  test('computes and shows its derivation without touching the network', async ({ page }) => {
    const offOrigin: string[] = [];
    page.on('request', (request) => {
      if (!request.url().startsWith('file://')) offOrigin.push(request.url());
    });

    await page.goto(PORTABLE);

    await page.getByLabel('Total Klik', { exact: true }).fill('1250');
    await page.getByLabel('Total Tayangan', { exact: true }).fill('100000');
    await page.keyboard.press('Enter');
    await expect(page.getByLabel('Nilai hasil')).toContainText('0,0125');

    await page.keyboard.press('F9');
    await expect(page.getByRole('region', { name: 'Penurunan hasil' })).toContainText(
      'clicks / impressions',
    );

    expect(offOrigin, `requests that left the file system: ${offOrigin.join(', ')}`).toHaveLength(
      0,
    );
  });

  test('is genuinely one file: it references nothing beside itself', async ({ page }) => {
    await page.goto(PORTABLE);

    const references = await page.evaluate(() =>
      [...document.querySelectorAll('script[src], link[href], img[src]')].map(
        (element) => element.getAttribute('src') ?? element.getAttribute('href') ?? '',
      ),
    );
    expect(references, `external references: ${references.join(', ')}`).toHaveLength(0);
  });

  test('its policy forbids reaching anywhere, since a file page has no origin to trust', async ({
    page,
  }) => {
    await page.goto(PORTABLE);
    const policy = await page.evaluate(
      () =>
        document
          .querySelector('meta[http-equiv="Content-Security-Policy"]')
          ?.getAttribute('content') ?? '',
    );
    expect(policy).toContain("connect-src 'none'");
    expect(policy).toContain("default-src 'none'");
    expect(policy).toContain("form-action 'none'");
    expect(policy).not.toContain('unsafe-eval');
  });
});
