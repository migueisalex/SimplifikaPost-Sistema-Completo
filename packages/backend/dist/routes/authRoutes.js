"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const express_1 = require("express");
const authController_1 = __importDefault(require("../controllers/authController"));
const audit_1 = require("../middleware/audit");
const router = (0, express_1.Router)();
router.post('/register', authController_1.default.register.bind(authController_1.default));
router.post('/verify-email', authController_1.default.verifyEmail.bind(authController_1.default));
router.post('/login', authController_1.default.login.bind(authController_1.default), audit_1.auditStaffLogin);
exports.default = router;
//# sourceMappingURL=authRoutes.js.map