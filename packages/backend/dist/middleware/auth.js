"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.requireAdmin = exports.requireStaff = exports.requireUser = exports.authenticate = void 0;
const jwt_1 = require("../utils/jwt");
const prisma_1 = require("../../generated/prisma");
const authenticate = (req, res, next) => {
    try {
        const authHeader = req.headers.authorization;
        if (!authHeader || !authHeader.startsWith('Bearer ')) {
            res.status(401).json({ error: 'Token não fornecido' });
            return;
        }
        const token = authHeader.substring(7);
        const payload = (0, jwt_1.verifyToken)(token);
        if (payload.type === 'user') {
            req.user = {
                id: payload.id,
                email: payload.email,
                role: payload.role,
                status: payload.status,
            };
        }
        else if (payload.type === 'staff') {
            req.staff = {
                id: payload.id,
                email: payload.email,
                role: payload.role,
            };
        }
        next();
    }
    catch (error) {
        res.status(401).json({ error: 'Token inválido ou expirado' });
    }
};
exports.authenticate = authenticate;
const requireUser = (req, res, next) => {
    if (!req.user) {
        res.status(403).json({ error: 'Acesso negado. Usuário requerido.' });
        return;
    }
    // Verifica se o usuário está bloqueado
    if (req.user.status === prisma_1.UserStatus.Bloqueado) {
        // Permite apenas endpoints de pagamento
        if (!req.path.includes('/payment') && !req.path.includes('/subscription')) {
            res.status(403).json({
                error: 'Conta bloqueada. Por favor, regularize seu pagamento.',
                status: 'Bloqueado'
            });
            return;
        }
    }
    next();
};
exports.requireUser = requireUser;
const requireStaff = (req, res, next) => {
    if (!req.staff) {
        res.status(403).json({ error: 'Acesso negado. Permissão de equipe requerida.' });
        return;
    }
    next();
};
exports.requireStaff = requireStaff;
const requireAdmin = (req, res, next) => {
    if (!req.staff || req.staff.role !== 'admin') {
        res.status(403).json({ error: 'Acesso negado. Permissão de administrador requerida.' });
        return;
    }
    next();
};
exports.requireAdmin = requireAdmin;
//# sourceMappingURL=auth.js.map