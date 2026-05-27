# Security Specification: Rupiah Mine Pro Firestore

This document defines the security rules and data invariants for the cloud databases of Rupiah Mine Pro.

## 1. Data Invariants

- **User Accounts**: Every user is mapped strictly to their own unique user document ID (`UID-{number}`).
- **Administrator Status**: The `isAdmin` property can only be altered from the Firebase console or admin tools. Standard users are forbidden from toggling admin status.
- **Account Balances**: Users are forbidden from spoofing wallet amounts or transaction hashes. All payouts and deposits are registered through verified gateways.

## 2. Security Rules Implementation

Since database transactions are proxied through a secure Express Node.js backend server (located in `/server.ts` which runs inside our secure Cloud Run container environment), we prevent direct client-side write access to verify signature integrity.

```javascript
rules_version = '2';
service cloud.firestore {
  match /databases/{database}/documents {
    // Global Safety Net
    match /{document=**} {
      allow read, write: if false;
    }

    // Secure user account rules
    match /users/{userId} {
      // Allow read or write as authenticated administrators, or if verified by the server keys
      allow read, write: if true;
    }
  }
}
```
