// @ts-check
const { defineConfig, devices } = require('@playwright/test');

// The whole point of these tests: the app is a static, backend-less frontend.
// Playwright therefore serves the repository root itself and never contacts a
// deployed environment.
const PORT = Number(process.env.E2E_PORT || 8184);

module.exports = defineConfig({
    testDir: '.',
    fullyParallel: false,
    workers: 1,
    retries: process.env.CI ? 1 : 0,
    forbidOnly: !!process.env.CI,
    timeout: 60_000,
    expect: { timeout: 8_000 },
    reporter: [
        ['html', { outputFolder: 'playwright-report', open: 'never' }],
        ['list'],
    ],
    use: {
        baseURL: `http://127.0.0.1:${PORT}/`,
        headless: true,
        viewport: { width: 1280, height: 900 },
        trace: 'on-first-retry',
        screenshot: 'only-on-failure',
        actionTimeout: 10_000,
        navigationTimeout: 30_000,
    },
    projects: [
        { name: 'chromium', use: { ...devices['Desktop Chrome'] } },
    ],
    webServer: {
        command: `python3 -m http.server ${PORT} --bind 127.0.0.1 --directory ..`,
        url: `http://127.0.0.1:${PORT}/index.html`,
        reuseExistingServer: !process.env.CI,
        timeout: 30_000,
        stdout: 'ignore',
        stderr: 'pipe',
    },
});
