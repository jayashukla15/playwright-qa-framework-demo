import { readFileSync } from 'node:fs';
import { fileURLToPath } from 'node:url';
import type { Page } from '@playwright/test';
import type { AddEmployeePage } from '../../src/pages/add-employee.page.js';
import type { EmployeeJobPage } from '../../src/pages/employee-job.page.js';
import type { EmployeeListPage } from '../../src/pages/employee-list.page.js';
import type { LoginPage } from '../../src/pages/login.page.js';
import type { UserMenuPage } from '../../src/pages/user-menu.page.js';
import { expect } from '../../src/fixtures/test.js';
import { logStep } from './log-step.js';

export type EmployeeScenario = {
  firstName: string;
  lastName: string;
  employeeIdPrefix: string;
  profilePicture: string;
  jobTitle: string;
  employmentStatus: string;
};

export type EmployeeUiDetails = {
  employeeId: string;
  firstName: string;
  lastName: string;
  jobTitle: string;
  employmentStatus: string;
};

export type EmployeeCreationPages = {
  page: Page;
  loginPage: LoginPage;
  addEmployeePage: AddEmployeePage;
};

export type EmployeePages = EmployeeCreationPages & {
  employeeListPage: EmployeeListPage;
  employeeJobPage: EmployeeJobPage;
};

export const employeeScenarios = JSON.parse(
  readFileSync(new URL('../../data/employee.json', import.meta.url), 'utf-8'),
) as EmployeeScenario[];

export async function loginAdmin(loginPage: LoginPage): Promise<void> {
  await logStep('Open login page', () => loginPage.goto());
  await logStep('Sign in as Admin', () => loginPage.login('Admin', 'admin123'));
}

export async function prepareProfilePicture(page: Page, imagePath: string): Promise<Buffer> {
  const imageBase64 = readFileSync(imagePath).toString('base64');
  const jpegBytes = await page.evaluate(async (sourceBase64) => {
    const sourceImage = new Image();
    sourceImage.src = `data:image/png;base64,${sourceBase64}`;
    await sourceImage.decode();

    const maximumDimension = 200;
    const scale = Math.min(
      maximumDimension / sourceImage.naturalWidth,
      maximumDimension / sourceImage.naturalHeight,
    );
    const canvas = document.createElement('canvas');
    canvas.width = Math.round(sourceImage.naturalWidth * scale);
    canvas.height = Math.round(sourceImage.naturalHeight * scale);

    const context = canvas.getContext('2d');
    if (!context) {
      throw new Error('Unable to prepare the profile picture for upload');
    }

    context.drawImage(sourceImage, 0, 0, canvas.width, canvas.height);
    const jpegBlob = await new Promise<Blob>((resolve, reject) => {
      canvas.toBlob((blob) => {
        if (blob) {
          resolve(blob);
        } else {
          reject(new Error('Unable to encode the profile picture as JPEG'));
        }
      }, 'image/jpeg', 0.85);
    });

    return Array.from(new Uint8Array(await jpegBlob.arrayBuffer()));
  }, imageBase64);

  const imageBuffer = Buffer.from(jpegBytes);
  if (imageBuffer.byteLength > 1_048_576) {
    throw new Error('Prepared profile picture still exceeds OrangeHRM 1 MB upload limit');
  }

  return imageBuffer;
}

export async function createEmployee(
  employee: EmployeeScenario,
  { page, loginPage, addEmployeePage }: EmployeeCreationPages,
): Promise<string> {
  const availableIdDigits = 10 - employee.employeeIdPrefix.length;
  if (availableIdDigits < 1) {
    throw new Error('Employee ID prefix must leave room for a unique suffix');
  }

  const employeeId = `${employee.employeeIdPrefix}${Date.now()
    .toString()
    .slice(-availableIdDigits)}`;
  const profilePicturePath = fileURLToPath(
    new URL(`../../data/${employee.profilePicture}`, import.meta.url),
  );

  await loginAdmin(loginPage);
  await logStep('Navigate to PIM > Add Employee', () => addEmployeePage.goto());

  const profilePicture = await logStep('Prepare profile picture for upload', () =>
    prepareProfilePicture(page, profilePicturePath),
  );
  await logStep('Fill employee details from JSON data', () =>
    addEmployeePage.fillEmployeeDetails(employee.firstName, employee.lastName, employeeId),
  );
  await logStep('Upload profile picture', () =>
    addEmployeePage.uploadProfilePicture(profilePicture),
  );
  const createResponsePromise = page.waitForResponse(
    (response) =>
      new URL(response.url()).pathname.endsWith('/api/v2/pim/employees') &&
      response.request().method() === 'POST',
  );
  await logStep('Save new employee', () => addEmployeePage.save());
  const createResponse = await createResponsePromise;
  await logStep('Assert employee creation request succeeds', async () => {
    expect([200, 201]).toContain(createResponse.status());
  });

  return employeeId;
}

export function employeeApiUrl(page: Page, employeeNumber: string): string {
  return new URL(
    `/web/index.php/api/v2/pim/employees/${employeeNumber}`,
    page.url(),
  ).toString();
}

export function employeeNumberFromProfileUrl(url: string): string {
  const employeeNumber = url.match(/\/empNumber\/(\d+)$/)?.[1];
  if (!employeeNumber) {
    throw new Error('Could not determine the employee number from the profile URL');
  }

  return employeeNumber;
}

export async function openEmployeeJobDetails(
  employee: EmployeeScenario,
  employeeId: string,
  { page, employeeListPage, employeeJobPage }: EmployeePages,
): Promise<void> {
  await logStep('Navigate to PIM > Employee List', () => employeeListPage.goto());
  await logStep('Search by the new Employee ID', () =>
    employeeListPage.searchByEmployeeId(employeeId),
  );

  const employeeRow = employeeListPage.employeeRow(employeeId);
  await logStep('Assert the Employee ID returns one record', () =>
    expect(employeeRow).toHaveCount(1),
  );
  await logStep('Cross-check employee identity in the UI list', async () => {
    const rowText = await employeeRow.innerText();
    expect(rowText).toContain(employeeId);
    expect(rowText).toContain(employee.firstName);
    expect(rowText).toContain(employee.lastName);
  });
  await logStep('Open the employee record', () =>
    employeeListPage.openEmployeeById(employeeId),
  );
  await logStep('Open the Job tab', () => employeeJobPage.open());
  await logStep('Assert Job Details is visible', () =>
    expect(employeeJobPage.heading).toBeVisible(),
  );
}

export async function readEmployeeJobDetails(
  employee: EmployeeScenario,
  employeeId: string,
  pages: EmployeePages,
): Promise<EmployeeUiDetails> {
  await openEmployeeJobDetails(employee, employeeId, pages);
  const { employeeJobPage } = pages;

  await logStep('Wait for saved Job Title to render', () =>
    expect
      .poll(() => employeeJobPage.selectedJobTitle(), { timeout: 15_000 })
      .not.toBe('-- Select --'),
  );
  await logStep('Wait for saved Employment Status to render', () =>
    expect
      .poll(() => employeeJobPage.selectedEmploymentStatus(), { timeout: 15_000 })
      .not.toBe('-- Select --'),
  );

  return {
    employeeId,
    firstName: employee.firstName,
    lastName: employee.lastName,
    jobTitle: await employeeJobPage.selectedJobTitle(),
    employmentStatus: await employeeJobPage.selectedEmploymentStatus(),
  };
}

export async function updateEmployeeJobDetails(
  employee: EmployeeScenario,
  employeeId: string,
  pages: EmployeePages,
): Promise<EmployeeUiDetails> {
  const { page, employeeJobPage } = pages;
  await openEmployeeJobDetails(employee, employeeId, pages);
  await logStep(`Set Job Title to ${employee.jobTitle}`, () =>
    employeeJobPage.selectJobTitle(employee.jobTitle),
  );
  await logStep(`Set Employment Status to ${employee.employmentStatus}`, () =>
    employeeJobPage.selectEmploymentStatus(employee.employmentStatus),
  );
  const jobUpdateResponsePromise = page.waitForResponse(
    (response) =>
      response.url().endsWith('/job-details') &&
      ['PUT', 'PATCH'].includes(response.request().method()),
  );
  await logStep('Save updated job details', () => employeeJobPage.save());
  const jobUpdateResponse = await jobUpdateResponsePromise;
  await logStep('Assert job details update request succeeds', async () => {
    expect(jobUpdateResponse.status()).toBe(200);
  });
  await logStep('Reload the employee Job tab', () => page.reload());

  const uiDetails = await readEmployeeJobDetails(employee, employeeId, pages);
  await logStep('Assert saved job details in the UI', async () => {
    expect(uiDetails.jobTitle).toBe(employee.jobTitle);
    expect(uiDetails.employmentStatus).toBe(employee.employmentStatus);
  });
  return uiDetails;
}

export async function verifyEmployeeApiMatchesUi(
  page: Page,
  employeeNumber: string,
  uiDetails: EmployeeUiDetails,
): Promise<void> {
  const employeeResponse = await logStep('GET employee details from OrangeHRM API', () =>
    page.context().request.get(employeeApiUrl(page, employeeNumber)),
  );
  await logStep('Assert employee API response succeeds', async () => {
    expect(employeeResponse.status()).toBe(200);
  });
  const employeeApiData = (await employeeResponse.json()) as {
    data: { employeeId: string; firstName: string; lastName: string };
  };

  const jobResponse = await logStep('GET employee job details from OrangeHRM API', () =>
    page.context().request.get(`${employeeApiUrl(page, employeeNumber)}/job-details`),
  );
  await logStep('Assert job details API response succeeds', async () => {
    expect(jobResponse.status()).toBe(200);
  });
  const jobApiData = (await jobResponse.json()) as {
    data: {
      jobTitle: { title: string } | null;
      empStatus: { name: string } | null;
    };
  };

  await logStep('Cross-check employee identity between UI and API', async () => {
    expect(employeeApiData.data).toMatchObject({
      employeeId: uiDetails.employeeId,
      firstName: uiDetails.firstName,
      lastName: uiDetails.lastName,
    });
  });
  await logStep('Cross-check updated job fields between UI and API', async () => {
    expect(jobApiData.data.jobTitle?.title).toBe(uiDetails.jobTitle);
    expect(jobApiData.data.empStatus?.name).toBe(uiDetails.employmentStatus);
  });
}

export async function deleteEmployee(
  employeeId: string,
  { page, employeeListPage }: EmployeeCreationPages & { employeeListPage: EmployeeListPage },
): Promise<void> {
  await logStep('Navigate to PIM > Employee List', () => employeeListPage.goto());
  await logStep('Search by the new Employee ID', () =>
    employeeListPage.searchByEmployeeId(employeeId),
  );
  await logStep('Assert the Employee ID returns one record', () =>
    expect(employeeListPage.employeeRow(employeeId)).toHaveCount(1),
  );
  await logStep('Open employee profile to obtain API identifier', () =>
    employeeListPage.openEmployeeById(employeeId),
  );
  const employeeNumber = employeeNumberFromProfileUrl(page.url());

  await logStep('Return to PIM > Employee List', () => employeeListPage.goto());
  await logStep('Search for employee before deletion', () =>
    employeeListPage.searchByEmployeeId(employeeId),
  );

  const deleteResponsePromise = page.waitForResponse(
    (response) =>
      response.url().includes('/api/v2/pim/employees') &&
      response.request().method() === 'DELETE',
  );
  await logStep('Delete employee through the UI', () =>
    employeeListPage.deleteEmployeeById(employeeId),
  );
  const deleteResponse = await deleteResponsePromise;

  await logStep('Assert employee DELETE API response succeeds', async () => {
    expect(deleteResponse.status()).toBe(200);
  });
  await logStep('Assert deletion confirmation is visible', () =>
    expect(employeeListPage.deleteSuccessMessage).toBeVisible({ timeout: 15_000 }),
  );
  await logStep('Assert employee is absent from the UI list', () =>
    expect(employeeListPage.employeeRow(employeeId)).toHaveCount(0),
  );

  const employeeResponse = await logStep('GET deleted employee from OrangeHRM API', () =>
    page.context().request.get(employeeApiUrl(page, employeeNumber)),
  );
  const deletedEmployeeApiData = (await employeeResponse.json()) as {
    error?: { message?: string; data?: { invalidParamKeys?: string[] } };
  };
  await logStep('Assert deleted employee is rejected by the API', async () => {
    expect(employeeResponse.status()).toBe(422);
    expect(deletedEmployeeApiData.error?.message).toBe('Invalid Parameter');
    expect(deletedEmployeeApiData.error?.data?.invalidParamKeys).toContain('empNumber');
  });
}

export async function logoutAndAssertInvalidatedSession(
  loginPage: LoginPage,
  userMenuPage: UserMenuPage,
  page: Page,
): Promise<void> {
  await logStep('Log out through the user menu', () => userMenuPage.logout());
  await logStep('Assert login page is displayed after logout', async () => {
    await expect(page).toHaveURL(/\/web\/index\.php\/auth\/login$/);
    await expect(loginPage.heading).toBeVisible();
  });

  const protectedApiResponse = await logStep(
    'Request protected employee API after logout',
    () => page.context().request.get(employeeApiUrl(page, '1')),
  );
  await logStep('Assert signed-out session is rejected by the API', async () => {
    expect(protectedApiResponse.status()).toBe(401);
  });
}
