/**
 * System Admin Editor Helper Functions
 * Handles content management, section editing, and previews
 */

class SystemAdminEditor {
  constructor() {
    this.fullCode = '';
    this.sections = new Map();
    this.initializeSections();
  }
  
  /**
   * Initialize common editable sections mapping
   */
  initializeSections() {
    this.sections.set('hero-title', {
      selector: '[data-section="hero-title"]',
      description: 'Main headline on homepage',
      searchPattern: /<h1[^>]*class="[^"]*hero[^"]*"[^>]*>([^<]+)<\/h1>/
    });
    
    this.sections.set('hero-subtitle', {
      selector: '[data-section="hero-subtitle"]',
      description: 'Subheading under main title',
      searchPattern: /<h2[^>]*class="[^"]*hero-subtitle[^"]*"[^>]*>([^<]+)<\/h2>/
    });
    
    this.sections.set('why-labo-heading', {
      selector: '[data-section="why-labo-heading"]',
      description: 'Why LaboConnect section heading',
      searchPattern: /Why\s+(?:LaboConnect|Labo)/i
    });
    
    this.sections.set('opportunities-heading', {
      selector: '[data-section="opportunities-heading"]',
      description: 'Investment Opportunities section heading',
      searchPattern: /(?:Investment\s+)?Opportunities/i
    });
    
    this.sections.set('process-heading', {
      selector: '[data-section="process-heading"]',
      description: 'How It Works section heading',
      searchPattern: /How\s+(?:It\s+)?Works/i
    });
    
    this.sections.set('testimonials-heading', {
      selector: '[data-section="testimonials-heading"]',
      description: 'Success Stories section heading',
      searchPattern: /(?:Success\s+)?Stories/i
    });
    
    this.sections.set('faq-heading', {
      selector: '[data-section="faq-heading"]',
      description: 'FAQ section heading',
      searchPattern: /(?:Frequently\s+Asked\s+)?Questions|FAQ/i
    });
  }
  
  /**
   * Extract content between HTML tags
   */
  extractContent(html, pattern) {
    const match = html.match(pattern);
    return match ? match[1].trim() : '';
  }
  
  /**
   * Replace content in HTML
   */
  replaceContent(html, pattern, newContent) {
    return html.replace(pattern, match => {
      return match.replace(/>([^<]+)</, `>${newContent}<`);
    });
  }
  
  /**
   * Generate section preview
   */
  getSectionPreview(sectionId, html) {
    const section = this.sections.get(sectionId);
    if (!section) return '';
    
    const content = this.extractContent(html, section.searchPattern);
    return content || '(Section not found)';
  }
  
  /**
   * Validate HTML for safety
   */
  validateHTML(html) {
    // Check for dangerous patterns
    const dangerousPatterns = [
      /<script/gi,
      /javascript:/gi,
      /on\w+\s*=/gi, // Event handlers like onclick=
      /<iframe/gi,
      /<embed/gi,
      /<object/gi
    ];
    
    for (const pattern of dangerousPatterns) {
      if (pattern.test(html)) {
        return {
          valid: false,
          error: 'HTML contains potentially dangerous content (scripts or event handlers)'
        };
      }
    }
    
    // Check for basic HTML structure
    if (!html.includes('<html') || !html.includes('</html>')) {
      return {
        valid: false,
        error: 'HTML must contain proper <html> tags'
      };
    }
    
    return { valid: true };
  }
  
  /**
   * Minify HTML for comparison/storage
   */
  minifyHTML(html) {
    return html
      .replace(/<!--[\s\S]*?-->/g, '') // Remove comments
      .replace(/\s+/g, ' ') // Collapse whitespace
      .trim();
  }
  
  /**
   * Format HTML for readability
   */
  formatHTML(html) {
    let formatted = '';
    let indent = 0;
    const lines = html.split('>');
    
    for (const line of lines) {
      if (!line.trim()) continue;
      
      if (line.trim().startsWith('</')) {
        indent = Math.max(0, indent - 1);
      }
      
      formatted += '  '.repeat(indent) + line.trim() + '>\n';
      
      if (!line.trim().endsWith('/') && !line.trim().startsWith('</')) {
        indent++;
      }
    }
    
    return formatted;
  }
  
  /**
   * Generate change summary
   */
  getChangeSummary(oldHTML, newHTML) {
    const oldMinified = this.minifyHTML(oldHTML);
    const newMinified = this.minifyHTML(newHTML);
    
    if (oldMinified === newMinified) {
      return 'No changes detected';
    }
    
    const oldSize = oldHTML.length;
    const newSize = newHTML.length;
    const sizeDiff = newSize - oldSize;
    const sizePercent = ((sizeDiff / oldSize) * 100).toFixed(2);
    
    return `Size: ${oldSize} → ${newSize} bytes (${sizeDiff > 0 ? '+' : ''}${sizePercent}%)`;
  }
}

// Export for use in editor
if (typeof module !== 'undefined' && module.exports) {
  module.exports = SystemAdminEditor;
}
