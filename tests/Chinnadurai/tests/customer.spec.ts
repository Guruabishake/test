import { test } from '@playwright/test'
// 👉 Playwright test function import செய்கிறோம்

import { LoginPage } from '../pages/LoginPage'
// 👉 LoginPage class ஐ import செய்கிறோம்

import { CustomerPage } from '../pages/CustomerPage'
// 👉 CustomerPage class ஐ import செய்கிறோம்

import { loginData, customerData } from '../utils/testData'
// 👉 Test data (username, password, customer details) import செய்கிறோம்


test.setTimeout(100000);
// 👉 இந்த test அதிகபட்சம் 100 seconds வரை run ஆக அனுமதி


test('Create Customer', async ({ page }) =>
// 👉 "Create Customer" என்ற test case உருவாக்கப்படுகிறது
{

// 🔹 Login Process
const login = new LoginPage(page)
// 👉 LoginPage object உருவாக்குகிறோம்

await login.goto()
// 👉 Login page open செய்கிறோம்

await login.login(
  loginData.username,
  loginData.password
)
// 👉 username & password கொண்டு login செய்கிறோம்


// 🔹 Customer Creation Process
const customer = new CustomerPage(page)
// 👉 CustomerPage object உருவாக்குகிறோம்

await customer.clickCreate()
// 👉 CRM → Vendor Management → +Create click

await customer.enterCustomerName(customerData.customerName)
// 👉 Customer Name enter செய்கிறோம்

await customer.enterGLCode(customerData.glCode)
// 👉 GL Code enter செய்கிறோம்

await customer.clickCreateButton()
// 👉 Final Create button click செய்கிறோம்

})
