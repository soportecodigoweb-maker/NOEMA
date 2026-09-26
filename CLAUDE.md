# NOEMA · Reglas de trabajo para Claude

## Modo nocturno

Cuando la dueña del proyecto diga "modo nocturno" (a cualquier hora, no solo de noche) significa que NO puede supervisar y que el trabajo ya está preaprobado:

1. Ejecutar TODAS las fases acordadas de corrido, de la primera a la última, sin detenerse a esperar respuesta.
2. Si una fase tiene una duda, un bloqueo o necesita algo que solo ella puede hacer, NO parar: anotar la duda, hacer lo que sí se pueda de esa fase (o saltarla) y seguir con la siguiente. Es preferible entregar 33 fases con 1 pendiente que 10 fases y 24 sin hacer.
3. Todo lo que ella tenga que leer o ejecutar va AL FINAL del reporte, nunca arriba ni en medio, porque si queda arriba no lo lee:
   - preguntas y decisiones pendientes,
   - SQL que deba correr (las migraciones se aplican a mano desde PowerShell contra el VPS con `docker exec -i supabase-db psql -U postgres -d postgres < archivo.sql`),
   - pasos manuales (secretos, configuración, pruebas).
4. Al terminar, avisar que se terminó y dejar ese bloque final listo para copiar y pegar.

## Fases

- El trabajo grande se planea en fases numeradas de corrido (fase 1, fase 2, … fase N), sin agrupar en bloques con letras.
- Una vez preaprobadas las fases, no se cambian ni se fusionan sin avisar; si algo no aplica, se anota al final.

## Seguridad e infraestructura

- Nunca imprimir, escribir en archivos ni pedir contraseñas en el chat; si un script las necesita, van solo como variable de entorno del proceso (`NOEMA_PASSWORD`).
- Nunca exponer la service role key, llaves privadas SSH ni llaves VAPID. Los secretos viven solo en el `.env` del VPS (permisos 600).
- El VPS aloja otros proyectos: su aislamiento es sagrado. No tocar otros contenedores, Traefik, n8n ni nada fuera de la pila de NOEMA.
- No tocar la cuenta administradora `soportecodigoweb@gmail.com`, ni las cuentas `pruebas.*@noema.test` y `soportenoema@gmail.com`. Las cuentas de soporte creadas para pruebas de push (terapeuta `operana.oficial@gmail.com`, paciente `boomerangmexico25@gmail.com`) tampoco se usan como cuentas demo.
- Producción es `https://app.somosnoema.com` (VPS Hostgator). La copia en Vercel está obsoleta y no se usa.
- Cada push a `main` despliega solo el panel (`apps/terapeuta`) por GitHub Actions. Las migraciones de `supabase/migrations` NO se aplican solas.

## Estilo

- Responder siempre en español, sin adornos; decir qué se hizo, qué se probó y qué quedó pendiente.
- La interfaz de NOEMA está en español de México; textos sobrios, sin tecnicismos para la persona usuaria.
