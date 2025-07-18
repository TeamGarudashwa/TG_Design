import { existsSync, readFileSync, writeFileSync } from 'fs';
import { join, dirname } from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

// List of HTML files to update
const htmlFiles = [
    'climb-rate.html',
    'dynamic-thrust.html',
    'index.html',
    'landing-distance.html',
    'sink-rate.html',
    'takeoff-distance.html',
    'vn-diagram.html',
    'wheel-track.html',
    'wing-parameter.html'
];

// Function to update a single HTML file
function updateHtmlFile(filePath) {
    try {
        // Read the file
        let content = readFileSync(filePath, 'utf8');
        
        // Check if the file already has the SheetJS script
        if (content.includes('xlsx.full.min.js')) {
            console.log(`✓ ${filePath} already has SheetJS script`);
            return;
        }
        
        // Add SheetJS script before the closing head tag
        const sheetJsScript = '  <!-- Add SheetJS library for Excel export -->\n  <script src="https://cdn.sheetjs.com/xlsx-0.19.3/package/dist/xlsx.full.min.js"></script>';
        
        content = content.replace('</head>', `${sheetJsScript}\n</head>`);
        
        // Add export-utils.js script before the closing body tag
        const exportUtilsScript = '  <script src="./src/export-utils.js" type="module"></script>';
        
        // Check if there's already a script tag before body
        if (content.includes('</body>')) {
            content = content.replace('</body>', `  ${exportUtilsScript}\n</body>`);
        } else {
            // If no body tag, add it before the closing html tag
            content = content.replace('</html>', `  ${exportUtilsScript}\n</body>\n</html>`);
        }
        
        // Write the updated content back to the file
        writeFileSync(filePath, content, 'utf8');
        console.log(`✓ Updated ${filePath}`);
        
    } catch (error) {
        console.error(`Error updating ${filePath}:`, error.message);
    }
}

// Process all HTML files
console.log('Updating HTML files with export functionality...');
htmlFiles.forEach(file => {
    const filePath = join(__dirname, file);
    if (existsSync(filePath)) {
        updateHtmlFile(filePath);
    } else {
        console.log(`⚠️ File not found: ${filePath}`);
    }
});

console.log('\nUpdate complete! All HTML files have been updated with export functionality.');
