/**
 * @module ui
 * Shared UI helpers: nav badge, toast notifications, skeleton cards.
 */
import { getFavoriteCount } from './favorites.js';

/** Update the favorites count badge in the nav. */
export function updateNavBadge() {
  document.querySelectorAll('.nav-fav-count').forEach((el) => {
    const count = getFavoriteCount();
    el.textContent = count;
    el.classList.toggle('visible', count > 0);
  });
}

/** Show a brief toast notification. */
export function showToast(message, duration = 2500) {
  let container = document.querySelector('.toast-container');
  if (!container) {
    container = document.createElement('div');
    container.className = 'toast-container';
    document.body.appendChild(container);
  }
  const toast = document.createElement('div');
  toast.className = 'toast';
  toast.textContent = message;
  container.appendChild(toast);
  setTimeout(() => toast.remove(), duration + 300);
}

/** Generate N skeleton recipe cards. */
export function renderSkeletonCards(container, count = 6) {
  container.innerHTML = Array.from({ length: count }, () => `
    <div class="skeleton-card">
      <div class="skeleton skeleton-thumb"></div>
      <div class="skeleton-body">
        <div class="skeleton skeleton-line"></div>
        <div class="skeleton skeleton-line short"></div>
        <div class="skeleton skeleton-line xshort"></div>
      </div>
    </div>`).join('');
}

/** Mark the current nav link as active based on pathname. */
export function markActiveNavLink() {
  const path = window.location.pathname;
  document.querySelectorAll('.nav-link').forEach((link) => {
    const href = link.getAttribute('href') || '';
    link.classList.toggle(
      'active',
      href && path.endsWith(href.replace(/^\./, '').replace(/^\/Culinary-Explorer/, '')),
    );
  });
}
