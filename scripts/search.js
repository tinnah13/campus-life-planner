export function compileRegex(pattern) {
  if (!pattern || pattern.trim() === "") return null;
  try {
    // Test if regex is valid
    new RegExp(pattern, "i");
    return new RegExp(pattern, "i");
  } catch (error) {
    console.warn("Invalid regex:", error.message);
    return null;
  }
}

export function highlightMatches(text, regex) {
  if (!regex || !text || typeof text !== "string") return text || "";
  try {
    return text.replace(regex, match => `<mark class="highlight">${escapeHtml(match)}</mark>`);
  } catch {
    return text;
  }
}

// Helper to prevent XSS
function escapeHtml(str) {
  return str.replace(/[&<>]/g, function(m) {
    if (m === '&') return '&amp;';
    if (m === '<') return '&lt;';
    if (m === '>') return '&gt;';
    return m;
  });
}

export function filterRecords(records, regex) {
  if (!regex) return records;
  return records.filter(rec => {
    const searchable = `${rec.title} ${rec.description || ""} ${rec.tag}`.toLowerCase();
    // Test against regex (case-insensitive handled by regex flag)
    try {
      return regex.test(rec.title) || 
             regex.test(rec.description || "") || 
             regex.test(rec.tag);
    } catch {
      return false;
    }
  });
}

export function validateRegexPattern(pattern) {
  if (!pattern) return { valid: true, error: null };
  try {
    new RegExp(pattern, "i");
    return { valid: true, error: null };
  } catch (error) {
    return { valid: false, error: error.message };
  }
}