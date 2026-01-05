
import { GoogleGenAI } from "@google/genai";

export class GeminiAutomationService {
  private getApiKey(): string {
    try {
      return typeof process !== 'undefined' ? process.env.API_KEY || '' : '';
    } catch { return ''; }
  }

  async generateReply(instruction: string, history: { role: 'user' | 'model', text: string }[], userMessage: string): Promise<string> {
    const apiKey = this.getApiKey();
    if (!apiKey) return "Sistema de IA em manutenção. Chave de API ausente.";

    try {
      const ai = new GoogleGenAI({ apiKey });
      const response = await ai.models.generateContent({
        model: 'gemini-3-flash-preview',
        contents: [
          ...history.map(h => ({ 
            role: h.role, 
            parts: [{ text: h.text }] 
          })),
          { role: 'user', parts: [{ text: userMessage }] }
        ],
        config: {
          systemInstruction: `Você é um atendente angolano profissional. 
          Instrução do Agente: "${instruction}". 
          REGRAS:
          1. Português de Angola (formal/educado).
          2. Seja muito conciso, ideal para leitura rápida no WhatsApp.
          3. Se o cliente pedir dados de pagamento e eles estiverem no contexto, forneça-os claramente.
          4. Nunca use emojis excessivos.`,
          temperature: 0.6,
        },
      });

      return response.text || "Não consegui processar agora.";
    } catch (error) {
      console.error("Gemini Error:", error);
      return "Estou a processar muitas mensagens. Por favor, aguarde um momento.";
    }
  }
}

export const geminiService = new GeminiAutomationService();
