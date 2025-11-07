# 🤖 Análisis de IA para AIForge - Recomendación de Mazos

## 📊 **CONTEXTO DEL PROYECTO**

### **Datos que tenemos:**
1. **Mazos:**
   - Héroe (Spider-Man, Iron Man, etc.)
   - Aspecto (Agresión, Justicia, Liderazgo, Protección)
   - Cartas (40-50 cartas por mazo)
   - Usuario que lo creó

2. **Partidas jugadas:**
   - Mazo usado (`deck_id`)
   - Villano enfrentado (`villain_id`)
   - Dificultad (`normal` o `expert`)
   - Resultado (`win` o `loss`)
   - Fecha (`played_at`)

### **Objetivo de la IA:**
Recomendar mazos o cartas basándose en:
- ✅ Qué mazos funcionan bien contra qué villanos
- ✅ Qué aspectos tienen mejor tasa de victoria
- ✅ Qué cartas son más efectivas en ciertos matchups
- ✅ Predecir si un mazo tendrá éxito contra un villano específico

---

## 🎯 **OBJETIVOS ESPECÍFICOS (Elegir uno o varios)**

### **Opción 1: Recomendación de Mazos**
**"Dado un villano y dificultad, ¿qué mazos tienen mejor probabilidad de ganar?"**

**Input:**
- Villano seleccionado
- Dificultad (normal/expert)
- (Opcional) Héroe preferido

**Output:**
- Lista de mazos ordenados por probabilidad de victoria
- Tasa de victoria estimada para cada mazo

**Ejemplo:**
```
Usuario selecciona: "Rhino" + "Normal"
IA responde: 
  - Mazo "Spider-Man Agresión" → 75% probabilidad de victoria
  - Mazo "Iron Man Liderazgo" → 68% probabilidad de victoria
  - Mazo "Captain America Justicia" → 62% probabilidad de victoria
```

---

### **Opción 2: Recomendación de Cartas**
**"Dado un héroe, aspecto y villano, ¿qué cartas debería incluir en mi mazo?"**

**Input:**
- Héroe seleccionado
- Aspecto seleccionado
- Villano objetivo

**Output:**
- Lista de cartas recomendadas con prioridad
- Razón de la recomendación (ej: "Esta carta tiene 80% de tasa de victoria contra Rhino")

**Ejemplo:**
```
Usuario: Spider-Man + Agresión + Rhino
IA responde:
  - "Uppercut" (prioridad alta) → 85% de victorias en mazos con esta carta
  - "Relentless Assault" (prioridad media) → 72% de victorias
  - "Haymaker" (prioridad baja) → 65% de victorias
```

---

### **Opción 3: Predicción de Éxito**
**"¿Tendrá éxito este mazo contra este villano?"**

**Input:**
- Mazo completo (héroe + aspecto + cartas)
- Villano objetivo
- Dificultad

**Output:**
- Probabilidad de victoria (0-100%)
- Razones (ej: "Cartas similares tienen 75% de victoria contra este villano")

**Ejemplo:**
```
Usuario: Mazo con Spider-Man + Agresión + [lista de cartas] + Rhino + Normal
IA responde:
  - Probabilidad de victoria: 78%
  - Confianza: Media (basado en 15 partidas similares)
  - Razón: "Mazos similares con estas cartas tienen buena tasa contra Rhino"
```

---

## 🔧 **OPCIONES DE MACHINE LEARNING**

### **1. SVM (Máquina de Soporte Vectorial)** ⭐ Recomendado por tu tutor

**¿Qué es?**
- Algoritmo que encuentra la mejor "línea divisoria" entre victorias y derrotas
- Funciona bien con pocos datos
- Rápido y eficiente

**Ventajas:**
- ✅ Funciona bien con **pocos datos** (tu caso)
- ✅ Rápido de entrenar
- ✅ Fácil de entender
- ✅ No necesita mucha potencia de cómputo
- ✅ Bueno para clasificación binaria (win/loss)

**Desventajas:**
- ❌ No funciona bien con datos muy complejos
- ❌ Requiere preparar bien los datos (feature engineering)

**Cuándo usarlo:**
- Si tienes < 1000 partidas
- Si quieres algo simple y rápido
- Si tu objetivo es clasificación (ganar/perder)

**Librería en Python:**
```python
from sklearn.svm import SVC
# Viene incluido en scikit-learn (muy común)
```

---

### **2. Random Forest (Bosque Aleatorio)**

**¿Qué es?**
- Muchos "árboles de decisión" que votan juntos
- Cada árbol hace una predicción, y se toma la mayoría

**Ventajas:**
- ✅ Funciona bien con pocos datos
- ✅ Muy fácil de usar (pocos parámetros)
- ✅ Puede decir qué características son más importantes
- ✅ Maneja bien datos mixtos (números y categorías)

**Desventajas:**
- ❌ Puede sobreajustarse con datos muy pequeños
- ❌ Menos interpretable que SVM

**Cuándo usarlo:**
- Si quieres saber qué cartas son más importantes
- Si tienes datos mixtos (números y texto)
- Si quieres algo más moderno que SVM

**Librería en Python:**
```python
from sklearn.ensemble import RandomForestClassifier
# También viene en scikit-learn
```

---

### **3. Red Neuronal (Neural Network)**

**¿Qué es?**
- Sistema inspirado en el cerebro
- Capas de "neuronas" que aprenden patrones complejos

**Ventajas:**
- ✅ Puede aprender patrones muy complejos
- ✅ Muy "de moda" y potente
- ✅ Bueno para muchos tipos de datos

**Desventajas:**
- ❌ Necesita **muchos datos** (miles de partidas)
- ❌ Lento de entrenar
- ❌ Difícil de entender cómo funciona
- ❌ Puede sobreajustarse fácilmente con pocos datos

**Cuándo usarlo:**
- Si tienes > 5000 partidas
- Si quieres lo más moderno
- Si tienes tiempo y recursos

**Librerías en Python:**
```python
# Opción 1: TensorFlow/Keras (más complejo)
from tensorflow import keras

# Opción 2: scikit-learn (más simple)
from sklearn.neural_network import MLPClassifier
```

---

### **4. Regresión Logística**

**¿Qué es?**
- Versión simple de clasificación
- Encuentra la probabilidad de que algo ocurra

**Ventajas:**
- ✅ Muy simple y rápido
- ✅ Funciona con muy pocos datos
- ✅ Fácil de entender
- ✅ Bueno como punto de partida

**Desventajas:**
- ❌ Menos potente que otros métodos
- ❌ Asume relaciones lineales

**Cuándo usarlo:**
- Como primer intento (baseline)
- Si tienes muy pocos datos (< 100 partidas)
- Para comparar con otros métodos

**Librería en Python:**
```python
from sklearn.linear_model import LogisticRegression
# Viene en scikit-learn
```

---

## 📦 **INSTALACIÓN Y USO**

### **Todas las opciones usan Python con scikit-learn:**

```bash
# Instalar scikit-learn (incluye SVM, Random Forest, Regresión Logística)
pip install scikit-learn

# Si quieres redes neuronales más avanzadas:
pip install tensorflow  # O
pip install torch
```

### **Ejemplo básico de uso (SVM):**

```python
from sklearn.svm import SVC
from sklearn.model_selection import train_test_split
import pandas as pd

# 1. Cargar datos
# Datos de ejemplo: [hero_id, aspect, villain_id, difficulty, result]
data = [
    [1, 'aggression', 994808, 0, 1],  # hero_id=1, aspect=aggression, villain_id=994808, normal=0, win=1
    [1, 'aggression', 994808, 0, 1],
    [2, 'justice', 994808, 1, 0],  # expert=1, loss=0
    # ... más datos
]

# 2. Preparar datos
X = [[row[0], row[1], row[2], row[3]] for row in data]  # Características
y = [row[4] for row in data]  # Resultado (1=win, 0=loss)

# 3. Entrenar modelo
model = SVC(probability=True)
model.fit(X, y)

# 4. Predecir
prediction = model.predict_proba([[1, 'aggression', 994808, 0]])
# Devuelve: [[probabilidad_perder, probabilidad_ganar]]
```

---

## 🎯 **MI RECOMENDACIÓN**

### **Para empezar (con pocos datos):**

1. **Empezar con Regresión Logística** (baseline simple)
2. **Probar SVM** (recomendado por tu tutor)
3. **Comparar con Random Forest** (más moderno)

### **Estructura sugerida:**

```
backend/
  ml/
    models/
      deck_recommender.py  # Modelo principal
    training/
      train_model.py       # Script para entrenar
    predictions/
      predict.py           # Script para predecir
    data/
      prepare_data.py      # Preparar datos de la BD
```

### **Flujo:**

1. **Preparar datos:** Extraer partidas de la BD → CSV/DataFrame
2. **Entrenar modelo:** Usar scikit-learn para entrenar
3. **Guardar modelo:** Guardar modelo entrenado (pickle)
4. **API endpoint:** Crear endpoint `/api/recommendations` que use el modelo
5. **Frontend:** Mostrar recomendaciones en la UI

---

## ❓ **PREGUNTAS PARA DECIDIR**

1. **¿Cuántas partidas tienes actualmente?**
   - < 100 → Regresión Logística o SVM
   - 100-1000 → SVM o Random Forest
   - > 1000 → Cualquiera, incluso redes neuronales

2. **¿Qué quieres predecir exactamente?**
   - Probabilidad de victoria → Clasificación (SVM, Random Forest)
   - Qué cartas recomendar → Puede ser clasificación o ranking

3. **¿Cuánto tiempo tienes?**
   - Poco tiempo → SVM (rápido de implementar)
   - Más tiempo → Probar varios y comparar

---

## 🚀 **SIGUIENTE PASO**

**Recomiendo empezar con SVM** porque:
- ✅ Tu tutor lo sugiere
- ✅ Funciona bien con pocos datos
- ✅ Fácil de implementar
- ✅ Buen punto de partida

**¿Quieres que te ayude a:**
1. Definir exactamente qué quieres predecir?
2. Crear la estructura de archivos para ML?
3. Implementar un modelo básico de SVM?

