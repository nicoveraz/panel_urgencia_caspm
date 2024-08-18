# panel_caspm
Pantalla urgencia Andes Salud Puerto Montt

## Objetivo

Panel que muestra los pacientes en atención del servicio de urgencia, a diferencia del modelo actual, que es una tabla, este proyecto incorpora la distribución de boxes para saber cúales están disponibles en todo momento. Esto para facilitar la gestión en momentos de alta ocupación/demanda

## Método

Proyecto experimental pero 100% funcional. Para no modificar lo existente el proyecto se divide en dos: 

1. Servidor nodejs: analiza datos de página actual, que es creada con php, código al que no tengo acceso, y los exporta como json
2. Página HTML + CSS + JS que muestra nuevo panel

Esta separación permite avanzar en la implementación independiente del acceso/avance del servidor

## Roadmap

- [ ] Distribución boxes en JSON aparte (sistema susceptible de modificación para uso en otro centro de la red o en caso de modificación de planta física) 
- [ ] Notificación procedimientos pendientes
- [ ] Eliminar necesidad de servidor nodejs (requiere rehacer servidor actual)
