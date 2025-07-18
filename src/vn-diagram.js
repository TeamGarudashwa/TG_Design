/**
 * V-N Diagram Module
 * Handles the visualization of V-N diagrams using Chart.js
 * Data is retrieved from localStorage where other calculators store their results
 */

// Storage class to handle localStorage operations
class VNStorage {
    // Get all data from localStorage
    static getAllData() {
        return {
            // Aerodynamic data from various calculators
            aerodynamicData: this.getJSON('aerodynamicData'),
            
            // Wing parameters
            wingParameters: this.getJSON('wingParametersInputs'),
            
            // Wing area calculator inputs
            wingAreaInputs: this.getJSON('wingAreaInputs'),
            
            // Dynamic thrust calculator inputs
            dynamicThrustInputs: this.getJSON('dynamicThrustInputs'),
            
            // Individual values that might be stored at root level
            weight: this.getNumber('weight'),
            clMax: this.getNumber('clMax'),
            vStall: this.getNumber('vStall'),
            surfaceArea: this.getNumber('surfaceArea'),
            
            // UI settings
            theme: localStorage.getItem('theme') || 'light',
            darkMode: this.getBoolean('darkMode')
        };
    }
    
    // Helper method to safely parse JSON from localStorage
    static getJSON(key) {
        try {
            const value = localStorage.getItem(key);
            return value ? JSON.parse(value) : null;
        } catch (e) {
            console.warn(`Error parsing ${key} from localStorage:`, e);
            return null;
        }
    }
    
    // Helper method to safely get a number from localStorage
    static getNumber(key) {
        const value = localStorage.getItem(key);
        const num = parseFloat(value);
        return isNaN(num) ? null : num;
    }
    
    // Helper method to safely get a boolean from localStorage
    static getBoolean(key) {
        const value = localStorage.getItem(key);
        return value === 'true';
    }
    
    // Clear all data (for debugging)
    static clearAll() {
        localStorage.clear();
        console.log('LocalStorage cleared');
    }
}

// Main VN Diagram Class
class VNDiagram {
    constructor() {
        this.chart = null;
        this.initialize();
    }
    
    // Initialize the V-N diagram
    initialize() {
        // Set up event listeners
        document.addEventListener('DOMContentLoaded', () => {
            this.setupEventListeners();
            this.logStoredData();
        });
    }
    
    // Set up event listeners
    setupEventListeners() {
        // Generate chart button
        const generateBtn = document.getElementById('generateVNDiagram');
        if (generateBtn) {
            generateBtn.addEventListener('click', () => this.generateDiagram());
        }
        
        // Clear data button (for debugging)
        const clearBtn = document.getElementById('clearDataBtn');
        if (clearBtn) {
            clearBtn.addEventListener('click', VNStorage.clearAll);
        }
    }
    
    // Log all stored data for debugging
    logStoredData() {
        const data = VNStorage.getAllData();
        console.log('=== Stored Data ===');
        console.table(Object.entries(data).map(([key, value]) => ({
            Key: key,
            Type: typeof value,
            Value: typeof value === 'object' ? JSON.stringify(value) : value
        })));
    }
    
    // Generate the V-N diagram
    generateDiagram() {
        try {
            const data = VNStorage.getAllData();
            
            // Extract required parameters with null checks
            const params = this.extractParameters(data);
            if (!params.valid) {
                this.showError(params.missing.join(', '));
                return;
            }
            
            // Generate velocity range
            const velocityRange = this.generateVelocityRange(data.dynamicThrustInputs);
            
            // Calculate load factors
            const results = this.calculateLoadFactors(velocityRange, params);
            
            // Create or update chart
            this.renderChart(velocityRange, results);
            
        } catch (error) {
            console.error('Error generating V-N diagram:', error);
            this.showError('An error occurred. Check console for details.');
        }
    }
    
    // Extract and validate parameters
    extractParameters(data) {
        const result = {
            weight: data.weight || data.wingAreaInputs?.weight,
            surfaceArea: data.surfaceArea || data.wingParameters?.surfaceArea || data.wingAreaInputs?.surfaceArea,
            clMax: data.clMax || data.aerodynamicData?.clMax || data.wingParameters?.clMax,
            vStall: data.vStall || data.aerodynamicData?.vStall,
            valid: true,
            missing: []
        };
        
        // Check for missing required parameters
        if (!result.weight) result.missing.push('weight');
        if (!result.surfaceArea) result.missing.push('wing area');
        if (!result.clMax) result.missing.push('CLmax');
        
        result.valid = result.missing.length === 0;
        return result;
    }
    
    // Generate velocity range from dynamic thrust inputs or use defaults
    generateVelocityRange(dynamicThrustInputs) {
        console.log('\n=== Velocity Range Generation ===');
        console.log('Input Parameters:');
        console.table({
            'Raw Dynamic Thrust Inputs': JSON.stringify(dynamicThrustInputs, null, 2),
            'Start Velocity (m/s)': dynamicThrustInputs?.startVelocity || 'Using default (0)',
            'End Velocity (m/s)': dynamicThrustInputs?.endVelocity || 'Using default (30)',
            'Step Size (m/s)': dynamicThrustInputs?.stepSize || 'Using default (1)'
        });

        const start = parseFloat(dynamicThrustInputs?.startVelocity) || 0;
        const end = parseFloat(dynamicThrustInputs?.endVelocity) || 30;
        const step = parseFloat(dynamicThrustInputs?.stepSize) || 1;
        
        console.log('\nCalculated Values:');
        console.table({
            'Parsed Start (m/s)': start,
            'Parsed End (m/s)': end,
            'Parsed Step (m/s)': step,
            'Number of Points': Math.ceil((end - start) / step) + 1
        });
        
        const range = [];
        for (let v = start; v <= end; v += step) {
            const rounded = parseFloat(v.toFixed(2));
            range.push(rounded);
        }
        
        // Ensure end value is included
        if (range.length === 0 || range[range.length - 1] < end) {
            const roundedEnd = parseFloat(end.toFixed(2));
            if (range.length === 0 || roundedEnd > range[range.length - 1]) {
                range.push(roundedEnd);
            }
        }
        
        console.log('\nGenerated Velocity Range:');
        if (range.length > 10) {
            console.log(`[${range[0].toFixed(2)}, ${range[1].toFixed(2)}, ..., ${range[range.length-2].toFixed(2)}, ${range[range.length-1].toFixed(2)}] (${range.length} points)`);
            console.log('First 5 points:', range.slice(0, 5).map(v => v.toFixed(2)).join(', '));
            console.log('Last 5 points:', range.slice(-5).map(v => v.toFixed(2)).join(', '));
        } else {
            console.log(range.map(v => v.toFixed(2)).join(', '));
        }
        
        return range;
    }
    
    // Calculate load factors for velocity range
    calculateLoadFactors(velocityRange, params) {
        const rho = 1.225; // Air density at sea level (kg/m³)
        const g = 9.81;    // Acceleration due to gravity (m/s²)
        
        // Log all parameters
        console.log('\n=== V-N Diagram Calculation Parameters ===');
        console.table([
            { Parameter: 'Air Density (ρ)', Value: `${rho} kg/m³`, Unit: 'kg/m³' },
            { Parameter: 'Velocity Range', Value: `${velocityRange[0]} to ${velocityRange[velocityRange.length-1]} m/s`, Unit: 'm/s' },
            { Parameter: 'Wing Surface Area', Value: `${params.surfaceArea}`, Unit: 'm²' },
            { Parameter: 'CLmax', Value: `${params.clMax}`, Unit: '-' },
            { Parameter: 'Aircraft Weight', Value: `${params.weight}`, Unit: 'kg' },
            { Parameter: 'Weight in Newtons', Value: `${(params.weight * g).toFixed(2)}`, Unit: 'N' },
            { Parameter: 'Vstall', Value: params.vStall ? `${params.vStall} m/s` : 'Not provided', Unit: 'm/s' }
        ]);
        
        console.log('\n=== Load Factor Calculations ===');
        
        // Array to store all calculations for tabular output
        const calculations = [];
        
        const results = velocityRange.map(velocity => {
            // Skip if below Vstall
            if (params.vStall && velocity < params.vStall) {
                console.log(`Skipping velocity ${velocity} m/s (below Vstall of ${params.vStall} m/s)`);
                return null;
            }
            
            // Calculate dynamic pressure (q = 0.5 * ρ * V²)
            const dynamicPressure = 0.5 * rho * velocity * velocity;
            
            // Calculate lift (L = q * S * CLmax)
            const lift = dynamicPressure * params.surfaceArea * params.clMax;
            
            // Calculate load factor (n = L / W)
            const weightN = params.weight * g; // Convert kg to N
            const loadFactor = lift / weightN;
            
            // Store calculation for tabular output
            calculations.push({
                'Velocity (m/s)': velocity.toFixed(2),
                'Dynamic Pressure (Pa)': dynamicPressure.toFixed(2),
                'Lift (N)': lift.toFixed(2),
                'Weight (N)': weightN.toFixed(2),
                'Load Factor (n)': loadFactor.toFixed(4)
            });
            
            return {
                velocity,
                loadFactor,
                dynamicPressure,
                lift,
                weightN
            };
        });
        
        // Log calculations in a table
        if (calculations.length > 0) {
            console.log('\n=== Load Factor Calculation Results ===');
            console.table(calculations);
            
            // Log summary statistics
            const loadFactors = calculations.map(c => parseFloat(c['Load Factor (n)']));
            const minLF = Math.min(...loadFactors).toFixed(4);
            const maxLF = Math.max(...loadFactors).toFixed(4);
            const avgLF = (loadFactors.reduce((a, b) => a + b, 0) / loadFactors.length).toFixed(4);
            
            console.log('\n=== Load Factor Summary ===');
            console.table([
                { 'Parameter': 'Minimum Load Factor', 'Value': minLF },
                { 'Parameter': 'Maximum Load Factor', 'Value': maxLF },
                { 'Parameter': 'Average Load Factor', 'Value': avgLF },
                { 'Parameter': 'Number of Points', 'Value': calculations.length }
            ]);
        } else {
            console.warn('No valid load factor calculations were performed.');
        }
        
        return results;
    }
    
    // Render the chart using Chart.js
    renderChart(velocityRange, results) {
        const ctx = document.getElementById('vnChart')?.getContext('2d');
        if (!ctx) {
            this.showError('Canvas element not found');
            return;
        }
        
        // Filter out null results (velocities below Vstall)
        const validResults = results.filter(r => r !== null);
        
        if (validResults.length === 0) {
            this.showError('No valid data points to plot. Check if all velocities are above Vstall.');
            return;
        }
        
        // Prepare chart data
        const chartData = {
            labels: validResults.map(r => r.velocity.toFixed(1)),
            datasets: [{
                label: 'Load Factor (n)',
                data: validResults.map(r => ({
                    x: r.velocity,
                    y: r.loadFactor
                })),
                borderColor: 'rgb(75, 192, 192)',
                borderWidth: 2,
                pointRadius: 3,
                pointBackgroundColor: 'rgb(75, 192, 192)',
                fill: false,
                tension: 0.1
            }]
        };
        
        // Chart configuration
        const config = {
            type: 'line',
            data: chartData,
            options: {
                responsive: true,
                maintainAspectRatio: false,
                scales: {
                    x: {
                        type: 'linear',
                        position: 'bottom',
                        title: {
                            display: true,
                            text: 'Velocity (m/s)'
                        },
                        min: Math.max(0, Math.min(...validResults.map(r => r.velocity)) * 0.9),
                        max: Math.max(...validResults.map(r => r.velocity)) * 1.1
                    },
                    y: {
                        beginAtZero: true,
                        title: {
                            display: true,
                            text: 'Load Factor (n)'
                        },
                        min: 0,
                        max: Math.max(2, Math.max(...validResults.map(r => r.loadFactor)) * 1.2)
                    }
                },
                plugins: {
                    tooltip: {
                        callbacks: {
                            label: (context) => {
                                const data = validResults[context.dataIndex];
                                return [
                                    `Velocity: ${data.velocity.toFixed(1)} m/s`,
                                    `Load Factor: ${data.loadFactor.toFixed(2)}`,
                                    `Lift: ${data.lift.toFixed(2)} N`
                                ];
                            }
                        }
                    }
                }
            }
        };
        
        // Destroy existing chart if it exists
        if (this.chart) {
            this.chart.destroy();
        }
        
        // Create new chart
        this.chart = new Chart(ctx, config);
        
        // Show the chart container
        const container = document.querySelector('.chart-container');
        if (container) {
            container.style.display = 'block';
        }
    }
    
    // Show error message
    showError(message) {
        console.error('V-N Diagram Error:', message);
        alert(`Error: ${message}`);
    }
}

// Initialize the V-N diagram when the script loads
const vnDiagram = new VNDiagram();

// Make VNStorage available globally for debugging
window.VNStorage = VNStorage;