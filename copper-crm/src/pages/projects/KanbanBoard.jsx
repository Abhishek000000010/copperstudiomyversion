import { useEffect, useMemo, useState, useCallback } from "react";
import { DragDropContext, Droppable, Draggable } from "@hello-pangea/dnd";
import {
  Plus, MoreHorizontal, Calendar, MessageSquare, CheckSquare,
  Edit3, GripVertical, Save, Sparkles, Trash2, ChevronDown,
  Layers, FolderOpen
} from "lucide-react";
import { Button } from "../../components/ui";
import { kanbanTasks as initialTasks } from "../../data/mockData";
import { useCrmRecords } from "../../hooks/useCrmRecords";
import { useToast } from "../../components/useToast";
import { adminApi } from "../../lib/clientApi";
import { useAuth } from "../../auth/useAuth";

/* ─── column styling ─────────────────────────────────────────────── */
const colConfig = {
  "Backlog":                { dot: "bg-gray-400",    ring: "ring-gray-200",   header: "bg-gray-50"   },
  "Requirement Gathering":  { dot: "bg-blue-500",    ring: "ring-blue-100",   header: "bg-blue-50"   },
  "Design":                 { dot: "bg-violet-500",  ring: "ring-violet-100", header: "bg-violet-50" },
  "Development":            { dot: "bg-amber-500",   ring: "ring-amber-100",  header: "bg-amber-50"  },
  "Testing":                { dot: "bg-yellow-500",  ring: "ring-yellow-100", header: "bg-yellow-50" },
  "Review":                 { dot: "bg-indigo-500",  ring: "ring-indigo-100", header: "bg-indigo-50" },
  "Completed":              { dot: "bg-emerald-500", ring: "ring-emerald-100",header: "bg-emerald-50"},
  // Stage-based statuses from project helper
  pending:                  { dot: "bg-gray-400",    ring: "ring-gray-200",   header: "bg-gray-50"   },
  in_progress:              { dot: "bg-amber-500",   ring: "ring-amber-100",  header: "bg-amber-50"  },
  delayed:                  { dot: "bg-red-500",     ring: "ring-red-100",    header: "bg-red-50"    },
  completed:                { dot: "bg-emerald-500", ring: "ring-emerald-100",header: "bg-emerald-50"},
};

const STAGE_LABEL = {
  pending:     "Pending",
  in_progress: "In Progress",
  delayed:     "Delayed",
  completed:   "Completed",
};

const priorityConfig = {
  High:   "bg-red-50 text-red-600 border-red-100",
  Medium: "bg-amber-50 text-amber-700 border-amber-100",
  Low:    "bg-gray-50 text-gray-500 border-gray-200",
};

const assigneeColor = ["bg-[#2563EB]", "bg-violet-500", "bg-emerald-500", "bg-amber-500", "bg-rose-500"];
function assigneeIdx(letter) { return (letter || "A").charCodeAt(0) % assigneeColor.length; }

/* ─── dnd helpers ────────────────────────────────────────────────── */
function reorder(list, startIndex, endIndex) {
  const result = Array.from(list);
  const [removed] = result.splice(startIndex, 1);
  result.splice(endIndex, 0, removed);
  return result;
}

function move(source, destination, droppableSource, droppableDestination) {
  const sourceClone = Array.from(source);
  const destClone = Array.from(destination);
  const [removed] = sourceClone.splice(droppableSource.index, 1);
  destClone.splice(droppableDestination.index, 0, removed);
  return {
    [droppableSource.droppableId]: sourceClone,
    [droppableDestination.droppableId]: destClone,
  };
}

/* ─── Project Switcher ───────────────────────────────────────────── */
function ProjectSwitcher({ projects, selectedId, onChange, loading }) {
  const [open, setOpen] = useState(false);
  const selected = projects.find((p) => p.id === selectedId);

  return (
    <div className="relative">
      <button
        type="button"
        onClick={() => setOpen((v) => !v)}
        className={`flex h-10 min-w-[220px] items-center gap-3 rounded-xl border px-4 text-sm font-semibold shadow-sm transition-all
          ${loading ? "opacity-60 cursor-wait" : "cursor-pointer hover:border-[#c57e5b]/50 hover:shadow"}
          ${open ? "border-[#c57e5b] ring-2 ring-[#c57e5b]/20 bg-[#f0ede4]" : "border-[#e3d6c5] bg-[#e3d6c5]"}`}
        disabled={loading}
      >
        <FolderOpen size={15} className="shrink-0 text-[#c57e5b]" />
        <span className="truncate text-[#101010]">
          {loading ? "Loading…" : selected ? selected.name : "Select a project"}
        </span>
        {selected && (
          <span className={`ml-1 rounded-full px-1.5 py-0.5 text-[9px] font-bold ${
            selected.status === "Completed" ? "bg-emerald-100 text-emerald-700" :
            selected.status === "In Progress" ? "bg-amber-100 text-amber-700" :
            "bg-gray-100 text-gray-500"}`}>
            {selected.status}
          </span>
        )}
        <ChevronDown size={14} className={`ml-auto shrink-0 text-[#331405] transition-transform ${open ? "rotate-180" : ""}`} />
      </button>

      {open && (
        <>
          <div className="fixed inset-0 z-30" onClick={() => setOpen(false)} />
          <div className="absolute left-0 top-[calc(100%+6px)] z-40 w-full min-w-[280px] overflow-hidden rounded-xl border border-[#e3d6c5] bg-[#f0ede4] shadow-xl">
            <div className="border-b border-[#e3d6c5] px-3 py-2">
              <p className="text-[10px] font-bold uppercase tracking-widest text-[#331405]">Switch Project</p>
            </div>
            <div className="max-h-64 overflow-y-auto py-1">
              {projects.length === 0 && (
                <p className="px-4 py-6 text-center text-xs text-gray-400">No projects found</p>
              )}
              {projects.map((proj) => (
                <button
                  key={proj.id}
                  type="button"
                  onClick={() => { onChange(proj.id); setOpen(false); }}
                  className={`flex w-full items-center gap-3 px-3 py-2.5 text-left transition-colors hover:bg-[#e3d6c5]
                    ${proj.id === selectedId ? "bg-[#e3d6c5] font-bold" : ""}`}
                >
                  <div className="grid h-7 w-7 shrink-0 place-items-center rounded-lg bg-[#e3d6c5] text-[10px] font-bold text-[#c57e5b]">
                    {proj.name.slice(0, 2).toUpperCase()}
                  </div>
                  <div className="min-w-0">
                    <p className="truncate text-xs font-semibold text-[#101010]">{proj.name}</p>
                    <p className="truncate text-[10px] text-[#331405]">{proj.client}</p>
                  </div>
                  <span className={`ml-auto shrink-0 rounded-full px-1.5 py-0.5 text-[9px] font-bold ${
                    proj.status === "Completed" ? "bg-emerald-100 text-emerald-700" :
                    proj.status === "In Progress" ? "bg-amber-100 text-amber-700" :
                    "bg-gray-100 text-gray-500"}`}>
                    {proj.taskCount} task{proj.taskCount !== 1 ? "s" : ""}
                  </span>
                </button>
              ))}
            </div>
          </div>
        </>
      )}
    </div>
  );
}

/* ─── Main KanbanBoard ───────────────────────────────────────────── */
export default function KanbanBoard() {
  const [columns, setColumns]       = useState(initialTasks);
  const [activeTaskId, setActiveTaskId] = useState("");
  const [taskEditor, setTaskEditor] = useState(null);
  const [projects, setProjects]     = useState([]);
  const [projectsLoading, setProjectsLoading] = useState(true);
  const [selectedProjectId, setSelectedProjectId] = useState(null);
  const { token } = useAuth();
  const { showToast } = useToast();

  const fallbackTasks = useMemo(
    () => Object.entries(initialTasks).flatMap(([status, tasks]) =>
      tasks.map((task) => ({ ...task, status }))),
    []
  );
  const { records: dbTasks, save: saveDbTask, remove: removeDbTask } = useCrmRecords("tasks", fallbackTasks);

  /* Fetch projects for the switcher */
  useEffect(() => {
    setProjectsLoading(true);
    adminApi.getProjects(token)
      .then((data) => {
        const mapped = data.map((p) => ({
          id: p._id,
          name: p.name,
          client: p.clientId?.company || p.clientId?.name || "Unknown",
          status: p.status === "completed" ? "Completed"
                : p.status === "in_progress" ? "In Progress"
                : p.status === "not_started" ? "Not Started"
                : "On Hold",
          taskCount: (p.stages || []).length,
        }));
        setProjects(mapped);
        // Auto-select first project
        if (mapped.length > 0) setSelectedProjectId(mapped[0].id);
      })
      .catch(() => {})
      .finally(() => setProjectsLoading(false));
  }, [token]);

  /* Filter tasks to only the selected project */
  const projectTasks = useMemo(() => {
    if (!selectedProjectId) return dbTasks;
    return dbTasks.filter(
      (t) => String(t.projectId) === String(selectedProjectId)
    );
  }, [dbTasks, selectedProjectId]);

  /* Rebuild columns whenever filtered tasks change */
  useEffect(() => {
    const nextColumns = Object.fromEntries(Object.keys(initialTasks).map((key) => [key, []]));
    projectTasks.forEach((task) => {
      const col = nextColumns[task.status] !== undefined ? task.status : "Backlog";
      nextColumns[col].push(task);
    });
    queueMicrotask(() => setColumns(nextColumns));
  }, [projectTasks]);

  const totals = useMemo(() => {
    const tasks = Object.values(columns).flat();
    return {
      total: tasks.length,
      done:  columns.Completed?.length || 0,
      high:  tasks.filter((t) => t.priority === "High").length,
    };
  }, [columns]);

  const selectedProject = projects.find((p) => p.id === selectedProjectId);

  /* ── dnd ── */
  function onDragStart(start) { setActiveTaskId(start.draggableId); }

  async function onDragEnd(result) {
    setActiveTaskId("");
    const { source, destination } = result;
    if (!destination) return;

    if (source.droppableId === destination.droppableId) {
      const reordered = reorder(columns[source.droppableId], source.index, destination.index);
      setColumns({ ...columns, [source.droppableId]: reordered });
      return;
    }

    const movedTask = columns[source.droppableId][source.index];
    setColumns({
      ...columns,
      ...move(columns[source.droppableId], columns[destination.droppableId], source, destination),
    });
    await saveDbTask({ ...movedTask, status: destination.droppableId });
  }

  /* ── task actions ── */
  function openNewTask(column = "Backlog") {
    setTaskEditor({
      mode: "create",
      column,
      task: {
        id: `t-${Date.now()}`,
        title: "",
        project: selectedProject?.name || "",
        projectId: selectedProjectId || "",
        priority: "Medium",
        assignee: "A",
        deadline: "",
        description: "",
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
      const savedTask = await saveDbTask({
        ...nextTask,
        status: nextColumn,
        projectId: nextTask.projectId || selectedProjectId || "",
      });
      setColumns((current) => {
        const cleaned = Object.fromEntries(
          Object.entries(current).map(([col, tasks]) => [
            col,
            tasks.filter((t) => t.id !== nextTask.id && t._id !== nextTask._id),
          ])
        );
        return {
          ...cleaned,
          [nextColumn]: [...(cleaned[nextColumn] || []), savedTask],
        };
      });
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
      setColumns((current) => Object.fromEntries(
        Object.entries(current).map(([col, tasks]) => [
          col,
          tasks.filter((item) => item.id !== task.id && item._id !== task._id),
        ])
      ));
      setTaskEditor(null);
      showToast({ title: "Task deleted", message: `${task.title || "Task"} removed.` });
    } catch (error) {
      showToast({ type: "error", title: "Could not delete task", message: error.message });
    }
  }

  return (
    <div className="flex h-full flex-col p-5 xl:p-6">
      {/* ─── Header ─── */}
      <div className="mb-5 flex shrink-0 flex-col gap-4">
        {/* Title row */}
        <div className="flex flex-col gap-2 sm:flex-row sm:items-center sm:justify-between">
          <div>
            <p className="text-xs font-bold uppercase tracking-[0.16em] text-gray-400">Delivery pipeline</p>
            <h1 className="mt-1 text-2xl font-bold tracking-tight text-gray-950">Kanban Board</h1>
          </div>
          <div className="flex items-center gap-2">
            <div className="hidden sm:inline-flex h-9 items-center gap-2 rounded-xl border border-blue-100 bg-blue-50 px-3 text-xs font-bold text-blue-700">
              <Sparkles size={13} />
              Drag tasks between stages
            </div>
            <Button className="h-9" onClick={() => openNewTask()}>
              <Plus size={13} strokeWidth={2.5} /> Add Task
            </Button>
          </div>
        </div>

        {/* Project switcher row */}
        <div className="flex flex-col gap-3 sm:flex-row sm:items-center">
          <ProjectSwitcher
            projects={projects}
            selectedId={selectedProjectId}
            onChange={setSelectedProjectId}
            loading={projectsLoading}
          />

          {selectedProject && (
            <div className="flex items-center gap-3 text-sm text-gray-500">
              <span className="h-4 w-px bg-gray-200" />
              <span className="flex items-center gap-1.5">
                <Layers size={13} className="text-gray-400" />
                <span className="font-semibold text-gray-700">{totals.total}</span> tasks
              </span>
              <span>·</span>
              <span>
                <span className="font-semibold text-emerald-600">{totals.done}</span> done
              </span>
              {totals.high > 0 && (
                <>
                  <span>·</span>
                  <span>
                    <span className="font-semibold text-red-600">{totals.high}</span> high priority
                  </span>
                </>
              )}
            </div>
          )}
        </div>

        {/* No project selected / empty state */}
        {!projectsLoading && projects.length === 0 && (
          <div className="rounded-xl border border-dashed border-[#e3d6c5] bg-[#e3d6c5] px-6 py-5 text-center text-sm text-[#331405]">
            No projects found. Create a project in Client Projects first.
          </div>
        )}
      </div>

      {/* ─── Empty state when no project selected ─── */}
      {!projectsLoading && !selectedProjectId && projects.length > 0 && (
        <div className="grid flex-1 place-items-center">
          <div className="text-center">
            <FolderOpen size={40} className="mx-auto mb-3 text-[#e3d6c5]" />
            <p className="text-sm font-semibold text-[#331405]">Select a project to view its tasks</p>
          </div>
        </div>
      )}

      {/* ─── Kanban Board ─── */}
      {selectedProjectId && (
        <DragDropContext onDragStart={onDragStart} onDragEnd={onDragEnd}>
          <div className="flex flex-1 gap-4 overflow-x-auto pb-4" style={{ minHeight: 0 }}>
            {Object.entries(columns).map(([col, tasks]) => {
              const cfg = colConfig[col] || colConfig.Backlog;
              const label = STAGE_LABEL[col] || col;
              return (
                <section
                  key={col}
                  className="flex w-[270px] shrink-0 flex-col rounded-2xl border border-gray-200 bg-[#f0ede4] shadow-sm shadow-gray-100/70"
                >
                  {/* Column header */}
                  <div className={`rounded-t-2xl border-b border-gray-100 px-3.5 py-3 ${cfg.header}`}>
                    <div className="flex items-center justify-between gap-2">
                      <div className="flex min-w-0 items-center gap-2">
                        <span className={`h-2.5 w-2.5 shrink-0 rounded-full ${cfg.dot}`} />
                        <h2 className="truncate text-sm font-bold text-gray-900">{label}</h2>
                        <span className="rounded-md bg-[#f0ede4]/80 px-1.5 py-0.5 text-[11px] font-bold text-gray-500">
                          {tasks.length}
                        </span>
                      </div>
                      <button
                        onClick={() => openNewTask(col)}
                        className="grid h-7 w-7 place-items-center rounded-lg text-gray-400 hover:bg-[#f0ede4] hover:text-gray-700"
                        title="Add task to this column"
                      >
                        <Plus size={14} />
                      </button>
                    </div>
                  </div>

                  {/* Droppable */}
                  <Droppable droppableId={col}>
                    {(provided, snapshot) => (
                      <div
                        ref={provided.innerRef}
                        {...provided.droppableProps}
                        className={`flex-1 overflow-y-auto p-2.5 transition-all duration-200 ${
                          snapshot.isDraggingOver
                            ? `bg-blue-50/70 ring-2 ring-inset ring-blue-200`
                            : "bg-[#f0ede4]"
                        }`}
                        style={{ minHeight: 180 }}
                      >
                        <div className="space-y-2.5">
                          {tasks.map((task, index) => {
                            const isDone = col === "Completed" || col === "completed";
                            const priority = priorityConfig[task.priority] || priorityConfig.Low;
                            return (
                              <Draggable key={task.id} draggableId={task.id} index={index}>
                                {(prov, snap) => (
                                  <article
                                    ref={prov.innerRef}
                                    {...prov.draggableProps}
                                    {...prov.dragHandleProps}
                                    className={`group/card cursor-grab rounded-xl border bg-[#f0ede4] shadow-sm transition-[box-shadow,transform,border-color] duration-200 active:cursor-grabbing ${
                                      snap.isDragging
                                        ? "border-blue-200 shadow-2xl shadow-blue-950/10"
                                        : activeTaskId
                                          ? "border-gray-200"
                                          : "border-gray-200 hover:-translate-y-0.5 hover:border-gray-300 hover:shadow-md"
                                    } ${isDone ? "opacity-80" : ""}`}
                                    style={{
                                      ...prov.draggableProps.style,
                                      transition: snap.isDropAnimating
                                        ? "transform 180ms cubic-bezier(.2,1,.2,1)"
                                        : prov.draggableProps.style?.transition,
                                    }}
                                  >
                                    <div className={`p-3 ${snap.isDragging ? "kanban-card-lift" : ""}`}>
                                      <div className="mb-2.5 flex items-start gap-2">
                                        <button
                                          type="button"
                                          className="mt-0.5 grid h-5 w-5 shrink-0 place-items-center rounded-md text-gray-300 group-hover/card:bg-gray-50 group-hover/card:text-gray-500"
                                          aria-label={`Drag ${task.title}`}
                                        >
                                          <GripVertical size={12} />
                                        </button>
                                        <div className="min-w-0 flex-1">
                                          <p className="truncate text-[10px] font-bold uppercase tracking-wide text-gray-400">
                                            {task.project || selectedProject?.name}
                                          </p>
                                          <h3 className={`mt-0.5 text-[13px] font-bold leading-snug ${isDone ? "text-gray-400 line-through" : "text-gray-900"}`}>
                                            {task.title}
                                          </h3>
                                        </div>
                                        <button
                                          type="button"
                                          onClick={(e) => { e.stopPropagation(); openEditTask(col, task); }}
                                          className="grid h-5 w-5 shrink-0 place-items-center rounded-md text-gray-300 opacity-0 hover:bg-gray-50 hover:text-gray-500 group-hover/card:opacity-100"
                                          title="Edit task"
                                        >
                                          <MoreHorizontal size={12} />
                                        </button>
                                      </div>

                                      {task.description && (
                                        <p className="mb-2.5 line-clamp-2 text-[11px] leading-4 text-gray-500">
                                          {task.description}
                                        </p>
                                      )}

                                      <div className="mb-2.5 flex items-center justify-between gap-2">
                                        <span className={`rounded-full border px-1.5 py-0.5 text-[10px] font-bold ${priority}`}>
                                          {task.priority}
                                        </span>
                                        {task.deadline && (
                                          <span className="inline-flex items-center gap-1 text-[10px] font-bold text-gray-400">
                                            <Calendar size={11} />
                                            {task.deadline}
                                          </span>
                                        )}
                                      </div>

                                      <div className="flex items-center justify-between border-t border-gray-100 pt-2.5">
                                        <div className="flex items-center gap-2.5 text-[10px] font-bold text-gray-400">
                                          <span className="inline-flex items-center gap-1">
                                            <CheckSquare size={11} /> {task.subtasks || 0}
                                          </span>
                                          <span className="inline-flex items-center gap-1">
                                            <MessageSquare size={11} /> {task.comments || 0}
                                          </span>
                                        </div>
                                        <div className="flex items-center gap-1.5">
                                          <button
                                            type="button"
                                            onClick={(e) => { e.stopPropagation(); openEditTask(col, task); }}
                                            className="grid h-6 w-6 place-items-center rounded-full text-gray-300 hover:bg-blue-50 hover:text-[#2563EB]"
                                            title="Edit task"
                                          >
                                            <Edit3 size={11} />
                                          </button>
                                          <div className={`grid h-6 w-6 place-items-center rounded-full text-[9px] font-bold text-[#f0ede4] ${assigneeColor[assigneeIdx(task.assignee)]}`}>
                                            {(task.assignee || "A").slice(0, 1).toUpperCase()}
                                          </div>
                                        </div>
                                      </div>
                                    </div>
                                  </article>
                                )}
                              </Draggable>
                            );
                          })}
                          {provided.placeholder}
                        </div>

                        {tasks.length === 0 && (
                          <div className="mt-1 grid h-24 place-items-center rounded-xl border border-dashed border-gray-200 bg-gray-50 text-xs font-bold text-gray-400">
                            Drop tasks here
                          </div>
                        )}
                      </div>
                    )}
                  </Droppable>
                </section>
              );
            })}
          </div>
        </DragDropContext>
      )}

      {/* ─── Task editor modal ─── */}
      {taskEditor && (
        <TaskEditorModal
          columns={Object.keys(columns)}
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

/* ─── Task editor modal ──────────────────────────────────────────── */
function TaskEditorModal({ columns, initialColumn, task, mode, onClose, onSave, onDelete }) {
  const [form, setForm] = useState(task);
  const [column, setColumn] = useState(initialColumn);
  const set = (key) => (value) => setForm((prev) => ({ ...prev, [key]: value }));

  function submit(event) {
    event.preventDefault();
    onSave(
      {
        ...form,
        title:    form.title.trim() || "Untitled task",
        project:  form.project.trim() || "General",
        assignee: (form.assignee || "A").slice(0, 1).toUpperCase(),
        subtasks: Number(form.subtasks) || 0,
        comments: Number(form.comments) || 0,
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
            <p className="text-xs text-gray-400">Update task details, owner, priority, and workflow stage.</p>
          </div>
          <button type="button" onClick={onClose} className="rounded-lg px-2 py-1 text-xs font-bold text-gray-500 hover:bg-gray-100">
            Close
          </button>
        </div>

        <div className="grid gap-4 p-5 sm:grid-cols-2">
          <TaskField label="Task title" value={form.title} onChange={set("title")} className="sm:col-span-2" />
          <TaskField label="Project" value={form.project} onChange={set("project")} disabled />
          <label className="block">
            <span className="text-xs font-bold text-gray-600">Stage</span>
            <select
              value={column}
              onChange={(e) => setColumn(e.target.value)}
              className="mt-1.5 w-full rounded-xl border border-gray-200 px-3 py-2 text-sm outline-none focus:border-blue-300 focus:ring-4 focus:ring-blue-50"
            >
              {columns.map((item) => (
                <option key={item} value={item}>{STAGE_LABEL[item] || item}</option>
              ))}
            </select>
          </label>
          <label className="block">
            <span className="text-xs font-bold text-gray-600">Priority</span>
            <select
              value={form.priority}
              onChange={(e) => set("priority")(e.target.value)}
              className="mt-1.5 w-full rounded-xl border border-gray-200 px-3 py-2 text-sm outline-none focus:border-blue-300 focus:ring-4 focus:ring-blue-50"
            >
              {["High", "Medium", "Low"].map((item) => <option key={item} value={item}>{item}</option>)}
            </select>
          </label>
          <TaskField label="Assignee initial" value={form.assignee} onChange={set("assignee")} />
          <TaskField label="Deadline" value={form.deadline} onChange={set("deadline")} placeholder="26 Jun" />
          <TaskField label="Subtasks" type="number" value={form.subtasks} onChange={set("subtasks")} />
          <TaskField label="Comments" type="number" value={form.comments} onChange={set("comments")} />
          <label className="block sm:col-span-2">
            <span className="text-xs font-bold text-gray-600">Description</span>
            <textarea
              value={form.description}
              onChange={(e) => set("description")(e.target.value)}
              className="mt-1.5 min-h-24 w-full rounded-xl border border-gray-200 px-3 py-2 text-sm outline-none focus:border-blue-300 focus:ring-4 focus:ring-blue-50"
            />
          </label>
        </div>

        <div className="flex items-center justify-between border-t border-gray-100 p-4">
          {mode === "edit" ? (
            <button
              type="button"
              onClick={() => onDelete(task)}
              className="inline-flex items-center gap-2 rounded-xl px-3 py-2 text-xs font-bold text-red-600 hover:bg-red-50"
            >
              <Trash2 size={14} /> Delete
            </button>
          ) : <span />}
          <div className="flex gap-2">
            <Button type="button" variant="secondary" onClick={onClose}>Cancel</Button>
            <Button type="submit"><Save size={14} /> Save task</Button>
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
        onChange={(e) => onChange(e.target.value)}
        placeholder={placeholder}
        disabled={disabled}
        className="mt-1.5 w-full rounded-xl border border-gray-200 px-3 py-2 text-sm outline-none focus:border-blue-300 focus:ring-4 focus:ring-blue-50 disabled:bg-gray-50 disabled:text-gray-400"
      />
    </label>
  );
}
