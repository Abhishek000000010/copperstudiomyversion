import { Fragment, useMemo } from "react";
import { useNavigate, useParams } from "react-router-dom";
import {
  ListChecks, Palette, Code2, FlaskConical, ClipboardCheck, Rocket, Zap,
  Paperclip, UploadCloud, CheckCircle2, MessageSquare, Send, Calendar,
} from "lucide-react";
import { Button, Card } from "../../components/ui";
import { companies as fallbackCompanies, projects, kanbanTasks } from "../../data/mockData";
import { useCrmRecords } from "../../hooks/useCrmRecords";
import { useToast } from "../../components/useToast";
import ProjectHeader from "./ProjectHeader";

const PHASES = [
  { key: "Requirement Gathering", label: "Requirement", icon: ListChecks },
  { key: "Design", label: "Design", icon: Palette },
  { key: "Development", label: "Development", icon: Code2 },
  { key: "Testing", label: "Testing", icon: FlaskConical },
  { key: "Review", label: "Review", icon: ClipboardCheck },
  { key: "Completed", label: "Deployment", icon: Rocket },
];

const activityIcon = { upload: UploadCloud, check: CheckCircle2, comment: MessageSquare };

// Single source of truth for the roadmap node size so the connector track can
// center on it via flexbox instead of a hardcoded pixel offset.
const PHASE_NODE_SIZE = "h-12 w-12 sm:h-14 sm:w-14";
const PHASE_NODE_HEIGHT = "h-12 sm:h-14";

function getPhaseIndex(project) {
  const direct = PHASES.findIndex((phase) => phase.key === project.status);
  if (direct !== -1) return direct;
  if (project.progress >= 95) return 5;
  if (project.progress >= 75) return 4;
  if (project.progress >= 50) return 3;
  if (project.progress >= 25) return 2;
  if (project.progress >= 10) return 1;
  return 0;
}

function formatINR(value) {
  return `₹${Number(value || 0).toLocaleString("en-IN")}`;
}

export default function ProjectDetail() {
  const { companyId, projectId } = useParams();
  const navigate = useNavigate();
  const { showToast } = useToast();
  const { records: companies } = useCrmRecords("companies", fallbackCompanies);

  const company = useMemo(() => companies.find((c) => String(c.id) === companyId), [companies, companyId]);
  const project = useMemo(
    () => projects.find((p) => String(p.id) === projectId && String(p.companyId) === companyId),
    [companyId, projectId]
  );

  const focusTask = useMemo(() => {
    if (!project) return null;
    const allTasks = Object.entries(kanbanTasks).flatMap(([status, list]) =>
      list.map((task) => ({ ...task, status }))
    );
    const projectTasks = allTasks.filter((task) => task.project === project.name && task.status !== "Completed");
    return [...projectTasks].sort((a) => (a.priority === "High" ? -1 : 1))[0];
  }, [project]);

  if (!company || !project) {
    return (
      <div className="rounded-2xl border border-[#e3d6c5] bg-[#e3d6c5] p-10 text-center">
        <p className="text-sm font-semibold text-[#331405]">We couldn't find that project for this company.</p>
        <Button variant="secondary" className="mt-4" onClick={() => navigate("/admin/companies")}>Back to Companies</Button>
      </div>
    );
  }

  const phaseIndex = getPhaseIndex(project);
  const budgetPct = Math.min(100, Math.round((project.budgetUsed / project.budget) * 100));

  function handleShare() {
    navigator.clipboard?.writeText(`${window.location.origin}/admin/companies/${company.id}/projects/${project.id}`);
    showToast({ title: "Link copied", message: "Project workspace link copied to clipboard." });
  }

  return (
    <div className="space-y-6">
      <ProjectHeader
        company={company}
        project={project}
        activeTab="Timeline"
        onShare={handleShare}
        onNewTask={() => navigate("/admin/kanban")}
      />

      <section className="grid grid-cols-12 gap-5">
        <div className="col-span-12 space-y-5 lg:col-span-7 xl:col-span-8">
          <Card className="p-5 sm:p-7 shadow-[0_18px_40px_rgba(79,39,16,0.06)]">
            <div className="mb-8 flex flex-wrap items-center justify-between gap-2">
              <h3 className="font-display text-lg font-semibold text-[#101010]">Phase Roadmap</h3>
              <span className="inline-flex items-center gap-2 text-xs font-semibold text-[#331405]">
                <span className="h-2 w-2 rounded-full bg-[#331405]" />
                Current: {PHASES[phaseIndex].label}
              </span>
            </div>
            <div className="flex items-center overflow-x-auto pb-1">
              {PHASES.map((phase, index) => {
                const Icon = phase.icon;
                const isDone = index < phaseIndex;
                const isCurrent = index === phaseIndex;
                const isLast = index === PHASES.length - 1;
                return (
                  <Fragment key={phase.key}>
                    <div className={`flex w-16 sm:w-20 shrink-0 flex-col items-center gap-3 text-center ${index > phaseIndex ? "opacity-45" : ""}`}>
                      <div className={`relative flex ${PHASE_NODE_SIZE} items-center justify-center`}>
                        {isCurrent ? (
                          <>
                            <div className={`grid ${PHASE_NODE_SIZE} place-items-center rounded-full border-4 border-[#331405] bg-[#e3d6c5] text-xs font-extrabold text-[#331405]`}>
                              {project.progress}%
                            </div>
                            <div className="absolute -right-1 -top-1 grid h-5 w-5 place-items-center rounded-full border-2 border-[#e3d6c5] bg-[#026769]">
                              <Zap size={11} className="text-[#f0ede4]" />
                            </div>
                          </>
                        ) : (
                          <div className={`grid ${PHASE_NODE_SIZE} place-items-center rounded-full ${isDone ? "bg-[#331405] text-[#f0ede4] shadow-lg shadow-[#331405]/25" : "bg-[#e3d6c5] text-[#331405]"}`}>
                            <Icon size={20} />
                          </div>
                        )}
                      </div>
                      <div>
                        <p className={`text-xs sm:text-sm font-bold ${isCurrent ? "text-[#331405]" : "text-[#101010]"}`}>{phase.label}</p>
                        <p className={`text-[9px] sm:text-[10px] font-bold uppercase tracking-wide ${isCurrent ? "text-[#026769]" : "text-[#331405]"}`}>
                          {isDone ? "Completed" : isCurrent ? "Current" : "Upcoming"}
                        </p>
                      </div>
                    </div>
                    {!isLast && (
                      <div className={`flex ${PHASE_NODE_HEIGHT} min-w-[16px] flex-1 items-center`}>
                        <div className={`h-[2px] w-full ${index < phaseIndex ? "bg-[#331405]" : "bg-[#e3d6c5]"}`} />
                      </div>
                    )}
                  </Fragment>
                );
              })}
            </div>
          </Card>

          <div className="grid gap-5 sm:grid-cols-2">
            <Card className="relative overflow-hidden p-6 shadow-[0_18px_40px_rgba(79,39,16,0.06)]">
              <p className="mb-3 text-[11px] font-bold uppercase tracking-[0.14em] text-[#331405]">Critical Focus</p>
              {focusTask ? (
                <>
                  <h4 className="font-display mb-2 text-lg font-semibold text-[#101010]">{focusTask.title}</h4>
                  <p className="mb-5 text-sm leading-5 text-[#331405]">{focusTask.description}</p>
                  <div className="flex items-center justify-between">
                    <span className="inline-flex items-center gap-1.5 text-xs font-semibold text-[#331405]">
                      <Paperclip size={13} /> {focusTask.subtasks} subtasks
                    </span>
                    <button type="button" onClick={() => navigate("/admin/kanban")} className="text-xs font-bold text-[#331405] hover:underline">
                      View Task
                    </button>
                  </div>
                </>
              ) : (
                <p className="text-sm text-[#331405]">No active tasks for this project yet. Add one from the Kanban board.</p>
              )}
            </Card>
            <div className="flex flex-col justify-between rounded-2xl border border-[#e3d6c5] bg-[#f0ede4] p-6 shadow-[0_18px_40px_rgba(79,39,16,0.06)]">
              <div>
                <p className="mb-3 text-[11px] font-bold uppercase tracking-[0.14em] text-[#331405]">Internal Notes Snapshot</p>
                <p className="text-sm italic leading-5 text-[#101010]">
                  &ldquo;{project.note?.text || "No internal notes logged for this project yet."}&rdquo;
                </p>
                {project.note && <p className="mt-3 text-right text-[10px] text-[#331405]">— {project.note.author}</p>}
              </div>
              <Button variant="secondary" className="mt-6 w-full justify-center" onClick={() => navigate(`/admin/companies/${company.id}/projects/${project.id}/files`)}>
                Open Client Workspace
              </Button>
            </div>
          </div>
        </div>

        <div className="col-span-12 space-y-5 lg:col-span-5 xl:col-span-4">
          <Card className="p-6 shadow-[0_18px_40px_rgba(79,39,16,0.06)]">
            <h3 className="font-display mb-5 text-lg font-semibold text-[#101010]">Project Metadata</h3>
            <div className="space-y-5">
              <MetaRow icon={Calendar} label="Start Date" value={project.startDate} />
              <MetaRow icon={Calendar} label="Expected Completion" value={project.dueDate} />
              <MetaRow icon={ListChecks} label="Package Purchased" value={project.packagePurchased} />
              <div className="border-t border-[#e3d6c5] pt-5">
                <div className="mb-2 flex items-center justify-between text-xs font-bold text-[#331405]">
                  <span>Budget Usage</span>
                  <span className="text-[#101010]">{formatINR(project.budgetUsed)} / {formatINR(project.budget)}</span>
                </div>
                <div className="h-1.5 overflow-hidden rounded-full bg-[#e3d6c5]">
                  <div className="h-full rounded-full bg-[#331405]" style={{ width: `${budgetPct}%` }} />
                </div>
              </div>
            </div>
          </Card>

          <Card className="p-6 shadow-[0_18px_40px_rgba(79,39,16,0.06)]">
            <h3 className="font-display mb-5 text-lg font-semibold text-[#101010]">Activity</h3>
            <div className="space-y-5">
              {project.activity?.length ? project.activity.map((item, index) => {
                const Icon = activityIcon[item.icon] || CheckCircle2;
                return (
                  <div key={index} className="flex gap-3">
                    <div className="grid h-8 w-8 shrink-0 place-items-center rounded-full bg-[#e3d6c5] text-[#331405]">
                      <Icon size={14} />
                    </div>
                    <div>
                      <p className="text-sm text-[#101010]">{item.text}</p>
                      <p className="text-[10px] uppercase text-[#7b6f63]">{item.time}</p>
                    </div>
                  </div>
                );
              }) : <p className="text-sm text-[#331405]">No activity recorded yet.</p>}
            </div>
          </Card>

          <InviteCollaborators client={company.name} />
        </div>
      </section>
    </div>
  );
}

function InviteCollaborators({ client }) {
  const { showToast } = useToast();

  function handleInvite(event) {
    event.preventDefault();
    const email = event.target.elements.email.value.trim();
    if (!email) return;
    showToast({ title: "Invite sent", message: `${email} can now access this project dashboard.` });
    event.target.reset();
  }

  return (
    <div className="rounded-2xl border border-[#6f381a] bg-[#331405] p-6 text-[#f0ede4] shadow-[0_18px_40px_rgba(79,39,16,0.06)]">
      <h4 className="font-display mb-2 text-lg font-semibold">Invite Collaborators</h4>
      <p className="mb-4 text-sm text-[#f0ede4]/85">Grant the {client} team access to the real-time project dashboard.</p>
      <form onSubmit={handleInvite} className="flex items-center gap-2">
        <input
          name="email"
          type="email"
          placeholder="Email address"
          className="flex-1 rounded-lg border border-white/20 bg-[#f0ede4]/10 px-3 py-2 text-xs placeholder:text-[#f0ede4]/60 outline-none focus:ring-1 focus:ring-white"
        />
        <button type="submit" className="grid h-9 w-9 shrink-0 place-items-center rounded-lg bg-[#f0ede4] text-[#331405] transition-transform hover:scale-105">
          <Send size={15} />
        </button>
      </form>
    </div>
  );
}

function MetaRow({ icon: Icon, label, value }) {
  return (
    <div className="flex items-center gap-4">
      <div className="grid h-10 w-10 shrink-0 place-items-center rounded-lg bg-[#e3d6c5] text-[#331405]">
        <Icon size={17} />
      </div>
      <div>
        <p className="text-[10px] font-bold uppercase tracking-wide text-[#7b6f63]">{label}</p>
        <p className="text-sm font-bold text-[#101010]">{value}</p>
      </div>
    </div>
  );
}
