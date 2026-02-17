import { test } from '@playwright/test'

import { LoginPage } from '../pages/LoginPage'

import { CustomerPage } from '../pages/CustomerPage'

import { loginData, customerData } from '../utils/testData'

test.setTimeout(100000);

test('Create Customer', async ({ page }) =>
{

const login = new LoginPage(page)

await login.goto()

await login.login(

loginData.username,

loginData.password

)


const customer = new CustomerPage(page)

await customer.clickCreate()

await customer.enterCustomerName(customerData.customerName)

await customer.enterGLCode(customerData.glCode)

await customer.clickCreateButton()


})
