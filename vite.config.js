import { defineConfig } from 'vite';

export default defineConfig({
    root: 'app',
    // Relative asset paths, so the released zip works from whatever folder it is unpacked to.
    base: './',
    build: {
        outDir: '../dist',
        emptyOutDir: true,
        target: 'es2022',
    },
    // host: true binds 0.0.0.0, so the servers are reachable from outside a container.
    server: { host: true, port: 5173 },
    preview: { host: true, port: 8080 },
});
