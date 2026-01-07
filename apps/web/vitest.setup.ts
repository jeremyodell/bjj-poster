import '@testing-library/jest-dom/vitest';

// Mock pointer capture methods for Radix UI components (not supported in JSDOM)
Element.prototype.hasPointerCapture = () => false;
Element.prototype.setPointerCapture = () => {};
Element.prototype.releasePointerCapture = () => {};

// Mock scrollIntoView for Radix UI Select components (not supported in JSDOM)
Element.prototype.scrollIntoView = () => {};
