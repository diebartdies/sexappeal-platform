import { API_URL } from './globals.js';
import { t, applyStaticTranslations } from './i18n.js';

let countdownTimer = null;
let openingHandled = false;

function pad(n) {
  return String(n).padStart(2, '0');
}

function splitCountdown(msRemaining) {
  const totalSeconds = Math.max(0, Math.floor(msRemaining / 1000));
  const days = Math.floor(totalSeconds / 86400);
  const hours = Math.floor((totalSeconds % 86400) / 3600);
  const minutes = Math.floor((totalSeconds % 3600) / 60);
  const seconds = totalSeconds % 60;
  return { days, hours, minutes, seconds };
}

export async function fetchLaunchCurtainStatus() {
  try {
    const res = await fetch(`${API_URL}/public/launch-curtain`);
    const data = await res.json();
    return data.success ? data.data : { curtainVisible: false };
  } catch {
    return { curtainVisible: false };
  }
}

function ensureGridSlot() {
  const grid = document.getElementById('treasureGrid');
  if (!grid) return null;

  let slot = document.getElementById('treasureGridSlot');
  if (slot) return slot;

  const loader = document.getElementById('pageLoader');
  const parent = grid.parentElement;
  if (!parent) return null;

  slot = document.createElement('div');
  slot.id = 'treasureGridSlot';
  slot.className = 'treasure-grid-slot';

  parent.insertBefore(slot, loader || grid);
  if (loader) slot.appendChild(loader);
  slot.appendChild(grid);
  return slot;
}

function getGridStage() {
  return document.getElementById('treasureGridSlot') || ensureGridSlot();
}

function hideGridChrome() {
  const grid = document.getElementById('treasureGrid');
  const loader = document.getElementById('pageLoader');
  const filterCard = document.querySelector('.categories-filter-source');
  const progress = document.getElementById('floatingProgressWrapper');

  if (grid) {
    grid.classList.add('hidden');
    grid.innerHTML = '';
  }
  if (loader) loader.style.display = 'none';
  if (filterCard) filterCard.style.display = 'none';
  if (progress) progress.style.display = 'none';
}

function showGridChrome() {
  const grid = document.getElementById('treasureGrid');
  const loader = document.getElementById('pageLoader');
  const filterCard = document.querySelector('.categories-filter-source');

  if (loader) loader.style.display = '';
  if (filterCard) filterCard.style.display = '';
  if (grid) grid.classList.remove('hidden');
}

function updateCountdownDisplay(status) {
  const root = document.getElementById('launchCurtainStage');
  if (!root) return;

  const parts = splitCountdown(status.msRemaining);
  const daysEl = root.querySelector('[data-countdown-days]');
  const hoursEl = root.querySelector('[data-countdown-hours]');
  const minutesEl = root.querySelector('[data-countdown-minutes]');
  const secondsEl = root.querySelector('[data-countdown-seconds]');

  if (daysEl) daysEl.textContent = pad(parts.days);
  if (hoursEl) hoursEl.textContent = pad(parts.hours);
  if (minutesEl) minutesEl.textContent = pad(parts.minutes);
  if (secondsEl) secondsEl.textContent = pad(parts.seconds);
}

function buildCurtainMarkup() {
  return `
    <div class="launch-curtain-stage" id="launchCurtainStage" role="region" aria-live="polite" aria-label="${t('Grand opening curtain')}">
      <div class="launch-curtain-gauze" aria-hidden="true"></div>
      <div class="launch-curtain-panel launch-curtain-panel-left" aria-hidden="true"></div>
      <div class="launch-curtain-panel launch-curtain-panel-right" aria-hidden="true"></div>
      <div class="launch-curtain-center">
        <p class="launch-curtain-kicker gold-text">${t('Grand Opening')}</p>
        <h2 class="launch-curtain-title">${t('The curtain rises soon')}</h2>
        <p class="launch-curtain-subtitle">${t('Our Living Treasures will be revealed on Friday, June 19, 2026 at midnight.')}</p>
        <div class="launch-curtain-countdown" aria-label="${t('Countdown to opening')}">
          <div class="launch-curtain-unit">
            <span class="launch-curtain-value" data-countdown-days>00</span>
            <span class="launch-curtain-label">${t('Days')}</span>
          </div>
          <div class="launch-curtain-unit">
            <span class="launch-curtain-value" data-countdown-hours>00</span>
            <span class="launch-curtain-label">${t('Hours')}</span>
          </div>
          <div class="launch-curtain-unit">
            <span class="launch-curtain-value" data-countdown-minutes>00</span>
            <span class="launch-curtain-label">${t('Minutes')}</span>
          </div>
          <div class="launch-curtain-unit">
            <span class="launch-curtain-value" data-countdown-seconds>00</span>
            <span class="launch-curtain-label">${t('Seconds')}</span>
          </div>
        </div>
        <p class="launch-curtain-footnote">${t('Until then, the treasure grids remain veiled.')}</p>
      </div>
    </div>
  `;
}

function mountCurtain() {
  const stage = getGridStage();
  if (!stage || document.getElementById('launchCurtainStage')) return;

  stage.classList.add('launch-curtain-slot-active');
  stage.insertAdjacentHTML('beforeend', buildCurtainMarkup());
  applyStaticTranslations(document.getElementById('launchCurtainStage'));
  document.body.classList.add('launch-curtain-active');
  hideGridChrome();
}

export function removeLaunchCurtain() {
  if (countdownTimer) {
    clearInterval(countdownTimer);
    countdownTimer = null;
  }
  openingHandled = false;
  document.getElementById('launchCurtainStage')?.remove();
  document.getElementById('treasureGridSlot')?.classList.remove('launch-curtain-slot-active');
  document.body.classList.remove('launch-curtain-active', 'launch-curtain-opening');
  showGridChrome();
}

function playCurtainOpen(onComplete) {
  const root = document.getElementById('launchCurtainStage');
  if (!root) {
    onComplete?.();
    return;
  }

  document.body.classList.add('launch-curtain-opening');
  root.addEventListener('transitionend', () => {
    removeLaunchCurtain();
    onComplete?.();
  }, { once: true });

  setTimeout(() => {
    if (document.getElementById('launchCurtainStage')) {
      removeLaunchCurtain();
      onComplete?.();
    }
  }, 3200);
}

function startCountdown(status, onOpen) {
  if (countdownTimer) clearInterval(countdownTimer);

  const tick = async () => {
    const fresh = await fetchLaunchCurtainStatus();
    if (!fresh.curtainVisible) {
      if (countdownTimer) clearInterval(countdownTimer);
      countdownTimer = null;
      if (!openingHandled) {
        openingHandled = true;
        playCurtainOpen(onOpen);
      }
      return;
    }

    updateCountdownDisplay(fresh);
  };

  updateCountdownDisplay(status);
  countdownTimer = setInterval(tick, 1000);
}

/**
 * Returns true when grids should stay hidden (curtain shown).
 * @param {() => void} onOpen - called after curtain opens at launch time
 */
export async function resolveLaunchCurtain(onOpen) {
  const status = await fetchLaunchCurtainStatus();

  if (!status.curtainVisible) {
    removeLaunchCurtain();
    return false;
  }

  mountCurtain();
  startCountdown(status, onOpen);
  return true;
}

export async function saveLaunchCurtainEnabled(enabled) {
  const token = localStorage.getItem('token');
  const res = await fetch(`${API_URL}/admin/launch-curtain`, {
    method: 'PUT',
    headers: {
      Authorization: `Bearer ${token}`,
      'Content-Type': 'application/json'
    },
    credentials: 'include',
    body: JSON.stringify({ enabled: Boolean(enabled) })
  });
  const data = await res.json();
  if (!data.success) {
    throw new Error(data.error || 'Could not update launch curtain');
  }
  return data.data;
}

export async function loadLaunchCurtainAdminState() {
  const token = localStorage.getItem('token');
  const res = await fetch(`${API_URL}/admin/launch-curtain`, {
    headers: { Authorization: `Bearer ${token}` },
    credentials: 'include'
  });
  const data = await res.json();
  if (!data.success) {
    throw new Error(data.error || 'Could not load launch curtain settings');
  }
  return data.data;
}
