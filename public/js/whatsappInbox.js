import { t, applyStaticTranslations, currentLang } from './i18n.js?v=8.6';

const API_URL = window.location.protocol === 'file:'
    ? 'http://localhost:5000/api/v1'
    : `${window.location.origin}/api/v1`;

const POLL_MS = 15000;
const FETCH_LIMIT = 200;

let allMessages = [];
let threads = [];
let selectedPhone = '';
let pollTimer = null;

function authHeaders() {
    const token = localStorage.getItem('token');
    const headers = {};
    if (token && token !== 'null' && token !== 'undefined') {
        headers.Authorization = `Bearer ${token}`;
    }
    return headers;
}

function escapeHtml(value) {
    return String(value ?? '')
        .replace(/&/g, '&amp;')
        .replace(/</g, '&lt;')
        .replace(/>/g, '&gt;')
        .replace(/"/g, '&quot;');
}

function showAlert(message) {
    const el = document.getElementById('waInboxAlert');
    if (!el) return;
    el.textContent = message;
    el.classList.remove('hidden');
}

function hideAlert() {
    document.getElementById('waInboxAlert')?.classList.add('hidden');
}

function formatWhen(value) {
    if (!value) return '—';
    const d = new Date(value);
    if (Number.isNaN(d.getTime())) return '—';
    return d.toLocaleString();
}

function formatShortWhen(value) {
    if (!value) return '';
    const d = new Date(value);
    if (Number.isNaN(d.getTime())) return '';
    const now = new Date();
    const sameDay = d.toDateString() === now.toDateString();
    return sameDay
        ? d.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })
        : d.toLocaleDateString();
}

function phoneKey(msg) {
    return msg.direction === 'outbound'
        ? String(msg.toPhone || msg.phone || '')
        : String(msg.fromPhone || msg.phone || '');
}

function buildThreads(messages) {
    const map = new Map();

    messages.forEach((msg) => {
        const key = phoneKey(msg);
        if (!key) return;

        let thread = map.get(key);
        if (!thread) {
            thread = {
                phone: key,
                alias: msg.lead?.alias || '',
                leadStatus: msg.lead?.status || '',
                fromName: msg.fromName || '',
                messages: []
            };
            map.set(key, thread);
        }

        if (msg.lead?.alias && !thread.alias) thread.alias = msg.lead.alias;
        if (msg.lead?.status && !thread.leadStatus) thread.leadStatus = msg.lead.status;
        if (msg.fromName && !thread.fromName) thread.fromName = msg.fromName;

        thread.messages.push(msg);
    });

    return [...map.values()]
        .map((thread) => {
            thread.messages.sort((a, b) => new Date(a.at) - new Date(b.at));
            const last = thread.messages[thread.messages.length - 1];
            thread.lastAt = last?.at;
            thread.lastPreview = (last?.body || (last?.mediaUrls?.length ? '[media]' : '')).slice(0, 120);
            thread.inboundCount = thread.messages.filter((m) => m.direction === 'inbound').length;
            return thread;
        })
        .sort((a, b) => new Date(b.lastAt) - new Date(a.lastAt));
}

function applyFilters() {
    const q = (document.getElementById('waSearch')?.value || '').trim().toLowerCase();
    const direction = document.getElementById('waDirectionFilter')?.value || 'all';

    let filtered = allMessages;
    if (direction !== 'all') {
        filtered = filtered.filter((m) => m.direction === direction);
    }
    if (q) {
        filtered = filtered.filter((m) => {
            const hay = [
                m.body,
                m.fromPhone,
                m.toPhone,
                m.phone,
                m.fromName,
                m.lead?.alias,
                m.lead?.status
            ].filter(Boolean).join(' ').toLowerCase();
            return hay.includes(q);
        });
    }

    threads = buildThreads(filtered);

    if (selectedPhone && !threads.some((th) => th.phone === selectedPhone)) {
        selectedPhone = threads[0]?.phone || '';
    }
    if (!selectedPhone && threads.length) {
        selectedPhone = threads[0].phone;
    }
}

function renderStats() {
    const inbound = allMessages.filter((m) => m.direction === 'inbound').length;
    const outbound = allMessages.filter((m) => m.direction === 'outbound').length;
    const stats = document.getElementById('waInboxStats');
    if (stats) {
        stats.textContent = `${threads.length} conversaciones · ${inbound} entrantes · ${outbound} salientes (manual)`;
    }
}

function renderThreadList() {
    const list = document.getElementById('waThreadList');
    if (!list) return;

    if (!threads.length) {
        list.innerHTML = `<p class="wa-empty">${t('No WhatsApp messages yet. Configure the Twilio webhook and wait for replies.')}</p>`;
        return;
    }

    list.innerHTML = threads.map((thread) => {
        const label = thread.alias
            ? `${thread.alias} (+${thread.phone})`
            : (thread.fromName ? `${thread.fromName} (+${thread.phone})` : `+${thread.phone}`);
        const active = thread.phone === selectedPhone ? ' is-active' : '';
        const badge = thread.leadStatus
            ? `<span class="wa-thread-badge">${escapeHtml(thread.leadStatus)}</span>`
            : '';
        return `<button type="button" class="wa-thread-item${active}" data-phone="${escapeHtml(thread.phone)}">
            <div class="wa-thread-top">
                <span class="wa-thread-name">${escapeHtml(label)}</span>
                <span class="wa-thread-time">${escapeHtml(formatShortWhen(thread.lastAt))}</span>
            </div>
            <div class="wa-thread-preview">${escapeHtml(thread.lastPreview || '—')}</div>
            ${badge}
        </button>`;
    }).join('');

    list.querySelectorAll('.wa-thread-item').forEach((btn) => {
        btn.addEventListener('click', () => {
            selectedPhone = btn.dataset.phone || '';
            renderThreadList();
            renderThreadView();
        });
    });
}

function renderThreadView() {
    const view = document.getElementById('waThreadView');
    if (!view) return;

    const thread = threads.find((th) => th.phone === selectedPhone);
    if (!thread) {
        view.innerHTML = `<div class="wa-thread-placeholder"><p>${t('Select a conversation to read messages.')}</p></div>`;
        return;
    }

    const title = thread.alias
        ? `${thread.alias} · +${thread.phone}`
        : (thread.fromName ? `${thread.fromName} · +${thread.phone}` : `+${thread.phone}`);

    const bubbles = thread.messages.map((msg) => {
        const cls = msg.direction === 'outbound' ? 'wa-msg-out' : 'wa-msg-in';
        const label = msg.direction === 'outbound' ? t('You') : (msg.fromName || `+${msg.fromPhone || msg.phone}`);
        const body = escapeHtml(msg.body || '');
        const media = (msg.mediaUrls || []).map((url, i) =>
            `<div class="wa-msg-media"><a href="${escapeHtml(url)}" target="_blank" rel="noopener">${t('Attachment')} ${i + 1}</a></div>`
        ).join('');
        return `<div class="wa-msg ${cls}">
            <div>${body || (media ? '' : '—')}</div>
            ${media}
            <div class="wa-msg-meta">${escapeHtml(label)} · ${escapeHtml(formatWhen(msg.at))}</div>
        </div>`;
    }).join('');

    view.innerHTML = `
        <div class="wa-thread-header">
            <h2>${escapeHtml(title)}</h2>
            <p>${thread.inboundCount} ${t('incoming')} · ${thread.messages.length} ${t('total messages')}</p>
        </div>
        ${bubbles}`;

    view.scrollTop = view.scrollHeight;
}

function renderAll() {
    applyFilters();
    renderStats();
    renderThreadList();
    renderThreadView();
}

async function loadMessages() {
    hideAlert();
    const token = localStorage.getItem('token');
    if (!token) {
        window.location.href = 'login.html';
        return;
    }

    try {
        const res = await fetch(`${API_URL}/admin/whatsapp/inbound?limit=${FETCH_LIMIT}`, {
            headers: authHeaders(),
            credentials: 'include'
        });

        const text = await res.text();
        let data = {};
        if (text) {
            try {
                data = JSON.parse(text);
            } catch {
                throw new Error(res.status === 401
                    ? t('Session expired — log in again.')
                    : `HTTP ${res.status}`);
            }
        }

        if (!data.success) {
            showAlert(data.error || t('Could not load WhatsApp messages.'));
            return;
        }

        allMessages = data.data?.messages || [];
        const webhookEl = document.getElementById('waWebhookUrl');
        if (webhookEl && data.data?.webhookUrl) {
            webhookEl.textContent = data.data.webhookUrl;
        }

        renderAll();
    } catch (err) {
        showAlert(err.message || t('Could not load WhatsApp messages.'));
    }
}

function setupPolling() {
    if (pollTimer) clearInterval(pollTimer);
    pollTimer = null;
    const enabled = document.getElementById('waAutoRefresh')?.checked;
    if (enabled) {
        pollTimer = setInterval(loadMessages, POLL_MS);
    }
}

function applyPageCopy() {
    document.documentElement.lang = currentLang === 'es' ? 'es' : 'en';
    document.getElementById('waInboxTitle').textContent = t('WhatsApp Inbox');
    document.getElementById('waInboxSubtitle').textContent = t('Browse WhatsApp replies here — no Twilio Console needed.');
    document.getElementById('waAutoRefreshLabel').textContent = t('Auto-refresh 15s');
    document.getElementById('waRefreshBtn').textContent = t('Refresh');
    document.getElementById('waBackDashboard').textContent = t('Admin dashboard');
    document.getElementById('waSearch').placeholder = t('Search phone, alias or text…');
    const dir = document.getElementById('waDirectionFilter');
    if (dir) {
        dir.options[0].text = t('All messages');
        dir.options[1].text = t('Incoming only');
        dir.options[2].text = t('Outgoing manual only');
    }
}

function guardAdmin() {
    try {
        const raw = localStorage.getItem('user');
        const user = raw ? JSON.parse(raw) : null;
        if (!user || user.role !== 'admin') {
            window.location.href = 'login.html';
            return false;
        }
    } catch {
        window.location.href = 'login.html';
        return false;
    }
    return true;
}

function init() {
    if (!guardAdmin()) return;

    applyStaticTranslations();
    applyPageCopy();

    document.getElementById('waRefreshBtn')?.addEventListener('click', loadMessages);
    document.getElementById('waSearch')?.addEventListener('input', renderAll);
    document.getElementById('waDirectionFilter')?.addEventListener('change', renderAll);
    document.getElementById('waAutoRefresh')?.addEventListener('change', setupPolling);

    loadMessages();
    setupPolling();
}

init();
