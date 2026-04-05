export declare function createKYC(data: {
    giftId: string;
    fullName: string;
    dob: string;
    ssnLast4: string;
    address: string;
    city: string;
    state: string;
    zip: string;
}): Promise<{
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
export declare function findKYCByGiftId(giftId: string): Promise<{
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
} | null>;
export declare function verifyKYC(id: string): Promise<{
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
//# sourceMappingURL=kyc.repository.d.ts.map