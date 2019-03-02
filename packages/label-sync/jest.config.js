module.exports = {
  roots: ['<rootDir>/src', '<rootDir>/tests'],
  testEnvironment: 'node',
  transform: {
    '^.+\\.tsx?$': 'ts-jest',
  },
  testRegex: '(/__tests__/.*|(\\.|/)(test|spec))\\.tsx?$',
  testPathIgnorePatterns: ['/node_modules/', '/__fixtures__/'],
  moduleFileExtensions: ['ts', 'tsx', 'js', 'jsx', 'json', 'node'],
  collectCoverage: true,
  collectCoverageFrom: [
    '**/*.ts',
    '!**/node_modules/**',
    '!**/vendor/**',
    '!**/generated/**',
    '!**/__fixtures__/**',
  ],
  snapshotSerializers: ['jest-serializer-ansi'],
  verbose: true,
  coverageDirectory: './coverage',
  coverageReporters: ['json', 'lcov', 'text', 'clover', 'html'],
}
