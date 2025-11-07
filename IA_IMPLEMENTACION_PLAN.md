# 🤖 Plan de Implementación de IA - Recomendación de Villanos

## 📍 **¿DÓNDE SE HACE CADA COSA?**

### **BACKEND (Python) - Aquí va TODO el ML:**
- ✅ **Entrenar el modelo SVM** (una vez, o periódicamente)
- ✅ **Guardar el modelo entrenado** (archivo .pkl)
- ✅ **Crear endpoint de API** que recibe datos del mazo y devuelve recomendaciones
- ✅ **Hacer las predicciones** cuando el frontend llama al endpoint

### **FRONTEND (React) - Solo muestra resultados:**
- ✅ **Llamar al endpoint** cuando el usuario llega a `ConfigureGamePage`
- ✅ **Mostrar recomendaciones** (villanos recomendados, villanos a evitar)
- ✅ **UI para elegir** si usar IA o no

---

## 🎯 **OBJETIVO: Opción 3 - Predicción de Éxito**

**"¿Tendrá éxito este mazo contra este villano?"**

**Input:**
- Héroe seleccionado (`hero_id`)
- Aspecto (`aspect`)
- Cartas del mazo (`cards[]`)
- Villano objetivo (`villain_id`)
- Dificultad (`difficulty`)

**Output:**
- Probabilidad de victoria (0-100%)
- Recomendación: "Recomendado", "Neutral", "No recomendado"
- Razón: "Mazos similares tienen X% de victoria contra este villano"

---

## 🏗️ **ARQUITECTURA**

### **BACKEND - Estructura de archivos:**

```
backend/
  ml/
    models/
      villain_recommender.py    # Clase del modelo SVM
      train_model.py            # Script para entrenar el modelo
    data/
      prepare_data.py           # Extraer datos de BD y prepararlos
    predictions/
      predict.py                # Función para hacer predicciones
    saved_models/
      villain_svm_model.pkl     # Modelo entrenado guardado
  api/
    routes/
      recommendations.py        # Endpoint: POST /api/recommendations/villain
  main.py                       # FastAPI principal
```

### **FLUJO COMPLETO:**

```
1. ENTRENAMIENTO (Backend - Python)
   ├─ Extraer partidas de BD
   ├─ Preparar datos (features)
   ├─ Entrenar modelo SVM
   └─ Guardar modelo (.pkl)

2. PREDICCIÓN (Backend - API Endpoint)
   ├─ Cargar modelo entrenado
   ├─ Recibir datos del mazo (hero_id, aspect, cards, villain_id, difficulty)
   ├─ Preparar features del mazo
   ├─ Predecir probabilidad de victoria
   └─ Devolver resultado (probabilidad, recomendación)

3. FRONTEND (React)
   ├─ Usuario llega a ConfigureGamePage
   ├─ Si eligió "Ayuda de IA":
   │   ├─ Enviar datos del mazo al endpoint
   │   ├─ Recibir recomendaciones
   │   └─ Mostrar: villanos recomendados, villanos a evitar
   └─ Usuario selecciona villano (con o sin recomendación)
```

---

## 🔧 **IMPLEMENTACIÓN PASO A PASO**

### **PASO 1: Backend - Preparar Datos**

**Archivo: `backend/ml/data/prepare_data.py`**

```python
import sqlite3
import pandas as pd
from typing import List, Dict

def get_game_data_from_db() -> pd.DataFrame:
    """
    Extrae datos de partidas de la base de datos
    """
    conn = sqlite3.connect('marvelcdb.db')
    
    query = """
    SELECT 
        gc.deck_id,
        gc.villain_id,
        gc.difficulty,
        gc.result,
        d.hero_id,
        d.aspect,
        d.cards
    FROM game_configurations gc
    JOIN decks d ON gc.deck_id = d.id
    """
    
    df = pd.read_sql_query(query, conn)
    conn.close()
    
    return df

def prepare_features(df: pd.DataFrame) -> pd.DataFrame:
    """
    Prepara features para el modelo:
    - hero_id (numérico)
    - aspect (codificado: aggression=0, justice=1, leadership=2, protection=3)
    - villain_id (numérico)
    - difficulty (normal=0, expert=1)
    - cards_features (vector de características de cartas)
    """
    # Codificar aspect
    aspect_map = {
        'aggression': 0,
        'justice': 1,
        'leadership': 2,
        'protection': 3
    }
    df['aspect_encoded'] = df['aspect'].map(aspect_map)
    
    # Codificar difficulty
    df['difficulty_encoded'] = df['difficulty'].map({'normal': 0, 'expert': 1})
    
    # Codificar result (win=1, loss=0)
    df['result_encoded'] = df['result'].map({'win': 1, 'loss': 0})
    
    # Extraer features de cartas (simplificado por ahora)
    # TODO: Extraer características de las cartas (cost, type, etc.)
    
    return df

def get_training_data() -> tuple:
    """
    Devuelve X (features) e y (target) para entrenar
    """
    df = get_game_data_from_db()
    df = prepare_features(df)
    
    # Features: hero_id, aspect_encoded, villain_id, difficulty_encoded
    X = df[['hero_id', 'aspect_encoded', 'villain_id', 'difficulty_encoded']].values
    y = df['result_encoded'].values
    
    return X, y
```

---

### **PASO 2: Backend - Entrenar Modelo**

**Archivo: `backend/ml/models/train_model.py`**

```python
from sklearn.svm import SVC
from sklearn.model_selection import train_test_split
import pickle
import os
from data.prepare_data import get_training_data

def train_villain_recommender():
    """
    Entrena el modelo SVM y lo guarda
    """
    print("📊 Cargando datos...")
    X, y = get_training_data()
    
    if len(X) < 10:
        print("⚠️  No hay suficientes datos para entrenar (mínimo 10 partidas)")
        return None
    
    print(f"✅ Datos cargados: {len(X)} partidas")
    
    # Dividir en entrenamiento y prueba (80/20)
    X_train, X_test, y_train, y_test = train_test_split(
        X, y, test_size=0.2, random_state=42
    )
    
    print("🤖 Entrenando modelo SVM...")
    model = SVC(probability=True, kernel='rbf', random_state=42)
    model.fit(X_train, y_train)
    
    # Evaluar
    train_score = model.score(X_train, y_train)
    test_score = model.score(X_test, y_test)
    
    print(f"✅ Precisión entrenamiento: {train_score:.2%}")
    print(f"✅ Precisión prueba: {test_score:.2%}")
    
    # Guardar modelo
    model_dir = 'ml/saved_models'
    os.makedirs(model_dir, exist_ok=True)
    model_path = os.path.join(model_dir, 'villain_svm_model.pkl')
    
    with open(model_path, 'wb') as f:
        pickle.dump(model, f)
    
    print(f"💾 Modelo guardado en: {model_path}")
    
    return model

if __name__ == '__main__':
    train_villain_recommender()
```

---

### **PASO 3: Backend - Endpoint de API**

**Archivo: `backend/api/routes/recommendations.py`**

```python
from fastapi import APIRouter, HTTPException, Header
from pydantic import BaseModel
from typing import List, Optional
import pickle
import os
import numpy as np

router = APIRouter()

# Cargar modelo al iniciar
MODEL_PATH = 'ml/saved_models/villain_svm_model.pkl'
model = None

def load_model():
    global model
    if model is None and os.path.exists(MODEL_PATH):
        with open(MODEL_PATH, 'rb') as f:
            model = pickle.load(f)
    return model

class DeckData(BaseModel):
    hero_id: int
    aspect: str  # 'aggression', 'justice', 'leadership', 'protection'
    cards: List[dict]  # Lista de cartas con card_id, quantity, etc.
    villain_id: Optional[int] = None  # Si se proporciona, predice para ese villano
    difficulty: Optional[str] = 'normal'  # 'normal' o 'expert'

class PredictionResponse(BaseModel):
    villain_id: int
    villain_name: str
    win_probability: float  # 0.0 a 1.0
    recommendation: str  # 'recommended', 'neutral', 'not_recommended'
    confidence: str  # 'high', 'medium', 'low'
    reason: str

@router.post("/recommendations/villain")
async def predict_villain_success(
    deck_data: DeckData,
    x_auth0_id: Optional[str] = Header(None, alias="X-Auth0-ID")
):
    """
    Predice la probabilidad de victoria de un mazo contra villanos
    
    Si se proporciona villain_id, predice solo para ese villano.
    Si no, predice para todos los villanos y devuelve recomendaciones.
    """
    model = load_model()
    
    if model is None:
        raise HTTPException(
            status_code=503,
            detail="Modelo de IA no disponible. Necesita ser entrenado primero."
        )
    
    # Codificar aspect
    aspect_map = {
        'aggression': 0,
        'justice': 1,
        'leadership': 2,
        'protection': 3
    }
    aspect_encoded = aspect_map.get(deck_data.aspect, 0)
    
    # Codificar difficulty
    difficulty_encoded = 0 if deck_data.difficulty == 'normal' else 1
    
    # Si se proporciona un villano específico
    if deck_data.villain_id:
        # Preparar features: [hero_id, aspect_encoded, villain_id, difficulty_encoded]
        features = np.array([[
            deck_data.hero_id,
            aspect_encoded,
            deck_data.villain_id,
            difficulty_encoded
        ]])
        
        # Predecir probabilidad
        win_prob = model.predict_proba(features)[0][1]  # Probabilidad de ganar
        
        # Determinar recomendación
        if win_prob >= 0.65:
            recommendation = 'recommended'
        elif win_prob >= 0.45:
            recommendation = 'neutral'
        else:
            recommendation = 'not_recommended'
        
        # Obtener nombre del villano (desde BD)
        villain_name = get_villain_name(deck_data.villain_id)
        
        return PredictionResponse(
            villain_id=deck_data.villain_id,
            villain_name=villain_name,
            win_probability=win_prob,
            recommendation=recommendation,
            confidence='medium',  # TODO: Calcular confianza real
            reason=f"Mazos similares tienen {win_prob:.0%} de probabilidad de victoria contra {villain_name}"
        )
    
    # Si no se proporciona villano, recomendar para todos
    else:
        # Obtener todos los villanos
        villains = get_all_villains()
        
        predictions = []
        for villain in villains:
            features = np.array([[
                deck_data.hero_id,
                aspect_encoded,
                villain['id'],
                difficulty_encoded
            ]])
            
            win_prob = model.predict_proba(features)[0][1]
            
            if win_prob >= 0.65:
                recommendation = 'recommended'
            elif win_prob >= 0.45:
                recommendation = 'neutral'
            else:
                recommendation = 'not_recommended'
            
            predictions.append(PredictionResponse(
                villain_id=villain['id'],
                villain_name=villain['name'],
                win_probability=win_prob,
                recommendation=recommendation,
                confidence='medium',
                reason=f"Mazos similares tienen {win_prob:.0%} de probabilidad de victoria"
            ))
        
        # Ordenar por probabilidad de victoria
        predictions.sort(key=lambda x: x.win_probability, reverse=True)
        
        return {"recommendations": predictions}

def get_villain_name(villain_id: int) -> str:
    # TODO: Obtener desde BD
    return "Villain Name"

def get_all_villains() -> List[dict]:
    # TODO: Obtener desde BD
    return []
```

---

### **PASO 4: Frontend - Modificar CreateDeckPage**

**Añadir opción "Con ayuda de IA"**

```typescript
// En CreateDeckPage.tsx
const [useAI, setUseAI] = useState(false)

// En el JSX, antes del botón "Continuar a Selección de Cartas":
<div className="mb-6">
  <label className="flex items-center space-x-2 cursor-pointer">
    <input
      type="checkbox"
      checked={useAI}
      onChange={(e) => setUseAI(e.target.checked)}
      className="w-4 h-4 text-accent-500"
    />
    <span className="text-sm font-medium text-gray-700">
      🤖 Usar ayuda de IA para recomendaciones
    </span>
  </label>
  <p className="text-xs text-gray-500 ml-6 mt-1">
    La IA te recomendará villanos basándose en tu mazo
  </p>
</div>

// Pasar useAI a ConfigureGamePage:
navigate('/configure-game', { 
  state: { 
    deckData: deckData,
    useAI: useAI  // ← Añadir esto
  } 
})
```

---

### **PASO 5: Frontend - Modificar ConfigureGamePage**

**Añadir llamada a API y mostrar recomendaciones**

```typescript
// En ConfigureGamePage.tsx
const [aiRecommendations, setAiRecommendations] = useState<any[]>([])
const [loadingAI, setLoadingAI] = useState(false)
const useAI = location.state?.useAI || false

// Cargar recomendaciones cuando se monta el componente
useEffect(() => {
  if (useAI && deckData) {
    loadAIRecommendations()
  }
}, [useAI, deckData])

const loadAIRecommendations = async () => {
  if (!user?.sub || !deckData) return
  
  setLoadingAI(true)
  try {
    const response = await apiService.getVillainRecommendations({
      hero_id: deckData.hero_id!,
      aspect: deckData.aspect!,
      cards: deckData.cards,
      difficulty: difficulty
    }, user.sub)
    
    setAiRecommendations(response.recommendations || [])
  } catch (error) {
    console.error('Error cargando recomendaciones IA:', error)
  } finally {
    setLoadingAI(false)
  }
}

// Mostrar recomendaciones en el selector de villano
{useAI && aiRecommendations.length > 0 && (
  <div className="mt-4 space-y-2">
    <h3 className="text-sm font-semibold text-gray-700">
      🤖 Recomendaciones de IA:
    </h3>
    {aiRecommendations.slice(0, 5).map((rec) => (
      <div
        key={rec.villain_id}
        className={`p-3 rounded-lg border ${
          rec.recommendation === 'recommended'
            ? 'bg-green-50 border-green-200'
            : rec.recommendation === 'not_recommended'
            ? 'bg-red-50 border-red-200'
            : 'bg-yellow-50 border-yellow-200'
        }`}
      >
        <div className="flex items-center justify-between">
          <span className="font-medium">{rec.villain_name}</span>
          <span className="text-sm">
            {rec.win_probability.toFixed(0)}% victoria
          </span>
        </div>
        <p className="text-xs text-gray-600 mt-1">{rec.reason}</p>
      </div>
    ))}
  </div>
)}
```

---

### **PASO 6: Frontend - Añadir método en api.ts**

```typescript
// En frontend/src/services/api.ts
async getVillainRecommendations(
  deckData: {
    hero_id: number
    aspect: string
    cards: DeckCard[]
    difficulty?: string
    villain_id?: number
  },
  auth0Id: string
): Promise<{
  recommendations?: Array<{
    villain_id: number
    villain_name: string
    win_probability: number
    recommendation: string
    confidence: string
    reason: string
  }>
}> {
  try {
    const response = await fetch(`${API_BASE_URL}/recommendations/villain`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'X-Auth0-ID': auth0Id,
      },
      body: JSON.stringify(deckData),
    })
    
    if (!response.ok) {
      throw new Error('Error al obtener recomendaciones de IA')
    }
    
    return await response.json()
  } catch (error) {
    console.error('Error fetching AI recommendations:', error)
    throw error
  }
}
```

---

## 📋 **CHECKLIST DE IMPLEMENTACIÓN**

### **Backend:**
- [ ] Crear estructura de carpetas `ml/`
- [ ] Implementar `prepare_data.py` (extraer datos de BD)
- [ ] Implementar `train_model.py` (entrenar SVM)
- [ ] Ejecutar entrenamiento inicial
- [ ] Crear endpoint `/api/recommendations/villain`
- [ ] Probar endpoint con datos de ejemplo

### **Frontend:**
- [ ] Añadir checkbox "Usar ayuda de IA" en `CreateDeckPage`
- [ ] Pasar `useAI` a `ConfigureGamePage`
- [ ] Añadir método `getVillainRecommendations` en `api.ts`
- [ ] Cargar recomendaciones en `ConfigureGamePage`
- [ ] Mostrar recomendaciones en UI
- [ ] Añadir indicador visual (recomendado/no recomendado)

---

## 🚀 **PRÓXIMOS PASOS**

1. **Empezar por el backend:**
   - Crear estructura de carpetas
   - Implementar extracción de datos
   - Entrenar modelo básico
   - Crear endpoint

2. **Luego frontend:**
   - Añadir opción de IA
   - Conectar con endpoint
   - Mostrar recomendaciones

¿Quieres que empecemos a implementar esto paso a paso?

