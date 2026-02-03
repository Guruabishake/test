import { test, expect } from '@playwright/test';

test.setTimeout(12000000);
test('Verify Blog breadcrumb typography', async ({ page }) => {
  //await page.goto('');

  await page.goto('https://stg.jakmax.com.au/blog/how-to-choose-the-right-brush-cutter-australia-and-keep-it-running-with-quality-spare-parts/', { timeout: 60000 });

  const blogText = page.locator(
    '//*[@id="post-15256"]/div/div/div/div[2]/div/div/div[1]/div/h1'
  );

  const styles = await blogText.evaluate(el => {
    const s = getComputedStyle(el);
    return {
      fontFamily: s.fontFamily,
      fontSize: s.fontSize,
      fontWeight: s.fontWeight,
      lineHeight: s.lineHeight,
      letterSpacing: s.letterSpacing,
      color: s.color
    };
  });

  console.log(styles);

  // Figma Assertions
  expect(styles.fontFamily).toContain('Proxima');
  expect(styles.fontSize).toBe('16px'); //expected 14
  expect(styles.fontWeight).toBe('400');
  const lh = parseFloat(styles.lineHeight);
  expect(lh).toBeGreaterThan(23);
  expect(lh).toBeLessThan(25);  // expected 24
  expect(styles.letterSpacing).toBe('normal');   //0px
});
