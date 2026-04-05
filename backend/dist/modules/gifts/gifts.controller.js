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
exports.createGiftHandler = createGiftHandler;
exports.listGiftsHandler = listGiftsHandler;
exports.getGiftHandler = getGiftHandler;
exports.getGiftByClaimTokenHandler = getGiftByClaimTokenHandler;
exports.startClaimingHandler = startClaimingHandler;
const giftsService = __importStar(require("./gifts.service"));
async function createGiftHandler(req, res, next) {
    try {
        const gift = await giftsService.createGift(req.user.id, req.body);
        res.status(201).json(gift);
    }
    catch (err) {
        next(err);
    }
}
async function listGiftsHandler(req, res, next) {
    try {
        const gifts = await giftsService.listGifts(req.user.id);
        res.json(gifts);
    }
    catch (err) {
        next(err);
    }
}
async function getGiftHandler(req, res, next) {
    try {
        const gift = await giftsService.getGift(req.params.id, req.user.id);
        res.json(gift);
    }
    catch (err) {
        next(err);
    }
}
async function getGiftByClaimTokenHandler(req, res, next) {
    try {
        const gift = await giftsService.getGiftByClaimToken(req.params.claimToken);
        res.json(gift);
    }
    catch (err) {
        next(err);
    }
}
async function startClaimingHandler(req, res, next) {
    try {
        const gift = await giftsService.startClaiming(req.params.claimToken);
        res.json(gift);
    }
    catch (err) {
        next(err);
    }
}
//# sourceMappingURL=gifts.controller.js.map