import { useEffect, useMemo, useState } from "react";
import {
  buildRankedSchedules,
  buildTrees,
  getSelectionMatches,
  normalize
} from "./lib/index.js";
import { CourseInputPanel } from "./components/CourseInputPanel.jsx";
import { HelpModal } from "./components/HelpModal.jsx";
import { Hero } from "./components/Hero.jsx";
import { SchedulesSection } from "./components/SchedulesSection.jsx";
import { WebtreeSection } from "./components/WebtreeSection.jsx";
import { loadCatalog } from "./services/catalog.js";

export default function App() {
  const [catalog, setCatalog] = useState([]);
  const [status, setStatus] = useState("Loading course catalog...");
  const [inputValue, setInputValue] = useState("");
  const [selectionId, setSelectionId] = useState(0);
  const [selections, setSelections] = useState([]);
  const [selectedScheduleIndex, setSelectedScheduleIndex] = useState(0);

  useEffect(() => {
    let active = true;

    const loadCourses = async () => {
      const { catalog: nextCatalog, error } = await loadCatalog();

      if (!active) return;

      if (error) {
        setStatus(error.message);
        return;
      }

      setCatalog(nextCatalog);
      setStatus(`Loaded ${nextCatalog.length} courses from the backend.`);
    };

    loadCourses();

    return () => {
      active = false;
    };
  }, []);

  const suggestions = useMemo(
    () =>
      catalog
        .filter((course) => course.title)
        .map((course) => ({
          label: [course.title, course.courseSection, course.crn].filter(Boolean).join(" · "),
          value: course.courseSection || course.crn || course.title
        }))
        .sort((a, b) => a.label.localeCompare(b.label)),
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
    const exactMatch =
      matches.find(
        (course) =>
          normalize(course.title) === normalize(raw) ||
          normalize(course.courseSection) === normalize(raw) ||
          normalize(course.crn) === normalize(raw)
      ) ||
      matches[0] ||
      null;

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

  const reorderSelections = (newSelections) => {
    setSelections(newSelections);
  };

  const buildSchedules = () => {
    setSelectedScheduleIndex(0);
    setStatus("Schedules refreshed from your current backend-backed selections.");
  };

  return (
    <>
      <main className="page">
        <Hero />
        <CourseInputPanel
          inputValue={inputValue}
          onInputChange={setInputValue}
          onAdd={addSelection}
          onBuild={buildSchedules}
          status={status}
          suggestions={suggestions}
          selections={selections}
          selectionMatchesById={selectionMatchesById}
          onRemoveSelection={removeSelection}
          onReorderSelections={reorderSelections}
        />
        <WebtreeSection trees={webtreeTrees} />
        <SchedulesSection
          schedules={scheduleResults.schedules}
          selectedScheduleIndex={selectedScheduleIndex}
          onSelectSchedule={setSelectedScheduleIndex}
          summary={scheduleSummary}
          selectedSchedule={selectedSchedule}
          selections={selections}
        />
      </main>
    </>
  );
}
