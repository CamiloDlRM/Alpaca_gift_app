import { Request, Response, NextFunction } from 'express';
import * as kycService from './kyc.service';

export async function submitKYCHandler(req: Request, res: Response, next: NextFunction): Promise<void> {
  try {
    const result = await kycService.submitKYC(req.body);
    res.status(201).json(result);
  } catch (err) {
    next(err);
  }
}

export async function confirmSSNHandler(req: Request, res: Response, next: NextFunction): Promise<void> {
  try {
    const result = await kycService.confirmSSN(req.body.claimToken, req.body.ssnLast4);
    res.json(result);
  } catch (err) {
    next(err);
  }
}

export async function getQuestionsHandler(req: Request, res: Response, next: NextFunction): Promise<void> {
  try {
    const questions = kycService.getQuestions();
    res.json(questions);
  } catch (err) {
    next(err);
  }
}

export async function verifyAnswersHandler(req: Request, res: Response, next: NextFunction): Promise<void> {
  try {
    const result = await kycService.verifyAnswers(req.body.claimToken);
    res.json(result);
  } catch (err) {
    next(err);
  }
}
