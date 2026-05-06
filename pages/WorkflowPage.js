const { expect } = require('@playwright/test');
const { BasePage } = require('./BasePage');

class WorkflowPage extends BasePage {
  constructor(page) {
    super(page);

    this.locators = {
      header: page.getByRole('heading', { name: 'Workflow' })
    };
  }

  async verifyLoaded() {
    await this.page.waitForLoadState('networkidle');
    await expect(this.page).toHaveTitle(/Workflow/i, { timeout: 60000 });
  }

  async expandTreeAndSelect(queueName, childNodeName) {
    const treeFrame = this.page.frameLocator('iframe[name="frmWorkflowTree"]');

    const treeItem = treeFrame.getByRole('treeitem', { name: queueName });

    const parentLi = treeItem.locator('xpath=ancestor::li');

    const isExpanded = await parentLi.getAttribute('aria-expanded');

    if (isExpanded !== 'true') {
      console.log(`Expanding: ${queueName}`);

      const toggle = parentLi.locator('.toggle');
      await toggle.click();

      await this.page.waitForTimeout(1500);
    }

    const childNode = treeFrame.getByRole('treeitem', {
      name: new RegExp(childNodeName, 'i')
    });

    await childNode.waitFor({ state: 'visible', timeout: 20000 });
    await childNode.click();

    console.log(`Selected: ${childNodeName}`);
  } 

  async selectRecordByColumnName(columnName, value) {
    const frame = this.page
      .frameLocator('iframe[name="frmWFQueueProvider"]')
      .frameLocator('iframe[name="frmDocuments"]')
      .frameLocator('iframe[name="frmNAXDocProvider"]');

    // 🔑 Wait for grid to load
    await frame.locator('body').waitFor();

    // 🔑 Get headers
    const headers = frame.getByRole('columnheader');
    const headerCount = await headers.count();

    let columnIndex = -1;

    for (let i = 0; i < headerCount; i++) {
      const text = (await headers.nth(i).innerText()).trim();

      if (text.includes(columnName)) {
        columnIndex = i;
        console.log(`📊 Column "${columnName}" at index ${i}`);
        break;
      }
    }

    if (columnIndex === -1) {
      throw new Error(`❌ Column not found: ${columnName}`);
    }

    // 🔑 Get rows
    const rows = frame.locator('[role="row"]');
    const rowCount = await rows.count();

    for (let i = 0; i < rowCount; i++) {
      const row = rows.nth(i);

      const cells = row.locator('[role="gridcell"]');
      const cellCount = await cells.count();

      if (cellCount === 0) continue;

      const cell = cells.nth(columnIndex);
      const cellText = (await cell.innerText()).trim();

      if (cellText === value) {
        console.log(`✅ Found row with ${columnName}: ${value}`);

        await cell.click();
        return;
      }
    }

    throw new Error(`❌ No match for ${columnName} = ${value}`);
  }
}

module.exports = { WorkflowPage };