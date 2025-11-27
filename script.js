let selectedDate = new Date();
let calendarDate = new Date();
let calendarData = {}; // Will store the loaded calendar data

// Arabic day names
const arabicDays = ['الأحد', 'الإثنين', 'الثلاثاء', 'الأربعاء', 'الخميس', 'الجمعة', 'السبت'];
const arabicMonths = ['يناير', 'فبراير', 'مارس', 'أبريل', 'مايو', 'يونيو', 'يوليو', 'أغسطس', 'سبتمبر', 'أكتوبر', 'نوفمبر', 'ديسمبر'];

// Load calendar data
async function loadCalendarData() {
    try {
        const response = await fetch('data.json');
        if (response.ok) {
            calendarData = await response.json();
            console.log('Calendar data loaded successfully');
        } else {
            console.warn('Could not load data.json. Using empty data.');
            calendarData = {};
        }
    } catch (error) {
        console.error('Error loading calendar data:', error);
        calendarData = {};
    }
    // Update display after data is loaded
    updateDisplay();
    updateBackgroundColor();
}

// Get data for a specific date
function getDateData(date) {
    // Format date as YYYY-MM-DD
    const year = date.getFullYear();
    const month = String(date.getMonth() + 1).padStart(2, '0');
    const day = String(date.getDate()).padStart(2, '0');
    const dateKey = `${year}-${month}-${day}`;

    return calendarData[dateKey] || null;
}

// Format date string for key (YYYY-MM-DD)
function formatDateKey(date) {
    const year = date.getFullYear();
    const month = String(date.getMonth() + 1).padStart(2, '0');
    const day = String(date.getDate()).padStart(2, '0');
    return `${year}-${month}-${day}`;
}

// Initialize
loadCalendarData();

function updateDisplay() {
    const dayName = arabicDays[selectedDate.getDay()];
    const dateStr = `${selectedDate.getDate()} ${arabicMonths[selectedDate.getMonth()]} ${selectedDate.getFullYear()}`;

    document.getElementById('currentDay').textContent = dayName;
    document.getElementById('currentDate').textContent = dateStr;

    updateDataSections();
    updateBackgroundColor();
}

function changeDate(days) {
    selectedDate.setDate(selectedDate.getDate() + days);
    updateDisplay();
}

function openCalendar() {
    calendarDate = new Date(selectedDate);
    document.getElementById('calendarModal').classList.add('active');
    renderCalendar();
}

function closeCalendar() {
    document.getElementById('calendarModal').classList.remove('active');
}

function closeCalendarOnOverlay(event) {
    if (event.target.id === 'calendarModal') {
        closeCalendar();
    }
}

function changeCalendarMonth(direction) {
    calendarDate.setMonth(calendarDate.getMonth() + direction);
    renderCalendar();
}

function renderCalendar() {
    const year = calendarDate.getFullYear();
    const month = calendarDate.getMonth();

    // Use English month names for calendar
    const englishMonths = ['January', 'February', 'March', 'April', 'May', 'June',
        'July', 'August', 'September', 'October', 'November', 'December'];
    document.getElementById('calendarMonthYear').textContent =
        `${englishMonths[month]} ${year}`;

    const firstDay = new Date(year, month, 1);
    const lastDate = new Date(year, month + 1, 0).getDate();
    const startDay = firstDay.getDay(); // 0 = Sunday, 6 = Saturday

    // Get previous month's last date for showing days from previous month
    const prevMonthLastDate = new Date(year, month, 0).getDate();

    let html = '';

    // Day names - English calendar layout (Sunday first)
    const englishDays = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'];
    englishDays.forEach(day => {
        html += `<div class="calendar-day-name">${day}</div>`;
    });

    // Show days from previous month to fill the first week
    const daysFromPrevMonth = startDay;
    for (let i = daysFromPrevMonth - 1; i >= 0; i--) {
        const day = prevMonthLastDate - i;
        const prevYear = month === 0 ? year - 1 : year;
        const prevMonth = month === 0 ? 11 : month - 1;
        html += `<div class="calendar-day other-month" onclick="selectDate(${prevYear}, ${prevMonth}, ${day})">${day}</div>`;
    }

    // Calendar days for current month
    const today = new Date();
    today.setHours(0, 0, 0, 0);

    const selectedDateNormalized = new Date(selectedDate);
    selectedDateNormalized.setHours(0, 0, 0, 0);

    for (let d = 1; d <= lastDate; d++) {
        const date = new Date(year, month, d);
        date.setHours(0, 0, 0, 0);
        const isToday = date.getTime() === today.getTime();
        const isSelected = date.getTime() === selectedDateNormalized.getTime();

        let classes = 'calendar-day';
        if (isToday) classes += ' today';
        if (isSelected) classes += ' selected';

        html += `<div class="${classes}" onclick="selectDate(${year}, ${month}, ${d})">${d}</div>`;
    }

    // Show days from next month to complete the grid (always show 6 rows = 42 cells total)
    const totalCells = daysFromPrevMonth + lastDate;
    const remainingCells = 42 - totalCells; // 6 rows * 7 days = 42 cells
    const nextYear = month === 11 ? year + 1 : year;
    const nextMonth = month === 11 ? 0 : month + 1;

    for (let d = 1; d <= remainingCells; d++) {
        html += `<div class="calendar-day other-month" onclick="selectDate(${nextYear}, ${nextMonth}, ${d})">${d}</div>`;
    }

    document.getElementById('calendarGrid').innerHTML = html;
}

function selectDate(year, month, day) {
    selectedDate = new Date(year, month, day);
    selectedDate.setHours(0, 0, 0, 0);
    closeCalendar();
    updateDisplay();
}

function updateDataSections() {
    const dateData = getDateData(selectedDate);

    // Fast section
    if (dateData && dateData.fast) {
        showSection('fastSection', dateData.fast);
    } else {
        hideSection('fastSection');
    }

    // Holiday section
    if (dateData && dateData.holiday) {
        showSection('holidaySection', dateData.holiday);
    } else {
        hideSection('holidaySection');
    }

    // Special day section
    if (dateData && dateData.specialDay) {
        showSection('specialDaySection', dateData.specialDay);
    } else {
        hideSection('specialDaySection');
    }

    // Saints section
    if (dateData && dateData.saints && dateData.saints.length > 0) {
        // Format saints list: join with comma or Arabic separator
        const saintsText = dateData.saints.join('، '); // Arabic comma separator
        showSection('saintsSection', saintsText);
    } else {
        hideSection('saintsSection');
    }
}

function showSection(sectionId, content) {
    const section = document.getElementById(sectionId);
    const infoElement = document.getElementById(sectionId.replace('Section', 'Info'));
    if (section && infoElement) {
        infoElement.textContent = content;
        section.classList.remove('hidden');
    }
}

function hideSection(sectionId) {
    const section = document.getElementById(sectionId);
    if (section) {
        section.classList.add('hidden');
    }
}

function updateBackgroundColor() {
    const date = new Date(selectedDate);
    const month = date.getMonth() + 1; // 1-12
    const day = date.getDate();
    const year = date.getFullYear();

    // Remove all period classes
    document.body.classList.remove('period-red', 'period-blue', 'period-gold',
        'period-purple', 'period-white', 'period-green', 'period-burgundy');

    // Calculate Pascha date (simplified - using 2024 as reference)
    // In real implementation, you'd need proper Pascha calculation
    const pascha2024 = new Date(2024, 4, 5); // May 5, 2024
    const pascha2025 = new Date(2025, 3, 20); // April 20, 2025
    const pascha2026 = new Date(2026, 3, 12); // April 12, 2026

    // Determine which Pascha is closest
    let paschaDate = pascha2024;
    if (date > pascha2024 && date <= new Date(2025, 0, 1)) paschaDate = pascha2025;
    else if (date > new Date(2025, 0, 1)) paschaDate = pascha2026;

    // Fallback for better year handling if needed, but this covers the requested range
    if (year === 2025) paschaDate = pascha2025;
    if (year === 2026) paschaDate = pascha2026;

    const paschaTime = paschaDate.getTime();
    const currentTime = date.getTime();
    const daysSincePascha = Math.floor((currentTime - paschaTime) / (1000 * 60 * 60 * 24));

    // After Christmas till Epiphany (Jan 7 - Jan 19)
    if (month === 1 && day >= 7 && day <= 19) {
        if (day === 19) {
            document.body.classList.add('period-blue'); // Epiphany
        } else {
            document.body.classList.add('period-red'); // After Christmas
        }
        return;
    }

    // Great Fast (40 days before Pascha + Great Week)
    // This is approximate - real calculation needed
    if (daysSincePascha >= -49 && daysSincePascha < 0) {
        document.body.classList.add('period-purple');
        return;
    }

    // Pascha period (50 days after Pascha)
    if (daysSincePascha >= 0 && daysSincePascha <= 50) {
        document.body.classList.add('period-white');
        return;
    }

    // Apostles' Fast (starts Monday after Sunday of All Saints, ends June 29)
    // Simplified: roughly June
    if (month === 6) {
        document.body.classList.add('period-green');
        return;
    }

    // Virgin's Fast (August 1-14)
    if (month === 8 && day >= 1 && day <= 14) {
        document.body.classList.add('period-burgundy');
        return;
    }

    // Christmas Fast (November 28 - January 6, 40 days)
    if ((month === 11 && day >= 28) || (month === 12) || (month === 1 && day <= 6)) {
        document.body.classList.add('period-blue');
        return;
    }

    // Default gold
    document.body.classList.add('period-gold');
}

function toggleMenu() {
    const menu = document.getElementById('menu');
    const overlay = document.querySelector('.menu-overlay');
    menu.classList.toggle('active');
    overlay.classList.toggle('active');
}

function showContact() {
    document.getElementById('contactPage').classList.add('active');
    toggleMenu();
}

function closeContact() {
    document.getElementById('contactPage').classList.remove('active');
}

