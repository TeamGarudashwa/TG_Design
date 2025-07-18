// Export all functions that need to be accessible from HTML
export function initWingParameters() {
    console.log('Wing Parameters module initialized');

    // Load saved inputs if any
    loadInputs();

    // Set up event listeners
    setupInputListeners();
    setupFullscreenToggle();
    setupCopyResults();

    // Set up reset button
    const resetBtn = document.getElementById('reset-wing');
    if (resetBtn) {
        resetBtn.addEventListener('click', resetForm);
    }

    // Set up calculate button
    const calculateBtn = document.getElementById('calculate-wing');
    if (calculateBtn) {
        calculateBtn.addEventListener('click', function(e) {
            e.preventDefault();
            saveInputs();
            calculateAndUpdate(true);
        });
    }

    // Initialize dark mode if the toggle exists
    const darkModeToggle = document.getElementById('dark-mode-toggle');
    if (darkModeToggle) {
        initDarkMode();
    }
    
    // Show results section if we have valid inputs
    if (hasRequiredInputs()) {
        calculateAndUpdate(true);
    }
}

// Initialize when the DOM is fully loaded
if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', initWingParameters);
} else {
    initWingParameters();
}

// Get aircraft weight from localStorage or input
function getAircraftWeight() {
    try {
        // First try to get from wing parameters
        const wingParams = localStorage.getItem('wingParametersInputs');
        if (wingParams) {
            const data = JSON.parse(wingParams);
            if (data && data.weight) {
                return parseFloat(data.weight);
            }
        }

        // Fallback to wing area inputs
        const wingAreaInputs = localStorage.getItem('wingAreaInputs');
        if (wingAreaInputs) {
            const data = JSON.parse(wingAreaInputs);
            if (data && data.weight) {
                return parseFloat(data.weight);
            }
        }

        // Finally, try to get from the weight input field
        const weightInput = document.getElementById('weight-input');
        if (weightInput && weightInput.value) {
            return parseFloat(weightInput.value);
        }

        return null;
    } catch (e) {
        console.error('Error getting aircraft weight:', e);
        return null;
    }
}

// Save inputs to localStorage
function saveInputs() {
    try {
        const inputs = {
            rootChord: document.getElementById('root-chord-input')?.value || '',
            tipChord: document.getElementById('tip-chord-input')?.value || '',
            surfaceArea: document.getElementById('surface-area-input')?.value || '',
            wingspan: document.getElementById('wingspan-input')?.value || '',
            velocity: document.getElementById('velocity-input')?.value || '',
            cl: document.getElementById('cl-input')?.value || '',
            clMax: document.getElementById('clmax-input')?.value || '',
            weight: getAircraftWeight() || ''
        };

        // Always save to localStorage, even if some fields are empty
        localStorage.setItem('wingParametersInputs', JSON.stringify(inputs));
        console.log('Saved wing parameters:', inputs);

        return true;
    } catch (e) {
        console.error('Error saving inputs:', e);
        return false;
    }
}

// Load inputs from localStorage
function loadInputs() {
    try {
        const savedInputs = localStorage.getItem('wingParametersInputs');
        if (!savedInputs) {
            console.log('No saved wing parameters found');
            return false;
        }

        const inputs = JSON.parse(savedInputs);
        console.log('Loading saved wing parameters:', inputs);

        // Set input values for all fields
        const fieldMappings = [
            { key: 'rootChord', id: 'root-chord-input' },
            { key: 'tipChord', id: 'tip-chord-input' },
            { key: 'surfaceArea', id: 'surface-area-input' },
            { key: 'wingspan', id: 'wingspan-input' },
            { key: 'velocity', id: 'velocity-input' },
            { key: 'cl', id: 'cl-input' },
            { key: 'clMax', id: 'clmax-input' },
            { key: 'weight', id: 'weight-input' }
        ];

        let hasValues = false;
        fieldMappings.forEach(({ key, id }) => {
            const element = document.getElementById(id);
            if (element && inputs[key] !== undefined && inputs[key] !== '') {
                element.value = inputs[key];
                hasValues = true;
                console.log(`Restored ${key} value:`, inputs[key]);
            }
        });

        // If we have values, update the calculations
        if (hasValues) {
            // Use setTimeout to ensure DOM is fully updated before calculating
            setTimeout(() => {
                calculateAndUpdate(true);
                console.log('Recalculated with loaded values');
            }, 100);
        }

        return hasValues;
    } catch (e) {
        console.error('Error loading saved inputs:', e);
        return false;
    }
}

// Set up input event listeners
function setupInputListeners() {
    // Get all input elements that should trigger calculations
    const inputSelectors = [
        '#root-chord-input',
        '#tip-chord-input',
        '#surface-area-input',
        '#wingspan-input',
        '#velocity-input',
        '#cl-input',
        '#clmax-input'
    ];

    // Add input event listeners to all relevant inputs
    inputSelectors.forEach(selector => {
        const input = document.querySelector(selector);
        if (input) {
            // Remove any existing listeners to prevent duplicates
            const newInput = input.cloneNode(true);
            input.parentNode.replaceChild(newInput, input);

            // Add new input listener
            newInput.addEventListener('input', function () {
                saveInputs();
                if (hasRequiredInputs()) {
                    calculateAndUpdate();
                }
            });
        }
    });
}

// Handle calculate button click
function handleCalculateClick(e) {
    if (e) e.preventDefault();
    saveInputs();
    calculateAndUpdate(true);
}

// Check if we have the minimum required inputs for calculation
function hasRequiredInputs() {
    const rootChord = parseFloat(document.getElementById('root-chord-input')?.value);
    const tipChord = parseFloat(document.getElementById('tip-chord-input')?.value);
    const wingspan = parseFloat(document.getElementById('wingspan-input')?.value);
    const surfaceArea = parseFloat(document.getElementById('surface-area-input')?.value);

    // Debug logging
    console.log('Input values:', { rootChord, tipChord, wingspan, surfaceArea });

    // We need either surface area or both root/tip chord and wingspan
    const hasSurfaceArea = !isNaN(surfaceArea) && surfaceArea > 0;
    const hasWingDimensions = !isNaN(rootChord) && !isNaN(tipChord) && !isNaN(wingspan);
    
    const isValid = hasSurfaceArea || hasWingDimensions;
    console.log('Input validation:', { hasSurfaceArea, hasWingDimensions, isValid });
    
    return isValid;
}

// Calculate and update the UI
function calculateAndUpdate(force = false) {
    console.log('calculateAndUpdate called with force:', force);
    
    // Get the results section element at the start
    const resultsSection = document.getElementById('wing-results');
    const flightDynamics = document.getElementById('flight-dynamics-results');
    
    try {
        if (!force && !hasRequiredInputs()) {
            console.log('Skipping calculation: force is', force, 'and hasRequiredInputs is false');
            return;
        }
        
        console.log('Proceeding with calculation...');
        
        // Make sure results sections are visible
        if (resultsSection) resultsSection.style.display = 'block';
        if (flightDynamics) flightDynamics.style.display = 'block';
        
        // Get input values
        const rootChord = parseFloat(document.getElementById('root-chord-input')?.value) || 0;
        const tipChord = parseFloat(document.getElementById('tip-chord-input')?.value) || 0;
        const wingspan = parseFloat(document.getElementById('wingspan-input')?.value) || 0;
        const surfaceAreaInput = parseFloat(document.getElementById('surface-area-input')?.value) || 0;
        const velocity = parseFloat(document.getElementById('velocity-input')?.value) || 0;
        const cl = parseFloat(document.getElementById('cl-input')?.value) || 0;
        const clMax = parseFloat(document.getElementById('clmax-input')?.value) || 0;

        let wingArea = 0;
        let wingAreaM2 = 0;

        // Calculate wing area if we have root chord, tip chord, and wingspan
        if (rootChord > 0 && tipChord > 0 && wingspan > 0) {
            wingArea = 0.5 * (rootChord + tipChord) * wingspan;
            wingAreaM2 = wingArea * 0.00064516; // Convert in² to m²
            const wingAreaElement = document.getElementById('surface-area-input');

            if (wingAreaElement && !wingAreaElement.matches(':focus')) {
                wingAreaElement.value = wingArea.toFixed(4);
            }
        } else if (surfaceAreaInput > 0) {
            // Use the provided surface area directly
            wingArea = surfaceAreaInput;
            wingAreaM2 = surfaceAreaInput * 0.00064516; // Convert m² to in² if needed
        } else {
            console.error('Insufficient input for calculations');
            return;
        }

        // Calculate aspect ratio if we have wingspan and area
        if (wingspan > 0 && wingArea > 0) {
            const aspectRatio = calculateAspectRatio(wingspan, wingArea);
            updateResult('aspect-ratio-result', aspectRatio.toFixed(2));

            // Calculate taper ratio if we have root and tip chord
            if (rootChord > 0 && tipChord > 0) {
                const taperRatio = tipChord / rootChord;
                updateResult('taper-ratio-result', taperRatio.toFixed(3));
            }

            // Calculate wing loading if we have weight
            const weight = getAircraftWeight();
            if (weight > 0 && wingAreaM2 > 0) {
                const wingLoading = weight / wingAreaM2;
                updateResult('wing-loading-result', wingLoading.toFixed(2));

                // Calculate flight dynamics if we have velocity and CL
                if (velocity > 0 && cl > 0) {
                    const AIR_DENSITY = 1.225; // kg/m³ at sea level
                    const lift = calculateLift(AIR_DENSITY, velocity, wingAreaM2, cl);
                    updateResult('lift-result', lift.toFixed(2));

                    const loadFactor = calculateLoadFactor(lift, weight);
                    updateResult('load-factor-result', loadFactor.toFixed(2));

                    // Calculate stall speed if we have CLmax
                    if (clMax > 0) {
                        const vStall = calculateStallSpeed(weight, AIR_DENSITY, wingAreaM2, clMax);
                        updateResult('vstall-result', vStall.toFixed(2) + ' m/s');
                        
                        // Save aerodynamic data to localStorage for landing distance calculator
                        const aeroData = {
                            vStall: vStall,
                            lift: lift,
                            timestamp: new Date().toISOString()
                        };
                        localStorage.setItem('aerodynamicData', JSON.stringify(aeroData));
                        console.log('Saved aerodynamic data:', aeroData);
                    }

                    // Show flight dynamics results
                    const flightDynamics = document.getElementById('flight-dynamics-results');
                    if (flightDynamics) {
                        flightDynamics.style.display = 'block';
                    }
                }
            }
        }

        // After all calculations
        console.log('All calculations complete');
        if (resultsSection) {
            // Ensure it's still visible after calculations
            resultsSection.style.display = 'block';
            resultsSection.scrollIntoView({ behavior: 'smooth', block: 'start' });
            console.log('Results section should now be visible');
        }
    } catch (e) {
        console.error('Error in calculation:', e);
        alert('An error occurred during calculation. Please check the console for details.');
    }
}

// Helper function to update result elements
function updateResult(elementId, value) {
    console.log(`Updating ${elementId} with value:`, value);
    const element = document.getElementById(elementId);
    if (element) {
        element.textContent = value;
        console.log(`Updated ${elementId} to:`, element.textContent);
        
        // Add visual feedback
        element.style.transition = 'all 0.3s ease';
        element.style.color = '#4361ee';
        setTimeout(() => {
            element.style.color = ''; // Revert to default color
        }, 300);
    } else {
        console.error(`Element with ID ${elementId} not found!`);
        // Try to create the element if it doesn't exist (for debugging)
        console.log('Available result elements:', {
            'aspect-ratio-result': document.getElementById('aspect-ratio-result'),
            'taper-ratio-result': document.getElementById('taper-ratio-result'),
            'wing-loading-result': document.getElementById('wing-loading-result'),
            'lift-result': document.getElementById('lift-result'),
            'load-factor-result': document.getElementById('load-factor-result'),
            'vstall-result': document.getElementById('vstall-result')
        });
    }
}

// Reset form to default values
function resetForm() {
    if (confirm('Are you sure you want to reset all wing parameters?')) {
        // Clear all input fields
        const inputs = document.querySelectorAll('input[type="number"]');
        inputs.forEach(input => {
            input.value = '';
            input.classList.remove('error');
        });

        // Clear all result displays
        const resultElements = document.querySelectorAll('.result-value');
        resultElements.forEach(el => {
            el.textContent = '-';
        });

        // Hide results section
        const resultsSection = document.getElementById('wing-results');
        if (resultsSection) {
            resultsSection.style.display = 'none';
        }

        // Clear saved inputs from localStorage
        localStorage.removeItem('wingParametersInputs');

        console.log('Wing parameters form has been reset');
    }
}

// Helper functions for calculations
function calculateAspectRatio(span, area) {
    if (!span || !area || area <= 0) return 0;
    return (span * span) / area;
}

// Initialize dark mode
function initDarkMode() {
    const darkModeToggle = document.getElementById('dark-mode-toggle');
    if (!darkModeToggle) return;

    const isDarkMode = localStorage.getItem('darkMode') === 'true';
    updateDarkMode(isDarkMode);

    darkModeToggle.addEventListener('click', () => {
        const isDark = document.body.classList.toggle('dark-mode');
        updateDarkMode(isDark);
    });
}

function updateDarkMode(isDark) {
    document.documentElement.classList.toggle('dark-mode', isDark);
    document.body.classList.toggle('dark-mode', isDark);
    localStorage.setItem('darkMode', isDark);

    const icon = document.querySelector('#dark-mode-toggle i');
    if (icon) {
        icon.className = isDark ? 'fas fa-sun' : 'fas fa-moon';
    }
}

// Add fullscreen toggle functionality
function setupFullscreenToggle() {
    const fullscreenToggle = document.getElementById('wing-fullscreen-toggle');
    const resultsSection = document.getElementById('wing-results');
    
    if (!fullscreenToggle || !resultsSection) return;

    fullscreenToggle.addEventListener('click', () => {
        if (!document.fullscreenElement) {
            // Enter fullscreen
            if (resultsSection.requestFullscreen) {
                resultsSection.requestFullscreen();
            } else if (resultsSection.webkitRequestFullscreen) { /* Safari */
                resultsSection.webkitRequestFullscreen();
            } else if (resultsSection.msRequestFullscreen) { /* IE11 */
                resultsSection.msRequestFullscreen();
            }
        } else {
            // Exit fullscreen
            if (document.exitFullscreen) {
                document.exitFullscreen();
            } else if (document.webkitExitFullscreen) { /* Safari */
                document.webkitExitFullscreen();
            } else if (document.msExitFullscreen) { /* IE11 */
                document.msExitFullscreen();
            }
        }
    });

    // Update button icon when fullscreen changes
    const updateButtonIcon = () => {
        const isFullscreen = document.fullscreenElement || 
                           document.webkitFullscreenElement ||
                           document.mozFullScreenElement ||
                           document.msFullscreenElement;
        
        const icon = fullscreenToggle.querySelector('svg');
        if (isFullscreen) {
            icon.innerHTML = `
                <path d="M8 3v3a2 2 0 0 1-2 2H3m18 0h-3a2 2 0 0 1-2-2V3m0 18v-3a2 2 0 0 1 2-2h3M3 16h3a2 2 0 0 1 2 2v3"></path>
            `;
            fullscreenToggle.title = 'Exit fullscreen';
        } else {
            icon.innerHTML = `
                <path d="M8 3H5a2 2 0 0 0-2 2v3m18 0V5a2 2 0 0 0-2-2h-3m0 18h3a2 2 0 0 0 2-2v-3M3 16v3a2 2 0 0 0 2 2h3"></path>
            `;
            fullscreenToggle.title = 'Enter fullscreen';
        }
    };

    // Listen for fullscreen change events
    document.addEventListener('fullscreenchange', updateButtonIcon);
    document.addEventListener('webkitfullscreenchange', updateButtonIcon);
    document.addEventListener('mozfullscreenchange', updateButtonIcon);
    document.addEventListener('MSFullscreenChange', updateButtonIcon);
}

// Add copy results functionality
function setupCopyResults() {
    const copyButton = document.getElementById('copy-results');
    if (!copyButton) return;

    copyButton.addEventListener('click', () => {
        const results = [];
        
        // Get all result items
        document.querySelectorAll('.result-card').forEach(card => {
            const title = card.querySelector('h4').textContent;
            const items = [];
            
            card.querySelectorAll('.result-item').forEach(item => {
                const label = item.querySelector('.result-label').textContent.trim();
                const value = item.querySelector('.result-value').textContent.trim();
                const unit = item.querySelector('.result-unit').textContent.trim();
                items.push(`${label}: ${value} ${unit}`.trim());
            });
            
            results.push(`=== ${title} ===\n${items.join('\n')}`);
        });
        
        // Copy to clipboard
        const textToCopy = results.join('\n\n');
        navigator.clipboard.writeText(textToCopy).then(() => {
            // Show success feedback
            const originalText = copyButton.innerHTML;
            copyButton.innerHTML = '<i class="fas fa-check"></i> Copied!';
            copyButton.disabled = true;
            
            // Reset button after 2 seconds
            setTimeout(() => {
                copyButton.innerHTML = originalText;
                copyButton.disabled = false;
            }, 2000);
        }).catch(err => {
            console.error('Failed to copy results:', err);
            alert('Failed to copy results to clipboard. Please try again.');
        });
    });
}

// Add these new calculation functions
function calculateStallSpeed(weightKg, airDensity, surfaceArea, clMax) {
    // Vs = √((2 * W) / (ρ * S * CLmax))
    const weightN = weightKg * 9.81; // Convert kg to N
    return Math.sqrt((2 * weightN) / (airDensity * surfaceArea * clMax));
}

function calculateLift(airDensity, velocity, surfaceArea, cl) {
    // L = 0.5 * ρ * V² * S * CL
    return 0.5 * airDensity * Math.pow(velocity, 2) * surfaceArea * cl;
}

function calculateLoadFactor(liftForce, weightKg) {
    // n = L / W
    return liftForce / (weightKg * 9.81);
}