

# Jelszo valtoztatas funkció

## Osszefoglalo

A bejelentkezett felhasznalok egy uj oldalon ("Jelszo valtoztatas") megadhatjak a jelenlegi jelszavukat es beallithatnak egy ujat. Az oldal elerheto lesz a fejlec felhasznaloi menujebol.

## Valtozasok

### 1. Uj oldal: `src/pages/ChangePassword.tsx`
- Egy egyszerű űrlap harom mezővel:
  - Jelenlegi jelszo (validaciora)
  - Uj jelszo (min. 6 karakter)
  - Uj jelszo megerositese
- A Supabase `updateUser({ password })` metodusat hasznaljuk -- ez a bejelentkezett felhasznalo jelszavat frissiti
- Sikeres valtoztatas utan visszairanyit a fooldara
- "Vissza" gomb a navigaciohoz

### 2. Uj route: `src/App.tsx`
- `/change-password` utvonal hozzaadasa `ProtectedRoute`-on belul

### 3. Menu bovitese: `src/components/dashboard/DashboardHeader.tsx`
- Uj menuelem: "Jelszo valtoztatas" (Key ikon) a 2FA beallitas es a kijelentkezes kozott

## Technikai reszletek

- A `supabase.auth.updateUser({ password: newPassword })` hivast hasznaljuk -- ez a Supabase beepitett funkcioja, nem kell hozza edge function
- A jelenlegi jelszo ellenorzeset a `supabase.auth.signInWithPassword()` hivassal vegezzuk el a frissites elott, hogy megbizonyosodjunk rola a felhasznalo jogosult a valtoztatasra
- Kliensoldalon ellenorizzuk, hogy az uj jelszo es a megerosites egyezik-e
- Minimum 6 karakteres jelszot varunk el

