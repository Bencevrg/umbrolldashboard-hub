

# QR kod hozzaadasa a TOTP beallitashoz

## Osszefoglalo

A TOTP beallitas oldalon a titkos kulcs mellett egy QR kod is megjelenik, amit az Authenticator alkalmazassal (Microsoft/Google) beolvasva automatikusan hozzaadodik a fiok -- nem kell kézzel beírni a kulcsot.

## Technikai reszletek

**Uj fuggoseg:** `qrcode.react` csomag -- egy konnyu React komponens, ami kliensoldalon general QR kodot SVG-kent.

**Modositando fajl:** `src/pages/MFASetup.tsx`

1. Importaljuk a `QRCodeSVG` komponenst a `qrcode.react` csomagbol
2. A TOTP beallitas nezetben (95-121. sor korul) a titkos kulcs megjelenitese **fole** beillesztunk egy QR kodot:
   - `<QRCodeSVG value={totpUri} size={200} />` -- a mar letezo `totpUri` valtozot hasznaljuk, ami a szabvanyos `otpauth://totp/...` formatum
   - A QR kod korul feher hatter es nemi padding lesz a jobb olvashatosag erdekeben
3. A titkos kulcs megjelenitese megmarad alatta, mint alternativ lehetoseg ("Vagy masold be kezzel:")

**Eredmeny:** A felhasznalo megnyitja az Authenticator appot, beolvassa a QR kodot, es azonnal megjelenik a 6 jegyu kod -- nincs szukseg kezzel masolgatni.

