import type { Page } from '@playwright/test';

export class UserMenuPage {
  constructor(private readonly page: Page) {}

  async logout(): Promise<void> {
    await this.page
      .getByRole('banner')
      .getByRole('img', { name: 'profile picture' })
      .click();
    await this.page.getByRole('menuitem', { name: 'Logout', exact: true }).click();
  }
}