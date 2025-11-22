# Mensaje para Backend - Probabilidad de Victoria en Generación de Mazos IA

## Resumen
Se necesita añadir el campo `win_probability` (probabilidad de victoria) a la respuesta del endpoint de generación de mazos por IA para que el frontend pueda mostrarlo al usuario.

## Endpoint Afectado
**POST** `/api/recommendations/deck`

## Cambio Requerido

### Respuesta Actual
```json
{
  "deck": {
    "id": 123,
    "name": "Mazo generado",
    "description": "...",
    "hero_name": "Spider-Man",
    "hero_id": 1,
    "aspect": "aggression",
    "cards": [...]
  },
  "message": "Mazo generado exitosamente"  // opcional
}
```

### Respuesta Esperada
```json
{
  "deck": {
    "id": 123,
    "name": "Mazo generado",
    "description": "...",
    "hero_name": "Spider-Man",
    "hero_id": 1,
    "aspect": "aggression",
    "cards": [...]
  },
  "message": "Mazo generado exitosamente",  // opcional
  "win_probability": 0.75  // NUEVO: opcional, valor entre 0 y 1 (0.75 = 75%)
}
```

## Especificaciones Técnicas

- **Campo**: `win_probability`
- **Tipo**: `float` o `number`
- **Rango**: `0.0` a `1.0` (donde `0.0` = 0% y `1.0` = 100%)
- **Obligatorio**: **NO** (opcional)
- **Descripción**: Porcentaje de probabilidad de que el mazo generado pueda vencer al villano seleccionado en la dificultad especificada

## Notas Importantes

1. **Campo Opcional**: Si el modelo de IA no puede calcular la probabilidad o no está disponible, simplemente no incluyas este campo en la respuesta. El frontend está preparado para funcionar sin él.

2. **Formato**: El valor debe estar entre 0 y 1 (formato decimal). El frontend lo multiplicará por 100 para mostrarlo como porcentaje.

3. **Contexto**: La probabilidad debe estar basada en:
   - El villano seleccionado (`villain_id`)
   - La dificultad seleccionada (`difficulty`: 'normal' o 'expert')
   - La composición del mazo generado

4. **Ejemplo de Valores**:
   - `0.50` = 50% de probabilidad
   - `0.75` = 75% de probabilidad
   - `0.95` = 95% de probabilidad

## Ejemplo de Implementación

Si ya tienes un modelo que calcula probabilidades de victoria, simplemente añade el campo a la respuesta:

```python
# Ejemplo en Python/FastAPI
return {
    "deck": generated_deck,
    "message": "Mazo generado exitosamente",
    "win_probability": calculated_probability  # float entre 0.0 y 1.0
}
```

## Estado del Frontend

✅ El frontend ya está preparado para recibir y mostrar este campo:
- Si `win_probability` está presente, se muestra en una tarjeta destacada con el porcentaje
- Si no está presente, simplemente no se muestra nada (no afecta la funcionalidad)

## Prioridad

**Baja/Media**: Este es un campo opcional que mejora la experiencia del usuario pero no es crítico para el funcionamiento básico de la generación de mazos.

