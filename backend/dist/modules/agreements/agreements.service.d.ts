import type { SignAgreementDto } from './agreements.types';
export declare function signAgreement(dto: SignAgreementDto): Promise<{
    id: string;
    giftId: string;
    signatureBase64: string;
    agreedToTerms: boolean;
    signedAt: Date;
}>;
//# sourceMappingURL=agreements.service.d.ts.map