# 📝 Documentación para el Backend — Implementación de `favorite_count`

## 🎯 Objetivo

El frontend necesita que el backend devuelva el campo `favorite_count` (número de usuarios que han marcado un mazo como favorito) en los siguientes endpoints para mostrar correctamente el contador de favoritos en todas las páginas.

---

## ✅ Endpoints que deben incluir `favorite_count`

### 1️⃣ `GET /api/decks`

**Descripción:** Obtiene todos los mazos públicos.

**Respuesta esperada:**
```json
{
  "decks": [
    {
      "id": 1,
      "name": "Mi Mazo",
      "hero_name": "Spider-Man",
      "aspect": "aggression",
      "cards": [...],
      "creator_name": "Usuario123",
      "created_at": "2024-01-15T10:30:00",
      "favorite_count": 5  // ← REQUERIDO: Número de usuarios que han marcado este mazo como favorito
    },
    ...
  ]
}
```

**SQL sugerido:**
```sql
SELECT 
  d.*,
  COUNT(DISTINCT f.auth0_id) as favorite_count
FROM decks d
LEFT JOIN favorites f ON d.id = f.deck_id
GROUP BY d.id
ORDER BY d.created_at DESC;
```

---

### 2️⃣ `GET /api/decks/{deck_id}`

**Descripción:** Obtiene un mazo específico por su ID.

**Respuesta esperada:**
```json
{
  "id": 1,
  "name": "Mi Mazo",
  "hero_name": "Spider-Man",
  "aspect": "aggression",
  "cards": [...],
  "creator_name": "Usuario123",
  "created_at": "2024-01-15T10:30:00",
  "favorite_count": 5  // ← REQUERIDO: Número de usuarios que han marcado este mazo como favorito
}
```

**SQL sugerido:**
```sql
SELECT 
  d.*,
  COUNT(DISTINCT f.auth0_id) as favorite_count
FROM decks d
LEFT JOIN favorites f ON d.id = f.deck_id
WHERE d.id = :deck_id
GROUP BY d.id;
```

---

### 3️⃣ `GET /api/user/favorites`

**Descripción:** Obtiene los mazos favoritos del usuario autenticado.

**Headers requeridos:**
```
X-Auth0-ID: auth0|123456789
```

**Respuesta esperada:**
```json
{
  "favorites": [
    {
      "id": 1,
      "name": "Mi Mazo",
      "hero_name": "Spider-Man",
      "aspect": "aggression",
      "cards": [...],
      "creator_name": "Usuario123",
      "created_at": "2024-01-15T10:30:00",
      "favorite_count": 5  // ← REQUERIDO: Número de usuarios que han marcado este mazo como favorito
    },
    ...
  ]
}
```

**SQL sugerido:**
```sql
SELECT 
  d.*,
  COUNT(DISTINCT f2.auth0_id) as favorite_count
FROM decks d
INNER JOIN favorites f1 ON d.id = f1.deck_id AND f1.auth0_id = :auth0_id
LEFT JOIN favorites f2 ON d.id = f2.deck_id
WHERE f1.auth0_id = :auth0_id
GROUP BY d.id
ORDER BY f1.created_at DESC;
```

---

### 4️⃣ `GET /api/user/decks`

**Descripción:** Obtiene los mazos del usuario autenticado.

**Headers requeridos:**
```
X-Auth0-ID: auth0|123456789
```

**Respuesta esperada:**
```json
{
  "decks": [
    {
      "id": 1,
      "name": "Mi Mazo",
      "hero_name": "Spider-Man",
      "aspect": "aggression",
      "cards": [...],
      "creator_name": "Usuario123",
      "created_at": "2024-01-15T10:30:00",
      "favorite_count": 5  // ← REQUERIDO: Número de usuarios que han marcado este mazo como favorito
    },
    ...
  ]
}
```

**SQL sugerido:**
```sql
SELECT 
  d.*,
  COUNT(DISTINCT f.auth0_id) as favorite_count
FROM decks d
LEFT JOIN favorites f ON d.id = f.deck_id
WHERE d.auth0_id = :auth0_id
GROUP BY d.id
ORDER BY d.created_at DESC;
```

---

## 📋 Estructura de la tabla `favorites`

Asumiendo que existe una tabla `favorites` con la siguiente estructura:

```sql
CREATE TABLE favorites (
  id SERIAL PRIMARY KEY,
  deck_id INTEGER NOT NULL REFERENCES decks(id) ON DELETE CASCADE,
  auth0_id VARCHAR(255) NOT NULL,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  UNIQUE(deck_id, auth0_id)
);
```

---

## 🔍 Cálculo del `favorite_count`

El `favorite_count` debe ser el **número total de usuarios únicos** que han marcado ese mazo como favorito, independientemente de si el usuario actual lo tiene como favorito o no.

**Ejemplo:**
- Si 5 usuarios diferentes han marcado el mazo ID 1 como favorito, entonces `favorite_count = 5`
- Si ningún usuario ha marcado el mazo como favorito, entonces `favorite_count = 0`

---

## ⚠️ Casos especiales

1. **Mazo sin favoritos:** Si un mazo no tiene favoritos, devolver `favorite_count: 0` (no `null` ni omitir el campo).

2. **Mazo eliminado:** Si un mazo se elimina, los favoritos asociados también deberían eliminarse (usar `ON DELETE CASCADE` en la foreign key).

3. **Consistencia:** El `favorite_count` debe ser consistente en todos los endpoints. Si un mazo tiene 5 favoritos, debe aparecer `favorite_count: 5` en todos los endpoints que devuelvan ese mazo.

---

## 🧪 Validación

Para verificar que funciona correctamente:

1. **Crear un mazo** → `favorite_count` debe ser `0`
2. **Marcar el mazo como favorito** (usuario A) → `favorite_count` debe ser `1`
3. **Marcar el mismo mazo como favorito** (usuario B) → `favorite_count` debe ser `2`
4. **Obtener el mazo desde diferentes endpoints** → Todos deben devolver `favorite_count: 2`
5. **Desmarcar favorito** (usuario A) → `favorite_count` debe ser `1`

---

## 📝 Notas importantes

- El campo `favorite_count` debe ser de tipo `INTEGER` o `BIGINT` en la base de datos.
- El cálculo debe hacerse en tiempo real (usando `COUNT` en SQL), no almacenar el valor en una columna separada (para evitar problemas de sincronización).
- Si usas un ORM, asegúrate de que el `COUNT` se haga correctamente y no se cachee incorrectamente.

---

## 🔗 Endpoints relacionados

Estos endpoints ya existen y funcionan correctamente:
- `POST /api/favorites` - Añadir/quitar favorito
- `GET /api/favorites/{deck_id}` - Verificar si un mazo es favorito del usuario

Solo necesitas añadir `favorite_count` a los endpoints de listado y detalle de mazos.

---

¿Necesitas algún ajuste adicional o alguna aclaración?
