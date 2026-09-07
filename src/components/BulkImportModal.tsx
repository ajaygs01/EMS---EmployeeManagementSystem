import React, { useState, useRef } from "react";
import { Modal } from "./Modal";
import { Upload, FileText, CheckCircle2, AlertCircle, Download, RefreshCw } from "lucide-react";
import { api } from "../services/api";
import { useToast } from "../context/ToastContext";
import { Department } from "../types";

interface BulkImportModalProps {
  isOpen: boolean;
  onClose: () => void;
  departments: Department[];
  onSuccess: () => void;
}

interface ParsedEmployeeRow {
  rowNum: number;
  employeeId?: string;
  firstName: string;
  lastName: string;
  email: string;
  phone?: string;
  gender?: string;
  department?: string;
  position?: string;
  role?: string;
  salary?: number;
  employmentType?: string;
  status?: string;
  joiningDate?: string;
  emergencyContactName?: string;
  emergencyContactPhone?: string;
  isValid: boolean;
  errorReason?: string;
}

export const BulkImportModal: React.FC<BulkImportModalProps> = ({
  isOpen,
  onClose,
  departments,
  onSuccess
}) => {
  const { success, error } = useToast();
  const fileInputRef = useRef<HTMLInputElement | null>(null);

  const [csvFile, setCsvFile] = useState<File | null>(null);
  const [parsedRows, setParsedRows] = useState<ParsedEmployeeRow[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [importResults, setImportResults] = useState<{
    successCount: number;
    errorCount: number;
    errors: any[];
  } | null>(null);

  const handleDownloadTemplate = () => {
    const headers = [
      "Employee ID",
      "First Name",
      "Last Name",
      "Email",
      "Phone",
      "Gender",
      "Department",
      "Designation",
      "Role",
      "Salary",
      "Employment Type",
      "Status",
      "Joining Date",
      "Emergency Contact Name",
      "Emergency Contact Phone"
    ];

    const sampleRow1 = [
      "EMP-501",
      "Rohan",
      "Sharma",
      "rohan.sharma@bharatcorp.in",
      "+91 98765 12345",
      "Male",
      departments[0]?.name || "Engineering",
      "Senior Full Stack Engineer",
      "Employee",
      "1800000",
      "Full-Time",
      "Active",
      new Date().toISOString().slice(0, 10),
      "Sunita Sharma",
      "+91 98765 99999"
    ];

    const sampleRow2 = [
      "EMP-502",
      "Ananya",
      "Deshmukh",
      "ananya.deshmukh@bharatcorp.in",
      "+91 98111 22334",
      "Female",
      departments[1]?.name || "Product & Design",
      "Product Design Lead",
      "Manager",
      "1600000",
      "Full-Time",
      "Active",
      new Date().toISOString().slice(0, 10),
      "Rajesh Deshmukh",
      "+91 98111 88888"
    ];

    const csvContent =
      "data:text/csv;charset=utf-8," +
      [headers.join(","), sampleRow1.join(","), sampleRow2.join(",")].join("\n");

    const encodedUri = encodeURI(csvContent);
    const link = document.createElement("a");
    link.setAttribute("href", encodedUri);
    link.setAttribute("download", "ems_employee_import_template.csv");
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    success("CSV template downloaded.");
  };

  const parseCsvText = (text: string) => {
    const lines = text.split(/\r?\n/).filter((l) => l.trim().length > 0);
    if (lines.length <= 1) {
      error("The uploaded CSV appears to be empty or contains only headers.");
      return;
    }

    const rawHeaders = lines[0].split(",").map((h) => h.replace(/(^"|"$)/g, "").trim().toLowerCase());

    const rows: ParsedEmployeeRow[] = [];

    for (let i = 1; i < lines.length; i++) {
      // Basic CSV splitter respecting simple quotes
      const values = lines[i].split(/,(?=(?:(?:[^"]*"){2})*[^"]*$)/).map((v) => v.replace(/(^"|"$)/g, "").trim());

      const getVal = (keywords: string[]) => {
        const idx = rawHeaders.findIndex((h) => keywords.some((k) => h.includes(k)));
        return idx !== -1 && values[idx] ? values[idx] : "";
      };

      const firstName = getVal(["first name", "firstname", "first"]) || (values[1] || "");
      const lastName = getVal(["last name", "lastname", "last"]) || (values[2] || "");
      const email = getVal(["email", "mail"]) || (values[3] || "");
      const employeeId = getVal(["employee id", "empid", "id"]) || values[0];
      const phone = getVal(["phone", "mobile", "contact"]) || "+91 98765 00000";
      const gender = getVal(["gender", "sex"]) || "Other";
      const department = getVal(["dept", "department"]) || departments[0]?.name || "General";
      const position = getVal(["designation", "position", "title", "job"]) || "Associate";
      const role = getVal(["role", "permission"]) || "Employee";
      const salary = Number(getVal(["salary", "pay", "compensation"])) || 1200000;
      const employmentType = getVal(["type", "employment type"]) || "Full-Time";
      const status = getVal(["status"]) || "Active";
      const joiningDate = getVal(["date", "joining date", "joined"]) || new Date().toISOString().slice(0, 10);
      const emergencyContactName = getVal(["emergency name", "contact name", "emergency contact"]) || "Family Contact";
      const emergencyContactPhone = getVal(["emergency phone", "contact number"]) || phone;

      let isValid = true;
      let errorReason = "";

      if (!firstName || !lastName) {
        isValid = false;
        errorReason = "First or Last Name is missing.";
      } else if (!email || !email.includes("@")) {
        isValid = false;
        errorReason = "Invalid or missing email address.";
      }

      rows.push({
        rowNum: i,
        employeeId,
        firstName,
        lastName,
        email,
        phone,
        gender,
        department,
        position,
        role,
        salary,
        employmentType,
        status,
        joiningDate,
        emergencyContactName,
        emergencyContactPhone,
        isValid,
        errorReason
      });
    }

    setParsedRows(rows);
  };

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    setCsvFile(file);
    setImportResults(null);

    const reader = new FileReader();
    reader.onload = (evt) => {
      const content = evt.target?.result as string;
      if (content) {
        parseCsvText(content);
      }
    };
    reader.readAsText(file);
  };

  const handleDrop = (e: React.DragEvent<HTMLDivElement>) => {
    e.preventDefault();
    const file = e.dataTransfer.files?.[0];
    if (file && file.name.endsWith(".csv")) {
      setCsvFile(file);
      setImportResults(null);
      const reader = new FileReader();
      reader.onload = (evt) => {
        const content = evt.target?.result as string;
        if (content) {
          parseCsvText(content);
        }
      };
      reader.readAsText(file);
    } else {
      error("Please drop a valid .csv file.");
    }
  };

  const handleExecuteImport = async () => {
    const validRows = parsedRows.filter((r) => r.isValid);
    if (validRows.length === 0) {
      error("No valid employee rows to import. Please check validation errors.");
      return;
    }

    try {
      setIsLoading(true);
      const res = await api.bulkImportEmployees(validRows);
      if (res.success) {
        setImportResults({
          successCount: res.importedCount,
          errorCount: res.errorsCount,
          errors: res.errors || []
        });
        success(`Bulk import completed: ${res.importedCount} employees added.`);
        onSuccess();
      }
    } catch (err: any) {
      error(err.message || "Failed to execute bulk employee import.");
    } finally {
      setIsLoading(false);
    }
  };

  const validCount = parsedRows.filter((r) => r.isValid).length;
  const invalidCount = parsedRows.filter((r) => !r.isValid).length;

  return (
    <Modal
      isOpen={isOpen}
      onClose={() => {
        setParsedRows([]);
        setCsvFile(null);
        setImportResults(null);
        onClose();
      }}
      title="Bulk Import Employees via CSV"
      subtitle="Upload a CSV spreadsheet with employee roster details to create personnel records and user credentials in batch."
      maxWidth="4xl"
    >
      <div className="space-y-5 text-xs sm:text-sm">
        {/* Top Action Bar */}
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 p-4 rounded-2xl bg-orange-500/10 border border-orange-500/20 card-3d">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-2xl bg-gradient-to-br from-orange-500 to-amber-600 text-white flex items-center justify-center font-bold shadow-lg shadow-orange-600/30">
              <FileText className="w-5 h-5" />
            </div>
            <div>
              <div className="font-bold text-zinc-900 dark:text-white">Need the correct column format?</div>
              <div className="text-xs text-zinc-500 dark:text-zinc-400">Download the standard template containing all personal & employment headers.</div>
            </div>
          </div>
          <button
            onClick={handleDownloadTemplate}
            className="px-3.5 py-2.5 rounded-xl bg-white dark:bg-zinc-800 border border-zinc-200 dark:border-zinc-700 text-zinc-700 dark:text-zinc-200 font-semibold hover:bg-zinc-50 dark:hover:bg-zinc-750 flex items-center gap-2 shrink-0 transition-colors shadow-sm cursor-pointer"
          >
            <Download className="w-4 h-4 text-orange-500" />
            <span>Download CSV Template</span>
          </button>
        </div>

        {/* Upload Zone */}
        {!csvFile && (
          <div
            onDragOver={(e) => e.preventDefault()}
            onDrop={handleDrop}
            onClick={() => fileInputRef.current?.click()}
            className="border-2 border-dashed border-zinc-300 dark:border-zinc-700 hover:border-orange-500 rounded-3xl p-8 text-center cursor-pointer transition-all bg-zinc-50/50 dark:bg-zinc-850/50 card-3d"
          >
            <input
              type="file"
              ref={fileInputRef}
              accept=".csv"
              onChange={handleFileChange}
              className="hidden"
            />
            <div className="w-12 h-12 rounded-2xl bg-orange-500/10 text-orange-500 flex items-center justify-center mx-auto mb-3">
              <Upload className="w-6 h-6" />
            </div>
            <h4 className="font-bold text-sm text-zinc-900 dark:text-white">Choose a CSV file or drag & drop here</h4>
            <p className="text-xs text-zinc-500 dark:text-zinc-400 mt-1">Supports standard CSV files (UTF-8) with up to 500 rows at once.</p>
          </div>
        )}

        {/* File Loaded & Preview Table */}
        {csvFile && (
          <div className="space-y-4">
            <div className="flex flex-wrap items-center justify-between gap-3 p-3.5 bg-zinc-100 dark:bg-zinc-800/80 rounded-2xl border border-zinc-200 dark:border-zinc-700">
              <div className="flex items-center gap-2">
                <FileText className="w-4 h-4 text-orange-500" />
                <span className="font-bold text-zinc-800 dark:text-zinc-200">{csvFile.name}</span>
                <span className="text-xs text-zinc-400">({(csvFile.size / 1024).toFixed(1)} KB)</span>
              </div>
              <div className="flex items-center gap-3">
                <span className="text-xs font-semibold text-emerald-400 bg-emerald-950/50 border border-emerald-800/60 px-2.5 py-1 rounded-lg">
                  {validCount} Valid
                </span>
                {invalidCount > 0 && (
                  <span className="text-xs font-semibold text-rose-400 bg-rose-950/50 border border-rose-800/60 px-2.5 py-1 rounded-lg">
                    {invalidCount} Errors
                  </span>
                )}
                <button
                  onClick={() => {
                    setCsvFile(null);
                    setParsedRows([]);
                    setImportResults(null);
                  }}
                  className="text-xs text-zinc-400 hover:text-zinc-200 underline cursor-pointer"
                >
                  Change File
                </button>
              </div>
            </div>

            {/* Preview List */}
            <div className="max-h-64 overflow-y-auto border border-zinc-200 dark:border-zinc-800 rounded-2xl overflow-hidden">
              <table className="w-full text-left text-xs">
                <thead className="bg-zinc-50 dark:bg-zinc-800 text-zinc-400 font-semibold sticky top-0 border-b border-zinc-200 dark:border-zinc-700">
                  <tr>
                    <th className="p-2.5">Row</th>
                    <th className="p-2.5">Status</th>
                    <th className="p-2.5">Name</th>
                    <th className="p-2.5">Email</th>
                    <th className="p-2.5">Department</th>
                    <th className="p-2.5">Designation</th>
                    <th className="p-2.5">Salary</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-zinc-100 dark:divide-zinc-800">
                  {parsedRows.map((row) => (
                    <tr
                      key={row.rowNum}
                      className={row.isValid ? "hover:bg-zinc-50 dark:hover:bg-zinc-800/50" : "bg-rose-950/20"}
                    >
                      <td className="p-2.5 font-mono text-zinc-400">#{row.rowNum}</td>
                      <td className="p-2.5">
                        {row.isValid ? (
                          <span className="inline-flex items-center gap-1 text-emerald-400 font-semibold text-[11px]">
                            <CheckCircle2 className="w-3.5 h-3.5" /> Valid
                          </span>
                        ) : (
                          <span className="inline-flex items-center gap-1 text-rose-400 font-semibold text-[11px]" title={row.errorReason}>
                            <AlertCircle className="w-3.5 h-3.5" /> {row.errorReason || "Error"}
                          </span>
                        )}
                      </td>
                      <td className="p-2.5 font-bold text-zinc-800 dark:text-zinc-200">
                        {row.firstName} {row.lastName}
                      </td>
                      <td className="p-2.5 font-mono text-zinc-600 dark:text-zinc-400">{row.email}</td>
                      <td className="p-2.5">{row.department}</td>
                      <td className="p-2.5">{row.position}</td>
                      <td className="p-2.5 font-mono">₹{row.salary?.toLocaleString()}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>

            {/* Results Feedback if executed */}
            {importResults && (
              <div className="p-4 rounded-2xl bg-emerald-950/40 border border-emerald-800 text-xs text-emerald-300 card-3d">
                <div className="font-bold flex items-center gap-2 text-sm mb-1">
                  <CheckCircle2 className="w-4 h-4 text-emerald-400" />
                  Import Execution Finished
                </div>
                <p>
                  Successfully created {importResults.successCount} employee records and provisioned user accounts (Default Password: <code className="font-mono bg-emerald-900/60 px-1 py-0.5 rounded">Employee@123</code>).
                </p>
                {importResults.errorCount > 0 && (
                  <div className="mt-2 text-rose-400">
                    {importResults.errorCount} rows skipped due to duplicate emails or errors.
                  </div>
                )}
              </div>
            )}
          </div>
        )}

        {/* Modal Actions */}
        <div className="flex items-center justify-between border-t border-zinc-100 dark:border-zinc-800 pt-4">
          <button
            type="button"
            onClick={onClose}
            className="px-4 py-2.5 font-medium text-zinc-600 dark:text-zinc-400 hover:bg-zinc-100 dark:hover:bg-zinc-800 rounded-xl transition-colors cursor-pointer"
          >
            {importResults ? "Close" : "Cancel"}
          </button>

          {csvFile && !importResults && (
            <button
              onClick={handleExecuteImport}
              disabled={isLoading || validCount === 0}
              className="px-5 py-2.5 font-bold text-white bg-gradient-to-r from-orange-600 to-amber-600 hover:from-orange-500 hover:to-amber-500 disabled:opacity-50 rounded-xl shadow-lg shadow-orange-600/30 transition-all flex items-center gap-2 cursor-pointer"
            >
              {isLoading ? (
                <>
                  <RefreshCw className="w-4 h-4 animate-spin" />
                  <span>Importing Records...</span>
                </>
              ) : (
                <>
                  <Upload className="w-4 h-4" />
                  <span>Import {validCount} Employees</span>
                </>
              )}
            </button>
          )}
        </div>
      </div>
    </Modal>
  );
};
