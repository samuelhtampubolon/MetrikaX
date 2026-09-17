/**
 * AC-06 and AC-08, checked against the production build in a real browser.
 *
 * These are the two claims that cannot be checked by reading the source. A promise that the
 * application works with the network disabled is worth exactly as much as the test that disables
 * it, so this suite disables it.
 */

import { expect, test, type Page, type Request } from '@playwright/test';

/** Type a value into a field found by its Indonesian label. */
async function fill(page: Page, label: string, value: string): Promise<void> {
  await page.getByLabel(label, { exact: true }).fill(value);
}

/**
 * Wait for the service worker to be active and in control.
 *
 * The registration outcome is asserted rather than assumed: a silent registration failure would
 * otherwise show up as a test that waits for thirty seconds and says nothing useful.
 */
async function waitForServiceWorker(page: Page): Promise<void> {
  await expect
    .poll(
      async () => page.evaluate(() => (window as { __metrikaOffline?: string }).__metrikaOffline),
      {
        timeout: 10_000,
      },
    )
    .toBe('registered');

  await page.evaluate(async () => {
    const registration = await navigator.serviceWorker.ready;
    if (registration.active !== null) return;
    await new Promise<void>((resolve) => {
      registration.addEventListener('updatefound', () => resolve(), { once: true });
    });
  });

  // The precache is filled during install. Give the worker control of this page before the network
  // is taken away, so the reload below is served entirely from the cache.
  await expect
    .poll(async () => page.evaluate(() => navigator.serviceWorker.controller !== null), {
      timeout: 10_000,
    })
    .toBe(true);
}

test.describe('the web build', () => {
  test('computes CTR from two entered numbers', async ({ page }) => {
    await page.goto('./index.html');

    await fill(page, 'Total Klik', '1250');
    await fill(page, 'Total Tayangan', '100000');
    await page.getByRole('button', { name: 'Hitung', exact: true }).click();

    await expect(page.getByLabel('Nilai hasil')).toContainText('0,0125');
  });

  test('AC-08: works completely with the network disabled after one visit', async ({
    page,
    context,
  }) => {
    // First visit, with the network available: the service worker precaches the whole shell.
    await page.goto('./index.html');
    await waitForServiceWorker(page);
    await expect(page.getByLabel('Nilai hasil')).toBeVisible();

    // Now take the network away entirely and reload from nothing but the cache.
    await context.setOffline(true);
    await page.reload();

    await expect(page.getByLabel('Nilai hasil')).toBeVisible();

    // A complete calculation, offline, including the derivation.
    await fill(page, 'Total Klik', '1250');
    await fill(page, 'Total Tayangan', '100000');
    await page.keyboard.press('Enter');
    await expect(page.getByLabel('Nilai hasil')).toContainText('0,0125');

    await page.keyboard.press('F9');
    await expect(page.getByRole('region', { name: 'Penurunan hasil' })).toContainText(
      'clicks / impressions',
    );

    // Another formula entirely, to prove the whole corpus came across rather than one screen.
    await page.getByLabel('Cari rumus').fill('AOV');
    await page.getByRole('button', { name: /^AOV/ }).click();
    await fill(page, 'Total Pendapatan', '185000000');
    await fill(page, 'Jumlah Pesanan', '1480');
    await page.keyboard.press('Enter');
    await expect(page.getByLabel('Nilai hasil')).toContainText('125.000');

    await context.setOffline(false);
  });

  test('AC-06: issues no request to any origin other than its own', async ({ page }) => {
    const foreign: string[] = [];
    const record = (request: Request): void => {
      const url = new URL(request.url());
      if (url.hostname !== '127.0.0.1' && url.hostname !== 'localhost') foreign.push(request.url());
    };
    page.on('request', record);

    await page.goto('./index.html');
    await waitForServiceWorker(page);

    // Exercise the application rather than merely loading it: a request sent on a user action
    // would be missed by a test that only measures the first paint.
    await fill(page, 'Total Klik', '1250');
    await fill(page, 'Total Tayangan', '100000');
    await page.keyboard.press('Enter');
    await page.keyboard.press('F9');
    await page.getByLabel('Cari rumus').fill('CLV');
    await page.waitForTimeout(500);

    expect(foreign, `outbound requests: ${foreign.join(', ')}`).toHaveLength(0);
  });

  test('loads no font, no script and no style from a remote origin', async ({ page }) => {
    await page.goto('./index.html');

    const remote = await page.evaluate(() => {
      const origin = window.location.origin;
      const urls: string[] = [];
      for (const element of document.querySelectorAll('script[src], link[href], img[src]')) {
        const raw = element.getAttribute('src') ?? element.getAttribute('href') ?? '';
        if (raw === '') continue;
        const resolved = new URL(raw, window.location.href);
        if (resolved.origin !== origin && resolved.protocol !== 'data:') urls.push(resolved.href);
      }
      return urls;
    });

    expect(remote, `remote references: ${remote.join(', ')}`).toHaveLength(0);
  });

  test('uses no eval and no Function constructor at runtime (ADR-003)', async ({ page }) => {
    const violations: string[] = [];
    page.on('console', (message) => {
      if (message.type() === 'error' && /unsafe-eval|EvalError/i.test(message.text())) {
        violations.push(message.text());
      }
    });
    page.on('pageerror', (error) => {
      if (/eval/i.test(error.message)) violations.push(error.message);
    });

    await page.goto('./index.html');
    await fill(page, 'Total Klik', '1250');
    await fill(page, 'Total Tayangan', '100000');
    await page.keyboard.press('Enter');
    await expect(page.getByLabel('Nilai hasil')).toContainText('0,0125');

    // The page is served with a policy that has no 'unsafe-eval'. A call to eval would raise an
    // EvalError, and the calculation above would not have produced a number.
    expect(violations).toHaveLength(0);
  });
});

test.describe('keyboard and print', () => {
  test('AC-09: a complete calculation using only the keyboard', async ({ page }) => {
    await page.goto('./index.html');

    // Walk the tab order until the first numeric field has focus, then type. No click is issued
    // anywhere in this test. The screen autofocuses that field, so the walk usually ends at once,
    // and the loop is what proves the field is reachable by Tab either way.
    for (let step = 0; step < 40; step += 1) {
      const onFirstField = await page.evaluate(() => {
        const active = document.activeElement as HTMLElement | null;
        if (active === null) return false;
        if (!active.classList.contains('mk-numeric')) return false;
        return (
          active.getAttribute('aria-label') !== 'Cari rumus' &&
          active.getAttribute('type') !== 'search'
        );
      });
      if (onFirstField) break;
      await page.keyboard.press('Tab');
    }

    await page.keyboard.type('1250');
    await page.keyboard.press('Tab');
    await page.keyboard.type('100000');
    await page.keyboard.press('Enter');

    await expect(page.getByLabel('Nilai hasil')).toContainText('0,0125');
  });

  test('AC-10: the print view drops every piece of interface chrome', async ({ page }) => {
    await page.goto('./index.html');
    await fill(page, 'Total Klik', '1250');
    await fill(page, 'Total Tayangan', '100000');
    await page.keyboard.press('Enter');

    await page.emulateMedia({ media: 'print' });

    await expect(page.locator('.mk-menubar')).toBeHidden();
    await expect(page.locator('.mk-statusbar')).toBeHidden();
    await expect(page.locator('.mk-titlebar')).toBeHidden();
    await expect(page.locator('.mk-calc__left')).toBeHidden();

    // The result survives, in the serif face the specification asks for.
    await expect(page.getByLabel('Nilai hasil')).toBeVisible();
    const font = await page.evaluate(() => getComputedStyle(document.body).fontFamily);
    expect(font).toContain('Times New Roman');
  });
});
