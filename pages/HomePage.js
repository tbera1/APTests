const { expect } = require('@playwright/test');
const { FrameHelper } = require('../utils/FrameHelper');
const { WorkflowPage } = require('./WorkflowPage');
const { BasePage } = require('./BasePage');

const DOCUMENT_TYPE_GROUP = '101';
const DOCUMENT_TYPE = '104';

class HomePage extends BasePage {
    constructor(page) {
        super(page);
        this.page = page;

        this.navFrameHelper = new FrameHelper(
            page.locator('iframe[name="NavPanelIFrame"]')
        );
        this.viewerFrameHelper = new FrameHelper(
            page.locator('iframe[name="frmViewer"]')
        );

        this.locators = {
            solutionsBtn: page.getByRole('button', { name: 'Solutions Management' }),
            mainMenu: page.getByRole('navigation', { name: 'Main Menu' }),

            openWorkflow: page.getByRole('menuitem', { name: 'Open Workflow' }),
            importDocument: page.getByRole('menuitem', { name: 'Import Document' }),
            retrieveDocument: page.getByRole('menuitem', { name: 'Document Retrieval' }),

            lockedPopupHeader: page.getByRole('heading', { name: 'Locked Objects' }),
            lockedIframe: page.locator('iframe[title="Locked Objects"]'),
            closeDialogBtn: page.getByRole('button', { name: 'Close Dialog' }),
        };
    }

    getCurrentDate() {
        const today = new Date();
        return `${String(today.getMonth() + 1).padStart(2, '0')}/${
            String(today.getDate()).padStart(2, '0')
        }/${today.getFullYear()}`;
    }

    async getNavFrame() {
        return await this.navFrameHelper.getFrame();
    }

    async getViewerFrame() {
        return await this.viewerFrameHelper.getFrame();
    }

    async openMainMenu() {
        await this.locators.mainMenu.click();
    }

    async fillDateField(field, value) {
        await field.click();
        await field.fill(value); // ✅ Fixed: Direct fill, no need to fill empty first
    }

    async getDocFrame() {
        const viewerFrame = await this.getViewerFrame();
        const docFrameLocator = viewerFrame.locator('iframe[name="frameDocSelect"]');
        await docFrameLocator.waitFor({ state: 'attached' });
        return await docFrameLocator.contentFrame();
    }

    async verifyLoginSuccess() {
        await expect(this.locators.solutionsBtn).toBeVisible();
    }

    async navigateWorkflow() {
        await this.openMainMenu();

        const [popup] = await Promise.all([
            this.page.waitForEvent('popup'),
            this.locators.openWorkflow.click()
        ]);

        await popup.waitForLoadState('domcontentloaded');
        return new WorkflowPage(popup);
    }

    async removeDocumentLocks() {
        const { lockedPopupHeader, lockedIframe, closeDialogBtn } = this.locators;

        const isVisible = await lockedPopupHeader
            .isVisible({ timeout: 5000 })
            .catch(() => false);

        if (!isVisible) {
            console.log('No locked documents popup');
            return;
        }

        const frame = await lockedIframe.contentFrame();
        await frame.getByRole('button', { name: 'Select All', exact: true }).click();
        await frame.getByRole('button', { name: 'Remove Lock' }).click();
        await frame.getByText('No items to display').waitFor();

        await closeDialogBtn.click();
    }

    async importDocument(documentPath, invoiceNumber) {
        const navFrame = await this.getNavFrame();
        const viewerFrame = await this.getViewerFrame();

        await this.openMainMenu();
        await this.locators.importDocument.click();

        // Upload file
        const fileInput = navFrame.locator('input[type="file"]');
        await fileInput.setInputFiles(documentPath);

        // Select Document Type Group
        const docTypeGroup = navFrame.getByLabel('Document Type Groups');
        await expect(docTypeGroup).toBeEnabled();
        await docTypeGroup.selectOption(DOCUMENT_TYPE_GROUP);
        await this.page.waitForTimeout(1000);
        await expect(docTypeGroup).toHaveValue(DOCUMENT_TYPE_GROUP);
        await this.page.waitForTimeout(1000);

        // Select Document Type
        const docType = navFrame.getByLabel('Document Types');
        await expect(docType).toBeEnabled();
        await docType.selectOption(DOCUMENT_TYPE);
        await expect(docType).toHaveValue(DOCUMENT_TYPE);

        // Fill Invoice Number
        const invoiceField = navFrame.getByRole('textbox', { name: 'Invoice Number' });
        await invoiceField.waitFor({ state: 'visible' });
        await expect(invoiceField).toBeEnabled();
        await invoiceField.fill(invoiceNumber);

        // Click Import
        const importBtn = navFrame.getByRole('button', { name: 'Import', exact: true });
        await expect(importBtn).toBeEnabled();
        await importBtn.click();

        // Wait for success message
        await viewerFrame.getByText('Imported Successfully').waitFor({ timeout: 15000 });
    }

    async waitForPageReady() {
        await this.locators.mainMenu.waitFor({ state: 'visible' });
        
        const navIframe = this.page.locator('iframe[name="NavPanelIFrame"]');
        const viewerIframe = this.page.locator('iframe[name="frmViewer"]');
        
        await navIframe.waitFor({ state: 'attached' });
        await viewerIframe.waitFor({ state: 'attached' });
        
        // Verify frames have content (prevents null contentFrame)
        await navIframe.contentFrame({ timeout: 10000 });
        await viewerIframe.contentFrame({ timeout: 10000 });
    }

    async getDocumentHandle() {
        const currentDate = this.getCurrentDate();
        const navFrame = await this.getNavFrame();

        await this.openMainMenu();
        await this.locators.retrieveDocument.click();

        const apInvoiceBtn = navFrame.getByRole('button', { name: 'AP - Invoice' });
        await apInvoiceBtn.waitFor({ state: 'visible' });
        await apInvoiceBtn.click();
        await this.page.waitForTimeout(2000);
        await navFrame.locator('#li104 > .CSListBlock_listOption_check').click();
        await this.page.waitForTimeout(2000);

        const fromDateField = navFrame.locator('#RetrieveDateRangePicker_fromDate_fromDate_date');
        const toDateField = navFrame.locator('#RetrieveDateRangePicker_toDate_toDate_date');

        await this.fillDateField(fromDateField, currentDate);
        await this.fillDateField(toDateField, currentDate);

        await navFrame.getByRole('button', { name: 'AP - Invoice' }).click();

        const searchBtn = navFrame.getByRole('button', { name: 'Search', exact: true });
        await expect(searchBtn).toBeVisible();
        await expect(searchBtn).toBeEnabled();
        await searchBtn.click();

        
        const docFrame = await this.getDocFrame();
        await this.sortByDocumentDateDesc();
        const firstRow = docFrame.locator('[role="row"]').nth(1);
        await firstRow.click();

        await docFrame.getByRole('button', { name: 'Context Menu' }).click();

        const [popup] = await Promise.all([
            this.page.waitForEvent('popup'),
            this.page.getByRole('menuitem', { name: 'Keywords' }).click()
        ]);

        await popup.waitForLoadState('domcontentloaded');
        const documentHandleField = popup.getByRole('textbox', { name: 'Document Handle' });
        await documentHandleField.waitFor({ state: 'visible' });

        const documentHandle = await documentHandleField.inputValue();
        console.log('Document Handle:', documentHandle);

        await popup.getByRole('button', { name: 'Save' }).click().catch(() => {});

        return documentHandle;
    }

    async deleteLatestDocument(documentHandle) {
        const navFrame = await this.getNavFrame();

        await this.openMainMenu();
        await this.locators.retrieveDocument.click();

        const apInvoiceBtn = navFrame.getByRole('button', { name: 'AP - Invoice' });
        await apInvoiceBtn.waitFor({ state: 'visible' });
        await expect(apInvoiceBtn).toBeEnabled();
        await apInvoiceBtn.click();
        await this.page.waitForTimeout(2000);
        await apInvoiceBtn.click();
        await this.page.waitForTimeout(2000);
 
        const docHandleField = navFrame.getByRole('textbox', { name: 'Document Handle' });
        await docHandleField.waitFor({ state: 'visible' });
        await expect(docHandleField).toBeEnabled();
        await docHandleField.fill(documentHandle);
        await this.page.waitForTimeout(2000);

        const searchBtn = navFrame.getByRole('button', { name: 'Search', exact: true });
        await expect(searchBtn).toBeVisible();
        await expect(searchBtn).toBeEnabled();
        await searchBtn.click();

        const docFrame = await this.getDocFrame();
        const contextMenuBtn = docFrame.getByRole('button', { name: 'Context Menu' });
        await contextMenuBtn.waitFor();

        await contextMenuBtn.click();

        await this.page.getByRole('menuitem', { name: 'Delete' }).click();
        await this.page.getByRole('button', { name: 'Yes' }).click();

        // Wait for successful deletion
       // await docFrame.getByText('No items to display').waitFor({ timeout: 10000 });
    }

    async sortByDocumentDateDesc() {
        const docFrame = await this.getDocFrame();

        const header = docFrame.getByText('Document Date');

        await header.click();

        await this.page.waitForTimeout(1000);

        const descIndicator = docFrame.locator('.ui-iggrid-colindicator-desc');

        const isDesc = await descIndicator.isVisible().catch(() => false);

        if (!isDesc) {
            console.log('🔄 Switching to DESC sort');
            await header.click();
            await this.page.waitForTimeout(1000);
        }

        console.log('Sorted by Document Date DESC');
    }
}

module.exports = { HomePage };