/**
 * Page Loader for TumzyTech
 * Tracks page loading progress and updates a visual indicator
 */

(function() {
  // Create loading progress bar
  const progressBar = document.createElement('div');
  progressBar.className = 'loading-progress-bar';
  progressBar.style.width = '0%';
  document.body.appendChild(progressBar);

  // Track loaded resources
  let loadedResources = 0;
  let totalResources = 0;
  
  // Resources to track (images, scripts, stylesheets, videos, and fetch requests)
  const imageElements = document.querySelectorAll('img');
  const scriptElements = document.querySelectorAll('script[src]');
  const linkElements = document.querySelectorAll('link[rel="stylesheet"]');
  const videoElements = document.querySelectorAll('video');
  const modelViewers = document.querySelectorAll('model-viewer');
  
  // Count total resources
  totalResources = imageElements.length + 
                  scriptElements.length + 
                  linkElements.length + 
                  videoElements.length +
                  modelViewers.length;
  
  // Minimum number of resources to track
  if (totalResources < 2) {
    totalResources = 2; // Page load + DOMContentLoaded
  }
  
  // Update progress function
  function updateProgress() {
    loadedResources++;
    const percentage = Math.min(100, Math.round((loadedResources / totalResources) * 100));
    progressBar.style.width = percentage + '%';
    
    // When all resources are loaded
    if (percentage >= 100) {
      setTimeout(() => {
        progressBar.style.opacity = '0';
        setTimeout(() => {
          if (progressBar.parentNode) {
            progressBar.parentNode.removeChild(progressBar);
          }
        }, 300);
      }, 500);
    }
  }
  
  // Track image loading
  imageElements.forEach(img => {
    if (img.complete) {
      updateProgress();
    } else {
      img.addEventListener('load', updateProgress);
      img.addEventListener('error', updateProgress);
    }
  });
  
  // Track script loading
  scriptElements.forEach(script => {
    if (script.async || script.defer || script.complete) {
      updateProgress();
    } else {
      script.addEventListener('load', updateProgress);
      script.addEventListener('error', updateProgress);
    }
  });
  
  // Track stylesheet loading
  linkElements.forEach(link => {
    // No reliable way to detect if stylesheets are loaded
    // Using timeout as a fallback
    setTimeout(updateProgress, 100);
  });
  
  // Track video loading
  videoElements.forEach(video => {
    if (video.readyState >= 3) { // HAVE_FUTURE_DATA
      updateProgress();
    } else {
      video.addEventListener('canplay', updateProgress);
      video.addEventListener('error', updateProgress);
    }
  });
  
  // Track 3D models
  modelViewers.forEach(model => {
    model.addEventListener('load', updateProgress);
    model.addEventListener('error', updateProgress);
  });
  
  // Add page load events
  window.addEventListener('DOMContentLoaded', updateProgress);
  window.addEventListener('load', updateProgress);
  
  // Set minimum progress immediately
  progressBar.style.width = '10%';
})();
