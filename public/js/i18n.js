// Internationalization (i18n)
const translations = {
    'es': {
        // Landing Page
        'I am 18+ - Enter': 'Soy mayor de 18 - Entrar',
        'I AM +18 - ENTER': 'SOY MAYOR DE 18 - ENTRAR',
        'Entering...': 'Entrando...',
        'Uploading...': 'Subiendo...',
        'Exit': 'Salir',
        'Elegance Defined': 'Elegancia Definida',
        'Discover our veiled collection of Living Treasures.': 'Descubra nuestra colección velada de Tesoros Vivos.',
        'Entrance': 'Entrada',
        'You must be 18 years or older to enter this sanctuary.': 'Debe ser mayor de 18 años para ingresar a este santuario.',

        // Age-verification + Terms & Conditions acceptance
        'Age Verification & Terms': 'Verificación de edad y Términos',
        'Accept & Enter': 'Aceptar e ingresar',
        'Read the full Terms & Conditions': 'Leer los Términos y Condiciones completos',
        'Terms & Conditions': 'Términos y Condiciones',
        'Date Modified:': 'Fecha de modificación:',
        'Close': 'Cerrar',
        'I have read and accept the terms and conditions.': 'He leído y acepto los términos y condiciones.',
        'I have read and accept the': 'He leído y acepto los',
        'terms and conditions': 'términos y condiciones',
        'You must accept the terms and conditions to register.': 'Debe aceptar los términos y condiciones para registrarse.',
        'This site is intended solely for use by individuals who are at least eighteen (18) years old and have reached the age of majority where they live. By using this site, you confirm to us that you are not underage. By proceeding beyond this notice, you consent to our Terms & Conditions. Unauthorized usage of this site could breach relevant laws.': 'Este sitio está destinado exclusivamente a personas que tengan al menos dieciocho (18) años y que hayan alcanzado la mayoría de edad en el lugar donde residen. Al utilizar este sitio, usted nos confirma que no es menor de edad. Al continuar más allá de este aviso, usted presta su consentimiento a nuestros Términos y Condiciones. El uso no autorizado de este sitio podría infringir las leyes aplicables.',
        'SexAppeal does not create, produce, or modify any of the content found in the ads, yet all ads posted must adhere to our standards regarding age and content.': 'SexAppeal no crea, produce ni modifica ninguno de los contenidos que aparecen en los anuncios; no obstante, todos los anuncios publicados deben cumplir con nuestros estándares en materia de edad y contenido.',
        'SexAppeal enforces a strict policy against human trafficking, prostitution, and any illegal activities. We work in collaboration with law enforcement, following legal procedures such as subpoenas, to investigate any criminal actions. Breaching our strict policy may lead to reporting to law enforcement. I pledge not to use this site in a manner that contravenes SexAppeal\u2019s policies, or any national, state, or local laws, and I commit to reporting any infringements to the authorities.': 'SexAppeal aplica una política estricta contra la trata de personas, la prostitución y cualquier actividad ilegal. Colaboramos con las fuerzas de seguridad y seguimos los procedimientos legales correspondientes, como las órdenes judiciales, para investigar cualquier acción delictiva. El incumplimiento de nuestra política estricta puede dar lugar a una denuncia ante las fuerzas de seguridad. Me comprometo a no utilizar este sitio de manera que contravenga las políticas de SexAppeal ni ninguna ley nacional, provincial o local, y me comprometo a denunciar cualquier infracción ante las autoridades.',
        'Additionally, I agree to report any suspected cases of exploitation of minors and/or human trafficking to the relevant authorities.': 'Asimismo, me comprometo a denunciar ante las autoridades competentes cualquier caso sospechado de explotación de menores y/o trata de personas.',
        'Professional Access:': 'Acceso Profesional:',
        'Professional Login': 'Inicio Profesional',
        'Professional Registration': 'Registro Profesional',
        'Professional registration': 'Registro profesional',
        'Join SexAppeal as a Living Treasure. Complete every required field and upload your verification photos. Admin review typically takes up to 48 hours.': 'Únase a SexAppeal como Tesoro Vivo. Complete todos los campos obligatorios y cargue sus fotos de verificación. La revisión del administrador suele demorar hasta 48 horas.',
        'Quick signup — only what you need to get started. We will help you complete your profile and photos.': 'Registro rápido — solo lo necesario para empezar. Te ayudamos a completar tu perfil y tus fotos.',
        'We never ask you to register a payment method — no card, no automatic debit.': 'No pedimos registrar ningún medio de pago — ni tarjeta, ni débito automático.',
        'Quick registration': 'Registro rápido',
        'Leave your email, phone and birth date. Our team completes your profile and uploads your photos — you do not need to do it alone.': 'Dejá tu email, teléfono y fecha de nacimiento. Nuestro equipo completa tu perfil y sube tus fotos — no tenés que hacerlo sola.',
        'Leave your email, phone and age. Our team completes your profile and uploads your photos — you do not need to do it alone.': 'Dejá tu email, teléfono y fecha de nacimiento. Nuestro equipo completa tu perfil y sube tus fotos — no tenés que hacerlo sola.',
        'We calculate your age automatically — you must be 18 or older.': 'Calculamos tu edad automáticamente — debés ser mayor de 18.',
        'Format: dd/mm/aaaa. We calculate your age automatically — you must be 18 or older.': 'Formato: dd/mm/aaaa. Calculamos tu edad automáticamente — debés ser mayor de 18.',
        'Format: mm/dd/yyyy. We calculate your age automatically — you must be 18 or older.': 'Format: mm/dd/yyyy. We calculate your age automatically — you must be 18 or older.',
        'Country code': 'Código de país',
        'Fill in the four fields below.': 'Completá los campos de abajo.',
        'Fill in the fields below.': 'Completá los campos de abajo.',
        'Confirm password': 'Confirmar contraseña',
        'We contact you on WhatsApp and finish the rest together.': 'Te contactamos por WhatsApp y terminamos el resto juntas.',
        'WhatsApp number — we will contact you here to finish your profile.': 'Número de WhatsApp — te contactamos acá para terminar tu perfil.',
        'To sign in to your panel after email verification.': 'Para entrar a tu panel después de verificar el email.',
        'Age': 'Edad',
        'Please enter a valid age (18–99).': 'Ingresá una edad válida (18–99).',
        'Express registration — complete profile in Admin': 'Registro rápido — completar perfil en Admin',
        'No ID photos yet — request gallery photos on WhatsApp, then upload in Edit Professional.': 'Sin fotos de DNI — pedí las fotos de galería por WhatsApp y subilas en Editar profesional.',
        'To ensure the safety and authenticity of our community, please complete every mandatory field and upload the three verification photos.': 'Para garantizar la seguridad y autenticidad de nuestra comunidad, complete todos los campos obligatorios y cargue las tres fotos de verificación.',
        'Fill in your identity and contact details exactly as shown on your ID.': 'Complete sus datos de identidad y contacto exactamente como figuran en su DNI.',
        'Upload clear photos of your ID (front and back).': 'Cargue fotos claras de su DNI (frente y dorso).',
        'Upload a selfie holding your ID next to your face while performing this hand position:': 'Cargue una selfie sosteniendo su DNI junto a su rostro realizando esta posición de mano:',
        'Choose your category and specialties. Monthly pricing applies from next month onward.': 'Elija su categoría y especialidades. La tarifa mensual aplica desde el mes siguiente.',
        'Country': 'País',
        'Select country...': 'Seleccione país...',
        'Location': 'Ubicación',

        // Professional registration form
        'Identity': 'Identidad',
        'Name': 'Nombre',
        'Middle Name': 'Segundo nombre',
        'Surname': 'Apellido',
        'ID Number': 'Número de DNI',
        'Birth date': 'Fecha de nacimiento',
        'Address': 'Domicilio',
        'Street': 'Calle',
        'Number': 'Número',
        'Floor': 'Piso',
        'Apartment': 'Departamento',
        'Depto/Appart': 'Depto/Appart',
        'Post Code': 'Código postal',
        'CP/PC': 'CP/PC',
        'Connection Info': 'Datos de contacto',
        'Password (min 6)': 'Contraseña (mín. 6)',
        'Mobile phone': 'Teléfono móvil',
        'App Configuration': 'Configuración',
        'Category': 'Categoría',
        'Specialties': 'Especialidades',
        'Monthly Price': 'Precio mensual',
        'Unit': 'Unidad',
        'Required registration photos': 'Fotos obligatorias de registro',
        'Photo of your ID (Front)': 'Foto del DNI (frente)',
        'Photo of your ID (Back)': 'Foto del DNI (dorso)',
        'Selfie holding your ID': 'Selfie sosteniendo su DNI',
        'Submit Registration': 'Enviar registro',
        'No file chosen': 'Ningún archivo seleccionado',
        'Select a category...': 'Seleccione categoría...',
        'After admin approval, sign in and choose your category, specialties, bio, and photos from your professional dashboard.': 'Tras la aprobación del administrador, inicie sesión y elija su categoría, especialidades, biografía y fotos desde su panel profesional.',
        'Complete your profile setup': 'Complete la configuración de su perfil',
        'Choose your category and at least one specialty below. You can also complete your bio, address, availability, and photos on this page before saving.': 'Elija su categoría y al menos una especialidad abajo. También puede completar su biografía, dirección, disponibilidad y fotos en esta página antes de guardar.',
        'Category pricing': 'Precios por categoría',
        'Category and specialties saved. Continue completing your profile below.': 'Categoría y especialidades guardadas. Continúe completando su perfil abajo.',
        'Required field missing:': 'Campo obligatorio faltante:',
        'Already registered?': '¿Ya está registrada?',
        'Login here': 'Iniciar sesión aquí',
        'Back to entrance': 'Volver a la entrada',
        'Registration is not finished. If you leave now, your changes will be lost. Continue?': 'El registro no está completo. Si sale ahora, perderá los datos ingresados. ¿Desea continuar?',
        'Age requirement': 'Requisito de edad',
        'Leave registration': 'Abandonar registro',
        'Change birth date': 'Cambiar fecha de nacimiento',
        'You must be at least 18 years old to register as a professional.': 'Debe ser mayor de 18 años para registrarse como profesional.',
        'When you submit, we send a 6-digit verification code to your email. It may arrive in Spam or Junk.': 'Al enviar, le enviaremos un código de verificación de 6 dígitos por correo. Puede llegar a Spam o Correo no deseado.',
        'Sign in with your professional account email.': 'Inicie sesión con el correo de su cuenta profesional.',
        'Enter Sanctuary': 'Entrar al Santuario',
        'No account found with this email address.': 'No existe una cuenta con este correo electrónico.',
        'Did you mistype your email? Check it and try again, or register as a professional.': '¿Escribió mal su correo? Revíselo e intente de nuevo, o regístrese como profesional.',
        'Try again': 'Intentar de nuevo',
        'Incorrect password. Please try again.': 'Contraseña incorrecta. Intente de nuevo.',
        "Don't have an access yet?": '¿Aún no tiene acceso?',
        'Register as a professional': 'Registrarse como profesional',
        'Email': 'Correo',
        'Google login failed': 'Error al iniciar sesión con Google',
        'Please verify your email before logging in': 'Verifique su correo electrónico antes de iniciar sesión',
        'I forgot my password': 'Olvidé mi contraseña',
        'Confirm your email to receive a recovery code.': 'Confirme su correo para recibir un código de recuperación.',
        'Send recovery code': 'Enviar código de recuperación',
        'Recovery code sent to:': 'Código enviado a:',
        '6-Digit Code': 'Código de 6 dígitos',
        'New Password (Min 6 chars)': 'Nueva contraseña (mín. 6 caracteres)',
        'Confirm Password': 'Confirmar contraseña',
        'Passwords do not match': 'Las contraseñas no coinciden',
        'Password must be at least 6 characters': 'La contraseña debe tener al menos 6 caracteres',
        'Back to login': 'Volver al inicio de sesión',
        'Recover Access': 'Recuperar acceso',
        'Enter recovery code': 'Ingrese el código de recuperación',
        'Please provide an email address': 'Ingrese su correo electrónico',
        'Please provide an email and password': 'Ingrese su correo y contraseña',
        'There is no user with that email': 'No existe un usuario con ese correo',
        'Invalid or expired reset code': 'Código inválido o expirado',
        'Enter your email to receive a recovery code.': 'Ingrese su correo para recibir un código de recuperación.',
        
        // General
        'Loading...': 'Cargando...',
        'All': 'Todos',
        'Select...': 'Seleccionar...',
        'Login': 'Iniciar Sesión',
        'Register': 'Registrarse',
        'Logout': 'Cerrar sesión',
        'Back': 'Volver',
        'Desktop: Click & Drag to scroll | Mobile: Swipe left/right': 'Escritorio: Clic y arrastrar | Móvil: Deslizar',
        'Tap a photo to read the service description.': 'Tocá una foto para leer la descripción del servicio.',
        'Service Description': 'Descripción del servicio',
        'No service description available.': 'No hay descripción del servicio disponible.',
        'Describe your services for visitors on your public profile.': 'Describí tus servicios para los visitantes de tu perfil público.',
        'Upload Receipt': 'Subir recibo de pago (foto o archivo)',
        'Close': 'Cerrar',
        'Save Changes': 'Guardar Cambios',
        'Edit': 'Editar',
        'Edit Profile': 'Editar Perfil',
        'Phone Call': 'Llamada Telefónica',
        'Welcome to SexAppeal!': '¡Bienvenida a SexAppeal!',
        'Free evaluation month:': 'Mes de evaluación gratis:',
        'Your first 30 days are free. During this period your profile appears in a random category so you can experience how visibility works.': 'Tus primeros 30 días son gratis. En este período tu perfil aparece en una categoría asignada al azar para que conozcas cómo funciona la visibilidad.',
        'Your chosen category:': 'Tu categoría elegida:',
        'After your first paid month is validated by Admin, you move to the category you selected at registration and pay that rate.': 'Cuando el Admin valide tu primer pago mensual, pasarás a la categoría que elegiste al registrarte y pagarás esa tarifa.',
        'Vacations:': 'Vacaciones:',
        'While on vacation your profile shows as inactive. Up to 15 vacation days per month are discounted from your monthly balance.': 'Durante vacaciones tu perfil figura como inactivo. Hasta 15 días de vacaciones por mes se descuentan de tu saldo mensual.',
        'Monthly payment:': 'Pago mensual:',
        'Use Pago mensual to upload your receipt. Tap Cómo pagar for transfer details.': 'Usá Pago mensual para subir tu comprobante. Tocá Cómo pagar para ver los datos de transferencia.',
        'Evaluation period (free month)': 'Período de evaluación (mes gratis)',
        'Visible category now': 'Categoría visible ahora',
        'random during evaluation': 'asignada al azar durante la evaluación',
        'Your chosen category after first validated payment': 'Tu categoría elegida tras el primer pago validado',
        'Trial ends': 'Fin del mes gratis',
        'Evaluation period': 'Período de evaluación',
        'visible now': 'visible ahora',
        'Chosen category': 'Categoría elegida',
        'applied after first validated payment': 'se aplica tras el primer pago validado',
        'Desired category:': 'Categoría deseada:',
        'Max 20 calendar days per request. Up to 15 days per month are discounted from your monthly balance. One vacation request per year.': 'Máximo 20 días corridos por solicitud. Hasta 15 días por mes se descuentan de tu saldo mensual. Una solicitud de vacaciones por año.',
        'Scraped Phone Leads': 'Leads de teléfonos',
        'WhatsApp outreach uses the welcome message with platform registration link.': 'El mensaje de WhatsApp incluye la bienvenida y el enlace de registro a la plataforma.',
        'Preview invite message': 'Vista previa del mensaje',
        'Invite message preview': 'Vista previa del mensaje de invitación',
        'Sample alias': 'Alias de ejemplo',
        'Cold WhatsApp step 1 — same text as automatic drip / Twilio template watext': 'WhatsApp frío paso 1 — mismo texto que el envío automático / plantilla watext en Twilio',
        'Logo image': 'Imagen del logo',
        'Register link': 'Link de registro',
        'Date Added': 'Fecha',
        'Alias': 'Alias',
        'Phone Number': 'Teléfono',
        'Source': 'Origen',
        'Status': 'Estado',
        'Refresh List': 'Actualizar lista',
        'Bulk WhatsApp (pending)': 'WhatsApp masivo (pendientes)',
        'Apply Invitations': 'Aplicar Invitaciones',
        'Apply Invitations to Potential Professionals': 'Aplicar Invitaciones a Profesionales Potenciales',
        'Send the welcome WhatsApp invitation with platform and registration links from the potential professionals table.': 'Envíe la invitación de WhatsApp con enlaces a la plataforma y al registro desde la tabla de profesionales potenciales.',
        'Prefer a small selected batch first, then Apply to all pending if all looks good.': 'Primero prefiera un lote pequeño seleccionado; luego use Aplicar a todas las pendientes si todo se ve bien.',
        'Select pending': 'Seleccionar pendientes',
        'Apply invitation to selected': 'Aplicar invitación a seleccionadas',
        'Apply to all pending': 'Aplicar a todas las pendientes',
        'Send invite': 'Enviar invitación',
        'Select at least one pending lead': 'Seleccione al menos un prospecto pendiente',
        'Apply the platform invitation to {count} selected potential professional(s)?': '¿Aplicar la invitación de la plataforma a {count} profesional(es) potencial(es) seleccionada(s)?',
        'Apply the platform invitation to ALL pending potential professionals? This cannot be undone easily.': '¿Aplicar la invitación de la plataforma a TODAS las profesionales potenciales pendientes? No se puede deshacer fácilmente.',
        'Could not start invitation outreach': 'No se pudo iniciar el envío de invitaciones',
        'Failed to load leads.': 'No se pudieron cargar los prospectos.',
        'Select': 'Seleccionar',
        'Invitation': 'Invitación',
        'Bulk outreach progress': 'Progreso del envío masivo',
        'Channel': 'Canal',
        'SMS': 'SMS',
        'pending': 'pendiente',
        'sent': 'enviado',
        'failed': 'fallido',
        'Paused — waiting for the sending window.': 'En pausa — esperando la ventana de envío.',
        'Scan QR with WhatsApp on your phone': 'Escaneá el QR con WhatsApp en tu teléfono',
        'Send the welcome WhatsApp message to ALL pending leads? This cannot be undone easily.': '¿Enviar el mensaje de bienvenida por WhatsApp a TODOS los leads pendientes?',
        'Could not start bulk outreach': 'No se pudo iniciar el envío masivo',
        'Waiting for WhatsApp login — scan the QR code.': 'Esperando inicio de sesión en WhatsApp — escaneá el código QR.',
        'Connecting to WhatsApp...': 'Conectando con WhatsApp...',
        'Sending messages...': 'Enviando mensajes...',
        'Bulk outreach complete.': 'Envío masivo completado.',
        'Bulk outreach failed.': 'Falló el envío masivo.',
        'Ready': 'Listo',
        'Sent': 'Enviados',
        'Failed': 'Fallidos',
        'Skipped': 'Omitidos',
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
        'Reject registration': 'Rechazar registro',
        'Select a rejection reason and describe which photos or details need correction. An email will be sent to the professional.': 'Seleccione un motivo de rechazo y describa qué fotos o datos deben corregirse. Se enviará un correo a la profesional.',
        'Rejection reason': 'Motivo del rechazo',
        'Select a reason...': 'Seleccione un motivo...',
        'Photos are not clear enough to validate information': 'Las fotos no son lo suficientemente claras para validar la información',
        'Photo information doesnt match registration info.': 'La información de las fotos no coincide con el registro.',
        'General failure': 'Fallo general',
        'Rejection details': 'Detalle del rechazo',
        'e.g. ID Front, ID Back, Selfie — specify which pictures need to be re-uploaded': 'ej. DNI frente, DNI dorso, Selfie — indique qué fotos deben volver a subirse',
        'Send rejection email': 'Enviar correo de rechazo',
        'Please select a rejection reason.': 'Seleccione un motivo de rechazo.',
        'Please provide rejection details in the text field.': 'Complete el campo de texto con el detalle del rechazo.',
        'Rejection email sent successfully.': 'Correo de rechazo enviado correctamente.',
        'Verification Rejected': 'Verificación rechazada',
        'Your profile was not approved. Please contact support.': 'Su perfil no fue aprobado. Contacte a soporte.',
        'Action required: update your verification': 'Acción requerida: actualice su verificación',
        'Resubmission photos unclear intro': 'Las fotos no son lo suficientemente claras para validar la información: vuelva a subir las siguientes fotos.',
        'Resubmission photo mismatch intro': 'La información de las fotos no coincide con el registro: vuelva a subir las siguientes fotos.',
        'Use the verification upload section below to replace your ID photos and selfie, and correct any registration details if needed.': 'Use la sección de carga inferior para reemplazar sus fotos de DNI y selfie, y corrija los datos del registro si es necesario.',
        'Re-upload verification photos': 'Volver a subir fotos de verificación',
        'Upload clear replacements for ID front, ID back, and selfie with gesture.': 'Suba reemplazos claros del DNI (frente y dorso) y la selfie con el gesto indicado.',
        'ID Front photo': 'Foto DNI frente',
        'ID Back photo': 'Foto DNI dorso',
        'Selfie photo': 'Foto selfie',
        'ID Front': 'DNI frente',
        'ID Back': 'DNI dorso',
        'Selfie': 'Selfie',
        'Submit verification for review': 'Enviar verificación para revisión',
        'All three verification photos are required (ID front, ID back, selfie).': 'Se requieren las tres fotos de verificación (DNI frente, dorso y selfie).',
        'Verification submitted for review.': 'Verificación enviada para revisión.',
        'Submission failed': 'Error al enviar',
        'Open profile editor to fix verification': 'Abrir editor de perfil para corregir verificación',
        'Cancel': 'Cancelar',
        'Delete': 'Eliminar',
        'Delete professional': 'Eliminar profesional',
        'This will permanently delete this professional and all their data. This action cannot be undone.': 'Esto eliminará permanentemente a este profesional y todos sus datos. Esta acción no se puede deshacer.',
        'Professional deleted successfully.': 'Profesional eliminado con éxito.',
        'Failed to delete professional': 'No se pudo eliminar al profesional',
        'ID Number is required.': 'El número de documento es obligatorio.',
        'ID Number must have 8 digits in the format XX.XXX.XXX (e.g. 45.678.901).': 'El DNI debe tener 8 dígitos con formato XX.XXX.XXX (ej. 45.678.901).',
        'ID Number must start with a digit greater than 2 (young DNI format, e.g. 45.678.901).': 'El DNI debe comenzar con un dígito mayor a 2 (formato joven, ej. 45.678.901).',
        'Invalid ID Number format. Use XX.XXX.XXX with dots after the million and thousand groups.': 'Formato de DNI inválido. Use XX.XXX.XXX con puntos en millones y miles.',
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
        '🔴 Currently Inactivo': '🔴 Actualmente Inactivo',
        'Specialties:': 'Especialidades:',
        'Location:': 'Ubicación:',
        'Measurements:': 'Medidas:',
        'Height:': 'Estatura:',
        'Schedule:': 'Horario:',
        'Days:': 'Días:',
        'Hours:': 'Horas:',
        'Everyday': 'Todos los días',
        'Monday': 'Lunes',
        'Tuesday': 'Martes',
        'Wednesday': 'Miércoles',
        'Thursday': 'Jueves',
        'Friday': 'Viernes',
        'Saturday': 'Sábado',
        'Sunday': 'Domingo',
        'Mon': 'Lun',
        'Tue': 'Mar',
        'Wed': 'Mié',
        'Thu': 'Jue',
        'Fri': 'Vie',
        'Sat': 'Sáb',
        'Sun': 'Dom',
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
        'Important — check your email': 'Importante — revise su correo',
        'When you submit, we send a 6-digit verification code to your email. It may arrive in Spam or Junk — please check those folders before contacting support.': 'Al enviar el formulario, le enviaremos un código de verificación de 6 dígitos a su correo. Puede llegar a Spam o Correo no deseado — revise esas carpetas antes de contactarnos.',
        'When you submit, we will email you a 6-digit verification code. Check your inbox AND your Spam/Junk folder — our emails often land there. Continue?': 'Al enviar, le enviaremos un código de verificación de 6 dígitos por correo. Revise su bandeja de entrada Y la carpeta de Spam/Correo no deseado — nuestros mensajes suelen llegar allí. ¿Continuar?',
        'Pending Admin Approval': 'Aprobación de Administrador Pendiente',
        'Your profile is under review (typically up to 48 hours). Profile changes can only be made after admin approval. You will receive an email when your account is approved — please check your Spam folder too.': 'Su perfil está en revisión (normalmente hasta 48 horas). Solo podrá modificar su perfil después de la aprobación. Recibirá un correo cuando su cuenta sea aprobada — revise también la carpeta de Spam.',
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
        'Dashboard Config': 'Panel de configuración',
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
        'Mail: Special Messages': 'Correo: Mensajes Especiales',
        'Send email only to the professionals you select below.': 'Envíe correo solo a las profesionales que seleccione abajo.',
        'Select all': 'Seleccionar todo',
        'Clear selection': 'Limpiar selección',
        'Send to selected': 'Enviar a seleccionadas',
        'Send this email to {count} selected professional(s)?': '¿Enviar este correo a {count} profesional(es) seleccionada(s)?',
        'Select at least one recipient': 'Seleccione al menos un destinatario',
        'Failed to send messages': 'No se pudieron enviar los mensajes',
        'The greeting "Hello [Alias]," is added automatically for each recipient.': 'El saludo "Hola [Alias]," se agrega automáticamente para cada destinatario.',
        'WA: Special Messages': 'WA: Mensajes Especiales',
        'Send WhatsApp only to the leads or professionals you select. Leave the message blank to use the default invite template.': 'Envíe WhatsApp solo a los prospectos o profesionales que seleccione. Deje el mensaje en blanco para usar la plantilla de invitación predeterminada.',
        'Scraped leads': 'Prospectos scrapeados',
        'Registered professionals': 'Profesionales registradas',
        'Custom message (optional)': 'Mensaje personalizado (opcional)',
        'Use {alias} as a placeholder for the recipient name.': 'Use {alias} como marcador del nombre de la destinataria.',
        'Outreach progress': 'Progreso de envío',
        'Send WhatsApp to selected': 'Enviar WhatsApp a seleccionadas',
        'Send WhatsApp to {count} selected recipient(s)?': '¿Enviar WhatsApp a {count} destinataria(s) seleccionada(s)?',
        'WhatsApp outreach started. Scan the QR if prompted.': 'Envío de WhatsApp iniciado. Escanee el QR si se le solicita.',
        'No professionals with WhatsApp numbers found.': 'No se encontraron profesionales con número de WhatsApp.',
        'Connecting to WhatsApp...': 'Conectando a WhatsApp...',
        'WhatsApp Configuration': 'Configuración de WhatsApp',
        'Platform settings for admin tools and automated notifications.': 'Ajustes de la plataforma para herramientas de admin y notificaciones automáticas.',
        'All outbound WhatsApp messages from the platform are sent from this number.': 'Todos los mensajes salientes de WhatsApp de la plataforma se envían desde este número.',
        'Origin number': 'Número de origen',
        'Session status': 'Estado de sesión',
        'Connected': 'Conectado',
        'Session saved — reconnect if sending fails': 'Sesión guardada — reconecte si falla el envío',
        'Not registered': 'No registrado',
        'Ready to register': 'Listo para registrar',
        'WhatsApp linked successfully': 'WhatsApp vinculado correctamente',
        'Registration failed': 'Falló el registro',
        'Change WhatsApp phone number': 'Cambiar número de WhatsApp',
        'Set the mobile number that owns the platform WhatsApp account (country code included, no +).': 'Indique el número móvil dueño de la cuenta WhatsApp de la plataforma (código de país incluido, sin +).',
        'Save number': 'Guardar número',
        'Register number on WhatsApp': 'Registrar número en WhatsApp',
        'Link the platform as a WhatsApp Web device. Open WhatsApp on the origin phone → Linked devices → Link a device, then scan the QR below.': 'Vincule la plataforma como dispositivo de WhatsApp Web. En el teléfono de origen abra WhatsApp → Dispositivos vinculados → Vincular dispositivo, luego escaneá el QR.',
        'Enter a phone number': 'Ingrese un número de teléfono',
        'Could not save phone number': 'No se pudo guardar el número',
        'WhatsApp phone number updated. Re-link WhatsApp if you changed the origin number.': 'Número de WhatsApp actualizado. Volvé a vincular WhatsApp si cambiaste el número de origen.',
        'Could not start WhatsApp registration': 'No se pudo iniciar el registro de WhatsApp',
        'Scan the QR with the origin phone within 3 minutes.': 'Escaneá el QR con el teléfono de origen dentro de 3 minutos.',
        'Could not load WhatsApp configuration': 'No se pudo cargar la configuración de WhatsApp',
        'Twilio WhatsApp API: template watext is approved. On the server run bash scripts/set-twilio-whatsapp-template.sh then use Invitations below.': 'WhatsApp API Twilio: la plantilla watext está aprobada. En el servidor ejecutá bash scripts/set-twilio-whatsapp-template.sh y luego usá Invitaciones abajo.',
        'WhatsApp disconnected': 'WhatsApp desconectado',
        'The platform WhatsApp (Tulio) is currently disconnected. Outreach and notifications will not be sent until you re-link it from Config → WhatsApp.': 'El WhatsApp de la plataforma (Tulio) está desconectado en este momento. Los envíos y notificaciones no se realizarán hasta que lo vuelvas a vincular desde Configuración → WhatsApp.',
        'Go to WhatsApp settings': 'Ir a la configuración de WhatsApp',
        'Understood': 'Entendido',
        'Launch Curtain': 'Telón de Apertura',
        'Launch curtain': 'Telón de apertura',
        'Hide grids (launch curtain)': 'Ocultar grillas (telón de apertura)',
        'Preview live grid': 'Vista previa de la grilla',
        'Preview the live grid (admins bypass the curtain)': 'Vista previa de la grilla en vivo (los administradores omiten el telón)',
        'Hide treasure grids (launch curtain)': 'Ocultar grillas de tesoros (telón de apertura)',
        'Hide treasure grids on categories, discover, and home until the grand opening. Visitors see a theater curtain with a countdown to the configured opening date.': 'Oculta las grillas en categorías, descubrir e inicio hasta la gran apertura. Los visitantes verán un telón de teatro con cuenta regresiva hasta la fecha de apertura configurada.',
        'Launch curtain is off — treasure grids are visible to visitors.': 'Telón desactivado — las grillas de tesoros son visibles para los visitantes.',
        'Grand opening date has passed — grids stay visible even with the curtain enabled.': 'La fecha de apertura ya pasó — las grillas permanecen visibles aunque el telón esté activado.',
        'Launch curtain is on — grids hidden until {date} ({days}d {hours}h remaining).': 'Telón activo — grillas ocultas hasta {date} ({days}d {hours}h restantes).',
        'Launch curtain enabled — visitor grids are now hidden.': 'Telón activado — las grillas de visitantes quedan ocultas.',
        'Launch curtain disabled — visitor grids are visible.': 'Telón desactivado — las grillas de visitantes son visibles.',
        'Could not update launch curtain': 'No se pudo actualizar el telón de apertura',
        'Could not load launch curtain settings': 'No se pudo cargar la configuración del telón',
        'Opening date & time': 'Fecha y hora de apertura',
        'Save date': 'Guardar fecha',
        'Time is interpreted in Argentina time (UTC−03:00).': 'La hora se interpreta en horario de Argentina (UTC−03:00).',
        'Enter an opening date and time': 'Ingresá una fecha y hora de apertura',
        'Opening date & time updated.': 'Fecha y hora de apertura actualizada.',
        'Grand opening curtain': 'Telón de gran apertura',
        'Grand Opening': 'Gran Apertura',
        'The curtain rises soon': 'El telón se levantará pronto',
        'Our Living Treasures will be revealed on {date}.': 'Nuestros Tesoros Vivos se revelarán el {date}.',
        'Argentina time': 'hora de Argentina',
        'Countdown to opening': 'Cuenta regresiva a la apertura',
        'Days': 'Días',
        'Hours': 'Horas',
        'Minutes': 'Minutos',
        'Seconds': 'Segundos',
        'Until then, the treasure grids remain veiled.': 'Hasta entonces, las grillas de tesoros permanecen veladas.',
        'WhatsApp linked': 'WhatsApp vinculado',
        'Re-link WhatsApp': 'Volver a vincular WhatsApp',
        'Automatic sending (WhatsApp)': 'Envío automático (WhatsApp)',
        'Sends cold template invitations in 5 batches of 50, pausing 30 minutes between batches (250/day — Meta cold-outreach limit). Stops when the daily cap is reached or no pending leads remain. Restart the next day to continue.': 'Envía invitaciones con plantilla fría en 5 lotes de 50, con pausa de 30 minutos entre lotes (250/día — límite Meta de contacto frío). Se detiene al llegar al tope diario o si no quedan pendientes. Reiniciá al día siguiente para seguir.',
        'Start sending 5×50/day': 'Iniciar envío 5×50/día',
        'Send launch message': 'Agradecer y seguir charla',
        'Send registration link': 'Enviar link de registro',
        'Incoming replies (WhatsApp)': 'Respuestas entrantes (WhatsApp)',
        'Replies appear here — no need to open Twilio Console. Respond from this panel with custom text or the preset buttons.': 'Las respuestas aparecen acá — no hace falta entrar a Twilio Console. Respondé desde este panel con texto libre o los botones predefinidos.',
        'One-time setup — paste this webhook URL in Twilio → WhatsApp sender → Incoming message': 'Configuración única — pegá esta URL en Twilio → remitente WhatsApp → mensaje entrante',
        'Webhook URL': 'URL del webhook',
        'Refresh replies': 'Actualizar respuestas',
        'WhatsApp Inbox': 'Bandeja WhatsApp',
        'Browse WhatsApp replies here — no Twilio Console needed.': 'Revisá respuestas de WhatsApp acá — no hace falta Twilio Console.',
        'Auto-refresh 15s': 'Auto-actualizar 15s',
        'Refresh': 'Actualizar',
        'Admin dashboard': 'Panel admin',
        'Search phone, alias or text…': 'Buscar teléfono, alias o texto…',
        'All messages': 'Todos los mensajes',
        'Incoming only': 'Solo entrantes',
        'Outgoing manual only': 'Solo salientes (manual)',
        'No WhatsApp messages yet. Configure the Twilio webhook and wait for replies.': 'Todavía no hay mensajes. Configurá el webhook de Twilio y esperá respuestas.',
        'Select a conversation to read messages.': 'Elegí una conversación para ver los mensajes.',
        'Could not load WhatsApp messages.': 'No se pudieron cargar los mensajes de WhatsApp.',
        'Session expired — log in again.': 'Sesión vencida — iniciá sesión de nuevo.',
        'You': 'Vos',
        'Attachment': 'Adjunto',
        'incoming': 'entrantes',
        'total messages': 'mensajes en total',
        'Open full WhatsApp inbox': 'Abrir bandeja WhatsApp completa',
        'Could not load replies': 'No se pudieron cargar las respuestas',
        'recent replies': 'respuestas recientes',
        'No replies yet — configure the Twilio webhook URL below.': 'Todavía no hay respuestas — configurá la URL del webhook abajo.',
        'When someone answers your WhatsApp invite, their message will appear here.': 'Cuando alguien responda tu invitación de WhatsApp, el mensaje aparecerá acá.',
        'Write your reply…': 'Escribí tu respuesta…',
        'Send reply': 'Enviar respuesta',
        'You': 'Vos',
        'Lead': 'Contacto',
        'Write a reply first': 'Escribí una respuesta primero',
        'Could not send reply': 'No se pudo enviar la respuesta',
        'WhatsApp reply sent.': 'Respuesta de WhatsApp enviada.',
        'Daily cold cap reached': 'Tope diario de contacto frío alcanzado',
        'Restart tomorrow.': 'Reiniciá mañana.',
        'Next batch': 'Próximo lote',
        'Current batch': 'Lote actual',
        'Stop sending': 'Detener envío',
        'Running': 'Activo',
        'Stopped': 'Detenido',
        'WhatsApp not connected — link it above first': 'WhatsApp no conectado — vinculalo arriba primero',
        'Pending leads': 'Contactos pendientes',
        'Rejected': 'Rechazados',
        'Next send': 'Próximo envío',
        'Last': 'Último',
        'Could not start automatic sending': 'No se pudo iniciar el envío automático',
        'Automatic sending started.': 'Envío automático iniciado.',
        'Could not stop automatic sending': 'No se pudo detener el envío automático',
        'Automatic sending stopped.': 'Envío automático detenido.',
        'Sending messages...': 'Enviando mensajes...',
        'Outreach complete.': 'Envío completado.',
        'Outreach failed.': 'Falló el envío.',
        'sent': 'enviados',
        'failed': 'fallidos',
        'Select a Professional to Edit': 'Seleccione un Profesional para Editar',
        'Search by Alias...': 'Buscar por Alias...',
        'Search': 'Buscar',
        'No professionals found.': 'No se encontraron profesionales.',
        'Back to List': 'Volver a la Lista',
        'Back to Dashboard': 'Volver al Panel de Admin',
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
        'Click to enlarge': 'Clic para ampliar',
        'Click a photo to enlarge and review its content.': 'Hacé clic en una foto para ampliarla y revisar su contenido.',
        'Leave the platform': 'Abandonar la plataforma',
        'If you no longer wish to remain on SexAppeal, you can permanently delete your profile and all associated data.': 'Si ya no desea permanecer en SexAppeal, puede eliminar permanentemente su perfil y todos los datos asociados.',
        'Delete my profile': 'Eliminar mi perfil',
        'Delete profile': 'Eliminar perfil',
        'This permanently removes your account, photos, statistics, and public profile. This action cannot be undone.': 'Esto elimina permanentemente su cuenta, fotos, estadísticas y perfil público. Esta acción no se puede deshacer.',
        'Enter your password to confirm': 'Ingrese su contraseña para confirmar',
        'Your password': 'Su contraseña',
        'I understand my profile will be permanently deleted and I will lose access to this account.': 'Entiendo que mi perfil se eliminará permanentemente y perderé el acceso a esta cuenta.',
        'Delete permanently': 'Eliminar permanentemente',
        'Please confirm that you understand this action is permanent.': 'Confirme que entiende que esta acción es permanente.',
        'Please provide your password to confirm account deletion': 'Ingrese su contraseña para confirmar la eliminación de la cuenta',
        'Deleting...': 'Eliminando...',
        'Unable to delete profile. Please try again.': 'No se pudo eliminar el perfil. Intente de nuevo.',
        'Your profile has been permanently deleted.': 'Su perfil ha sido eliminado permanentemente.',
        
        // Notifications & Welcome
        'Notifications & Pending Items': 'Notificaciones y Elementos Pendientes',
        'No pending actions at this time.': 'No hay acciones pendientes en este momento.',
        'Welcome Guide & How It Works': 'Guía de Bienvenida y Cómo Funciona',
        'Privacy Guarantee:': 'Garantía de Privacidad:',
        'Our platform uses zero cookies and zero third-party trackers. Your identity and client interactions remain completely confidential.': 'Nuestra plataforma no usa cookies ni rastreadores de terceros. Tu identidad y tus contactos permanecen completamente confidenciales.',
        'Visibility Control:': 'Control de Visibilidad:',
        'Uploading Photos:': 'Subida de Fotos:',
        'WhatsApp Connections:': 'Conexiones por WhatsApp:',
        'Profile Tiers:': 'Niveles de Perfil:',
        'Dismiss': 'Ocultar',
        
        // Privacy Shield
        '100% Privacy Guarantee': 'Garantía de Privacidad 100%',
        'Zero Trackers. Cookieless.': 'Cero Rastreadores. Sin Cookies.',
        "Zero cookies. Zero third-party trackers. We don't harvest your data. Check your own browser's tracker-blocker to verify and compare us with other apps.": "Cero cookies. Cero rastreadores de terceros. No recopilamos sus datos. Revise el bloqueador de rastreadores de su propio navegador para verificar y compararnos con otras apps.",

        // Payment & prof dashboard
        'Monthly payment': 'Pago mensual',
        'When you receive your invoice, upload your bank transfer or Mercado Pago receipt.': 'Cuando recibas tu factura, registrá el comprobante de transferencia o Mercado Pago.',
        'How to pay': 'Cómo pagar',
        'Register payment receipt': 'Registrar comprobante de pago',
        'Upload photo or PDF of receipt': 'Subí foto o PDF del comprobante',
        'Submit receipt': 'Enviar comprobante',
        'Transfer your monthly payment via Mercado Pago or bank transfer to the following accounts:': 'Transferí tu pago mensual por Mercado Pago o por transferencia bancaria a las siguientes cuentas:',
        'Monthly billing is calculated based on your selected category. If you change category mid-month, the amount is prorated by days in each rate (we record the change date on your profile).': 'La facturación mensual se calcula según la categoría seleccionada en tu perfil. Si cambiás de categoría durante el mes, el importe se prorratea por los días en cada tarifa (registramos la fecha del cambio en tu perfil).',
        'Current category:': 'Categoría actual:',
        'Bank:': 'Banco:',
        'Mercado Pago:': 'Mercado Pago:',
        'Receipt submitted. It will be verified by admin.': 'Comprobante enviado. Será verificado por el administrador.',
        'Failed to upload receipt': 'Error al subir el comprobante',
        'Please select a file or photo to upload.': 'Seleccione un archivo o foto para subir.',
        'Loading dashboard...': 'Cargando panel...',
        'Action Required: Rate Change': 'Acción requerida: cambio de tarifa',
        'The platform price rates have been updated. You must acknowledge this change to continue with transactions.': 'Las tarifas de la plataforma fueron actualizadas. Debe confirmar el cambio para continuar.',
        'Acknowledge Change': 'Confirmar cambio',
        'Professional Dashboard': 'Panel Profesional',
        'Statistics': 'Estadísticas',
        'Dashboard Photo Clicks': 'Clics en fotos del panel',
        'WhatsApp Button Pushes': 'Pulsaciones WhatsApp',
        'Call Button Pushes': 'Pulsaciones llamada',
        'Hourly Hits (Peak Time)': 'Visitas por hora (pico)',
        'Personal Information': 'Información personal',
        'Birth Date': 'Fecha de nacimiento',
        'Measures': 'Medidas',
        'Has fantasy wardrobe (sexy costumes, high heels)': 'Tiene vestuario de fantasía (disfraces, tacos altos)',
        'Availability': 'Disponibilidad',
        'Avail-start': 'Inicio disponibilidad',
        'Avail-end': 'Fin disponibilidad',
        'Vac-start': 'Inicio vacaciones',
        'Vac-end': 'Fin vacaciones',
        'Photos': 'Fotos',
        'Upload': 'Subir',
        'Admin upload, update, remove actions. Drag photos to reorder.': 'Carga, actualización y eliminación. Arrastre fotos para reordenar.',
        'Appartment': 'Departamento',
        'City / Neighborhood': 'Ciudad / Barrio',
        'City / Neighborhood (select)': 'Ciudad / Barrio (lista)',
        'Back to Main Dashboard': 'Volver al panel principal',
        'Profile updated successfully!': '¡Perfil actualizado correctamente!',
        'Update failed': 'Error al actualizar',
        'Rate Update: Please acknowledge the new pricing rates in the alert above to maintain your visibility.': 'Actualización de tarifa: confirme las nuevas tarifas en el aviso superior para mantener su visibilidad.',
        'First Month Free: Your trial ends on {date}.': 'Primer mes gratis: su prueba termina el {date}.',
        'Since your trial ends mid-month, you will only be charged a prorated amount of {amount} ARS for the remainder of that month.': 'Como su prueba termina a mitad de mes, solo se cobrará un monto prorrateado de {amount} ARS por el resto del mes.',
        'Account Suspended: Your profile is hidden due to unpaid balances.': 'Cuenta suspendida: su perfil está oculto por saldos impagos.',
        'A 2% late fee has been applied. Your new balance is {amount} ARS.': 'Se aplicó un recargo del 2%. Su nuevo saldo es {amount} ARS.',
        'Upload your receipt to restore access.': 'Suba su comprobante para restaurar el acceso.',
        'Are you sure you want to remove this photo from your gallery?': '¿Está segura de que desea eliminar esta foto de su galería?',
        'Please select valid image files only.': 'Seleccione solo archivos de imagen válidos.',
        'Could not load image from URL.': 'No se pudo cargar la imagen desde la URL.',
        'Payload Too Large. Nginx limit exceeded.': 'Archivo demasiado grande. Límite de Nginx superado.',
        'Bad Gateway. The server is restarting.': 'Puerta de enlace incorrecta. El servidor se está reiniciando.',
        'After approval, choose your category and specialties in your professional dashboard. After your first validated payment, you move to that category rate.': 'Tras la aprobación, elija categoría y especialidades en su panel. Tras el primer pago validado, pasará a esa tarifa.',
        'Reminder:': 'Recordatorio:',
        'This is your first time accessing your profile. Please click the "Edit Profile" button to load your photos!': 'Es su primera visita a su perfil. Haga clic en "Editar perfil" para cargar sus fotos.',
        '🔴 Currently Inactive': '🔴 Actualmente inactivo',
        'to': 'a',
        'Toggle password visibility': 'Mostrar/ocultar contraseña',
        'Close': 'Cerrar',
        'Verify Your Email': 'Verifique su correo',
        'Please enter the 6-digit code sent to your email.': 'Ingrese el código de 6 dígitos enviado a su correo.',
        'Verify': 'Verificar',
        'Professional Entrance': 'Entrada profesional',
        'Exit Sanctuary': 'Salir del santuario',
        'Living Treasures': 'Tesoros Vivos',
        'Explore our veiled collection of high-end professionals.': 'Explore nuestra colección velada de profesionales de alto nivel.',
        'Unveiling the collection...': 'Desvelando la colección...',
        'My Dashboard': 'Mi panel',
        'Select a Service': 'Seleccione un servicio',
        'Step 2: Choose a service to continue.': 'Paso 2: elija un servicio para continuar.',
        'Loading services...': 'Cargando servicios...',
        'View Professionals': 'Ver profesionales',
        'Revealed Treasures': 'Tesoros revelados',
        'Preparing the collection...': 'Preparando la colección...',
        'Loading treasures...': 'Cargando tesoros...',
        'Unlocking your vault...': 'Abriendo su bóveda...',
        'Sanctuary': 'Santuario',
        'SexAppeal - Admin Dashboard': 'SexAppeal - Panel de administración',
        'SexAppeal - Professional Dashboard': 'SexAppeal - Panel profesional',
        'SexAppeal - Verification': 'SexAppeal - Verificación',
        'Change prices': 'Cambiar precios',
        'Please log in or register to access the dashboard.': 'Inicie sesión o regístrese para acceder al panel.',
        'Category:': 'Categoría:',
        'Sex': 'Sexo',
        'Conventional massage': 'Masaje convencional',
        'Virtual call': 'Llamada virtual',
        'Share hot content pics or videos': 'Compartir fotos o videos hot',
        'Live streaming kisses': 'Besos en streaming en vivo',
        'View Receipt': 'Ver comprobante',
        'Edit Profile (Address and Connection Info Only)': 'Editar perfil (solo domicilio y contacto)',
        'Edit Service Description': 'Editar descripción del servicio',
        'Edit Availability': 'Editar disponibilidad',
        'Network Error': 'Error de red',
        'Payment Verifications': 'Verificación de pagos',
        'Processed': 'Procesado',
        'No pending payments.': 'No hay pagos pendientes.',
        'Failed to acknowledge payment': 'Error al confirmar el pago',

        'Saving...': 'Guardando...',
        '💾 Save Changes': '💾 Guardar cambios',
        'Account Suspended': 'Cuenta suspendida',
        'Your profile has been removed from the public grid due to an unpaid balance past the 5-business-day grace period.': 'Su perfil fue retirado del directorio público por saldo impago fuera del plazo de gracia de 5 días hábiles.',
        'To restore your access, please upload your payment receipt below. Once verified by an admin, your profile will reappear on the directory.': 'Para restaurar el acceso, suba su comprobante de pago abajo. Una vez verificado por un administrador, su perfil volverá al directorio.',
        'A 2% late fee has been applied. Your new total is {amount} ARS.': 'Se aplicó un recargo del 2%. Su nuevo total es {amount} ARS.',
        'Height': 'Altura',
        'Postal Code': 'Código postal',
        'Ciudad-Barrio (City)': 'Ciudad-Barrio (Ciudad)',
        'Ciudad-Barrio (Neighborhood)': 'Ciudad-Barrio (Barrio)',
        'Monday, Tuesday...': 'Lunes, Martes...',
        'View {label}': 'Ver {label}',
        'Manage Potential Professionals': 'Gestionar profesionales potenciales',
        'All Statuses': 'Todos los estados',
        'joined': 'incorporada',
        'Source URL': 'URL de origen',
        'Discovered At': 'Descubierta el',
        'Save Status': 'Guardar estado',
        'No potentials found.': 'No se encontraron prospectos.',
        'Previous': 'Anterior',
        'Next': 'Siguiente',
        'Page {page} of {total}': 'Página {page} de {total}',
        'You must be logged in as an admin to view this page.': 'Debe iniciar sesión como administrador para ver esta página.',
        'Status updated successfully': 'Estado actualizado correctamente',
        'Failed to update status': 'Error al actualizar el estado',
        'Failed to load data. See console.': 'Error al cargar datos. Vea la consola.',
        'No documents on file (registered before document storage was enabled)': 'Sin documentos en archivo (registrada antes de que se habilitara el almacenamiento)',
        'SexAppeal - Admin Potential Professionals': 'SexAppeal - Profesionales potenciales (Admin)',

        'Skip to main content': 'Saltar al contenido principal',
        'Switch to Spanish': 'Cambiar a español',
        'Switch to English': 'Cambiar a inglés',
        '4 columns': '4 columnas',
        '6 columns': '6 columnas',
        'Remove photo': 'Eliminar foto',
        'Cover photo': 'Portada',
        'Request accepted successfully.': 'Solicitud aceptada correctamente.',
        'Request declined successfully.': 'Solicitud rechazada correctamente.',
        'Could not load invite message preview.': 'No se pudo cargar la vista previa del mensaje de invitación.',
        'Professional approved successfully.': 'Profesional aprobada correctamente.',
        'Professional rejected successfully.': 'Profesional rechazada correctamente.',

        'Confirm action': 'Confirmar acción',
        'Confirm': 'Confirmar',
        'Are you sure you want to send this email to the selected audience? This action cannot be undone.': '¿Está seguro de que desea enviar este correo a la audiencia seleccionada? Esta acción no se puede deshacer.',
        'View receipt': 'Ver comprobante',

        'Need help?': '¿Necesita ayuda?',
        'Have a question or a problem? Send a message to the platform admin and we will get back to you.': '¿Tiene una pregunta o un problema? Envíe un mensaje al administrador de la plataforma y le responderemos.',
        'Request help / Solicitar ayuda al admin': 'Solicitar ayuda al admin',
        'Describe your problem or question below. The admin will get back to you.': 'Describa su problema o pregunta abajo. El administrador le responderá.',
        'Your problem or question': 'Su problema o pregunta',
        'Send request': 'Enviar solicitud',
        'Please describe your problem or question.': 'Describa su problema o pregunta.',
        'Your request was sent. The admin will get back to you.': 'Su solicitud fue enviada. El administrador le responderá.',
        'Could not send your request. Please try again later.': 'No se pudo enviar su solicitud. Inténtelo de nuevo más tarde.',

        'Support messages': 'Mensajes de soporte',
        'No support messages.': 'No hay mensajes de soporte.',
        'Resolve': 'Resolver',
        'Resolved': 'Resuelto',
        'Open': 'Abierto',
        'Call': 'Llamar',
        'WhatsApp': 'WhatsApp',
        'No phone on file': 'Sin teléfono registrado',
        'Reply': 'Responder',
        'Save reply': 'Guardar respuesta',
        'Last reply': 'Última respuesta'
    }
};

const currentLang = localStorage.getItem('platform_lang') || 'es';

export { currentLang };

export const WEEKDAYS = ['Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday', 'Sunday'];

export function translateWeekday(day) {
    if (!day) return '';
    return t(String(day).trim());
}

export function formatWorkingDays(days) {
    if (!days || days.length === 0) return t('Everyday');
    return days.map((day) => translateWeekday(day)).join(', ');
}

// Format the launch opening date/time in the active language, always expressed
// in Argentina wall-clock time (America/Argentina/Buenos_Aires) regardless of
// the viewer's timezone. Returns '' for a missing/unparseable date so callers
// can hide the line gracefully instead of rendering "Invalid Date".
export function formatOpeningDateTime(iso, { withTime = true } = {}) {
    if (!iso) return '';
    const date = new Date(iso);
    if (Number.isNaN(date.getTime())) return '';

    const isEnglish = currentLang === 'en';
    const locale = isEnglish ? 'en-US' : 'es-AR';
    const options = {
        weekday: 'long',
        year: 'numeric',
        month: 'long',
        day: 'numeric',
        timeZone: 'America/Argentina/Buenos_Aires'
    };
    if (withTime) {
        options.hour = isEnglish ? 'numeric' : '2-digit';
        options.minute = '2-digit';
        options.hour12 = isEnglish;
    }

    let formatted;
    try {
        formatted = new Intl.DateTimeFormat(locale, options).format(date);
    } catch {
        return '';
    }
    if (!withTime) return formatted;
    return `${formatted} (${t('Argentina time')})`;
}

export function t(text) {
    if (currentLang === 'en') return text;
    return translations['es'][text] || text;
}

let esRegexList = null;

export function applyStaticTranslations(rootNode = document.body) {
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

    const translateAttr = (el, attr) => {
        const val = el.getAttribute(attr);
        if (!val || !String(val).trim()) return;
        const norm = val.replace(/\s+/g, ' ').trim();
        if (translations['es'][norm]) {
            el.setAttribute(attr, translations['es'][norm]);
            return;
        }
        if (translations['es'][val.trim()]) {
            el.setAttribute(attr, translations['es'][val.trim()]);
            return;
        }
        let text = val;
        let changed = false;
        for (const { key, regex } of esRegexList) {
            const newText = text.replace(regex, translations['es'][key]);
            if (newText !== text) {
                text = newText;
                changed = true;
            }
        }
        if (changed) el.setAttribute(attr, text);
    };

    if (rootNode.querySelectorAll) {
        rootNode.querySelectorAll('[title]').forEach((el) => translateAttr(el, 'title'));
        rootNode.querySelectorAll('[aria-label]').forEach((el) => translateAttr(el, 'aria-label'));
    }

    if (rootNode === document.body && document.title && translations['es'][document.title]) {
        document.title = translations['es'][document.title];
    }
}

// Expose globals for traditional script usage (if app.js were not loaded as type="module")
window.translations = translations;
window.currentLang = currentLang;
window.applyStaticTranslations = applyStaticTranslations;