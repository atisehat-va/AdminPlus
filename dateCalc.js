let listOfHolidays = [];

let dateDetails = {
    startDate: null,    
    endDate: null    
};

const typeNames = {
    0: "Default",
    1: "Customer Service",
    2: "Holiday Schedule",
    "-1": "Inner Calendar"
};

async function fetchAllHolidaySchedules() {
    const fetchXml = `
        <fetch>
            <entity name="calendar">
                <attribute name="name" />
                <attribute name="type" />
                <filter>
                    <condition attribute="name" operator="not-null" />
                </filter>
            </entity>
        </fetch>
    `;
    try {
        const results = await Xrm.WebApi.retrieveMultipleRecords("calendar", `?fetchXml=${encodeURIComponent(fetchXml)}`);
        return results.entities.map(entity => ({
            name: `${entity.name} (Type: ${typeNames[entity.type] || "Unknown"})`,
            type: entity.type
        }));
    } catch (error) {
        console.error("Error fetching holiday schedules:", error);
        return []; 
    }
}

async function setupHolidayScheduleDropdown() {
    const schedules = await fetchAllHolidaySchedules();
    const dropdown = document.getElementById('holidayScheduleDropdown');
    let defaultScheduleName = '';

    // Map schedules to options and find the default schedule
    const options = schedules.map(schedule => {
        const option = document.createElement('option');
        option.value = schedule.name;
        option.innerText = schedule.name;

        if (schedule.type === 2) {
            defaultScheduleName = schedule.name;
        }
        return option;
    });

    dropdown.append(...options); 
    dropdown.value = defaultScheduleName;
    displayHolidays(defaultScheduleName);  

    dropdown.addEventListener('change', (e) => {
        displayHolidays(e.target.value);
    });
}

async function getHolidaysForSchedule(scheduleName) {
    const actualScheduleName = extractActualScheduleName(scheduleName);
    const fetchXml = buildFetchXmlForHolidays(actualScheduleName);
    const results = await Xrm.WebApi.retrieveMultipleRecords("calendar", `?fetchXml=${encodeURIComponent(fetchXml)}`);    
    return formatHolidays(results.entities);
}

function extractActualScheduleName(scheduleName) {
    const matchedScheduleName = scheduleName.match(/^(.*?) \(Type:/);
    return matchedScheduleName ? matchedScheduleName[1] : scheduleName;
}

function buildFetchXmlForHolidays(scheduleName) {
    return `
        <fetch>
            <entity name="calendar">
                <filter>
                    <condition attribute="name" operator="eq" value="${scheduleName}" />
                </filter>
                <link-entity name="calendarrule" from="calendarid" to="calendarid" alias="rule">
                    <attribute name="name" />
                    <attribute name="starttime" />
                    <filter>
                        <condition attribute="starttime" operator="this-year" />
                    </filter>
                </link-entity>
            </entity>
        </fetch>
    `;
}
function formatHolidays(entities) {
    return entities.map(entity => ({
        name: entity["rule.name"],
        date: new Date(entity["rule.starttime"]).toDateString()
    }));
}

async function displayHolidays(scheduleName) {
    try {
        const holidays = await getHolidaysForSchedule(scheduleName);

        // listOfHolidays with the fetched holidays
        listOfHolidays = holidays.map(holiday => holiday.date);      

        // Sort holidays by date
        holidays.sort((a, b) => new Date(a.date) - new Date(b.date));

        const holidaysList = document.getElementById('holidaysList');

       holidaysList.innerHTML = holidays.map(holiday => {
           const formattedDate = `${holiday.date.split(' ')[0]} - ${("0" + (new Date(holiday.date).getMonth() + 1)).slice(-2)}/${("0" + new Date(holiday.date).getDate()).slice(-2)}/${new Date(holiday.date).getFullYear()}`;
           return `<div class="holidayRow"><div class="holidayName"><b>${holiday.name}</b></div><div class="holidayDate">${formattedDate}</div></div>`;
       }).join('');           
           initCalendar(holidays);
    } catch (error) {
        console.error("Error fetching holidays: ", error);
    }
}

// Construct the modal content
function createModalContent() {
    const container = document.createElement('div');
    container.className = 'commonPopup';    
    container.innerHTML = `
        <div class="commonPopup-header">Date Calculator</div>
         <button class="commonback-button" id="commonback-button">Back</button>
   
         <div class="securityPopup-row">
            <div class="section1-row1" id="section1">
                <div class="headerWrapper">
                    <h3 style="margin-bottom: 20px;">System Schedule(s):</h3>                    
                    <select id="holidayScheduleDropdown"></select> <!-- Directly embedded dropdown -->
                </div>
                <div id="holidaysList"></div>     			      
            </div>
            <div class="section1-row1" id="section2">
                <h3 style="margin-bottom: 20px;">Calendar:</h3>
                <div id="calendar">
                    <div id="calendarHeader">
                        <button id="prevMonth">&lt;</button>
                        <span id="monthYearLabel"></span>
                        <button id="nextMonth">&gt;</button>
                    </div>
                    <div id="calendarDays">
                        <div>Sun</div>
                        <div>Mon</div>
                        <div>Tue</div>
                        <div>Wed</div>
                        <div>Thu</div>
                        <div>Fri</div>
                        <div>Sat</div>
                    </div>
                    <div id="calendarDates"></div>
                </div>     
            </div>
        </div>       	
         <div class="securityPopup-row">
            <div class="commonSection section1-row2" id="section3">
                <div class="excludeSettingsWrapper">
                    <h4>Settings:</h4>                    
                    <div class="checkboxWrapper">
                        <input type="checkbox" id="excludeSchedule" name="excludeOptions" value="excludeSchedule">
                        <label for="excludeSchedule">Exclude Selected Schedule Days</label>
                    </div>                    
                    <div class="checkboxWrapper">
                        <input type="checkbox" id="excludeWeekends" name="excludeOptions" value="excludeWeekends">
                        <label for="excludeWeekends">Exclude Weekends</label>
                    </div>                    
                    <div class="checkboxWrapper excludeSpecificDaysWrapper">                        
                        <label for="excludeSpecificDays">Exclude Additional Days</label>
                        <input type="number" id="daysCount" name="daysCount" min="1" step="1" placeholder="Enter number">
                    </div>
                </div>                
                <div class="dateSection">
                <div class="dateRow">
                    <div>
                        <label for="startDate1">Start Date:</label>
                        <input type="date" id="startDate1" name="startDate1">
                    </div>
                    <div>
                        <label for="endDate1">End Date:</label>
                        <input type="date" id="endDate1" name="endDate1">
                    </div>
                </div>                          
                <div class="calculationsWrapper">
                    <div class="calculationRow">
                        <span>Total Days between Start and End Date:</span>
                        <span>-- Day(s)</span>
                    </div>
                    <div class="calculationRow">
                        <span>Excluded Schedule Days:</span>
                        <span>-- Day(s)</span>
                    </div>
                    <div class="calculationRow">
                        <span>Excluded Weekends:</span>
                        <span>-- Day(s)</span>
                    </div>
                    <div class="calculationRow">
                        <span>Additional Days Excluded:</span>
                        <span>-- Day(s)</span>
                    </div>                   
                    <hr class="separator">
                    <div class="calculationRow">
                        <span><strong>Total Number of Days:</strong></span>
                        <span><strong>-- Day(s)</strong></span>
                    </div>
                </div>                
            </div>
            <div class="section3-submitBtn">
                <button id="section3SubmitBtn">Submit</button>
            </div>
            </div>            
             <div class="commonSection section1-row2" id="section4">
                 <h3>Calendar 2</h3>			      			      
             </div>
         </div>           
    `;    
    return container;    
}

function setupDateFormListeners() {
    document.getElementById('section3SubmitBtn').addEventListener('click', function() {
        dateDetails.startDate = document.getElementById('startDate1').value;
        dateDetails.endDate = document.getElementById('endDate1').value;

        if (!dateDetails.startDate || !dateDetails.endDate) {
            showCustomAlert(`Please provide both Start Date and End Date.`);            
            document.querySelectorAll('.calculationRow span:nth-child(2)').forEach(span => span.textContent = "-- Days");
            return; // Exit the function
        }

        const daysDifference = calculateDateDifference(dateDetails.startDate, dateDetails.endDate);

        // Check if 'Exclude Selected Schedule Days' checkbox is checked
        const isExcludeScheduleChecked = document.getElementById('excludeSchedule').checked;
        const holidaysCount = isExcludeScheduleChecked ? getHolidaysBetweenDates(dateDetails.startDate, dateDetails.endDate) : 0;

        // Check if 'Exclude Weekends' checkbox is checked
        const isExcludeWeekendsChecked = document.getElementById('excludeWeekends').checked;
        const weekendsCount = isExcludeWeekendsChecked ? countWeekendsBetweenDates(dateDetails.startDate, dateDetails.endDate) : 0;

        // Get user-specified excluded days
        const additionalExcludedDays = document.getElementById('daysCount').value || 0;

        // Update the displayed days difference
        document.querySelector(".calculationRow span:nth-child(2)").textContent = `${daysDifference} Day(s)`;

        // Update the displayed holidays count
        document.querySelector(".calculationRow:nth-child(2) span:nth-child(2)").textContent = `${holidaysCount} Day(s)`;

        // Update the displayed weekends count
        document.querySelector(".calculationRow:nth-child(3) span:nth-child(2)").textContent = `${weekendsCount} Day(s)`;

        // Update the displayed additional excluded days
        document.querySelector(".calculationRow:nth-child(4) span:nth-child(2)").textContent = `${additionalExcludedDays} Day(s)`;

        // Calculate total number of days
        const totalDays = daysDifference - holidaysCount - weekendsCount - additionalExcludedDays;

        // Update the total number of days
        document.querySelector(".calculationRow:nth-child(6) span:nth-child(2)").textContent = 
            totalDays < 0 ? `${totalDays} Day(s)` : `${totalDays} Day(s)`;

        console.log(dateDetails);
    });
}

function attachModalEventHandlers(container) {
    const backButton = container.querySelector('#commonback-button');
    backButton.addEventListener('click', function() {
        container.remove();
        openPopup();  
    });
    makePopupMovable(container); 
    setupDateFormListeners(); 
}

async function dateCalc() {
    const modalContent = createModalContent();
    document.body.appendChild(modalContent);
    attachModalEventHandlers(modalContent);    
    const defaultSchedule = await setupHolidayScheduleDropdown();   
}

const styles = `
    #holidaysList { max-height: 74%; overflow-y: auto; display: grid; margin-top: 15px; }    
    .holidayRow { display: grid; grid-template-columns: 1fr 1fr; align-items: center; }
    .holidayName { padding: 4px 8px; border: 1px solid #ddd; text-align: left; width: 290px; }    
    .holidayDate { padding: 4px; border: 1px solid #ddd; text-align: left; }    
    .headerWrapper { margin-left: 10px; }     
    .section1-row1 { display: inline-block; width: 50%; height: 310px; padding: 10px; border-bottom: 3px solid #ccc; box-sizing: border-box; text-align: left; }
    .section1-row2 { display: inline-block; width: 50%; height: 460px; margin-left: 10px; vertical-align: top; box-sizing: border-box; text-align: left; } 
`;
const calendarStyles = ` 
    #calendar { width: 92%; height: 80%; border: 1px solid #ddd; background-color: #f9f9f9; padding: 10px; box-shadow: 0 4px 8px rgba(0,0,0,0.1); }
    #calendarHeader { display: flex; justify-content: space-between; align-items: center; margin-bottom: 10px; }
    #calendarDays, #calendarDates { display: grid; grid-template-columns: repeat(7, 1fr); gap: 5px; }
    #calendarDays div { background-color: #102e55; color: white; padding: 5px 0; text-align: center; border-radius: 3px; margin-bottom: 5px; }
    #calendarDates div { background-color: #e9ecef; height: 23px; display: flex; align-items: center; justify-content: center; border-radius: 3px; cursor: pointer; transition: background-color 0.2s; padding: 5px; box-sizing: border-box; }
    #calendarDates div:hover { background-color: #333; color: white; }
    #calendarDates .holidayDate { color: #2196F3; }
    .todayDate { background-color: #056d05 !important; color: white; }
`;
const startDateStyles = `
    .excludeSettingsWrapper {
        border: 1px solid #d4d4d4;
        padding: 10px;
        border-radius: 5px;
        margin-bottom: 10px;
        background-color: #f5f5f5;
    }
    .excludeSettingsWrapper h4 {
        margin-top: 0;
        border-bottom: 1px solid #d4d4d4;
        padding-bottom: 5px;
        margin-bottom: 10px;
    }
    .checkboxWrapper {
        margin-bottom: 5px;
    }  
    .dateRow {
        display: flex;        
    }
    .dateRow > div {       
        margin-right: 10px;
    } 
    .dateSection {
        border: 1px solid #ccc;
        padding: 10px;
        border-radius: 4px;
        margin-top: 10px;
    }     
    .calculationsWrapper {
        margin-top: 20px;
    }    
    .calculationRow {
        display: flex;
        justify-content: space-between;
        margin-bottom: 5px;
    } 
    .section3-submitBtn {
        margin-top: 15px;
        text-align: center;   
    }
    #section3SubmitBtn {        
        padding: 8px; 
        font-size: 15px; 
        width: 150px; 
        background-color: #102e55; 
        color: white;         
        cursor: pointer; 
        border-radius: 20px; 
        transition: background-color 0.3s; 
    }
    #section3SubmitBtn:hover {
        background-color: #103e89;
    }
    .separator {
        border-top: 2px solid black;
        margin: 10px 0;
    }    
`;

function initCalendar(holidays) {    
    let currentMonth = new Date().getMonth();
    let currentYear = new Date().getFullYear();
    
    const holidayDates = new Set(holidays.map(h => h.date));

    function displayCalendar(holidays, month, year) {
        const daysInMonth = new Date(year, month + 1, 0).getDate();
        const firstDayOfMonth = new Date(year, month, 1).getDay();    
        
        const today = new Date();
        const todayDate = today.getDate();
        const todayMonth = today.getMonth();
        const todayYear = today.getFullYear();
    
        let calendarHTML = '';
    
        // Empty days before the start of the month
        for (let i = 0; i < firstDayOfMonth; i++) {
            calendarHTML += '<div></div>';
        }
    
        // Populate the days of the month
        for (let i = 1; i <= daysInMonth; i++) {
            let currentDate = new Date(year, month, i).toDateString();
            let dateClass = '';
            let titleAttr = '';
            
            if (holidayDates.has(currentDate)) {
                const holidayName = holidays.find(h => h.date === currentDate).name;
                dateClass = 'holidayDate';
                titleAttr = `title="${holidayName}"`;
            } 

            if (i === todayDate && month === todayMonth && year === todayYear) {
                dateClass += ' todayDate'; // Adding a class for today's date
            }    
            calendarHTML += `<div class="${dateClass}" ${titleAttr}>${i}</div>`;
        }
    
        document.getElementById('calendarDates').innerHTML = calendarHTML;    
        const monthNames = ["January", "February", "March", "April", "May", "June", "July", "August", "September", "October", "November", "December"];
        document.getElementById('monthYearLabel').innerText = `${monthNames[month]} ${year}`;
    }

    function goToPrevMonth() {
        if(currentMonth === 0) {
            currentMonth = 11;
            currentYear -= 1;
        } else {
            currentMonth -= 1;
        }
        displayCalendar(holidays, currentMonth, currentYear);
    }

    function goToNextMonth() {
        if(currentMonth === 11) {
            currentMonth = 0;
            currentYear += 1;
        } else {
            currentMonth += 1;
        }
        displayCalendar(holidays, currentMonth, currentYear);
    }
    document.getElementById('prevMonth').addEventListener('click', goToPrevMonth);
    document.getElementById('nextMonth').addEventListener('click', goToNextMonth);    

    // Initial display
    displayCalendar(holidays, currentMonth, currentYear);
    //setupDateFormListeners(); 
}

function calculateDateDifference(startDate, endDate) {
    const start = new Date(startDate);
    const end = new Date(endDate);
    
    // Reset hours of the date to ensure we're strictly dealing with the day component.
    start.setHours(0, 0, 0, 0);
    end.setHours(0, 0, 0, 0);

    // Calculate the difference in days, inclusive.
    const diffInDays = (end.getTime() - start.getTime()) / (1000 * 60 * 60 * 24) + 1; 
    
    return Math.round(diffInDays); 
}

function getHolidaysBetweenDates(startDate, endDate) {
    let count = 0;

    const start = new Date(startDate);
    const end = new Date(endDate);

    listOfHolidays.forEach(holidayDateStr => {
        const holiday = new Date(holidayDateStr);

        if (isSameDayOrBetween(holiday, start, end)) {
            count++;
        }
    });

    return count;
}

function isSameDayOrBetween(date, start, end) {
    return (date >= start && date <= end) || 
           (date.getUTCDate() === start.getUTCDate() && 
            date.getUTCMonth() === start.getUTCMonth() && 
            date.getUTCFullYear() === start.getUTCFullYear()) || 
           (date.getUTCDate() === end.getUTCDate() && 
            date.getUTCMonth() === end.getUTCMonth() && 
            date.getUTCFullYear() === end.getUTCFullYear());
}

function countWeekendsBetweenDates(startDate, endDate) {
    // Convert date strings to array [YYYY, MM, DD] and create date objects
    const [startY, startM, startD] = startDate.split('-').map(Number);
    const [endY, endM, endD] = endDate.split('-').map(Number);
    
    const start = new Date(startY, startM - 1, startD); // months are 0-indexed
    const end = new Date(endY, endM - 1, endD);
    
    let count = 0;    
    while (start <= end) {
        if (start.getDay() === 6 || start.getDay() === 0) { // is Saturday OR Sunday
            count++;
        }
        start.setDate(start.getDate() + 1); 
    }    
    return count;
}

//EndSection3DateCalculation



function appendStylesToDocument(styles) {
    const styleSheet = document.createElement("style");
    styleSheet.type = "text/css";
    styleSheet.innerText = styles;
    document.head.appendChild(styleSheet);
}
appendStylesToDocument(calendarStyles);
appendStylesToDocument(styles);
appendStylesToDocument(startDateStyles);
