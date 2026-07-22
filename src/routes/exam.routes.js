const express = require("express");
const {
  createExam,
  submitExam,
  getExamResults,
  listExamHistory,
} = require("../controllers/exam.controller");
const { requireAuth } = require("../middleware/auth");

const router = express.Router();

router.post("/", requireAuth, createExam);
router.post("/:id/submit", requireAuth, submitExam);
router.get("/:id/results", requireAuth, getExamResults);
router.get("/", requireAuth, listExamHistory);

module.exports = router;
