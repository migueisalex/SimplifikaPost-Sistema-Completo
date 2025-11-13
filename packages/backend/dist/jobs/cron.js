"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const node_cron_1 = __importDefault(require("node-cron"));
const database_1 = __importDefault(require("../config/database"));
const emailService_1 = __importDefault(require("../services/emailService"));
const s3Service_1 = __importDefault(require("../services/s3Service"));
const prisma_1 = require("../../generated/prisma");
class CronJobs {
    // Verifica usuários inadimplentes há mais de 30 dias e bloqueia
    async checkAndBlockDefaultedUsers() {
        console.log('[CRON] Verificando usuários inadimplentes...');
        try {
            const thirtyDaysAgo = new Date();
            thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30);
            // Busca usuários inadimplentes há mais de 30 dias
            const users = await database_1.default.user.findMany({
                where: {
                    status: prisma_1.UserStatus.Inadimplente,
                    updatedAt: {
                        lte: thirtyDaysAgo,
                    },
                },
            });
            for (const user of users) {
                // Bloqueia o usuário
                await database_1.default.user.update({
                    where: { id: user.id },
                    data: { status: prisma_1.UserStatus.Bloqueado },
                });
                // Envia email de notificação
                await emailService_1.default.sendAccountBlockedNotification(user.email);
                console.log(`[CRON] Usuário ${user.email} bloqueado por inadimplência`);
            }
            console.log(`[CRON] ${users.length} usuários bloqueados`);
        }
        catch (error) {
            console.error('[CRON] Erro ao bloquear usuários inadimplentes:', error);
        }
    }
    // Limpa posts antigos publicados há mais de 90 dias
    async cleanOldPublishedPosts() {
        console.log('[CRON] Limpando posts antigos...');
        try {
            const ninetyDaysAgo = new Date();
            ninetyDaysAgo.setDate(ninetyDaysAgo.getDate() - 90);
            // Busca posts antigos
            const oldPosts = await database_1.default.post.findMany({
                where: {
                    status: prisma_1.PostStatus.published,
                    scheduledAt: {
                        lte: ninetyDaysAgo,
                    },
                },
                include: {
                    mediaItems: true,
                },
            });
            for (const post of oldPosts) {
                // Deleta mídia do S3
                if (post.mediaItems.length > 0) {
                    const urls = post.mediaItems.map((item) => item.storageUrl);
                    await s3Service_1.default.deleteMultipleFiles(urls);
                }
                // Deleta o post
                await database_1.default.post.delete({
                    where: { id: post.id },
                });
            }
            console.log(`[CRON] ${oldPosts.length} posts antigos deletados`);
        }
        catch (error) {
            console.error('[CRON] Erro ao limpar posts antigos:', error);
        }
    }
    // Limpa posts inativos por downgrade há mais de 30 dias
    async cleanInactiveDowngradedPosts() {
        console.log('[CRON] Limpando posts inativos por downgrade...');
        try {
            const thirtyDaysAgo = new Date();
            thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30);
            // Busca posts inativos há mais de 30 dias
            const inactivePosts = await database_1.default.post.findMany({
                where: {
                    status: prisma_1.PostStatus.inativo_por_downgrade,
                    updatedAt: {
                        lte: thirtyDaysAgo,
                    },
                },
                include: {
                    mediaItems: true,
                },
            });
            for (const post of inactivePosts) {
                // Deleta mídia do S3
                if (post.mediaItems.length > 0) {
                    const urls = post.mediaItems.map((item) => item.storageUrl);
                    await s3Service_1.default.deleteMultipleFiles(urls);
                }
                // Deleta o post
                await database_1.default.post.delete({
                    where: { id: post.id },
                });
            }
            console.log(`[CRON] ${inactivePosts.length} posts inativos deletados`);
        }
        catch (error) {
            console.error('[CRON] Erro ao limpar posts inativos:', error);
        }
    }
    // Envia avisos de exclusão 7 dias antes
    async sendDeletionWarnings() {
        console.log('[CRON] Enviando avisos de exclusão...');
        try {
            const twentyThreeDaysAgo = new Date();
            twentyThreeDaysAgo.setDate(twentyThreeDaysAgo.getDate() - 23);
            const twentyFourDaysAgo = new Date();
            twentyFourDaysAgo.setDate(twentyFourDaysAgo.getDate() - 24);
            // Busca posts que serão deletados em 7 dias
            const posts = await database_1.default.post.findMany({
                where: {
                    status: prisma_1.PostStatus.inativo_por_downgrade,
                    updatedAt: {
                        gte: twentyFourDaysAgo,
                        lte: twentyThreeDaysAgo,
                    },
                },
                include: {
                    user: true,
                },
            });
            // Agrupa por usuário
            const userPosts = new Map();
            posts.forEach((post) => {
                const count = userPosts.get(post.userId) || 0;
                userPosts.set(post.userId, count + 1);
            });
            // Envia emails
            for (const [userId, count] of userPosts) {
                const user = posts.find((p) => p.userId === userId)?.user;
                if (user) {
                    await emailService_1.default.sendPostDeletionWarning(user.email, 7);
                }
            }
            console.log(`[CRON] Avisos enviados para ${userPosts.size} usuários`);
        }
        catch (error) {
            console.error('[CRON] Erro ao enviar avisos:', error);
        }
    }
    // Inicia todos os cron jobs
    start() {
        console.log('[CRON] Iniciando jobs agendados...');
        // Diariamente às 2h da manhã
        node_cron_1.default.schedule('0 2 * * *', async () => {
            console.log('[CRON] Executando jobs diários...');
            await this.checkAndBlockDefaultedUsers();
            await this.cleanOldPublishedPosts();
            await this.cleanInactiveDowngradedPosts();
            await this.sendDeletionWarnings();
        });
        console.log('[CRON] Jobs agendados iniciados com sucesso');
    }
}
exports.default = new CronJobs();
//# sourceMappingURL=cron.js.map