# Campus Life Planner

## Overview
A responsive web application that helps students organize tasks, events, deadlines, and meetings with regex search, weekly goals, and dark mode support.

## Languages Used
- HTML5
- CSS3
- JavaScript (ES6)

## Features

Event Management  
- Add, edit, and delete events
- View events as cards or table
- Sort by title, date, or duration

  Search  
- Live regex search with text highlighting
- Search in title, description, and tag

  Dashboard  
- Total tasks counter
- Total duration sum
- Top tag identification
- Weekly progress bar
- 7-day bar chart

  Validation  
- Title: No leading/trailing spaces, min 3 characters
- Duration: Positive numbers with optional decimals
- Date: YYYY-MM-DD format with calendar validation
- Tag: Letters, spaces, and hyphens only
- Advanced: Duplicate word detection using back-reference

  Data Storage  
- LocalStorage auto-save
- JSON export and import
- Sample data loader

  Accessibility  
- Keyboard navigation with focus indicators
- Skip-to-content link
- ARIA live regions for screen readers
- Dark mode toggle with persistence
- High color contrast

  Responsive Design  
- Mobile-first approach
- Sticky navigation bar
- Breakpoints at 360px, 480px, 768px, and 1024px+
- Cards on mobile, table on desktop

## Files Purpose

scripts/main.js 

It is the main JavaScript file that initializes the app and connects all modules together.

scripts/state.js 

It manages the application state including records, sorting settings, search regex, and weekly target.

scripts/storage.js 

It handles localStorage save and load operations plus JSON import and export.

scripts/ui.js 

It renders the records list, dashboard stats, progress bar, and weekly chart.

scripts/validators.js 

It contains all regex validation functions for title, duration, date, and tag.

scripts/search.js 

It compiles regex patterns, filters records by search, and highlights matching text.

styles/main.css 

It contains all styles including responsive layout, dark mode, hamburger menu, and progress bar.

index.html 

it is  the main webpage with navigation, dashboard, form, records, and settings sections.

seed.json 

It provides sample data with ten or more records for testing.

test.html 

It runs twenty-six regex validation tests to verify all form rules.




## How It Works

1. User adds events through the form and they are saved to localStorage
2. Events appear in records section and can be sorted or searched
3. Dashboard calculates totals and weekly progress showing a progress bar
4. User sets weekly target and the system tracks the last 7 days
5. Regex search filters events in real-time and highlights matching text
6. Import and Export allow data backup and restore
7. Dark mode toggles colors and the preference is saved

## Quick Demo Steps

1. Click "Load Sample Data" to add 5 example events
2. Set weekly target to 300 minutes to see the progress bar update
3. Search for "^Study" to find events starting with Study
4. Click "Dark Mode" to switch themes
5. Click "Export JSON" to download your data
