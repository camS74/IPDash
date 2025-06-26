const countryCoordinatesModule = require('./src/components/dashboard/countryCoordinates');

// Handle both default export and named export formats
const countryCoordinates = countryCoordinatesModule.default || countryCoordinatesModule;

// Define the regional mapping from KPIExecutiveSummary.js
const regionalMapping = {
  // UAE - Local
  'United Arab Emirates': 'UAE',
  'UAE': 'UAE',
  'UNITED ARAB EMIRATES': 'UAE',
  
  // GCC
  'Saudi Arabia': 'GCC',
  'Kingdom Of Saudi Arabia': 'GCC',
  'KINGDOM OF SAUDI ARABIA': 'GCC',
  'Kuwait': 'GCC',
  'KUWAIT': 'GCC',
  'Qatar': 'GCC',
  'QATAR': 'GCC',
  'Bahrain': 'GCC',
  'BAHRAIN': 'GCC',
  'Oman': 'GCC',
  'OMAN': 'GCC',
  'KSA': 'GCC',
  
  // Levant
  'Lebanon': 'Levant',
  'LEBANON': 'Levant',
  'Jordan': 'Levant',
  'JORDAN': 'Levant',
  'Syria': 'Levant',
  'SYRIA': 'Levant',
  'Syrian Arab Republic': 'Levant',
  'Palestine': 'Levant',
  'PALESTINE': 'Levant',
  'Iraq': 'Levant',
  'IRAQ': 'Levant',
  
  // North Africa (MENA)
  'Egypt': 'North Africa',
  'EGYPT': 'North Africa',
  'Libya': 'North Africa',
  'LIBYA': 'North Africa',
  'Tunisia': 'North Africa',
  'TUNISIA': 'North Africa',
  'Algeria': 'North Africa',
  'ALGERIA': 'North Africa',
  'Morocco': 'North Africa',
  'MOROCCO': 'North Africa',
  'Sudan': 'North Africa',
  'SUDAN': 'North Africa',
  'South Sudan': 'North Africa',
  'SOUTH SUDAN': 'North Africa',
  'Djibouti': 'North Africa',
  'DJIBOUTI': 'North Africa',
  
  // Southern Africa
  'South Africa': 'Southern Africa',
  'SOUTH AFRICA': 'Southern Africa',
  'Botswana': 'Southern Africa',
  'BOTSWANA': 'Southern Africa',
  'Namibia': 'Southern Africa',
  'NAMIBIA': 'Southern Africa',
  'Zimbabwe': 'Southern Africa',
  'ZIMBABWE': 'Southern Africa',
  'Kenya': 'Southern Africa',
  'KENYA': 'Southern Africa',
  'Nigeria': 'Southern Africa',
  'NIGERIA': 'Southern Africa',
  'Ghana': 'Southern Africa',
  'GHANA': 'Southern Africa',
  'Senegal': 'Southern Africa',
  'SENEGAL': 'Southern Africa',
  'Sierra Leone': 'Southern Africa',
  'SIERRA LEONE': 'Southern Africa',
  'Cameroon': 'Southern Africa',
  'CAMEROON': 'Southern Africa',
  'Congo': 'Southern Africa',
  'CONGO': 'Southern Africa',
  'Democratic Republic of Congo': 'Southern Africa',
  'DEMOCRATIC REPUBLIC OF CONGO': 'Southern Africa',
  'DEMOCRATIC REPUBLIC OF THE CON': 'Southern Africa',
  'Uganda': 'Southern Africa',
  'UGANDA': 'Southern Africa',
  'Rwanda': 'Southern Africa',
  'RWANDA': 'Southern Africa',
  'Tanzania': 'Southern Africa',
  'UNITED REPUBLIC OF TANZANIA': 'Southern Africa',
  'Somalia': 'Southern Africa',
  'SOMALIA': 'Southern Africa',
  'SOMALILAND': 'Southern Africa',
  'Ethiopia': 'Southern Africa',
  'ETHIOPIA': 'Southern Africa',
  'Eritrea': 'Southern Africa',
  'ERITREA': 'Southern Africa',
  'Angola': 'Southern Africa',
  'ANGOLA': 'Southern Africa',
  'Togo': 'Southern Africa',
  'TOGO': 'Southern Africa',
  'Niger': 'Southern Africa',
  'NIGER': 'Southern Africa',
  'Burundi': 'Southern Africa',
  'BURUNDI': 'Southern Africa',
  'Ivory Coast': 'Southern Africa',
  'COTE D\'IVOIRE': 'Southern Africa',
  'ZAMBIA': 'Southern Africa',
  'Zambia': 'Southern Africa',
  'MADAGASCAR': 'Southern Africa',
  'Madagascar': 'Southern Africa',
  'MALI': 'Southern Africa',
  'Mali': 'Southern Africa',
  'MOZAMBIQUE': 'Southern Africa',
  'Mozambique': 'Southern Africa',
  'GAMBIA': 'Southern Africa',
  'Gambia': 'Southern Africa',
  'GUINEA': 'Southern Africa',
  'Guinea': 'Southern Africa',
  'LIBERIA': 'Southern Africa',
  'Liberia': 'Southern Africa',
  'CENTRAL AFRICAN REPUBLIC': 'Southern Africa',
  'Central African Republic': 'Southern Africa',
  'MAYOTTE': 'Southern Africa',
  
  // Europe
  'Germany': 'Europe',
  'GERMANY': 'Europe',
  'France': 'Europe',
  'FRANCE': 'Europe',
  'Italy': 'Europe',
  'ITALY': 'Europe',
  'Spain': 'Europe',
  'SPAIN': 'Europe',
  'United Kingdom': 'Europe',
  'UNITED KINGDOM': 'Europe',
  'Netherlands': 'Europe',
  'NETHERLANDS': 'Europe',
  'Belgium': 'Europe',
  'BELGIUM': 'Europe',
  'Poland': 'Europe',
  'POLAND': 'Europe',
  'Russia': 'Europe',
  'RUSSIA': 'Europe',
  'Turkey': 'Europe',
  'TURKEY': 'Europe',
  'GEORGIA': 'Europe',
  'Georgia': 'Europe',
  'TURKMENISTAN': 'Europe',
  'Turkmenistan': 'Europe',
  'ARMENIA': 'Europe',
  'Armenia': 'Europe',
  
  // Americas
  'United States': 'Americas',
  'UNITED STATES': 'Americas',
  'United States of America': 'Americas',
  'Canada': 'Americas',
  'CANADA': 'Americas',
  'Mexico': 'Americas',
  'MEXICO': 'Americas',
  'Brazil': 'Americas',
  'BRAZIL': 'Americas',
  'Argentina': 'Americas',
  'ARGENTINA': 'Americas',
  'Chile': 'Americas',
  'CHILE': 'Americas',
  'Colombia': 'Americas',
  'COLOMBIA': 'Americas',
  'USA': 'Americas',
  
  // Asia-Pacific
  'China': 'Asia-Pacific',
  'CHINA': 'Asia-Pacific',
  'Japan': 'Asia-Pacific',
  'JAPAN': 'Asia-Pacific',
  'South Korea': 'Asia-Pacific',
  'SOUTH KOREA': 'Asia-Pacific',
  'Taiwan': 'Asia-Pacific',
  'TAIWAN': 'Asia-Pacific',
  'India': 'Asia-Pacific',
  'INDIA': 'Asia-Pacific',
  'Pakistan': 'Asia-Pacific',
  'PAKISTAN': 'Asia-Pacific',
  'Sri Lanka': 'Asia-Pacific',
  'SRI LANKA': 'Asia-Pacific',
  'Bangladesh': 'Asia-Pacific',
  'BANGLADESH': 'Asia-Pacific',
  'Indonesia': 'Asia-Pacific',
  'INDONESIA': 'Asia-Pacific',
  'Malaysia': 'Asia-Pacific',
  'MALAYSIA': 'Asia-Pacific',
  'Thailand': 'Asia-Pacific',
  'THAILAND': 'Asia-Pacific',
  'Philippines': 'Asia-Pacific',
  'PHILIPPINES': 'Asia-Pacific',
  'Vietnam': 'Asia-Pacific',
  'VIETNAM': 'Asia-Pacific',
  'Australia': 'Asia-Pacific',
  'AUSTRALIA': 'Asia-Pacific',
  'New Zealand': 'Asia-Pacific',
  'NEW ZEALAND': 'Asia-Pacific',
  'Singapore': 'Asia-Pacific',
  'SINGAPORE': 'Asia-Pacific',
  'Afghanistan': 'Asia-Pacific',
  'AFGHANISTAN': 'Asia-Pacific',
  'Tajikistan': 'Asia-Pacific',
  'TAJIKISTAN': 'Asia-Pacific',
  'Yemen': 'Asia-Pacific',
  'YEMEN': 'Asia-Pacific'
};

// Function to get region for a country
const getRegionForCountry = (countryName) => {
  // Skip internal properties
  if (countryName === '__esModule' || countryName === 'default') {
    return 'Internal';
  }

  // Direct lookup
  let region = regionalMapping[countryName];
  
  // If no direct match, try case-insensitive matching
  if (!region) {
    const countryLower = countryName.toLowerCase();
    
    // Check for UAE variations
    if (countryLower.includes('emirates') || countryLower === 'uae') {
      region = 'UAE';
    } 
    // Check for Saudi Arabia variations
    else if (countryLower.includes('saudi') || countryLower === 'ksa' || countryLower.includes('kingdom')) {
      region = 'GCC';
    }
    // Check for other case-insensitive matches
    else {
      for (const [key, value] of Object.entries(regionalMapping)) {
        if (key.toLowerCase() === countryLower) {
          region = value;
          break;
        }
      }
    }
  }
  
  return region || 'Unassigned';
};

// Find all unassigned countries
const unassignedCountries = [];
const countryRegions = {};

// Filter out internal properties
const realCountries = Object.keys(countryCoordinates).filter(
  key => key !== '__esModule' && key !== 'default' && typeof countryCoordinates[key] !== 'function'
);

realCountries.forEach(country => {
  const region = getRegionForCountry(country);
  countryRegions[country] = region;
  
  if (region === 'Unassigned') {
    unassignedCountries.push(country);
  }
});

// Print results
console.log('Total unassigned countries:', unassignedCountries.length);
console.log('\nUnassigned Countries:');
unassignedCountries.sort().forEach(country => console.log(`- ${country}`));

// Optional: Print all countries by region
console.log('\n\nAll Countries by Region:');
const regionCounts = {};
Object.entries(countryRegions).forEach(([country, region]) => {
  if (!regionCounts[region]) regionCounts[region] = 0;
  regionCounts[region]++;
});

console.log('\nRegion Counts:');
Object.entries(regionCounts).sort().forEach(([region, count]) => {
  console.log(`${region}: ${count} countries`);
}); 