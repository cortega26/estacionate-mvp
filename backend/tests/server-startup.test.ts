
import { describe, it, expect, afterAll } from 'vitest';
import { spawn, ChildProcess } from 'child_process';
import axios from 'axios';
import path from 'path';

const API_URL = 'http://127.0.0.1:3000';

describe('Server Startup & Connectivity', () => {
    let serverProcess: ChildProcess;
    let serverStarted = false;

    afterAll(() => {
        if (serverProcess) {
            serverProcess.kill();
        }
    });

    it('should start the server and accept connections within timeout', async () => {
        // 1. Start Server
        const serverPath = path.resolve(__dirname, '../dev-server.ts');
        console.log('Spawning server:', serverPath);

        serverProcess = spawn('npx', ['tsx', serverPath], {
            cwd: path.resolve(__dirname, '../'),
            env: { ...process.env, PORT: '3000', NODE_ENV: 'test' },
            shell: true
        });

        // 2. Poll for Health
        const startTime = Date.now();
        const timeout = 15000; // 15 seconds max (Generous for CI/Dev)

        while (Date.now() - startTime < timeout) {
            try {
                const res = await axios.get(`${API_URL}/api/health`, { timeout: 1000 });
                if (res.status === 200 || res.status === 503) {
                    // 503 is acceptable if Redis is down, but server is UP
                    serverStarted = true;
                    break;
                }
            } catch (error: any) {
                // Ignore connection refused, wait
                if (error.code !== 'ECONNREFUSED') {
                    // Maybe 503 from our health check?
                    if (error.response && error.response.status === 503) {
                        serverStarted = true;
                        break;
                    }
                }
                await new Promise(r => setTimeout(r, 500));
            }
        }

        expect(serverStarted).toBe(true);
    }, 20000);

    it('should have working login endpoint', async () => {
        if (!serverStarted) return; // Skip if previous failed

        try {
            // Attempt login with garbage to check connectivity
            await axios.post(`${API_URL}/api/auth/login`, {
                email: 'test@conn.check',
                password: 'wrong'
            });
        } catch (error: any) {
            // We expect 401/403 (Invalid credentials)
            // We DO NOT expect ECONNREFUSED
            expect(error.response).toBeDefined();
            expect(error.response.status).not.toBe(0); // 0 usually means network error
            expect([401, 403, 400]).toContain(error.response.status);
        }
    });
});
