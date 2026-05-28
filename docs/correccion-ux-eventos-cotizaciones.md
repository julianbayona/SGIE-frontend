# Correccion UX: eventos y cotizaciones

## Alcance

Se aplicaron ajustes rapidos de experiencia de usuario en el flujo de creacion de eventos y en la gestion de cotizaciones.

## Cambios realizados

- Se autocompleta la fecha de fin con la misma fecha seleccionada en inicio para evitar que el usuario repita datos.
- Se reemplazo el mensaje generico del boton deshabilitado por una indicacion concreta de los campos faltantes.
- Se agrego una funcion reutilizable para capitalizar textos visibles como cliente, salon, tipo de evento, tipo de comida y conceptos de cotizacion.
- Se aclaro la accion de `Nueva version`, indicando que una version nueva se genera al cambiar menu, montaje o reserva.
- Se renombro y documento la accion `Aceptar cotizacion`, explicando que aprueba la version y habilita confirmacion/pagos.

## Archivos modificados

- `src/pages/EventRequestPage.tsx`
- `src/pages/EventQuotePage.tsx`
- `src/utils/formatters.ts`

## Validacion

Se ejecuto `npm.cmd run build` correctamente. Vite solo reporto una advertencia de bundle grande, sin bloquear la compilacion.
