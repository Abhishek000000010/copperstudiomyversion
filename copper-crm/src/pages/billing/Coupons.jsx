import { useState } from "react";
import { Plus, Tag, MoreHorizontal, Copy } from "lucide-react";
import { Button, StatusBadge, SectionCard } from "../../components/ui";
import { coupons } from "../../data/mockData";

export default function Coupons() {
  const [copied, setCopied] = useState(null);

  function handleCopy(code) {
    navigator.clipboard.writeText(code);
    setCopied(code);
    setTimeout(() => setCopied(null), 1500);
  }

  return (
    <div className="p-6">
      <div className="flex items-center justify-between mb-5">
        <div>
          <h1 className="text-base font-semibold text-gray-900">Coupons</h1>
          <p className="text-xs text-gray-400 mt-0.5">{coupons.length} discount codes</p>
        </div>
        <Button><Plus size={13} strokeWidth={2.5} /> Create Coupon</Button>
      </div>

      <div className="grid grid-cols-2 gap-4">
        {coupons.map((c) => {
          const pct = Math.round((c.used / c.limit) * 100);
          const isExpired = c.status === "Expired";
          return (
            <SectionCard key={c.id}>
              <div className="p-5 group cursor-pointer hover:shadow-sm transition-shadow">
                <div className="flex items-start justify-between mb-4">
                  <div className="flex items-center gap-3">
                    <div className={`w-9 h-9 rounded-xl flex items-center justify-center ${isExpired ? "bg-gray-100" : "bg-blue-50"}`}>
                      <Tag size={16} className={isExpired ? "text-gray-400" : "text-[#2563EB]"} />
                    </div>
                    <div>
                      <div className="flex items-center gap-2">
                        <span className="text-sm font-bold text-gray-900 font-mono">{c.code}</span>
                        <button onClick={() => handleCopy(c.code)} className="text-gray-300 hover:text-[#2563EB] transition-colors">
                          <Copy size={11} />
                        </button>
                        {copied === c.code && <span className="text-[10px] text-emerald-500 font-semibold">Copied!</span>}
                      </div>
                      <p className="text-[11px] text-gray-400 mt-0.5">{c.type} discount</p>
                    </div>
                  </div>
                  <div className="flex items-center gap-2">
                    <StatusBadge status={c.status} />
                    <button className="opacity-0 group-hover:opacity-100 text-gray-300 hover:text-gray-500 transition-all">
                      <MoreHorizontal size={14} />
                    </button>
                  </div>
                </div>

                <div className="flex items-center gap-5 mb-4">
                  <div>
                    <p className="text-xl font-bold text-gray-900">{c.value}</p>
                    <p className="text-[10px] text-gray-400 mt-0.5">Discount</p>
                  </div>
                  <div className="w-px h-8 bg-gray-100" />
                  <div>
                    <p className="text-base font-bold text-gray-900">{c.used} <span className="text-gray-400 text-xs font-normal">/ {c.limit}</span></p>
                    <p className="text-[10px] text-gray-400 mt-0.5">Used</p>
                  </div>
                  <div className="w-px h-8 bg-gray-100" />
                  <div>
                    <p className="text-xs font-semibold text-gray-600">{c.expiry}</p>
                    <p className="text-[10px] text-gray-400 mt-0.5">Expires</p>
                  </div>
                </div>

                <div>
                  <div className="flex justify-between text-[10px] text-gray-400 mb-1.5">
                    <span>Usage</span>
                    <span className="font-bold text-gray-600">{pct}%</span>
                  </div>
                  <div className="h-1 bg-gray-100 rounded-full overflow-hidden">
                    <div
                      className={`h-full rounded-full ${pct >= 90 ? "bg-red-400" : pct >= 60 ? "bg-amber-400" : "bg-[#2563EB]"}`}
                      style={{ width: `${pct}%` }}
                    />
                  </div>
                </div>
              </div>
            </SectionCard>
          );
        })}
      </div>
    </div>
  );
}
