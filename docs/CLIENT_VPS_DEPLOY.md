# Checklist — Nuevo cliente VPS dedicado (72 h)

Cada cliente = **servidor nuevo**. No desplegar clientes en `91.208.206.35` (SexAppeal productivo).

## Día 0 — Comercial

- [ ] Paquete cerrado (Pilot / Pro / Enterprise)
- [ ] Vertical definido (copy, categorías, campos opcionales)
- [ ] Región VPS: cloud regional u offshore (documentado en contrato)
- [ ] Dominio del cliente confirmado
- [ ] Email admin del cliente para panel
- [ ] Pago setup recibido

## Día 1 — Provisionamiento VPS

- [ ] Crear VPS (mín. 2 GB Pilot · 4 GB Pro · 8 GB Enterprise)
- [ ] OS: Ubuntu 22.04 LTS
- [ ] Usuario `deploy` + SSH key (sin password root en producción)
- [ ] UFW: allow 22, 80, 443; deny resto
- [ ] Instalar Docker + Docker Compose plugin
- [ ] Anotar IP pública → enviar al cliente para registro **A** `@` y `www`

## Día 1–2 — DNS y SSL

- [ ] Cliente apunta DNS al IP del VPS
- [ ] Verificar propagación (`dig cliente.com`)
- [ ] Copiar stack: deploy tar al **nuevo IP** (mismo flujo que `upload_to_server.bat`)
- [ ] Crear `.env` del cliente:
  - `MONGO_URI=mongodb://mongo:27017/cliente_db`
  - `JWT_SECRET=` (único por cliente)
  - `PLATFORM_URL=https://cliente.com`
  - `PLATFORM_REGISTER_URL=https://cliente.com/register.html`
  - `NODE_ENV=production`
- [ ] Certificados SSL en `certbot/conf/live/cliente.com/` → montar en nginx
- [ ] Ajustar `nginx.conf` `server_name` al dominio del cliente

## Día 2 — Deploy aplicación

- [ ] `docker compose up --build -d`
- [ ] Verificar health: `https://cliente.com/health` o login
- [ ] Seed admin user (email cliente) — cambiar password en primer login
- [ ] Branding: logo, favicon, textos landing si aplica
- [ ] Pricing categorías en `adminSettings` del admin

## Día 3 — QA y entrega

- [ ] Registro profesional de prueba
- [ ] Flujo verificación admin
- [ ] Contacto WhatsApp redirect (`/api/v1/professionals/:alias/whatsapp`)
- [ ] Modal pago / comprobante (si vertical lo usa)
- [ ] `robots.txt` + `sitemap.xml`
- [ ] Backup cron instalado (`install-daily-backup-cron.sh`)
- [ ] Capacitación admin (1–2 h videollamada)
- [ ] Entregar: URL, credenciales admin, brochure, contacto soporte

## Post-entrega — Operación mensual

- [ ] Monitoreo disco / RAM (housekeeping script)
- [ ] Backups Mongo verificados semanalmente
- [ ] Actualizaciones de seguridad OS + npm audit trimestral
- [ ] Facturación mensual al cliente (hosting + mantenimiento)

## Comandos útiles (en VPS cliente)

```bash
cd /root/cliente-platform
docker compose ps
docker compose logs -f app
bash scripts/disk-housekeeping.sh .
bash scripts/deploy-restart.sh .
```

## Qué NO hacer

- ❌ Multitenancy de clientes pagos en el VPS de SexAppeal productivo
- ❌ Abrir 443 desde PC Windows del cliente o del implementador
- ❌ Compartir `JWT_SECRET` o `.env` entre clientes
- ❌ MongoDB expuesto a internet (solo red Docker interna)
