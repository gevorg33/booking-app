# Firebase setup — OptiSchedule Provider

Project: **optischedule-project**  
Bundle / package: **`com.optischedule.provider`**

---

## Android (done)

- `android/app/google-services.json` ✓
- Rebuild: `npm run build:apk:lan`

---

## iOS setup

### 1. Add iOS app in Firebase

1. [Firebase Console](https://console.firebase.google.com/) → **optischedule-project**
2. **Add app → iOS**
3. **Bundle ID:** `com.optischedule.provider`
4. Download **`GoogleService-Info.plist`**
5. Save to:

```
provider-app/ios/App/App/GoogleService-Info.plist
```

6. In **Xcode** (`npm run cap:ios`): drag `GoogleService-Info.plist` into the **App** folder and check **Copy items if needed** + target **App**

### 2. Enable Google Sign-In

Firebase Console → **Authentication → Sign-in method → Google → Enable**

### 3. Configure URL scheme (automatic)

```bash
cd provider-app
bash scripts/configure-ios-firebase.sh
```

This reads `REVERSED_CLIENT_ID` from the plist and updates `Info.plist`.

### 4. Push notifications (optional, real device)

1. Firebase → **Project settings → Cloud Messaging → Apple app configuration**
2. Upload your **APNs Authentication Key** (.p8) from Apple Developer
3. In Xcode → target **App** → **Signing & Capabilities** → **+ Capability** → **Push Notifications**
4. Entitlements file already at `ios/App/App/App.entitlements` — set `CODE_SIGN_ENTITLEMENTS` in Xcode if needed

### 5. Web app config (for Google button in the JS bundle)

Firebase → **Add app → Web** → copy `appId` into `.env.lan`:

```env
VITE_FIREBASE_APP_ID=1:786988272206:web:xxxxxxxx
```

Other vars are auto-filled from `google-services.json` by `scripts/prepare-env.sh`.

### 6. Backend

```env
FIREBASE_SERVICE_ACCOUNT_PATH=./firebase-service-account.json
```

Restart backend after adding.

### 7. Build & run iOS

```bash
cd provider-app
npm run build:ios:lan
npm run cap:ios
```

In Xcode: pick a simulator or your iPhone → **Run**.

Simulator uses `127.0.0.1:3001` for API. Physical device needs LAN IP in `.env.lan`.

---

## Test Google Sign-In

1. Provider must be invited (same email as Google account)
2. Tap **Continue with Google**
3. Should land on **Today**

---

## Troubleshooting

| Issue | Fix |
|-------|-----|
| Google Sign-In fails on iOS | Add `GoogleService-Info.plist`, run `configure-ios-firebase.sh`, rebuild |
| No Google button | Set `VITE_FIREBASE_APP_ID` in `.env.lan` (Web app in Firebase) |
| Push on simulator | Often unavailable — use a real iPhone + APNs key in Firebase |
| Android Google Sign-In | Add SHA-1 fingerprint in Firebase project settings |
