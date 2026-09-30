APP CONDUCTOR V5.2.8 — MULTIDIOMA + CONTROL TACÓGRAFO
====================================================

Versión local para GitHub Pages. Los datos se guardan en localStorage del dispositivo.
No utiliza Google Sheets ni servidor para almacenar los datos.

NOVEDADES V5.2.8
---------------
- Control Tacógrafo orientativo integrado.
- Los datos iniciales del tacógrafo se muestran solo durante la configuración inicial de la matrícula; después quedan ocultos para evitar duplicidades.
- Al cambiar de matrícula se pregunta si se desea reiniciar Historial y Control Tacógrafo o conservarlos.
- Las notas/incidencias pueden introducirse también al finalizar una jornada.
- Estadísticas simplificadas: se elimina el listado de últimas jornadas.
- Detalle de jornada: “Información detallada” y “Pausa realizada”, calculada al iniciar la siguiente jornada.
- El cálculo de descansos diarios reducidos considera también la ventana de 24 h y la disponibilidad de la jornada anterior.
- Conducción bisemanal: el valor inicial es una foto del tacógrafo y solo se añaden jornadas posteriores a esa foto dentro de las dos semanas en curso.
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


CAMBIOS V5.2.8
---------------
- Botón “Cambiar matrícula” para desplegar el formulario de configuración inicial con campos vacíos; al guardar los campos se limpian y se ocultan.
- Al cambiar de matrícula se puede reiniciar Historial y Control Tacógrafo o conservar los datos existentes.
- Estadísticas: botón “Cambiar periodo” para seleccionar el primer día del periodo mensual; el día final se calcula automáticamente como el día anterior del mes siguiente.
- Historial: “Historial de repostajes” con borde más visible.
- Detalle de jornada: la flecha superior y el botón Volver regresan directamente a Historial.
- Pausa realizada: se calcula en la jornada anterior cuando se inicia una nueva jornada, incluso cuando la nueva jornada permanece abierta.
- Conducción bisemanal: el dato inicial del tacógrafo deja de utilizarse cuando ya queda fuera de la ventana de dos semanas; dentro de la ventana solo se suman jornadas posteriores a la fecha base.
