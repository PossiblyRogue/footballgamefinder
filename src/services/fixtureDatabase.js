// Fixture Database Service - Manages cached Premier League fixtures
import { compareFixtureWithDatabase } from '../utils/stadiumDatabase.js';
import { fetchAllEnglishFixtures } from '../utils/fixtureApi.js';

// Database constants
const DB_FILE_PATH = '/fixtures-database.json';

// Default database structure
const DEFAULT_UPDATE_INTERVAL_DAYS = 7;

// Get default empty database
const getDefaultDatabase = () => ({
  lastUpdated: null,
  updateIntervalDays: DEFAULT_UPDATE_INTERVAL_DAYS,
  fixtures: [],
  metadata: {
    totalFixtures: 0,
    matchedStadiums: 0,
    successRate: '0%',
    apiSource: 'football-web-pages1.p.rapidapi.com'
  }
});

// Load fixtures from local database (now loads from static file)
export const loadFixturesFromDatabase = async () => {
  try {
    const response = await fetch(DB_FILE_PATH);
    if (!response.ok) {
      console.warn('No static fixture database file found, using default');
      return getDefaultDatabase();
    }
    const database = await response.json();
    console.log('📂 Loaded fixture database from static file');
    return database;
  } catch (error) {
    console.error('Error loading fixture database:', error);
    return getDefaultDatabase();
  }
};

// Save fixtures to database with compression and optimization
export const saveFixturesToDatabase = async (database) => {
  try {
    // Optimize data before saving to reduce size
    const optimizedDatabase = optimizeDatabase(database);
    
    console.log('💾 Database size optimization:');
    console.log('Original fixtures:', database.fixtures?.length || 0);
    console.log('Optimized fixtures:', optimizedDatabase.fixtures?.length || 0);
    
    // Try to estimate size
    const jsonString = JSON.stringify(optimizedDatabase);
    const sizeInMB = (jsonString.length / (1024 * 1024)).toFixed(2);
    console.log(`Database size: ${sizeInMB}MB`);
    
    // Check if size is reasonable for localStorage (usually 5-10MB limit)
    if (sizeInMB > 8) {
      console.warn(`⚠️ Database size (${sizeInMB}MB) may exceed localStorage limits`);
      // Further optimize by keeping only upcoming fixtures
      const furtherOptimized = keepOnlyUpcomingFixtures(optimizedDatabase);
      const newSize = (JSON.stringify(furtherOptimized).length / (1024 * 1024)).toFixed(2);
      console.log(`Further optimized to ${newSize}MB (upcoming fixtures only)`);
      
      localStorage.setItem('fixtures-database', JSON.stringify(furtherOptimized));
    } else {
      localStorage.setItem('fixtures-database', jsonString);
    }
    
    // Create downloadable backup regardless of localStorage success
    const blob = new Blob([JSON.stringify(optimizedDatabase, null, 2)], {
      type: 'application/json'
    });
    const backupUrl = URL.createObjectURL(blob);
    
    console.log('✅ Database saved successfully');
    return { 
      success: true, 
      backupUrl: backupUrl,
      sizeInMB: sizeInMB,
      optimized: true
    };
    
  } catch (error) {
    if (error.name === 'QuotaExceededError' || error.message.includes('quota')) {
      console.error('💥 localStorage quota exceeded. Implementing fallback strategy...');
      
      // Fallback strategy: Keep only essential data
      const essentialData = createEssentialDatabase(database);
      
      try {
        localStorage.setItem('fixtures-database', JSON.stringify(essentialData));
        
        // Still create full backup file
        const blob = new Blob([JSON.stringify(database, null, 2)], {
          type: 'application/json'
        });
        const backupUrl = URL.createObjectURL(blob);
        
        console.log('✅ Saved essential database to localStorage, full backup available for download');
        return { 
          success: true, 
          backupUrl: backupUrl,
          fallback: true,
          message: 'Saved essential data only due to storage limits. Full backup available for download.'
        };
      } catch (fallbackError) {
        console.error('💥 Even essential data exceeds quota:', fallbackError);
        
        // Ultimate fallback: Just create downloadable file
        const blob = new Blob([JSON.stringify(database, null, 2)], {
          type: 'application/json'
        });
        const backupUrl = URL.createObjectURL(blob);
        
        return { 
          success: false, 
          backupUrl: backupUrl,
          error: 'Database too large for localStorage. Download backup file to use.',
          quota: true
        };
      }
    }
    
    console.error('Error saving fixture database:', error);
    return { success: false, error: error.message };
  }
};

// Optimize database by removing unnecessary data
const optimizeDatabase = (database) => {
  return {
    ...database,
    fixtures: database.fixtures.map(fixture => ({
      // Keep essential fields only
      id: fixture.id,
      date: fixture.date,
      time: fixture.time,
      homeTeam: { name: fixture.homeTeam.name },
      awayTeam: { name: fixture.awayTeam.name },
      venue: fixture.venue,
      competition: fixture.competition,
      stadium: fixture.stadium ? {
        name: fixture.stadium.name,
        coordinates: fixture.stadium.coordinates,
        address: fixture.stadium.address,
        league: fixture.stadium.league
      } : null,
      hasLocation: fixture.hasLocation,
      isUpcoming: fixture.isUpcoming
    }))
  };
};

// Keep only upcoming fixtures to reduce size
const keepOnlyUpcomingFixtures = (database) => {
  const today = new Date().toISOString().split('T')[0];
  const upcomingFixtures = database.fixtures.filter(fixture => 
    fixture.date >= today
  );
  
  return {
    ...database,
    fixtures: upcomingFixtures,
    metadata: {
      ...database.metadata,
      optimized: 'upcoming_only',
      originalCount: database.fixtures.length,
      filteredCount: upcomingFixtures.length
    }
  };
};

// Create essential database with minimal data
const createEssentialDatabase = (database) => {
  const today = new Date().toISOString().split('T')[0];
  const nextMonth = new Date();
  nextMonth.setMonth(nextMonth.getMonth() + 1);
  const nextMonthStr = nextMonth.toISOString().split('T')[0];
  
  // Keep only next month's fixtures with minimal data
  const essentialFixtures = database.fixtures
    .filter(fixture => fixture.date >= today && fixture.date <= nextMonthStr)
    .map(fixture => ({
      id: fixture.id,
      date: fixture.date,
      time: fixture.time,
      homeTeam: fixture.homeTeam.name,
      awayTeam: fixture.awayTeam.name,
      competition: fixture.competition,
      coordinates: fixture.stadium?.coordinates || null,
      stadium: fixture.stadium?.name || null,
      hasLocation: fixture.hasLocation
    }));
  
  return {
    lastUpdated: database.lastUpdated,
    updateIntervalDays: database.updateIntervalDays,
    fixtures: essentialFixtures,
    metadata: {
      essential: true,
      dateRange: `${today} to ${nextMonthStr}`,
      totalFixtures: essentialFixtures.length,
      note: 'Essential data only - download full backup for complete database'
    }
  };
};

// Check if database needs updating
export const needsUpdate = (database) => {
  if (!database.lastUpdated) {
    return { needs: true, reason: 'Never updated' };
  }
  
  const lastUpdate = new Date(database.lastUpdated);
  const now = new Date();
  const daysDiff = (now - lastUpdate) / (1000 * 60 * 60 * 24);
  
  if (daysDiff >= database.updateIntervalDays) {
    return { 
      needs: true, 
      reason: `${Math.floor(daysDiff)} days since last update (threshold: ${database.updateIntervalDays} days)` 
    };
  }
  
  return { 
    needs: false, 
    reason: `Updated ${Math.floor(daysDiff)} days ago (next update in ${Math.ceil(database.updateIntervalDays - daysDiff)} days)` 
  };
};

// Process raw API fixtures and match with stadium database
export const processFixtures = (apiData) => {
  // Handle new multi-league API response structure
  if (!apiData?.allFixtures || !Array.isArray(apiData.allFixtures)) {
    throw new Error('Invalid API response format - expected allFixtures array');
  }
  
  const allFixtures = apiData.allFixtures;
  const processedFixtures = [];
  let matchedCount = 0;
  
  console.log(`Processing ${allFixtures.length} fixtures from all leagues...`);
  
  for (const apiFixture of allFixtures) {
    // Create fixture data structure for stadium matching
    const fixtureForMatching = {
      homeTeam: apiFixture['home-team']?.name,
      awayTeam: apiFixture['away-team']?.name,
      venue: apiFixture.venue
    };
    
    const matchResult = compareFixtureWithDatabase(fixtureForMatching);
    
    const processedFixture = {
      id: `${apiFixture.competition}_${apiFixture.id}`, // Unique ID across leagues
      date: apiFixture.date,
      time: apiFixture.time,
      status: apiFixture.status,
      homeTeam: {
        id: apiFixture['home-team']?.id,
        name: apiFixture['home-team']?.name,
        score: apiFixture['home-team']?.score
      },
      awayTeam: {
        id: apiFixture['away-team']?.id,
        name: apiFixture['away-team']?.name,
        score: apiFixture['away-team']?.score
      },
      venue: apiFixture.venue,
      attendance: apiFixture.attendance,
      competition: apiFixture.competition, // Now includes league info
      competitionCode: apiFixture.competitionCode,
      
      // Enhanced with our stadium database
      stadium: matchResult.success ? {
        name: matchResult.stadium.name,
        team: matchResult.stadium.team,
        league: matchResult.stadium.league,
        coordinates: matchResult.stadium.coordinates,
        address: matchResult.stadium.address,
        capacity: matchResult.stadium.capacity,
        matchMethod: matchResult.matchMethod,
        confidence: matchResult.confidence
      } : null,
      
      // Flags for easy filtering
      hasLocation: matchResult.success,
      isUpcoming: new Date(apiFixture.date) > new Date(),
      isToday: apiFixture.date === new Date().toISOString().split('T')[0]
    };
    
    if (matchResult.success) {
      matchedCount++;
    }
    
    processedFixtures.push(processedFixture);
  }
  
  // Sort by date for easier navigation
  processedFixtures.sort((a, b) => new Date(a.date) - new Date(b.date));
  
  // Log league breakdown
  const leagueBreakdown = {};
  processedFixtures.forEach(fixture => {
    const league = fixture.competition;
    if (!leagueBreakdown[league]) {
      leagueBreakdown[league] = { total: 0, matched: 0 };
    }
    leagueBreakdown[league].total++;
    if (fixture.hasLocation) {
      leagueBreakdown[league].matched++;
    }
  });
  
  console.log('League breakdown:');
  Object.entries(leagueBreakdown).forEach(([league, stats]) => {
    const rate = ((stats.matched / stats.total) * 100).toFixed(1);
    console.log(`  ${league}: ${stats.matched}/${stats.total} (${rate}%)`);
  });
  
  return {
    fixtures: processedFixtures,
    stats: {
      total: processedFixtures.length,
      matched: matchedCount,
      successRate: ((matchedCount / processedFixtures.length) * 100).toFixed(1),
      leagueBreakdown: leagueBreakdown
    }
  };
};

// Update fixture database from API
export const updateFixtureDatabase = async (forceUpdate = false) => {
  console.log('🔄 Starting fixture database update...');
  
  try {
    // Load current database
    const currentDb = await loadFixturesFromDatabase();
    
    // Check if update is needed
    const updateCheck = needsUpdate(currentDb);
    if (!updateCheck.needs && !forceUpdate) {
      console.log(`✅ Update not needed: ${updateCheck.reason}`);
      return { success: true, updated: false, reason: updateCheck.reason, database: currentDb };
    }
    
    console.log(`📡 Fetching fresh fixtures from API (${updateCheck.reason})`);
    
    // Fetch fresh data from API
    const apiData = await fetchAllEnglishFixtures();
    
    // Process and match with stadiums
    const processed = processFixtures(apiData);
    
    // Detect changes if we have existing fixtures
    const changes = detectChanges(currentDb.fixtures, processed.fixtures);
    
    // Create new database
    const newDatabase = {
      lastUpdated: new Date().toISOString(),
      updateIntervalDays: currentDb.updateIntervalDays,
      fixtures: processed.fixtures,
      metadata: {
        totalFixtures: processed.stats.total,
        matchedStadiums: processed.stats.matched,
        successRate: processed.stats.successRate,
        apiSource: 'football-web-pages1.p.rapidapi.com',
        changes: changes
      }
    };
    
    // Save to database
    const saveResult = await saveFixturesToDatabase(newDatabase);
    
    if (saveResult.success) {
      console.log(`✅ Database updated successfully!`);
      console.log(`📊 Stats: ${processed.stats.total} fixtures, ${processed.stats.matched} matched (${processed.stats.successRate}%)`);
      console.log(`📝 Changes: ${changes.summary}`);
      
      return { 
        success: true, 
        updated: true, 
        database: newDatabase, 
        changes: changes,
        backupUrl: saveResult.backupUrl 
      };
    } else {
      throw new Error('Failed to save database');
    }
    
  } catch (error) {
    console.error('❌ Error updating fixture database:', error);
    return { success: false, error: error.message };
  }
};

// Detect changes between old and new fixtures
export const detectChanges = (oldFixtures, newFixtures) => {
  if (!oldFixtures || oldFixtures.length === 0) {
    return {
      type: 'initial',
      summary: `Initial database creation with ${newFixtures.length} fixtures`,
      details: { added: newFixtures.length, updated: 0, removed: 0 }
    };
  }
  
  const oldMap = new Map(oldFixtures.map(f => [f.id, f]));
  const newMap = new Map(newFixtures.map(f => [f.id, f]));
  
  const added = [];
  const updated = [];
  const removed = [];
  
  // Find new and updated fixtures
  for (const [id, newFixture] of newMap) {
    const oldFixture = oldMap.get(id);
    
    if (!oldFixture) {
      added.push(newFixture);
    } else if (hasFixtureChanged(oldFixture, newFixture)) {
      updated.push({ old: oldFixture, new: newFixture });
    }
  }
  
  // Find removed fixtures
  for (const [id, oldFixture] of oldMap) {
    if (!newMap.has(id)) {
      removed.push(oldFixture);
    }
  }
  
  return {
    type: 'update',
    summary: `${added.length} added, ${updated.length} updated, ${removed.length} removed`,
    details: { added: added.length, updated: updated.length, removed: removed.length },
    changes: { added, updated, removed }
  };
};

// Check if fixture has changed
const hasFixtureChanged = (oldFixture, newFixture) => {
  const fields = ['date', 'time', 'status', 'venue', 'attendance'];
  
  for (const field of fields) {
    if (JSON.stringify(oldFixture[field]) !== JSON.stringify(newFixture[field])) {
      return true;
    }
  }
  
  // Check team scores
  if (oldFixture.homeTeam.score !== newFixture.homeTeam.score ||
      oldFixture.awayTeam.score !== newFixture.awayTeam.score) {
    return true;
  }
  
  return false;
};

// Get fixtures for date range (main search function)
export const getFixturesForDate = async (targetDate) => {
  const database = await loadFixturesFromDatabase();
  
  if (!database.fixtures || database.fixtures.length === 0) {
    console.log('No fixtures in database, triggering update...');
    const updateResult = await updateFixtureDatabase(true);
    if (updateResult.success && updateResult.updated) {
      return updateResult.database.fixtures.filter(f => f.date === targetDate);
    }
    return [];
  }
  
  return database.fixtures.filter(f => f.date === targetDate);
};

// Initialize database on first load
export const initializeDatabase = async () => {
  console.log('🚀 Initializing fixture database...');
  
  const database = await loadFixturesFromDatabase();
  const updateCheck = needsUpdate(database);
  
  if (updateCheck.needs) {
    console.log('Database needs updating, fetching fresh data...');
    await updateFixtureDatabase(true);
  } else {
    console.log(`Database is up to date: ${updateCheck.reason}`);
  }
}; 