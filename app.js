const courseInput = document.getElementById("course-input");
const addButton = document.getElementById("add");
const buildButton = document.getElementById("build");
const schedulesEl = document.getElementById("schedules");
const statusEl = document.getElementById("status");
const summaryEl = document.getElementById("summary");
const selectionListEl = document.getElementById("selection-list");
const scheduleSelectEl = document.getElementById("schedule-select");
const calendarTimesEl = document.getElementById("calendar-times");
const calendarGridEl = document.getElementById("calendar-grid");
const suggestionsEl = document.getElementById("course-suggestions");
const webtreePreviewEl = document.getElementById("webtree-preview");
const webtreeSummaryEl = document.getElementById("webtree-summary");

let catalog = [];
let selections = [];
let selectionId = 0;
let latestSchedules = [];
let dragSourceId = null;

const DAYS = ["M", "T", "W", "R", "F"];
const DAY_LABELS = { M: "Mon", T: "Tue", W: "Wed", R: "Thu", F: "Fri" };
const MAX_SCHEDULES = 50;
const MAX_SEARCH = 4000;

const normalize = (value) => value.toLowerCase().replace(/\s+/g, " ").trim();

const parseTimeRange = (time) => {
  if (!time || time.toUpperCase() === "TBA") return null;
  const parts = time.split("-");
  if (parts.length !== 2) return null;

  const normalizeChunk = (chunk, fallbackMeridian) => {
    const trimmed = chunk.trim();
    if (/AM|PM/i.test(trimmed)) return trimmed;
    return fallbackMeridian ? `${trimmed} ${fallbackMeridian}` : trimmed;
  };

  const parseTime = (chunk) => {
    const match = chunk.trim().match(/(\d{1,2}):(\d{2})\s*(AM|PM)/i);
    if (!match) return null;
    let hour = Number(match[1]);
    const minute = Number(match[2]);
    const meridian = match[3].toUpperCase();
    if (meridian === "PM" && hour !== 12) hour += 12;
    if (meridian === "AM" && hour === 12) hour = 0;
    return hour * 60 + minute;
  };

  const endChunk = parts[1].trim();
  const endMeridianMatch = endChunk.match(/(AM|PM)/i);
  const endMeridian = endMeridianMatch ? endMeridianMatch[1].toUpperCase() : null;
  const startChunk = normalizeChunk(parts[0], endMeridian);

  const start = parseTime(startChunk);
  const end = parseTime(endChunk);
  if (start === null || end === null) return null;
  return { start, end };
};

const expandDays = (days) => {
  if (!days || days.toUpperCase() === "TBA") return [];
  return DAYS.filter((day) => days.includes(day));
};

const getPrimaryMeeting = (course) => {
  return course.meetings[0];
};

const baseCourse = (courseSection) => {
  return courseSection.split("-").slice(0, 2).join("-");
};

const conflictBetween = (courseA, courseB) => {
  const mA = getPrimaryMeeting(courseA);
  const mB = getPrimaryMeeting(courseB);

  const daysA = expandDays(mA.days);
  const daysB = expandDays(mB.days);
  const shared = daysA.filter((day) => daysB.includes(day));
  if (!shared.length) return null;

  const timeA = parseTimeRange(mA.time);
  const timeB = parseTimeRange(mB.time);
  if (!timeA || !timeB) return null;

  const overlaps = timeA.start < timeB.end && timeB.start < timeA.end;
  if (!overlaps) return null;

  return {
    days: shared.join(""),
    a: courseA,
    b: courseB,
  };
};

const buildMatches = (selectionList) => {
  return selectionList.map((selection) => {
    const isCrn = /^\d+$/.test(selection.raw);
    const needle = normalize(selection.raw);
    const matches = catalog.filter((course) => {
      if (isCrn) return String(course.crn) === selection.raw;

      const sectionMatch =
        normalize(course.courseSection) === needle;

      const titleMatch =
        normalize(course.title) === needle;

      const fuzzyTitleMatch =
        normalize(course.title).includes(needle);

      return sectionMatch || titleMatch || fuzzyTitleMatch;
    });
    return { selection, matches };
  });
};

const summarizeConflicts = (schedule) => {
  const conflicts = [];
  for (let i = 0; i < schedule.length; i += 1) {
    for (let j = i + 1; j < schedule.length; j += 1) {
      const conflict = conflictBetween(schedule[i], schedule[j]);
      if (conflict) conflicts.push(conflict);
    }
  }
  return conflicts;
};

const hasConflict = (schedule, course) =>
  schedule.some((existing) => {
    if (conflictBetween(existing, course)) return true;
    return baseCourse(existing.courseSection) === baseCourse(course.courseSection);
  });

const compareScores = (scoreA, scoreB) => {
  if (scoreA.count !== scoreB.count) return scoreA.count - scoreB.count;
  for (let i = 0; i < scoreA.flags.length; i += 1) {
    if (scoreA.flags[i] !== scoreB.flags[i]) {
      return scoreA.flags[i] - scoreB.flags[i];
    }
  }
  return 0;
};

const buildRankedSchedules = (results, includeConflicts) => {
  const ranked = [];
  let capped = false;
  let searched = 0;
  const flags = Array(results.length).fill(0);

  const consider = (schedule, flagSnapshot) => {
    const score = { count: schedule.length, flags: [...flagSnapshot] };
    ranked.push({ schedule: schedule.slice(), score });
    ranked.sort((a, b) => compareScores(b.score, a.score));
    if (ranked.length > MAX_SCHEDULES) ranked.pop();
  };

  const walk = (index, current) => {
    if (searched >= MAX_SEARCH) {
      capped = true;
      return;
    }
    if (index === results.length) {
      searched += 1;
      consider(current, flags);
      return;
    }

    flags[index] = 0;
    walk(index + 1, current);

    results[index].matches.forEach((course) => {
      if (current.length >= 4) return;
      if (!includeConflicts && hasConflict(current, course)) return;
      flags[index] = 1;
      current.push(course);
      walk(index + 1, current);
      current.pop();
      flags[index] = 0;
    });
  };

  walk(0, []);
  const bestScore = ranked[0]?.score || null;
  return { schedules: ranked.map((item) => item.schedule), bestScore, capped };
};

const renderSchedules = (schedules, includeConflicts) => {
  schedulesEl.innerHTML = "";
  if (schedules.length === 0) {
    schedulesEl.innerHTML = "<p>No schedules to display.</p>";
    return;
  }

  const limited = schedules.slice(0, 50);

  limited.forEach((schedule, index) => {
    const conflicts = summarizeConflicts(schedule);
    if (conflicts.length && !includeConflicts) return;

    const card = document.createElement("article");
    card.className = "schedule-card";

    const heading = document.createElement("h3");
    heading.textContent = `Schedule ${index + 1}`;
    card.appendChild(heading);

    schedule.forEach((course) => {
      const m = getPrimaryMeeting(course);

      const row = document.createElement("div");
      row.className = "course-row";
      row.innerHTML = `
        <strong>${course.courseSection} · ${course.title}</strong>
        <span>${m.days} ${m.time} · ${m.room}</span>
        <span>CRN ${course.crn}</span>
      `;
      card.appendChild(row);
    });

    schedulesEl.appendChild(card);
  });
};

const renderSelectionList = (results) => {
  selectionListEl.innerHTML = "";
  if (selections.length === 0) {
    selectionListEl.innerHTML = "<p>No selections yet.</p>";
    return;
  }

  selections.forEach((selection) => {
    const result = results?.find((item) => item.selection.id === selection.id);
    const matches = result ? result.matches : [];

    const item = document.createElement("div");
    item.className = "selection-item";
    item.draggable = true;
    item.dataset.id = selection.id;

    const details = document.createElement("div");
    details.innerHTML = `
      <strong>${selection.raw}</strong>
      <span>${selection.active ? "Active" : "Hidden from schedule"}</span>
    `;

    const matchList = document.createElement("ul");
    matchList.className = "match-list";

    if (!selection.active) {
      const li = document.createElement("li");
      li.textContent = "Hidden from schedule.";
      matchList.appendChild(li);
    } else if (!results) {
      const li = document.createElement("li");
      li.textContent = "Build schedules to see matches.";
      matchList.appendChild(li);
    } else if (matches.length === 0) {
      const li = document.createElement("li");
      li.textContent = "No matches found.";
      matchList.appendChild(li);
    } else {
      matches.forEach((course) => {
        const m = getPrimaryMeeting(course);
        const li = document.createElement("li");
        li.textContent = `${course.courseSection} · ${course.title} · ${m.days} ${m.time}`;
        matchList.appendChild(li);
      });
    }

    const actions = document.createElement("div");
    actions.className = "selection-actions";

    const toggle = document.createElement("button");
    toggle.className = `pill ${selection.active ? "active" : ""}`;
    toggle.textContent = selection.active ? "Hide" : "Show";
    toggle.addEventListener("click", () => {
      selection.active = !selection.active;
      updateSelectionsOnly();
    });

    const remove = document.createElement("button");
    remove.className = "pill";
    remove.textContent = "Delete";
    remove.addEventListener("click", () => {
      selections = selections.filter((item) => item.id !== selection.id);
      updateSelectionsOnly();
    });

    actions.appendChild(toggle);
    actions.appendChild(remove);

    details.appendChild(matchList);
    item.appendChild(details);
    item.appendChild(actions);
    selectionListEl.appendChild(item);
  });
};

const buildSuggestions = () => {
  const seen = new Set();
  suggestionsEl.innerHTML = "";

  catalog.forEach((course) => {
    const key = course.courseSection;
    if (seen.has(key)) return;
    seen.add(key);

    const option = document.createElement("option");
    option.value = `${course.courseSection} · ${course.title}`;
    suggestionsEl.appendChild(option);
  });
};

const setScheduleOptions = (schedules) => {
  scheduleSelectEl.innerHTML = "";
  schedules.forEach((schedule, index) => {
    const option = document.createElement("option");
    option.value = index;
    option.textContent = `Schedule ${index + 1}`;
    scheduleSelectEl.appendChild(option);
  });
};

const renderCalendar = (schedule) => {
  calendarTimesEl.innerHTML = "";
  calendarGridEl.innerHTML = "";

  if (!schedule || schedule.length === 0) return;

  const times = schedule
    .map((course) => parseTimeRange(getPrimaryMeeting(course).time))
    .filter(Boolean);

  const minTime = times.length ? Math.min(...times.map((t) => t.start)) : 480;
  const maxTime = times.length ? Math.max(...times.map((t) => t.end)) : 1020;

  const start = Math.floor(minTime / 30) * 30;
  const end = Math.ceil(maxTime / 30) * 30;

  const pxPerMin = 1.2;
  const height = Math.max((end - start) * pxPerMin, 320);

  for (let t = start; t <= end; t += 60) {
    const hour = Math.floor(t / 60);
    const labelHour = ((hour + 11) % 12) + 1;
    const label = `${labelHour}:00 ${hour >= 12 ? "PM" : "AM"}`;
    const div = document.createElement("div");
    div.style.height = `${60 * pxPerMin}px`;
    div.textContent = label;
    calendarTimesEl.appendChild(div);
  }

  DAYS.forEach((day) => {
    const column = document.createElement("div");
    const events = document.createElement("div");
    events.style.height = `${height}px`;

    schedule.forEach((course) => {
      const m = getPrimaryMeeting(course);
      if (!expandDays(m.days).includes(day)) return;

      const time = parseTimeRange(m.time);
      if (!time) return;

      const event = document.createElement("div");
      const top = (time.start - start) * pxPerMin;
      const eventHeight = Math.max((time.end - time.start) * pxPerMin, 24);

      event.style.top = `${top}px`;
      event.style.height = `${eventHeight}px`;
      event.innerHTML = `
        <strong>${course.courseSection}</strong>
        <div>${course.title}</div>
        <div>${m.time}</div>
      `;

      events.appendChild(event);
    });

    column.appendChild(events);
    calendarGridEl.appendChild(column);
  });
};

const updateSelectionsOnly = () => {
  const activeSelections = selections.filter((s) => s.active);
  const results = buildMatches(activeSelections);
  renderSelectionList(results);
  const missing = results.filter((r) => r.matches.length === 0);
  if (missing.length) {
    statusEl.textContent = "Some selections have no matches.";
    schedulesEl.innerHTML = "";
    calendarTimesEl.innerHTML = "";
    calendarGridEl.innerHTML = "";
    scheduleSelectEl.innerHTML = "";
    return;
  }
  renderWebTree();
};

const update = () => {
  statusEl.textContent = "";
  summaryEl.textContent = "";

  const activeSelections = selections.filter((s) => s.active);
  const results = buildMatches(activeSelections);

  renderSelectionList(results);

  if (activeSelections.length === 0) {
    schedulesEl.innerHTML = "";
    calendarTimesEl.innerHTML = "";
    calendarGridEl.innerHTML = "";
    scheduleSelectEl.innerHTML = "";
    renderWebTree();
    return;
  }

  const { schedules, bestScore } =
    buildRankedSchedules(results, false);

  latestSchedules = schedules;
  setScheduleOptions(schedules);

  const selectedIndex = Number(scheduleSelectEl.value || 0);
  renderCalendar(schedules[selectedIndex]);

  renderWebTree();

  summaryEl.textContent = `Top schedules include ${
    bestScore?.count || 0
  } of ${results.length} selections.`;
};

const resolveInput = (raw) => {
  const cleaned = raw.split("·")[0].trim();
  const normalizedInput = normalize(cleaned);

  const match = catalog.find(
    (c) => normalize(c.courseSection) === normalizedInput
  );

  return match ? match.courseSection : cleaned;
};

const addSelection = () => {
  const raw = courseInput.value.trim();
  if (!raw) return;

  const resolved = resolveInput(raw);

  if (
    selections.some(
      (s) => normalize(s.raw) === normalize(resolved)
    )
  ) {
    courseInput.value = "";
    return;
  }

  selections.push({
    id: `sel-${selectionId++}`,
    raw: resolved,
    active: true
  });

  courseInput.value = "";
  updateSelectionsOnly();
};

const init = async () => {
  const response = await fetch("http://localhost:3000/courses");
  catalog = await response.json();

  buildSuggestions();

  addButton.addEventListener("click", addSelection);
  buildButton.addEventListener("click", update);

  scheduleSelectEl.addEventListener("change", () => {
    const index = Number(scheduleSelectEl.value || 0);
    renderCalendar(latestSchedules[index]);
  });

  courseInput.addEventListener("keydown", (e) => {
    if (e.key === "Enter") {
      e.preventDefault();
      addSelection();
    }
  });

  updateSelectionsOnly();
};

init();