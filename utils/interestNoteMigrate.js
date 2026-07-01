const InterestNote = require('../models/InterestNote');
const { detectLocale } = require('./interestNoteI18n');
const { buildTranslatedNoteFields } = require('../services/interestNoteTranslationService');

async function migrateLegacyNote(note) {
  if (note.titleEs && note.titleEn && note.bodyEs && note.bodyEn) {
    return note;
  }

  const legacyTitle = note.title || note.titleEs || note.titleEn || '';
  const legacyBody = note.body || note.bodyEs || note.bodyEn || '';
  if (!legacyTitle || !legacyBody) return note;

  const sourceLocale = note.sourceLocale || detectLocale(`${legacyTitle}\n${legacyBody}`);
  const translated = await buildTranslatedNoteFields({
    title: legacyTitle,
    body: legacyBody,
    sourceLocale
  });

  note.sourceLocale = translated.sourceLocale;
  note.titleEs = translated.titleEs;
  note.titleEn = translated.titleEn;
  note.bodyEs = translated.bodyEs;
  note.bodyEn = translated.bodyEn;
  await note.save();
  return note;
}

async function migrateAllInterestNotes() {
  const notes = await InterestNote.find({
    $or: [
      { titleEs: { $in: [null, ''] } },
      { titleEn: { $in: [null, ''] } },
      { bodyEs: { $in: [null, ''] } },
      { bodyEn: { $in: [null, ''] } }
    ]
  });

  for (const note of notes) {
    await migrateLegacyNote(note);
  }

  return notes.length;
}

module.exports = {
  migrateLegacyNote,
  migrateAllInterestNotes
};
