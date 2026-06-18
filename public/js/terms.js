import { API_URL, TERMS_VERSION } from './globals.js';
import { t } from './i18n.js';
import { activateAccessibleModal, deactivateAccessibleModal } from './a11y.js';

// localStorage keys for the per-browser (anonymous) acceptance record.
const LS_CLIENT_ID = 'termsClientId';
const LS_ACCEPTED_VERSION = 'termsAcceptedVersion';
const LS_ACCEPTED_AT = 'termsAcceptedAt';

/**
 * SHORT NOTICE shown in the age-gate popup, above the acceptance checkbox.
 * Each paragraph is an i18n key (English source) with a Spanish translation
 * registered in i18n.js; the site default language is Spanish.
 */
const SHORT_NOTICE_PARAGRAPHS = [
  'This site is intended solely for use by individuals who are at least eighteen (18) years old and have reached the age of majority where they live. By using this site, you confirm to us that you are not underage. By proceeding beyond this notice, you consent to our Terms & Conditions. Unauthorized usage of this site could breach relevant laws.',
  'SexAppeal does not create, produce, or modify any of the content found in the ads, yet all ads posted must adhere to our standards regarding age and content.',
  'SexAppeal enforces a strict policy against human trafficking, prostitution, and any illegal activities. We work in collaboration with law enforcement, following legal procedures such as subpoenas, to investigate any criminal actions. Breaching our strict policy may lead to reporting to law enforcement. I pledge not to use this site in a manner that contravenes SexAppeal\u2019s policies, or any national, state, or local laws, and I commit to reporting any infringements to the authorities.',
  'Additionally, I agree to report any suspected cases of exploitation of minors and/or human trafficking to the relevant authorities.'
];

/**
 * FULL Terms & Conditions, in Spanish (Argentina), rendered into the big modal
 * opened from the age-gate popup link. Stored as a template here (not routed
 * through i18n.js) because it is long and version-pinned by TERMS_VERSION.
 */
const FULL_TERMS_SECTIONS = [
  {
    title: '1. Introducción',
    body: 'Estos Términos y Condiciones (el «Acuerdo») tienen por objeto protegerlo a usted, el Usuario, así como a SexAppeal. Le rogamos que los lea atentamente y se asegure de comprenderlos ANTES de utilizar sexappeal.drsrv.net.ar o cualquier otro sitio web de SexAppeal (el/los «Sitio(s) Web»). Conserve una copia de este Acuerdo para sus registros personales. Si no puede visualizar los Términos y Condiciones o si no los comprende, comuníquese con nosotros ANTES de acceder al Sitio Web.'
  },
  {
    title: '2. Aceptación',
    body: 'Usted debe aceptar todos los términos de este Acuerdo como condición para utilizar el Sitio Web. Puede aceptar y prestar su conformidad a estos términos de cualquiera de las siguientes maneras: 2.1 Haciendo clic en cualquier enlace, botón u otro ícono que presente una opción (como un botón de selección) en el Sitio Web; o 2.2 Accediendo o utilizando el Sitio Web de cualquier manera.'
  },
  {
    title: '3. Restricciones de edad',
    body: 'Como condición para utilizar el/los Sitio(s) Web, usted afirma que es mayor de la mayoría de edad (por ejemplo, mayor de 18 años, o la mayoría de edad de su jurisdicción) en la jurisdicción en la que reside. SexAppeal exige que los anunciantes tengan al menos 18 años de edad para anunciarse en SexAppeal y que todas las cuentas estén sujetas a verificación de edad. SexAppeal declina toda responsabilidad derivada de cualquier declaración falsa relativa a la edad del Usuario.'
  },
  {
    title: '4. Control del/los Sitio(s) Web por parte de SexAppeal',
    body: 'El/los Sitio(s) Web contienen anuncios y comunicaciones (el «Contenido») que son creados y publicados por terceros independientes (los «Anunciantes»). En consecuencia, SexAppeal no es responsable de —ni facilitará la comunicación, actuará como intermediario o intervendrá de modo alguno en— las comunicaciones o disputas que surjan entre el Usuario y un Anunciante.'
  },
  {
    title: '5. Revisiones de este Acuerdo',
    body: 'SexAppeal puede revisar estos Términos y Condiciones cada cierto tiempo. Usted comprende el derecho unilateral de SexAppeal a hacerlo y reconoce que cualquier cambio entrará en vigencia de inmediato una vez publicado. Usted acepta consultar periódicamente esta página para conocer los cambios o actualizaciones. 5.1 Puede asumir que, si la «Fecha de modificación» en la parte superior de esta página ha cambiado desde la última vez que revisó estos Términos y Condiciones, ha habido una modificación, y acepta revisar el Acuerdo en su totalidad y aceptar específicamente quedar obligado por los nuevos Términos y Condiciones allí contenidos.'
  },
  {
    title: '6. Prevención de la explotación de menores',
    body: 'SexAppeal mantiene una política de tolerancia cero respecto de la explotación infantil en cualquier forma o modalidad. Lo siguiente se aplicará a todos los Usuarios en todo momento:\n\n6.1 Todo el contenido del Sitio Web está destinado EXCLUSIVAMENTE A ADULTOS. SexAppeal adopta grandes medidas para garantizar que todo el Contenido presentado en el Sitio Web no muestre, ni parezca mostrar, a personas menores de edad. Si usted busca ese tipo de material, no lo encontrará en este sitio. SexAppeal no tolera a los Anunciantes que presenten este material, ni tolera a los Usuarios que deseen dicho material.\n\n6.2 Como condición para utilizar el Sitio Web, usted, el Usuario, reconoce y acepta que denunciará cualquier imagen (real o simulada) que efectivamente sugiera, o parezca sugerir, la explotación de menores en el Sitio Web. Usted acepta denunciar las imágenes sospechosas, con las pruebas de respaldo correspondientes, a admin@drsrv.net.ar.\n\n6.3 SexAppeal coopera plenamente con cualquier organismo de las fuerzas de seguridad que investigue denuncias de explotación infantil.\n\n6.4 Prevención del acceso por parte de menores. El Sitio Web es un sitio exclusivo para adultos y usted acepta adoptar todas las medidas razonables para impedir el acceso a este sitio por parte de una persona menor de la mayoría de edad en su jurisdicción. Esto incluye el uso de todos los controles parentales, protecciones por contraseña, software de filtrado u otras barreras tecnológicas que puedan impedir el acceso intencional o accidental de un menor. Estas medidas de prevención son SU responsabilidad, y SexAppeal no será responsable del acceso de un menor al sitio web desde su computadora.'
  },
  {
    title: '7. Derechos y obligaciones del Usuario',
    body: '7.1 Uso del/los Sitio(s) Web. Su uso de este sitio es únicamente para fines personales y no comerciales, y todo otro uso queda estrictamente prohibido.\n\n7.2 El Sitio Web no fomenta ni aprueba ninguna actividad ilegal. Todo el Contenido presentado en el Sitio Web está destinado a la visualización y/o uso por parte de adultos que presten su consentimiento, en una jurisdicción donde dicho Contenido no infrinja ninguna disposición de las leyes nacionales o locales. Nada en este sitio, ni su uso del mismo, podrá interpretarse como aprobación o fomento de actividad ilegal. Usted reconoce que su uso del Sitio Web es con fines de entretenimiento únicamente y que usted es el único responsable de consultar todas las leyes aplicables en su jurisdicción como condición para utilizar el Sitio Web.\n\n7.3 Sin autorización previa por escrito, usted no podrá duplicar, exhibir ni distribuir ningún Contenido con ningún fin (incluso si dicha duplicación pudiera considerarse «uso legítimo»). No podrá utilizar ninguna propiedad intelectual de SexAppeal por ningún motivo, incluidos meta-tags y enlaces profundos (deep links).\n\n7.4 Cualquier comentario, calificación o reseña del/los Sitio(s) Web o del Anunciante no podrá ser acosador, ofensivo ni difamatorio.\n\n7.5 Usted entiende que (salvo el soporte técnico y otras actividades pasivas) SexAppeal no controla, gestiona, crea ni supervisa el Contenido del Sitio Web y, por lo tanto, no es responsable de dicho Contenido. En consecuencia, usted acepta indemnizar y eximir de responsabilidad a SexAppeal por cualquier Contenido del/los Sitio(s) Web o por las comunicaciones de un Anunciante en el/los Sitio(s) Web. SexAppeal no garantiza, ni es responsable de, la exactitud de ninguna comunicación, información o mensaje que usted reciba de un Anunciante u otro Usuario en el Sitio Web. SexAppeal revisará las quejas que aleguen que se han violado los términos y condiciones del Sitio Web, pero en ningún caso resolverá, ni brindará asistencia para resolver, una disputa entre usted y cualquier otro Usuario o un Anunciante.'
  },
  {
    title: '8. Información sobre propiedad intelectual',
    body: '8.1 Usted no podrá registrar, utilizar ni traficar con ningún nombre de dominio que sea confusamente similar a SEXAPPEAL o a cualquier otra marca registrada o de uso común (common law) propiedad de SexAppeal.\n\n8.2 En ocasiones, el Contenido puede incluir nombres de productos y servicios de otras empresas que pueden ser marcas comerciales y marcas de servicio. Estos nombres no podrán utilizarse públicamente sin el consentimiento expreso y por escrito de los titulares y/o propietarios de dichas marcas.'
  },
  {
    title: '9. Renuncia de garantía',
    body: 'Usted reconoce y entiende que el uso del/los Sitio(s) Web y del Contenido en ellos es bajo su propio riesgo. Su uso del/los Sitio(s) Web queda a su entera discreción, lo que lo hace a usted, y solo a usted, responsable de cualquier pérdida de datos o daño que pueda surgir de su uso del/los Sitio(s) Web.\n\n9.1 SexAppeal no efectúa ninguna declaración, garantía ni aseguramiento de que el/los Sitio(s) Web o los materiales contenidos en ellos serán ininterrumpidos, seguros, libres de código fuente dañino o libres de errores, ni declara que los materiales contenidos en el/los Sitio(s) Web sean veraces, exactos o completos.'
  },
  {
    title: '10. Indemnización',
    body: 'Usted no podrá utilizar el/los Sitio(s) Web de ninguna manera ni con ningún fin que sea contrario a la ley nacional o a las leyes locales de la jurisdicción en la que reside. Si SexAppeal determina que cualquier Usuario del sitio ha proporcionado, o tiene la intención de participar en, una actividad ilegal, su uso del sitio será inmediatamente cancelado. SexAppeal rechaza toda responsabilidad, y usted acepta defender, indemnizar y eximir de responsabilidad a SexAppeal, sus directivos, empleados, agentes y cesionarios, respecto de cualquier responsabilidad que pueda surgir por su violación de cualquier ley.\n\n10.1 Usted acepta defender, indemnizar y eximir de responsabilidad, sin limitación, a SexAppeal, sus directivos, empleados, agentes y cesionarios, frente a todas y cada una de las causas de acción, responsabilidades o daños que resulten directa o indirectamente de su uso del sitio, incluidos, cuando corresponda, cualquier participación, encuentro o contrato que celebre con cualquier otro Usuario o un Anunciante en el Sitio Web.\n\n10.2 Usted también acepta defender e indemnizar a SexAppeal en caso de que cualquier tercero resulte perjudicado por sus acciones o en caso de que SexAppeal se vea obligado a defenderse de cualquier reclamo, incluida, sin limitación, cualquier acción penal o civil entablada por cualquier parte.'
  },
  {
    title: '11. Disposiciones generales',
    body: '11.1 Usted, el Usuario, acepta y entiende que este Acuerdo constituye el acuerdo completo entre usted y SexAppeal, a menos que y hasta que sea revisado de conformidad con las disposiciones de la Sección 5 anterior.\n\n11.2 Este Acuerdo se regirá e interpretará de conformidad con las leyes de la República Argentina.\n\n11.3 Si alguna de las disposiciones de este Acuerdo se considerara inaplicable o inválida, las disposiciones restantes se interpretarán como si la disposición inaplicable no hubiera sido incluida, y dicha disposición inaplicable no tendrá efecto alguno sobre la aplicabilidad o validez de las disposiciones restantes.\n\n11.4 Las partes acuerdan realizar esfuerzos de buena fe para resolver todas y cada una de las disputas relativas a este Acuerdo antes de recurrir a la vía judicial. Toda disputa o reclamo que no pueda resolverse mediante dichos esfuerzos de buena fe se resolverá mediante arbitraje vinculante ante un árbitro certificado en Argentina. Usted, el Usuario, por el presente reconoce y consiente la jurisdicción de Argentina y acepta que la sede para toda resolución de disputas será dentro de Argentina.'
  },
  {
    title: '12. Jurisdicción',
    body: 'El Operador se encuentra en Argentina. Por lo tanto, se aplican las leyes argentinas. El lugar de jurisdicción para cualquier disputa es Argentina.'
  },
  {
    title: 'Información de pago guardada y Recarga Automática',
    body: 'SexAppeal puede ofrecerle la posibilidad de guardar su información de pago para facilitar el proceso de pago y, opcionalmente, aprovechar la «Recarga Automática» (Auto Reload) cuando su cuenta se esté quedando sin créditos. Si decide utilizar estas funciones, su información de pago se almacenará de forma segura en los servidores de nuestro proveedor de pagos: SexAppeal nunca almacena los números de su tarjeta de crédito en nuestros servidores. En todos los casos, usted tiene el control de su información de pago y puede activar, desactivar y administrar sus tarjetas guardadas y la configuración de Recarga Automática en la página de Configuración de Pagos, dentro de la sección de su Cuenta.'
  }
];

function escapeHtml(str) {
  return String(str)
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;');
}

function sectionBodyHtml(body) {
  return escapeHtml(body)
    .split('\n\n')
    .map((para) => `<p style="margin:0 0 12px;color:#ddd;line-height:1.6;">${para.replace(/\n/g, '<br>')}</p>`)
    .join('');
}

function ensureUuid() {
  let id = '';
  try {
    id = localStorage.getItem(LS_CLIENT_ID) || '';
  } catch (_) { /* storage unavailable */ }
  if (id) return id;

  if (window.crypto && typeof window.crypto.randomUUID === 'function') {
    id = window.crypto.randomUUID();
  } else {
    id = 'xxxxxxxx-xxxx-4xxx-yxxx-xxxxxxxxxxxx'.replace(/[xy]/g, (c) => {
      const r = (Math.random() * 16) | 0;
      const v = c === 'x' ? r : (r & 0x3) | 0x8;
      return v.toString(16);
    });
  }
  try {
    localStorage.setItem(LS_CLIENT_ID, id);
  } catch (_) { /* ignore */ }
  return id;
}

/** True when this browser already accepted the CURRENT terms version. */
export function hasAcceptedTerms() {
  try {
    return localStorage.getItem(LS_ACCEPTED_VERSION) === TERMS_VERSION;
  } catch (_) {
    return false;
  }
}

/**
 * Persist acceptance: write localStorage AND log it to the database.
 * The DB write is best-effort (fire-and-forget) so a transient network error
 * never blocks the user from entering after they have legitimately accepted.
 */
export function recordAcceptance(source = 'age-gate') {
  const clientId = ensureUuid();
  try {
    localStorage.setItem(LS_ACCEPTED_VERSION, TERMS_VERSION);
    localStorage.setItem(LS_ACCEPTED_AT, new Date().toISOString());
  } catch (_) { /* ignore */ }

  const token = localStorage.getItem('token');
  const headers = { 'Content-Type': 'application/json' };
  if (token && token !== 'null' && token !== 'undefined') {
    headers.Authorization = `Bearer ${token}`;
  }

  fetch(`${API_URL}/terms/accept`, {
    method: 'POST',
    headers,
    credentials: 'include',
    body: JSON.stringify({ clientId, termsVersion: TERMS_VERSION, source })
  }).catch(() => { /* best-effort audit log */ });

  return clientId;
}

// ---------------------------------------------------------------------------
// Full Terms & Conditions modal (the BIG popup opened from the notice link)
// ---------------------------------------------------------------------------
let fullTermsOverlay = null;

export function openFullTermsModal(returnFocusEl = null) {
  if (!fullTermsOverlay) {
    fullTermsOverlay = document.createElement('div');
    fullTermsOverlay.id = 'fullTermsOverlay';
    fullTermsOverlay.className = 'payment-modal-overlay terms-modal-overlay';
    Object.assign(fullTermsOverlay.style, {
      position: 'fixed',
      inset: '0',
      background: 'rgba(0,0,0,0.88)',
      zIndex: '100020',
      display: 'none',
      alignItems: 'center',
      justifyContent: 'center',
      padding: '20px'
    });
    document.body.appendChild(fullTermsOverlay);
  }

  const sectionsHtml = FULL_TERMS_SECTIONS.map((s) => `
      <section style="margin-bottom:18px;">
        <h3 class="gold-text" style="font-size:1.05rem;margin:0 0 8px;">${escapeHtml(s.title)}</h3>
        ${sectionBodyHtml(s.body)}
      </section>`).join('');

  fullTermsOverlay.innerHTML = `
    <div class="card payment-modal-panel" data-modal-panel style="max-width:760px;width:100%;max-height:86vh;display:flex;flex-direction:column;border:1px solid var(--primary-gold);border-radius:12px;">
      <div style="display:flex;align-items:flex-start;justify-content:space-between;gap:12px;border-bottom:1px solid rgba(212,175,55,0.3);padding-bottom:12px;">
        <div>
          <h2 id="fullTermsTitle" class="gold-text" style="margin:0;font-size:1.3rem;">${t('Terms & Conditions')}</h2>
          <p style="margin:4px 0 0;color:#888;font-size:0.82rem;">${t('Date Modified:')} ${escapeHtml(TERMS_VERSION)}</p>
        </div>
        <button type="button" id="fullTermsClose" data-modal-close aria-label="${t('Close')}" style="background:transparent;border:1px solid var(--primary-gold);color:var(--primary-gold);width:36px;height:36px;border-radius:8px;cursor:pointer;font-size:1.1rem;line-height:1;flex:0 0 auto;">&times;</button>
      </div>
      <div id="fullTermsBody" tabindex="0" style="overflow-y:auto;padding:16px 4px 4px;margin-top:4px;">
        ${sectionsHtml}
      </div>
    </div>`;

  const close = () => {
    deactivateAccessibleModal(fullTermsOverlay);
    fullTermsOverlay.style.display = 'none';
    // Restore body scroll only if no other gold overlay remains open.
    if (!document.querySelector('#ageGateOverlay[style*="flex"]')) {
      document.body.style.overflow = '';
    }
    if (returnFocusEl && typeof returnFocusEl.focus === 'function') {
      try { returnFocusEl.focus(); } catch (_) { /* ignore */ }
    }
  };

  fullTermsOverlay.querySelector('#fullTermsClose').onclick = close;
  fullTermsOverlay.onclick = (e) => {
    if (e.target === fullTermsOverlay) close();
  };

  fullTermsOverlay.style.display = 'flex';
  document.body.style.overflow = 'hidden';
  activateAccessibleModal(fullTermsOverlay, {
    labelId: 'fullTermsTitle',
    onClose: close,
    initialFocusSelector: '#fullTermsClose'
  });
}

// ---------------------------------------------------------------------------
// Age-gate acceptance popup (short notice + checkbox + link)
// ---------------------------------------------------------------------------
let ageGateOverlay = null;

/**
 * Show the age-gate acceptance popup.
 * @param {{ onAccept: () => void, onCancel?: () => void }} handlers
 */
export function openAgeGateAcceptance({ onAccept, onCancel } = {}) {
  if (!ageGateOverlay) {
    ageGateOverlay = document.createElement('div');
    ageGateOverlay.id = 'ageGateOverlay';
    ageGateOverlay.className = 'payment-modal-overlay terms-gate-overlay';
    Object.assign(ageGateOverlay.style, {
      position: 'fixed',
      inset: '0',
      background: 'rgba(0,0,0,0.9)',
      zIndex: '100010',
      display: 'none',
      alignItems: 'center',
      justifyContent: 'center',
      padding: '20px'
    });
    document.body.appendChild(ageGateOverlay);
  }

  const noticeHtml = SHORT_NOTICE_PARAGRAPHS
    .map((p) => `<p style="margin:0 0 12px;color:#ddd;line-height:1.6;font-size:0.92rem;">${escapeHtml(t(p))}</p>`)
    .join('');

  ageGateOverlay.innerHTML = `
    <div class="card payment-modal-panel" data-modal-panel style="max-width:560px;width:100%;max-height:90vh;display:flex;flex-direction:column;border:1px solid var(--primary-gold);border-radius:12px;">
      <h2 id="ageGateTitle" class="gold-text" style="margin:0 0 12px;font-size:1.25rem;text-align:center;">${t('Age Verification & Terms')}</h2>
      <div style="overflow-y:auto;padding-right:4px;border-top:1px solid rgba(212,175,55,0.3);border-bottom:1px solid rgba(212,175,55,0.3);padding-top:14px;padding-bottom:14px;">
        ${noticeHtml}
        <p style="margin:6px 0 0;text-align:center;">
          <button type="button" id="ageGateTermsLink" style="background:none;border:none;padding:0;cursor:pointer;color:var(--primary-gold);text-decoration:underline;font:inherit;font-weight:bold;">${t('Read the full Terms & Conditions')}</button>
        </p>
      </div>
      <label for="ageGateCheckbox" style="display:flex;align-items:flex-start;gap:10px;margin:16px 0;cursor:pointer;color:#fff;font-size:0.95rem;">
        <input type="checkbox" id="ageGateCheckbox" style="width:auto;margin-top:3px;flex:0 0 auto;">
        <span>${t('I have read and accept the terms and conditions.')}</span>
      </label>
      <div style="display:flex;gap:10px;flex-wrap:wrap;">
        <button type="button" id="ageGateCancel" style="flex:1;min-width:120px;background:transparent;border:1px solid var(--primary-gold);color:var(--primary-gold);padding:12px;border-radius:6px;cursor:pointer;font-weight:bold;">${t('Exit')}</button>
        <button type="button" id="ageGateConfirm" disabled style="flex:2;min-width:160px;padding:12px;border-radius:6px;cursor:not-allowed;font-weight:bold;border:none;background:var(--primary-gold);color:var(--dark-bg);opacity:0.5;">${t('Accept & Enter')}</button>
      </div>
    </div>`;

  const checkbox = ageGateOverlay.querySelector('#ageGateCheckbox');
  const confirmBtn = ageGateOverlay.querySelector('#ageGateConfirm');
  const cancelBtn = ageGateOverlay.querySelector('#ageGateCancel');
  const termsLink = ageGateOverlay.querySelector('#ageGateTermsLink');

  const closeOverlay = () => {
    deactivateAccessibleModal(ageGateOverlay);
    ageGateOverlay.style.display = 'none';
    if (!document.querySelector('#fullTermsOverlay[style*="flex"]')) {
      document.body.style.overflow = '';
    }
  };

  checkbox.addEventListener('change', () => {
    const on = checkbox.checked;
    confirmBtn.disabled = !on;
    confirmBtn.style.cursor = on ? 'pointer' : 'not-allowed';
    confirmBtn.style.opacity = on ? '1' : '0.5';
  });

  termsLink.addEventListener('click', () => openFullTermsModal(termsLink));

  const cancel = () => {
    closeOverlay();
    if (typeof onCancel === 'function') onCancel();
  };

  cancelBtn.onclick = cancel;
  confirmBtn.onclick = () => {
    if (confirmBtn.disabled) return;
    recordAcceptance('age-gate');
    closeOverlay();
    if (typeof onAccept === 'function') onAccept();
  };

  // Overlay click closes ONLY the full-terms modal layer; the gate itself must
  // be answered (accept or exit), so a backdrop click here does nothing.
  ageGateOverlay.onclick = (e) => {
    if (e.target === ageGateOverlay) { /* require an explicit choice */ }
  };

  ageGateOverlay.style.display = 'flex';
  document.body.style.overflow = 'hidden';
  activateAccessibleModal(ageGateOverlay, {
    labelId: 'ageGateTitle',
    // While the full-terms modal is layered on top, let its own Esc handler
    // close it without also dismissing the underlying gate.
    onClose: () => {
      if (document.querySelector('#fullTermsOverlay[style*="flex"]')) return;
      cancel();
    },
    initialFocusSelector: '#ageGateCheckbox'
  });
}
