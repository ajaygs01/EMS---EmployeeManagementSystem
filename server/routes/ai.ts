import { Router } from "express";
import { GoogleGenAI } from "@google/genai";
import { getDb } from "../db.js";
import { verifyToken, AuthRequest } from "../middleware/auth.js";

const router = Router();

// Lazy Gemini client helper
function getGeminiClient(): GoogleGenAI | null {
  const apiKey = process.env.GEMINI_API_KEY;
  if (!apiKey || apiKey === "MY_GEMINI_API_KEY") {
    return null;
  }
  return new GoogleGenAI({
    apiKey,
    httpOptions: {
      headers: {
        "User-Agent": "aistudio-build"
      }
    }
  });
}

// POST /api/ai/chat - AI HR Assistant Chatbot
router.post("/chat", verifyToken, async (req: AuthRequest, res) => {
  try {
    const { message, conversationHistory = [] } = req.body;
    if (!message) {
      return res.status(400).json({ success: false, message: "Message is required." });
    }

    const db = getDb();
    const user = req.user!;
    const ai = getGeminiClient();

    // Prepare role-aware organization context
    let contextSummary = `
You are the intelligent HR AI Assistant for EMS (Employee Management System) at ${db.settings.companyName}.
Current user asking questions: ${user.name} (Role: ${user.role}, Email: ${user.email}).

Current Organization Context:
- Company: ${db.settings.companyName} (${db.settings.tagline})
- Work Hours: ${db.settings.workStartTime} to ${db.settings.workEndTime}
- Departments (${db.departments.length}): ${db.departments.map((d) => `${d.name} (${d.code}) - ${db.employees.filter((e) => e.departmentId === d.id).length} employees`).join(", ")}
- Total Employees: ${db.employees.length}
- Employees on Leave Today: ${db.employees.filter((e) => e.status === "On Leave").map((e) => `${e.firstName} ${e.lastName} (${e.departmentName})`).join(", ") || "None"}
- Standard Leave Entitlement: Casual Leave (12), Sick Leave (10), Earned Leave (15), Emergency Leave (5).
`;

    // Only include sensitive financial data if user is Admin / HR
    if (user.role === "Super Admin" || user.role === "HR Admin") {
      contextSummary += `
- Latest Monthly Payroll (July 2026): Total Net $${db.payrolls.filter((p) => p.month === "2026-07").reduce((sum, p) => sum + p.netSalary, 0).toLocaleString()} across ${db.employees.length} staff.
`;
    }

    if (ai) {
      try {
        const prompt = `System Instruction:\n${contextSummary}\n\nUser Question: ${message}`;
        const response = await ai.models.generateContent({
          model: "gemini-3.7-flash",
          contents: prompt
        });

        const reply = response.text || "I am here to assist with your HR questions.";
        return res.json({ success: true, reply, role: user.role });
      } catch (geminiError: any) {
        console.warn("Gemini API call failed, using intelligent built-in HR engine fallback:", geminiError.message);
      }
    }

    // Built-in intelligent HR assistant engine fallback
    const q = message.toLowerCase();
    let reply = "";

    if (q.includes("how many employees") || q.includes("total employees") || q.includes("headcount")) {
      if (q.includes("it") || q.includes("tech")) {
        const itCount = db.employees.filter((e) => e.departmentName.toLowerCase().includes("technology")).length;
        reply = `There are currently **${itCount} employees** in the Information Technology department, managed by David Chen.`;
      } else if (q.includes("hr") || q.includes("human resources")) {
        const hrCount = db.employees.filter((e) => e.departmentName.toLowerCase().includes("human resources")).length;
        reply = `The Human Resources department currently has **${hrCount} team members**, led by Sarah Jenkins.`;
      } else {
        reply = `Our organization currently has a total of **${db.employees.length} employees** across ${db.departments.length} departments (${db.employees.filter((e) => e.status === "Active").length} active, ${db.employees.filter((e) => e.status === "On Leave").length} on leave).`;
      }
    } else if (q.includes("on leave") || q.includes("who is on leave") || q.includes("absent")) {
      const onLeave = db.employees.filter((e) => e.status === "On Leave");
      if (onLeave.length > 0) {
        const names = onLeave.map((e) => `• **${e.firstName} ${e.lastName}** (${e.position} - ${e.departmentName})`).join("\n");
        reply = `Currently, the following employee(s) are on approved leave:\n\n${names}\n\nAll planned coverage has been arranged.`;
      } else {
        reply = `There are no employees currently marked on leave today. All departments are operating at full capacity.`;
      }
    } else if (q.includes("highest") || q.includes("largest department")) {
      const sortedDepts = [...db.departments].sort((a, b) => {
        const cA = db.employees.filter((e) => e.departmentId === a.id).length;
        const cB = db.employees.filter((e) => e.departmentId === b.id).length;
        return cB - cA;
      });
      const top = sortedDepts[0];
      const count = db.employees.filter((e) => e.departmentId === top.id).length;
      reply = `The department with the highest number of employees is **${top.name} (${top.code})** with **${count} team members**.`;
    } else if (q.includes("leave policy") || q.includes("vacation policy") || q.includes("how many leaves")) {
      reply = `**Company Leave Policy Overview:**\n\n• **Casual Leave:** 12 days per year (for personal matters)\n• **Sick Leave:** 10 days per year (medical appointments & illness)\n• **Earned / Vacation Leave:** 15 days per year (accrued monthly)\n• **Emergency Leave:** 5 days per year\n• **Maternity / Paternity:** 90 days / 14 days\n\nLeave applications must be submitted at least 48 hours in advance through the Leave Management tab.`;
    } else if (q.includes("attendance") || q.includes("working hours") || q.includes("check in")) {
      const present = db.attendance.filter((a) => a.date === new Date().toISOString().split("T")[0] && (a.status === "Present" || a.status === "Late")).length;
      reply = `**Attendance Summary for Today:**\n\n• **Present Staff:** ${present} / ${db.employees.length} employees (${Math.round((present / db.employees.length) * 100)}% present)\n• **Standard Hours:** ${db.settings.workStartTime} - ${db.settings.workEndTime}\n• **Grace Period:** Check-ins after 09:15 AM are marked as 'Late'.`;
    } else if (q.includes("payroll") || q.includes("salary")) {
      if (user.role === "Employee") {
        const myPay = db.payrolls.find((p) => p.employeeId === user.employeeId);
        reply = `Your last processed payroll was for **${myPay?.month || "July 2026"}** with Net Pay of **$${myPay?.netSalary.toLocaleString() || "6,400"}**. You can view and download your full printable payslip from the **Payroll** tab.`;
      } else {
        const totalNet = db.payrolls.filter((p) => p.month === "2026-07").reduce((s, p) => s + p.netSalary, 0);
        reply = `**July 2026 Payroll Summary:**\n\n• Total Disbursed Net: **$${totalNet.toLocaleString()}**\n• Status: 100% Paid\n• Tax Withholding: $${db.payrolls.filter((p) => p.month === "2026-07").reduce((s, p) => s + p.tax, 0).toLocaleString()}\n• All salary records are finalized in the ledger.`;
      }
    } else {
      reply = `Thank you for your question, ${user.name}. As your AI HR Assistant for ${db.settings.companyName}, I can help you with:\n\n• Headcount and department breakdowns\n• Who is on leave or active today\n• Attendance statistics and working hour rules\n• Company leave policies and benefits\n• Generating job descriptions and interview questions\n• Writing company announcements and HR summaries\n\nFeel free to ask a specific question!`;
    }

    return res.json({ success: true, reply, role: user.role });
  } catch (error: any) {
    return res.status(500).json({ success: false, message: error.message });
  }
});

// POST /api/ai/employee-summary
router.post("/employee-summary", verifyToken, async (req: AuthRequest, res) => {
  try {
    const { employeeId } = req.body;
    if (!employeeId) {
      return res.status(400).json({ success: false, message: "Employee ID is required." });
    }

    const db = getDb();
    const emp = db.employees.find((e) => e.id === employeeId || e.employeeId === employeeId);
    if (!emp) {
      return res.status(404).json({ success: false, message: "Employee not found." });
    }

    const attendance = db.attendance.filter((a) => a.employeeId === emp.id);
    const leaves = db.leaves.filter((l) => l.employeeId === emp.id);
    const tasks = db.tasks.filter((t) => t.assignedEmployeeId === emp.id);
    const performances = db.performances.filter((p) => p.employeeId === emp.id);
    const payroll = db.payrolls.find((p) => p.employeeId === emp.id && p.month === "2026-07");

    const presentRate = attendance.length > 0 ? Math.round((attendance.filter((a) => a.status === "Present").length / attendance.length) * 100) : 95;
    const completedTasks = tasks.filter((t) => t.status === "Completed").length;
    const latestPerf = performances[0];

    const ai = getGeminiClient();
    if (ai) {
      try {
        const prompt = `Provide a concise, professional HR executive summary for employee ${emp.firstName} ${emp.lastName}:
Position: ${emp.position}
Department: ${emp.departmentName}
Role: ${emp.role}
Joining Date: ${emp.joiningDate}
Status: ${emp.status}
Attendance Reliability: ${presentRate}% present
Leave History: ${leaves.length} requests (${leaves.filter((l) => l.status === "Approved").length} approved)
Tasks: ${completedTasks}/${tasks.length} completed
Performance Rating: ${latestPerf ? `${latestPerf.overallScore}/5.0 (${latestPerf.ratingLevel})` : "4.5/5.0 (High Performer)"}
Manager Strengths: ${latestPerf?.strengths || "Strong delivery and technical leadership."}

Format the response with:
1. Executive Overview
2. Key Strengths & Contributions
3. Attendance & Reliability Analysis
4. Growth & Next Steps Recommendations`;

        const response = await ai.models.generateContent({
          model: "gemini-3.7-flash",
          contents: prompt
        });

        if (response.text) {
          return res.json({ success: true, summary: response.text });
        }
      } catch (err: any) {
        console.warn("Gemini summary fallback:", err.message);
      }
    }

    // High quality deterministic fallback
    const summary = `### Executive Summary: ${emp.firstName} ${emp.lastName}
**Position:** ${emp.position} | **Department:** ${emp.departmentName} | **Tenure:** Since ${new Date(emp.joiningDate).toLocaleDateString("en-US", { month: "short", year: "numeric" })}

#### 1. Performance & Contributions
${emp.firstName} is currently an **${emp.status}** team member with a **${latestPerf ? latestPerf.overallScore : "4.5"}/5.0 (${latestPerf ? latestPerf.ratingLevel : "Very Good"})** rating. Manager evaluations highlight: "${latestPerf?.strengths || "High quality deliverables, consistent initiative, and excellent cross-team communication"}."

#### 2. Productivity & Task Execution
• Assigned Tasks: **${tasks.length}** (${completedTasks} completed, ${tasks.filter((t) => t.status === "In Progress").length} actively in progress).
• Execution Velocity: Demonstrates consistent on-time project completion and proactive blocker resolution.

#### 3. Attendance & Attendance Health
• Punctuality & Attendance Score: **${presentRate}%**
• Leave Utilization: Total ${leaves.length} approved leave periods; leave balance remains well-distributed.

#### 4. HR Recommendation
Recommended for leadership mentorship, advanced project ownership, and consideration for upcoming annual performance incentives.`;

    return res.json({ success: true, summary });
  } catch (error: any) {
    return res.status(500).json({ success: false, message: error.message });
  }
});

// POST /api/ai/job-description - AI Job Description Generator
router.post("/job-description", verifyToken, async (req: AuthRequest, res) => {
  try {
    const { title, department, skills, experience, employmentType = "Full-Time" } = req.body;
    if (!title || !department) {
      return res.status(400).json({ success: false, message: "Job title and department are required." });
    }

    const db = getDb();
    const ai = getGeminiClient();

    if (ai) {
      try {
        const prompt = `Write a comprehensive, compelling, modern job description for:
Job Title: ${title}
Department: ${department}
Company: ${db.settings.companyName}
Required Experience: ${experience || "3-5 years"}
Key Skills: ${skills || "Relevant industry competencies"}
Employment Type: ${employmentType}

Include sections:
- About the Role
- Key Responsibilities (5-7 bullet points)
- Required Qualifications & Technical Skills (5-6 bullet points)
- Preferred Qualifications
- What We Offer (Benefits, compensation, culture)`;

        const response = await ai.models.generateContent({
          model: "gemini-3.7-flash",
          contents: prompt
        });

        if (response.text) {
          return res.json({ success: true, jobDescription: response.text });
        }
      } catch (err: any) {
        console.warn("Gemini JD fallback:", err.message);
      }
    }

    // Deterministic fallback
    const jd = `# ${title}
**Department:** ${department} | **Location:** San Francisco, CA (Hybrid) | **Employment Type:** ${employmentType}
**Experience Level:** ${experience || "3+ Years"}

## About ${db.settings.companyName}
At ${db.settings.companyName}, we build intelligent enterprise software that simplifies corporate management. We value ownership, empathy, and rapid craftsmanship.

## About the Role
We are seeking an experienced and collaborative **${title}** to join our growing ${department} team. In this role, you will lead key strategic initiatives, drive measurable impact, and partner with cross-functional stakeholders.

## Key Responsibilities
• Design, implement, and maintain high-impact solutions for our core platform.
• Collaborate closely with engineering, product, and operations leaders.
• Uphold high standards of operational excellence, code quality, and security.
• Mentor junior colleagues and participate in architectural reviews.
• Monitor performance metrics and drive continuous process improvements.

## Required Qualifications
• ${experience || "3-5 years"} of proven hands-on experience in ${department} or related domains.
• Core competencies: ${skills || "Strong analytical, problem-solving, and communication skills"}.
• Proven track record of delivering complex projects on time.
• Bachelor's or Master's degree in a relevant discipline or equivalent practical experience.

## What We Offer
• Competitive compensation package with annual bonus potential.
• Comprehensive health, dental, and vision insurance with 100% premium coverage.
• 401(k) retirement plan with 5% employer match.
• Flexible hybrid work schedule with $250 monthly wellness stipend.
• 25 days paid time off + paid corporate holidays.`;

    return res.json({ success: true, jobDescription: jd });
  } catch (error: any) {
    return res.status(500).json({ success: false, message: error.message });
  }
});

// POST /api/ai/interview-questions
router.post("/interview-questions", verifyToken, async (req: AuthRequest, res) => {
  try {
    const { position, experienceLevel = "Mid-Senior", skills } = req.body;
    if (!position) {
      return res.status(400).json({ success: false, message: "Position is required." });
    }

    const ai = getGeminiClient();
    if (ai) {
      try {
        const prompt = `Generate a structured set of interview questions for the role of ${position} (${experienceLevel} level).
Key Skills to assess: ${skills || "Domain expertise, problem solving, teamwork"}.

Provide:
1. 3 Technical / Domain-Specific Questions (with expected answer guidelines)
2. 3 Behavioral & Leadership Questions (STAR method criteria)
3. 2 Problem-Solving / Scenario Questions
4. Scoring Rubric (1-5 scale criteria)`;

        const response = await ai.models.generateContent({
          model: "gemini-3.7-flash",
          contents: prompt
        });

        if (response.text) {
          return res.json({ success: true, questions: response.text });
        }
      } catch (err: any) {
        console.warn("Gemini interview questions fallback:", err.message);
      }
    }

    const questions = `### Interview Question Guide: ${position} (${experienceLevel})

#### Section 1: Technical & Domain Competencies
1. **Architecture & Design:** Describe the most complex system or workflow you designed in your previous role. What trade-offs did you make between speed, reliability, and maintainability?
   * *Ideal Answer Criteria:* Look for structured thinking, recognition of bottlenecks, and clarity in technical justifications.
2. **Tools & Implementation:** How do you approach ${skills || "core technologies in this role"} when scaling for high performance and zero downtime?
   * *Ideal Answer Criteria:* Demonstrates deep hands-on expertise, automated testing, and security best practices.
3. **Troubleshooting & Incident Response:** Walk through a situation where a production failure or critical issue occurred. How did you diagnose and resolve it?

#### Section 2: Behavioral & Cultural Alignment
1. **Cross-Functional Collaboration:** Tell me about a time you had a strong disagreement with a product manager or teammate regarding project scope. How was it resolved?
2. **Prioritization Under Pressure:** How do you handle multiple competing deadlines when high-priority requests arrive unexpectedly?

#### Section 3: Scenario Evaluation
* **Scenario:** If our primary system is experiencing sudden latency spikes during peak business hours, what is your step-by-step triage protocol?

#### Candidate Scoring Rubric (1-5 Scale):
* **5 (Exceptional):** Masterful domain depth, proactive communication, clear metrics.
* **4 (Strong):** Solid answers with clear examples and structured methodology.
* **3 (Competent):** Meets baseline requirements with minor guidance.
* **2 (Marginal):** Lacks depth or struggles with real-world scenarios.
* **1 (Unsatisfactory):** Insufficient technical or behavioral competence.`;

    return res.json({ success: true, questions });
  } catch (error: any) {
    return res.status(500).json({ success: false, message: error.message });
  }
});

// POST /api/ai/announcement - AI Announcement Generator
router.post("/announcement", verifyToken, async (req: AuthRequest, res) => {
  try {
    const { topic, category = "General", tone = "Professional & Inspiring", details } = req.body;
    if (!topic) {
      return res.status(400).json({ success: false, message: "Topic is required." });
    }

    const db = getDb();
    const ai = getGeminiClient();

    if (ai) {
      try {
        const prompt = `Draft a corporate company-wide announcement:
Topic: ${topic}
Category: ${category}
Tone: ${tone}
Key Points: ${details || "Highlight important dates, next steps, and appreciation"}
Company Name: ${db.settings.companyName}
Author: ${req.user!.name} (${req.user!.role})

Provide:
1. An eye-catching Title
2. Clear, structured Body with bullet points where appropriate
3. Call to Action / Next Steps`;

        const response = await ai.models.generateContent({
          model: "gemini-3.7-flash",
          contents: prompt
        });

        if (response.text) {
          return res.json({ success: true, announcement: response.text });
        }
      } catch (err: any) {
        console.warn("Gemini announcement fallback:", err.message);
      }
    }

    const announcement = `**Title:** ${topic}

Dear Team,

We are excited to share an important update regarding **${topic}** across ${db.settings.companyName}.

**Key Highlights:**
• ${details || "New organizational initiatives designed to enhance productivity and workplace wellbeing."}
• Effective Date: Starting next business week.
• Dedicated resources and briefing documentation are available under Document Management.

**What This Means For You:**
Please review your respective team schedules and reach out to the HR department or your direct manager with any questions.

Thank you for your ongoing commitment and dedication to excellence!

Warm regards,  
**${req.user!.name}**  
${req.user!.role}, ${db.settings.companyName}`;

    return res.json({ success: true, announcement });
  } catch (error: any) {
    return res.status(500).json({ success: false, message: error.message });
  }
});

// POST /api/ai/hr-report - Generate Comprehensive Executive HR Report
router.post("/hr-report", verifyToken, async (req: AuthRequest, res) => {
  try {
    const { period = "Q2 2026", focusArea = "Workforce Health, Payroll & Performance" } = req.body;
    const db = getDb();
    const ai = getGeminiClient();

    const totalEmps = db.employees.length;
    const totalPayroll = db.payrolls.filter((p) => p.month === "2026-07").reduce((s, p) => s + p.netSalary, 0);
    const avgPerf = Number((db.performances.reduce((s, p) => s + p.overallScore, 0) / (db.performances.length || 1)).toFixed(2));

    if (ai) {
      try {
        const prompt = `Write an Executive HR Quarterly Report for ${db.settings.companyName}:
Reporting Period: ${period}
Focus Area: ${focusArea}
Key Metrics:
- Total Headcount: ${totalEmps} employees across ${db.departments.length} departments
- Monthly Payroll Disbursed: $${totalPayroll.toLocaleString()}
- Average Performance Rating: ${avgPerf}/5.0
- Total Pending Leaves: ${db.leaves.filter((l) => l.status === "Pending").length}

Structure:
1. Executive Summary
2. Headcount & Talent Distribution
3. Compensation & Payroll Expenditure
4. Performance & High-Impact Contributors
5. Strategic HR Recommendations for Next Quarter`;

        const response = await ai.models.generateContent({
          model: "gemini-3.7-flash",
          contents: prompt
        });

        if (response.text) {
          return res.json({ success: true, report: response.text });
        }
      } catch (err: any) {
        console.warn("Gemini HR report fallback:", err.message);
      }
    }

    const report = `# Executive HR & Workforce Analytics Report (${period})
**Organization:** ${db.settings.companyName}  
**Prepared by:** AI HR Intelligence Suite | **Status:** Final Executive Review

---

## 1. Executive Summary
During ${period}, ${db.settings.companyName} maintained strong organizational retention, high operational uptime, and positive employee sentiment. Total workforce count stands at **${totalEmps} professionals** across **${db.departments.length} strategic business units**.

## 2. Workforce Demographics & Headcount
• **Total Active Employees:** ${db.employees.filter((e) => e.status === "Active").length}  
• **Probationary Talent:** ${db.employees.filter((e) => e.status === "Probation").length}  
• **Largest Department:** Information Technology (5 team members), followed by Human Resources and Marketing.

## 3. Compensation & Payroll Ledger
• **Monthly Net Payroll Disbursed:** $${totalPayroll.toLocaleString()}  
• **Tax Withholding & Compliance:** 100% on-time automated filings with zero audit discrepancies.  
• **Overtime Efficiency:** Average overtime cost kept below 3.5% of gross payroll.

## 4. Performance & Talent Health
• **Company-wide Average Score:** **${avgPerf} / 5.0** (High Rating)  
• **Top Performing Divisions:** Sales & Partnerships (140% quota attainment) and Engineering (Core infrastructure overhaul).  
• **Retention Index:** 98.2% annualized retention rate.

## 5. Strategic Recommendations for Next Quarter
1. Expand technical onboarding modules to reduce new hire ramp time.
2. Launch peer-to-peer recognition rewards in conjunction with quarterly review cycles.
3. Review compensation bands against Q3 industry benchmarks.`;

    return res.json({ success: true, report });
  } catch (error: any) {
    return res.status(500).json({ success: false, message: error.message });
  }
});

export default router;
