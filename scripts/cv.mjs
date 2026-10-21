#!/usr/bin/env node
// Builds the CV PDF and .tex from the same YAML content as the website.
//
//   npm run cv          Public CV in public/cv/ — served by the site at /cv.
//   npm run cv:private  Adds the phone number and home address from cv/private.yaml.
//                       Written to cv/out/ (gitignored), never to public/.
//
// Needs latexmk and pdflatex (TinyTeX: see cv/README.md). Page previews also
// need pdftoppm (poppler); without it the PDF is still built.

import { execFileSync, spawnSync } from 'node:child_process';
import fs from 'node:fs';
import os from 'node:os';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import { parse } from 'yaml';

const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');
const contentDir = path.join(root, 'src/content');
const isPrivate = process.argv.includes('--private');
const outDir = path.join(root, isPrivate ? 'cv/out' : 'public/cv');
const lang = 'en';

// ---------------------------------------------------------------------------
// Data

/** Reads a YAML collection from src/content/ as a list of entries, in file order. */
function readCollection(name) {
  const data = parse(fs.readFileSync(path.join(contentDir, `${name}.yaml`), 'utf8')) ?? {};
  return Object.entries(data).map(([id, entry]) => ({ id, ...entry }));
}

const byStartDesc = (a, b) => String(b.start).localeCompare(String(a.start));
const byOrder = (a, b) => a.order - b.order;

const [profile] = readCollection('profile');
const education = readCollection('education').sort(byStartDesc);
const experience = readCollection('experience').sort(byStartDesc);
const publications = readCollection('publications').sort((a, b) => String(b.date).localeCompare(String(a.date)));
const awards = readCollection('awards').sort(byOrder);

let privateDetails = {};
if (isPrivate) {
  const file = path.join(root, 'cv/private.yaml');
  if (!fs.existsSync(file)) fail('cv/private.yaml not found. Copy cv/private.example.yaml to cv/private.yaml first.');
  privateDetails = parse(fs.readFileSync(file, 'utf8')) ?? {};
}

// ---------------------------------------------------------------------------
// LaTeX helpers

const specialChars = {
  '\\': '\\textbackslash{}',
  '&': '\\&',
  '%': '\\%',
  $: '\\$',
  '#': '\\#',
  _: '\\_',
  '{': '\\{',
  '}': '\\}',
  '~': '\\textasciitilde{}',
  '^': '\\textasciicircum{}',
};

/** Escapes plain text for LaTeX. */
const esc = (text) => String(text).replace(/[\\&%$#_{}~^]/g, (c) => specialChars[c]);

/** Escapes text and turns **bold** into \textbf{bold}. */
const rich = (text) => esc(text).replace(/\*\*(.+?)\*\*/g, '\\textbf{$1}');

/** Escapes a URL for \href. */
const escUrl = (url) => String(url).replace(/[\\%#]/g, (c) => `\\${c}`);

const href = (url, label) => `\\href{${escUrl(url)}}{${esc(label)}}`;

/** A URL without the protocol, "www." and trailing slash, for display. */
const shortUrl = (url) => url.replace(/^https?:\/\/(www\.)?/, '').replace(/\/$/, '');

const formatMonth = (value) => {
  const [year, month] = String(value).split('-').map(Number);
  return new Intl.DateTimeFormat('en-US', { month: 'short', year: 'numeric' }).format(new Date(year, month - 1));
};

const dateRange = (start, end, open = 'Present') => `${formatMonth(start)} – ${end ? formatMonth(end) : open}`;

/** Where a publication lives: its DOI, or its arXiv page. The website uses the same labels. */
const publicationLink = (p) =>
  p.doi
    ? { url: `https://doi.org/${p.doi}`, label: `doi:${p.doi}` }
    : { url: `https://arxiv.org/abs/${p.arxiv}`, label: `arXiv:${p.arxiv}` };

const highlights = (items) =>
  items?.length
    ? ['\\begin{highlights}', ...items.map((item) => `    \\item ${item}`), '\\end{highlights}'].join('\n')
    : '';

/**
 * A two-column entry (title on the left, dates or a link on the right), then an
 * optional paragraph and bullet points underneath.
 */
function entry(left, right, { text, items } = {}) {
  const parts = [`\\begin{twocolentry}{${right}}\n    ${left}\n\\end{twocolentry}`];
  if (text || items?.length) {
    parts.push(
      '\\vspace{0.10cm}',
      ['\\begin{onecolentry}', text && `    ${text}`, highlights(items), '\\end{onecolentry}'].filter(Boolean).join('\n'),
    );
  }
  return parts.join('\n');
}

const section = (title, entries, gap = '0.26cm') => `\\section{${title}}\n\n${entries.join(`\n\n\\vspace{${gap}}\n\n`)}`;

// ---------------------------------------------------------------------------
// Sections

function header() {
  const contacts = [
    esc(isPrivate && privateDetails.address ? privateDetails.address : profile.location[lang]),
    profile.email && href(`mailto:${profile.email}`, profile.email),
    isPrivate && privateDetails.phone && href(`tel:${privateDetails.phone.tel}`, privateDetails.phone.label),
    ...profile.links.filter((l) => l.cvLabel).map((l) => href(l.url, l.cvLabel)),
    href(profile.website, shortUrl(profile.website)),
  ].filter(Boolean);

  return [
    '\\begin{header}',
    `    \\fontsize{25pt}{25pt}\\selectfont ${esc(profile.name)}`,
    '',
    '    \\vspace{5pt}',
    '',
    '    \\normalsize\\color{secondary}',
    contacts.map((c) => `    \\mbox{${c}}`).join('%\n    \\kern 5pt\\AND\\kern 5pt%\n'),
    '\\end{header}',
    '',
    '\\vspace{5pt - 0.3cm}',
  ].join('\n');
}

const summary = () =>
  section('Professional Summary', [`\\begin{onecolentry}\n    ${rich(profile.bio[lang])}\n\\end{onecolentry}`]);

/** A "Tools: …" bullet point. Skills and links stay on the website to keep the CV to one page. */
const detailItems = ({ tools }) => (tools?.length ? [`\\textbf{Tools:} \\textcolor{secondary}{${esc(tools.join(', '))}}`] : []);

const experienceSection = () =>
  section(
    'Experience',
    experience.map((e) => {
      const company = e.companyUrl ? href(e.companyUrl, e.company) : esc(e.company);
      const collab = e.collaboration
        ? e.collaboration.url
          ? href(e.collaboration.url, e.collaboration.text[lang])
          : esc(e.collaboration.text[lang])
        : null;
      return entry(
        // The location is left out: the header already says where you are based.
        `\\textbf{${esc(e.role[lang])}}, ${company}` +
          (collab ? ` \\newline \\textit{${collab}}` : ''),
        dateRange(e.start, e.end),
        e.cvHighlights?.length
          ? { items: [...e.cvHighlights.map(rich), ...detailItems(e)] }
          : { text: rich(e.summary[lang]), items: detailItems(e) },
      );
    }),
  );

const publicationsSection = () =>
  section(
    'Publications',
    publications.map((p) => {
      const authors = p.authors
        .map((a) => (a === profile.name ? `\\mbox{\\textcolor{primaryColor}{\\textbf{${esc(a)}}}}` : `\\mbox{${esc(a)}}`))
        .join(', ');
      const { url, label } = publicationLink(p);
      return [
        '\\begin{samepage}',
        `\\begin{twocolentry}{${formatMonth(p.date)}}\n    \\textbf{${esc(p.title)}}\n\\end{twocolentry}`,
        '\\vspace{0.10cm}',
        '\\begin{onecolentry}',
        `    \\textcolor{secondary}{${authors}}`,
        '',
        '    \\vspace{0.10cm}',
        '',
        `    \\textit{${esc(p.venue)}} -- ${href(url, label)}`,
        '\\end{onecolentry}',
        '\\end{samepage}',
      ].join('\n');
    }),
  );

const educationSection = () =>
  section(
    'Education',
    education.map((e) => {
      const notes = [
        e.mode?.[lang],
        e.honors?.[lang],
        e.gpa && `GPA ${e.gpa}`,
        e.expected && !e.end && `Expected Graduation: ${e.expected}`,
      ].filter(Boolean);
      const degree = esc(e.degree[lang]) + (notes.length ? ` (${esc(notes.join('; '))})` : '');
      return entry(`\\textbf{${esc(e.institution)}, ${esc(e.location)}}, \\newline ${degree}`, dateRange(e.start, e.end), {
        items: e.position ? [esc(e.position[lang])] : [],
      });
    }),
  );

/**
 * Awards grouped by program (one entry each), with one bullet per title:
 * "1st Runner-Up – Hackathon A; Hackathon B".
 */
function awardsSection() {
  const programs = new Map();
  for (const a of awards) {
    const name = a.program ?? a.event;
    if (!programs.has(name)) programs.set(name, { name, year: a.year, titles: new Map() });
    const titles = programs.get(name).titles;
    const title = a.title[lang];
    if (!titles.has(title)) titles.set(title, []);
    if (a.program) titles.get(title).push(esc(a.event));
  }
  // A title won for the program itself (e.g. Bronze Medal) goes on the program's line.
  return section(
    'Awards',
    [...programs.values()].map((p) => {
      const entries = [...p.titles];
      const own = entries.filter(([, events]) => events.length === 0).map(([title]) => esc(title));
      const items = entries
        .filter(([, events]) => events.length > 0)
        .map(([title, events]) => `\\textbf{${esc(title)}} -- ${events.join('; ')}`);
      return entry(`\\textbf{${esc(p.name)}}${own.length ? ` -- ${own.join(', ')}` : ''}`, p.year, { items });
    }),
  );
}

const body = [
  header(),
  summary(),
  experience.length && experienceSection(),
  publications.length && publicationsSection(),
  education.length && educationSection(),
  awards.length && awardsSection(),
]
  .filter(Boolean)
  .join('\n\n');

// ---------------------------------------------------------------------------
// Build

function fail(message) {
  console.error(`cv: ${message}`);
  process.exit(1);
}

/** True if `command` runs. `versionFlag` differs between tools (pdftoppm only knows -v). */
function hasCommand(command, versionFlag = '--version') {
  return spawnSync(command, [versionFlag], { stdio: 'ignore' }).status === 0;
}

/** Width and height of a PNG, read from its header. */
function pngSize(file) {
  const header = fs.readFileSync(file).subarray(16, 24);
  return { width: header.readUInt32BE(0), height: header.readUInt32BE(4) };
}

const baseName = `${profile.name.replace(/\s+/g, '_')}_CV${isPrivate ? '_private' : ''}`;
const template = fs.readFileSync(path.join(root, 'cv/template.tex'), 'utf8');
const tex = template
  .replace('<<PDF_TITLE>>', esc(`${profile.name} – CV`))
  .replace('<<PDF_AUTHOR>>', esc(profile.name))
  .replace('<<BODY>>', body);

if (!hasCommand('latexmk')) fail('latexmk not found. Install TinyTeX and the packages in cv/texlive-packages.txt (see cv/README.md).');

// Build in a temporary directory so LaTeX's auxiliary files never land in the repo.
const buildDir = fs.mkdtempSync(path.join(os.tmpdir(), 'cv-'));
fs.writeFileSync(path.join(buildDir, `${baseName}.tex`), tex);
const latex = spawnSync('latexmk', ['-pdf', '-interaction=nonstopmode', '-halt-on-error', `${baseName}.tex`], {
  cwd: buildDir,
  encoding: 'utf8',
});
if (latex.status !== 0) {
  const log = fs.readFileSync(path.join(buildDir, `${baseName}.log`), 'utf8');
  console.error(log.split('\n').filter((line) => line.startsWith('!') || /^l\.\d+/.test(line)).join('\n'));
  fail(`LaTeX failed. Full log: ${path.join(buildDir, `${baseName}.log`)}`);
}

fs.rmSync(outDir, { recursive: true, force: true });
fs.mkdirSync(outDir, { recursive: true });
fs.copyFileSync(path.join(buildDir, `${baseName}.pdf`), path.join(outDir, `${baseName}.pdf`));
fs.writeFileSync(path.join(outDir, `${baseName}.tex`), tex);

// Page previews for the /cv page.
const pages = [];
if (!isPrivate) {
  if (hasCommand('pdftoppm', '-v')) {
    execFileSync('pdftoppm', ['-png', '-r', '150', `${baseName}.pdf`, path.join(outDir, 'page')], { cwd: outDir });
    const files = fs.readdirSync(outDir).filter((f) => /^page-\d+\.png$/.test(f)).sort();
    pages.push(...files.map((file) => ({ file, ...pngSize(path.join(outDir, file)) })));
  } else {
    console.warn('cv: pdftoppm not found — skipping page previews (install poppler to get them).');
  }
  const manifest = { pdf: `${baseName}.pdf`, tex: `${baseName}.tex`, pages, updated: new Date().toISOString().slice(0, 10) };
  fs.writeFileSync(path.join(outDir, 'cv.json'), `${JSON.stringify(manifest, null, 2)}\n`);
}

fs.rmSync(buildDir, { recursive: true, force: true });
console.log(
  `cv: wrote ${path.relative(root, path.join(outDir, `${baseName}.pdf`))}` +
    (pages.length ? ` (${pages.length} page${pages.length === 1 ? '' : 's'}, with previews)` : ''),
);
