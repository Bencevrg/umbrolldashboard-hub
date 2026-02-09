

# Visszalepes gombok az MFA oldalakhoz

## Problema

Az MFA oldalakrol (2FA ellenorzes es TOTP beallitas) nincs lehetoseg visszalepni. A felhasznalo beragad ezekre a kepernyokre.

## Megoldas

Ket helyen kell "Vissza" gombot hozzaadni:

### 1. MFA Verify oldal (`src/pages/MFAVerify.tsx`)
- Egy "Kijelentkezes" gomb hozzaadasa a kod bevitel ala
- Ez meghivja a `signOut()` fuggvenyt, ami visszairanyit a bejelentkezes oldalra
- (Mivel az MFA verify kotelezoen kerul elo, itt nincs ertelme "vissza" gombnak -- csak kijelentkezni lehet)

### 2. MFA Setup TOTP nézet (`src/pages/MFASetup.tsx`)
- A TOTP beallitas kepernyore (ahol a titkos kulcsot es a kod mezeot latja) egy "Vissza" gomb kerul
- Ez visszaallitja a `selectedType` allapotot `null`-ra, igy a felhasznalo ujra valaszthat modszert

## Technikai reszletek

**`src/pages/MFAVerify.tsx`:**
- A "Megerosite" gomb utan egy `Button variant="ghost"` hozzaadasa "Kijelentkezes" szoveggel
- `onClick` => `signOut()` (mar elerheto a `useAuth` hookbol)

**`src/pages/MFASetup.tsx`:**
- A TOTP nezet (93-122. sor) `CardContent`-jeben a "Megerosite" gomb ala egy uj `Button variant="ghost"` kerul "Vissza" szoveggel
- `onClick` => `setSelectedType(null); setTotpUri(null); setTotpSecret(null); setVerificationCode('');`

