
import { GoogleGenAI, Type } from "@google/genai";
import { StudentStats, RiskAnalysis } from "../types";

// FIX: The use of import.meta.env.VITE_API_KEY caused a TypeScript error and violates the @google/genai guideline to exclusively use process.env.API_KEY.
const ai = new GoogleGenAI({ apiKey: process.env.API_KEY });

const STUDY_MATERIAL_CONTEXT = `
Topic: Introduction to Photosynthesis
Photosynthesis is a process used by plants and other organisms to convert light energy into chemical energy that, through cellular respiration, can later be released to fuel the organism's activities. This chemical energy is stored in carbohydrate molecules, such as sugars and starches, which are synthesized from carbon dioxide and water – hence the name photosynthesis.
The general equation for photosynthesis is: 6CO2 + 6H2O + Light Energy -> C6H12O6 + 6O2.
It occurs in two stages: the light-dependent reactions and the Calvin cycle (light-independent reactions).
In the light-dependent reactions, one molecule of the pigment chlorophyll absorbs one photon and loses one electron.
`;

export const getStudyBuddyResponse = async (
  history: { role: string; parts: { text: string }[] }[],
  message: string
): Promise<string> => {
  try {
    const model = 'gemini-2.5-flash';
    const chat = ai.chats.create({
      model,
      history,
      config: {
        systemInstruction: `You are an AI Study Buddy for students. You are helpful, encouraging, and clear. 
        Answer questions primarily based on the provided study material context below. 
        If the question is unrelated to the context, politely guide the student back to the topic or answer generally if it's a general education question.
        
        CONTEXT:
        ${STUDY_MATERIAL_CONTEXT}`,
      },
    });

    const result = await chat.sendMessage({ message });
    return result.text || "I'm sorry, I couldn't generate a response.";
  } catch (error) {
    console.error("Gemini Chat Error:", error);
    return "I'm having trouble connecting to the study servers right now. Please check your connection or API key.";
  }
};

export const analyzeStudentRisk = async (stats: StudentStats, recentGrades: number[]): Promise<RiskAnalysis> => {
  try {
    const model = 'gemini-2.5-flash';
    
    const prompt = `
      Analyze the following student performance data and determine if they are at risk of failing or dropping out.
      
      Data:
      Attendance Rate: ${stats.attendance}%
      Assignments Completed: ${stats.assignmentsCompleted}%
      Average Grade: ${stats.averageGrade}%
      Recent Test Scores: ${recentGrades.join(', ')}
      
      Return a JSON object with:
      - riskLevel: "LOW", "MEDIUM", or "HIGH"
      - reason: A short summary of why.
      - recommendations: A list of 3 actionable steps for the teacher/student.
    `;

    const response = await ai.models.generateContent({
      model,
      contents: prompt,
      config: {
        responseMimeType: "application/json",
        responseSchema: {
          type: Type.OBJECT,
          properties: {
            riskLevel: { type: Type.STRING },
            reason: { type: Type.STRING },
            recommendations: { 
              type: Type.ARRAY,
              items: { type: Type.STRING }
            }
          },
          required: ["riskLevel", "reason", "recommendations"]
        }
      }
    });

    const jsonText = response.text || "{}";
    return JSON.parse(jsonText) as RiskAnalysis;

  } catch (error) {
    console.error("Gemini Analysis Error:", error);
    return {
      riskLevel: 'MEDIUM',
      reason: "AI Analysis unavailable. Defaulting to medium caution.",
      recommendations: ["Review manual records", "Talk to student"]
    };
  }
};

/**
 * Generates a summary for a video class using the Gemini API.
 * @param videoKeyPoints A string representing the key points or a simulated transcript of the video.
 * @returns A promise that resolves to the generated summary string.
 */
export const generateVideoSummary = async (videoKeyPoints: string): Promise<string> => {
  try {
    const model = 'gemini-2.5-flash';
    const prompt = `Please provide a concise and informative summary of the following video content.
    The summary should capture the main topics and key takeaways, suitable for quick review by students.
    
    Video Content Key Points:
    ${videoKeyPoints}
    `;

    const response = await ai.models.generateContent({
      model,
      contents: prompt,
      config: {
        temperature: 0.7,
        maxOutputTokens: 200,
        // FIX: Per @google/genai guidelines, when setting maxOutputTokens, a thinkingBudget must be specified to prevent an empty response.
        thinkingConfig: { thinkingBudget: 100 },
      },
    });

    return response.text || "Could not generate a summary for this video.";
  } catch (error) {
    console.error("Gemini Video Summary Error:", error);
    return "Failed to generate summary due to an AI service error.";
  }
};
