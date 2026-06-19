const fs = require('fs');
let c = fs.readFileSync('copper-crm/src/layouts/ClientLayout.jsx', 'utf8');

const replacements = {
  'bg-[#f5f6fa]': 'bg-[#f0ede4]',
  'bg-[#111827]': 'bg-[#1a1a1a]',
  'border-white/8': 'border-white/[0.08]',
  'bg-[#331405]/15 text-[#331405]': 'bg-[#382a22] text-white',
  'text-[#9ca3af] hover:bg-[#f0ede4]/6 hover:text-[#f0ede4]': 'text-[#a0a0a0] hover:bg-white/[0.06] hover:text-white',
  'h-5 w-[3px] rounded-r-full bg-[#331405]': 'top-0 bottom-0 w-[3px] bg-[#c57e5b]',
  '<item.icon size={17} strokeWidth={1.8} className="shrink-0" />': '<item.icon size={17} strokeWidth={1.8} className={`shrink-0 ${isActive ? "text-[#c57e5b]" : ""}`} />',
  'text-[#f0ede4] text-sm font-bold truncate': 'text-white text-[13px] font-bold truncate leading-tight',
  'text-[#6b7280] text-[10px] truncate">Client Portal': 'text-[#c57e5b] text-[10px] font-medium uppercase tracking-[0.1em] truncate">Client Portal',
  'bg-[#331405] flex items-center justify-center text-[#f0ede4] font-bold text-sm">CS': 'bg-[#331405] flex items-center justify-center text-white font-bold text-xs tracking-wide">CS',
  'text-[#6b7280] hover:text-[#f0ede4]': 'text-[#777] hover:text-white',
  'text-[#6b7280]">Navigation': 'text-[#666]">Navigation',
  'bg-[#331405]': 'bg-[#c57e5b]',
  'text-[#f0ede4] text-xs font-bold': 'text-white text-[11px] font-bold',
  'text-[#f0ede4] text-xs font-semibold truncate': 'text-white text-xs font-semibold truncate',
  'text-[#6b7280] text-[10px] truncate': 'text-[#777] text-[10px] truncate',
  'text-[#6b7280] hover:bg-[#f0ede4]/8 hover:text-[#f0ede4]': 'text-[#777] hover:bg-white/[0.08] hover:text-white',
  'border-[#e5e7eb] bg-[#f0ede4] px-6 gap-4': 'border-[#e3d6c5] bg-white px-6 gap-4',
  'text-[#111827]': 'text-[#1a1a1a]',
  'border-[#e5e7eb]': 'border-[#e3d6c5]',
  'bg-slate-50 border border-slate-200': 'bg-[#f9f7f3] border border-[#e3d6c5]',
  'text-slate-700': 'text-[#1a1a1a]',
  'bg-[#f0ede4] shadow-lg': 'bg-white shadow-lg',
  'text-slate-400': 'text-[#999]',
  'text-slate-600': 'text-[#999]',
  'hover:bg-slate-50 hover:text-slate-900': 'hover:bg-[#f9f7f3] hover:text-[#1a1a1a]',
  'border-[#e5e7eb] bg-[#f0ede4] text-[#6b7280] hover:text-[#111827]': 'border-[#e3d6c5] bg-white text-[#888] hover:text-[#331405] hover:border-[#c57e5b]',
  'bg-[#f9fafb] hover:bg-[#f3f4f6]': 'bg-[#f9f7f3] hover:bg-[#f0ede4]',
  'text-[#6b7280]': 'text-[#777]'
};

for (const [key, value] of Object.entries(replacements)) {
  c = c.split(key).join(value);
}

fs.writeFileSync('copper-crm/src/layouts/ClientLayout.jsx', c);
console.log('Done');
