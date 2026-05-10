import fs from "node:fs";
import path from "node:path";

const root = process.cwd();
const out = path.join(root, "public", "generated-assets");

const palette = {
  ink: "#08130f",
  panel: "#101c18",
  panel2: "#172721",
  steel: "#9fb6aa",
  mint: "#7cf2b0",
  teal: "#32c4b5",
  cyan: "#7bdff2",
  amber: "#f7c873",
  red: "#ff6b6b",
  blue: "#7aa7ff",
  green: "#9cf27e",
  white: "#f4fff9",
  muted: "#6d8478",
};

const font = "'Geist Mono', 'SFMono-Regular', 'Menlo', monospace";

const ensure = (dir) => fs.mkdirSync(dir, { recursive: true });
const write = (rel, body) => {
  const file = path.join(out, rel);
  ensure(path.dirname(file));
  fs.writeFileSync(file, body);
  return `/generated-assets/${rel}`;
};
const esc = (value) =>
  String(value)
    .replaceAll("&", "&amp;")
    .replaceAll("<", "&lt;")
    .replaceAll(">", "&gt;")
    .replaceAll('"', "&quot;");

const frame = (width, height, inner, opts = {}) => `<?xml version="1.0" encoding="UTF-8"?>
<svg xmlns="http://www.w3.org/2000/svg" width="${width}" height="${height}" viewBox="0 0 ${width} ${height}" role="img" aria-label="${esc(opts.label ?? "Data Center Game asset")}">
  <defs>
    <filter id="glow" x="-30%" y="-30%" width="160%" height="160%">
      <feGaussianBlur stdDeviation="3" result="blur"/>
      <feMerge>
        <feMergeNode in="blur"/>
        <feMergeNode in="SourceGraphic"/>
      </feMerge>
    </filter>
    <linearGradient id="panelGrad" x1="0" x2="1" y1="0" y2="1">
      <stop stop-color="${palette.panel2}" offset="0"/>
      <stop stop-color="${palette.ink}" offset="1"/>
    </linearGradient>
    <pattern id="grid" width="14" height="14" patternUnits="userSpaceOnUse">
      <path d="M 14 0 L 0 0 0 14" fill="none" stroke="${palette.muted}" stroke-width="0.45" opacity="0.25"/>
    </pattern>
  </defs>
  ${inner}
</svg>
`;

const labelSvg = (label, accent = palette.mint) =>
  frame(
    220,
    48,
    `<rect x="1.5" y="1.5" width="217" height="45" rx="8" fill="${palette.panel}" stroke="${accent}" stroke-width="3"/>
     <path d="M16 24h22M27 13v22" stroke="${accent}" stroke-width="3" stroke-linecap="round" opacity="0.85"/>
     <text x="50" y="30" fill="${palette.white}" font-family="${font}" font-size="17" font-weight="800" letter-spacing="0">${esc(label)}</text>`,
    { label }
  );

const objectBase = (name, accent, body) =>
  frame(
    320,
    220,
    `<rect width="320" height="220" rx="18" fill="url(#panelGrad)"/>
     <rect x="12" y="12" width="296" height="196" rx="14" fill="url(#grid)" stroke="${accent}" stroke-width="4"/>
     ${body}
     <text x="160" y="197" text-anchor="middle" fill="${palette.white}" font-family="${font}" font-size="19" font-weight="900" letter-spacing="0">${esc(name)}</text>`,
    { label: name }
  );

const objects = {
  "gpu-pod.svg": objectBase(
    "GPU Pod",
    palette.mint,
    `<g filter="url(#glow)">
       <rect x="68" y="54" width="184" height="104" rx="10" fill="#14241d" stroke="${palette.mint}" stroke-width="4"/>
       ${Array.from({ length: 6 }, (_, i) => `<rect x="${84 + i * 28}" y="70" width="18" height="70" rx="4" fill="${i % 2 ? palette.teal : palette.mint}" opacity="0.95"/>`).join("")}
       <path d="M54 166h212" stroke="${palette.mint}" stroke-width="5" stroke-linecap="round"/>
       <path d="M78 42h164" stroke="${palette.cyan}" stroke-width="3" stroke-dasharray="7 8"/>
     </g>`
  ),
  "frontier-campus.svg": objectBase(
    "Frontier Campus",
    palette.cyan,
    `<g filter="url(#glow)">
       <path d="M52 151V78l54-24 54 24v73z" fill="#12243a" stroke="${palette.cyan}" stroke-width="4"/>
       <path d="M160 151V72l52-24 56 24v79z" fill="#1b2f46" stroke="${palette.blue}" stroke-width="4"/>
       <path d="M74 96h62M74 118h62M182 94h64M182 119h64" stroke="${palette.white}" stroke-width="5" opacity="0.72"/>
       <path d="M92 54v-22M212 48V28M242 62V36" stroke="${palette.amber}" stroke-width="5" stroke-linecap="round"/>
     </g>`
  ),
  "grid-interconnect.svg": objectBase(
    "Grid Interconnect",
    palette.amber,
    `<g filter="url(#glow)" stroke-linecap="round" stroke-linejoin="round">
       <path d="M76 164l44-112 42 112M120 52l42 112M99 108h42M86 138h64" fill="none" stroke="${palette.amber}" stroke-width="7"/>
       <path d="M170 164l44-112 42 112M214 52l42 112M193 108h42M180 138h64" fill="none" stroke="${palette.cyan}" stroke-width="7"/>
       <path d="M42 74c42-22 75-22 118 0s76 22 118 0" fill="none" stroke="${palette.white}" stroke-width="3" opacity="0.7"/>
     </g>`
  ),
  "renewable-ppa.svg": objectBase(
    "Solar + Battery",
    palette.green,
    `<g filter="url(#glow)">
       <circle cx="96" cy="68" r="26" fill="${palette.amber}"/>
       <path d="M52 145l36-56h96l-31 56zM166 145l31-56h70l-24 56z" fill="#1e4c43" stroke="${palette.green}" stroke-width="4"/>
       <path d="M91 105h86M78 124h87M190 106h68M181 124h69" stroke="${palette.cyan}" stroke-width="3" opacity="0.65"/>
       <rect x="66" y="150" width="188" height="18" rx="5" fill="${palette.green}"/>
     </g>`
  ),
  "gas-peaker.svg": objectBase(
    "Gas Peaker",
    palette.red,
    `<g filter="url(#glow)">
       <rect x="78" y="91" width="164" height="70" rx="8" fill="#39201d" stroke="${palette.red}" stroke-width="4"/>
       <path d="M102 91V53h30v38M190 91V44h34v47" fill="#1d1715" stroke="${palette.amber}" stroke-width="4"/>
       <path d="M117 48c-9-20 22-18 7-38M208 38c-14-24 28-20 11-44" fill="none" stroke="${palette.red}" stroke-width="5" opacity="0.8"/>
       <circle cx="116" cy="126" r="12" fill="${palette.amber}"/>
       <circle cx="204" cy="126" r="12" fill="${palette.amber}"/>
     </g>`
  ),
  "chiller-yard.svg": objectBase(
    "Chiller Yard",
    palette.cyan,
    `<g filter="url(#glow)">
       <rect x="72" y="70" width="176" height="94" rx="14" fill="#102b32" stroke="${palette.cyan}" stroke-width="4"/>
       <circle cx="115" cy="116" r="25" fill="none" stroke="${palette.white}" stroke-width="6"/>
       <circle cx="205" cy="116" r="25" fill="none" stroke="${palette.white}" stroke-width="6"/>
       <path d="M115 91v50M90 116h50M205 91v50M180 116h50" stroke="${palette.cyan}" stroke-width="4"/>
       <path d="M62 52c45 16 81 16 125 0s66-16 93 0" fill="none" stroke="${palette.cyan}" stroke-width="5" stroke-dasharray="9 8"/>
     </g>`
  ),
  "water-reuse.svg": objectBase(
    "Water Reuse",
    palette.blue,
    `<g filter="url(#glow)">
       <path d="M160 42c47 46 70 77 70 105 0 38-30 55-70 55s-70-17-70-55c0-28 23-59 70-105z" fill="#132842" stroke="${palette.blue}" stroke-width="5"/>
       <path d="M111 145c35 19 65 19 98 0M123 118c24 12 50 12 74 0" fill="none" stroke="${palette.cyan}" stroke-width="6" stroke-linecap="round"/>
       <path d="M160 72v34" stroke="${palette.white}" stroke-width="6" stroke-linecap="round"/>
     </g>`
  ),
  "community-compact.svg": objectBase(
    "Community Compact",
    palette.amber,
    `<g filter="url(#glow)">
       <path d="M74 151V91l42-30 42 30v60zM166 151V83l45-32 47 32v68z" fill="#2a2414" stroke="${palette.amber}" stroke-width="4"/>
       <path d="M93 151v-31h28v31M190 151v-35h32v35" stroke="${palette.white}" stroke-width="5"/>
       <circle cx="160" cy="76" r="18" fill="${palette.mint}"/>
       <path d="M160 54v44M138 76h44" stroke="${palette.ink}" stroke-width="4"/>
     </g>`
  ),
  "efficiency-lab.svg": objectBase(
    "Efficiency Lab",
    palette.mint,
    `<g filter="url(#glow)">
       <rect x="79" y="61" width="162" height="107" rx="12" fill="#14251b" stroke="${palette.mint}" stroke-width="4"/>
       <path d="M114 142l34-70h20l-21 47h50l-38 61 10-38z" fill="${palette.amber}" stroke="${palette.white}" stroke-width="3"/>
       <path d="M91 88h34M195 88h34M91 119h31M201 119h28" stroke="${palette.cyan}" stroke-width="5" stroke-linecap="round"/>
     </g>`
  ),
  "nuclear-smr.svg": objectBase(
    "SMR Deal",
    palette.teal,
    `<g filter="url(#glow)">
       <path d="M80 164c8-55 22-86 47-98h66c25 12 39 43 47 98z" fill="#15312b" stroke="${palette.teal}" stroke-width="5"/>
       <circle cx="160" cy="109" r="31" fill="${palette.ink}" stroke="${palette.mint}" stroke-width="5"/>
       <path d="M160 79v60M133 124l54-30M133 94l54 30" stroke="${palette.mint}" stroke-width="5" stroke-linecap="round"/>
       <path d="M105 59c21-15 88-15 110 0" fill="none" stroke="${palette.white}" stroke-width="4" opacity="0.66"/>
     </g>`
  ),
  "construction.svg": objectBase(
    "Under Construction",
    palette.amber,
    `<g filter="url(#glow)">
       <path d="M66 160h188L160 47z" fill="#3b2c10" stroke="${palette.amber}" stroke-width="6"/>
       <path d="M160 83v41" stroke="${palette.white}" stroke-width="9" stroke-linecap="round"/>
       <circle cx="160" cy="145" r="6" fill="${palette.white}"/>
       <path d="M92 153h136" stroke="${palette.ink}" stroke-width="9" opacity="0.45"/>
     </g>`
  ),
  "empty-tile.svg": frame(
    320,
    220,
    `<rect width="320" height="220" rx="18" fill="#101814"/>
     <rect x="12" y="12" width="296" height="196" rx="14" fill="url(#grid)" stroke="${palette.muted}" stroke-width="3" stroke-dasharray="10 10"/>
     <path d="M120 110h80M160 70v80" stroke="${palette.muted}" stroke-width="6" stroke-linecap="round"/>
     <text x="160" y="196" text-anchor="middle" fill="${palette.steel}" font-family="${font}" font-size="18" font-weight="800">EMPTY PARCEL</text>`,
    { label: "Empty parcel" }
  ),
};

const labels = [
  ["compute.svg", "COMPUTE", palette.mint],
  ["power.svg", "POWER", palette.amber],
  ["cooling.svg", "COOLING", palette.cyan],
  ["water.svg", "WATER", palette.blue],
  ["support.svg", "PEOPLE", palette.green],
  ["policy.svg", "POLICY", palette.teal],
  ["budget.svg", "BUDGET", palette.amber],
  ["emissions.svg", "EMISSIONS", palette.red],
  ["demand.svg", "AI DEMAND", palette.white],
  ["coverage.svg", "COVERAGE", palette.mint],
  ["analytics.svg", "ANALYTICS", palette.cyan],
  ["leaderboard.svg", "TOP 10", palette.amber],
  ["year.svg", "YEAR", palette.white],
  ["risk.svg", "RISK", palette.red],
];

const ui = {
  "title-lockup.svg": frame(
    840,
    220,
    `<rect width="840" height="220" fill="${palette.ink}"/>
     <rect x="18" y="18" width="804" height="184" rx="18" fill="url(#grid)" stroke="${palette.mint}" stroke-width="3"/>
     <text x="52" y="86" fill="${palette.white}" font-family="${font}" font-size="44" font-weight="900" letter-spacing="0">DATA CENTER GAME</text>
     <text x="54" y="128" fill="${palette.cyan}" font-family="${font}" font-size="20" font-weight="800">BUILD COMPUTE, POWER, WATER, AND TRUST</text>
     <path d="M56 160h540" stroke="${palette.amber}" stroke-width="5"/>
     <rect x="626" y="48" width="124" height="96" rx="12" fill="#14241d" stroke="${palette.mint}" stroke-width="4"/>
     <path d="M646 76h84M646 102h84M646 128h84" stroke="${palette.mint}" stroke-width="6" stroke-linecap="round"/>`,
    { label: "Data Center Game title" }
  ),
  "command-room.svg": frame(
    1440,
    900,
    `<rect width="1440" height="900" fill="${palette.ink}"/>
     <rect width="1440" height="900" fill="url(#grid)" opacity="0.95"/>
     <path d="M0 670C220 605 411 722 620 664s405-182 820-78v314H0z" fill="#0d221b" opacity="0.95"/>
     <path d="M0 0h1440v120H0z" fill="#101c18" opacity="0.9"/>
     <path d="M80 720h1280" stroke="${palette.mint}" stroke-width="2" opacity="0.35"/>
     ${Array.from({ length: 13 }, (_, i) => `<circle cx="${120 + i * 102}" cy="${722 - (i % 4) * 26}" r="${10 + (i % 3) * 4}" fill="${i % 2 ? palette.cyan : palette.amber}" opacity="0.55"/>`).join("")}`,
    { label: "Command room background" }
  ),
  "usa-siting-map.svg": frame(
    980,
    560,
    `<rect width="980" height="560" fill="${palette.ink}"/>
     <rect width="980" height="560" fill="url(#grid)" opacity="0.82"/>
     <path d="M96 188l94-48 142 8 96-56 134 20 94 58 130 24 98 86-54 104-130 56-178-10-146 42-152-42-128 16-38-102 44-78z" fill="#12251f" stroke="${palette.mint}" stroke-width="5" stroke-linejoin="round"/>
     <path d="M72 196l-46 66 30 88 60-28 10-72z" fill="#142820" stroke="${palette.teal}" stroke-width="4"/>
     <path d="M816 292l92 6 28 44-62 36-72-20z" fill="#142820" stroke="${palette.teal}" stroke-width="4"/>
     <path d="M160 234h150M364 172l-36 248M520 132l-20 320M642 188l-38 236M748 226l-78 180M212 400l500-8" stroke="${palette.muted}" stroke-width="2" opacity="0.45"/>
     <text x="34" y="54" fill="${palette.white}" font-family="${font}" font-size="28" font-weight="900">UNITED STATES SITING BOARD</text>
     <text x="36" y="88" fill="${palette.cyan}" font-family="${font}" font-size="16" font-weight="800">STATE DATA MODIFIES COST, PERMITS, WATER, AND PUBLIC SUPPORT</text>`,
    { label: "United States data center siting map" }
  ),
  "meter-strip.svg": frame(
    720,
    72,
    `<rect x="2" y="2" width="716" height="68" rx="12" fill="${palette.panel}" stroke="${palette.muted}" stroke-width="3"/>
     <path d="M25 36h660" stroke="${palette.muted}" stroke-width="10" stroke-linecap="round"/>
     <path d="M25 36h415" stroke="${palette.mint}" stroke-width="10" stroke-linecap="round" filter="url(#glow)"/>
     <text x="28" y="28" fill="${palette.white}" font-family="${font}" font-size="14" font-weight="900">SYSTEM METER</text>`,
    { label: "System meter strip" }
  ),
};

const manifest = {
  generatedAt: new Date().toISOString(),
  visualSystem: {
    font,
    palette,
    radius: 8,
    assetKind: "deterministic SVG images",
  },
  objects: {},
  labels: {},
  ui: {},
};

fs.rmSync(out, { recursive: true, force: true });

for (const [name, body] of Object.entries(objects)) {
  manifest.objects[name.replace(".svg", "")] = write(`objects/${name}`, body);
}
for (const [name, label, accent] of labels) {
  manifest.labels[name.replace(".svg", "")] = write(`labels/${name}`, labelSvg(label, accent));
}
for (const [name, body] of Object.entries(ui)) {
  manifest.ui[name.replace(".svg", "")] = write(`ui/${name}`, body);
}

write("manifest.json", JSON.stringify(manifest, null, 2));

console.log(`Generated ${Object.keys(manifest.objects).length} object assets, ${Object.keys(manifest.labels).length} label assets, and ${Object.keys(manifest.ui).length} UI assets.`);
