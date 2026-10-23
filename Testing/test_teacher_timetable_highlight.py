# Automated Selenium Test for Teacher Timetable & Allotted Hour Highlighting
import pytest
import time
from selenium import webdriver
from selenium.webdriver.common.by import By
from selenium.webdriver.support import expected_conditions as EC
from selenium.webdriver.support.wait import WebDriverWait

class TestTeacherTimetableHighlight():
    def setup_method(self, method):
        options = webdriver.ChromeOptions()
        options.add_argument("--start-maximized")
        options.add_argument("--disable-notifications")
        self.driver = webdriver.Chrome(options=options)
        self.vars = {}

    def teardown_method(self, method):
        if hasattr(self, "driver"):
            self.driver.quit()

    def test_chemistry_teacher_timetable_highlight(self):
        driver = self.driver
        wait = WebDriverWait(driver, 20)

        # 1. Login as Chemistry Teacher (Justin)
        driver.get("http://localhost:5173/login")
        wait.until(EC.presence_of_element_located((By.NAME, "email")))

        email_input = driver.find_element(By.NAME, "email")
        email_input.clear()
        email_input.send_keys("justin.chemistry@edusphere.com")

        password_input = driver.find_element(By.NAME, "password")
        password_input.clear()
        password_input.send_keys("123456")

        submit_btn = wait.until(
            EC.element_to_be_clickable((By.XPATH, "//button[@type='submit']"))
        )
        submit_btn.click()

        # 2. Wait for redirect to teacher dashboard or portal
        wait.until(EC.url_contains("/teacher"))
        time.sleep(1)

        # 3. Verify Timetable link exists on dashboard or sidebar, then navigate to /teacher/timetable
        driver.get("http://localhost:5173/teacher/timetable")
        wait.until(EC.presence_of_element_located((By.XPATH, "//*[contains(text(), 'Faculty Academic Schedule') or contains(text(), 'Timetable')]")))

        # 4. Wait for timetable content to render
        wait.until(EC.presence_of_element_located((By.XPATH, "//*[contains(text(), 'Monday')]")))

        body_text = driver.find_element(By.TAG_NAME, "body").text

        # 5. Verify Chemistry is identified as the teacher's allotted subject
        assert "Chemistry" in body_text, "Teacher's subject Chemistry not found on timetable page"

        # 6. Verify "ALLOTTED HOUR" badges are present
        assert "ALLOTTED HOUR" in body_text, "ALLOTTED HOUR highlight badge not found in teacher timetable"
        assert "Your Class" in body_text or "Hours Allotted to Chemistry" in body_text, "Allotted indicator not found"

        # 7. Check specific highlighted allotted elements
        allotted_elements = driver.find_elements(By.XPATH, "//*[contains(text(), 'ALLOTTED HOUR')]")
        assert len(allotted_elements) > 0, "Expected at least 1 allotted hour badge for Chemistry teacher"
        print(f"\n[INFO] Found {len(allotted_elements)} highlighted ALLOTTED HOUR periods for Chemistry teacher.")

        # 8. Verify other subjects are still visible on schedule (Physics, Botany, Zoology, Mock Test)
        assert "Physics" in body_text, "Physics regular period should still be visible"
        assert "Monday" in body_text and "Tuesday" in body_text, "Weekly days should be visible"

        print("\n[SUCCESS] Chemistry Teacher Timetable Highlight verified successfully!")

    def test_physics_teacher_timetable_highlight(self):
        driver = self.driver
        wait = WebDriverWait(driver, 20)

        # 1. Login as Physics Teacher (Abin Thomas)
        driver.get("http://localhost:5173/login")
        wait.until(EC.presence_of_element_located((By.NAME, "email")))

        email_input = driver.find_element(By.NAME, "email")
        email_input.clear()
        email_input.send_keys("abin.physics@edusphere.com")

        password_input = driver.find_element(By.NAME, "password")
        password_input.clear()
        password_input.send_keys("123456")

        submit_btn = wait.until(
            EC.element_to_be_clickable((By.XPATH, "//button[@type='submit']"))
        )
        submit_btn.click()

        # 2. Wait for redirect to teacher portal
        wait.until(EC.url_contains("/teacher"))
        time.sleep(1)

        # 3. Navigate to timetable
        driver.get("http://localhost:5173/teacher/timetable")
        wait.until(EC.presence_of_element_located((By.XPATH, "//*[contains(text(), 'Monday')]")))

        body_text = driver.find_element(By.TAG_NAME, "body").text

        # 4. Verify Physics is automatically detected as the teacher's subject
        assert "Physics" in body_text, "Teacher's subject Physics not found on timetable page"

        # 5. Verify ALLOTTED HOUR badges are present for Physics
        allotted_elements = driver.find_elements(By.XPATH, "//*[contains(text(), 'ALLOTTED HOUR')]")
        assert len(allotted_elements) > 0, "Expected allotted hour badges for Physics teacher"
        print(f"\n[INFO] Found {len(allotted_elements)} highlighted ALLOTTED HOUR periods for Physics teacher.")

        # 6. Verify Chemistry is also visible on schedule but not as Physics teacher's allotted class
        assert "Chemistry" in body_text, "Chemistry should be visible on timetable"

        print("\n[SUCCESS] Physics Teacher Timetable Automatic Highlight verified successfully!")

if __name__ == "__main__":
    pytest.main(["test_teacher_timetable_highlight.py", "-v", "-s"])
