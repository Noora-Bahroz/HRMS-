import { Router } from "express";
import * as controller from "./ats.controller";
import { validate } from "../../utils/validate";
import { authenticate } from "../../middleware/auth";
import { requirePermission } from "../../middleware/rbac";
import {
  applySchema,
  convertToEmployeeSchema,
  createCandidateSchema,
  createInterviewSchema,
  createOfferSchema,
  createPostingSchema,
  createRequisitionSchema,
  interviewFeedbackSchema,
  moveApplicationSchema,
  updateCandidateSchema,
  updateOfferSchema,
  updateRequisitionSchema,
} from "./ats.validation";

const router = Router();
router.use(authenticate);

router.get("/stats", requirePermission("ats:manage_candidate"), controller.recruitmentStats);
router.get("/reports", requirePermission("ats:manage_candidate"), controller.recruitmentReports);

router.get("/requisitions", requirePermission("ats:manage_requisition"), controller.listRequisitions);
router.post(
  "/requisitions",
  requirePermission("ats:manage_requisition"),
  validate(createRequisitionSchema),
  controller.createRequisition
);
router.patch(
  "/requisitions/:id",
  requirePermission("ats:manage_requisition"),
  validate(updateRequisitionSchema),
  controller.updateRequisition
);

router.get("/postings", requirePermission("ats:manage_candidate"), controller.listPostings);
router.post("/postings", requirePermission("ats:manage_requisition"), validate(createPostingSchema), controller.createPosting);
router.post("/apply", requirePermission("ats:manage_candidate"), validate(applySchema), controller.createApplication);

router.get("/candidates", requirePermission("ats:manage_candidate"), controller.listCandidates);
router.post("/candidates", requirePermission("ats:manage_candidate"), validate(createCandidateSchema), controller.createCandidate);
router.get("/candidates/:id", requirePermission("ats:manage_candidate"), controller.getCandidateDetail);
router.patch("/candidates/:id", requirePermission("ats:manage_candidate"), validate(updateCandidateSchema), controller.updateCandidate);

router.get("/applications", requirePermission("ats:manage_candidate"), controller.listApplications);
router.patch("/applications/:id/move", requirePermission("ats:manage_candidate"), validate(moveApplicationSchema), controller.moveApplication);

router.get("/interviews", requirePermission("ats:interview"), controller.listInterviews);
router.post("/interviews", requirePermission("ats:interview"), validate(createInterviewSchema), controller.createInterview);
router.post("/feedback", requirePermission("ats:interview"), validate(interviewFeedbackSchema), controller.addFeedback);

router.get("/offers", requirePermission("ats:offer"), controller.listOffers);
router.post("/offers", requirePermission("ats:offer"), validate(createOfferSchema), controller.createOffer);
router.patch("/offers/:id", requirePermission("ats:offer"), validate(updateOfferSchema), controller.updateOffer);
router.post("/offers/:id/convert", requirePermission("ats:convert_employee"), validate(convertToEmployeeSchema), controller.convertToEmployee);

export default router;
