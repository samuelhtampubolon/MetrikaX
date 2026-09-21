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

  /**
   * AC-15, measured where it actually has to hold: in a browser, against the shipped bundle.
   *
   * The unit test compares the strings the component produced. This one reads the text the browser
   * laid out inside the SVG and the text inside the table cells, which is what a reader compares
   * when they look at the screen.
   */
  test('AC-15: the tornado plot and its table print identical numbers', async ({ page }) => {
    await page.goto('./index.html');

    await page.getByRole('tab', { name: 'Sensitivitas' }).click();
    await page.getByRole('button', { name: 'Contoh', exact: true }).click();
    await page.getByRole('button', { name: 'Jalankan', exact: true }).click();

    const plot = page.locator('svg.mk-plot');
    await expect(plot).toBeVisible();

    const texts = await plot.locator('text').allTextContents();
    const rows = await page.locator('.mk-sens__table tbody tr').all();
    expect(rows.length).toBeGreaterThan(0);
    expect(texts).toHaveLength(1 + rows.length * 2);

    for (const [index, row] of rows.entries()) {
      const cells = await row.locator('td').allTextContents();
      expect(texts[1 + index * 2], `bar ${index} label`).toBe(cells[0]);
      expect(texts[2 + index * 2], `bar ${index} swing`).toBe(cells[3]);
    }

    await expect(page.getByText(/Faktor dengan ayunan terbesar/)).toBeVisible();
  });

  /**
   * P14 in a real browser: the two plots whose answer is a shape rather than a number.
   *
   * What is checked is the same thing the unit tests check, in the place it has to hold: the
   * numbers printed on the chart are the strings the table beside it prints.
   */
  test('the Van Westendorp plot marks the four crossings with the table prices', async ({
    page,
  }) => {
    await page.goto('./index.html');

    await page.getByLabel('Cari rumus').fill('Van Westendorp');
    await page
      .getByRole('button', { name: /Van Westendorp/ })
      .first()
      .click();
    await page.getByRole('button', { name: 'Contoh', exact: true }).click();
    await page.getByRole('button', { name: 'Hitung', exact: true }).click();

    const chart = page.locator('svg.mk-chart');
    await expect(chart).toBeVisible();
    await expect(chart.locator('g.mk-chart__series')).toHaveCount(4);

    const marks = await chart.locator('g.mk-chart__mark text').allTextContents();
    const rows = await page.locator('.mk-calc__figure tbody tr').all();
    expect(rows).toHaveLength(4);

    for (const [index, row] of rows.entries()) {
      const cells = await row.locator('td').allTextContents();
      expect(marks[index], `${cells[0]} mark`).toContain(cells[1] as string);
    }
  });

  test('the Bass curve hatches the projection and marks the period entered', async ({ page }) => {
    await page.goto('./index.html');

    await page.getByLabel('Cari rumus').fill('Bass');
    await page
      .getByRole('button', { name: /^Bass_F\(t\)/ })
      .first()
      .click();
    await page.getByRole('button', { name: 'Contoh', exact: true }).click();
    await page.getByRole('button', { name: 'Hitung', exact: true }).click();

    const chart = page.locator('svg.mk-chart');
    await expect(chart).toBeVisible();

    const hatch = chart.locator('rect.mk-chart__extrapolated');
    await expect(hatch).toHaveAttribute('fill', 'url(#mk-chart-hatch)');
    await expect(chart.locator('path.mk-chart__line--projected')).toHaveCount(1);

    const mark = await chart.locator('g.mk-chart__mark text').first().textContent();
    const sixth = page.locator('.mk-calc__figure tbody tr', { hasText: /^6/ }).first();
    const cells = await sixth.locator('td').allTextContents();
    expect(mark).toBe(cells[1]);
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

    // The sensitivity screen too: it runs the engine two more times per factor, and a screen that
    // is never opened is a screen whose requests are never counted.
    await page.getByRole('tab', { name: 'Sensitivitas' }).click();
    await page.getByRole('button', { name: 'Contoh', exact: true }).click();
    await page.getByRole('button', { name: 'Jalankan', exact: true }).click();
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
