# Project History & Strategic Notes

## Admin Access & Roles
*(Placeholder for notes on admin access and roles)*

## Hosting Strategy for Adult-Oriented Platforms
*(Logged from architectural discussion)*

Because the SexAppeal platform facilitates an adult-oriented directory, it **cannot be hosted on mainstream providers** (such as AWS, DigitalOcean, Linode, or Vultr). These providers have strict Acceptable Use Policies (AUPs) and are subject to US FOSTA-SESTA regulations, which puts the platform at high risk of sudden suspension and data deletion.

### Requirements for Safe Hosting (Offshore / Adult-Friendly)
When purchasing a VPS, the provider must explicitly offer:
1. **Adult-Friendly ToS:** Terms of Service that explicitly allow adult content and directories.
2. **Offshore Jurisdiction:** Servers located in countries with lenient digital content laws (e.g., Netherlands, Iceland, Switzerland, Bulgaria, Moldova) to avoid strict US jurisdictions.
3. **DDoS Protection:** Essential, as adult platforms are frequent targets of DDoS attacks.
4. **Privacy / No-KYC:** Providers that allow anonymous signup and cryptocurrency payments (Bitcoin, Monero) to protect operator identity.

### Example Providers in this Niche
* **ViceTemple:** Specifically markets as an adult-friendly web host with offshore servers.
* **FlokiNET:** Based in Iceland/Romania/Finland; famous for extreme privacy and ignoring takedown requests.
* **Shinjiru:** Malaysian offshore host with strong "bulletproof" hosting plans.
* **VSysHost:** Based in Kyiv, Ukraine; very lenient ToS and accepts crypto.
* **AlexHost:** Based in Moldova; highly resilient to takedown requests and privacy-focused.

### Selected Hosting Provider
*(Logged from infrastructure planning discussion)*
**Provider:** AlexHost
**Plan Specifications:**
* 2 CPU Core
* 2 GB RAM
* 50 GB NVMe Storage
* 6TB bandwidth
* 1 IPv4 & /64 IPv6
* NVMe Based System
* Virtual IPMI - Remote Control Console
* Frequent backups included
* DDoS Protection Incl. (1Tbps+)

### Automated Migration Process
Thanks to the Ansible automation in this repository, migrating to a new offshore host is seamless:
1. Purchase a **Linux VPS (Ubuntu 22.04 or Debian)** from an offshore provider.
2. Receive the new Public IP address (e.g., `185.14.x.x`) and SSH credentials.
3. Update `d:\SexAppeal-platform\ansible\inventory.ini` to replace the old IP with the new offshore IP.
4. Update the Target IP in `d:\SexAppeal-platform\deploy.bat`.
5. Run `deploy.bat` to automatically provision the new server, install Docker, set up Nginx, and launch the platform.

## Server Sizing Guidelines
*(Logged from capacity planning discussion)*

For a baseline of ~80 concurrent/active users running the current stack (Node.js, MongoDB, Nginx, Docker), the following server specifications are recommended:

### Recommended Specs: 2GB RAM / 1-2 vCPU / 25GB+ SSD
* **RAM (2GB):** Critical for stability. MongoDB requires caching memory (~500MB-1GB). The OS, Nginx, and Node.js consume another ~500MB. More importantly, Docker builds (`npm install` inside the container) will crash with Out-Of-Memory (OOM) errors on 1GB servers.
* **CPU (1-2 Cores):** Node.js is single-threaded and highly asynchronous. 1 to 2 vCPUs will easily handle 80 concurrent users fetching profiles and making API requests.
* **Storage (25GB+ SSD/NVMe):** Required for image uploads (Multer). Even if 100 professionals upload 10 High-Res photos each, the photo storage footprint will be ~2GB-3GB. The OS, MongoDB data, and Docker system files require about 10GB-15GB.
* **Bandwidth:** 1TB or Unmetered is standard and more than enough for browsing images and JSON data.

**Expected Cost:** ~$10 - $15 USD / month on offshore providers.

*Tip: Always configure a Swap file (e.g., 2GB Swap) on the Linux VPS to prevent sudden crashes during unexpected traffic spikes or heavy Docker builds.* 

## Payment Processing Strategy
*(Logged from infrastructure planning discussion)*


Due to the nature of the directory, **mainstream payment processors (Stripe, PayPal, Square) cannot be used**. Utilizing them violates their Acceptable Use Policies (AUP) and will result in permanent account bans and 180-day fund freezes.

### Accepted Payment Gateways
1. **Cryptocurrency (Recommended):**
   * **BTCPay Server:** Open-source, self-hosted via Docker. Zero fees, no third-party custody, chargeback-proof.
   * **NOWPayments / CoinPayments:** Third-party crypto gateways with simple API integrations.
   
2. **High-Risk Merchant Accounts (Credit Cards):**
   * Providers: **CCBill**, **Epoch**, **SecurionPay**, **Instabill**.
   * Note: Requires formal business incorporation, extensive KYC, higher processing fees (~10-15%), and rolling reserves.

## Monetization & Pricing Strategy
*(Logged from business model planning)*

To rapidly capture market share and incentivize onboarding, the platform employs an aggressive, highly competitive pricing structure for professionals:

1. **The 1-Month Grace Period (Free Trial):**
   * All newly verified professionals receive full platform access completely free for their first month. This removes all friction from the signup process and allows them to see the platform's ROI risk-free.

2. **Post-Trial Subscription:**
   * After 1 month, the platform will charge a fixed subscription/access fee. If the trial ends mid-month, a pro-rated invoice is generated for the remaining days of that month.
   * **Enforcement:** Professionals have a 5-business-day grace period to pay. If unpaid, a 2% late fee is applied and their profile is suspended from the public grid until a payment receipt is uploaded via their dashboard.
   * **Manual Overrides:** The requirement to pay can be toggled on/off per profile by Admins (`paysMonthlyCharges` checkbox).
   * **The Benchmark:** This fee is deliberately set at **50% of what legacy competitors charge**. In real-world terms, this equates to roughly **half of the revenue generated by a professional in a single shift or meeting**, ensuring the platform provides massive, undeniable value to its "Living Treasures."

## Elegance Engine & Native Luxury Advertising (Jardines de Babilonia Strategy)
*(Logged from marketing and partnership strategy discussion)*

To monetize the platform without using cheap banners or mainstream ads (which degrade the "Gold on Obsidian" luxury aesthetic), the platform employs native, curated recommendations for high-net-worth Sanctuary Seekers.

### The Strategy
* **For Guests:** Curated "gift guides" featuring luxury lingerie or high-end intimacy products.
* **For Professionals:** Exclusive discount codes for high-end boutique wear.
* **Monetization:** Affiliate marketing (10-20% commissions) or direct flat-fee monthly sponsorships.

### Target Partnership List (Buenos Aires)

#### 1. High-End Lingerie & Boudoir-Chic
* **Jesús Fernández** *(Palermo Soho)* - Pioneer of boudoir-chic in Argentina. Sophisticated and highly visual.
* **Pompavana** *(Palermo Soho)* - Exclusive lingerie, exquisite craftsmanship (silk/sensual accessories).
* **Vírgenes de Buenos Aires** *(Palermo Viejo)* - Vintage 1940s glamour and corsets.
* **Calzonetta** *(San Telmo / Montserrat)* - Independent, high-quality "lencería de diseño".

#### 2. Premium Erotic Boutiques
* **Savage Sex Shop** *(Palermo Soho)* - Highly curated, design-focused, elegant.
* **Lujuria Boutique Erótica** *(Expanding/Online)* - Premium wellness, high-end toys.
* **Juicy Pink Boutique Erótica** *(Microcentro)* - Central, discreet, premium brands.
* **Espacio Placer** *(Palermo Soho)* - Small, highly curated, discreet.

### The "Elegance Engine" Pitch Email (Spanish)
**Asunto:** Propuesta de Alianza Comercial - Audiencia de Alto Poder Adquisitivo (SexAppeal Platform)

**Cuerpo del correo:**
Estimado/a equipo de **[Nombre de la Marca]**,

Me dirijo a ustedes desde la dirección de **SexAppeal**, el nuevo directorio privado y de alta gama para acompañantes VIP y conexiones de lujo en Buenos Aires. 

A diferencia de las plataformas tradicionales, nuestra arquitectura digital está diseñada como un "Santuario" exclusivo para clientes de muy alto poder adquisitivo. Nuestro enfoque es 100% estético, discreto y centrado en la elegancia.

Actualmente estamos lanzando nuestro **"Elegance Engine"** (Motor de Elegancia), un espacio dentro de nuestra plataforma donde recomendamos de manera curada y nativa **marcas de lujo, lencería de autor y cosmética íntima premium** a nuestros usuarios. 

**¿Por qué esta alianza tiene sentido para ustedes?**
1. **Audiencia Ideal:** Nuestros usuarios (Sanctuary Seekers) frecuentemente buscan regalos de altísima calidad (lencería, accesorios) para agasajar a las profesionales con las que se encuentran.
2. **Estética Cuidada:** No utilizamos "banners" invasivos ni publicidad barata. Su marca aparecerá como una *"Recomendación Curada"* integrada elegantemente en nuestro diseño (Gold on Obsidian), manteniendo intacto el prestigio de su marca.
3. **Conversión Directa:** Podemos integrar enlaces de afiliados o códigos de descuento exclusivos para nuestra red de profesionales ("Living Treasures") y clientes.

Nos encantaría ofrecerles un mes de posicionamiento destacado sin costo inicial para que evalúen el tráfico y la conversión que nuestra plataforma de nicho puede generarles.

¿Tendrían disponibilidad esta semana para una breve llamada de 10 minutos para explorar esta sinergia?

Atentamente,

**[Tu Nombre/Firma]**  
Director de Alianzas Estratégicas  
**SexAppeal Platform - The Architecture of Intimacy**  
sexappeal.drsrv.net.ar