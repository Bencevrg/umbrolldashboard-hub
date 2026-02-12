

## "Időhúzók" menüpont átnevezése

A `DashboardNav.tsx` fájlban a `tabs` tömb harmadik elemének `label` mezőjét kell átírni "Időhúzók"-ról "Kevésbé értékesek"-re.

### Technikai részletek

**Módosítandó fájl:** `src/components/dashboard/DashboardNav.tsx`

- 15. sor: `{ id: 'worst', label: 'Időhúzók', icon: AlertTriangle }` -> `{ id: 'worst', label: 'Kevésbé értékesek', icon: AlertTriangle }`

Egy soros változtatás, más fájlt nem érint.

