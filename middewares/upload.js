const multer = require("multer");
const path = require("path");
const fs = require("fs");
const sharp = require("sharp");

// --- Base upload folder ---
const baseDir = path.join(process.cwd(), "uploads");
if (!fs.existsSync(baseDir)) fs.mkdirSync(baseDir, { recursive: true });

// --- Folder-specific dimensions ---
const folderSizes = {
  brand: { type: "fixed", width: 181, height: 65, tolerance: 20 },//	181 × 65 px
  setting: { type: "max", width: 217, height: 45, tolerance: 0 },//217 × 41 px
  favicon: { type: "fixed", width: 35, height: 35, tolerance: 10 },
  testimonial: { type: "fixed", width: 56, height: 56, tolerance: 1 },
  blogs: { type: "fixed", width: 1400, height: 600, tolerance: 10 },//	389 × 210 px 861 x 465
  profileimage: { type: "max", width: 300, height: 300, tolerance: 50 },
  pagesection: { type: "fixed", width: 1536, height: 1024, tolerance: 10 },
  tickets: null,
  // herosection: {
  //   backgroundImg: { width: 1440, height: 1384, tolerance: 0 },
  //   mainImg: { width: 843, height: 843, tolerance: 0 }
  // },
  portfolio: { type: "fixed", width: 446, height: 250, tolerance: 0 },
  howitwork: { type: "fixed", width: 550, height: 370, tolerance: 0 }

};

// --- Helper to get folder from route ---
const getFolderFromRoute = (req) => {
  const route = req.originalUrl.toLowerCase();
  //  ADMIN PROFILE IMAGE
  if (route.includes("adminimage") || route.includes("adminprofile"))
    return "adminprofile";
  if (route.includes("brand")) return "brand";
  if (route.includes("savesetting")) return "setting";
  if (route.includes("testimonialssave")) return "testimonial";
  if (route.includes("blogs")) return "blogs";
  if (route.includes("profile")) return "profileimage";
  if (route.includes("ticket") || route.includes("support")) return "tickets";
  if (route.includes("leadsuploadexcel")) return "leads";
  // if (route.includes("herosection")) return "herosection"; // Add this line
  if (route.includes("growtoolsave")) return "growtool"
  if (route.includes("savesection")) return "pagesection"
  if (route.includes("portfolio")) return "portfolio"
  if (route.includes("howitworksave")) return "howitwork"
  if (route.includes("/preference/")) return "preference";
  if (route.includes("/preferenceattach/")) return "preference";

  return "others";
};
const isValidObjectId = (id) => {
  return /^[a-fA-F0-9]{24}$/.test(id);
};
// --- Multer Storage ---
const storage = multer.diskStorage({
  destination: (req, file, cb) => {
    const folderName = getFolderFromRoute(req);
    let folderPath = path.join(baseDir, folderName);

    if (folderName === "preference") {
      const rawPreferenceId = req.params.preferenceId;

      if (!rawPreferenceId) {
        return cb(new Error("preferenceId is required"));
      }
      // validate format
      if (!isValidObjectId(rawPreferenceId)) {
        return cb(new Error("Invalid preferenceId format"));
      }
      const preferenceId = rawPreferenceId; // safe now

      const finalPath = path.resolve(
        process.cwd(),
        "uploads",
        "websites",
        "exports",
        preferenceId,
        "img"
      );
      // ensure path is inside uploads
      const baseUploadPath = path.resolve(process.cwd(), "uploads");

      if (!finalPath.startsWith(baseUploadPath)) {
        return cb(new Error("Invalid path detected"));
      }

      folderPath = finalPath;
      
      if (!fs.existsSync(folderPath)) {
        fs.mkdirSync(folderPath, { recursive: true });
      }

    }
    // *** Special structure for blogs ***
    if (folderName === "blogs") {
      folderPath = path.join(baseDir, "blogs/main");
    }
    if (!fs.existsSync(folderPath)) fs.mkdirSync(folderPath, { recursive: true });
    cb(null, folderPath);
  },
  filename: (req, file, cb) => {
    const uniqueSuffix = Date.now() + "-" + Math.round(Math.random() * 1e9);
    cb(null, uniqueSuffix + path.extname(file.originalname));
  },
});

// --- File Filter (extension only) ---
const fileFilter = (req, file, cb) => {
  const folderName = getFolderFromRoute(req);

  //  EXCEL UPLOAD (LEADS)
  if (folderName === "leads") {
    const allowedExcel =
      /xlsx|xls/.test(path.extname(file.originalname).toLowerCase()) &&
      (
        file.mimetype ===
        "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet" ||
        file.mimetype === "application/vnd.ms-excel"
      );

    if (allowedExcel) return cb(null, true);
    return cb(new Error("Only Excel files allowed (.xlsx, .xls)"));
  }

  let allowed = /jpeg|jpg|png|webp|svg/;
  if (folderName === "tickets") allowed = /jpeg|jpg|png|webp|svg|pdf/;

  const extValid = allowed.test(path.extname(file.originalname).toLowerCase());
  const mimeValid = allowed.test(file.mimetype);

  if (extValid && mimeValid) return cb(null, true);
  return cb(new Error(`Invalid file type. Allowed: ${allowed}`));
};

// --- Multer Instance ---
const upload = multer({ storage, fileFilter, limits: { fileSize: 5 * 1024 * 1024 } });

// --- Sharp Dimension Validator ---
const validateDimensions = async (req, res, next) => {
  const folderName = getFolderFromRoute(req);
  if (folderName === "leads") return next();

  // Collect all files uploaded
  const files = [];
  if (req.file) files.push(req.file);
  if (req.files) Object.values(req.files).flat().forEach(f => files.push(f));

  if (!files.length) return next();

  try {
    for (let f of files) {
      if (!f.mimetype.startsWith("image/")) continue;

      const metadata = await sharp(f.path).metadata();
      const { width, height } = metadata;

      // Use custom dimension for favicon
      let dim = folderSizes[folderName];
      if (folderName === "herosection") {
        dim = folderSizes.herosection[f.fieldname];
      }
      if (f.fieldname === "favicon") dim = folderSizes.favicon;

      if (!dim) continue;

      if (dim.type === "max") {
        if (width > dim.width || height > dim.height) {
          fs.unlinkSync(f.path);
          return res.status(200).json({
            success: false,
            message: `Max ${dim.width}x${dim.height}px allowed`
          });
        }
        continue;
      }

      const validWidth = width >= dim.width - dim.tolerance && width <= dim.width + dim.tolerance;
      const validHeight = height >= dim.height - dim.tolerance && height <= dim.height + dim.tolerance;

      if (!validWidth || !validHeight) {
        fs.unlinkSync(f.path);
        return res.status(200).json({
          success: false,
          message: `Invalid size for ${f.fieldname}. Required: ${dim.width}x${dim.height}`,
        });
      }

    }

    next();
  } catch (err) {
    files.forEach(f => fs.existsSync(f.path) && fs.unlinkSync(f.path));
    return res.status(500).json({ success: false, message: "Error processing image" });
  }
};



// ==========================
//  THUMBNAIL GENERATOR
// ==========================
const generateThumbnail = async (req, res, next) => {
  if (!req.file) return next();

  const folderName = getFolderFromRoute(req);
  if (folderName !== "blogs") return next();

  const thumbDir = path.join(baseDir, "blogs/thumb");
  if (!fs.existsSync(thumbDir)) fs.mkdirSync(thumbDir, { recursive: true });

  const thumbFilename = "thumb_" + req.file.filename;
  const thumbPath = path.join(thumbDir, thumbFilename);

  try {
    await sharp(req.file.path)
      .resize({
        height: 210,
        withoutEnlargement: true
      })
      .toFile(thumbPath);

    // Pass thumbnail to controller
    req.thumbnailPath = "/uploads/blogs/thumb/" + thumbFilename;

    next();
  } catch (err) {
    return res.status(500).json({ success: false, message: "Thumbnail creation failed" });
  }
};

upload.fieldsWithSizeError = (fields) => {
  return (req, res, next) => {
    upload.fields(fields)(req, res, function (err) {
      if (err) {
        if (err.code === "LIMIT_FILE_SIZE") {
          return res.status(200).json({
            success: false,
            message: "File must be under 5 MB"
          });
        }
        return res.status(200).json({
          success: false,
          message: err.message
        });
      }
      next();
    });
  };
};


// ==========================
//  UPLOAD WITH SIZE ERROR HANDLING
// ==========================
upload.singleWithSizeError = (fieldName) => {
  return (req, res, next) => {
    upload.single(fieldName)(req, res, function (err) {
      if (err) {
        // FILE SIZE ERROR
        if (err.code === "LIMIT_FILE_SIZE") {
          return res.status(200).json({
            success: false,
            message: "File must be under 5 MB"
          });
        }

        // OTHER MULTER ERRORS
        return res.status(200).json({
          success: false,
          message: err.message
        });
      }
      next();
    });
  };
};


// ==========================
//  ARRAY UPLOAD WITH SIZE ERROR HANDLING
// ==========================
upload.arrayWithSizeError = (fieldName, maxCount = 5) => {
  return (req, res, next) => {
    upload.array(fieldName, maxCount)(req, res, function (err) {
      if (err) {
        // FILE SIZE ERROR
        if (err.code === "LIMIT_FILE_SIZE") {
          return res.status(200).json({
            success: false,
            message: "Each file must be under 5 MB"
          });
        }

        // TOO MANY FILES
        if (err.code === "LIMIT_UNEXPECTED_FILE") {
          return res.status(200).json({
            success: false,
            message: `Maximum ${maxCount} files allowed`
          });
        }

        // OTHER MULTER ERRORS
        return res.status(200).json({
          success: false,
          message: err.message
        });
      }
      next();
    });
  };
};

// --- Export ---
upload.validateDimensions = validateDimensions;
upload.generateThumbnail = generateThumbnail;
module.exports = upload;
