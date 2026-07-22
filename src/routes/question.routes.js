const express = require("express");
const { listQuestions, getQuestion } = require("../controllers/question.controller");
const { requireAuth } = require("../middleware/auth");

const router = express.Router();

router.get("/", requireAuth, listQuestions);
router.get("/:id", requireAuth, getQuestion);

module.exports = router;
