# Correcciones realizadas hasta el momento

Este documento resume las correcciones vigentes aplicadas en el proyecto hasta ahora, separando frontend, backend y validacion local.

## 1. Ajustes UX en eventos y cotizaciones

Se aplicaron mejoras rapidas de experiencia de usuario en la creacion de eventos y en la pantalla de cotizacion.

Cambios realizados:

- Autollenado de la fecha de fin con la misma fecha seleccionada en inicio.
- Mensaje mas claro cuando el boton de crear evento esta deshabilitado, indicando los campos faltantes.
- Capitalizacion de textos visibles como cliente, salon, tipo de evento, tipo de comida y conceptos de cotizacion.
- Aclaracion del boton `Nueva version`, ahora mostrado como `Nueva version por cambios`.
- Aclaracion del boton `Aceptar cotizacion`, explicando que aprueba la version y habilita confirmacion/pagos.
- Tooltips de ayuda para acciones de cotizacion como generar, descargar Excel, enviar y aceptar.

Archivos principales:

- `SGIE-frontend/src/pages/EventRequestPage.tsx`
- `SGIE-frontend/src/pages/EventQuotePage.tsx`
- `SGIE-frontend/src/utils/formatters.ts`

## 2. Consulta de disponibilidad de salones

Se completo el comportamiento del boton `Consultar disponibilidad` en la creacion de solicitudes de evento.

Cambios realizados:

- El boton se deshabilita si no hay horario valido o numero de invitados valido.
- Se muestra estado de carga con el texto `Consultando...`.
- La consulta usa el endpoint existente `GET /api/salones/disponibilidad`.
- Los salones se filtran por:
  - rango de fecha y hora,
  - capacidad minima,
  - reservas vigentes asociadas a eventos confirmados.
- Si el salon seleccionado deja de estar disponible, se selecciona automaticamente el primer salon disponible.
- Si no hay salones disponibles, se limpia la seleccion y se muestra un mensaje claro.
- Al cambiar fecha, hora o numero de invitados, se restaura el listado completo y se exige una nueva consulta.

Archivo principal:

- `SGIE-frontend/src/pages/EventRequestPage.tsx`

## 3. Correccion en registro de pagos

Se corrigio el registro de anticipos/abonos para evitar que la interfaz altere el valor ingresado por el usuario.

Problema detectado:

- Cuando el usuario ingresaba un abono mayor al saldo pendiente, la pantalla ajustaba silenciosamente el valor con `Math.min(valorIngresado, saldoPendiente)`.
- Esto hacia que el historial pareciera cuadrado contra el total del evento, aunque el valor digitado originalmente superara el saldo.

Cambios realizados:

- Se elimino el ajuste silencioso del monto.
- Si el valor ingresado supera el saldo pendiente, el pago se bloquea y se muestra un mensaje claro.
- Si ya existen pagos acumulados mayores al total de la cotizacion, la pantalla muestra `Sobrepago detectado`.
- En caso de sobrepago existente, se bloquea el registro de nuevos pagos hasta revisar el historial.
- El saldo ya no se oculta como cero cuando hay sobrepago; se muestra como valor negativo visual para evidenciar la inconsistencia.

Archivo principal:

- `SGIE-frontend/src/pages/EventPaymentsPage.tsx`

## 4. Semilla de datos local

Se agrego una semilla SQL para poblar la base local y facilitar pruebas funcionales.

Archivo creado:

- `SGIE-CB/scripts/seed-local-full.sql`

Datos incluidos:

- Usuarios por rol: administrador, gerente, tesorero y jefe de mesa.
- Catalogos base: tipos de evento, tipos de comida, colores, mesas, sillas, manteles, adicionales y momentos de menu.
- Clientes y salones de prueba.
- Eventos con reservas en diferentes estados.
- Montajes, menus, cotizaciones, anticipos, notificaciones, pruebas de plato y calendario.

Credenciales de prueba:

```text
Administrador / admin123
Gerente Demo / admin123
Tesorero Demo / admin123
Jefe Mesa Demo / admin123
```

Comando para ejecutar la semilla:

```powershell
cd "C:\Users\Usuario\trabajo de campo\sgie correcciones"

docker cp "SGIE-CB/scripts/seed-local-full.sql" sgie-postgres:/tmp/seed-local-full.sql
docker exec -i sgie-postgres psql -U postgres -d sgie -v ON_ERROR_STOP=1 -f /tmp/seed-local-full.sql
```

## 5. Mejora visual de notificaciones y agenda

Se ajusto la pantalla de agenda/notificaciones para que la insercion de datos sea mas directa y para evitar errores confusos al programar pruebas de plato.

Cambios realizados:

- El formulario de `Crear notificacion o prueba de plato` ahora aparece al inicio de la pantalla, antes del monitoreo y del listado.
- Se agrego una tarjeta de regla de fecha visible para explicar el rango valido.
- Para pruebas de plato, el selector exige una fecha futura y anterior al inicio del evento.
- Si la fecha seleccionada no cumple la regla, el campo se marca visualmente, se muestra el motivo y el boton queda bloqueado.
- El boton cambia su texto segun la accion: `Programar prueba de plato` o `Crear recordatorio`.
- El canal de prueba de plato se muestra como email y queda bloqueado, porque la programacion dispara notificacion y Calendar automaticamente.

Archivo principal:

- `SGIE-frontend/src/pages/EventAgendaPage.tsx`

## 6. Validacion realizada

Frontend:

```powershell
cd "C:\Users\Usuario\trabajo de campo\sgie correcciones\SGIE-frontend"
npm.cmd run build
```

Resultado:

- Build exitoso.
- Vite reporto solo la advertencia conocida de bundle grande.

Backend:

- La semilla fue ejecutada correctamente contra el contenedor local `sgie-postgres`.
- Se confirmo que el script es idempotente para los registros definidos.

## 7. Cambios descartados

Estos cambios se probaron o avanzaron parcialmente, pero fueron descartados y no forman parte del estado vigente:

- Endurecimiento de permisos por rol en backend/frontend.
- Mejoras de pagos con evidencia/comprobante.
- Descarga de cotizacion en PDF.
- Migracion `V12__agregar_comprobante_anticipo.sql`.
- Cambio para evitar falso positivo de email enviado cuando SMTP esta deshabilitado.

## 8. Como probar en local

Backend:

```powershell
cd "C:\Users\Usuario\trabajo de campo\sgie correcciones\SGIE-CB"
docker compose up -d
mvn.cmd spring-boot:run
```

Frontend:

```powershell
cd "C:\Users\Usuario\trabajo de campo\sgie correcciones\SGIE-frontend"
npm.cmd install
npm.cmd run dev
```

Abrir:

```text
http://localhost:5173
```
