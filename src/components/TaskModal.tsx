import React, { useState, useEffect } from "react";
import { Modal } from "./Modal";
import { Task, Employee } from "../types";
import { api } from "../services/api";
import { useToast } from "../context/ToastContext";

const EMPTY_EMPLOYEES: Employee[] = [];

interface TaskModalProps {
  isOpen: boolean;
  onClose: () => void;
  task?: Task | null;
  employees?: Employee[];
  onSuccess: () => void;
}

export const TaskModal: React.FC<TaskModalProps> = ({
  isOpen,
  onClose,
  task = null,
  employees: propEmployees = EMPTY_EMPLOYEES,
  onSuccess
}) => {
  const { success, error } = useToast();
  const [loading, setLoading] = useState(false);
  const [employees, setEmployees] = useState<Employee[]>(propEmployees);

  const [formData, setFormData] = useState({
    title: "",
    description: "",
    assignedEmployeeId: "",
    priority: "Medium" as "Low" | "Medium" | "High" | "Critical",
    startDate: new Date().toISOString().split("T")[0],
    dueDate: new Date(Date.now() + 7 * 86400000).toISOString().split("T")[0],
    status: "Todo" as "Todo" | "In Progress" | "Completed" | "Overdue",
    progressPercent: 0
  });

  // Employee loading: runs independently of form initialization
  // Does NOT reset form fields (title, description, dates, etc.)
  useEffect(() => {
    if (!isOpen) return;

    if (propEmployees.length > 0) {
      setEmployees(propEmployees);
      setFormData((prev) => {
        if (prev.assignedEmployeeId || propEmployees.length === 0) {
          return prev;
        }
        return {
          ...prev,
          assignedEmployeeId: propEmployees[0].id
        };
      });
      return;
    }

    let isSubscribed = true;
    api.getEmployees({ limit: 100 })
      .then((res) => {
        if (!isSubscribed) return;
        if (res.success && res.data) {
          setEmployees(res.data);

          setFormData((prev) => {
            if (prev.assignedEmployeeId || !res.data || res.data.length === 0) {
              return prev;
            }

            return {
              ...prev,
              assignedEmployeeId: res.data[0].id
            };
          });
        }
      })
      .catch(() => {});

    return () => {
      isSubscribed = false;
    };
  }, [isOpen, propEmployees]);

  // Form initialization: runs strictly on modal open or task change
  // Crucially: MUST NOT depend on `employees`
  useEffect(() => {
    if (!isOpen) return;

    if (task) {
      setFormData({
        title: task.title ?? "",
        description: task.description ?? "",
        assignedEmployeeId: task.assignedEmployeeId ?? "",
        priority: task.priority ?? "Medium",
        startDate: task.startDate ?? new Date().toISOString().split("T")[0],
        dueDate: task.dueDate ?? new Date(Date.now() + 7 * 86400000).toISOString().split("T")[0],
        status: task.status ?? "Todo",
        progressPercent: task.progressPercent ?? 0
      });
    } else {
      setFormData({
        title: "",
        description: "",
        assignedEmployeeId: "",
        priority: "Medium",
        startDate: new Date().toISOString().split("T")[0],
        dueDate: new Date(Date.now() + 7 * 86400000).toISOString().split("T")[0],
        status: "Todo",
        progressPercent: 0
      });
    }
  }, [task, isOpen]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!formData.title.trim()) {
      error("Task title is required.");
      return;
    }
    if (!formData.assignedEmployeeId) {
      error("Please select an employee to assign this task.");
      return;
    }
    if (!formData.dueDate) {
      error("Due date is required.");
      return;
    }

    setLoading(true);
    try {
      if (task) {
        await api.updateTask(task.id, formData);
        success("Task updated successfully.");
      } else {
        await api.createTask(formData);
        success("Task created and assigned.");
      }
      onSuccess();
      onClose();
    } catch (err: any) {
      error(err.message || "Failed to save task.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <Modal
      isOpen={isOpen}
      onClose={onClose}
      title={task ? "Edit Task" : "Assign New Task"}
      subtitle="Track project deliverables, milestones, and employee velocity."
      maxWidth="lg"
    >
      <form onSubmit={handleSubmit} className="space-y-4 text-xs sm:text-sm">
        <div>
          <label htmlFor="task-title-input" className="block text-xs font-semibold text-zinc-700 dark:text-zinc-300 mb-1">
            Task Title *
          </label>
          <input
            id="task-title-input"
            name="title"
            type="text"
            required
            autoComplete="off"
            value={formData.title}
            onChange={(e) =>
              setFormData((prev) => ({
                ...prev,
                title: e.target.value
              }))
            }
            placeholder="e.g. Implement OAuth 2.0 PKCE Flow"
            className="w-full px-3.5 py-2.5 bg-zinc-50 dark:bg-zinc-800/80 border border-zinc-200 dark:border-zinc-700 rounded-xl text-zinc-900 dark:text-white outline-none focus:border-orange-500 focus:ring-2 focus:ring-orange-500/20"
          />
        </div>

        <div>
          <label htmlFor="task-assignee-select" className="block text-xs font-semibold text-zinc-700 dark:text-zinc-300 mb-1">
            Assignee *
          </label>
          <select
            id="task-assignee-select"
            name="assignedEmployeeId"
            required
            value={formData.assignedEmployeeId}
            onChange={(e) =>
              setFormData((prev) => ({
                ...prev,
                assignedEmployeeId: e.target.value
              }))
            }
            className="w-full px-3.5 py-2.5 bg-zinc-50 dark:bg-zinc-800/80 border border-zinc-200 dark:border-zinc-700 rounded-xl text-zinc-900 dark:text-white outline-none focus:border-orange-500 focus:ring-2 focus:ring-orange-500/20"
          >
            {!formData.assignedEmployeeId && (
              <option value="" disabled>
                Select an assignee...
              </option>
            )}
            {formData.assignedEmployeeId && !employees.some((e) => e.id === formData.assignedEmployeeId) && (
              <option value={formData.assignedEmployeeId}>
                {task?.assignedEmployeeName || "Current Assignee"} ({task?.departmentName || ""})
              </option>
            )}
            {employees.map((e) => (
              <option key={e.id} value={e.id}>
                {e.firstName} {e.lastName} ({e.position} - {e.departmentName})
              </option>
            ))}
          </select>
        </div>

        <div className="grid grid-cols-2 gap-3">
          <div>
            <label htmlFor="task-priority-select" className="block text-xs font-semibold text-zinc-700 dark:text-zinc-300 mb-1">
              Priority
            </label>
            <select
              id="task-priority-select"
              name="priority"
              value={formData.priority}
              onChange={(e) =>
                setFormData((prev) => ({
                  ...prev,
                  priority: e.target.value as "Low" | "Medium" | "High" | "Critical"
                }))
              }
              className="w-full px-3.5 py-2.5 bg-zinc-50 dark:bg-zinc-800/80 border border-zinc-200 dark:border-zinc-700 rounded-xl text-zinc-900 dark:text-white outline-none focus:border-orange-500 focus:ring-2 focus:ring-orange-500/20"
            >
              <option value="Low">Low</option>
              <option value="Medium">Medium</option>
              <option value="High">High</option>
              <option value="Critical">Critical</option>
            </select>
          </div>
          <div>
            <label htmlFor="task-status-select" className="block text-xs font-semibold text-zinc-700 dark:text-zinc-300 mb-1">
              Status
            </label>
            <select
              id="task-status-select"
              name="status"
              value={formData.status}
              onChange={(e) =>
                setFormData((prev) => ({
                  ...prev,
                  status: e.target.value as "Todo" | "In Progress" | "Completed" | "Overdue"
                }))
              }
              className="w-full px-3.5 py-2.5 bg-zinc-50 dark:bg-zinc-800/80 border border-zinc-200 dark:border-zinc-700 rounded-xl text-zinc-900 dark:text-white outline-none focus:border-orange-500 focus:ring-2 focus:ring-orange-500/20"
            >
              <option value="Todo">Todo</option>
              <option value="In Progress">In Progress</option>
              <option value="Completed">Completed</option>
              <option value="Overdue">Overdue</option>
            </select>
          </div>
        </div>

        <div className="grid grid-cols-2 gap-3">
          <div>
            <label htmlFor="task-start-date-input" className="block text-xs font-semibold text-zinc-700 dark:text-zinc-300 mb-1">
              Start Date
            </label>
            <input
              id="task-start-date-input"
              name="startDate"
              type="date"
              value={formData.startDate}
              onChange={(e) =>
                setFormData((prev) => ({
                  ...prev,
                  startDate: e.target.value
                }))
              }
              className="w-full px-3.5 py-2.5 bg-zinc-50 dark:bg-zinc-800/80 border border-zinc-200 dark:border-zinc-700 rounded-xl text-zinc-900 dark:text-white outline-none focus:border-orange-500 focus:ring-2 focus:ring-orange-500/20"
            />
          </div>
          <div>
            <label htmlFor="task-due-date-input" className="block text-xs font-semibold text-zinc-700 dark:text-zinc-300 mb-1">
              Due Date *
            </label>
            <input
              id="task-due-date-input"
              name="dueDate"
              type="date"
              required
              value={formData.dueDate}
              onChange={(e) =>
                setFormData((prev) => ({
                  ...prev,
                  dueDate: e.target.value
                }))
              }
              className="w-full px-3.5 py-2.5 bg-zinc-50 dark:bg-zinc-800/80 border border-zinc-200 dark:border-zinc-700 rounded-xl text-zinc-900 dark:text-white outline-none focus:border-orange-500 focus:ring-2 focus:ring-orange-500/20"
            />
          </div>
        </div>

        <div>
          <div className="flex justify-between items-center mb-1">
            <label htmlFor="task-progress-input" className="text-xs font-semibold text-zinc-700 dark:text-zinc-300">
              Completion Progress
            </label>
            <span className="text-xs font-bold text-orange-500 font-mono">{formData.progressPercent}%</span>
          </div>
          <input
            id="task-progress-input"
            name="progressPercent"
            type="range"
            min="0"
            max="100"
            step="5"
            value={formData.progressPercent}
            onChange={(e) =>
              setFormData((prev) => ({
                ...prev,
                progressPercent: Number(e.target.value)
              }))
            }
            className="w-full h-2 bg-zinc-200 dark:bg-zinc-700 rounded-lg appearance-none cursor-pointer accent-orange-500"
          />
        </div>

        <div>
          <label htmlFor="task-description-input" className="block text-xs font-semibold text-zinc-700 dark:text-zinc-300 mb-1">
            Description & Requirements
          </label>
          <textarea
            id="task-description-input"
            name="description"
            rows={3}
            value={formData.description}
            onChange={(e) =>
              setFormData((prev) => ({
                ...prev,
                description: e.target.value
              }))
            }
            placeholder="Detailed description of scope and acceptance criteria..."
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
            {task ? "Update Task" : "Create Task"}
          </button>
        </div>
      </form>
    </Modal>
  );
};
