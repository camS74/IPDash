import React, { useState } from 'react';
import './TabsComponent.css';

const TabsComponent = ({ children }) => {
  const [activeTab, setActiveTab] = useState(0);
  
  // Extract tab labels from children
  const tabLabels = React.Children.map(children, child => child.props.label);
  
  const handleTabClick = (index) => {
    setActiveTab(index);
  };
  
  return (
    <div className="tabs-container">
      <div className="tabs-header">
        {tabLabels.map((label, index) => (
          <div 
            key={index} 
            className={`tab-button ${activeTab === index ? 'active' : ''}`}
            onClick={() => handleTabClick(index)}
          >
            {label}
          </div>
        ))}
      </div>
      <div className="tabs-content">
        {React.Children.map(children, (child, index) => (
          <div className={`tab-panel ${activeTab === index ? 'active' : ''}`}>
            {child}
          </div>
        ))}
      </div>
    </div>
  );
};

export const Tab = ({ children }) => {
  return children;
};

export default TabsComponent;
