import { useEffect, useState, useMemo, useCallback } from "react";
import { useParams, Link } from "react-router-dom";
import {
  ArrowLeft, Calendar, Clock, Users, CheckCircle2,
  AlertTriangle, Layers, FileText, BarChart3,
  ChevronRight, Lock, ExternalLink, Check, Zap,
  Circle, AlertCircle
} from "lucide-react";
import { adminApi } from "../../lib/clientApi";
import { useAuth } from "../../auth/useAuth";

/* ─── helpers ────────────────────────────────────────────────────── */
const safeDate = (val) => {
  if (!val) return null;
  const d = val instanceof Date ? val : new Date(val);
  return isNaN(d.getTime()) ? null : d;
};

const fmtDate = (val) => {
  const d = safeDate(val);
  if (!d) return "—";
  return d.toLocaleDateString("en-US", { day: "numeric", month: "short", year: "numeric" });
};

const STATUS_MAP = {
  completed:   { label: "Completed",   bg: "bg-emerald-50",  text: "text-emerald-700", border: "border-emerald-200", dot: "bg-emerald-500" },
  in_progress: { label: "In Progress", bg: "bg-amber-50",    text: "text-amber-700",   border: "border-amber-200",   dot: "bg-amber-500"   },
  not_started: { label: "Not Started", bg: "bg-gray-50",     text: "text-gray-600",    border: "border-gray-200",    dot: "bg-gray-400"    },
  on_hold:     { label: "On Hold",     bg: "bg-blue-50",     text: "text-blue-700",    border: "border-blue-200",    dot: "bg-blue-500"    },
  cancelled:   { label: "Cancelled",   bg: "bg-red-50",      text: "text-red-600",     border: "border-red-200",     dot: "bg-red-500"     },
  delayed:     { label: "Delayed",     bg: "bg-red-50",      text: "text-red-600",     border: "border-red-200",     dot: "bg-red-500"     },
  pending:     { label: "Pending",     bg: "bg-gray-50",     text: "text-gray-600",    border: "border-gray-200",    dot: "bg-gray-400"    },
};

const getStatus = (s) => STATUS_MAP[s] || STATUS_MAP.pending;

/* ─── Stat Card ──────────────────────────────────────────────────── */
function StatCard({ icon: Icon, label, value, color = "text-[#c57e5b]" }) {
  return (
    <div className="rounded-2xl border border-[#e3d6c5] bg-[#e3d6c5] px-5 py-4">
      <div className="flex items-center gap-3">
        <div className="grid h-10 w-10 shrink-0 place-items-center rounded-xl bg-[#e3d6c5]">
          <Icon size={18} className={color} />
        </div>
        <div>
          <p className="text-[11px] font-semibold uppercase tracking-wider text-[#331405]">{label}</p>
          <p className="text-lg font-bold text-[#101010]">{value}</p>
        </div>
      </div>
    </div>
  );
}

/* ─── Visual Roadmap ─────────────────────────────────────────────── */
function ProjectRoadmap({ stages, projectId, clientId }) {
  if (stages.length === 0) {
    return (
      <div className="rounded-xl border border-dashed border-[#e3d6c5] bg-[#e3d6c5] px-6 py-10 text-center">
        <Layers size={32} className="mx-auto mb-3 text-[#e3d6c5]" />
        <p className="text-sm font-semibold text-[#331405]">No stages added yet</p>
        <p className="mt-1 text-xs text-[#331405]">
          Add stages from the{" "}
          <Link
            to={`/admin/client-projects?clientId=${clientId}&projectId=${projectId}`}
            className="font-bold text-[#c57e5b] hover:underline"
          >
            Client Projects page
          </Link>.
        </p>
      </div>
    );
  }

  // Find the "active" index — first non-completed stage
  const activeIdx = stages.findIndex((s) => s.status !== "completed");
  const allDone = activeIdx === -1;

  return (
    <div className="relative">
      {/* Vertical connector line */}
      <div
        className="absolute left-[27px] top-[36px] w-[3px] rounded-full bg-[#e3d6c5]"
        style={{ height: `calc(100% - 72px)` }}
      />
      {/* Filled portion of the connector */}
      {stages.length > 1 && (
        <div
          className="absolute left-[27px] top-[36px] w-[3px] rounded-full bg-gradient-to-b from-emerald-400 to-emerald-300 transition-all duration-700"
          style={{
            height: allDone
              ? `calc(100% - 72px)`
              : activeIdx > 0
                ? `calc(${((activeIdx) / (stages.length - 1)) * 100}% - ${36 * (1 - (activeIdx) / (stages.length - 1))}px)`
                : "0px",
          }}
        />
      )}

      <div className="relative space-y-0">
        {stages.map((stage, idx) => {
          const isDone    = stage.status === "completed";
          const isActive  = idx === activeIdx;
          const isDelayed = stage.status === "delayed";
          const isPending = !isDone && !isActive && !isDelayed;

          return (
            <div key={stage._id || idx} className="relative flex gap-5 pb-8 last:pb-0">
              {/* ── Node circle ── */}
              <div className="relative z-10 flex shrink-0 items-start pt-1">
                {isDone ? (
                  /* Completed — green check */
                  <div className="grid h-[54px] w-[54px] place-items-center rounded-full bg-emerald-500 shadow-lg shadow-emerald-200/60">
                    <Check size={22} className="text-[#f0ede4]" strokeWidth={3} />
                  </div>
                ) : isActive ? (
                  /* Active — pulsing amber ring */
                  <div className="relative grid h-[54px] w-[54px] place-items-center">
                    {/* Pulse ring */}
                    <span className="absolute inset-0 animate-ping rounded-full bg-amber-400/30" style={{ animationDuration: "2s" }} />
                    <span className="absolute inset-0 rounded-full border-[3px] border-amber-400 bg-[#f0ede4]" />
                    <Zap size={20} className="relative z-10 text-amber-600" strokeWidth={2.5} />
                  </div>
                ) : isDelayed ? (
                  /* Delayed — red alert */
                  <div className="grid h-[54px] w-[54px] place-items-center rounded-full border-[3px] border-red-300 bg-red-50">
                    <AlertCircle size={20} className="text-red-500" strokeWidth={2.5} />
                  </div>
                ) : (
                  /* Pending — dimmed circle */
                  <div className="grid h-[54px] w-[54px] place-items-center rounded-full border-[3px] border-[#ddd2cc] bg-[#f7f0ec]">
                    <Circle size={16} className="text-[#c4b5ab]" />
                  </div>
                )}
              </div>

              {/* ── Card ── */}
              <div
                className={`flex-1 rounded-2xl border p-5 transition-all duration-300 ${
                  isDone
                    ? "border-emerald-200 bg-emerald-50/50"
                    : isActive
                      ? "border-amber-300 bg-gradient-to-br from-amber-50/80 to-orange-50/40 shadow-lg shadow-amber-100/50 ring-1 ring-amber-200/50"
                      : isDelayed
                        ? "border-red-200 bg-red-50/40"
                        : "border-[#e3d6c5] bg-[#e3d6c5]"
                }`}
              >
                {/* Top row */}
                <div className="flex items-start justify-between gap-3">
                  <div className="min-w-0 flex-1">
                    {/* Stage number + name */}
                    <div className="flex items-center gap-2.5">
                      <span className={`flex h-6 min-w-[24px] items-center justify-center rounded-md px-1.5 text-[10px] font-extrabold ${
                        isDone
                          ? "bg-emerald-100 text-emerald-700"
                          : isActive
                            ? "bg-amber-100 text-amber-700"
                            : isDelayed
                              ? "bg-red-100 text-red-600"
                              : "bg-[#e3d6c5] text-[#331405]"
                      }`}>
                        {idx + 1}
                      </span>
                      <h3 className={`text-[15px] font-bold leading-tight ${
                        isDone
                          ? "text-emerald-800"
                          : isActive
                            ? "text-amber-900"
                            : isPending
                              ? "text-[#a09589]"
                              : "text-red-800"
                      }`}>
                        {stage.name || "Untitled Stage"}
                      </h3>
                      {!(stage.clientVisible ?? true) && (
                        <span className="inline-flex items-center gap-0.5 rounded-full bg-gray-100 px-1.5 py-0.5 text-[9px] font-bold text-gray-500">
                          <Lock size={8} /> Internal
                        </span>
                      )}
                    </div>

                    {/* Status label */}
                    <div className="mt-2 flex flex-wrap items-center gap-3">
                      {isActive && (
                        <span className="inline-flex items-center gap-1.5 rounded-full bg-amber-100 px-2.5 py-1 text-[10px] font-bold text-amber-700 shadow-sm">
                          <span className="relative flex h-2 w-2">
                            <span className="absolute inline-flex h-full w-full animate-ping rounded-full bg-amber-400 opacity-60" />
                            <span className="relative inline-flex h-2 w-2 rounded-full bg-amber-500" />
                          </span>
                          Currently Active
                        </span>
                      )}
                      {isDone && (
                        <span className="inline-flex items-center gap-1 rounded-full bg-emerald-100 px-2.5 py-1 text-[10px] font-bold text-emerald-700">
                          <Check size={10} strokeWidth={3} /> Completed
                        </span>
                      )}
                      {isDelayed && (
                        <span className="inline-flex items-center gap-1 rounded-full bg-red-100 px-2.5 py-1 text-[10px] font-bold text-red-600">
                          <AlertTriangle size={10} /> Delayed
                        </span>
                      )}
                      {isPending && (
                        <span className="inline-flex items-center gap-1 rounded-full bg-gray-100 px-2.5 py-1 text-[10px] font-bold text-gray-500">
                          <Circle size={9} /> Upcoming
                        </span>
                      )}
                    </div>
                  </div>
                </div>

                {/* Date row */}
                <div className={`mt-3 flex flex-wrap items-center gap-4 text-[11px] font-semibold ${
                  isDone ? "text-emerald-600/80" : isActive ? "text-amber-700/70" : "text-[#a09589]"
                }`}>
                  <span className="flex items-center gap-1">
                    <Calendar size={11} /> {fmtDate(stage.startDate)}
                  </span>
                  <ChevronRight size={10} />
                  <span className="flex items-center gap-1">
                    <Clock size={11} /> {fmtDate(stage.endDate)}
                  </span>
                </div>

                {/* Notes */}
                {stage.notes && (
                  <p className={`mt-2.5 text-xs leading-relaxed ${
                    isDone ? "text-emerald-700/60" : isActive ? "text-amber-800/60" : "text-[#a09589]"
                  }`}>
                    {stage.notes}
                  </p>
                )}
              </div>
            </div>
          );
        })}
      </div>

      {/* All done celebration */}
      {allDone && stages.length > 0 && (
        <div className="mt-4 flex items-center gap-3 rounded-2xl border border-emerald-200 bg-gradient-to-r from-emerald-50 to-teal-50 px-5 py-4">
          <div className="grid h-10 w-10 shrink-0 place-items-center rounded-xl bg-emerald-100">
            <CheckCircle2 size={20} className="text-emerald-600" />
          </div>
          <div>
            <p className="text-sm font-bold text-emerald-800">All stages completed! 🎉</p>
            <p className="text-xs text-emerald-600/80">Every milestone in this project has been delivered.</p>
          </div>
        </div>
      )}
    </div>
  );
}

/* ─── Main Page ──────────────────────────────────────────────────── */
export default function ProjectDetailPage() {
  const { projectId } = useParams();
  const { token } = useAuth();
  const [project, setProject] = useState(null);
  const [loading, setLoading] = useState(true);

  const fetchProject = useCallback(() => {
    setLoading(true);
    adminApi.getProjects(token)
      .then((data) => {
        const found = data.find((p) => p._id === projectId);
        if (found) setProject(found);
      })
      .catch(() => {})
      .finally(() => setLoading(false));
  }, [projectId, token]);

  useEffect(() => { fetchProject(); }, [fetchProject]);

  const stages = useMemo(() => project?.stages || [], [project]);

  const stats = useMemo(() => {
    if (!project) return { total: 0, completed: 0, inProgress: 0, delayed: 0, progress: 0 };
    const total     = stages.length;
    const completed = stages.filter((s) => s.status === "completed").length;
    const inProgress= stages.filter((s) => s.status === "in_progress").length;
    const delayed   = stages.filter((s) => s.status === "delayed").length;
    const progress  = total > 0 ? Math.round((completed / total) * 100) : (project.progress || 0);
    return { total, completed, inProgress, delayed, progress };
  }, [project, stages]);

  /* Loading */
  if (loading) {
    return (
      <div className="flex h-full items-center justify-center">
        <div className="text-center">
          <div className="mx-auto mb-3 h-8 w-8 animate-spin rounded-full border-2 border-[#c57e5b] border-t-transparent" />
          <p className="text-sm text-[#331405]">Loading project…</p>
        </div>
      </div>
    );
  }

  /* Not found */
  if (!project) {
    return (
      <div className="flex h-full items-center justify-center">
        <div className="text-center">
          <FileText size={40} className="mx-auto mb-3 text-[#e3d6c5]" />
          <p className="text-sm font-semibold text-[#331405]">Project not found</p>
          <Link to="/admin/projects" className="mt-3 inline-flex items-center gap-2 text-sm font-bold text-[#c57e5b] hover:underline">
            <ArrowLeft size={14} /> Back to projects
          </Link>
        </div>
      </div>
    );
  }

  const st = getStatus(project.status);
  const clientName = project.clientId?.company || project.clientId?.name || "Unknown Client";

  return (
    <div className="mx-auto max-w-5xl space-y-6 p-5 xl:p-6">

      {/* ─── Back button ─── */}
      <Link
        to="/admin/projects"
        className="inline-flex items-center gap-2 rounded-xl px-3 py-1.5 text-xs font-bold text-[#331405] hover:bg-[#e3d6c5] transition-colors"
      >
        <ArrowLeft size={14} /> Back to Projects
      </Link>

      {/* ─── Header card ─── */}
      <div className="overflow-hidden rounded-2xl border border-[#e3d6c5] bg-[#e3d6c5] shadow-[0_18px_40px_rgba(79,39,16,0.06)]">
        {/* Top accent bar */}
        <div className="h-1.5 bg-gradient-to-r from-[#c57e5b] via-[#c57e5b] to-[#e3d6c5]" />

        <div className="p-6 sm:p-8">
          <div className="flex flex-col gap-4 sm:flex-row sm:items-start sm:justify-between">
            <div>
              <div className="flex items-center gap-3 mb-2">
                <span className={`inline-flex items-center gap-1.5 rounded-full border px-3 py-1 text-[11px] font-bold ${st.bg} ${st.text} ${st.border}`}>
                  <span className={`h-1.5 w-1.5 rounded-full ${st.dot}`} />
                  {st.label}
                </span>
              </div>
              <h1 className="font-display text-2xl font-bold tracking-tight text-[#101010] sm:text-3xl">
                {project.name}
              </h1>
              <p className="mt-1.5 text-sm text-[#331405]">
                Client: <span className="font-semibold text-[#101010]">{clientName}</span>
              </p>
            </div>

            <Link
              to={`/admin/client-projects?clientId=${project.clientId?._id || "unknown"}&projectId=${project._id}`}
              className="inline-flex items-center gap-2 rounded-xl border border-[#e3d6c5] bg-[#f0ede4] px-4 py-2.5 text-xs font-bold text-[#331405] shadow-sm hover:border-[#c57e5b] hover:text-[#c57e5b] transition-all"
            >
              <ExternalLink size={13} /> Open in Client Projects
            </Link>
          </div>

          {/* Date range */}
          <div className="mt-5 flex flex-wrap items-center gap-4 text-sm text-[#331405]">
            <span className="flex items-center gap-1.5">
              <Calendar size={14} className="text-[#c57e5b]" />
              Start: <span className="font-semibold text-[#101010]">{fmtDate(project.startDate)}</span>
            </span>
            <ChevronRight size={14} className="text-[#e3d6c5]" />
            <span className="flex items-center gap-1.5">
              <Clock size={14} className="text-[#c57e5b]" />
              Due: <span className="font-semibold text-[#101010]">{fmtDate(project.expectedEndDate)}</span>
            </span>
          </div>

          {/* Progress bar */}
          <div className="mt-6">
            <div className="mb-2 flex items-center justify-between text-xs text-[#331405]">
              <span className="font-bold">Overall Progress</span>
              <span className="font-bold text-[#101010]">{stats.progress}%</span>
            </div>
            <div className="h-3 overflow-hidden rounded-full bg-[#e3d6c5]">
              <div
                className="h-full rounded-full bg-gradient-to-r from-[#c57e5b] to-[#c57e5b] transition-all duration-500"
                style={{ width: `${stats.progress}%` }}
              />
            </div>
          </div>
        </div>
      </div>

      {/* ─── Stats row ─── */}
      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
        <StatCard icon={Layers}        label="Total Stages"  value={stats.total} />
        <StatCard icon={CheckCircle2}  label="Completed"     value={stats.completed}  color="text-emerald-600" />
        <StatCard icon={BarChart3}     label="In Progress"   value={stats.inProgress} color="text-amber-600"   />
        <StatCard icon={AlertTriangle} label="Delayed"       value={stats.delayed}    color="text-red-500"     />
      </div>

      {/* ─── Description ─── */}
      {project.description && (
        <div className="rounded-2xl border border-[#e3d6c5] bg-[#e3d6c5] p-6">
          <h2 className="mb-3 flex items-center gap-2 text-sm font-bold text-[#101010]">
            <FileText size={15} className="text-[#c57e5b]" /> Description
          </h2>
          <p className="whitespace-pre-wrap text-sm leading-relaxed text-[#331405]">{project.description}</p>
        </div>
      )}

      {/* ─── Visual Roadmap ─── */}
      <div className="rounded-2xl border border-[#e3d6c5] bg-[#f0ede4] shadow-[0_18px_40px_rgba(79,39,16,0.06)]">
        <div className="border-b border-[#e3d6c5] px-6 py-4">
          <h2 className="flex items-center gap-2 text-sm font-bold text-[#101010]">
            <Layers size={15} className="text-[#c57e5b]" />
            Project Roadmap
            <span className="ml-1 rounded-full bg-[#e3d6c5] px-2 py-0.5 text-[10px] font-bold text-[#331405]">
              {stages.length} stage{stages.length !== 1 ? "s" : ""}
            </span>
            {stats.completed > 0 && (
              <span className="rounded-full bg-emerald-100 px-2 py-0.5 text-[10px] font-bold text-emerald-700">
                {stats.completed}/{stats.total} done
              </span>
            )}
          </h2>
        </div>

        <div className="p-6">
          <ProjectRoadmap
            stages={stages}
            projectId={project._id}
            clientId={project.clientId?._id || "unknown"}
          />
        </div>
      </div>

      {/* ─── Notes ─── */}
      {project.notes && (
        <div className="rounded-2xl border border-[#e3d6c5] bg-[#e3d6c5] p-6">
          <h2 className="mb-3 flex items-center gap-2 text-sm font-bold text-[#101010]">
            <FileText size={15} className="text-[#c57e5b]" /> Notes
          </h2>
          <p className="whitespace-pre-wrap text-sm leading-relaxed text-[#331405]">{project.notes}</p>
        </div>
      )}

      {/* ─── Team / Assignees (if any) ─── */}
      {project.assignees && project.assignees.length > 0 && (
        <div className="rounded-2xl border border-[#e3d6c5] bg-[#e3d6c5] p-6">
          <h2 className="mb-3 flex items-center gap-2 text-sm font-bold text-[#101010]">
            <Users size={15} className="text-[#c57e5b]" /> Team
          </h2>
          <div className="flex flex-wrap gap-2">
            {project.assignees.map((a, i) => (
              <span key={i} className="rounded-full border border-[#e3d6c5] bg-[#f0ede4] px-3 py-1.5 text-xs font-semibold text-[#101010]">
                {a}
              </span>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}
