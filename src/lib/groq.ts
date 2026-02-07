import Groq from 'groq-sdk'

const groqApiKey = import.meta.env.VITE_GROQ_API_KEY

if (!groqApiKey) {
  throw new Error('Falta la API key de Groq')
}

export const groq = new Groq({
  apiKey: groqApiKey,
  dangerouslyAllowBrowser: true // Permite usar desde el navegador
})

interface TrainerProfile {
  name: string
  specialty: string
  philosophy: string
  training_style: string
  intensity_preference: string
  volume_preference: string
  rest_time_preference: number
  favorite_exercises?: string[]
  avoided_exercises?: string[]
  typical_rep_ranges: string
}

interface WorkoutRequest {
  goal: string
  target_muscle_groups: string[]
  duration_minutes: number
  available_equipment: string[]
  experience_level: string
  special_requests?: string
}

export async function generateWorkout(
  trainer: TrainerProfile,
  request: WorkoutRequest,
  availableExercises: any[]
) {
  const exerciseList = availableExercises
    .map(ex => `- ${ex.name} (${ex.muscle_group}, ${ex.equipment}, ${ex.difficulty})`)
    .join('\n')

  const systemPrompt = `Eres ${trainer.name}, un entrenador personal especializado en ${trainer.specialty}.

TU FILOSOFÍA:
${trainer.philosophy}

TU ESTILO DE ENTRENAMIENTO:
${trainer.training_style}

PREFERENCIAS:
- Intensidad: ${trainer.intensity_preference}
- Volumen: ${trainer.volume_preference}
- Descansos típicos: ${trainer.rest_time_preference} segundos
- Rangos de reps típicos: ${trainer.typical_rep_ranges}
${trainer.favorite_exercises?.length ? `- Ejercicios favoritos: ${trainer.favorite_exercises.join(', ')}` : ''}
${trainer.avoided_exercises?.length ? `- Evitas: ${trainer.avoided_exercises.join(', ')}` : ''}

EJERCICIOS DISPONIBLES:
${exerciseList}

INSTRUCCIONES:
1. Crea un entrenamiento siguiendo TU estilo y filosofía únicos
2. Usa SOLO ejercicios de la lista disponible
3. Adapta el entrenamiento a la solicitud del usuario
4. Sé específico con series, repeticiones y descansos
5. Incluye tu razonamiento de por qué elegiste estos ejercicios

Responde SOLO en formato JSON con esta estructura:
{
  "workout_name": "Nombre descriptivo del entrenamiento",
  "warm_up": ["Ejercicio de calentamiento 1", "Ejercicio de calentamiento 2"],
  "exercises": [
    {
      "exercise_name": "Nombre del ejercicio (debe estar en la lista)",
      "sets": 4,
      "reps": "8-12",
      "rest_seconds": 90,
      "notes": "Notas técnicas o de ejecución",
      "intensity_technique": "drop set en última serie" (opcional)
    }
  ],
  "cool_down": ["Estiramiento 1", "Estiramiento 2"],
  "estimated_duration": 60,
  "trainer_notes": "Tus consejos profesionales para este entrenamiento",
  "reasoning": "Por qué elegiste esta estructura y estos ejercicios"
}`

  const userPrompt = `Crea un entrenamiento con estas especificaciones:

OBJETIVO: ${request.goal}
GRUPOS MUSCULARES: ${request.target_muscle_groups.join(', ')}
DURACIÓN DESEADA: ${request.duration_minutes} minutos
EQUIPO DISPONIBLE: ${request.available_equipment.join(', ')}
NIVEL DE EXPERIENCIA: ${request.experience_level}
${request.special_requests ? `PETICIONES ESPECIALES: ${request.special_requests}` : ''}

Crea el mejor entrenamiento según TU estilo único como ${trainer.name}.`

  try {
    const completion = await groq.chat.completions.create({
      messages: [
        { role: 'system', content: systemPrompt },
        { role: 'user', content: userPrompt }
      ],
      model: 'llama-3.3-70b-versatile', // Modelo potente y gratuito
      temperature: 0.7,
      max_tokens: 2000,
      response_format: { type: 'json_object' }
    })

    const response = completion.choices[0]?.message?.content
    
    if (!response) {
      throw new Error('No se recibió respuesta de la IA')
    }

    return JSON.parse(response)
  } catch (error) {
    console.error('Error al generar entrenamiento:', error)
    throw error
  }
}

// Función para generar consejos personalizados
export async function getTrainerAdvice(
  trainer: TrainerProfile,
  question: string
) {
  const systemPrompt = `Eres ${trainer.name}, un entrenador personal especializado en ${trainer.specialty}.

Tu filosofía: ${trainer.philosophy}
Tu estilo: ${trainer.training_style}

Responde preguntas sobre entrenamiento desde TU perspectiva única y experiencia.
Sé conciso pero útil. Máximo 150 palabras.`

  try {
    const completion = await groq.chat.completions.create({
      messages: [
        { role: 'system', content: systemPrompt },
        { role: 'user', content: question }
      ],
      model: 'llama-3.1-8b-instant', // Más rápido para respuestas cortas
      temperature: 0.8,
      max_tokens: 300
    })

    return completion.choices[0]?.message?.content || 'No pude generar una respuesta.'
  } catch (error) {
    console.error('Error:', error)
    throw error
  }
}