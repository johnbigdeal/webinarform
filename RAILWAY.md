# Despliegue en Railway — WebinarForm

Esta guía detalla los pasos para desplegar esta aplicación unificada de Next.js (con PostgreSQL, Prisma y NextAuth) en producción utilizando **Railway**.

---

## 0. Requisitos Previos

- Una cuenta en [Railway](https://railway.app) (puedes ingresar con GitHub).
- El repositorio del proyecto subido a tu cuenta de GitHub.
- Configurar las variables de entorno de producción.

---

## 1. Crear el Proyecto en Railway

1. Entra a [railway.app/new](https://railway.app/new).
2. Elige **"Deploy from GitHub repo"**.
3. Selecciona tu repositorio `WebinarForm`.
4. Railway detectará la estructura de Next.js de forma automática (no se requiere configurar directorios raíz ni monorepos).

---

## 2. Añadir la Base de Datos PostgreSQL

1. Una vez creado el proyecto en Railway, haz clic en **"+ New" → "Database" → "Add PostgreSQL"**.
2. Railway creará el servicio de base de datos y generará automáticamente la variable `DATABASE_URL`.
3. Railway conectará automáticamente el servicio de PostgreSQL con tu servicio web. Puedes verificar esto en la pestaña **Variables** del servicio de Next.js, donde deberías ver la variable `DATABASE_URL` vinculada.

---

## 3. Configurar Variables de Entorno

En la pestaña **Variables** del servicio web (Next.js) en Railway, debes añadir las siguientes configuraciones:

| Variable | Valor / Ejemplo | Descripción |
| :--- | :--- | :--- |
| `PORT` | `3000` | Puerto en el que corre la aplicación. |
| `NODE_ENV` | `production` | Modo de ejecución del framework. |
| `DATABASE_SSL` | `true` | Habilita SSL para la conexión segura con la base de datos de Railway. |
| `NEXTAUTH_URL` | `https://tu-dominio-de-railway.up.railway.app` | La URL pública generada por Railway (ver Paso 4). |
| `NEXTAUTH_SECRET` | *(Genera un valor seguro de 32 bytes)* | Clave para firmar las cookies de sesión (genera una en la terminal local con `openssl rand -base64 32`). |
| `ADMIN_EMAIL` | `admin@tuwebinar.com` | Email para crear la cuenta inicial del administrador del sistema. |
| `ADMIN_PASSWORD` | *(Contraseña segura)* | Contraseña del administrador creada durante la semilla de base de datos. |

---

## 4. Configurar el Dominio Público

1. En la configuración de tu servicio web en Railway, ve a **Settings → Networking**.
2. Haz clic en **"Generate Domain"** para obtener una URL pública (por ejemplo, `https://web-production-xxxx.up.railway.app`).
3. Copia esa URL generada y asígnala al valor de la variable `NEXTAUTH_URL` en la configuración de tus variables (Paso 3).

---

## 5. Ejecutar Migraciones de Base de Datos y Semilla

Para asegurar que la base de datos de producción contenga las tablas y el usuario administrador inicial, debes ejecutar las migraciones:

*   **Durante el build (Recomendado)**: Puedes ejecutar la migración deploy y la semilla modificando tu script de build en `package.json` o añadiéndolo en la fase de inicialización de Railway:
    ```bash
    npm run db:deploy && npm run db:seed
    ```
*   **Manual (A través de Railway CLI)**:
    Si prefieres ejecutarlo manualmente desde tu terminal local conectada a Railway:
    ```bash
    railway run npm run db:deploy
    railway run npm run db:seed
    ```

---

## 6. Configuración de Healthcheck

Este proyecto tiene un endpoint de salud integrado en `/api/health`. Configura Railway para monitorear el estado del servicio:
1. En tu servicio web en Railway, ve a **Settings → Service**.
2. En la sección **Healthcheck**, configura los siguientes valores:
   - **Healthcheck Path**: `/api/health`
   - **Timeout**: `60` segundos

---

## 7. Verificación Post-Despliegue

Una vez completado el despliegue de Railway:
- [ ] Confirma que el endpoint responde con un estado HTTP 200 en `https://<tu-url-de-railway>/api/health`.
- [ ] Accede a la página de login (`/login`) e inicia sesión con las credenciales que configuraste en `ADMIN_EMAIL` y `ADMIN_PASSWORD`.
- [ ] Accede a `/admin` para gestionar usuarios y activar planes de pago.
