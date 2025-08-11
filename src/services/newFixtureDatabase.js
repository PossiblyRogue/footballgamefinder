// New Fixture Database Service - Uses all_fixtures.json
// This service loads and processes the new comprehensive fixtures database

import { mapFixtureToCoordinates } from '../data/teamDatabase.js';

let fixtureDatabase = null;

// Load the new fixtures database
export const loadNewFixtureDatabase = async () => {
  if (fixtureDatabase) return fixtureDatabase;
  
  try {
    console.log('📂 Loading new fixtures database...');
    const response = await fetch('/all_fixtures.json');
    if (!response.ok) {
      throw new Error('Failed to load fixtures database');
    }
    
    const rawData = await response.json();
    console.log(`📊 Raw database loaded. Metadata:`, rawData.metadata);
    
    // Process the nested structure into a flat array
    const processedFixtures = await processNewFixtureFormat(rawData);
    
    fixtureDatabase = {
      metadata: rawData.metadata,
      fixtures: processedFixtures,
      lastLoaded: new Date().toISOString()
    };
    
    console.log(`✅ Processed ${processedFixtures.length} fixtures with coordinates`);
    return fixtureDatabase;
    
  } catch (error) {
    console.error('❌ Error loading fixture database:', error);
    throw error;
  }
};

// Process the new fixture format into a flat array with coordinates
const processNewFixtureFormat = async (rawData) => {
  const processedFixtures = [];
  let processedCount = 0;
  let matchedCount = 0;
  
  console.log('🔄 Processing fixtures from new format...');
  
  // Iterate through each league
  for (const [leagueName, leagueData] of Object.entries(rawData.fixtures)) {
    if (!leagueData['fixtures-results']?.matches) {
      console.warn(`⚠️ No matches found for league: ${leagueName}`);
      continue;
    }
    
    const matches = leagueData['fixtures-results'].matches;
    console.log(`📋 Processing ${matches.length} matches from ${leagueName}`);
    
    for (const match of matches) {
      processedCount++;
      
      // Map to coordinates using team database
      const coordinateMapping = await mapFixtureToCoordinates(match);
      
      const processedFixture = {
        // Basic fixture info
        id: `${leagueName.replace(/\s+/g, '_')}_${match.id}`,
        date: match.date,
        time: match.time,
        status: match.status,
        
        // Team information
        homeTeam: {
          id: match['home-team']?.id,
          name: match['home-team']?.name,
          score: match['home-team']?.score
        },
        awayTeam: {
          id: match['away-team']?.id,
          name: match['away-team']?.name,
          score: match['away-team']?.score
        },
        
        // Venue and competition
        venue: match.venue,
        attendance: match.attendance,
        competition: leagueName, // Use the league name from the structure
        competitionId: match.competition?.id,
        
        // Enhanced location data from team database
        stadium: coordinateMapping.success ? {
          name: coordinateMapping.stadium.name,
          address: coordinateMapping.stadium.address,
          capacity: coordinateMapping.stadium.capacity,
          coordinates: coordinateMapping.coordinates,
          matchMethod: coordinateMapping.matchMethod
        } : null,
        
        // Team info for reference
        matchedTeam: coordinateMapping.success ? {
          name: coordinateMapping.team.name,
          league: coordinateMapping.team.league,
          ground: coordinateMapping.team.ground
        } : null,
        
        // Flags for filtering
        hasLocation: coordinateMapping.success,
        isUpcoming: new Date(match.date) > new Date(),
        isToday: match.date === new Date().toISOString().split('T')[0]
      };
      
      if (coordinateMapping.success) {
        matchedCount++;
      } else {
        console.log(`⚠️ No coordinates found for: ${match['home-team']?.name} vs ${match['away-team']?.name}`);
      }
      
      processedFixtures.push(processedFixture);
      
      // Log progress every 1000 fixtures
      if (processedCount % 1000 === 0) {
        console.log(`📊 Progress: ${processedCount} processed, ${matchedCount} with coordinates (${((matchedCount/processedCount)*100).toFixed(1)}%)`);
      }
    }
  }
  
  // Sort by date
  processedFixtures.sort((a, b) => new Date(a.date) - new Date(b.date));
  
  const successRate = ((matchedCount / processedCount) * 100).toFixed(1);
  console.log(`🎯 Final stats: ${processedCount} total fixtures, ${matchedCount} with coordinates (${successRate}%)`);
  
  return processedFixtures;
};

// Get all fixtures
export const getAllFixtures = async () => {
  const database = await loadNewFixtureDatabase();
  return database.fixtures;
};

// Get fixtures by date
export const getFixturesByDate = async (targetDate) => {
  const database = await loadNewFixtureDatabase();
  return database.fixtures.filter(fixture => fixture.date === targetDate);
};

// Get fixtures by league/competition
export const getFixturesByLeague = async (leagueName) => {
  const database = await loadNewFixtureDatabase();
  const normalizedLeague = leagueName.toLowerCase();
  return database.fixtures.filter(fixture => 
    fixture.competition.toLowerCase() === normalizedLeague
  );
};

// Get fixtures with location data only
export const getFixturesWithLocation = async () => {
  const database = await loadNewFixtureDatabase();
  return database.fixtures.filter(fixture => fixture.hasLocation);
};

// Get upcoming fixtures
export const getUpcomingFixtures = async (limit = 100) => {
  const database = await loadNewFixtureDatabase();
  const today = new Date().toISOString().split('T')[0];
  
  return database.fixtures
    .filter(fixture => fixture.date >= today)
    .slice(0, limit);
};

// Search fixtures with filters
export const searchFixtures = async (filters) => {
  const database = await loadNewFixtureDatabase();
  let results = database.fixtures;
  
  // Date filter
  if (filters.date) {
    results = results.filter(fixture => fixture.date === filters.date);
  }
  
  // League/competition filter
  if (filters.competitions && filters.competitions.length > 0) {
    const normalizedComps = filters.competitions.map(c => c.toLowerCase());
    results = results.filter(fixture => 
      normalizedComps.includes(fixture.competition.toLowerCase())
    );
  }
  
  // Location filter (only fixtures with coordinates)
  if (filters.requireLocation) {
    results = results.filter(fixture => fixture.hasLocation);
  }
  
  return results;
};

// Get database status/metadata
export const getDatabaseStatus = async () => {
  try {
    const database = await loadNewFixtureDatabase();
    return {
      success: true,
      metadata: database.metadata,
      fixtureCount: database.fixtures.length,
      withLocation: database.fixtures.filter(f => f.hasLocation).length,
      lastLoaded: database.lastLoaded
    };
  } catch (error) {
    return {
      success: false,
      error: error.message
    };
  }
};

// Reload database (clear cache)
export const reloadDatabase = async () => {
  fixtureDatabase = null;
  return await loadNewFixtureDatabase();
};