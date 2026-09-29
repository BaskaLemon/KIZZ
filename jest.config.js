const nextJest = require('next/jest.js');

const createJestConfig = nextJest({ dir: './' });

module.exports = createJestConfig({
  testEnvironment: 'jsdom',
  testMatch: ['<rootDir>/specs/**/*.spec.{ts,tsx}', '<rootDir>/src/**/*.spec.{ts,tsx}'],
});
