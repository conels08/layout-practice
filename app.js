/* ===== Basic UX ===== */
const $ = (sel, root = document) => root.querySelector(sel);
const $$ = (sel, root = document) => [...root.querySelectorAll(sel)];

const yearEl = $("#year");
if (yearEl) yearEl.textContent = new Date().getFullYear();

/* Mobile nav toggle */
const navToggle = $(".nav__toggle");
const navMenu = $("#nav-menu");
if (navToggle && navMenu) {
  navToggle.addEventListener("click", () => {
    const open = navToggle.getAttribute("aria-expanded") === "true";
    navToggle.setAttribute("aria-expanded", String(!open));
    navMenu.style.display = open ? "none" : "flex";
  });
  // Close nav on link click (mobile)
  $$("#nav-menu a").forEach((a) =>
    a.addEventListener("click", () => {
      if (window.innerWidth < 960) {
        navMenu.style.display = "none";
        navToggle.setAttribute("aria-expanded", "false");
      }
    })
  );
}

/* ===== Estimator ===== */
const service = $("#service");
const size = $("#size");
const sizeUnit = $("#sizeUnit");
const unitHint = $("#unitHint");
const calcBtn = $("#calcBtn");
const output = $("#estimateOutput");
const rangeLow = $("#rangeLow");
const rangeHigh = $("#rangeHigh");
const midpoint = $("#midpoint");
const breakdown = $("#breakdown");
const zip = $("#zip");

function fmt(n) {
  return n.toLocaleString(undefined, {
    style: "currency",
    currency: "USD",
    maximumFractionDigits: 0,
  });
}

// Update unit label when service changes
service?.addEventListener("change", (e) => {
  const opt = service.selectedOptions[0];
  const unit = opt?.dataset.unit || "units";
  sizeUnit.textContent = unit === "sqft" ? "sq ft" : "units";
  unitHint.textContent =
    unit === "sqft"
      ? "Enter the approximate square footage (e.g., 160)."
      : "Enter the number of units (e.g., 8 windows).";
});

// Calculate estimate
function calcEstimate() {
  // Basic validation
  const opt = service?.selectedOptions[0];
  const qty = Number(size?.value || 0);
  if (!opt || !qty) {
    rangeLow.textContent = rangeHigh.textContent = midpoint.textContent = "—";
    breakdown.innerHTML =
      "<p>Please select a service and enter size/quantity.</p>";
    return;
  }

  const base = Number(opt.dataset.base || 0); // base price per unit
  const unit = opt.dataset.unit;
  const complexity = Number($('input[name="complexity"]:checked')?.value || 1);

  // Add-ons
  let addons = 0;
  const addonLines = [];
  $$('input[type="checkbox"]').forEach((cb) => {
    if (cb.checked) {
      const val = Number(cb.value);
      addons += val;
      addonLines.push(
        `${cb.parentElement?.textContent?.trim() || "Add-on"}: +${fmt(val)}`
      );
    }
  });

  // Regional adj based on zip (super simple ±5%)
  let regionFactor = 1;
  if (zip?.value && /^\d{5}$/.test(zip.value)) {
    const z = Number(zip.value);
    // naive: higher cost for coastal/metro-ish zips within example range
    regionFactor = z % 10 < 5 ? 0.98 : 1.05;
  }

  // Core calc
  const baseCost = base * qty;
  const complexityCost = baseCost * complexity;
  const subtotal = complexityCost + addons;
  const regional = subtotal * regionFactor;

  // Present range (±10%)
  const low = regional * 0.9;
  const high = regional * 1.1;
  const mid = regional;

  rangeLow.textContent = fmt(low);
  rangeHigh.textContent = fmt(high);
  midpoint.textContent = fmt(mid);

  // Breakdown
  const lines = [
    `Service: ${opt.textContent?.trim()} @ ${fmt(base)} / ${
      unit === "sqft" ? "sq ft" : "unit"
    } × ${qty} = ${fmt(baseCost)}`,
    `Complexity factor × ${complexity} → ${fmt(complexityCost)}`,
    ...(addonLines.length ? addonLines : []),
    `Regional factor × ${regionFactor.toFixed(2)} → ${fmt(regional)}`,
  ];
  breakdown.innerHTML = `<ul>${lines
    .map((l) => `<li>${l}</li>`)
    .join("")}</ul>`;
}

calcBtn?.addEventListener("click", calcEstimate);

/* ===== Contact form (demo only) ===== */
const contactForm = $("#contactForm");
const contactNote = $("#contactNote");
contactForm?.addEventListener("submit", (e) => {
  e.preventDefault();
  const data = Object.fromEntries(new FormData(contactForm));
  // TODO: Replace with real POST to your backend or form service.
  contactNote.textContent = "Thanks! We’ll reach out within one business day.";
  contactForm.reset();
});

/* Improve keyboard focus for hash links */
window.addEventListener("hashchange", () => {
  const id = location.hash.slice(1);
  const el = document.getElementById(id);
  if (el) el.setAttribute("tabindex", "-1"), el.focus();
});
