"use strict";
var __createBinding = (this && this.__createBinding) || (Object.create ? (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    var desc = Object.getOwnPropertyDescriptor(m, k);
    if (!desc || ("get" in desc ? !m.__esModule : desc.writable || desc.configurable)) {
      desc = { enumerable: true, get: function() { return m[k]; } };
    }
    Object.defineProperty(o, k2, desc);
}) : (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    o[k2] = m[k];
}));
var __setModuleDefault = (this && this.__setModuleDefault) || (Object.create ? (function(o, v) {
    Object.defineProperty(o, "default", { enumerable: true, value: v });
}) : function(o, v) {
    o["default"] = v;
});
var __importStar = (this && this.__importStar) || (function () {
    var ownKeys = function(o) {
        ownKeys = Object.getOwnPropertyNames || function (o) {
            var ar = [];
            for (var k in o) if (Object.prototype.hasOwnProperty.call(o, k)) ar[ar.length] = k;
            return ar;
        };
        return ownKeys(o);
    };
    return function (mod) {
        if (mod && mod.__esModule) return mod;
        var result = {};
        if (mod != null) for (var k = ownKeys(mod), i = 0; i < k.length; i++) if (k[i] !== "default") __createBinding(result, mod, k[i]);
        __setModuleDefault(result, mod);
        return result;
    };
})();
Object.defineProperty(exports, "__esModule", { value: true });
exports.getAllETFsHandler = getAllETFsHandler;
exports.getCategoriesHandler = getCategoriesHandler;
exports.getETFBySymbolHandler = getETFBySymbolHandler;
const etfsService = __importStar(require("./etfs.service"));
const http_errors_1 = require("../../shared/errors/http-errors");
function getAllETFsHandler(req, res, next) {
    try {
        res.json(etfsService.getAllETFs());
    }
    catch (err) {
        next(err);
    }
}
function getCategoriesHandler(req, res, next) {
    try {
        res.json(etfsService.getCategories());
    }
    catch (err) {
        next(err);
    }
}
function getETFBySymbolHandler(req, res, next) {
    try {
        const etf = etfsService.getETFBySymbol(req.params.symbol);
        if (!etf)
            throw new http_errors_1.NotFoundError('ETF not found');
        res.json(etf);
    }
    catch (err) {
        next(err);
    }
}
//# sourceMappingURL=etfs.controller.js.map