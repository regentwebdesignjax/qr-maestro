# QR Sensei — HubSpot CRM Integration Guide

**Purpose:** This document is the authoritative reference for QR Sensei's HubSpot CRM integration. It covers how the integration works end-to-end, precise setup instructions for both the QR Sensei and HubSpot sides, field mappings, lead management, troubleshooting, and common Q&A. Use this as training material for the AI chatbot and as a setup guide for customers.

---

## Table of Contents

1. [Overview](#1-overview)
2. [How It Works — End-to-End Flow](#2-how-it-works--end-to-end-flow)
3. [Prerequisites](#3-prerequisites)
4. [Setup Guide: QR Sensei Side](#4-setup-guide-qr-sensei-side)
5. [Setup Guide: HubSpot Side](#5-setup-guide-hubspot-side)
6. [Field Mapping Reference](#6-field-mapping-reference)
7. [Lead Tag vs. HubSpot Segment Label](#7-lead-tag-vs-hubspot-segment-label)
8. [Managing Leads in QR Sensei](#8-managing-leads-in-qr-sensei)
9. [Disconnecting HubSpot](#9-disconnecting-hubspot)
10. [Limitations & Known Constraints](#10-limitations--known-constraints)
11. [Troubleshooting](#11-troubleshooting)
12. [FAQ](#12-faq)

---

## 1. Overview

QR Sensei's HubSpot integration connects your Digital Business Card lead capture directly to your HubSpot CRM. When someone scans your Digital Business Card QR code and submits their contact details via the "Exchange Info" form, that lead is stored in QR Sensei. You then sync it to HubSpot — either one at a time or in bulk — and QR Sensei creates or updates a contact in your HubSpot account automatically.

**What the integration does:**
- Stores lead submissions (name, email, phone, notes) from Digital Business Card scans
- Lets you sync any lead to HubSpot as a contact with one click
- Maps lead data to standard HubSpot contact properties (email, firstname, lastname, phone, company)
- Optionally writes a **Lead Tag** and a **HubSpot Segment Label** to custom HubSpot contact properties, enabling automated list enrollment and lead routing
- Detects duplicates — if a contact with the same email already exists in HubSpot, it is updated rather than duplicated
- Tracks sync status per lead so you always know what has and has not been synced

**Plan required:** Black Belt (Pro) — both the Leads feature and HubSpot sync are Black Belt exclusive.

---

## 2. How It Works — End-to-End Flow

Understanding the complete pipeline helps you set up and troubleshoot the integration effectively.

### Step-by-step pipeline

```
1. You create a Digital Business Card QR code in QR Sensei
        └─ Optionally configure: Lead Tag and/or HubSpot Segment Label

2. Someone scans your QR code with their phone

3. They tap "Exchange Info" on your Digital Business Card page

4. They fill in and submit the form (name, email, phone, optional notes)

5. QR Sensei saves the submission as a Lead record in your account
        └─ The Lead Tag from your QR card config is attached to the lead automatically

6. You go to the Leads page in The Dojo

7. You click "Sync" (individual) or "Sync to HubSpot (N)" (bulk)

8. QR Sensei sends the lead data to HubSpot via the Contacts API
        └─ If a contact with that email exists → update it
        └─ If no contact exists → create a new one

9. The lead row in QR Sensei updates to show a green "Synced" badge
```

**Key points:**
- Sync is **manual** — leads are not automatically pushed to HubSpot the moment they are captured. You initiate the sync from the Leads page.
- Sync is **idempotent** — syncing the same lead twice updates the existing HubSpot contact; it does not create a duplicate.
- The integration uses **OAuth** — QR Sensei connects to HubSpot using a secure OAuth authorization flow. No API keys need to be manually copied.

---

## 3. Prerequisites

Before setting up the integration, confirm the following:

### QR Sensei requirements
- Active **Black Belt** subscription (monthly or annual)
- At least one **Digital Business Card** QR code created (or plan to create one)

### HubSpot requirements
- A HubSpot account (any tier — Free CRM, Starter, Professional, or Enterprise)
- Your HubSpot user account must have **Contact write** permission (to create/update contacts)
- Optional but recommended for full functionality: the ability to create **custom contact properties** and **active lists** (available on all HubSpot tiers)

### Permissions granted during OAuth
When you connect HubSpot, QR Sensei requests these OAuth scopes:
- `crm.contacts.write` — required to create and update contacts
- `crm.lists.read` — used for list-based features

---

## 4. Setup Guide: QR Sensei Side

### Step 1 — Connect Your HubSpot Account

1. Log in to QR Sensei and go to **The Dojo** (your dashboard).
2. Click **Leads** in the navigation menu.
3. In the top-right area of the Leads page, click the **"Connect to HubSpot"** button (it has a dark red/orange color).
4. A HubSpot authorization popup will open in a new window.
5. Log in to HubSpot if prompted, then click **"Connect app"** to grant QR Sensei access.
6. The popup will close automatically. The button on the Leads page will turn **green** and read **"Connected to HubSpot"**.

> **Tip:** If the popup is blocked by your browser, allow popups for QR Sensei and try again.

---

### Step 2 — Configure Your Digital Business Card for Lead Capture

When creating or editing a Digital Business Card QR code, two optional fields control how captured leads appear in HubSpot:

#### Lead Tag (Optional)
- **Field label:** "Employee ID / Lead Tag (Optional)"
- **Example values:** `EMP-1042`, `Region-West`, `Sales-Team`
- **What it does:** This tag is automatically attached to every lead captured from this specific card. It is stored in QR Sensei and synced to the `lead_tag` custom property in HubSpot (if that property exists — see [HubSpot Setup](#5-setup-guide-hubspot-side)).
- **Best used for:** Identifying which employee's card a lead came from, or categorizing leads by region or team.

#### HubSpot Segment Label (Optional)
- **Field label:** "HubSpot Segment Label (Optional)"
- **Example values:** `Trade Show 2026`, `Product Launch Q3`, `Nashville Conference`
- **What it does:** This value is written to the `qr_sensei_source` custom property on each synced HubSpot contact. Combined with a HubSpot dynamic list filtered by that value, leads from this card will auto-enroll in the matching list.
- **Best used for:** Campaign-level segmentation — group all leads from a specific event or campaign into a HubSpot list for automated follow-up.

> **How to fill these in:** In the QR code creation/edit form, select the **Digital Business Card** content type, then scroll to the bottom of the card configuration. You will see both fields under the contact information section.

---

### Step 3 — Capture Leads

Once your Digital Business Card QR code is printed or shared:

1. Someone scans the code with their phone.
2. Your Digital Business Card page loads in their browser.
3. They tap **"Exchange Info"** to open the contact form.
4. They fill in their **name** (required), **email** (required), **phone** (optional), and **notes** (optional), then click **"Send"**.
5. A confirmation message — "Thank you! Your info has been shared." — appears on their screen.
6. The lead is now in your QR Sensei Leads page, waiting to be synced.

---

### Step 4 — Sync Leads to HubSpot

Go to the **Leads** page in The Dojo.

**To sync a single lead:**
- Find the lead in the table.
- In the **HubSpot** column, click the orange **"Sync"** button next to that lead.
- The button shows "Syncing..." while the request processes.
- On success, the status changes to a green **"Synced"** badge.

**To sync multiple leads at once:**
- Click the **"Sync to HubSpot (N)"** button at the top of the Leads page, where N is the number of unsynced leads.
- All unsynced leads are sent to HubSpot in one operation.
- The button is disabled if there are no unsynced leads.

**Sync status indicators:**
| Status | Visual | Meaning |
|---|---|---|
| Not yet synced | Orange "Sync" button | Lead exists in QR Sensei but not in HubSpot |
| Syncing | Spinning icon + "Syncing" | Request in progress |
| Synced | Green "Synced" badge with checkmark | Contact successfully created/updated in HubSpot |
| Sync failed | Red "Sync failed" + hover tooltip | HubSpot rejected the sync; hover to see the error |

---

## 5. Setup Guide: HubSpot Side

The basic integration (name, email, phone syncing) works out of the box with no HubSpot configuration. However, to take full advantage of **Lead Tags** and **HubSpot Segment Labels**, you need to create two custom contact properties in HubSpot and optionally set up dynamic lists.

### Creating the `lead_tag` Custom Property

This property stores the Lead Tag from the QR Sensei card configuration.

1. In HubSpot, click the **Settings** gear icon (top navigation bar).
2. In the left sidebar, go to **Data Management → Properties**.
3. Make sure **Contact properties** is selected (the default).
4. Click **"Create property"** (top right).
5. Fill in the property details:
   - **Object type:** Contact
   - **Group:** Contact information (or any group you prefer)
   - **Label:** `Lead Tag` (this is the display name)
   - **Internal name:** `lead_tag` ← **This must be exactly `lead_tag`**
   - **Field type:** Single-line text
6. Click **"Create"** to save.

> **Why this matters:** QR Sensei checks whether a `lead_tag` property exists in your HubSpot account before attempting to write to it. If the property does not exist, the Lead Tag value is silently skipped during sync (no error).

---

### Creating the `qr_sensei_source` Custom Property

This property stores the HubSpot Segment Label from the QR Sensei card configuration, enabling dynamic list enrollment.

1. In HubSpot, go to **Settings → Data Management → Properties**.
2. Click **"Create property"**.
3. Fill in the property details:
   - **Object type:** Contact
   - **Group:** Contact information (or any group you prefer)
   - **Label:** `QR Sensei Source` (this is the display name)
   - **Internal name:** `qr_sensei_source` ← **This must be exactly `qr_sensei_source`**
   - **Field type:** Single-line text
4. Click **"Create"** to save.

> **Why this matters:** When a lead is synced, QR Sensei writes the Segment Label value to this property. If the property does not exist, the segment label is silently skipped.

---

### Creating a Dynamic List Filtered by `qr_sensei_source` (Optional)

Once the `qr_sensei_source` property exists, you can create HubSpot lists that automatically enroll contacts based on which QR Sensei campaign or event they came from.

1. In HubSpot, go to **Contacts → Lists**.
2. Click **"Create list"** (top right).
3. Choose **"Active list"** (also called a dynamic list — contacts auto-enroll based on criteria).
4. Give the list a descriptive name, e.g., `QR Sensei — Trade Show 2026`.
5. In the filter builder, add a filter:
   - **Filter type:** Contact property
   - **Property:** `QR Sensei Source` (the property you just created)
   - **Condition:** `is equal to`
   - **Value:** `Trade Show 2026` ← must match exactly what you entered in QR Sensei's "HubSpot Segment Label" field
6. Click **"Save list"**.

**Result:** Every time you sync a lead from the "Trade Show 2026" QR card, HubSpot automatically adds that contact to this list. You can then trigger workflows, sequences, or reporting based on the list.

> **Tip:** Create one list per campaign or event — one for each unique Segment Label you use.

---

## 6. Field Mapping Reference

This table shows exactly what data flows from the "Exchange Info" form on the Digital Business Card page, through QR Sensei's database, and into HubSpot.

| Exchange Info Form Field | QR Sensei Database Field | HubSpot Contact Property | Notes |
|---|---|---|---|
| "Your name" (required) | `lead_name` | `firstname` + `lastname` | The first word becomes `firstname`; everything after the first space becomes `lastname`. "John Smith" → firstname: "John", lastname: "Smith" |
| "Your email" (required) | `lead_email` | `email` | Used as the primary key for upsert. If a HubSpot contact with this email exists, it is updated. |
| "Your phone (optional)" | `lead_phone` | `phone` | Only synced if a phone number was entered. |
| "Notes" textarea | `notes` | *(not synced to HubSpot)* | Stored in QR Sensei only. Not sent to HubSpot. |
| *(from QR card config)* | `lead_tag` via `design_config.lead_tag` | `lead_tag` *(custom property)* | Requires the `lead_tag` custom property to exist in HubSpot. |
| *(from QR card config)* | `design_config.hubspot_segment_label` | `qr_sensei_source` *(custom property)* | Requires the `qr_sensei_source` custom property to exist in HubSpot. |
| *(QR code metadata)* | `qr_code_name` | `company` | The name you gave the QR code in QR Sensei is written to the HubSpot `company` field. |

**Standard HubSpot properties used (no setup needed):**
- `email` — standard HubSpot property
- `firstname` — standard HubSpot property
- `lastname` — standard HubSpot property
- `phone` — standard HubSpot property
- `company` — standard HubSpot property

**Custom HubSpot properties required (must be created — see [Section 5](#5-setup-guide-hubspot-side)):**
- `lead_tag` — internal name must be exactly `lead_tag`
- `qr_sensei_source` — internal name must be exactly `qr_sensei_source`

---

## 7. Lead Tag vs. HubSpot Segment Label

These two fields on the Digital Business Card creation form serve different purposes and are often confused.

| | Lead Tag | HubSpot Segment Label |
|---|---|---|
| **Field in QR Sensei** | "Employee ID / Lead Tag" | "HubSpot Segment Label" |
| **Example value** | `EMP-1042`, `Region-West` | `Trade Show 2026`, `Product Launch Q3` |
| **Stored in QR Sensei as** | `lead_tag` on the Lead record | `hubspot_segment_label` in the QR card config |
| **Synced to HubSpot as** | `lead_tag` property | `qr_sensei_source` property |
| **Visible in QR Sensei Leads table** | Yes — shown as a badge | No — stored internally, sent to HubSpot only |
| **Primary use** | Identify which card or employee captured the lead; filter/export leads in QR Sensei | Segment leads in HubSpot by campaign or event; power dynamic list enrollment |
| **Scope** | Per-lead (attached at capture time from the card config) | Per-card (all leads from this card get the same label) |

**Rule of thumb:**
- Use **Lead Tag** when you want to tag and filter leads within QR Sensei (e.g., by employee ID or region).
- Use **HubSpot Segment Label** when you want to build automated HubSpot workflows triggered by which campaign a lead came from.
- You can use both on the same card — they serve complementary purposes.

---

## 8. Managing Leads in QR Sensei

The **Leads** page (accessible from The Dojo navigation) is your central hub for all captured leads.

### Leads table columns

| Column | Description |
|---|---|
| **Name** | The name the contact submitted on the Exchange Info form |
| **Email** | Clickable mailto link |
| **Phone** | Clickable tel link (formatted for readability) |
| **Source Card** | The name of the Digital Business Card QR code they scanned |
| **Lead Tag** | The tag assigned to this card at capture time (shown as a badge) |
| **Notes** | The optional message the contact left |
| **Date** | When the lead was captured |
| **HubSpot** | Sync status — only visible when HubSpot is connected |

### Exporting leads as CSV

Click **"Export CSV"** at the top of the Leads page. The download includes these columns:
- Name, Email, Phone, Source Card, Lead Tag, Notes, Date

Use this file to import leads into other CRMs, share with team members, or keep an offline backup.

### Deduplicating leads

If the same person scans your card multiple times and submits the form more than once, duplicate leads will appear. Click **"Review Dupes (N)"** (visible when duplicates exist) to open the deduplication tool:
- Leads are grouped by email address.
- The oldest entry in each group is automatically marked to keep.
- All newer duplicates are pre-selected for deletion.
- Review the selections, then click **"Delete N Selected"** to remove duplicates permanently.

### Clearing all leads

The **"Clear All"** button permanently deletes all leads from your account. It is disabled until you have exported your leads as CSV first — this is a safety gate to prevent accidental data loss.

**To clear all leads:**
1. Click **"Export CSV"** to download your leads.
2. The "Clear All" button becomes active.
3. Click **"Clear All"** and confirm in the dialog.

> This action is irreversible. HubSpot contacts that were already synced are **not** deleted from HubSpot — only the local QR Sensei records are removed.

---

## 9. Disconnecting HubSpot

To disconnect your HubSpot account from QR Sensei:

1. Go to the **Leads** page in The Dojo.
2. Click the green **"Connected to HubSpot"** button.
3. A confirmation dialog appears: "Disconnect from HubSpot? You will no longer be able to sync leads directly to your HubSpot CRM."
4. Click **"Disconnect"** to confirm.

**What happens after disconnecting:**
- The HubSpot sync buttons disappear from the Leads page.
- Existing leads in QR Sensei retain their sync status (showing "Synced" or "Sync failed" from before).
- **HubSpot contacts already synced are not affected** — they remain in HubSpot unchanged.
- You can reconnect at any time by clicking "Connect to HubSpot" again and re-authorizing.

---

## 10. Limitations & Known Constraints

### Sync is manual, not automatic
QR Sensei does not push leads to HubSpot the moment they are captured. You must initiate sync from the Leads page — either per lead or in bulk. This is by design, giving you the opportunity to review and deduplicate leads before they enter your CRM.

### Notes field is not synced to HubSpot
The "Notes" text that contacts leave on the Exchange Info form is stored in QR Sensei but is not sent to HubSpot. Use it for internal context or include it in your CSV export.

### HubSpot Lists API limitation
QR Sensei's HubSpot connector uses a user-level OAuth token. HubSpot's Lists API (v3) does not accept user-level tokens for programmatic list membership management — this is a HubSpot platform restriction. As a result, QR Sensei cannot automatically add contacts to specific HubSpot lists via the API. The workaround is the `qr_sensei_source` property + a HubSpot dynamic (active) list, which auto-enrolls contacts based on property values. This achieves the same outcome without requiring direct list manipulation.

### Custom properties are optional but unlock full value
The basic integration (name, email, phone, company) works without any HubSpot configuration. However, to use Lead Tags and Segment Labels, you must create the `lead_tag` and `qr_sensei_source` custom properties in HubSpot. QR Sensei silently skips these fields if the properties don't exist — no error is shown.

### One HubSpot connection per account
Each QR Sensei account connects to one HubSpot portal. If you need to sync to multiple HubSpot portals, contact support.

### Email is required for sync
Every lead must have a valid email address to be synced to HubSpot. Leads without email addresses cannot be synced. The Exchange Info form requires email, so this should not be an issue in normal use.

---

## 11. Troubleshooting

### "HubSpot not connected. Please connect your HubSpot account."
- **Cause:** The OAuth connection has not been established or has been revoked.
- **Fix:** Go to the Leads page and click **"Connect to HubSpot"**. Complete the authorization flow in the popup.

### Lead shows "Sync failed" — what do I do?
1. Hover over the red "Sync failed" text in the Leads table to see the full error message.
2. Common causes and fixes:

| Error message | Cause | Fix |
|---|---|---|
| "HubSpot not connected" | Connection dropped or token expired | Click "Connect to HubSpot" to re-authorize |
| "Contact not found in HubSpot search" | HubSpot returned a 409 conflict but couldn't locate the existing contact | Try re-syncing; if it persists, check for the email in HubSpot manually |
| "The connected user may lack 'Lists' permission" | HubSpot user account doesn't have permission to read lists | Ask a HubSpot admin to grant you Lists read permission |
| Any HubSpot API error message | HubSpot rejected the request | Review the specific message; it usually describes the issue clearly |

3. After resolving the issue, click the orange "Sync" button again to retry.

### "The HubSpot connector app is missing the crm.lists.read scope"
- **Cause:** The QR Sensei HubSpot integration was not authorized with all required permissions.
- **Fix:** Disconnect HubSpot and reconnect, ensuring you approve all permission requests during the OAuth flow.

### Lead Tag or Segment Label is not appearing in HubSpot
- **Cause:** The `lead_tag` or `qr_sensei_source` custom property does not exist in your HubSpot account.
- **Fix:** Create the custom property in HubSpot (see [Section 5](#5-setup-guide-hubspot-side)). Then re-sync the affected leads — QR Sensei will write the values to HubSpot on the next sync.

### Contacts are being created as duplicates in HubSpot
- **Cause:** The email address in QR Sensei does not exactly match an existing HubSpot contact email (e.g., different capitalization or a typo in the form submission).
- **Fix:** QR Sensei uses HubSpot's email-based upsert — if the email is not an exact match, a new contact is created. Manually merge duplicates in HubSpot, or use HubSpot's deduplication tools.

### The "Sync to HubSpot" button is not visible
- **Cause 1:** HubSpot is not connected. The sync buttons only appear when the connection is active.
- **Fix:** Click "Connect to HubSpot."
- **Cause 2:** All leads are already synced.
- **Fix:** The button is intentionally disabled when there are no unsynced leads.
- **Cause 3:** The account is not on the Black Belt plan.
- **Fix:** Upgrade to Black Belt to access HubSpot sync.

### The HubSpot authorization popup is not opening
- **Cause:** Browser popup blocker is preventing the OAuth window.
- **Fix:** Allow popups for the QR Sensei domain in your browser settings, then try again.

---

## 12. FAQ

**Q: Is the HubSpot integration available on the free plan?**
A: No. HubSpot CRM sync is a Black Belt (Pro) exclusive feature. The Leads page itself is also only accessible on Black Belt.

**Q: Do I need a paid HubSpot account?**
A: No. The integration works with HubSpot's free CRM tier. Creating custom contact properties and active lists is available on all HubSpot tiers including the free plan.

**Q: Does QR Sensei automatically sync leads to HubSpot as soon as they are captured?**
A: No. Sync is manual — you initiate it from the Leads page by clicking the Sync button. This gives you control to review and deduplicate leads before they enter HubSpot.

**Q: Will syncing a lead twice create a duplicate contact in HubSpot?**
A: No. QR Sensei uses HubSpot's upsert logic: if a contact with the same email address already exists, it is updated with the latest data. A new contact is only created if no existing contact has that email.

**Q: What happens to my HubSpot contacts if I cancel my Black Belt subscription?**
A: Contacts already synced to HubSpot remain in HubSpot permanently — QR Sensei never deletes data from your HubSpot account. You will lose access to the Leads page and sync feature in QR Sensei until you resubscribe.

**Q: Can I sync leads from multiple Digital Business Cards to the same HubSpot account?**
A: Yes. All leads from all your Digital Business Cards sync to the same connected HubSpot account. You can differentiate them using the HubSpot Segment Label (stored in `qr_sensei_source`) and dynamic lists.

**Q: What is the `company` field in HubSpot filled with?**
A: QR Sensei populates the HubSpot `company` field with the **name of the QR code** that captured the lead (e.g., "John Smith's Business Card" or whatever you named the QR code in The Dojo). This provides context about the lead source.

**Q: Does QR Sensei sync the "Notes" field to HubSpot?**
A: No. Notes entered by the contact on the Exchange Info form are stored in QR Sensei only and are not sent to HubSpot.

**Q: Can I use both a Lead Tag and a HubSpot Segment Label on the same card?**
A: Yes — and it is recommended. The Lead Tag helps you filter and identify leads within QR Sensei; the Segment Label enables dynamic list enrollment in HubSpot for automated follow-up sequences.

**Q: The `qr_sensei_source` property exists in HubSpot but contacts are not enrolling in my dynamic list.**
A: Verify that:
1. The Segment Label value on the QR card matches the list filter value exactly (case-sensitive, no extra spaces).
2. The list filter condition is set to `is equal to` (not `contains`).
3. The lead has actually been synced to HubSpot — check the sync status in the QR Sensei Leads page.
4. HubSpot can take a few minutes to process list enrollment after a contact is created or updated.

**Q: Can I sync leads to multiple HubSpot portals?**
A: No. Each QR Sensei account connects to one HubSpot portal. Contact support if you have an enterprise use case requiring multiple portals.

**Q: How do I tell which leads have not been synced to HubSpot yet?**
A: On the Leads page, any lead showing an orange "Sync" button in the HubSpot column has not yet been synced. The "Sync to HubSpot (N)" bulk button at the top of the page also shows the count of unsynced leads.

**Q: I connected HubSpot but I don't see a HubSpot column in the Leads table.**
A: The HubSpot column only appears when HubSpot is actively connected. If the column is missing, check whether the "Connect to HubSpot" button still shows (instead of "Connected to HubSpot"). If so, your connection may have been dropped — click to reconnect.

**Q: Can admins sync leads on behalf of other users?**
A: Yes. QR Sensei admins can access and sync any user's leads.

**Q: Does QR Sensei support other CRMs besides HubSpot?**
A: Not currently. HubSpot is the only direct CRM integration. For other CRMs, use the **Export CSV** feature on the Leads page to download your leads and import them manually.

---

*Last updated: June 2026. Feature behavior is subject to change. Always refer to the QR Sensei app for the most current UI and settings.*
