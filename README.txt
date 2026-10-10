APLICACIÓN PARA CONDUCTOR V5.4.0
================================

NOVEDADES V5.4
--------------
- Nuevo acceso «Caducidades», situado a la izquierda de «Registro Repostajes».
- Apartado de documentos integrado en la propia aplicación y guardado en el mismo almacenamiento local del dispositivo.
- Indicador interno del botón Caducidades: amarillo cuando hay documentos dentro de su plazo de aviso y rojo si existe algún documento caducado. Si hay ambos estados, prevalece el rojo.
- La lista de documentos comienza vacía; no se importan automáticamente los registros de la antigua PWA Mis Documentos.
- Alta, edición, búsqueda y eliminación de documentos; aviso configurable con antelación.
- No hay notificaciones push, cuenta, API ni servidor para Caducidades. El indicador se actualiza al abrir la app o volver a la pantalla principal, no mientras la aplicación permanece cerrada.
- La copia de seguridad general incluye los documentos. Al importar una copia V5.4 se restauran junto con el resto de los datos. Al importar una copia antigua sin el campo documents, se conservan los documentos locales existentes.
- Corrección del calendario semanal del tacógrafo: al iniciar una nueva jornada, el descanso desde el fin de la jornada anterior hasta el nuevo inicio puede aparecer en el día correcto, incluidos los cambios de domingo a lunes.
- Refuerzo del recálculo de descansos diarios reducidos para respetar la marca automática guardada al cerrar una jornada con más de 13 horas de disponibilidad.
- Mejora del formulario de repostajes: fecha a ancho completo y campos de kilómetros/litros organizados en columnas cuando el espacio lo permite.
- Se mantienen los 7 idiomas de la aplicación.

INSTALACIÓN / ACTUALIZACIÓN
---------------------------
1. Haz una copia de seguridad desde Ajustes antes de actualizar.
2. Sustituye en GitHub Pages los archivos por todos los archivos de esta versión, manteniendo los nombres y la estructura.
3. Abre la aplicación con conexión a Internet para que se descarguen los archivos nuevos. Si el iPhone sigue mostrando la versión anterior, cierra la PWA por completo y vuelve a abrirla; el service worker de V5.4 tiene una caché nueva.
4. Los documentos se guardan en el mismo almacenamiento local que las jornadas y repostajes. Para conservarlos al cambiar de dispositivo, utiliza la copia de seguridad general de V5.4.

IMPORTANTE
----------
- La aplicación guarda datos localmente en el dispositivo; no utiliza Google Sheets ni servidores para las funciones internas.
- El control de tacógrafo es orientativo y no sustituye al tacógrafo oficial ni a las instrucciones del departamento de Flota.
- Los indicadores de caducidad son internos a la aplicación; no generan avisos del sistema operativo cuando la PWA está cerrada.

--- HISTORIAL DE LA VERSIÓN BASE ---

APP CONDUCTOR V5.3.2 — MULTIDIOMA + CONTROL TACÓGRAFO
====================================================

Versión local para GitHub Pages. Los datos se guardan en localStorage del dispositivo.
No utiliza Google Sheets ni servidor para almacenar los datos.

NOVEDADES V5.3.2
---------------
- Control Tacógrafo orientativo integrado.
- Los datos iniciales del tacógrafo se muestran solo durante la configuración inicial de la matrícula; después quedan ocultos para evitar duplicidades.
- Al cambiar de matrícula se pregunta si se desea reiniciar Historial y Control Tacógrafo o conservarlos.
- Las notas/incidencias pueden introducirse también al finalizar una jornada.
- Estadísticas simplificadas: se elimina el listado de últimas jornadas.
- Detalle de jornada: “Información detallada” y “Pausa realizada”, calculada al iniciar la siguiente jornada.
- El cálculo de descansos diarios reducidos considera también la ventana de 24 h y la disponibilidad de la jornada anterior.
- Conducción semanal y bisemanal: se recalculan desde las jornadas registradas por semanas fijas (lunes-domingo). El valor inicial del tacógrafo se conserva como referencia, pero no se suma automáticamente a jornadas ya registradas para evitar dobles conteos.
- Datos iniciales junto a la matrícula: conducción semanal y bisemanal, descansos diarios reducidos, ampliaciones a 10 h, compensaciones pendientes, descansos semanales reducidos consecutivos, último descanso semanal y último retorno.
- Aviso obligatorio al guardar los datos del tacógrafo:
  "Los datos del tacografo que aparecen en ésta aplicacion son orientativos. En caso de dudas es mejor contactar con departamento de Flota. Gracias"
- Cálculo orientativo de 56 h semanales, 90 h en dos semanas y 2 ampliaciones de 10 h.
- Control orientativo de máximo 3 descansos diarios reducidos.
- Registro de descansos semanales, reducidos, realizados fuera de España y compensaciones.
- Control orientativo de la regla de retorno de 4 semanas / 3 semanas cuando proceda.
- Contador en pantalla principal: duración de jornada actual o pausa desde la última jornada, incluyendo días con una decimal.
- Estadísticas: Km mes en curso, Km totales, Km del año, velocidad media y consumo medio. Se eliminan Horas conducidas y Disponibilidad de los cuadros principales.
- Historial de jornadas: cada jornada se abre en una ficha detallada con inicio, fin, kilómetros, lugares y enlaces a Google Maps.
- Incidencias/notas del conductor. Se muestra únicamente un icono 📝 en el historial cuando existe una nota.
- Historial de repostajes consultable desde la pantalla principal.
- Se mantiene el botón externo "Restricciones para Camiones" debajo de la matrícula, abriendo una pestaña nueva.
- Copias de seguridad JSON compatibles con los datos locales anteriores.

IDIOMAS
-------
Español, portugués, rumano, inglés, francés, italiano y alemán.
El idioma se detecta automáticamente mediante navigator.language. Si no está soportado, se utiliza español.

IMPORTANTE SOBRE EL CONTROL TACÓGRAFO
--------------------------------------
Esta función es una herramienta auxiliar y orientativa. No sustituye al tacógrafo, sus registros oficiales ni las instrucciones de la empresa o del departamento de Flota.
Las comprobaciones de descansos y retorno dependen de datos que la aplicación no puede reconstruir por sí sola. El conductor debe mantener los datos iniciales actualizados y registrar los descansos relevantes.

INSTALACIÓN EN GITHUB PAGES
----------------------------
1. Sube todos los archivos de esta carpeta al repositorio.
2. Activa GitHub Pages desde Settings > Pages.
3. Selecciona la rama y carpeta publicadas.
4. Abre la URL HTTPS en el teléfono.
5. En iPhone: Safari > Compartir > Añadir a pantalla de inicio.
6. En Android: navegador compatible > Añadir a pantalla de inicio / Instalar aplicación.

ACTUALIZACIÓN
-------------
Después de sustituir archivos en GitHub Pages, abre la URL HTTPS, recarga y vuelve a abrir la PWA.
Si el teléfono mantiene una versión antigua por caché, elimina la PWA instalada y vuelve a añadirla.

RESTRICCIONES PARA CAMIONES
---------------------------
El botón abre en una pestaña nueva:
https://payonline.guretruck.com/Restrictions/Restrictions.aspx/GetRestricciones

V5.2.3.1 — CORRECCIÓN CONTROL TACÓGRAFO
- Los campos de conducción semanal y bisemanal aceptan entrada numérica tipo 2804 y la muestran automáticamente como 28:04.
- Se elimina del formulario inicial el campo manual de compensación pendiente.
- La compensación pendiente se calcula a partir de los descansos semanales reducidos registrados en la aplicación.
- Se mantiene la tarjeta informativa de compensación pendiente dentro del Control Tacógrafo.

- V5.2.3: corregida la pantalla principal para que la duración de la pausa desde la última jornada se muestre una sola vez.


V5.2.6 — CORRECCIONES
- La franja visual de la pantalla principal vuelve a ocupar todo el ancho; no se modifica el diseño de las demás pantallas.
- Las ampliaciones a 10 h usadas se reinician automáticamente al comenzar una nueva semana (lunes).
- Una jornada con 10:00 h o más de conducción cuenta como ampliación a 10 h; 9:xx h no se cuenta como ampliación.
- Al iniciar una nueva jornada, si existe una pausa de 24 h o más desde la última jornada cerrada, se registra automáticamente como descanso semanal orientativo.
- Al detectar o registrar un descanso semanal se reinicia el contador de descansos diarios reducidos.
- El próximo límite para iniciar descanso semanal se calcula desde el final del último descanso semanal registrado/detectado, añadiendo 6 periodos de 24 h.
- Los descansos detectados automáticamente se muestran en el historial con el indicador ⚙️.


V5.2.6: las ampliaciones a 10 h se contabilizan cuando la conducción diaria supera 9:00 h (>540 min), y los descansos semanales manuales se conservan junto con los detectados automáticamente.


CAMBIOS V5.3.2
---------------
- Botón “Cambiar matrícula” para desplegar el formulario de configuración inicial con campos vacíos; al guardar los campos se limpian y se ocultan.
- Al cambiar de matrícula se puede reiniciar Historial y Control Tacógrafo o conservar los datos existentes.
- Estadísticas: botón “Cambiar periodo” para seleccionar el primer día del periodo mensual; el día final se calcula automáticamente como el día anterior del mes siguiente.
- Historial: “Historial de repostajes” con borde más visible.
- Detalle de jornada: la flecha superior y el botón Volver regresan directamente a Historial.
- Pausa realizada: se calcula en la jornada anterior cuando se inicia una nueva jornada, incluso cuando la nueva jornada permanece abierta.
- Botón “Recalcular” en Control Tacógrafo para reconstruir los contadores desde las jornadas y descansos guardados.
- Conducción semanal: cálculo por semana fija lunes-domingo.
- Conducción bisemanal: suma de las dos semanas fijas consecutivas, evitando sumar dos veces una misma jornada.
- Las jornadas que cruzan medianoche se asignan provisionalmente a la semana de inicio, y la aplicación muestra un aviso porque no dispone del reparto exacto de minutos de conducción por día.
- Alertas anticipadas para 56 h semanales, 90 h bisemanales, ampliaciones de 10 h, descansos diarios reducidos y próximo descanso semanal.
- Calendario semanal del conductor con conducción diaria y descansos detectados.

CAMBIOS V5.3.3
---------------
- En Control Tacógrafo, los botones “Recalcular” y “Actualizar horas reales” aparecen juntos y ocupan aproximadamente la mitad del ancho cada uno.
- “Actualizar horas reales” permite introducir en cualquier momento las lecturas reales de conducción semanal y bisemanal que muestra el tacógrafo.
- El botón “Actualizar horas reales” queda desactivado mientras existe una jornada abierta; solo se puede usar con la jornada cerrada.
- Las lecturas introducidas se guardan como nuevo punto de partida y la aplicación continúa sumando las nuevas jornadas a partir de ese momento.
- Si el conductor no actualiza manualmente las lecturas, la aplicación mantiene su cálculo automático.
- Se mantiene el aviso automático para jornadas que cruzan el cambio de semana.
- Se activa el botón “Recalcular” para recalcular y guardar los contadores del tacógrafo.
