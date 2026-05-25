# Tests de RLS

Scripts SQL para validar que las políticas de Row Level Security funcionan
como esperamos. Estos tests **no se ejecutan automáticamente** (todavía) —
son scripts de regresión manual.

## Cómo correr un test

Requiere Supabase local arrancado (`pnpm supabase:start`).

```powershell
# Primero, hidratar datos de prueba (cada test trae su propio setup)
docker exec -i supabase_db_noema psql -U postgres -d postgres < supabase/tests/rls_privacidad.sql
```

## Tests disponibles

### `rls_privacidad.sql`

Valida las 4 reglas de oro de privacidad (BIBLIA §12):

| # | Verifica |
|---|---|
| 1 | El terapeuta dueño **solo** ve registros `compartido` y `marcado_sesion` |
| 2 | Otro terapeuta no vinculado **no ve nada** del paciente |
| 3 | El paciente ve **todo lo suyo**, incluido lo `privado` |
| 4 | El terapeuta **nunca** ve descripciones marcadas como `privado` |
| 5 | Los catálogos públicos (emociones, categorías, recursos de emergencia) son visibles para cualquier authenticated |

## TODO

- Migrar a `pg_tap` o `supabase test db` cuando esté estable
- Tests para módulo de crisis (alertas, notificación al terapeuta)
- Tests para mensajes
- Tests para auditoría
- CI automático en GitHub Actions
