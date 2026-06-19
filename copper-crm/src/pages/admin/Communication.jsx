import { useMemo, useRef, useState } from "react";
import {
  Bold, Italic, Link2, List, Mail, MessageCircle, Monitor, Plus,
  Save, Smartphone, Sparkles, Variable,
} from "lucide-react";
import { Button } from "../../components/ui";
import { communicationPreviewSample, communicationTemplates, communicationVariables } from "../../data/mockData";
import { useToast } from "../../components/useToast";

const CATEGORY_ORDER = ["Welcome", "Proposal", "Payment Success", "Project Started", "Reminder"];

function Card({ children, className = "" }) {
  return <section className={`rounded-xl border border-gray-200 bg-[#f0ede4] shadow-sm shadow-gray-100/60 ${className}`}>{children}</section>;
}

function substitute(text, sample) {
  return (text || "").replace(/{{\s*(\w+)\s*}}/g, (match, key) => sample[key] ?? match);
}

export default function Communication() {
  const { showToast } = useToast();
  const [templates, setTemplates] = useState(communicationTemplates);
  const categories = useMemo(() => {
    const present = new Set(templates.map((t) => t.category));
    return CATEGORY_ORDER.filter((cat) => present.has(cat));
  }, [templates]);

  const [selectedCategory, setSelectedCategory] = useState(categories[0]);
  const [selectedId, setSelectedId] = useState(templates[0].id);
  const [channel, setChannel] = useState("email");
  const [device, setDevice] = useState("desktop");
  const bodyRef = useRef(null);

  const templatesInCategory = useMemo(
    () => templates.filter((t) => t.category === selectedCategory),
    [templates, selectedCategory]
  );
  const selected = templates.find((t) => t.id === selectedId) || templates[0];

  function selectCategory(category) {
    setSelectedCategory(category);
    const first = templates.find((t) => t.category === category);
    if (first) setSelectedId(first.id);
  }

  function updateField(field, value) {
    setTemplates((current) => current.map((t) => {
      if (t.id !== selectedId) return t;
      return channel === "email"
        ? { ...t, email: { ...t.email, [field]: value } }
        : { ...t, whatsapp: { ...t.whatsapp, [field]: value } };
    }));
  }

  function insertVariable(token) {
    const textarea = bodyRef.current;
    const value = channel === "email" ? selected.email.body : selected.whatsapp.body;
    if (!textarea) {
      updateField("body", `${value}${token}`);
      return;
    }
    const start = textarea.selectionStart ?? value.length;
    const end = textarea.selectionEnd ?? value.length;
    const next = `${value.slice(0, start)}${token}${value.slice(end)}`;
    updateField("body", next);
    requestAnimationFrame(() => {
      textarea.focus();
      textarea.setSelectionRange(start + token.length, start + token.length);
    });
  }

  function duplicateTemplate() {
    const copy = {
      ...selected,
      id: `${selected.id}-copy-${Date.now()}`,
      name: `${selected.name} (Copy)`,
      status: "Draft",
      sentCount: 0,
    };
    setTemplates((current) => [...current, copy]);
    setSelectedId(copy.id);
    showToast({ title: "Template duplicated", message: `${copy.name} is ready to edit.` });
  }

  function saveChanges() {
    showToast({ title: "Template saved", message: `${selected.name} has been updated.` });
  }

  const subject = channel === "email" ? selected.email.subject : "";
  const body = channel === "email" ? selected.email.body : selected.whatsapp.body;
  const previewSubject = substitute(subject, communicationPreviewSample);
  const previewBody = substitute(body, communicationPreviewSample);
  const previewEmail = `${communicationPreviewSample.client_name.toLowerCase().replace(" ", ".")}@client.com`;

  return (
    <div className="space-y-6">
      <div className="flex flex-wrap items-end justify-between gap-4">
        <div>
          <nav className="mb-2 flex gap-2 text-[11px] font-bold uppercase tracking-wider text-gray-400">
            <span>Communication</span>
            <span>/</span>
            <span className="text-[#2563EB]">{selectedCategory} Templates</span>
          </nav>
          <h1 className="text-2xl font-bold tracking-tight text-gray-950">{selected.name}</h1>
          {templatesInCategory.length > 1 && (
            <div className="mt-3 flex flex-wrap gap-2">
              {templatesInCategory.map((t) => (
                <button
                  key={t.id}
                  type="button"
                  onClick={() => setSelectedId(t.id)}
                  className={`rounded-full border px-3 py-1 text-xs font-bold transition-colors ${
                    t.id === selectedId ? "border-[#2563EB] bg-blue-50 text-[#2563EB]" : "border-gray-200 text-gray-500 hover:bg-gray-50"
                  }`}
                >
                  {t.name}
                </button>
              ))}
            </div>
          )}
        </div>
        <div className="flex gap-3">
          <Button variant="secondary" onClick={duplicateTemplate}><Plus size={14} /> Duplicate</Button>
          <Button onClick={saveChanges}><Save size={14} /> Save Changes</Button>
        </div>
      </div>

      <div className="grid grid-cols-12 gap-6">
        <div className="col-span-12 space-y-6 lg:col-span-3">
          <Card className="p-5">
            <h2 className="mb-4 text-sm font-bold text-gray-950">Categories</h2>
            <div className="space-y-2">
              {categories.map((category) => {
                const count = templates.filter((t) => t.category === category).length;
                const isActive = category === selectedCategory;
                return (
                  <button
                    key={category}
                    type="button"
                    onClick={() => selectCategory(category)}
                    className={`flex w-full items-center justify-between rounded-lg px-4 py-2.5 text-left text-sm font-medium transition-colors ${
                      isActive ? "bg-[#2563EB] text-[#f0ede4]" : "text-gray-500 hover:bg-gray-50"
                    }`}
                  >
                    <span>{category}</span>
                    <span className={`rounded px-1.5 text-[10px] ${isActive ? "bg-[#f0ede4]/20" : "bg-gray-100 text-gray-500"}`}>{count}</span>
                  </button>
                );
              })}
            </div>
          </Card>

          <Card className="bg-gray-50 p-5">
            <div className="mb-4 flex items-center gap-3">
              <div className="grid h-10 w-10 shrink-0 place-items-center rounded-lg bg-emerald-100 text-emerald-600">
                <Sparkles size={18} />
              </div>
              <div>
                <p className="text-xs font-bold text-gray-950">Auto-Sync</p>
                <p className="text-[10px] text-gray-400">Connected to HubSpot</p>
              </div>
            </div>
            <button
              type="button"
              onClick={() => showToast({ title: "Integration settings", message: "HubSpot sync management is coming soon." })}
              className="w-full rounded-lg border border-gray-200 bg-[#f0ede4] py-2 text-xs font-bold text-gray-600 hover:bg-gray-50"
            >
              Manage Integration
            </button>
          </Card>
        </div>

        <div className="col-span-12 space-y-6 lg:col-span-5">
          <Card className="p-6">
            <div className="mb-6 flex gap-4">
              <button
                type="button"
                onClick={() => setChannel("email")}
                className={`flex flex-1 items-center justify-center gap-2 rounded-lg py-2 text-sm font-bold ${channel === "email" ? "bg-gray-100 text-[#2563EB]" : "text-gray-400 hover:bg-gray-50"}`}
              >
                <Mail size={16} /> Email
              </button>
              <button
                type="button"
                onClick={() => setChannel("whatsapp")}
                className={`flex flex-1 items-center justify-center gap-2 rounded-lg py-2 text-sm font-bold ${channel === "whatsapp" ? "bg-gray-100 text-emerald-600" : "text-gray-400 hover:bg-gray-50"}`}
              >
                <MessageCircle size={16} /> WhatsApp
              </button>
            </div>

            <div className="space-y-4">
              {channel === "email" && (
                <label className="block">
                  <span className="mb-1.5 block text-xs font-bold text-gray-600">Subject Line</span>
                  <input
                    value={selected.email.subject}
                    onChange={(event) => updateField("subject", event.target.value)}
                    className="w-full rounded-lg border border-gray-200 bg-gray-50 px-4 py-3 text-sm outline-none focus:border-blue-300 focus:ring-4 focus:ring-blue-50"
                  />
                </label>
              )}

              <div>
                <span className="mb-1.5 block text-xs font-bold text-gray-600">Message Body</span>
                <div className="overflow-hidden rounded-lg border border-gray-200">
                  <div className="flex gap-4 border-b border-gray-100 bg-gray-50 px-4 py-2">
                    <Bold size={16} className="text-gray-400 hover:text-[#2563EB]" />
                    <Italic size={16} className="text-gray-400 hover:text-[#2563EB]" />
                    <Link2 size={16} className="text-gray-400 hover:text-[#2563EB]" />
                    <List size={16} className="text-gray-400 hover:text-[#2563EB]" />
                    <div className="mt-1 h-4 w-px bg-gray-200" />
                    <Variable size={16} className="text-gray-400 hover:text-[#2563EB]" />
                  </div>
                  <textarea
                    ref={bodyRef}
                    rows={12}
                    value={body}
                    onChange={(event) => updateField("body", event.target.value)}
                    className="w-full border-none px-4 py-4 text-sm leading-relaxed outline-none focus:ring-0"
                  />
                </div>
              </div>
            </div>
          </Card>

          <Card className="bg-gray-50 p-4">
            <h3 className="mb-3 text-[11px] font-bold uppercase tracking-wider text-gray-400">Dynamic Variables</h3>
            <div className="flex flex-wrap gap-2">
              {communicationVariables.map((variable) => (
                <button
                  key={variable}
                  type="button"
                  onClick={() => insertVariable(`{{${variable}}}`)}
                  className="rounded-full border border-gray-200 bg-[#f0ede4] px-3 py-1 text-xs font-semibold text-gray-600 transition-colors hover:border-[#2563EB] hover:text-[#2563EB]"
                >
                  {variable}
                </button>
              ))}
            </div>
          </Card>
        </div>

        <div className="col-span-12 lg:col-span-4">
          <div className="space-y-6 lg:sticky lg:top-10">
            <div className="mx-auto flex w-fit rounded-full bg-gray-100 p-1">
              <button
                type="button"
                onClick={() => setDevice("desktop")}
                className={`flex items-center gap-2 rounded-full px-4 py-1.5 text-xs font-bold ${device === "desktop" ? "bg-[#f0ede4] text-gray-900 shadow-sm" : "text-gray-400"}`}
              >
                <Monitor size={16} /> Desktop
              </button>
              <button
                type="button"
                onClick={() => setDevice("mobile")}
                className={`flex items-center gap-2 rounded-full px-4 py-1.5 text-xs font-bold ${device === "mobile" ? "bg-[#f0ede4] text-gray-900 shadow-sm" : "text-gray-400"}`}
              >
                <Smartphone size={16} /> Mobile
              </button>
            </div>

            <div className={`mx-auto overflow-hidden rounded-2xl border border-gray-200 bg-[#f0ede4] shadow-xl transition-all ${device === "mobile" ? "max-w-[340px]" : "max-w-full"}`}>
              {channel === "email" ? (
                <>
                  <div className="border-b border-gray-100 bg-gray-50 px-6 py-4">
                    <div className="mb-2 flex gap-2">
                      <div className="h-3 w-3 rounded-full bg-red-400" />
                      <div className="h-3 w-3 rounded-full bg-yellow-400" />
                      <div className="h-3 w-3 rounded-full bg-green-400" />
                    </div>
                    <div className="text-[12px] text-gray-400">To: {previewEmail}</div>
                    <div className="text-sm font-bold text-gray-900">{previewSubject}</div>
                  </div>
                  <div className="min-h-[420px] space-y-4 p-8 text-sm leading-relaxed text-gray-900">
                    {previewBody.split("\n").map((line, index) => (
                      <p key={index} className={line ? "" : "h-2"}>{line}</p>
                    ))}
                    {body.includes("{{portal_link}}") && (
                      <a href={communicationPreviewSample.portal_link} className="inline-block rounded-lg bg-[#2563EB] px-6 py-3 text-sm font-bold text-[#f0ede4]">
                        Access Client Portal
                      </a>
                    )}
                  </div>
                </>
              ) : (
                <div className="min-h-[420px] bg-[#e5ddd5] p-6">
                  <div className="max-w-[85%] rounded-lg rounded-tl-none bg-[#f0ede4] px-4 py-3 text-sm leading-relaxed text-gray-900 shadow-sm">
                    {previewBody.split("\n").map((line, index) => <p key={index}>{line}</p>)}
                  </div>
                </div>
              )}
            </div>

            <p className="text-center text-[11px] text-gray-400">
              This is a real-time rendering of your current draft
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}
