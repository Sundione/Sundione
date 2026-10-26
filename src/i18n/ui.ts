export const locales = ['en', 'th'] as const;
export type Locale = (typeof locales)[number];

/** A piece of text written in every supported language. */
export type Localized<T = string> = Record<Locale, T>;

export const localeLabels: Localized = {
  en: 'EN',
  th: 'ไทย',
};

const ui = {
  en: {
    'nav.label': 'Sections',
    'nav.experience': 'Experience',
    'nav.publications': 'Publications',
    'nav.education': 'Education',
    'nav.awards': 'Awards',
    'nav.contact': 'Contact',
    'nav.language': 'Language',
    'theme.toggle': 'Toggle dark mode',
    'profile.photo': 'Photo of',
    'cta.cv': 'Download CV',
    'cta.cvView': 'View online',
    'label.email': 'Email',
    'label.skills': 'Skills',
    'label.tools': 'Tools',
    'experience.present': 'Present',
    'education.expected': 'Expected',
    'contact.body': 'Open to new opportunities. The fastest way to reach me is by email.',
    'cv.title': 'CV',
    'cv.pdf': 'Download PDF',
    'cv.tex': 'LaTeX source (.tex)',
    'cv.updated': 'Updated',
    'cv.language': 'The CV is in English.',
    'cv.noPreview': 'Preview images are not available. Open the PDF instead.',
    'cv.missing': 'The CV has not been built yet. Run `npm run cv`.',
    'footer.built': 'Built with Astro.',
  },
  th: {
    'nav.label': 'หัวข้อ',
    'nav.experience': 'ประสบการณ์',
    'nav.publications': 'งานตีพิมพ์',
    'nav.education': 'การศึกษา',
    'nav.awards': 'รางวัล',
    'nav.contact': 'ติดต่อ',
    'nav.language': 'ภาษา',
    'theme.toggle': 'สลับโหมดมืด',
    'profile.photo': 'รูปของ',
    'cta.cv': 'ดาวน์โหลด CV',
    'cta.cvView': 'ดูออนไลน์',
    'label.email': 'อีเมล',
    'label.skills': 'ทักษะ',
    'label.tools': 'เครื่องมือ',
    'experience.present': 'ปัจจุบัน',
    'education.expected': 'คาดว่าจะจบ',
    'contact.body': 'เปิดรับโอกาสใหม่ ๆ ติดต่อได้เร็วที่สุดทางอีเมล',
    'cv.title': 'CV',
    'cv.pdf': 'ดาวน์โหลด PDF',
    'cv.tex': 'ซอร์ส LaTeX (.tex)',
    'cv.updated': 'อัปเดต',
    'cv.language': 'CV เป็นภาษาอังกฤษ',
    'cv.noPreview': 'ไม่มีภาพตัวอย่าง เปิดดูจากไฟล์ PDF แทนได้',
    'cv.missing': 'ยังไม่ได้สร้าง CV ให้รัน `npm run cv`',
    'footer.built': 'สร้างด้วย Astro',
  },
} as const satisfies Record<Locale, Record<string, string>>;

export type UiKey = keyof (typeof ui)['en'];

export function useTranslations(locale: Locale) {
  return (key: UiKey) => ui[locale][key];
}

/** Formats a "YYYY-MM" string as a short month and year in the given locale. */
export function formatMonth(value: string, locale: Locale) {
  const [year, month] = value.split('-').map(Number);
  return new Intl.DateTimeFormat(locale === 'th' ? 'th-TH' : 'en-US', {
    month: 'short',
    year: 'numeric',
  }).format(new Date(year, month - 1));
}

/** The home page sections, in display order. Each id is also the anchor in the URL. */
export const sections = [
  { id: 'experience', label: 'nav.experience' },
  { id: 'publications', label: 'nav.publications' },
  { id: 'education', label: 'nav.education' },
  { id: 'awards', label: 'nav.awards' },
  { id: 'contact', label: 'nav.contact' },
] as const satisfies readonly { id: string; label: UiKey }[];

export type SectionId = (typeof sections)[number]['id'];

/** The 1-based number shown next to a section's heading. */
export const sectionNumber = (id: SectionId) => sections.findIndex((s) => s.id === id) + 1;
