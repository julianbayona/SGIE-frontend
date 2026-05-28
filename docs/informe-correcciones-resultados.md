# Informe de correcciones y resultados

Este documento resume las correcciones aplicadas al proyecto SGIE Club Boyaca, junto con el resultado funcional y tecnico de cada bloque de trabajo.

## 1. Ajustes rapidos de UX en eventos y cotizaciones

Correcciones aplicadas:

- Autollenado de fecha fin a partir de la fecha de inicio.
- Mensajes mas claros cuando el boton principal esta deshabilitado.
- Capitalizacion de textos visibles en cliente, salon, tipo de evento, comida y conceptos.
- Aclaracion de acciones de cotizacion:
  - `Nueva version por cambios`.
  - `Aceptar cotizacion`.
- Tooltips y mensajes de ayuda para generar, descargar, enviar y aceptar cotizaciones.

Resultado:

- La creacion de eventos y la gestion de cotizaciones quedaron mas guiadas.
- Se reducen errores por campos incompletos o acciones ambiguas.

Archivos principales:

- `SGIE-frontend/src/pages/EventRequestPage.tsx`
- `SGIE-frontend/src/pages/EventQuotePage.tsx`
- `SGIE-frontend/src/utils/formatters.ts`

## 2. Consulta de disponibilidad de salones

Correcciones aplicadas:

- Se completo el boton `Consultar disponibilidad`.
- La consulta filtra salones por:
  - rango de fecha y hora,
  - capacidad minima,
  - reservas vigentes de eventos confirmados.
- Si el salon seleccionado deja de estar disponible, se selecciona otro disponible.
- Si no hay salones disponibles, se limpia la seleccion y se informa al usuario.
- Al cambiar horario o numero de invitados, se exige consultar nuevamente.

Resultado:

- El usuario puede validar disponibilidad real antes de crear una solicitud.
- Se evita seleccionar salones ocupados o sin capacidad suficiente.

Archivo principal:

- `SGIE-frontend/src/pages/EventRequestPage.tsx`

## 3. Correccion en pagos

Problema corregido:

- La pantalla ajustaba silenciosamente pagos mayores al saldo pendiente, haciendo parecer que el historial cuadraba aunque el valor ingresado superara el total.

Correcciones aplicadas:

- Se elimino el ajuste silencioso del valor.
- Si el pago supera el saldo pendiente, se bloquea el registro.
- Si ya existe sobrepago, se muestra `Sobrepago detectado`.
- Se bloquean nuevos pagos cuando el historial ya supera el total.
- El saldo negativo se muestra de forma explicita para evidenciar la inconsistencia.

Resultado:

- La informacion financiera ya no se altera convenientemente en la interfaz.
- El usuario ve y corrige inconsistencias en lugar de ocultarlas.

Archivo principal:

- `SGIE-frontend/src/pages/EventPaymentsPage.tsx`

## 4. Semilla de datos local

Correcciones aplicadas:

- Se agrego una semilla SQL completa para pruebas locales.
- Incluye usuarios por rol, catalogos, clientes, salones, eventos, reservas, menus, montajes, cotizaciones, pagos, notificaciones, pruebas de plato y calendario.

Resultado:

- El sistema puede probarse localmente con datos representativos.
- Facilita validar flujos completos sin crear todo manualmente.

Archivo principal:

- `SGIE-CB/scripts/seed-local-full.sql`

Credenciales de prueba:

```text
Administrador / admin123
Gerente Demo / admin123
Tesorero Demo / admin123
Jefe Mesa Demo / admin123
```

## 5. Agenda y notificaciones

Problemas corregidos:

- El formulario de insercion de datos aparecia al final de la pantalla.
- El usuario debia recorrer monitoreo/listados antes de poder programar.
- La validacion de fechas para prueba de plato era confusa.

Correcciones aplicadas:

- El formulario de `Crear notificacion o prueba de plato` aparece al inicio.
- Se agrego una regla visible de fecha.
- Para pruebas de plato se exige:
  - fecha futura,
  - anterior al inicio del evento.
- Si la fecha es invalida, el campo se marca visualmente y el boton queda bloqueado.
- El boton cambia segun la accion:
  - `Programar prueba de plato`,
  - `Crear recordatorio`.

Resultado:

- La pantalla es mas usable y directa.
- Se evitan errores del backend por fechas que el frontend ya puede anticipar.

Archivo principal:

- `SGIE-frontend/src/pages/EventAgendaPage.tsx`

## 6. Cotizaciones PDF y reporte XLS

Problema corregido:

- El envio y descarga de cotizaciones solo contemplaba Excel.
- El XLS necesitaba mejor estructura para ser mas claro como reporte.

Correcciones aplicadas:

- Se agrego descarga PDF:
  - `GET /api/cotizaciones/{id}/documento/pdf`.
- El email de cotizacion ahora adjunta:
  - Excel,
  - PDF.
- El texto del correo indica que se adjuntan ambos formatos.
- En frontend se agrego boton `Descargar PDF`.
- El XLS se reorganizo en secciones:
  - datos del cliente,
  - datos del evento,
  - resumen financiero,
  - detalle economico.
- El detalle XLS incluye origen, concepto, modalidad de cobro, descripcion, precios, cantidad y subtotal.

Resultado:

- El cliente puede recibir y descargar cotizacion formal en PDF.
- El Excel queda mas util como reporte operativo/financiero.

Archivos principales:

- `SGIE-CB/src/main/java/com/ejemplo/monolitomodular/cotizaciones/aplicacion/servicio/CotizacionOperacionApplicationService.java`
- `SGIE-CB/src/main/java/com/ejemplo/monolitomodular/cotizaciones/presentacion/rest/CotizacionController.java`
- `SGIE-CB/src/main/java/com/ejemplo/monolitomodular/cotizaciones/infraestructura/notificaciones/CotizacionEmailAttachmentProvider.java`
- `SGIE-frontend/src/api/cotizaciones.ts`
- `SGIE-frontend/src/pages/EventQuotePage.tsx`

## 7. Seguridad backend y documentos

Correcciones aplicadas:

- Se reemplazo el manejo manual de JWT por `jjwt`.
- Se agrego configuracion tipada para JWT con validacion de secreto minimo para HS256.
- Se mantuvo la inyeccion de secretos por variables de entorno en `application.yml`.
- Se agrego rate limiting en memoria para `/api/**`.
- Se agregaron limites separados para `/api/auth/login`.
- Se cambio un catch generico relevante por una excepcion especifica (`JsonProcessingException`).
- Se sanitiza texto usado en celdas XLS para evitar:
  - formulas inyectadas,
  - caracteres XML invalidos.
- Se separo el escritor PDF a una clase propia `PdfWriter`.

Resultado:

- Autenticacion JWT mas robusta usando libreria estandar.
- Mejor proteccion contra fuerza bruta y abuso de endpoints.
- Menor riesgo de inyeccion en documentos XLS.
- El servicio de cotizaciones queda con menos responsabilidad directa sobre PDF.

Archivos principales:

- `SGIE-CB/pom.xml`
- `SGIE-CB/src/main/resources/application.yml`
- `SGIE-CB/src/main/java/com/ejemplo/monolitomodular/auth/infraestructura/seguridad/JwtService.java`
- `SGIE-CB/src/main/java/com/ejemplo/monolitomodular/auth/infraestructura/seguridad/JwtProperties.java`
- `SGIE-CB/src/main/java/com/ejemplo/monolitomodular/auth/infraestructura/seguridad/RateLimitingFilter.java`
- `SGIE-CB/src/main/java/com/ejemplo/monolitomodular/cotizaciones/aplicacion/servicio/PdfWriter.java`

## 8. Seguridad frontend

Correcciones aplicadas:

- Se agrego manejo explicito de HTTP `429` en el cliente API.
- Se auditaron `.env.example` y `.env.local`.
- No se encontraron claves privadas ni tokens expuestos en frontend; solo `VITE_API_BASE_URL`.

Resultado:

- Cuando el backend limite solicitudes, el usuario vera un mensaje claro.
- La configuracion frontend actual no expone secretos sensibles.

Archivo principal:

- `SGIE-frontend/src/api/client.ts`

## 9. Validacion tecnica

Backend:

```powershell
cd "C:\Users\Usuario\trabajo de campo\sgie correcciones\SGIE-CB"
mvn.cmd clean test
```

Resultado:

- Build exitoso.
- 178 pruebas ejecutadas.
- 0 fallos.
- 0 errores.
- Persisten avisos conocidos de JaCoCo con clases `localedata`, pero Maven finaliza en `BUILD SUCCESS`.

Frontend:

```powershell
cd "C:\Users\Usuario\trabajo de campo\sgie correcciones\SGIE-frontend"
npm.cmd run build
```

Resultado:

- Build exitoso.
- Vite reporta solo la advertencia conocida de bundle grande.

## 10. Commits enviados a develop

Backend `SGIE-CB`:

- `89a8dcf Add local seed data for testing`
- `2457513 Add PDF quote documents and improve XLS report`
- `319b783 Harden backend auth and quote documents`

Frontend `SGIE-frontend`:

- `8404a3f Improve agenda notification UX`
- `2f3f584 Add quote PDF download support`
- `a57d9eb Handle API rate limit feedback`

Resultado:

- Los cambios fueron enviados a `origin/develop` en ambos repositorios.
- El frontend quedo limpio y sincronizado con `origin/develop`.
- El backend quedo sincronizado con `origin/develop`, conservando fuera de commit el `.gitignore` modificado previamente.

## 11. Cambios descartados o pospuestos

No forman parte del estado vigente:

- Endurecimiento amplio de permisos por rol por fuera de la fase actual.
- Evidencia/comprobante de pagos.
- Migracion de modelo de datos para comprobantes.
- Cambio para evitar falso positivo de email enviado cuando SMTP esta deshabilitado.

Pendiente recomendado:

- Extraer completamente el builder XLS a una clase propia o plantilla.
- Agregar pruebas unitarias especificas para JWT/rate limiting/documentos.
- Profundizar permisos por rol en endpoints criticos segun definicion funcional final.
- Implementar logs estructurados en componentes criticos.
