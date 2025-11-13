"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const express_1 = require("express");
const subscriptionController_1 = __importDefault(require("../controllers/subscriptionController"));
const auth_1 = require("../middleware/auth");
const router = (0, express_1.Router)();
router.use(auth_1.authenticate);
router.use(auth_1.requireUser);
router.get('/', subscriptionController_1.default.getSubscription.bind(subscriptionController_1.default));
router.put('/', subscriptionController_1.default.updateSubscription.bind(subscriptionController_1.default));
router.post('/downgrade', subscriptionController_1.default.downgradeToFreemium.bind(subscriptionController_1.default));
exports.default = router;
//# sourceMappingURL=subscriptionRoutes.js.map