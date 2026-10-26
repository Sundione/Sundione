import fs from 'node:fs';
import path from 'node:path';
import type { ImageMetadata } from 'astro';
import { getImage } from 'astro:assets';
import { getEntry } from 'astro:content';

export async function getProfile() {
  const entry = await getEntry('profile', 'me');
  if (!entry) throw new Error('src/content/profile.yaml must have an entry named "me".');
  return entry.data;
}

const photos = import.meta.glob<{ default: ImageMetadata }>('/src/assets/*.{jpg,jpeg,png,webp,avif}', { eager: true });

/** The profile photo from src/assets/, or undefined when `photo` is null. */
export async function getProfilePhoto() {
  const { photo } = await getProfile();
  if (!photo) return undefined;
  const image = photos[`/src/assets/${photo}`]?.default;
  if (!image) throw new Error(`Profile photo src/assets/${photo} not found.`);
  return image;
}

/** The profile photo as a 512×512 JPEG for link previews and search results. */
export async function getShareImage(site: URL) {
  const photo = await getProfilePhoto();
  if (!photo) return undefined;
  const image = await getImage({ src: photo, width: 512, height: 512, format: 'jpg' });
  return { url: new URL(image.src, site).href, width: 512, height: 512 };
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
