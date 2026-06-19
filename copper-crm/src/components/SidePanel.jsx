import { X } from "lucide-react";

export default function SidePanel({ title, subtitle, children, footer, onClose, width = "max-w-xl" }) {
  return (
    <div className="fixed inset-0 z-50 bg-gray-950/30">
      <div className={`ml-auto flex h-full w-full ${width} animate-[panel-in_180ms_ease-out] flex-col border-l border-gray-200 bg-[#f0ede4] shadow-2xl`}>
        <div className="flex items-start justify-between gap-4 border-b border-gray-100 px-5 py-4">
          <div>
            <h2 className="text-base font-bold text-gray-950">{title}</h2>
            {subtitle && <p className="mt-1 text-xs leading-5 text-gray-500">{subtitle}</p>}
          </div>
          <button onClick={onClose} className="grid h-8 w-8 place-items-center rounded-lg text-gray-400 hover:bg-gray-100 hover:text-gray-700">
            <X size={16} />
          </button>
        </div>
        <div className="flex-1 overflow-y-auto p-5">{children}</div>
        {footer && <div className="border-t border-gray-100 p-4">{footer}</div>}
      </div>
    </div>
  );
}
