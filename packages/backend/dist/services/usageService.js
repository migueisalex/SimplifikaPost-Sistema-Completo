"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.UsageService = void 0;
const database_1 = __importDefault(require("../config/database"));
const types_1 = require("../types");
const prisma_1 = require("../../generated/prisma");
class UsageService {
    getCurrentPeriod() {
        const now = new Date();
        return `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, '0')}`;
    }
    async getOrCreateUsageTracker(userId) {
        const period = this.getCurrentPeriod();
        let tracker = await database_1.default.usageTracker.findUnique({
            where: {
                userId_period: {
                    userId,
                    period,
                },
            },
        });
        if (!tracker) {
            tracker = await database_1.default.usageTracker.create({
                data: {
                    userId,
                    period,
                    postCount: 0,
                    aiTextCount: 0,
                    aiImageCount: 0,
                },
            });
        }
        return tracker;
    }
    async checkPostLimit(userId) {
        const user = await database_1.default.user.findUnique({
            where: { id: userId },
            include: { subscriptions: { orderBy: { createdAt: 'desc' }, take: 1 } },
        });
        if (!user) {
            return { allowed: false, message: 'Usuário não encontrado' };
        }
        // Se o status for Inadimplente ou Bloqueado, trata como Freemium
        const effectivePackageTier = user.status === prisma_1.UserStatus.Ativo && user.subscriptions[0]
            ? user.subscriptions[0].packageTier
            : 0;
        // Se o plano não for Freemium, permite
        if (effectivePackageTier !== 0) {
            return { allowed: true };
        }
        // Para Freemium, verifica limites
        const tracker = await this.getOrCreateUsageTracker(userId);
        const limits = types_1.PACKAGE_LIMITS[0];
        if (tracker.postCount >= limits.postCount) {
            return {
                allowed: false,
                message: `Limite de posts atingido (${limits.postCount}). Faça upgrade para continuar.`,
            };
        }
        return { allowed: true };
    }
    async checkAiTextLimit(userId) {
        const user = await database_1.default.user.findUnique({
            where: { id: userId },
            include: { subscriptions: { orderBy: { createdAt: 'desc' }, take: 1 } },
        });
        if (!user) {
            return { allowed: false, message: 'Usuário não encontrado' };
        }
        const effectivePackageTier = user.status === prisma_1.UserStatus.Ativo && user.subscriptions[0]
            ? user.subscriptions[0].packageTier
            : 0;
        if (effectivePackageTier !== 0) {
            return { allowed: true };
        }
        const tracker = await this.getOrCreateUsageTracker(userId);
        const limits = types_1.PACKAGE_LIMITS[0];
        if (tracker.aiTextCount >= limits.aiTextCount) {
            return {
                allowed: false,
                message: `Limite de geração de texto com IA atingido (${limits.aiTextCount}). Faça upgrade para continuar.`,
            };
        }
        return { allowed: true };
    }
    async checkAiImageLimit(userId) {
        const user = await database_1.default.user.findUnique({
            where: { id: userId },
            include: { subscriptions: { orderBy: { createdAt: 'desc' }, take: 1 } },
        });
        if (!user) {
            return { allowed: false, message: 'Usuário não encontrado' };
        }
        const effectivePackageTier = user.status === prisma_1.UserStatus.Ativo && user.subscriptions[0]
            ? user.subscriptions[0].packageTier
            : 0;
        if (effectivePackageTier !== 0) {
            return { allowed: true };
        }
        const tracker = await this.getOrCreateUsageTracker(userId);
        const limits = types_1.PACKAGE_LIMITS[0];
        if (tracker.aiImageCount >= limits.aiImageCount) {
            return {
                allowed: false,
                message: `Limite de geração de imagem com IA atingido (${limits.aiImageCount}). Faça upgrade para continuar.`,
            };
        }
        return { allowed: true };
    }
    async incrementPostCount(userId) {
        const period = this.getCurrentPeriod();
        await database_1.default.usageTracker.upsert({
            where: {
                userId_period: {
                    userId,
                    period,
                },
            },
            update: {
                postCount: { increment: 1 },
            },
            create: {
                userId,
                period,
                postCount: 1,
                aiTextCount: 0,
                aiImageCount: 0,
            },
        });
    }
    async incrementAiTextCount(userId) {
        const period = this.getCurrentPeriod();
        await database_1.default.usageTracker.upsert({
            where: {
                userId_period: {
                    userId,
                    period,
                },
            },
            update: {
                aiTextCount: { increment: 1 },
            },
            create: {
                userId,
                period,
                postCount: 0,
                aiTextCount: 1,
                aiImageCount: 0,
            },
        });
    }
    async incrementAiImageCount(userId) {
        const period = this.getCurrentPeriod();
        await database_1.default.usageTracker.upsert({
            where: {
                userId_period: {
                    userId,
                    period,
                },
            },
            update: {
                aiImageCount: { increment: 1 },
            },
            create: {
                userId,
                period,
                postCount: 0,
                aiTextCount: 0,
                aiImageCount: 1,
            },
        });
    }
    async resetMonthlyUsage() {
        // Este método será chamado pelo cron job no dia 1 de cada mês
        // Não precisa fazer nada, pois novos trackers são criados automaticamente
        console.log('Reset mensal de uso executado. Novos trackers serão criados conforme necessário.');
    }
}
exports.UsageService = UsageService;
exports.default = new UsageService();
//# sourceMappingURL=usageService.js.map