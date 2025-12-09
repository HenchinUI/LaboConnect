// Listings management for user profile
let currentListingStatus = 'approved';
let currentEditingListingId = null;

// Helper function to format property type for display
function formatPropertyType(type) {
  if (!type) return 'Type not set';
  return type
    .replace(/_/g, ' ')
    .split(' ')
    .map(word => word.charAt(0).toUpperCase() + word.slice(1))
    .join(' ');
}

// Initialize listings section
function initListingsSection() {
  setupListingTabs();
  setupEditModal();
  loadListings('approved');
}

// Setup tab switching
function setupListingTabs() {
  const tabs = document.querySelectorAll('.listing-tab');
  tabs.forEach(tab => {
    tab.addEventListener('click', () => {
      // Update active tab styling
      tabs.forEach(t => {
        t.style.borderBottomColor = 'transparent';
      });
      tab.style.borderBottomColor = 'var(--accent)';
      
      const status = tab.dataset.status;
      currentListingStatus = status;
      loadListings(status);
    });
  });
}

// Load listings by status
async function loadListings(status) {
  try {
    const response = await fetch(`/api/my-listings/${status}`);
    if (!response.ok) {
      throw new Error('Failed to load listings');
    }
    
    const listings = await response.json();
    displayListings(listings);
  } catch (err) {
    console.error('Error loading listings:', err);
    showListingsError('Failed to load listings');
  }
}

// Display listings
function displayListings(listings) {
  const container = document.getElementById('listingsContainer');
  const noMessage = document.getElementById('noListingsMessage');
  
  if (!listings || listings.length === 0) {
    container.innerHTML = '';
    noMessage.style.display = 'block';
    return;
  }
  
  noMessage.style.display = 'none';
  container.innerHTML = listings.map(listing => `
    <div style="border: 1px solid var(--border); border-radius: 8px; overflow: hidden; background: var(--surface); display: flex; flex-direction: column;">
      <!-- Image -->
      <div style="width: 100%; height: 150px; background: var(--border); overflow: hidden;">
        ${listing.image_url 
          ? `<img src="${listing.image_url}" alt="${listing.title}" style="width: 100%; height: 100%; object-fit: cover;" />`
          : `<div style="width: 100%; height: 100%; display: flex; align-items: center; justify-content: center; color: var(--text-muted);">No image</div>`
        }
      </div>
      
      <!-- Content -->
      <div style="padding: 15px; flex: 1; display: flex; flex-direction: column;">
        <h3 style="margin: 0 0 8px 0; font-size: 16px; line-height: 1.3;">${listing.title}</h3>
        
        <div style="margin-bottom: 10px;">
          <div style="color: var(--text-muted); font-size: 13px; margin-bottom: 3px;">
            ${formatPropertyType(listing.type)}
          </div>
          <div style="font-size: 16px; font-weight: 600; color: var(--accent);">
            ₱${parseFloat(listing.price).toLocaleString('en-PH', { maximumFractionDigits: 0 })}
          </div>
          ${listing.size_sqm ? `<div style="color: var(--text-muted); font-size: 12px;">${listing.size_sqm} sq m</div>` : ''}
        </div>

        <!-- Status Badge -->
        <div style="margin-bottom: 12px;">
          <span style="display: inline-block; padding: 4px 10px; border-radius: 20px; font-size: 12px; font-weight: 600; 
            ${currentListingStatus === 'approved' ? 'background: #dcfce7; color: #166534;' : ''}
            ${currentListingStatus === 'pending' ? 'background: #fef3c7; color: #92400e;' : ''}
            ${currentListingStatus === 'rejected' ? 'background: #fee2e2; color: #991b1b;' : ''}
          ">
            ${currentListingStatus.charAt(0).toUpperCase() + currentListingStatus.slice(1)}
          </span>
        </div>

        <!-- Rejection Reason (if rejected) -->
        ${currentListingStatus === 'rejected' && listing.rejection_reason ? `
          <div style="background: #fef2f2; border-left: 3px solid #dc2626; padding: 10px; border-radius: 4px; margin-bottom: 12px; font-size: 13px;">
            <strong style="color: #991b1b;">Reason:</strong>
            <div style="color: #7f1d1d; margin-top: 4px;">${listing.rejection_reason}</div>
          </div>
        ` : ''}

        <!-- Actions -->
        <div style="display: flex; gap: 8px; margin-top: auto;">
          <button class="edit-listing-btn" data-listing-id="${listing.id}" style="flex: 1; padding: 8px; background: var(--accent); color: white; border: none; border-radius: 6px; cursor: pointer; font-weight: 500; font-size: 13px;">
            Edit
          </button>
          <button class="view-details-btn" data-listing-id="${listing.id}" style="flex: 1; padding: 8px; background: var(--border); color: var(--text); border: none; border-radius: 6px; cursor: pointer; font-weight: 500; font-size: 13px;">
            Details
          </button>
          <button class="delete-listing-btn" data-listing-id="${listing.id}" style="flex: 0 0 auto; padding: 8px 12px; background: #fecaca; color: #991b1b; border: none; border-radius: 6px; cursor: pointer; font-weight: 500; font-size: 13px;">
            Delete
          </button>
        </div>
      </div>
    </div>
  `).join('');

  // Attach event listeners to edit buttons
  document.querySelectorAll('.edit-listing-btn').forEach(btn => {
    btn.addEventListener('click', (e) => {
      const listingId = e.target.dataset.listingId;
      openEditModal(listingId);
    });
  });

  // Attach event listeners to view buttons
  document.querySelectorAll('.view-details-btn').forEach(btn => {
    btn.addEventListener('click', (e) => {
      const listingId = e.target.dataset.listingId;
      // Navigate to listing detail page (if needed)
      window.location.href = `/components/listing-detail.html?id=${listingId}`;
    });
  });

  // Attach event listeners to delete buttons
  document.querySelectorAll('.delete-listing-btn').forEach(btn => {
    btn.addEventListener('click', async (e) => {
      const listingId = e.target.dataset.listingId;
      if (confirm('Are you sure you want to delete this listing? This action cannot be undone.')) {
        await deleteListing(listingId);
      }
    });
  });
}

// Setup edit modal
function setupEditModal() {
  const modal = document.getElementById('editListingModal');
  const closeBtn = document.getElementById('closeEditModal');
  const cancelBtn = document.getElementById('cancelEditListingBtn');
  const changeImageBtn = document.getElementById('changeImageBtn');
  const imageInput = document.getElementById('editImageInput');
  const form = document.getElementById('editListingForm');

  closeBtn.addEventListener('click', closeEditModal);
  cancelBtn.addEventListener('click', closeEditModal);
  
  changeImageBtn.addEventListener('click', () => {
    imageInput.click();
  });

  imageInput.addEventListener('change', handleImageChange);
  
  form.addEventListener('submit', saveListingChanges);
}

// Open edit modal
async function openEditModal(listingId) {
  currentEditingListingId = listingId;
  
  try {
    // Get the current listing data
    const response = await fetch(`/api/my-listings/${currentListingStatus}`);
    if (!response.ok) throw new Error('Failed to load listing');
    
    const listings = await response.json();
    const listing = listings.find(l => l.id === parseInt(listingId));
    
    if (!listing) {
      showListingsError('Listing not found');
      return;
    }

    // Populate form
    document.getElementById('editTitle').value = listing.title;
    document.getElementById('editDescription').value = listing.description;
    document.getElementById('editType').value = listing.type;
    document.getElementById('editPrice').value = listing.price;
    document.getElementById('editSize').value = listing.size_sqm || '';

    // Show/hide image
    const imagePreview = document.getElementById('editListingImage');
    if (listing.image_url) {
      imagePreview.src = listing.image_url;
      imagePreview.style.display = 'block';
    } else {
      imagePreview.style.display = 'none';
    }

    // Clear any previous image input
    document.getElementById('editImageInput').value = '';
    document.getElementById('imageUploadMessage').innerHTML = '';

    // Show modal
    document.getElementById('editListingModal').style.display = 'flex';
  } catch (err) {
    console.error('Error opening edit modal:', err);
    showListingsError('Failed to load listing details');
  }
}

// Close edit modal
function closeEditModal() {
  document.getElementById('editListingModal').style.display = 'none';
  currentEditingListingId = null;
}

// Handle image change
async function handleImageChange(e) {
  const file = e.target.files[0];
  if (!file) return;

  // Validate file
  if (!file.type.startsWith('image/')) {
    showImageMessage('Please select a valid image file', 'error');
    return;
  }

  if (file.size > 5 * 1024 * 1024) {
    showImageMessage('Image must be smaller than 5MB', 'error');
    return;
  }

  // Show preview
  const reader = new FileReader();
  reader.onload = (e) => {
    document.getElementById('editListingImage').src = e.target.result;
    document.getElementById('editListingImage').style.display = 'block';
  };
  reader.readAsDataURL(file);

  showImageMessage('Ready to upload with changes', 'success');
}

// Save listing changes
async function saveListingChanges(e) {
  e.preventDefault();

  if (!currentEditingListingId) {
    showListingsError('No listing selected');
    return;
  }

  try {
    // First, update listing text fields
    const textData = {
      title: document.getElementById('editTitle').value,
      description: document.getElementById('editDescription').value,
      type: document.getElementById('editType').value,
      price: parseFloat(document.getElementById('editPrice').value),
      size_sqm: document.getElementById('editSize').value ? parseFloat(document.getElementById('editSize').value) : null
    };

    const response = await fetch(`/api/my-listings/${currentEditingListingId}`, {
      method: 'PUT',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(textData)
    });

    if (!response.ok) {
      throw new Error('Failed to update listing');
    }

    // Then, if image was changed, upload it
    const imageInput = document.getElementById('editImageInput');
    if (imageInput.files.length > 0) {
      const formData = new FormData();
      formData.append('image', imageInput.files[0]);

      const imageResponse = await fetch(`/api/my-listings/${currentEditingListingId}/image`, {
        method: 'POST',
        body: formData
      });

      if (!imageResponse.ok) {
        throw new Error('Failed to upload image');
      }
    }

    showListingsMessage('Listing updated successfully!', 'success');
    closeEditModal();
    
    // Reload listings
    await loadListings(currentListingStatus);
  } catch (err) {
    console.error('Error saving listing:', err);
    showListingsError('Failed to save changes');
  }
}

// Delete a listing
async function deleteListing(listingId) {
  try {
    const response = await fetch(`/api/my-listings/${listingId}`, {
      method: 'DELETE'
    });

    if (!response.ok) {
      const data = await response.json();
      showListingsError(data.error || 'Failed to delete listing');
      return;
    }

    showListingsSuccess('Listing deleted successfully');
    await loadListings(currentListingStatus);
  } catch (err) {
    console.error('Error deleting listing:', err);
    showListingsError('Failed to delete listing');
  }
}

// Show messages
function showListingsMessage(message, type = 'success') {
  const container = document.getElementById('profileMessage');
  const className = type === 'success' ? 'success-message' : 'error-message';
  container.innerHTML = `<div class="${className}" style="padding: 12px; border-radius: 6px; margin-bottom: 15px; ${type === 'success' ? 'background: #dcfce7; color: #166534; border: 1px solid #bfdbfe;' : 'background: #fee2e2; color: #991b1b; border: 1px solid #fecaca;'}">${message}</div>`;
  setTimeout(() => {
    container.innerHTML = '';
  }, 4000);
}

function showListingsError(message) {
  showListingsMessage(message, 'error');
}

function showImageMessage(message, type = 'success') {
  const container = document.getElementById('imageUploadMessage');
  container.innerHTML = `<div style="padding: 8px; border-radius: 6px; font-size: 13px; ${type === 'success' ? 'background: #dcfce7; color: #166534;' : 'background: #fee2e2; color: #991b1b;'}">${message}</div>`;
}

// Initialize when DOM is ready
document.addEventListener('DOMContentLoaded', initListingsSection);
