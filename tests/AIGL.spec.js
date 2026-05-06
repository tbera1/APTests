import invoiceData from '../test-data/invoices.json';
import { test as base } from '@playwright/test';
import { LoginPage } from '../pages/LoginPage';
import { HomePage } from '../pages/HomePage';

const test = base.extend({
    docHandle: async ({}, use) => {
      let handle;

      await use({
        set: (value) => handle = value,
        get: () => handle,
      });
    },
  });

test.beforeEach(async ({ page }) => {
  const loginPage = new LoginPage(page);

  await page.goto('/AppNet');

  await loginPage.login(
    process.env.OB_USERNAME,
    process.env.OB_PASSWORD
  );

  await page.waitForLoadState('domcontentloaded');
  await page.waitForTimeout(3000);
});

test.afterEach(async ({ context, page, docHandle }) => {
    try {
      const handle = docHandle.get();

      if (handle) {
        const homePage = new HomePage(page);

        await page.waitForLoadState('domcontentloaded');

        await homePage.deleteLatestDocument(handle);
      }
    } catch (e) {
      console.log('Cleanup delete failed:', e.message);
    }

    const pages = context.pages();
    for (const p of pages) {
      if (p !== page) {
        await p.close().catch(() => {});
      }
    }

    try {
      await page.waitForLoadState('domcontentloaded');

      const solutionsBtn = page.getByRole('button', { name: 'Solutions Management' });
      const isVisible = await solutionsBtn.isVisible({ timeout: 3000 }).catch(() => false);

      if (isVisible) {
        await solutionsBtn.click();
        await page.getByRole('menuitem', { name: 'Logout' }).click();
        await page.getByText('You have successfully logged').waitFor({ timeout: 5000 });
      }
    } catch (error) {
      console.log('afterEach cleanup skipped:', error.message);
    }
  });

test('workflow navigation after login', async ({ page, docHandle }) => {
  const homePage = new HomePage(page);

  await homePage.verifyLoginSuccess();
  await homePage.removeDocumentLocks();

  const data = invoiceData.invoice1;

  await homePage.importDocument(
    data.documentPath,
    data.invoiceNumber
  );

  const handle = await homePage.getDocumentHandle();

  console.log('Handle from test:', handle);

  docHandle.set(handle);

  const workflowPage = await homePage.navigateWorkflow();

  await workflowPage.verifyLoaded();

  await workflowPage.expandTreeAndSelect(
    'HAP.CAP.01: AP Document Prep',
    'Initial'
  );

  await workflowPage.selectRecordByColumnName('Document Handle', handle);

  await workflowPage.close();

  await homePage.waitForPageReady();
});