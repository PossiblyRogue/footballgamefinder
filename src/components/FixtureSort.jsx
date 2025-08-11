import React from 'react';
import { ArrowUpDown, Clock, MapPin, Trophy } from 'lucide-react';

const FixtureSort = ({ sortBy, onSortChange }) => {
  const sortOptions = [
    {
      value: 'distance-asc',
      label: 'Distance (Nearest)',
      icon: MapPin,
      description: 'Sort by distance from your location'
    },
    {
      value: 'distance-desc',
      label: 'Distance (Farthest)',
      icon: MapPin,
      description: 'Sort by distance from your location'
    },
    {
      value: 'time-asc',
      label: 'Time (Earliest)',
      icon: Clock,
      description: 'Sort by kick-off time'
    },
    {
      value: 'time-desc',
      label: 'Time (Latest)',
      icon: Clock,
      description: 'Sort by kick-off time'
    },
    {
      value: 'division-asc',
      label: 'Division (Highest First)',
      icon: Trophy,
      description: 'Sort by league level (Premier League to Step 10)'
    },
    {
      value: 'division-desc',
      label: 'Division (Lowest First)',
      icon: Trophy,
      description: 'Sort by league level (Step 10 to Premier League)'
    }
  ];

  return (
    <div className="bg-white rounded-lg shadow-lg p-4 mb-6">
      <div className="flex items-center justify-between">
        <div className="flex items-center space-x-2">
          <ArrowUpDown className="w-5 h-5 text-gray-600" />
          <span className="font-medium text-gray-700">Sort Results:</span>
        </div>
        
        <select
          value={sortBy}
          onChange={(e) => onSortChange(e.target.value)}
          className="px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-green-500 focus:border-transparent bg-white text-sm"
        >
          {sortOptions.map((option) => (
            <option key={option.value} value={option.value}>
              {option.label}
            </option>
          ))}
        </select>
      </div>
      
      {/* Description of current sort */}
      <div className="mt-2 text-xs text-gray-500">
        {sortOptions.find(opt => opt.value === sortBy)?.description}
      </div>
    </div>
  );
};

export default FixtureSort; 