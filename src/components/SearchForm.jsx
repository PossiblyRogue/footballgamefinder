import React, { useState, useEffect, useRef } from 'react';
import { Search, MapPin, Calendar, Trophy, Database, ChevronDown } from 'lucide-react';
import { distanceOptions, getCacheSize, LEAGUE_STEP_MAP } from '../data/mockData';

const getAllLeagueNames = () => LEAGUE_STEP_MAP.flatMap(step => step.leagues.map(l => l.name));

const SearchForm = ({ filters, onFilterChange, onSearch }) => {
  const [isSearching, setIsSearching] = useState(false);
  const [cacheSize, setCacheSize] = useState(0);
  const [openSteps, setOpenSteps] = useState({}); // For collapsible dropdowns
  const dropdownRef = useRef(null);

  // Multi-select state
  const selected = filters.divisions || [];
  const allLeagues = getAllLeagueNames();
  const allSelected = selected.length === allLeagues.length;

  // Update cache size periodically
  useEffect(() => {
    const updateCacheSize = () => setCacheSize(getCacheSize());
    updateCacheSize();
    const interval = setInterval(updateCacheSize, 2000);
    return () => clearInterval(interval);
  }, []);

  // Click outside handler for dropdown
  useEffect(() => {
    const handleClickOutside = (event) => {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target)) {
        setOpenSteps(prev => ({ ...prev, divisions: false }));
      }
    };

    document.addEventListener('mousedown', handleClickOutside);
    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
    };
  }, []);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setIsSearching(true);
    try {
      await onSearch();
    } finally {
      setIsSearching(false);
    }
  };

  // Checkbox logic
  const toggleAll = () => {
    if (allSelected) {
      onFilterChange('divisions', []);
    } else {
      onFilterChange('divisions', [...allLeagues]);
    }
  };
  const isLeagueChecked = (league) => selected.includes(league);
  const toggleLeague = (league) => {
    if (isLeagueChecked(league)) {
      onFilterChange('divisions', selected.filter(l => l !== league));
    } else {
      onFilterChange('divisions', [...selected, league]);
    }
  };

  // For steps with multiple leagues, check if all/none/some are selected
  const isStepChecked = (step) => {
    const stepLeagues = LEAGUE_STEP_MAP.find(s => s.step === step).leagues.map(l => l.name);
    return stepLeagues.every(l => selected.includes(l));
  };
  const isStepIndeterminate = (step) => {
    const stepLeagues = LEAGUE_STEP_MAP.find(s => s.step === step).leagues.map(l => l.name);
    return stepLeagues.some(l => selected.includes(l)) && !isStepChecked(step);
  };
  const toggleStep = (step) => {
    const stepLeagues = LEAGUE_STEP_MAP.find(s => s.step === step).leagues.map(l => l.name);
    if (isStepChecked(step)) {
      onFilterChange('divisions', selected.filter(l => !stepLeagues.includes(l)));
    } else {
      onFilterChange('divisions', Array.from(new Set([...selected, ...stepLeagues])));
    }
  };

  return (
    <div className="bg-white rounded-lg shadow-lg p-6 mb-8">
      <h1 className="text-3xl font-bold text-gray-800 mb-6 text-center">
        Search for Fixtures
      </h1>
      <form onSubmit={handleSubmit} className="space-y-4">
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
          {/* Location Input */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              <MapPin className="inline w-4 h-4 mr-1" />
              Your Location
            </label>
            <input
              type="text"
              value={filters.location}
              onChange={(e) => onFilterChange('location', e.target.value)}
              placeholder="e.g., London, Manchester, Cardiff, Leeds, Birmingham"
              className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-green-500 focus:border-transparent"
              required
            />
            <div className="flex justify-between items-center mt-1">
              <p className="text-xs text-gray-500">
                Enter any city, town, or address in England or Wales
              </p>
              {cacheSize > 0 && (
                <div className="flex items-center text-xs text-green-600">
                  <Database className="w-3 h-3 mr-1" />
                  <span>{cacheSize} cached</span>
                </div>
              )}
            </div>
          </div>

          {/* Distance Dropdown */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Maximum Distance
            </label>
            <select
              value={filters.distance}
              onChange={(e) => onFilterChange('distance', parseInt(e.target.value))}
              className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-green-500 focus:border-transparent"
            >
              {distanceOptions.map(option => (
                <option key={option.value} value={option.value}>
                  {option.label}
                </option>
              ))}
            </select>
          </div>

          {/* Multi-select Division/League Dropdown */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              <Trophy className="inline w-4 h-4 mr-1" />
              Divisions & Leagues
            </label>
            <div className="relative" ref={dropdownRef}>
              <button
                type="button"
                onClick={() => setOpenSteps(prev => ({ ...prev, divisions: !prev.divisions }))}
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-green-500 focus:border-transparent bg-white text-left flex items-center justify-between"
              >
                <span className="truncate">
                  {allSelected ? 'All Divisions' : 
                   selected.length === 0 ? 'Select Divisions' :
                   selected.length === 1 ? selected[0] :
                   `${selected.length} Divisions Selected`}
                </span>
                <ChevronDown className={`w-4 h-4 transition-transform ${openSteps.divisions ? 'rotate-180' : ''}`} />
              </button>
              
              {openSteps.divisions && (
                <div className="absolute z-10 w-full mt-1 bg-white border border-gray-300 rounded-md shadow-lg max-h-64 overflow-y-auto">
                  <div className="p-2">
                    {/* All Divisions */}
                    <div className="flex items-center mb-2 p-1 hover:bg-gray-50 rounded">
                      <input
                        type="checkbox"
                        checked={allSelected}
                        onChange={toggleAll}
                        className="accent-blue-600 w-4 h-4 mr-2"
                        id="all-divisions"
                      />
                      <label htmlFor="all-divisions" className="font-bold text-blue-700 cursor-pointer flex-1">
                        All Divisions
                      </label>
                    </div>
                    
                    {/* Divisions */}
                    {LEAGUE_STEP_MAP.map(step => (
                      step.leagues.length === 1 ? (
                        // Single-league division
                        <div key={step.step} className="flex items-center mb-1 p-1 hover:bg-gray-50 rounded">
                          <input
                            type="checkbox"
                            checked={isLeagueChecked(step.leagues[0].name)}
                            onChange={() => toggleLeague(step.leagues[0].name)}
                            className="accent-blue-600 w-4 h-4 mr-2"
                            id={`league-${step.leagues[0].id}`}
                          />
                          <label htmlFor={`league-${step.leagues[0].id}`} className="text-blue-800 cursor-pointer flex-1">
                            {step.leagues[0].name}
                          </label>
                        </div>
                      ) : (
                        // Multi-league division
                        <div key={step.step} className="mb-1">
                          <div className="flex items-center p-1 hover:bg-gray-50 rounded">
                            <input
                              type="checkbox"
                              checked={isStepChecked(step.step)}
                              ref={el => {
                                if (el) el.indeterminate = isStepIndeterminate(step.step);
                              }}
                              onChange={() => toggleStep(step.step)}
                              className="accent-blue-600 w-4 h-4 mr-2"
                              id={`step-${step.step}`}
                            />
                            <label htmlFor={`step-${step.step}`} className="font-semibold text-blue-600 cursor-pointer flex-1">
                              {step.step}
                            </label>
                          </div>
                          {/* Show individual leagues for multi-league divisions */}
                          <div className="ml-4 space-y-1">
                            {step.leagues.map(league => (
                              <div key={league.id} className="flex items-center p-1 hover:bg-gray-50 rounded">
                                <input
                                  type="checkbox"
                                  checked={isLeagueChecked(league.name)}
                                  onChange={() => toggleLeague(league.name)}
                                  className="accent-blue-600 w-4 h-4 mr-2"
                                  id={`league-${league.id}`}
                                />
                                <label htmlFor={`league-${league.id}`} className="text-blue-800 cursor-pointer flex-1">
                                  {league.name}
                                </label>
                              </div>
                            ))}
                          </div>
                        </div>
                      )
                    ))}
                  </div>
                </div>
              )}
            </div>
          </div>

          {/* Date Picker */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              <Calendar className="inline w-4 h-4 mr-1" />
              Match Date
            </label>
            <input
              type="date"
              value={filters.date}
              onChange={(e) => onFilterChange('date', e.target.value)}
              className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-green-500 focus:border-transparent"
            />
          </div>
        </div>

        {/* Search Button */}
        <div className="flex justify-center mt-6">
          <button
            type="submit"
            disabled={isSearching}
            className="bg-green-600 hover:bg-green-700 disabled:bg-gray-400 disabled:cursor-not-allowed text-white font-bold py-3 px-8 rounded-lg transition duration-200 flex items-center space-x-2"
          >
            {isSearching ? (
              <>
                <div className="w-5 h-5 border-2 border-white border-t-transparent rounded-full animate-spin"></div>
                <span>Searching...</span>
              </>
            ) : (
              <>
                <Search className="w-5 h-5" />
                <span>Find Fixtures</span>
              </>
            )}
          </button>
        </div>
      </form>
    </div>
  );
};

export default SearchForm; 