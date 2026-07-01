const { detectLocale, buildBilingualArticle } = require('../services/interestNoteTranslationService');

const SUPPORTED = new Set(['es', 'en']);

function normalizeLang(value) {
  const lang = String(value || 'es').toLowerCase().slice(0, 2);
  return SUPPORTED.has(lang) ? lang : 'es';
}

function resolveRequestLang(req) {
  const header = req?.headers?.['x-platform-lang'] || req?.query?.lang;
  return normalizeLang(header);
}

function noteHasBilingualFields(note) {
  return Boolean(note?.titleEs && note?.titleEn && note?.bodyEs && note?.bodyEn);
}

function pickLocalized(note, lang) {
  const locale = normalizeLang(lang);
  const title = locale === 'en' ? note.titleEn : note.titleEs;
  const body = locale === 'en' ? note.bodyEn : note.bodyEs;
  return {
    title: title || note.title || '',
    body: body || note.body || ''
  };
}

function notePreview(body, maxLines = 3) {
  const lines = String(body || '')
    .replace(/\r\n/g, '\n')
    .split('\n')
    .map((line) => line.trim())
    .filter(Boolean);
  return lines.slice(0, maxLines).join('\n');
}

function mapNoteForList(note, lang) {
  const localized = pickLocalized(note, lang);
  return {
    _id: note._id,
    title: localized.title,
    preview: notePreview(localized.body),
    sourceLocale: note.sourceLocale || 'es',
    sortOrder: note.sortOrder,
    published: note.published,
    updatedAt: note.updatedAt,
    createdAt: note.createdAt
  };
}

function mapNoteForRead(note, lang) {
  const localized = pickLocalized(note, lang);
  return {
    _id: note._id,
    title: localized.title,
    body: localized.body,
    sourceLocale: note.sourceLocale || 'es',
    sortOrder: note.sortOrder,
    published: note.published,
    updatedAt: note.updatedAt,
    createdAt: note.createdAt
  };
}

function mapNoteForAdminEdit(note) {
  const source = normalizeLang(note.sourceLocale || detectLocale(`${note.titleEs || note.title}\n${note.bodyEs || note.body}`));
  const localized = pickLocalized(note, source);
  return {
    _id: note._id,
    sourceLocale: source,
    title: localized.title,
    body: localized.body,
    titleEs: note.titleEs,
    titleEn: note.titleEn,
    bodyEs: note.bodyEs,
    bodyEn: note.bodyEn,
    sortOrder: note.sortOrder,
    published: note.published,
    updatedAt: note.updatedAt,
    createdAt: note.createdAt
  };
}

async function hydrateLegacyNote(noteDoc) {
  if (!noteDoc) return null;
  if (noteHasBilingualFields(noteDoc)) return noteDoc;

  const legacyTitle = String(noteDoc.title || noteDoc.titleEs || noteDoc.titleEn || '').trim();
  const legacyBody = String(noteDoc.body || noteDoc.bodyEs || noteDoc.bodyEn || '').trim();
  if (!legacyTitle || !legacyBody) return noteDoc;

  const bilingual = await buildBilingualArticle({
    title: legacyTitle,
    body: legacyBody,
    sourceLocale: noteDoc.sourceLocale
  });

  noteDoc.sourceLocale = bilingual.sourceLocale;
  noteDoc.titleEs = bilingual.titleEs;
  noteDoc.titleEn = bilingual.titleEn;
  noteDoc.bodyEs = bilingual.bodyEs;
  noteDoc.bodyEn = bilingual.bodyEn;
  noteDoc.title = bilingual.title;
  noteDoc.body = bilingual.body;
  await noteDoc.save();
  return noteDoc;
}

module.exports = {
  normalizeLang,
  resolveRequestLang,
  pickLocalized,
  notePreview,
  mapNoteForList,
  mapNoteForRead,
  mapNoteForAdminEdit,
  hydrateLegacyNote,
  noteHasBilingualFields
};
