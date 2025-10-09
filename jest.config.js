/**
 * Jest configuration for TypeScript testing
 * Supports unit and integration tests with proper TypeDI setup
 */

module.exports = {
  // Use ts-jest preset for TypeScript
  preset: 'ts-jest',
  
  // Test environment
  testEnvironment: 'node',
  
  // Root directory for tests
  roots: ['<rootDir>/src', '<rootDir>/tests'],
  
  // Test file patterns
  testMatch: [
  '**/__tests__/**/*.ts',
  '**/?(*.)+(spec|test).ts',
  '**/tests/e2e/**/*.ts'
],

  
  // Transform TypeScript files
  transform: {
    '^.+\\.ts$': 'ts-jest'
  },
  
  // Module file extensions
  moduleFileExtensions: ['ts', 'tsx', 'js', 'jsx', 'json', 'node'],
  
  // Coverage configuration
  collectCoverageFrom: [
    'src/**/*.ts',
    '!src/**/*.d.ts',
    '!src/**/*.interface.ts',
    '!src/types/**',
    '!src/index.ts'
  ],
  
  // Coverage thresholds (adjust as needed)
  coverageThreshold: {
    global: {
      branches: 70,
      functions: 70,
      lines: 70,
      statements: 70
    }
  },
  
  // Coverage directory
  coverageDirectory: 'coverage',
  
  // Coverage reporters
  coverageReporters: ['text', 'lcov', 'html'],
  
  // Setup files (run before tests)
  setupFilesAfterEnv: ['<rootDir>/tests/setup.ts'],
  
  // Global setup
  globalSetup: '<rootDir>/tests/globalSetup.ts',
  
  // Global teardown
  globalTeardown: '<rootDir>/tests/globalTeardown.ts',
  
  // Ignore patterns
  testPathIgnorePatterns: [
    '/node_modules/',
    '/dist/',
    '/coverage/'
  ],
  
  // Verbose output
  verbose: true,
  
  // Clear mocks between tests
  clearMocks: true,
  
  // Restore mocks between tests
  restoreMocks: true,
  
  // TypeScript config
  globals: {
    'ts-jest': {
      tsconfig: {
        // Disable type checking in tests for faster execution
        isolatedModules: true
      }
    }
  }
};