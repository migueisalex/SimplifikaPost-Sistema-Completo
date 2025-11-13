"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.AIController = void 0;
const aiService_1 = __importDefault(require("../services/aiService"));
const usageService_1 = __importDefault(require("../services/usageService"));
class AIController {
    async generateText(req, res) {
        try {
            const userId = req.user.id;
            const { prompt, taskType } = req.body;
            if (!prompt) {
                res.status(400).json({ error: 'Prompt é obrigatório' });
                return;
            }
            // Verifica limite de uso de IA
            const limitCheck = await usageService_1.default.checkAiTextLimit(userId);
            if (!limitCheck.allowed) {
                res.status(402).json({ error: limitCheck.message });
                return;
            }
            // Gera o texto
            const text = await aiService_1.default.generateText(userId, prompt, taskType);
            // Incrementa contador de uso
            await usageService_1.default.incrementAiTextCount(userId);
            res.status(200).json({ text });
        }
        catch (error) {
            console.error('Erro ao gerar texto:', error);
            res.status(500).json({ error: error.message || 'Erro ao gerar texto' });
        }
    }
    async generateImage(req, res) {
        try {
            const userId = req.user.id;
            const { prompt } = req.body;
            if (!prompt) {
                res.status(400).json({ error: 'Prompt é obrigatório' });
                return;
            }
            // Verifica limite de uso de IA
            const limitCheck = await usageService_1.default.checkAiImageLimit(userId);
            if (!limitCheck.allowed) {
                res.status(402).json({ error: limitCheck.message });
                return;
            }
            // Gera a imagem
            const imageUrl = await aiService_1.default.generateImage(userId, prompt);
            // Incrementa contador de uso
            await usageService_1.default.incrementAiImageCount(userId);
            res.status(200).json({ imageUrl });
        }
        catch (error) {
            console.error('Erro ao gerar imagem:', error);
            res.status(500).json({ error: error.message || 'Erro ao gerar imagem' });
        }
    }
}
exports.AIController = AIController;
exports.default = new AIController();
//# sourceMappingURL=aiController.js.map