# GradLogic Student Mobile App

React Native (Expo) app for iOS and Android — **Learn**, **Practice**, and **MCQ proctored exams**.

## Prerequisites

- Node.js 20+
- [Expo CLI](https://docs.expo.dev/get-started/installation/) / Expo Go app on a physical device
- Xcode (iOS) or Android Studio (Android emulator)

## Setup

```bash
cd mobile
npm install
cp .env.example .env
npm start
```

Set `EXPO_PUBLIC_API_URL` in `.env` (default: `https://api.gradlogic.atherasys.com`).

### Troubleshooting install errors

This project uses **Expo SDK 52** with a fixed dependency set. Do **not** mix SDK 57 packages manually.

If you see `ERESOLVE` or `expo-asset cannot be found`:

```powershell
cd mobile
Remove-Item -Recurse -Force node_modules -ErrorAction SilentlyContinue
Remove-Item package-lock.json -ErrorAction SilentlyContinue
npm install
npm start
```

Required Expo packages (already in `package.json`): `expo-asset`, `expo-font`, `expo-router`, etc.

`.npmrc` includes `legacy-peer-deps=true` to avoid peer conflicts on Windows.

### Phone shows "app not found" / can't open project

**The app is not on Play Store or App Store yet.** For development you use **Expo Go**.

1. Install **Expo Go** from Play Store (Android) or App Store (iOS).
2. On your PC, start with **tunnel** (works even if phone and PC are on different networks):

```powershell
cd mobile
npm run start:tunnel
```

3. On your phone, open the **Expo Go app** (not the camera app).
4. Tap **Scan QR code** and scan the QR shown in the terminal.
5. Wait for the bundle to load (first load can take 1–2 minutes).

**If it still fails:**

| Issue | Fix |
|-------|-----|
| SDK incompatible | Update Expo Go from the store, then `npm install` and retry |
| QR opens browser, not app | Scan from inside Expo Go only |
| Connection timeout | Use `npm run start:tunnel` instead of `npm start` |
| Windows firewall | Allow Node.js on private networks |

**Alternative (Android APK on device without Expo Go):** connect phone via USB with USB debugging, then `npx expo run:android` (requires Android Studio).

## Features (v1)

| Tab | Feature |
|-----|---------|
| Home | XP, streak, daily practice, active exams |
| Learn | Enrolled programs and modules |
| Practice | MCQ practice by topic |
| Exams | Proctored drive exams (camera + app-background detection) |
| Profile | Account info and sign out |

## Proctoring

Exams send `clientType: "mobile_app"` when starting. The backend:

- Ignores `mobile_detected` AI flags for mobile sessions
- Tracks `APP_BACKGROUNDED` instead of tab-switch events
- Shows `clientType` on college admin live monitoring (web)

## Assets

Add app icons before store release:

- `assets/icon.png` (1024×1024)
- `assets/splash.png`
- `assets/adaptive-icon.png`

Run `npx expo prebuild` before native builds.

## Docs

See `MOBILE_APP_SPEC.md` in the repo root for full API mapping and release checklist.
