// ========== STORAGE ==========
const STORAGE_KEY = "campusPlanner";

function loadRecords() {
  const data = localStorage.getItem(STORAGE_KEY);
  return data ? JSON.parse(data) : [];
}

function saveRecords(records) {
  localStorage.setItem(STORAGE_KEY, JSON.stringify(records));
  displayRecords(records);
  updateDashboard();
}

// ========== DISPLAY RECORDS ==========
function displayRecords(recordsToShow = null) {
  const records = recordsToShow || loadRecords();
  const container = document.getElementById("recordsList");
  
  if (records.length === 0) {
    container.innerHTML = '<p class="empty-message">No events yet. Add one above!</p>';
    return;
  }
  
  container.innerHTML = records.map(record => `
    <div class="event-card">
      <div class="event-title">${escapeHtml(record.title)}</div>
      <div class="event-meta">
        ${record.date} | ${record.duration} min | ${escapeHtml(record.tag)}
      </div>
      ${record.description ? `<div class="event-meta">${escapeHtml(record.description)}</div>` : ''}
      <button onclick="deleteRecord('${record.id}')" class="danger-btn" style="margin-top:10px; padding:5px 10px;">Delete</button>
    </div>
  `).join('');
}

function escapeHtml(text) {
  if (!text) return '';
  return text.replace(/[&<>]/g, function(m) {
    if (m === '&') return '&amp;';
    if (m === '<') return '&lt;';
    if (m === '>') return '&gt;';
    return m;
  });
}

// ========== DASHBOARD ==========
function updateDashboard() {
  const records = loadRecords();
  const target = parseInt(localStorage.getItem("weeklyTarget")) || 0;
  
  const totalTasks = records.length;
  document.getElementById("totalTasks").innerText = totalTasks;
  
  const totalDuration = records.reduce((sum, r) => sum + parseFloat(r.duration || 0), 0);
  document.getElementById("totalDuration").innerHTML = totalDuration.toFixed(0) + ' <span style="font-size:0.8rem;">min</span>';
  
  const tagCount = {};
  records.forEach(r => { tagCount[r.tag] = (tagCount[r.tag] || 0) + 1; });
  let topTag = "—";
  let maxCount = 0;
  for (let [tag, count] of Object.entries(tagCount)) {
    if (count > maxCount) { maxCount = count; topTag = tag; }
  }
  document.getElementById("topTag").innerText = topTag;
  
  const today = new Date();
  const last7Days = records.filter(r => {
    const recordDate = new Date(r.date);
    const daysDiff = (today - recordDate) / (1000 * 3600 * 24);
    return daysDiff <= 7 && daysDiff >= 0;
  });
  const weeklyTotal = last7Days.reduce((sum, r) => sum + parseFloat(r.duration), 0);
  const percentage = target > 0 ? Math.min(100, (weeklyTotal / target) * 100) : 0;
  
  if (!target || target === 0) {
    document.getElementById("targetStatus").innerHTML = "Not set";
    document.getElementById("progressText").innerHTML = "Set a target";
    document.getElementById("progressFill").style.width = "0%";
  } else {
    document.getElementById("targetStatus").innerHTML = `${weeklyTotal}/${target} min`;
    document.getElementById("progressText").innerHTML = `${weeklyTotal} / ${target} min (${percentage.toFixed(0)}%)`;
    document.getElementById("progressFill").style.width = `${percentage}%`;
    
    const liveAlert = document.getElementById("liveAlert");
    if (weeklyTotal >= target) {
      liveAlert.style.display = "block";
      liveAlert.innerHTML = "Congratulations! You've reached your weekly target!";
      liveAlert.style.background = "#dcfce7";
      setTimeout(() => { liveAlert.style.display = "none"; }, 3000);
    } else if (weeklyTotal > 0) {
      liveAlert.style.display = "block";
      liveAlert.innerHTML = `You need ${target - weeklyTotal} more minutes this week.`;
      liveAlert.style.background = "#fef3c7";
      setTimeout(() => { liveAlert.style.display = "none"; }, 3000);
    }
  }
}

// ========== VALIDATION ==========
function validateTitle(title) {
  return /^\S(?:.*\S)?$/.test(title) && title.length >= 3;
}

function validateDuration(duration) {
  return /^(0|[1-9]\d*)(\.\d{1,2})?$/.test(duration) && parseFloat(duration) > 0;
}

function validateDate(date) {
  return /^\d{4}-(0[1-9]|1[0-2])-(0[1-9]|[12]\d|3[01])$/.test(date);
}

function validateTag(tag) {
  return /^[A-Za-z]+(?:[ -][A-Za-z]+)*$/.test(tag) && tag.length >= 2;
}

// ========== ADD EVENT ==========
function addEvent(event) {
  event.preventDefault();
  
  const title = document.getElementById("title").value;
  const description = document.getElementById("description").value;
  const duration = document.getElementById("duration").value;
  const date = document.getElementById("date").value;
  const tag = document.getElementById("tag").value;
  
  let isValid = true;
  
  if (!validateTitle(title)) {
    document.getElementById("titleError").innerText = "Title: no leading/trailing spaces, min 3 chars";
    isValid = false;
  } else {
    document.getElementById("titleError").innerText = "";
  }
  
  if (!validateDuration(duration)) {
    document.getElementById("durationError").innerText = "Duration: positive number required";
    isValid = false;
  } else {
    document.getElementById("durationError").innerText = "";
  }
  
  if (!validateDate(date)) {
    document.getElementById("dateError").innerText = "Date: use YYYY-MM-DD format";
    isValid = false;
  } else {
    document.getElementById("dateError").innerText = "";
  }
  
  if (!validateTag(tag)) {
    document.getElementById("tagError").innerText = "Tag: letters, spaces, hyphens only";
    isValid = false;
  } else {
    document.getElementById("tagError").innerText = "";
  }
  
  if (!isValid) return;
  
  const records = loadRecords();
  const newRecord = {
    id: Date.now().toString(),
    title: title.trim(),
    description: description.trim(),
    duration: parseFloat(duration),
    date: date,
    tag: tag.trim(),
    createdAt: new Date().toISOString()
  };
  
  records.push(newRecord);
  saveRecords(records);
  
  document.getElementById("eventForm").reset();
  document.getElementById("formMessage").innerHTML = '<div class="success">Event added successfully!</div>';
  setTimeout(() => document.getElementById("formMessage").innerHTML = "", 2000);
}

// ========== DELETE EVENT ==========
window.deleteRecord = function(id) {
  if (confirm("Delete this event?")) {
    const records = loadRecords();
    const filtered = records.filter(r => r.id !== id);
    saveRecords(filtered);
  }
};

// ========== SORT FUNCTIONS ==========
function sortByTitle() {
  const records = loadRecords();
  records.sort((a, b) => a.title.localeCompare(b.title));
  displayRecords(records);
  document.getElementById("searchHelp").innerHTML = 'Sorted by Title ✓';
  setTimeout(() => {
    if (document.getElementById("searchHelp").innerHTML === 'Sorted by Title ✓') {
      document.getElementById("searchHelp").innerHTML = 'Try: ^Study (starts with), @exam|meeting (contains Exam or Meeting)';
    }
  }, 2000);
}

function sortByDate() {
  const records = loadRecords();
  records.sort((a, b) => new Date(a.date) - new Date(b.date));
  displayRecords(records);
  document.getElementById("searchHelp").innerHTML = 'Sorted by Date ✓';
  setTimeout(() => {
    if (document.getElementById("searchHelp").innerHTML === 'Sorted by Date ✓') {
      document.getElementById("searchHelp").innerHTML = 'Try: ^Study (starts with), @exam|meeting (contains Exam or Meeting)';
    }
  }, 2000);
}

function sortByDuration() {
  const records = loadRecords();
  records.sort((a, b) => a.duration - b.duration);
  displayRecords(records);
  document.getElementById("searchHelp").innerHTML = 'Sorted by Duration ✓';
  setTimeout(() => {
    if (document.getElementById("searchHelp").innerHTML === 'Sorted by Duration ✓') {
      document.getElementById("searchHelp").innerHTML = 'Try: ^Study (starts with), @exam|meeting (contains Exam or Meeting)';
    }
  }, 2000);
}

// ========== REGEX SEARCH WITH HIGHLIGHTING ==========
function searchEvents() {
  const pattern = document.getElementById("regexSearch").value;
  const records = loadRecords();
  const container = document.getElementById("recordsList");
  
  if (!pattern.trim()) {
    displayRecords(records);
    document.getElementById("searchHelp").innerHTML = 'Try: ^Study (starts with), @exam|meeting (contains Exam or Meeting)';
    document.getElementById("searchHelp").style.color = "#888";
    return;
  }
  
  let regex;
  try {
    regex = new RegExp(pattern, "i");
    document.getElementById("searchHelp").innerHTML = 'Valid regex pattern ✓';
    document.getElementById("searchHelp").style.color = "#10b981";
  } catch (error) {
    document.getElementById("searchHelp").innerHTML = `Invalid regex: ${error.message}`;
    document.getElementById("searchHelp").style.color = "#ef4444";
    return;
  }
  
  const filtered = records.filter(record => 
    regex.test(record.title) || 
    regex.test(record.description || "") || 
    regex.test(record.tag)
  );
  
  if (filtered.length === 0) {
    container.innerHTML = '<p class="empty-message">No matching events found.</p>';
    return;
  }
  
  function highlightText(text) {
    if (!text) return text;
    return text.replace(regex, match => `<mark class="search-highlight">${match}</mark>`);
  }
  
  container.innerHTML = filtered.map(record => `
    <div class="event-card">
      <div class="event-title">${highlightText(escapeHtml(record.title))}</div>
      <div class="event-meta">
        ${record.date} | ${record.duration} min | ${highlightText(escapeHtml(record.tag))}
      </div>
      ${record.description ? `<div class="event-meta">${highlightText(escapeHtml(record.description))}</div>` : ''}
      <button onclick="deleteRecord('${record.id}')" class="danger-btn" style="margin-top:10px; padding:5px 10px;">Delete</button>
    </div>
  `).join('');
}

// ========== EXPORT ==========
function exportData() {
  const records = loadRecords();
  const dataStr = JSON.stringify(records, null, 2);
  const blob = new Blob([dataStr], { type: "application/json" });
  const url = URL.createObjectURL(blob);
  const a = document.createElement("a");
  a.href = url;
  a.download = `campus_planner_${new Date().toISOString().slice(0,19)}.json`;
  a.click();
  URL.revokeObjectURL(url);
  
  document.getElementById("settingsMessage").innerHTML = '<div class="success">Exported successfully!</div>';
  setTimeout(() => document.getElementById("settingsMessage").innerHTML = "", 2000);
}

// ========== IMPORT ==========
function importData(file) {
  const reader = new FileReader();
  reader.onload = function(e) {
    try {
      const imported = JSON.parse(e.target.result);
      if (!Array.isArray(imported)) throw new Error("Not an array");
      
      imported.forEach(rec => {
        if (!rec.id || !rec.title || !rec.duration || !rec.date || !rec.tag) {
          throw new Error("Invalid record structure");
        }
      });
      
      saveRecords(imported);
      document.getElementById("settingsMessage").innerHTML = `<div class="success">Imported ${imported.length} records!</div>`;
      setTimeout(() => document.getElementById("settingsMessage").innerHTML = "", 2000);
    } catch(err) {
      alert("Import failed: Invalid JSON file");
    }
  };
  reader.readAsText(file);
}

// ========== LOAD SAMPLE DATA ==========
function loadSampleData() {
  const today = new Date().toISOString().slice(0,10);
  const sample = [
    { id: "1", title: "Math Final Exam", description: "Study chapters 4-6", duration: 180, date: today, tag: "Exam", createdAt: new Date().toISOString() },
    { id: "2", title: "Group Meeting", description: "Discuss project", duration: 90, date: today, tag: "Meeting", createdAt: new Date().toISOString() },
    { id: "3", title: "Gym Session", description: "Cardio workout", duration: 60, date: today, tag: "Health", createdAt: new Date().toISOString() },
    { id: "4", title: "Library Study", description: "Finish assignment", duration: 120, date: today, tag: "Study", createdAt: new Date().toISOString() },
    { id: "5", title: "Coffee with Mentor", description: "Career advice", duration: 45, date: today, tag: "Networking", createdAt: new Date().toISOString() }
  ];
  saveRecords(sample);
  document.getElementById("settingsMessage").innerHTML = '<div class="success">Sample data loaded! 5 events added.</div>';
  setTimeout(() => document.getElementById("settingsMessage").innerHTML = "", 2000);
}

// ========== CLEAR ALL ==========
function clearAll() {
  if (confirm("Delete ALL events? This cannot be undone!")) {
    saveRecords([]);
    document.getElementById("settingsMessage").innerHTML = '<div class="success">All data cleared.</div>';
    setTimeout(() => document.getElementById("settingsMessage").innerHTML = "", 2000);
  }
}

// ========== SET WEEKLY TARGET ==========
function setWeeklyTarget() {
  const target = parseInt(document.getElementById("weeklyTarget").value);
  if (!isNaN(target) && target >= 0) {
    localStorage.setItem("weeklyTarget", target);
    updateDashboard();
    document.getElementById("settingsMessage").innerHTML = '<div class="success">Weekly target set!</div>';
    setTimeout(() => document.getElementById("settingsMessage").innerHTML = "", 2000);
  } else {
    alert("Please enter a valid number");
  }
}

// ========== DARK MODE ==========
function initDarkMode() {
  const themeToggle = document.getElementById("themeToggle");
  const savedTheme = localStorage.getItem("theme");
  
  if (savedTheme === "dark") {
    document.body.classList.add("dark");
    themeToggle.textContent = "Light Mode";
  }
  
  themeToggle.addEventListener("click", () => {
    document.body.classList.toggle("dark");
    if (document.body.classList.contains("dark")) {
      themeToggle.textContent = "Light Mode";
      localStorage.setItem("theme", "dark");
    } else {
      themeToggle.textContent = "Dark Mode";
      localStorage.setItem("theme", "light");
    }
  });
}

// ========== HAMBURGER MENU ==========
function initHamburgerMenu() {
  const hamburger = document.getElementById("hamburgerBtn");
  const navMenu = document.getElementById("navMenu");
  
  if (hamburger && navMenu) {
    hamburger.addEventListener("click", () => {
      hamburger.classList.toggle("active");
      navMenu.classList.toggle("active");
    });
    
    document.querySelectorAll(".nav-menu li a").forEach(link => {
      link.addEventListener("click", () => {
        hamburger.classList.remove("active");
        navMenu.classList.remove("active");
      });
    });
  }
}

// ========== INITIALIZE ==========
document.addEventListener("DOMContentLoaded", function() {
  // Form and buttons
  document.getElementById("eventForm").addEventListener("submit", addEvent);
  document.getElementById("exportBtn").addEventListener("click", exportData);
  document.getElementById("importBtn").addEventListener("click", () => document.getElementById("importFile").click());
  document.getElementById("importFile").addEventListener("change", (e) => {
    if (e.target.files[0]) importData(e.target.files[0]);
  });
  document.getElementById("seedBtn").addEventListener("click", loadSampleData);
  document.getElementById("clearBtn").addEventListener("click", clearAll);
  document.getElementById("setTargetBtn").addEventListener("click", setWeeklyTarget);
  
  // Sort buttons
  document.getElementById("sortTitleBtn").addEventListener("click", sortByTitle);
  document.getElementById("sortDateBtn").addEventListener("click", sortByDate);
  document.getElementById("sortDurationBtn").addEventListener("click", sortByDuration);
  
  // Search input
  document.getElementById("regexSearch").addEventListener("input", searchEvents);
  
  // Initialize
  initDarkMode();
  initHamburgerMenu();
  displayRecords();
  updateDashboard();
});