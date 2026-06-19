import { useMemo, useState, useEffect } from "react";
import { useNavigate, useParams } from "react-router-dom";
import {
  Building2, Calendar, ChevronRight, Edit2, FileText, FolderOpen,
  Globe, Info, Link2, Mail, MoreVertical, Phone,
  Plus, Save, StickyNote, Target, Share2, Users, X, Package
} from "lucide-react";
import { Avatar, Button, StatusBadge } from "../../components/ui";
import { companies as fallbackCompanies, contacts as fallbackContacts } from "../../data/mockData";
import { useCrmRecords } from "../../hooks/useCrmRecords";
import { useToast } from "../../components/useToast";
import { useAuth } from "../../auth/useAuth";
import { adminApi } from "../../lib/clientApi";

const TABS = ["Overview", "Packages", "Projects", "Users"];

function KpiChip({ label, value, icon: Icon }) {
  return (
    <div className="bg-[#f0ede4] rounded-xl border border-[#e5e7eb] px-5 py-4 flex items-center gap-4 shadow-[0_1px_2px_rgba(0,0,0,0.04)]">
      <div className="h-9 w-9 shrink-0 rounded-lg bg-[#f3f4f6] flex items-center justify-center">
        <Icon size={16} className="text-[#6b7280]" />
      </div>
      <div>
        <p className="text-xs text-[#6b7280] font-medium">{label}</p>
        <p className="text-base font-bold text-[#111827] mt-0.5">{value}</p>
      </div>
    </div>
  );
}

function OverviewTab({ company, companyContacts, rawContacts, totalRevenue, totalPackages }) {
  return (
    <div className="space-y-6">
      {/* KPI Cards */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        <KpiChip label="Total Users" value={companyContacts.length} icon={Users} />
        <KpiChip label="Total Packages" value={totalPackages} icon={Package} />
        <KpiChip label="Total Revenue" value={`₹${(totalRevenue || 0).toLocaleString("en-IN")}`} icon={Target} />
        <KpiChip label="Projects" value={[...new Set(rawContacts.map(c => c.projectName).filter(Boolean))].length} icon={FileText} />
      </div>

      {/* Users Summary */}
      <div className="bg-[#f0ede4] rounded-xl border border-[#e5e7eb] shadow-[0_1px_2px_rgba(0,0,0,0.04)]">
        <div className="px-5 py-4 border-b border-[#f3f4f6] flex items-center justify-between">
          <h4 className="text-sm font-bold text-[#111827]">Users ({companyContacts.length})</h4>
        </div>
        {companyContacts.length ? (
          <div className="divide-y divide-[#f9fafb]">
            {companyContacts.map((c) => (
              <div key={c.email || c.name} className="px-5 py-3.5 flex items-center gap-3">
                <Avatar name={c.name} size="md" />
                <div className="flex-1 min-w-0">
                  <p className="text-sm font-semibold text-[#111827] truncate">{c.name}</p>
                  <div className="flex items-center gap-3 mt-0.5 text-[11px] text-[#9ca3af]">
                    <span className="flex items-center gap-1"><Mail size={10} />{c.email}</span>
                    {c.phone && <span className="flex items-center gap-1"><Phone size={10} />{c.phone}</span>}
                  </div>
                </div>
                <span className="text-[11px] font-semibold bg-[#331405]/10 text-[#331405] px-2.5 py-1 rounded-full">
                  {c.packages?.length || 0} package{(c.packages?.length || 0) !== 1 ? "s" : ""}
                </span>
              </div>
            ))}
          </div>
        ) : (
          <div className="px-5 py-8 text-center text-sm text-[#9ca3af]">No users found.</div>
        )}
      </div>

      {/* All Packages */}
      <div className="bg-[#f0ede4] rounded-xl border border-[#e5e7eb] shadow-[0_1px_2px_rgba(0,0,0,0.04)]">
        <div className="px-5 py-4 border-b border-[#f3f4f6] flex items-center justify-between">
          <h4 className="text-sm font-bold text-[#111827]">Packages Bought ({totalPackages})</h4>
          <span className="text-xs font-bold text-emerald-600 bg-emerald-50 px-2.5 py-1 rounded-full">
            ₹{(totalRevenue || 0).toLocaleString("en-IN")} revenue
          </span>
        </div>
        {rawContacts.filter(c => c.package?.name).length ? (
          <table className="min-w-full">
            <thead>
              <tr className="border-b border-[#f3f4f6] bg-[#fafafa]">
                <th className="px-5 py-3 text-left text-xs font-semibold text-[#6b7280] uppercase tracking-wider">Bought By</th>
                <th className="px-5 py-3 text-left text-xs font-semibold text-[#6b7280] uppercase tracking-wider">Package Name</th>
                <th className="px-5 py-3 text-left text-xs font-semibold text-[#6b7280] uppercase tracking-wider">Project Name</th>
                <th className="px-5 py-3 text-left text-xs font-semibold text-[#6b7280] uppercase tracking-wider">Amount</th>
                <th className="px-5 py-3 text-left text-xs font-semibold text-[#6b7280] uppercase tracking-wider">Status</th>
              </tr>
            </thead>
            <tbody>
              {rawContacts.filter(c => c.package?.name).map((c, i) => (
                <tr key={c._id || i} className="border-b border-[#f9fafb] hover:bg-[#fafafa] transition-colors">
                  <td className="px-5 py-3.5">
                    <div className="flex items-center gap-2.5">
                      <Avatar name={c.name} size="sm" />
                      <div>
                        <p className="text-sm font-medium text-[#111827]">{c.name}</p>
                        <p className="text-[11px] text-[#9ca3af]">{c.email}</p>
                      </div>
                    </div>
                  </td>
                  <td className="px-5 py-3.5">
                    <span className="text-sm font-semibold text-[#c57e5b]">{c.package.name}</span>
                  </td>
                  <td className="px-5 py-3.5 text-sm text-[#374151]">{c.projectName || "—"}</td>
                  <td className="px-5 py-3.5 text-sm font-bold text-[#111827]">₹{(Number(c.package.total) || Number(c.package.price) || 0).toLocaleString("en-IN")}</td>
                  <td className="px-5 py-3.5">
                    <span className={`text-[11px] font-semibold px-2 py-0.5 rounded-full ${
                      c.payment?.status === "paid" ? "bg-emerald-50 text-emerald-600" : "bg-amber-50 text-amber-600"
                    }`}>
                      {c.payment?.status === "paid" ? "Paid" : "Pending"}
                    </span>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        ) : (
          <div className="px-5 py-8 text-center text-sm text-[#9ca3af]">No packages bought yet.</div>
        )}
      </div>

      {/* Projects from checkout */}
      <div className="bg-[#f0ede4] rounded-xl border border-[#e5e7eb] shadow-[0_1px_2px_rgba(0,0,0,0.04)]">
        <div className="px-5 py-4 border-b border-[#f3f4f6]">
          <h4 className="text-sm font-bold text-[#111827]">Projects</h4>
        </div>
        {(() => {
          const projectNames = [...new Set(rawContacts.map(c => c.projectName).filter(Boolean))];
          return projectNames.length ? (
            <div className="divide-y divide-[#f9fafb]">
              {projectNames.map((pName) => {
                const related = rawContacts.filter(c => c.projectName === pName);
                const projectRevenue = related.reduce((s, c) => s + (Number(c.package?.total) || Number(c.package?.price) || 0), 0);
                return (
                  <div key={pName} className="px-5 py-3.5 flex items-center gap-3">
                    <div className="h-9 w-9 shrink-0 rounded-lg bg-[#331405]/10 flex items-center justify-center">
                      <FolderOpen size={16} className="text-[#331405]" />
                    </div>
                    <div className="flex-1 min-w-0">
                      <p className="text-sm font-semibold text-[#111827] truncate">{pName}</p>
                      <p className="text-[11px] text-[#9ca3af]">
                        {related.length} package{related.length !== 1 ? "s" : ""} · ₹{projectRevenue.toLocaleString("en-IN")}
                      </p>
                    </div>
                  </div>
                );
              })}
            </div>
          ) : (
            <div className="px-5 py-8 text-center text-sm text-[#9ca3af]">No projects found.</div>
          );
        })()}
      </div>
    </div>
  );
}

function ContactsTab({ companyContacts }) {
  return (
    <div>
      <div className="flex items-center justify-between mb-4">
        <div className="flex h-9 items-center gap-2 rounded-lg border border-[#e5e7eb] bg-[#f9fafb] px-3 w-72">
          <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="#9ca3af" strokeWidth="2"><circle cx="11" cy="11" r="8"/><path d="m21 21-4.35-4.35"/></svg>
          <input className="bg-transparent text-sm outline-none placeholder:text-[#9ca3af] w-full" placeholder="Search by contact, email, or phone..." />
        </div>
        <div className="flex items-center gap-2">
          <button className="flex h-9 items-center gap-1.5 rounded-lg border border-[#e5e7eb] bg-[#f0ede4] px-3 text-sm font-medium text-[#374151] hover:bg-[#f9fafb]">
            <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><polygon points="22 3 2 3 10 12.46 10 19 14 21 14 12.46 22 3"/></svg>
            Filter
          </button>
          <button className="flex h-9 items-center gap-1.5 rounded-lg bg-[#331405] px-3 text-sm font-semibold text-[#f0ede4] hover:bg-[#6f381a]">
            <Plus size={14} /> Add Contact
          </button>
        </div>
      </div>
      <div className="bg-[#f0ede4] rounded-xl border border-[#e5e7eb] shadow-[0_1px_2px_rgba(0,0,0,0.04)] overflow-hidden">
        <table className="min-w-full">
          <thead>
            <tr className="border-b border-[#f3f4f6] bg-[#fafafa]">
              <th className="px-5 py-3 text-left text-xs font-semibold text-[#6b7280] uppercase tracking-wider">
                <div className="flex items-center gap-1.5"><Mail size={11} />Contact Name</div>
              </th>
              <th className="px-5 py-3 text-left text-xs font-semibold text-[#6b7280] uppercase tracking-wider">
                <div className="flex items-center gap-1.5"><Mail size={11} />Email</div>
              </th>
              <th className="px-5 py-3 text-left text-xs font-semibold text-[#6b7280] uppercase tracking-wider">
                <div className="flex items-center gap-1.5"><Phone size={11} />Phone Number</div>
              </th>
              <th className="px-5 py-3 text-left text-xs font-semibold text-[#6b7280] uppercase tracking-wider">
                <div className="flex items-center gap-1.5"><Target size={11} />Package Bought</div>
              </th>
            </tr>
          </thead>
          <tbody>
            {companyContacts.length ? companyContacts.map((c) => (
              <tr key={c.id} className="border-b border-[#f9fafb] hover:bg-[#fafafa] transition-colors">
                <td className="px-5 py-3.5">
                  <div className="flex items-center gap-3">
                    <Avatar name={c.name} size="sm" />
                    <span className="text-sm font-medium text-[#111827]">{c.name}</span>
                  </div>
                </td>
                <td className="px-5 py-3.5 text-sm text-[#374151]">{c.email || "—"}</td>
                <td className="px-5 py-3.5 text-sm text-[#374151]">{c.phone || "—"}</td>
                <td className="px-5 py-3.5 text-sm font-medium text-[#c57e5b]">
                  {c.packages?.length > 0 ? c.packages.join(", ") : (c.package?.name || "—")}
                </td>
              </tr>
            )) : (
              Array.from({ length: 5 }).map((_, i) => (
                <tr key={i} className="border-b border-[#f9fafb]">
                  <td className="px-5 py-3.5 text-sm text-[#374151]">First Name Last Name</td>
                  <td className="px-5 py-3.5 text-sm text-[#374151]">abccompany@gmail.com</td>
                  <td className="px-5 py-3.5 text-sm text-[#374151]">+91 1234567890</td>
                  <td className="px-5 py-3.5 text-sm text-[#374151]">—</td>
                </tr>
              ))
            )}
          </tbody>
        </table>
        <div className="flex items-center justify-between px-5 py-3 border-t border-[#f3f4f6]">
          <p className="text-xs text-[#6b7280]">Showing <span className="font-semibold text-[#111827]">{companyContacts.length || 8}</span> Contacts</p>
          <div className="flex items-center gap-1">
            <button className="h-7 w-7 flex items-center justify-center rounded border border-[#e5e7eb] text-[#6b7280] hover:bg-[#f9fafb]"><svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><polyline points="15 18 9 12 15 6"/></svg></button>
            <button className="h-7 w-7 flex items-center justify-center rounded bg-[#331405] text-[#f0ede4] text-xs font-bold">1</button>
            <button className="h-7 w-7 flex items-center justify-center rounded border border-[#e5e7eb] text-[#374151] text-xs hover:bg-[#f9fafb]">2</button>
            <button className="h-7 w-7 flex items-center justify-center rounded border border-[#e5e7eb] text-[#6b7280] hover:bg-[#f9fafb]"><svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><polyline points="9 18 15 12 9 6"/></svg></button>
          </div>
        </div>
      </div>
    </div>
  );
}

function PackagesTab({ rawContacts }) {
  const packaged = rawContacts.filter(c => c.package?.name);
  return (
    <div>
      <div className="flex items-center justify-between mb-4">
        <p className="text-sm text-[#6b7280]">Showing <span className="font-semibold text-[#111827]">{packaged.length}</span> packages</p>
      </div>
      <div className="bg-[#f0ede4] rounded-xl border border-[#e5e7eb] shadow-[0_1px_2px_rgba(0,0,0,0.04)] overflow-hidden">
        <table className="min-w-full">
          <thead>
            <tr className="border-b border-[#f3f4f6] bg-[#fafafa]">
              <th className="px-5 py-3 text-left text-xs font-semibold text-[#6b7280] uppercase tracking-wider">Bought By</th>
              <th className="px-5 py-3 text-left text-xs font-semibold text-[#6b7280] uppercase tracking-wider">Package</th>
              <th className="px-5 py-3 text-left text-xs font-semibold text-[#6b7280] uppercase tracking-wider">Project</th>
              <th className="px-5 py-3 text-left text-xs font-semibold text-[#6b7280] uppercase tracking-wider">Amount</th>
              <th className="px-5 py-3 text-left text-xs font-semibold text-[#6b7280] uppercase tracking-wider">Payment</th>
              <th className="px-5 py-3 text-left text-xs font-semibold text-[#6b7280] uppercase tracking-wider">Date</th>
            </tr>
          </thead>
          <tbody>
            {packaged.length ? packaged.map((c, i) => (
              <tr key={c._id || i} className="border-b border-[#f9fafb] hover:bg-[#fafafa] transition-colors">
                <td className="px-5 py-3.5">
                  <div className="flex items-center gap-2.5">
                    <Avatar name={c.name} size="sm" />
                    <div>
                      <p className="text-sm font-medium text-[#111827]">{c.name}</p>
                      <p className="text-[11px] text-[#9ca3af]">{c.email}</p>
                    </div>
                  </div>
                </td>
                <td className="px-5 py-3.5 text-sm font-semibold text-[#c57e5b]">{c.package.name}</td>
                <td className="px-5 py-3.5 text-sm text-[#374151]">{c.projectName || "—"}</td>
                <td className="px-5 py-3.5 text-sm font-bold text-[#111827]">₹{(Number(c.package.total) || Number(c.package.price) || 0).toLocaleString("en-IN")}</td>
                <td className="px-5 py-3.5">
                  <span className={`text-[11px] font-semibold px-2 py-0.5 rounded-full ${
                    c.payment?.status === "paid" ? "bg-emerald-50 text-emerald-600" : "bg-amber-50 text-amber-600"
                  }`}>
                    {c.payment?.status === "paid" ? "Paid" : "Pending"}
                  </span>
                </td>
                <td className="px-5 py-3.5 text-[11px] text-[#9ca3af]">{c.createdAt ? new Date(c.createdAt).toLocaleDateString() : "—"}</td>
              </tr>
            )) : (
              <tr><td colSpan="6" className="px-5 py-8 text-center text-sm text-[#9ca3af]">No packages bought yet.</td></tr>
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
}

function ProjectsTab({ rawContacts }) {
  const projectNames = [...new Set(rawContacts.map(c => c.projectName).filter(Boolean))];
  return (
    <div>
      <div className="flex items-center justify-between mb-4">
        <p className="text-sm text-[#6b7280]">Showing <span className="font-semibold text-[#111827]">{projectNames.length}</span> projects</p>
      </div>
      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
        {projectNames.length ? projectNames.map((pName) => {
          const related = rawContacts.filter(c => c.projectName === pName);
          const revenue = related.reduce((s, c) => s + (Number(c.package?.total) || Number(c.package?.price) || 0), 0);
          const buyer = related[0];
          return (
            <div key={pName} className="bg-[#f0ede4] rounded-xl border border-[#e5e7eb] p-5 shadow-[0_1px_2px_rgba(0,0,0,0.04)]">
              <div className="flex items-center gap-3 mb-3">
                <div className="h-10 w-10 shrink-0 rounded-lg bg-[#331405]/10 flex items-center justify-center">
                  <FolderOpen size={18} className="text-[#331405]" />
                </div>
                <div className="min-w-0 flex-1">
                  <p className="text-sm font-bold text-[#111827] truncate">{pName}</p>
                  <p className="text-[11px] text-[#9ca3af]">{buyer?.name || "Unknown"}</p>
                </div>
              </div>
              <div className="flex items-center justify-between">
                <span className="text-xs text-[#6b7280]">{related.length} package{related.length !== 1 ? "s" : ""}</span>
                <span className="text-sm font-bold text-[#111827]">₹{revenue.toLocaleString("en-IN")}</span>
              </div>
              <div className="mt-2 flex flex-wrap gap-1.5">
                {related.filter(c => c.package?.name).map((c, i) => (
                  <span key={i} className="text-[10px] font-semibold bg-[#331405]/10 text-[#331405] px-2 py-0.5 rounded-full">
                    {c.package.name}
                  </span>
                ))}
              </div>
            </div>
          );
        }) : (
          <div className="col-span-full bg-[#f0ede4] rounded-xl border border-[#e5e7eb] p-12 text-center shadow-[0_1px_2px_rgba(0,0,0,0.04)]">
            <p className="text-sm text-[#9ca3af]">No projects found.</p>
          </div>
        )}
      </div>
    </div>
  );
}

function UsersTab({ companyContacts }) {
  return (
    <div>
      <div className="flex items-center justify-between mb-4">
        <p className="text-sm text-[#6b7280]">Showing <span className="font-semibold text-[#111827]">{companyContacts.length}</span> users</p>
      </div>
      <div className="bg-[#f0ede4] rounded-xl border border-[#e5e7eb] shadow-[0_1px_2px_rgba(0,0,0,0.04)] overflow-hidden">
        <table className="min-w-full">
          <thead>
            <tr className="border-b border-[#f3f4f6] bg-[#fafafa]">
              <th className="px-5 py-3 text-left text-xs font-semibold text-[#6b7280] uppercase tracking-wider">
                <div className="flex items-center gap-1.5"><Users size={11} />Name</div>
              </th>
              <th className="px-5 py-3 text-left text-xs font-semibold text-[#6b7280] uppercase tracking-wider">
                <div className="flex items-center gap-1.5"><Mail size={11} />Email</div>
              </th>
              <th className="px-5 py-3 text-left text-xs font-semibold text-[#6b7280] uppercase tracking-wider">
                <div className="flex items-center gap-1.5"><Phone size={11} />Phone</div>
              </th>
              <th className="px-5 py-3 text-left text-xs font-semibold text-[#6b7280] uppercase tracking-wider">
                <div className="flex items-center gap-1.5"><Package size={11} />Packages</div>
              </th>
            </tr>
          </thead>
          <tbody>
            {companyContacts.length ? companyContacts.map((c) => (
              <tr key={c.email || c.name} className="border-b border-[#f9fafb] hover:bg-[#fafafa] transition-colors">
                <td className="px-5 py-3.5">
                  <div className="flex items-center gap-3">
                    <Avatar name={c.name} size="sm" />
                    <span className="text-sm font-medium text-[#111827]">{c.name}</span>
                  </div>
                </td>
                <td className="px-5 py-3.5 text-sm text-[#374151]">{c.email || "—"}</td>
                <td className="px-5 py-3.5 text-sm text-[#374151]">{c.phone || "—"}</td>
                <td className="px-5 py-3.5 text-sm font-medium text-[#c57e5b]">
                  {c.packages?.length > 0 ? c.packages.join(", ") : "—"}
                </td>
              </tr>
            )) : (
              <tr><td colSpan="4" className="px-5 py-8 text-center text-sm text-[#9ca3af]">No users found.</td></tr>
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
}

const EMPTY_ARRAY = [];

export default function CompanyDetail() {
  const { companyId } = useParams();
  const navigate = useNavigate();
  const { showToast } = useToast();
  const [activeTab, setActiveTab] = useState("Overview");
  const { records: companies, loading: loadingCompanies } = useCrmRecords("companies", fallbackCompanies);
  const { records: contacts, loading: loadingContacts } = useCrmRecords("contacts", fallbackContacts);
  const { records: tasks, loading: loadingTasks } = useCrmRecords("tasks", EMPTY_ARRAY);

  const { token } = useAuth();
  const [allProjects, setAllProjects] = useState([]);
  const [allMeetings, setAllMeetings] = useState([]);
  const [loadingExtras, setLoadingExtras] = useState(true);

  // Fetch true admin projects and meetings
  useEffect(() => {
    Promise.all([
      adminApi.getProjects(token).catch(() => []),
      adminApi.getMeetings(token).catch(() => [])
    ]).then(([projRes, meetRes]) => {
      setAllProjects(Array.isArray(projRes) ? projRes : []);
      setAllMeetings(Array.isArray(meetRes) ? meetRes : []);
    }).catch(err => {
      console.error(err);
    }).finally(() => {
      setLoadingExtras(false);
    });
  }, [token]);

  const company = useMemo(() => companies.find((c) => String(c.id) === companyId || String(c._id) === companyId), [companies, companyId]);
  
  const companyProjects = useMemo(() => {
    if (!company) return [];
    return allProjects.filter((p) => p.clientId?.company === company.name);
  }, [allProjects, company]);

  const companyMeetings = useMemo(() => {
    if (!company) return [];
    return allMeetings.filter((m) => m.clientId?.company === company.name);
  }, [allMeetings, company]);

  const companyTasks = useMemo(() => {
    if (!company) return [];
    return tasks.filter((t) => t.company === company.name);
  }, [tasks, company]);
  const rawContacts = useMemo(() => {
    if (!company) return [];
    return contacts.filter((c) => c.company === company.name);
  }, [company, contacts]);

  const companyContacts = useMemo(() => {
    // Group by email to get unique users
    const uniqueContacts = new Map();
    rawContacts.forEach(c => {
      const email = c.email || c.name;
      if (!uniqueContacts.has(email)) {
        uniqueContacts.set(email, { ...c, packages: c.package?.name ? [c.package.name] : [] });
      } else {
        const existing = uniqueContacts.get(email);
        if (c.package?.name && !existing.packages.includes(c.package.name)) {
          existing.packages.push(c.package.name);
        }
      }
    });
    return Array.from(uniqueContacts.values());
  }, [rawContacts]);

  const totalPackages = rawContacts.filter(c => c.package?.name).length;
  const totalRevenue = rawContacts.reduce((s, c) => s + (Number(c.package?.total) || Number(c.package?.price) || 0), 0);

  if ((loadingCompanies || loadingContacts) && !company) {
    return (
      <div className="m-6 rounded-xl border border-[#e5e7eb] bg-[#f0ede4] p-12 text-center">
        <p className="text-sm font-semibold text-[#6b7280]">Loading...</p>
      </div>
    );
  }

  if (!company) {
    return (
      <div className="m-6 rounded-xl border border-[#e5e7eb] bg-[#f0ede4] p-12 text-center">
        <p className="text-sm font-semibold text-[#6b7280]">Company not found.</p>
        <button onClick={() => navigate("/admin/companies")} className="mt-4 text-sm font-semibold text-[#331405] hover:underline">
          ← Back to Companies
        </button>
      </div>
    );
  }


  return (
    <div className="flex flex-col min-h-full">
      {/* Company Hero */}
      <div className="bg-[#f0ede4] border-b border-[#e5e7eb]">
        <div className="px-6 py-5">
          <div className="flex items-start justify-between gap-4">
            <div className="flex items-center gap-4">
              <div className="h-12 w-12 shrink-0 rounded-full bg-[#f3f4f6] border border-[#e5e7eb] flex items-center justify-center">
                <Building2 size={20} className="text-[#9ca3af]" />
              </div>
              <div>
                <h2 className="text-lg font-bold text-[#111827]">{company.name}</h2>
                <p className="text-sm text-[#6b7280]">{company.industry}</p>
              </div>
            </div>
            <div className="flex items-center gap-2">
              <button className="h-8 w-8 flex items-center justify-center rounded-lg border border-[#e5e7eb] text-[#9ca3af] hover:bg-[#f9fafb]"><Info size={14} /></button>
              <button className="h-8 w-8 flex items-center justify-center rounded-lg border border-[#e5e7eb] text-[#9ca3af] hover:bg-[#f9fafb]"><Share2 size={14} /></button>
              <button className="h-8 w-8 flex items-center justify-center rounded-lg border border-[#e5e7eb] text-[#9ca3af] hover:bg-[#f9fafb]"><Link2 size={14} /></button>
              <button className="h-8 w-8 flex items-center justify-center rounded-lg border border-[#e5e7eb] text-[#9ca3af] hover:bg-[#f9fafb]"><Globe size={14} /></button>
              <button className="flex h-8 items-center gap-1.5 rounded-lg border border-[#e5e7eb] bg-[#f0ede4] px-3 text-sm font-medium text-[#374151] hover:bg-[#f9fafb]">
                <Edit2 size={12} /> Edit
              </button>
              <button
                onClick={() => showToast({ title: "Coming soon", message: "New entry creation is on the roadmap." })}
                className="flex h-8 items-center gap-1.5 rounded-lg bg-[#331405] px-3 text-sm font-semibold text-[#f0ede4] hover:bg-[#6f381a]"
              >
                New Entry <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><polyline points="6 9 12 15 18 9"/></svg>
              </button>
            </div>
          </div>
        </div>

        {/* KPI chips */}
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 px-6 pb-4">
          <KpiChip label="Total Revenue" value={`₹${totalRevenue.toLocaleString("en-IN")}`} icon={Target} />
          <KpiChip label="Total Users" value={companyContacts.length} icon={Users} />
          <KpiChip label="Packages Bought" value={totalPackages} icon={Package} />
          <KpiChip label="Projects" value={[...new Set(rawContacts.map(c => c.projectName).filter(Boolean))].length} icon={FileText} />
        </div>

        {/* Tabs */}
        <div className="px-6 flex items-center gap-1 overflow-x-auto">
          {TABS.map((tab) => (
            <button
              key={tab}
              onClick={() => setActiveTab(tab)}
              className={`px-4 py-3 text-sm font-semibold whitespace-nowrap border-b-2 transition-colors ${
                activeTab === tab
                  ? "border-[#331405] text-[#331405]"
                  : "border-transparent text-[#6b7280] hover:text-[#374151]"
              }`}
            >
              {tab}
            </button>
          ))}
          <button className="ml-auto p-2 text-[#9ca3af] hover:text-[#374151]">
            <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><line x1="4" y1="6" x2="20" y2="6"/><line x1="4" y1="12" x2="20" y2="12"/><line x1="4" y1="18" x2="20" y2="18"/></svg>
          </button>
        </div>
      </div>

      {/* Tab content */}
      <div className="flex-1 p-6">
        {activeTab === "Overview" && (
          <OverviewTab
            company={company}
            companyContacts={companyContacts}
            rawContacts={rawContacts}
            totalRevenue={totalRevenue}
            totalPackages={totalPackages}
          />
        )}
        {activeTab === "Packages" && <PackagesTab rawContacts={rawContacts} />}
        {activeTab === "Projects" && <ProjectsTab rawContacts={rawContacts} />}
        {activeTab === "Users" && <UsersTab companyContacts={companyContacts} />}
      </div>
    </div>
  );
}
