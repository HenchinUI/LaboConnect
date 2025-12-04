function downloadGuide(){
  window.open("assets/docs/investment-guide.pdf","_blank");
}

function openInquiry(property){
  alert("Send an inquiry about: " + property);
}

function viewDetails(property){
  alert("View more details for: " + property);
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
  form.prepend(el);
  setTimeout(() => el.remove(), 6000);
}

function handleSubmit(e) {
  e.preventDefault();
  const form = document.getElementById('inquiryForm');
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

  // Simulate submit (replace with real endpoint)
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
  const btn = document.getElementById('viewMoreBtn');
  const grid = document.getElementById('opportunitiesGrid');
  
  if (!btn || !grid) return;
  
  // Sample additional opportunities (replace with API call if available)
  const moreListings = [
    {
      title: 'Agricultural Land — Barangay Salvacion',
      type: 'Property for Sale',
      tag: 'Agriculture',
      desc: 'Fertile farmland suitable for organic farming or agritourism ventures.',
      price: '₱2.5M',
      size: '2500 sqm',
      views: '612 views',
      inquiries: '15 inquiries'
    },
    {
      title: 'Tech Hub Space — Innovation Center',
      type: 'Property for Rent',
      tag: 'Technology',
      desc: 'Co-working and office space perfect for startups and tech companies.',
      price: '₱28,000/month',
      size: '180 sqm',
      views: '504 views',
      inquiries: '8 inquiries'
    },
    {
      title: 'Manufacturing Facility — Industrial Zone',
      type: 'Property for Rent',
      tag: 'Manufacturing',
      desc: 'Large warehouse with loading dock, ideal for light manufacturing or logistics.',
      price: '₱120,000/month',
      size: '1800 sqm',
      views: '378 views',
      inquiries: '11 inquiries'
    }
  ];

  // Disable button during load
  btn.disabled = true;
  btn.textContent = 'Loading...';

  // Simulate API delay
  setTimeout(() => {
    moreListings.forEach(listing => {
      const card = document.createElement('article');
      card.className = 'card';
      card.innerHTML = `
        <div class="property-photo" aria-hidden="true"></div>
        <div class="tags"><span class="tag">${listing.type}</span><span class="tag">${listing.tag}</span></div>
        <div style="font-weight:800">${listing.title}</div>
        <div class="muted" style="margin-top:6px;font-size:13px">${listing.desc}</div>
        <div style="font-weight:800;color:var(--accent);margin-top:8px">${listing.price} · ${listing.size}</div>
        <div class="muted" style="margin-top:8px;font-size:13px">${listing.views} · ${listing.inquiries}</div>
        <div style="display:flex;gap:8px;margin-top:12px">
          <button class="btn btn-primary" onclick="openInquiry('${listing.title}')">Send Inquiry</button>
          <button class="btn btn-ghost" onclick="viewDetails('${listing.title}')">View Details</button>
        </div>
      `;
      grid.appendChild(card);
    });

    // Hide button after loading more or show "No more available"
    btn.textContent = 'No more opportunities';
    btn.disabled = true;
    
    // Scroll to opportunities section (top of the listing)
    const opportunitiesSection = document.getElementById('opportunitis');
    if (opportunitiesSection) {
      opportunitiesSection.scrollIntoView({ behavior: 'smooth', block: 'start' });
    }
  }, 600);
}

// attach handlers after DOM ready
document.addEventListener('DOMContentLoaded', () => {
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
  modal.querySelector('.story-modal-backdrop').addEventListener('click', closeStoryModal);
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
