import multer from "multer";
import { ApiError } from "../utils/http";

const upload = multer({
  storage: multer.memoryStorage(),
  limits: { fileSize: 10 * 1024 * 1024 }, // 10 MB
  fileFilter: (_req, file, cb) => {
    const allowed = [
      "application/pdf",
      "image/png",
      "image/jpeg",
      "image/webp",
      "text/plain",
      "application/msword",
      "application/vnd.openxmlformats-officedocument.wordprocessingml.document",
    ];
    if (allowed.includes(file.mimetype)) cb(null, true);
    else cb(new ApiError(400, "unsupported_file_type", "File type not allowed"));
  },
});

export const uploadDocumentFile = upload.single("file");
