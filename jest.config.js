export default {
    testEnvironment: '<rootDir>/jest-environment.js',
    roots: ['<rootDir>/app/src'],
    transform: {
        '^.+\\.ts$': 'ts-jest',
    },
};
