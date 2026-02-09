

# Az Authenticator app TOTP ellenorzes javitasa

## Problema

A `MFASetup.tsx`-ben a TOTP kod ellenorzese **kliensoldali hamis implementacioval** tortenik. A `generateTotpFromCounter` fuggveny NEM valos TOTP algoritmust hasznal -- egy egyszeru hash muveletet csinal a szabvanyos HMAC-SHA1 helyett. Emiatt a Microsoft/Google Authenticator altal generalt kod **soha nem fog egyezni** a kliensoldalon generalttal.

A komment maga is elismeri: *"we'll do a simple hash-based approach for setup verification only"* -- de ez a megoldas egyszeruen nem mukodik.

Kozben a szerveren (a `verify-mfa` edge functionben) letezo, helyes HMAC-SHA1 implementacio van.

## Megoldas

A setup soran a TOTP kod ellenorzeset at kell iranyitani a mar mukodo `verify-mfa` edge function-re, ahelyett hogy kliensoldali hamis ellenorzest hasznalnank.

## Technikai reszletek

**Modositando fajl:** `src/pages/MFASetup.tsx`

1. A `verifyTotp` fuggvenyben a kliensoldali `verifyTotpCode()` hivast lecsereljuk egy `supabase.functions.invoke('verify-mfa', ...)` hivasra, ami a szerveren vegzi az ellenorzest a helyes HMAC-SHA1 algoritmussal.

2. A feleslegesse valo kliensoldali fuggvenyeket (`verifyTotpCode`, `generateTotpFromCounter`) eltavolitjuk -- csak a `generateTotpSecret` marad meg, mert az a titkos kulcs generalasahoz kell.

3. A `verifyTotp` fuggveny uj logikaja:
   - Meghivja a `verify-mfa` edge function-t a `userId`, `code` es `mfaType: 'totp'` parameterekkel
   - Ha a valasz `verified: true`, akkor frissiti az `is_verified` mezot es tovabbnavigal
   - Ha nem, hibauzenet jelenik meg

