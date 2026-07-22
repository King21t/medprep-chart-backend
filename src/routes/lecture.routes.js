const express = require("express");
const {
  uploadLecture,
  listLectures,
  getLecture,
  deleteLecture,
  generateQuestionsForLecture,
} = require("../controllers/lecture.controller");
const { requireAuth, requireAdmin } = require("../middleware/auth");
const upload = require("../middleware/upload");

const router = express.Router();

// Any logged-in student can browse lectures
router.get("/", requireAuth, listLectures);
router.get("/:id", requireAuth, getLecture);

// Admin-only: upload, delete, and trigger AI question generation
router.post("/", requireAuth, requireAdmin, upload.single("file"), uploadLecture);
router.delete("/:id", requireAuth, requireAdmin, deleteLecture);
router.post("/:id/generate-questions", requireAuth, requireAdmin, generateQuestionsForLecture);

module.exports = router;
