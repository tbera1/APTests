class BasePage {
    constructor(page) {
        this.page = page;
    }

    async waitForPageLoad() {
        await this.page.waitForLoadState('networkidle');
    }

    async click(locator) {
        await locator.click();
    }

    async close() {
        await this.page.close();
    }
}

module.exports = { BasePage };