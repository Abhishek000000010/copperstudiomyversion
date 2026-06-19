import { useMemo, useState } from "react";
import { useNavigate } from "react-router-dom";
import {
  Eye, LayoutGrid, List, Mail, MoreVertical, Pencil, Phone,
  Plus, Search, SlidersHorizontal, Trash2
} from "lucide-react";
import { Avatar, Button } from "../../components/ui";
import { contacts as fallbackContacts } from "../../data/mockData";
import { useCrmRecords } from "../../hooks/useCrmRecords";
import SidePanel from "../../components/SidePanel";
import { useToast } from "../../components/useToast";

const TABS = ["All", "Paid", "Pending", "Failed"];
const PAYMENT_STATUSES = ["paid", "pending", "failed"];
const PAGE_SIZE = 10;

function StatusPill({ status = "pending" }) {
  const map = {
    paid: "bg-green-50 text-green-600 border border-green-200/55",
    pending: "bg-yellow-50 text-yellow-600 border border-yellow-200/55",
    failed: "bg-red-50 text-red-600 border border-red-200/55",
  };
  return (
    <span className={`inline-block rounded-full px-2.5 py-0.5 text-[11px] font-semibold capitalize ${map[status] ?? "bg-gray-100 text-gray-600"}`}>
      {status}
    </span>
  );
}

function Field({ label, value, onChange, placeholder = "" }) {
  return (
    <label className="block">
      <span className="text-xs font-semibold text-gray-600">{label}</span>
      <input
        value={value || ""}
        onChange={(e) => onChange(e.target.value)}
        placeholder={placeholder}
        className="mt-1.5 w-full rounded-lg border border-gray-200 px-3 py-2 text-sm outline-none focus:border-blue-400 focus:ring-2 focus:ring-blue-50"
      />
    </label>
  );
}

export default function Contacts() {
  const navigate = useNavigate();
  const [tab, setTab] = useState("All");
  const [view, setView] = useState("list");
  const [search, setSearch] = useState("");
  const [page, setPage] = useState(1);
  const [editing, setEditing] = useState(null);
  const { records: contacts, save, loading } = useCrmRecords("contacts", []);
  const { showToast } = useToast();

  const filtered = useMemo(() => {
    let result = contacts;
    if (tab !== "All") {
      result = result.filter((c) => {
        const currentStatus = c.payment?.status || "pending";
        return currentStatus.toLowerCase() === tab.toLowerCase();
      });
    }
    if (search) {
      result = result.filter((c) =>
        `${c.name} ${c.company} ${c.email} ${c.payment?.status || "pending"} ${c.package?.name || ""}`.toLowerCase().includes(search.toLowerCase())
      );
    }
    return result;
  }, [contacts, tab, search]);

  const totalPages = Math.max(1, Math.ceil(filtered.length / PAGE_SIZE));
  const paginated = filtered.slice((page - 1) * PAGE_SIZE, page * PAGE_SIZE);

  function startEditing(contact) {
    const initial = {
      name: "",
      firstName: "",
      lastName: "",
      company: "",
      email: "",
      phone: "",
      designation: "Client",
      linkedinUrl: "",
      companyWebsite: "",
      gstin: "",
      ...contact,
      payment: {
        status: "pending",
        ...(contact ? contact.payment : {})
      },
      package: {
        name: "",
        price: 0,
        ...(contact ? contact.package : {})
      },
      billingAddress: {
        line1: "",
        line2: "",
        state: "",
        city: "",
        pincode: "",
        ...(contact ? contact.billingAddress : {})
      }
    };

    if (!initial.firstName && !initial.lastName && initial.name) {
      const parts = initial.name.trim().split(/\s+/);
      initial.firstName = parts[0] || "";
      initial.lastName = parts.slice(1).join(" ") || "";
    }
    setEditing(initial);
  }

  async function saveContact(contact) {
    try {
      const isNew = !contact._id;
      await save({ ...contact, id: contact.id || `C-${Date.now()}` });
      setEditing(null);
      showToast({ title: isNew ? "Contact created" : "Contact updated", message: `${contact.name || "Contact"} saved successfully.` });
    } catch (err) {
      showToast({ type: "error", title: "Could not save contact", message: err.message });
    }
  }

  return (
    <div className="p-5 xl:p-6 bg-[#f9fafb] min-h-full">
      <div className="mb-4 flex items-center justify-between">
        <div>
          <h1 className="text-xl font-bold text-gray-900">Contacts</h1>
          <p className="text-sm text-gray-500">Manage your customer relationships</p>
        </div>
        <Button onClick={() => startEditing(null)}>
          <Plus size={14} /> New Contact
        </Button>
      </div>

      <div className="rounded-xl border border-gray-200 bg-[#f0ede4] shadow-sm">
        <div className="flex flex-wrap items-center gap-2 border-b border-gray-100 px-5 py-3">
          <div className="flex gap-1">
            {TABS.map((t) => (
              <button
                key={t}
                onClick={() => { setTab(t); setPage(1); }}
                className={`rounded-full px-3 py-1.5 text-xs font-semibold transition-colors ${tab === t ? "border-b-2 border-[#2563EB] text-[#2563EB] rounded-none pb-1" : "text-gray-500 hover:text-gray-700"}`}
              >
                {t}
              </button>
            ))}
          </div>
          <div className="ml-auto flex items-center gap-2">
            <div className="flex h-8 items-center gap-1.5 rounded-lg border border-gray-200 bg-gray-50 px-2.5 text-xs text-gray-500">
              <Search size={12} />
              <input
                className="w-44 bg-transparent outline-none placeholder:text-gray-400 text-xs"
                placeholder="Search by contact name, company, or status..."
                value={search}
                onChange={(e) => { setSearch(e.target.value); setPage(1); }}
              />
            </div>
            <button className="flex h-8 w-8 items-center justify-center rounded-lg border border-gray-200 text-gray-400 hover:bg-gray-50">
              <SlidersHorizontal size={13} />
            </button>
            <button
              onClick={() => setView("list")}
              className={`flex h-8 w-8 items-center justify-center rounded-lg border transition-colors ${view === "list" ? "border-[#2563EB] bg-blue-50 text-[#2563EB]" : "border-gray-200 text-gray-400 hover:bg-gray-50"}`}
            >
              <List size={13} />
            </button>
            <button
              onClick={() => setView("kanban")}
              className={`flex h-8 w-8 items-center justify-center rounded-lg border transition-colors ${view === "kanban" ? "border-[#2563EB] bg-blue-50 text-[#2563EB]" : "border-gray-200 text-gray-400 hover:bg-gray-50"}`}
            >
              <LayoutGrid size={13} />
            </button>
          </div>
        </div>

        {view === "list" ? (
          <>
            <div className="overflow-x-auto">
              <table className="w-full min-w-[700px]">
                <thead>
                  <tr className="bg-gray-50/70">
                    <th className="w-10 px-4 py-3">
                      <input type="checkbox" className="rounded border-gray-300" />
                    </th>
                    {[
                      ["Contact Name", "person"],
                      ["Company & Package", "building"],
                      ["Email", "mail"],
                      ["Phone", "phone"],
                      ["Payment Status", "badge"],
                      ["Actions", ""],
                    ].map(([h]) => (
                      <th key={h} className="px-4 py-3 text-left text-[11px] font-bold uppercase tracking-wider text-gray-400">{h}</th>
                    ))}
                  </tr>
                </thead>
                <tbody>
                  {paginated.map((c) => (
                    <tr key={c._id || c.id} className="border-t border-gray-100 hover:bg-gray-50/60">
                      <td className="px-4 py-3">
                        <input type="checkbox" className="rounded border-gray-300" />
                      </td>
                      <td className="px-4 py-3">
                        <div className="flex items-center gap-2.5">
                          <Avatar name={c.name} size="sm" />
                          <span className="text-sm font-semibold text-gray-900">{c.name}</span>
                        </div>
                      </td>
                      <td className="px-4 py-3 text-sm text-gray-600">
                        <div>{c.company}</div>
                        {c.package?.name && (
                          <div className="text-xs font-semibold text-blue-500 mt-0.5">{c.package.name}</div>
                        )}
                      </td>
                      <td className="px-4 py-3 text-sm text-gray-600">{c.email}</td>
                      <td className="px-4 py-3 text-sm text-gray-600">{c.phone}</td>
                      <td className="px-4 py-3"><StatusPill status={c.payment?.status || "pending"} /></td>
                      <td className="px-4 py-3">
                        <div className="flex items-center gap-2">
                          <button onClick={() => navigate(`/admin/contacts/${c._id || c.id}`)} className="text-gray-400 hover:text-blue-500"><Eye size={15} /></button>
                          <button onClick={() => startEditing(c)} className="text-gray-400 hover:text-blue-500"><Pencil size={14} /></button>
                          <button className="text-gray-400 hover:text-red-500"><Trash2 size={14} /></button>
                        </div>
                      </td>
                    </tr>
                  ))}
                  {paginated.length === 0 && (
                    <tr><td colSpan={7} className="py-12 text-center text-sm text-gray-400">No contacts found</td></tr>
                  )}
                </tbody>
              </table>
            </div>
            <div className="flex items-center justify-between border-t border-gray-100 px-5 py-3">
              <span className="text-xs text-gray-500">
                Showing {Math.min((page - 1) * PAGE_SIZE + 1, filtered.length)}–{Math.min(page * PAGE_SIZE, filtered.length)} of {filtered.length} Contacts
              </span>
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
            <div className="grid grid-cols-3 gap-4 min-w-[800px] overflow-x-auto">
              {PAYMENT_STATUSES.map((status) => {
                const statusContacts = contacts.filter((c) => (c.payment?.status || "pending") === status);
                return (
                  <div key={status} className="rounded-xl border border-gray-200 bg-gray-50/60 p-3">
                    <div className="mb-3 flex items-center justify-between">
                      <span className="text-sm font-bold text-gray-700 capitalize">{status} <span className="ml-1 text-gray-400">{statusContacts.length}</span></span>
                      <button className="text-gray-400"><MoreVertical size={14} /></button>
                    </div>
                    <div className="space-y-2">
                      {statusContacts.map((c) => (
                        <div key={c._id || c.id} className="rounded-xl border border-gray-200 bg-[#f0ede4] p-3 shadow-sm">
                          <div className="flex items-start justify-between">
                            <div className="flex items-center gap-2">
                              <Avatar name={c.name} size="sm" />
                              <div>
                                <p className="text-sm font-semibold text-gray-900">{c.name}</p>
                                <p className="text-xs text-gray-400">{c.company}</p>
                                {c.package?.name && (
                                  <p className="text-xs font-semibold text-blue-500 mt-0.5">{c.package.name}</p>
                                )}
                              </div>
                            </div>
                            <button className="text-gray-300"><MoreVertical size={13} /></button>
                          </div>
                          <div className="mt-2.5 space-y-1.5">
                            <div className="flex items-center gap-1.5 text-xs text-gray-500"><Phone size={11} />{c.phone || "+91 000000000"}</div>
                            <div className="flex items-center gap-1.5 text-xs text-gray-500"><Mail size={11} />{c.email || "email@example.com"}</div>
                          </div>
                        </div>
                      ))}
                      {statusContacts.length === 0 && (
                        <div className="py-6 text-center text-xs text-gray-300">No contacts</div>
                      )}
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
        )}
      </div>

      {editing && (
        <SidePanel
          title={editing._id ? "Edit contact" : "New Contact"}
          subtitle="Update contact profile and communication details."
          onClose={() => setEditing(null)}
          footer={
            <div className="flex justify-end gap-2">
              <Button variant="secondary" onClick={() => setEditing(null)}>Cancel</Button>
              <Button onClick={() => saveContact(editing)}>Save contact</Button>
            </div>
          }
        >
          <div className="space-y-6">
            <div>
              <h3 className="text-xs font-bold text-gray-400 uppercase tracking-wider mb-3">Personal Details</h3>
              <div className="grid gap-4 sm:grid-cols-2">
                <Field label="First Name" value={editing.firstName} onChange={(v) => setEditing(p => ({ ...p, firstName: v, name: `${v} ${p.lastName || ""}`.trim() }))} />
                <Field label="Last Name" value={editing.lastName} onChange={(v) => setEditing(p => ({ ...p, lastName: v, name: `${p.firstName || ""} ${v}`.trim() }))} />
                <Field label="Email" value={editing.email} onChange={(v) => setEditing(p => ({ ...p, email: v }))} />
                <Field label="Phone" value={editing.phone} onChange={(v) => setEditing(p => ({ ...p, phone: v }))} />
                <div className="sm:col-span-2">
                  <Field label="LinkedIn Profile URL" value={editing.linkedinUrl} onChange={(v) => setEditing(p => ({ ...p, linkedinUrl: v }))} />
                </div>
              </div>
            </div>

            <div className="border-t border-gray-100 pt-4">
              <h3 className="text-xs font-bold text-gray-400 uppercase tracking-wider mb-3">Company & Billing</h3>
              <div className="grid gap-4 sm:grid-cols-2">
                <Field label="Company Name" value={editing.company} onChange={(v) => setEditing(p => ({ ...p, company: v }))} />
                <Field label="Company Website" value={editing.companyWebsite} onChange={(v) => setEditing(p => ({ ...p, companyWebsite: v }))} />
                <div className="sm:col-span-2">
                  <Field label="GSTIN" value={editing.gstin} onChange={(v) => setEditing(p => ({ ...p, gstin: v }))} />
                </div>
                <div className="sm:col-span-2">
                  <Field label="Billing Address Line 1" value={editing.billingAddress?.line1} onChange={(v) => setEditing(p => ({ ...p, billingAddress: { ...(p.billingAddress || {}), line1: v } }))} />
                </div>
                <div className="sm:col-span-2">
                  <Field label="Billing Address Line 2" value={editing.billingAddress?.line2} onChange={(v) => setEditing(p => ({ ...p, billingAddress: { ...(p.billingAddress || {}), line2: v } }))} />
                </div>
                <Field label="City" value={editing.billingAddress?.city} onChange={(v) => setEditing(p => ({ ...p, billingAddress: { ...(p.billingAddress || {}), city: v } }))} />
                <Field label="State" value={editing.billingAddress?.state} onChange={(v) => setEditing(p => ({ ...p, billingAddress: { ...(p.billingAddress || {}), state: v } }))} />
                <div className="sm:col-span-2">
                  <Field label="Pincode" value={editing.billingAddress?.pincode} onChange={(v) => setEditing(p => ({ ...p, billingAddress: { ...(p.billingAddress || {}), pincode: v } }))} />
                </div>
              </div>
            </div>

            <div className="border-t border-gray-100 pt-4">
              <h3 className="text-xs font-bold text-gray-400 uppercase tracking-wider mb-3">Payment & Package</h3>
              <div className="grid gap-4 sm:grid-cols-2">
                <Field label="Designation" value={editing.designation} onChange={(v) => setEditing(p => ({ ...p, designation: v }))} />
                <label className="block">
                  <span className="text-xs font-semibold text-gray-600">Payment Status</span>
                  <select
                    value={editing.payment?.status || "pending"}
                    onChange={(e) => setEditing(p => ({ ...p, payment: { ...(p.payment || {}), status: e.target.value } }))}
                    className="mt-1.5 w-full rounded-lg border border-gray-200 px-3 py-2 text-sm outline-none focus:border-blue-400 focus:ring-2 focus:ring-blue-50 bg-[#f0ede4]"
                  >
                    <option value="pending">Pending</option>
                    <option value="paid">Paid</option>
                    <option value="failed">Failed</option>
                  </select>
                </label>
                <Field label="Package Name" value={editing.package?.name} onChange={(v) => setEditing(p => ({ ...p, package: { ...(p.package || {}), name: v } }))} />
                <Field label="Package Price (₹)" value={editing.package?.price} onChange={(v) => setEditing(p => ({ ...p, package: { ...(p.package || {}), price: Number(v) || 0 } }))} />
              </div>
            </div>
          </div>
        </SidePanel>
      )}
    </div>
  );
}
