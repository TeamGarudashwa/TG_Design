// Constants
const g = 9.81; // m/s²
const rho = 1.225; // kg/m³ (air density at sea level)

// Saves the takeoff distance data to localStorage
function saveTakeoffDistanceData(data) {
    try {
        localStorage.setItem('takeoffDistanceData', JSON.stringify({
            distance: data.distance,
            liftForce: data.liftForce,
            thrustAtTakeoff: data.thrustAtTakeoff,
            vTakeoff: data.vTakeoff,
            vStall: data.vStall,
            weight: data.weight,
            surfaceArea: data.surfaceArea,
            clMax: data.clMax,
            timestamp: new Date().toISOString()
        }));
        return true;
    } catch (error) {
        console.error('Error saving takeoff distance data:', error);
        return false;
    }
}

// Loads the takeoff distance data from localStorage
function loadTakeoffDistanceData() {
    try {
        const savedData = localStorage.getItem('takeoffDistanceData');
        if (savedData) {
            return JSON.parse(savedData);
        }
    } catch (error) {
        console.error('Error loading takeoff distance data:', error);
    }
    return null;
}

// Function to update the results table
function updateResultsTable(data) {
    const table = document.getElementById('results-table');
    if (!table) {
        console.error('Results table not found');
        return;
    }

    // Clear existing rows
    table.innerHTML = '';

    // Add header row
    const thead = document.createElement('thead');
    const headerRow = document.createElement('tr');
    const headers = ['Parameter', 'Value', 'Unit'];
    
    headers.forEach(headerText => {
        const th = document.createElement('th');
        th.textContent = headerText;
        headerRow.appendChild(th);
    });
    
    thead.appendChild(headerRow);
    table.appendChild(thead);

    // Add data rows
    const tbody = document.createElement('tbody');
    
    const rows = [
        { label: 'Takeoff Distance', value: data.distance.toFixed(2), unit: 'm' },
        { label: 'Lift Force at Takeoff', value: data.liftForce.toFixed(2), unit: 'N' },
        { label: 'Thrust at Takeoff', value: data.thrustAtTakeoff.toFixed(2), unit: 'N' },
        { label: 'Takeoff Speed (1.2 × Vstall)', value: data.vTakeoff.toFixed(2), unit: 'm/s' },
        { label: 'Stall Speed', value: data.vStall.toFixed(2), unit: 'm/s' },
        { label: 'Weight', value: data.weight.toFixed(2), unit: 'N' },
        { label: 'Wing Area', value: data.surfaceArea.toFixed(2), unit: 'm²' },
        { label: 'Max Lift Coefficient', value: data.clMax.toFixed(4), unit: '' }
    ];

    rows.forEach(row => {
        const tr = document.createElement('tr');
        
        const labelCell = document.createElement('td');
        labelCell.textContent = row.label;
        
        const valueCell = document.createElement('td');
        valueCell.textContent = row.value;
        
        const unitCell = document.createElement('td');
        unitCell.textContent = row.unit;
        
        tr.appendChild(labelCell);
        tr.appendChild(valueCell);
        tr.appendChild(unitCell);
        
        tbody.appendChild(tr);
    });

    table.appendChild(tbody);
    
    // Save the data
    saveTakeoffDistanceData(data);
}

// Function to calculate thrust at a given velocity
function calculateThrustAtVelocity(velocity) {
    try {
        const thrustData = JSON.parse(localStorage.getItem('dynamicThrustData') || '{}');
        if (!thrustData || !thrustData.thrustCurve || thrustData.thrustCurve.length === 0) {
            console.error('No thrust curve data available');
            return 0;
        }

        const sortedCurve = [...thrustData.thrustCurve].sort((a, b) => a.velocity - b.velocity);
        
        if (velocity <= sortedCurve[0].velocity) return sortedCurve[0].thrust;
        if (velocity >= sortedCurve[sortedCurve.length - 1].velocity) {
            return sortedCurve[sortedCurve.length - 1].thrust;
        }

        let lower = sortedCurve[0];
        let upper = sortedCurve[sortedCurve.length - 1];
        
        for (let i = 0; i < sortedCurve.length - 1; i++) {
            if (sortedCurve[i].velocity <= velocity && sortedCurve[i + 1].velocity >= velocity) {
                lower = sortedCurve[i];
                upper = sortedCurve[i + 1];
                break;
            }
        }

        const ratio = (velocity - lower.velocity) / (upper.velocity - lower.velocity);
        return lower.thrust + (upper.thrust - lower.thrust) * ratio;
    } catch (e) {
        console.error('Error calculating thrust at velocity:', e);
        return 0;
    }
}

// Function to get values from localStorage
function getValuesFromLocalStorage() {
    try {
        const aeroData = JSON.parse(localStorage.getItem('aerodynamicData') || '{}');
        const wingParams = JSON.parse(localStorage.getItem('wingParametersInputs') || '{}');
        const wingAreaData = JSON.parse(localStorage.getItem('wingAreaInputs') || '{}');
        const thrustData = JSON.parse(localStorage.getItem('dynamicThrustData') || '{}');
        
        console.log('Debug - Retrieved data:', {
            aeroData,
            wingParams,
            wingAreaData,
            thrustData: { ...thrustData, thrustCurve: '[...]' } // Don't log full curve
        });
        
        // Get weight in kg (assuming input is in kg)
        let weight = parseFloat(wingAreaData.weight || aeroData.weight || wingParams.weight || 0);
        let surfaceArea = parseFloat(wingParams.surfaceArea || wingAreaData.surfaceArea || 0);
        const clMax = parseFloat(aeroData.clMax || wingParams.clMax || 1.5); // Default to 1.5 if not set
        
        // Validate and correct unrealistic values
        if (weight <= 0) {
            console.warn('Invalid weight, using default 1.5 kg');
            weight = 1.5; // Default to 1.5 kg for a small UAV
        }
        
        // Calculate reasonable wing area based on weight if not provided or unrealistic
        if (surfaceArea <= 0 || surfaceArea > 2) { // More than 2 m² is too large for a small UAV
            // Typical wing loading for small UAVs is 2-10 kg/m²
            const wingLoading = 5; // kg/m² (middle of typical range)
            surfaceArea = weight / wingLoading;
            console.warn(`Adjusted wing area to ${surfaceArea.toFixed(3)} m² based on weight`);
        }
        
        // Calculate drag using standard aerodynamic formula
        // For small UAVs, typical Cd is around 0.03-0.05
        const cd = 0.04; // Slightly higher Cd for small UAVs
        const takeoffSpeed = 10; // m/s (typical takeoff speed for small UAVs)
        let drag = 0.5 * rho * Math.pow(takeoffSpeed, 2) * surfaceArea * cd;
        console.log(`Calculated drag: ${drag.toFixed(2)} N (Cd=${cd}, V=${takeoffSpeed} m/s, S=${surfaceArea.toFixed(3)} m²)`);
        
        // Calculate Vstall if we have the required parameters
        let vStall = 0;
        if (weight > 0 && surfaceArea > 0 && clMax > 0) {
            vStall = Math.sqrt((2 * weight * 9.81) / (rho * surfaceArea * clMax));
        }
        
        const vTakeoff = vStall > 0 ? vStall * 1.2 : 0;
        const thrustAtTakeoff = vTakeoff > 0 ? calculateThrustAtVelocity(vTakeoff) : 0;
        
        // For small UAVs, thrust-to-weight ratio is typically 0.3-0.5
        const minThrustRatio = 0.3; // Minimum thrust/weight ratio for small UAVs
        const minRequiredThrust = weight * 9.81 * minThrustRatio;
        
        // Use the larger of calculated thrust or minimum required thrust
        const effectiveThrust = Math.max(thrustAtTakeoff, minRequiredThrust);
        
        console.log(`Thrust requirements: ` +
                   `Calculated=${thrustAtTakeoff.toFixed(2)} N, ` +
                   `Minimum Required=${minRequiredThrust.toFixed(2)} N`);
        
        // Calculate weight in Newtons for the return object
        const weightN = weight * 9.81;
        
        console.log('Takeoff parameters:', {
            weight: `${weight} kg (${weightN.toFixed(2)} N)`,
            surfaceArea: `${surfaceArea} m²`,
            clMax,
            vStall: `${vStall.toFixed(2)} m/s`,
            vTakeoff: `${vTakeoff.toFixed(2)} m/s`,
            drag: `${drag.toFixed(2)} N`,
            thrustAtTakeoff: `${thrustAtTakeoff.toFixed(2)} N`,
            minRequiredThrust: `${minRequiredThrust.toFixed(2)} N`,
            effectiveThrust: `${effectiveThrust.toFixed(2)} N`
        });
        
        return {
            surfaceArea,
            rho: 1.225,
            g: 9.81,
            clMax,
            weight: weightN, // Weight in Newtons
            drag,
            thrustAvailable: effectiveThrust,
            vStall,
            vTakeoff,
            thrustAtTakeoff: effectiveThrust,
            mu_r: 0.02  // Rolling friction coefficient (typical for hard surface)
        };
    } catch (e) {
        console.error('Error retrieving data from localStorage:', e);
        return null;
    }
}

// Calculate takeoff distance
function calculateTakeoffDistance(params) {
    if (!params) {
        console.error('No parameters provided');
        return { distance: 0, error: 'No parameters provided' };
    }

    const {
        weight, surfaceArea, rho, g, clMax, drag, vStall, vTakeoff, thrustAtTakeoff, mu_r
    } = params;

    // Validate inputs
    if ([weight, surfaceArea, clMax, vTakeoff].some(val => val <= 0)) {
        const errorMsg = 'One or more required parameters are missing or invalid. ' +
                       'Please complete the required calculations first.';
        console.error(errorMsg, { weight, surfaceArea, clMax, vTakeoff });
        return { distance: 0, error: errorMsg };
    }

    // Calculate intermediate values
    const liftForce = 0.5 * rho * Math.pow(vTakeoff, 2) * surfaceArea * clMax;
    const thrustToWeight = thrustAtTakeoff / weight;
    const dragToWeight = drag / weight;
    const liftToWeight = liftForce / weight;
    
    // Calculate the term inside parentheses
    const accelerationTerm = thrustToWeight - dragToWeight - (mu_r * (1 - liftToWeight));
    
    // Check if the aircraft can take off (positive acceleration)
    if (accelerationTerm <= 0) {
        const errorMsg = 'Aircraft cannot take off with current parameters. ' +
                       'Thrust is insufficient to overcome drag and rolling resistance.';
        console.error(errorMsg, { 
            thrustToWeight, 
            dragToWeight, 
            liftToWeight,
            accelerationTerm 
        });
        return { distance: Infinity, error: errorMsg };
    }
    
    const denominator = surfaceArea * rho * g * clMax * accelerationTerm;
    
    if (denominator <= 0) {
        const errorMsg = 'Invalid calculation parameters. Please check your inputs.';
        console.error(errorMsg, { surfaceArea, rho, g, clMax, accelerationTerm, denominator });
        return { distance: Infinity, error: errorMsg };
    }

    const distance = (1.44 * weight) / denominator;
    
    return {
        distance,
        liftForce,
        thrustToWeight,
        dragToWeight,
        liftToWeight,
        accelerationTerm,
        error: null
    };
}

// Function to show user messages
function showUserMessage(message, type = 'info') {
    const messageDiv = document.createElement('div');
    messageDiv.className = `user-message ${type}`;
    messageDiv.textContent = message;
    
    // Remove any existing messages
    const existingMessages = document.querySelectorAll('.user-message');
    existingMessages.forEach(msg => msg.remove());
    
    // Add the new message
    const container = document.querySelector('.calculator-container');
    if (container) {
        container.insertBefore(messageDiv, container.firstChild);
        
        // Auto-remove message after 5 seconds
        setTimeout(() => {
            if (messageDiv.parentNode) {
                messageDiv.style.opacity = '0';
                messageDiv.style.transition = 'opacity 0.5s';
                setTimeout(() => messageDiv.remove(), 500);
            }
        }, 5000);
    }
}

// Initialize the calculator
function initTakeoffCalculator() {
    const calculateBtn = document.getElementById('calculate-btn');
    const resetBtn = document.getElementById('reset-btn');

    if (!calculateBtn || !resetBtn) {
        console.error('Required buttons not found');
        return;
    }

    // Add styles for user messages
    const style = document.createElement('style');
    style.textContent = `
        .user-message {
            padding: 12px 20px;
            margin: 10px 0;
            border-radius: 4px;
            font-weight: 500;
            animation: slideIn 0.3s ease-out;
        }
        .user-message.success {
            background-color: #d4edda;
            color: #155724;
            border: 1px solid #c3e6cb;
        }
        .user-message.error {
            background-color: #f8d7da;
            color: #721c24;
            border: 1px solid #f5c6cb;
        }
        .user-message.warning {
            background-color: #fff3cd;
            color: #856404;
            border: 1px solid #ffeeba;
        }
        .user-message.info {
            background-color: #d1ecf1;
            color: #0c5460;
            border: 1px solid #bee5eb;
        }
        @keyframes slideIn {
            from { transform: translateY(-20px); opacity: 0; }
            to { transform: translateY(0); opacity: 1; }
        }
    `;
    document.head.appendChild(style);

    // Load saved data if available
    const savedData = loadTakeoffDistanceData();
    if (savedData) {
        updateResultsTable(savedData);
        document.getElementById('results-section').style.display = 'block';
    }

    calculateBtn.addEventListener('click', () => {
        try {
            // Get required parameters from wing parameters
            const wingParams = JSON.parse(localStorage.getItem('wingParametersInputs') || '{}');
            
            if (!wingParams || !wingParams.weight || !wingParams.surfaceArea || !wingParams.clMax) {
                showUserMessage('Please complete the Wing Parameters calculation first', 'error');
                return;
            }

            // Get weight in kg and convert to Newtons
            const weight = parseFloat(wingParams.weight) * 9.81; // Convert kg to N
            const surfaceArea = parseFloat(wingParams.surfaceArea);
            const clMax = parseFloat(wingParams.clMax);

            // Calculate stall speed
            const vStall = Math.sqrt((2 * weight) / (rho * surfaceArea * clMax));
            const vTakeoff = 1.2 * vStall; // Takeoff speed is 1.2 * Vstall

            // Calculate thrust at takeoff speed
            const thrustAtTakeoff = calculateThrustAtVelocity(vTakeoff);
            
            if (thrustAtTakeoff <= 0) {
                showUserMessage('Warning: No thrust data available for takeoff speed. Using simplified calculation.', 'warning');
            }
            
            // Calculate lift at takeoff (should equal weight at takeoff)
            const liftAtTakeoff = 0.5 * rho * Math.pow(vTakeoff, 2) * surfaceArea * clMax;

            // Calculate takeoff distance (simplified)
            // This is a placeholder - you should replace with your actual takeoff distance calculation
            const takeoffDistance = (1.44 * Math.pow(weight, 2)) / (9.8 * rho * surfaceArea * clMax * (thrustAtTakeoff > 0 ? thrustAtTakeoff : weight * 0.3));

            // Create results object
            const results = {
                distance: takeoffDistance,
                liftForce: liftAtTakeoff,
                thrustAtTakeoff: thrustAtTakeoff,
                vTakeoff: vTakeoff,
                vStall: vStall,
                weight: weight,
                surfaceArea: surfaceArea,
                clMax: clMax
            };

            // Update the UI and save data
            updateResultsTable(results);
            document.getElementById('results-section').style.display = 'block';
            
            // Show success message
            showUserMessage('Takeoff distance calculated and saved successfully!', 'success');

        } catch (error) {
            console.error('Error in takeoff calculation:', error);
            showUserMessage('An error occurred during calculation. Please check the console for details.', 'error');
        }
    });

    resetBtn.addEventListener('click', () => {
        // Clear the results
        const table = document.getElementById('results-table');
        if (table) table.innerHTML = '';
        document.getElementById('results-section').style.display = 'none';
        
        // Clear saved data
        localStorage.removeItem('takeoffDistanceData');
        
        showUserMessage('Takeoff distance data has been reset', 'info');
    });
}

document.addEventListener('DOMContentLoaded', initTakeoffCalculator);