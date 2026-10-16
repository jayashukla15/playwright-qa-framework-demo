import { expect, test } from '../../src/fixtures/test.js';
import {
  createEmployee,
  deleteEmployee,
  employeeNumberFromProfileUrl,
  employeeScenarios,
  loginAdmin,
  logoutAndAssertInvalidatedSession,
  readEmployeeJobDetails,
  updateEmployeeJobDetails,
  verifyEmployeeApiMatchesUi,
} from '../support/employee-workflows.js';
import { logStep } from '../support/log-step.js';

for (const employee of employeeScenarios) {
  test.describe.serial(`Employee lifecycle: ${employee.firstName} ${employee.lastName}`, () => {
    let employeeId: string;

    test('1. Login and verify dashboard', async ({ loginPage, dashboardPage }) => {
      test.setTimeout(60_000);

      await loginAdmin(loginPage);
      await logStep('Verify dashboard is displayed', () =>
        expect(dashboardPage.heading).toBeVisible(),
      );
    });

    test('2. Add employee', async ({ loginPage, addEmployeePage, page }) => {
      test.setTimeout(90_000);

      employeeId = await createEmployee(employee, { page, loginPage, addEmployeePage });
    });

    test('3. Edit employee job details', async ({
      loginPage,
      addEmployeePage,
      employeeListPage,
      employeeJobPage,
      page,
    }) => {
      test.setTimeout(90_000);

      await loginAdmin(loginPage);
      await updateEmployeeJobDetails(employee, employeeId, {
        page,
        loginPage,
        addEmployeePage,
        employeeListPage,
        employeeJobPage,
      });
    });

    test('4. Validate employee details via API', async ({
      loginPage,
      addEmployeePage,
      employeeListPage,
      employeeJobPage,
      page,
    }) => {
      test.setTimeout(90_000);

      await loginAdmin(loginPage);
      const uiDetails = await readEmployeeJobDetails(employee, employeeId, {
        page,
        loginPage,
        addEmployeePage,
        employeeListPage,
        employeeJobPage,
      });
      const employeeNumber = employeeNumberFromProfileUrl(page.url());
      await verifyEmployeeApiMatchesUi(page, employeeNumber, uiDetails);
    });

    test('5. Delete employee and verify removal', async ({
      loginPage,
      addEmployeePage,
      employeeListPage,
      employeeJobPage,
      page,
    }) => {
      test.setTimeout(90_000);

      await loginAdmin(loginPage);
      await deleteEmployee(employeeId, {
        page,
        loginPage,
        addEmployeePage,
        employeeListPage,
        employeeJobPage,
      });
    });

    test('6. Logout and verify session invalidation', async ({
      loginPage,
      userMenuPage,
      page,
    }) => {
      test.setTimeout(60_000);

      await loginAdmin(loginPage);
      await logoutAndAssertInvalidatedSession(loginPage, userMenuPage, page);
    });
  });
}