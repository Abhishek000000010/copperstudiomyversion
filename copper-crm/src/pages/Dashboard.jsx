import { useMemo, useState } from "react";
import { useNavigate } from "react-router-dom";
import {
  ArrowDownRight, ArrowUpRight, BarChart2, BriefcaseBusiness,
  CalendarDays, ChevronDown, IndianRupee, TrendingUp, UserPlus,
  Clock3, Activity, Download
} from "lucide-react";
import { companies, orders, projects, recentLeads, revenueData, salesData } from "../data/mockData";

function parseCurrency(v) {
  return Number(String(v).replace(/[^\d.-]/g, "")) || 0;
}
function formatINR(v) {
  return new Intl.NumberFormat("en-IN", { style: "currency", currency: "INR", maximumFractionDigits: 0 }).format(v || 0);
}
function formatCompact(v) {
  return new Intl.NumberFormat("en-IN", { style: "currency", currency: "INR", notation: "compact", maximumFractionDigits: 1 }).format(v || 0);
}

function KpiCard({ label, value, change, up, icon: Icon, iconBg }) {
  return (
    <div className="bg-[#f0ede4] rounded-xl border border-[#e5e7eb] p-5 flex items-start justify-between gap-3 shadow-[0_1px_3px_rgba(0,0,0,0.04)]">
      <div className="min-w-0">
        <p className="text-xs font-semibold text-[#6b7280] uppercase tracking-wider mb-2">{label}</p>
        <p className="text-xl font-bold text-[#111827]">{value}</p>
        {change != null && (
          <p className={`flex items-center gap-1 mt-1 text-xs font-medium ${up ? "text-emerald-600" : "text-red-500"}`}>
            {up ? <ArrowUpRight size={12} /> : <ArrowDownRight size={12} />}
            {change}% Last week
          </p>
        )}
      </div>
      <div className={`h-10 w-10 shrink-0 rounded-full flex items-center justify-center ${iconBg}`}>
        <Icon size={17} className="text-[#f0ede4]" />
      </div>
    </div>
  );
}

function SalesRevenueChart({ data }) {
  const maxVal = Math.max(...data.map((d) => d.revenue), 1);
  const pts = data.map((d, i) => {
    const x = (i / Math.max(data.length - 1, 1)) * 100;
    const y = 100 - (d.revenue / maxVal) * 80;
    return `${x},${y}`;
  }).join(" ");
  const area = `${pts} 100,100 0,100`;

  const yLabels = [0, 20, 40, 60, 80, 100, 120, 140, 160, 180].filter((v) => v <= Math.ceil(maxVal / 10000) * 10000).reverse().slice(0, 8);

  return (
    <div className="bg-[#f0ede4] rounded-xl border border-[#e5e7eb] shadow-[0_1px_3px_rgba(0,0,0,0.04)]">
      <div className="px-6 py-4 border-b border-[#f3f4f6]">
        <h3 className="text-sm font-bold text-[#111827]">Sales Revenue</h3>
      </div>
      <div className="px-6 py-4 flex gap-4">
        {/* Y-axis */}
        <div className="flex flex-col justify-between text-[10px] text-[#9ca3af] py-1" style={{ minWidth: 36 }}>
          {[180, 160, 140, 120, 100, 80, 60, 40, 20, 0].map((v) => (
            <span key={v}>₹{v}k</span>
          ))}
        </div>
        {/* Chart */}
        <div className="flex-1 min-w-0">
          <div className="h-56 relative">
            <svg viewBox="0 0 100 100" className="h-full w-full overflow-visible" preserveAspectRatio="none">
              <defs>
                <linearGradient id="areaGrad" x1="0" x2="0" y1="0" y2="1">
                  <stop offset="0%" stopColor="#331405" stopOpacity="0.18" />
                  <stop offset="100%" stopColor="#331405" stopOpacity="0.01" />
                </linearGradient>
              </defs>
              {[20, 40, 60, 80].map((y) => (
                <line key={y} x1="0" y1={y} x2="100" y2={y} stroke="#f3f4f6" strokeWidth="0.4" />
              ))}
              <polygon points={area} fill="url(#areaGrad)" />
              <polyline points={pts} fill="none" stroke="#331405" strokeWidth="1.2" strokeLinejoin="round" strokeLinecap="round" />
              {/* Trend dashes */}
              <polyline
                points={data.map((_, i) => {
                  const x = (i / Math.max(data.length - 1, 1)) * 100;
                  const y = 100 - (((i / (data.length - 1)) * 0.6 + 0.2) * 80);
                  return `${x},${y}`;
                }).join(" ")}
                fill="none"
                stroke="#22c55e"
                strokeWidth="0.8"
                strokeDasharray="2.5 2"
                opacity="0.7"
              />
            </svg>
          </div>
          {/* X-axis */}
          <div className="flex justify-between pt-2">
            {data.map((d) => (
              <span key={d.month} className="text-[10px] text-[#9ca3af]">{d.month}</span>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}

function InvoicesCard({ totalRevenue, paidOrders, totalOrders }) {
  const pctCleared = Math.round((paidOrders / Math.max(totalOrders, 1)) * 100);
  return (
    <div className="bg-[#f0ede4] rounded-xl border border-[#e5e7eb] p-5 shadow-[0_1px_3px_rgba(0,0,0,0.04)]">
      <p className="text-xs text-[#6b7280] font-medium mb-1">Total Invoices Issued</p>
      <p className="text-xl font-bold text-[#111827]">{formatINR(totalRevenue)}</p>
      <p className="text-xs text-[#6b7280] mt-0.5">{pctCleared}% Cleared</p>
      <div className="mt-4">
        <div className="flex justify-between text-xs text-[#6b7280] mb-1">
          <span>DataCircles</span>
          <span className="font-semibold text-[#111827]">60%</span>
        </div>
        <div className="h-1.5 rounded-full bg-[#f3f4f6] overflow-hidden mb-2">
          <div className="h-full rounded-full bg-[#331405]" style={{ width: "60%" }} />
        </div>
        <div className="flex justify-between text-xs text-[#6b7280]">
          <span>Website Project</span>
          <span>Invoices Paid</span>
        </div>
        <p className="text-[11px] text-[#9ca3af] mt-1">1 of 3</p>
      </div>
      <div className="mt-4 h-[80px] relative">
        <svg viewBox="0 0 100 40" className="w-full h-full" preserveAspectRatio="none">
          <polyline
            points="0,38 15,35 25,30 35,28 45,22 55,18 65,14 75,10 85,8 100,4"
            fill="none"
            stroke="#331405"
            strokeWidth="1.5"
            strokeLinejoin="round"
          />
        </svg>
        <div className="flex justify-between text-[10px] text-[#9ca3af] mt-1">
          {["Jan", "Feb", "Mar", "Apr", "May", "Jun", "Jul"].map((m) => <span key={m}>{m}</span>)}
        </div>
      </div>
      <p className="text-xs text-[#6b7280] mt-2">Payment Progress</p>
    </div>
  );
}

function EarningsCard() {
  const [quarter, setQuarter] = useState("Q1");
  return (
    <div className="bg-[#f0ede4] rounded-xl border border-[#e5e7eb] p-5 shadow-[0_1px_3px_rgba(0,0,0,0.04)]">
      <p className="text-sm font-bold text-[#111827] mb-1">{quarter} Earnings</p>
      <p className="text-xl font-bold text-[#111827]">5,39,200 INR</p>
      <p className="text-xs text-[#6b7280]">6.4% from last quarter</p>
      <p className="text-xs font-semibold text-emerald-600 mt-1">Outperforming benchmark by 2.5%</p>
      <div className="mt-4 flex items-center gap-2 text-xs text-[#6b7280] border border-[#e5e7eb] rounded-lg px-3 py-1.5 w-fit">
        <span className="font-semibold text-[#111827]">{quarter}</span>
        <ChevronDown size={12} />
      </div>
      <div className="mt-4 grid grid-cols-2 gap-2 text-xs text-[#6b7280]">
        <div>
          <p>Revenue</p>
          <p className="font-bold text-[#111827] text-sm">₹3,49,000</p>
        </div>
        <div>
          <p>Profit</p>
          <p className="font-bold text-[#111827] text-sm">₹1,23,000</p>
        </div>
      </div>
      <p className="text-xs text-[#6b7280] mt-4 mb-2">Earnings Performance</p>
      <div className="space-y-2">
        <div>
          <div className="flex justify-between text-[11px] text-[#6b7280] mb-1">
            <span>Revenue</span><span className="text-[#331405] font-semibold">8.1</span>
          </div>
          <div className="h-2.5 rounded-full bg-[#f3f4f6] overflow-hidden">
            <div className="h-full rounded-full bg-[#331405]" style={{ width: "75%" }} />
          </div>
        </div>
        <div>
          <div className="flex justify-between text-[11px] text-[#6b7280] mb-1">
            <span>Profit</span><span className="text-emerald-600 font-semibold">6.2</span>
          </div>
          <div className="h-2.5 rounded-full bg-[#f3f4f6] overflow-hidden">
            <div className="h-full rounded-full bg-emerald-500" style={{ width: "58%" }} />
          </div>
        </div>
      </div>
      <div className="flex items-center gap-3 mt-3 text-[11px] text-[#6b7280]">
        <span className="flex items-center gap-1"><span className="w-3 h-0.5 bg-[#331405] inline-block rounded" />Revenue</span>
        <span className="flex items-center gap-1"><span className="w-3 h-0.5 bg-emerald-500 inline-block rounded" />Profit</span>
      </div>
    </div>
  );
}

function RecentDealsCard({ recentDeals }) {
  return (
    <div className="bg-[#f0ede4] rounded-xl border border-[#e5e7eb] shadow-[0_1px_3px_rgba(0,0,0,0.04)]">
      <div className="px-5 py-4 flex items-center justify-between border-b border-[#f3f4f6]">
        <div>
          <p className="text-xs text-[#6b7280] font-medium">Recent Deals</p>
          <p className="text-base font-bold text-[#111827]">{recentDeals[0]?.client || "Cottson Clothing"}</p>
          <p className="text-xs text-[#6b7280]">INR 1,39,200 deal value</p>
        </div>
        <span className="bg-[#331405]/10 text-[#331405] text-[11px] font-semibold px-2 py-0.5 rounded-full">Top Deal</span>
      </div>
      <div className="overflow-x-auto">
        <table className="w-full text-xs">
          <thead>
            <tr className="border-b border-[#f3f4f6]">
              <th className="px-4 py-2.5 text-left font-semibold text-[#6b7280]">Client</th>
              <th className="px-4 py-2.5 text-left font-semibold text-[#6b7280]">Deal</th>
              <th className="px-4 py-2.5 text-right font-semibold text-[#6b7280]">Amount</th>
            </tr>
          </thead>
          <tbody>
            {recentDeals.map((deal, i) => (
              <tr key={i} className="border-b border-[#f9fafb] hover:bg-[#fafafa] transition-colors">
                <td className="px-4 py-2.5 font-medium text-[#374151]">{deal.client}</td>
                <td className="px-4 py-2.5 text-[#6b7280]">{deal.deal}</td>
                <td className="px-4 py-2.5 text-right font-semibold text-[#111827]">{deal.amount}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}

const TABS = ["Overview", "CRM", "Invoices"];

export default function Dashboard() {
  const navigate = useNavigate();
  const [tab, setTab] = useState("Overview");

  const metrics = useMemo(() => {
    const paidOrders = orders.filter((o) => o.status === "Paid");
    const totalRevenue = paidOrders.reduce((sum, o) => sum + parseCurrency(o.amount), 0);
    const activeProjects = projects.filter((p) => p.status !== "Completed");
    const totalDeals = projects.length;
    const avgDealValue = Math.round(totalRevenue / Math.max(paidOrders.length, 1));

    const today = new Date();
    const timeline = activeProjects.map((p) => {
      const due = new Date(p.dueDate);
      return { ...p, daysLeft: Math.ceil((due - today) / 86400000) };
    });
    const onTimeCount = timeline.filter((p) => p.daysLeft > 3 || p.progress >= 80).length;
    const onTimeRate = Math.round((onTimeCount / Math.max(timeline.length, 1)) * 100);

    return {
      totalRevenue,
      totalRevenueGenerated: Math.round(totalRevenue * 0.62),
      totalDeals,
      dealValueOvertime: avgDealValue,
      activeProjects: activeProjects.length,
      onTimeRate,
      paidOrders: paidOrders.length,
      totalOrders: orders.length,
      priorityProjects: [...timeline].sort((a, b) => a.daysLeft - b.daysLeft).slice(0, 4),
    };
  }, []);

  const recentDeals = [
    { client: "Cottson Clothing", deal: "Website Project", amount: "1,39,200 INR" },
    { client: "Asterisks.Inc", deal: "Digital Product", amount: "40,100 INR" },
    { client: "DataCircles", deal: "Branding", amount: "41,000 INR" },
    { client: "DataCircles", deal: "Branding", amount: "41,000 INR" },
    { client: "DataCircles", deal: "Branding", amount: "41,000 INR" },
    { client: "Cottson Clothing", deal: "Clothing", amount: "41,500 INR" },
  ];

  const chartData = revenueData.slice(-12);

  return (
    <div className="flex flex-col min-h-full">
      {/* Tabs */}
      <div className="bg-[#f0ede4] border-b border-[#e5e7eb] px-6">
        <div className="flex items-center gap-1">
          {TABS.map((t) => (
            <button
              key={t}
              onClick={() => setTab(t)}
              className={`px-4 py-3.5 text-sm font-semibold border-b-2 transition-colors ${
                tab === t
                  ? "border-[#331405] text-[#331405]"
                  : "border-transparent text-[#6b7280] hover:text-[#374151]"
              }`}
            >
              {t}
            </button>
          ))}
        </div>
      </div>

      <div className="flex-1 p-6 space-y-5">
        {/* Page title */}
        <div>
          <h2 className="text-lg font-bold text-[#111827]">Overview</h2>
          <p className="text-sm text-[#6b7280]">Visual summary of key lead performance metrics and your data</p>
        </div>

        {/* KPI Cards */}
        <div className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-4 gap-4">
          <KpiCard label="Total Income" value={formatCompact(metrics.totalRevenue)} change={12} up icon={IndianRupee} iconBg="bg-[#331405]" />
          <KpiCard label="Revenue Generated" value={formatCompact(metrics.totalRevenueGenerated)} change={12} up icon={BarChart2} iconBg="bg-[#6b7280]" />
          <KpiCard label="Total Deals Closed" value={metrics.totalDeals} change={12} up icon={TrendingUp} iconBg="bg-[#331405]/80" />
          <KpiCard label="Deal Value Overtime" value={formatCompact(metrics.dealValueOvertime)} change={12} up={false} icon={BriefcaseBusiness} iconBg="bg-[#6b7280]/80" />
        </div>

        {/* Sales Revenue Chart */}
        <SalesRevenueChart data={chartData} />

        {/* Bottom row */}
        <div className="grid grid-cols-1 xl:grid-cols-3 gap-5">
          <InvoicesCard
            totalRevenue={metrics.totalRevenue}
            paidOrders={metrics.paidOrders}
            totalOrders={metrics.totalOrders}
          />
          <EarningsCard />
          <RecentDealsCard recentDeals={recentDeals} />
        </div>

        {/* Priority Projects */}
        <div className="bg-[#f0ede4] rounded-xl border border-[#e5e7eb] shadow-[0_1px_3px_rgba(0,0,0,0.04)] overflow-hidden">
          <div className="px-6 py-4 border-b border-[#f3f4f6] flex items-center justify-between">
            <h3 className="text-sm font-bold text-[#111827]">Priority Projects</h3>
            <button
              onClick={() => navigate("/admin/projects")}
              className="text-xs font-semibold text-[#331405] hover:underline"
            >
              View all →
            </button>
          </div>
          <table className="min-w-full">
            <thead>
              <tr className="bg-[#fafafa] border-b border-[#f3f4f6]">
                {["Project", "Client", "Progress", "Due", "Status"].map((h) => (
                  <th key={h} className="px-5 py-3 text-left text-xs font-semibold text-[#6b7280] uppercase tracking-wider">{h}</th>
                ))}
              </tr>
            </thead>
            <tbody>
              {metrics.priorityProjects.map((project) => {
                const isAtRisk = project.daysLeft <= 3 && project.progress < 80;
                return (
                  <tr
                    key={project.id}
                    onClick={() => navigate(`/admin/client-projects?clientId=${project.companyId}&projectId=${project.id}`)}
                    className="border-b border-[#f9fafb] hover:bg-[#fafafa] cursor-pointer transition-colors"
                  >
                    <td className="px-5 py-4">
                      <p className="text-sm font-semibold text-[#111827]">{project.name}</p>
                      <p className="text-xs text-[#9ca3af] mt-0.5">{project.status}</p>
                    </td>
                    <td className="px-5 py-4 text-sm text-[#374151]">{project.client}</td>
                    <td className="px-5 py-4">
                      <div className="flex items-center gap-2.5">
                        <div className="h-1.5 w-24 rounded-full bg-[#f3f4f6] overflow-hidden">
                          <div className="h-full rounded-full bg-[#331405]" style={{ width: `${project.progress}%` }} />
                        </div>
                        <span className="text-xs font-semibold text-[#374151]">{project.progress}%</span>
                      </div>
                    </td>
                    <td className="px-5 py-4 text-sm text-[#374151]">
                      {project.daysLeft <= 0 ? "Due now" : `${project.daysLeft} days`}
                    </td>
                    <td className="px-5 py-4">
                      <span className={`inline-flex rounded-full px-2.5 py-0.5 text-[11px] font-bold ${
                        isAtRisk ? "bg-amber-50 text-amber-700" : "bg-emerald-50 text-emerald-700"
                      }`}>
                        {isAtRisk ? "Needs attention" : "On track"}
                      </span>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}
