export default {
    testEnvironment: 'jsdom',
    roots: ['<rootDir>/app/src'],
    transform: {
        '^.+\\.ts$': 'ts-jest',
    },
};
