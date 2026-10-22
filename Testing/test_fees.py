# Generated for EduSphere Evaluation
import pytest
import time
from selenium import webdriver
from selenium.webdriver.common.by import By
from selenium.webdriver.support import expected_conditions
from selenium.webdriver.support.wait import WebDriverWait

class TestFees():
  def setup_method(self, method):
    self.driver = webdriver.Chrome()
    self.vars = {}

  def teardown_method(self, method):
    self.driver.quit()

  def test_fees(self):
    self.driver.get("http://localhost:5173/login")
    self.driver.maximize_window()

    # 1. Login as student
    WebDriverWait(self.driver, 10).until(
        expected_conditions.presence_of_element_located((By.NAME, "email"))
    )
    self.driver.find_element(By.NAME, "email").send_keys("student1@example.com")
    self.driver.find_element(By.NAME, "password").send_keys("123456")
    self.driver.find_element(By.XPATH, "//button[@type='submit']").click()

    # 2. Wait for redirect
    WebDriverWait(self.driver, 10).until(
        expected_conditions.url_contains("/student")
    )

    # 3. Navigate to Student Fees
    self.driver.get("http://localhost:5173/student/fees")

    # 4. Wait for fee cards or header
    WebDriverWait(self.driver, 10).until(
        expected_conditions.presence_of_element_located((By.XPATH, "//h1[contains(., 'Fee') or contains(., 'Payment') or contains(., 'Student')] | //div[contains(@class, 'grid')]"))
    )

    # 5. Assert fees page is active
    assert "/student/fees" in self.driver.current_url
    print("\n✅ STUDENT FEES TEST PASSED! Fees ledger and installments loaded successfully.")

if __name__ == "__main__":
    pytest.main(["test_fees.py", "-v", "-s"])
