# Mensaje para Backend: Búsqueda de Cartas por ID de MarvelCDB

## Problema Actual

Cuando importamos mazos desde MarvelCDB, el frontend busca cartas por **nombre**, lo cual causa problemas:
- Cartas con el mismo nombre pero diferente aspecto se confunden
- El aspecto de las cartas no se pasa correctamente al crear el mazo
- Los héroes se confunden (ej: Captain Marvel → Adam Warlock)

## Solución: Buscar por Código de MarvelCDB

El frontend ahora busca cartas **primero por código de MarvelCDB** (ID único), y solo usa búsqueda por nombre como fallback.

## Endpoint Requerido

### `GET /api/cards/marvelcdb-code/{code}`

**Descripción:** Busca una carta en nuestra BD usando el código de MarvelCDB como identificador único.

**Ejemplo:**
```
GET /api/cards/marvelcdb-code/01001
```

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

**CRÍTICO:** Cuando importas una carta desde MarvelCDB, debes guardar el `code` de MarvelCDB en un campo `marvelcdb_code` en tu tabla de cartas.

**Ejemplo de estructura:**
```sql
ALTER TABLE cards ADD COLUMN marvelcdb_code VARCHAR(20) UNIQUE;
CREATE INDEX idx_marvelcdb_code ON cards(marvelcdb_code);
```

### 2. Guardar el Código al Importar

Cuando importas cartas desde MarvelCDB (endpoint `POST /api/cards/import-missing`), asegúrate de guardar el `code`:

```python
# Ejemplo en Python
card_data = {
    "name": marvelcdb_card["name"],
    "clase": aspect_map.get(marvelcdb_card["faction_code"], "basic"),
    "type": type_map.get(marvelcdb_card["type_code"], "event"),
    "set": marvelcdb_card.get("pack_code", ""),
    "cost": marvelcdb_card.get("cost", 0),
    "marvelcdb_code": marvelcdb_card["code"]  # ← CRÍTICO: Guardar el código
}
```

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
2. ✅ Guardar el `code` de MarvelCDB al importar cartas
3. ✅ Implementar `GET /api/cards/marvelcdb-code/{code}`
4. ✅ Usar el aspecto de MarvelCDB al crear mazos (no el de nuestra BD)

Con estos cambios, la importación de mazos será precisa y no habrá confusiones con nombres duplicados o aspectos incorrectos.

