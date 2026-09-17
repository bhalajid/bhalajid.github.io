# Portfolio tests

Two suites. The first needs no browser; the second drives a real one.

## 1. Content & DOM tests — `dom.test.js`

Checks structure, both languages, links, the persona filter, the theme/menu/project toggles,
and the **title-safety rules** (the page must never claim "PhD", "Dr.", "Doktortitel" or "Promotion").

```bash
npm install jsdom
node tests/dom.test.js
```

Expect: `42/42 passed`

## 2. Rendering tests — `render.test.js`

Real Chromium. Catches what jsdom structurally cannot: horizontal overflow, clipped elements,
responsive breakpoints, anchors landing behind the sticky navbar.

```bash
npm install playwright
npx playwright install chromium
node tests/render.test.js
```

Sweeps 15 viewport widths (320 → 2560px) plus mobile and desktop interaction flows.

> On macOS this works out of the box. On a bare Linux box you may need
> `npx playwright install-deps` for the system libraries Chromium links against.

## What these caught when written

- Horizontal overflow at 320px — every `minmax()` grid demanded more width than the screen had
- `picErr is not defined` — the portrait's fallback was declared *after* the image loaded, so it never ran
- Every nav anchor landing 28px behind the sticky navbar, hiding each section heading
- Nav links overflowing between 900–1180px before the hamburger appeared

## Adding to CI (optional)

`.github/workflows/test.yml`:

```yaml
name: tests
on: [push]
jobs:
  test:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v4
      - uses: actions/setup-node@v4
        with: { node-version: '20' }
      - run: npm install jsdom playwright
      - run: npx playwright install --with-deps chromium
      - run: node tests/dom.test.js
      - run: node tests/render.test.js
```

That puts a green check on the repo — visible evidence of the CI/CD and testing claims the
portfolio makes.
