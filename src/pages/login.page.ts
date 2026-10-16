import type { Locator, Page } from '@playwright/test';

export class LoginPage {
  readonly errorMessage: Locator;
  readonly heading: Locator;

  constructor(private readonly page: Page) {
    this.errorMessage = page.getByText('Invalid credentials', { exact: true });
    this.heading = page.getByRole('heading', { name: 'Login' });
  }

  async goto(): Promise<void> {
    await this.page.goto('/web/index.php/auth/login');
  }

  async login(username: string, password: string): Promise<void> {
    await this.page.getByRole('textbox', { name: 'Username' }).fill(username);
    await this.page.getByRole('textbox', { name: 'Password' }).fill(password);
    await this.page.getByRole('button', { name: 'Login' }).click();
  }
}