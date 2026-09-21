// -----------------------------------------------------------------------------
// Generated file - do not edit.
// It is overwritten at every release; a change made here is lost.
// See CONTRIBUTING.md.
// -----------------------------------------------------------------------------
var _ctRefCounter = 0;
// Registry for instance callbacks (registered by the host before rendering).
var _ctRefRegistry = {};
function _ctRefTagContent(uid, id, display, cfg, tagClick) {
    var href = cfg && cfg.hrefFor ? cfg.hrefFor(id) : null;
    if (href)
        return '<a href="' + esc(href) + '" target="_blank" rel="noopener" data-click="_noop" data-stop>' + display + ' ↗</a>';
    if (tagClick)
        return '<span style="cursor:pointer" data-click="ctRefTagClick" data-args=\'' + _da(uid, id) + '\' data-stop>' + display + '</span>';
    return display;
}
function ctRefSelect(uid, value, options, opts) {
    if (!uid)
        uid = "ctref" + (_ctRefCounter++);
    opts = opts || {};
    var selected = (value || "").split(",").map(function (s) { return s.trim().split(" - ")[0].trim(); }).filter(Boolean);
    var hideId = !!opts.hideId;
    var cfg = _ctRefRegistry[uid];
    // Tags
    var tags = "";
    for (var i = 0; i < options.length; i++) {
        var opt = options[i];
        if (selected.indexOf(opt.id) < 0)
            continue;
        var display = hideId ? esc(opt.label || opt.id) : (esc(opt.id) + " - " + esc(opt.label));
        var tagContent = _ctRefTagContent(uid, opt.id, display, cfg, !!opts.tagClick);
        tags += '<span class="ct-ref-tag">' + tagContent + '<span class="ct-ref-tag-x" data-click="ctRefRemove" data-args=\'' + _da(uid, opt.id) + '\' data-stop>x</span></span>';
    }
    if (!tags)
        tags = '<span class="text-muted fs-xs">' + esc(opts.emptyText || "") + '</span>';
    // Options dropdown
    var oh = "";
    var inputType = opts.single ? "radio" : "checkbox";
    for (var j = 0; j < options.length; j++) {
        var o = options[j];
        var checked = selected.indexOf(o.id) >= 0 ? "checked" : "";
        var optDisp = hideId ? esc(o.label || o.id) : (esc(o.id) + ' - ' + esc(o.label));
        oh += '<label class="ct-ref-option"><input type="' + inputType + '" name="' + uid + '" value="' + esc(o.id) + '" ' + checked + ' data-change="ctRefToggle" data-args=\'' + _da(uid) + '\' data-pass-el>' + optDisp + '</label>';
    }
    var placeholder = opts.placeholder || "";
    return '<div class="ct-ref-select" id="' + uid + '">' +
        '<div class="ct-ref-tags" data-click="ctRefOpen" data-args=\'' + _da(uid) + '\'>' + tags + '</div>' +
        '<div class="ct-ref-dropdown" id="' + uid + '-dd">' +
        '<input class="ct-ref-search" placeholder="' + esc(placeholder) + '" data-input="ctRefFilter" data-args=\'' + _da(uid) + '\' data-pass-value data-click="_noop" data-stop />' +
        '<div class="ct-ref-options">' + oh + '</div>' +
        (opts.createLabel ? '<div class="ct-ref-create" data-click="ctRefCreate" data-args=\'' + _da(uid) + '\' data-stop>+ ' + esc(opts.createLabel) + '</div>' : '') +
        '</div></div>';
}
function ctRefOpen(uid) {
    document.querySelectorAll(".ct-ref-dropdown.open").forEach(function (d) {
        if (d.id !== uid + "-dd") {
            d.classList.remove("open");
            _ctRefFlush(d);
        }
    });
    var dd = document.getElementById(uid + "-dd");
    if (!dd)
        return;
    var wasOpen = dd.classList.contains("open");
    dd.classList.toggle("open");
    if (!dd.classList.contains("open") && wasOpen) {
        _ctRefFlush(dd);
    }
    else if (dd.classList.contains("open")) {
        var search = dd.querySelector(".ct-ref-search");
        if (search) {
            search.value = "";
            ctRefFilter(uid, "");
            search.focus();
        }
    }
}
function ctRefFilter(uid, query) {
    var q = (query || "").toLowerCase();
    var dd = document.getElementById(uid + "-dd");
    if (!dd)
        return;
    dd.querySelectorAll(".ct-ref-option").forEach(function (opt) {
        opt.style.display = opt.textContent.toLowerCase().indexOf(q) >= 0 ? "" : "none";
    });
}
function ctRefToggle(uid, el) {
    var wrap = document.getElementById(uid);
    if (!wrap)
        return;
    var dd = document.getElementById(uid + "-dd");
    if (!dd)
        return;
    var checks = dd.querySelectorAll("input:checked");
    var ids = [];
    checks.forEach(function (c) { ids.push(c.value); });
    var cfg = _ctRefRegistry[uid];
    if (!cfg)
        return;
    // Call onToggle callback with selected IDs
    if (cfg.onToggle)
        cfg.onToggle(uid, ids, el);
    // Single select: refresh the tag, close immediately, and flush.
    if (cfg.single) {
        _ctRefUpdateTags(uid, ids, cfg);
        dd.classList.remove("open");
        if (cfg.onFlush)
            cfg.onFlush(uid);
        return;
    }
    // Multi-select: update tags inline, mark dirty
    _ctRefUpdateTags(uid, ids, cfg);
    wrap.dataset.dirty = "1";
}
// The tag's cross: the host's own removal when it registered one (a data
// model to update), otherwise the option is simply unticked.
function ctRefRemove(uid, optionId) {
    var cfg = _ctRefRegistry[uid];
    if (!cfg)
        return;
    if (cfg.onRemove) {
        cfg.onRemove(uid, optionId);
        return;
    }
    var dd = document.getElementById(uid + "-dd");
    if (!dd)
        return;
    var inputs = dd.querySelectorAll("input");
    for (var i = 0; i < inputs.length; i++) {
        if (inputs[i].value === optionId && inputs[i].checked) {
            inputs[i].checked = false;
            ctRefToggle(uid, inputs[i]);
            return;
        }
    }
}
function ctRefTagClick(uid, optionId) {
    var cfg = _ctRefRegistry[uid];
    if (!cfg || !cfg.tagClick)
        return;
    cfg.tagClick(uid, optionId);
}
// "+ create" row: closes the dropdown and hands the typed query to the host,
// which creates the item its own way and reselects it.
function ctRefCreate(uid) {
    var cfg = _ctRefRegistry[uid];
    if (!cfg || !cfg.onCreate)
        return;
    var dd = document.getElementById(uid + "-dd");
    var search = dd ? dd.querySelector(".ct-ref-search") : null;
    if (dd)
        dd.classList.remove("open");
    cfg.onCreate(uid, search ? search.value : "");
}
function ctRefRegister(uid, cfg) {
    _ctRefRegistry[uid] = cfg;
}
function _ctRefUpdateTags(uid, selectedIds, cfg) {
    var wrap = document.getElementById(uid);
    if (!wrap)
        return;
    var tagsEl = wrap.querySelector(".ct-ref-tags");
    if (!tagsEl)
        return;
    var html = "";
    for (var i = 0; i < selectedIds.length; i++) {
        var id = selectedIds[i];
        var label = cfg.labelFor ? cfg.labelFor(id) : "";
        var display;
        if (cfg.hideId)
            display = esc(label || id);
        else
            display = label ? (esc(id) + " - " + esc(label)) : esc(id);
        var tagContent = _ctRefTagContent(uid, id, display, cfg, !!cfg.tagClick);
        html += '<span class="ct-ref-tag">' + tagContent + '<span class="ct-ref-tag-x" data-click="ctRefRemove" data-args=\'' + _da(uid, id) + '\' data-stop>x</span></span>';
    }
    if (!html)
        html = '<span class="text-muted fs-xs">' + esc(cfg.emptyText || "") + '</span>';
    tagsEl.innerHTML = html;
}
function _ctRefFlush(dd) {
    var wrap = dd.closest(".ct-ref-select");
    if (!wrap || !wrap.dataset.dirty)
        return;
    delete wrap.dataset.dirty;
    var uid = wrap.id;
    var cfg = _ctRefRegistry[uid];
    if (cfg && cfg.onFlush)
        cfg.onFlush(uid);
}
// Close dropdowns on outside click
document.addEventListener("click", function (e) {
    if (e.target.closest(".ct-ref-select"))
        return;
    document.querySelectorAll(".ct-ref-dropdown.open").forEach(function (d) {
        d.classList.remove("open");
        _ctRefFlush(d);
    });
});
window.ctRefSelect = ctRefSelect;
window.ctRefOpen = ctRefOpen;
window.ctRefFilter = ctRefFilter;
window.ctRefToggle = ctRefToggle;
window.ctRefRemove = ctRefRemove;
window.ctRefTagClick = ctRefTagClick;
window.ctRefCreate = ctRefCreate;
window.ctRefRegister = ctRefRegister;
