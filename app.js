import { createClient } from "https://cdn.jsdelivr.net/npm/@supabase/supabase-js/+esm";

const supabase = createClient(
  "https://csotlkemhfrucmubopsr.supabase.co",
  "sb_publishable_k25RlLfIDRTbeQrncvPopw_hB68GuIS"
);

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

const DAYS = ["M", "T", "W", "R", "F"];
const DAY_LABELS = {
  M: "Monday",
  T: "Tuesday",
  W: "Wednesday",
  R: "Thursday",
  F: "Friday"
};
const CALENDAR_START = 8 * 60;
const CALENDAR_END = 18 * 60;
const CALENDAR_STEP = 60;
const HOUR_ROW_HEIGHT = 72;
const DAY_HEADER_HEIGHT = 38;
const CALENDAR_BODY_HEIGHT = ((CALENDAR_END - CALENDAR_START) / 60) * HOUR_ROW_HEIGHT;
const MAX_SCHEDULES = 50;

const normalize = (value) => String(value || "").toLowerCase().replace(/\s+/g, " ").trim();
const escapeHtml = (value) =>
  String(value || "").replace(/[&<>"']/g, (char) => ({
    "&": "&amp;",
    "<": "&lt;",
    ">": "&gt;",
    '"': "&quot;",
    "'": "&#39;"
  })[char]);

const parseClockValue = (value) => {
  const digits = String(value || "").replace(/\D/g, "");
  if (!digits) return null;

  const padded = digits.padStart(4, "0");
  const hours = Number.parseInt(padded.slice(0, 2), 10);
  const minutes = Number.parseInt(padded.slice(2, 4), 10);

  if (Number.isNaN(hours) || Number.isNaN(minutes)) return null;
  return hours * 60 + minutes;
};

const parseTimeToken = (value, meridiemHint) => {
  if (!value) return null;

  const text = String(value).trim().toUpperCase();
  const meridiemMatch = text.match(/(AM|PM)$/);
  const meridiem = meridiemMatch ? meridiemMatch[1] : meridiemHint;
  const digits = text.replace(/[^0-9]/g, "");

  if (!digits) return null;

  let hours;
  let minutes;

  if (digits.length <= 2) {
    hours = Number.parseInt(digits, 10);
    minutes = 0;
  } else if (digits.length === 3) {
    hours = Number.parseInt(digits.slice(0, 1), 10);
    minutes = Number.parseInt(digits.slice(1), 10);
  } else {
    hours = Number.parseInt(digits.slice(0, 2), 10);
    minutes = Number.parseInt(digits.slice(2, 4), 10);
  }

  if ([hours, minutes].some(Number.isNaN)) return null;

  if (meridiem === "PM" && hours !== 12) hours += 12;
  if (meridiem === "AM" && hours === 12) hours = 0;

  return hours * 60 + minutes;
};

const parseTimeRange = (time, startTime, endTime) => {
  if (startTime && endTime) {
    return {
      start: parseClockValue(startTime),
      end: parseClockValue(endTime)
    };
  }

  if (!time || normalize(time) === "tba") return null;

  const text = String(time).trim().toUpperCase();
  const parts = text.split("-").map((part) => part.trim());
  if (parts.length !== 2) return null;

  const meridiemHint = parts[1].match(/(AM|PM)$/)?.[1] || null;
  const start = parseTimeToken(parts[0], meridiemHint);
  const end = parseTimeToken(parts[1], meridiemHint);

  if (start == null || end == null) return null;
  return { start, end };
};

const formatMinutes = (minutes) => {
  if (minutes == null) return "TBA";

  const hours24 = Math.floor(minutes / 60);
  const mins = minutes % 60;
  const meridiem = hours24 >= 12 ? "PM" : "AM";
  const hours12 = hours24 % 12 || 12;
  return `${hours12}:${String(mins).padStart(2, "0")} ${meridiem}`;
};

const formatMeetingLabel = (meeting) => {
  const dayLabel = meeting.days || "TBA";
  const timeLabel = meeting.time || (
    meeting.range ? `${formatMinutes(meeting.range.start)} - ${formatMinutes(meeting.range.end)}` : "TBA"
  );
  const roomLabel = meeting.room ? `, ${meeting.room}` : "";
  return `${dayLabel} ${timeLabel}${roomLabel}`.trim();
};

const expandDays = (days) =>
  days && normalize(days) !== "tba" ? DAYS.filter((day) => days.includes(day)) : [];

const baseCourse = (courseSection) => {
  const parts = String(courseSection || "").trim().split(/\s+/);
  return parts.slice(0, 2).join(" ");
};

const buildCourseSearchBlob = (course) =>
  normalize([
    course.crn,
    course.courseSection,
    course.title,
    course.department
  ].filter(Boolean).join(" "));

const buildCourseLabel = (course) => `${course.courseSection} - ${course.title}`;
const getSelectionDisplayCourse = (matches) => matches[0] || null;

const loadCourses = async () => {
  statusEl.textContent = "Loading course catalog...";

  const { data, error } = await supabase
    .from("course")
    .select(`
      crn,
      course_code,
      course_title,
      department,
      meeting:meeting (
        weekdays,
        class_time,
        start_time,
        end_time,
        room
      )
    `);

  if (error) {
    console.error(error);
    statusEl.textContent = error.message;
    return;
  }

  catalog = (data || []).map((course) => {
    const meetings = (course.meeting || []).map((meeting) => ({
      days: meeting.weekdays || "TBA",
      time: meeting.class_time || "TBA",
      room: meeting.room || "",
      range: parseTimeRange(meeting.class_time, meeting.start_time, meeting.end_time)
    }));

    const normalizedCourse = {
      crn: String(course.crn || ""),
      courseSection: course.course_code || "",
      title: course.course_title || "Untitled course",
      department: course.department || "",
      meetings
    };

    return {
      ...normalizedCourse,
      searchBlob: buildCourseSearchBlob(normalizedCourse)
    };
  });

  statusEl.textContent = `Loaded ${catalog.length} courses from the backend.`;
};

const populateSuggestions = () => {
  const uniqueTitles = new Set();

  catalog.forEach((course) => {
    uniqueTitles.add(course.title);
  });

  suggestionsEl.innerHTML = [...uniqueTitles]
    .filter(Boolean)
    .sort((a, b) => a.localeCompare(b))
    .map((value) => `<option value="${escapeHtml(value)}"></option>`)
    .join("");
};

const isRecognizedCourseInput = (raw) => {
  const needle = normalize(raw);
  if (!needle) return false;

  return catalog.some((course) => (
    normalize(course.courseSection) === needle ||
    normalize(course.title) === needle ||
    normalize(course.crn) === needle
  ));
};

const getSelectionMatches = (selection) => {
  const needle = normalize(selection.raw);
  if (!needle) return [];

  const exactMatches = [];
  const fuzzyMatches = [];

  catalog.forEach((course) => {
    const normalizedSection = normalize(course.courseSection);
    const normalizedTitle = normalize(course.title);
    const normalizedCrn = normalize(course.crn);

    const isExact =
      normalizedSection === needle ||
      normalizedTitle === needle ||
      normalizedCrn === needle;

    const isFuzzy =
      course.searchBlob.includes(needle) ||
      normalizedSection.startsWith(needle) ||
      normalizedTitle.includes(needle);

    if (isExact) {
      exactMatches.push(course);
    } else if (isFuzzy) {
      fuzzyMatches.push(course);
    }
  });

  return [...exactMatches, ...fuzzyMatches];
};

const getActiveSelections = () => selections.filter((selection) => selection.active);

const buildMatches = (list) =>
  list.map((selection) => ({
    selection,
    matches: getSelectionMatches(selection)
  }));

const meetingsConflict = (meetingA, meetingB) => {
  const sharedDays = expandDays(meetingA.days).filter((day) => expandDays(meetingB.days).includes(day));
  if (!sharedDays.length) return false;
  if (!meetingA.range || !meetingB.range) return false;

  return meetingA.range.start < meetingB.range.end && meetingB.range.start < meetingA.range.end;
};

const conflictBetween = (courseA, courseB) => {
  if (baseCourse(courseA.courseSection) === baseCourse(courseB.courseSection)) return true;

  return courseA.meetings.some((meetingA) =>
    courseB.meetings.some((meetingB) => meetingsConflict(meetingA, meetingB))
  );
};

const hasConflict = (schedule, course) =>
  schedule.some((existingCourse) => conflictBetween(existingCourse, course));

const buildRankedSchedules = (results) => {
  if (!results.length) return [];

  const schedules = [];

  const dfs = (index, currentSchedule) => {
    if (schedules.length >= MAX_SCHEDULES) return;

    if (index === results.length) {
      schedules.push([...currentSchedule]);
      return;
    }

    results[index].matches.forEach((course) => {
      if (!hasConflict(currentSchedule, course)) {
        currentSchedule.push(course);
        dfs(index + 1, currentSchedule);
        currentSchedule.pop();
      }
    });
  };

  dfs(0, []);

  return schedules.sort((a, b) => {
    if (b.length !== a.length) return b.length - a.length;
    return a.reduce((total, course) => total + course.meetings.length, 0) -
      b.reduce((total, course) => total + course.meetings.length, 0);
  });
};

const renderSelections = (results) => {
  if (!selections.length) {
    selectionListEl.innerHTML = "<p class=\"summary\">No courses added yet.</p>";
    return;
  }

  selectionListEl.innerHTML = results.map(({ selection, matches }) => {
    const displayCourse = getSelectionDisplayCourse(matches);
    const topMatches = matches.slice(0, 3);
    const countLabel = matches.length === 1 ? "1 backend match" : `${matches.length} backend matches`;
    const matchList = topMatches.length
      ? `<ul class="match-list">${topMatches.map((course) =>
          `<li>${escapeHtml(buildCourseLabel(course))}</li>`
        ).join("")}</ul>`
      : "<div class=\"summary\">No backend matches yet.</div>";

    return `
      <div class="selection-item">
        <div>
          <strong>${escapeHtml(displayCourse?.title || selection.raw)}</strong>
          <span>${escapeHtml(displayCourse?.courseSection || selection.raw)}</span>
          <span>${escapeHtml(countLabel)}</span>
          ${matchList}
        </div>
        <div class="selection-actions">
          <button class="pill ${selection.active ? "active" : ""}" data-action="toggle" data-id="${selection.id}">
            ${selection.active ? "Included" : "Hidden"}
          </button>
          <button class="pill" data-action="remove" data-id="${selection.id}">Remove</button>
        </div>
      </div>
    `;
  }).join("");
};

const buildScheduleLabel = (schedule, index) => {
  const countLabel = schedule.length === 1 ? "1 course" : `${schedule.length} courses`;
  return `Schedule ${index + 1} (${countLabel})`;
};

const renderSchedules = (schedules) => {
  if (!schedules.length) {
    schedulesEl.innerHTML = "<p class=\"summary\">No conflict-free schedules matched your current backend results.</p>";
    return;
  }

  schedulesEl.innerHTML = schedules.map((schedule, index) => `
    <article class="schedule-card">
      <h3>${escapeHtml(buildScheduleLabel(schedule, index))}</h3>
      ${schedule.map((course) => `
        <div class="course-row">
          <strong>${escapeHtml(course.courseSection)}</strong>
          <span>${escapeHtml(course.title)}</span>
          <span>CRN ${escapeHtml(course.crn)}</span>
          <span>${escapeHtml(course.meetings.map(formatMeetingLabel).join(" • ") || "Meeting time TBA")}</span>
        </div>
      `).join("")}
    </article>
  `).join("");
};

const renderScheduleSelect = (schedules) => {
  scheduleSelectEl.innerHTML = schedules.length
    ? schedules.map((schedule, index) =>
        `<option value="${index}">${escapeHtml(buildScheduleLabel(schedule, index))}</option>`
      ).join("")
    : "<option value=\"\">No schedules available</option>";

  scheduleSelectEl.disabled = !schedules.length;
};

const renderCalendarTimes = () => {
  const labels = [`<div class="calendar__time-spacer" style="height:${DAY_HEADER_HEIGHT}px;"></div>`];

  for (let minute = CALENDAR_START; minute <= CALENDAR_END; minute += CALENDAR_STEP) {
    labels.push(
      `<div class="calendar__time-slot" style="height:${HOUR_ROW_HEIGHT}px;">${escapeHtml(formatMinutes(minute))}</div>`
    );
  }

  calendarTimesEl.innerHTML = labels.join("");
};

const buildCalendarEvent = (course, meeting) => {
  if (!meeting.range) return "";

  const totalMinutes = CALENDAR_END - CALENDAR_START;
  const start = Math.max(meeting.range.start, CALENDAR_START);
  const end = Math.min(meeting.range.end, CALENDAR_END);
  if (end <= start) return "";

  const top = ((start - CALENDAR_START) / totalMinutes) * CALENDAR_BODY_HEIGHT;
  const height = ((end - start) / totalMinutes) * CALENDAR_BODY_HEIGHT;

  return `
    <div
      class="event"
      style="top:${top}px;height:${height}px;"
      title="${escapeHtml(`${buildCourseLabel(course)} | ${formatMeetingLabel(meeting)}`)}"
    >
      <strong>${escapeHtml(course.courseSection)}</strong>
      <div>${escapeHtml(meeting.time || "TBA")}</div>
      <div>${escapeHtml(meeting.room || "")}</div>
    </div>
  `;
};

const renderCalendar = (schedule) => {
  if (!schedule?.length) {
    calendarGridEl.innerHTML = "";
    return;
  }

  calendarGridEl.innerHTML = DAYS.map((day) => {
    const events = schedule.flatMap((course) =>
      course.meetings
        .filter((meeting) => expandDays(meeting.days).includes(day))
        .map((meeting) => buildCalendarEvent(course, meeting))
    ).join("");

    return `
      <div class="calendar__column">
        <div class="calendar__day" style="height:${DAY_HEADER_HEIGHT}px;">${escapeHtml(DAY_LABELS[day])}</div>
        <div class="calendar__events" style="height:${CALENDAR_BODY_HEIGHT}px;">${events}</div>
      </div>
    `;
  }).join("");
};

const renderSummary = (results, schedules) => {
  const activeSelections = results.filter(({ selection }) => selection.active);
  const unmatchedSelections = activeSelections.filter(({ matches }) => matches.length === 0);

  if (!activeSelections.length) {
    summaryEl.textContent = "Add courses to generate schedules.";
    return;
  }

  const matchedCount = activeSelections.length - unmatchedSelections.length;
  const scheduleCountLabel = schedules.length === 1 ? "1 schedule" : `${schedules.length} schedules`;
  const matchedLabel = matchedCount === 1 ? "1 selection matched" : `${matchedCount} selections matched`;

  if (unmatchedSelections.length) {
    summaryEl.textContent = `${matchedLabel}. ${scheduleCountLabel} generated. ${unmatchedSelections.length} selections did not match the backend catalog.`;
    return;
  }

  summaryEl.textContent = `${matchedLabel}. ${scheduleCountLabel} generated from backend course data.`;
};

const renderWebtree = (schedule) => {
  const activeSelections = getActiveSelections();

  if (!activeSelections.length) {
    webtreePreviewEl.innerHTML = "<p class=\"summary\">Add courses to build your Tree 1-4 preview.</p>";
    webtreeSummaryEl.textContent = "Your ordered preferences mapped into Tree 1-4.";
    return;
  }

  const rows = activeSelections.slice(0, 4).map((selection, index) => {
    const selectedCourse = schedule?.find((course) =>
      getSelectionMatches(selection).some((match) => match.crn === course.crn)
    );

    return `
      <div class="webtree-row">
        <div class="webtree-slot">Tree ${index + 1}</div>
        <div class="webtree-course">
          ${selectedCourse
            ? `
              <strong>${escapeHtml(selectedCourse.courseSection)}</strong>
              <span>${escapeHtml(selectedCourse.title)}</span>
              <span>${escapeHtml(selectedCourse.meetings.map(formatMeetingLabel).join(" • "))}</span>
            `
            : `
              <strong>${escapeHtml(selection.raw)}</strong>
              <span>No scheduled match in the selected preview.</span>
            `}
        </div>
      </div>
    `;
  }).join("");

  webtreePreviewEl.innerHTML = `
    <article class="webtree-card">
      <h3>Selected Schedule</h3>
      <div class="webtree-list">${rows}</div>
    </article>
  `;

  const shownCount = Math.min(activeSelections.length, 4);
  webtreeSummaryEl.textContent = `Using backend schedule data for Tree 1-${shownCount}.`;
};

const renderSchedulePreview = (scheduleIndex) => {
  const schedule = latestSchedules[scheduleIndex] || latestSchedules[0] || [];
  renderCalendar(schedule);
  renderWebtree(schedule);
};

const update = () => {
  const results = buildMatches(getActiveSelections());
  const schedules = buildRankedSchedules(results);

  latestSchedules = schedules;

  renderSelections(buildMatches(selections));
  renderSummary(results, schedules);
  renderScheduleSelect(schedules);
  renderSchedules(schedules);
  renderSchedulePreview(0);
};

const addSelection = () => {
  const raw = courseInput.value.trim();
  if (!raw) return;

  const canonicalMatch = catalog.find((course) => (
    normalize(course.crn) === normalize(raw) ||
    normalize(course.title) === normalize(raw) ||
    normalize(course.courseSection) === normalize(raw)
  ));
  const storedValue = canonicalMatch ? canonicalMatch.title : raw;

  const duplicate = selections.some((selection) => normalize(selection.raw) === normalize(storedValue));
  if (duplicate) {
    statusEl.textContent = "That course is already in your list.";
    courseInput.value = "";
    return;
  }

  selections.push({ id: selectionId++, raw: storedValue, active: true });
  courseInput.value = "";
  statusEl.textContent = `Added "${storedValue}".`;
  update();
};

const handleSelectionAction = (event) => {
  const button = event.target.closest("button[data-action]");
  if (!button) return;

  const id = Number.parseInt(button.dataset.id || "", 10);
  const selection = selections.find((item) => item.id === id);
  if (!selection) return;

  if (button.dataset.action === "remove") {
    selections = selections.filter((item) => item.id !== id);
  }

  if (button.dataset.action === "toggle") {
    selection.active = !selection.active;
  }

  update();
};

const init = async () => {
  renderCalendarTimes();
  renderSelections([]);
  renderScheduleSelect([]);
  renderWebtree([]);

  await loadCourses();
  populateSuggestions();

  addButton.addEventListener("click", addSelection);
  buildButton.addEventListener("click", update);
  courseInput.addEventListener("change", () => {
    if (isRecognizedCourseInput(courseInput.value)) {
      addSelection();
    }
  });
  courseInput.addEventListener("keydown", (event) => {
    if (event.key === "Enter") {
      event.preventDefault();
      addSelection();
    }
  });
  scheduleSelectEl.addEventListener("change", (event) => {
    renderSchedulePreview(Number.parseInt(event.target.value || "0", 10));
  });
  selectionListEl.addEventListener("click", handleSelectionAction);
};

init();
