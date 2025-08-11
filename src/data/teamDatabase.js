// New Team Database Service - Uses team_information_with_coordinates.json
// This replaces the old stadium database with the new comprehensive team data

let teamDatabase = null;

// Load team database from the new team_information_with_coordinates.json
export const loadTeamDatabase = async () => {
  if (teamDatabase) return teamDatabase;
  
  try {
    const response = await fetch('/team_information_with_coordinates.json');
    if (!response.ok) {
      throw new Error('Failed to load team database');
    }
    teamDatabase = await response.json();
    console.log('📂 Loaded team database with coordinates');
    return teamDatabase;
  } catch (error) {
    console.error('Error loading team database:', error);
    throw error;
  }
};

// Get all teams from all leagues
export const getAllTeams = async () => {
  const database = await loadTeamDatabase();
  const allTeams = [];
  
  Object.entries(database).forEach(([leagueName, teams]) => {
    teams.forEach(team => {
      allTeams.push({
        ...team,
        league: leagueName,
        coordinates: {
          lat: team.latitude,
          lng: team.longitude
        }
      });
    });
  });
  
  return allTeams;
};

// Normalize team names for matching
const normalizeTeamName = (name) => {
  if (!name) return '';
  return name.toLowerCase()
    .replace(/\bfc\b|\bfc\b$/gi, '') // Remove FC
    .replace(/\bafc\b/gi, '') // Remove AFC
    .replace(/\bunited\b/gi, 'utd') // Replace United with Utd
    .replace(/\bcity\b/gi, '') // Remove City
    .replace(/\btown\b/gi, '') // Remove Town
    .replace(/\bathletic\b/gi, '') // Remove Athletic
    .replace(/\brovers\b/gi, '') // Remove Rovers
    .replace(/\bwanderers\b/gi, '') // Remove Wanderers
    .replace(/\s+/g, ' ') // Normalize spaces
    .trim();
};

// Find team by name (improved fuzzy matching)
export const findTeamByName = async (teamName) => {
  if (!teamName) return null;
  
  const allTeams = await getAllTeams();
  const normalizedSearch = normalizeTeamName(teamName);
  
  // Try exact match first
  let match = allTeams.find(team => 
    normalizeTeamName(team.name) === normalizedSearch
  );
  
  if (match) return match;
  
  // Try partial matches
  match = allTeams.find(team => {
    const normalizedTeam = normalizeTeamName(team.name);
    return normalizedTeam.includes(normalizedSearch) || 
           normalizedSearch.includes(normalizedTeam);
  });
  
  if (match) return match;
  
  // Try even more relaxed matching for common abbreviations
  const searchWords = normalizedSearch.split(' ').filter(w => w.length > 2);
  match = allTeams.find(team => {
    const teamWords = normalizeTeamName(team.name).split(' ').filter(w => w.length > 2);
    return searchWords.some(searchWord => 
      teamWords.some(teamWord => 
        teamWord.includes(searchWord) || searchWord.includes(teamWord)
      )
    );
  });
  
  return match;
};

// Find team by ID
export const findTeamById = async (teamId) => {
  const allTeams = await getAllTeams();
  return allTeams.find(team => team.id === teamId);
};

// Get teams by league
export const getTeamsByLeague = async (leagueName) => {
  const database = await loadTeamDatabase();
  return database[leagueName] || [];
};

// Get all league names
export const getAllLeagueNames = async () => {
  const database = await loadTeamDatabase();
  return Object.keys(database);
};

// Map fixture to team coordinates
export const mapFixtureToCoordinates = async (fixture) => {
  try {
    // Try to find home team first (most reliable)
    let team = null;
    
    if (fixture['home-team']?.name) {
      team = await findTeamByName(fixture['home-team'].name);
    }
    
    // Fallback to home team ID
    if (!team && fixture['home-team']?.id) {
      team = await findTeamById(fixture['home-team'].id);
    }
    
    // Fallback to away team if home team not found
    if (!team && fixture['away-team']?.name) {
      team = await findTeamByName(fixture['away-team'].name);
    }
    
    if (!team && fixture['away-team']?.id) {
      team = await findTeamById(fixture['away-team'].id);
    }
    
    if (team) {
      return {
        success: true,
        team: team,
        coordinates: {
          lat: team.latitude,
          lng: team.longitude
        },
        stadium: {
          name: team.ground,
          address: team.address,
          capacity: team.capacity,
          coordinates: {
            lat: team.latitude,
            lng: team.longitude
          }
        },
        matchMethod: fixture['home-team']?.name === team.name ? 'home_team' : 'away_team'
      };
    }
    
    return {
      success: false,
      team: null,
      coordinates: null,
      stadium: null,
      matchMethod: null
    };
    
  } catch (error) {
    console.error('Error mapping fixture to coordinates:', error);
    return {
      success: false,
      team: null,
      coordinates: null,
      stadium: null,
      matchMethod: null,
      error: error.message
    };
  }
};

// Test team matching
export const testTeamMatching = async (teamName) => {
  const result = await findTeamByName(teamName);
  console.log(`Testing "${teamName}":`, result ? 
    `Found: ${result.name} (${result.league})` : 
    'Not found'
  );
  return result;
};