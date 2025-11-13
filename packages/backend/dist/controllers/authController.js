"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.AuthController = void 0;
const bcrypt_1 = __importDefault(require("bcrypt"));
const database_1 = __importDefault(require("../config/database"));
const jwt_1 = require("../utils/jwt");
const emailService_1 = __importDefault(require("../services/emailService"));
const prisma_1 = require("../../generated/prisma");
// Armazena códigos de verificação temporariamente (em produção, usar Redis)
const verificationCodes = new Map();
class AuthController {
    async register(req, res) {
        try {
            const { email, password, fullName, birthDate, subscriptionData, paymentData } = req.body;
            // Valida se o email já existe
            const existingUser = await database_1.default.user.findUnique({ where: { email } });
            if (existingUser) {
                res.status(400).json({ error: 'Email já cadastrado' });
                return;
            }
            // Hash da senha
            const passwordHash = await bcrypt_1.default.hash(password, 10);
            // Cria o usuário
            const user = await database_1.default.user.create({
                data: {
                    email,
                    passwordHash,
                    fullName,
                    birthDate: new Date(birthDate),
                    status: prisma_1.UserStatus.Ativo,
                },
            });
            // Cria a assinatura
            const subscription = await database_1.default.subscription.create({
                data: {
                    userId: user.id,
                    packageTier: subscriptionData?.packageTier || 0,
                    hasAiAddon: subscriptionData?.hasAiAddon || false,
                    status: prisma_1.SubscriptionStatus.Active,
                    currentPeriodEnd: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000), // 30 dias
                    paymentGatewaySubscriptionId: paymentData?.subscriptionId,
                },
            });
            // Gera código de verificação
            const code = '123456'; // Em produção, gerar código aleatório
            const expiresAt = new Date(Date.now() + 15 * 60 * 1000); // 15 minutos
            verificationCodes.set(email, { code, expiresAt });
            // Envia email de verificação
            await emailService_1.default.sendVerificationCode(email, code);
            res.status(201).json({
                message: 'Verification code sent.',
                userId: user.id,
            });
        }
        catch (error) {
            console.error('Erro no registro:', error);
            res.status(500).json({ error: 'Erro ao registrar usuário' });
        }
    }
    async verifyEmail(req, res) {
        try {
            const { email, code } = req.body;
            const storedData = verificationCodes.get(email);
            if (!storedData) {
                res.status(400).json({ error: 'Código não encontrado ou expirado' });
                return;
            }
            if (new Date() > storedData.expiresAt) {
                verificationCodes.delete(email);
                res.status(400).json({ error: 'Código expirado' });
                return;
            }
            if (storedData.code !== code) {
                res.status(400).json({ error: 'Código inválido' });
                return;
            }
            // Ativa o usuário
            const user = await database_1.default.user.findUnique({
                where: { email },
                include: { subscriptions: { orderBy: { createdAt: 'desc' }, take: 1 } },
            });
            if (!user) {
                res.status(404).json({ error: 'Usuário não encontrado' });
                return;
            }
            // Remove o código usado
            verificationCodes.delete(email);
            // Gera token
            const token = (0, jwt_1.generateToken)({
                id: user.id,
                email: user.email,
                role: user.role,
                status: user.status,
                type: 'user',
            });
            res.status(200).json({
                user: {
                    id: user.id,
                    email: user.email,
                    fullName: user.fullName,
                    role: user.role,
                    status: user.status,
                },
                token,
                subscription: user.subscriptions[0] || null,
            });
        }
        catch (error) {
            console.error('Erro na verificação:', error);
            res.status(500).json({ error: 'Erro ao verificar email' });
        }
    }
    async login(req, res) {
        try {
            const { email, password } = req.body;
            // Busca usuário
            let user = await database_1.default.user.findUnique({
                where: { email },
                include: { subscriptions: { orderBy: { createdAt: 'desc' }, take: 1 } },
            });
            // Se não encontrou como usuário, busca como staff
            if (!user) {
                const staff = await database_1.default.staffMember.findUnique({
                    where: { email },
                });
                if (!staff) {
                    res.status(401).json({ error: 'Credenciais inválidas' });
                    return;
                }
                // Verifica senha do staff
                const isValidPassword = await bcrypt_1.default.compare(password, staff.passwordHash);
                if (!isValidPassword) {
                    res.status(401).json({ error: 'Credenciais inválidas' });
                    return;
                }
                // Gera token para staff
                const token = (0, jwt_1.generateToken)({
                    id: staff.id,
                    email: staff.email,
                    role: staff.role,
                    type: 'staff',
                });
                res.status(200).json({
                    staff: {
                        id: staff.id,
                        email: staff.email,
                        role: staff.role,
                    },
                    token,
                });
                return;
            }
            // Verifica senha do usuário
            const isValidPassword = await bcrypt_1.default.compare(password, user.passwordHash);
            if (!isValidPassword) {
                res.status(401).json({ error: 'Credenciais inválidas' });
                return;
            }
            // Verifica status do usuário
            if (user.status === prisma_1.UserStatus.Bloqueado) {
                res.status(403).json({ error: 'Sua conta está bloqueada. Entre em contato com o suporte.' });
                return;
            }
            if (user.status === prisma_1.UserStatus.Inadimplente) {
                // Retorna token mas indica status
                const token = (0, jwt_1.generateToken)({
                    id: user.id,
                    email: user.email,
                    role: user.role,
                    status: user.status,
                    type: 'user',
                });
                res.status(200).json({
                    user: {
                        id: user.id,
                        email: user.email,
                        fullName: user.fullName,
                        role: user.role,
                        status: user.status,
                    },
                    token,
                    subscription: user.subscriptions[0] || null,
                    warning: 'Sua conta está inadimplente. Regularize seu pagamento.',
                });
                return;
            }
            // Login normal
            const token = (0, jwt_1.generateToken)({
                id: user.id,
                email: user.email,
                role: user.role,
                status: user.status,
                type: 'user',
            });
            res.status(200).json({
                user: {
                    id: user.id,
                    email: user.email,
                    fullName: user.fullName,
                    role: user.role,
                    status: user.status,
                },
                token,
                subscription: user.subscriptions[0] || null,
            });
        }
        catch (error) {
            console.error('Erro no login:', error);
            res.status(500).json({ error: 'Erro ao fazer login' });
        }
    }
}
exports.AuthController = AuthController;
exports.default = new AuthController();
//# sourceMappingURL=authController.js.map