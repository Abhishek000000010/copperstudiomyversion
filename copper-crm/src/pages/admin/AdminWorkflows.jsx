import { useState } from "react";
import { useNavigate } from "react-router-dom";
import {
  BellRing, Building2, Calendar, CheckCircle2, CreditCard, Edit3, Eye,
  FileText, Globe2, LayoutGrid, List, LockKeyhole, Mail, MoreHorizontal,
  MoreVertical, Phone, Plus, Save, Search, Send,
  Settings as SettingsIcon, SlidersHorizontal, Target,
  Trash2, TrendingUp, UploadCloud, User, UserPlus, Workflow
} from "lucide-react";
import { Button, StatusBadge, Avatar } from "../../components/ui";
import { invoices, leads, orders, projects } from "../../data/mockData";
import { useCrmRecords } from "../../hooks/useCrmRecords";
import { useToast } from "../../components/useToast";
import SidePanel from "../../components/SidePanel";

function PageShell({ title, subtitle, action, children }) {
  return (
    <div className="p-5 xl:p-6">
      <div className="mb-5 flex flex-col gap-3 lg:flex-row lg:items-end lg:justify-between">
        <div>
          <p className="text-xs font-bold uppercase tracking-[0.16em] text-gray-400">SuperAdmin workflow</p>
          <h1 className="mt-1 text-2xl font-bold tracking-tight text-gray-950">{title}</h1>
          <p className="mt-1 text-sm text-gray-500">{subtitle}</p>
        </div>
        {action}
      </div>
      {children}
    </div>
  );
}

function Card({ children, className = "" }) {
  return <section className={`rounded-xl border border-gray-200 bg-[#f0ede4] shadow-sm shadow-gray-100/60 ${className}`}>{children}</section>;
}

function SearchBar({ value, onChange, placeholder = "Search..." }) {
  return (
    <div className="flex h-10 items-center gap-2 rounded-xl border border-gray-200 bg-gray-50 px-3 focus-within:border-blue-300 focus-within:bg-[#f0ede4] focus-within:ring-4 focus-within:ring-blue-50">
      <Search size={14} className="text-gray-400" />
      <input value={value} onChange={(event) => onChange(event.target.value)} placeholder={placeholder} className="w-full bg-transparent text-sm outline-none placeholder:text-gray-400" />
    </div>
  );
}

function Field({ label, value, onChange, placeholder, type = "text" }) {
  return (
    <label className="block">
      <span className="text-xs font-bold text-gray-600">{label}</span>
      <input
        type={type}
        value={value}
        onChange={(event) => onChange(event.target.value)}
        placeholder={placeholder}
        className="mt-1.5 w-full rounded-xl border border-gray-200 px-3 py-2 text-sm outline-none focus:border-blue-300 focus:ring-4 focus:ring-blue-50"
      />
    </label>
  );
}

const dealSeed = Object.values(leads).flat().filter((lead) => ["Qualified", "Proposal Sent", "Negotiation", "Won"].includes(lead.stage || ""));
const dealsSeed = [
  { id: "D-101", name: "Retail app redesign", account: "Zara India", owner: "Meera Kapoor", value: "Rs 89,999", stage: "Negotiation", probability: 72, close: "20 Jun 2026" },
  { id: "D-102", name: "Enterprise dashboard", account: "LogiTrack", owner: "Vikram Nair", value: "Rs 1,19,999", stage: "Proposal Sent", probability: 55, close: "24 Jun 2026" },
  { id: "D-103", name: "SaaS dashboard UI", account: "CloudStack", owner: "Dev Malhotra", value: "Rs 89,999", stage: "Qualified", probability: 48, close: "28 Jun 2026" },
  { id: "D-104", name: "E-commerce platform", account: "ShopNow", owner: "Aditya Roy", value: "Rs 49,999", stage: "Won", probability: 100, close: "12 Jun 2026" },
  ...dealSeed.slice(0, 2).map((lead, index) => ({
    id: `D-20${index + 1}`,
    name: lead.service,
    account: lead.company,
    owner: lead.name,
    value: lead.value.replace("₹", "Rs "),
    stage: "Qualified",
    probability: 44 + index * 8,
    close: "30 Jun 2026"
  }))
];

const DEAL_STAGES = ["Onboarding", "Need Analysis", "Proposal Sent", "Negotiation", "Won", "Lost"];
const DEAL_KPI = [
  { icon: Target, label: "Pipeline Summary", value: "₹2,93,898", change: "+12% Last week", positive: true },
  { icon: TrendingUp, label: "Deals Won", value: "₹1,80,374", change: "+12% Last week", positive: true },
  { icon: User, label: "Average Deal Size", value: "182", change: "+12% Last week", positive: true },
  { icon: FileText, label: "Deals Lost", value: "₹43,000", change: "-12% Last week", positive: false },
];

function StagePill({ status = "Accepted" }) {
  const map = {
    Accepted: "bg-blue-50 text-blue-600",
    Won: "bg-green-50 text-green-600",
    Lost: "bg-red-50 text-red-600",
    Negotiation: "bg-yellow-50 text-yellow-600",
    "Proposal Sent": "bg-purple-50 text-purple-600",
    Qualified: "bg-blue-50 text-blue-600",
    Onboarding: "bg-teal-50 text-teal-600",
    "Need Analysis": "bg-orange-50 text-orange-600",
  };
  return <span className={`inline-block rounded-full px-2.5 py-0.5 text-[11px] font-semibold ${map[status] ?? "bg-gray-100 text-gray-600"}`}>{status}</span>;
}

export function DealsPage() {
  const navigate = useNavigate();
  const [query, setQuery] = useState("");
  const [view, setView] = useState("list");
  const [page, setPage] = useState(1);
  const [selected, setSelected] = useState(null);
  const { records: dealRecords, save: saveDeal } = useCrmRecords("deals", dealsSeed);
  const { showToast } = useToast();
  const PAGE_SIZE = 10;

  const deals = dealRecords.filter((d) => `${d.name} ${d.account} ${d.owner}`.toLowerCase().includes(query.toLowerCase()));
  const totalPages = Math.max(1, Math.ceil(deals.length / PAGE_SIZE));
  const paginated = deals.slice((page - 1) * PAGE_SIZE, page * PAGE_SIZE);

  async function persistDeal(deal) {
    try {
      const isNew = !deal._id;
      await saveDeal({ ...deal, id: deal.id || `D-${Date.now().toString().slice(-6)}`, probability: Number(deal.probability) || 0 });
      setSelected(null);
      showToast({ title: isNew ? "Deal created" : "Deal updated", message: `${deal.name || "Deal"} saved successfully.` });
    } catch (error) {
      showToast({ type: "error", title: "Could not save deal", message: error.message });
    }
  }

  return (
    <div className="p-5 xl:p-6 bg-[#f9fafb] min-h-full">
      <div className="mb-4 flex items-center justify-between">
        <div>
          <h1 className="text-xl font-bold text-gray-900">Deals</h1>
          <p className="text-sm text-gray-500">Manage your sales pipeline</p>
        </div>
        <div className="flex items-center gap-2">
          <div className="flex h-9 items-center gap-1.5 rounded-lg border border-gray-200 bg-[#f0ede4] px-2.5 text-xs text-gray-500">
            <Search size={12} />
            <input className="w-44 bg-transparent outline-none placeholder:text-gray-400 text-xs" placeholder="Search by deal name, company, or status..." value={query} onChange={(e) => { setQuery(e.target.value); setPage(1); }} />
          </div>
          <button className="flex h-9 w-9 items-center justify-center rounded-lg border border-gray-200 text-gray-400 hover:bg-gray-50"><MoreVertical size={14} /></button>
          <button className="flex h-9 w-9 items-center justify-center rounded-lg border border-gray-200 text-gray-400 hover:bg-gray-50"><SlidersHorizontal size={14} /></button>
          <button onClick={() => setView("list")} className={`flex h-9 w-9 items-center justify-center rounded-lg border transition-colors ${view === "list" ? "border-[#2563EB] bg-blue-50 text-[#2563EB]" : "border-gray-200 text-gray-400 hover:bg-gray-50"}`}><List size={14} /></button>
          <button onClick={() => setView("kanban")} className={`flex h-9 w-9 items-center justify-center rounded-lg border transition-colors ${view === "kanban" ? "border-[#2563EB] bg-blue-50 text-[#2563EB]" : "border-gray-200 text-gray-400 hover:bg-gray-50"}`}><LayoutGrid size={14} /></button>
          <button onClick={() => setSelected({ name: "", account: "", owner: "", value: "", stage: "Qualified", probability: 50, close: "" })} className="flex h-9 items-center gap-1.5 rounded-lg bg-[#2563EB] px-3 text-xs font-semibold text-[#f0ede4] hover:bg-blue-600">
            <Plus size={14} /> Add Deal
          </button>
        </div>
      </div>

      <div className="mb-4 grid grid-cols-4 gap-4">
        {DEAL_KPI.map(({ icon: Icon, label, value, change, positive }) => (
          <div key={label} className="flex items-center gap-3 rounded-xl border border-gray-200 bg-[#f0ede4] p-4 shadow-sm">
            <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-blue-50 text-blue-500"><Icon size={18} /></div>
            <div>
              <p className="text-xs text-gray-400">{label}</p>
              <p className="text-lg font-bold text-gray-900">{value}</p>
              <p className={`text-[11px] font-semibold ${positive ? "text-green-500" : "text-red-500"}`}>{positive ? "▲" : "▼"} {change}</p>
            </div>
          </div>
        ))}
      </div>

      {view === "list" ? (
        <div className="rounded-xl border border-gray-200 bg-[#f0ede4] shadow-sm">
          <div className="overflow-x-auto">
            <table className="w-full min-w-[850px]">
              <thead>
                <tr className="bg-gray-50/70">
                  {["Deal ID", "Deal Name", "Company", "Contact", "Stage", "Amount", "Due Date", "Actions"].map((h) => (
                    <th key={h} className="px-4 py-3 text-left text-[11px] font-bold uppercase tracking-wider text-gray-400">{h}</th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {paginated.map((deal) => (
                  <tr key={deal._id || deal.id} className="border-t border-gray-100 hover:bg-gray-50/60">
                    <td className="px-4 py-3 text-xs font-mono text-gray-500">{deal.id}</td>
                    <td className="px-4 py-3 text-sm font-semibold text-gray-900">{deal.name}</td>
                    <td className="px-4 py-3 text-sm text-gray-600">{deal.account}</td>
                    <td className="px-4 py-3 text-sm text-gray-600">{deal.owner}</td>
                    <td className="px-4 py-3"><StagePill status={deal.stage} /></td>
                    <td className="px-4 py-3 text-sm font-semibold text-gray-900">{deal.value}</td>
                    <td className="px-4 py-3 text-sm text-gray-500">{deal.close}</td>
                    <td className="px-4 py-3">
                      <div className="flex items-center gap-2">
                        <button onClick={() => navigate(`/admin/deals/${deal._id || deal.id}`)} className="text-gray-400 hover:text-blue-500"><Eye size={15} /></button>
                        <button onClick={() => setSelected(deal)} className="text-gray-400 hover:text-blue-500"><Edit3 size={14} /></button>
                        <button className="text-gray-400 hover:text-red-500"><Trash2 size={14} /></button>
                      </div>
                    </td>
                  </tr>
                ))}
                {paginated.length === 0 && (
                  <tr><td colSpan={8} className="py-12 text-center text-sm text-gray-400">No deals found</td></tr>
                )}
              </tbody>
            </table>
          </div>
          <div className="flex items-center justify-between border-t border-gray-100 px-5 py-3">
            <span className="text-xs text-gray-500">Showing {Math.min((page - 1) * PAGE_SIZE + 1, deals.length)}–{Math.min(page * PAGE_SIZE, deals.length)} of {deals.length} Deals</span>
            <div className="flex items-center gap-1">
              <button disabled={page <= 1} onClick={() => setPage(p => p - 1)} className="flex h-7 w-7 items-center justify-center rounded-lg border border-gray-200 text-xs text-gray-500 disabled:opacity-40 hover:bg-gray-50">‹</button>
              {Array.from({ length: totalPages }, (_, i) => i + 1).map((p) => (
                <button key={p} onClick={() => setPage(p)} className={`flex h-7 w-7 items-center justify-center rounded-lg border text-xs font-semibold ${p === page ? "border-[#2563EB] bg-[#2563EB] text-[#f0ede4]" : "border-gray-200 text-gray-500 hover:bg-gray-50"}`}>{p}</button>
              ))}
              <button disabled={page >= totalPages} onClick={() => setPage(p => p + 1)} className="flex h-7 w-7 items-center justify-center rounded-lg border border-gray-200 text-xs text-gray-500 disabled:opacity-40 hover:bg-gray-50">›</button>
            </div>
          </div>
        </div>
      ) : (
        <div className="overflow-x-auto">
          <div className="flex gap-4 min-w-[900px]">
            {DEAL_STAGES.map((stage) => {
              const stageDeals = deals.filter((d) => (d.stage || "Onboarding") === stage);
              const isLost = stage === "Lost";
              const isWon = stage === "Won";
              return (
                <div key={stage} className={`flex-1 min-w-[200px] rounded-xl border p-3 ${isLost ? "bg-red-50/40 border-red-100" : isWon ? "bg-green-50/40 border-green-100" : "bg-gray-50/60 border-gray-200"}`}>
                  <div className="mb-3 flex items-center justify-between">
                    <span className="text-sm font-semibold text-gray-700">{stage} <span className="ml-1 text-gray-400">{stageDeals.length}</span></span>
                    <button className="text-gray-400"><MoreVertical size={14} /></button>
                  </div>
                  <div className="space-y-2">
                    {stageDeals.map((d) => (
                      <div key={d._id || d.id} className={`rounded-xl border bg-[#f0ede4] p-3 shadow-sm ${isLost ? "border-red-100" : isWon ? "border-green-100" : "border-gray-200"}`}>
                        <div className="mb-2 flex items-center justify-between">
                          <p className={`text-base font-bold ${isLost ? "text-red-500" : isWon ? "text-green-600" : "text-gray-900"}`}>{d.value}</p>
                          <span className="text-[11px] font-semibold text-green-500">+{d.probability}%</span>
                        </div>
                        <p className="text-xs font-semibold text-gray-700">{d.name}</p>
                        <p className="text-[11px] text-gray-400">{d.id}</p>
                        <div className="mt-2 flex items-center justify-between">
                          <div className="flex items-center gap-1"><Avatar name={d.account} size="xs" /><span className="text-[11px] text-gray-500">{d.account}</span></div>
                          <button><MoreVertical size={12} className="text-gray-300" /></button>
                        </div>
                      </div>
                    ))}
                    {stageDeals.length === 0 && <div className="py-6 text-center text-xs text-gray-300">No deals</div>}
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      )}

      {selected && <EditDealModal deal={selected} onClose={() => setSelected(null)} onSave={persistDeal} />}
    </div>
  );
}

function EditDealModal({ deal, onClose, onSave }) {
  const [form, setForm] = useState(deal);
  const set = (key) => (value) => setForm((prev) => ({ ...prev, [key]: value }));
  return (
    <SidePanel
      title={deal._id ? "Edit deal" : "Create deal"}
      subtitle="Update deal owner, value, stage, probability, and closing timeline."
      onClose={onClose}
      footer={
        <div className="flex justify-end gap-2">
          <Button variant="secondary" onClick={onClose}>Cancel</Button>
          <Button onClick={() => onSave(form)}><Save size={14} /> Save deal</Button>
        </div>
      }
    >
      <div className="grid gap-4 sm:grid-cols-2">
        <Field label="Deal name" value={form.name} onChange={set("name")} />
        <Field label="Account" value={form.account} onChange={set("account")} />
        <Field label="Owner" value={form.owner} onChange={set("owner")} />
        <Field label="Value" value={form.value} onChange={set("value")} />
        <Field label="Stage" value={form.stage} onChange={set("stage")} />
        <Field label="Probability" type="number" value={form.probability} onChange={set("probability")} />
        <Field label="Close date" value={form.close} onChange={set("close")} />
      </div>
    </SidePanel>
  );
}

const taskRows = projects.flatMap((project) => [
  { id: `${project.id}-brief`, title: "Confirm scope and deliverables", relatedTo: project.name, relatedType: "Deal/Contact/Company", assigned: "+91 1234567890", due: project.dueDate || "07/03/2026", status: "Accepted", priority: project.priority === "urgent" ? "High" : "Medium" },
  { id: `${project.id}-review`, title: "Client review checkpoint", relatedTo: project.name, relatedType: "Deal/Contact/Company", assigned: "+91 9876543210", due: project.dueDate || "07/03/2026", status: "Accepted", priority: project.priority === "urgent" ? "High" : "Low" },
]);

const meetingRows = projects.slice(0, 9).map((project, i) => ({
  id: `M-${project.id}`,
  title: "Lorem ipsum dolor self amet",
  type: "Zoom / Gmeet",
  scheduled: "DD/MM/YYYY",
  duration: "HH:MM, 60 mins",
  priority: "Accepted",
  contact: "Contact Name",
  contactType: "Type",
}));

const TASK_STAGES = ["Onboarding", "Need Analysis", "In Progress", "Review"];

function TaskStatusPill({ status = "Accepted" }) {
  const map = { Accepted: "bg-blue-50 text-blue-600", High: "bg-red-50 text-red-600", Medium: "bg-yellow-50 text-yellow-600", Low: "bg-gray-100 text-gray-500" };
  return <span className={`inline-block rounded-full px-2.5 py-0.5 text-[11px] font-semibold ${map[status] ?? "bg-gray-100 text-gray-600"}`}>{status}</span>;
}

export function TasksPage() {
  const [tab, setTab] = useState("Tasks");
  const [view, setView] = useState("list");
  const [query, setQuery] = useState("");
  const [page, setPage] = useState(1);
  const [selected, setSelected] = useState(null);
  const PAGE_SIZE = 10;

  const filteredTasks = taskRows.filter((t) => `${t.title} ${t.relatedTo} ${t.status}`.toLowerCase().includes(query.toLowerCase()));
  const filteredMeetings = meetingRows.filter((m) => `${m.title} ${m.contact}`.toLowerCase().includes(query.toLowerCase()));

  const activeRows = tab === "Tasks" ? filteredTasks : filteredMeetings;
  const totalPages = Math.max(1, Math.ceil(activeRows.length / PAGE_SIZE));
  const paginated = activeRows.slice((page - 1) * PAGE_SIZE, page * PAGE_SIZE);

  return (
    <div className="p-5 xl:p-6 bg-[#f9fafb] min-h-full">
      <div className="mb-4 flex items-center justify-between">
        <div>
          <h1 className="text-xl font-bold text-gray-900">Tasks &amp; Meetings</h1>
          <p className="text-sm text-gray-500">Manage your Tasks &amp; reminders</p>
        </div>
        <div className="flex items-center gap-2">
          <button className="flex h-9 w-9 items-center justify-center rounded-lg border border-gray-200 text-gray-400 hover:bg-gray-50"><MoreVertical size={14} /></button>
          <button onClick={() => setSelected({ title: "", relatedTo: "", assigned: "", due: "", status: "Accepted", priority: "Medium" })} className="flex h-9 items-center gap-1.5 rounded-lg bg-[#2563EB] px-3 text-xs font-semibold text-[#f0ede4] hover:bg-blue-600">
            <Plus size={14} /> New Activity
          </button>
        </div>
      </div>

      <div className="rounded-xl border border-gray-200 bg-[#f0ede4] shadow-sm">
        <div className="flex flex-wrap items-center gap-2 border-b border-gray-100 px-5 py-3">
          <div className="flex gap-1">
            {["Tasks", "Meetings"].map((t) => (
              <button key={t} onClick={() => { setTab(t); setPage(1); }} className={`rounded-full px-3 py-1.5 text-xs font-semibold transition-colors ${tab === t ? "border-b-2 border-[#2563EB] text-[#2563EB] rounded-none pb-1" : "text-gray-500 hover:text-gray-700"}`}>{t}</button>
            ))}
          </div>
          <div className="ml-auto flex items-center gap-2">
            <div className="flex h-8 items-center gap-1.5 rounded-lg border border-gray-200 bg-gray-50 px-2.5 text-xs text-gray-500">
              <Search size={12} />
              <input className="w-44 bg-transparent outline-none placeholder:text-gray-400 text-xs" placeholder={tab === "Tasks" ? "Search by task by title, description, or status..." : "Search by meeting by title, priority, or contact..."} value={query} onChange={(e) => { setQuery(e.target.value); setPage(1); }} />
            </div>
            <button className="flex h-8 w-8 items-center justify-center rounded-lg border border-gray-200 text-gray-400 hover:bg-gray-50"><SlidersHorizontal size={13} /></button>
            <button onClick={() => setView("list")} className={`flex h-8 w-8 items-center justify-center rounded-lg border transition-colors ${view === "list" ? "border-[#2563EB] bg-blue-50 text-[#2563EB]" : "border-gray-200 text-gray-400 hover:bg-gray-50"}`}><List size={13} /></button>
            <button onClick={() => setView("kanban")} className={`flex h-8 w-8 items-center justify-center rounded-lg border transition-colors ${view === "kanban" ? "border-[#2563EB] bg-blue-50 text-[#2563EB]" : "border-gray-200 text-gray-400 hover:bg-gray-50"}`}><LayoutGrid size={13} /></button>
            {tab === "Meetings" && (
              <button className="flex h-8 items-center gap-1.5 rounded-lg border border-gray-200 px-2.5 text-xs font-semibold text-gray-600 hover:bg-gray-50">
                <Calendar size={12} /> View in Calendar
              </button>
            )}
          </div>
        </div>

        {view === "list" ? (
          <>
            <div className="overflow-x-auto">
              {tab === "Tasks" ? (
                <table className="w-full min-w-[800px]">
                  <thead>
                    <tr className="bg-gray-50/70">
                      <th className="w-10 px-4 py-3"><input type="checkbox" className="rounded border-gray-300" /></th>
                      {["Task", "Related To", "Status", "Assigned", "Due Date", "Actions"].map((h) => (
                        <th key={h} className="px-4 py-3 text-left text-[11px] font-bold uppercase tracking-wider text-gray-400">{h}</th>
                      ))}
                    </tr>
                  </thead>
                  <tbody>
                    {paginated.map((task) => (
                      <tr key={task.id} className="border-t border-gray-100 hover:bg-gray-50/60">
                        <td className="px-4 py-3"><input type="checkbox" className="rounded border-gray-300" /></td>
                        <td className="px-4 py-3 text-sm font-semibold text-gray-900 max-w-[200px] truncate">{task.title}</td>
                        <td className="px-4 py-3">
                          <p className="text-sm text-gray-700">{task.relatedTo}</p>
                          <p className="text-[11px] text-gray-400">{task.relatedType}</p>
                        </td>
                        <td className="px-4 py-3"><TaskStatusPill status={task.status} /></td>
                        <td className="px-4 py-3 text-sm text-gray-600">{task.assigned}</td>
                        <td className="px-4 py-3 text-sm text-gray-600">{task.due}</td>
                        <td className="px-4 py-3">
                          <div className="flex items-center gap-2">
                            <button onClick={() => setSelected(task)} className="text-gray-400 hover:text-blue-500"><Eye size={15} /></button>
                            <button onClick={() => setSelected(task)} className="text-gray-400 hover:text-blue-500"><Edit3 size={14} /></button>
                            <button className="text-gray-400 hover:text-red-500"><Trash2 size={14} /></button>
                          </div>
                        </td>
                      </tr>
                    ))}
                    {paginated.length === 0 && <tr><td colSpan={7} className="py-12 text-center text-sm text-gray-400">No tasks found</td></tr>}
                  </tbody>
                </table>
              ) : (
                <table className="w-full min-w-[800px]">
                  <thead>
                    <tr className="bg-gray-50/70">
                      <th className="w-10 px-4 py-3"><input type="checkbox" className="rounded border-gray-300" /></th>
                      {["Meeting", "Scheduled", "Priority", "With", "Actions"].map((h) => (
                        <th key={h} className="px-4 py-3 text-left text-[11px] font-bold uppercase tracking-wider text-gray-400">{h}</th>
                      ))}
                    </tr>
                  </thead>
                  <tbody>
                    {paginated.map((mtg) => (
                      <tr key={mtg.id} className="border-t border-gray-100 hover:bg-gray-50/60">
                        <td className="px-4 py-3"><input type="checkbox" className="rounded border-gray-300" /></td>
                        <td className="px-4 py-3">
                          <p className="text-sm font-semibold text-gray-900">{mtg.title}</p>
                          <span className="inline-flex items-center gap-1 rounded bg-gray-100 px-1.5 py-0.5 text-[11px] text-gray-500">{mtg.type}</span>
                        </td>
                        <td className="px-4 py-3">
                          <p className="text-sm text-gray-700">{mtg.scheduled}</p>
                          <p className="text-[11px] text-gray-400">{mtg.duration}</p>
                        </td>
                        <td className="px-4 py-3"><TaskStatusPill status={mtg.priority} /></td>
                        <td className="px-4 py-3">
                          <p className="text-sm text-gray-700">{mtg.contact}</p>
                          <p className="text-[11px] text-gray-400">{mtg.contactType}</p>
                        </td>
                        <td className="px-4 py-3">
                          <div className="flex items-center gap-2">
                            <button className="text-gray-400 hover:text-blue-500"><Eye size={15} /></button>
                            <button className="text-gray-400 hover:text-blue-500"><Edit3 size={14} /></button>
                            <button className="text-gray-400 hover:text-red-500"><Trash2 size={14} /></button>
                          </div>
                        </td>
                      </tr>
                    ))}
                    {paginated.length === 0 && <tr><td colSpan={6} className="py-12 text-center text-sm text-gray-400">No meetings found</td></tr>}
                  </tbody>
                </table>
              )}
            </div>
            <div className="flex items-center justify-between border-t border-gray-100 px-5 py-3">
              <span className="text-xs text-gray-500">Showing {Math.min((page - 1) * PAGE_SIZE + 1, activeRows.length)}–{Math.min(page * PAGE_SIZE, activeRows.length)} of {activeRows.length} {tab}</span>
              <div className="flex items-center gap-1">
                <button disabled={page <= 1} onClick={() => setPage(p => p - 1)} className="flex h-7 w-7 items-center justify-center rounded-lg border border-gray-200 text-xs text-gray-500 disabled:opacity-40 hover:bg-gray-50">‹</button>
                {Array.from({ length: totalPages }, (_, i) => i + 1).map((p) => (
                  <button key={p} onClick={() => setPage(p)} className={`flex h-7 w-7 items-center justify-center rounded-lg border text-xs font-semibold ${p === page ? "border-[#2563EB] bg-[#2563EB] text-[#f0ede4]" : "border-gray-200 text-gray-500 hover:bg-gray-50"}`}>{p}</button>
                ))}
                <button disabled={page >= totalPages} onClick={() => setPage(p => p + 1)} className="flex h-7 w-7 items-center justify-center rounded-lg border border-gray-200 text-xs text-gray-500 disabled:opacity-40 hover:bg-gray-50">›</button>
              </div>
            </div>
          </>
        ) : (
          <div className="p-5">
            <div className="grid grid-cols-4 gap-4 min-w-[800px]">
              {TASK_STAGES.map((stage) => (
                <div key={stage} className="rounded-xl border border-gray-200 bg-gray-50/60 p-3">
                  <div className="mb-3 flex items-center justify-between">
                    <span className="text-sm font-semibold text-gray-700">{stage} <span className="ml-1 text-gray-400">6</span></span>
                    <button className="text-gray-400"><MoreVertical size={14} /></button>
                  </div>
                  <div className="py-6 text-center text-xs text-gray-300">No items</div>
                </div>
              ))}
            </div>
          </div>
        )}
      </div>

      {selected && (
        <SidePanel
          title={selected.id ? "Edit task" : "New Task"}
          subtitle="Update task title, related entity, status, and due date."
          onClose={() => setSelected(null)}
          footer={
            <div className="flex justify-between">
              <button className="inline-flex items-center gap-2 rounded-xl px-3 py-2 text-xs font-bold text-red-600 hover:bg-red-50"><Trash2 size={14} /> Delete</button>
              <div className="flex gap-2"><Button variant="secondary" onClick={() => setSelected(null)}>Cancel</Button><Button onClick={() => setSelected(null)}><Save size={14} /> Save</Button></div>
            </div>
          }
        >
          <div className="grid gap-4 sm:grid-cols-2">
            <Field label="Task title" value={selected.title} onChange={(v) => setSelected(p => ({ ...p, title: v }))} />
            <Field label="Related To" value={selected.relatedTo} onChange={(v) => setSelected(p => ({ ...p, relatedTo: v }))} />
            <Field label="Assigned" value={selected.assigned} onChange={(v) => setSelected(p => ({ ...p, assigned: v }))} />
            <Field label="Due date" value={selected.due} onChange={(v) => setSelected(p => ({ ...p, due: v }))} />
            <Field label="Status" value={selected.status} onChange={(v) => setSelected(p => ({ ...p, status: v }))} />
            <Field label="Priority" value={selected.priority} onChange={(v) => setSelected(p => ({ ...p, priority: v }))} />
          </div>
        </SidePanel>
      )}
    </div>
  );
}

export function ReportsPage() {
  const totalInvoices = invoices.length;
  const paidOrders = orders.filter((order) => order.status === "Paid").length;
  return (
    <PageShell title="Reports" subtitle="Review revenue, conversion, delivery, and client onboarding metrics." action={<Button><FileText size={14} /> Export Report</Button>}>
      <div className="grid gap-4 md:grid-cols-4">
        {[
          ["Paid orders", paidOrders, TrendingUp],
          ["Invoices", totalInvoices, FileText],
          ["Active projects", projects.length, Workflow],
          ["Templates sent", 94, Send],
        ].map(([label, value, Icon]) => (
          <Card key={label} className="p-4">
            <Icon size={18} className="text-[#2563EB]" />
            <p className="mt-4 text-2xl font-bold text-gray-950">{value}</p>
            <p className="text-xs font-bold uppercase tracking-wider text-gray-400">{label}</p>
          </Card>
        ))}
      </div>
      <div className="mt-5 grid gap-5 xl:grid-cols-2">
        <Card className="p-5">
          <h3 className="text-sm font-bold text-gray-950">Conversion summary</h3>
          <div className="mt-5 space-y-4">
            {["Lead to qualified", "Proposal to payment", "Payment to portal login", "Project on-time delivery"].map((label, index) => (
              <div key={label}>
                <div className="mb-1 flex justify-between text-xs font-bold"><span className="text-gray-600">{label}</span><span className="text-gray-400">{[64, 48, 82, 71][index]}%</span></div>
                <div className="h-2 rounded-full bg-gray-100"><div className="h-full rounded-full bg-[#2563EB]" style={{ width: `${[64, 48, 82, 71][index]}%` }} /></div>
              </div>
            ))}
          </div>
        </Card>
        <Card className="p-5">
          <h3 className="text-sm font-bold text-gray-950">Next report actions</h3>
          <div className="mt-4 space-y-3">
            {["Send weekly sales digest", "Export GST invoice register", "Review overdue project risks", "Audit failed payment attempts"].map((item) => (
              <button key={item} className="flex w-full items-center justify-between rounded-xl border border-gray-200 bg-gray-50 p-3 text-left text-xs font-bold text-gray-600 hover:bg-[#f0ede4]">
                {item}
                <MoreHorizontal size={14} className="text-gray-300" />
              </button>
            ))}
          </div>
        </Card>
      </div>
    </PageShell>
  );
}

function SettingsField({ label, value, onChange, type = "text", placeholder }) {
  return (
    <label className="block">
      <span className="text-xs font-bold uppercase tracking-[0.12em] text-[#7b6f63]">{label}</span>
      <input
        type={type}
        value={value}
        onChange={(event) => onChange(event.target.value)}
        placeholder={placeholder}
        className="mt-2 w-full rounded-2xl border border-[#e3d6c5] bg-[#fffdfc] px-4 py-3 text-sm text-[#101010] outline-none transition-all focus:border-[#331405] focus:ring-4 focus:ring-[#f3dfd7]"
      />
    </label>
  );
}

function SettingsSelect({ label, value, onChange, options }) {
  return (
    <label className="block">
      <span className="text-xs font-bold uppercase tracking-[0.12em] text-[#7b6f63]">{label}</span>
      <select
        value={value}
        onChange={(event) => onChange(event.target.value)}
        className="mt-2 w-full rounded-2xl border border-[#e3d6c5] bg-[#fffdfc] px-4 py-3 text-sm text-[#101010] outline-none transition-all focus:border-[#331405] focus:ring-4 focus:ring-[#f3dfd7]"
      >
        {options.map((option) => (
          <option key={option} value={option}>{option}</option>
        ))}
      </select>
    </label>
  );
}

function SettingsToggle({ title, description, checked, onChange }) {
  return (
    <div className="flex items-start justify-between gap-4 rounded-2xl border border-[#e3d6c5] bg-[#fffdfc] px-4 py-4">
      <div>
        <p className="text-sm font-semibold text-[#101010]">{title}</p>
        <p className="mt-1 text-xs leading-5 text-[#331405]">{description}</p>
      </div>
      <button
        type="button"
        onClick={() => onChange(!checked)}
        className={`relative h-7 w-12 rounded-full transition-colors ${checked ? "bg-[#331405]" : "bg-[#e3d6c5]"}`}
      >
        <span
          className={`absolute top-1 h-5 w-5 rounded-full bg-[#f0ede4] transition-all ${checked ? "left-6" : "left-1"}`}
        />
      </button>
    </div>
  );
}

export function SettingsPage() {
  const { showToast } = useToast();
  const sections = [
    { key: "profile", title: "Profile", description: "Agency admin details and primary identity.", icon: UserPlus },
    { key: "password", title: "Password", description: "Reset rules, OTP window, and secure access.", icon: LockKeyhole },
    { key: "company", title: "Company Information", description: "Legal business details for billing and display.", icon: Building2 },
    { key: "billing", title: "Billing Settings", description: "Gateway, invoice defaults, and invite triggers.", icon: CreditCard },
    { key: "email", title: "Email Settings", description: "Sender identity, SMTP values, and onboarding mail flow.", icon: Mail },
    { key: "notifications", title: "Notification Settings", description: "Workspace alerts, reminders, and operational notices.", icon: BellRing },
  ];

  const [activeSection, setActiveSection] = useState("profile");
  const [profile, setProfile] = useState({
    fullName: "Rohit Kumar",
    email: "rohit@datacircles.in",
    title: "Super Admin",
    timezone: "Asia/Kolkata",
    publicUrl: "http://localhost:5173",
  });
  const [password, setPassword] = useState({
    currentPassword: "",
    newPassword: "",
    confirmPassword: "",
    inviteExpiry: "48 hours",
    otpExpiry: "10 minutes",
  });
  const [company, setCompany] = useState({
    studioName: "The Copper Studio",
    legalName: "The Copper Studio Private Limited",
    gstin: "27ABCDE1234F1Z5",
    billingEmail: "accounts@datacircles.in",
    website: "https://thecopperstudio.com",
    billingAddress: "Mumbai, Maharashtra, India",
  });
  const [billing, setBilling] = useState({
    gateway: "Razorpay",
    apiBase: "http://localhost:5000",
    invoicePrefix: "INV",
    defaultRole: "user",
    autoInviteAfterPayment: true,
    allowCouponAtCheckout: true,
  });
  const [email, setEmail] = useState({
    senderName: "The Copper Studio",
    senderEmail: "hello@thecopperstudio.com",
    smtpHost: "smtp.gmail.com",
    smtpPort: "587",
    onboardingPath: "/client-secure-onboarding/access-setup",
  });
  const [notifications, setNotifications] = useState({
    paymentSuccess: true,
    failedPayments: true,
    portalInviteSent: true,
    overdueInvoices: true,
  });

  function saveSection(label) {
    showToast({
      title: `${label} updated`,
      message: "Your settings have been saved successfully.",
    });
  }

  return (
    <div className="space-y-6">
      <section className="flex flex-col gap-5 xl:flex-row xl:items-end xl:justify-between">
        <div>
          <p className="text-[11px] font-bold uppercase tracking-[0.14em] text-[#7b6f63]">Workspace administration</p>
          <h2 className="mt-2 text-3xl font-semibold tracking-tight text-[#101010]">Account Settings</h2>
          <p className="mt-2 max-w-2xl text-sm leading-6 text-[#331405]">
            Manage admin identity, secure password flows, company billing details, mail delivery, and the post-payment onboarding pipeline.
          </p>
        </div>

        <div className="flex flex-wrap items-center gap-3">
          <Button variant="secondary" size="lg">
            <Globe2 size={15} />
            Live workspace
          </Button>
          <Button size="lg" onClick={() => saveSection("Workspace")}>
            <Save size={15} />
            Save Changes
          </Button>
        </div>
      </section>

      <section className="grid gap-6 xl:grid-cols-[290px_minmax(0,1fr)]">
        <Card className="p-3 shadow-[0_18px_40px_rgba(79,39,16,0.06)]">
          {sections.map((section) => (
            <button
              key={section.key}
              type="button"
              onClick={() => setActiveSection(section.key)}
              className={`flex w-full items-start gap-3 rounded-2xl p-4 text-left transition-colors ${
                activeSection === section.key ? "bg-[#e3d6c5]" : "hover:bg-[#e3d6c5]"
              }`}
            >
              <div className={`grid h-10 w-10 place-items-center rounded-2xl ${
                activeSection === section.key ? "bg-[#f3dfd7] text-[#331405]" : "bg-[#f5e6e1] text-[#331405]"
              }`}>
                <section.icon size={17} />
              </div>
              <div>
                <p className="text-sm font-bold text-[#101010]">{section.title}</p>
                <p className="mt-1 text-xs leading-5 text-[#331405]">{section.description}</p>
              </div>
            </button>
          ))}
        </Card>

        <Card className="p-6 shadow-[0_18px_40px_rgba(79,39,16,0.06)]">
          {activeSection === "profile" && (
            <div>
              <div className="mb-6 flex items-center gap-3">
                <div className="grid h-11 w-11 place-items-center rounded-2xl bg-[#101010] text-[#f0ede4]"><SettingsIcon size={18} /></div>
                <div>
                  <h3 className="text-lg font-semibold text-[#101010]">Personal Profile</h3>
                  <p className="text-sm text-[#331405]">Update the primary super admin identity shown across the CRM.</p>
                </div>
              </div>
              <div className="grid gap-4 sm:grid-cols-2">
                <SettingsField label="Full Name" value={profile.fullName} onChange={(value) => setProfile((prev) => ({ ...prev, fullName: value }))} />
                <SettingsField label="Email Address" value={profile.email} onChange={(value) => setProfile((prev) => ({ ...prev, email: value }))} />
                <SettingsField label="Job Title" value={profile.title} onChange={(value) => setProfile((prev) => ({ ...prev, title: value }))} />
                <SettingsSelect label="Timezone" value={profile.timezone} onChange={(value) => setProfile((prev) => ({ ...prev, timezone: value }))} options={["Asia/Kolkata", "Europe/London", "America/New_York"]} />
                <div className="sm:col-span-2">
                  <SettingsField label="CRM Public URL" value={profile.publicUrl} onChange={(value) => setProfile((prev) => ({ ...prev, publicUrl: value }))} />
                </div>
              </div>
              <div className="mt-6 flex justify-end">
                <Button onClick={() => saveSection("Profile")}><Save size={14} /> Save Profile</Button>
              </div>
            </div>
          )}

          {activeSection === "password" && (
            <div>
              <div className="mb-6">
                <h3 className="text-lg font-semibold text-[#101010]">Password & Access</h3>
                <p className="mt-1 text-sm text-[#331405]">Control reset behavior, onboarding link life, and OTP validity.</p>
              </div>
              <div className="grid gap-4 sm:grid-cols-2">
                <SettingsField label="Current Password" type="password" value={password.currentPassword} onChange={(value) => setPassword((prev) => ({ ...prev, currentPassword: value }))} />
                <SettingsField label="New Password" type="password" value={password.newPassword} onChange={(value) => setPassword((prev) => ({ ...prev, newPassword: value }))} />
                <SettingsField label="Confirm Password" type="password" value={password.confirmPassword} onChange={(value) => setPassword((prev) => ({ ...prev, confirmPassword: value }))} />
                <SettingsSelect label="Invite Link Expiry" value={password.inviteExpiry} onChange={(value) => setPassword((prev) => ({ ...prev, inviteExpiry: value }))} options={["24 hours", "48 hours", "72 hours"]} />
                <SettingsSelect label="OTP Expiry" value={password.otpExpiry} onChange={(value) => setPassword((prev) => ({ ...prev, otpExpiry: value }))} options={["5 minutes", "10 minutes", "15 minutes"]} />
              </div>
              <div className="mt-6 flex justify-end">
                <Button onClick={() => saveSection("Password settings")}><Save size={14} /> Update Security</Button>
              </div>
            </div>
          )}

          {activeSection === "company" && (
            <div>
              <div className="mb-6">
                <h3 className="text-lg font-semibold text-[#101010]">Company Information</h3>
                <p className="mt-1 text-sm text-[#331405]">Use these values for invoices, proposals, and client-facing mail content.</p>
              </div>
              <div className="grid gap-4 sm:grid-cols-2">
                <SettingsField label="Studio Name" value={company.studioName} onChange={(value) => setCompany((prev) => ({ ...prev, studioName: value }))} />
                <SettingsField label="Legal Name" value={company.legalName} onChange={(value) => setCompany((prev) => ({ ...prev, legalName: value }))} />
                <SettingsField label="GSTIN" value={company.gstin} onChange={(value) => setCompany((prev) => ({ ...prev, gstin: value }))} />
                <SettingsField label="Billing Email" value={company.billingEmail} onChange={(value) => setCompany((prev) => ({ ...prev, billingEmail: value }))} />
                <SettingsField label="Website" value={company.website} onChange={(value) => setCompany((prev) => ({ ...prev, website: value }))} />
                <div className="sm:col-span-2">
                  <SettingsField label="Billing Address" value={company.billingAddress} onChange={(value) => setCompany((prev) => ({ ...prev, billingAddress: value }))} />
                </div>
              </div>
              <div className="mt-6 flex items-center justify-between gap-3 rounded-2xl border border-dashed border-[#e3d6c5] bg-[#fffdfc] px-4 py-4">
                <div className="flex items-center gap-3">
                  <div className="grid h-10 w-10 place-items-center rounded-2xl bg-[#f3dfd7] text-[#331405]"><UploadCloud size={18} /></div>
                  <div>
                    <p className="text-sm font-semibold text-[#101010]">Logo Upload</p>
                    <p className="text-xs text-[#331405]">Update the brand logo used in the client portal and proposal PDF exports.</p>
                  </div>
                </div>
                <Button variant="secondary">Upload</Button>
              </div>
              <div className="mt-6 flex justify-end">
                <Button onClick={() => saveSection("Company information")}><Save size={14} /> Save Company</Button>
              </div>
            </div>
          )}

          {activeSection === "billing" && (
            <div>
              <div className="mb-6">
                <h3 className="text-lg font-semibold text-[#101010]">Billing & Gateway Settings</h3>
                <p className="mt-1 text-sm text-[#331405]">Configure checkout behavior, invoice defaults, and automatic portal access after payment.</p>
              </div>
              <div className="grid gap-4 sm:grid-cols-2">
                <SettingsSelect label="Payment Gateway" value={billing.gateway} onChange={(value) => setBilling((prev) => ({ ...prev, gateway: value }))} options={["Razorpay", "Stripe", "Manual"]} />
                <SettingsField label="API Base URL" value={billing.apiBase} onChange={(value) => setBilling((prev) => ({ ...prev, apiBase: value }))} />
                <SettingsField label="Invoice Prefix" value={billing.invoicePrefix} onChange={(value) => setBilling((prev) => ({ ...prev, invoicePrefix: value }))} />
                <SettingsSelect label="Default Role After Payment" value={billing.defaultRole} onChange={(value) => setBilling((prev) => ({ ...prev, defaultRole: value }))} options={["user", "superadmin"]} />
              </div>
              <div className="mt-6 space-y-3">
                <SettingsToggle
                  title="Auto-send portal invite after payment"
                  description="Once checkout is successful, send the secure password setup link to the client automatically."
                  checked={billing.autoInviteAfterPayment}
                  onChange={(value) => setBilling((prev) => ({ ...prev, autoInviteAfterPayment: value }))}
                />
                <SettingsToggle
                  title="Allow coupon codes during package checkout"
                  description="Keep coupon application visible as an optional field inside the pricing and checkout flow."
                  checked={billing.allowCouponAtCheckout}
                  onChange={(value) => setBilling((prev) => ({ ...prev, allowCouponAtCheckout: value }))}
                />
              </div>
              <div className="mt-6 flex justify-end">
                <Button onClick={() => saveSection("Billing settings")}><Save size={14} /> Save Billing</Button>
              </div>
            </div>
          )}

          {activeSection === "email" && (
            <div>
              <div className="mb-6">
                <h3 className="text-lg font-semibold text-[#101010]">Email Delivery Settings</h3>
                <p className="mt-1 text-sm text-[#331405]">Set the mail sender identity and the secure onboarding route used in invite messages.</p>
              </div>
              <div className="grid gap-4 sm:grid-cols-2">
                <SettingsField label="Sender Name" value={email.senderName} onChange={(value) => setEmail((prev) => ({ ...prev, senderName: value }))} />
                <SettingsField label="Sender Email" value={email.senderEmail} onChange={(value) => setEmail((prev) => ({ ...prev, senderEmail: value }))} />
                <SettingsField label="SMTP Host" value={email.smtpHost} onChange={(value) => setEmail((prev) => ({ ...prev, smtpHost: value }))} />
                <SettingsField label="SMTP Port" value={email.smtpPort} onChange={(value) => setEmail((prev) => ({ ...prev, smtpPort: value }))} />
                <div className="sm:col-span-2">
                  <SettingsField label="Secure Onboarding Path" value={email.onboardingPath} onChange={(value) => setEmail((prev) => ({ ...prev, onboardingPath: value }))} />
                </div>
              </div>
              <div className="mt-6 rounded-2xl border border-[#e3d6c5] bg-[#fffdfc] px-4 py-4">
                <p className="text-sm font-semibold text-[#101010]">Current flow</p>
                <p className="mt-2 text-xs leading-6 text-[#331405]">
                  Paid checkout, then success confirmation, then secure invite mail, then unique password setup, then redirect to the shared login page.
                </p>
              </div>
              <div className="mt-6 flex justify-end">
                <Button onClick={() => saveSection("Email settings")}><Save size={14} /> Save Email</Button>
              </div>
            </div>
          )}

          {activeSection === "notifications" && (
            <div>
              <div className="mb-6">
                <h3 className="text-lg font-semibold text-[#101010]">Notification Settings</h3>
                <p className="mt-1 text-sm text-[#331405]">Choose which operational events should surface inside the admin workspace.</p>
              </div>
              <div className="space-y-3">
                <SettingsToggle
                  title="Payment success alerts"
                  description="Show a confirmation toast and admin alert when a package payment is completed."
                  checked={notifications.paymentSuccess}
                  onChange={(value) => setNotifications((prev) => ({ ...prev, paymentSuccess: value }))}
                />
                <SettingsToggle
                  title="Failed payment alerts"
                  description="Flag payment failures so the team can follow up quickly."
                  checked={notifications.failedPayments}
                  onChange={(value) => setNotifications((prev) => ({ ...prev, failedPayments: value }))}
                />
                <SettingsToggle
                  title="Portal invite sent alerts"
                  description="Notify admins when the onboarding email has been dispatched successfully."
                  checked={notifications.portalInviteSent}
                  onChange={(value) => setNotifications((prev) => ({ ...prev, portalInviteSent: value }))}
                />
                <SettingsToggle
                  title="Overdue invoice alerts"
                  description="Surface aged or unpaid invoices in the finance workflow."
                  checked={notifications.overdueInvoices}
                  onChange={(value) => setNotifications((prev) => ({ ...prev, overdueInvoices: value }))}
                />
              </div>
              <div className="mt-6 flex justify-end">
                <Button onClick={() => saveSection("Notification settings")}><Save size={14} /> Save Notifications</Button>
              </div>
            </div>
          )}
        </Card>
      </section>
    </div>
  );
}
