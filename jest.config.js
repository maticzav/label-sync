module.exports = {
  roots: ['<rootDir>/packages/', '<rootDir>/server/'],
  // Tests
  testEnvironment: 'node',
  transform: {
    '^.+\\.tsx?$': 'ts-jest',
  },
  testRegex: '(/__tests__/.*|(\\.|/)test)\\.tsx?$',
  testPathIgnorePatterns: ['/node_modules/', '/__fixtures__/'],
  moduleFileExtensions: ['ts', 'tsx', 'js', 'jsx', 'json', 'node'],
  // Coverage
  collectCoverage: true,
  collectCoverageFrom: [
    '**/*.ts',
    '!**/*.d.ts',
    '!**/create-label-sync/**',
    '!**/dist/**',
    '!**/node_modules/**',
    '!**/vendor/**',
    '!**/generated/**',
    '!**/__fixtures__/**',
    '!**/scenarios/**',
    '!**/redirects/**',
  ],
  coverageDirectory: './coverage',
  coverageReporters: ['json', 'lcov', 'text', 'clover', 'html'],
  // Options
  snapshotSerializers: ['jest-serializer-ansi'],
  verbose: true,
}
