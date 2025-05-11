/* Moved all JavaScript from index.html to this file */
const particlesCanvas = document.getElementById('particles-bg');
const particlesCtx = particlesCanvas.getContext('2d');

// Parallax effect for elements with the class "parallax"
document.addEventListener("mousemove", (event) => {
    const x = event.clientX / window.innerWidth - 0.5;
    const y = event.clientY / window.innerHeight - 0.5;

    document.querySelectorAll(".parallax").forEach((element) => {
        const speed = element.getAttribute("data-speed");
        element.style.transform = `translate(${x * speed * 20}px, ${y * speed * 20}px)`;
    });
});

// Sign-in page open and close animation
// Use a different variable name to avoid conflicts
const signinButtonElement = document.getElementById('signinButton');
const signinPage = document.getElementById('signinPage');
const closeIcon = document.getElementById('closeIcon');

signinButtonElement?.addEventListener('click', function() {
    signinPage?.classList.remove('closeSignin');
    signinPage?.classList.add("openSignin");
});

closeIcon?.addEventListener('click', function() {
    signinPage?.classList.remove("openSignin");
    signinPage?.classList.add('closeSignin');
});

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
  
  // Create video element
  const video = document.createElement('video');
  video.autoplay = true;
  video.muted = true;
  video.loop = true;
  video.playsInline = true; // Better mobile support
  video.setAttribute('preload', 'auto');
  
  // Add loading indicator
  const loadingIndicator = document.createElement('div');
  loadingIndicator.style.position = 'absolute';
  loadingIndicator.style.top = '10px';
  loadingIndicator.style.right = '10px';
  loadingIndicator.style.background = 'rgba(0,0,0,0.5)';
  loadingIndicator.style.color = 'white';
  loadingIndicator.style.padding = '5px';
  loadingIndicator.style.borderRadius = '3px';
  loadingIndicator.style.fontSize = '12px';
  loadingIndicator.textContent = 'Loading background...';
  videoBackground.appendChild(loadingIndicator);
  
  // Add source element
  const source = document.createElement('source');
  source.src = 'assets/videos/background-video.mp4';
  source.type = 'video/mp4';
    // When video can play, show the container
  video.addEventListener('canplaythrough', () => {
    videoBackground.style.display = 'block';
    videoBackground.classList.add('loaded'); // Add loaded class for fade-in effect
    if (videoBackground.contains(loadingIndicator)) {
      videoBackground.removeChild(loadingIndicator);
    }
    console.log('Video background loaded successfully');
  });
  
  // Error handling
  video.addEventListener('error', (e) => {
    console.error('Error loading video background:', e);
    if (loadingIndicator) {
      loadingIndicator.textContent = 'Failed to load background';
      loadingIndicator.style.color = '#ff5555';
    }
  });
  
  // Append elements
  video.appendChild(source);
  videoBackground.appendChild(video);
}

// Initialize video background when page loads
window.addEventListener('load', initVideoBackground);

// Initialize Three.js for the logo - with proper lazy loading
function initLogoCanvas() {
  // Create a new canvas element for the 3D logo
  const logoCanvas = document.createElement('canvas');
  logoCanvas.id = 'logo-canvas';
  logoCanvas.width = 100;
  logoCanvas.height = 100;
  logoCanvas.style.display = 'block';
  
  // Reposition the 3D logo under the TumzyTech header
  const header = document.querySelector('nav');
  if (!header) return; // Safety check
  
  const logoCanvasContainer = document.createElement('div');
  logoCanvasContainer.style.position = 'relative';
  logoCanvasContainer.style.margin = '0 auto';
  logoCanvasContainer.style.width = '100px';
  logoCanvasContainer.style.height = '100px';
  logoCanvasContainer.style.display = 'flex';
  logoCanvasContainer.style.justifyContent = 'center';
  logoCanvasContainer.style.alignItems = 'center';
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

  // Load the 3D model for the logo with a loading indicator
  const loadingIndicator = document.createElement('div');
  loadingIndicator.style.position = 'absolute';
  loadingIndicator.style.top = '50%';
  loadingIndicator.style.left = '50%';
  loadingIndicator.style.transform = 'translate(-50%, -50%)';
  loadingIndicator.style.color = '#ffffff';
  loadingIndicator.style.fontSize = '12px';
  loadingIndicator.textContent = 'Loading...';
  logoCanvasContainer.appendChild(loadingIndicator);

  const logoLoader = new THREE.GLTFLoader();
  logoLoader.load('assets/pictures/flying.glb', function (gltf) {
    logoModel = gltf.scene;
    logoScene.add(logoModel);

    // Adjust the model's position and scale for the logo
    logoModel.position.set(0, -0.5, 0);
    logoModel.scale.set(0.5, 0.5, 0.5);

    // Animation loop for the logo
    function animateLogo() {
      requestAnimationFrame(animateLogo);
      if (logoModel) {
        logoModel.rotation.y += 0.01; // Rotate the model for animation
      }
      logoRenderer.render(logoScene, logoCamera);
    }
    
    // Remove loading indicator once loaded
    logoCanvasContainer.removeChild(loadingIndicator);
    animateLogo();

    // Add mouse movement interaction for dynamic rotation
    window.addEventListener('mousemove', (event) => {
      if (!logoModel) return;
      const x = (event.clientX / window.innerWidth - 0.5) * 2;
      const y = (event.clientY / window.innerHeight - 0.5) * 2;
      logoModel.rotation.x = y * 0.5;
      logoModel.rotation.y = x * 0.5;
    });
    
    console.log('3D logo loaded successfully');
  }, function (xhr) {
    const percent = xhr.loaded / xhr.total * 100;
    loadingIndicator.textContent = `Loading: ${percent.toFixed(0)}%`;
    console.log(`Loading progress: ${percent.toFixed(2)}% loaded`);
  }, function (error) {
    console.error('Failed to load the 3D model:', error);
    loadingIndicator.textContent = 'Failed to load 3D model';
    loadingIndicator.style.color = '#ff5555';
  });
}

// Initialize the 3D logo after the page content has loaded
if (document.readyState === 'loading') {
  document.addEventListener('DOMContentLoaded', initLogoCanvas);
} else {
  // If DOMContentLoaded has already fired
  initLogoCanvas();
}

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

// Pi Network Integration
const Pi = window.Pi;

// Initialize Pi SDK with sandbox mode
Pi.init({ version: "2.0", sandbox: true });

// Handle Pi payments
async function handlePiPayment() {
  try {
    // 1. Authenticate user
    const auth = await Pi.authenticate(['payments'], onIncompletePaymentFound);
    if (!auth) {
      throw new Error('User cancelled authentication');
    }

    // 2. Create payment
    const payment = await Pi.createPayment({
      amount: 0.5,
      memo: "TumzyTech AI Tool Access",
      metadata: { productId: "ai-tools-access" }
    });

    // 3. Handle payment result
    if (payment.status === 'completed') {
      alert('Payment successful! Redirecting to chat...');
      window.location.href = '/chat.html';
    } else {
      alert('Payment incomplete. Please try again.');
    }

  } catch (error) {
    console.error('Payment error:', error);
    alert('Payment failed: ' + error.message);
  }
}

// Handle incomplete payments
function onIncompletePaymentFound(payment) {
  console.log("Incomplete payment found:", payment);
  return handlePiPayment();
}

// Payment functionality has been moved to the chat.html page
// No need to attach event listeners for payWithPi here