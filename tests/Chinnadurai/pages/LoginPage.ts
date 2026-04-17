import { Page } from '@playwright/test'
// 👉 Playwright test library லிருந்து Page class import செய்கிறோம்

export class LoginPage
// 👉 LoginPage என்ற class உருவாக்கப்படுகிறது
{

readonly page: Page
// 👉 page என்ற variable declare செய்கிறோம் (Browser page reference)

constructor(page: Page)
{
this.page = page
// 👉 வெளியிலிருந்து வரும் page ஐ இந்த class க்கு assign செய்கிறோம்
}


// 🔹 Login page க்கு செல்லும் function
async goto()
{

await this.page.goto('https://staging-amazertrans.cargowayz.net/login/AMAZERTRANS')
// 👉 கொடுக்கப்பட்ட URL க்கு browser open ஆகும்

}


// 🔹 Username & Password கொண்டு login செய்யும் function
async login(username: string, password: string)
{

await this.page.fill('input[type="text"]', username)
// 👉 Username textbox இல் value type செய்கிறது

await this.page.fill('input[type="password"]', password)
// 👉 Password textbox இல் value type செய்கிறது

await this.page.getByRole('combobox').selectOption('15');
// 👉 Dropdown (combobox) ல் value 15 select செய்கிறது

await this.page.click('button:has-text("Login")')
// 👉 Login button ஐ click செய்கிறது

}

}
