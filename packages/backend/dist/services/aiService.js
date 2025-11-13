"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.AIService = void 0;
const generative_ai_1 = require("@google/generative-ai");
const database_1 = __importDefault(require("../config/database"));
const encryption_1 = require("../utils/encryption");
class AIService {
    getGeminiClient(apiKey) {
        return new generative_ai_1.GoogleGenerativeAI(apiKey);
    }
    async generateText(userId, prompt, taskType) {
        try {
            // Busca o usuário e sua assinatura
            const user = await database_1.default.user.findUnique({
                where: { id: userId },
                include: { subscriptions: { orderBy: { createdAt: 'desc' }, take: 1 } },
            });
            if (!user) {
                throw new Error('Usuário não encontrado');
            }
            // Determina qual chave de API usar
            let apiKey;
            // Se o usuário tem plano Pro (packageTier >= 2) e tem chave própria cadastrada
            const subscription = user.subscriptions[0];
            if (subscription && subscription.packageTier >= 2 && user.geminiApiKey) {
                // Usa a chave do usuário (descriptografada)
                apiKey = (0, encryption_1.decrypt)(user.geminiApiKey);
            }
            else {
                // Usa a chave do sistema
                apiKey = process.env.GEMINI_API_KEY || '';
                if (!apiKey) {
                    throw new Error('Chave de API do Gemini não configurada');
                }
            }
            // Inicializa o cliente Gemini
            const genAI = this.getGeminiClient(apiKey);
            const model = genAI.getGenerativeModel({ model: 'gemini-pro' });
            // Adiciona contexto ao prompt baseado no tipo de tarefa
            let enhancedPrompt = prompt;
            if (taskType === 'social_post') {
                enhancedPrompt = `Como especialista em marketing de redes sociais, ${prompt}`;
            }
            else if (taskType === 'hashtags') {
                enhancedPrompt = `Gere hashtags relevantes e populares para: ${prompt}`;
            }
            // Gera o texto
            const result = await model.generateContent(enhancedPrompt);
            const response = await result.response;
            const text = response.text();
            return text;
        }
        catch (error) {
            console.error('Erro ao gerar texto com IA:', error);
            throw new Error(`Erro ao gerar texto: ${error.message}`);
        }
    }
    async generateImage(userId, prompt) {
        // Nota: O Gemini não gera imagens diretamente
        // Esta função seria implementada com outra API (DALL-E, Stable Diffusion, etc.)
        throw new Error('Geração de imagens não implementada ainda');
    }
}
exports.AIService = AIService;
exports.default = new AIService();
//# sourceMappingURL=aiService.js.map