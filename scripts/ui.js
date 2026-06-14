import { getRecords, getSearchRegex, getViewMode, getSortIndicator, getWeeklyTarget } from "./state.js";
import { filterRecords, highlightMatches } from "./search.js";

export function renderRecords(records, searchRegex) {
  const container = document.getElementById("recordsList");
  const viewMode = getViewMode();
  const filtered = filterRecords(records, searchRegex);
  
  if (!filtered.length) {
    container.innerHTML = '<div class="empty-state"> No matching events found.</div>';
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
          <span class="record-duration"> ${rec.duration} min</span>
          <span class="record-tag"> ${highlightMatches(rec.tag, searchRegex)}</span>
        </div>
        ${rec.description ? `<p class="record-desc">${highlightMatches(rec.description, searchRegex)}</p>` : ''}
      </div>
      <div class="record-actions">
        <button class="edit-btn" data-id="${rec.id}" aria-label="Edit ${rec.title}">✏️ Edit</button>
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

// M5: Enhanced stats with progress bar and chart
export function updateStats(records) {
  // Basic metrics
  const totalTasks = records.length;
  const totalDuration = records.reduce((sum, r) => sum + parseFloat(r.duration || 0), 0);
  
  // Top tag calculation
  const tagCount = {};
  records.forEach(r => { 
    tagCount[r.tag] = (tagCount[r.tag] || 0) + 1; 
  });
  let topTag = "—";
  let maxCount = 0;
  for (let [tag, count] of Object.entries(tagCount)) {
    if (count > maxCount) { 
      maxCount = count; 
      topTag = tag; 
    }
  }
  
  // Update basic stats
  document.getElementById("totalTasks").innerText = totalTasks;
  document.getElementById("totalDuration").innerText = totalDuration.toFixed(0);
  document.getElementById("topTag").innerText = topTag;
  
  // Weekly target calculation (last 7 days)
  const target = getWeeklyTarget();
  const today = new Date();
  const last7Days = records.filter(r => {
    const recordDate = new Date(r.date);
    const daysDiff = (today - recordDate) / (1000 * 3600 * 24);
    return daysDiff <= 7 && daysDiff >= 0;
  });
  
  const recentTotal = last7Days.reduce((sum, r) => sum + parseFloat(r.duration), 0);
  const remaining = Math.max(0, target - recentTotal);
  const overage = Math.max(0, recentTotal - target);
  const percentage = target > 0 ? Math.min(100, (recentTotal / target) * 100) : 0;
  
  // Update target status display
  const targetStatus = document.getElementById("targetStatus");
  const liveAlert = document.getElementById("liveAlert");
  const progressFill = document.getElementById("progressFill");
  const progressText = document.getElementById("progressText");
  const trendIndicator = document.getElementById("trendIndicator");
  
  if (!target || target === 0) {
    targetStatus.innerHTML = '⚙️ <span class="target-value">No target set</span>';
    if (progressFill) progressFill.style.width = "0%";
    if (progressText) progressText.textContent = "Set a weekly target above";
    if (liveAlert) liveAlert.innerText = "";
  } else {
    // Update progress bar
    if (progressFill) {
      progressFill.style.width = `${percentage}%`;
      progressFill.setAttribute("aria-valuenow", percentage);
    }
    if (progressText) {
      progressText.textContent = `${recentTotal} / ${target} min (${percentage.toFixed(0)}%)`;
    }
    
    // Update status with visual indicator
    if (recentTotal >= target) {
      targetStatus.innerHTML = ` <span class="target-value">Achieved!</span> <span class="target-detail">${recentTotal}/${target} min</span>`;
      targetStatus.className = "achieved";
      
      if (liveAlert) {
        liveAlert.setAttribute("aria-live", "assertive");
        liveAlert.innerHTML = ` Congratulations! You've reached your weekly target of ${target} minutes with ${overage} minutes extra!`;
        liveAlert.className = "live-alert success";
      }
      
      if (trendIndicator) {
        trendIndicator.innerHTML = " Above target! ";
        trendIndicator.className = "trend-up";
      }
    } else {
      targetStatus.innerHTML = ` <span class="target-value">${remaining} min left</span> <span class="target-detail">(${recentTotal}/${target})</span>`;
      targetStatus.className = "warning";
      
      if (liveAlert) {
        liveAlert.setAttribute("aria-live", "polite");
        liveAlert.innerHTML = `You need ${remaining} more minutes this week to reach your ${target} minute target.`;
        liveAlert.className = "live-alert warning";
      }
      
      if (trendIndicator) {
        const dailyAvg = recentTotal / 7;
        if (dailyAvg > 0) {
          trendIndicator.innerHTML = ` ${dailyAvg.toFixed(0)} min/day avg • ${remaining} to go`;
          trendIndicator.className = "trend-neutral";
        } else {
          trendIndicator.innerHTML = " No activity yet this week";
          trendIndicator.className = "trend-neutral";
        }
      }
    }
    
    // Clear alert after 5 seconds
    setTimeout(() => {
      if (liveAlert && liveAlert.innerHTML !== "" && !liveAlert.innerHTML.includes("Congratulations")) {
        liveAlert.innerHTML = "";
        liveAlert.className = "live-alert";
      }
    }, 5000);
  }
  
  // Add weekly trend chart
  updateWeeklyChart(records);
}

// Weekly bar chart
function updateWeeklyChart(records) {
  const chartContainer = document.getElementById("weeklyChart");
  if (!chartContainer) return;
  
  const last7Days = [];
  const dayNames = ["Sun", "Mon", "Tue", "Wed", "Thu", "Fri", "Sat"];
  
  for (let i = 6; i >= 0; i--) {
    const date = new Date();
    date.setDate(date.getDate() - i);
    last7Days.push(date.toISOString().split('T')[0]);
  }
  
  const dailyTotals = last7Days.map(date => {
    return records
      .filter(r => r.date === date)
      .reduce((sum, r) => sum + parseFloat(r.duration), 0);
  });
  
  const maxDuration = Math.max(...dailyTotals, 1);
  
  chartContainer.innerHTML = `
    <div class="chart-title"> Weekly Trend (Last 7 Days)</div>
    <div class="bar-chart">
      ${dailyTotals.map((total, index) => `
        <div class="bar-item" role="figure" aria-label="${dayNames[index]}: ${total} minutes">
          <div class="bar-label">${dayNames[index]}</div>
          <div class="bar-wrapper">
            <div class="bar-fill" style="height: ${(total / maxDuration) * 100}%"></div>
          </div>
          <div class="bar-value">${total}</div>
        </div>
      `).join('')}
    </div>
  `;
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