
# Implementacios Terv - Mailtrap Integracioval

## Valtozas az eredeti tervhez kepest

Egyetlen kulonbseg: **Mailtrap** hasznalata Resend helyett az email kuldeshez.
- Secret neve: `MAILTRAP_API_KEY`
- API vegpont: `https://send.api.mailtrap.io/api/send`
- Amig nincs megadva az API kulcs, az auth rendszer mukodik (login, 2FA beallitas), de email kuldest igenylő funkciok (meghivo, email 2FA kod) hibauzenettel jelzik, hogy nincs konfigurálva

---

## Implementacios Lepesek

### 1. lepes: AuthContext es useAuth hook
- `src/contexts/AuthContext.tsx` - Session kezeles, szerep lekerdezes, MFA allapot
- `src/hooks/useAuth.ts` - Egyszerusitett hook a context hasznalathoz

### 2. lepes: Auth oldalak
- `src/pages/Auth.tsx` - Bejelentkezes (+ `?register=true` parameterrel regisztracio)
- `src/pages/MFASetup.tsx` - TOTP QR kod beallitas vagy email 2FA valasztas
- `src/pages/MFAVerify.tsx` - 6 jegyu kod megadasa
- `src/pages/AcceptInvite.tsx` - Meghivo elfogadasa es regisztracio

### 3. lepes: Vedett utvonalak
- `src/components/auth/ProtectedRoute.tsx` - Session + 2FA + jovahagyott felhasznalo ellenorzes
- `src/components/auth/AdminRoute.tsx` - Admin szerep ellenorzes

### 4. lepes: App.tsx modositas
- AuthProvider wrapper
- Osszes uj utvonal hozzaadasa
- ProtectedRoute es AdminRoute alkalmazasa

### 5. lepes: Edge Functions (Mailtrap API-val)

#### `supabase/functions/send-mfa-code/index.ts`
```typescript
// Mailtrap API hivas
const res = await fetch("https://send.api.mailtrap.io/api/send", {
  method: "POST",
  headers: {
    "Authorization": `Bearer ${Deno.env.get("MAILTRAP_API_KEY")}`,
    "Content-Type": "application/json",
  },
  body: JSON.stringify({
    from: { email: "noreply@yourdomain.com", name: "Umbroll" },
    to: [{ email: userEmail }],
    subject: "2FA verifikacios kod",
    text: `A kodod: ${code}`,
  }),
});
```

#### `supabase/functions/invite-user/index.ts`
- Admin jogosultsag ellenorzes
- Token generalas, adatbazisba mentes
- Meghivo email kuldes Mailtrap API-val

#### `supabase/functions/verify-mfa/index.ts`
- Kod ellenorzes, lejarat vizsgalat
- Probalkozas szamlalo

### 6. lepes: Admin felulet
- `src/pages/AdminUsers.tsx` - Felhasznalok listaja, meghivo kuldes, szerep modositas

### 7. lepes: Dashboard modositasok
- `src/components/dashboard/DashboardHeader.tsx` - Profil menu (kijelentkezes) + admin ikon
- `src/components/dashboard/DashboardNav.tsx` - Admin menu elem (feltételes)

### 8. lepes: supabase/config.toml frissites
- Edge function-ok JWT verifikacio kikapcsolasa (kodban tortenik az ellenorzes)

---

## Mailtrap vs Resend - Technikai kulonbseg

| | Resend | Mailtrap |
|---|---|---|
| Secret neve | `RESEND_API_KEY` | `MAILTRAP_API_KEY` |
| API vegpont | `https://api.resend.com/emails` | `https://send.api.mailtrap.io/api/send` |
| From formatum | `"Name <email>"` string | `{ email, name }` objektum |
| To formatum | `["email"]` tomb | `[{ email }]` objektum tomb |

---

## Kesobb teendo (amikor megvan az API kulcs)

1. Add hozza a `MAILTRAP_API_KEY` secretet a Lovable Cloud-ban
2. Allitsd be a kuldo domain-t a Mailtrap-ben (domain verifikacio)
3. Frissitsd a `from` email cimet az edge function-okban a verifikalt domain-re

---

## Fajlok osszefoglalasa

### Uj fajlok (13 db)
| Fajl | Leiras |
|------|--------|
| `src/contexts/AuthContext.tsx` | Auth context + provider |
| `src/hooks/useAuth.ts` | Auth hook |
| `src/components/auth/ProtectedRoute.tsx` | Vedett utvonal |
| `src/components/auth/AdminRoute.tsx` | Admin vedett utvonal |
| `src/pages/Auth.tsx` | Login/register oldal |
| `src/pages/MFASetup.tsx` | 2FA beallitas |
| `src/pages/MFAVerify.tsx` | 2FA verifikacio |
| `src/pages/AcceptInvite.tsx` | Meghivo elfogadasa |
| `src/pages/AdminUsers.tsx` | Admin felulet |
| `supabase/functions/invite-user/index.ts` | Meghivo edge function |
| `supabase/functions/send-mfa-code/index.ts` | MFA kod kuldes |
| `supabase/functions/verify-mfa/index.ts` | MFA ellenorzes |

### Modositando fajlok (3 db)
| Fajl | Valtozas |
|------|----------|
| `src/App.tsx` | AuthProvider, routing, vedett utvonalak |
| `src/components/dashboard/DashboardHeader.tsx` | Profil menu, admin ikon |
| `supabase/config.toml` | Edge function konfiguracio |
