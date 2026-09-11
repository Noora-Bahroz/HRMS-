import { Request, Response } from "express";
import { asyncHandler } from "../../utils/validate";
import { ok, created } from "../../utils/http";
import * as atsService from "./ats.service";

export const createRequisition = asyncHandler(async (req: Request, res: Response) => {
  const r = await atsService.createRequisition(req.user!.tenantId, req.body);
  return created(res, r);
});

export const listRequisitions = asyncHandler(async (req: Request, res: Response) => {
  const data = await atsService.listRequisitions(req.user!.tenantId, req.query.status as string | undefined);
  return ok(res, data);
});

export const updateRequisition = asyncHandler(async (req: Request, res: Response) => {
  const r = await atsService.updateRequisition(req.user!.tenantId, req.params.id, req.body);
  return ok(res, r);
});

export const createPosting = asyncHandler(async (req: Request, res: Response) => {
  const p = await atsService.createPosting(req.user!.tenantId, req.body);
  return created(res, p);
});

export const listPostings = asyncHandler(async (req: Request, res: Response) => {
  const data = await atsService.listPostings(req.user!.tenantId);
  return ok(res, data);
});

export const createCandidate = asyncHandler(async (req: Request, res: Response) => {
  const c = await atsService.createCandidate(req.user!.tenantId, req.body);
  return created(res, c);
});

export const listCandidates = asyncHandler(async (req: Request, res: Response) => {
  const data = await atsService.listCandidates(req.user!.tenantId, req.query.search as string | undefined);
  return ok(res, data);
});

export const getCandidateDetail = asyncHandler(async (req: Request, res: Response) => {
  const data = await atsService.getCandidateDetail(req.user!.tenantId, req.params.id);
  return ok(res, data);
});

export const updateCandidate = asyncHandler(async (req: Request, res: Response) => {
  const c = await atsService.updateCandidate(req.user!.tenantId, req.params.id, req.body);
  return ok(res, c);
});

export const createApplication = asyncHandler(async (req: Request, res: Response) => {
  const a = await atsService.createApplication(req.body);
  return created(res, a);
});

export const listApplications = asyncHandler(async (req: Request, res: Response) => {
  const data = await atsService.listApplications(req.user!.tenantId);
  return ok(res, data);
});

export const moveApplication = asyncHandler(async (req: Request, res: Response) => {
  const a = await atsService.moveApplication(req.params.id, req.body.status, req.body.stage);
  return ok(res, a);
});

export const createInterview = asyncHandler(async (req: Request, res: Response) => {
  const i = await atsService.createInterview(req.user!.tenantId, req.body);
  return created(res, i);
});

export const addFeedback = asyncHandler(async (req: Request, res: Response) => {
  const f = await atsService.addInterviewFeedback({
    ...req.body,
    interviewerId: req.user!.id,
  });
  return created(res, f);
});

export const listInterviews = asyncHandler(async (req: Request, res: Response) => {
  const data = await atsService.listInterviews(req.user!.tenantId);
  return ok(res, data);
});

export const createOffer = asyncHandler(async (req: Request, res: Response) => {
  const o = await atsService.createOffer(req.body);
  return created(res, o);
});

export const listOffers = asyncHandler(async (req: Request, res: Response) => {
  const data = await atsService.listOffers(req.user!.tenantId);
  return ok(res, data);
});

export const updateOffer = asyncHandler(async (req: Request, res: Response) => {
  const o = await atsService.updateOffer(req.user!.tenantId, req.params.id, req.body);
  return ok(res, o);
});

export const convertToEmployee = asyncHandler(async (req: Request, res: Response) => {
  const e = await atsService.convertToEmployee(req.user!.tenantId, req.params.id, req.body);
  return created(res, e);
});

export const recruitmentStats = asyncHandler(async (req: Request, res: Response) => {
  const data = await atsService.getRecruitmentStats(req.user!.tenantId);
  return ok(res, data);
});

export const recruitmentReports = asyncHandler(async (req: Request, res: Response) => {
  const data = await atsService.getRecruitmentReports(req.user!.tenantId);
  return ok(res, data);
});
