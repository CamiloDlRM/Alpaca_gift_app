import * as kycRepo from './kyc.repository';
import { getGiftByClaimToken as findGiftByClaimToken, transitionStatus } from '../gifts/gifts.service';
import { eventBus, EVENTS } from '../../shared/events/event-bus';
import { BadRequestError, NotFoundError } from '../../shared/errors/http-errors';
import { GiftStatus } from '@prisma/client';
import type { SubmitKYCDto, KYCQuestion } from './kyc.types';
import { prisma } from '../../shared/db/prisma.client';
import { hashPassword, comparePassword } from '../../shared/utils/hash';
import { sendClaimPinEmail } from '../../shared/email/email.service';

const QUESTION_POOL: KYCQuestion[] = [
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

function shuffleArray<T>(arr: T[]): T[] {
  const copy = [...arr];
  for (let i = copy.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [copy[i], copy[j]] = [copy[j], copy[i]];
  }
  return copy;
}

export async function submitKYC(dto: SubmitKYCDto) {
  const gift = await findGiftByClaimToken(dto.claimToken);

  const existing = await kycRepo.findKYCByGiftId(gift.id);
  if (existing) throw new BadRequestError('KYC already submitted');

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

  await transitionStatus(gift.id, GiftStatus.KYC_SUBMITTED);
  return kyc;
}

export async function confirmSSN(claimToken: string, ssnLast4: string) {
  const gift = await findGiftByClaimToken(claimToken);
  const kyc = await kycRepo.findKYCByGiftId(gift.id);
  if (!kyc) throw new NotFoundError('KYC not found');

  if (kyc.ssnLast4 !== ssnLast4) throw new BadRequestError('SSN does not match');
  return { confirmed: true };
}

export function getQuestions(): KYCQuestion[] {
  return shuffleArray(QUESTION_POOL).slice(0, 3);
}

export async function verifyAnswers(claimToken: string) {
  const gift = await findGiftByClaimToken(claimToken);
  const kyc = await kycRepo.findKYCByGiftId(gift.id);
  if (!kyc) throw new NotFoundError('KYC not found');

  await kycRepo.verifyKYC(kyc.id);
  await transitionStatus(gift.id, GiftStatus.KYC_VERIFIED);

  eventBus.emit(EVENTS.KYC_VERIFIED, { giftId: gift.id, claimToken });
  return { verified: true };
}

export async function checkReturningRecipient(claimToken: string): Promise<{ isReturning: boolean }> {
  const gift = await findGiftByClaimToken(claimToken);
  if (!gift.recipientEmail) return { isReturning: false };

  const previousVerified = await prisma.kYC.findFirst({
    where: {
      verified: true,
      gift: {
        recipientEmail: gift.recipientEmail,
        id: { not: gift.id },
      },
    },
  });

  return { isReturning: !!previousVerified };
}

export async function generateClaimPin(claimToken: string): Promise<{ sent: boolean }> {
  const gift = await findGiftByClaimToken(claimToken);
  if (!gift.recipientEmail) throw new BadRequestError('This gift has no recipient email.');

  const { isReturning } = await checkReturningRecipient(claimToken);
  if (!isReturning) throw new BadRequestError('Not a returning recipient.');

  const pin = Math.floor(100000 + Math.random() * 900000).toString();
  const hashedPin = await hashPassword(pin);
  const expiry = new Date(Date.now() + 15 * 60 * 1000);

  await prisma.gift.update({
    where: { id: gift.id },
    data: { claimPin: hashedPin, claimPinExpiry: expiry },
  });

  await sendClaimPinEmail({
    recipientEmail: gift.recipientEmail,
    recipientName: gift.recipientName,
    pin,
  });

  return { sent: true };
}

export async function verifyClaimPin(claimToken: string, pin: string): Promise<{ success: boolean }> {
  const gift = await findGiftByClaimToken(claimToken);
  if (!gift.claimPin || !gift.claimPinExpiry) throw new BadRequestError('No PIN generated for this gift.');
  if (new Date() > new Date(gift.claimPinExpiry)) throw new BadRequestError('PIN expired. Please generate a new one.');

  const valid = await comparePassword(pin, gift.claimPin);
  if (!valid) throw new BadRequestError('Invalid PIN.');

  const previousGiftWithKyc = await prisma.gift.findFirst({
    where: {
      recipientEmail: gift.recipientEmail!,
      id: { not: gift.id },
      kyc: { verified: true },
    },
    include: { kyc: true },
    orderBy: { createdAt: 'desc' },
  });

  if (!previousGiftWithKyc?.kyc) throw new BadRequestError('Could not find previous KYC data.');

  let kycRecord = await kycRepo.findKYCByGiftId(gift.id);
  if (!kycRecord) {
    kycRecord = await kycRepo.createKYC({
      giftId: gift.id,
      fullName: previousGiftWithKyc.kyc.fullName,
      dob: previousGiftWithKyc.kyc.dob,
      ssnLast4: previousGiftWithKyc.kyc.ssnLast4,
      address: previousGiftWithKyc.kyc.address,
      city: previousGiftWithKyc.kyc.city,
      state: previousGiftWithKyc.kyc.state,
      zip: previousGiftWithKyc.kyc.zip,
    });
  }

  await kycRepo.verifyKYC(kycRecord.id);

  if (gift.status === GiftStatus.PENDING) {
    await transitionStatus(gift.id, GiftStatus.CLAIMING);
  }
  if (gift.status === GiftStatus.PENDING || gift.status === GiftStatus.CLAIMING) {
    await transitionStatus(gift.id, GiftStatus.KYC_SUBMITTED);
    await transitionStatus(gift.id, GiftStatus.KYC_VERIFIED);
  } else if (gift.status === GiftStatus.KYC_SUBMITTED) {
    await transitionStatus(gift.id, GiftStatus.KYC_VERIFIED);
  }

  eventBus.emit(EVENTS.KYC_VERIFIED, { giftId: gift.id, claimToken });

  await prisma.gift.update({
    where: { id: gift.id },
    data: { claimPin: null, claimPinExpiry: null },
  });

  return { success: true };
}
