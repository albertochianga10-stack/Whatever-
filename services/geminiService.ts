
import { GoogleGenAI } from "@google/genai";

export class GeminiAutomationService {
  private ai: GoogleGenAI;

  constructor() {
    this.ai = new GoogleGenAI({ apiKey: process.env.API_KEY || '' });
  }

  async generateReply(instruction: string, history: { role: 'user' | 'model', text: string }[], userMessage: string): Promise<string> {
    try {
      const response = await this.ai.models.generateContent({
        model: 'gemini-3-flash-preview',
        contents: [
          ...history.map(h => ({ 
            role: h.role === 'user' ? 'user' : 'model', 
            parts: [{ text: h.text }] 
          })),
          { role: 'user', parts: [{ text: userMessage }] }
        ],
        config: {
          systemInstruction: `Você é um assistente virtual angolano altamente eficiente operando via WhatsApp. 
          Sua personalidade é baseada nesta instrução: "${instruction}". 
          Diretrizes:
          1. Use um português claro e profissional (padrão de Angola).
          2. Seja extremamente conciso (ideal para WhatsApp).
          3. Nunca diga que é uma inteligência artificial a menos que seja relevante para o serviço.
          4. Se o contexto permitir, seja caloroso conforme a cultura local.`,
          temperature: 0.7,
        },
      });

      return response.text || "De momento não consigo processar o seu pedido. Por favor, tente novamente.";
    } catch (error) {
      console.error("Gemini Automation Error:", error);
      return "Estamos com dificuldades técnicas. Por favor, contacte o suporte ou aguarde uns instantes.";
    }
  }
}

export const geminiService = new GeminiAutomationService();
