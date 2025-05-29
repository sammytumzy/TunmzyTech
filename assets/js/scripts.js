/* Moved all JavaScript from index.html to this file */

// Sidebar open and close functionality
const sideBar = document.querySelector('.sidebar');
const menuButton = document.querySelector('.menu-icon');
const closeButton = document.querySelector('.close-icon');

menuButton?.addEventListener("click", function() {
    sideBar?.classList.remove('close-sidebar');
    sideBar?.classList.add('open-sidebar');
});

closeButton?.addEventListener("click", function() {
    sideBar?.classList.remove('open-sidebar');
    sideBar?.classList.add('close-sidebar');
});

// AI Particle System for Background with lazy loading
function initParticleBackground() {
  const chatCanvas = document.getElementById('particles-bg');
  if (!chatCanvas) return;

  // Only initialize particles when visible in viewport
  function startParticleSystem() {
    // Set up context
    const chatCtx = chatCanvas.getContext('2d');
    if (!chatCtx) {
      console.error("Could not get 2D context for particles canvas");
      return;
    }
    
    // Set initial dimensions
    let chatW = chatCanvas.width = window.innerWidth;
    let chatH = chatCanvas.height = window.innerHeight;
    let chatParticles = [];
    let animationRunning = false;
    const chatPCount = 50;
    const chatMaxDist = 120;

    function randChatColor() {
      const colors = ['#38bdf8', '#a21caf', '#f472b6', '#9333ea', '#2563eb'];
      return colors[Math.floor(Math.random() * colors.length)];
    }

    function ChatParticle() {
      this.x = Math.random() * chatW;
      this.y = Math.random() * chatH;
      this.vx = (Math.random() - 0.5) * 1.2;
      this.vy = (Math.random() - 0.5) * 1.2;
      this.radius = 1.5 + Math.random() * 2;
      this.color = randChatColor();
    }

    ChatParticle.prototype.draw = function () {
      chatCtx.beginPath();
      chatCtx.arc(this.x, this.y, this.radius, 0, Math.PI * 2, false);
      chatCtx.fillStyle = this.color + '88';
      chatCtx.fill();
    };

    function drawChatLines(a, b) {
      const dist = Math.hypot(a.x - b.x, a.y - b.y);
      if (dist < chatMaxDist) {
        chatCtx.beginPath();
        chatCtx.moveTo(a.x, a.y);
        chatCtx.lineTo(b.x, b.y);
        chatCtx.strokeStyle = '#ffffff22';
        chatCtx.lineWidth = 0.8;
        chatCtx.stroke();
      }
    }

    function animateChatParticles() {
      // Skip animation if hidden to save resources
      if (!document.hidden && animationRunning) {
        chatCtx.clearRect(0, 0, chatW, chatH);
        for (let i = 0; i < chatParticles.length; i++) {
          let p = chatParticles[i];
          p.x += p.vx;
          p.y += p.vy;
          if (p.x < 0 || p.x > chatW) p.vx *= -1;
          if (p.y < 0 || p.y > chatH) p.vy *= -1;
          p.draw();
          for (let j = i + 1; j < chatParticles.length; j++) {
            drawChatLines(p, chatParticles[j]);
          }
        }
        requestAnimationFrame(animateChatParticles);
      }
    }

    function initChatParticles() {
      chatParticles = [];
      for (let i = 0; i < chatPCount; i++) {
        chatParticles.push(new ChatParticle());
      }
      
      // Start the animation
      animationRunning = true;
      animateChatParticles();
      console.log('Particle background initialized');
    }

    // Handle visibility changes to save resources
    document.addEventListener('visibilitychange', () => {
      animationRunning = !document.hidden;
      if (animationRunning) {
        animateChatParticles(); // Restart animation when tab becomes visible again
      }
    });

    // Handle window resize
    window.addEventListener('resize', () => {
      chatW = chatCanvas.width = window.innerWidth;
      chatH = chatCanvas.height = window.innerHeight;
      
      // Re-create the particles for new dimensions
      if (animationRunning) {
        initChatParticles();
      }
    });

    // Start the particle system
    initChatParticles();
  }

  // Use IntersectionObserver to detect when canvas is visible
  const observer = new IntersectionObserver((entries) => {
    entries.forEach(entry => {
      // When canvas enters viewport
      if (entry.isIntersecting) {
        startParticleSystem();
        observer.unobserve(chatCanvas); // Stop observing once initialized
      }
    });
  }, {
    threshold: 0.1 // Start when 10% of the canvas is visible
  });

  // Start observing
  observer.observe(chatCanvas);
  
  // As a fallback, also initialize after a short delay
  setTimeout(() => {
    if (document.contains(chatCanvas)) {
      startParticleSystem();
      observer.unobserve(chatCanvas);
    }
  }, 1000); // 1 second delay
}

// Initialize particle background after DOM is loaded
if (document.readyState === 'loading') {
  document.addEventListener('DOMContentLoaded', initParticleBackground);
} else {
  initParticleBackground();
}

// Auth Modal Logic
const authModal = document.getElementById('authModal');
const authModalLink = document.getElementById('authModalLink');
const closeAuthModal = document.getElementById('closeAuthModal');
const authModalTitle = document.getElementById('authModalTitle');
const signInTabButton = document.getElementById('signInTabButton');
const signUpTabButton = document.getElementById('signUpTabButton');
const signInForm = document.getElementById('signInForm');
const signUpForm = document.getElementById('signUpForm');
const signInError = document.getElementById('signInError');
const signUpError = document.getElementById('signUpError');

if (authModalLink) {
  authModalLink.addEventListener('click', (e) => {
    e.preventDefault();
    authModal.classList.remove('hidden');
    // Default to Sign In tab
    authModalTitle.textContent = 'Sign In';
    signInTabButton.classList.add('border-purple-500');
    signInTabButton.classList.remove('text-gray-400', 'hover:text-white');
    signUpTabButton.classList.remove('border-purple-500');
    signUpTabButton.classList.add('text-gray-400', 'hover:text-white');
    signInForm.classList.remove('hidden');
    signUpForm.classList.add('hidden');
    signInError.textContent = '';
    signUpError.textContent = '';
  });
}

if (closeAuthModal) {
  closeAuthModal.addEventListener('click', () => {
    authModal.classList.add('hidden');
  });
}

// Close modal if clicked outside the content
if (authModal) {
  authModal.addEventListener('click', (e) => {
    if (e.target === authModal) {
      authModal.classList.add('hidden');
    }
  });
}

if (signInTabButton) {
  signInTabButton.addEventListener('click', () => {
    authModalTitle.textContent = 'Sign In';
    signInTabButton.classList.add('border-purple-500');
    signInTabButton.classList.remove('text-gray-400', 'hover:text-white');
    signUpTabButton.classList.remove('border-purple-500');
    signUpTabButton.classList.add('text-gray-400', 'hover:text-white');
    signInForm.classList.remove('hidden');
    signUpForm.classList.add('hidden');
    signInError.textContent = '';
    signUpError.textContent = '';
  });
}

if (signUpTabButton) {
  signUpTabButton.addEventListener('click', () => {
    authModalTitle.textContent = 'Sign Up';
    signUpTabButton.classList.add('border-purple-500');
    signUpTabButton.classList.remove('text-gray-400', 'hover:text-white');
    signInTabButton.classList.remove('border-purple-500');
    signInTabButton.classList.add('text-gray-400', 'hover:text-white');
    signUpForm.classList.remove('hidden');
    signInForm.classList.add('hidden');
    signInError.textContent = '';
    signUpError.textContent = '';
  });
}

if (signInForm) {
  signInForm.addEventListener('submit', async (e) => {
    e.preventDefault();
    signInError.textContent = '';
    const formData = new FormData(signInForm);
    const data = Object.fromEntries(formData.entries());

    try {
      const response = await fetch('/auth/login', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(data),
      });
      const result = await response.json();
      if (response.ok) {
        signInError.textContent = 'Sign in successful! Redirecting...';
        window.location.reload(); // Or redirect to a dashboard page
      } else {
        signInError.textContent = result.message || 'Sign in failed. Please try again.';
      }
    } catch (error) {
      console.error('Sign in error:', error);
      signInError.textContent = 'An error occurred. Please try again.';
    }
  });
}

if (signUpForm) {
  signUpForm.addEventListener('submit', async (e) => {
    e.preventDefault();
    signUpError.textContent = '';
    const formData = new FormData(signUpForm);
    const data = Object.fromEntries(formData.entries());

    try {
      const response = await fetch('/auth/register', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(data),
      });
      const result = await response.json();
      if (response.ok) {
        signUpError.textContent = 'Sign up successful! Please sign in.';
        // Switch to sign-in tab
        authModalTitle.textContent = 'Sign In';
        signInTabButton.classList.add('border-purple-500');
        signInTabButton.classList.remove('text-gray-400', 'hover:text-white');
        signUpTabButton.classList.remove('border-purple-500');
        signUpTabButton.classList.add('text-gray-400', 'hover:text-white');
        signInForm.classList.remove('hidden');
        signUpForm.classList.add('hidden');
        signInError.textContent = ''; // Clear sign-in error too
        document.getElementById('signInEmail').focus(); // Focus on sign-in email
      } else {
        signUpError.textContent = result.message || 'Sign up failed. Please try again.';
      }
    } catch (error) {
      console.error('Sign up error:', error);
      signUpError.textContent = 'An error occurred. Please try again.';
    }
  });
}

// Real-time AI Market Trend Graph
const marketChartCanvas = document.getElementById('marketChart');
if (marketChartCanvas) {
  const marketChartCtx = marketChartCanvas.getContext('2d');

  // Initial data for the chart
  const marketData = {
    labels: ['2022Q1', '2022Q2', '2022Q3', '2022Q4', '2023Q1', '2023Q2', '2023Q3'],
    datasets: [{
      label: 'AI Adoption Index',
      data: [16, 23, 27, 31, 45, 51, 63],
      fill: true,
      tension: 0.4,
      backgroundColor: 'rgba(37,99,235,0.28)',
      borderColor: '#38bdf8',
      pointBackgroundColor: '#a21caf',
      pointBorderColor: '#fff',
      pointRadius: 4,
      borderWidth: 3
    }]
  };

  // Chart configuration
  const marketChartConfig = {
    type: 'line',
    data: marketData,
    options: {
      plugins: {
        legend: { display: true, labels: { color: '#fff', font: { size: 14, family: 'Inter' } } },
      },
      scales: {
        x: { grid: { color: '#4f46e5', drawOnChartArea: false }, ticks: { color: '#e0e7ef' } },
        y: { grid: { color: '#47556911' }, ticks: { color: '#e0e7ef' } }
      }
    }
  };

  // Create the chart
  const marketChart = new Chart(marketChartCtx, marketChartConfig);

  // Simulate real-time data updates
  function updateMarketData() {
    const newLabel = `2023Q${Math.floor(Math.random() * 4) + 1}`;
    const newValue = Math.floor(Math.random() * 100) + 20;

    // Add new data point
    marketData.labels.push(newLabel);
    marketData.datasets[0].data.push(newValue);

    // Remove old data if exceeding 10 points
    if (marketData.labels.length > 10) {
      marketData.labels.shift();
      marketData.datasets[0].data.shift();
    }

    // Update the chart
    marketChart.update();
  }

  // Update the chart every 5 seconds
  setInterval(updateMarketData, 5000);
}

// Optimize animations for better performance
const optimizeAnimations = () => {
  document.querySelectorAll('.animated').forEach((el) => {
    el.style.willChange = 'transform, opacity';
  });
};

optimizeAnimations();

// Add scroll-triggered animations for sections
const sections = document.querySelectorAll('.section');

const revealSection = () => {
  sections.forEach((section) => {
    const rect = section.getBoundingClientRect();
    if (rect.top < window.innerHeight * 0.8) {
      section.classList.add('visible');
    }
  });
};

window.addEventListener('scroll', revealSection);
window.addEventListener('load', revealSection);

// Lazy load video background
function initVideoBackground() {
  // Check if video background container already exists
  let videoBackground = document.getElementById('video-background');
  
  if (!videoBackground) {
    // Create a new video background container if it doesn't exist
    videoBackground = document.createElement('div');
    videoBackground.id = 'video-background';
    videoBackground.style.position = 'fixed';
    videoBackground.style.top = '0';
    videoBackground.style.left = '0';
    videoBackground.style.width = '100%';
    videoBackground.style.height = '100%';
    videoBackground.style.zIndex = '-1';
    videoBackground.style.overflow = 'hidden';
    videoBackground.style.display = 'none'; // Hide initially
    document.body.appendChild(videoBackground);
  }
  
  // Create gradient background instead of video
function initGradientBackground() {
  const videoBackground = document.getElementById('video-background');
  if (!videoBackground) return;
  
  // Create animated gradient background
  videoBackground.style.background = 'linear-gradient(-45deg, #667eea, #764ba2, #667eea, #764ba2)';
  videoBackground.style.backgroundSize = '400% 400%';
  videoBackground.style.animation = 'gradientShift 15s ease infinite';
  videoBackground.style.display = 'block';
  
  // Add CSS animation if not already present
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
  
  console.log('Gradient background initialized successfully');
}

// Initialize gradient background when page loads
window.addEventListener('load', initGradientBackground);

// Enhanced lazy loading for all media elements
function setupLazyLoading() {
  // Set up Intersection Observer to load elements when they're about to enter viewport
  const loadingObserver = new IntersectionObserver((entries, observer) => {
    entries.forEach(entry => {
      if (entry.isIntersecting) {
        const element = entry.target;
        
        // Handle different element types
        if (element.tagName === 'IMG' && element.dataset.src) {
          element.src = element.dataset.src;
          element.classList.add('loaded');
          
          element.addEventListener('load', () => {
            console.log(`Image loaded successfully: ${element.dataset.src}`);
          });
          
          element.addEventListener('error', () => {
            console.error(`Failed to load image: ${element.dataset.src}`);
          });
          
        } else if (element.tagName === 'VIDEO' && !element.played.length) {
          // Lazy load the video
          element.load();
          element.play().catch(err => console.error('Video autoplay error:', err));
          
          element.addEventListener('canplaythrough', () => {
            console.log('Video loaded successfully');
            element.classList.add('loaded');
          });
          
        } else if (element.tagName === 'MODEL-VIEWER' && element.dataset.src) {
          element.src = element.dataset.src;
          element.classList.add('loading');
          
          element.addEventListener('load', () => {
            console.log(`3D Model loaded successfully: ${element.dataset.src}`);
            element.classList.remove('loading');
            element.classList.add('loaded');
          });
          
          element.addEventListener('error', () => {
            console.error(`Failed to load 3D model: ${element.dataset.src}`);
            element.classList.remove('loading');
          });
        }
        
        // Stop observing this element after loading
        observer.unobserve(element);
      }
    });
  }, {
    rootMargin: '200px', // Load when element is 200px away from viewport
    threshold: 0.01
  });
  
  // Observe all images, videos, and model-viewers that have data-src
  document.querySelectorAll('img[data-src], video, model-viewer[data-src]').forEach(element => {
    // Add a placeholder/loading state
    if (element.tagName === 'IMG') {
      element.classList.add('lazy-image');
      // You could set a placeholder image here if needed
      // element.src = 'assets/pictures/placeholder.png';
    }
    
    if (element.tagName === 'MODEL-VIEWER') {
      // Add loading indicator for model-viewer
      const loadingIndicator = document.createElement('div');
      loadingIndicator.className = 'loading-indicator';
      loadingIndicator.textContent = 'Loading 3D Model...';
      element.appendChild(loadingIndicator);
    }
    
    // Observe element
    loadingObserver.observe(element);
  });
  
  // Also find and enhance existing media elements that don't have data-src
  document.querySelectorAll('img:not([data-src]), video source, model-viewer:not([data-src])').forEach(element => {
    element.addEventListener('load', () => {
      console.log(`${element.tagName} loaded successfully.`);
    });
    
    element.addEventListener('error', (e) => {
      console.error(`Failed to load ${element.tagName}:`, e);
    });
  });
}

// Set up lazy loading once DOM is loaded
document.addEventListener('DOMContentLoaded', setupLazyLoading);

// Add error handling for 3D model loading
const modelViewer = document.querySelector('model-viewer');
if (modelViewer) {
  modelViewer.addEventListener('error', (event) => {
    console.error('Error loading 3D model:', event);
    alert('The 3D model could not be loaded. Please check your internet connection or try again later.');
  });
}

function initLogoCanvas() {  // Create a new canvas element for the 3D logo
  const logoCanvas = document.createElement('canvas');
  logoCanvas.id = 'logo-canvas';
  logoCanvas.width = 180;
  logoCanvas.height = 160;
  logoCanvas.style.display = 'block';
  
  // Reposition the 3D logo under the TumzyTech header
  const header = document.querySelector('nav');
  if (!header) return; // Safety check
    const logoCanvasContainer = document.createElement('div');  logoCanvasContainer.style.position = 'relative';
  logoCanvasContainer.style.margin = '0 auto';  
  logoCanvasContainer.style.width = '180px';
  logoCanvasContainer.style.height = '160px';
  logoCanvasContainer.style.display = 'flex';
  logoCanvasContainer.style.justifyContent = 'center';
  logoCanvasContainer.style.alignItems = 'center';
  logoCanvasContainer.style.marginTop = '-80px'; // Move the logo higher up
  logoCanvasContainer.appendChild(logoCanvas);
  header.insertAdjacentElement('afterend', logoCanvasContainer);
  
  // Set up Three.js renderer
  const logoRenderer = new THREE.WebGLRenderer({ canvas: logoCanvas, antialias: true, alpha: true });
  logoRenderer.setSize(logoCanvas.clientWidth, logoCanvas.clientHeight);
  
  const logoScene = new THREE.Scene();
  const logoCamera = new THREE.PerspectiveCamera(75, logoCanvas.clientWidth / logoCanvas.clientHeight, 0.1, 1000);
  logoCamera.position.z = 2;

  // Add lighting to the logo scene
  const logoLight = new THREE.DirectionalLight(0xffffff, 1);
  logoLight.position.set(5, 5, 5).normalize();
  logoScene.add(logoLight);

  let logoModel = null;

  const logoLoader = new THREE.GLTFLoader();
  logoLoader.load('assets/pictures/flying.glb', function (gltf) {
    logoModel = gltf.scene;
    logoScene.add(logoModel);

    // Adjust the model's position and scale for the logo
    logoModel.position.set(0, -0.5, 0);
    logoModel.scale.set(0.75, 0.75, 0.75);

    // Animation loop for the logo
    function animateLogo() {
      requestAnimationFrame(animateLogo);
      if (logoModel) {
        logoModel.rotation.y += 0.01; // Rotate the model for animation
      }
      logoRenderer.render(logoScene, logoCamera);
    }
    
    animateLogo();

  });

}

document.addEventListener('DOMContentLoaded', () => {
  const hamburger = document.querySelector('.hamburger');
  const navLinks = document.querySelector('.nav-links');

  if (hamburger && navLinks) {
    hamburger.addEventListener('click', () => {
      navLinks.classList.toggle('active');
      hamburger.classList.toggle('active'); // Toggle active class on hamburger for animation
      console.log('Hamburger clicked, nav-links active:', navLinks.classList.contains('active'));
    });

    // Add event listener to close menu when clicking outside
    document.addEventListener('click', (event) => {
      const isClickInsideNav = navLinks.contains(event.target);
      const isClickOnHamburger = hamburger.contains(event.target);

      if (navLinks.classList.contains('active') && !isClickInsideNav && !isClickOnHamburger) {
        navLinks.classList.remove('active');
        hamburger.classList.remove('active');
        console.log('Clicked outside, nav-links active:', navLinks.classList.contains('active'));
      }
    });
  }

  // Parallax effect (ensure elements exist)
  const parallaxElements = document.querySelectorAll(".parallax");
  if (parallaxElements.length > 0) {
    document.addEventListener("mousemove", (event) => {
        const x = event.clientX / window.innerWidth - 0.5;
        const y = event.clientY / window.innerHeight - 0.5;

        parallaxElements.forEach((element) => {
            const speed = element.getAttribute("data-speed") || 1; // Default speed if not set
            element.style.transform = `translate(${x * speed * 20}px, ${y * speed * 20}px)`;
        });
    });
  }

  // Initialize 3D logo
  initLogoCanvas();
});

// Ensure checkAuthStatus is defined and called after DOM is loaded.
async function checkAuthStatus() {
  try {
    // For GitHub Pages, check localStorage instead of server endpoint
    const user = localStorage.getItem('currentUser');
    const authStatusElement = document.getElementById('auth-status');
    
    if (user) {
      const userData = JSON.parse(user);
      if (authStatusElement) {
        authStatusElement.textContent = `Welcome, ${userData.name || userData.email}`;
      }
    } else {
      if (authStatusElement) {
        authStatusElement.textContent = '';
      }
    }
    return;
    }
    const data = await response.json();
    const authStatusElement = document.getElementById('auth-status');

    if (authStatusElement) {
      if (data.isAuthenticated && data.user) {
        authStatusElement.textContent = `Welcome, ${data.user.name}`;
        if(authModalLink) authModalLink.style.display = 'none';
        let logoutLink = document.getElementById('logoutLink');
        if (!logoutLink) {
            const navLinks = document.querySelector('.nav-links');
            if (navLinks) {
                const listItem = document.createElement('li');
                logoutLink = document.createElement('a');
                logoutLink.href = '#';
                logoutLink.id = 'logoutLink';
                logoutLink.textContent = 'Logout';
                logoutLink.addEventListener('click', async (e) => {
                    e.preventDefault();
                    try {
                        await fetch('/auth/logout', { method: 'POST' });
                        window.location.reload();
                    } catch (err) {
                        console.error('Logout failed:', err);
                    }
                });
                listItem.appendChild(logoutLink);
                const authStatusLi = authStatusElement.closest('li');
                if (authStatusLi && authStatusLi.parentNode) {
                    authStatusLi.parentNode.insertBefore(listItem, authStatusLi.nextSibling);
                } else {
                    navLinks.appendChild(listItem);
                }
            }
        }
        logoutLink.style.display = 'inline';
      } else {
        authStatusElement.textContent = '';
        if(authModalLink) authModalLink.style.display = 'inline';
        const logoutLink = document.getElementById('logoutLink');
        if(logoutLink) logoutLink.style.display = 'none';
      }
    }
  } catch (error) {
    console.error('Error checking authentication status:', error);
    const authStatusElement = document.getElementById('auth-status');
    if (authStatusElement) {
      authStatusElement.textContent = 'Error checking status';
    }
  }
}

document.addEventListener('DOMContentLoaded', () => {
  checkAuthStatus();
});

// Contact form handler function
function handleContactForm(event) {
  event.preventDefault();
  
  const formData = new FormData(event.target);
  const name = formData.get('Name');
  const email = formData.get('Email');
  const message = formData.get('Message');
  
  // Create mailto link with form data
  const subject = encodeURIComponent('Contact Form Submission from TumzyTech');
  const body = encodeURIComponent(`Name: ${name}\nEmail: ${email}\n\nMessage:\n${message}`);
  const mailtoLink = `mailto:contact@tumzytech.com?subject=${subject}&body=${body}`;
  
  // Open user's email client
  window.location.href = mailtoLink;
  
  // Show success message
  const button = event.target.querySelector('button[type="submit"]');
  const originalText = button.textContent;
  button.textContent = 'Opening Email Client...';
  button.disabled = true;
  
  setTimeout(() => {
    button.textContent = originalText;
    button.disabled = false;
    event.target.reset();
  }, 2000);
}