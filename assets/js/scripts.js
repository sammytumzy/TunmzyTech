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
const signinButton = document.getElementById('signinButton');
const signinPage = document.getElementById('signinPage');
const closeIcon = document.getElementById('closeIcon');

signinButton?.addEventListener('click', function() {
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

// AI Particle System for Chat Page Background
const chatCanvas = document.getElementById('particles-bg');
if (chatCanvas) {
  const chatCtx = chatCanvas.getContext('2d');
  let chatW = chatCanvas.width = window.innerWidth;
  let chatH = chatCanvas.height = window.innerHeight;
  let chatParticles = [];
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

  function initChatParticles() {
    chatParticles = [];
    for (let i = 0; i < chatPCount; i++) {
      chatParticles.push(new ChatParticle());
    }
    animateChatParticles();
  }

  window.addEventListener('resize', () => {
    chatW = chatCanvas.width = window.innerWidth;
    chatH = chatCanvas.height = window.innerHeight;
    initChatParticles();
  });

  initChatParticles();
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

// Replace AI tech icons animation with video background
const videoBackgroundContainer = document.createElement('div');
videoBackgroundContainer.id = 'video-background';
videoBackgroundContainer.innerHTML = `
  <video autoplay muted loop>
    <source src="assets/videos/background-video.mp4" type="video/mp4">
    Your browser does not support the video tag.
  </video>
`;
document.body.appendChild(videoBackgroundContainer);

// Initialize Three.js for the logo
const logoCanvas = document.getElementById('logo-canvas');
logoCanvas.width = 100;
logoCanvas.height = 100;
const logoRenderer = new THREE.WebGLRenderer({ canvas: logoCanvas, antialias: true, alpha: true });
logoRenderer.setSize(logoCanvas.clientWidth, logoCanvas.clientHeight);
const logoScene = new THREE.Scene();
const logoCamera = new THREE.PerspectiveCamera(75, logoCanvas.clientWidth / logoCanvas.clientHeight, 0.1, 1000);
logoCamera.position.z = 2;

// Add lighting to the logo scene
const logoLight = new THREE.DirectionalLight(0xffffff, 1);
logoLight.position.set(5, 5, 5).normalize();
logoScene.add(logoLight);

// Load the 3D model for the logo
const logoLoader = new THREE.GLTFLoader();
logoLoader.load('assets/pictures/flying.glb', function (gltf) {
  const logoModel = gltf.scene;
  logoScene.add(logoModel);

  // Adjust the model's position and scale for the logo
  logoModel.position.set(0, -0.5, 0);
  logoModel.scale.set(0.5, 0.5, 0.5);

  // Animation loop for the logo
  function animateLogo() {
    requestAnimationFrame(animateLogo);
    logoModel.rotation.y += 0.01; // Rotate the model for animation
    logoRenderer.render(logoScene, logoCamera);
  }
  animateLogo();
}, function (xhr) {
  console.log(`Loading progress: ${(xhr.loaded / xhr.total * 100).toFixed(2)}% loaded`);
}, function (error) {
  console.error('Failed to load the 3D model:', error);
  alert('The 3D model could not be loaded. Please check the file or try another model.');
});

// Reposition the 3D logo under the TumzyTech header and add mouse movement interaction
const header = document.querySelector('nav');
const logoCanvasContainer = document.createElement('div');
logoCanvasContainer.style.position = 'relative';
logoCanvasContainer.style.margin = '0 auto';
logoCanvasContainer.style.width = '100px';
logoCanvasContainer.style.height = '100px';
logoCanvasContainer.style.display = 'flex';
logoCanvasContainer.style.justifyContent = 'center';
logoCanvasContainer.style.alignItems = 'center';
header.insertAdjacentElement('afterend', logoCanvas);

// Add mouse movement interaction for dynamic rotation
window.addEventListener('mousemove', (event) => {
  const x = (event.clientX / window.innerWidth - 0.5) * 2;
  const y = (event.clientY / window.innerHeight - 0.5) * 2;
  logoModel.rotation.x = y * 0.5;
  logoModel.rotation.y = x * 0.5;
});

// Log when lazy-loaded elements are successfully loaded
document.addEventListener('DOMContentLoaded', () => {
    const lazyElements = document.querySelectorAll('img, video, model-viewer');
    lazyElements.forEach(el => {
        el.addEventListener('load', () => {
            console.log(`${el.tagName} loaded successfully.`);
        });
    });
});

// Add error handling for 3D model loading
const modelViewer = document.querySelector('model-viewer');
modelViewer.addEventListener('error', (event) => {
  console.error('Error loading 3D model:', event);
  alert('The 3D model could not be loaded. Please check your internet connection or try again later.');
});

// Pi Network Integration
let piUser = null;
let piAccessToken = null;

// Initialize Pi SDK
const Pi = window.Pi;
Pi.init({
  version: "2.0",
  sandbox: true, // Set to true for testing
});

// Update Pi status display
function updatePiStatus(message, isError = false) {
  const statusEl = document.getElementById('pi-status');
  statusEl.textContent = message;
  statusEl.classList.remove('hidden', 'bg-glass', 'bg-red-500', 'bg-green-500');
  statusEl.classList.add(isError ? 'bg-red-500' : 'bg-green-500');
  setTimeout(() => {
    statusEl.classList.add('hidden');
  }, 3000);
}

// Handle Pi Network authentication
async function authenticateWithPi() {
  try {
    const scopes = ['payments'];
    const auth = await Pi.authenticate(scopes, onIncompletePaymentFound);
    piUser = auth.user;
    piAccessToken = auth.accessToken;
    updatePiStatus(`Welcome, ${auth.user.username}!`);
    return auth;
  } catch (error) {
    console.error('Pi authentication failed:', error);
    updatePiStatus('Authentication failed', true);
    return null;
  }
}

// Handle incomplete payments
function onIncompletePaymentFound(payment) {
  console.log("Incomplete payment found:", payment);
  return handlePayment(payment.amount, payment.memo);
}

// Handle Pi Network payments
async function handlePayment(paymentType = 'chatSubscription') {
  try {
    // First authenticate if not already done
    if (!piUser) {
      const auth = await authenticateWithPi();
      if (!auth) return;
    }

    // Create payment on server
    const response = await fetch('/api/pi/create-payment', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${piAccessToken}`
      },
      body: JSON.stringify({
        paymentType,
        uid: piUser.uid
      })
    });

    const data = await response.json();
    if (!data.success) {
      throw new Error(data.message || 'Failed to create payment');
    }

    updatePiStatus('Processing payment...');

    // Create payment with Pi SDK
    const payment = await Pi.createPayment({
      amount: data.paymentData.amount,
      memo: data.paymentData.memo,
      metadata: data.paymentData.metadata
    }, {
      onReadyForServerApproval: async function(paymentId) {
        try {
          const approvalRes = await fetch('/api/pi/approve', {
            method: 'POST',
            headers: {
              'Content-Type': 'application/json',
              'Authorization': `Bearer ${piAccessToken}`
            },
            body: JSON.stringify({ paymentId })
          });
          const approvalData = await approvalRes.json();
          if (!approvalData.success) throw new Error('Payment approval failed');
          updatePiStatus('Payment approved!');
        } catch (error) {
          console.error('Approval error:', error);
          updatePiStatus('Approval failed', true);
        }
      },
      onReadyForServerCompletion: async function(paymentId, txid) {
        try {
          const completeRes = await fetch('/api/pi/complete', {
            method: 'POST',
            headers: {
              'Content-Type': 'application/json',
              'Authorization': `Bearer ${piAccessToken}`
            },
            body: JSON.stringify({ paymentId, txid })
          });
          const completeData = await completeRes.json();
          if (!completeData.success) throw new Error('Payment completion failed');
          updatePiStatus('Payment completed successfully!');
          setTimeout(() => {
            window.location.href = '/chat.html'; // Redirect to chat page
          }, 2000);
        } catch (error) {
          console.error('Completion error:', error);
          updatePiStatus('Completion failed', true);
        }
      },
      onCancel: function() {
        updatePiStatus('Payment cancelled', true);
      },
      onError: function(error) {
        console.error('Payment error:', error);
        updatePiStatus('Payment failed', true);
      }
    });

    return payment;
  } catch (error) {
    console.error('Payment error:', error);
    updatePiStatus(error.message || 'Payment failed', true);
    return null;
  }
}

// Add payment button event listeners
document.addEventListener('DOMContentLoaded', () => {
  const payButton = document.getElementById('payWithPi');
  if (payButton) {
    payButton.addEventListener('click', () => handlePayment('chatSubscription'));
  }
  
  // Initialize Pi authentication
  authenticateWithPi();
});