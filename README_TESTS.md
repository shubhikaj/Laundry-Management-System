Playwright E2E Test Suite

This project includes a Playwright test suite that covers the provided test cases (TC01 - TC08).

Prerequisites
- Node.js installed
- The app running locally at http://localhost:3000 (run `npm run dev` in your project root)

Install Playwright (Windows PowerShell commands):

```powershell
# from project root
npm install -D @playwright/test
# install browser binaries
npx playwright install
```

Run the tests:

```powershell
# run all tests
npx playwright test

# run a single test file
npx playwright test tests/e2e.spec.js
```

Environment variables
- BASE_URL: base URL of the running app (defaults to http://localhost:3000)
- STUDENT_EMAIL / STUDENT_PASSWORD
- STAFF_EMAIL / STAFF_PASSWORD
- ADMIN_EMAIL / ADMIN_PASSWORD

Notes and limitations
- The tests are written to work against the app in demo mode (the app falls back to demo users when NEXT_PUBLIC_SUPABASE_URL is not set).
- The demo credentials in the project are:
  - Admin: admin@college.edu / admin123
  - Staff: staff@college.edu / staff123
  - Student: john.doe@student.college.edu / student123 (or configure STUDENT_EMAIL/STUDENT_PASSWORD env vars to match your demo account)
- Some UI flows (schedule edits, notification delivery) depend on server-side setup. The tests make best-effort checks but you may need to adjust selectors or data for your environment.

Troubleshooting
- If login fails for demo users, ensure NEXT_PUBLIC_SUPABASE_URL is not set or points to a placeholder value so the app uses demo mode authentication.
- If elements are not found, open the app in the browser and inspect the DOM to update selectors used in tests.

