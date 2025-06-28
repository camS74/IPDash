// Shared KPI CSS content - single source of truth
// This ensures the main KPI component and HTML export use identical styling

export const KPI_CSS_CONTENT = `
/* KPI Executive Summary Styles - Enhanced Version */
.kpi-dashboard {
  background: white;
  min-height: 100vh;
  padding: 20px;
  font-family: 'Segoe UI', Tahoma, Geneva, Verdana, sans-serif;
}

.kpi-section {
  background: rgba(255, 255, 255, 0.98);
  border-radius: 10px;
  padding: 20px;
  margin-bottom: 20px;
  box-shadow: 0 6px 16px rgba(0, 0, 0, 0.06);
  border: 1px solid rgba(0, 0, 0, 0.04);
}

.kpi-section-title {
  font-size: 1.3em;
  font-weight: 700;
  color: #2c3e50;
  margin-bottom: 18px;
  text-align: center;
  border-bottom: 2px solid #667eea;
  padding-bottom: 10px;
  text-transform: uppercase;
  letter-spacing: 0.8px;
}

.kpi-cards {
  display: grid;
  grid-template-columns: repeat(auto-fit, minmax(220px, 1fr));
  gap: 14px;
  align-items: stretch;
}

.kpi-card {
  background: white;
  border-radius: 8px;
  padding: 16px;
  box-shadow: 0 3px 10px rgba(0, 0, 0, 0.05);
  border: 1px solid rgba(0, 0, 0, 0.05);
  transition: all 0.3s ease;
  position: relative;
  overflow: hidden;
  min-height: 150px;
  display: flex;
  flex-direction: column;
  justify-content: space-between;
}

.kpi-card:hover {
  transform: translateY(-3px);
  box-shadow: 0 8px 16px rgba(0, 0, 0, 0.08);
}

.kpi-card.large {
  grid-column: span 2;
  min-height: 170px;
}

.kpi-card::before {
  content: '';
  position: absolute;
  top: 0;
  left: 0;
  height: 100%;
  width: 3px;
  background: #667eea;
}

/* PROPER VISUAL HIERARCHY - UNIFORM FONT SYSTEM */

.kpi-icon {
  font-size: 1.8em;
  text-align: center;
  margin-bottom: 10px;
  line-height: 1;
}

/* LEVEL 1: CARD TITLES - LARGEST AND MOST PROMINENT */
.kpi-label {
  font-size: 1em;
  font-weight: 600;
  color: #2d3748;
  margin-bottom: 10px;
  text-align: center;
  text-transform: uppercase;
  letter-spacing: 0.6px;
  line-height: 1.2;
}

/* LEVEL 2: CARD CONTENT - UNIFORM MEDIUM SIZE */
.kpi-value {
  font-size: 1.25em;
  font-weight: 600;
  color: #4a5568;
  text-align: center;
  margin-bottom: 8px;
  line-height: 1.2;
  font-family: 'Segoe UI', sans-serif;
}

/* LEVEL 3: CARD TRENDS - SMALLEST */
.kpi-trend {
  font-size: 0.85em;
  text-align: center;
  color: #718096;
  font-weight: 500;
  line-height: 1.3;
}

/* Enhanced category cards styling */
.category-cards {
  display: grid;
  gap: 16px;
  margin-top: 20px;
}

.category-card {
  background: white;
  border-radius: 10px;
  padding: 16px;
  border-left: 4px solid #3b82f6;
  box-shadow: 0 4px 12px rgba(0, 0, 0, 0.06);
  min-height: 160px;
  display: flex;
  flex-direction: column;
  justify-content: space-between;
}

.category-title {
  font-weight: 700;
  color: #2d3748;
  margin-bottom: 10px;
  font-size: 1.1em;
  text-transform: uppercase;
  letter-spacing: 0.8px;
}

.category-metrics {
  display: grid;
  grid-template-columns: repeat(auto-fit, minmax(130px, 1fr));
  gap: 10px;
  font-size: 0.9em;
}

.category-metric {
  color: #4a5568;
  padding: 6px 0;
  border-bottom: 1px solid rgba(59, 130, 246, 0.2);
  font-weight: 500;
}

/* Responsive adjustments - Enhanced */
@media (max-width: 1400px) {
  .kpi-cards {
    grid-template-columns: repeat(auto-fit, minmax(220px, 1fr));
  }
}

@media (max-width: 1200px) {
  .kpi-cards {
    grid-template-columns: repeat(auto-fit, minmax(200px, 1fr));
  }
  
  .kpi-card.large {
    grid-column: span 1;
  }
  
  .kpi-label {
    font-size: 1em;
  }
  
  .kpi-value {
    font-size: 1.2em;
  }
  
  .kpi-icon {
    font-size: 1.8em;
  }
}

@media (max-width: 768px) {
  .kpi-dashboard {
    padding: 15px;
  }
  
  .kpi-section {
    padding: 18px;
    margin-bottom: 18px;
  }
  
  .kpi-cards {
    grid-template-columns: 1fr;
    gap: 12px;
  }
  
  .kpi-card {
    padding: 16px;
    min-height: 140px;
  }
  
  .kpi-label {
    font-size: 0.95em;
  }
  
  .kpi-value {
    font-size: 1.1em;
  }
  
  .kpi-icon {
    font-size: 1.7em;
  }
}

/* Top Revenue Drivers - MATCH OTHER CARDS EXACTLY */
.kpi-card .kpi-value ol {
  text-align: center;
  margin: 0;
  padding-left: 0;
  line-height: 1.3;
  list-style: none;
  display: flex;
  flex-direction: column;
  align-items: center;
  width: 100%;
  font-weight: inherit;
}

.kpi-card .kpi-value ol li {
  margin-bottom: 6px;
  display: flex;
  align-items: center;
  justify-content: center;
  font-weight: inherit;
  padding: 5px 10px;
  background: rgba(102, 126, 234, 0.04);
  border-radius: 4px;
  border-left: 2px solid #667eea;
  width: 98%;
  text-align: center;
  color: inherit;
}

/* Arrow color classes - Enhanced */
.arrow-positive {
  color: #10b981 !important;
  font-weight: 700;
}

.arrow-negative {
  color: #ef4444 !important;
  font-weight: 700;
}

/* Financial Performance Cards - Special styling */
.kpi-section:first-of-type .kpi-card:nth-child(1)::before {
  background: #10b981;
}

.kpi-section:first-of-type .kpi-card:nth-child(2)::before {
  background: #3b82f6;
}

.kpi-section:first-of-type .kpi-card:nth-child(3)::before {
  background: #8b5cf6;
}

.kpi-section:first-of-type .kpi-card:nth-child(4)::before {
  background: #f59e0b;
}

/* Product Performance Cards */
.kpi-section:nth-of-type(2) .kpi-card::before {
  background: #ef4444;
}

.kpi-section:nth-of-type(2) .kpi-card.large::before {
  background: #dc2626;
}

/* Geographic Distribution Cards */
.kpi-section:nth-of-type(3) .kpi-card::before {
  background: #06b6d4;
}

/* Customer Insights Cards */
.kpi-section:nth-of-type(4) .kpi-card::before {
  background: #84cc16;
}

/* UNIFORM SIZING FOR CATEGORY CARDS */
.kpi-section .kpi-cards[style*="gridTemplateColumns"] .kpi-card {
  min-height: 180px;
  max-height: 180px;
}

.kpi-section .kpi-cards[style*="gridTemplateColumns"] .kpi-card .kpi-value {
  font-size: 1.1em !important;
  line-height: 1.3 !important;
  flex-grow: 1;
  display: flex;
  flex-direction: column;
  justify-content: center;
  font-weight: 500 !important;
  color: #4a5568 !important;
}

.kpi-section .kpi-cards[style*="gridTemplateColumns"] .kpi-card .kpi-label {
  font-size: 1em !important;
  margin-bottom: 10px !important;
  font-weight: 600 !important;
  color: #2d3748 !important;
}

/* Top Revenue Drivers specific styling */
.revenue-drivers ol {
  list-style: none;
  padding-left: 20px;
  margin: 0;
}

.revenue-drivers li {
  margin-bottom: 2px;
  display: flex;
  align-items: center;
}

/* Remove font-size and font-weight overrides to inherit from parent card */
.revenue-drivers ol,
.revenue-drivers li {
  font-size: inherit;
  font-weight: inherit;
}

/* Geographic Distribution Cards */
.export-regions .kpi-card {
  min-height: 140px;
  display: flex;
  flex-direction: column;
  justify-content: space-between;
  align-items: center;
}

.export-regions .kpi-card::before {
  background: linear-gradient(to bottom, #06b6d4, #0284c7);
}

.export-regions .kpi-card .kpi-trend {
  font-size: 0.8em;
  color: #64748b;
}

/* UAE Local Card */
.uae-icon-container {
  width: 60px;
  height: 60px;
  margin: 0 auto 12px;
  display: flex;
  align-items: center;
  justify-content: center;
  border-radius: 50%;
  background: white;
  box-shadow: 0 4px 8px rgba(0, 0, 0, 0.1);
}

.uae-icon {
  width: 50px;
  height: 50px;
}

/* Globe Container */
.rotating-emoji-container {
  width: 60px;
  height: 60px;
  margin: 0 auto 12px;
  display: flex;
  align-items: center;
  justify-content: center;
  border-radius: 50%;
  background: white;
  box-shadow: 0 4px 8px rgba(0, 0, 0, 0.1);
  overflow: hidden;
}

.rotating-emoji {
  font-size: 40px;
  animation: rotate-emoji 20s linear infinite;
}

@keyframes rotate-emoji {
  0% {
    transform: rotate(0deg);
  }
  100% {
    transform: rotate(360deg);
  }
}

/* Region Globe Container */
.region-globe-container {
  width: 50px;
  height: 50px;
  margin: 0 auto 10px;
  display: flex;
  align-items: center;
  justify-content: center;
  border-radius: 50%;
  background: white;
  box-shadow: 0 4px 8px rgba(0, 0, 0, 0.1);
}

.region-globe {
  font-size: 32px;
  animation: pulse-globe 3s ease-in-out infinite;
}

@keyframes pulse-globe {
  0%, 100% {
    transform: scale(1);
  }
  50% {
    transform: scale(1.1);
  }
}

/* Responsive adjustments for export regions */
@media (max-width: 1200px) {
  .export-regions {
    grid-template-columns: repeat(3, 1fr) !important;
  }
}

@media (max-width: 768px) {
  .export-regions {
    grid-template-columns: repeat(2, 1fr) !important;
  }
}

@media (max-width: 480px) {
  .export-regions {
    grid-template-columns: 1fr !important;
  }
}

/* Back button styling for export */
.back-button {
  position: absolute;
  top: 20px;
  left: 20px;
  background: #667eea;
  color: white;
  border: none;
  padding: 10px 20px;
  border-radius: 6px;
  cursor: pointer;
  font-weight: 600;
  font-size: 14px;
  box-shadow: 0 2px 4px rgba(0, 0, 0, 0.1);
  transition: all 0.3s ease;
  z-index: 10;
}

.back-button:hover {
  background: #5a6fcf;
  transform: translateY(-1px);
  box-shadow: 0 4px 8px rgba(0, 0, 0, 0.15);
}
`; 