import React, { useState, useEffect } from 'react';
import { fetchAllEnglishFixtures, getAvailableCompetitions } from '../utils/fixtureApi';
import { getStadiums, getLeagues, logDatabaseStats, compareFixtureWithDatabase } from '../utils/stadiumDatabase';

const ApiTest = () => {
  const [loading, setLoading] = useState(false);
  const [fixtures, setFixtures] = useState(null);
  const [stadiums, setStadiums] = useState([]);
  const [matchResults, setMatchResults] = useState([]);
  const [leagues, setLeagues] = useState([]);

  useEffect(() => {
    // Load comprehensive stadium database on component mount
    const allStadiums = getStadiums();
    const allLeagues = getLeagues();
    const availableCompetitions = getAvailableCompetitions();
    setStadiums(allStadiums);
    setLeagues(allLeagues);
    console.log('Available competitions:', availableCompetitions);
    console.log('Leagues in database:', allLeagues);
    logDatabaseStats();
  }, []);

  const handleTestApi = async () => {
    setLoading(true);
    try {
      const data = await fetchAllEnglishFixtures();
      setFixtures(data);
      // Try to match fixtures with stadium database
      if (data?.allFixtures?.length > 0) {
        const fixtureList = data.allFixtures;
        const sampleMatches = fixtureList.slice(0, 20).map(fixture => {
          const fixtureForMatching = {
            homeTeam: fixture['home-team']?.name,
            awayTeam: fixture['away-team']?.name,
            venue: fixture.venue
          };
          const matchResult = compareFixtureWithDatabase(fixtureForMatching);
          return {
            apiData: {
              homeTeam: fixture['home-team']?.name,
              awayTeam: fixture['away-team']?.name,
              venue: fixture.venue,
              date: fixture.date,
              competition: fixture.competition
            },
            ...matchResult,
            hasMatch: matchResult.success
          };
        });
        setMatchResults(sampleMatches);
        // Calculate overall match statistics by league
        const leagueStats = {};
        const allMatches = fixtureList.slice(0, 100).map(fixture => {
          const fixtureForMatching = {
            homeTeam: fixture['home-team']?.name,
            awayTeam: fixture['away-team']?.name,
            venue: fixture.venue
          };
          const matchResult = compareFixtureWithDatabase(fixtureForMatching);
          const competition = fixture.competition;
          if (!leagueStats[competition]) {
            leagueStats[competition] = { total: 0, matched: 0 };
          }
          leagueStats[competition].total++;
          if (matchResult.success) {
            leagueStats[competition].matched++;
          }
          return { ...matchResult, competition };
        });
        console.log('League matching statistics:', leagueStats);
        console.log('Sample fixture-stadium matches (first 20):', sampleMatches);
        Object.entries(leagueStats).forEach(([league, stats]) => {
          const successRate = ((stats.matched / stats.total) * 100).toFixed(1);
          console.log(`${league}: ${stats.matched}/${stats.total} (${successRate}%)`);
        });
      }
    } catch (error) {
      console.error('API test failed:', error);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="p-6 bg-white border border-gray-200 rounded-lg">
      <h2 className="text-xl font-bold mb-4">Multi-League API & Database Integration Test</h2>
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        {/* Stadium Database Info */}
        <div>
          <h3 className="text-lg font-semibold mb-2">Comprehensive Stadium Database</h3>
          <div className="text-sm text-gray-600 space-y-1">
            <div>📊 Total stadiums: {stadiums.length}</div>
            <div>🏆 Leagues supported: {leagues.length}</div>
            <div className="ml-4">
              {leagues.map((league, idx) => (
                <div key={league} className="text-xs">
                  {idx + 1}. {league}
                </div>
              ))}
            </div>
          </div>
        </div>
        {/* API Test Controls */}
        <div>
          <h3 className="text-lg font-semibold mb-2">API Testing</h3>
          <div className="space-y-2">
            <button
              onClick={handleTestApi}
              disabled={loading}
              className="w-full px-4 py-2 bg-blue-500 text-white rounded hover:bg-blue-600 disabled:opacity-50 text-sm"
            >
              {loading ? 'Fetching...' : 'Fetch All English Fixtures'}
            </button>
          </div>
        </div>
      </div>
      {/* API Response Display */}
      {fixtures && (
        <div className="mt-6">
          <h3 className="text-lg font-semibold">Multi-League API Response:</h3>
          <div className="text-sm text-gray-600 mb-2">
            Total fixtures: {fixtures.totalCount} | 
            Results: {Object.keys(fixtures.results).length} leagues
          </div>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-3 mb-4">
            {Object.entries(fixtures.results).map(([league, result]) => (
              <div
                key={league}
                className={`p-3 rounded border ${
                  result.success ? 'bg-green-50 border-green-200' : 'bg-red-50 border-red-200'
                }`}
              >
                <div className="font-semibold text-sm">
                  {result.success ? '✅' : '❌'} {league}
                </div>
                {result.success ? (
                  <div className="text-xs text-green-700">
                    {result.count} fixtures fetched
                  </div>
                ) : (
                  <div className="text-xs text-red-700">
                    Error: {result.error}
                  </div>
                )}
              </div>
            ))}
          </div>
          <pre className="bg-gray-100 p-3 rounded text-xs overflow-auto max-h-32">
            {JSON.stringify(fixtures, null, 2)}
          </pre>
        </div>
      )}
      {matchResults.length > 0 && (
        <div className="mt-6">
          <h3 className="text-lg font-semibold">Fixture-Stadium Matching Results:</h3>
          <div className="mb-4 p-3 bg-blue-50 rounded">
            <h4 className="font-semibold text-blue-800">Match Summary:</h4>
            <div className="text-sm text-blue-700">
              ✅ Successful matches: {matchResults.filter(m => m.hasMatch).length}/{matchResults.length}
            </div>
          </div>
          <div className="space-y-3">
            {matchResults.map((match, idx) => (
              <div key={idx} className={`p-3 rounded border ${match.hasMatch ? 'bg-green-50 border-green-200' : 'bg-red-50 border-red-200'}`}>
                <div className="font-semibold mb-2">
                  {match.hasMatch ? '✅ MATCH FOUND' : '❌ NO MATCH'} 
                  {match.hasMatch && (
                    <span className="ml-2 text-xs bg-blue-100 text-blue-800 px-2 py-1 rounded">
                      via {match.matchMethod}
                    </span>
                  )}
                </div>
                <div className="text-sm space-y-1">
                  <div><strong>API Fixture:</strong> {match.apiData.homeTeam} vs {match.apiData.awayTeam}</div>
                  <div><strong>Venue:</strong> {match.apiData.venue}</div>
                  <div><strong>Date:</strong> {match.apiData.date}</div>
                  {match.databaseStadium && (
                    <div className="mt-2 pt-2 border-t border-gray-200">
                      <div><strong>Database Match:</strong> {match.databaseStadium.properties.clubLabel}</div>
                      <div><strong>Stadium:</strong> {match.databaseStadium.properties.stadiumLabel}</div>
                      <div><strong>Coordinates:</strong> {match.coordinates.lat.toFixed(4)}, {match.coordinates.lng.toFixed(4)}</div>
                      {match.databaseStadium.properties.address && (
                        <div><strong>Address:</strong> {match.databaseStadium.properties.address}</div>
                      )}
                    </div>
                  )}
                </div>
              </div>
            ))}
          </div>
          <div className="mt-4 p-3 bg-gray-50 rounded text-sm">
            <strong>Next Steps:</strong> Once matching looks good, we can replace mock data with real API fixtures using accurate stadium coordinates from your Wikipedia database.
          </div>
        </div>
      )}
    </div>
  );
};

export default ApiTest; 