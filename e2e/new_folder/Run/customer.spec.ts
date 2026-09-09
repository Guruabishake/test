import { test } from '@playwright/test'

import { LoginPage } from '../Pages/LoginPage'
import { CustomerPage } from '../Pages/CustomerPage'
import { loginData } from '../utils/testData'

test.setTimeout(100000);

test('Create Customer', async ({ page }) => {

  // 🔹 Login Process
  const login = new LoginPage(page)

  await login.goto()

  await login.login(
    loginData.username,
    loginData.password
  )

  // 🔹 Customer Creation Process
  const customer = new CustomerPage(page)

  await customer.clickCreate()

  await customer.fillCustomerFullForm()

})
