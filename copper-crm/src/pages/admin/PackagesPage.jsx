import { useState } from "react";
import { PackageSearch, Plus, Trash2, Check, X, Tag, List } from "lucide-react";
import { Button } from "../../components/ui";
import { useCrmRecords } from "../../hooks/useCrmRecords";

function Card({ children, className = "" }) {
  return <section className={`rounded-xl border border-gray-200 bg-[#f0ede4] shadow-sm shadow-gray-100/60 ${className}`}>{children}</section>;
}

function PageShell({ title, subtitle, action, children }) {
  return (
    <div className="p-5 xl:p-6">
      <div className="mb-5 flex flex-col gap-3 lg:flex-row lg:items-end lg:justify-between">
        <div>
          <p className="text-xs font-bold uppercase tracking-[0.16em] text-gray-400">Admin / Services</p>
          <h1 className="mt-1 text-2xl font-bold tracking-tight text-gray-950">{title}</h1>
          <p className="mt-1 text-sm text-gray-500">{subtitle}</p>
        </div>
        {action}
      </div>
      {children}
    </div>
  );
}

export default function PackagesPage() {
  const { records: packages, loading, save, remove } = useCrmRecords("packages");
  const [editingId, setEditingId] = useState(null);
  const [editForm, setEditForm] = useState({});

  function handleEdit(pkg) {
    setEditingId(pkg._id || "new");
    setEditForm({ ...pkg });
  }

  async function handleSave() {
    if (!editForm.name || !editForm.customId) {
      alert("Name and Custom ID are required");
      return;
    }
    try {
      const payload = {
        ...editForm,
        includes: (editForm.includes || []).filter(inc => inc.trim() !== ""),
        addons: (editForm.addons || []).filter(addon => addon.name.trim() !== ""),
        _id: editForm._id !== "new" ? editForm._id : undefined
      };
      await save(payload);
      setEditingId(null);
      setEditForm({});
    } catch (err) {
      alert(err.message || "Failed to save package");
    }
  }

  function handleCancel() {
    setEditingId(null);
    setEditForm({});
  }

  async function handleDelete(pkg) {
    if (confirm(`Are you sure you want to delete ${pkg.name}?`)) {
      await remove(pkg._id);
    }
  }

  function addInclude() {
    setEditForm({ ...editForm, includes: [...(editForm.includes || []), ""] });
  }

  function updateInclude(index, value) {
    const newIncludes = [...editForm.includes];
    newIncludes[index] = value;
    setEditForm({ ...editForm, includes: newIncludes });
  }

  function removeInclude(index) {
    const newIncludes = editForm.includes.filter((_, i) => i !== index);
    setEditForm({ ...editForm, includes: newIncludes });
  }

  function addAddon() {
    setEditForm({ ...editForm, addons: [...(editForm.addons || []), { name: "", price: 0 }] });
  }

  function updateAddon(index, field, value) {
    const newAddons = [...editForm.addons];
    newAddons[index] = { ...newAddons[index], [field]: field === "price" ? Number(value) : value };
    setEditForm({ ...editForm, addons: newAddons });
  }

  function removeAddon(index) {
    const newAddons = editForm.addons.filter((_, i) => i !== index);
    setEditForm({ ...editForm, addons: newAddons });
  }

  return (
    <PageShell
      title="Pricing Packages"
      subtitle="Manage standard packages, what's included, and available add-ons."
      action={
        !editingId && (
          <Button onClick={() => handleEdit({ customId: "", name: "", label: "", price: 0, duration: "", includes: [], addons: [] })}>
            <Plus size={16} /> New Package
          </Button>
        )
      }
    >
      {editingId ? (
        <Card className="p-5 max-w-4xl">
          <div className="flex items-center justify-between border-b border-gray-100 pb-4 mb-5">
            <h3 className="text-lg font-bold text-gray-900">{editForm._id === "new" ? "Create Package" : "Edit Package"}</h3>
            <div className="flex gap-2">
              <Button variant="secondary" onClick={handleCancel}><X size={16} /> Cancel</Button>
              <Button onClick={handleSave}><Check size={16} /> Save Package</Button>
            </div>
          </div>
          <div className="grid gap-5 md:grid-cols-2">
            <div>
              <label className="block text-sm font-bold text-gray-700 mb-1">Package Name</label>
              <input type="text" className="w-full rounded-lg border border-gray-200 p-2 text-sm outline-none focus:border-blue-500 focus:ring-1 focus:ring-blue-500" value={editForm.name || ""} onChange={(e) => setEditForm({ ...editForm, name: e.target.value })} placeholder="e.g. Starter Studio" />
            </div>
            <div>
              <label className="block text-sm font-bold text-gray-700 mb-1">Internal ID (customId)</label>
              <input type="text" className="w-full rounded-lg border border-gray-200 p-2 text-sm outline-none focus:border-blue-500 focus:ring-1 focus:ring-blue-500" value={editForm.customId || ""} onChange={(e) => setEditForm({ ...editForm, customId: e.target.value })} placeholder="e.g. starter" disabled={editingId !== "new"} />
            </div>
            <div>
              <label className="block text-sm font-bold text-gray-700 mb-1">Price (INR)</label>
              <input type="number" className="w-full rounded-lg border border-gray-200 p-2 text-sm outline-none focus:border-blue-500 focus:ring-1 focus:ring-blue-500" value={editForm.price || 0} onChange={(e) => setEditForm({ ...editForm, price: Number(e.target.value) })} />
            </div>
            <div>
              <label className="block text-sm font-bold text-gray-700 mb-1">Duration Label</label>
              <input type="text" className="w-full rounded-lg border border-gray-200 p-2 text-sm outline-none focus:border-blue-500 focus:ring-1 focus:ring-blue-500" value={editForm.duration || ""} onChange={(e) => setEditForm({ ...editForm, duration: e.target.value })} placeholder="e.g. 30 days setup" />
            </div>
            <div className="md:col-span-2">
              <label className="block text-sm font-bold text-gray-700 mb-1">Subtitle / Tagline (Label)</label>
              <input type="text" className="w-full rounded-lg border border-gray-200 p-2 text-sm outline-none focus:border-blue-500 focus:ring-1 focus:ring-blue-500" value={editForm.label || ""} onChange={(e) => setEditForm({ ...editForm, label: e.target.value })} placeholder="e.g. Most selected" />
            </div>
          </div>

          <div className="mt-8 border-t border-gray-100 pt-5">
            <div className="flex items-center justify-between mb-3">
              <h4 className="font-bold text-gray-900 flex items-center gap-2"><List size={16} className="text-blue-600"/> Included Features</h4>
              <Button variant="secondary" onClick={addInclude} className="h-8 text-xs"><Plus size={14} /> Add Feature</Button>
            </div>
            <div className="space-y-2">
              {(editForm.includes || []).map((inc, i) => (
                <div key={i} className="flex items-center gap-2">
                  <input type="text" className="flex-1 rounded-lg border border-gray-200 p-2 text-sm outline-none focus:border-blue-500 focus:ring-1 focus:ring-blue-500" value={inc} onChange={(e) => updateInclude(i, e.target.value)} placeholder="Feature description" />
                  <button onClick={() => removeInclude(i)} className="p-2 text-red-500 hover:bg-red-50 rounded-lg"><Trash2 size={16} /></button>
                </div>
              ))}
              {(!editForm.includes || editForm.includes.length === 0) && <p className="text-sm text-gray-400 italic">No features added yet.</p>}
            </div>
          </div>

          <div className="mt-8 border-t border-gray-100 pt-5">
            <div className="flex items-center justify-between mb-3">
              <h4 className="font-bold text-gray-900 flex items-center gap-2"><Tag size={16} className="text-purple-600"/> Add-ons (Optional)</h4>
              <Button variant="secondary" onClick={addAddon} className="h-8 text-xs"><Plus size={14} /> Add Add-on</Button>
            </div>
            <div className="space-y-2">
              {(editForm.addons || []).map((addon, i) => (
                <div key={i} className="flex items-center gap-2">
                  <input type="text" className="flex-1 rounded-lg border border-gray-200 p-2 text-sm outline-none focus:border-blue-500 focus:ring-1 focus:ring-blue-500" value={addon.name} onChange={(e) => updateAddon(i, "name", e.target.value)} placeholder="Add-on name" />
                  <div className="relative w-32">
                    <span className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-500 text-sm">₹</span>
                    <input type="number" className="w-full rounded-lg border border-gray-200 p-2 pl-7 text-sm outline-none focus:border-blue-500 focus:ring-1 focus:ring-blue-500" value={addon.price} onChange={(e) => updateAddon(i, "price", e.target.value)} />
                  </div>
                  <button onClick={() => removeAddon(i)} className="p-2 text-red-500 hover:bg-red-50 rounded-lg"><Trash2 size={16} /></button>
                </div>
              ))}
              {(!editForm.addons || editForm.addons.length === 0) && <p className="text-sm text-gray-400 italic">No add-ons available for this package.</p>}
            </div>
          </div>
        </Card>
      ) : (
        <div className="grid gap-5 md:grid-cols-2 lg:grid-cols-3">
          {loading ? (
            <div className="p-5 text-gray-500">Loading packages...</div>
          ) : packages.length === 0 ? (
            <div className="p-5 text-gray-500 col-span-3 text-center border-2 border-dashed border-gray-200 rounded-xl py-12">
              <PackageSearch className="mx-auto text-gray-400 mb-3" size={32} />
              <p>No packages found. Add one to get started.</p>
            </div>
          ) : (
            packages.map((pkg) => (
              <Card key={pkg._id} className="flex flex-col">
                <div className="p-5 border-b border-gray-100">
                  <div className="flex items-start justify-between">
                    <div>
                      <p className="text-xs font-bold text-gray-400 uppercase tracking-wider">{pkg.label || "Package"}</p>
                      <h3 className="text-lg font-bold text-gray-900 mt-1">{pkg.name}</h3>
                    </div>
                    <div className="bg-gray-100 text-gray-600 text-xs font-mono px-2 py-1 rounded">{pkg.customId}</div>
                  </div>
                  <p className="text-2xl font-black text-blue-600 mt-3">₹{pkg.price.toLocaleString("en-IN")}</p>
                  <p className="text-sm text-gray-500 mt-1">{pkg.duration}</p>
                </div>
                <div className="p-5 flex-1">
                  <p className="text-xs font-bold text-gray-900 uppercase tracking-wider mb-3">Includes</p>
                  <ul className="space-y-2 mb-5">
                    {(pkg.includes || []).map((inc, i) => (
                      <li key={i} className="text-sm text-gray-600 flex items-start gap-2">
                        <Check size={16} className="text-green-500 shrink-0 mt-0.5" /> {inc}
                      </li>
                    ))}
                  </ul>

                  {(pkg.addons && pkg.addons.length > 0) && (
                    <>
                      <p className="text-xs font-bold text-gray-900 uppercase tracking-wider mb-3">Add-ons</p>
                      <ul className="space-y-2">
                        {pkg.addons.map((addon, i) => (
                          <li key={i} className="text-sm text-gray-600 flex items-center justify-between bg-gray-50 p-2 rounded-lg">
                            <span>{addon.name}</span>
                            <span className="font-bold text-gray-900">+₹{addon.price.toLocaleString("en-IN")}</span>
                          </li>
                        ))}
                      </ul>
                    </>
                  )}
                </div>
                <div className="p-4 border-t border-gray-100 bg-gray-50 flex justify-end gap-2 rounded-b-xl mt-auto">
                  <Button variant="secondary" className="text-red-600 hover:bg-red-50 hover:border-red-100" onClick={() => handleDelete(pkg)}>Delete</Button>
                  <Button onClick={() => handleEdit(pkg)}>Edit Package</Button>
                </div>
              </Card>
            ))
          )}
        </div>
      )}
    </PageShell>
  );
}
