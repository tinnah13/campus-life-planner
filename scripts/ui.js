import { getRecords, getSearchRegex, getViewMode, getSortIndicator } from "./state.js";
import { filterRecords, highlightMatches } from "./search.js";

export function renderRecords(records, searchRegex) {
  const container = document.getElementById("recordsList");
  const viewMode = getViewMode();
  const filtered = filterRecords(records, searchRegex);
  
  if (!filtered.length) {
    container.innerHTML = '<div class="empty-state"><p> No matching events found.</p></div>';
    return;
  }
  
  if (viewMode === "table") {
    renderTableView(filtered, searchRegex, container);
  } else {
    renderCardView(filtered, searchRegex, container);
  }
}

function renderCardView(records, searchRegex, container) {
  container.innerHTML = records.map(rec => `
    <div class="record-card" data-id="${rec.id}">
      <div class="record-content">
        <strong class="record-title">${highlightMatches(rec.title, searchRegex)}</strong>
        <div class="record-meta">
          <span class="record-date"> ${highlightMatches(rec.date, searchRegex)}</span>
          <span class="record-duration">⏱ ${rec.duration} min</span>
          <span class="record-tag"> ${highlightMatches(rec.tag, searchRegex)}</span>
        </div>
        ${rec.description ? `<p class="record-desc">${highlightMatches(rec.description, searchRegex)}</p>` : ''}
      </div>
      <div class="record-actions">
        <button class="edit-btn" data-id="${rec.id}" aria-label="Edit ${rec.title}"> Edit</button>
        <button class="delete-btn danger" data-id="${rec.id}" aria-label="Delete ${rec.title}">🗑 Delete</button>
      </div>
    </div>
  `).join('');
}

function renderTableView(records, searchRegex, container) {
  container.innerHTML = `
    <div class="table-wrapper">
      <table class="records-table" role="grid">
        <thead>
          <tr>
            <th data-sort="title" class="sortable">Title ${getSortIndicator("title")}</th>
            <th data-sort="date" class="sortable">Due Date ${getSortIndicator("date")}</th>
            <th data-sort="duration" class="sortable">Duration (min) ${getSortIndicator("duration")}</th>
            <th>Tag</th>
            <th>Description</th>
            <th>Actions</th>
          </tr>
        </thead>
        <tbody>
          ${records.map(rec => `
            <tr data-id="${rec.id}">
              <td class="record-title">${highlightMatches(rec.title, searchRegex)}</td>
              <td>${highlightMatches(rec.date, searchRegex)}</td>
              <td>${rec.duration}</td>
              <td><span class="tag-badge">${highlightMatches(rec.tag, searchRegex)}</span></td>
              <td class="desc-cell">${rec.description ? highlightMatches(rec.description.substring(0, 60), searchRegex) + (rec.description.length > 60 ? '...' : '') : '—'}</td>
              <td class="action-cell">
                <button class="edit-btn-small" data-id="${rec.id}" aria-label="Edit ${rec.title}">✏️</button>
                <button class="delete-btn-small danger" data-id="${rec.id}" aria-label="Delete ${rec.title}">🗑</button>
              </td>
            </tr>
          `).join('')}
        </tbody>
      </table>
    </div>
  `;
  
  // Re-attach sort listeners to table headers
  document.querySelectorAll('.sortable').forEach(header => {
    header.addEventListener('click', () => {
      const field = header.dataset.sort;
      import('./state.js').then(module => {
        module.sortRecords(field);
        import('./main.js').then(m => m.refreshUI());
      });
    });
  });
}

export function updateStats(records) {
  const totalTasks = records.length;
  const totalDuration = records.reduce((sum, r) => sum + parseFloat(r.duration || 0), 0);
  const tagCount = {};
  records.forEach(r => { tagCount[r.tag] = (tagCount[r.tag] || 0) + 1; });
  let topTag = "—";
  let maxCount = 0;
  for (let [tag, count] of Object.entries(tagCount)) {
    if (count > maxCount) { maxCount = count; topTag = tag; }
  }
  document.getElementById("totalTasks").innerText = totalTasks;
  document.getElementById("totalDuration").innerText = totalDuration.toFixed(0);
  document.getElementById("topTag").innerText = topTag;
  
  // Weekly target with ARIA live
  const target = getWeeklyTarget();
  const last7Days = records.filter(r => {
    const daysDiff = (new Date() - new Date(r.date)) / (1000*3600*24);
    return daysDiff <= 7 && daysDiff >= 0;
  });
  const recentTotal = last7Days.reduce((s,r) => s + parseFloat(r.duration), 0);
  const targetStatus = document.getElementById("targetStatus");
  const liveAlert = document.getElementById("liveAlert");
  if (!target || target === 0) {
    targetStatus.innerText = "No target set";
    liveAlert.innerText = "";
  } else if (recentTotal >= target) {
    targetStatus.innerText = ` Achieved (${recentTotal}/${target} min)`;
    liveAlert.setAttribute("aria-live", "assertive");
    liveAlert.innerText = " Weekly target reached or exceeded!";
  } else {
    targetStatus.innerText = ` ${recentTotal}/${target} min (${target - recentTotal} left)`;
    liveAlert.setAttribute("aria-live", "polite");
    liveAlert.innerText = `You need ${target - recentTotal} more minutes this week.`;
  }
}

export function showSearchError(message) {
  const searchHelp = document.getElementById("searchHelp");
  if (searchHelp) {
    searchHelp.innerHTML = ` Invalid regex: ${message}`;
    searchHelp.style.color = "#f87171";
    setTimeout(() => {
      searchHelp.innerHTML = "Use JS regex (e.g., \\bexam\\b, @tag:lecture)";
      searchHelp.style.color = "";
    }, 3000);
  }
}