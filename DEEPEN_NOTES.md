# Second-pass review notes

Superpowers skills used: `superpowers:test-driven-development`, `superpowers:verification-before-completion` and `superpowers:systematic-debugging`.

## Scope

The repo is close to pure content. It is a single static `index.html` (about 172 KB) with inline CSS and two small inline scripts: a pre-paint theme script in `<head>`, and an end-of-body script for search, the theme picker, outline toggling and current-section highlighting. There is no package manifest, dependency, build or README. So this pass was kept light, as the brief asks. I read `REVIEW_FIXES.md` and `FRONTEND_NOTES.md` first and did not redo any of their work.

## What I examined

- Both inline scripts, line by line, after the frontend commit `4faeb75`. That commit added the head script after the first review had already run.
- Search filtering: `toLocaleLowerCase`, word splitting, hiding nav items, the no-results message and clearing with Escape. I found no defects. Chapter text is lower-cased once at load, so typing does not re-read the DOM.
- The theme selection paths, the `IntersectionObserver` guard and the outline open/close handlers.
- Markup integrity: unique ids, `#` link targets, `label for=` targets, ids the script looks up, and the hardcoded "14" against the real chapter count (14).
- Setup instructions: I served the folder with `python3 -m http.server` and got HTTP 200 for the full page (172,090 bytes). The instructions are accurate.

## Bug fixed (index.html, head script)

**Blocked storage ignored the OS dark mode.** The head script wrapped `localStorage.getItem` and the `prefers-color-scheme` fallback in one `try`. When storage access throws (cookies or site data blocked, some private modes), the whole block was skipped, so a reader whose OS is in dark mode got the light theme. Storage is now read in its own `try`, and the theme is then chosen as before. The script is also wrapped in `{…}`, so `t` does not become a global lexical binding that could clash with a later top-level `let`/`const t`.

TDD: the test `blocked localStorage still honours OS dark mode` failed first (`expected 'dark', actual 'light'`) and passes after the fix.

## Tests added

`tests/page.test.mjs` uses Node's built-in runner with no dependencies. Run it with `node --test`. Result: **9 tests, 9 pass, 0 fail** (Node v22.23.3).

1. A saved valid theme wins over the OS setting.
2. An unknown saved value falls back to the OS setting (dark and light).
3. Blocked `localStorage` still honours OS dark mode (regression test for the fix).
4. Both inline scripts parse.
5. Ids are unique, and every `href="#…"` and `label for=` resolves (scripts are excluded from the scan).
6. Every `getElementById` target and `.to-top` exists.
7. The chapter count equals the "14" hardcoded in the search-count text.
8. Every chapter is linked from each outline `<nav>`.
9. None of the orphaned-link remnants fixed in the first pass have come back.

Tests 1–3 run the real head script in a `vm` sandbox with stubbed `localStorage` and `matchMedia`. The other tests check the HTML statically.

I also re-ran the first pass's Python tag-balance check: 0 errors, no unclosed tags.

## Dependency updates

None. The project has no dependencies.

## Other changes

- `FRONTEND_NOTES.md`: one line under "How to run" that points to `node --test`.

## Deliberately left alone

- **Hardcoded `14` in the search count:** the first pass chose to keep it. Test 7 now fails if the chapter count and the text drift apart.
- **The search and outline behaviour in a real browser:** no browser automation is installed (only leftover Playwright temp directories in `/tmp`). The body script was not changed, and the previous pass tested it in headless Chromium.
- **Content accuracy:** the first pass recomputed the worked examples, so I did not repeat that.
- **External link reachability:** no network checks were run.
- **No CI workflow or README added:** nobody asked for them, and the page is published as is.
