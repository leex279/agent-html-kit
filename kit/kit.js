/* agent-html-kit — let an agent write HTML at close to markdown token cost.
 *
 * The design lives here, once. A document only carries content:
 *   <!doctype html><meta charset="utf-8"><script src="kit/kit.js" defer></script>
 *   <rk-header title="..."></rk-header> ...
 *
 * Components read their text content as short line-based data, so the agent
 * never writes CSS, SVG paths or table markup. See SKILL.md for the contract.
 * MIT licensed.
 */
(() => {
  "use strict";

  const STYLE = `
:root{--bg:#f4f6f9;--card:#fff;--ink:#0f172a;--ink2:#334155;--muted:#64748b;--line:#e3e8ef;
--accent:#4f46e5;--accent2:#7c3aed;--soft:#eef2ff;
--green:#047857;--green-bg:#dcfce7;--blue:#1d4ed8;--blue-bg:#dbeafe;--red:#b91c1c;--red-bg:#fee2e2;
--amber:#b45309;--amber-bg:#fef3c7;--gray:#475569;--gray-bg:#e2e8f0;
--shadow:0 1px 2px rgba(15,23,42,.05),0 8px 24px rgba(15,23,42,.06);--r:16px;
--font:"Inter","Segoe UI",system-ui,-apple-system,Roboto,Arial,sans-serif;--mono:"JetBrains Mono",Consolas,ui-monospace,monospace}
*{box-sizing:border-box}
html,body{margin:0}
body.rk{background:var(--bg);color:var(--ink);font:15px/1.6 var(--font);-webkit-font-smoothing:antialiased}
.rk-page{max-width:1080px;margin:0 auto;padding:40px 28px 64px}
.rk-page>h1{font-size:30px;line-height:1.2;margin:0 0 18px;letter-spacing:-.02em}
.rk-page h2{font-size:19px;font-weight:720;letter-spacing:-.01em;color:var(--ink);margin:40px 0 14px}
.rk-id{font:600 12px var(--mono);color:#3730a3;background:var(--soft);padding:2px 7px;border-radius:6px;white-space:nowrap}
.rk-page>ul,.rk-page>ol,.rk-col>ul,.rk-col>ol{background:var(--card);border:1px solid var(--line);border-radius:var(--r);box-shadow:var(--shadow);padding:14px 20px 14px 40px}
.rk-page>ul li,.rk-page>ol li,.rk-col>ul li,.rk-col>ol li{padding:6px 0;border-bottom:1px solid var(--line);margin:0}
.rk-page>ul li:last-child,.rk-page>ol li:last-child,.rk-col>ul li:last-child,.rk-col>ol li:last-child{border-bottom:0}
rk-cols,.rk-cols{display:grid;grid-template-columns:repeat(auto-fit,minmax(300px,1fr));gap:22px;align-items:start}
.rk-col>h2:first-child{margin-top:40px}
.rk-sum{padding:14px 18px 12px;border-bottom:1px solid var(--line);background:#fff}
.rk-sum .bar{display:flex;height:9px;border-radius:99px;overflow:hidden;gap:3px}
.rk-sum .bar span{display:block}
.rk-sum .leg{display:flex;gap:16px;margin-top:9px;font-size:13px;color:var(--ink2)}
.rk-sum .leg b{color:var(--ink)}
.rk-sum .dot{display:inline-block;width:8px;height:8px;border-radius:50%;margin-right:6px}
.rk-page tr.rk-hot td{background:#fff7f7}
.rk-page tr.rk-hot td:first-child{box-shadow:inset 3px 0 0 var(--red)}
.rk-page td.rk-strong{font-weight:620;color:var(--ink)}
.rk-hero+rk-stats .rk-stats,rk-header+rk-stats .rk-stats,rk-header+div .rk-stats{margin-top:-34px;padding:0 18px;position:relative;z-index:2}
rk-header+rk-stats,rk-header+div{display:block}
.rk-page h3{font-size:17px;margin:24px 0 8px}
.rk-page p{margin:0 0 12px;color:var(--ink2)}
.rk-page ul,.rk-page ol{margin:0 0 14px;padding-left:22px;color:var(--ink2)}
.rk-page li{margin:4px 0}
.rk-page li>ul,.rk-page li>ol{margin:4px 0 0}.rk-page li li{border-bottom:0!important;padding:2px 0!important}
.rk-page li.rk-task{list-style:none;margin-left:-22px}
.rk-page li.rk-task input{margin-right:8px;accent-color:var(--accent)}
.rk-page a{color:var(--accent)}
.rk-page code{font:13px var(--mono);background:var(--soft);color:#3730a3;padding:1px 6px;border-radius:6px}
.rk-page pre{background:#0f172a;color:#e2e8f0;padding:16px 18px;border-radius:12px;overflow:auto;font:13px/1.55 var(--mono)}
.rk-page pre code{background:none;color:inherit;padding:0}
.rk-page blockquote{margin:0 0 14px;padding:10px 16px;border-left:4px solid var(--line);color:var(--ink2);background:#fff;border-radius:0 10px 10px 0}
.rk-page hr{border:0;border-top:1px solid var(--line);margin:28px 0}
.rk-card{background:var(--card);border:1px solid var(--line);border-radius:var(--r);box-shadow:var(--shadow)}
.rk-ctitle{font-weight:650;font-size:14.5px;margin:0 0 10px;color:var(--ink)}
rk-header{display:block}
.rk-hero{position:relative;overflow:hidden;border-radius:20px;padding:34px 38px;color:#fff;
background:linear-gradient(135deg,#0f172a 0%,#312e81 55%,#4f46e5 100%);box-shadow:var(--shadow)}
.rk-hero::after{content:"";position:absolute;right:-90px;top:-90px;width:300px;height:300px;border-radius:50%;
background:radial-gradient(circle,rgba(255,255,255,.16),rgba(255,255,255,0) 70%)}
.rk-hero .t{font-size:30px;font-weight:750;letter-spacing:-.02em;line-height:1.15;margin:0}
.rk-hero .s{margin-top:8px;font-size:15px;opacity:.82}
.rk-hero .tag{display:inline-block;margin-bottom:12px;font:600 11.5px var(--mono);letter-spacing:.08em;text-transform:uppercase;
background:rgba(255,255,255,.14);padding:4px 10px;border-radius:999px}
.rk-stats{display:grid;grid-template-columns:repeat(auto-fit,minmax(190px,1fr));gap:14px;margin:18px 0}
.rk-stat{padding:18px 20px}
.rk-stat .v{font-size:32px;font-weight:780;letter-spacing:-.02em;line-height:1.1;color:var(--ink);margin-top:8px}
.rk-stat .l{font-size:11.5px;font-weight:700;letter-spacing:.08em;text-transform:uppercase;color:var(--muted)}
.rk-stat .l::before{content:"";display:inline-block;width:8px;height:8px;border-radius:2px;margin-right:8px;background:var(--dot,var(--accent))}
.rk-stat .n{font-size:12.5px;margin-top:8px;color:var(--ink2)}
.rk-stat .n.good{color:var(--green)}.rk-stat .n.bad{color:var(--red)}
.rk-tablewrap{overflow:auto;margin:0 0 16px}
.rk-page table{width:100%;border-collapse:collapse;font-size:14px;background:var(--card)}
.rk-page th{text-align:left;font-size:11.5px;letter-spacing:.07em;text-transform:uppercase;color:var(--muted);
background:#f8fafc;padding:11px 14px;border-bottom:1px solid var(--line)}
.rk-page td{padding:11px 14px;border-bottom:1px solid var(--line);vertical-align:top;color:var(--ink2)}
.rk-page tr:last-child td{border-bottom:0}
.rk-page table.rk-table,.rk-tablewrap table{border:1px solid var(--line);border-radius:var(--r);overflow:hidden;box-shadow:var(--shadow);border-collapse:separate;border-spacing:0}
.rk-pill{display:inline-flex;align-items:center;gap:6px;font-size:12px;font-weight:650;padding:3px 10px;border-radius:999px;white-space:nowrap}
.rk-pill::before{content:"";width:7px;height:7px;border-radius:50%;background:currentColor}
.rk-pill.done,.rk-pill.ok{color:var(--green);background:var(--green-bg)}
.rk-pill.progress{color:var(--blue);background:var(--blue-bg)}
.rk-pill.blocked,.rk-pill.fail{color:var(--red);background:var(--red-bg)}
.rk-pill.warn{color:var(--amber);background:var(--amber-bg)}
.rk-pill.todo{color:var(--gray);background:var(--gray-bg)}
rk-pill{display:contents}
.rk-callout{display:flex;gap:12px;padding:14px 18px;border-radius:14px;margin:0 0 12px;border:1px solid;font-size:14.5px}
.rk-callout .i{flex:none;width:24px;height:24px;border-radius:50%;display:grid;place-items:center;font:700 13px var(--font);color:#fff}
.rk-callout .b{color:var(--ink2)}.rk-callout .b b:first-child{color:var(--ink)}
.rk-callout.risk{background:#fff5f5;border-color:#fecaca}.rk-callout.risk .i{background:var(--red)}
.rk-callout.warn{background:#fffbeb;border-color:#fde68a}.rk-callout.warn .i{background:var(--amber)}
.rk-callout.note{background:#f5f7ff;border-color:#c7d2fe}.rk-callout.note .i{background:var(--accent)}
.rk-callout.ok{background:#f0fdf4;border-color:#bbf7d0}.rk-callout.ok .i{background:var(--green)}
.rk-chart,.rk-diagram{padding:18px 20px;margin:0 0 16px}
.rk-chart svg,.rk-diagram svg{display:block;width:100%;height:auto}
.rk-scroll{overflow-x:auto}.rk-chart .rk-scroll>svg{min-width:600px}
.rk-chart text,.rk-diagram text{font-family:var(--font)}
.rk-steps{list-style:none;padding:0!important;margin:0 0 16px!important;display:grid;gap:10px;counter-reset:s}
.rk-steps li{display:flex;gap:14px;padding:14px 18px;margin:0}
.rk-steps li::before{counter-increment:s;content:counter(s);flex:none;width:28px;height:28px;border-radius:9px;display:grid;place-items:center;
background:var(--soft);color:var(--accent);font-weight:750;font-size:14px}
.rk-steps .st{font-weight:650;color:var(--ink)}.rk-steps .sd{color:var(--ink2);font-size:14px}
.rk-board{margin:0 0 16px}
.rk-board .bar{display:flex;justify-content:space-between;align-items:center;margin-bottom:10px}
.rk-board .lanes{display:grid;gap:12px;grid-template-columns:repeat(var(--n),minmax(0,1fr))}
.rk-lane{background:#e9edf3;border-radius:14px;padding:10px;min-height:160px;transition:background .15s}
.rk-lane.over{background:#dfe5ff}
.rk-lane.inbox{display:grid;grid-template-columns:repeat(auto-fill,minmax(210px,1fr));gap:8px;min-height:90px;margin-bottom:12px;background:#f1f4f8;border:1.5px dashed #cbd5e1}
.rk-lane.inbox .lh{grid-column:1/-1;padding-bottom:2px}.rk-lane.inbox .rk-item{margin:0}
.rk-lane .lh{display:flex;justify-content:space-between;font-size:12px;font-weight:700;letter-spacing:.06em;text-transform:uppercase;color:var(--muted);padding:2px 4px 8px}
.rk-item{background:#fff;border:1px solid var(--line);border-radius:10px;padding:9px 11px;margin-bottom:8px;cursor:grab;box-shadow:0 1px 2px rgba(15,23,42,.05);font-size:13.5px}
.rk-item .id{font:600 11.5px var(--mono);color:var(--accent)}
.rk-item.drag{opacity:.4}
.rk-item.pick{outline:2px solid var(--accent);outline-offset:1px}
.rk-board .hint{font-size:12px;color:var(--muted);margin:-4px 0 10px}
@media (max-width:700px){.rk-board .lanes{grid-template-columns:repeat(2,minmax(0,1fr))}}
.rk-btn{font:650 13px var(--font);color:#fff;background:var(--accent);border:0;border-radius:10px;padding:8px 14px;cursor:pointer}
.rk-out{width:100%;min-height:120px;margin-top:10px;font:13px/1.5 var(--mono);border:1px solid var(--line);border-radius:10px;padding:10px;display:none}
body.rk-plain{background:#fff;color:#1f2328;font:16px/1.6 -apple-system,"Segoe UI",Helvetica,Arial,sans-serif}
body.rk-plain .rk-page{max-width:900px}
body.rk-plain .rk-page h1,body.rk-plain .rk-page h2{font-size:24px;letter-spacing:0;text-transform:none;color:#1f2328;border-bottom:1px solid #d1d9e0;padding-bottom:6px;margin:28px 0 14px}
body.rk-plain .rk-page h1{font-size:30px}
body.rk-plain .rk-page th{text-transform:none;font-size:14px;color:#1f2328;letter-spacing:0;border:1px solid #d1d9e0}
body.rk-plain .rk-page td{border:1px solid #d1d9e0}
body.rk-plain .rk-tablewrap table{box-shadow:none;border-radius:0;border-collapse:collapse}
body.rk-plain .rk-page pre{background:#f6f8fa;color:#1f2328}
body.rk-plain .rk-page code{background:#eff1f3;color:#1f2328}
body.rk-plain .rk-card{box-shadow:none;border-radius:6px}
body.rk-plain .rk-page>ul,body.rk-plain .rk-page>ol{background:none;border:0;box-shadow:none;padding:0 0 0 26px}
body.rk-plain .rk-page>ul li,body.rk-plain .rk-page>ol li{border:0;padding:2px 0}
`;

  const PILLS = {
    done: "Done", progress: "In progress", blocked: "Blocked", todo: "To do",
    ok: "OK", warn: "At risk", fail: "Failed",
  };
  const ICON = { risk: "!", warn: "!", note: "i", ok: "✓" };

  const esc = (s) => String(s).replace(/[&<>"]/g, (c) => ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;" }[c]));
  const pill = (k, label) => `<span class="rk-pill ${esc(k)}">${esc(label || PILLS[k] || k)}</span>`;

  // Inline markdown subset: **bold**, *italic*, ~~strike~~, `code`, [text](url), ![alt](src), [done]-style pills.
  // Code spans stay literal; only the text between them is formatted.
  function inline(s, pills = true) {
    return String(s).split(/(`[^`]+`)/).map((part, i) => (i % 2 ? `<code>${esc(part.slice(1, -1))}</code>` : prose(part, pills))).join("");
  }
  function prose(s, pills) {
    // Link and image tags are parked as placeholders, so bold/pill/ID rules never touch an href.
    const keep = [];
    const hold = (html) => `\u0000${keep.push(html) - 1}\u0000`;
    let out = esc(s).replace(/\u0000/g, "");
    out = out.replace(/!\[([^\]]*)\]\(([^)\s]+)\)/g, (m, alt, u) => (safeUrl(u) ? hold(`<img src="${u}" alt="${alt}">`) : alt));
    out = out.replace(/\[([^\]]+)\]\(([^)\s]+)\)/g, (m, t, u) => (safeUrl(u) ? hold(`<a href="${u}">`) + t + hold("</a>") : t));
    out = out.replace(/\*\*([^*]+)\*\*/g, "<b>$1</b>");
    out = out.replace(/(^|[^*])\*([^*\s][^*]*)\*/g, "$1<i>$2</i>");
    out = out.replace(/~~([^~]+)~~/g, "<s>$1</s>");
    if (pills) {
      out = out.replace(/\[(done|progress|blocked|todo|ok|warn|fail)\]/gi, (_, k) => pill(k.toLowerCase()));
      out = chipIds(out);
    }
    return out.replace(/\u0000(\d+)\u0000/g, (_, k) => keep[k]);
  }
  // Links and images: http(s), mailto, anchors and relative paths only (no javascript: and friends).
  const safeUrl = (u) => !/[\x00-\x1f]/.test(u) && (/^(https?:|mailto:|#|\/|\.)/i.test(u) || !/^[a-z][a-z0-9+.-]*:/i.test(u));
  // Ticket-style IDs (CHK-104, ENG-12) become mono chips, outside of tags only. UTF-8, SHA-256 & co. are not tickets.
  const NOT_ID = /^(UTF|SHA|ISO|GPT|RFC|CVE|ES|MP|AES|RSA|TLS|SSL|HTTP|IPV|PEP|COVID|ECMA|RTX|GTX|ANSI)-/;
  const chipIds = (html) => html.replace(/(<[^>]+>)|\b([A-Z][A-Z0-9]{1,9}-\d+)\b/g, (m, tag, id) => tag || (NOT_ID.test(id) ? id : `<span class="rk-id">${id}</span>`));

  // Raw text of a component, whether written as text or inside <script type="text/plain">.
  function rawText(el) {
    const s = el.querySelector(':scope > script[type^="text/"]');
    // md2html writes "<\/script" so a script tag inside the markdown cannot end the block early.
    return (s ? s.textContent.replace(/<\\\/script/gi, "</script") : el.textContent);
  }
  const lines = (txt) => txt.split(/\r?\n/).map((l) => l.trim()).filter(Boolean);
  const cells = (l) => l.replace(/^\|/, "").replace(/\|$/, "").split("|").map((c) => c.trim());

  // "key: value" header lines at the top of a block (used by markdown fences).
  function splitMeta(ls, keys) {
    const meta = {};
    while (ls.length) {
      const m = ls[0].match(/^(\w+):\s*(.*)$/);
      if (!m || !keys.includes(m[1].toLowerCase())) break;
      meta[m[1].toLowerCase()] = m[2];
      ls.shift();
    }
    return meta;
  }

  /* ---------- components ---------- */

  function header(el) {
    const tag = el.getAttribute("tag");
    el.innerHTML = `<div class="rk-hero">${tag ? `<div class="tag">${esc(tag)}</div>` : ""}<h1 class="t">${inline(el.getAttribute("title") || "")}</h1>${
      el.getAttribute("sub") || el.getAttribute("period") ? `<div class="s">${inline(el.getAttribute("sub") || el.getAttribute("period"))}</div>` : ""}</div>`;
  }

  function stats(el, ls) {
    // Lines "value | label | note", or child <rk-stat value label note|delta> elements.
    let rows = [];
    const kids = el.querySelectorAll("rk-stat");
    if (kids.length) rows = [...kids].map((k) => [k.getAttribute("value"), k.getAttribute("label"), k.getAttribute("note") || k.getAttribute("delta") || ""]);
    else rows = (ls || lines(rawText(el))).map(cells);
    const DOTS = ["#6366f1", "#f59e0b", "#10b981", "#ec4899", "#0ea5e9", "#8b5cf6"];
    el.innerHTML = `<div class="rk-stats">${rows.map(([v, l, n], i) => {
      let cls = "";
      if (n && /^\+/.test(n)) cls = "good";
      if (n && /^!/.test(n)) cls = "bad";
      return `<div class="rk-card rk-stat" style="--dot:${DOTS[i % DOTS.length]}"><div class="l">${inline(l || "")}</div><div class="v">${inline(v || "")}</div>${n ? `<div class="n ${cls}">${inline(n.replace(/^[+!]\s*/, ""))}</div>` : ""}</div>`;
    }).join("")}</div>`;
  }

  function table(el, ls, pills = true) {
    ls = (ls || lines(rawText(el))).filter((l) => !/^\|?\s*:?-{2,}/.test(l));
    if (!ls.length) return;
    const [head, ...rows] = ls.map(cells);
    const idCol = pills && rows.length && rows.every((r) => /^[A-Z][A-Z0-9]{1,9}-\d+$/.test(r[0] || ""));
    // Status summary bar, computed from the pills in the table: zero tokens for the agent.
    const counts = {};
    if (pills) rows.forEach((r) => r.forEach((c) => (c.match(/\[(done|progress|blocked|todo|ok|warn|fail)\]/gi) || []).forEach((t) => {
      const k = t.slice(1, -1).toLowerCase(); counts[k] = (counts[k] || 0) + 1;
    })));
    const COL = { done: "#10b981", ok: "#10b981", progress: "#3b82f6", blocked: "#ef4444", fail: "#ef4444", warn: "#f59e0b", todo: "#94a3b8" };
    const total = Object.values(counts).reduce((a, b) => a + b, 0);
    const order = ["done", "ok", "progress", "warn", "todo", "blocked", "fail"].filter((k) => counts[k]);
    const sum = total > 2 ? `<div class="rk-sum"><div class="bar">${order.map((k) => `<span style="flex:${counts[k]};background:${COL[k]}"></span>`).join("")}</div><div class="leg">${
      order.map((k) => `<span><span class="dot" style="background:${COL[k]}"></span><b>${counts[k]}</b> ${esc((PILLS[k] || k).toLowerCase())}</span>`).join("")}</div></div>` : "";
    const row = (r) => {
      const hot = pills && r.some((c) => /\[(blocked|fail)\]/i.test(c));
      return `<tr${hot ? ' class="rk-hot"' : ""}>${head.map((_, i) => `<td${idCol && i === 1 ? ' class="rk-strong"' : ""}>${inline(r[i] || "", pills)}</td>`).join("")}</tr>`;
    };
    el.innerHTML = `<div class="rk-tablewrap rk-card">${sum}<table style="border:0;box-shadow:none;border-radius:0"><thead><tr>${head.map((h) => `<th>${inline(h, pills)}</th>`).join("")}</tr></thead><tbody>${
      rows.map(row).join("")}</tbody></table></div>`;
  }

  function callout(el, kind, title, bodyHtml) {
    kind = kind || el.getAttribute("kind") || "note";
    title = title ?? el.getAttribute("title");
    const body = bodyHtml ?? el.innerHTML.trim();
    el.innerHTML = `<div class="rk-callout ${esc(kind)}"><span class="i">${ICON[kind] || "i"}</span><div class="b">${title ? `<b>${inline(title)}</b> ` : ""}${body}</div></div>`;
  }

  // "Label: 1,234.5" or "Label | 1e3". dp = decimals as written, so a value is shown the way it was given.
  function parsePoints(ls) {
    return ls.map((l) => {
      const m = l.match(/^(.*?)\s*[:|]\s*(-?(?:\d[\d,]*)?\.?\d+(?:e[+-]?\d+)?)\s*(\S*)$/i);
      if (!m) return null;
      const raw = m[2].replace(/,/g, ""), value = Number(raw);
      const dp = /e/i.test(raw) ? null : (raw.split(".")[1] || "").length;
      return Number.isFinite(value) ? { label: m[1], value, dp } : null;
    }).filter(Boolean);
  }

  function chart(el, ls, meta) {
    meta = meta || {};
    const type = (meta.type || el.getAttribute("type") || "bar").toLowerCase();
    const title = meta.title || el.getAttribute("title") || "";
    const unit = esc(meta.unit || el.getAttribute("unit") || "");
    let pts;
    const attr = el.getAttribute("data");
    if (!ls && attr) pts = parsePoints(attr.split(","));
    else pts = parsePoints(ls || lines(rawText(el)));
    if (!pts.length) return;
    if (pts.some((p) => p.value < 0)) {
      // Bars grow from zero; a negative value would be drawn wrong, so say so instead of guessing.
      el.innerHTML = `<div class="rk-callout warn"><span class="i">!</span><div class="b"><b>Chart not drawn.</b> rk-chart supports values of 0 or more.</div></div>`;
      return;
    }
    const max = Math.max(...pts.map((p) => p.value), 0) || 1;
    const nice = niceMax(max);
    const fmt = (v, dp) => (dp == null ? num(v) : v.toFixed(dp)) + unit;
    let svg;
    if (type === "hbar") {
      const rowH = 34, labW = 170, W = 640, H = pts.length * rowH + 10;
      svg = `<svg viewBox="0 0 ${W} ${H}">${pts.map((p, i) => {
        const w = ((W - labW - 60) * p.value) / nice, y = i * rowH + 6;
        return `<text x="${labW - 10}" y="${y + 17}" text-anchor="end" font-size="13" fill="#334155">${esc(p.label)}</text>
<rect x="${labW}" y="${y + 3}" width="${Math.max(w, 2)}" height="20" rx="5" fill="url(#rkg)"/>
<text x="${labW + w + 8}" y="${y + 17}" font-size="13" font-weight="650" fill="#0f172a">${fmt(p.value, p.dp)}</text>`;
      }).join("")}${GRAD}</svg>`;
    } else {
      const W = 900, H = 300, L = 40, B = 34, T = 22, R = 64;
      const pw = W - L - R, ph = H - B - T;
      const grid = [0, 0.25, 0.5, 0.75, 1].map((f) => {
        const y = T + ph - f * ph;
        return `<line x1="${L}" x2="${W - R}" y1="${y}" y2="${y}" stroke="#e3e8ef"/><text x="${L - 8}" y="${y + 4}" text-anchor="end" font-size="11" fill="#94a3b8">${fmt(nice * f)}</text>`;
      }).join("");
      const step = pw / pts.length;
      const xy = pts.map((p, i) => [L + step * i + step / 2, T + ph - (p.value / nice) * ph]);
      const labels = pts.map((p, i) => `<text x="${xy[i][0]}" y="${H - 12}" text-anchor="middle" font-size="12" fill="#64748b">${esc(p.label)}</text>`).join("");
      let marks;
      if (type === "line") {
        marks = `<polyline points="${xy.map((q) => q.join(",")).join(" ")}" fill="none" stroke="#4f46e5" stroke-width="3" stroke-linejoin="round"/>` +
          xy.map((q, i) => `<circle cx="${q[0]}" cy="${q[1]}" r="5" fill="#fff" stroke="#4f46e5" stroke-width="3"/><text x="${q[0]}" y="${q[1] - 12}" text-anchor="middle" font-size="12" font-weight="650" fill="#0f172a">${fmt(pts[i].value, pts[i].dp)}</text>`).join("");
      } else {
        // Peak bar and average line are derived here, so the agent never writes them.
        const bw = Math.min(64, step * 0.5);
        const peak = Math.max(...pts.map((p) => p.value));
        const showAvg = pts.length >= 3 && !el.hasAttribute("noavg") && !meta.noavg;
        const avg = pts.reduce((a, p) => a + p.value, 0) / pts.length;
        marks = xy.map((q, i) => {
          const top = pts[i].value === peak;
          return `<rect x="${q[0] - bw / 2}" y="${Math.min(q[1], T + ph)}" width="${bw}" height="${Math.max(0, T + ph - q[1])}" rx="7" fill="${top ? "url(#rkp)" : "url(#rkg)"}"/><text x="${q[0]}" y="${q[1] - 8}" text-anchor="middle" font-size="13" font-weight="700" fill="${top ? "#3730a3" : "#0f172a"}">${fmt(pts[i].value, pts[i].dp)}</text>`;
        }).join("");
        if (showAvg) {
          const ay = T + ph - (avg / nice) * ph;
          marks += `<line x1="${L}" x2="${W - R + 4}" y1="${ay}" y2="${ay}" stroke="#f59e0b" stroke-width="2" stroke-dasharray="7 6"/><text x="${W - R + 8}" y="${ay + 4}" font-size="12" font-weight="700" fill="#b45309">avg ${fmt(avg)}</text>`;
        }
      }
      svg = `<svg viewBox="0 0 ${W} ${H}">${GRAD}${grid}${marks}${labels}</svg>`;
    }
    el.innerHTML = `<div class="rk-card rk-chart">${title ? `<div class="rk-ctitle">${inline(title)}</div>` : ""}<div class="rk-scroll">${svg}</div></div>`;
  }
  // Axis ticks and the average: three to four significant digits, no float noise (0.07500000001 -> 0.075).
  const num = (v) => (Number.isInteger(v) ? String(v) : String(+v.toPrecision(Math.abs(v) >= 1 ? 4 : 3)));
  const GRAD = `<defs><linearGradient id="rkg" x1="0" y1="0" x2="0" y2="1"><stop offset="0" stop-color="#a5b4fc"/><stop offset="1" stop-color="#818cf8"/></linearGradient><linearGradient id="rkp" x1="0" y1="0" x2="0" y2="1"><stop offset="0" stop-color="#6366f1"/><stop offset="1" stop-color="#4338ca"/></linearGradient></defs>`;
  function niceMax(v) {
    const p = Math.pow(10, Math.floor(Math.log10(v)));
    for (const m of [1, 1.2, 1.6, 2, 2.4, 3, 4, 5, 6, 8, 10]) if (m * p >= v) return m * p; // quarters stay round
    return 10 * p;
  }

  // Diagram: "A -> B: label" edges, "Name [db]" node kinds. Layered left-to-right layout.
  const KIND = {
    db: ["#ecfdf5", "#059669"], queue: ["#fffbeb", "#d97706"], ext: ["#f8fafc", "#64748b"],
    user: ["#eef2ff", "#4f46e5"], svc: ["#ffffff", "#4f46e5"], cache: ["#fdf2f8", "#db2777"],
  };
  function diagram(el, ls, meta) {
    meta = meta || {};
    const title = meta.title || el.getAttribute("title") || "";
    ls = ls || lines(rawText(el));
    const nodes = new Map(), edges = [];
    const node = (tok) => {
      const m = tok.trim().match(/^(.*?)\s*(?:\[(\w+)\])?$/);
      const name = m[1].trim();
      if (!nodes.has(name)) nodes.set(name, { name, kind: "svc", out: [], inn: [] });
      if (m[2]) nodes.get(name).kind = m[2].toLowerCase();
      return nodes.get(name);
    };
    for (const l of ls) {
      const m = l.match(/^(.+?)\s*(-->|->|<->|--)\s*(.+?)(?:\s*:\s*(.+))?$/);
      if (m) {
        const a = node(m[1]), b = node(m[3]);
        const e = { a, b, label: m[4] || "", both: m[2] === "<->", plain: m[2] === "--" };
        edges.push(e); a.out.push(e); b.inn.push(e);
      } else node(l.replace(/:.*$/, ""));
    }
    if (!nodes.size) return;
    // Layer = longest path from a source, ignoring back edges (DFS order).
    const order = [...nodes.values()], state = new Map(), back = new Set();
    const visit = (n) => {
      state.set(n, 1);
      for (const e of n.out) {
        if (state.get(e.b) === 1) back.add(e);
        else if (!state.get(e.b)) visit(e.b);
      }
      state.set(n, 2);
    };
    order.filter((n) => !n.inn.length).concat(order).forEach((n) => !state.get(n) && visit(n));
    const layer = new Map();
    const busy = new Set();
    const depth = (n) => {
      if (layer.has(n)) return layer.get(n);
      if (busy.has(n)) return 0; // only reachable through an undetected cycle
      busy.add(n);
      let d = 0;
      for (const e of n.inn) if (!back.has(e)) d = Math.max(d, depth(e.a) + 1);
      busy.delete(n);
      layer.set(n, d);
      return d;
    };
    order.forEach((n) => depth(n));
    const layers = [];
    order.forEach((n) => (layers[layer.get(n)] ||= []).push(n));
    // Two barycenter sweeps to reduce crossings.
    const pos = new Map();
    layers.forEach((L) => L.forEach((n, i) => pos.set(n, i)));
    for (let pass = 0; pass < 2; pass++) {
      for (let i = 1; i < layers.length; i++) {
        layers[i].sort((x, y) => bary(x) - bary(y));
        layers[i].forEach((n, k) => pos.set(n, k));
      }
    }
    function bary(n) {
      const ps = n.inn.filter((e) => !back.has(e)).map((e) => pos.get(e.a));
      return ps.length ? ps.reduce((a, b) => a + b, 0) / ps.length : pos.get(n);
    }
    const NH = 46, VG = 30, CW = 7.6;
    const widthOf = (n) => Math.max(110, n.name.length * CW + 36);
    const labW = (e) => (e.label ? e.label.length * 6.6 + 16 : 0);
    const dir = (meta.direction || el.getAttribute("direction") || (layers.length > 6 ? "down" : "right")).toLowerCase();
    if (dir === "down") {
      const out = layoutDown({ layers, edges, layer, back, widthOf, labW, NH });
      return finishDiagram(el, title, out.W, out.H, out.paths, order, NH);
    }
    // Fan-out edges carry their label next to the target, fan-in edges next to the source,
    // so labels sit on straight segments where the edges have already separated.
    const fwd = edges.filter((e) => layer.get(e.b) > layer.get(e.a));
    fwd.forEach((e) => (e.atTarget = e.a.out.length >= e.b.inn.length));
    const gap = layers.map((_, i) => {
      let need = 0;
      for (const e of fwd) {
        if (e.atTarget && layer.get(e.b) === i + 1) need = Math.max(need, labW(e));
        if (!e.atTarget && layer.get(e.a) === i) need = Math.max(need, labW(e));
      }
      return Math.max(72, need + 64);
    });
    const colW = layers.map((L) => Math.max(...L.map(widthOf)));
    const colH = layers.map((L) => L.length * NH + (L.length - 1) * VG);
    const H = Math.max(...colH) + 40;
    let x = 16;
    layers.forEach((L, i) => {
      const y0 = (H - colH[i]) / 2;
      L.forEach((n, k) => { n.w = widthOf(n); n.x = x + (colW[i] - n.w) / 2; n.y = y0 + k * (NH + VG); });
      x += colW[i] + (i < layers.length - 1 ? gap[i] : 0);
    });
    const W = x + 16;
    const paths = edges.map((e) => {
      const { a, b } = e;
      const lw = labW(e);
      let d, lx, ly;
      if (layer.get(b) > layer.get(a)) {
        const x1 = a.x + a.w, y1 = a.y + NH / 2, x2 = b.x - 4, y2 = b.y + NH / 2;
        if (!lw) {
          const mx = (x1 + x2) / 2;
          d = `M${x1},${y1} C${mx},${y1} ${mx},${y2} ${x2},${y2}`;
        } else if (e.atTarget) {
          const xe = x2 - lw - 22, cx = (x1 + xe) / 2;
          d = `M${x1},${y1} C${cx},${y1} ${cx},${y2} ${xe},${y2} L${x2},${y2}`; lx = x2 - 12 - lw / 2; ly = y2;
        } else {
          const xs = x1 + lw + 22, cx = (xs + x2) / 2;
          d = `M${x1},${y1} L${xs},${y1} C${cx},${y1} ${cx},${y2} ${x2},${y2}`; lx = x1 + 10 + lw / 2; ly = y1;
        }
      } else {
        const x1 = a.x + a.w / 2, y1 = a.y + NH, x2 = b.x + b.w / 2, y2 = b.y + NH + 4, low = Math.max(y1, y2) + 36;
        d = `M${x1},${y1} C${x1},${low} ${x2},${low} ${x2},${y2}`; lx = (x1 + x2) / 2; ly = low - 9;
      }
      const lab = lw ? `<rect x="${lx - lw / 2}" y="${ly - 10}" width="${lw}" height="20" rx="10" fill="#fff" stroke="#e3e8ef"/><text x="${lx}" y="${ly + 4}" text-anchor="middle" font-size="11" fill="#475569">${esc(e.label)}</text>` : "";
      return edgeOut(e, d, lab);
    });
    const extraH = edges.some((e) => layer.get(e.b) <= layer.get(e.a)) ? 46 : 0;
    finishDiagram(el, title, W, H + extraH, paths, order, NH);
  }

  const edgeOut = (e, d, lab) => ({ p: `<path d="${d}" fill="none" stroke="#94a3b8" stroke-width="1.8" ${e.plain ? "" : 'marker-end="url(#rka)"'} ${e.both ? 'marker-start="url(#rkb)"' : ""}/>`, l: lab });
  const labelBox = (lx, ly, lw, text) => `<rect x="${lx - lw / 2}" y="${ly - 10}" width="${lw}" height="20" rx="10" fill="#fff" stroke="#e3e8ef"/><text x="${lx}" y="${ly + 4}" text-anchor="middle" font-size="11" fill="#475569">${esc(text)}</text>`;

  // Top-down layout for deep graphs (flowcharts). Rows follow their parents so the main
  // chain runs straight; labels get stacked slots so they never overlap; edges that skip
  // rows run along a side rail instead of cutting through nodes.
  function layoutDown({ layers, edges, layer, back, widthOf, labW, NH }) {
    const span = (e) => layer.get(e.b) - layer.get(e.a);
    const rail = edges.filter((e) => !back.has(e) && span(e) > 1);
    const left = edges.filter((e) => back.has(e) || span(e) < 1);
    const railNodes = new Set(rail.flatMap((e) => [e.a, e.b]));
    const GAPX = 44;
    layers.forEach((L, i) => {
      L.forEach((n) => (n.w = widthOf(n)));
      const want = (n) => {
        const ps = n.inn.filter((e) => span(e) === 1 && !back.has(e)).map((e) => e.a.x + e.a.w / 2);
        return ps.length ? ps.reduce((a, b) => a + b, 0) / ps.length : null;
      };
      if (i === 0) { let x = 0; L.forEach((n) => { n.x = x; x += n.w + GAPX; }); return; }
      // Siblings that continue the chain take the slot under their parent; leaves go to the side.
      const leaf = (n) => (n.out.length ? 0 : 1);
      L.sort((a, b) => (railNodes.has(a) - railNodes.has(b)) || ((want(a) ?? 1e9) - (want(b) ?? 1e9)) || (leaf(a) - leaf(b)));
      let cursor = -1e9;
      L.forEach((n) => {
        const w = want(n);
        const x = (w === null ? cursor + GAPX : w - n.w / 2);
        n.x = Math.max(x, cursor === -1e9 ? x : cursor + GAPX);
        cursor = n.x + n.w;
      });
    });
    // Label slots per gap: greedy rows so boxes never overlap.
    const gaps = layers.map(() => []);
    edges.filter((e) => span(e) === 1 && !back.has(e) && e.label).forEach((e) => {
      const g = gaps[layer.get(e.a)], lw = labW(e);
      const cx = (e.a.x + e.a.w / 2 + e.b.x + e.b.w / 2) / 2;
      let slot = 0;
      while (g.some((o) => o.slot === slot && Math.abs(o.cx - cx) < (o.lw + lw) / 2 + 8)) slot++;
      g.push({ e, cx, lw, slot });
    });
    let y = 16;
    layers.forEach((L, i) => {
      L.forEach((n) => (n.y = y));
      const slots = gaps[i].length ? Math.max(...gaps[i].map((o) => o.slot)) + 1 : 0;
      y += NH + Math.max(42, 22 + slots * 26);
    });
    const leftW = left.length ? Math.max(...left.map(labW), 0) + 40 + left.length * 14 : 0;
    const allNodes = layers.flat(), labs = gaps.flat();
    // Shift nodes and their branch labels together; the bounds include the labels, so none is cut off.
    const minX = Math.min(...allNodes.map((n) => n.x), ...labs.map((o) => o.cx - o.lw / 2));
    const dx = 16 + leftW - minX;
    allNodes.forEach((n) => (n.x += dx));
    labs.forEach((o) => (o.cx += dx));
    const maxRight = Math.max(...allNodes.map((n) => n.x + n.w), ...labs.map((o) => o.cx + o.lw / 2));
    const railLab = Math.max(0, ...rail.map(labW));
    const paths = [];
    gaps.forEach((g) => g.forEach((o) => {
      const { e } = o, x1 = e.a.x + e.a.w / 2, y1 = e.a.y + NH, x2 = e.b.x + e.b.w / 2, y2 = e.b.y - 4;
      const ly = y1 + 21 + o.slot * 26, lx = o.cx; // branch labels float at the curve's midpoint, clear of the main line
      paths.push(edgeOut(e, `M${x1},${y1} C${x1},${(y1 + y2) / 2} ${x2},${(y1 + y2) / 2} ${x2},${y2}`, labelBox(lx, ly, o.lw, e.label)));
    }));
    edges.filter((e) => span(e) === 1 && !back.has(e) && !e.label).forEach((e) => {
      const x1 = e.a.x + e.a.w / 2, y1 = e.a.y + NH, x2 = e.b.x + e.b.w / 2, y2 = e.b.y - 4;
      paths.push(edgeOut(e, `M${x1},${y1} C${x1},${(y1 + y2) / 2} ${x2},${(y1 + y2) / 2} ${x2},${y2}`, ""));
    });
    let W = maxRight + 16;
    rail.forEach((e, r) => {
      const rx = maxRight + railLab + 40 + r * 14, ay = e.a.y + NH / 2 + (r % 3 - 1) * 6, by = e.b.y + NH / 2 + (r % 3 - 1) * 6;
      const lw = labW(e);
      W = Math.max(W, rx + 16);
      paths.push(edgeOut(e, `M${e.a.x + e.a.w},${ay} H${rx} V${by} H${e.b.x + e.b.w + 4}`, lw ? labelBox(e.a.x + e.a.w + 12 + lw / 2, ay, lw, e.label) : ""));
    });
    left.forEach((e, r) => {
      const lx = 16 + leftW - 24 - r * 14, ay = e.a.y + NH / 2, by = e.b.y + NH / 2, lw = labW(e);
      paths.push(edgeOut(e, `M${e.a.x},${ay} H${lx} V${by} H${e.b.x - 4}`, lw ? labelBox(Math.max(16 + lw / 2, e.a.x - 12 - lw / 2), ay, lw, e.label) : ""));
    });
    return { W, H: y - 30, paths };
  }

  function finishDiagram(el, title, W, H, paths, order, NH) {
    const boxes = order.map((n) => {
      const [fill, stroke] = KIND[n.kind] || KIND.svc;
      const shape = n.kind === "db"
        ? `<path d="M${n.x},${n.y + 8} a${n.w / 2},8 0 0,0 ${n.w},0 v${NH - 16} a${n.w / 2},8 0 0,1 ${-n.w},0 z" fill="${fill}" stroke="${stroke}" stroke-width="1.6"/><ellipse cx="${n.x + n.w / 2}" cy="${n.y + 8}" rx="${n.w / 2}" ry="8" fill="${fill}" stroke="${stroke}" stroke-width="1.6"/>`
        : `<rect x="${n.x}" y="${n.y}" width="${n.w}" height="${NH}" rx="${n.kind === "user" ? 23 : 11}" fill="${fill}" stroke="${stroke}" stroke-width="1.6" ${n.kind === "ext" ? 'stroke-dasharray="5 4"' : ""}/>`;
      return `${shape}<text x="${n.x + n.w / 2}" y="${n.y + NH / 2 + 5 + (n.kind === "db" ? 3 : 0)}" text-anchor="middle" font-size="13.5" font-weight="600" fill="#0f172a">${esc(n.name)}</text>`;
    });
    const defs = `<defs><marker id="rka" viewBox="0 0 10 10" refX="9" refY="5" markerWidth="7" markerHeight="7" orient="auto-start-reverse"><path d="M0,0 L10,5 L0,10 z" fill="#94a3b8"/></marker><marker id="rkb" viewBox="0 0 10 10" refX="1" refY="5" markerWidth="7" markerHeight="7" orient="auto-start-reverse"><path d="M0,0 L10,5 L0,10 z" fill="#94a3b8"/></marker></defs>`;
    el.innerHTML = `<div class="rk-card rk-diagram">${title ? `<div class="rk-ctitle">${inline(title)}</div>` : ""}<div class="rk-scroll"><svg viewBox="0 0 ${W} ${H}" style="max-width:${W}px;min-width:${Math.min(W, 640)}px;margin:0 auto">${defs}${paths.map((x) => x.p).join("")}${boxes.join("")}${paths.map((x) => x.l).join("")}</svg></div></div>`;
  }

  function steps(el, ls) {
    ls = ls || lines(rawText(el));
    el.innerHTML = `<ol class="rk-steps">${ls.map((l) => {
      const [t, ...rest] = cells(l.replace(/^\d+[.)]\s*/, ""));
      return `<li class="rk-card"><div><div class="st">${inline(t)}</div>${rest.length ? `<div class="sd">${inline(rest.join(" | "))}</div>` : ""}</div></li>`;
    }).join("")}</ol>`;
  }

  // Board: "ID | title | column" items, drag between columns, export as markdown.
  function board(el, ls, meta) {
    meta = meta || {};
    const cols = (meta.columns || el.getAttribute("columns") || "Now,Next,Later").split(",").map((s) => s.trim()).filter(Boolean);
    const items = (ls || lines(rawText(el))).map(cells).filter((c) => !/^id$/i.test(c[0]))
      .map(([id, title, col]) => ({ id, title: title || "", col }));
    const hasInbox = items.some((i) => !i.col || !cols.includes(i.col));
    const lanes = (hasInbox ? ["Inbox"] : []).concat(cols);
    items.forEach((i) => { if (!lanes.includes(i.col)) i.col = lanes[0]; });
    const title = meta.title || el.getAttribute("title") || "";
    el.innerHTML = `<div class="rk-board"><div class="bar"><div class="rk-ctitle" style="margin:0">${inline(title)}</div><button class="rk-btn">Export as markdown</button></div>
<div class="hint">Drag a card, or tap a card and then a column. Keyboard: focus a card and press 1-${lanes.length}.</div>
${hasInbox ? `<div class="rk-lane inbox" data-col="Inbox"><div class="lh"><span>Inbox</span><span class="c"></span></div></div>` : ""}<div class="lanes" style="--n:${cols.length}">${cols.map((c) => `<div class="rk-lane" data-col="${esc(c)}"><div class="lh"><span>${esc(c)}</span><span class="c"></span></div></div>`).join("")}</div>
<textarea class="rk-out" readonly></textarea></div>`;
    const laneEl = (c) => el.querySelector(`.rk-lane[data-col="${CSS.escape(c)}"]`);
    let dragging = null, picked = null;
    const pick = (d) => { picked?.classList.remove("pick"); picked = picked === d ? null : d; picked?.classList.add("pick"); };
    items.forEach((it) => {
      const d = document.createElement("div");
      d.className = "rk-item"; d.draggable = true; d.tabIndex = 0; d.dataset.id = it.id;
      d.innerHTML = `<div class="id">${esc(it.id)}</div>${inline(it.title)}`;
      d.addEventListener("dragstart", () => { dragging = d; d.classList.add("drag"); });
      d.addEventListener("dragend", () => { d.classList.remove("drag"); dragging = null; count(); });
      // Touch screens have no HTML drag and drop: tap a card, then tap the column it goes to.
      d.addEventListener("click", (e) => { e.stopPropagation(); pick(d); });
      // Keyboard: number keys move the focused card to that column (1 = first column on screen).
      d.addEventListener("keydown", (e) => {
        const all = [...el.querySelectorAll(".rk-lane")], n = Number(e.key);
        if (n >= 1 && n <= all.length) { all[n - 1].appendChild(d); d.focus(); count(); }
      });
      laneEl(it.col).appendChild(d);
    });
    el.querySelectorAll(".rk-lane").forEach((lane) => {
      lane.addEventListener("click", () => { if (picked) { lane.appendChild(picked); pick(picked); count(); } });
      lane.addEventListener("dragover", (e) => { e.preventDefault(); lane.classList.add("over"); });
      lane.addEventListener("dragleave", () => lane.classList.remove("over"));
      lane.addEventListener("drop", (e) => {
        e.preventDefault(); lane.classList.remove("over");
        if (!dragging) return;
        const after = [...lane.querySelectorAll(".rk-item:not(.drag)")].find((c) => e.clientY < c.getBoundingClientRect().top + c.offsetHeight / 2);
        lane.insertBefore(dragging, after || null);
      });
    });
    function count() { el.querySelectorAll(".rk-lane").forEach((l) => (l.querySelector(".c").textContent = l.querySelectorAll(".rk-item").length)); }
    count();
    el.querySelector(".rk-btn").addEventListener("click", () => {
      const md = [...el.querySelectorAll(".rk-lane")].map((l) =>
        `## ${l.dataset.col}\n` + [...l.querySelectorAll(".rk-item")].map((i) => `- ${i.dataset.id} ${i.textContent.slice(i.dataset.id.length).trim()}`).join("\n")).join("\n\n");
      const out = el.querySelector(".rk-out");
      out.style.display = "block"; out.value = md;
      navigator.clipboard?.writeText(md).catch(() => {});
    });
  }

  /* ---------- markdown renderer (for .md written by the agent) ---------- */

  const FENCES = {
    chart: (ls) => { const m = splitMeta(ls, ["title", "type", "unit", "noavg"]); return mk(chart, ls, m); },
    diagram: (ls) => { const m = splitMeta(ls, ["title", "direction"]); return mk(diagram, ls, m); },
    board: (ls) => { const m = splitMeta(ls, ["title", "columns"]); return mk(board, ls, m); },
    stats: (ls) => mk(stats, ls),
    steps: (ls) => mk(steps, ls),
  };
  function mk(fn, ls, meta) { const d = document.createElement("div"); fn(d, ls, meta); return d; }

  // A list and the lists nested under its items (deeper indent = child of the previous item).
  const LI = /^(\s*)([-*+]|\d+[.)])\s+(.*)$/;
  function list(L, i, plain) {
    const base = L[i].match(LI)[1].length, ordered = /^\d/.test(L[i].match(LI)[2]), items = [];
    while (i < L.length) {
      const m = L[i].match(LI);
      if (!m || m[1].length < base) break;
      if (m[1].length > base && items.length) {
        const sub = list(L, i, plain);
        items[items.length - 1] = items[items.length - 1].replace(/<\/li>$/, sub.html + "</li>");
        i = sub.i; continue;
      }
      let t = m[3]; i++;
      while (i < L.length && /^\s{2,}\S/.test(L[i]) && !LI.test(L[i])) t += " " + L[i++].trim();
      const task = t.match(/^\[([ xX])\]\s+(.*)$/);
      items.push(task ? `<li class="rk-task"><input type="checkbox" ${task[1] !== " " ? "checked" : ""}>${inline(task[2], !plain)}</li>` : `<li>${inline(t, !plain)}</li>`);
    }
    return { html: `<${ordered ? "ol" : "ul"}>${items.join("")}</${ordered ? "ol" : "ul"}>`, i };
  }

  function renderMarkdown(src, plain) {
    const root = document.createElement("div");
    const L = src.replace(/\r/g, "").split("\n");
    let i = 0, para = [];
    const flush = () => {
      if (para.length) { const p = document.createElement("p"); p.innerHTML = inline(para.join(" "), !plain); root.appendChild(p); para = []; }
    };
    const add = (html) => { const t = document.createElement("template"); t.innerHTML = html; root.appendChild(t.content); };
    while (i < L.length) {
      const line = L[i];
      let m;
      if ((m = line.match(/^```\s*(\w*)/))) {
        flush();
        const lang = m[1].toLowerCase(), body = [];
        i++;
        while (i < L.length && !/^```/.test(L[i])) body.push(L[i++]);
        i++;
        if (!plain && FENCES[lang]) root.appendChild(FENCES[lang](body.map((s) => s.trim()).filter(Boolean)));
        else add(`<pre><code${lang ? ` class="language-${lang}"` : ""}>${esc(body.join("\n"))}</code></pre>`);
        continue;
      }
      if ((m = line.match(/^(#{1,6})\s+(.*)$/))) {
        flush();
        if (!plain && m[1].length === 1 && !root.querySelector("rk-header")) {
          const h = document.createElement("rk-header"); h.setAttribute("title", m[2]); header(h); root.appendChild(h);
        } else add(`<h${m[1].length}>${inline(m[2], !plain)}</h${m[1].length}>`);
        i++; continue;
      }
      if (/^\s*(-{3,}|\*{3,})\s*$/.test(line)) { flush(); add("<hr>"); i++; continue; }
      if (!plain && (m = line.match(/^stats:\s*(.+)$/i))) {
        flush();
        root.appendChild(mk(stats, m[1].split("|").map((s) => {
          const t = s.trim(), k = t.indexOf(" ");
          return k > 0 ? `${t.slice(0, k)} | ${t.slice(k + 1)}` : t;
        })));
        i++; continue;
      }
      if (/^\s*\|/.test(line)) {
        flush();
        const rows = [];
        while (i < L.length && /^\s*\|/.test(L[i])) rows.push(L[i++].trim());
        const d = document.createElement("div");
        table(d, rows, !plain);
        root.appendChild(d);
        continue;
      }
      if (/^>\s?/.test(line)) {
        flush();
        const q = [];
        while (i < L.length && /^>\s?/.test(L[i])) q.push(L[i++].replace(/^>\s?/, ""));
        const text = q.join(" ");
        const cm = !plain && text.match(/^\**(Risk|Warning|Note|OK)\**:\s*(.*)$/i);
        if (cm) {
          const kind = { risk: "risk", warning: "warn", note: "note", ok: "ok" }[cm[1].toLowerCase()];
          const d = document.createElement("div"); callout(d, kind, "", inline(cm[2])); root.appendChild(d);
        } else add(`<blockquote>${inline(text, !plain)}</blockquote>`);
        continue;
      }
      if (LI.test(line)) {
        flush();
        const r = list(L, i, plain);
        add(r.html); i = r.i;
        continue;
      }
      if (!line.trim()) { flush(); i++; continue; }
      para.push(line.trim()); i++;
    }
    flush();
    return root;
  }

  // Plain HTML the agent wrote (<p>, <li>, callout text...): same inline formatting as the components,
  // so **bold**, `code`, [done] and CHK-1 work in any text. Component data and code are left alone.
  const SKIP = "pre,code,script,style,textarea,svg,a,rk-header,rk-stats,rk-chart,rk-table,rk-diagram,rk-steps,rk-board,rk-pill";
  function formatText(root) {
    const walk = document.createTreeWalker(root, NodeFilter.SHOW_TEXT);
    const todo = [];
    for (let n; (n = walk.nextNode());) {
      if (/[*`~[]|[A-Z]-\d/.test(n.data) && !n.parentElement.closest(SKIP)) todo.push(n);
    }
    todo.forEach((n) => {
      const html = inline(n.data);
      if (html === esc(n.data)) return;
      const t = document.createElement("template");
      t.innerHTML = html;
      n.replaceWith(t.content);
    });
  }

  /* ---------- boot ---------- */

  function boot() {
    const st = document.createElement("style");
    st.textContent = STYLE;
    document.head.appendChild(st);
    if (!document.querySelector('meta[name="viewport"]')) {
      const v = document.createElement("meta"); v.name = "viewport"; v.content = "width=device-width,initial-scale=1"; document.head.appendChild(v);
    }
    const body = document.body;
    body.classList.add("rk");
    const page = document.createElement("main");
    page.className = "rk-page";
    while (body.firstChild) page.appendChild(body.firstChild);
    body.appendChild(page);

    const md = page.querySelector("rk-md");
    if (md) {
      const plain = md.hasAttribute("plain");
      if (plain) body.classList.add("rk-plain");
      md.replaceWith(...renderMarkdown(rawText(md), plain).childNodes);
    } else formatText(page);
    if (!document.title) {
      const h = page.querySelector("rk-header[title], h1");
      if (h) document.title = (h.getAttribute("title") || h.textContent).replace(/[`*~]/g, "");
    }
    const run = (sel, fn) => page.querySelectorAll(sel).forEach((el) => fn(el));
    run("rk-cols", (el) => [...el.children].forEach((c) => c.classList.add("rk-col")));
    run("rk-header", (el) => { if (!el.querySelector(".rk-hero")) header(el); });
    run("rk-stats", (el) => stats(el));
    run("rk-chart", (el) => chart(el));
    run("rk-table", (el) => table(el));
    run("rk-callout", (el) => callout(el));
    run("rk-diagram", (el) => diagram(el));
    run("rk-steps", (el) => steps(el));
    run("rk-board", (el) => board(el));
    run("rk-pill", (el) => { el.outerHTML = pill((el.getAttribute("s") || "todo").toLowerCase(), el.textContent.trim()); });
    run("table", (t) => { if (!t.closest(".rk-tablewrap")) { const w = document.createElement("div"); w.className = "rk-tablewrap"; t.replaceWith(w); w.appendChild(t); } });
    document.documentElement.dataset.rkReady = "1";
  }

  if (document.readyState === "loading") document.addEventListener("DOMContentLoaded", boot);
  else boot();
})();
