import { useCallback, useEffect, useState, useMemo } from "react";
import { useSearchParams } from "react-router-dom";
import {
  AlertCircle, Calendar, Check, ChevronRight, Edit3, Loader2,
  Plus, Save, Search, Trash2, Users, X, FolderOpen, Info,
  ArrowUp, ArrowDown, Video, Link2, FileText, Globe, Lock, Download, FileCode, PlaySquare
} from "lucide-react";
import { useAuth } from "../../auth/useAuth";
import { adminApi } from "../../lib/clientApi";

/* ─── helpers ─── */

function fmt(date) {
  if (!date) return "";
  const d = new Date(date);
  if (Number.isNaN(d.getTime())) return "";
  return d.toISOString().split("T")[0];
}

function fmtDisplay(date) {
  if (!date) return "—";
  const d = new Date(date);
  if (Number.isNaN(d.getTime())) return "—";
  return d.toLocaleDateString("en-IN", { day: "numeric", month: "short", year: "numeric" });
}

function initials(name = "") {
  return name.split(" ").map((p) => p[0] || "").join("").slice(0, 2).toUpperCase();
}

function fileIcon(type = "") {
  const t = type.toLowerCase();
  if (t === "pdf") return <FileText size={16} />;
  if (t === "image" || t === "png" || t === "jpg") return <PlaySquare size={16} />;
  if (t === "figma") return <FileCode size={16} />;
  return <FileText size={16} />;
}

/* ─── tiny design atoms ─── */

function Pill({ label, color = "default" }) {
  const styles = {
    default: "bg-[#eee1cf] text-[#331405]",
    green:   "bg-emerald-50 text-emerald-700 border border-emerald-200",
    amber:   "bg-amber-50 text-amber-700 border border-amber-200",
    red:     "bg-red-50 text-red-700 border border-red-200",
    copper:  "bg-[#e3d6c5] text-[#331405] border border-[#ffdbcc]",
    blue:    "bg-blue-50 text-blue-700 border border-blue-200",
  };
  return (
    <span className={`inline-flex items-center rounded-full px-2 py-0.5 text-[10px] font-bold uppercase tracking-wide ${styles[color]}`}>
      {label}
    </span>
  );
}

function statusPill(status) {
  const map = {
    not_started: { label: "Not Started", color: "default" },
    in_progress:  { label: "In Progress",  color: "copper" },
    on_hold:      { label: "On Hold",       color: "amber" },
    completed:    { label: "Completed",     color: "green" },
    cancelled:    { label: "Cancelled",     color: "red" },
  };
  return map[status] || { label: status, color: "default" };
}

function stagePill(status) {
  const map = {
    pending:     { label: "Pending",     color: "default" },
    in_progress: { label: "In Progress", color: "copper" },
    completed:   { label: "Done",        color: "green" },
    delayed:     { label: "Delayed",     color: "red" },
  };
  return map[status] || { label: status, color: "default" };
}

function docStatusPill(status) {
  const map = {
    pending_review: { label: "Review", color: "amber" },
    approved:       { label: "Approved", color: "green" },
    final_delivery: { label: "Final", color: "copper" },
    internal:       { label: "Internal", color: "default" },
  };
  return map[status] || { label: status, color: "default" };
}

function Spinner({ size = 16 }) {
  return <Loader2 size={size} className="animate-spin text-[#331405]" />;
}

function Toast({ message, type = "success", onClose }) {
  if (!message) return null;
  return (
    <div className={`fixed bottom-6 right-6 z-50 flex items-center gap-3 rounded-xl border px-4 py-3 shadow-xl text-sm font-semibold ${
      type === "error" ? "bg-red-50 border-red-200 text-red-800" : "bg-emerald-50 border-emerald-200 text-emerald-800"
    }`} style={{ animation: "toast-in .2s ease" }}>
      {type === "error" ? <AlertCircle size={15} /> : <Check size={15} />}
      {message}
      <button onClick={onClose} className="ml-2 opacity-60 hover:opacity-100"><X size={13} /></button>
    </div>
  );
}

function SectionCard({ children, className = "" }) {
  return (
    <div className={`rounded-xl border border-[#e3d6c5] bg-[#e3d6c5] shadow-sm ${className}`}>
      {children}
    </div>
  );
}

/* ─── STAGE EDITOR ─── */

const BLANK_STAGE = { name: "", status: "pending", startDate: "", endDate: "", notes: "", clientVisible: true, internalNotes: "" };

function StageEditor({ stages, onChange }) {
  function update(i, patch) {
    onChange(stages.map((s, idx) => idx === i ? { ...s, ...patch } : s));
  }
  function remove(i) {
    onChange(stages.filter((_, idx) => idx !== i));
  }
  function add() {
    onChange([...stages, { ...BLANK_STAGE }]);
  }
  function moveUp(i) {
    if (i === 0) return;
    const next = [...stages];
    const temp = next[i];
    next[i] = next[i - 1];
    next[i - 1] = temp;
    onChange(next);
  }
  function moveDown(i) {
    if (i === stages.length - 1) return;
    const next = [...stages];
    const temp = next[i];
    next[i] = next[i + 1];
    next[i + 1] = temp;
    onChange(next);
  }

  return (
    <div className="space-y-3">
      {stages.map((stage, i) => (
        <div key={i} className="rounded-xl border border-[#e3d6c5] bg-[#f9ebe6]/60 p-4">
          <div className="flex items-center gap-3 mb-3">
            <div className="w-6 h-6 rounded-full bg-[#331405] text-[#f0ede4] text-[10px] font-bold flex items-center justify-center flex-shrink-0">
              {i + 1}
            </div>
            <input
              value={stage.name}
              onChange={e => update(i, { name: e.target.value })}
              placeholder="Stage name (e.g. Discovery & Research)"
              className="flex-1 rounded-lg border border-[#e3d6c5] bg-[#f0ede4] px-3 py-1.5 text-sm font-semibold outline-none focus:border-[#331405] focus:ring-2 focus:ring-[#ffdbcc]/60"
            />
            <select
              value={stage.status}
              onChange={e => update(i, { status: e.target.value })}
              className="rounded-lg border border-[#e3d6c5] bg-[#f0ede4] px-2 py-1.5 text-xs font-semibold outline-none focus:border-[#331405]"
            >
              <option value="pending">Pending</option>
              <option value="in_progress">In Progress</option>
              <option value="completed">Completed</option>
              <option value="delayed">Delayed</option>
            </select>
            <div className="flex flex-col gap-0.5 flex-shrink-0">
              <button type="button" disabled={i === 0} onClick={() => moveUp(i)} className="p-0.5 rounded bg-[#f0ede4] border border-[#e3d6c5] hover:bg-[#e3d6c5] text-[#331405] hover:text-[#331405] disabled:opacity-35" title="Move up">
                <ArrowUp size={10} />
              </button>
              <button type="button" disabled={i === stages.length - 1} onClick={() => moveDown(i)} className="p-0.5 rounded bg-[#f0ede4] border border-[#e3d6c5] hover:bg-[#e3d6c5] text-[#331405] hover:text-[#331405] disabled:opacity-35" title="Move down">
                <ArrowDown size={10} />
              </button>
            </div>
            <button onClick={() => remove(i)} className="rounded-lg p-1.5 text-[#331405] hover:bg-red-50 hover:text-red-600 transition-colors">
              <Trash2 size={13} />
            </button>
          </div>
          <div className="grid grid-cols-2 gap-3 mb-3">
            <label className="block">
              <span className="text-[10px] font-bold uppercase tracking-wider text-[#331405]">Start Date</span>
              <input
                type="date"
                value={fmt(stage.startDate)}
                onChange={e => update(i, { startDate: e.target.value })}
                className="mt-1 w-full rounded-lg border border-[#e3d6c5] bg-[#f0ede4] px-3 py-1.5 text-sm outline-none focus:border-[#331405] focus:ring-2 focus:ring-[#ffdbcc]/60"
              />
            </label>
            <label className="block">
              <span className="text-[10px] font-bold uppercase tracking-wider text-[#331405]">End Date</span>
              <input
                type="date"
                value={fmt(stage.endDate)}
                onChange={e => update(i, { endDate: e.target.value })}
                className="mt-1 w-full rounded-lg border border-[#e3d6c5] bg-[#f0ede4] px-3 py-1.5 text-sm outline-none focus:border-[#331405] focus:ring-2 focus:ring-[#ffdbcc]/60"
              />
            </label>
          </div>
          <textarea
            value={stage.notes}
            onChange={e => update(i, { notes: e.target.value })}
            placeholder="Stage notes (visible to client)…"
            rows={2}
            className="w-full rounded-lg border border-[#e3d6c5] bg-[#f0ede4] px-3 py-2 text-sm outline-none resize-none focus:border-[#331405] focus:ring-2 focus:ring-[#ffdbcc]/60"
          />
          <div className="flex items-center gap-2 mt-2 mb-2">
            <input
              type="checkbox"
              id={`stage-visible-${i}`}
              checked={stage.clientVisible ?? true}
              onChange={e => update(i, { clientVisible: e.target.checked })}
              className="rounded border-[#e3d6c5] text-[#331405] focus:ring-[#331405]"
            />
            <label htmlFor={`stage-visible-${i}`} className="text-xs font-bold text-[#331405] cursor-pointer selection:bg-transparent">
              Client Visible
            </label>
          </div>
          <textarea
            value={stage.internalNotes || ""}
            onChange={e => update(i, { internalNotes: e.target.value })}
            placeholder="Internal notes (hidden from client)…"
            rows={2}
            className="w-full rounded-lg border border-[#e3d6c5] bg-[#f0ede4] px-3 py-2 text-sm outline-none resize-none focus:border-[#331405] focus:ring-2 focus:ring-[#ffdbcc]/60"
          />
        </div>
      ))}
      <button
        onClick={add}
        className="flex items-center gap-2 w-full justify-center rounded-xl border-2 border-dashed border-[#e3d6c5] py-3 text-xs font-bold text-[#331405] hover:border-[#331405] hover:bg-[#e3d6c5] transition-all"
      >
        <Plus size={14} /> Add Stage
      </button>
    </div>
  );
}

/* ─── PROJECT FORM ─── */

const BLANK_PROJECT = {
  name: "",
  description: "",
  packageName: "",
  status: "not_started",
  progress: 0,
  currentPhase: "",
  startDate: "",
  expectedEndDate: "",
  adminNotes: "",
  stages: [],
  deliverables: [],
};

function ProjectForm({ initial, clientId, token, onSaved, onCancel }) {
  const [form, setForm] = useState(() => ({
    ...BLANK_PROJECT,
    ...(initial || {}),
    startDate: fmt(initial?.startDate),
    expectedEndDate: fmt(initial?.expectedEndDate),
    stages: (initial?.stages || []).map(s => ({
      ...s,
      startDate: fmt(s.startDate),
      endDate: fmt(s.endDate),
    })),
  }));
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState("");

  function patch(key, value) {
    setForm(f => ({ ...f, [key]: value }));
  }

  const calculatedProgress = useMemo(() => {
    const total = form.stages.length;
    if (total === 0) return 0;
    const completed = form.stages.filter(s => s.status === "completed").length;
    return Math.round((completed / total) * 100);
  }, [form.stages]);

  async function handleSubmit(e) {
    e.preventDefault();
    if (!form.name.trim()) { setError("Project name is required."); return; }
    setSaving(true);
    setError("");
    try {
      const payload = { ...form, clientId, progress: calculatedProgress };
      const saved = initial?._id
        ? await adminApi.updateProject(initial._id, payload, token)
        : await adminApi.createProject(payload, token);
      onSaved(saved);
    } catch (err) {
      setError(err.message || "Failed to save project.");
    } finally {
      setSaving(false);
    }
  }

  return (
    <form onSubmit={handleSubmit}>
      <div className="space-y-5">
        {/* Basic Info */}
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          <label className="block sm:col-span-2">
            <span className="text-xs font-bold text-[#331405]">Project Name *</span>
            <input value={form.name} onChange={e => patch("name", e.target.value)} placeholder="e.g. Monolith Architectural Identity"
              className="mt-1.5 w-full rounded-xl border border-[#e3d6c5] bg-[#f0ede4] px-3 py-2 text-sm outline-none focus:border-[#331405] focus:ring-4 focus:ring-[#ffdbcc]/50" />
          </label>
          <label className="block">
            <span className="text-xs font-bold text-[#331405]">Package / Service</span>
            <input value={form.packageName} onChange={e => patch("packageName", e.target.value)} placeholder="e.g. Growth Studio"
              className="mt-1.5 w-full rounded-xl border border-[#e3d6c5] bg-[#f0ede4] px-3 py-2 text-sm outline-none focus:border-[#331405] focus:ring-4 focus:ring-[#ffdbcc]/50" />
          </label>
          <label className="block">
            <span className="text-xs font-bold text-[#331405]">Current Phase</span>
            <input value={form.currentPhase} onChange={e => patch("currentPhase", e.target.value)} placeholder="e.g. Logo Development"
              className="mt-1.5 w-full rounded-xl border border-[#e3d6c5] bg-[#f0ede4] px-3 py-2 text-sm outline-none focus:border-[#331405] focus:ring-4 focus:ring-[#ffdbcc]/50" />
          </label>
          <label className="block">
            <span className="text-xs font-bold text-[#331405]">Status</span>
            <select value={form.status} onChange={e => patch("status", e.target.value)}
              className="mt-1.5 w-full rounded-xl border border-[#e3d6c5] bg-[#f0ede4] px-3 py-2 text-sm outline-none focus:border-[#331405]">
              <option value="not_started">Not Started</option>
              <option value="in_progress">In Progress</option>
              <option value="on_hold">On Hold</option>
              <option value="completed">Completed</option>
              <option value="cancelled">Cancelled</option>
            </select>
          </label>
          <div className="block">
            <span className="text-xs font-bold text-[#331405]">Progress % (Calculated)</span>
            <div className="mt-2.5 flex items-center gap-2">
              <div className="flex-1 h-2 rounded-full bg-[#e3d6c5] overflow-hidden">
                <div className="h-full rounded-full bg-[#331405]" style={{ width: `${calculatedProgress}%` }} />
              </div>
              <span className="text-sm font-bold text-[#331405]">{calculatedProgress}%</span>
            </div>
          </div>
          <label className="block">
            <span className="text-xs font-bold text-[#331405]">Start Date</span>
            <input type="date" value={form.startDate} onChange={e => patch("startDate", e.target.value)}
              className="mt-1.5 w-full rounded-xl border border-[#e3d6c5] bg-[#f0ede4] px-3 py-2 text-sm outline-none focus:border-[#331405] focus:ring-4 focus:ring-[#ffdbcc]/50" />
          </label>
          <label className="block">
            <span className="text-xs font-bold text-[#331405]">Expected End Date</span>
            <input type="date" value={form.expectedEndDate} onChange={e => patch("expectedEndDate", e.target.value)}
              className="mt-1.5 w-full rounded-xl border border-[#e3d6c5] bg-[#f0ede4] px-3 py-2 text-sm outline-none focus:border-[#331405] focus:ring-4 focus:ring-[#ffdbcc]/50" />
          </label>
        </div>

        {/* Description */}
        <label className="block">
          <span className="text-xs font-bold text-[#331405]">Description (internal)</span>
          <textarea value={form.description} onChange={e => patch("description", e.target.value)}
            rows={2} placeholder="Brief internal description of this project…"
            className="mt-1.5 w-full rounded-xl border border-[#e3d6c5] bg-[#f0ede4] px-3 py-2 text-sm outline-none resize-none focus:border-[#331405] focus:ring-4 focus:ring-[#ffdbcc]/50" />
        </label>

        {/* Admin Notes (visible to client) */}
        <label className="block">
          <div className="flex items-center gap-2 mb-1.5">
            <span className="text-xs font-bold text-[#331405]">Notes for Client</span>
            <span className="flex items-center gap-1 rounded-full bg-amber-50 px-2 py-0.5 text-[9px] font-bold text-amber-700 uppercase tracking-wide">
              <Info size={9} /> Client visible
            </span>
          </div>
          <textarea value={form.adminNotes} onChange={e => patch("adminNotes", e.target.value)}
            rows={3} placeholder="These notes are visible to the client in their portal timeline…"
            className="w-full rounded-xl border border-[#e3d6c5] bg-[#f0ede4] px-3 py-2 text-sm outline-none resize-none focus:border-[#331405] focus:ring-4 focus:ring-[#ffdbcc]/50" />
        </label>

        {/* Stages */}
        <div>
          <div className="flex items-center justify-between mb-3">
            <span className="text-xs font-bold text-[#331405]">Project Stages</span>
            <span className="flex items-center gap-1 rounded-full bg-amber-50 px-2 py-0.5 text-[9px] font-bold text-amber-700 uppercase tracking-wide">
              <Info size={9} /> Client visible
            </span>
          </div>
          <StageEditor
            stages={form.stages}
            onChange={s => patch("stages", s)}
          />
        </div>

        {error && (
          <div className="flex items-center gap-2 rounded-xl bg-red-50 border border-red-200 px-4 py-3 text-xs font-semibold text-red-700">
            <AlertCircle size={14} /> {error}
          </div>
        )}

        <div className="flex items-center gap-3 justify-end pt-2">
          <button type="button" onClick={onCancel}
            className="h-9 rounded-xl border border-[#e3d6c5] bg-[#f0ede4] px-4 text-xs font-bold text-[#331405] hover:bg-[#f9ebe6] transition-colors">
            Cancel
          </button>
          <button type="submit" disabled={saving}
            className="flex h-9 items-center gap-2 rounded-xl bg-[#331405] px-4 text-xs font-bold text-[#f0ede4] shadow-md shadow-[#331405]/20 hover:bg-[#6f381a] disabled:opacity-60 transition-colors">
            {saving ? <><Spinner size={13} /> Saving…</> : <><Save size={13} /> {initial?._id ? "Save Changes" : "Create Project"}</>}
          </button>
        </div>
      </div>
    </form>
  );
}

/* ─── MEETINGS PANEL ─── */

function MeetingsPanel({ meetings, token, onUpdated, onEdit, onDelete }) {
  const [updatingId, setUpdatingId] = useState(null);

  async function updateStatus(m, status) {
    setUpdatingId(m._id);
    try {
      const updated = await adminApi.updateMeeting(m._id, { ...m, status }, token);
      onUpdated(updated);
    } catch {}
    finally { setUpdatingId(null); }
  }

  if (meetings.length === 0) {
    return (
      <div className="flex flex-col items-center justify-center py-10 text-center text-[#331405]">
        <Calendar size={32} className="mb-2 opacity-30" />
        <p className="text-sm font-semibold">No meeting requests</p>
      </div>
    );
  }

  const statusColor = { requested: "amber", confirmed: "copper", completed: "green", cancelled: "default" };

  return (
    <div className="divide-y divide-[#e3d6c5]/50">
      {meetings.map(m => (
        <div key={m._id} className="py-4 px-5">
          <div className="flex items-start justify-between gap-3">
            <div className="flex-1 min-w-0">
              <div className="flex items-center gap-2 flex-wrap">
                <p className="text-sm font-bold text-[#101010] truncate">{m.title}</p>
                <Pill label={m.status} color={statusColor[m.status] || "default"} />
              </div>
              <p className="text-xs text-[#331405] mt-0.5">
                {m.type?.replace(/_/g, " ")} ·{" "}
                {m.scheduledAt
                  ? `Scheduled: ${new Date(m.scheduledAt).toLocaleDateString("en-IN", { day: "numeric", month: "short", hour: "2-digit", minute: "2-digit", hour12: true })}`
                  : m.preferredDate
                    ? `Preferred: ${new Date(m.preferredDate).toLocaleDateString("en-IN", { day: "numeric", month: "short" })}${m.preferredTime ? ` at ${m.preferredTime}` : ""}`
                    : "No date set"}
                {m.meetingLink && (
                  <span className="block mt-1 font-semibold text-[#331405] truncate flex items-center gap-1">
                    <Video size={12} /> <a href={m.meetingLink} target="_blank" rel="noreferrer" className="hover:underline">{m.meetingLink}</a>
                  </span>
                )}
              </p>
              {m.agenda && <p className="text-xs text-[#331405] mt-1 italic">"{m.agenda}"</p>}
            </div>
            {updatingId === m._id ? (
              <Spinner size={14} />
            ) : (
              <div className="flex gap-1.5 flex-shrink-0">
                <button onClick={() => onEdit(m)} className="rounded-lg p-1.5 border border-[#e3d6c5] hover:bg-[#e3d6c5] text-[#331405] hover:text-[#331405] transition-colors" title="Edit Meeting">
                  <Edit3 size={12} />
                </button>
                {m.status === "requested" && (
                  <button onClick={() => updateStatus(m, "confirmed")}
                    className="rounded-lg bg-[#331405] px-2.5 py-1 text-[11px] font-bold text-[#f0ede4] hover:bg-[#6f381a] transition-colors">
                    Confirm
                  </button>
                )}
                {m.status === "confirmed" && (
                  <button onClick={() => updateStatus(m, "completed")}
                    className="rounded-lg bg-emerald-600 px-2.5 py-1 text-[11px] font-bold text-[#f0ede4] hover:bg-emerald-700 transition-colors">
                    Mark Done
                  </button>
                )}
                {["requested", "confirmed"].includes(m.status) && (
                  <button onClick={() => updateStatus(m, "cancelled")}
                    className="rounded-lg border border-red-200 px-2.5 py-1 text-[11px] font-bold text-red-600 hover:bg-red-50 transition-colors">
                    Cancel
                  </button>
                )}
                <button onClick={() => onDelete(m)} className="rounded-lg p-1.5 border border-red-200 hover:bg-red-50 text-red-600 transition-colors" title="Delete Meeting">
                  <Trash2 size={12} />
                </button>
              </div>
            )}
          </div>
        </div>
      ))}
    </div>
  );
}

/* ─── MAIN PAGE ─── */

export default function ClientProjectsPage() {
  const { token } = useAuth();
  const [searchParams] = useSearchParams();
  const paramClientId = searchParams.get("clientId");
  const paramProjectId = searchParams.get("projectId");

  const [clients, setClients] = useState([]);
  const [clientsLoading, setClientsLoading] = useState(true);
  const [clientSearch, setClientSearch] = useState("");
  const [companyFilter, setCompanyFilter] = useState("");

  const [selectedClient, setSelectedClient] = useState(null);
  const [clientProjects, setClientProjects] = useState([]);
  const [clientMeetings, setClientMeetings] = useState([]);
  const [clientDocuments, setClientDocuments] = useState([]);
  const [detailLoading, setDetailLoading] = useState(false);

  const [selectedProject, setSelectedProject] = useState(null);
  const [editMode, setEditMode] = useState(false); // "create" | "edit" | false
  const [rightTab, setRightTab] = useState(() => {
    const tab = searchParams.get("tab");
    return ["timeline", "meetings", "deliverables"].includes(tab) ? tab : "timeline";
  });

  useEffect(() => {
    const tab = searchParams.get("tab");
    if (tab && ["timeline", "meetings", "deliverables"].includes(tab)) {
      setRightTab(tab);
    }
  }, [searchParams]);

  const [toast, setToast] = useState({ msg: "", type: "success" });
  const [deletingId, setDeletingId] = useState(null);

  // Modals / Editors state
  const [meetingModal, setMeetingModal] = useState(null); // { mode: "create" | "edit", meeting?: object }
  const [docModal, setDocModal] = useState(null); // { mode: "create" | "edit", doc?: object }

  function showToast(msg, type = "success") {
    setToast({ msg, type });
    setTimeout(() => setToast({ msg: "", type: "success" }), 4000);
  }

  // Load clients
  useEffect(() => {
    adminApi.getClients(token)
      .then(data => setClients(data))
      .catch(() => showToast("Could not load clients.", "error"))
      .finally(() => setClientsLoading(false));
  }, [token]);

  // Load client detail when selected
  const loadClientDetail = useCallback(async (client) => {
    setSelectedClient(client);
    setSelectedProject(null);
    setEditMode(false);
    setDetailLoading(true);
    try {
      const detail = await adminApi.getClientDetail(client._id, token);
      setClientProjects(detail.projects || []);
      setClientMeetings(detail.meetings || []);
      setClientDocuments(detail.documents || []);
    } catch {
      showToast("Could not load client detail.", "error");
    } finally {
      setDetailLoading(false);
    }
  }, [token]);

  // Handle auto client selection via query params
  useEffect(() => {
    if (clientsLoading || clients.length === 0 || !paramClientId) return;
    const found = clients.find(c => c._id === paramClientId || c.id === paramClientId);
    if (found && selectedClient?._id !== found._id) {
      loadClientDetail(found);
    }
  }, [paramClientId, clients, clientsLoading, loadClientDetail, selectedClient]);

  // Handle auto project selection via query params
  useEffect(() => {
    if (!paramProjectId || clientProjects.length === 0) return;
    const found = clientProjects.find(p => p._id === paramProjectId || p.id === paramProjectId);
    if (found && selectedProject?._id !== found._id) {
      setSelectedProject(found);
    }
  }, [paramProjectId, clientProjects, selectedProject]);

  function handleProjectSaved(saved) {
    setClientProjects(prev => {
      const exists = prev.some(p => p._id === saved._id);
      return exists ? prev.map(p => p._id === saved._id ? saved : p) : [saved, ...prev];
    });
    setSelectedProject(saved);
    setEditMode(false);
    showToast(editMode === "edit" ? "Project updated — client portal refreshed." : "Project created — client can see it now.");
  }

  async function handleDeleteProject(project) {
    if (!window.confirm(`Delete "${project.name}"? This cannot be undone.`)) return;
    setDeletingId(project._id);
    try {
      await adminApi.deleteProject(project._id, token);
      setClientProjects(prev => prev.filter(p => p._id !== project._id));
      if (selectedProject?._id === project._id) {
        setSelectedProject(null);
        setEditMode(false);
      }
      showToast("Project deleted.");
    } catch (err) {
      showToast(err.message || "Delete failed.", "error");
    } finally {
      setDeletingId(null);
    }
  }

  function handleMeetingUpdated(updated) {
    setClientMeetings(prev => prev.map(m => m._id === updated._id ? updated : m));
  }

  // Meetings CRUD
  async function handleSaveMeeting(m, isEdit) {
    try {
      if (isEdit) {
        const updated = await adminApi.updateMeeting(m._id, m, token);
        setClientMeetings(prev => prev.map(item => item._id === updated._id ? updated : item));
        showToast("Meeting updated.");
      } else {
        const created = await adminApi.createMeeting({ ...m, clientId: selectedClient._id, projectId: selectedProject?._id }, token);
        setClientMeetings(prev => [created, ...prev]);
        showToast("Meeting scheduled.");
      }
      setMeetingModal(null);
    } catch (err) {
      showToast(err.message || "Failed to save meeting.", "error");
    }
  }

  async function handleDeleteMeeting(m) {
    if (!window.confirm("Are you sure you want to delete this meeting?")) return;
    try {
      await adminApi.deleteMeeting(m._id, token);
      setClientMeetings(prev => prev.filter(item => item._id !== m._id));
      showToast("Meeting deleted.");
    } catch (err) {
      showToast(err.message || "Failed to delete meeting.", "error");
    }
  }

  // Deliverables CRUD
  async function handleSaveDoc(doc, isEdit) {
    try {
      if (isEdit) {
        const updated = await adminApi.updateDocument(doc._id, doc, token);
        setClientDocuments(prev => prev.map(item => item._id === updated._id ? updated : item));
        showToast("Deliverable updated.");
      } else {
        const created = await adminApi.createDocument({
          ...doc,
          clientId: selectedClient._id,
          projectId: selectedProject?._id,
        }, token);
        setClientDocuments(prev => [created, ...prev]);
        showToast("Deliverable uploaded.");
      }
      setDocModal(null);
    } catch (err) {
      showToast(err.message || "Failed to save deliverable.", "error");
    }
  }

  async function handleDeleteDoc(doc) {
    if (!window.confirm(`Delete "${doc.name}"?`)) return;
    try {
      await adminApi.deleteDocument(doc._id, token);
      setClientDocuments(prev => prev.filter(item => item._id !== doc._id));
      showToast("Deliverable deleted.");
    } catch (err) {
      showToast(err.message || "Failed to delete deliverable.", "error");
    }
  }

  async function toggleDocScope(doc) {
    try {
      const nextScope = doc.scope === "internal" ? "client_shared" : "internal";
      const updated = await adminApi.updateDocument(doc._id, { ...doc, scope: nextScope }, token);
      setClientDocuments(prev => prev.map(item => item._id === updated._id ? updated : item));
      showToast(nextScope === "client_shared" ? "Deliverable is now visible to client." : "Deliverable is now hidden from client.");
    } catch (err) {
      showToast("Failed to toggle visibility.", "error");
    }
  }

  async function approveDoc(doc) {
    try {
      const updated = await adminApi.updateDocument(doc._id, { ...doc, status: "approved" }, token);
      setClientDocuments(prev => prev.map(item => item._id === updated._id ? updated : item));
      showToast("Deliverable marked as approved.");
    } catch (err) {
      showToast("Failed to approve deliverable.", "error");
    }
  }

  const projectDocuments = useMemo(() => {
    if (!selectedProject) return [];
    return clientDocuments.filter(d => d.projectId === selectedProject._id);
  }, [clientDocuments, selectedProject]);

  const projectMeetings = useMemo(() => {
    if (!selectedProject) return [];
    return clientMeetings.filter(m => m.projectId === selectedProject._id);
  }, [clientMeetings, selectedProject]);

  const companyNames = useMemo(() => {
    const names = [...new Set(clients.map(c => c.company).filter(Boolean))];
    return names.sort((a, b) => a.localeCompare(b));
  }, [clients]);

  const filteredClients = clients.filter(c => {
    const matchesSearch = `${c.name} ${c.email} ${c.company || ""}`.toLowerCase().includes(clientSearch.toLowerCase());
    const matchesCompany = !companyFilter || (c.company || "").toLowerCase() === companyFilter.toLowerCase();
    return matchesSearch && matchesCompany;
  });

  const sp = statusPill;

  return (
    <div className="flex h-[calc(100vh-80px)] overflow-hidden">
      <Toast message={toast.msg} type={toast.type} onClose={() => setToast({ msg: "", type: "success" })} />

      {/* ── COL 1: Client List ── */}
      <aside className="w-72 flex-shrink-0 flex flex-col border-r border-[#e3d6c5] bg-[#faf8f5]">
        <div className="px-4 pt-5 pb-3">
          <h2 className="text-base font-bold text-[#101010] mb-3 flex items-center gap-2">
            <Users size={16} className="text-[#331405]" />
            Clients
            {!clientsLoading && (
              <span className="ml-auto rounded-full bg-[#331405]/10 px-2 py-0.5 text-[10px] font-bold text-[#331405]">
                {clients.length}
              </span>
            )}
          </h2>
          <div className="flex h-9 items-center gap-2 rounded-xl border border-[#e3d6c5] bg-white px-3 focus-within:border-[#c57e5b] focus-within:ring-2 focus-within:ring-[#ffdbcc]/60">
            <Search size={13} className="text-[#331405]" />
            <input value={clientSearch} onChange={e => setClientSearch(e.target.value)}
              placeholder="Search clients…" className="w-full bg-transparent text-xs outline-none placeholder:text-[#331405]/60" />
          </div>
          <select
            value={companyFilter}
            onChange={e => setCompanyFilter(e.target.value)}
            className="mt-2 w-full h-9 rounded-xl border border-[#e3d6c5] bg-white px-3 text-xs font-semibold text-[#331405] outline-none focus:border-[#c57e5b] focus:ring-2 focus:ring-[#ffdbcc]/60 cursor-pointer"
          >
            <option value="">All Companies</option>
            {companyNames.map(name => (
              <option key={name} value={name}>{name}</option>
            ))}
          </select>
        </div>

        <div className="flex-1 overflow-y-auto px-3 pb-4">
          {clientsLoading ? (
            <div className="flex justify-center pt-12"><Spinner /></div>
          ) : filteredClients.length === 0 ? (
            <div className="pt-12 text-center">
              <Users size={28} className="mx-auto mb-2 text-[#331405]/30" />
              <p className="text-xs font-semibold text-[#331405]">{clientSearch ? "No matches" : "No clients yet"}</p>
              <p className="text-[11px] text-[#331405]/70 mt-1">Clients appear after paying for a package.</p>
            </div>
          ) : (
            <div className="space-y-1.5">
              {filteredClients.map(client => (
                <button
                  key={client._id}
                  onClick={() => loadClientDetail(client)}
                  className={`w-full rounded-xl p-3 text-left transition-all ${
                    selectedClient?._id === client._id
                      ? "bg-[#331405] text-[#f0ede4] shadow-md"
                      : "bg-white hover:bg-[#f0ede4] text-[#101010] shadow-sm border border-[#e3d6c5]"
                  }`}
                >
                  <div className="flex items-center gap-3">
                    <div className={`w-9 h-9 rounded-full flex items-center justify-center text-xs font-bold flex-shrink-0 ${
                      selectedClient?._id === client._id ? "bg-[#f0ede4]/20 text-[#f0ede4]" : "bg-[#331405] text-[#f0ede4]"
                    }`}>
                      {initials(client.name)}
                    </div>
                    <div className="min-w-0 flex-1">
                      <p className={`text-xs font-bold truncate ${selectedClient?._id === client._id ? "text-[#f0ede4]" : "text-[#101010]"}`}>
                        {client.name}
                      </p>
                      <p className={`text-[10px] truncate ${selectedClient?._id === client._id ? "text-[#f0ede4]/70" : "text-[#331405]"}`}>
                        {client.company || client.email}
                      </p>
                    </div>
                    <ChevronRight size={13} className={selectedClient?._id === client._id ? "text-[#f0ede4]/70" : "text-[#331405]/50"} />
                  </div>
                </button>
              ))}
            </div>
          )}
        </div>
      </aside>

      {/* ── COL 2: Project List ── */}
      <div className="w-72 flex-shrink-0 flex flex-col border-r border-[#e3d6c5] bg-white">
        {!selectedClient ? (
          <div className="flex flex-col items-center justify-center flex-1 text-center px-6">
            <FolderOpen size={36} className="mb-3 text-[#331405]/25" />
            <p className="text-sm font-semibold text-[#331405]">Select a client</p>
            <p className="text-xs text-[#331405]/70 mt-1">Choose a client from the left panel to see their projects.</p>
          </div>
        ) : (
          <>
            <div className="px-4 pt-5 pb-3 border-b border-[#e3d6c5]">
              <div className="flex items-start justify-between gap-2 mb-3">
                <div className="min-w-0">
                  <p className="text-[10px] font-bold uppercase tracking-wider text-[#331405]">Client</p>
                  <h3 className="text-sm font-bold text-[#101010] truncate">{selectedClient.name}</h3>
                  <p className="text-xs text-[#331405] truncate">{selectedClient.company || selectedClient.email}</p>
                </div>
                <button
                  onClick={() => { setSelectedProject(null); setEditMode("create"); setRightTab("timeline"); }}
                  className="flex h-8 items-center gap-1.5 rounded-xl bg-[#331405] px-3 text-xs font-bold text-[#f0ede4] hover:bg-[#6f381a] transition-colors flex-shrink-0"
                >
                  <Plus size={12} /> New
                </button>
              </div>
            </div>

            <div className="flex-1 overflow-y-auto px-3 py-3">
              {detailLoading ? (
                <div className="flex justify-center pt-12"><Spinner /></div>
              ) : clientProjects.length === 0 ? (
                <div className="flex flex-col items-center pt-12 text-center">
                  <FolderOpen size={28} className="mb-2 text-[#331405]/30" />
                  <p className="text-xs font-semibold text-[#331405]">No projects yet</p>
                  <button
                    onClick={() => { setSelectedProject(null); setEditMode("create"); }}
                    className="mt-3 flex items-center gap-1 text-xs font-bold text-[#331405] hover:underline"
                  >
                    <Plus size={12} /> Create first project
                  </button>
                </div>
              ) : (
                <div className="space-y-2">
                  {clientProjects.map(p => {
                    const s = sp(p.status);
                    const isSelected = selectedProject?._id === p._id;
                    return (
                      <button
                        key={p._id}
                        onClick={() => { setSelectedProject(p); setEditMode(false); setRightTab("timeline"); }}
                        className={`w-full rounded-xl border p-3.5 text-left transition-all ${
                          isSelected
                            ? "border-[#c57e5b] bg-[#faf8f5] shadow-sm"
                            : "border-[#e3d6c5] bg-white hover:border-[#c57e5b]/40 hover:bg-[#faf8f5]"
                        }`}
                      >
                        <div className="flex items-start justify-between gap-2 mb-2">
                          <p className="text-xs font-bold text-[#101010] leading-tight">{p.name}</p>
                          <Pill label={s.label} color={s.color} />
                        </div>
                        <p className="text-[11px] text-[#331405] mb-2">{p.packageName || "No package"}</p>
                        <div className="flex items-center gap-2">
                          <div className="flex-1 h-1.5 rounded-full bg-[#e3d6c5] overflow-hidden">
                            <div className="h-full rounded-full bg-[#331405]" style={{ width: `${p.progress || 0}%` }} />
                          </div>
                          <span className="text-[10px] font-bold text-[#331405]">{p.progress || 0}%</span>
                        </div>
                      </button>
                    );
                  })}
                </div>
              )}
            </div>
          </>
        )}
      </div>

      {/* ── COL 3: Project Detail / Form ── */}
      <div className="flex-1 flex flex-col overflow-hidden bg-white">
        {!selectedClient ? (
          <div className="flex flex-col items-center justify-center flex-1 text-center px-10">
            <div className="w-16 h-16 rounded-2xl bg-[#331405]/10 flex items-center justify-center mb-4">
              <FolderOpen size={30} className="text-[#331405]" />
            </div>
            <h2 className="text-xl font-bold text-[#101010] mb-2">Client Projects Panel</h2>
            <p className="text-sm text-[#331405] max-w-md">
              Select a client to view their projects, create new ones, and update project stages. All changes sync instantly to the client portal.
            </p>
          </div>
        ) : editMode ? (
          /* ── Project Form ── */
          <div className="flex-1 overflow-y-auto p-6">
            <div className="max-w-2xl mx-auto">
              <div className="flex items-center gap-3 mb-5">
                <button onClick={() => setEditMode(false)} className="p-2 rounded-xl border border-[#e3d6c5] bg-[#f0ede4] hover:bg-[#e3d6c5] transition-colors">
                  <X size={14} className="text-[#331405]" />
                </button>
                <div>
                  <p className="text-xs font-bold uppercase tracking-wider text-[#331405]">
                    {editMode === "edit" ? "Edit Project" : "New Project"} · {selectedClient.name}
                  </p>
                  <h2 className="text-lg font-bold text-[#101010]">
                    {editMode === "edit" ? selectedProject?.name : "Create Project"}
                  </h2>
                </div>
              </div>
              <SectionCard className="p-5">
                <ProjectForm
                  initial={editMode === "edit" ? selectedProject : null}
                  clientId={selectedClient._id}
                  token={token}
                  onSaved={handleProjectSaved}
                  onCancel={() => setEditMode(false)}
                />
              </SectionCard>
            </div>
          </div>
        ) : selectedProject ? (
          /* ── Project Detail ── */
          <div className="flex-1 flex flex-col overflow-hidden">
            {/* Header */}
            <div className="sticky top-0 z-10 bg-white/90 backdrop-blur border-b border-[#e3d6c5] px-6 py-4 flex-shrink-0">
              <div className="flex items-center justify-between gap-4">
                <div className="min-w-0">
                  <div className="flex items-center gap-2 mb-0.5 flex-wrap">
                    <h2 className="text-lg font-bold text-[#101010] truncate">{selectedProject.name}</h2>
                    <Pill {...statusPill(selectedProject.status)} />
                  </div>
                  <p className="text-xs text-[#331405]">
                    {selectedProject.packageName || "No package"} · {selectedClient.name}
                    {selectedProject.expectedEndDate && ` · Due ${fmtDisplay(selectedProject.expectedEndDate)}`}
                  </p>
                </div>
                <div className="flex items-center gap-2 flex-shrink-0">
                  <button
                    onClick={() => setEditMode("edit")}
                    className="flex h-8 items-center gap-1.5 rounded-xl border border-[#e3d6c5] bg-white px-3 text-xs font-bold text-[#331405] hover:bg-[#faf8f5] transition-colors"
                  >
                    <Edit3 size={12} /> Edit
                  </button>
                  <button
                    onClick={() => handleDeleteProject(selectedProject)}
                    disabled={deletingId === selectedProject._id}
                    className="flex h-8 items-center gap-1.5 rounded-xl border border-red-200 bg-white px-3 text-xs font-bold text-red-600 hover:bg-red-50 transition-colors disabled:opacity-50"
                  >
                    {deletingId === selectedProject._id ? <Spinner size={12} /> : <Trash2 size={12} />}
                    Delete
                  </button>
                </div>
              </div>

              {/* Tabs */}
              <div className="flex gap-1 mt-3 border-b border-[#e3d6c5]">
                {[
                  { key: "timeline", label: "Timeline & Stages" },
                  { key: "meetings", label: `Meetings (${projectMeetings.length})` },
                  { key: "deliverables", label: `Deliverables (${projectDocuments.length})` },
                ].map(tab => (
                  <button key={tab.key} onClick={() => setRightTab(tab.key)}
                    className={`pb-2.5 px-1 mr-4 text-xs font-bold border-b-2 transition-all ${
                      rightTab === tab.key
                        ? "border-[#331405] text-[#331405]"
                        : "border-transparent text-[#331405] hover:text-[#101010]"
                    }`}>
                    {tab.label}
                  </button>
                ))}
              </div>
            </div>

            <div className="p-6 space-y-5 flex-1 overflow-y-auto">
              {rightTab === "timeline" && (
                <>
                  {/* Overview */}
                  <SectionCard className="p-5">
                    <h3 className="text-xs font-bold uppercase tracking-wider text-[#331405] mb-4">Project Overview</h3>
                    <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-4">
                      {[
                        { label: "Progress", value: `${selectedProject.progress || 0}%` },
                        { label: "Current Phase", value: selectedProject.currentPhase || "—" },
                        { label: "Start Date", value: fmtDisplay(selectedProject.startDate) },
                        { label: "Expected End", value: fmtDisplay(selectedProject.expectedEndDate) },
                      ].map(r => (
                        <div key={r.label}>
                          <p className="text-[10px] font-bold uppercase tracking-wider text-[#331405]">{r.label}</p>
                          <p className="text-sm font-bold text-[#101010] mt-0.5 truncate">{r.value}</p>
                        </div>
                      ))}
                    </div>
                    <div className="flex items-center gap-3 mt-2">
                      <div className="flex-1 h-3 rounded-full bg-[#e3d6c5] overflow-hidden">
                        <div className="h-full rounded-full bg-[#331405] transition-all duration-700"
                          style={{ width: `${selectedProject.progress || 0}%` }} />
                      </div>
                      <span className="text-sm font-bold text-[#331405]">{selectedProject.progress || 0}%</span>
                    </div>
                  </SectionCard>

                  {/* Admin notes */}
                  {selectedProject.adminNotes && (
                    <SectionCard className="p-5">
                      <div className="flex items-center gap-2 mb-3">
                        <h3 className="text-xs font-bold uppercase tracking-wider text-[#331405]">Notes for Client</h3>
                        <span className="rounded-full bg-amber-50 px-2 py-0.5 text-[9px] font-bold text-amber-700 uppercase">Visible</span>
                      </div>
                      <p className="text-sm text-[#101010] leading-relaxed">{selectedProject.adminNotes}</p>
                    </SectionCard>
                  )}

                  {/* Stages */}
                  <SectionCard>
                    <div className="px-5 py-4 border-b border-[#e3d6c5] flex items-center justify-between">
                      <h3 className="text-xs font-bold uppercase tracking-wider text-[#331405]">
                        Stages ({selectedProject.stages?.length || 0})
                      </h3>
                      <span className="rounded-full bg-amber-50 px-2 py-0.5 text-[9px] font-bold text-amber-700 uppercase">Client visible</span>
                    </div>
                    {!selectedProject.stages?.length ? (
                      <div className="flex flex-col items-center py-8 text-center px-6">
                        <p className="text-xs text-[#331405]">No stages defined. Click Edit to add stages.</p>
                        <button onClick={() => setEditMode("edit")}
                          className="mt-3 flex items-center gap-1 text-xs font-bold text-[#331405] hover:underline">
                          <Plus size={12} /> Add Stages
                        </button>
                      </div>
                    ) : (
                      <div className="divide-y divide-[#e3d6c5]/40">
                        {selectedProject.stages.map((stage, i) => {
                          const sp = stagePill(stage.status);
                          return (
                            <div key={i} className="px-5 py-4 flex items-start gap-4">
                              <div className={`w-8 h-8 rounded-full flex items-center justify-center text-xs font-bold flex-shrink-0 mt-0.5 ${
                                stage.status === "completed" ? "bg-emerald-100 text-emerald-700" :
                                stage.status === "in_progress" ? "bg-[#e3d6c5] text-[#331405]" :
                                stage.status === "delayed" ? "bg-red-100 text-red-700" :
                                "bg-[#faf8f5] text-[#331405]"
                              }`}>
                                {stage.status === "completed" ? <Check size={14} /> : i + 1}
                              </div>
                              <div className="flex-1 min-w-0">
                                <div className="flex items-center gap-2 flex-wrap mb-1">
                                  <p className="text-sm font-bold text-[#101010]">{stage.name}</p>
                                  <Pill label={sp.label} color={sp.color} />
                                  {!(stage.clientVisible ?? true) && (
                                    <span className="inline-flex items-center gap-1 rounded-full bg-gray-100 px-2 py-0.5 text-[9px] font-bold text-gray-600 uppercase tracking-wide">
                                      <Lock size={9} /> Internal Only
                                    </span>
                                  )}
                                </div>
                                {stage.notes && <p className="text-xs text-[#331405] mt-1">{stage.notes}</p>}
                                {stage.internalNotes && (
                                  <p className="text-xs text-amber-800 bg-amber-50/50 border border-amber-200/40 rounded-lg p-2 mt-2 leading-relaxed">
                                    <span className="font-bold text-[10px] uppercase block mb-0.5">Internal Notes:</span>
                                    {stage.internalNotes}
                                  </p>
                                )}
                                {(stage.startDate || stage.endDate) && (
                                  <div className="flex items-center gap-3 mt-1.5">
                                    {stage.startDate && (
                                      <span className="flex items-center gap-1 text-[11px] text-[#331405]">
                                        <Calendar size={11} /> {fmtDisplay(stage.startDate)}
                                      </span>
                                    )}
                                    {stage.endDate && (
                                      <span className="flex items-center gap-1 text-[11px] text-[#331405]">
                                        → {fmtDisplay(stage.endDate)}
                                      </span>
                                    )}
                                  </div>
                                )}
                              </div>
                            </div>
                          );
                        })}
                      </div>
                    )}
                  </SectionCard>
                </>
              )}

              {rightTab === "meetings" && (
                <SectionCard>
                  <div className="px-5 py-4 border-b border-[#e3d6c5] flex items-center justify-between">
                    <div>
                      <h3 className="text-xs font-bold uppercase tracking-wider text-[#331405]">Meetings ({projectMeetings.length})</h3>
                      <p className="text-[11px] text-[#331405]/70 mt-0.5">Manage scheduled or requested meetings.</p>
                    </div>
                    <button onClick={() => setMeetingModal({ mode: "create" })}
                      className="flex h-7 items-center gap-1.5 rounded-lg bg-[#331405] px-3 text-xs font-bold text-[#f0ede4] hover:bg-[#6f381a] transition-all">
                      <Plus size={11} /> Schedule Meeting
                    </button>
                  </div>
                  <MeetingsPanel
                    meetings={projectMeetings}
                    token={token}
                    onUpdated={handleMeetingUpdated}
                    onEdit={(meeting) => setMeetingModal({ mode: "edit", meeting })}
                    onDelete={handleDeleteMeeting}
                  />
                </SectionCard>
              )}

              {rightTab === "deliverables" && (
                <SectionCard>
                  <div className="px-5 py-4 border-b border-[#e3d6c5] flex items-center justify-between">
                    <div>
                      <h3 className="text-xs font-bold uppercase tracking-wider text-[#331405]">Deliverables ({projectDocuments.length})</h3>
                      <p className="text-[11px] text-[#331405]/70 mt-0.5">Manage deliverables and control client visibility.</p>
                    </div>
                    <button onClick={() => setDocModal({ mode: "create" })}
                      className="flex h-7 items-center gap-1.5 rounded-lg bg-[#331405] px-3 text-xs font-bold text-[#f0ede4] hover:bg-[#6f381a] transition-all">
                      <Plus size={11} /> Add Deliverable
                    </button>
                  </div>

                  {!projectDocuments.length ? (
                    <div className="flex flex-col items-center py-10 text-center text-[#331405]">
                      <FileText size={32} className="mb-2 opacity-30" />
                      <p className="text-sm font-semibold">No deliverables added yet</p>
                    </div>
                  ) : (
                    <div className="divide-y divide-[#e3d6c5]/40">
                      {projectDocuments.map(doc => (
                        <div key={doc._id} className="p-4 px-5 flex items-start gap-4">
                          <div className="w-9 h-9 rounded-lg bg-[#e3d6c5] text-[#331405] flex items-center justify-center flex-shrink-0 mt-0.5">
                            {fileIcon(doc.fileType)}
                          </div>
                          <div className="flex-1 min-w-0">
                            <div className="flex items-center gap-2 flex-wrap">
                              <p className="text-sm font-bold text-[#101010] truncate">{doc.name}</p>
                              <Pill {...docStatusPill(doc.status)} />
                              {doc.scope === "client_shared" ? (
                                <span className="inline-flex items-center gap-1 text-[10px] font-bold text-emerald-600 uppercase" title="Visible to client">
                                  <Globe size={11} /> Public
                                </span>
                              ) : (
                                <span className="inline-flex items-center gap-1 text-[10px] font-bold text-[#331405] uppercase" title="Visible only to admins">
                                  <Lock size={11} /> Internal
                                </span>
                              )}
                            </div>
                            <p className="text-xs text-[#331405] mt-1">
                              FileType: {doc.fileType?.toUpperCase()} · Size: {doc.fileSize || "Unknown size"} · v{doc.version || "1.0"}
                            </p>
                            {doc.notes && <p className="text-xs text-[#101010]/80 bg-[#e3d6c5]/30 border border-[#e3d6c5]/30 rounded-lg p-2 mt-2 leading-relaxed font-serif italic">"{doc.notes}"</p>}
                            {doc.fileUrl && (
                              <a href={doc.fileUrl} target="_blank" rel="noreferrer" className="inline-flex items-center gap-1 text-[11px] font-bold text-[#331405] hover:underline mt-2">
                                <Download size={11} /> Download File
                              </a>
                            )}
                          </div>
                          <div className="flex gap-1.5 flex-shrink-0">
                            <button onClick={() => toggleDocScope(doc)} className="rounded-lg p-1.5 border border-[#e3d6c5] hover:bg-[#e3d6c5] text-[#331405] hover:text-[#331405] transition-colors" title={doc.scope === "client_shared" ? "Hide from Client" : "Show to Client"}>
                              {doc.scope === "client_shared" ? <Lock size={12} /> : <Globe size={12} />}
                            </button>
                            {doc.status !== "approved" && (
                              <button onClick={() => approveDoc(doc)} className="rounded-lg p-1.5 border border-[#e3d6c5] hover:bg-emerald-50 text-emerald-600 transition-colors" title="Mark Approved">
                                <Check size={12} />
                              </button>
                            )}
                            <button onClick={() => setDocModal({ mode: "edit", doc })} className="rounded-lg p-1.5 border border-[#e3d6c5] hover:bg-[#e3d6c5] text-[#331405] hover:text-[#331405] transition-colors" title="Edit Deliverable">
                              <Edit3 size={12} />
                            </button>
                            <button onClick={() => handleDeleteDoc(doc)} className="rounded-lg p-1.5 border border-red-200 hover:bg-red-50 text-red-600 transition-colors" title="Delete Deliverable">
                              <Trash2 size={12} />
                            </button>
                          </div>
                        </div>
                      ))}
                    </div>
                  )}
                </SectionCard>
              )}
            </div>
          </div>
        ) : (
          /* ── Nothing selected ── */
          <div className="flex flex-col items-center justify-center flex-1 text-center px-10">
            <div className="w-14 h-14 rounded-2xl bg-[#331405]/10 flex items-center justify-center mb-3">
              <FolderOpen size={26} className="text-[#331405]" />
            </div>
            <p className="text-sm font-semibold text-[#101010] mb-1">Select or create a project</p>
            <p className="text-xs text-[#331405]">Pick a project from the list or create a new one.</p>
            {selectedClient && (
              <button onClick={() => setEditMode("create")}
                className="mt-4 flex items-center gap-2 rounded-xl bg-[#331405] px-4 py-2 text-xs font-bold text-[#f0ede4] hover:bg-[#6f381a] transition-colors">
                <Plus size={13} /> New Project for {selectedClient.name.split(" ")[0]}
              </button>
            )}
          </div>
        )}
      </div>

      {/* ── MEETING EDITOR MODAL ── */}
      {meetingModal && (
        <MeetingModal
          mode={meetingModal.mode}
          meeting={meetingModal.meeting}
          onClose={() => setMeetingModal(null)}
          onSave={handleSaveMeeting}
        />
      )}

      {/* ── DELIVERABLE EDITOR MODAL ── */}
      {docModal && (
        <DocModal
          mode={docModal.mode}
          doc={docModal.doc}
          onClose={() => setDocModal(null)}
          onSave={handleSaveDoc}
        />
      )}
    </div>
  );
}

/* ─── MEETING DIALOG ─── */

function MeetingModal({ mode, meeting, onClose, onSave }) {
  const [form, setForm] = useState(() => ({
    title: "",
    type: "discovery_session",
    preferredDate: "",
    preferredTime: "",
    scheduledAt: "",
    meetingLink: "",
    agenda: "",
    status: "requested",
    duration: 45,
    ...(meeting || {}),
    preferredDate: meeting?.preferredDate ? fmt(meeting.preferredDate) : "",
    scheduledAt: meeting?.scheduledAt ? fmt(meeting.scheduledAt) : "",
  }));

  function submit(e) {
    e.preventDefault();
    if (!form.title.trim()) return;
    onSave(form, mode === "edit");
  }

  return (
    <div className="fixed inset-0 z-50 grid place-items-center bg-gray-950/40 px-4">
      <form onSubmit={submit} className="w-full max-w-lg rounded-2xl border border-[#e3d6c5] bg-white p-6 shadow-2xl space-y-4">
        <div className="flex items-center justify-between border-b pb-3 border-[#e3d6c5]/40">
          <h2 className="text-sm font-bold text-gray-950">{mode === "create" ? "Schedule Meeting" : "Edit Meeting"}</h2>
          <button type="button" onClick={onClose} className="rounded-lg p-1 hover:bg-[#faf8f5] text-[#331405]"><X size={14} /></button>
        </div>
        <div className="space-y-3">
          <label className="block">
            <span className="text-xs font-bold text-[#331405]">Meeting Title *</span>
            <input value={form.title} onChange={e => setForm({ ...form, title: e.target.value })} required placeholder="e.g. Design Review Session"
              className="mt-1 w-full rounded-xl border border-[#e3d6c5] bg-[#faf8f5] px-3 py-2 text-sm outline-none focus:border-[#c57e5b] focus:ring-4 focus:ring-[#ffdbcc]/50" />
          </label>
          <div className="grid grid-cols-2 gap-3">
            <label className="block">
              <span className="text-xs font-bold text-[#331405]">Type</span>
              <select value={form.type} onChange={e => setForm({ ...form, type: e.target.value })}
                className="mt-1 w-full rounded-xl border border-[#e3d6c5] bg-[#faf8f5] px-3 py-2 text-sm outline-none focus:border-[#c57e5b]">
                <option value="discovery_session">Discovery Session</option>
                <option value="design_review">Design Review</option>
                <option value="technical_sync">Technical Sync</option>
                <option value="strategy_review">Strategy Review</option>
                <option value="delivery_review">Delivery Review</option>
                <option value="support_call">Support Call</option>
              </select>
            </label>
            <label className="block">
              <span className="text-xs font-bold text-[#331405]">Status</span>
              <select value={form.status} onChange={e => setForm({ ...form, status: e.target.value })}
                className="mt-1 w-full rounded-xl border border-[#e3d6c5] bg-[#faf8f5] px-3 py-2 text-sm outline-none focus:border-[#c57e5b]">
                <option value="requested">Requested</option>
                <option value="confirmed">Confirmed</option>
                <option value="completed">Completed</option>
                <option value="cancelled">Cancelled</option>
              </select>
            </label>
          </div>
          <div className="grid grid-cols-2 gap-3">
            <label className="block">
              <span className="text-xs font-bold text-[#331405]">Scheduled Date</span>
              <input type="date" value={form.scheduledAt} onChange={e => setForm({ ...form, scheduledAt: e.target.value })}
                className="mt-1 w-full rounded-xl border border-[#e3d6c5] bg-[#faf8f5] px-3 py-2 text-sm outline-none focus:border-[#c57e5b]" />
            </label>
            <label className="block">
              <span className="text-xs font-bold text-[#331405]">Preferred Time</span>
              <input type="time" value={form.preferredTime} onChange={e => setForm({ ...form, preferredTime: e.target.value })}
                className="mt-1 w-full rounded-xl border border-[#e3d6c5] bg-[#faf8f5] px-3 py-2 text-sm outline-none focus:border-[#c57e5b]" />
            </label>
          </div>
          <label className="block">
            <span className="text-xs font-bold text-[#331405]">Meeting Link (Google Meet / Zoom)</span>
            <input value={form.meetingLink} onChange={e => setForm({ ...form, meetingLink: e.target.value })} placeholder="https://meet.google.com/xyz"
              className="mt-1 w-full rounded-xl border border-[#e3d6c5] bg-[#faf8f5] px-3 py-2 text-sm outline-none focus:border-[#c57e5b]" />
          </label>
          <label className="block">
            <span className="text-xs font-bold text-[#331405]">Agenda / Notes</span>
            <textarea value={form.agenda} onChange={e => setForm({ ...form, agenda: e.target.value })} placeholder="Meeting agenda..." rows={3}
              className="mt-1 w-full rounded-xl border border-[#e3d6c5] bg-[#faf8f5] px-3 py-2 text-sm outline-none resize-none focus:border-[#c57e5b]" />
          </label>
        </div>
        <div className="flex justify-end gap-2 border-t pt-3 border-[#e3d6c5]/40">
          <button type="button" onClick={onClose} className="h-9 rounded-xl border border-[#e3d6c5] bg-white px-4 text-xs font-bold text-[#331405] hover:bg-[#faf8f5]">Cancel</button>
          <button type="submit" className="flex h-9 items-center gap-1.5 rounded-xl bg-[#331405] px-4 text-xs font-bold text-[#faf8f5] hover:bg-[#6f381a] shadow-md"><Save size={13} /> Save</button>
        </div>
      </form>
    </div>
  );
}

/* ─── DELIVERABLE DIALOG ─── */

function DocModal({ mode, doc, onClose, onSave }) {
  const [form, setForm] = useState(() => ({
    name: "",
    fileType: "pdf",
    fileSize: "2.5 MB",
    fileUrl: "",
    scope: "client_shared",
    status: "pending_review",
    notes: "",
    ...(doc || {}),
  }));

  function submit(e) {
    e.preventDefault();
    if (!form.name.trim()) return;
    onSave(form, mode === "edit");
  }

  return (
    <div className="fixed inset-0 z-50 grid place-items-center bg-gray-950/40 px-4">
      <form onSubmit={submit} className="w-full max-w-lg rounded-2xl border border-[#e3d6c5] bg-white p-6 shadow-2xl space-y-4">
        <div className="flex items-center justify-between border-b pb-3 border-[#e3d6c5]/40">
          <h2 className="text-sm font-bold text-gray-950">{mode === "create" ? "Add Deliverable" : "Edit Deliverable"}</h2>
          <button type="button" onClick={onClose} className="rounded-lg p-1 hover:bg-[#faf8f5] text-[#331405]"><X size={14} /></button>
        </div>
        <div className="space-y-3">
          <label className="block">
            <span className="text-xs font-bold text-[#331405]">File / Deliverable Name *</span>
            <input value={form.name} onChange={e => setForm({ ...form, name: e.target.value })} required placeholder="e.g. Brand Presentation Slides"
              className="mt-1 w-full rounded-xl border border-[#e3d6c5] bg-[#faf8f5] px-3 py-2 text-sm outline-none focus:border-[#c57e5b] focus:ring-4 focus:ring-[#ffdbcc]/50" />
          </label>
          <div className="grid grid-cols-2 gap-3">
            <label className="block">
              <span className="text-xs font-bold text-[#331405]">File Type</span>
              <select value={form.fileType} onChange={e => setForm({ ...form, fileType: e.target.value })}
                className="mt-1 w-full rounded-xl border border-[#e3d6c5] bg-[#faf8f5] px-3 py-2 text-sm outline-none focus:border-[#c57e5b]">
                <option value="pdf">PDF Document</option>
                <option value="figma">Figma Design</option>
                <option value="image">Image File</option>
                <option value="doc">Word Document</option>
              </select>
            </label>
            <label className="block">
              <span className="text-xs font-bold text-[#331405]">File Size</span>
              <input value={form.fileSize} onChange={e => setForm({ ...form, fileSize: e.target.value })} placeholder="e.g. 4.2 MB"
                className="mt-1 w-full rounded-xl border border-[#e3d6c5] bg-[#faf8f5] px-3 py-2 text-sm outline-none focus:border-[#c57e5b]" />
            </label>
          </div>
          <div className="grid grid-cols-2 gap-3">
            <label className="block">
              <span className="text-xs font-bold text-[#331405]">Visibility (Scope)</span>
              <select value={form.scope} onChange={e => setForm({ ...form, scope: e.target.value })}
                className="mt-1 w-full rounded-xl border border-[#e3d6c5] bg-[#faf8f5] px-3 py-2 text-sm outline-none focus:border-[#c57e5b]">
                <option value="client_shared">Visible to Client (Public)</option>
                <option value="internal">Visible only to Admins (Internal)</option>
              </select>
            </label>
            <label className="block">
              <span className="text-xs font-bold text-[#331405]">Review Status</span>
              <select value={form.status} onChange={e => setForm({ ...form, status: e.target.value })}
                className="mt-1 w-full rounded-xl border border-[#e3d6c5] bg-[#faf8f5] px-3 py-2 text-sm outline-none focus:border-[#c57e5b]">
                <option value="pending_review">Pending Review</option>
                <option value="approved">Approved</option>
                <option value="final_delivery">Final Delivery</option>
                <option value="internal">Internal Only</option>
              </select>
            </label>
          </div>
          <label className="block">
            <span className="text-xs font-bold text-[#331405]">File URL / Attachment Link</span>
            <input value={form.fileUrl} onChange={e => setForm({ ...form, fileUrl: e.target.value })} placeholder="https://drive.google.com/... or Figma link"
              className="mt-1 w-full rounded-xl border border-[#e3d6c5] bg-[#faf8f5] px-3 py-2 text-sm outline-none focus:border-[#c57e5b]" />
          </label>
          <label className="block">
            <span className="text-xs font-bold text-[#331405]">Deliverable Notes</span>
            <textarea value={form.notes} onChange={e => setForm({ ...form, notes: e.target.value })} placeholder="Notes or instructions about this file..." rows={3}
              className="mt-1 w-full rounded-xl border border-[#e3d6c5] bg-[#faf8f5] px-3 py-2 text-sm outline-none resize-none focus:border-[#c57e5b]" />
          </label>
        </div>
        <div className="flex justify-end gap-2 border-t pt-3 border-[#e3d6c5]/40">
          <button type="button" onClick={onClose} className="h-9 rounded-xl border border-[#e3d6c5] bg-white px-4 text-xs font-bold text-[#331405] hover:bg-[#faf8f5]">Cancel</button>
          <button type="submit" className="flex h-9 items-center gap-1.5 rounded-xl bg-[#331405] px-4 text-xs font-bold text-[#faf8f5] hover:bg-[#6f381a] shadow-md"><Save size={13} /> Save</button>
        </div>
      </form>
    </div>
  );
}
