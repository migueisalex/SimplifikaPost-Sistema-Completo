"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const express_1 = require("express");
const multer_1 = __importDefault(require("multer"));
const mediaController_1 = __importDefault(require("../controllers/mediaController"));
const auth_1 = require("../middleware/auth");
const router = (0, express_1.Router)();
const upload = (0, multer_1.default)({
    storage: multer_1.default.memoryStorage(),
    limits: {
        fileSize: 50 * 1024 * 1024, // 50MB
    },
});
router.use(auth_1.authenticate);
router.use(auth_1.requireUser);
router.post('/upload', upload.single('file'), mediaController_1.default.uploadMedia.bind(mediaController_1.default));
exports.default = router;
//# sourceMappingURL=mediaRoutes.js.map