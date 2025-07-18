// Wheel Track Export Utility - Simplified Version
console.log('Wheel Track Export Utility loaded');

// Test function to verify SheetJS is loaded
window.testSheetJS = function() {
    try {
        if (typeof XLSX === 'undefined') {
            console.error('XLSX is not defined. SheetJS not loaded correctly.');
            alert('Error: SheetJS library not loaded. Please check the console for details.');
            return false;
        }
        
        console.log('SheetJS is loaded successfully!', XLSX.version);
        alert('SheetJS is loaded successfully! Version: ' + XLSX.version);
        return true;
    } catch (error) {
        console.error('Error testing SheetJS:', error);
        alert('Error testing SheetJS: ' + error.message);
        return false;
    }
};

// Simple alert-based message function
function showMessage(message, isError = false) {
    alert(message);
    console.log(isError ? 'ERROR: ' + message : 'INFO: ' + message);
}

// Collect all data from the wheel track calculator
function collectWheelTrackData() {
    console.log('Collecting wheel track data...');
    // Get all input values
    const inputs = {};
    document.querySelectorAll('.calculator-container input[type="number"]').forEach(input => {
        inputs[input.id] = input.value;
    });
    
    // Get results from the table if it exists
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
    
    return { inputs, results };
}

// Get wing area data from localStorage
function getWingAreaData() {
    try {
        const savedInputs = localStorage.getItem('wingAreaInputs');
        if (!savedInputs) return null;
        
        const inputs = JSON.parse(savedInputs);
        const weight = parseFloat(inputs.weight);
        const vstallStart = parseFloat(inputs.vstallStart);
        const vstallEnd = parseFloat(inputs.vstallEnd);
        const vstallStep = parseFloat(inputs.vstallStep);
        const clmaxStart = parseFloat(inputs.clmaxStart);
        const clmaxEnd = parseFloat(inputs.clmaxEnd);
        const clmaxStep = parseFloat(inputs.clmaxStep);
        
        // Generate Vstall and CLmax arrays based on ranges
        const vstalls = [];
        for (let v = vstallStart; v <= vstallEnd; v += vstallStep) {
            vstalls.push(parseFloat(v.toFixed(2)));
        }
        if (vstalls[vstalls.length - 1] < vstallEnd) {
            vstalls.push(parseFloat(vstallEnd.toFixed(2)));
        }

        const clmaxes = [];
        for (let c = clmaxStart; c <= clmaxEnd; c += clmaxStep) {
            clmaxes.push(parseFloat(c.toFixed(2)));
        }
        if (clmaxes[clmaxes.length - 1] < clmaxEnd) {
            clmaxes.push(parseFloat(clmaxEnd.toFixed(2)));
        }
        
        // Calculate wing areas
        const rho = 1.225; // Air density at sea level (kg/m³)
        const g = 9.81;    // Acceleration due to gravity (m/s²)
        
        // Create matrix of wing areas
        const matrix = [];
        const headerRow = ['CLmax \ Vstall (m/s)', ...vstalls.map(v => v.toString())];
        matrix.push(headerRow);
        
        for (const clmax of clmaxes) {
            const row = [clmax.toString()];
            for (const vstall of vstalls) {
                const wingArea = (2 * weight * g) / (rho * Math.pow(vstall, 2) * clmax);
                row.push(wingArea.toFixed(2));
            }
            matrix.push(row);
        }
        
        return {
            inputs: {
                weight,
                vstallStart,
                vstallEnd,
                vstallStep,
                clmaxStart,
                clmaxEnd,
                clmaxStep
            },
            matrix
        };
    } catch (error) {
        console.error('Error getting wing area data:', error);
        return null;
    }
}

// Get wing parameter data from localStorage
function getWingParameterData() {
    try {
        const savedInputs = localStorage.getItem('wingParametersInputs');
        if (!savedInputs) return null;
        
        const inputs = JSON.parse(savedInputs);
        
        // Get all the input values
        const rootChord = parseFloat(inputs.rootChord) || 0;
        const tipChord = parseFloat(inputs.tipChord) || 0;
        const wingspan = parseFloat(inputs.wingspan) || 0;
        const surfaceArea = parseFloat(inputs.surfaceArea) || 0;
        const velocity = parseFloat(inputs.velocity) || 0;
        const cl = parseFloat(inputs.cl) || 0;
        const clMax = parseFloat(inputs.clMax) || 0;
        const weight = parseFloat(inputs.weight) || 0;
        
        // Calculate derived values
        let wingArea = 0;
        let wingAreaM2 = 0;
        
        if (rootChord > 0 && tipChord > 0 && wingspan > 0) {
            wingArea = 0.5 * (rootChord + tipChord) * wingspan;
            wingAreaM2 = wingArea * 0.00064516; // Convert in² to m²
        } else if (surfaceArea > 0) {
            wingArea = surfaceArea;
            wingAreaM2 = surfaceArea * 0.00064516; // Convert in² to m² if needed
        }
        
        const aspectRatio = wingspan > 0 && wingArea > 0 ? Math.pow(wingspan, 2) / wingArea : 0;
        const taperRatio = rootChord > 0 ? tipChord / rootChord : 0;
        const wingLoading = weight > 0 && wingAreaM2 > 0 ? weight / wingAreaM2 : 0;
        
        // Calculate flight dynamics if we have velocity and CL
        let lift = 0;
        let loadFactor = 0;
        let vStall = 0;
        
        if (velocity > 0 && cl > 0 && wingAreaM2 > 0) {
            const AIR_DENSITY = 1.225; // kg/m³ at sea level
            lift = 0.5 * AIR_DENSITY * Math.pow(velocity, 2) * wingAreaM2 * cl;
            loadFactor = weight > 0 ? lift / (weight * 9.81) : 0;
            
            if (clMax > 0) {
                vStall = Math.sqrt((2 * weight * 9.81) / (AIR_DENSITY * wingAreaM2 * clMax));
            }
        }
        
        return {
            inputs: {
                rootChord,
                tipChord,
                wingspan,
                surfaceArea,
                velocity,
                cl,
                clMax,
                weight
            },
            calculations: {
                wingArea,
                wingAreaM2,
                aspectRatio,
                taperRatio,
                wingLoading,
                lift,
                loadFactor,
                vStall
            }
        };
    } catch (error) {
        console.error('Error getting wing parameter data:', error);
        return null;
    }
}

// Get dynamic thrust data from localStorage
function getDynamicThrustData() {
    try {
        const thrustData = localStorage.getItem('dynamicThrustData');
        if (!thrustData) return null;
        
        return JSON.parse(thrustData);
    } catch (error) {
        console.error('Error getting dynamic thrust data:', error);
        return null;
    }
}

// Get climb rate data from localStorage
function getClimbRateData() {
    try {
        const climbRateData = localStorage.getItem('climbRateResults');
        if (!climbRateData) return null;
        
        return JSON.parse(climbRateData);
    } catch (error) {
        console.error('Error getting climb rate data:', error);
        return null;
    }
}

// Get sink rate data from localStorage
function getSinkRateData() {
    try {
        // Sink rate data is stored in the same structure as climb rate
        const sinkRateData = localStorage.getItem('sinkRateResults') || localStorage.getItem('climbRateResults');
        if (!sinkRateData) return null;
        
        const data = JSON.parse(sinkRateData);
        // Convert climb rates to sink rates (negative values)
        if (data.climbRatesMs) {
            data.sinkRatesMs = data.climbRatesMs.map(rate => -Math.abs(rate));
            data.sinkRatesFpm = data.climbRatesMs.map(rate => -Math.abs(rate * 196.85));
        }
        return data;
    } catch (error) {
        console.error('Error getting sink rate data:', error);
        return null;
    }
}

// Get landing distance data from localStorage
function getLandingDistanceData() {
    try {
        // Try to get data from localStorage first
        const savedData = localStorage.getItem('landingDistanceData');
        if (savedData) {
            try {
                const parsedData = JSON.parse(savedData);
                if (parsedData && typeof parsedData === 'object') {
                    console.log('Using saved landing distance data:', parsedData);
                    return parsedData;
                }
            } catch (e) {
                console.warn('Error parsing saved landing distance data:', e);
            }
        }

        // If no saved data or parsing failed, try to calculate it
        console.log('No saved landing distance data found, calculating...');
        const wingParams = JSON.parse(localStorage.getItem('wingParametersInputs') || '{}');
        const thrustData = JSON.parse(localStorage.getItem('dynamicThrustData') || '{}');
        
        // Set default values for missing parameters
        const defaults = {
            weight: 100, // kg
            surfaceArea: 1, // m²
            clMax: 1.5,
            cd: 0.05
        };

        // Get values with defaults
        const weight = parseFloat(wingParams.weight || defaults.weight);
        const surfaceArea = parseFloat(wingParams.surfaceArea || defaults.surfaceArea);
        const clMax = parseFloat(wingParams.clMax || defaults.clMax);
        const cd = parseFloat(wingParams.cd || defaults.cd);

        // Calculate values
        const vStall = Math.sqrt((2 * weight * 9.81) / (1.225 * surfaceArea * clMax));
        const vTouchdown = 1.15 * vStall;
        const vTakeoff = 1.2 * vStall;
        const drag = (1.225 * Math.pow(vTakeoff, 2) * surfaceArea * cd) / 2;
        
        // Find closest thrust data point if available
        let netThrustAtV = 0;
        let hasThrustData = false;
        if (thrustData && thrustData.thrustCurve && Array.isArray(thrustData.thrustCurve) && thrustData.thrustCurve.length > 0) {
            hasThrustData = true;
            const closest = thrustData.thrustCurve.reduce((prev, curr) => 
                Math.abs(curr.velocity - vTakeoff) < Math.abs(prev.velocity - vTakeoff) ? curr : prev
            );
            netThrustAtV = closest.netThrust || 0;
        }
        
        const effectiveDrag = Math.max(0.1, drag - netThrustAtV);
        const velocityTerm = (Math.pow(vTakeoff, 2) - Math.pow(vTouchdown, 2)) / (2 * 9.81);
        const landingDistance = (weight * 9.81 / effectiveDrag) * (velocityTerm + 15);
        
        return {
            vStall,
            vTakeoff,
            vTouchdown,
            lift: weight * 9.81,
            drag,
            cd,
            surfaceArea,
            netThrustAtV,
            effectiveDrag,
            landingDistance,
            hasThrustData,
            timestamp: new Date().toISOString()
        };
    } catch (error) {
        console.error('Error in getLandingDistanceData:', error);
        // Return a default structure with error information
        return {
            error: 'Error calculating landing distance data',
            details: error.message,
            vStall: 0,
            vTakeoff: 0,
            vTouchdown: 0,
            lift: 0,
            drag: 0,
            cd: 0,
            surfaceArea: 0,
            netThrustAtV: 0,
            effectiveDrag: 0,
            landingDistance: 0,
            hasThrustData: false,
            timestamp: new Date().toISOString()
        };
    }
}

// Get takeoff distance data from localStorage
function getTakeoffDistanceData() {
    try {
        // Try to get data from localStorage first
        const savedData = localStorage.getItem('takeoffDistanceData');
        if (savedData) {
            try {
                const parsedData = JSON.parse(savedData);
                if (parsedData && typeof parsedData === 'object') {
                    console.log('Using saved takeoff distance data:', parsedData);
                    return parsedData;
                }
            } catch (e) {
                console.warn('Error parsing saved takeoff distance data:', e);
            }
        }

        // If no saved data or parsing failed, try to calculate it
        console.log('No saved takeoff distance data found, calculating...');
        const wingParams = JSON.parse(localStorage.getItem('wingParametersInputs') || '{}');
        const thrustData = JSON.parse(localStorage.getItem('dynamicThrustData') || '{}');
        
        // Set default values for missing parameters
        const defaults = {
            weight: 100, // kg
            surfaceArea: 1, // m²
            clMax: 1.5,
            cd: 0.1
        };

        // Get values with defaults
        const weight = parseFloat(wingParams.weight || defaults.weight);
        const surfaceArea = parseFloat(wingParams.surfaceArea || defaults.surfaceArea);
        const clMax = parseFloat(wingParams.clMax || defaults.clMax);
        const cd = parseFloat(wingParams.cd || defaults.cd);

        // Calculate values
        const vStall = Math.sqrt((2 * weight * 9.81) / (1.225 * surfaceArea * clMax));
        const vTakeoff = 1.2 * vStall;
        
        // Calculate thrust at takeoff speed
        let thrustAtTakeoff = 0;
        if (thrustData && thrustData.thrustCurve && Array.isArray(thrustData.thrustCurve) && thrustData.thrustCurve.length > 0) {
            const closest = thrustData.thrustCurve.reduce((prev, curr) => 
                Math.abs(curr.velocity - vTakeoff) < Math.abs(prev.velocity - vTakeoff) ? curr : prev
            );
            thrustAtTakeoff = closest.thrust || 0;
        }
        
        // Calculate lift at takeoff (should equal weight at takeoff)
        const liftAtTakeoff = 0.5 * 1.225 * Math.pow(vTakeoff, 2) * surfaceArea * clMax;
        
        // Calculate takeoff distance (simplified)
        const takeoffDistance = (1.44 * Math.pow(weight * 9.81, 2)) / (9.81 * 1.225 * surfaceArea * clMax * (thrustAtTakeoff > 0 ? thrustAtTakeoff : weight * 0.3 * 9.81));
        
        return {
            vStall,
            vTakeoff,
            weight: weight * 9.81, // Convert to Newtons
            surfaceArea,
            clMax,
            cd,
            thrustAtTakeoff,
            liftAtTakeoff,
            takeoffDistance,
            timestamp: new Date().toISOString()
        };
    } catch (error) {
        console.error('Error in getTakeoffDistanceData:', error);
        return {
            error: 'Error calculating takeoff distance data',
            details: error.message,
            vStall: 0,
            vTakeoff: 0,
            weight: 0,
            surfaceArea: 0,
            clMax: 0,
            cd: 0,
            thrustAtTakeoff: 0,
            liftAtTakeoff: 0,
            takeoffDistance: 0,
            timestamp: new Date().toISOString()
        };
    }
}

// Export data to Excel
function exportToExcel() {
    console.log('Export button clicked');
    const button = document.getElementById('import-btn');
    
    try {
        // Verify XLSX is available
        if (typeof XLSX === 'undefined') {
            throw new Error('Excel export library not loaded. Make sure the SheetJS script is included.');
        }
        
        // Get wheel track results
        const resultsTable = document.querySelector('.results-table');
        const wheelTrackResults = [];
        
        if (resultsTable) {
            const rows = resultsTable.querySelectorAll('tbody tr');
            rows.forEach(row => {
                const cells = row.querySelectorAll('td');
                if (cells.length >= 3) {
                    wheelTrackResults.push({
                        wheelBase: parseFloat(cells[0].textContent),
                        mainGearDistance: parseFloat(cells[1].textContent),
                        noseGearDistance: parseFloat(cells[2].textContent)
                    });
                }
            });
        }
        
        if (wheelTrackResults.length === 0) {
            throw new Error('No wheel track results found. Please calculate the wheel track first.');
        }
        
        // Get all data
        const wingAreaData = getWingAreaData();
        const wingParamData = getWingParameterData();
        const dynamicThrustData = getDynamicThrustData();
        const climbRateData = getClimbRateData();
        const sinkRateData = getSinkRateData();
        const landingDistanceData = getLandingDistanceData();
        const takeoffDistanceData = getTakeoffDistanceData();
        
        // Create a new workbook
        const wb = XLSX.utils.book_new();
        
        // 1. Add Wing Area sheet if data is available (first in UI)
        if (wingAreaData) {
            const wingAreaSheet = [
                ['Wing Area Calculator - Results'],
                ['Generated at', new Date().toLocaleString()],
                [],
                ['Input Parameters', '', ''],
                ['Aircraft Weight (kg):', wingAreaData.inputs.weight, ''],
                ['Vstall Range:', `${wingAreaData.inputs.vstallStart} to ${wingAreaData.inputs.vstallEnd} m/s (step: ${wingAreaData.inputs.vstallStep})`, ''],
                ['CLmax Range:', `${wingAreaData.inputs.clmaxStart} to ${wingAreaData.inputs.clmaxEnd} (step: ${wingAreaData.inputs.clmaxStep})`, ''],
                [],
                ['Wing Area Matrix (m²)', '', '']
            ];
            
            // Add wing area matrix
            wingAreaSheet.push(...wingAreaData.matrix);
            
            // Add Wing Area sheet to workbook
            const wingAreaWs = XLSX.utils.aoa_to_sheet(wingAreaSheet);
            
            // Set column widths for wing area sheet
            if (wingAreaData.matrix && wingAreaData.matrix.length > 0) {
                const wingAreaCols = [
                    { wch: 15 }, // CLmax column
                    ...Array(wingAreaData.matrix[0].length - 1).fill({ wch: 12 }) // Vstall columns
                ];
                wingAreaWs['!cols'] = wingAreaCols;
            }
            
            XLSX.utils.book_append_sheet(wb, wingAreaWs, 'Wing Area');
        }
        
        // 2. Add Wing Parameter sheet if data is available (second in UI)
        if (wingParamData) {
            const wingParamSheet = [
                ['Wing Parameter Calculator - Results'],
                ['Generated at', new Date().toLocaleString()],
                [],
                ['Input Parameters', '', ''],
                ['Root Chord (in):', wingParamData.inputs.rootChord || 'N/A', ''],
                ['Tip Chord (in):', wingParamData.inputs.tipChord || 'N/A', ''],
                ['Wingspan (in):', wingParamData.inputs.wingspan || 'N/A', ''],
                ['Surface Area (in²):', wingParamData.inputs.surfaceArea || 'N/A', ''],
                ['Velocity (m/s):', wingParamData.inputs.velocity || 'N/A', ''],
                ['Coefficient of Lift (CL):', wingParamData.inputs.cl || 'N/A', ''],
                ['Maximum CL (CLmax):', wingParamData.inputs.clMax || 'N/A', ''],
                ['Aircraft Weight (kg):', wingParamData.inputs.weight || 'N/A', ''],
                [],
                ['Calculated Values', '', ''],
                ['Wing Area (in²):', wingParamData.calculations.wingArea.toFixed(2) || 'N/A', ''],
                ['Wing Area (m²):', wingParamData.calculations.wingAreaM2.toFixed(4) || 'N/A', ''],
                ['Aspect Ratio:', wingParamData.calculations.aspectRatio.toFixed(2) || 'N/A', ''],
                ['Taper Ratio:', wingParamData.calculations.taperRatio.toFixed(3) || 'N/A', ''],
                ['Wing Loading (N/m²):', wingParamData.calculations.wingLoading.toFixed(2) || 'N/A', ''],
                ['Lift (N):', wingParamData.calculations.lift.toFixed(2) || 'N/A', ''],
                ['Load Factor (g):', wingParamData.calculations.loadFactor.toFixed(2) || 'N/A', ''],
                ['Stall Speed (m/s):', wingParamData.calculations.vStall.toFixed(2) || 'N/A', '']
            ];
            
            // Add Wing Parameter sheet to workbook
            const wingParamWs = XLSX.utils.aoa_to_sheet(wingParamSheet);
            wingParamWs['!cols'] = [
                { wch: 25 }, // Parameter names
                { wch: 20 }, // Values
                { wch: 25 }  // Units
            ];
            
            XLSX.utils.book_append_sheet(wb, wingParamWs, 'Wing Parameter');
        }
        
        // 3. Add Dynamic Thrust sheet if data is available (third in UI)
        if (dynamicThrustData) {
            // Create header and input parameters section
            const dynamicThrustSheet = [
                ['Dynamic Thrust Calculator - Results'],
                ['Generated at', new Date().toLocaleString()],
                [],
                ['Input Parameters', '', ''],
                ['RPM:', dynamicThrustData.rpm || 'N/A', ''],
                ['Propeller Diameter (in):', dynamicThrustData.propDiameter || 'N/A', ''],
                ['Propeller Pitch (in):', dynamicThrustData.propPitch || 'N/A', ''],
                [],
                ['Thrust Range', '', ''],
                ['Maximum Thrust (N):', dynamicThrustData.thrustRange?.max?.toFixed(2) || 'N/A', ''],
                ['Minimum Thrust (N):', dynamicThrustData.thrustRange?.min?.toFixed(2) || 'N/A', ''],
                ['Average Thrust (N):', dynamicThrustData.thrustRange?.average?.toFixed(2) || 'N/A', ''],
                [],
                ['Thrust Curve Data', '', ''],
                ['Velocity (m/s)', 'Thrust Available (N)', 'Thrust Required (N)', 'Net Thrust (N)']
            ];
            
            // Add thrust curve data rows
            if (dynamicThrustData.thrustCurve && Array.isArray(dynamicThrustData.thrustCurve)) {
                dynamicThrustData.thrustCurve.forEach(point => {
                    dynamicThrustSheet.push([
                        point.velocity?.toFixed(2) || 0,
                        point.thrust?.toFixed(2) || 0,
                        point.drag?.toFixed(2) || 0,
                        point.netThrust?.toFixed(2) || 0
                    ]);
                });
            }
            
            // Add Dynamic Thrust sheet to workbook
            const dynamicThrustWs = XLSX.utils.aoa_to_sheet(dynamicThrustSheet);
            dynamicThrustWs['!cols'] = [
                { wch: 15 }, // Velocity
                { wch: 20 }, // Thrust Available
                { wch: 20 }, // Thrust Required
                { wch: 18 }  // Net Thrust
            ];
            
            XLSX.utils.book_append_sheet(wb, dynamicThrustWs, 'Dynamic Thrust');
        }
        
        // 4. Add Climb Rate sheet if data is available (fourth in UI)
        if (climbRateData) {
            const climbRateSheet = [
                ['Climb Rate Calculator - Results'],
                ['Generated at', new Date().toLocaleString()],
                [],
                ['Maximum Climb Rate', '', ''],
                ['Velocity at Max Climb Rate (m/s):', climbRateData.maxClimbRate?.velocity?.toFixed(2) || 'N/A', ''],
                ['Maximum Climb Rate (m/s):', climbRateData.maxClimbRate?.climbRateMs?.toFixed(2) || 'N/A', ''],
                ['Maximum Climb Rate (ft/min):', climbRateData.maxClimbRate?.climbRateFpm?.toFixed(2) || 'N/A', ''],
                ['Power Available at Max Climb (W):', climbRateData.maxClimbRate?.powerAvailable?.toFixed(2) || 'N/A', ''],
                ['Power Required at Max Climb (W):', climbRateData.maxClimbRate?.powerRequired?.toFixed(2) || 'N/A', ''],
                [],
                ['Climb Rate Data', '', ''],
                ['Velocity (m/s)', 'Climb Rate (m/s)', 'Climb Rate (ft/min)', 'Power Available (W)', 'Power Required (W)']
            ];
            
            // Add climb rate data rows
            if (climbRateData.velocityRange && climbRateData.climbRatesMs && 
                climbRateData.climbRatesFpm && climbRateData.powerAvailable && climbRateData.powerRequired) {
                for (let i = 0; i < climbRateData.velocityRange.length; i++) {
                    climbRateSheet.push([
                        climbRateData.velocityRange[i]?.toFixed(2) || 0,
                        climbRateData.climbRatesMs[i]?.toFixed(2) || 0,
                        climbRateData.climbRatesFpm[i]?.toFixed(2) || 0,
                        climbRateData.powerAvailable[i]?.toFixed(2) || 0,
                        climbRateData.powerRequired[i]?.toFixed(2) || 0
                    ]);
                }
            }
            
            // Add Climb Rate sheet to workbook
            const climbRateWs = XLSX.utils.aoa_to_sheet(climbRateSheet);
            climbRateWs['!cols'] = [
                { wch: 15 }, // Velocity
                { wch: 15 }, // Climb Rate (m/s)
                { wch: 15 }, // Climb Rate (ft/min)
                { wch: 18 }, // Power Available
                { wch: 18 }  // Power Required
            ];
            
            XLSX.utils.book_append_sheet(wb, climbRateWs, 'Climb Rate');
        }
        
        // 5. Add Sink Rate sheet if data is available (fifth in UI)
        if (sinkRateData) {
            const sinkRateSheet = [
                ['Sink Rate Calculator - Results'],
                ['Generated at', new Date().toLocaleString()],
                [],
                ['Sink Rate Data', '', ''],
                ['Velocity (m/s)', 'Sink Rate (m/s)', 'Sink Rate (ft/min)']
            ];
            
            // Add sink rate data rows (using negative of climb rate data)
            if (sinkRateData.velocityRange && sinkRateData.sinkRatesMs && sinkRateData.sinkRatesFpm) {
                for (let i = 0; i < sinkRateData.velocityRange.length; i++) {
                    sinkRateSheet.push([
                        sinkRateData.velocityRange[i]?.toFixed(2) || 0,
                        sinkRateData.sinkRatesMs[i]?.toFixed(2) || 0,
                        sinkRateData.sinkRatesFpm[i]?.toFixed(2) || 0
                    ]);
                }
            }
            
            // Add Sink Rate sheet to workbook
            const sinkRateWs = XLSX.utils.aoa_to_sheet(sinkRateSheet);
            sinkRateWs['!cols'] = [
                { wch: 15 }, // Velocity
                { wch: 15 }, // Sink Rate (m/s)
                { wch: 15 }  // Sink Rate (ft/min)
            ];
            
            XLSX.utils.book_append_sheet(wb, sinkRateWs, 'Sink Rate');
        }
        
        // 6. Add Landing Distance sheet if data is available (sixth in UI)
        if (landingDistanceData) {
            const landingDistanceSheet = [
                ['Landing Distance Calculator - Results'],
                ['Generated at', new Date().toLocaleString()],
                [],
                ['Input Parameters', '', ''],
                ['Stall Speed (m/s):', landingDistanceData.vStall?.toFixed(2) || 'N/A', ''],
                ['Touchdown Velocity (1.15 × Vstall):', landingDistanceData.vTouchdown?.toFixed(2) || 'N/A', ''],
                ['Approach Velocity (1.2 × Vstall):', landingDistanceData.vTakeoff?.toFixed(2) || 'N/A', ''],
                ['Aircraft Weight (N):', landingDistanceData.lift?.toFixed(2) || 'N/A', ''],
                ['Wing Area (m²):', landingDistanceData.surfaceArea !== undefined ? Number(landingDistanceData.surfaceArea).toFixed(2) : 'N/A', ''],
                ['Drag Coefficient (CD):', landingDistanceData.cd !== undefined ? Number(landingDistanceData.cd).toFixed(4) : 'N/A', ''],
                [],
                ['Calculated Values', '', ''],
                ['Drag Force (N):', landingDistanceData.drag?.toFixed(2) || 'N/A', ''],
                ['Net Thrust at Approach (N):', landingDistanceData.netThrustAtV?.toFixed(2) || 'N/A', ''],
                ['Effective Drag (N):', landingDistanceData.effectiveDrag?.toFixed(2) || 'N/A', ''],
                ['Lift-to-Drag Ratio:', (landingDistanceData.lift / landingDistanceData.effectiveDrag)?.toFixed(2) || 'N/A', ''],
                ['Landing Distance (m):', landingDistanceData.landingDistance?.toFixed(2) || 'N/A', '']
            ];
            
            // Add Landing Distance sheet to workbook
            const landingDistanceWs = XLSX.utils.aoa_to_sheet(landingDistanceSheet);
            landingDistanceWs['!cols'] = [
                { wch: 30 }, // Parameter
                { wch: 20 }, // Value
                { wch: 15 }  // Unit
            ];
            
            XLSX.utils.book_append_sheet(wb, landingDistanceWs, 'Landing Distance');
        }
        
        // 7. Add Takeoff Distance sheet if data is available (seventh in UI)
        if (takeoffDistanceData) {
            const takeoffDistanceSheet = [
                ['Takeoff Distance Calculator - Results'],
                ['Generated at', new Date().toLocaleString()],
                [],
                ['Input Parameters', '', ''],
                ['Stall Speed (m/s):', takeoffDistanceData.vStall?.toFixed(2) || 'N/A', ''],
                ['Takeoff Speed (1.2 × Vstall):', takeoffDistanceData.vTakeoff?.toFixed(2) || 'N/A', ''],
                ['Aircraft Weight (N):', takeoffDistanceData.weight?.toFixed(2) || 'N/A', ''],
                ['Wing Area (m²):', takeoffDistanceData.surfaceArea?.toFixed(2) || 'N/A', ''],
                ['Maximum Lift Coefficient (CLmax):', takeoffDistanceData.clMax?.toFixed(4) || 'N/A', ''],
                [],
                ['Calculated Values', '', ''],
                ['Lift Force at Takeoff (N):', takeoffDistanceData.liftForce?.toFixed(2) || 'N/A', ''],
                ['Thrust at Takeoff (N):', takeoffDistanceData.thrustAtTakeoff?.toFixed(2) || 'N/A', ''],
                ['Takeoff Distance (m):', takeoffDistanceData.takeoffDistance?.toFixed(2) || 'N/A', '']
            ];
            
            // Add Takeoff Distance sheet to workbook
            const takeoffDistanceWs = XLSX.utils.aoa_to_sheet(takeoffDistanceSheet);
            takeoffDistanceWs['!cols'] = [
                { wch: 30 }, // Parameter
                { wch: 20 }, // Value
                { wch: 15 }  // Unit
            ];
            
            XLSX.utils.book_append_sheet(wb, takeoffDistanceWs, 'Takeoff Distance');
        }
        
        // 8. Add Wheel Track sheet (last in UI)
        const wheelTrackData = [
            // Header
            ['Wheel Track Calculator - Results'],
            ['Generated at', new Date().toLocaleString()],
            [], // Empty row for spacing
            
            // Input Parameters Section
            ['Input Parameters', '', ''],
            ['Wheel Base Start:', document.getElementById('wheel-base-start')?.value || 'N/A', ''],
            ['Wheel Base End:', document.getElementById('wheel-base-end')?.value || 'N/A', ''],
            ['Wheel Base Step:', document.getElementById('wheel-base-step')?.value || 'N/A', ''],
        ];
        
        // Add weight from localStorage if available
        try {
            const savedInputs = localStorage.getItem('wingAreaInputs');
            if (savedInputs) {
                const weightKg = JSON.parse(savedInputs).weight;
                wheelTrackData.push(['Aircraft Weight (kg):', weightKg || 'N/A', '']);
                wheelTrackData.push(['Aircraft Weight (N):', (weightKg * 9.81).toFixed(2) + ' N', '']);
            }
        } catch (e) {
            console.warn('Could not retrieve weight from localStorage:', e);
        }
        
        // Add spacing before results
        wheelTrackData.push([], ['Calculation Results', '', ''],
            ['Wheel Base (in)', 'Main Gear from CG (in)', 'Nose Gear from CG (in)']
        );
        
        // Add result rows
        wheelTrackResults.forEach(result => {
            wheelTrackData.push([
                result.wheelBase,
                result.mainGearDistance,
                result.noseGearDistance
            ]);
        });
        
        // Add Wheel Track sheet to workbook
        const wheelTrackWs = XLSX.utils.aoa_to_sheet(wheelTrackData);
        wheelTrackWs['!cols'] = [
            { wch: 22 }, // Parameter names
            { wch: 20 }, // Values
            { wch: 25 }  // Results
        ];
        XLSX.utils.book_append_sheet(wb, wheelTrackWs, 'Wheel Track');
        
        // Generate filename with timestamp
        const timestamp = new Date().toISOString().replace(/[:.]/g, '-');
        const filename = `Wheel-Track-Export-${timestamp}.xlsx`;
        
        // Download the file
        XLSX.writeFile(wb, filename);
        showMessage('Export completed successfully!');
        
    } catch (error) {
        console.error('Error exporting data:', error);
        showMessage(`Error: ${error.message}`, true);
    }
}

// Simple initialization
console.log('Initializing export functionality...');

// Set up the export button with a single event listener
function initializeExportButton() {
    const importBtn = document.getElementById('import-btn');
    
    if (importBtn) {
        // Only add the event listener if it hasn't been added yet
        if (!importBtn.hasAttribute('data-export-initialized')) {
            console.log('Setting up export button');
            importBtn.title = 'Export wheel track data to Excel';
            importBtn.setAttribute('aria-label', 'Export wheel track data to Excel');
            importBtn.setAttribute('data-export-initialized', 'true');
            
            // Add click event listener
            importBtn.addEventListener('click', function(e) {
                e.preventDefault();
                console.log('Export button clicked');
                exportToExcel();
            });
            
            // Make the button more visible
            importBtn.style.backgroundColor = '#4CAF50';
            importBtn.style.color = 'white';
            importBtn.style.padding = '8px 16px';
            importBtn.style.borderRadius = '4px';
            importBtn.style.border = 'none';
            importBtn.style.cursor = 'pointer';
        }
    } else {
        console.log('Export button not found yet, will retry...');
        return false;
    }
    return true;
}

// Try to initialize immediately if DOM is ready
if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', function() {
        initializeExportButton();
    });
} else {
    initializeExportButton();
}

// Also try initializing after a short delay as a fallback
setTimeout(initializeExportButton, 1000);
