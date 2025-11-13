"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.S3Service = void 0;
const client_s3_1 = require("@aws-sdk/client-s3");
const uuid_1 = require("uuid");
const path_1 = __importDefault(require("path"));
const s3Client = new client_s3_1.S3Client({
    region: process.env.S3_REGION || 'us-east-1',
    endpoint: process.env.S3_ENDPOINT_URL,
    credentials: {
        accessKeyId: process.env.S3_ACCESS_KEY_ID || '',
        secretAccessKey: process.env.S3_SECRET_ACCESS_KEY || '',
    },
    forcePathStyle: true, // Necessário para alguns provedores S3-compatíveis
});
const BUCKET_NAME = process.env.S3_BUCKET_NAME || 'simplifikapost';
class S3Service {
    async uploadFile(file) {
        const fileExtension = path_1.default.extname(file.originalname);
        const fileName = `${(0, uuid_1.v4)()}${fileExtension}`;
        const key = `media/${fileName}`;
        const command = new client_s3_1.PutObjectCommand({
            Bucket: BUCKET_NAME,
            Key: key,
            Body: file.buffer,
            ContentType: file.mimetype,
            ACL: 'public-read',
        });
        await s3Client.send(command);
        // Retorna a URL pública do arquivo
        const baseUrl = process.env.S3_ENDPOINT_URL || `https://${BUCKET_NAME}.s3.amazonaws.com`;
        return `${baseUrl}/${key}`;
    }
    async deleteFile(url) {
        try {
            // Extrai a chave do arquivo da URL
            const urlObj = new URL(url);
            const key = urlObj.pathname.substring(1); // Remove a barra inicial
            const command = new client_s3_1.DeleteObjectCommand({
                Bucket: BUCKET_NAME,
                Key: key,
            });
            await s3Client.send(command);
        }
        catch (error) {
            console.error('Erro ao deletar arquivo do S3:', error);
            throw error;
        }
    }
    async deleteMultipleFiles(urls) {
        const deletePromises = urls.map(url => this.deleteFile(url));
        await Promise.allSettled(deletePromises);
    }
}
exports.S3Service = S3Service;
exports.default = new S3Service();
//# sourceMappingURL=s3Service.js.map