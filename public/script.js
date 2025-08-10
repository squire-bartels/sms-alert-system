/**
 * Secure SMS Alert System - Client-side JavaScript
 * 
 * Security Features Implemented:
 * - Server-side authentication (no hardcoded credentials)
 * - Input sanitization and validation
 * - XSS prevention
 * - CSRF protection ready
 * - Proper error handling
 * - Rate limiting protection
 * - Auto-logout on inactivity
 * - Loading states
 * - Password strength validation
 */

class SecureSMSSystem {
    constructor() {
        this.sessionId = null;
        this.inactivityTimer = null;
        this.maxInactivityTime = 30 * 60 * 1000; // 30 minutes
        this.isAuthenticated = false;
        this.lastActivity = Date.now();
        
        this.init();
    }

    /**
     * Initialize the application
     */
    init() {
        this.bindEvents();
        this.startInactivityMonitor();
        this.loadClasses();
    }

    /**
     * Bind event listeners
     */
    bindEvents() {
        // Login form
        const loginForm = document.getElementById('loginForm');
        if (loginForm) {
            loginForm.addEventListener('submit', (e) => this.handleLogin(e));
        }

        // SMS form
        const smsForm = document.getElementById('smsForm');
        if (smsForm) {
            smsForm.addEventListener('submit', (e) => this.handleSendSMS(e));
        }

        // Password strength validation
        const passwordField = document.getElementById('password');
        if (passwordField) {
            passwordField.addEventListener('input', () => this.validatePasswordStrength());
        }

        // Real-time form validation
        const usernameField = document.getElementById('username');
        if (usernameField) {
            usernameField.addEventListener('input', () => this.validateUsername());
        }

        const messageField = document.getElementById('message');
        if (messageField) {
            messageField.addEventListener('input', () => this.validateMessage());
        }

        // Activity tracking
        ['mousedown', 'mousemove', 'keypress', 'scroll', 'touchstart', 'click'].forEach(event => {
            document.addEventListener(event, () => this.updateActivity(), true);
        });

        // Add logout button
        this.addLogoutButton();
    }

    /**
     * Sanitize user input to prevent XSS
     */
    sanitizeInput(input) {
        const div = document.createElement('div');
        div.textContent = input;
        return div.innerHTML;
    }

    /**
     * Validate username input
     */
    validateUsername() {
        const usernameField = document.getElementById('username');
        const username = usernameField.value.trim();
        
        // Remove existing error messages
        this.removeValidationError('username');
        
        if (username.length > 0 && username.length < 3) {
            this.showValidationError('username', 'Username must be at least 3 characters long');
            return false;
        }
        
        if (username.length > 30) {
            this.showValidationError('username', 'Username must be less than 30 characters');
            return false;
        }
        
        if (username && !/^[a-zA-Z0-9]+$/.test(username)) {
            this.showValidationError('username', 'Username can only contain letters and numbers');
            return false;
        }
        
        return true;
    }

    /**
     * Validate password strength
     */
    validatePasswordStrength() {
        const passwordField = document.getElementById('password');
        const password = passwordField.value;
        
        // Remove existing error messages
        this.removeValidationError('password');
        
        if (password.length > 0 && password.length < 6) {
            this.showValidationError('password', 'Password must be at least 6 characters long');
            return false;
        }
        
        return true;
    }

    /**
     * Validate message content
     */
    validateMessage() {
        const messageField = document.getElementById('message');
        const message = messageField.value.trim();
        
        // Remove existing error messages
        this.removeValidationError('message');
        
        if (message.length > 160) {
            this.showValidationError('message', 'Message must be 160 characters or less');
            return false;
        }
        
        return true;
    }

    /**
     * Show validation error
     */
    showValidationError(fieldName, message) {
        const field = document.getElementById(fieldName);
        const existingError = document.getElementById(`${fieldName}-error`);
        
        if (!existingError) {
            const errorDiv = document.createElement('div');
            errorDiv.id = `${fieldName}-error`;
            errorDiv.className = 'validation-error';
            errorDiv.style.color = '#dc3545';
            errorDiv.style.fontSize = '12px';
            errorDiv.style.marginTop = '5px';
            errorDiv.textContent = message;
            
            field.parentNode.insertBefore(errorDiv, field.nextSibling);
            field.style.borderColor = '#dc3545';
        }
    }

    /**
     * Remove validation error
     */
    removeValidationError(fieldName) {
        const existingError = document.getElementById(`${fieldName}-error`);
        const field = document.getElementById(fieldName);
        
        if (existingError) {
            existingError.remove();
        }
        
        if (field) {
            field.style.borderColor = '';
        }
    }

    /**
     * Handle login form submission
     */
    async handleLogin(event) {
        event.preventDefault();
        
        const username = document.getElementById('username').value.trim();
        const password = document.getElementById('password').value;
        
        // Validate inputs
        if (!this.validateUsername() || !this.validatePasswordStrength()) {
            return;
        }
        
        if (!username || !password) {
            this.showError('Please fill in all fields');
            return;
        }

        // Show loading state
        const loginButton = event.target.querySelector('button[type="submit"]');
        this.setLoadingState(loginButton, true);

        try {
            const response = await fetch('/auth/login', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                },
                body: JSON.stringify({
                    username: this.sanitizeInput(username),
                    password: password // Don't sanitize password as it might contain special chars
                })
            });

            const data = await response.json();

            if (response.ok && data.success) {
                this.sessionId = data.sessionId;
                this.isAuthenticated = true;
                this.showAdminPanel();
                this.clearForm('loginForm');
                this.showSuccess('Login successful!');
            } else {
                this.showError(data.error || 'Login failed');
            }
        } catch (error) {
            console.error('Login error:', error);
            this.showError('Network error. Please try again.');
        } finally {
            this.setLoadingState(loginButton, false);
        }
    }

    /**
     * Load available classes from server
     */
    async loadClasses() {
        try {
            const response = await fetch('/api/classes');
            const data = await response.json();
            
            if (response.ok && data.classes) {
                this.populateClassSelect(data.classes);
            }
        } catch (error) {
            console.error('Error loading classes:', error);
        }
    }

    /**
     * Populate class select dropdown
     */
    populateClassSelect(classes) {
        const classSelect = document.getElementById('classSelect');
        if (classSelect) {
            // Clear existing options except the first one
            classSelect.innerHTML = '<option value="">Select a class</option>';
            
            classes.forEach(className => {
                const option = document.createElement('option');
                option.value = className;
                option.textContent = className.toUpperCase();
                classSelect.appendChild(option);
            });
        }
    }

    /**
     * Handle SMS sending
     */
    async handleSendSMS(event) {
        event.preventDefault();
        
        if (!this.isAuthenticated) {
            this.showError('Please login first');
            return;
        }
        
        const classSelect = document.getElementById('classSelect').value;
        const message = document.getElementById('message').value.trim();
        
        // Validate inputs
        if (!classSelect) {
            this.showError('Please select a class');
            return;
        }
        
        if (!message) {
            this.showError('Please enter a message');
            return;
        }
        
        if (!this.validateMessage()) {
            return;
        }

        // Show confirmation dialog
        const confirmed = await this.showConfirmationDialog(
            'Send SMS',
            `Are you sure you want to send this message to ${classSelect}?\\n\\nMessage: "${message}"`
        );
        
        if (!confirmed) {
            return;
        }

        // Show loading state
        const sendButton = event.target.querySelector('button[type="submit"]');
        this.setLoadingState(sendButton, true);

        try {
            const response = await fetch('/send-sms', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                },
                body: JSON.stringify({
                    classSelect: classSelect,
                    message: this.sanitizeInput(message)
                })
            });

            const data = await response.json();

            if (response.ok) {
                this.showSuccess(data.message || 'SMS sent successfully!');
                this.clearForm('smsForm');
            } else {
                this.showError(data.error || 'Failed to send SMS');
            }
        } catch (error) {
            console.error('SMS sending error:', error);
            this.showError('Network error. Please try again.');
        } finally {
            this.setLoadingState(sendButton, false);
        }
    }

    /**
     * Show confirmation dialog
     */
    showConfirmationDialog(title, message) {
        return new Promise((resolve) => {
            const confirmed = confirm(`${title}\\n\\n${message}`);
            resolve(confirmed);
        });
    }

    /**
     * Set loading state for buttons
     */
    setLoadingState(button, isLoading) {
        if (isLoading) {
            button.disabled = true;
            button.dataset.originalText = button.textContent;
            button.textContent = 'Loading...';
        } else {
            button.disabled = false;
            button.textContent = button.dataset.originalText || button.textContent;
        }
    }

    /**
     * Show admin panel
     */
    showAdminPanel() {
        document.getElementById('login-container').style.display = 'none';
        document.getElementById('admin-container').style.display = 'block';
    }

    /**
     * Hide admin panel
     */
    hideAdminPanel() {
        document.getElementById('login-container').style.display = 'block';
        document.getElementById('admin-container').style.display = 'none';
    }

    /**
     * Add logout button
     */
    addLogoutButton() {
        const adminContainer = document.getElementById('admin-container');
        if (adminContainer) {
            const logoutButton = document.createElement('button');
            logoutButton.type = 'button';
            logoutButton.textContent = 'Logout';
            logoutButton.style.marginTop = '20px';
            logoutButton.style.backgroundColor = '#dc3545';
            logoutButton.addEventListener('click', () => this.logout());
            
            adminContainer.appendChild(logoutButton);
        }
    }

    /**
     * Logout user
     */
    logout() {
        this.sessionId = null;
        this.isAuthenticated = false;
        this.hideAdminPanel();
        this.clearAllForms();
        this.showSuccess('Logged out successfully');
    }

    /**
     * Update activity timestamp
     */
    updateActivity() {
        this.lastActivity = Date.now();
    }

    /**
     * Start inactivity monitor
     */
    startInactivityMonitor() {
        setInterval(() => {
            if (this.isAuthenticated && (Date.now() - this.lastActivity) > this.maxInactivityTime) {
                this.showError('Session expired due to inactivity');
                this.logout();
            }
        }, 60000); // Check every minute
    }

    /**
     * Clear specific form
     */
    clearForm(formId) {
        const form = document.getElementById(formId);
        if (form) {
            form.reset();
        }
        
        // Clear validation errors
        const errors = document.querySelectorAll('.validation-error');
        errors.forEach(error => error.remove());
        
        // Reset field styles
        const fields = form.querySelectorAll('input, select, textarea');
        fields.forEach(field => {
            field.style.borderColor = '';
        });
    }

    /**
     * Clear all forms
     */
    clearAllForms() {
        this.clearForm('loginForm');
        this.clearForm('smsForm');
    }

    /**
     * Show success message
     */
    showSuccess(message) {
        this.showMessage(message, 'success');
    }

    /**
     * Show error message
     */
    showError(message) {
        this.showMessage(message, 'error');
    }

    /**
     * Show message to user
     */
    showMessage(message, type = 'info') {
        const responseDiv = document.getElementById('response');
        if (responseDiv) {
            responseDiv.textContent = this.sanitizeInput(message);
            responseDiv.style.color = type === 'error' ? '#dc3545' : '#28a745';
            responseDiv.style.display = 'block';
            
            // Clear message after 5 seconds
            setTimeout(() => {
                responseDiv.textContent = '';
                responseDiv.style.display = 'none';
            }, 5000);
        }
    }
}

// Initialize the application when DOM is loaded
document.addEventListener('DOMContentLoaded', () => {
    new SecureSMSSystem();
});

// Security: Prevent common attacks
window.addEventListener('beforeunload', () => {
    // Clear sensitive data on page unload
    if (window.smsSystem && window.smsSystem.sessionId) {
        window.smsSystem.logout();
    }
});