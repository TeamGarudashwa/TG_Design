// Sink Rate Calculator
// Chart instance
let sinkRateChart = null;
const GRAVITY = 9.81; // m/s²

// DOM Elements
const calculateBtn = document.getElementById('calculate-sink-rate');
const resetBtn = document.getElementById('reset-sink-rate');
const resultsSection = document.getElementById('results-section');
const resultsContainer = document.getElementById('results-container');

// Wait for DOM to be fully loaded
document.addEventListener('DOMContentLoaded', function() {
    console.log('Sink Rate Calculator: DOM fully loaded');
    
    // Initialize chart when the page loads
    initSinkRateChart();
    
    // Add event listeners
    if (calculateBtn) {
        console.log('Calculate button found, adding click handler');
        calculateBtn.addEventListener('click', function() {
            console.log('Calculate button clicked!');
            calculateSinkRate();
        });
    } else {
        console.error('Calculate button not found!');
    }

    if (resetBtn) {
        resetBtn.addEventListener('click', resetSinkRateCalculator);
    }

    // Initial calculation if data is available
    if (localStorage.getItem('wingAreaCalculatorData') && localStorage.getItem('dynamicThrustData')) {
        console.log('Found required data in localStorage, calculating...');
        logAllSinkParameters();
    } else {
        console.log('Required data not found in localStorage');
    }
});

function initSinkRateChart() {
    console.log('Initializing sink rate chart...');
    const canvas = document.getElementById('sinkRateChart');
    
    if (!canvas) {
        console.error('Error: Could not find sink rate chart canvas');
        return;
    }
    
    // Set explicit dimensions
    const container = canvas.parentElement;
    if (container) {
        canvas.width = container.offsetWidth;
        canvas.height = container.offsetHeight;
    }

    const ctx = canvas.getContext('2d');
    
    // Destroy existing chart if it exists
    if (sinkRateChart) {
        console.log('Destroying existing sink rate chart');
        sinkRateChart.destroy();
    }
    
    try {
        console.log('Creating new sink rate chart instance');
        sinkRateChart = new Chart(ctx, {
            type: 'line',
            data: {
                labels: [],
                datasets: [
                    {
                        label: 'Sink Rate (m/s)',
                        data: [],
                        borderColor: 'rgb(75, 192, 192)',
                        backgroundColor: 'rgba(75, 192, 192, 0.1)',
                        borderWidth: 2,
                        tension: 0.4,
                        yAxisID: 'y',
                        fill: true
                    },
                    {
                        label: 'Sink Rate (ft/min)',
                        data: [],
                        borderColor: 'rgb(255, 99, 132)',
                        backgroundColor: 'rgba(255, 99, 132, 0.1)',
                        borderWidth: 2,
                        tension: 0.4,
                        yAxisID: 'y1',
                        fill: false
                    }
                ]
            },
            options: {
                responsive: true,
                maintainAspectRatio: false,
                interaction: {
                    mode: 'index',
                    intersect: false,
                },
                plugins: {
                    title: {
                        display: true,
                        text: 'Sink Rate vs Velocity',
                        font: {
                            size: 16
                        }
                    },
                    tooltip: {
                        mode: 'index',
                        intersect: false
                    },
                    legend: {
                        position: 'top',
                    }
                },
                scales: {
                    x: {
                        title: {
                            display: true,
                            text: 'Velocity (m/s)',
                            font: {
                                weight: 'bold'
                            }
                        },
                        grid: {
                            display: true
                        }
                    },
                    y: {
                        type: 'linear',
                        display: true,
                        position: 'left',
                        title: {
                            display: true,
                            text: 'Sink Rate (m/s)',
                            font: {
                                weight: 'bold'
                            }
                        },
                        grid: {
                            drawOnChartArea: true
                        }
                    },
                    y1: {
                        type: 'linear',
                        display: true,
                        position: 'right',
                        title: {
                            display: true,
                            text: 'Sink Rate (ft/min)',
                            font: {
                                weight: 'bold'
                            }
                        },
                        grid: {
                            drawOnChartArea: false
                        }
                    }
                }
            }
        });
        console.log('Sink rate chart initialized successfully');
    } catch (error) {
        console.error('Error initializing sink rate chart:', error);
        showError('Failed to initialize chart. Please try refreshing the page.');
    }
}

function updateSinkRateChart(velocityRange, sinkRatesMs) {
    console.log('Updating sink rate chart with data:', { velocityRange, sinkRatesMs });
    
    // First, update the chart as before
    if (!sinkRateChart) {
        initSinkRateChart();
    }

    try {
        // Update chart data
        sinkRateChart.data.labels = velocityRange;
        sinkRateChart.data.datasets[0].data = sinkRatesMs;
        sinkRateChart.data.datasets[1].data = sinkRatesMs.map(rate => rate * 196.85); // Convert to ft/min
        
        // Update chart
        sinkRateChart.update();
        
        // Now create the results table
        createSinkRateTable(velocityRange, sinkRatesMs);
        
    } catch (error) {
        console.error('Error updating sink rate chart:', error);
        showError('Failed to update chart: ' + (error.message || 'Unknown error'));
    }
}

function createSinkRateTable(velocityRange, sinkRatesMs) {
    const resultsContainer = document.getElementById('results-container');
    if (!resultsContainer) return;
    
    // Get the dynamic thrust data
    const dynamicThrustData = JSON.parse(localStorage.getItem('dynamicThrustData') || '{}');
    if (!dynamicThrustData || !dynamicThrustData.thrustCurve) {
        console.error('No thrust data available for table');
        return;
    }
    
    // Create a map of velocity to thrust data for easy lookup
    const thrustDataMap = {};
    dynamicThrustData.thrustCurve.forEach(point => {
        thrustDataMap[point.velocity] = point;
    });
    
    // Create table HTML
    let tableHTML = `
    <div class="results-table-container">
        <h3>Sink Rate Results</h3>
        <div class="table-responsive">
            <table class="sink-rate-table">
                <thead>
                    <tr>
                        <th>Velocity (m/s)</th>
                        <th>Thrust Available (N)</th>
                        <th>Thrust Available (kg)</th>
                        <th>Thrust Required (N)</th>
                        <th>Sink Rate (m/s)</th>
                        <th>Sink Rate (ft/min)</th>
                    </tr>
                </thead>
                <tbody>`;
    
    // Add table rows
    velocityRange.forEach((velocity, index) => {
        const point = thrustDataMap[velocity] || {};
        const thrustAvailN = point.thrust || 0;
        const thrustAvailKg = thrustAvailN / GRAVITY;
        const thrustReqN = point.drag || 0;
        const sinkRateMs = sinkRatesMs[index] || 0;
        const sinkRateFpm = sinkRateMs * 196.85;
        
        tableHTML += `
                    <tr>
                        <td>${velocity.toFixed(1)}</td>
                        <td>${thrustAvailN.toFixed(3)}</td>
                        <td>${thrustAvailKg.toFixed(3)}</td>
                        <td>${thrustReqN.toFixed(3)}</td>
                        <td>${sinkRateMs.toFixed(3)}</td>
                        <td>${sinkRateFpm.toFixed(1)}</td>
                    </tr>`;
    });
    
    tableHTML += `
                </tbody>
            </table>
        </div>
    </div>`;
    
    // Add CSS for the table
    const style = document.createElement('style');
    style.textContent = `
        .results-table-container {
            margin: 20px 0;
            width: 100%;
            overflow-x: auto;
        }
        .sink-rate-table {
            width: 100%;
            border-collapse: collapse;
            margin: 15px 0;
            font-size: 0.9em;
            min-width: 800px;
            box-shadow: 0 0 10px rgba(0, 0, 0, 0.1);
            border-radius: 8px;
            overflow: hidden;
        }
        .sink-rate-table thead tr {
            background-color: #4a6fa5;
            color: #ffffff;
            text-align: left;
            font-weight: bold;
        }
        .sink-rate-table th,
        .sink-rate-table td {
            padding: 12px 15px;
            text-align: right;
        }
        .sink-rate-table th:first-child,
        .sink-rate-table td:first-child {
            text-align: left;
        }
        .sink-rate-table tbody tr {
            border-bottom: 1px solid #dddddd;
        }
        .sink-rate-table tbody tr:nth-of-type(even) {
            background-color: #f3f3f3;
        }
        .sink-rate-table tbody tr:last-of-type {
            border-bottom: 2px solid #4a6fa5;
        }
        .sink-rate-table tbody tr:hover {
            background-color: #e6f2ff;
        }
        .table-responsive {
            overflow-x: auto;
        }
        @media (max-width: 768px) {
            .sink-rate-table {
                font-size: 0.8em;
            }
            .sink-rate-table th,
            .sink-rate-table td {
                padding: 8px 10px;
            }
        }`;
    
    // Clear previous results and add new table
    resultsContainer.innerHTML = '';
    resultsContainer.appendChild(style);
    resultsContainer.insertAdjacentHTML('beforeend', tableHTML);
    
    // Make the results section visible
    const resultsSection = document.getElementById('results-section');
    if (resultsSection) {
        resultsSection.style.display = 'block';
        resultsSection.scrollIntoView({ behavior: 'smooth' });
    }
}

function logAllSinkParameters() {
    console.log('Logging all sink rate parameters...');

    try {
        // Get weight from localStorage (same as in climb-rate.js)
        const wingAreaInputs = JSON.parse(localStorage.getItem('wingAreaInputs') || '{}');
        const weight = parseFloat(wingAreaInputs.weight);
        
        if (!weight || isNaN(weight)) {
            console.error('No valid weight found in localStorage');
            showError('Please enter the aircraft weight in the wing parameters section first.');
            return;
        }

        const weightN = weight * GRAVITY; // Convert kg to N
        console.log('Aircraft Weight:', weight, 'kg (', weightN, 'N)');

        // Get dynamic thrust data
        const dynamicThrustData = JSON.parse(localStorage.getItem('dynamicThrustData') || '{}');
        if (!dynamicThrustData || !dynamicThrustData.thrustCurve) {
            console.error('No valid dynamic thrust data found in localStorage');
            showError('Please complete the Dynamic Thrust calculation first.');
            return;
        }

        console.log('Raw thrust curve data:', dynamicThrustData.thrustCurve);
        const { thrustCurve } = dynamicThrustData;

        if (!Array.isArray(thrustCurve) || thrustCurve.length === 0) {
            console.error('Invalid thrust curve data');
            showError('Invalid thrust data. Please check your Dynamic Thrust calculation.');
            return;
        }

        // Extract velocity and drag (thrust required) from thrust curve
        const velocityRange = [];
        const dragValues = [];
        
        // First, log all available properties in the first point for debugging
        if (thrustCurve.length > 0) {
            console.log('First thrust curve point properties:', Object.keys(thrustCurve[0]));
        }
        
        thrustCurve.forEach((point, index) => {
            const velocity = parseFloat(point.velocity);
            // Try different possible property names for drag
            const drag = parseFloat(
                point.drag || 
                point.dragForce || 
                point.thrustRequired || 
                (point.thrustAvailable - (point.netThrust || 0)) || 
                0
            );
            
            if (!isNaN(velocity) && !isNaN(drag)) {
                velocityRange.push(velocity);
                dragValues.push(drag);
                console.log(`Point ${index}: v=${velocity}m/s, drag=${drag}N`);
            } else {
                console.warn(`Skipping invalid data point at index ${index}:`, point);
            }
        });

        if (velocityRange.length === 0 || dragValues.length === 0) {
            console.error('No valid data points in thrust curve');
            showError('No valid data points found in thrust curve.');
            return;
        }

        console.log('Velocity range:', velocityRange);
        console.log('Drag values (N):', dragValues);

        // Calculate sink rate at each velocity point
        const sinkRatesMs = [];
        const validData = [];

        for (let i = 0; i < velocityRange.length; i++) {
            const velocity = velocityRange[i];
            const drag = dragValues[i];
            
            if (velocity <= 0) continue; // Skip zero or negative velocities
            
            // Sink rate = (Drag * Velocity) / (Weight * g)
            const sinkRate = (drag * velocity) / (weight * GRAVITY);
            
            sinkRatesMs.push(sinkRate);
            validData.push({
                velocity: velocity,
                sinkRateMs: sinkRate,
                sinkRateFpm: sinkRate * 196.85, // Convert m/s to ft/min
                drag: drag
            });
        }

        if (validData.length === 0) {
            throw new Error('No valid sink rate data points calculated');
        }

        // Log the calculated sink rates for debugging
        console.log('Calculated sink rates (m/s):', sinkRatesMs);

        // Update the chart with the new data
        updateSinkRateChart(velocityRange, sinkRatesMs);

        // Save results to localStorage
        const results = {
            velocityRange: velocityRange,
            sinkRatesMs: sinkRatesMs,
            sinkRatesFpm: sinkRatesMs.map(rate => rate * 196.85),
            dragValues: dragValues,
            weight: weight,
            timestamp: new Date().toISOString()
        };
        
        localStorage.setItem('sinkRateResults', JSON.stringify(results));
        
        console.log('Sink rate calculation complete');
        return results;

    } catch (error) {
        console.error('Error in logAllSinkParameters:', error);
        showError('Failed to calculate sink rate: ' + (error.message || 'Unknown error'));
        return null;
    }
}

function calculateSinkRate() {
    console.log('Calculate sink rate button clicked');
    logAllSinkParameters();
}

function resetSinkRateCalculator() {
    console.log('Resetting sink rate calculator');

    // Reset the chart
    if (sinkRateChart) {
        sinkRateChart.data.labels = [];
        sinkRateChart.data.datasets[0].data = [];
        sinkRateChart.data.datasets[1].data = [];
        sinkRateChart.update();
    }

    // Clear results
    if (resultsContainer) {
        resultsContainer.innerHTML = '';
    }

    // Hide results section
    if (resultsSection) {
        resultsSection.style.display = 'none';
    }
}

function showError(message) {
    // Create or get error message element
    let errorElement = document.getElementById('error-message');
    if (!errorElement) {
        errorElement = document.createElement('div');
        errorElement.id = 'error-message';
        errorElement.style.cssText = `
            position: fixed;
            top: 20px;
            right: 20px;
            padding: 15px;
            background-color: #ffebee;
            color: #c62828;
            border-radius: 4px;
            box-shadow: 0 2px 4px rgba(0,0,0,0.1);
            z-index: 1000;
            display: none;
            max-width: 300px;
        `;
        document.body.appendChild(errorElement);
    }

    // Show error message
    errorElement.textContent = message;
    errorElement.style.display = 'block';

    // Hide after 5 seconds
    setTimeout(() => {
        if (errorElement) {
            errorElement.style.display = 'none';
        }
    }, 5000);
}

// Initialize chart on page load if DOM is already loaded
if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', initSinkRateChart);
} else {
    initSinkRateChart();
}