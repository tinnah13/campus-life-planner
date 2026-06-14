import { validateAll, getErrorMessage, hasDuplicateWords } from "./validators.js";

function handleSubmit(e) {
  e.preventDefault();
  
  const title = document.getElementById("title").value;
  const description = document.getElementById("description").value;
  const duration = document.getElementById("duration").value;
  const date = document.getElementById("date").value;
  const tag = document.getElementById("tag").value;

  const validation = validateAll(title, duration, date, tag, description);
  
  // Display error messages
  document.getElementById("titleError").innerHTML = validation.title ? "" : getErrorMessage('title', title);
  document.getElementById("durationError").innerHTML = validation.duration ? "" : getErrorMessage('duration', duration);
  document.getElementById("dateError").innerHTML = validation.date ? "" : getErrorMessage('date', date);
  document.getElementById("tagError").innerHTML = validation.tag ? "" : getErrorMessage('tag', tag);
  
  // Advanced regex check for duplicate words (warns but doesn't block)
  if (hasDuplicateWords(description)) {
    const warningMsg = "⚠️ Advanced regex detected duplicate words in description (e.g., 'study study')";
    document.getElementById("liveAlert").innerHTML = warningMsg;
    document.getElementById("liveAlert").style.background = "#fef3c7";
    setTimeout(() => {
      document.getElementById("liveAlert").innerHTML = "";
      document.getElementById("liveAlert").style.background = "";
    }, 3000);
  }
  
  if (!validation.allValid) {
    // Announce error to screen readers
    const firstError = document.querySelector(".error-message:not(:empty)");
    if (firstError) {
      firstError.setAttribute("role", "alert");
      setTimeout(() => firstError.removeAttribute("role"), 500);
    }
    return;
  }
  
  // Rest of your existing submit logic...
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
    document.getElementById("submitBtn").innerText = "➕ Add Event";
    document.getElementById("cancelEditBtn").style.display = "none";
  } else {
    addRecord(record);
  }
  
  document.getElementById("eventForm").reset();
  refreshUI();
  
  // Success announcement
  const liveAlert = document.getElementById("liveAlert");
  liveAlert.innerHTML = "✅ Event saved successfully!";
  liveAlert.setAttribute("role", "status");
  setTimeout(() => {
    liveAlert.innerHTML = "";
    liveAlert.removeAttribute("role");
  }, 2000);
}