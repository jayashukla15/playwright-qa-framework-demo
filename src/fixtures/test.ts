import { test as base } from '@playwright/test';
import { AddEmployeePage } from '../pages/add-employee.page.js';
import { DashboardPage } from '../pages/dashboard.page.js';
import { EmployeeJobPage } from '../pages/employee-job.page.js';
import { EmployeeListPage } from '../pages/employee-list.page.js';
import { LoginPage } from '../pages/login.page.js';
import { UserMenuPage } from '../pages/user-menu.page.js';

type AppFixtures = {
  addEmployeePage: AddEmployeePage;
  loginPage: LoginPage;
  dashboardPage: DashboardPage;
  employeeJobPage: EmployeeJobPage;
  employeeListPage: EmployeeListPage;
  userMenuPage: UserMenuPage;
};

export const test = base.extend<AppFixtures>({
  addEmployeePage: async ({ page }, use) => {
    await use(new AddEmployeePage(page));
  },
  loginPage: async ({ page }, use) => {
    await use(new LoginPage(page));
  },
  dashboardPage: async ({ page }, use) => {
    await use(new DashboardPage(page));
  },
  employeeJobPage: async ({ page }, use) => {
    await use(new EmployeeJobPage(page));
  },
  employeeListPage: async ({ page }, use) => {
    await use(new EmployeeListPage(page));
  },
  userMenuPage: async ({ page }, use) => {
    await use(new UserMenuPage(page));
  },
});

export { expect } from '@playwright/test';