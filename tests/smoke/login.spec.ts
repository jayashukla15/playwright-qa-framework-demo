import { expect, test } from '../../src/fixtures/test.js';
import { logStep } from '../support/log-step.js';
import {
  loginAdmin,
  logoutAndAssertInvalidatedSession,
} from '../support/employee-workflows.js';

test('valid admin can log in and reach the dashboard', async ({
  loginPage,
  dashboardPage,
  page,
}) => {
  await logStep('Open login page', () => loginPage.goto());
  await logStep('Submit valid admin credentials', () => loginPage.login('Admin', 'admin123'));

  await logStep('Assert dashboard URL', () =>
    expect(page).toHaveURL(/\/web\/index\.php\/dashboard\/index$/),
  );
  await logStep('Assert dashboard heading is visible', () =>
    expect(dashboardPage.heading).toBeVisible(),
  );
});

test('invalid password is rejected with an error message', async ({ loginPage, page }) => {
  await logStep('Open login page', () => loginPage.goto());
  await logStep('Submit invalid password', () => loginPage.login('Admin', 'wrong-password'));

  await logStep('Assert invalid credentials message is visible', () =>
    expect(loginPage.errorMessage).toHaveText('Invalid credentials', { timeout: 15000 }),
  );
  await logStep('Assert user remains on the login page', () =>
    expect(page).toHaveURL(/\/web\/index\.php\/auth\/login$/),
  );
});

test('logout invalidates the user session', async ({ loginPage, userMenuPage, page }) => {
  test.setTimeout(60_000);

  await loginAdmin(loginPage);
  await logoutAndAssertInvalidatedSession(loginPage, userMenuPage, page);
});