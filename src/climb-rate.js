// Chart instance
let climbRateChart = null;

// Constants
const GRAVITY = 9.81; // m/s²
const MS_TO_FPM = 196.85; // Conversion factor from m/s to ft/min

// Wait for DOM to be fully loaded
document.addEventListener('DOMContentLoaded', function () {
    console.log('Climb Rate Calculator initialized');
    
    // Initialize chart
    initChart();
    
    // Add event listeners
    document.getElementById('calculate')?.addEventListener('click', calculateClimbRate);
    document.getElementById('reset')?.addEventListener('click', resetCalculator);
    
    // Check for existing data on page load
    checkForExistingData();
});

function checkForExistingData() {
    try {
        // Check for wing parameters (using the correct key from wing-params.js)
        const wingParams = localStorage.getItem('wingParametersInputs');
        // Check for dynamic thrust data (using the correct key from dynamic-thrust.js)
        const thrustData = localStorage.getItem('dynamicThrustData');
        
        console.log('Checking for existing data...', { 
            hasWingParams: !!wingParams, 
            hasThrustData: !!thrustData 
        });
        
        if (wingParams && thrustData) {
            console.log('Found existing data, attempting to calculate...');
            calculateClimbRate();
        } else {
            console.log('No existing data found. Please set up wing parameters and dynamic thrust first.');
            showUserMessage('Please set up wing parameters and calculate dynamic thrust first.', 'info');
        }
    } catch (error) {
        console.error('Error checking for existing data:', error);
        showUserMessage('Error checking for saved data. Please refresh the page and try again.', 'error');
    }
}

// Helper function to show user-friendly messages
function showUserMessage(message, type = 'info') {
    const messageDiv = document.getElementById('user-message');
    if (!messageDiv) return;
    
    messageDiv.textContent = message;
    messageDiv.className = `user-message ${type}`;
    messageDiv.style.display = 'block';
    
    // Auto-hide after 5 seconds
    setTimeout(() => {
        messageDiv.style.display = 'none';
    }, 5000);
}

function initChart() {
    console.log('Initializing chart...');
    const canvas = document.getElementById('climbRateChart');

    if (!canvas) {
        console.error('Error: Could not find chart canvas');
        return;
    }

    // Set explicit dimensions
    canvas.width = canvas.offsetWidth;
    canvas.height = canvas.offsetHeight || 400; // Fallback height

    const ctx = canvas.getContext('2d');

    // Destroy existing chart if it exists
    if (climbRateChart) {
        console.log('Destroying existing chart');
        climbRateChart.destroy();
    }

    try {
        console.log('Creating new chart instance');
        climbRateChart = new Chart(ctx, {
            type: 'line',
            data: {
                labels: [],
                datasets: [{
                    label: 'Climb Rate (m/s)',
                    data: [],
                    borderColor: 'rgba(75, 192, 192, 1)',
                    backgroundColor: 'rgba(75, 192, 192, 0.1)',
                    tension: 0.4,
                    fill: true,
                    yAxisID: 'y',
                    pointRadius: 3,
                    pointHoverRadius: 5,
                    borderWidth: 2
                }, {
                    label: 'Climb Rate (ft/min)',
                    data: [],
                    borderColor: 'rgba(255, 99, 132, 1)',
                    backgroundColor: 'rgba(255, 99, 132, 0.1)',
                    tension: 0.4,
                    fill: true,
                    yAxisID: 'y1',
                    pointRadius: 3,
                    pointHoverRadius: 5,
                    borderWidth: 2,
                    hidden: true // Hide by default
                }]
            },
            options: {
                responsive: true,
                maintainAspectRatio: false,
                animation: {
                    duration: 1000,
                    easing: 'easeInOutQuart'
                },
                interaction: {
                    mode: 'index',
                    intersect: false,
                },
                plugins: {
                    legend: {
                        position: 'top',
                        labels: {
                            color: getComputedStyle(document.documentElement).getPropertyValue('--text-color') || '#666',
                            padding: 20,
                            usePointStyle: true,
                            boxWidth: 8
                        },
                        onClick: function(e, legendItem, legend) {
                            const index = legendItem.datasetIndex;
                            const ci = legend.chart;
                            const meta = ci.getDatasetMeta(index);
                            
                            // Toggle visibility
                            meta.hidden = meta.hidden === null ? !ci.data.datasets[index].hidden : null;
                            
                            // Update the chart
                            ci.update();
                        }
                    },
                    tooltip: {
                        mode: 'index',
                        intersect: false,
                        backgroundColor: 'rgba(0, 0, 0, 0.8)',
                        titleColor: '#fff',
                        bodyColor: '#fff',
                        borderColor: 'rgba(255, 255, 255, 0.1)',
                        borderWidth: 1,
                        padding: 12,
                        cornerRadius: 6,
                        callbacks: {
                            label: function(context) {
                                let label = context.dataset.label || '';
                                if (label) {
                                    label += ': ';
                                }
                                if (context.parsed.y !== null) {
                                    label += context.parsed.y.toFixed(2);
                                }
                                return label;
                            }
                        }
                    }
                },
                scales: {
                    x: {
                        title: {
                            display: true,
                            text: 'Velocity (m/s)',
                            color: getComputedStyle(document.documentElement).getPropertyValue('--text-color') || '#666',
                            font: {
                                weight: '500',
                                size: 12
                            }
                        },
                        grid: {
                            color: getComputedStyle(document.documentElement).getPropertyValue('--border-color') || 'rgba(0, 0, 0, 0.1)',
                            drawBorder: false
                        },
                        ticks: {
                            color: getComputedStyle(document.documentElement).getPropertyValue('--text-color') || '#666',
                            font: {
                                size: 11
                            }
                        }
                    },
                    y: {
                        type: 'linear',
                        display: true,
                        position: 'left',
                        title: {
                            display: true,
                            text: 'Climb Rate (m/s)',
                            color: 'rgba(75, 192, 192, 1)',
                            font: {
                                weight: '500',
                                size: 12
                            }
                        },
                        grid: {
                            color: getComputedStyle(document.documentElement).getPropertyValue('--border-color') || 'rgba(0, 0, 0, 0.1)',
                            drawBorder: false
                        },
                        ticks: {
                            color: getComputedStyle(document.documentElement).getPropertyValue('--text-color') || '#666',
                            font: {
                                size: 11
                            }
                        }
                    },
                    y1: {
                        type: 'linear',
                        display: true,
                        position: 'right',
                        title: {
                            display: true,
                            text: 'Climb Rate (ft/min)',
                            color: 'rgba(255, 99, 132, 1)',
                            font: {
                                weight: '500',
                                size: 12
                            }
                        },
                        grid: {
                            drawOnChartArea: false
                        },
                        ticks: {
                            color: getComputedStyle(document.documentElement).getPropertyValue('--text-color') || '#666',
                            font: {
                                size: 11
                            }
                        }
                    }
                }
            }
        });
        console.log('Chart initialized successfully');
    } catch (error) {
        console.error('Error initializing chart:', error);
        showUserMessage('Error initializing chart. Please refresh the page and try again.', 'error');
    }
}

function calculateClimbRate() {
    console.log('Calculating climb rate...');
    
    try {
        // 1. Get wing parameters (using the correct key from wing-params.js)
        const wingParams = JSON.parse(localStorage.getItem('wingParametersInputs') || '{}');
        console.log('Wing parameters:', wingParams);
        
        if (!wingParams || !wingParams.weight) {
            throw new Error('Please set up wing parameters first in the Wing Parameters calculator.');
        }
        
        const weight = parseFloat(wingParams.weight);
        const wingArea = parseFloat(wingParams.surfaceArea);
        
        if (isNaN(weight) || isNaN(wingArea)) {
            throw new Error('Invalid wing parameters. Please check your wing area and weight in the Wing Parameters calculator.');
        }
        
        // 2. Get dynamic thrust data (using the correct key from dynamic-thrust.js)
        const thrustData = JSON.parse(localStorage.getItem('dynamicThrustData') || '{}');
        console.log('Dynamic thrust data:', thrustData);
        
        if (!thrustData || !thrustData.thrustCurve || !Array.isArray(thrustData.thrustCurve)) {
            throw new Error('Please calculate dynamic thrust first in the Dynamic Thrust calculator.');
        }
        
        const results = thrustData.thrustCurve;
        if (results.length === 0) {
            throw new Error('No thrust data available. Please check your dynamic thrust calculations.');
        }
        
        // 3. Calculate climb rate for each velocity point
        const velocityRange = [];
        const climbRatesMs = [];
        const powerAvailable = [];
        const powerRequired = [];
        
        results.forEach(item => {
            const velocity = parseFloat(item.velocity);
            // Use thrust instead of thrustAvailable to match the data structure
            const thrustAvail = parseFloat(item.thrust || item.thrustAvailable);
            // Use drag to calculate thrust required if available, otherwise use 0
            const thrustReq = parseFloat(item.drag || 0);
            
            // Skip if any value is NaN
            if (isNaN(velocity) || isNaN(thrustAvail) || isNaN(thrustReq)) {
                console.warn('Skipping invalid data point:', item);
                return;
            }
            
            // Calculate excess power and climb rate
            const excessPower = (thrustAvail - thrustReq) * velocity;
            const climbRateMs = excessPower / (weight * GRAVITY);
            
            velocityRange.push(velocity);
            climbRatesMs.push(climbRateMs);
            powerAvailable.push(thrustAvail * velocity);
            powerRequired.push(thrustReq * velocity);
        });
        
        // Check if we have valid data points
        if (velocityRange.length === 0) {
            throw new Error('No valid data points found for climb rate calculation.');
        }
        
        // 4. Find maximum climb rate
        const maxClimbRateMs = Math.max(...climbRatesMs);
        const maxIndex = climbRatesMs.indexOf(maxClimbRateMs);
        const velocityAtMax = velocityRange[maxIndex];
        
        // 5. Prepare results with proper null checks
        const resultData = {
            velocityRange: velocityRange,
            climbRatesMs: climbRatesMs,
            climbRatesFpm: climbRatesMs.map(rate => rate * MS_TO_FPM),
            powerAvailable: powerAvailable,
            powerRequired: powerRequired,
            maxClimbRate: {
                velocity: velocityAtMax || 0,
                climbRateMs: maxClimbRateMs || 0,
                climbRateFpm: (maxClimbRateMs || 0) * MS_TO_FPM,
                powerAvailable: (powerAvailable[maxIndex] || 0),
                powerRequired: (powerRequired[maxIndex] || 0)
            },
            timestamp: new Date().toISOString()
        };
        
        console.log('Climb rate results:', resultData);
        
        // 6. Save results
        localStorage.setItem('climbRateResults', JSON.stringify(resultData));
        
        // 7. Update the chart and display results
        updateChart(velocityRange, climbRatesMs, resultData, weight);
        
        // Show success message
        showUserMessage('Climb rate calculation completed successfully!', 'success');
        
    } catch (error) {
        console.error('Error in calculateClimbRate:', error);
        showUserMessage(error.message || 'An error occurred while calculating climb rate. Please check the console for details.', 'error');
    }
}

function updateChart(velocityRange, climbRatesMs, resultData, weight) {
    if (!climbRateChart) {
        initChart();
    }
    
    try {
        // Update chart data
        climbRateChart.data.labels = velocityRange;
        climbRateChart.data.datasets[0].data = climbRatesMs;
        climbRateChart.data.datasets[1].data = climbRatesMs.map(rate => rate * MS_TO_FPM);
        
        // Update chart options
        climbRateChart.update();
        
        // Update results display with weight
        updateResultsDisplay(resultData, weight);
        
    } catch (error) {
        console.error('Error updating chart:', error);
        showUserMessage('Error updating chart. Please try again.', 'error');
    }
}

function updateResultsDisplay(data, weight) {
    const resultsContainer = document.getElementById('results-container');
    if (!resultsContainer || !data || !data.maxClimbRate) return;
    
    const maxClimb = data.maxClimbRate;
    
    // Format numbers with null/undefined check and add units
    const formatNumber = (num, decimals = 2, unit = '') => {
        if (num === undefined || num === null || isNaN(num)) return 'N/A';
        return `${parseFloat(num.toFixed(decimals)).toLocaleString()}${unit ? ' ' + unit : ''}`;
    };

    // Create table rows for each velocity point
    const tableRows = data.velocityRange.map((velocity, index) => {
        const climbRateMs = data.climbRatesMs[index];
        const climbRateFpm = climbRateMs * MS_TO_FPM;
        const powerAvail = data.powerAvailable[index];
        const powerReq = data.powerRequired[index];
        const excessPower = powerAvail - powerReq;
        
        // Highlight row if it contains max climb rate
        const isMaxClimb = Math.abs(velocity - maxClimb.velocity) < 0.1; // Compare with small tolerance for floating point
        
        return `
            <tr class="${isMaxClimb ? 'highlight-row' : ''}">
                <td>${formatNumber(velocity, 1)}</td>
                <td>${formatNumber(climbRateMs, 3)}</td>
                <td>${formatNumber(climbRateFpm, 1)}</td>
                <td>${formatNumber(powerAvail, 1)}</td>
                <td>${formatNumber(powerReq, 1)}</td>
                <td>${formatNumber(excessPower, 1)}</td>
            </tr>
        `;
    }).join('');

    const html = `
        <!-- Keep the existing visualization -->
        <div class="results-grid">
            <div class="result-card performance-card">
                <div class="card-header">
                    <i class="fas fa-chart-line"></i>
                    <h3>Maximum Climb Performance</h3>
                </div>
                <div class="performance-metrics">
                    <div class="metric-item highlight">
                        <div class="metric-value" id="climb-rate-value">${formatNumber(maxClimb.climbRateMs, 3)}</div>
                        <div class="metric-label">Maximum Climb Rate</div>
                        <div class="metric-unit">m/s (${formatNumber(maxClimb.climbRateFpm, 0)} ft/min)</div>
                    </div>
                    <div class="metric-item">
                        <div class="metric-value">${formatNumber(maxClimb.velocity, 1)}</div>
                        <div class="metric-label">At Velocity</div>
                        <div class="metric-unit">m/s</div>
                    </div>
                </div>
            </div>
        </div>

        <!-- Add the new data table -->
        <div class="result-card">
            <div class="card-header">
                <i class="fas fa-table"></i>
                <h3>Climb Rate Data Table</h3>
            </div>
            <div class="table-responsive">
                <table class="data-table">
                    <thead>
                        <tr>
                            <th>Velocity (m/s)</th>
                            <th>Climb Rate (m/s)</th>
                            <th>Climb Rate (ft/min)</th>
                            <th>Power Available (W)</th>
                            <th>Power Required (W)</th>
                            <th>Excess Power (W)</th>
                        </tr>
                    </thead>
                    <tbody>
                        ${tableRows}
                    </tbody>
                </table>
            </div>
            <div class="table-note">
                <i class="fas fa-info-circle"></i> Highlighted row indicates maximum climb rate condition.
            </div>
        </div>
    `;
    
    resultsContainer.innerHTML = html;
    
    // Show results section with animation
    const resultsSection = document.getElementById('results-section');
    if (resultsSection) {
        resultsSection.style.opacity = '0';
        resultsSection.style.display = 'block';
        resultsSection.style.transition = 'opacity 0.5s ease-in-out';
        setTimeout(() => {
            resultsSection.style.opacity = '1';
            resultsSection.scrollIntoView({ behavior: 'smooth', block: 'nearest' });
        }, 50);
    }
}

// Add these styles to your CSS
const additionalStyles = `
/* Results Grid Layout */
.results-grid {
    display: grid;
    grid-template-columns: repeat(auto-fit, minmax(300px, 1fr));
    gap: 1.5rem;
    margin-bottom: 2rem;
}

/* Card Styles */
.result-card {
    background: var(--card-bg);
    border-radius: 12px;
    padding: 1.5rem;
    box-shadow: 0 4px 20px rgba(0, 0, 0, 0.08);
    transition: transform 0.3s ease, box-shadow 0.3s ease;
    border: 1px solid var(--border-color);
}

.result-card:hover {
    transform: translateY(-5px);
    box-shadow: 0 8px 30px rgba(0, 0, 0, 0.12);
}

.card-header {
    display: flex;
    align-items: center;
    margin-bottom: 1.5rem;
    padding-bottom: 0.75rem;
    border-bottom: 1px solid var(--border-color);
}

.card-header i {
    font-size: 1.5rem;
    margin-right: 0.75rem;
    color: var(--primary-color);
}

.card-header h3 {
    margin: 0;
    font-size: 1.25rem;
    color: var(--text-color);
}

/* Performance Metrics */
.performance-metrics {
    display: flex;
    flex-direction: column;
    gap: 1.5rem;
}

.metric-item {
    text-align: center;
    padding: 1rem;
    border-radius: 8px;
    background: var(--card-bg-secondary);
    transition: all 0.3s ease;
}

.metric-item.highlight {
    background: linear-gradient(135deg, var(--primary-color), #4a90e2);
    color: white;
    box-shadow: 0 4px 15px rgba(74, 144, 226, 0.3);
}

.metric-value {
    font-size: 2.5rem;
    font-weight: 700;
    line-height: 1.2;
    margin-bottom: 0.25rem;
}

.metric-label {
    font-size: 0.9rem;
    opacity: 0.9;
    margin-bottom: 0.25rem;
}

.metric-unit {
    font-size: 0.85rem;
    opacity: 0.8;
}

/* Power Analysis */
.power-metrics {
    display: flex;
    flex-direction: column;
    gap: 1rem;
}

.power-metric {
    margin-bottom: 1rem;
}

.power-label {
    display: flex;
    justify-content: space-between;
    margin-bottom: 0.5rem;
    font-weight: 500;
}

.power-bar {
    height: 8px;
    background: var(--border-color);
    border-radius: 4px;
    overflow: hidden;
}

.power-bar-fill {
    height: 100%;
    width: 0;
    transition: width 1s ease-in-out;
}

.power-metric.available .power-bar-fill {
    background: linear-gradient(90deg, #4CAF50, #8BC34A);
}

.power-metric.required .power-bar-fill {
    background: linear-gradient(90deg, #2196F3, #64B5F6);
}

.excess-power {
    margin-top: 1rem;
    padding-top: 1rem;
    border-top: 1px solid var(--border-color);
    display: flex;
    justify-content: space-between;
    font-weight: 500;
}

/* Gauges */
.gauges-container {
    display: flex;
    flex-direction: column;
    gap: 1.5rem;
}

.gauge-container {
    margin-bottom: 1rem;
}

.gauge-label {
    font-size: 0.9rem;
    margin-bottom: 0.5rem;
    color: var(--text-secondary);
}

.gauge {
    height: 30px;
    background: var(--border-color);
    border-radius: 15px;
    position: relative;
    overflow: hidden;
}

.gauge-fill {
    position: absolute;
    top: 0;
    left: 0;
    height: 100%;
    background: linear-gradient(90deg, var(--primary-color), #4a90e2);
    border-radius: 15px;
    transition: width 1s ease-in-out;
}

.gauge-value {
    position: absolute;
    top: 50%;
    left: 50%;
    transform: translate(-50%, -50%);
    font-weight: 600;
    font-size: 0.9rem;
    color: white;
    text-shadow: 0 1px 2px rgba(0, 0, 0, 0.3);
}

/* Notes and Formula */
.notes-card {
    background: var(--card-bg);
    border-radius: 12px;
    padding: 1.5rem;
    margin-top: 1.5rem;
    border: 1px solid var(--border-color);
}

.formula-container {
    margin-bottom: 1rem;
}

.formula {
    background: var(--card-bg-secondary);
    padding: 1rem;
    border-radius: 8px;
    font-family: 'Courier New', monospace;
    margin: 0.5rem 0;
    border-left: 4px solid var(--primary-color);
}

.formula-values {
    margin-top: 0.75rem;
    font-size: 0.9rem;
    opacity: 0.9;
    display: grid;
    grid-template-columns: repeat(auto-fill, minmax(200px, 1fr));
    gap: 0.5rem;
}

.last-updated {
    font-size: 0.85rem;
    opacity: 0.7;
    text-align: right;
    margin-top: 1rem;
    display: flex;
    align-items: center;
    justify-content: flex-end;
    gap: 0.5rem;
}

/* Responsive Adjustments */
@media (max-width: 768px) {
    .results-grid {
        grid-template-columns: 1fr;
    }
    
    .metric-value {
        font-size: 2rem;
    }
    
    .formula-values {
        grid-template-columns: 1fr;
    }
}
`;

// Add styles to the document
const styleElement = document.createElement('style');
styleElement.textContent = additionalStyles;
document.head.appendChild(styleElement);

const tableStyles = `
/* Table Styles */
.table-responsive {
    width: 100%;
    overflow-x: auto;
    margin: 1rem 0;
    border-radius: 8px;
    border: 1px solid var(--border-color);
}

.data-table {
    width: 100%;
    border-collapse: collapse;
    font-size: 0.9rem;
}

.data-table th,
.data-table td {
    padding: 0.75rem 1rem;
    text-align: right;
    border-bottom: 1px solid var(--border-color);
}

.data-table th:first-child,
.data-table td:first-child {
    text-align: left;
}

.data-table th {
    background-color: var(--card-bg-secondary);
    font-weight: 600;
    text-transform: uppercase;
    font-size: 0.8rem;
    letter-spacing: 0.5px;
}

.data-table tbody tr:hover {
    background-color: rgba(var(--primary-rgb), 0.05);
}

.highlight-row {
    background-color: rgba(var(--primary-rgb), 0.1) !important;
    font-weight: 500;
}

.highlight-row td {
    border-top: 2px solid var(--primary-color);
    border-bottom: 2px solid var(--primary-color);
}

.highlight-row:first-child td {
    border-top: none;
}

.table-note {
    margin-top: 1rem;
    font-size: 0.85rem;
    color: var(--text-secondary);
    display: flex;
    align-items: center;
    gap: 0.5rem;
}

.table-note i {
    color: var(--primary-color);
}

/* Responsive table */
@media (max-width: 768px) {
    .data-table {
        display: block;
    }
    
    .data-table thead {
        display: none;
    }
    
    .data-table tr {
        display: block;
        margin-bottom: 1rem;
        border: 1px solid var(--border-color);
        border-radius: 8px;
        overflow: hidden;
    }
    
    .data-table td {
        display: flex;
        justify-content: space-between;
        text-align: right !important;
        padding-left: 50%;
        position: relative;
    }
    
    .data-table td::before {
        content: attr(data-label);
        position: absolute;
        left: 1rem;
        font-weight: 600;
        text-transform: uppercase;
        font-size: 0.8rem;
        color: var(--text-secondary);
    }
}
`;

// Add table styles to the document
const tableStyleElement = document.createElement('style');
tableStyleElement.textContent = tableStyles;
document.head.appendChild(tableStyleElement);

function resetCalculator() {
    console.log('Resetting calculator');
    
    // Reset the chart
    if (climbRateChart) {
        climbRateChart.data.labels = [];
        climbRateChart.data.datasets[0].data = [];
        climbRateChart.data.datasets[1].data = [];
        climbRateChart.update();
    }
    
    // Clear results
    const resultsContainer = document.getElementById('results-container');
    if (resultsContainer) {
        resultsContainer.innerHTML = '';
    }
    
    // Remove saved data
    localStorage.removeItem('climbRateResults');
    
    // Show reset message
    showUserMessage('Calculator has been reset.', 'info');
}