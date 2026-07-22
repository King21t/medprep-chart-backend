const fs = require("fs");
const pdfParse = require("pdf-parse");
const prisma = require("../config/db");
const { generateQuestions } = require("../services/aiService");

async function uploadLecture(req, res) {
  try {
    if (!req.file) return res.status(400).json({ error: "No PDF file uploaded" });
    const { title, subject } = req.body;
    if (!title || !subject) {
      return res.status(400).json({ error: "title and subject are required" });
    }

    const buffer = fs.readFileSync(req.file.path);
    const parsed = await pdfParse(buffer);

    const lecture = await prisma.lecture.create({
      data: {
        title,
        subject,
        filePath: req.file.filename,
        extractedText: parsed.text,
        uploadedById: req.user.id,
      },
    });

    res.status(201).json({
      id: lecture.id,
      title: lecture.title,
      subject: lecture.subject,
      createdAt: lecture.createdAt,
    });
  } catch (err) {
    res.status(500).json({ error: "Failed to upload lecture", details: err.message });
  }
}

async function listLectures(req, res) {
  const lectures = await prisma.lecture.findMany({
    select: {
      id: true,
      title: true,
      subject: true,
      createdAt: true,
      _count: { select: { questions: true } },
    },
    orderBy: { createdAt: "desc" },
  });
  res.json(lectures);
}

async function getLecture(req, res) {
  const lecture = await prisma.lecture.findUnique({
    where: { id: req.params.id },
    select: { id: true, title: true, subject: true, createdAt: true },
  });
  if (!lecture) return res.status(404).json({ error: "Lecture not found" });
  res.json(lecture);
}

async function deleteLecture(req, res) {
  try {
    const lecture = await prisma.lecture.findUnique({ where: { id: req.params.id } });
    if (!lecture) return res.status(404).json({ error: "Lecture not found" });

    await prisma.lecture.delete({ where: { id: req.params.id } });

    const filePath = require("path").join(__dirname, "..", "..", "uploads", lecture.filePath);
    fs.unlink(filePath, () => {}); // best-effort cleanup

    res.status(204).send();
  } catch (err) {
    res.status(500).json({ error: "Failed to delete lecture", details: err.message });
  }
}

async function generateQuestionsForLecture(req, res) {
  try {
    const { count = 10 } = req.body;
    const lecture = await prisma.lecture.findUnique({ where: { id: req.params.id } });
    if (!lecture) return res.status(404).json({ error: "Lecture not found" });
    if (!lecture.extractedText) {
      return res.status(400).json({ error: "This lecture has no extractable text" });
    }

    const generated = await generateQuestions(lecture.extractedText, lecture.subject, count);

    const created = await prisma.$transaction(
      generated.map((q) =>
        prisma.question.create({
          data: {
            lectureId: lecture.id,
            questionText: q.questionText,
            options: q.options,
            correctAnswer: q.correctAnswer,
            explanation: q.explanation,
            difficulty: q.difficulty || "MEDIUM",
          },
        })
      )
    );

    res.status(201).json({ count: created.length, questions: created });
  } catch (err) {
    res.status(500).json({ error: "Failed to generate questions", details: err.message });
  }
}

module.exports = {
  uploadLecture,
  listLectures,
  getLecture,
  deleteLecture,
  generateQuestionsForLecture,
};
