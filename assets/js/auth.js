// TumzyTech Authentication Handler

// Handle Google OAuth Login
function initiateGoogleLogin() {
  window.location.href = '/auth/google';
}

// Handle JWT token from OAuth callback
function handleAuthCallback() {
  // Check if this page was loaded as a redirect from OAuth
  const urlParams = new URLSearchParams(window.location.search);
  const token = urlParams.get('token');
  
  if (token) {
    // Store the token in localStorage
    localStorage.setItem('token', token);
    
    // Decode the JWT to get user info
    try {
      const payload = JSON.parse(atob(token.split('.')[1]));
      localStorage.setItem('userId', payload.id);
      localStorage.setItem('userEmail', payload.email || '');
      localStorage.setItem('userName', payload.name || '');
    } catch (e) {
      console.error('Error decoding JWT:', e);
    }
<<<<<<< HEAD
      // Remove the token from URL (to prevent accidental sharing)
    window.history.replaceState({}, document.title, '/chat.html');
    
    // Redirect to chat
    window.location.href = '/chat.html';
=======
    
    // Remove the token from URL (to prevent accidental sharing)
    window.history.replaceState({}, document.title, '/dashboard.html');
    
    // Redirect to dashboard
    window.location.href = '/dashboard.html';
>>>>>>> f0d38d87b7a8cbf4156ccd4c1cf1b8254d297799
  }
}

// Check if user is authenticated
function checkAuth() {
  const token = localStorage.getItem('token');
  if (!token) {
    return false;
  }
  
  // Check if token is expired
  try {
    const payload = JSON.parse(atob(token.split('.')[1]));
    const expirationTime = payload.exp * 1000; // Convert to milliseconds
    if (Date.now() >= expirationTime) {
      // Token is expired
      localStorage.removeItem('token');
      localStorage.removeItem('userId');
      localStorage.removeItem('userEmail');
      localStorage.removeItem('userName');
      return false;
    }
    return true;
  } catch (e) {
    console.error('Error checking token:', e);
    return false;
  }
}

// Logout function
function logout() {
  localStorage.removeItem('token');
  localStorage.removeItem('userId');
  localStorage.removeItem('userEmail');
  localStorage.removeItem('userName');
  
  // Call server logout endpoint
  fetch('/auth/logout', {
    method: 'GET',
    credentials: 'include'
  }).finally(() => {
    window.location.href = '/index.html';
  });
}

// Check if user is authenticated on protected pages
document.addEventListener('DOMContentLoaded', function() {
  // Check if we're on a callback page
  if (window.location.pathname.includes('callback')) {
    handleAuthCallback();
    return;
  }
<<<<<<< HEAD
  // Protected routes that require authentication
  const protectedRoutes = [
    '/chat.html'
=======
  
  // Protected routes that require authentication
  const protectedRoutes = [
    '/dashboard.html',
    '/chat.html',
    '/profile.html',
    '/settings.html'
>>>>>>> f0d38d87b7a8cbf4156ccd4c1cf1b8254d297799
  ];
  
  // Check if current page is protected
  const isProtectedRoute = protectedRoutes.some(route => 
    window.location.pathname.endsWith(route)
  );
  
  if (isProtectedRoute && !checkAuth()) {
    // Redirect to login page if unauthenticated
    window.location.href = '/index.html';
  }
  
  // Set up logout button if it exists
  const logoutBtn = document.getElementById('logout-btn');
  if (logoutBtn) {
    logoutBtn.addEventListener('click', logout);
  }
  
  // Set up login button if it exists
  const loginBtn = document.getElementById('login-btn');
  if (loginBtn) {
    loginBtn.addEventListener('click', initiateGoogleLogin);
  }
});
