import { 
  getRecords, addRecord, updateRecord, deleteRecord, setAllRecords, 
  generateId, sortRecords, getSearchRegex, setSearchRegex, 
  getWeeklyTarget, setWeeklyTarget, getViewMode, setViewMode
} from "./state.js";
import { validateAll, hasDuplicateWords } from "./validators.js";
import { compileRegex, validateRegexPattern } from "./search.js";
import { renderRecords, updateStats, showSearchError } from "./ui.js";
import { exportToJSON, importJSON } from "./storage.js";

let editingId = null;

export function refreshUI() {
  const records = getRecords();
  const regex = getSearchRegex();
  renderRecords(records, regex);
  updateStats(records);
}

function handleSubmit(e) {
  e.preventDefault();
  
  const title = document.getElementById("title").value;
  const description = document.getElementById("description").value;
  const duration = document.getElementById("duration").value;
  const date = document.getElementById("date").value;
  const tag = document.getElementById("tag").value;

  const validation = validateAll(title, duration, date, tag, description);
  
  document.getElementById("titleError").innerHTML = validation.title ? "" : "No leading/trailing spaces (min 3 chars)";
  document.getElementById("durationError").innerHTML = validation.duration ? "" : "Positive number required";
  document.getElementById("dateError").innerHTML = validation.date ? "" : "Valid YYYY-MM-DD date required";
  document.getElementById("tagError").innerHTML = validation.tag ? "" : "Letters, spaces, hyphens only";
  
  if (hasDuplicateWords(description)) {
    const liveAlert = document.getElementById("liveAlert");
    liveAlert.innerHTML = " Duplicate words detected in description";
    setTimeout(() => { if (liveAlert.innerHTML.includes("Duplicate")) liveAlert.innerHTML = ""; }, 3000);
  }
  
  if (!validation.allValid) return;
  
  const now = new Date().toISOString();
  const record = {
    id: editingId || generateId(),
    title: title.trim(),
    description: description.trim(),
    duration: parseFloat(duration),
    date: date,
    tag: tag.trim(),
    createdAt: editingId ? getRecords().find(r => r.id === editingId)?.createdAt || now : now,
    updatedAt: now
  };

  if (editingId) {
    updateRecord(editingId, record);
    editingId = null;
    document.getElementById("submitBtn").innerText = " Add Event";
    document.getElementById("cancelEditBtn").style.display = "none";
  } else {
    addRecord(record);
  }
  
  document.getElementById("eventForm").reset();
  refreshUI();
  
  const liveAlert = document.getElementById("liveAlert");
  liveAlert.innerHTML = " Event saved successfully!";
  setTimeout(() => { if (liveAlert.innerHTML === " Event saved successfully!") liveAlert.innerHTML = ""; }, 2000);
}

function handleEdit(id) {
  const record = getRecords().find(r => r.id === id);
  if (!record) return;
  editingId = id;
  document.getElementById("title").value = record.title;
  document.getElementById("description").value = record.description || "";
  document.getElementById("duration").value = record.duration;
  document.getElementById("date").value = record.date;
  document.getElementById("tag").value = record.tag;
  document.getElementById("submitBtn").innerText = " Update Event";
  document.getElementById("cancelEditBtn").style.display = "inline-block";
  window.scrollTo({ top: 0, behavior: "smooth" });
}

function cancelEdit() {
  editingId = null;
  document.getElementById("eventForm").reset();
  document.getElementById("submitBtn").innerText = "➕ Add Event";
  document.getElementById("cancelEditBtn").style.display = "none";
}

function handleDelete(id) {
  if (confirm("Delete this event?")) {
    deleteRecord(id);
    refreshUI();
  }
}

function handleExport() {
  const data = exportToJSON(getRecords());
  const blob = new Blob([data], { type: "application/json" });
  const url = URL.createObjectURL(blob);
  const a = document.createElement("a");
  a.href = url;
  a.download = `campus_planner_${new Date().toISOString().slice(0, 19)}.json`;
  a.click();
  URL.revokeObjectURL(url);
  
  const liveAlert = document.getElementById("liveAlert");
  liveAlert.innerHTML = " Data exported!";
  setTimeout(() => { if (liveAlert.innerHTML === " Data exported!") liveAlert.innerHTML = ""; }, 2000);
}

function handleImport(file) {
  const reader = new FileReader();
  reader.onload = (e) => {
    try {
      const imported = importJSON(e.target.result);
      setAllRecords(imported);
      refreshUI();
      const liveAlert = document.getElementById("liveAlert");
      liveAlert.innerHTML = `Imported ${imported.length} records!`;
      setTimeout(() => { if (liveAlert.innerHTML.includes("Imported")) liveAlert.innerHTML = ""; }, 3000);
    } catch (err) {
      alert("Import failed: " + err.message);
    }
  };
  reader.readAsText(file);
}

function loadSeed() {
  const seed = [
    { id: generateId(), title: "Math Final Exam", description: "Study chapters 4-6, review practice problems", duration: 180, date: "2026-06-20", tag: "Exam", createdAt: new Date().toISOString(), updatedAt: new Date().toISOString() },
    { id: generateId(), title: "Group Project Meeting", description: "Discuss UI design and split tasks", duration: 90, date: "2026-06-18", tag: "Meeting", createdAt: new Date().toISOString(), updatedAt: new Date().toISOString() },
    { id: generateId(), title: "Gym Session", description: "Cardio and strength training", duration: 60, date: "2026-06-17", tag: "Health", createdAt: new Date().toISOString(), updatedAt: new Date().toISOString() },
    { id: generateId(), title: "Library Study", description: "Finish programming assignment", duration: 120, date: "2026-06-19", tag: "Study", createdAt: new Date().toISOString(), updatedAt: new Date().toISOString() },
    { id: generateId(), title: "Coffee with Mentor", description: "Career advice discussion", duration: 45, date: "2026-06-21", tag: "Networking", createdAt: new Date().toISOString(), updatedAt: new Date().toISOString() },
    { id: generateId(), title: "Physics Lab Report", description: "Write conclusion section", duration: 150, date: "2026-06-22", tag: "Assignment", createdAt: new Date().toISOString(), updatedAt: new Date().toISOString() },
    { id: generateId(), title: "Career Fair", description: "Bring resumes, dress professionally", duration: 240, date: "2026-06-23", tag: "Event", createdAt: new Date().toISOString(), updatedAt: new Date().toISOString() },
    { id: generateId(), title: "Late Night Coding", description: "Fix bugs in final project", duration: 180, date: "2026-06-16", tag: "Study", createdAt: new Date().toISOString(), updatedAt: new Date().toISOString() },
    { id: generateId(), title: "Breakfast Club", description: "Weekly networking breakfast", duration: 30, date: "2026-06-15", tag: "Social", createdAt: new Date().toISOString(), updatedAt: new Date().toISOString() },
    { id: generateId(), title: "Thesis Writing", description: "Write literature review section meeting meeting", duration: 200, date: "2026-06-24", tag: "Research", createdAt: new Date().toISOString(), updatedAt: new Date().toISOString() },
    { id: generateId(), title: "Study Study Session", description: "Prepare for final exams", duration: 120, date: "2026-06-25", tag: "Study", createdAt: new Date().toISOString(), updatedAt: new Date().toISOString() },
    { id: generateId(), title: "Hackathon Prep", description: "Team meeting to plan project", duration: 75, date: "2026-06-26", tag: "Coding", createdAt: new Date().toISOString(), updatedAt: new Date().toISOString() }
  ];
  
  setAllRecords(seed);
  refreshUI();
  
  const liveAlert = document.getElementById("liveAlert");
  liveAlert.innerHTML = " Seed data loaded! 12 events added.";
  setTimeout(() => { if (liveAlert.innerHTML === " Seed data loaded! 12 events added.") liveAlert.innerHTML = ""; }, 3000);
}

function handleClearData() {
  if (confirm(" WARNING: This will delete ALL your events. Are you sure?")) {
    if (confirm("Type 'DELETE' to confirm:")) {
      setAllRecords([]);
      refreshUI();
      document.getElementById("eventForm").reset();
      const liveAlert = document.getElementById("liveAlert");
      liveAlert.innerHTML = " All data cleared.";
      setTimeout(() => { if (liveAlert.innerHTML === " All data cleared.") liveAlert.innerHTML = ""; }, 3000);
    }
  }
}

function toggleViewMode() {
  const newMode = getViewMode() === "card" ? "table" : "card";
  setViewMode(newMode);
  const toggleBtn = document.getElementById("toggleViewBtn");
  if (toggleBtn) {
    toggleBtn.innerHTML = newMode === "card" ? " Switch to Table View" : " Switch to Card View";
  }
  refreshUI();
}

function init() {
  refreshUI();
  
  document.getElementById("eventForm").addEventListener("submit", handleSubmit);
  document.getElementById("cancelEditBtn").addEventListener("click", cancelEdit);
  document.getElementById("exportBtn").addEventListener("click", handleExport);
  document.getElementById("importBtn").addEventListener("click", () => document.getElementById("importFileInput").click());
  document.getElementById("importFileInput").addEventListener("change", (e) => {
    if (e.target.files[0]) handleImport(e.target.files[0]);
  });
  document.getElementById("seedDataBtn").addEventListener("click", loadSeed);
  document.getElementById("clearDataBtn").addEventListener("click", handleClearData);
  document.getElementById("toggleViewBtn").addEventListener("click", toggleViewMode);
  
  document.getElementById("setTargetBtn").addEventListener("click", () => {
    const val = parseInt(document.getElementById("weeklyTarget").value);
    if (!isNaN(val) && val >= 0) setWeeklyTarget(val);
    refreshUI();
  });
  
  const searchInput = document.getElementById("regexSearch");
  if (searchInput) {
    searchInput.addEventListener("input", (e) => {
      const pattern = e.target.value;
      const validation = validateRegexPattern(pattern);
      if (!validation.valid && pattern !== "") {
        showSearchError(validation.error);
        setSearchRegex(null);
      } else {
        const regex = compileRegex(pattern);
        setSearchRegex(regex);
      }
      refreshUI();
    });
  }
  
  document.querySelectorAll("[data-sort]").forEach(btn => {
    btn.addEventListener("click", (e) => {
      sortRecords(e.target.dataset.sort);
      refreshUI();
    });
  });
  
  document.getElementById("recordsList").addEventListener("click", (e) => {
    if (e.target.classList.contains("edit-btn") || e.target.classList.contains("edit-btn-small")) {
      handleEdit(e.target.dataset.id);
    }
    if (e.target.classList.contains("delete-btn") || e.target.classList.contains("delete-btn-small")) {
      handleDelete(e.target.dataset.id);
    }
  });
  
  document.getElementById("weeklyTarget").value = getWeeklyTarget() || "";
  
  const toggleBtn = document.getElementById("toggleViewBtn");
  if (toggleBtn) {
    toggleBtn.innerHTML = getViewMode() === "card" ? " Switch to Table View" : " Switch to Card View";
  }
  
  // Dark mode
  const themeToggle = document.getElementById("themeToggle");
  if (themeToggle) {
    const savedTheme = localStorage.getItem("theme");
    if (savedTheme === "dark") {
      document.body.classList.add("dark");
      themeToggle.innerHTML = "☀️ Light Mode";
    }
    themeToggle.addEventListener("click", () => {
      document.body.classList.toggle("dark");
      if (document.body.classList.contains("dark")) {
        themeToggle.innerHTML = "☀️ Light Mode";
        localStorage.setItem("theme", "dark");
      } else {
        themeToggle.innerHTML = "🌙 Dark Mode";
        localStorage.setItem("theme", "light");
      }
    });
  }
}

init();