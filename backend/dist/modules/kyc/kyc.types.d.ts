export interface SubmitKYCDto {
    claimToken: string;
    fullName: string;
    dob: string;
    ssn: string;
    ssnLast4: string;
    address: string;
    city: string;
    state: string;
    zip: string;
}
export interface KYCQuestion {
    id: string;
    question: string;
    options: string[];
}
//# sourceMappingURL=kyc.types.d.ts.map