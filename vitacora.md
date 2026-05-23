# Vitacora - SexAppeal Platform

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
