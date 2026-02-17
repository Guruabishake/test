import { Page } from '@playwright/test'

export class LoginPage
{

readonly page: Page

constructor(page: Page)
{
this.page = page
}


async goto()
{

await this.page.goto('https://staging-amazertrans.cargowayz.net/login/AMAZERTRANS')

}


async login(username: string, password: string)
{

await this.page.fill('input[type="text"]', username)

await this.page.fill('input[type="password"]', password)

 await this.page.getByRole('combobox').selectOption('15');

await this.page.click('button:has-text("Login")')

}

}
