import React, { useState, useEffect } from "react";
import {
  TrendingUp,
  Plus,
  Star,
  Award,
  Users,
  Search,
  Filter,
  CheckCircle2,
  Sparkles,
  MessageSquare
} from "lucide-react";
import { PerformanceReview, Department } from "../types";
import { api } from "../services/api";
import { useAuth } from "../context/AuthContext";
import { useToast } from "../context/ToastContext";
import { StatusBadge } from "../components/StatusBadge";
import { PerformanceModal } from "../components/PerformanceModal";

interface PerformancePageProps {
  onNavigate: (path: string) => void;
  onSelectEmployee?: (id: string) => void;
}

export const PerformancePage: React.FC<PerformancePageProps> = ({ onNavigate, onSelectEmployee }) => {
  const { user } = useAuth();
  const { showToast } = useToast();

  const [reviews, setReviews] = useState<PerformanceReview[]>([]);
  const [departments, setDepartments] = useState<Department[]>([]);
  const [loading, setLoading] = useState(true);

  // Filters
  const [selectedPeriod, setSelectedPeriod] = useState("Q2 2026");
  const [selectedDept, setSelectedDept] = useState("");
  const [search, setSearch] = useState("");

  // Modal
  const [isCreateOpen, setIsCreateOpen] = useState(false);
  const [editingReview, setEditingReview] = useState<PerformanceReview | null>(null);

  const canReview = user?.role === "Super Admin" || user?.role === "HR Admin" || user?.role === "Manager";

  const fetchReviews = async () => {
    try {
      setLoading(true);
      const [perfRes, deptRes] = await Promise.all([
        api.getPerformances({
          period: selectedPeriod,
          departmentId: selectedDept,
          search
        }),
        api.getDepartments()
      ]);

      if (perfRes.success) {
        setReviews(perfRes.data);
      }
      if (deptRes.success) {
        setDepartments(deptRes.data);
      }
    } catch (err: any) {
      showToast(err.message || "Failed to load performance reviews", "error");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchReviews();
  }, [selectedPeriod, selectedDept, search]);

  const avgScore = reviews.length > 0
    ? Number((reviews.reduce((s, r) => s + r.overallScore, 0) / reviews.length).toFixed(2))
    : 4.5;
  const excellentCount = reviews.filter((r) => r.ratingLevel === "Excellent").length;
  const veryGoodCount = reviews.filter((r) => r.ratingLevel === "Very Good").length;

  return (
    <div className="space-y-6 pb-12">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-black tracking-tight text-zinc-900 dark:text-white flex items-center gap-2.5">
            <TrendingUp className="w-7 h-7 text-orange-600 dark:text-orange-400" />
            Performance & KPI Appraisals
          </h1>
          <p className="text-xs sm:text-sm text-zinc-500 dark:text-zinc-400 mt-1">
            Quarterly evaluations, multi-factor scoring, strength matrices, and growth roadmaps
          </p>
        </div>

        {canReview && (
          <button
            onClick={() => setIsCreateOpen(true)}
            className="px-4 py-2.5 rounded-xl text-xs font-bold bg-gradient-to-r from-orange-600 to-amber-600 hover:from-orange-500 hover:to-amber-500 text-white flex items-center gap-2 shadow-md shadow-orange-600/20 transition-all hover:scale-[1.02] active:scale-95 shrink-0 cursor-pointer"
          >
            <Plus className="w-4 h-4" />
            <span>New Performance Review</span>
          </button>
        )}
      </div>

      {/* KPI Stats Bar */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        <div className="bg-white/95 dark:bg-zinc-950/90 backdrop-blur-xl p-5 rounded-3xl border border-zinc-200/90 dark:border-zinc-800/90 shadow-sm flex items-center gap-3">
          <div className="w-12 h-12 rounded-2xl bg-orange-50 dark:bg-orange-950/40 text-orange-600 dark:text-orange-400 flex items-center justify-center font-bold">
            <Star className="w-6 h-6 fill-current" />
          </div>
          <div>
            <div className="text-[11px] font-semibold text-zinc-500 uppercase tracking-wider">Average Score</div>
            <div className="text-2xl font-bold font-mono text-zinc-900 dark:text-white mt-0.5">
              {avgScore} / 5.0
            </div>
          </div>
        </div>

        <div className="bg-white/95 dark:bg-zinc-950/90 backdrop-blur-xl p-5 rounded-3xl border border-zinc-200/90 dark:border-zinc-800/90 shadow-sm flex items-center gap-3">
          <div className="w-12 h-12 rounded-2xl bg-emerald-50 dark:bg-emerald-950/40 text-emerald-600 dark:text-emerald-400 flex items-center justify-center font-bold">
            <Award className="w-6 h-6" />
          </div>
          <div>
            <div className="text-[11px] font-semibold text-zinc-500 uppercase tracking-wider">High Performers</div>
            <div className="text-2xl font-bold text-zinc-900 dark:text-white mt-0.5">
              {excellentCount + veryGoodCount} Staff
            </div>
          </div>
        </div>

        <div className="bg-white/95 dark:bg-zinc-950/90 backdrop-blur-xl p-5 rounded-3xl border border-zinc-200/90 dark:border-zinc-800/90 shadow-sm flex items-center gap-3">
          <div className="w-12 h-12 rounded-2xl bg-amber-50 dark:bg-amber-950/40 text-amber-600 dark:text-amber-400 flex items-center justify-center font-bold">
            <Users className="w-5 h-5" />
          </div>
          <div>
            <div className="text-[11px] font-semibold text-zinc-500 uppercase tracking-wider">Evaluated Roster</div>
            <div className="text-2xl font-bold text-zinc-900 dark:text-white mt-0.5">
              {reviews.length} Completed
            </div>
          </div>
        </div>
      </div>

      {/* Filter Bar */}
      <div className="bg-white/95 dark:bg-zinc-950/90 backdrop-blur-xl p-4 rounded-2xl border border-zinc-200/90 dark:border-zinc-800/90 shadow-sm flex flex-wrap items-center gap-3 text-xs">
        <div className="flex items-center gap-2">
          <span className="font-semibold text-zinc-500">Period:</span>
          <select
            value={selectedPeriod}
            onChange={(e) => setSelectedPeriod(e.target.value)}
            className="px-3 py-2 bg-zinc-50 dark:bg-zinc-900 text-zinc-900 dark:text-zinc-100 rounded-xl border border-zinc-200 dark:border-zinc-800 focus:outline-none focus:border-orange-500"
          >
            <option value="Q2 2026">Q2 2026</option>
            <option value="Q1 2026">Q1 2026</option>
            <option value="Annual 2025">Annual 2025</option>
          </select>
        </div>

        <div className="relative flex-1 min-w-[200px]">
          <Search className="w-4 h-4 text-zinc-400 absolute left-3 top-1/2 -translate-y-1/2" />
          <input
            type="text"
            placeholder="Search employee or reviewer..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="w-full pl-9 pr-3 py-2 bg-zinc-50 dark:bg-zinc-900 text-zinc-900 dark:text-zinc-100 rounded-xl border border-zinc-200 dark:border-zinc-800 focus:outline-none focus:border-orange-500"
          />
        </div>

        <select
          value={selectedDept}
          onChange={(e) => setSelectedDept(e.target.value)}
          className="px-3 py-2 bg-zinc-50 dark:bg-zinc-900 text-zinc-900 dark:text-zinc-100 rounded-xl border border-zinc-200 dark:border-zinc-800 focus:outline-none focus:border-orange-500"
        >
          <option value="">All Departments</option>
          {departments.map((d) => (
            <option key={d.id} value={d.id}>
              {d.name}
            </option>
          ))}
        </select>
      </div>

      {/* Reviews Cards List */}
      {loading ? (
        <div className="py-20 text-center">
          <div className="w-8 h-8 border-3 border-orange-600 border-t-transparent rounded-full animate-spin mx-auto mb-3" />
          <p className="text-xs text-zinc-400">Loading performance reviews...</p>
        </div>
      ) : reviews.length === 0 ? (
        <div className="bg-white/95 dark:bg-zinc-950/90 rounded-3xl p-12 text-center border border-zinc-200 dark:border-zinc-800">
          <TrendingUp className="w-12 h-12 text-zinc-300 dark:text-zinc-600 mx-auto mb-3" />
          <h3 className="text-base font-bold text-zinc-900 dark:text-white">No reviews found</h3>
          <p className="text-xs text-zinc-500 mt-1">There are no appraisals logged for the selected period.</p>
        </div>
      ) : (
        <div className="space-y-5">
          {reviews.map((rev) => (
            <div
              key={rev.id}
              className="bg-white/95 dark:bg-zinc-950/90 rounded-3xl p-6 border border-zinc-200/90 dark:border-zinc-800/90 shadow-sm space-y-4"
            >
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 border-b border-zinc-100 dark:border-zinc-800 pb-4">
                <div>
                  <div className="flex items-center gap-2">
                    <h3
                      onClick={() => {
                        if (onSelectEmployee) onSelectEmployee(rev.employeeId);
                        onNavigate(`/employees/${rev.employeeId}`);
                      }}
                      className="font-bold text-base text-zinc-900 dark:text-white hover:text-orange-600 transition-colors cursor-pointer"
                    >
                      {rev.employeeName}
                    </h3>
                    <span className="text-xs text-zinc-400">• {rev.departmentName}</span>
                  </div>
                  <div className="text-xs text-zinc-500 mt-0.5">
                    Evaluated by {rev.reviewerName} on {rev.reviewDate} ({rev.reviewPeriod})
                  </div>
                </div>

                <div className="flex items-center gap-3">
                  <span className="text-2xl font-black text-orange-600 dark:text-orange-400 font-mono">
                    {rev.overallScore} / 5.0
                  </span>
                  <StatusBadge status={rev.ratingLevel} size="md" />
                </div>
              </div>

              {/* Multi-criteria Score Bars */}
              <div className="grid grid-cols-1 sm:grid-cols-5 gap-3 text-xs">
                {[
                  { label: "Productivity", score: rev.productivityScore },
                  { label: "Quality", score: rev.qualityScore },
                  { label: "Teamwork", score: rev.teamworkScore },
                  { label: "Communication", score: rev.communicationScore },
                  { label: "Leadership", score: rev.leadershipScore }
                ].map((crit) => (
                  <div key={crit.label} className="p-3 rounded-2xl bg-zinc-50 dark:bg-zinc-900/60 border border-zinc-200/60 dark:border-zinc-800/60 text-center">
                    <div className="text-[11px] text-zinc-500 dark:text-zinc-400 font-medium">{crit.label}</div>
                    <div className="text-base font-bold font-mono text-zinc-900 dark:text-white mt-0.5">
                      {crit.score}
                    </div>
                    <div className="w-full bg-zinc-200 dark:bg-zinc-800 h-1.5 rounded-full overflow-hidden mt-1.5">
                      <div
                        className="bg-gradient-to-r from-orange-500 to-amber-500 h-full rounded-full"
                        style={{ width: `${(crit.score / 5) * 100}%` }}
                      />
                    </div>
                  </div>
                ))}
              </div>

              {/* Feedback */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-xs pt-1">
                <div className="p-4 rounded-2xl bg-emerald-50/60 dark:bg-emerald-950/30 border border-emerald-200/60 dark:border-emerald-800/40">
                  <span className="font-bold text-emerald-800 dark:text-emerald-300 block mb-1">Key Strengths</span>
                  <p className="text-zinc-700 dark:text-zinc-300 leading-relaxed">{rev.strengths}</p>
                </div>
                <div className="p-4 rounded-2xl bg-amber-50/60 dark:bg-amber-950/30 border border-amber-200/60 dark:border-amber-800/40">
                  <span className="font-bold text-amber-800 dark:text-amber-300 block mb-1">
                    Areas for Improvement
                  </span>
                  <p className="text-zinc-700 dark:text-zinc-300 leading-relaxed">{rev.areasForImprovement}</p>
                </div>
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Create / Edit Review Modal */}
      <PerformanceModal
        isOpen={isCreateOpen}
        onClose={() => setIsCreateOpen(false)}
        onSuccess={() => {
          showToast("Performance review saved!", "success");
          fetchReviews();
        }}
      />
    </div>
  );
};
