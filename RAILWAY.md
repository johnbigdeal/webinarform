# Despliegue en Railway — App de Webinar (Next.js)

Guía paso a paso para llevar este proyecto Next.js (con Prisma + PostgreSQL + NextAuth) a producción en Railway con un flujo de video en vivo embebido (Opción 1: YouTube Live).

---

## 0. Requisitos previos

- Cuenta en [Railway](https://railway.app) (puedes ingresar usando tu cuenta de GitHub).
- Este repositorio subido a tu cuenta de GitHub.
- Canal de YouTube habilitado para realizar transmisiones en vivo (para embeber el reproductor).

---

## 1. Crear el proyecto en Railway

1. Ve a [railway.app/new](https://railway.app/new).
2. Selecciona **"Deploy from GitHub repo"**.
3. Autoriza a Railway a acceder a tus repositorios (si es la primera vez).
4. Selecciona este repositorio.

Railway detectará la configuración de despliegue automáticamente utilizando el archivo [railway.toml](file:///Users/general/WebinarForm/railway.toml) ubicado en la raíz del proyecto.

---

## 2. Añadir PostgreSQL

Dado que la aplicación almacena sus datos en una base de datos relacional:
1. En el panel de control de tu proyecto en Railway, haz clic en el botón **"+ New"** en la esquina superior derecha.
2. Selecciona **"Database" → "Add PostgreSQL"**.
3. Railway creará el servicio de base de datos e inyectará automáticamente la variable `DATABASE_URL` a tu servicio de Next.js si ambos se encuentran en el mismo proyecto de Railway.

---

## 3. Configurar Variables de Entorno

Ve al servicio de tu aplicación en el dashboard de Railway, dirígete a la pestaña **Variables** e introduce las siguientes variables de entorno:

| Variable | Descripción | Valor / Ejemplo |
|---|---|---|
| `DATABASE_URL` | URL de conexión a la base de datos PostgreSQL | (Inyectada de forma automática por Railway, o puedes referenciarla usando `${{ Postgres.DATABASE_URL }}`) |
| `DATABASE_SSL` | Activa la conexión segura SSL de Prisma a PostgreSQL | `true` |
| `NEXTAUTH_SECRET` | Clave secreta para firmar las cookies de sesión de NextAuth | Genera un valor seguro de 32 bytes (ej. ejecutando `openssl rand -base64 32` en tu terminal) |
| `NEXTAUTH_URL` | URL base pública de tu aplicación | `https://tu-app-produccion.up.railway.app` (configura esto una vez que obtengas el dominio público en el paso 5) |
| `ADMIN_EMAIL` | Correo electrónico del administrador inicial | `admin@tuwebinar.com` |
| `ADMIN_PASSWORD` | Contraseña del administrador inicial | `cambiame-por-favor-segura` |

---

## 4. Ejecutar las Migraciones de Prisma

Para aplicar la estructura de tablas inicial de la base de datos (`prisma/schema.prisma`), tienes dos opciones:

### Opción A: Automática (Recomendada)
Modifica el comando de construcción en tu archivo [railway.toml](file:///Users/general/WebinarForm/railway.toml) o en la configuración de Railway para que ejecute las migraciones de forma automática durante el deploy:
```toml
[deploy]
buildCommand = "npx prisma migrate deploy && npm run build"
```

### Opción B: Manual
Puedes ejecutar las migraciones desde tu máquina local apuntando temporalmente a la URL externa de la base de datos de Railway:
```bash
# Copia la DATABASE_URL externa desde la pestaña Variables del servicio de Postgres en Railway
DATABASE_URL="postgresql://..." npx prisma migrate deploy
```

> [!TIP]
> **Creación del Administrador Inicial (Seed):** Para poblar la base de datos con el usuario administrador por defecto, puedes ejecutar el seed de forma local con la variable de entorno de Railway:
> ```bash
> DATABASE_URL="postgresql://..." npm run db:seed
> ```

---

## 5. Obtener y configurar el Dominio

1. En el servicio de la app en Railway, ve a **Settings → Networking**.
2. Haz clic en **"Generate Domain"** para obtener una URL pública gratuita con formato `.up.railway.app` (ej. `webinarform-production.up.railway.app`).
3. Copia esa URL y añádela como valor en la variable de entorno `NEXTAUTH_URL`.
4. **Dominio personalizado (Opcional):** Si quieres usar un dominio propio, añádelo en **Custom Domain** y configura un registro `CNAME` en el panel de tu proveedor DNS apuntando a la dirección provista por Railway.

---

## 6. Integración del Video (Opción 1: Transmisión de YouTube Live)

Esta opción es la recomendada para transmisiones masivas (one-to-many) con baja latencia relativa (5-15 segundos) y escalabilidad ilimitada sin costo de infraestructura WebRTC:

1. **Crear Transmisión en YouTube:** 
   - Ve al panel de control de YouTube Studio y crea una transmisión en vivo.
   - Asegúrate de configurar la visibilidad de la transmisión como **Pública** u **Oculta** (no privada, o los usuarios no podrán verla).
   - En las opciones avanzadas, asegúrate de activar la opción **"Permitir inserción" (Allow embedding)**.

2. **Obtener el ID del Video:**
   - Copia el enlace de tu directo. La URL tendrá la forma `https://www.youtube.com/watch?v=VIDEO_ID` o `https://youtu.be/VIDEO_ID`.
   - El `VIDEO_ID` (un código alfanumérico de 11 caracteres) es el identificador único del directo.

3. **Configurar el Video en la Sala de Webinar:**
   - En el panel de administración de tu App de Webinar, edita la sala o el formulario correspondiente.
   - Pega el `VIDEO_ID` en el campo del video o guarda la configuración del reproductor embebido. El reproductor de YouTube Live se cargará de forma automática para todos los asistentes usando la API de inserción de YouTube en un `<iframe>`.

---

## 7. Verificación post-despliegue

Realiza las siguientes comprobaciones una vez finalizado el despliegue:

- [ ] Abre `https://<tu-app>.up.railway.app/api/health` en el navegador. Debería responder con un estado `200` y el JSON `{ "ok": true, "db": true }` (lo que confirma que Next.js se conecta correctamente a PostgreSQL).
- [ ] Accede a la página principal de la aplicación y verifica que el diseño se renderice correctamente.
- [ ] Dirígete a `/login` e inicia sesión con las credenciales de administrador (`ADMIN_EMAIL` y `ADMIN_PASSWORD` definidas en las variables).
- [ ] Crea un formulario de registro de prueba y accede a su URL pública (`/f/[slug]`).
- [ ] Realiza una inscripción de prueba y confirma en el panel de control del administrador que la sumisión y los puntos se guarden correctamente.
- [ ] Comprueba que la sala del webinar renderice correctamente el video en vivo de YouTube embebido.

---

## 8. Deploy automático

Railway realiza un despliegue automático de forma continua cada vez que haces `push` a la rama principal configurada (por defecto `main`). Puedes monitorear la construcción y los logs de ejecución en tiempo real desde la pestaña **"Deployments"** de cada servicio en Railway.
