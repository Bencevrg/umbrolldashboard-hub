

# Hibrid Biztonsagi Rendszer - Frissitett Terv

## Attekintes

Ketretegu biztonsagi rendszer:
- **Supabase**: Autentikacio (bejelentkezes, 2FA, szerepek, meghivok)
- **n8n**: Uzleti adatok backendje (partner adatok, chat webhook) - valtozatlan

```text
+-------------------+     +-------------------+     +-------------------+
|   Felhasznalo     |     |    Supabase       |     |    Dashboard      |
|   bejelentkezik   | --> |    Auth + 2FA     | --> |    + n8n adatok   |
+-------------------+     +-------------------+     +-------------------+
```

---

## Elso Admin Letrehozasa (Reszletes Folyamat)

### 1. lepes: Ideiglenes regisztracio engedelyezese

Az Auth oldal ket modban fog mukodni:
- **Zaras mod (alapertelmezett)**: Csak bejelentkezes lehetseges
- **Regisztracios mod**: URL parameterrel aktivalhato: `/auth?register=true`

### 2. lepes: Elso admin regisztracioja

1. Nyisd meg: `https://umbrolldashboard.lovable.app/auth?register=true`
2. Add meg az admin email cimet es jelszot
3. Sikeres regisztracio utan latni fogod a 2FA beallitas oldalt

### 3. lepes: Admin szerep hozzarendelese

A Lovable Cloud panelen (jobb oldali "Cloud" ful) futtasd ezt az SQL parancsot:

```sql
-- Kerdesd le a felhasznalo ID-jat
SELECT id, email FROM auth.users WHERE email = 'admin@email.com';

-- Add hozza az admin szerepet (csereld ki a USER_ID-t)
INSERT INTO user_roles (user_id, role) 
VALUES ('USER_ID_INNEN', 'admin');
```

### 4. lepes: Regisztracio letiltasa

Torolj minden utalast a `?register=true` parameterre. Ezutan csak meghivoval lehet regisztralni.

---

## Admin Felulet Elhelyezese

A DashboardHeader-ben megjelenik egy fogaskerek ikon (csak adminoknak lathato):

```text
+-------------------------------------------------------------------+
|  [Umbroll Logo]  Partner Dashboard          [Datum]  [Profil] [*] |
|                  Arajanlat analitika                     ^     ^  |
|                                                          |     |  |
|                                              Kijelentkezes  Admin |
+-------------------------------------------------------------------+
```

Az admin ikonra kattintva `/admin/users` oldalra navigal.

---

## Admin Felulet Funkcionalitas

### Felhasznalok tablazat
| Oszlop | Leiras |
|--------|--------|
| Email | Felhasznalo email cime |
| Szerep | Admin/User badge |
| Allapot | Aktiv/Letiltott |
| Regisztralt | Letrehozas datuma |
| Utolso belepes | Mikor lepett be utoljara |
| Muveletek | Szerep modositas, Letiltas, 2FA reset |

### Uj felhasznalo meghivasa
- Modal dialog "Uj felhasznalo meghivasa" gombra
- Mezok: Email cim, Szerep (Admin/User dropdown)
- Kuldes gomb -> Email megy a meghivottnak

### Fuggoben levo meghivok
- Kulon szekciokban listazva
- Token, Email, Szerep, Lejarat, Statusz
- Lehetoseg: Meghivo ujrakuldes, Torles

---

## Admin Felulet Vedelme (3 retegu)

### 1. reteg: Frontend vedelem (ProtectedRoute)

```typescript
// Ellenorzi session + szerep + 2FA allapotot
const AdminRoute = ({ children }) => {
  const { user, isAdmin, isMfaVerified } = useAuth();
  
  if (!user) return <Navigate to="/auth" />;
  if (!isMfaVerified) return <Navigate to="/auth/mfa" />;
  if (!isAdmin) return <Navigate to="/" />;
  
  return children;
};
```

### 2. reteg: Adatbazis vedelem (RLS)

```sql
-- user_roles tabla: csak admin olvashatja
create policy "Admins can view all roles"
on public.user_roles for select
to authenticated
using (public.has_role(auth.uid(), 'admin'));

-- user_invitations: csak admin CRUD
create policy "Admins can manage invitations"
on public.user_invitations for all
to authenticated
using (public.has_role(auth.uid(), 'admin'));
```

### 3. reteg: Edge Function vedelem

```typescript
// invite-user edge function
const { data: { user } } = await supabaseAdmin.auth.getUser(token);

// Ellenorizd az admin szerepet
const { data: isAdmin } = await supabaseAdmin.rpc('has_role', {
  _user_id: user.id,
  _role: 'admin'
});

if (!isAdmin) {
  return new Response(JSON.stringify({ error: 'Unauthorized' }), { 
    status: 403 
  });
}
```

---

## Adatbazis Sema

### app_role enum

```sql
create type public.app_role as enum ('admin', 'user');
```

### user_roles tabla

```sql
create table public.user_roles (
  id uuid primary key default gen_random_uuid(),
  user_id uuid references auth.users(id) on delete cascade not null,
  role app_role not null,
  created_at timestamptz default now(),
  unique (user_id, role)
);

alter table public.user_roles enable row level security;
```

### user_invitations tabla

```sql
create table public.user_invitations (
  id uuid primary key default gen_random_uuid(),
  email text not null,
  role app_role not null default 'user',
  token text not null unique,
  expires_at timestamptz not null,
  used boolean default false,
  invited_by uuid references auth.users(id),
  created_at timestamptz default now()
);

alter table public.user_invitations enable row level security;
```

### user_mfa_settings tabla

```sql
create table public.user_mfa_settings (
  id uuid primary key default gen_random_uuid(),
  user_id uuid references auth.users(id) on delete cascade not null unique,
  mfa_type text check (mfa_type in ('totp', 'email')) default 'email',
  is_verified boolean default false,
  totp_secret text,
  email_code text,
  email_code_expires_at timestamptz,
  email_code_attempts int default 0,
  created_at timestamptz default now(),
  updated_at timestamptz default now()
);

alter table public.user_mfa_settings enable row level security;
```

### Helper fuggvenyek

```sql
-- Szerep ellenorzes
create or replace function public.has_role(_user_id uuid, _role app_role)
returns boolean
language sql stable security definer set search_path = public
as $$
  select exists (
    select 1 from public.user_roles 
    where user_id = _user_id and role = _role
  )
$$;

-- Jovahagyott felhasznalo ellenorzes
create or replace function public.is_approved_user(_user_id uuid)
returns boolean
language sql stable security definer set search_path = public
as $$
  select exists (
    select 1 from public.user_roles where user_id = _user_id
  )
$$;
```

---

## Uj Oldalak es Utvonalak

| Utvonal | Leiras | Vedelem |
|---------|--------|---------|
| `/auth` | Bejelentkezes | Publikus |
| `/auth?register=true` | Regisztracio (ideiglenes) | Publikus |
| `/auth/mfa` | 2FA kod megadasa | Session szukseges |
| `/auth/setup-mfa` | 2FA beallitas | Session szukseges |
| `/auth/accept-invite` | Meghivo elfogadasa | Token szukseges |
| `/` | Dashboard | ProtectedRoute |
| `/admin/users` | Felhasznalo kezeles | AdminRoute |

---

## Komponens Hierarchia

```text
App.tsx
+-- AuthProvider
    +-- BrowserRouter
        +-- Routes
            +-- /auth --> Auth.tsx
            +-- /auth/mfa --> MFAVerify.tsx
            +-- /auth/setup-mfa --> MFASetup.tsx
            +-- /auth/accept-invite --> AcceptInvite.tsx
            +-- ProtectedRoute
                +-- / --> Index.tsx
                +-- AdminRoute
                    +-- /admin/users --> AdminUsers.tsx
```

---

## Edge Functions

### 1. invite-user
- Admin jogosultsag ellenorzes
- Meghivo token generalas (32 byte random)
- Meghivo mentes adatbazisba (24 ora lejarat)
- Email kuldes Resend API-val

### 2. send-mfa-code
- 6 jegyu kod generalas
- Kod hashelese es mentese
- Email kuldes Resend API-val
- 5 perc lejarat, max 3 probalkozas

### 3. verify-mfa
- Kod es user_id fogadasa
- Hash osszehasonlitas
- Lejarat es probalkozas ellenorzes
- Sikeres: session frissites

---

## Uj Fajlok Letrehozasa

| Fajl | Leiras |
|------|--------|
| `src/integrations/supabase/client.ts` | Supabase kliens |
| `src/integrations/supabase/types.ts` | Tipus definiciok |
| `src/contexts/AuthContext.tsx` | Auth context es provider |
| `src/hooks/useAuth.ts` | Auth hook |
| `src/components/auth/ProtectedRoute.tsx` | Altalanos vedelem |
| `src/components/auth/AdminRoute.tsx` | Admin vedelem |
| `src/pages/Auth.tsx` | Bejelentkezes/regisztracio |
| `src/pages/MFAVerify.tsx` | 2FA verifikacio |
| `src/pages/MFASetup.tsx` | 2FA beallitas |
| `src/pages/AcceptInvite.tsx` | Meghivo elfogadas |
| `src/pages/AdminUsers.tsx` | Admin felulet |
| `supabase/functions/invite-user/index.ts` | Meghivo function |
| `supabase/functions/send-mfa-code/index.ts` | Email kod kuldes |
| `supabase/functions/verify-mfa/index.ts` | MFA ellenorzes |
| `supabase/migrations/001_auth_tables.sql` | DB sema |

## Modositando Fajlok

| Fajl | Valtozas |
|------|----------|
| `src/App.tsx` | AuthProvider, routing |
| `src/components/dashboard/DashboardHeader.tsx` | Admin ikon, profil, kijelentkezes |
| `src/components/dashboard/DashboardNav.tsx` | Admin szerep fuggo megjelentes |

---

## Elofeltelek

1. **Lovable Cloud aktivalasa** - Supabase hasznalathoz
2. **Resend API kulcs** - Email kuldeshez (https://resend.com/api-keys)
3. **Resend domain verifikacio** - Hiteles email kuldeshez

---

## Implementacios Sorrend

1. Lovable Cloud aktivalas (felhasznaloi lepes)
2. RESEND_API_KEY secret hozzaadasa
3. Adatbazis migracio (tablak, enum, fuggvenyek, RLS)
4. Supabase kliens es tipusok
5. AuthContext es useAuth hook
6. Auth oldalak (login/register, MFA)
7. ProtectedRoute es AdminRoute
8. App.tsx routing modositas
9. Edge functions (invite, mfa)
10. Admin felulet (AdminUsers.tsx)
11. DashboardHeader modositas
12. Elso admin letrehozasa (manualis SQL)
13. Teszteles

