import { createClient } from "https://cdn.jsdelivr.net/npm/@supabase/supabase-js/+esm";
import { buildCourseSearchBlob, buildRankedSchedules, buildTrees, getSelectionMatches, normalize, parseTimeRange } from "./lib/courseUtils.js";
import { createRoot, e, useEffect, useMemo, useState } from "./ui/react.js";
import { CourseInputPanel } from "./components/CourseInputPanel.js";
import { Hero } from "./components/Hero.js";
import { SchedulesSection } from "./components/SchedulesSection.js";
import { WebtreeSection } from "./components/WebtreeSection.js";

const supabase = createClient(
  "https://csotlkemhfrucmubopsr.supabase.co",
  "sb_publishable_k25RlLfIDRTbeQrncvPopw_hB68GuIS"
);

function App() {
  const [catalog, setCatalog] = useState([]);
  const [status, setStatus] = useState("Loading course catalog...");
  const [inputValue, setInputValue] = useState("");
  const [selectionId, setSelectionId] = useState(0);
  const [selections, setSelections] = useState([]);
  const [selectedScheduleIndex, setSelectedScheduleIndex] = useState(0);

  useEffect(() => {
    let active = true;

    const loadCourses = async () => {
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

      if (!active) return;

      if (error) {
        setStatus(error.message);
        return;
      }

      const nextCatalog = (data || []).map((course) => {
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

      setCatalog(nextCatalog);
      setStatus(`Loaded ${nextCatalog.length} courses from the backend.`);
    };

    loadCourses();

    return () => {
      active = false;
    };
  }, []);

  const suggestions = useMemo(
    () => [...new Set(catalog.map((course) => course.title).filter(Boolean))].sort((a, b) => a.localeCompare(b)),
    [catalog]
  );

  const selectionMatchesById = useMemo(() => {
    const matches = new Map();
    selections.forEach((selection) => {
      matches.set(selection.id, getSelectionMatches(catalog, selection.raw));
    });
    return matches;
  }, [catalog, selections]);

  const scheduleResults = useMemo(() => {
    const activeSelections = selections.filter((selection) => selection.active);
    const results = activeSelections.map((selection) => ({
      selection,
      matches: selectionMatchesById.get(selection.id) || []
    }));

    return {
      activeSelections,
      results,
      schedules: buildRankedSchedules(results)
    };
  }, [selectionMatchesById, selections]);

  useEffect(() => {
    if (selectedScheduleIndex >= scheduleResults.schedules.length) {
      setSelectedScheduleIndex(0);
    }
  }, [scheduleResults.schedules.length, selectedScheduleIndex]);

  const selectedSchedule = scheduleResults.schedules[selectedScheduleIndex] || [];

  const webtreeTrees = useMemo(
    () => buildTrees(selections, selectedSchedule, selectionMatchesById),
    [selections, selectedSchedule, selectionMatchesById]
  );

  const scheduleSummary = useMemo(() => {
    if (!scheduleResults.activeSelections.length) {
      return "Add courses to generate schedules.";
    }

    const unmatchedSelections = scheduleResults.results.filter((result) => result.matches.length === 0);
    const matchedCount = scheduleResults.activeSelections.length - unmatchedSelections.length;
    const matchedLabel = matchedCount === 1 ? "1 selection matched" : `${matchedCount} selections matched`;
    const scheduleCountLabel =
      scheduleResults.schedules.length === 1
        ? "1 schedule generated"
        : `${scheduleResults.schedules.length} schedules generated`;

    if (unmatchedSelections.length) {
      return `${matchedLabel}. ${scheduleCountLabel}. ${unmatchedSelections.length} selections did not match the backend catalog.`;
    }

    return `${matchedLabel}. ${scheduleCountLabel} from backend course data.`;
  }, [scheduleResults]);

  const addSelection = () => {
    const raw = inputValue.trim();
    if (!raw) return;

    const matches = getSelectionMatches(catalog, raw);
    const exactMatch = matches.find((course) =>
      normalize(course.title) === normalize(raw) ||
      normalize(course.courseSection) === normalize(raw) ||
      normalize(course.crn) === normalize(raw)
    ) || matches[0] || null;

    const displayTitle = exactMatch ? exactMatch.title : raw;
    const displaySection = exactMatch ? exactMatch.courseSection : "";

    const duplicate = selections.some((selection) => normalize(selection.raw) === normalize(raw));
    if (duplicate) {
      setStatus("That course is already in your list.");
      setInputValue("");
      return;
    }

    setSelections((current) => [
      ...current,
      {
        id: selectionId,
        raw,
        active: true,
        displayTitle,
        displaySection,
        course: exactMatch
      }
    ]);
    setSelectionId((current) => current + 1);
    setInputValue("");
    setSelectedScheduleIndex(0);
    setStatus(`Added "${displayTitle}".`);
  };

  const removeSelection = (id) => {
    setSelections((current) => current.filter((selection) => selection.id !== id));
    setSelectedScheduleIndex(0);
  };

  const buildSchedules = () => {
    setSelectedScheduleIndex(0);
    setStatus("Schedules refreshed from your current backend-backed selections.");
  };

  return e(
    "main",
    { className: "page" },
    e(Hero),
    e(CourseInputPanel, {
      inputValue,
      onInputChange: setInputValue,
      onAdd: addSelection,
      onBuild: buildSchedules,
      status,
      suggestions,
      selections,
      selectionMatchesById,
      onRemoveSelection: removeSelection
    }),
    e(WebtreeSection, { trees: webtreeTrees }),
    e(SchedulesSection, {
      schedules: scheduleResults.schedules,
      selectedScheduleIndex,
      onSelectSchedule: setSelectedScheduleIndex,
      summary: scheduleSummary,
      selectedSchedule
    })
  );
}

const root = createRoot(document.getElementById("root"));
root.render(e(App));
