import { expect, test } from '@playwright/test';

const featuredUrls = ['/kev/', '/osint/', '/worldcup26/']
  .map(path => 'https://blurxy.net' + path);
const portfolioTitle = 'Rafiul Bari | Cybersecurity Portfolio · blurxy';
const portfolioHeading = 'Rafiul Bari — Cybersecurity Portfolio';

async function checkLinks(nav) {
  await expect(nav).toBeVisible();
  const links = nav.getByRole('link');
  await expect(links).toHaveCount(featuredUrls.length);
  expect(await links.evaluateAll(items => items.map(link => link.getAttribute('href'))))
    .toEqual(featuredUrls);
}

async function checkResumeAction(page) {
  const link = page.getByRole('link', { name: 'Résumé', exact: true });
  await expect(link).toHaveCount(1);
  await expect(link).toBeInViewport({ ratio: 1 });
  await expect(link).toHaveAttribute('href', '/resume');
  await expect(page.locator('a[href$="/resume.pdf"]')).toHaveCount(0);
  return link;
}

test.describe('featured links without JavaScript', () => {
  test.use({ javaScriptEnabled: false, viewport: { width: 320, height: 568 } });

  test('public pages are reachable from the initial HTML', async ({ page }) => {
    await page.goto('/');
    await expect(page).toHaveTitle(portfolioTitle);
    await expect(page.getByRole('heading', { level: 1, name: portfolioHeading })).toBeInViewport();
    await expect(page.getByText(/building tools for open-source investigations/)).toBeInViewport();
    await checkLinks(page.getByRole('navigation', { name: 'Featured pages' }));
    await checkResumeAction(page);
  });
});

test('the static introduction fits above both project views', async ({ page }) => {
  for (const viewport of [{ width: 1280, height: 800 }, { width: 320, height: 568 }]) {
    await page.setViewportSize(viewport);
    await page.goto('/');
    await expect(page).toHaveTitle(portfolioTitle);
    await expect(page.getByRole('heading', { level: 1 })).toHaveText(portfolioHeading);
    await expect(page.locator('.portfolio-intro')).toBeInViewport({ ratio: 1 });
    for (const [button, section] of [['Board', '#stage'], ['List', '#list']]) {
      await page.getByRole('button', { name: button, exact: true }).click();
      const intro = await page.locator('.portfolio-intro').boundingBox();
      const view = await page.locator(section).boundingBox();
      expect(view.y).toBeGreaterThanOrEqual(intro.y + intro.height - 1);
      expect(view.height).toBeGreaterThan(0);
      await expect(page.getByRole('heading', { level: 1 })).toHaveCount(1);
      await checkResumeAction(page);
    }
  }
});

test('featured links fit on the small board and are available in List', async ({ page }) => {
  await page.setViewportSize({ width: 320, height: 568 });
  await page.goto('/');
  const listNav = page.locator('#list .featured-links');
  await checkLinks(listNav);
  await expect(page.locator('#stage')).toBeHidden();
  await expect(page.locator('#traces .trace-base')).toHaveCount(0);
  await expect(listNav).toBeInViewport({ ratio: 1 });
  await page.getByRole('button', { name: 'Board', exact: true }).click();
  await expect(page.locator('#traces .trace-base')).toHaveCount(14);
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

test('the primary résumé action opens HTML with PDF and Print actions', async ({ page }) => {
  await page.goto('/');
  const link = await checkResumeAction(page);
  await link.click();
  await expect(page).toHaveURL(/\/resume$/);
  const canonical = page.locator('head link[rel="canonical"]');
  await expect(canonical).toHaveCount(1);
  await expect(canonical).toHaveAttribute('href', 'https://blurxy.net/resume');
  const toolbar = page.getByRole('navigation', { name: 'Resume navigation' });
  await expect(toolbar.getByRole('link', { name: /PDF/ })).toHaveAttribute('href', '/resume.pdf');
  await expect(toolbar.getByRole('button', { name: 'Print' })).toBeVisible();
  await toolbar.getByRole('link', { name: 'blurxy', exact: true }).click();
  await expect(page).toHaveURL(/\/$/);
  await expect(page.getByRole('dialog', { name: 'Experience' })).toHaveCount(0);
});
