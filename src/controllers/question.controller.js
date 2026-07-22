const prisma = require("../config/db");

async function listQuestions(req, res) {
  const { lectureId, difficulty } = req.query;
  const questions = await prisma.question.findMany({
    where: {
      ...(lectureId ? { lectureId } : {}),
      ...(difficulty ? { difficulty } : {}),
    },
    orderBy: { createdAt: "desc" },
  });
  res.json(questions);
}

async function getQuestion(req, res) {
  const question = await prisma.question.findUnique({ where: { id: req.params.id } });
  if (!question) return res.status(404).json({ error: "Question not found" });
  res.json(question);
}

module.exports = { listQuestions, getQuestion };
