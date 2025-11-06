
import { GoogleGenAI, Type } from "@google/genai";
import type { TrainingParams, SimulationDataPoint, InitialPhysiology, TrainingAnalysis, OptimalTrainingAnalysis } from '../types';

// Helper to wrap API calls with consistent error handling for API key issues.
async function withApiKeyCheck<T>(apiCall: () => Promise<T>): Promise<T> {
  // FIX: Use process.env.API_KEY as per guidelines
  if (!process.env.API_KEY) {
    // FIX: Update error message to refer to the correct environment variable.
    throw new Error('API key is missing. The environment variable API_KEY is not configured.');
  }
  try {
    return await apiCall();
  } catch (error: any) {
    console.error("Error calling Gemini API:", error);
    if (error.message && (error.message.includes('API key not valid') || error.message.includes('permission to access') || error.message.includes('API_KEY_INVALID'))) {
      throw new Error('API key is invalid. The provided Gemini API key is not valid or has been revoked. Please check your Vercel configuration.');
    }
    throw error;
  }
}

export async function getTrainingAnalysis(
  params: TrainingParams,
  duration: number,
  finalStats: SimulationDataPoint
): Promise<TrainingAnalysis> {
  return withApiKeyCheck(async () => {
    // FIX: Use process.env.API_KEY as per guidelines
    const ai = new GoogleGenAI({ apiKey: process.env.API_KEY });
    const prompt = `
    Act as an expert sports biomechanics and physiology coach. A simulated athlete has the following initial physiology:
    - Age: ${params.initialPhysiology.age} years
    - Initial Body Weight: ${params.initialPhysiology.bodyWeight.toFixed(2)} kg
    - Initial Muscle Mass: ${params.initialPhysiology.muscleMassPercentage.toFixed(2)}%
    - Initial Body Fat: ${params.initialPhysiology.bodyFat.toFixed(2)}%
    - Initial Strength Index: ${params.initialPhysiology.strengthIndex.toFixed(2)} points
    - Initial Endurance Index: ${params.initialPhysiology.enduranceIndex.toFixed(2)} points
    - Initial Mobility Score: ${params.initialPhysiology.mobilityScore.toFixed(0)} points (0-100)

    They follow this training regimen:
    - Training: ${params.trainingHours} hours/day
    - Intensity: ${params.intensity}%
    - Diet Quality: ${params.diet}%
    - Sleep: ${params.sleepHours} hours/night

    After a simulation of ${duration} months, their projected final stats are:
    - Final Muscle Mass: ${finalStats.muscleMass.toFixed(2)} kg
    - Final VO2 Max: ${finalStats.vo2Max.toFixed(2)} ml/kg/min
    - Final Body Fat: ${finalStats.bodyFat.toFixed(2)}%
    - Final Strength Index: ${finalStats.strengthIndex.toFixed(2)} points
    - Final Endurance Index: ${finalStats.enduranceIndex.toFixed(2)} points

    Provide a concise analysis comparing the initial and final stats, based on the training plan.
    The content for each key should be in Markdown, but do not include the section titles (like "Overall Summary") in the markdown content itself.

    1.  **Overall Summary:** A brief overview of the athlete's projected development and potential.
    2.  **Plan Strengths:** Highlight what is working well in this training plan.
    3.  **Potential Risks & Improvements:** Identify potential issues and suggest specific, actionable recommendations.
  `;

    const response = await ai.models.generateContent({
      model: 'gemini-2.5-flash',
      contents: prompt,
      config: {
        responseMimeType: "application/json",
        responseSchema: {
          type: Type.OBJECT,
          properties: {
            summary: { 
              type: Type.STRING, 
              description: "A brief overview of the athlete's projected development and potential, considering their starting point and the effectiveness of the regimen. Formatted as Markdown." 
            },
            strengths: { 
              type: Type.STRING, 
              description: "Highlights of what is working well in this training plan given their initial physiology. Formatted as Markdown." 
            },
            risks: { 
              type: Type.STRING, 
              description: "Identification of potential issues like overtraining, undertraining, or nutritional gaps, with specific, actionable recommendations. Formatted as Markdown." 
            },
          }
        }
      }
    });
    try {
      return JSON.parse(response.text) as TrainingAnalysis;
    } catch (e) {
      console.error("Failed to parse Gemini JSON response:", response.text);
      throw new Error("Received an invalid response from the AI. Please try again.");
    }
  });
}

export async function getMovementAnalysis(movementDescription: string): Promise<string> {
  return withApiKeyCheck(async () => {
    // FIX: Use process.env.API_KEY as per guidelines
    const ai = new GoogleGenAI({ apiKey: process.env.API_KEY });
    const prompt = `
    Act as an expert biomechanist. Analyze the following athletic movement pattern described by a user.
    
    Movement Description: "${movementDescription}"
    
    Provide a detailed, structured analysis in Markdown format. The analysis should be easy for an athlete or coach to understand. Include the following sections:
    
    1.  **Biomechanical Breakdown:** Briefly explain the key phases and forces in the described movement.
    2.  **Performance Optimizations:** Identify specific inefficiencies in the described pattern. For each inefficiency, provide a clear, actionable correction to improve power, speed, or efficiency.
    3.  **Injury Risk Assessment:** Pinpoint parts of the movement that could lead to injury. Explain why they are risky (e.g., "heel striking can lead to shin splints and knee pain due to high impact forces") and suggest modifications to improve safety.
    
    Use headings, bold text, and bullet points for clarity. Do not use a title for the whole response.
  `;

    const response = await ai.models.generateContent({
      model: 'gemini-2.5-flash',
      contents: prompt,
    });
    return response.text;
  });
}

export async function getOptimalTrainingAnalysis(
  initialPhysiology: InitialPhysiology,
  optimalParams: TrainingParams,
  finalStats: SimulationDataPoint,
  duration: number
): Promise<OptimalTrainingAnalysis> {
  return withApiKeyCheck(async () => {
    // FIX: Use process.env.API_KEY as per guidelines
    const ai = new GoogleGenAI({ apiKey: process.env.API_KEY });
    const prompt = `
    Act as an elite sports performance coach providing AI-driven recommendations.
    
    An athlete's initial physiology is:
    - Age: ${initialPhysiology.age} years
    - Body Weight: ${initialPhysiology.bodyWeight.toFixed(2)} kg
    - Muscle Mass: ${initialPhysiology.muscleMassPercentage.toFixed(2)}%
    - Body Fat: ${initialPhysiology.bodyFat.toFixed(2)}%
    - Strength Index: ${initialPhysiology.strengthIndex.toFixed(2)} pts
    - Endurance Index: ${initialPhysiology.enduranceIndex.toFixed(2)} pts
    - Mobility Score: ${initialPhysiology.mobilityScore.toFixed(0)} pts

    Based on our analysis, the optimal training plan over ${duration} months is:
    - Training: ${optimalParams.trainingHours} hours/day
    - Intensity: ${optimalParams.intensity}%
    - Diet Quality: ${optimalParams.diet}%
    - Sleep: ${optimalParams.sleepHours} hours/night

    This optimal plan is projected to result in:
    - Final Muscle Mass: ${finalStats.muscleMass.toFixed(2)} kg
    - Final VO2 Max: ${finalStats.vo2Max.toFixed(2)} ml/kg/min
    - Final Body Fat: ${finalStats.bodyFat.toFixed(2)}%
    - Final Strength Index: ${finalStats.strengthIndex.toFixed(2)} pts
    - Final Endurance Index: ${finalStats.enduranceIndex.toFixed(2)} pts

    Provide a concise, encouraging, and actionable analysis. The content for each key should be in Markdown, but do not include the section titles (like "Why It Works for You") in the markdown content itself.

    1.  **Why It Works for You:** Explain the synergy between these parameters and why this specific combination is ideal for their initial physiology. For instance, "Given your current strength index, a high intensity of ${optimalParams.intensity}% is crucial for breaking through plateaus. This is supported by ${optimalParams.sleepHours} hours of sleep..."
    2.  **Projected Outcome:** Summarize the expected improvements in a positive and motivational tone.
  `;

    const response = await ai.models.generateContent({
      model: 'gemini-2.5-flash',
      contents: prompt,
      config: {
        responseMimeType: "application/json",
        responseSchema: {
          type: Type.OBJECT,
          properties: {
            whyItWorks: {
              type: Type.STRING,
              description: "An explanation of the synergy between the optimal parameters and why this combination is ideal for the athlete's initial physiology. Formatted as Markdown."
            },
            projectedOutcome: {
              type: Type.STRING,
              description: "A summary of the expected improvements in a positive and motivational tone. Formatted as Markdown."
            }
          }
        }
      }
    });
    try {
      return JSON.parse(response.text) as OptimalTrainingAnalysis;
    } catch (e) {
      console.error("Failed to parse Gemini JSON response:", response.text);
      throw new Error("Received an invalid response from the AI. Please try again.");
    }
  });
}
