class FrameHelper {
  constructor(frameLocator) {
    this.frameLocator = frameLocator;
  }

  async getFrame() {
    await this.frameLocator.waitFor();
    return await this.frameLocator.contentFrame();
  }

  async waitForElement(selector) {
    const frame = await this.getFrame();
    await frame.locator(selector).waitFor();
    return frame;
  }

  async clickAndWait(clickLocator, waitSelector) {
    const frame = await this.getFrame();

    await clickLocator.click();
    await frame.locator(waitSelector).waitFor();

    return frame;
  }
}

module.exports = { FrameHelper };