# Barberking

Este repositorio ya está preparado para publicar la web con **GitHub Pages** automáticamente.

## Qué se agregó
- Workflow de despliegue en `.github/workflows/deploy-pages.yml`.
- Publica el contenido estático del repositorio en cada push a `main`.

## Cómo publicarla y obtener el link
1. Sube este repo a GitHub (si todavía no tiene remoto):
   ```bash
   git remote add origin https://github.com/<tu-usuario>/Barberking.git
   git push -u origin main
   ```
2. En GitHub, ve a **Settings → Pages** y confirma que la fuente sea **GitHub Actions**.
3. Espera a que el workflow termine (pestaña **Actions**).
4. Tu URL quedará así:
   - `https://<tu-usuario>.github.io/Barberking/`

Si quieres, te puedo guiar paso a paso con tu usuario/repositorio exacto para darte el link final exacto.
