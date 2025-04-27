/* Moved all JavaScript from index.html to this file */
const canvas = document.getElementById('particles-bg');
const ctx = canvas.getContext('2d');

// Add functionality to toggle the chat popup
const aiAssistant = document.getElementById('ai-assistant');
const chatPopup = document.getElementById('chat-popup');

aiAssistant.addEventListener('click', () => {
  if (chatPopup.style.display === 'none' || chatPopup.style.display === '') {
    chatPopup.style.display = 'flex';
  } else {
    chatPopup.style.display = 'none';
  }
});

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