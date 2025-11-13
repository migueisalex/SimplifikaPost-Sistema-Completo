"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const nodemailer_1 = __importDefault(require("nodemailer"));
class EmailService {
    constructor() {
        // Configuração do transporter (exemplo com SMTP genérico)
        // Em produção, usar serviço como SendGrid, AWS SES, etc.
        this.transporter = nodemailer_1.default.createTransport({
            host: process.env.EMAIL_HOST || 'smtp.gmail.com',
            port: parseInt(process.env.EMAIL_PORT || '587'),
            secure: false,
            auth: {
                user: process.env.EMAIL_USER,
                pass: process.env.EMAIL_SERVICE_API_KEY,
            },
        });
    }
    async sendVerificationCode(email, code) {
        try {
            await this.transporter.sendMail({
                from: process.env.EMAIL_FROM || 'noreply@simplifikapost.com',
                to: email,
                subject: 'SimplifikaPost - Código de Verificação',
                html: `
          <h1>Bem-vindo ao SimplifikaPost!</h1>
          <p>Seu código de verificação é: <strong>${code}</strong></p>
          <p>Este código é válido por 15 minutos.</p>
        `,
            });
        }
        catch (error) {
            console.error('Erro ao enviar email de verificação:', error);
            throw error;
        }
    }
    async sendDowngradeNotification(email, deactivatedPostsCount) {
        try {
            await this.transporter.sendMail({
                from: process.env.EMAIL_FROM || 'noreply@simplifikapost.com',
                to: email,
                subject: 'SimplifikaPost - Notificação de Downgrade',
                html: `
          <h1>Downgrade de Plano Realizado</h1>
          <p>Seu plano foi alterado para Freemium.</p>
          <p><strong>${deactivatedPostsCount}</strong> posts agendados foram desativados.</p>
          <p>Os 5 primeiros posts agendados foram mantidos.</p>
          <p>Os posts desativados serão excluídos em 30 dias. Faça upgrade para recuperá-los.</p>
        `,
            });
        }
        catch (error) {
            console.error('Erro ao enviar email de downgrade:', error);
        }
    }
    async sendPostDeletionWarning(email, daysUntilDeletion) {
        try {
            await this.transporter.sendMail({
                from: process.env.EMAIL_FROM || 'noreply@simplifikapost.com',
                to: email,
                subject: 'SimplifikaPost - Aviso de Exclusão de Posts',
                html: `
          <h1>Aviso: Posts Serão Excluídos</h1>
          <p>Seus posts desativados serão excluídos permanentemente em <strong>${daysUntilDeletion} dias</strong>.</p>
          <p>Faça upgrade do seu plano para recuperá-los.</p>
        `,
            });
        }
        catch (error) {
            console.error('Erro ao enviar email de aviso:', error);
        }
    }
    async sendPaymentFailureNotification(email) {
        try {
            await this.transporter.sendMail({
                from: process.env.EMAIL_FROM || 'noreply@simplifikapost.com',
                to: email,
                subject: 'SimplifikaPost - Falha no Pagamento',
                html: `
          <h1>Falha no Pagamento Detectada</h1>
          <p>Não conseguimos processar seu pagamento.</p>
          <p>Sua conta foi temporariamente limitada ao plano Freemium.</p>
          <p>Você tem 30 dias para regularizar seu pagamento antes que sua conta seja bloqueada.</p>
          <p><a href="${process.env.FRONTEND_URL}/payment">Atualizar forma de pagamento</a></p>
        `,
            });
        }
        catch (error) {
            console.error('Erro ao enviar email de falha de pagamento:', error);
        }
    }
    async sendAccountBlockedNotification(email) {
        try {
            await this.transporter.sendMail({
                from: process.env.EMAIL_FROM || 'noreply@simplifikapost.com',
                to: email,
                subject: 'SimplifikaPost - Conta Bloqueada',
                html: `
          <h1>Sua Conta Foi Bloqueada</h1>
          <p>Sua conta foi bloqueada devido a inadimplência por mais de 30 dias.</p>
          <p>Para reativar sua conta, regularize seu pagamento.</p>
          <p><a href="${process.env.FRONTEND_URL}/payment">Regularizar Pagamento</a></p>
        `,
            });
        }
        catch (error) {
            console.error('Erro ao enviar email de bloqueio:', error);
        }
    }
}
exports.default = new EmailService();
//# sourceMappingURL=emailService.js.map