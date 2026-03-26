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

let catalog = [];
let selections = [];
let selectionId = 0;
let latestSchedules = [];

const DAYS = ["M", "T", "W", "R", "F"];
const MAX_SCHEDULES = 50;

const normalize = (v) => v.toLowerCase().replace(/\s+/g, " ").trim();

const loadCourses = async () => {
  const { data, error } = await supabase
    .from("course")
    .select(`
      crn,
      course_code,
      course_title,
      meeting:meeting (
        weekdays,
        class_time,
        room
      )
    `)

  if (error) {
    console.error(error);
    statusEl.textContent = error.message;
    return;
  }

  catalog = data.map(course => ({
    crn: course.crn,
    courseSection: course.course_code,
    title: course.course_title,
    meetings: (course.meeting || []).map(m => ({
      days: m.weekdays,
      time: m.class_time,
      room: m.room
    }))
  }));
};

const parseTimeRange = (time) => {
  if (!time || time.toUpperCase() === "TBA") return null;
  const [a, b] = time.split("-");
  if (!b) return null;

  const p = (t) => {
    const m = t.trim().match(/(\d{1,2}):(\d{2})\s*(AM|PM)/i);
    if (!m) return null;
    let h = +m[1];
    const min = +m[2];
    if (m[3].toUpperCase() === "PM" && h !== 12) h += 12;
    if (m[3].toUpperCase() === "AM" && h === 12) h = 0;
    return h * 60 + min;
  };

  return { start: p(a), end: p(b) };
};

<<<<<<< Updated upstream
const populateSuggestions = () => {
  suggestionsEl.innerHTML = catalog
    .map(c => `<option value="${c.courseSection} - ${c.title}"></option>`)
    .join("");
=======
const expandDays = (days) => {
  if (!days || days.toUpperCase() === "TBA") return [];
  return DAYS.filter((day) => days.includes(day)); 
>>>>>>> Stashed changes
};

const expandDays = (days) =>
  days && days !== "TBA" ? DAYS.filter(d => days.includes(d)) : [];

const getPrimaryMeeting = (c) => c.meetings[0];

const baseCourse = (cs) => cs.split("-").slice(0, 2).join("-");

const conflictBetween = (a, b) => {
  const mA = getPrimaryMeeting(a);
  const mB = getPrimaryMeeting(b);

  const shared = expandDays(mA.days).filter(d =>
    expandDays(mB.days).includes(d)
  );
  if (!shared.length) return null;

  const tA = parseTimeRange(mA.time);
  const tB = parseTimeRange(mB.time);
  if (!tA || !tB) return null;

  if (tA.start < tB.end && tB.start < tA.end) return true;
  return null;
};

const hasConflict = (schedule, course) =>
  schedule.some(existing =>
    conflictBetween(existing, course) ||
    baseCourse(existing.courseSection) === baseCourse(course.courseSection)
  );

const buildMatches = (list) =>
  list.map(sel => {
    const needle = normalize(sel.raw);
    return {
      selection: sel,
      matches: catalog.filter(c =>
        normalize(c.courseSection) === needle ||
        normalize(c.title).includes(needle)
      )
    };
  });

const buildRankedSchedules = (results) => {
  const out = [];

  const dfs = (i, curr) => {
    if (i === results.length) {
      out.push([...curr]);
      return;
    }

    dfs(i + 1, curr);

    results[i].matches.forEach(c => {
      if (!hasConflict(curr, c)) {
        curr.push(c);
        dfs(i + 1, curr);
        curr.pop();
      }
    });
  };

  dfs(0, []);
  return out.slice(0, MAX_SCHEDULES);
};

const renderSchedules = (schedules) => {
  schedulesEl.innerHTML = schedules.length
    ? schedules.map((s, i) =>
        `<div><h3>Schedule ${i + 1}</h3>${
          s.map(c => `<div>${c.courseSection}</div>`).join("")
        }</div>`
      ).join("")
    : "<p>No schedules</p>";
};

const addSelection = () => {
  const raw = courseInput.value.trim();
  if (!raw) return;
  selections.push({ id: selectionId++, raw, active: true });
  courseInput.value = "";
};

const update = () => {
  const results = buildMatches(selections);
  const schedules = buildRankedSchedules(results);
  latestSchedules = schedules;
  renderSchedules(schedules);
};

const init = async () => {
  await loadCourses();
  populateSuggestions();
  addButton.onclick = addSelection;
  buildButton.onclick = update;
};

init();