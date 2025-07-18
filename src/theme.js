// Theme Management
const ThemeManager = {
  // Initialize theme from localStorage or system preference
  init: function() {
    // Check for saved theme preference or use system preference
    const savedTheme = localStorage.getItem('theme');
    const systemPrefersDark = window.matchMedia('(prefers-color-scheme: dark)').matches;
    
    // Set initial theme
    const initialTheme = savedTheme || (systemPrefersDark ? 'dark' : 'light');
    this.setTheme(initialTheme);
    
    // Listen for system theme changes
    window.matchMedia('(prefers-color-scheme: dark)').addListener(e => {
      if (!localStorage.getItem('theme')) {
        this.setTheme(e.matches ? 'dark' : 'light');
      }
    });
    
    // Set up theme toggle button if it exists
    const darkModeToggle = document.getElementById('dark-mode-toggle');
    if (darkModeToggle) {
      darkModeToggle.addEventListener('click', () => this.toggleTheme());
      this.updateThemeIcon(initialTheme);
    }
  },
  
  // Toggle between light and dark theme
  toggleTheme: function() {
    const currentTheme = document.documentElement.getAttribute('data-theme') || 'light';
    const newTheme = currentTheme === 'dark' ? 'light' : 'dark';
    this.setTheme(newTheme);
  },
  
  // Set the theme
  setTheme: function(theme) {
    // Save to localStorage
    localStorage.setItem('theme', theme);
    
    // Update the data-theme attribute
    document.documentElement.setAttribute('data-theme', theme);
    
    // Update the theme icon
    this.updateThemeIcon(theme);
    
    // Dispatch a custom event in case other scripts need to know about theme changes
    const event = new CustomEvent('themeChanged', { detail: { theme } });
    document.dispatchEvent(event);
  },
  
  // Update the theme toggle icon
  updateThemeIcon: function(theme) {
    const darkModeToggle = document.getElementById('dark-mode-toggle');
    if (!darkModeToggle) return;
    
    const icon = darkModeToggle.querySelector('i, span');
    if (!icon) return;
    
    if (theme === 'dark') {
      icon.className = 'fas fa-sun';
      darkModeToggle.setAttribute('aria-label', 'Switch to light mode');
    } else {
      icon.className = 'fas fa-moon';
      darkModeToggle.setAttribute('aria-label', 'Switch to dark mode');
    }
  }
};

// Initialize the theme manager when the DOM is loaded
document.addEventListener('DOMContentLoaded', () => {
  ThemeManager.init();
});
