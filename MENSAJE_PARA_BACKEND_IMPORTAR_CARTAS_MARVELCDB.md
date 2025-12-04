# Mensaje para Backend: Importar Cartas desde MarvelCDB

## Contexto

Hemos implementado la funcionalidad de importar mazos desde MarvelCDB en el frontend. Sin embargo, cuando un usuario intenta importar un mazo, puede que algunas cartas no estén disponibles en nuestra base de datos, lo que causa que el mazo se importe incompleto.

Para solucionar esto, necesitamos que el backend implemente la funcionalidad de importar cartas desde la API pública de MarvelCDB.

## Documentación de la API de MarvelCDB

La API pública de MarvelCDB está disponible en: **https://marvelcdb.com/api/doc**

### Endpoints disponibles para cartas:

1. **Obtener todas las cartas:**
   ```
   GET https://marvelcdb.com/api/public/cards/
   ```
   - Devuelve un array JSON con todas las cartas disponibles
   - No requiere autenticación (endpoint público)
   - Incluye CORS headers para uso desde frontend

2. **Obtener una carta específica:**
   ```
   GET https://marvelcdb.com/api/public/card/{card_code}
   ```
   - Ejemplo: `GET https://marvelcdb.com/api/public/card/01001`
   - Devuelve un objeto JSON con todos los detalles de la carta

3. **Obtener cartas de un pack específico:**
   ```
   GET https://marvelcdb.com/api/public/cards/{pack_code}
   ```
   - Devuelve todas las cartas de un pack específico

## Estructura de datos de las cartas en MarvelCDB

Según la documentación, las cartas de MarvelCDB incluyen campos como:
- `code`: Código único de la carta (ej: "01001")
- `name`: Nombre de la carta
- `type_code`: Tipo de carta (ej: "ally", "event", "upgrade", etc.)
- `faction_code`: Aspecto/clase de la carta (ej: "aggression", "justice", "leadership", "protection", "pool", "basic")
- `pack_code`: Código del pack al que pertenece
- `cost`: Coste de la carta
- Y otros campos según el tipo de carta

## Mapeo necesario

Para importar cartas a nuestra base de datos, necesitarás mapear:

1. **Aspecto/Clase (`faction_code` → `clase`):**
   - `aggression` → `aggression`
   - `justice` → `justice`
   - `leadership` → `leadership`
   - `protection` → `protection`
   - `pool` → `pool`
   - `basic` → `basic`
   - `encounter` → `encounter`
   - `campaign` → `campaign`
   - `hero` → `hero`

2. **Tipo de carta (`type_code` → `type`):**
   - Mapear los tipos de MarvelCDB a nuestros tipos
   - Ejemplos: `ally`, `event`, `upgrade`, `support`, `resource`, etc.

3. **Set/Pack:**
   - El `pack_code` de MarvelCDB debe mapearse a nuestros nombres de sets

## Sugerencias de implementación

### Opción 1: Sincronización completa
- Crear un endpoint o script que sincronice todas las cartas de MarvelCDB
- Ejecutar periódicamente para mantener la base de datos actualizada
- Ejemplo: `POST /api/admin/sync-cards-from-marvelcdb`

### Opción 2: Importación bajo demanda
- Cuando se detecte una carta faltante durante la importación de un mazo
- Importar automáticamente esa carta desde MarvelCDB
- Guardarla en nuestra base de datos para futuros usos

### Opción 3: Híbrida (recomendada)
- Sincronización inicial de todas las cartas
- Importación bajo demanda para cartas nuevas que no estén en nuestra BD
- Sincronización periódica para mantener actualizado

## Consideraciones

1. **CORS:** La API pública de MarvelCDB incluye headers CORS, pero es mejor hacer las peticiones desde el backend para evitar problemas de CORS y tener más control.

2. **Rate Limiting:** Verificar si MarvelCDB tiene límites de peticiones. Si es así, implementar throttling en las peticiones.

3. **Caché:** La API pública usa caché HTTP. Aprovechar esto para optimizar las peticiones.

4. **Validación:** Validar que las cartas importadas cumplan con nuestro esquema de base de datos antes de guardarlas.

5. **Duplicados:** Verificar si una carta ya existe antes de importarla (usar el `code` de MarvelCDB como referencia única).

## Ejemplo de uso desde el frontend

Actualmente, cuando el frontend intenta importar un mazo y encuentra cartas faltantes, muestra una advertencia. Una vez que el backend implemente la importación de cartas, el flujo sería:

1. Usuario intenta importar un mazo desde MarvelCDB
2. Frontend detecta cartas faltantes
3. Frontend llama a un endpoint del backend: `POST /api/decks/import-from-marvelcdb`
4. Backend:
   - Obtiene el mazo de MarvelCDB
   - Para cada carta faltante, la importa desde MarvelCDB
   - Guarda las cartas en nuestra BD
   - Crea el mazo con todas las cartas
5. Frontend recibe el mazo completo

## Referencias

- Documentación de la API: https://marvelcdb.com/api/doc
- API Base URL: https://marvelcdb.com/api/public
- Ejemplo de carta: https://marvelcdb.com/api/public/card/01001

## Notas adicionales

- La API es pública y no requiere autenticación para los endpoints básicos
- Si necesitas funcionalidades avanzadas, puedes solicitar acceso OAuth2 contactando a los administradores de MarvelCDB
- Las respuestas están en formato JSON con codificación ASCII (caracteres especiales como `\uXXXX`)

