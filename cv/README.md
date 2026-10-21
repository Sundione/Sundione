# CV

The CV is generated from the same YAML files as the website, so the two never drift apart.

| What | Where |
| --- | --- |
| Content (edit this) | `src/content/*.yaml` — the CV uses the English (`en`) text |
| Layout and styling | `cv/template.tex` |
| Generator | `scripts/cv.mjs` |
| LaTeX packages needed | `cv/texlive-packages.txt` (also used by CI) |

## Build

```sh
npm run cv           # public CV → public/cv/ (served at /cv, linked from the site)
npm run cv:private   # adds phone and home address → cv/out/ (never published)
```

`npm run build` runs `npm run cv` first, so the deployed site always has a fresh CV.

The public CV has no phone number or home address. For the private one, copy
`cv/private.example.yaml` to `cv/private.yaml` (gitignored) and fill it in.

## Setup

- **TinyTeX** (pdflatex + latexmk), installed in `~/Library/TinyTeX`. Install missing packages with:
  `tlmgr install $(cat cv/texlive-packages.txt)`
- **pdftoppm** (optional, from poppler): makes the page previews on `/cv`. Without it the PDF still builds;
  CI always has it.
- **VS Code: LaTeX Workshop** — open a `.tex` file and save to build; the PDF opens in a tab.
  `docs/main.tex` (the old hand-written CV, gitignored) previews the same way.

## Markup in the YAML

- `**bold**` → bold on both the site and the CV.
- LaTeX special characters (`& % $ # _` …) are escaped for you — write plain text.
