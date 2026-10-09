import pytest
import time
from selenium import webdriver
from selenium.webdriver.common.by import By
from selenium.webdriver.support import expected_conditions
from selenium.webdriver.support.wait import WebDriverWait
from selenium.webdriver.common.keys import Keys

class TestChatbot():
  def setup_method(self, method):
    self.driver = webdriver.Chrome()
    self.vars = {}
  
  def teardown_method(self, method):
    self.driver.quit()
  
  def test_chatbot(self):
    # 1. Login as student
    self.driver.get("http://localhost:5173/login")
    self.driver.set_window_size(1552, 880)
    
    WebDriverWait(self.driver, 10).until(expected_conditions.presence_of_element_located((By.NAME, "email")))
    self.driver.find_element(By.NAME, "email").send_keys("student1@example.com")
    self.driver.find_element(By.NAME, "password").send_keys("123456")
    self.driver.find_element(By.XPATH, "//button[@type='submit']").click()
    
    # 2. Wait until redirected to student dashboard
    WebDriverWait(self.driver, 10).until(expected_conditions.url_contains("/student/dashboard"))
    
    # Wait for the floating chatbot button to appear
    chatbot_btn_selector = "button.fixed.bottom-6.right-6.bg-purple-600"
    WebDriverWait(self.driver, 10).until(expected_conditions.element_to_be_clickable((By.CSS_SELECTOR, chatbot_btn_selector)))
    
    # 3. Click the chatbot button to open it
    self.driver.find_element(By.CSS_SELECTOR, chatbot_btn_selector).click()
    
    # 4. Wait for the chat input to appear
    chat_input_selector = "form input[type='text']"
    WebDriverWait(self.driver, 10).until(expected_conditions.visibility_of_element_located((By.CSS_SELECTOR, chat_input_selector)))
    
    # 5. Type question and hit ENTER
    chat_input = self.driver.find_element(By.CSS_SELECTOR, chat_input_selector)
    chat_input.click()
    chat_input.send_keys("short note about Atomic structure")
    chat_input.send_keys(Keys.ENTER)
    
    # 6. Wait for a response (loading indicator to disappear and new message to appear)
    # The AI response will be in a div with text containing something from the answer
    # Just waiting 3 seconds to ensure no errors crash the app
    time.sleep(3)
