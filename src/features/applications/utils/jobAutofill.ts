import type { ParsedJobResult } from './urlJobParser.ts';

export interface JobFields {
  companyName: string;
  jobTitle: string;
  url: string;
  salary: string;
  location: string;
  source: string;
  jobDescription: string;
  deadline: string;
}

const FIELDS: (keyof JobFields)[] = ['companyName', 'jobTitle', 'url', 'salary', 'location', 'source', 'jobDescription', 'deadline'];

export function mergeJobAutofill<T extends JobFields>(current: T, parsed: ParsedJobResult, previous: Partial<JobFields>, reset = false) {
  const fields = { ...current };
  const automatic = { ...previous };
  for (const key of FIELDS) {
    const owned = previous[key] !== undefined && current[key] === previous[key];
    if (reset && owned) { fields[key] = ''; delete automatic[key]; }
    const incoming = parsed[key];
    if (typeof incoming === 'string' && incoming.trim() && (!fields[key] || owned)) {
      fields[key] = incoming;
      automatic[key] = incoming;
    }
  }
  return { fields, automatic };
}
