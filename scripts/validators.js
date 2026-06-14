// ========== REGEX VALIDATION RULES ==========
// Rule 1: Title - no leading/trailing spaces, no double spaces inside
export function validateTitle(title) {
  const regex = /^\S(?:.*\S)?$/; 
  return regex.test(title) && title.length >= 3;
}

// Rule 2: Duration - positive number, optional 2 decimals
export function validateDuration(duration) {
  const regex = /^(0|[1-9]\d*)(\.\d{1,2})?$/;
  return regex.test(duration) && parseFloat(duration) > 0;
}

// Rule 3: Date - strict YYYY-MM-DD with valid actual dates (no rollover)
export function validateDate(date) {
  const regex = /^\d{4}-(0[1-9]|1[0-2])-(0[1-9]|[12]\d|3[01])$/;
  if (!regex.test(date)) return false;
  
  // Strict validation to reject invalid dates like 2025-02-30
  const [year, month, day] = date.split('-').map(Number);
  const testDate = new Date(year, month - 1, day);
  
  // Check if the date matches (prevents rollover like Feb 30 -> Mar 2)
  return testDate.getFullYear() === year && 
         testDate.getMonth() === month - 1 && 
         testDate.getDate() === day;
}

// Rule 4: Tag - letters, spaces, hyphens only (no numbers or special chars)
export function validateTag(tag) {
  const regex = /^[A-Za-z]+(?:[ -][A-Za-z]+)*$/;
  return regex.test(tag) && tag.length >= 2;
}

// Rule 5: Description (optional but validates if provided)
export function validateDescription(desc) {
  if (!desc || desc.trim() === "") return true; // optional field
  const regex = /^[\w\s.,!?\-':;()]+$/; // safe punctuation only
  return regex.test(desc);
}

// ========== ADVANCED REGEX (Back-reference) ==========
// Detects duplicate words (e.g., "meeting meeting", "study study")
export function hasDuplicateWords(text) {
  if (!text) return false;
  const dupRegex = /\b(\w+)\s+\1\b/i;
  return dupRegex.test(text);
}

// ========== COMPREHENSIVE VALIDATION ==========
export function validateAll(title, duration, date, tag, description = "") {
  const titleValid = validateTitle(title);
  const durationValid = validateDuration(duration);
  const dateValid = validateDate(date);
  const tagValid = validateTag(tag);
  const descValid = validateDescription(description);
  
  return {
    title: titleValid,
    duration: durationValid,
    date: dateValid,
    tag: tagValid,
    description: descValid,
    allValid: titleValid && durationValid && dateValid && tagValid && descValid
  };
}

// Get user-friendly error messages
export function getErrorMessage(field, value) {
  switch(field) {
    case 'title':
      if (!value || value.trim() === "") return "Title is required";
      if (value.length < 3) return "Title must be at least 3 characters";
      if (/^\s|\s$/.test(value)) return "Title cannot start or end with spaces";
      return "Invalid title format";
    case 'duration':
      if (!value) return "Duration is required";
      if (parseFloat(value) <= 0) return "Duration must be greater than 0";
      return "Enter a positive number (e.g., 90 or 90.50)";
    case 'date':
      if (!value) return "Date is required";
      return "Use YYYY-MM-DD format (e.g., 2025-09-29)";
    case 'tag':
      if (!value || value.trim() === "") return "Tag is required";
      if (value.length < 2) return "Tag must be at least 2 characters";
      if (/[0-9]/.test(value)) return "Tag cannot contain numbers";
      return "Use only letters, spaces, and hyphens";
    default:
      return "Invalid input";
  }
}