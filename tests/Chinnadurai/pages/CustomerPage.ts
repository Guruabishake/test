import { Page } from '@playwright/test'

export class CustomerPage
{

readonly page: Page

constructor(page: Page)
{
this.page = page
}


async clickCreate()
{

     await this.page.getByRole('button', { name: 'CRM' }).click();
  await this.page.getByRole('button', { name: 'Vendor Management' }).click();

await this.page.click('button:has-text("+ Create")')

}


async enterCustomerName(name: string)
{

await this.page.getByRole('textbox', { name: 'Customer Name' }).fill(name)

}


async enterGLCode(code: string)
{

await this.page.getByRole('textbox', { name: 'GL Code' }).fill(code)

}


async clickCreateButton()
{

await this.page.click('button:has-text("Create")')

}

}
