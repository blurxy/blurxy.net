import { expect, test } from '@playwright/test';

const featuredUrls = ['/kev/', '/osint/', '/resume', '/worldcup26/']
  .map(path => 'https://blurxy.net' + path);

async function checkLinks(nav) {
  await expect(nav).toBeVisible();
  const links = nav.getByRole('link');
  await expect(links).toHaveCount(featuredUrls.length);
  expect(await links.evaluateAll(items => items.map(link => link.getAttribute('href'))))
    .toEqual(featuredUrls);
}

test.describe('featured links without JavaScript', () => {
  test.use({ javaScriptEnabled: false, viewport: { width: 320, height: 568 } });

  test('public pages are reachable from the initial HTML', async ({ page }) => {
    await page.goto('/');
    await checkLinks(page.getByRole('navigation', { name: 'Featured pages' }));
  });
});

test('featured links fit on the small board and are available in List', async ({ page }) => {
  await page.setViewportSize({ width: 320, height: 568 });
  await page.goto('/');
  const listNav = page.locator('#list .featured-links');
  await checkLinks(listNav);
  await expect(listNav).toBeInViewport({ ratio: 1 });
  await page.getByRole('button', { name: 'Board', exact: true }).click();
  const boardNav = page.locator('.hud .featured-links');
  await checkLinks(boardNav);
  const links = await boardNav.getByRole('link').all();
  for (const link of links) {
    const box = await link.boundingBox();
    expect(box).not.toBeNull();
    expect(box.x).toBeGreaterThanOrEqual(0);
    expect(box.x + box.width).toBeLessThanOrEqual(320);
    expect(box.height).toBeGreaterThanOrEqual(24);
    await link.click({ trial: true });
  }

  await page.getByRole('button', { name: 'List', exact: true }).click();
  await checkLinks(page.locator('#list .featured-links'));
  await expect(boardNav).toBeHidden();
});

test('the résumé canonical points to its clean URL', async ({ page }) => {
  await page.goto('/resume');
  const canonical = page.locator('head link[rel="canonical"]');
  await expect(canonical).toHaveCount(1);
  await expect(canonical).toHaveAttribute('href', 'https://blurxy.net/resume');
});
