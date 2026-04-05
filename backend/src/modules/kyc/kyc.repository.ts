import { prisma } from '../../shared/db/prisma.client';

export async function createKYC(data: {
  giftId: string;
  fullName: string;
  dob: string;
  ssnLast4: string;
  address: string;
  city: string;
  state: string;
  zip: string;
}) {
  return prisma.kYC.create({ data });
}

export async function findKYCByGiftId(giftId: string) {
  return prisma.kYC.findUnique({ where: { giftId } });
}

export async function verifyKYC(id: string) {
  return prisma.kYC.update({
    where: { id },
    data: { verified: true, verifiedAt: new Date() },
  });
}
