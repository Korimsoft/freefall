'use strict';

module.exports = {
    testEnvironment: 'jsdom',
    roots: ['<rootDir>/app/src'],
    transform: {
        '^.+\\.[jt]s$': 'ts-jest',
    },
};
