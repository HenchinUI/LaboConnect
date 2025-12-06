function downloadGuide(){
  window.open("assets/docs/investment-guide.pdf","_blank");
}

// Open inquiry modal for a specific listing
function openInquiry(listingId, title) {
  // create modal container
  const existing = document.getElementById('inquiryModal');
  if (existing) existing.remove();

  const modal = document.createElement('div');
  modal.id = 'inquiryModal';
  modal.style.position = 'fixed';
  modal.style.inset = '0';
  modal.style.zIndex = '2000';
  modal.style.display = 'flex';
  modal.style.alignItems = 'center';
  modal.style.justifyContent = 'center';
  modal.innerHTML = `
    <div style="position:absolute;inset:0;background:rgba(8,12,10,0.5)" data-close="true"></div>
    <div class="form-card" role="dialog" aria-modal="true" style="width:520px;max-width:94%;z-index:2001;">
      <div style="display:flex;justify-content:space-between;align-items:center;margin-bottom:8px">
        <h3 style="margin:0">Send Inquiry</h3>
        <button class="btn btn-ghost" id="inquiryClose">✕</button>
      </div>
      <div class="muted" style="margin-bottom:12px">Inquiry about: <strong>${(title||'Listing')}</strong></div>
      <form id="inquiryModalForm">
        <div class="form-row">
          <div class="field"><label>First Name *</label><input name="first_name" required></div>
          <div class="field"><label>Last Name *</label><input name="last_name" required></div>
        </div>
        <div class="form-row">
          <div class="field"><label>Contact Number (start with +63) *</label><input name="contact_number" placeholder="+63 912 345 6789" required></div>
          <div class="field"><label>Email *</label><input name="email" type="email" required></div>
        </div>
        <div class="field"><label>Company / Organization (optional)</label><input name="company"></div>
        <div class="field"><label>Note</label><textarea name="message" rows="4" placeholder="Any additional details or questions"></textarea></div>
        <div style="display:flex;gap:10px;justify-content:flex-end;margin-top:8px">
          <button type="submit" class="btn btn-primary">Send Inquiry</button>
          <button type="button" class="btn btn-ghost" id="inquiryCancel">Cancel</button>
        </div>
      </form>
    </div>
  `;

  document.body.appendChild(modal);

  // handlers
  modal.querySelector('[data-close]').addEventListener('click', () => modal.remove());
  modal.querySelector('#inquiryClose').addEventListener('click', () => modal.remove());
  modal.querySelector('#inquiryCancel').addEventListener('click', () => modal.remove());

  const form = modal.querySelector('#inquiryModalForm');
  form.addEventListener('submit', async (e) => {
    e.preventDefault();
    const fd = new FormData(form);
    const payload = {
      listing_id: listingId,
      first_name: fd.get('first_name').trim(),
      last_name: fd.get('last_name').trim(),
      contact_number: fd.get('contact_number').trim(),
      email: fd.get('email').trim(),
      company: fd.get('company') ? fd.get('company').trim() : '',
      message: fd.get('message') ? fd.get('message').trim() : ''
    };

    // include sender_user_id if the user is logged in (from localStorage)
    try {
      const user = JSON.parse(localStorage.getItem('laboCurrentUser'));
      if (user && user.id) payload.sender_user_id = user.id;
    } catch (e) {
      // ignore
    }

    // basic validation
    if (!payload.first_name || !payload.last_name || !payload.contact_number || !payload.email) {
      alert('Please complete required fields');
      return;
    }

    try {
      const res = await fetch('/api/inquiries', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload)
      });
      const data = await res.json();
      if (!res.ok) {
        alert(data.error || 'Failed to send inquiry');
        return;
      }
      alert('Inquiry sent — the seller will be notified.');
      modal.remove();
    } catch (err) {
      console.error(err);
      alert('Server error — please try again later');
    }
  });
}

function viewDetails(property){
  alert("View more details for: " + property);
}

function viewDetailsById(id){
  if (!id) return alert('Listing id missing');
  // Navigate to dedicated listing detail page
  try {
    window.location.href = '/components/listing-detail.html?id=' + encodeURIComponent(id);
  } catch (err) {
    console.error('Could not open listing detail page', err);
  }
}

// Chat modal for an inquiry thread (polling)
function openChat(inquiryId, title, opener) {
  // opener: optional name of who opened the chat (for display)
  if (!inquiryId) return alert('Inquiry id missing');
  const existing = document.getElementById('chatModal');
  if (existing) existing.remove();

  const modal = document.createElement('div');
  modal.id = 'chatModal';
  modal.style.position = 'fixed';
  modal.style.inset = '0';
  modal.style.zIndex = '3000';
  modal.style.display = 'flex';
  modal.style.alignItems = 'center';
  modal.style.justifyContent = 'center';

  modal.innerHTML = `
    <div style="position:absolute;inset:0;background:rgba(8,12,10,0.5)" data-close="true"></div>
    <div class="form-card" role="dialog" aria-modal="true" style="width:640px;max-width:96%;height:600px;display:flex;flex-direction:column;z-index:3001;">
      <div style="display:flex;justify-content:space-between;align-items:center;margin-bottom:8px">
        <h3 style="margin:0">Chat — ${title || 'Inquiry'}</h3>
        <button class="btn btn-ghost" id="chatClose">✕</button>
      </div>
      <div id="chatMessages" style="flex:1;overflow:auto;padding:12px;background:#fff;border-radius:6px;border:1px solid #eee"></div>
      <form id="chatForm" style="display:flex;gap:8px;margin-top:8px">
        <input name="body" placeholder="Write a message..." style="flex:1;padding:10px;border:1px solid #ddd;border-radius:6px" required />
        <button class="btn btn-primary">Send</button>
      </form>
    </div>
  `;

  document.body.appendChild(modal);

  const close = () => {
    modal.remove();
    if (modal._poll) clearInterval(modal._poll);
  };

  modal.querySelector('[data-close]').addEventListener('click', close);
  modal.querySelector('#chatClose').addEventListener('click', close);

  const messagesEl = modal.querySelector('#chatMessages');
  const form = modal.querySelector('#chatForm');

  async function loadMessages() {
    try {
      const res = await fetch('/api/inquiries/' + encodeURIComponent(inquiryId) + '/messages');
      if (!res.ok) throw new Error('Failed to load messages');
      const data = await res.json();
      const msgs = data.messages || [];
      messagesEl.innerHTML = '';
      msgs.forEach(m => {
        const el = document.createElement('div');
        el.style.marginBottom = '8px';
        el.style.padding = '8px';
        el.style.borderRadius = '6px';
        el.style.background = m.sender_user_id ? '#f2f9ff' : '#f6f6f6';
        el.innerHTML = `<div style="font-weight:700;font-size:0.95rem">${m.sender_name || (m.sender_email||'Unknown')}</div><div style="margin-top:4px">${(m.body||'').replace(/\n/g,'<br/>')}</div><div class="small muted" style="margin-top:6px">${new Date(m.created_at).toLocaleString()}</div>`;
        messagesEl.appendChild(el);
      });
      messagesEl.scrollTop = messagesEl.scrollHeight;
    } catch (e) {
      console.error('Chat load failed', e);
    }
  }

  // initial load
  loadMessages();
  // poll for new messages every 3s
  modal._poll = setInterval(loadMessages, 3000);

  // attempt to connect socket.io for real-time updates
  let socket = null;
  function initSocket() {
    try {
      if (typeof io === 'undefined') {
        // load client script dynamically
        const s = document.createElement('script');
        s.src = '/socket.io/socket.io.js';
        s.onload = () => { socket = io(); socket.emit('join', 'inquiry_' + inquiryId); socket.on('inquiry_message', (m) => { loadMessages(); }); };
        document.head.appendChild(s);
      } else {
        socket = io();
        socket.emit('join', 'inquiry_' + inquiryId);
        socket.on('inquiry_message', (m) => { loadMessages(); });
      }
    } catch (e) { console.warn('Socket init failed', e); }
  }
  initSocket();

  form.addEventListener('submit', async (e) => {
    e.preventDefault();
    const body = form.body.value.trim();
    if (!body) return;
    // try to include logged-in user info if available
    const user = (() => { try { return JSON.parse(localStorage.getItem('laboCurrentUser')); } catch(_) { return null; } })();
    const payload = {
      body,
      sender_user_id: user ? user.id : null,
      sender_name: user ? (user.username || '') : (opener || ''),
      sender_email: user ? (user.email || '') : ''
    };
    try {
      const res = await fetch('/api/inquiries/' + encodeURIComponent(inquiryId) + '/messages', {
        method: 'POST', headers: {'Content-Type':'application/json'}, body: JSON.stringify(payload)
      });
      if (!res.ok) {
        const d = await res.json().catch(()=>({}));
        alert(d.error || 'Failed to send message');
        return;
      }
      form.body.value = '';
      loadMessages();
    } catch (e) { console.error('Send message failed', e); }
  });
}

document.querySelectorAll('.faq-question').forEach(btn => {
  btn.addEventListener('click', function() {
    const item = btn.parentElement;
    item.classList.toggle('active');
  });
});

/* success stories data + modal handlers */
const storiesData = {
  lcc: {
    title: 'LCC',
    sub: 'Supermarket — Maharlika Highway, Pinyahan',
    img: 'assets/img/success/lcc.jpg',
    desc: 'LCC is one of Labo’s established retail anchors, offering employment and steady foot traffic that supports many nearby businesses. Opened in 20XX, LCC continues to expand its local services and outreach.'
  },
  jfm: {
    title: 'J&F MALL',
    sub: 'Mall — Dalis, Labo, Camarines Norte',
    img: 'assets/img/success/jf-mall.jpg',
    desc: 'A modern retail center providing shopping, dining and entertainment. The mall supports local suppliers and attracts visitors from neighboring towns.'
  },
  mrdiy: {
    title: 'Mr. DIY',
    sub: 'Retail — Maharlika Highway',
    img: 'assets/img/success/mr-diy.jpg',
    desc: 'A major retail chain that chose Labo for its accessibility and growing market.'
  },
  maria: {
    title: 'Maria Fatima',
    sub: 'Farm Resort — Purok 2, Bautista',
    img: 'assets/img/success/maria-fatima.jpg',
    desc: 'A successful agritourism resort that highlights local produce and creates seasonal employment.'
  },
  villa: {
    title: 'Villa Asuncion',
    sub: 'Resort — Purok 4, San Antonio',
    img: 'assets/img/success/villa-asuncion.jpg',
    desc: 'Popular event venue and resort supporting tourism growth in the municipality.'
  },
  hutspot: {
    title: 'HutSpot',
    sub: 'Hotel & Restaurant — Tulay na Lipa',
    img: 'assets/img/success/hutspot.jpg',
    desc: 'Local hospitality business that grew rapidly thanks to steady tourist flows.'
  },
  munichall: {
    title: 'Municipal Hall (New)',
    sub: 'Government Project — Dalis',
    img: 'assets/img/success/munhall.jpg',
    desc: 'A strategic public investment that will improve services and civic access.'
  },
  centralplaza: {
    title: 'Central Plaza',
    sub: 'Mall — Dalis, Labo',
    img: 'assets/img/success/central-plaza.jpg',
    desc: 'New commercial development designed to expand retail and service options.'
  }
};

function openStoryModal(id) {
  const data = storiesData[id];
  if (!data) return console.warn('Story not found:', id);
  const modal = document.getElementById('storyModal');
  document.getElementById('storyModalTitle').textContent = data.title;
  document.getElementById('storyModalSub').textContent = data.sub;
  document.getElementById('storyModalDesc').textContent = data.desc;
  const imgEl = document.getElementById('modalImage');
  imgEl.style.backgroundImage = `url('${data.img}')`;
  modal.classList.add('open');
  modal.setAttribute('aria-hidden', 'false');
  // focus first actionable element
  document.getElementById('modalContact').focus();
}

function closeStoryModal() {
  const modal = document.getElementById('storyModal');
  modal.classList.remove('open');
  modal.setAttribute('aria-hidden', 'true');
}

/* Inquiry form handlers */
function createFormMessage(text, type = 'success') {
  const existing = document.getElementById('formMsgInline');
  if (existing) existing.remove();
  const el = document.createElement('div');
  el.id = 'formMsgInline';
  el.style.marginBottom = '12px';
  el.style.padding = '12px';
  el.style.borderRadius = '8px';
  el.style.fontWeight = '700';
  if (type === 'success') {
    el.style.background = 'linear-gradient(90deg,#dff7e9,#eafbf0)';
    el.style.borderLeft = '4px solid var(--accent)';
    el.style.color = 'var(--accent)';
  } else {
    el.style.background = '#fff0f0';
    el.style.borderLeft = '4px solid #e44';
    el.style.color = '#a00';
  }
  el.textContent = text;
  const form = document.getElementById('inquiryForm');
  if (form) form.prepend(el);
  setTimeout(() => { if (el && el.parentElement) el.remove(); }, 6000);
}

function handleSubmit(e) {
  e.preventDefault();
  const form = document.getElementById('inquiryForm');
  if (!form) return;
  const submitBtn = form.querySelector('button[type="submit"]');
  const data = {
    fullname: form.fullname.value.trim(),
    email: form.email.value.trim(),
    phone: form.phone.value.trim(),
    company: form.company.value.trim(),
    range: form.range.value,
    sector: form.sector.value,
    message: form.message.value.trim()
  };

  if (!data.fullname || !data.email || !data.message) {
    createFormMessage('Please complete required fields.', 'error');
    return;
  }

  submitBtn.disabled = true;
  submitBtn._origText = submitBtn.textContent;
  submitBtn.textContent = 'Sending…';

  // Simulate submit (replace with real endpoint if desired)
  setTimeout(() => {
    createFormMessage('Salamat! Your inquiry was received. We will respond within 24 hours.');
    form.reset();
    submitBtn.disabled = false;
    submitBtn.textContent = submitBtn._origText;
  }, 800);
}

function resetForm() {
  const form = document.getElementById('inquiryForm');
  if (!form) return;
  form.reset();
  const msg = document.getElementById('formMsgInline');
  if (msg) msg.remove();
}

/* Load more opportunities */
function loadMoreOpportunities() {
  // Redirect to the dedicated listings page so users can see all listings with filters.
  try {
    window.location.href = '/components/listings.html';
  } catch (err) {
    console.info('Could not redirect to listings page:', err);
  }
}

// Fetch approved listings from the API and render into the opportunities grid.
async function fetchApprovedListings(limit) {
  const grid = document.getElementById('opportunitiesGrid');
  if (!grid) return;

  // simple debounce / render token to avoid concurrent double-renders
  if (!fetchApprovedListings._token) fetchApprovedListings._token = 0;
  const thisToken = ++fetchApprovedListings._token;

  // clear grid now so the UI reflects loading state; stale requests will check token before modifying DOM
  grid.innerHTML = '';

  try {
    const resp = await fetch('/api/approved-listings');
    if (!resp.ok) throw new Error('Failed to fetch');
    const data = await resp.json();
    // if another call started after this one, abort rendering (prevents duplicates)
    if (thisToken !== fetchApprovedListings._token) return;
    const listings = Array.isArray(data) ? data : [];

    // show only up to `limit` on homepage
    const slice = typeof limit === 'number' ? listings.slice(0, limit) : listings;

    if (slice.length === 0) {
      grid.innerHTML = '<div class="muted" style="grid-column:1/-1;text-align:center">No approved listings available.</div>';
      return;
    }

    slice.forEach(item => {
      // defensive dedupe: skip if an element for this listing already exists
      if (grid.querySelector(`[data-listing-id="${item.id}"]`)) return;

      const card = document.createElement('article');
      card.className = 'card listing-card';
      card.setAttribute('data-listing-id', item.id);

      const img = item.image_url ? `style="background-image:url('${item.image_url}')"` : '';

      card.innerHTML = `
        <div class="property-photo" aria-hidden="true" ${img}></div>
        <div class="tags"><span class="tag">${item.type || 'Listing'}</span></div>
        <div class="title">${item.title || 'Untitled'}</div>
        <div class="muted description">${item.description || ''}</div>
        <div class="listing-meta">
          <div class="listing-price">${item.price || 'Price on request'}</div>
          <div class="listing-stats muted">${item.size ? (item.size + ' sqm') : ''}</div>
        </div>
        <div class="listing-actions">
          <button class="btn btn-primary" onclick="openInquiry(${item.id}, '${(item.title||'Listing').replace(/'/g, "\\'")}')">Send Inquiry</button>
          <button class="btn btn-ghost" onclick="viewDetailsById(${item.id})">View Details</button>
        </div>
      `;

      grid.appendChild(card);
    });

  } catch (err) {
    console.error('Error loading listings:', err);
    grid.innerHTML = '<div class="muted" style="grid-column:1/-1;text-align:center">Could not load listings.</div>';
  }
}

// attach handlers after DOM ready
document.addEventListener('DOMContentLoaded', () => {
  // Load up to 9 approved listings for the homepage
  fetchApprovedListings(9);
  document.querySelectorAll('.story-card').forEach(card => {
    const id = card.dataset.id;
    card.addEventListener('click', () => openStoryModal(id));
    card.addEventListener('keydown', (e) => {
      if (e.key === 'Enter' || e.key === ' ') { e.preventDefault(); openStoryModal(id); }
    });
  });

  // modal close
  document.querySelectorAll('.story-modal [data-close], .story-modal .modal-close').forEach(btn => {
    btn.addEventListener('click', closeStoryModal);
  });
  // backdrop click
  const modal = document.getElementById('storyModal');
  if (modal) {
    const backdrop = modal.querySelector('.story-modal-backdrop');
    if (backdrop) backdrop.addEventListener('click', closeStoryModal);
  }
  // keyboard ESC
  document.addEventListener('keydown', (e) => { if (e.key === 'Escape') closeStoryModal(); });

  // example actions (Contact / View More) - hook to existing functions if present
  const modalContact = document.getElementById('modalContact');
  const modalMore = document.getElementById('modalMore');
  if (modalContact) modalContact.addEventListener('click', () => {
    closeStoryModal();
    scrollToSection && scrollToSection('#contact');
  });
  if (modalMore) modalMore.addEventListener('click', () => {
    // could navigate to a detailed page — placeholder
    alert('Open detailed page (implement link)'); 
  });
});
