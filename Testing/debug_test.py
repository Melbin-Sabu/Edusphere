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
driver.find_element(By.NAME, "title").send_keys("Tom Quiz")
driver.find_element(By.NAME, "batch").click()
driver.find_element(By.XPATH, "//select[@name='batch']/option[. = 'JEE Evening Batch']").click()
driver.find_element(By.NAME, "subject").click()
driver.find_element(By.XPATH, "//select[@name='subject']/option[2]").click()

driver.find_element(By.NAME, "startDate").send_keys("10-07-2026")

driver.find_element(By.NAME, "endDate").send_keys("10-07-2026")

driver.find_element(By.XPATH, "//button[@type='submit']").click()

time.sleep(2)
try:
    alert = driver.switch_to.alert
    print("ALERT TEXT:", alert.text)
    alert.accept()
except:
    print("NO ALERT")
    print("URL IS:", driver.current_url)

driver.quit()
