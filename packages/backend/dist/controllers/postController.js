"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.PostController = void 0;
const database_1 = __importDefault(require("../config/database"));
const usageService_1 = __importDefault(require("../services/usageService"));
const s3Service_1 = __importDefault(require("../services/s3Service"));
const prisma_1 = require("../../generated/prisma");
class PostController {
    async getPosts(req, res) {
        try {
            const userId = req.user.id;
            const { status, limit, offset } = req.query;
            const where = { userId };
            if (status) {
                where.status = status;
            }
            const posts = await database_1.default.post.findMany({
                where,
                include: {
                    mediaItems: true,
                },
                orderBy: { scheduledAt: 'desc' },
                take: limit ? parseInt(limit) : undefined,
                skip: offset ? parseInt(offset) : undefined,
            });
            res.status(200).json(posts);
        }
        catch (error) {
            console.error('Erro ao buscar posts:', error);
            res.status(500).json({ error: 'Erro ao buscar posts' });
        }
    }
    async createPost(req, res) {
        try {
            const userId = req.user.id;
            const { content, platforms, scheduledAt, postType, media } = req.body;
            // Verifica limite de posts
            const limitCheck = await usageService_1.default.checkPostLimit(userId);
            if (!limitCheck.allowed) {
                res.status(402).json({ error: limitCheck.message });
                return;
            }
            // Cria o post
            const post = await database_1.default.post.create({
                data: {
                    userId,
                    content,
                    platforms,
                    scheduledAt: new Date(scheduledAt),
                    postType: postType,
                    status: prisma_1.PostStatus.scheduled,
                },
            });
            // Adiciona itens de mídia se fornecidos
            if (media && media.length > 0) {
                await database_1.default.mediaItem.createMany({
                    data: media.map((item) => ({
                        postId: post.id,
                        storageUrl: item.storageUrl,
                        mimeType: item.mimeType,
                        aspectRatio: item.aspectRatio,
                        edits: item.edits,
                    })),
                });
            }
            // Incrementa contador de uso
            await usageService_1.default.incrementPostCount(userId);
            // Busca o post completo com mídia
            const fullPost = await database_1.default.post.findUnique({
                where: { id: post.id },
                include: { mediaItems: true },
            });
            res.status(201).json(fullPost);
        }
        catch (error) {
            console.error('Erro ao criar post:', error);
            res.status(500).json({ error: 'Erro ao criar post' });
        }
    }
    async updatePost(req, res) {
        try {
            const userId = req.user.id;
            const { id } = req.params;
            const { content, platforms, scheduledAt, postType, media } = req.body;
            // Verifica se o post pertence ao usuário
            const existingPost = await database_1.default.post.findFirst({
                where: { id, userId },
            });
            if (!existingPost) {
                res.status(404).json({ error: 'Post não encontrado' });
                return;
            }
            // Atualiza o post
            const post = await database_1.default.post.update({
                where: { id },
                data: {
                    content,
                    platforms,
                    scheduledAt: scheduledAt ? new Date(scheduledAt) : undefined,
                    postType: postType,
                },
            });
            // Atualiza mídia se fornecida
            if (media) {
                // Remove mídia antiga
                await database_1.default.mediaItem.deleteMany({
                    where: { postId: id },
                });
                // Adiciona nova mídia
                if (media.length > 0) {
                    await database_1.default.mediaItem.createMany({
                        data: media.map((item) => ({
                            postId: post.id,
                            storageUrl: item.storageUrl,
                            mimeType: item.mimeType,
                            aspectRatio: item.aspectRatio,
                            edits: item.edits,
                        })),
                    });
                }
            }
            // Busca o post completo
            const fullPost = await database_1.default.post.findUnique({
                where: { id },
                include: { mediaItems: true },
            });
            res.status(200).json(fullPost);
        }
        catch (error) {
            console.error('Erro ao atualizar post:', error);
            res.status(500).json({ error: 'Erro ao atualizar post' });
        }
    }
    async deletePost(req, res) {
        try {
            const userId = req.user.id;
            const { id } = req.params;
            // Busca o post com mídia
            const post = await database_1.default.post.findFirst({
                where: { id, userId },
                include: { mediaItems: true },
            });
            if (!post) {
                res.status(404).json({ error: 'Post não encontrado' });
                return;
            }
            // Deleta arquivos de mídia do S3
            if (post.mediaItems.length > 0) {
                const urls = post.mediaItems.map(item => item.storageUrl);
                await s3Service_1.default.deleteMultipleFiles(urls);
            }
            // Deleta o post (cascade deleta os mediaItems)
            await database_1.default.post.delete({
                where: { id },
            });
            res.status(204).send();
        }
        catch (error) {
            console.error('Erro ao deletar post:', error);
            res.status(500).json({ error: 'Erro ao deletar post' });
        }
    }
    async clonePost(req, res) {
        try {
            const userId = req.user.id;
            const { id } = req.params;
            // Verifica limite de posts
            const limitCheck = await usageService_1.default.checkPostLimit(userId);
            if (!limitCheck.allowed) {
                res.status(402).json({ error: limitCheck.message });
                return;
            }
            // Busca o post original
            const originalPost = await database_1.default.post.findFirst({
                where: { id, userId },
                include: { mediaItems: true },
            });
            if (!originalPost) {
                res.status(404).json({ error: 'Post não encontrado' });
                return;
            }
            // Cria o clone
            const newPost = await database_1.default.post.create({
                data: {
                    userId,
                    content: originalPost.content,
                    platforms: originalPost.platforms,
                    scheduledAt: new Date(), // Agenda para agora
                    postType: originalPost.postType,
                    status: prisma_1.PostStatus.scheduled,
                },
            });
            // Clona os itens de mídia
            if (originalPost.mediaItems.length > 0) {
                await database_1.default.mediaItem.createMany({
                    data: originalPost.mediaItems.map((item) => ({
                        postId: newPost.id,
                        storageUrl: item.storageUrl,
                        mimeType: item.mimeType,
                        aspectRatio: item.aspectRatio,
                        edits: item.edits,
                    })),
                });
            }
            // Incrementa contador de uso
            await usageService_1.default.incrementPostCount(userId);
            // Busca o post completo
            const fullPost = await database_1.default.post.findUnique({
                where: { id: newPost.id },
                include: { mediaItems: true },
            });
            res.status(201).json({ newPost: fullPost });
        }
        catch (error) {
            console.error('Erro ao clonar post:', error);
            res.status(500).json({ error: 'Erro ao clonar post' });
        }
    }
}
exports.PostController = PostController;
exports.default = new PostController();
//# sourceMappingURL=postController.js.map