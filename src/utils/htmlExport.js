// Professional HTML Report Generator
// Captures actual charts and tables from the DOM and embeds them as base64 images in HTML

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
      removeContainer: true,
      ignoreElements: (element) => {
        // Ignore elements that might cause gray artifacts
        return element.classList?.contains('pdf-export-button') || 
               element.style?.boxShadow?.includes('inset');
      },
      ...options
    });
    
    if (!canvas || canvas.width === 0 || canvas.height === 0) {
      console.warn('Canvas capture resulted in empty image');
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
    
    const clonedDiv = contentEditableDiv.cloneNode(true);
    
    const buttonsToRemove = clonedDiv.querySelectorAll(`
      button, 
      input[type="button"], 
      input[type="submit"],
      .ai-writeup-button-container,
      [class*="button"],
      [onclick],
      [role="button"],
      [data-testid*="button"],
      [aria-label*="button"]
    `);
    buttonsToRemove.forEach(btn => btn.remove());
    
    const allDivs = clonedDiv.querySelectorAll('div, span, p');
    allDivs.forEach(div => {
      const text = div.textContent?.toLowerCase() || '';
      if (text.includes('generate') && text.length < 50) {
        div.remove();
      }
    });
    
    const textContent = clonedDiv.textContent || clonedDiv.innerText || '';
    
    console.log('Cleaned content length:', textContent.length);
    console.log('Cleaned content preview:', textContent.substring(0, 200));
    
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
    
    let htmlContent = clonedDiv.innerHTML || '';
    
    htmlContent = htmlContent
      .replace(/<button[^>]*>.*?<\/button>/gi, '')
      .replace(/<div[^>]*class="[^"]*button[^"]*"[^>]*>.*?<\/div>/gi, '')
      .replace(/<div[^>]*style="[^"]*cursor:[^"]*pointer[^"]*"[^>]*>.*?<\/div>/gi, '')
      .replace(/Generate.*?<\/.*?>/gi, '')
      .replace(/<div[^>]*style="color:[^"]*666[^"]*font-style:[^"]*italic[^"]*"[^>]*>.*?<\/div>/gi, '')
      .trim();
    
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

// CSS styles for the HTML report WITHOUT writeup - ORIGINAL FORMAT PRESERVED
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
    overflow-x: auto;
  }

  .report-container {
    width: 100%;
    margin: 0 auto;
    background: white;
    min-height: 100vh;
    position: relative;
  }
  
  .title-page {
    background: linear-gradient(135deg, #003366 0%, #0066cc 30%, #4da6ff 70%, #80ccff 100%);
    color: white;
    padding: 24px 10px 24px 10px; /* tighter spacing */
    text-align: center;
    min-height: 100vh;
    display: flex;
    flex-direction: column;
    justify-content: flex-start;
    align-items: center;
    position: relative;
    overflow-y: auto;
    overflow-x: hidden;
  }

  .logo-container {
    margin-bottom: 14px;
    flex-shrink: 0;
  }

  .logo-container img {
    max-height: 144px;
    width: auto;
    filter: brightness(1.1) drop-shadow(0 8px 24px rgba(0,0,0,0.45)); /* strong shadow */
    transition: transform 0.3s ease;
  }

  .logo-container img:hover {
    transform: scale(1.05);
  }

  .title-page h1 {
    font-size: 1.4rem;
    margin-bottom: 4px;
    text-shadow: 0 4px 12px rgba(0,0,0,0.25);
    flex-shrink: 0;
    font-weight: 600;
  }

  .title-page h2 {
    font-size: 1rem;
    margin-bottom: 14px;
    opacity: 0.9;
    flex-shrink: 0;
  }
  
  .nav-tabs {
    display: grid;
    grid-template-columns: repeat(5, 1fr); /* more columns, cards are narrower */
    gap: 12px;
    max-width: 630px; /* reduced from 900px, 30% less */
    width: 95%;
    margin: 0 auto;
    flex: 1;
    align-content: center;
    padding: 10px;
    overflow-y: auto;
  }
  
  .nav-tab {
    background: rgba(255,255,255,0.13);
    border: 1px solid rgba(255,255,255,0.13);
    border-radius: 9px;
    padding: 7px 4px;
    cursor: pointer;
    transition: box-shadow 0.2s, transform 0.2s, background 0.2s;
    backdrop-filter: blur(8px);
    text-align: center;
    min-height: 28px;
    min-width: 0;
    display: flex;
    flex-direction: column;
    justify-content: center;
    align-items: center;
    word-break: break-word;
    aspect-ratio: 1.2;
    font-size: 0.7rem;
    box-shadow: 0 1.5px 6px rgba(0,0,0,0.08);
  }
  
  .nav-tab:hover {
    background: rgba(255,255,255,0.18);
    border-color: rgba(255,255,255,0.18);
    transform: translateY(-2px) scale(1.03);
    box-shadow: 0 6px 18px rgba(0,102,204,0.13), 0 2px 8px rgba(0,0,0,0.10);
  }
  
  .nav-tab h3 {
    font-size: 0.8rem;
    margin: 4px 0 2px 0;
    color: white;
    transition: color 0.3s ease;
    word-break: break-word;
    font-weight: 600;
  }

  .nav-tab:hover h3 {
    color: #e0f7ff;
  }

  .nav-tab p {
    font-size: 0.62rem;
    opacity: 0.9;
    color: white;
    transition: opacity 0.3s ease;
    margin: 0;
    word-break: break-word;
    line-height: 1.2;
  }

  .nav-tab:hover p {
    opacity: 1;
  }
  
  .nav-tab .icon {
    font-size: 1.1rem;
    margin-bottom: 4px;
    display: block;
    transition: transform 0.3s ease;
  }

  .nav-tab:hover .icon {
    transform: scale(1.10);
  }
  
  .content-section {
    display: none;
    padding: 0;
    background: white;
    height: 100vh;
    width: 100vw;
    overflow: hidden;
    align-items: center;
    justify-content: center;
  }
  
  .content-section.active {
    display: flex;
  }
  
  .chart-wrapper {
    background: white;
    border-radius: 15px;
    box-shadow: 0 10px 30px rgba(0,0,0,0.1);
    overflow: hidden;
    position: relative;
    transition: transform 0.3s ease, box-shadow 0.3s ease;
    margin: 0 auto;
    width: 95vw;
    height: 90vh;
    display: flex;
    align-items: center;
    justify-content: center;
    padding: 20px;
  }
  
  .chart-wrapper:hover {
    transform: scale(1.02);
    box-shadow: 0 15px 40px rgba(0,0,0,0.15);
  }
  
  .chart-image {
    max-width: 100%;
    max-height: 100%;
    width: auto;
    height: auto;
    object-fit: contain;
    display: block;
    transition: opacity 0.3s ease;
  }

  .content-section[id*="table"] {
    padding: 0;
    overflow: hidden;
    height: auto;
    min-height: 100vh;
  }
  
  .content-section[id*="table"].active {
    display: block;
  }
  
  .content-section[id*="table"] .chart-wrapper {
    background: none;
    border-radius: 0;
    box-shadow: none;
    overflow: hidden;
    width: 95vw;
    max-width: 95vw;
    height: auto;
    padding: 20px;
    margin: 0 auto;
    display: flex;
    align-items: center;
    justify-content: center;
  }
  
  .content-section[id*="table"] .chart-image {
    max-width: 95%;
    width: 95%;
    height: auto;
    object-fit: contain;
    display: block;
    margin: 0 auto;
  }
  
  .back-button {
    position: fixed;
    top: 20px;
    right: 20px;
    background: #003366;
    color: white;
    border: none;
    padding: 8px 16px;
    border-radius: 25px;
    cursor: pointer;
    font-size: 12px;
    font-weight: 500;
    transition: all 0.3s ease;
    box-shadow: 0 4px 15px rgba(0,51,102,0.3);
    z-index: 1000;
    opacity: 0;
    visibility: hidden;
    transform: translateY(-10px);
    text-align: center;
    line-height: 1.2;
    min-width: 60px;
  }
  
  .back-button.visible {
    opacity: 1;
    visibility: visible;
    transform: translateY(0);
  }
  
  .back-button:hover {
    background: #004080;
    transform: translateY(-2px);
    box-shadow: 0 6px 20px rgba(0,51,102,0.4);
  }

  /* Large screens (1200px and up) */
  @media (min-width: 1200px) {
    .nav-tabs {
      max-width: 1400px;
      gap: 30px;
      padding: 30px;
    }
    
    .nav-tab {
      min-height: 70px;
      padding: 15px 12px;
    }
    
    .nav-tab h3 {
      font-size: 1.2rem;
    }
    
    .nav-tab p {
      font-size: 0.9rem;
    }
    
    .nav-tab .icon {
      font-size: 2.5rem;
      margin-bottom: 12px;
    }
  }

  @media (max-width: 768px) {
    .nav-tabs {
      grid-template-columns: repeat(2, 1fr);
      gap: 15px;
      padding: 15px;
      max-width: 95vw;
      width: 95%;
      overflow-y: auto;
    }
    
    .nav-tab {
      min-height: 50px;
      padding: 8px 6px;
      aspect-ratio: 1.3;
    }
    
    .nav-tab h3 {
      font-size: 0.9rem;
      margin: 6px 0 4px 0;
    }
    
    .nav-tab p {
      font-size: 0.7rem;
    }
    
    .nav-tab .icon {
      font-size: 1.6rem;
      margin-bottom: 8px;
    }
    
    .title-page h1 {
      font-size: 1.6rem;
    }
    
    .title-page h2 {
      font-size: 1rem;
    }

    .back-button {
      padding: 8px 14px;
      font-size: 11px;
      top: 15px;
      right: 15px;
      min-width: 55px;
    }
  }

  @media (max-width: 480px) {
    .nav-tabs {
      grid-template-columns: 1fr;
      gap: 12px;
      padding: 10px;
      max-width: 95vw;
      width: 95%;
      overflow-y: auto;
    }
    
    .nav-tab {
      min-height: 40px;
      padding: 6px 4px;
      aspect-ratio: 3;
    }
    
    .nav-tab h3 {
      font-size: 0.85rem;
    }
    
    .nav-tab p {
      font-size: 0.65rem;
    }
    
    .nav-tab .icon {
      font-size: 1.4rem;
      margin-bottom: 6px;
    }
    
    .title-page h1 {
      font-size: 1.4rem;
    }
    
    .title-page h2 {
      font-size: 0.9rem;
    }
  }
</style>
`;

// CSS styles for the HTML report WITH writeup - ORIGINAL FORMAT PRESERVED
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
    overflow-x: auto;
  }

  .report-container {
    width: 100%;
    margin: 0 auto;
    background: white;
    min-height: 100vh;
    position: relative;
  }
  
  .title-page {
    background: linear-gradient(135deg, #003366 0%, #0066cc 30%, #4da6ff 70%, #80ccff 100%);
    color: white;
    padding: 24px 10px 24px 10px; /* tighter spacing */
    text-align: center;
    min-height: 100vh;
    display: flex;
    flex-direction: column;
    justify-content: flex-start;
    align-items: center;
    position: relative;
    overflow-y: auto;
    overflow-x: hidden;
  }

  .logo-container {
    margin-bottom: 14px;
    flex-shrink: 0;
  }

  .logo-container img {
    max-height: 144px;
    width: auto;
    filter: brightness(1.1) drop-shadow(0 8px 24px rgba(0,0,0,0.45)); /* strong shadow */
    transition: transform 0.3s ease;
  }

  .logo-container img:hover {
    transform: scale(1.05);
  }

  .title-page h1 {
    font-size: 1.4rem;
    margin-bottom: 4px;
    text-shadow: 0 4px 12px rgba(0,0,0,0.25);
    flex-shrink: 0;
    font-weight: 600;
  }

  .title-page h2 {
    font-size: 1rem;
    margin-bottom: 14px;
    opacity: 0.9;
    flex-shrink: 0;
  }
  
  .nav-tabs {
    display: grid;
    grid-template-columns: repeat(5, 1fr); /* more columns, cards are narrower */
    gap: 12px;
    max-width: 630px; /* reduced from 900px, 30% less */
    width: 95%;
    margin: 0 auto;
    flex: 1;
    align-content: center;
    padding: 10px;
    overflow-y: auto;
  }
  
  .nav-tab {
    background: rgba(255,255,255,0.13);
    border: 1px solid rgba(255,255,255,0.13);
    border-radius: 9px;
    padding: 7px 4px;
    cursor: pointer;
    transition: box-shadow 0.2s, transform 0.2s, background 0.2s;
    backdrop-filter: blur(8px);
    text-align: center;
    min-height: 28px;
    min-width: 0;
    display: flex;
    flex-direction: column;
    justify-content: center;
    align-items: center;
    word-break: break-word;
    aspect-ratio: 1.2;
    font-size: 0.7rem;
    box-shadow: 0 1.5px 6px rgba(0,0,0,0.08);
  }
  
  .nav-tab:hover {
    background: rgba(255,255,255,0.18);
    border-color: rgba(255,255,255,0.18);
    transform: translateY(-2px) scale(1.03);
    box-shadow: 0 6px 18px rgba(0,102,204,0.13), 0 2px 8px rgba(0,0,0,0.10);
  }
  
  .nav-tab h3 {
    font-size: 0.8rem;
    margin: 4px 0 2px 0;
    color: white;
    transition: color 0.3s ease;
    word-break: break-word;
    font-weight: 600;
  }

  .nav-tab:hover h3 {
    color: #e0f7ff;
  }

  .nav-tab p {
    font-size: 0.62rem;
    opacity: 0.9;
    color: white;
    transition: opacity 0.3s ease;
    margin: 0;
    word-break: break-word;
    line-height: 1.2;
  }

  .nav-tab:hover p {
    opacity: 1;
  }
  
  .nav-tab .icon {
    font-size: 1.1rem;
    margin-bottom: 4px;
    display: block;
    transition: transform 0.3s ease;
  }

  .nav-tab:hover .icon {
    transform: scale(1.10);
  }
  
  .content-section {
    display: none;
    padding: 0;
    background: white;
    height: 100vh;
    width: 100vw;
    overflow: hidden;
    align-items: center;
    justify-content: center;
  }
  
  .content-section.active {
    display: flex;
  }
  
  .chart-wrapper {
    background: white;
    border-radius: 15px;
    box-shadow: 0 10px 30px rgba(0,0,0,0.1);
    overflow: hidden;
    position: relative;
    transition: transform 0.3s ease, box-shadow 0.3s ease;
    margin: 0 auto;
    width: 95vw;
    height: 90vh;
    display: flex;
    align-items: center;
    justify-content: center;
    padding: 20px;
  }
  
  .chart-wrapper:hover {
    transform: scale(1.02);
    box-shadow: 0 15px 40px rgba(0,0,0,0.15);
  }
  
  .chart-image {
    max-width: 100%;
    max-height: 100%;
    width: auto;
    height: auto;
    object-fit: contain;
    display: block;
    transition: opacity 0.3s ease;
  }

  .content-section[id*="table"] {
    padding: 0;
    overflow: hidden;
    height: auto;
    min-height: 100vh;
  }
  
  .content-section[id*="table"].active {
    display: block;
  }
  
  .content-section[id*="table"] .chart-wrapper {
    background: none;
    border-radius: 0;
    box-shadow: none;
    overflow: hidden;
    width: 95vw;
    max-width: 95vw;
    height: auto;
    padding: 20px;
    margin: 0 auto;
    display: flex;
    align-items: center;
    justify-content: center;
  }
  
  .content-section[id*="table"] .chart-image {
    max-width: 95%;
    width: 95%;
    height: auto;
    object-fit: contain;
    display: block;
    margin: 0 auto;
  }
  
  .writeup-section {
    max-width: 900px;
    margin: 0 auto;
    padding: 20px;
    background: white;
    border-radius: 15px;
    box-shadow: 0 10px 30px rgba(0,0,0,0.1);
    transition: box-shadow 0.3s ease;
    height: 85vh;
    overflow-y: auto;
    display: flex;
    flex-direction: column;
  }
  
  .writeup-section:hover {
    box-shadow: 0 15px 40px rgba(0,0,0,0.15);
  }
  
  .writeup-header {
    text-align: center;
    margin-bottom: 15px;
    flex-shrink: 0;
  }
  
  .writeup-header h2 {
    font-size: 1.8rem;
    font-weight: 700;
    color: #003366;
    transition: color 0.3s ease;
  }
  
  .writeup-header:hover h2 {
    color: #0066cc;
  }
  
  .writeup-editor {
    flex: 1;
    display: flex;
    flex-direction: column;
    min-height: 0;
  }
  
  .writeup-textarea {
    width: 100%;
    flex: 1;
    min-height: 300px;
    padding: 15px;
    border: 2px solid #e0e6ed;
    border-radius: 8px;
    font-size: 14px;
    font-family: 'Segoe UI', Tahoma, Geneva, Verdana, sans-serif;
    line-height: 1.6;
    background: #fafafa;
    resize: none;
    transition: border-color 0.3s ease, background 0.3s ease;
    outline: none;
  }
  
  .writeup-textarea:focus, .writeup-textarea:hover {
    border-color: #0066cc;
    background: white;
  }
  
  .writeup-controls {
    margin-top: 15px;
    display: flex;
    justify-content: space-between;
    align-items: center;
    flex-wrap: wrap;
    gap: 10px;
    flex-shrink: 0;
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
    background: linear-gradient(135deg, #20c997, #28a745);
  }
  
  .word-count {
    color: #666;
    font-size: 14px;
    transition: color 0.3s ease;
  }
  
  .word-count:hover {
    color: #333;
  }
  
  .back-button {
    position: fixed;
    top: 30px;
    right: 30px;
    background: linear-gradient(135deg, #003366, #0066cc);
    color: white;
    border: none;
    border-radius: 25px;
    padding: 8px 16px;
    font-size: 12px;
    font-weight: 600;
    cursor: pointer;
    box-shadow: 0 6px 20px rgba(0,0,0,0.3);
    transition: all 0.3s ease;
    z-index: 1000;
    display: none;
    font-family: 'Segoe UI', Tahoma, Geneva, Verdana, sans-serif;
    letter-spacing: 0.5px;
    text-shadow: 0 1px 2px rgba(0,0,0,0.2);
    text-align: center;
    line-height: 1.2;
    min-width: 60px;
  }
  
  .back-button:hover {
    transform: translateY(-2px);
    box-shadow: 0 8px 25px rgba(0,0,0,0.4);
    background: linear-gradient(135deg, #0066cc, #4da6ff);
  }
  
  .back-button.visible {
    display: block;
  }
  
  @media (max-width: 768px) {
    .title-page {
      padding: 40px 20px;
    }
    
    .title-page h1 {
      font-size: 32px;
    }
    
    .title-page h2 {
      font-size: 18px;
    }
    
    .nav-tabs {
      grid-template-columns: repeat(2, 1fr);
      gap: 12px;
      padding: 0 15px;
    }
    
    .nav-tab {
      min-height: 40px;
      padding: 8px;
    }
    
    .nav-tab h3 {
      font-size: 0.85rem;
    }
    
    .nav-tab p {
      font-size: 0.7rem;
    }
    
    .nav-tab .icon {
      font-size: 1.5rem;
    }
    
    .writeup-section {
      height: 80vh;
      padding: 15px;
    }
    
    .writeup-header h2 {
      font-size: 1.5rem;
    }
    
    .writeup-textarea {
      font-size: 13px;
    }
    
    .save-button {
      padding: 10px 20px;
      font-size: 14px;
    }
    
    .back-button {
      top: 20px;
      right: 20px;
      padding: 6px 12px;
      font-size: 10px;
      min-width: 50px;
    }
  }

  @media (max-width: 480px) {
    .nav-tabs {
      grid-template-columns: 1fr;
      gap: 10px;
    }
    
    .nav-tab {
      min-height: 35px;
      padding: 6px;
    }
    
    .title-page h1 {
      font-size: 1.5rem;
    }
    
    .title-page h2 {
      font-size: 0.9rem;
    }
    
    .writeup-section {
      height: 75vh;
      padding: 10px;
    }
  }
</style>
`;

// JavaScript for navigation and write-up functionality
const getNavigationScript = (capturedCharts, capturedTables, actualWriteupContent) => `
<script>
  window.showSection = function(sectionId) {
    console.log('showSection called with:', sectionId);
    
    const sections = document.querySelectorAll('.content-section');
    sections.forEach(section => section.classList.remove('active'));
    
    const titlePage = document.querySelector('.title-page');
    if (titlePage) titlePage.style.display = 'none';
    
    const targetSection = document.getElementById(sectionId);
    if (targetSection) {
      targetSection.classList.add('active');
      
      if (sectionId === 'writeup') {
        loadWriteupContent();
      }
    }
    
    const backButton = document.querySelector('.back-button');
    if (backButton) backButton.classList.add('visible');
    
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };
  
  window.showHomePage = function() {
    console.log('showHomePage called');
    
    const sections = document.querySelectorAll('.content-section');
    sections.forEach(section => section.classList.remove('active'));
    
    const titlePage = document.querySelector('.title-page');
    if (titlePage) titlePage.style.display = 'flex';
    
    const backButton = document.querySelector('.back-button');
    if (backButton) backButton.classList.remove('visible');
    
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  let writeupData = ${actualWriteupContent ? JSON.stringify(actualWriteupContent.text) : 'null'};
  let hasBeenSaved = false;
  let currentContent = '';

  function loadWriteupContent() {
    console.log('loadWriteupContent called');
    const container = document.querySelector('.writeup-editor');
    
    if (!container) {
      console.error('Writeup editor container not found!');
      return;
    }
    
    const initialContent = writeupData || 'Edit your financial analysis and insights here...';
    container.innerHTML = \`
      <textarea id="writeup-content" class="writeup-textarea" placeholder="Edit your financial analysis writeup...">\${initialContent}</textarea>
      <div class="writeup-controls">
        <button class="save-button" onclick="saveWriteup()">💾 Save & Download Final Report</button>
        <div class="save-status"></div>
        <div class="word-count">0 words, 0 characters</div>
      </div>
    \`;
    
    const textarea = document.getElementById('writeup-content');
    if (textarea) {
      textarea.addEventListener('input', updateWordCount);
      updateWordCount();
    }
  }

  window.saveWriteup = function() {
    console.log('saveWriteup called');
    const textarea = document.getElementById('writeup-content');
    const saveStatus = document.querySelector('.save-status');
    
    if (!textarea) {
      alert('No content to save!');
      return;
    }
    
    const content = textarea.value.trim();
    if (!content) {
      alert('Please enter some content before saving.');
      return;
    }
    
    writeupData = content;
    hasBeenSaved = true;
    
    const savedContentDiv = document.getElementById('saved-writeup-content');
    if (savedContentDiv) {
      savedContentDiv.textContent = content;
    }
    
    if (saveStatus) {
      saveStatus.textContent = 'Saved successfully!';
      saveStatus.style.color = '#28a745';
      setTimeout(() => { saveStatus.textContent = ''; }, 3000);
    }
    
    const blob = new Blob([document.documentElement.outerHTML], { type: 'text/html' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.download = 'Financial_Report_Final.html';
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    URL.revokeObjectURL(url);
  };

  function updateWordCount() {
    const textarea = document.getElementById('writeup-content');
    const wordCountEl = document.querySelector('.word-count');
    
    if (textarea && wordCountEl) {
      const text = textarea.value.trim();
      const words = text ? text.split(/\s+/).filter(w => w.length > 0).length : 0;
      const characters = text.length;
      wordCountEl.textContent = \`\${words} words, \${characters} characters\`;
    }
  }

  console.log('=== NAVIGATION SCRIPT LOADED ===');
  
  document.addEventListener('DOMContentLoaded', function() {
    console.log('DOM loaded - navigation ready');
  });
</script>
`;

// Function to capture chart containers from DOM
const captureChartsAndTable = async () => {
  const capturedCharts = [];
  const capturedTables = [];

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

  if (!chartsTabElement.classList.contains('active')) {
    chartsTabElement.click();
    await new Promise(r => setTimeout(r, 300));
  }

  try {
    const mainContainer = document.querySelector('[style*="display: flex"][style*="flex-direction: column"][style*="padding: 16"]');

    if (mainContainer) {
      console.log('Found main chart container');

      const children = Array.from(mainContainer.children).filter(child => {
        const rect = child.getBoundingClientRect();
        const hasStyle = child.style.marginTop;
        const isNotAI = !child.textContent.toLowerCase().includes('ai') && 
                        !child.innerHTML.toLowerCase().includes('writeup');
        return rect.width > 300 && rect.height > 200 && hasStyle && isNotAI;
      });

      console.log(`Found ${children.length} chart containers`);

      const chartTitles = [
        'Sales and Volume Analysis',
        'Margin over Material Cost', 
        'Manufacturing Cost Breakdown',
        'Below Gross Profit Expenses',
        'Expenses Trends & Profit Analysis'
      ];

      for (let i = 0; i < children.length && i < chartTitles.length; i++) {
        const container = children[i];

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

        await new Promise(r => setTimeout(r, 500));

        const chartImage = await captureElementAsBase64(container, {
          scale: 2,
          backgroundColor: '#ffffff',
          useCORS: true,
          allowTaint: true,
          logging: true
        });

        if (chartImage) {
          capturedCharts.push({
            title: chartTitles[i],
            image: chartImage,
            id: `chart-${i + 1}`
          });
          console.log(`Captured chart: ${chartTitles[i]}`);
        } else {
          console.warn(`Failed to capture chart: ${chartTitles[i]}`);
        }
      }
    }

    console.log('Starting table capture...');

    try {
      console.log('Capturing P&L Financial table...');
      const plTab = Array.from(allTabs).find(tab => tab.textContent.includes('P&L'));
      
      if (plTab && !plTab.classList.contains('active')) {
        console.log('Switching to P&L tab...');
        plTab.click();
        await new Promise(r => setTimeout(r, 300));
      }

      // Create a clean container for table capture without PDF export controls
      const originalTableView = document.querySelector('.table-view');
      if (originalTableView) {
        console.log('Creating clean table container for P&L...');
        
        // Create a clean container
        const cleanContainer = document.createElement('div');
        cleanContainer.className = 'table-view';
        cleanContainer.style.cssText = originalTableView.style.cssText;
        
        // Clone only the table content (exclude PDF export controls)
        const tableHeader = originalTableView.querySelector('.table-header');
        const tableContainer = originalTableView.querySelector('.table-container');
        
        if (tableHeader) {
          cleanContainer.appendChild(tableHeader.cloneNode(true));
        }
        if (tableContainer) {
          cleanContainer.appendChild(tableContainer.cloneNode(true));
        }
        
        // Position off-screen for capture and ensure clean white background
        cleanContainer.style.position = 'absolute';
        cleanContainer.style.left = '-9999px';
        cleanContainer.style.top = '-9999px';
        cleanContainer.style.zIndex = '-1';
        cleanContainer.style.backgroundColor = '#ffffff';
        cleanContainer.style.boxShadow = 'none';
        cleanContainer.style.border = 'none';
        cleanContainer.style.padding = '20px';
        cleanContainer.style.margin = '0';
        document.body.appendChild(cleanContainer);
        
        const plTableImage = await captureElementAsBase64(cleanContainer, {
          scale: 1.2,
          backgroundColor: '#ffffff',
          useCORS: true,
          allowTaint: true,
          logging: true
        });
        
        // Clean up
        document.body.removeChild(cleanContainer);
        
        if (plTableImage) {
          capturedTables.push({
            title: 'P&L Financial Table',
            image: plTableImage,
            id: 'pl-table'
          });
          console.log('P&L Financial table captured successfully');
        } else {
          console.warn('Failed to capture P&L Financial table');
        }
      }
    } catch (plErr) {
      console.error('Error capturing P&L Financial table:', plErr);
    }

    try {
      console.log('Capturing Product Group table...');
      const productGroupTab = Array.from(allTabs).find(tab => tab.textContent.includes('Product Group'));
      
      if (productGroupTab && !productGroupTab.classList.contains('active')) {
        console.log('Switching to Product Group tab...');
        productGroupTab.click();
        await new Promise(r => setTimeout(r, 300));
      }

      // Create a clean container for table capture without PDF export controls
      const originalTableView = document.querySelector('.table-view');
      if (originalTableView) {
        console.log('Creating clean table container for Product Group...');
        
        // Create a clean container
        const cleanContainer = document.createElement('div');
        cleanContainer.className = 'table-view';
        cleanContainer.style.cssText = originalTableView.style.cssText;
        
        // Clone only the table content (exclude PDF export controls)
        const tableHeader = originalTableView.querySelector('.table-header');
        const tableContainer = originalTableView.querySelector('.table-container');
        
        if (tableHeader) {
          cleanContainer.appendChild(tableHeader.cloneNode(true));
        }
        if (tableContainer) {
          cleanContainer.appendChild(tableContainer.cloneNode(true));
        }
        
        // Position off-screen for capture and ensure clean white background
        cleanContainer.style.position = 'absolute';
        cleanContainer.style.left = '-9999px';
        cleanContainer.style.top = '-9999px';
        cleanContainer.style.zIndex = '-1';
        cleanContainer.style.backgroundColor = '#ffffff';
        cleanContainer.style.boxShadow = 'none';
        cleanContainer.style.border = 'none';
        cleanContainer.style.padding = '20px';
        cleanContainer.style.margin = '0';
        document.body.appendChild(cleanContainer);
        
        const productGroupTableImage = await captureElementAsBase64(cleanContainer, {
          scale: 1.2,
          backgroundColor: '#ffffff',
          useCORS: true,
          allowTaint: true,
          logging: true
        });
        
        // Clean up
        document.body.removeChild(cleanContainer);
        
        if (productGroupTableImage) {
          capturedTables.push({
            title: 'Product Group Table',
            image: productGroupTableImage,
            id: 'product-group-table'
          });
          console.log('Product Group table captured successfully');
        } else {
          console.warn('Failed to capture Product Group table');
        }
      }
    } catch (pgErr) {
      console.error('Error capturing Product Group table:', pgErr);
    }

    try {
      console.log('Capturing Sales by Country table...');
      const salesCountryTab = Array.from(allTabs).find(tab => tab.textContent.includes('Sales by Country'));
      
      if (salesCountryTab && !salesCountryTab.classList.contains('active')) {
        console.log('Switching to Sales by Country tab...');
        salesCountryTab.click();
        await new Promise(r => setTimeout(r, 300));
      }

      const tableSubTab = Array.from(document.querySelectorAll('.tab-button')).find(tab => 
        tab.textContent.trim() === 'Table' && tab.closest('.tab-content')
      );
      
      if (tableSubTab && !tableSubTab.classList.contains('active')) {
        console.log('Switching to Table sub-tab...');
        tableSubTab.click();
        await new Promise(r => setTimeout(r, 300));
      }

      // Create a clean container for table capture without PDF export controls
      const originalTableView = document.querySelector('.table-view');
      if (originalTableView) {
        console.log('Creating clean table container for Sales by Country...');
        
        // Create a clean container
        const cleanContainer = document.createElement('div');
        cleanContainer.className = 'table-view';
        cleanContainer.style.cssText = originalTableView.style.cssText;
        
        // Clone only the table content (exclude PDF export controls)
        const tableHeader = originalTableView.querySelector('.table-header');
        const tableContainer = originalTableView.querySelector('.table-container');
        
        if (tableHeader) {
          cleanContainer.appendChild(tableHeader.cloneNode(true));
        }
        if (tableContainer) {
          cleanContainer.appendChild(tableContainer.cloneNode(true));
        }
        
        // Position off-screen for capture and ensure clean white background
        cleanContainer.style.position = 'absolute';
        cleanContainer.style.left = '-9999px';
        cleanContainer.style.top = '-9999px';
        cleanContainer.style.zIndex = '-1';
        cleanContainer.style.backgroundColor = '#ffffff';
        cleanContainer.style.boxShadow = 'none';
        cleanContainer.style.border = 'none';
        cleanContainer.style.padding = '20px';
        cleanContainer.style.margin = '0';
        document.body.appendChild(cleanContainer);
        
        const salesCountryTableImage = await captureElementAsBase64(cleanContainer, {
          scale: 1.2,
          backgroundColor: '#ffffff',
          useCORS: true,
          allowTaint: true,
          logging: true
        });
        
        // Clean up
        document.body.removeChild(cleanContainer);
        
        if (salesCountryTableImage) {
          capturedTables.push({
            title: 'Sales by Country Table',
            image: salesCountryTableImage,
            id: 'sales-country-table'
          });
          console.log('Sales by Country table captured successfully');
        } else {
          console.warn('Failed to capture Sales by Country table');
        }
      }
    } catch (scErr) {
      console.error('Error capturing Sales by Country table:', scErr);
    }

    // Capture Sales by Customer table
    try {
      console.log('Capturing Sales by Customer table...');
      
      // Check if there's a Sales by Customer tab - if not, we'll skip this capture
      const salesCustomerTab = Array.from(allTabs).find(tab => tab.textContent.includes('Sales by Customer'));
      
      if (salesCustomerTab) {
        if (!salesCustomerTab.classList.contains('active')) {
          console.log('Switching to Sales by Customer tab...');
          salesCustomerTab.click();
          await new Promise(r => setTimeout(r, 300));
        }

        // Check for Table sub-tab within Sales by Customer
        const customerTableSubTab = Array.from(document.querySelectorAll('.tab-button')).find(tab => 
          tab.textContent.trim() === 'Table' && tab.closest('.tab-content')
        );
        
        if (customerTableSubTab && !customerTableSubTab.classList.contains('active')) {
          console.log('Switching to Customer Table sub-tab...');
          customerTableSubTab.click();
          await new Promise(r => setTimeout(r, 300));
        }

        // Create a clean container for table capture without PDF export controls
        const originalTableView = document.querySelector('.table-view');
        if (originalTableView) {
          console.log('Creating clean table container for Sales by Customer...');
          
          // Create a clean container
          const cleanContainer = document.createElement('div');
          cleanContainer.className = 'table-view';
          cleanContainer.style.cssText = originalTableView.style.cssText;
          
          // Clone only the table content (exclude PDF export controls)
          const tableHeader = originalTableView.querySelector('.table-header');
          const tableContainer = originalTableView.querySelector('.table-container');
          
          if (tableHeader) {
            cleanContainer.appendChild(tableHeader.cloneNode(true));
          }
          if (tableContainer) {
            cleanContainer.appendChild(tableContainer.cloneNode(true));
          }
          
          // Position off-screen for capture and ensure clean white background
          cleanContainer.style.position = 'absolute';
          cleanContainer.style.left = '-9999px';
          cleanContainer.style.top = '-9999px';
          cleanContainer.style.zIndex = '-1';
          cleanContainer.style.backgroundColor = '#ffffff';
          cleanContainer.style.boxShadow = 'none';
          cleanContainer.style.border = 'none';
          cleanContainer.style.padding = '20px';
          cleanContainer.style.margin = '0';
          document.body.appendChild(cleanContainer);
          
          const salesCustomerTableImage = await captureElementAsBase64(cleanContainer, {
            scale: 1.2,
            backgroundColor: '#ffffff',
            useCORS: true,
            allowTaint: true,
            logging: true
          });
          
          // Clean up
          document.body.removeChild(cleanContainer);
          
          if (salesCustomerTableImage) {
            capturedTables.push({
              title: 'Sales by Customer Table',
              image: salesCustomerTableImage,
              id: 'sales-customer-table'
            });
            console.log('Sales by Customer table captured successfully');
          } else {
            console.warn('Failed to capture Sales by Customer table');
          }
        }
      } else {
        console.log('Sales by Customer tab not found, skipping capture');
      }
    } catch (customerErr) {
      console.error('Error capturing Sales by Customer table:', customerErr);
    }

    if (chartsTabElement) {
      chartsTabElement.click();
    }

  } finally {
    // No need to restore original styles as the clean container approach excludes the PDF export controls
  }

  return { capturedCharts, capturedTables };
};

// HTML export function WITHOUT writeup
export const exportHTMLReportNoWriteup = async (exportData) => {
  try {
    console.log('Starting HTML report generation (NO writeup)...');

    const divisionNames = {
      FP: 'Flexible Packaging',
      SB: 'Shopping Bags', 
      TF: 'Thermoforming Products',
      HCM: 'Preforms and Closures'
    };

    const divisionFullName = divisionNames[exportData.division] || exportData.division;

    const logoBase64 = await getBase64Logo();

    const { capturedCharts, capturedTables } = await captureChartsAndTable();

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
        ${(table.id === 'sales-country-table' || table.id === 'sales-customer-table') ? `<div style=\"text-align:center;margin-top:8px;font-size:13px;color:#666;font-style:italic;\">★ = Sorting by Base Period highest to lowest | Δ% shows percentage change between consecutive periods</div>` : ''}
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
    <div id="saved-writeup-content" style="display: none;">EMPTY</div>
    
    <div class="report-container">
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

        ${chartSections}
        ${tableSections}

        <button class="back-button" onclick="showHomePage()" title="Back to Home">
            Home<br>Page
        </button>
    </div>

    ${getNavigationScript(capturedCharts, capturedTables, null)}
</body>
</html>
    `;

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

// HTML export function WITH writeup
export const exportHTMLReportWithWriteup = async (exportData) => {
  try {
    console.log('Starting HTML report with writeup generation...');

    const divisionNames = {
      FP: 'Flexible Packaging',
      SB: 'Shopping Bags', 
      TF: 'Thermoforming Products',
      HCM: 'Preforms and Closures'
    };

    const divisionFullName = divisionNames[exportData.division] || exportData.division;

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
    
    if (!chartsTabElement.classList.contains('active')) {
      chartsTabElement.click();
      await new Promise(r => setTimeout(r, 300));
    }

    const logoBase64 = await getBase64Logo();

    const { capturedCharts, capturedTables } = await captureChartsAndTable();

    const actualWriteupContent = await captureAIWriteupContent();

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

    const writeupTab = `
      <div class="nav-tab writeup-tab" onclick="showSection('writeup')">
        <span class="icon">✍️</span>
        <h3>Write-up</h3>
        <p>Edit & finalize report</p>
      </div>
    `;

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
        ${(table.id === 'sales-country-table' || table.id === 'sales-customer-table') ? `<div style=\"text-align:center;margin-top:8px;font-size:13px;color:#666;font-style:italic;\">★ = Sorting by Base Period highest to lowest | Δ% shows percentage change between consecutive periods</div>` : ''}
      </div>
    `).join('');

    const writeupSection = `
      <div id="writeup" class="content-section">
        <div class="writeup-section">
          <div class="writeup-header">
            <h2>Financial Analysis Write-up</h2>
          </div>
          <div class="writeup-editor">
            ${actualWriteupContent.hasContent ? `
              <div class="writeup-content-readonly">${actualWriteupContent.html}</div>
            ` : ''}
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
    <div id="saved-writeup-content" style="display: none;">${actualWriteupContent.text || 'EMPTY'}</div>
    
    <div class="report-container">
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

        ${chartSections}
        ${writeupSection}
        ${tableSections}

        <button class="back-button" onclick="showHomePage()" title="Back to Home">
            Home<br>Page
        </button>
    </div>

    ${getNavigationScript(capturedCharts, capturedTables, actualWriteupContent)}
</body>
</html>
    `;

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
    
    return true;
  } catch (error) {
    console.error('Error generating HTML report with writeup:', error);
    alert('Failed to generate HTML report. Please check console for details.');
    return false;
  }
};

// Backward compatibility
export const exportHTMLReport = exportHTMLReportNoWriteup;

export default { 
  exportHTMLReport, 
  exportHTMLReportNoWriteup, 
  exportHTMLReportWithWriteup 
};