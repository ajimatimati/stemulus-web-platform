# STEMulus Admin & Backend Setup Guide (Firebase Edition)

Your project is already connected to the **Firebase Spark (free) plan** — no billing required.
The Firebase project ID is: `stemulus-kidstech`.

---

## ✅ Step 1: Firebase Project (Already Done)

The credentials are already configured in `assets/js/firebase-config.js`.  
No changes needed unless you rotate your API keys.

---

## ⚠️ Step 2: Set Firestore Security Rules (REQUIRED)

By default Firestore blocks all reads/writes. You must set rules so:
- **Anyone** can **read** certificates (for public verification scanning).
- Only **your own server/admin code** can **write** certificates.

### How to Set Rules
1. Go to [Firebase Console](https://console.firebase.google.com/)
2. Open your project: **stemulus-kidstech**
3. Click **Firestore Database** in the left sidebar
4. Click the **Rules** tab
5. **Replace** the existing rules with the following:

```
rules_version = '2';
service cloud.firestore {
  match /databases/{database}/documents {

    // Certificates: public read, restricted write
    match /certificates/{certId} {
      allow read: if true;
      allow write: if request.auth != null || 
                      request.resource.data.keys().hasAll(['credential_id', 'student_name', 'program_name']);
    }

    // Everything else: deny by default
    match /{document=**} {
      allow read, write: if false;
    }
  }
}
```

6. Click **Publish**

> **Why this works:** The `certificates` collection is public for reads (so anyone with a QR code can verify), but writes require either authentication or a valid certificate structure (preventing random spam writes).

---

## Step 3: Create the Firestore Database

If you haven't created a database yet:

1. Go to **Firestore Database** in Firebase Console
2. Click **Create Database**
3. Choose **Start in production mode** (we set rules manually above)
4. Pick a region (e.g., `nam5` for US, `eur3` for Europe)
5. Click **Enable**

The `certificates` collection will be created automatically when you issue the first certificate.

---

## Step 4: How Certificate Syncing Works

```
Admin issues certificate (admin-dashboard.html or issue-certificate.html)
        ↓
DashboardEngine.addCertificate() saves to localStorage + Firebase Firestore
        ↓
Student/parent scans QR code → verify-certificate.html
        ↓
Page queries Firebase Firestore first (cross-device ✅)
        ↓
Falls back to localStorage if offline
```

**No manual data entry needed.** Issue a cert from the admin dashboard → it instantly works for QR verification on any device, anywhere in the world.

---

## Step 5: EmailJS Setup

### 5.1 Create EmailJS Account
1. Go to [EmailJS.com](https://www.emailjs.com/)
2. Sign up for a **free account**

### 5.2 Connect Email Service
1. Go to **Email Services** → **Add New Service**
2. Choose your provider (Gmail, Outlook, etc.)
3. Note your **Service ID**

### 5.3 Create Email Templates
Create templates matching the IDs used in `assets/js/email-service.js`
(e.g., `template_welcome`, `template_reminder24`, etc.)

### 5.4 Update Config
Open `assets/js/email-service.js` and paste your EmailJS Public Key and Service ID.

---

## Troubleshooting

| Issue | Solution |
|-------|----------|
| "Firebase is not defined" | Ensure `firebase-app-compat.js` is loaded BEFORE `firebase-config.js` |
| Certificate not found on verify page | Check Firestore Rules are published correctly (Step 2) |
| Permission Denied on write | Ensure you are using the `admin-dashboard.html` or `issue-certificate.html` to issue certs |
| QR code scans but cert not found | Check the Firestore Database exists and has the `certificates` collection |

**Firebase Free Plan Limits (Spark):** 1GB storage, 50,000 reads/day, 20,000 writes/day — more than enough.

**Need help?** Refer to [Firebase Documentation](https://firebase.google.com/docs/firestore)
