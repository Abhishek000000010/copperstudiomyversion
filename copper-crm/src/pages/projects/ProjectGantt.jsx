import { useEffect, useMemo, useState } from "react";
import { useNavigate, useParams } from "react-router-dom";
import { ChevronDown, ChevronRight, MessageSquare, CheckSquare, Trash2, Save, Plus, Lock } from "lucide-react";
import { Avatar, Badge, Button } from "../../components/ui";
import { companies as fallbackCompanies, projects as fallbackProjects, kanbanTasks as initialTasks } from "../../data/mockData";
import { useCrmRecords } from "../../hooks/useCrmRecords";
import { useToast } from "../../components/useToast";
import { useAuth } from "../../auth/useAuth";
import { adminApi } from "../../lib/clientApi";
import SidePanel from "../../components/SidePanel";
import ProjectHeader from "./ProjectHeader";
import { TODAY, DAY_MS, parseFullDate, parseShortDate, formatRange } from "../../lib/dates";

const PHASE_ORDER = ["pending", "in_progress", "delayed", "completed"];
const PHASE_LABELS = {
  pending: "Pending",
  in_progress: "In Progress",
  delayed: "Delayed",
  completed: "Completed"
};
const PHASE_DOT = {
  pending: "bg-gray-400",
  in_progress: "bg-amber-500",
  delayed: "bg-red-500",
  completed: "bg-emerald-500",
};

const STATUS_BAR_STYLE = {
  pending: "border-gray-200 bg-gray-100 text-gray-800",
  in_progress: "border-[#c57e5b]/40 bg-[#c57e5b]/15 text-[#331405]",
  delayed: "border-red-200 bg-red-100 text-red-800",
  completed: "border-emerald-200 bg-emerald-100 text-emerald-800",
};

const ZOOM_LEVELS = {
  Week: 150,
  Month: 80,
  Quarter: 40,
};

export default function ProjectGantt() {
  const { companyId, projectId } = useParams();
  const navigate = useNavigate();
  const { showToast } = useToast();
  const { token } = useAuth();

  const [project, setProject] = useState(null);
  const [loadingProject, setLoadingProject] = useState(true);
  const [zoom, setZoom] = useState("Week");
  const [collapsed, setCollapsed] = useState({});
  const [activeTask, setActiveTask] = useState(null);
  const [taskEditor, setTaskEditor] = useState(null);

  // Fetch all companies (real CRM records)
  const { records: companies } = useCrmRecords("companies", fallbackCompanies);
  const company = useMemo(() => companies.find((c) => String(c.id) === companyId || String(c._id) === companyId), [companies, companyId]);

  // Fetch all tasks (real CRM records)
  const fallbackTasksFlat = useMemo(
    () => Object.entries(initialTasks).flatMap(([status, tasks]) => tasks.map((t) => ({ ...t, status }))),
    []
  );
  const { records: dbTasks, save: saveDbTask, remove: removeDbTask } = useCrmRecords("tasks", fallbackTasksFlat);

  // Fetch real project details
  useEffect(() => {
    if (!token) return;
    adminApi.getProjects(token)
      .then((data) => {
        const p = data.find((item) => item._id === projectId || item.id === projectId);
        if (p) setProject(p);
      })
      .catch(() => {})
      .finally(() => setLoadingProject(false));
  }, [projectId, token]);

  const activeProject = useMemo(() => {
    if (project) return project;
    // Fallback to mock project if loading or not found
    return fallbackProjects.find((p) => String(p.id) === projectId && String(p.companyId) === companyId);
  }, [project, companyId, projectId]);

  // Filter and map tasks for this project
  const projectTasks = useMemo(() => {
    if (!activeProject) return [];
    const pid = String(activeProject._id || activeProject.id);
    return dbTasks.filter((task) => String(task.projectId) === pid);
  }, [dbTasks, activeProject]);

  const { phases, minDate, maxDate, weeks } = useMemo(() => {
    if (!activeProject) return { phases: [], minDate: TODAY, maxDate: TODAY, weeks: [] };

    const referenceYear = activeProject.dueDate ? new Date(activeProject.dueDate).getFullYear() : new Date().getFullYear();
    const allTasks = projectTasks.map((task) => {
      let start = null;
      let end = null;
      if (task.startDate) {
        const d = new Date(task.startDate);
        if (!isNaN(d.getTime())) start = d;
      }
      if (task.endDate) {
        const d = new Date(task.endDate);
        if (!isNaN(d.getTime())) end = d;
      }
      if (!start || !end) {
        const endVal = task.deadline ? parseShortDate(task.deadline, referenceYear) : new Date();
        const span = Math.max(2, Math.min(task.subtasks || 2, 7));
        start = new Date(endVal.getTime() - span * DAY_MS);
        end = endVal;
      }
      return { ...task, start, end };
    });

    const allDates = allTasks.flatMap((task) => [task.start, task.end]);
    const min = allDates.length ? new Date(Math.min(...allDates.map((d) => d.getTime())) - 3 * DAY_MS) : TODAY;
    const max = allDates.length ? new Date(Math.max(...allDates.map((d) => d.getTime())) + 3 * DAY_MS) : new Date(TODAY.getTime() + 7 * DAY_MS);

    const phaseGroups = PHASE_ORDER
      .map((phase) => ({ phase, tasks: allTasks.filter((task) => task.status === phase) }))
      .filter((group) => group.tasks.length > 0);

    const totalDays = Math.max(1, Math.ceil((max - min) / DAY_MS));
    const weekCount = Math.max(1, Math.ceil(totalDays / 7));
    const weekCols = Array.from({ length: weekCount }, (_, index) => {
      const weekStart = new Date(min.getTime() + index * 7 * DAY_MS);
      const weekEnd = new Date(Math.min(weekStart.getTime() + 6 * DAY_MS, max.getTime()));
      return { label: formatRange(weekStart, weekEnd) };
    });

    return { phases: phaseGroups, minDate: min, maxDate: max, weeks: weekCols };
  }, [activeProject, projectTasks]);

  if (loadingProject) {
    return <div className="py-20 text-center text-sm text-[#331405]">Loading Gantt chart...</div>;
  }

  if (!company || !activeProject) {
    return (
      <div className="rounded-2xl border border-[#e3d6c5] bg-white p-10 text-center">
        <p className="text-sm font-semibold text-[#331405]">We couldn't find that project for this company.</p>
        <Button variant="secondary" className="mt-4" onClick={() => navigate("/admin/companies")}>Back to Companies</Button>
      </div>
    );
  }

  const colWidth = ZOOM_LEVELS[zoom];
  const totalRangeMs = Math.max(1, maxDate - minDate);
  const timelineWidth = weeks.length * colWidth;

  function toPct(date) {
    return Math.min(100, Math.max(0, ((date - minDate) / totalRangeMs) * 100));
  }

  function togglePhase(phase) {
    setCollapsed((current) => ({ ...current, [phase]: !current[phase] }));
  }

  const showTodayLine = TODAY >= minDate && TODAY <= maxDate;

  function handleShare() {
    navigator.clipboard?.writeText(`${window.location.origin}/admin/companies/${company.id}/projects/${activeProject.id}/tasks`);
    showToast({ title: "Link copied", message: "Project timeline link copied to clipboard." });
  }

  function openNewTask(column = "pending") {
    setTaskEditor({
      mode: "create",
      column,
      task: {
        id: `t-${Date.now()}`,
        title: "",
        project: activeProject.name,
        projectId: activeProject._id || activeProject.id,
        priority: "Medium",
        assignee: "A",
        deadline: "",
        startDate: new Date().toISOString().split("T")[0],
        endDate: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000).toISOString().split("T")[0],
        description: "",
        clientVisible: true,
        internalNotes: "",
        subtasks: 0,
        comments: 0,
      },
    });
  }

  function openEditTask(column, task) {
    setTaskEditor({ mode: "edit", column, task });
  }

  async function saveTask(nextTask, nextColumn) {
    try {
      const isNew = !nextTask._id;
      let deadline = nextTask.deadline;
      if (nextTask.endDate) {
        const d = new Date(nextTask.endDate);
        if (!isNaN(d.getTime())) {
          const months = ["Jan", "Feb", "Mar", "Apr", "May", "Jun", "Jul", "Aug", "Sep", "Oct", "Nov", "Dec"];
          deadline = `${d.getDate()} ${months[d.getMonth()]}`;
        }
      }
      await saveDbTask({ ...nextTask, status: nextColumn, deadline });
      setTaskEditor(null);
      showToast({
        title: isNew ? "Task created" : "Task updated",
        message: `${nextTask.title || "Task"} saved in ${nextColumn}.`,
      });
    } catch (error) {
      showToast({ type: "error", title: "Could not save task", message: error.message });
    }
  }

  async function deleteTask(task) {
    try {
      await removeDbTask(task);
      setTaskEditor(null);
      showToast({ title: "Task deleted", message: `${task.title || "Task"} removed successfully.` });
    } catch (error) {
      showToast({ type: "error", title: "Could not delete task", message: error.message });
    }
  }

  return (
    <div className="space-y-6">
      <ProjectHeader
        company={company}
        project={activeProject}
        activeTab="Tasks"
        onShare={handleShare}
        onNewTask={() => openNewTask()}
      />

      <div className="rounded-2xl border border-[#e3d6c5] bg-white shadow-sm">
        <div className="flex flex-wrap items-center justify-between gap-3 border-b border-[#e3d6c5] px-5 py-3">
          <div className="flex items-center gap-1 rounded-lg bg-[#faf8f5] p-1">
            {Object.keys(ZOOM_LEVELS).map((level) => (
              <button
                key={level}
                type="button"
                onClick={() => setZoom(level)}
                className={`rounded-md px-3 py-1.5 text-xs font-bold transition-colors ${
                  zoom === level ? "bg-[#f0ede4] text-[#331405] shadow-sm" : "text-[#331405] hover:text-[#101010]"
                }`}
              >
                {level}
              </button>
            ))}
          </div>
          <div className="flex items-center gap-4">
            <p className="text-xs font-semibold text-[#331405]">
              {phases.reduce((sum, group) => sum + group.tasks.length, 0)} tasks across {phases.length} stages
            </p>
            <Button size="sm" onClick={() => openNewTask()} className="h-8">
              <Plus size={14} className="mr-1" /> Add Task
            </Button>
          </div>
        </div>

        <div className="flex">
          <div className="w-64 shrink-0 border-r border-[#e3d6c5]">
            <div className="flex h-11 items-center border-b border-[#e3d6c5] bg-[#faf8f5] px-4">
              <span className="text-[10px] font-bold uppercase tracking-wider text-[#331405]">Stage / Task</span>
            </div>
            {phases.map((group) => (
              <div key={group.phase} className="border-b border-[#e3d6c5]/60">
                <button
                  type="button"
                  onClick={() => togglePhase(group.phase)}
                  className="flex h-10 w-full items-center gap-2 bg-[#faf8f5] px-3 text-left"
                >
                  {collapsed[group.phase] ? <ChevronRight size={14} className="text-[#331405]" /> : <ChevronDown size={14} className="text-[#331405]" />}
                  <span className={`h-2 w-2 rounded-full ${PHASE_DOT[group.phase]}`} />
                  <span className="text-sm font-bold text-[#101010]">{PHASE_LABELS[group.phase] || group.phase}</span>
                  <span className="ml-auto text-[10px] font-bold text-[#331405]">{group.tasks.length}</span>
                </button>
                {!collapsed[group.phase] && group.tasks.map((task) => (
                  <button
                    key={task.id}
                    type="button"
                    onClick={() => setTaskEditor({ mode: "edit", column: task.status, task })}
                    className="flex h-10 w-full items-center gap-2 px-6 text-left hover:bg-[#f0ede4]"
                  >
                    <span className="truncate text-xs text-[#101010] flex items-center gap-1.5">
                      {task.title}
                      {!(task.clientVisible ?? true) && <Lock size={10} className="text-gray-400" title="Internal Only" />}
                    </span>
                  </button>
                ))}
              </div>
            ))}
          </div>

          <div className="flex-1 overflow-x-auto">
            <div style={{ minWidth: `${timelineWidth}px` }}>
              <div className="sticky top-0 flex h-11 border-b border-[#e3d6c5] bg-[#faf8f5]">
                {weeks.map((week, index) => (
                  <div
                    key={index}
                    style={{ width: `${colWidth}px` }}
                    className="flex shrink-0 items-center justify-center border-r border-[#e3d6c5]/60 text-[10px] font-bold uppercase text-[#331405]"
                  >
                    {week.label}
                  </div>
                ))}
              </div>

              <div className="relative">
                {showTodayLine && (
                  <div className="absolute top-0 bottom-0 z-10 w-px bg-red-400" style={{ left: `${toPct(TODAY)}%` }}>
                    <div className="absolute -left-1 -top-1 h-2 w-2 rounded-full bg-red-400" />
                  </div>
                )}
                {phases.map((group) => (
                  <div key={group.phase}>
                    <div className="h-10 border-b border-[#e3d6c5]/60 bg-[#faf8f5]" />
                    {!collapsed[group.phase] && group.tasks.map((task) => {
                      const left = toPct(task.start);
                      const width = Math.max(4, toPct(task.end) - left);
                      return (
                        <div key={task.id} className="relative h-10 border-b border-[#e3d6c5]/40">
                          <button
                            type="button"
                            onClick={() => setTaskEditor({ mode: "edit", column: task.status, task })}
                            style={{ left: `${left}%`, width: `${width}%` }}
                            className={`absolute top-1.5 flex h-7 min-w-[90px] items-center gap-2 rounded-lg border px-2.5 text-left shadow-sm transition-all hover:brightness-105 ${
                              STATUS_BAR_STYLE[task.status] || STATUS_BAR_STYLE.pending
                            }`}
                          >
                            <span className="truncate text-[11px] font-bold flex items-center gap-1">
                              {task.title}
                              {!(task.clientVisible ?? true) && <Lock size={10} className="text-gray-500/80" />}
                            </span>
                            <Avatar name={task.assignee} size="sm" />
                          </button>
                        </div>
                      );
                    })}
                  </div>
                ))}
              </div>
            </div>
          </div>
        </div>
      </div>

      {activeTask && (
        <SidePanel
          title={activeTask.title}
          subtitle={`${activeTask.status} - ${activeTask.project}`}
          onClose={() => setActiveTask(null)}
        >
          <div className="space-y-5">
            <div className="flex items-center gap-2">
              <Badge color={activeTask.priority === "High" ? "red" : activeTask.priority === "Medium" ? "orange" : "gray"}>
                {activeTask.priority} priority
              </Badge>
              <Badge color="gray">{formatRange(activeTask.start, activeTask.end)}</Badge>
            </div>
            <p className="text-sm leading-6 text-gray-600">{activeTask.description}</p>
            <div className="flex items-center gap-3 rounded-xl border border-gray-100 bg-gray-50 px-4 py-3">
              <Avatar name={activeTask.assignee} />
              <div>
                <p className="text-xs font-bold text-gray-950">Assignee</p>
                <p className="text-xs text-gray-500">{activeTask.assignee}</p>
              </div>
            </div>
            {activeTask.startDate && activeTask.endDate && (
              <div className="text-xs font-bold text-gray-500">
                Timeline: {activeTask.startDate} to {activeTask.endDate}
              </div>
            )}
            <div className="flex items-center gap-5 text-xs font-bold text-gray-500">
              <span className="inline-flex items-center gap-1.5"><CheckSquare size={13} /> {activeTask.subtasks} subtasks</span>
              <span className="inline-flex items-center gap-1.5"><MessageSquare size={13} /> {activeTask.comments} comments</span>
            </div>
            <div className="flex gap-2">
              <Button className="flex-1 justify-center" variant="secondary" onClick={() => {
                setTaskEditor({ mode: "edit", column: activeTask.status, task: activeTask });
                setActiveTask(null);
              }}>Edit Task</Button>
              <Button className="flex-1 justify-center" onClick={() => navigate("/admin/kanban")}>Open Kanban</Button>
            </div>
          </div>
        </SidePanel>
      )}

      {taskEditor && (
        <TaskEditorModal
          columns={PHASE_ORDER}
          initialColumn={taskEditor.column}
          task={taskEditor.task}
          mode={taskEditor.mode}
          onClose={() => setTaskEditor(null)}
          onSave={saveTask}
          onDelete={deleteTask}
        />
      )}
    </div>
  );
}

function TaskEditorModal({ columns, initialColumn, task, mode, onClose, onSave, onDelete }) {
  const [form, setForm] = useState(task);
  const [column, setColumn] = useState(initialColumn);
  const set = (key) => (value) => setForm((prev) => ({ ...prev, [key]: value }));

  function submit(event) {
    event.preventDefault();
    onSave(
      {
        ...form,
        title: form.title.trim() || "Untitled task",
        project: form.project.trim() || "General",
        assignee: (form.assignee || "A").slice(0, 1).toUpperCase(),
        subtasks: Number(form.subtasks) || 0,
        comments: Number(form.comments) || 0,
        clientVisible: form.clientVisible ?? true,
        internalNotes: form.internalNotes || ""
      },
      column
    );
  }

  return (
    <div className="fixed inset-0 z-50 grid place-items-center bg-gray-950/35 px-4">
      <form onSubmit={submit} className="w-full max-w-2xl rounded-2xl border border-gray-200 bg-[#f0ede4] shadow-2xl">
        <div className="flex items-center justify-between border-b border-gray-100 px-5 py-4">
          <div>
            <h2 className="text-sm font-bold text-gray-950">{mode === "create" ? "Create task" : "Edit task"}</h2>
            <p className="text-xs text-gray-400">Update task details, owner, priority, and timeline.</p>
          </div>
          <button type="button" onClick={onClose} className="rounded-lg px-2 py-1 text-xs font-bold text-gray-500 hover:bg-gray-100">Close</button>
        </div>

        <div className="grid gap-4 p-5 sm:grid-cols-2">
          <TaskField label="Task title" value={form.title} onChange={set("title")} className="sm:col-span-2" />
          <TaskField label="Project" value={form.project} onChange={set("project")} disabled />
          <label className="block">
            <span className="text-xs font-bold text-gray-600">Stage</span>
            <select value={column} onChange={(event) => setColumn(event.target.value)} className="mt-1.5 w-full rounded-xl border border-gray-200 px-3 py-2 text-sm outline-none focus:border-blue-300 focus:ring-4 focus:ring-blue-50">
              {columns.map((item) => <option key={item} value={item}>{PHASE_LABELS[item] || item}</option>)}
            </select>
          </label>
          <label className="block">
            <span className="text-xs font-bold text-gray-600">Priority</span>
            <select value={form.priority} onChange={(event) => set("priority")(event.target.value)} className="mt-1.5 w-full rounded-xl border border-gray-200 px-3 py-2 text-sm outline-none focus:border-blue-300 focus:ring-4 focus:ring-blue-50">
              {["High", "Medium", "Low"].map((item) => <option key={item} value={item}>{item}</option>)}
            </select>
          </label>
          <TaskField label="Assignee initial" value={form.assignee} onChange={set("assignee")} />
          <TaskField label="Start Date" type="date" value={form.startDate ? form.startDate.split("T")[0] : ""} onChange={set("startDate")} />
          <TaskField label="End Date" type="date" value={form.endDate ? form.endDate.split("T")[0] : ""} onChange={set("endDate")} />
          
          <div className="flex items-center gap-2 mt-2 mb-2 sm:col-span-2">
            <input
              type="checkbox"
              id="task-client-visible"
              checked={form.clientVisible ?? true}
              onChange={(e) => set("clientVisible")(e.target.checked)}
              className="rounded border-gray-300 text-blue-600 focus:ring-blue-500"
            />
            <label htmlFor="task-client-visible" className="text-xs font-bold text-gray-600 cursor-pointer selection:bg-transparent">
              Client Visible
            </label>
          </div>

          <TaskField label="Subtasks" type="number" value={form.subtasks} onChange={set("subtasks")} />
          <TaskField label="Comments" type="number" value={form.comments} onChange={set("comments")} />
          
          <label className="block sm:col-span-2">
            <span className="text-xs font-bold text-gray-600">Description (visible to client)</span>
            <textarea value={form.description} onChange={(event) => set("description")(event.target.value)} className="mt-1.5 min-h-24 w-full rounded-xl border border-gray-200 px-3 py-2 text-sm outline-none focus:border-blue-300 focus:ring-4 focus:ring-blue-50" />
          </label>
          
          <label className="block sm:col-span-2">
            <span className="text-xs font-bold text-gray-600">Internal Notes</span>
            <textarea value={form.internalNotes || ""} onChange={(event) => set("internalNotes")(event.target.value)} className="mt-1.5 min-h-24 w-full rounded-xl border border-gray-200 px-3 py-2 text-sm outline-none focus:border-blue-300 focus:ring-4 focus:ring-blue-50" />
          </label>
        </div>

        <div className="flex items-center justify-between border-t border-gray-100 p-4">
          {mode === "edit" ? (
            <button type="button" onClick={() => onDelete(task)} className="inline-flex items-center gap-2 rounded-xl px-3 py-2 text-xs font-bold text-red-600 hover:bg-red-50">
              <Trash2 size={14} />
              Delete
            </button>
          ) : <span />}
          <div className="flex gap-2">
            <Button type="button" variant="secondary" onClick={onClose}>Cancel</Button>
            <Button type="submit"><Save size={14} strokeWidth={2.5} /> Save task</Button>
          </div>
        </div>
      </form>
    </div>
  );
}

function TaskField({ label, value, onChange, placeholder = "", type = "text", className = "", disabled = false }) {
  return (
    <label className={`block ${className}`}>
      <span className="text-xs font-bold text-gray-600">{label}</span>
      <input
        type={type}
        value={value}
        onChange={(event) => onChange(event.target.value)}
        placeholder={placeholder}
        disabled={disabled}
        className="mt-1.5 w-full rounded-xl border border-gray-200 px-3 py-2 text-sm outline-none focus:border-blue-300 focus:ring-4 focus:ring-blue-50 disabled:bg-gray-100"
      />
    </label>
  );
}
