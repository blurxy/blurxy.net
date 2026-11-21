import { visualCheck } from './visual-check.mjs';

const journal = (p) =>
  p.evaluate(() => {
    const sheet = document.querySelector('#sheet');
    const sb = sheet.getBoundingClientRect();
    const linked = [
      ...sheet.querySelectorAll(
        '.journal-entries li:has(button.journal-project)',
      ),
    ];
    const pairs = linked.map((li) => {
      const date = li.querySelector('time').getBoundingClientRect();
      const link = li.querySelector('button').getBoundingClientRect();
      const wrapped = link.top >= date.bottom - 1;
      return {
        gap:
          Math.round(
            (wrapped ? link.top - date.bottom : link.left - date.right) * 10,
          ) / 10,
        wrapped,
        h: Math.round(link.height),
      };
    });
    const narrow = innerWidth <= 760;
    const reflows = sheet.scrollWidth === sheet.clientWidth;
    const fills = !narrow || Math.round(sb.width) === innerWidth;
    return {
      ok:
        linked.length === 8 &&
        pairs.every((p) => p.gap >= (p.wrapped ? 3.5 : 11.5) && p.h >= 24) &&
        reflows &&
        fills,
      count: linked.length,
      pairs,
      sw: sheet.scrollWidth,
      cw: sheet.clientWidth,
      sheetWidth: sb.width,
      fills,
      reflows,
    };
  });
const figures = (p) =>
  p.evaluate(() => {
    const f = document.querySelector('.sh-vis'),
      svg = f.querySelector('svg');
    return {
      ok:
        f.clientHeight >= f.scrollHeight - 1 &&
        svg.getBoundingClientRect().height > 80,
      visibleHeight: f.clientHeight,
      contentHeight: f.scrollHeight,
      svgHeight: Math.round(svg.getBoundingClientRect().height),
    };
  });
const filter = async (p) => {
  await p.locator('#vFilter').click();
  await p.locator('#fQuery').fill('suricata');
  await p.waitForFunction(
    () => document.querySelector('#fCount').textContent === '2 / 14',
  );
  return p.evaluate(() => {
    const listButton = document.querySelector('#vList');
    const clearButton = document.querySelector('#fClear');
    const list = listButton.getBoundingClientRect();
    const clear = clearButton.getBoundingClientRect();
    const visibleTarget = (el) => {
      const { left, right, top, bottom, width, height } =
        el.getBoundingClientRect();
      return (
        getComputedStyle(el).visibility === 'visible' &&
        left >= 0 &&
        top >= 0 &&
        right <= innerWidth &&
        bottom <= innerHeight &&
        width >= 24 &&
        height >= 24
      );
    };
    const targets = [...document.querySelectorAll('#fStatuses button')].filter(
      visibleTarget,
    ).length;
    return {
      ok:
        visibleTarget(listButton) &&
        list.right <= innerWidth - 2 &&
        visibleTarget(clearButton) &&
        clear.width >= 32 &&
        clear.height >= 32 &&
        targets === 7,
      listRight: Math.round(list.right),
      clear: [Math.round(clear.width), Math.round(clear.height)],
      targets,
    };
  });
};
const fit = async (p) => {
  const board = p.locator('#vBoard');
  if ((await board.getAttribute('aria-pressed')) !== 'true')
    await board.click();
  await p.locator('#zFit').click();
  return p.evaluate(() => {
    const clip = document.querySelector('#stage').getBoundingClientRect();
    const boundBottom = Math.min(
      clip.bottom,
      document.querySelector('.hud').getBoundingClientRect().top,
      document.querySelector('.zoomer').getBoundingClientRect().top,
    );
    const cards = [
      ...document.querySelectorAll('#world .core,#world .mod,#world .journal'),
    ];
    const clipped = cards
      .filter((el) => {
        const r = el.getBoundingClientRect();
        return (
          r.left < clip.left - 1 ||
          r.top < clip.top - 1 ||
          r.right > clip.right + 1 ||
          r.bottom > boundBottom + 1
        );
      })
      .map((e) => e.dataset.key || 'hero');
    return {
      ok: cards.length === 17 && clipped.length === 0,
      cards: cards.length,
      clipped,
      boundBottom: Math.round(boundBottom),
      zoom: document.querySelector('#hZoom').textContent,
    };
  });
};
const resume = (p) =>
  p.evaluate(() => {
    const targets = [
      ...document.querySelectorAll(
        '.toolbar .actions a,.contact a,.copy-email',
      ),
    ].map((el) => {
      const r = el.getBoundingClientRect();
      return [
        el.dataset.copyEmail === undefined
          ? el.textContent.trim()
          : 'Copy email',
        Math.round(r.width),
        Math.round(r.height),
        getComputedStyle(el).visibility === 'visible',
      ];
    });
    return {
      ok:
        document.documentElement.scrollWidth === innerWidth &&
        targets.length === 5 &&
        targets.every(([, w, h, visible]) => visible && w >= 24 && h >= 24),
      overflow: document.documentElement.scrollWidth - innerWidth,
      targets,
    };
  });

for (const [width, height] of [
  [320, 568],
  [390, 844],
  [716, 680],
  [760, 720],
  [761, 720],
  [1280, 720],
  [1440, 900],
]) {
  visualCheck(
    'Journal metadata spacing and reflow',
    { width, height, path: '/#journal' },
    journal,
  );
}
visualCheck(
  'Journal reflows with text spacing overrides',
  {
    width: 320,
    height: 568,
    path: '/#journal',
    spacing: true,
  },
  journal,
);

for (const [width, height] of [
  [390, 844],
  [768, 580],
  [1024, 768],
  [1280, 720],
  [1440, 900],
]) {
  visualCheck(
    'IDS detail diagram and caption fit their frame',
    { width, height, path: '/#ids' },
    figures,
  );
}
for (const [width, height] of [
  [320, 568],
  [390, 844],
  [430, 932],
]) {
  visualCheck(
    'Filter controls and clear target fit',
    { width, height, spacing: width === 320 },
    filter,
  );
}
for (const [width, height] of [
  [390, 844],
  [768, 580],
  [900, 600],
  [1280, 720],
]) {
  visualCheck(
    'Board Fit places all 17 cards above the controls',
    { width, height },
    fit,
  );
}
for (const [width, height] of [
  [320, 568],
  [390, 844],
  [1280, 720],
]) {
  visualCheck(
    'Résumé contact targets fit the viewport',
    {
      width,
      height,
      path: '/resume',
      spacing: width === 320,
    },
    resume,
  );
}
