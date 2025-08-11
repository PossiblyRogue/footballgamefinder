import React from 'react';
import { Calendar, MapPin, ArrowRight } from 'lucide-react';

const NextFixtureButton = ({ nextFixture, onNextFixtureClick, isLoading }) => {
  if (!nextFixture) return null;

  const formatDate = (dateString) => {
    const date = new Date(dateString);
    return date.toLocaleDateString('en-US', {
      weekday: 'long',
      year: 'numeric',
      month: 'long',
      day: 'numeric'
    });
  };

  return (
    <div className="mt-4 p-4 bg-blue-50 border border-blue-200 rounded-lg">
      <div className="flex items-start space-x-3">
        <div className="flex-shrink-0">
          <Calendar className="w-5 h-5 text-blue-600 mt-0.5" />
        </div>
        <div className="flex-1">
          <h4 className="text-sm font-medium text-blue-800 mb-1">
            No fixtures found for this date
          </h4>
          <p className="text-sm text-blue-700 mb-3">
            The next available fixture{nextFixture.count > 1 ? 's' : ''} for your selection {nextFixture.count > 1 ? 'are' : 'is'} on:
          </p>
          <div className="flex items-center space-x-2 mb-3">
            <span className="text-lg font-semibold text-blue-800">
              {formatDate(nextFixture.date)}
            </span>
            {nextFixture.count > 1 && (
              <span className="inline-flex items-center px-2 py-1 rounded-full text-xs font-medium bg-blue-100 text-blue-800">
                {nextFixture.count} fixture{nextFixture.count > 1 ? 's' : ''}
              </span>
            )}
          </div>
          <div className="flex items-center space-x-2 text-sm text-blue-600 mb-3">
            <MapPin className="w-4 h-4" />
            <span>
              {nextFixture.fixture.stadium.name} • {nextFixture.distance.toFixed(1)}km away
            </span>
          </div>
          <button
            onClick={onNextFixtureClick}
            disabled={isLoading}
            className="inline-flex items-center px-4 py-2 bg-blue-600 text-white text-sm font-medium rounded-lg hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
          >
            {isLoading ? (
              <>
                <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin mr-2" />
                Loading...
              </>
            ) : (
              <>
                Jump to this date
                <ArrowRight className="w-4 h-4 ml-2" />
              </>
            )}
          </button>
        </div>
      </div>
    </div>
  );
};

export default NextFixtureButton; 