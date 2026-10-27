export const FONT_PRESETS = {
  modern: { label: '现代黑体 · 微软雅黑', family: '"Microsoft YaHei", "PingFang SC", system-ui, sans-serif' },
  clean: { label: '清爽黑体 · 等线', family: 'DengXian, "Microsoft YaHei", "PingFang SC", sans-serif' },
  heavy: { label: '经典黑体 · 黑体', family: 'SimHei, "Heiti SC", "Microsoft YaHei", sans-serif' },
  system: { label: '系统无衬线', family: 'system-ui, -apple-system, "Segoe UI", sans-serif' }
};

export const DEFAULT_APPEARANCE = {
  name: { font: 'modern', size: 148, mobileSize: 68, weight: 800, letterSpacing: -3, lineHeight: 1.12, color: '#17141f', slant: 0 },
  role: { font: 'modern', size: 94, mobileSize: 46, weight: 700, letterSpacing: -2, lineHeight: 1.2, color: '#8056c5', slant: 0 },
  english: { font: 'system', size: 15, mobileSize: 10, weight: 500, letterSpacing: 7, lineHeight: 1.6, color: '#8b8598', slant: 0 },
  identity: { font: 'modern', size: 16, mobileSize: 11, weight: 400, letterSpacing: 0, lineHeight: 1.8, color: '#ffffff', slant: 0 },
  keywords: { font: 'modern', size: 20, mobileSize: 13, weight: 500, letterSpacing: 0, lineHeight: 1.6, color: '#ffffff', slant: 0 },
  layout: { left: 5.5, titleTop: 48, titleGap: 18, englishGap: 8, infoBottom: 84, infoGap: 15 }
};

function number(value, fallback, min, max) {
  const parsed = Number(value);
  return Number.isFinite(parsed) ? Math.min(max, Math.max(min, parsed)) : fallback;
}

export function normalizeAppearance(input = {}) {
  const output = {};
  const ranges = { name: [90, 180, 44, 96], role: [56, 120, 30, 68], english: [10, 24, 8, 16], identity: [12, 24, 9, 16], keywords: [14, 28, 10, 18] };
  for (const group of ['name', 'role', 'english', 'identity', 'keywords']) {
    const base = DEFAULT_APPEARANCE[group];
    const item = input[group] || {};
    const [min, max, mobileMin, mobileMax] = ranges[group];
    output[group] = {
      font: FONT_PRESETS[item.font] ? item.font : base.font,
      size: number(item.size, base.size, min, max),
      mobileSize: number(item.mobileSize, base.mobileSize, mobileMin, mobileMax),
      weight: number(item.weight, base.weight, 400, 900),
      letterSpacing: number(item.letterSpacing, base.letterSpacing, group === 'english' ? 0 : -6, group === 'english' ? 12 : 8),
      lineHeight: number(item.lineHeight, base.lineHeight, 1, 2.2),
      color: /^#[0-9a-f]{6}$/i.test(item.color || '') ? item.color : base.color,
      slant: number(item.slant, base.slant, -10, 10)
    };
  }
  const layout = input.layout || {};
  const base = DEFAULT_APPEARANCE.layout;
  output.layout = {
    left: number(layout.left, base.left, 3, 8),
    titleTop: number(layout.titleTop, base.titleTop, 24, 90),
    titleGap: number(layout.titleGap, base.titleGap, 4, 40),
    englishGap: number(layout.englishGap, base.englishGap, 0, 24),
    infoBottom: number(layout.infoBottom, base.infoBottom, 48, 125),
    infoGap: number(layout.infoGap, base.infoGap, 6, 30)
  };
  return output;
}

export function applyHeroAppearance(input, target = document.documentElement) {
  const appearance = normalizeAppearance(input);
  for (const group of ['name', 'role', 'english', 'identity', 'keywords']) {
    const item = appearance[group];
    const prefix = `--hero-${group}`;
    target.style.setProperty(`${prefix}-font`, FONT_PRESETS[item.font].family);
    target.style.setProperty(`${prefix}-size`, `${item.size}px`);
    target.style.setProperty(`${prefix}-fluid`, `${item.size / 14.4}vw`);
    target.style.setProperty(`${prefix}-mobile-size`, `${item.mobileSize}px`);
    target.style.setProperty(`${prefix}-weight`, item.weight);
    target.style.setProperty(`${prefix}-spacing`, `${item.letterSpacing}px`);
    target.style.setProperty(`${prefix}-spacing-fluid`, `${item.letterSpacing / 14.4}vw`);
    target.style.setProperty(`${prefix}-line`, item.lineHeight);
    target.style.setProperty(`${prefix}-color`, item.color);
    target.style.setProperty(`${prefix}-slant`, `${item.slant}deg`);
  }
  for (const [key, value] of Object.entries(appearance.layout)) {
    target.style.setProperty(`--hero-layout-${key}`, `${value}${key === 'left' ? '%' : 'px'}`);
  }
  return appearance;
}
