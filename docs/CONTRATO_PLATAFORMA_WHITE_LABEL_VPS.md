# CONTRATO DE LICENCIA, IMPLEMENTACIÓN Y SERVICIOS GESTIONADOS
## Plataforma White-Label — VPS dedicado (DRSRV Platform Engine)

**Versión del modelo:** 1.0 · Junio 2026

> **Aviso legal:** Este documento es un **modelo orientativo**. No constituye asesoramiento jurídico. Se recomienda revisión por abogado matriculado en la jurisdicción aplicable antes de firmar.

---

En la Ciudad de **[CIUDAD]**, a los **[DÍA]** días del mes de **[MES]** de **[AÑO]**, entre:

**EL PRESTADOR**  
Razón social / Nombre: **[NOMBRE O RAZÓN SOCIAL DEL PRESTADOR]**  
CUIT / ID fiscal: **[CUIT]**  
Domicilio: **[DOMICILIO COMPLETO]**  
Email: **admin@drsrv.net.ar**  
En adelante, el **“Prestador”** o **“DRSRV”**.

**Y**

**EL CLIENTE**  
Razón social / Nombre: **[NOMBRE O RAZÓN SOCIAL DEL CLIENTE]**  
CUIT / CUIL / ID fiscal: **[CUIT]**  
Domicilio: **[DOMICILIO COMPLETO]**  
Email: **[EMAIL CLIENTE]**  
Teléfono / WhatsApp: **[TELÉFONO]**  
En adelante, el **“Cliente”**.

Ambas partes en conjunto, las **“Partes”**, y cada una por separado, una **“Parte”**, convienen en celebrar el presente contrato (el **“Contrato”**), sujeto a las siguientes cláusulas:

---

## 1. OBJETO

1.1. El Prestador otorga al Cliente una **licencia de uso no exclusiva, intransferible y limitada** del software de marketplace denominado **“DRSRV Platform Engine”** (el **“Software”** o la **“Plataforma”**), junto con los servicios de **implementación, hosting gestionado en servidor virtual dedicado (VPS)** y **mantenimiento** descritos en este Contrato y en el **Anexo A**.

1.2. El Software se desplegará en un **VPS exclusivo del Cliente**, independiente de la infraestructura productiva del Prestador y de la de otros clientes. El tráfico público accederá vía **HTTPS (puerto 443)** al VPS asignado, bajo el dominio indicado por el Cliente.

1.3. Vertical / rubro contratado: **[DESCRIPCIÓN DEL NEGOCIO — ej. directorio de tutores, belleza, consultores, etc.]**  
Marca comercial del Cliente: **[MARCA]**  
Dominio principal: **[https://dominio-cliente.com]**

---

## 2. ALCANCE DE LOS SERVICIOS

2.1. **Implementación inicial (Setup),** según paquete contratado (Anexo A), incluye de forma enunciativa:

- Alta y configuración del VPS dedicado (cloud regional u offshore, según acuerdo).
- Instalación del stack containerizado (Docker, Nginx, aplicación Node.js, MongoDB).
- Certificado SSL (Let's Encrypt u equivalente) para el dominio del Cliente.
- Configuración de firewall (puertos 22, 80 y 443).
- Panel de administración, flujos de registro y verificación de profesionales (según configuración acordada).
- Branding básico acordado (logo, colores, textos principales).
- Capacitación administrativa: **[1 / 2]** hora(s) por videollamada.
- Plazo objetivo de entrega: **72 (setenta y dos) horas hábiles** desde: (i) acreditación del pago de Setup, y (ii) DNS del dominio apuntando al IP del VPS provisto por el Prestador.

2.2. **Servicios mensuales recurrentes,** mientras el Contrato se encuentre vigente:

- Hosting del VPS dedicado dimensionado según paquete.
- Mantenimiento de la Plataforma (actualizaciones de seguridad razonables del stack acordado).
- Backups periódicos de base de datos según paquete.
- Monitoreo básico de disponibilidad y espacio en disco.
- Soporte por email en horario **[HORARIO — ej. lun–vie 10–18 h ART]**, con tiempos de respuesta según Anexo B.

2.3. **Quedan expresamente excluidos**, salvo acuerdo escrito adicional:

- Desarrollo de funcionalidades a medida no incluidas en el paquete.
- Gestión de contenidos, moderación de perfiles, marketing o captación de usuarios finales del Cliente.
- Costos de dominio, certificados premium, SMS, publicidad o comisiones de pasarelas de pago de terceros.
- Asesoramiento legal, fiscal o regulatorio del rubro del Cliente.
- Migración desde sistemas de terceros, salvo paquete Enterprise con alcance expreso.

---

## 3. MODELO DE INFRAESTRUCTURA — VPS DEDICADO

3.1. Cada Cliente dispone de **un VPS propio** (IP y recursos no compartidos con otros clientes del Prestador).

3.2. Región / proveedor acordado: **[Hetzner / DigitalOcean / AWS Lightsail / Azure / offshore — especificar]**.  
Especificaciones mínimas: **[2 GB / 4 GB / 8 GB RAM]** · **[XX GB]** disco · **[X vCPU]**.

3.3. El Cliente es responsable de:

- Registrar y mantener vigente el **dominio** y apuntar los registros DNS (A / AAAA / CNAME según instrucciones del Prestador).
- Proporcionar materiales de marca (logo, textos legales de su sitio, política de privacidad si corresponde).
- Gestionar la relación con **usuarios finales** y profesionales registrados en su Plataforma.

3.4. El Prestador no alojará la operación comercial del Cliente en servidores compartidos con la instancia productiva de referencia del Prestador (modelo **Opción B — VPS dedicado**).

---

## 4. PRECIOS Y FORMA DE PAGO

4.1. El Cliente abonará:

| Concepto | Importe | Moneda | Vencimiento |
|----------|---------|--------|-------------|
| **Setup (implementación única)** | **[499 / 1.200 / 2.500+]** | **USD / ARS** | Antes del inicio de implementación |
| **Fee mensual (hosting + mantenimiento)** | **[99 / 199 / 349+]** | **USD / ARS** | Día **[1 / 5 / 10]** de cada mes |
| **Paquete contratado** | **[Pilot / Pro / Enterprise]** | — | Anexo A |

4.2. Forma de pago: **[transferencia bancaria / Mercado Pago / PayPal / cripto — especificar]** a la cuenta indicada por el Prestador.

4.3. Los importes **no incluyen IVA** / incluyen IVA según corresponda: **[marcar uno]**.  
Tipo de cambio de referencia (si aplica conversión ARS): **[fuente y fecha]**.

4.4. **Mora:** el falta de pago del fee mensual por más de **[10 / 15]** días corridos faculta al Prestador a: (i) suspender el acceso público a la Plataforma previo aviso por email; (ii) resolver el Contrato conforme cláusula 9. El Setup abonado no es reembolsable salvo incumplimiento imputable exclusivamente al Prestador.

4.5. Ajuste de precios: el Prestador podrá actualizar el fee mensual con **[30 / 60]** días de antelación por email. El Cliente podrá rescindir sin penalidad antes de la entrada en vigencia del nuevo precio.

---

## 5. PROPIEDAD INTELECTUAL Y LICENCIA

5.1. El Software, su código fuente, arquitectura, documentación técnica y mejoras realizadas por el Prestador son y permanecen **propiedad exclusiva del Prestador** (o de sus licenciantes).

5.2. El Cliente recibe únicamente el derecho de **usar** la Plataforma desplegada en su VPS durante la vigencia del Contrato, con la marca y configuración acordadas. **No** se transfiere propiedad del código ni derecho de sublicenciar, revender el Software “tal cual” ni realizar ingeniería inversa con fines competitivos.

5.3. Marca, logo, contenidos y datos cargados por el Cliente o sus usuarios son **propiedad del Cliente**, quien garantiza tener derecho sobre los mismos.

5.4. El Prestador podrá mencionar al Cliente como caso de uso (nombre comercial y vertical) en material comercial **salvo oposición escrita del Cliente**.

---

## 6. DATOS, CONFIDENCIALIDAD Y RESPONSABILIDAD SOBRE CONTENIDOS

6.1. Los datos de usuarios y profesionales almacenados en el VPS del Cliente son **datos del Cliente**. El Prestador accederá a ellos solo para soporte, mantenimiento, backups y cumplimiento de este Contrato.

6.2. Cada Parte mantendrá confidencial la información técnica, comercial y de acceso (credenciales, `.env`, claves SSH) de la otra Parte.

6.3. El Cliente es **único responsable** de:

- La legalidad del rubro, contenidos, imágenes y publicaciones en su Plataforma.
- Cumplir normativa aplicable (protección de datos personales, edad mínima, publicidad, defensa del consumidor, regulaciones sectoriales).
- Responder reclamos de usuarios finales y profesionales registrados.

6.4. El Prestador **no garantiza** un volumen de tráfico, registros, ingresos ni posicionamiento SEO. Provee infraestructura y Software en condiciones de servicio razonables (Anexo B).

6.5. En materia de **Protección de Datos Personales** (Ley 25.326 Argentina u normativa aplicable en la jurisdicción del Cliente), las Partes acuerdan que: **[CLIENTE actúa como Responsable / Encargado del tratamiento — definir según asesoría legal]**. El Prestador implementará medidas técnicas razonables (acceso restringido, HTTPS, backups). Si se requiere DPA formal, se suscribirá **Anexo C** aparte.

---

## 7. NIVELES DE SERVICIO Y SOPORTE

7.1. Los niveles de servicio (SLA) aplicables son los del **Anexo B**, según paquete contratado.

7.2. Mantenimientos programados serán notificados con al menos **24 horas** de antelación, preferentemente en franja de bajo tráfico.

7.3. Fuerza mayor: caídas de proveedor cloud, DDoS masivos, fallas de DNS del Cliente, indisponibilidad de WhatsApp/Meta, o actos de terceros eximen al Prestador de penalidades SLA por ese período.

---

## 8. GARANTÍAS Y LIMITACIÓN DE RESPONSABILIDAD

8.1. El Software se provee **“tal cual”** (*as is*), con soporte y mantenimiento descritos en este Contrato. El Prestador garantiza haber implementado la Plataforma conforme al alcance del Anexo A.

8.2. En la máxima medida permitida por la ley, la responsabilidad total acumulada del Prestador por cualquier concepto derivado de este Contrato **no excederá** el monto pagado por el Cliente en los **12 (doce) meses** anteriores al hecho generador.

8.3. El Prestador **no será responsable** por daños indirectos, lucro cesante, pérdida de datos por causa imputable al Cliente, suspensiones por falta de pago, ni por uso indebido de la Plataforma por terceros.

8.4. El Cliente mantendrá indemne al Prestador frente a reclamos de terceros originados en contenidos, ilegalidad del rubro o incumplimiento normativo del Cliente.

---

## 9. PLAZO, RENOVACIÓN Y RESOLUCIÓN

9.1. **Vigencia inicial:** **[12 meses / mes a mes]** desde la **Fecha de Go-Live** (entrega operativa en producción).

9.2. **Renovación automática** por períodos iguales salvo aviso de no renovación con **[30]** días de antelación por email fehaciente.

9.3. **Resolución por incumplimiento:** cualquier Parte podrá resolver si la otra incumple obligación esencial y no subsana en **[15]** días desde notificación escrita.

9.4. **Efectos de la terminación:**

- Cesa la licencia de uso del Software.
- El Prestador podrá apagar el VPS tras **[30]** días de la terminación, previa exportación de backup final si el Cliente está al día en pagos.
- El Cliente podrá solicitar **exportación de base de datos** (formato razonable) dentro de los **[30]** días posteriores, con costo de horas adicionales si excede lo incluido en el paquete.
- Las cláusulas de propiedad intelectual, confidencialidad, limitación de responsabilidad e indemnidad sobreviven.

---

## 10. SUBCONTRATACIÓN

10.1. El Prestador podrá utilizar proveedores de infraestructura (hosting cloud, offshore, email) manteniendo responsabilidad frente al Cliente por los servicios contratados.

---

## 11. COMUNICACIONES

11.1. Toda notificación será válida por email a las direcciones indicadas en el encabezado, con acuse de lectura recomendado para rescisiones y cambios de precio.

---

## 12. LEY APLICABLE Y JURISDICCIÓN

12.1. Este Contrato se rige por las **leyes de la República Argentina**.

12.2. Para cualquier controversia, las Partes se someten a los **Tribunales Ordinarios de la Ciudad de [CIUDAD / BUENOS AIRES]**, con renuncia a cualquier otro fuero que pudiera corresponder, salvo pacto arbitral escrito posterior.

---

## 13. DISPOSICIONES GENERALES

13.1. **Integridad:** este Contrato y sus Anexos constituyen el acuerdo total entre las Partes y reemplazan entendimientos previos sobre el mismo objeto.

13.2. **Modificaciones:** solo válidas por escrito firmadas por ambas Partes (incluye PDF firmado digitalmente si las Partes así lo aceptan).

13.3. **Cesión:** el Cliente no podrá ceder este Contrato sin consentimiento previo y escrito del Prestador.

13.4. **Nulidad parcial:** la invalidez de una cláusula no afectará las restantes.

---

## FIRMAS

| | **EL PRESTADOR (DRSRV)** | **EL CLIENTE** |
|---|--------------------------|----------------|
| Nombre | _________________________ | _________________________ |
| Cargo | _________________________ | _________________________ |
| Firma | _________________________ | _________________________ |
| Fecha | _________________________ | _________________________ |

---

# ANEXO A — Detalle del paquete y alcance funcional

**Cliente:** **[RAZÓN SOCIAL]**  
**Paquete:** **[ ] Pilot  [ ] Pro  [ ] Enterprise**  
**Fecha estimada Go-Live:** **[FECHA]**

## A.1 Infraestructura incluida

| Ítem | Incluido |
|------|----------|
| VPS dedicado (RAM / disco) | **[2 GB / 4 GB / 8 GB+]** |
| Dominios configurados | **[1 / N]** |
| SSL HTTPS | Sí (Let's Encrypt) |
| Backups DB | **[diarios / semanales]** — retención **[7 / 30]** días |
| Región / proveedor | **[especificar]** |
| Staging (solo Enterprise) | **[Sí / No]** |

## A.2 Módulos de la Plataforma

Marcar lo incluido en este contrato:

- [ ] Registro y login (profesionales / admin)
- [ ] Verificación documental + selfie con gesto
- [ ] Panel administrador (verificaciones, pagos, logs)
- [ ] Categorías tiered y pricing configurable
- [ ] Período de evaluación / trial
- [ ] Facturación mensual, vacaciones, prorrateo por categoría
- [ ] Upload comprobante de pago
- [ ] Contacto WhatsApp / teléfono vía API (anti-scraping)
- [ ] Outreach WhatsApp masivo (admin)
- [ ] SEO: sitemap, meta SSR, páginas por ubicación
- [ ] ActivityLog / trazabilidad server-side
- [ ] Respet Agreement / moderación feedback
- [ ] Reviews
- [ ] i18n ES/EN
- [ ] Otros: **[especificar]**

## A.3 Branding y personalización incluidos

- Logo: **[archivo provisto por Cliente / pendiente]**
- Colores principales: **[hex / descripción]**
- Textos landing personalizados: **[Sí / No / alcance]**
- Campos de perfil adicionales: **[listar o N/A]**

## A.4 Contactos operativos

| Rol | Nombre | Email |
|-----|--------|-------|
| Admin plataforma (Cliente) | | |
| Técnico / DNS (Cliente) | | |
| Soporte DRSRV | | admin@drsrv.net.ar |

---

# ANEXO B — Niveles de servicio (SLA)

| Paquete | Tiempo respuesta soporte | Disponibilidad objetivo* | Ventana mantenimiento |
|---------|--------------------------|---------------------------|------------------------|
| **Pilot** | 48 h hábiles | 99,0 % mensual | Sin garantía horario fijo |
| **Pro** | 24 h hábiles | 99,5 % mensual | Acordada 24 h antes |
| **Enterprise** | 8 h hábiles (prioritario) | 99,9 % mensual | Acordada con Cliente |

\*Excluye: fallas DNS del Cliente, force majeure, suspensiones por falta de pago, abuso o DDoS.

**Crédito por incumplimiento SLA (solo Enterprise, opcional):**  
Si disponibilidad mensual cae por debajo del objetivo por causa imputable al Prestador, crédito de hasta **[5 / 10] %** del fee mensual del mes afectado, tope máximo **[1]** mes de fee. No acumulable con otras indemnizaciones.

---

# ANEXO D — Orden de contratación (resumen ejecutivo)

*(Opcional: firmar junto con el Contrato principal)*

| Campo | Valor |
|-------|-------|
| Cliente | |
| CUIT | |
| Paquete | Pilot / Pro / Enterprise |
| Vertical | |
| Dominio | |
| Setup | USD / ARS |
| Mensual | USD / ARS |
| Inicio implementación | (pago acreditado + DNS) |
| Go-Live objetivo | +72 h hábiles |

**Declaración del Cliente:**  
Declaro contar con derecho sobre la marca **[MARCA]**, que el rubro **[RUBRO]** es lícito en la jurisdicción donde operaré, y que provisiónaré textos legales (Términos, Privacidad, edad mínima si aplica) en un plazo máximo de **[15]** días desde Go-Live.

Firma Cliente: _________________  Fecha: _________

---

*Fin del modelo — DRSRV Platform Engine*
