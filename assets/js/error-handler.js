// Service Worker for handling offline and error states
if ('serviceWorker' in navigator) {
  window.addEventListener('load', () => {
    navigator.serviceWorker.register('/sw.js')
      .then(registration => {
        console.log('SW registered: ', registration);
      })
      .catch(registrationError => {
        console.log('SW registration failed: ', registrationError);
      });
  });
}

// Handle missing resources gracefully
document.addEventListener('DOMContentLoaded', function() {
  // Handle missing images
  const images = document.querySelectorAll('img');
  images.forEach(img => {
    img.addEventListener('error', function() {
      console.warn('Image failed to load:', this.src);
      // Replace with placeholder or hide
      this.style.display = 'none';
    });
  });

  // Handle missing videos
  const videos = document.querySelectorAll('video');
  videos.forEach(video => {
    video.addEventListener('error', function() {
      console.warn('Video failed to load:', this.src);
      // Replace video with gradient background
      const parent = this.parentElement;
      if (parent) {
        parent.style.background = 'linear-gradient(-45deg, #667eea, #764ba2, #667eea, #764ba2)';
        parent.style.backgroundSize = '400% 400%';
        parent.style.animation = 'gradientShift 15s ease infinite';
        this.style.display = 'none';
      }
    });
  });

  // Handle favicon errors
  const favicon = document.querySelector('link[rel="icon"]');
  if (favicon) {
    const testImg = new Image();
    testImg.onerror = function() {
      console.warn('Favicon not found, using default');
      favicon.href = 'data:image/svg+xml,<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 100 100"><text y=".9em" font-size="90">🤖</text></svg>';
    };
    testImg.src = favicon.href;
  }
});

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
