import { loadData, saveData } from "./storage.js";

let records = loadData();
let currentSort = { field: "date", direction: "asc" };
let searchRegex = null;
let weeklyTarget = parseInt(localStorage.getItem("weeklyTarget")) || 0;
let viewMode = localStorage.getItem("viewMode") || "card"; // 'card' or 'table'

export function getRecords() { return [...records]; }
export function getSearchRegex() { return searchRegex; }
export function getWeeklyTarget() { return weeklyTarget; }
export function getViewMode() { return viewMode; }

export function setWeeklyTarget(val) {
  weeklyTarget = val;
  localStorage.setItem("weeklyTarget", val);
}

export function setSearchRegex(regex) {
  searchRegex = regex;
}

export function setViewMode(mode) {
  viewMode = mode;
  localStorage.setItem("viewMode", mode);
}

export function addRecord(record) {
  records.push(record);
  saveData(records);
}

export function updateRecord(id, updated) {
  const index = records.findIndex(r => r.id === id);
  if (index !== -1) {
    records[index] = { ...updated, updatedAt: new Date().toISOString() };
    saveData(records);
  }
}

export function deleteRecord(id) {
  records = records.filter(r => r.id !== id);
  saveData(records);
}

export function setAllRecords(newRecords) {
  records = newRecords;
  saveData(records);
}

export function sortRecords(field) {
  const direction = currentSort.field === field && currentSort.direction === "asc" ? "desc" : "asc";
  records.sort((a, b) => {
    let valA = a[field];
    let valB = b[field];
    
    if (field === "duration") {
      valA = parseFloat(valA);
      valB = parseFloat(valB);
    }
    if (field === "date") {
      valA = new Date(valA);
      valB = new Date(valB);
    }
    if (field === "title") {
      valA = valA.toLowerCase();
      valB = valB.toLowerCase();
    }
    
    if (valA < valB) return direction === "asc" ? -1 : 1;
    if (valA > valB) return direction === "asc" ? 1 : -1;
    return 0;
  });
  currentSort = { field, direction };
  saveData(records);
}

export function getSortIndicator(field) {
  if (currentSort.field === field) {
    return currentSort.direction === "asc" ? " ↑" : " ↓";
  }
  return "";
}

export function generateId() {
  return "evt_" + Date.now() + "_" + Math.random().toString(36).substr(2, 6);
}