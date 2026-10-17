# Review and fixes

## What the project is

A static, single-page course reader for *Algorithm Design & Analysis* (14 topics, 35 lessons). It's published from the repo root (`.nojekyll` + `index.html`, about 170 KB). Everything lives in one file: inline CSS, the HTML content, and a small inline script for topic search, theme switching (saved in `localStorage`) and highlighting the current section in the navigation. There is no build system, package manifest, test suite, README or secret anywhere in the repo.

Because most of the project is content, the review covered both the code and the technical accuracy of the material.

## Issues found

| # | Severity | Issue | Status |
|---|----------|-------|--------|
| 1 | Medium | Commit `a9920e5` removed internal links to the code archive (`#code-quick`, `#code-lcs`, `#code-jarvis`, `#code-graham`, …) but left their surrounding text behind. Readers saw broken sentences such as "See the  and .", "<p>.</p>", "… for n=4. .", "is retained, including its particular output conventions." with no subject, and "The  and its caveats remain available separately". There were 10 places in total. | Fixed |
| 2 | Low | Quick sort: "For the class example, p=2 …" refers to an input that the page never shows. In the earlier edition it appeared only in a scanned image. | Fixed |
| 3 | Low | DP cost summary used different symbols from the chapter text: coin change was `O(kA)/O(A)` but the chapter uses amount `B`; subset sum used target `S` but the chapter uses `T`. | Fixed |
| 4 | Info | The script hardcodes `14` in the search-count message. | Not changed (see below) |
| 5 | Info | External links have `rel="noopener noreferrer"` but no `target`. | Not changed (harmless) |

Checks that found no problems:
- No duplicate `id`s.
- Every `#anchor` link and every `label for=` points to an element that exists.
- Every element the script looks up exists (`search`, `count`, `theme`, `no-results`, `mobile-toc`).
- Tags are balanced.
- No CSS class is used without a definition, and no defined class goes unused.
- The script handles `localStorage` failures and only accepts the three known theme values.
- No `innerHTML` or other dynamic HTML injection, and no third-party scripts.

## Fixes applied (all in `index.html`)

1. **Removed the orphaned link remnants (issue 1).** Each fix is the smallest change that leaves a grammatical sentence: empty `<p>.</p>` blocks were deleted, trailing ` .` was dropped, and the two Graham/Jarvis sentences that pointed to the removed C++ listings were removed or shortened. No other content was touched.
2. **Quick sort example (issue 2).** Stated the input explicitly: the same 14-element array as merge sort, with first-element pivot 3. Partition produces `[1,2,3,8,12,6,19,4,10,17,15,14,9,5]` and returns `p=2`. I checked this by running the page's own `partition` pseudocode in Python; it reproduces the page's stated `p=2`, left part `[1,2]` and right part `[8,12,…,5]` exactly.
3. **DP cost table (issue 3).** Renamed the symbols to match the chapter: `O(kB)/O(B)`, with "k denominations, amount B" in the row label, and `O(nT)/O(T)`.

## Content verification

I recomputed the worked examples independently in Python. All of them match the page:
- 0/1 knapsack table (answer 12)
- Minimum-coin table (answer 2)
- LCS table for ENGINEERING / GENERATING (length 7)
- Subset-sum and backtracking traces
- RSA key `d=103`, `83^7 mod 143 = 8`, `8^103 mod 143 = 83`, the repeated-squaring residues, and `9 → 48 → 9`
- KMP LPS arrays for `abaabad`, `aaacaaaa`, `acacabacacabacacac`, `ababd`
- By hand: Dijkstra and Prim traces, the Ford–Fulkerson augmentations and final flow/cut (23), the Graham cross products, job sequencing (74 / 68), fractional knapsack (54.5), and the vertex-cover example

## Deliberately not fixed

- **Hardcoded `14` in the script:** it is correct for this edition, and changing it to `chapters.length` is cosmetic.
- **`rel` without `target`:** harmless, so no change.
- **"rebuilt 3 Oct 2026" date and footer edition text:** the date is editorial metadata, so it is the author's decision.
- **External links** (algs4, Cornell, rookiecoders.tech): not checked for reachability, because no network checks were run.
- **No README added:** this is a published page, not a codebase, and nothing referred to a README.

## Build / test results

The project has no build, test or lint commands. Checks run instead:
- `node --check` on the extracted inline script: OK.
- Python HTML parser tag-balance check: no errors and no unclosed tags.
- Scan for orphaned-link patterns (` .</p>`, `<p>.</p>`, `See the  and`, `<p> includes`): 0 left.
- No headless browser was available, so the search, theme and navigation behaviour was not tested in a real browser. The script itself was not modified.
