import React, { useState, useEffect } from "react";
import {
  CheckSquare,
  Plus,
  Grid,
  List,
  Search,
  Filter,
  Clock,
  User,
  Calendar,
  AlertTriangle,
  CheckCircle2,
  Trash2,
  Edit2,
  ArrowRight,
  RefreshCw
} from "lucide-react";
import { Task, Department } from "../types";
import { api } from "../services/api";
import { useAuth } from "../context/AuthContext";
import { useToast } from "../context/ToastContext";
import { StatusBadge } from "../components/StatusBadge";
import { TaskModal } from "../components/TaskModal";
import { ConfirmModal } from "../components/ConfirmModal";

interface TasksPageProps {
  onNavigate: (path: string) => void;
  onSelectEmployee?: (id: string) => void;
}

export const TasksPage: React.FC<TasksPageProps> = ({ onNavigate, onSelectEmployee }) => {
  const { user } = useAuth();
  const { showToast } = useToast();

  const [tasks, setTasks] = useState<Task[]>([]);
  const [departments, setDepartments] = useState<Department[]>([]);
  const [loading, setLoading] = useState(true);
  const [errorState, setErrorState] = useState<string | null>(null);

  // View & Filters
  const [viewMode, setViewMode] = useState<"kanban" | "list">("kanban");
  const [search, setSearch] = useState("");
  const [selectedPriority, setSelectedPriority] = useState("");
  const [selectedDept, setSelectedDept] = useState("");

  // Modals
  const [isCreateOpen, setIsCreateOpen] = useState(false);
  const [editingTask, setEditingTask] = useState<Task | null>(null);
  const [deletingTask, setDeletingTask] = useState<Task | null>(null);
  const [isDeleting, setIsDeleting] = useState(false);

  const canManageTasks = user?.role && ["Super Admin", "HR Admin", "Manager"].includes(user.role);

  const fetchTasks = async () => {
    try {
      setLoading(true);
      setErrorState(null);
      const [taskRes, deptRes] = await Promise.all([
        api.getTasks({
          search: search.trim(),
          priority: selectedPriority,
          departmentId: selectedDept
        }),
        api.getDepartments()
      ]);

      if (taskRes && taskRes.success) {
        setTasks(taskRes.data || []);
      } else {
        const msg = taskRes?.message || "Failed to load tasks";
        setErrorState(msg);
        showToast(msg, "error");
      }

      if (deptRes && deptRes.success) {
        setDepartments(deptRes.data || []);
      }
    } catch (err: any) {
      const msg = err.message || "Failed to load tasks";
      setErrorState(msg);
      showToast(msg, "error");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchTasks();
  }, [search, selectedPriority, selectedDept]);

  const handleUpdateStatus = async (taskId: string, newStatus: string, newProgress: number) => {
    try {
      const res = await api.updateTaskStatus(taskId, newStatus, newProgress);
      if (res.success) {
        showToast(`Task moved to ${newStatus}`, "success");
        fetchTasks();
      }
    } catch (err: any) {
      showToast(err.message || "Failed to update task status", "error");
    }
  };

  const handleDeleteConfirm = async () => {
    if (!deletingTask) return;
    try {
      setIsDeleting(true);
      const res = await api.deleteTask(deletingTask.id);
      if (res.success) {
        showToast("Task deleted successfully", "success");
        setDeletingTask(null);
        fetchTasks();
      }
    } catch (err: any) {
      showToast(err.message || "Failed to delete task", "error");
    } finally {
      setIsDeleting(false);
    }
  };

  const columns: { id: string; title: string; status: "Todo" | "In Progress" | "Completed" | "Overdue"; color: string }[] = [
    { id: "todo", title: "To Do", status: "Todo", color: "border-blue-500" },
    { id: "in_progress", title: "In Progress", status: "In Progress", color: "border-amber-500" },
    { id: "completed", title: "Completed", status: "Completed", color: "border-emerald-500" },
    { id: "overdue", title: "Overdue", status: "Overdue", color: "border-rose-500" }
  ];

  return (
    <div className="space-y-6 pb-12">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <div className="flex items-center gap-2 mb-1">
            <div className="p-2 rounded-xl bg-orange-500/10 text-orange-500 border border-orange-500/20">
              <CheckSquare className="w-5 h-5" />
            </div>
            <h1 className="text-xl sm:text-2xl font-black font-display text-zinc-900 dark:text-white tracking-tight">
              Task Management
            </h1>
          </div>
          <p className="text-xs sm:text-sm text-zinc-500 dark:text-zinc-400 font-sans">
            Track enterprise deliverables, sprint progress, and cross-department assignments.
          </p>
        </div>

        <div className="flex items-center gap-2.5">
          <button
            onClick={fetchTasks}
            disabled={loading}
            className="p-2.5 rounded-xl border border-zinc-200 dark:border-zinc-800 text-zinc-600 dark:text-zinc-300 hover:bg-zinc-100 dark:hover:bg-zinc-900 transition-colors cursor-pointer"
            title="Refresh tasks"
          >
            <RefreshCw className={`w-4 h-4 ${loading ? "animate-spin" : ""}`} />
          </button>

          {canManageTasks && (
            <button
              onClick={() => setIsCreateOpen(true)}
              className="px-4 py-2.5 rounded-xl text-xs font-black bg-gradient-to-r from-orange-500 to-amber-500 hover:from-orange-600 hover:to-amber-600 text-white flex items-center gap-2 shadow-[0_8px_20px_-4px_rgba(249,115,22,0.4)] transition-all hover:scale-[1.02] active:scale-95 shrink-0 cursor-pointer"
            >
              <Plus className="w-4 h-4" />
              <span>Create Task</span>
            </button>
          )}
        </div>
      </div>

      {/* Filter Bar */}
      <div className="bg-white/95 dark:bg-zinc-950/90 backdrop-blur-xl p-4 rounded-2xl sm:rounded-3xl border border-zinc-200/90 dark:border-zinc-800/90 shadow-md flex flex-col md:flex-row items-center justify-between gap-3 text-xs">
        <div className="flex flex-wrap items-center gap-3 w-full md:w-auto flex-1">
          <div className="relative flex-1 min-w-[200px]">
            <Search className="w-4 h-4 text-zinc-400 absolute left-3.5 top-1/2 -translate-y-1/2" />
            <input
              type="text"
              placeholder="Search tasks, descriptions, or assignees..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              className="w-full pl-10 pr-3.5 py-2.5 bg-zinc-50 dark:bg-zinc-900/90 text-zinc-900 dark:text-zinc-100 rounded-xl border border-zinc-200 dark:border-zinc-800 focus:outline-none focus:border-orange-500 focus:ring-1 focus:ring-orange-500 font-sans"
            />
          </div>

          <select
            value={selectedPriority}
            onChange={(e) => setSelectedPriority(e.target.value)}
            className="px-3.5 py-2.5 bg-zinc-50 dark:bg-zinc-900/90 text-zinc-900 dark:text-zinc-100 rounded-xl border border-zinc-200 dark:border-zinc-800 focus:outline-none focus:border-orange-500 font-sans"
          >
            <option value="">All Priorities</option>
            <option value="Critical">Critical</option>
            <option value="High">High</option>
            <option value="Medium">Medium</option>
            <option value="Low">Low</option>
          </select>

          <select
            value={selectedDept}
            onChange={(e) => setSelectedDept(e.target.value)}
            className="px-3.5 py-2.5 bg-zinc-50 dark:bg-zinc-900/90 text-zinc-900 dark:text-zinc-100 rounded-xl border border-zinc-200 dark:border-zinc-800 focus:outline-none focus:border-orange-500 font-sans"
          >
            <option value="">All Departments</option>
            {departments.map((d) => (
              <option key={d.id} value={d.id}>
                {d.name}
              </option>
            ))}
          </select>
        </div>

        {/* View Mode Toggle */}
        <div className="flex items-center gap-1 bg-zinc-100 dark:bg-zinc-900/90 p-1.5 rounded-xl shrink-0 border border-zinc-200/80 dark:border-zinc-800/80">
          <button
            onClick={() => setViewMode("kanban")}
            className={`p-2 rounded-lg transition-all cursor-pointer ${
              viewMode === "kanban"
                ? "bg-white dark:bg-zinc-800 text-orange-600 dark:text-orange-400 shadow-sm"
                : "text-zinc-400 hover:text-zinc-700 dark:hover:text-zinc-200"
            }`}
            title="Kanban Board"
          >
            <Grid className="w-4 h-4" />
          </button>
          <button
            onClick={() => setViewMode("list")}
            className={`p-2 rounded-lg transition-all cursor-pointer ${
              viewMode === "list"
                ? "bg-white dark:bg-zinc-800 text-orange-600 dark:text-orange-400 shadow-sm"
                : "text-zinc-400 hover:text-zinc-700 dark:hover:text-zinc-200"
            }`}
            title="List View"
          >
            <List className="w-4 h-4" />
          </button>
        </div>
      </div>

      {/* Error Banner */}
      {errorState && !loading && (
        <div className="p-4 rounded-2xl bg-rose-50 dark:bg-rose-950/40 border border-rose-200 dark:border-rose-900/60 flex items-center justify-between gap-3 text-xs text-rose-700 dark:text-rose-300">
          <div className="flex items-center gap-2">
            <AlertTriangle className="w-4 h-4 shrink-0" />
            <span>{errorState}</span>
          </div>
          <button
            onClick={fetchTasks}
            className="px-3 py-1.5 bg-rose-600 text-white rounded-lg font-bold hover:bg-rose-500 transition-colors cursor-pointer"
          >
            Retry
          </button>
        </div>
      )}

      {/* Content View */}
      {loading ? (
        <div className="py-20 text-center">
          <div className="w-8 h-8 border-3 border-orange-500 border-t-transparent rounded-full animate-spin mx-auto mb-3" />
          <p className="text-xs text-zinc-400">Loading task sprint...</p>
        </div>
      ) : viewMode === "kanban" ? (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-5 items-start">
          {columns.map((col) => {
            const colTasks = tasks.filter((t) => t.status === col.status);
            return (
              <div
                key={col.id}
                className="bg-white/70 dark:bg-zinc-950/80 backdrop-blur-xl rounded-3xl p-4 border border-zinc-200/90 dark:border-zinc-800/90 min-h-[450px] flex flex-col shadow-md"
              >
                <div className="flex items-center justify-between mb-3 px-1">
                  <div className="flex items-center gap-2">
                    <span className={`w-2.5 h-2.5 rounded-full ${col.color.replace("border-", "bg-")}`} />
                    <h3 className="font-black font-display text-xs text-zinc-800 dark:text-zinc-200 uppercase tracking-wider">
                      {col.title}
                    </h3>
                  </div>
                  <span className="text-[11px] font-bold px-2.5 py-0.5 rounded-full bg-zinc-100 dark:bg-zinc-900 text-zinc-600 dark:text-zinc-300 font-mono border border-zinc-200 dark:border-zinc-800">
                    {colTasks.length}
                  </span>
                </div>

                <div className="space-y-3 flex-1 overflow-y-auto">
                  {colTasks.length === 0 ? (
                    <div className="py-12 text-center text-zinc-400 text-xs italic font-sans">No tasks in this lane</div>
                  ) : (
                    colTasks.map((task) => (
                      <div
                        key={task.id}
                        className="bg-white/95 dark:bg-zinc-900/90 rounded-2xl p-4 border border-zinc-200/90 dark:border-zinc-800/90 shadow-sm space-y-3 text-xs group hover:border-orange-500/50 hover:shadow-md hover:-translate-y-0.5 transition-all duration-200"
                      >
                        <div className="flex items-start justify-between gap-2">
                          <h4 className="font-bold font-display text-zinc-900 dark:text-white leading-snug line-clamp-2">
                            {task.title}
                          </h4>
                          <StatusBadge status={task.priority} size="sm" />
                        </div>

                        {task.description && (
                          <p className="text-zinc-500 dark:text-zinc-400 text-[11px] line-clamp-2 leading-relaxed font-sans">
                            {task.description}
                          </p>
                        )}

                        {/* Progress Bar */}
                        <div>
                          <div className="flex justify-between text-[10px] text-zinc-400 mb-1 font-semibold font-sans">
                            <span>Progress</span>
                            <span className="font-mono">{task.progressPercent}%</span>
                          </div>
                          <div className="w-full bg-zinc-100 dark:bg-zinc-800 h-1.5 rounded-full overflow-hidden">
                            <div
                              className="bg-gradient-to-r from-orange-500 to-amber-500 h-full rounded-full transition-all"
                              style={{ width: `${task.progressPercent}%` }}
                            />
                          </div>
                        </div>

                        {/* Footer details */}
                        <div className="flex items-center justify-between pt-2 border-t border-zinc-100 dark:border-zinc-800/80 text-[11px] text-zinc-500">
                          <span
                            onClick={() => {
                              if (onSelectEmployee) onSelectEmployee(task.assignedEmployeeId);
                              onNavigate(`/employees/${task.assignedEmployeeId}`);
                            }}
                            className="font-medium font-sans text-zinc-700 dark:text-zinc-300 hover:text-orange-500 truncate max-w-[120px] cursor-pointer"
                          >
                            {task.assignedEmployeeName}
                          </span>
                          <span className="text-zinc-400 font-mono">{task.dueDate}</span>
                        </div>

                        {/* Quick state transitions */}
                        <div className="flex items-center justify-between pt-1 gap-1">
                          {col.status !== "Completed" && (
                            <button
                              onClick={() => handleUpdateStatus(task.id, "Completed", 100)}
                              className="text-[10px] text-emerald-500 hover:underline font-bold cursor-pointer"
                            >
                              ✓ Mark Done
                            </button>
                          )}
                          {col.status === "Todo" && (
                            <button
                              onClick={() => handleUpdateStatus(task.id, "In Progress", 50)}
                              className="text-[10px] text-amber-500 hover:underline font-bold cursor-pointer"
                            >
                              → Start
                            </button>
                          )}
                          <div className="flex items-center gap-1 ml-auto">
                            {(canManageTasks || task.assignedEmployeeId === user?.employeeId) && (
                              <button
                                onClick={() => setEditingTask(task)}
                                className="p-1 text-zinc-400 hover:text-orange-500 rounded cursor-pointer"
                                title="Edit Task"
                              >
                                <Edit2 className="w-3.5 h-3.5" />
                              </button>
                            )}
                            {canManageTasks && (
                              <button
                                onClick={() => setDeletingTask(task)}
                                className="p-1 text-zinc-400 hover:text-rose-500 rounded cursor-pointer"
                                title="Delete Task"
                              >
                                <Trash2 className="w-3.5 h-3.5" />
                              </button>
                            )}
                          </div>
                        </div>
                      </div>
                    ))
                  )}
                </div>
              </div>
            );
          })}
        </div>
      ) : (
        /* List View */
        <div className="bg-white/90 dark:bg-zinc-950/80 backdrop-blur-xl rounded-2xl sm:rounded-3xl border border-zinc-200/90 dark:border-zinc-800/90 overflow-hidden shadow-md">
          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs">
              <thead className="bg-zinc-50/80 dark:bg-zinc-900/80 border-b border-zinc-200 dark:border-zinc-800 text-zinc-500 font-display uppercase tracking-wider font-semibold">
                <tr>
                  <th className="py-3.5 px-4">Task Name</th>
                  <th className="py-3.5 px-4">Assignee</th>
                  <th className="py-3.5 px-4">Department</th>
                  <th className="py-3.5 px-4">Priority</th>
                  <th className="py-3.5 px-4">Due Date</th>
                  <th className="py-3.5 px-4">Status</th>
                  <th className="py-3.5 px-4">Progress</th>
                  <th className="py-3.5 px-4 text-right">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-zinc-200/60 dark:divide-zinc-800/60 font-sans">
                {tasks.length === 0 ? (
                  <tr>
                    <td colSpan={8} className="py-12 text-center text-zinc-400">
                      No tasks found matching current filters.
                    </td>
                  </tr>
                ) : (
                  tasks.map((task) => (
                    <tr key={task.id} className="hover:bg-zinc-50/50 dark:hover:bg-zinc-900/50 transition-colors">
                      <td className="py-3 px-4 font-bold text-zinc-900 dark:text-white">
                        <div className="font-display">{task.title}</div>
                        {task.description && (
                          <div className="text-[11px] font-normal text-zinc-400 line-clamp-1 font-sans">{task.description}</div>
                        )}
                      </td>
                      <td className="py-3 px-4">
                        <button
                          onClick={() => {
                            if (onSelectEmployee) onSelectEmployee(task.assignedEmployeeId);
                            onNavigate(`/employees/${task.assignedEmployeeId}`);
                          }}
                          className="font-medium text-zinc-700 dark:text-zinc-300 hover:text-orange-500 cursor-pointer"
                        >
                          {task.assignedEmployeeName}
                        </button>
                      </td>
                      <td className="py-3 px-4 text-zinc-500">{task.departmentName}</td>
                      <td className="py-3 px-4">
                        <StatusBadge status={task.priority} size="sm" />
                      </td>
                      <td className="py-3 px-4 font-mono text-zinc-500">{task.dueDate}</td>
                      <td className="py-3 px-4">
                        <StatusBadge status={task.status} size="sm" />
                      </td>
                      <td className="py-3 px-4">
                        <div className="flex items-center gap-2 min-w-[100px]">
                          <div className="flex-1 bg-zinc-100 dark:bg-zinc-800 h-1.5 rounded-full overflow-hidden">
                            <div
                              className="bg-orange-500 h-full rounded-full"
                              style={{ width: `${task.progressPercent}%` }}
                            />
                          </div>
                          <span className="font-mono text-[10px] text-zinc-400">{task.progressPercent}%</span>
                        </div>
                      </td>
                      <td className="py-3 px-4 text-right">
                        <div className="flex items-center justify-end gap-1.5">
                          {(canManageTasks || task.assignedEmployeeId === user?.employeeId) && (
                            <button
                              onClick={() => setEditingTask(task)}
                              className="p-1.5 text-zinc-400 hover:text-orange-500 rounded-lg hover:bg-zinc-100 dark:hover:bg-zinc-800 transition-colors cursor-pointer"
                              title="Edit Task"
                            >
                              <Edit2 className="w-4 h-4" />
                            </button>
                          )}
                          {canManageTasks && (
                            <button
                              onClick={() => setDeletingTask(task)}
                              className="p-1.5 text-zinc-400 hover:text-rose-500 rounded-lg hover:bg-zinc-100 dark:hover:bg-zinc-800 transition-colors cursor-pointer"
                              title="Delete Task"
                            >
                              <Trash2 className="w-4 h-4" />
                            </button>
                          )}
                        </div>
                      </td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* Create / Edit Task Modal */}
      <TaskModal
        isOpen={isCreateOpen || !!editingTask}
        onClose={() => {
          setIsCreateOpen(false);
          setEditingTask(null);
        }}
        task={editingTask}
        onSuccess={() => {
          fetchTasks();
        }}
      />

      {/* Delete Task Modal */}
      <ConfirmModal
        isOpen={!!deletingTask}
        onClose={() => setDeletingTask(null)}
        onConfirm={handleDeleteConfirm}
        title="Delete Task"
        message={`Are you sure you want to delete task "${deletingTask?.title}"? This action cannot be undone.`}
        confirmText="Delete"
        isDestructive={true}
        isLoading={isDeleting}
      />
    </div>
  );
};
