# Selenium Test Cases for Laundry Management System

This document contains Selenium IDE test cases with Command, Target, and Value format.

## Test Suite 1: Login Functionality

### TC001: Admin Login
| Command | Target | Value |
|---------|--------|-------|
| open | / | |
| click | id=email | |
| type | id=email | admin@college.edu |
| click | id=password | |
| type | id=password | admin123 |
| click | button[type="submit"] | |
| waitForElementPresent | //h1[contains(text(),'Admin Dashboard')] | |
| assertText | //h1[contains(text(),'Admin Dashboard')] | Admin Dashboard |

### TC002: Staff Login
| Command | Target | Value |
|---------|--------|-------|
| open | / | |
| click | id=email | |
| type | id=email | staff@college.edu |
| click | id=password | |
| type | id=password | staff123 |
| click | button[type="submit"] | |
| waitForElementPresent | //h1[contains(text(),'Staff Dashboard')] | |
| assertText | //h1[contains(text(),'Staff Dashboard')] | Staff Dashboard |

### TC003: Student Login
| Command | Target | Value |
|---------|--------|-------|
| open | / | |
| click | id=email | |
| type | id=email | john.doe@student.college.edu |
| click | id=password | |
| type | id=password | student123 |
| click | button[type="submit"] | |
| waitForElementPresent | //h1[contains(text(),'Student Dashboard')] | |
| assertText | //h1[contains(text(),'Student Dashboard')] | Student Dashboard |

### TC004: Invalid Credentials Login
| Command | Target | Value |
|---------|--------|-------|
| open | / | |
| type | id=email | invalid@email.com |
| type | id=password | wrongpassword |
| click | button[type="submit"] | |
| waitForElementPresent | //div[contains(@class,'alert-destructive')] | |
| assertText | //div[contains(@class,'alert-destructive')] | Invalid credentials |

---

## Test Suite 2: Staff Dashboard - Batch Management

### TC005: View Active Batches Count
| Command | Target | Value |
|---------|--------|-------|
| open | / | |
| type | id=email | staff@college.edu |
| type | id=password | staff123 |
| click | button[type="submit"] | |
| waitForElementPresent | //div[contains(text(),'Active Batches')]/following-sibling::div | |
| assertElementPresent | //div[contains(text(),'Active Batches')] | |

### TC006: Select Block Filter
| Command | Target | Value |
|---------|--------|-------|
| open | / | |
| type | id=email | staff@college.edu |
| type | id=password | staff123 |
| click | button[type="submit"] | |
| waitForElementPresent | //select | |
| click | //select | |
| select | //select | Block A |
| waitForElementPresent | //h3[contains(text(),'Block A Batches')] | |
| assertText | //h3[contains(text(),'Block A Batches')] | Block A Batches |

### TC007: Search for Batch by Batch Number
| Command | Target | Value |
|---------|--------|-------|
| open | / | |
| type | id=email | staff@college.edu |
| type | id=password | staff123 |
| click | button[type="submit"] | |
| waitForElementPresent | //input[@placeholder='Search by batch number, student name, or room...'] | |
| type | //input[@placeholder='Search by batch number, student name, or room...'] | LB001234567 |
| waitForText | //p[contains(text(),'LB001234567')] | LB001234567 |
| assertElementPresent | //p[contains(text(),'LB001234567')] | |

### TC008: Search for Batch by Student Name
| Command | Target | Value |
|---------|--------|-------|
| open | / | |
| type | id=email | staff@college.edu |
| type | id=password | staff123 |
| click | button[type="submit"] | |
| type | //input[@placeholder='Search by batch number, student name, or room...'] | John Doe |
| waitForText | //p[contains(text(),'John Doe')] | John Doe |
| assertElementPresent | //p[contains(text(),'John Doe')] | |

### TC009: View Batch Details
| Command | Target | Value |
|---------|--------|-------|
| open | / | |
| type | id=email | staff@college.edu |
| type | id=password | staff123 |
| click | button[type="submit"] | |
| waitForElementPresent | //p[contains(text(),'LB001234567')] | |
| assertElementPresent | //p[contains(text(),'LB001234567')] | |
| assertElementPresent | //p[contains(text(),'Floor')] | |
| assertElementPresent | //p[contains(text(),'Room')] | |

---

## Test Suite 3: Staff Dashboard - Status Updates

### TC010: Update Batch Status to Washing
| Command | Target | Value |
|---------|--------|-------|
| open | / | |
| type | id=email | staff@college.edu |
| type | id=password | staff123 |
| click | button[type="submit"] | |
| waitForElementPresent | //button[contains(text(),'Update')] | |
| click | //button[contains(text(),'Update')][1] | |
| waitForElementPresent | //select | |
| click | //select[contains(@class,'select')] | |
| select | //select | washing |
| type | //textarea | Started washing cycle |
| click | //button[contains(text(),'Update Status')] | |
| waitForText | //span[contains(text(),'Washing')] | Washing |
| assertText | //span[contains(text(),'Washing')] | Washing |

### TC011: Update Batch Status to Ready for Pickup
| Command | Target | Value |
|---------|--------|-------|
| open | / | |
| type | id=email | staff@college.edu |
| type | id=password | staff123 |
| click | button[type="submit"] | |
| waitForElementPresent | //button[contains(text(),'Update')] | |
| click | //button[contains(text(),'Update')][1] | |
| waitForElementPresent | //select | |
| select | //select | ready_for_pickup |
| type | //textarea | Ready for pickup |
| click | //button[contains(text(),'Update Status')] | |
| waitForText | //span[contains(text(),'Ready for Pickup')] | Ready for Pickup |
| assertText | //span[contains(text(),'Ready for Pickup')] | Ready for Pickup |

### TC012: Quick Mark as Ready (Washing to Ready)
| Command | Target | Value |
|---------|--------|-------|
| open | / | |
| type | id=email | staff@college.edu |
| type | id=password | staff123 |
| click | button[type="submit"] | |
| waitForElementPresent | //span[contains(text(),'Washing')] | |
| waitForElementPresent | //button[contains(text(),'Ready')] | |
| click | //button[contains(text(),'Ready')][1] | |
| waitForText | //span[contains(text(),'Ready for Pickup')] | Ready for Pickup |
| assertText | //span[contains(text(),'Ready for Pickup')] | Ready for Pickup |

### TC013: Add Staff Notes to Batch
| Command | Target | Value |
|---------|--------|-------|
| open | / | |
| type | id=email | staff@college.edu |
| type | id=password | staff123 |
| click | button[type="submit"] | |
| click | //button[contains(text(),'Update')][1] | |
| waitForElementPresent | //textarea | |
| type | //textarea | All items washed and dried. Ready for pickup. |
| select | //select | ready_for_pickup |
| click | //button[contains(text(),'Update Status')] | |
| waitForElementPresent | //p[contains(text(),'All items washed and dried')] | |
| assertText | //p[contains(text(),'All items washed and dried')] | All items washed and dried. Ready for pickup. |

---

## Test Suite 4: Student Dashboard

### TC014: View Student Dashboard
| Command | Target | Value |
|---------|--------|-------|
| open | / | |
| type | id=email | john.doe@student.college.edu |
| type | id=password | student123 |
| click | button[type="submit"] | |
| waitForElementPresent | //h1[contains(text(),'Student Dashboard')] | |
| assertElementPresent | //h1[contains(text(),'Student Dashboard')] | |

### TC015: View Active Batch Status
| Command | Target | Value |
|---------|--------|-------|
| open | / | |
| type | id=email | john.doe@student.college.edu |
| type | id=password | student123 |
| click | button[type="submit")] | |
| waitForElementPresent | //div[contains(text(),'Current Batch Status')] | |
| assertElementPresent | //div[contains(text(),'Current Batch Status')] | |

### TC016: View Schedule Information
| Command | Target | Value |
|---------|--------|-------|
| open | / | |
| type | id=email | john.doe@student.college.edu |
| type | id=password | student123 |
| click | button[type="submit"] | |
| waitForElementPresent | //div[contains(text(),'Schedule')] | |
| assertElementPresent | //div[contains(text(),'Schedule')] | |

---

## Test Suite 5: Admin Dashboard

### TC017: View Admin Dashboard
| Command | Target | Value |
|---------|--------|-------|
| open | / | |
| type | id=email | admin@college.edu |
| type | id=password | admin123 |
| click | button[type="submit"] | |
| waitForElementPresent | //h1[contains(text(),'Admin Dashboard')] | |
| assertElementPresent | //h1[contains(text(),'Admin Dashboard')] | |

### TC018: Navigate to Schedule Management Tab
| Command | Target | Value |
|---------|--------|-------|
| open | / | |
| type | id=email | admin@college.edu |
| type | id=password | admin123 |
| click | button[type="submit"] | |
| waitForElementPresent | //button[contains(text(),'Schedule Management')] | |
| click | //button[contains(text(),'Schedule Management')] | |
| waitForElementPresent | //div[contains(text(),'Schedule Management')] | |
| assertElementPresent | //div[contains(text(),'Schedule Management')] | |

### TC019: View All Batches Tab
| Command | Target | Value |
|---------|--------|-------|
| open | / | |
| type | id=email | admin@college.edu |
| type | id=password | admin123 |
| click | button[type="submit"] | |
| waitForElementPresent | //button[contains(text(),'Batches')] | |
| click | //button[contains(text(),'Batches')] | |
| waitForElementPresent | //div[contains(text(),'All Laundry Batches')] | |
| assertElementPresent | //div[contains(text(),'All Laundry Batches')] | |

---

## Test Suite 6: Navigation and UI Elements

### TC020: Logout Functionality
| Command | Target | Value |
|---------|--------|-------|
| open | / | |
| type | id=email | staff@college.edu |
| type | id=password | staff123 |
| click | button[type="submit"] | |
| waitForElementPresent | //button[contains(text(),'Logout')] | |
| click | //button[contains(text(),'Logout')] | |
| waitForElementPresent | //h2[contains(text(),'Laundry Management System')] | |
| assertElementPresent | //h2[contains(text(),'Laundry Management System')] | |

### TC021: Navigation Bar Display
| Command | Target | Value |
|---------|--------|-------|
| open | / | |
| type | id=email | staff@college.edu |
| type | id=password | staff123 |
| click | button[type="submit"] | |
| waitForElementPresent | //nav | |
| assertElementPresent | //nav | |

### TC022: Statistics Cards Display
| Command | Target | Value |
|---------|--------|-------|
| open | / | |
| type | id=email | staff@college.edu |
| type | id=password | staff123 |
| click | button[type="submit"] | |
| waitForElementPresent | //div[contains(text(),'Active Batches')] | |
| waitForElementPresent | //div[contains(text(),"Today's Batches")] | |
| waitForElementPresent | //div[contains(text(),'Ready for Pickup')] | |
| assertElementPresent | //div[contains(text(),'Active Batches')] | |
| assertElementPresent | //div[contains(text(),"Today's Batches")] | |
| assertElementPresent | //div[contains(text(),'Ready for Pickup')] | |

---

## Test Suite 7: Signup Functionality

### TC023: Navigate to Signup Page
| Command | Target | Value |
|---------|--------|-------|
| open | / | |
| waitForElementPresent | //button[contains(text(),'Create New Account')] | |
| click | //button[contains(text(),'Create New Account')] | |
| waitForElementPresent | //h2[contains(text(),'Create Account')] | |
| assertElementPresent | //h2[contains(text(),'Create Account')] | |

### TC024: Signup as Student
| Command | Target | Value |
|---------|--------|-------|
| open | / | |
| click | //button[contains(text(),'Create New Account')] | |
| waitForElementPresent | //input[@name='full_name'] | |
| type | //input[@name='full_name'] | Test Student |
| type | //input[@name='email'] | test.student@college.edu |
| type | //input[@name='password'] | testpass123 |
| select | //select[@name='role'] | student |
| select | //select[@name='block'] | A |
| type | //input[@name='floor_number'] | 1 |
| type | //input[@name='room_number'] | 101 |
| click | //button[contains(text(),'Sign Up')] | |
| waitForElementPresent | //h1 | |
| assertElementPresent | //h1 | |

---

## Test Suite 8: Status Badge Display

### TC025: Verify Status Badge Colors
| Command | Target | Value |
|---------|--------|-------|
| open | / | |
| type | id=email | staff@college.edu |
| type | id=password | staff123 |
| click | button[type="submit"] | |
| waitForElementPresent | //span[contains(@class,'badge')] | |
| assertElementPresent | //span[contains(text(),'Washing') or contains(text(),'Ready for Pickup') or contains(text(),'Dropped Off')] | |

### TC026: Filter by Block and Verify Batches
| Command | Target | Value |
|---------|--------|-------|
| open | / | |
| type | id=email | staff@college.edu |
| type | id=password | staff123 |
| click | button[type="submit"] | |
| select | //select | Block B |
| waitForElementPresent | //h3[contains(text(),'Block B Batches')] | |
| assertText | //h3[contains(text(),'Block B Batches')] | Block B Batches |
| assertElementPresent | //div[contains(@class,'border')] | |

---

## Test Suite 9: Error Handling

### TC027: Empty Form Validation
| Command | Target | Value |
|---------|--------|-------|
| open | / | |
| click | button[type="submit"] | |
| waitForElementPresent | //input[@required] | |
| assertElementPresent | //input[@required] | |

### TC028: Invalid Email Format
| Command | Target | Value |
|---------|--------|-------|
| open | / | |
| type | id=email | invalid-email |
| type | id=password | test123 |
| click | button[type="submit"] | |
| waitForElementPresent | //input[@type='email'] | |
| assertAttribute | //input[@type='email'] | type | email |

---

## Test Suite 10: Responsive and Accessibility

### TC029: Mobile Viewport Check
| Command | Target | Value |
|---------|--------|-------|
| open | / | |
| setWindowSize | 375 | 667 |
| waitForElementPresent | //body | |
| assertElementPresent | //body | |

### TC030: Desktop Viewport Check
| Command | Target | Value |
|---------|--------|-------|
| open | / | |
| setWindowSize | 1920 | 1080 |
| waitForElementPresent | //body | |
| assertElementPresent | //body | |

---

## How to Use These Test Cases

### For Selenium IDE:

1. **Install Selenium IDE**:
   - Chrome: Install from Chrome Web Store
   - Firefox: Install from Firefox Add-ons

2. **Import Test Cases**:
   - Open Selenium IDE
   - Create a new test suite
   - Add test cases manually using the commands above
   - Or convert to SIDE format (JSON) for import

3. **Running Tests**:
   - Select a test case
   - Click "Run" button
   - View results in the log panel

### For Selenium WebDriver (Python/Java/JavaScript):

Convert the commands to your preferred language:

**Python Example:**
```python
from selenium import webdriver
from selenium.webdriver.common.by import By
from selenium.webdriver.support.ui import WebDriverWait, Select
from selenium.webdriver.support import expected_conditions as EC

driver = webdriver.Chrome()
driver.get("http://localhost:3000")

# TC002: Staff Login
email_field = driver.find_element(By.ID, "email")
email_field.send_keys("staff@college.edu")

password_field = driver.find_element(By.ID, "password")
password_field.send_keys("staff123")

submit_button = driver.find_element(By.CSS_SELECTOR, "button[type='submit']")
submit_button.click()

# Wait for dashboard
WebDriverWait(driver, 10).until(
    EC.presence_of_element_located((By.XPATH, "//h1[contains(text(),'Staff Dashboard')]"))
)
```

### Important Notes:

1. **Update Targets**: CSS selectors and XPaths may need adjustment based on your actual HTML structure
2. **Wait Times**: Adjust wait times based on your application's performance
3. **Environment**: Update URLs if deploying to different environments
4. **Credentials**: Use test credentials, not production ones
5. **Data Cleanup**: Consider adding teardown steps to clean test data

### Priority Test Cases (Start Here):

1. **TC002** - Staff Login (Core functionality)
2. **TC010** - Update Batch Status (Main feature)
3. **TC011** - Mark as Ready for Pickup (Critical workflow)
4. **TC006** - Block Filter (UI feature)
5. **TC007** - Search Functionality (User experience)

---

## Customization Guide

### Finding Element Selectors:

1. **Using Browser DevTools**:
   - Right-click element → Inspect
   - Copy selector or XPath

2. **Recommended Selectors (in order)**:
   - ID: `id=email`
   - CSS Selector: `css=.button-primary`
   - XPath: `xpath=//button[contains(text(),'Update')]`

3. **Wait Strategies**:
   - `waitForElementPresent` - Wait for element existence
   - `waitForVisible` - Wait for element visibility
   - `waitForText` - Wait for specific text

### Common Modifications:

- Change base URL: Update `open` commands
- Adjust timeouts: Add `setTimeout` commands
- Add assertions: Use `assertText`, `assertElementPresent`
- Handle dynamic content: Use `waitFor` commands


