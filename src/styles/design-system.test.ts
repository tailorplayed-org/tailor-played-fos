import { describe, it, expect } from 'vitest';
import * as sass from 'sass';
import path from 'node:path';
import fs from 'node:fs';

const stylesDir = path.resolve(__dirname);
const projectRoot = path.resolve(__dirname, '../..');

/**
 * Helper to compile an SCSS string with additionalData (variables + mixins)
 * matching the Vite config's additionalData pattern.
 */
function compileScss(scssContent: string): string {
  const additionalData = `@use "${stylesDir}/variables" as *; @use "${stylesDir}/mixins" as *;\n`;
  const result = sass.compileString(additionalData + scssContent, {
    loadPaths: [stylesDir, projectRoot],
  });
  return result.css;
}

/**
 * Helper to compile a file directly.
 * When withAdditionalData is true, simulates Vite's additionalData prepend.
 */
function compileScssFile(filePath: string, withAdditionalData = false): string {
  if (withAdditionalData) {
    const content = fs.readFileSync(filePath, 'utf-8');
    const additionalData = `@use "${stylesDir}/variables" as *; @use "${stylesDir}/mixins" as *;\n`;
    const result = sass.compileString(additionalData + content, {
      loadPaths: [stylesDir, projectRoot, path.dirname(filePath)],
    });
    return result.css;
  }
  const result = sass.compile(filePath, {
    loadPaths: [stylesDir, projectRoot],
  });
  return result.css;
}

// ─────────────────────────────────────────────
// Task 1: _variables.scss — Design Tokens
// ─────────────────────────────────────────────
describe('_variables.scss — Design Tokens (AC #1)', () => {
  let css: string;

  // :root block is now in global.scss (not _variables.scss) to prevent
  // duplication via additionalData. Compile global.scss for :root tests.
  beforeAll(() => {
    css = compileScssFile(path.join(stylesDir, 'global.scss'), true);
  });

  it('generates a :root block with CSS Custom Properties', () => {
    expect(css).toContain(':root');
  });

  // Background colors
  it.each([
    ['--color-bg-primary', '#120022'],
    ['--color-bg-secondary', '#1e0038'],
    ['--color-bg-tertiary', '#2d0052'],
    ['--color-bg-elevated', '#3d006d'],
  ])('defines %s as %s', (prop, value) => {
    expect(css).toContain(`${prop}: ${value}`);
  });

  // Brand & Accent
  it.each([
    ['--color-gold', '#fcb700'],
    ['--color-gold-light', '#ffd54f'],
    ['--color-brand-purple', '#3c0366'],
  ])('defines %s as %s', (prop, value) => {
    expect(css).toContain(`${prop}: ${value}`);
  });

  // Semantic colors
  it.each([
    ['--color-success', '#00BA7B'],
    ['--color-warning', '#FA9700'],
    ['--color-error', '#ff4d6d'],
    ['--color-info', '#2A7EFF'],
  ])('defines %s (case-insensitive)', (prop, value) => {
    // Sass may lowercase hex values
    expect(css.toLowerCase()).toContain(`${prop}: ${value}`.toLowerCase());
  });

  // Text hierarchy
  it.each([
    ['--color-text-primary', '#ffd54f'],
    ['--color-text-secondary'],
    ['--color-text-muted'],
  ])('defines %s', (prop) => {
    expect(css).toContain(prop);
  });

  // Border
  it('defines --color-border-subtle', () => {
    expect(css).toContain('--color-border-subtle');
  });

  // Typography
  it.each([
    ['--text-2xl', '2.5rem'],
    ['--text-xl', '1.875rem'],
    ['--text-lg', '1.25rem'],
    ['--text-base', '1.125rem'],
    ['--text-sm', '1rem'],
    ['--text-xs', '0.875rem'],
  ])('defines %s as %s', (prop, value) => {
    expect(css).toContain(`${prop}: ${value}`);
  });

  it.each([
    ['--font-regular', '400'],
    ['--font-medium', '500'],
    ['--font-semibold', '600'],
  ])('defines %s as %s', (prop, value) => {
    expect(css).toContain(`${prop}: ${value}`);
  });

  it.each([
    ['--leading-tight', '1.2'],
    ['--leading-normal', '1.5'],
    ['--leading-relaxed', '1.75'],
  ])('defines %s as %s', (prop, value) => {
    expect(css).toContain(`${prop}: ${value}`);
  });

  // Spacing
  it.each([
    ['--space-xs', '4px'],
    ['--space-sm', '8px'],
    ['--space-md', '16px'],
    ['--space-lg', '24px'],
    ['--space-xl', '32px'],
    ['--space-2xl', '48px'],
    ['--space-3xl', '64px'],
  ])('defines %s as %s', (prop, value) => {
    expect(css).toContain(`${prop}: ${value}`);
  });

  // Border radius
  it.each([
    ['--radius-sm', '8px'],
    ['--radius-md', '12px'],
    ['--radius-lg', '16px'],
    ['--radius-xl', '24px'],
    ['--radius-full', '9999px'],
  ])('defines %s as %s', (prop, value) => {
    expect(css).toContain(`${prop}: ${value}`);
  });

  // Shadows
  it.each([
    ['--shadow-sm'],
    ['--shadow-md'],
    ['--shadow-lg'],
    ['--shadow-glow'],
  ])('defines %s', (prop) => {
    expect(css).toContain(prop);
  });

  // Transitions
  it.each([
    ['--transition-fast', '150ms ease'],
    ['--transition-normal', '300ms ease'],
    ['--transition-slow', '500ms ease-out'],
  ])('defines %s as %s', (prop, value) => {
    expect(css).toContain(`${prop}: ${value}`);
  });
});

// Verify SCSS variables are accessible via additionalData pattern
describe('_variables.scss — SCSS variable accessibility', () => {
  it('provides SCSS variables usable in component modules', () => {
    const css = compileScss('.test { color: $gold; background: $bg-primary; }');
    expect(css).toContain('color: #fcb700');
    expect(css).toContain('background: #120022');
  });
});

// ─────────────────────────────────────────────
// Task 2: _mixins.scss — Design System Mixins
// ─────────────────────────────────────────────
describe('_mixins.scss — Design System Mixins (AC #2)', () => {
  it('card-surface applies bg-tertiary, radius-lg, shadow-md', () => {
    const css = compileScss('.card { @include card-surface; }');
    expect(css).toContain('background-color');
    expect(css).toContain('border-radius: 16px');
    expect(css).toContain('box-shadow');
  });

  it('elevated-surface applies bg-elevated, radius-lg, shadow-lg', () => {
    const css = compileScss('.el { @include elevated-surface; }');
    expect(css).toContain('background-color');
    expect(css).toContain('border-radius: 16px');
  });

  it('focus-ring applies gold outline', () => {
    const css = compileScss('.fr { @include focus-ring; }');
    expect(css).toContain('outline: 2px solid #fcb700');
    expect(css).toContain('outline-offset: 2px');
  });

  it('interactive-reset strips defaults and adds focus-ring', () => {
    const css = compileScss('.btn { @include interactive-reset; }');
    expect(css).toContain('appearance: none');
    expect(css).toContain('cursor: pointer');
    expect(css).toContain('focus-visible');
  });

  it('rtl wraps content in [dir=rtl] selector', () => {
    const css = compileScss('.item { @include rtl { padding-inline-start: 8px; } }');
    // Sass may compile [dir="rtl"] as [dir=rtl] (quotes stripped)
    expect(css).toMatch(/\[dir=.?rtl.?\]/);
  });

  it('flex-center applies flexbox center', () => {
    const css = compileScss('.fc { @include flex-center; }');
    expect(css).toContain('display: flex');
    expect(css).toContain('align-items: center');
    expect(css).toContain('justify-content: center');
  });

  it('flex-column-center applies flex column center', () => {
    const css = compileScss('.fcc { @include flex-column-center; }');
    expect(css).toContain('flex-direction: column');
  });

  it('truncate applies ellipsis overflow', () => {
    const css = compileScss('.t { @include truncate; }');
    expect(css).toContain('text-overflow: ellipsis');
    expect(css).toContain('white-space: nowrap');
  });

  it('line-clamp applies multi-line truncation', () => {
    const css = compileScss('.lc { @include line-clamp(3); }');
    expect(css).toContain('-webkit-line-clamp: 3');
  });

  it('smooth-transition applies 300ms ease transition', () => {
    const css = compileScss('.st { @include smooth-transition(opacity, transform); }');
    expect(css).toContain('transition-duration: 300ms');
    expect(css).toContain('transition-timing-function: ease');
  });

  it('gold-glow applies shadow-glow', () => {
    const css = compileScss('.gg { @include gold-glow; }');
    expect(css).toContain('box-shadow');
  });

  it('visually-hidden provides screen-reader-only styles', () => {
    const css = compileScss('.vh { @include visually-hidden; }');
    expect(css).toContain('position: absolute');
    expect(css).toContain('clip: rect(0, 0, 0, 0)');
  });

  it('motion-safe wraps in prefers-reduced-motion: no-preference', () => {
    const css = compileScss('.ms { @include motion-safe { animation: fadeIn 300ms; } }');
    expect(css).toContain('prefers-reduced-motion: no-preference');
  });

  it('responsive breakpoint mixins generate correct media queries', () => {
    const sms = compileScss('.x { @include sm { display: block; } }');
    const mds = compileScss('.x { @include md { display: block; } }');
    const lgs = compileScss('.x { @include lg { display: block; } }');
    const xls = compileScss('.x { @include xl { display: block; } }');
    expect(sms).toContain('min-width: 640px');
    expect(mds).toContain('min-width: 768px');
    expect(lgs).toContain('min-width: 1024px');
    expect(xls).toContain('min-width: 1280px');
  });
});

// ─────────────────────────────────────────────
// Task 3: _animations.scss — Keyframes
// ─────────────────────────────────────────────
describe('_animations.scss — Keyframes (AC #3)', () => {
  let css: string;

  beforeAll(() => {
    // Animations imports variables via additionalData context
    css = compileScss(`@use "${stylesDir}/animations";`);
  });

  it.each([
    'fadeIn', 'slideUp', 'scaleIn', 'slideDown',
    'pulse', 'shimmer', 'spin', 'tooltipFadeIn',
  ])('defines @keyframes %s', (name) => {
    expect(css).toContain(`@keyframes ${name}`);
  });

  it('defines stagger delay utility classes', () => {
    for (let i = 1; i <= 5; i++) {
      expect(css).toContain(`.animate-delay-${i}`);
    }
  });

  it('does not duplicate prefers-reduced-motion (consolidated in _accessibility.scss)', () => {
    // Reduced motion handling is consolidated in _accessibility.scss
    // to avoid duplicate CSS. _animations.scss should NOT contain its own copy.
    expect(css).not.toContain('prefers-reduced-motion: reduce');
  });
});

// ─────────────────────────────────────────────
// Task 4: _accessibility.scss
// ─────────────────────────────────────────────
describe('_accessibility.scss (AC #4)', () => {
  let css: string;

  beforeAll(() => {
    css = compileScss(`@use "${stylesDir}/accessibility";`);
  });

  it('defines .sr-only class', () => {
    expect(css).toContain('.sr-only');
    expect(css).toContain('position: absolute');
  });

  it('defines :focus-visible global focus ring', () => {
    expect(css).toContain(':focus-visible');
    expect(css).toContain('outline');
  });

  it('supports forced-colors: active', () => {
    expect(css).toContain('forced-colors: active');
  });

  it('has reduced motion media query preserving .motion-essential', () => {
    expect(css).toContain('prefers-reduced-motion: reduce');
    expect(css).toContain('.motion-essential');
  });
});

// ─────────────────────────────────────────────
// Task 5: global.scss — Full Global Styles
// ─────────────────────────────────────────────
describe('global.scss — Global Styles (AC #5)', () => {
  let css: string;

  beforeAll(() => {
    // global.scss relies on Vite's additionalData for variables/mixins
    css = compileScssFile(path.join(stylesDir, 'global.scss'), true);
  });

  it('applies box-sizing reset', () => {
    expect(css).toContain('box-sizing: border-box');
  });

  it('defines @font-face for Fredoka with all subsets', () => {
    expect(css).toContain('@font-face');
    expect(css).toContain("font-family: \"Fredoka\"");
    expect(css).toContain('font-display: swap');
    expect(css).toContain('font-weight: 300 700');
    // Three font-face declarations (Latin, Latin-Ext, Hebrew)
    expect(css).toContain('Fredoka-Variable.woff2');
    expect(css).toContain('Fredoka-Variable-LatinExt.woff2');
    expect(css).toContain('Fredoka-Variable-Hebrew.woff2');
  });

  it('sets body background and text color from design tokens', () => {
    expect(css).toContain('background-color: #120022');
    expect(css).toContain('color: #ffd54f');
  });

  it('applies antialiased font rendering', () => {
    expect(css).toContain('-webkit-font-smoothing: antialiased');
  });

  it('applies scroll-behavior: smooth only within prefers-reduced-motion: no-preference', () => {
    expect(css).toContain('prefers-reduced-motion: no-preference');
    expect(css).toContain('scroll-behavior: smooth');
    // Verify smooth scrolling is inside the media query, not on html directly
    expect(css).toMatch(/prefers-reduced-motion:\s*no-preference\)\s*\{[^}]*scroll-behavior:\s*smooth/);
  });

  it('styles scrollbar thumb with brand-purple and track with bg-primary', () => {
    expect(css).toContain('::-webkit-scrollbar');
    // Thumb should use brand-purple
    expect(css).toMatch(/::-webkit-scrollbar-thumb\s*\{[^}]*background:\s*#3c0366/);
    // Track should use bg-primary
    expect(css).toMatch(/::-webkit-scrollbar-track\s*\{[^}]*background:\s*#120022/);
    // Firefox scrollbar
    expect(css).toContain('scrollbar-color: #3c0366 #120022');
  });

  it('styles text selection with gold color on purple background', () => {
    expect(css).toMatch(/::selection\s*\{[^}]*background-color:\s*#3c0366/);
    expect(css).toMatch(/::selection\s*\{[^}]*color:\s*#fcb700/);
  });

  it('styles h1-h6 headings with gold color, semibold weight, tight line height', () => {
    // Headings group should use gold color
    expect(css).toMatch(/h1,\s*\n?\s*h2,\s*\n?\s*h3,\s*\n?\s*h4,\s*\n?\s*h5,\s*\n?\s*h6\s*\{[^}]*color:\s*#fcb700/);
    expect(css).toMatch(/h1,\s*\n?\s*h2,\s*\n?\s*h3,\s*\n?\s*h4,\s*\n?\s*h5,\s*\n?\s*h6\s*\{[^}]*font-weight:\s*600/);
    expect(css).toMatch(/h1,\s*\n?\s*h2,\s*\n?\s*h3,\s*\n?\s*h4,\s*\n?\s*h5,\s*\n?\s*h6\s*\{[^}]*line-height:\s*1\.2/);
  });

  it('imports animations partial', () => {
    // If animations are imported, keyframes should appear
    expect(css).toContain('@keyframes fadeIn');
  });

  it('imports accessibility partial', () => {
    expect(css).toContain('.sr-only');
  });
});

// ─────────────────────────────────────────────
// Task 6: Fredoka Font File
// ─────────────────────────────────────────────
describe('Fredoka Font (AC #6)', () => {
  it('Fredoka-Variable.woff2 (Latin) exists in public/fonts/', () => {
    const fontPath = path.join(projectRoot, 'public/fonts/Fredoka-Variable.woff2');
    expect(fs.existsSync(fontPath)).toBe(true);
  });

  it('Fredoka-Variable-LatinExt.woff2 exists in public/fonts/', () => {
    const fontPath = path.join(projectRoot, 'public/fonts/Fredoka-Variable-LatinExt.woff2');
    expect(fs.existsSync(fontPath)).toBe(true);
  });

  it('Fredoka-Variable-Hebrew.woff2 exists in public/fonts/', () => {
    const fontPath = path.join(projectRoot, 'public/fonts/Fredoka-Variable-Hebrew.woff2');
    expect(fs.existsSync(fontPath)).toBe(true);
  });

  it('.gitkeep is removed from public/fonts/', () => {
    const gitkeepPath = path.join(projectRoot, 'public/fonts/.gitkeep');
    expect(fs.existsSync(gitkeepPath)).toBe(false);
  });
});
