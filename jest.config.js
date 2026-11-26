export default {
    testEnvironment: 'jsdom',
    roots: ['<rootDir>/app/src'],
    transform: {
        '^.+\\.ts$': 'ts-jest',
    },
    // ts-jest rewrites the sources' './ball.ts' imports to './ball.js', as the build does; Jest runs the .ts file.
    moduleNameMapper: {
        '^(\\.{1,2}/.*)\\.js$': '$1',
    },
};
