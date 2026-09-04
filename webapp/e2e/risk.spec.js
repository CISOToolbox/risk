// @ts-check
//
// End-to-end smoke journeys for the CISO Toolbox EBIOS RM module.
//
// These run against a local static server (see playwright.config.js) — the app
// has no backend, so the suite must never need one. Everything asserted here
// is about the local frontend: boot, navigation, i18n/theme preferences and
// local (localStorage) persistence.
//
// The suite is self-contained: no journey reads a dataset shipped in the
// repository. Whenever a test needs an analysis to work with, it creates one
// through the application's own UI.
//
const { test, expect } = require('@playwright/test');

const AUTOSAVE_KEY = 'ebios_rm_autosave';
// The rail also holds help-overlay triggers; only these entries switch panel.
const NAV_ITEMS = '.ct-rail-item[data-click="selectPanel"]';

/** Collect uncaught page errors for the lifetime of a test. */
function trackErrors(page) {
    const errors = [];
    page.on('pageerror', (e) => errors.push(String(e)));
    return errors;
}

/** Fresh app, no leftover state from a previous journey. */
async function openApp(page, url = '/') {
    await page.goto(url);
    await page.evaluate(() => localStorage.clear());
    await page.reload();
    await page.waitForLoadState('domcontentloaded');
    await expect(page.locator('.ct-appbar')).toBeVisible();
}

/**
 * Give the suite an analysis to work with, created the way a user would: by
 * filling the "societe" field of workshop 1 (Contexte). Returns the name
 * written, unique per run so an assertion cannot pass on stale state.
 */
async function seedAnalysis(page) {
    const org = `E2E Org ${Date.now()}`;
    await page.locator(NAV_ITEMS, { hasText: /Contexte|Context/i }).first().click();
    await expect(page.locator('#panel-context')).toHaveClass(/active/);

    const societe = page.locator('#context-fields input[type="text"]').first();
    await societe.fill(org);
    await societe.blur();
    await expect(page.locator('#header-subtitle')).toHaveText(org);
    return org;
}

test.describe('EBIOS RM — local frontend journeys', () => {

    // ── 1. Boot ────────────────────────────────────────────────────────
    test('page load: the app shell boots with no uncaught error', async ({ page }) => {
        const errors = trackErrors(page);
        await openApp(page);

        await expect(page).toHaveTitle(/Risk/i);
        await expect(page.locator('.ct-appbar')).toBeVisible();
        await expect(page.locator('.ct-rail')).toBeVisible();

        const rail = page.locator(NAV_ITEMS);
        expect(await rail.count()).toBeGreaterThanOrEqual(12);

        expect(errors, `uncaught page errors: ${errors.join(' | ')}`).toEqual([]);
    });

    // ── 2. Offline by construction ─────────────────────────────────────
    test('no request leaves the local origin (the app has no backend)', async ({ page }) => {
        const external = [];
        page.on('request', (r) => {
            const u = new URL(r.url());
            if (!['127.0.0.1', 'localhost'].includes(u.hostname) && u.protocol !== 'data:') {
                external.push(r.url());
            }
        });

        await openApp(page);
        for (const item of await page.locator(NAV_ITEMS).all()) {
            await item.click();
            await page.waitForTimeout(120);
        }

        expect(external, `unexpected external requests: ${external.join(' | ')}`).toEqual([]);
    });

    // ── 3. Navigation ──────────────────────────────────────────────────
    test('navigation: every rail entry opens its panel without error', async ({ page }) => {
        const errors = trackErrors(page);
        await openApp(page);

        const items = await page.locator(NAV_ITEMS).all();
        expect(items.length).toBeGreaterThanOrEqual(12);

        for (const item of items) {
            const label = (await item.innerText()).trim();
            await item.click();
            await page.waitForTimeout(150);
            // Whatever the module's panel strategy (#panel-x.active or #content),
            // something must be rendered in the body area.
            const body = page.locator('.tab-panel.active, #content, .ct-content').first();
            await expect(body, `empty panel after clicking "${label}"`).not.toBeEmpty();
        }

        expect(errors, `uncaught page errors: ${errors.join(' | ')}`).toEqual([]);
    });

    // ── 4. File menu ───────────────────────────────────────────────────
    test('file menu exposes open / save and a hidden file input', async ({ page }) => {
        await openApp(page);

        await page.locator('.toolbar-menu button').first().click();
        const menu = page.locator('#io-menu');
        await expect(menu).toBeVisible();
        await expect(menu.locator('.toolbar-dropdown-item')).not.toHaveCount(0);

        // The file input is the local-persistence entry point; it must exist
        // and stay hidden (it is driven by the menu, not clicked directly).
        await expect(page.locator('#file-input')).toHaveCount(1);
        await expect(page.locator('#file-input')).toBeHidden();

    });

    // ── 5. Language preference persists locally ────────────────────────
    // ct_toggleLang now opens a dropdown menu (#ct-lang-menu) of the available
    // languages; the actual switch happens on clicking an item (ct_setLang).
    // The old test clicked the trigger once and expected a direct flip — a
    // journey that went stale when the menu landed.
    test('language menu switches and the choice persists across a reload (ct_lang)', async ({ page }) => {
        await openApp(page);

        const before = await page.evaluate(() => localStorage.getItem('ct_lang'));

        // Open the menu: at least two languages (fr + en) are deployed.
        await page.locator('[data-click="ct_toggleLang"]').click();
        const menu = page.locator('#ct-lang-menu');
        await expect(menu).toBeVisible();
        expect(await menu.locator('.ct-lang-item').count()).toBeGreaterThanOrEqual(2);

        // Pick the language that is not active → an effective switch.
        await menu.locator('.ct-lang-item:not(.active)').first().click();
        await expect(page.locator('#ct-lang-menu')).toHaveCount(0);

        const after = await page.evaluate(() => localStorage.getItem('ct_lang'));
        expect(after).not.toBe(before);
        expect(['fr', 'en']).toContain(after);

        await page.reload();
        await expect(page.locator('.ct-appbar')).toBeVisible();
        expect(await page.evaluate(() => localStorage.getItem('ct_lang'))).toBe(after);
    });

    // ── 6. Theme preference persists locally ───────────────────────────
    test('theme toggle persists across a reload (localStorage ct_theme)', async ({ page }) => {
        await openApp(page);

        await page.locator('[data-click="ct_toggleTheme"]').click();
        await page.waitForTimeout(200);
        const theme = await page.evaluate(() => localStorage.getItem('ct_theme'));
        expect(['light', 'dark']).toContain(theme);

        await page.reload();
        await expect(page.locator('.ct-appbar')).toBeVisible();
        expect(await page.evaluate(() => localStorage.getItem('ct_theme'))).toBe(theme);
    });

    // ── 7. Local persistence: edit, reload, data is still there ────────
    //
    // The journey builds its own state through the UI — it must never depend
    // on a dataset shipped in the repository.
    test('local persistence: an analysis created in the app survives a reload', async ({ page }) => {
        const errors = trackErrors(page);
        await openApp(page);

        // Nothing stored yet.
        expect(await page.evaluate((k) => localStorage.getItem(k), AUTOSAVE_KEY)).toBeNull();

        const org = await seedAnalysis(page);

        const saved = await page.evaluate((k) => localStorage.getItem(k), AUTOSAVE_KEY);
        expect(saved, 'the edited analysis should be autosaved in localStorage').toBeTruthy();
        expect(saved).toContain(org);

        // Reload: the analysis must still be there, with no file and no
        // server involved.
        await page.reload();
        await expect(page.locator('.ct-appbar')).toBeVisible();

        const restored = await page.evaluate((k) => localStorage.getItem(k), AUTOSAVE_KEY);
        expect(restored).toContain(org);

        expect(errors, `uncaught page errors: ${errors.join(' | ')}`).toEqual([]);
    });

    // ── Known issue ────────────────────────────────────────────────────
    // `_checkAutoSaveBanner()` builds the "previous session found" banner and
    // inserts it with `document.body.insertBefore(banner, layoutEl)`, but
    // `.ct-body` is a child of `.ct-app`, not of `<body>` — the call throws
    // and the surrounding `catch {}` swallows it. The autosave is written and
    // survives (test 7), yet nothing ever offers to restore it. Remove the
    // `fixme` once the insertion point is fixed.
    test('the autosaved session can be restored from the banner', async ({ page }) => {
        test.fixme(true, 'the restore banner is never inserted (see comment above)');
        await openApp(page);
        const org = await seedAnalysis(page);

        await page.reload();
        await expect(page.locator('#restore-banner')).toBeVisible();
        await page.locator('#restore-banner .btn-restore').click();
        await expect(page.locator('#header-subtitle')).toHaveText(org);
    });

    // ── Module-specific: EBIOS RM workshops ────────────────────────────
    test('workshop panels: context and business values render', async ({ page }) => {
        await openApp(page);
        await seedAnalysis(page);
        await expect(page.locator('#context-fields')).not.toBeEmpty();

        await page.locator(NAV_ITEMS, { hasText: /Valeurs metier|Valeurs métier|Business value/i }).first().click();
        await expect(page.locator('#panel-vm')).toHaveClass(/active/);
        await expect(page.locator('#table-vm')).not.toBeEmpty();
    });


    // ── Regression 2026-09-03: File → Open must re-render ──────────────
    // The _loadBuffer catalog hook stayed synchronous when the original
    // became async: it swallowed both the promise AND the boolean, loadJSON
    // bailed on `if (!ok) return;` and nothing re-rendered — data loaded into
    // D, indicators and tables frozen at 0, no error. This journey opens a
    // file through the REAL input and requires the screen to reflect it.
    test('opening a JSON file renders its data (indicators included)', async ({ page }) => {
        await openApp(page);
        const analysis = {
            context: { societe: 'E2E FileOpen Co' },
            vm: [{ id: 'VM-01', nom: 'Donnees patients' }, { id: 'VM-02', nom: 'Production' }],
            bs: [{ id: 'BS-01', nom: 'Serveur HDS', vm: 'VM-01' }],
            er: [], pp: [], ss: [], sop_summary: [], sop_detail: [], measures: [],
        };
        await page.locator('#file-input').setInputFiles({
            name: 'e2e-analysis.json', mimeType: 'application/json',
            buffer: Buffer.from(JSON.stringify(analysis)),
        });
        // The dashboard VM indicator must reflect the file — this is the
        // assertion that failed: everything silently stayed at 0.
        await expect(page.locator('#indicators')).toContainText('VM', { timeout: 5000 });
        await expect
            .poll(async () => (await page.locator('#indicators').textContent()).replace(/\s+/g, ''))
            .toContain('VM2');
        await expect(page.locator('#header-subtitle')).toHaveText('E2E FileOpen Co');
        // And the VM table carries both rows.
        await page.locator(NAV_ITEMS, { hasText: /Valeurs metier|Valeurs métier|Business value/i }).first().click();
        expect(await page.locator('#table-vm input[data-s="vm"][data-f="nom"]').count()).toBe(2);
    });

    // ── Issue #2: an encrypted multi-export must be readable ───────────
    // catalogExportAll offers a .enc holding an ARRAY of analyses. The hook's
    // multi-detection only saw plaintext: the file fell through to the
    // original loader which, after decryption, assigned the array into D
    // ("0","1"… as keys) and created a corrupted catalog entry.
    const MULTI_EXPORT = [
        {
            id: 'a1', name: 'Alpha', date: '2026-01-01',
            data: {
                context: { societe: 'Alpha Co' },
                vm: [{ id: 'VM-01', nom: 'Donnees' }],
                bs: [], er: [], pp: [], ss: [], sop_summary: [], sop_detail: [], measures: [],
            },
        },
        {
            id: 'a2', name: 'Bravo', date: '2026-02-01',
            data: {
                context: { societe: 'Bravo Co' },
                vm: [], bs: [], er: [], pp: [], ss: [], sop_summary: [], sop_detail: [], measures: [],
            },
        },
    ];

    test('an encrypted multi-analysis export is readable by File → Open', async ({ page }) => {
        const errors = trackErrors(page);
        await openApp(page);

        // Build the .enc exactly like catalogExportAll: the same production
        // _encryptData, over the same array JSON.
        const encBytes = await page.evaluate(async (multi) => {
            const bytes = await _encryptData(JSON.stringify(multi), 'e2e-pass');
            return Array.from(bytes);
        }, MULTI_EXPORT);

        await page.locator('#file-input').setInputFiles({
            name: 'EBIOS_RM_toutes_analyses.enc', mimeType: 'application/octet-stream',
            buffer: Buffer.from(encBytes),
        });

        // Decryption asks for the password through the shared modal.
        await expect(page.locator('#pwd-overlay')).toHaveClass(/open/, { timeout: 5000 });
        await page.fill('#pwd-input', 'e2e-pass');
        await page.click('#pwd-ok');

        // Both analyses must join the catalog, the last one becomes active —
        // and D is an analysis object, never an array.
        await expect(page.locator('#header-subtitle')).toHaveText('Bravo Co', { timeout: 5000 });
        await expect(page.locator('#analysis-catalog')).toContainText('Alpha');
        await expect(page.locator('#analysis-catalog')).toContainText('Bravo');
        const corrupted = await page.evaluate(() => ('0' in D) || Array.isArray(D));
        expect(corrupted, 'D must never receive the export array itself').toBe(false);

        expect(errors, `uncaught page errors: ${errors.join(' | ')}`).toEqual([]);
    });

    // ── Issue #3: no stale file binding after a switch ─────────────────
    // _fileHandle/_filePwd stayed bound to the previously opened file after a
    // multi-import or an analysis switch through the catalog: Ctrl+S
    // (quickSaveJSON) then silently overwrote ANOTHER analysis's file. The
    // handle is simulated (the File System Access API is not scriptable): what
    // is tested is the invariant "switch ⇒ null binding".
    test('multi-import and catalog switch reset the file binding (_fileHandle/_filePwd)', async ({ page }) => {
        await openApp(page);

        // Simulated binding to a previously opened file.
        await page.evaluate(() => {
            window._fileHandle = { name: 'stale.json' };
            window._filePwd = 'stale-pwd';
        });

        // 1. Multi-import (plaintext) — must clear the binding.
        await page.locator('#file-input').setInputFiles({
            name: 'toutes.json', mimeType: 'application/json',
            buffer: Buffer.from(JSON.stringify(MULTI_EXPORT)),
        });
        await expect(page.locator('#header-subtitle')).toHaveText('Bravo Co', { timeout: 5000 });
        expect(await page.evaluate(() => ({ h: window._fileHandle, p: window._filePwd })))
            .toEqual({ h: null, p: null });

        // 2. Analysis switch through the catalog — same invariant.
        await page.evaluate(() => {
            window._fileHandle = { name: 'stale.json' };
            window._filePwd = 'stale-pwd';
        });
        await page.locator('.catalog-card', { hasText: 'Alpha' }).click();
        await expect(page.locator('#header-subtitle')).toHaveText('Alpha Co', { timeout: 5000 });
        expect(await page.evaluate(() => ({ h: window._fileHandle, p: window._filePwd })))
            .toEqual({ h: null, p: null });
    });

    // ── M1 (reviewer, PR #4): a malformed multi file must not corrupt D ─
    // The hook detects the multi shape on parsed[0].data, but a later item
    // may be malformed. If the multi branch ran inside the JSON.parse try, a
    // _buildRecord throw would be swallowed and execution would fall through
    // to the single loader, which Object.assign's the ARRAY into D — the very
    // issue-#2 corruption, on the non-nominal path. The branch now runs
    // outside the try, so the error surfaces and D is left untouched.
    test('a malformed multi-analysis file surfaces an error without corrupting D', async ({ page }) => {
        await openApp(page);
        const org = await seedAnalysis(page); // a clean analysis is active first

        const malformed = [
            { id: 'a1', name: 'Alpha', data: { context: { societe: 'Alpha Co' }, vm: [] } },
            { id: 'a2', name: 'Bravo' }, // no `data` — malformed
        ];
        const dialog = page.waitForEvent('dialog').then((d) => { const m = d.message(); d.dismiss(); return m; });
        await page.locator('#file-input').setInputFiles({
            name: 'broken.json', mimeType: 'application/json',
            buffer: Buffer.from(JSON.stringify(malformed)),
        });
        // The load error reaches the user through the caller's alert.
        expect(await dialog).toBeTruthy();
        // D must never have become the array (no numeric keys, not an array).
        const corrupted = await page.evaluate(() => ('0' in D) || Array.isArray(D));
        expect(corrupted, 'D must not receive the malformed export array').toBe(false);
    });

});
