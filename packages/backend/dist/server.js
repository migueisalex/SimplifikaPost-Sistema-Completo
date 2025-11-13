"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const express_1 = __importDefault(require("express"));
const cors_1 = __importDefault(require("cors"));
const dotenv_1 = __importDefault(require("dotenv"));
const authRoutes_1 = __importDefault(require("./routes/authRoutes"));
const postRoutes_1 = __importDefault(require("./routes/postRoutes"));
const userRoutes_1 = __importDefault(require("./routes/userRoutes"));
const mediaRoutes_1 = __importDefault(require("./routes/mediaRoutes"));
const aiRoutes_1 = __importDefault(require("./routes/aiRoutes"));
const subscriptionRoutes_1 = __importDefault(require("./routes/subscriptionRoutes"));
const cron_1 = __importDefault(require("./jobs/cron"));
dotenv_1.default.config();
const app = (0, express_1.default)();
const port = process.env.PORT || 3001;
// Middlewares
// Configuração do CORS
const allowedOrigins = [
    'http://localhost:3000', // Para desenvolvimento local do Frontend
    'https://simplifikapost.com.br', // Domínio de produção do Frontend
    // Adicione outros domínios de produção/staging aqui
];
const corsOptions = {
    origin: (origin, callback) => {
        // Permite requisições sem 'origin' (como apps mobile ou curl)
        if (!origin)
            return callback(null, true);
        if (allowedOrigins.indexOf(origin) !== -1) {
            callback(null, true);
        }
        else {
            callback(new Error('Not allowed by CORS'), false);
        }
    },
    credentials: true, // Permite cookies e headers de autorização
};
app.use((0, cors_1.default)(corsOptions));
app.use(express_1.default.json());
app.use(express_1.default.urlencoded({ extended: true }));
// Rotas
app.get('/', (req, res) => {
    res.json({
        message: 'Bem-vindo à API do SimplifikaPost!',
        version: '1.1.0',
        endpoints: {
            auth: '/api/auth',
            posts: '/api/posts',
            media: '/api/media',
            ai: '/api/ai',
            subscriptions: '/api/subscriptions',
        },
    });
});
app.use('/api/auth', authRoutes_1.default);
app.use('/api/posts', postRoutes_1.default);
app.use('/api/media', mediaRoutes_1.default);
app.use('/api/ai', aiRoutes_1.default);
app.use('/api/subscriptions', subscriptionRoutes_1.default);
app.use('/api/users', userRoutes_1.default);
// Health check
app.get('/health', (req, res) => {
    res.status(200).json({ status: 'ok', timestamp: new Date().toISOString() });
});
// 404 handler
app.use((req, res) => {
    res.status(404).json({ error: 'Endpoint não encontrado' });
});
// Error handler
app.use((err, req, res, next) => {
    console.error('Erro não tratado:', err);
    res.status(500).json({ error: 'Erro interno do servidor' });
});
// Inicia o servidor
app.listen(port, () => {
    console.log(`🚀 Servidor rodando na porta ${port}`);
    console.log(`📍 URL: http://localhost:${port}`);
    console.log(`🔧 Ambiente: ${process.env.NODE_ENV || 'development'}`);
    // Inicia os cron jobs
    if (process.env.ENABLE_CRON !== 'false') {
        cron_1.default.start();
    }
});
exports.default = app;
//# sourceMappingURL=server.js.map