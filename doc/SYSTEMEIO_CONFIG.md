## SYSTEME.IO Configuration Summary

Based on the requirements, SYSTEME.IO's responsibilities include providing front-end forms, a membership site, and video distribution. The critical integration point with Google Apps Script (GAS) is through webhooks.

### 1. Webhook Setup for Payment Events

SYSTEME.IO must be configured to send a webhook to the GAS `doPost` endpoint upon critical events, specifically **successful payment completion** and potentially **form submissions** (e.g., for initial diagnosis data).

**Webhook URL:**
This will be the deployed Web App URL of the Google Apps Script project. (e.g., `https://script.google.com/macros/s/AKfycb.../exec`)

**Payload Content (Recommended for Payment Webhook):**
SYSTEME.IO's webhook payload should include sufficient information for GAS to process the event, such as:

*   `email`: User's email address.
*   `first_name`, `last_name` (or `name`): User's name.
*   `order_id` (or `transaction_id`): Unique identifier for the payment transaction from Stripe/PayPal.
*   `payment_status`: (e.g., `paid`, `refunded`, `failed`).
*   `product_name` (or `offer_name`): Identifier for the product/service purchased (e.g., "English Brain Training Program V4.0").
*   Any other relevant data captured during the form submission that needs to be synchronized with the Google Sheet (e.g., `diagnosis_id`, `answers` in a structured format).

**Webhook Trigger Events:**
*   **Order Confirmed/Payment Succeeded:** This is the primary trigger for updating payment status and initiating follow-up in GAS.
*   *(Optional)* **Form Submitted:** If initial diagnosis data is captured via a SYSTEME.IO form separate from payment, a webhook can be sent on form submission to record the initial diagnosis data in the spreadsheet.

### 2. Form Fields for Data Capture

Ensure that all SYSTEME.IO forms (e.g., diagnosis form, payment form) capture the necessary data that needs to be stored in the Google Sheet. This includes:

*   User's Name
*   User's Email
*   Diagnosis Answers (if applicable, these might need to be structured for easier parsing in GAS, e.g., as hidden fields or a serialized string).

### 3. Membership Site & Video Hosting

SYSTEME.IO will manage the membership site and host video content. GAS will *trigger* access or send AI curriculum URLs, but SYSTEME.IO handles the actual delivery of content to the user.

### 4. Logic Handling

SYSTEME.IO should **not** contain complex business logic. Its role is to collect data, process payments, and send events via webhooks to GAS for all complex decision-making and automation.