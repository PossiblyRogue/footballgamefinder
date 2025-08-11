import React, { useEffect, useRef, useState, memo } from 'react';
import L from 'leaflet';
import 'leaflet/dist/leaflet.css';
import { Maximize2, Minimize2, Settings } from 'lucide-react';
import { geocodeLocation } from '../data/mockData';

// Function to get the pyramid level for each competition
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

const mapStyles = [
  {
    id: 'osm',
    name: 'Classic',
    description: 'OpenStreetMap',
    url: 'https://tile.openstreetmap.org/{z}/{x}/{y}.png',
    attribution: '© <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a>'
  }
];

const MapWidget = ({ location, distance, fixtures = [] }) => {
  const mapRef = useRef(null);
  const mapInstanceRef = useRef(null);
  const [isExpanded, setIsExpanded] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [currentStyle, setCurrentStyle] = useState('osm');
  const [showStylePicker, setShowStylePicker] = useState(false);
  const [mapReady, setMapReady] = useState(false);

  // Force complete remount when location, distance, style, or expanded state changes (not fixtures)
  const mapKey = `map-${isExpanded ? 'expanded' : 'small'}-${location}-${distance}-${currentStyle}`;

  // Separate effect for updating fixtures without remounting map
  useEffect(() => {
    if (!mapInstanceRef.current || !mapReady) {
      return;
    }

    // Add a small delay to ensure map is fully rendered
    const timeoutId = setTimeout(() => {
      if (!mapInstanceRef.current || !mapReady) {
        return;
      }
    
      // Clear ALL existing fixture markers (keep user marker and circle)
      const layersToRemove = [];
      mapInstanceRef.current.eachLayer((layer) => {
        if (layer.options && layer.options.isFixtureMarker) {
          layersToRemove.push(layer);
        }
      });
      
      layersToRemove.forEach(layer => {
        mapInstanceRef.current.removeLayer(layer);
      });
      
      // Only proceed if we have fixtures for current search
      if (fixtures.length === 0) {
        return;
      }
      
      // Add new fixture markers
      const blueIcon = L.icon({
        iconUrl: 'https://raw.githubusercontent.com/pointhi/leaflet-color-markers/master/img/marker-icon-blue.png',
        shadowUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/0.7.7/images/marker-shadow.png',
        iconSize: [25, 41],
        iconAnchor: [12, 41],
        popupAnchor: [1, -34],
        shadowSize: [41, 41]
      });

      const newMarkers = [];

      fixtures.forEach((fixtureData, index) => {
        const { fixture, distance: fixtureDistance } = fixtureData;
        
        if (fixture.stadium?.coordinates) {
          const fixtureCoords = fixture.stadium.coordinates;
          const competitionLevel = getCompetitionLevel(fixture.competition);
          const competitionDisplay = competitionLevel 
            ? `🏆 ${fixture.competition || 'Unknown Competition'} <span style="color: #dc2626; font-weight: bold;">(${competitionLevel})</span>`
            : `🏆 ${fixture.competition || 'Unknown Competition'}`;
          
          // Determine what location info to show (always show postcode if available)
          const getLocationInfo = (stadium) => {
            // First check if there's a postcode in the address
            if (stadium.address) {
              const postcodeMatch = stadium.address.match(/[A-Z]{1,2}[0-9][A-Z0-9]? ?[0-9][A-Z]{2}/i);
              if (postcodeMatch) {
                return { type: 'postcode', value: postcodeMatch[0] };
              }
            }
            
            // If no postcode found, show full address if available
            if (stadium.address) {
              return { type: 'address', value: stadium.address };
            }
            
            // Fallback to coordinates if no address
            if (stadium.coordinates) {
              return { type: 'coordinates', value: stadium.coordinates };
            }
            
            return null;
          };
          
          const locationInfo = getLocationInfo(fixture.stadium);
          
          const popupContent = `
            <div class="fixture-popup">
              <div class="text-lg font-bold text-blue-800 mb-2">
                ${fixture.homeTeam?.name || fixture.home} vs ${fixture.awayTeam?.name || fixture.away}
              </div>
              <div class="text-sm text-gray-600 mb-1">
                📅 ${new Date(fixture.date).toLocaleDateString()} at ${fixture.time}
              </div>
              <div class="text-sm text-gray-600 mb-1">
                🏟️ ${fixture.stadium.name || 'Unknown Stadium Name'}
              </div>
              ${locationInfo ? `
                <div class="text-xs text-gray-500 mb-1">
                  📍 ${locationInfo.type === 'postcode' ? locationInfo.value : 
                      locationInfo.type === 'address' ? locationInfo.value :
                      `${locationInfo.value.lat.toFixed(4)}, ${locationInfo.value.lng.toFixed(4)}`}
                </div>
              ` : ''}
              ${fixture.stadium.capacity ? `
                <div class="text-xs text-gray-500 mb-1">
                  👥 Capacity: ${fixture.stadium.capacity.toLocaleString()}
                </div>
              ` : ''}
              ${fixtureDistance !== null ? `
                <div class="text-sm font-medium text-green-600">
                  📏 ${fixtureDistance.toFixed(1)} km away
                </div>
              ` : ''}
              <div class="text-xs text-blue-600 mt-2">
                ${competitionDisplay}
              </div>
            </div>
          `;
          
          const fixtureMarker = L.marker([fixtureCoords.lat, fixtureCoords.lng], { 
            icon: blueIcon,
            isFixtureMarker: true // Flag to identify fixture markers
          })
            .addTo(mapInstanceRef.current)
            .bindPopup(popupContent, {
              maxWidth: 300,
              className: 'fixture-popup-container'
            });
          
          newMarkers.push(fixtureMarker);
          
          // Add hover effects
          fixtureMarker.on('mouseover', function() {
            this.openPopup();
          });
        }
      });
      
      // After adding all markers, extend the map view to include all fixtures
      if (newMarkers.length > 0) {
        // Get all coordinates including user location and new fixtures
        const userCoords = mapInstanceRef.current.getCenter();
        const allCoords = [
          [userCoords.lat, userCoords.lng],
          ...newMarkers.map(marker => {
            const latlng = marker.getLatLng();
            return [latlng.lat, latlng.lng];
          })
        ];
        
        // Create bounds that include all markers
        const bounds = L.latLngBounds(allCoords);
        
        // Fit map to show all markers with padding
        setTimeout(() => {
          if (mapInstanceRef.current) {
            mapInstanceRef.current.fitBounds(bounds, { 
              padding: [50, 50],
              maxZoom: 12 // Don't zoom in too close
            });
          }
        }, 100);
      }
    }, 300); // Longer delay to ensure everything is ready

    return () => clearTimeout(timeoutId);
  }, [fixtures, mapReady, location]); // Added location to dependencies

  useEffect(() => {
    const initializeMap = async () => {
      if (!mapRef.current) return;

      setIsLoading(true);
      setMapReady(false); // Reset map ready state when reinitializing

      // Clean up any existing map first
      if (mapInstanceRef.current) {
        mapInstanceRef.current.remove();
        mapInstanceRef.current = null;
      }

      try {
        // Initialize fresh map
        mapInstanceRef.current = L.map(mapRef.current, {
          scrollWheelZoom: isExpanded,
          doubleClickZoom: isExpanded,
          dragging: isExpanded,
          zoomControl: isExpanded
        });

        // Get the selected map style
        const selectedStyle = mapStyles.find(style => style.id === currentStyle) || mapStyles[0];
        
        // Add tile layer with selected style
        const tileLayerOptions = {
          attribution: selectedStyle.attribution,
          maxZoom: 19,
          minZoom: 3
        };
        
        if (selectedStyle.subdomains) {
          tileLayerOptions.subdomains = selectedStyle.subdomains;
        }
        
        const tileLayer = L.tileLayer(selectedStyle.url, tileLayerOptions);
        tileLayer.addTo(mapInstanceRef.current);
        
        // Fallback to OpenStreetMap if selected style fails
        tileLayer.on('tileerror', function(error) {
          console.log(`${selectedStyle.name} tile loading error, trying fallback:`, error);
          tileLayer.remove();
          
          const fallbackLayer = L.tileLayer('https://tile.openstreetmap.org/{z}/{x}/{y}.png', {
            attribution: '© <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a>',
            maxZoom: 18,
            minZoom: 3
          });
          
          fallbackLayer.addTo(mapInstanceRef.current);
        });

        // Get coordinates for the current location using real geocoding
        const coords = await geocodeLocation(location);
        
        // Add red marker at user location
        const redIcon = L.icon({
          iconUrl: 'https://raw.githubusercontent.com/pointhi/leaflet-color-markers/master/img/marker-icon-red.png',
          shadowUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/0.7.7/images/marker-shadow.png',
          iconSize: [25, 41],
          iconAnchor: [12, 41],
          popupAnchor: [1, -34],
          shadowSize: [41, 41]
        });

        const userMarker = L.marker([coords.lat, coords.lng], { icon: redIcon })
          .addTo(mapInstanceRef.current)
          .bindPopup(`📍 Your Location: ${location || 'Default Location'}<br/>Search radius: ${distance} km`);

        // Add red circle showing search radius
        const radiusInMeters = distance * 1000; // Convert km to meters
        const circle = L.circle([coords.lat, coords.lng], {
          color: '#dc2626',
          fillColor: '#dc2626',
          fillOpacity: 0.15,
          radius: radiusInMeters
        }).addTo(mapInstanceRef.current);

        // Set view to show the circle properly
        setTimeout(() => {
          try {
            const bounds = circle.getBounds();
            mapInstanceRef.current.fitBounds(bounds, { padding: [20, 20] });
            // Mark map as ready after view is set
            setMapReady(true);
          } catch (error) {
            // Fallback: center on coordinates with appropriate zoom
            mapInstanceRef.current.setView([coords.lat, coords.lng], 10);
            setMapReady(true);
          }
        }, 300);

      } catch (error) {
        console.error('Error initializing map:', error);
        setMapReady(false);
      } finally {
        setIsLoading(false);
      }
    };

    initializeMap();

    // Cleanup function
    return () => {
      setMapReady(false);
      if (mapInstanceRef.current) {
        mapInstanceRef.current.remove();
        mapInstanceRef.current = null;
      }
    };
  }, [location, distance, isExpanded, currentStyle]);

  const toggleExpanded = () => {
    setIsExpanded(!isExpanded);
  };

  const handleStyleChange = (styleId) => {
    setCurrentStyle(styleId);
    setShowStylePicker(false);
  };

  // Close style picker when clicking outside
  useEffect(() => {
    const handleClickOutside = (event) => {
      if (showStylePicker && !event.target.closest('.style-picker')) {
        setShowStylePicker(false);
      }
    };

    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, [showStylePicker]);

  return (
    <>
      {/* Overlay when expanded */}
      {isExpanded && (
        <div 
          className="fixed inset-0 bg-black bg-opacity-50 z-40"
          onClick={toggleExpanded}
        />
      )}
      
      <div className={`bg-white rounded-lg shadow-lg transition-all duration-300 ${
        isExpanded ? 'fixed inset-4 z-50' : 'relative'
      }`}>
        <div className="flex items-center justify-between p-4 border-b border-gray-200">
          <h3 className="text-lg font-semibold text-gray-800">Search Area</h3>
          <div className="flex items-center space-x-2">
            {isLoading && (
              <div className="w-5 h-5 border-2 border-green-500 border-t-transparent rounded-full animate-spin"></div>
            )}
            
            {/* Map Style Picker */}
            <div className="relative style-picker">
              <button
                onClick={() => setShowStylePicker(!showStylePicker)}
                className="p-2 hover:bg-gray-100 rounded-full transition-colors"
                title="Change map style"
              >
                <Settings className="w-5 h-5 text-gray-600" />
              </button>
              
              {showStylePicker && (
                <div className="absolute right-0 top-full mt-2 w-64 bg-white border border-gray-200 rounded-lg shadow-lg z-50">
                  <div className="p-3">
                    <h4 className="font-medium text-gray-900 mb-2">Map Style</h4>
                    <div className="space-y-2">
                      {mapStyles.map((style) => (
                        <button
                          key={style.id}
                          onClick={() => handleStyleChange(style.id)}
                          className={`w-full text-left p-2 rounded border transition-colors ${
                            currentStyle === style.id
                              ? 'border-blue-500 bg-blue-50'
                              : 'border-gray-200 hover:border-gray-300 hover:bg-gray-50'
                          }`}
                        >
                          <div className="font-medium">{style.name}</div>
                          <div className="text-xs text-gray-500">{style.description}</div>
                        </button>
                      ))}
                    </div>
                  </div>
                </div>
              )}
            </div>
            
            <button
              onClick={toggleExpanded}
              className="p-2 hover:bg-gray-100 rounded-full transition-colors z-50 relative"
              title={isExpanded ? "Minimize map" : "Expand map"}
            >
              {isExpanded ? (
                <Minimize2 className="w-5 h-5 text-gray-600" />
              ) : (
                <Maximize2 className="w-5 h-5 text-gray-600" />
              )}
            </button>
          </div>
        </div>
        
        <div 
          key={mapKey}
          ref={mapRef} 
          className={`${
            isExpanded ? 'h-[calc(100vh-8rem)]' : 'h-48'
          } w-full relative`}
          style={{ cursor: isExpanded ? 'default' : 'pointer' }}
          onClick={!isExpanded ? toggleExpanded : undefined}
        >
          {isLoading && (
            <div className="absolute inset-0 bg-gray-100 flex items-center justify-center z-10">
              <div className="text-gray-600 text-sm">Loading map...</div>
            </div>
          )}
        </div>
        
        {!isExpanded && (
          <div className="p-3 bg-gray-50 text-sm text-gray-600">
            <p><strong>{location || 'Default Location'}</strong></p>
            <p>Within {distance} miles • Click to expand</p>
          </div>
        )}
      </div>
    </>
  );
};

// Memoize component to prevent unnecessary re-renders
export default memo(MapWidget, (prevProps, nextProps) => {
  // Re-render if location, distance, or fixtures changed
  return prevProps.location === nextProps.location && 
         prevProps.distance === nextProps.distance &&
         prevProps.fixtures?.length === nextProps.fixtures?.length;
}); 