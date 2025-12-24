const nextJest = require('next/jest')

const createJestConfig = nextJest({
  // Provide the path to your Next.js app to load next.config.js and .env files
  dir: './',
})

// Add any custom config to be passed to Jest
const customJestConfig = {
  testEnvironment: 'jest-environment-jsdom',
  moduleNameMapper: {
    '^@/root/(.*)$': '<rootDir>/$1',
    '^@/layout/(.*)$': '<rootDir>/src/components/Layout/$1',
    '^@/components/(.*)$': '<rootDir>/src/components/$1',
    '^@/shared/(.*)$': '<rootDir>/src/components/shared/$1',
    '^@/context/(.*)$': '<rootDir>/src/context/$1',
    '^@/hooks/(.*)$': '<rootDir>/src/hooks/$1',
    '^@/pages/(.*)$': '<rootDir>/pages/$1',
    '^@/api/(.*)$': '<rootDir>/pages/api/$1',
    '^@/services/(.*)$': '<rootDir>/src/services/$1',
    '^@/utils/(.*)$': '<rootDir>/utils/$1',
    '^@/styles/(.*)$': '<rootDir>/src/styles/$1',
  },
  setupFilesAfterEnv: ['<rootDir>/src/__test__/setupTests.tsx'],
}

// createJestConfig is exported this way to ensure that next/jest can load the Next.js config which is async
module.exports = createJestConfig(customJestConfig)
