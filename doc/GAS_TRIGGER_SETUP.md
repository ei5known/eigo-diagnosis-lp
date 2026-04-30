## Google Apps Script (GAS) Trigger Setup Procedures

This document outlines the necessary trigger configurations for the "英語脳育成塾 WEBマーケティングシステム V4.0" Google Apps Script project.

### 1. Deploy Web App for `doPost` (Webhook Endpoint)

To allow SYSTEME.IO to send webhooks to your GAS project, you must deploy the script as a Web App.

1.  Open your GAS project (script.google.com/home/projects/...). The project should contain all `.gs` files developed.
2.  Click on `Deploy` > `New deployment`.
3.  For `Type`, select `Web app`.
4.  **Configuration:**
    *   `Description`: (Optional) e.g., "SYSTEME.IO Webhook Endpoint V4.0"
    *   `Execute as`: `Me` (your Google Account)
    *   `Who has access`: `Anyone` (this is crucial for SYSTEME.IO to reach your script)
5.  Click `Deploy`.
6.  You will be prompted to authorize the script if this is the first deployment or if permissions have changed. Grant the necessary permissions.
7.  After successful deployment, copy the `Web app URL`. This is the URL you will configure in SYSTEME.IO for webhooks.
8.  **Important:** Whenever you make changes to the `handler.gs` (or any related logic that `doPost` depends on), you must create a `New deployment` with a new version to apply the changes to the live Web App URL. Select `Manage deployments` > `Edit` (pencil icon) > `New version` and `Deploy`.

### 2. Set Up Time-Driven Trigger for `check24HourFollowUp()`

This trigger ensures the system periodically checks for payments that require the 24-hour follow-up and AI curriculum email.

1.  In your GAS project, click on the `Triggers` (clock icon) in the left-hand sidebar.
2.  Click `Add Trigger` (bottom right corner).
3.  **Configure the new trigger:**
    *   `Choose function to run`: Select `check24HourFollowUp`.
    *   `Choose which deployment should run`: `Head` (or the specific deployment if you are using multiple versions).
    *   `Select event source`: `Time-driven`.
    *   `Select type of time based trigger`: `Hour timer`.
    *   `Select hour interval`: `Every hour` (or as per your operational needs, e.g., `Every 30 minutes`).
4.  Click `Save`.

### 3. Set Up Time-Driven Trigger for `maskPiiDataBatch()`

This trigger ensures that Personally Identifiable Information (PII) is masked or deleted according to the defined retention policy.

1.  In your GAS project, click on the `Triggers` (clock icon) in the left-hand sidebar.
2.  Click `Add Trigger` (bottom right corner).
3.  **Configure the new trigger:**
    *   `Choose function to run`: Select `maskPiiDataBatch`.
    *   `Choose which deployment should run`: `Head` (or the specific deployment if you are using multiple versions).
    *   `Select event source`: `Time-driven`.
    *   `Select type of time based trigger`: `Day timer`.
    *   `Select day of the week`: (Optional, choose a specific day if preferred, or leave as default for daily).
    *   `Select time of day`: Choose a suitable time (e.g., `Midnight to 1 AM`) when system load is typically low.
4.  Click `Save`.

---