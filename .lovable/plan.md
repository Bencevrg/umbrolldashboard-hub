

# User szerep hozzarendelese a test@test.hu fiokhoz

## Osszefoglalo

A `test@test.hu` felhasznalohoz hozzarendeljuk a "user" szerepet az adatbazisban, igy be tud majd jelentkezni es tesztelni tudod a normal felhasznaloi nezetetet.

## Technikai reszletek

Egyetlen SQL parancs futtatasa szukseges:

```sql
INSERT INTO public.user_roles (user_id, role)
VALUES ('75c1178b-2f0e-4f8b-8a0f-e3318f575576', 'user');
```

Ez a `test@test.hu` email cimu felhasznalonak ad "user" jogosultsagot. Ezutan be tudsz lepni ezzel a fiokkal es a normal felhasznaloi feluletet latod (nem admin).

