import { defineConfig } from 'vitest/config'

export default defineConfig({
    test: {
        env: {
            JWT_SECRET: 'test-secret',
        },
        // Integration tests share the same local database, so file-parallel runs
        // cause fixture cleanup races and foreign-key flakiness.
        fileParallelism: false,
        // increase timeout for integration tests if needed
        testTimeout: 10000,
        coverage: {
            provider: 'v8',
            reporter: ['text', 'json', 'html'],
        },
        exclude: ['**/node_modules/**', '**/dist/**', '**/.{idea,git,cache,output,temp}/**'],
    },
})
