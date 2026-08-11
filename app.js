/* =========================================================
   FINAL APPROACH — app.js
   FAA PPL Checkride Mission Control
   ========================================================= */

"use strict";

/* =========================================================
   CONFIGURATION
   ========================================================= */

const CONFIG = {
    checkrideDate: "2026-08-31T08:00:00",
    storageKey: "finalApproachData",
    version: 1,

    scoreTargets: {
        written: 90,
        oral: 85
    },

    prepwareCategories: [
        "Aerodynamics",
        "Aircraft Systems",
        "Flight Instruments",
        "Aircraft Performance",
        "Regulations",
        "Airspace and Airport Operations",
        "Enroute Flight and Navigation",
        "Weather",
        "Weather Service",
        "Human Factors"
    ]
};


/* =========================================================
   INITIAL STATE
   ========================================================= */

const DEFAULT_STATE = {
    version: CONFIG.version,

    tasks: {},

    prepware: {
        attempts: []
    },

    oral: {
        sessions: []
    },

    flights: {
        totalHours: 34.2,
        soloFlights: 2,
        simulatedInstrumentHours: 1,
        nightHours: 0,
        nightTakeoffs: 0,
        nightLandings: 0,
        soloXcComplete: false,
        xcDistance: 0,
        xcStops: 0
    },

    written: {
        score: 77,
        passed: true
    },

    settings: {
        lastOpened: null
    }
};


/* =========================================================
   READING / STUDY MATERIAL
   ========================================================= */

const READING_TASKS = [
    {
        id: "phak-aero",
        category: "Reading",
        title: "PHAK — Aerodynamics / Principles of Flight",
        subtitle: "Lift, drag, angle of attack, stalls, stability and controls",
        hours: 2.0,
        priority: "HIGH"
    },

    {
        id: "phak-systems",
        category: "Reading",
        title: "PHAK — Aircraft Systems",
        subtitle: "Engine, fuel, electrical, propeller, ignition and vacuum systems",
        hours: 2.5,
        priority: "HIGH"
    },

    {
        id: "phak-instruments",
        category: "Reading",
        title: "PHAK — Flight Instruments",
        subtitle: "Pitot-static, gyroscopic and magnetic instruments",
        hours: 1.5,
        priority: "HIGH"
    },

    {
        id: "phak-performance",
        category: "Reading",
        title: "PHAK — Aircraft Performance",
        subtitle: "Density altitude, performance charts, weight and balance",
        hours: 2.0,
        priority: "HIGH"
    },

    {
        id: "phak-weather",
        category: "Reading",
        title: "PHAK — Weather Theory",
        subtitle: "Atmosphere, pressure, fronts, stability, clouds and precipitation",
        hours: 2.5,
        priority: "HIGH"
    },

    {
        id: "phak-weather-services",
        category: "Reading",
        title: "PHAK — Aviation Weather Services",
        subtitle: "METARs, TAFs, PIREPs, weather briefings and products",
        hours: 2.0,
        priority: "HIGH"
    },

    {
        id: "phak-airspace",
        category: "Reading",
        title: "PHAK — Airspace",
        subtitle: "Class A–G, VFR weather minima, equipment and special-use airspace",
        hours: 1.5,
        priority: "HIGH"
    },

    {
        id: "phak-navigation",
        category: "Reading",
        title: "PHAK — Navigation",
        subtitle: "Charts, headings, courses, winds, pilotage and dead reckoning",
        hours: 2.0,
        priority: "HIGH"
    },

    {
        id: "phak-human",
        category: "Reading",
        title: "PHAK — Aeromedical / Human Factors",
        subtitle: "IMSAFE, hypoxia, hyperventilation, fatigue and spatial disorientation",
        hours: 1.25,
        priority: "MED"
    },

    {
        id: "phak-ADM",
        category: "Reading",
        title: "PHAK — Aeronautical Decision Making",
        subtitle: "Risk management, hazardous attitudes, SRM and ADM",
        hours: 1.25,
        priority: "HIGH"
    },

    {
        id: "afh-preflight",
        category: "Reading",
        title: "AFH — Preflight Procedures",
        subtitle: "Preflight inspection, cockpit organization and engine start",
        hours: 1.0,
        priority: "HIGH"
    },

    {
        id: "afh-takeoff",
        category: "Reading",
        title: "AFH — Takeoffs and Climbs",
        subtitle: "Normal, short-field and soft-field operations",
        hours: 1.25,
        priority: "HIGH"
    },

    {
        id: "afh-landings",
        category: "Reading",
        title: "AFH — Landings",
        subtitle: "Normal, short-field, soft-field and crosswind landings",
        hours: 1.5,
        priority: "HIGH"
    },

    {
        id: "afh-performance",
        category: "Reading",
        title: "AFH — Performance Maneuvers",
        subtitle: "Steep turns, slow flight and stalls",
        hours: 1.25,
        priority: "HIGH"
    },

    {
        id: "afh-navigation",
        category: "Reading",
        title: "AFH — Navigation",
        subtitle: "Pilotage, dead reckoning and cross-country procedures",
        hours: 1.5,
        priority: "HIGH"
    },

    {
        id: "afh-emergency",
        category: "Reading",
        title: "AFH — Emergency Operations",
        subtitle: "Engine failure, emergency descents, forced landings and abnormal situations",
        hours: 1.5,
        priority: "CRITICAL"
    },

    {
        id: "afh-night",
        category: "Reading",
        title: "AFH — Night Operations",
        subtitle: "Night vision, illusions, airport lighting and night emergencies",
        hours: 1.0,
        priority: "HIGH"
    },

    {
        id: "far-61",
        category: "FAR/AIM",
        title: "14 CFR Part 61",
        subtitle: "Eligibility, aeronautical experience, solo, cross-country and currency",
        hours: 1.5,
        priority: "CRITICAL"
    },

    {
        id: "far-91",
        category: "FAR/AIM",
        title: "14 CFR Part 91",
        subtitle: "Operating rules, VFR minima, equipment, weather and right-of-way",
        hours: 2.0,
        priority: "CRITICAL"
    },

    {
        id: "far-91-equipment",
        category: "FAR/AIM",
        title: "14 CFR 91.205 / 91.207 / 91.215 / 91.225",
        subtitle: "Required equipment, ELT, transponder and ADS-B",
        hours: 0.75,
        priority: "CRITICAL"
    },

    {
        id: "far-medical",
        category: "FAR/AIM",
        title: "Medical / Alcohol / Drugs",
        subtitle: "61.23, 91.17 and related medical requirements",
        hours: 0.5,
        priority: "HIGH"
    },

    {
        id: "aim-vfr",
        category: "FAR/AIM",
        title: "AIM — VFR Operations",
        subtitle: "ATC procedures, traffic patterns, communications and navigation",
        hours: 1.25,
        priority: "HIGH"
    },

    {
        id: "acs-full",
        category: "ACS",
        title: "Private Pilot ACS — Complete Review",
        subtitle: "Review every Area of Operation and applicable task",
        hours: 2.0,
        priority: "CRITICAL"
    }
];


/* =========================================================
   DAILY MISSION DATA
   ========================================================= */

const DAILY_MISSIONS = {
    "2026-08-11": [
        {
            id: "aug11-1",
            title: "Establish baseline",
            meta: "Review weaknesses from rapid-fire session",
            duration: "30 min"
        },
        {
            id: "aug11-2",
            title: "Prepware — Regulations",
            meta: "Focused quiz",
            duration: "45 min"
        },
        {
            id: "aug11-3",
            title: "Mock Oral",
            meta: "Regulations + aircraft systems",
            duration: "30 min"
        }
    ],

    "2026-08-12": [
        {
            id: "aug12-1",
            title: "PHAK — Aircraft Systems",
            meta: "Complete assigned reading",
            duration: "2.5 hr"
        },
        {
            id: "aug12-2",
            title: "Prepware — Aircraft Systems",
            meta: "50+ questions",
            duration: "45 min"
        },
        {
            id: "aug12-3",
            title: "Mock Oral",
            meta: "Aircraft systems",
            duration: "30 min"
        }
    ],

    "2026-08-13": [
        {
            id: "aug13-1",
            title: "PHAK — Flight Instruments",
            meta: "Pitot-static + gyroscopic systems",
            duration: "1.5 hr"
        },
        {
            id: "aug13-2",
            title: "AFH — Emergency Operations",
            meta: "Engine failure + forced landing",
            duration: "1.5 hr"
        },
        {
            id: "aug13-3",
            title: "Prepware — Flight Instruments",
            meta: "Focused quiz",
            duration: "45 min"
        }
    ],

    "2026-08-14": [
        {
            id: "aug14-1",
            title: "PHAK — Weather Theory",
            meta: "Stability, fronts, clouds and precipitation",
            duration: "2.5 hr"
        },
        {
            id: "aug14-2",
            title: "Prepware — Weather",
            meta: "Focused quiz",
            duration: "45 min"
        },
        {
            id: "aug14-3",
            title: "Mock Oral",
            meta: "Weather briefing scenario",
            duration: "30 min"
        }
    ],

    "2026-08-15": [
        {
            id: "aug15-1",
            title: "PHAK — Weather Services",
            meta: "METAR, TAF, PIREP and briefing products",
            duration: "2 hr"
        },
        {
            id: "aug15-2",
            title: "Prepware — Weather Service",
            meta: "Focused quiz",
            duration: "45 min"
        },
        {
            id: "aug15-3",
            title: "METAR / TAF decoding",
            meta: "Active recall",
            duration: "30 min"
        }
    ],

    "2026-08-16": [
        {
            id: "aug16-1",
            title: "PHAK — Airspace",
            meta: "Classes + VFR weather minima",
            duration: "1.5 hr"
        },
        {
            id: "aug16-2",
            title: "AIM — Airport Operations",
            meta: "Traffic patterns + communications",
            duration: "1 hr"
        },
        {
            id: "aug16-3",
            title: "Prepware — Airspace",
            meta: "Focused quiz",
            duration: "45 min"
        }
    ],

    "2026-08-17": [
        {
            id: "aug17-1",
            title: "PHAK — Navigation",
            meta: "Course, heading, wind and pilotage",
            duration: "2 hr"
        },
        {
            id: "aug17-2",
            title: "PHAK — Performance",
            meta: "Density altitude + performance charts",
            duration: "2 hr"
        },
        {
            id: "aug17-3",
            title: "Prepware — Performance",
            meta: "Focused quiz",
            duration: "45 min"
        }
    ],

    "2026-08-18": [
        {
            id: "aug18-1",
            title: "FULL PPL PRACTICE TEST",
            meta: "Prepware — simulate testing conditions",
            duration: "2 hr"
        },
        {
            id: "aug18-2",
            title: "Review every missed question",
            meta: "Find the underlying concept",
            duration: "1.5 hr"
        },
        {
            id: "aug18-3",
            title: "Mock Oral",
            meta: "Weakest areas",
            duration: "30 min"
        }
    ]
};


/* =========================================================
   ACS AREAS
   ========================================================= */

const ACS_AREAS = [
    {
        id: "area-i",
        title: "Preflight Preparation",
        tasks: [
            "Pilot Qualifications",
            "Airworthiness Requirements",
            "Weather Information",
            "Cross-Country Flight Planning",
            "National Airspace System",
            "Performance and Limitations",
            "Operation of Systems",
            "Human Factors"
        ]
    },

    {
        id: "area-ii",
        title: "Preflight Procedures",
        tasks: [
            "Preflight Inspection",
            "Cockpit Management",
            "Engine Starting",
            "Taxiing",
            "Before Takeoff Check"
        ]
    },

    {
        id: "area-iii",
        title: "Airport and Seaplane Base Operations",
        tasks: [
            "Communications",
            "Traffic Patterns",
            "Airport Signs and Markings",
            "Airport Lighting"
        ]
    },

    {
        id: "area-iv",
        title: "Takeoffs, Landings, and Go-Arounds",
        tasks: [
            "Normal Takeoff",
            "Normal Landing",
            "Short-Field Takeoff",
            "Short-Field Landing",
            "Soft-Field Takeoff",
            "Soft-Field Landing",
            "Forward Slip",
            "Go-Around"
        ]
    },

    {
        id: "area-v",
        title: "Performance and Ground Reference Maneuvers",
        tasks: [
            "Steep Turns",
            "Ground Reference Maneuvers",
            "Navigation"
        ]
    },

    {
        id: "area-vi",
        title: "Navigation",
        tasks: [
            "Pilotage and Dead Reckoning",
            "Navigation Systems and Radar Services",
            "Diversion",
            "Lost Procedures"
        ]
    },

    {
        id: "area-vii",
        title: "Slow Flight and Stalls",
        tasks: [
            "Straight-and-Level Slow Flight",
            "Power-Off Stall",
            "Power-On Stall"
        ]
    },

    {
        id: "area-viii",
        title: "Basic Instrument Maneuvers",
        tasks: [
            "Straight-and-Level",
            "Constant Airspeed Climbs",
            "Constant Airspeed Descents",
            "Turns to Headings",
            "Recovery from Unusual Flight Attitudes"
        ]
    },

    {
        id: "area-ix",
        title: "Emergency Operations",
        tasks: [
            "Emergency Descent",
            "Emergency Approach and Landing",
            "Systems and Equipment Malfunctions",
            "Emergency Equipment and Survival Gear"
        ]
    },

    {
        id: "area-x",
        title: "Night Operations",
        tasks: [
            "Night Preparation",
            "Night Takeoff and Landing",
            "Night Navigation"
        ]
    },

    {
        id: "area-xi",
        title: "Postflight Procedures",
        tasks: [
            "After Landing",
            "Parking and Securing"
        ]
    }
];


/* =========================================================
   UTILITY FUNCTIONS
   ========================================================= */

function clone(obj) {
    return JSON.parse(JSON.stringify(obj));
}


function getTodayKey() {
    const date = new Date();

    const year = date.getFullYear();
    const month = String(date.getMonth() + 1).padStart(2, "0");
    const day = String(date.getDate()).padStart(2, "0");

    return `${year}-${month}-${day}`;
}


function formatDate(date) {
    return new Intl.DateTimeFormat("en-US", {
        month: "short",
        day: "numeric",
        year: "numeric"
    }).format(date);
}


function formatHours(hours) {
    if (hours === 0) return "0h";

    if (hours < 1) {
        return `${Math.round(hours * 60)}m`;
    }

    const wholeHours = Math.floor(hours);
    const minutes = Math.round((hours - wholeHours) * 60);

    if (minutes === 0) {
        return `${wholeHours}h`;
    }

    return `${wholeHours}h ${minutes}m`;
}


function clamp(value, min = 0, max = 100) {
    return Math.min(Math.max(value, min), max);
}


function percentage(completed, total) {
    if (!total) return 0;

    return clamp(
        Math.round((completed / total) * 100)
    );
}


function escapeHTML(value) {
    return String(value)
        .replaceAll("&", "&amp;")
        .replaceAll("<", "&lt;")
        .replaceAll(">", "&gt;")
        .replaceAll('"', "&quot;")
        .replaceAll("'", "&#039;");
}


/* =========================================================
   STORAGE
   ========================================================= */

let state = loadState();


function loadState() {
    try {
        const stored = localStorage.getItem(CONFIG.storageKey);

        if (!stored) {
            return clone(DEFAULT_STATE);
        }

        const parsed = JSON.parse(stored);

        return {
            ...clone(DEFAULT_STATE),
            ...parsed,

            prepware: {
                ...clone(DEFAULT_STATE.prepware),
                ...(parsed.prepware || {})
            },

            oral: {
                ...clone(DEFAULT_STATE.oral),
                ...(parsed.oral || {})
            },

            flights: {
                ...clone(DEFAULT_STATE.flights),
                ...(parsed.flights || {})
            },

            written: {
                ...clone(DEFAULT_STATE.written),
                ...(parsed.written || {})
            },

            settings: {
                ...clone(DEFAULT_STATE.settings),
                ...(parsed.settings || {})
            }
        };
    } catch (error) {
        console.error("Final Approach: failed to load state.", error);

        return clone(DEFAULT_STATE);
    }
}


function saveState() {
    try {
        state.settings.lastOpened = new Date().toISOString();

        localStorage.setItem(
            CONFIG.storageKey,
            JSON.stringify(state)
        );
    } catch (error) {
        console.error("Final Approach: failed to save state.", error);
    }
}


/* =========================================================
   TASK REGISTRATION
   ========================================================= */

function allTasks() {
    return [
        ...READING_TASKS,

        ...ACS_AREAS.flatMap(area =>
            area.tasks.map((task, index) => ({
                id: `${area.id}-${index}`,
                category: "ACS",
                title: task,
                subtitle: area.title,
                hours: 0,
                priority: "HIGH"
            }))
        )
    ];
}


function isTaskComplete(id) {
    return state.tasks[id] === true;
}


function setTaskComplete(id, completed) {
    state.tasks[id] = Boolean(completed);

    saveState();
    renderAll();
}


/* =========================================================
   PROGRESS CALCULATIONS
   ========================================================= */

function getReadingProgress() {
    const tasks = READING_TASKS;

    const completed = tasks.filter(task =>
        isTaskComplete(task.id)
    ).length;

    return percentage(completed, tasks.length);
}


function getACSProgress() {
    const tasks = allTasks().filter(task =>
        task.category === "ACS"
    );

    const completed = tasks.filter(task =>
        isTaskComplete(task.id)
    ).length;

    return percentage(completed, tasks.length);
}


function getPrepwareProgress() {
    const attempts = state.prepware.attempts;

    if (!attempts.length) {
        return 0;
    }

    const scores = attempts.map(attempt =>
        Number(attempt.score) || 0
    );

    return clamp(
        Math.round(
            scores.reduce((sum, score) => sum + score, 0)
            / scores.length
        )
    );
}


function getOralProgress() {
    const sessions = state.oral.sessions;

    if (!sessions.length) {
        return 0;
    }

    const scores = sessions
        .map(session => Number(session.score))
        .filter(score => Number.isFinite(score));

    if (!scores.length) {
        return 0;
    }

    return clamp(
        Math.round(
            scores.reduce((sum, score) => sum + score, 0)
            / scores.length
        )
    );
}


function getFlightProgress() {
    const requirements = [
        state.flights.nightHours > 0,
        state.flights.nightTakeoffs >= 3,
        state.flights.nightLandings >= 3,
        state.flights.soloXcComplete,
        state.flights.simulatedInstrumentHours >= 3
    ];

    return percentage(
        requirements.filter(Boolean).length,
        requirements.length
    );
}


function getOverallProgress() {
    const values = [
        getReadingProgress(),
        getACSProgress(),
        getPrepwareProgress(),
        getOralProgress(),
        getFlightProgress()
    ];

    return Math.round(
        values.reduce((sum, value) => sum + value, 0)
        / values.length
    );
}


/* =========================================================
   PROGRESS THEME
   ========================================================= */

function updateProgressTheme() {
    const progress = getOverallProgress();

    let theme = "critical";

    if (progress >= 80) {
        theme = "ready";
    } else if (progress >= 60) {
        theme = "strong";
    } else if (progress >= 35) {
        theme = "developing";
    }

    document.body.dataset.progressState = theme;

    if (progress >= 100) {
        document.body.dataset.complete = "true";
    } else {
        document.body.dataset.complete = "false";
    }
}


/* =========================================================
   COUNTDOWN
   ========================================================= */

function updateCountdown() {
    const target = new Date(CONFIG.checkrideDate);
    const now = new Date();

    const difference = target - now;

    const daysElement = document.querySelector(
        "#countdownDays"
    );

    const dateElement = document.querySelector(
        "#countdownDate"
    );

    if (!daysElement) return;

    if (difference <= 0) {
        daysElement.textContent = "NOW";
    } else {
        const days = Math.ceil(
            difference / (1000 * 60 * 60 * 24)
        );

        daysElement.textContent = `T-${days}`;
    }

    if (dateElement) {
        dateElement.textContent =
            `Checkride · ${formatDate(target)}`;
    }
}


/* =========================================================
   GENERIC PROGRESS BAR
   ========================================================= */

function setProgressBar(id, value) {
    const bar = document.querySelector(`#${id}`);

    if (!bar) return;

    bar.style.width = `${clamp(value)}%`;
}


/* =========================================================
   MAIN PROGRESS UI
   ========================================================= */

function renderProgress() {
    const overall = getOverallProgress();
    const reading = getReadingProgress();
    const acs = getACSProgress();
    const prepware = getPrepwareProgress();
    const oral = getOralProgress();
    const flight = getFlightProgress();

    setProgressBar("overallProgress", overall);
    setProgressBar("readingProgress", reading);
    setProgressBar("acsProgress", acs);
    setProgressBar("prepwareProgress", prepware);
    setProgressBar("oralProgress", oral);
    setProgressBar("flightProgress", flight);

    setText("overallProgressValue", `${overall}%`);
    setText("readingProgressValue", `${reading}%`);
    setText("acsProgressValue", `${acs}%`);
    setText("prepwareProgressValue", `${prepware}%`);
    setText("oralProgressValue", `${oral}%`);
    setText("flightProgressValue", `${flight}%`);

    setText(
        "overallPercent",
        `${overall}%`
    );

    setText(
        "readingPercent",
        `${reading}%`
    );

    setText(
        "prepwarePercent",
        prepware ? `${prepware}%` : "—"
    );

    setText(
        "oralPercent",
        oral ? `${oral}%` : "—"
    );
}


/* =========================================================
   READING RENDER
   ========================================================= */

function renderReadingTasks() {
    const container = document.querySelector(
        "#readingTaskList"
    );

    if (!container) return;

    container.innerHTML = READING_TASKS.map(task => {
        const completed = isTaskComplete(task.id);

        return `
            <label class="task-item ${completed ? "completed" : ""}">
                <input
                    type="checkbox"
                    class="task-checkbox"
                    data-task-id="${escapeHTML(task.id)}"
                    ${completed ? "checked" : ""}
                >

                <div class="task-content">
                    <div class="task-title">
                        ${escapeHTML(task.title)}
                    </div>

                    <div class="task-subtitle">
                        ${escapeHTML(task.subtitle)}
                    </div>
                </div>

                <div class="task-meta">
                    <span class="task-time">
                        ${formatHours(task.hours)}
                    </span>

                    <span class="task-badge">
                        ${escapeHTML(task.priority)}
                    </span>
                </div>
            </label>
        `;
    }).join("");

    container
        .querySelectorAll("[data-task-id]")
        .forEach(input => {
            input.addEventListener("change", event => {
                const id = event.currentTarget.dataset.taskId;

                setTaskComplete(
                    id,
                    event.currentTarget.checked
                );

                showNotification(
                    event.currentTarget.checked
                        ? "Task completed"
                        : "Task reopened",
                    READING_TASKS.find(
                        task => task.id === id
                    )?.title || "Study task"
                );
            });
        });
}


/* =========================================================
   ACS RENDER
   ========================================================= */

function renderACS() {
    const container = document.querySelector(
        "#acsContainer"
    );

    if (!container) return;

    container.innerHTML = ACS_AREAS.map(area => {
        const completed = area.tasks.filter(
            (_, index) =>
                isTaskComplete(`${area.id}-${index}`)
        ).length;

        const progress = percentage(
            completed,
            area.tasks.length
        );

        return `
            <div class="accordion" data-accordion="${area.id}">
                <button
                    class="accordion-trigger"
                    type="button"
                    data-accordion-trigger="${area.id}"
                >
                    <span class="accordion-title">
                        <span class="accordion-arrow">›</span>
                        <span>
                            ${escapeHTML(area.title)}
                        </span>
                    </span>

                    <span class="status-badge ${progress === 100 ? "success" : ""}">
                        ${progress}%
                    </span>
                </button>

                <div class="accordion-content">
                    <div class="accordion-inner">
                        <div class="task-list">
                            ${area.tasks.map((task, index) => {
                                const id = `${area.id}-${index}`;
                                const done = isTaskComplete(id);

                                return `
                                    <label class="task-item ${done ? "completed" : ""}">
                                        <input
                                            type="checkbox"
                                            class="task-checkbox"
                                            data-task-id="${id}"
                                            ${done ? "checked" : ""}
                                        >

                                        <div class="task-content">
                                            <div class="task-title">
                                                ${escapeHTML(task)}
                                            </div>

                                            <div class="task-subtitle">
                                                ${escapeHTML(area.title)}
                                            </div>
                                        </div>
                                    </label>
                                `;
                            }).join("")}
                        </div>
                    </div>
                </div>
            </div>
        `;
    }).join("");

    container
        .querySelectorAll("[data-task-id]")
        .forEach(input => {
            input.addEventListener("change", event => {
                setTaskComplete(
                    event.currentTarget.dataset.taskId,
                    event.currentTarget.checked
                );
            });
        });

    container
        .querySelectorAll("[data-accordion-trigger]")
        .forEach(button => {
            button.addEventListener("click", () => {
                const id =
                    button.dataset.accordionTrigger;

                const accordion =
                    container.querySelector(
                        `[data-accordion="${id}"]`
                    );

                accordion?.classList.toggle("open");
            });
        });
}


/* =========================================================
   DAILY MISSION
   ========================================================= */

function renderDailyMission() {
    const container = document.querySelector(
        "#dailyMissionList"
    );

    if (!container) return;

    const today = getTodayKey();

    const missions =
        DAILY_MISSIONS[today] ||
        DAILY_MISSIONS["2026-08-18"];

    container.innerHTML = missions.map(
        (mission, index) => `
            <div class="mission-task">
                <div class="mission-number">
                    ${index + 1}
                </div>

                <div class="mission-task-content">
                    <div class="mission-task-title">
                        ${escapeHTML(mission.title)}
                    </div>

                    <div class="mission-task-meta">
                        <span class="mission-tag">
                            ${escapeHTML(mission.meta)}
                        </span>

                        <span class="mission-tag">
                            ${escapeHTML(mission.duration)}
                        </span>
                    </div>
                </div>

                <input
                    type="checkbox"
                    class="task-checkbox"
                    data-mission-id="${escapeHTML(mission.id)}"
                    ${state.tasks[mission.id] ? "checked" : ""}
                >
            </div>
        `
    ).join("");

    container
        .querySelectorAll("[data-mission-id]")
        .forEach(input => {
            input.addEventListener("change", event => {
                state.tasks[
                    event.currentTarget.dataset.missionId
                ] = event.currentTarget.checked;

                saveState();

                renderAll();
            });
        });
}


/* =========================================================
   PREPWARE
   ========================================================= */

function renderPrepware() {
    const container = document.querySelector(
        "#prepwareHistory"
    );

    if (!container) return;

    const attempts = state.prepware.attempts
        .slice()
        .reverse();

    if (!attempts.length) {
        container.innerHTML = `
            <div class="empty-state">
                <div>
                    <div class="empty-state-icon">◌</div>
                    <div class="empty-state-title">
                        No practice tests logged
                    </div>
                    <div class="empty-state-text">
                        Complete a Prepware test and record the score here.
                    </div>
                </div>
            </div>
        `;

        return;
    }

    container.innerHTML = attempts
        .slice(0, 10)
        .map(attempt => `
            <div class="score-row">
                <div class="score-name">
                    ${escapeHTML(attempt.category)}
                </div>

                <div class="score-date">
                    ${escapeHTML(attempt.date)}
                </div>

                <div class="score-value">
                    ${Number(attempt.score)}%
                </div>
            </div>
        `)
        .join("");
}


function addPrepwareAttempt({
    category,
    score,
    questions = null
}) {
    const normalizedScore = Number(score);

    if (
        !category ||
        !Number.isFinite(normalizedScore) ||
        normalizedScore < 0 ||
        normalizedScore > 100
    ) {
        showNotification(
            "Invalid practice result",
            "Enter a score between 0 and 100."
        );

        return false;
    }

    state.prepware.attempts.push({
        id: crypto.randomUUID
            ? crypto.randomUUID()
            : String(Date.now()),

        category,
        score: normalizedScore,
        questions,
        date: new Date().toLocaleDateString()
    });

    saveState();
    renderAll();

    showNotification(
        "Practice test recorded",
        `${category}: ${normalizedScore}%`
    );

    return true;
}


/* =========================================================
   ORAL SESSIONS
   ========================================================= */

function renderOralSessions() {
    const container = document.querySelector(
        "#oralHistory"
    );

    if (!container) return;

    const sessions = state.oral.sessions
        .slice()
        .reverse();

    if (!sessions.length) {
        container.innerHTML = `
            <div class="empty-state">
                <div>
                    <div class="empty-state-icon">◌</div>

                    <div class="empty-state-title">
                        No mock orals logged
                    </div>

                    <div class="empty-state-text">
                        Record your sessions with ChatGPT, Claude, your CFI, or another evaluator.
                    </div>
                </div>
            </div>
        `;

        return;
    }

    container.innerHTML = sessions
        .slice(0, 8)
        .map(session => `
            <div class="oral-session">
                <div class="oral-session-header">
                    <div class="oral-title">
                        ${escapeHTML(session.title)}
                    </div>

                    <div class="oral-date">
                        ${escapeHTML(session.date)}
                    </div>
                </div>

                <div class="oral-topic-list">
                    ${(session.topics || [])
                        .map(topic => `
                            <span class="oral-topic">
                                ${escapeHTML(topic)}
                            </span>
                        `)
                        .join("")}
                </div>

                ${
                    Number.isFinite(Number(session.score))
                        ? `
                            <div style="margin-top: 10px;">
                                <span class="status-badge ${
                                    session.score >= 85
                                        ? "success"
                                        : "danger"
                                }">
                                    ${Number(session.score)}%
                                </span>
                            </div>
                        `
                        : ""
                }
            </div>
        `)
        .join("");
}


function addOralSession({
    title = "Mock Oral",
    topics = [],
    score = null,
    notes = ""
}) {
    state.oral.sessions.push({
        id: crypto.randomUUID
            ? crypto.randomUUID()
            : String(Date.now()),

        title,
        topics,
        score,
        notes,

        date: new Date().toLocaleDateString()
    });

    saveState();
    renderAll();

    showNotification(
        "Mock oral recorded",
        title
    );
}


/* =========================================================
   FLIGHT REQUIREMENTS
   ========================================================= */

function renderFlightRequirements() {
    setText(
        "flightHoursValue",
        `${state.flights.totalHours.toFixed(1)} hr`
    );

    setText(
        "soloFlightsValue",
        String(state.flights.soloFlights)
    );

    setText(
        "instrumentValue",
        `${state.flights.simulatedInstrumentHours.toFixed(1)} hr`
    );

    setText(
        "nightValue",
        `${state.flights.nightHours.toFixed(1)} hr`
    );

    setText(
        "nightTakeoffsValue",
        String(state.flights.nightTakeoffs)
    );

    setText(
        "nightLandingsValue",
        String(state.flights.nightLandings)
    );

    setText(
        "soloXCValue",
        state.flights.soloXcComplete
            ? "COMPLETE"
            : "PENDING"
    );

    setText(
        "xcDistanceValue",
        `${state.flights.xcDistance} NM`
    );

    setText(
        "xcStopsValue",
        String(state.flights.xcStops)
    );
}


/* =========================================================
   WRITTEN EXAM
   ========================================================= */

function renderWritten() {
    const score = state.written.score;

    setText(
        "writtenScore",
        `${score}%`
    );

    const element = document.querySelector(
        "#writtenStatus"
    );

    if (!element) return;

    element.className =
        "status-badge " +
        (score >= 90
            ? "success"
            : score >= 80
                ? "warning"
                : "danger");

    element.textContent =
        score >= 90
            ? "Strong"
            : score >= 80
                ? "Developing"
                : "Needs work";
}


/* =========================================================
   STATISTICS
   ========================================================= */

function renderStats() {
    const readingHours = READING_TASKS.reduce(
        (sum, task) => sum + task.hours,
        0
    );

    const completedReadingHours =
        READING_TASKS
            .filter(task => isTaskComplete(task.id))
            .reduce((sum, task) => sum + task.hours, 0);

    const remainingReadingHours =
        Math.max(
            readingHours - completedReadingHours,
            0
        );

    setText(
        "readingHoursRemaining",
        formatHours(remainingReadingHours)
    );

    setText(
        "practiceTestCount",
        String(state.prepware.attempts.length)
    );

    setText(
        "oralCount",
        String(state.oral.sessions.length)
    );

    setText(
        "overallProgressStat",
        `${getOverallProgress()}%`
    );

    setText(
        "daysRemaining",
        getDaysRemaining()
    );
}


function getDaysRemaining() {
    const target = new Date(CONFIG.checkrideDate);
    const now = new Date();

    const difference = target - now;

    if (difference <= 0) {
        return "0";
    }

    return String(
        Math.ceil(
            difference /
            (1000 * 60 * 60 * 24)
        )
    );
}


/* =========================================================
   WEAK AREAS
   ========================================================= */

function renderWeakAreas() {
    const container = document.querySelector(
        "#weakAreas"
    );

    if (!container) return;

    const categoryAttempts = {};

    state.prepware.attempts.forEach(attempt => {
        if (!categoryAttempts[attempt.category]) {
            categoryAttempts[attempt.category] = [];
        }

        categoryAttempts[attempt.category]
            .push(Number(attempt.score));
    });

    const weakAreas = Object.entries(categoryAttempts)
        .map(([category, scores]) => ({
            category,

            score: Math.round(
                scores.reduce(
                    (sum, score) => sum + score,
                    0
                ) / scores.length
            )
        }))
        .filter(item => item.score < 85)
        .sort((a, b) => a.score - b.score)
        .slice(0, 5);

    if (!weakAreas.length) {
        container.innerHTML = `
            <div class="empty-state">
                <div>
                    <div class="empty-state-title">
                        No critical weak areas detected
                    </div>

                    <div class="empty-state-text">
                        Keep logging Prepware results.
                    </div>
                </div>
            </div>
        `;

        return;
    }

    container.innerHTML = weakAreas.map(area => `
        <div class="weak-area">
            <div class="weak-name">
                ${escapeHTML(area.category)}
            </div>

            <div class="weak-score">
                ${area.score}%
            </div>
        </div>
    `).join("");
}


/* =========================================================
   TEXT HELPERS
   ========================================================= */

function setText(id, value) {
    const element = document.getElementById(id);

    if (element) {
        element.textContent = value;
    }
}


/* =========================================================
   NOTIFICATIONS
   ========================================================= */

function showNotification(
    title,
    message,
    duration = 3000
) {
    const container = document.querySelector(
        "#notificationContainer"
    );

    if (!container) return;

    const notification =
        document.createElement("div");

    notification.className = "notification";

    notification.innerHTML = `
        <div class="notification-icon">
            ●
        </div>

        <div class="notification-content">
            <div class="notification-title">
                ${escapeHTML(title)}
            </div>

            <div class="notification-message">
                ${escapeHTML(message)}
            </div>
        </div>
    `;

    container.appendChild(notification);

    window.setTimeout(() => {
        notification.classList.add("removing");

        window.setTimeout(() => {
            notification.remove();
        }, 250);
    }, duration);
}


/* =========================================================
   MODALS
   ========================================================= */

function openModal(id) {
    const modal = document.querySelector(`#${id}`);

    if (!modal) return;

    modal.classList.add("open");

    document.body.style.overflow = "hidden";
}


function closeModal(id) {
    const modal = document.querySelector(`#${id}`);

    if (!modal) return;

    modal.classList.remove("open");

    document.body.style.overflow = "";
}


function setupModals() {
    document
        .querySelectorAll("[data-modal-open]")
        .forEach(button => {
            button.addEventListener("click", () => {
                openModal(
                    button.dataset.modalOpen
                );
            });
        });

    document
        .querySelectorAll("[data-modal-close]")
        .forEach(button => {
            button.addEventListener("click", () => {
                closeModal(
                    button.dataset.modalClose
                );
            });
        });

    document
        .querySelectorAll(".modal-backdrop")
        .forEach(backdrop => {
            backdrop.addEventListener("click", event => {
                if (
                    event.target === backdrop
                ) {
                    backdrop.classList.remove("open");

                    document.body.style.overflow = "";
                }
            });
        });

    document.addEventListener("keydown", event => {
        if (event.key !== "Escape") return;

        document
            .querySelectorAll(".modal-backdrop.open")
            .forEach(modal => {
                modal.classList.remove("open");
            });

        document.body.style.overflow = "";
    });
}


/* =========================================================
   DATA ENTRY FORMS
   ========================================================= */

function setupPrepwareForm() {
    const form = document.querySelector(
        "#prepwareForm"
    );

    if (!form) return;

    form.addEventListener("submit", event => {
        event.preventDefault();

        const formData =
            new FormData(form);

        const category =
            formData.get("category");

        const score =
            formData.get("score");

        const questions =
            formData.get("questions");

        if (
            addPrepwareAttempt({
                category,
                score,
                questions
            })
        ) {
            form.reset();

            const modal =
                form.closest(".modal-backdrop");

            modal?.classList.remove("open");

            document.body.style.overflow = "";
        }
    });
}


function setupOralForm() {
    const form = document.querySelector(
        "#oralForm"
    );

    if (!form) return;

    form.addEventListener("submit", event => {
        event.preventDefault();

        const formData =
            new FormData(form);

        const topicsString =
            formData.get("topics") || "";

        const topics =
            topicsString
                .split(",")
                .map(topic => topic.trim())
                .filter(Boolean);

        addOralSession({
            title:
                formData.get("title") ||
                "Mock Oral",

            topics,

            score:
                formData.get("score")
                    ? Number(formData.get("score"))
                    : null,

            notes:
                formData.get("notes") || ""
        });

        form.reset();

        const modal =
            form.closest(".modal-backdrop");

        modal?.classList.remove("open");

        document.body.style.overflow = "";
    });
}


/* =========================================================
   RESET
   ========================================================= */

function resetAllData() {
    const confirmed = window.confirm(
        "Reset ALL Final Approach progress? This cannot be undone."
    );

    if (!confirmed) return;

    state = clone(DEFAULT_STATE);

    saveState();
    renderAll();

    showNotification(
        "Progress reset",
        "Final Approach has been returned to its initial state."
    );
}


/* =========================================================
   RESET BUTTON
   ========================================================= */

function setupReset() {
    const button = document.querySelector(
        "#resetProgress"
    );

    if (!button) return;

    button.addEventListener(
        "click",
        resetAllData
    );
}


/* =========================================================
   EXPORT / IMPORT
   ========================================================= */

function exportData() {
    const data = JSON.stringify(
        state,
        null,
        2
    );

    const blob = new Blob(
        [data],
        { type: "application/json" }
    );

    const url =
        URL.createObjectURL(blob);

    const anchor =
        document.createElement("a");

    anchor.href = url;

    anchor.download =
        "final-approach-backup.json";

    anchor.click();

    URL.revokeObjectURL(url);

    showNotification(
        "Backup created",
        "Your Final Approach progress was exported."
    );
}


function setupExport() {
    const button = document.querySelector(
        "#exportData"
    );

    if (!button) return;

    button.addEventListener(
        "click",
        exportData
    );
}


/* =========================================================
   KEYBOARD SHORTCUTS
   ========================================================= */

function setupKeyboardShortcuts() {
    document.addEventListener(
        "keydown",
        event => {
            if (
                event.target.matches(
                    "input, textarea, select"
                )
            ) {
                return;
            }

            if (
                event.key.toLowerCase() === "r"
            ) {
                window.scrollTo({
                    top: 0,
                    behavior: "smooth"
                });
            }
        }
    );
}


/* =========================================================
   RENDER ALL
   ========================================================= */

function renderAll() {
    updateCountdown();
    updateProgressTheme();

    renderProgress();
    renderStats();

    renderReadingTasks();
    renderACS();
    renderDailyMission();

    renderPrepware();
    renderOralSessions();

    renderFlightRequirements();
    renderWritten();

    renderWeakAreas();
}


/* =========================================================
   INITIALIZATION
   ========================================================= */

function initializeApp() {
    setupModals();
    setupPrepwareForm();
    setupOralForm();
    setupReset();
    setupExport();
    setupKeyboardShortcuts();

    renderAll();

    window.setInterval(
        updateCountdown,
        30_000
    );

    console.log(
        "%cFINAL APPROACH",
        "color:#5ec8ff;font-weight:800;font-size:18px;"
    );

    console.log(
        "PPL checkride mission control initialized."
    );
}


/* =========================================================
   START
   ========================================================= */

if (
    document.readyState === "loading"
) {
    document.addEventListener(
        "DOMContentLoaded",
        initializeApp
    );
} else {
    initializeApp();
}


/* =========================================================
   PUBLIC DEBUG API
   =========================================================
   
   Useful while developing in GitHub Pages.
   
   Examples:
   
   FinalApproach.getState()
   FinalApproach.complete("phak-systems")
   FinalApproach.addPrepware("Weather", 92)
   FinalApproach.addOral("Weather Oral", ["METAR", "TAF"], 88)
   FinalApproach.reset()
   
   ========================================================= */

window.FinalApproach = {

    getState() {
        return clone(state);
    },

    complete(id) {
        setTaskComplete(id, true);
    },

    uncomplete(id) {
        setTaskComplete(id, false);
    },

    addPrepware(category, score, questions = null) {
        return addPrepwareAttempt({
            category,
            score,
            questions
        });
    },

    addOral(
        title,
        topics = [],
        score = null,
        notes = ""
    ) {
        addOralSession({
            title,
            topics,
            score,
            notes
        });
    },

    getProgress() {
        return {
            overall: getOverallProgress(),
            reading: getReadingProgress(),
            acs: getACSProgress(),
            prepware: getPrepwareProgress(),
            oral: getOralProgress(),
            flight: getFlightProgress()
        };
    },

    reset() {
        resetAllData();
    }
};