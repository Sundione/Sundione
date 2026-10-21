import fs from 'node:fs';
import path from 'node:path';
import { getEntry } from 'astro:content';

export async function getProfile() {
  const entry = await getEntry('profile', 'me');
  if (!entry) throw new Error('src/content/profile.yaml must have an entry named "me".');
  return entry.data;
}

export interface CvManifest {
  pdf: string;
  tex: string;
  pages: { file: string; width: number; height: number }[];
  updated: string;
}

/** Reads the manifest written by `npm run cv`, or null if the CV has not been built. */
export function getCvManifest(): CvManifest | null {
  const file = path.join(process.cwd(), 'public/cv/cv.json');
  return fs.existsSync(file) ? JSON.parse(fs.readFileSync(file, 'utf8')) : null;
}
