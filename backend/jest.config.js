module.exports = {
  testEnvironment: 'node',
  coverageDirectory: 'coverage',
  collectCoverageFrom: [
    'src/**/*.js',
    '!src/config/**',
    '!src/models/**',
    '!src/services/paymentService.js',  // Requires MySQL - tested separately
    '!src/services/penaltyService.js',  // Requires MySQL - tested separately
    '!src/utils/cronJobs.js'            // Cron scheduler - not unit-testable
  ],
  testMatch: [
    '**/__tests__/**/*.js',
    '**/?(*.)+(spec|test).js'
  ],
  coverageThreshold: {
    global: {
      branches: 15,
      functions: 19,
      lines: 45,
      statements: 45
    }
  },
  setupFilesAfterEnv: ['<rootDir>/tests/setup.js'],
  testTimeout: 30000
};
