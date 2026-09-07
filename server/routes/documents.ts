import { Router } from "express";
import multer from "multer";
import { getDb, saveDb, IDocument, getMongoDb, isMongoConnected } from "../db.js";
import { verifyToken, AuthRequest } from "../middleware/auth.js";

const router = Router();

// In-memory fallback file storage for offline/local development without MongoDB
const memoryFileStore = new Map<string, { filename: string; contentType: string; buffer: Buffer; size: number }>();

// Production-ready memory storage: Avoids writing to ephemeral/read-only filesystems (like Vercel)
const upload = multer({
  storage: multer.memoryStorage(),
  limits: { fileSize: 15 * 1024 * 1024 } // 15 MB limit
});

// GET /api/documents
router.get("/", verifyToken, async (req: AuthRequest, res) => {
  try {
    const db = getDb();
    const user = req.user!;
    let documents = [...db.documents];

    const { type, employeeId, search } = req.query;

    if (user.role === "Employee") {
      documents = documents.filter((d) => d.employeeId === user.employeeId || d.type === "Policy");
    } else if (employeeId && employeeId !== "all") {
      documents = documents.filter((d) => d.employeeId === employeeId);
    }

    if (type && type !== "all") {
      documents = documents.filter((d) => d.type.toLowerCase() === (type as string).toLowerCase());
    }

    if (search) {
      const q = (search as string).toLowerCase().trim();
      documents = documents.filter((d) => d.name.toLowerCase().includes(q) || d.employeeName.toLowerCase().includes(q));
    }

    documents.sort((a, b) => b.uploadDate.localeCompare(a.uploadDate) || b.createdAt.localeCompare(a.createdAt));

    return res.json({ success: true, data: documents, total: documents.length });
  } catch (error: any) {
    return res.status(500).json({ success: false, message: error.message });
  }
});

// GET /api/documents/file/:id - Stream or download document file directly from MongoDB or memory
router.get("/file/:id", async (req, res) => {
  try {
    const { id } = req.params;
    const mongoDb = getMongoDb();

    // 1. Check MongoDB Atlas persistent file store
    if (mongoDb && isMongoConnected()) {
      const fileDoc = await mongoDb.collection("documentFiles").findOne({ _id: id as any });
      if (fileDoc && fileDoc.data) {
        const fileBuffer = Buffer.isBuffer(fileDoc.data)
          ? fileDoc.data
          : Buffer.from(fileDoc.data.buffer || fileDoc.data);
        res.setHeader("Content-Type", fileDoc.contentType || "application/pdf");
        res.setHeader("Content-Disposition", `inline; filename="${encodeURIComponent(fileDoc.filename)}"`);
        return res.send(fileBuffer);
      }
    }

    // 2. Check in-memory fallback store
    const memFile = memoryFileStore.get(id);
    if (memFile) {
      res.setHeader("Content-Type", memFile.contentType);
      res.setHeader("Content-Disposition", `inline; filename="${encodeURIComponent(memFile.filename)}"`);
      return res.send(memFile.buffer);
    }

    // 3. Document metadata preview fallback for enterprise demo records
    const db = getDb();
    const doc = db.documents.find((d) => d.id === id);
    if (doc) {
      res.setHeader("Content-Type", "text/html");
      return res.send(`
        <!DOCTYPE html>
        <html>
          <head>
            <meta charset="utf-8" />
            <title>${doc.name} - Bharat Enterprise EMS</title>
            <style>
              body { font-family: -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif; background: #f8fafc; padding: 40px; margin: 0; }
              .card { max-width: 520px; margin: 40px auto; background: white; border-radius: 12px; padding: 32px; box-shadow: 0 4px 16px rgba(0,0,0,0.06); border: 1px solid #e2e8f0; }
              h2 { margin-top: 0; color: #0f172a; font-size: 20px; }
              .meta { margin: 16px 0; font-size: 14px; color: #475569; }
              .meta p { margin: 8px 0; }
              .badge { display: inline-block; padding: 4px 10px; border-radius: 9999px; background: #e0f2fe; color: #0369a1; font-weight: 600; font-size: 12px; }
              .note { font-size: 12px; color: #94a3b8; border-top: 1px solid #f1f5f9; padding-top: 16px; margin-top: 24px; line-height: 1.5; }
            </style>
          </head>
          <body>
            <div class="card">
              <span class="badge">${doc.type}</span>
              <h2>${doc.name}</h2>
              <div class="meta">
                <p><strong>Employee:</strong> ${doc.employeeName} (${doc.employeeId})</p>
                <p><strong>Uploaded By:</strong> ${doc.uploadedBy}</p>
                <p><strong>Upload Date:</strong> ${doc.uploadDate}</p>
                <p><strong>File Size:</strong> ${doc.fileSize}</p>
              </div>
              <div class="note">
                This demo document record is registered in the system. ${isMongoConnected() ? "Newly uploaded documents are securely streamed directly from MongoDB Atlas persistent storage." : "MongoDB persistent storage is currently unavailable (running in transient fallback mode)."}
              </div>
            </div>
          </body>
        </html>
      `);
    }

    return res.status(404).json({ success: false, message: "Document file not found." });
  } catch (err: any) {
    return res.status(500).json({ success: false, message: "Error retrieving document file: " + err.message });
  }
});

// GET /api/documents/:id/download
router.get("/:id/download", verifyToken, async (req: AuthRequest, res) => {
  return res.redirect(`/api/documents/file/${req.params.id}`);
});

// POST /api/documents/upload
router.post("/upload", verifyToken, upload.single("file"), async (req: AuthRequest, res) => {
  try {
    const db = getDb();
    const user = req.user!;
    const { name, type = "Other", employeeId } = req.body;

    const targetEmpId = employeeId || user.employeeId;
    const employee = db.employees.find((e) => e.id === targetEmpId);
    const empName = employee ? `${employee.firstName} ${employee.lastName}` : user.name;

    const docId = `doc-${Date.now()}-${Math.random().toString(36).substring(2, 6)}`;
    const originalFileName = req.file ? req.file.originalname : "Document.pdf";
    const fileName = name || originalFileName;
    const fileSize = req.file ? `${(req.file.size / (1024 * 1024)).toFixed(2)} MB` : "1.2 MB";
    const fileUrl = `/api/documents/file/${docId}`;

    // Persist file data to MongoDB Atlas documentFiles collection or in-memory fallback
    if (req.file) {
      const mongoDb = getMongoDb();
      if (mongoDb && isMongoConnected()) {
        await mongoDb.collection("documentFiles").replaceOne(
          { _id: docId as any },
          {
            _id: docId as any,
            docId,
            filename: originalFileName,
            contentType: req.file.mimetype || "application/octet-stream",
            size: req.file.size,
            data: req.file.buffer,
            createdAt: new Date().toISOString()
          },
          { upsert: true }
        );
      } else {
        if (process.env.NODE_ENV === "production") {
          throw new Error("File storage error: MongoDB is unavailable. Document uploads cannot be accepted in production without persistent database storage.");
        }
        memoryFileStore.set(docId, {
          filename: originalFileName,
          contentType: req.file.mimetype || "application/octet-stream",
          buffer: req.file.buffer,
          size: req.file.size
        });
      }
    }

    const newDoc: IDocument = {
      id: docId,
      name: fileName,
      type: type as any,
      employeeId: targetEmpId,
      employeeName: empName,
      uploadedBy: user.name,
      uploadDate: new Date().toISOString().split("T")[0],
      fileSize,
      fileUrl,
      createdAt: new Date().toISOString()
    };

    db.documents.unshift(newDoc);
    await saveDb("documents");

    return res.status(201).json({ success: true, message: "Document uploaded successfully.", data: newDoc });
  } catch (error: any) {
    return res.status(500).json({ success: false, message: error.message });
  }
});

// DELETE /api/documents/:id
router.delete("/:id", verifyToken, async (req: AuthRequest, res) => {
  try {
    const db = getDb();
    const id = req.params.id;
    const index = db.documents.findIndex((d) => d.id === id);
    if (index === -1) {
      return res.status(404).json({ success: false, message: "Document not found." });
    }

    const doc = db.documents[index];
    if (req.user!.role === "Employee" && doc.employeeId !== req.user!.employeeId) {
      return res.status(403).json({ success: false, message: "Unauthorized to delete this document." });
    }

    db.documents.splice(index, 1);
    await saveDb("documents");

    // Remove associated binary data from MongoDB or memory store
    const mongoDb = getMongoDb();
    if (mongoDb && isMongoConnected()) {
      await mongoDb.collection("documentFiles").deleteOne({ _id: id as any }).catch(() => {});
    }
    memoryFileStore.delete(id);

    return res.json({ success: true, message: "Document deleted." });
  } catch (error: any) {
    return res.status(500).json({ success: false, message: error.message });
  }
});

export default router;
