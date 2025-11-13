"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.SubscriptionController = void 0;
const database_1 = __importDefault(require("../config/database"));
const emailService_1 = __importDefault(require("../services/emailService"));
const prisma_1 = require("../../generated/prisma");
class SubscriptionController {
    async downgradeToFreemium(req, res) {
        try {
            const userId = req.user.id;
            // Busca assinatura atual
            const subscription = await database_1.default.subscription.findFirst({
                where: { userId },
                orderBy: { createdAt: 'desc' },
            });
            if (!subscription) {
                res.status(404).json({ error: 'Assinatura não encontrada' });
                return;
            }
            // Busca posts futuros agendados
            const scheduledPosts = await database_1.default.post.findMany({
                where: {
                    userId,
                    status: prisma_1.PostStatus.scheduled,
                },
                orderBy: { scheduledAt: 'asc' },
            });
            // Mantém os 5 primeiros, desativa os restantes
            const postsToKeep = scheduledPosts.slice(0, 5);
            const postsToDeactivate = scheduledPosts.slice(5);
            if (postsToDeactivate.length > 0) {
                await database_1.default.post.updateMany({
                    where: {
                        id: { in: postsToDeactivate.map((p) => p.id) },
                    },
                    data: {
                        status: prisma_1.PostStatus.inativo_por_downgrade,
                    },
                });
                // Envia email de notificação
                const user = await database_1.default.user.findUnique({ where: { id: userId } });
                if (user) {
                    await emailService_1.default.sendDowngradeNotification(user.email, postsToDeactivate.length);
                }
            }
            // Atualiza assinatura para Freemium
            await database_1.default.subscription.update({
                where: { id: subscription.id },
                data: {
                    packageTier: 0,
                    hasAiAddon: false,
                },
            });
            res.status(200).json({
                message: 'Downgrade realizado com sucesso',
                keptPosts: postsToKeep.length,
                deactivatedPosts: postsToDeactivate.length,
            });
        }
        catch (error) {
            console.error('Erro ao fazer downgrade:', error);
            res.status(500).json({ error: 'Erro ao fazer downgrade' });
        }
    }
    async getSubscription(req, res) {
        try {
            const userId = req.user.id;
            const subscription = await database_1.default.subscription.findFirst({
                where: { userId },
                orderBy: { createdAt: 'desc' },
            });
            if (!subscription) {
                res.status(404).json({ error: 'Assinatura não encontrada' });
                return;
            }
            res.status(200).json(subscription);
        }
        catch (error) {
            console.error('Erro ao buscar assinatura:', error);
            res.status(500).json({ error: 'Erro ao buscar assinatura' });
        }
    }
    async updateSubscription(req, res) {
        try {
            const userId = req.user.id;
            const { packageTier, hasAiAddon } = req.body;
            const subscription = await database_1.default.subscription.findFirst({
                where: { userId },
                orderBy: { createdAt: 'desc' },
            });
            if (!subscription) {
                res.status(404).json({ error: 'Assinatura não encontrada' });
                return;
            }
            const updated = await database_1.default.subscription.update({
                where: { id: subscription.id },
                data: {
                    packageTier,
                    hasAiAddon,
                },
            });
            res.status(200).json(updated);
        }
        catch (error) {
            console.error('Erro ao atualizar assinatura:', error);
            res.status(500).json({ error: 'Erro ao atualizar assinatura' });
        }
    }
}
exports.SubscriptionController = SubscriptionController;
exports.default = new SubscriptionController();
//# sourceMappingURL=subscriptionController.js.map