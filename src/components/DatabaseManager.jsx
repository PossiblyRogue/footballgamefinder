import React, { useState, useEffect } from 'react';
import { 
  loadFixturesFromDatabase, 
  updateFixtureDatabase, 
  needsUpdate,
  initializeDatabase 
} from '../services/fixtureDatabase';

const DatabaseManager = () => {
  const [database, setDatabase] = useState(null);
  const [loading, setLoading] = useState(false);
  const [updateResult, setUpdateResult] = useState(null);
  const [updateCheck, setUpdateCheck] = useState(null);

  useEffect(() => {
    loadDatabaseInfo();
  }, []);

  const loadDatabaseInfo = async () => {
    setLoading(true);
    try {
      const db = await loadFixturesFromDatabase();
      setDatabase(db);
      
      const check = needsUpdate(db);
      setUpdateCheck(check);
    } catch (error) {
      console.error('Error loading database info:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleManualUpdate = async (force = false) => {
    setLoading(true);
    setUpdateResult(null);
    
    try {
      const result = await updateFixtureDatabase(force);
      setUpdateResult(result);
      
      if (result.success) {
        setDatabase(result.database);
        const check = needsUpdate(result.database);
        setUpdateCheck(check);
      }
    } catch (error) {
      setUpdateResult({ success: false, error: error.message });
    } finally {
      setLoading(false);
    }
  };

  const handleInitialize = async () => {
    setLoading(true);
    try {
      await initializeDatabase();
      await loadDatabaseInfo();
    } catch (error) {
      console.error('Error initializing database:', error);
    } finally {
      setLoading(false);
    }
  };

  const downloadBackup = () => {
    if (updateResult?.backupUrl) {
      const a = document.createElement('a');
      a.href = updateResult.backupUrl;
      a.download = `fixtures-backup-${new Date().toISOString().split('T')[0]}.json`;
      a.click();
    }
  };

  if (loading && !database) {
    return (
      <div className="p-6 bg-white border border-gray-200 rounded-lg">
        <div className="animate-pulse">
          <div className="h-4 bg-gray-200 rounded w-1/4 mb-4"></div>
          <div className="h-3 bg-gray-200 rounded w-1/2 mb-2"></div>
          <div className="h-3 bg-gray-200 rounded w-1/3"></div>
        </div>
      </div>
    );
  }

  return (
    <div className="p-6 bg-white border border-gray-200 rounded-lg">
      <h2 className="text-xl font-bold mb-4">⚽ Fixture Database Manager</h2>
      
      {/* Database Status */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-6">
        <div className="p-4 bg-gray-50 rounded">
          <h3 className="font-semibold text-gray-800 mb-2">Database Status</h3>
          {database ? (
            <div className="space-y-1 text-sm">
              <div><strong>Fixtures:</strong> {database.metadata?.totalFixtures || database.fixtures?.length || 0}</div>
              <div><strong>Matched Stadiums:</strong> {database.metadata?.matchedStadiums || 0}</div>
              <div><strong>Success Rate:</strong> {database.metadata?.successRate || '0'}%</div>
              <div><strong>Last Updated:</strong> {database.lastUpdated ? new Date(database.lastUpdated).toLocaleString() : 'Never'}</div>
              {database.metadata?.essential && (
                <div className="mt-2 p-2 bg-yellow-100 border border-yellow-300 rounded text-xs">
                  <strong>⚠️ Essential Mode:</strong> Showing limited data due to storage constraints
                </div>
              )}
              {database.metadata?.optimized && (
                <div className="mt-2 p-2 bg-blue-100 border border-blue-300 rounded text-xs">
                  <strong>🔧 Optimized:</strong> Data compressed to fit storage limits
                </div>
              )}
            </div>
          ) : (
            <div className="text-gray-500">Loading...</div>
          )}
        </div>

        <div className="p-4 bg-gray-50 rounded">
          <h3 className="font-semibold text-gray-800 mb-2">Update Status</h3>
          {updateCheck ? (
            <div className="space-y-1 text-sm">
              <div className={`font-medium ${updateCheck.needs ? 'text-orange-600' : 'text-green-600'}`}>
                {updateCheck.needs ? '⚠️ Update Needed' : '✅ Up to Date'}
              </div>
              <div className="text-gray-600">{updateCheck.reason}</div>
            </div>
          ) : (
            <div className="text-gray-500 text-sm">Loading...</div>
          )}
        </div>
      </div>

      {/* Control Buttons */}
      <div className="flex flex-wrap gap-3 mb-6">
        <button
          onClick={() => handleManualUpdate(false)}
          disabled={loading}
          className={`px-4 py-2 rounded font-medium ${
            updateCheck?.needs 
              ? 'bg-orange-500 text-white hover:bg-orange-600' 
              : 'bg-gray-300 text-gray-600 cursor-not-allowed'
          } disabled:opacity-50`}
        >
          {loading ? 'Updating...' : 'Smart Update'}
        </button>
        
        <button
          onClick={() => handleManualUpdate(true)}
          disabled={loading}
          className="px-4 py-2 bg-blue-500 text-white rounded font-medium hover:bg-blue-600 disabled:opacity-50"
        >
          {loading ? 'Updating...' : 'Force Update'}
        </button>
        
        <button
          onClick={handleInitialize}
          disabled={loading}
          className="px-4 py-2 bg-green-500 text-white rounded font-medium hover:bg-green-600 disabled:opacity-50"
        >
          {loading ? 'Initializing...' : 'Initialize Database'}
        </button>
        
        <button
          onClick={loadDatabaseInfo}
          disabled={loading}
          className="px-4 py-2 bg-gray-500 text-white rounded font-medium hover:bg-gray-600 disabled:opacity-50"
        >
          {loading ? 'Loading...' : 'Refresh Status'}
        </button>
      </div>

      {/* Update Results */}
      {updateResult && (
        <div className={`p-4 rounded mb-4 ${
          updateResult.success ? 'bg-green-50 border border-green-200' : 'bg-red-50 border border-red-200'
        }`}>
          <div className={`font-semibold ${updateResult.success ? 'text-green-800' : 'text-red-800'}`}>
            {updateResult.success ? '✅ Update Successful' : '❌ Update Failed'}
          </div>
          
          {updateResult.success && updateResult.updated && (
            <div className="mt-2 text-sm space-y-1">
              <div><strong>Changes:</strong> {updateResult.changes?.summary || 'No changes detected'}</div>
              <div><strong>Total Fixtures:</strong> {updateResult.database?.metadata?.totalFixtures}</div>
              <div><strong>Stadium Matches:</strong> {updateResult.database?.metadata?.successRate}%</div>
              
              {/* Show optimization/quota handling info */}
              {updateResult.database?.metadata?.leagueBreakdown && (
                <div className="mt-2">
                  <strong>League Breakdown:</strong>
                  <div className="ml-2 text-xs">
                    {Object.entries(updateResult.database.metadata.leagueBreakdown).map(([league, stats]) => (
                      <div key={league}>
                        {league}: {stats.matched}/{stats.total} ({((stats.matched/stats.total)*100).toFixed(1)}%)
                      </div>
                    ))}
                  </div>
                </div>
              )}
              
              {/* Storage optimization messages */}
              {updateResult.fallback && (
                <div className="mt-2 p-2 bg-yellow-100 border border-yellow-300 rounded text-xs">
                  <strong>⚠️ Storage Limit Reached:</strong><br/>
                  {updateResult.message || 'Saved essential data only due to localStorage quota limits.'}
                </div>
              )}
              
              {updateResult.optimized && !updateResult.fallback && (
                <div className="mt-2 p-2 bg-blue-100 border border-blue-300 rounded text-xs">
                  <strong>🔧 Data Optimized:</strong> Database compressed to {updateResult.sizeInMB}MB to fit storage limits.
                </div>
              )}
              
              {updateResult.backupUrl && (
                <button
                  onClick={downloadBackup}
                  className="mt-2 px-3 py-1 bg-blue-500 text-white text-xs rounded hover:bg-blue-600"
                >
                  📥 Download {updateResult.fallback ? 'Full' : ''} Backup
                </button>
              )}
            </div>
          )}
          
          {updateResult.success && !updateResult.updated && (
            <div className="mt-2 text-sm text-green-700">
              {updateResult.reason}
            </div>
          )}
          
          {!updateResult.success && (
            <div className="mt-2 text-sm text-red-700">
              {updateResult.quota ? (
                <>
                  <strong>Storage Quota Exceeded:</strong><br/>
                  {updateResult.error}
                  {updateResult.backupUrl && (
                    <div className="mt-2">
                      <button
                        onClick={downloadBackup}
                        className="px-3 py-1 bg-blue-500 text-white text-xs rounded hover:bg-blue-600"
                      >
                        📥 Download Database File
                      </button>
                      <div className="text-xs mt-1">You can manually load this file when needed.</div>
                    </div>
                  )}
                </>
              ) : (
                <>Error: {updateResult.error}</>
              )}
            </div>
          )}
        </div>
      )}

      {/* Help Text */}
      <div className="bg-blue-50 border border-blue-200 p-4 rounded text-sm">
        <h4 className="font-semibold text-blue-800 mb-2">How it works:</h4>
        <ul className="space-y-1 text-blue-700">
          <li><strong>Smart Update:</strong> Only updates if database is older than {database?.updateIntervalDays || 7} days</li>
          <li><strong>Force Update:</strong> Always fetches fresh data from API regardless of age</li>
          <li><strong>Initialize:</strong> Sets up the database for first-time use</li>
          <li><strong>Auto-Detection:</strong> Tracks changes in fixtures, scores, dates, and venues</li>
        </ul>
      </div>
    </div>
  );
};

export default DatabaseManager; 