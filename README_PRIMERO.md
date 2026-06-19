# SEAZEP-WEB — Proyecto base

Este paquete contiene la base inicial para la web corporativa y plataforma privada de SEAZEP.

## Ruta recomendada

Extraer este proyecto en:

```txt
C:\Users\azada\Documents\PROYECTOS_SOFTWARE\SEAZEP\SEAZEP-WEB
```

## Cómo correr en local

Abrir terminal en la carpeta `SEAZEP-WEB` y ejecutar:

```bash
npm install
npm run dev
```

Luego abrir:

```txt
http://localhost:4321
```

## Qué incluye

```txt
Web pública:
- Inicio
- Servicios
- Softwares
- SmartPozo360
- Recursos
- Contacto
- Solicitar información

Portal usuario:
- Acceso
- Registro
- Dashboard usuario

Admin:
- Login admin
- Dashboard admin visual

Documentación:
- Blueprint
- Identidad visual
- Roles y flujos
- Modelo D1
- Roadmap
```

## Importante

Esta entrega es base visual + blueprint. Todavía no conecta con base de datos real ni login real.

La siguiente fase debe ser crear `seazep-api` con Cloudflare Workers + D1.
