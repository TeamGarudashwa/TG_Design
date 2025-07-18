// Dynamic Thrust Calculator Module
const DynamicThrustCalculator = (() => {
    // DOM Elements
    let calculateBtn, resetBtn, resultsSection, resultsBody, kFactorElement;
    let startVelInput, endVelInput, stepVelInput, cd0Input, propDiaInput, propPitchInput, rpmInput;

    // Constants
    const AIR_DENSITY = 1.225; // kg/m³ at sea level, 15°C
    const INCHES_TO_METERS = 0.0254;
    const GRAVITY = 9.81; // m/s²
    const OSEWALDS_EFFICIENCY_FACTOR = 0.8;

    // Chart instance - use a module-scoped variable instead of window
    let thrustChart = null;

    // Toggle chart visibility
    function setupChartToggle() {
        const toggleBtn = document.getElementById('toggle-chart');
        const chartContainer = document.querySelector('.chart-container');

        if (toggleBtn && chartContainer) {
            toggleBtn.addEventListener('click', () => {
                chartContainer.style.display = chartContainer.style.display === 'none' ? 'block' : 'none';
                toggleBtn.innerHTML = chartContainer.style.display === 'none' 
                    ? '<i class="fas fa-chart-line"></i> Show Chart' 
                    : '<i class="fas fa-chart-bar"></i> Hide Chart';

                // Trigger chart resize when showing
                if (chartContainer.style.display !== 'none' && thrustChart) {
                    setTimeout(() => {
                        thrustChart.resize();
                    }, 10);
                }
            });
        }
    }

    // Initialize or update the chart
    function updateChart(results) {
        console.log('Updating chart with results:', results);

        const canvas = document.getElementById('thrustChart');
        if (!canvas) {
            console.error('Chart canvas element not found');
            return;
        }

        // Show loading overlay
        const loadingOverlay = document.getElementById('chart-loading');
        if (loadingOverlay) loadingOverlay.style.display = 'flex';

        // Destroy previous chart if it exists
        if (thrustChart) {
            try {
                thrustChart.destroy();
            } catch (e) {
                console.warn('Error destroying previous chart:', e);
            }
            thrustChart = null;
        }

        // Prepare data
        const labels = results.map(r => r.velocity.toFixed(1));
        const availableThrust = results.map(r => r.thrustAvailable);
        const requiredThrust = results.map(r => r.thrustRequired);

        // Calculate max thrust values for summary cards
        const maxThrustAvailable = Math.max(...availableThrust);
        const maxThrustRequired = Math.max(...requiredThrust);
        const thrustMargin = ((maxThrustAvailable - maxThrustRequired) / maxThrustRequired * 100).toFixed(1);

        // Update summary cards
        document.getElementById('max-thrust').textContent = `${maxThrustAvailable.toFixed(2)} N`;
        document.getElementById('max-required').textContent = `${maxThrustRequired.toFixed(2)} N`;
        document.getElementById('thrust-margin').textContent = `${thrustMargin}%`;

        // Chart configuration
        const config = {
            type: 'line',
            data: {
                labels: labels,
                datasets: [
                    {
                        label: 'Thrust Available (N)',
                        data: availableThrust,
                        borderColor: '#3b82f6',
                        backgroundColor: 'rgba(59, 130, 246, 0.1)',
                        borderWidth: 2,
                        tension: 0.4,
                        pointRadius: 3,
                        pointHoverRadius: 5,
                        fill: true,
                        animation: {
                            duration: 1000,
                            easing: 'easeOutQuart'
                        }
                    },
                    {
                        label: 'Thrust Required (N)',
                        data: requiredThrust,
                        borderColor: '#ef4444',
                        backgroundColor: 'rgba(239, 68, 68, 0.1)',
                        borderWidth: 2,
                        tension: 0.4,
                        pointRadius: 3,
                        pointHoverRadius: 5,
                        fill: true,
                        animation: {
                            duration: 1000,
                            easing: 'easeOutQuart'
                        }
                    }
                ]
            },
            options: {
                responsive: true,
                maintainAspectRatio: false,
                animation: {
                    duration: 1000,
                    easing: 'easeInOutQuart'
                },
                plugins: {
                    legend: {
                        position: 'top',
                        labels: {
                            color: getComputedStyle(document.documentElement).getPropertyValue('--text-color'),
                            font: {
                                family: 'Poppins, sans-serif',
                                size: 12
                            },
                            padding: 20,
                            usePointStyle: true,
                            boxWidth: 8
                        }
                    },
                    tooltip: {
                        mode: 'index',
                        intersect: false,
                        backgroundColor: 'rgba(0, 0, 0, 0.8)',
                        titleFont: {
                            family: 'Poppins, sans-serif',
                            size: 12,
                            weight: 'bold'
                        },
                        bodyFont: {
                            family: 'Poppins, sans-serif',
                            size: 12
                        },
                        padding: 10,
                        callbacks: {
                            label: function(context) {
                                let label = context.dataset.label || '';
                                if (label) label += ': ';
                                if (context.parsed.y !== null) {
                                    label += context.parsed.y.toFixed(2) + ' N';
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
                            color: getComputedStyle(document.documentElement).getPropertyValue('--text-color'),
                            font: {
                                family: 'Poppins, sans-serif',
                                weight: '500',
                                size: 12
                            },
                            padding: {top: 10}
                        },
                        grid: {
                            color: getComputedStyle(document.documentElement).getPropertyValue('--border-color'),
                            drawBorder: false
                        },
                        ticks: {
                            color: getComputedStyle(document.documentElement).getPropertyValue('--text-color'),
                            font: {
                                family: 'Poppins, sans-serif',
                                size: 11
                            }
                        }
                    },
                    y: {
                        title: {
                            display: true,
                            text: 'Thrust (N)',
                            color: getComputedStyle(document.documentElement).getPropertyValue('--text-color'),
                            font: {
                                family: 'Poppins, sans-serif',
                                weight: '500',
                                size: 12
                            },
                            padding: {bottom: 10}
                        },
                        grid: {
                            color: getComputedStyle(document.documentElement).getPropertyValue('--border-color'),
                            drawBorder: false
                        },
                        ticks: {
                            color: getComputedStyle(document.documentElement).getPropertyValue('--text-color'),
                            font: {
                                family: 'Poppins, sans-serif',
                                size: 11
                            }
                        },
                        beginAtZero: true
                    }
                },
                interaction: {
                    mode: 'nearest',
                    axis: 'x',
                    intersect: false
                },
                onHover: (event, chartElement) => {
                    const target = event.native.target;
                    target.style.cursor = chartElement[0] ? 'pointer' : 'default';
                },
                onClick: (event, elements) => {
                    if (elements.length > 0) {
                        const element = elements[0];
                        const datasetIndex = element.datasetIndex;
                        const dataIndex = element.index;
                        console.log('Clicked on point:', {
                            dataset: config.data.datasets[datasetIndex].label,
                            x: config.data.labels[dataIndex],
                            y: config.data.datasets[datasetIndex].data[dataIndex]
                        });
                    }
                }
            }
        };

        // Create new chart
        const ctx = canvas.getContext('2d');
        thrustChart = new Chart(ctx, config);

        // Hide loading overlay when chart is ready
        if (loadingOverlay) {
            setTimeout(() => {
                loadingOverlay.style.opacity = '0';
                setTimeout(() => {
                    loadingOverlay.style.display = 'none';
                    loadingOverlay.style.opacity = '1';
                }, 300);
            }, 500);
        }

        // Add animation to table rows
        animateTableRows();
    }

    // Animate table rows with staggered delay
    function animateTableRows() {
        const rows = document.querySelectorAll('#results-body tr');
        rows.forEach((row, index) => {
            row.style.opacity = '0';
            row.style.transform = 'translateY(10px)';
            row.style.transition = `opacity 0.3s ease ${index * 0.05}s, transform 0.3s ease ${index * 0.05}s`;

            // Trigger reflow
            void row.offsetHeight;

            // Animate in
            row.style.opacity = '1';
            row.style.transform = 'translateY(0)';
        });
    }

    // Initialize the calculator
    function init() {
        console.log('Dynamic Thrust Calculator initializing...');

        // Initialize DOM elements
        initializeElements();

        // Load saved inputs
        loadInputs();

        // Check if wing parameters are available
        checkWingParameters();

        // Set up event listeners
        setupEventListeners();

        // Set up chart toggle
        setupChartToggle();

        // Add click handler for export button
        const exportBtn = document.getElementById('export-csv');
        if (exportBtn) {
            exportBtn.addEventListener('click', exportToCSV);
        }

        console.log('Dynamic Thrust Calculator initialized');
    }

    // Initialize DOM elements
    function initializeElements() {
        calculateBtn = document.getElementById('calculate-thrust');
        resetBtn = document.getElementById('reset-thrust');
        resultsSection = document.getElementById('results-section');
        resultsBody = document.getElementById('results-body');
        kFactorElement = document.getElementById('k-factor');

        // Input elements
        startVelInput = document.getElementById('start-velocity');
        endVelInput = document.getElementById('end-velocity');
        stepVelInput = document.getElementById('step-velocity');
        cd0Input = document.getElementById('cd0');
        propDiaInput = document.getElementById('prop-diameter');
        propPitchInput = document.getElementById('prop-pitch');
        rpmInput = document.getElementById('rpm');
    }

    // Set up event listeners
    function setupEventListeners() {
        if (calculateBtn) {
            calculateBtn.addEventListener('click', calculateThrust);
        }

        if (resetBtn) {
            resetBtn.addEventListener('click', resetCalculator);
        }

        // Save inputs when they change
        document.querySelectorAll('input[type="number"]').forEach(input => {
            input.addEventListener('input', saveInputs);
        });
    }

    // Reset calculator to default values
    function resetCalculator() {
        console.log('Resetting calculator...');

        // Reset input values
        if (startVelInput) startVelInput.value = '0';
        if (endVelInput) endVelInput.value = '50';
        if (stepVelInput) stepVelInput.value = '5';
        if (cd0Input) cd0Input.value = '0.02';
        if (propDiaInput) propDiaInput.value = '10';
        if (propPitchInput) propPitchInput.value = '7';
        if (rpmInput) rpmInput.value = '8000';

        // Clear results
        if (resultsSection) resultsSection.style.display = 'none';
        if (resultsBody) resultsBody.innerHTML = '';
        if (kFactorElement) kFactorElement.textContent = '-';

        // Clear saved inputs
        localStorage.removeItem('dynamicThrustInputs');

        console.log('Calculator reset');
    }

    // Save inputs to localStorage
    function saveInputs() {
        const inputsData = {
            startVel: startVelInput?.value || '0',
            endVel: endVelInput?.value || '50',
            stepVel: stepVelInput?.value || '5',
            cd0: cd0Input?.value || '0.02',
            propDia: propDiaInput?.value || '10',
            propPitch: propPitchInput?.value || '7',
            rpm: rpmInput?.value || '8000'
        };

        localStorage.setItem('dynamicThrustInputs', JSON.stringify(inputsData));
    }

    // Load saved inputs if available
    function loadInputs() {
        const savedInputs = localStorage.getItem('dynamicThrustInputs');
        if (!savedInputs) return;

        try {
            const inputs = JSON.parse(savedInputs);

            if (startVelInput) startVelInput.value = inputs.startVel || '0';
            if (endVelInput) endVelInput.value = inputs.endVel || '50';
            if (stepVelInput) stepVelInput.value = inputs.stepVel || '5';
            if (cd0Input) cd0Input.value = inputs.cd0 || '0.02';
            if (propDiaInput) propDiaInput.value = inputs.propDia || '10';
            if (propPitchInput) propPitchInput.value = inputs.propPitch || '7';
            if (rpmInput) rpmInput.value = inputs.rpm || '8000';

            console.log('Loaded saved inputs:', inputs);
        } catch (e) {
            console.error('Error loading saved inputs:', e);
            localStorage.removeItem('dynamicThrustInputs');
        }
    }

    // Check if wing parameters are available
    function checkWingParameters() {
        const wingArea = getWingArea();
        const wingSpan = getWingSpan();

        // Create warning message element if it doesn't exist
        let warning = document.getElementById('warning-message');
        if (!warning && document.querySelector('.calculator-container')) {
            warning = document.createElement('div');
            warning.id = 'warning-message';
            warning.style.color = 'var(--danger-color)';
            warning.style.margin = '1rem 0';
            document.querySelector('.calculator-container').insertBefore(warning, document.querySelector('.input-section'));
        }

        if (warning) {
            if (!wingArea || !wingSpan) {
                warning.textContent = 'Warning: Wing parameters not found. Please set up wing parameters first.';
                if (calculateBtn) calculateBtn.disabled = true;
            } else {
                warning.textContent = '';
                if (calculateBtn) calculateBtn.disabled = false;
            }
        }
    }

    // Calculate thrust values
    function calculateThrust() {
        try {
            // Get and validate inputs
            const startVel = parseFloat(startVelInput.value);
            const endVel = parseFloat(endVelInput.value);
            const stepVel = parseFloat(stepVelInput.value);
            const cd0 = parseFloat(cd0Input.value);
            const propDiaIn = parseFloat(propDiaInput.value);
            const propPitchIn = parseFloat(propPitchInput.value);
            const rpm = parseFloat(rpmInput.value);

            // Input validation
            if (isNaN(startVel) || isNaN(endVel) || isNaN(stepVel) || isNaN(cd0) ||
                isNaN(propDiaIn) || isNaN(propPitchIn) || isNaN(rpm)) {
                throw new Error('Please enter valid numbers for all fields');
            }

            if (startVel < 0 || endVel <= startVel || stepVel <= 0) {
                throw new Error('Invalid velocity range or step size');
            }

            if (cd0 <= 0 || propDiaIn <= 0 || propPitchIn <= 0 || rpm <= 0) {
                throw new Error('All values must be greater than zero');
            }

            // Get aircraft weight from wing area calculator or wing parameters
            let aircraftWeight = getAircraftWeight();
            if (aircraftWeight === null || isNaN(aircraftWeight) || aircraftWeight <= 0) {
                const useDefault = confirm('Aircraft weight not found. Use default weight of 10 kg for calculations?');
                if (!useDefault) return;

                // Use default weight if user confirms
                aircraftWeight = 10; // kg

                // Save default weight to localStorage for future use
                const currentParams = JSON.parse(localStorage.getItem('wingParametersInputs') || '{}');
                currentParams.weight = aircraftWeight;
                localStorage.setItem('wingParametersInputs', JSON.stringify(currentParams));
            }

            // Calculate wing area from wing parameters if available
            const wingArea = getWingArea();
            if (!wingArea || wingArea <= 0) {
                const proceed = confirm('Wing area not found. Please calculate wing parameters first.\n\nWould you like to be redirected to the Wing Parameters calculator?');
                if (proceed) {
                    window.location.href = 'wing-parameter.html';
                }
                return;
            }

            // Calculate wing span from wing parameters if available
            const wingSpan = getWingSpan();
            if (!wingSpan || wingSpan <= 0) {
                const proceed = confirm('Wing span not found. Please calculate wing parameters first.\n\nWould you like to be redirected to the Wing Parameters calculator?');
                if (proceed) {
                    window.location.href = 'wing-parameter.html';
                }
                return;
            }

            // Convert units
            const propDia = propDiaIn * INCHES_TO_METERS; // Convert to meters
            const propPitch = propPitchIn * INCHES_TO_METERS; // Convert to meters

            // Calculate aspect ratio and induced drag factor (K)
            const aspectRatio = wingSpan * wingSpan / wingArea;
            const k = 1 / ((22 / 7) * 0.8 * aspectRatio); // Oswald efficiency factor of 0.8

            // Calculate thrust available at different velocities
            const results = [];

            // Generate velocity points using the exact start, end, and step values
            // Add a small epsilon to handle floating point precision issues
            const epsilon = 1e-10;
            const numPoints = Math.floor((endVel - startVel) / stepVel + epsilon) + 1;

            console.log(`Generating ${numPoints} velocity points from ${startVel} to ${endVel} m/s with step ${stepVel}`);

            for (let i = 0; i < numPoints; i++) {
                // Calculate velocity with floating point precision
                const v = startVel + (i * stepVel);

                // Ensure we don't exceed endVel due to floating point precision
                const velocity = Math.min(v, endVel);

                console.log(`Point ${i + 1}/${numPoints}: Velocity = ${velocity} m/s`);

                // Thrust required using full drag model formula
                const rho = AIR_DENSITY;
                const velocitySquared = velocity * velocity;
                const term1 = (rho * velocitySquared * wingArea * cd0) / 2;
                const term2 = (2 * k * aircraftWeight * aircraftWeight * GRAVITY * GRAVITY) / (rho * velocitySquared * wingArea);
                const thrustRequired = Math.max(term1 + term2, 0);

                // Calculate thrust available using the Gabriel Staples formula
                const a = (4.4 * Math.pow(10, -8) * rpm) * (Math.pow(propDiaIn, 3.5) / Math.sqrt(propPitchIn));
                const b = (rpm * propPitchIn * 4.23 * Math.pow(10, -4)) - velocity;
                const thrustAvailable = Math.max(a * b, 0);

                // Convert thrust available to kg
                const thrustAvailableKg = thrustAvailable / GRAVITY;

                results.push({
                    velocity: velocity,
                    thrustRequired: thrustRequired,
                    thrustAvailable: thrustAvailable,
                    thrustAvailableKg: thrustAvailableKg
                });
            }

            console.log('Generated velocity points:', results.map(r => r.velocity));

            // Save results to localStorage
            const savedThrustData = saveThrustResults(results);

            // Display results
            displayResults(k, results, savedThrustData);

        } catch (error) {
            console.error('Error in thrust calculation:', error);
            alert('An error occurred during calculation: ' + error.message);
        }
    }

    // Save thrust results to localStorage
    function saveThrustResults(results) {
        try {
            if (results && results.length > 0) {
                // Ensure we're using the correct property names (thrustAvailable or thrust)
                const thrustValues = results.map(r => r.thrustAvailable || r.thrust);
                const maxThrust = Math.max(...thrustValues);
                const minThrust = Math.min(...thrustValues);

                // Create the thrust curve data with consistent property names
                const thrustCurve = results.map(r => ({
                    velocity: r.velocity,
                    thrust: r.thrustAvailable || r.thrust,
                    drag: r.thrustRequired || 0, // Use thrustRequired as drag
                    netThrust: (r.thrustAvailable || r.thrust) - (r.thrustRequired || 0)
                }));

                // Create the data object to save
                const thrustData = {
                    maxThrust: maxThrust,
                    minThrust: minThrust,
                    thrustRange: {
                        min: minThrust,
                        max: maxThrust,
                        average: thrustValues.reduce((a, b) => a + b, 0) / thrustValues.length
                    },
                    thrustCurve: thrustCurve,
                    rpm: parseFloat(rpmInput.value) || 0,
                    propDiameter: parseFloat(propDiaInput.value) || 0,
                    propPitch: parseFloat(propPitchInput.value) || 0,
                    timestamp: new Date().toISOString()
                };

                // Save to localStorage
                localStorage.setItem('dynamicThrustData', JSON.stringify(thrustData));

                // Log the range information
                console.log('=== Thrust Range ===');
                console.log(`Maximum Thrust: ${maxThrust.toFixed(2)} N`);
                console.log(`Minimum Thrust: ${minThrust.toFixed(2)} N`);
                console.log(`Average Thrust: ${thrustData.thrustRange.average.toFixed(2)} N`);
                console.log('First few points of Thrust Curve:', thrustCurve.slice(0, 3));

                return thrustData;
            }
        } catch (e) {
            console.error('Error saving thrust results:', e);
            throw e; // Re-throw to handle in the calling function
        }
        return null;
    }

    // Display results in the table
    function displayResults(k, results, savedThrustData) {
        try {
            console.log('Displaying results...');

            // Show the results section
            const resultsSection = document.getElementById('results-section');
            if (resultsSection) {
                resultsSection.style.display = 'block';
                resultsSection.style.opacity = '1';
                resultsSection.style.visibility = 'visible';
            } else {
                console.error('Results section element not found');
            }

            // Update K factor display
            if (kFactorElement) {
                kFactorElement.textContent = k.toFixed(6);
            } else {
                console.warn('K factor element not found');
            }

            // Update the chart
            updateChart(results);

            // Populate the results table
            if (resultsBody) {
                resultsBody.innerHTML = ''; // Clear previous results

                results.forEach(item => {
                    const row = document.createElement('tr');
                    row.innerHTML = `
                        <td>${item.velocity.toFixed(2)}</td>
                        <td>${item.thrustAvailable.toFixed(2)}</td>
                        <td>${(item.thrustAvailable / 9.81).toFixed(2)}</td>
                        <td>${item.thrustRequired.toFixed(2)}</td>
                    `;
                    resultsBody.appendChild(row);
                });

                // Make sure the table is visible
                const resultsTable = document.getElementById('results-table');
                if (resultsTable) {
                    resultsTable.style.display = 'table';
                    resultsTable.style.width = '100%';
                    resultsTable.style.marginTop = '20px';
                } else {
                    console.warn('Results table element not found');
                }
            } else {
                console.error('Results body element not found');
            }

            // Scroll to results
            if (resultsSection) {
                resultsSection.scrollIntoView({ behavior: 'smooth' });
            }

        } catch (error) {
            console.error('Error displaying results:', error);
            alert('An error occurred while displaying results: ' + error.message);
        }
    }

    // Helper function to get aircraft weight from wing area calculator or wing parameters
    function getAircraftWeight() {
        try {
            // Try to get from wing parameters first
            const wingParams = localStorage.getItem('wingParametersInputs');
            if (wingParams) {
                const data = JSON.parse(wingParams);
                if (data && (data.weight || data.weight === 0)) {
                    return parseFloat(data.weight);
                }
            }

            // Then try to get from wing area calculator
            const wingAreaData = localStorage.getItem('wingAreaCalculatorData');
            if (wingAreaData) {
                const data = JSON.parse(wingAreaData);
                if (data && (data.weight || data.weight === 0)) {
                    return parseFloat(data.weight);
                }
            }

            // If still not found, return null
            return null;
        } catch (e) {
            console.error('Error getting aircraft weight:', e);
            return null;
        }
    }

    // Helper function to get wing area from localStorage
    function getWingArea() {
        try {
            const wingParams = localStorage.getItem('wingParametersInputs');
            if (wingParams) {
                const data = JSON.parse(wingParams);
                if (data && data.surfaceArea) {
                    return parseFloat(data.surfaceArea);
                }
            }
            return null;
        } catch (e) {
            console.error('Error getting wing area:', e);
            return null;
        }
    }

    // Helper function to get wing span from localStorage
    function getWingSpan() {
        try {
            const wingParams = localStorage.getItem('wingParametersInputs');
            if (wingParams) {
                const data = JSON.parse(wingParams);
                if (data && data.wingspan) {
                    return parseFloat(data.wingspan);
                }
            }
            return null;
        } catch (e) {
            console.error('Error getting wing span:', e);
            return null;
        }
    }

    // Make helper functions available globally
    window.getWingArea = getWingArea;
    window.getWingSpan = getWingSpan;
    window.getAircraftWeight = getAircraftWeight;

    // Public API
    return {
        init: init,
        calculateThrust: calculateThrust,
        resetCalculator: resetCalculator,
        saveInputs: saveInputs,
        loadInputs: loadInputs,
        checkWingParameters: checkWingParameters,
        getResults: function() { return []; } // Add this function
    };
})();

// Initialize the calculator when the page loads
document.addEventListener('DOMContentLoaded', () => {
    DynamicThrustCalculator.init();
});

// Export results to CSV
function exportToCSV() {
    const results = DynamicThrustCalculator.getResults();
    if (!results || results.length === 0) {
        alert('No data to export');
        return;
    }

    // Create CSV content
    let csvContent = 'data:text/csv;charset=utf-8,';

    // Add headers
    csvContent += 'Velocity (m/s),Thrust Available (N),Thrust Available (kgf),Thrust Required (N)\n';

    // Add data rows
    results.forEach(row => {
        csvContent += `${row.velocity.toFixed(2)},${row.thrustAvailable.toFixed(2)},${(row.thrustAvailable / 9.81).toFixed(2)},${row.thrustRequired.toFixed(2)}\n`;
    });

    // Create download link
    const encodedUri = encodeURI(csvContent);
    const link = document.createElement('a');
    link.setAttribute('href', encodedUri);
    link.setAttribute('download', `thrust_analysis_${new Date().toISOString().slice(0, 10)}.csv`);
    document.body.appendChild(link);

    // Trigger download
    link.click();
    document.body.removeChild(link);
}
