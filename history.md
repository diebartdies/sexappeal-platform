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

1. **The 2-Month Grace Period (Free Trial):**
   * All newly verified professionals receive full platform access completely free for their first two months. This removes all friction from the signup process and allows them to see the platform's ROI risk-free.

2. **Post-Trial Subscription:**
   * After 2 months, the platform will charge a fixed subscription/access fee.
   * **The Benchmark:** This fee is deliberately set at **50% of what legacy competitors charge**. In real-world terms, this equates to roughly **half of the revenue generated by a professional in a single shift or meeting**, ensuring the platform provides massive, undeniable value to its "Living Treasures."