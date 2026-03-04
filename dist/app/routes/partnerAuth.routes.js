"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const express_1 = require("express");
const partnerAuth_controller_1 = require("../../controllers/partnerAuth.controller");
const router = (0, express_1.Router)();
router.post('/login', (req, res, next) => partnerAuth_controller_1.partnerAuthController.login(req, res, next));
exports.default = router;
