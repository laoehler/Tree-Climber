import { normalize } from "./text.js";

/**
 * Precomputes searchable text for a catalog course.
 *
 * @param {{crn?: string, courseSection?: string, title?: string, department?: string}} course
 * @returns {string}
 */
export const buildCourseSearchBlob = (course) =>
  normalize([
    course.crn,
    course.courseSection,
    course.title,
    course.department
  ].filter(Boolean).join(" "));

const uniqueByCrn = (courses) => {
  const seen = new Set();
  return courses.filter((course) => {
    if (seen.has(course.crn)) return false;
    seen.add(course.crn);
    return true;
  });
};

/**
 * Finds exact and fuzzy matches for a user's selection input.
 *
 * @param {Array<object>} catalog
 * @param {string} raw
 * @returns {Array<object>}
 */
export const getSelectionMatches = (catalog, raw) => {
  const needle = normalize(raw);
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

  return uniqueByCrn([...exactMatches, ...fuzzyMatches]);
};
