/** @type {import('jest').Config} */
module.exports = {
  transform: {
    '^.+\\.(t|j)sx?$': ['ts-jest'],
  },
  coverageReporters: ['cobertura', 'html'],
  reporters: [
    'default',
    [
      'jest-junit',
      {
        outputDirectory: 'coverage',
        outputName: 'junit.xml',
      },
    ],
  ],

  testPathIgnorePatterns: ['<rootDir>/dist'],

  coveragePathIgnorePatterns: ['<rootDir>/test/.*'], // We don't want to run coverage on our tests.
  testTimeout: 30000,
  // detectOpenHandles: true,
}
