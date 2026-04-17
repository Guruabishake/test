import { Page } from '@playwright/test'
// 👉 Playwright test library இலிருந்து Page class ஐ import செய்கிறோம்

export class CustomerPage
// 👉 CustomerPage என்ற class உருவாக்குகிறோம்
{

readonly page: Page
// 👉 page என்ற variable உருவாக்கப்படுகிறது (Browser page reference வைத்துக்கொள்ள)

constructor(page: Page)
{
this.page = page
// 👉 வெளியில் இருந்து வரும் page ஐ இந்த class க்கு assign செய்கிறோம்
}


// 🔹 CRM → Vendor Management → Create button click செய்யும் function
async clickCreate()
{
 
   await page.getByRole('button', { name: '+ Create' }).click();
  // 👉 "+ Create" button ஐ click செய்கிறது

}



}
