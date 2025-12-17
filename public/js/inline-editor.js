/**
 * Inline Content Editor for System Admins
 * Allows editing text and images directly on the page
 */

class InlineContentEditor {
  constructor() {
    this.isEditMode = false;
    this.currentEditElement = null;
    this.editableElements = new Map(); // Store {element: [handlers]}
    this.originalContent = new Map();
    this.isSaving = false;
    this.toolbar = null;
    this.indicator = null;
    this.editModeDisabled = localStorage.getItem('inline-editor-disabled') === 'true';
  }

  /**
   * Initialize the editor - check if user is system admin and enable editing
   */
  async initialize() {
    try {
      const sessionRes = await fetch('/api/session');
      const sessionData = await sessionRes.json();

      if (!sessionData.user || sessionData.user.admin_role !== 'system_admin') {
        return false; // Not a system admin
      }

      this.enableEditMode();
      return true;
    } catch (err) {
      console.error('Failed to check session:', err);
      return false;
    }
  }

  /**
   * Enable edit mode - add toolbar and make elements editable
   */
  enableEditMode() {
    // Skip if edit mode is disabled via localStorage
    if (this.editModeDisabled) {
      console.log('Edit mode is disabled for this session');
      return;
    }
    
    this.isEditMode = true;
    this.createEditToolbar();
    this.makeElementsEditable();
    this.addEditIndicators();
  }

  /**
   * Create the editing toolbar at the top of the page
   */
  createEditToolbar() {
    const toolbar = document.createElement('div');
    toolbar.id = 'inline-edit-toolbar';
    toolbar.innerHTML = `
      <div style="
        position: fixed;
        top: 0;
        left: 0;
        right: 0;
        background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
        color: white;
        padding: 15px 20px;
        z-index: 10000;
        box-shadow: 0 4px 6px rgba(0, 0, 0, 0.2);
        font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', sans-serif;
      ">
        <div style="max-width: 1400px; margin: 0 auto; display: flex; justify-content: space-between; align-items: center;">
          <div>
            <span style="font-weight: 600; font-size: 16px;">✏️ Edit Mode - Hover over content to edit</span>
            <p style="margin: 5px 0 0 0; font-size: 13px; opacity: 0.9;">Click any text or image to edit • Changes auto-save</p>
          </div>
          <div style="display: flex; gap: 10px;">
            <button id="saveAllBtn" style="
              padding: 10px 20px;
              background: #4CAF50;
              color: white;
              border: none;
              border-radius: 6px;
              cursor: pointer;
              font-weight: 600;
              font-size: 14px;
            ">💾 Save All</button>
            <button id="exitEditBtn" style="
              padding: 10px 20px;
              background: rgba(255,255,255,0.2);
              color: white;
              border: 1px solid rgba(255,255,255,0.4);
              border-radius: 6px;
              cursor: pointer;
              font-weight: 600;
              font-size: 14px;
            ">Exit Edit Mode</button>
          </div>
        </div>
      </div>
    `;
    document.body.insertBefore(toolbar, document.body.firstChild);
    document.body.style.paddingTop = '120px';
    
    // Store reference to toolbar
    this.toolbar = toolbar;

    // Attach event listeners to buttons using IDs
    const saveBtn = document.getElementById('saveAllBtn');
    const exitBtn = document.getElementById('exitEditBtn');

    if (saveBtn) {
      saveBtn.addEventListener('click', () => this.saveAllChanges());
    }

    if (exitBtn) {
      exitBtn.addEventListener('click', () => this.exitEditMode());
    }
  }

  /**
   * Mark all editable elements and make them interactive
   */
  makeElementsEditable() {
    // Make text editable
    const editableTextSelectors = [
      'h1', 'h2', 'h3', 'h4', 'h5', 'h6',
      'p', 'span', 'a',
      '[data-editable="true"]'
    ];

    editableTextSelectors.forEach(selector => {
      document.querySelectorAll(selector).forEach(el => {
        // Skip navigation and scripts
        if (el.closest('nav') || el.closest('header nav') || el.closest('script')) {
          return;
        }

        el.style.cursor = 'pointer';
        
        // Create handler functions and store them for later removal
        const hoverEnterHandler = () => this.addEditHover(el);
        const hoverLeaveHandler = () => this.removeEditHover(el);
        const clickHandler = (e) => {
          e.preventDefault();
          e.stopPropagation();
          this.editText(el);
        };

        el.addEventListener('mouseenter', hoverEnterHandler);
        el.addEventListener('mouseleave', hoverLeaveHandler);
        el.addEventListener('click', clickHandler);
        
        // Store handlers for later removal
        this.editableElements.set(el, {
          hoverEnter: hoverEnterHandler,
          hoverLeave: hoverLeaveHandler,
          click: clickHandler
        });
      });
    });

    // Make images editable
    document.querySelectorAll('img').forEach(img => {
      if (img.closest('nav') || img.closest('script')) {
        return;
      }

      img.style.cursor = 'pointer';
      
      // Create handler functions and store them for later removal
      const hoverEnterHandler = () => this.addEditHover(img);
      const hoverLeaveHandler = () => this.removeEditHover(img);
      const clickHandler = (e) => {
        e.preventDefault();
        e.stopPropagation();
        this.editImage(img);
      };

      img.addEventListener('mouseenter', hoverEnterHandler);
      img.addEventListener('mouseleave', hoverLeaveHandler);
      img.addEventListener('click', clickHandler);
      
      // Store handlers for later removal
      this.editableElements.set(img, {
        hoverEnter: hoverEnterHandler,
        hoverLeave: hoverLeaveHandler,
        click: clickHandler
      });
    });
  }

  /**
   * Add hover effect to indicate element is editable
   */
  addEditHover(el) {
    el.style.outline = '3px dashed #667eea';
    el.style.outlineOffset = '4px';
    el.style.backgroundColor = 'rgba(102, 126, 234, 0.1)';
  }

  /**
   * Remove hover effect
   */
  removeEditHover(el) {
    if (el !== this.currentEditElement) {
      el.style.outline = 'none';
      el.style.backgroundColor = '';
    }
  }

  /**
   * Add visual indicators showing which elements can be edited
   */
  addEditIndicators() {
    // Add corner indicators to show edit mode is active
    const indicator = document.createElement('div');
    indicator.id = 'inline-edit-indicator';
    indicator.style.cssText = `
      position: fixed;
      bottom: 20px;
      right: 20px;
      background: #667eea;
      color: white;
      padding: 12px 16px;
      border-radius: 50px;
      font-size: 12px;
      font-weight: 600;
      z-index: 9999;
      box-shadow: 0 4px 12px rgba(102, 126, 234, 0.4);
    `;
    indicator.textContent = '✏️ EDIT MODE ON';
    document.body.appendChild(indicator);
    
    // Store reference to indicator
    this.indicator = indicator;
  }

  /**
   * Open text editor for an element
   */
  editText(el) {
    // Store original content
    const originalText = el.textContent;

    // Create edit modal
    const modal = document.createElement('div');
    modal.style.cssText = `
      position: fixed;
      top: 0;
      left: 0;
      right: 0;
      bottom: 0;
      background: rgba(0, 0, 0, 0.5);
      display: flex;
      align-items: center;
      justify-content: center;
      z-index: 10001;
    `;

    modal.innerHTML = `
      <div style="
        background: white;
        border-radius: 12px;
        padding: 30px;
        max-width: 600px;
        width: 90%;
        box-shadow: 0 10px 40px rgba(0, 0, 0, 0.3);
      ">
        <h2 style="margin-top: 0; color: #333;">Edit Text</h2>
        <p style="color: #666; font-size: 14px;">Element: <code style="background: #f0f0f0; padding: 2px 6px; border-radius: 3px;">&lt;${el.tagName.toLowerCase()}&gt;</code></p>
        
        <div style="margin-bottom: 20px;">
          <label style="display: block; margin-bottom: 8px; font-weight: 600; color: #333;">New Text:</label>
          <textarea id="textEditInput" style="
            width: 100%;
            padding: 12px;
            border: 1px solid #ddd;
            border-radius: 6px;
            font-family: inherit;
            font-size: 14px;
            resize: vertical;
            min-height: 120px;
          ">${originalText}</textarea>
        </div>
        
        <div style="display: flex; gap: 10px; justify-content: flex-end;">
          <button onclick="document.getElementById('textEditModal').remove()" style="
            padding: 10px 20px;
            border: 1px solid #ddd;
            background: white;
            border-radius: 6px;
            cursor: pointer;
            font-weight: 600;
          ">Cancel</button>
          <button onclick="window.inlineEditor.saveTextEdit(event)" style="
            padding: 10px 20px;
            background: #667eea;
            color: white;
            border: none;
            border-radius: 6px;
            cursor: pointer;
            font-weight: 600;
          ">Save Changes</button>
        </div>
      </div>
    `;

    modal.id = 'textEditModal';
    document.body.appendChild(modal);

    // Store reference to edited element
    this.currentEditElement = el;

    // Focus textarea
    document.getElementById('textEditInput').focus();
  }

  /**
   * Save text edit
   */
  saveTextEdit(event) {
    const newText = document.getElementById('textEditInput').value;
    const modal = document.getElementById('textEditModal');

    if (this.currentEditElement) {
      // Store original for potential rollback
      if (!this.originalContent.has(this.currentEditElement)) {
        this.originalContent.set(this.currentEditElement, this.currentEditElement.textContent);
      }

      // Update element
      this.currentEditElement.textContent = newText;

      // Mark as edited
      this.currentEditElement.style.outline = '3px dashed #4CAF50';
      this.currentEditElement.style.backgroundColor = 'rgba(76, 175, 80, 0.1)';
    }

    modal.remove();
  }

  /**
   * Open image editor for an image element
   */
  editImage(img) {
    const originalSrc = img.src;

    const modal = document.createElement('div');
    modal.style.cssText = `
      position: fixed;
      top: 0;
      left: 0;
      right: 0;
      bottom: 0;
      background: rgba(0, 0, 0, 0.5);
      display: flex;
      align-items: center;
      justify-content: center;
      z-index: 10001;
    `;

    modal.innerHTML = `
      <div style="
        background: white;
        border-radius: 12px;
        padding: 30px;
        max-width: 600px;
        width: 90%;
        box-shadow: 0 10px 40px rgba(0, 0, 0, 0.3);
      ">
        <h2 style="margin-top: 0; color: #333;">Edit Image</h2>
        
        <div style="margin-bottom: 20px;">
          <label style="display: block; margin-bottom: 8px; font-weight: 600; color: #333;">Current Image:</label>
          <img src="${originalSrc}" style="max-width: 100%; max-height: 200px; border-radius: 6px; border: 1px solid #ddd; padding: 4px;">
        </div>
        
        <div style="margin-bottom: 20px;">
          <label style="display: block; margin-bottom: 8px; font-weight: 600; color: #333;">Replace with New Image:</label>
          <input type="file" id="imageUploadInput" accept="image/*" style="
            padding: 10px;
            border: 2px dashed #667eea;
            border-radius: 6px;
            width: 100%;
            cursor: pointer;
          ">
          <p style="font-size: 12px; color: #999; margin-top: 8px;">Or paste image URL:</p>
          <input type="text" id="imageUrlInput" placeholder="https://example.com/image.jpg" style="
            width: 100%;
            padding: 10px;
            border: 1px solid #ddd;
            border-radius: 6px;
            font-size: 14px;
          ">
        </div>
        
        <div style="display: flex; gap: 10px; justify-content: flex-end;">
          <button onclick="document.getElementById('imageEditModal').remove()" style="
            padding: 10px 20px;
            border: 1px solid #ddd;
            background: white;
            border-radius: 6px;
            cursor: pointer;
            font-weight: 600;
          ">Cancel</button>
          <button onclick="window.inlineEditor.saveImageEdit(event)" style="
            padding: 10px 20px;
            background: #667eea;
            color: white;
            border: none;
            border-radius: 6px;
            cursor: pointer;
            font-weight: 600;
          ">Replace Image</button>
        </div>
      </div>
    `;

    modal.id = 'imageEditModal';
    document.body.appendChild(modal);

    // Store reference to edited image
    this.currentEditElement = img;
  }

  /**
   * Save image edit
   */
  saveImageEdit(event) {
    const fileInput = document.getElementById('imageUploadInput');
    const urlInput = document.getElementById('imageUrlInput');
    const modal = document.getElementById('imageEditModal');

    if (fileInput.files && fileInput.files[0]) {
      // File upload
      const reader = new FileReader();
      reader.onload = (e) => {
        if (this.currentEditElement) {
          if (!this.originalContent.has(this.currentEditElement)) {
            this.originalContent.set(this.currentEditElement, this.currentEditElement.src);
          }
          this.currentEditElement.src = e.target.result;
          this.currentEditElement.style.outline = '3px dashed #4CAF50';
        }
        modal.remove();
      };
      reader.readAsDataURL(fileInput.files[0]);
    } else if (urlInput.value.trim()) {
      // URL input
      if (this.currentEditElement) {
        if (!this.originalContent.has(this.currentEditElement)) {
          this.originalContent.set(this.currentEditElement, this.currentEditElement.src);
        }
        this.currentEditElement.src = urlInput.value.trim();
        this.currentEditElement.style.outline = '3px dashed #4CAF50';
      }
      modal.remove();
    } else {
      alert('Please select an image or enter an image URL');
    }
  }

  /**
   * Save all changes to the server
   */
  async saveAllChanges() {
    // Prevent multiple concurrent saves
    if (this.isSaving) {
      console.log('Save already in progress, ignoring duplicate request');
      return;
    }

    this.isSaving = true;

    try {
      const btn = document.getElementById('saveAllBtn');
      if (btn) {
        btn.disabled = true;
        btn.textContent = '⏳ Saving...';
      }

      // Get current HTML content - clone and remove toolbar before saving
      const htmlClone = document.documentElement.cloneNode(true);
      const toolbar = htmlClone.querySelector('#inline-edit-toolbar');
      if (toolbar) {
        toolbar.remove();
      }
      const mainContent = htmlClone.innerHTML;

      // Set a timeout to prevent hanging
      const controller = new AbortController();
      const timeoutId = setTimeout(() => controller.abort(), 30000); // 30 second timeout

      // Send to server
      const response = await fetch('/api/system-admin/content/index', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({ content: mainContent }),
        signal: controller.signal
      });

      clearTimeout(timeoutId);

      if (!response.ok) {
        const errorText = await response.text();
        let errorMsg = 'Failed to save changes';
        try {
          const errorJson = JSON.parse(errorText);
          errorMsg = errorJson.error || errorMsg;
        } catch (e) {
          errorMsg = errorText || errorMsg;
        }
        throw new Error(errorMsg);
      }

      const data = await response.json();
      alert('✅ All changes saved successfully!');
      
      // Reset button state
      if (btn) {
        btn.disabled = false;
        btn.textContent = '💾 Save All';
      }
    } catch (err) {
      console.error('Error saving changes:', err);
      
      // Distinguish between timeout and other errors
      let message = err.message;
      if (err.name === 'AbortError') {
        message = 'Request timeout - server not responding';
      }
      
      alert('❌ Error saving changes: ' + message);
      
      // Reset button state on error
      const btn = document.getElementById('saveAllBtn');
      if (btn) {
        btn.disabled = false;
        btn.textContent = '💾 Save All';
      }
    } finally {
      // Always clear the saving flag
      this.isSaving = false;
    }
  }

  /**
   * Remove all edit mode event listeners
   */
  removeEditListeners() {
    this.editableElements.forEach((handlers, el) => {
      el.removeEventListener('mouseenter', handlers.hoverEnter);
      el.removeEventListener('mouseleave', handlers.hoverLeave);
      el.removeEventListener('click', handlers.click);
      el.style.cursor = 'default';
    });
    this.editableElements.clear();
  }

  /**
   * Exit edit mode
   */
  exitEditMode() {
    if (confirm('Exit edit mode? Any unsaved changes will be lost.')) {
      // Store in localStorage that edit mode is disabled
      localStorage.setItem('inline-editor-disabled', 'true');
      
      // Remove all event listeners from editable elements
      this.removeEditListeners();
      
      // Remove toolbar by reference and by ID
      if (this.toolbar) {
        this.toolbar.remove();
      }
      const toolbarEl = document.getElementById('inline-edit-toolbar');
      if (toolbarEl) {
        toolbarEl.remove();
      }
      
      // Remove indicator by reference and by ID
      if (this.indicator) {
        this.indicator.remove();
      }
      const indicatorEl = document.getElementById('inline-edit-indicator');
      if (indicatorEl) {
        indicatorEl.remove();
      }
      
      // Remove ANY remaining indicators by CSS match
      document.querySelectorAll('div[style*="position: fixed"][style*="bottom: 20px"][style*="right: 20px"]').forEach(el => {
        if (el.textContent.includes('EDIT MODE')) {
          el.remove();
        }
      });
      
      // Remove padding
      document.body.style.paddingTop = '0';
      
      // Remove all edit outlines from elements
      document.querySelectorAll('[style*="outline"]').forEach(el => {
        if (el.style.outline) {
          el.style.outline = '';
          el.style.outlineOffset = '';
          el.style.backgroundColor = '';
        }
      });
      
      // Disable further editing
      this.isEditMode = false;
      this.editModeDisabled = true;
      
      console.log('Edit mode disabled - exit successful');
    }
  }
}

// Initialize editor when page loads - ONLY for system admins
document.addEventListener('DOMContentLoaded', async () => {
  try {
    // Clean up any leftover edit indicators from previous sessions
    const indicatorEl = document.getElementById('inline-edit-indicator');
    if (indicatorEl) {
      indicatorEl.remove();
    }
    
    // Remove any remaining indicators by CSS match
    document.querySelectorAll('div[style*="position: fixed"][style*="bottom: 20px"][style*="right: 20px"]').forEach(el => {
      if (el.textContent.includes('EDIT MODE')) {
        el.remove();
      }
    });
    
    // Check session BEFORE creating editor
    const sessionRes = await fetch('/api/session');
    const sessionData = await sessionRes.json();

    // If user is not a system admin, clear the disabled flag
    if (!sessionData || !sessionData.user || sessionData.user.admin_role !== 'system_admin') {
      localStorage.removeItem('inline-editor-disabled');
      console.log('User is not a system admin, skipping inline editor');
      return;
    }

    // User is a system admin, check if they've disabled edit mode
    const isDisabled = localStorage.getItem('inline-editor-disabled') === 'true';
    
    if (!isDisabled) {
      console.log('✏️ System admin detected, initializing inline editor');
      window.inlineEditor = new InlineContentEditor();
      window.inlineEditor.enableEditMode();
    } else {
      console.log('Edit mode is disabled for this session');
      // Don't initialize, but create a lightweight instance if needed
      window.inlineEditor = new InlineContentEditor();
    }
  } catch (err) {
    console.error('Error initializing inline editor:', err);
  }
});
