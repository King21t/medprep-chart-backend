const prisma = require("../config/db");

// Create a new timed exam session by pulling a random set of questions
async function createExam(req, res) {
  try {
    const { title, lectureIds, numQuestions = 20, durationMinutes = 30 } = req.body;

    const questions = await prisma.question.findMany({
      where: lectureIds?.length ? { lectureId: { in: lectureIds } } : {},
    });

    if (questions.length === 0) {
      return res.status(400).json({ error: "No questions available for the given lectures" });
    }

    const shuffled = questions.sort(() => 0.5 - Math.random()).slice(0, numQuestions);

    const examSession = await prisma.examSession.create({
      data: {
        userId: req.user.id,
        title: title || "Practice Exam",
        durationMinutes,
        answers: {
          create: shuffled.map((q) => ({ questionId: q.id })),
        },
      },
      include: { answers: { include: { question: true } } },
    });

    // Strip correct answers before sending to the client
    const sanitized = {
      id: examSession.id,
      title: examSession.title,
      durationMinutes: examSession.durationMinutes,
      startedAt: examSession.startedAt,
      questions: examSession.answers.map((a) => ({
        answerId: a.id,
        questionId: a.question.id,
        questionText: a.question.questionText,
        options: a.question.options,
      })),
    };

    res.status(201).json(sanitized);
  } catch (err) {
    res.status(500).json({ error: "Failed to create exam", details: err.message });
  }
}

// Submit answers for an in-progress exam and score it
async function submitExam(req, res) {
  try {
    const { answers } = req.body; // [{ answerId, selectedAnswer }]
    const examSession = await prisma.examSession.findUnique({
      where: { id: req.params.id },
      include: { answers: { include: { question: true } } },
    });

    if (!examSession) return res.status(404).json({ error: "Exam session not found" });
    if (examSession.userId !== req.user.id) return res.status(403).json({ error: "Not your exam" });
    if (examSession.endedAt) return res.status(400).json({ error: "Exam already submitted" });

    let correctCount = 0;

    await prisma.$transaction(
      answers.map(({ answerId, selectedAnswer }) => {
        const original = examSession.answers.find((a) => a.id === answerId);
        const isCorrect = original && original.question.correctAnswer === selectedAnswer;
        if (isCorrect) correctCount += 1;
        return prisma.examAnswer.update({
          where: { id: answerId },
          data: { selectedAnswer, isCorrect: !!isCorrect },
        });
      })
    );

    const score = (correctCount / examSession.answers.length) * 100;

    const updated = await prisma.examSession.update({
      where: { id: examSession.id },
      data: { endedAt: new Date(), score },
    });

    res.json({ id: updated.id, score: updated.score, correctCount, total: examSession.answers.length });
  } catch (err) {
    res.status(500).json({ error: "Failed to submit exam", details: err.message });
  }
}

async function getExamResults(req, res) {
  const examSession = await prisma.examSession.findUnique({
    where: { id: req.params.id },
    include: { answers: { include: { question: true } } },
  });
  if (!examSession) return res.status(404).json({ error: "Exam session not found" });
  if (examSession.userId !== req.user.id) return res.status(403).json({ error: "Not your exam" });

  res.json({
    id: examSession.id,
    title: examSession.title,
    score: examSession.score,
    startedAt: examSession.startedAt,
    endedAt: examSession.endedAt,
    review: examSession.answers.map((a) => ({
      questionText: a.question.questionText,
      options: a.question.options,
      correctAnswer: a.question.correctAnswer,
      selectedAnswer: a.selectedAnswer,
      isCorrect: a.isCorrect,
      explanation: a.question.explanation,
    })),
  });
}

async function listExamHistory(req, res) {
  const sessions = await prisma.examSession.findMany({
    where: { userId: req.user.id },
    select: { id: true, title: true, score: true, startedAt: true, endedAt: true },
    orderBy: { startedAt: "desc" },
  });
  res.json(sessions);
}

module.exports = { createExam, submitExam, getExamResults, listExamHistory };
