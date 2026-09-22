# Luz de Luna — Sistema de control de negocio

Next.js (App Router, TypeScript) + Firebase (Auth + Firestore), desplegado en Vercel.
Cubre inventario con recetas, compras, toma de pedidos por mesa, comandas de cocina/bar,
cobro en caja, cierre de caja diario y control de acceso por rol.

## 1. Arquitectura, en breve

```
src/
├── app/
│   ├── login/            # pantalla de login
│   ├── (app)/             # shell autenticado (header + nav) y una carpeta por vista
│   └── api/                # "backend": Route Handlers con Admin SDK y transacciones
├── domain/                 # lógica de negocio pura — sin Firebase, sin React
├── services/                # capa cliente que llama a /api/** (el límite hacia el backend)
├── lib/
│   ├── auth/                 # AuthProvider (cliente) y verificación de sesión (servidor)
│   ├── firestore/              # converters, colecciones tipadas, transacciones admin
│   ├── excel/                   # export.ts (respaldo) 
│   └── api/                      # fetch wrapper con token + manejo de errores
├── config/                  # firebase.client.ts, firebase.admin.ts, env.ts
├── hooks/                    # useProductos, usePedidos, useViewGuard, ...
├── components/
│   ├── ui/                     # Button, Input, Modal, ConfirmProvider, ToastProvider...
│   └── <feature>/                # un folder por vista (mesas, pedido, comandas, ...)
└── styles/
    ├── tokens.css               # paleta, tipografía, espaciado — única fuente de verdad
    └── animations.css            # capa de animación, aislada y con soporte a
                                    prefers-reduced-motion
```

**Por qué está separado así:**

- **`domain/`** no importa nada de Firebase ni de React: es la misma lógica que describe la
  especificación (stock disponible de un platillo, qué mesa está ocupada, totales por
  periodo) y se puede probar o reutilizar sin levantar la app.
- **Todas las escrituras que tocan más de un documento** (enviar pedido → descuenta varios
  insumos, cobrar, comprar con bump de stock, cerrar caja, alta/baja de usuario) viven en
  `src/lib/firestore/adminOps/*` y corren en una **transacción de Firestore** desde una ruta
  de API (`src/app/api/**`), usando el Admin SDK. Esto evita el escenario de dos meseros
  vendiendo al mismo tiempo y dejando el inventario inconsistente.
- **Las reglas de Firestore (`firestore.rules`) niegan toda escritura del cliente.** Solo el
  servidor (Admin SDK, que ignora las reglas) puede escribir. Las reglas solo gobiernan
  lectura por rol — por ejemplo, `compras` y `cierresCaja` solo los lee un admin. Esto es
  más fácil de auditar que tratar de expresar "cocina solo puede tachar `listo`" como una
  regla de Firestore sobre un array, así que ese caso puntual también pasa por su propia
  ruta de API (`/api/pedidos/[id]/items/[itemId]`), que sí valida que cocina/bartender solo
  toquen líneas de su propia estación.
- **`services/`** es la única puerta hacia `/api/**` desde los componentes: adjunta el token
  de Firebase Auth y traduce errores HTTP a mensajes legibles.

## 2. Requisitos

- Node.js 18.18+
- Un proyecto de Firebase con **Authentication (correo/contraseña)** y **Firestore** habilitados.

## 3. Configura Firebase

1. Crea un proyecto en [console.firebase.google.com](https://console.firebase.google.com).
2. **Authentication → Sign-in method** → habilita **Correo electrónico/contraseña**.
3. **Firestore Database** → créala en modo producción (las reglas ya están en `firestore.rules`).
4. **Configuración del proyecto → Tus apps → Web app**: copia el objeto `firebaseConfig`.
5. **Configuración del proyecto → Cuentas de servicio → Generar nueva clave privada**: descarga el JSON.

## 4. Variables de entorno

```bash
cp .env.local.example .env.local
```

Completa `.env.local` con:

- Los 6 valores `NEXT_PUBLIC_FIREBASE_*` del paso 4.
- Los 3 valores `FIREBASE_ADMIN_*` del JSON del paso 5 (`project_id`, `client_email`,
  `private_key` — este último entre comillas dobles, con los `\n` tal cual vienen en el JSON).

`.env.local` nunca se sube a git.

## 5. Instala, crea el primer admin y arranca

```bash
npm install
npm run bootstrap-admin   # crea usuario "admin" / contraseña "admin123" (solo si no existe ya un admin)
npm run dev
```

Abre [http://localhost:3000](http://localhost:3000), entra con `admin` / `admin123` y cambia esa
contraseña desde **Usuarios** de inmediato.

## 6. Despliegue de reglas de Firestore

```bash
npm install -g firebase-tools   # una vez
firebase login
firebase use --add               # elige tu proyecto
firebase deploy --only firestore:rules
```

## 7. Desplegar en Vercel

1. Importa el repositorio en Vercel.
2. Copia todas las variables de `.env.local` a **Project Settings → Environment Variables**
   (incluida `FIREBASE_ADMIN_PRIVATE_KEY` completa, con los `\n`).
3. Deploy. Cada push a la rama principal despliega automáticamente.

## 8. Migrar el respaldo Excel de la versión anterior

```bash
npm run import-backup -- ./ruta/a/tu-respaldo.xlsx
```

El script espera las columnas que genera `src/lib/excel/export.ts` (hojas "Inventario" y
"Compras"). Si tu respaldo viene con otros nombres de columna, ajusta el mapeo al inicio de
`scripts/import-backup.ts` antes de correrlo — no hay forma segura de adivinar un formato
que no se puede inspeccionar de antemano. Los usuarios no se migran por script: créalos desde
la pantalla **Usuarios** (necesitan una cuenta de Firebase Auth con contraseña).

## 9. Scripts disponibles

| Comando                  | Qué hace                                                        |
|---------------------------|-------------------------------------------------------------------|
| `npm run dev`               | Servidor de desarrollo                                             |
| `npm run build` / `start`     | Build de producción / arrancarlo                                     |
| `npm run lint` / `typecheck`   | ESLint / chequeo de tipos sin emitir                                   |
| `npm run bootstrap-admin`       | Crea el primer usuario admin (`admin`/`admin123`) si no existe ninguno       |
| `npm run import-backup -- <ruta>` | Importa inventario y compras desde un respaldo Excel                     |

## 10. Notas de diseño

Tema oscuro único (no hay modo claro, es intencional — es el look "luz de luna" pedido).
Paleta y tipografía centralizadas en `src/styles/tokens.css`: fondo carbón/café en `oklch`,
acento dorado (candela) y azul-grisáceo (luna). Tipografía: **Spectral** (serif, títulos),
**Instrument Sans** (texto), **IBM Plex Mono** (etiquetas, números, badges) — cargadas con
`next/font/google` (self-hosted, sin layout shift). Las animaciones (entradas, hover, press,
skeletons) están aisladas en `src/styles/animations.css` y se desactivan automáticamente con
`prefers-reduced-motion`.
