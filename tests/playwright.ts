import playwright from '../frontend/node_modules/@playwright/test/index.js';

export const test = playwright.test;
export const expect = playwright.expect;