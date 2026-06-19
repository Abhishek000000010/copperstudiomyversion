import { useMemo, useState, useRef, useEffect } from "react";
import { NavLink, Outlet, useLocation, useNavigate } from "react-router-dom";
import {
  BarChart2, Bell, Building2, ChevronDown, ChevronLeft, ChevronRight,
  FileSignature, FileText, FolderKanban, LayoutDashboard, Layers,
  LogOut, MessageCircle, Plus, ReceiptText, Search, Settings,
  ShoppingCart, Tag, UserRound, Users, Wallet, BookOpen,
  TrendingUp, Package
} from "lucide-react";
import { useAuth } from "../auth/useAuth";
import { companies, contacts, coupons, invoices, leads, orders, projects } from "../data/mockData";

const NAV_GROUPS = [
  {
    label: "Overview",
    items: [
      { icon: LayoutDashboard, to: "/admin", label: "Dashboard", end: true },
    ],
  },
  {
    label: "CRM",
    items: [
      { icon: Building2, to: "/admin/companies", label: "Companies" },
      { icon: Users, to: "/admin/contacts", label: "Contacts" },
    ],
  },
  {
    label: "Projects",
    items: [
      { icon: FolderKanban, to: "/admin/projects", label: "Projects" },
      { icon: Layers, to: "/admin/client-projects", label: "Client Projects" },
      { icon: LayoutDashboard, to: "/admin/kanban", label: "Kanban Board" },
    ],
  },
  {
    label: "Finance",
    items: [
      { icon: ReceiptText, to: "/admin/invoices", label: "Invoices" },
      { icon: Wallet, to: "/admin/coupons", label: "Coupons" },
    ],
  },
  {
    label: "Services",
    items: [
      { icon: Package, to: "/admin/services/packages", label: "Packages" },
      { icon: Tag, to: "/admin/services/coupon-generator", label: "Coupon Codes" },
      { icon: FileSignature, to: "/admin/services/proposal-generator", label: "Proposals" },
      { icon: MessageCircle, to: "/admin/services/communications", label: "Communication" },
    ],
  },
  {
    label: "System",
    items: [
      { icon: BarChart2, to: "/admin/analytics", label: "Analytics" },
      { icon: BookOpen, to: "/admin/reports", label: "Reports" },
      { icon: Settings, to: "/admin/settings", label: "Settings" },
    ],
  },
];

const pageNames = {
  "/admin": "Dashboard",
  "/admin/analytics": "Analytics",
  "/admin/companies": "Companies",
  "/admin/contacts": "Contacts",
  "/admin/projects": "Projects",
  "/admin/client-projects": "Client Projects",
  "/admin/kanban": "Kanban Board",
  "/admin/tasks": "Tasks",
  "/admin/invoices": "Invoices",
  "/admin/coupons": "Coupons",
  "/admin/reports": "Reports",
  "/admin/services/packages": "Packages",
  "/admin/services/coupon-generator": "Coupon Generator",
  "/admin/services/proposal-generator": "Proposal Generator",
  "/admin/services/communications": "Communication",
  "/admin/database": "Database",
  "/admin/settings": "Settings",
};

const searchablePages = [
  { label: "Dashboard", to: "/admin", keywords: "dashboard overview revenue projects" },
  { label: "Analytics", to: "/admin/analytics", keywords: "revenue orders graph payment analytics" },
  { label: "Companies", to: "/admin/companies", keywords: "accounts gstin company industry client business" },
  { label: "Contacts", to: "/admin/contacts", keywords: "people email phone designation client contact" },
  { label: "Projects", to: "/admin/projects", keywords: "project delivery timeline active orders" },
  { label: "Kanban Board", to: "/admin/kanban", keywords: "tasks board drag status todo progress done" },
  { label: "Invoices", to: "/admin/invoices", keywords: "billing invoice gst payment" },
  { label: "Coupon Generator", to: "/admin/services/coupon-generator", keywords: "coupon code discount" },
  { label: "Proposal Generator", to: "/admin/services/proposal-generator", keywords: "proposal pdf client" },
  { label: "Communication", to: "/admin/services/communications", keywords: "email whatsapp templates" },
  { label: "Settings", to: "/admin/settings", keywords: "profile password admin settings" },
];

const recordIndex = [
  ...companies.map((c) => ({ type: "Company", label: c.name, sublabel: c.industry, to: `/admin/companies/${c.id}` })),
  ...contacts.map((c) => ({ type: "Contact", label: c.name, sublabel: c.company, to: "/admin/contacts" })),
  ...projects.map((p) => ({ type: "Project", label: p.name, sublabel: p.client, to: `/admin/client-projects?clientId=${p.companyId}&projectId=${p.id}` })),
  ...invoices.map((i) => ({ type: "Invoice", label: i.id, sublabel: i.client, to: "/admin/invoices" })),
];

function getBreadcrumbs(pathname) {
  const segments = pathname.split("/").filter(Boolean);
  const crumbs = [{ label: "Dashboard", to: "/admin" }];
  let path = "";
  for (const seg of segments.slice(1)) {
    path += "/" + seg;
    const fullPath = "/admin" + path;
    const name = pageNames[fullPath] || (seg.length > 8 ? seg.slice(0, 8) + "…" : seg.charAt(0).toUpperCase() + seg.slice(1));
    crumbs.push({ label: name, to: fullPath });
  }
  return crumbs;
}

function NavItem({ item, collapsed }) {
  return (
    <NavLink
      to={item.to}
      end={item.end}
      title={collapsed ? item.label : undefined}
      className={({ isActive }) =>
        `group relative flex items-center gap-3 rounded-lg overflow-hidden transition-all duration-150 ${
          collapsed ? "justify-center px-0 py-2.5 mx-1" : "px-3 py-2.5 mx-2"
        } ${
          isActive
            ? "bg-[#382a22] text-white"
            : "text-[#a0a0a0] hover:bg-white/[0.06] hover:text-white"
        }`
      }
    >
      {({ isActive }) => (
        <>
          {isActive && !collapsed && (
            <span className="absolute left-0 top-0 bottom-0 w-[3px] bg-[#c57e5b]" />
          )}
          <item.icon size={17} strokeWidth={1.8} className={`shrink-0 ${isActive ? "text-[#c57e5b]" : ""}`} />
          {!collapsed && <span className="truncate text-[13px] font-medium">{item.label}</span>}
        </>
      )}
    </NavLink>
  );
}

export default function AdminLayout() {
  const location = useLocation();
  const navigate = useNavigate();
  const auth = useAuth();
  const [collapsed, setCollapsed] = useState(false);
  const [searchQuery, setSearchQuery] = useState("");
  const [searchFocused, setSearchFocused] = useState(false);
  const searchRef = useRef(null);

  const name = auth.user?.name || "Admin";
  const initials = name.split(" ").map((p) => p[0]).join("").slice(0, 2).toUpperCase();
  const breadcrumbs = getBreadcrumbs(location.pathname);

  const searchResults = useMemo(() => {
    const query = searchQuery.trim().toLowerCase();
    if (!query) return [];
    const recordMatches = recordIndex
      .filter((r) => `${r.label} ${r.sublabel || ""}`.toLowerCase().includes(query))
      .slice(0, 5);
    const pageMatches = searchablePages
      .filter((p) => `${p.label} ${p.keywords}`.toLowerCase().includes(query))
      .map((p) => ({ type: "Page", label: p.label, to: p.to }))
      .slice(0, 5 - recordMatches.length);
    return [...recordMatches, ...pageMatches];
  }, [searchQuery]);

  function openResult(result) {
    navigate(result.to);
    setSearchQuery("");
    setSearchFocused(false);
  }

  useEffect(() => {
    function onKey(e) {
      if ((e.metaKey || e.ctrlKey) && e.key === "k") {
        e.preventDefault();
        searchRef.current?.focus();
      }
    }
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, []);

  const sidebarW = collapsed ? 64 : 220;

  return (
    <div className="flex h-screen overflow-hidden bg-[#f0ede4]">
      {/* Sidebar */}
      <aside
        className="fixed inset-y-0 left-0 z-40 flex flex-col bg-[#1a1a1a] transition-all duration-200"
        style={{ width: sidebarW }}
      >
        {/* Logo */}
        <div className={`flex items-center border-b border-white/[0.08] ${collapsed ? "justify-center px-0 py-5" : "px-5 py-5"}`}>
          {collapsed ? (
            <div className="h-9 w-9 rounded-xl bg-[#331405] flex items-center justify-center text-white font-bold text-xs tracking-wide">CS</div>
          ) : (
            <div className="flex items-center gap-2.5 min-w-0">
              <div className="h-9 w-9 shrink-0 rounded-xl bg-[#331405] flex items-center justify-center text-white font-bold text-xs tracking-wide">CS</div>
              <div className="min-w-0">
                <p className="text-white text-[13px] font-bold truncate leading-tight">The Copper Studio</p>
                <p className="text-[#c57e5b] text-[10px] font-medium uppercase tracking-[0.1em] truncate">Creative Atelier</p>
              </div>
            </div>
          )}
        </div>

        {/* Nav */}
        <nav className="flex-1 overflow-y-auto py-4 space-y-5">
          {NAV_GROUPS.map((group) => (
            <div key={group.label}>
              {!collapsed && (
                <p className="px-5 mb-1.5 text-[10px] font-bold uppercase tracking-[0.14em] text-[#666]">
                  {group.label}
                </p>
              )}
              <div className="space-y-0.5">
                {group.items.map((item) => (
                  <NavItem key={item.to} item={item} collapsed={collapsed} />
                ))}
              </div>
            </div>
          ))}
        </nav>

        {/* Bottom: user + logout + collapse toggle */}
        <div className={`border-t border-white/[0.08] py-3 ${collapsed ? "px-1" : "px-3"}`}>
          {!collapsed && (
            <div className="flex items-center gap-2.5 px-2 py-2.5 mb-2 rounded-lg hover:bg-white/[0.06] cursor-default transition-colors">
              <div className="h-8 w-8 shrink-0 rounded-full bg-[#c57e5b] flex items-center justify-center text-white text-[11px] font-bold">{initials}</div>
              <div className="min-w-0 flex-1">
                <p className="text-white text-xs font-semibold truncate">{name}</p>
                <p className="text-[#777] text-[10px] truncate">{auth.user?.email || auth.user?.role || "Admin"}</p>
              </div>
              <button
                onClick={() => { auth.logout(); navigate("/login", { replace: true }); }}
                className="text-[#777] hover:text-white transition-colors"
                title="Log out"
              >
                <LogOut size={14} />
              </button>
            </div>
          )}
          <button
            onClick={() => setCollapsed((v) => !v)}
            className={`flex items-center justify-center w-full rounded-lg py-2 text-[#777] hover:bg-white/[0.08] hover:text-white transition-all ${collapsed ? "" : "gap-2"}`}
          >
            {collapsed ? <ChevronRight size={16} /> : (
              <>
                <ChevronLeft size={14} />
                <span className="text-xs font-medium">Collapse</span>
              </>
            )}
          </button>
        </div>
      </aside>

      {/* Main */}
      <div className="flex flex-1 flex-col min-w-0 overflow-hidden" style={{ marginLeft: sidebarW }}>
        {/* Top Header */}
        <header className="sticky top-0 z-30 flex h-14 items-center justify-between border-b border-[#e3d6c5] bg-white px-6 gap-4">
          {/* Breadcrumbs */}
          <nav className="flex items-center gap-1.5 text-sm min-w-0 flex-shrink-0">
            {breadcrumbs.map((crumb, i) => (
              <div key={crumb.to} className="flex items-center gap-1.5">
                {i > 0 && <span className="text-[#d1d5db]">/</span>}
                {i < breadcrumbs.length - 1 ? (
                  <button
                    onClick={() => navigate(crumb.to)}
                    className="text-[#888] hover:text-[#331405] font-medium transition-colors whitespace-nowrap"
                  >
                    {crumb.label}
                  </button>
                ) : (
                  <span className="text-[#c57e5b] font-semibold whitespace-nowrap">{crumb.label}</span>
                )}
              </div>
            ))}
          </nav>

          {/* Right: Search + actions */}
          <div className="flex items-center gap-3 flex-1 justify-end">
            {/* Search */}
            <div className="relative w-64">
              <div className="flex h-9 items-center gap-2 rounded-full border border-[#e3d6c5] bg-[#f9f7f3] px-3.5 focus-within:border-[#c57e5b] focus-within:bg-white focus-within:ring-2 focus-within:ring-[#c57e5b]/15 transition-all">
                <Search size={14} className="text-[#aaa] shrink-0" />
                <input
                  ref={searchRef}
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  onFocus={() => setSearchFocused(true)}
                  onBlur={() => setTimeout(() => setSearchFocused(false), 150)}
                  onKeyDown={(e) => {
                    if (e.key === "Enter") openResult(searchResults[0]);
                    if (e.key === "Escape") { setSearchQuery(""); setSearchFocused(false); }
                  }}
                  placeholder="Search Companies, Deals..."
                  className="w-full bg-transparent text-sm outline-none placeholder:text-[#aaa]"
                />
                <span className="hidden md:flex items-center gap-0.5 rounded-md border border-[#e3d6c5] bg-white px-1.5 py-0.5 text-[10px] font-bold text-[#bbb]">⌘K</span>
              </div>
              {searchFocused && searchQuery.trim() && (
                <div className="absolute left-0 right-0 top-full mt-1.5 z-50 overflow-hidden rounded-xl border border-[#e3d6c5] bg-white shadow-lg">
                  {searchResults.length ? (
                    <div className="py-1">
                      {searchResults.map((r) => (
                        <button
                          key={`${r.type}-${r.label}`}
                          onMouseDown={(e) => e.preventDefault()}
                          onClick={() => openResult(r)}
                          className="flex w-full items-center justify-between gap-3 px-3.5 py-2.5 text-left hover:bg-[#f9f7f3] transition-colors"
                        >
                          <span className="min-w-0">
                            <span className="block text-sm font-medium text-[#1a1a1a] truncate">{r.label}</span>
                            {r.sublabel && <span className="block text-xs text-[#999] truncate">{r.sublabel}</span>}
                          </span>
                          <span className="shrink-0 rounded-full bg-[#f0ede4] px-2 py-0.5 text-[10px] font-bold uppercase text-[#888]">{r.type}</span>
                        </button>
                      ))}
                    </div>
                  ) : (
                    <div className="px-3.5 py-3 text-xs text-[#999]">No results found.</div>
                  )}
                </div>
              )}
            </div>

            {/* Bell */}
            <button className="relative flex h-9 w-9 items-center justify-center rounded-full border border-[#e3d6c5] bg-white text-[#888] hover:text-[#331405] hover:border-[#c57e5b] transition-colors">
              <Bell size={16} />
              <span className="absolute top-1.5 right-1.5 h-2 w-2 rounded-full bg-[#c57e5b]" />
            </button>

            {/* + New */}
            <button className="flex h-9 w-9 items-center justify-center rounded-full bg-[#1a1a1a] text-white hover:bg-[#333] transition-colors shadow-sm">
              <Plus size={16} />
            </button>

            {/* Avatar */}
            <div className="h-9 w-9 rounded-full bg-[#c57e5b] flex items-center justify-center text-white text-xs font-bold cursor-pointer hover:ring-2 hover:ring-[#c57e5b]/30 transition-all">
              {initials}
            </div>
          </div>
        </header>

        {/* Page content */}
        <main className="flex-1 overflow-y-auto bg-[#f0ede4]">
          <Outlet />
        </main>
      </div>
    </div>
  );
}
