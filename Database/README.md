# 🔑 Airtable Setup & API Key Integration

Follow these steps to generate your API credentials, link your database, and run the Smart Parking Web Application.

---

## 🛠️ Step 1: Create an Airtable Account & Base

1. Go to [Airtable.com](https://airtable.com) and click **Sign Up** or **Log In**.
2. From your workspace dashboard, click **Create a base**.
3. Name your base (e.g., `Smart Parking System`).
4. Set up your tables (`Slots`, `Users`, `History`) matching the schema detailed in the database section.

---

## 🔑 Step 2: Generate Personal Access Token (API Key)

Airtable uses **Personal Access Tokens (PAT)** for API authentication:

1. Navigate to your Airtable Account page or go directly to [Airtable Builders / Developer Hub](https://airtable.com/create/tokens).
2. Click **Create new token**.
3. Configure the token details:
   * **Token Name:** `Smart Parking System API`
   * **Scopes:** Select the following permissions:
     * `data.records:read`
     * `data.records:write`
   * **Access:** Add your `Smart Parking System` base.
4. Click **Create token**.
5. **Copy the token immediately** (it starts with `pat...`). *Save it in a secure location as it will not be displayed again.*

---

## 🆔 Step 3: Find Your Base ID & Table Names

To direct your application to your specific database:

1. Open your base in your browser.
2. Look at the URL in the address bar:
   ```text
   [https://airtable.com/appXXXXXXXXXXXXXX/tblYYYYYYYYYYYYYY/](https://airtable.com/appXXXXXXXXXXXXXX/tblYYYYYYYYYYYYYY/)...

   -

## ⚙️ Step 4: Add Credentials to Your Project
1.Open the repository code in your editor.
2.Locate the configuration file (or open script.js / auth.js).
3.Insert your Personal Access Token and Base ID into your configuration variables:

```bash
// Database Configuration
const AIRTABLE_PAT = 'YOUR_PERSONAL_ACCESS_TOKEN_HERE'; // Replace with your pat... token
const AIRTABLE_BASE_ID = 'YOUR_BASE_ID_HERE';           // Replace with your app... ID
const AIRTABLE_API_URL = `[https://api.airtable.com/v0/$](https://api.airtable.com/v0/$){AIRTABLE_BASE_ID}`;
```
-

## 🚀 Step 5: Test the Integration
1.Open index.html or login.html in your web browser.
2.Attempt to register a user or view the parking slot status dashboard.
3.Check the developer console (F12 -> Console) to verify successful database fetching and response codes (200 OK).
