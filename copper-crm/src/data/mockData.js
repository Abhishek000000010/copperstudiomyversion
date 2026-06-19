export const dashboardStats = [
  { label: "Total Deals Closed", value: "4", change: "+10% from last month", up: true },
  { label: "Revenue Generated", value: "₹2,98,520", change: "+10% from last month", up: true },
  { label: "Deal Value Overtime", value: "₹43k", change: "+20% This Month", up: true },
];

const seed = (i) => {
  const base = 250 + Math.sin(i / 18) * 60;
  const noise = (Math.sin(i * 7.3) * 40 + Math.sin(i * 2.1) * 25 + Math.sin(i * 0.4) * 30);
  return Math.max(180, Math.round(base + noise));
};
export const dailyRevenue = Array.from({ length: 180 }, (_, i) => ({
  day: i,
  revenue: seed(i),
  trend: Math.round(230 + (i / 180) * 120 + Math.sin(i / 40) * 20),
}));

export const stats = [
  { label: "Total Revenue", value: "₹18,42,500", change: "+12.5%", up: true },
  { label: "Active Projects", value: "24", change: "+3", up: true },
  { label: "New Leads", value: "57", change: "+8.2%", up: true },
  { label: "Pending Payments", value: "₹3,20,000", change: "-2", up: false },
];

export const revenueData = [
  { month: "Jan", revenue: 120000 }, { month: "Feb", revenue: 180000 },
  { month: "Mar", revenue: 150000 }, { month: "Apr", revenue: 210000 },
  { month: "May", revenue: 190000 }, { month: "Jun", revenue: 260000 },
  { month: "Jul", revenue: 230000 }, { month: "Aug", revenue: 300000 },
  { month: "Sep", revenue: 280000 }, { month: "Oct", revenue: 320000 },
  { month: "Nov", revenue: 290000 }, { month: "Dec", revenue: 380000 },
];

export const salesData = [
  { month: "Jan", deals: 8 }, { month: "Feb", deals: 12 },
  { month: "Mar", deals: 9 }, { month: "Apr", deals: 15 },
  { month: "May", deals: 11 }, { month: "Jun", deals: 18 },
];

export const recentOrders = [
  { id: "ORD-001", customer: "Arjun Mehta", package: "Growth Studio", amount: "₹58,999", status: "Paid", date: "12 Jun 2026" },
  { id: "ORD-002", customer: "Priya Shah", package: "Enterprise Studio", amount: "₹1,06,199", status: "Paid", date: "11 Jun 2026" },
  { id: "ORD-003", customer: "Rohit Verma", package: "Starter Studio", amount: "₹29,499", status: "Pending", date: "10 Jun 2026" },
  { id: "ORD-004", customer: "Neha Gupta", package: "Growth Studio", amount: "₹58,999", status: "Paid", date: "09 Jun 2026" },
  { id: "ORD-005", customer: "Karan Joshi", package: "Enterprise Studio", amount: "₹1,06,199", status: "Failed", date: "08 Jun 2026" },
];

export const recentLeads = [
  { name: "Siddharth Rao", company: "PixelForge", email: "sid@pixelforge.in", stage: "New Lead", date: "13 Jun" },
  { name: "Anjali Nair", company: "BrandMint", email: "anjali@brandmint.co", stage: "Contacted", date: "12 Jun" },
  { name: "Dev Malhotra", company: "CloudStack", email: "dev@cloudstack.io", stage: "Qualified", date: "11 Jun" },
  { name: "Ritika Sinha", company: "NovaApps", email: "ritika@novaapps.in", stage: "Proposal Sent", date: "10 Jun" },
];

export const upcomingDeadlines = [
  { project: "Zara Retail App", client: "Zara India", daysLeft: 2, progress: 85, priority: "urgent" },
  { project: "CloudPOS Dashboard", client: "CloudStack", daysLeft: 7, progress: 60, priority: "upcoming" },
  { project: "Brand Identity Kit", client: "BrandMint", daysLeft: 14, progress: 40, priority: "on-track" },
  { project: "E-commerce Platform", client: "ShopNow", daysLeft: 21, progress: 25, priority: "on-track" },
];

export const companies = [
  { id: 1, name: "PixelForge", industry: "Design Agency", contact: "Siddharth Rao", projects: 3, status: "Active" },
  { id: 2, name: "BrandMint", industry: "Branding", contact: "Anjali Nair", projects: 2, status: "Active" },
  { id: 3, name: "CloudStack", industry: "SaaS", contact: "Dev Malhotra", projects: 5, status: "Active" },
  { id: 4, name: "NovaApps", industry: "Mobile Apps", contact: "Ritika Sinha", projects: 1, status: "Inactive" },
  { id: 5, name: "Zara India", industry: "Retail", contact: "Meera Kapoor", projects: 4, status: "Active" },
  { id: 6, name: "ShopNow", industry: "E-commerce", contact: "Aditya Roy", projects: 2, status: "Active" },
  { id: 7, name: "GreenLeaf", industry: "Sustainability", contact: "Pooja Iyer", projects: 1, status: "Prospect" },
];

export const contacts = [
  { id: 1, name: "Siddharth Rao", company: "PixelForge", email: "sid@pixelforge.in", phone: "+91 98001 11222", designation: "Founder" },
  { id: 2, name: "Anjali Nair", company: "BrandMint", email: "anjali@brandmint.co", phone: "+91 98002 22333", designation: "CEO" },
  { id: 3, name: "Dev Malhotra", company: "CloudStack", email: "dev@cloudstack.io", phone: "+91 98003 33444", designation: "CTO" },
  { id: 4, name: "Ritika Sinha", company: "NovaApps", email: "ritika@novaapps.in", phone: "+91 98004 44555", designation: "Product Manager" },
  { id: 5, name: "Meera Kapoor", company: "Zara India", email: "meera@zaraindia.com", phone: "+91 98005 55666", designation: "Head of Digital" },
  { id: 6, name: "Aditya Roy", company: "ShopNow", email: "aditya@shopnow.in", phone: "+91 98006 66777", designation: "Co-Founder" },
];

// Lead pipeline — enriched with service interest, source, last activity
export const leads = {
  "New Lead": [
    {
      id: "l1", name: "Siddharth Rao", company: "PixelForge",
      value: "₹49,999", service: "Website + Branding",
      source: "Instagram", lastActivity: "Filled form · 1d ago",
      email: "sid@pixelforge.in", phone: "+91 98001 11222",
    },
    {
      id: "l2", name: "Pooja Iyer", company: "GreenLeaf",
      value: "₹89,999", service: "E-commerce Store",
      source: "Referral", lastActivity: "Filled form · 2d ago",
      email: "pooja@greenleaf.com", phone: "+91 98007 77888",
    },
    {
      id: "l10", name: "Aryan Sharma", company: "FitCore",
      value: "₹29,999", service: "Landing Page",
      source: "LinkedIn", lastActivity: "Filled form · 3h ago",
      email: "aryan@fitcore.in", phone: "+91 97001 00111",
    },
  ],
  "Contacted": [
    {
      id: "l3", name: "Anjali Nair", company: "BrandMint",
      value: "₹24,999", service: "Brand Identity",
      source: "Google Ads", lastActivity: "Call scheduled · 5h ago",
      email: "anjali@brandmint.co", phone: "+91 98002 22333",
    },
    {
      id: "l11", name: "Rahul Desai", company: "TastyBites",
      value: "₹59,999", service: "Restaurant Website + Menu",
      source: "WhatsApp", lastActivity: "Intro call done · 1d ago",
      email: "rahul@tastybites.in", phone: "+91 97002 00222",
    },
  ],
  "Qualified": [
    {
      id: "l4", name: "Dev Malhotra", company: "CloudStack",
      value: "₹89,999", service: "SaaS Dashboard + UI",
      source: "Referral", lastActivity: "Requirements shared · 3d ago",
      email: "dev@cloudstack.io", phone: "+91 98003 33444",
    },
    {
      id: "l5", name: "Ravi Teja", company: "TechPeak",
      value: "₹49,999", service: "Mobile App Design",
      source: "LinkedIn", lastActivity: "Sent portfolio · 2d ago",
      email: "ravi@techpeak.in", phone: "+91 98008 88999",
    },
  ],
  "Proposal Sent": [
    {
      id: "l6", name: "Ritika Sinha", company: "NovaApps",
      value: "₹49,999", service: "App Redesign",
      source: "Instagram", lastActivity: "Proposal viewed · 6h ago",
      email: "ritika@novaapps.in", phone: "+91 98004 44555",
    },
    {
      id: "l12", name: "Vikram Nair", company: "LogiTrack",
      value: "₹1,19,999", service: "Enterprise Dashboard",
      source: "Cold Outreach", lastActivity: "Proposal sent · 1d ago",
      email: "vikram@logitrack.in", phone: "+91 97003 00333",
    },
  ],
  "Negotiation": [
    {
      id: "l7", name: "Meera Kapoor", company: "Zara India",
      value: "₹89,999", service: "Retail App",
      source: "Referral", lastActivity: "Discount requested · 2d ago",
      email: "meera@zaraindia.com", phone: "+91 98005 55666",
    },
  ],
  "Won": [
    {
      id: "l8", name: "Aditya Roy", company: "ShopNow",
      value: "₹49,999", service: "E-commerce Platform",
      source: "Google Ads", lastActivity: "Invoice sent · 4d ago",
      email: "aditya@shopnow.in", phone: "+91 98006 66777",
    },
    {
      id: "l13", name: "Priya Shah", company: "FashionHub",
      value: "₹1,06,199", service: "Enterprise Studio",
      source: "Referral", lastActivity: "Payment received · 3d ago",
      email: "priya@fashionhub.in", phone: "+91 97004 00444",
    },
  ],
  "Lost": [
    {
      id: "l9", name: "Karan Das", company: "OldBrand",
      value: "₹24,999", service: "Brand Refresh",
      source: "Cold Outreach", lastActivity: "No response · 10d ago",
      email: "karan@oldbrand.co", phone: "+91 98009 99000",
    },
  ],
};

// Projects — enriched with workspace metadata for the project detail view.
// companyId links each project back to its row in `companies` so the
// Companies -> Company -> Project -> Files drill-down can be routed for real
// instead of relying on string matching.
export const projects = [
  {
    id: 1, companyId: 5, name: "Zara Retail App", client: "Zara India", progress: 85, dueDate: "17 Jun 2026", team: ["M", "R", "A"], status: "In Progress", priority: "urgent",
    startDate: "01 Apr 2026", packagePurchased: "Enterprise Studio + Native Mobile UI", budget: 1800000, budgetUsed: 1530000,
    note: { text: "Zara's merchandising team wants the checkout flow tested on low-end Android devices before the next demo.", author: "Meera, Zara India" },
    activity: [
      { icon: "upload", text: "Rohit uploaded checkout_flow_v3.fig", time: "2 hours ago" },
      { icon: "check", text: "System marked Design phase as complete", time: "Yesterday at 4:30 PM" },
      { icon: "comment", text: "Meera (Client) left a comment on Product Listing screen", time: "11 Jun, 10:15 AM" },
    ],
    documents: [
      { name: "Brand_Guidelines_V2.pdf", category: "Proposals", type: "pdf", sizeMB: 4.2, date: "17 Jun 2026", uploadedBy: "Rohit" },
      { name: "Checkout_Flow_V3.fig", category: "Deliverables", type: "figma", sizeMB: 18.6, date: "14 Jun 2026", uploadedBy: "Rohit" },
      { name: "Master_Service_Agreement.pdf", category: "Contracts", type: "pdf", sizeMB: 1.8, date: "02 Apr 2026", uploadedBy: "Meera" },
      { name: "Retainer_Invoice_03.pdf", category: "Invoices", type: "pdf", sizeMB: 0.4, date: "01 Jun 2026", uploadedBy: "Aisha" },
      { name: "QA_Device_Matrix.doc", category: "Internal", type: "doc", sizeMB: 0.6, date: "12 Jun 2026", uploadedBy: "Aisha" },
    ],
  },
  {
    id: 2, companyId: 3, name: "CloudPOS Dashboard", client: "CloudStack", progress: 60, dueDate: "22 Jun 2026", team: ["D", "P"], status: "In Progress", priority: "upcoming",
    startDate: "10 Apr 2026", packagePurchased: "SaaS Dashboard + UI Package", budget: 950000, budgetUsed: 540000,
    note: { text: "Dev wants the auth module demoed live before QA starts — keep the sandbox creds ready.", author: "Dev, CloudStack" },
    activity: [
      { icon: "upload", text: "Aisha uploaded dashboard_mockups_v2.pdf", time: "5 hours ago" },
      { icon: "check", text: "System marked Requirement Gathering as complete", time: "2 days ago" },
      { icon: "comment", text: "Dev (Client) approved the sidebar navigation", time: "08 Jun, 3:40 PM" },
    ],
    documents: [
      { name: "Dashboard_Mockups_V2.pdf", category: "Deliverables", type: "pdf", sizeMB: 6.1, date: "11 Jun 2026", uploadedBy: "Aisha" },
      { name: "SaaS_Proposal_Final.pdf", category: "Proposals", type: "pdf", sizeMB: 2.3, date: "12 Apr 2026", uploadedBy: "Priya" },
      { name: "NDA_CloudStack.pdf", category: "Contracts", type: "pdf", sizeMB: 0.5, date: "10 Apr 2026", uploadedBy: "Dev" },
    ],
  },
  {
    id: 3, companyId: 2, name: "Brand Identity Kit", client: "BrandMint", progress: 40, dueDate: "29 Jun 2026", team: ["A", "S"], status: "Design", priority: "on-track",
    startDate: "15 Apr 2026", packagePurchased: "Full Brand Identity", budget: 250000, budgetUsed: 98000,
    note: { text: "Anjali loved the initial style guide — wants more copper accents across the deck.", author: "Anjali, BrandMint" },
    activity: [
      { icon: "upload", text: "Priya uploaded v2_style_guide.pdf", time: "3 hours ago" },
      { icon: "comment", text: "Anjali (Client) requested bolder accent colors", time: "Yesterday at 1:10 PM" },
    ],
    documents: [
      { name: "V2_Style_Guide.pdf", category: "Deliverables", type: "pdf", sizeMB: 9.4, date: "15 Jun 2026", uploadedBy: "Priya" },
      { name: "Moodboard_Identity.jpg", category: "Deliverables", type: "image", sizeMB: 3.1, date: "02 Jun 2026", uploadedBy: "Priya" },
      { name: "Brand_Retainer_Invoice.pdf", category: "Invoices", type: "pdf", sizeMB: 0.3, date: "20 Apr 2026", uploadedBy: "Anjali" },
    ],
  },
  {
    id: 4, companyId: 6, name: "E-commerce Platform", client: "ShopNow", progress: 25, dueDate: "06 Jul 2026", team: ["R", "D", "M", "A"], status: "Development", priority: "on-track",
    startDate: "20 Apr 2026", packagePurchased: "Growth Studio + E-commerce Module", budget: 1100000, budgetUsed: 310000,
    note: { text: "Aditya flagged Razorpay settlement delays — confirm webhook retries before go-live.", author: "Aditya, ShopNow" },
    activity: [
      { icon: "upload", text: "Rohit uploaded payment_flow_diagram.png", time: "1 day ago" },
      { icon: "check", text: "System marked Requirement Gathering as complete", time: "4 days ago" },
    ],
    documents: [
      { name: "Payment_Flow_Diagram.png", category: "Deliverables", type: "image", sizeMB: 2.7, date: "15 Jun 2026", uploadedBy: "Rohit" },
      { name: "Ecommerce_Scope.doc", category: "Proposals", type: "doc", sizeMB: 1.1, date: "21 Apr 2026", uploadedBy: "Aditya" },
      { name: "Module_Addendum.pdf", category: "Contracts", type: "pdf", sizeMB: 0.7, date: "25 Apr 2026", uploadedBy: "Meera" },
    ],
  },
  {
    id: 5, companyId: 4, name: "Mobile App Redesign", client: "NovaApps", progress: 10, dueDate: "20 Jul 2026", team: ["S"], status: "Requirement Gathering", priority: "on-track",
    startDate: "05 Jun 2026", packagePurchased: "App Redesign Sprint", budget: 480000, budgetUsed: 32000,
    note: { text: "Ritika wants the new IA validated with 3 internal users before wireframes start.", author: "Ritika, NovaApps" },
    activity: [
      { icon: "comment", text: "Ritika (Client) shared competitor app references", time: "6 hours ago" },
    ],
    documents: [
      { name: "Competitor_App_References.pdf", category: "Internal", type: "pdf", sizeMB: 5.5, date: "10 Jun 2026", uploadedBy: "Ritika" },
      { name: "Redesign_Sprint_Proposal.pdf", category: "Proposals", type: "pdf", sizeMB: 1.4, date: "01 Jun 2026", uploadedBy: "Siddharth" },
    ],
  },
  {
    id: 6, companyId: 7, name: "SEO & Content Strategy", client: "GreenLeaf", progress: 95, dueDate: "14 Jun 2026", team: ["P", "M"], status: "Review", priority: "urgent",
    startDate: "01 May 2026", packagePurchased: "SEO & Content Package", budget: 180000, budgetUsed: 171000,
    note: { text: "Pooja wants the keyword map reviewed once more before the final report goes out.", author: "Pooja, GreenLeaf" },
    activity: [
      { icon: "upload", text: "Priya uploaded seo_audit_final.pdf", time: "4 hours ago" },
      { icon: "check", text: "System marked Development phase as complete", time: "3 days ago" },
      { icon: "comment", text: "Pooja (Client) approved the keyword map", time: "10 Jun, 9:00 AM" },
    ],
    documents: [
      { name: "SEO_Audit_Final.pdf", category: "Deliverables", type: "pdf", sizeMB: 7.8, date: "12 Jun 2026", uploadedBy: "Priya" },
      { name: "Keyword_Map.doc", category: "Deliverables", type: "doc", sizeMB: 0.9, date: "08 Jun 2026", uploadedBy: "Priya" },
      { name: "Content_Retainer_Invoice.pdf", category: "Invoices", type: "pdf", sizeMB: 0.3, date: "01 Jun 2026", uploadedBy: "Pooja" },
    ],
  },
];

// Kanban tasks — enriched with project context, description, sub-counts
export const kanbanTasks = {
  "Backlog": [
    {
      id: "t1", title: "Set up project repository & CI/CD pipeline",
      project: "E-commerce Platform", priority: "Low",
      assignee: "R", deadline: "18 Jun",
      description: "GitHub repo, branch rules, Vercel deploy hooks",
      subtasks: 3, comments: 1,
    },
    {
      id: "t2", title: "Client kickoff call — align on timeline",
      project: "Mobile App Redesign", priority: "High",
      assignee: "M", deadline: "16 Jun",
      description: "Cover scope, milestones, communication norms",
      subtasks: 2, comments: 4,
    },
    {
      id: "t14", title: "Content collection from client",
      project: "Brand Identity Kit", priority: "Medium",
      assignee: "P", deadline: "19 Jun",
      description: "Logo files, brand guidelines, copy for all pages",
      subtasks: 5, comments: 2,
    },
  ],
  "Requirement Gathering": [
    {
      id: "t3", title: "Gather UI/UX requirements from stakeholders",
      project: "Zara Retail App", priority: "High",
      assignee: "A", deadline: "17 Jun",
      description: "User flows, screen list, admin vs customer roles",
      subtasks: 6, comments: 3,
    },
    {
      id: "t13", title: "Define payment gateway & notification flows",
      project: "E-commerce Platform", priority: "High",
      assignee: "D", deadline: "18 Jun",
      description: "Razorpay integration, order status webhooks, SMS/Email",
      subtasks: 4, comments: 2,
    },
  ],
  "Design": [
    {
      id: "t4", title: "Wireframes for homepage & product listing",
      project: "Zara Retail App", priority: "Medium",
      assignee: "S", deadline: "19 Jun",
      description: "Lo-fi Figma wireframes for 6 key screens",
      subtasks: 6, comments: 5,
    },
    {
      id: "t5", title: "Brand color palette & typography system",
      project: "Brand Identity Kit", priority: "Low",
      assignee: "P", deadline: "20 Jun",
      description: "Primary, secondary, semantic colors + Inter/Satoshi combo",
      subtasks: 3, comments: 1,
    },
    {
      id: "t12", title: "Dashboard UI — high fidelity mockups",
      project: "CloudPOS Dashboard", priority: "High",
      assignee: "A", deadline: "21 Jun",
      description: "Charts, tables, sidebar — Figma handoff-ready",
      subtasks: 8, comments: 6,
    },
  ],
  "Development": [
    {
      id: "t6", title: "Build auth module — JWT + refresh tokens",
      project: "CloudPOS Dashboard", priority: "High",
      assignee: "D", deadline: "22 Jun",
      description: "Login, register, forgot password, session management",
      subtasks: 5, comments: 8,
    },
    {
      id: "t7", title: "Razorpay payment & webhook integration",
      project: "E-commerce Platform", priority: "High",
      assignee: "R", deadline: "24 Jun",
      description: "Order creation, payment capture, refund flow",
      subtasks: 4, comments: 3,
    },
    {
      id: "t11", title: "Product catalog — filter, sort, search",
      project: "Zara Retail App", priority: "Medium",
      assignee: "M", deadline: "23 Jun",
      description: "Category tree, faceted filters, Algolia search",
      subtasks: 7, comments: 2,
    },
  ],
  "Testing": [
    {
      id: "t8", title: "Unit & integration tests — auth module",
      project: "CloudPOS Dashboard", priority: "Medium",
      assignee: "D", deadline: "25 Jun",
      description: "Jest + Supertest, 90%+ coverage on auth routes",
      subtasks: 4, comments: 1,
    },
    {
      id: "t15", title: "Cross-browser & mobile responsiveness QA",
      project: "Zara Retail App", priority: "High",
      assignee: "S", deadline: "26 Jun",
      description: "Chrome, Safari, Firefox + iOS/Android checks",
      subtasks: 10, comments: 4,
    },
  ],
  "Review": [
    {
      id: "t9", title: "Code review — payment & checkout flow",
      project: "E-commerce Platform", priority: "High",
      assignee: "M", deadline: "26 Jun",
      description: "Security audit, edge cases, error handling",
      subtasks: 3, comments: 7,
    },
  ],
  "Completed": [
    {
      id: "t10", title: "Project proposal signed off by client",
      project: "Zara Retail App", priority: "Low",
      assignee: "A", deadline: "01 Jun",
      description: "SOW, timeline, payment terms — all confirmed",
      subtasks: 2, comments: 2,
    },
    {
      id: "t16", title: "SEO audit & keyword research delivered",
      project: "SEO & Content Strategy", priority: "Medium",
      assignee: "P", deadline: "10 Jun",
      description: "50-keyword map, competitor analysis, on-page fixes list",
      subtasks: 5, comments: 3,
    },
  ],
};

export const orders = [
  { id: "ORD-001", customer: "Arjun Mehta", package: "Growth Studio", amount: "₹58,999", status: "Paid", date: "12 Jun 2026", invoice: "INV-001" },
  { id: "ORD-002", customer: "Priya Shah", package: "Enterprise Studio", amount: "₹1,06,199", status: "Paid", date: "11 Jun 2026", invoice: "INV-002" },
  { id: "ORD-003", customer: "Rohit Verma", package: "Starter Studio", amount: "₹29,499", status: "Pending", date: "10 Jun 2026", invoice: "INV-003" },
  { id: "ORD-004", customer: "Neha Gupta", package: "Growth Studio", amount: "₹58,999", status: "Paid", date: "09 Jun 2026", invoice: "INV-004" },
  { id: "ORD-005", customer: "Karan Joshi", package: "Enterprise Studio", amount: "₹1,06,199", status: "Failed", date: "08 Jun 2026", invoice: "INV-005" },
  { id: "ORD-006", customer: "Simran Kaur", package: "Starter Studio", amount: "₹29,499", status: "Paid", date: "07 Jun 2026", invoice: "INV-006" },
];

export const invoices = [
  { id: "INV-001", client: "Arjun Mehta", amount: "₹58,999", gst: "₹8,949", total: "₹67,948", status: "Paid", date: "12 Jun 2026" },
  { id: "INV-002", client: "Priya Shah", amount: "₹89,999", gst: "₹16,200", total: "₹1,06,199", status: "Paid", date: "11 Jun 2026" },
  { id: "INV-003", client: "Rohit Verma", amount: "₹24,999", gst: "₹4,500", total: "₹29,499", status: "Unpaid", date: "10 Jun 2026" },
  { id: "INV-004", client: "Neha Gupta", amount: "₹49,999", gst: "₹9,000", total: "₹58,999", status: "Paid", date: "09 Jun 2026" },
  { id: "INV-005", client: "Karan Joshi", amount: "₹89,999", gst: "₹16,200", total: "₹1,06,199", status: "Overdue", date: "08 Jun 2026" },
];

export const coupons = [
  { id: 1, code: "LAUNCH25", type: "Percentage", value: "25%", expiry: "30 Jun 2026", limit: 50, used: 12, status: "Active" },
  { id: 2, code: "FLAT5K", type: "Fixed", value: "₹5,000", expiry: "15 Jul 2026", limit: 20, used: 8, status: "Active" },
  { id: 3, code: "SUMMER10", type: "Percentage", value: "10%", expiry: "31 May 2026", limit: 100, used: 100, status: "Expired" },
  { id: 4, code: "WELCOME15", type: "Percentage", value: "15%", expiry: "31 Dec 2026", limit: 200, used: 34, status: "Active" },
];

// Communication templates — one record can carry both an email and a
// WhatsApp version, grouped by lifecycle category (Welcome, Proposal, etc.)
export const communicationVariables = ["client_name", "project_title", "due_date", "invoice_amount", "portal_link", "sender_name"];

export const communicationPreviewSample = {
  client_name: "Alex Johnson",
  project_title: "Nordic Living Identity",
  due_date: "28 Jun 2026",
  invoice_amount: "₹58,999",
  portal_link: "https://portal.copperstudio.in/alex",
  sender_name: "Sarah Miller",
};

export const communicationTemplates = [
  {
    id: "tmpl-welcome-standard", category: "Welcome", name: "Standard Onboarding Welcome", status: "Active", sentCount: 184,
    email: {
      subject: "Welcome to Copper Studio - Let's get started, {{client_name}}!",
      body: "Hi {{client_name}},\n\nWe're thrilled to have you on board with Copper Studio! Our team is already preparing for our kickoff session.\n\nTo ensure we hit the ground running, please review the following:\n1. Complete the brand questionnaire\n2. Upload your existing assets to the shared drive\n3. Confirm the date for our strategy call\n\nLooking forward to creating something amazing together.\n\nBest regards,\n{{sender_name}}",
    },
    whatsapp: { body: "Hi {{client_name}}! Welcome to Copper Studio. Your portal is ready at {{portal_link}} - take a look and let us know if you have questions before our kickoff call." },
  },
  {
    id: "tmpl-welcome-enterprise", category: "Welcome", name: "Enterprise Onboarding Welcome", status: "Active", sentCount: 42,
    email: {
      subject: "Welcome aboard, {{client_name}} - your Enterprise team is ready",
      body: "Hi {{client_name}},\n\nYour dedicated Copper Studio team is now assigned to {{project_title}}. Expect a detailed onboarding pack and a calendar invite for your strategy call shortly.\n\nBest regards,\n{{sender_name}}",
    },
    whatsapp: { body: "Hi {{client_name}}! Your Enterprise onboarding for {{project_title}} has started. Check your inbox for the welcome pack." },
  },
  {
    id: "tmpl-proposal-sent", category: "Proposal", name: "Proposal Delivered", status: "Active", sentCount: 96,
    email: {
      subject: "Your proposal for {{project_title}} is ready",
      body: "Hi {{client_name}},\n\nWe've put together a proposal for {{project_title}}. You can review the scope, timeline, and pricing using the link below.\n\n{{portal_link}}\n\nWe're happy to walk through it together whenever suits you.\n\nBest regards,\n{{sender_name}}",
    },
    whatsapp: { body: "Hi {{client_name}}, your proposal for {{project_title}} is ready to review: {{portal_link}}" },
  },
  {
    id: "tmpl-payment-success", category: "Payment Success", name: "Payment Confirmation", status: "Active", sentCount: 121,
    email: {
      subject: "Payment received - {{invoice_amount}} confirmed",
      body: "Hi {{client_name}},\n\nThis confirms we've received your payment of {{invoice_amount}}. A receipt has been sent to your billing email, and your project timeline remains on track.\n\nBest regards,\n{{sender_name}}",
    },
    whatsapp: { body: "Hi {{client_name}}, we've received your payment of {{invoice_amount}}. Thank you!" },
  },
  {
    id: "tmpl-project-kickoff", category: "Project Started", name: "Project Kickoff Notice", status: "Active", sentCount: 58,
    email: {
      subject: "{{project_title}} has officially kicked off",
      body: "Hi {{client_name}},\n\n{{project_title}} is now underway. Your project workspace is live at {{portal_link}}, where you can track progress, files, and milestones in real time.\n\nBest regards,\n{{sender_name}}",
    },
    whatsapp: { body: "Hi {{client_name}}, {{project_title}} has kicked off! Track progress here: {{portal_link}}" },
  },
  {
    id: "tmpl-reminder-call", category: "Reminder", name: "Strategy Call Reminder", status: "Draft", sentCount: 27,
    email: {
      subject: "Reminder: your strategy call is on {{due_date}}",
      body: "Hi {{client_name}},\n\nJust a quick reminder that our strategy call for {{project_title}} is scheduled for {{due_date}}. Let us know if you need to reschedule.\n\nBest regards,\n{{sender_name}}",
    },
    whatsapp: { body: "Hi {{client_name}}, reminder: your strategy call for {{project_title}} is on {{due_date}}." },
  },
];
