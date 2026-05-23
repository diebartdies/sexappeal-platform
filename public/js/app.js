// SexAppeal Prototype Logic
const BASE_ORIGIN = window.location.protocol === 'file:' ? 'http://localhost:5000' : window.location.origin;
const API_URL = `${BASE_ORIGIN}/api/v1`;

let currentGalleryPhotos = [];
let currentGalleryIndex = 0;
let currentDiscoveryPage = 1;

function displayProfessionalStatus() {
    const statusElement = document.getElementById('loginStatus');
    // This element only exists on public-facing pages, so the function does nothing
    // on dedicated pages like the dashboard, login, etc.
    if (!statusElement) {
        return;
    }

    const userString = localStorage.getItem('user');
    // This function is a UI enhancement for logged-in professionals. As you noted,
    // it has no purpose for guests or users who are not logged in, so we exit early.
    if (!userString) {
        return;
    }

    try {
        const user = JSON.parse(userString);

        // Check if the logged-in user is a professional with an alias
        if (user && user.role === 'professional' && user.professionalProfile?.alias) {
            // Apply styles to make the status bar visually distinct, as requested.
            Object.assign(statusElement.style, {
                position: 'fixed',
                top: '0',
                left: '0',
                width: '100%',
                backgroundColor: 'rgba(0, 0, 0, 0.85)',
                color: 'white',
                padding: '10px',
                textAlign: 'center',
                zIndex: '1000',
                borderBottom: '1px solid var(--primary-gold)'
            });

            statusElement.innerHTML = `
                Logged in as: <strong>${user.professionalProfile.alias}</strong>
                <a href="dashboard.html" style="color: var(--primary-gold); text-decoration: underline; margin-left: 10px;">(Dashboard)</a>
            `;
        }
        // No 'else' block is needed. For guests or regular users, the element remains empty.
    } catch (e) {
        console.error('Failed to parse user from localStorage', e);
    }
}

// --- Auth Handling ---

// Guest Login (Landing Page Enter Button)
const btnEnter = document.getElementById('btn-enter');
if (btnEnter) {
    btnEnter.addEventListener('click', async () => {
        if (window.location.protocol === 'file:') {
            alert(`ERROR: You must open the site via a local server (e.g., ${BASE_ORIGIN}). The buttons will not work if you double-click the HTML file!`);
            return;
        }
        btnEnter.textContent = 'Entering...';
        btnEnter.disabled = true;
        try {
            const response = await fetch(`${API_URL}/auth/guest-login`, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' }
            });
            const data = await response.json();

            if (response.ok) {
                localStorage.setItem('is18Plus', 'true');
                localStorage.setItem('token', data.token);
                if (data.user) localStorage.setItem('user', JSON.stringify(data.user));
                
                window.location.href = 'categories.html';
            } else {
                alert('Failed to enter the site. Server responded with an error: ' + (data.error || 'Unknown error'));
                btnEnter.textContent = 'I am 18+ - Enter';
                btnEnter.disabled = false;
            }
        } catch (err) {
            console.error('Network error:', err);
            alert('Network error. Please ensure the server is running and try again.');
            btnEnter.textContent = 'I am 18+ - Enter';
            btnEnter.disabled = false;
        }
    });
}

// Exit button on landing page
const btnExit = document.getElementById('btn-exit');
if (btnExit) {
    btnExit.addEventListener('click', () => {
        window.location.href = 'https://www.google.com';
    });
}

// Login
const loginForm = document.getElementById('loginForm');
if (loginForm) {
    loginForm.addEventListener('submit', async (e) => {
        e.preventDefault();
        const email = document.getElementById('email').value;
        const password = document.getElementById('password').value;
        const alert = document.getElementById('loginAlert');

        try {
            const res = await fetch(`${API_URL}/auth/login`, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ email, password })
            });
            const data = await res.json();
            if (data.success) {
                localStorage.setItem('token', data.token);
                if (data.user) localStorage.setItem('user', JSON.stringify(data.user));
                // Redirect professional to their dashboard
                window.location.href = 'dashboard.html';
            } else if (data.error && data.error.includes('verify your email')) {
                window.location.href = `verify.html?email=${encodeURIComponent(email)}`;
            } else {
                showAlert(alert, data.error || 'Access Denied');
            }
        } catch (err) {
            showAlert(alert, 'Server connection error');
        }
    });
}

// Register
const registerForm = document.getElementById('registerForm');
if (registerForm) {
    registerForm.addEventListener('submit', async (e) => {
        e.preventDefault();
        const role = 'professional'; // Hardcoded since only professionals register now
        const email = document.getElementById('regEmail').value;
        const password = document.getElementById('regPassword').value;
        const alert = document.getElementById('registerAlert');

        const body = { 
            email, 
            password, 
            role,
            professionalProfile: {
                alias: document.getElementById('regAlias').value,
                bio: document.getElementById('regBio').value,
                hasOwnApartment: document.getElementById('regOwnApartment')?.checked || false,
                hasFantasyWardrobe: document.getElementById('regFantasyWardrobe')?.checked || false,
                location: {
                    province: document.getElementById('regProvince').value,
                    city: document.getElementById('regCity').value,
                    neighborhood: document.getElementById('regNeighborhood').value
                },
                measurements: document.getElementById('regMeasurements').value,
                height: document.getElementById('regHeight').value,
                // Read from multiple select if it's a dropdown, fallback to text split if not yet migrated
                services: document.getElementById('regServices').tagName === 'SELECT'
                    ? Array.from(document.getElementById('regServices').selectedOptions).map(opt => opt.value)
                    : document.getElementById('regServices').value.split(',').map(s => s.trim()).filter(s => s)
            }
        };

        try {
            const res = await fetch(`${API_URL}/auth/register`, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify(body)
            });
            const data = await res.json();
            if (data.success) {
                window.location.href = `verify.html?email=${encodeURIComponent(email)}`;
            } else {
                showAlert(alert, data.error || 'Registration failed');
            }
        } catch (err) {
            showAlert(alert, 'Server connection error');
        }
    });
}

// Verify
const verifyForm = document.getElementById('verifyForm');
if (verifyForm) {
    // Extract email from URL parameters
    const urlParams = new URLSearchParams(window.location.search);
    const emailFromUrl = urlParams.get('email');
    const emailInput = document.getElementById('verifyEmail');

    // Auto-fill the email input if it exists and we have it in the URL
    if (emailInput && emailFromUrl) {
        emailInput.value = emailFromUrl;
    }

    verifyForm.addEventListener('submit', async (e) => {
        e.preventDefault();
        // Use the input value if it exists, otherwise fall back to the URL parameter
        const email = (emailInput && emailInput.value) ? emailInput.value : new URLSearchParams(window.location.search).get('email');
        const code = document.getElementById('verifyCode') ? document.getElementById('verifyCode').value : '';
        const alert = document.getElementById('verifyAlert');

        try {
            const res = await fetch(`${API_URL}/auth/verify-email`, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ email, code })
            });
            const data = await res.json();
            if (data.success) {
                localStorage.setItem('token', data.token);
                if (data.user) localStorage.setItem('user', JSON.stringify(data.user));
                window.location.href = 'dashboard.html';
            } else {
                showAlert(alert, data.error || 'Invalid code');
            }
        } catch (err) {
            showAlert(alert, 'Server connection error');
        }
    });
}

// Forgot Password
const forgotPasswordForm = document.getElementById('forgotPasswordForm');
if (forgotPasswordForm) {
    forgotPasswordForm.addEventListener('submit', async (e) => {
        e.preventDefault();
        const email = document.getElementById('forgotEmail').value;
        const alert = document.getElementById('forgotAlert');

        try {
            const res = await fetch(`${API_URL}/auth/forgotpassword`, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ email })
            });
            const data = await res.json();
            if (data.success) {
                document.getElementById('forgotPasswordForm').classList.add('hidden');
                document.getElementById('resetPasswordForm').classList.remove('hidden');
                document.getElementById('resetEmail').value = email;
                document.getElementById('displayEmail').textContent = email;
            } else {
                showAlert(alert, data.error || 'Error sending code');
            }
        } catch (err) {
            showAlert(alert, 'Server connection error');
        }
    });
}

// Reset Password
const resetPasswordForm = document.getElementById('resetPasswordForm');
if (resetPasswordForm) {
    resetPasswordForm.addEventListener('submit', async (e) => {
        e.preventDefault();
        const email = document.getElementById('resetEmail').value;
        const code = document.getElementById('resetCode').value;
        const password = document.getElementById('resetNewPassword').value;
        const alert = document.getElementById('resetAlert');

        try {
            const res = await fetch(`${API_URL}/auth/resetpassword`, {
                method: 'PUT',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ email, code, password })
            });
            const data = await res.json();
            if (data.success) {
                showAlert(alert, 'Password reset successful!', false);
                setTimeout(() => window.location.href = 'index.html', 2000);
            } else {
                showAlert(alert, data.error || 'Reset failed');
            }
        } catch (err) {
            showAlert(alert, 'Server connection error');
        }
    });
}

// Logout
const logoutBtn = document.getElementById('logoutBtn');
if (logoutBtn) {
    logoutBtn.addEventListener('click', async (e) => {
        e.preventDefault();
        try {
            const token = localStorage.getItem('token');
            if (token) {
                await fetch(`${API_URL}/auth/logout`, {
                    method: 'POST',
                    headers: { 'Authorization': `Bearer ${token}` }
                });
            }
        } catch (err) {
            console.error('Logout error:', err);
        } finally {
            document.cookie = "token=; expires=Thu, 01 Jan 1970 00:00:00 UTC; path=/;";
            localStorage.removeItem('token');
            localStorage.removeItem('user');
            localStorage.removeItem('is18Plus');
            window.location.href = 'index.html';
        }
    });
}

// --- Discovery ---

// Load Treasures
async function loadTreasures(page = 1, append = false) {
    const grid = document.getElementById('treasureGrid');
    if (!grid) return;

    if (!append) {
        currentDiscoveryPage = 1;
    }
    
    // Inject hover styles for the profile thumbnails if not already present
    if (!document.getElementById('treasureHoverStyles')) {
        const style = document.createElement('style');
        style.id = 'treasureHoverStyles';
        style.textContent = `
            .treasure-img-container { margin: -20px -20px 15px -20px; overflow: hidden; border-radius: 10px 10px 0 0; aspect-ratio: 3/4; position: relative; }
            .treasure-img { width: 100%; height: 100%; object-fit: cover; transition: transform 0.5s ease; }
            .treasure-card { transition: box-shadow 0.3s ease, transform 0.3s ease; }
            .treasure-card:hover { box-shadow: 0 15px 30px rgba(0, 0, 0, 0.8), 0 0 15px rgba(212, 175, 55, 0.1); transform: translateY(-4px); }
            .treasure-card:hover .treasure-img { transform: scale(1.08); }
        `;
        document.head.appendChild(style);
    }

    const urlParams = new URLSearchParams(window.location.search);
    const specialty = urlParams.get('specialty');
    const quality = urlParams.get('quality'); // Formerly tier
    const province = urlParams.get('province');
    const city = urlParams.get('city');
    const neighborhood = urlParams.get('neighborhood');

    const url = new URL(`${API_URL}/professionals`);
    if (specialty && specialty.trim()) {
        url.searchParams.set('specialty', specialty);
    }
    if (quality && quality.trim()) {
        url.searchParams.set('quality', quality);
    }
    if (province && province.trim()) url.searchParams.set('province', province);
    if (city && city.trim()) url.searchParams.set('city', city);
    if (neighborhood && neighborhood.trim()) url.searchParams.set('neighborhood', neighborhood);

    url.searchParams.set('page', page);
    url.searchParams.set('limit', 12);
    // Add a cache-busting parameter to ensure fresh data is always fetched
    url.searchParams.set('_', new Date().getTime());

    // Setup Load More button
    let loadMoreBtn = document.getElementById('loadMoreBtn');
    if (!loadMoreBtn) {
        loadMoreBtn = document.createElement('button');
        loadMoreBtn.id = 'loadMoreBtn';
        loadMoreBtn.textContent = 'Load More Treasures';
        loadMoreBtn.style.margin = '30px auto';
        loadMoreBtn.style.display = 'none';
        loadMoreBtn.style.padding = '10px 30px';
        loadMoreBtn.style.cursor = 'pointer';
        loadMoreBtn.style.background = 'transparent';
        loadMoreBtn.style.color = 'var(--primary-gold)';
        loadMoreBtn.style.border = '1px solid var(--primary-gold)';
        loadMoreBtn.style.borderRadius = '5px';
        loadMoreBtn.style.textTransform = 'uppercase';
        loadMoreBtn.style.letterSpacing = '1px';
        loadMoreBtn.style.transition = 'all 0.3s ease';
        
        loadMoreBtn.addEventListener('mouseover', () => {
            loadMoreBtn.style.background = 'rgba(212, 175, 55, 0.1)';
        });
        loadMoreBtn.addEventListener('mouseout', () => {
            loadMoreBtn.style.background = 'transparent';
        });

        grid.parentNode.insertBefore(loadMoreBtn, grid.nextSibling);
        
        loadMoreBtn.addEventListener('click', () => {
            loadMoreBtn.textContent = 'Loading...';
            loadMoreBtn.disabled = true;
            currentDiscoveryPage++;
            loadTreasures(currentDiscoveryPage, true);
        });
    }

    if (!append && loadMoreBtn) {
        loadMoreBtn.style.display = 'none';
    }

    try {
        const res = await fetch(url);
        if (!res.ok) {
            throw new Error(`Server returned status ${res.status}`);
        }
        
        const data = await res.json();

        if (data.success && data.data.length > 0) {
            if (!append) {
                grid.innerHTML = '';
            }
            data.data.forEach(treasure => {
                const card = document.createElement('div');
                const prof = treasure.professionalProfile || {};
                const quality = prof.quality || 'Standard'; // Default to Standard if quality is missing
                const photoUrl = (prof.photos && prof.photos.length > 0) ? prof.photos[0] : 'https://via.placeholder.com/300x400?text=No+Photo';
                const bioText = prof.bio || '';

                card.className = 'card treasure-card';
                card.innerHTML = `
                    <div class="treasure-img-container">
                        <img class="treasure-img" src="${photoUrl}" alt="${prof.alias || 'Unknown'}">
                    </div>
                    <div class="tag">${treasure.revelationStatus || 'REVEALED'}</div>
                    <div class="quality-badge quality-${quality.toLowerCase()}">${quality}</div>
                    <h3 class="treasure-alias gold-text">${prof.alias || 'Unknown'}</h3>
                    <div class="tag-list">
                        ${(prof.services || []).map(s => `<span class="tag">${s}</span>`).join('')}
                    </div>
                    <p style="font-size: 0.9rem; margin-bottom: 15px; opacity: 0.8;">
                        ${bioText.length > 80 ? bioText.substring(0, 80) + '...' : bioText}
                    </p>
                    <div style="margin-top: 15px; border-top: 1px solid rgba(255,255,255,0.1); padding-top: 15px;">
                        <button onclick="window.location.href='/perfil/${encodeURIComponent(prof.alias || '')}'" style="width: 100%;">View Full Profile</button>
                    </div>
                `;
                grid.appendChild(card);
            });

            if (data.pagination && data.pagination.hasMore) {
                loadMoreBtn.style.display = 'block';
                loadMoreBtn.textContent = 'Load More Treasures';
                loadMoreBtn.disabled = false;
            } else {
                loadMoreBtn.style.display = 'none';
            }
        } else if (!append) {
            grid.innerHTML = `
                <div class="card" style="grid-column: 1/-1; text-align: center;">
                    <h3 class="gold-text">No Treasures Found</h3>
                    <p style="margin-bottom: 20px;">No professionals match your current selection.</p>
                    <button onclick="window.location.href='categories.html'">Filter Again</button>
                </div>
            `;
            loadMoreBtn.style.display = 'none';
        }
    } catch (err) {
        console.error('Vault connection error:', err);
        if (!append) {
            grid.innerHTML = `<div class="card alert" style="grid-column: 1/-1;">Error connecting to the vault: ${err.message}. Please ensure the server is running.</div>`;
        }
        if (loadMoreBtn) loadMoreBtn.style.display = 'none';
    }
}

// Load Single Treasure Details
async function loadTreasureDetails() {
    const content = document.getElementById('treasureContent');
    const loader = document.getElementById('loader');
    if (!content) return;

    const urlParams = new URLSearchParams(window.location.search);
    let alias = urlParams.get('alias');
    
    // Extract alias from SEO-friendly URL if present (e.g., /perfil/Maria)
    if (!alias && window.location.pathname.startsWith('/perfil/')) {
        const pathParts = window.location.pathname.split('/perfil/');
        if (pathParts.length > 1) alias = decodeURIComponent(pathParts[1].replace(/\/$/, ''));
    }

    if (!alias) {
        loader.innerHTML = '<p class="alert">No treasure specified.</p>';
        return;
    }

    try {
        const res = await fetch(`${API_URL}/professionals/${alias}`);
        if (!res.ok) {
            throw new Error(`Server returned status ${res.status}`);
        }
        
        const data = await res.json();

        if (data.success) {
            const treasure = data.data;
            const prof = treasure.professionalProfile;
            const hasWhatsapp = prof.whatsappNumber && prof.whatsappNumber.trim() !== '';

            // Store photos for gallery navigation
            currentGalleryPhotos = prof.photos || [];

            content.innerHTML = `
                <div class="card">
                    <h2 class="gold-text" style="text-align: center; margin-bottom: 20px;">${prof.alias || 'Unknown'}</h2>
                    
                    <!-- Photo Carousel/Grid for Guests -->
                    <div id="treasurePhotoGrid" class="photo-grid" style="margin-bottom: 30px;">
                        <!-- Photos will be injected here -->
                    </div>

                    <p style="white-space: pre-wrap; margin-bottom: 20px;">${prof.bio}</p>

                    <div class="tag-list" style="justify-content: flex-start; margin-top: 10px;">
                        <strong>Specialties:</strong> 
                        ${(prof.services || []).map(s => `<span class="tag">${s}</span>`).join('')}
                    </div>

                    <div style="margin-top: 20px; border-top: 1px solid rgba(255,255,255,0.1); padding-top: 20px;">
                        <p><strong>Location:</strong> ${prof.location ? `${prof.location.neighborhood || 'N/A'}, ${prof.location.city || 'N/A'}` : 'N/A'}</p>
                        <p><strong>Measurements:</strong> ${prof.measurements || 'N/A'}</p>
                        <p><strong>Height:</strong> ${prof.height || 'N/A'}</p>
                    </div>

                    <div style="margin-top: 30px; text-align: center;">
                        ${hasWhatsapp ? `<button onclick="contactOnWhatsApp('${prof.whatsappNumber}', '${prof.alias}')">Contact on WhatsApp</button>` : ''}
                    </div>
                </div>
            `;

            const photoGrid = document.getElementById('treasurePhotoGrid');
            if (currentGalleryPhotos.length > 0) {
                currentGalleryPhotos.forEach((url, index) => {
                    const item = document.createElement('div');
                    item.className = 'photo-item-public';
                    
                    const img = document.createElement('img');
                    img.src = url;
                    img.alt = `${prof.alias}'s photo`;
                    
                    // Add click listener for zoom
                    item.addEventListener('click', () => {
                        const modal = document.getElementById('zoomModal');
                        const modalImg = document.getElementById('zoomedImg');
                        if (modal && modalImg) {
                            currentGalleryIndex = index;
                            modal.classList.remove('hidden');
                            modalImg.src = url;
                            updateModalNav();
                        }
                    });

                    item.appendChild(img);
                    photoGrid.appendChild(item);
                });
            } else {
                photoGrid.innerHTML = '<p>No photos available.</p>';
            }

            loader.classList.add('hidden');
            content.classList.remove('hidden');
        } else {
            loader.innerHTML = `<p class="alert">Could not find the specified treasure.</p>`;
        }
    } catch (err) {
        console.error('Error loading treasure details:', err);
        loader.innerHTML = `<p class="alert">Error connecting to the vault: ${err.message}</p>`;
    }
}

function updateModalNav() {
    const prevBtn = document.querySelector('.modal-prev');
    const nextBtn = document.querySelector('.modal-next');
    if (!prevBtn || !nextBtn) return;

    prevBtn.style.display = currentGalleryIndex > 0 ? 'block' : 'none';
    nextBtn.style.display = currentGalleryIndex < currentGalleryPhotos.length - 1 ? 'block' : 'none';
}

// Combined Filter Logic
async function initializeFilters() {
    const filterForm = document.getElementById('filterForm');
    const qualitySelect = document.getElementById('qualitySelect'); // Formerly tierSelect
    const specialtySelect = document.getElementById('specialtySelect'); // Formerly serviceSelect

    if (!filterForm) return;

    // Suggested fix from user analysis: Improve contrast for visibility.
    // The report indicated that the parent card's transparency made the form's
    // light-colored text difficult to read against the page background.
    const parentCard = filterForm.closest('.card');
    if (parentCard) {
        // By making the background darker and more opaque, we ensure sufficient contrast.
        parentCard.style.backgroundColor = 'rgba(10, 10, 10, 0.9)';
    }

    // Function to populate the specialty dropdown
    const populateSpecialties = async (quality = '') => {
        if (!specialtySelect) return;
        specialtySelect.innerHTML = '<option>Loading...</option>';
        try {
            const url = new URL(`${API_URL}/professionals/specialties`);
            if (quality) {
                url.searchParams.set('quality', quality);
            }
            url.searchParams.set('_', new Date().getTime());

            const res = await fetch(url);
            const data = await res.json();

            if (data.success) {
                specialtySelect.innerHTML = '';
                const allOption = document.createElement('option');
                allOption.value = '';
                allOption.textContent = 'All';
                specialtySelect.appendChild(allOption);

                data.data.forEach(specialty => {
                    const option = document.createElement('option');
                    option.value = specialty;
                    option.textContent = specialty;
                    specialtySelect.appendChild(option);
                });
            } else {
                specialtySelect.innerHTML = '<option value="">All</option>';
            }
        } catch (err) {
            console.error('Failed to load specialties', err);
            specialtySelect.innerHTML = '<option>Error loading</option>';
        }
    };

    // Populate specialties on initial page load
    await populateSpecialties();

    const urlParams = new URLSearchParams(window.location.search);
    const province = urlParams.get('province');
    const city = urlParams.get('city');
    const neighborhood = urlParams.get('neighborhood');

    // Repopulate specialties when quality changes
    if (qualitySelect) {
        qualitySelect.addEventListener('change', () => {
            populateSpecialties(qualitySelect.value);
        });
    }

    // Handle form submission
    filterForm.addEventListener('submit', (e) => {
        e.preventDefault();
        const quality = qualitySelect ? qualitySelect.value : '';
        const specialty = specialtySelect ? specialtySelect.value : '';
        
        const provEl = document.getElementById('provinceSelect');
        const cityEl = document.getElementById('citySelect');
        const neighEl = document.getElementById('neighborhoodSelect');

        const url = new URL(`${BASE_ORIGIN}/categories.html`);
        if (quality && quality.trim()) url.searchParams.set('quality', quality);
        if (specialty && specialty.trim()) url.searchParams.set('specialty', specialty);
        if (provEl && provEl.value.trim()) url.searchParams.set('province', provEl.value);
        if (cityEl && cityEl.value.trim()) url.searchParams.set('city', cityEl.value);
        if (neighEl && neighEl.value.trim()) url.searchParams.set('neighborhood', neighEl.value);
        
        window.location.href = url.toString();
    });
}

// Contact on WhatsApp
function contactOnWhatsApp(number, alias) {
    const cleanNumber = number.replace(/\D/g, ''); // Remove non-digit characters
    const message = `Hello ${alias}, I saw your profile on SexAppeal and I'm interested in your services.`;
    const url = `https://wa.me/${cleanNumber}?text=${encodeURIComponent(message)}`;
    window.open(url, '_blank');
}

// --- Dashboard ---

async function loadDashboard() {
    const content = document.getElementById('dashboardContent');
    const loader = document.getElementById('loader');
    if (!content) return;

    try {
        const token = localStorage.getItem('token');
        const res = await fetch(`${API_URL}/professionals/me`, {
            headers: { 'Authorization': `Bearer ${token}` }
        });
        const data = await res.json();

        if (data.success) {
            const user = data.data;
            const prof = user.professionalProfile || {};

            // Safe value setter (ignores missing HTML elements)
            const setVal = (id, val) => {
                const el = document.getElementById(id);
                if (el) el.value = val;
            };

            // Fill fields
            setVal('upAlias', prof.alias || '');
            setVal('upBio', prof.bio || '');
            
            // Update read-only quality display instead of dropdown
            const displayQuality = document.getElementById('displayQuality');
            if (displayQuality) {
                displayQuality.textContent = prof.quality || 'Standard';
                displayQuality.className = `quality-badge quality-${(prof.quality || 'Standard').toLowerCase()}`;
            }
            
            const aptEl = document.getElementById('upOwnApartment');
            if (aptEl) aptEl.checked = !!prof.hasOwnApartment;
            const wardEl = document.getElementById('upFantasyWardrobe');
            if (wardEl) wardEl.checked = !!prof.hasFantasyWardrobe;
            
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
            setVal('upMeasurements', prof.measurements || '');
            setVal('upHeight', prof.height || '');
            setVal('upWhatsapp', prof.whatsappNumber || '');
            
            setupLocationDropdowns('upProvince', 'upCity', 'upNeighborhood', false, prof.location || {});

            const photoGrid = document.getElementById('photoGrid');
            if (photoGrid) {
                photoGrid.innerHTML = '';
                (prof.photos || []).forEach(url => addPhotoToGrid(url));
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

            if (loader) loader.classList.add('hidden');
            if (content) content.classList.remove('hidden');
        } else {
            console.error('Dashboard auth error:', data.error);
            window.location.href = 'index.html';
        }
    } catch (err) {
        console.error('Dashboard rendering error:', err);
        if (loader) loader.innerHTML = `<p style="color: var(--accent-red)">Error loading vault. See console.</p>`;
    }
}

// Update Profile
const updateProfileForm = document.getElementById('updateProfileForm');
if (updateProfileForm) {
    updateProfileForm.addEventListener('submit', async (e) => {
        e.preventDefault();
        const alert = document.getElementById('updateAlert');
        const formData = new FormData();

        // Append all text fields
        formData.append('alias', document.getElementById('upAlias').value);
        formData.append('bio', document.getElementById('upBio').value);
        formData.append('hasOwnApartment', document.getElementById('upOwnApartment').checked);
        formData.append('hasFantasyWardrobe', document.getElementById('upFantasyWardrobe').checked);
        
        const upServicesEl = document.getElementById('upServices');
        const servicesVal = upServicesEl.tagName === 'SELECT'
            ? Array.from(upServicesEl.selectedOptions).map(opt => opt.value).join(',')
            : upServicesEl.value;
        formData.append('services', servicesVal);
        
        const upProv = document.getElementById('upProvince');
        const upCity = document.getElementById('upCity');
        const upNeigh = document.getElementById('upNeighborhood');
        if (upProv) formData.append('province', upProv.value);
        if (upCity) formData.append('city', upCity.value);
        if (upNeigh) formData.append('neighborhood', upNeigh.value);

        formData.append('measurements', document.getElementById('upMeasurements').value);
        formData.append('height', document.getElementById('upHeight').value);
        formData.append('whatsappNumber', document.getElementById('upWhatsapp').value);

        const existingPhotos = [];
        const photoElements = document.querySelectorAll('#photoGrid .photo-item img');

        photoElements.forEach(img => {
            if (newFilesMap.has(img.src)) {
                // It's a new file, append the File object for multer
                formData.append('photos', newFilesMap.get(img.src));
            } else {
                // It's an existing photo URL that we want to keep
                existingPhotos.push(img.src);
            }
        });

        // Append the list of existing photos as a JSON string
        formData.append('existingPhotos', JSON.stringify(existingPhotos));

        try {
            const token = localStorage.getItem('token');
            const res = await fetch(`${API_URL}/professionals/updateprofile`, {
                method: 'PUT',
                headers: { 
                    'Authorization': `Bearer ${token}`
                },
                body: formData
            });
            const data = await res.json();
            if (data.success) {
                showAlert(alert, 'Profile updated successfully!', false);
            } else {
                showAlert(alert, data.error || 'Update failed');
            }
        } catch (err) {
            showAlert(alert, 'Server connection error');
        }
    });
}

// Acknowledge Rate
const ackRateBtn = document.getElementById('ackRateBtn');
if (ackRateBtn) {
    ackRateBtn.addEventListener('click', async () => {
        try {
            const token = localStorage.getItem('token');
            const res = await fetch(`${API_URL}/professionals/acknowledge-rate`, {
                method: 'PUT',
                headers: { 'Authorization': `Bearer ${token}` }
            });
            const data = await res.json();
            if (data.success) {
                document.getElementById('rateAlert').classList.add('hidden');
            }
        } catch (err) {
            console.error('Failed to acknowledge rate');
        }
    });
}

// --- Photo Gallery Management ---

// This map will hold the mapping from blob URLs to the actual File objects
const newFilesMap = new Map();

function addPhotoToGrid(fileOrUrl) {
    const grid = document.getElementById('photoGrid');
    if (!grid) return;

    let imageUrl;
    let isNew = false;

    if (typeof fileOrUrl === 'string') {
        // This is an existing photo URL from the server
        imageUrl = fileOrUrl;
    } else { 
        // This is a new File object from the user's computer
        imageUrl = URL.createObjectURL(fileOrUrl);
        newFilesMap.set(imageUrl, fileOrUrl); // Map blob URL to the File object
        isNew = true;
    }

    const item = document.createElement('div');
    item.className = 'photo-item';
    
    const img = document.createElement('img');
    img.src = imageUrl;
    img.alt = 'User Photo';
    img.onerror = () => {
        if (isNew) URL.revokeObjectURL(imageUrl); // Clean up blob
        item.remove();
        const alertEl = document.getElementById('photoUpdateAlert');
        if (alertEl) {
            showAlert(alertEl, `Could not load image from URL.`);
            setTimeout(() => alertEl.classList.add('hidden'), 3000);
        }
    };

    const overlay = document.createElement('div');
    overlay.className = 'remove-overlay';
    overlay.innerHTML = '&times;'; // 'x' symbol for remove

    item.appendChild(img);
    item.appendChild(overlay);

    item.addEventListener('click', () => {
        if (confirm('Are you sure you want to remove this photo from your gallery?')) {
            // If it's a newly added photo, revoke its object URL to free up memory
            if (newFilesMap.has(img.src)) {
                URL.revokeObjectURL(img.src);
                newFilesMap.delete(img.src);
            }
            item.remove();
        }
    });

    grid.appendChild(item);
}

const newPhotoInput = document.getElementById('newPhotoInput');
if (newPhotoInput) {
    newPhotoInput.addEventListener('change', (e) => {
        if (e.target.files) {
            for (const file of e.target.files) {
                if (!file.type.startsWith('image/')) {
                    alert('Please select valid image files only.');
                    continue;
                }
                addPhotoToGrid(file);
            }
        }
    });
}

// --- Helpers ---

function showAlert(element, message, isError = true) {
    element.textContent = message;
    element.classList.remove('hidden');
    element.style.color = isError ? 'var(--accent-red)' : '#00ff00';
}

// Populates location dropdowns dynamically based on current API relationships
async function setupLocationDropdowns(provinceId, cityId, neighborhoodId, isFilter = false, prefillData = {}) {
    const provinceEl = document.getElementById(provinceId);
    let cityEl = document.getElementById(cityId);
    let neighborhoodEl = document.getElementById(neighborhoodId);

    if (!provinceEl || provinceEl.tagName !== 'SELECT') return;

    // Static fallback for Argentina provinces if DB is empty
    const fallbackProvinces = [
        "Buenos Aires", "Catamarca", "Chaco", "Chubut", "Córdoba",
        "Corrientes", "Entre Ríos", "Formosa", "Jujuy", "La Pampa",
        "La Rioja", "Mendoza", "Misiones", "Neuquén", "Río Negro",
        "Salta", "San Juan", "San Luis", "Santa Cruz", "Santa Fe",
        "Santiago del Estero", "Tierra del Fuego"
    ];

    // Helper to dynamically switch a dropdown to a text input
    const morphToInput = (el, placeholderText, prefillValue) => {
        if (!el || el.tagName === 'INPUT') return el;
        const input = document.createElement('input');
        input.type = 'text';
        input.id = el.id;
        input.className = el.className || 'form-select'; // Keep existing styling
        if (el.name) input.name = el.name;
        input.placeholder = placeholderText;
        input.value = prefillValue || '';
        el.parentNode.replaceChild(input, el);
        return input;
    };

    // Helper to dynamically switch a text input back to a dropdown
    const morphToSelect = (el) => {
        if (!el || el.tagName === 'SELECT') return el;
        const select = document.createElement('select');
        select.id = el.id;
        select.className = el.className || 'form-select';
        if (el.name) select.name = el.name;
        el.parentNode.replaceChild(select, el);
        return select;
    };

    try {
        let res;
        try { res = await fetch(`${API_URL}/locations/provinces`); } catch (e) {}
        let data = res && res.ok ? await res.json() : { success: false };
        
        let provinceList = [];
        if (data.success && data.data && data.data.length > 0) {
            provinceList = data.data;
        } else {
            // Fallback to static list if DB is empty
            provinceList = fallbackProvinces.map(name => ({ name, _id: name }));
        }

        const defaultText = isFilter ? 'All Provinces' : 'Select Province';
        provinceEl.innerHTML = `<option value="">${defaultText}</option>`;
        
        provinceList.forEach(p => {
            const opt = document.createElement('option');
            opt.value = p.name;
            opt.dataset.id = p._id;
            opt.textContent = p.name;
            if (prefillData.province === p.name) opt.selected = true;
            provinceEl.appendChild(opt);
        });

        const loadSublocations = async () => {
            // Re-fetch elements in case they were morphed by previous selections
            cityEl = document.getElementById(cityId);
            neighborhoodEl = document.getElementById(neighborhoodId);

            const selectedOpt = provinceEl.options[provinceEl.selectedIndex];
            const pId = selectedOpt ? selectedOpt.dataset.id : null;
            const provinceName = provinceEl.value;
            const subDefaultText = isFilter ? 'All' : 'Select...';

            if (!pId) {
                cityEl = morphToSelect(cityEl);
                neighborhoodEl = morphToSelect(neighborhoodEl);
                if (cityEl) { cityEl.innerHTML = `<option value="">${subDefaultText}</option>`; cityEl.disabled = true; }
                if (neighborhoodEl) { neighborhoodEl.innerHTML = `<option value="">${subDefaultText}</option>`; neighborhoodEl.disabled = true; }
                return;
            }

            // If using the fallback list, we know there are no DB sublocations, morph immediately
            if (fallbackProvinces.includes(pId)) {
                morphToInput(cityEl, isFilter ? 'City...' : 'Enter City', prefillData.city);
                morphToInput(neighborhoodEl, isFilter ? 'Neighborhood...' : 'Enter Neighborhood', prefillData.neighborhood);
                // Clear prefill after first load
                if (prefillData.city) prefillData.city = '';
                if (prefillData.neighborhood) prefillData.neighborhood = '';
                return;
            }

            // Safe execution to handle legacy/active DB configurations dynamically if they exist
            try {
                // (Your existing location API fetching logic would go here if populated)
                // But since the DB is empty, we force the fallback text inputs immediately
                morphToInput(cityEl, isFilter ? 'City...' : 'Enter City', prefillData.city);
                morphToInput(neighborhoodEl, isFilter ? 'Neighborhood...' : 'Enter Neighborhood', prefillData.neighborhood);
            } catch (e) {
                morphToInput(cityEl, isFilter ? 'City...' : 'Enter City', prefillData.city);
                morphToInput(neighborhoodEl, isFilter ? 'Neighborhood...' : 'Enter Neighborhood', prefillData.neighborhood);
            }
        };
        provinceEl.addEventListener('change', loadSublocations);
        if (prefillData.province) await loadSublocations();
    } catch (err) { console.error('Failed to load locations', err); }
}

// --- Auto-Initialize ---
document.addEventListener('DOMContentLoaded', () => {
    // Age Verification Gate:
    const pageSegment = window.location.pathname.split('/').pop();
    const currentPage = (pageSegment === '' || pageSegment === '/') ? 'index.html' : pageSegment;
    const isProfilePath = window.location.pathname.startsWith('/perfil/');
    const effectivePage = isProfilePath ? 'treasure.html' : currentPage;

    const publicPages = ['index.html', 'login.html', 'register.html', 'verify.html', 'forgot.html'];
    const isPublicPage = publicPages.includes(effectivePage);
    const is18Plus = localStorage.getItem('is18Plus');

    if (!isPublicPage && is18Plus !== 'true') {
        // If on a protected page without age verification, redirect to the landing page.
        window.location.replace('/index.html');
        return; // Stop further script execution on this page.
    }

    // --- THE FLOW GUARDIAN (Ancestor Code System) ---
    // Ensures that child pages can only be opened by their designated ancestor.
    const allowedAncestors = {
        'categories.html': ['index.html', 'categories.html', 'treasure.html', 'dashboard.html', 'login.html'],
        'treasure.html': ['categories.html', 'treasure.html'],
        'dashboard.html': ['index.html', 'login.html', 'verify.html', 'categories.html', 'treasure.html', 'dashboard.html'],
        'verify.html': ['register.html', 'login.html', 'verify.html'],
        'register.html': ['index.html', 'login.html', 'register.html'],
        'login.html': ['index.html', 'register.html', 'forgot.html', 'login.html'],
        'forgot.html': ['login.html', 'forgot.html'],
        'home.html': ['dashboard.html', 'home.html']
    };

    if (effectivePage === 'index.html') {
        sessionStorage.setItem('ancestor_code', 'index.html');
    } else {
        const currentAncestorCode = sessionStorage.getItem('ancestor_code');
        const allowed = allowedAncestors[effectivePage];

        if (allowed && (!currentAncestorCode || !allowed.includes(currentAncestorCode))) {
            console.warn(`[Flow Guardian] Access denied. Invalid ancestor code for ${effectivePage}. Redirecting to start.`);
            window.location.replace('/index.html');
            return;
        }
        sessionStorage.setItem('ancestor_code', effectivePage);
    }
    // ------------------------------------------------

    displayProfessionalStatus();

    // Auto-forward on landing page if already age-verified
    if (document.getElementById('landing')) {
        const token = localStorage.getItem('token');

        if (is18Plus === 'true' && token) {
            window.location.replace('categories.html');
            return;
        }
    }

    if (document.getElementById('registerForm')) {
        setupLocationDropdowns('regProvince', 'regCity', 'regNeighborhood', false, {});
    }

    if (document.getElementById('filterForm')) {
        const p = new URLSearchParams(window.location.search);
        setupLocationDropdowns('provinceSelect', 'citySelect', 'neighborhoodSelect', true, { province: p.get('province'), city: p.get('city'), neighborhood: p.get('neighborhood') });
        initializeFilters();
    }
    if (document.getElementById('treasureGrid')) loadTreasures();
    if (document.getElementById('dashboardContent')) loadDashboard();
    if (document.getElementById('treasureDetail')) loadTreasureDetails();

    // Add modal closing logic
    const modal = document.getElementById('zoomModal');
    if (modal) {
        const closeBtn = document.querySelector('.modal-close');
        const prevBtn = document.querySelector('.modal-prev');
        const nextBtn = document.querySelector('.modal-next');

        const showImage = (index) => {
            if (index >= 0 && index < currentGalleryPhotos.length) {
                currentGalleryIndex = index;
                document.getElementById('zoomedImg').src = currentGalleryPhotos[currentGalleryIndex];
                updateModalNav();
            }
        };
        
        // Close when clicking the 'x'
        if (closeBtn) {
            closeBtn.addEventListener('click', () => {
                modal.classList.add('hidden');
            });
        }

        // Navigate with arrows
        if (prevBtn) {
            prevBtn.addEventListener('click', () => showImage(currentGalleryIndex - 1));
        }
        if (nextBtn) {
            nextBtn.addEventListener('click', () => showImage(currentGalleryIndex + 1));
        }

        // Close when clicking the background overlay
        modal.addEventListener('click', (e) => {
            if (e.target === modal) { // only if the click is on the overlay itself
                modal.classList.add('hidden');
            }
        });

        // Navigate with keyboard
        document.addEventListener('keydown', (e) => {
            if (modal.classList.contains('hidden')) return;
            if (e.key === 'ArrowRight') nextBtn.click();
            else if (e.key === 'ArrowLeft') prevBtn.click();
            else if (e.key === 'Escape') closeBtn.click();
        });

        // --- Mobile Swipe Navigation ---
        let touchStartX = 0;
        let touchEndX = 0;

        modal.addEventListener('touchstart', (e) => {
            // We only care about the first touch to start the swipe
            touchStartX = e.changedTouches[0].screenX;
        }, { passive: true });

        modal.addEventListener('touchend', (e) => {
            touchEndX = e.changedTouches[0].screenX;
            handleSwipe();
        });

        function handleSwipe() {
            const swipeThreshold = 50; // Minimum distance in pixels for a swipe
            if (touchStartX - touchEndX > swipeThreshold) {
                if (nextBtn) nextBtn.click(); // Swiped left
            } else if (touchEndX - touchStartX > swipeThreshold) {
                if (prevBtn) prevBtn.click(); // Swiped right
            }
        }
    }
});
