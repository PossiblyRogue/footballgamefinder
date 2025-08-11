import React from 'react';

// Function to get the pyramid level for each competition (same as MapWidget)
const getCompetitionLevel = (competitionName) => {
  if (!competitionName) return null;
  
  const name = competitionName.toLowerCase().trim();
  
  // Level 1 - Premier League
  if (name === 'premier league') return 1;
  
  // Level 2 - Championship
  if (name === 'championship' || name === 'sky bet championship' || name === 'efl championship') return 2;
  
  // Level 3 - League One
  if (name === 'league one' || name === 'sky bet league one' || name === 'efl league one') return 3;
  
  // Level 4 - League Two
  if (name === 'league two' || name === 'sky bet league two' || name === 'efl league two') return 4;
  
  // Level 5 - National League
  if (name === 'national league' || name === 'enterprise national league' || name === 'vanarama national league') return 5;
  
  // Level 6 - National League North/South
  if (name === 'national league north' || name === 'enterprise national league north' || name === 'vanarama national league north') return 6;
  if (name === 'national league south' || name === 'enterprise national league south' || name === 'vanarama national league south') return 6;
  
  // Level 7 - Step 3
  if (name === 'northern premier league - premier division') return 7;
  if (name === 'isthmian league - premier division') return 7;
  if (name === 'southern league - premier central' || name === 'southern league - premier central division') return 7;
  if (name === 'southern league - premier south' || name === 'southern league - premier south division') return 7;
  
  // Level 8 - Step 4
  if (name === 'northern premier league - east division') return 8;
  if (name === 'northern premier league - midlands division') return 8;
  if (name === 'northern premier league - west division') return 8;
  if (name === 'isthmian league - north division') return 8;
  if (name === 'isthmian league - south central division') return 8;
  if (name === 'isthmian league - south east division') return 8;
  if (name === 'southern league - central division') return 8;
  if (name === 'southern league - south division') return 8;
  
  // Level 9 - Step 5
  if (name === 'combined counties league premier division north') return 9;
  if (name === 'combined counties league premier division south') return 9;
  if (name === 'essex senior league') return 9;
  if (name === 'northern league division one') return 9;
  if (name === 'northern counties east league premier division') return 9;
  if (name === 'southern counties east league premier division') return 9;
  if (name === 'united counties league premier division north') return 9;
  if (name === 'united counties league premier division south') return 9;
  
  // Level 10 - Step 6
  if (name === 'combined counties league division one') return 10;
  if (name === 'northern league division two') return 10;
  if (name === 'northern counties east league division one') return 10;
  if (name === 'southern counties east league first division') return 10;
  if (name === 'united counties league division one') return 10;
  
  // Return null if not found
  return null;
};

const FixtureCard = ({ fixture, distance }) => {
  // Handle both mock data format and new database format
  const homeTeam = fixture.homeTeam?.name || fixture.home;
  const awayTeam = fixture.awayTeam?.name || fixture.away;
  
  const time = fixture.time || '15:00';
  const venue = fixture.venue || fixture.stadium?.name || 'Unknown Venue';
  const date = fixture.date;
  
  // Stadium information
  const stadiumName = fixture.stadium?.name || fixture.venue || 'Unknown Stadium Name';
  const stadiumAddress = fixture.stadium?.address || '';
  const stadiumCapacity = fixture.stadium?.capacity;
  const coordinates = fixture.stadium?.coordinates || fixture.coordinates;
  
  // Determine what location info to show (always show postcode if available)
  const getLocationInfo = () => {
    // First check if there's a postcode in the address
    if (stadiumAddress) {
      const postcodeMatch = stadiumAddress.match(/[A-Z]{1,2}[0-9][A-Z0-9]? ?[0-9][A-Z]{2}/i);
      if (postcodeMatch) {
        return { type: 'postcode', value: postcodeMatch[0] };
      }
    }
    
    // If no postcode found, show full address if available
    if (stadiumAddress) {
      return { type: 'address', value: stadiumAddress };
    }
    
    // Fallback to coordinates if no address
    if (coordinates) {
      return { type: 'coordinates', value: coordinates };
    }
    
    return null;
  };
  
  const locationInfo = getLocationInfo();
  
  // Competition information
  const competitionName = fixture.competition || fixture.competition?.name || '';
  const competitionLevel = getCompetitionLevel(competitionName);
  
  // Status handling for upcoming fixtures
  const status = fixture.status?.full || fixture.status?.short || fixture.status || '';
  const isUpcoming = new Date(fixture.date + 'T' + fixture.time) > new Date();
  const isToday = fixture.date === new Date().toISOString().split('T')[0];

  return (
    <div className="bg-white rounded-lg border border-gray-200 p-6 hover:shadow-md transition-shadow">
      <div className="flex justify-between items-start mb-4">
        <div className="flex-1">
          {/* Teams */}
          <div className="space-y-2">
            <div className="flex items-center justify-between">
              <span className="font-semibold text-lg text-gray-900">{homeTeam}</span>
              {isToday && isUpcoming && (
                <span className="bg-green-500 text-white px-2 py-1 rounded text-xs font-semibold">
                  TODAY
                </span>
              )}
            </div>
            
            <div className="text-sm text-gray-500 font-medium">vs</div>
            
            <div className="flex items-center">
              <span className="font-semibold text-lg text-gray-900">{awayTeam}</span>
            </div>
          </div>
        </div>

        {/* Date and Time */}
        <div className="text-right text-sm text-gray-600">
          <div className="font-medium">{new Date(date).toLocaleDateString()}</div>
          <div className="text-lg font-semibold text-blue-600">{time}</div>
          {status && status !== time && !status.includes('Kick off') && (
            <div className="text-xs text-gray-500">{status}</div>
          )}
          {isUpcoming && (
            <div className="text-xs text-green-600 font-medium">Upcoming</div>
          )}
        </div>
      </div>

      {/* Venue and Location Info */}
      <div className="border-t border-gray-100 pt-4">
        <div className="flex justify-between items-start">
          <div className="flex-1">
            <div className="flex items-center space-x-2">
              <span className="text-sm font-medium text-gray-700">🏟️ {stadiumName}</span>
              {fixture.stadium?.matchMethod && (
                <span className="text-xs bg-blue-100 text-blue-800 px-2 py-1 rounded">
                  {fixture.stadium.matchMethod}
                </span>
              )}
            </div>
            {locationInfo && (
              <div className="text-xs text-gray-500 mt-1">
                📍 {locationInfo.type === 'postcode' ? locationInfo.value : 
                    locationInfo.type === 'address' ? locationInfo.value :
                    `${locationInfo.value.lat.toFixed(4)}, ${locationInfo.value.lng.toFixed(4)}`}
              </div>
            )}
            {stadiumCapacity && (
              <div className="text-xs text-gray-500 mt-1">👥 Capacity: {stadiumCapacity.toLocaleString()}</div>
            )}
          </div>
          
          {distance !== null && distance !== undefined && (
            <div className="text-right">
              <span className="text-sm font-medium text-green-600">
                📏 {distance.toFixed(1)} km away
              </span>
            </div>
          )}
        </div>
      </div>
      
      {/* Competition Info */}
      {competitionName && (
        <div className="border-t border-gray-100 pt-3 mt-3">
          <div className="flex justify-between items-center">
            <div className="text-xs text-blue-600">
              🏆 {competitionName} {competitionLevel && (
                <span className="text-red-600 font-bold">({competitionLevel})</span>
              )}
            </div>
            {fixture.attendance > 0 && (
              <span className="text-xs text-gray-500">👥 {fixture.attendance.toLocaleString()} attendance</span>
            )}
          </div>
        </div>
      )}
    </div>
  );
};

export default FixtureCard; 