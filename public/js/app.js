// SexAppeal entry point
import { setupLandingPageAgeGate, initAuthForms } from './authFlows.js';
import { initBootstrap } from './bootstrap.js';
import { initProfessionalRegistration } from './registerProfessional.js';

setupLandingPageAgeGate();
initAuthForms();
initProfessionalRegistration();
initBootstrap();
