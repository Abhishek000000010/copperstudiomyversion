let packages = [];

const STORAGE_KEY = "tcs-order";
const API_BASE = "/api";

const defaultOrder = {
  selectedPackageId: "growth",
  customer: {},
  verified: { phone: false, email: false },
  otpSent: { phone: false, email: false },
  coupon: null,
  paymentStatus: "pending",
  workspaceCreated: false
};

function loadOrder() {
  try {
    const saved = JSON.parse(localStorage.getItem(STORAGE_KEY)) || {};
    return {
      ...defaultOrder,
      ...saved,
      verified: { ...defaultOrder.verified, ...(saved.verified || {}) },
      otpSent: { ...defaultOrder.otpSent, ...(saved.otpSent || {}) },
      coupon: saved.coupon || null
    };
  } catch {
    return { ...defaultOrder };
  }
}

function saveOrder(order) {
  localStorage.setItem(STORAGE_KEY, JSON.stringify(order));
}

let order = loadOrder();
const page = document.body.dataset.page;

async function apiRequest(path, options = {}) {
  const response = await fetch(`${API_BASE}${path}`, {
    headers: { "Content-Type": "application/json", ...(options.headers || {}) },
    ...options
  });

  if (!response.ok) {
    const error = await response.json().catch(() => ({ message: "Request failed." }));
    throw new Error(error.message || "Request failed.");
  }

  return response.json();
}

function formatCurrency(value) {
  return new Intl.NumberFormat("en-IN", {
    style: "currency",
    currency: "INR",
    maximumFractionDigits: 0
  }).format(value);
}

function selectedPackage() {
  return packages.find((item) => item.id === order.selectedPackageId) || packages[1];
}

function packageTotal(pkg = selectedPackage()) {
  const discount = order.coupon?.discount || 0;
  return Math.round(Math.max(0, pkg.price - discount) * 1.18);
}

function packageGst(pkg = selectedPackage()) {
  const discount = order.coupon?.discount || 0;
  return Math.round(Math.max(0, pkg.price - discount) * 0.18);
}

function overviewTemplate(pkg = selectedPackage()) {
  const discount = order.coupon?.discount || 0;
  const subtotal = Math.max(0, pkg.price - discount);
  const gst = Math.round(subtotal * 0.18);
  return `
    <div class="overview-card">
      <h3>${pkg.name}</h3>
      <p>${pkg.label}</p>
      <div class="overview-row"><span>Package amount</span><strong>${formatCurrency(pkg.price)}</strong></div>
      ${discount ? `<div class="overview-row discount-row"><span>Coupon discount (${order.coupon.code})</span><strong>- ${formatCurrency(discount)}</strong></div>` : ""}
      <div class="overview-row"><span>Taxable subtotal</span><strong>${formatCurrency(subtotal)}</strong></div>
      <div class="overview-row"><span>GST estimate</span><strong>${formatCurrency(gst)}</strong></div>
      <div class="overview-row"><span>Setup timeline</span><strong>${pkg.duration}</strong></div>
      <div class="overview-row"><span>Confirmation</span><strong>Email after payment</strong></div>
    </div>
  `;
}

function requirePackage() {
  if (!order.selectedPackageId) {
    window.location.href = "index.html";
  }
}

function requireCustomer() {
  requirePackage();
  if (!order.customer.customerFirstName || !order.customer.customerLastName || !order.verified.phone || !order.verified.email) {
    window.location.href = "checkout.html";
  }
}

function renderPackagesPage() {
  const packageGrid = document.getElementById("packageGrid");
  packageGrid.innerHTML = packages
    .map((pkg) => {
      const isSelected = pkg.id === order.selectedPackageId;
      return `
        <article class="package-card ${isSelected ? "is-selected" : ""}">
          <header>
            <div>
              <p class="mini-label">${pkg.label}</p>
              <h3>${pkg.name}</h3>
            </div>
            <span class="material-symbols-outlined">${isSelected ? "radio_button_checked" : "radio_button_unchecked"}</span>
          </header>
          <div class="price">${formatCurrency(pkg.price)}</div>
          <p>${pkg.duration}</p>
          <ul>
            ${pkg.includes.map((item) => `<li>${item}</li>`).join("")}
            ${(pkg.addons || []).length > 0 ? `<li style="margin-top: 12px; font-weight: bold; color: var(--ink); list-style: none; padding-left: 0;">Optional Add-ons:</li>` + pkg.addons.map(addon => `<li>${addon.name} (+${formatCurrency(addon.price)})</li>`).join("") : ""}
          </ul>
          <button class="btn ${isSelected ? "btn-primary" : "btn-secondary"}" type="button" data-package="${pkg.id}">
            ${isSelected ? "Continue with Package" : "Select Package"}
          </button>
        </article>
      `;
    })
    .join("");

  packageGrid.querySelectorAll("[data-package]").forEach((button) => {
    button.addEventListener("click", () => {
      order = {
        ...defaultOrder,
        selectedPackageId: button.dataset.package,
        customer: order.customer || {},
        coupon: null
      };
      saveOrder(order);
      window.location.href = "checkout.html";
    });
  });
}

function updateVerificationUI() {
  Object.entries(order.verified).forEach(([type, verified]) => {
    const status = document.getElementById(`${type}VerifyStatus`);
    const card = document.querySelector(`[data-verify-card="${type}"]`);
    const button = document.querySelector(`[data-verify="${type}"]`);
    const sendButton = document.querySelector(`[data-send-otp="${type}"]`);
    const input = document.querySelector(`[data-otp-input="${type}"]`);
    const sent = order.otpSent?.[type];

    if (!status || !card || !button || !sendButton || !input) return;

    status.textContent = verified ? "Verified" : sent ? "OTP sent. Use 123456 for demo." : "OTP not sent";
    button.textContent = verified ? "Verified" : "Verify";
    button.disabled = !sent || verified;
    sendButton.disabled = verified;
    input.disabled = !sent || verified;
    if (verified) input.value = "123456";
    card.classList.toggle("is-sent", sent && !verified);
    card.classList.toggle("is-verified", verified);
  });
}

function renderCheckoutPage() {
  requirePackage();
  const pkg = selectedPackage();
  document.getElementById("selectedOverview").innerHTML = overviewTemplate(pkg);
  document.getElementById("overviewTotal").textContent = formatCurrency(packageTotal(pkg));

  Object.entries(order.customer || {}).forEach(([key, value]) => {
    const input = document.querySelector(`[name="${key}"]`);
    if (input) input.value = value;
  });

  updateVerificationUI();

  document.querySelectorAll("[data-send-otp]").forEach((button) => {
    button.addEventListener("click", () => {
      const type = button.dataset.sendOtp;
      const field = document.getElementById(type === "phone" ? "customerPhone" : "customerEmail");
      if (!field.reportValidity()) return;

      order.otpSent = { ...defaultOrder.otpSent, ...(order.otpSent || {}) };
      order.otpSent[type] = true;
      saveOrder(order);
      updateVerificationUI();
    });
  });

  document.querySelectorAll("[data-verify]").forEach((button) => {
    button.addEventListener("click", () => {
      const type = button.dataset.verify;
      const input = document.querySelector(`[data-otp-input="${type}"]`);
      if (!input.value.trim()) {
        alert("Please enter the OTP. Use 123456 for this prototype.");
        return;
      }
      order.verified[type] = true;
      saveOrder(order);
      updateVerificationUI();
    });
  });

  document.getElementById("customerForm").addEventListener("submit", async (event) => {
    event.preventDefault();
    const form = event.currentTarget;
    if (!form.reportValidity()) return;

    if (!order.verified.phone || !order.verified.email) {
      alert("Please verify both mobile number and email OTP before continuing to Razorpay.");
      return;
    }

    order.customer = Object.fromEntries(new FormData(form).entries());
    saveOrder(order);

    try {
      await apiRequest("/leads", {
        method: "POST",
        body: JSON.stringify({
          ...order.customer,
          selectedPackageId: order.selectedPackageId,
          verified: order.verified
        })
      });
    } catch (error) {
      console.warn("Lead save failed:", error.message);
    }

    window.location.href = "payment.html";
  });
}

function renderPaymentPage() {
  requireCustomer();
  const pkg = selectedPackage();
  document.getElementById("checkoutSummary").innerHTML = overviewTemplate(pkg);
  document.getElementById("paymentAmount").textContent = formatCurrency(packageTotal(pkg));

  const c = order.customer;
  const addressParts = [
    c.billingAddressLine1,
    c.billingAddressLine2,
    c.billingAddressCity,
    c.billingAddressState
  ].filter(Boolean).join(", ") + (c.billingAddressPincode ? ` - ${c.billingAddressPincode}` : "");

  let html = `
    <div style="display: grid; gap: 16px;">
      <div>
        <p class="mini-label" style="margin-bottom: 4px;">Project Details</p>
        <strong style="display: block; font-size: 1.05rem; color: var(--ink);">${c.projectName || "Default Project"}</strong>
      </div>
      
      <div style="border-top: 1px solid var(--line); padding-top: 12px;">
        <p class="mini-label" style="margin-bottom: 4px;">Personal Details</p>
        <strong style="display: block; font-size: 1.05rem; color: var(--ink);">${c.customerFirstName} ${c.customerLastName}</strong>
        <span style="display: block; font-size: 0.85rem; color: var(--muted); margin-top: 2px;">${c.customerEmail} | ${c.customerPhone}</span>
        ${c.linkedinUrl ? `<a href="${c.linkedinUrl}" target="_blank" rel="noopener" style="display: inline-flex; align-items: center; gap: 4px; font-size: 0.8rem; color: var(--accent); margin-top: 6px; font-weight: 600;"><span class="material-symbols-outlined" style="font-size: 14px;">link</span> LinkedIn Profile</a>` : ""}
      </div>
      
      <div style="border-top: 1px solid var(--line); padding-top: 12px;">
        <p class="mini-label" style="margin-bottom: 4px;">Company & Billing</p>
        ${c.customerCompany ? `<strong style="display: block; font-size: 0.95rem; color: var(--ink);">${c.customerCompany}</strong>` : `<strong style="display: block; font-size: 0.95rem; color: var(--muted); font-style: italic;">No Company Provided</strong>`}
        ${c.companyWebsite ? `<br/><a href="${c.companyWebsite}" target="_blank" rel="noopener" style="display: inline-flex; align-items: center; gap: 4px; font-size: 0.8rem; color: var(--accent); margin-top: 2px; margin-bottom: 4px; font-weight: 600;"><span class="material-symbols-outlined" style="font-size: 14px;">globe</span> Website</a>` : ""}
        ${c.gstin ? `<span style="display: block; font-size: 0.8rem; font-weight: 600; color: var(--muted); margin-top: 2px; text-transform: uppercase;">GSTIN: ${c.gstin}</span>` : ""}
        <span style="display: block; font-size: 0.8rem; color: var(--muted); margin-top: 4px; line-height: 1.4;">${addressParts}</span>
      </div>
    </div>
  `;

  const container = document.getElementById("paymentCustomerDetails");
  if (container) {
    container.innerHTML = html;
  }

  const couponInput = document.getElementById("couponCode");
  const couponStatus = document.getElementById("couponStatus");
  if (couponInput && order.coupon?.code) {
    couponInput.value = order.coupon.code;
    couponStatus.textContent = `${order.coupon.code} applied. You saved ${formatCurrency(order.coupon.discount)}.`;
    couponStatus.className = "coupon-success";
  }

  document.getElementById("applyCouponButton")?.addEventListener("click", async () => {
    const code = couponInput.value.trim().toUpperCase();
    if (!code) {
      order.coupon = null;
      saveOrder(order);
      document.getElementById("checkoutSummary").innerHTML = overviewTemplate(pkg);
      document.getElementById("paymentAmount").textContent = formatCurrency(packageTotal(pkg));
      couponStatus.textContent = "Coupon removed.";
      couponStatus.className = "";
      return;
    }

    couponStatus.textContent = "Checking coupon...";
    couponStatus.className = "";
    try {
      const applied = await apiRequest("/coupons/validate", {
        method: "POST",
        body: JSON.stringify({ code, selectedPackageId: order.selectedPackageId })
      });
      order.coupon = {
        code: applied.code,
        amount: applied.amount,
        amountType: applied.amountType,
        discount: applied.discount,
        subtotal: applied.subtotal,
        gst: applied.gst,
        total: applied.total
      };
      saveOrder(order);
      document.getElementById("checkoutSummary").innerHTML = overviewTemplate(pkg);
      document.getElementById("paymentAmount").textContent = formatCurrency(packageTotal(pkg));
      couponStatus.textContent = `${applied.code} applied. You saved ${formatCurrency(applied.discount)}.`;
      couponStatus.className = "coupon-success";
    } catch (error) {
      order.coupon = null;
      saveOrder(order);
      document.getElementById("checkoutSummary").innerHTML = overviewTemplate(pkg);
      document.getElementById("paymentAmount").textContent = formatCurrency(packageTotal(pkg));
      couponStatus.textContent = error.message;
      couponStatus.className = "coupon-error";
    }
  });

  document.querySelectorAll("[data-method]").forEach((button) => {
    button.addEventListener("click", () => {
      const method = button.dataset.method;
      document.querySelectorAll("[data-method]").forEach((item) => item.classList.toggle("is-active", item.dataset.method === method));
      document.querySelectorAll("[data-payment-panel]").forEach((panel) => {
        panel.classList.toggle("is-active", panel.dataset.paymentPanel === method);
      });
    });
  });

  document.getElementById("payButton").addEventListener("click", async () => {
    const button = document.getElementById("payButton");
    const gatewayNote = document.getElementById("gatewayNote");
    button.disabled = true;
    button.textContent = "Opening Razorpay...";
    if (gatewayNote) gatewayNote.textContent = "Creating secure Razorpay order...";

    try {
      if (!window.Razorpay) {
        throw new Error("Razorpay Checkout script did not load. Check your internet connection.");
      }

      const [{ keyId }, razorpayOrder] = await Promise.all([
        apiRequest("/razorpay/config"),
        apiRequest("/razorpay/order", {
          method: "POST",
          body: JSON.stringify({ selectedPackageId: order.selectedPackageId, couponCode: order.coupon?.code || "" })
        })
      ]);

      const options = {
        key: keyId,
        amount: razorpayOrder.amount,
        currency: razorpayOrder.currency,
        name: "The Copper Studio",
        description: `${pkg.name} package`,
        order_id: razorpayOrder.id,
        prefill: {
          name: `${order.customer.customerFirstName} ${order.customer.customerLastName}`,
          email: order.customer.customerEmail,
          contact: order.customer.customerPhone
        },
        notes: {
          packageId: pkg.id,
          packageName: pkg.name
        },
        theme: {
          color: "#2563eb"
        },
        handler: async (response) => {
          button.textContent = "Verifying payment...";
          if (gatewayNote) gatewayNote.textContent = "Verifying payment with Razorpay...";

          const savedOrder = await apiRequest("/razorpay/verify", {
            method: "POST",
            body: JSON.stringify({
              ...response,
              selectedPackageId: order.selectedPackageId,
              couponCode: order.coupon?.code || "",
              customer: order.customer,
              verified: order.verified
            })
          });

          order.paymentStatus = "paid";
          order.paidAt = savedOrder.payment.paidAt;
          order.invoiceId = savedOrder.payment.invoiceId;
          order.razorpayOrderId = savedOrder.payment.razorpayOrderId;
          order.razorpayPaymentId = savedOrder.payment.razorpayPaymentId;
          order.mongoOrderId = savedOrder._id;
          saveOrder(order);
          window.location.href = "success.html";
        },
        modal: {
          ondismiss: () => {
            button.disabled = false;
            button.innerHTML = 'Pay Securely <span class="material-symbols-outlined">arrow_forward</span>';
            if (gatewayNote) gatewayNote.textContent = "Payment was cancelled. You can try again.";
          }
        }
      };

      const checkout = new window.Razorpay(options);
      checkout.on("payment.failed", (response) => {
        button.disabled = false;
        button.innerHTML = 'Pay Securely <span class="material-symbols-outlined">arrow_forward</span>';
        if (gatewayNote) {
          gatewayNote.textContent = response.error?.description || "Payment failed. Please try again.";
        }
      });
      checkout.open();
    } catch (error) {
      console.error(error);
      button.disabled = false;
      button.innerHTML = 'Pay Securely <span class="material-symbols-outlined">arrow_forward</span>';
      if (gatewayNote) gatewayNote.textContent = error.message;
      alert(error.message);
    }
  });
}

function renderSuccessPage() {
  requireCustomer();
  if (order.paymentStatus !== "paid") {
    window.location.href = "payment.html";
    return;
  }

  const pkg = selectedPackage();
  document.getElementById("successMessage").textContent =
    `Payment for ${pkg.name} is confirmed. Invoice ${order.invoiceId} is generated, and a mail has been sent to ${order.customer.customerEmail} for the next process. Please open that email to set up your portal password and continue onboarding.`;
}

const agencyProjects = [
  {
    client: "ABC Pvt Ltd",
    name: "CRM Development",
    progress: 68,
    due: "20 Jun 2026",
    status: "In Progress",
    manager: "Rohit",
    team: ["R", "J", "S"],
    budget: 76770
  },
  {
    client: "XYZ Pvt Ltd",
    name: "Website Redesign",
    progress: 42,
    due: "30 Jun 2026",
    status: "In Progress",
    manager: "John",
    team: ["R", "J"],
    budget: 46375
  },
  {
    client: "PQR Pvt Ltd",
    name: "Mobile App",
    progress: 20,
    due: "15 Jul 2026",
    status: "Planning",
    manager: "Sarah",
    team: ["S", "R"],
    budget: 89499
  },
  {
    client: "LMN Corp",
    name: "Custom Software",
    progress: 75,
    due: "25 Jun 2026",
    status: "Review",
    manager: "Rohit",
    team: ["R", "A", "J"],
    budget: 120000
  }
];

const kanbanColumns = [
  {
    title: "Backlog",
    tasks: [
      { name: "User Authentication", project: "CRM Development", priority: "High", owner: "Rohit", due: "18 Jun" },
      { name: "Database Design", project: "CRM Development", priority: "Medium", owner: "John", due: "20 Jun" },
      { name: "API Documentation", project: "CRM Development", priority: "Low", owner: "Sarah", due: "24 Jun" }
    ]
  },
  {
    title: "To Do",
    tasks: [
      { name: "Dashboard UI", project: "CRM Development", priority: "High", owner: "Rohit", due: "21 Jun" },
      { name: "Role Management", project: "CRM Development", priority: "Medium", owner: "John", due: "23 Jun" },
      { name: "Email Integration", project: "CRM Development", priority: "Medium", owner: "Sarah", due: "25 Jun" }
    ]
  },
  {
    title: "In Progress",
    tasks: [
      { name: "Lead Management", project: "CRM Development", priority: "High", owner: "Rohit", due: "19 Jun" },
      { name: "Contact Module", project: "CRM Development", priority: "Medium", owner: "John", due: "22 Jun" }
    ]
  },
  {
    title: "Review",
    tasks: [
      { name: "Deal Pipeline", project: "CRM Development", priority: "Medium", owner: "Rohit", due: "Today" },
      { name: "Report Module", project: "CRM Development", priority: "Low", owner: "John", due: "Tomorrow" }
    ]
  },
  {
    title: "Completed",
    tasks: [
      { name: "Project Setup", project: "CRM Development", priority: "Done", owner: "Rohit", due: "10 Jun" },
      { name: "Requirements Gathering", project: "CRM Development", priority: "Done", owner: "Sarah", due: "12 Jun" },
      { name: "UX/UI Design", project: "CRM Development", priority: "Done", owner: "Sarah", due: "14 Jun" }
    ]
  }
];

function teamAvatars(team) {
  return team.map((member) => `<span class="avatar">${member}</span>`).join("");
}

function projectCardTemplate(project) {
  return `
    <article class="ops-card project-card">
      <div class="card-topline">
        <div>
          <p class="mini-label">${project.client}</p>
          <h3>${project.name}</h3>
        </div>
        <span class="status-pill">${project.status}</span>
      </div>
      <div class="progress-circle" style="--value:${project.progress}"><strong>${project.progress}%</strong></div>
      <div class="thin-progress"><span style="width:${project.progress}%"></span></div>
      <div class="project-meta">
        <span>Due ${project.due}</span>
        <span>${project.manager}</span>
      </div>
      <div class="avatar-row">${teamAvatars(project.team)}</div>
    </article>
  `;
}

function renderOpsOverview(root) {
  root.innerHTML = `
    <section class="metric-grid">
      <article class="metric-card"><span>Total Revenue</span><strong>${formatCurrency(324560)}</strong><small>+18.2% from last month</small></article>
      <article class="metric-card"><span>Active Projects</span><strong>12</strong><small>2 due this week</small></article>
      <article class="metric-card"><span>New Purchases</span><strong>48</strong><small>Package orders received</small></article>
      <article class="metric-card"><span>Pending Payments</span><strong>${formatCurrency(48450)}</strong><small>Needs follow-up</small></article>
    </section>
    <section class="ops-grid">
      <div class="ops-panel wide-panel">
        <div class="section-title"><h2>Priority Projects</h2><span>This week</span></div>
        <div class="project-grid">${agencyProjects.map(projectCardTemplate).join("")}</div>
      </div>
      <div class="ops-panel">
        <div class="section-title"><h2>Recent Orders</h2><span>Live</span></div>
        ${agencyProjects.slice(0, 3).map((project, index) => `
          <div class="activity-row">
            <strong>#ORD-${1258 - index}</strong>
            <span>${project.client}</span>
            <b>${formatCurrency(project.budget)}</b>
          </div>
        `).join("")}
      </div>
    </section>
  `;
}

function renderOpsProjects(root) {
  root.innerHTML = `
    <section class="ops-panel">
      <div class="section-title"><h2>Active Projects</h2><button class="small-action" type="button">New Project</button></div>
      <div class="project-grid">${agencyProjects.map(projectCardTemplate).join("")}</div>
    </section>
    <section class="ops-panel">
      <div class="project-table">
        <div class="table-row table-head"><span>Project</span><span>Client</span><span>Due</span><span>Progress</span><span>Status</span></div>
        ${agencyProjects.map((project) => `
          <div class="table-row">
            <strong>${project.name}</strong>
            <span>${project.client}</span>
            <span>${project.due}</span>
            <span><i class="table-progress"><em style="width:${project.progress}%"></em></i>${project.progress}%</span>
            <span class="status-pill">${project.status}</span>
          </div>
        `).join("")}
      </div>
    </section>
  `;
}

function renderOpsKanban(root) {
  root.innerHTML = `
    <section class="kanban-toolbar">
      <div>
        <h2>Project Kanban</h2>
        <p>Simple task movement board for delivery work.</p>
      </div>
      <button class="small-action" type="button">Add Task</button>
    </section>
    <section class="kanban-board" aria-label="Project task board">
      ${kanbanColumns.map((column) => `
        <div class="kanban-column">
          <header><strong>${column.title}</strong><span>${column.tasks.length}</span></header>
          <div class="kanban-stack">
            ${column.tasks.map((task) => `
              <article class="task-card">
                <h3>${task.name}</h3>
                <p>${task.project}</p>
                <div class="task-meta">
                  <span class="priority-${task.priority.toLowerCase()}">${task.priority}</span>
                  <span>${task.owner}</span>
                  <span>${task.due}</span>
                </div>
              </article>
            `).join("")}
          </div>
        </div>
      `).join("")}
    </section>
  `;
}

function renderOpsInvoice(root) {
  const subtotal = 80000;
  const gst = Math.round(subtotal * 0.18);
  root.innerHTML = `
    <section class="invoice-preview">
      <div class="invoice-paper">
        <div class="invoice-head">
          <strong>The Copper Studio</strong>
          <span class="status-pill">Paid</span>
        </div>
        <p>123, Creative Street, Pune, Maharashtra</p>
        <div class="invoice-meta">
          <span>Invoice No: INV-2026-058</span>
          <span>Due Date: 05 Jun 2026</span>
        </div>
        <h2>ABC Pvt Ltd</h2>
        <div class="project-table">
          <div class="table-row table-head"><span>Item</span><span>Description</span><span>Amount</span></div>
          <div class="table-row"><span>1</span><span>Enterprise CRM Development</span><strong>${formatCurrency(76270)}</strong></div>
          <div class="table-row"><span>2</span><span>UI/UX Design</span><strong>${formatCurrency(8475)}</strong></div>
          <div class="table-row"><span>3</span><span>Integration & Testing</span><strong>${formatCurrency(4257)}</strong></div>
        </div>
        <div class="invoice-total">
          <span>Subtotal ${formatCurrency(subtotal)}</span>
          <span>GST ${formatCurrency(gst)}</span>
          <strong>Total ${formatCurrency(subtotal + gst)}</strong>
        </div>
      </div>
    </section>
  `;
}

function renderOpsClient(root) {
  const project = agencyProjects[0];
  root.innerHTML = `
    <section class="client-view">
      <div class="client-hero">
        <p class="mini-label">Client Portal Preview</p>
        <h1>Good Evening, Rohit</h1>
        <p>Your active project is moving well. Next update is scheduled after the review milestone.</p>
      </div>
      <div class="client-grid">
        ${projectCardTemplate(project)}
        <article class="ops-card"><p class="mini-label">Total invoices</p><h3>${formatCurrency(89999)}</h3><span class="status-pill">Paid</span></article>
        <article class="ops-card"><p class="mini-label">Upcoming milestone</p><h3>Testing Phase</h3><p>Starts in 3 days</p></article>
      </div>
      <section class="ops-panel">
        <div class="timeline">
          ${["Requirements Gathering", "UI/UX Design", "Development", "Testing", "Deployment"].map((item, index) => `
            <div class="timeline-row ${index < 3 ? "is-done" : ""}">
              <span></span><strong>${item}</strong><em>${index < 3 ? "Completed" : "Upcoming"}</em>
            </div>
          `).join("")}
        </div>
      </section>
    </section>
  `;
}

function renderAdminPage() {
  const views = {
    overview: renderOpsOverview,
    projects: renderOpsProjects,
    kanban: renderOpsKanban,
    invoice: renderOpsInvoice,
    client: renderOpsClient
  };
  const content = document.getElementById("adminContent");

  Object.entries(views).forEach(([view, render]) => {
    const panel = document.createElement("div");
    panel.className = "admin-view";
    panel.dataset.viewPanel = view;
    render(panel);
    content.appendChild(panel);
  });

  const switchView = (view) => {
    document.querySelectorAll("[data-view]").forEach((button) => {
      button.classList.toggle("is-active", button.dataset.view === view);
    });
    document.querySelectorAll("[data-view-panel]").forEach((panel) => {
      panel.classList.toggle("is-active", panel.dataset.viewPanel === view);
    });
  };

  document.querySelectorAll("[data-view]").forEach((button) => {
    button.addEventListener("click", () => switchView(button.dataset.view));
  });

  switchView("kanban");
}

const pageRenderers = {
  packages: renderPackagesPage,
  checkout: renderCheckoutPage,
  payment: renderPaymentPage,
  success: renderSuccessPage,
  admin: renderAdminPage
};

apiRequest("/crm/packages")
  .then((data) => {
    if (data && data.length) {
      packages = data.map((p) => ({
        ...p,
        id: p.customId || p._id // Ensure legacy mapping for selectedPackageId works
      })).sort((a, b) => a.price - b.price);
    }
  })
  .catch((e) => {
    console.error("Failed to load packages:", e);
  })
  .finally(() => {
    pageRenderers[page]?.();
  });
