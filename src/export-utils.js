// Export utility functions for TG-APCalc

// Store the SheetJS library reference
let XLSX;

// Add styles for the export functionality
const exportStyles = document.createElement('style');
exportStyles.textContent = `
    .import-btn {
        display: inline-flex;
        align-items: center;
        justify-content: center;
        gap: 0.5rem;
        padding: 0.5rem 1rem;
        background-color: #4CAF50;
        color: white;
        border: none;
        border-radius: 4px;
        cursor: pointer;
        font-family: 'Poppins', sans-serif;
        font-size: 0.9rem;
        transition: background-color 0.3s ease;
    }
    .import-btn:hover {
        background-color: #45a049;
    }
    .import-btn:disabled {
        background-color: #cccccc;
        cursor: not-allowed;
        opacity: 0.7;
    }
    .import-loading {
        display: inline-block;
        width: 1rem;
        height: 1rem;
        border: 2px solid rgba(255, 255, 255, 0.3);
        border-radius: 50%;
        border-top-color: white;
        animation: spin 1s ease-in-out infinite;
        margin-right: 0.5rem;
    }
    @keyframes spin {
        to { transform: rotate(360deg); }
    }
    .export-message {
        position: fixed;
        bottom: 20px;
        right: 20px;
        padding: 12px 20px;
        border-radius: 4px;
        color: white;
        font-family: 'Poppins', sans-serif;
        font-size: 0.9rem;
        z-index: 1000;
        box-shadow: 0 2px 10px rgba(0, 0, 0, 0.2);
        animation: slideIn 0.3s ease-out;
    }
    .export-success {
        background-color: #4CAF50;
    }
    .export-error {
        background-color: #f44336;
    }
    @keyframes slideIn {
        from { transform: translateX(100%); opacity: 0; }
        to { transform: translateX(0); opacity: 1; }
    }
    @media (max-width: 768px) {
        .import-btn span {
            display: none;
        }
        .import-btn i {
            margin-right: 0;
        }
        .export-message {
            left: 10px;
            right: 10px;
            bottom: 10px;
            text-align: center;
        }
    }
`;

document.head.appendChild(exportStyles);

// Initialize the export utilities
function initExportUtils() {
    // Check if SheetJS is loaded
    if (typeof XLSX === 'undefined' && window.XLSX) {
        XLSX = window.XLSX;
    }
}

// Collect data from all tabs
async function collectAllTabData() {
    const tabsData = {
        'wing-area': collectWingAreaData(),
        'wing-parameter': collectWingParameterData(),
        'dynamic-thrust': collectDynamicThrustData(),
        'climb-rate': collectClimbRateData(),
        'sink-rate': collectSinkRateData(),
        'landing-distance': collectLandingDistanceData(),
        'takeoff-distance': collectTakeoffDistanceData(),
        'vn-diagram': collectVnDiagramData(),
        'wheel-track': collectWheelTrackData()
    };

    // Wait for all data collection to complete
    const results = await Promise.all(Object.values(tabsData));
    const tabNames = Object.keys(tabsData);
    
    // Combine tab names with their data
    return tabNames.reduce((acc, tabName, index) => {
        acc[tabName] = results[index];
        return acc;
    }, {});
}

// Helper function to get input values from a form or section
function getFormInputs(formSelector) {
    const container = document.querySelector(formSelector);
    if (!container) return {};
    
    const inputs = container.querySelectorAll('input[type="number"], input[type="text"], select');
    const data = {};
    
    inputs.forEach(input => {
        // Use ID as the key if available, otherwise use name or placeholder
        const key = input.id || input.name || input.placeholder || `input_${Math.random().toString(36).substr(2, 9)}`;
        if (key) {
            data[key] = input.value;
        }
    });
    
    return data;
}

// Data collection functions for each tab
function collectWingAreaData() {
    // Get all inputs from the calculator container
    const inputs = getFormInputs('.calculator-container');
    
    // Get any results from the results table
    const resultsTable = document.getElementById('results-table');
    let results = [];
    
    if (resultsTable) {
        const rows = resultsTable.querySelectorAll('tr');
        if (rows.length > 1) { // If there are data rows
            const headers = Array.from(rows[0].querySelectorAll('th')).map(th => th.textContent.trim());
            
            for (let i = 1; i < rows.length; i++) {
                const row = rows[i];
                const cells = row.querySelectorAll('td');
                const rowData = {};
                
                cells.forEach((cell, index) => {
                    rowData[headers[index] || `col_${index}`] = cell.textContent.trim();
                });
                
                results.push(rowData);
            }
        }
    }
    
    return {
        inputs: inputs,
        results: results,
        timestamp: new Date().toISOString()
    };
}

function collectWingParameterData() {
    const inputs = getFormInputs('.calculator-container');
    const resultsTable = document.getElementById('results-table');
    let results = [];
    
    if (resultsTable) {
        const rows = resultsTable.querySelectorAll('tr');
        if (rows.length > 1) {
            const headers = Array.from(rows[0].querySelectorAll('th')).map(th => th.textContent.trim());
            for (let i = 1; i < rows.length; i++) {
                const row = rows[i];
                const cells = row.querySelectorAll('td');
                const rowData = {};
                cells.forEach((cell, index) => {
                    rowData[headers[index] || `col_${index}`] = cell.textContent.trim();
                });
                results.push(rowData);
            }
        }
    }
    
    return { inputs, results, timestamp: new Date().toISOString() };
}

function collectDynamicThrustData() {
    const inputs = getFormInputs('.calculator-container');
    const resultsTable = document.getElementById('results-table');
    let results = [];
    
    if (resultsTable) {
        const rows = resultsTable.querySelectorAll('tr');
        if (rows.length > 1) {
            const headers = Array.from(rows[0].querySelectorAll('th')).map(th => th.textContent.trim());
            for (let i = 1; i < rows.length; i++) {
                const row = rows[i];
                const cells = row.querySelectorAll('td');
                const rowData = {};
                cells.forEach((cell, index) => {
                    rowData[headers[index] || `col_${index}`] = cell.textContent.trim();
                });
                results.push(rowData);
            }
        }
    }
    
    return { inputs, results, timestamp: new Date().toISOString() };
}

function collectClimbRateData() {
    const inputs = getFormInputs('.calculator-container');
    const resultsTable = document.getElementById('results-table');
    let results = [];
    
    if (resultsTable) {
        const rows = resultsTable.querySelectorAll('tr');
        if (rows.length > 1) {
            const headers = Array.from(rows[0].querySelectorAll('th')).map(th => th.textContent.trim());
            for (let i = 1; i < rows.length; i++) {
                const row = rows[i];
                const cells = row.querySelectorAll('td');
                const rowData = {};
                cells.forEach((cell, index) => {
                    rowData[headers[index] || `col_${index}`] = cell.textContent.trim();
                });
                results.push(rowData);
            }
        }
    }
    
    return { inputs, results, timestamp: new Date().toISOString() };
}

function collectSinkRateData() {
    const inputs = getFormInputs('.calculator-container');
    const resultsTable = document.getElementById('results-table');
    let results = [];
    
    if (resultsTable) {
        const rows = resultsTable.querySelectorAll('tr');
        if (rows.length > 1) {
            const headers = Array.from(rows[0].querySelectorAll('th')).map(th => th.textContent.trim());
            for (let i = 1; i < rows.length; i++) {
                const row = rows[i];
                const cells = row.querySelectorAll('td');
                const rowData = {};
                cells.forEach((cell, index) => {
                    rowData[headers[index] || `col_${index}`] = cell.textContent.trim();
                });
                results.push(rowData);
            }
        }
    }
    
    return { inputs, results, timestamp: new Date().toISOString() };
}

function collectLandingDistanceData() {
    const inputs = getFormInputs('.calculator-container');
    const resultsTable = document.getElementById('results-table');
    let results = [];
    
    if (resultsTable) {
        const rows = resultsTable.querySelectorAll('tr');
        if (rows.length > 1) {
            const headers = Array.from(rows[0].querySelectorAll('th')).map(th => th.textContent.trim());
            for (let i = 1; i < rows.length; i++) {
                const row = rows[i];
                const cells = row.querySelectorAll('td');
                const rowData = {};
                cells.forEach((cell, index) => {
                    rowData[headers[index] || `col_${index}`] = cell.textContent.trim();
                });
                results.push(rowData);
            }
        }
    }
    
    return { inputs, results, timestamp: new Date().toISOString() };
}

function collectTakeoffDistanceData() {
    const inputs = getFormInputs('.calculator-container');
    const resultsTable = document.getElementById('results-table');
    let results = [];
    
    if (resultsTable) {
        const rows = resultsTable.querySelectorAll('tr');
        if (rows.length > 1) {
            const headers = Array.from(rows[0].querySelectorAll('th')).map(th => th.textContent.trim());
            for (let i = 1; i < rows.length; i++) {
                const row = rows[i];
                const cells = row.querySelectorAll('td');
                const rowData = {};
                cells.forEach((cell, index) => {
                    rowData[headers[index] || `col_${index}`] = cell.textContent.trim();
                });
                results.push(rowData);
            }
        }
    }
    
    return { inputs, results, timestamp: new Date().toISOString() };
}

function collectVnDiagramData() {
    const inputs = getFormInputs('.calculator-container');
    const resultsTable = document.getElementById('results-table');
    let results = [];
    
    if (resultsTable) {
        const rows = resultsTable.querySelectorAll('tr');
        if (rows.length > 1) {
            const headers = Array.from(rows[0].querySelectorAll('th')).map(th => th.textContent.trim());
            for (let i = 1; i < rows.length; i++) {
                const row = rows[i];
                const cells = row.querySelectorAll('td');
                const rowData = {};
                cells.forEach((cell, index) => {
                    rowData[headers[index] || `col_${index}`] = cell.textContent.trim();
                });
                results.push(rowData);
            }
        }
    }
    
    return { inputs, results, timestamp: new Date().toISOString() };
}

function collectWheelTrackData() {
    const inputs = getFormInputs('.calculator-container');
    const resultsTable = document.getElementById('results-table');
    let results = [];
    
    if (resultsTable) {
        const rows = resultsTable.querySelectorAll('tr');
        if (rows.length > 1) {
            const headers = Array.from(rows[0].querySelectorAll('th')).map(th => th.textContent.trim());
            for (let i = 1; i < rows.length; i++) {
                const row = rows[i];
                const cells = row.querySelectorAll('td');
                const rowData = {};
                cells.forEach((cell, index) => {
                    rowData[headers[index] || `col_${index}`] = cell.textContent.trim();
                });
                results.push(rowData);
            }
        }
    }
    
    return { inputs, results, timestamp: new Date().toISOString() };
}

// Convert data to Excel format
function convertToExcel(tabData) {
    const wb = XLSX.utils.book_new();
    
    // Add each tab's data as a separate sheet
    Object.entries(tabData).forEach(([tabName, data]) => {
        // Flatten the data for Excel
        const flatData = [];
        
        // Add inputs
        if (data.inputs) {
            flatData.push(['INPUTS']);
            flatData.push(['Parameter', 'Value']);
            Object.entries(data.inputs).forEach(([key, value]) => {
                flatData.push([key, value]);
            });
            flatData.push([]); // Empty row for separation
        }
        
        // Add results if they exist
        if (data.results && Array.isArray(data.results) && data.results.length > 0) {
            flatData.push(['RESULTS']);
            
            // Add headers
            const headers = Object.keys(data.results[0]);
            flatData.push(headers);
            
            // Add data rows
            data.results.forEach(row => {
                flatData.push(headers.map(header => row[header]));
            });
        }
        
        // Add timestamp
        flatData.push([], ['Generated on', new Date().toLocaleString()]);
        
        // Create worksheet
        const ws = XLSX.utils.aoa_to_sheet(flatData);
        
        // Add worksheet to workbook
        XLSX.utils.book_append_sheet(wb, ws, tabName.substring(0, 31)); // Sheet name max 31 chars
    });
    
    return wb;
}

// Show export message to user
function showExportMessage(message, isError = false) {
    // Remove any existing messages
    const existingMessage = document.querySelector('.export-message');
    if (existingMessage) {
        existingMessage.remove();
    }
    
    // Create and show new message
    const messageEl = document.createElement('div');
    messageEl.className = `export-message ${isError ? 'export-error' : 'export-success'}`;
    messageEl.textContent = message;
    document.body.appendChild(messageEl);
    
    // Auto-hide after 5 seconds
    setTimeout(() => {
        messageEl.style.animation = 'fadeOut 0.5s ease-out';
        setTimeout(() => messageEl.remove(), 500);
    }, 5000);
}

// Set button loading state
function setButtonLoading(button, isLoading) {
    if (isLoading) {
        button.disabled = true;
        const loadingSpan = document.createElement('span');
        loadingSpan.className = 'import-loading';
        button.insertBefore(loadingSpan, button.firstChild);
    } else {
        button.disabled = false;
        const loadingSpan = button.querySelector('.import-loading');
        if (loadingSpan) {
            loadingSpan.remove();
        }
    }
}

// Main export function
export async function exportAllData(event) {
    const button = event?.target.closest('.import-btn');
    
    try {
        // Set loading state
        if (button) {
            setButtonLoading(button, true);
        }
        
        // Initialize SheetJS if not already done
        initExportUtils();
        
        if (!XLSX) {
            throw new Error('Excel export library not loaded. Please refresh the page and try again.');
        }
        
        // Show start message
        showExportMessage('Preparing data for export...');
        
        // Collect data from all tabs
        const allTabData = await collectAllTabData();
        
        // Check if we have any data to export
        const hasData = Object.values(allTabData).some(data => 
            (data.inputs && Object.keys(data.inputs).length > 0) || 
            (data.results && data.results.length > 0)
        );
        
        if (!hasData) {
            throw new Error('No data found to export. Please perform some calculations first.');
        }
        
        // Convert to Excel format
        showExportMessage('Creating Excel file...');
        const wb = convertToExcel(allTabData);
        
        // Generate filename with timestamp
        const timestamp = new Date().toISOString().replace(/[:.]/g, '-');
        const filename = `TG-APCalc-Export-${timestamp}.xlsx`;
        
        // Download the file
        showExportMessage('Downloading file...');
        XLSX.writeFile(wb, filename);
        
        // Show success message
        showExportMessage('Export completed successfully!');
        console.log('Export successful:', filename);
        return true;
        
    } catch (error) {
        console.error('Error exporting data:', error);
        showExportMessage(`Error: ${error.message}`, true);
        return false;
        
    } finally {
        // Reset button state
        if (button) {
            setButtonLoading(button, false);
        }
    }
}

// Initialize on window load
if (typeof window !== 'undefined') {
    window.addEventListener('load', () => {
        initExportUtils();
        
        // Add click handler to all export buttons
        document.querySelectorAll('.import-btn').forEach(btn => {
            // Remove any existing listeners to prevent duplicates
            btn.replaceWith(btn.cloneNode(true));
            const newBtn = document.querySelector(`#${btn.id}`);
            
            newBtn.addEventListener('click', (e) => {
                e.preventDefault();
                exportAllData(e);
            });
            
            // Add hover title for better UX
            newBtn.title = 'Export all calculator data to Excel';
            newBtn.setAttribute('aria-label', 'Export all calculator data to Excel');
        });
    });
}
