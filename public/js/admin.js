// admin.js — revised with clickable medium-sized images

let currentAppId = null;
let pendingListings = [];

// ---------------- DOMContentLoaded ----------------
document.addEventListener('DOMContentLoaded', () => {
  // Inject admin header
  fetch('../components/header.html')
    .then(r => { if (!r.ok) throw r; return r.text(); })
    .then(html => { 
      document.getElementById('header-import').innerHTML = html; 
      attachHeaderListeners(); 
    })
    .catch(() => {
      console.warn('Failed to load header.');
      attachHeaderListeners();
    });

  // Load listings and stats
  loadAdminListings();
  loadAdminStats();
});

// ---------------- Header & Logout ----------------
function attachHeaderListeners() {
  const logoutBtn = document.querySelector('#header-import .labo-btn.logout, #header-import .logout');
  if (logoutBtn) logoutBtn.addEventListener('click', logout);
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
async function loadAdminListings() {
  try {
    const res = await fetch("/admin/listings"); // backend endpoint
    pendingListings = await res.json();
    const tbody = document.getElementById("appsTable");
    tbody.innerHTML = "";

    pendingListings.forEach(listing => {
      const tr = document.createElement("tr");
      tr.innerHTML = `
        <td>${escapeHtml(listing.title)}</td>
        <td>${escapeHtml(listing.type)}</td>
        <td><span class="muted">${escapeHtml(listing.status)}</span></td>
        <td>${new Date(listing.created_at).toLocaleDateString()}</td>
        <td style="white-space:nowrap">
          <button class="btn-sm btn btn-ghost" onclick="openAppDetails(${listing.id})">View</button>
          <button class="btn-sm btn btn-primary" onclick="takeAction(${listing.id}, 'approve')">Approve</button>
          <button class="btn-sm btn btn-ghost" onclick="takeAction(${listing.id}, 'reject')">Reject</button>
        </td>
      `;
      tbody.appendChild(tr);
    });
  } catch (err) {
    console.error("Failed to load admin listings:", err);
    showToast("Failed to load pending listings", true);
  }
}

// ---------------- Modal ----------------
function openAppDetails(id){
  const app = pendingListings.find(x => x.id === id);
  currentAppId = id;

  const modal = document.getElementById('adminModal');
  const body = document.getElementById('modalBody');

  if (app) {
    document.getElementById('modalTitle').textContent = app.title;
    body.innerHTML = `
      <p><strong>Type:</strong> ${escapeHtml(app.type)}</p>
      <p><strong>Status:</strong> ${escapeHtml(app.status)}</p>
      <p><strong>Price:</strong> ${escapeHtml(app.price)}</p>
      <p><strong>Size:</strong> ${escapeHtml(app.size || '-')}</p>
      <p><strong>Description:</strong> ${escapeHtml(app.description)}</p>
      ${app.image_url ? `<p><img id="appImagePreview" src="${escapeHtml(app.image_url)}" 
           style="max-width:300px; height:auto; cursor:pointer; border-radius:6px;"></p>` : ''}
    `;

    // Add click to open full-screen preview
    if (app.image_url) {
      const img = document.getElementById("appImagePreview");
      const previewModal = document.getElementById("imagePreviewModal");
      const previewImg = document.getElementById("imagePreview");

      img.addEventListener("click", () => {
        previewImg.src = img.src;
        previewModal.style.display = "flex";
      });

      previewModal.addEventListener("click", () => {
        previewModal.style.display = "none";
      });
    }

  } else {
    document.getElementById('modalTitle').textContent = 'Listing';
    body.innerHTML = '<p>No details</p>';
  }

  modal.classList.add('open');
  modal.setAttribute('aria-hidden','false');
}

function closeAppModal() {
  const modal = document.getElementById('adminModal');
  modal.classList.remove('open');
  modal.setAttribute('aria-hidden','true');
  currentAppId = null;
}

// ---------------- Approve / Reject (no pop-ups) ----------------
async function takeAction(id, action) {
  if (!id) return;

  try {
    let url = action === "approve"
      ? `/admin/approve-listing/${id}`
      : `/admin/listings/${id}/reject`;

    const res = await fetch(url, { method: "POST" });
    const data = await res.json();

    if (res.ok) {
      closeAppModal();
      await loadAdminListings();
      await loadAdminStats();
      showToast(`${action.charAt(0).toUpperCase() + action.slice(1)}d successfully`);
    } else {
      showToast(data.error || "Action failed", true);
    }
  } catch (err) {
    console.error("Action error:", err);
    showToast("Server error: " + err.message, true);
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
