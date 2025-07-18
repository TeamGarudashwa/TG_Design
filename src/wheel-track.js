/**
 * Wheel Track and Base Calculator
 * Logs all localStorage data for debugging
 */

// Log all localStorage data when the script loads
function logAllLocalStorage() {
    console.log('=== LocalStorage Contents ===');
    
    // Get all keys from localStorage
    const keys = Object.keys(localStorage);
    
    if (keys.length === 0) {
        console.log('localStorage is empty');
        return;
    }
    
    // Create an array to store all localStorage data
    const storageData = [];
    
    // Process each key
    keys.forEach(key => {
        try {
            // Try to parse the value as JSON
            const value = JSON.parse(localStorage.getItem(key));
            storageData.push({
                'Key': key,
                'Type': typeof value,
                'Value': value
            });
        } catch (e) {
            // If parsing fails, store as string
            const value = localStorage.getItem(key);
            storageData.push({
                'Key': key,
                'Type': typeof value,
                'Value': value,
                'Note': 'Could not parse as JSON'
            });
        }
    });
    
    // Log the data in a table for better readability
    console.table(storageData, ['Key', 'Type', 'Value', 'Note']);
    
    // Log detailed view of each item
    console.log('\n=== Detailed View ===');
    storageData.forEach(item => {
        console.group(`Key: ${item.Key}`);
        console.log('Type:', item.Type);
        console.log('Value:', item.Value);
        if (item.Note) console.log('Note:', item.Note);
        console.groupEnd();
    });
}

// Initialize when the DOM is fully loaded
document.addEventListener('DOMContentLoaded', () => {
    console.log('Wheel Track Calculator initialized');
    logAllLocalStorage();
    
    // Add event listeners for the calculate and reset buttons
    const calculateBtn = document.getElementById('calculate');
    const resetBtn = document.getElementById('reset');
    
    if (calculateBtn) {
        calculateBtn.addEventListener('click', calculateWheelTrack);
    }
    
    if (resetBtn) {
        resetBtn.addEventListener('click', resetForm);
    }
});

/**
 * Calculate main gear distance from CG (Bm)
 * @param {number} wheelBase - Wheel base in inches
 * @param {number} weight - Weight in Newtons
 * @returns {number} Main gear distance from CG in inches
 */
function calculateMainGearDistance(wheelBase, weight) {
    return (wheelBase * weight * 0.2) / weight;
}

/**
 * Calculate nose gear distance from CG (Bn)
 * @param {number} wheelBase - Wheel base in inches
 * @param {number} weight - Weight in Newtons
 * @returns {number} Nose gear distance from CG in inches
 */
function calculateNoseGearDistance(wheelBase, weight) {
    return (wheelBase * weight * 0.8) / weight;
}

// Calculate wheel track based on inputs
function calculateWheelTrack() {
    console.log('Calculating wheel track...');
    
    // Get input values
    const wheelBaseStart = parseFloat(document.getElementById('wheel-base-start').value);
    const wheelBaseEnd = parseFloat(document.getElementById('wheel-base-end').value);
    const wheelBaseStep = parseFloat(document.getElementById('wheel-base-step').value);
    
    // Get weight from localStorage
    const savedInputs = localStorage.getItem('wingAreaInputs');
    if (!savedInputs) {
        alert('Please set the weight in the Wing Area tab first.');
        return;
    }
    
    // Parse the weight from saved inputs
    const weightKg = parseFloat(JSON.parse(savedInputs).weight);
    console.log('Weight from Wing Area tab:', weightKg, 'kg');
    
    // Validate weight
    if (isNaN(weightKg) || weightKg <= 0) {
        alert('Invalid weight found. Please set a valid weight in the Wing Area tab.');
        return;
    }
    
    // Convert weight from kg to Newtons (1 kg = 9.81 N)
    const weight = weightKg * 9.81;
    console.log('Weight in Newtons:', weight, 'N');
    
    // Validate inputs
    if (isNaN(wheelBaseStart) || isNaN(wheelBaseEnd) || isNaN(wheelBaseStep) || wheelBaseStep <= 0) {
        alert('Please enter valid wheel base range and step values');
        return;
    }
    
    // Generate wheel base values array
    const wheelBases = [];
    for (let wb = wheelBaseStart; wb <= wheelBaseEnd; wb += wheelBaseStep) {
        wheelBases.push(parseFloat(wb.toFixed(2)));
    }
    
    // Calculate results
    const results = wheelBases.map(wb => ({
        wheelBase: wb,
        mainGearDistance: calculateMainGearDistance(wb, weight),
        noseGearDistance: calculateNoseGearDistance(wb, weight)
    }));
    
    // Store results for export
    lastResults = [...results];
    
    // Display results
    displayResults(results);
    
    // Enable export button
    const exportBtn = document.getElementById('export-excel');
    if (exportBtn) {
        exportBtn.disabled = false;
    }
}

/**
 * Display the calculation results in a table
 * @param {Array} results - Array of result objects
 */
function displayResults(results) {
    const resultsContainer = document.getElementById('results-container');
    if (!resultsContainer) return;
    
    let html = `
        <div class="table-responsive">
            <table class="results-table">
                <thead>
                    <tr>
                        <th>Wheel Base (in)</th>
                        <th>Main Gear from CG (in)</th>
                        <th>Nose Gear from CG (in)</th>
                    </tr>
                </thead>
                <tbody>
    `;
    
    results.forEach(result => {
        html += `
            <tr>
                <td>${result.wheelBase.toFixed(2)}</td>
                <td>${result.mainGearDistance.toFixed(2)}</td>
                <td>${result.noseGearDistance.toFixed(2)}</td>
            </tr>
        `;
    });
    
    html += `
                </tbody>
            </table>
        </div>
    `;
    
    resultsContainer.innerHTML = html;
}

// Reset the form
function resetForm() {
    console.log('Resetting form...');
    const form = document.querySelector('form');
    if (form) form.reset();
    
    // Clear results container
    const resultsContainer = document.getElementById('results-container');
    if (resultsContainer) resultsContainer.innerHTML = '';
    
    // Clear stored results
    lastResults = [];
    
    // Disable export button
    const exportBtn = document.getElementById('export-excel');
    if (exportBtn) {
        exportBtn.disabled = true;
    }
}

// Make functions available globally for debugging
window.WheelTrack = {
    logAllLocalStorage,
    calculateWheelTrack,
    resetForm
};

/**
 * Export the results to an Excel file
 * @param {Array} results - The results to export
 */
function exportToExcel(results) {
    try {
        if (!results || results.length === 0) {
            alert('No data to export. Please calculate the wheel track first.');
            return;
        }

        // Prepare the worksheet
        const wsData = [
            ['Wheel Base (in)', 'Main Gear from CG (in)', 'Nose Gear from CG (in)'],
            ...results.map(item => [
                item.wheelBase.toFixed(2),
                item.mainGearDistance.toFixed(2),
                item.noseGearDistance.toFixed(2)
            ])
        ];

        // Create a worksheet
        const ws = XLSX.utils.aoa_to_sheet(wsData);

        // Create a workbook
        const wb = XLSX.utils.book_new();
        XLSX.utils.book_append_sheet(wb, ws, 'Wheel Track Results');

        // Generate the Excel file
        const fileName = `WheelTrack_Results_${new Date().toISOString().slice(0, 10)}.xlsx`;
        XLSX.writeFile(wb, fileName);
        
        console.log('Export successful:', fileName);
    } catch (error) {
        console.error('Error exporting to Excel:', error);
        alert('Error exporting to Excel. Please try again.');
    }
}

// Store the last results for export
let lastResults = [];

addEventListener('DOMContentLoaded', () => {
    console.log('Wheel Track Calculator initialized');
    logAllLocalStorage();
    
    // Add event listeners
    const calculateBtn = document.getElementById('calculate');
    const exportBtn = document.getElementById('export-excel');
    const resetBtn = document.getElementById('reset');
    
    if (calculateBtn) {
        calculateBtn.addEventListener('click', calculateWheelTrack);
    }
    
    if (exportBtn) {
        exportBtn.addEventListener('click', () => {
            if (lastResults && lastResults.length > 0) {
                exportToExcel(lastResults);
            } else {
                alert('No data to export. Please calculate the wheel track first.');
            }
        });
    }
    
    if (resetBtn) {
        resetBtn.addEventListener('click', resetForm);
    }
});