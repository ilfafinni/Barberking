# BarberKing

Sitio web premium para la barbería (dark + dorado) con reserva por WhatsApp, calendario de disponibilidad y panel de administración. 100% estático: se publica tal cual en GitHub Pages, sin backend ni base de datos.

## Modelos de color

El sitio incluye 4 paletas que se cambian al instante con los botones de color (en el header y en el pie). La elección se recuerda en el navegador y se puede forzar por URL:

| Modelo | URL | Descripción |
| --- | --- | --- |
| a | `/Barberking/` | Dorado (por defecto) |
| b | `/Barberking/?theme=b` | Blanco y negro |
| c | `/Barberking/?theme=c` | Azul |
| d | `/Barberking/?theme=d` | Azul eléctrico |

Los 4 modelos comparten el mismo código: cada paleta redefine un conjunto de tokens CSS (`--accent`, `--bg`, `--text`, etc.) en `css/styles.css`. Para crear una quinta paleta, agrega un bloque `html[data-theme='e']` con esos tokens y un botón más en `index.html`.

## Qué incluye

- **Landing one-page**: hero, marquee, servicios con precios, equipo de barberos, galería, testimonios, FAQ, contacto con mapa y CTA final.
- **Reserva online**: el cliente elige servicio, barbero, día y hora; el resumen muestra el precio y al confirmar se abre WhatsApp con el mensaje de reserva listo para enviar al local.
- **Calendario en vivo**: muestra los días hábiles del horario configurado y bloquea los horarios ocupados (marcados como "Ocupado").
- **Panel admin** (`#/admin`): login con contraseña, KPIs, gestión de reservas (confirmar / cancelar / borrar), alta y baja de peluqueros, alta y baja de servicios, ajustes del local y backup/restore en JSON.
- **Accesibilidad**: contraste AA, navegación por teclado, `prefers-reduced-motion`, skip-link y aria-live en toasts.

## Cómo funciona la reserva (modo estático)

Como GitHub Pages no tiene servidor ni base de datos, la fuente de verdad es **WhatsApp del local**:

1. El cliente envía la reserva desde la web (se abre `wa.me` con el mensaje prellenado).
2. El admin registra o confirma esa reserva en el panel → eso **bloquea el horario** en el calendario público.
3. Todo el estado (config, barberos, servicios, reservas) se guarda en `localStorage` **en el navegador donde se usa el panel**.

> **Límite importante:** las reservas no se sincronizan entre dispositivos. Quien opere el panel ve los datos de su propio navegador. Si necesitás reservas compartidas en tiempo real entre clientes y el local, hay que agregar un backend (p. ej. Supabase, Firebase o una API serverless). El código ya está separado en `js/store.js`, así que se puede cambiar la capa de persistencia sin tocar el resto.

## Panel de administración

- Ruta: agregá `#/admin` al final de la URL (ej: `https://usuario.github.io/Barberking/#/admin`).
- Contraseña por defecto: `barberking` → **cámbiala en Ajustes** tras el primer ingreso.
- Secciones: **Reservas**, **Peluqueros** (acá agregás o quitás barberos), **Servicios**, **Ajustes** (datos del local, horarios, contraseña) y backup/restore.

## Editar los datos del sitio

Todo arranca con valores de ejemplo (placeholders) definidos en `js/config.js`:

- Nombre, teléfono/WhatsApp, dirección, Instagram, horarios.
- Servicios (nombre, descripción, duración, precio) y barberos del equipo.
- Testimonios, estadísticas y galería.

Si cambiás datos desde el panel, se guardan en el navegador y tienen prioridad sobre `config.js`.

## Publicarla en GitHub Pages

1. Subí este repo a GitHub (si todavía no tiene remoto):
   ```bash
   git remote add origin https://github.com/ilfafinni/Barberking.git
   git push -u origin main
   ```
2. En GitHub, **Settings → Pages** → fuente: **GitHub Actions**.
3. Esperá a que corra el workflow (pestaña **Actions**).
4. Tu URL: `https://ilfafinni.github.io/Barberking/`

## Probar en local

```bash
python -m http.server 8123
```

Abrí `http://127.0.0.1:8123/index.html`. El admin queda en `http://127.0.0.1:8123/index.html#/admin`.

## Estructura

```
index.html          Página pública + panel admin
css/styles.css      Design system (tokens, componentes, responsive)
js/config.js        Datos por defecto (placeholders editables)
js/store.js         Capa de persistencia (localStorage) + helpers
js/app.js           Render público + lógica de reserva/WhatsApp
js/admin.js         Panel de administración
.github/workflows/  Deploy automático a GitHub Pages
```
