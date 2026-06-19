import { useState } from "react";
import { useNavigate, useParams } from "react-router-dom";
import { Building2, ChevronLeft, Mail, MapPin, Pencil, Phone, Plus, Trash2, Globe, Link } from "lucide-react";
import { Avatar, Button } from "../../components/ui";
import { useCrmRecords } from "../../hooks/useCrmRecords";

export default function ContactDetail() {
  const { contactId } = useParams();
  const navigate = useNavigate();
  const { records: contacts } = useCrmRecords("contacts", []);
  const contact = contacts.find((c) => (c._id || c.id) === contactId) || {};
  const [activeTab, setActiveTab] = useState("overview");

  const associated = contacts.filter((c) => c.company && contact.company && c.company === contact.company && (c._id || c.id) !== contactId).slice(0, 2);

  return (
    <div className="p-5 xl:p-6 bg-[#f9fafb] min-h-full">
      <div className="mb-4 flex items-center justify-between rounded-xl border border-gray-200 bg-[#f0ede4] px-5 py-3 shadow-sm">
        <div className="flex items-center gap-2 text-sm text-gray-500">
          <button onClick={() => navigate(-1)} className="flex items-center gap-1 font-semibold text-gray-700 hover:text-gray-900">
            <ChevronLeft size={16} /> {contact.name || "Contact Name"}
          </button>
          {contact.status && (
            <span className="ml-2 text-xs text-gray-400">» {contact.status}</span>
          )}
        </div>
        <div className="flex items-center gap-2">
          <Button variant="secondary" size="sm">
            <Pencil size={13} /> Edit
          </Button>
          <button className="flex items-center gap-1.5 rounded-lg border border-red-200 bg-red-50 px-3 py-1.5 text-xs font-semibold text-red-600 hover:bg-red-100">
            <Trash2 size={13} /> Delete Contact
          </button>
        </div>
      </div>

      <div className="rounded-xl border border-gray-200 bg-[#f0ede4] shadow-sm">
        <div className="grid grid-cols-3 gap-6 border-b border-gray-100 p-5">
          <div className="col-span-1">
            <div className="flex items-center gap-3 mb-4">
              <Avatar name={contact.name} size="lg" />
              <p className="text-lg font-bold text-gray-900">{contact.name || "Contact Full Name Here"}</p>
            </div>
            {contact.package?.name && (
              <div className="rounded-xl border border-gray-200 bg-gray-50/60 p-3 mb-3">
                <p className="text-xs text-gray-400 mb-1">Selected Package</p>
                <p className="text-base font-bold text-gray-900">{contact.package.name}</p>
                <p className="text-xs font-semibold text-gray-500 mt-0.5">₹{contact.package.price?.toLocaleString("en-IN") || "0"}</p>
              </div>
            )}
          </div>

          <div className="col-span-1">
            <p className="mb-3 text-sm font-bold text-gray-700">Contact Details</p>
            <div className="grid grid-cols-2 gap-x-6 gap-y-3">
              <div>
                <p className="text-[11px] text-gray-400">Email</p>
                <div className="flex items-center gap-1.5 text-sm text-gray-700"><Mail size={13} className="text-gray-400" />{contact.email || "email@gmail.com"}</div>
              </div>
              <div>
                <p className="text-[11px] text-gray-400">Phone</p>
                <div className="flex items-center gap-1.5 text-sm text-gray-700"><Phone size={13} className="text-gray-400" />{contact.phone || "+91 123456789"}</div>
              </div>
              <div>
                <p className="text-[11px] text-gray-400">Company</p>
                <div className="flex items-center gap-1.5 text-sm text-gray-700"><Building2 size={13} className="text-gray-400" />{contact.company || "Company Name"}</div>
              </div>
              <div>
                <p className="text-[11px] text-gray-400">Payment Status</p>
                <p className="text-sm font-semibold text-gray-700 capitalize">{contact.payment?.status || "pending"}</p>
              </div>
              {contact.linkedinUrl && (
                <div className="col-span-2">
                  <p className="text-[11px] text-gray-400">LinkedIn Profile</p>
                  <a href={contact.linkedinUrl} target="_blank" rel="noreferrer" className="flex items-center gap-1.5 text-xs text-blue-600 hover:underline">
                    <Link size={12} className="text-blue-500 shrink-0" />
                    <span className="truncate">{contact.linkedinUrl}</span>
                  </a>
                </div>
              )}
              {contact.companyWebsite && (
                <div className="col-span-2">
                  <p className="text-[11px] text-gray-400">Company Website</p>
                  <a href={contact.companyWebsite} target="_blank" rel="noreferrer" className="flex items-center gap-1.5 text-xs text-blue-600 hover:underline">
                    <Globe size={12} className="text-blue-500 shrink-0" />
                    <span className="truncate">{contact.companyWebsite}</span>
                  </a>
                </div>
              )}
              {contact.gstin && (
                <div>
                  <p className="text-[11px] text-gray-400">GSTIN</p>
                  <p className="text-sm text-gray-700 font-medium uppercase">{contact.gstin}</p>
                </div>
              )}
              {contact.billingAddress?.line1 && (
                <div className="col-span-2">
                  <p className="text-[11px] text-gray-400">Billing Address</p>
                  <p className="text-xs text-gray-600 leading-relaxed bg-gray-50 rounded-lg p-2 border border-gray-100">
                    {contact.billingAddress.line1}
                    {contact.billingAddress.line2 ? `, ${contact.billingAddress.line2}` : ""}
                    {`, ${contact.billingAddress.city}, ${contact.billingAddress.state} - ${contact.billingAddress.pincode}`}
                  </p>
                </div>
              )}
            </div>
          </div>

          <div className="col-span-1">
            <p className="mb-3 text-sm font-bold text-gray-700">Associated Contacts</p>
            <div className="space-y-3">
              {associated.length > 0 ? associated.map((ac) => (
                <div key={ac._id || ac.id} className="flex items-center gap-2.5">
                  <Avatar name={ac.name} size="sm" />
                  <div>
                    <p className="text-sm font-semibold text-gray-800">{ac.name}</p>
                    <p className="text-xs text-gray-400">Contact created on {new Date().toLocaleDateString("en-US", { month: "long", day: "2-digit", year: "numeric" })}</p>
                  </div>
                </div>
              )) : (
                <div className="flex items-center gap-2.5">
                  <div className="h-8 w-8 rounded-full bg-gray-200" />
                  <div>
                    <p className="text-sm font-semibold text-gray-800">Associated Contact Name</p>
                    <p className="text-xs text-gray-400">Contact created on June 06th, 2026</p>
                  </div>
                </div>
              )}
            </div>
          </div>
        </div>

        <div className="p-5">
          <div className="flex gap-4 border-b border-gray-100 mb-5">
            {["overview", "notes"].map((t) => (
              <button
                key={t}
                onClick={() => setActiveTab(t)}
                className={`pb-2 text-sm font-semibold capitalize transition-colors ${activeTab === t ? "border-b-2 border-[#2563EB] text-[#2563EB]" : "text-gray-400 hover:text-gray-600"}`}
              >
                {t}
              </button>
            ))}
          </div>
          {activeTab === "overview" && (
            <div className="text-sm text-gray-400 text-center py-10">Activity timeline will appear here.</div>
          )}
          {activeTab === "notes" && (
            <div className="text-sm text-gray-400 text-center py-10">{contact.notes || "No notes for this contact."}</div>
          )}
        </div>
      </div>
    </div>
  );
}
