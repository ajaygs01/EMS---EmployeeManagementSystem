import React, { useState, useEffect } from "react";
import { Modal } from "./Modal";
import { PerformanceReview, Employee } from "../types";
import { api } from "../services/api";
import { useToast } from "../context/ToastContext";

interface PerformanceModalProps {
  isOpen: boolean;
  onClose: () => void;
  review?: PerformanceReview | null;
  employees?: Employee[];
  onSuccess: () => void;
}

export const PerformanceModal: React.FC<PerformanceModalProps> = ({
  isOpen,
  onClose,
  review = null,
  employees: propEmployees = [],
  onSuccess
}) => {
  const { success, error } = useToast();
  const [loading, setLoading] = useState(false);
  const [employees, setEmployees] = useState<Employee[]>(propEmployees);

  const [formData, setFormData] = useState({
    employeeId: propEmployees[0]?.id || "",
    reviewPeriod: "Q2 2026",
    productivityScore: 4.5,
    qualityScore: 4.5,
    teamworkScore: 4.5,
    communicationScore: 4.5,
    leadershipScore: 4.5,
    strengths: "",
    areasForImprovement: "",
    managerComments: ""
  });

  useEffect(() => {
    if (propEmployees.length > 0) {
      setEmployees(propEmployees);
    } else if (isOpen) {
      api.getEmployees({ limit: 100 }).then((res) => {
        if (res.success && res.data) {
          setEmployees(res.data);
          if (!formData.employeeId && res.data.length > 0) {
            setFormData((prev) => ({ ...prev, employeeId: res.data[0].id }));
          }
        }
      }).catch(() => {});
    }
  }, [isOpen, propEmployees]);

  const calculatedOverall = Number(
    (
      (formData.productivityScore +
        formData.qualityScore +
        formData.teamworkScore +
        formData.communicationScore +
        formData.leadershipScore) /
      5
    ).toFixed(1)
  );

  let ratingBadge = "Good";
  if (calculatedOverall >= 4.5) ratingBadge = "Excellent";
  else if (calculatedOverall >= 4.0) ratingBadge = "Very Good";
  else if (calculatedOverall >= 3.0) ratingBadge = "Good";
  else if (calculatedOverall >= 2.0) ratingBadge = "Needs Improvement";
  else ratingBadge = "Poor";

  useEffect(() => {
    if (review) {
      setFormData({
        employeeId: review.employeeId,
        reviewPeriod: review.reviewPeriod,
        productivityScore: review.productivityScore,
        qualityScore: review.qualityScore,
        teamworkScore: review.teamworkScore,
        communicationScore: review.communicationScore,
        leadershipScore: review.leadershipScore,
        strengths: review.strengths,
        areasForImprovement: review.areasForImprovement,
        managerComments: review.managerComments
      });
    } else {
      setFormData({
        employeeId: employees[0]?.id || "",
        reviewPeriod: "Q2 2026",
        productivityScore: 4.5,
        qualityScore: 4.5,
        teamworkScore: 4.5,
        communicationScore: 4.5,
        leadershipScore: 4.5,
        strengths: "",
        areasForImprovement: "",
        managerComments: ""
      });
    }
  }, [review, employees, isOpen]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!formData.employeeId || !formData.reviewPeriod) {
      error("Employee and review period are required.");
      return;
    }

    setLoading(true);
    try {
      if (review) {
        await api.updatePerformance(review.id, formData);
        success("Performance evaluation updated.");
      } else {
        await api.createPerformance(formData);
        success("Performance review submitted and finalized.");
      }
      onSuccess();
      onClose();
    } catch (err: any) {
      error(err.message || "Failed to save evaluation.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <Modal
      isOpen={isOpen}
      onClose={onClose}
      title={review ? "Edit Performance Review" : "Conduct Performance Review"}
      subtitle="Score employee competencies across 5 pillars with qualitative feedback."
      maxWidth="2xl"
    >
      <form onSubmit={handleSubmit} className="space-y-4 text-xs sm:text-sm">
        <div className="grid grid-cols-2 gap-3">
          <div>
            <label className="block text-xs font-semibold text-zinc-700 dark:text-zinc-300 mb-1">Employee *</label>
            <select
              required
              disabled={!!review}
              value={formData.employeeId}
              onChange={(e) => setFormData({ ...formData, employeeId: e.target.value })}
              className="w-full px-3.5 py-2.5 bg-zinc-50 dark:bg-zinc-800/80 border border-zinc-200 dark:border-zinc-700 rounded-xl text-zinc-900 dark:text-white outline-none focus:border-orange-500 focus:ring-2 focus:ring-orange-500/20 disabled:opacity-60"
            >
              {employees.map((e) => (
                <option key={e.id} value={e.id}>
                  {e.firstName} {e.lastName} ({e.position})
                </option>
              ))}
            </select>
          </div>
          <div>
            <label className="block text-xs font-semibold text-zinc-700 dark:text-zinc-300 mb-1">Review Period *</label>
            <input
              type="text"
              required
              value={formData.reviewPeriod}
              onChange={(e) => setFormData({ ...formData, reviewPeriod: e.target.value })}
              placeholder="e.g. Q2 2026 or Annual 2026"
              className="w-full px-3.5 py-2.5 bg-zinc-50 dark:bg-zinc-800/80 border border-zinc-200 dark:border-zinc-700 rounded-xl text-zinc-900 dark:text-white outline-none focus:border-orange-500 focus:ring-2 focus:ring-orange-500/20 font-mono"
            />
          </div>
        </div>

        {/* 5 Rating Metrics */}
        <div className="bg-zinc-50 dark:bg-zinc-800/60 p-4 rounded-xl space-y-3 border border-zinc-200 dark:border-zinc-700 card-3d">
          <div className="flex justify-between items-center pb-2 border-b border-zinc-200 dark:border-zinc-700">
            <span className="font-bold text-zinc-900 dark:text-white text-xs uppercase tracking-wider">Evaluation Metrics (1-5)</span>
            <span className="font-extrabold text-orange-500 dark:text-orange-400 text-sm font-mono">
              Overall: {calculatedOverall} / 5.0 ({ratingBadge})
            </span>
          </div>

          {[
            { label: "Productivity & Velocity", key: "productivityScore" },
            { label: "Work Quality & Accuracy", key: "qualityScore" },
            { label: "Teamwork & Culture", key: "teamworkScore" },
            { label: "Communication & Clarity", key: "communicationScore" },
            { label: "Leadership & Initiative", key: "leadershipScore" }
          ].map((metric) => (
            <div key={metric.key} className="flex items-center justify-between gap-4">
              <span className="text-xs font-medium text-zinc-700 dark:text-zinc-300 w-44">{metric.label}</span>
              <input
                type="range"
                min="1"
                max="5"
                step="0.5"
                value={(formData as any)[metric.key]}
                onChange={(e) => setFormData({ ...formData, [metric.key]: Number(e.target.value) })}
                className="flex-1 h-2 bg-zinc-200 dark:bg-zinc-700 rounded-lg appearance-none cursor-pointer accent-orange-500"
              />
              <span className="w-8 text-right font-bold text-zinc-900 dark:text-white text-xs font-mono">
                {(formData as any)[metric.key].toFixed(1)}
              </span>
            </div>
          ))}
        </div>

        <div>
          <label className="block text-xs font-semibold text-zinc-700 dark:text-zinc-300 mb-1">Key Strengths & Achievements</label>
          <textarea
            rows={2}
            value={formData.strengths}
            onChange={(e) => setFormData({ ...formData, strengths: e.target.value })}
            placeholder="Highlight major project outcomes and positive behaviors..."
            className="w-full px-3.5 py-2.5 bg-zinc-50 dark:bg-zinc-800/80 border border-zinc-200 dark:border-zinc-700 rounded-xl text-zinc-900 dark:text-white outline-none focus:border-orange-500 focus:ring-2 focus:ring-orange-500/20 resize-none"
          />
        </div>

        <div>
          <label className="block text-xs font-semibold text-zinc-700 dark:text-zinc-300 mb-1">Growth & Development Areas</label>
          <textarea
            rows={2}
            value={formData.areasForImprovement}
            onChange={(e) => setFormData({ ...formData, areasForImprovement: e.target.value })}
            placeholder="Actionable recommendations for continued career progression..."
            className="w-full px-3.5 py-2.5 bg-zinc-50 dark:bg-zinc-800/80 border border-zinc-200 dark:border-zinc-700 rounded-xl text-zinc-900 dark:text-white outline-none focus:border-orange-500 focus:ring-2 focus:ring-orange-500/20 resize-none"
          />
        </div>

        <div>
          <label className="block text-xs font-semibold text-zinc-700 dark:text-zinc-300 mb-1">Manager Executive Feedback</label>
          <textarea
            rows={2}
            value={formData.managerComments}
            onChange={(e) => setFormData({ ...formData, managerComments: e.target.value })}
            placeholder="Summary comments for annual performance and incentive cycles..."
            className="w-full px-3.5 py-2.5 bg-zinc-50 dark:bg-zinc-800/80 border border-zinc-200 dark:border-zinc-700 rounded-xl text-zinc-900 dark:text-white outline-none focus:border-orange-500 focus:ring-2 focus:ring-orange-500/20 resize-none"
          />
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
            {review ? "Update Review" : "Publish Review"}
          </button>
        </div>
      </form>
    </Modal>
  );
};
