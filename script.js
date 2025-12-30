let customers = [];

function nm(v) {
  return v
    .trim()
    .replace(/\s+/g, " ")
    .replace(/^\w/, (c) => c.toUpperCase());
}

// DOM
const inputName = document.getElementById("inputName");
const chkA = document.getElementById("chkA");
const chkB = document.getElementById("chkB");
const chkC = document.getElementById("chkC");
const btnAdd = document.getElementById("btnAdd");
const btnSample = document.getElementById("btnSample");
const btnReset = document.getElementById("btnReset");

const countA = document.getElementById("countA");
const countB = document.getElementById("countB");
const countC = document.getElementById("countC");
const countAB = document.getElementById("countAB");
const countBC = document.getElementById("countBC");
const countAC = document.getElementById("countAC");
const countABC = document.getElementById("countABC");

const listOutput = document.getElementById("listOutput");
const promoArea = document.getElementById("promoArea");
const comboArea = document.getElementById("comboArea");
const rawDataArea = document.getElementById("rawDataArea");
const thresholdInput = document.getElementById("threshold");

const vennSvg = document.getElementById("vennSvg");

// Region buttons
document.querySelectorAll(".region-btns button").forEach((b) => {
  b.addEventListener("click", () => showRegion(b.dataset.region));
});

// SVG circle clicks
["A", "B", "C"].forEach((id) => {
  const circle = vennSvg.querySelector("#" + id);
  circle.style.cursor = "pointer";
  circle.addEventListener("click", () => showRegion(id));
});

// Add sample data
// btnSample.addEventListener("click", () => {
//   customers = [
//     { name: "Andi", packs: { A: true, B: false, C: true } },
//     { name: "Budi", packs: { A: true, B: true, C: false } },
//     { name: "Cici", packs: { A: true, B: false, C: false } },
//     { name: "Deni", packs: { A: false, B: true, C: true } },
//     { name: "Eka", packs: { A: false, B: true, C: false } },
//     { name: "Fajar", packs: { A: false, B: false, C: true } },
//     { name: "Gina", packs: { A: true, B: true, C: true } },
//     { name: "Hani", packs: { A: false, B: true, C: true } },
//   ];
//   refreshAll();
// });

// Reset data
btnReset.addEventListener("click", () => {
  if (!confirm("Reset semua data?")) return;
  customers = [];
  refreshAll();
});

// Add order
btnAdd.addEventListener("click", () => {
  const raw = inputName.value;
  if (!raw.trim()) return alert("Masukkan nama pelanggan terlebih dahulu.");
  const name = nm(raw);

  const packs = { A: chkA.checked, B: chkB.checked, C: chkC.checked };
  if (!packs.A && !packs.B && !packs.C)
    return alert("Pilih minimal satu menu.");

  const existing = customers.find(
    (c) => c.name.toLowerCase() === name.toLowerCase()
  );

  if (existing) {
    existing.packs.A ||= packs.A;
    existing.packs.B ||= packs.B;
    existing.packs.C ||= packs.C;
  } else {
    customers.push({ name, packs });
  }

  inputName.value = "";
  chkA.checked = chkB.checked = chkC.checked = false;

  refreshAll();
});

// Compute sets
function computeSets() {
  const A = new Set(),
    B = new Set(),
    C = new Set();

  customers.forEach((c) => {
    if (c.packs.A) A.add(c.name);
    if (c.packs.B) B.add(c.name);
    if (c.packs.C) C.add(c.name);
  });

  const AB = new Set([...A].filter((x) => B.has(x)));
  const BC = new Set([...B].filter((x) => C.has(x)));
  const AC = new Set([...A].filter((x) => C.has(x)));
  const ABC = new Set([...AB].filter((x) => C.has(x)));

  return { A, B, C, AB, BC, AC, ABC };
}

function refreshAll() {
  const s = computeSets();

  countA.textContent = s.A.size;
  countB.textContent = s.B.size;
  countC.textContent = s.C.size;
  countAB.textContent = s.AB.size;
  countBC.textContent = s.BC.size;
  countAC.textContent = s.AC.size;
  countABC.textContent = s.ABC.size;

  rawDataArea.innerHTML = "";
  if (customers.length === 0) rawDataArea.textContent = "(Tidak ada pesanan)";
  else {
    const ul = document.createElement("ul");
    customers.forEach((c) => {
      const li = document.createElement("li");
      const packs = [];
      if (c.packs.A) packs.push("Kopi");
      if (c.packs.B) packs.push("Roti");
      if (c.packs.C) packs.push("Ice Cream");
      li.textContent = `${c.name} — Paket: ${packs.join(", ")}`;
      ul.appendChild(li);
    });
    rawDataArea.appendChild(ul);
  }

  updatePromos(s);
  updateCombos(s);

  listOutput.innerHTML = "<li>Klik lingkaran untuk melihat anggota.</li>";

  visualHint(s);
}

// === FINAL: diskon sepi tanpa minimum (0% – 25%) ===
function calcDiscountSparse(count, maxCount) {
  const diff = maxCount - count; // semakin sepi → semakin besar
  return Math.min(Math.max(diff, 0), 50); // 0% s.d. 25%
}

function updatePromos(sets) {
  const promos = [];
  // cari jumlah pelanggan tertinggi (acuan "ramai")
  const maxCount = Math.max(
    sets.A.size,
    sets.B.size,
    sets.C.size,
    sets.AB.size,
    sets.BC.size,
    sets.AC.size,
    sets.ABC.size,
    1
  );

  const th = Math.max(1, Number(thresholdInput.value) || 1);

  if (sets.A.size >= th) {
    const d = calcDiscountSparse(sets.A.size, maxCount);
    if (d > 0) {
      promos.push({
        type: "package",
        text: `Promo Kopi: Diskon ${d}% (${sets.A.size} pembeli)`,
      });
    }
  }
  if (sets.B.size >= th) {
    const d = calcDiscountSparse(sets.B.size, maxCount);
    if (d > 0) {
      promos.push({
        type: "package",
        text: `Promo Roti: Diskon ${d}% (${sets.B.size} pembeli)`,
      });
    }
  }
  if (sets.C.size >= th) {
    const d = calcDiscountSparse(sets.C.size, maxCount);
    if (d > 0) {
      promos.push({
        type: "package",
        text: `Promo Ice Cream: Diskon ${d}% (${sets.C.size} pembeli)`,
      });
    }
  }

  if (sets.AB.size >= th) {
    const d = calcDiscountSparse(sets.AB.size, maxCount);
    if (d > 0) {
      promos.push({
        type: "bundle",
        text: `Bundle Kopi + Roti: Diskon ${d}% (${sets.AB.size} pembeli)`,
      });
    }
  }
  if (sets.BC.size >= th) {
    const d = calcDiscountSparse(sets.BC.size, maxCount);
    if (d > 0) {
      promos.push({
        type: "bundle",
        text: `Bundle Roti + Ice Cream: Diskon ${d}% (${sets.BC.size} pembeli)`,
      });
    }
  }
  if (sets.AC.size >= th) {
    const d = calcDiscountSparse(sets.AC.size, maxCount);
    if (d > 0) {
      promos.push({
        type: "bundle",
        text: `Bundle Kopi + Ice Cream: Diskon ${d}% (${sets.AC.size} pembeli)`,
      });
    }
  }
  if (sets.ABC.size >= th) {
    const d = calcDiscountSparse(sets.ABC.size, maxCount);
    if (d > 0) {
      promos.push({
        type: "bundle",
        text: `Bundle Kopi + Roti + Ice Cream: Diskon ${d}% (${sets.ABC.size} pembeli)`,
      });
    }
  }

  promoArea.innerHTML = "";
  if (promos.length === 0) {
    promoArea.innerHTML =
      '<div class="promo">Belum ada rekomendasi promo.</div>';
  } else {
    promos.forEach((p) => {
      const d = document.createElement("div");
      d.className = "promo";
      d.textContent = p.text;
      promoArea.appendChild(d);
    });
  }
}

function updateCombos(sets) {
  const combos = [
    { k: "Kopi", s: sets.A.size },
    { k: "Roti", s: sets.B.size },
    { k: "Ice Cream", s: sets.C.size },
    { k: "Kopi ∩ Roti", s: sets.AB.size },
    { k: "Roti ∩ Ice Cream", s: sets.BC.size },
    { k: "Kopi ∩ Ice Cream", s: sets.AC.size },
    { k: "Kopi ∩ Roti ∩ Ice Cream", s: sets.ABC.size },
  ];

  combos.sort((a, b) => b.s - a.s);
  comboArea.innerHTML = "";
  combos.forEach((c) => {
    const el = document.createElement("div");
    el.textContent = `${c.k} — ${c.s} pelanggan`;
    comboArea.appendChild(el);
  });
}

function showRegion(region) {
  const s = computeSets();
  let members = [];

  switch (region) {
    case "A":
      members = [...s.A];
      break;
    case "B":
      members = [...s.B];
      break;
    case "C":
      members = [...s.C];
      break;
    case "AB":
      members = [...s.AB];
      break;
    case "BC":
      members = [...s.BC];
      break;
    case "AC":
      members = [...s.AC];
      break;
    case "ABC":
      members = [...s.ABC];
      break;
    case "ALL":
      members = customers.map((x) => x.name);
      break;
  }

  listOutput.innerHTML = "";

  if (members.length === 0) {
    listOutput.innerHTML = "<li>(Tidak ada pelanggan)</li>";
  } else {
    members.sort();
    members.forEach((m) => {
      const li = document.createElement("li");
      li.textContent = m;
      listOutput.appendChild(li);
    });
  }
}

function visualHint(sets) {
  const max = Math.max(sets.A.size, sets.B.size, sets.C.size, 1);
  const scale = (n) => Math.min(0.65, 0.2 + 0.6 * (n / max));

  vennSvg.querySelector("#A").setAttribute("fill-opacity", scale(sets.A.size));
  vennSvg.querySelector("#B").setAttribute("fill-opacity", scale(sets.B.size));
  vennSvg.querySelector("#C").setAttribute("fill-opacity", scale(sets.C.size));
}

refreshAll();
