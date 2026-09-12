## 🗄️ Airtable Database Schema

This project relies on **Airtable** as its backend database to track parking slots, user sessions, and real-time sensor updates from the ESP32. Below is the structure required to set up your Airtable base:

---

### 1. `Slots` Table
Tracks real-time parking slot availability and status updates sent by the hardware.

| Field Name | Type | Options / Description |
| :--- | :--- | :--- |
| `Slot_ID` | Single line text | **Primary Field** (e.g., `SLOT-01`, `SLOT-02`) |
| `Status` | Single select | Options: `Available`, `Occupied`, `Reserved` |
| `Last_Updated` | Last modified time | Automatically tracks when the status was changed |
| `Sensor_Value` | Number | Integer value read from the proximity/ultrasonic sensor |

---

### 2. `Users` Table
Stores user account profiles and authentication references.

| Field Name | Type | Options / Description |
| :--- | :--- | :--- |
| `User_ID` | Single line text | **Primary Field** (Unique User ID or Email) |
| `Full_Name` | Single line text | Full name of the user |
| `Email` | Email | User email address |
| `Vehicle_Number` | Single line text | License plate / vehicle identification string |
| `Created_At` | Created time | Timestamp of account registration |

---

### 3. `History` Table
Logs historical parking events and session records.

| Field Name | Type | Options / Description |
| :--- | :--- | :--- |
| `Log_ID` | Autonumber | **Primary Field** (Auto-incrementing unique record ID) |
| `Slot` | Link to another record | Links to `Slots` table |
| `User` | Link to another record | Links to `Users` table |
| `Entry_Time` | Date / Time | Timestamp when vehicle parked |
| `Exit_Time` | Date / Time | Timestamp when vehicle departed |
| `Duration_Minutes` | Formula | `DATETIME_DIFF({Exit_Time}, {Entry_Time}, 'minutes')` |
