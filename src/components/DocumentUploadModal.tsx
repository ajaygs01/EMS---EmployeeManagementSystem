import React, { useState, useRef } from "react";
import { UploadCloud, File, X } from "lucide-react";
import { Modal } from "./Modal";
import { Employee } from "../types";
import { api } from "../services/api";
import { useToast } from "../context/ToastContext";
import { useAuth } from "../context/AuthContext";

interface DocumentUploadModalProps {
  isOpen: boolean;
  onClose: () => void;
  employees?: Employee[];
  onSuccess: () => void;
}

export const DocumentUploadModal: React.FC<DocumentUploadModalProps> = ({
  isOpen,
  onClose,
  employees: propEmployees = [],
  onSuccess
}) => {
  const { user } = useAuth();
  const { success, error } = useToast();
  const [loading, setLoading] = useState(false);
  const [employees, setEmployees] = useState<Employee[]>(propEmployees);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const [name, setName] = useState("");
  const [type, setType] = useState("Offer letter");
  const [employeeId, setEmployeeId] = useState(user?.employeeId || "");
  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const [dragOver, setDragOver] = useState(false);

  React.useEffect(() => {
    if (propEmployees.length > 0) {
      setEmployees(propEmployees);
    } else if (isOpen && user?.role !== "Employee") {
      api.getEmployees({ limit: 100 }).then((res) => {
        if (res.success && res.data) {
          setEmployees(res.data);
        }
      }).catch(() => {});
    }
  }, [isOpen, propEmployees, user?.role]);

  const docTypes = [
    "Offer letter",
    "Experience letter",
    "Resume",
    "ID proof",
    "Certificates",
    "Payslips",
    "Policy",
    "Other"
  ];

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files[0]) {
      const f = e.target.files[0];
      setSelectedFile(f);
      if (!name) setName(f.name.replace(/\.[^/.]+$/, ""));
    }
  };

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault();
    setDragOver(false);
    if (e.dataTransfer.files && e.dataTransfer.files[0]) {
      const f = e.dataTransfer.files[0];
      setSelectedFile(f);
      if (!name) setName(f.name.replace(/\.[^/.]+$/, ""));
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!name.trim()) {
      error("Document name is required.");
      return;
    }

    setLoading(true);
    try {
      const formData = new FormData();
      formData.append("name", name);
      formData.append("type", type);
      formData.append("employeeId", employeeId || user?.employeeId || "");
      if (selectedFile) {
        formData.append("file", selectedFile);
      }

      await api.uploadDocument(formData);
      success("Document uploaded successfully to organization repository.");
      setSelectedFile(null);
      setName("");
      onSuccess();
      onClose();
    } catch (err: any) {
      error(err.message || "Failed to upload document.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <Modal isOpen={isOpen} onClose={onClose} title="Upload Document" subtitle="Secure employee document and policy repository." maxWidth="md">
      <form onSubmit={handleSubmit} className="space-y-4 text-xs sm:text-sm">
        <div>
          <label className="block text-xs font-semibold text-zinc-700 dark:text-zinc-300 mb-1">Document Title *</label>
          <input
            type="text"
            required
            value={name}
            onChange={(e) => setName(e.target.value)}
            placeholder="e.g. Employee Agreement 2026"
            className="w-full px-3.5 py-2.5 bg-zinc-50 dark:bg-zinc-800/80 border border-zinc-200 dark:border-zinc-700 rounded-xl text-zinc-900 dark:text-white outline-none focus:border-orange-500 focus:ring-2 focus:ring-orange-500/20"
          />
        </div>

        <div className="grid grid-cols-2 gap-3">
          <div>
            <label className="block text-xs font-semibold text-zinc-700 dark:text-zinc-300 mb-1">Document Type</label>
            <select
              value={type}
              onChange={(e) => setType(e.target.value)}
              className="w-full px-3.5 py-2.5 bg-zinc-50 dark:bg-zinc-800/80 border border-zinc-200 dark:border-zinc-700 rounded-xl text-zinc-900 dark:text-white outline-none focus:border-orange-500 focus:ring-2 focus:ring-orange-500/20"
            >
              {docTypes.map((t) => (
                <option key={t} value={t}>
                  {t}
                </option>
              ))}
            </select>
          </div>

          {user?.role !== "Employee" && (
            <div>
              <label className="block text-xs font-semibold text-zinc-700 dark:text-zinc-300 mb-1">Assigned Employee</label>
              <select
                value={employeeId}
                onChange={(e) => setEmployeeId(e.target.value)}
                className="w-full px-3.5 py-2.5 bg-zinc-50 dark:bg-zinc-800/80 border border-zinc-200 dark:border-zinc-700 rounded-xl text-zinc-900 dark:text-white outline-none focus:border-orange-500 focus:ring-2 focus:ring-orange-500/20"
              >
                {employees.map((e) => (
                  <option key={e.id} value={e.id}>
                    {e.firstName} {e.lastName}
                  </option>
                ))}
              </select>
            </div>
          )}
        </div>

        {/* Drag & Drop File Box */}
        <div>
          <label className="block text-xs font-semibold text-zinc-700 dark:text-zinc-300 mb-1">File Attachment (PDF, DOCX, PNG, JPG)</label>
          <div
            onDragOver={(e) => {
              e.preventDefault();
              setDragOver(true);
            }}
            onDragLeave={() => setDragOver(false)}
            onDrop={handleDrop}
            onClick={() => fileInputRef.current?.click()}
            className={`border-2 border-dashed rounded-2xl p-6 text-center cursor-pointer transition-colors ${
              dragOver
                ? "border-orange-500 bg-orange-500/10"
                : "border-zinc-300 dark:border-zinc-700 hover:border-orange-500/50 bg-zinc-50 dark:bg-zinc-800/40"
            }`}
          >
            <input ref={fileInputRef} type="file" onChange={handleFileChange} className="hidden" />
            <UploadCloud className="w-8 h-8 mx-auto text-orange-500 mb-2" />
            <p className="font-semibold text-zinc-800 dark:text-zinc-200 text-xs">
              Click to browse or drag & drop file here
            </p>
            <p className="text-[11px] text-zinc-400 mt-1">Up to 15 MB supported</p>

            {selectedFile && (
              <div className="mt-3 inline-flex items-center gap-2 px-3 py-1.5 rounded-lg bg-orange-950/80 text-orange-300 text-xs font-medium border border-orange-800/80">
                <File className="w-4 h-4" />
                <span>{selectedFile.name}</span>
                <button
                  type="button"
                  onClick={(e) => {
                    e.stopPropagation();
                    setSelectedFile(null);
                  }}
                  className="hover:text-rose-400 cursor-pointer"
                >
                  <X className="w-3.5 h-3.5" />
                </button>
              </div>
            )}
          </div>
        </div>

        <div className="flex justify-end gap-3 border-t border-zinc-100 dark:border-zinc-800 pt-4">
          <button
            type="button"
            onClick={onClose}
            disabled={loading}
            className="px-4 py-2.5 text-sm font-medium text-zinc-700 dark:text-zinc-300 hover:bg-zinc-100 dark:hover:bg-zinc-800 rounded-xl transition-colors cursor-pointer"
          >
            Cancel
          </button>
          <button
            type="submit"
            disabled={loading}
            className="px-5 py-2.5 text-sm font-bold rounded-xl text-white bg-gradient-to-r from-orange-600 to-amber-600 hover:from-orange-500 hover:to-amber-500 shadow-lg shadow-orange-600/30 transition-all flex items-center gap-2 cursor-pointer"
          >
            {loading && <span className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" />}
            Upload Document
          </button>
        </div>
      </form>
    </Modal>
  );
};
