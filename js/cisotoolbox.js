// ─────────────────────────────────────────────────────────────
// GENERATED from shared/ts/ — do NOT edit here.
// Edit the shared TypeScript source and run shared/ts-build.sh.
// ─────────────────────────────────────────────────────────────
/**
 * CISO Toolbox — Bibliothèque JS commune
 *
 * Chaque application doit définir avant de charger ce fichier :
 *   window.CT_CONFIG = {
 *     autosaveKey: "compliance_autosave",  // clé localStorage
 *     initDataVar: "COMPLIANCE_INIT_DATA", // variable globale des données initiales
 *     refNamespace: "COMPLIANCE_REF",      // namespace des référentiels lazy
 *     descNamespace: "COMPLIANCE_DESCRIPTIONS", // namespace des descriptions
 *     label: "évaluation",                 // label pour les messages ("Nouvelle évaluation")
 *     filePrefix: "Conformite",            // préfixe par défaut du nom de fichier
 *     getSociete: function() { return D.meta?.societe || ""; },
 *     getDate: function() { return D.meta?.date_evaluation || ""; }
 *   };
 *
 * Et les globales :
 *   D                  — objet de données
 *   REFERENTIELS_META  — catalogue des référentiels
 *   _ASSET_BASE        — préfixe des fichiers assets
 *   ensureKeys()       — migration/init des données (app-specific)
 *   renderAll()        — rendu complet (app-specific)
 */
var _CT = {};
function _ctInit() { _CT = window.CT_CONFIG || {}; }
// Appelé automatiquement au premier besoin
function _ct() { if (!_CT.autosaveKey)
    _ctInit(); return _CT; }
// ═══════════════════════════════════════════════════════════════════════
// HELPERS HTML
// ═══════════════════════════════════════════════════════════════════════
function esc(v) {
    return v === null || v === undefined ? "" : String(v).replace(/&/g, "&amp;").replace(/</g, "&lt;").replace(/>/g, "&gt;").replace(/"/g, "&quot;").replace(/'/g, "&#x27;");
}
function _da(...args) {
    return JSON.stringify(args).replace(/'/g, "&#39;");
}
function badge(text, color) {
    if (!text)
        return "";
    return '<span class="badge" style="background:' + color + '">' + esc(text) + '</span>';
}
// ═══════════════════════════════════════════════════════════════════════
// CT_ICONS — Shared inline SVG icon set (Lucide-style)
// ═══════════════════════════════════════════════════════════════════════
// Single-color stroke icons that inherit currentColor. Usage:
//   _icon("plus")                  // 1em, inherits color
//   _icon("trash", 18)             // 18px square
//   _icon("pencil", 16, "danger")  // custom class alongside .ct-icon
// Apps should style with .ct-icon { vertical-align:-0.15em } and size
// via parent font-size or the size argument.
var CT_ICONS = {
    "plus": '<line x1="12" y1="5" x2="12" y2="19"/><line x1="5" y1="12" x2="19" y2="12"/>',
    "minus": '<line x1="5" y1="12" x2="19" y2="12"/>',
    "check": '<polyline points="20 6 9 17 4 12"/>',
    "x": '<line x1="18" y1="6" x2="6" y2="18"/><line x1="6" y1="6" x2="18" y2="18"/>',
    "upload": '<path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4"/><polyline points="17 8 12 3 7 8"/><line x1="12" y1="3" x2="12" y2="15"/>',
    "download": '<path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4"/><polyline points="7 10 12 15 17 10"/><line x1="12" y1="15" x2="12" y2="3"/>',
    "clipboard": '<path d="M16 4h2a2 2 0 0 1 2 2v14a2 2 0 0 1-2 2H6a2 2 0 0 1-2-2V6a2 2 0 0 1 2-2h2"/><rect x="8" y="2" width="8" height="4" rx="1"/>',
    "shield": '<path d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10z"/><polyline points="9 12 11 14 15 10"/>',
    "pencil": '<path d="M12 20h9"/><path d="M16.5 3.5a2.121 2.121 0 1 1 3 3L7 19l-4 1 1-4 12.5-12.5z"/>',
    "copy": '<rect x="9" y="9" width="13" height="13" rx="2"/><path d="M5 15H4a2 2 0 0 1-2-2V4a2 2 0 0 1 2-2h9a2 2 0 0 1 2 2v1"/>',
    "trash": '<polyline points="3 6 5 6 21 6"/><path d="M19 6l-1 14a2 2 0 0 1-2 2H8a2 2 0 0 1-2-2L5 6"/><path d="M10 11v6"/><path d="M14 11v6"/><path d="M9 6V4a2 2 0 0 1 2-2h2a2 2 0 0 1 2 2v2"/>',
    "search": '<circle cx="11" cy="11" r="8"/><line x1="21" y1="21" x2="16.65" y2="16.65"/>',
    "code": '<polyline points="16 18 22 12 16 6"/><polyline points="8 6 2 12 8 18"/>',
    "settings": '<circle cx="12" cy="12" r="3"/><path d="M19.4 15a1.65 1.65 0 0 0 .33 1.82l.06.06a2 2 0 0 1-2.83 2.83l-.06-.06a1.65 1.65 0 0 0-1.82-.33 1.65 1.65 0 0 0-1 1.51V21a2 2 0 0 1-4 0v-.09a1.65 1.65 0 0 0-1-1.51 1.65 1.65 0 0 0-1.82.33l-.06.06a2 2 0 0 1-2.83-2.83l.06-.06a1.65 1.65 0 0 0 .33-1.82 1.65 1.65 0 0 0-1.51-1H3a2 2 0 0 1 0-4h.09a1.65 1.65 0 0 0 1.51-1 1.65 1.65 0 0 0-.33-1.82l-.06-.06a2 2 0 0 1 2.83-2.83l.06.06a1.65 1.65 0 0 0 1.82.33h0a1.65 1.65 0 0 0 1-1.51V3a2 2 0 0 1 4 0v.09a1.65 1.65 0 0 0 1 1.51h0a1.65 1.65 0 0 0 1.82-.33l.06-.06a2 2 0 0 1 2.83 2.83l-.06.06a1.65 1.65 0 0 0-.33 1.82v0a1.65 1.65 0 0 0 1.51 1H21a2 2 0 0 1 0 4h-.09a1.65 1.65 0 0 0-1.51 1z"/>',
    "alert": '<path d="M10.29 3.86L1.82 18a2 2 0 0 0 1.71 3h16.94a2 2 0 0 0 1.71-3L13.71 3.86a2 2 0 0 0-3.42 0z"/><line x1="12" y1="9" x2="12" y2="13"/><line x1="12" y1="17" x2="12.01" y2="17"/>'
};
function _icon(name, size, extraClass) {
    var p = CT_ICONS[name];
    if (!p)
        return "";
    var s = size ? ('width="' + size + '" height="' + size + '"') : 'width="1em" height="1em"';
    var cls = 'ct-icon' + (extraClass ? ' ' + extraClass : '');
    return '<svg class="' + cls + '" ' + s + ' viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true">' + p + '</svg>';
}
// ═══════════════════════════════════════════════════════════════════════
// CT_COLORS — Centralized color palette for all apps
// ═══════════════════════════════════════════════════════════════════════
var CT_COLORS = {
    // 3-level scale (risk, conformity, priority)
    green: { bg: "#dcfce7", txt: "#166534", vivid: "#22c55e" },
    orange: { bg: "#fed7aa", txt: "#9a3412", vivid: "#f97316" },
    red: { bg: "#fca5a5", txt: "#991b1b", vivid: "#ef4444" },
    // Extra levels for 5-6 level matrices
    yellow: { bg: "#fef9c3", txt: "#854d0e", vivid: "#eab308" },
    redDark: { bg: "#fecaca", txt: "#991b1b", vivid: "#dc2626" },
    redMax: { bg: "#ef4444", txt: "#ffffff", vivid: "#b91c1c" },
    // Neutral & accents
    blue: { bg: "#dbeafe", txt: "#1e40af", vivid: "#3b82f6" },
    indigo: { bg: "#e0e7ff", txt: "#3730a3", vivid: "#6366f1" },
    violet: { bg: "#ede9fe", txt: "#5b21b6", vivid: "#8b5cf6" },
    purple: { bg: "#f3e8ff", txt: "#7e22ce", vivid: "#a855f7" },
    pink: { bg: "#fce7f3", txt: "#9d174d", vivid: "#ec4899" },
    cyan: { bg: "#cffafe", txt: "#155e75", vivid: "#06b6d4" },
    teal: { bg: "#ccfbf1", txt: "#115e59", vivid: "#14b8a6" },
    gray: { bg: "#f1f5f9", txt: "#64748b", vivid: "#94a3b8" },
    dark: { bg: "#e2e8f0", txt: "#1e293b", vivid: "#475569" },
    // Named semantic scales (apps map their labels to these)
    scale3: ["green", "orange", "red"], // Faible/Moyen/Élevé
    scale4: ["green", "yellow", "orange", "red"], // 4-level gravity
    scale5: ["green", "yellow", "orange", "redDark", "red"], // 5-level
    scale6: ["green", "yellow", "orange", "redDark", "red", "redMax"], // 6-level matrix
    // Matrix color grids (precomputed for performance)
    matrix5: [
        ["#dcfce7", "#dcfce7", "#fef9c3", "#fed7aa", "#fecaca"],
        ["#dcfce7", "#fef9c3", "#fed7aa", "#fecaca", "#fecaca"],
        ["#fef9c3", "#fed7aa", "#fed7aa", "#fecaca", "#fca5a5"],
        ["#fed7aa", "#fecaca", "#fecaca", "#fca5a5", "#fca5a5"],
        ["#fecaca", "#fecaca", "#fca5a5", "#fca5a5", "#ef4444"]
    ],
    matrix4: [
        ["#dcfce7", "#fef9c3", "#fed7aa", "#fca5a5"],
        ["#fef9c3", "#fed7aa", "#fca5a5", "#fca5a5"],
        ["#fed7aa", "#fca5a5", "#fca5a5", "#fca5a5"],
        ["#fca5a5", "#fca5a5", "#fca5a5", "#ef4444"]
    ],
    // Slider accent colors (for conformity sliders etc.)
    sliderGreen: "#22c55e",
    sliderOrange: "#f97316",
    sliderRed: "#ef4444",
};
/**
 * Get a color object {bg, txt, vivid} by scale name.
 * @param {string} name — one of: green, orange, red, yellow, redDark, redMax, blue, gray
 * @returns {{bg:string, txt:string, vivid:string}}
 */
function ctColor(name) {
    return CT_COLORS[name] || CT_COLORS.gray;
}
/**
 * Get color by numeric level (1-based) in a scale.
 * @param {number} level — 1 to N
 * @param {number} maxLevel — max level (3, 4, 5, or 6)
 * @returns {{bg:string, txt:string, vivid:string}}
 */
function ctColorLevel(level, maxLevel) {
    var scale = CT_COLORS["scale" + (maxLevel || 3)] || CT_COLORS.scale3;
    var idx = Math.max(0, Math.min(level - 1, scale.length - 1));
    return CT_COLORS[scale[idx]] || CT_COLORS.gray;
}
/**
 * Render a styled badge with pastel background and dark text.
 * @param {string} text — badge label
 * @param {string} colorName — CT_COLORS key (green, orange, red, yellow, blue, gray...)
 * @returns {string} HTML
 */
function ctBadge(text, colorName) {
    if (!text)
        return "";
    var c = CT_COLORS[colorName] || CT_COLORS.gray;
    return '<span class="badge" style="background:' + c.bg + ';color:' + c.txt + '">' + esc(text) + '</span>';
}
/**
 * Render a styled badge by numeric level.
 * @param {string} text — badge label
 * @param {number} level — 1 to N
 * @param {number} maxLevel — max level (3, 4, 5)
 * @returns {string} HTML
 */
function ctBadgeLevel(text, level, maxLevel) {
    if (!text)
        return "";
    var c = ctColorLevel(level, maxLevel);
    return '<span class="badge" style="background:' + c.bg + ';color:' + c.txt + '">' + esc(text) + '</span>';
}
function confColor(v) {
    if (v === "" || v === null || v === undefined)
        return CT_COLORS.gray.vivid;
    var n = parseInt(v);
    return n >= 80 ? CT_COLORS.sliderGreen : n > 0 ? CT_COLORS.sliderOrange : CT_COLORS.sliderRed;
}
function _noop() { }
window._noop = _noop;
function _svgEsc(v) { return String(v == null ? "" : v).replace(/&/g, "&amp;").replace(/</g, "&lt;").replace(/>/g, "&gt;").replace(/"/g, "&quot;"); }
// ── Gauge ─────────────────────────────────────────────────────────
// Circular gauge with a value label in the centre.
//   value: current value
//   max:   upper bound
//   opts:  { size, color, label, sublabel, thickness }
function _svgGauge(value, max, opts) {
    opts = opts || {};
    var size = opts.size || 120;
    var thickness = opts.thickness || 10;
    var pct = Math.max(0, Math.min(1, (max > 0 ? value / max : 0)));
    var color = (CT_COLORS[opts.color || _postureColor(value, max)] || CT_COLORS.blue).vivid;
    var r = (size - thickness) / 2;
    var cx = size / 2, cy = size / 2;
    var C = 2 * Math.PI * r;
    var dash = C * pct;
    var label = opts.label != null ? opts.label : Math.round(value) + (max === 100 ? "%" : "");
    var sub = opts.sublabel || "";
    var h = '<svg class="ct-svg-gauge" viewBox="0 0 ' + size + ' ' + size + '" width="' + size + '" height="' + size + '" role="img" aria-label="' + _svgEsc(label + " / " + max) + '">';
    // Background ring
    h += '<circle cx="' + cx + '" cy="' + cy + '" r="' + r + '" fill="none" stroke="' + CT_COLORS.gray.bg + '" stroke-width="' + thickness + '"/>';
    // Value arc (starts at top, rotates -90deg)
    h += '<circle cx="' + cx + '" cy="' + cy + '" r="' + r + '" fill="none" stroke="' + color + '" stroke-width="' + thickness + '" stroke-linecap="round" stroke-dasharray="' + dash + ' ' + C + '" transform="rotate(-90 ' + cx + ' ' + cy + ')"/>';
    // Centre label
    h += '<text x="' + cx + '" y="' + (cy + 6) + '" text-anchor="middle" font-size="' + (size * 0.28) + '" font-weight="700" fill="' + CT_COLORS.dark.vivid + '">' + _svgEsc(label) + '</text>';
    if (sub) {
        h += '<text x="' + cx + '" y="' + (cy + size * 0.24) + '" text-anchor="middle" font-size="' + (size * 0.10) + '" fill="' + CT_COLORS.gray.vivid + '">' + _svgEsc(sub) + '</text>';
    }
    h += '</svg>';
    return h;
}
// ── Sparkline ─────────────────────────────────────────────────────
// Points is a numeric array. opts: { width, height, color, fill }
function _svgSparkline(points, opts) {
    opts = opts || {};
    points = points || [];
    if (points.length < 2)
        return '<svg class="ct-svg-spark" viewBox="0 0 60 20" width="60" height="20"></svg>';
    var w = opts.width || 120, h = opts.height || 28;
    var min = Math.min.apply(null, points), max = Math.max.apply(null, points);
    var range = max - min || 1;
    var step = w / (points.length - 1);
    var coords = points.map(function (p, i) {
        var x = (i * step).toFixed(1);
        var y = (h - ((p - min) / range) * (h - 4) - 2).toFixed(1);
        return x + "," + y;
    });
    var color = (CT_COLORS[opts.color || "blue"] || CT_COLORS.blue).vivid;
    var out = '<svg class="ct-svg-spark" viewBox="0 0 ' + w + ' ' + h + '" width="' + w + '" height="' + h + '">';
    if (opts.fill !== false) {
        var area = "0," + h + " " + coords.join(" ") + " " + w + "," + h;
        out += '<polygon points="' + area + '" fill="' + color + '" fill-opacity="0.14"/>';
    }
    out += '<polyline points="' + coords.join(" ") + '" fill="none" stroke="' + color + '" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"/>';
    out += '</svg>';
    return out;
}
// ── Horizontal bar chart ──────────────────────────────────────────
// Data: { buckets: [{ label, value, color }], scale, unit }
// Optionally buckets can carry `segments: [{value, color}]` for
// stacked bars (used by compliance).
function _svgBar(data, opts) {
    opts = opts || {};
    data = data || {};
    var buckets = data.buckets || [];
    var scale = data.scale || Math.max.apply(null, buckets.map(function (b) {
        if (b.segments)
            return b.segments.reduce(function (a, s) { return a + (s.value || 0); }, 0);
        return b.value || 0;
    }).concat([1]));
    var rowH = opts.rowHeight || 26;
    var labelW = opts.labelWidth || 110;
    var valueW = opts.valueWidth || 42;
    var width = opts.width || 320;
    var barW = width - labelW - valueW;
    var h = buckets.length * rowH + 4;
    var out = '<svg class="ct-svg-bar" viewBox="0 0 ' + width + ' ' + h + '" width="' + width + '" height="' + h + '">';
    buckets.forEach(function (b, i) {
        var y = i * rowH + 4;
        out += '<text x="0" y="' + (y + 13) + '" font-size="11" fill="' + CT_COLORS.dark.vivid + '">' + _svgEsc(b.label) + '</text>';
        // Background track
        out += '<rect x="' + labelW + '" y="' + (y + 4) + '" width="' + barW + '" height="12" rx="3" fill="' + CT_COLORS.gray.bg + '"/>';
        // Bars (stacked or single)
        var cursor = labelW;
        var total = 0;
        if (b.segments) {
            b.segments.forEach(function (s) {
                var w = (s.value / scale) * barW;
                var color = (CT_COLORS[s.color || "blue"] || CT_COLORS.blue).vivid;
                out += '<rect x="' + cursor + '" y="' + (y + 4) + '" width="' + w.toFixed(1) + '" height="12" fill="' + color + '"/>';
                cursor += w;
                total += s.value || 0;
            });
            // Round corners on the last visible segment
            out += '<rect x="' + labelW + '" y="' + (y + 4) + '" width="' + barW + '" height="12" rx="3" fill="none" stroke="' + CT_COLORS.gray.bg + '" stroke-width="0.5"/>';
        }
        else {
            var w = (b.value / scale) * barW;
            var color = (CT_COLORS[b.color || "blue"] || CT_COLORS.blue).vivid;
            out += '<rect x="' + labelW + '" y="' + (y + 4) + '" width="' + w.toFixed(1) + '" height="12" rx="3" fill="' + color + '"/>';
            total = b.value || 0;
        }
        // Value
        var unit = data.unit || "";
        out += '<text x="' + (width - 2) + '" y="' + (y + 13) + '" text-anchor="end" font-size="11" font-weight="600" fill="' + CT_COLORS.dark.vivid + '">' + _svgEsc(total + unit) + '</text>';
    });
    out += '</svg>';
    return out;
}
// ── Donut chart ───────────────────────────────────────────────────
// Data: { segments: [{ label, value, color }], center_label, center_sublabel }
// Layout: number inside the ring (SVG text, font sized to fit), legend
// below as small colored chips. No text is placed outside the SVG.
function _svgDonut(data, opts) {
    opts = opts || {};
    data = data || {};
    var allSegments = data.segments || [];
    var segments = allSegments.filter(function (s) { return s.value > 0; });
    var size = opts.size || 140;
    var thickness = opts.thickness || 20;
    var r = (size - thickness) / 2;
    var cx = size / 2, cy = size / 2;
    var total = segments.reduce(function (a, s) { return a + s.value; }, 0) || 1;
    var C = 2 * Math.PI * r;
    // Inner radius available for the centre label
    var innerR = r - thickness / 2;
    var svg = '<svg class="ct-svg-donut" viewBox="0 0 ' + size + ' ' + size + '" width="' + size + '" height="' + size + '">';
    svg += '<circle cx="' + cx + '" cy="' + cy + '" r="' + r + '" fill="none" stroke="' + CT_COLORS.gray.bg + '" stroke-width="' + thickness + '"/>';
    var cumulative = 0;
    segments.forEach(function (s) {
        var frac = s.value / total;
        var len = C * frac;
        var color = (CT_COLORS[s.color || "blue"] || CT_COLORS.blue).vivid;
        var offset = -C * cumulative;
        svg += '<circle cx="' + cx + '" cy="' + cy + '" r="' + r + '" fill="none" stroke="' + color + '" stroke-width="' + thickness + '" stroke-dasharray="' + len.toFixed(1) + ' ' + C + '" stroke-dashoffset="' + offset.toFixed(1) + '" transform="rotate(-90 ' + cx + ' ' + cy + ')"/>';
        cumulative += frac;
    });
    // Centre label: only the number, sized to fit inside the ring
    if (data.center_label) {
        var labelStr = String(data.center_label);
        var fontSize = Math.min(innerR * 0.9, size * 0.22);
        svg += '<text x="' + cx + '" y="' + (cy + fontSize * 0.35) + '" text-anchor="middle" font-size="' + fontSize + '" font-weight="700" fill="' + CT_COLORS.dark.vivid + '">' + _svgEsc(labelStr) + '</text>';
    }
    svg += '</svg>';
    // Legend below (all segments including zeros for full scale)
    var legend = '<div class="ct-donut-legend">';
    allSegments.forEach(function (s) {
        var color = (CT_COLORS[s.color || "blue"] || CT_COLORS.blue).vivid;
        legend += '<span class="ct-donut-legend-item"><span class="ct-donut-dot" style="background:' + color + '"></span>' + _svgEsc(s.label) + ' <strong>' + s.value + '</strong></span>';
    });
    legend += '</div>';
    return '<div class="ct-donut-wrap">' + svg + legend + '</div>';
}
// ── 5x5 heatmap (risk matrix) ─────────────────────────────────────
// Data: { matrix: number[5][5], x_label, y_label }
// matrix[impact][likelihood] = count. Impact 0 = lowest row (bottom),
// likelihood 0 = leftmost column.
function _svgHeatmap(data, opts) {
    opts = opts || {};
    data = data || {};
    var m = data.matrix || [];
    var n = m.length || 5;
    var size = opts.size || 140;
    var cell = (size - 16) / n;
    var palette = CT_COLORS.matrix5 || [];
    var out = '<svg class="ct-svg-heatmap" viewBox="0 0 ' + (size + 4) + ' ' + (size + 4) + '" width="' + (size + 4) + '" height="' + (size + 4) + '">';
    for (var i = 0; i < n; i++) {
        for (var j = 0; j < n; j++) {
            var v = (m[n - 1 - i] && m[n - 1 - i][j]) || 0; // flip so row 0 is bottom
            var paletteRow = palette[n - 1 - i] || palette[0] || [];
            var fill = paletteRow[j] || CT_COLORS.gray.bg;
            var x = j * cell + 8;
            var y = i * cell + 2;
            out += '<rect x="' + x + '" y="' + y + '" width="' + (cell - 1) + '" height="' + (cell - 1) + '" rx="2" fill="' + fill + '" stroke="rgba(255,255,255,0.6)" stroke-width="1"/>';
            if (v > 0) {
                out += '<text x="' + (x + cell / 2) + '" y="' + (y + cell / 2 + 3) + '" text-anchor="middle" font-size="' + Math.max(9, cell * 0.38) + '" font-weight="700" fill="#0f172a">' + v + '</text>';
            }
        }
    }
    out += '</svg>';
    return out;
}
// ── Timeline ──────────────────────────────────────────────────────
// Data: { events: [{ date, label, status }] }
function _svgTimeline(data, opts) {
    opts = opts || {};
    data = data || {};
    var events = (data.events || []).slice(-8); // keep latest 8
    if (!events.length)
        return '<div class="ct-empty">Aucun événement</div>';
    var w = opts.width || 320, h = 60;
    var statusColor = {
        completed: CT_COLORS.green.vivid,
        in_progress: CT_COLORS.blue.vivid,
        planned: CT_COLORS.gray.vivid,
        overdue: CT_COLORS.red.vivid,
        cancelled: CT_COLORS.gray.vivid,
    };
    // X axis: time between first and last event
    var first = new Date(events[0].date).getTime();
    var last = new Date(events[events.length - 1].date).getTime();
    var span = Math.max(1, last - first);
    var out = '<svg class="ct-svg-timeline" viewBox="0 0 ' + w + ' ' + h + '" width="' + w + '" height="' + h + '">';
    out += '<line x1="8" y1="30" x2="' + (w - 8) + '" y2="30" stroke="' + CT_COLORS.gray.bg + '" stroke-width="2"/>';
    events.forEach(function (e) {
        var t = new Date(e.date).getTime();
        var frac = span > 0 ? (t - first) / span : 0.5;
        var x = 8 + frac * (w - 16);
        var color = statusColor[e.status] || CT_COLORS.gray.vivid;
        out += '<circle cx="' + x.toFixed(1) + '" cy="30" r="5" fill="' + color + '" stroke="#fff" stroke-width="2"><title>' + _svgEsc(e.label + " — " + e.date) + '</title></circle>';
    });
    // Date ticks on edges
    out += '<text x="8" y="50" font-size="10" fill="' + CT_COLORS.gray.vivid + '">' + _svgEsc((events[0].date || "").slice(0, 10)) + '</text>';
    out += '<text x="' + (w - 8) + '" y="50" text-anchor="end" font-size="10" fill="' + CT_COLORS.gray.vivid + '">' + _svgEsc((events[events.length - 1].date || "").slice(0, 10)) + '</text>';
    out += '</svg>';
    return out;
}
// ── Posture color helper ──────────────────────────────────────────
// Returns a CT_COLORS key based on a 0..100 score.
function _postureColor(value, max) {
    var pct = max ? value / max * 100 : value;
    if (pct < 40)
        return "red";
    if (pct < 60)
        return "orange";
    if (pct < 80)
        return "yellow";
    return "green";
}
// ── Posture label helper ──────────────────────────────────────────
function _postureLabel(score) {
    if (score == null)
        return "";
    if (score < 40)
        return "Faible";
    if (score < 60)
        return "Modéré";
    if (score < 80)
        return "Bon";
    return "Excellent";
}
// ── Dispatcher: render a breakdown by its type ───────────────────
// Used by Pilot to turn the module stats.breakdown into SVG.
function _svgBreakdown(breakdown, opts) {
    if (!breakdown || !breakdown.type)
        return "";
    var data = breakdown.data || {};
    switch (breakdown.type) {
        case "heatmap_5x5": return _svgHeatmap(data, opts);
        case "bar": return _svgBar(data, opts);
        case "donut": return _svgDonut(data, { size: (opts && opts.size) || 110, thickness: 16 });
        case "gauge": return _svgGauge(data.value || 0, data.max || 100, { sublabel: data.label, color: data.color, size: opts.size || 120 });
        case "timeline": return _svgTimeline(data, opts);
        default: return "";
    }
}
// Expose on window so apps loaded after cisotoolbox.js can use them
window._svgGauge = _svgGauge;
window._svgSparkline = _svgSparkline;
window._svgBar = _svgBar;
window._svgDonut = _svgDonut;
window._svgHeatmap = _svgHeatmap;
window._svgTimeline = _svgTimeline;
window._svgBreakdown = _svgBreakdown;
window._postureColor = _postureColor;
window._postureLabel = _postureLabel;
// ═══════════════════════════════════════════════════════════════════════
// SIDEBAR ACCORDION — shared accordion for sidebar groups
// ═══════════════════════════════════════════════════════════════════════
/**
 * Update sidebar: set active item + open the right accordion group.
 * Call this from each app's selectPanel().
 * @param {string} panelId — the panel being selected
 */
function _updateSidebarAccordion(panelId) {
    document.querySelectorAll(".sidebar-item").forEach(function (s) {
        s.classList.remove("active");
        var args = s.getAttribute("data-args");
        if (args) {
            try {
                if (JSON.parse(args)[0] === panelId)
                    s.classList.add("active");
            }
            catch (e) { }
        }
    });
    document.querySelectorAll(".sidebar-group").forEach(function (g) {
        var panels = (g.getAttribute("data-panels") || "").split(",");
        g.classList.toggle("open", panels.indexOf(panelId) >= 0);
    });
}
/**
 * Toggle a sidebar group open/closed. If opening, select its first panel.
 * Used via data-click="toggleGroup" data-pass-el on sidebar-toggle elements.
 */
function toggleGroup(el) {
    if (!el)
        return;
    var group = el.closest(".sidebar-group");
    if (!group)
        return;
    if (group.classList.contains("open")) {
        group.classList.remove("open");
    }
    else {
        // Open group and select first panel WITHOUT closing the mobile sidebar
        var sidebar = document.querySelector(".sidebar");
        var wasOpen = sidebar && sidebar.classList.contains("open");
        var panels = (group.getAttribute("data-panels") || "").split(",");
        if (panels[0] && typeof selectPanel === "function")
            selectPanel(panels[0]);
        // Restore mobile sidebar if it was open
        if (wasOpen && sidebar)
            sidebar.classList.add("open");
    }
}
// ═══════════════════════════════════════════════════════════════════════
// SLIDER — Shared slider with dynamic color (red→green)
// ═══════════════════════════════════════════════════════════════════════
function _sliderColor(val, max) {
    // Smooth gradient through Tailwind-like colors: red → orange → yellow → green
    var ratio = max > 0 ? val / max : 0;
    // Stops: 0=#ef4444 (red-500), 0.33=#f97316 (orange-500), 0.66=#eab308 (yellow-500), 1=#22c55e (green-500)
    var stops = [[239, 68, 68], [249, 115, 22], [234, 179, 8], [34, 197, 94]];
    var pos = ratio * (stops.length - 1);
    var i = Math.min(Math.floor(pos), stops.length - 2);
    var t2 = pos - i;
    var r = Math.round(stops[i][0] + (stops[i + 1][0] - stops[i][0]) * t2);
    var g = Math.round(stops[i][1] + (stops[i + 1][1] - stops[i][1]) * t2);
    var b = Math.round(stops[i][2] + (stops[i + 1][2] - stops[i][2]) * t2);
    return "rgb(" + r + "," + g + "," + b + ")";
}
function _applySliderStyle(el) {
    var val = parseInt(el.value) || 0;
    var max = parseInt(el.max) || 5;
    var invert = el.hasAttribute("data-invert");
    var color = _sliderColor(invert ? (max - val) : val, max);
    var pct = max > 0 ? (val / max * 100) : 0;
    el.style.background = "linear-gradient(to right, " + color + " " + pct + "%, var(--border) " + pct + "%)";
    var styleId = "slider-style-" + el.id;
    var existing = document.getElementById(styleId);
    if (!existing) {
        existing = document.createElement("style");
        existing.id = styleId;
        document.head.appendChild(existing);
    }
    existing.textContent = "#" + el.id + "::-webkit-slider-thumb{background:" + color + "} #" + el.id + "::-moz-range-thumb{background:" + color + "}";
}
function _initSliders() {
    document.querySelectorAll(".slider-input").forEach(function (el) { _applySliderStyle(el); });
}
// ═══════════════════════════════════════════════════════════════════════
// DELEGATION D'EVENEMENTS (CSP : zero inline handlers)
// ═══════════════════════════════════════════════════════════════════════
function _toggleSidebarMobile() {
    document.querySelector(".sidebar").classList.toggle("open");
}
function _menuAction(fnName) {
    if (_BLOCKED_DISPATCH[fnName])
        return;
    if (typeof window[fnName] === "function")
        window[fnName]();
    toggleMenu();
}
// ── Help overlay (shared across all modules) ────────────────────
function toggleHelp(tab) {
    document.querySelector(".sidebar").classList.remove("open");
    var overlay = document.getElementById("help-overlay");
    if (!overlay)
        return;
    if (tab && !overlay.classList.contains("open")) {
        overlay.classList.add("open");
        switchHelpTab(tab);
    }
    else if (tab && overlay.classList.contains("open")) {
        switchHelpTab(tab);
    }
    else {
        overlay.classList.toggle("open");
    }
}
function switchHelpTab(tab) {
    document.querySelectorAll(".help-tab").forEach(function (t) { t.classList.remove("active"); });
    document.querySelectorAll(".help-content").forEach(function (c) { c.style.display = "none"; });
    var tabEl = document.getElementById("help-tab-" + tab);
    var contentEl = document.getElementById("help-content-" + tab);
    if (tabEl)
        tabEl.classList.add("active");
    if (contentEl)
        contentEl.style.display = "block";
}
function _autoHeight(el) {
    el.style.height = "auto";
    el.style.height = el.scrollHeight + "px";
}
// Blocked function names for data-click dispatch (defense-in-depth)
var _BLOCKED_DISPATCH = { "eval": 1, "Function": 1, "setTimeout": 1, "setInterval": 1, "fetch": 1, "open": 1, "close": 1, "alert": 1, "confirm": 1, "prompt": 1, "importScripts": 1, "postMessage": 1, "XMLHttpRequest": 1, "WebSocket": 1, "EventSource": 1, "Worker": 1, "SharedWorker": 1, "navigator": 1, "crypto": 1, "Notification": 1 };
function _safeDispatch(fn, args) {
    if (_BLOCKED_DISPATCH[fn])
        return;
    if (typeof window[fn] === "function")
        window[fn].apply(null, args);
}
var _mouseDownTarget = null;
document.addEventListener("mousedown", function (e) { _mouseDownTarget = e.target; });
document.addEventListener("click", function (e) {
    var selfEl = e.target.closest("[data-click-self]");
    if (selfEl && e.target === selfEl) {
        if (_mouseDownTarget !== selfEl)
            return;
        var fn0 = selfEl.getAttribute("data-click-self");
        _safeDispatch(fn0, []);
        return;
    }
    var el = e.target.closest("[data-click]");
    if (!el)
        return;
    if (el.hasAttribute("data-stop"))
        e.stopPropagation();
    var fn = el.getAttribute("data-click");
    var args = el.hasAttribute("data-args") ? JSON.parse(el.getAttribute("data-args")) : [];
    if (el.hasAttribute("data-pass-el"))
        args.push(el);
    if (el.hasAttribute("data-pass-event"))
        args.push(e);
    _safeDispatch(fn, args);
});
document.addEventListener("change", function (e) {
    var el = e.target.closest("[data-change]");
    if (!el)
        return;
    var fn = el.getAttribute("data-change");
    var args = el.hasAttribute("data-args") ? JSON.parse(el.getAttribute("data-args")) : [];
    if (el.hasAttribute("data-pass-value"))
        args.push(el.value);
    if (el.hasAttribute("data-pass-checked"))
        args.push(el.checked);
    if (el.hasAttribute("data-pass-el"))
        args.push(el);
    if (el.hasAttribute("data-pass-event"))
        args.push(e);
    _safeDispatch(fn, args);
});
document.addEventListener("input", function (e) {
    var el = e.target.closest("[data-input]");
    if (!el)
        return;
    var fn = el.getAttribute("data-input");
    var args = el.hasAttribute("data-args") ? JSON.parse(el.getAttribute("data-args")) : [];
    if (el.hasAttribute("data-pass-value"))
        args.push(el.value);
    if (el.hasAttribute("data-pass-el"))
        args.push(el);
    _safeDispatch(fn, args);
});
// ═══════════════════════════════════════════════════════════════════════
// COLONNES (masquer / afficher / redimensionner)
// ═══════════════════════════════════════════════════════════════════════
function hd(key) { return ' data-col="' + key + '"'; }
var _userHiddenCols = {};
var _userColWidths = {};
function _setupTable(tableId, defaultHidden) {
    var table = document.getElementById(tableId);
    if (!table)
        return;
    var ths = table.querySelectorAll("thead th");
    ths.forEach(function (th, ci) {
        if (ci === ths.length - 1)
            return;
        if (th.querySelector(".col-hide"))
            return;
        var col = th.getAttribute("data-col");
        if (col) {
            var btn = document.createElement("span");
            btn.className = "col-hide";
            btn.innerHTML = "&#10005;";
            btn.title = t("col_hide_title");
            btn.onclick = function (e) { e.stopPropagation(); e.preventDefault(); hideCol(tableId, col); };
            th.appendChild(btn);
        }
    });
    if (_userColWidths[tableId]) {
        for (var ci in _userColWidths[tableId]) {
            var th = ths[parseInt(ci)];
            if (th) {
                th.style.width = _userColWidths[tableId][ci];
                th.style.minWidth = _userColWidths[tableId][ci];
            }
        }
    }
    // Au 1er rendu, on initialise l'ensemble masqué avec les colonnes masquées
    // par défaut ; ensuite _userHiddenCols[tableId] est l'UNIQUE source de vérité
    // (hideCol ajoute, showCol retire). Ainsi les masquages par défaut ET manuels
    // persistent au re-render — et une colonne par défaut volontairement
    // ré-affichée le reste aussi. (Avant : `|| defaultHidden` faisait que le 1er
    // masquage manuel court-circuitait les colonnes masquées par défaut, qui
    // réapparaissaient — BUG-15.)
    if (_userHiddenCols[tableId] === undefined) {
        _userHiddenCols[tableId] = (defaultHidden || []).slice();
    }
    var toHide = _userHiddenCols[tableId];
    for (var i = 0; i < toHide.length; i++)
        hideCol(tableId, toHide[i], true);
}
function _updateColsBtn(tableId) {
    var btn = document.getElementById(tableId + "-cols-btn");
    if (!btn)
        return;
    var table = document.getElementById(tableId);
    if (!table)
        return;
    var hidden = table.querySelectorAll("thead th[data-col][style*='display: none']");
    btn.style.display = hidden.length > 0 ? "" : "none";
}
function hideCol(tableId, col, silent) {
    var table = document.getElementById(tableId);
    if (!table)
        return;
    table.querySelectorAll('[data-col="' + col + '"]').forEach(function (el) { el.style.display = "none"; });
    if (!silent) {
        if (!_userHiddenCols[tableId])
            _userHiddenCols[tableId] = [];
        if (_userHiddenCols[tableId].indexOf(col) === -1)
            _userHiddenCols[tableId].push(col);
    }
    _updateColsPopup(tableId);
    _updateColsBtn(tableId);
}
function showCol(tableId, col) {
    var table = document.getElementById(tableId);
    if (!table)
        return;
    table.querySelectorAll('[data-col="' + col + '"]').forEach(function (el) { el.style.display = ""; });
    if (_userHiddenCols[tableId]) {
        // On NE supprime PAS la clé même vide : une liste vide signifie
        // « initialisé, rien de masqué » (l'utilisateur a tout ré-affiché).
        // La supprimer ferait re-masquer les colonnes par défaut au prochain
        // _setupTable (cf. BUG-15).
        _userHiddenCols[tableId] = _userHiddenCols[tableId].filter(function (c) { return c !== col; });
    }
    _updateColsPopup(tableId);
    _updateColsBtn(tableId);
}
function _updateColsPopup(tableId) {
    var popup = document.getElementById(tableId + "-cols-popup");
    if (!popup)
        return;
    var table = document.getElementById(tableId);
    if (!table)
        return;
    var ths = table.querySelectorAll("thead th[data-col]");
    var h = '';
    ths.forEach(function (th) {
        var col = th.getAttribute("data-col");
        var label = th.textContent.replace("✕", "").trim();
        if (th.style.display === "none") {
            h += '<label><input type="checkbox" data-change="showCol" data-args=\'' + _da(tableId, col) + '\'> ' + esc(label) + '</label>';
        }
    });
    popup.innerHTML = h || '<span class="text-muted fs-sm">' + t("cols_all_visible") + '</span>';
}
function toggleColsPopup(tableId) {
    _updateColsPopup(tableId);
    var popup = document.getElementById(tableId + "-cols-popup");
    if (popup)
        popup.classList.toggle("open");
}
document.addEventListener("click", function (e) {
    if (!e.target.closest(".cols-popup") && !e.target.closest(".btn-show-cols")) {
        document.querySelectorAll(".cols-popup.open").forEach(function (p) { p.classList.remove("open"); });
    }
});
function colsButton(tableId) {
    return '<div style="position:relative;display:inline-block;margin-bottom:6px">'
        + '<button class="btn-show-cols" style="display:none" id="' + tableId + '-cols-btn" data-click="toggleColsPopup" data-args=\'' + _da(tableId) + '\'>' + t("cols_hidden_btn") + '</button>'
        + '<div class="cols-popup" id="' + tableId + '-cols-popup"></div>'
        + '</div>';
}
// Redimensionnement de colonnes
var RESIZE_EDGE = 6;
var _resizing = null;
document.addEventListener("mousemove", function (e) {
    if (_resizing)
        return;
    var cell = e.target.closest("td, th");
    if (!cell || !cell.closest("table[id]"))
        return;
    var rect = cell.getBoundingClientRect();
    cell.style.cursor = (rect.right - e.clientX <= RESIZE_EDGE) ? "col-resize" : "";
});
document.addEventListener("mousedown", function (e) {
    if (_resizing)
        return;
    var cell = e.target.closest("td, th");
    if (!cell)
        return;
    var table = cell.closest("table[id]");
    if (!table)
        return;
    var rect = cell.getBoundingClientRect();
    if (rect.right - e.clientX > RESIZE_EDGE)
        return;
    e.preventDefault();
    var ci = 0;
    for (var c = cell.previousElementSibling; c; c = c.previousElementSibling)
        ci += (c.colSpan || 1);
    var th = table.querySelector("thead tr").children[ci];
    if (!th)
        return;
    _resizing = { th: th, startX: e.pageX, startW: th.offsetWidth, table: table };
    document.onmousemove = _doResize;
    document.onmouseup = _stopResize;
});
function _doResize(e) {
    if (!_resizing)
        return;
    var diff = e.pageX - _resizing.startX;
    var newW = Math.max(30, _resizing.startW + diff);
    _resizing.th.style.width = newW + "px";
    _resizing.th.style.minWidth = newW + "px";
}
function _stopResize() {
    if (_resizing) {
        var th = _resizing.th;
        var table = th.closest("table");
        if (table && table.id) {
            var ci = Array.from(th.parentElement.children).indexOf(th);
            if (!_userColWidths[table.id])
                _userColWidths[table.id] = {};
            _userColWidths[table.id][ci] = th.style.width;
        }
    }
    _resizing = null;
    document.onmousemove = null;
    document.onmouseup = null;
}
// ═══════════════════════════════════════════════════════════════════════
// CHARGEMENT LAZY D'ASSETS
// ═══════════════════════════════════════════════════════════════════════
function _loadAsset(filename, cb) {
    var existing = document.querySelector('script[data-asset="' + filename + '"]');
    if (existing) {
        if (existing.dataset.loaded === "1")
            cb();
        else {
            existing.addEventListener("load", cb);
            existing.addEventListener("error", cb);
        }
        return;
    }
    var s = document.createElement("script");
    s.dataset.asset = filename;
    s.src = filename;
    s.onload = function () { s.dataset.loaded = "1"; cb(); };
    s.onerror = function () { s.dataset.loaded = "err"; cb(); };
    document.head.appendChild(s);
}
// ── Lazy <script> loader (Promise) for heavy CDN libs (ExcelJS, JSZip…) ──
// Memoized per URL. opts.onStart/onDone surface a status message; integrity
// enables SRI. Replaces per-app _loadExcelJS/_loadJSZip copies (and gives the
// callers that lacked it the SRI hash for free).
var _scriptPromises = {};
function _loadScript(url, opts) {
    var cached = _scriptPromises[url];
    if (cached)
        return cached;
    var o = opts || {};
    var p = new Promise(function (resolve, reject) {
        if (o.onStart)
            o.onStart();
        var s = document.createElement("script");
        s.src = url;
        if (o.integrity) {
            s.integrity = o.integrity;
            s.crossOrigin = o.crossOrigin || "anonymous";
        }
        else if (o.crossOrigin) {
            s.crossOrigin = o.crossOrigin;
        }
        s.onload = function () { if (o.onDone)
            o.onDone(); resolve(); };
        s.onerror = function () { delete _scriptPromises[url]; reject(new Error("script load failed: " + url)); };
        document.head.appendChild(s);
    });
    _scriptPromises[url] = p;
    return p;
}
// ── File download helpers ──
function _safeFileName(name, max) {
    var n = String(name || "").replace(/[\/\\:*?"<>|]+/g, "_").replace(/\s+/g, " ").trim();
    if (max && n.length > max)
        n = n.slice(0, max);
    return n || "export";
}
function _downloadBlob(blob, filename) {
    var url = URL.createObjectURL(blob);
    var a = document.createElement("a");
    a.href = url;
    a.download = filename;
    document.body.appendChild(a);
    a.click();
    a.remove();
    setTimeout(function () { URL.revokeObjectURL(url); }, 0);
}
// ── CSV helpers: template download (BOM + CRLF) and permissive parse ──
function _downloadCSV(filename, headerLine, exampleRows) {
    var body = [headerLine].concat(exampleRows || []).join("\r\n");
    _downloadBlob(new Blob(["﻿" + body], { type: "text/csv;charset=utf-8" }), filename);
}
function _parseCSV(text) {
    var lines = String(text || "").replace(/\r\n?/g, "\n").split("\n").filter(function (l) { return l.trim() !== ""; });
    if (!lines.length)
        return { headers: [], rows: [] };
    var first = lines[0];
    var sep = first.indexOf("\t") >= 0 ? "\t" : (first.indexOf(";") >= 0 ? ";" : ",");
    var deq = function (c) { return c.replace(/^["']|["']$/g, "").trim(); };
    var headers = first.split(sep).map(function (h) { return deq(h).toLowerCase(); });
    var rows = lines.slice(1).map(function (l) { return l.split(sep).map(deq); });
    return { headers: headers, rows: rows };
}
// ── Classify a date vs now: expired / soon (within soonDays) / valid ──
function ctDateStatus(dateStr, soonDays) {
    if (!dateStr)
        return "";
    var d = new Date(dateStr);
    if (isNaN(d.getTime()))
        return "";
    var now = Date.now(), tt = d.getTime();
    if (tt < now)
        return "expired";
    if (tt < now + soonDays * 86400000)
        return "soon";
    return "valid";
}
// ── Append "{id} - {label}" to a comma-separated reference string ──
function _csvAppendRef(current, id, label) {
    var ref = id + " - " + label;
    return current ? current + ", " + ref : ref;
}
var _descriptionsLoaded = false;
function _ensureDescriptions(cb) {
    if (_descriptionsLoaded) {
        cb();
        return;
    }
    _loadAsset(_ASSET_BASE + "_descriptions.js", function () {
        _descriptionsLoaded = true;
        cb();
    });
}
function _ensureFramework(fwId, cb) {
    if (REFERENTIELS_META[fwId] && REFERENTIELS_META[fwId].measures) {
        cb();
        return;
    }
    _loadAsset(_ASSET_BASE + "_ref_" + fwId + ".js", function () {
        var ns = _ct().refNamespace || "CT_REF";
        if (window[ns] && window[ns][fwId]) {
            REFERENTIELS_META[fwId] = window[ns][fwId];
        }
        cb();
    });
}
function _initDataAndRender(afterFn) {
    var finish = function () { ensureKeys(); renderAll(); if (afterFn)
        afterFn(); };
    var active = (D.referentiels_actifs || []).filter(function (id) { return id; });
    if (active.length === 0) {
        finish();
        return;
    }
    var pending = active.length;
    var done = function () { if (--pending === 0)
        finish(); };
    active.forEach(function (fwId) { _ensureFramework(fwId, done); });
}
function _getAnssDesc(num) {
    var ns = _ct().descNamespace || "CT_DESCRIPTIONS";
    var dd = window[ns];
    if (!dd)
        return "";
    var key = String(num);
    if (_locale === "en" && dd.anssi_en && dd.anssi_en[key])
        return dd.anssi_en[key];
    return (dd.anssi && dd.anssi[key]) || "";
}
function _getIsoDesc(ref) {
    var ns = _ct().descNamespace || "CT_DESCRIPTIONS";
    var dd = window[ns];
    if (!dd)
        return "";
    if (_locale === "en" && dd.iso_en && dd.iso_en[ref])
        return dd.iso_en[ref];
    return (dd.iso && dd.iso[ref]) || "";
}
// ═══════════════════════════════════════════════════════════════════════
// SLIDER CONFORMITE
// ═══════════════════════════════════════════════════════════════════════
function _sliderInput(el) {
    var v = parseInt(el.value);
    var c = v >= 80 ? "var(--green)" : v > 0 ? "var(--orange)" : "var(--red)";
    var lbl = el.getAttribute("data-lbl");
    var l = lbl ? document.getElementById(lbl) : null;
    if (l) {
        l.textContent = v + "%";
        l.style.color = c;
    }
    el.style.accentColor = c;
}
// ═══════════════════════════════════════════════════════════════════════
// TOOLBAR & SIDEBAR
// ═══════════════════════════════════════════════════════════════════════
// isError est ignoré ici mais consommé par les overrides backend
// (vendor_api & co redéfinissent showStatus avec un style d'erreur).
function showStatus(msg, isError) {
    var el = document.getElementById("status-msg");
    if (el) {
        el.textContent = msg;
        setTimeout(function () { el.textContent = ""; }, 3000);
    }
}
function toggleMenu() {
    // Apps that don't ship an #io-menu dropdown (Surface, future modules)
    // still trigger this via ai_common.js openSettings() — guard the lookup.
    var el = document.getElementById("io-menu");
    if (el)
        el.classList.toggle("open");
}
document.addEventListener("click", function (e) {
    if (!e.target.closest(".toolbar-menu")) {
        var m = document.getElementById("io-menu");
        if (m)
            m.classList.remove("open");
    }
});
function toggleSidebar() {
    document.querySelector(".sidebar").classList.toggle("collapsed");
}
// ═══════════════════════════════════════════════════════════════════════
// UNDO / REDO
// ═══════════════════════════════════════════════════════════════════════
var _undoStack = [];
var _redoStack = [];
function _saveState() {
    _undoStack.push(JSON.stringify(D));
    if (_undoStack.length > 50)
        _undoStack.shift();
    _redoStack.length = 0;
}
function _updateUndoButtons() {
    // Match both the class form (.btn-undo, most apps) and the id form
    // (#btn-undo, Risk/Compliance) so a single shared impl serves every app.
    // NB: opacity only — never the `disabled` attribute. Several actions render
    // partially (no renderAll → no _updateUndoButtons refresh), so a disabled
    // button would stay stuck after such an action even though the stack grew,
    // making undo unclickable. Opacity is a hint; the button stays clickable.
    var u = document.querySelector(".btn-undo, #btn-undo");
    var r = document.querySelector(".btn-redo, #btn-redo");
    if (u)
        u.style.opacity = _undoStack.length ? "1" : "0.3";
    if (r)
        r.style.opacity = _redoStack.length ? "1" : "0.3";
}
function _replaceD(json) {
    var parsed = JSON.parse(json);
    delete parsed.__proto__;
    delete parsed.constructor;
    delete parsed.prototype;
    Object.keys(D).forEach(function (k) { delete D[k]; });
    Object.assign(D, parsed);
}
function undo() {
    if (_undoStack.length === 0)
        return;
    _redoStack.push(JSON.stringify(D));
    _replaceD(_undoStack.pop());
    if (typeof renderAll === "function")
        renderAll();
    if (typeof _autoSave === "function")
        _autoSave();
    _updateUndoButtons();
}
function redo() {
    if (_redoStack.length === 0)
        return;
    _undoStack.push(JSON.stringify(D));
    _replaceD(_redoStack.pop());
    if (typeof renderAll === "function")
        renderAll();
    if (typeof _autoSave === "function")
        _autoSave();
    _updateUndoButtons();
}
// ═══════════════════════════════════════════════════════════════════════
// CONFIRM DIALOG
// ═══════════════════════════════════════════════════════════════════════
// Custom confirm dialog using the confirm-overlay (Oui/Non buttons, i18n)
function _confirmDialog(title, body) {
    var overlay = document.getElementById("confirm-overlay");
    if (!overlay)
        return Promise.resolve(confirm(title));
    return new Promise(function (resolve) {
        document.getElementById("confirm-title").textContent = title;
        var bodyEl = document.getElementById("confirm-body");
        if (bodyEl)
            bodyEl.textContent = body || "";
        overlay.classList.add("open");
        function cleanup() {
            overlay.classList.remove("open");
            document.getElementById("confirm-oui").onclick = null;
            document.getElementById("confirm-non").onclick = null;
        }
        document.getElementById("confirm-oui").onclick = function () { cleanup(); resolve(true); };
        document.getElementById("confirm-non").onclick = function () { cleanup(); resolve(false); };
    });
}
// Ctrl+Z / Ctrl+Y
document.addEventListener("keydown", function (e) {
    if ((e.ctrlKey || e.metaKey) && e.key === "z" && !e.shiftKey) {
        if (e.target.tagName === "TEXTAREA" || e.target.tagName === "INPUT")
            return;
        e.preventDefault();
        undo();
    }
    if ((e.ctrlKey || e.metaKey) && (e.key === "y" || (e.key === "z" && e.shiftKey))) {
        if (e.target.tagName === "TEXTAREA" || e.target.tagName === "INPUT")
            return;
        e.preventDefault();
        redo();
    }
});
// ═══════════════════════════════════════════════════════════════════════
// CHIFFREMENT (AES-256-GCM, PBKDF2 250k)
// ═══════════════════════════════════════════════════════════════════════
async function _deriveKey(password, salt) {
    var enc = new TextEncoder();
    var keyMaterial = await crypto.subtle.importKey("raw", enc.encode(password), "PBKDF2", false, ["deriveKey"]);
    return crypto.subtle.deriveKey({ name: "PBKDF2", salt: salt, iterations: 250000, hash: "SHA-256" }, keyMaterial, { name: "AES-GCM", length: 256 }, false, ["encrypt", "decrypt"]);
}
async function _encryptData(jsonStr, password) {
    var salt = crypto.getRandomValues(new Uint8Array(16));
    var iv = crypto.getRandomValues(new Uint8Array(12));
    var key = await _deriveKey(password, salt);
    var ciphertext = await crypto.subtle.encrypt({ name: "AES-GCM", iv: iv }, key, new TextEncoder().encode(jsonStr));
    var header = new TextEncoder().encode("CT_ENC");
    var result = new Uint8Array(header.length + salt.length + iv.length + ciphertext.byteLength);
    result.set(header, 0);
    result.set(salt, header.length);
    result.set(iv, header.length + salt.length);
    result.set(new Uint8Array(ciphertext), header.length + salt.length + iv.length);
    return result;
}
async function _decryptData(buffer, password) {
    var header = new TextDecoder().decode(buffer.slice(0, 6));
    // Support ancien format EBIOS_ENC (9 bytes) et nouveau CT_ENC (6 bytes)
    var headerLen = header === "CT_ENC" ? 6 : (new TextDecoder().decode(buffer.slice(0, 9)) === "EBIOS_ENC" ? 9 : 0);
    if (!headerLen)
        throw new Error(t("err_not_encrypted"));
    var salt = buffer.slice(headerLen, headerLen + 16);
    var iv = buffer.slice(headerLen + 16, headerLen + 28);
    var ciphertext = buffer.slice(headerLen + 28);
    var key = await _deriveKey(password, salt);
    var decrypted = await crypto.subtle.decrypt({ name: "AES-GCM", iv: iv }, key, ciphertext);
    return new TextDecoder().decode(decrypted);
}
function _isEncrypted(buffer) {
    if (buffer.byteLength < 9)
        return false;
    var h6 = new TextDecoder().decode(buffer.slice(0, 6));
    var h9 = new TextDecoder().decode(buffer.slice(0, 9));
    return h6 === "CT_ENC" || h9 === "EBIOS_ENC";
}
// Prompt password (utilise le dialog #pwd-overlay s'il existe, sinon prompt natif)
function _promptPassword(title, confirmMode) {
    var overlay = document.getElementById("pwd-overlay");
    if (!overlay) {
        return new Promise(function (resolve) {
            var pwd = prompt(title);
            resolve(pwd);
        });
    }
    return new Promise(function (resolve) {
        var inp1 = document.getElementById("pwd-input");
        var inp2 = document.getElementById("pwd-input2");
        var err = document.getElementById("pwd-error");
        document.getElementById("pwd-title").textContent = title;
        inp1.value = "";
        inp2.value = "";
        err.textContent = "";
        if (confirmMode) {
            inp2.classList.remove("hidden");
            inp2.style.display = "";
        }
        else {
            inp2.classList.add("hidden");
        }
        overlay.classList.add("open");
        inp1.focus();
        function cleanup() {
            overlay.classList.remove("open");
            document.getElementById("pwd-ok").onclick = null;
            document.getElementById("pwd-cancel").onclick = null;
            inp1.onkeydown = null;
            inp2.onkeydown = null;
        }
        function submit() {
            var v1 = inp1.value;
            if (!v1) {
                err.textContent = t("pwd_err_empty");
                return;
            }
            if (confirmMode && v1 !== inp2.value) {
                err.textContent = t("pwd_err_mismatch");
                inp2.focus();
                return;
            }
            cleanup();
            resolve(v1);
        }
        function cancel() { cleanup(); resolve(null); }
        document.getElementById("pwd-ok").onclick = submit;
        document.getElementById("pwd-cancel").onclick = cancel;
        var onKey = function (e) { if (e.key === "Enter")
            submit(); if (e.key === "Escape")
            cancel(); };
        inp1.onkeydown = onKey;
        inp2.onkeydown = onKey;
    });
}
// ═══════════════════════════════════════════════════════════════════════
// RISK MATRIX COMPONENT (parametrable SVG heatmap)
// ═══════════════════════════════════════════════════════════════════════
var _ctMatrixCounter = 0;
/**
 * Render a parametrable risk matrix (SVG heatmap with dots and tooltips).
 *
 * @param {Object} opts
 * @param {number} opts.levels       Number of levels per axis (4 or 5, default 5)
 * @param {string} opts.xLabel       X-axis label (default "Impact")
 * @param {string} opts.yLabel       Y-axis label (default "Vraisemblance")
 * @param {string[]} [opts.xLabels]  Per-level X labels (e.g. ["Neg.","Min.","Mod.","Maj.","Crit."])
 * @param {string[]} [opts.yLabels]  Per-level Y labels
 * @param {Object} opts.grid         Data: { "x-y": [{id, label, detail}], ... }
 * @param {Function} [opts.tooltipFn] Custom tooltip renderer: fn(items) → HTML string
 * @param {string[][]} [opts.colors] Custom color matrix (levels×levels), bottom-left to top-right
 * @param {Function}  [opts.colorFn] Custom color function: fn(x, y) → color string (overrides colors matrix)
 * @param {Object[]} [opts.legend]   Custom legend: [{label, color}]
 * @returns {string} HTML string (SVG + legend + tooltip div)
 */
function ctRenderMatrix(opts) {
    var N = opts.levels || 5;
    var NX = opts.xLevels || N;
    var NY = opts.yLevels || N;
    var yLabelsArr = opts.yLabels || [];
    var maxYLen = 0;
    for (var _i = 0; _i < yLabelsArr.length; _i++) {
        var _l = String(yLabelsArr[_i] || "").length;
        if (_l > maxYLen)
            maxYLen = _l;
    }
    // Margins: left (Y axis label 14px + gap + tick labels), bottom (X tick labels + axis label)
    var ML = Math.max(58, 28 + maxYLen * 5.5); // left margin: axis label + tick labels
    var MB = 32; // bottom margin
    var MT = 4; // top margin
    var gridW = NX * 55;
    var gridH = NY * 50;
    var W = ML + gridW + 4;
    var H = MT + gridH + MB;
    var cellW = gridW / NX, cellH = gridH / NY;
    var colors = opts.colors || (N === 4 ? CT_COLORS.matrix4 : CT_COLORS.matrix5);
    var colorFn = opts.colorFn || null;
    var defaultLegend = [
        { label: t("matrix.low") || "Faible", color: "#dcfce7" },
        { label: t("matrix.moderate") || "Modere", color: "#fef9c3" },
        { label: t("matrix.significant") || "Significatif", color: "#fed7aa" },
        { label: t("matrix.high") || "Eleve", color: "#fecaca" },
        { label: t("matrix.critical") || "Critique", color: "#fca5a5" },
        { label: t("matrix.extreme") || "Extreme", color: "#ef4444" }
    ];
    var legend = opts.legend || defaultLegend;
    var matrixId = "ct-matrix-" + (++_ctMatrixCounter);
    var grid = opts.grid || {};
    var xLabel = opts.xLabel || t("matrix.x") || "Impact";
    var yLabel = opts.yLabel || t("matrix.y") || "Vraisemblance";
    var xLabels = opts.xLabels || null;
    var yLabels = opts.yLabels || null;
    var svg = '<div style="display:flex;flex-direction:column;align-items:center"><svg viewBox="-14 0 ' + (W + 14) + ' ' + H + '" style="width:100%;max-width:420px;overflow:visible">';
    // Background cells
    for (var row = 0; row < NY; row++) {
        for (var col = 0; col < NX; col++) {
            var x = ML + col * cellW;
            var y = MT + (NY - 1 - row) * cellH;
            var fill = colorFn ? colorFn(col + 1, row + 1) : ((colors[row] && colors[row][col]) || "#f1f5f9");
            svg += '<rect x="' + x + '" y="' + y + '" width="' + cellW + '" height="' + cellH + '" fill="' + fill + '" stroke="white" stroke-width="1"/>';
        }
    }
    // Dots
    var dots = [];
    for (var k in grid) {
        var parts = k.split("-");
        var cx_val = parseInt(parts[0]);
        var cy_val = parseInt(parts[1]);
        var items = grid[k];
        if (!items || !items.length)
            continue;
        var cx = ML + (cx_val - 1) * cellW + cellW / 2;
        var cy = MT + (NY - cy_val) * cellH + cellH / 2;
        var dotId = matrixId + "-" + cx_val + "-" + cy_val;
        var r = Math.min(14, 8 + items.length * 2);
        svg += '<circle id="' + dotId + '" cx="' + cx + '" cy="' + cy + '" r="' + r + '" fill="rgba(37,99,235,0.8)" stroke="white" stroke-width="1.5" style="cursor:pointer"/>';
        svg += '<text x="' + cx + '" y="' + (cy + 4) + '" text-anchor="middle" fill="white" font-size="10" font-weight="700" style="pointer-events:none">' + items.length + '</text>';
        dots.push({ id: dotId, items: items });
    }
    // X axis label (bottom center)
    svg += '<text x="' + (ML + gridW / 2) + '" y="' + (H - 2) + '" text-anchor="middle" font-size="10" fill="#64748b">' + esc(xLabel) + '</text>';
    // Y axis label (left, rotated)
    var yCenter = MT + gridH / 2;
    svg += '<text x="6" y="' + yCenter + '" text-anchor="middle" font-size="9" fill="#64748b" transform="rotate(-90,6,' + yCenter + ')">' + esc(yLabel) + '</text>';
    // Tick labels — X axis
    for (var nx = 1; nx <= NX; nx++) {
        var xLbl = xLabels ? (xLabels[nx - 1] || nx) : nx;
        svg += '<text x="' + (ML + (nx - 1) * cellW + cellW / 2) + '" y="' + (MT + gridH + 14) + '" text-anchor="middle" font-size="9" fill="#94a3b8">' + esc(String(xLbl)) + '</text>';
    }
    // Tick labels — Y axis
    for (var ny = 1; ny <= NY; ny++) {
        var yLbl = yLabels ? (yLabels[ny - 1] || ny) : ny;
        svg += '<text x="' + (ML - 5) + '" y="' + (MT + (NY - ny) * cellH + cellH / 2 + 3) + '" text-anchor="end" font-size="8" fill="#94a3b8">' + esc(String(yLbl)) + '</text>';
    }
    svg += '</svg>';
    // Legend
    svg += '<div style="display:flex;gap:6px;justify-content:center;flex-wrap:wrap;margin-top:4px;font-size:0.7em">';
    legend.forEach(function (l) {
        svg += '<span style="display:flex;align-items:center;gap:3px"><span style="width:10px;height:10px;border-radius:2px;background:' + l.color + ';border:1px solid #e5e7eb"></span>' + esc(l.label) + '</span>';
    });
    svg += '</div>';
    // Tooltip div
    svg += '<div id="' + matrixId + '-tip" style="display:none;position:fixed;background:white;border:1px solid #e2e8f0;border-radius:8px;padding:8px 12px;box-shadow:0 4px 12px rgba(0,0,0,0.15);z-index:400;max-width:300px;font-size:0.82em"></div>';
    // Wire tooltips after render
    var tooltipFn = opts.tooltipFn || function (items) {
        return items.map(function (item) {
            return '<div style="padding:2px 0">' + esc(item.label || item.id || "") + '</div>';
        }).join("");
    };
    setTimeout(function () {
        dots.forEach(function (dot) {
            var el = document.getElementById(dot.id);
            var tip = document.getElementById(matrixId + "-tip");
            if (!el || !tip)
                return;
            el.addEventListener("mouseenter", function (e) {
                tip.innerHTML = tooltipFn(dot.items);
                tip.style.display = "block";
                tip.style.left = (e.clientX + 12) + "px";
                tip.style.top = (e.clientY - tip.offsetHeight - 4) + "px";
            });
            el.addEventListener("mousemove", function (e) {
                tip.style.left = (e.clientX + 12) + "px";
                tip.style.top = (e.clientY - tip.offsetHeight - 4) + "px";
            });
            el.addEventListener("mouseleave", function () { tip.style.display = "none"; });
        });
    }, 50);
    svg += '</div>'; // close centering wrapper
    return svg;
}
// Persistence layer loaded separately:
// - cisotoolbox_local.js  (localStorage autosave, file I/O, snapshots — for standalone frontend apps)
// - cisotoolbox_backend.js (no-ops for autosave, file I/O for import/export — for backend apps)
