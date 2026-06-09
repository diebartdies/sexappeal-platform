# Vitacora - SexAppeal Platform

## [2026-06-06] - Security, Caching, and UI Updates

### Fixed
- **Dashboard Load Error (`404 Professional not found`)**: Updated the `/api/v1/professionals/me` route in `server.js` to correctly query the `User` database instead of the legacy `Professional` collection, restoring access to the dashboard for both professionals and admins.
- **Aggressive Browser Caching**: Added a cache-buster query parameter (`?_=${new Date().getTime()}`) to the `/professionals/me` fetch request in `app.js` to prevent browsers from returning stale `404` errors after the backend fix.
- **Duplicate Account Prevention**: Implemented email normalization (trimming and lowercasing) across all authentication routes (`register`, `login`, `verifyEmail`, `forgotPassword`, `resetPassword`, `googleAuth`) in `authController.js` to prevent case-sensitive duplicate registrations.
- **Alias Conflict Protection**: Added strict, case-insensitive checks during professional registration (`authController.js`) to prevent new users from claiming an alias already in use by another active professional.

### Changed
- **Floating Control Menu**: Refactored the UI controls (Filters & Grid Layout toggles) in `app.js` to use `position: fixed`. It is now permanently anchored and centered at the bottom of the screen (`bottom: 30px`), remaining visible and accessible regardless of scroll position.
- **Transparent Control UI**: Removed the dark background, glass-blur effect, borders, and box-shadows from the floating control menu, resulting in a cleaner, fully transparent floating interface.
- **Target Webpages Expansion**: Updated the universal scraping script (`scrape_phones.js`) to include `gemidos.tv` and `empireescorts.com` for lead generation. Extended the alias filter to ignore the word "empire".
- **Category Pricing Visibility**: Removed category prices from the main dashboard, professional discovery grids, and admin control panels for a cleaner aesthetic.

## [2026-05-25] - UI/UX Overhaul & Admin Dashboard Enhancements

### Added
- **Admin Dashboard Grid**: Replaced the default professional form with a categorized visual grid for Admins. Includes filtering by province, city, and neighborhood, and groups professionals by their Quality tier.
- **Inline Editing**: Added a quick "✏️ Edit" button on Admin grid cards to instantly load the edit modal for any professional.
- **Photo Carousel**: Introduced a highly responsive, swipeable photo carousel for public profiles. Features include auto-scrolling, desktop click-and-drag support, and custom gold scrollbars. Responsive down-scaling for mobile screens.
- **Global Navigation**: Implemented a "Back" (`Volver`) button in the top navigation bar to facilitate easier browsing.
- **Panic Button**: Pressing the `Escape` key instantly transforms the page into a fake, full-screen Excel spreadsheet (`Book1 - Excel`) for privacy.
- **Password Visibility Toggle**: Injected a sleek, grey SVG eye icon into all password fields to toggle text visibility.
- **Inline SVG Logo**: Replaced the external `logo.svg` dependency with a robust inline SVG implementation in the navigation bar. Added a global "Logo Fixer" script to gracefully recover any broken image elements matching "logo".

### Changed
- **Discovery Grid**: Removed the large Active/Inactive badge from the main thumbnail grid to clean up the UI and encourage profile clicks. Thumbnails are now clickable directly.
- **Translations**: Added Spanish translation for the receipt upload button (`Subir recibo de pago (foto o archivo)`).

### Fixed
- **Session Sync**: Fixed an issue where manual logins did not properly set the `is18Plus` flag, causing an infinite redirect loop back to the landing page.
- **Admin Crash**: Updated backend logic to ensure it does not crash when an Admin (who lacks a `professionalProfile`) accesses the dashboard.
- **Suspended Accounts**: Professionals with a `subscriptionStatus` of `suspended` are now actively filtered out of the public discovery grid.

## [2026-05-19] - Initial Setup and Critical Fixes

### Fixed
- **authController.js**: Resolved multiple syntax errors in the `register` function. The code previously had a broken `sendEmail` implementation and invalid response logic.
- **Import Paths**: Corrected `sendEmail` utility import path in `authController.js` from `../utils/sendEmail` to `../sendEmail`.
- **Dependencies**: Added `nodemailer` to `package.json` as it was required by `sendEmail.js` but missing.

### Added
- **Email Configuration**: Migrated SMTP configuration from the `kidwall` project to `.env`. Using EasyDNS (mailout.easymail.ca) for reliable email delivery.
- **Frontend Implementation**:
    - Created `register.html` with dynamic role-based fields for Users and Professionals.
    - Created `verify.html` for handling the email verification code flow.
    - Created `dashboard.html` for professionals, featuring status tracking, profile management, and rate change acknowledgment.
    - Updated `discover.html` with navigation and integrated a feedback reporting system.
    - Enhanced `app.js` with comprehensive logic for auth, registration, dashboard management, and reporting.
- **User Model Enhancements**:
    - Added `professionalProfile` schema to centralize professional data.
    - Implemented `getSignedJwtToken` method for JWT generation.
    - Added fields for "Duo" support (`isDuo`, `duoPartner`) and rate change tracking (`rateChangeAcknowledged`).
- **Rate Change & Duo Logic**:
    - **Admin Notify**: `POST /api/v1/admin/notify-rate-change` resets acknowledgment status for all professionals and sends email alerts.
    - **Professional Acknowledgment**: `PUT /api/v1/professionals/acknowledge-rate` allows professionals to confirm they've seen the update.
    - **Duo Gate**: Updated `getMe` endpoint to calculate `isReadyForTransactions`. If a professional is in a duo, both partners must acknowledge rate changes before transactions are permitted.

### Changed
- **Server Routing**: Mounted new admin and professional routes for rate management and profile checks.
