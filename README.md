# Auto Asistencia
Sitio estático (HTML + JS) con Supabase. Sin build, sin terminal.
1. Supabase: SQL Editor > pegar supabase.sql > Run.
2. Editar config.js con URL y anon key.
3. Subir todo a GitHub y conectar el repo en Vercel (framework: Other).
4. Crear tu cuenta en la página y ejecutar el UPDATE del final de supabase.sql para ser administrador.

## Restablecer contraseña (configuración en Supabase)
El código ya incluye el botón "¿Olvidaste tu contraseña?" y la pantalla para crear la nueva contraseña. Falta configurar Supabase:
1. Authentication > URL Configuration: pon en **Site URL** tu dominio (ej. https://tudominio.com) y en **Redirect URLs** agrega `https://tudominio.com/**` (y `http://localhost:3000/**` si pruebas local).
2. Authentication > Emails > **SMTP Settings**: activa "Custom SMTP" con tu proveedor (Resend, Brevo, SendGrid…). Nombre del remitente: Auto Asistencia; correo: p. ej. no-reply@tudominio.com (dominio verificado con SPF/DKIM en el proveedor).
3. Authentication > Emails > **Reset Password**: pega el contenido de `email-restablecer.html` y cambia el asunto.
