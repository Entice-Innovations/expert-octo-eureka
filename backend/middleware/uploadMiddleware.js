
const multer = require("multer");
const path = require("path");
const fs = require("fs");

// ==========================================
// UPLOAD DIRECTORIES
// ==========================================

const uploadsDirectory = path.join(
  __dirname,
  "..",
  "uploads"
);

const documentsDirectory = path.join(
  uploadsDirectory,
  "documents"
);

// Create upload folders automatically
if (!fs.existsSync(uploadsDirectory)) {
  fs.mkdirSync(uploadsDirectory, {
    recursive: true,
  });
}

if (!fs.existsSync(documentsDirectory)) {
  fs.mkdirSync(documentsDirectory, {
    recursive: true,
  });
}

// ==========================================
// MULTER STORAGE
// ==========================================

const storage = multer.diskStorage({
  destination: function (req, file, cb) {
    cb(null, documentsDirectory);
  },

  filename: function (req, file, cb) {
    const extension = path.extname(file.originalname);

    const safeName = path
      .basename(file.originalname, extension)
      .replace(/[^a-zA-Z0-9-_]/g, "-");

    cb(
      null,
      `${Date.now()}-${safeName}${extension}`
    );
  },
});

// ==========================================
// FILE UPLOAD CONFIGURATION
// ==========================================

const upload = multer({
  storage: storage,

  limits: {
    fileSize: 10 * 1024 * 1024, // 10 MB
  },

  fileFilter: function (req, file, cb) {
    const allowedExtensions = [
      ".pdf",
      ".jpg",
      ".jpeg",
      ".png",
    ];

    const extension = path
      .extname(file.originalname)
      .toLowerCase();

    if (!allowedExtensions.includes(extension)) {
      return cb(
        new Error(
          "Only PDF, JPG, JPEG and PNG files are allowed."
        )
      );
    }

    cb(null, true);
  },
});

// ==========================================
// EXPORT
// ==========================================

module.exports = upload;
