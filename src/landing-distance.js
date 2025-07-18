// Constants
const g = 9.81; // m/s²
const rho = 1.225; // kg/m³ (air density at sea level)

/**
 * Calculates the landing distance approach using the given parameters
 */
function calculateLandingDistance(vStall, lift, cd, surfaceArea) {
    // 1. Calculate takeoff and touchdown velocities
    const vTakeoff = 1.2 * vStall; // m/s
    const vTouchdown = 1.15 * vStall; // m/s

    // 2. Calculate drag force
    const drag = (rho * Math.pow(vTakeoff, 2) * surfaceArea * cd) / 2; // N

    // 3. Get thrust data if available
    let thrustData = null;
    let netThrustAtV = 0;
    try {
        const savedThrustData = JSON.parse(localStorage.getItem('dynamicThrustData') || '{}');
        if (savedThrustData && savedThrustData.thrustCurve && savedThrustData.thrustCurve.length > 0) {
            thrustData = savedThrustData;
            // Find the closest velocity point in the thrust curve to our takeoff velocity
            const closest = thrustData.thrustCurve.reduce((prev, curr) => 
                Math.abs(curr.velocity - vTakeoff) < Math.abs(prev.velocity - vTakeoff) ? curr : prev
            );
            netThrustAtV = closest.netThrust || 0;
        }
    } catch (e) {
        console.warn('Could not load thrust data:', e);
    }

    // 4. Calculate landing distance approach with thrust consideration
    const velocityTerm = (Math.pow(vTakeoff, 2) - Math.pow(vTouchdown, 2)) / (2 * g);
    
    // Adjust drag with net thrust (if available)
    const effectiveDrag = Math.max(0.1, drag - netThrustAtV); // Ensure we don't divide by zero
    const landingDistanceApproach = (lift / effectiveDrag) * (velocityTerm + 15);

    return {
        vStall,
        vTakeoff,
        vTouchdown,
        lift,
        drag,
        cd,
        surfaceArea,
        netThrustAtV,
        effectiveDrag,
        landingDistanceApproach,
        hasThrustData: !!thrustData
    };
}

/**
 * Updates the results table with the calculated values
 */
function updateResultsTable(results) {
    const table = document.getElementById('results-table');
    if (!table) return;

    // Clear existing rows
    table.innerHTML = '';

    // Helper function to add a row
    function addRow(label, value, unit = '') {
        const row = table.insertRow();
        const cell1 = row.insertCell(0);
        const cell2 = row.insertCell(1);
        cell1.innerHTML = `<strong>${label}</strong>`;
        cell2.textContent = `${value} ${unit}`.trim();
    }

    // Add header
    const header = table.createTHead();
    const headerRow = header.insertRow();
    headerRow.innerHTML = '<th>Parameter</th><th>Value</th>';

    // Add data rows
    addRow('Stall Speed (Vstall)', results.vStall.toFixed(2), 'm/s');
    addRow('Lift', results.lift.toFixed(2), 'N');
    addRow('Drag Coefficient (CD)', results.cd.toFixed(4), '');
    addRow('Surface Area', results.surfaceArea.toFixed(2), 'm²');
    addRow('Takeoff Velocity (1.2 × Vstall)', results.vTakeoff.toFixed(2), 'm/s');
    addRow('Touchdown Velocity (1.15 × Vstall)', results.vTouchdown.toFixed(2), 'm/s');
    addRow('Drag Force', results.drag.toFixed(2), 'N');
    
    // Add thrust-related information if available
    if (results.hasThrustData) {
        addRow('Net Thrust at Takeoff', results.netThrustAtV.toFixed(2), 'N');
        addRow('Effective Drag (Drag - Thrust)', results.effectiveDrag.toFixed(2), 'N');
        addRow('Lift-to-Effective Drag Ratio', (results.lift / results.effectiveDrag).toFixed(2), '');
    } else {
        addRow('Lift-to-Drag Ratio', (results.lift / results.drag).toFixed(2), '');
        const infoRow = table.insertRow();
        const infoCell = infoRow.insertCell(0);
        infoCell.colSpan = 2;
        infoCell.innerHTML = '<em>Note: For more accurate results, run the Dynamic Thrust calculator first to include thrust data.</em>';
        infoCell.style.color = '#ff9800';
        infoCell.style.fontStyle = 'italic';
    }

    // Highlight the final result
    const finalRow = table.insertRow();
    finalRow.style.backgroundColor = '#f5f8ff';
    finalRow.style.fontWeight = 'bold';
    
    const meters = results.landingDistanceApproach.toFixed(2);
    const feet = (results.landingDistanceApproach * 3.28084).toFixed(2); // Convert meters to feet
    
    const finalCell1 = finalRow.insertCell(0);
    const finalCell2 = finalRow.insertCell(1);
    finalCell1.innerHTML = '<strong>Landing Distance Approach</strong>';
    finalCell2.innerHTML = `
        <div style="display: flex; flex-direction: column; gap: 4px;">
            <div>${meters} meters</div>
            <div style="color: #4caf50;">${feet} feet</div>
        </div>
    `;
    finalCell2.style.fontWeight = 'bold';

    // Show the results section
    document.getElementById('results-section').style.display = 'block';
}

/**
 * Saves the landing distance data to localStorage
 */
function saveLandingDistanceData(data) {
    try {
        localStorage.setItem('landingDistanceData', JSON.stringify({
            cd: data.cd,
            vStall: data.vStall,
            vTakeoff: data.vTakeoff,
            vTouchdown: data.vTouchdown,
            lift: data.lift,
            drag: data.drag,
            surfaceArea: data.surfaceArea,
            netThrustAtV: data.netThrustAtV,
            effectiveDrag: data.effectiveDrag,
            landingDistance: data.landingDistanceApproach,
            timestamp: new Date().toISOString()
        }));
        return true;
    } catch (error) {
        console.error('Error saving landing distance data:', error);
        return false;
    }
}

/**
 * Loads the landing distance data from localStorage
 */
function loadLandingDistanceData() {
    try {
        const savedData = localStorage.getItem('landingDistanceData');
        if (savedData) {
            const data = JSON.parse(savedData);
            if (data.cd) {
                document.getElementById('cd-input').value = data.cd;
            }
            return data;
        }
    } catch (error) {
        console.error('Error loading landing distance data:', error);
    }
    return null;
}

/**
 * Saves the CD value to localStorage
 */
function saveCdToLocalStorage(cdValue) {
    try {
        localStorage.setItem('landingCdValue', cdValue);
    } catch (e) {
        console.error('Error saving CD value to localStorage:', e);
    }
}

/**
 * Loads the CD value from localStorage
 */
function loadCdFromLocalStorage() {
    try {
        return localStorage.getItem('landingCdValue');
    } catch (e) {
        console.error('Error loading CD value from localStorage:', e);
        return null;
    }   
}

/**
 * Saves the drag value to localStorage
 */
function saveDragToLocalStorage(dragValue) {
    try {
        // Get existing aerodynamic data or create a new object
        let aeroData = {};
        const savedData = localStorage.getItem('aerodynamicData');
        if (savedData) {
            aeroData = JSON.parse(savedData);
        }
        
        // Update the drag value
        aeroData.drag = dragValue;
        aeroData.timestamp = new Date().toISOString();
        
        // Save back to localStorage
        localStorage.setItem('aerodynamicData', JSON.stringify(aeroData));
        console.log('Saved drag value to localStorage:', dragValue);
    } catch (e) {
        console.error('Error saving drag value to localStorage:', e);
    }
}

/**
 * Gets the required values and calculates landing distance
 */
function calculateAndDisplayLandingDistance() {
    try {
        // Get CD input value
        const cdInput = document.getElementById('cd-input');
        const cdValue = parseFloat(cdInput.value);

        if (isNaN(cdValue) || cdValue <= 0) {
            showUserMessage('Please enter a valid positive number for CD', 'error');
            return;
        }

        // Get required parameters from wing parameters
        const wingParams = JSON.parse(localStorage.getItem('wingParametersInputs') || '{}');
        
        if (!wingParams || !wingParams.weight || !wingParams.surfaceArea || !wingParams.clMax) {
            showUserMessage('Please complete the Wing Parameters calculation first', 'error');
            return;
        }

        // Calculate stall speed
        const weight = parseFloat(wingParams.weight);
        const surfaceArea = parseFloat(wingParams.surfaceArea);
        const clMax = parseFloat(wingParams.clMax);
        const vStall = Math.sqrt((2 * weight * 9.81) / (1.225 * surfaceArea * clMax));
        const lift = weight * 9.81; // N

        // Calculate landing distance
        const results = calculateLandingDistance(vStall, lift, cdValue, surfaceArea);

        // Save results to localStorage
        if (saveLandingDistanceData(results)) {
            showUserMessage('Landing distance calculated and saved successfully!', 'success');
        } else {
            showUserMessage('Warning: Could not save landing distance data', 'warning');
        }

        // Update the UI
        updateResultsTable(results);
        document.getElementById('results-section').style.display = 'block';

        // Scroll to results
        document.getElementById('results-section').scrollIntoView({ behavior: 'smooth' });

    } catch (error) {
        console.error('Error in landing distance calculation:', error);
        showUserMessage('An error occurred during calculation. Please check the console for details.', 'error');
    }
}

// Initialize when the page loads
document.addEventListener('DOMContentLoaded', () => {
    const calculateBtn = document.getElementById('calculate-btn');
    const resetBtn = document.getElementById('reset-btn');

    // Load saved data if exists
    const savedData = loadLandingDistanceData();
    if (savedData) {
        // If we have saved data, display the results
        updateResultsTable(savedData);
        document.getElementById('results-section').style.display = 'block';
    }

    // Load saved CD value if it exists
    const savedCd = loadCdFromLocalStorage();
    const cdInput = document.getElementById('cd-input');
    if (savedCd && cdInput) {
        cdInput.value = savedCd;
    }

    // Add input event listener to save CD when it changes
    if (cdInput) {
        cdInput.addEventListener('input', (e) => {
            saveCdToLocalStorage(e.target.value);
        });
    }

    // Calculate button click handler
    if (calculateBtn) {
        calculateBtn.addEventListener('click', calculateAndDisplayLandingDistance);
    }

    // Reset button click handler
    if (resetBtn) {
        resetBtn.addEventListener('click', () => {
            if (cdInput) cdInput.value = '';
            document.getElementById('results-section').style.display = 'none';
            // Clear the saved CD value
            localStorage.removeItem('landingCdValue');
        });
    }

    // Add consistent styling with other result tables
    const style = document.createElement('style');
    style.textContent = `
        .results-table {
            width: 100%;
            border-collapse: collapse;
            margin: 1rem 0;
            font-size: 0.9em;
            font-family: 'Segoe UI', Tahoma, Geneva, Verdana, sans-serif;
        }

        /* Light theme (default) */
        :root {
            --bg-color: #ffffff;
            --text-color: #333333;
            --border-color: #e0e0e0;
            --row-odd: #f9f9f9;
            --row-hover: #f0f0f0;
            --header-bg: #2c3e50;
            --highlight-bg: rgba(76, 175, 80, 0.1);
            --highlight-color: #2e7d32;
            --shadow-color: rgba(0, 0, 0, 0.1);
        }

        /* Dark theme - applied when body has .dark-theme class */
        body.dark-theme {
            --bg-color: #1e1e1e;
            --text-color: #e0e0e0;
            --border-color: #37474f;
            --row-odd: #2a2a2a;
            --row-hover: #37474f;
            --header-bg: #1a237e;
            --highlight-bg: rgba(76, 175, 80, 0.15);
            --highlight-color: #4CAF50;
            --shadow-color: rgba(0, 0, 0, 0.3);
        }

        /* Apply theme colors */
        body {
            color: var(--text-color);
            background-color: var(--bg-color);
        }

        .results-table {
            color: var(--text-color);
        }

        .results-table th {
            background-color: var(--header-bg);
            color: white;
            text-align: left;
            padding: 12px 15px;
            font-weight: 600;
            text-transform: uppercase;
            font-size: 0.8em;
            letter-spacing: 0.5px;
        }

        .results-table td {
            padding: 12px 15px;
            border-bottom: 1px solid var(--border-color);
            vertical-align: middle;
        }

        .results-table tbody tr:nth-of-type(odd) {
            background-color: var(--row-odd);
        }

        .results-table tbody tr:last-of-type {
            border-bottom: 2px solid var(--highlight-color);
        }

        .results-table tbody tr:hover {
            background-color: var(--row-hover);
        }

        .result-highlight {
            background-color: var(--highlight-bg) !important;
        }

        .result-highlight td {
            font-weight: 600;
            color: var(--highlight-color);
            font-size: 1.1em;
            padding: 15px;
        }

        .results-section {
            animation: fadeIn 0.3s ease-out;
            background-color: var(--bg-color);
            border-radius: 8px;
            box-shadow: 0 4px 6px var(--shadow-color);
            padding: 1.5rem;
            margin-top: 1.5rem;
            border-left: 4px solid var(--highlight-color);
            color: var(--text-color);
        }

        .results-section h2 {
            color: var(--highlight-color);
            margin-top: 0;
            margin-bottom: 1.2rem;
            font-size: 1.5em;
            font-weight: 600;
        }

        @keyframes fadeIn {
            from { opacity: 0; transform: translateY(10px); }
            to { opacity: 1; transform: translateY(0); }
        }

        @media (max-width: 768px) {
            .results-table {
                display: block;
                overflow-x: auto;
                -webkit-overflow-scrolling: touch;
            }
        }
    `;
    document.head.appendChild(style);

    // Function to check and apply theme
    function checkTheme() {
        const isDark = document.body.classList.contains('dark-theme');
        document.documentElement.style.setProperty('--bg-color', isDark ? '#1e1e1e' : '#ffffff');
        document.documentElement.style.setProperty('--text-color', isDark ? '#e0e0e0' : '#333333');
    }

    // Initial theme check
    checkTheme();

    // Log available thrust to console
    function logAvailableThrust() {
        try {
            const thrustData = JSON.parse(localStorage.getItem('dynamicThrustData') || '{}');
            if (thrustData && thrustData.thrustCurve && thrustData.thrustCurve.length > 0) {
                console.log('=== Thrust Data ===');
                console.log(`Maximum Thrust: ${thrustData.maxThrust.toFixed(2)} N`);
                console.log('Thrust Curve (Velocity vs Thrust):');
                
                // Log the thrust curve in a table format
                console.table(thrustData.thrustCurve.map(item => ({
                    'Velocity (m/s)': item.velocity.toFixed(2),
                    'Thrust (N)': item.thrust.toFixed(2),
                    'Drag (N)': item.drag ? item.drag.toFixed(2) : 'N/A',
                    'Net Thrust (N)': item.netThrust ? item.netThrust.toFixed(2) : 'N/A'
                })));
                
                // Log additional details
                console.log('Propeller Details:', {
                    'RPM': thrustData.rpm,
                    'Diameter (in)': thrustData.propDiameter,
                    'Pitch (in)': thrustData.propPitch,
                    'Last Updated': new Date(thrustData.timestamp).toLocaleString()
                });
            } else {
                console.log('No thrust curve data available. Please run the dynamic thrust calculator first.');
            }
        } catch (e) {
            console.error('Error retrieving thrust data:', e);
        }
    }

    // Call the function when the page loads
    logAvailableThrust();

    // Watch for theme changes
    const observer = new MutationObserver((mutations) => {
        mutations.forEach((mutation) => {
            if (mutation.attributeName === 'class') {
                checkTheme();
            }
        });
    });

    observer.observe(document.body, {
        attributes: true,
        attributeFilter: ['class']
    });
});