"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.auditCriticalAction = exports.auditStaffLogin = void 0;
const database_1 = __importDefault(require("../config/database"));
const auditStaffLogin = async (req, res, next) => {
    if (req.staff) {
        try {
            const ipAddress = req.ip || req.socket.remoteAddress || 'unknown';
            await database_1.default.auditLog.create({
                data: {
                    staffMemberId: req.staff.id,
                    actionType: 'STAFF_LOGIN',
                    ipAddress,
                    details: {
                        email: req.staff.email,
                        role: req.staff.role,
                        timestamp: new Date().toISOString(),
                    },
                },
            });
        }
        catch (error) {
            console.error('Erro ao registrar auditoria de login:', error);
        }
    }
    next();
};
exports.auditStaffLogin = auditStaffLogin;
const auditCriticalAction = async (staffMemberId, actionType, targetUserId, before, after, ipAddress) => {
    try {
        await database_1.default.auditLog.create({
            data: {
                staffMemberId,
                actionType,
                targetUserId,
                ipAddress,
                details: {
                    before,
                    after,
                    timestamp: new Date().toISOString(),
                },
            },
        });
    }
    catch (error) {
        console.error('Erro ao registrar auditoria de ação crítica:', error);
    }
};
exports.auditCriticalAction = auditCriticalAction;
//# sourceMappingURL=audit.js.map