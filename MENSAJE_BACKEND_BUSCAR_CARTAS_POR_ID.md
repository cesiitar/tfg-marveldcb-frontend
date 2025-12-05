# Mensaje para Backend: Búsqueda de Cartas por Código de MarvelCDB

## ⚠️ IMPORTANTE: Code vs ID

En MarvelCDB, cada carta tiene:
- **`code`**: Identificador único alfanumérico (ej: "01001", "01002") - **ESTO ES LO QUE USAMOS**
- **`id`**: ID numérico interno (si existe) - **NO USAR ESTO**

**El frontend siempre usa el `code` de MarvelCDB, NO el `id`.**

## Problema Actual

Cuando importamos mazos desde MarvelCDB, el frontend busca cartas por **nombre**, lo cual causa problemas:
- Cartas con el mismo nombre pero diferente aspecto se confunden
- El aspecto de las cartas no se pasa correctamente al crear el mazo
- Los héroes se confunden (ej: Captain Marvel → Adam Warlock)

## Solución: Buscar por Código de MarvelCDB

El frontend ahora busca cartas **primero por código de MarvelCDB** (`code`), y solo usa búsqueda por nombre como fallback.

## Endpoint Requerido

### `GET /api/cards/marvelcdb-code/{code}`

**Descripción:** Busca una carta en nuestra BD usando el **`code`** de MarvelCDB (NO el `id`) como identificador único.

**Parámetro:**
- `{code}`: El `code` de MarvelCDB (ej: "01001", "01002") - **NO es un ID numérico**

**Ejemplo:**
```
GET /api/cards/marvelcdb-code/01001
```

**Nota:** El `code` viene del campo `code` de la respuesta de MarvelCDB, no de un campo `id`.

**Response (éxito - 200):**
```json
{
  "id": 123,
  "name": "Spider-Man",
  "clase": "aggression",
  "type": "hero",
  "set": "Core Set",
  "cost": 0,
  "marvelcdb_code": "01001"
}
```

**Response (no encontrada - 404):**
```json
{
  "error": "Carta no encontrada"
}
```

## Cambios Necesarios en el Backend

### 1. Campo `marvelcdb_code` en la Tabla de Cartas

**CRÍTICO:** Cuando importas una carta desde MarvelCDB, debes guardar el **`code`** (NO el `id`) de MarvelCDB en un campo `marvelcdb_code` en tu tabla de cartas.

**Ejemplo de estructura:**
```sql
ALTER TABLE cards ADD COLUMN marvelcdb_code VARCHAR(20) UNIQUE;
CREATE INDEX idx_marvelcdb_code ON cards(marvelcdb_code);
```

**⚠️ IMPORTANTE:** Guarda el campo `code` de MarvelCDB, no un campo `id` (si existe).

### 2. Guardar el Código al Importar

Cuando importas cartas desde MarvelCDB (endpoint `POST /api/cards/import-missing`), asegúrate de guardar el **`code`** (NO el `id`):

```python
# Ejemplo en Python
# La respuesta de MarvelCDB tiene: { "code": "01001", "name": "Spider-Man", ... }
card_data = {
    "name": marvelcdb_card["name"],
    "clase": aspect_map.get(marvelcdb_card["faction_code"], "basic"),
    "type": type_map.get(marvelcdb_card["type_code"], "event"),
    "set": marvelcdb_card.get("pack_code", ""),
    "cost": marvelcdb_card.get("cost", 0),
    "marvelcdb_code": marvelcdb_card["code"]  # ← CRÍTICO: Guardar el CODE (no id)
}
```

**⚠️ NO uses `marvelcdb_card["id"]` si existe, usa siempre `marvelcdb_card["code"]`**

### 3. Implementar el Endpoint de Búsqueda

```python
# Ejemplo en Python (FastAPI)
@router.get("/cards/marvelcdb-code/{code}")
async def get_card_by_marvelcdb_code(code: str):
    """
    Busca una carta por su código de MarvelCDB
    """
    card = db.query(Card).filter(Card.marvelcdb_code == code).first()
    
    if not card:
        raise HTTPException(status_code=404, detail="Carta no encontrada")
    
    return card
```

## Importante: Aspecto de las Cartas

Cuando el frontend crea un mazo, pasa el **aspecto de MarvelCDB** (`faction_code`) en el campo `clase` de cada `DeckCard`. 

**NO uses el aspecto de nuestra BD**, usa el que viene de MarvelCDB porque:
- Puede haber cartas con el mismo nombre pero diferente aspecto
- MarvelCDB es la fuente de verdad para el aspecto correcto

**Estructura de DeckCard que envía el frontend:**
```json
{
  "card_id": 123,           // ID de nuestra BD (obtenido por código MarvelCDB)
  "card_name": "Spider-Man", // Nombre de nuestra BD
  "quantity": 1,
  "set": "Core Set",
  "type": "hero",
  "clase": "aggression"      // ← Aspecto de MarvelCDB, NO de nuestra BD
}
```

## Resumen

1. ✅ Añadir campo `marvelcdb_code` a la tabla de cartas
2. ✅ Guardar el **`code`** (NO el `id`) de MarvelCDB al importar cartas
3. ✅ Implementar `GET /api/cards/marvelcdb-code/{code}` (donde `{code}` es el `code` de MarvelCDB)
4. ✅ Usar el aspecto de MarvelCDB al crear mazos (no el de nuestra BD)

**Recordatorio:** Siempre usar el campo `code` de MarvelCDB, nunca un campo `id` (si existe).

Con estos cambios, la importación de mazos será precisa y no habrá confusiones con nombres duplicados o aspectos incorrectos.

