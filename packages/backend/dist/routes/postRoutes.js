"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const express_1 = require("express");
const postController_1 = __importDefault(require("../controllers/postController"));
const auth_1 = require("../middleware/auth");
const router = (0, express_1.Router)();
router.use(auth_1.authenticate);
router.use(auth_1.requireUser);
router.get('/', postController_1.default.getPosts.bind(postController_1.default));
router.post('/', postController_1.default.createPost.bind(postController_1.default));
router.put('/:id', postController_1.default.updatePost.bind(postController_1.default));
router.delete('/:id', postController_1.default.deletePost.bind(postController_1.default));
router.post('/:id/clone', postController_1.default.clonePost.bind(postController_1.default));
exports.default = router;
//# sourceMappingURL=postRoutes.js.map