import type { Locator, Page } from '@playwright/test';

export class AddEmployeePage {
  readonly successMessage: Locator;
  private readonly firstName: Locator;
  private readonly lastName: Locator;
  private readonly employeeId: Locator;
  private readonly profilePictureInput: Locator;

  constructor(private readonly page: Page) {
    this.firstName = page.getByRole('textbox', { name: 'First Name' });
    this.lastName = page.getByRole('textbox', { name: 'Last Name' });
    this.employeeId = page
      .locator('.oxd-input-group')
      .filter({ has: page.getByText('Employee Id', { exact: true }) })
      .getByRole('textbox');
    this.profilePictureInput = page.locator('input[type="file"]');
    this.successMessage = page.getByText('Successfully Saved', { exact: true });
  }

  async goto(): Promise<void> {
    await this.page.getByRole('link', { name: 'PIM', exact: true }).click();
    await this.page.getByRole('link', { name: 'Add Employee', exact: true }).click();
  }

  async fillEmployeeDetails(
    firstName: string,
    lastName: string,
    employeeId: string,
  ): Promise<void> {
    await this.firstName.fill(firstName);
    await this.lastName.fill(lastName);
    await this.employeeId.fill(employeeId);
  }

  async uploadProfilePicture(imageBuffer: Buffer): Promise<void> {
    await this.profilePictureInput.setInputFiles({
      name: 'profile_picture_upload.jpg',
      mimeType: 'image/jpeg',
      buffer: imageBuffer,
    });
  }

  async save(): Promise<void> {
    await this.page.getByRole('button', { name: 'Save', exact: true }).click();
  }
}