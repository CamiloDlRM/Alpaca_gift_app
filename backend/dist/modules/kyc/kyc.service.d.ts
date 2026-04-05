import type { SubmitKYCDto, KYCQuestion } from './kyc.types';
export declare function submitKYC(dto: SubmitKYCDto): Promise<{
    id: string;
    createdAt: Date;
    fullName: string;
    dob: string;
    ssnLast4: string;
    address: string;
    city: string;
    state: string;
    zip: string;
    verified: boolean;
    verifiedAt: Date | null;
    giftId: string;
}>;
export declare function confirmSSN(claimToken: string, ssnLast4: string): Promise<{
    confirmed: boolean;
}>;
export declare function getQuestions(): KYCQuestion[];
export declare function verifyAnswers(claimToken: string): Promise<{
    verified: boolean;
}>;
//# sourceMappingURL=kyc.service.d.ts.map