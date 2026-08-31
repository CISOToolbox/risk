/**
 * EBIOS RM — REST API Client Layer
 *
 * Replaces localStorage/IndexedDB with REST API calls.
 * Provides the same interface used by EBIOS_RM_catalog.js and the AI assistant.
 *
 * Load BEFORE EBIOS_RM_catalog.js:
 *   <script src="js/risk_api.js"></script>
 */

/* ── Types du client REST (effacés à l'emit) ───────────────────── */

/** Options de _fetch : RequestInit assoupli (body objet → JSON.stringify). */
interface RiskFetchOpts {
    method?: string;
    body?: unknown;
    headers?: Record<string, string>;
    credentials?: RequestCredentials;
    keepalive?: boolean;
}

/** Résumé d'analyse retourné par GET /analyses. */
interface RiskAnalysisSummary {
    id: string | number;
    name: string;
    organization?: string;
    analyst?: string;
    created_at?: string;
    updated_at?: string;
    vm_count?: number | null;
    bs_count?: number | null;
    ss_count?: number | null;
}

/** Partage d'analyse (shared_with[]). */
interface RiskShare {
    email: string;
    name?: string;
    permissions?: string[];
}

/** Analyse complète (GET /analyses/{id}). */
interface RiskAnalysis extends RiskAnalysisSummary {
    data: EbiosData | string;
    shared_with?: RiskShare[];
}

/** Utilisateur (admin, GET /users). */
interface RiskUser {
    id: string;
    name?: string;
    email?: string;
    role: string;
    ai_enabled?: string;
    picture?: string;
    last_login?: string;
}

interface RiskAPIClient {
    list(): Promise<RiskAnalysisSummary[]>;
    get(id: string | number): Promise<RiskAnalysis>;
    create(data?: { name: string; data: unknown }): Promise<RiskAnalysis>;
    update(id: string | number, data: { name?: string; data?: unknown }): Promise<RiskAnalysis>;
    _putSection(analysisId: string | number, section: string, data: unknown, keepalive?: boolean): Promise<unknown>;
    del(id: string | number): Promise<null>;
    duplicate(id: string | number): Promise<RiskAnalysis>;
    importFile(file: File): Promise<RiskAnalysis>;
    exportUrl(id: string | number): string;
    aiComplete(systemPrompt: string, userPrompt: string, provider?: string, model?: string): Promise<{ text?: string; [k: string]: unknown }>;
    aiConfig(): Promise<Record<string, unknown>>;
    aiValidateKey(provider?: string): Promise<Record<string, unknown>>;
    authMe(): Promise<RiskUser | null>;
    authProviders(): Promise<{ auth_enabled?: boolean; [k: string]: unknown }>;
    authLogout(): Promise<unknown>;
    recalculate(id: string | number): Promise<unknown>;
    stats(id: string | number): Promise<Record<string, unknown>>;
    share(id: string | number, email: string, permissions?: string[]): Promise<RiskAnalysis>;
    revokeShare(id: string | number, email: string): Promise<RiskAnalysis>;
    listUsers(): Promise<RiskUser[]>;
    updateUser(id: string, data: Record<string, unknown>): Promise<unknown>;
}

declare var RiskAPI: RiskAPIClient;

interface Window {
    RiskAPI: RiskAPIClient;
    _logout?: () => void;
    _moduleRole?: string;
}

(function() {
"use strict";

var BASE = "api";

// ═══════════════════════════════════════════════════════════════
// HTTP HELPERS
// ═══════════════════════════════════════════════════════════════

async function _fetch(url: string, opts?: RiskFetchOpts): Promise<any> {
    opts = opts || {};
    opts.headers = opts.headers || {};
    opts.credentials = "same-origin";
    if (opts.body && typeof opts.body === "object" && !(opts.body instanceof FormData)) {
        opts.headers["Content-Type"] = "application/json";
        opts.body = JSON.stringify(opts.body);
    }
    var resp = await fetch(BASE + url, opts as RequestInit);
    if (resp.status === 401) {
        var _rp = window.location.pathname.replace(/[^/]*$/, ""); window.location.href = "/login.html?redirect=" + encodeURIComponent(_rp);
        throw new Error("Not authenticated");
    }
    if (resp.status === 403) {
        var errBody = "";
        try { errBody = await resp.text(); } catch(e) {}
        if (errBody.indexOf("pending") >= 0) {
            window.location.href = "/login.html?error=pending";
            throw new Error("Account pending");
        }
    }
    if (resp.status === 204) return null;
    if (!resp.ok) {
        var errText = "";
        try { errText = await resp.text(); } catch(e) {}
        throw new Error("API " + resp.status + ": " + errText.substring(0, 200));
    }
    return resp.json();
}

// ═══════════════════════════════════════════════════════════════
// ANALYSES CRUD
// ═══════════════════════════════════════════════════════════════

window.RiskAPI = {
    // List all analyses (returns [{id, name, organization, analyst, created_at, updated_at}])
    list: function() {
        return _fetch("/analyses");
    },

    // Get full analysis by ID
    get: function(id) {
        return _fetch("/analyses/" + id);
    },

    // Create new analysis
    create: function(data) {
        return _fetch("/analyses", {
            method: "POST",
            body: data || { name: "", data: {} }
        });
    },

    // Update analysis
    update: function(id, data) {
        return _fetch("/analyses/" + id, {
            method: "PUT",
            body: data
        });
    },

    // Replace one section (delete-all + re-insert). Defined here so it closes
    // over the module-private _fetch/BASE. keepalive=true for unload flushes.
    _putSection: function(analysisId, section, data, keepalive) {
        if (keepalive) {
            return fetch(BASE + "/analyses/" + analysisId + "/" + section, {
                method: "PUT", credentials: "same-origin", keepalive: true,
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify(data)
            });
        }
        return _fetch("/analyses/" + analysisId + "/" + section, { method: "PUT", body: data });
    },

    // Delete analysis
    del: function(id) {
        return _fetch("/analyses/" + id, { method: "DELETE" });
    },

    // Duplicate analysis
    duplicate: function(id) {
        return _fetch("/analyses/" + id + "/duplicate", { method: "POST" });
    },

    // Import from JSON file
    importFile: function(file) {
        var formData = new FormData();
        formData.append("file", file);
        return _fetch("/analyses/import", {
            method: "POST",
            body: formData,
            headers: {} // Let browser set content-type for multipart
        });
    },

    // Export analysis as JSON (returns download URL)
    exportUrl: function(id) {
        return BASE + "/analyses/" + id + "/export";
    },

    // ═══════════════════════════════════════════════════════════════
    // AI PROXY
    // ═══════════════════════════════════════════════════════════════

    // Call AI completion via server proxy (no API key needed client-side)
    aiComplete: function(systemPrompt, userPrompt, provider, model) {
        return _fetch("/ai/complete", {
            method: "POST",
            body: {
                system: systemPrompt,
                user: userPrompt,
                provider: provider || (window._aiRuntime && window._aiRuntime.provider) || "anthropic",
                model: model || (window._aiRuntime && window._aiRuntime.model) || "claude-sonnet-4-6"
            }
        });
    },

    // Get AI configuration (which providers are available)
    aiConfig: function() {
        return _fetch("/ai/config");
    },

    // Validate AI key (admin)
    aiValidateKey: function(provider) {
        return _fetch("/ai/validate-key?provider=" + (provider || "anthropic"), { method: "POST" });
    },

    // ═══════════════════════════════════════════════════════════════
    // AUTH
    // ═══════════════════════════════════════════════════════════════

    authMe: function() {
        return fetch("auth/me", { credentials: "same-origin" })
            .then(function(r) { return r.ok ? r.json() : null; });
    },

    authProviders: function() {
        return fetch("auth/providers").then(function(r) { return r.json(); });
    },

    // Logout invalidates the module cookie then the Pilot cookie (shared
    // JWT). Redirects through Pilot's /auth/logout which clears the
    // pilot_token cookie and sends the user back to the login page.
    authLogout: function() {
        return fetch("auth/logout", { method: "POST", credentials: "same-origin" })
            .finally(function() { window.location.href = "/auth/logout"; });
    },

    // Recalculate all computed fields server-side
    recalculate: function(id) {
        return _fetch("/analyses/" + id + "/recalculate", { method: "POST" });
    },

    // Get analysis summary statistics
    stats: function(id) {
        return _fetch("/analyses/" + id + "/stats");
    },

    // Share analysis with another user
    share: function(id, email, permissions) {
        return _fetch("/analyses/" + id + "/share", {
            method: "POST",
            body: { email: email, permissions: permissions || ["read"] }
        });
    },

    // Revoke share
    revokeShare: function(id, email) {
        return _fetch("/analyses/" + id + "/share/" + encodeURIComponent(email), { method: "DELETE" });
    },

    // ═══════════════════════════════════════════════════════════════
    // USERS (admin)
    // ═══════════════════════════════════════════════════════════════

    listUsers: function() {
        return _fetch("/users");
    },

    updateUser: function(id, data) {
        return _fetch("/users/" + id, { method: "PUT", body: data });
    }
};

// ═══════════════════════════════════════════════════════════════
// AUTH CHECK ON LOAD
// ═══════════════════════════════════════════════════════════════

// ─── Toolbar user pill (name + admin + logout) ──────────────────
function _initAuth() {
    fetch("auth/providers").then(function(r) { return r.json(); }).then(function(data) {
        if (!data.auth_enabled) return;
        fetch("auth/me", { credentials: "same-origin" }).then(function(r): Promise<RiskUser | undefined> | undefined {
            if (!r.ok) { var _rp = window.location.pathname.replace(/[^/]*$/, ""); window.location.href = "/login.html?redirect=" + encodeURIComponent(_rp); return; }
            return r.json();
        }).then(function(user) {
            if (!user) return;
            window._currentUser = user;
            var right = document.getElementById("toolbar-right");
            if (!right) return;
            var h = "";
            h += '<span style="color:var(--ct-ink-1);font-size:var(--ct-text-label);margin:0 var(--ct-s1)">' + esc(user.name || user.email) + '</span>';
            h += '<button class="ct-text-label ct-muted ct-bg-none ct-no-border ct-clickable ct-py-1 ct-px-2" data-click="_logout" title="Sign out">&#x23FB;</button>';
            var container = document.createElement("span");
            container.className = "ct-toolbar-right";
            container.style.cssText = "display:flex;align-items:center;gap:4px;margin-left:auto";
            container.innerHTML = h;
            right.parentNode!.insertBefore(container, right);
            fetch("auth/role", { credentials: "same-origin" }).then(function(rr) {
                return rr.ok ? rr.json() : {};
            }).then(function(roleInfo: { role?: string }) {
                var role = roleInfo.role || "";
                window._moduleRole = role;
                if (role) document.body.classList.add("ct-role-" + role);
                if (user.role === "admin") document.body.classList.add("ct-role-admin");
            }).catch(function() {});
        });
    }).catch(function() {});
}
window._logout = function() {
    fetch("auth/logout", { method: "POST", credentials: "same-origin" })
        .finally(function() { window.location.href = "/auth/logout"; });
};

function _renderSharePanel(panel: { title: HTMLElement; body: HTMLElement; footer: HTMLElement }, analysis: RiskAnalysis) {
    var shared = analysis.shared_with || [];
    var h = '';

    // Add user form
    h += '<div class="ct-flex ct-gap-1 ct-mb-4">';
    h += '<input type="email" id="share-email" placeholder="Email" class="ct-flex-1 ct-py-1 ct-px-2 ct-bordered ct-r-md ct-text-meta">';
    h += '<button class="ct-btn mt-8 ct-py-1 ct-px-3 ct-text-label" data-write data-variant="primary" data-size="xs" data-click="_addShare" data-args=\'' + _da(analysis.id) + '\'>Ajouter</button>';
    h += '</div>';

    // Permission checkboxes for new user
    h += '<div id="share-perms" class="ct-flex ct-gap-3 ct-mb-4 ct-text-label">';
    ["read", "edit", "delete", "share"].forEach(function(p) {
        var labels: Record<string, string> = { read: "Lecture", edit: "Modification", "delete": "Suppression", share: "Partage" };
        h += '<label class="ct-flex ct-items-center ct-gap-1 ct-clickable"><input type="checkbox" value="' + p + '"' + (p === "read" ? " checked disabled" : "") + '> ' + labels[p] + '</label>';
    });
    h += '</div>';

    // Current shares
    if (shared.length) {
        h += '<table class="ct-w-full ct-text-meta"><thead><tr><th class="ct-ta-l">Utilisateur</th><th>Lecture</th><th>Modif.</th><th>Suppr.</th><th>Partage</th><th></th></tr></thead><tbody>';
        shared.forEach(function(s) {
            var perms = s.permissions || ["read"];
            h += '<tr>';
            h += '<td class="ct-p-1">' + esc(s.name || s.email) + '<div class="ct-text-label ct-muted">' + esc(s.email || "") + '</div></td>';
            ["read", "edit", "delete", "share"].forEach(function(p) {
                var checked = perms.indexOf(p) >= 0 ? " checked" : "";
                var disabled = p === "read" ? " disabled" : "";
                h += '<td class="ct-ta-c ct-p-1"><input type="checkbox"' + checked + disabled + ' data-change="_toggleSharePerm" data-args=\'' + _da(analysis.id, s.email, p) + '\' data-pass-el></td>';
            });
            h += '<td class="ct-p-1"><button class="ct-btn" data-variant="danger" data-size="xs" data-click="_removeShare" data-args=\'' + _da(analysis.id, s.email) + '\' data-icon>' + _icon("trash", 14) + '</button></td>';
            h += '</tr>';
        });
        h += '</tbody></table>';
    } else {
        h += '<div class="ct-muted ct-text-meta ct-ta-c ct-p-3">Aucun partage</div>';
    }

    panel.body.innerHTML = h;
}

function _addShare(analysisId: string | number) {
    var email = document.getElementById("share-email") as HTMLInputElement | null;
    if (!email || !email.value.trim()) return;
    var checkboxes = document.querySelectorAll<HTMLInputElement>("#share-perms input[type=checkbox]");
    var perms: string[] = [];
    checkboxes.forEach(function(cb) { if (cb.checked) perms.push(cb.value); });
    if (perms.indexOf("read") < 0) perms.unshift("read");

    RiskAPI.share(analysisId, email.value.trim(), perms).then(function(analysis) {
        showStatus("Partage ajoute");
        _renderSharePanel(window._aiEnsurePanel!(), analysis);
    }).catch(function(e) { alert(e.message); });
}
window._addShare = _addShare;

function _toggleSharePerm(analysisId: string | number, email: string, perm: string, el: HTMLInputElement) {
    // Collect current perms from the row checkboxes
    var row = el.closest("tr")!;
    var perms = ["read"];
    row.querySelectorAll<HTMLInputElement>("input[type=checkbox]").forEach(function(cb) {
        if (cb.checked && perms.indexOf(cb.value) < 0) perms.push(cb.value);
    });
    RiskAPI.share(analysisId, email, perms).then(function() {
        showStatus("Droits mis a jour");
    }).catch(function(e) { alert(e.message); });
}
window._toggleSharePerm = _toggleSharePerm;

function _removeShare(analysisId: string | number, email: string) {
    RiskAPI.revokeShare(analysisId, email).then(function(analysis) {
        showStatus("Partage supprime");
        _renderSharePanel(window._aiEnsurePanel!(), analysis);
    }).catch(function(e) { alert(e.message); });
}
window._removeShare = _removeShare;

if (document.readyState === "loading") document.addEventListener("DOMContentLoaded", _initAuth);
else _initAuth();

})();
