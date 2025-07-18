document.addEventListener('DOMContentLoaded', () => {
  // =============================================
  // DOM Elements
  // =============================================
  const tabs = document.querySelectorAll('.tab');
  
  // Wing Area Calculator Elements
  const calculateBtn = document.getElementById('calculate');
  const vstallRows = document.getElementById('vstall-rows');
  const clmaxRows = document.getElementById('clmax-rows');
  const addVstallBtn = document.getElementById('add-vstall');
  const addClmaxBtn = document.getElementById('add-clmax');
  const resultsSection = document.querySelector('.results-section');
  const resultsContainer = document.getElementById('results-container');

  // =============================================
  // Tab Navigation
  // =============================================
  function setActiveTab() {
    const currentPage = window.location.pathname.split('/').pop() || 'index.html';
    
    tabs.forEach(tab => {
      const tabHref = tab.getAttribute('href');
      if ((currentPage === 'index.html' && tabHref === 'index.html') ||
          (tabHref && tabHref === currentPage)) {
        tab.classList.add('active');
      } else {
        tab.classList.remove('active');
      }
    });
  }

  function setupTabNavigation() {
    tabs.forEach(tab => {
      tab.addEventListener('click', (e) => {
        e.preventDefault();
        const href = tab.getAttribute('href');
        if (href) {
          window.location.href = href;
        }
      });
    });
  }

  // =============================================
  // Wing Area Calculator
  // =============================================
  function saveInputs() {
    const inputs = {
      weight: document.getElementById('weight').value,
      vstallStart: document.getElementById('vstall-start').value,
      vstallEnd: document.getElementById('vstall-end').value,
      vstallStep: document.getElementById('vstall-step').value,
      clmaxStart: document.getElementById('clmax-start').value,
      clmaxEnd: document.getElementById('clmax-end').value,
      clmaxStep: document.getElementById('clmax-step').value
    };
    localStorage.setItem('wingAreaInputs', JSON.stringify(inputs));
  }

  function loadInputs() {
    const savedInputs = localStorage.getItem('wingAreaInputs');
    if (savedInputs) {
      const inputs = JSON.parse(savedInputs);
      
      // Set input values
      document.getElementById('weight').value = inputs.weight || '';
      document.getElementById('vstall-start').value = inputs.vstallStart || '10';
      document.getElementById('vstall-end').value = inputs.vstallEnd || '20';
      document.getElementById('vstall-step').value = inputs.vstallStep || '1';
      document.getElementById('clmax-start').value = inputs.clmaxStart || '1.0';
      document.getElementById('clmax-end').value = inputs.clmaxEnd || '2.0';
      document.getElementById('clmax-step').value = inputs.clmaxStep || '0.1';
    }
  }

  function calculateWingArea() {
    try {
      // Get weight input
      const weight = parseFloat(document.getElementById('weight').value);
      if (isNaN(weight) || weight <= 0) {
        showError('Please enter a valid aircraft weight (must be greater than 0)');
        return;
      }

      // Get Vstall range
      const vstallStart = parseFloat(document.getElementById('vstall-start').value);
      const vstallEnd = parseFloat(document.getElementById('vstall-end').value);
      const vstallStep = parseFloat(document.getElementById('vstall-step').value);
      
      if (isNaN(vstallStart) || isNaN(vstallEnd) || isNaN(vstallStep) || 
          vstallStart < 0 || vstallEnd <= vstallStart || vstallStep <= 0) {
        showError('Invalid Vstall range values. Please check your inputs.');
        return;
      }

      // Get CLmax range
      const clmaxStart = parseFloat(document.getElementById('clmax-start').value);
      const clmaxEnd = parseFloat(document.getElementById('clmax-end').value);
      const clmaxStep = parseFloat(document.getElementById('clmax-step').value);
      
      if (isNaN(clmaxStart) || isNaN(clmaxEnd) || isNaN(clmaxStep) || 
          clmaxStart <= 0 || clmaxEnd <= clmaxStart || clmaxStep <= 0) {
        showError('Invalid CLmax range values. Please check your inputs.');
        return;
      }

      // Generate Vstall and CLmax arrays based on ranges
      const vstalls = [];
      for (let v = vstallStart; v <= vstallEnd; v += vstallStep) {
        vstalls.push(parseFloat(v.toFixed(2)));
      }
      // Ensure the end value is included
      if (vstalls[vstalls.length - 1] < vstallEnd) {
        vstalls.push(parseFloat(vstallEnd.toFixed(2)));
      }

      const clmaxes = [];
      for (let c = clmaxStart; c <= clmaxEnd; c += clmaxStep) {
        clmaxes.push(parseFloat(c.toFixed(2)));
      }
      // Ensure the end value is included
      if (clmaxes[clmaxes.length - 1] < clmaxEnd) {
        clmaxes.push(parseFloat(clmaxEnd.toFixed(2)));
      }

      // Calculate wing areas
      const results = [];
      const rho = 1.225; // Air density at sea level (kg/m³)
      const g = 9.81;    // Acceleration due to gravity (m/s²)

      // Create matrix of wing areas
      const matrix = [];
      matrix.push(['CLmax \ Vstall', ...vstalls.map(v => `${v} m/s`)]);
      
      for (const clmax of clmaxes) {
        const row = [`${clmax}`];
        for (const vstall of vstalls) {
          // Wing area formula: S = (2 * W) / (ρ * V² * CLmax)
          const wingArea = (2 * weight * g) / (rho * Math.pow(vstall, 2) * clmax);
          row.push(wingArea.toFixed(2) + ' m²');
        }
        matrix.push(row);
        results.push({
          clmax,
          vstalls: vstalls.map((v, i) => ({
            vstall: v,
            wingArea: parseFloat(((2 * weight * g) / (rho * Math.pow(v, 2) * clmax)).toFixed(2))
          }))
        });
      }

      // Save inputs and display results
      saveInputs();
      displayResults({ results, vstalls, clmaxes, matrix });
      
    } catch (error) {
      console.error('Error calculating wing area:', error);
      showError('An error occurred during calculation. Please check your inputs and try again.');
    }
  }

  function displayResults({ results, vstalls, clmaxes, matrix }) {
    if (!results || results.length === 0) {
      resultsContainer.innerHTML = '<p class="no-results">No results to display. Please check your inputs and try again.</p>';
      return;
    }

    // Show results section with animation
    resultsSection.style.display = 'block';
    resultsSection.style.opacity = '1';
    resultsSection.style.visibility = 'visible';
    
    // Create table container with horizontal scrolling
    const tableContainer = document.createElement('div');
    tableContainer.className = 'table-responsive';
    
    // Create table
    const table = document.createElement('table');
    table.className = 'results-table';
    
    // Create table header row with Vstall values
    const thead = document.createElement('thead');
    let headerRow = document.createElement('tr');
    
    // Empty top-left cell
    headerRow.innerHTML = '<th class="corner-header">CLmax ↓<br>Vstall →</th>';
    
    // Add Vstall headers with exact values
    vstalls.forEach(vstall => {
      headerRow.innerHTML += `<th>${vstall} m/s</th>`;
    });
    
    thead.appendChild(headerRow);
    table.appendChild(thead);
    
    // Create table body
    const tbody = document.createElement('tbody');
    
    // Add rows for each CLmax
    clmaxes.forEach(clmax => {
      const row = document.createElement('tr');
      
      // Add CLmax as row header
      row.innerHTML = `<th>${clmax}</th>`;
      
      // Add wing area cells with exact values
      vstalls.forEach(vstall => {
        const wingArea = results.find(r => r.clmax === clmax).vstalls.find(v => v.vstall === vstall).wingArea;
        const displayValue = wingArea.toFixed(4);
        row.innerHTML += `
          <td class="copyable" data-value="${displayValue}" title="Click to copy">
            <div class="cell-content">
              <span class="value">${displayValue}</span>
              <span class="unit">m²</span>
            </div>
          </td>`;
      });
      
      tbody.appendChild(row);
    });
    
    table.appendChild(tbody);
    tableContainer.appendChild(table);
    
    // Create export button
    const exportButton = document.createElement('button');
    exportButton.className = 'export-btn';
    exportButton.innerHTML = '<i class="fas fa-download"></i> Export to Excel';
    exportButton.onclick = () => exportToCSV(results, vstalls, clmaxes, matrix);
    
    // Clear previous results and add the new content
    resultsContainer.innerHTML = '';
    resultsContainer.appendChild(tableContainer);
    resultsContainer.appendChild(exportButton);
    
    // Add click-to-copy functionality
    document.querySelectorAll('.copyable').forEach(cell => {
      cell.addEventListener('click', function() {
        const value = this.getAttribute('data-value');
        if (value) {
          navigator.clipboard.writeText(value).then(() => {
            const notification = document.createElement('div');
            notification.className = 'copy-notification';
            notification.textContent = 'Copied!';
            this.appendChild(notification);
            
            setTimeout(() => {
              notification.remove();
            }, 1500);
          }).catch(err => {
            console.error('Failed to copy:', err);
          });
        }
      });
    });
    
    // Scroll to results
    resultsSection.scrollIntoView({ behavior: 'smooth' });
  }
  
  function exportToCSV(results, vstalls, clmaxes, matrix) {
    let csvContent = 'CLmax,' + vstalls.join(' m/s,') + ' m/s\n';
    
    clmaxes.forEach(clmax => {
      const row = [clmax];
      vstalls.forEach(vstall => {
        const wingArea = results.find(r => r.clmax === clmax).vstalls.find(v => v.vstall === vstall).wingArea;
        row.push(wingArea ? wingArea.toFixed(4) : '');
      });
      csvContent += row.join(',') + '\n';
    });
    
    const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    const timestamp = new Date().toISOString().replace(/[:.]/g, '-');
    
    link.setAttribute('href', url);
    link.setAttribute('download', `wing-area-results-${timestamp}.csv`);
    link.style.visibility = 'hidden';
    
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  }

  function setupFullscreenToggle(container, button) {
    button.addEventListener('click', () => {
      if (!document.fullscreenElement) {
        // Enter fullscreen
        if (container.requestFullscreen) {
          container.requestFullscreen();
        } else if (container.webkitRequestFullscreen) { /* Safari */
          container.webkitRequestFullscreen();
        } else if (container.msRequestFullscreen) { /* IE11 */
          container.msRequestFullscreen();
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
    document.addEventListener('fullscreenchange', updateButtonIcon);
    document.addEventListener('webkitfullscreenchange', updateButtonIcon);
    document.addEventListener('mozfullscreenchange', updateButtonIcon);
    document.addEventListener('MSFullscreenChange', updateButtonIcon);

    function updateButtonIcon() {
      const isFullscreen = document.fullscreenElement || 
                         document.webkitFullscreenElement ||
                         document.mozFullScreenElement ||
                         document.msFullscreenElement;
      
      if (isFullscreen) {
        button.innerHTML = `
          <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
            <path d="M8 3v3a2 2 0 0 1-2 2H3m18 0h-3a2 2 0 0 1-2-2V3m0 18v-3a2 2 0 0 1 2-2h3M3 16h3a2 2 0 0 1 2 2v3"></path>
          </svg>
        `;
        button.title = 'Exit fullscreen';
      } else {
        button.innerHTML = `
          <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
            <path d="M8 3H5a2 2 0 0 0-2 2v3m18 0V5a2 2 0 0 0-2-2h-3m0 18h3a2 2 0 0 0 2-2v-3M3 16v3a2 2 0 0 0 2 2h3"></path>
          </svg>
        `;
        button.title = 'Enter fullscreen';
      }
    }
  }

  // =============================================
  // Event Listeners
  // =============================================
  if (addVstallBtn) {
    addVstallBtn.addEventListener('click', () => {
      addVstallRow();
      saveInputs();
    });
  }
  
  if (addClmaxBtn) {
    addClmaxBtn.addEventListener('click', () => {
      addClmaxRow();
      saveInputs();
    });
  }
  
  if (calculateBtn) {
    calculateBtn.addEventListener('click', calculateWingArea);
  }
  
  document.getElementById('reset')?.addEventListener('click', () => {
    if (confirm('Are you sure you want to reset all inputs?')) {
      localStorage.removeItem('wingAreaInputs');
      location.reload();
    }
  });

  // =============================================
  // Initialize the Application
  // =============================================
  function init() {
    setActiveTab();
    setupTabNavigation();
    loadInputs();
    
    // Initialize fullscreen toggle
    const resultsSection = document.querySelector('.results-section');
    const fullscreenToggle = document.getElementById('fullscreen-toggle');
    if (resultsSection && fullscreenToggle) {
      setupFullscreenToggle(resultsSection, fullscreenToggle);
    }
  }

  // Start the application
  init();
});

// Helper functions
function showError(message) {
  const debugInfo = document.getElementById('debug-info');
  if (debugInfo) {
    debugInfo.textContent = message;
    debugInfo.style.display = 'block';
  }
  console.error(message);
}

function clearError() {
  const debugInfo = document.getElementById('debug-info');
  if (debugInfo) {
    debugInfo.textContent = '';
    debugInfo.style.display = 'none';
  }
}