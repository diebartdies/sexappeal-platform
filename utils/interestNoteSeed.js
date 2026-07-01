const InterestNote = require('../models/InterestNote');
const { buildBilingualArticle } = require('../services/interestNoteTranslationService');

const DEFAULT_WELCOME_NOTE = {
  title: 'Bienvenida y guía para modelos',
  body: `Hola, bienvenida a SexAppeal

Este es tu santuario digital: un espacio exclusivo, discreto y sin comisiones por cada contacto que recibas.

Tu primer mes es completamente gratis. Es tu período de evaluación: vas a conocer la plataforma, ver cómo llegan los contactos y sentir el valor de estar visible como Living Treasure.

Durante ese mes, tu perfil aparecerá en una categoría asignada al azar entre todas las participantes — así podés experimentar cómo funciona la visibilidad en distintos niveles.

Cuando termine el mes gratuito y validemos tu primer pago, pasarás automáticamente a la categoría que elegiste al registrarte, y abonarás solo la tarifa de esa categoría.

Vacaciones: si solicitás vacaciones, tu perfil se mostrará como inactivo. Hasta 15 días de vacaciones por mes se descuentan de tu saldo mensual (máximo 20 días por solicitud, una solicitud por año).

Pago mensual: usá el botón Pago mensual para subir tu comprobante. Tocá Cómo pagar para ver los datos de transferencia.

Privacidad: nuestra plataforma no usa cookies de rastreo ni trackers de terceros. Tu identidad y las interacciones con clientes permanecen confidenciales.

Cualquier duda, escribinos por el buzón de soporte desde tu panel.`,
  sortOrder: 0,
  published: true
};

async function ensureDefaultInterestNotes() {
  const count = await InterestNote.countDocuments();
  if (count > 0) return { seeded: false, count };

  const bilingual = await buildBilingualArticle({
    title: DEFAULT_WELCOME_NOTE.title,
    body: DEFAULT_WELCOME_NOTE.body,
    sourceLocale: 'es'
  });

  await InterestNote.create({
    ...DEFAULT_WELCOME_NOTE,
    sourceLocale: bilingual.sourceLocale,
    titleEs: bilingual.titleEs,
    titleEn: bilingual.titleEn,
    bodyEs: bilingual.bodyEs,
    bodyEn: bilingual.bodyEn,
    title: bilingual.title,
    body: bilingual.body
  });

  return { seeded: true, count: 1 };
}

module.exports = {
  DEFAULT_WELCOME_NOTE,
  ensureDefaultInterestNotes
};
