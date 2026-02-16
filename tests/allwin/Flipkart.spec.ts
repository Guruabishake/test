import { test, expect } from '@playwright/test';

test.setTimeout(100000000);

test('test', async ({ page }) => {

  for (let run = 1; run <= 3; run++) {

    console.log(`Run number: ${run}`);

    await page.goto('https://www.flipkart.com/');

    await page.getByRole('textbox', { name: 'Search for Products, Brands' }).fill('tv');
    await page.keyboard.press('Enter');

    await page.waitForTimeout(2000);

    const newOne = page.locator(
      'xpath=/html/body/div/div/div[3]/div[1]/div[2]/div[2]/div/div/div/a/div[2]/div[1]/div[2]'
    );

    await newOne.first().click();

    await page.waitForTimeout(3000);
  }

});

  // await page.getByRole('button', { name: 'Search for Products, Brands' }).click();
  // await page.locator('section:nth-child(6) > .kMXMaw > .Za3X8s > div:nth-child(2) > .i5kg2N > .BMOCJ3 > .ybaCDx').click();
  // const page1Promise = page.waitForEvent('popup');
  // await page.getByRole('link', { name: 'Apple iPhone 16 Plus (Black,' }).click();
  // const page1 = await page1Promise;
  // await page1.getByRole('button', { name: 'Add to cart', exact: true }).click();
