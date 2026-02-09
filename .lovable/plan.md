

# Terv: Regisztracio biztonsaga es bejelentkezesi hiba javitasa

## Problema

1. Az `/auth?register=true` URL mindenki szamara elerheto, igy barki regisztralhat a meghivo rendszer megkerülesevel
2. A bejelentkezes nem mukodik, mert az email megerosites be van kapcsolva, de email kuld szolgaltatas (Mailtrap) meg nincs konfigurálva

## Megoldas

### 1. Automatikus email-megerosites bekapcsolasa (atmeneti)

A Supabase auth konfiguracion at be kell allitani az automatikus email megerositest, hogy az elso admin felhasznalo be tudjon jelentkezni API kulcs nelkul.

- Kesobb, amikor a Mailtrap API kulcs elerheto, ezt visszakapcsoljuk

### 2. Publikus regisztracio letiltasa

Az `Auth.tsx` oldalon el kell tavolitani a regisztracios lehetoseget. A regisztracio csak meghivon keresztul lesz elerheto (`AcceptInvite.tsx`).

Valtozasok az `src/pages/Auth.tsx` fajlban:
- Eltavolitjuk a `?register=true` parameter kezeleset
- Csak a bejelentkezesi urlapot jelenítjuk meg
- A regisztracios logika teljesen kiesik ebbol az oldalbol

### 3. Az elso admin letrehozasanak folyamata

Mivel a publikus regisztracio le lesz tiltva, az elso admin letrehozasa a kovetkezo lepesekbol all:
1. Ideiglenesen visszaallitjuk a regisztracios lehetoseget (vagy kozvetlenul az adatbazisban hozzuk letre)
2. Az automatikus email-megerosites mar be lesz kapcsolva, igy a fiok azonnal aktiv
3. SQL paranccsal kiosztjuk az admin szerepet
4. Utana a regisztracio ujra le lesz tiltva

---

## Technikai reszletek

### Fajl modositasok

**`src/pages/Auth.tsx`**
- Toroljuk az `isRegister` valtozot es a `searchParams` hasznalatat
- Toroljuk a `signUp` agat a `handleSubmit`-bol
- Csak `signInWithPassword` marad
- Az UI-bol eltunnek a regisztracios szovegek

### Auth konfiguracio
- `configure-auth` eszkozzel bekapcsoljuk az `autoconfirm` beallitast

### Osszefoglalas
| Muvelet | Leiras |
|---------|--------|
| Auth config | Auto-confirm email bekapcsolasa |
| `Auth.tsx` modositas | Regisztracio eltavolitasa, csak login marad |

