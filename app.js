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

const conflictBetween = (courseA, courseB) => {
  const daysA = expandDays(courseA.days);
  const daysB = expandDays(courseB.days);
  const shared = daysA.filter((day) => daysB.includes(day));
  if (!shared.length) return null;

  const timeA = parseTimeRange(courseA.time);
  const timeB = parseTimeRange(courseB.time);
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
      return (
        normalize(course.title).includes(needle) ||
        normalize(course.courseSection).includes(needle)
      );
    });
    return { selection, matches };
  });
};

const createSchedules = (groups) => {
  const schedules = [];
  let capped = false;

  const walk = (index, current) => {
    if (schedules.length >= MAX_SCHEDULES) {
      capped = true;
      return;
    }
    if (index === groups.length) {
      schedules.push([...current]);
      return;
    }
    groups[index].forEach((course) => {
      current.push(course);
      walk(index + 1, current);
      current.pop();
    });
  };

  walk(0, []);
  return { schedules, capped };
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
  schedule.some((existing) => conflictBetween(existing, course));

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

  const MAX_SHOW = 50;
  const limited = schedules.slice(0, MAX_SHOW);

  limited.forEach((schedule, index) => {
    const conflicts = summarizeConflicts(schedule);
    if (conflicts.length && !includeConflicts) return;

    const card = document.createElement("article");
    card.className = "schedule-card";

    const heading = document.createElement("h3");
    heading.textContent = `Schedule ${index + 1}`;
    card.appendChild(heading);

    schedule.forEach((course) => {
      const row = document.createElement("div");
      row.className = "course-row";
      row.innerHTML = `
        <strong>${course.courseSection} · ${course.title}</strong>
        <span>${course.days} ${course.time} · ${course.room}</span>
        <span>CRN ${course.crn} · ${course.instructor}</span>
      `;
      card.appendChild(row);
    });

    if (conflicts.length) {
      const conflictBox = document.createElement("div");
      conflictBox.className = "conflicts";
      conflictBox.innerHTML = conflicts
        .map(
          (conflict) =>
            `${conflict.days}: ${conflict.a.courseSection} overlaps ${conflict.b.courseSection}`
        )
        .join("<br />");
      card.appendChild(conflictBox);
    }

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
        const li = document.createElement("li");
        li.textContent = `${course.courseSection} · ${course.title} · ${course.days} ${course.time}`;
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
      update();
    });

    const remove = document.createElement("button");
    remove.className = "pill";
    remove.textContent = "Delete";
    remove.addEventListener("click", () => {
      selections = selections.filter((item) => item.id !== selection.id);
      update();
    });

    actions.appendChild(toggle);
    actions.appendChild(remove);

    details.appendChild(matchList);
    item.appendChild(details);
    item.appendChild(actions);
    selectionListEl.appendChild(item);

    item.addEventListener("dragstart", (event) => {
      dragSourceId = selection.id;
      event.dataTransfer.effectAllowed = "move";
      event.dataTransfer.setData("text/plain", selection.id);
    });
    item.addEventListener("dragover", (event) => {
      event.preventDefault();
      item.classList.add("drag-over");
    });
    item.addEventListener("dragleave", () => {
      item.classList.remove("drag-over");
    });
    item.addEventListener("drop", (event) => {
      event.preventDefault();
      item.classList.remove("drag-over");
      const sourceId = event.dataTransfer.getData("text/plain") || dragSourceId;
      const targetId = selection.id;
      if (!sourceId || sourceId === targetId) return;
      const sourceIndex = selections.findIndex((s) => s.id === sourceId);
      const targetIndex = selections.findIndex((s) => s.id === targetId);
      if (sourceIndex === -1 || targetIndex === -1) return;
      const [moved] = selections.splice(sourceIndex, 1);
      selections.splice(targetIndex, 0, moved);
      update();
    });
  });
};

const buildSuggestions = () => {
  const titleSuggestions = new Set();

  catalog.forEach((course) => {
    titleSuggestions.add(course.title);
  });

  suggestionsEl.innerHTML = "";
  [...titleSuggestions]
    .sort()
    .forEach((value) => {
      const option = document.createElement("option");
      option.value = value;
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
    .map((course) => parseTimeRange(course.time))
    .filter(Boolean);
  const minTime = times.length ? Math.min(...times.map((time) => time.start)) : 8 * 60;
  const maxTime = times.length ? Math.max(...times.map((time) => time.end)) : 17 * 60;
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
    column.className = "calendar__column";

    const heading = document.createElement("div");
    heading.className = "calendar__day";
    heading.textContent = DAY_LABELS[day];

    const events = document.createElement("div");
    events.className = "calendar__events";
    events.style.height = `${height}px`;

    schedule.forEach((course) => {
      const courseDays = expandDays(course.days);
      if (!courseDays.includes(day)) return;
      const time = parseTimeRange(course.time);
      if (!time) return;

      const event = document.createElement("div");
      event.className = "event";
      const top = (time.start - start) * pxPerMin;
      const eventHeight = Math.max((time.end - time.start) * pxPerMin, 24);
      event.style.top = `${top}px`;
      event.style.height = `${eventHeight}px`;
      event.innerHTML = `
        <strong>${course.courseSection}</strong>
        <div>${course.title}</div>
        <div>${course.time}</div>
      `;
      events.appendChild(event);
    });

    column.appendChild(heading);
    column.appendChild(events);
    calendarGridEl.appendChild(column);
  });

  calendarGridEl.style.height = `${height + 34}px`;
};

const getOrderedActivePreferences = () =>
  selections
    .filter((selection) => selection.active)
    .map((selection) => selection.raw);

const buildWebTree = (orderedPrefs) => {
  const get = (index) => orderedPrefs[index] || "—";

  return [
    {
      name: "Tree 1",
      choices: [
        { slot: 1, value: get(0), note: "Top choice" },
        { slot: 2, value: get(1), note: "Second choice" },
        { slot: 3, value: get(2), note: "Third choice" },
        { slot: 4, value: get(3), note: "Backup to 3" },
        { slot: 5, value: get(4), note: "Backup to 2" },
        { slot: 6, value: get(2), note: "Third choice again" },
        { slot: 7, value: get(5), note: "Backup to 6" }
      ]
    },
    {
      name: "Tree 2",
      choices: [
        { slot: 1, value: get(1), note: "Second choice" },
        { slot: 2, value: get(2), note: "Third choice" },
        { slot: 3, value: get(3), note: "Fourth choice" },
        { slot: 4, value: get(4), note: "Backup to 3" },
        { slot: 5, value: get(5), note: "Backup to 2" },
        { slot: 6, value: get(3), note: "Fourth choice again" },
        { slot: 7, value: get(6), note: "Backup to 6" }
      ]
    },
    {
      name: "Tree 3",
      choices: [
        { slot: 1, value: get(2), note: "Third choice" },
        { slot: 2, value: get(3), note: "Fourth choice" },
        { slot: 3, value: get(4), note: "Fifth choice" },
        { slot: 4, value: get(5), note: "Backup to 3" },
        { slot: 5, value: get(6), note: "Backup to 2" },
        { slot: 6, value: get(4), note: "Fifth choice again" },
        { slot: 7, value: get(7), note: "Backup to 6" }
      ]
    },
    {
      name: "Tree 4",
      choices: Array.from({ length: 10 }, (_, index) => ({
        slot: index + 1,
        value: get(index),
        note: index === 0 ? "Dream schedule anchor" : "Additional fallback"
      }))
    }
  ];
};

const renderWebTree = () => {
  const orderedPrefs = getOrderedActivePreferences();

  if (orderedPrefs.length === 0) {
    webtreePreviewEl.innerHTML = "<p>No active course preferences yet.</p>";
    webtreeSummaryEl.textContent = "Add courses in ranked order to preview your WebTree.";
    return;
  }

  const trees = buildWebTree(orderedPrefs);

  webtreePreviewEl.innerHTML = "";
  webtreeSummaryEl.textContent = `${orderedPrefs.length} ordered preference${
    orderedPrefs.length === 1 ? "" : "s"
  } mapped into Tree 1–4.`;

  trees.forEach((tree) => {
    const card = document.createElement("article");
    card.className = "webtree-card";

    const heading = document.createElement("h3");
    heading.textContent = tree.name;
    card.appendChild(heading);

    const list = document.createElement("div");
    list.className = "webtree-list";

    tree.choices.forEach((choice) => {
      const row = document.createElement("div");
      row.className = "webtree-row";
      row.innerHTML = `
        <div class="webtree-slot">Choice ${choice.slot}</div>
        <div class="webtree-course">
          <strong>${choice.value}</strong>
          <span>${choice.note}</span>
        </div>
      `;
      list.appendChild(row);
    });

    card.appendChild(list);
    webtreePreviewEl.appendChild(card);
  });
};

const update = () => {
  statusEl.textContent = "";
  summaryEl.textContent = "";

  const activeSelections = selections.filter((selection) => selection.active);
  const results = buildMatches(activeSelections);
  renderSelectionList(results);

  if (activeSelections.length === 0) {
    schedulesEl.innerHTML = "";
    calendarTimesEl.innerHTML = "";
    calendarGridEl.innerHTML = "";
    scheduleSelectEl.innerHTML = "";
    statusEl.textContent = "Add at least one active selection to build schedules.";
    renderWebTree();
    return;
  }

  const missing = results.filter((result) => result.matches.length === 0);
  if (missing.length) {
    statusEl.textContent = "Some selections have no matches. Update those and try again.";
    schedulesEl.innerHTML = "";
    calendarTimesEl.innerHTML = "";
    calendarGridEl.innerHTML = "";
    scheduleSelectEl.innerHTML = "";
    return;
  }

  const includeConflicts = false;
  const { schedules, bestScore, capped } = buildRankedSchedules(results, includeConflicts);

  latestSchedules = schedules;
  setScheduleOptions(schedules);
  const selectedIndex = Number(scheduleSelectEl.value || 0);
  renderCalendar(schedules[selectedIndex]);

  renderWebTree();

  const totalSelections = results.length;
  const includedCount = bestScore ? bestScore.count : 0;
  summaryEl.textContent = `Top schedules include ${includedCount} of ${totalSelections} selections (max 4 per schedule).`;
  if (capped) {
    statusEl.textContent = `Search capped at ${MAX_SEARCH} combinations. Showing top ${MAX_SCHEDULES}.`;
  }
};

const resolveInputToTitle = (raw) => {
  const trimmed = raw.trim();
  if (!trimmed) return "";

  const normalizedInput = normalize(trimmed);

  const exactCrnMatch = catalog.find((course) => String(course.crn) === trimmed);
  if (exactCrnMatch) return exactCrnMatch.title;

  const exactSectionMatch = catalog.find(
    (course) => normalize(course.courseSection) === normalizedInput
  );
  if (exactSectionMatch) return exactSectionMatch.title;

  const exactTitleMatch = catalog.find(
    (course) => normalize(course.title) === normalizedInput
  );
  if (exactTitleMatch) return exactTitleMatch.title;

  return trimmed;
};

const addSelection = () => {
  const raw = courseInput.value.trim();
  if (!raw) return;

  const resolvedTitle = resolveInputToTitle(raw);

  const alreadyExists = selections.some(
    (selection) => normalize(selection.raw) === normalize(resolvedTitle)
  );
  if (alreadyExists) {
    courseInput.value = "";
    return;
  }

  selections.push({
    id: `sel-${selectionId++}`,
    raw: resolvedTitle,
    active: true
  });

  courseInput.value = "";
  update();
};

const init = async () => {
  try {
    const response = await fetch("CSCdata.json");
    catalog = await response.json();
  } catch (error) {
    statusEl.textContent = "Unable to load CSCdata.json. Serve this folder with a local web server.";
    return;
  }

  buildSuggestions();
  addButton.addEventListener("click", addSelection);
  buildButton.addEventListener("click", update);
  scheduleSelectEl.addEventListener("change", () => {
    const index = Number(scheduleSelectEl.value || 0);
    renderCalendar(latestSchedules[index]);
  });
  courseInput.addEventListener("keydown", (event) => {
    if (event.key === "Enter") {
      event.preventDefault();
      addSelection();
    }
  });

  update();
};

init();
