
# Hibrid Biztonsagi Rendszer - Reszletes Terv

## Attekintes

Egy ketretegu biztonsagi rendszer, ahol:
- **Supabase**: Felelos az autentikaciooert (bejelentkezes, 2FA, szerepek, meghivok)
- **n8n**: Tovabbra is az uzleti adatok backendje (partner adatok, chat webhook)

```text
+-------------------+     +-------------------+     +-------------------+
|                   |     |                   |     |                   |
|   Felhasznalo     | --> |    Supabase       | --> |    Dashboard      |
|   bejelentkezik   |     |    Auth + 2FA     |     |    + n8n adatok   |
|                   |     |                   |     |                   |
+-------------------+     +-------------------+     +-------------------+
```

---

## Biztonsagi Folyamatok

### 1. Uj felhasznalo meghivasa (csak admin)

```text
+------------------+     +------------------+     +------------------+
|  Admin megadja   |     |  Rendszer kuld   |     |  Felhasznalo     |
|  email cimet     | --> |  meghivo emailt  | --> |  elfogadja       |
|  + szerepet      |     |  egyedi linkkel  |     |  + beallitja 2FA |
+------------------+     +------------------+     +------------------+
```

### 2. Bejelentkezesi folyamat

```text
+------------------+     +------------------+     +------------------+
|                  |     |                  |     |                  |
|   Email/jelszo   | --> |   2FA kod        | --> |   Dashboard      |
|   megadas        |     |   verifikacio    |     |   hozzaferes     |
|                  |     |                  |     |                  |
+------------------+     +------------------+     +------------------+
```

---

## Adatbazis Sema

Harom uj tabla a Supabase-ben:

### user_roles - Felhasznaloi szerepek
| Mezo | Tipus | Leiras |
|------|-------|--------|
| id | uuid | Elsodles kulcs |
| user_id | uuid | Kapcsolat auth.users tablahoz |
| role | enum | 'admin' vagy 'user' |
| created_at | timestamp | Letrehozas ideje |

### user_invitations - Meghivok
| Mezo | Tipus | Leiras |
|------|-------|--------|
| id | uuid | Elsodles kulcs |
| email | text | Meghivott email cim |
| role | enum | Milyen szereppel kerul be |
| token | text | Egyedi meghivo kod |
| expires_at | timestamp | Lejarati ido (24 ora) |
| used | boolean | Felhasznalva-e |
| invited_by | uuid | Meghivo admin |

### user_mfa_settings - 2FA beallitasok
| Mezo | Tipus | Leiras |
|------|-------|--------|
| id | uuid | Elsodles kulcs |
| user_id | uuid | Kapcsolat auth.users tablahoz |
| mfa_type | text | 'totp' vagy 'email' |
| is_verified | boolean | Be van-e allitva |
| totp_secret | text | Titkositott TOTP kulcs |

---

## Uj Oldalak es Utvonalak

| Utvonal | Leiras | Ki erheti el |
|---------|--------|--------------|
| `/auth` | Bejelentkezes (email/jelszo) | Mindenki |
| `/auth/mfa` | 2FA kod megadasa | Bejelentkezettek |
| `/auth/setup-mfa` | 2FA beallitas elso belepeskor | Uj felhasznalok |
| `/auth/accept-invite` | Meghivo elfogadasa | Meghivottak |
| `/admin/users` | Felhasznalo kezeles | Csak adminok |
| `/` | Dashboard (vedett) | 2FA-val hitelesitettek |

---

## Komponens Hierarchia

```text
App.tsx
+-- AuthProvider (uj)
    +-- Routes
        +-- /auth --> Auth.tsx (publikus)
        +-- /auth/mfa --> MFAVerify.tsx (reszben vedett)
        +-- /auth/setup-mfa --> MFASetup.tsx (reszben vedett)
        +-- /auth/accept-invite --> AcceptInvite.tsx (publikus)
        +-- ProtectedRoute (uj wrapper)
            +-- / --> Index.tsx (vedett)
            +-- /admin/users --> AdminUsers.tsx (admin only)
```

---

## Edge Functions (Supabase)

### 1. invite-user
- **Cel**: Meghivo email kuldese
- **Bemenet**: email, role
- **Kimenet**: Meghivo link
- **Hasznalat**: Resend API-val email kuldes

### 2. verify-mfa
- **Cel**: 2FA kod ellenorzese
- **Bemenet**: user_id, kod, tipus (totp/email)
- **Kimenet**: Sikeres/sikertelen

### 3. send-mfa-code
- **Cel**: Email 2FA kod kuldese
- **Bemenet**: user_id
- **Kimenet**: Siker allapot
- **Megjegyzes**: 6 jegyu kod, 5 perc lejarat

---

## Frontend Vedelem

### ProtectedRoute komponens
Minden vedett oldalra kerul, es ellenorzi:

1. Van-e aktiv session (bejelentkezve-e)
2. Van-e jovahagyott szerepe (user_roles tablaban)
3. Befejezodott-e a 2FA beallitas
4. Sikeres volt-e a 2FA verifikacio ezen a sessionon

Ha barmelyik hianyzik, atiranyitas a megfelelo oldalra.

### Admin vedelem
Admin oldalakhoz plusz ellenorzes:
- `has_role(user_id, 'admin')` fuggveny hivasa

---

## n8n Integracios Valtozasok

Az n8n webhookok VALTOZATLANOK maradnak:
- Partner adatok: `https://bencevrg.app.n8n.cloud/webhook/6fe0821f-...`
- Chat quick: `https://bencevrg.app.n8n.cloud/webhook/87270230-...`
- Chat thinking: `https://bencevrg.app.n8n.cloud/webhook/abbd5cc8-...`

A kulonbseg: ezeket a hookokat csak BEJELENTKEZETT es 2FA HITELESITETT felhasznalok hivhatjak meg, mert a ProtectedRoute megakadalyozza a hozzaferest a Dashboard-hoz.

---

## Admin Felulet Funkcionalitas

### Felhasznalok listazasa
- Email, szerep, letrehozas datuma, utolso belepes
- Aktiv/letiltott allapot

### Uj felhasznalo meghivasa
- Email cim megadasa
- Szerep kivalasztasa (admin/user)
- Meghivo email automatikus kuldese

### Felhasznalo kezeles
- Szerep modositasa
- Felhasznalo letiltasa/torlese
- 2FA alaphelyzetbe allitasa

---

## Uj Fajlok Letrehozasa

| Fajl | Leiras |
|------|--------|
| `src/integrations/supabase/client.ts` | Supabase kliens |
| `src/integrations/supabase/types.ts` | Tipus definiciok |
| `src/contexts/AuthContext.tsx` | Auth context es provider |
| `src/hooks/useAuth.ts` | Auth hook |
| `src/components/auth/ProtectedRoute.tsx` | Route vedelem |
| `src/pages/Auth.tsx` | Bejelentkezes oldal |
| `src/pages/MFAVerify.tsx` | 2FA verifikacio |
| `src/pages/MFASetup.tsx` | 2FA beallitas |
| `src/pages/AcceptInvite.tsx` | Meghivo elfogadas |
| `src/pages/AdminUsers.tsx` | Admin felulet |
| `supabase/functions/invite-user/index.ts` | Meghivo edge function |
| `supabase/functions/verify-mfa/index.ts` | 2FA ellenorzes |
| `supabase/functions/send-mfa-code/index.ts` | Email kod kuldes |
| `supabase/migrations/001_auth_tables.sql` | DB sema |

## Modositando Fajlok

| Fajl | Valtozas |
|------|----------|
| `src/App.tsx` | AuthProvider, uj utvonalak, ProtectedRoute |
| `src/components/dashboard/DashboardHeader.tsx` | Kijelentkezes gomb, felhasznalo nev |
| `src/components/dashboard/DashboardNav.tsx` | Admin menupont (ha admin) |

---

## Elofeltelek a Megvalositashoz

1. **Lovable Cloud aktivalasa**
   - Supabase adatbazis es Edge Functions hasznalathoz
   - A jobb oldali panelen a "Cloud" fulon aktivalhato

2. **Resend API kulcs**
   - Meghivo es 2FA email kuldeshez
   - Regisztracio: https://resend.com
   - API kulcs: https://resend.com/api-keys

3. **Resend domain verifikacio**
   - A hiteles email kuldeshez szukseges
   - https://resend.com/domains

---

## 2FA Implementacio Reszletei

### TOTP (Authenticator app)
- QR kod generalasa beallitaskor (otpauth:// URI)
- 6 jegyu kod, 30 masodperces ablak
- Konyvtar: `otpauth` npm csomag
- Backup kodok generalasa (10 db egyszer hasznalhatos)

### Email kod
- 6 jegyu random kod generalas
- Tarolasa az adatbazisban (hash-elve)
- 5 perces lejarati ido
- Maximum 3 probalkozas, utana uj kod keres

---

## Biztonsagi Szabalyok (RLS)

### Helper fuggvenyek

```sql
-- Ellenorzi, hogy a felhasznalonak van-e adott szerepe
create or replace function public.has_role(_user_id uuid, _role app_role)
returns boolean
language sql stable security definer set search_path = public
as $$ select exists (
  select 1 from public.user_roles 
  where user_id = _user_id and role = _role
) $$;

-- Ellenorzi, hogy a felhasznalo jovahagyott-e (van szerepe)
create or replace function public.is_approved_user(_user_id uuid)
returns boolean
language sql stable security definer set search_path = public
as $$ select exists (
  select 1 from public.user_roles where user_id = _user_id
) $$;
```

### RLS policyk

- `user_roles`: Csak admin olvashatja masok szerepeit
- `user_invitations`: Csak admin hozhat letre/olvashat
- `user_mfa_settings`: Felhasznalo csak sajat beallitasait lathaja

---

## Elso Admin Felhasznalo

A rendszer telepitese utan manualis lepes szukseges:
1. Regisztracio a Supabase Auth-on keresztul (ideiglenesen engedelyezve)
2. SQL futtatasa a Supabase konzolban admin szerep hozzaadasahoz:

```sql
INSERT INTO user_roles (user_id, role) 
VALUES ('AZ_ELSO_ADMIN_USER_ID', 'admin');
```

3. Ezutan a regisztracio letiltasa, csak meghivo alapu

---

## Implementacios Sorrend

1. **Lovable Cloud aktivalas** (felhasznaloi lepes)
2. **Resend API kulcs beallitas** (felhasznaloi lepes)
3. **Adatbazis sema letrehozasa** (migracio)
4. **RLS szabalyok es helper fuggvenyek** (migracio)
5. **Supabase kliens es tipusok** (kod)
6. **AuthContext es useAuth hook** (kod)
7. **Auth oldalak** (Auth, MFASetup, MFAVerify, AcceptInvite)
8. **ProtectedRoute komponens** (kod)
9. **App.tsx modositas** (utvonalak)
10. **Edge functions** (invite-user, verify-mfa, send-mfa-code)
11. **Admin felulet** (AdminUsers)
12. **Dashboard modositasok** (header, nav)
13. **Elso admin letrehozasa** (manualis)
14. **Teszteles**
