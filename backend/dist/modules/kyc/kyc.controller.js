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
exports.submitKYCHandler = submitKYCHandler;
exports.confirmSSNHandler = confirmSSNHandler;
exports.getQuestionsHandler = getQuestionsHandler;
exports.verifyAnswersHandler = verifyAnswersHandler;
const kycService = __importStar(require("./kyc.service"));
async function submitKYCHandler(req, res, next) {
    try {
        const result = await kycService.submitKYC(req.body);
        res.status(201).json(result);
    }
    catch (err) {
        next(err);
    }
}
async function confirmSSNHandler(req, res, next) {
    try {
        const result = await kycService.confirmSSN(req.body.claimToken, req.body.ssnLast4);
        res.json(result);
    }
    catch (err) {
        next(err);
    }
}
async function getQuestionsHandler(req, res, next) {
    try {
        const questions = kycService.getQuestions();
        res.json(questions);
    }
    catch (err) {
        next(err);
    }
}
async function verifyAnswersHandler(req, res, next) {
    try {
        const result = await kycService.verifyAnswers(req.body.claimToken);
        res.json(result);
    }
    catch (err) {
        next(err);
    }
}
//# sourceMappingURL=kyc.controller.js.map