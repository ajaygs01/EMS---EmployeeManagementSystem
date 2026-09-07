import React, { useState, useEffect, useRef } from "react";
import {
  Sparkles,
  Send,
  Bot,
  User,
  FileText,
  ShieldAlert,
  TrendingUp,
  Brain,
  Copy,
  Check,
  RotateCcw,
  BookOpen,
  Briefcase,
  AlertCircle
} from "lucide-react";
import { api } from "../services/api";
import { useAuth } from "../context/AuthContext";
import { useToast } from "../context/ToastContext";
import { Department } from "../types";

interface AiAssistantPageProps {
  onNavigate: (path: string) => void;
}

interface ChatMessage {
  id: string;
  sender: "user" | "ai";
  text: string;
  timestamp: string;
}

export const AiAssistantPage: React.FC<AiAssistantPageProps> = ({ onNavigate }) => {
  const { user } = useAuth();
  const { showToast } = useToast();

  const [activeTool, setActiveTool] = useState<"chat" | "jd" | "policy" | "performance">("chat");
  const [departments, setDepartments] = useState<Department[]>([]);

  // Chat State
  const [messages, setMessages] = useState<ChatMessage[]>([
    {
      id: "welcome",
      sender: "ai",
      text: "Hello! I am your AI Workforce & HR Intelligence Assistant. How can I help you today? You can ask me to draft job descriptions, compose corporate policies, summarize employee appraisals, analyze attrition risks, or draft professional employee communications.",
      timestamp: new Date().toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" })
    }
  ]);
  const [chatInput, setChatInput] = useState("");
  const [isChatLoading, setIsChatLoading] = useState(false);
  const chatBottomRef = useRef<HTMLDivElement>(null);

  // Job Description Tool State
  const [jdTitle, setJdTitle] = useState("");
  const [jdDept, setJdDept] = useState("");
  const [jdExp, setJdExp] = useState("Mid-level (3-5 years)");
  const [jdSkills, setJdSkills] = useState("");
  const [jdResult, setJdResult] = useState("");
  const [isJdLoading, setIsJdLoading] = useState(false);

  // Policy Generator Tool State
  const [policyTopic, setPolicyTopic] = useState("");
  const [policyGuidelines, setPolicyGuidelines] = useState("");
  const [policyResult, setPolicyResult] = useState("");
  const [isPolicyLoading, setIsPolicyLoading] = useState(false);

  // Performance Review Assistant State
  const [perfEmployee, setPerfEmployee] = useState("");
  const [perfNotes, setPerfNotes] = useState("");
  const [perfResult, setPerfResult] = useState("");
  const [isPerfLoading, setIsPerfLoading] = useState(false);

  // Copied state
  const [copiedKey, setCopiedKey] = useState<string | null>(null);

  useEffect(() => {
    api.getDepartments().then((res) => {
      if (res.success) setDepartments(res.data);
    });
  }, []);

  useEffect(() => {
    chatBottomRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages, isChatLoading]);

  const handleCopy = (text: string, key: string) => {
    navigator.clipboard.writeText(text);
    setCopiedKey(key);
    showToast("Copied to clipboard!", "success");
    setTimeout(() => setCopiedKey(null), 2000);
  };

  const handleSendChatMessage = async (customPrompt?: string) => {
    const promptToSend = customPrompt || chatInput;
    if (!promptToSend.trim()) return;

    const userMsg: ChatMessage = {
      id: Date.now().toString(),
      sender: "user",
      text: promptToSend,
      timestamp: new Date().toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" })
    };

    setMessages((prev) => [...prev, userMsg]);
    if (!customPrompt) setChatInput("");
    setIsChatLoading(true);

    try {
      const res = await api.aiChat(promptToSend);
      if (res.success) {
        const aiMsg: ChatMessage = {
          id: (Date.now() + 1).toString(),
          sender: "ai",
          text: res.reply,
          timestamp: new Date().toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" })
        };
        setMessages((prev) => [...prev, aiMsg]);
      }
    } catch (err: any) {
      showToast(err.message || "Failed to reach AI service", "error");
      const errorMsg: ChatMessage = {
        id: (Date.now() + 1).toString(),
        sender: "ai",
        text: "I encountered an error connecting to the intelligence model. Please verify your GEMINI_API_KEY environment variable.",
        timestamp: new Date().toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" })
      };
      setMessages((prev) => [...prev, errorMsg]);
    } finally {
      setIsChatLoading(false);
    }
  };

  const handleGenerateJd = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!jdTitle.trim()) return;
    try {
      setIsJdLoading(true);
      const res = await api.aiJobDescription(jdTitle, jdDept, jdExp, jdSkills);
      if (res.success) {
        setJdResult(res.jobDescription);
        showToast("Job Description generated!", "success");
      }
    } catch (err: any) {
      showToast(err.message || "Failed to generate job description", "error");
    } finally {
      setIsJdLoading(false);
    }
  };

  const handleGeneratePolicy = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!policyTopic.trim()) return;
    try {
      setIsPolicyLoading(true);
      const res = await api.aiPolicyDraft(policyTopic, policyGuidelines);
      if (res.success) {
        setPolicyResult(res.policyDraft);
        showToast("Policy drafted!", "success");
      }
    } catch (err: any) {
      showToast(err.message || "Failed to draft policy", "error");
    } finally {
      setIsPolicyLoading(false);
    }
  };

  const handleGeneratePerformanceFeedback = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!perfEmployee.trim() || !perfNotes.trim()) return;
    try {
      setIsPerfLoading(true);
      const res = await api.aiChat(
        `Draft a comprehensive, supportive, yet rigorous quarterly performance review summary and SMART development goals for ${perfEmployee} based on these manager observation points: "${perfNotes}". Structure it into: 1. Core Accomplishments, 2. Competency Ratings, 3. Growth Opportunities, and 4. Actionable 90-Day Goals.`
      );
      if (res.success) {
        setPerfResult(res.reply);
        showToast("Review drafted!", "success");
      }
    } catch (err: any) {
      showToast(err.message || "Failed to draft appraisal", "error");
    } finally {
      setIsPerfLoading(false);
    }
  };

  const suggestedPrompts = [
    "Draft a professional email welcoming 3 new engineers to the Platform team",
    "What are best practices for conducting a 1-on-1 career development sync?",
    "Summarize standard guidelines for remote work expense reimbursements",
    "Write 5 behavioral interview questions for a Senior Product Manager"
  ];

  return (
    <div className="space-y-6 pb-12">
      {/* Header Banner */}
      <div className="relative overflow-hidden rounded-3xl bg-gradient-to-r from-orange-950/80 via-zinc-950 to-amber-950/60 p-6 sm:p-8 border border-orange-500/30 dark:border-orange-500/20 shadow-xl card-3d">
        <div className="absolute top-0 right-0 w-96 h-96 bg-orange-500/10 rounded-full blur-3xl pointer-events-none" />
        <div className="relative z-10 flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <div>
            <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-orange-500/20 text-orange-400 text-xs font-bold font-mono uppercase tracking-wider mb-2 border border-orange-500/30">
              <Sparkles className="w-3.5 h-3.5" />
              Powered by Gemini Intelligence
            </div>
            <h1 className="text-2xl sm:text-3xl font-black tracking-tight text-white font-display flex items-center gap-3">
              AI HR Intelligence & Co-Pilot
            </h1>
            <p className="text-xs sm:text-sm text-zinc-300 mt-1 max-w-2xl">
              Automate job descriptions, corporate policy drafting, performance appraisals, and HR queries with neural speed.
            </p>
          </div>
        </div>
      </div>

      {/* Tool Selector Tabs */}
      <div className="flex flex-wrap items-center gap-2 border-b border-zinc-200 dark:border-zinc-800 pb-3 text-xs font-bold">
        {[
          { id: "chat", label: "Interactive HR Assistant", icon: Bot },
          { id: "jd", label: "Job Description Generator", icon: Briefcase },
          { id: "policy", label: "Policy & Compliance Drafter", icon: BookOpen },
          { id: "performance", label: "Appraisal Review Assistant", icon: TrendingUp }
        ].map((t) => {
          const Icon = t.icon;
          const isActive = activeTool === t.id;
          return (
            <button
              key={t.id}
              onClick={() => setActiveTool(t.id as any)}
              className={`flex items-center gap-2 px-4 py-2.5 rounded-xl transition-all cursor-pointer ${
                isActive
                  ? "bg-gradient-to-r from-orange-600 to-amber-600 text-white shadow-lg shadow-orange-600/30 font-bold"
                  : "bg-white dark:bg-zinc-900 text-zinc-600 dark:text-zinc-400 border border-zinc-200 dark:border-zinc-800 hover:bg-zinc-100 dark:hover:bg-zinc-800"
              }`}
            >
              <Icon className="w-4 h-4" />
              <span>{t.label}</span>
            </button>
          );
        })}
      </div>

      {/* TOOL 1: INTERACTIVE CHAT */}
      {activeTool === "chat" && (
        <div className="bg-white dark:bg-zinc-900/90 rounded-3xl border border-zinc-200 dark:border-zinc-800 shadow-md flex flex-col h-[650px] overflow-hidden card-3d">
          {/* Chat Messages Log */}
          <div className="flex-1 p-6 overflow-y-auto space-y-4 custom-scrollbar">
            {messages.map((msg) => {
              const isAi = msg.sender === "ai";
              return (
                <div
                  key={msg.id}
                  className={`flex items-start gap-3 text-xs ${isAi ? "" : "flex-row-reverse"}`}
                >
                  <div
                    className={`w-8 h-8 rounded-xl flex items-center justify-center shrink-0 shadow-md ${
                      isAi
                        ? "bg-gradient-to-tr from-orange-600 to-amber-600 text-white"
                        : "bg-zinc-200 dark:bg-zinc-800 text-zinc-800 dark:text-zinc-200"
                    }`}
                  >
                    {isAi ? <Sparkles className="w-4 h-4" /> : <User className="w-4 h-4" />}
                  </div>

                  <div className={`max-w-2xl space-y-1 ${isAi ? "" : "text-right"}`}>
                    <div
                      className={`p-4 rounded-2xl leading-relaxed whitespace-pre-line text-left shadow-sm ${
                        isAi
                          ? "bg-zinc-100/80 dark:bg-zinc-950/70 border border-zinc-200 dark:border-zinc-800 text-zinc-800 dark:text-zinc-200"
                          : "bg-gradient-to-r from-orange-600 to-amber-600 text-white shadow-md shadow-orange-600/20"
                      }`}
                    >
                      {msg.text}
                    </div>

                    <div className="flex items-center gap-2 text-[10px] text-zinc-400 px-1">
                      <span>{msg.timestamp}</span>
                      {isAi && (
                        <button
                          onClick={() => handleCopy(msg.text, msg.id)}
                          className="hover:text-zinc-600 dark:hover:text-zinc-200 flex items-center gap-0.5 ml-2 cursor-pointer"
                        >
                          {copiedKey === msg.id ? (
                            <>
                              <Check className="w-3 h-3 text-emerald-500" /> Copied
                            </>
                          ) : (
                            <>
                              <Copy className="w-3 h-3" /> Copy
                            </>
                          )}
                        </button>
                      )}
                    </div>
                  </div>
                </div>
              );
            })}

            {isChatLoading && (
              <div className="flex items-center gap-3 text-xs">
                <div className="w-8 h-8 rounded-xl bg-gradient-to-tr from-orange-600 to-amber-600 text-white flex items-center justify-center shadow-md">
                  <Sparkles className="w-4 h-4 animate-spin" />
                </div>
                <div className="p-3.5 rounded-2xl bg-zinc-100 dark:bg-zinc-800 text-zinc-400 flex items-center gap-2 border border-zinc-200 dark:border-zinc-700/60">
                  <div className="w-2 h-2 rounded-full bg-orange-500 animate-bounce" />
                  <div className="w-2 h-2 rounded-full bg-orange-500 animate-bounce [animation-delay:0.2s]" />
                  <div className="w-2 h-2 rounded-full bg-orange-500 animate-bounce [animation-delay:0.4s]" />
                  <span className="text-[11px] font-medium ml-1">AI is formulating advisory...</span>
                </div>
              </div>
            )}
            <div ref={chatBottomRef} />
          </div>

          {/* Quick Prompts */}
          <div className="p-3 bg-zinc-50 dark:bg-zinc-950/70 border-t border-zinc-200 dark:border-zinc-800 flex items-center gap-2 overflow-x-auto text-[11px] scrollbar-none">
            <span className="text-zinc-400 font-bold shrink-0">Suggestions:</span>
            {suggestedPrompts.map((p, idx) => (
              <button
                key={idx}
                onClick={() => handleSendChatMessage(p)}
                className="px-2.5 py-1 rounded-lg bg-white dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800 text-zinc-600 dark:text-zinc-300 hover:text-orange-600 dark:hover:text-orange-400 hover:border-orange-400 whitespace-nowrap transition-colors shrink-0 cursor-pointer shadow-xs"
              >
                {p}
              </button>
            ))}
          </div>

          {/* Input Bar */}
          <div className="p-4 bg-white dark:bg-zinc-900 border-t border-zinc-200 dark:border-zinc-800 flex items-center gap-3">
            <input
              type="text"
              placeholder="Ask anything about employee management, HR regulations, or message drafts..."
              value={chatInput}
              onChange={(e) => setChatInput(e.target.value)}
              onKeyDown={(e) => {
                if (e.key === "Enter" && !e.shiftKey) {
                  e.preventDefault();
                  handleSendChatMessage();
                }
              }}
              className="flex-1 px-4 py-2.5 bg-zinc-50 dark:bg-zinc-800/80 text-zinc-900 dark:text-white rounded-2xl border border-zinc-200 dark:border-zinc-700 text-xs focus:outline-none focus:border-orange-500"
            />
            <button
              onClick={() => handleSendChatMessage()}
              disabled={isChatLoading || !chatInput.trim()}
              className="p-2.5 bg-gradient-to-r from-orange-600 to-amber-600 hover:from-orange-500 hover:to-amber-500 text-white rounded-2xl shadow-md shadow-orange-600/30 disabled:opacity-40 transition-all cursor-pointer"
            >
              <Send className="w-4 h-4" />
            </button>
          </div>
        </div>
      )}

      {/* TOOL 2: JOB DESCRIPTION GENERATOR */}
      {activeTool === "jd" && (
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          <form
            onSubmit={handleGenerateJd}
            className="bg-white dark:bg-zinc-900 rounded-3xl p-6 border border-zinc-200 dark:border-zinc-800 shadow-md space-y-4 text-xs card-3d"
          >
            <h3 className="font-bold text-sm text-zinc-900 dark:text-white border-b border-zinc-100 dark:border-zinc-800 pb-3">
              Role Parameters
            </h3>

            <div>
              <label className="block font-semibold text-zinc-700 dark:text-zinc-300 mb-1">
                Job Title / Position Name *
              </label>
              <input
                type="text"
                required
                value={jdTitle}
                onChange={(e) => setJdTitle(e.target.value)}
                placeholder="e.g. Senior Frontend Architect"
                className="w-full px-3 py-2 bg-zinc-50 dark:bg-zinc-800 text-zinc-900 dark:text-white rounded-xl border border-zinc-200 dark:border-zinc-700 focus:outline-none focus:border-orange-500"
              />
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="block font-semibold text-zinc-700 dark:text-zinc-300 mb-1">
                  Department
                </label>
                <select
                  value={jdDept}
                  onChange={(e) => setJdDept(e.target.value)}
                  className="w-full px-3 py-2 bg-zinc-50 dark:bg-zinc-800 text-zinc-900 dark:text-white rounded-xl border border-zinc-200 dark:border-zinc-700 focus:outline-none focus:border-orange-500"
                >
                  <option value="">Select Department</option>
                  {departments.map((d) => (
                    <option key={d.id} value={d.name}>
                      {d.name}
                    </option>
                  ))}
                </select>
              </div>

              <div>
                <label className="block font-semibold text-zinc-700 dark:text-zinc-300 mb-1">
                  Experience Tier
                </label>
                <select
                  value={jdExp}
                  onChange={(e) => setJdExp(e.target.value)}
                  className="w-full px-3 py-2 bg-zinc-50 dark:bg-zinc-800 text-zinc-900 dark:text-white rounded-xl border border-zinc-200 dark:border-zinc-700 focus:outline-none focus:border-orange-500"
                >
                  <option value="Entry-level (0-2 years)">Entry-level (0-2 years)</option>
                  <option value="Mid-level (3-5 years)">Mid-level (3-5 years)</option>
                  <option value="Senior (5-8 years)">Senior (5-8 years)</option>
                  <option value="Lead / Staff (8+ years)">Lead / Staff (8+ years)</option>
                  <option value="Executive / Director">Executive / Director</option>
                </select>
              </div>
            </div>

            <div>
              <label className="block font-semibold text-zinc-700 dark:text-zinc-300 mb-1">
                Required Key Skills & Tech Stack (Optional)
              </label>
              <textarea
                rows={3}
                value={jdSkills}
                onChange={(e) => setJdSkills(e.target.value)}
                placeholder="e.g. React, TypeScript, GraphQL, WebSockets, System Architecture, CI/CD"
                className="w-full px-3 py-2 bg-zinc-50 dark:bg-zinc-800 text-zinc-900 dark:text-white rounded-xl border border-zinc-200 dark:border-zinc-700 focus:outline-none focus:border-orange-500"
              />
            </div>

            <button
              type="submit"
              disabled={isJdLoading}
              className="w-full py-2.5 rounded-xl font-bold bg-gradient-to-r from-orange-600 to-amber-600 hover:from-orange-500 hover:to-amber-500 text-white shadow-md shadow-orange-600/30 flex items-center justify-center gap-2 transition-all disabled:opacity-50 cursor-pointer"
            >
              <Sparkles className="w-4 h-4" />
              <span>{isJdLoading ? "Generating Description..." : "Generate Job Description"}</span>
            </button>
          </form>

          {/* Result Box */}
          <div className="bg-white dark:bg-zinc-900 rounded-3xl p-6 border border-zinc-200 dark:border-zinc-800 shadow-md flex flex-col justify-between card-3d">
            <div className="flex items-center justify-between border-b border-zinc-100 dark:border-zinc-800 pb-3 mb-4">
              <h3 className="font-bold text-sm text-zinc-900 dark:text-white">Generated Job Description</h3>
              {jdResult && (
                <button
                  onClick={() => handleCopy(jdResult, "jd")}
                  className="text-xs font-semibold text-orange-600 dark:text-orange-400 hover:underline flex items-center gap-1 cursor-pointer"
                >
                  <Copy className="w-3.5 h-3.5" /> Copy Document
                </button>
              )}
            </div>

            <div className="flex-1 overflow-y-auto max-h-[480px] text-xs text-zinc-700 dark:text-zinc-200 leading-relaxed whitespace-pre-line custom-scrollbar">
              {jdResult || (
                <div className="py-20 text-center text-zinc-400">
                  <Briefcase className="w-10 h-10 mx-auto mb-2 opacity-40 text-orange-400" />
                  Fill in the role parameters on the left and click Generate to produce a polished, market-ready job description.
                </div>
              )}
            </div>
          </div>
        </div>
      )}

      {/* TOOL 3: POLICY & COMPLIANCE DRAFTER */}
      {activeTool === "policy" && (
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          <form
            onSubmit={handleGeneratePolicy}
            className="bg-white dark:bg-zinc-900 rounded-3xl p-6 border border-zinc-200 dark:border-zinc-800 shadow-md space-y-4 text-xs card-3d"
          >
            <h3 className="font-bold text-sm text-zinc-900 dark:text-white border-b border-zinc-100 dark:border-zinc-800 pb-3">
              Policy Blueprint
            </h3>

            <div>
              <label className="block font-semibold text-zinc-700 dark:text-zinc-300 mb-1">
                Policy Subject / Topic *
              </label>
              <input
                type="text"
                required
                value={policyTopic}
                onChange={(e) => setPolicyTopic(e.target.value)}
                placeholder="e.g. Remote Work & Home Office Stipend Policy"
                className="w-full px-3 py-2 bg-zinc-50 dark:bg-zinc-800 text-zinc-900 dark:text-white rounded-xl border border-zinc-200 dark:border-zinc-700 focus:outline-none focus:border-orange-500"
              />
            </div>

            <div>
              <label className="block font-semibold text-zinc-700 dark:text-zinc-300 mb-1">
                Specific Corporate Guidelines or Eligibility Notes
              </label>
              <textarea
                rows={5}
                value={policyGuidelines}
                onChange={(e) => setPolicyGuidelines(e.target.value)}
                placeholder="e.g. Employees with > 6 months tenure qualify for ₹50,000 equipment allowance. Core hours 10 AM - 4 PM. Information security compliance required."
                className="w-full px-3 py-2 bg-zinc-50 dark:bg-zinc-800 text-zinc-900 dark:text-white rounded-xl border border-zinc-200 dark:border-zinc-700 focus:outline-none focus:border-orange-500"
              />
            </div>

            <button
              type="submit"
              disabled={isPolicyLoading}
              className="w-full py-2.5 rounded-xl font-bold bg-gradient-to-r from-orange-600 to-amber-600 hover:from-orange-500 hover:to-amber-500 text-white shadow-md shadow-orange-600/30 flex items-center justify-center gap-2 transition-all disabled:opacity-50 cursor-pointer"
            >
              <Sparkles className="w-4 h-4" />
              <span>{isPolicyLoading ? "Drafting Policy..." : "Draft Corporate Policy"}</span>
            </button>
          </form>

          {/* Result Box */}
          <div className="bg-white dark:bg-zinc-900 rounded-3xl p-6 border border-zinc-200 dark:border-zinc-800 shadow-md flex flex-col justify-between card-3d">
            <div className="flex items-center justify-between border-b border-zinc-100 dark:border-zinc-800 pb-3 mb-4">
              <h3 className="font-bold text-sm text-zinc-900 dark:text-white">Drafted Policy Document</h3>
              {policyResult && (
                <button
                  onClick={() => handleCopy(policyResult, "policy")}
                  className="text-xs font-semibold text-orange-600 dark:text-orange-400 hover:underline flex items-center gap-1 cursor-pointer"
                >
                  <Copy className="w-3.5 h-3.5" /> Copy Policy
                </button>
              )}
            </div>

            <div className="flex-1 overflow-y-auto max-h-[480px] text-xs text-zinc-700 dark:text-zinc-200 leading-relaxed whitespace-pre-line custom-scrollbar">
              {policyResult || (
                <div className="py-20 text-center text-zinc-400">
                  <BookOpen className="w-10 h-10 mx-auto mb-2 opacity-40 text-orange-400" />
                  Define the policy topic to draft a compliant, standardized employee handbook document.
                </div>
              )}
            </div>
          </div>
        </div>
      )}

      {/* TOOL 4: PERFORMANCE REVIEW ASSISTANT */}
      {activeTool === "performance" && (
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          <form
            onSubmit={handleGeneratePerformanceFeedback}
            className="bg-white dark:bg-zinc-900 rounded-3xl p-6 border border-zinc-200 dark:border-zinc-800 shadow-md space-y-4 text-xs card-3d"
          >
            <h3 className="font-bold text-sm text-zinc-900 dark:text-white border-b border-zinc-100 dark:border-zinc-800 pb-3">
              Appraisal Parameters
            </h3>

            <div>
              <label className="block font-semibold text-zinc-700 dark:text-zinc-300 mb-1">
                Employee Name & Title *
              </label>
              <input
                type="text"
                required
                value={perfEmployee}
                onChange={(e) => setPerfEmployee(e.target.value)}
                placeholder="e.g. Alex Morgan, Senior Backend Engineer"
                className="w-full px-3 py-2 bg-zinc-50 dark:bg-zinc-800 text-zinc-900 dark:text-white rounded-xl border border-zinc-200 dark:border-zinc-700 focus:outline-none focus:border-orange-500"
              />
            </div>

            <div>
              <label className="block font-semibold text-zinc-700 dark:text-zinc-300 mb-1">
                Raw Observation Notes & Deliverables *
              </label>
              <textarea
                rows={5}
                required
                value={perfNotes}
                onChange={(e) => setPerfNotes(e.target.value)}
                placeholder="e.g. Delivered payment gateway integration 2 weeks ahead of schedule. Great code reviews. Needs to improve cross-functional documentation and speaking up during roadmap triage."
                className="w-full px-3 py-2 bg-zinc-50 dark:bg-zinc-800 text-zinc-900 dark:text-white rounded-xl border border-zinc-200 dark:border-zinc-700 focus:outline-none focus:border-orange-500"
              />
            </div>

            <button
              type="submit"
              disabled={isPerfLoading}
              className="w-full py-2.5 rounded-xl font-bold bg-gradient-to-r from-orange-600 to-amber-600 hover:from-orange-500 hover:to-amber-500 text-white shadow-md shadow-orange-600/30 flex items-center justify-center gap-2 transition-all disabled:opacity-50 cursor-pointer"
            >
              <Sparkles className="w-4 h-4" />
              <span>{isPerfLoading ? "Synthesizing Appraisal..." : "Synthesize Evaluation Dossier"}</span>
            </button>
          </form>

          {/* Result Box */}
          <div className="bg-white dark:bg-zinc-900 rounded-3xl p-6 border border-zinc-200 dark:border-zinc-800 shadow-md flex flex-col justify-between card-3d">
            <div className="flex items-center justify-between border-b border-zinc-100 dark:border-zinc-800 pb-3 mb-4">
              <h3 className="font-bold text-sm text-zinc-900 dark:text-white">Structured Appraisal Review</h3>
              {perfResult && (
                <button
                  onClick={() => handleCopy(perfResult, "perf")}
                  className="text-xs font-semibold text-orange-600 dark:text-orange-400 hover:underline flex items-center gap-1 cursor-pointer"
                >
                  <Copy className="w-3.5 h-3.5" /> Copy Dossier
                </button>
              )}
            </div>

            <div className="flex-1 overflow-y-auto max-h-[480px] text-xs text-zinc-700 dark:text-zinc-200 leading-relaxed whitespace-pre-line custom-scrollbar">
              {perfResult || (
                <div className="py-20 text-center text-zinc-400">
                  <TrendingUp className="w-10 h-10 mx-auto mb-2 opacity-40 text-orange-400" />
                  Input manager notes on the left to generate structured appraisal feedback with actionable SMART targets.
                </div>
              )}
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
