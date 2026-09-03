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
    test('language toggle persists across a reload (localStorage ct_lang)', async ({ page }) => {
        await openApp(page);

        const before = await page.evaluate(() => localStorage.getItem('ct_lang'));
        await page.locator('[data-click="ct_toggleLang"]').click();
        await page.waitForTimeout(400);

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


    // ── Régression 2026-09-03 : Fichier → Ouvrir doit re-rendre ────────
    // Le hook catalogue de _loadBuffer était resté synchrone quand
    // l'original est devenu async : il avalait la promesse ET le booléen,
    // loadJSON sortait sur `if (!ok) return;` et rien ne se re-rendait —
    // données chargées dans D, indicateurs et tableaux figés à 0, aucune
    // erreur. Ce parcours ouvre un fichier par le VRAI input et exige que
    // l'écran reflète le contenu.
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
        // L'indicateur VM du tableau de bord doit refleter le fichier — c'est
        // l'assertion qui echouait : tout restait a 0, silencieusement.
        await expect(page.locator('#indicators')).toContainText('VM', { timeout: 5000 });
        await expect
            .poll(async () => (await page.locator('#indicators').textContent()).replace(/\s+/g, ''))
            .toContain('VM2');
        await expect(page.locator('#header-subtitle')).toHaveText('E2E FileOpen Co');
        // Et la table VM porte bien les deux lignes.
        await page.locator(NAV_ITEMS, { hasText: /Valeurs metier|Valeurs métier|Business value/i }).first().click();
        expect(await page.locator('#table-vm input[data-s="vm"][data-f="nom"]').count()).toBe(2);
    });

    // ── Issue #2 : l'export multi chiffré doit être relisible ──────────
    // catalogExportAll propose un .enc contenant un TABLEAU d'analyses. La
    // détection multi du hook ne voyait que le clair : le fichier tombait
    // dans le loader original qui, après déchiffrement, assignait le tableau
    // dans D ("0","1"… comme clés) et créait une entrée catalogue corrompue.
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

        // Construit le .enc exactement comme catalogExportAll : le même
        // _encryptData que la production, sur le même JSON de tableau.
        const encBytes = await page.evaluate(async (multi) => {
            const bytes = await _encryptData(JSON.stringify(multi), 'e2e-pass');
            return Array.from(bytes);
        }, MULTI_EXPORT);

        await page.locator('#file-input').setInputFiles({
            name: 'EBIOS_RM_toutes_analyses.enc', mimeType: 'application/octet-stream',
            buffer: Buffer.from(encBytes),
        });

        // Le déchiffrement demande le mot de passe via la modale partagée.
        await expect(page.locator('#pwd-overlay')).toHaveClass(/open/, { timeout: 5000 });
        await page.fill('#pwd-input', 'e2e-pass');
        await page.click('#pwd-ok');

        // Les deux analyses doivent rejoindre le catalogue, la dernière
        // devient active — et D est un objet analyse, jamais un tableau.
        await expect(page.locator('#header-subtitle')).toHaveText('Bravo Co', { timeout: 5000 });
        await expect(page.locator('#analysis-catalog')).toContainText('Alpha');
        await expect(page.locator('#analysis-catalog')).toContainText('Bravo');
        const corrupted = await page.evaluate(() => ('0' in D) || Array.isArray(D));
        expect(corrupted, 'D must never receive the export array itself').toBe(false);

        expect(errors, `uncaught page errors: ${errors.join(' | ')}`).toEqual([]);
    });

    // ── Issue #3 : plus de liaison fichier périmée après un switch ─────
    // _fileHandle/_filePwd restaient liés au fichier précédemment ouvert
    // après un import multi ou un changement d'analyse via le catalogue :
    // Ctrl+S (quickSaveJSON) écrasait alors silencieusement le fichier d'une
    // AUTRE analyse. Le handle est simulé (l'API File System Access n'est pas
    // scriptable) : ce qui est testé est l'invariant "switch ⇒ liaison nulle".
    test('multi-import and catalog switch reset the file binding (_fileHandle/_filePwd)', async ({ page }) => {
        await openApp(page);

        // Liaison simulée vers un fichier précédemment ouvert.
        await page.evaluate(() => {
            window._fileHandle = { name: 'stale.json' };
            window._filePwd = 'stale-pwd';
        });

        // 1. Import multi (en clair) — doit couper la liaison.
        await page.locator('#file-input').setInputFiles({
            name: 'toutes.json', mimeType: 'application/json',
            buffer: Buffer.from(JSON.stringify(MULTI_EXPORT)),
        });
        await expect(page.locator('#header-subtitle')).toHaveText('Bravo Co', { timeout: 5000 });
        expect(await page.evaluate(() => ({ h: window._fileHandle, p: window._filePwd })))
            .toEqual({ h: null, p: null });

        // 2. Changement d'analyse via le catalogue — même invariant.
        await page.evaluate(() => {
            window._fileHandle = { name: 'stale.json' };
            window._filePwd = 'stale-pwd';
        });
        await page.locator('.catalog-card', { hasText: 'Alpha' }).click();
        await expect(page.locator('#header-subtitle')).toHaveText('Alpha Co', { timeout: 5000 });
        expect(await page.evaluate(() => ({ h: window._fileHandle, p: window._filePwd })))
            .toEqual({ h: null, p: null });
    });

});
