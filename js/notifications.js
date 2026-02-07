/**
 * Notification System for Vertex Design
 * Replaces native browser alerts with premium glassmorphism toasts.
 */

class NotificationManager {
    constructor() {
        this.container = null;
        this.init();
    }

    init() {
        // Create container if it doesn't exist
        this.container = document.getElementById('notification-container');
        if (!this.container) {
            this.container = document.createElement('div');
            this.container.id = 'notification-container';
            document.body.appendChild(this.container);
        }
    }

    /**
     * Show a notification toast
     * @param {string} message - The message to display
     * @param {string} type - 'success', 'error', 'warning', 'info'
     * @param {number} duration - Duration in milliseconds
     */
    show(message, type = 'info', duration = 5000) {
        const toast = document.createElement('div');
        toast.className = `notification ${type}`;

        const icons = {
            success: 'fa-check-circle',
            error: 'fa-exclamation-circle',
            warning: 'fa-exclamation-triangle',
            info: 'fa-info-circle'
        };

        const titles = {
            success: 'Success',
            error: 'Error',
            warning: 'Warning',
            info: 'Information'
        };

        toast.innerHTML = `
            <div class="notification-icon">
                <i class="fas ${icons[type] || icons.info}"></i>
            </div>
            <div class="notification-content">
                <span class="notification-title">${titles[type]}</span>
                <span class="notification-message">${message}</span>
            </div>
            <div class="notification-close">
                <i class="fas fa-times"></i>
            </div>
            <div class="notification-progress">
                <div class="notification-progress-bar"></div>
            </div>
        `;

        this.container.appendChild(toast);

        // Animate in
        setTimeout(() => toast.classList.add('show'), 10);

        // Progress bar animation
        const progressBar = toast.querySelector('.notification-progress-bar');
        progressBar.style.width = '100%';
        progressBar.style.transitionDuration = `${duration}ms`;
        setTimeout(() => progressBar.style.width = '0%', 10);

        // Close button
        const closeBtn = toast.querySelector('.notification-close');
        closeBtn.onclick = () => this.hide(toast);

        // Auto hide
        const timeoutId = setTimeout(() => this.hide(toast), duration);
        toast.dataset.timeoutId = timeoutId;
    }

    hide(toast) {
        if (toast.dataset.timeoutId) {
            clearTimeout(toast.dataset.timeoutId);
        }
        toast.classList.add('hide');
        toast.classList.remove('show');

        // Remove from DOM after animation
        toast.addEventListener('transitionend', () => {
            if (toast.parentNode) {
                toast.remove();
            }
        });
    }
}

// Global instance
const notifications = new NotificationManager();

/**
 * Universal showNotification function
 */
function showNotification(message, type = 'info', duration = 5000) {
    notifications.show(message, type, duration);
}

// Overriding window.alert for legacy support (optional but helpful)
// window.alert = (msg) => showNotification(msg, 'info');
