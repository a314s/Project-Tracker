/**
 * Project Tracker App Logic
 * Handles features, calendar, progress, and persistence.
 */

const featureForm = document.getElementById('feature-form');
const featureTitle = document.getElementById('feature-title');
const featureDate = document.getElementById('feature-date');
const featureNotes = document.getElementById('feature-notes');
const featuresList = document.getElementById('features-list');
const progressRoadmap = document.getElementById('progress-roadmap');
const progressText = document.getElementById('progress-text');
const calendar = document.getElementById('calendar');
const monthLabel = document.getElementById('month-label');
const prevMonthBtn = document.getElementById('prev-month');
const nextMonthBtn = document.getElementById('next-month');

// State for displayed month/year
let displayedMonth, displayedYear;

// Multi-project state
let allProjects = {};
let currentProject = '';
let features = [];

// Project switcher elements
const projectSelect = document.getElementById('project-select');
const newProjectBtn = document.getElementById('new-project-btn');

// --- Persistence ---
function saveProjects() {
    localStorage.setItem('projectTrackerAllProjects', JSON.stringify(allProjects));
}
function loadProjects() {
    const data = localStorage.getItem('projectTrackerAllProjects');
    allProjects = data ? JSON.parse(data) : {};
}

function setCurrentProject(name) {
    currentProject = name;
    features = allProjects[currentProject] || [];
    render();
    updateProjectSelect();
}

function saveFeatures() {
    if (!currentProject) return;
    allProjects[currentProject] = features;
    saveProjects();
}
function loadFeatures() {
    loadProjects();
    // Pick first project if none selected
    const projectNames = Object.keys(allProjects);
    if (!currentProject) {
        currentProject = projectNames[0] || 'Default Project';
    }
    if (!allProjects[currentProject]) {
        allProjects[currentProject] = [];
    }
    features = allProjects[currentProject];
}
// --- Project Switcher UI ---
function updateProjectSelect() {
    if (!projectSelect) return;
    // Clear and repopulate
    projectSelect.innerHTML = '';
    Object.keys(allProjects).forEach(name => {
        const opt = document.createElement('option');
        opt.value = name;
        opt.textContent = name;
        if (name === currentProject) opt.selected = true;
        projectSelect.appendChild(opt);
    });
}
if (projectSelect) {
    projectSelect.addEventListener('change', e => {
        setCurrentProject(e.target.value);
    });
}
if (newProjectBtn) {
    newProjectBtn.addEventListener('click', () => {
        let name = prompt('Enter new project name:');
        if (!name) return;
        if (allProjects[name]) {
            alert('Project already exists!');
            return;
        }
        allProjects[name] = [];
        saveProjects();
        setCurrentProject(name);
    });
}

// --- Feature Operations ---
function addFeature(title, date, notes) {
    features.push({
        id: Date.now(),
        title,
        date,
        notes,
        completed: false
    });
    saveFeatures();
    render();
}

function toggleComplete(id) {
    const feature = features.find(f => f.id === id);
    if (feature) {
        feature.completed = !feature.completed;
        saveFeatures();
        render();
    }
}

function updateNotes(id, newNotes) {
    const feature = features.find(f => f.id === id);
    if (feature) {
        feature.notes = newNotes;
        saveFeatures();
        render();
    }
}

// --- Progress Bar ---
function renderProgressRoadmap() {
    if (!progressRoadmap) return;
    progressRoadmap.innerHTML = '';

    // Sort features by date ascending
    const sorted = [...features].sort((a, b) => a.date.localeCompare(b.date));
    const total = sorted.length;
    if (total === 0) {
        progressRoadmap.style.background = "#e3eaf3";
        progressText.textContent = '0% Complete';
        return;
    }

    // Count completed
    const completed = sorted.filter(f => f.completed).length;
    const percent = Math.round((completed / total) * 100);
    progressText.textContent = `${percent}% Complete`;

    // Hard color stop: dark blue up to last completed, then light
    const dark = "#2a7be4";
    const light = "#e3eaf3";
    const stop = (completed / total) * 100;
    const grad = `linear-gradient(90deg,
        ${dark} 0%,
        ${dark} ${stop}%,
        ${light} ${stop}%,
        ${light} 100%)`;
    progressRoadmap.style.background = grad;

    // Create popup element (one for all segments, reused)
    let popup = document.getElementById('roadmap-popup');
    if (!popup) {
        popup = document.createElement('div');
        popup.id = 'roadmap-popup';
        popup.className = 'roadmap-popup';
        document.body.appendChild(popup);
    }

    // Hide popup by default
    popup.style.display = 'none';

    sorted.forEach((feature, idx) => {
        const segment = document.createElement('div');
        segment.className = 'roadmap-segment';
        if (feature.completed) segment.classList.add('completed');
        segment.style.width = (100 / total) + '%';
        segment.style.background = "transparent";

        // Tooltip logic
        segment.addEventListener('mouseenter', (e) => {
            // Features up to this segment
            const upTo = sorted.slice(0, idx + 1);
            popup.innerHTML = `
                <div class="roadmap-popup-title">Features to complete:</div>
                ${upTo.map(f => `
                    <div class="roadmap-popup-feature${f.completed ? ' completed' : ''}">
                        ${f.completed ? '<s>' + f.title + '</s>' : f.title}
                        <span class="roadmap-popup-date">${f.date}</span>
                        ${f.notes ? `<div class="roadmap-popup-notes">${f.notes}</div>` : ''}
                    </div>
                `).join('')}
            `;
            popup.style.display = 'block';
            // Position popup above segment
            const rect = segment.getBoundingClientRect();
            popup.style.left = (rect.left + rect.width / 2 - popup.offsetWidth / 2) + 'px';
            popup.style.top = (rect.top - popup.offsetHeight - 8) + 'px';
        });
        segment.addEventListener('mousemove', (e) => {
            // Reposition popup in case of scroll/resize
            const rect = segment.getBoundingClientRect();
            popup.style.left = (rect.left + rect.width / 2 - popup.offsetWidth / 2) + 'px';
            popup.style.top = (rect.top - popup.offsetHeight - 8) + 'px';
        });
        segment.addEventListener('mouseleave', () => {
            popup.style.display = 'none';
        });

        progressRoadmap.appendChild(segment);
    });
}

// --- Calendar ---
function renderCalendar() {
    // Use displayedMonth/displayedYear for navigation
    const year = displayedYear;
    const month = displayedMonth;

    // Set month label
    const monthNames = [
        "January", "February", "March", "April", "May", "June",
        "July", "August", "September", "October", "November", "December"
    ];
    if (monthLabel) {
        monthLabel.textContent = `${monthNames[month]} ${year}`;
    }

    // First day of month
    const firstDay = new Date(year, month, 1);
    // Last day of month
    const lastDay = new Date(year, month + 1, 0);
    // Day of week for first day (0=Sun)
    const startDay = firstDay.getDay();

    // Clear calendar
    calendar.innerHTML = '';

    // Add empty days before first day
    for (let i = 0; i < startDay; i++) {
        const empty = document.createElement('div');
        empty.className = 'calendar-day';
        calendar.appendChild(empty);
    }

    // Add days of month
    // Create popup element for calendar
    let calendarPopup = document.getElementById('calendar-popup');
    if (!calendarPopup) {
        calendarPopup = document.createElement('div');
        calendarPopup.id = 'calendar-popup';
        document.body.appendChild(calendarPopup);
    }
    calendarPopup.style.display = 'none';

    for (let d = 1; d <= lastDay.getDate(); d++) {
        const dateStr = `${year}-${String(month + 1).padStart(2, '0')}-${String(d).padStart(2, '0')}`;
        const dayDiv = document.createElement('div');
        dayDiv.className = 'calendar-day';

        const today = new Date(new Date().setHours(0, 0, 0, 0));
        const dayDate = new Date(dateStr);
        const twoDaysFromNow = new Date(today);
        twoDaysFromNow.setDate(twoDaysFromNow.getDate() + 2);

        // Features for this day
        const dayFeatures = features.filter(f => f.date === dateStr);
        if (dayFeatures.length > 0) {
            dayDiv.classList.add('has-feature');
            
            // Check if any non-completed features are overdue or due soon
            const hasOverdue = dayFeatures.some(f => !f.completed && dayDate < today);
            const hasDueSoon = dayFeatures.some(f => !f.completed && !hasOverdue && dayDate <= twoDaysFromNow);
            
            if (hasOverdue) dayDiv.classList.add('overdue');
            if (hasDueSoon) dayDiv.classList.add('due-soon');
            
            dayFeatures.forEach(f => {
                const span = document.createElement('span');
                span.className = 'feature-title';
                span.textContent = f.title;
                if (f.notes) {
                    span.setAttribute('data-has-notes', 'true');
                }
                dayDiv.appendChild(span);

                // Add tooltip functionality if feature has notes
                if (f.notes) {
                    span.addEventListener('mouseenter', (e) => {
                        const title = f.completed ? `<s>${f.title}</s>` : f.title;
                        calendarPopup.innerHTML = `
                            <div class="feature-title">${title}</div>
                            <div class="calendar-popup-notes">${f.notes}</div>
                        `;
                        calendarPopup.style.display = 'block';
                        
                        // Position popup above the feature title
                        const rect = span.getBoundingClientRect();
                        const popupRect = calendarPopup.getBoundingClientRect();
                        
                        // Calculate position ensuring popup stays within viewport
                        let left = rect.left + (rect.width / 2) - (popupRect.width / 2);
                        let top = rect.top - popupRect.height - 8;
                        
                        // Adjust if popup would go off screen
                        if (left < 10) left = 10;
                        if (left + popupRect.width > window.innerWidth - 10) {
                            left = window.innerWidth - popupRect.width - 10;
                        }
                        if (top < 10) top = rect.bottom + 8;
                        
                        calendarPopup.style.left = left + 'px';
                        calendarPopup.style.top = top + 'px';
                    });

                    span.addEventListener('mouseleave', () => {
                        calendarPopup.style.display = 'none';
                    });
                }
            });
        }

        // Day number
        const dayNum = document.createElement('div');
        dayNum.textContent = d;
        dayNum.style.fontWeight = 'bold';
        dayDiv.insertBefore(dayNum, dayDiv.firstChild);

        calendar.appendChild(dayDiv);
    }
}

// --- Feature List ---
function renderFeatures() {
    featuresList.innerHTML = '';
    // Sort by date ascending, then incomplete before complete
    const sorted = [...features].sort((a, b) => {
        if (a.completed !== b.completed) return a.completed - b.completed;
        return a.date.localeCompare(b.date);
    });
    sorted.forEach(feature => {
        const li = document.createElement('li');
        const today = new Date(new Date().setHours(0, 0, 0, 0));
        const featureDate = new Date(feature.date);
        const twoDaysFromNow = new Date(today);
        twoDaysFromNow.setDate(twoDaysFromNow.getDate() + 2);
        
        const isOverdue = !feature.completed && featureDate < today;
        const isDueSoon = !feature.completed && !isOverdue && featureDate <= twoDaysFromNow;
        
        li.className = 'feature-item' +
            (feature.completed ? ' completed' : '') +
            (isOverdue ? ' overdue' : '') +
            (isDueSoon ? ' due-soon' : '');

        // Header: title + date
        const header = document.createElement('div');
        header.className = 'feature-header';

        const title = document.createElement('span');
        title.className = 'feature-title';
        title.textContent = feature.title;

        const date = document.createElement('span');
        date.className = 'feature-date';
        date.textContent = feature.date;

        header.appendChild(title);
        header.appendChild(date);

        // Notes
        const notes = document.createElement('textarea');
        notes.className = 'feature-notes';
        notes.value = feature.notes || '';
        notes.placeholder = 'Add notes...';
        notes.disabled = feature.completed;
        notes.addEventListener('change', () => updateNotes(feature.id, notes.value));

        // Actions
        const actions = document.createElement('div');
        actions.className = 'feature-actions';

        const completeBtn = document.createElement('button');
        completeBtn.className = 'complete-btn';
        completeBtn.textContent = feature.completed ? 'Mark Incomplete' : 'Complete';
        completeBtn.addEventListener('click', () => toggleComplete(feature.id));
        actions.appendChild(completeBtn);

        li.appendChild(header);
        li.appendChild(notes);
        li.appendChild(actions);

        featuresList.appendChild(li);
    });
}

// --- Main Render ---
function render() {
    renderFeatures();
    renderCalendar();
    renderProgressRoadmap();
}

// --- Form Handler ---
featureForm.addEventListener('submit', e => {
    e.preventDefault();
    const title = featureTitle.value.trim();
    const date = featureDate.value;
    const notes = featureNotes.value.trim();
    if (!title || !date) return;
    addFeature(title, date, notes);
    featureForm.reset();
});

// --- Init ---
loadFeatures();
updateProjectSelect();

// Initialize displayed month/year to current
const now = new Date();
displayedMonth = now.getMonth();
displayedYear = now.getFullYear();

// Month navigation handlers
if (prevMonthBtn && nextMonthBtn) {
    prevMonthBtn.addEventListener('click', () => {
        displayedMonth--;
        if (displayedMonth < 0) {
            displayedMonth = 11;
            displayedYear--;
        }
        render();
    });
    nextMonthBtn.addEventListener('click', () => {
        displayedMonth++;
        if (displayedMonth > 11) {
            displayedMonth = 0;
            displayedYear++;
        }
        render();
    });
}

render();