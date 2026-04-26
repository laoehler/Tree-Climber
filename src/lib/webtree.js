import { conflictBetween } from "./scheduling.js";
import { getSelectionDisplayCourse } from "./coursePresentation.js";

const selectionsConflict = (selectionA, selectionB) => {
  const courseA = selectionA?.resolvedCourse;
  const courseB = selectionB?.resolvedCourse;

  if (!courseA || !courseB) return false;
  return conflictBetween(courseA, courseB);
};

const pickNextSelection = (candidates, usedIds, blockedSelections = []) =>
  candidates.find((candidate) => {
    if (!candidate || usedIds.has(candidate.id)) return false;

    return blockedSelections.every((blockedSelection) => !selectionsConflict(candidate, blockedSelection));
  }) || null;

const buildPrimaryTree = (title, selections, offset) => {
  const candidates = selections.slice(offset);
  const root = candidates[0] || null;
  const usedIds = new Set(root ? [root.id] : []);

  const choice2 = pickNextSelection(candidates, usedIds, [root]);
  if (choice2) usedIds.add(choice2.id);

  const choice5 = pickNextSelection(candidates, usedIds, [root, choice2]);
  if (choice5) usedIds.add(choice5.id);

  const choice6 = pickNextSelection(candidates, usedIds, [choice5]);
  if (choice6) usedIds.add(choice6.id);

  const choice4 = pickNextSelection(candidates, usedIds, [choice2, choice5]);
  if (choice4) usedIds.add(choice4.id);

  const choice7 = pickNextSelection(candidates, usedIds, [choice5, choice4]);
  if (choice7) usedIds.add(choice7.id);

  return {
    title,
    choices: [root, choice2, choice5, choice4, choice5, choice4, choice7]
  };
};

/**
 * Builds the Webtree preview data from active selections and the chosen schedule.
 *
 * @param {Array<object>} selections
 * @param {Array<object>} schedule
 * @param {Map<number, Array<object>>} selectionMatchesById
 * @returns {Array<{title: string, choices: Array<object | null>}>}
 */
export const buildTrees = (selections, schedule, selectionMatchesById) => {
  const activeSelections = selections.filter((selection) => selection.active);
  if (!activeSelections.length) return [];

  const resolvedSelections = activeSelections.map((selection) => {
    const matches = selectionMatchesById.get(selection.id) || [];
    const scheduledCourse = schedule.find((course) =>
      matches.some((match) => match.crn === course.crn)
    );

    return {
      ...selection,
      resolvedCourse: scheduledCourse || getSelectionDisplayCourse(matches, selection.course)
    };
  });

  const fallbackTree = (title, offset, size) => ({
    title,
    choices: Array.from({ length: size }, (_, index) => resolvedSelections[offset + index] || null)
  });

  return [
    buildPrimaryTree("Tree 1", resolvedSelections, 0),
    buildPrimaryTree("Tree 2", resolvedSelections, 1),
    buildPrimaryTree("Tree 3", resolvedSelections, 2),
    fallbackTree("Tree 4", 3, 10)
  ];
};
