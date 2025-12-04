# Mensaje para Backend: Implementación de Importación de Cartas desde MarvelCDB

## Contexto

El frontend ya tiene implementada la funcionalidad para importar mazos desde MarvelCDB. Sin embargo, cuando un usuario intenta importar un mazo, puede que algunas cartas no estén disponibles en nuestra base de datos, lo que causa que la creación del mazo falle.

Para solucionar esto, necesitamos que el backend implemente **2 endpoints** que permitan:
1. Verificar qué cartas faltan en nuestra base de datos
2. Importar automáticamente las cartas faltantes desde la API pública de MarvelCDB

## Endpoints Requeridos

### 0. Buscar Carta por Código de MarvelCDB (IMPORTANTE)

**Endpoint:** `GET /api/cards/marvelcdb-code/{code}`

**Headers:**
```
Content-Type: application/json
```

**Response (éxito):**
```json
{
  "card": {
    "id": 123,
    "name": "Spider-Man",
    "clase": "aggression",
    "type": "hero",
    "set": "Core Set",
    "cost": 0
  }
}
```

**Response (no encontrada):**
```
Status: 404 Not Found
```

**Lógica:**
- Recibir el código de MarvelCDB (ej: "01001")
- Buscar en nuestra BD la carta que tenga ese código almacenado
- Devolver la carta completa con todos sus datos
- Si no existe, devolver 404

**Nota:** Este endpoint es crítico para la importación de mazos. Cuando importas una carta desde MarvelCDB, debes guardar el `code` de MarvelCDB en tu BD para poder buscarla después.

---

### 1. Verificar Cartas Faltantes

**Endpoint:** `POST /api/cards/check-missing`

**Headers:**
```
Content-Type: application/json
```

**Request Body:**
```json
{
  "card_codes": ["01001", "01002", "01003"]
}
```

**Response (éxito):**
```json
{
  "missing": ["01001", "01002"],
  "existing": ["01003"],
  "total_checked": 3
}
```

**Lógica:**
- Recibir array de `card_codes` (códigos únicos de MarvelCDB, ej: "01001", "01002")
- Verificar en nuestra base de datos cuáles códigos existen y cuáles no
- Devolver dos arrays separados: `missing` (no existen) y `existing` (ya existen)

---

### 2. Importar Cartas Faltantes

**Endpoint:** `POST /api/cards/import-missing`

**Headers:**
```
Content-Type: application/json
X-Auth0-ID: {auth0_id}  // Opcional pero recomendado
```

**Request Body:**
```json
{
  "card_codes": ["01001", "01002"]
}
```

**Response (éxito):**
```json
{
  "imported": 2,
  "failed": 0,
  "skipped": 0,
  "message": "2 cartas importadas exitosamente"
}
```

**Response (con errores):**
```json
{
  "imported": 1,
  "failed": 1,
  "skipped": 0,
  "message": "1 carta importada, 1 falló",
  "errors": [
    {
      "code": "01002",
      "error": "Carta no encontrada en MarvelCDB"
    }
  ]
}
```

**Lógica:**
1. Recibir array de `card_codes` a importar
2. Para cada código:
   - **Si ya existe en nuestra BD** → Incrementar `skipped` y continuar
   - **Si NO existe**:
     - Hacer petición HTTP GET a: `https://marvelcdb.com/api/public/card/{code}`
     - Obtener datos de la carta desde MarvelCDB
     - Mapear campos (ver sección de mapeo abajo)
     - Guardar en nuestra base de datos
     - Incrementar `imported` si éxito, `failed` si falla
3. Devolver resumen con contadores

---

## Mapeo de Campos desde MarvelCDB

### Estructura de respuesta de MarvelCDB

Cuando haces `GET https://marvelcdb.com/api/public/card/{code}`, recibes un JSON con campos como:

```json
{
  "code": "01001",
  "name": "Spider-Man",
  "type_code": "hero",
  "faction_code": "hero",
  "pack_code": "core",
  "cost": 0,
  "text": "...",
  // ... otros campos
}
```

### Mapeo necesario

| Campo MarvelCDB | Campo Nuestra BD | Notas |
|----------------|------------------|-------|
| `code` | **`marvelcdb_code`** (NUEVO CAMPO) | **CRÍTICO: Guardar este código para poder buscar cartas después** |
| `name` | `name` | Nombre de la carta |
| `faction_code` | `clase` | Ver mapeo de aspectos abajo |
| `type_code` | `type` | Ver mapeo de tipos abajo |
| `pack_code` | `set` | Nombre del pack/set |
| `cost` | `cost` | Coste de la carta |

**IMPORTANTE:** Debes guardar el `code` de MarvelCDB en un campo `marvelcdb_code` en tu tabla de cartas. Esto permite buscar cartas de forma única y precisa, evitando problemas con nombres duplicados o aspectos incorrectos.

### Mapeo de Aspectos (`faction_code` → `clase`)

```python
aspect_map = {
    'aggression': 'aggression',
    'justice': 'justice',
    'leadership': 'leadership',
    'protection': 'protection',
    'pool': 'pool',
    'basic': 'basic',
    'encounter': 'encounter',
    'campaign': 'campaign',
    'hero': 'hero'
}
```

### Mapeo de Tipos (`type_code` → `type`)

```python
type_map = {
    'ally': 'ally',
    'event': 'event',
    'upgrade': 'upgrade',
    'support': 'support',
    'resource': 'resource',
    'attachment': 'attachment',
    'minion': 'minion',
    'side_scheme': 'side_scheme',
    'main_scheme': 'main_scheme',
    'treachery': 'treachery',
    'obligation': 'obligation',
    'environment': 'environment',
    'hero': 'hero',
    'alter_ego': 'alter_ego',
    'player_side_scheme': 'player_side_scheme',
    'evidence': 'evidence'
}
```

---

## Ejemplo de Implementación (Pseudocódigo)

```python
# Endpoint: POST /api/cards/check-missing
def check_missing_cards(card_codes: List[str]):
    missing = []
    existing = []
    
    for code in card_codes:
        # Verificar si existe en nuestra BD (usar el code como referencia)
        if card_exists_in_db(code):
            existing.append(code)
        else:
            missing.append(code)
    
    return {
        "missing": missing,
        "existing": existing,
        "total_checked": len(card_codes)
    }

# Endpoint: POST /api/cards/import-missing
def import_missing_cards(card_codes: List[str]):
    imported = 0
    failed = 0
    skipped = 0
    errors = []
    
    for code in card_codes:
        try:
            # Verificar si ya existe
            if card_exists_in_db(code):
                skipped += 1
                continue
            
            # Obtener carta desde MarvelCDB
            response = requests.get(f"https://marvelcdb.com/api/public/card/{code}")
            
            if response.status_code != 200:
                failed += 1
                errors.append({
                    "code": code,
                    "error": "Carta no encontrada en MarvelCDB"
                })
                continue
            
            marvelcdb_card = response.json()
            
            # Mapear campos
            card_data = {
                "name": marvelcdb_card["name"],
                "clase": aspect_map.get(marvelcdb_card["faction_code"], "basic"),
                "type": type_map.get(marvelcdb_card["type_code"], "event"),
                "set": marvelcdb_card.get("pack_code", ""),
                "cost": marvelcdb_card.get("cost", 0),
                # CRÍTICO: Guardar el code de MarvelCDB para poder buscar después
                "marvelcdb_code": code
            }
            
            # Guardar en nuestra BD
            save_card_to_db(card_data)
            imported += 1
            
        except Exception as e:
            failed += 1
            errors.append({
                "code": code,
                "error": str(e)
            })
    
    return {
        "imported": imported,
        "failed": failed,
        "skipped": skipped,
        "message": f"{imported} carta(s) importada(s), {failed} fallaron, {skipped} omitidas",
        "errors": errors if errors else None
    }
```

---

## Consideraciones Importantes

### 1. Referencia única de cartas (CRÍTICO)
- El `code` de MarvelCDB debe usarse como referencia única
- **DEBES guardar el `code` en un campo `marvelcdb_code` en tu tabla de cartas**
- Al verificar si existe, buscar por `marvelcdb_code` (no por nombre)
- Al buscar cartas, usar el endpoint `GET /api/cards/marvelcdb-code/{code}` para obtener la carta correcta
- Esto evita problemas con nombres duplicados o aspectos incorrectos

### 2. Manejo de errores
- Si una carta no existe en MarvelCDB → `failed++`, continuar con las demás
- Si una carta ya existe en nuestra BD → `skipped++`, no duplicar
- No bloquear el proceso si algunas cartas fallan

### 3. Performance
- Las peticiones a MarvelCDB pueden ser secuenciales o en paralelo
- Considerar rate limiting si MarvelCDB lo requiere
- Puede tardar unos segundos si hay muchas cartas nuevas

### 4. Validación
- Validar que los `card_codes` sean strings válidos
- Validar que los datos de MarvelCDB sean correctos antes de guardar
- Manejar campos opcionales (algunos pueden no existir)

### 5. CORS
- La API pública de MarvelCDB tiene CORS habilitado
- Las peticiones desde el backend no deberían tener problemas de CORS

---

## Flujo Completo

1. **Usuario importa mazo desde MarvelCDB** (frontend)
2. **Frontend verifica cartas faltantes** → `POST /api/cards/check-missing`
3. **Si hay cartas faltantes, frontend las importa** → `POST /api/cards/import-missing`
4. **Backend importa las cartas desde MarvelCDB** y las guarda en nuestra BD
5. **Frontend crea el mazo** → `POST /api/decks` (todas las cartas ya existen)

---

## Referencias

- **API de MarvelCDB:** https://marvelcdb.com/api/doc
- **Base URL:** https://marvelcdb.com/api/public
- **Ejemplo de carta:** https://marvelcdb.com/api/public/card/01001

---

## Preguntas Frecuentes

**P: ¿Qué pasa si el código de la carta no existe en MarvelCDB?**  
R: El backend debe retornar un error para esa carta específica en el array `errors`, pero seguir importando las demás.

**P: ¿Puedo importar todas las cartas de una vez?**  
R: Sí, puedes pasar todos los `codes` en un solo request. El backend las procesará todas.

**P: ¿Qué pasa si intento importar una carta que ya existe?**  
R: Se omite automáticamente (no se duplica). El contador `skipped` indica cuántas se omitieron.

**P: ¿Necesito autenticación?**  
R: El endpoint acepta el header `X-Auth0-ID` pero no es estrictamente necesario. Sin embargo, es recomendable incluirlo si tu aplicación usa autenticación.

**P: ¿Cómo sé qué campo usar como referencia única?**  
R: Usa el `code` de MarvelCDB como referencia única. Deberías guardarlo en tu BD para poder verificar duplicados.

---

## Notas Finales

- El frontend ya está completamente implementado y listo para usar estos endpoints
- Los endpoints deben seguir exactamente la estructura de request/response especificada
- El mapeo de campos es crítico para que las cartas se guarden correctamente
- Considera implementar logging para rastrear qué cartas se importan y cuáles fallan

Si tienes alguna duda o necesitas aclarar algo, avísame.

