// SexAppeal entry point
import { setupLandingPageAgeGate, initAuthForms } from './authFlows.js';
import { initBootstrap } from './bootstrap.js';

setupLandingPageAgeGate();
initAuthForms();
initBootstrap();
