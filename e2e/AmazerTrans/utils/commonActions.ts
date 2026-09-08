import { Page } from '@playwright/test';

function exactTextPattern(text: string): RegExp {
  return new RegExp(`^${text.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')}$`);
}

/**
 * The Customer/Vendor forms use a home-grown "combobox" widget (a <div role="combobox">
 * that opens a searchable option list), not a native <select>. Its <label> is NOT
 * associated to the widget via for/id or aria-labelledby (verified on the live app),
 * so getByLabel() cannot find it. Each field is wrapped in a "div.relative.group"
 * container that holds both the combobox and its floating label - that wrapper is the
 * only reliable way to scope to the right field.
 */
export async function selectCustomDropdown(page: Page, label: string, optionText: string) {
  const field = page.locator('div.relative.group', { has: page.getByText(label, { exact: true }) }).first();
  await field.getByRole('combobox').click();
  // The option list renders as plain <li> elements inside a custom listbox, which Chromium
  // does not always expose with an ARIA "listitem" role once the ancestor sets role="listbox" -
  // getByRole('listitem') is therefore unreliable here, so this targets the <li> tag directly.
  // The panel also closes on blur, so pressing Enter in the (still-focused) search box - rather
  // than clicking the option - avoids a blur-before-click race that made direct clicks hang.
  const option = page.locator('li').filter({ hasText: exactTextPattern(optionText) }).first();
  const searchBox = page.getByPlaceholder('Search...');
  await searchBox.waitFor({ state: 'visible', timeout: 5000 }).catch(() => undefined);
  if (await searchBox.isVisible().catch(() => false)) {
    await searchBox.fill(optionText);
    await option.waitFor({ state: 'visible', timeout: 5000 });
    await searchBox.press('Enter');
  } else {
    await option.click();
  }
}

export async function expandSection(page: Page, sectionHeading: string) {
  const heading = page.getByRole('heading', { name: sectionHeading, exact: true });
  await heading.scrollIntoViewIfNeeded();
  await heading.click();
}
