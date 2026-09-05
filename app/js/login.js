// -----------------------------------------------------------------------------
// REPLICATED from the private shared repository (shared/js/backend/login.js).
// DO NOT EDIT HERE - changes will be overwritten by the next propagation run.
// Fix the master in the shared repository and re-propagate. See CONTRIBUTING.md.
// -----------------------------------------------------------------------------
/**
 * Login page script — variante MODULES (risk, vendor, compliance, asset,
 * access). Suite mode → redirect to the Pilot login page;
 * standalone → token form.
 *
 * FACTORISATION NOTE (TS migration): login.html loads ONLY js/login.js
 * (no other <script>), so no runtime factorisation is possible between the
 * 3 variants without editing the HTML (forbidden — invariant #1).
 * The 3 variants stay standalone files:
 *   login.ts        → modules with a token form (×5)
 *   login_oauth.ts  → surface / appsec / watch (OAuth + token)
 *   login_pilot.ts  → pilot (central page, handles ?redirect=)
 */
(function () {
    "use strict";
    var currentPath = window.location.pathname.replace(/login\.html.*$/, "");
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
                // Pilot mode: redirect to Pilot login
                window.location.href = "/login.html?redirect=" + encodeURIComponent(currentPath);
                return;
            }
            if (data.standalone) {
                // Standalone mode: show token login form
                _renderTokenForm();
                return;
            }
        }).catch(function () { window.location.href = "./"; });
    }
    function _renderTokenForm() {
        var card = document.querySelector(".login-card");
        if (!card)
            return;
        var subtitle = card.querySelector(".login-subtitle");
        if (subtitle)
            subtitle.textContent = "Enter access token to sign in";
        var buttons = document.getElementById("login-buttons");
        if (buttons) {
            buttons.innerHTML =
                '<div style="margin-top:16px">' +
                    '<input type="email" id="token-email" placeholder="Email" style="width:100%;padding:10px;border:1px solid #ddd;border-radius:6px;margin-bottom:8px;font-size:0.9em;box-sizing:border-box">' +
                    '<input type="password" id="token-input" placeholder="Token" style="width:100%;padding:10px;border:1px solid #ddd;border-radius:6px;margin-bottom:12px;font-size:0.9em;box-sizing:border-box">' +
                    '<button id="token-submit" style="width:100%;padding:10px;background:#2563eb;color:white;border:none;border-radius:6px;font-size:0.9em;cursor:pointer;font-weight:600">Sign in</button>' +
                    '</div>';
            var errEl = document.getElementById("login-error");
            document.getElementById("token-submit").onclick = function () {
                var email = document.getElementById("token-email").value.trim();
                var token = document.getElementById("token-input").value;
                if (!token)
                    return;
                fetch("auth/login/token", {
                    method: "POST", credentials: "same-origin",
                    headers: { "Content-Type": "application/json" },
                    body: JSON.stringify({ token: token, email: email || "admin@local" })
                }).then(function (r) {
                    if (r.ok) {
                        window.location.href = "./";
                    }
                    else {
                        if (errEl) {
                            errEl.style.display = "block";
                            errEl.textContent = "Invalid token";
                        }
                    }
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
    }
})();
