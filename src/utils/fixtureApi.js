import axios from 'axios';

// League name to ID
export const LEAGUE_ID_MAP = {
  'Premier League': '1',
  'EFL Championship': '2',
  'EFL League One': '3',
  'EFL League Two': '4',
  'National League': '5',
  'National League North': '6',
  'National League South': '7',
  'Northern Premier League - Premier Division': '14',
  'Isthmian League - Premier Division': '11',
  'Southern League - Premier Central Division': '8',
  'Southern League - Premier South Division': '39',
  'Northern Premier League - East Division': '15',
  'Northern Premier League - Midlands Division': '114',
  'Northern Premier League - West Division': '16',
  'Isthmian League - North Division': '12',
  'Isthmian League - South Central Division': '13',
  'Isthmian League - South East Division': '40',
  'Southern League - Division One Central': '9',
  'Southern League - Division One South': '10',
  'Combined Counties League Premier Division North': '117',
  'Combined Counties League Premier Division South': '118',
  'Essex Senior League': '123',
  'Northern League Division One': '133',
  'Northern Counties East League Premier Division': '131',
  'Southern Counties East League Premier Division': '139',
  'United Counties League Premier Division North': '143',
  'United Counties League Premier Division South': '144',
  'Combined Counties League Division One': '119',
  'Northern League Division Two': '134',
  'Northern Counties East League Division One': '132',
  'Southern Counties East League First Division': '140',
  'United Counties League Division One': '145'
};

// Step name to array of league IDs
export const STEP_ID_MAP = {
  'Premier League': ['1'],
  'EFL Championship': ['2'],
  'EFL League One': ['3'],
  'EFL League Two': ['4'],
  'National League': ['5'],
  'Non-League Step 2': ['6', '7'],
  'Non-League Step 3': ['14', '11', '8', '39'],
  'Non-League Step 4': ['15', '114', '16', '12', '13', '40', '9', '10'],
  'Non-League Step 5': ['117', '118', '123', '133', '131', '139', '143', '144'],
  'Non-League Step 6': ['119', '134', '132', '140', '145']
};

// Get all available competition names
export const getAvailableCompetitions = () => {
  return Object.keys(LEAGUE_ID_MAP);
};

// Given a dropdown value, return the correct league ID(s)
export function getCompetitionIdsForSelection(selection) {
  if (!selection || selection === 'all' || selection === 'All Divisions') {
    // All leagues
    return Object.values(LEAGUE_ID_MAP);
  }
  if (STEP_ID_MAP[selection]) {
    return STEP_ID_MAP[selection];
  }
  if (LEAGUE_ID_MAP[selection]) {
    return [LEAGUE_ID_MAP[selection]];
  }
  return [];
}

// Test API call for a specific competition
export const testFixtureApiByCompetition = async (competitionId) => {
  if (!competitionId) {
    throw new Error(`Unknown competition ID: ${competitionId}`);
  }

  const options = {
    method: 'GET',
    url: 'https://football-web-pages1.p.rapidapi.com/fixtures-results.json',
    params: {
      comp: competitionId
    },
    headers: {
      'x-rapidapi-key': '45bedef6a7msh3b4edbfddb4e1ffp1e1b22jsn7f51a5368a8b',
      'x-rapidapi-host': 'football-web-pages1.p.rapidapi.com'
    }
  };

  try {
    const response = await axios.request(options);
    return {
      competitionId,
      fixtures: response.data || [],
      count: response.data ? response.data.length : 0
    };
  } catch (error) {
    throw error;
  }
};

// Fetch fixtures from multiple competitions (by step or league)
export const fetchMultipleLeagueFixtures = async (selection = null) => {
  const ids = getCompetitionIdsForSelection(selection);
  const allFixtures = [];
  const results = {};

  for (const compId of ids) {
    try {
      const result = await testFixtureApiByCompetition(compId);
      let fixtures = [];
      if (result.fixtures && Array.isArray(result.fixtures)) {
        fixtures = result.fixtures;
      } else if (result.fixtures && result.fixtures['fixtures-results']?.matches) {
        fixtures = result.fixtures['fixtures-results'].matches;
      } else if (result.fixtures && typeof result.fixtures === 'object') {
        if (result.fixtures.matches) {
          fixtures = result.fixtures.matches;
        } else {
          fixtures = [];
        }
      } else {
        fixtures = [];
      }
      // Add competition info to each fixture
      const fixturesWithLeague = fixtures.map(fixture => ({
        ...fixture,
        competitionId: compId
      }));
      allFixtures.push(...fixturesWithLeague);
      results[compId] = {
        success: true,
        count: fixtures.length,
        fixtures: fixturesWithLeague
      };
      await new Promise(resolve => setTimeout(resolve, 2000));
    } catch (error) {
      results[compId] = {
        success: false,
        error: error.message,
        count: 0,
        fixtures: []
      };
    }
  }
  return {
    allFixtures,
    results,
    totalCount: allFixtures.length,
    summary: results
  };
};

// Legacy function - now uses Premier League specifically
export const testFixtureApi = async () => {
  const result = await testFixtureApiByCompetition('Premier League');
  return result.fixtures;
};

// Fetch all Premier League fixtures for the season
export const fetchPremierLeagueFixtures = async () => {
  return await testFixtureApi();
};

// Fetch all English football fixtures (top 5 leagues)
export const fetchAllEnglishFixtures = async () => {
  return await fetchMultipleLeagueFixtures();
}; 