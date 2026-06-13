import { BASE_ORIGIN, API_URL, CATEGORY_META, getVerificationGesture, appPath } from './globals.js';
import { showAlert, getPendingApprovalBannerHtml } from './uiHelpers.js';
import { t, applyStaticTranslations } from './i18n.js';
import { renderSpecialtyDropdown, setupLocationDropdowns } from './helpers.js';
import { addPhotoToGrid, openPendingConnectionsModal } from './professional.js';

export async function renderAdminGrid(container) {
    container.innerHTML = `
        <h3 class="gold-text" style="margin-bottom: 15px; font-size: 1.5rem; border-bottom: 1px solid rgba(212, 175, 55, 0.3); padding-bottom: 10px;">${t('Professionals Directory')}</h3>
        <div style="display: flex; gap: 20px; align-items: flex-start; flex-direction: row; flex-wrap: wrap;">
            <div class="card" style="width: 100%; max-width: 250px; flex-shrink: 0; display: flex; flex-direction: column; gap: 10px; position: sticky; top: 70px;">
                <h4 class="gold-text" style="margin-bottom: 5px;">${t('Filters')}</h4>
                <select id="adminFilterProv" class="form-select" style="width: 100%; padding: 8px; background: #222; color: white; border: 1px solid #444; border-radius: 4px;"><option value="">${t('All Provinces')}</option></select>
                <select id="adminFilterCity" class="form-select" style="width: 100%; padding: 8px; background: #222; color: white; border: 1px solid #444; border-radius: 4px;"><option value="">${t('All Cities')}</option></select>
                <select id="adminFilterNeigh" class="form-select" style="width: 100%; padding: 8px; background: #222; color: white; border: 1px solid #444; border-radius: 4px;"><option value="">${t('All Neighborhoods')}</option></select>
                <select id="adminFilterSpecialty" class="form-select" style="width: 100%; padding: 8px; background: #222; color: white; border: 1px solid #444; border-radius: 4px;">
                    <option value="">${t('All Specialties')}</option>
                    <option value="Love Alchemy">${t('Love Alchemy')}</option>
                    <option value="Massage">${t('Massage')}</option>
                    <option value="Virtual Connection">${t('Virtual Connection')}</option>
                    <option value="Media Content">${t('Media Content')}</option>
                    <option value="Streaming Kisses">${t('Streaming Kisses')}</option>
                </select>
                <select id="adminFilterQuality" class="form-select" style="width: 100%; padding: 8px; background: #222; color: white; border: 1px solid #444; border-radius: 4px;">
                    <option value="">${t('All Qualities')}</option>
                    <option value="Elite">${t(CATEGORY_META['Elite'].name)}</option>
                    <option value="Premium">${t(CATEGORY_META['Premium'].name)}</option>
                    <option value="Gold">${t(CATEGORY_META['Gold'].name)}</option>
                    <option value="Silver">${t(CATEGORY_META['Silver'].name)}</option>
                    <option value="Standard">${t(CATEGORY_META['Standard'].name)}</option>
                </select>
                <button id="adminFilterBtn" style="padding: 8px 20px; width: 100%;">${t('Filter')}</button>
            </div>
            <div id="adminGridContent" style="flex-grow: 1; min-width: 300px;">Loading...</div>
        </div>
    `;

    setupLocationDropdowns('adminFilterProv', 'adminFilterCity', 'adminFilterNeigh', true, {});

    document.getElementById('adminFilterBtn').onclick = () => {
        loadAdminGridData();
    };

    await loadAdminGridData();
    applyStaticTranslations(container);
}

export async function loadAdminGridData() {
    const content = document.getElementById('adminGridContent');
    content.innerHTML = '<p>Loading...</p>';
    try {
        const token = localStorage.getItem('token');
        
        let url;
        url = new URL(`${API_URL}/admin/professionals`);
        url.searchParams.set('_', new Date().getTime());
        let res = await fetch(url, { headers: { 'Authorization': `Bearer ${token}` } });
        
        if (!res.ok) {
            // Fallback to public endpoint if the custom admin route isn't available
            url = new URL(`${API_URL}/professionals`);
            url.searchParams.set('limit', 100);
            res = await fetch(url, { headers: { 'Authorization': `Bearer ${token}` } });
        }
        const data = await res.json();

        if (!data.success) {
            content.innerHTML = `<p style="color: var(--accent-red);">Error: ${data.error}</p>`;
            return;
        }

        let profs = data.data;

        // Apply frontend filters
        const provEl = document.getElementById('adminFilterProv');
        const cityEl = document.getElementById('adminFilterCity');
        const neighEl = document.getElementById('adminFilterNeigh');
        const qualityEl = document.getElementById('adminFilterQuality');
        const specialtyEl = document.getElementById('adminFilterSpecialty');
        
        const prov = provEl ? provEl.value.trim().toLowerCase() : '';
        const city = cityEl ? cityEl.value.trim().toLowerCase() : '';
        const neigh = neighEl ? neighEl.value.trim().toLowerCase() : '';
        const quality = qualityEl ? qualityEl.value : '';
        const filterSpecialty = specialtyEl ? specialtyEl.value.toLowerCase() : '';

        profs = profs.filter(p => {
            if (!p) return false;
            const prof = p.professionalProfile || {};
            const loc = prof.location || {};
            
            const lProv = (loc.province || '').trim().toLowerCase();
            if (prov && (!lProv || (!lProv.includes(prov) && !prov.includes(lProv)))) return false;
            
            if (prov === 'caba') {
                const lNeigh = (loc.neighborhood || '').trim().toLowerCase();
                if (city && (!lNeigh || !lNeigh.includes(city))) return false;
            } else {
                const lCity = (loc.city || '').trim().toLowerCase();
                const lNeigh = (loc.neighborhood || '').trim().toLowerCase();
                if (city && (!lCity || !lCity.includes(city))) return false;
                if (neigh && (!lNeigh || !lNeigh.includes(neigh))) return false;
            }
            
            if (quality && (!prof.quality || prof.quality !== quality)) return false;
            if (filterSpecialty && (!prof.services || !prof.services.map(s => s.toLowerCase()).includes(filterSpecialty))) return false;
            return true;
        });

        // Order by categories (quality)
        const categories = { 'Elite': [], 'Premium': [], 'Gold': [], 'Silver': [], 'Standard': [], 'Uncategorized': [] };
        profs.forEach(p => {
            const q = p.professionalProfile?.quality || 'Uncategorized';
            if (categories[q]) categories[q].push(p);
            else categories['Uncategorized'].push(p);
        });

        content.innerHTML = '';

        let isFirstAdminCategoryRendered = true;

        for (const [cat, items] of Object.entries(categories)) {
            if (items.length === 0) continue;

            const meta = CATEGORY_META[cat];

            // Mathematically fair shuffle (Fisher-Yates) for admin categories
            for (let i = items.length - 1; i > 0; i--) {
                const j = Math.floor(Math.random() * (i + 1));
                [items[i], items[j]] = [items[j], items[i]];
            }

            const catSection = document.createElement('div');
            catSection.className = 'fileteado-section';
            catSection.style.marginBottom = '25px';
            catSection.style.border = '14px solid transparent';
            catSection.style.borderImage = 'url("data:image/svg+xml;utf8,<svg width=\'40\' height=\'40\' viewBox=\'0 0 40 40\' xmlns=\'http://www.w3.org/2000/svg\'><rect x=\'1\' y=\'1\' width=\'38\' height=\'38\' fill=\'none\' stroke=\'%23D4AF37\' stroke-width=\'1\'/><path d=\'M1 12 Q 12 12 12 1\' fill=\'none\' stroke=\'%23D4AF37\' stroke-width=\'1.5\'/><path d=\'M28 1 Q 28 12 39 12\' fill=\'none\' stroke=\'%23D4AF37\' stroke-width=\'1.5\'/><path d=\'M39 28 Q 28 28 28 39\' fill=\'none\' stroke=\'%23D4AF37\' stroke-width=\'1.5\'/><path d=\'M12 39 Q 12 28 1 28\' fill=\'none\' stroke=\'%23D4AF37\' stroke-width=\'1.5\'/><path d=\'M4 6 Q 6 4 8 6 Q 6 8 4 6\' fill=\'%232e7d32\'/><path d=\'M36 6 Q 34 4 32 6 Q 34 8 36 6\' fill=\'%232e7d32\'/><path d=\'M36 34 Q 34 36 32 34 Q 34 32 36 34\' fill=\'%232e7d32\'/><path d=\'M4 34 Q 6 36 8 34 Q 6 32 4 34\' fill=\'%232e7d32\'/><circle cx=\'6\' cy=\'6\' r=\'1.5\' fill=\'%23b81d1d\'/><circle cx=\'34\' cy=\'6\' r=\'1.5\' fill=\'%23b81d1d\'/><circle cx=\'34\' cy=\'34\' r=\'1.5\' fill=\'%23b81d1d\'/><circle cx=\'6\' cy=\'34\' r=\'1.5\' fill=\'%23b81d1d\'/></svg>") 12 stretch';
            catSection.style.padding = '15px';
            catSection.innerHTML = `
                <div style="display: flex; align-items: center; justify-content: space-between; margin-bottom: 15px; border-bottom: 1px solid rgba(212, 175, 55, 0.3); padding-bottom: 10px;">
                    <div style="display: flex; align-items: center; gap: 15px;">
                        <div style="color: var(--primary-gold); width: 24px; text-align: center;">${meta.logo}</div>
                        <div>
                            <h4 style="color: var(--primary-gold); margin: 0;">
                                ${t(meta.name)} <span style="font-size: 0.8rem; color: #aaa; font-weight: normal; font-family: sans-serif;">${t(meta.desc)}</span>
                            </h4>
                        </div>
                    </div>
                </div>
            `;
            
            const grid = document.createElement('div');
            grid.className = 'five-column-grid';

            items.forEach(p => {
                const card = document.createElement('div');
                card.style.background = '#222';
                card.style.padding = '10px';
                card.style.borderRadius = '8px';
                card.style.textAlign = 'center';
                card.style.border = '1px solid #333';
                
                const alias = p.professionalProfile?.alias || 'No Alias';
                const photo = (p.professionalProfile?.photos && p.professionalProfile.photos.length > 0) ? p.professionalProfile.photos[0] : 'https://via.placeholder.com/150?text=No+Photo';
                const vStatus = p.verificationStatus || 'pending';
                const statusColor = vStatus === 'approved' ? 'green' : (vStatus === 'rejected' ? 'red' : 'orange');
                const thumbWrap = document.createElement('div');
                thumbWrap.style.cssText = 'width: 100%; aspect-ratio: 1/1; overflow: hidden; border-radius: 4px; margin-bottom: 10px; position: relative;';
                const thumbImg = document.createElement('img');
                thumbImg.src = photo;
                thumbImg.style.cssText = 'width: 100%; height: 100%; object-fit: cover;';
                if (!isFirstAdminCategoryRendered) thumbImg.loading = 'lazy';
                const statusBadge = document.createElement('div');
                statusBadge.style.cssText = `position: absolute; top: 5px; right: 5px; font-size: 0.55rem; padding: 2px 6px; border-radius: 10px; background: ${statusColor}; color: white; font-weight: bold; box-shadow: 0 2px 4px rgba(0,0,0,0.5);`;
                statusBadge.textContent = vStatus.toUpperCase();
                thumbWrap.appendChild(thumbImg);
                thumbWrap.appendChild(statusBadge);

                const aliasEl = document.createElement('div');
                aliasEl.style.cssText = 'font-weight: bold; margin-bottom: 5px; color: var(--primary-gold); white-space: nowrap; overflow: hidden; text-overflow: ellipsis; font-size: 0.8rem;';
                aliasEl.textContent = alias;
                const emailEl = document.createElement('div');
                emailEl.style.cssText = 'font-size: 0.65rem; color: #aaa; margin-bottom: 10px; white-space: nowrap; overflow: hidden; text-overflow: ellipsis;';
                emailEl.textContent = p.email;
                const editBtn = document.createElement('button');
                editBtn.className = 'edit-btn';
                editBtn.style.cssText = 'width: 100%; padding: 6px; font-size: 0.7rem; cursor: pointer; background: transparent; border: 1px solid var(--primary-gold); color: var(--primary-gold);';
                editBtn.textContent = '✏️ Edit';

                card.appendChild(thumbWrap);
                card.appendChild(aliasEl);
                card.appendChild(emailEl);
                card.appendChild(editBtn);
                
                editBtn.onclick = () => {
                    openEditProfessionalModal(p);
                };

                grid.appendChild(card);
            });

            catSection.appendChild(grid);
            content.appendChild(catSection);
            
            isFirstAdminCategoryRendered = false;
        }

        if (profs.length === 0) {
            content.innerHTML = '<p>No professionals match your filters.</p>';
        }
        applyStaticTranslations(content);

    } catch (err) {
        content.innerHTML = `<p style="color: var(--accent-red);">${t('Error connecting to the vault:')} ${err.message}</p>`;
    }
}

// --- Dashboard ---

export async function loadDashboard() {
    const content = document.getElementById('dashboardContent');
    const loader = document.getElementById('loader');
    if (!content) return;

    try {
        const token = localStorage.getItem('token');
        // Added credentials: 'include' to ensure the auth cookie is sent with the request.
        // This is the likely fix for the login redirect loop.
        const res = await fetch(`${API_URL}/professionals/me?_=${new Date().getTime()}`, {
            headers: { 'Authorization': `Bearer ${token}` },
            credentials: 'include'
        });
        const data = await res.json();

        if (data.success) {
            const user = data.data;
            localStorage.setItem('user', JSON.stringify(user)); // Ensure local storage is synced
            const stats = data.stats || { photoCount: 0, whatsappcCount: 0, callCount: 0 };

            // Apply global dynamic pricing
            if (data.globalPricing) {
                const fmt = (num) => new Intl.NumberFormat('es-AR').format(num) + ' ARS';
                CATEGORY_META['Elite'].price = fmt(data.globalPricing.Elite);
                CATEGORY_META['Premium'].price = fmt(data.globalPricing.Premium);
                CATEGORY_META['Gold'].price = fmt(data.globalPricing.Gold);
                CATEGORY_META['Silver'].price = fmt(data.globalPricing.Silver);
                CATEGORY_META['Standard'].price = fmt(data.globalPricing.Standard);
            }

            // --- Admin Specific Injection ---
            if (user.role === 'admin' && content) {
                content.innerHTML = ''; // Clear out the professional profile form
                
                const adminLayout = document.createElement('div');
                adminLayout.style.display = 'flex';
                adminLayout.style.gap = '20px';
                adminLayout.style.alignItems = 'flex-start';
                adminLayout.style.flexWrap = 'wrap';

                const adminPanel = document.createElement('div');
                adminPanel.id = 'adminPanelSection';
                adminPanel.className = 'card';
                adminPanel.style.marginBottom = '20px';
                adminPanel.style.border = '1px solid var(--primary-gold)';
                adminPanel.style.width = '320px';
                adminPanel.style.flexShrink = '0';
                adminPanel.style.position = 'sticky';
                adminPanel.style.top = '70px';
                adminPanel.style.padding = '0';
                
                adminPanel.innerHTML = `
                    <div style="padding: 10px;">
                        <h3 class="gold-text" style="margin-bottom: 25px; font-size: 1.5rem; text-align: center; border-bottom: 1px solid rgba(212, 175, 55, 0.3); padding-bottom: 15px;">Admin Control Panel</h3>
                        
                        <div class="admin-menu-section" style="margin-bottom: 25px;">
                            <h4 style="color: #888; font-size: 0.85rem; text-transform: uppercase; letter-spacing: 1px; margin-bottom: 12px; padding-left: 10px;">Core Management</h4>
                            <div style="display: flex; flex-direction: column; gap: 5px;">
                                <button id="btnProfProfileAdmin" class="admin-nav-btn">👥 Professional Profiles</button>
                                <button id="btnPendingApprovals" class="admin-nav-btn active-nav">✅ Pending Approvals</button>
                                <button id="btnPaymentVerifications" class="admin-nav-btn">💳 Payment Verifications</button>
                                <button id="btnDashboardConfig" class="admin-nav-btn">⚙️ Dashboard Config</button>
                            </div>
                        </div>

                        <div class="admin-menu-section" style="margin-bottom: 25px;">
                            <h4 style="color: #888; font-size: 0.85rem; text-transform: uppercase; letter-spacing: 1px; margin-bottom: 12px; padding-left: 10px;">Communications</h4>
                            <div style="display: flex; flex-direction: column; gap: 5px;">
                                <button id="btnMailSpecial" class="admin-nav-btn">📧 Mail: Special Messages</button>
                                <button id="btnMailBroadcast" class="admin-nav-btn">📢 Mail: Broadcast Messages</button>
                                <button id="btnWaSpecial" class="admin-nav-btn">💬 WA: Special Messages</button>
                                <button id="btnWaBroadcast" class="admin-nav-btn">📲 WA: Broadcast Messages</button>
                            </div>
                        </div>

                        <div class="admin-menu-section" style="margin-bottom: 25px;">
                            <h4 style="color: #888; font-size: 0.85rem; text-transform: uppercase; letter-spacing: 1px; margin-bottom: 12px; padding-left: 10px;">Analytics & Traces</h4>
                            <div style="display: flex; flex-direction: column; gap: 5px;">
                                <button id="btnGuestTraffic" class="admin-nav-btn">🕵️‍♂️ Guest Traffic</button>
                                <button id="btnTreasuresSteps" class="admin-nav-btn">💎 Treasures Steps</button>
                                <button id="btnViewLogs" class="admin-nav-btn">📊 Full Activity Logs</button>
                            </div>
                        </div>

                        <div class="admin-menu-section">
                            <h4 style="color: #888; font-size: 0.85rem; text-transform: uppercase; letter-spacing: 1px; margin-bottom: 12px; padding-left: 10px;">System Settings</h4>
                            <div style="display: flex; flex-direction: column; gap: 5px;">
                                <button id="btnEditPricing" class="admin-nav-btn" style="color: var(--primary-gold); border-color: rgba(212, 175, 55, 0.3);">💰 ${t('Change prices')}</button>
                                <button id="btnViewLeads" class="admin-nav-btn">📞 View Scraped Leads</button>
                            </div>
                        </div>
                    </div>
                `;
                
                const gridContainer = document.createElement('div');
                gridContainer.id = 'adminGridContainer';
                gridContainer.style.flexGrow = '1';
                gridContainer.style.minWidth = '300px';
                
                adminLayout.appendChild(adminPanel);
                adminLayout.appendChild(gridContainer);
                content.appendChild(adminLayout);
                
                document.getElementById('btnEditPricing').addEventListener('click', () => openEditPricingModal(data.globalPricing));
                document.getElementById('btnViewLogs').addEventListener('click', () => openActivityLogsModal());
                document.getElementById('btnGuestTraffic').addEventListener('click', () => openActivityLogsModal('Guest Traffic', { isGuest: 'true' }));
                document.getElementById('btnTreasuresSteps').addEventListener('click', () => openActivityLogsModal('Treasures Steps', { isGuest: 'false' }));
                document.getElementById('btnViewLeads').addEventListener('click', openViewLeadsModal);
                document.getElementById('btnPendingApprovals').addEventListener('click', openPendingVerificationsModal);
                document.getElementById('btnPaymentVerifications').addEventListener('click', openPaymentVerificationsModal);
                
                document.getElementById('btnProfProfileAdmin').addEventListener('click', () => {
                    document.getElementById('adminGridContainer').scrollIntoView({ behavior: 'smooth' });
                });

                ['btnDashboardConfig', 'btnMailSpecial', 'btnWaSpecial', 'btnWaBroadcast'].forEach(id => {
                    document.getElementById(id).addEventListener('click', () => alert('Feature coming soon!'));
                });

                document.getElementById('btnMailBroadcast').addEventListener('click', openMailBroadcastModal);

                renderAdminGrid(gridContainer);
                
                if (loader) loader.classList.add('hidden');
                content.classList.remove('hidden');
                applyStaticTranslations(content);
                return; // Stop execution to prevent loading professional specific data
            }

            const prof = user.professionalProfile || {};
            const isApproved = user.verificationStatus === 'approved';

            const insertRef = document.querySelector('#dashboardContent > .grid') || content.firstChild;

            // Welcome Instructions / How Site Works
            if (user.role === 'professional' && !localStorage.getItem('hideWelcomeGuide') && !document.getElementById('welcomeGuideSection')) {
                const welcomeSection = document.createElement('div');
                welcomeSection.id = 'welcomeGuideSection';
                welcomeSection.className = 'card';
                welcomeSection.style.marginBottom = '20px';
                welcomeSection.style.background = 'rgba(212, 175, 55, 0.05)';
                welcomeSection.style.border = '1px solid rgba(212, 175, 55, 0.4)';
                welcomeSection.style.position = 'relative';

                welcomeSection.innerHTML = `
                    <button id="dismissWelcomeBtn" style="position: absolute; top: 15px; right: 15px; background: transparent; border: 1px solid var(--primary-gold); color: var(--primary-gold); padding: 4px 8px; font-size: 0.8rem; border-radius: 4px; cursor: pointer; transition: background 0.3s;" onmouseover="this.style.background='rgba(212,175,55,0.1)'" onmouseout="this.style.background='transparent'">${t('Dismiss')}</button>
                    <h3 class="gold-text" style="margin-bottom: 15px;">📖 ${t('Welcome Guide & How It Works')}</h3>
                    <ul style="line-height: 1.6; color: #ccc; margin-left: 20px; font-size: 0.95rem;">
                        <li style="margin-bottom: 10px;"><strong>${t('Privacy Guarantee:')}</strong> Our platform uses zero cookies and zero third-party trackers. Your identity and client interactions remain completely confidential.</li>
                        <li style="margin-bottom: 10px;"><strong>${t('Visibility Control:')}</strong> You can instantly hide or show your profile on the public grid using the "Show in public directory" checkbox below.</li>
                        <li style="margin-bottom: 10px;"><strong>${t('Uploading Photos:')}</strong> Once approved, use the dashed rectangle in the "Manage Photos" section to upload or re-arrange your gallery.</li>
                        <li style="margin-bottom: 10px;"><strong>${t('WhatsApp Connections:')}</strong> Clients connect directly via your provided WhatsApp number. We charge zero commissions per connection.</li>
                        <li style="margin-bottom: 10px;"><strong>${t('Profile Tiers:')}</strong> Your category (Elite, Premium, etc.) is automatically calculated based on your assets (apartment, wardrobe, location).</li>
                    </ul>
                `;
                content.insertBefore(welcomeSection, insertRef);

                document.getElementById('dismissWelcomeBtn').addEventListener('click', () => {
                    localStorage.setItem('hideWelcomeGuide', 'true');
                    welcomeSection.remove();
                });
            }

            // Notifications & Pending Actions
            if (user.role === 'professional' && !document.getElementById('notificationCenter')) {
                const notifSection = document.createElement('div');
                notifSection.id = 'notificationCenter';
                notifSection.className = 'card fileteado-section';
                notifSection.style.marginBottom = '20px';
                notifSection.style.border = '1px solid var(--primary-gold)';

                let alertsHtml = '';
                
                if (user.verificationStatus === 'pending') {
                    alertsHtml += `<div style="background: rgba(255,165,0,0.12); border-left: 4px solid orange; padding: 12px 15px; margin-bottom: 10px; line-height: 1.5;">⏳ <strong>${t('Pending Admin Approval')}</strong><br><span style="font-size: 0.9rem; color: #ddd;">${t('Your profile is under review (typically up to 48 hours). Profile changes can only be made after admin approval. You will receive an email when your account is approved — please check your Spam folder too.')}</span></div>`;
                } else if (user.verificationStatus === 'rejected') {
                    alertsHtml += `<div style="background: rgba(255,0,0,0.1); border-left: 4px solid var(--accent-red); padding: 10px; margin-bottom: 10px;">❌ <strong>Verification Rejected:</strong> Your profile was not approved. Please contact support.</div>`;
                }

                if (isApproved && (!prof.photos || prof.photos.length === 0)) {
                    alertsHtml += `<div style="background: rgba(212,175,55,0.1); border-left: 4px solid var(--primary-gold); padding: 15px; margin-bottom: 10px; line-height: 1.5;">🎉 <strong style="color: var(--primary-gold);">${t('Welcome to SexAppeal!')}</strong><br>${t('You are now approved and ready to upload your personal photos. Note: The first photo will be treated as your profile Thumbnail. You can drag and drop photos below to change their order at any time.')}</div>`;
                }

                if (!data.isReadyForTransactions && isApproved) {
                    alertsHtml += `<div style="background: rgba(255,0,0,0.1); border-left: 4px solid var(--accent-red); padding: 10px; margin-bottom: 10px;">💰 <strong>Rate Update:</strong> Please acknowledge the new pricing rates in the alert above to maintain your visibility.</div>`;
                }

                // Trial & Prorated Billing Engine Display
                if (prof.subscriptionStatus === 'trial') {
                    const trialEnd = new Date(prof.trialEndDate);
                    const now = new Date();
                    if (trialEnd > now) {
                        const endYear = trialEnd.getFullYear();
                        const endMonth = trialEnd.getMonth();
                        const daysInMonth = new Date(endYear, endMonth + 1, 0).getDate();
                        const remainingDays = daysInMonth - trialEnd.getDate() + 1; // Inclusive of end day
                        
                        let proratedAmt = 0;
                        if (remainingDays > 0 && trialEnd.getDate() !== 1) {
                            const globalPrices = data.globalPricing || { Standard: 15000, Silver: 20000, Gold: 30000, Premium: 40000, Elite: 50000 };
                            const catPrice = globalPrices[prof.quality || 'Standard'];
                            const pricePerDay = catPrice / daysInMonth;
                            proratedAmt = Math.round(pricePerDay * remainingDays);
                        }
                        
                        alertsHtml += `<div style="background: rgba(212,175,55,0.1); border-left: 4px solid var(--primary-gold); padding: 15px; margin-bottom: 10px;">
                            💎 <strong>First Month Free:</strong> Your trial ends on ${trialEnd.toLocaleDateString()}.
                            ${proratedAmt > 0 ? `<br>Since your trial ends mid-month, you will only be charged a prorated amount of <strong>${new Intl.NumberFormat('es-AR').format(proratedAmt)} ARS</strong> for the remainder of that month.` : ''}
                        </div>`;
                    }
                }

                if (prof.subscriptionStatus === 'suspended') {
                    let pendingInv = (prof.invoices || []).find(i => i.status === 'pending');
                    let feeText = pendingInv && pendingInv.lateFeeApplied ? ` A 2% late fee has been applied. Your new balance is $${new Intl.NumberFormat('es-AR').format(pendingInv.amount)} ARS.` : '';
                    alertsHtml += `<div style="background: rgba(255,0,0,0.1); border-left: 4px solid var(--accent-red); padding: 10px; margin-bottom: 10px;">🛑 <strong>Account Suspended:</strong> Your profile is hidden due to unpaid balances.${feeText} Upload your receipt to restore access.</div>`;
                }

                if (!alertsHtml) {
                    alertsHtml = `<div style="color: #888; font-style: italic;">${t('No pending actions at this time.')}</div>`;
                }

                notifSection.innerHTML = `
                    <h3 class="gold-text" style="margin-bottom: 15px;">🔔 ${t('Notifications & Pending Items')}</h3>
                    ${alertsHtml}
                `;
                content.insertBefore(notifSection, insertRef);
            }
            
            // Analytics Frame (Last Month)
            let analyticsSection = document.getElementById('analyticsSection');
            if (!analyticsSection && user.role === 'professional') {
                analyticsSection = document.createElement('div');
                analyticsSection.id = 'analyticsSection';
                analyticsSection.className = 'card fileteado-section';
                analyticsSection.style.marginBottom = '20px';
                analyticsSection.style.border = '1px solid var(--primary-gold)';
                analyticsSection.innerHTML = `
                    <h3 class="gold-text" style="margin-bottom: 15px;">Performance Analytics (Last Month)</h3>
                    <div style="display: flex; gap: 20px; justify-content: space-around; text-align: center;">
                        <div><div style="font-size: 2.5rem; color: var(--primary-gold);">${stats.photoCount || 0}</div><div style="font-size: 0.9rem; color: #ccc;">Dashboard Photo Clicks</div></div>
                        <div><div style="font-size: 2.5rem; color: var(--primary-gold);">${stats.whatsappcCount || 0}</div><div style="font-size: 0.9rem; color: #ccc;">WhatsApp Button Pushes</div></div>
                        <div><div style="font-size: 2.5rem; color: var(--primary-gold);">${stats.callCount || 0}</div><div style="font-size: 0.9rem; color: #ccc;">Call Button Pushes</div></div>
                    </div>
                `;
                content.insertBefore(analyticsSection, insertRef);
            }

            // Connection Requests section
            let connSection = document.getElementById('connectionRequestsSection');
            if (!connSection && user.role === 'professional') {
                connSection = document.createElement('div');
                connSection.id = 'connectionRequestsSection';
                connSection.className = 'card fileteado-section';
                connSection.style.marginBottom = '20px';
                connSection.style.border = '1px solid var(--primary-gold)';
                
                connSection.innerHTML = `
                    <h3 class="gold-text" style="margin-bottom: 15px;">Connection Requests</h3>
                    <div style="display: flex; gap: 10px; flex-wrap: wrap;">
                        <button id="btnViewConnections" style="width: auto; padding: 10px 20px; background: var(--primary-gold); color: var(--dark-bg);">View Pending Requests</button>
                    </div>
                `;
                content.insertBefore(connSection, insertRef);
                
                document.getElementById('btnViewConnections').addEventListener('click', openPendingConnectionsModal);
            }

            // Services and Category Block (Checkboxes with Tooltips)
            if (!document.getElementById('servicesBlock')) {
                const servicesBlock = document.createElement('div');
                servicesBlock.id = 'servicesBlock';
                servicesBlock.className = 'card fileteado-section';
                servicesBlock.style.marginTop = '20px';
                servicesBlock.style.border = '1px solid var(--primary-gold)';
                
                const title = document.createElement('h3');
                title.className = 'gold-text';
                title.textContent = 'Category & Specialties';
                title.style.marginBottom = '15px';
                servicesBlock.appendChild(title);
                
                const catInfo = document.createElement('div');
                const qMeta = CATEGORY_META[prof.quality || 'Standard'];
                catInfo.innerHTML = `<p style="margin-bottom: 15px;"><strong>Category:</strong> <span style="color: var(--primary-gold);">${qMeta ? t(qMeta.name) : (prof.quality || 'Standard')}</span></p>
                    <label style="display: block; margin-bottom: 5px;">${t('Category:')}</label>
                    <select id="upQuality" style="width: 100%; padding: 8px; background: #222; color: white; border: 1px solid var(--primary-gold); border-radius: 4px; margin-bottom: 15px;">
                        <option value="Elite" ${prof.quality === 'Elite' ? 'selected' : ''}>${t(CATEGORY_META['Elite'].name)}</option>
                        <option value="Premium" ${prof.quality === 'Premium' ? 'selected' : ''}>${t(CATEGORY_META['Premium'].name)}</option>
                        <option value="Gold" ${prof.quality === 'Gold' ? 'selected' : ''}>${t(CATEGORY_META['Gold'].name)}</option>
                        <option value="Silver" ${prof.quality === 'Silver' ? 'selected' : ''}>${t(CATEGORY_META['Silver'].name)}</option>
                        <option value="Standard" ${prof.quality === 'Standard' ? 'selected' : ''}>${t(CATEGORY_META['Standard'].name)}</option>
                    </select>
                `;
                const catSelect = catInfo.querySelector('#upQuality');
                if (catSelect) catSelect.addEventListener('change', () => { if (typeof window.saveProfessionalProfile === 'function') window.saveProfessionalProfile(true); });
                servicesBlock.appendChild(catInfo);
                
                const specLabel = document.createElement('label');
                specLabel.textContent = t('Specialties:');
                specLabel.style.display = 'block';
                specLabel.style.marginBottom = '10px';
                servicesBlock.appendChild(specLabel);
                
                const specs = [
                    { name: 'Love Alchemy', tooltip: 'Sex' },
                    { name: 'Massage', tooltip: 'Conventional massage' },
                    { name: 'Virtual Connection', tooltip: 'Virtual call' },
                    { name: 'Media Content', tooltip: 'Share hot content pics or videos' },
                    { name: 'Streaming Kisses', tooltip: 'Live streaming kisses' }
                ];
                
                const specsContainer = document.createElement('div');
                specsContainer.style.display = 'flex';
                specsContainer.style.flexWrap = 'wrap';
                specsContainer.style.gap = '10px';
                
                const userServices = prof.services || [];
                
                specs.forEach(spec => {
                    const lbl = document.createElement('label');
                    lbl.title = spec.tooltip;
                    lbl.style.display = 'flex';
                    lbl.style.alignItems = 'center';
                    lbl.style.gap = '5px';
                    lbl.style.cursor = 'pointer';
                    lbl.style.padding = '8px 12px';
                    lbl.style.background = 'rgba(212,175,55,0.1)';
                    lbl.style.borderRadius = '4px';
                    lbl.style.border = '1px solid rgba(212,175,55,0.3)';
                    lbl.style.fontSize = '0.9rem';
                    
                    const cb = document.createElement('input');
                    cb.type = 'checkbox';
                    cb.value = spec.name;
                    cb.className = 'dashboard-specialty-cb';
                    cb.checked = userServices.includes(spec.name) || userServices.includes(spec.name.toLowerCase());
                    
                    cb.addEventListener('change', () => {
                        if (typeof window.saveProfessionalProfile === 'function') window.saveProfessionalProfile(true);
                    });

                    lbl.appendChild(cb);
                    lbl.appendChild(document.createTextNode(t(spec.name)));
                    specsContainer.appendChild(lbl);
                });
                
                servicesBlock.appendChild(specsContainer);
                
                const formObj = document.getElementById('updateProfileForm');
                const bioEl = document.getElementById('upBio');
                
                // Hide old services dropdown if exists
                const oldServ = document.getElementById('upServices');
                if (oldServ) {
                    oldServ.style.display = 'none';
                    if (oldServ.previousElementSibling) oldServ.previousElementSibling.style.display = 'none';
                }

                if (bioEl && bioEl.parentNode && bioEl.parentNode.tagName === 'DIV' && bioEl.parentNode.querySelector('#goldPenIcon')) {
                    formObj.insertBefore(servicesBlock, bioEl.parentNode);
                } else if (bioEl) {
                    formObj.insertBefore(servicesBlock, bioEl);
                } else if (formObj) {
                    formObj.appendChild(servicesBlock);
                }
            }

            // Extended Contact block
            if (!document.getElementById('extraContactBlock')) {
                const extraBlock = document.createElement('div');
                extraBlock.id = 'extraContactBlock';
                extraBlock.className = 'card fileteado-section';
                extraBlock.style.marginTop = '20px';
                extraBlock.style.border = '1px solid var(--primary-gold)';
                extraBlock.innerHTML = `
                    <h3 class="gold-text" style="margin-bottom: 15px;">Extended Contact & Address</h3>
                    <div style="display: flex; gap: 10px; flex-wrap: wrap; margin-bottom: 10px;">
                        <div style="flex: 1; min-width: 200px;">
                            <label style="display: block; margin-bottom: 5px;">Post Code</label>
                        <input type="text" id="upPostCode" value="${prof.location?.postalCode || ''}" style="width: 100%; padding: 8px; background: #222; color: white; border: 1px solid #444; border-radius: 4px;">
                        </div>
                    </div>
                    <div style="display: flex; gap: 10px; flex-wrap: wrap;">
                        <div style="flex: 1; min-width: 200px;">
                            <label style="display: block; margin-bottom: 5px;">Instagram</label>
                            <input type="text" id="upInstagram" value="${prof.instagram || ''}" style="width: 100%; padding: 8px; background: #222; color: white; border: 1px solid #444; border-radius: 4px;">
                        </div>
                        <div style="flex: 1; min-width: 200px;">
                            <label style="display: block; margin-bottom: 5px;">Facebook</label>
                            <input type="text" id="upFacebook" value="${prof.facebook || ''}" style="width: 100%; padding: 8px; background: #222; color: white; border: 1px solid #444; border-radius: 4px;">
                        </div>
                    </div>
                `;
                const formObj = document.getElementById('updateProfileForm');
                const vacBlock = document.getElementById('vacationBlock');
                if (vacBlock) {
                    formObj.insertBefore(extraBlock, vacBlock);
                } else {
                    formObj.appendChild(extraBlock);
                }
                extraBlock.querySelectorAll('input').forEach(input => {
                    input.addEventListener('blur', () => { if (typeof window.saveProfessionalProfile === 'function') window.saveProfessionalProfile(true); });
                });
            }

            // Safe value setter (ignores missing HTML elements)
            const setVal = (id, val) => {
                const el = document.getElementById(id);
                if (el) el.value = val;
            };

            // Fill fields
            setVal('upFirstName', prof.firstName || '');
            setVal('upSurname', prof.surname || '');
            setVal('upMiddleName', prof.middleName || '');
            setVal('upIdNumber', prof.idNumber || '');
            if (prof.birthDate) {
                const d = new Date(prof.birthDate);
                setVal('upBirthDate', d.toISOString().split('T')[0]);
            }
            setVal('upAge', prof.age || '');
            setVal('upMobilePhone', prof.mobilePhone || '');
            setVal('upStreet', prof.location?.street || '');
            setVal('upStreetNumber', prof.location?.number || '');
            setVal('upFloor', prof.location?.floor || '');
            setVal('upApartment', prof.location?.apartment || '');

            const upBirthDate = document.getElementById('upBirthDate');
            if (upBirthDate) {
                upBirthDate.addEventListener('change', (e) => {
                    if (e.target.value) {
                        const dob = new Date(e.target.value);
                        const ageDifMs = Date.now() - dob.getTime();
                        document.getElementById('upAge').value = Math.abs(new Date(ageDifMs).getUTCFullYear() - 1970);
                    }
                });
            }

            // Make non-editable fields grey and build Profile UI
            if (user.role === 'professional') {
                // Only Address and Connection blocks remain editable
                const readOnlyFields = ['upFirstName', 'upSurname', 'upMiddleName', 'upIdNumber', 'upBirthDate', 'upAlias', 'upMeasurements', 'upHeight'];
                readOnlyFields.forEach(id => {
                    const el = document.getElementById(id);
                    if (el) {
                        el.readOnly = true; el.disabled = true;
                        el.style.background = '#333'; el.style.color = '#888'; el.style.borderColor = '#444'; el.style.cursor = 'not-allowed';
                    }
                });
                const readOnlyToggles = ['upOwnApartment', 'upFantasyWardrobe', 'upServices'];
                readOnlyToggles.forEach(id => {
                    const el = document.getElementById(id);
                    if (el) { el.disabled = true; el.style.opacity = '0.6'; el.style.cursor = 'not-allowed'; }
                });

                // Main Profile Frame (Yellow Pen)
                const formEl = document.getElementById('updateProfileForm');
                if (formEl && !document.getElementById('yellowPenIcon')) {
                    formEl.style.position = 'relative';
                    const yellowPen = document.createElement('span');
                    yellowPen.id = 'yellowPenIcon';
                    yellowPen.innerHTML = '✏️';
                    yellowPen.style.cssText = 'position: absolute; top: 10px; right: 10px; color: yellow; font-size: 1.5rem; cursor: pointer; text-shadow: 0 0 5px rgba(255,255,0,0.5); z-index: 10;';
                    yellowPen.title = 'Edit Profile (Address and Connection Info Only)';
                    formEl.appendChild(yellowPen);
                }

                // Service Description Frame (Gold Pen)
                const bioEl = document.getElementById('upBio');
                if (bioEl && !document.getElementById('goldPenIcon')) {
                    const wrapper = document.createElement('div');
                    wrapper.style.position = 'relative';
                    wrapper.style.marginTop = '20px';
                    wrapper.style.padding = '15px';
                    wrapper.style.border = '1px solid var(--primary-gold)';
                    wrapper.style.borderRadius = '8px';
                    
                    const goldPen = document.createElement('span');
                    goldPen.id = 'goldPenIcon';
                    goldPen.innerHTML = '✏️';
                    goldPen.style.cssText = 'position: absolute; top: 10px; right: 10px; color: gold; font-size: 1.5rem; cursor: pointer; text-shadow: 0 0 5px rgba(212,175,55,0.5); z-index: 10;';
                    goldPen.title = 'Edit Service Description';
                    
                    const title = document.createElement('h3');
                    title.className = 'gold-text';
                    title.textContent = 'Service description';
                    title.style.marginBottom = '10px';
                    
                    bioEl.parentNode.insertBefore(wrapper, bioEl);
                    wrapper.appendChild(title);
                    wrapper.appendChild(goldPen);
                    wrapper.appendChild(bioEl);
                    
                    bioEl.style.width = '100%';
                    bioEl.style.minHeight = '100px';
                }

                // Availability Schedule Block
                if (!document.getElementById('availabilityBlock')) {
                    const availBlock = document.createElement('div');
                    availBlock.id = 'availabilityBlock';
                    availBlock.className = 'card fileteado-section';
                    availBlock.style.marginTop = '20px';
                    availBlock.style.border = '1px solid var(--primary-gold)';
                    availBlock.style.position = 'relative';

                    const goldPenAvail = document.createElement('span');
                    goldPenAvail.innerHTML = '✏️';
                    goldPenAvail.style.cssText = 'position: absolute; top: 10px; right: 10px; color: gold; font-size: 1.5rem; cursor: pointer; text-shadow: 0 0 5px rgba(212,175,55,0.5); z-index: 10;';
                    goldPenAvail.title = 'Edit Availability';
                    availBlock.appendChild(goldPenAvail);
                    
                    const title = document.createElement('h3');
                    title.className = 'gold-text';
                    title.textContent = 'Availability Schedule';
                    title.style.marginBottom = '15px';
                    availBlock.appendChild(title);
                    
                    // Days checkboxes
                    const days = ['Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday', 'Sunday'];
                    const daysContainer = document.createElement('div');
                    daysContainer.style.display = 'flex';
                    daysContainer.style.gap = '10px';
                    daysContainer.style.flexWrap = 'wrap';
                    daysContainer.style.marginBottom = '15px';
                    
                    const userDays = prof.workingDays || days;
                    days.forEach(day => {
                        const lbl = document.createElement('label');
                        lbl.style.display = 'flex';
                        lbl.style.alignItems = 'center';
                        lbl.style.gap = '5px';
                        lbl.style.cursor = 'pointer';
                        
                        const cb = document.createElement('input');
                        cb.type = 'checkbox';
                        cb.value = day;
                        cb.className = 'avail-day-cb';
                        cb.checked = userDays.includes(day);
                        
                        lbl.appendChild(cb);
                        lbl.appendChild(document.createTextNode(day.substring(0, 3))); // Mon, Tue...
                        daysContainer.appendChild(lbl);
                    });
                    availBlock.appendChild(daysContainer);
                    
                    // Times
                    const timeContainer = document.createElement('div');
                    timeContainer.style.display = 'flex';
                    timeContainer.style.gap = '15px';
                    
                    const startDiv = document.createElement('div');
                    startDiv.style.flex = '1';
                    startDiv.innerHTML = '<label style="display:block; margin-bottom:5px;">Start Time (AM/PM)</label>';
                    const startInput = document.createElement('input');
                    startInput.type = 'time';
                    startInput.id = 'upAvailStart';
                    startInput.value = prof.workingHours?.start || '00:00';
                    startInput.style.cssText = 'width: 100%; padding: 8px; background: #222; color: white; border: 1px solid #444; border-radius: 4px;';
                    startDiv.appendChild(startInput);
                    
                    const endDiv = document.createElement('div');
                    endDiv.style.flex = '1';
                    endDiv.innerHTML = '<label style="display:block; margin-bottom:5px;">End Time (AM/PM)</label>';
                    const endInput = document.createElement('input');
                    endInput.type = 'time';
                    endInput.id = 'upAvailEnd';
                    endInput.value = prof.workingHours?.end || '23:59';
                    endInput.style.cssText = 'width: 100%; padding: 8px; background: #222; color: white; border: 1px solid #444; border-radius: 4px;';
                    endDiv.appendChild(endInput);
                    
                    timeContainer.appendChild(startDiv);
                    timeContainer.appendChild(endDiv);
                    availBlock.appendChild(timeContainer);
                    
                    // Disable inputs by default
                    const inputs = [startInput, endInput, ...availBlock.querySelectorAll('.avail-day-cb')];
                    inputs.forEach(el => {
                        el.disabled = true;
                        if(el.type !== 'checkbox') el.style.background = '#333';
                    });
                    
                    goldPenAvail.addEventListener('click', () => {
                        inputs.forEach(el => {
                            el.disabled = false;
                            if(el.type !== 'checkbox') el.style.background = '#222';
                        });
                        goldPenAvail.style.color = '#fff';
                        goldPenAvail.style.textShadow = '0 0 10px #fff';
                        setTimeout(() => {
                            goldPenAvail.style.color = 'gold';
                            goldPenAvail.style.textShadow = '0 0 5px rgba(212,175,55,0.5)';
                        }, 500);
                    });

                    // Hide the old legacy inputs cleanly
                    const oldStart = document.getElementById('upWorkingHoursStart');
                    if (oldStart && oldStart.parentNode && oldStart.parentNode.parentNode) {
                        oldStart.parentNode.parentNode.style.display = 'none';
                    }
                    const oldDays = document.getElementById('upWorkingDays');
                    if (oldDays) {
                        oldDays.style.display = 'none';
                        const oldDaysLabel = oldDays.previousElementSibling;
                        if (oldDaysLabel && oldDaysLabel.tagName === 'LABEL') oldDaysLabel.style.display = 'none';
                    }

                    // Insert before Vacation Block if exists, else before photos
                    const vacBlock = document.getElementById('vacationBlock');
                    if (vacBlock) {
                        vacBlock.parentNode.insertBefore(availBlock, vacBlock);
                    } else {
                        const formObj = document.getElementById('updateProfileForm');
                        const photoGridEl = document.getElementById('photoGrid');
                        if (formObj && photoGridEl) {
                            formObj.insertBefore(availBlock, photoGridEl.parentNode);
                        } else if (formObj) {
                            formObj.appendChild(availBlock);
                        }
                    }
                }

                // Vacation Block
                if (!document.getElementById('vacationBlock')) {
                    const vacBlock = document.createElement('div');
                    vacBlock.id = 'vacationBlock';
                    vacBlock.className = 'card fileteado-section';
                    vacBlock.style.marginTop = '20px';
                    vacBlock.style.border = '1px solid var(--primary-gold)';
                    vacBlock.innerHTML = `
                        <h3 class="gold-text" style="margin-bottom: 5px;">Miscellaneous (Vacation)</h3>
                        <p style="font-size: 0.85rem; color: #aaa; margin-bottom: 15px;">Max 20 calendar days. No more than 1 vacation request per year.</p>
                        <div style="display: flex; gap: 10px; flex-wrap: wrap;">
                            <div style="flex: 1; min-width: 150px;">
                                <label style="display: block; margin-bottom: 5px;">Start Date</label>
                                <input type="date" id="upVacationStart" style="width: 100%; padding: 8px; background: #222; color: white; border: 1px solid #444; border-radius: 4px;">
                            </div>
                            <div style="flex: 1; min-width: 150px;">
                                <label style="display: block; margin-bottom: 5px;">End Date</label>
                                <input type="date" id="upVacationEnd" style="width: 100%; padding: 8px; background: #222; color: white; border: 1px solid #444; border-radius: 4px;">
                            </div>
                        </div>
                        <div id="vacationWarn" style="color: var(--accent-red); font-size: 0.85rem; margin-top: 10px;"></div>
                    `;
                    
                    const formObj = document.getElementById('updateProfileForm');
                    const photoGridEl = document.getElementById('photoGrid');
                    if (formObj && photoGridEl) {
                        formObj.insertBefore(vacBlock, photoGridEl.parentNode);
                    } else if (formObj) {
                        formObj.appendChild(vacBlock);
                    }

                    if (prof.vacation) {
                        if (prof.vacation.startDate) document.getElementById('upVacationStart').value = new Date(prof.vacation.startDate).toISOString().split('T')[0];
                        if (prof.vacation.endDate) document.getElementById('upVacationEnd').value = new Date(prof.vacation.endDate).toISOString().split('T')[0];
                        
                        const reqYear = new Date(prof.vacation.requestedAt).getFullYear();
                        if (reqYear === new Date().getFullYear()) {
                            document.getElementById('vacationWarn').textContent = 'You have already submitted a vacation request for this year. It cannot be modified.';
                            document.getElementById('vacationWarn').style.color = '#ccc';
                            document.getElementById('upVacationStart').disabled = true;
                            document.getElementById('upVacationEnd').disabled = true;
                            document.getElementById('upVacationStart').style.background = '#333';
                            document.getElementById('upVacationEnd').style.background = '#333';
                        }
                    }

                    document.getElementById('upVacationEnd').addEventListener('change', () => {
                        const start = new Date(document.getElementById('upVacationStart').value);
                        const end = new Date(document.getElementById('upVacationEnd').value);
                        const warn = document.getElementById('vacationWarn');
                        warn.textContent = '';
                        if (start && end) {
                            const diff = Math.ceil((end - start) / (1000 * 60 * 60 * 24));
                            if (diff > 20) {
                                warn.textContent = 'Maximum 20 calendar days exceeded. End date automatically adjusted to highest value (20 days).';
                                const newEnd = new Date(start.getTime() + 20 * 24 * 60 * 60 * 1000);
                                document.getElementById('upVacationEnd').value = newEnd.toISOString().split('T')[0];
                            } else if (diff < 0) {
                                warn.textContent = 'End date cannot be before start date.';
                                document.getElementById('upVacationEnd').value = document.getElementById('upVacationStart').value;
                            }
                        }
                    });
                }
            }

            setVal('upAlias', prof.alias || '');
            setVal('upBio', prof.bio || '');
            
            // Update read-only quality display instead of dropdown
            const displayQuality = document.getElementById('displayQuality');
            if (displayQuality) {
                const q = prof.quality || 'Standard';
                const meta = CATEGORY_META[q];
                displayQuality.textContent = meta ? `${meta.name}` : q;
                displayQuality.className = `quality-badge quality-${q.toLowerCase()}`;
            }
            
            const aptEl = document.getElementById('upOwnApartment');
            if (aptEl) aptEl.checked = !!prof.hasOwnApartment;
            const wardEl = document.getElementById('upFantasyWardrobe');
            if (wardEl) wardEl.checked = !!prof.hasFantasyWardrobe;
            
            const expEl = document.getElementById('upIsExposed');
            if (expEl) expEl.checked = prof.isExposed !== false; // default true
            
            // Pre-select options in the multiple dropdown
            const upServicesEl = document.getElementById('upServices');
            if (upServicesEl && upServicesEl.tagName === 'SELECT') {
                const userServices = prof.services || [];
                Array.from(upServicesEl.options).forEach(opt => {
                    opt.selected = userServices.includes(opt.value);
                });
            } else {
                setVal('upServices', (prof.services || []).join(', '));
            }
            // Render specialties dropdown
            renderSpecialtyDropdown('upServices', prof.services || []);
            setVal('upMeasurements', prof.measurements || '');
            setVal('upHeight', prof.height || '');
            setVal('upWhatsapp', prof.whatsappNumber || '');
            
            setVal('upWorkingHoursStart', prof.workingHours?.start || '00:00');
            setVal('upWorkingHoursEnd', prof.workingHours?.end || '23:59');
            
            const upWDaysEl = document.getElementById('upWorkingDays');
            if (upWDaysEl && upWDaysEl.tagName === 'SELECT') {
                const wDays = prof.workingDays || [];
                Array.from(upWDaysEl.options).forEach(opt => {
                    opt.selected = wDays.includes(opt.value);
                });
            } else {
                setVal('upWorkingDays', (prof.workingDays || []).join(', '));
            }
            
            setupLocationDropdowns('upProvince', 'upCity', 'upNeighborhood', false, prof.location || {});

            const photoGrid = document.getElementById('photoGrid');
            const newPhotoInput = document.getElementById('newPhotoInput');
            if (photoGrid) {
                photoGrid.innerHTML = '';
                photoGrid.style.display = 'flex';
                photoGrid.style.flexWrap = 'wrap';
                photoGrid.style.gap = '15px';
                
                const frameLabel = document.createElement('label');
                frameLabel.className = 'add-photo-frame';
                frameLabel.style.cssText = 'width: 120px; height: 160px; border: 2px dashed var(--primary-gold); border-radius: 8px; display: flex; align-items: center; justify-content: center; cursor: pointer; color: var(--primary-gold); font-size: 2rem; background: rgba(212, 175, 55, 0.05); transition: background 0.3s ease; flex-shrink: 0;';
                frameLabel.innerHTML = '<span>+</span>';
                
                if (newPhotoInput) {
                    newPhotoInput.style.display = 'none';
                    newPhotoInput.accept = 'image/png, image/jpeg, image/jpg, image/webp';
                    newPhotoInput.multiple = true;
                    frameLabel.appendChild(newPhotoInput);
                }
                
                photoGrid.appendChild(frameLabel);

                (prof.photos || []).forEach(url => addPhotoToGrid(url));
                
                let photoWrapper = document.getElementById('photoWrapperCustom');
                if (!photoWrapper) {
                    photoWrapper = document.createElement('div');
                    photoWrapper.id = 'photoWrapperCustom';
                    photoWrapper.className = 'card fileteado-section';
                    photoWrapper.style.display = 'flex';
                    photoWrapper.style.justifyContent = 'space-between';
                    photoWrapper.style.alignItems = 'center';
                    photoWrapper.style.border = '1px solid var(--primary-gold)';
                    photoWrapper.style.position = 'relative';
                    photoWrapper.style.marginTop = '20px';
                    
                    const title = document.createElement('h3');
                    title.className = 'gold-text';
                    title.textContent = 'Personal Photos';
                    title.style.position = 'absolute';
                    title.style.top = '15px';
                    title.style.left = '15px';
                    
                    photoGrid.parentNode.insertBefore(photoWrapper, photoGrid);
                    
                    const leftDiv = document.createElement('div');
                    leftDiv.style.flex = '1';
                    leftDiv.style.marginTop = '40px'; 
                    leftDiv.appendChild(photoGrid);
                    
                    const uploadBtn = document.createElement('button');
                    uploadBtn.type = 'button';
                    uploadBtn.textContent = 'Upload';
                    uploadBtn.style.padding = '10px 20px';
                    uploadBtn.style.marginLeft = '20px';
                    uploadBtn.style.background = 'var(--primary-gold)';
                    uploadBtn.style.color = '#111';
                    uploadBtn.style.fontWeight = 'bold';
                    uploadBtn.style.whiteSpace = 'nowrap';
                    uploadBtn.onclick = () => { if (newPhotoInput) newPhotoInput.click(); };
                    
                    photoWrapper.appendChild(title);
                    photoWrapper.appendChild(leftDiv);
                    photoWrapper.appendChild(uploadBtn);
                }

                if (!isApproved) {
                    photoGrid.style.opacity = '0.3';
                    photoGrid.style.pointerEvents = 'none';
                }
            }

            if (newPhotoInput) {
                if (!isApproved) {
                    newPhotoInput.disabled = true;
                    if (!document.getElementById('photoApprovalMsg')) {
                        const msg = document.createElement('p');
                        msg.id = 'photoApprovalMsg';
                        msg.style.color = 'var(--accent-red)';
                        msg.style.fontSize = '0.85rem';
                        msg.style.marginTop = '5px';
                        msg.textContent = 'Profile photos can only be uploaded after your account is approved.';
                        newPhotoInput.parentNode.appendChild(msg);
                    }
                } else {
                    newPhotoInput.disabled = false;
                    const msg = document.getElementById('photoApprovalMsg');
                    if (msg) msg.remove();
                }

                // Inject Bottom Back Button
                if (!document.getElementById('bottomBackBtn')) {
                    const bottomBackBtn = document.createElement('button');
                    bottomBackBtn.id = 'bottomBackBtn';
                    bottomBackBtn.type = 'button';
                    bottomBackBtn.innerHTML = '&#8592; Back to Main Dashboard';
                    bottomBackBtn.style.cssText = 'background: var(--primary-gold); color: var(--dark-bg); font-weight: bold; margin-top: 25px; width: 100%;';
                    bottomBackBtn.onclick = async () => {
                        if (typeof window.saveProfessionalProfile === 'function') {
                            await window.saveProfessionalProfile(true);
                        }
                        window.location.href = appPath('categories.html');
                    };
                    document.getElementById('updateProfileForm').appendChild(bottomBackBtn);
                }
            }

            // Status
            const vStatus = document.getElementById('verificationStatus');
            if (vStatus) vStatus.textContent = (user.verificationStatus || 'pending').toUpperCase();

            const rStatus = document.getElementById('revelationStatus');
            if (rStatus) {
                rStatus.textContent = user.isVerified ? 'REVEALED' : 'VEILED';
                rStatus.style.background = user.isVerified ? 'var(--primary-gold)' : 'transparent';
                rStatus.style.color = user.isVerified ? 'var(--dark-bg)' : 'var(--primary-gold)';
            }

            // Duo Status
            const duoStatus = document.getElementById('duoStatus');
            if (duoStatus) {
                duoStatus.innerHTML = prof.isDuo ? `<p>Connected in Duo mode.</p>` : `<p>Not currently in a Duo.</p>`;
            }

            // Rate Alert
            if (!data.isReadyForTransactions) {
                const rateAlert = document.getElementById('rateAlert');
                if (rateAlert) rateAlert.classList.remove('hidden');
            }

            // Suspension Overlay logic
            if (prof.subscriptionStatus === 'suspended') {
                const suspensionAlert = document.createElement('div');
                suspensionAlert.className = 'card alert';
                suspensionAlert.style.marginBottom = '20px';
                suspensionAlert.style.border = '2px solid var(--accent-red)';
                let pendingInv = (prof.invoices || []).find(i => i.status === 'pending');
                let feeText = pendingInv && pendingInv.lateFeeApplied ? ` A 2% late fee has been applied. Your new total is <strong>$${new Intl.NumberFormat('es-AR').format(pendingInv.amount)} ARS</strong>.` : '';
                suspensionAlert.innerHTML = `<h3 style="color: var(--accent-red); margin-top: 0;">Account Suspended</h3><p>Your profile has been removed from the public grid due to an unpaid balance past the 5-business-day grace period.${feeText}</p><p>To restore your access, please upload your payment receipt below. Once verified by an admin, your profile will reappear on the directory.</p>`;
                content.prepend(suspensionAlert);
                
                // Disable the update profile form so they know they are restricted
                const upForm = document.getElementById('updateProfileForm');
                if (upForm) { upForm.style.opacity = '0.3'; upForm.style.pointerEvents = 'none'; }
            }

            if (loader) loader.classList.add('hidden');
            if (content) content.classList.remove('hidden');
            applyStaticTranslations(content);
        } else {
            console.error('Dashboard auth error:', data.error);
            content.innerHTML = `
                <div class="card" style="text-align: center; padding: 40px; margin-top: 20px;">
                    <h2 class="gold-text">${t('Access Denied')}</h2>
                    <p style="margin-bottom: 25px;">${t('Please log in or register to access the dashboard.')}</p>
                    <div style="display: flex; gap: 15px; justify-content: center;">
                        <button onclick="window.location.href='${appPath('login.html')}'">${t('Login')}</button>
                        <button onclick="window.location.href='${appPath('register.html')}'" style="background: transparent; border: 1px solid var(--primary-gold); color: var(--primary-gold);">${t('Register')}</button>
                    </div>
                </div>
            `;
            if (loader) loader.classList.add('hidden');
            content.classList.remove('hidden');
            applyStaticTranslations(content);
        }
    } catch (err) {
        console.error('Dashboard rendering error:', err);
        if (loader) loader.innerHTML = `<p style="color: var(--accent-red)">Error loading vault. See console.</p>`;
    }
}

let currentLogFilters = {};
let currentLogBaseFilters = {};

export async function openActivityLogsModal(title = 'Activity Logs', baseFilters = {}) {
    let modal = document.getElementById('logsModal');
    currentLogBaseFilters = baseFilters;
    currentLogFilters = { ...baseFilters };

    if (!modal) {
        modal = document.createElement('div');
        Object.assign(modal.style, {
    
            position: 'fixed', top: '0', left: '0', width: '100%', height: '100%',
            backgroundColor: 'rgba(0,0,0,0.9)', zIndex: '3000', display: 'flex',
            flexDirection: 'column', padding: '20px', overflowY: 'auto'
        });

        const closeBtn = document.createElement('button');
        closeBtn.textContent = t('Close');
        closeBtn.style.alignSelf = 'flex-end';
        closeBtn.style.marginBottom = '10px';
        closeBtn.onclick = () => modal.style.display = 'none';

        const container = document.createElement('div');
        Object.assign(container.style, {
            backgroundColor: 'var(--dark-bg, #1a1a1a)', padding: '20px',
            borderRadius: '8px', color: 'white', maxWidth: '1200px', margin: '0 auto', width: '100%'
        });

        container.innerHTML = `
            <h2 id="logsModalTitle" class="gold-text" style="margin-bottom: 20px;">${title}</h2>
            <div style="display: flex; gap: 10px; margin-bottom: 20px; flex-wrap: wrap;">
                <input type="text" id="logFilterAction" placeholder="Filter Action..." style="padding: 8px; border-radius: 4px; border: 1px solid #333; background: #222; color: white;">
                <input type="text" id="logFilterIp" placeholder="Filter IP..." style="padding: 8px; border-radius: 4px; border: 1px solid #333; background: #222; color: white;">
                <input type="text" id="logFilterAgent" placeholder="Filter User Agent..." style="padding: 8px; border-radius: 4px; border: 1px solid #333; background: #222; color: white;">
                <button id="applyLogFiltersBtn">Apply Filters</button>
                <button id="clearLogFiltersBtn">Clear</button>
            </div>
            <div style="overflow-x: auto;">
                <table style="width: 100%; border-collapse: collapse; text-align: left; font-size: 0.9rem;">
                    <thead>
                        <tr style="border-bottom: 1px solid var(--primary-gold);">
                            <th style="padding: 10px;">Date</th>
                            <th style="padding: 10px;">Professional</th>
                            <th style="padding: 10px;">Action</th>
                            <th style="padding: 10px;">IP Address</th>
                            <th style="padding: 10px;">User Agent</th>
                        </tr>
                    </thead>
                    <tbody id="logsTableBody">
                    </tbody>
                </table>
            </div>
        `;

        modal.appendChild(closeBtn);
        modal.appendChild(container);
        document.body.appendChild(modal);
        applyStaticTranslations(modal);

        document.getElementById('applyLogFiltersBtn').onclick = () => {
            currentLogFilters = { ...currentLogBaseFilters };
            if (document.getElementById('logFilterAction').value) currentLogFilters.action = document.getElementById('logFilterAction').value;
            if (document.getElementById('logFilterIp').value) currentLogFilters.ipAddress = document.getElementById('logFilterIp').value;
            if (document.getElementById('logFilterAgent').value) currentLogFilters.userAgent = document.getElementById('logFilterAgent').value;
            loadActivityLogs();
        };

        document.getElementById('clearLogFiltersBtn').onclick = () => {
            document.getElementById('logFilterAction').value = '';
            document.getElementById('logFilterIp').value = '';
            document.getElementById('logFilterAgent').value = '';
            currentLogFilters = { ...currentLogBaseFilters };
            loadActivityLogs();
        };
    } else {
        const titleEl = document.getElementById('logsModalTitle');
        if (titleEl) titleEl.textContent = title;
        document.getElementById('logFilterAction').value = '';
        document.getElementById('logFilterIp').value = '';
        document.getElementById('logFilterAgent').value = '';
    }

    modal.style.display = 'flex';
    loadActivityLogs();
}

export async function loadActivityLogs() {
    const tbody = document.getElementById('logsTableBody');
    tbody.innerHTML = '<tr><td colspan="5" style="padding: 10px; text-align: center;">Loading...</td></tr>';
    
    try {
        const token = localStorage.getItem('token');
        const url = new URL(`${API_URL}/admin/logs`);
        Object.keys(currentLogFilters).forEach(key => {
            if (currentLogFilters[key]) url.searchParams.append(key, currentLogFilters[key]);
        });

        // Added credentials: 'include' to ensure auth cookie is sent
        const res = await fetch(url, { 
            headers: { 'Authorization': `Bearer ${token}` },
            credentials: 'include'
        });
        const data = await res.json();

        if (data.success) {
            tbody.innerHTML = '';
            if (data.data.length === 0) {
                tbody.innerHTML = '<tr><td colspan="5" style="padding: 10px; text-align: center;">No logs found.</td></tr>';
                return;
            }
            
            data.data.forEach(log => {
                const profName = log.professional ? (log.professional.professionalProfile?.alias || log.professional.email) : 'Unknown';
                const tr = document.createElement('tr');
                tr.style.borderBottom = '1px solid #333';
                tr.innerHTML = `
                    <td style="padding: 10px;">${new Date(log.createdAt).toLocaleString()}</td>
                    <td style="padding: 10px;">${profName}</td>
                    <td style="padding: 10px;">${log.action}</td>
                    <td style="padding: 10px;">${log.ipAddress || 'N/A'}</td>
                    <td style="padding: 10px;">${log.userAgent || 'N/A'}</td>
                `;
                tbody.appendChild(tr);
            });
            applyStaticTranslations(tbody);
        } else {
            tbody.innerHTML = `<tr><td colspan="5" style="padding: 10px; color: var(--accent-red);">Error: ${data.error}</td></tr>`;
        }
    } catch (err) {
        tbody.innerHTML = `<tr><td colspan="5" style="padding: 10px; color: var(--accent-red);">Network Error</td></tr>`;
    }
}

// --- Admin View Scraped Leads Modal ---
export async function openViewLeadsModal() {
    let modal = document.getElementById('leadsModal');
    if (!modal) {
        modal = document.createElement('div');
        modal.id = 'leadsModal';
        Object.assign(modal.style, {
            position: 'fixed', top: '0', left: '0', width: '100%', height: '100%',
            backgroundColor: 'rgba(0,0,0,0.9)', zIndex: '3000', display: 'flex',
            flexDirection: 'column', padding: '20px', overflowY: 'auto'
        });

        const closeBtn = document.createElement('button');
        closeBtn.textContent = t('Close');
        closeBtn.style.alignSelf = 'flex-end';
        closeBtn.style.marginBottom = '10px';
        closeBtn.onclick = () => modal.style.display = 'none';

        const container = document.createElement('div');
        Object.assign(container.style, {
            backgroundColor: 'var(--dark-bg, #1a1a1a)', padding: '20px',
            borderRadius: '8px', color: 'white', maxWidth: '1000px', margin: '0 auto', width: '100%'
        });

        container.innerHTML = `
            <h2 class="gold-text" style="margin-bottom: 20px;">Scraped Phone Leads</h2>
            <div style="display: flex; gap: 10px; margin-bottom: 20px;">
                <button id="refreshLeadsBtn">Refresh List</button>
            </div>
            <div style="overflow-x: auto;">
                <table style="width: 100%; border-collapse: collapse; text-align: left; font-size: 0.9rem;">
                    <thead>
                        <tr style="border-bottom: 1px solid var(--primary-gold);">
                            <th style="padding: 10px;">Date Added</th>
                            <th style="padding: 10px;">Phone Number</th>
                            <th style="padding: 10px;">Source</th>
                            <th style="padding: 10px;">Status</th>
                        </tr>
                    </thead>
                    <tbody id="leadsTableBody">
                        <tr><td colspan="4" style="padding: 10px; text-align: center;">Loading...</td></tr>
                    </tbody>
                </table>
            </div>
        `;

        modal.appendChild(closeBtn);
        modal.appendChild(container);
        document.body.appendChild(modal);
        applyStaticTranslations(modal);

        document.getElementById('refreshLeadsBtn').onclick = loadLeads;
    }

    modal.style.display = 'flex';
    loadLeads();
}

export async function loadLeads() {
    const tbody = document.getElementById('leadsTableBody');
    tbody.innerHTML = '<tr><td colspan="4" style="padding: 10px; text-align: center;">Loading...</td></tr>';
    
    try {
        const token = localStorage.getItem('token');
        // Added credentials: 'include' to ensure auth cookie is sent
        const res = await fetch(`${API_URL}/admin/potential-professionals`, { 
            headers: { 'Authorization': `Bearer ${token}` },
            credentials: 'include'
        });
        const data = await res.json();

        if (data.success) {
            tbody.innerHTML = '';
            if (data.data.length === 0) {
                tbody.innerHTML = '<tr><td colspan="4" style="padding: 10px; text-align: center;">No leads found.</td></tr>';
                return;
            }
            
            data.data.forEach(lead => {
                const dateAdded = lead.createdAt ? new Date(lead.createdAt).toLocaleString() : 'Unknown';
                let sourceHost = lead.sourceUrl;
                try { sourceHost = new URL(lead.sourceUrl).hostname; } catch(e) {}

                const statusColor = lead.status === 'contacted' ? 'green' : (lead.status === 'rejected' ? 'red' : 'orange');

                const tr = document.createElement('tr');
                tr.style.borderBottom = '1px solid #333';
                tr.innerHTML = `
                    <td style="padding: 10px;">${dateAdded}</td>
                    <td style="padding: 10px;">${lead.phone}</td>
                    <td style="padding: 10px;"><a href="${lead.sourceUrl}" target="_blank" style="color: var(--primary-gold);">${sourceHost}</a></td>
                    <td style="padding: 10px;">
                        <span style="padding: 3px 8px; border-radius: 12px; background: ${statusColor}; color: white; font-size: 0.8rem; text-transform: capitalize;">
                            ${lead.status || 'pending'}
                        </span>
                    </td>
                `;
                tbody.appendChild(tr);
            });
            applyStaticTranslations(tbody);
        } else {
            tbody.innerHTML = `<tr><td colspan="4" style="padding: 10px; color: var(--accent-red);">Error: ${data.error}</td></tr>`;
        }
    } catch (err) {
        tbody.innerHTML = `<tr><td colspan="4" style="padding: 10px; color: var(--accent-red);">Network Error</td></tr>`;
    }
}

// --- Admin View Payment Verifications Modal ---
export async function openPaymentVerificationsModal() {
    let modal = document.getElementById('paymentVerificationsModal');
    if (!modal) {
        modal = document.createElement('div');
        modal.id = 'paymentVerificationsModal';
        Object.assign(modal.style, {
            position: 'fixed', top: '0', left: '0', width: '100%', height: '100%',
            backgroundColor: 'rgba(0,0,0,0.9)', zIndex: '3000', display: 'flex',
            flexDirection: 'column', padding: '20px', overflowY: 'auto'
        });

        const closeBtn = document.createElement('button');
        closeBtn.textContent = t('Close');
        closeBtn.style.alignSelf = 'flex-end';
        closeBtn.style.marginBottom = '10px';
        closeBtn.onclick = () => modal.style.display = 'none';

        const container = document.createElement('div');
        Object.assign(container.style, {
            backgroundColor: 'var(--dark-bg, #1a1a1a)', padding: '20px',
            borderRadius: '8px', color: 'white', maxWidth: '1000px', margin: '0 auto', width: '100%'
        });

        container.innerHTML = `
            <h2 class="gold-text" style="margin-bottom: 20px;">Payment Verifications</h2>
            <div style="overflow-x: auto;">
                <table style="width: 100%; border-collapse: collapse; text-align: left; font-size: 0.9rem;">
                    <thead>
                        <tr style="border-bottom: 1px solid var(--primary-gold);">
                            <th style="padding: 10px;">Name</th>
                            <th style="padding: 10px;">Surname</th>
                            <th style="padding: 10px;">Alias</th>
                            <th style="padding: 10px;">Receipt</th>
                            <th style="padding: 10px;">Processed</th>
                        </tr>
                    </thead>
                    <tbody id="paymentsTableBody">
                        <tr><td colspan="5" style="padding: 10px; text-align: center;">Loading...</td></tr>
                    </tbody>
                </table>
            </div>
        `;

        modal.appendChild(closeBtn);
        modal.appendChild(container);
        document.body.appendChild(modal);
        applyStaticTranslations(modal);
    }

    modal.style.display = 'flex';
    loadPaymentVerifications();
}

export async function loadPaymentVerifications() {
    const tbody = document.getElementById('paymentsTableBody');
    tbody.innerHTML = '<tr><td colspan="5" style="padding: 10px; text-align: center;">Loading...</td></tr>';
    
    try {
        const token = localStorage.getItem('token');
        const res = await fetch(`${API_URL}/admin/payments/pending`, { 
            headers: { 'Authorization': `Bearer ${token}` },
            credentials: 'include'
        });
        const data = await res.json();

        if (data.success) {
            tbody.innerHTML = '';
            if (data.data.length === 0) {
                tbody.innerHTML = '<tr><td colspan="5" style="padding: 10px; text-align: center;">No pending payments.</td></tr>';
                return;
            }
            
            data.data.forEach(prof => {
                const p = prof.professionalProfile || {};
                const alias = p.alias || 'Unknown';
                const firstName = p.firstName || '';
                const lastName = p.lastName || '';
                const receiptUrl = p.paymentReceiptUrl || '';

                const tr = document.createElement('tr');
                tr.style.borderBottom = '1px solid #333';
                tr.innerHTML = `
                    <td style="padding: 10px;">${firstName}</td>
                    <td style="padding: 10px;">${lastName}</td>
                    <td style="padding: 10px;">${alias}</td>
                    <td style="padding: 10px; text-align: center;">
                        <a href="${receiptUrl}" target="_blank" style="color: var(--primary-gold); text-decoration: none; font-size: 1.2rem;" title="View Receipt">📄</a>
                    </td>
                    <td style="padding: 10px;">
                        <label style="display: flex; align-items: center; gap: 5px; cursor: pointer;">
                            <input type="checkbox" class="process-payment-cb" data-id="${prof._id}">
                            Processed
                        </label>
                    </td>
                `;
                tbody.appendChild(tr);
            });

            document.querySelectorAll('.process-payment-cb').forEach(cb => {
                cb.onchange = (e) => {
                    if (e.target.checked) {
                        acknowledgePayment(e.target.getAttribute('data-id'));
                    }
                };
            });
            applyStaticTranslations(tbody);

        } else {
            tbody.innerHTML = `<tr><td colspan="5" style="padding: 10px; color: var(--accent-red);">Error: ${data.error}</td></tr>`;
        }
    } catch (err) {
        tbody.innerHTML = `<tr><td colspan="5" style="padding: 10px; color: var(--accent-red);">Network Error</td></tr>`;
    }
}

export async function acknowledgePayment(id) {
    try {
        const token = localStorage.getItem('token');
        const res = await fetch(`${API_URL}/admin/payments/${id}/acknowledge`, {
            method: 'PUT',
            headers: { 
                'Content-Type': 'application/json',
                'Authorization': `Bearer ${token}`
            },
            credentials: 'include'
        });
        const data = await res.json();
        if (data.success) {
            loadPaymentVerifications(); 
        } else {
            alert(data.error || 'Failed to acknowledge payment');
        }
    } catch (err) {
        alert('Server connection error');
    }
}

// --- Admin View Pending Verifications Modal ---
export async function openPendingVerificationsModal() {
    let modal = document.getElementById('pendingModal');
    if (modal && !modal.querySelector('#pendingModalCloseBtn')) {
        modal.remove();
        modal = null;
    }
    if (!modal) {
        modal = document.createElement('div');
        modal.id = 'pendingModal';
        Object.assign(modal.style, {
            position: 'fixed', top: '0', left: '0', width: '100%', height: '100%',
            backgroundColor: 'rgba(0,0,0,0.9)', zIndex: '3000', display: 'none',
            alignItems: 'center', justifyContent: 'center', padding: '20px',
            overflowY: 'auto', boxSizing: 'border-box'
        });

        const container = document.createElement('div');
        Object.assign(container.style, {
            backgroundColor: 'var(--dark-bg, #1a1a1a)', padding: '20px',
            borderRadius: '8px', color: 'white', maxWidth: '1000px', width: '100%',
            border: '1px solid rgba(212, 175, 55, 0.3)', boxShadow: '0 8px 32px rgba(0,0,0,0.8)'
        });

        container.innerHTML = `
            <h2 class="gold-text" style="margin-bottom: 20px;">Pending Verifications</h2>
            <div style="overflow-x: auto;">
                <table style="width: 100%; border-collapse: collapse; text-align: left; font-size: 0.9rem;">
                    <thead>
                        <tr style="border-bottom: 1px solid var(--primary-gold);">
                            <th style="padding: 10px;">Email</th>
                            <th style="padding: 10px;">Alias</th>
                            <th style="padding: 10px;">Documents</th>
                            <th style="padding: 10px;">Submitted On</th>
                            <th style="padding: 10px;">Actions</th>
                        </tr>
                    </thead>
                    <tbody id="pendingTableBody">
                        <tr><td colspan="5" style="padding: 10px; text-align: center;">Loading...</td></tr>
                    </tbody>
                </table>
            </div>
            <div style="display: flex; justify-content: flex-end; margin-top: 20px; padding-top: 15px; border-top: 1px solid rgba(212, 175, 55, 0.25);">
                <button type="button" id="pendingModalCloseBtn" style="padding: 10px 24px; background: var(--primary-gold); color: var(--dark-bg); border: none; border-radius: 4px; cursor: pointer; font-weight: bold; font-size: 0.9rem;">${t('Close')}</button>
            </div>
        `;

        modal.appendChild(container);
        document.body.appendChild(modal);

        document.getElementById('pendingModalCloseBtn').addEventListener('click', () => {
            modal.style.display = 'none';
            const adminPanel = document.getElementById('adminPanelSection');
            if (adminPanel) {
                adminPanel.scrollIntoView({ behavior: 'smooth', block: 'start' });
            }
        });

        applyStaticTranslations(modal);
    }

    modal.style.display = 'flex';
    loadPendingVerifications();
}

export async function loadPendingVerifications() {
    const tbody = document.getElementById('pendingTableBody');
    tbody.innerHTML = '<tr><td colspan="5" style="padding: 10px; text-align: center;">Loading...</td></tr>';
    
    try {
        const token = localStorage.getItem('token');
        // Added credentials: 'include' to ensure auth cookie is sent
        const res = await fetch(`${API_URL}/admin/verifications/pending`, { 
            headers: { 'Authorization': `Bearer ${token}` },
            credentials: 'include'
        });
        const data = await res.json();

        if (data.success) {
            tbody.innerHTML = '';
            if (data.data.length === 0) {
                tbody.innerHTML = '<tr><td colspan="5" style="padding: 10px; text-align: center;">No pending verifications.</td></tr>';
                return;
            }

            window._pendingVerificationRows = data.data;
            
            data.data.forEach(prof => {
                const alias = prof.professionalProfile?.alias || 'Unknown';
                const docLabels = ['ID Front', 'ID Back', 'Selfie'];
                const docs = prof.verificationDocuments && prof.verificationDocuments.length > 0
                    ? `<div style="display: flex; gap: 8px; flex-wrap: wrap;">` + prof.verificationDocuments.map((doc, idx) => {
                        const label = docLabels[idx] || `Doc ${idx + 1}`;
                        return `<button type="button" class="view-doc-btn" data-prof-id="${prof._id}" data-doc-index="${idx}" title="View ${label}" style="padding: 0; background: #222; border: 1px solid var(--primary-gold); border-radius: 4px; cursor: pointer; overflow: hidden; width: 64px; text-align: center;">
                            <img src="${doc}" alt="${label}" style="width: 64px; height: 64px; object-fit: cover; display: block;">
                            <span style="display: block; font-size: 0.65rem; color: var(--primary-gold); padding: 2px;">${label}</span>
                        </button>`;
                    }).join('') + `</div>`
                    : '<span style="color: #888;">No documents on file (registered before document storage was enabled)</span>';
                const gesture = prof.verificationGesture || 'N/A';
                const gestureInfo = getVerificationGesture(gesture);
                const gestureDisplay = gestureInfo
                    ? `<span style="display: inline-flex; align-items: center; gap: 8px; margin-top: 6px;">
                            <span style="font-size: 2rem; line-height: 1;" title="${gesture}">${gestureInfo.emoji}</span>
                            <strong style="color: white;">${t(gestureInfo.labelKey)}</strong>
                       </span>`
                    : `<strong style="color: white;">${gesture}</strong>`;

                const tr = document.createElement('tr');
                tr.style.borderBottom = '1px solid #333';
                tr.innerHTML = `
                    <td style="padding: 10px;">${prof.email}</td>
                    <td style="padding: 10px;">${alias}</td>
                    <td style="padding: 10px;">
                        ${docs}<br>
                        <span style="font-size: 0.8rem; color: #aaa; display: block; margin-top: 6px;">Gesture: ${gestureDisplay}</span>
                    </td>
                    <td style="padding: 10px;">${new Date(prof.createdAt).toLocaleString()}</td>
                    <td style="padding: 10px; display: flex; gap: 5px;">
                        <button class="approve-btn" data-id="${prof._id}" style="padding: 5px 10px; background: green; color: white; border: none; border-radius: 4px; cursor: pointer;">Approve</button>
                        <button class="reject-btn" data-id="${prof._id}" style="padding: 5px 10px; background: red; color: white; border: none; border-radius: 4px; cursor: pointer;">Reject</button>
                    </td>
                `;
                tbody.appendChild(tr);
            });

            document.querySelectorAll('.approve-btn').forEach(btn => {
                btn.onclick = () => updateVerificationStatus(btn.getAttribute('data-id'), 'approved');
            });
            document.querySelectorAll('.reject-btn').forEach(btn => {
                btn.onclick = () => updateVerificationStatus(btn.getAttribute('data-id'), 'rejected');
            });
            document.querySelectorAll('.view-doc-btn').forEach(btn => {
                btn.onclick = () => {
                    const profId = btn.getAttribute('data-prof-id');
                    const idx = parseInt(btn.getAttribute('data-doc-index'), 10);
                    const prof = (window._pendingVerificationRows || []).find(p => String(p._id) === String(profId));
                    if (prof && prof.verificationDocuments && prof.verificationDocuments[idx]) {
                        openImageModal(prof.verificationDocuments[idx]);
                    }
                };
            });
            applyStaticTranslations(tbody);

        } else {
            tbody.innerHTML = `<tr><td colspan="5" style="padding: 10px; color: var(--accent-red);">Error: ${data.error}</td></tr>`;
        }
    } catch (err) {
        tbody.innerHTML = `<tr><td colspan="5" style="padding: 10px; color: var(--accent-red);">Network Error</td></tr>`;
    }
}

export async function updateVerificationStatus(id, status) {
    try {
        const token = localStorage.getItem('token');
        // Added credentials: 'include' to ensure auth cookie is sent
        const res = await fetch(`${API_URL}/admin/verifications/${id}`, {
            method: 'PUT',
            headers: { 
                'Content-Type': 'application/json',
                'Authorization': `Bearer ${token}`
            },
            credentials: 'include',
            body: JSON.stringify({ status })
        });
        const data = await res.json();
        if (data.success) {
            alert(`Professional ${status} successfully.`);
            loadPendingVerifications(); 
            if (document.getElementById('adminFilterBtn')) {
                loadAdminGridData(); 
            }
        } else {
            alert(data.error || 'Failed to update status');
        }
    } catch (err) {
        alert('Server connection error');
    }
}

// --- Image Viewer Modal ---
export function openImageModal(src) {
    let modal = document.getElementById('imageViewerModal');
    if (!modal) {
        modal = document.createElement('div');
        modal.id = 'imageViewerModal';
        Object.assign(modal.style, {
            position: 'fixed', top: '0', left: '0', width: '100%', height: '100%',
            backgroundColor: 'rgba(0,0,0,0.95)', zIndex: '4000', display: 'flex',
            flexDirection: 'column', alignItems: 'center', justifyContent: 'center'
        });
        
        const closeBtn = document.createElement('button');
        closeBtn.innerHTML = '&times;';
        Object.assign(closeBtn.style, {
            position: 'absolute', top: '20px', right: '30px',
            background: 'transparent', color: 'var(--primary-gold)', border: 'none',
            fontSize: '50px', cursor: 'pointer', lineHeight: '1'
        });
        closeBtn.onclick = () => modal.style.display = 'none';
        
        const img = document.createElement('img');
        img.id = 'imageViewerImg';
        Object.assign(img.style, {
            maxWidth: '90%', maxHeight: '90%', objectFit: 'contain', border: '2px solid var(--primary-gold)', borderRadius: '8px'
        });
        
        modal.appendChild(closeBtn);
        modal.appendChild(img);
        document.body.appendChild(modal);
    }
    
    document.getElementById('imageViewerImg').src = src;
    modal.style.display = 'flex';
};

// --- Admin Mail Broadcast Modal ---
export async function openMailBroadcastModal() {
    let modal = document.getElementById('mailBroadcastModal');
    if (!modal) {
        modal = document.createElement('div');
        modal.id = 'mailBroadcastModal';
        Object.assign(modal.style, {
            position: 'fixed', top: '0', left: '0', width: '100%', height: '100%',
            backgroundColor: 'rgba(0,0,0,0.9)', zIndex: '3000', display: 'flex',
            flexDirection: 'column', padding: '20px', overflowY: 'auto'
        });

        const closeBtn = document.createElement('button');
        closeBtn.textContent = t('Close');
        closeBtn.style.alignSelf = 'flex-end';
        closeBtn.style.marginBottom = '10px';
        closeBtn.onclick = () => modal.style.display = 'none';

        const container = document.createElement('div');
        Object.assign(container.style, {
            backgroundColor: 'var(--dark-bg, #1a1a1a)', padding: '20px',
            borderRadius: '8px', color: 'white', maxWidth: '600px', margin: '0 auto', width: '100%'
        });

        container.innerHTML = `
            <h2 class="gold-text" style="margin-bottom: 20px;">Send Broadcast Email</h2>
            <form id="mailBroadcastForm" style="display: flex; flex-direction: column; gap: 15px;">
                <div id="mailBroadcastAlert" class="alert hidden" style="padding: 10px; border-radius: 4px; border: 1px solid transparent;"></div>
                
                <label>Audience</label>
                <select id="broadcastAudience" style="padding: 8px; background: #222; color: white; border: 1px solid #444; border-radius: 4px;">
                    <option value="all">All Professionals</option>
                    <option value="approved">Approved Professionals Only</option>
                </select>

                <label>Subject</label>
                <input type="text" id="broadcastSubject" required style="padding: 8px; background: #222; color: white; border: 1px solid #444; border-radius: 4px;">

                <label>Message</label>
                <textarea id="broadcastMessage" required rows="6" style="padding: 8px; background: #222; color: white; border: 1px solid #444; border-radius: 4px; font-family: sans-serif;"></textarea>

                <p style="font-size: 0.85rem; color: #aaa;">Note: The greeting "Hello [Alias]," will be automatically prepended to each email.</p>
            </form>
        `;

        modal.appendChild(closeBtn);
        modal.appendChild(container);
        document.body.appendChild(modal);
        applyStaticTranslations(modal);

        document.getElementById('mailBroadcastForm').onsubmit = async (e) => {
            e.preventDefault();
            const alertEl = document.getElementById('mailBroadcastAlert');
            const submitBtn = e.target.querySelector('button[type="submit"]');
            
            if (!confirm('Are you sure you want to send this email to the selected audience? This action cannot be undone.')) {
                return;
            }

            submitBtn.disabled = true;
            submitBtn.textContent = 'Sending...';

            const payload = {
                audience: document.getElementById('broadcastAudience').value,
                subject: document.getElementById('broadcastSubject').value,
                message: document.getElementById('broadcastMessage').value
            };

            try {
                const token = localStorage.getItem('token');
                // Added credentials: 'include' to ensure auth cookie is sent
                const res = await fetch(`${API_URL}/admin/notifications/mail/broadcast`, {
                    method: 'POST',
                    headers: { 
                        'Content-Type': 'application/json',
                        'Authorization': `Bearer ${token}`
                    },
                    credentials: 'include',
                    body: JSON.stringify(payload)
                });
                const data = await res.json();

                if (data.success) {
                    showAlert(alertEl, data.message || 'Emails successfully queued for sending.', false);
                    document.getElementById('mailBroadcastForm').reset();
                } else {
                    showAlert(alertEl, data.error || 'Failed to send broadcast');
                }
            } catch (err) {
                showAlert(alertEl, 'Server connection error');
            } finally {
                submitBtn.disabled = false;
                submitBtn.textContent = 'Send Broadcast';
            }
        };
    }

    modal.style.display = 'flex';
}

// --- Admin Edit Professional Profile Modal ---
export async function openEditProfessionalModal(prof = null) {
    let modal = document.getElementById('editProfModal');
    if (!modal) {
        modal = document.createElement('div');
        modal.id = 'editProfModal';
        Object.assign(modal.style, {
            position: 'fixed', top: '0', left: '0', width: '100%', height: '100%',
            backgroundColor: 'rgba(0,0,0,0.9)', zIndex: '3000', display: 'flex',
            flexDirection: 'column', padding: '20px', overflowY: 'auto'
        });
        const closeBtn = document.createElement('button');
        closeBtn.textContent = t('Close');
        closeBtn.style.alignSelf = 'flex-end';
        closeBtn.style.marginBottom = '10px';
        closeBtn.onclick = () => {
            modal.style.display = 'none';
            // If we close the modal, always refresh the main grid to see any potential changes
            if (document.getElementById('adminGridContent')) {
                loadAdminGridData();
            }
        };
        const container = document.createElement('div');
        container.id = 'editProfContainer';
        Object.assign(container.style, {
            backgroundColor: 'var(--dark-bg, #1a1a1a)', padding: '20px',
            borderRadius: '8px', color: 'white', maxWidth: '800px', margin: '0 auto', width: '100%'
        });

        modal.appendChild(closeBtn);
        modal.appendChild(container);
        document.body.appendChild(modal);
        applyStaticTranslations(modal);
    }

    modal.style.display = 'flex';
    const container = document.getElementById('editProfContainer');
    container.innerHTML = 'Loading...';

    if (prof) {
        renderEditForm(prof);
    } else {
        renderProfessionalList();
    }
}

export async function renderProfessionalList(aliasSearch = '') {
    const container = document.getElementById('editProfContainer');
    container.innerHTML = `
        <h2 class="gold-text" style="margin-bottom: 20px;">Select a Professional to Edit</h2>
        <div style="display: flex; gap: 10px; margin-bottom: 20px;">
            <input type="text" id="profSearchInput" placeholder="Search by Alias..." value="${aliasSearch}" style="padding: 8px; border-radius: 4px; border: 1px solid #333; background: #222; color: white; flex: 1;">
            <button id="searchProfBtn">Search</button>
        </div>
        <div style="overflow-x: auto;">
            <table style="width: 100%; border-collapse: collapse; text-align: left; font-size: 0.9rem;">
                <thead>
                    <tr style="border-bottom: 1px solid var(--primary-gold);">
                        <th style="padding: 10px;">Email</th>
                        <th style="padding: 10px;">Alias</th>
                        <th style="padding: 10px;">Status</th>
                        <th style="padding: 10px;">Actions</th>
                    </tr>
                </thead>
                <tbody id="profTableBody">
                    <tr><td colspan="4" style="padding: 10px; text-align: center;">Loading...</td></tr>
                </tbody>
            </table>
        </div>
    `;

    document.getElementById('searchProfBtn').onclick = () => {
        renderProfessionalList(document.getElementById('profSearchInput').value);
    };

    try {
        const token = localStorage.getItem('token');
        const url = new URL(`${API_URL}/admin/professionals`);
        if (aliasSearch) url.searchParams.append('alias', aliasSearch);

        // Added credentials: 'include' to ensure auth cookie is sent
        const res = await fetch(url, { 
            headers: { 'Authorization': `Bearer ${token}` },
            credentials: 'include'
        });
        const data = await res.json();

        const tbody = document.getElementById('profTableBody');
        tbody.innerHTML = '';

        if (data.success) {
            if (data.data.length === 0) {
                tbody.innerHTML = '<tr><td colspan="4" style="padding: 10px; text-align: center;">No professionals found.</td></tr>';
                return;
            }
            
            data.data.forEach(prof => {
                const tr = document.createElement('tr');
                tr.style.borderBottom = '1px solid #333';
                tr.innerHTML = `
                    <td style="padding: 10px;">${prof.email}</td>
                    <td style="padding: 10px;">${prof.professionalProfile?.alias || 'N/A'}</td>
                    <td style="padding: 10px;">${prof.verificationStatus}</td>
                    <td style="padding: 10px;">
                        <button class="edit-prof-btn" data-id="${prof._id}" style="padding: 5px 10px;">Edit</button>
                    </td>
                `;
                tbody.appendChild(tr);
            });

            document.querySelectorAll('.edit-prof-btn').forEach(btn => {
                btn.onclick = () => {
                    const profId = btn.getAttribute('data-id');
                    const selectedProf = data.data.find(p => p._id === profId);
                    renderEditForm(selectedProf);
                };
            });
            applyStaticTranslations(tbody);
        } else {
            tbody.innerHTML = `<tr><td colspan="4" style="padding: 10px; color: var(--accent-red);">Error: ${data.error}</td></tr>`;
        }
    } catch (err) {
        document.getElementById('profTableBody').innerHTML = `<tr><td colspan="4" style="padding: 10px; color: var(--accent-red);">Network Error</td></tr>`;
    }
}

export function renderEditForm(prof) {
    const container = document.getElementById('editProfContainer');
    const profile = prof.professionalProfile || {};
    const servicesStr = (profile.services || []).join(', ');
    const daysStr = (profile.workingDays || []).join(', ');

        container.style.position = 'relative';

    container.innerHTML = `
            <button id="backToListBtn" style="position: absolute; top: 20px; right: 20px; padding: 6px 12px; background: transparent; border: 1px solid var(--primary-gold); color: var(--primary-gold); border-radius: 4px; cursor: pointer; transition: background 0.3s ease; z-index: 10;" onmouseover="this.style.background='rgba(212, 175, 55, 0.1)'" onmouseout="this.style.background='transparent'">&larr; Back to List</button>
            <h2 class="gold-text" style="margin-bottom: 20px; padding-right: 120px;">Edit Professional: ${profile.alias || prof.email}</h2>
        <form id="adminEditProfForm" style="display: flex; flex-direction: column; gap: 15px;"> <div id="adminEditAlert" class="alert hidden" style="padding: 10px; border-radius: 4px; border: 1px solid transparent;"></div>
            <label>Email</label>
            <input type="email" id="adminEditEmail" value="${prof.email}" required style="padding: 8px; background: #222; color: white; border: 1px solid #444; border-radius: 4px;">
            
            <label>Verification Status</label>
            <select id="adminEditStatus" style="padding: 8px; background: #222; color: white; border: 1px solid #444; border-radius: 4px;">
                <option value="pending" ${prof.verificationStatus === 'pending' ? 'selected' : ''}>Pending</option>
                <option value="approved" ${prof.verificationStatus === 'approved' ? 'selected' : ''}>Approved</option>
                <option value="rejected" ${prof.verificationStatus === 'rejected' ? 'selected' : ''}>Rejected</option>
            </select>

            <h4 style="margin-bottom: 5px; border-bottom: 1px solid #444; padding-bottom: 5px; color: var(--primary-gold);">Identity & Contact</h4>
            <div style="display:flex; gap:10px; flex-wrap: wrap; margin-bottom: 10px;">
                <div style="flex:1;"><label>First Name</label><input type="text" id="adminEditFirstName" value="${profile.firstName || ''}" style="width:100%; padding: 8px; background: #222; color: white; border: 1px solid #444; border-radius: 4px;"></div>
                <div style="flex:1;"><label>Last Name</label><input type="text" id="adminEditLastName" value="${profile.lastName || ''}" style="width:100%; padding: 8px; background: #222; color: white; border: 1px solid #444; border-radius: 4px;"></div>
                <div style="flex:1;"><label>DNI</label><input type="text" id="adminEditIdNumber" value="${profile.idNumber || ''}" style="width:100%; padding: 8px; background: #222; color: white; border: 1px solid #444; border-radius: 4px;"></div>
                <div style="flex:1;"><label>Birth Date</label><input type="date" id="adminEditBirthDate" value="${profile.birthDate ? profile.birthDate.substring(0,10) : ''}" style="width:100%; padding: 8px; background: #222; color: white; border: 1px solid #444; border-radius: 4px;"></div>
            </div>
            <div style="display:flex; gap:10px; flex-wrap: wrap; margin-bottom: 15px;">
                <div style="flex:1;"><label>Mobile Phone</label><input type="text" id="adminEditMobilePhone" value="${profile.mobilePhone || ''}" style="width:100%; padding: 8px; background: #222; color: white; border: 1px solid #444; border-radius: 4px;"></div>
                <div style="flex:1;"><label>Street</label><input type="text" id="adminEditStreet" value="${profile.location?.street || ''}" style="width:100%; padding: 8px; background: #222; color: white; border: 1px solid #444; border-radius: 4px;"></div>
                <div style="flex:1;"><label>Number</label><input type="text" id="adminEditStreetNumber" value="${profile.location?.number || ''}" style="width:100%; padding: 8px; background: #222; color: white; border: 1px solid #444; border-radius: 4px;"></div>
                <div style="flex:1;"><label>Floor</label><input type="text" id="adminEditFloor" value="${profile.location?.floor || ''}" style="width:100%; padding: 8px; background: #222; color: white; border: 1px solid #444; border-radius: 4px;"></div>
                <div style="flex:1;"><label>Apt</label><input type="text" id="adminEditApartment" value="${profile.location?.apartment || ''}" style="width:100%; padding: 8px; background: #222; color: white; border: 1px solid #444; border-radius: 4px;"></div>
                <div style="flex:1;"><label>Post Code</label><input type="text" id="adminEditPostCode" value="${profile.location?.postalCode || ''}" style="width:100%; padding: 8px; background: #222; color: white; border: 1px solid #444; border-radius: 4px;"></div>
            </div>
            <div style="display:flex; gap:10px; flex-wrap: wrap; margin-bottom: 15px;">
                <div style="flex:1;"><label>Instagram</label><input type="text" id="adminEditInstagram" value="${profile.instagram || ''}" style="width:100%; padding: 8px; background: #222; color: white; border: 1px solid #444; border-radius: 4px;"></div>
                <div style="flex:1;"><label>Facebook</label><input type="text" id="adminEditFacebook" value="${profile.facebook || ''}" style="width:100%; padding: 8px; background: #222; color: white; border: 1px solid #444; border-radius: 4px;"></div>
            </div>

            <label>Alias</label>
            <input type="text" id="adminEditAlias" value="${profile.alias || ''}" style="padding: 8px; background: #222; color: white; border: 1px solid #444; border-radius: 4px;">
            <label>Quality</label>
            <select id="adminEditQuality" style="padding: 8px; background: #222; color: white; border: 1px solid #444; border-radius: 4px;">
                <option value="Standard" ${profile.quality === 'Standard' ? 'selected' : ''}>${t(CATEGORY_META['Standard'].name)}</option>
                <option value="Silver" ${profile.quality === 'Silver' ? 'selected' : ''}>${t(CATEGORY_META['Silver'].name)}</option>
                <option value="Gold" ${profile.quality === 'Gold' ? 'selected' : ''}>${t(CATEGORY_META['Gold'].name)}</option>
                <option value="Premium" ${profile.quality === 'Premium' ? 'selected' : ''}>${t(CATEGORY_META['Premium'].name)}</option>
                <option value="Elite" ${profile.quality === 'Elite' ? 'selected' : ''}>${t(CATEGORY_META['Elite'].name)}</option>
            </select>

            <label>Bio</label>
            <textarea id="adminEditBio" rows="4" style="padding: 8px; background: #222; color: white; border: 1px solid #444; border-radius: 4px;">${profile.bio || ''}</textarea>

            <div style="display:flex; gap:10px;">
                <div style="flex:1;"><label>Start Time (HH:mm)</label><input type="time" id="adminEditWStart" value="${profile.workingHours?.start || '00:00'}" style="width:100%; padding: 8px; background: #222; color: white; border: 1px solid #444; border-radius: 4px;"></div>
                <div style="flex:1;"><label>End Time (HH:mm)</label><input type="time" id="adminEditWEnd" value="${profile.workingHours?.end || '23:59'}" style="width:100%; padding: 8px; background: #222; color: white; border: 1px solid #444; border-radius: 4px;"></div>
            </div>
            
            <label>Working Days (comma separated)</label>
            <input type="text" id="adminEditWDays" value="${daysStr}" style="padding: 8px; background: #222; color: white; border: 1px solid #444; border-radius: 4px;" placeholder="Monday, Tuesday...">

            <label>Visibility / Exposure</label>
            <div style="display: flex; align-items: center; gap: 10px;">
                <input type="checkbox" id="adminEditIsExposed" ${profile.isExposed !== false ? 'checked' : ''} style="width: auto;">
                <span style="font-size: 0.9rem;">Show in public directory (active)</span>
            </div>

            <label>Billing</label>
            <div style="display: flex; align-items: center; gap: 10px;">
                <input type="checkbox" id="adminEditPaysMonthly" ${profile.paysMonthlyCharges !== false ? 'checked' : ''} style="width: auto;">
                <span style="font-size: 0.9rem;">Subject to Monthly Charges (Disable for free accounts)</span>
            </div>

            <label>Location</label>
            <div style="display:flex; gap:10px;">
                <select id="adminEditProvince" style="flex:1; padding: 8px; background: #222; color: white; border: 1px solid #444; border-radius: 4px;"></select>
                <select id="adminEditCity" style="flex:1; padding: 8px; background: #222; color: white; border: 1px solid #444; border-radius: 4px;"></select>
                <input type="text" id="adminEditNeigh" style="flex:1; padding: 8px; background: #222; color: white; border: 1px solid #444; border-radius: 4px;" placeholder="Neighborhood...">
            </div>

            <label>Services</label>
            <div id="adminEditServices"></div>

            <label>WhatsApp Number</label>
            <input type="text" id="adminEditWhatsapp" value="${profile.whatsappNumber || ''}" style="padding: 8px; background: #222; color: white; border: 1px solid #444; border-radius: 4px;">

            <label>Measurements</label>
            <input type="text" id="adminEditMeasurements" value="${profile.measurements || ''}" style="padding: 8px; background: #222; color: white; border: 1px solid #444; border-radius: 4px;">

            <label>Height</label>
            <input type="text" id="adminEditHeight" value="${profile.height || ''}" style="padding: 8px; background: #222; color: white; border: 1px solid #444; border-radius: 4px;">

            <label>Manage Photos</label>
            <div id="adminEditPhotos" style="display: flex; gap: 10px; flex-wrap: wrap; margin-bottom: 15px;"></div>

            <button type="submit" style="margin-top: 10px;">Save Changes</button>
        </form>
    `;

    setupLocationDropdowns('adminEditProvince', 'adminEditCity', 'adminEditNeigh', false, profile.location || {});
    renderSpecialtyDropdown('adminEditServices', profile.services || []);

    const photosHost = document.getElementById('adminEditPhotos');
    (profile.photos || []).forEach((photoSrc) => {
        const item = document.createElement('div');
        item.className = 'admin-photo-item';
        item.style.cssText = 'position: relative; width: 100px; height: 100px;';
        const img = document.createElement('img');
        img.src = photoSrc;
        img.style.cssText = 'width: 100%; height: 100%; object-fit: cover; border-radius: 4px;';
        const btn = document.createElement('button');
        btn.type = 'button';
        btn.className = 'remove-photo-btn';
        btn.textContent = 'X';
        btn.style.cssText = 'position: absolute; top: 0; right: 0; background: var(--accent-red); color: white; border: none; cursor: pointer; padding: 2px 6px;';
        item.appendChild(img);
        item.appendChild(btn);
        photosHost.appendChild(item);
    });

    document.getElementById('backToListBtn').onclick = () => renderProfessionalList();

    // Attach photo removal logic
    document.querySelectorAll('.remove-photo-btn').forEach(btn => {
        btn.onclick = (e) => {
            e.preventDefault();
            btn.parentElement.remove();
        };
    });
    applyStaticTranslations(container);

    document.getElementById('adminEditProfForm').onsubmit = async (e) => {
        e.preventDefault();
        const alertEl = document.getElementById('adminEditAlert');
        const submitBtn = e.target.querySelector('button[type="submit"]');
        submitBtn.disabled = true;
        submitBtn.textContent = 'Saving...';
        
        const remainingPhotos = Array.from(document.querySelectorAll('#adminEditPhotos img')).map(img => img.getAttribute('src'));

        const payload = {
            email: document.getElementById('adminEditEmail').value,
            verificationStatus: document.getElementById('adminEditStatus').value,
            professionalProfile: {
                    firstName: document.getElementById('adminEditFirstName').value,
                    lastName: document.getElementById('adminEditLastName').value,
                    idNumber: document.getElementById('adminEditIdNumber').value,
                    birthDate: document.getElementById('adminEditBirthDate').value ? new Date(document.getElementById('adminEditBirthDate').value).toISOString() : undefined,
                    age: document.getElementById('adminEditBirthDate').value ? Math.abs(new Date(Date.now() - new Date(document.getElementById('adminEditBirthDate').value).getTime()).getUTCFullYear() - 1970) : undefined,
                    mobilePhone: document.getElementById('adminEditMobilePhone').value,
                    instagram: document.getElementById('adminEditInstagram')?.value || '',
                    facebook: document.getElementById('adminEditFacebook')?.value || '',
                alias: document.getElementById('adminEditAlias').value,
                quality: document.getElementById('adminEditQuality').value,
                bio: document.getElementById('adminEditBio').value,
                services: document.getElementById('adminEditServices').tagName === 'SELECT'
                    ? Array.from(document.getElementById('adminEditServices').selectedOptions).map(opt => opt.value)
                    : document.getElementById('adminEditServices').value.split(','),
                whatsappNumber: document.getElementById('adminEditWhatsapp').value,
                workingHours: {
                    start: document.getElementById('adminEditWStart').value,
                    end: document.getElementById('adminEditWEnd').value
                },
                workingDays: document.getElementById('adminEditWDays').value.split(',').map(s => s.trim()).filter(s => s),
                isExposed: document.getElementById('adminEditIsExposed').checked,
                paysMonthlyCharges: document.getElementById('adminEditPaysMonthly').checked,
                location: {
                    province: document.getElementById('adminEditProvince')?.value || '',
                    city: (document.getElementById('adminEditProvince')?.value || '').trim().toLowerCase() === 'caba' ? '' : (document.getElementById('adminEditCity')?.value || ''),
                    neighborhood: (document.getElementById('adminEditProvince')?.value || '').trim().toLowerCase() === 'caba' ? (document.getElementById('adminEditCity')?.value || '') : (document.getElementById('adminEditNeigh')?.value || ''),
                        street: document.getElementById('adminEditStreet')?.value || '',
                        number: document.getElementById('adminEditStreetNumber')?.value || '',
                        floor: document.getElementById('adminEditFloor')?.value || '',
                        apartment: document.getElementById('adminEditApartment')?.value || '',
                        postalCode: document.getElementById('adminEditPostCode')?.value || ''
                },
                measurements: document.getElementById('adminEditMeasurements').value,
                height: document.getElementById('adminEditHeight').value,
                photos: remainingPhotos
            }
        };

        try {
            const token = localStorage.getItem('token');
            // Added credentials: 'include' to ensure auth cookie is sent
            const res = await fetch(`${API_URL}/admin/professionals/${prof._id}`, {
                method: 'PUT',
                headers: { 
                    'Content-Type': 'application/json',
                    'Authorization': `Bearer ${token}`
                },
                credentials: 'include',
                body: JSON.stringify(payload)
            });
            const data = await res.json();

            submitBtn.disabled = false;
            submitBtn.textContent = 'Save Changes';

            if (data.success) {
                showAlert(alertEl, 'Profile updated successfully!', false);
                setTimeout(() => {
                    const modal = document.getElementById('editProfModal');
                    if (modal) modal.style.display = 'none';
                    loadAdminGridData(); // Refresh the main grid
                }, 1500);
            } else {
                showAlert(alertEl, data.error || 'Update failed');
            }
        } catch (err) {
            submitBtn.disabled = false;
            submitBtn.textContent = 'Save Changes';
            showAlert(alertEl, 'Server connection error');
        }
    };
}

// --- Admin Edit Pricing Modal ---
export async function openEditPricingModal(currentPricing) {
    let modal = document.getElementById('editPricingModal');
    if (!modal) {
        modal = document.createElement('div');
        modal.id = 'editPricingModal';
        Object.assign(modal.style, {
            position: 'fixed', top: '0', left: '0', width: '100%', height: '100%',
            backgroundColor: 'rgba(0,0,0,0.9)', zIndex: '3000', display: 'flex',
            flexDirection: 'column', padding: '20px', overflowY: 'auto'
        });

        const closeBtn = document.createElement('button');
        closeBtn.innerHTML = '&#8592; Back to Dashboard';
        Object.assign(closeBtn.style, {
            alignSelf: 'flex-start', marginBottom: '15px', padding: '8px 12px',
            background: 'transparent', border: '1px solid var(--primary-gold)',
            color: 'var(--primary-gold)', borderRadius: '4px', cursor: 'pointer'
        });
        closeBtn.onclick = () => modal.style.display = 'none';

        const container = document.createElement('div');
        Object.assign(container.style, {
            backgroundColor: 'var(--dark-bg, #1a1a1a)', padding: '20px',
            borderRadius: '8px', color: 'white', maxWidth: '600px', margin: '0 auto', width: '100%'
        });

        container.innerHTML = `
            <h2 class="gold-text" style="margin-bottom: 20px;">${t('Change prices')}</h2>
            <p style="font-size: 0.9rem; margin-bottom: 20px; color: #aaa;">${t('Updating prices will email every professional in that category about the new monthly charge starting next month.')}</p>
            <form id="editPricingForm" style="display: flex; flex-direction: column; gap: 15px;">
                <div id="editPricingAlert" class="alert hidden" style="padding: 10px; border-radius: 4px; border: 1px solid transparent;"></div>
                
                <label>⭐ Elite (ARS)</label>
                <input type="number" id="priceElite" required style="padding: 8px; background: #222; color: white; border: 1px solid #444; border-radius: 4px;">

                <label>✨ Premium (ARS)</label>
                <input type="number" id="pricePremium" required style="padding: 8px; background: #222; color: white; border: 1px solid #444; border-radius: 4px;">

                <label>🟡 Gold (ARS)</label>
                <input type="number" id="priceGold" required style="padding: 8px; background: #222; color: white; border: 1px solid #444; border-radius: 4px;">

                <label>⚪ Silver (ARS)</label>
                <input type="number" id="priceSilver" required style="padding: 8px; background: #222; color: white; border: 1px solid #444; border-radius: 4px;">

                <label>🟤 Standard (ARS)</label>
                <input type="number" id="priceStandard" required style="padding: 8px; background: #222; color: white; border: 1px solid #444; border-radius: 4px;">

                <button type="submit" style="margin-top: 10px; padding: 10px; background: var(--primary-gold); color: var(--dark-bg); font-weight: bold; border: none; border-radius: 4px; cursor: pointer;">Save Pricing</button>
            </form>
        `;

        modal.appendChild(closeBtn);
        modal.appendChild(container);
        document.body.appendChild(modal);
        applyStaticTranslations(modal);

        document.getElementById('editPricingForm').onsubmit = async (e) => {
            e.preventDefault();
            const alertEl = document.getElementById('editPricingAlert');
            const submitBtn = e.target.querySelector('button[type="submit"]');
            
            submitBtn.disabled = true;
            submitBtn.textContent = 'Saving...';

            const newPricing = {
                Elite: parseInt(document.getElementById('priceElite').value, 10),
                Premium: parseInt(document.getElementById('pricePremium').value, 10),
                Gold: parseInt(document.getElementById('priceGold').value, 10),
                Silver: parseInt(document.getElementById('priceSilver').value, 10),
                Standard: parseInt(document.getElementById('priceStandard').value, 10)
            };

            const formData = new FormData();
            formData.append('adminPricing', JSON.stringify(newPricing));

            try {
                const token = localStorage.getItem('token');
                const res = await fetch(`${API_URL}/professionals/updateprofile`, {
                    method: 'PUT',
                    headers: { 'Authorization': `Bearer ${token}` },
                    credentials: 'include',
                    body: formData
                });
                const data = await res.json();

                if (data.success) {
                    showAlert(alertEl, t('Pricing updated successfully!'), false);
                    try {
                        await fetch(`${API_URL}/admin/notify-rate-change`, {
                            method: 'POST',
                            headers: { 'Authorization': `Bearer ${token}` },
                            credentials: 'include'
                        });
                    } catch (e) { console.warn('Rate change emails:', e); }
                    setTimeout(() => window.location.reload(), 1500);
                } else {
                    showAlert(alertEl, data.error || 'Failed to update pricing');
                }
            } catch (err) {
                showAlert(alertEl, 'Server connection error');
            } finally {
                submitBtn.disabled = false;
                submitBtn.textContent = 'Save Pricing';
            }
        };
    }

    document.getElementById('priceElite').value = currentPricing.Elite || 50000;
    document.getElementById('pricePremium').value = currentPricing.Premium || 40000;
    document.getElementById('priceGold').value = currentPricing.Gold || 30000;
    document.getElementById('priceSilver').value = currentPricing.Silver || 20000;
    document.getElementById('priceStandard').value = currentPricing.Standard || 15000;

    modal.style.display = 'flex';
}

window.openImageModal = openImageModal;
