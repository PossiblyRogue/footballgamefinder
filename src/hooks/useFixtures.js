import { useState, useEffect, useCallback } from 'react';
import { getAllFixtures, getDatabaseStatus, reloadDatabase } from '../services/newFixtureDatabase';
import { calculateDistance } from '../data/mockData';

// Normalize competition names from API to match our database format
const normalizeCompetitionName = (compName) => {
  const name = compName.toLowerCase().trim();
  
  // Handle API competition name variations
  const competitionMap = {
    'premier league': 'premier league',
    'premier league 5': 'premier league',
    'sky bet championship': 'efl championship',
    'efl championship': 'efl championship',
    'sky bet league one': 'efl league one',
    'efl league one': 'efl league one',
    'sky bet league two': 'efl league two',
    'efl league two': 'efl league two',
    'vanarama national league': 'national league',
    'national league': 'national league',
    'vanarama national league north': 'national league north',
    'national league north': 'national league north',
    'vanarama national league south': 'national league south',
    'national league south': 'national league south'
  };
  
  return competitionMap[name] || name;
};

export const useFixtures = () => {
  const [allFixtures, setAllFixtures] = useState([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  const [databaseStatus, setDatabaseStatus] = useState(null);

  // Load all fixtures from database on initial load
  useEffect(() => {
    loadAllFixtures();
  }, []);

  const loadAllFixtures = async () => {
    setLoading(true);
    setError(null);
    
    try {
      const fixtures = await getAllFixtures();
      const status = await getDatabaseStatus();
      
      setDatabaseStatus({
        lastUpdated: status.lastLoaded,
        totalFixtures: status.fixtureCount,
        successRate: status.withLocation ? ((status.withLocation / status.fixtureCount) * 100).toFixed(1) + '%' : '0%',
        withLocation: status.withLocation
      });
      
      if (fixtures && fixtures.length > 0) {
        setAllFixtures(fixtures);
        console.log(`✅ Loaded ${fixtures.length} fixtures from new database`);
        console.log(`📍 ${status.withLocation} fixtures have location data`);
      } else {
        console.log('⚠️ No fixtures found in database');
        setAllFixtures([]);
      }
    } catch (err) {
      console.error('Error loading fixtures:', err);
      setError(err.message);
      setAllFixtures([]);
    } finally {
      setLoading(false);
    }
  };

  // Search fixtures with location-based filtering
  const searchFixtures = useCallback(async (filters, userLocation) => {
    try {
      console.log('🔍 Starting fixture search with filters:', filters);
      console.log('📍 User location:', userLocation);
      
      const { date, distance, divisions } = filters;
      const today = new Date().toISOString().split('T')[0];
      
      // Load fixtures if not already loaded
      if (allFixtures.length === 0) {
        console.log('📂 Loading fixtures from database...');
        await loadAllFixtures();
      }
      
      console.log('📊 Total fixtures loaded:', allFixtures.length);
      
      // Debug logging
      if (allFixtures.length > 0) {
        console.log('🎯 Sample fixture structure:', allFixtures[0]);
        console.log('🏆 Sample competition field:', allFixtures[0].competition);
        console.log('📍 Sample coordinates:', allFixtures[0].stadium?.coordinates);
      }
      
      // Normalize for comparison
      const normDivisions = (divisions || [])
        .flat()
        .filter(d => typeof d === 'string' && d)
        .map(d => d.toLowerCase().trim());
      console.log('🔽 Selected divisions (raw):', divisions);
      console.log('🔽 Normalized divisions for search:', normDivisions);

      let filteredFixtures = allFixtures.filter(fixture => {
        // Date filtering
        if (date && fixture.date !== date) return false;
        if (!date && fixture.date < today) return false;
        
        // Multi-league filtering
        let compName = '';
        if (typeof fixture.competition === 'string') {
          compName = fixture.competition.toLowerCase().trim();
        } else if (fixture.competition && typeof fixture.competition.name === 'string') {
          compName = fixture.competition.name.toLowerCase().trim();
        }
        console.log('🏆 Fixture competition name (normalized):', compName);
        
        if (normDivisions.length > 0) {
          // Handle API competition name variations
          const normalizedCompName = normalizeCompetitionName(compName);
          console.log('🏆 Normalized competition name:', normalizedCompName);
          
          if (!normDivisions.includes(normalizedCompName)) {
            console.log('❌ Fixture excluded - competition not in selected divisions');
            return false;
          }
        }
        
        return true;
      });
      
      console.log('✅ Fixtures after date/division filtering:', filteredFixtures.length);
      
      if (filteredFixtures.length > 0) {
        console.log('🎯 Sample filtered fixture:', filteredFixtures[0]);
      }

      // Process fixtures with distances and stadium coordinates
      const processedFixtures = await Promise.all(
        filteredFixtures.map(async (fixture) => {
          try {
            // Check if fixture has stadium coordinates
            if (!fixture.stadium?.coordinates) {
              console.log('⚠️ Fixture missing coordinates:', {
                teams: `${fixture.homeTeam?.name || 'unknown'} vs ${fixture.awayTeam?.name || 'unknown'}`,
                venue: fixture.venue,
                stadium: fixture.stadium
              });
              return null; // Skip fixtures without coordinates
            }
            
            const fixtureCoords = fixture.stadium.coordinates;
            console.log('📍 Fixture coordinates:', fixtureCoords);
            
            const dist = calculateDistance(
              userLocation.lat, userLocation.lng,
              fixtureCoords.lat, fixtureCoords.lng
            );
            
            console.log('📏 Calculated distance:', dist, 'km, max allowed:', distance, 'km');
            
            if (dist <= distance) {
              console.log('✅ Fixture within distance');
              return { fixture, distance: dist };
            } else {
              console.log('❌ Fixture too far away');
              return null;
            }
          } catch (error) {
            console.error('❌ Error processing fixture:', error);
            return null;
          }
        })
      );

      const validFixtures = processedFixtures.filter(Boolean);
      console.log('🎯 Final fixtures within distance:', validFixtures.length);
      
      if (validFixtures.length > 0) {
        console.log('🎯 Sample final fixture:', validFixtures[0]);
      }

      // Sort by distance
      const sortedFixtures = validFixtures.sort((a, b) => a.distance - b.distance);
      
      console.log('📊 Search complete. Returning', sortedFixtures.length, 'fixtures');
      return sortedFixtures;

    } catch (error) {
      console.error('❌ Error searching fixtures:', error);
      return [];
    }
  }, [allFixtures, loadAllFixtures]);

  // Get fixtures for a specific date
  const getFixturesByDate = useCallback(async (targetDate) => {
    try {
      // Load fixtures if not already loaded
      if (allFixtures.length === 0) {
        await loadAllFixtures();
      }
      
      const fixtures = allFixtures.filter(f => f.date === targetDate);
      return fixtures.map(fixture => ({ fixture, distance: null }));
    } catch (err) {
      console.error('Error getting fixtures by date:', err);
      setError(err.message);
      return [];
    }
  }, [allFixtures, loadAllFixtures]);

  // Get upcoming fixtures
  const getUpcomingFixtures = useCallback((limit = 10) => {
    const today = new Date().toISOString().split('T')[0];
    
    return allFixtures
      .filter(fixture => fixture.date >= today)
      .sort((a, b) => new Date(a.date) - new Date(b.date))
      .slice(0, limit)
      .map(fixture => ({ fixture, distance: null }));
  }, [allFixtures]);

  // Get fixtures for today
  const getTodaysFixtures = useCallback(() => {
    const today = new Date().toISOString().split('T')[0];
    
    return allFixtures
      .filter(fixture => fixture.date === today)
      .map(fixture => ({ fixture, distance: null }));
  }, [allFixtures]);

  // Refresh fixtures (force reload from database)
  const refreshFixtures = useCallback(async () => {
    await reloadDatabase();
    await loadAllFixtures();
  }, []);

  // Find next available fixture date that matches criteria
  const findNextAvailableFixture = useCallback(async (filters, userLocation) => {
    if (!allFixtures.length || !userLocation) {
      return null;
    }

    const { distance, divisions } = filters;
    const today = new Date().toISOString().split('T')[0];
    
    try {
      // Get all fixtures from today onwards
      const upcomingFixtures = allFixtures.filter(fixture => {
        // Only future fixtures
        if (fixture.date <= today) {
          return false;
        }
        
        // Multi-league filtering
        if (divisions && divisions.length > 0) {
          if (!divisions.includes(fixture.competition)) {
            return false;
          }
        }
        
        return true;
      });

      // Filter by distance and find the earliest match
      const matchingFixtures = [];
      
      for (const fixture of upcomingFixtures) {
        if (fixture.stadium?.coordinates) {
          const dist = calculateDistance(
            userLocation.lat,
            userLocation.lng,
            fixture.stadium.coordinates.lat,
            fixture.stadium.coordinates.lng
          );
          
          if (dist <= distance) {
            matchingFixtures.push({
              fixture,
              distance: dist,
              date: fixture.date
            });
          }
        }
      }
      
      if (matchingFixtures.length === 0) {
        return null;
      }
      
      // Sort by date to get the earliest match
      matchingFixtures.sort((a, b) => new Date(a.date) - new Date(b.date));
      
      const nextFixture = matchingFixtures[0];
      return {
        date: nextFixture.date,
        fixture: nextFixture.fixture,
        distance: nextFixture.distance,
        count: matchingFixtures.filter(f => f.date === nextFixture.date).length
      };
      
    } catch (err) {
      console.error('Error finding next fixture:', err);
      return null;
    }
  }, [allFixtures]);

  return {
    // Data
    allFixtures,
    databaseStatus,
    loading,
    error,
    
    // Methods
    searchFixtures,
    getFixturesByDate,
    getUpcomingFixtures,
    getTodaysFixtures,
    refreshFixtures,
    findNextAvailableFixture, // Export the new function
    
    // Utilities
    hasFixtures: allFixtures.length > 0,
    fixtureCount: allFixtures.length
  };
}; 