# BLUEPRINT GENERAL — SEAZEP-WEB

## Objetivo
Crear una plataforma corporativa y tecnológica para SEAZEP Agua y Energía, separada de SmartPozo360, orientada a:

- presentar servicios técnicos;
- mostrar el catálogo de softwares SEAZEP;
- recibir solicitudes empresariales;
- permitir registro de usuarios;
- habilitar descarga controlada de manuales;
- controlar licencias, activaciones y consultas desde un ADM único.

## Ruta recomendada
```txt
C:\Users\azada\Documents\PROYECTOS_SOFTWARE\SEAZEP\SEAZEP-WEB
```

## Estructura funcional
```txt
SEAZEP-WEB
├── Web pública
│   ├── Inicio
│   ├── Servicios
│   ├── Softwares
│   ├── SmartPozo360
│   ├── Recursos
│   ├── Contacto
│   └── Solicitar información
│
├── Portal usuario
│   ├── Login
│   ├── Registro
│   ├── Dashboard
│   ├── Manuales asignados
│   └── Descargas autorizadas
│
└── Panel ADM único
    ├── Dashboard
    ├── Empresas
    ├── Usuarios
    ├── Softwares
    ├── Manuales
    ├── Licencias
    ├── Activaciones
    └── Consultas diarias de licencia
```

## Principio comercial
La web no debe funcionar como tienda pública. SmartPozo360 y futuros softwares se presentarán bajo un flujo B2B:

```txt
Interés empresarial → solicitud → contacto SEAZEP → negociación → licencia → activación
```

## Indicadores admin recomendados
- Licencias activas.
- Licencias por vencer.
- Licencias vencidas.
- Consultas diarias de licencia.
- Última validación por empresa.
- Activaciones por equipo.
- Descargas de manuales.
- Usuarios registrados.
- Solicitudes nuevas.
- Empresas activas.
