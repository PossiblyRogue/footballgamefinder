import React, { useState, useEffect } from 'react';
import SearchForm from './components/SearchForm';
import FixtureList from './components/FixtureList';
import MapWidget from './components/MapWidget';
import ApiTest from './components/ApiTest';
import DatabaseManager from './components/DatabaseManager';
import NextFixtureButton from './components/NextFixtureButton';
import { geocodeLocation, calculateDistance, LEAGUE_STEP_MAP } from './data/mockData';
import { useFixtures } from './hooks/useFixtures';

function App() {
  // Get all league names for default "All Divisions" selection
  const getAllLeagueNames = () => LEAGUE_STEP_MAP.flatMap(step => step.leagues.map(l => l.name));
  
  const [filters, setFilters] = useState({
    location: '', // No default location
    distance: 25,
    divisions: getAllLeagueNames(), // Default to all divisions
    date: new Date().toISOString().split('T')[0] // Default to today
  });

  const [searchedLocation, setSearchedLocation] = useState('');
  const [filteredFixtures, setFilteredFixtures] = useState([]);
  const [hasSearched, setHasSearched] = useState(false);
  const [searchLoading, setSearchLoading] = useState(false);
  const [nextAvailableFixture, setNextAvailableFixture] = useState(null);
  const [locationError, setLocationError] = useState(null);

  // Use the fixtures hook instead of mock data
  const { searchFixtures, findNextAvailableFixture, databaseStatus, loading: fixturesLoading, error: fixturesError } = useFixtures();

  const handleDateChange = (newDate) => {
    setFilters(prev => ({
      ...prev,
      date: newDate
    }));
    
    // Auto-trigger search when date changes via navigation (reuse last searched location)
    setTimeout(() => {
      handleSearchWithDate(newDate, searchedLocation);
    }, 0);
  };

  const getLocationCoordinates = async (location) => {
    return await geocodeLocation(location);
  };

  const handleSearchWithDate = async (searchDate = filters.date, locationToSearch = filters.location) => {
    if (!locationToSearch.trim()) {
      setLocationError('Please enter a location to search');
      return;
    }

    setSearchLoading(true);
    setFilteredFixtures([]); // Clear old fixtures immediately when starting new search
    setNextAvailableFixture(null); // Clear previous next fixture info
    setLocationError(null); // Clear any previous location errors
    
    try {
      // Update the searched location (this will trigger map update)
      setSearchedLocation(locationToSearch);

      // Get user coordinates - this may throw location-specific errors
      const userCoords = await getLocationCoordinates(locationToSearch);
      
      // Search fixtures using the database
      const searchFilters = {
        date: searchDate,
        distance: filters.distance,
        divisions: filters.divisions // Pass array
      };
      
      const results = await searchFixtures(searchFilters, userCoords);
      
      setFilteredFixtures(results);
      setHasSearched(true);
      
      console.log(`🔍 Found ${results.length} fixtures for ${searchDate} within ${filters.distance}km of ${locationToSearch}`);
      
      // If no results found, find the next available fixture
      if (results.length === 0) {
        console.log('🔄 No fixtures found, searching for next available...');
        const nextFixture = await findNextAvailableFixture(searchFilters, userCoords);
        if (nextFixture) {
          setNextAvailableFixture(nextFixture);
          console.log(`📅 Next available fixture: ${nextFixture.date} (${nextFixture.count} fixture${nextFixture.count > 1 ? 's' : ''} found)`);
        } else {
          console.log('❌ No upcoming fixtures found within the specified criteria');
        }
      }
      
    } catch (error) {
      console.error('Search error:', error);
      
      // Check if it's a location-specific error
      if (error.message.includes('not found') || 
          error.message.includes('outside England') || 
          error.message.includes('Please enter') ||
          error.message.includes('Unable to find location')) {
        setLocationError(error.message);
      } else {
        setLocationError('Error searching fixtures. Please try again.');
      }
      
      setFilteredFixtures([]); // Clear fixtures on error too
      setNextAvailableFixture(null); // Clear next fixture info on error
    } finally {
      setSearchLoading(false);
    }
  };

  const handleSearch = async () => {
    await handleSearchWithDate();
  };

  const handleNextFixtureClick = async () => {
    if (nextAvailableFixture) {
      // Update the date filter and trigger a new search
      const newDate = nextAvailableFixture.date;
      setFilters(prev => ({
        ...prev,
        date: newDate
      }));
      
      // Perform search with the new date
      await handleSearchWithDate(newDate, filters.location);
    }
  };

  const handleFilterChange = (key, value) => {
    setFilters(prev => ({
      ...prev,
      [key]: value
    }));
  };

  // Don't perform initial search since no default location
  // useEffect(() => {
  //   handleSearch();
  // }, []);

  return (
    <div className="min-h-screen bg-gray-50">
      <div className="container mx-auto px-4 py-8 max-w-7xl">
        {/* Database Management & API Test Section */}
        <div className="grid grid-cols-1 xl:grid-cols-2 gap-8 mb-8">
          <DatabaseManager />
          <ApiTest />
        </div>
        
        {/* Search Form */}
        <SearchForm 
          filters={filters}
          onFilterChange={handleFilterChange}
          onSearch={handleSearch}
          isLoading={searchLoading}
        />

        {/* Location Error Display */}
        {locationError && (
          <div className="mt-4 bg-red-50 border border-red-200 p-4 rounded-lg">
            <div className="flex items-center">
              <div className="text-red-600 font-medium">
                ⚠️ Location Error
              </div>
            </div>
            <div className="text-red-700 mt-1">
              {locationError}
            </div>
          </div>
        )}

        {/* Map Widget */}
        {searchedLocation && (
          <div className="mt-6">
            <MapWidget 
              location={searchedLocation}
              distance={filters.distance}
              fixtures={filteredFixtures}
            />
          </div>
        )}

        {/* Results Section */}
        <div className="mt-8">
          <h2 className="text-2xl font-bold text-gray-800 mb-6">
            Fixture Results
          </h2>
          
          {/* Loading States */}
          {(fixturesLoading || searchLoading) && (
            <div className="bg-blue-50 border border-blue-200 p-4 rounded-lg mb-4">
              <div className="flex items-center">
                <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-blue-600 mr-2"></div>
                <span className="text-blue-800">
                  {fixturesLoading ? 'Loading fixture database...' : 'Searching fixtures...'}
                </span>
              </div>
            </div>
          )}
          
          {/* Error State */}
          {fixturesError && (
            <div className="bg-red-50 border border-red-200 p-4 rounded-lg mb-4">
              <div className="text-red-800">
                <strong>Error:</strong> {fixturesError}
              </div>
            </div>
          )}
          
          {/* Fixture List */}
          {!fixturesLoading && !searchLoading && (
            <FixtureList 
              fixtures={filteredFixtures}
              currentDate={filters.date}
              onDateChange={handleDateChange}
              nextAvailableFixture={nextAvailableFixture}
              onNextFixtureClick={handleNextFixtureClick}
              searchLoading={searchLoading}
            />
          )}
        </div>
      </div>
    </div>
  );
}

export default App; 