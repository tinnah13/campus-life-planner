const STORAGE_KEY = "campusPlannerData";

export function loadData() {
  const raw = localStorage.getItem(STORAGE_KEY);
  if (!raw) return [];
  try {
    const data = JSON.parse(raw);
    return Array.isArray(data) ? data : [];
  } catch {
    return [];
  }
}

export function saveData(records) {
  localStorage.setItem(STORAGE_KEY, JSON.stringify(records));
}

export function exportToJSON(records) {
  return JSON.stringify(records, null, 2);
}

export function importJSON(jsonString) {
  try {
    const parsed = JSON.parse(jsonString);
    if (!Array.isArray(parsed)) throw new Error("Data must be an array");
    
    // Validate each record has required fields
    const isValid = parsed.every(rec => 
      rec.id && 
      rec.title && 
      rec.duration !== undefined && 
      rec.date && 
      rec.tag
    );
    
    if (!isValid) throw new Error("Invalid record structure: missing required fields");
    
    return parsed;
  } catch (e) {
    throw new Error("Invalid JSON file: " + e.message);
  }
}