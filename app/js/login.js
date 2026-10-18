// -----------------------------------------------------------------------------
// Generated file - do not edit.
// It is overwritten at every release; a change made here is lost.
// See CONTRIBUTING.md.
// -----------------------------------------------------------------------------
/**
 * Login page script of the backend modules.
 * Suite mode → redirect to Pilot; standalone → identity-provider buttons
 * (Entra / Google / OIDC) revealed according to the backend config, plus the
 * module's key, which opens its local account.
 *
 * Compiled to login_oauth.js; the build copies it as app/js/login.js in every
 * backend module (Pilot has its own, login_pilot).
 */
(function () {
    "use strict";
    var currentPath = window.location.pathname.replace(/login\.html.*$/, "");
    // A sign-in the server refused comes back as ?error=<code>.
    var _ERRORS = {
        awaiting_approval: "Account created and awaiting administrator approval",
        account_disabled: "Account disabled",
        domain_not_allowed: "Email domain not allowed",
        email_not_verified: "The identity provider has not verified this address"
    };
    var _error = new URLSearchParams(window.location.search).get("error");
    if (_error) {
        var _errorEl = document.getElementById("login-error");
        if (_errorEl) {
            _errorEl.style.display = "block";
            _errorEl.textContent = _ERRORS[_error] || "Sign-in failed";
        }
    }
    // Check if already logged in
    fetch("auth/me", { credentials: "same-origin" })
        .then(function (r) { if (r.ok) {
        window.location.href = "./";
        return;
    } return _showLogin(); })
        .catch(function () { _showLogin(); });
    function _showLogin() {
        return fetch("auth/providers").then(function (r) { return r.json(); }).then(function (data) {
            if (!data.auth_enabled) {
                window.location.href = "./";
                return;
            }
            if (data.central) {
                // Suite mode: delegate to the central Pilot login page
                window.location.href = "/login.html?redirect=" + encodeURIComponent(currentPath);
                return;
            }
            if (data.standalone) {
                _renderStandalone(data);
                return;
            }
        }).catch(function () { window.location.href = "./"; });
    }
    function _renderStandalone(data) {
        var anyOAuth = data.entra || data.google || data.oidc;
        var buttons = document.getElementById("login-buttons");
        if (!buttons)
            return;
        // OAuth buttons already exist in login.html but are hidden; reveal
        // only the providers the backend reports as configured.
        if (data.entra) {
            var e = document.getElementById("btn-entra");
            if (e)
                e.style.display = "";
        }
        if (data.google) {
            var g = document.getElementById("btn-google");
            if (g)
                g.style.display = "";
        }
        if (data.oidc) {
            var o = document.getElementById("btn-oidc");
            if (o)
                o.style.display = "";
            var lbl = document.getElementById("btn-oidc-label");
            if (lbl && data.oidc_label)
                lbl.textContent = data.oidc_label;
        }
        // Token login: show as a secondary option when AUTH_TOKEN is set.
        if (data.token) {
            _appendTokenForm(buttons, !!anyOAuth, !!data.token_setup);
        }
        else if (!anyOAuth) {
            var subtitle = document.querySelector(".login-subtitle");
            if (subtitle)
                subtitle.textContent = "No login provider configured";
        }
    }
    function _appendTokenForm(container, hasOAuth, askEmail) {
        var wrap = document.createElement("div");
        wrap.style.marginTop = hasOAuth ? "16px" : "0";
        if (hasOAuth) {
            wrap.innerHTML =
                '<div style="display:flex;align-items:center;gap:8px;margin:12px 0;font-size:0.78em;color:#6b7280;text-transform:uppercase;letter-spacing:.5px">' +
                    '<div style="flex:1;height:1px;background:#e5e7eb"></div>' +
                    '<span>or</span>' +
                    '<div style="flex:1;height:1px;background:#e5e7eb"></div>' +
                    '</div>';
        }
        wrap.insertAdjacentHTML("beforeend", 
        // The address only names the module's local account, the first time.
        (askEmail ? '<input type="email" id="token-email" placeholder="Email" autocomplete="email" style="width:100%;padding:10px;border:1px solid #ddd;border-radius:6px;margin-bottom:8px;font-size:0.9em;box-sizing:border-box">' : '') +
            '<input type="password" id="token-input" placeholder="Token" autocomplete="current-password" style="width:100%;padding:10px;border:1px solid #ddd;border-radius:6px;margin-bottom:12px;font-size:0.9em;box-sizing:border-box">' +
            '<button id="token-submit" style="width:100%;padding:10px;background:#2563eb;color:white;border:none;border-radius:6px;font-size:0.9em;cursor:pointer;font-weight:600">Sign in with token</button>');
        container.appendChild(wrap);
        var errEl = document.getElementById("login-error");
        document.getElementById("token-submit").onclick = function () {
            var emailEl = document.getElementById("token-email");
            var email = emailEl ? emailEl.value.trim() : "";
            var token = document.getElementById("token-input").value;
            if (!token)
                return;
            fetch("auth/login/token", {
                method: "POST", credentials: "same-origin",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({ token: token, email: email })
            }).then(function (r) {
                if (r.ok) {
                    window.location.href = "./";
                    return;
                }
                // A refused account (awaiting approval, disabled, domain) says why.
                return r.json().catch(function () { return {}; }).then(function (body) {
                    var why = (r.status === 403 || r.status === 409) && typeof body.detail === "string" ? body.detail : "Invalid token";
                    if (errEl) {
                        errEl.style.display = "block";
                        errEl.textContent = why;
                    }
                });
            }).catch(function () {
                if (errEl) {
                    errEl.style.display = "block";
                    errEl.textContent = "Connection error";
                }
            });
        };
        document.getElementById("token-input").onkeydown = function (e) {
            if (e.key === "Enter")
                document.getElementById("token-submit").click();
        };
    }
})();
