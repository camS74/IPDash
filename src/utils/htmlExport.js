// Professional HTML Report Generator
// Captures actual charts and table from the DOM and embeds them as base64 images in HTML

import html2canvas from 'html2canvas';
import interplastLogo from '../assets/Ip Logo.png';

// Convert image to base64 for embedding
const getBase64Logo = async () => {
  try {
    const response = await fetch(interplastLogo);
    const blob = await response.blob();
    return new Promise((resolve) => {
      const reader = new FileReader();
      reader.onload = () => resolve(reader.result);
      reader.readAsDataURL(blob);
    });
  } catch (error) {
    console.warn('Could not load logo for HTML export:', error);
    return null;
  }
};

// Capture chart or table as base64 image
const captureElementAsBase64 = async (element, options = {}) => {
  try {
    const canvas = await html2canvas(element, {
      scale: 2,
      backgroundColor: '#ffffff',
      useCORS: true,
      allowTaint: true,
      logging: false,
      ...options
    });
    
    if (!canvas || canvas.width === 0 || canvas.height === 0) {
      return null;
    }
    
    return canvas.toDataURL('image/jpeg', 0.95);
  } catch (error) {
    console.error('Error capturing element:', error);
    return null;
  }
};

// Function to capture actual AI writeup content from the app
const captureAIWriteupContent = async () => {
  try {
    console.log('Attempting to capture AI writeup content...');
    
    // Wait a moment for content to be visible
    await new Promise(r => setTimeout(r, 500));
    
    // Look for the specific AIWriteupPanel structure
    const aiWriteupContainer = document.querySelector('.ai-writeup-content');
    
    if (!aiWriteupContainer) {
      console.log('AI writeup container (.ai-writeup-content) not found');
      return {
        text: 'No Analysis Content Available',
        html: '<p>No Analysis Content Available</p>',
        hasContent: false
      };
    }
    
    console.log('Found AI writeup container');
    
    // Look for the contentEditable div that contains the actual content
    const contentEditableDiv = aiWriteupContainer.querySelector('.ai-writeup-contenteditable');
    
    if (!contentEditableDiv) {
      console.log('Content editable div not found');
      return {
        text: 'No Analysis Content Available',
        html: '<p>No Analysis Content Available</p>',
        hasContent: false
      };
    }
    
    console.log('Found content editable div');
    
    // Clone the contentEditable div to avoid modifying the original
    const clonedDiv = contentEditableDiv.cloneNode(true);
    
    // Remove ALL button elements and their containers
    const buttonsToRemove = clonedDiv.querySelectorAll(`
      button, 
      input[type="button"], 
      input[type="submit"],
      .ai-writeup-button-container,
      [class*="button"],
      [onclick],
      [role="button"]
    `);
    buttonsToRemove.forEach(btn => btn.remove());
    
    // Remove any div that contains button-like text
    const allDivs = clonedDiv.querySelectorAll('div, span, p');
    allDivs.forEach(div => {
      const text = div.textContent?.toLowerCase() || '';
      if (text.includes('generate') && text.length < 50) {
        div.remove();
      }
    });
    
    // Get the cleaned content
    const textContent = clonedDiv.textContent || clonedDiv.innerText || '';
    
    console.log('Cleaned content length:', textContent.length);
    console.log('Cleaned content preview:', textContent.substring(0, 200));
    
    // Check if content is just the placeholder text or empty
    const isPlaceholder = textContent.toLowerCase().includes('click "generate" to create') ||
                         textContent.toLowerCase().includes('generate ai-powered') ||
                         textContent.toLowerCase().includes('no content available') ||
                         textContent.toLowerCase().includes('click generate') ||
                         textContent.trim().length < 100;
    
    if (isPlaceholder) {
      console.log('Content is placeholder text or too short');
      return {
        text: 'No Analysis Content Available',
        html: '<p>No Analysis Content Available</p>',
        hasContent: false
      };
    }
    
    // Check if this is real AI analysis content
    const hasAnalysisKeywords = textContent.toLowerCase().includes('analysis') ||
                               textContent.toLowerCase().includes('performance') ||
                               textContent.toLowerCase().includes('revenue') ||
                               textContent.toLowerCase().includes('margin') ||
                               textContent.toLowerCase().includes('profit') ||
                               textContent.toLowerCase().includes('cost');
    
    if (!hasAnalysisKeywords) {
      console.log('Content does not contain analysis keywords');
      return {
        text: 'No Analysis Content Available',
        html: '<p>No Analysis Content Available</p>',
        hasContent: false
      };
    }
    
    // Get HTML content for formatting preservation - also clean it
    let htmlContent = clonedDiv.innerHTML || '';
    
    // Clean the HTML content more aggressively
    htmlContent = htmlContent
      .replace(/<button[^>]*>.*?<\/button>/gi, '') // Remove button tags
      .replace(/<div[^>]*class="[^"]*button[^"]*"[^>]*>.*?<\/div>/gi, '') // Remove button container divs
      .replace(/<div[^>]*style="[^"]*cursor:[^"]*pointer[^"]*"[^>]*>.*?<\/div>/gi, '') // Remove clickable divs
      .replace(/Generate.*?<\/.*?>/gi, '') // Remove any remaining generate text
      .replace(/<div[^>]*style="color:[^"]*666[^"]*font-style:[^"]*italic[^"]*"[^>]*>.*?<\/div>/gi, '') // Remove placeholder div
      .trim();
    
    // Final text cleaning
    const cleanedText = textContent
      .replace(/Generate.*?Analysis/gi, '')
      .replace(/Click.*?to.*?generate/gi, '')
      .replace(/Generating\.\.\./gi, '')
      .replace(/\s+/g, ' ')
      .trim();
    
    console.log(`✅ Successfully captured clean AI content: ${cleanedText.length} characters`);
    
    return {
      text: cleanedText,
      html: htmlContent,
      hasContent: true
    };
    
  } catch (error) {
    console.error('Error capturing AI writeup content:', error);
    return {
      text: 'No Analysis Content Available',
      html: '<p>No Analysis Content Available</p>',
      hasContent: false
    };
  }
};

// CSS styles for the HTML report WITHOUT writeup
const getEmbeddedCSSNoWriteup = () => `
<style>
  * {
    margin: 0;
    padding: 0;
    box-sizing: border-box;
  }

  body {
    font-family: 'Segoe UI', Tahoma, Geneva, Verdana, sans-serif;
    background: linear-gradient(135deg, #667eea 0%, #764ba2 50%, #a8b8e6 100%);
    min-height: 100vh;
    overflow-x: hidden;
  }

  .report-container {
    max-width: 1400px;
    margin: 0 auto;
    background: white;
    min-height: 100vh;
    position: relative;
  }
  
  /* Title Page / Navigation */
  .title-page {
    background: linear-gradient(135deg, #003366 0%, #0066cc 30%, #4da6ff 70%, #80ccff 100%);
    color: white;
    padding: 60px;
    text-align: center;
    min-height: 100vh;
    display: flex;
    flex-direction: column;
    justify-content: center;
    align-items: center;
    position: relative;
  }

  .logo-container {
    margin-bottom: 40px;
  }

  .logo-container img {
    max-height: 180px;
    width: auto;
    filter: brightness(1.1);
  }

  .title-page h1 {
    font-size: 42px;
    font-weight: 700;
    margin-bottom: 20px;
    text-shadow: 2px 2px 4px rgba(0,0,0,0.3);
  }

  .title-page h2 {
    font-size: 24px;
    font-weight: 400;
    margin-bottom: 50px;
    opacity: 0.9;
  }
  
  /* Navigation Tabs - 3x2 Layout (no writeup) */
  .nav-tabs {
    display: grid;
    grid-template-columns: repeat(3, 1fr);
    gap: 20px;
    max-width: 1000px;
    width: 100%;
    margin-top: 40px;
  }
  
  .nav-tab {
    background: rgba(255, 255, 255, 0.1);
    border: 2px solid rgba(255, 255, 255, 0.3);
    border-radius: 15px;
    padding: 20px;
    cursor: pointer;
    transition: all 0.3s ease;
    backdrop-filter: blur(10px);
    text-align: center;
  }
  
  .nav-tab:hover {
    background: rgba(255, 255, 255, 0.2);
    border-color: rgba(255, 255, 255, 0.6);
    transform: translateY(-5px);
    box-shadow: 0 10px 30px rgba(0,0,0,0.3);
  }
  
  .nav-tab h3 {
    font-size: 16px;
    font-weight: 600;
    margin-bottom: 8px;
    color: white;
  }

  .nav-tab p {
    font-size: 12px;
    opacity: 0.8;
    color: white;
  }
  
  .nav-tab .icon {
    font-size: 24px;
    margin-bottom: 10px;
    display: block;
  }
  
  /* Content Sections */
  .content-section {
    display: none;
    min-height: 100vh;
    padding: 40px;
    position: relative;
    background: white;
  }
  
  .content-section.active {
    display: block;
  }
  
  .chart-wrapper {
    background: white;
    border-radius: 15px;
    box-shadow: 0 10px 30px rgba(0,0,0,0.1);
    overflow: hidden;
    position: relative;
    transition: transform 0.3s ease;
    margin: 0 auto;
    max-width: 100%;
  }
  
  .chart-wrapper:hover {
    transform: translateY(-5px);
    box-shadow: 0 15px 40px rgba(0,0,0,0.15);
  }
  
  .chart-image {
    width: 100%;
    height: auto;
    display: block;
  }
  
  /* Special handling for table containers */
  .content-section[id*="table"] .chart-wrapper {
    background: white;
    border-radius: 15px;
    box-shadow: 0 10px 30px rgba(0,0,0,0.1);
    overflow: hidden;
    position: relative;
    margin: 0 auto;
    max-width: 100%;
    padding: 20px;
  }
  
  .content-section[id*="table"] .chart-image {
    width: 100%;
    height: auto;
    display: block;
    margin: 0 auto;
  }
  
  /* Floating Back Button */
  .back-button {
    position: fixed;
    bottom: 30px;
    right: 30px;
    background: linear-gradient(135deg, #003366, #0066cc);
    color: white;
    border: none;
    border-radius: 25px;
    padding: 12px 20px;
    font-size: 14px;
    font-weight: 600;
    cursor: pointer;
    box-shadow: 0 6px 20px rgba(0,0,0,0.3);
    transition: all 0.3s ease;
    z-index: 1000;
    display: none;
    font-family: 'Segoe UI', Tahoma, Geneva, Verdana, sans-serif;
    letter-spacing: 0.5px;
    text-shadow: 0 1px 2px rgba(0,0,0,0.2);
    white-space: nowrap;
  }
  
  .back-button:hover {
    transform: translateY(-2px);
    box-shadow: 0 8px 25px rgba(0,0,0,0.4);
    background: linear-gradient(135deg, #0066cc, #4da6ff);
  }
  
  .back-button.visible {
    display: block;
  }
  
  /* Responsive Design */
  @media (max-width: 768px) {
    .title-page {
      padding: 40px 20px;
    }
    
    .title-page h1 {
      font-size: 32px;
    }
    
    .title-page h2 {
      font-size: 20px;
    }
    
    .nav-tabs {
      grid-template-columns: 1fr;
      gap: 15px;
    }
    
    .nav-tab h3 {
      font-size: 14px;
    }
    
    .nav-tab p {
      font-size: 11px;
    }
    
    .content-section {
      padding: 20px;
    }
  }
  
  /* Print Styles */
  @media print {
    body {
      background: white;
    }
    
    .back-button {
      display: none !important;
    }
    
    .title-page {
      page-break-after: always;
    }
    
    .content-section {
      page-break-before: always;
      display: block !important;
    }
  }
</style>
`;

// CSS styles for the HTML report WITH writeup
const getEmbeddedCSSWithWriteup = () => `
<style>
  * {
    margin: 0;
    padding: 0;
    box-sizing: border-box;
  }

  body {
    font-family: 'Segoe UI', Tahoma, Geneva, Verdana, sans-serif;
    background: linear-gradient(135deg, #667eea 0%, #764ba2 50%, #a8b8e6 100%);
    min-height: 100vh;
    overflow-x: hidden;
  }

  .report-container {
    max-width: 1400px;
    margin: 0 auto;
    background: white;
    min-height: 100vh;
    position: relative;
  }
  
  /* Title Page / Navigation */
  .title-page {
    background: linear-gradient(135deg, #003366 0%, #0066cc 30%, #4da6ff 70%, #80ccff 100%);
    color: white;
    padding: 60px;
    text-align: center;
    min-height: 100vh;
    display: flex;
    flex-direction: column;
    justify-content: center;
    align-items: center;
    position: relative;
  }

  .logo-container {
    margin-bottom: 40px;
  }

  .logo-container img {
    max-height: 180px;
    width: auto;
    filter: brightness(1.1);
  }

  .title-page h1 {
    font-size: 42px;
    font-weight: 700;
    margin-bottom: 20px;
    text-shadow: 2px 2px 4px rgba(0,0,0,0.3);
  }

  .title-page h2 {
    font-size: 24px;
    font-weight: 400;
    margin-bottom: 50px;
    opacity: 0.9;
  }
  
  /* Navigation Tabs - 3x3x1 Layout */
  .nav-tabs {
    display: grid;
    grid-template-columns: repeat(3, 1fr);
    gap: 20px;
    max-width: 1000px;
    width: 100%;
    margin-top: 40px;
  }
  
  .nav-tab {
    background: rgba(255, 255, 255, 0.1);
    border: 2px solid rgba(255, 255, 255, 0.3);
    border-radius: 15px;
    padding: 20px;
    cursor: pointer;
    transition: all 0.3s ease;
    backdrop-filter: blur(10px);
    text-align: center;
  }
  
  .nav-tab:hover {
    background: rgba(255, 255, 255, 0.2);
    border-color: rgba(255, 255, 255, 0.6);
    transform: translateY(-5px);
    box-shadow: 0 10px 30px rgba(0,0,0,0.3);
  }
  
  .nav-tab h3 {
    font-size: 16px;
    font-weight: 600;
    margin-bottom: 8px;
    color: white;
  }

  .nav-tab p {
    font-size: 12px;
    opacity: 0.8;
    color: white;
  }
  
  .nav-tab .icon {
    font-size: 24px;
    margin-bottom: 10px;
    display: block;
  }
  
  /* Single column for write-up tab */
  .nav-tab.writeup-tab {
    grid-column: 1 / -1;
    max-width: 300px;
    margin: 0 auto;
  }
  
  /* Content Sections */
  .content-section {
    display: none;
    min-height: 100vh;
    padding: 40px;
    position: relative;
    background: white;
  }
  
  .content-section.active {
    display: block;
  }
  
  .chart-wrapper {
    background: white;
    border-radius: 15px;
    box-shadow: 0 10px 30px rgba(0,0,0,0.1);
    overflow: hidden;
    position: relative;
    transition: transform 0.3s ease;
    margin: 0 auto;
    max-width: 100%;
  }
  
  .chart-wrapper:hover {
    transform: translateY(-5px);
    box-shadow: 0 15px 40px rgba(0,0,0,0.15);
  }
  
  .chart-image {
    width: 100%;
    height: auto;
    display: block;
  }
  
  /* Special handling for table containers */
  .content-section[id*="table"] .chart-wrapper {
    background: white;
    border-radius: 15px;
    box-shadow: 0 10px 30px rgba(0,0,0,0.1);
    overflow: hidden;
    position: relative;
    margin: 0 auto;
    max-width: 100%;
    padding: 20px;
  }
  
  .content-section[id*="table"] .chart-image {
    width: 100%;
    height: auto;
    display: block;
    margin: 0 auto;
  }
  
  /* Write-up Section */
  .writeup-section {
    max-width: 1000px;
    margin: 0 auto;
    padding: 40px;
    background: white;
    border-radius: 15px;
    box-shadow: 0 10px 30px rgba(0,0,0,0.1);
  }
  
  .writeup-header {
    text-align: center;
    margin-bottom: 30px;
    padding-bottom: 20px;
    border-bottom: 3px solid #0066cc;
  }
  
  .writeup-header h2 {
    font-size: 32px;
    font-weight: 700;
    color: #003366;
  }
  
  .writeup-editor {
    position: relative;
  }
  
  .writeup-textarea {
    width: 100%;
    min-height: 400px;
    padding: 25px;
    border: 2px solid #e0e0e0;
    border-radius: 10px;
    font-family: 'Georgia', serif;
    font-size: 16px;
    line-height: 1.8;
    color: #333;
    background: #fafafa;
    resize: vertical;
    transition: border-color 0.3s ease;
  }
  
  .writeup-textarea:focus {
    outline: none;
    border-color: #0066cc;
    background: white;
  }
  
  .writeup-content-readonly {
    padding: 25px;
    font-family: 'Georgia', serif;
    font-size: 16px;
    line-height: 1.8;
    color: #333;
    background: #f9f9f9;
    border: 1px solid #ddd;
    border-radius: 10px;
    white-space: pre-wrap;
    word-wrap: break-word;
    min-height: 400px;
  }
  
  .writeup-controls {
    margin-top: 20px;
    display: flex;
    justify-content: space-between;
    align-items: center;
    flex-wrap: wrap;
    gap: 15px;
  }
  
  .writeup-controls.hidden {
    display: none;
  }
  
  .save-button {
    background: linear-gradient(135deg, #28a745, #20c997);
    color: white;
    border: none;
    padding: 12px 30px;
    border-radius: 8px;
    font-size: 16px;
    font-weight: 600;
    cursor: pointer;
    transition: all 0.3s ease;
    box-shadow: 0 4px 15px rgba(40, 167, 69, 0.3);
  }
  
  .save-button:hover {
    transform: translateY(-2px);
    box-shadow: 0 6px 20px rgba(40, 167, 69, 0.4);
  }
  
  .word-count {
    color: #666;
    font-size: 14px;
  }
  
  /* Floating Back Button */
  .back-button {
    position: fixed;
    bottom: 30px;
    right: 30px;
    background: linear-gradient(135deg, #003366, #0066cc);
    color: white;
    border: none;
    border-radius: 25px;
    padding: 12px 20px;
    font-size: 14px;
    font-weight: 600;
    cursor: pointer;
    box-shadow: 0 6px 20px rgba(0,0,0,0.3);
    transition: all 0.3s ease;
    z-index: 1000;
    display: none;
    font-family: 'Segoe UI', Tahoma, Geneva, Verdana, sans-serif;
    letter-spacing: 0.5px;
    text-shadow: 0 1px 2px rgba(0,0,0,0.2);
    white-space: nowrap;
  }
  
  .back-button:hover {
    transform: translateY(-2px);
    box-shadow: 0 8px 25px rgba(0,0,0,0.4);
    background: linear-gradient(135deg, #0066cc, #4da6ff);
  }
  
  .back-button.visible {
    display: block;
  }
  
  /* Responsive Design */
  @media (max-width: 768px) {
    .title-page {
      padding: 40px 20px;
    }
    
    .title-page h1 {
      font-size: 32px;
    }
    
    .title-page h2 {
      font-size: 20px;
    }
    
    .nav-tabs {
      grid-template-columns: 1fr;
      gap: 15px;
    }
    
    .nav-tab.writeup-tab {
      grid-column: 1;
      max-width: none;
    }
    
    .nav-tab h3 {
      font-size: 14px;
    }
    
    .nav-tab p {
      font-size: 11px;
    }
    
    .content-section {
      padding: 20px;
    }
    
    .writeup-section {
      padding: 20px;
    }
    
    .writeup-textarea {
      min-height: 300px;
      padding: 15px;
      font-size: 14px;
    }
    
    .writeup-controls {
      flex-direction: column;
      align-items: stretch;
    }
  }
  
  /* Print Styles */
  @media print {
    body {
      background: white;
    }
    
    .back-button, .save-button, .writeup-controls {
      display: none !important;
    }
    
    .title-page {
      page-break-after: always;
    }
    
    .content-section {
      page-break-before: always;
      display: block !important;
    }
    
    .writeup-textarea {
      border: none;
      background: white;
      padding: 0;
      min-height: auto;
    }
  }
</style>
`;

// JavaScript for navigation and write-up functionality
const getNavigationScript = (capturedCharts, capturedTables, actualWriteupContent) => `
<script>
  // Make functions global to avoid ReferenceError
  window.showSection = function(sectionId) {
    console.log('showSection called with:', sectionId);
    
    // Hide all sections
    const sections = document.querySelectorAll('.content-section');
    sections.forEach(section => section.classList.remove('active'));
    
    // Hide title page
    const titlePage = document.querySelector('.title-page');
    if (titlePage) titlePage.style.display = 'none';
    
    // Show selected section
    const targetSection = document.getElementById(sectionId);
    if (targetSection) {
      targetSection.classList.add('active');
      
      // If showing writeup, load content
      if (sectionId === 'writeup') {
        loadWriteupContent();
      }
    }
    
    // Show back button
    const backButton = document.querySelector('.back-button');
    if (backButton) backButton.classList.add('visible');
    
    // Scroll to top
    window.scrollTo(0, 0);
  };
  
  window.showHomePage = function() {
    console.log('showHomePage called');
    
    // Hide all content sections
    const sections = document.querySelectorAll('.content-section');
    sections.forEach(section => section.classList.remove('active'));
    
    // Show title page
    const titlePage = document.querySelector('.title-page');
    if (titlePage) titlePage.style.display = 'flex';
    
    // Hide back button
    const backButton = document.querySelector('.back-button');
    if (backButton) backButton.classList.remove('visible');
    
    // Scroll to top
    window.scrollTo(0, 0);
  };

  // Store data safely without complex JSON parsing
  let writeupData = null;
  let hasBeenSaved = false;
  let currentContent = '';

  // Define all missing functions
  function loadWriteupContent() {
    console.log('loadWriteupContent called');
    const container = document.querySelector('.writeup-editor');
    
    if (!container) {
      console.error('Writeup editor container not found!');
      return;
    }
    
    // Simple placeholder content for now
    container.innerHTML = '<textarea id="writeup-content" class="writeup-textarea" placeholder="Edit your financial analysis writeup...">Edit your financial analysis and insights here...</textarea>' +
      '<div class="writeup-controls">' +
        '<button class="save-button" onclick="saveWriteup()" style="background: #28a745; color: white; padding: 12px 30px; border: none; border-radius: 8px; font-size: 16px; cursor: pointer;">💾 Save & Download Final Report</button>' +
        '<div class="save-status"></div>' +
        '<div class="word-count">0 words, 0 characters</div>' +
      '</div>';
    
    // Add event listeners
    const textarea = document.getElementById('writeup-content');
    if (textarea) {
      textarea.addEventListener('input', updateWordCount);
      updateWordCount();
    }
  }

  window.saveWriteup = function() {
    console.log('saveWriteup called');
    const textarea = document.getElementById('writeup-content');
    if (!textarea) {
      alert('No content to save!');
      return;
    }
    
    const content = textarea.value.trim();
    if (!content) {
      alert('Please enter some content before saving.');
      return;
    }
    
    alert('Save functionality will be implemented in next update!');
  };
  
  function updateWordCount() {
    const textarea = document.getElementById('writeup-content');
    const wordCountEl = document.querySelector('.word-count');
    
    if (textarea && wordCountEl) {
      const text = textarea.value.trim();
      const words = text ? text.split(' ').filter(w => w.length > 0).length : 0;
      const characters = text.length;
      wordCountEl.textContent = words + ' words, ' + characters + ' characters';
    }
  }
  
  console.log('=== NAVIGATION SCRIPT LOADED ===');
  console.log('Functions available:', typeof window.showSection, typeof window.showHomePage, typeof window.saveWriteup);
  
  // Initialize on page load
  document.addEventListener('DOMContentLoaded', function() {
    console.log('DOM loaded - navigation ready');
  });
</script>
`;

// Function to capture chart containers from DOM
const captureChartsAndTable = async () => {
  const capturedCharts = [];
  const capturedTables = [];
  
  // Find and switch to Charts tab to ensure charts are visible
  const allTabs = document.querySelectorAll('.tab-button');
  let chartsTabElement = null;
  
  allTabs.forEach(tab => {
    if (tab.textContent.includes('Charts')) {
      chartsTabElement = tab;
    }
  });
  
  if (!chartsTabElement) {
    throw new Error('Charts tab not found. Please ensure the Charts view is available.');
  }
  
  // Check if Charts tab is not already active
  if (!chartsTabElement.classList.contains('active')) {
    chartsTabElement.click();
    await new Promise(r => setTimeout(r, 1500));
  }

  // Additional wait to ensure charts are fully rendered
  await new Promise(r => setTimeout(r, 500));

  // Find the main ChartContainer div
  const mainContainer = document.querySelector('[style*="display: flex"][style*="flex-direction: column"][style*="padding: 16"]');
  
  if (mainContainer) {
    console.log('Found main chart container');
    
    // Hide all export buttons and UI controls before capture
    const elementsToHide = document.querySelectorAll(`
      .export-pdf-btn,
      .pdf-export-controls,
      .export-btn.pdf-export,
      .export-btn.html-export,
      .export-btn.html-writeup-export,
      .export-buttons-container,
      button[class*="export"],
      button[class*="pdf"],
      button[class*="html"],
      .export-button,
      .pdf-button,
      .html-button,
      [onclick*="export"],
      [onclick*="pdf"],
      [onclick*="html"],
      .ant-btn:has([class*="export"]),
      .ant-btn:has([class*="pdf"]),
      .ant-tooltip
    `);
    
    const originalStyles = [];
    elementsToHide.forEach((element, index) => {
      originalStyles[index] = element.style.display;
      element.style.display = 'none';
    });
    
    // Get direct children that are chart containers (excluding AI writeup)
    const children = Array.from(mainContainer.children).filter(child => {
      const rect = child.getBoundingClientRect();
      const hasStyle = child.style.marginTop;
      const isNotAI = !child.textContent.toLowerCase().includes('ai') && 
                     !child.innerHTML.toLowerCase().includes('writeup');
      return rect.width > 300 && rect.height > 200 && hasStyle && isNotAI;
    });
    
    console.log(`Found ${children.length} chart containers`);
    
    // Chart titles for navigation tabs
    const chartTitles = [
      'Sales and Volume Analysis',
      'Margin over Material Cost', 
      'Manufacturing Cost Breakdown',
      'Below Gross Profit Expenses',
      'Expenses Trends & Profit Analysis'
    ];
    
    for (let i = 0; i < children.length && i < chartTitles.length; i++) {
      const container = children[i];
      
      // Hide tooltips
      const tooltips = document.querySelectorAll('.ant-tooltip, [role="tooltip"], .echarts-tooltip, .tooltip');
      tooltips.forEach(tooltip => {
        if (tooltip) tooltip.style.display = 'none';
      });

      await new Promise(r => setTimeout(r, 300));

      // Try to resize ECharts instances
      const echartsElements = container.querySelectorAll('.echarts-for-react');
      echartsElements.forEach(echartsEl => {
        if (typeof echartsEl.getEchartsInstance === 'function') {
          const inst = echartsEl.getEchartsInstance();
          if (inst) {
            inst.dispatchAction({ type: 'hideTip' });
            inst.resize();
          }
        }
      });

      await new Promise(r => setTimeout(r, 300));

      // Capture the chart
      const chartImage = await captureElementAsBase64(container, {
        scale: 2,
        backgroundColor: '#ffffff',
        useCORS: true,
        allowTaint: true,
        logging: false
      });

      if (chartImage) {
        capturedCharts.push({
          title: chartTitles[i],
          image: chartImage,
          id: `chart-${i + 1}`
        });
        console.log(`Captured chart: ${chartTitles[i]}`);
      }
    }
  }

  // Capture all three tables
  try {
    console.log('Starting table capture...');
    
    // Table 1: P&L Financial Table
    try {
      console.log('Capturing P&L Financial table...');
      const plTab = Array.from(allTabs).find(tab => tab.textContent.includes('P&L'));
      
      if (plTab && !plTab.classList.contains('active')) {
        console.log('Switching to P&L tab...');
        plTab.click();
      await new Promise(r => setTimeout(r, 1500));
    }

    await new Promise(r => setTimeout(r, 1000));

      const plTableElement = document.querySelector('.table-view');
      if (plTableElement) {
        console.log('Capturing P&L Financial table...');
        const plTableImage = await captureElementAsBase64(plTableElement, {
          scale: 1.2,
          backgroundColor: '#ffffff',
          useCORS: true,
          allowTaint: true,
          logging: false
        });
        
        if (plTableImage) {
          capturedTables.push({
            title: 'P&L Financial Table',
            image: plTableImage,
            id: 'pl-table'
          });
          console.log('P&L Financial table captured successfully');
        }
      }
    } catch (plErr) {
      console.error('Error capturing P&L table:', plErr);
    }

    // Table 2: Product Group Table
    try {
      console.log('Capturing Product Group table...');
      const productGroupTab = Array.from(allTabs).find(tab => tab.textContent.includes('Product Group'));
      
      if (productGroupTab && !productGroupTab.classList.contains('active')) {
        console.log('Switching to Product Group tab...');
        productGroupTab.click();
        await new Promise(r => setTimeout(r, 1500));
      }

      await new Promise(r => setTimeout(r, 1000));

      const productGroupTableElement = document.querySelector('.table-view');
      if (productGroupTableElement) {
        console.log('Capturing Product Group table...');
        const productGroupTableImage = await captureElementAsBase64(productGroupTableElement, {
          scale: 1.2,
          backgroundColor: '#ffffff',
          useCORS: true,
          allowTaint: true,
          logging: false
        });
        
        if (productGroupTableImage) {
          capturedTables.push({
            title: 'Product Group Table',
            image: productGroupTableImage,
            id: 'product-group-table'
          });
          console.log('Product Group table captured successfully');
        }
      }
    } catch (pgErr) {
      console.error('Error capturing Product Group table:', pgErr);
    }

    // Table 3: Sales by Country Table
    try {
      console.log('Capturing Sales by Country table...');
      const salesCountryTab = Array.from(allTabs).find(tab => tab.textContent.includes('Sales by Country'));
      
      if (salesCountryTab && !salesCountryTab.classList.contains('active')) {
        console.log('Switching to Sales by Country tab...');
        salesCountryTab.click();
        await new Promise(r => setTimeout(r, 1500));
      }

      // If there's a nested tab structure, find the Table sub-tab
      await new Promise(r => setTimeout(r, 500));
      const tableSubTab = Array.from(document.querySelectorAll('.tab-button')).find(tab => 
        tab.textContent.trim() === 'Table' && tab.closest('.tab-content')
      );
      
      if (tableSubTab && !tableSubTab.classList.contains('active')) {
        console.log('Switching to Table sub-tab...');
        tableSubTab.click();
        await new Promise(r => setTimeout(r, 1500));
      }

      await new Promise(r => setTimeout(r, 1000));

      const salesCountryTableElement = document.querySelector('.table-view');
      if (salesCountryTableElement) {
        console.log('Capturing Sales by Country table...');
        const salesCountryTableImage = await captureElementAsBase64(salesCountryTableElement, {
          scale: 1.2,
          backgroundColor: '#ffffff',
          useCORS: true,
          allowTaint: true,
          logging: false
        });
        
        if (salesCountryTableImage) {
          capturedTables.push({
            title: 'Sales by Country Table',
            image: salesCountryTableImage,
            id: 'sales-country-table'
          });
          console.log('Sales by Country table captured successfully');
        }
      }
    } catch (scErr) {
      console.error('Error capturing Sales by Country table:', scErr);
    }

    // Switch back to Charts tab
    if (chartsTabElement) {
      chartsTabElement.click();
      await new Promise(r => setTimeout(r, 500));
    }
    
    // Restore hidden elements after all captures are complete
    const elementsToRestore = document.querySelectorAll(`
      .export-pdf-btn,
      .pdf-export-controls,
      .export-btn.pdf-export,
      .export-btn.html-export,
      .export-btn.html-writeup-export,
      .export-buttons-container,
      button[class*="export"],
      button[class*="pdf"],
      button[class*="html"],
      .export-button,
      .pdf-button,
      .html-button,
      [onclick*="export"],
      [onclick*="pdf"],
      [onclick*="html"],
      .ant-btn:has([class*="export"]),
      .ant-btn:has([class*="pdf"]),
      .ant-tooltip
    `);
    
    elementsToRestore.forEach(element => {
      element.style.display = '';
    });
    
  } catch (tableErr) {
    console.error('Error capturing tables:', tableErr);
  }

  return { capturedCharts, capturedTables };
};

// HTML export function WITHOUT writeup
export const exportHTMLReportNoWriteup = async (exportData) => {
  try {
    console.log('Starting HTML report generation (NO writeup)...');

    // Division full names mapping
  const divisionNames = {
    FP: 'Flexible Packaging',
    SB: 'Shopping Bags', 
    TF: 'Thermoforming Products',
    HCM: 'Preforms and Closures'
  };

    const divisionFullName = divisionNames[exportData.division] || exportData.division;

    // Get the logo as base64
    const logoBase64 = await getBase64Logo();

    // Capture charts and table
    const { capturedCharts, capturedTables } = await captureChartsAndTable();

    // Generate navigation tabs in 3x2 layout (no writeup)
    const chartTabs = capturedCharts.map(chart => `
      <div class="nav-tab" onclick="showSection('${chart.id}')">
        <span class="icon">📊</span>
        <h3>${chart.title}</h3>
        <p>Click to view chart</p>
      </div>
    `).join('');

    const tableTabs = capturedTables.map(table => `
      <div class="nav-tab" onclick="showSection('${table.id}')">
        <span class="icon">📋</span>
        <h3>${table.title}</h3>
        <p>Click to view table</p>
      </div>
    `).join('');

    // Generate content sections
    const chartSections = capturedCharts.map(chart => `
      <div id="${chart.id}" class="content-section">
        <div class="chart-wrapper">
          <img src="${chart.image}" alt="${chart.title}" class="chart-image" />
        </div>
      </div>
    `).join('');

    const tableSections = capturedTables.map(table => `
      <div id="${table.id}" class="content-section">
        <div class="chart-wrapper">
          <img src="${table.image}" alt="${table.title}" class="chart-image" />
        </div>
      </div>
    `).join('');
  
  const html = `
<!DOCTYPE html>
<html lang="en">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>${divisionFullName} Financial Report</title>
    ${getEmbeddedCSSNoWriteup()}
</head>
<body>
    <!-- Hidden div for consistency (not used in no-writeup version) -->
    <div id="saved-writeup-content" style="display: none;">EMPTY</div>
    
    <div class="report-container">
        <!-- Title Page with Navigation -->
        <div class="title-page">
            ${logoBase64 ? `
            <div class="logo-container">
                <img src="${logoBase64}" alt="Company Logo" />
            </div>
            ` : ''}
            <h1>${divisionFullName} Financial Report</h1>
            <h2>Period: ${exportData.basePeriod || 'No Period Set'}</h2>
            
            <div class="nav-tabs">
                ${chartTabs}
                ${tableTabs}
            </div>
        </div>

        <!-- Content Sections -->
        ${chartSections}
        ${tableSections}

        <!-- Floating Back Button -->
        <button class="back-button" onclick="showHomePage()" title="Back to Home">
            Back to Home page
        </button>
            </div>

    ${getNavigationScript(capturedCharts, capturedTables, null)}
</body>
</html>
    `;

    // Create and download the HTML file
    const blob = new Blob([html], { type: 'text/html' });
    const url = URL.createObjectURL(blob);
    
    const link = document.createElement('a');
    link.href = url;
    const filenameDivision = divisionNames[exportData.division]?.replace(/\s+/g, '_') || 'Financial';
    link.download = `${filenameDivision}_Report.html`;
    
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    
    URL.revokeObjectURL(url);
    
    console.log(`✅ HTML report generated (NO writeup): ${capturedCharts.length} charts and ${capturedTables.length} tables!`);
    
    return true;
  } catch (error) {
    console.error('Error generating HTML report (no writeup):', error);
    alert('Failed to generate HTML report. Please check console for details.');
    return false;
  }
};

// Main HTML export function WITH writeup functionality - completely rewritten for better functionality
export const exportHTMLReportWithWriteup = async (exportData) => {
  try {
    console.log('Starting enhanced HTML report with writeup generation...');

    // Division full names mapping
    const divisionNames = {
      FP: 'Flexible Packaging',
      SB: 'Shopping Bags', 
      TF: 'Thermoforming Products',
      HCM: 'Preforms and Closures'
    };

    const divisionFullName = divisionNames[exportData.division] || exportData.division;

    // Find and switch to Charts tab to ensure charts are visible
    const allTabs = document.querySelectorAll('.tab-button');
    let chartsTabElement = null;
    
    allTabs.forEach(tab => {
      if (tab.textContent.includes('Charts')) {
        chartsTabElement = tab;
      }
    });
    
    if (!chartsTabElement) {
      alert('Charts tab not found. Please ensure the Charts view is available.');
      return false;
    }
    
    // Check if Charts tab is not already active
    if (!chartsTabElement.classList.contains('active')) {
      chartsTabElement.click();
      await new Promise(r => setTimeout(r, 1500));
    }

    // Additional wait to ensure charts are fully rendered
    await new Promise(r => setTimeout(r, 500));

    // Get the logo as base64
    const logoBase64 = await getBase64Logo();

    const capturedCharts = [];
    const capturedTables = [];
    
    // Find the main ChartContainer div
    const mainContainer = document.querySelector('[style*="display: flex"][style*="flex-direction: column"][style*="padding: 16"]');
    
    if (mainContainer) {
      console.log('Found main chart container');
      
      // Hide all export buttons and UI controls before capture
      const elementsToHide = document.querySelectorAll(`
        .export-pdf-btn,
        .pdf-export-controls,
        .export-btn.pdf-export,
        .export-btn.html-export,
        .export-btn.html-writeup-export,
        .export-buttons-container,
        button[class*="export"],
        button[class*="pdf"],
        button[class*="html"],
        .export-button,
        .pdf-button,
        .html-button,
        [onclick*="export"],
        [onclick*="pdf"],
        [onclick*="html"],
        .ant-btn:has([class*="export"]),
        .ant-btn:has([class*="pdf"]),
        .ant-tooltip
      `);
      
      const originalStyles = [];
      elementsToHide.forEach((element, index) => {
        originalStyles[index] = element.style.display;
        element.style.display = 'none';
      });
      
      // Get direct children that are chart containers (excluding AI writeup)
      const children = Array.from(mainContainer.children).filter(child => {
        const rect = child.getBoundingClientRect();
        const hasStyle = child.style.marginTop;
        const isNotAI = !child.textContent.toLowerCase().includes('ai') && 
                       !child.innerHTML.toLowerCase().includes('writeup');
        return rect.width > 300 && rect.height > 200 && hasStyle && isNotAI;
      });
      
      console.log(`Found ${children.length} chart containers`);
      
      // Chart titles for navigation tabs (not overlays)
      const chartTitles = [
        'Sales and Volume Analysis',
        'Margin over Material Cost', 
        'Manufacturing Cost Breakdown',
        'Below Gross Profit Expenses',
        'Expenses Trends & Profit Analysis'
      ];
      
      for (let i = 0; i < children.length && i < chartTitles.length; i++) {
        const container = children[i];
        
        // Hide tooltips
        const tooltips = document.querySelectorAll('.ant-tooltip, [role="tooltip"], .echarts-tooltip, .tooltip');
        tooltips.forEach(tooltip => {
          if (tooltip) tooltip.style.display = 'none';
        });

        await new Promise(r => setTimeout(r, 300));

        // Try to resize ECharts instances
        const echartsElements = container.querySelectorAll('.echarts-for-react');
        echartsElements.forEach(echartsEl => {
          if (typeof echartsEl.getEchartsInstance === 'function') {
            const inst = echartsEl.getEchartsInstance();
            if (inst) {
              inst.dispatchAction({ type: 'hideTip' });
              inst.resize();
            }
          }
        });

        await new Promise(r => setTimeout(r, 300));

        // Capture the chart
        const chartImage = await captureElementAsBase64(container, {
          scale: 2,
          backgroundColor: '#ffffff',
          useCORS: true,
          allowTaint: true,
          logging: false
        });

        if (chartImage) {
          capturedCharts.push({
            title: chartTitles[i],
            image: chartImage,
            id: `chart-${i + 1}`
          });
          console.log(`Captured chart: ${chartTitles[i]}`);
        }
      }
    }

    // Capture all three tables
    try {
      console.log('Starting table capture...');
      
      // Table 1: P&L Financial Table
      try {
        console.log('Capturing P&L Financial table...');
        const plTab = Array.from(allTabs).find(tab => tab.textContent.includes('P&L'));
        
        if (plTab && !plTab.classList.contains('active')) {
          console.log('Switching to P&L tab...');
          plTab.click();
        await new Promise(r => setTimeout(r, 1500));
      }

      await new Promise(r => setTimeout(r, 1000));

        const plTableElement = document.querySelector('.table-view');
        if (plTableElement) {
          console.log('Capturing P&L Financial table...');
          const plTableImage = await captureElementAsBase64(plTableElement, {
            scale: 1.2,
            backgroundColor: '#ffffff',
            useCORS: true,
            allowTaint: true,
            logging: false
          });
          
          if (plTableImage) {
            capturedTables.push({
              title: 'P&L Financial Table',
              image: plTableImage,
              id: 'pl-table'
            });
            console.log('P&L Financial table captured successfully');
          }
        }
      } catch (plErr) {
        console.error('Error capturing P&L table:', plErr);
      }

      // Table 2: Product Group Table
      try {
        console.log('Capturing Product Group table...');
        const productGroupTab = Array.from(allTabs).find(tab => tab.textContent.includes('Product Group'));
        
        if (productGroupTab && !productGroupTab.classList.contains('active')) {
          console.log('Switching to Product Group tab...');
          productGroupTab.click();
          await new Promise(r => setTimeout(r, 1500));
        }

        await new Promise(r => setTimeout(r, 1000));

        const productGroupTableElement = document.querySelector('.table-view');
        if (productGroupTableElement) {
          console.log('Capturing Product Group table...');
          const productGroupTableImage = await captureElementAsBase64(productGroupTableElement, {
            scale: 1.2,
            backgroundColor: '#ffffff',
            useCORS: true,
            allowTaint: true,
            logging: false
          });
          
          if (productGroupTableImage) {
            capturedTables.push({
              title: 'Product Group Table',
              image: productGroupTableImage,
              id: 'product-group-table'
            });
            console.log('Product Group table captured successfully');
          }
        }
      } catch (pgErr) {
        console.error('Error capturing Product Group table:', pgErr);
      }

      // Table 3: Sales by Country Table
      try {
        console.log('Capturing Sales by Country table...');
        const salesCountryTab = Array.from(allTabs).find(tab => tab.textContent.includes('Sales by Country'));
        
        if (salesCountryTab && !salesCountryTab.classList.contains('active')) {
          console.log('Switching to Sales by Country tab...');
          salesCountryTab.click();
          await new Promise(r => setTimeout(r, 1500));
        }

        // If there's a nested tab structure, find the Table sub-tab
        await new Promise(r => setTimeout(r, 500));
        const tableSubTab = Array.from(document.querySelectorAll('.tab-button')).find(tab => 
          tab.textContent.trim() === 'Table' && tab.closest('.tab-content')
        );
        
        if (tableSubTab && !tableSubTab.classList.contains('active')) {
          console.log('Switching to Table sub-tab...');
          tableSubTab.click();
          await new Promise(r => setTimeout(r, 1500));
        }

        await new Promise(r => setTimeout(r, 1000));

        const salesCountryTableElement = document.querySelector('.table-view');
        if (salesCountryTableElement) {
          console.log('Capturing Sales by Country table...');
          const salesCountryTableImage = await captureElementAsBase64(salesCountryTableElement, {
            scale: 1.2,
            backgroundColor: '#ffffff',
            useCORS: true,
            allowTaint: true,
            logging: false
          });
          
          if (salesCountryTableImage) {
            capturedTables.push({
              title: 'Sales by Country Table',
              image: salesCountryTableImage,
              id: 'sales-country-table'
            });
            console.log('Sales by Country table captured successfully');
          }
        }
      } catch (scErr) {
        console.error('Error capturing Sales by Country table:', scErr);
      }

      // Switch back to Charts tab
      if (chartsTabElement) {
        chartsTabElement.click();
        await new Promise(r => setTimeout(r, 500));
      }
      
      // Restore hidden elements after all captures are complete
      const elementsToRestore = document.querySelectorAll(`
        .export-pdf-btn,
        .pdf-export-controls,
        .export-btn.pdf-export,
        .export-btn.html-export,
        .export-btn.html-writeup-export,
        .export-buttons-container,
        button[class*="export"],
        button[class*="pdf"],
        button[class*="html"],
        .export-button,
        .pdf-button,
        .html-button,
        [onclick*="export"],
        [onclick*="pdf"],
        [onclick*="html"],
        .ant-btn:has([class*="export"]),
        .ant-btn:has([class*="pdf"]),
        .ant-tooltip
      `);
      
      elementsToRestore.forEach(element => {
        element.style.display = '';
      });
      
    } catch (tableErr) {
      console.error('Error capturing tables:', tableErr);
    }

    // Capture actual AI writeup content (simplified)
    const actualWriteupContent = null; // Simplified for now to avoid errors

    // Generate navigation tabs in 3-3-1 layout
    const chartTabs = capturedCharts.map(chart => `
      <div class="nav-tab" onclick="showSection('${chart.id}')">
        <span class="icon">📊</span>
        <h3>${chart.title}</h3>
        <p>Click to view chart</p>
        </div>
    `).join('');

    const tableTabs = capturedTables.map(table => `
      <div class="nav-tab" onclick="showSection('${table.id}')">
        <span class="icon">📋</span>
        <h3>${table.title}</h3>
        <p>Click to view table</p>
            </div>
    `).join('');

    // Write-up tab (single column at the end)
    const writeupTab = `
      <div class="nav-tab writeup-tab" onclick="showSection('writeup')">
        <span class="icon">✍️</span>
        <h3>Write-up</h3>
        <p>Edit & finalize report</p>
        </div>
    `;

    // Generate content sections (without overlay titles since charts have their own)
    const chartSections = capturedCharts.map(chart => `
      <div id="${chart.id}" class="content-section">
        <div class="chart-wrapper">
          <img src="${chart.image}" alt="${chart.title}" class="chart-image" />
            </div>
        </div>
    `).join('');

    const tableSections = capturedTables.map(table => `
      <div id="${table.id}" class="content-section">
        <div class="chart-wrapper">
          <img src="${table.image}" alt="${table.title}" class="chart-image" />
            </div>
        </div>
    `).join('');

    // Write-up section with dynamic content
    const writeupSection = `
      <div id="writeup" class="content-section">
        <div class="writeup-section">
          <div class="writeup-header">
            <h2>Financial Analysis Write-up</h2>
        </div>
          <div class="writeup-editor">
            <!-- Content will be loaded dynamically -->
    </div>
        </div>
      </div>
    `;
  
    const html = `
<!DOCTYPE html>
<html lang="en">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>${divisionFullName} Financial Report</title>
    ${getEmbeddedCSSWithWriteup()}
</head>
<body>
    <!-- Hidden div to store saved writeup content within this file -->
    <div id="saved-writeup-content" style="display: none;">EMPTY</div>
    
    <div class="report-container">
        <!-- Title Page with Navigation -->
        <div class="title-page">
            ${logoBase64 ? `
            <div class="logo-container">
                <img src="${logoBase64}" alt="Company Logo" />
            </div>
            ` : ''}
            <h1>${divisionFullName} Financial Report</h1>
            <h2>Period: ${exportData.basePeriod || 'No Period Set'}</h2>
            
            <div class="nav-tabs">
                ${chartTabs}
                ${tableTabs}
                ${writeupTab}
            </div>
        </div>

        <!-- Content Sections -->
        ${chartSections}
        ${writeupSection}
        ${tableSections}

        <!-- Floating Back Button -->
        <button class="back-button" onclick="showHomePage()" title="Back to Home">
            Back to Home page
        </button>
    </div>

    ${getNavigationScript(capturedCharts, capturedTables, actualWriteupContent)}
</body>
</html>
    `;

    // Create and download the HTML file
    const blob = new Blob([html], { type: 'text/html' });
    const url = URL.createObjectURL(blob);
    
    const link = document.createElement('a');
    link.href = url;
    const filenameDivision = divisionNames[exportData.division]?.replace(/\s+/g, '_') || 'Financial';
    link.download = `${filenameDivision}_Report_With_Writeup.html`;
    
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    
    URL.revokeObjectURL(url);
    
    console.log(`✅ Interactive HTML report with writeup generated: ${capturedCharts.length} charts and ${capturedTables.length} tables!`);
    console.log('📝 Write-up functionality ready for one-time editing');
    console.log('📧 File ready for email distribution after write-up finalization');
    
    return true;
  } catch (error) {
    console.error('Error generating HTML report with writeup:', error);
    alert('Failed to generate HTML report. Please check console for details.');
    return false;
  }
};

// Keep the original function for backward compatibility (will be the no-writeup version)
export const exportHTMLReport = exportHTMLReportNoWriteup;

export default { 
  exportHTMLReport, 
  exportHTMLReportNoWriteup, 
  exportHTMLReportWithWriteup 
}; 