"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.MediaController = void 0;
const s3Service_1 = __importDefault(require("../services/s3Service"));
class MediaController {
    async uploadMedia(req, res) {
        try {
            if (!req.file) {
                res.status(400).json({ error: 'Nenhum arquivo fornecido' });
                return;
            }
            // Faz upload para o S3
            const url = await s3Service_1.default.uploadFile(req.file);
            res.status(201).json({
                url,
                mimeType: req.file.mimetype,
            });
        }
        catch (error) {
            console.error('Erro ao fazer upload de mídia:', error);
            res.status(500).json({ error: 'Erro ao fazer upload de mídia' });
        }
    }
}
exports.MediaController = MediaController;
exports.default = new MediaController();
//# sourceMappingURL=mediaController.js.map