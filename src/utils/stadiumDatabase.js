import { stadiumData } from '../data/mergedStadiums.js';

// Load the stadium database
export const stadiums = stadiumData.features;

// Get all stadium data
export const getStadiums = () => {
  return stadiums;
};

// Get stadiums by league
export const getStadiumsByLeague = (league) => {
  if (!league || league === 'All Divisions') return stadiums;
  return stadiums.filter(stadium => stadium.properties.league === league);
};

// Get all unique leagues
export const getLeagues = () => {
  const leagues = [...new Set(stadiums.map(stadium => stadium.properties.league))];
  return leagues.sort();
};

// Find stadium by team name (fuzzy matching)
export const findStadiumByTeam = (teamName) => {
  if (!teamName) return null;
  
  const normalizedTeamName = teamName.toLowerCase().replace(/[^a-z0-9]/g, '');
  
  const result = stadiums.find(stadium => {
    const team = stadium.properties.team.toLowerCase().replace(/[^a-z0-9]/g, '');
    
    // Direct exact match (highest priority)
    if (team === normalizedTeamName) {
      return true;
    }
    
    // Handle common variations with more precise matching
    const teamVariations = getTeamNameVariations(teamName);
    
    const variationMatch = teamVariations.some(variation => {
      const normalizedVariation = variation.toLowerCase().replace(/[^a-z0-9]/g, '');
      
      // Exact match with variation
      if (team === normalizedVariation) {
        return true;
      }
      
      // Only allow partial matches for very specific cases (like "Man United" vs "Manchester United")
      // Avoid generic partial matches like "Villa" matching "Hanworth Villa"
      if (normalizedVariation.length > 3 && team.length > 3) {
        // Check if one is a substring of the other, but only for longer names
        if (team.includes(normalizedVariation) || normalizedVariation.includes(team)) {
          // Additional check: ensure it's not a generic word match
          const commonWords = ['united', 'city', 'town', 'athletic', 'rovers', 'wanderers', 'villa'];
          const isGenericMatch = commonWords.some(word => 
            (team.includes(word) && normalizedVariation.includes(word)) ||
            (normalizedVariation.includes(word) && team.includes(word))
          );
          
          // Only allow if it's not just a generic word match
          if (!isGenericMatch) {
            return true;
          }
        }
      }
      
      return false;
    });
    
    return variationMatch;
  });
  
  return result;
};

// Find stadium by stadium name (fuzzy matching)
export const findStadiumByName = (stadiumName) => {
  if (!stadiumName) return null;
  
  const normalizedStadiumName = stadiumName.toLowerCase().replace(/[^a-z0-9]/g, '');
  
  const result = stadiums.find(stadium => {
    const stadium_name = stadium.properties.stadium.toLowerCase().replace(/[^a-z0-9]/g, '');
    
    // Skip entries with empty stadium names
    if (!stadium_name || stadium_name === '') {
      return false;
    }
    
    // Direct exact match (highest priority)
    if (stadium_name === normalizedStadiumName) {
      return true;
    }
    
    // Handle stadium name variations with more precise matching
    const stadiumVariations = getStadiumNameVariations(stadiumName);
    const variationMatch = stadiumVariations.some(variation => {
      const normalizedVariation = variation.toLowerCase().replace(/[^a-z0-9]/g, '');
      
      // Exact match with variation
      if (stadium_name === normalizedVariation) {
        return true;
      }
      
      // Only allow partial matches for very specific cases
      if (normalizedVariation.length > 3 && stadium_name.length > 3) {
        // Check if one is a substring of the other, but only for longer names
        if (stadium_name.includes(normalizedVariation) || normalizedVariation.includes(stadium_name)) {
          // Additional check: ensure it's not a generic word match
          const commonWords = ['stadium', 'ground', 'park', 'arena', 'field'];
          const isGenericMatch = commonWords.some(word => 
            (stadium_name.includes(word) && normalizedVariation.includes(word)) ||
            (normalizedVariation.includes(word) && stadium_name.includes(word))
          );
          
          // Only allow if it's not just a generic word match
          if (!isGenericMatch) {
            return true;
          }
        }
      }
      
      return false;
    });
    
    return variationMatch;
  });
  
  return result;
};

// Get common team name variations
const getTeamNameVariations = (teamName) => {
  const variations = [teamName];
  
  // Add "F.C." versions
  if (!teamName.includes('F.C.')) {
    variations.push(teamName + ' F.C.');
  }
  
  // Remove "F.C." versions
  if (teamName.includes('F.C.')) {
    variations.push(teamName.replace(' F.C.', '').replace('F.C.', ''));
  }
  
  // Handle specific known variations
  const knownVariations = {
    'Brighton': ['Brighton & Hove Albion F.C.', 'Brighton & Hove Albion', 'Brighton and Hove Albion'],
    'Brighton & Hove Albion': ['Brighton', 'Brighton F.C.'],
    'Manchester United': ['Man United', 'Man Utd', 'Manchester United F.C.'],
    'Manchester City': ['Man City', 'Manchester City F.C.'],
    'Newcastle': ['Newcastle United', 'Newcastle United F.C.'],
    'Tottenham': ['Tottenham Hotspur', 'Spurs', 'Tottenham Hotspur F.C.'],
    'West Ham': ['West Ham United', 'West Ham United F.C.'],
    'Wolverhampton': ['Wolverhampton Wanderers', 'Wolves', 'Wolverhampton Wanderers F.C.'],
    'Leicester': ['Leicester City', 'Leicester City F.C.'],
    'Birmingham': ['Birmingham City', 'Birmingham City F.C.'],
    'Sheffield United': ['Sheffield Utd', 'Sheffield United F.C.'],
    'Sheffield Wednesday': ['Sheffield Wed', 'Sheffield Wednesday F.C.'],
    'Queens Park Rangers': ['QPR', 'Queens Park Rangers F.C.'],
    'West Bromwich Albion': ['West Brom', 'WBA', 'West Bromwich Albion F.C.'],
    'AFC Wimbledon': ['Wimbledon', 'AFC Wimbledon F.C.'],
    'Milton Keynes Dons': ['MK Dons', 'Milton Keynes Dons F.C.'],
    'FC Halifax Town': ['Halifax Town', 'Halifax', 'FC Halifax Town F.C.'],
    // Premier League specific variations
    'Arsenal': ['Arsenal F.C.', 'The Gunners'],
    'Chelsea': ['Chelsea F.C.', 'The Blues'],
    'Liverpool': ['Liverpool F.C.', 'The Reds'],
    'Aston Villa': ['Aston Villa F.C.', 'Villa'],
    'Bournemouth': ['Bournemouth F.C.', 'AFC Bournemouth'],
    'Brentford': ['Brentford F.C.'],
    'Burnley': ['Burnley F.C.'],
    'Crystal Palace': ['Crystal Palace F.C.', 'Palace'],
    'Everton': ['Everton F.C.', 'The Toffees'],
    'Fulham': ['Fulham F.C.'],
    'Leeds United': ['Leeds F.C.', 'Leeds'],
    'Nottingham Forest': ['Forest', 'Nottingham Forest F.C.'],
    'Sunderland': ['Sunderland F.C.'],
    'West Ham United': ['West Ham', 'West Ham F.C.'],
    'Wolverhampton Wanderers': ['Wolves', 'Wolverhampton', 'Wolves F.C.']
  };
  
  if (knownVariations[teamName]) {
    variations.push(...knownVariations[teamName]);
  }
  
  // Check reverse variations
  Object.entries(knownVariations).forEach(([key, values]) => {
    if (values.includes(teamName)) {
      variations.push(key);
      variations.push(...values);
    }
  });
  
  return [...new Set(variations)]; // Remove duplicates
};

// Get stadium name variations
const getStadiumNameVariations = (stadiumName) => {
  const variations = [stadiumName];
  
  // Handle common stadium name variations
  const knownStadiumVariations = {
    'Emirates Stadium': ['Arsenal Stadium'],
    'Old Trafford': ['Theatre of Dreams'],
    'Etihad Stadium': ['City of Manchester Stadium', 'COMS'],
    'Stamford Bridge': ['Chelsea Stadium'],
    'London Stadium': ['Olympic Stadium', 'Queen Elizabeth Olympic Park'],
    'Tottenham Hotspur Stadium': ['New White Hart Lane', 'Spurs Stadium'],
    'American Express Community Stadium': ['Falmer Stadium', 'Brighton Community Stadium', 'Amex Stadium'],
    'Vitality Stadium': ['Dean Court'],
    'Gtech Community Stadium': ['Brentford Community Stadium'],
    'bet365 Stadium': ['Britannia Stadium'],
    'MKM Stadium': ['KCOM Stadium', 'Hull City Stadium'],
    'King Power Stadium': ['Leicester City Stadium'],
    'St Mary\'s Stadium': ['Southampton Stadium'],
    'London Road Stadium': ['Weston Homes Stadium'],
    'Crown Oil Arena': ['Spotland Stadium'],
    'Mazuma Mobile Stadium': ['Globe Arena']
  };
  
  if (knownStadiumVariations[stadiumName]) {
    variations.push(...knownStadiumVariations[stadiumName]);
  }
  
  // Check reverse variations
  Object.entries(knownStadiumVariations).forEach(([key, values]) => {
    if (values.includes(stadiumName)) {
      variations.push(key);
      variations.push(...values);
    }
  });
  
  return [...new Set(variations)]; // Remove duplicates
};

// Compare fixture data with database and find matching stadium
export const compareFixtureWithDatabase = (fixtureData) => {
  const { homeTeam, awayTeam, venue, teams } = fixtureData;
  
  let matchedStadium = null;
  let matchMethod = null;
  
  // Extract team names if they're in a combined format like "Team A vs Team B"
  let extractedHomeTeam = homeTeam;
  let extractedAwayTeam = awayTeam;
  
  if (teams && !homeTeam && !awayTeam) {
    const teamsMatch = teams.match(/^(.+?)\s+vs\s+(.+)$/);
    if (teamsMatch) {
      extractedHomeTeam = teamsMatch[1].trim();
      extractedAwayTeam = teamsMatch[2].trim();
    }
  }
  
  // Priority 1: Try to match by home team name (most reliable)
  if (extractedHomeTeam) {
    matchedStadium = findStadiumByTeam(extractedHomeTeam);
    if (matchedStadium) {
      matchMethod = 'home_team';
    }
  }
  
  // Priority 2: Try to match by venue/stadium name
  if (!matchedStadium && venue) {
    matchedStadium = findStadiumByName(venue);
    if (matchedStadium) {
      matchMethod = 'venue_name';
    }
  }
  
  // Priority 3: Try to match by away team name (fallback)
  if (!matchedStadium && extractedAwayTeam) {
    matchedStadium = findStadiumByTeam(extractedAwayTeam);
    if (matchedStadium) {
      matchMethod = 'away_team';
    }
  }
  
  if (matchedStadium) {
    const coordinates = {
      lat: matchedStadium.geometry.coordinates[1],
      lng: matchedStadium.geometry.coordinates[0]
    };
    
    return {
      success: true,
      stadium: {
        name: matchedStadium.properties.stadium,
        address: matchedStadium.properties.address,
        capacity: matchedStadium.properties.capacity,
        league: matchedStadium.properties.league,
        team: matchedStadium.properties.team,
        coordinates: coordinates
      },
      matchMethod: matchMethod,
      confidence: getMatchConfidence(matchMethod)
    };
  }
  
  return {
    success: false,
    stadium: null,
    matchMethod: null,
    confidence: 0
  };
};

// Get match confidence score
const getMatchConfidence = (matchMethod) => {
  const confidenceScores = {
    'home_team': 0.95,
    'venue_name': 0.85,
    'away_team': 0.75
  };
  
  return confidenceScores[matchMethod] || 0;
};

// Get all Premier League teams from our database
export const getPremierLeagueTeams = () => {
  return stadiums.map(stadium => ({
    team: stadium.properties.team,
    stadium: stadium.properties.stadium,
    coordinates: {
      lat: stadium.geometry.coordinates[1],
      lng: stadium.geometry.coordinates[0]
    },
    address: stadium.properties.address || null
  }));
};

// Test team matching function
export const testTeamMatching = (teamName) => {
  console.log(`🧪 Testing team matching for: "${teamName}"`);
  const result = findStadiumByTeam(teamName);
  if (result) {
    console.log(`✅ Match found: ${result.properties.team} at ${result.properties.stadium}`);
  } else {
    console.log(`❌ No match found for: "${teamName}"`);
  }
  return result;
};

// Log database stats
export const logDatabaseStats = () => {
  console.log('Stadium Database Stats:');
  console.log('Total stadiums:', stadiums.length);
  console.log('Teams with addresses:', stadiums.filter(s => s.properties.address).length);
  console.log('Sample teams:', stadiums.slice(0, 3).map(s => s.properties.team));
}; 