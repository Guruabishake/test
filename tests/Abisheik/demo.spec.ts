import { test, expect } from '@playwright/test';
 
// Define an array of test data - each inner array contains [username, password] pairs
// This array will be used to run the same test multiple times with different credentials
const LoginTestData = [
    ['john', 'demo'],
    ['test', 'demo'],
    ['john', 'test'],
    ['test', 'test'],
    ['','']
];
 
// Loop through each test data set in the LoginTestData array
// Destructure [username, password] from each element in the array
for (const [username, password] of LoginTestData) {
    
// Group related tests together with a describe block
// The title shows which username and password combination is being tested
test.describe('Login Tests with Multiple Data Sets', async () => {
test(`LoginTest for ${username} and ${password}`, async ({ page }) => {
    await page.goto('https://parabank.parasoft.com/parabank/index.htm');
    await page.fill("//input[@type='text']", username);
    await page.fill("//input[@type='password']", password);
    await page.click("//input[@value='Log In']");
    if(await page.locator('.title').isVisible()){
        const welcomeMessage = page.locator('.title');
        await expect(welcomeMessage).toHaveText(`Welcome ${username}`);
        console.log(await welcomeMessage.textContent());
    }else{
        const loginError = page.locator("//h1[normalize-space()='Error!']");
        await expect(loginError).toHaveText('Error!');
        console.log(await loginError.textContent());
        //await expect(page).toHaveURL('https://parabank.parasoft.com/parabank/index.htm');
    }
})
    })
}
