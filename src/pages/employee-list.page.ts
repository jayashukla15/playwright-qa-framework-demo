import type { Locator, Page } from '@playwright/test';

export class EmployeeListPage {
  readonly deleteSuccessMessage: Locator;
  private readonly employeeIdInput: Locator;

  constructor(private readonly page: Page) {
    this.deleteSuccessMessage = page.getByText('Successfully Deleted', { exact: true });
    this.employeeIdInput = page
      .locator('.oxd-input-group')
      .filter({ has: page.locator('label').filter({ hasText: /^Employee Id$/ }) })
      .locator('input');
  }

  async goto(): Promise<void> {
    await this.page.getByRole('link', { name: 'PIM', exact: true }).click();
    await this.page.getByRole('link', { name: 'Employee List', exact: true }).click();
  }

  async searchByEmployeeId(employeeId: string): Promise<void> {
    await this.employeeIdInput.fill(employeeId);
    await this.page.getByRole('button', { name: 'Search', exact: true }).click();
  }

  employeeRow(employeeId: string): Locator {
    return this.page.getByRole('row').filter({ hasText: employeeId });
  }

  async openEmployeeById(employeeId: string): Promise<void> {
    await this.employeeRow(employeeId).getByRole('button').first().click();
  }

  async deleteEmployeeById(employeeId: string): Promise<void> {
    await this.employeeRow(employeeId).getByRole('button').nth(1).click();
    await this.page
      .getByRole('dialog')
      .getByRole('button', { name: /Yes, Delete/ })
      .click();
  }
}