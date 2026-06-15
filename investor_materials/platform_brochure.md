# SexAppeal Platform — Brochure Técnico & Estratégico

> **The Architecture of Intimacy** — Motor white-label production-ready para marketplace de profesionales verificados.

**Web:** https://sexappeal.drsrv.net.ar · **Contacto:** admin@drsrv.net.ar

---

## Visión

SexAppeal es un **sistema operativo completo** para administrar el ciclo de vida de profesionales independientes: captación, verificación, descubrimiento, contacto protegido, facturación prorrateada, vacaciones, suspensiones y trazabilidad — no un simple directorio.

Hoy opera en el vertical de **acompañantes premium**. Mañana puede reutilizarse en medicina privada, educación, consultoría y más — cambiando terminología, categorías y reglas.

---

## Arquitectura (resumen)

```
Visitantes / Profesionales / Admin
        ↓ HTTPS
   Nginx (SSL, rate limit)
        ↓
   Express 5 API (Node.js)
   ├── Controllers (auth, professionals, admin, payments, outreach, SEO)
   ├── Motores 24h (billing, trial reminders, category proration, SEO locations)
   └── ActivityLog (trazabilidad server-side)
        ↓
   MongoDB 4.4 + uploads
        ↓
   SMTP · WhatsApp Web.js · Puppeteer scraper
```

Ver diagrama completo en `platform_brochure.html` (Mermaid interactivo).

---

## Stack

| Capa | Tecnología |
|------|------------|
| Frontend | HTML5, CSS3, Vanilla JS ES Modules, i18n ES/EN |
| Backend | Node.js, Express 5, Mongoose 9 |
| Seguridad | Helmet, rate-limit, bcryptjs, JWT httpOnly |
| Gateway | Nginx Alpine + Let's Encrypt |
| Datos | MongoDB 4.4 (Docker volume) |
| Deploy | Docker Compose, Ansible, server-watch |
| Comms | Nodemailer, whatsapp-web.js |
| SEO | SSR meta, sitemap dinámico, URLs por ubicación |

---

## Seguridad & trazabilidad cookieless

- **Sin cookies de tracking de terceros** — analytics server-side en `ActivityLog`
- **Guest browsing log** — cada visita anónima registra IP, User-Agent y path
- **Contact shield** — WhatsApp/teléfono vía redirect API, no en HTML
- **Verificación** — documentos + selfie con gesto aleatorio
- **Respect Agreement** — filtro de feedback con escalamiento admin
- **Re-verificación** — cambios sensibles (teléfono, dirección) revierten a pending

---

## Ciclo de vida profesional (complejidad ERP)

Lead → Invitación WhatsApp → Registro → Trial 30d → Categoría random → Verificación admin → Pago → Categoría elegida → Facturación mensual → Vacaciones → Cambio categoría mid-month (`lastCatModDate` + prorrateo) → Suspensión → Reactivación

### Facturación inteligente por categoría

- Abono según categoría (Standard $15k → Elite $50k ARS/mes)
- Cambio mid-month: `categoryChangeLog[]` + prorrateo automático por días
- Vacaciones: hasta 15 días descontados del mes
- Comprobante Mercado Pago / BBVA — cuentas visibles solo en modal "Cómo pagar"

---

## Verticales reutilizables (white-label)

| Vertical | Adaptación |
|----------|------------|
| Médicos / psicólogos | Especialidad = categoría, matrícula = verificación |
| Profesores / tutores | Materia = services, horarios = workingHours |
| Abogados / contadores | Tier por experiencia, documentos verificados |
| Personal trainers | Certificaciones, portfolio, vacaciones |
| Belleza / estética | Fotos portfolio, ubicación por barrio |
| Servicios técnicos | Urgencia, disponibilidad, identidad verificada |
| Real estate boutique | SEO por zona (ya implementado) |
| Arte / eventos | Trial para nuevos talentos, reviews |
| Cuidadores / pet sitters | Verificación reforzada, logs para confianza |

**Cambios típicos:** copy, categorías, campos schema, mensaje WhatsApp, URLs SEO, pricing admin.

---

## Modelo de negocio

1. Suscripción mensual por categoría (sin comisión por contacto)
2. Período evaluación 30 días (conversión post-pago)
3. Publicidad curada premium (roadmap)
4. Licencia white-label a otros verticales

---

*Brochure v1.0 — Junio 2026*
