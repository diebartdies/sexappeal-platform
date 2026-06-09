// SexAppeal Prototype Logic
const BASE_ORIGIN = window.location.protocol === 'file:' ? 'http://localhost:5000' : window.location.origin;
const API_URL = `${BASE_ORIGIN}/api/v1`;

const CATEGORY_META = {
    'Elite': { name: '⭐ Elite', logo: '<svg viewBox="0 0 40 50" width="100%"><rect x="2" y="2" width="36" height="46" fill="none" stroke="currentColor" stroke-width="2" rx="4"/><text x="20" y="22" font-family="serif" font-size="14" fill="currentColor" text-anchor="middle" font-weight="bold">R</text><text x="20" y="36" font-family="serif" font-size="14" fill="currentColor" text-anchor="middle" font-weight="bold">R</text></svg>', desc: 'Peak Luxury & Royalty', price: '50.000 ARS' },
    'Premium': { name: '✨ Premium', logo: '<svg viewBox="0 0 100 40" width="100%"><path d="M10,20 Q30,0 50,20 Q30,40 10,20 Z M90,20 Q70,0 50,20 Q70,40 90,20 Z" fill="none" stroke="currentColor" stroke-width="2"/><circle cx="50" cy="20" r="10" fill="none" stroke="currentColor" stroke-width="2"/><text x="50" y="25" font-family="serif" font-size="14" fill="currentColor" text-anchor="middle" font-weight="bold">B</text></svg>', desc: 'Performance & Elegance', price: '40.000 ARS' },
    'Gold': { name: '🟡 Gold', logo: '<svg viewBox="0 0 64 64" fill="none" stroke="currentColor" stroke-width="3" width="100%"><circle cx="32" cy="32" r="28"/><path d="M32 4 L32 32 L10 46 M32 32 L54 46"/></svg>', desc: 'Executive Success & Status', price: '30.000 ARS' },
    'Silver': { name: '⚪ Silver', logo: '<svg viewBox="0 0 100 40" fill="none" stroke="currentColor" stroke-width="4" width="100%"><circle cx="26" cy="20" r="12"/><circle cx="42" cy="20" r="12"/><circle cx="58" cy="20" r="12"/><circle cx="74" cy="20" r="12"/></svg>', desc: 'Modern High-Tech Style', price: '20.000 ARS' },
    'Standard': { name: '🟤 Standard', logo: '<svg viewBox="0 0 64 64" fill="none" stroke="currentColor" stroke-width="4" width="100%"><ellipse cx="32" cy="32" rx="28" ry="18" /><ellipse cx="32" cy="32" rx="18" ry="7" /><ellipse cx="32" cy="20" rx="6" ry="12" /></svg>', desc: 'Everyday Functional Reliability', price: '15.000 ARS' },
    'Uncategorized': { name: 'Uncategorized', logo: '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" width="100%"><circle cx="12" cy="12" r="10"/><path d="M9.09 9a3 3 0 0 1 5.83 1c0 2-3 3-3 3"/><line x1="12" y1="17" x2="12.01" y2="17"/></svg>', desc: 'Needs Review', price: 'N/A' }
};

// --- Internationalization (i18n) ---
const translations = {
    'es': {
        // Landing Page
        'I am 18+ - Enter': 'Soy mayor de 18 - Entrar',
        'I AM +18 - ENTER': 'SOY MAYOR DE 18 - ENTRAR',
        'Entering...': 'Entrando...',
        'Uploading...': 'Subiendo...',
        'Exit': 'Salir',
        
        // General
        'Loading...': 'Cargando...',
        'All': 'Todos',
        'Select...': 'Seleccionar...',
        'Login': 'Iniciar Sesión',
        'Register': 'Registrarse',
        'Logout': 'Cerrar sesión',
        'Back': 'Volver',
        'Desktop: Click & Drag to scroll | Mobile: Swipe left/right': 'Escritorio: Clic y arrastrar | Móvil: Deslizar',
        'Upload Receipt': 'Subir recibo de pago (foto o archivo)',
        'Close': 'Cerrar',
        'Save Changes': 'Guardar Cambios',
        'Edit': 'Editar',
        'Edit Profile': 'Editar Perfil',
        'Phone Call': 'Llamada Telefónica',
        'Welcome to SexAppeal!': '¡Bienvenida a SexAppeal!',
        'You are now approved and ready to upload your personal photos. Note: The first photo will be treated as your profile Thumbnail. You can drag and drop photos below to change their order at any time.': 'Ya estás aprobada y lista para subir tus fotos personales. Nota: La primera foto será tu miniatura de perfil. Puedes arrastrar y soltar las fotos a continuación para cambiar su orden en cualquier momento.',
        'Unknown': 'Desconocido',
        'N/A': 'N/D',
        
        // Auth & Forms
        'Password': 'Contraseña',
        'Confirm Password': 'Confirmar Contraseña',
        'Forgot Password?': '¿Olvidaste tu contraseña?',
        'Reset Password': 'Restablecer Contraseña',
        'Email Address': 'Correo Electrónico',
        'Has own apartment': 'Tiene departamento propio',
        'Has fantasy wardrobe': 'Tiene vestuario de fantasía',
        'Submitting...': 'Enviando...',
        'Sending...': 'Enviando...',
        'Access Denied': 'Acceso Denegado',
        'Server connection error': 'Error de conexión con el servidor',
        'Registration failed': 'Error en el registro',
        'Invalid code': 'Código inválido',
        'Error sending code': 'Error enviando código',
        'Password reset successful!': '¡Contraseña restablecida con éxito!',
        'Reset failed': 'Error al restablecer',

        // Discovery / Treasures
        'Discover Our Treasures': 'Descubre Nuestros Tesoros',
        'Filter by quality and service, or browse the full collection below.': 'Filtra por calidad y servicio, o explora la colección completa a continuación.',
        'Filter by quality and service,': 'Filtra por calidad y servicio,',
        'or browse the full collection below.': 'o explora la colección completa a continuación.',
        'Load More Treasures': 'Cargar Más Tesoros',
        'No Treasures Found': 'No se encontraron Tesoros',
        'Filter Again': 'Filtrar de Nuevo',
        'View Full Profile': 'Ver Perfil Completo',
        'Contact on WhatsApp': 'Contactar por WhatsApp',
        'No professionals match your current selection.': 'Ningún profesional coincide con su selección actual.',
        'No professionals have been revealed yet. Please check back later.': 'Aún no se han revelado profesionales. Vuelve más tarde.',
        'No more treasures to show.': 'No hay más tesoros para mostrar.',
        'Filters': 'Filtros',
        'Controls / Filters': 'Controles / Filtros',
        
        // Treasure Details
        '🟢 Available Right Now': '🟢 Disponible Ahora Mismo',
        '🔴 Currently Inactive': '🔴 Actualmente Inactivo',
        'Specialties:': 'Especialidades:',
        'Location:': 'Ubicación:',
        'Measurements:': 'Medidas:',
        'Height:': 'Estatura:',
        'Schedule:': 'Horario:',
        'Hours:': 'Horas:',
        'Everyday': 'Todos los días',
        'Anytime': 'Cualquier horario',
        'No photos available.': 'No hay fotos disponibles.',
        'Could not find the specified treasure.': 'No se pudo encontrar el tesoro especificado.',
        'No treasure specified.': 'Ningún tesoro especificado.',
        'Error connecting to the vault:': 'Error al conectar con la bóveda:',
        'Please ensure the server is running.': 'Por favor asegúrese de que el servidor esté en ejecución.',
        
        // Locations
        'Province': 'Provincia',
        'All Provinces': 'Todas las Provincias',
        'Select Province': 'Seleccione Provincia',
        'City / Neighborhood': 'Ciudad / Barrio',
        'All Cities': 'Todas las Ciudades',
        'Select City': 'Seleccione Ciudad',
        'City...': 'Ciudad...',
        'Enter City': 'Ingrese Ciudad',
        'All Neighborhoods': 'Todos los Barrios',
        'Select Neighborhood': 'Seleccione Barrio',
        'Neighborhood': 'Barrio',
        'Neighborhood...': 'Barrio...',
        'Enter Neighborhood': 'Ingrese Barrio',
        
        // Specialties
        'Specialty': 'Especialidad',
        'All Specialties': 'Todas las Especialidades',
        'Massage': 'Masajes',
        'Virtual Connection': 'Conexión Virtual',
        'Love Alchemy': 'Alquimia de Amor',
        'Media Content': 'Contenido Multimedia',
        'Streaming Kisses': 'Besos en Streaming',
        
        // Qualities
        'Quality': 'Calidad',
        'All Qualities': 'Todas las Calidades',
        '⭐ Elite': '⭐ Élite',
        '✨ Premium': '✨ Premium',
        '🟡 Gold': '🟡 Oro',
        '⚪ Silver': '⚪ Plata',
        '🟤 Standard': '🟤 Estándar',
        'Uncategorized': 'Sin Categoría',
        'Peak Luxury & Royalty': 'Máximo Lujo y Realeza',
        'Performance & Elegance': 'Rendimiento y Elegancia',
        'Executive Success & Status': 'Éxito Ejecutivo y Estatus',
        'Modern High-Tech Style': 'Estilo Moderno y Tecnológico',
        'Everyday Functional Reliability': 'Confiabilidad Funcional Diaria',
        'Needs Review': 'Requiere Revisión',
        
        // Dashboard
        '(Dashboard)': '(Panel)',
        'Logged in as:': 'Conectado como:',
        'Connection Requests': 'Solicitudes de Conexión',
        'View Pending Requests': 'Ver Solicitudes Pendientes',
        'Verification Process': 'Proceso de Verificación',
        
        // Dynamic Text Blocks
        'Coming Soon:': 'Próximamente:',
        'Users will be able to post their experiences on our new community blog!': '¡Los usuarios podrán publicar sus experiencias en nuestro nuevo blog de la comunidad!',
        'Profile photos can only be uploaded after your account is approved.': 'Las fotos de perfil solo se pueden cargar después de que su cuenta sea aprobada.',
        'Connected in Duo mode.': 'Conectado en modo Dúo.',
        'Not currently in a Duo.': 'Actualmente no en un Dúo.',
        'To ensure the safety and authenticity of our community, a strict verification process is required. Please follow these steps:': 'Para garantizar la seguridad y autenticidad de nuestra comunidad, se requiere un estricto proceso de verificación. Siga estos pasos:',
        'Complete all required fields below to submit your registration.': 'Complete todos los campos obligatorios a continuación para enviar su registro.',
        'Upload a clear photo of your Government ID (Front and Back).': 'Suba una foto clara de su identificación oficial (Frente y Dorso).',
        'Upload a personal selfie holding your ID next to your face while performing this hand position:': 'Sube una selfie personal sosteniendo tu identificación junto a tu rostro mientras realizas esta posición de la mano:',
        '1 finger up ☝️': '1 dedo arriba ☝️',
        '2 fingers up ✌️': '2 dedos arriba ✌️',
        '3 fingers up 🖖': '3 dedos arriba 🖖',
        'Thumbs up 👍': 'Pulgares arriba 👍',
        'OK sign 👌': 'Señal de OK 👌',
        'Note: Profile photos can only be uploaded after your account is approved (which takes at least 48 hours).': 'Nota: Las fotos de perfil solo se pueden cargar después de que su cuenta sea aprobada (lo cual demora al menos 48 horas).',
        'Submit Form': 'Enviar Formulario',
        'Save Draft': 'Guardar Borrador',
        
        // Admin / Modals
        'Edit Pricing': 'Editar Precios',
        'Edit Category Pricing': 'Editar Precios por Categoría',
        'Save Pricing': 'Guardar Precios',
        'These monthly values are used by the billing engine to calculate invoices for professionals.': 'Estos valores mensuales son utilizados por el motor de facturación para calcular las facturas de los profesionales.',
        'pending': 'pendiente',
        'approved': 'aprobado',
        'rejected': 'rechazado',
        'contacted': 'contactado',
        'Professionals Directory': 'Directorio de Profesionales',
        'Filter': 'Filtrar',
        'No professionals match your filters.': 'Ningún profesional coincide con tus filtros.',
        'Admin Menu': 'Menú de Admin',
        'Professional Profiles': 'Perfiles de Profesionales',
        'Pending Approvals': 'Aprobaciones Pendientes',
        'Dashboard Config': 'Configuración del Panel',
        'Notifications': 'Notificaciones',
        'Mail': 'Correo',
        'Special Messages': 'Mensajes Especiales',
        'Broadcast Messages': 'Mensajes Masivos',
        'Traces': 'Rastros',
        'Guest Traffic': 'Tráfico de Invitados',
        'Treasures Steps': 'Pasos de Tesoros',
        'System': 'Sistema',
        'View Activity Logs': 'Ver Registros de Actividad',
        'View Scraped Leads': 'Ver Prospectos',
        'Pending Connection Requests': 'Solicitudes de Conexión Pendientes',
        'Date': 'Fecha',
        'Requester': 'Solicitante',
        'Message': 'Mensaje',
        'Actions': 'Acciones',
        'Accept': 'Aceptar',
        'Decline': 'Rechazar',
        'No pending requests.': 'No hay solicitudes pendientes.',
        'Activity Logs': 'Registros de Actividad',
        'Filter Action...': 'Filtrar Acción...',
        'Filter IP...': 'Filtrar IP...',
        'Filter User Agent...': 'Filtrar Navegador...',
        'Apply Filters': 'Aplicar Filtros',
        'Clear': 'Limpiar',
        'Professional': 'Profesional',
        'Action': 'Acción',
        'IP Address': 'Dirección IP',
        'User Agent': 'Navegador',
        'No logs found.': 'No se encontraron registros.',
        'Scraped Phone Leads': 'Prospectos Telefónicos Extraídos',
        'Refresh List': 'Actualizar Lista',
        'Date Added': 'Fecha Agregado',
        'Phone Number': 'Número de Teléfono',
        'Source': 'Fuente',
        'Status': 'Estado',
        'No leads found.': 'No se encontraron prospectos.',
        'Pending Verifications': 'Verificaciones Pendientes',
        'Email': 'Correo Electrónico',
        'Alias': 'Alias',
        'Documents': 'Documentos',
        'Submitted On': 'Enviado El',
        'Approve': 'Aprobar',
        'Reject': 'Rechazar',
        'No pending verifications.': 'No hay verificaciones pendientes.',
        'Send Broadcast Email': 'Enviar Correo Masivo',
        'Audience': 'Audiencia',
        'All Professionals': 'Todos los Profesionales',
        'Approved Professionals Only': 'Solo Profesionales Aprobados',
        'Subject': 'Asunto',
        'Send Broadcast': 'Enviar Masivo',
        'Select a Professional to Edit': 'Seleccione un Profesional para Editar',
        'Search by Alias...': 'Buscar por Alias...',
        'Search': 'Buscar',
        'No professionals found.': 'No se encontraron profesionales.',
        'Back to List': 'Volver a la Lista',
        'Verification Status': 'Estado de Verificación',
        'Quality': 'Calidad',
        'Bio': 'Biografía',
        'Start Time (HH:mm)': 'Hora Inicio (HH:mm)',
        'End Time (HH:mm)': 'Hora Fin (HH:mm)',
        'Working Days (comma separated)': 'Días Laborales (separados por comas)',
        'Visibility / Exposure': 'Visibilidad / Exposición',
        'Show in public directory (active)': 'Mostrar en directorio público (activo)',
        'WhatsApp Number': 'Número de WhatsApp',
        'Manage Photos': 'Administrar Fotos',
        
        // Notifications & Welcome
        'Notifications & Pending Items': 'Notificaciones y Elementos Pendientes',
        'No pending actions at this time.': 'No hay acciones pendientes en este momento.',
        'Welcome Guide & How It Works': 'Guía de Bienvenida y Cómo Funciona',
        'Privacy Guarantee:': 'Garantía de Privacidad:',
        'Visibility Control:': 'Control de Visibilidad:',
        'Uploading Photos:': 'Subida de Fotos:',
        'WhatsApp Connections:': 'Conexiones por WhatsApp:',
        'Profile Tiers:': 'Niveles de Perfil:',
        'Dismiss': 'Ocultar',
        
        // Privacy Shield
        '100% Privacy Guarantee': 'Garantía de Privacidad 100%',
        'Zero Trackers. Cookieless.': 'Cero Rastreadores. Sin Cookies.',
        "Zero cookies. Zero third-party trackers. We don't harvest your data. Check your own browser's tracker-blocker to verify and compare us with other apps.": "Cero cookies. Cero rastreadores de terceros. No recopilamos sus datos. Revise el bloqueador de rastreadores de su propio navegador para verificar y compararnos con otras apps."
    }
};

const currentLang = localStorage.getItem('platform_lang') || 'en';

function t(text) {
    if (currentLang === 'en') return text;
    return translations['es'][text] || text;
}

let esRegexList = null;

function applyStaticTranslations(rootNode = document.body) {
    if (currentLang === 'en') return;
    
    if (!esRegexList) {
        const keys = Object.keys(translations['es']).sort((a, b) => b.length - a.length);
        esRegexList = keys.map(key => {
            // Escape regex, then replace any spaces with \s+ to handle weird formatting/newlines
            const pattern = key.split(/\s+/).map(word => word.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')).join('\\s+');
            let finalPattern = pattern;
            if (/^\w/.test(key)) finalPattern = '\\b' + finalPattern;
            if (/\w$/.test(key)) finalPattern = finalPattern + '\\b';
            return { key, regex: new RegExp(finalPattern, 'gi') };
        });
    }
    
    // Walk DOM to translate text nodes
    const walk = document.createTreeWalker(rootNode, NodeFilter.SHOW_TEXT, null, false);
    let node;
    const nodesToReplace = [];
    
    while (node = walk.nextNode()) {
        let text = node.nodeValue;
        if (!text.trim()) continue;
        
        // Normalize all tabs, spaces, and newlines into a single space
        const normalizedText = text.replace(/\s+/g, ' ').trim();
        
        if (translations['es'][normalizedText]) {
            nodesToReplace.push({ node, newText: text.replace(text.trim(), translations['es'][normalizedText]) });
        } else if (translations['es'][text.trim()]) {
            nodesToReplace.push({ node, newText: text.replace(text.trim(), translations['es'][text.trim()]) });
        } else {
            let updatedText = text;
            let changed = false;
            for (const { key, regex } of esRegexList) {
                const newText = updatedText.replace(regex, translations['es'][key]);
                if (newText !== updatedText) {
                    updatedText = newText;
                    changed = true;
                }
            }
            if (changed) {
                nodesToReplace.push({ node, newText: updatedText });
            }
        }
    }
    
    nodesToReplace.forEach(item => {
        item.node.nodeValue = item.newText;
    });
    
    // Translate input values and buttons
    const inputs = rootNode.querySelectorAll ? rootNode.querySelectorAll('input[type="button"], input[type="submit"]') : [];
    inputs.forEach(input => {
        if (input.value) {
            const norm = input.value.replace(/\s+/g, ' ').trim();
            if (translations['es'][norm]) {
                input.value = translations['es'][norm];
            } else if (translations['es'][input.value.trim()]) {
                input.value = translations['es'][input.value.trim()];
            } else {
                let text = input.value;
                let changed = false;
                for (const { key, regex } of esRegexList) {
                    const newText = text.replace(regex, translations['es'][key]);
                    if (newText !== text) {
                        text = newText;
                        changed = true;
                    }
                }
                if (changed) input.value = text;
            }
        }
    });

    // Translate placeholders
    const placeholders = rootNode.querySelectorAll ? rootNode.querySelectorAll('input[placeholder]') : [];
    placeholders.forEach(input => {
        if (input.placeholder) {
            const norm = input.placeholder.replace(/\s+/g, ' ').trim();
            if (translations['es'][norm]) {
                input.placeholder = translations['es'][norm];
            } else if (translations['es'][input.placeholder.trim()]) {
                input.placeholder = translations['es'][input.placeholder.trim()];
            } else {
                let text = input.placeholder;
                let changed = false;
                for (const { key, regex } of esRegexList) {
                    const newText = text.replace(regex, translations['es'][key]);
                    if (newText !== text) {
                        text = newText;
                        changed = true;
                    }
                }
                if (changed) input.placeholder = text;
            }
        }
    });
}

// --- Inject Global Dynamic Styles ---
(function injectGlobalStyles() {
    if (!document.getElementById('sexappeal-global-styles')) {
        const style = document.createElement('style');
        style.id = 'sexappeal-global-styles';
        style.textContent = `
            .fileteado-section {
                transition: box-shadow 0.4s ease;
            }
            .fileteado-section:hover {
                box-shadow: 0 0 25px rgba(212, 175, 55, 0.25), inset 0 0 15px rgba(212, 175, 55, 0.15);
            }
        `;
        document.head.appendChild(style);
        
        const adminStyles = document.createElement('style');
        adminStyles.textContent = `
            .admin-nav-btn {
                width: 100%; padding: 10px 15px; background: transparent; border: 1px solid transparent;
                color: #ccc; text-align: left; border-radius: 6px; cursor: pointer;
                transition: all 0.2s ease; font-size: 0.95rem;
            }
            .admin-nav-btn:hover {
                background: rgba(255, 255, 255, 0.05); color: white;
            }
            .admin-nav-btn.active-nav {
                background: rgba(212, 175, 55, 0.15); color: var(--primary-gold);
                border: 1px solid rgba(212, 175, 55, 0.3);
            }
        `;
        document.head.appendChild(adminStyles);
    }
})();

// --- Plausible Analytics (Zero-Cookie, Privacy First) ---
(function injectPlausible() {
    /* Temporarily disabled until analytics.drsrv.net.ar DNS is configured
    const script = document.createElement('script');
    script.defer = true;
    script.setAttribute('data-domain', 'sexappeal.drsrv.net.ar');
    script.src = 'https://analytics.drsrv.net.ar/js/script.tagged-events.js';
    document.head.appendChild(script);
    */

    // Initialize custom event tracker array
    window.plausible = window.plausible || function() { (window.plausible.q = window.plausible.q || []).push(arguments) };
})();

let currentGalleryPhotos = [];
let currentDiscoveryPage = 1;

function initGlobalTopBar() {
    if (document.getElementById('globalTopBar')) return;

    const topBar = document.createElement('div');
    topBar.id = 'globalTopBar';
    Object.assign(topBar.style, {
        position: 'fixed', top: '0', left: '0', width: '100%', height: '55px',

        backgroundColor: 'transparent', backdropFilter: 'none', WebkitBackdropFilter: 'none',
        borderBottom: '1px solid transparent',
        zIndex: '9999', display: 'flex', justifyContent: 'space-between', alignItems: 'center',
        padding: '0 20px', boxSizing: 'border-box', fontFamily: 'sans-serif',
        transition: 'background-color 0.3s ease, border-bottom-color 0.3s ease, backdrop-filter 0.3s ease, -webkit-backdrop-filter 0.3s ease'
    });

    window.addEventListener('scroll', () => {
        if (window.scrollY > 20) {
            topBar.style.backgroundColor = 'rgba(10, 10, 10, 0.95)';
            topBar.style.backdropFilter = 'blur(15px)';
            topBar.style.WebkitBackdropFilter = 'blur(15px)';
            topBar.style.borderBottomColor = 'rgba(212, 175, 55, 0.8)';
        } else {
            topBar.style.backgroundColor = 'transparent';
            topBar.style.backdropFilter = 'none';
            topBar.style.WebkitBackdropFilter = 'none';
            topBar.style.borderBottomColor = 'transparent';
        }
    });

    if (!document.getElementById('topBarMobileStyles')) {
        const style = document.createElement('style');
        style.id = 'topBarMobileStyles';
        style.textContent = `
            @media (max-width: 600px) {
                #globalTopBar { padding: 0 5px !important; }
                .brand-text { display: none !important; }
                .brand-logo svg { margin-right: 5px !important; height: 22px !important; width: 22px !important; }
                #globalTopBar button, #globalTopBar a { padding: 4px 6px !important; font-size: 0.75rem !important; }
                .user-info-text { display: none !important; }
                .left-group-back { margin-right: 5px !important; }
            }
        `;
        document.head.appendChild(style);
    }

    const userInfo = document.createElement('div');
    userInfo.style.color = 'white';
    userInfo.style.fontSize = '0.9rem';
    userInfo.style.display = 'flex';
    userInfo.style.alignItems = 'center';
    
    let userDisplay = '';
    const userString = localStorage.getItem('user');
    let isLoggedIn = false;
    if (userString) {
        try {
            const user = JSON.parse(userString);
            let nameToShow = user.name || user.email || 'Guest';
            if (user.role === 'professional' && user.professionalProfile?.alias) {
                nameToShow = user.professionalProfile.alias;
            }
            userDisplay = `<span class="user-info-text">User: </span><strong style="color: var(--primary-gold);">${nameToShow}</strong>`;
            
            if (user.role === 'professional') {
                 userDisplay += `<a href="/profDashboard.html" style="color: var(--dark-bg); background-color: var(--primary-gold); margin-left: 10px; text-decoration: none; font-size: 0.8rem; font-weight: bold; padding: 3px 8px; border-radius: 4px;">✏️ ${t('Edit Profile')}</a>`;
            } else if (user.role === 'admin') {
                 userDisplay += `<a href="/dashboard.html" style="color: #ccc; margin-left: 10px; text-decoration: none; font-size: 0.8rem;">${t('Admin Menu')}</a>`;
            }
            isLoggedIn = true;
        } catch (e) { console.error('Failed to parse user', e); }
    }
    userInfo.innerHTML = userDisplay;

    if (isLoggedIn) {
        const topLogoutBtn = document.createElement('a');
        topLogoutBtn.href = '#';
        topLogoutBtn.innerHTML = t('Logout');
        Object.assign(topLogoutBtn.style, {
            color: 'var(--accent-red)',
            marginLeft: '15px',
            textDecoration: 'none',
            fontSize: '0.8rem',
            fontWeight: 'bold'
        });
        topLogoutBtn.addEventListener('click', async (e) => {
            e.preventDefault();
            try {
                const token = localStorage.getItem('token');
                if (token) {
                    // Added credentials: 'include' to ensure auth cookie is sent
                    await fetch(`${API_URL}/auth/logout`, { 
                        method: 'POST',
                        headers: { 'Authorization': `Bearer ${token}` },
                        credentials: 'include'
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
        userInfo.appendChild(topLogoutBtn);
    }

    const rightGroup = document.createElement('div');
    rightGroup.style.display = 'flex';
    rightGroup.style.alignItems = 'center';
    rightGroup.style.gap = '15px';

    const langBtn = document.createElement('button');
    langBtn.innerHTML = currentLang === 'en' ? '<span title="Cambiar a Español">🇪🇸 ES</span>' : '<span title="Switch to English">🇺🇸 EN</span>';
    langBtn.innerHTML = currentLang === 'en' ? '<span title="Cambiar a Español" style="display: flex; align-items: center;"><img src="https://flagcdn.com/w40/ar.png" width="24" alt="Argentina" style="border-radius: 2px;"></span>' : '<span title="Switch to English" style="display: flex; align-items: center;"><img src="https://flagcdn.com/w40/us.png" width="24" alt="USA" style="border-radius: 2px;"></span>';
    Object.assign(langBtn.style, {
        background: 'transparent', border: '1px solid white', borderRadius: '4px',
        color: 'white', cursor: 'pointer', fontSize: '0.85rem', fontWeight: 'bold',
        padding: '4px 8px', transition: 'all 0.3s ease'
    });

    langBtn.addEventListener('mouseover', () => langBtn.style.background = 'rgba(255, 255, 255, 0.1)');
    langBtn.addEventListener('mouseout', () => langBtn.style.background = 'transparent');
    langBtn.addEventListener('click', () => {
        localStorage.setItem('platform_lang', currentLang === 'en' ? 'es' : 'en');
        window.location.reload();
    });

    if (!isLoggedIn) {
        const authLinks = document.createElement('div');
        authLinks.style.display = 'flex';
        authLinks.style.gap = '8px';
        authLinks.style.fontSize = '0.85rem';
        authLinks.style.fontWeight = 'bold';
        
        const loginLink = document.createElement('a');
        loginLink.href = 'login.html';
        loginLink.textContent = t('Login');
        loginLink.style.color = 'var(--primary-gold)';
        loginLink.style.textDecoration = 'none';
        
        const registerLink = document.createElement('a');
        registerLink.href = 'register.html';
        registerLink.textContent = t('Register');
        registerLink.style.color = '#ccc';
        registerLink.style.textDecoration = 'none';

        authLinks.appendChild(loginLink);
        const sep = document.createElement('span');
        sep.textContent = '/';
        sep.style.color = '#666';
        authLinks.appendChild(sep);
        authLinks.appendChild(registerLink);
        
        rightGroup.appendChild(authLinks);
    }

    rightGroup.appendChild(langBtn);

    const leftGroup = document.createElement('div');
    leftGroup.style.display = 'flex';
    leftGroup.style.alignItems = 'center';

    const pageSegment = window.location.pathname.split('/').pop();
    const currentPage = (pageSegment === '' || pageSegment === '/') ? 'index.html' : pageSegment;
    
    if (currentPage !== 'index.html') {
        const backBtn = document.createElement('button');
        backBtn.className = 'left-group-back';
        backBtn.innerHTML = '&#8592; ' + t('Back');
        Object.assign(backBtn.style, {
            background: 'transparent', border: '1px solid white', borderRadius: '4px',
            color: 'white', cursor: 'pointer', fontSize: '0.85rem', fontWeight: 'bold',
            padding: '4px 8px', transition: 'all 0.3s ease', marginRight: '15px'
        });
        backBtn.addEventListener('mouseover', () => backBtn.style.background = 'rgba(255, 255, 255, 0.1)');
        backBtn.addEventListener('mouseout', () => backBtn.style.background = 'transparent');
        backBtn.onclick = () => window.history.back();
        leftGroup.appendChild(backBtn);
    }

    const brandLogo = document.createElement('div');
    brandLogo.className = 'brand-logo';
    brandLogo.innerHTML = `
        <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="white" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" style="height: 28px; width: 28px; margin-right: 10px; border-radius: 4px; padding: 2px;">
            <path d="M20.84 4.61a5.5 5.5 0 0 0-7.78 0L12 5.67l-1.06-1.06a5.5 5.5 0 0 0-7.78 7.78l1.06 1.06L12 21.23l7.78-7.78 1.06-1.06a5.5 5.5 0 0 0 0-7.78z"></path>
        </svg>
        <span class="brand-text" style="font-family: 'Playfair Display', serif; font-weight: 900; letter-spacing: 1px; color: white;">SexAppeal</span>
    `;
    brandLogo.style.display = 'flex';
    brandLogo.style.alignItems = 'center';
    brandLogo.style.fontSize = '1.2rem';
    brandLogo.style.marginRight = '15px';
    brandLogo.style.cursor = 'pointer';
    brandLogo.onclick = () => window.location.href = '/index.html';

    leftGroup.appendChild(brandLogo);
    leftGroup.appendChild(userInfo);

    topBar.appendChild(leftGroup);
    topBar.appendChild(rightGroup);

    document.body.prepend(topBar);
    document.body.style.paddingTop = '45px'; // Adjust body padding to avoid overlapping content
}

// --- Privacy Shield Badge ---
function initPrivacyShield() {
    if (document.getElementById('privacyShield')) return;

    const shield = document.createElement('div');
    shield.id = 'privacyShield';
    Object.assign(shield.style, {
        position: 'fixed', bottom: '20px', left: '20px',
        backgroundColor: 'rgba(10, 10, 10, 0.95)', border: '1px solid var(--primary-gold)',
        borderRadius: '8px', padding: '10px 15px', display: 'flex', alignItems: 'center',
        gap: '12px', zIndex: '9000', boxShadow: '0 4px 15px rgba(0,0,0,0.8)',
        cursor: 'pointer', transition: 'all 0.3s ease', maxWidth: '240px',
        backdropFilter: 'blur(5px)', WebkitBackdropFilter: 'blur(5px)'
    });

    shield.innerHTML = `
        <div style="flex-shrink: 0;">
            <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="var(--primary-gold)" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
                <path d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10z"></path>
                <polyline points="9 12 11 14 15 10"></polyline>
            </svg>
        </div>
        <div style="font-family: sans-serif; font-size: 0.8rem; color: #ccc; line-height: 1.3; overflow: hidden;">
            <strong style="color: var(--primary-gold); display: block; margin-bottom: 3px; font-size: 0.85rem;">${t('100% Privacy Guarantee')}</strong>
            <span class="shield-text" style="display: none;">${t("Zero cookies. Zero third-party trackers. We don't harvest your data. Check your own browser's tracker-blocker to verify and compare us with other apps.")}</span>
            <span class="shield-preview">${t('Zero Trackers. Cookieless.')}</span>
        </div>
    `;

    const expand = () => {
        shield.querySelector('.shield-text').style.display = 'inline';
        shield.querySelector('.shield-preview').style.display = 'none';
        shield.style.maxWidth = '350px';
    };
    const collapse = () => {
        shield.querySelector('.shield-text').style.display = 'none';
        shield.querySelector('.shield-preview').style.display = 'inline';
        shield.style.maxWidth = '240px';
    };

    shield.addEventListener('mouseenter', expand);
    shield.addEventListener('mouseleave', collapse);
    shield.addEventListener('click', () => {
        if (shield.querySelector('.shield-text').style.display === 'none') expand();
        else collapse();
    });

    document.body.appendChild(shield);
}

// --- Google Auth Injection ---
function injectGoogleLogin(container) {
    if (!container) return;
    
    if (!document.getElementById('google-jssdk')) {
        const script = document.createElement('script');
        script.id = 'google-jssdk';
        script.src = 'https://accounts.google.com/gsi/client';
        script.async = true;
        script.defer = true;
        document.head.appendChild(script);
    }

    const wrapper = document.createElement('div');
    wrapper.id = 'googleSignInWrapper';
    wrapper.style.marginBottom = '20px';
    wrapper.style.display = 'flex';
    wrapper.style.justifyContent = 'center';
    
    container.parentNode.insertBefore(wrapper, container);

    window.handleGoogleCallback = async (response) => {
        try {
            const res = await fetch(`${API_URL}/auth/google`, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ token: response.credential })
            });
            const data = await res.json();
            if (data.success) {
                localStorage.setItem('token', data.token);
                localStorage.setItem('is18Plus', 'true');
                sessionStorage.setItem('valid_entry', 'true');
                if (data.user) localStorage.setItem('user', JSON.stringify(data.user));
                
                let intended = sessionStorage.getItem('intended_destination');
                sessionStorage.removeItem('intended_destination');

                // Prevent regular users from being forced into the dashboard by a stale intended_destination
                if (intended && intended.includes('dashboard.html') && data.user.role === 'user') {
                    intended = null;
                }

                if (intended) {
                    window.location.href = intended;
                } else if (data.user.role === 'professional') {
                    window.location.href = '/perfil/' + encodeURIComponent(data.user.professionalProfile?.alias || '');
                    window.location.href = '/perfil/' + encodeURIComponent(data.user.professionalProfile?.alias || '');
                    window.location.href = '/perfil/' + encodeURIComponent(data.user.professionalProfile?.alias || '');
                } else if (data.user.role === 'admin') {
                    window.location.href = '/dashboard.html';
                } else {
                    window.location.href = '/categories.html';
                }
            } else {
                showAlert(document.getElementById('loginAlert'), data.error || 'Google login failed');
            }
        } catch (err) {
            showAlert(document.getElementById('loginAlert'), 'Server connection error');
        }
    };

    const checkGoogle = setInterval(() => {
        if (window.google) {
            clearInterval(checkGoogle);
            window.google.accounts.id.initialize({
                client_id: 'YOUR_GOOGLE_CLIENT_ID_HERE.apps.googleusercontent.com', // MUST REPLACE THIS
                callback: window.handleGoogleCallback
            });
            window.google.accounts.id.renderButton(
                document.getElementById('googleSignInWrapper'),
                { theme: 'outline', size: 'large', width: container.offsetWidth || 300 }
            );
        }
    }, 100);
}

// --- Auth Handling ---

// Aggressive Click Interceptor for the Landing Page
// Runs in the "Capture" phase to override ANY inline onclick attributes (e.g. onclick="window.location...")
// that might be redirecting the page before the JS age-gate token is safely saved.
document.addEventListener('click', (e) => {
    const path = window.location.pathname;
    if (path.endsWith('/') || path.endsWith('index.html')) {
        let btn = e.target.closest('button, a, [class*="btn"], [id*="btn"], [onclick]');
        
        // Fallback: Catch clicks on custom text wrappers like <div>I AM +18 - ENTER</div>
        if (!btn && e.target.textContent) {
            const t = e.target.textContent.toLowerCase();
            if (t.includes('18') || t.includes('enter') || t.includes('entrar')) {
                btn = e.target;
            }
        }

        if (!btn) return;

        const text = (btn.textContent || '').toLowerCase();
        const href = (btn.getAttribute('href') || '').toLowerCase();
        const onclickAttr = (btn.getAttribute('onclick') || '').toLowerCase();
        
        // Explicitly ignore Login and Register links so they continue to work natively
        if (href.includes('login') || href.includes('register') || text.includes('login') || text.includes('register') || text.includes('iniciar') || text.includes('registrarse')) {
            return;
        }

        const isEnterBtn = btn.id === 'btn-enter' || btn.id === 'btn-18-plus' || btn.id === 'btn-18' ||
                           text.includes('18') || text.includes('enter') || text.includes('entrar') || text.includes('i am +18') ||
                           href.includes('categories.html') || onclickAttr.includes('categories.html') || onclickAttr.includes('location.href');
                           
        if (isEnterBtn) {
            e.preventDefault();
            e.stopImmediatePropagation(); // Crucial: Stops any inline HTML onclick from firing

            if (window.location.protocol === 'file:') {
                alert(`ERROR: You must open the site via a local server (e.g., ${BASE_ORIGIN}). The buttons will not work if you double-click the HTML file!`);
                return;
            }

            // Only alter text if the button isn't exclusively an image/SVG
            if (!btn.innerHTML.includes('<img') && !btn.innerHTML.includes('<svg')) {
                btn.textContent = t('Entering...');
            }
            btn.style.pointerEvents = 'none';
            btn.style.opacity = '0.7';

            localStorage.setItem('is18Plus', 'true');
            sessionStorage.setItem('ancestor_code', 'index.html');
            sessionStorage.setItem('valid_entry', 'true');

            const intended = sessionStorage.getItem('intended_destination');
            if (intended) {
                sessionStorage.removeItem('intended_destination');
                window.location.href = intended;
            } else {
                const targetUrl = (btn.getAttribute('href') && btn.getAttribute('href') !== '#' && !href.startsWith('javascript')) ? btn.getAttribute('href') : 'categories.html';
                window.location.href = targetUrl;
            }
        }
        
        const isExitBtn = btn.id === 'btn-exit' || text.includes('exit') || text.includes('salir') || href.includes('google.com');
        if (isExitBtn) {
            e.preventDefault();
            e.stopImmediatePropagation();
            window.location.href = 'https://www.google.com';
        }
    }
}, true); // <-- The "true" makes it a Capture Phase listener

document.addEventListener('DOMContentLoaded', () => {
    // Login
    const loginForm = document.getElementById('loginForm');
    if (loginForm) {
        // Create and inject the blog reminder message
    const blogReminder = document.createElement('div');
    blogReminder.innerHTML = `
        <p style="text-align: center; color: var(--primary-gold); background-color: rgba(212, 175, 55, 0.1); padding: 10px; border-radius: 4px; border: 1px solid var(--primary-gold); margin-bottom: 20px;">
            <strong>Coming Soon:</strong> Users will be able to post their experiences on our new community blog!
        </p>
    `;
    // Insert the reminder before the login form itself
    loginForm.parentNode.insertBefore(blogReminder, loginForm);

        // Inject Google SSO button
        injectGoogleLogin(loginForm);

    loginForm.addEventListener('submit', async (e) => {
        e.preventDefault();
        const email = document.getElementById('email').value.trim();
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
                localStorage.setItem('is18Plus', 'true');
                sessionStorage.setItem('valid_entry', 'true');
                if (data.user) localStorage.setItem('user', JSON.stringify(data.user));
                
                let intended = sessionStorage.getItem('intended_destination');
                sessionStorage.removeItem('intended_destination');

                // Prevent regular users from being forced into the dashboard by a stale intended_destination
                if (intended && intended.includes('dashboard.html') && data.user.role === 'user') {
                    intended = null;
                }

                if (intended) {
                    window.location.href = intended;
                } else if (data.user.role === 'professional') {
                    window.location.href = '/profDashboard.html';
                } else if (data.user.role === 'admin') {
                    window.location.href = '/dashboard.html';
                } else {
                    window.location.href = '/categories.html';
                }
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
});

// Register
const registerForm = document.getElementById('registerForm');
if (registerForm) {
  registerForm.addEventListener('submit', async (e) => {
    e.preventDefault();
    const alert = document.getElementById('registerAlert');
    const submitBtn = e.target.querySelector('button[type="submit"]');
    const originalBtnText = submitBtn.textContent;
    submitBtn.disabled = true;
    submitBtn.textContent = 'Submitting...';
    const formData = new FormData();

    // Append all form fields
    formData.append('role', 'professional');
    formData.append('email', document.getElementById('regEmail').value.trim());
    formData.append('password', document.getElementById('regPassword').value);
    formData.append('alias', document.getElementById('regAlias').value);
    formData.append('bio', document.getElementById('regBio').value);
    formData.append('hasOwnApartment', document.getElementById('regOwnApartment')?.checked || false);
    formData.append('hasFantasyWardrobe', document.getElementById('regFantasyWardrobe')?.checked || false);
    formData.append('province', document.getElementById('regProvince').value);
    formData.append('city', document.getElementById('regCity').value);
    formData.append('neighborhood', document.getElementById('regNeighborhood').value);
    formData.append('measurements', document.getElementById('regMeasurements').value);
    formData.append('height', document.getElementById('regHeight').value);
    
    formData.append('firstName', document.getElementById('regFirstName')?.value || '');
    formData.append('lastName', document.getElementById('regLastName')?.value || '');
    formData.append('birthDate', document.getElementById('regBirthDate')?.value || '');
    formData.append('street', document.getElementById('regStreet')?.value || '');
    formData.append('number', document.getElementById('regStreetNumber')?.value || '');
    formData.append('floor', document.getElementById('regFloor')?.value || '');
    formData.append('apartment', document.getElementById('regApartment')?.value || '');
    formData.append('postalCode', document.getElementById('regPostCode')?.value || '');
    formData.append('mobilePhone', document.getElementById('regMobilePhone')?.value || '');
    formData.append('instagram', document.getElementById('regInstagram')?.value || '');
    formData.append('facebook', document.getElementById('regFacebook')?.value || '');
    formData.append('quality', document.getElementById('regQuality')?.value || 'Standard');

    const servicesEl = document.getElementById('regServices');
    let servicesVal = '';
    if (servicesEl) {
        if (servicesEl.tagName === 'SELECT') {
            servicesVal = Array.from(servicesEl.selectedOptions).map(opt => opt.value).join(',');
        } else {
            servicesVal = servicesEl.value;
        }
    }
    formData.append('services', servicesVal);

    // Append verification document files
    const idPhotoFront = document.getElementById('regIdPhotoFront')?.files[0];
    const idPhotoBack = document.getElementById('regIdPhotoBack')?.files[0];
    const selfiePhoto = document.getElementById('regSelfiePhoto')?.files[0];

    if (idPhotoFront) formData.append('verificationDocuments', idPhotoFront);
    if (idPhotoBack) formData.append('verificationDocuments', idPhotoBack);
    if (selfiePhoto) formData.append('verificationDocuments', selfiePhoto);
    if (e.target.dataset.gestureCode) formData.append('verificationGesture', e.target.dataset.gestureCode);

    try {
      const res = await fetch(`${API_URL}/auth/register`, {
        method: 'POST',
        body: formData // Let the browser set the Content-Type for multipart/form-data
      });
      const data = await res.json();
      if (data.success) {
        window.location.href = `verify.html?email=${encodeURIComponent(document.getElementById('regEmail').value)}`;
      } else {
        showAlert(alert, data.error || 'Registration failed');
      }
    } catch (err) {
      showAlert(alert, 'Server connection error');
    } finally {
      submitBtn.disabled = false;
      submitBtn.textContent = originalBtnText;
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
        const email = (emailInput && emailInput.value) ? emailInput.value.trim() : new URLSearchParams(window.location.search).get('email');
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
                localStorage.setItem('is18Plus', 'true');
                sessionStorage.setItem('valid_entry', 'true');
                if (data.user) localStorage.setItem('user', JSON.stringify(data.user));
                
                let intended = sessionStorage.getItem('intended_destination');
                sessionStorage.removeItem('intended_destination');

                // Prevent regular users from being forced into the dashboard by a stale intended_destination
                if (intended && intended.includes('dashboard.html') && data.user.role === 'user') {
                    intended = null;
                }

                if (intended) {
                    window.location.href = intended;
                } else if (data.user.role === 'professional') {
                    window.location.href = '/profDashboard.html';
                } else if (data.user.role === 'admin') {
                    window.location.href = '/dashboard.html';
                } else {
                    window.location.href = '/categories.html';
                }
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
        const email = document.getElementById('forgotEmail').value.trim();
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
        const email = document.getElementById('resetEmail').value.trim();
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
                    headers: { 
                        'Authorization': `Bearer ${token}`
                    },
                    credentials: 'include'
                });
            }
        } catch (err) {
            console.error('Logout error:', err);
        } finally {
            document.cookie = "token=; expires=Thu, 01 Jan 1970 00:00:00 UTC; path=/;";
            localStorage.removeItem('token');
            localStorage.removeItem('user');
            localStorage.removeItem('is18Plus');
            // Added credentials: 'include' to ensure auth cookie is sent
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
            .treasure-img-container { margin: -15px -15px 15px -15px; overflow: hidden; border-radius: 4px 4px 0 0; aspect-ratio: 1/1; position: relative; }
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
    
    let province = urlParams.get('province');
    
    const city = urlParams.get('city');
    const neighborhood = urlParams.get('neighborhood');

    let url;
    const limit = 12; // Prevent Base64 payload overload

    url = new URL(`${API_URL}/professionals`);
    if (specialty && specialty.trim()) url.searchParams.set('specialty', specialty);
    if (quality && quality.trim()) url.searchParams.set('quality', quality);
    if (province && province.trim()) url.searchParams.set('province', province);
    if (city && city.trim()) url.searchParams.set('city', city);
    if (neighborhood && neighborhood.trim()) url.searchParams.set('neighborhood', neighborhood);

    url.searchParams.set('page', page);
    url.searchParams.set('limit', limit);

    // Add a cache-busting parameter to ensure fresh data is always fetched
    url.searchParams.set('_', new Date().getTime());

    try {
        const res = await fetch(url);
        if (!res.ok) {
            throw new Error(`Server returned status ${res.status}`);
        }
        
        let data = await res.json();

        if (data.success && data.data.length > 0) {
            if (!append) {
                grid.innerHTML = '';
            }
            
            // Remove the main 'grid' class to allow stacking of our categorized sections
            grid.classList.remove('grid');

            // Group data by quality (Insertion order here guarantees display order)
            const categories = { 'Elite': [], 'Premium': [], 'Gold': [], 'Silver': [], 'Standard': [] };
            
            data.data.forEach(treasure => {
                const q = treasure.professionalProfile?.quality || 'Standard';
                if (categories[q]) {
                    categories[q].push(treasure);
                } else {
                    categories['Standard'].push(treasure);
                }
            });
            
            let loggedInProfId = null;
            try {
                const uStr = localStorage.getItem('user');
                if (uStr) {
                    const u = JSON.parse(uStr);
                    if (u.role === 'professional') loggedInProfId = u._id;
                }
            } catch(e) {}

            for (const [cat, items] of Object.entries(categories)) {
                if (items.length === 0) continue;

                // Fisher-Yates shuffle for true randomization on page load per quality tier
                for (let i = items.length - 1; i > 0; i--) {
                    const j = Math.floor(Math.random() * (i + 1));
                    [items[i], items[j]] = [items[j], items[i]];
                }

                let catSection = document.getElementById(`cat-section-${cat}`);
                let innerGrid;

                if (!catSection) {
                    const meta = CATEGORY_META[cat];
                    catSection = document.createElement('div');
                    catSection.id = `cat-section-${cat}`;
                    catSection.className = 'fileteado-section';
                    catSection.style.marginBottom = '30px';
                    catSection.style.border = '14px solid transparent';
                    catSection.style.borderImage = 'url("data:image/svg+xml;utf8,<svg width=\'40\' height=\'40\' viewBox=\'0 0 40 40\' xmlns=\'http://www.w3.org/2000/svg\'><rect x=\'1\' y=\'1\' width=\'38\' height=\'38\' fill=\'none\' stroke=\'%23D4AF37\' stroke-width=\'1\'/><path d=\'M1 12 Q 12 12 12 1\' fill=\'none\' stroke=\'%23D4AF37\' stroke-width=\'1.5\'/><path d=\'M28 1 Q 28 12 39 12\' fill=\'none\' stroke=\'%23D4AF37\' stroke-width=\'1.5\'/><path d=\'M39 28 Q 28 28 28 39\' fill=\'none\' stroke=\'%23D4AF37\' stroke-width=\'1.5\'/><path d=\'M12 39 Q 12 28 1 28\' fill=\'none\' stroke=\'%23D4AF37\' stroke-width=\'1.5\'/><path d=\'M4 6 Q 6 4 8 6 Q 6 8 4 6\' fill=\'%232e7d32\'/><path d=\'M36 6 Q 34 4 32 6 Q 34 8 36 6\' fill=\'%232e7d32\'/><path d=\'M36 34 Q 34 36 32 34 Q 34 32 36 34\' fill=\'%232e7d32\'/><path d=\'M4 34 Q 6 36 8 34 Q 6 32 4 34\' fill=\'%232e7d32\'/><circle cx=\'6\' cy=\'6\' r=\'1.5\' fill=\'%23b81d1d\'/><circle cx=\'34\' cy=\'6\' r=\'1.5\' fill=\'%23b81d1d\'/><circle cx=\'34\' cy=\'34\' r=\'1.5\' fill=\'%23b81d1d\'/><circle cx=\'6\' cy=\'34\' r=\'1.5\' fill=\'%23b81d1d\'/></svg>") 12 stretch';
                    catSection.style.padding = '15px';
                    catSection.innerHTML = `
                        <div style="display: flex; align-items: center; justify-content: space-between; margin-bottom: 15px; border-bottom: 1px solid rgba(212, 175, 55, 0.3); padding-bottom: 10px;">
                            <div style="display: flex; align-items: center; gap: 15px;">
                                <div style="color: var(--primary-gold); width: 40px; text-align: center;">${meta.logo}</div>
                                <div>
                                    <h3 class="gold-text" style="margin: 0; display: flex; align-items: center; flex-wrap: wrap; gap: 10px;">
                                        ${t(meta.name)} <span style="font-size: 0.8rem; color: #aaa; font-weight: normal; font-family: sans-serif;">${t(meta.desc)}</span>
                                    </h3>
                                </div>
                            </div>
                        </div>
                    `;
                    
                    innerGrid = document.createElement('div');
                    innerGrid.id = `cat-grid-${cat}`;
                    innerGrid.className = 'grid'; // Re-apply grid styling to the inner container
                    innerGrid.style.marginTop = '10px';
                    
                    catSection.appendChild(innerGrid);
                    grid.appendChild(catSection);
                } else {
                    innerGrid = document.getElementById(`cat-grid-${cat}`);
                }

                items.forEach(treasure => {
                    const card = document.createElement('div');
                    const prof = treasure.professionalProfile || {};
                    const quality = prof.quality || 'Standard';
                    
                    // Ensure we grab a valid photo URL, ignoring empty strings
                    const validPhotos = (prof.photos || []).filter(p => p && p.trim() !== '');
                    const photoUrl = validPhotos.length > 0 ? validPhotos[0] : 'https://via.placeholder.com/300x400?text=No+Photo';

                    card.className = 'card treasure-card';
                    card.style.position = 'relative';
                    
                    card.innerHTML = `
                        <div class="treasure-img-container" style="cursor: pointer;" onclick="window.location.href='treasure.html?alias=${encodeURIComponent(prof.alias || '')}'">
                            <img class="treasure-img" src="${photoUrl}" alt="${prof.alias || 'Unknown'}">
                        </div>
                        <h3 class="treasure-alias gold-text" style="cursor: pointer; margin-bottom: 0; font-size: 0.95rem;" onclick="window.location.href='treasure.html?alias=${encodeURIComponent(prof.alias || '')}'">${prof.alias || 'Unknown'}</h3>
                    `;
                    innerGrid.appendChild(card);
                });
            }
            
            // Infinite Scroll: Automatically fetch next page when user scrolls near the bottom
            if (data.data.length === limit) {
                const scrollTrigger = document.createElement('div');
                scrollTrigger.style.height = '10px';
                grid.appendChild(scrollTrigger);

                const observer = new IntersectionObserver((entries) => {
                    if (entries[0].isIntersecting) {
                        observer.disconnect();
                        scrollTrigger.remove();
                        currentDiscoveryPage++;
                        loadTreasures(currentDiscoveryPage, true);
                    }
                }, { rootMargin: '300px' }); // Triggers load 300px before reaching the actual bottom
                
                observer.observe(scrollTrigger);
            }
        } else {
            if (!append) {
                // Ensure grid class is restored if no treasures are found so the fallback card centers correctly
                grid.classList.add('grid');
                const hasFilters = specialty || quality || province || city || neighborhood;
                
                grid.innerHTML = `
                    <div class="card" style="grid-column: 1/-1; text-align: center;">
                        <h3 class="gold-text">${t('No Treasures Found')}</h3>
                        <p style="margin-bottom: 20px;">${hasFilters ? t('No professionals match your current selection.') : t('No professionals have been revealed yet. Please check back later.')}</p>
                        ${hasFilters ? `<button onclick="window.location.href='categories.html'">${t('Filter Again')}</button>` : ''}
                    </div>
                `;
            } else {
                const endMsg = document.createElement('div');
                endMsg.style.textAlign = 'center';
                endMsg.style.padding = '20px';
                endMsg.style.color = '#888';
                endMsg.style.width = '100%';
                endMsg.innerHTML = `<p>${t('No more treasures to show.')}</p>`;
                grid.appendChild(endMsg);
            }
        }
        applyStaticTranslations(grid);
    } catch (err) {
        console.error('Vault connection error:', err);
        grid.classList.add('grid');
        grid.innerHTML = `<div class="card alert" style="grid-column: 1/-1;">${t('Error connecting to the vault:')} ${err.message}. ${t('Please ensure the server is running.')}</div>`;
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
            const hasWhatsapp = prof.hasWhatsapp;

            // Check if viewing own profile
            let isOwner = false;
            try {
                const uStr = localStorage.getItem('user');
                if (uStr) {
                    const u = JSON.parse(uStr);
                    if (u._id === treasure._id) isOwner = true;
                }
            } catch(e) {}

            const editBtnHtml = isOwner ? `
                <button onclick="window.location.href='/profDashboard.html'" title="${t('Edit Profile')}" style="position: absolute; top: 15px; right: 105px; font-size: 1.8rem; background: transparent; color: var(--primary-gold); border: none; cursor: pointer; transition: transform 0.3s ease; z-index: 10; text-shadow: 0 0 8px rgba(212, 175, 55, 0.6);" onmouseover="this.style.transform='scale(1.2)'" onmouseout="this.style.transform='scale(1)'">
                    ✏️
                </button>
            ` : '';

            const photoReminderHtml = (isOwner && (!prof.photos || prof.photos.length === 0)) ? `
                <div style="background: rgba(212, 175, 55, 0.1); border: 1px dashed var(--primary-gold); padding: 15px; margin-bottom: 20px; border-radius: 8px; text-align: center; color: var(--primary-gold);">
                    <strong>${t('Reminder:')}</strong> ${t('This is your first time accessing your profile. Please click the "Edit Profile" button to load your photos!')}
                </div>
            ` : '';

            // Store photos for gallery navigation
            currentGalleryPhotos = prof.photos || [];

            content.innerHTML = `
                <div class="card" style="position: relative;">
                    ${editBtnHtml}
                    <button onclick="window.history.back()" onmouseover="this.style.background='rgba(212, 175, 55, 0.1)'" onmouseout="this.style.background='transparent'" style="position: absolute; top: 20px; right: 20px; padding: 6px 12px; font-size: 0.85rem; background: transparent; color: var(--primary-gold); border: 1px solid var(--primary-gold); border-radius: 4px; cursor: pointer; transition: background 0.3s ease; z-index: 10;">&#8592; ${t('Back')}</button>
                    <h2 class="gold-text" style="text-align: center; margin-bottom: 20px; padding: 0 80px;">${prof.alias || 'Unknown'}</h2>
                    
                    <div style="text-align: center; margin-bottom: 15px;">
                        <span style="padding: 5px 10px; border-radius: 20px; font-size: 0.9rem; font-weight: bold; ${treasure.isActiveNow ? 'background: #008800; color: white;' : 'background: #880000; color: white;'}">
                            ${treasure.isActiveNow ? '🟢 Available Right Now' : '🔴 Currently Inactive'}
                        </span>
                    </div>

                    ${photoReminderHtml}
                    
                    <div style="text-align: center; margin-bottom: 10px; font-size: 0.85rem; color: var(--primary-gold); opacity: 0.8;">
                        <em>${t('Desktop: Click & Drag to scroll | Mobile: Swipe left/right')}</em>
                    </div>

                    <!-- Photo Carousel/Grid for Guests -->
                    <div id="treasurePhotoGrid" class="photo-carousel" style="display: flex; overflow-x: auto; gap: 15px; padding-bottom: 15px; margin-bottom: 30px; scroll-snap-type: x mandatory; -webkit-overflow-scrolling: touch;">
                        <!-- Photos will be injected here -->
                    </div>

                    <p style="white-space: pre-wrap; margin-bottom: 20px;">${prof.bio}</p>

                    <div class="tag-list" style="justify-content: flex-start; margin-top: 10px;">
                        <strong>Specialties:</strong> 
                        ${(prof.services || []).map(s => `<span class="tag">${s}</span>`).join('')}
                    </div>

                    <div style="margin-top: 20px; border-top: 1px solid rgba(255,255,255,0.1); padding-top: 20px;">
                        <p><strong>Location:</strong> ${(() => {
                            if (!prof.location) return 'N/A';
                            const p = prof.location.province || '';
                            const c = prof.location.city || '';
                            const n = prof.location.neighborhood || '';
                            if (p.toLowerCase() === 'caba') return [n, 'CABA'].filter(Boolean).join(', ');
                            return [n, c, p].filter(Boolean).join(', ') || 'N/A';
                        })()}</p>
                        <p><strong>Measurements:</strong> ${prof.measurements || 'N/A'}</p>
                        <p><strong>Height:</strong> ${prof.height || 'N/A'}</p>
                        <p><strong>Schedule:</strong> ${(prof.workingDays && prof.workingDays.length > 0) ? prof.workingDays.join(', ') : 'Everyday'}</p>
                        <p><strong>Hours:</strong> ${(prof.workingHours && prof.workingHours.start) ? prof.workingHours.start + ' to ' + prof.workingHours.end : 'Anytime'}</p>
                    </div>

                    <div style="margin-top: 30px; text-align: center; display: flex; justify-content: center; gap: 15px; flex-wrap: wrap;">
                        ${hasWhatsapp ? `<button onclick="contactOnWhatsApp('${prof.alias}')" style="background: #25D366; color: white; border: none; display: flex; align-items: center; justify-content: center; gap: 8px; padding: 10px 20px; font-weight: bold;"><svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="currentColor"><path d="M17.472 14.382c-.297-.149-1.758-.867-2.03-.967-.273-.099-.471-.148-.67.15-.197.297-.767.966-.94 1.164-.173.199-.347.223-.644.075-.297-.15-1.255-.463-2.39-1.405-.881-.728-1.476-1.626-1.65-1.923-.173-.298-.018-.458.13-.606.134-.133.298-.347.446-.52.149-.174.198-.298.298-.497.099-.198.05-.371-.025-.52-.075-.149-.669-1.612-.916-2.207-.242-.579-.487-.5-.669-.51a12.8 12.8 0 0 0-.57-.012c-.198 0-.52.074-.792.372-.272.297-1.04 1.016-1.04 2.479 0 1.462 1.065 2.875 1.213 3.074.149.198 2.096 3.2 5.077 4.487.709.306 1.262.489 1.694.625.712.227 1.36.195 1.871.118.571-.085 1.758-.719 2.006-1.413.248-.694.248-1.289.173-1.413-.074-.124-.272-.198-.57-.347m-5.421 7.403h-.004a9.87 9.87 0 0 1-5.031-1.378l-.361-.214-3.741.982.998-3.648-.235-.374a9.86 9.86 0 0 1-1.51-5.26c.001-5.45 4.436-9.884 9.888-9.884 2.64 0 5.122 1.03 6.988 2.898a9.825 9.825 0 0 1 2.893 6.994c-.003 5.45-4.437 9.884-9.885 9.884m8.413-18.297A11.815 11.815 0 0 0 12.05 0C5.495 0 .16 5.335.157 11.892c0 2.096.547 4.142 1.588 5.945L.057 24l6.305-1.654a11.882 11.882 0 0 0 5.683 1.448h.005c6.554 0 11.89-5.335 11.893-11.893a11.821 11.821 0 0 0-3.48-8.413z"/></svg>${t('Contact on WhatsApp')}</button>` : ''}
                        ${hasWhatsapp ? `<button onclick="contactOnPhone('${prof.alias}')" style="background: transparent; border: 1px solid var(--primary-gold); color: var(--primary-gold); display: flex; align-items: center; justify-content: center; gap: 8px; padding: 10px 20px;"><svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M22 16.92v3a2 2 0 0 1-2.18 2 19.79 19.79 0 0 1-8.63-3.07 19.5 19.5 0 0 1-6-6 19.79 19.79 0 0 1-3.07-8.67A2 2 0 0 1 4.11 2h3a2 2 0 0 1 2 1.72 12.84 12.84 0 0 0 .7 2.81 2 2 0 0 1-.45 2.11L8.09 9.91a16 16 0 0 0 6 6l1.27-1.27a2 2 0 0 1 2.11-.45 12.84 12.84 0 0 0 2.81.7A2 2 0 0 1 22 16.92z"></path></svg>${t('Phone Call')}</button>` : ''}
                    </div>
                </div>
            `;

            const photoGrid = document.getElementById('treasurePhotoGrid');
            if (currentGalleryPhotos.length > 0) {
                // Inject scrollbar styling so it looks like a distinct carousel
                if (!document.getElementById('carouselStyles')) {
                    const style = document.createElement('style');
                    style.id = 'carouselStyles';
                    style.textContent = `
                        .photo-carousel::-webkit-scrollbar { height: 8px; }
                        .photo-carousel::-webkit-scrollbar-track { background: rgba(255,255,255,0.05); border-radius: 4px; margin: 0 10px; }
                        .photo-carousel::-webkit-scrollbar-thumb { background: var(--primary-gold); border-radius: 4px; }
                        .photo-carousel::-webkit-scrollbar-thumb:hover { background: #b08d29; }
                        /* Responsive adjustments for smaller screens */
                        @media (max-width: 768px) {
                            .photo-item-public { width: 180px !important; height: 250px !important; }
                        }
                        @media (max-width: 480px) {
                            .photo-item-public { width: 150px !important; height: 210px !important; }
                        }
                    `;
                    document.head.appendChild(style);
                }

                currentGalleryPhotos.forEach((url, index) => {
                    const item = document.createElement('div');
                    item.className = 'photo-item-public';
                    Object.assign(item.style, {
                        flex: '0 0 auto',
                        width: '260px',
                        height: '360px',
                        scrollSnapAlign: 'center',
                        borderRadius: '12px',
                        overflow: 'hidden',
                        cursor: 'pointer',
                        boxShadow: '0 4px 12px rgba(0,0,0,0.5)',
                        position: 'relative'
                    });
                    
                    const img = document.createElement('img');
                    img.src = url;
                    img.alt = `${prof.alias}'s photo`;
                    Object.assign(img.style, {
                        width: '100%',
                        height: '100%',
                        objectFit: 'cover',
                        transition: 'transform 0.3s ease'
                    });
                    
                    item.addEventListener('mouseenter', () => img.style.transform = 'scale(1.05)');
                    item.addEventListener('mouseleave', () => img.style.transform = 'scale(1)');

                    item.appendChild(img);
                    photoGrid.appendChild(item);
                });

                // --- Desktop Drag-to-Scroll Functionality ---
                let isDown = false;
                let startX;
                let scrollLeft;

                photoGrid.style.cursor = 'grab';
                photoGrid.addEventListener('mousedown', (e) => {
                    isDown = true;
                    photoGrid.style.cursor = 'grabbing';
                    startX = e.pageX - photoGrid.offsetLeft;
                    scrollLeft = photoGrid.scrollLeft;
                });
                photoGrid.addEventListener('mouseleave', () => {
                    isDown = false;
                    photoGrid.style.cursor = 'grab';
                });
                photoGrid.addEventListener('mouseup', () => {
                    isDown = false;
                    photoGrid.style.cursor = 'grab';
                });
                photoGrid.addEventListener('mousemove', (e) => {
                    if (!isDown) return;
                    e.preventDefault();
                    const walk = (e.pageX - photoGrid.offsetLeft - startX) * 2; // Scroll fast
                    photoGrid.scrollLeft = scrollLeft - walk;
                });

                // --- Auto-Scroll Functionality ---
                let autoScrollTimer;
                const startAutoScroll = () => {
                    clearInterval(autoScrollTimer);
                    autoScrollTimer = setInterval(() => {
                        if (isDown) return;
                        const maxScroll = photoGrid.scrollWidth - photoGrid.clientWidth;
                        if (photoGrid.scrollLeft >= maxScroll - 10) {
                            photoGrid.scrollTo({ left: 0, behavior: 'smooth' }); // Rewind to start
                        } else {
                            const itemWidth = photoGrid.querySelector('.photo-item-public')?.offsetWidth || 260;
                            photoGrid.scrollBy({ left: itemWidth + 15, behavior: 'smooth' }); // Dynamically scroll by item width + gap
                        }
                    }, 3000); // Scrolls every 3 seconds
                };
                const stopAutoScroll = () => clearInterval(autoScrollTimer);

                startAutoScroll();
                photoGrid.addEventListener('mouseenter', stopAutoScroll); // Pause on hover
                photoGrid.addEventListener('mouseleave', startAutoScroll); // Resume when mouse leaves
                photoGrid.addEventListener('touchstart', stopAutoScroll, { passive: true }); // Pause on touch
                photoGrid.addEventListener('touchend', startAutoScroll); // Resume after swipe
            } else {
                photoGrid.innerHTML = '<p>No photos available.</p>';
            }

            loader.classList.add('hidden');
            content.classList.remove('hidden');
            applyStaticTranslations(content);
        } else {
            loader.innerHTML = `<p class="alert">${t('Could not find the specified treasure.')}</p>`;
        }
    } catch (err) {
        console.error('Error loading treasure details:', err);
        loader.innerHTML = `<p class="alert">${t('Error connecting to the vault:')} ${err.message}</p>`;
    }
}

// Combined Filter Logic
async function initializeFilters() {
    const filterForm = document.getElementById('filterForm');
    const qualitySelect = document.getElementById('qualitySelect'); // Formerly tierSelect
    const specialtySelect = document.getElementById('specialtySelect');

    if (!filterForm) return;

    // Suggested fix from user analysis: Improve contrast for visibility.
    // The report indicated that the parent card's transparency made the form's
    // light-colored text difficult to read against the page background.
    const parentCard = filterForm.closest('.card');
    const grid = document.getElementById('treasureGrid');

    if (parentCard && grid) {
        // --- OFF-CANVAS SLIDE-IN FILTER & GRID CONTROLS ---
        const filterDrawer = document.createElement('div');
        filterDrawer.id = 'filterDrawer';
        Object.assign(filterDrawer.style, {
            position: 'fixed', top: '0', left: '-100%', width: '320px', maxWidth: '85vw',
            height: '100vh', backgroundColor: 'rgba(10, 10, 10, 0.98)',
            backdropFilter: 'blur(15px)', WebkitBackdropFilter: 'blur(15px)',
            borderRight: '1px solid var(--primary-gold)', zIndex: '10000',
            transition: 'left 0.3s cubic-bezier(0.4, 0, 0.2, 1)',
            overflowY: 'auto', padding: '20px', paddingTop: '70px', boxSizing: 'border-box'
        });

        const drawerHeader = document.createElement('div');
        drawerHeader.style.display = 'flex';
        drawerHeader.style.justifyContent = 'space-between';
        drawerHeader.style.alignItems = 'center';
        drawerHeader.style.marginBottom = '25px';
        drawerHeader.innerHTML = `<h3 class="gold-text" style="margin:0; font-size:1.2rem;">${t('Filters')}</h3>`;
        
        const closeDrawerBtn = document.createElement('button');
        closeDrawerBtn.innerHTML = '&times;';
        Object.assign(closeDrawerBtn.style, {
            background: 'transparent', color: 'var(--primary-gold)', border: 'none',
            fontSize: '32px', cursor: 'pointer', padding: '0', lineHeight: '1'
        });
        drawerHeader.appendChild(closeDrawerBtn);
        filterDrawer.appendChild(drawerHeader);

        parentCard.style.backgroundColor = 'transparent';
        parentCard.style.border = 'none';
        parentCard.style.boxShadow = 'none';
        parentCard.style.padding = '0';
        parentCard.style.display = 'block';
        filterDrawer.appendChild(parentCard);
        document.body.appendChild(filterDrawer);

        const overlay = document.createElement('div');
        Object.assign(overlay.style, {
            position: 'fixed', top: '0', left: '0', width: '100vw', height: '100vh',
            backgroundColor: 'rgba(0,0,0,0.7)', zIndex: '9999',
            display: 'none', opacity: '0', transition: 'opacity 0.3s ease'
        });
        document.body.appendChild(overlay);

        const openDrawer = () => {
            filterDrawer.style.left = '0';
            overlay.style.display = 'block';
            setTimeout(() => overlay.style.opacity = '1', 10);
            document.body.style.overflow = 'hidden';
        };
        const closeDrawer = () => {
            filterDrawer.style.left = '-100%';
            overlay.style.opacity = '0';
            setTimeout(() => overlay.style.display = 'none', 300);
            document.body.style.overflow = '';
        };
        closeDrawerBtn.onclick = closeDrawer;
        overlay.onclick = closeDrawer;

        // Touch swipe to close (mobile friendly)
        let touchStartX = 0;
        filterDrawer.addEventListener('touchstart', e => touchStartX = e.changedTouches[0].screenX, { passive: true });
        filterDrawer.addEventListener('touchend', e => {
            if (touchStartX - e.changedTouches[0].screenX > 50) closeDrawer();
        }, { passive: true });

        const controlsBar = document.createElement('div');
        Object.assign(controlsBar.style, {
            position: 'fixed', top: '50%', left: '50%', transform: 'translate(-50%, -50%)', zIndex: '9999',
            display: 'flex', justifyContent: 'center', alignItems: 'center', gap: '0',
            padding: '5px', backgroundColor: 'transparent',
            borderRadius: '30px', border: 'none', backdropFilter: 'none',
            WebkitBackdropFilter: 'none', boxShadow: 'none',
            width: 'fit-content'
        });

        const openFilterBtn = document.createElement('button');
        openFilterBtn.innerHTML = `<svg style="width:20px; height:20px; vertical-align:middle;" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><line x1="4" y1="21" x2="4" y2="14"></line><line x1="4" y1="10" x2="4" y2="3"></line><line x1="12" y1="21" x2="12" y2="12"></line><line x1="12" y1="8" x2="12" y2="3"></line><line x1="20" y1="21" x2="20" y2="16"></line><line x1="20" y1="12" x2="20" y2="3"></line><line x1="1" y1="14" x2="7" y2="14"></line><line x1="9" y1="8" x2="15" y2="8"></line><line x1="17" y1="16" x2="23" y2="16"></line></svg>`;
        Object.assign(openFilterBtn.style, {
            background: 'transparent', border: 'none', color: 'var(--primary-gold)',
            padding: '8px 12px', cursor: 'pointer',
            display: 'flex', alignItems: 'center', transition: 'color 0.3s ease'
        });
        openFilterBtn.onclick = openDrawer;

        const gridToggles = document.createElement('div');
        gridToggles.style.display = 'flex';
        gridToggles.style.gap = '0';

        if (!document.getElementById('gridLayoutStyles')) {
            const gridStyle = document.createElement('style');
            gridStyle.id = 'gridLayoutStyles';
            gridStyle.textContent = `
                .small-grid-mode .grid,
                .small-grid-mode#treasureGrid.grid,
                .small-grid-mode .grid > div > .grid { grid-template-columns: repeat(auto-fill, minmax(140px, 1fr)) !important; gap: 10px; }
                .small-grid-mode .treasure-card h3 { font-size: 0.85rem !important; }
                .small-grid-mode .treasure-img-container { margin: -10px -10px 10px -10px !important; }
                .small-grid-mode .treasure-card { padding: 10px !important; }
            `;
            document.head.appendChild(gridStyle);
        }

        const btnGridLarge = document.createElement('button');
        btnGridLarge.innerHTML = '<svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><rect x="3" y="3" width="7" height="7"></rect><rect x="14" y="3" width="7" height="7"></rect><rect x="14" y="14" width="7" height="7"></rect><rect x="3" y="14" width="7" height="7"></rect></svg>';
        
        const btnGridSmall = document.createElement('button');
        btnGridSmall.innerHTML = '<svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><rect x="3" y="3" width="4" height="4"></rect><rect x="10" y="3" width="4" height="4"></rect><rect x="17" y="3" width="4" height="4"></rect><rect x="3" y="10" width="4" height="4"></rect><rect x="10" y="10" width="4" height="4"></rect><rect x="17" y="10" width="4" height="4"></rect><rect x="3" y="17" width="4" height="4"></rect><rect x="10" y="17" width="4" height="4"></rect><rect x="17" y="17" width="4" height="4"></rect></svg>';

        [btnGridLarge, btnGridSmall].forEach(btn => {
            Object.assign(btn.style, {
                background: 'transparent', border: 'none', color: 'rgba(212, 175, 55, 0.4)',
                padding: '8px 12px', cursor: 'pointer', display: 'flex', alignItems: 'center', transition: 'color 0.3s ease'
            });
        });
        
        const updateGridButtons = (isSmall) => {
            btnGridSmall.style.color = isSmall ? 'var(--primary-gold)' : 'rgba(212, 175, 55, 0.4)';
            btnGridLarge.style.color = !isSmall ? 'var(--primary-gold)' : 'rgba(212, 175, 55, 0.4)';
        };
        
        const isSmallGrid = localStorage.getItem('smallGridMode') === 'true';
        if (isSmallGrid) {
            document.body.classList.add('small-grid-mode');
        }
        updateGridButtons(isSmallGrid);

        btnGridLarge.onclick = () => { document.body.classList.remove('small-grid-mode'); localStorage.setItem('smallGridMode', 'false'); updateGridButtons(false); };
        btnGridSmall.onclick = () => { document.body.classList.add('small-grid-mode'); localStorage.setItem('smallGridMode', 'true'); updateGridButtons(true); };

        gridToggles.appendChild(btnGridLarge);
        gridToggles.appendChild(btnGridSmall);
        controlsBar.appendChild(openFilterBtn);
        controlsBar.appendChild(gridToggles);

        grid.parentNode.insertBefore(controlsBar, grid);

        // Form layout (Vertical)
        filterForm.style.display = 'flex';
        filterForm.style.flexDirection = 'column';
        filterForm.style.gap = '10px';
        
        const filterGroups = filterForm.querySelectorAll('.filter-group');
        filterGroups.forEach(fg => {
            fg.style.display = 'flex';
            fg.style.flexDirection = 'column';
            fg.style.gap = '0';
            fg.style.width = '100%';
        });
        
        
        const formElements = filterForm.querySelectorAll('select, input, button');
        formElements.forEach(el => {
            if (el.type === 'checkbox') return;
            el.style.width = '100%';
            el.style.boxSizing = 'border-box';
            if (el.tagName !== 'BUTTON') {
                el.style.marginBottom = '5px';
            }
        });
            
            const oldSubmit = filterForm.querySelector('button[type="submit"], input[type="submit"]');
            if (oldSubmit) oldSubmit.remove();
            
            const btnContainer = document.createElement('div');
            btnContainer.style.display = 'flex';
            btnContainer.style.gap = '10px';
            btnContainer.style.marginTop = '15px';
            
            const clearBtn = document.createElement('button');
            clearBtn.type = 'button';
            clearBtn.textContent = t('Clear');
            clearBtn.style.flex = '1';
            clearBtn.style.background = 'transparent';
            clearBtn.style.color = '#ccc';
            clearBtn.style.border = '1px solid #444';
            clearBtn.style.padding = '10px';
            clearBtn.style.borderRadius = '4px';
            clearBtn.style.cursor = 'pointer';
            clearBtn.onclick = () => window.location.href = 'categories.html';
            
            const applyBtn = document.createElement('button');
            applyBtn.type = 'submit';
            applyBtn.textContent = t('Apply Filters');
            applyBtn.style.flex = '2';
            applyBtn.style.background = 'var(--primary-gold)';
            applyBtn.style.color = '#111';
            applyBtn.style.border = 'none';
            applyBtn.style.fontWeight = 'bold';
            applyBtn.style.padding = '10px';
            applyBtn.style.borderRadius = '4px';
            applyBtn.style.cursor = 'pointer';
            
            btnContainer.appendChild(clearBtn);
            btnContainer.appendChild(applyBtn);
            filterForm.appendChild(btnContainer);
            
        applyStaticTranslations(filterDrawer);
    }

    // Function to populate the specialty dropdown
    const populateSpecialties = async (quality = '') => {
        let specialtyContainer = document.getElementById('specialtySelect');
        
        // Fallback to locate the legacy div-based dropdown wrapper
        if (!specialtyContainer) {
            const labels = Array.from(document.querySelectorAll('label'));
            const specLabel = labels.find(l => l.textContent.trim().toLowerCase().includes('specialty') || l.textContent.trim().toLowerCase().includes('especialidad'));
            if (specLabel) {
                const parent = specLabel.closest('.filter-control') || specLabel.parentNode;
                const wrapper = parent.querySelector('.custom-select-wrapper') || parent.querySelector('.checkbox-group') || parent.querySelector('div, ul');
                if (wrapper) {
                    wrapper.id = 'specialtySelect';
                    specialtyContainer = wrapper;
                }
            }
        }
        if (!specialtyContainer) return;

        const urlParams = new URLSearchParams(window.location.search);
        const preselected = (urlParams.get('specialty') || '').split(',').filter(Boolean);

        await renderSpecialtyDropdown('specialtySelect', preselected, { quality: quality, context: 'filter' });
    };

    const urlParams = new URLSearchParams(window.location.search);
    
    if (qualitySelect) {
        const firstOpt = qualitySelect.options[0];
        if (firstOpt && (!firstOpt.value || firstOpt.value === '')) {
            firstOpt.textContent = t('All Qualities');
            firstOpt.dataset.origText = t('All Qualities');
        }
        Array.from(qualitySelect.options).forEach(opt => {
            if (opt.value && CATEGORY_META[opt.value]) {
                const meta = CATEGORY_META[opt.value];
                opt.textContent = `${t(meta.name)}`;
            }
        });
        if (urlParams.get('quality')) {
            qualitySelect.value = urlParams.get('quality');
        }
    }
    
    // Populate specialties on initial page load
    await populateSpecialties(qualitySelect ? qualitySelect.value : '');

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
        const specialtyContainer = document.getElementById('specialtySelect');
        let specialty = '';
        if (specialtyContainer) {
            specialty = specialtyContainer.value;
        }
        
        const provEl = document.getElementById('provinceSelect');
        const cityEl = document.getElementById('citySelect');
        const neighEl = document.getElementById('neighborhoodSelect');

        const url = new URL(`${BASE_ORIGIN}/categories.html`);
        if (quality && quality.trim()) url.searchParams.set('quality', quality);
        if (specialty && specialty.trim()) url.searchParams.set('specialty', specialty);
        if (provEl && provEl.value.trim()) {
            url.searchParams.set('province', provEl.value);
            if (provEl.value.trim().toLowerCase() === 'caba') {
                if (cityEl && cityEl.value.trim()) url.searchParams.set('neighborhood', cityEl.value);
            } else {
                if (cityEl && cityEl.value.trim()) url.searchParams.set('city', cityEl.value);
                if (neighEl && neighEl.value.trim()) url.searchParams.set('neighborhood', neighEl.value);
            }
        }
        
        window.location.href = url.toString();
    });

    // Add change listener to recalculate counts instantly when dropdowns change
    filterForm.addEventListener('change', () => {
        setTimeout(applyCountsToDropdowns, 300); // Small delay to let sub-dropdowns populate
    });
}

let allProfsCache = null;
let profsFetchPromise = null;

async function applyCountsToDropdowns() {
    const filterForm = document.getElementById('filterForm');
    if (!filterForm) return;

    if (!allProfsCache) {
        if (!profsFetchPromise) {
            const url = new URL(`${API_URL}/professionals`);
            url.searchParams.set('limit', 5000);
            url.searchParams.set('minimal', 'true'); // Prevent fetching photos for count sweeps
            url.searchParams.set('_', new Date().getTime()); // Prevent browser from caching old seed data
            profsFetchPromise = fetch(url).then(res => res.json()).catch(e => {
                console.error('Error fetching profs for counts', e);
                return { success: false };
            });
        }
        const data = await profsFetchPromise;
        if (data && data.success) {
            allProfsCache = data.data;
        } else {
            profsFetchPromise = null; // Reset to allow retry
                    allProfsCache = []; // Prevent indefinite locking, default to 0 counts
        }
    }
    
    const profs = allProfsCache;
    if (!profs || profs.length === 0) return;

    const ensureDefault = (el, textKey) => {
        if (el && el.options && el.options.length > 0 && (!el.options[0].value || el.options[0].value === '')) {
            el.options[0].textContent = t(textKey);
            el.options[0].dataset.origText = t(textKey);
        }
    };

    const qualitySelect = document.getElementById('qualitySelect');
    const specialtyContainer = document.getElementById('specialtySelect');
    const provEl = document.getElementById('provinceSelect');
    const cityEl = document.getElementById('citySelect');
    const neighEl = document.getElementById('neighborhoodSelect');

    ensureDefault(qualitySelect, 'All Qualities');
    if (specialtyContainer && specialtyContainer.tagName === 'SELECT') ensureDefault(specialtyContainer, 'All Specialties');
    ensureDefault(provEl, 'All Provinces');
    ensureDefault(cityEl, provEl && provEl.value.trim().toLowerCase() === 'caba' ? 'All Neighborhoods' : 'All Cities');
    ensureDefault(neighEl, 'All Neighborhoods');

    let specialtyFilterValue = '';
    if (specialtyContainer && specialtyContainer.tagName === 'SELECT') {
        specialtyFilterValue = specialtyContainer.value;
    }

    const currentFilters = {
        quality: qualitySelect ? qualitySelect.value : '',
        specialty: specialtyFilterValue,
        province: provEl && provEl.tagName === 'SELECT' ? provEl.value : '',
        city: cityEl && cityEl.tagName === 'SELECT' ? cityEl.value : '',
        neighborhood: neighEl && neighEl.tagName === 'SELECT' ? neighEl.value : ''
    };

    const countMatches = (filters) => {
        return profs.filter(p => {
            const prof = p.professionalProfile || {};
            const loc = prof.location || {};
            const q = prof.quality || 'Standard';
            
            if (filters.quality && q !== filters.quality) return false;
            if (filters.specialty) {
                const requiredSpecialties = filters.specialty.split(',').map(s => s.trim().toLowerCase()).filter(Boolean);
                if (requiredSpecialties.length > 0) {
                    const userServices = (prof.services || []).map(s => s.trim().toLowerCase());
                    const hasAtLeastOne = requiredSpecialties.some(reqSpec => userServices.includes(reqSpec));
                    if (!hasAtLeastOne) return false;
                }
            }
            
            const fProv = (filters.province || '').trim().toLowerCase();
            const lProv = (loc.province || '').trim().toLowerCase();
            
            if (fProv && (!lProv || (!lProv.includes(fProv) && !fProv.includes(lProv)))) return false;
            
            // Unify location filtering to handle the CABA case gracefully.
            // When CABA is the province, the 'city' filter actually holds the neighborhood.
            let effectiveCityFilter = (filters.city || '').trim().toLowerCase();
            let effectiveNeighFilter = (filters.neighborhood || '').trim().toLowerCase();

            if (fProv === 'caba') {
                // If province is CABA, the city filter is the neighborhood filter. There is no city filter.
                effectiveNeighFilter = effectiveCityFilter;
                effectiveCityFilter = '';
            }

            const lCity = (loc.city || '').trim().toLowerCase();
            const lNeigh = (loc.neighborhood || '').trim().toLowerCase();

            if (effectiveCityFilter && (!lCity || !lCity.includes(effectiveCityFilter))) return false;
            if (effectiveNeighFilter && (!lNeigh || !lNeigh.includes(effectiveNeighFilter))) return false;
            
            return true;
        }).length;
    };

    const updateSelectCounts = (selectEl, filterKey, resetKeys = []) => {
        if (!selectEl || selectEl.tagName !== 'SELECT') return;
        Array.from(selectEl.options).forEach(opt => {
            if (opt.textContent.includes('Loading...')) return;
            
            // Save original text to avoid appending multiple times on changes
            if (typeof opt.dataset.origText === 'undefined') {
                opt.dataset.origText = opt.textContent;
            }
            
            const testFilters = { ...currentFilters, [filterKey]: opt.value };
            resetKeys.forEach(k => testFilters[k] = '');
            const count = countMatches(testFilters);
            
            // Always display the option from the database, even if count is 0
            opt.style.display = '';
            opt.disabled = false;
            opt.textContent = `${opt.dataset.origText} (${count})`;
        });
    };

    const updateCheckboxCounts = (containerEl, filterKey, resetKeys = []) => {
        if (!containerEl || containerEl.tagName !== 'DIV') return;
        Array.from(containerEl.querySelectorAll('input[type="checkbox"]')).forEach(cb => {
            const label = containerEl.querySelector(`label[for="${cb.id}"]`);
            if (!label) return;

            if (typeof label.dataset.origText === 'undefined') {
                label.dataset.origText = label.textContent;
            }
            
            const testFilters = { ...currentFilters, [filterKey]: cb.value };
            resetKeys.forEach(k => testFilters[k] = '');
            const count = countMatches(testFilters);
            
            label.textContent = `${label.dataset.origText} (${count})`;
        });
    };

    updateSelectCounts(qualitySelect, 'quality', []);
    if (specialtyContainer && specialtyContainer.tagName === 'SELECT') {
        updateSelectCounts(specialtyContainer, 'specialty', []);
    }
    updateSelectCounts(provEl, 'province', ['city', 'neighborhood']);
    updateSelectCounts(cityEl, 'city', ['neighborhood']);
    updateSelectCounts(neighEl, 'neighborhood');
}

// Contact on WhatsApp
function contactOnWhatsApp(alias) {
    // Safely track the conversion in Plausible without personal data
    if (typeof plausible === 'function') {
        plausible('WhatsApp Click', { props: { professional: alias } });
    }

    const url = `${API_URL}/professionals/${encodeURIComponent(alias)}/whatsapp`;
    window.open(url, '_blank');
}

// Contact on Phone
function contactOnPhone(alias) {
    if (typeof plausible === 'function') {
        plausible('Phone Click', { props: { professional: alias } });
    }
    const url = `${API_URL}/professionals/${encodeURIComponent(alias)}/phone`;
    window.open(url, '_self');
}

// --- Admin Dashboard Grid ---
async function renderAdminGrid(container) {
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

async function loadAdminGridData() {
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

                card.innerHTML = `
                    <div style="width: 100%; aspect-ratio: 1/1; overflow: hidden; border-radius: 4px; margin-bottom: 10px; position: relative;">
                        <img src="${photo}" style="width: 100%; height: 100%; object-fit: cover;">
                        <div style="position: absolute; top: 5px; right: 5px; font-size: 0.55rem; padding: 2px 6px; border-radius: 10px; background: ${statusColor}; color: white; font-weight: bold; box-shadow: 0 2px 4px rgba(0,0,0,0.5);">
                            ${vStatus.toUpperCase()}
                        </div>
                    </div>
                    <div style="font-weight: bold; margin-bottom: 5px; color: var(--primary-gold); white-space: nowrap; overflow: hidden; text-overflow: ellipsis; font-size: 0.8rem;">${alias}</div>
                    <div style="font-size: 0.65rem; color: #aaa; margin-bottom: 10px; white-space: nowrap; overflow: hidden; text-overflow: ellipsis;">${p.email}</div>
                    <button class="edit-btn" style="width: 100%; padding: 6px; font-size: 0.7rem; cursor: pointer; background: transparent; border: 1px solid var(--primary-gold); color: var(--primary-gold);">✏️ Edit</button>
                `;
                
                card.querySelector('.edit-btn').onclick = () => {
                    openEditProfessionalModal(p);
                };

                grid.appendChild(card);
            });

            catSection.appendChild(grid);
            content.appendChild(catSection);
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

async function loadDashboard() {
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
            const stats = data.stats || { profileViews: 0, whatsappClicks: 0 };

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
                                <button id="btnEditPricing" class="admin-nav-btn" style="color: var(--primary-gold); border-color: rgba(212, 175, 55, 0.3);">💰 Edit Category Pricing</button>
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
                    alertsHtml += `<div style="background: rgba(255,165,0,0.1); border-left: 4px solid orange; padding: 10px; margin-bottom: 10px;">⏳ <strong>Pending Verification:</strong> Your identity documents are under review. Approval typically takes up to 48 hours.</div>`;
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
                        <div><div style="font-size: 2.5rem; color: var(--primary-gold);">${stats.profileViews || 0}</div><div style="font-size: 0.9rem; color: #ccc;">Profile Image Hits</div></div>
                        <div><div style="font-size: 2.5rem; color: var(--primary-gold);">${stats.whatsappClicks || 0}</div><div style="font-size: 0.9rem; color: #ccc;">WhatsApp Clicks</div></div>
                        <div><div style="font-size: 2.5rem; color: var(--primary-gold);">${stats.phoneClicks || 0}</div><div style="font-size: 0.9rem; color: #ccc;">Phone Calls</div></div>
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
                        window.location.href = 'categories.html';
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
                        <button onclick="window.location.href='login.html'">${t('Login')}</button>
                        <button onclick="window.location.href='register.html'" style="background: transparent; border: 1px solid var(--primary-gold); color: var(--primary-gold);">${t('Register')}</button>
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

// Update Profile
const updateProfileForm = document.getElementById('updateProfileForm');
if (updateProfileForm) {
    let isSaving = false;
    
    window.saveProfessionalProfile = async (silent = false) => {
        if (isSaving) return;
        isSaving = true;
        const alertEl = document.getElementById('updateAlert');
        const formData = new FormData();

        // Append all text fields
        formData.append('firstName', document.getElementById('upFirstName')?.value || '');
        formData.append('surname', document.getElementById('upSurname')?.value || '');
        formData.append('middleName', document.getElementById('upMiddleName')?.value || '');
        formData.append('idNumber', document.getElementById('upIdNumber')?.value || '');
        formData.append('birthDate', document.getElementById('upBirthDate')?.value || '');
        formData.append('mobilePhone', document.getElementById('upMobilePhone')?.value || '');
        formData.append('street', document.getElementById('upStreet')?.value || '');
        formData.append('number', document.getElementById('upStreetNumber')?.value || '');
        formData.append('floor', document.getElementById('upFloor')?.value || '');
        formData.append('apartment', document.getElementById('upApartment')?.value || '');

        formData.append('alias', document.getElementById('upAlias').value);
        formData.append('bio', document.getElementById('upBio').value);
        formData.append('hasOwnApartment', document.getElementById('upOwnApartment').checked);
        formData.append('hasFantasyWardrobe', document.getElementById('upFantasyWardrobe').checked);
        formData.append('quality', document.getElementById('upQuality')?.value || '');
        
        const upIsExposed = document.getElementById('upIsExposed');
        if (upIsExposed) formData.append('isExposed', upIsExposed.checked);

        const upPaysMonthly = document.getElementById('upPaysMonthly');
        if (upPaysMonthly) formData.append('paysMonthlyCharges', upPaysMonthly.checked);
        
        const dashboardSpecCbs = document.querySelectorAll('.dashboard-specialty-cb');
        if (dashboardSpecCbs.length > 0) {
            const selectedSpecs = Array.from(dashboardSpecCbs).filter(cb => cb.checked).map(cb => cb.value).join(',');
            formData.set('services', selectedSpecs);
        } else {
            const upServicesEl = document.getElementById('upServices');
            let servicesVal = '';
            if (upServicesEl) {
                if (upServicesEl.tagName === 'SELECT') {
                    servicesVal = Array.from(upServicesEl.selectedOptions).map(opt => opt.value).join(',');
                } else {
                    servicesVal = upServicesEl.value;
                }
            }
            formData.append('services', servicesVal);
        }
        
        const upProv = document.getElementById('upProvince');
        const upCity = document.getElementById('upCity');
        const upNeigh = document.getElementById('upNeighborhood');
        
        if (upProv) {
            formData.append('province', upProv.value);
            if (upProv.value.trim().toLowerCase() === 'caba') {
                formData.append('city', '');
                if (upCity) formData.append('neighborhood', upCity.value);
            } else {
                if (upCity) formData.append('city', upCity.value);
                if (upNeigh) formData.append('neighborhood', upNeigh.value);
            }
        }

        formData.append('measurements', document.getElementById('upMeasurements').value);
        formData.append('height', document.getElementById('upHeight').value);
        formData.append('whatsappNumber', document.getElementById('upWhatsapp').value);

        formData.append('postalCode', document.getElementById('upPostCode')?.value || '');
        formData.append('instagram', document.getElementById('upInstagram')?.value || '');
        formData.append('facebook', document.getElementById('upFacebook')?.value || '');
        
        const upWhStart = document.getElementById('upWorkingHoursStart');
        const upWhEnd = document.getElementById('upWorkingHoursEnd');
        const upWDays = document.getElementById('upWorkingDays');
        if (upWhStart) formData.append('workingHoursStart', upWhStart.value);
        if (upWhEnd) formData.append('workingHoursEnd', upWhEnd.value);
        
        formData.append('vacationStart', document.getElementById('upVacationStart')?.value || '');
        formData.append('vacationEnd', document.getElementById('upVacationEnd')?.value || '');
        if (upWDays) {
            const dVal = upWDays.tagName === 'SELECT' ? Array.from(upWDays.selectedOptions).map(o => o.value).join(',') : upWDays.value;
            formData.append('workingDays', dVal);
        }

        // Overwrite the FormData payload with values from the new Availability block if they exist
        const availStart = document.getElementById('upAvailStart');
        const availEnd = document.getElementById('upAvailEnd');
        if (availStart) formData.set('workingHoursStart', availStart.value);
        if (availEnd) formData.set('workingHoursEnd', availEnd.value);
        
        const availCbs = document.querySelectorAll('.avail-day-cb');
        if (availCbs && availCbs.length > 0) {
            const selectedDays = Array.from(availCbs).filter(cb => cb.checked).map(cb => cb.value).join(',');
            formData.set('workingDays', selectedDays);
        }

        const existingPhotos = [];
        const photoElements = document.querySelectorAll('#photoGrid .photo-item img');

        photoElements.forEach(img => {
            if (newFilesMap.has(img.src)) {
                // It's a new file, append the File object for multer
                formData.append('photos', newFilesMap.get(img.src));
            } else {
                // It's an existing photo URL that we want to keep
                let photoUrl = img.getAttribute('data-original-url') || img.getAttribute('src');
                if (photoUrl && photoUrl.startsWith('http')) {
                    try {
                        // Strip domain to only save the relative path if it's a local upload
                        const urlObj = new URL(photoUrl);
                        if (urlObj.pathname.startsWith('/uploads/')) {
                            photoUrl = urlObj.pathname;
                        }
                    } catch(e) {}
                }
                existingPhotos.push(photoUrl);
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
                credentials: 'include',
                body: formData,
                keepalive: true // Ensures the save finishes even if the user closes the tab mid-save
            });
            const data = await res.json();
            if (!silent) {
                if (data.success) {
                    showAlert(alertEl, 'Profile updated successfully!', false);
                } else {
                    showAlert(alertEl, data.error || 'Update failed');
                }
            }
        } catch (err) {
            if (!silent) showAlert(alertEl, 'Server connection error');
        } finally {
            isSaving = false;
        }
    };

    // Manual Submit Fallback
    updateProfileForm.addEventListener('submit', async (e) => {
        e.preventDefault();
        window.saveProfessionalProfile(false);
    });

    // Auto-Save Triggers
    const formInputs = updateProfileForm.querySelectorAll('input, select, textarea');
    formInputs.forEach(input => {
        if (input.type === 'file') return; // Handled specially by addPhotoToGrid
        input.addEventListener('blur', () => window.saveProfessionalProfile(true));
        if (input.type === 'checkbox' || input.type === 'radio' || input.tagName === 'SELECT') {
            input.addEventListener('change', () => window.saveProfessionalProfile(true));
        }
    });

    window.addEventListener('beforeunload', () => {
        window.saveProfessionalProfile(true);
    });
}

// Upload Payment Receipt
const receiptForm = document.getElementById('receiptForm');
if (receiptForm) {
    receiptForm.addEventListener('submit', async (e) => {
        e.preventDefault();
        const receiptFile = document.getElementById('receiptFile').files[0];
        const alert = document.getElementById('receiptAlert');
        
        if (!receiptFile) {
            showAlert(alert, 'Please select a file or photo to upload.', true);
            return;
        }
        
        const formData = new FormData();
        formData.append('receipt', receiptFile);
        
        try {
            const token = localStorage.getItem('token');
            const btn = receiptForm.querySelector('button[type="submit"]') || document.getElementById('btnUploadReceipt');
            const originalText = btn ? btn.textContent : 'Upload';
            if (btn) { btn.textContent = t('Uploading...'); btn.disabled = true; }
            // Added credentials: 'include' to ensure auth cookie is sent
            const res = await fetch(`${API_URL}/professionals/upload-receipt`, {
                method: 'POST',
                headers: { 
                    'Authorization': `Bearer ${token}`
                },
                credentials: 'include',
                body: formData
            });
            const data = await res.json();
            
            if (btn) { btn.textContent = originalText; btn.disabled = false; }
            
            if (data.success) {
                showAlert(alert, 'Receipt uploaded successfully! Admin will review it shortly.', false);
                receiptForm.reset();
            } else {
                showAlert(alert, data.error || 'Failed to upload receipt');
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
            // Added credentials: 'include' to ensure auth cookie is sent
            const res = await fetch(`${API_URL}/professionals/acknowledge-rate`, {
                method: 'PUT',
                headers: { 'Authorization': `Bearer ${token}` },
                credentials: 'include'
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

// --- Professional View Connection Requests Modal ---
async function openPendingConnectionsModal() {
    let modal = document.getElementById('pendingConnectionsModal');
    if (!modal) {
        modal = document.createElement('div');
        modal.id = 'pendingConnectionsModal';
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
            <h2 class="gold-text" style="margin-bottom: 20px;">Pending Connection Requests</h2>
            <div style="overflow-x: auto;">
                <table style="width: 100%; border-collapse: collapse; text-align: left; font-size: 0.9rem;">
                    <thead>
                        <tr style="border-bottom: 1px solid var(--primary-gold);">
                            <th style="padding: 10px;">Date</th>
                            <th style="padding: 10px;">Requester</th>
                            <th style="padding: 10px;">Message</th>
                            <th style="padding: 10px;">Actions</th>
                        </tr>
                    </thead>
                    <tbody id="connectionsTableBody">
                        <tr><td colspan="4" style="padding: 10px; text-align: center;">Loading...</td></tr>
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
    loadPendingConnections();
}

async function loadPendingConnections() {
    const tbody = document.getElementById('connectionsTableBody');
    tbody.innerHTML = '<tr><td colspan="4" style="padding: 10px; text-align: center;">Loading...</td></tr>';
    
    try {
        const token = localStorage.getItem('token');
        // Added credentials: 'include' to ensure auth cookie is sent
        const res = await fetch(`${API_URL}/transactions/requests`, { 
            headers: { 'Authorization': `Bearer ${token}` },
            credentials: 'include'
        });
        const data = await res.json();

        if (data.success) {
            tbody.innerHTML = '';
            if (data.data.length === 0) {
                tbody.innerHTML = '<tr><td colspan="4" style="padding: 10px; text-align: center;">No pending requests.</td></tr>';
                return;
            }
            
            data.data.forEach(req => {
                const requesterName = req.requester ? (req.requester.name || req.requester.email) : 'Unknown User';
                const message = req.message || 'No message provided';

                const tr = document.createElement('tr');
                tr.style.borderBottom = '1px solid #333';
                tr.innerHTML = `
                    <td style="padding: 10px;">${new Date(req.createdAt).toLocaleString()}</td>
                    <td style="padding: 10px;">${requesterName}</td>
                    <td style="padding: 10px;">${message}</td>
                    <td style="padding: 10px; display: flex; gap: 5px;">
                        <button class="accept-conn-btn" data-id="${req._id}" style="padding: 5px 10px; background: green; color: white; border: none; border-radius: 4px; cursor: pointer;">Accept</button>
                        <button class="decline-conn-btn" data-id="${req._id}" style="padding: 5px 10px; background: red; color: white; border: none; border-radius: 4px; cursor: pointer;">Decline</button>
                    </td>
                `;
                tbody.appendChild(tr);
            });

            document.querySelectorAll('.accept-conn-btn').forEach(btn => {
                btn.onclick = () => updateConnectionStatus(btn.getAttribute('data-id'), 'accepted');
            });
            document.querySelectorAll('.decline-conn-btn').forEach(btn => {
                btn.onclick = () => updateConnectionStatus(btn.getAttribute('data-id'), 'declined');
            });
            applyStaticTranslations(tbody);

        } else {
            tbody.innerHTML = `<tr><td colspan="4" style="padding: 10px; color: var(--accent-red);">Error: ${data.error}</td></tr>`;
        }
    } catch (err) {
        tbody.innerHTML = `<tr><td colspan="4" style="padding: 10px; color: var(--accent-red);">Network Error</td></tr>`;
    }
}

async function updateConnectionStatus(id, status) {
    try {
        const token = localStorage.getItem('token');
        // Added credentials: 'include' to ensure auth cookie is sent
        const res = await fetch(`${API_URL}/transactions/requests/${id}`, {
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
            alert(`Request ${status} successfully.`);
            loadPendingConnections(); 
        } else {
            alert(data.error || 'Failed to update status');
        }
    } catch (err) {
        alert('Server connection error');
    }
}

// --- Admin Activity Logs Viewer ---
let currentLogFilters = {};
let currentLogBaseFilters = {};

async function openActivityLogsModal(title = 'Activity Logs', baseFilters = {}) {
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

async function loadActivityLogs() {
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
async function openViewLeadsModal() {
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

async function loadLeads() {
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
async function openPaymentVerificationsModal() {
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

async function loadPaymentVerifications() {
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

async function acknowledgePayment(id) {
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
async function openPendingVerificationsModal() {
    let modal = document.getElementById('pendingModal');
    if (!modal) {
        modal = document.createElement('div');
        modal.id = 'pendingModal';
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
                        <tr><td colspan="4" style="padding: 10px; text-align: center;">Loading...</td></tr>
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
    loadPendingVerifications();
}

async function loadPendingVerifications() {
    const tbody = document.getElementById('pendingTableBody');
    tbody.innerHTML = '<tr><td colspan="4" style="padding: 10px; text-align: center;">Loading...</td></tr>';
    
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
                tbody.innerHTML = '<tr><td colspan="4" style="padding: 10px; text-align: center;">No pending verifications.</td></tr>';
                return;
            }
            
            data.data.forEach(prof => {
                const alias = prof.professionalProfile?.alias || 'Unknown';
                const docs = prof.verificationDocuments && prof.verificationDocuments.length > 0 
                    ? prof.verificationDocuments.map(doc => `<a href="${doc}" target="_blank" style="color: var(--primary-gold); text-decoration: underline;">View</a>`).join(', ')
                    : 'None';
                const gesture = prof.verificationGesture || 'N/A';

                const tr = document.createElement('tr');
                tr.style.borderBottom = '1px solid #333';
                tr.innerHTML = `
                    <td style="padding: 10px;">${prof.email}</td>
                    <td style="padding: 10px;">${alias}</td>
                    <td style="padding: 10px;">
                        ${docs}<br>
                        <span style="font-size: 0.8rem; color: #aaa;">Gesture: <strong style="color: white;">${gesture}</strong></span>
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
            applyStaticTranslations(tbody);

        } else {
            tbody.innerHTML = `<tr><td colspan="4" style="padding: 10px; color: var(--accent-red);">Error: ${data.error}</td></tr>`;
        }
    } catch (err) {
        tbody.innerHTML = `<tr><td colspan="4" style="padding: 10px; color: var(--accent-red);">Network Error</td></tr>`;
    }
}

async function updateVerificationStatus(id, status) {
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

// --- Admin Mail Broadcast Modal ---
async function openMailBroadcastModal() {
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
async function openEditProfessionalModal(prof = null) {
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

async function renderProfessionalList(aliasSearch = '') {
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

function renderEditForm(prof) {
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
            <div id="adminEditPhotos" style="display: flex; gap: 10px; flex-wrap: wrap; margin-bottom: 15px;">
                ${(profile.photos || []).map(p => `
                    <div class="admin-photo-item" style="position: relative; width: 100px; height: 100px;">
                        <img src="${p}" style="width: 100%; height: 100%; object-fit: cover; border-radius: 4px;">
                        <button type="button" class="remove-photo-btn" style="position: absolute; top: 0; right: 0; background: var(--accent-red); color: white; border: none; cursor: pointer; padding: 2px 6px;">X</button>
                    </div>
                `).join('')}
            </div>

            <button type="submit" style="margin-top: 10px;">Save Changes</button>
        </form>
    `;

    setupLocationDropdowns('adminEditProvince', 'adminEditCity', 'adminEditNeigh', false, profile.location || {});
    renderSpecialtyDropdown('adminEditServices', profile.services || []);

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
async function openEditPricingModal(currentPricing) {
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
            <h2 class="gold-text" style="margin-bottom: 20px;">Edit Category Pricing</h2>
            <p style="font-size: 0.9rem; margin-bottom: 20px; color: #aaa;">These monthly values are used by the billing engine to calculate invoices for professionals.</p>
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
                    showAlert(alertEl, 'Pricing updated successfully!', false);
                    setTimeout(() => window.location.reload(), 1500); // Reload to reflect changes globally
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
        let sanitizedUrl = fileOrUrl;
        if (sanitizedUrl.startsWith('http')) {
            try {
                const urlObj = new URL(sanitizedUrl);
                if (urlObj.pathname.startsWith('/uploads/')) {
                    sanitizedUrl = urlObj.pathname;
                }
            } catch (e) {}
        }
        imageUrl = sanitizedUrl.startsWith('/') && window.location.protocol === 'file:' ? `${BASE_ORIGIN}${sanitizedUrl}` : sanitizedUrl;
    } else { 
        // This is a new File object from the user's computer
        imageUrl = URL.createObjectURL(fileOrUrl);
        newFilesMap.set(imageUrl, fileOrUrl); // Map blob URL to the File object
        isNew = true;
    }

    const item = document.createElement('div');
    item.className = 'photo-item';
    Object.assign(item.style, {
        position: 'relative',
        width: '120px',
            height: '160px',
        borderRadius: '8px',
        overflow: 'hidden',
        boxShadow: '0 2px 5px rgba(0,0,0,0.5)',
        display: 'inline-block'
    });
    
    const img = document.createElement('img');
    img.src = imageUrl;
    if (typeof fileOrUrl === 'string') img.setAttribute('data-original-url', imageUrl); // Save the sanitized relative URL
    img.alt = 'User Photo';
    Object.assign(img.style, {
        width: '100%',
        height: '100%',
        objectFit: 'cover'
    });
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
    Object.assign(overlay.style, {
        position: 'absolute',
        top: '5px',
        right: '5px',
        background: 'rgba(200, 0, 0, 0.8)',
        color: 'white',
        width: '24px',
        height: '24px',
        borderRadius: '50%',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        cursor: 'pointer',
        fontWeight: 'bold',
        fontSize: '16px'
    });

    item.appendChild(img);
    item.appendChild(overlay);

    // --- Drag and Drop Logic ---
    item.draggable = true;
    item.addEventListener('dragstart', function(e) {
        e.dataTransfer.effectAllowed = 'move';
        e.dataTransfer.setData('text/plain', img.src); // Required for Firefox
        item.classList.add('dragging');
        setTimeout(() => item.style.opacity = '0.5', 0);
    });
    item.addEventListener('dragend', function() {
        item.classList.remove('dragging');
        item.style.opacity = '1';
    });
    item.addEventListener('dragover', function(e) {
        e.preventDefault();
        e.dataTransfer.dropEffect = 'move';
    });
    item.addEventListener('dragenter', function(e) {
        e.preventDefault();
        if (this !== document.querySelector('.dragging')) this.style.transform = 'scale(1.05)';
    });
    item.addEventListener('dragleave', function() {
        this.style.transform = 'scale(1)';
    });
    item.addEventListener('drop', function(e) {
        e.preventDefault();
        this.style.transform = 'scale(1)';
        const draggedItem = document.querySelector('.dragging');
        if (draggedItem && draggedItem !== this) {
            let allItems = [...grid.querySelectorAll('.photo-item')];
            let draggedIndex = allItems.indexOf(draggedItem);
            let targetIndex = allItems.indexOf(this);
            if (draggedIndex < targetIndex) this.after(draggedItem);
            else this.before(draggedItem);
            const explicitSaveBtn = document.getElementById('explicitSaveBtn');
            if (explicitSaveBtn) {
                explicitSaveBtn.classList.remove('hidden');
                explicitSaveBtn.click();
            } else if (typeof window.saveProfessionalProfile === 'function') {
                window.saveProfessionalProfile(true);
            }
        }
    });

    overlay.addEventListener('click', (e) => {
        e.stopPropagation(); // Prevents accidental dragging interference
        if (confirm('Are you sure you want to remove this photo from your gallery?')) {
            if (newFilesMap.has(img.src)) {
                URL.revokeObjectURL(img.src);
                newFilesMap.delete(img.src);
            }
            item.remove();
            const explicitSaveBtn = document.getElementById('explicitSaveBtn');
            if (explicitSaveBtn) {
                explicitSaveBtn.classList.remove('hidden');
                explicitSaveBtn.click();
            } else if (typeof window.saveProfessionalProfile === 'function') {
                window.saveProfessionalProfile(true);
            }
        }
    });

    const frame = grid.querySelector('.add-photo-frame');
    if (frame) grid.insertBefore(item, frame);
    else grid.appendChild(item);
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
            setTimeout(() => {
                const explicitSaveBtn = document.getElementById('explicitSaveBtn');
                if (explicitSaveBtn) {
                    explicitSaveBtn.classList.remove('hidden');
                    explicitSaveBtn.click();
                } else if (typeof window.saveProfessionalProfile === 'function') {
                    window.saveProfessionalProfile(true);
                }
            }, 100);
        }
    });
}

// --- Helpers ---

function showAlert(element, message, isError = true) {
    element.textContent = message;
    element.classList.remove('hidden');
    element.style.color = isError ? 'var(--accent-red)' : '#00ff00';
}

async function renderSpecialtyDropdown(containerId, preselectedServices = [], options = {}) {
    const { quality = '', context = 'form' } = options;
    let container = document.getElementById(containerId);
    
    // Aggressive fallback to find legacy checkbox groups if ID is missing or changed
    if (!container) {
        const labels = Array.from(document.querySelectorAll('label'));
        const specLabel = labels.find(l => 
            l.textContent.trim().toLowerCase().includes('specialt') || 
            l.textContent.trim().toLowerCase().includes('especialidad') ||
            l.textContent.trim().toLowerCase().includes('service') ||
            l.textContent.trim().toLowerCase().includes('servicio')
        );
        
        if (specLabel) {
            const sibling = specLabel.nextElementSibling;
            if (sibling && (sibling.tagName === 'DIV' || sibling.tagName === 'UL')) {
                container = sibling;
                container.id = containerId;
            } else {
                const parent = specLabel.closest('.filter-control') || specLabel.parentNode;
                if (parent) {
                    const wrapper = parent.querySelector('div.checkbox-group, div.custom-select-wrapper, ul, div');
                    if (wrapper && wrapper !== specLabel) {
                        container = wrapper;
                        container.id = containerId;
                    }
                }
            }
        }
    }

    if (!container) return;

    // Forcefully morph any DIV/UL (like checkbox containers) into a standard SELECT drop-down
    if (container.tagName !== 'SELECT') {
        const select = document.createElement('select');
        select.id = container.id;
        select.className = 'form-select';
        if (container.getAttribute('name')) select.name = container.getAttribute('name');
        else if (container.id === 'specialtySelect') select.name = 'specialty';
        else select.name = 'services';
        
        select.style.width = '100%';
        select.style.padding = context === 'form' ? '8px' : '12px';
        select.style.background = context === 'form' ? '#222' : 'transparent';
        select.style.border = context === 'form' ? '1px solid #444' : '1px solid var(--primary-gold)';
        select.style.color = 'white';
        if (context === 'form') select.style.borderRadius = '4px';
        
        // Ensure it is a strict drop-down menu (no multi-select box)
        select.multiple = false;
        
        container.parentNode.replaceChild(select, container);
        container = select;
        
        // Update the corresponding label's 'for' attribute
        const labels = Array.from(document.querySelectorAll('label'));
        const specLabel = labels.find(l => l.textContent.trim().toLowerCase().includes('specialt') || l.textContent.trim().toLowerCase().includes('especialidad'));
        if (specLabel) specLabel.setAttribute('for', container.id);
    } else if (container.tagName === 'SELECT') {
        container.multiple = false;
        container.removeAttribute('size');
        container.style.height = 'auto';
        container.style.width = '100%';
        container.style.padding = context === 'form' ? '8px' : '12px';
        container.style.background = context === 'form' ? '#222' : 'transparent';
        container.style.border = context === 'form' ? '1px solid #444' : '1px solid var(--primary-gold)';
        container.style.color = 'white';
        if (context === 'form') container.style.borderRadius = '4px';
    }

    try {
        let preselectedArr = [];
        if (preselectedServices) {
            if (Array.isArray(preselectedServices)) preselectedArr = preselectedServices;
            else if (typeof preselectedServices === 'string') preselectedArr = preselectedServices.split(',');
        }
        preselectedArr = preselectedArr.map(s => (s || '').trim().toLowerCase()).filter(Boolean);

        const specialties = ['Massage', 'Virtual Connection', 'Love Alchemy', 'Media Content', 'Streaming Kisses'];
        
        container.innerHTML = '';
        
        if (context === 'filter') {
            const defaultOpt = document.createElement('option');
            defaultOpt.value = '';
            defaultOpt.textContent = t('All Specialties');
            defaultOpt.style.background = 'var(--dark-bg)';
            defaultOpt.style.color = 'var(--light-text)';
            container.appendChild(defaultOpt);
        }

        specialties.forEach(specialty => {
            const opt = document.createElement('option');
            opt.value = specialty;
            opt.textContent = t(specialty);
            opt.style.background = 'var(--dark-bg)';
            opt.style.color = 'var(--light-text)';
            if (preselectedArr.includes(specialty.toLowerCase().trim())) {
                opt.selected = true;
            }
            container.appendChild(opt);
        });
    } catch (err) { 
        console.error('Error loading specialties:', err);
        container.innerHTML = '<option value="">Error loading specialties.</option>'; 
    }
}

// Populates location dropdowns dynamically based on current API relationships
async function setupLocationDropdowns(provinceId, cityId, neighborhoodId, isFilter = false, prefillData = {}) {
    const provinceEl = document.getElementById(provinceId);
    let cityEl = document.getElementById(cityId);
    let neighborhoodEl = document.getElementById(neighborhoodId);

    if (!provinceEl || provinceEl.tagName !== 'SELECT') return;

    const cabaNeighborhoods = [
        "Agronomía", "Almagro", "Balvanera", "Barracas", "Belgrano", "Boedo", 
        "Caballito", "Chacarita", "Coghlan", "Colegiales", "Constitución", 
        "Flores", "Floresta", "La Boca", "La Paternal", "Liniers", "Mataderos", 
        "Monte Castro", "Montserrat", "Nueva Pompeya", "Núñez", "Palermo", 
        "Parque Avellaneda", "Parque Chacabuco", "Parque Chas", "Parque Patricios", 
        "Puerto Madero", "Recoleta", "Retiro", "Saavedra", "San Cristóbal", 
        "San Nicolás", "San Telmo", "Vélez Sársfield", "Versalles", "Villa Crespo", 
        "Villa del Parque", "Villa Devoto", "Villa General Mitre", "Villa Lugano", 
        "Villa Luro", "Villa Ortúzar", "Villa Pueyrredón", "Villa Real", 
        "Villa Riachuelo", "Villa Santa Rita", "Villa Soldati", "Villa Urquiza"
    ];

    const argProvinces = [
        "CABA", "Buenos Aires", "Catamarca", "Chaco", "Chubut", "Córdoba", "Corrientes", 
        "Entre Ríos", "Formosa", "Jujuy", "La Pampa", "La Rioja", "Mendoza", "Misiones", 
        "Neuquén", "Río Negro", "Salta", "San Juan", "San Luis", "Santa Cruz", "Santa Fe", 
        "Santiago del Estero", "Tierra del Fuego", "Tucumán"
    ];

    // Helper to dynamically switch a dropdown to a text input
    const morphToInput = (el, placeholderText, prefillValue) => {
        if (!el) return null;
        if (el.tagName === 'INPUT') {
            el.placeholder = placeholderText;
            if (prefillValue) el.value = prefillValue;
            return el;
        }
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

    const defaultText = isFilter ? t('All Provinces') : t('Select Province');
    provinceEl.innerHTML = `<option value="">${defaultText}</option>`;
    
    let fetchedProvinces = false;
    try {
        const res = await fetch(`${API_URL}/locations/provinces?limit=100`);
        const data = await res.json();
        if (data.success && data.data) {
            let pList = Array.isArray(data.data) ? data.data : (data.data.provinces || []);
            if (pList.length > 0) {
                fetchedProvinces = true;
                pList.forEach(p => {
                    const val = typeof p === 'string' ? p : (p.name || '');
                    if (!val) return;
                    const id = typeof p === 'string' ? '' : (p._id || '');
                    const opt = document.createElement('option');
                    opt.value = val;
                    if (id) opt.dataset.id = id;
                    opt.textContent = val;
                    if (prefillData.province === val) opt.selected = true;
                    provinceEl.appendChild(opt);
                });
            }
        }
    } catch (e) {
        console.error('Failed to load provinces from API', e);
    }
    
    if (!fetchedProvinces) {
        argProvinces.forEach(val => {
            const opt = document.createElement('option');
            opt.value = val;
            opt.textContent = val;
            if (prefillData.province === val) opt.selected = true;
            provinceEl.appendChild(opt);
        });
    }

    const loadSublocations = async () => {
        // Re-fetch elements in case they were morphed by previous selections
        cityEl = document.getElementById(cityId);
        neighborhoodEl = document.getElementById(neighborhoodId);

        const provinceName = (provinceEl.value || '').trim();
        const isCaba = provinceName.toLowerCase() === 'caba';
        const selectedOption = provinceEl.options[provinceEl.selectedIndex];
        const provId = selectedOption ? selectedOption.dataset.id : null;
        
        if (neighborhoodEl && isFilter) {
            neighborhoodEl.style.display = isCaba ? 'none' : 'block';
        }

        if (!provinceName) {
            cityEl = morphToSelect(cityEl);
            neighborhoodEl = morphToSelect(neighborhoodEl);
            if (cityEl) { cityEl.innerHTML = `<option value="">${isFilter ? t('All Cities') : t('Select City')}</option>`; cityEl.disabled = true; }
            if (neighborhoodEl) { neighborhoodEl.innerHTML = `<option value="">${isFilter ? t('All Neighborhoods') : t('Select Neighborhood')}</option>`; neighborhoodEl.disabled = true; }
            return;
        }

        let loadedFromApi = false;
        if (provId) {
            try {
                const res = await fetch(`${API_URL}/locations/provinces/${provId}/sublocations?limit=500&_=${new Date().getTime()}`);
                const data = await res.json();
                if (data.success && data.data) {
                    loadedFromApi = true;
                    if (isCaba) {
                        cityEl = morphToSelect(cityEl);
                        cityEl.innerHTML = `<option value="">${isFilter ? t('All Neighborhoods') : t('Select Neighborhood')}</option>`;
                        
                        let nList = Array.isArray(data.data) ? data.data : (data.data.neighborhoods || []);
                        if (nList.length === 0) nList = cabaNeighborhoods.map(name => ({ name }));
                        
                        nList.forEach(n => {
                            const val = typeof n === 'string' ? n : (n.name || '');
                            if (!val) return;
                            const opt = document.createElement('option');
                            opt.value = val;
                            opt.textContent = val;
                            if (prefillData.neighborhood === val || prefillData.city === val) opt.selected = true;
                            cityEl.appendChild(opt);
                        });
                        cityEl.disabled = false;
                        if (neighborhoodEl) neighborhoodEl.style.display = 'none';
                    } else {
                        cityEl = morphToSelect(cityEl);
                        cityEl.innerHTML = `<option value="">${isFilter ? t('All Cities') : t('Select City')}</option>`;
                        
                        let cList = Array.isArray(data.data) ? data.data : (data.data.cities || []);
                        cList.forEach(c => {
                            const val = typeof c === 'string' ? c : (c.name || '');
                            if (!val) return;
                            const opt = document.createElement('option');
                            opt.value = val;
                            opt.textContent = val;
                            if (prefillData.city === val) opt.selected = true;
                            cityEl.appendChild(opt);
                        });
                        cityEl.disabled = false;
                        if (neighborhoodEl) {
                            neighborhoodEl.style.display = 'block';
                            neighborhoodEl = morphToInput(neighborhoodEl, isFilter ? t('Neighborhood...') : t('Enter Neighborhood'), prefillData.neighborhood);
                        }
                    }
                }
            } catch (e) {
                console.error('Failed to load sublocations', e);
            }
        }

        if (!loadedFromApi) {
            if (isCaba) {
                cityEl = morphToSelect(cityEl);
                cityEl.innerHTML = `<option value="">${isFilter ? t('All Neighborhoods') : t('Select Neighborhood')}</option>`;
                cabaNeighborhoods.forEach(val => {
                    const opt = document.createElement('option');
                    opt.value = val;
                    opt.textContent = val;
                    if (prefillData.neighborhood === val || prefillData.city === val) opt.selected = true;
                    cityEl.appendChild(opt);
                });
                cityEl.disabled = false;
                if (neighborhoodEl) neighborhoodEl.style.display = 'none';
            } else {
                cityEl = morphToInput(cityEl, isFilter ? t('City...') : t('Enter City'), prefillData.city);
                cityEl.disabled = false;
                if (neighborhoodEl) {
                    neighborhoodEl.style.display = 'block';
                    neighborhoodEl = morphToInput(neighborhoodEl, isFilter ? t('Neighborhood...') : t('Enter Neighborhood'), prefillData.neighborhood);
                }
            }
        }

        // Clear prefill after first load
        if (prefillData.city) prefillData.city = '';
        if (prefillData.neighborhood) prefillData.neighborhood = '';
        
        if (cityEl) applyStaticTranslations(cityEl);
        if (neighborhoodEl) applyStaticTranslations(neighborhoodEl);
        
        // Guarantee facet counts are recalculated immediately after dynamic options are loaded
        if (typeof applyCountsToDropdowns === 'function') {
            setTimeout(applyCountsToDropdowns, 100);
        }
    };

    provinceEl.addEventListener('change', loadSublocations);
    
    // Always execute once on setup to clear any default "Loading..." text from sub-dropdowns
    await loadSublocations();
}

// --- Professional Dedicated 5-Block Editing Dashboard ---

async function loadProfDashboard() {
    const formObj = document.getElementById('updateProfileForm');
    const loader = document.getElementById('loader');
    const content = document.getElementById('profDashboardContent');
    if (!formObj || !content) return;

    try {
        const token = localStorage.getItem('token');
        const res = await fetch(`${API_URL}/professionals/me?_=${new Date().getTime()}`, {
            headers: { 'Authorization': `Bearer ${token}` },
            credentials: 'include'
        });
        const data = await res.json();

        if (data.success && data.data.role === 'professional') {
            const user = data.data;
            const prof = user.professionalProfile || {};
            const stats = data.stats || { profileViews: 0, whatsappClicks: 0, phoneClicks: 0 };
            const isApproved = user.verificationStatus === 'approved';

            // Make the form naturally wider to utilize the extra space
            formObj.style.maxWidth = '1200px';
            formObj.style.width = '100%';
            formObj.style.margin = '0 auto';

            formObj.innerHTML = `
                <h2 class="gold-text" style="margin-bottom: 20px;">Professional Dashboard</h2>
                <div style="display: flex; justify-content: space-between; align-items: center; margin-bottom: 20px;">
                    <h2 class="gold-text" style="margin: 0; display: flex; align-items: center; gap: 10px;">
                        Professional Dashboard <span style="font-size: 1.5rem; text-shadow: 0 0 5px rgba(212,175,55,0.5);">✏️</span>
                    </h2>
                    <button type="button" onclick="window.history.back()" onmouseover="this.style.background='rgba(212, 175, 55, 0.1)'" onmouseout="this.style.background='transparent'" style="padding: 6px 12px; background: transparent; border: 1px solid var(--primary-gold); color: var(--primary-gold); border-radius: 4px; cursor: pointer; transition: background 0.3s ease; font-weight: bold; font-size: 0.85rem;">&#8592; Back</button>
                </div>
                
                <!-- 1. Statistics Top Frame -->
                <div class="card fileteado-section" style="margin-bottom: 20px; border: 1px solid var(--primary-gold);">
                    <h3 class="gold-text" style="margin-bottom: 15px;">Statistics</h3>
                    <div style="display: flex; gap: 20px; justify-content: space-around; text-align: center; flex-wrap: wrap;">
                        <div><div style="font-size: 2.5rem; color: var(--primary-gold);">${stats.profileViews || 0}</div><div style="font-size: 0.9rem; color: #ccc;">Dashboard Photo Clicks</div></div>
                        <div><div style="font-size: 2.5rem; color: var(--primary-gold);">${stats.whatsappClicks || 0}</div><div style="font-size: 0.9rem; color: #ccc;">WhatsApp Button Pushes</div></div>
                        <div><div style="font-size: 2.5rem; color: var(--primary-gold);">${stats.phoneClicks || 0}</div><div style="font-size: 0.9rem; color: #ccc;">Call Button Pushes</div></div>
                        <div><div style="font-size: 2.5rem; color: var(--primary-gold);">0</div><div style="font-size: 0.9rem; color: #ccc;">Hourly Hits (Peak Time)</div></div>
                    </div>
                </div>
                
                <input type="hidden" id="upIdNumber" value="${prof.idNumber || ''}">
                <input type="hidden" id="upBirthDate" value="${prof.birthDate ? new Date(prof.birthDate).toISOString().split('T')[0] : ''}">
                <input type="hidden" id="upMobilePhone" value="${prof.mobilePhone || ''}">
                <textarea id="upBio" style="display:none;">${prof.bio || ''}</textarea>
                <input type="checkbox" id="upIsExposed" style="display:none;" ${prof.isExposed !== false ? 'checked' : ''}>
                <input type="checkbox" id="upPaysMonthly" style="display:none;" ${prof.paysMonthlyCharges !== false ? 'checked' : ''}>
                <input type="hidden" id="upWhatsapp" value="${prof.whatsappNumber || ''}">
                <input type="hidden" id="upInstagram" value="${prof.instagram || ''}">
                <input type="hidden" id="upFacebook" value="${prof.facebook || ''}">

                <!-- 2. Personal Information -->
                <div class="card fileteado-section" style="margin-bottom: 20px; border: 1px solid var(--primary-gold);">
                    <h3 class="gold-text" style="margin-bottom: 15px;">Personal Information</h3>
                    <div style="display: flex; gap: 10px; flex-wrap: wrap; margin-bottom: 10px;">
                        <div style="flex: 1; min-width: 150px;"><label>Name</label><input type="text" id="upFirstName" value="${prof.firstName || ''}" style="width: 100%; padding: 8px; background: #333; color: #888; border: 1px solid #444; border-radius: 4px;" disabled></div>
                        <div style="flex: 1; min-width: 150px;"><label>Surname</label><input type="text" id="upSurname" value="${prof.surname || ''}" style="width: 100%; padding: 8px; background: #333; color: #888; border: 1px solid #444; border-radius: 4px;" disabled></div>
                        <div style="flex: 1; min-width: 150px;"><label>Middle Name</label><input type="text" id="upMiddleName" value="${prof.middleName || ''}" style="width: 100%; padding: 8px; background: #333; color: #888; border: 1px solid #444; border-radius: 4px;" disabled></div>
                    </div>
                    <div style="display: flex; gap: 10px; flex-wrap: wrap; margin-bottom: 10px;">
                        <div style="flex: 1; min-width: 150px;"><label>Alias</label><input type="text" id="upAlias" value="${prof.alias || ''}" style="width: 100%; padding: 8px; background: #333; color: #888; border: 1px solid #444; border-radius: 4px;" disabled></div>
                        <div style="flex: 1; min-width: 150px;"><label>Birth Date</label><input type="date" id="upBirthDate" value="${prof.birthDate ? new Date(prof.birthDate).toISOString().split('T')[0] : ''}" style="width: 100%; padding: 8px; background: #333; color: #888; border: 1px solid #444; border-radius: 4px; cursor: not-allowed;" disabled></div>
                        <div style="flex: 1; min-width: 150px;"><label>Height</label><input type="text" id="upHeight" value="${prof.height || ''}" style="width: 100%; padding: 8px; background: #333; color: #888; border: 1px solid #444; border-radius: 4px;" disabled></div>
                        <div style="flex: 1; min-width: 150px;"><label>Measures</label><input type="text" id="upMeasurements" value="${prof.measurements || ''}" style="width: 100%; padding: 8px; background: #333; color: #888; border: 1px solid #444; border-radius: 4px;" disabled></div>
                    </div>
                    <div style="display: flex; gap: 10px; flex-wrap: wrap;">
                        <div style="flex: 1; min-width: 150px;">
                            <label>Category</label>
                            <select id="upQuality" style="width: 100%; padding: 8px; background: #222; color: white; border: 1px solid var(--primary-gold); border-radius: 4px;">
                                <option value="Elite" ${prof.quality === 'Elite' ? 'selected' : ''}>Elite</option>
                                <option value="Premium" ${prof.quality === 'Premium' ? 'selected' : ''}>Premium</option>
                                <option value="Gold" ${prof.quality === 'Gold' ? 'selected' : ''}>Gold</option>
                                <option value="Silver" ${prof.quality === 'Silver' ? 'selected' : ''}>Silver</option>
                                <option value="Standard" ${prof.quality === 'Standard' ? 'selected' : ''}>Standard</option>
                            </select>
                        </div>
                        <div style="flex: 2; min-width: 250px;">
                            <label>Specialties</label>
                            <div id="specsContainer" style="display: flex; flex-wrap: wrap; gap: 10px; margin-top: 5px;"></div>
                        </div>
                    </div>
                    <div style="display: flex; gap: 20px; flex-wrap: wrap; margin-top: 15px; border-top: 1px solid #444; padding-top: 15px;">
                        <label style="display: flex; align-items: center; gap: 8px; cursor: pointer; color: #ccc; font-size: 0.9rem;">
                            <input type="checkbox" id="upOwnApartment" ${prof.hasOwnApartment ? 'checked' : ''}>
                            ${t('Has own apartment')}
                        </label>
                        <label style="display: flex; align-items: center; gap: 8px; cursor: pointer; color: #ccc; font-size: 0.9rem;">
                            <input type="checkbox" id="upFantasyWardrobe" ${prof.hasFantasyWardrobe ? 'checked' : ''}>
                            ${t('Has fantasy wardrobe')} (sexy costumes, high heels)
                        </label>
                    </div>
                </div>

                <!-- 3. Address -->
                <div class="card fileteado-section" style="margin-bottom: 20px; border: 1px solid var(--primary-gold);">
                    <h3 class="gold-text" style="margin-bottom: 15px;">Address</h3>
                    <div style="display: flex; gap: 10px; flex-wrap: wrap; margin-bottom: 10px;">
                        <div style="flex: 2; min-width: 200px;"><label>Street</label><input type="text" id="upStreet" value="${prof.location?.street || ''}" style="width: 100%; padding: 8px; background: #222; color: white; border: 1px solid #444; border-radius: 4px;"></div>
                        <div style="flex: 1; min-width: 100px;"><label>Number</label><input type="text" id="upStreetNumber" value="${prof.location?.number || ''}" style="width: 100%; padding: 8px; background: #222; color: white; border: 1px solid #444; border-radius: 4px;"></div>
                        <div style="flex: 1; min-width: 80px;"><label>Floor</label><input type="text" id="upFloor" value="${prof.location?.floor || ''}" style="width: 100%; padding: 8px; background: #222; color: white; border: 1px solid #444; border-radius: 4px;"></div>
                        <div style="flex: 1; min-width: 80px;"><label>Appartment</label><input type="text" id="upApartment" value="${prof.location?.apartment || ''}" style="width: 100%; padding: 8px; background: #222; color: white; border: 1px solid #444; border-radius: 4px;"></div>
                        <div style="flex: 1; min-width: 100px;"><label>Postal Code</label><input type="text" id="upPostCode" value="${prof.location?.postalCode || ''}" style="width: 100%; padding: 8px; background: #222; color: white; border: 1px solid #444; border-radius: 4px;"></div>
                    </div>
                    <div style="display: flex; gap: 10px; flex-wrap: wrap;">
                        <div style="flex: 1; min-width: 150px;"><label>Province</label><select id="upProvince" style="width: 100%; padding: 8px; background: #222; color: white; border: 1px solid #444; border-radius: 4px;"></select></div>
                        <div style="flex: 1; min-width: 150px;"><label>Ciudad-Barrio (City)</label><select id="upCity" style="width: 100%; padding: 8px; background: #222; color: white; border: 1px solid #444; border-radius: 4px;"></select></div>
                        <div style="flex: 1; min-width: 150px;"><label>Ciudad-Barrio (Neighborhood)</label><input type="text" id="upNeighborhood" value="${prof.location?.neighborhood || ''}" style="width: 100%; padding: 8px; background: #222; color: white; border: 1px solid #444; border-radius: 4px;" placeholder="Neighborhood..."></div>
                    </div>
                </div>

                <!-- 4. Availability -->
                <div class="card fileteado-section" style="margin-bottom: 20px; border: 1px solid var(--primary-gold);">
                    <h3 class="gold-text" style="margin-bottom: 15px;">Availability</h3>
                    <div style="display: flex; gap: 10px; flex-wrap: wrap; margin-bottom: 15px;">
                        <div style="flex: 1; min-width: 150px;"><label>Avail-start</label><input type="time" id="upAvailStart" value="${prof.workingHours?.start || '00:00'}" style="width: 100%; padding: 8px; background: #222; color: white; border: 1px solid #444; border-radius: 4px;"></div>
                        <div style="flex: 1; min-width: 150px;"><label>Avail-end</label><input type="time" id="upAvailEnd" value="${prof.workingHours?.end || '23:59'}" style="width: 100%; padding: 8px; background: #222; color: white; border: 1px solid #444; border-radius: 4px;"></div>
                        <div style="flex: 1; min-width: 150px;"><label>Vac-start</label><input type="date" id="upVacationStart" value="${prof.vacation?.startDate ? new Date(prof.vacation.startDate).toISOString().split('T')[0] : ''}" style="width: 100%; padding: 8px; background: #222; color: white; border: 1px solid #444; border-radius: 4px;"></div>
                        <div style="flex: 1; min-width: 150px;"><label>Vac-end</label><input type="date" id="upVacationEnd" value="${prof.vacation?.endDate ? new Date(prof.vacation.endDate).toISOString().split('T')[0] : ''}" style="width: 100%; padding: 8px; background: #222; color: white; border: 1px solid #444; border-radius: 4px;"></div>
                    </div>
                    <div id="daysContainer" style="display: flex; gap: 15px; flex-wrap: wrap; margin-top: 10px;"></div>
                </div>

                <!-- 5. Photos -->
                <div class="card fileteado-section" style="margin-bottom: 20px; border: 1px solid var(--primary-gold);">
                    <div style="display: flex; justify-content: space-between; align-items: center; margin-bottom: 15px;">
                        <h3 class="gold-text" style="margin: 0;">Photos</h3>
                        <button type="button" id="btnUploadPhoto" style="padding: 8px 16px; background: var(--primary-gold); color: #111; font-weight: bold; border: none; border-radius: 4px; cursor: pointer;">Upload</button>
                    </div>
                    <p style="font-size: 0.85rem; color: #ccc; margin-bottom: 15px;">Admin upload, update, remove actions. Drag photos to reorder.</p>
                    <input type="file" id="newPhotoInput" accept="image/png, image/jpeg, image/jpg, image/webp" multiple style="display: none;">
                    <div id="photoGrid" style="display: flex; flex-wrap: wrap; gap: 15px;">
                        <label class="add-photo-frame" style="width: 120px; height: 160px; border: 2px dashed var(--primary-gold); border-radius: 8px; display: flex; align-items: center; justify-content: center; cursor: pointer; color: var(--primary-gold); font-size: 2rem; background: rgba(212, 175, 55, 0.05); transition: background 0.3s ease; flex-shrink: 0;">
                            <span>+</span>
                        </label>
                    </div>
                    <p id="photoApprovalMsg" style="color: var(--accent-red); font-size: 0.85rem; margin-top: 10px; display: ${isApproved ? 'none' : 'block'};">Profile photos can only be uploaded after your account is approved.</p>
                </div>
                
                <div id="updateAlert" class="alert hidden" style="padding: 10px; border-radius: 4px; border: 1px solid transparent; margin-bottom: 20px;"></div>
                <button type="button" id="explicitSaveBtn" class="hidden" style="background: #25D366; color: white; font-weight: bold; width: 100%; padding: 12px; border-radius: 4px; border: none; cursor: pointer; margin-bottom: 15px;">💾 Save Changes</button>
                <button type="button" id="bottomBackBtn" style="background: var(--primary-gold); color: var(--dark-bg); font-weight: bold; width: 100%; padding: 12px; border-radius: 4px; border: none; cursor: pointer;">&#8592; Back to Main Dashboard</button>
            `;

            // Logic to populate the components
            const specsContainer = document.getElementById('specsContainer');
            const specs = [
                { name: 'Love Alchemy', tooltip: 'Sex' }, { name: 'Massage', tooltip: 'Conventional massage' },
                { name: 'Virtual Connection', tooltip: 'Virtual call' }, { name: 'Media Content', tooltip: 'Share hot content pics or videos' },
                { name: 'Streaming Kisses', tooltip: 'Live streaming kisses' }
            ];
            const userServices = prof.services || [];
            specs.forEach(spec => {
                const lbl = document.createElement('label');
                lbl.title = spec.tooltip;
                lbl.style.cssText = 'display:flex; align-items:center; gap:5px; cursor:pointer; padding:8px 12px; background:rgba(212,175,55,0.1); border-radius:4px; border:1px solid rgba(212,175,55,0.3); font-size:0.9rem;';
                const cb = document.createElement('input'); cb.type = 'checkbox'; cb.value = spec.name; cb.className = 'dashboard-specialty-cb';
                cb.checked = userServices.includes(spec.name) || userServices.includes(spec.name.toLowerCase());
                lbl.appendChild(cb); lbl.appendChild(document.createTextNode(t(spec.name)));
                specsContainer.appendChild(lbl);
            });

            const daysContainer = document.getElementById('daysContainer');
            const fullDays = ['Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday', 'Sunday'];
            const shortDays = ['Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat', 'Sun'];
            const userDays = prof.workingDays || fullDays;
            fullDays.forEach((day, i) => {
                const lbl = document.createElement('label');
                lbl.style.cssText = 'display:flex; align-items:center; gap:5px; cursor:pointer;';
                const cb = document.createElement('input'); cb.type = 'checkbox'; cb.value = day; cb.className = 'avail-day-cb';
                cb.checked = userDays.includes(day);
                lbl.appendChild(cb); lbl.appendChild(document.createTextNode(shortDays[i]));
                daysContainer.appendChild(lbl);
            });

            setupLocationDropdowns('upProvince', 'upCity', 'upNeighborhood', false, prof.location || {});

            const photoGrid = document.getElementById('photoGrid');
            const newPhotoInput = document.getElementById('newPhotoInput');
            const btnUploadPhoto = document.getElementById('btnUploadPhoto');
            
            if (newPhotoInput) {
                if (!isApproved) {
                    newPhotoInput.disabled = true; btnUploadPhoto.disabled = true; btnUploadPhoto.style.opacity = '0.5';
                    photoGrid.style.opacity = '0.3'; photoGrid.style.pointerEvents = 'none';
                }
                btnUploadPhoto.onclick = () => newPhotoInput.click();
                const frameLabel = photoGrid.querySelector('.add-photo-frame');
                if (frameLabel) frameLabel.appendChild(newPhotoInput);
                (prof.photos || []).forEach(url => addPhotoToGrid(url));
                newPhotoInput.addEventListener('change', (e) => {
                    if (e.target.files) {
                        for (const file of e.target.files) {
                            if (!file.type.startsWith('image/')) continue;
                            addPhotoToGrid(file);
                        }
                    const explicitSaveBtn = document.getElementById('explicitSaveBtn');
                    if (explicitSaveBtn) { explicitSaveBtn.classList.remove('hidden'); explicitSaveBtn.click(); }
                    }
                });
            }

            // Show Save Button on any form modification to avoid focus-out issues
            const markDirty = (e) => {
                if (e.target.matches('input, select, textarea')) {
                    document.getElementById('explicitSaveBtn').classList.remove('hidden');
                }
            };
            formObj.addEventListener('input', markDirty);
            formObj.addEventListener('change', markDirty);

            document.getElementById('explicitSaveBtn').onclick = async () => {
                if (typeof window.saveProfessionalProfile === 'function') {
                    const btn = document.getElementById('explicitSaveBtn');
                    btn.textContent = 'Saving...';
                    btn.style.opacity = '0.7';
                    await window.saveProfessionalProfile(false); // False = show success alert to the user
                    btn.textContent = '💾 Save Changes';
                    btn.style.opacity = '1';
                    btn.classList.add('hidden'); // Hide the button again until next change
                }
            };

            document.getElementById('bottomBackBtn').onclick = async () => {
                if (typeof window.saveProfessionalProfile === 'function') await window.saveProfessionalProfile(true);
                window.location.href = '/perfil/' + encodeURIComponent(prof.alias || '');
            };

            loader.classList.add('hidden');
            content.classList.remove('hidden');
            applyStaticTranslations(content);
        } else {
            window.location.href = '/index.html';
        }
    } catch (err) {
        if(loader) loader.innerHTML = '<p class="alert">Server connection error.</p>';
    }
}

// --- Auto-Initialize ---
document.addEventListener('DOMContentLoaded', async () => {
    // Age Verification Gate:
    const pageSegment = window.location.pathname.split('/').pop();
    const currentPage = (pageSegment === '' || pageSegment === '/') ? 'index.html' : pageSegment;
    const isProfilePath = window.location.pathname.startsWith('/perfil/');
    const effectivePage = isProfilePath ? 'treasure.html' : currentPage;

    const publicPages = ['index.html', 'login.html', 'register.html', 'verify.html', 'recover.html'];
    const isPublicPage = publicPages.includes(effectivePage);
    const is18Plus = localStorage.getItem('is18Plus');
    const hasToken = localStorage.getItem('token');

    // --- Panic Button (Fake Excel) ---
    // Pressing 'Escape' instantly transforms the page into a fake spreadsheet
    document.addEventListener('keydown', (e) => {
        if (e.key === 'Escape') {
            document.title = "Book1 - Excel";
            document.body.innerHTML = `
                <div style="position:fixed; top:0; left:0; width:100vw; height:100vh; background:#fff; z-index:9999999; font-family:Arial, sans-serif; cursor:default;">
                    <div style="background:#217346; color:white; padding:10px 15px; font-weight:bold; font-size:14px; display:flex; align-items:center;">
                        <div style="background:white; color:#217346; padding:2px 6px; margin-right:15px; font-weight:900; border-radius:2px;">X</div>
                        Book1 - Excel
                    </div>
                    <div style="background:#f3f2f1; padding:8px 15px; border-bottom:1px solid #ccc; display:flex; gap:20px; font-size:13px; color:#444;">
                        <span style="border-bottom:2px solid #217346; padding-bottom:4px; font-weight:bold; color:#217346;">Home</span>
                        <span>Insert</span><span>Page Layout</span><span>Formulas</span><span>Data</span><span>Review</span><span>View</span>
                    </div>
                    <div style="padding:0; background:#fff; overflow:hidden; height:calc(100vh - 80px);">
                        <table style="width:100%; border-collapse:collapse; font-size:12px; color:#333;">
                            <thead>
                                <tr>
                                    <th style="border:1px solid #ccc; background:#f3f2f1; width:40px; padding:5px;"></th>
                                    <th style="border:1px solid #ccc; background:#f3f2f1; padding:5px; width:150px;">A</th>
                                    <th style="border:1px solid #ccc; background:#f3f2f1; padding:5px; width:150px;">B</th>
                                    <th style="border:1px solid #ccc; background:#f3f2f1; padding:5px; width:150px;">C</th>
                                    <th style="border:1px solid #ccc; background:#f3f2f1; padding:5px;">D</th>
                                </tr>
                            </thead>
                            <tbody>
                                ${Array(40).fill('').map((_, i) => `
                                <tr>
                                    <td style="border:1px solid #ccc; background:#f3f2f1; text-align:center; padding:4px;">${i + 1}</td>
                                    <td style="border:1px solid #ccc; padding:4px;">${i === 0 ? 'Q1 Revenue' : (i === 1 ? '$45,000' : '')}</td>
                                    <td style="border:1px solid #ccc; padding:4px;">${i === 0 ? 'Q2 Revenue' : (i === 1 ? '$52,000' : '')}</td>
                                    <td style="border:1px solid #ccc; padding:4px;">${i === 0 ? 'Q3 Revenue' : (i === 1 ? '$48,000' : '')}</td>
                                    <td style="border:1px solid #ccc; padding:4px;">${i === 0 ? 'Q4 Revenue' : (i === 1 ? '$61,000' : '')}</td>
                                </tr>`).join('')}
                            </tbody>
                        </table>
                    </div>
                </div>
            `;
            const topBar = document.getElementById('globalTopBar');
            if (topBar) topBar.remove();
        }
    });

    // --- Password Visibility Toggle ---
    const setupPasswordToggles = () => {
        const passwordInputs = document.querySelectorAll('input[type="password"]');
        passwordInputs.forEach(input => {
            if (input.parentElement.classList.contains('password-wrapper')) return;
            
            const wrapper = document.createElement('div');
            wrapper.className = 'password-wrapper';
            wrapper.style.position = 'relative';
            wrapper.style.width = '100%';
            wrapper.style.display = 'block';
            
            input.parentNode.insertBefore(wrapper, input);
            wrapper.appendChild(input);
            
            const toggleBtn = document.createElement('span');
            const eyeOn = `<svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="#999" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M1 12s4-8 11-8 11 8 11 8-4 8-11 8-11-8-11-8z"></path><circle cx="12" cy="12" r="3"></circle></svg>`;
            const eyeOff = `<svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="#999" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M17.94 17.94A10.07 10.07 0 0 1 12 20c-7 0-11-8-11-8a18.45 18.45 0 0 1 5.06-5.94M9.9 4.24A9.12 9.12 0 0 1 12 4c7 0 11 8 11 8a18.5 18.5 0 0 1-2.16 3.19m-6.72-1.07a3 3 0 1 1-4.24-4.24"></path><line x1="1" y1="1" x2="23" y2="23"></line></svg>`;
            
            toggleBtn.innerHTML = eyeOn;
            toggleBtn.style.position = 'absolute';
            toggleBtn.style.right = '10px';
            toggleBtn.style.top = '50%';
            toggleBtn.style.transform = 'translateY(-50%)';
            toggleBtn.style.cursor = 'pointer';
            toggleBtn.style.display = 'flex';
            toggleBtn.style.alignItems = 'center';
            toggleBtn.style.justifyContent = 'center';
            
            toggleBtn.addEventListener('click', () => {
                if (input.type === 'password') {
                    input.type = 'text';
                    toggleBtn.innerHTML = eyeOff;
                } else {
                    input.type = 'password';
                    toggleBtn.innerHTML = eyeOn;
                }
            });
            wrapper.appendChild(toggleBtn);
        });
    };
    setupPasswordToggles();

    if (!isPublicPage && is18Plus !== 'true' && !hasToken) {
        const ref = document.referrer;
        // Fallback: If they clicked a direct link from the landing page (like an inline onclick)
        // that navigated here before the JS age-gate logic could set the flag,
        // we safely assume they clicked the +18 button since they came from the root/index page.
        if (ref && (ref.endsWith('/') || ref.includes('index.html'))) {
            localStorage.setItem('is18Plus', 'true');
            sessionStorage.setItem('valid_entry', 'true');
            sessionStorage.setItem('ancestor_code', 'index.html');
        } else {
            // If on a protected page without age verification, redirect to the landing page.
            window.location.replace('/index.html');
            return; // Stop further script execution on this page.
        }
    }

    // --- THE FLOW GUARDIAN (Ancestor Code System) ---
    // Ensures that child pages can only be opened by their designated ancestor.
    const allowedAncestors = {
        'categories.html': ['index.html', 'categories.html', 'treasure.html', 'dashboard.html', 'login.html'],
        'treasure.html': ['categories.html', 'treasure.html'],
        'dashboard.html': ['index.html', 'login.html', 'verify.html', 'categories.html', 'treasure.html', 'dashboard.html', 'profDashboard.html'],
        'profDashboard.html': ['index.html', 'login.html', 'verify.html', 'dashboard.html', 'profDashboard.html', 'categories.html', 'treasure.html'],
        'verify.html': ['register.html', 'login.html', 'verify.html'],
        'register.html': ['index.html', 'login.html', 'register.html', 'dashboard.html', 'categories.html', 'treasure.html'],
        'login.html': ['index.html', 'register.html', 'recover.html', 'login.html', 'dashboard.html', 'categories.html', 'treasure.html'],
        'recover.html': ['login.html', 'recover.html'],
        'home.html': ['dashboard.html', 'home.html']
    };

    if (publicPages.includes(effectivePage) || hasToken) {
        sessionStorage.setItem('valid_entry', 'true');
    }

    if (effectivePage === 'index.html') {
        sessionStorage.setItem('ancestor_code', 'index.html');
    } else {
        const referrer = document.referrer;
        const isFromOurSite = referrer && referrer.includes(window.location.hostname);

        // STRICT DOOR POLICY: Enforce entry via index or login
        if (!isPublicPage) {
            const hasActiveSession = sessionStorage.getItem('valid_entry') === 'true';
            
            // If they are a guest opening a brand new tab / direct link, force them to index.html
            if (!hasActiveSession && !hasToken && !isFromOurSite) {
                sessionStorage.setItem('intended_destination', window.location.href);
                console.warn(`[Flow Guardian] Direct access blocked for guest. Redirecting to start.`);
                window.location.replace('/index.html');
                return;
            } else if (!hasActiveSession) {
                sessionStorage.setItem('valid_entry', 'true');
            }

            if (sessionStorage.getItem('valid_entry') !== 'true') {
                sessionStorage.setItem('intended_destination', window.location.href);
                console.warn(`[Flow Guardian] Strict entry enforced. Redirecting to start.`);
                window.location.replace('/index.html');
                return;
            }
        }

        const currentAncestorCode = sessionStorage.getItem('ancestor_code');
        const allowed = allowedAncestors[effectivePage];

        // Let logged-in users OR guests who naturally navigated from our site seed the flow
        if (!currentAncestorCode && (hasToken || isFromOurSite) && (effectivePage === 'categories.html' || effectivePage === 'treasure.html' || effectivePage === 'dashboard.html' || effectivePage === 'profDashboard.html')) {
            sessionStorage.setItem('ancestor_code', 'index.html');
        } else if (allowed && (!currentAncestorCode || !allowed.includes(currentAncestorCode))) {
            console.warn(`[Flow Guardian] Access denied. Invalid ancestor code for ${effectivePage}. Redirecting to start.`);
            window.location.replace('/index.html');
            return;
        }
        sessionStorage.setItem('ancestor_code', effectivePage);
    }
    // ------------------------------------------------

    initGlobalTopBar();
    initPrivacyShield();
    applyStaticTranslations();

    // Auto-forward on landing page if already age-verified
    if (document.getElementById('landing')) {
        // --- Landing Page Visual Adjustments ---
        const landingStyles = document.createElement('style');
        landingStyles.textContent = `
            header { border-bottom: none !important; border: none !important; margin-bottom: 20px !important; padding-bottom: 0 !important; }
            /* Remove logo inside the +18 frame and any dividing yellow lines */
            #landing img { display: none !important; }
            #landing { border-top: none !important; }
            hr, .divider { display: none !important; border: none !important; }
            .logo { font-size: 7.2rem !important; }
            header img { height: 192px !important; width: auto !important; }
            @media (max-width: 768px) {
                .logo { font-size: 5.4rem !important; }
                header img { height: 144px !important; }
            }
            @media (max-width: 480px) {
                .logo { font-size: 4.2rem !important; }
                header img { height: 108px !important; }
            }
        `;
        document.head.appendChild(landingStyles);

        const token = localStorage.getItem('token');
        
        // Only auto-forward if they are an actively logged-in user with a token.
        // Guests must click the +18 Enter button on every new session to legally re-verify.
        if (hasToken) {
            const intended = sessionStorage.getItem('intended_destination');
            if (intended) {
                sessionStorage.removeItem('intended_destination');
                window.location.replace(intended);
            } else {
                window.location.replace('categories.html');
            }
            return;
        }
    }

    if (document.getElementById('registerForm')) {
        setupLocationDropdowns('regProvince', 'regCity', 'regNeighborhood', false, {});
        renderSpecialtyDropdown('regServices', [], { context: 'form' });
        
        const regForm = document.getElementById('registerForm');
        
        const gestures = [
            { code: '1FU', text: '1 finger up ☝️' },
            { code: '2FU', text: '2 fingers up ✌️' },
            { code: '3FU', text: '3 fingers up 🖖' },
            { code: 'TU', text: 'Thumbs up 👍' },
            { code: 'OS', text: 'OK sign 👌' }
        ];
        const assignedGesture = gestures[Math.floor(Math.random() * gestures.length)];
        regForm.dataset.gestureCode = assignedGesture.code;

        // Add instruction text
        const instructions = document.createElement('div');
        instructions.style.backgroundColor = 'rgba(212, 175, 55, 0.1)';
        instructions.style.border = '1px solid var(--primary-gold)';
        instructions.style.padding = '15px';
        instructions.style.marginBottom = '20px';
        instructions.style.borderRadius = '8px';
        instructions.innerHTML = `
            <h3 class="gold-text" style="margin-top: 0; margin-bottom: 10px;">${t('Verification Process')}</h3>
            <p style="font-size: 0.9rem; margin-bottom: 10px;">${t('To ensure the safety and authenticity of our community, a strict verification process is required. Please follow these steps:')}</p>
            <ol style="font-size: 0.9rem; margin-left: 20px; margin-bottom: 10px;">
                <li>${t('Complete all required fields below to submit your registration.')}</li>
                <li>${t('Upload a clear photo of your Government ID (Front and Back).')}</li>
                <li>${t('Upload a personal selfie holding your ID next to your face while performing this hand position:')} <strong>${t(assignedGesture.text)}</strong></li>
            </ol>
            <p style="font-size: 0.9rem; margin-bottom: 0; color: var(--primary-gold);"><em>${t('Note: Profile photos can only be uploaded after your account is approved (which takes at least 48 hours).')}</em></p>
        `;
        regForm.parentNode.insertBefore(instructions, regForm);

        // Draft and Submit Button Logic
        const submitBtn = regForm.querySelector('button[type="submit"]') || regForm.querySelector('input[type="submit"]');
        if (submitBtn) {
            // Add a container for the buttons
            const btnContainer = document.createElement('div');
            btnContainer.style.display = 'flex';
            btnContainer.style.gap = '10px';
            submitBtn.parentNode.insertBefore(btnContainer, submitBtn);

            submitBtn.textContent = 'Submit Form';
            submitBtn.style.opacity = '0.5';
            submitBtn.disabled = true;

            const draftBtn = document.createElement('button');
            draftBtn.type = 'button';
            draftBtn.textContent = 'Save Draft';
            draftBtn.style.marginRight = '10px';
            draftBtn.style.backgroundColor = '#555';
            draftBtn.onclick = () => {
                const draftData = {
                    email: document.getElementById('regEmail')?.value || '',
                    alias: document.getElementById('regAlias')?.value || '',
                    bio: document.getElementById('regBio')?.value || '',
                    measurements: document.getElementById('regMeasurements')?.value || '',
                    height: document.getElementById('regHeight')?.value || ''
                };
                localStorage.setItem('sexappeal_reg_draft', JSON.stringify(draftData));
                alert('Draft saved locally.');
            };

            submitBtn.parentNode.insertBefore(draftBtn, submitBtn);
            // Move buttons into the container
            btnContainer.appendChild(draftBtn);
            btnContainer.appendChild(submitBtn);

            // Load Draft
            const savedDraftStr = localStorage.getItem('sexappeal_reg_draft');
            if (savedDraftStr) {
                try {
                    const draftData = JSON.parse(savedDraftStr);
                    if (document.getElementById('regEmail')) document.getElementById('regEmail').value = draftData.email;
                    if (document.getElementById('regAlias')) document.getElementById('regAlias').value = draftData.alias;
                    if (document.getElementById('regBio')) document.getElementById('regBio').value = draftData.bio;
                    if (document.getElementById('regMeasurements')) document.getElementById('regMeasurements').value = draftData.measurements;
                    if (document.getElementById('regHeight')) document.getElementById('regHeight').value = draftData.height;
                } catch(e) {}
            }

            // Validation Logic
            const validateRegForm = () => {
                const email = document.getElementById('regEmail')?.value.trim();
                const pass = document.getElementById('regPassword')?.value.trim();
                const alias = document.getElementById('regAlias')?.value.trim();
                const prov = document.getElementById('regProvince')?.value;
                const city = document.getElementById('regCity')?.value;
                const idPhotoFront = document.getElementById('regIdPhotoFront')?.files.length > 0;
                const idPhotoBack = document.getElementById('regIdPhotoBack')?.files.length > 0;
                const selfiePhoto = document.getElementById('regSelfiePhoto')?.files.length > 0;

                const allFieldsFilled = email && pass && alias && prov && city;
                const allFilesUploaded = idPhotoFront && idPhotoBack && selfiePhoto;
                if (allFieldsFilled && allFilesUploaded) {
                    submitBtn.disabled = false;
                    submitBtn.style.opacity = '1';
                } else {
                    submitBtn.disabled = true;
                    submitBtn.style.opacity = '0.5';
                }
            };

            regForm.addEventListener('input', validateRegForm);
            regForm.addEventListener('change', validateRegForm);
            validateRegForm();
        }
    }

    if (document.getElementById('filterForm')) {
        const p = new URLSearchParams(window.location.search);
        let prov = p.get('province');
        
        setupLocationDropdowns('provinceSelect', 'citySelect', 'neighborhoodSelect', true, { province: prov, city: p.get('city'), neighborhood: p.get('neighborhood') });
        try {
            await initializeFilters();
        } catch(e) {
            console.error('Error initializing dynamic filters:', e);
        }
        
        setTimeout(applyCountsToDropdowns, 500); // Trigger calculation once the DOM fully loads and options exist
    }
    if (document.getElementById('treasureGrid')) loadTreasures();
    if (document.getElementById('dashboardContent')) loadDashboard();
    if (document.getElementById('profDashboardContent')) loadProfDashboard();
    if (document.getElementById('treasureDetail')) loadTreasureDetails();

});
