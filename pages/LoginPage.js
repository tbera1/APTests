const { expect } = require('@playwright/test');

class LoginPage {
  constructor(page) {
    this.page = page;

    this.locators = {
      usernameInput: page.getByRole('textbox', { name: 'User name' }),
      passwordInput: page.getByRole('textbox', { name: 'Password' }),
      loginButton: page.getByRole('button', { name: 'Login' }),

      solutionsBtn: page.getByRole('button', { name: 'Solutions Management' })
    };
  }

  async goto() {
    await this.page.goto('/AppNet/Login.aspx');
  }

  async fillUsername(username) {
    await this.locators.usernameInput.fill(username);
  }

  async fillPassword(password) {
    await this.locators.passwordInput.fill(password);
  }

  async clickLogin() {
    await this.locators.loginButton.click();
  }

async login(username, password) {
  await this.fillUsername(username);
  await this.fillPassword(password);
  await this.clickLogin();

  await this.page.waitForLoadState('domcontentloaded');

  await this.page.waitForURL(/AppNet/);

  await this.locators.solutionsBtn.waitFor({ state: 'visible', timeout: 15000 });
}
}

module.exports = { LoginPage };