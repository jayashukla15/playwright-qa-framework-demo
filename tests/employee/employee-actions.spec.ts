import { expect, test } from '../../src/fixtures/test.js';
import {
  createEmployee,
  deleteEmployee,
  employeeApiUrl,
  employeeNumberFromProfileUrl,
  employeeScenarios,
  updateEmployeeJobDetails,
  verifyEmployeeApiMatchesUi,
} from '../support/employee-workflows.js';

test.describe('Employee feature', () => {
  for (const employee of employeeScenarios) {
    test(`Add employee: ${employee.firstName} ${employee.lastName}`, async ({
      loginPage,
      addEmployeePage,
      page,
    }) => {
      test.setTimeout(90_000);

      await createEmployee(employee, { page, loginPage, addEmployeePage });
    });

    test(`Edit employee: ${employee.firstName} ${employee.lastName}`, async ({
      loginPage,
      addEmployeePage,
      employeeListPage,
      employeeJobPage,
      page,
    }) => {
      test.setTimeout(90_000);

      const employeeId = await createEmployee(employee, { page, loginPage, addEmployeePage });
      await updateEmployeeJobDetails(employee, employeeId, {
        page,
        loginPage,
        addEmployeePage,
        employeeListPage,
        employeeJobPage,
      });
    });

    test(`API matches UI for ${employee.firstName} ${employee.lastName}`, async ({
      loginPage,
      addEmployeePage,
      employeeListPage,
      employeeJobPage,
      page,
    }) => {
      test.setTimeout(90_000);

      const employeeId = await createEmployee(employee, { page, loginPage, addEmployeePage });
      const uiDetails = await updateEmployeeJobDetails(employee, employeeId, {
        page,
        loginPage,
        addEmployeePage,
        employeeListPage,
        employeeJobPage,
      });
      await verifyEmployeeApiMatchesUi(
        page,
        employeeNumberFromProfileUrl(page.url()),
        uiDetails,
      );
    });

    test(`Delete employee: ${employee.firstName} ${employee.lastName}`, async ({
      loginPage,
      addEmployeePage,
      employeeListPage,
      page,
    }) => {
      test.setTimeout(90_000);

      const employeeId = await createEmployee(employee, { page, loginPage, addEmployeePage });
      await deleteEmployee(employeeId, {
        page,
        loginPage,
        addEmployeePage,
        employeeListPage,
      });
    });
  }
});