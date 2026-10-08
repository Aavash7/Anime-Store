const SUPABASE_URL = 'https://lohayejsnwpdqjppktrz.supabase.co';
const SUPABASE_ANON_KEY = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImxvaGF5ZWpzbndwZHFqcHBrdHJ6Iiwicm9sZSI6ImFub24iLCJpYXQiOjE3OTA5ODk0OTUsImV4cCI6MjEwNjU2NTQ5NX0.KoPNL3Z_hTg1Xq0mg-Cd7FeACA3OPENZ8kSG4J9pW5M';

// ---- Supabase REST helpers ----
async function supabaseSelect(table, columns = '*') {
  const res = await fetch(`${SUPABASE_URL}/rest/v1/${table}?select=${columns}`, {
    headers: {
      'apikey': SUPABASE_ANON_KEY,
      'Authorization': `Bearer ${SUPABASE_ANON_KEY}`,
    },
  });
  if (!res.ok) throw new Error(`Failed to fetch ${table}`);
  return res.json();
}

async function supabaseInsert(table, data, token) {
  const headers = {
    'apikey': SUPABASE_ANON_KEY,
    'Content-Type': 'application/json',
  };
  if (token) {
    headers['Authorization'] = `Bearer ${token}`;
  } else {
    headers['Authorization'] = `Bearer ${SUPABASE_ANON_KEY}`;
  }
  const res = await fetch(`${SUPABASE_URL}/rest/v1/${table}`, {
    method: 'POST',
    headers,
    body: JSON.stringify(data),
  });
  if (!res.ok) {
    const err = await res.text();
    throw new Error(`Insert failed: ${err}`);
  }
  return res.json();
}

// ---- Auth (email/password via Supabase Auth API) ----
async function authSignUp(email, password) {
  const res = await fetch(`${SUPABASE_URL}/auth/v1/signup`, {
    method: 'POST',
    headers: {
      'apikey': SUPABASE_ANON_KEY,
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({ email, password }),
  });
  const data = await res.json();
  if (!res.ok) throw new Error(data.error_description || data.message || 'Sign up failed');
  return data;
}

async function authSignIn(email, password) {
  const res = await fetch(`${SUPABASE_URL}/auth/v1/token?grant_type=password`, {
    method: 'POST',
    headers: {
      'apikey': SUPABASE_ANON_KEY,
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({ email, password }),
  });
  const data = await res.json();
  if (!res.ok) throw new Error(data.error_description || data.message || 'Sign in failed');
  return data;
}

function saveSession(session) {
  localStorage.setItem('animestore_session', JSON.stringify(session));
}

function getSession() {
  const raw = localStorage.getItem('animestore_session');
  if (!raw) return null;
  try {
    return JSON.parse(raw);
  } catch {
    return null;
  }
}

function clearSession() {
  localStorage.removeItem('animestore_session');
}

function getCurrentUser() {
  const session = getSession();
  return session ? session.user : null;
}

function isLoggedIn() {
  return !!getSession();
}

// ---- Cart (localStorage based) ----
function getCart() {
  const raw = localStorage.getItem('animestore_cart');
  if (!raw) return [];
  try {
    return JSON.parse(raw);
  } catch {
    return [];
  }
}

function saveCart(cart) {
  localStorage.setItem('animestore_cart', JSON.stringify(cart));
  updateCartCount();
}

function addToCart(productId, name, price, image) {
  const cart = getCart();
  const existing = cart.find(i => i.id === productId);
  if (existing) {
    existing.quantity++;
  } else {
    cart.push({ id: productId, name, price, image, quantity: 1 });
  }
  saveCart(cart);
}

function removeFromCart(productId) {
  let cart = getCart();
  cart = cart.filter(i => i.id !== productId);
  saveCart(cart);
}

function updateQuantity(productId, qty) {
  const cart = getCart();
  const item = cart.find(i => i.id === productId);
  if (item) {
    item.quantity = Math.max(1, qty);
    saveCart(cart);
  }
}

function getCartTotal() {
  return getCart().reduce((sum, i) => sum + i.price * i.quantity, 0);
}

function getCartCount() {
  return getCart().reduce((sum, i) => sum + i.quantity, 0);
}

function clearCart() {
  localStorage.removeItem('animestore_cart');
  updateCartCount();
}

function updateCartCount() {
  const el = document.getElementById('cart-count');
  if (el) {
    const count = getCartCount();
    el.textContent = count;
    el.style.display = count > 0 ? 'flex' : 'none';
  }
}

// ---- Theme ----
function initTheme() {
  const saved = localStorage.getItem('animestore_theme') || 'light';
  setTheme(saved);
}

function setTheme(theme) {
  document.documentElement.setAttribute('data-theme', theme);
  localStorage.setItem('animestore_theme', theme);
  const btn = document.getElementById('theme-toggle');
  if (btn) {
    btn.textContent = theme === 'dark' ? '\u2600\uFE0F' : '\u{1F319}';
  }
}

function toggleTheme() {
  const current = localStorage.getItem('animestore_theme') || 'light';
  setTheme(current === 'dark' ? 'light' : 'dark');
}

// ---- Toast ----
function showToast(message) {
  let toast = document.getElementById('toast');
  if (!toast) {
    toast = document.createElement('div');
    toast.id = 'toast';
    toast.className = 'toast';
    document.body.appendChild(toast);
  }
  toast.textContent = message;
  toast.classList.add('show');
  setTimeout(() => toast.classList.remove('show'), 2500);
}

// ---- Format price in NPR ----
function formatPrice(amount) {
  return 'Rs ' + Number(amount).toLocaleString('en-IN');
}

// ---- Shared header injection ----
function injectHeader(activePage) {
  const header = document.getElementById('header');
  if (!header) return;
  const user = getCurrentUser();
  const links = [
    { href: 'index.html', label: 'Home', page: 'home' },
    { href: 'products.html', label: 'Shop', page: 'products' },
    { href: 'orders.html', label: 'My Orders', page: 'orders' },
    { href: 'help.html', label: 'Help', page: 'help' },
    { href: 'contact.html', label: 'Contact', page: 'contact' },
  ];
  const navLinks = links.map(l =>
    `<a href="${l.href}"${l.page === activePage ? ' style="color:var(--primary)"' : ''}>${l.label}</a>`
  ).join('');

  let authArea;
  if (user) {
    authArea = `
      <span style="font-size:0.85rem;color:var(--text-secondary);max-width:120px;overflow:hidden;text-overflow:ellipsis;white-space:nowrap">${user.email}</span>
      <button class="btn btn-secondary" onclick="logout()" style="padding:6px 16px;font-size:0.85rem">Logout</button>
    `;
  } else {
    authArea = `
      <a href="login.html" class="btn btn-secondary" style="padding:8px 18px;font-size:0.85rem">Login</a>
      <a href="signup.html" class="btn btn-primary" style="padding:8px 18px;font-size:0.85rem">Sign Up</a>
    `;
  }

  header.innerHTML = `
    <div class="header">
      <div class="header-content">
        <a href="index.html" class="logo">Anime<span>Store</span></a>
        <nav class="nav-links" id="nav-links">${navLinks}</nav>
        <div class="header-actions">
          <button class="theme-toggle" id="theme-toggle" onclick="toggleTheme()" title="Toggle theme"></button>
          <a href="cart.html" class="cart-icon">
            \u{1F6D2}
            <span class="cart-count" id="cart-count">0</span>
          </a>
          ${authArea}
          <button class="menu-toggle" onclick="document.getElementById('nav-links').classList.toggle('show')">\u2630</button>
        </div>
      </div>
    </div>
  `;
  initTheme();
  updateCartCount();
}

function logout() {
  clearSession();
  showToast('Logged out successfully');
  setTimeout(() => window.location.href = 'index.html', 500);
}

// ---- Shared footer ----
function injectFooter() {
  const footer = document.getElementById('footer');
  if (!footer) return;
  footer.innerHTML = `
    <div class="footer">
      <div class="footer-content">
        <div class="footer-col">
          <h4>AnimeStore</h4>
          <p style="color:var(--text-secondary);font-size:0.85rem">Your one-stop shop for authentic anime merchandise in Nepal. Figures, clothing, accessories and more.</p>
        </div>
        <div class="footer-col">
          <h4>Shop</h4>
          <a href="products.html">All Products</a>
          <a href="products.html?category=Naruto">Naruto</a>
          <a href="products.html?category=One Piece">One Piece</a>
          <a href="products.html?category=Demon Slayer">Demon Slayer</a>
        </div>
        <div class="footer-col">
          <h4>Support</h4>
          <a href="help.html">Help Center</a>
          <a href="contact.html">Contact Us</a>
          <a href="orders.html">Track Orders</a>
        </div>
        <div class="footer-col">
          <h4>Payment</h4>
          <a href="#" onclick="return false">eSewa</a>
          <a href="#" onclick="return false">Bank Payment</a>
        </div>
      </div>
      <div class="footer-bottom">
        &copy; 2026 AnimeStore. All rights reserved. Made with passion for anime fans in Nepal.
      </div>
    </div>
  `;
}

// Init on every page
document.addEventListener('DOMContentLoaded', () => {
  initTheme();
});
