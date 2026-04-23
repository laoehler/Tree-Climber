import { createClient } from "@supabase/supabase-js";
import { buildCourseSearchBlob, parseTimeRange } from "../lib/index.js";

const supabaseUrl =
  import.meta.env.VITE_SUPABASE_URL ?? "https://csotlkemhfrucmubopsr.supabase.co";
const supabaseAnonKey =
  import.meta.env.VITE_SUPABASE_ANON_KEY ??
  "sb_publishable_k25RlLfIDRTbeQrncvPopw_hB68GuIS";

const supabase = createClient(supabaseUrl, supabaseAnonKey);

const COURSE_QUERY = `
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
`;

const normalizeCatalogCourse = (course) => {
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
};

/**
 * Loads the course catalog from Supabase and reshapes it for the UI.
 *
 * @returns {Promise<{catalog: Array<object>, error: Error | null}>}
 */
export async function loadCatalog() {
  const { data, error } = await supabase.from("course").select(COURSE_QUERY);

  if (error) {
    return {
      catalog: [],
      error
    };
  }

  return {
    catalog: (data || []).map(normalizeCatalogCourse),
    error: null
  };
}
