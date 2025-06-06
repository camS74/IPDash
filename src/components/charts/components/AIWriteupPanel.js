import React, { useState, useEffect, useCallback, useMemo, useRef } from 'react';

// --- UTILITY FUNCTIONS --- //

// Debounce function
function debounce(func, wait) {
  let timeout;
  return function executedFunction(...args) {
    const later = () => {
      clearTimeout(timeout);
      func(...args);
    };
    clearTimeout(timeout);
    timeout = setTimeout(later, wait);
  };
}

// Sanitize HTML
function sanitizeHTML(html) {
  const temp = document.createElement('div');
  temp.textContent = html;
  return temp.innerHTML;
}

// History Stack
function createHistoryStack(initialState = null, maxSize = 50) {
  let stack = initialState ? [initialState] : [];
  let currentIndex = initialState ? 0 : -1;
  
  return {
    push(state) {
      if (currentIndex < stack.length - 1) {
        stack = stack.slice(0, currentIndex + 1);
      }
      stack.push(state);
      if (stack.length > maxSize) {
        stack = stack.slice(stack.length - maxSize);
      }
      currentIndex = stack.length - 1;
    },
    undo() {
      if (currentIndex > 0) {
        currentIndex--;
        return stack[currentIndex];
      }
      return null;
    },
    redo() {
      if (currentIndex < stack.length - 1) {
        currentIndex++;
        return stack[currentIndex];
      }
      return null;
    },
    canUndo() { return currentIndex > 0; },
    canRedo() { return currentIndex < stack.length - 1; },
    current() { return currentIndex >= 0 ? stack[currentIndex] : null; }
  };
}

// Format Currency
function formatCurrency(value, format = 'millions') {
  if (typeof value !== 'number' || isNaN(value)) return '0';
  if (format === 'millions') return `${(value / 1000000).toFixed(2)}M`;
  if (format === 'thousands') return `${(value / 1000).toFixed(0)}K`;
  return value.toFixed(2);
}

// Format Percentage
function formatPercentage(value, decimals = 1) {
  if (typeof value !== 'number' || isNaN(value)) return '0%';
  return `${value.toFixed(decimals)}%`;
}

// Get Device Info
function getDeviceInfo() {
  const userAgent = navigator.userAgent;
  const isMobile = /Android|webOS|iPhone|iPad|iPod|BlackBerry|IEMobile|Opera Mini/i.test(userAgent);
  const isTablet = /(tablet|ipad|playbook|silk)|(android(?!.*mobi))/i.test(userAgent);
  const isDesktop = !isMobile && !isTablet;
  return {
    isMobile, isTablet, isDesktop,
    isIOS: /iPad|iPhone|iPod/.test(userAgent),
    isAndroid: /Android/.test(userAgent),
    isSafari: /^((?!chrome|android).)*safari/i.test(userAgent)
  };
}

// Keyboard Shortcuts
function createKeyboardShortcuts(shortcuts) {
  const handleKeyDown = (event) => {
    if (event.target.tagName === 'INPUT' || event.target.tagName === 'TEXTAREA' || event.target.isContentEditable) return;
    const key = [
      event.ctrlKey ? 'Ctrl' : '',
      event.shiftKey ? 'Shift' : '',
      event.altKey ? 'Alt' : '',
      event.metaKey ? 'Meta' : '',
      event.key
    ].filter(Boolean).join('+');
    if (shortcuts[key] && typeof shortcuts[key] === 'function') {
      event.preventDefault();
      shortcuts[key](event);
    }
  };
  document.addEventListener('keydown', handleKeyDown);
  return () => document.removeEventListener('keydown', handleKeyDown);
}

// --- EXPORT UTILITY FUNCTIONS --- //

// Simulate Download
function simulateDownload(filename, mimeType) {
  const notification = document.createElement('div');
  notification.style.cssText = 'position:fixed; bottom:20px; right:20px; padding:10px 20px; background:#4CAF50; color:white; border-radius:4px; box-shadow:0 2px 10px rgba(0,0,0,0.2); z-index:9999;';
  notification.textContent = `Downloading ${filename}...`;
  document.body.appendChild(notification);
  setTimeout(() => document.body.removeChild(notification), 3000);
}

// Export to PDF
async function exportToPDF(content, filename) {
  try {
    const htmlContent = `<!DOCTYPE html><html><head><title>${filename}</title><style>body{font-family:Arial,sans-serif;line-height:1.6;margin:40px;}h1,h2,h3{color:#333;}.content{margin-top:20px;}</style></head><body><div class="content">${content}</div></body></html>`;
    console.log('Exporting to PDF (simulation):', htmlContent);
    simulateDownload(`${filename}.pdf`, 'application/pdf');
    return true;
  } catch (error) { console.error('PDF export failed:', error); throw error; }
}

// Export to DOCX
async function exportToDocx(content, filename) {
  try {
    console.log('Exporting to DOCX (simulation):', content);
    simulateDownload(`${filename}.docx`, 'application/vnd.openxmlformats-officedocument.wordprocessingml.document');
    return true;
  } catch (error) { console.error('DOCX export failed:', error); throw error; }
}

// Export to TXT
async function exportToTxt(content, filename) {
  try {
    const blob = new Blob([content], { type: 'text/plain' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url; a.download = `${filename}.txt`;
    document.body.appendChild(a); a.click();
    setTimeout(() => { document.body.removeChild(a); URL.revokeObjectURL(url); }, 0);
    return true;
  } catch (error) { console.error('TXT export failed:', error); throw error; }
}

// Export to Markdown
async function exportToMarkdown(content, filename) {
  try {
    let markdownContent = content
      .replace(/<h3[^>]*>(.*?)<\/h3>/g, '### $1\n\n')
      .replace(/<strong[^>]*>(.*?)<\/strong>/g, '**$1**')
      .replace(/<br \/>/g, '\n')
      .replace(/• /g, '* ');
    const blob = new Blob([markdownContent], { type: 'text/markdown' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url; a.download = `${filename}.md`;
    document.body.appendChild(a); a.click();
    setTimeout(() => { document.body.removeChild(a); URL.revokeObjectURL(url); }, 0);
    return true;
  } catch (error) { console.error('Markdown export failed:', error); throw error; }
}

// Main Export Function
async function exportWriteup(content, format, filename = 'financial-analysis') {
  const plainText = content.replace(/<[^>]*>?/gm, '');
  switch (format) {
    case 'pdf': return exportToPDF(content, filename);
    case 'docx': return exportToDocx(plainText, filename);
    case 'txt': return exportToTxt(plainText, filename);
    case 'markdown': return exportToMarkdown(plainText, filename);
    default: throw new Error(`Unsupported export format: ${format}`);
  }
}

// --- HELPER FUNCTIONS & HOOKS --- //

// Placeholder async backend API functions
async function fetchWriteup(periodKey, division) {
  return { marginOverMaterial: 18, grossProfit: 15, netProfit: 7, ebitda: 12 };
}
async function saveWriteup(periodKey, division, text) { return true; }
function getPeriodKey(selectedPeriods) { return selectedPeriods.map(p => `${p.year}-${p.month || 'Year'}-${p.type}`).join('|'); }
function calcCAGR(current, prev1, prev2, years) {
  if (!prev1 || !prev2 || years < 2) return 0;
  return (((current / prev2) ** (1 / years)) - 1) * 100;
}

// Custom hook for managing user preferences
function usePreferences(division) {
  const [userPreferences, setUserPreferences] = useState({});
  useEffect(() => {
    const saved = localStorage.getItem(`aiWriteupPreferences_${division}`);
    if (saved) try { setUserPreferences(JSON.parse(saved)); } catch (e) { console.warn('Failed to load preferences:', e); }
  }, [division]);
  useEffect(() => {
    if (Object.keys(userPreferences).length > 0) localStorage.setItem(`aiWriteupPreferences_${division}`, JSON.stringify(userPreferences));
    else localStorage.removeItem(`aiWriteupPreferences_${division}`);
  }, [userPreferences, division]);
  const detectAndSavePreferences = useCallback((userMessage, selectedText) => {
    const lowerMessage = userMessage.toLowerCase();
    const newPrefs = { ...userPreferences }; let detected = [];
    if (lowerMessage.includes("don't mention") || lowerMessage.includes("exclude")) {
      if (lowerMessage.includes("market")) { newPrefs.excludeMarketPositioning = true; detected.push("Exclude market positioning"); }
      if (lowerMessage.includes("benchmark")) { newPrefs.excludeIndustryBenchmarks = true; detected.push("Exclude industry benchmarks"); }
      if (lowerMessage.includes("strategy")) { newPrefs.excludeStrategy = true; detected.push("Exclude strategy"); }
      if (lowerMessage.includes("growth")) { newPrefs.excludeGrowth = true; detected.push("Exclude growth"); }
      if (lowerMessage.includes("trend") || lowerMessage.includes("yoy")) { newPrefs.excludeTrends = true; detected.push("Exclude trends/YoY"); }
    }
    if ((lowerMessage.includes("remove") || lowerMessage.includes("delete")) && selectedText) {
      newPrefs.excludedText = newPrefs.excludedText || [];
      if (!newPrefs.excludedText.includes(selectedText)) { newPrefs.excludedText.push(selectedText); detected.push(`Exclude text: "${selectedText.substring(0, 30)}..."`); }
    }
    if (lowerMessage.includes("always include") || lowerMessage.includes("focus on")) {
      if (lowerMessage.includes("cost")) { newPrefs.focusOnCosts = true; detected.push("Focus on costs"); }
      if (lowerMessage.includes("margin")) { newPrefs.focusOnMargins = true; detected.push("Focus on margins"); }
      if (lowerMessage.includes("efficiency")) { newPrefs.focusOnEfficiency = true; detected.push("Focus on efficiency"); }
    }
    if (lowerMessage.includes("short") || lowerMessage.includes("concise")) { newPrefs.preferShortFormat = true; delete newPrefs.preferDetailedFormat; detected.push("Prefer short format"); }
    if (lowerMessage.includes("detailed") || lowerMessage.includes("thorough")) { newPrefs.preferDetailedFormat = true; delete newPrefs.preferShortFormat; detected.push("Prefer detailed format"); }
    if (lowerMessage.includes("use mt")) { newPrefs.preferMT = true; detected.push("Use MT units"); }
    if (lowerMessage.includes("thousands") || lowerMessage.includes("use k")) { newPrefs.preferThousands = true; detected.push("Use thousands (K)"); }
    if (detected.length > 0) { setUserPreferences(newPrefs); return detected; }
    return [];
  }, [userPreferences]);
  const applyUserPreferences = useCallback((content) => {
    let modified = content;
    if (userPreferences.excludeMarketPositioning) modified = modified.replace(/• Market Positioning:.*?\n|\*\*Market Position.*?\n\n/gs, '');
    if (userPreferences.excludeIndustryBenchmarks) modified = modified.replace(/• Industry comparison:.*?\n|Industry norm:.*?\)|vs Industry norm.*?\n/g, '');
    if (userPreferences.excludeStrategy) modified = modified.replace(/\*\*STRATEGIC RECOMMENDATIONS\*\*.*?(?=\*\*|$)/gs, '');
    if (userPreferences.excludeGrowth) modified = modified.replace(/\*\*.*?GROWTH.*?\*\*.*?(?=\*\*|$)/gs, '');
    if (userPreferences.excludeTrends) modified = modified.replace(/\(\s*[\+\-]?\d+\.\d+%\s*YoY\)|,\s*[\+\-]?\d+\.\d+%\s*YoY|CAGR\s*[\+\-]?\d+\.\d+%\s*over\s*\d+\s*years/g, '');
    if (userPreferences.excludedText) userPreferences.excludedText.forEach(t => { const esc = t.replace(/[.*+?^${}()|[\]\\]/g, '\\$&'); modified = modified.replace(new RegExp(`(${esc})`, 'gi'), ''); });
    if (userPreferences.preferMT) modified = modified.replace(/k tons?/g, 'MT');
    if (userPreferences.preferThousands) modified = modified.replace(/(\d+\.?\d*)\s*M\b/g, (m, n) => `${(parseFloat(n) * 1000).toFixed(0)}K`);
    return modified;
  }, [userPreferences]);
  const adjustFormat = useCallback((content, data) => {
    let modified = content;
    if (userPreferences.preferShortFormat) {
      modified = modified.replace(/• Cost per Ton Trend:.*?\n|• Margin Efficiency:.*?\n|• Profitability Trend:.*?\n|• Cost Efficiency:.*?\n|• Cost Trend:.*?\n|\*\*OPERATIONAL EFFICIENCY ANALYSIS\*\*.*?(?=\*\*|$)/gs, '');
    } else if (userPreferences.preferDetailedFormat && data) {
      if (!modified.includes('**DETAILED METRICS**')) {
        modified += `\n\n**DETAILED METRICS**\n`;
        modified += `• Total Cost Breakdown: Material (${formatCurrency(data.material, 'millions')}), Mfg (${formatCurrency(data.mfgExpenses, 'millions')}), Below GP (${formatCurrency(data.belowGP, 'millions')})\n`;
        modified += `• Efficiency Ratios: Material/Sales (${formatPercentage(data.sales > 0 ? (data.material / data.sales * 100) : 0)}), Mfg/Sales (${formatPercentage(data.sales > 0 ? (data.mfgExpenses / data.sales * 100) : 0)}%)\n`;
      }
    }
    return modified;
  }, [userPreferences]);
  return { userPreferences, detectAndSavePreferences, applyUserPreferences, adjustFormat };
}

// Custom hook for managing chat functionality
function useChat(applyUserPreferences, adjustFormat) {
  const [chatMessages, setChatMessages] = useState([]);
  const [currentPrompt, setCurrentPrompt] = useState('');
  const [selectedText, setSelectedText] = useState('');
  const [showChat, setShowChat] = useState(false);
  const [chatLoading, setChatLoading] = useState(false);
  const handleTextSelection = useCallback(() => {
    const selection = window.getSelection(); const text = selection.toString().trim();
    if (text.length > 0) { setSelectedText(text); setShowChat(true); }
  }, []);
  const captureSelectedText = useCallback(() => {
    const selection = window.getSelection(); const text = selection.toString().trim();
    if (text.length > 0) { setSelectedText(text); setShowChat(true); return text; }
    return null;
  }, []);
  const clearSelectedText = useCallback(() => setSelectedText(''), []);
  return { chatMessages, setChatMessages, currentPrompt, setCurrentPrompt, selectedText, setSelectedText, showChat, setShowChat, chatLoading, setChatLoading, handleTextSelection, captureSelectedText, clearSelectedText };
}

// Custom hook for managing writeup state and operations
function useWriteup(applyUserPreferences, adjustFormat) {
  const [writeup, setWriteupState] = useState('');
  const [loading, setLoading] = useState(false);
  const [editing, setEditing] = useState(false);
  const [error, setError] = useState(null);
  const [hasAutoGenerated, setHasAutoGenerated] = useState(false);
  const [generationCount, setGenerationCount] = useState(0);
  const [currentFinancialData, setCurrentFinancialData] = useState(null);
  const [regenerationFeedback, setRegenerationFeedback] = useState('');
  const historyStackRef = useRef(createHistoryStack(''));
  const [canUndo, setCanUndo] = useState(false);
  const [canRedo, setCanRedo] = useState(false);
  const setWriteup = useCallback((newWriteup) => {
    setWriteupState(newWriteup);
    historyStackRef.current.push(newWriteup);
    setCanUndo(historyStackRef.current.canUndo());
    setCanRedo(historyStackRef.current.canRedo());
  }, []);
  const undo = useCallback(() => {
    const previousState = historyStackRef.current.undo();
    if (previousState !== null) { setWriteupState(previousState); setCanUndo(historyStackRef.current.canUndo()); setCanRedo(historyStackRef.current.canRedo()); }
  }, []);
  const redo = useCallback(() => {
    const nextState = historyStackRef.current.redo();
    if (nextState !== null) { setWriteupState(nextState); setCanUndo(historyStackRef.current.canUndo()); setCanRedo(historyStackRef.current.canRedo()); }
  }, []);
  const replaceInWriteup = useCallback((oldText, newText, caseSensitive = false, writeupRef) => {
    let updatedWriteup = writeup;
    const escapedText = oldText.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
    updatedWriteup = updatedWriteup.replace(new RegExp(escapedText, caseSensitive ? 'g' : 'gi'), newText);
    setWriteup(updatedWriteup);
    if (writeupRef.current) writeupRef.current.innerText = updatedWriteup;
    return updatedWriteup;
  }, [writeup, setWriteup]);
  const debouncedSetWriteup = useCallback(debounce((text) => setWriteup(text), 300), [setWriteup]);
  const handleDivEdit = useCallback((e) => {
    const text = e.currentTarget.innerText;
    setWriteupState(text); // Update UI immediately
    debouncedSetWriteup(text); // Debounce history update
    setEditing(true);
  }, [debouncedSetWriteup]);
  const handleDivBlur = useCallback(async (e) => {
    setEditing(false);
    setWriteup(e.currentTarget.innerText); // Ensure final state is saved
  }, [setWriteup]);
  const formatWriteupForDisplay = useCallback((text) => {
    if (!text) return null;
    const processedText = sanitizeHTML(text)
      .replace(/\*\*([A-Z\s:]+)\*\*/g, '<h3 style="font-size:18px;font-weight:bold;color:#1f2937;margin:20px 0 12px 0;border-bottom:2px solid #e5e7eb;padding-bottom:8px;">$1</h3>')
      .replace(/\*\*([^*]+)\*\*/g, '<strong style="font-weight:bold;color:#374151;">$1</strong>')
      .replace(/\n• /g, '<br />• ')
      .replace(/\n\n/g, '<br /><br />').replace(/\n/g, '<br />');
    const paragraphs = processedText.split('<br /><br />').filter(p => p.trim() !== '');
    return paragraphs.map((para, pIdx) => (
      <div key={pIdx} style={{ marginBottom: 16, lineHeight: '1.6', color: '#333', fontSize: '15px' }} dangerouslySetInnerHTML={{ __html: para }} />
    ));
  }, []);
  return { writeup, setWriteup, loading, setLoading, editing, setEditing, error, setError, hasAutoGenerated, setHasAutoGenerated, generationCount, setGenerationCount, currentFinancialData, setCurrentFinancialData, regenerationFeedback, setRegenerationFeedback, replaceInWriteup, handleDivEdit, handleDivBlur, formatWriteupForDisplay, undo, redo, canUndo, canRedo };
}

// Custom hook for industry norms
function useIndustryNorms(periodKey, division) {
  const [industryNorms, setIndustryNorms] = useState({});
  useEffect(() => {
    const loadNorms = async () => { const norms = await fetchWriteup(periodKey, division); setIndustryNorms(norms || {}); };
    loadNorms();
  }, [periodKey, division]);
  return industryNorms;
}

// Helper function to generate expanded content
async function generateExpandedContent(prompt, context, financialData, userPreferences, industryNorms) {
  const data = financialData || {}; const lowerPrompt = prompt.toLowerCase();
  if (lowerPrompt.includes('margin') || lowerPrompt.includes('profitability')) {
    let txt = `**DETAILED MARGIN ANALYSIS**\n\nExpanded profitability insights:\n\n**Cost Breakdown:**\n• Material: ${formatCurrency(data.material)} (${formatPercentage(data.sales > 0 ? (data.material / data.sales * 100) : 0)} of sales)\n• Mfg Expenses: ${formatCurrency(data.mfgExpenses)} (${formatPercentage(data.sales > 0 ? (data.mfgExpenses / data.sales * 100) : 0)}%)\n• Below GP: ${formatCurrency(data.belowGP)} (${formatPercentage(data.sales > 0 ? (data.belowGP / data.sales * 100) : 0)}%)\n`;
    if (!userPreferences.preferShortFormat) txt += `\n**Optimization Opportunities:**\n• Negotiate supplier contracts for ${data.materialRatio > 70 ? '5-10%' : '2-5%'} cost reduction\n• Implement lean manufacturing to cut mfg costs by ${data.mfgRatio > 20 ? '10%' : '5%'}\n• Adjust product mix for higher margins\n`;
    if (userPreferences.preferDetailedFormat) txt += `\n**Benchmarking:**\n• Gross Margin vs ${formatPercentage(industryNorms.grossProfit || 15)} industry norm\n• Net Margin vs ${formatPercentage(industryNorms.netProfit || 7)} sector average\n• EBITDA Margin vs ${formatPercentage(industryNorms.ebitda || 12)} standard\n`;
    return txt;
  }
  // ... (other expansion logic similar to original, using formatCurrency/formatPercentage)
  return `**ADDITIONAL ANALYSIS**\n\nInsights for "${prompt}":\n\n**Assessment:**\n• Metrics indicate ${data.sales > 0 ? 'active' : 'limited'} operations\n• Efficiency needs ${data.mfgRatio > 20 ? 'improvement' : 'monitoring'}\n\n**Recommendations:**\n• Optimize costs by ${data.totalCostRatio > 80 ? '5%' : '3%'}\n• Expand volume with ${data.salesVolume > 50000 ? 'high' : 'moderate'} capacity\n\n**Next Steps:**\n• Simulate scenarios via chat (e.g., "What if mfg costs drop by 5%?")\n• Generate charts for trends\n`;
}

// --- SUB-COMPONENTS --- //

const ExportOptions = ({ writeup, onExport }) => {
  const [showOptions, setShowOptions] = useState(false);
  const [exportFormat, setExportFormat] = useState('pdf');
  const [isExporting, setIsExporting] = useState(false);
  const handleExport = async () => {
    setIsExporting(true);
    try { await new Promise(resolve => setTimeout(resolve, 1000)); onExport(exportFormat); setShowOptions(false); } 
    catch (error) { console.error('Export failed:', error); } 
    finally { setIsExporting(false); }
  };
  return (
    <div className="export-options" style={{ position: 'relative' }}>
      <button onClick={() => setShowOptions(!showOptions)} aria-expanded={showOptions} aria-label="Export options" style={{ padding: '5px 10px', background: '#f0f0f0', border: '1px solid #ddd', borderRadius: '4px', cursor: 'pointer', display: 'flex', alignItems: 'center', gap: '5px' }}>
        <span role="img" aria-hidden="true" style={{ fontSize: '14px' }}>📤</span> Export
      </button>
      {showOptions && (
        <div style={{ position: 'absolute', top: '100%', right: 0, marginTop: '5px', background: '#fff', border: '1px solid #ddd', borderRadius: '4px', padding: '10px', boxShadow: '0 2px 10px rgba(0,0,0,0.1)', zIndex: 10, minWidth: '200px' }}>
          <h4 style={{ margin: '0 0 10px 0', fontSize: '14px' }}>Export Format</h4>
          <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
            {['pdf', 'docx', 'txt', 'markdown'].map(format => (
              <label key={format} style={{ display: 'flex', alignItems: 'center', gap: '5px', cursor: 'pointer' }}>
                <input type="radio" name="exportFormat" value={format} checked={exportFormat === format} onChange={() => setExportFormat(format)} />
                {format.toUpperCase()} {format === 'docx' ? 'Document' : format === 'txt' ? 'Text' : format === 'markdown' ? 'File' : 'Document'}
              </label>
            ))}
          </div>
          <div style={{ marginTop: '15px', display: 'flex', justifyContent: 'space-between' }}>
            <button onClick={() => setShowOptions(false)} style={{ padding: '5px 10px', background: '#f0f0f0', border: '1px solid #ddd', borderRadius: '4px', cursor: 'pointer' }}>Cancel</button>
            <button onClick={handleExport} disabled={isExporting} style={{ padding: '5px 10px', background: '#007bff', color: '#fff', border: 'none', borderRadius: '4px', cursor: isExporting ? 'not-allowed' : 'pointer' }}>{isExporting ? 'Exporting...' : 'Export'}</button>
          </div>
        </div>
      )}
    </div>
  );
};

const WriteupEditor = ({ writeup, handleDivEdit, handleDivBlur, handleTextSelection, formatWriteupForDisplay, loading, error, regenerationFeedback, hasAutoGenerated, generateDetailedWriteup, undo, redo, canUndo, canRedo }) => {
  const writeupRef = useRef(null);
  useEffect(() => {
    const shortcuts = { 'Ctrl+z': (e) => { if (canUndo) undo(); }, 'Ctrl+y': (e) => { if (canRedo) redo(); }, 'Ctrl+Shift+z': (e) => { if (canRedo) redo(); } };
    const removeKeyboardShortcuts = createKeyboardShortcuts(shortcuts);
    return () => removeKeyboardShortcuts();
  }, [undo, redo, canUndo, canRedo]);
  const handleExport = async (format) => { try { await exportWriteup(writeup, format); } catch (error) { console.error('Export failed:', error); } };
  return (
    <div className="ai-writeup-content" style={{ flex: 2, background: '#fff', borderRadius: '10px', boxShadow: '0 2px 10px rgba(0,0,0,0.05)', padding: '20px' }} role="region" aria-label="Financial analysis writeup editor">
      <div style={{ display: 'flex', justifyContent: 'flex-end', marginBottom: '10px', gap: '8px' }} role="toolbar" aria-label="Editor toolbar">
        <button onClick={undo} disabled={!canUndo} title="Undo (Ctrl+Z)" aria-label="Undo" style={{ padding: '5px 10px', background: canUndo ? '#f0f0f0' : '#e0e0e0', color: canUndo ? '#333' : '#999', border: '1px solid #ddd', borderRadius: '4px', cursor: canUndo ? 'pointer' : 'not-allowed' }}>Undo</button>
        <button onClick={redo} disabled={!canRedo} title="Redo (Ctrl+Y)" aria-label="Redo" style={{ padding: '5px 10px', background: canRedo ? '#f0f0f0' : '#e0e0e0', color: canRedo ? '#333' : '#999', border: '1px solid #ddd', borderRadius: '4px', cursor: canRedo ? 'pointer' : 'not-allowed' }}>Redo</button>
        <ExportOptions writeup={writeup} onExport={handleExport} />
      </div>
      <div ref={writeupRef} contentEditable={true} onInput={handleDivEdit} onBlur={handleDivBlur} onMouseUp={handleTextSelection} suppressContentEditableWarning={true} role="textbox" aria-multiline="true" aria-label="Financial analysis content" tabIndex={0} style={{ minHeight: '400px', padding: 'none', outline: 'none', fontFamily: 'Arial, sans-serif', fontSize: '14px', color: '#333333', lineHeight: '1.6', overflowY: 'auto' }}>
        {formatWriteupForDisplay(writeup)}
      </div>
      {loading && <div style={{ marginTop: '20px', textAlign: 'center' }}><p>Loading analysis...</p></div>}
      {error && <div style={{ marginTop: '20px', color: '#ff4444' }}>{error}</div>}
      {regenerationFeedback && <div style={{ marginTop: '20px', color: '#666666' }}>{regenerationFeedback}</div>}
      {!hasAutoGenerated && !loading && (
        <button onClick={generateDetailedWriteup} style={{ marginTop: '20px', padding: '10px 20px', background: '#007bff', color: '#fff', border: 'none', borderRadius: '5px', cursor: 'pointer' }}>Generate Analysis</button>
      )}
    </div>
  );
};

const ChatPanel = ({ showChat, chatMessages, currentPrompt, setCurrentPrompt, handleChatSubmit, chatLoading, selectedText, clearSelectedText }) => {
  const chatInputRef = useRef(null);
  const messagesEndRef = useRef(null);
  const deviceInfo = getDeviceInfo();
  useEffect(() => { if (messagesEndRef.current) messagesEndRef.current.scrollIntoView({ behavior: 'smooth' }); }, [chatMessages]);
  useEffect(() => { if (showChat && chatInputRef.current) chatInputRef.current.focus(); }, [showChat]);
  if (!showChat) return null;
  return (
    <div style={{ flex: '1', maxWidth: deviceInfo.isMobile ? '100%' : '400px', background: '#fff', borderRadius: '10px', boxShadow: '0 2px 10px rgba(0,0,0,0.05)', padding: '20px', display: 'flex', flexDirection: 'column', width: deviceInfo.isMobile ? '100%' : 'auto' }} role="complementary" aria-label="Chat panel">
      <h4 style={{ marginBottom: '16px', fontSize: '18px', color: '#333' }} id="chat-heading">Chat Actions</h4>
      <div style={{ flex: '1', overflowY: 'auto', marginBottom: '16px', padding: '10px', border: '1px solid #eee', borderRadius: '5px', minHeight: '200px' }} role="log" aria-live="polite" aria-label="Chat messages">
        {chatMessages.map((msg, idx) => (
          <div key={idx} style={{ marginBottom: '10px', padding: '8px', borderRadius: '5px', background: msg.type === 'user' ? '#e6f7ff' : msg.type === 'error' ? '#ff4444' : '#f0f0f0', color: msg.type === 'error' ? '#fff' : '#333' }} role={msg.type === 'error' ? 'alert' : 'comment'} aria-label={`${msg.type} message`}>
            <p style={{ fontSize: '14px' }}>[{msg.timestamp.toLocaleTimeString()}]: {msg.content}</p>
            {msg.context && <p style={{ fontSize: '12px', color: '#666', marginTop: '4px' }}>Context: {msg.context.substring(0, 50)}{msg.context.length > 50 ? '...' : ''}</p>}
          </div>
        ))}
        <div ref={messagesEndRef} />
      </div>
      <form onSubmit={handleChatSubmit} style={{ display: 'flex', gap: '8px', flexDirection: deviceInfo.isMobile ? 'column' : 'row' }} aria-labelledby="chat-heading">
        <input ref={chatInputRef} type="text" value={currentPrompt} onChange={(e) => setCurrentPrompt(e.target.value)} placeholder="e.g., 'Expand on costs' or 'this text' or 'What if?'" style={{ flex: '1', padding: '8px', border: '1px solid #ccc', borderRadius: '5px', fontSize: '14px' }} aria-label="Chat message" />
        <button type="submit" disabled={chatLoading} style={{ padding: '8px 16px', background: chatLoading ? '#ccc' : '#333333', color: '#fff', border: 'none', borderRadius: '5px', cursor: chatLoading ? 'not-allowed' : 'pointer' }} aria-busy={chatLoading}>{chatLoading ? 'Sending...' : 'Send'}</button>
      </form>
      {selectedText && (
        <div style={{ marginTop: '12px', padding: '8px', background: '#f9f9f9', borderRadius: '5px', fontSize: '14px', color: '#555' }} role="status">
          <p>Selected: {selectedText.substring(0, 50)}{selectedText.length > 50 ? '...' : ''}</p>
          <button onClick={() => clearSelectedText()} style={{ marginTop: '8px', padding: '4px 8px', background: '#ff4444', color: '#fff', border: 'none', borderRadius: '5px', cursor: 'pointer' }} aria-label="Clear selected text">Clear Selection</button>
        </div>
      )}
    </div>
  );
};

// --- MAIN COMPONENT --- //

const AIWriteupPanel = ({ tableData, selectedPeriods, basePeriod, division, chatContext, computeCellValue }) => {
  const periodKey = getPeriodKey(selectedPeriods);
  const divisionNames = useMemo(() => ({ FP: 'Flexible Packaging', SB: 'Shopping Bags', TF: 'Thermoforming', HCM: 'Preforms & Closures' }), []);
  const { userPreferences, detectAndSavePreferences, applyUserPreferences, adjustFormat } = usePreferences(division);
  const { writeup, setWriteup, loading, setLoading, editing, setEditing, error, setError, hasAutoGenerated, setHasAutoGenerated, generationCount, setGenerationCount, currentFinancialData, setCurrentFinancialData, regenerationFeedback, setRegenerationFeedback, replaceInWriteup, handleDivEdit, handleDivBlur, formatWriteupForDisplay, undo, redo, canUndo, canRedo } = useWriteup(applyUserPreferences, adjustFormat);
  const { chatMessages, setChatMessages, currentPrompt, setCurrentPrompt, selectedText, setSelectedText, showChat, setShowChat, chatLoading, setChatLoading, handleTextSelection, captureSelectedText, clearSelectedText } = useChat(applyUserPreferences, adjustFormat);
  const industryNorms = useIndustryNorms(periodKey, division);

  const generateDetailedWriteup = useCallback(async () => {
    if (loading) return;
    setLoading(true); setError(null); setRegenerationFeedback('');
    const timeoutId = setTimeout(() => { setLoading(false); setError('Generation timed out.'); }, 30000);
    try {
      function getKPI(rowIndex, period) {
        if (!period || !computeCellValue) return 0;
        try { const value = computeCellValue(rowIndex, period); return typeof value === 'number' && !isNaN(value) ? value : 0; } 
        catch (err) { console.error(`Error getting KPI row ${rowIndex}:`, err); return 0; }
      }
      if (!basePeriod || !selectedPeriods || selectedPeriods.length === 0) throw new Error('Missing period data');
      const basePeriodName = `${basePeriod.year} ${basePeriod.isCustomRange ? basePeriod.displayName : (basePeriod.month || '')} ${basePeriod.type}`.trim();
      const baseData = { sales: getKPI(3, basePeriod), material: getKPI(5, basePeriod), grossProfit: getKPI(4, basePeriod), mfgExpenses: getKPI(14, basePeriod), belowGP: getKPI(52, basePeriod), netProfit: getKPI(54, basePeriod), ebitda: getKPI(56, basePeriod), salesVolume: getKPI(7, basePeriod), labor: getKPI(15, basePeriod), electricity: getKPI(17, basePeriod), admin: getKPI(19, basePeriod) };
      const prevPeriodsData = selectedPeriods.filter(p => p !== basePeriod).map(p => ({ year: p.year, sales: getKPI(3, p), material: getKPI(5, p), grossProfit: getKPI(4, p), netProfit: getKPI(54, p), ebitda: getKPI(56, p), salesVolume: getKPI(7, p), mfgExpenses: getKPI(14, p) }));
      const totalCosts = baseData.material + baseData.mfgExpenses + baseData.belowGP;
      const metrics = {
        grossMargin: baseData.sales > 0 ? (baseData.grossProfit / baseData.sales) * 100 : 0,
        netMargin: baseData.sales > 0 ? (baseData.netProfit / baseData.sales) * 100 : 0,
        ebitdaMargin: baseData.sales > 0 ? (baseData.ebitda / baseData.sales) * 100 : 0,
        materialRatio: baseData.sales > 0 ? (baseData.material / baseData.sales) * 100 : 0,
        mfgRatio: baseData.sales > 0 ? (baseData.mfgExpenses / baseData.sales) * 100 : 0,
        belowGPRatio: baseData.sales > 0 ? (baseData.belowGP / baseData.sales) * 100 : 0,
        laborRatio: baseData.sales > 0 ? (baseData.labor / baseData.sales) * 100 : 0,
        electricityRatio: baseData.sales > 0 ? (baseData.electricity / baseData.sales) * 100 : 0,
        adminRatio: baseData.sales > 0 ? (baseData.admin / baseData.sales) * 100 : 0,
        pricePerKg: baseData.salesVolume > 0 ? baseData.sales / baseData.salesVolume : 0,
        revenuePerTon: baseData.salesVolume > 0 ? baseData.sales / (baseData.salesVolume / 1000) : 0,
        materialCostPerTon: baseData.salesVolume > 0 ? baseData.material / (baseData.salesVolume / 1000) : 0,
        grossProfitPerTon: baseData.salesVolume > 0 ? baseData.grossProfit / (baseData.salesVolume / 1000) : 0,
        mfgCostPerTon: baseData.salesVolume > 0 ? baseData.mfgExpenses / (baseData.salesVolume / 1000) : 0,
        marginOverMaterial: baseData.material > 0 ? ((baseData.sales - baseData.material) / baseData.material) * 100 : 0,
        totalCosts: totalCosts,
        totalCostRatio: baseData.sales > 0 ? (totalCosts / baseData.sales) * 100 : 0,
      };
      const prevYear1 = prevPeriodsData.find(p => p.year === basePeriod.year - 1);
      const prevYear2 = prevPeriodsData.find(p => p.year === basePeriod.year - 2);
      const salesCAGR = calcCAGR(baseData.sales, prevYear1?.sales, prevYear2?.sales, 2);
      const grossMarginCAGR = calcCAGR(metrics.grossMargin, prevYear1 ? (prevYear1.grossProfit / prevYear1.sales) * 100 : 0, prevYear2 ? (prevYear2.grossProfit / prevYear2.sales) * 100 : 0, 2);
      const prevYearData = prevYear1;
      const yoySalesChange = prevYearData && prevYearData.sales > 0 ? ((baseData.sales - prevYearData.sales) / prevYearData.sales) * 100 : 0;
      const yoyGrossMarginChange = prevYearData && prevYearData.grossProfit > 0 ? ((metrics.grossMargin - (prevYearData.grossProfit / prevYearData.sales) * 100) / (prevYearData.grossProfit / prevYearData.sales) * 100) : 0;
      const yoyNetMarginChange = prevYearData && prevYearData.netProfit > 0 ? ((metrics.netMargin - (prevYearData.netProfit / prevYearData.sales) * 100) / (prevYearData.netProfit / prevYearData.sales) * 100) : 0;
      const yoyMfgCostChange = prevYearData && prevYearData.mfgExpenses > 0 ? ((metrics.mfgCostPerTon - (prevYearData.mfgExpenses / (prevYearData.salesVolume / 1000))) / (prevYearData.mfgExpenses / (prevYearData.salesVolume / 1000)) * 100) : 0;
      const norms = industryNorms || { marginOverMaterial: 18, grossProfit: 15, netProfit: 7, ebitda: 12 };

      // --- AI Text Generation (Simplified for brevity, use original logic) ---
      let aiText = `**FINANCIAL ANALYSIS: ${basePeriodName} - ${divisionNames[division] || division}**\n\n`;
      aiText += `**SUMMARY**\nSales: ${formatCurrency(baseData.sales)}, Gross Margin: ${formatPercentage(metrics.grossMargin)}, Net Margin: ${formatPercentage(metrics.netMargin)}\n\n`;
      aiText += `**DETAILS**\nRevenue: ${formatCurrency(baseData.sales)} (${formatPercentage(yoySalesChange)} YoY)\nVolume: ${(baseData.salesVolume / 1000).toFixed(1)} k tons\nGP: ${formatCurrency(baseData.grossProfit)} (${formatPercentage(metrics.grossMargin)} margin)\nNP: ${formatCurrency(baseData.netProfit)} (${formatPercentage(metrics.netMargin)} margin)\nCosts: Material ${formatPercentage(metrics.materialRatio)}, Mfg ${formatPercentage(metrics.mfgRatio)}\n\n`;
      aiText += `**RECOMMENDATIONS**\nOptimize costs, adjust pricing.\n\n`;
      aiText += `Use chat for scenarios (e.g., "What if material costs drop 5%?").\n`;
      // --- End AI Text Generation ---

      const originalText = aiText;
      aiText = applyUserPreferences(aiText);
      aiText = adjustFormat(aiText, baseData);
      setRegenerationFeedback(aiText === originalText ? 'ℹ No changes applied.' : '✅ Preferences applied.');
      setWriteup(aiText);
      setHasAutoGenerated(true);
      setGenerationCount(prev => prev + 1);
      setChatMessages(prev => [...prev, { type: 'system', content: `Analysis regenerated.`, timestamp: new Date() }]);
      setCurrentFinancialData({ ...baseData, ...metrics });
    } catch (err) { console.error('Writeup generation error:', err); setError(`Failed: ${err.message}`); }
    finally { setLoading(false); clearTimeout(timeoutId); }
  }, [loading, userPreferences, basePeriod, selectedPeriods, division, divisionNames, industryNorms, computeCellValue, applyUserPreferences, adjustFormat, setWriteup, setLoading, setError, setRegenerationFeedback, setHasAutoGenerated, setGenerationCount, setChatMessages, setCurrentFinancialData]);

  const handleChatSubmit = useCallback(async (e) => {
    e.preventDefault();
    if (!currentPrompt.trim() || chatLoading) return;
    setChatLoading(true); setRegenerationFeedback('');
    const userMessage = currentPrompt.trim();
    const newUserMessage = { type: 'user', content: userMessage, context: selectedText, timestamp: new Date() };
    setChatMessages(prev => [...prev, newUserMessage]);
    setCurrentPrompt('');
    try {
      const detectedPreferences = detectAndSavePreferences(userMessage, selectedText);
      const isCorrection = /not|should be|change|correct|fix|replace/i.test(userMessage);
      const isRemove = /remove|delete/i.test(userMessage);
      const isScenario = /what if|scenario/i.test(userMessage);
      const isExpand = /add|expand|detail|more/i.test(userMessage);
      const isMemoryRequest = /as i mentioned|earlier/i.test(userMessage);
      const isRegenerateRequest = /apply|reapply|update|regenerate/i.test(userMessage);
      let aiResponseText = ''; let updatedWriteup = writeup;

      if (isRemove && selectedText) {
        updatedWriteup = replaceInWriteup(selectedText, '', false, { current: document.querySelector('[contenteditable=true]') });
        aiResponseText = `✅ Removed "${selectedText.substring(0, 30)}...".`;
        if (detectedPreferences.length > 0) aiResponseText += `\n🧠 Preferences learned.`;
      } else if (detectedPreferences.length > 0) {
        aiResponseText = `🧠 Preferences learned: ${detectedPreferences.join(', ')}.`;
        const formattedWriteup = adjustFormat(applyUserPreferences(writeup), currentFinancialData);
        if (formattedWriteup !== writeup) { setWriteup(formattedWriteup); updatedWriteup = formattedWriteup; aiResponseText += '\n✅ Applied live.'; }
        else { aiResponseText += '\nℹ No changes applied.'; }
      } else if (isRegenerateRequest) {
        aiResponseText = '🔄 Regenerating analysis...';
        await generateDetailedWriteup(); // Await regeneration
      } else if (isCorrection) {
        // Simplified correction logic
        aiResponseText = '❌ Correction noted. Please specify using "Change X to Y".';
      } else if (isScenario && currentFinancialData) {
        // Simplified scenario logic
        aiResponseText = '📊 Scenario noted. Use format "What if [variable] by [amount%]?".';
      } else if (isExpand) {
        try {
          const expandedContent = await generateExpandedContent(userMessage, selectedText, currentFinancialData, userPreferences, industryNorms);
          updatedWriteup += '\n\n' + adjustFormat(applyUserPreferences(expandedContent), currentFinancialData);
          setWriteup(updatedWriteup);
          aiResponseText = `✅ Expansion applied live.`;
        } catch (error) { aiResponseText = '❌ Expansion error.'; }
      } else if (isMemoryRequest) {
        // Simplified memory logic
        aiResponseText = `🧠 Memory request noted.`;
      } else {
        aiResponseText = '💡 Please specify a request (expand, correct, remove, scenario, regenerate).';
      }

      if (!isRegenerateRequest) { // Don't add response if regenerate already added one
         setChatMessages(prev => [...prev, { type: 'assistant', content: aiResponseText, timestamp: new Date() }]);
      }

    } catch (err) { console.error('Chat error:', err); setChatMessages(prev => [...prev, { type: 'error', content: 'Error processing request.', timestamp: new Date() }]); }
    finally { setChatLoading(false); setSelectedText(''); }
  }, [currentPrompt, chatLoading, selectedText, writeup, currentFinancialData, setChatMessages, setCurrentPrompt, setChatLoading, setSelectedText, setRegenerationFeedback, setWriteup, detectAndSavePreferences, applyUserPreferences, adjustFormat, replaceInWriteup, generateDetailedWriteup, chatMessages, industryNorms]);

  useEffect(() => {
    setWriteup(''); setHasAutoGenerated(false); setGenerationCount(0); setError(null); setChatMessages([]); setCurrentFinancialData(null); setRegenerationFeedback('');
  }, [periodKey, division]); // Reset on period/division change

  useEffect(() => {
    if (hasAutoGenerated && writeup) {
      const formattedWriteup = adjustFormat(applyUserPreferences(writeup), currentFinancialData);
      if (formattedWriteup !== writeup) { setWriteup(formattedWriteup); setRegenerationFeedback('✅ Preferences applied.'); }
    }
  }, [userPreferences]); // Re-apply preferences if they change

  const deviceInfo = getDeviceInfo();

  return (
    <div className="ai-writeup-container" style={{ display: 'flex', flexDirection: deviceInfo.isMobile ? 'column' : 'row', gap: '24px', marginTop: '40px' }}>
      <WriteupEditor 
        writeup={writeup} handleDivEdit={handleDivEdit} handleDivBlur={handleDivBlur} handleTextSelection={handleTextSelection} formatWriteupForDisplay={formatWriteupForDisplay}
        loading={loading} error={error} regenerationFeedback={regenerationFeedback} hasAutoGenerated={hasAutoGenerated} generateDetailedWriteup={generateDetailedWriteup}
        undo={undo} redo={redo} canUndo={canUndo} canRedo={canRedo}
      />
      <ChatPanel 
        showChat={showChat} chatMessages={chatMessages} currentPrompt={currentPrompt} setCurrentPrompt={setCurrentPrompt} handleChatSubmit={handleChatSubmit}
        chatLoading={chatLoading} selectedText={selectedText} clearSelectedText={clearSelectedText}
      />
    </div>
  );
};

export default AIWriteupPanel;


