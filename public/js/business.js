let bizListings = [
  { id:1, title:'Seaside Cottage', price:'₱7,500 / mo', desc:'Beachfront cottage available for tourists.' },
  { id:2, title:'Retail Space — Poblacion', price:'₱45,000 / mo', desc:'Corner retail with high foot traffic.' },
  { id:3, title:'Agri Land Lease', price:'₱2,500 / month', desc:'Fertile land for lease; 0.5 ha.' }
];
let editingId = null;

function renderListings(){
  const container = document.getElementById('bizListings');
  if(!container) return;
  container.innerHTML = '';
  bizListings.forEach(l => {
    const el = document.createElement('article');
    el.className = 'listing-card';
    el.innerHTML = `
      <div style="font-weight:800">${escapeHtml(l.title)}</div>
      <div class="muted" style="margin-top:6px">${escapeHtml(l.desc)}</div>
      <div style="font-weight:800;color:var(--accent);margin-top:8px">${escapeHtml(l.price)}</div>
      <div style="margin-top:10px;display:flex;gap:8px">
        <button class="btn btn-primary" onclick="openInquiry('${escapeHtml(l.title)}')">Inquiries</button>
        <button class="btn btn-ghost" onclick="openEditListing(${l.id})">Edit</button>
      </div>
    `;
    container.appendChild(el);
  });
  document.getElementById('stat-listings').textContent = bizListings.length;
}

function openEditListing(id){
  editingId = id || null;
  const modal = document.getElementById('bizModal');
  document.getElementById('bizModalTitle').textContent = id ? 'Edit Listing' : 'Create Listing';
  if(id){
    const item = bizListings.find(x => x.id === id);
    document.getElementById('listingTitle').value = item.title;
    document.getElementById('listingPrice').value = item.price;
    document.getElementById('listingDesc').value = item.desc;
    document.querySelector('#bizModal .btn-ghost').style.display = ''; // show delete
  } else {
    document.getElementById('bizForm').reset();
    document.querySelector('#bizModal .btn-ghost').style.display = 'none';
  }
  modal.classList.add('open');
  modal.setAttribute('aria-hidden','false');
}

function closeEditListing(){
  const modal = document.getElementById('bizModal');
  modal.classList.remove('open');
  modal.setAttribute('aria-hidden','true');
  editingId = null;
}

function saveListing(e){
  e.preventDefault();
  const title = document.getElementById('listingTitle').value.trim();
  const price = document.getElementById('listingPrice').value.trim();
  const desc = document.getElementById('listingDesc').value.trim();
  if(editingId){
    const idx = bizListings.findIndex(x=>x.id===editingId);
    if(idx>-1) bizListings[idx] = { id:editingId, title, price, desc };
  } else {
    const id = Date.now();
    bizListings.push({ id, title, price, desc });
  }
  renderListings();
  closeEditListing();
}

function deleteListing(){
  if(!editingId) return;
  if(!confirm('Delete this listing?')) return;
  bizListings = bizListings.filter(x=>x.id !== editingId);
  renderListings();
  closeEditListing();
}

// small helpers
function escapeHtml(s){ return String(s||'').replace(/[&<>"']/g, c=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c])); }

// wire up on load
document.addEventListener('DOMContentLoaded', () => {
  renderListings();
});