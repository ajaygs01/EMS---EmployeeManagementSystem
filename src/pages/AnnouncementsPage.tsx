import React, { useState, useEffect } from "react";
import {
  Megaphone,
  Plus,
  Search,
  Filter,
  Calendar,
  AlertCircle,
  Tag,
  Paperclip,
  Trash2,
  Sparkles
} from "lucide-react";
import { Announcement } from "../types";
import { api } from "../services/api";
import { useAuth } from "../context/AuthContext";
import { useToast } from "../context/ToastContext";
import { StatusBadge } from "../components/StatusBadge";
import { AnnouncementModal } from "../components/AnnouncementModal";
import { ConfirmModal } from "../components/ConfirmModal";

interface AnnouncementsPageProps {
  onNavigate: (path: string) => void;
}

export const AnnouncementsPage: React.FC<AnnouncementsPageProps> = ({ onNavigate }) => {
  const { user } = useAuth();
  const { showToast } = useToast();

  const [announcements, setAnnouncements] = useState<Announcement[]>([]);
  const [loading, setLoading] = useState(true);

  // Filters
  const [selectedCategory, setSelectedCategory] = useState("");
  const [search, setSearch] = useState("");

  // Modals
  const [isCreateOpen, setIsCreateOpen] = useState(false);
  const [deletingAnnouncement, setDeletingAnnouncement] = useState<Announcement | null>(null);
  const [isDeleting, setIsDeleting] = useState(false);

  const canPost = user?.role === "Super Admin" || user?.role === "HR Admin" || user?.role === "Manager";

  const fetchAnnouncements = async () => {
    try {
      setLoading(true);
      const res = await api.getAnnouncements({
        category: selectedCategory,
        search
      });
      if (res.success) {
        setAnnouncements(res.data);
      }
    } catch (err: any) {
      showToast(err.message || "Failed to load announcements", "error");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchAnnouncements();
  }, [selectedCategory, search]);

  const handleDeleteConfirm = async () => {
    if (!deletingAnnouncement) return;
    try {
      setIsDeleting(true);
      const res = await api.deleteAnnouncement(deletingAnnouncement.id);
      if (res.success) {
        showToast("Announcement deleted", "success");
        setDeletingAnnouncement(null);
        fetchAnnouncements();
      }
    } catch (err: any) {
      showToast(err.message || "Failed to delete announcement", "error");
    } finally {
      setIsDeleting(false);
    }
  };

  const categories = ["General", "HR", "Events", "Holiday", "Policy", "Emergency"];

  return (
    <div className="space-y-6 pb-12">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-black tracking-tight text-zinc-900 dark:text-white flex items-center gap-2.5">
            <Megaphone className="w-7 h-7 text-orange-600 dark:text-orange-400" />
            Company Announcements & Notices
          </h1>
          <p className="text-xs sm:text-sm text-zinc-500 dark:text-zinc-400 mt-1">
            Broadcast organization updates, company holidays, policy changes, and events
          </p>
        </div>

        {canPost && (
          <button
            onClick={() => setIsCreateOpen(true)}
            className="px-4 py-2.5 rounded-xl text-xs font-bold bg-gradient-to-r from-orange-600 to-amber-600 hover:from-orange-500 hover:to-amber-500 text-white flex items-center gap-2 shadow-md shadow-orange-600/20 transition-all hover:scale-[1.02] active:scale-95 shrink-0 cursor-pointer"
          >
            <Plus className="w-4 h-4" />
            <span>Post Announcement</span>
          </button>
        )}
      </div>

      {/* Filter Category Tabs */}
      <div className="flex flex-wrap items-center gap-2 border-b border-zinc-200 dark:border-zinc-800 pb-3 text-xs font-semibold">
        <button
          onClick={() => setSelectedCategory("")}
          className={`px-3.5 py-1.5 rounded-xl transition-all cursor-pointer ${
            selectedCategory === ""
              ? "bg-gradient-to-r from-orange-600 to-amber-600 text-white font-bold shadow-xs"
              : "text-zinc-600 dark:text-zinc-400 hover:bg-zinc-100 dark:hover:bg-zinc-800"
          }`}
        >
          All Categories
        </button>
        {categories.map((cat) => (
          <button
            key={cat}
            onClick={() => setSelectedCategory(cat)}
            className={`px-3.5 py-1.5 rounded-xl transition-all cursor-pointer ${
              selectedCategory === cat
                ? "bg-gradient-to-r from-orange-600 to-amber-600 text-white font-bold shadow-xs"
                : "text-zinc-600 dark:text-zinc-400 hover:bg-zinc-100 dark:hover:bg-zinc-800"
            }`}
          >
            {cat}
          </button>
        ))}
      </div>

      {/* Announcements List */}
      {loading ? (
        <div className="py-20 text-center">
          <div className="w-8 h-8 border-3 border-orange-600 border-t-transparent rounded-full animate-spin mx-auto mb-3" />
          <p className="text-xs text-zinc-400">Loading notice board...</p>
        </div>
      ) : announcements.length === 0 ? (
        <div className="bg-white/95 dark:bg-zinc-950/90 rounded-3xl p-12 text-center border border-zinc-200 dark:border-zinc-800">
          <Megaphone className="w-12 h-12 text-zinc-300 dark:text-zinc-600 mx-auto mb-3" />
          <h3 className="text-base font-bold text-zinc-900 dark:text-white">No announcements posted</h3>
        </div>
      ) : (
        <div className="space-y-4">
          {announcements.map((item) => {
            const isUrgent = item.priority === "Urgent" || item.priority === "High";
            return (
              <div
                key={item.id}
                className={`bg-white/95 dark:bg-zinc-950/90 rounded-3xl p-6 border shadow-sm transition-all space-y-3 ${
                  isUrgent
                    ? "border-amber-300 dark:border-amber-800/80 bg-gradient-to-r from-amber-50/40 dark:from-amber-950/20 to-transparent"
                    : "border-zinc-200/90 dark:border-zinc-800/90"
                }`}
              >
                <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
                  <div className="flex items-center gap-2.5 flex-wrap">
                    <StatusBadge status={item.category} size="sm" />
                    <StatusBadge status={item.priority} size="sm" />
                    <h3 className="font-bold text-base text-zinc-900 dark:text-white">{item.title}</h3>
                  </div>

                  <div className="text-xs text-zinc-400 flex items-center gap-1.5 shrink-0">
                    <Calendar className="w-3.5 h-3.5" />
                    <span>{item.date}</span>
                  </div>
                </div>

                <p className="text-xs sm:text-sm text-zinc-600 dark:text-zinc-300 leading-relaxed whitespace-pre-line">
                  {item.description}
                </p>

                <div className="flex items-center justify-between pt-3 border-t border-zinc-100 dark:border-zinc-800 text-xs text-zinc-500">
                  <div>
                    Posted by <span className="font-semibold text-zinc-800 dark:text-zinc-200">{item.authorName}</span> ({item.authorRole})
                  </div>

                  {canPost && (
                    <button
                      onClick={() => setDeletingAnnouncement(item)}
                      className="p-1.5 rounded-lg text-zinc-400 hover:text-rose-600 hover:bg-zinc-100 dark:hover:bg-zinc-800 transition-colors cursor-pointer"
                      title="Delete Announcement"
                    >
                      <Trash2 className="w-4 h-4" />
                    </button>
                  )}
                </div>
              </div>
            );
          })}
        </div>
      )}

      {/* Post Announcement Modal */}
      <AnnouncementModal
        isOpen={isCreateOpen}
        onClose={() => setIsCreateOpen(false)}
        onSuccess={() => {
          showToast("Announcement published company-wide!", "success");
          fetchAnnouncements();
        }}
      />

      {/* Delete Announcement Modal */}
      <ConfirmModal
        isOpen={!!deletingAnnouncement}
        onClose={() => setDeletingAnnouncement(null)}
        onConfirm={handleDeleteConfirm}
        title="Delete Announcement"
        message={`Are you sure you want to remove announcement "${deletingAnnouncement?.title}"?`}
        confirmText="Delete"
        isDestructive={true}
        isLoading={isDeleting}
      />
    </div>
  );
};
