"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const express_1 = require("express");
const etfs_controller_1 = require("./etfs.controller");
const router = (0, express_1.Router)();
router.get('/', etfs_controller_1.getAllETFsHandler);
router.get('/categories', etfs_controller_1.getCategoriesHandler);
router.get('/:symbol', etfs_controller_1.getETFBySymbolHandler);
exports.default = router;
//# sourceMappingURL=etfs.routes.js.map