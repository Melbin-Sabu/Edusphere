import time
from selenium import webdriver
from selenium.webdriver.common.by import By
from selenium.webdriver.support import expected_conditions
from selenium.webdriver.support.wait import WebDriverWait

driver = webdriver.Chrome()
driver.get("http://localhost:5173/login")
driver.set_window_size(1552, 880)

WebDriverWait(driver, 10).until(expected_conditions.presence_of_element_located((By.NAME, "email")))
driver.find_element(By.NAME, "email").send_keys("alen.chemistry@edusphere.com")
driver.find_element(By.NAME, "password").send_keys("Edu@123")
driver.find_element(By.XPATH, "//button[@type='submit']").click()

WebDriverWait(driver, 10).until(expected_conditions.url_contains("/dashboard"))

driver.get("http://localhost:5173/teacher/quizzes/create")
WebDriverWait(driver, 10).until(expected_conditions.presence_of_element_located((By.NAME, "title")))

driver.find_element(By.NAME, "title").click()
driver.find_element(By.NAME, "title").send_keys("Tom")
driver.find_element(By.NAME, "batch").click()
dropdown = driver.find_element(By.NAME, "batch")
dropdown.find_element(By.XPATH, "//option[. = 'JEE Evening Batch']").click()

driver.find_element(By.NAME, "subject").click()
dropdown = driver.find_element(By.NAME, "subject")
dropdown.find_element(By.XPATH, "//select[@name='subject']/option[2]").click()

driver.find_element(By.NAME, "startDate").click()
driver.find_element(By.NAME, "startDate").send_keys("10-07-2026")

driver.find_element(By.CSS_SELECTOR, ".grid:nth-child(5) .border:nth-child(3)").click()
dropdown = driver.find_element(By.CSS_SELECTOR, ".grid:nth-child(5) .border:nth-child(3)")
dropdown.find_element(By.XPATH, "//option[. = '15']").click()

driver.find_element(By.NAME, "endDate").click()
driver.find_element(By.NAME, "endDate").send_keys("10-07-2026")

driver.find_element(By.CSS_SELECTOR, ".grid:nth-child(6) .border:nth-child(3)").click()
dropdown = driver.find_element(By.CSS_SELECTOR, ".grid:nth-child(6) .border:nth-child(3)")
dropdown.find_element(By.XPATH, "//option[. = '20']").click()

invalid_elem = driver.execute_script("return document.querySelector(':invalid')")
if invalid_elem:
    print("INVALID FIELD HTML:", invalid_elem.get_attribute("outerHTML"))
else:
    print("NO INVALID FIELDS")

driver.quit()
