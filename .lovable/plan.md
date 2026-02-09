

# Kijelentkezesi gomb hozzaadasa a "Hozzaferes fuggobe" kepernyohoz

## Problema

Amikor egy meg nem jovahagyott felhasznalo bejelentkezik, a "Hozzaferes fuggoben" uzenetet latja, de nincs lehetosege kijelentkezni vagy masik fiokkal bejelentkezni. A felhasznalo "beragad" ezen az oldalon.

## Megoldas

A `src/components/auth/ProtectedRoute.tsx` fajlban a "Hozzaferes fuggoben" blokkhoz hozzaadunk egy **Kijelentkezes** gombot, ami meghivja a `signOut` fuggvenyt az `useAuth` hookbol, es visszairanyitja a felhasznalot a `/auth` oldalra.

## Technikai reszletek

**Modositando fajl:** `src/components/auth/ProtectedRoute.tsx`

Valtozasok:
- Importaljuk a `Button` komponenst
- A `useAuth` hookbol kinyerjuk a `signOut` fuggvenyt is
- A "Hozzaferes fuggoben" uzenet ala elhelyezunk egy "Kijelentkezes" gombot
- A gomb kattintasra meghivja a `signOut()`-ot, ami automatikusan a `/auth` oldalra iranyit (a meglevo logika szerint)

