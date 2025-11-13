"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const express_1 = require("express");
const aiController_1 = __importDefault(require("../controllers/aiController"));
const auth_1 = require("../middleware/auth");
const router = (0, express_1.Router)();
router.use(auth_1.authenticate);
router.use(auth_1.requireUser);
router.post('/generate-text', aiController_1.default.generateText.bind(aiController_1.default));
router.post('/generate-image', aiController_1.default.generateImage.bind(aiController_1.default));
exports.default = router;
//# sourceMappingURL=aiRoutes.js.map