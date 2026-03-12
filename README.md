# La Llosa Sports Booking Platform

Aplicacion web desarrollada con Next.js para gestionar reservas deportivas municipales, bonos y autenticacion de usuarios.

## Contexto del proyecto

- Este repositorio se publica con fines de portfolio tecnico.
- El proyecto original fue desarrollado en colaboracion con otro companero.
- Antes de publicar, confirma por escrito con tu companero que ambos estais de acuerdo con esta publicacion.

## Stack

- Next.js (App Router)
- TypeScript
- MongoDB
- JWT
- Nodemailer

## Configuracion local

1. Copia la plantilla de entorno:

```bash
cp .env.example .env.local
```

2. Rellena tus variables reales en `.env.local`.
3. Instala dependencias:

```bash
npm install
```

4. Inicia el proyecto:

```bash
npm run dev
```

## Seguridad antes de publicar

- Nunca subas `.env`, `.env.local` ni claves de servicios.
- Revisa `SECURITY.md` y `PUBLISHING_CHECKLIST.md`.
- Si en el pasado hubo secretos en commits, publica usando historial limpio (sin los commits antiguos).

## Aviso legal y de uso

- Este repositorio no incluye datos personales reales.
- Los identificadores y claves de terceros deben gestionarse solo por variables de entorno.
- Si reutilizas este codigo en produccion, adapta seguridad, cumplimiento legal y proteccion de datos a tu caso real.
