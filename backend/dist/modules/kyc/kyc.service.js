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
exports.submitKYC = submitKYC;
exports.confirmSSN = confirmSSN;
exports.getQuestions = getQuestions;
exports.verifyAnswers = verifyAnswers;
const kycRepo = __importStar(require("./kyc.repository"));
const gifts_service_1 = require("../gifts/gifts.service");
const event_bus_1 = require("../../shared/events/event-bus");
const http_errors_1 = require("../../shared/errors/http-errors");
const client_1 = require("@prisma/client");
const QUESTION_POOL = [
    { id: 'q1', question: 'Which of these cars have you owned?', options: ['Toyota Camry', 'Ford F-150', 'Honda Civic', 'BMW 3 Series', 'None of the above'] },
    { id: 'q2', question: 'In which city have you lived?', options: ['Austin', 'Denver', 'Nashville', 'Portland', 'None of the above'] },
    { id: 'q3', question: 'Which of these streets have you lived on?', options: ['Maple St', 'Oak Ave', 'Cedar Blvd', 'Pine Rd', 'None of the above'] },
    { id: 'q4', question: 'Which bank have you had an account with?', options: ['Chase', 'Wells Fargo', 'Bank of America', 'Citibank', 'None of the above'] },
    { id: 'q5', question: 'Which of these phone numbers has been associated with you?', options: ['(555) 123-4567', '(555) 987-6543', '(555) 246-8135', '(555) 369-2580', 'None of the above'] },
    { id: 'q6', question: 'Which employer have you worked for?', options: ['Acme Corp', 'TechStart Inc', 'Global Solutions', 'Metro Services', 'None of the above'] },
    { id: 'q7', question: 'Which of these zip codes have you lived in?', options: ['78701', '80202', '37201', '97201', 'None of the above'] },
    { id: 'q8', question: 'What type of loan have you had?', options: ['Auto loan', 'Student loan', 'Mortgage', 'Personal loan', 'None of the above'] },
    { id: 'q9', question: 'Which utility company have you had service with?', options: ['Austin Energy', 'Xcel Energy', 'NES', 'PGE', 'None of the above'] },
    { id: 'q10', question: 'Which insurance company have you had a policy with?', options: ['State Farm', 'Allstate', 'GEICO', 'Progressive', 'None of the above'] },
];
function shuffleArray(arr) {
    const copy = [...arr];
    for (let i = copy.length - 1; i > 0; i--) {
        const j = Math.floor(Math.random() * (i + 1));
        [copy[i], copy[j]] = [copy[j], copy[i]];
    }
    return copy;
}
async function submitKYC(dto) {
    const gift = await (0, gifts_service_1.getGiftByClaimToken)(dto.claimToken);
    const existing = await kycRepo.findKYCByGiftId(gift.id);
    if (existing)
        throw new http_errors_1.BadRequestError('KYC already submitted');
    const kyc = await kycRepo.createKYC({
        giftId: gift.id,
        fullName: dto.fullName,
        dob: dto.dob,
        ssnLast4: dto.ssnLast4,
        address: dto.address,
        city: dto.city,
        state: dto.state,
        zip: dto.zip,
    });
    await (0, gifts_service_1.transitionStatus)(gift.id, client_1.GiftStatus.KYC_SUBMITTED);
    return kyc;
}
async function confirmSSN(claimToken, ssnLast4) {
    const gift = await (0, gifts_service_1.getGiftByClaimToken)(claimToken);
    const kyc = await kycRepo.findKYCByGiftId(gift.id);
    if (!kyc)
        throw new http_errors_1.NotFoundError('KYC not found');
    if (kyc.ssnLast4 !== ssnLast4)
        throw new http_errors_1.BadRequestError('SSN does not match');
    return { confirmed: true };
}
function getQuestions() {
    return shuffleArray(QUESTION_POOL).slice(0, 3);
}
async function verifyAnswers(claimToken) {
    const gift = await (0, gifts_service_1.getGiftByClaimToken)(claimToken);
    const kyc = await kycRepo.findKYCByGiftId(gift.id);
    if (!kyc)
        throw new http_errors_1.NotFoundError('KYC not found');
    await kycRepo.verifyKYC(kyc.id);
    await (0, gifts_service_1.transitionStatus)(gift.id, client_1.GiftStatus.KYC_VERIFIED);
    event_bus_1.eventBus.emit(event_bus_1.EVENTS.KYC_VERIFIED, { giftId: gift.id, claimToken });
    return { verified: true };
}
//# sourceMappingURL=kyc.service.js.map