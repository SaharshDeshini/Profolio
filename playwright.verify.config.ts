import base from './playwright.config.ts'
export default { ...base, use: { ...base.use, baseURL: 'http://localhost:5174' }, webServer: { ...base.webServer, url: 'http://localhost:5174', reuseExistingServer: true } }
