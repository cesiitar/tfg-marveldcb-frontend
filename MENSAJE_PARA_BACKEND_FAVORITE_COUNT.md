# Documentación para el backend — Contador de favoritos

## 📋 Objetivo

Añadir un contador de favoritos (`favorite_count`) a cada mazo que muestre cuántos usuarios han marcado ese mazo como favorito.

---

## ✅ Lo que necesita implementar el backend

### 1️⃣ Modificar `GET /api/decks` (Lista de mazos)

**Descripción:** Incluir el conteo de favoritos en cada mazo de la lista.

**Método:** `GET`

**URL:** `/api/decks`

**Cambio requerido:**

En la respuesta actual, cada mazo debe incluir un campo `favorite_count` que indique cuántos usuarios han marcado ese mazo como favorito.

**Respuesta esperada:**

```json
{
  "decks": [
    {
      "id": 1,
      "name": "Mazo de Spider-Man",
      "hero_name": "Spider-Man",
      "aspect": "aggression",
      "cards": [...],
      "creator_name": "Juan Pérez",
      "created_at": "2024-01-15T10:30:00",
      "favorite_count": 5  // ← NUEVO: Número de usuarios que han marcado este mazo como favorito
    },
    {
      "id": 2,
      "name": "Mazo de Iron Man",
      "hero_name": "Iron Man",
      "aspect": "leadership",
      "cards": [...],
      "creator_name": "María García",
      "created_at": "2024-01-16T14:20:00",
      "favorite_count": 0  // ← Si no tiene favoritos, debe ser 0
    }
  ]
}
```

**Implementación sugerida (SQL):**

```sql
-- Ejemplo de query para obtener mazos con conteo de favoritos
SELECT 
  d.*,
  COALESCE(COUNT(f.id), 0) as favorite_count
FROM decks d
LEFT JOIN favorites f ON d.id = f.deck_id
GROUP BY d.id
ORDER BY d.created_at DESC;
```

**Notas:**
- Si un mazo no tiene favoritos, `favorite_count` debe ser `0` (no `null`)
- El conteo debe incluir TODOS los favoritos, no solo los del usuario actual
- El campo es opcional en el frontend (puede ser `undefined` si el backend no lo incluye aún)

---

### 2️⃣ Modificar `GET /api/decks/{deck_id}` (Detalle de mazo)

**Descripción:** Incluir el conteo de favoritos en el detalle de un mazo.

**Método:** `GET`

**URL:** `/api/decks/{deck_id}`

**Cambio requerido:**

Incluir `favorite_count` en la respuesta del detalle del mazo.

**Respuesta esperada:**

```json
{
  "deck": {
    "id": 1,
    "name": "Mazo de Spider-Man",
    "hero_name": "Spider-Man",
    "aspect": "aggression",
    "cards": [...],
    "creator_name": "Juan Pérez",
    "created_at": "2024-01-15T10:30:00",
    "favorite_count": 5  // ← NUEVO
  }
}
```

**Implementación sugerida (SQL):**

```sql
-- Ejemplo de query para obtener un mazo con conteo de favoritos
SELECT 
  d.*,
  COALESCE(COUNT(f.id), 0) as favorite_count
FROM decks d
LEFT JOIN favorites f ON d.id = f.deck_id
WHERE d.id = :deck_id
GROUP BY d.id;
```

---

## 📊 Estructura de la tabla de favoritos

Asumiendo que la tabla de favoritos tiene esta estructura:

```sql
CREATE TABLE favorites (
  id SERIAL PRIMARY KEY,
  deck_id INTEGER NOT NULL REFERENCES decks(id) ON DELETE CASCADE,
  auth0_id VARCHAR(255) NOT NULL,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  UNIQUE(deck_id, auth0_id)  -- Un usuario solo puede marcar un mazo una vez como favorito
);
```

**Nota:** El conteo se hace contando todas las filas en `favorites` donde `deck_id` coincide con el mazo.

---

## 🎯 Casos de uso

### Caso 1: Mazo sin favoritos
- `favorite_count: 0`

### Caso 2: Mazo con favoritos
- `favorite_count: 5` (5 usuarios han marcado este mazo como favorito)

### Caso 3: Mazo recién creado
- `favorite_count: 0` (aún no tiene favoritos)

---

## ✅ Checklist para el backend

- [ ] Modificar query de `GET /api/decks` para incluir `favorite_count`
- [ ] Modificar query de `GET /api/decks/{deck_id}` para incluir `favorite_count`
- [ ] Asegurar que `favorite_count` sea siempre un número (0 si no hay favoritos)
- [ ] Probar que el conteo se actualiza correctamente cuando se añade/elimina un favorito
- [ ] Verificar que el conteo incluye TODOS los favoritos (no solo los del usuario actual)

---

## 🔄 Actualización automática

**Importante:** El contador se actualiza automáticamente cuando:
- Un usuario marca un mazo como favorito (`POST /api/favorites` con `action: "add"`)
- Un usuario elimina un mazo de favoritos (`POST /api/favorites` con `action: "remove"`)

No es necesario hacer nada adicional, ya que el conteo se calcula dinámicamente en cada consulta.

---

## 📝 Notas adicionales

1. **Performance:** Si hay muchos mazos y favoritos, considerar usar un índice en `favorites(deck_id)` para optimizar el conteo.

2. **Consistencia:** El conteo debe ser consistente. Si un usuario marca un mazo como favorito, el `favorite_count` debe aumentar en 1 en la próxima consulta.

3. **Frontend:** El frontend ya está preparado para mostrar el contador. Si el backend no incluye `favorite_count`, simplemente no se mostrará (es opcional).

---

¿Necesitas algún ajuste adicional o alguna aclaración?

