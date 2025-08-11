import React, { useState, useMemo } from 'react';
import { ChevronLeft, ChevronRight } from 'lucide-react';
import FixtureCard from './FixtureCard';
import NextFixtureButton from './NextFixtureButton';
import FixtureSort from './FixtureSort';

// Function to get the pyramid level for each competition (same as other components)
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

const FixtureList = ({ fixtures, currentDate, onDateChange, nextAvailableFixture, onNextFixtureClick, searchLoading }) => {
  const [sortBy, setSortBy] = useState('distance-asc');

  const formatDateForDisplay = (dateString) => {
    const date = new Date(dateString);
    const today = new Date();
    const isToday = date.toDateString() === today.toDateString();
    
    return {
      display: date.toLocaleDateString('en-GB', { 
        weekday: 'long', 
        year: 'numeric', 
        month: 'long', 
        day: 'numeric' 
      }),
      isToday
    };
  };

  const dateInfo = formatDateForDisplay(currentDate);

  const navigateDate = (direction) => {
    const currentDateObj = new Date(currentDate);
    const newDate = new Date(currentDateObj);
    newDate.setDate(currentDateObj.getDate() + direction);
    const formattedDate = newDate.toISOString().split('T')[0];
    onDateChange(formattedDate);
  };

  const goToPreviousDay = () => navigateDate(-1);
  const goToNextDay = () => navigateDate(1);

  // Sort fixtures based on selected criteria
  const sortedFixtures = useMemo(() => {
    if (!fixtures || fixtures.length === 0) return fixtures;

    return [...fixtures].sort((a, b) => {
      const { fixture: fixtureA, distance: distanceA } = a;
      const { fixture: fixtureB, distance: distanceB } = b;

      switch (sortBy) {
        case 'distance-asc':
          return (distanceA || 0) - (distanceB || 0);
        
        case 'distance-desc':
          return (distanceB || 0) - (distanceA || 0);
        
        case 'time-asc':
          const timeA = fixtureA.time || '23:59';
          const timeB = fixtureB.time || '23:59';
          return timeA.localeCompare(timeB);
        
        case 'time-desc':
          const timeA_desc = fixtureA.time || '00:00';
          const timeB_desc = fixtureB.time || '00:00';
          return timeB_desc.localeCompare(timeA_desc);
        
        case 'division-desc':
          const levelA = getCompetitionLevel(fixtureA.competition) || 0;
          const levelB = getCompetitionLevel(fixtureB.competition) || 0;
          return levelB - levelA;
        
        case 'division-asc':
          const levelA_asc = getCompetitionLevel(fixtureA.competition) || 999;
          const levelB_asc = getCompetitionLevel(fixtureB.competition) || 999;
          return levelA_asc - levelB_asc;
        
        default:
          return 0;
      }
    });
  }, [fixtures, sortBy]);

  const handleSortChange = (newSortBy) => {
    setSortBy(newSortBy);
  };

  return (
    <div className="space-y-6">
      {/* Date Navigation Header - Always visible */}
      <div className="bg-white rounded-lg shadow-lg p-6">
        <div className="flex items-center justify-between">
          <button 
            onClick={goToPreviousDay}
            className="p-2 hover:bg-gray-100 rounded-full transition-colors"
            title="Previous day"
          >
            <ChevronLeft className="w-5 h-5 text-gray-600" />
          </button>
          
          <div className="text-center">
            <h2 className="text-2xl font-bold text-gray-800">
              {dateInfo.display}
            </h2>
            {dateInfo.isToday && (
              <span className="text-sm text-green-600 font-medium">Today</span>
            )}
          </div>
          
          <button 
            onClick={goToNextDay}
            className="p-2 hover:bg-gray-100 rounded-full transition-colors"
            title="Next day"
          >
            <ChevronRight className="w-5 h-5 text-gray-600" />
          </button>
        </div>
      </div>

      {/* Next Available Fixture Button - shows when no results found */}
      {fixtures.length === 0 && nextAvailableFixture && (
        <NextFixtureButton 
          nextFixture={nextAvailableFixture}
          onNextFixtureClick={onNextFixtureClick}
          isLoading={searchLoading}
        />
      )}

      {/* Results Summary */}
      <div className="text-center">
        <p className="text-gray-600">
          Found <span className="font-bold text-gray-800">{fixtures.length}</span> fixtures matching your search
        </p>
      </div>

      {/* Sort Options - Only show if there are fixtures */}
      {fixtures.length > 0 && (
        <FixtureSort 
          sortBy={sortBy}
          onSortChange={handleSortChange}
        />
      )}

      {/* No Fixtures Found Message */}
      {fixtures.length === 0 ? (
        <div className="bg-white rounded-lg shadow-lg p-8 text-center">
          <h3 className="text-xl font-bold text-gray-600 mb-4">No Fixtures Found</h3>
          <p className="text-gray-500 mb-4">
            No matches found for this date with your current search criteria.
          </p>
          <p className="text-sm text-gray-400">
            Try using the ← → arrows above to check other dates, or adjust your search filters.
          </p>
        </div>
      ) : (
        /* Fixture Cards Grid */
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {sortedFixtures.map(({ fixture, distance }) => (
            <FixtureCard 
              key={fixture.id} 
              fixture={fixture} 
              distance={distance}
            />
          ))}
        </div>
      )}
    </div>
  );
};

export default FixtureList; 