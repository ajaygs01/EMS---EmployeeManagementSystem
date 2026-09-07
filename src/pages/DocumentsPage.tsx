import React, { useState, useEffect } from "react";
import {
  FolderArchive,
  Upload,
  Search,
  Filter,
  FileText,
  Download,
  Trash2,
  Eye,
  FileSpreadsheet,
  FileCheck,
  Tag
} from "lucide-react";
import { DocumentItem } from "../types";
import { api } from "../services/api";
import { useAuth } from "../context/AuthContext";
import { useToast } from "../context/ToastContext";
import { DocumentUploadModal } from "../components/DocumentUploadModal";
import { ConfirmModal } from "../components/ConfirmModal";
import { StatusBadge } from "../components/StatusBadge";

interface DocumentsPageProps {
  onNavigate: (path: string) => void;
  onSelectEmployee?: (id: string) => void;
}

export const DocumentsPage: React.FC<DocumentsPageProps> = ({ onNavigate, onSelectEmployee }) => {
  const { user } = useAuth();
  const { showToast } = useToast();

  const [documents, setDocuments] = useState<DocumentItem[]>([]);
  const [loading, setLoading] = useState(true);

  // Filters
  const [selectedType, setSelectedType] = useState("");
  const [search, setSearch] = useState("");

  // Modals
  const [isUploadOpen, setIsUploadOpen] = useState(false);
  const [deletingDoc, setDeletingDoc] = useState<DocumentItem | null>(null);
  const [isDeleting, setIsDeleting] = useState(false);

  const fetchDocuments = async () => {
    try {
      setLoading(true);
      const res = await api.getDocuments({
        type: selectedType,
        search
      });
      if (res.success) {
        setDocuments(res.data);
      }
    } catch (err: any) {
      showToast(err.message || "Failed to load documents", "error");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchDocuments();
  }, [selectedType, search]);

  const handleDeleteConfirm = async () => {
    if (!deletingDoc) return;
    try {
      setIsDeleting(true);
      const res = await api.deleteDocument(deletingDoc.id);
      if (res.success) {
        showToast("Document deleted", "success");
        setDeletingDoc(null);
        fetchDocuments();
      }
    } catch (err: any) {
      showToast(err.message || "Failed to delete document", "error");
    } finally {
      setIsDeleting(false);
    }
  };

  const docTypes = [
    "Resume",
    "ID proof",
    "Certificates",
    "Offer letter",
    "Experience letter",
    "Payslips",
    "Policy",
    "Other"
  ];

  return (
    <div className="space-y-6 pb-12">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-black tracking-tight text-zinc-900 dark:text-white flex items-center gap-2.5 font-display">
            <FolderArchive className="w-7 h-7 text-orange-500" />
            Document Management Repository
          </h1>
          <p className="text-xs sm:text-sm text-zinc-500 dark:text-zinc-400 mt-1">
            Centralized document storage for onboarding packets, verified ID proofs, policies, and certificates
          </p>
        </div>

        <button
          onClick={() => setIsUploadOpen(true)}
          className="px-4 py-2.5 rounded-xl text-xs font-bold bg-gradient-to-r from-orange-600 to-amber-600 hover:from-orange-500 hover:to-amber-500 text-white flex items-center gap-2 shadow-lg shadow-orange-600/30 transition-all hover:scale-[1.02] active:scale-95 shrink-0 cursor-pointer"
        >
          <Upload className="w-4 h-4" />
          <span>Upload Document</span>
        </button>
      </div>

      {/* Filter Bar */}
      <div className="bg-white dark:bg-zinc-900/90 p-4 rounded-2xl border border-zinc-200 dark:border-zinc-800 shadow-sm flex flex-wrap items-center gap-3 text-xs card-3d">
        <div className="relative flex-1 min-w-[200px]">
          <Search className="w-4 h-4 text-zinc-400 absolute left-3 top-1/2 -translate-y-1/2" />
          <input
            type="text"
            placeholder="Search document name or employee..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="w-full pl-9 pr-3 py-2 bg-zinc-50 dark:bg-zinc-800 text-zinc-900 dark:text-zinc-100 rounded-xl border border-zinc-200 dark:border-zinc-700 focus:outline-none focus:border-orange-500"
          />
        </div>

        <select
          value={selectedType}
          onChange={(e) => setSelectedType(e.target.value)}
          className="px-3 py-2 bg-zinc-50 dark:bg-zinc-800 text-zinc-900 dark:text-zinc-100 rounded-xl border border-zinc-200 dark:border-zinc-700 focus:outline-none focus:border-orange-500"
        >
          <option value="">All Document Types</option>
          {docTypes.map((type) => (
            <option key={type} value={type}>
              {type}
            </option>
          ))}
        </select>
      </div>

      {/* Documents Grid */}
      {loading ? (
        <div className="py-20 text-center">
          <div className="w-8 h-8 border-3 border-orange-500 border-t-transparent rounded-full animate-spin mx-auto mb-3" />
          <p className="text-xs text-zinc-400">Loading document repository...</p>
        </div>
      ) : documents.length === 0 ? (
        <div className="bg-white dark:bg-zinc-900 rounded-3xl p-12 text-center border border-zinc-200 dark:border-zinc-800 card-3d">
          <FolderArchive className="w-12 h-12 text-zinc-400 dark:text-zinc-600 mx-auto mb-3" />
          <h3 className="text-base font-bold text-zinc-900 dark:text-white">No documents found</h3>
          <p className="text-xs text-zinc-500 mt-1">Upload the first employee file or document to get started.</p>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5">
          {documents.map((doc) => (
            <div
              key={doc.id}
              className="bg-white dark:bg-zinc-900/90 rounded-3xl p-5 border border-zinc-200 dark:border-zinc-800 shadow-sm hover:shadow-xl hover:border-orange-500/40 transition-all flex flex-col justify-between card-3d group"
            >
              <div>
                <div className="flex items-start justify-between gap-3 mb-3">
                  <div className="w-12 h-12 rounded-2xl bg-orange-500/10 text-orange-500 border border-orange-500/20 flex items-center justify-center font-bold shrink-0 group-hover:scale-105 transition-transform">
                    <FileText className="w-6 h-6" />
                  </div>
                  <StatusBadge status={doc.type} size="sm" />
                </div>

                <h3 className="font-bold text-sm text-zinc-900 dark:text-white leading-snug line-clamp-1 group-hover:text-orange-400 transition-colors">
                  {doc.name}
                </h3>
                <p className="text-xs text-zinc-400 mt-0.5">{doc.fileSize} • Uploaded {doc.uploadDate}</p>

                <div className="py-3 mt-3 border-t border-zinc-100 dark:border-zinc-800 text-xs text-zinc-500">
                  <span>Attached to: </span>
                  <span
                    onClick={() => {
                      if (onSelectEmployee) onSelectEmployee(doc.employeeId);
                      onNavigate(`/employees/${doc.employeeId}`);
                    }}
                    className="font-semibold text-zinc-800 dark:text-zinc-200 hover:text-orange-500 cursor-pointer"
                  >
                    {doc.employeeName}
                  </span>
                </div>
              </div>

              <div className="pt-2 flex items-center justify-between gap-2">
                <a
                  href={doc.fileUrl}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="flex-1 py-2 px-3 rounded-xl bg-zinc-100 dark:bg-zinc-800 hover:bg-orange-500/15 hover:text-orange-500 dark:hover:text-orange-400 text-zinc-700 dark:text-zinc-300 text-xs font-semibold flex items-center justify-center gap-1.5 transition-colors border border-transparent hover:border-orange-500/30 cursor-pointer"
                >
                  <Eye className="w-3.5 h-3.5" /> View File
                </a>

                <button
                  onClick={() => setDeletingDoc(doc)}
                  className="p-2 rounded-xl text-zinc-400 hover:text-rose-600 hover:bg-rose-50 dark:hover:bg-rose-950/40 transition-colors cursor-pointer"
                  title="Delete Document"
                >
                  <Trash2 className="w-4 h-4" />
                </button>
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Upload Document Modal */}
      <DocumentUploadModal
        isOpen={isUploadOpen}
        onClose={() => setIsUploadOpen(false)}
        onSuccess={() => {
          showToast("Document uploaded successfully!", "success");
          fetchDocuments();
        }}
      />

      {/* Delete Document Modal */}
      <ConfirmModal
        isOpen={!!deletingDoc}
        onClose={() => setDeletingDoc(null)}
        onConfirm={handleDeleteConfirm}
        title="Delete Document"
        message={`Are you sure you want to remove "${deletingDoc?.name}" from repository?`}
        confirmText="Delete"
        isDestructive={true}
        isLoading={isDeleting}
      />
    </div>
  );
};
