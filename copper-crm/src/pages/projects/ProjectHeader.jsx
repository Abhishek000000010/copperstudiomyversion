import { Link } from "react-router-dom";
import { Plus, Share2, Calendar, Clock3, AlertCircle } from "lucide-react";
import { Badge, Button, Avatar } from "../../components/ui";
import Breadcrumb from "../../components/Breadcrumb";

const statusColor = {
  "Requirement Gathering": "gray",
  Design: "purple",
  Development: "orange",
  "In Progress": "teal",
  Review: "blue",
  Completed: "green",
};

const priorityPill = {
  urgent: { label: "Urgent", color: "red", icon: AlertCircle },
  upcoming: { label: "Due Soon", color: "orange", icon: Clock3 },
  "on-track": { label: "On Time", color: "teal", icon: Calendar },
};

function tabsFor(company, project) {
  const base = `/admin/companies/${company.id}/projects/${project.id}`;
  return [
    { label: "Overview", to: null },
    { label: "Timeline", to: base },
    { label: "Tasks", to: `${base}/tasks` },
    { label: "Invoices", to: null },
    { label: "Files", to: `${base}/files` },
    { label: "Internal Notes", to: null },
    { label: "Client Notes", to: null },
    { label: "History", to: null },
  ];
}

export default function ProjectHeader({ company, project, activeTab, onShare, onNewTask }) {
  const pill = priorityPill[project.priority] || priorityPill["on-track"];
  const tabs = tabsFor(company, project);

  return (
    <>
      <section className="flex flex-col gap-6 md:flex-row md:items-end md:justify-between">
        <div>
          <Breadcrumb
            items={[
              { label: "Companies", to: "/admin/companies" },
              { label: company.name, to: `/admin/companies/${company.id}` },
              { label: "Projects", to: `/admin/companies/${company.id}` },
              { label: project.name, to: null },
            ]}
          />
          <h2 className="font-display text-3xl font-semibold tracking-tight text-[#101010]">{project.name}</h2>
          <div className="mt-3 flex flex-wrap items-center gap-3">
            <Badge color={statusColor[project.status] || "gray"}>{project.status}</Badge>
            <Badge color={pill.color}>
              <pill.icon size={12} className="mr-1 inline" />{pill.label}
            </Badge>
            <div className="ml-1 flex -space-x-2">
              {project.team.slice(0, 3).map((member, index) => (
                <div key={index} className="rounded-full ring-2 ring-[#e3d6c5]">
                  <Avatar name={member} size="sm" />
                </div>
              ))}
              {project.team.length > 3 && (
                <div className="grid h-7 w-7 place-items-center rounded-full bg-[#331405] text-[10px] font-bold text-[#f0ede4] ring-2 ring-[#e3d6c5]">
                  +{project.team.length - 3}
                </div>
              )}
            </div>
          </div>
        </div>
        <div className="flex flex-wrap gap-3">
          <Button variant="secondary" size="lg" onClick={onShare}><Share2 size={15} /> Share Project</Button>
          <Button variant="primary" size="lg" onClick={onNewTask}><Plus size={15} /> New Task</Button>
        </div>
      </section>

      <div className="flex gap-7 overflow-x-auto border-b border-[#e3d6c5]">
        {tabs.map((tab) =>
          tab.to ? (
            <Link
              key={tab.label}
              to={tab.to}
              className={`whitespace-nowrap pb-3 text-xs font-bold ${
                tab.label === activeTab ? "border-b-2 border-[#331405] text-[#331405]" : "text-[#331405] hover:text-[#101010]"
              }`}
            >
              {tab.label}
            </Link>
          ) : (
            <button key={tab.label} type="button" className="whitespace-nowrap pb-3 text-xs font-bold text-[#331405] hover:text-[#101010]">
              {tab.label}
            </button>
          )
        )}
      </div>
    </>
  );
}
