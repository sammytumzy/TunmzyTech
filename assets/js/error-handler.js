/**
 * Enhanced Error Handler for TumzyTech
 * Handles missing resources, offline states, and provides graceful fallbacks
 */

class ErrorHandler {
  constructor() {
    this.retryAttempts = new Map();
    this.maxRetries = 3;
    this.initializeHandlers();
  }

  initializeHandlers() {
    // Register Service Worker
    this.registerServiceWorker();
    
    // Handle global errors
    window.addEventListener('error', this.handleGlobalError.bind(this));
    window.addEventListener('unhandledrejection', this.handleUnhandledRejection.bind(this));
    
    // Handle DOM content loaded
    if (document.readyState === 'loading') {
      document.addEventListener('DOMContentLoaded', () => this.initializeDOMHandlers());
    } else {
      this.initializeDOMHandlers();
    }
  }

  async registerServiceWorker() {
    if ('serviceWorker' in navigator) {
      try {
        // Adjust path for GitHub Pages deployment and local development
        const swPath = window.location.hostname === 'localhost' || window.location.hostname === '127.0.0.1' ? '/sw.js' : '/TunmzyTech/sw.js';
        const registration = await navigator.serviceWorker.register(swPath);
        console.log('Service Worker registered successfully:', registration.scope);
        
        // Check for updates
        registration.addEventListener('updatefound', () => {
          console.log('Service Worker update found');
        });
        
      } catch (error) {
        console.log('Service Worker registration failed:', error);
      }
    }
  }

  initializeDOMHandlers() {
    // Handle missing images
    this.handleMissingImages();
    
    // Handle missing videos
    this.handleMissingVideos();
    
    // Handle favicon
    this.handleFavicon();
    
    // Handle CSS loading failures
    this.handleStylesheets();
    
    // Handle script loading failures
    this.handleScripts();
  }

  handleMissingImages() {
    const images = document.querySelectorAll('img');
    images.forEach(img => {
      if (!img.hasAttribute('data-error-handled')) {
        img.setAttribute('data-error-handled', 'true');
        
        img.addEventListener('error', () => {
          console.log('Image failed to load, using fallback:', img.src);
          
          // Create a gradient placeholder
          const canvas = document.createElement('canvas');
          canvas.width = img.width || 200;
          canvas.height = img.height || 200;
          const ctx = canvas.getContext('2d');
          
          // Create gradient
          const gradient = ctx.createLinearGradient(0, 0, canvas.width, canvas.height);
          gradient.addColorStop(0, '#9333ea');
          gradient.addColorStop(1, '#4c1d95');
          
          ctx.fillStyle = gradient;
          ctx.fillRect(0, 0, canvas.width, canvas.height);
          
          // Add robot emoji
          ctx.font = '60px Arial';
          ctx.textAlign = 'center';
          ctx.fillStyle = 'white';
          ctx.fillText('🤖', canvas.width / 2, canvas.height / 2 + 20);
          
          img.src = canvas.toDataURL();
          img.alt = 'TumzyTech Placeholder';
        });
      }
    });
  }

  handleMissingVideos() {
    const videos = document.querySelectorAll('video');
    videos.forEach(video => {
      if (!video.hasAttribute('data-error-handled')) {
        video.setAttribute('data-error-handled', 'true');
        
        video.addEventListener('error', () => {
          console.log('Video failed to load, replacing with gradient:', video.src);
          
          const parent = video.parentElement;
          if (parent) {
            // Remove video and replace with animated gradient
            video.style.display = 'none';
            parent.style.background = 'linear-gradient(270deg, #7e22ce, #4c1d95, #9333ea, #7e22ce)';
            parent.style.backgroundSize = '400% 400%';
            parent.style.animation = 'dynamicPurple 10s ease infinite';
          }
        });
      }
    });
  }

  handleFavicon() {
    const favicon = document.querySelector('link[rel="icon"]');
    if (favicon) {
      const testImg = new Image();
      testImg.onerror = () => {
        console.log('Favicon not found, using emoji fallback');
        favicon.href = 'data:image/svg+xml,<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 100 100"><text y=".9em" font-size="90">🤖</text></svg>';
      };
      testImg.src = favicon.href;
    }
  }

  handleStylesheets() {
    const stylesheets = document.querySelectorAll('link[rel="stylesheet"]');
    stylesheets.forEach(link => {
      link.addEventListener('error', () => {
        console.log('Stylesheet failed to load:', link.href);
        
        // Apply basic fallback styles
        if (link.href.includes('tailwind')) {
          this.applyFallbackCSS();
        }
      });
    });
  }

  handleScripts() {
    const scripts = document.querySelectorAll('script[src]');
    scripts.forEach(script => {
      script.addEventListener('error', () => {
        console.log('Script failed to load:', script.src);
        
        // Handle specific script failures
        if (script.src.includes('lottie')) {
          console.log('Lottie animation unavailable, hiding animation containers');
          const animationContainers = document.querySelectorAll('[id*="animation"]');
          animationContainers.forEach(container => {
            container.style.display = 'none';
          });
        }
      });
    });
  }

  applyFallbackCSS() {
    const fallbackCSS = `
      <style id="fallback-styles">
        * { box-sizing: border-box; margin: 0; padding: 0; }
        body { font-family: Arial, sans-serif; background: #4c1d95; color: white; }
        .container { max-width: 1200px; margin: 0 auto; padding: 20px; }
        .chat-container { max-width: 800px; margin: 0 auto; background: rgba(0,0,0,0.3); padding: 20px; border-radius: 10px; }
        .chat-window { height: 400px; overflow-y: auto; background: rgba(0,0,0,0.2); padding: 15px; border-radius: 8px; margin-bottom: 15px; }
        .chat-input { display: flex; gap: 10px; }
        .chat-input input { flex: 1; padding: 10px; border: none; border-radius: 5px; background: #333; color: white; }
        .chat-input button { padding: 10px 20px; background: #9333ea; color: white; border: none; border-radius: 5px; cursor: pointer; }
        .chat-message { margin-bottom: 10px; padding: 8px; border-radius: 5px; }
        .chat-message.bot { background: rgba(147,51,234,0.3); }
        .chat-message.user { background: rgba(0,0,0,0.3); text-align: right; }
        button { cursor: pointer; transition: all 0.3s ease; }
        button:hover { opacity: 0.8; transform: scale(1.05); }
      </style>
    `;
    
    document.head.insertAdjacentHTML('beforeend', fallbackCSS);
  }

  handleGlobalError(event) {
    console.error('Global error caught:', event.error);
    
    // Don't show errors for expected missing resources
    const ignoredErrors = [
      'auth/status',
      'favicon.ico',
      'background-video.mp4',
      'Loading chunk',
      'Script error'
    ];
    
    const shouldIgnore = ignoredErrors.some(ignored => 
      event.message?.includes(ignored) || event.error?.message?.includes(ignored)
    );
    
    if (!shouldIgnore) {
      this.showErrorNotification('An unexpected error occurred. Please refresh the page if issues persist.');
    }
  }

  handleUnhandledRejection(event) {
    console.error('Unhandled promise rejection:', event.reason);
    
    // Prevent default handling for known issues
    if (event.reason?.message?.includes('Pi SDK') || event.reason?.message?.includes('auth')) {
      event.preventDefault();
      return;
    }
    
    this.showErrorNotification('A network error occurred. Please check your connection.');
  }

  showErrorNotification(message, type = 'error') {
    // Avoid showing too many notifications
    if (document.querySelector('.error-notification')) {
      return;
    }
    
    const notification = document.createElement('div');
    notification.className = `error-notification fixed top-4 right-4 p-4 rounded-lg text-white font-medium z-50 transform transition-all duration-300 ${
      type === 'error' ? 'bg-red-600' : 'bg-yellow-600'
    }`;
    notification.textContent = message;
    notification.style.transform = 'translateX(100%)';
    
    document.body.appendChild(notification);
    
    // Animate in
    setTimeout(() => {
      notification.style.transform = 'translateX(0)';
    }, 100);
    
    // Auto remove
    setTimeout(() => {
      notification.style.transform = 'translateX(100%)';
      setTimeout(() => {
        if (notification.parentNode) {
          notification.parentNode.removeChild(notification);
        }
      }, 300);
    }, 5000);
  }

  // Network status monitoring
  initNetworkMonitoring() {
    window.addEventListener('online', () => {
      console.log('Connection restored');
      this.showErrorNotification('Connection restored!', 'success');
    });
    
    window.addEventListener('offline', () => {
      console.log('Connection lost');
          this.showErrorNotification('Connection lost. Some features may be unavailable.', 'warning');
    });
  }
}

// Initialize error handler
new ErrorHandler();

// Add CSS for gradient animation if not present
if (!document.getElementById('gradient-animation-styles')) {
  const style = document.createElement('style');
  style.id = 'gradient-animation-styles';
  style.textContent = `
    @keyframes gradientShift {
      0% { background-position: 0% 50%; }
      50% { background-position: 100% 50%; }
      100% { background-position: 0% 50%; }
    }
  `;
  document.head.appendChild(style);
}
