const base = require('@playwright/test');
const { HomePage } = require('../pages/HomePage');
const { WorkflowPage } = require('../pages/WorkflowPage');

exports.test = base.test.extend({
    homePage: async ({ page }, use) => {
        await use(new HomePage(page));
    },

    workflowPage: async ({ page }, use) => {
        await use(new WorkflowPage(page));
    }
});

exports.expect = base.expect;