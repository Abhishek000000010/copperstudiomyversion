import { Calendar } from "lucide-react";
import { Link } from "react-router-dom";
import { Avatar, Badge } from "./ui";

const statusColor = {
  "Requirement Gathering": "gray",
  Design: "purple",
  Development: "orange",
  "In Progress": "teal",
  Review: "blue",
  Completed: "green",
};

export default function ProjectCard({ project, showClient = true }) {
  return (
    <Link
      to={`/admin/projects/${project.id}`}
      className="block rounded-2xl border border-[#e3d6c5] bg-white p-5 transition-all hover:-translate-y-0.5 hover:border-[#c57e5b] hover:shadow-md"
    >
      <div className="mb-3 flex items-start justify-between gap-3">
        <div>
          <p className="font-display text-sm font-bold text-[#101010]">{project.name}</p>
          {showClient && <p className="mt-0.5 text-xs text-[#331405]">{project.client}</p>}
        </div>
        <Badge color={statusColor[project.status] || "gray"}>{project.status}</Badge>
      </div>

      <div className="mb-4">
        <div className="mb-2 flex justify-between text-[11px] text-[#331405]">
          <span>Progress</span>
          <span className="font-bold text-[#101010]">{project.progress}%</span>
        </div>
        <div className="h-1.5 overflow-hidden rounded-full bg-[#e3d6c5]">
          <div className="h-full rounded-full bg-[#331405]" style={{ width: `${project.progress}%` }} />
        </div>
      </div>

      <div className="flex items-center justify-between">
        <div className="flex -space-x-1.5">
          {project.team.map((member, index) => (
            <div key={index} className="rounded-full ring-2 ring-[#e3d6c5]">
              <Avatar name={member} size="sm" />
            </div>
          ))}
        </div>
        <div className="flex items-center gap-1 text-[11px] text-[#331405]">
          <Calendar size={11} />
          {project.dueDate}
        </div>
      </div>
    </Link>
  );
}
