import { defineCollection } from 'astro:content';
import { file } from 'astro/loaders';
import { z } from 'astro/zod';

// These collections are also read by scripts/cv.mjs to build the CV.
// Keep field names in sync with that script.

const localized = z.object({ en: z.string(), th: z.string() });
const yearMonth = z.string().regex(/^\d{4}-\d{2}$/, 'Use YYYY-MM');
const link = z.object({ label: z.string(), url: z.url() });

const profile = defineCollection({
  loader: file('src/content/profile.yaml'),
  schema: z.object({
    name: z.string(),
    role: localized,
    // Page title and search results, e.g. "Data Scientist & NLP Researcher".
    headline: localized,
    // Short introduction: the sidebar and the top of the CV.
    bio: localized,
    location: localized,
    email: z.email().nullable(),
    website: z.url(),
    photo: z.string().nullable(),
    highlight: z.object({ text: localized, href: z.string() }).optional(),
    links: z.array(link.extend({ cvLabel: z.string().optional() })),
    // Other profiles of yours, not shown on the page. They tell search engines these accounts are the same person.
    sameAs: z.array(z.url()).default([]),
  }),
});

const experience = defineCollection({
  loader: file('src/content/experience.yaml'),
  schema: z.object({
    company: z.string(),
    companyUrl: z.url().optional(),
    location: z.string(),
    role: localized,
    // e.g. a research collaboration, shown above the role.
    collaboration: z.object({ text: localized, url: z.url().optional() }).optional(),
    start: yearMonth,
    // Omit for a current position.
    end: yearMonth.optional(),
    summary: localized,
    // English bullet points for the one-page CV. Falls back to `summary.en`.
    cvHighlights: z.array(z.string()).optional(),
    skills: z.array(z.string()).default([]),
    tools: z.array(z.string()).default([]),
    links: z.array(link).default([]),
  }),
});

const education = defineCollection({
  loader: file('src/content/education.yaml'),
  schema: z.object({
    institution: z.string(),
    location: z.string(),
    degree: localized,
    honors: localized.optional(),
    // e.g. part-time
    mode: localized.optional(),
    gpa: z.string().optional(),
    start: yearMonth,
    end: yearMonth.optional(),
    expected: z.number().int().optional(),
    position: localized.optional(),
  }),
});

const publications = defineCollection({
  loader: file('src/content/publications.yaml'),
  schema: z
    .object({
      title: z.string(),
      authors: z.array(z.string()).min(1),
      venue: z.string(),
      date: yearMonth,
      // ACL Anthology id, e.g. 2026.findings-emnlp.2386
      anthology: z.string().optional(),
      doi: z.string().optional(),
      arxiv: z.string().optional(),
    })
    .refine((p) => p.anthology || p.doi || p.arxiv, 'Give an `anthology`, `doi` or `arxiv` id.'),
});

const awards = defineCollection({
  loader: file('src/content/awards.yaml'),
  schema: z.object({
    order: z.number().int(),
    title: localized,
    event: z.string(),
    program: z.string().optional(),
    year: z.number().int(),
  }),
});

export const collections = { profile, experience, education, publications, awards };
