
import pytest
from selenium import webdriver
from selenium.webdriver.common.by import By
from selenium.webdriver.support.ui import WebDriverWait
from selenium.webdriver.support import expected_conditions as EC
from selenium.common.exceptions import TimeoutException


class TestTimetableee:

    def setup_method(self):
        options = webdriver.ChromeOptions()
        options.add_argument("--start-maximized")
        self.driver = webdriver.Chrome(options=options)
        self.wait = WebDriverWait(self.driver, 20)

    def teardown_method(self):
        if hasattr(self, "driver"):
            self.driver.quit()

    def test_timetableee(self):
        driver = self.driver

        # 1. Open the timetable page
        driver.get("http://localhost:5173/administrator/timetable")

        # 2. Wait for the page to render
        self.wait.until(
            EC.visibility_of_element_located((By.TAG_NAME, "body"))
        )

        # 3. Print page details to help diagnose missing elements
        print("Current URL:", driver.current_url)
        print(
            "Page text:",
            driver.find_element(By.TAG_NAME, "body").text[:3000]
        )

        # 4. Find an action button by its visible text
        button = None
        keywords = [
            "generate timetable",
            "generate",
            "create timetable",
            "auto generate",
            "generate schedule",
            "timetable"
        ]

        for candidate in driver.find_elements(By.TAG_NAME, "button"):
            if candidate.is_displayed() and candidate.is_enabled():
                text = candidate.text.strip().lower()

                if any(word in text for word in keywords):
                    button = candidate
                    break

        # 5. If no button exists, report a useful error
        if button is None:
            pytest.fail(
                "Could not find a timetable action button. "
                "Check the printed page text. The route may require "
                "administrator login or the button has different text."
            )

        # 6. Click the button
        driver.execute_script(
            "arguments[0].scrollIntoView({block: 'center'});", button
        )
        button.click()

        # 7. Wait for a weekday or a visible timetable result
        try:
            self.wait.until(
                lambda d: any(
                    day in d.find_element(By.TAG_NAME, "body").text
                    for day in [
                        "Monday", "Tuesday", "Wednesday",
                        "Thursday", "Friday", "Saturday", "Sunday"
                    ]
                )
            )
        except TimeoutException:
            pytest.fail(
                "The button was clicked, but no weekday appeared. "
                "Check whether timetable generation succeeded."
            )

        # 8. Verify the result
        page_text = driver.find_element(By.TAG_NAME, "body").text

        assert any(
            day in page_text
            for day in [
                "Monday", "Tuesday", "Wednesday",
                "Thursday", "Friday", "Saturday", "Sunday"
            ]
        )

        print("TIMETABLE TEST PASSED!")


if __name__ == "__main__":
    pytest.main(["test_timetableee.py", "-v", "-s"])
