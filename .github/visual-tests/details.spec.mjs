import { visualCheck } from './visual-check.mjs';

for (const [width, height, touch] of [
  [390, 844, true],
  [1280, 720, false],
]) {
  visualCheck(
    'All 14 project diagrams are fully visible',
    { width, height, touch },
    async (p) => {
      const keys = await p
        .locator('#world .mod')
        .evaluateAll((els) => els.map((el) => el.dataset.key));
      const measurements = [];
      for (const key of keys) {
        await p.evaluate((key) => {
          location.hash = key;
        }, key);
        await p.waitForFunction(
          (k) => document.querySelector('#world .mod.sel')?.dataset.key === k,
          key,
        );
        measurements.push(
          await p.evaluate((key) => {
            const figure = document.querySelector('#sheet .sh-vis');
            const bottom = figure.getBoundingClientRect().bottom;
            const nextTop =
              figure.nextElementSibling.getBoundingClientRect().top;
            return {
              key,
              frame: figure.clientHeight,
              content: figure.scrollHeight,
              clear: nextTop >= bottom,
              svg: figure.querySelector('svg').getBoundingClientRect().height,
            };
          }, key),
        );
      }
      const failures = measurements.filter(
        (x) => x.frame < x.content - 1 || !x.clear || x.svg < 60,
      );
      return {
        ok: keys.length === 14 && failures.length === 0,
        count: keys.length,
        failures,
        measurements,
      };
    },
  );
}
visualCheck(
  'Landscape drawer fits and conceals covered controls',
  { width: 568, height: 260 },
  async (p) => {
    await p.locator('#vBoard').click();
    await p.locator('#vFilter').click();
    await p.locator('#fQuery').fill('suricata');
    await p.locator('#fReset').focus();
    const detail = await p.evaluate(() => {
      const bar = document.querySelector('#filterBar').getBoundingClientRect();
      const reset = document.querySelector('#fReset').getBoundingClientRect();
      return {
        barBottom: Math.round(bar.bottom),
        resetBottom: Math.round(reset.bottom),
        visibleLinks: [...document.querySelectorAll('.hud a')].filter(
          (e) => getComputedStyle(e).visibility === 'visible',
        ).length,
      };
    });
    return {
      ok:
        detail.barBottom <= 260 &&
        detail.resetBottom <= 260 &&
        detail.visibleLinks === 0,
      ...detail,
    };
  },
);
visualCheck(
  'Tablet search and section labels fit',
  { width: 768, height: 720, path: '/?zone=security' },
  async (p) => {
    const widths = await p.evaluate(() => {
      const canvas = document.createElement('canvas').getContext('2d');
      return ['fZone', 'fQuery'].map((id) => {
        const el = document.getElementById(id);
        const css = getComputedStyle(el);
        canvas.font = css.font;
        const available =
          el.clientWidth -
          parseFloat(css.paddingLeft) -
          parseFloat(css.paddingRight);
        const options = el.options
          ? [...el.options].map((op) => op.textContent)
          : [el.placeholder];
        return {
          id,
          available,
          required: Math.ceil(
            Math.max(...options.map((t) => canvas.measureText(t).width)),
          ),
        };
      });
    });
    return { ok: widths.every((x) => x.available >= x.required), widths };
  },
);
visualCheck(
  'Résumé reflows with simulated 200% text',
  { width: 320, height: 568, path: '/resume' },
  async (p) => {
    await p.addStyleTag({
      content:
        '.toolbar {font-size:24px !important} .toolbar .brand{font-size:42px !important} .contact {font-size:20px !important}',
    });
    const right = await p
      .locator('.toolbar .actions')
      .evaluate((el) => el.getBoundingClientRect().right);
    const scroll = await p.evaluate(() => document.documentElement.scrollWidth);
    return {
      ok: right <= 320 && scroll === 320,
      right: Math.round(right),
      scroll,
    };
  },
);
visualCheck(
  'Résumé print hides screen controls',
  { width: 1000, height: 900, path: '/resume' },
  async (p) => {
    const copy = p.locator('.copy-email');
    const toolbar = p.locator('.toolbar');
    const visibleOnScreen =
      (await copy.isVisible()) && (await toolbar.isVisible());
    await p.emulateMedia({ media: 'print' });
    const hiddenInPrint =
      !(await copy.isVisible()) && !(await toolbar.isVisible());
    return {
      ok: visibleOnScreen && hiddenInPrint,
      visibleOnScreen,
      hiddenInPrint,
    };
  },
);
visualCheck(
  'Journal text contrast reaches 4.5:1',
  { width: 716, height: 680, path: '/#journal' },
  async (p) => {
    const colors = await p.evaluate(() => {
      const rgb = (s) =>
        s
          .match(/\d+(?:\.\d+)?/g)
          .slice(0, 3)
          .map(Number);
      const luminance = (rgb) =>
        rgb
          .map((v) => {
            const t = v / 255;
            return t <= 0.04045 ? t / 12.92 : ((t + 0.055) / 1.055) ** 2.4;
          })
          .reduce((sum, v, i) => sum + v * [0.2126, 0.7152, 0.0722][i], 0);
      const bg = luminance(
        rgb(getComputedStyle(document.querySelector('#sheet')).backgroundColor),
      );
      return [
        '.journal-entries time',
        '.journal-entries .journal-project',
        '.journal-entries dd',
      ].map((selector) => {
        const fg = luminance(
          rgb(getComputedStyle(document.querySelector(selector)).color),
        );
        return [
          selector,
          Number(
            ((Math.max(bg, fg) + 0.05) / (Math.min(bg, fg) + 0.05)).toFixed(2),
          ),
        ];
      });
    });
    return { ok: colors.every(([, ratio]) => ratio >= 4.5), colors };
  },
);
