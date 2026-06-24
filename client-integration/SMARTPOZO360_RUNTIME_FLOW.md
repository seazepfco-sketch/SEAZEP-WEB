\# SmartPozo360 — Flujo real de licencia online y gracia offline



\## 1. Objetivo



SmartPozo360 debe validar su licencia contra SEAZEP-WEB para permitir o bloquear el uso del software.



La web SEAZEP-WEB será el centro de control de licencias, empresas, activaciones, equipos, vencimientos, bloqueos y auditoría.



\## 2. Endpoints permitidos para SmartPozo360



El software SmartPozo360 solo debe consumir:



```txt

POST https://seazep-api.seazepfco.workers.dev/license/check

POST https://seazep-api.seazepfco.workers.dev/activation/register

