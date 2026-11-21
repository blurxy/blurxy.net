import { readFileSync } from 'node:fs';
import { createRequire } from 'node:module';
import { expect, test } from '@playwright/test';

const require = createRequire(import.meta.url);
const fontFiles = new Map();
const fontStylesheet = [
  ['archivo', 'wdth', 'Archivo'],
  ['jetbrains-mono', 'wght', 'JetBrains Mono'],
]
  .map(([fontPackage, axis, family]) => {
    const packageName = '@fontsource-variable/' + fontPackage;
    const css = readFileSync(
      require.resolve(packageName + '/' + axis + '.css'),
      'utf8',
    );
    return css
      .replaceAll(family + ' Variable', family)
      .replace(/url\(\.\/files\/([\w-]+\.woff2)\)/g, (_, file) => {
        const requestPath = '/__visual_fonts/' + file;
        fontFiles.set(
          requestPath,
          require.resolve(packageName + '/files/' + file),
        );
        return "url('" + requestPath + "')";
      });
  })
  .join('\n');
const textSpacing = [
  '* { line-height: 1.5 !important; letter-spacing: 0.12em !important; word-spacing: 0.16em !important; }',
  'p { margin-bottom: 2em !important; }',
].join('\n');

export function visualCheck(
  name,
  { width, height, path = '/', touch = width <= 760, spacing = false },
  measure,
) {
  test.describe(width + '×' + height, () => {
    test.use({ viewport: { width, height }, hasTouch: touch, isMobile: touch });
    test(name, async ({ context, page, baseURL }, testInfo) => {
      const pageErrors = [];
      page.on('pageerror', (error) => pageErrors.push(error.message));
      const origin = new URL(baseURL).origin;
      await context.route('**/*', async (route) => {
        const url = new URL(route.request().url());
        if (
          url.origin === 'https://fonts.googleapis.com' &&
          url.pathname === '/css2'
        ) {
          // Web font versions are pinned so geometry checks are stable and offline.
          const body = fontStylesheet.replaceAll(
            "url('/",
            "url('" + origin + '/',
          );
          await route.fulfill({ contentType: 'text/css', body });
        } else if (url.origin === origin && fontFiles.has(url.pathname)) {
          await route.fulfill({
            path: fontFiles.get(url.pathname),
            contentType: 'font/woff2',
          });
        } else if (url.origin === origin) {
          await route.continue();
        } else {
          await route.abort();
        }
      });

      const response = await page.goto(path, { waitUntil: 'domcontentloaded' });
      expect(response?.ok(), 'The local preview must serve the page').toBe(
        true,
      );
      if (spacing) await page.addStyleTag({ content: textSpacing });
      const fonts = await page.evaluate(async () => {
        const faces = await Promise.all([
          document.fonts.load('400 14px Archivo'),
          document.fonts.load('500 11px "JetBrains Mono"'),
        ]);
        await document.fonts.ready;
        return faces.map((group) => group.length);
      });
      expect(
        fonts.every((count) => count > 0),
        'Archivo and JetBrains Mono must load',
      ).toBe(true);
      if (!path.startsWith('/resume'))
        await expect(page.locator('#stage')).not.toHaveClass(/\bpending\b/);

      const result = await measure(page);
      await testInfo.attach('measurements', {
        body: JSON.stringify(result, null, 2),
        contentType: 'application/json',
      });
      expect(pageErrors, 'Uncaught browser errors').toEqual([]);
      expect(result.ok, JSON.stringify(result)).toBe(true);
    });
  });
}
