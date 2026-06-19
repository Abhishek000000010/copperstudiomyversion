import { useMemo, useState, useEffect, useCallback } from "react";
import { Link } from "react-router-dom";
import { Search, ChevronDown, ChevronRight, X, Save, Trash2, Lock, Calendar, Clock } from "lucide-react";
import { TODAY, daysBetween } from "../../lib/dates";
import ProjectCard from "../../components/ProjectCard";
import { adminApi } from "../../lib/clientApi";
import { useAuth } from "../../auth/useAuth";

/* ─── helpers ────────────────────────────────────────────────────── */
const safeDate = (val) => {
  if (!val) return null;
  if (val instanceof Date) return isNaN(val) ? null : val;
  const d = new Date(val);
  return isNaN(d.getTime()) ? null : d;
};

const fmtShort = (d) => {
  if (!d) return "—";
  const date = safeDate(d);
  if (!date) return "—";
  return date.toLocaleDateString("en-US", { day: "numeric", month: "short", year: "numeric" });
};

const toInputDate = (val) => {
  if (!val) return "";
  const d = safeDate(val);
  if (!d) return "";
  return d.toISOString().split("T")[0];
};

const MONTH_COL_WIDTH = 140;

const STATUS_COLOR = {
  pending: "border-gray-200 bg-gray-100 text-gray-600",
  in_progress: "border-[#c57e5b]/40 bg-[#c57e5b]/15 text-[#331405]",
  delayed: "border-red-200 bg-red-50 text-red-700",
  completed: "border-emerald-200 bg-emerald-50 text-emerald-700",
};

const STATUS_LABEL = {
  completed:  "Completed",
  in_progress:"In Progress",
  delayed:    "Delayed",
  pending:    "Pending",
};

const PHASE_ORDER = ["pending", "in_progress", "delayed", "completed"];

function monthLabel(date) {
  return date.toLocaleDateString("en-US", { month: "short", year: "2-digit" });
}

/* ─── Slide-in panel ─────────────────────────────────────────────── */
function TaskSlidePanel({ task, projectName, onClose, onSave, onDelete, saving }) {
  const [form, setForm] = useState({
    name:          task.name || "",
    status:        task.status || "pending",
    startDate:     toInputDate(task.startDate),
    endDate:       toInputDate(task.endDate),
    notes:         task.notes || "",
    internalNotes: task.internalNotes || "",
    clientVisible: task.clientVisible ?? true,
  });

  const set = (key) => (val) => setForm((p) => ({ ...p, [key]: val }));

  function handleSubmit(e) {
    e.preventDefault();
    onSave({ ...task, ...form });
  }

  return (
    <>
      {/* Backdrop */}
      <div
        className="fixed inset-0 z-40 bg-black/30"
        onClick={onClose}
      />

      {/* Panel sliding from right */}
      <div
        className="fixed top-0 right-0 bottom-0 z-50 flex flex-col bg-[#f0ede4] shadow-2xl border-l border-gray-200"
        style={{ width: "min(480px, 100vw)", animation: "slideInRight 0.25s ease" }}
      >
        {/* Header */}
        <div className="flex items-start justify-between border-b border-gray-100 px-6 py-5">
          <div>
            <p className="text-[11px] font-semibold uppercase tracking-widest text-[#331405] mb-1">
              {projectName}
            </p>
            <h2 className="text-base font-bold text-[#101010]">Edit Task</h2>
          </div>
          <button
            type="button"
            onClick={onClose}
            className="rounded-xl p-2 text-gray-400 hover:bg-gray-100 hover:text-gray-700 transition-colors"
          >
            <X size={18} />
          </button>
        </div>

        {/* Form body */}
        <form onSubmit={handleSubmit} className="flex-1 overflow-y-auto">
          <div className="px-6 py-5 space-y-5">

            {/* Task name */}
            <div>
              <label className="block text-xs font-bold text-gray-600 mb-1.5">Task Name</label>
              <input
                type="text"
                value={form.name}
                onChange={(e) => set("name")(e.target.value)}
                className="w-full rounded-xl border border-gray-200 px-3 py-2.5 text-sm outline-none focus:border-[#c57e5b] focus:ring-4 focus:ring-[#c57e5b]/10"
                placeholder="Stage / task name"
                required
              />
            </div>

            {/* Status */}
            <div>
              <label className="block text-xs font-bold text-gray-600 mb-1.5">Status</label>
              <select
                value={form.status}
                onChange={(e) => set("status")(e.target.value)}
                className="w-full rounded-xl border border-gray-200 px-3 py-2.5 text-sm outline-none focus:border-[#c57e5b] focus:ring-4 focus:ring-[#c57e5b]/10"
              >
                {PHASE_ORDER.map((s) => (
                  <option key={s} value={s}>{STATUS_LABEL[s]}</option>
                ))}
              </select>
            </div>

            {/* Date row */}
            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="flex items-center gap-1.5 text-xs font-bold text-gray-600 mb-1.5">
                  <Calendar size={12} /> Start Date
                </label>
                <input
                  type="date"
                  value={form.startDate}
                  onChange={(e) => set("startDate")(e.target.value)}
                  className="w-full rounded-xl border border-gray-200 px-3 py-2.5 text-sm outline-none focus:border-[#c57e5b] focus:ring-4 focus:ring-[#c57e5b]/10"
                />
              </div>
              <div>
                <label className="flex items-center gap-1.5 text-xs font-bold text-gray-600 mb-1.5">
                  <Clock size={12} /> End Date
                </label>
                <input
                  type="date"
                  value={form.endDate}
                  onChange={(e) => set("endDate")(e.target.value)}
                  className="w-full rounded-xl border border-gray-200 px-3 py-2.5 text-sm outline-none focus:border-[#c57e5b] focus:ring-4 focus:ring-[#c57e5b]/10"
                />
              </div>
            </div>

            {/* Client visible */}
            <div className="flex items-center gap-3 rounded-xl border border-gray-200 px-4 py-3 bg-gray-50">
              <input
                type="checkbox"
                id="task-client-visible"
                checked={form.clientVisible}
                onChange={(e) => set("clientVisible")(e.target.checked)}
                className="h-4 w-4 rounded border-gray-300 text-[#c57e5b] focus:ring-[#c57e5b]/30"
              />
              <label htmlFor="task-client-visible" className="text-sm font-medium text-gray-700 cursor-pointer">
                Visible to client
              </label>
              {!form.clientVisible && (
                <span className="ml-auto flex items-center gap-1 text-[10px] text-gray-400">
                  <Lock size={10} /> Internal only
                </span>
              )}
            </div>

            {/* Notes */}
            <div>
              <label className="block text-xs font-bold text-gray-600 mb-1.5">Notes (client visible)</label>
              <textarea
                value={form.notes}
                onChange={(e) => set("notes")(e.target.value)}
                rows={3}
                className="w-full rounded-xl border border-gray-200 px-3 py-2.5 text-sm outline-none focus:border-[#c57e5b] focus:ring-4 focus:ring-[#c57e5b]/10 resize-none"
                placeholder="Notes visible to the client…"
              />
            </div>

            {/* Internal notes */}
            <div>
              <label className="block text-xs font-bold text-gray-600 mb-1.5">Internal Notes</label>
              <textarea
                value={form.internalNotes}
                onChange={(e) => set("internalNotes")(e.target.value)}
                rows={3}
                className="w-full rounded-xl border border-gray-200 px-3 py-2.5 text-sm outline-none focus:border-[#c57e5b] focus:ring-4 focus:ring-[#c57e5b]/10 resize-none"
                placeholder="Internal notes (not visible to client)…"
              />
            </div>
          </div>

          {/* Footer */}
          <div className="sticky bottom-0 border-t border-gray-100 bg-[#f0ede4] px-6 py-4 flex items-center justify-between">
            <button
              type="button"
              onClick={onDelete}
              className="flex items-center gap-2 rounded-xl px-3 py-2 text-xs font-bold text-red-600 hover:bg-red-50 transition-colors"
            >
              <Trash2 size={14} />
              Delete task
            </button>
            <div className="flex gap-2">
              <button
                type="button"
                onClick={onClose}
                className="rounded-xl border border-gray-200 px-4 py-2 text-xs font-semibold text-gray-600 hover:bg-gray-50 transition-colors"
              >
                Cancel
              </button>
              <button
                type="submit"
                disabled={saving}
                className="flex items-center gap-2 rounded-xl bg-[#101010] px-4 py-2 text-xs font-bold text-[#f0ede4] hover:bg-[#331405] disabled:opacity-60 transition-colors"
              >
                <Save size={13} />
                {saving ? "Saving…" : "Save task"}
              </button>
            </div>
          </div>
        </form>
      </div>

      <style>{`
        @keyframes slideInRight {
          from { transform: translateX(100%); opacity: 0; }
          to   { transform: translateX(0);    opacity: 1; }
        }
      `}</style>
    </>
  );
}

/* ─── Gantt Timeline ─────────────────────────────────────────────── */
function DeadlineTimeline({ items, onTaskClick }) {
  const [expanded, setExpanded] = useState({});

  const toggleExpand = (e, id) => {
    e.preventDefault();
    e.stopPropagation();
    setExpanded((prev) => ({ ...prev, [id]: !prev[id] }));
  };

  const { rows, months, minDate, totalMs } = useMemo(() => {
    const computed = items.map((project) => {
      // Use raw ISO dates for positioning (not the formatted strings)
      const start = safeDate(project.rawStartDate) || safeDate(new Date());
      const end   = safeDate(project.rawDueDate)   || safeDate(new Date(Date.now() + 30 * 864e5));
      const daysLeft = daysBetween(TODAY, end);
      const overdue  = daysLeft < 0 && project.status !== "Completed";

      const stages = (project.stages || []).map((s, idx) => {
        const sStart = safeDate(s.startDate) || start;
        const sEnd   = safeDate(s.endDate)   || end;
        return { ...s, _idx: idx, start: sStart, end: sEnd };
      });

      return { project, start, end, daysLeft, overdue, stages };
    }).sort((a, b) => a.end - b.end);

    if (!computed.length) return { rows: [], months: [], minDate: TODAY, totalMs: 1 };

    // Collect ALL dates (project + stage) to build timeline
    const allDates = [];
    computed.forEach(({ start, end, stages }) => {
      allDates.push(start.getTime(), end.getTime());
      stages.forEach((s) => {
        if (s.start) allDates.push(s.start.getTime());
        if (s.end)   allDates.push(s.end.getTime());
      });
    });

    const min = new Date(Math.min(...allDates));
    const max = new Date(Math.max(...allDates));
    // Add buffer month
    max.setMonth(max.getMonth() + 1);

    const monthCols = [];
    const cursor = new Date(min.getFullYear(), min.getMonth(), 1);
    while (cursor <= max) {
      monthCols.push({ label: monthLabel(new Date(cursor)) });
      cursor.setMonth(cursor.getMonth() + 1);
    }

    const minFloor = new Date(min.getFullYear(), min.getMonth(), 1);
    return {
      rows: computed,
      months: monthCols,
      minDate: minFloor,
      totalMs: Math.max(1, max.getTime() - minFloor.getTime()),
    };
  }, [items]);

  if (!rows.length) return null;

  const timelineWidth = months.length * MONTH_COL_WIDTH;
  const toPct = (date) =>
    Math.min(100, Math.max(0, ((date.getTime() - minDate.getTime()) / totalMs) * 100));
  const todayInRange =
    TODAY.getTime() >= minDate.getTime() &&
    TODAY.getTime() <= minDate.getTime() + totalMs;

  return (
    <div className="overflow-hidden rounded-2xl border border-[#e3d6c5] bg-white shadow-sm">
      {/* Header */}
      <div className="flex items-center border-b border-[#e3d6c5] px-5 py-3">
        <h3 className="font-display text-sm font-semibold text-[#101010]">Project Timeline</h3>
        <p className="ml-auto text-xs font-semibold text-[#331405]">
          {rows.filter((r) => r.overdue).length} overdue
        </p>
      </div>

      <div className="flex">
        {/* ── Left: label column ── */}
        <div className="w-64 shrink-0 border-r border-[#e3d6c5]">
          <div className="flex h-11 items-center border-b border-[#e3d6c5] bg-[#faf8f5] px-4">
            <span className="text-[10px] font-bold uppercase tracking-wider text-[#999]">
              Project / Task
            </span>
          </div>

          {rows.map(({ project, stages }) => (
            <div key={project.id}>
              {/* Project row */}
              <div className="flex h-12 items-center border-b border-[#e3d6c5]/60 px-4 hover:bg-[#f0ede4] transition-colors">
                <button
                  type="button"
                  onClick={(e) => toggleExpand(e, project.id)}
                  className="mr-2 rounded p-0.5 text-[#331405] hover:bg-[#e3d6c5] transition-colors"
                  title={expanded[project.id] ? "Collapse" : "Expand tasks"}
                >
                  {expanded[project.id]
                    ? <ChevronDown size={14} />
                    : <ChevronRight size={14} />}
                </button>
                <div className="min-w-0">
                  <p className="truncate text-xs font-bold text-[#101010]">{project.name}</p>
                  <p className="truncate text-[10px] text-[#331405]">{project.client}</p>
                </div>
                {stages.length > 0 && (
                  <span className="ml-auto shrink-0 rounded-full bg-[#e3d6c5] px-1.5 py-0.5 text-[9px] font-bold text-[#331405]">
                    {stages.length}
                  </span>
                )}
              </div>

              {/* Task rows (expanded) */}
              {expanded[project.id] && stages.length === 0 && (
                <div className="flex h-9 items-center border-b border-[#e3d6c5]/40 bg-[#faf8f5] pl-10 pr-4">
                  <span className="text-[11px] italic text-[#331405]">No tasks added yet</span>
                </div>
              )}
              {expanded[project.id] && stages.map((stage) => (
                <button
                  key={stage._id || stage._idx}
                  type="button"
                  onClick={() => onTaskClick(project, stage)}
                  className="flex h-9 w-full items-center border-b border-[#e3d6c5]/40 bg-[#faf8f5] pl-10 pr-4 text-left hover:bg-[#f0ede4] transition-colors group"
                >
                  <span className={`mr-2 h-2 w-2 shrink-0 rounded-full border ${STATUS_COLOR[stage.status || "pending"]}`} />
                  <p className="truncate text-[11px] font-medium text-[#101010] group-hover:text-[#c57e5b] transition-colors">
                    {stage.name || "Untitled Task"}
                  </p>
                  {!(stage.clientVisible ?? true) && (
                    <Lock size={10} className="ml-auto text-[#331405] shrink-0" title="Internal only" />
                  )}
                </button>
              ))}
            </div>
          ))}
        </div>

        {/* ── Right: timeline column ── */}
        <div className="flex-1 overflow-x-auto">
          <div style={{ minWidth: `${timelineWidth}px` }}>
            {/* Month headers */}
            <div className="flex h-11 border-b border-[#e3d6c5] bg-[#f0ede4]">
              {months.map((month, i) => (
                <div
                  key={i}
                  style={{ width: `${MONTH_COL_WIDTH}px` }}
                  className="flex shrink-0 items-center justify-center border-r border-[#e3d6c5]/60 text-[10px] font-bold uppercase text-[#331405]"
                >
                  {month.label}
                </div>
              ))}
            </div>

            {/* Chart rows */}
            <div className="relative">
              {/* Today marker */}
              {todayInRange && (
                <div
                  className="absolute top-0 bottom-0 z-10 w-px bg-red-400"
                  style={{ left: `${toPct(TODAY)}%` }}
                >
                  <div className="absolute -left-1 -top-1 h-2 w-2 rounded-full bg-red-400" />
                </div>
              )}

              {rows.map(({ project, start, end, daysLeft, overdue, stages }) => {
                const left  = toPct(start);
                const width = Math.max(2, toPct(end) - left);
                const tone  = overdue
                  ? "border-red-300 bg-red-200 text-red-800"
                  : project.status === "Completed"
                    ? "border-emerald-300 bg-emerald-100 text-emerald-800"
                    : "border-[#c57e5b] bg-[#c57e5b] text-white";

                return (
                  <div key={project.id}>
                    {/* Project bar row */}
                    <div className="relative h-12 border-b border-[#e3d6c5]/40">
                      <Link
                        to={`/admin/projects/${project.id}`}
                        className={`absolute top-2.5 flex h-7 min-w-[60px] items-center justify-between gap-2 rounded-lg border px-2.5 text-[10px] font-bold shadow-sm hover:brightness-105 transition-all ${tone}`}
                        style={{ left: `${left}%`, width: `${width}%` }}
                        title={`${project.name} — click to open project`}
                      >
                        <span className="truncate">{project.progress}%</span>
                        <span className="shrink-0 whitespace-nowrap">
                          {project.status === "Completed"
                            ? "Done"
                            : overdue
                              ? `${Math.abs(daysLeft)}d overdue`
                              : `${daysLeft}d left`}
                        </span>
                      </Link>
                    </div>

                    {/* Task bar rows */}
                    {expanded[project.id] && stages.length === 0 && (
                      <div className="relative h-9 border-b border-[#e3d6c5]/40 bg-[#faf8f5]" />
                    )}
                    {expanded[project.id] && stages.map((stage) => {
                      const sLeft  = toPct(stage.start);
                      const sWidth = Math.max(1.5, toPct(stage.end) - sLeft);
                      const sTone  = STATUS_COLOR[stage.status || "pending"];

                      return (
                        <div
                          key={stage._id || stage._idx}
                          className="relative h-9 border-b border-[#e3d6c5]/40 bg-[#faf8f5]"
                        >
                          <button
                            type="button"
                            onClick={() => onTaskClick(project, stage)}
                            className={`absolute top-1 flex h-7 min-w-[50px] cursor-pointer items-center rounded-md border px-2 text-[10px] font-bold shadow-sm transition-transform hover:scale-[1.02] active:scale-95 ${sTone}`}
                            style={{ left: `${sLeft}%`, width: `${sWidth}%` }}
                            title={`${stage.name} — ${STATUS_LABEL[stage.status || "pending"]}\n${fmtShort(stage.startDate)} → ${fmtShort(stage.endDate)}`}
                          >
                            <span className="truncate">{stage.name || "Untitled"}</span>
                          </button>
                        </div>
                      );
                    })}
                  </div>
                );
              })}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

/* ─── Main page ──────────────────────────────────────────────────── */
export default function ProjectsList() {
  const [search,  setSearch]  = useState("");
  const [projects, setProjects] = useState([]);
  const [loading, setLoading] = useState(true);
  const [saving,  setSaving]  = useState(false);
  const { token } = useAuth();

  // Slide panel state
  const [panel, setPanel] = useState(null); // { project, stage }

  const fetchProjects = useCallback(() => {
    adminApi.getProjects(token)
      .then((data) => {
        const mapped = data.map((p) => {
          // Keep raw dates for Gantt positioning
          const rawStartDate = p.startDate || null;
          const rawDueDate   = p.expectedEndDate || null;

          // Formatted strings for display only
          const sDate = rawStartDate ? new Date(rawStartDate) : new Date();
          const dDate = rawDueDate   ? new Date(rawDueDate)   : new Date(Date.now() + 30 * 864e5);
          const months = ["Jan","Feb","Mar","Apr","May","Jun","Jul","Aug","Sep","Oct","Nov","Dec"];
          const fmt = (d) => `${d.getDate()} ${months[d.getMonth()]} ${d.getFullYear()}`;

          return {
            id: p._id,
            companyId: p.clientId?._id || "unknown",
            name:   p.name,
            client: p.clientId?.company || p.clientId?.name || "Unknown Client",
            status: p.status === "completed"   ? "Completed"
                  : p.status === "in_progress" ? "In Progress"
                  : p.status === "not_started" ? "Not Started"
                  : p.status === "cancelled"   ? "Cancelled"
                  : "On Hold",
            progress: p.progress || 0,
            startDate:    fmt(sDate),
            dueDate:      fmt(dDate),
            rawStartDate,
            rawDueDate,
            priority: p.status === "completed" ? "on-track" : "upcoming",
            team: [],
            stages: (p.stages || []),  // already mapped by populateProjectStages
          };
        });
        setProjects(mapped);
      })
      .catch(() => {})
      .finally(() => setLoading(false));
  }, [token]);

  useEffect(() => { fetchProjects(); }, [fetchProjects]);

  const filtered = useMemo(() => {
    const q = search.trim().toLowerCase();
    if (!q) return projects;
    return projects.filter((p) =>
      `${p.name} ${p.client} ${p.status}`.toLowerCase().includes(q)
    );
  }, [search, projects]);

  /* Save updated stage */
  async function handleSaveTask(updatedStage) {
    if (!panel) return;
    const proj = panel.project;

    // Build updated stages array
    const updatedStages = proj.stages.map((s) =>
      (s._id === updatedStage._id || s.id === updatedStage.id) ? updatedStage : s
    );

    setSaving(true);
    try {
      await adminApi.updateProject(proj.id, { stages: updatedStages }, token);
      setPanel(null);
      fetchProjects();
    } catch (err) {
      console.error(err);
    } finally {
      setSaving(false);
    }
  }

  /* Delete stage */
  async function handleDeleteTask() {
    if (!panel) return;
    const proj  = panel.project;
    const stage = panel.stage;

    const updatedStages = proj.stages.filter(
      (s) => s._id !== stage._id && s.id !== stage.id
    );

    setSaving(true);
    try {
      await adminApi.updateProject(proj.id, { stages: updatedStages }, token);
      setPanel(null);
      fetchProjects();
    } catch (err) {
      console.error(err);
    } finally {
      setSaving(false);
    }
  }

  if (loading) {
    return (
      <div className="py-20 text-center text-sm text-[#331405]">Loading projects…</div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Page header */}
      <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h2 className="font-display text-2xl font-semibold tracking-tight text-[#101010]">
            All Projects
          </h2>
          <p className="mt-1 text-sm text-[#331405]">
            {filtered.length} of {projects.length} projects across every company
          </p>
        </div>
        <div className="flex h-10 w-full items-center gap-2 rounded-xl border border-[#e3d6c5] bg-[#e3d6c5] px-3 sm:w-72">
          <Search size={14} className="text-[#331405]" />
          <input
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="Search projects or clients"
            className="w-full bg-transparent text-sm outline-none placeholder:text-[#331405]/60"
          />
        </div>
      </div>

      {/* Gantt */}
      <DeadlineTimeline
        items={filtered}
        onTaskClick={(project, stage) => setPanel({ project, stage })}
      />

      {/* Project cards */}
      <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-3">
        {filtered.map((project) => (
          <ProjectCard key={project.id} project={project} />
        ))}
      </div>

      {!filtered.length && (
        <p className="rounded-2xl border border-dashed border-[#e3d6c5] p-10 text-center text-sm text-[#331405]">
          No projects match your search.
        </p>
      )}

      {/* Slide-in panel */}
      {panel && (
        <TaskSlidePanel
          task={panel.stage}
          projectName={panel.project.name}
          saving={saving}
          onClose={() => setPanel(null)}
          onSave={handleSaveTask}
          onDelete={handleDeleteTask}
        />
      )}
    </div>
  );
}
