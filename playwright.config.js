const {defineConfig,devices}=require('@playwright/test');
module.exports=defineConfig({
  testDir:'./tests/browser',
  timeout:30000,
  expect:{timeout:8000},
  forbidOnly:!!process.env.CI,
  retries:process.env.CI?1:0,
  reporter:process.env.CI?'github':'list',
  use:{
    baseURL:'http://127.0.0.1:4173',
    trace:'retain-on-failure',
    screenshot:'only-on-failure',
  },
  projects:[
    {name:'desktop-chromium',use:{...devices['Desktop Chrome']}},
    // WebKit on Linux approximates Safari layout/behavior, not physical iOS voices.
    {name:'mobile-webkit',use:{...devices['iPhone 13']}},
  ],
  webServer:{
    command:'python3 -m http.server 4173 --bind 127.0.0.1',
    url:'http://127.0.0.1:4173/index.html',
    timeout:20000,
    reuseExistingServer:!process.env.CI
  }
});
