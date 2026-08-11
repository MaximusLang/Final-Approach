/* ============================================================
   FINAL APPROACH
   Private Pilot Checkride Mission Control
   Vanilla JS / LocalStorage
   ============================================================ */

(() => {
    "use strict";

    /* =========================================================
       CONFIGURATION
       ========================================================= */

    const STORAGE_KEY = "finalApproachState";
    const APP_VERSION = "1.0.0";

    const DEFAULT_STATE = {
        settings: {
            checkrideDate: "2026-08-31",
            checkrideTime: "09:00",
            aircraft: "Piper Warrior",
            tailNumber: ""
        },

        mission: {
            objective: "Complete today's checkride preparation mission.",
            description: "Select a mission objective to begin.",
            priority: "primary",
            estimatedTime: "--",
            date: null,
            started: false
        },

        requirements: {
            medical: false,
            logbook: false,
            aircraft: false,
            endorsements: false,
            practical: false
        },

        modules: {
            reading: {
                completed: 0,
                total: 0
            },

            acs: {
                completed: 0,
                total: 0
            },

            prepware: {
                answered: 0,
                correct: 0
            },

            oral: {
                sessions: 0,
                readiness: 0
            }
        },

        activity: [],

        stats: {
            studyMinutes: 0,
            studyDays: [],
            streak: 0
        },

        lastSaved: null
    };


    /* =========================================================
       STATE
       ========================================================= */

    let state = loadState();

    let countdownTimer = null;
    let saveTimer = null;
    let pendingConfirmationAction = null;


    /* =========================================================
       DOM HELPERS
       ========================================================= */

    const $ = (id) => document.getElementById(id);

    const $$ = (selector, parent = document) =>
        Array.from(parent.querySelectorAll(selector));

    const exists = (id) => Boolean($(id));


    /* =========================================================
       INITIALIZATION
       ========================================================= */

    document.addEventListener("DOMContentLoaded", initialize);

    function initialize() {
        bindNavigation();
        bindHeaderActions();
        bindMissionControls();
        bindSettingsControls();
        bindRequirementControls();
        bindModuleControls();
        bindActivityControls();
        bindModalControls();
        bindKeyboardControls();

        normalizeState();
        renderEverything();
        startCountdown();

        document.body.classList.add("app-ready");
    }


    /* =========================================================
       STORAGE
       ========================================================= */

    function loadState() {
        try {
            const raw = localStorage.getItem(STORAGE_KEY);

            if (!raw) {
                return structuredClone(DEFAULT_STATE);
            }

            const parsed = JSON.parse(raw);

            return deepMerge(
                structuredClone(DEFAULT_STATE),
                parsed
            );
        } catch (error) {
            console.error("Final Approach: failed to load state.", error);
            return structuredClone(DEFAULT_STATE);
        }
    }


    function saveState() {
        try {
            state.lastSaved = new Date().toISOString();

            localStorage.setItem(
                STORAGE_KEY,
                JSON.stringify(state)
            );

            renderLastSaved();
        } catch (error) {
            console.error("Final Approach: failed to save state.", error);
            notify(
                "Unable to save local data.",
                "error"
            );
        }
    }


    function scheduleSave() {
        clearTimeout(saveTimer);

        saveTimer = setTimeout(() => {
            saveState();
        }, 150);
    }


    function deepMerge(target, source) {
        if (!source || typeof source !== "object") {
            return target;
        }

        Object.keys(source).forEach((key) => {
            if (
                source[key] &&
                typeof source[key] === "object" &&
                !Array.isArray(source[key]) &&
                target[key] &&
                typeof target[key] === "object"
            ) {
                deepMerge(target[key], source[key]);
            } else {
                target[key] = source[key];
            }
        });

        return target;
    }


    function normalizeState() {
        if (!state.mission.date) {
            state.mission.date = getDateKey();
        }

        if (!Array.isArray(state.activity)) {
            state.activity = [];
        }

        if (!Array.isArray(state.stats.studyDays)) {
            state.stats.studyDays = [];
        }

        state.modules.reading.completed = Math.max(
            0,
            Number(state.modules.reading.completed) || 0
        );

        state.modules.reading.total = Math.max(
            0,
            Number(state.modules.reading.total) || 0
        );

        state.modules.acs.completed = Math.max(
            0,
            Number(state.modules.acs.completed) || 0
        );

        state.modules.acs.total = Math.max(
            0,
            Number(state.modules.acs.total) || 0
        );

        state.modules.prepware.answered = Math.max(
            0,
            Number(state.modules.prepware.answered) || 0
        );

        state.modules.prepware.correct = Math.max(
            0,
            Number(state.modules.prepware.correct) || 0
        );

        state.modules.oral.sessions = Math.max(
            0,
            Number(state.modules.oral.sessions) || 0
        );

        state.modules.oral.readiness = clamp(
            Number(state.modules.oral.readiness) || 0,
            0,
            100
        );

        state.stats.studyMinutes = Math.max(
            0,
            Number(state.stats.studyMinutes) || 0
        );

        state.stats.streak = calculateStudyStreak();
    }


    /* =========================================================
       GENERAL UTILITIES
       ========================================================= */

    function clamp(value, min, max) {
        return Math.min(
            Math.max(value, min),
            max
        );
    }


    function percent(completed, total) {
        if (!total || total <= 0) {
            return 0;
        }

        return Math.round(
            clamp(completed / total, 0, 1) * 100
        );
    }


    function formatDate(dateString) {
        if (!dateString) {
            return "--";
        }

        const date = new Date(`${dateString}T12:00:00`);

        if (Number.isNaN(date.getTime())) {
            return "--";
        }

        return new Intl.DateTimeFormat("en-US", {
            month: "short",
            day: "numeric",
            year: "numeric"
        })
            .format(date)
            .toUpperCase();
    }


    function formatShortDate(dateString) {
        if (!dateString) {
            return "--";
        }

        const date = new Date(`${dateString}T12:00:00`);

        if (Number.isNaN(date.getTime())) {
            return "--";
        }

        return new Intl.DateTimeFormat("en-US", {
            month: "short",
            day: "numeric"
        })
            .format(date)
            .toUpperCase();
    }


    function getDateKey(date = new Date()) {
        const year = date.getFullYear();
        const month = String(date.getMonth() + 1).padStart(2, "0");
        const day = String(date.getDate()).padStart(2, "0");

        return `${year}-${month}-${day}`;
    }


    function escapeHTML(value) {
        return String(value ?? "")
            .replaceAll("&", "&amp;")
            .replaceAll("<", "&lt;")
            .replaceAll(">", "&gt;")
            .replaceAll('"', "&quot;")
            .replaceAll("'", "&#039;");
    }


    /* =========================================================
       RENDER EVERYTHING
       ========================================================= */

    function renderEverything() {
        renderSettings();
        renderMission();
        renderCountdown();
        renderOverallProgress();
        renderStatistics();
        renderModules();
        renderRequirements();
        renderReadinessMatrix();
        renderActivity();
        renderLastSaved();
        renderFooter();
    }


    /* =========================================================
       HEADER / NAVIGATION
       ========================================================= */

    function bindNavigation() {
        $$(".nav-link").forEach((button) => {
            button.addEventListener("click", () => {
                const section = button.dataset.section;

                setActiveNavigation(button);
                navigateToSection(section);
            });
        });

        if (exists("brandButton")) {
            $("brandButton").addEventListener("click", () => {
                setActiveNavigation($("navDashboard"));
                window.scrollTo({
                    top: 0,
                    behavior: "smooth"
                });
            });
        }
    }


    function setActiveNavigation(activeButton) {
        $$(".nav-link").forEach((button) => {
            button.classList.toggle(
                "active",
                button === activeButton
            );
        });
    }


    function navigateToSection(section) {
        const sectionMap = {
            dashboard: "missionSection",
            reading: "readingModule",
            acs: "acsModule",
            prepware: "prepwareModule",
            oral: "oralModule"
        };

        const target = $(sectionMap[section]);

        if (!target) {
            return;
        }

        target.scrollIntoView({
            behavior: "smooth",
            block: "start"
        });
    }


    function bindHeaderActions() {
        if (exists("settingsButton")) {
            $("settingsButton").addEventListener(
                "click",
                () => openModal("settingsModal")
            );
        }

        if (exists("notificationButton")) {
            $("notificationButton").addEventListener(
                "click",
                () => toggleNotificationPanel()
            );
        }
    }


    /* =========================================================
       COUNTDOWN
       ========================================================= */

    function startCountdown() {
        clearInterval(countdownTimer);

        renderCountdown();

        countdownTimer = setInterval(
            renderCountdown,
            1000
        );
    }


    function getCheckrideDateTime() {
        const date = state.settings.checkrideDate;

        if (!date) {
            return null;
        }

        const time = state.settings.checkrideTime || "09:00";

        const target = new Date(
            `${date}T${time}:00`
        );

        if (Number.isNaN(target.getTime())) {
            return null;
        }

        return target;
    }


    function renderCountdown() {
        const target = getCheckrideDateTime();

        if (!target) {
            setText("countdownDays", "--");
            setText("countdownHours", "--");
            setText("countdownMinutes", "--");
            setText("countdownSeconds", "--");
            setText(
                "countdownStatus",
                "CHECKRIDE DATE NOT SET"
            );
            return;
        }

        const now = new Date();
        const difference = target.getTime() - now.getTime();

        if (difference <= 0) {
            setText("countdownDays", "00");
            setText("countdownHours", "00");
            setText("countdownMinutes", "00");
            setText("countdownSeconds", "00");

            setText(
                "countdownStatus",
                difference > -86400000
                    ? "CHECKRIDE DAY"
                    : "CHECKRIDE DATE PASSED"
            );

            if (exists("countdownPanel")) {
                $("countdownPanel").classList.add("countdown-critical");
            }

            return;
        }

        if (exists("countdownPanel")) {
            $("countdownPanel").classList.remove(
                "countdown-critical"
            );
        }

        const totalSeconds = Math.floor(
            difference / 1000
        );

        const days = Math.floor(
            totalSeconds / 86400
        );

        const hours = Math.floor(
            (totalSeconds % 86400) / 3600
        );

        const minutes = Math.floor(
            (totalSeconds % 3600) / 60
        );

        const seconds = totalSeconds % 60;

        setText(
            "countdownDays",
            String(days).padStart(2, "0")
        );

        setText(
            "countdownHours",
            String(hours).padStart(2, "0")
        );

        setText(
            "countdownMinutes",
            String(minutes).padStart(2, "0")
        );

        setText(
            "countdownSeconds",
            String(seconds).padStart(2, "0")
        );

        setText(
            "countdownStatus",
            "UNTIL CHECKRIDE"
        );
    }


    /* =========================================================
       MISSION
       ========================================================= */

    function bindMissionControls() {
        if (exists("editMissionButton")) {
            $("editMissionButton").addEventListener(
                "click",
                openMissionModal
            );
        }

        if (exists("startMissionButton")) {
            $("startMissionButton").addEventListener(
                "click",
                startMission
            );
        }

        if (exists("saveMissionButton")) {
            $("saveMissionButton").addEventListener(
                "click",
                saveMission
            );
        }

        if (exists("cancelMissionButton")) {
            $("cancelMissionButton").addEventListener(
                "click",
                () => closeModal("missionModal")
            );
        }

        if (exists("closeMissionModalButton")) {
            $("closeMissionModalButton").addEventListener(
                "click",
                () => closeModal("missionModal")
            );
        }
    }


    function openMissionModal() {
        setInputValue(
            "missionObjectiveInput",
            state.mission.objective
        );

        setInputValue(
            "missionDescriptionInput",
            state.mission.description
        );

        setInputValue(
            "missionPriorityInput",
            state.mission.priority
        );

        setInputValue(
            "missionTimeInput",
            state.mission.estimatedTime
        );

        openModal("missionModal");
    }


    function saveMission() {
        const objective = getInputValue(
            "missionObjectiveInput"
        ).trim();

        const description = getInputValue(
            "missionDescriptionInput"
        ).trim();

        const priority = getInputValue(
            "missionPriorityInput"
        );

        const estimatedTime = getInputValue(
            "missionTimeInput"
        ).trim();

        state.mission.objective =
            objective ||
            "Complete today's checkride preparation mission.";

        state.mission.description =
            description ||
            "Select a mission objective to begin.";

        state.mission.priority =
            priority || "primary";

        state.mission.estimatedTime =
            estimatedTime || "--";

        state.mission.date = getDateKey();

        scheduleSave();
        renderMission();

        closeModal("missionModal");

        notify(
            "Mission brief updated.",
            "success"
        );
    }


    function startMission() {
        state.mission.started = true;
        state.mission.date = getDateKey();

        recordActivity(
            "Mission started",
            state.mission.objective
        );

        markStudyDay();

        scheduleSave();
        renderMission();
        renderStatistics();
        renderActivity();

        notify(
            "Mission clock started.",
            "success"
        );
    }


    function renderMission() {
        setText(
            "missionStatusLabel",
            state.mission.started
                ? "MISSION IN PROGRESS"
                : "MISSION ACTIVE"
        );

        setText(
            "checkrideDateDisplay",
            formatDate(
                state.settings.checkrideDate
            )
        );

        setText(
            "aircraftDisplay",
            state.settings.aircraft ||
            "AIRCRAFT NOT SET"
        );

        const checkrideDate =
            getCheckrideDateTime();

        if (checkrideDate) {
            const missionDay = Math.max(
                1,
                Math.floor(
                    (
                        new Date().getTime() -
                        new Date(
                            state.settings.checkrideDate +
                            "T00:00:00"
                        ).getTime()
                    ) /
                    86400000
                ) + 1
            );

            setText(
                "missionDayDisplay",
                `DAY ${missionDay}`
            );
        }

        setText(
            "missionDateLabel",
            formatShortDate(
                state.mission.date
            )
        );

        setText(
            "todaysMissionObjective",
            state.mission.objective
        );

        setText(
            "todaysMissionDescription",
            state.mission.description
        );

        setText(
            "todaysMissionTime",
            state.mission.estimatedTime || "--"
        );

        const priorityLabels = {
            primary: "PRIMARY OBJECTIVE",
            high: "HIGH PRIORITY",
            normal: "NORMAL PRIORITY",
            low: "LOW PRIORITY"
        };

        setText(
            "missionPriorityLabel",
            priorityLabels[state.mission.priority] ||
            "PRIMARY OBJECTIVE"
        );

        if (exists("missionPriorityIndicator")) {
            $("missionPriorityIndicator").dataset.priority =
                state.mission.priority;
        }

        const progress = calculateMissionProgress();

        setText(
            "todaysMissionProgressText",
            `${progress}%`
        );

        setProgress(
            "todaysMissionProgressBar",
            progress
        );

        setText(
            "todaysMissionTaskCount",
            `${Math.round(progress / 100 * getMissionTaskTotal())} / ${getMissionTaskTotal()}`
        );
    }


    function getMissionTaskTotal() {
        return 4;
    }


    function calculateMissionProgress() {
        const readiness = calculateReadiness();

        if (!state.mission.started) {
            return 0;
        }

        return readiness;
    }


    /* =========================================================
       SETTINGS
       ========================================================= */

    function bindSettingsControls() {
        if (exists("saveSettingsButton")) {
            $("saveSettingsButton").addEventListener(
                "click",
                saveSettings
            );
        }

        if (exists("cancelSettingsButton")) {
            $("cancelSettingsButton").addEventListener(
                "click",
                () => closeModal("settingsModal")
            );
        }

        if (exists("closeSettingsModalButton")) {
            $("closeSettingsModalButton").addEventListener(
                "click",
                () => closeModal("settingsModal")
            );
        }

        if (exists("exportDataButton")) {
            $("exportDataButton").addEventListener(
                "click",
                exportData
            );
        }

        if (exists("importDataButton")) {
            $("importDataButton").addEventListener(
                "click",
                () => {
                    if (exists("importDataInput")) {
                        $("importDataInput").click();
                    }
                }
            );
        }

        if (exists("importDataInput")) {
            $("importDataInput").addEventListener(
                "change",
                importData
            );
        }

        if (exists("resetDataButton")) {
            $("resetDataButton").addEventListener(
                "click",
                () => {
                    openConfirmation(
                        "Reset all local data?",
                        "This will erase your Final Approach progress, settings, activity, and statistics.",
                        resetData
                    );
                }
            );
        }
    }


    function renderSettings() {
        setInputValue(
            "checkrideDateInput",
            state.settings.checkrideDate
        );

        setInputValue(
            "checkrideTimeInput",
            state.settings.checkrideTime
        );

        setInputValue(
            "aircraftInput",
            state.settings.aircraft
        );

        setInputValue(
            "tailNumberInput",
            state.settings.tailNumber
        );
    }


    function saveSettings() {
        const date = getInputValue(
            "checkrideDateInput"
        );

        const time = getInputValue(
            "checkrideTimeInput"
        );

        const aircraft = getInputValue(
            "aircraftInput"
        ).trim();

        const tailNumber = getInputValue(
            "tailNumberInput"
        ).trim();

        if (!date) {
            notify(
                "Checkride date is required.",
                "error"
            );
            return;
        }

        state.settings.checkrideDate = date;
        state.settings.checkrideTime =
            time || "09:00";

        state.settings.aircraft =
            aircraft || "Piper Warrior";

        state.settings.tailNumber =
            tailNumber;

        scheduleSave();

        renderEverything();

        closeModal("settingsModal");

        notify(
            "Mission configuration saved.",
            "success"
        );
    }


    /* =========================================================
       OVERALL PROGRESS
       ========================================================= */

    function calculateOverallProgress() {
        const components = [
            getReadingProgress(),
            getAcsProgress(),
            getPrepwareProgress(),
            getOralProgress(),
            getRequirementProgress()
        ];

        return Math.round(
            components.reduce(
                (sum, value) => sum + value,
                0
            ) / components.length
        );
    }


    function calculateReadiness() {
        const components = [
            getReadingProgress(),
            getAcsProgress(),
            getPrepwareProgress(),
            getOralProgress()
        ];

        return Math.round(
            components.reduce(
                (sum, value) => sum + value,
                0
            ) / components.length
        );
    }


    function renderOverallProgress() {
        const progress =
            calculateOverallProgress();

        const totalItems =
            getTotalTrackedItems();

        const completedItems =
            getCompletedTrackedItems();

        const remainingItems =
            Math.max(
                0,
                totalItems - completedItems
            );

        setText(
            "overallProgressPercentage",
            `${progress}%`
        );

        setProgress(
            "overallProgressBar",
            progress
        );

        setText(
            "completedItemsCount",
            completedItems
        );

        setText(
            "remainingItemsCount",
            remainingItems
        );

        setText(
            "totalItemsCount",
            totalItems
        );

        let status = "NOT STARTED";

        if (progress >= 90) {
            status = "CHECKRIDE READY";
        } else if (progress >= 75) {
            status = "FINAL APPROACH";
        } else if (progress >= 50) {
            status = "BUILDING";
        } else if (progress > 0) {
            status = "IN PROGRESS";
        }

        setText(
            "overallProgressLabel",
            status
        );

        const messages = {
            "NOT STARTED":
                "Begin today's mission.",
            "IN PROGRESS":
                "Training systems are coming online.",
            "BUILDING":
                "Good. Now attack the weak areas.",
            "FINAL APPROACH":
                "You are entering final checkride preparation.",
            "CHECKRIDE READY":
                "Maintain proficiency. Do not get complacent."
        };

        setText(
            "overallProgressMessage",
            messages[status]
        );
    }


    function getTotalTrackedItems() {
        return (
            state.modules.reading.total +
            state.modules.acs.total +
            state.modules.prepware.answered +
            state.modules.oral.sessions +
            Object.keys(state.requirements).length
        );
    }


    function getCompletedTrackedItems() {
        return (
            state.modules.reading.completed +
            state.modules.acs.completed +
            state.modules.prepware.correct +
            Math.round(
                state.modules.oral.sessions *
                state.modules.oral.readiness /
                100
            ) +
            Object.values(
                state.requirements
            ).filter(Boolean).length
        );
    }


    /* =========================================================
       MODULE PROGRESS
       ========================================================= */

    function getReadingProgress() {
        return percent(
            state.modules.reading.completed,
            state.modules.reading.total
        );
    }


    function getAcsProgress() {
        return percent(
            state.modules.acs.completed,
            state.modules.acs.total
        );
    }


    function getPrepwareProgress() {
        return percent(
            state.modules.prepware.correct,
            state.modules.prepware.answered
        );
    }


    function getOralProgress() {
        return clamp(
            state.modules.oral.readiness,
            0,
            100
        );
    }


    function getRequirementProgress() {
        const values =
            Object.values(state.requirements);

        if (!values.length) {
            return 0;
        }

        return Math.round(
            values.filter(Boolean).length /
            values.length *
            100
        );
    }


    function renderModules() {
        const readingProgress =
            getReadingProgress();

        const acsProgress =
            getAcsProgress();

        const prepwareProgress =
            getPrepwareProgress();

        const oralProgress =
            getOralProgress();

        setText(
            "readingProgressPercentage",
            `${readingProgress}%`
        );

        setProgress(
            "readingProgressBar",
            readingProgress
        );

        setText(
            "readingCompletedCount",
            `${state.modules.reading.completed} / ${state.modules.reading.total} complete`
        );

        setText(
            "acsProgressPercentage",
            `${acsProgress}%`
        );

        setProgress(
            "acsProgressBar",
            acsProgress
        );

        setText(
            "acsCompletedCount",
            `${state.modules.acs.completed} / ${state.modules.acs.total} complete`
        );

        setText(
            "prepwareAccuracyPercentage",
            `${prepwareProgress}%`
        );

        setProgress(
            "prepwareProgressBar",
            prepwareProgress
        );

        setText(
            "prepwareQuestionCount",
            `${state.modules.prepware.answered} questions`
        );

        setText(
            "oralProgressPercentage",
            `${oralProgress}%`
        );

        setProgress(
            "oralProgressBar",
            oralProgress
        );

        setText(
            "oralSessionCount",
            `${state.modules.oral.sessions} sessions`
        );
    }


    function bindModuleControls() {
        const moduleButtons = {
            openReadingButton: "reading",
            openAcsButton: "acs",
            openPrepwareButton: "prepware",
            openOralButton: "oral"
        };

        Object.entries(moduleButtons).forEach(
            ([buttonId, module]) => {
                if (exists(buttonId)) {
                    $(buttonId).addEventListener(
                        "click",
                        () => openModule(module)
                    );
                }
            }
        );

        const menuButtons = {
            readingMenuButton: "reading",
            acsMenuButton: "acs",
            prepwareMenuButton: "prepware",
            oralMenuButton: "oral"
        };

        Object.entries(menuButtons).forEach(
            ([buttonId, module]) => {
                if (exists(buttonId)) {
                    $(buttonId).addEventListener(
                        "click",
                        () => openModule(module)
                    );
                }
            }
        );

        if (exists("viewAllModulesButton")) {
            $("viewAllModulesButton").addEventListener(
                "click",
                () => {
                    const target =
                        $("preparationSection");

                    if (target) {
                        target.scrollIntoView({
                            behavior: "smooth"
                        });
                    }
                }
            );
        }
    }


    function openModule(module) {
        const configs = {
            reading: {
                kicker: "KNOWLEDGE BASE",
                title: "Reading",
                description:
                    "Track the regulations, aircraft information, POH material, and other references you need before the oral.",
                button: "Configure Reading"
            },

            acs: {
                kicker: "STANDARDS",
                title: "Airman Certification Standards",
                description:
                    "Track ACS tasks and identify areas where you are not yet consistently proficient.",
                button: "Configure ACS"
            },

            prepware: {
                kicker: "KNOWLEDGE TEST",
                title: "Prepware",
                description:
                    "Record question-bank performance and use accuracy to identify knowledge gaps.",
                button: "Record Session"
            },

            oral: {
                kicker: "ORAL EXAM",
                title: "Mock Oral",
                description:
                    "Use this module to record mock oral sessions and examiner-style readiness.",
                button: "Record Oral"
            }
        };

        const config = configs[module];

        if (!config) {
            return;
        }

        setText(
            "moduleModalKicker",
            config.kicker
        );

        setText(
            "moduleModalTitle",
            config.title
        );

        const content = $("moduleModalContent");

        if (content) {
            content.innerHTML = `
                <div class="module-placeholder">
                    <p>${escapeHTML(config.description)}</p>

                    <div class="module-placeholder-stat">
                        <span>Current progress</span>
                        <strong>${getModuleProgress(module)}%</strong>
                    </div>

                    <div class="module-placeholder-actions">
                        ${
                            module === "reading"
                                ? `
                                    <label class="form-field">
                                        <span>Completed items</span>
                                        <input
                                            id="moduleReadingCompletedInput"
                                            type="number"
                                            min="0"
                                            value="${state.modules.reading.completed}"
                                        >
                                    </label>

                                    <label class="form-field">
                                        <span>Total items</span>
                                        <input
                                            id="moduleReadingTotalInput"
                                            type="number"
                                            min="0"
                                            value="${state.modules.reading.total}"
                                        >
                                    </label>
                                `
                                : ""
                        }

                        ${
                            module === "acs"
                                ? `
                                    <label class="form-field">
                                        <span>Completed tasks</span>
                                        <input
                                            id="moduleAcsCompletedInput"
                                            type="number"
                                            min="0"
                                            value="${state.modules.acs.completed}"
                                        >
                                    </label>

                                    <label class="form-field">
                                        <span>Total tasks</span>
                                        <input
                                            id="moduleAcsTotalInput"
                                            type="number"
                                            min="0"
                                            value="${state.modules.acs.total}"
                                        >
                                    </label>
                                `
                                : ""
                        }

                        ${
                            module === "prepware"
                                ? `
                                    <label class="form-field">
                                        <span>Questions answered</span>
                                        <input
                                            id="modulePrepwareAnsweredInput"
                                            type="number"
                                            min="0"
                                            value="${state.modules.prepware.answered}"
                                        >
                                    </label>

                                    <label class="form-field">
                                        <span>Correct answers</span>
                                        <input
                                            id="modulePrepwareCorrectInput"
                                            type="number"
                                            min="0"
                                            value="${state.modules.prepware.correct}"
                                        >
                                    </label>
                                `
                                : ""
                        }

                        ${
                            module === "oral"
                                ? `
                                    <label class="form-field">
                                        <span>Sessions completed</span>
                                        <input
                                            id="moduleOralSessionsInput"
                                            type="number"
                                            min="0"
                                            value="${state.modules.oral.sessions}"
                                        >
                                    </label>

                                    <label class="form-field">
                                        <span>Readiness</span>
                                        <input
                                            id="moduleOralReadinessInput"
                                            type="number"
                                            min="0"
                                            max="100"
                                            value="${state.modules.oral.readiness}"
                                        >
                                    </label>
                                `
                                : ""
                        }
                    </div>
                </div>
            `;

            const button =
                $("moduleModalPrimaryButton");

            if (button) {
                button.textContent =
                    config.button;

                button.onclick = () => {
                    saveModuleData(module);
                };
            }
        }

        openModal("moduleModal");
    }


    function getModuleProgress(module) {
        switch (module) {
            case "reading":
                return getReadingProgress();

            case "acs":
                return getAcsProgress();

            case "prepware":
                return getPrepwareProgress();

            case "oral":
                return getOralProgress();

            default:
                return 0;
        }
    }


    function saveModuleData(module) {
        switch (module) {
            case "reading": {
                const completed = Number(
                    getInputValue(
                        "moduleReadingCompletedInput"
                    )
                );

                const total = Number(
                    getInputValue(
                        "moduleReadingTotalInput"
                    )
                );

                state.modules.reading.completed =
                    Math.max(
                        0,
                        Number.isFinite(completed)
                            ? completed
                            : 0
                    );

                state.modules.reading.total =
                    Math.max(
                        0,
                        Number.isFinite(total)
                            ? total
                            : 0
                    );

                if (
                    state.modules.reading.completed >
                    state.modules.reading.total
                ) {
                    state.modules.reading.completed =
                        state.modules.reading.total;
                }

                break;
            }

            case "acs": {
                const completed = Number(
                    getInputValue(
                        "moduleAcsCompletedInput"
                    )
                );

                const total = Number(
                    getInputValue(
                        "moduleAcsTotalInput"
                    )
                );

                state.modules.acs.completed =
                    Math.max(
                        0,
                        Number.isFinite(completed)
                            ? completed
                            : 0
                    );

                state.modules.acs.total =
                    Math.max(
                        0,
                        Number.isFinite(total)
                            ? total
                            : 0
                    );

                if (
                    state.modules.acs.completed >
                    state.modules.acs.total
                ) {
                    state.modules.acs.completed =
                        state.modules.acs.total;
                }

                break;
            }

            case "prepware": {
                const answered = Number(
                    getInputValue(
                        "modulePrepwareAnsweredInput"
                    )
                );

                const correct = Number(
                    getInputValue(
                        "modulePrepwareCorrectInput"
                    )
                );

                state.modules.prepware.answered =
                    Math.max(
                        0,
                        Number.isFinite(answered)
                            ? answered
                            : 0
                    );

                state.modules.prepware.correct =
                    clamp(
                        Number.isFinite(correct)
                            ? correct
                            : 0,
                        0,
                        state.modules.prepware.answered
                    );

                break;
            }

            case "oral": {
                const sessions = Number(
                    getInputValue(
                        "moduleOralSessionsInput"
                    )
                );

                const readiness = Number(
                    getInputValue(
                        "moduleOralReadinessInput"
                    )
                );

                state.modules.oral.sessions =
                    Math.max(
                        0,
                        Number.isFinite(sessions)
                            ? sessions
                            : 0
                    );

                state.modules.oral.readiness =
                    clamp(
                        Number.isFinite(readiness)
                            ? readiness
                            : 0,
                        0,
                        100
                    );

                break;
            }
        }

        markStudyDay();
        recordActivity(
            "Training data updated",
            `${module.toUpperCase()} module`
        );

        scheduleSave();
        renderEverything();

        closeModal("moduleModal");

        notify(
            `${module.toUpperCase()} data updated.`,
            "success"
        );
    }


    /* =========================================================
       FLIGHT REQUIREMENTS
       ========================================================= */

    function bindRequirementControls() {
        const requirementNames = [
            "Medical",
            "Logbook",
            "Aircraft",
            "Endorsements",
            "Practical"
        ];

        requirementNames.forEach((name) => {
            const toggle =
                $(
                    `requirement${name}Toggle`
                );

            if (toggle) {
                toggle.addEventListener(
                    "click",
                    () => {
                        toggleRequirement(
                            name.toLowerCase()
                        );
                    }
                );
            }

            const managerToggle =
                $(
                    `manager${name}Toggle`
                );

            if (managerToggle) {
                managerToggle.addEventListener(
                    "click",
                    () => {
                        toggleRequirement(
                            name.toLowerCase()
                        );
                    }
                );
            }
        });

        if (exists("manageFlightRequirementsButton")) {
            $("manageFlightRequirementsButton")
                .addEventListener(
                    "click",
                    () => {
                        renderRequirementsManager();
                        openModal(
                            "flightRequirementsModal"
                        );
                    }
                );
        }

        if (exists("closeRequirementsButton")) {
            $("closeRequirementsButton")
                .addEventListener(
                    "click",
                    () => closeModal(
                        "flightRequirementsModal"
                    )
                );
        }

        if (exists("closeFlightRequirementsModalButton")) {
            $("closeFlightRequirementsModalButton")
                .addEventListener(
                    "click",
                    () => closeModal(
                        "flightRequirementsModal"
                    )
                );
        }
    }


    function toggleRequirement(requirement) {
        if (
            !Object.prototype.hasOwnProperty.call(
                state.requirements,
                requirement
            )
        ) {
            return;
        }

        state.requirements[requirement] =
            !state.requirements[requirement];

        const label =
            requirement.charAt(0).toUpperCase() +
            requirement.slice(1);

        recordActivity(
            state.requirements[requirement]
                ? "Requirement completed"
                : "Requirement reopened",
            label
        );

        markStudyDay();

        scheduleSave();

        renderRequirements();
        renderRequirementsManager();
        renderOverallProgress();
        renderMission();
        renderActivity();

        notify(
            state.requirements[requirement]
                ? `${label} marked complete.`
                : `${label} marked incomplete.`,
            state.requirements[requirement]
                ? "success"
                : "info"
        );
    }


    function renderRequirements() {
        const entries = Object.entries(
            state.requirements
        );

        const completed =
            entries.filter(
                ([, value]) => value
            ).length;

        setText(
            "flightRequirementsStatus",
            `${completed} / ${entries.length} COMPLETE`
        );

        entries.forEach(
            ([key, complete]) => {
                const capitalized =
                    key.charAt(0).toUpperCase() +
                    key.slice(1);

                const toggle =
                    $(
                        `requirement${capitalized}Toggle`
                    );

                const status =
                    $(
                        `requirement${capitalized}Status`
                    );

                const item =
                    $(
                        `requirement${capitalized}`
                    );

                if (toggle) {
                    toggle.setAttribute(
                        "aria-checked",
                        String(complete)
                    );

                    toggle.classList.toggle(
                        "complete",
                        complete
                    );
                }

                if (status) {
                    status.textContent =
                        complete
                            ? "COMPLETE"
                            : "PENDING";

                    status.classList.toggle(
                        "complete",
                        complete
                    );
                }

                if (item) {
                    item.classList.toggle(
                        "complete",
                        complete
                    );
                }
            }
        );
    }


    function renderRequirementsManager() {
        Object.entries(
            state.requirements
        ).forEach(([key, complete]) => {
            const capitalized =
                key.charAt(0).toUpperCase() +
                key.slice(1);

            const button =
                $(
                    `manager${capitalized}Toggle`
                );

            if (!button) {
                return;
            }

            button.setAttribute(
                "aria-pressed",
                String(complete)
            );

            button.classList.toggle(
                "active",
                complete
            );

            const label =
                button.querySelector(
                    ".toggle-label"
                );

            if (label) {
                label.textContent =
                    complete
                        ? "Complete"
                        : "Incomplete";
            }
        });
    }


    /* =========================================================
       READINESS MATRIX
       ========================================================= */

    function renderReadinessMatrix() {
        const values = {
            knowledge:
                getPrepwareProgress(),

            regulations:
                Math.round(
                    (
                        getReadingProgress() +
                        getAcsProgress()
                    ) / 2
                ),

            aircraftSystems:
                Math.round(
                    (
                        getAcsProgress() +
                        getReadingProgress()
                    ) / 2
                ),

            performance:
                getAcsProgress(),

            oral:
                getOralProgress()
        };

        Object.entries(values).forEach(
            ([key, value]) => {
                const label =
                    key.charAt(0).toUpperCase() +
                    key.slice(1);

                setText(
                    `${key}ReadinessValue`,
                    `${value}%`
                );

                setProgress(
                    `${key}ReadinessBar`,
                    value
                );

                const status =
                    value >= 90
                        ? "READY"
                        : value >= 70
                            ? "DEVELOPING"
                            : value > 0
                                ? "INCOMPLETE"
                                : "NOT STARTED";

                setText(
                    `${key}ReadinessStatus`,
                    status
                );
            }
        );
    }


    /* =========================================================
       STATISTICS
       ========================================================= */

    function renderStatistics() {
        const questions =
            state.modules.prepware.answered;

        const accuracy =
            getPrepwareProgress();

        const readiness =
            calculateReadiness();

        const studyHours =
            Math.floor(
                state.stats.studyMinutes / 60
            );

        const studyMinutes =
            state.stats.studyMinutes % 60;

        setText(
            "studyStreakValue",
            state.stats.streak
        );

        setText(
            "studyStreakUnit",
            state.stats.streak === 1
                ? "day"
                : "days"
        );

        setText(
            "studyStreakTrend",
            state.stats.streak > 0
                ? "ACTIVE"
                : "—"
        );

        setText(
            "studyTimeValue",
            studyHours > 0
                ? `${studyHours}h ${studyMinutes}m`
                : `${studyMinutes}m`
        );

        setText(
            "studyTimeUnit",
            "total"
        );

        setText(
            "studyTimeTrend",
            state.stats.studyMinutes > 0
                ? "ACTIVE"
                : "—"
        );

        setText(
            "questionsAnsweredValue",
            questions
        );

        setText(
            "questionsAnsweredUnit",
            questions === 1
                ? "answered"
                : "answered"
        );

        setText(
            "questionsAccuracyValue",
            `${accuracy}%`
        );

        setText(
            "readinessValue",
            `${readiness}%`
        );

        setText(
            "readinessStatus",
            readiness >= 90
                ? "READY"
                : readiness >= 70
                    ? "BUILDING"
                    : "DEVELOPING"
        );
    }


    function markStudyDay() {
        const today = getDateKey();

        if (
            !state.stats.studyDays.includes(
                today
            )
        ) {
            state.stats.studyDays.push(today);
        }

        state.stats.streak =
            calculateStudyStreak();
    }


    function calculateStudyStreak() {
        const days = new Set(
            state.stats.studyDays
        );

        let streak = 0;
        const cursor = new Date();

        while (
            days.has(
                getDateKey(cursor)
            )
        ) {
            streak++;

            cursor.setDate(
                cursor.getDate() - 1
            );
        }

        return streak;
    }


    /* =========================================================
       ACTIVITY
       ========================================================= */

    function bindActivityControls() {
        if (exists("clearActivityButton")) {
            $("clearActivityButton")
                .addEventListener(
                    "click",
                    () => {
                        if (!state.activity.length) {
                            return;
                        }

                        openConfirmation(
                            "Clear activity history?",
                            "This removes the activity log but does not reset your progress.",
                            clearActivity
                        );
                    }
                );
        }
    }


    function recordActivity(title, detail) {
        state.activity.unshift({
            id:
                Date.now().toString() +
                Math.random()
                    .toString(36)
                    .slice(2),

            title,
            detail,
            timestamp:
                new Date().toISOString()
        });

        state.activity =
            state.activity.slice(0, 50);
    }


    function renderActivity() {
        const list =
            $("activityList");

        if (!list) {
            return;
        }

        const empty =
            $("emptyActivityState");

        if (!state.activity.length) {
            if (empty) {
                empty.hidden = false;
            }

            list
                .querySelectorAll(
                    ".activity-entry"
                )
                .forEach(
                    (element) => element.remove()
                );

            return;
        }

        if (empty) {
            empty.hidden = true;
        }

        list
            .querySelectorAll(
                ".activity-entry"
            )
            .forEach(
                (element) => element.remove()
            );

        state.activity.forEach(
            (activity) => {
                const element =
                    document.createElement("article");

                element.className =
                    "activity-entry";

                element.innerHTML = `
                    <div class="activity-entry-marker">
                        <span></span>
                    </div>

                    <div class="activity-entry-content">
                        <strong>
                            ${escapeHTML(activity.title)}
                        </strong>

                        <span>
                            ${escapeHTML(activity.detail)}
                        </span>

                        <time datetime="${escapeHTML(activity.timestamp)}">
                            ${formatRelativeTime(activity.timestamp)}
                        </time>
                    </div>
                `;

                list.appendChild(element);
            }
        );
    }


    function formatRelativeTime(timestamp) {
        const date =
            new Date(timestamp);

        const seconds =
            Math.floor(
                (
                    Date.now() -
                    date.getTime()
                ) / 1000
            );

        if (seconds < 10) {
            return "JUST NOW";
        }

        if (seconds < 60) {
            return `${seconds}s AGO`;
        }

        const minutes =
            Math.floor(
                seconds / 60
            );

        if (minutes < 60) {
            return `${minutes}m AGO`;
        }

        const hours =
            Math.floor(
                minutes / 60
            );

        if (hours < 24) {
            return `${hours}h AGO`;
        }

        const days =
            Math.floor(
                hours / 24
            );

        return `${days}d AGO`;
    }


    function clearActivity() {
        state.activity = [];

        scheduleSave();
        renderActivity();

        closeModal("confirmationModal");

        notify(
            "Activity history cleared.",
            "info"
        );
    }


    /* =========================================================
       MODALS
       ========================================================= */

    function bindModalControls() {
        $$("[data-modal-close]").forEach(
            (element) => {
                element.addEventListener(
                    "click",
                    () => {
                        const modalId =
                            element.dataset.modalClose;

                        closeModal(modalId);
                    }
                );
            }
        );

        if (exists("closeConfirmationModalButton")) {
            $("closeConfirmationModalButton")
                .addEventListener(
                    "click",
                    () => closeModal(
                        "confirmationModal"
                    )
                );
        }

        if (exists("cancelConfirmationButton")) {
            $("cancelConfirmationButton")
                .addEventListener(
                    "click",
                    () => closeModal(
                        "confirmationModal"
                    )
                );
        }

        if (exists("confirmActionButton")) {
            $("confirmActionButton")
                .addEventListener(
                    "click",
                    () => {
                        if (
                            typeof pendingConfirmationAction ===
                            "function"
                        ) {
                            const action =
                                pendingConfirmationAction;

                            pendingConfirmationAction =
                                null;

                            action();
                        }
                    }
                );
        }

        if (exists("closeModuleModalButton")) {
            $("closeModuleModalButton")
                .addEventListener(
                    "click",
                    () => closeModal(
                        "moduleModal"
                    )
                );
        }
    }


    function openModal(id) {
        const modal = $(id);

        if (!modal) {
            return;
        }

        $$(".modal.is-open").forEach(
            (other) => {
                if (other !== modal) {
                    closeModal(other.id);
                }
            }
        );

        modal.hidden = false;

        requestAnimationFrame(() => {
            modal.classList.add("is-open");
        });

        document.body.classList.add(
            "modal-open"
        );
    }


    function closeModal(id) {
        const modal = $(id);

        if (!modal) {
            return;
        }

        modal.classList.remove("is-open");

        setTimeout(() => {
            if (!modal.classList.contains("is-open")) {
                modal.hidden = true;
            }
        }, 180);

        if (!$(".modal.is-open")) {
            document.body.classList.remove(
                "modal-open"
            );
        }
    }


    function openConfirmation(
        title,
        message,
        action
    ) {
        setText(
            "confirmationModalTitle",
            title
        );

        setText(
            "confirmationModalMessage",
            message
        );

        pendingConfirmationAction =
            action;

        openModal(
            "confirmationModal"
        );
    }


    /* =========================================================
       NOTIFICATIONS
       ========================================================= */

    function notify(
        message,
        type = "info",
        duration = 3500
    ) {
        const container =
            $("notificationContainer");

        if (!container) {
            return;
        }

        const notification =
            document.createElement("div");

        notification.className =
            `notification notification-${type}`;

        notification.setAttribute(
            "role",
            "status"
        );

        notification.innerHTML = `
            <span class="notification-indicator"></span>
            <span class="notification-message">
                ${escapeHTML(message)}
            </span>

            <button
                class="notification-dismiss"
                type="button"
                aria-label="Dismiss notification"
            >
                ×
            </button>
        `;

        container.appendChild(
            notification
        );

        requestAnimationFrame(() => {
            notification.classList.add(
                "is-visible"
            );
        });

        const dismiss =
            () => removeNotification(
                notification
            );

        notification
            .querySelector(
                ".notification-dismiss"
            )
            ?.addEventListener(
                "click",
                dismiss
            );

        setTimeout(
            dismiss,
            duration
        );
    }


    function removeNotification(
        notification
    ) {
        if (
            !notification ||
            !notification.isConnected
        ) {
            return;
        }

        notification.classList.remove(
            "is-visible"
        );

        setTimeout(
            () => notification.remove(),
            250
        );
    }


    function toggleNotificationPanel() {
        notify(
            "No new mission alerts.",
            "info"
        );
    }


    /* =========================================================
       DATA EXPORT / IMPORT
       ========================================================= */

    function exportData() {
        const exportPayload = {
            app: "Final Approach",
            version: APP_VERSION,
            exportedAt:
                new Date().toISOString(),
            state
        };

        const blob =
            new Blob(
                [
                    JSON.stringify(
                        exportPayload,
                        null,
                        2
                    )
                ],
                {
                    type:
                        "application/json"
                }
            );

        const url =
            URL.createObjectURL(blob);

        const anchor =
            document.createElement("a");

        anchor.href = url;

        anchor.download =
            `final-approach-${getDateKey()}.json`;

        document.body.appendChild(
            anchor
        );

        anchor.click();
        anchor.remove();

        URL.revokeObjectURL(url);

        notify(
            "Mission data exported.",
            "success"
        );
    }


    async function importData(event) {
        const file =
            event.target.files?.[0];

        if (!file) {
            return;
        }

        try {
            const text =
                await file.text();

            const imported =
                JSON.parse(text);

            const importedState =
                imported.state ||
                imported;

            state = deepMerge(
                structuredClone(
                    DEFAULT_STATE
                ),
                importedState
            );

            normalizeState();
            saveState();
            renderEverything();

            notify(
                "Mission data imported.",
                "success"
            );
        } catch (error) {
            console.error(
                "Final Approach: import failed.",
                error
            );

            notify(
                "Import failed. The file may be invalid.",
                "error"
            );
        }

        event.target.value = "";
    }


    function resetData() {
        localStorage.removeItem(
            STORAGE_KEY
        );

        state =
            structuredClone(
                DEFAULT_STATE
            );

        normalizeState();
        renderEverything();

        closeModal(
            "confirmationModal"
        );

        notify(
            "All local mission data reset.",
            "success"
        );
    }


    /* =========================================================
       FOOTER
       ========================================================= */

    function renderLastSaved() {
        if (!exists("lastSavedDisplay")) {
            return;
        }

        if (!state.lastSaved) {
            setText(
                "lastSavedDisplay",
                "LAST SAVED: --"
            );

            return;
        }

        const date =
            new Date(
                state.lastSaved
            );

        setText(
            "lastSavedDisplay",
            `LAST SAVED: ${date.toLocaleTimeString(
                [],
                {
                    hour: "numeric",
                    minute: "2-digit"
                }
            )}`
        );
    }


    function renderFooter() {
        setText(
            "appVersionDisplay",
            `v${APP_VERSION}`
        );
    }


    /* =========================================================
       KEYBOARD / ACCESSIBILITY
       ========================================================= */

    function bindKeyboardControls() {
        document.addEventListener(
            "keydown",
            (event) => {
                if (
                    event.key !== "Escape"
                ) {
                    return;
                }

                const openModal =
                    $(".modal.is-open");

                if (openModal) {
                    closeModal(
                        openModal.id
                    );
                }
            }
        );
    }


    /* =========================================================
       DOM VALUE HELPERS
       ========================================================= */

    function setText(
        id,
        value
    ) {
        const element = $(id);

        if (element) {
            element.textContent =
                String(value ?? "");
        }
    }


    function setInputValue(
        id,
        value
    ) {
        const element = $(id);

        if (element) {
            element.value =
                value ?? "";
        }
    }


    function getInputValue(id) {
        const element = $(id);

        return element
            ? element.value
            : "";
    }


    function setProgress(
        id,
        value
    ) {
        const element = $(id);

        if (!element) {
            return;
        }

        const normalized =
            clamp(
                Number(value) || 0,
                0,
                100
            );

        element.style.width =
            `${normalized}%`;

        element.setAttribute(
            "aria-valuenow",
            String(normalized)
        );

        element.dataset.progress =
            String(normalized);
    }


    /* =========================================================
       GLOBAL APP API
       Useful for debugging from DevTools.
       ========================================================= */

    window.FinalApproach = {
        getState: () =>
            structuredClone(state),

        save: () => {
            saveState();
            renderEverything();
        },

        reset: () => {
            openConfirmation(
                "Reset all local data?",
                "This will erase your Final Approach progress, settings, activity, and statistics.",
                resetData
            );
        },

        notify,

        refresh: renderEverything
    };

})();