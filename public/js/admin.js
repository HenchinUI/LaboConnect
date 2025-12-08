// admin.js — revised with clickable medium-sized images

let currentAppId = null;
let pendingListings = [];
let approvedListings = [];
let rejectedListings = [];
let currentView = 'pending'; // 'pending' | 'approved' | 'rejected'
let currentListings = [];
let selectionActive = false;

// ---------------- DOMContentLoaded ----------------
document.addEventListener('DOMContentLoaded', () => {
  // Inject admin header only if not already loaded (global.js may have loaded it)
  const headerImportEl = document.getElementById('header-import');
  if (!headerImportEl || headerImportEl.innerHTML.trim() === '') {
    fetch('/components/header.html')
      .then(r => { if (!r.ok) throw r; return r.text(); })
      .then(html => {
        // only inject if still empty (race-safe)
        if (headerImportEl && headerImportEl.innerHTML.trim() === '') {
          headerImportEl.innerHTML = html;
          attachHeaderListeners();
        } else {
          attachHeaderListeners();
        }
      })
      .catch(() => {
        console.warn('Failed to load header.');
        attachHeaderListeners();
      });
  } else {
    attachHeaderListeners();
  }

  // Load listings and stats (start with pending)
  switchView('pending');
  loadAdminStats();
});

// ---------------- Header & Logout ----------------
function attachHeaderListeners() {
  try {
    const profileBtn = document.querySelector('#header-import #profileBtn');
    const notifBtn = document.querySelector('#header-import #notifBtn');
    const logoutBtn = document.querySelector('#header-import #logoutBtn');

    if (notifBtn && !notifBtn._wired) {
      notifBtn.addEventListener('click', (ev) => { ev.preventDefault(); openNotifications(); });
      notifBtn._wired = true;
    }
    if (logoutBtn && !logoutBtn._wired) {
      logoutBtn.addEventListener('click', (ev) => { ev.preventDefault(); logoutUser(); });
      logoutBtn._wired = true;
    }
    if (profileBtn && !profileBtn._wired) {
      profileBtn.addEventListener('click', (ev) => {
        ev.preventDefault();
        try { const stored = JSON.parse(localStorage.getItem('laboCurrentUser')); if (stored && stored.role === 'admin') { window.location.href = '/components/admin-dashboard.html'; return; } } catch(e){}
        window.location.href = '/components/business/index.html';
      });
      profileBtn._wired = true;
    }
  } catch (e) {
    console.warn('attachHeaderListeners failed', e);
  }
}

function logout() {
  if (typeof logoutUser === 'function') {
    logoutUser();
  } else {
    alert('Logging out (demo) - user management not loaded.');
    window.location = '../index.html';
  }
}

// ---------------- Load Listings ----------------
// Load listings for a specific view. Tries multiple endpoint fallbacks for compatibility.
async function loadListings(status = 'pending') {
  currentView = status;
  const tbody = document.getElementById("appsTable");
  tbody.innerHTML = "";
  document.getElementById('appsTitle').textContent = status === 'pending' ? 'Recent Applications' : (status === 'approved' ? 'Approved Listings' : 'Rejected Listings');
  // clear selection state when loading a new view
  selectionActive = false;
  const tableWrap = document.querySelector('.admin-table-wrap');
  if (tableWrap) tableWrap.classList.remove('selection-active');

  // attempt a few endpoint patterns
  const candidates = [
    `/admin/listings?status=${status}`,
    `/admin/listings/${status}`,
    status === 'pending' ? `/admin/listings` : null
  ].filter(Boolean);

  let listings = [];
  for (const url of candidates) {
    try {
      const res = await fetch(url);
      if (!res.ok) continue;
      listings = await res.json();
      break;
    } catch (e) {
      // try next
    }
  }

  // If we didn't get data, show message
  if (!Array.isArray(listings) || listings.length === 0) {
    const tr = document.createElement('tr');
    tr.innerHTML = `<td colspan="8" class="muted">No listings found.</td>`;
    tbody.appendChild(tr);
    currentListings = [];
    if (status === 'pending') pendingListings = [];
    if (status === 'approved') approvedListings = [];
    if (status === 'rejected') rejectedListings = [];
    return;
  }

  // save to appropriate bucket
  if (status === 'pending') pendingListings = listings;
  else if (status === 'approved') approvedListings = listings;
  else if (status === 'rejected') rejectedListings = listings;

  currentListings = listings;

  // render
  listings.forEach(listing => {
    const tr = document.createElement("tr");
    // common columns
    let actions = `<button class="btn-sm btn btn-ghost" onclick="openAppDetails(${listing.id})">View</button>`;

    if (status === 'pending') {
      actions += ` <button class="btn-sm btn btn-primary" onclick="takeAction(${listing.id}, 'approve')">Approve</button>`;
      actions += ` <button class="btn-sm btn btn-ghost" onclick="takeAction(${listing.id}, 'reject')">Reject</button>`;
    } else if (status === 'approved') {
      actions += ` <button class="btn-sm btn btn-ghost" onclick="takeAction(${listing.id}, 'reject')">Reject</button>`;
    } else if (status === 'rejected') {
      actions += ` <button class="btn-sm btn btn-primary" onclick="takeAction(${listing.id}, 'approve')">Re-approve</button>`;
      actions += ` <button class="btn-sm btn btn-danger" onclick="takeAction(${listing.id}, 'delete')">Delete</button>`;
    }

    // selection checkbox cell (hidden unless selectionActive)
    const selectCell = `<td class="select-cell" style="vertical-align:middle"><input class=\"select-checkbox\" type=\"checkbox\" data-id=\"${listing.id}\"></td>`;

    // thumbnail(s) - display available image-like fields left-to-right
    const imageFields = ['image_url','oct_tct_url','tax_declaration_url','doas_url','government_id_url'];
    const thumbs = [];
    for (const f of imageFields) {
      const url = listing[f];
      if (url && typeof url === 'string') {
        const lower = url.toLowerCase();
        if (lower.endsWith('.png') || lower.endsWith('.jpg') || lower.endsWith('.jpeg') || lower.endsWith('.gif')) {
          thumbs.push(`<img class=\"admin-thumb\" src=\"${escapeHtml(url)}\" alt=\"${escapeHtml(f)}\" onclick=\"openImagePreview('${escapeHtml(url)}')\">`);
        }
      }
    }
    const thumbHtml = thumbs.length ? `<div class=\"admin-thumbs\">${thumbs.join('')}</div>` : '';
    const ownerEmail = listing.owner_email || listing.owner_username || '';

    tr.innerHTML = `
      ${selectCell}
      <td style="vertical-align:middle">${thumbHtml}</td>
      <td style="vertical-align:middle">${escapeHtml(listing.title)}</td>
      <td style="vertical-align:middle">${escapeHtml(listing.type)}</td>
      <td style="vertical-align:middle"><span class="muted">${escapeHtml(listing.status)}</span></td>
      <td style="vertical-align:middle">${new Date(listing.created_at).toLocaleDateString()}</td>
      <td style="vertical-align:middle">${ownerEmail ? `<a href=\"mailto:${escapeHtml(ownerEmail)}\">${escapeHtml(ownerEmail)}</a>` : '-'}</td>
      <td style="white-space:nowrap;vertical-align:middle">${actions}</td>
    `;
    tbody.appendChild(tr);
  });
}

// Toggle selection mode (shows/hides checkboxes)
function toggleSelectMode() {
  selectionActive = !selectionActive;
  const tableWrap = document.querySelector('.admin-table-wrap');
  if (tableWrap) {
    if (selectionActive) tableWrap.classList.add('selection-active');
    else tableWrap.classList.remove('selection-active');
  }
  // Ensure checkboxes are cleared when toggling off
  if (!selectionActive) clearSelection();
}

function selectAllVisible() {
  const boxes = document.querySelectorAll('.select-checkbox');
  boxes.forEach(b => { b.checked = true; });
}

function clearSelection() {
  const boxes = document.querySelectorAll('.select-checkbox');
  boxes.forEach(b => { b.checked = false; });
}

function getSelectedIds() {
  const boxes = Array.from(document.querySelectorAll('.select-checkbox:checked'));
  return boxes.map(b => parseInt(b.dataset.id));
}

async function bulkAction(action) {
  const ids = getSelectedIds();
  if (!ids.length) { showToast('No listings selected', true); return; }

  // confirm destructive actions
  if (action === 'delete') {
    if (!confirm(`Delete ${ids.length} selected listing(s)? This cannot be undone.`)) return;
  }

  try {
    const promises = ids.map(id => {
      if (action === 'approve') return fetch(`/admin/approve-listing/${id}`, { method: 'POST' });
      if (action === 'reject') return fetch(`/admin/listings/${id}/reject`, { method: 'POST' });
      if (action === 'delete') return fetch(`/admin/listings/${id}`, { method: 'DELETE' });
      return Promise.resolve();
    });

    const results = await Promise.all(promises);
    const failed = results.filter(r => !r.ok).length;
    if (failed === 0) {
      showToast(`Bulk ${action} completed`);
    } else {
      showToast(`Bulk ${action} completed with ${failed} failures`, true);
    }

    // reload current view and stats
    clearSelection();
    await loadListings(currentView);
    await loadAdminStats();
  } catch (e) {
    console.error('Bulk action error', e);
    showToast('Bulk action failed', true);
  }
}

function switchView(view) {
  currentView = view;
  loadListings(view);
}

// ---------------- Modal ----------------
function openAppDetails(id){
  // find in current lists, otherwise try to fetch single
  let app = currentListings.find(x => x.id === id) || pendingListings.find(x => x.id === id) || approvedListings.find(x => x.id === id) || rejectedListings.find(x => x.id === id);
  currentAppId = id;

  const modal = document.getElementById('adminModal');
  const body = document.getElementById('modalBody');

  async function render(app) {
    if (app) {
      document.getElementById('modalTitle').textContent = app.title;
    const ownerName = `${escapeHtml(app.owner_first_name || '')} ${escapeHtml(app.owner_last_name || '')}`.trim();
    const ownerEmail = app.owner_email || app.owner_username || '';
    // helper to render document thumbnails: small left-to-right clickable thumbs
    function renderDocumentHTML(url, label) {
      if (!url) return '';
      const cleanUrl = escapeHtml(url);
      const lower = cleanUrl.toLowerCase();
      if (lower.endsWith('.png') || lower.endsWith('.jpg') || lower.endsWith('.jpeg') || lower.endsWith('.gif')) {
        return `<div class="modal-docs"><div style="font-weight:700;margin-right:6px">${label}:</div><img class=\"modal-doc-thumb\" src=\"${cleanUrl}\" alt=\"${label}\" onclick=\"openImagePreview('${cleanUrl}')\"></div>`;
      }
      // default to link for PDFs and other types
      return `<p><strong>${label}:</strong> <a href="${cleanUrl}" target="_blank">${label} (view)</a></p>`;
    }

    body.innerHTML = `
      <p><strong>Owner:</strong> ${ownerName || '-'}</p>
      <p><strong>Owner Email:</strong> ${ownerEmail ? `<a href="mailto:${escapeHtml(ownerEmail)}">${escapeHtml(ownerEmail)}</a>` : '-'}</p>
      <p><strong>Type:</strong> ${escapeHtml(app.type)}</p>
      <p><strong>Status:</strong> ${escapeHtml(app.status)}</p>
      <p><strong>Price:</strong> ${escapeHtml(app.price)}</p>
      <p><strong>Size:</strong> ${escapeHtml(app.size || '-')}</p>
      <p><strong>Views:</strong> ${escapeHtml(app.views || 0)}</p>
      <p><strong>Inquiries:</strong> ${escapeHtml(app.inquiries || 0)}</p>
      <p><strong>Description:</strong> ${escapeHtml(app.description)}</p>
      ${app.image_url ? `<div class="modal-docs"><img class=\"modal-doc-thumb\" src=\"${escapeHtml(app.image_url)}\" alt=\"image\" onclick=\"openImagePreview('${escapeHtml(app.image_url)}')\"></div>` : ''}
      <div style="margin-top:8px">
        ${renderDocumentHTML(app.oct_tct_url, 'OCT / TCT')}
        ${renderDocumentHTML(app.tax_declaration_url, 'Tax Declaration')}
        ${renderDocumentHTML(app.doas_url, 'DOAS')}
        ${renderDocumentHTML(app.government_id_url, 'Government ID')}
      </div>
    `;

      // set modal action buttons depending on view and current status
      const actionsContainer = document.getElementById('modalActions');
      actionsContainer.innerHTML = '';

      if (currentView === 'pending') {
        actionsContainer.innerHTML = `<button class="btn btn-primary" onclick="takeAction(${app.id}, 'approve')">Approve</button> <button class="btn btn-ghost" onclick="takeAction(${app.id}, 'reject')">Reject</button>`;
      } else if (currentView === 'approved') {
        actionsContainer.innerHTML = `<button class="btn btn-ghost" onclick="takeAction(${app.id}, 'reject')">Reject</button>`;
      } else if (currentView === 'rejected') {
        actionsContainer.innerHTML = `<button class="btn btn-primary" onclick="takeAction(${app.id}, 'approve')">Re-approve</button> <button class="btn btn-danger" onclick="takeAction(${app.id}, 'delete')">Delete</button>`;
      } else {
        // default - allow approve/reject
        actionsContainer.innerHTML = `<button class="btn btn-primary" onclick="takeAction(${app.id}, 'approve')">Approve</button> <button class="btn btn-ghost" onclick="takeAction(${app.id}, 'reject')">Reject</button>`;
      }

      // Ensure the preview modal has a click-to-close handler (attach once)
      const previewModal = document.getElementById("imagePreviewModal");
      const previewImg = document.getElementById("imagePreview");
      if (previewModal && previewImg && !previewModal._listenerAttached) {
        previewModal.addEventListener("click", () => { previewModal.style.display = "none"; });
        previewModal._listenerAttached = true;
      }

    } else {
      document.getElementById('modalTitle').textContent = 'Listing';
      body.innerHTML = '<p>No details</p>';
      document.getElementById('modalActions').innerHTML = '';
    }

    modal.classList.add('open');
    modal.setAttribute('aria-hidden','false');
  }

  if (app) {
    render(app);
  } else {
    // fetch single listing
    fetch(`/admin/listings/${id}`)
      .then(r => r.ok ? r.json() : null)
      .then(data => render(data))
      .catch(() => render(null));
  }
}

function closeAppModal() {
  const modal = document.getElementById('adminModal');
  modal.classList.remove('open');
  modal.setAttribute('aria-hidden','true');
  currentAppId = null;
}

// Open the image preview modal (used by thumbnail clicks)
function openImagePreview(url) {
  try {
    const previewModal = document.getElementById('imagePreviewModal');
    const previewImg = document.getElementById('imagePreview');
    if (!previewModal || !previewImg) return;
    previewImg.src = url;
    previewModal.style.display = 'flex';
  } catch (e) { console.warn('Preview open failed', e); }
}

// ---------------- Approve / Reject (no pop-ups) ----------------
async function takeAction(id, action) {
  if (!id) return;

  try {
    let url, opts = { method: 'POST' };

    if (action === 'approve') {
      url = `/admin/approve-listing/${id}`;
      opts = { method: 'POST' };
    } else if (action === 'reject') {
      url = `/admin/listings/${id}/reject`;
      opts = { method: 'POST' };
    } else if (action === 'delete') {
      url = `/admin/listings/${id}`;
      opts = { method: 'DELETE' };
    } else {
      showToast('Unknown action', true);
      return;
    }

    const res = await fetch(url, opts);
    let data = {};
    try { data = await res.json(); } catch (e) { }

    if (res.ok) {
      closeAppModal();
      // reload the current view to reflect changes; stay on same view
      await loadListings(currentView);
      await loadAdminStats();
      showToast(`${action.charAt(0).toUpperCase() + action.slice(1)}d successfully`);
    } else {
      showToast(data.error || 'Action failed', true);
    }
  } catch (err) {
    console.error('Action error:', err);
    showToast('Server error: ' + err.message, true);
  }
}

// ---------------- Simple toast notification ----------------
function showToast(message, isError = false) {
  const toast = document.createElement("div");
  toast.textContent = message;
  toast.style.position = "fixed";
  toast.style.bottom = "20px";
  toast.style.right = "20px";
  toast.style.background = isError ? "rgba(255,50,50,0.9)" : "rgba(50,200,50,0.9)";
  toast.style.color = "#fff";
  toast.style.padding = "10px 15px";
  toast.style.borderRadius = "8px";
  toast.style.boxShadow = "0 4px 10px rgba(0,0,0,0.2)";
  toast.style.zIndex = 2000;
  toast.style.fontSize = "14px";
  toast.style.opacity = "0";
  toast.style.transition = "opacity 0.3s ease";

  document.body.appendChild(toast);
  requestAnimationFrame(() => { toast.style.opacity = "1"; });
  setTimeout(() => {
    toast.style.opacity = "0";
    setTimeout(() => toast.remove(), 300);
  }, 2000);
}

// ---------------- Stats ----------------
async function loadAdminStats() {
  try {
    const res = await fetch("/admin/stats");
    const data = await res.json();
    document.getElementById('stat-active').textContent = data.total;
    document.getElementById('stat-pending').textContent = data.pending;
    document.getElementById('stat-approved').textContent = data.approved;
  } catch (err) {
    console.error("Failed to load stats:", err);
  }
}

// ---------------- Utilities ----------------
function escapeHtml(s) {
  return String(s||'').replace(/[&<>"']/g, c => ({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c]));
}

function exportData() {
  alert("Export started (demo).");
}

// ---------------- Admin Token Creation (client) ----------------
async function createAdminToken() {
  try {
    const btn = document.getElementById('createAdminTokenBtn');
    if (btn) btn.disabled = true;
    // optional: ask for expiry days (prompt) or keep as single-use no-expiry
    const expires = prompt('Optional: token expiry in days (leave empty for no expiry):', '');
    const body = {};
    if (expires && !isNaN(parseInt(expires))) body.expires_in_days = parseInt(expires);

    const res = await fetch('/api/admin/tokens', {
      method: 'POST',
      credentials: 'same-origin',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(body)
    });
    const data = await res.json();
    if (!res.ok) {
      showToast(data.error || 'Failed to create token', true);
      if (btn) btn.disabled = false;
      return;
    }

    const out = document.getElementById('adminTokenResult');
    if (out) {
      out.textContent = `Token: ${data.token} `;
      // add a copy button
      const copyBtn = document.createElement('button');
      copyBtn.textContent = 'Copy';
      copyBtn.className = 'btn btn-sm btn-ghost';
      copyBtn.style.marginLeft = '8px';
      copyBtn.onclick = () => {
        try { navigator.clipboard.writeText(data.token); showToast('Token copied'); } catch (e) { alert(data.token); }
      };
      out.appendChild(copyBtn);
    } else {
      alert('Token: ' + data.token);
    }

    if (btn) btn.disabled = false;
  } catch (e) {
    console.error('Create token failed', e);
    showToast('Create token failed', true);
    const btn = document.getElementById('createAdminTokenBtn'); if (btn) btn.disabled = false;
  }
}
