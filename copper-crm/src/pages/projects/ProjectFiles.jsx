import { useMemo, useState } from "react";
import { useNavigate, useParams } from "react-router-dom";
import {
  FolderPlus, FilePlus2, FileText, FileType, Image, Frame,
  Folder as FolderIcon, MoreHorizontal,
} from "lucide-react";
import { Avatar, Button } from "../../components/ui";
import { companies as fallbackCompanies, projects } from "../../data/mockData";
import { useCrmRecords } from "../../hooks/useCrmRecords";
import { useToast } from "../../components/useToast";
import ProjectHeader from "./ProjectHeader";

const FOLDER_DEFS = [
  { key: "Proposals", className: "bg-[#ffdbcc] text-[#331405]" },
  { key: "Contracts", className: "bg-[#eee1cf] text-[#665d50]" },
  { key: "Invoices", className: "bg-[#a2f0f2] text-[#026769]" },
  { key: "Deliverables", className: "bg-[#ffb693] text-[#6f381a]" },
  { key: "Internal", className: "bg-[#e3d6c5] text-[#331405]" },
];

const TYPE_META = {
  pdf: { icon: FileText, className: "bg-red-50 text-red-600", label: "PDF Document" },
  figma: { icon: Frame, className: "bg-purple-50 text-purple-600", label: "Figma Design" },
  doc: { icon: FileType, className: "bg-orange-50 text-orange-600", label: "Word Document" },
  image: { icon: Image, className: "bg-blue-50 text-blue-600", label: "Image File" },
};

function formatSize(mb) {
  return mb >= 1000 ? `${(mb / 1000).toFixed(1)} GB` : `${mb.toFixed(1)} MB`;
}

export default function ProjectFiles() {
  const { companyId, projectId } = useParams();
  const navigate = useNavigate();
  const { showToast } = useToast();
  const [activeFolder, setActiveFolder] = useState(null);
  const { records: companies } = useCrmRecords("companies", fallbackCompanies);

  const company = useMemo(() => companies.find((c) => String(c.id) === companyId), [companies, companyId]);
  const project = useMemo(
    () => projects.find((p) => String(p.id) === projectId && String(p.companyId) === companyId),
    [companyId, projectId]
  );

  const documents = useMemo(() => project?.documents || [], [project]);

  const folders = useMemo(() => FOLDER_DEFS.map((def) => {
    const docs = documents.filter((doc) => doc.category === def.key);
    return {
      ...def,
      count: docs.length,
      size: docs.reduce((sum, doc) => sum + doc.sizeMB, 0),
    };
  }), [documents]);

  const visibleDocuments = activeFolder ? documents.filter((doc) => doc.category === activeFolder) : documents;

  if (!company || !project) {
    return (
      <div className="rounded-2xl border border-[#e3d6c5] bg-[#e3d6c5] p-10 text-center">
        <p className="text-sm font-semibold text-[#331405]">We couldn't find that project for this company.</p>
        <Button variant="secondary" className="mt-4" onClick={() => navigate("/admin/companies")}>Back to Companies</Button>
      </div>
    );
  }

  function handleShare() {
    navigator.clipboard?.writeText(`${window.location.origin}/admin/companies/${company.id}/projects/${project.id}/files`);
    showToast({ title: "Link copied", message: "Project files link copied to clipboard." });
  }

  return (
    <div className="space-y-6">
      <ProjectHeader
        company={company}
        project={project}
        activeTab="Files"
        onShare={handleShare}
        onNewTask={() => navigate("/admin/kanban")}
      />

      <section>
        <div className="mb-5 flex flex-wrap items-center justify-between gap-3">
          <div>
            <h3 className="font-display text-lg font-semibold text-[#101010]">Directory</h3>
            <p className="mt-1 text-xs text-[#331405]">{documents.length} files across {folders.filter((f) => f.count > 0).length} folders</p>
          </div>
          <Button
            variant="primary"
            size="sm"
            onClick={() => showToast({ title: "Folder created", message: "New folder is ready for this project." })}
          >
            <FolderPlus size={14} /> New Folder
          </Button>
        </div>

        <div className="grid grid-cols-2 gap-4 sm:grid-cols-3 lg:grid-cols-6">
          {folders.map((folder) => (
            <button
              key={folder.key}
              type="button"
              onClick={() => setActiveFolder(activeFolder === folder.key ? null : folder.key)}
              className={`group cursor-pointer rounded-xl border p-5 text-left transition-all hover:-translate-y-0.5 hover:shadow-md ${
                activeFolder === folder.key ? "border-[#331405] bg-[#f0ede4] shadow-md" : "border-[#e3d6c5] bg-[#e3d6c5] hover:bg-[#f0ede4]"
              }`}
            >
              <div className={`mb-4 grid h-12 w-12 place-items-center rounded-lg ${folder.className}`}>
                <FolderIcon size={24} />
              </div>
              <h4 className="text-sm font-bold text-[#101010]">{folder.key}</h4>
              <p className="mt-1 text-[11px] text-[#331405]">{folder.count} items · {formatSize(folder.size)}</p>
            </button>
          ))}
          <button
            type="button"
            onClick={() => showToast({ title: "Folder created", message: "New folder is ready for this project." })}
            className="flex cursor-pointer flex-col items-center justify-center rounded-xl border-2 border-dashed border-[#e3d6c5] p-5 text-[#331405]/60 transition-all hover:border-[#331405]/50 hover:text-[#331405]"
          >
            <FolderPlus size={28} className="mb-2" />
            <h4 className="text-sm font-bold">New Folder</h4>
          </button>
        </div>
      </section>

      <section>
        <div className="mb-5 flex flex-wrap items-center justify-between gap-3">
          <h3 className="font-display text-lg font-semibold text-[#101010]">
            {activeFolder ? `${activeFolder} Documents` : "Recent Documents"}
          </h3>
          <div className="flex items-center gap-3">
            {activeFolder && (
              <button type="button" onClick={() => setActiveFolder(null)} className="text-xs font-bold text-[#331405] hover:underline">
                Clear filter
              </button>
            )}
            <Button
              variant="secondary"
              size="sm"
              onClick={() => showToast({ title: "Upload started", message: "Choose a file from your device to attach." })}
            >
              <FilePlus2 size={14} /> Upload File
            </Button>
          </div>
        </div>

        <div className="overflow-hidden rounded-2xl border border-[#e3d6c5] bg-[#e3d6c5] shadow-[0_18px_40px_rgba(79,39,16,0.06)]">
          {visibleDocuments.length ? (
            <table className="w-full border-collapse text-left">
              <thead>
                <tr className="border-b border-[#e3d6c5] bg-[#e3d6c5]">
                  <th className="px-6 py-4 text-[10px] font-bold uppercase tracking-wider text-[#331405]">Name</th>
                  <th className="px-6 py-4 text-[10px] font-bold uppercase tracking-wider text-[#331405]">Folder</th>
                  <th className="hidden px-6 py-4 text-[10px] font-bold uppercase tracking-wider text-[#331405] sm:table-cell">Upload Date</th>
                  <th className="hidden px-6 py-4 text-[10px] font-bold uppercase tracking-wider text-[#331405] md:table-cell">Uploaded By</th>
                  <th className="px-6 py-4 text-right text-[10px] font-bold uppercase tracking-wider text-[#331405]">Action</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-[#e3d6c5]">
                {visibleDocuments.map((doc, index) => {
                  const meta = TYPE_META[doc.type] || TYPE_META.doc;
                  const Icon = meta.icon;
                  return (
                    <tr key={index} className="transition-colors hover:bg-[#e3d6c5]/60">
                      <td className="px-6 py-5">
                        <div className="flex items-center gap-3">
                          <div className={`grid h-10 w-10 shrink-0 place-items-center rounded ${meta.className}`}>
                            <Icon size={18} />
                          </div>
                          <div className="min-w-0">
                            <p className="truncate text-sm font-semibold text-[#101010]">{doc.name}</p>
                            <p className="text-[11px] text-[#331405]">{formatSize(doc.sizeMB)}</p>
                          </div>
                        </div>
                      </td>
                      <td className="px-6 py-5 text-sm text-[#331405]">{doc.category}</td>
                      <td className="hidden px-6 py-5 text-sm text-[#331405] sm:table-cell">{doc.date}</td>
                      <td className="hidden px-6 py-5 md:table-cell">
                        <div className="flex items-center gap-2">
                          <Avatar name={doc.uploadedBy} size="sm" />
                          <span className="text-sm text-[#101010]">{doc.uploadedBy}</span>
                        </div>
                      </td>
                      <td className="px-6 py-5 text-right">
                        <button
                          type="button"
                          onClick={() => showToast({ type: "info", title: doc.name, message: `Uploaded by ${doc.uploadedBy} on ${doc.date}.` })}
                          className="text-[#331405] transition-colors hover:text-[#331405]"
                        >
                          <MoreHorizontal size={18} />
                        </button>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          ) : (
            <p className="p-10 text-center text-sm text-[#331405]">No documents in this folder yet.</p>
          )}
        </div>
      </section>
    </div>
  );
}
