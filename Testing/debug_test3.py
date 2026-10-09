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

driver.execute_script('''
    var input = arguments[0];
    var nativeInputValueSetter = Object.getOwnPropertyDescriptor(window.HTMLInputElement.prototype, 'value').set;
    nativeInputValueSetter.call(input, '2026-10-07');
    var ev = new Event('input', { bubbles: true});
    input.dispatchEvent(ev);
''', driver.find_element(By.NAME, "startDate"))

driver.find_element(By.CSS_SELECTOR, ".grid:nth-child(5) .border:nth-child(3)").click()
dropdown = driver.find_element(By.CSS_SELECTOR, ".grid:nth-child(5) .border:nth-child(3)")
dropdown.find_element(By.XPATH, "//option[. = '15']").click()

driver.execute_script('''
    var input = arguments[0];
    var nativeInputValueSetter = Object.getOwnPropertyDescriptor(window.HTMLInputElement.prototype, 'value').set;
    nativeInputValueSetter.call(input, '2026-10-07');
    var ev = new Event('input', { bubbles: true});
    input.dispatchEvent(ev);
''', driver.find_element(By.NAME, "endDate"))

driver.find_element(By.CSS_SELECTOR, ".grid:nth-child(6) .border:nth-child(3)").click()
dropdown = driver.find_element(By.CSS_SELECTOR, ".grid:nth-child(6) .border:nth-child(3)")
dropdown.find_element(By.XPATH, "//option[. = '20']").click()

invalid_elem = driver.execute_script("return document.querySelector(':invalid')")
if invalid_elem:
    print("INVALID FIELD:", invalid_elem.get_attribute("name"))
else:
    print("NO INVALID FIELDS")

driver.find_element(By.XPATH, "//button[@type='submit']").click()
time.sleep(2)
print("URL:", driver.current_url)

driver.quit()
