const multer = require("multer");
const path = require("path");
const crypto = require("crypto");

const storage = multer.diskStorage({
  destination: (req, file, cb) => {
    cb(null, path.join(__dirname, "..", "..", "uploads"));
  },
  filename: (req, file, cb) => {
    const unique = crypto.randomUUID();
    cb(null, `${unique}${path.extname(file.originalname)}`);
  },
});

function fileFilter(req, file, cb) {
  const allowed = [
    "application/pdf",
    "application/vnd.openxmlformats-officedocument.presentationml.presentation", // .pptx
  ];

  if (file.mimetype === "application/vnd.ms-powerpoint") {
    // legacy binary .ppt — not parseable by our text extractor
    return cb(new Error("Legacy .ppt files aren't supported. Please re-save it as .pptx (PowerPoint: File > Save As > .pptx) and upload again."));
  }

  if (!allowed.includes(file.mimetype)) {
    return cb(new Error("Only PDF or PPTX files are allowed"));
  }
  cb(null, true);
}

const upload = multer({
  storage,
  fileFilter,
  limits: { fileSize: 50 * 1024 * 1024 }, // 50MB
});

module.exports = upload;
