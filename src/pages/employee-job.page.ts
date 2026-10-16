import type { Locator, Page } from '@playwright/test';

export class EmployeeJobPage {
  readonly heading: Locator;
  readonly successMessage: Locator;
  private readonly jobTitle: Locator;
  private readonly employmentStatus: Locator;

  constructor(private readonly page: Page) {
    this.heading = page.getByRole('heading', { name: 'Job Details' });
    this.successMessage = page.getByText('Successfully Updated', { exact: true });
    this.jobTitle = this.dropdownFor('Job Title');
    this.employmentStatus = this.dropdownFor('Employment Status');
  }

  async open(): Promise<void> {
    await this.page.getByRole('tab', { name: 'Job' }).click();
  }

  async selectJobTitle(jobTitle: string): Promise<void> {
    await this.jobTitle.click();
    await this.page.getByRole('option', { name: jobTitle, exact: true }).click();
  }

  async selectEmploymentStatus(employmentStatus: string): Promise<void> {
    await this.employmentStatus.click();
    await this.page.getByRole('option', { name: employmentStatus, exact: true }).click();
  }

  async save(): Promise<void> {
    await this.page.getByRole('button', { name: 'Save', exact: true }).click();
  }

  async selectedJobTitle(): Promise<string> {
    return this.jobTitle.innerText();
  }

  async selectedEmploymentStatus(): Promise<string> {
    return this.employmentStatus.innerText();
  }

  private dropdownFor(label: string): Locator {
    return this.page
      .locator('.oxd-input-group')
      .filter({ has: this.page.locator('label').filter({ hasText: new RegExp(`^${label}$`) }) })
      .locator('.oxd-select-text');
  }
}