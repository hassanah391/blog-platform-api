export default {
  // Test environment
  testEnvironment: 'node',
  
  // Transform files
  transform: {
    '^.+\\.js$': 'babel-jest',
  },
  
  // Test patterns
  testMatch: [
    '**/tests/**/*.test.js',
    '**/__tests__/**/*.js',
  ],
  
  // Coverage settings
  collectCoverage: true,
  collectCoverageFrom: [
    'utils/**/*.js',
    '!utils/**/*.test.js',
    '!**/node_modules/**',
  ],
  coverageDirectory: 'coverage',
  coverageReporters: ['text', 'lcov', 'html'],
  
  // Verbose output
  verbose: true,
  
  // Clear mocks between tests
  clearMocks: true,
  
  // Detect open handles
  detectOpenHandles: true,
  
  // Force exit after tests
  forceExit: true,
};
