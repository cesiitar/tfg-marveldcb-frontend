# 📋 **MENSAJE PARA EL BACKEND - SISTEMA DE COMENTARIOS**

## ❌ **¿POR QUÉ NO BASTA CON AÑADIR UNA COLUMNA EN LA TABLA DE MAZOS?**

No es suficiente añadir una columna `comments` en la tabla `decks` porque:

1. **Un mazo puede tener múltiples comentarios** - Si solo añadimos una columna, solo podríamos guardar un comentario por mazo
2. **Cada comentario necesita saber quién lo escribió** - Necesitamos el `auth0_id` del usuario
3. **Cada comentario necesita saber cuándo se escribió** - Necesitamos `created_at`
4. **Relación uno a muchos** - Un mazo (`deck`) puede tener muchos comentarios (`comment`)

## ✅ **SOLUCIÓN: TABLA SEPARADA `deck_comments`**

### **Estructura de la Tabla:**

```sql
CREATE TABLE deck_comments (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    deck_id INTEGER NOT NULL,
    auth0_id TEXT NOT NULL,
    comment_text TEXT NOT NULL,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP,
    FOREIGN KEY (deck_id) REFERENCES decks(id) ON DELETE CASCADE
);

-- Índice para búsquedas rápidas
CREATE INDEX idx_deck_comments_deck_id ON deck_comments(deck_id);
CREATE INDEX idx_deck_comments_auth0_id ON deck_comments(auth0_id);
```

### **Campos:**

- `id`: ID único del comentario (PRIMARY KEY)
- `deck_id`: ID del mazo al que pertenece (FOREIGN KEY → `decks.id`)
- `auth0_id`: ID del usuario que escribió el comentario (Auth0 `sub`)
- `comment_text`: El texto del comentario (TEXT)
- `created_at`: Fecha y hora de creación (TIMESTAMP)
- `updated_at`: (Opcional) Fecha y hora de última actualización (si se permite editar)

---

## 🚀 **ENDPOINTS NECESARIOS**

### **1. GET /api/decks/{deck_id}/comments - Obtener comentarios de un mazo**

**Descripción**: Obtiene todos los comentarios de un mazo específico.

**Método**: `GET`

**URL**: `/api/decks/{deck_id}/comments`

**Headers**: Ninguno requerido (público)

**Parámetros de URL**:
- `deck_id` (INTEGER): ID del mazo

**Respuesta Exitosa (200 OK)**:
```json
{
  "comments": [
    {
      "id": 1,
      "deck_id": 5,
      "auth0_id": "auth0|123456789",
      "author_name": "Juan Pérez",  // Nombre del usuario (obtener de la tabla users si existe)
      "comment_text": "¡Excelente mazo! Muy bien construido.",
      "created_at": "2024-01-15T10:30:00Z",
      "updated_at": null
    },
    {
      "id": 2,
      "deck_id": 5,
      "auth0_id": "auth0|987654321",
      "author_name": "María García",
      "comment_text": "Lo probé y funciona muy bien contra Rhino.",
      "created_at": "2024-01-16T14:20:00Z",
      "updated_at": null
    }
  ]
}
```

**Orden**: Los comentarios deben ordenarse por `created_at` DESC (más recientes primero)

**Notas**:
- Si el mazo no existe, devolver 404
- Si el mazo no tiene comentarios, devolver array vacío: `{"comments": []}`
- `author_name` es opcional, pero recomendado. Si no tienes tabla de usuarios, puede ser `null` o el `auth0_id`

---

### **2. POST /api/decks/{deck_id}/comments - Crear un nuevo comentario**

**Descripción**: Crea un nuevo comentario en un mazo. **REQUIERE AUTENTICACIÓN**.

**Método**: `POST`

**URL**: `/api/decks/{deck_id}/comments`

**Headers**:
```
Content-Type: application/json
X-Auth0-ID: auth0|123456789  // ← ID del usuario autenticado (REQUERIDO)
```

**Parámetros de URL**:
- `deck_id` (INTEGER): ID del mazo

**Body (JSON)**:
```json
{
  "comment_text": "¡Excelente mazo! Muy bien construido."
}
```

**Validaciones**:
- `comment_text` debe ser un string no vacío (trimmed)
- `comment_text` no debe exceder un límite razonable (ej: 1000 caracteres)
- El mazo debe existir
- El usuario debe estar autenticado (`X-Auth0-ID` header presente)

**Respuesta Exitosa (201 Created)**:
```json
{
  "comment": {
    "id": 3,
    "deck_id": 5,
    "auth0_id": "auth0|123456789",
    "author_name": "Juan Pérez",  // Opcional
    "comment_text": "¡Excelente mazo! Muy bien construido.",
    "created_at": "2024-01-17T09:15:00Z",
    "updated_at": null
  },
  "message": "Comentario creado correctamente"
}
```

**Errores**:
- **400 Bad Request**: Si `comment_text` está vacío o es inválido
- **401 Unauthorized**: Si no se proporciona `X-Auth0-ID`
- **404 Not Found**: Si el mazo no existe
- **422 Unprocessable Entity**: Si el comentario excede el límite de caracteres

---

## 💡 **EJEMPLOS DE USO**

### **Frontend - Obtener comentarios:**
```javascript
// GET /api/decks/5/comments
const response = await fetch('http://localhost:8000/api/decks/5/comments');
const data = await response.json();
console.log(data.comments); // Array de comentarios
```

### **Frontend - Crear comentario:**
```javascript
// POST /api/decks/5/comments
const response = await fetch('http://localhost:8000/api/decks/5/comments', {
  method: 'POST',
  headers: {
    'Content-Type': 'application/json',
    'X-Auth0-ID': 'auth0|123456789'  // Auth0 sub del usuario
  },
  body: JSON.stringify({
    comment_text: '¡Excelente mazo!'
  })
});
const data = await response.json();
console.log(data.comment); // Nuevo comentario creado
```

---

## 📝 **NOTAS IMPORTANTES**

1. **Autenticación**: El endpoint POST requiere el header `X-Auth0-ID` para identificar al usuario que crea el comentario
2. **Validación**: Validar que el comentario no esté vacío (trimmed) y que no exceda un límite razonable
3. **Orden**: Los comentarios deben mostrarse ordenados por fecha de creación (más recientes primero)
4. **Nombres de usuario**: Si tienes una tabla de usuarios que almacena nombres, inclúyelos en la respuesta como `author_name`. Si no, puedes usar `null` o el `auth0_id`
5. **Cascada**: Si un mazo se elimina, sus comentarios deben eliminarse también (ON DELETE CASCADE)

---

## ✅ **CHECKLIST PARA EL BACKEND**

- [ ] Crear tabla `deck_comments` con la estructura correcta
- [ ] Implementar `GET /api/decks/{deck_id}/comments`
- [ ] Implementar `POST /api/decks/{deck_id}/comments`
- [ ] Validar que el usuario esté autenticado en POST
- [ ] Validar que el comentario no esté vacío
- [ ] Validar que el mazo exista
- [ ] Ordenar comentarios por fecha (más recientes primero)
- [ ] Añadir índices para búsquedas rápidas
- [ ] Manejar errores apropiadamente (404, 400, 401, 422)
- [ ] (Opcional) Incluir `author_name` si tienes tabla de usuarios

---

**¡Una vez implementado, el frontend estará listo para usar!** 🚀

