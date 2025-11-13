"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const express_1 = require("express");
const auth_1 = require("../middleware/auth");
const router = (0, express_1.Router)();
// Aplica o middleware de autenticação para todas as rotas de usuário
router.use(auth_1.authenticate);
router.use(auth_1.requireUser);
// Rota de teste protegida para obter informações do usuário logado
router.get('/me', (req, res) => {
    // O req.user é populado pelo middleware 'authenticate'
    if (req.user) {
        res.status(200).json({
            message: 'Autenticação bem-sucedida. Informações do usuário:',
            user: req.user,
        });
    }
    else {
        // Caso o requireUser falhe por algum motivo (embora não deva acontecer aqui)
        res.status(401).json({ error: 'Usuário não autenticado.' });
    }
});
exports.default = router;
//# sourceMappingURL=userRoutes.js.map