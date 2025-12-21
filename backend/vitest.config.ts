import { defineConfig } from 'vitest/config'

export default defineConfig({
    test: {
        env: {
            JWT_SECRET: 'test-secret',
        },
        // increase timeout for integration tests if needed
        testTimeout: 10000,
        coverage: {
            provider: 'v8',
            reporter: ['text', 'json', 'html'],
        },
        exclude: ['**/node_modules/**', '**/dist/**', '**/.{idea,git,cache,output,temp}/**'],
    },
})
