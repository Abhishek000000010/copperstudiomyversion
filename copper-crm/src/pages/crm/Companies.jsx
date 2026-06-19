import { useMemo, useState } from "react";
import { useNavigate } from "react-router-dom";
import {
  Building2, ChevronLeft, ChevronRight, Filter,
  Globe, MoreVertical, Plus, Save, Search, SlidersHorizontal,
  TrendingUp, FileText, DollarSign
} from "lucide-react";
import { Button } from "../../components/ui";
import { companies as fallbackCompanies } from "../../data/mockData";
import { useCrmRecords } from "../../hooks/useCrmRecords";
import { useToast } from "../../components/useToast";
import SidePanel from "../../components/SidePanel";

const PAGE_SIZE = 10;

function Field({ label, value, onChange, placeholder = "", type = "text" }) {
  return (
    <label className="block">
      <span className="text-xs font-semibold text-[#374151]">{label}</span>
      <input
        type={type}
        value={value || ""}
        onChange={(e) => onChange(e.target.value)}
        placeholder={placeholder}
        className="mt-1.5 w-full rounded-lg border border-[#e3d6c5] bg-white px-3 py-2 text-sm outline-none focus:border-[#c57e5b] focus:ring-2 focus:ring-[#c57e5b]/20 transition-all"
      />
    </label>
  );
}

function DocSignedBadge({ status }) {
  const map = {
    Accepted: "bg-emerald-50 text-emerald-700 border border-emerald-200",
    Pending: "bg-[#f5ebe0] text-[#9a6c3b] border border-[#e3d6c5]",
    Rejected: "bg-red-50 text-red-600 border border-red-200",
  };
  return (
    <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-[11px] font-semibold tracking-wide ${map[status] || "bg-[#f5f0ea] text-[#888] border border-[#e3d6c5]"}`}>
      {status || "—"}
    </span>
  );
}

function CompanyRow({ company, onEdit, onClick }) {
  const [menuOpen, setMenuOpen] = useState(false);

  return (
    <tr
      className="border-b border-[#f0ede4] hover:bg-[#faf8f5] cursor-pointer transition-colors group"
      onClick={onClick}
    >
      <td className="px-4 py-4" onClick={(e) => e.stopPropagation()}>
        <input type="checkbox" className="rounded border-[#d1d5db] accent-[#c57e5b]" />
      </td>
      <td className="px-4 py-4">
        <div className="flex items-center gap-3">
          <div className="h-8 w-8 shrink-0 rounded-lg bg-[#f5ebe0] border border-[#e3d6c5] flex items-center justify-center">
            <Building2 size={14} className="text-[#c57e5b]" />
          </div>
          <span className="text-sm font-semibold text-[#1a1a1a]">{company.name}</span>
        </div>
      </td>
      <td className="px-4 py-4 text-sm text-[#666]">{company.industry || "—"}</td>
      <td className="px-4 py-4 text-sm text-[#666] max-w-[140px] truncate">
        {company.address ? company.address.slice(0, 22) + (company.address.length > 22 ? "…" : "") : "—"}
      </td>
      <td className="px-4 py-4">
        {company.website ? (
          <a
            href={company.website.startsWith("http") ? company.website : `https://${company.website}`}
            onClick={(e) => e.stopPropagation()}
            target="_blank"
            rel="noopener noreferrer"
            className="inline-flex items-center gap-1 text-sm text-[#c57e5b] hover:underline"
          >
            <Globe size={12} />
            {company.website.replace(/^https?:\/\//, "").slice(0, 22)}…
          </a>
        ) : "—"}
      </td>
      <td className="px-4 py-4 text-sm font-mono text-[#888]">{company.gstin || "—"}</td>
      <td className="px-4 py-4">
        <DocSignedBadge status={company.status === "Active" ? "Accepted" : company.status === "Prospect" ? "Pending" : company.status} />
      </td>
      <td className="px-4 py-4 text-sm text-[#666]">Reference</td>
      <td className="px-4 py-4" onClick={(e) => e.stopPropagation()}>
        <div className="relative">
          <button
            onClick={() => setMenuOpen((v) => !v)}
            className="h-7 w-7 flex items-center justify-center rounded-lg text-[#bbb] hover:bg-[#f0ede4] hover:text-[#666] transition-colors opacity-0 group-hover:opacity-100"
          >
            <MoreVertical size={14} />
          </button>
          {menuOpen && (
            <div className="absolute right-0 z-10 mt-1 w-36 rounded-xl border border-[#e3d6c5] bg-white shadow-lg py-1">
              <button
                onClick={() => { setMenuOpen(false); onEdit(company); }}
                className="flex w-full items-center gap-2 px-3 py-2 text-sm text-[#374151] hover:bg-[#f9f7f3]"
              >
                Edit
              </button>
              <button className="flex w-full items-center gap-2 px-3 py-2 text-sm text-[#374151] hover:bg-[#f9f7f3]">
                Move to Folder
              </button>
              <button className="flex w-full items-center gap-2 px-3 py-2 text-sm text-red-600 hover:bg-red-50">
                Delete
              </button>
            </div>
          )}
        </div>
      </td>
    </tr>
  );
}

export default function Companies() {
  const navigate = useNavigate();
  const [search, setSearch] = useState("");
  const [editing, setEditing] = useState(null);
  const [page, setPage] = useState(1);
  const { records: companies, save, loading } = useCrmRecords("companies", fallbackCompanies);
  const { showToast } = useToast();

  const filtered = useMemo(() =>
    companies.filter((c) =>
      `${c.name} ${c.industry} ${c.contact} ${c.status}`.toLowerCase().includes(search.toLowerCase())
    ), [companies, search]);

  const totalPages = Math.max(1, Math.ceil(filtered.length / PAGE_SIZE));
  const paginated = filtered.slice((page - 1) * PAGE_SIZE, page * PAGE_SIZE);

  async function saveCompany(company) {
    try {
      const isNew = !company._id;
      await save({ ...company, id: company.id || `CO-${Date.now()}`, projects: Number(company.projects) || 0 });
      setEditing(null);
      showToast({ title: isNew ? "Company created" : "Company updated", message: `${company.name || "Company"} saved.` });
    } catch (err) {
      showToast({ type: "error", title: "Could not save company", message: err.message });
    }
  }

  const activeCount = companies.filter(c => c.status === "Active").length;
  const prospectCount = companies.filter(c => c.status === "Prospect" || c.status === "Pending").length;

  return (
    <div className="flex flex-col h-full">
      {/* Page header */}
      <div className="px-6 py-5">
        <div className="flex items-start justify-between gap-4">
          <div>
            <h1 className="text-xl font-bold text-[#1a1a1a]">Companies</h1>
            <p className="text-sm text-[#888] mt-0.5">Manage your organisation contracts</p>
          </div>
          <div className="flex items-center gap-2.5">
            {/* Search */}
            <div className="flex h-9 items-center gap-2 rounded-full border border-[#e3d6c5] bg-white px-3.5 w-60 focus-within:border-[#c57e5b] focus-within:ring-2 focus-within:ring-[#c57e5b]/15 transition-all">
              <Search size={13} className="text-[#bbb] shrink-0" />
              <input
                className="w-full bg-transparent text-sm outline-none placeholder:text-[#bbb]"
                placeholder="Search by contact by name, ir..."
                value={search}
                onChange={(e) => { setSearch(e.target.value); setPage(1); }}
              />
            </div>
            <button className="flex h-9 items-center gap-1.5 rounded-full border border-[#e3d6c5] bg-white px-4 text-sm font-medium text-[#555] hover:border-[#c57e5b] hover:text-[#331405] transition-colors">
              <Filter size={14} />
              Hoslist
            </button>
            <button
              onClick={() => setEditing({ name: "", gstin: "", industry: "", contact: "", projects: 0, status: "Prospect", address: "", website: "", notes: "" })}
              className="flex h-9 items-center gap-1.5 rounded-full bg-[#c57e5b] px-4 text-sm font-semibold text-white hover:bg-[#b06a48] transition-colors shadow-sm"
            >
              <Plus size={14} />
              Add Company
            </button>
          </div>
        </div>
      </div>

      {/* Table Card */}
      <div className="flex-1 overflow-auto px-6">
        <div className="bg-white rounded-2xl border border-[#e3d6c5] overflow-hidden shadow-sm">
          <table className="min-w-full">
            <thead className="bg-[#faf8f5] border-b border-[#f0ede4]">
              <tr>
                <th className="px-4 py-3.5 w-10">
                  <input type="checkbox" className="rounded border-[#d1d5db] accent-[#c57e5b]" />
                </th>
                <th className="px-4 py-3.5 text-left">
                  <div className="flex items-center gap-1.5 text-[11px] font-bold text-[#999] uppercase tracking-wider">
                    <Building2 size={12} />
                    Company Name
                  </div>
                </th>
                <th className="px-4 py-3.5 text-left">
                  <div className="flex items-center gap-1.5 text-[11px] font-bold text-[#999] uppercase tracking-wider">
                    <SlidersHorizontal size={12} />
                    Industry
                  </div>
                </th>
                <th className="px-4 py-3.5 text-left">
                  <div className="flex items-center gap-1.5 text-[11px] font-bold text-[#999] uppercase tracking-wider">
                    Location
                  </div>
                </th>
                <th className="px-4 py-3.5 text-left">
                  <div className="flex items-center gap-1.5 text-[11px] font-bold text-[#999] uppercase tracking-wider">
                    <Globe size={12} />
                    Website
                  </div>
                </th>
                <th className="px-4 py-3.5 text-left">
                  <div className="flex items-center gap-1.5 text-[11px] font-bold text-[#999] uppercase tracking-wider">
                    GSTIN
                  </div>
                </th>
                <th className="px-4 py-3.5 text-left">
                  <div className="flex items-center gap-1.5 text-[11px] font-bold text-[#999] uppercase tracking-wider">
                    Document Signed
                  </div>
                </th>
                <th className="px-4 py-3.5 text-left">
                  <div className="flex items-center gap-1.5 text-[11px] font-bold text-[#999] uppercase tracking-wider">
                    Lead Source
                  </div>
                </th>
                <th className="px-4 py-3.5 w-10" />
              </tr>
            </thead>
            <tbody className="bg-white">
              {loading ? (
                <tr>
                  <td colSpan={9} className="px-4 py-12 text-center text-sm text-[#999]">Loading companies…</td>
                </tr>
              ) : paginated.length === 0 ? (
                <tr>
                  <td colSpan={9} className="px-4 py-12 text-center text-sm text-[#999]">No companies found.</td>
                </tr>
              ) : paginated.map((company) => (
                <CompanyRow
                  key={company._id || company.id}
                  company={company}
                  onEdit={setEditing}
                  onClick={() => navigate(`/admin/companies/${company._id || company.id}`)}
                />
              ))}
            </tbody>
          </table>

          {/* Pagination */}
          <div className="flex items-center justify-between px-5 py-3.5 bg-[#faf8f5] border-t border-[#f0ede4]">
            <p className="text-sm text-[#888]">
              Showing <span className="font-semibold text-[#1a1a1a]">{Math.min(paginated.length, PAGE_SIZE)}</span> of{" "}
              <span className="font-semibold text-[#1a1a1a]">{filtered.length}</span> Companies
            </p>
            <div className="flex items-center gap-1">
              <button
                onClick={() => setPage((p) => Math.max(1, p - 1))}
                disabled={page === 1}
                className="flex h-8 w-8 items-center justify-center rounded-lg border border-[#e3d6c5] bg-white text-[#666] hover:bg-[#f9f7f3] disabled:opacity-40 disabled:cursor-not-allowed transition-colors"
              >
                <ChevronLeft size={14} />
              </button>
              {Array.from({ length: totalPages }, (_, i) => i + 1).slice(0, 5).map((p) => (
                <button
                  key={p}
                  onClick={() => setPage(p)}
                  className={`flex h-8 w-8 items-center justify-center rounded-lg text-sm font-semibold transition-colors ${
                    p === page
                      ? "bg-[#c57e5b] text-white"
                      : "border border-[#e3d6c5] bg-white text-[#666] hover:bg-[#f9f7f3]"
                  }`}
                >
                  {p}
                </button>
              ))}
              <button
                onClick={() => setPage((p) => Math.min(totalPages, p + 1))}
                disabled={page === totalPages}
                className="flex h-8 w-8 items-center justify-center rounded-lg border border-[#e3d6c5] bg-white text-[#666] hover:bg-[#f9f7f3] disabled:opacity-40 disabled:cursor-not-allowed transition-colors"
              >
                <ChevronRight size={14} />
              </button>
            </div>
          </div>
        </div>
      </div>

      {/* Stat Cards */}
      <div className="px-6 py-5">
        <div className="grid grid-cols-3 gap-4">
          <div className="flex items-center gap-4 rounded-2xl border border-[#e3d6c5] bg-white p-5 shadow-sm">
            <div className="h-11 w-11 rounded-xl bg-[#f5ebe0] flex items-center justify-center">
              <TrendingUp size={20} className="text-[#c57e5b]" />
            </div>
            <div>
              <p className="text-[11px] font-bold uppercase tracking-wider text-[#999]">Active Deals</p>
              <p className="text-2xl font-bold text-[#1a1a1a]">{String(activeCount).padStart(2, "0")}</p>
            </div>
          </div>
          <div className="flex items-center gap-4 rounded-2xl border border-[#e3d6c5] bg-white p-5 shadow-sm">
            <div className="h-11 w-11 rounded-xl bg-[#f0ede4] flex items-center justify-center">
              <FileText size={20} className="text-[#888]" />
            </div>
            <div>
              <p className="text-[11px] font-bold uppercase tracking-wider text-[#999]">Pending Contracts</p>
              <p className="text-2xl font-bold text-[#1a1a1a]">{String(prospectCount).padStart(2, "0")}</p>
            </div>
          </div>
          <div className="flex items-center gap-4 rounded-2xl border border-[#e3d6c5] bg-white p-5 shadow-sm">
            <div className="h-11 w-11 rounded-xl bg-[#f0ede4] flex items-center justify-center">
              <DollarSign size={20} className="text-[#888]" />
            </div>
            <div>
              <p className="text-[11px] font-bold uppercase tracking-wider text-[#999]">Total Revenue</p>
              <p className="text-2xl font-bold text-[#1a1a1a]">$45,200</p>
            </div>
          </div>
        </div>
      </div>

      {editing && <CompanyModal company={editing} onClose={() => setEditing(null)} onSave={saveCompany} />}
    </div>
  );
}

function CompanyModal({ company, onClose, onSave }) {
  const [form, setForm] = useState(company);
  const set = (key) => (value) => setForm((prev) => ({ ...prev, [key]: value }));
  return (
    <SidePanel
      title={company._id || company.id ? "Edit Company" : "Add Company"}
      subtitle="Update company profile, GSTIN, contact, and project details."
      onClose={onClose}
      footer={
        <div className="flex justify-end gap-2">
          <Button variant="secondary" onClick={onClose}>Cancel</Button>
          <Button onClick={() => onSave(form)}><Save size={14} /> Save Company</Button>
        </div>
      }
    >
      <div className="grid gap-4 sm:grid-cols-2">
        <Field label="Company name" value={form.name} onChange={set("name")} />
        <Field label="GSTIN number" value={form.gstin} onChange={set("gstin")} placeholder="27ABCDE1234F1Z5" />
        <Field label="Industry" value={form.industry} onChange={set("industry")} />
        <Field label="Primary contact" value={form.contact} onChange={set("contact")} />
        <Field label="Projects" type="number" value={form.projects} onChange={set("projects")} />
        <Field label="Status" value={form.status} onChange={set("status")} />
        <Field label="Website" value={form.website} onChange={set("website")} />
        <Field label="Address" value={form.address} onChange={set("address")} />
        <label className="block sm:col-span-2">
          <span className="text-xs font-semibold text-[#374151]">Notes</span>
          <textarea
            value={form.notes || ""}
            onChange={(e) => set("notes")(e.target.value)}
            className="mt-1.5 min-h-24 w-full rounded-lg border border-[#e3d6c5] bg-white px-3 py-2 text-sm outline-none focus:border-[#c57e5b] focus:ring-2 focus:ring-[#c57e5b]/20 transition-all"
          />
        </label>
      </div>
    </SidePanel>
  );
}
