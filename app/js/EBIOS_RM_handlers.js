// Handlers this page renders in data-click / data-change / data-input: the
// event dispatcher calls no other name (see _ctDeclareHandlers in
// cisotoolbox.js). tests/test_dispatch_allowlist.py fails on a missing one.
_ctDeclareHandlers([
    "_addShare", "_aiAccept", "_aiAcceptAll", "_aiAcceptResidual", "_aiGenSOP", "_aiIgnore",
    "_aiResidualForSS", "_aiRestart", "_aiRunSOP", "_aiRunSuggest", "_aiToggleIgnoreKeep",
    "_effBadgeClick", "_logout", "_newOVFor", "_newSRFor", "_removeShare", "_setContextField",
    "_setGravityField", "_setRiskMatrix", "_setSOPPhase", "_setSOPPhaseText", "_toggleErGraviteCat",
    "_toggleSharePerm", "_triggerExcelInput", "_updateErGraviteCat", "_updateFieldFromEl",
    "addEcoMeasure", "addRow", "addSOP", "addSOPMeasure", "addSOPPhase", "addSocleMeasure",
    "catalogCreate", "catalogDelete", "catalogDuplicate", "catalogExport", "catalogOpen",
    "catalogRename", "catalogSearch", "delRow", "delSOPPhase", "exportExcel", "exportSynthesisPPTX",
    "exportWordReport", "importExcel", "importVendorPP", "moveSOPPhase", "renderSynthesis",
    "selectPanel", "setGravityLevels", "setSocleType", "suggestEcoMeasure", "suggestFor",
    "suggestSOPMeasure", "suggestSocleMeasure", "toggleDICT", "triggerImportVendor", "updateField"
]);
