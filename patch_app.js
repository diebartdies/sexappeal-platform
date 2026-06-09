const fs = require('fs');
const path = require('path');

console.log('--- Running Professional Features Patcher ---');

const filesToPatch = [
    {
        path: 'public/js/app.js',
        replacements: [
            {
                name: 'Language Button (ES)',
                search: /<span title="Cambiar a Español">🇦🇷 ES<\/span>/g,
                replace: `<span title="Cambiar a Español">🇪🇸 ES</span>`,
                check: /🇪🇸 ES/
            },
            {
                name: 'Translations',
                search: /'Edit Profile': 'Editar Perfil',/g,
                replace: `'Edit Profile': 'Editar Perfil',\n        'Phone Call': 'Llamada Telefónica',\n        'Welcome to SexAppeal!': '¡Bienvenida a SexAppeal!',\n        'You are now approved and ready to upload your personal photos. Note: The first photo will be treated as your profile Thumbnail. You can drag and drop photos below to change their order at any time.': 'Ya estás aprobada y lista para subir tus fotos personales. Nota: La primera foto será tu miniatura de perfil. Puedes arrastrar y soltar las fotos a continuación para cambiar su orden en cualquier momento.',`,
                check: /'Phone Call': 'Llamada Telefónica'/
            },
            {
                name: 'Phone Call Button',
                search: /\$\{hasWhatsapp \? \`<button onclick="contactOnWhatsApp\('\$\{prof\.alias\}'\)">\$\{t\('Contact on WhatsApp'\)\}<\/button>\` : ''\}/g,
                replace: `\${hasWhatsapp ? \`<button onclick="contactOnWhatsApp('\${prof.alias}')">\${t('Contact on WhatsApp')}</button>\` : ''}\n                        \${hasWhatsapp ? \`<button onclick="contactOnPhone('\${prof.alias}')" style="background: transparent; border: 1px solid var(--primary-gold); color: var(--primary-gold);">\${t('Phone Call')}</button>\` : ''}`,
                check: /contactOnPhone/
            },
            {
                name: 'contactOnPhone function',
                search: /\/\/ --- Admin Dashboard Grid ---/g,
                replace: `// Contact on Phone\nfunction contactOnPhone(alias) {\n    if (typeof plausible === 'function') {\n        plausible('Phone Click', { props: { professional: alias } });\n    }\n    const url = \`\${API_URL}/professionals/\${encodeURIComponent(alias)}/phone\`;\n    window.open(url, '_self');\n}\n\n// --- Admin Dashboard Grid ---`,
                check: /function contactOnPhone/
            },
            {
                name: 'Welcome Alert',
                search: /alertsHtml \+= \`<div style="background: rgba\(212,175,55,0\.1\); border-left: 4px solid var\(--primary-gold\); padding: 10px; margin-bottom: 10px;">📸 <strong>Action Required:<\/strong> Please upload at least one photo below to appear in the directory\.<\/div>\`;/g,
                replace: `alertsHtml += \`<div style="background: rgba(212,175,55,0.1); border-left: 4px solid var(--primary-gold); padding: 15px; margin-bottom: 10px; line-height: 1.5;">🎉 <strong style="color: var(--primary-gold);">\${t('Welcome to SexAppeal!')}</strong><br>\${t('You are now approved and ready to upload your personal photos. Note: The first photo will be treated as your profile Thumbnail. You can drag and drop photos below to change their order at any time.')}</div>\`;`,
                check: /Welcome to SexAppeal/
            },
            {
                name: 'Photo Drag and Drop',
                search: /item\.addEventListener\('click',\s*\(\)\s*=>\s*\{\s*if\s*\(confirm\('Are you sure you want to remove this photo from your gallery\?'\)\)\s*\{\s*if\s*\(newFilesMap\.has\(img\.src\)\)\s*\{\s*URL\.revokeObjectURL\(img\.src\);\s*newFilesMap\.delete\(img\.src\);\s*\}\s*item\.remove\(\);\s*\}\s*\}\);\s*grid\.appendChild\(item\);/g,
                replace: `// --- Drag and Drop Logic ---\n    item.draggable = true;\n    item.addEventListener('dragstart', function(e) {\n        e.dataTransfer.effectAllowed = 'move';\n        e.dataTransfer.setData('text/plain', img.src);\n        item.classList.add('dragging');\n        setTimeout(() => item.style.opacity = '0.5', 0);\n    });\n    item.addEventListener('dragend', function() {\n        item.classList.remove('dragging');\n        item.style.opacity = '1';\n    });\n    item.addEventListener('dragover', function(e) {\n        e.preventDefault();\n        e.dataTransfer.dropEffect = 'move';\n    });\n    item.addEventListener('dragenter', function(e) {\n        e.preventDefault();\n        if (this !== document.querySelector('.dragging')) this.style.transform = 'scale(1.05)';\n    });\n    item.addEventListener('dragleave', function() {\n        this.style.transform = 'scale(1)';\n    });\n    item.addEventListener('drop', function(e) {\n        e.preventDefault();\n        this.style.transform = 'scale(1)';\n        const draggedItem = document.querySelector('.dragging');\n        if (draggedItem && draggedItem !== this) {\n            let allItems = [...grid.querySelectorAll('.photo-item')];\n            let draggedIndex = allItems.indexOf(draggedItem);\n            let targetIndex = allItems.indexOf(this);\n            if (draggedIndex < targetIndex) this.after(draggedItem);\n            else this.before(draggedItem);\n        }\n    });\n\n    overlay.addEventListener('click', (e) => {\n        e.stopPropagation();\n        if (confirm('Are you sure you want to remove this photo from your gallery?')) {\n            if (newFilesMap.has(img.src)) {\n                URL.revokeObjectURL(img.src);\n                newFilesMap.delete(img.src);\n            }\n            item.remove();\n        }\n    });\n\n    const frame = grid.querySelector('.add-photo-frame');\n    if (frame) grid.insertBefore(item, frame);\n    else grid.appendChild(item);`,
                check: /Drag and Drop Logic/
            }
        ]
    },
    {
        path: 'public/dashboard.html',
        replacements: [
            {
                name: 'Edit Profile Header',
                search: /<h3 class="gold-text" style="margin-bottom: 25px;">Update Your Profile<\/h3>/g,
                replace: `<h3 class="gold-text" style="margin-bottom: 25px; display: flex; align-items: center; gap: 10px;"><svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="var(--primary-gold)" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M12 20h9"></path><path d="M16.5 3.5a2.121 2.121 0 0 1 3 3L7 19l-4 1 1-4L16.5 3.5z"></path></svg> <span data-i18n>Edit Profile</span></h3>`,
                check: /<svg width="24" height="24"/
            }
        ]
    },
    {
        path: 'controllers/professionalController.js',
        replacements: [
            {
                name: 'contactPhone Controller',
                search: /$/s,
                replace: `\n// @desc    Redirect to Professional's Phone (Anti-Scraping Protection)\n// @route   GET /api/v1/professionals/:alias/phone\n// @access  Public\nexports.contactPhone = async (req, res, next) => {\n  try {\n    const professional = await User.findOne({ \n      'professionalProfile.alias': req.params.alias,\n      role: 'professional',\n      isVerified: true\n    }).select('professionalProfile.whatsappNumber professionalProfile.alias');\n\n    if (!professional || !professional.professionalProfile.whatsappNumber) {\n      return res.status(404).send('Phone contact not available for this professional.');\n    }\n\n    const cleanNumber = professional.professionalProfile.whatsappNumber.replace(/\\D/g, '');\n    const phoneUrl = \`tel:+\${cleanNumber}\`;\n\n    // Track the Phone Click Activity\n    try {\n      await ActivityLog.create({\n        professional: professional._id,\n        action: 'phone_click',\n        ipAddress: req.ip,\n        userAgent: req.headers['user-agent']\n      });\n    } catch(err) { console.error('Activity log error:', err.message); }\n\n    res.redirect(phoneUrl);\n  } catch (error) {\n    res.status(400).send('Unable to redirect to phone.');\n  }\n};\n`,
                check: /exports\.contactPhone/
            }
        ]
    },
    {
        path: 'server.js',
        replacements: [
            {
                name: 'Add Phone Route',
                search: /app\.get\('\/api\/v1\/professionals\/:alias\/whatsapp',\s*professionalController\.contactWhatsApp\);/g,
                replace: `app.get('/api/v1/professionals/:alias/whatsapp', professionalController.contactWhatsApp);\napp.get('/api/v1/professionals/:alias/phone', professionalController.contactPhone);`,
                check: /app\.get\('\/api\/v1\/professionals\/:alias\/phone'/
            }
        ]
    }
];

filesToPatch.forEach(file => {
    const filePath = path.join(__dirname, file.path);
    if (fs.existsSync(filePath)) {
        let content = fs.readFileSync(filePath, 'utf8');
        let modified = false;

        file.replacements.forEach(rep => {
            if (rep.check && rep.check.test(content)) {
                console.log(`✅ [Skipped] ${rep.name} already applied in ${file.path}`);
            } else if (rep.search.test(content)) {
                content = content.replace(rep.search, rep.replace);
                modified = true;
                console.log(`✅ [Applied] ${rep.name} applied to ${file.path}`);
            } else {
                console.log(`⚠️ [Not Found] Could not find insertion point for ${rep.name} in ${file.path}`);
            }
        });

        if (modified) {
            fs.writeFileSync(filePath, content, 'utf8');
        }
    } else {
        console.log(`❌ [Error] File not found: ${filePath}`);
    }
});

console.log('--- Patching Complete ---');