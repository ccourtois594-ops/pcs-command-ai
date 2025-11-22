
import React, { useEffect, useRef, useState } from 'react';
import { EntityType, BaseEntity, Crisis, MapDrawing, SensitiveSite, Room, Material, Intervener } from '../types';
import { MAP_CENTER } from '../constants';
import { TextT } from '@phosphor-icons/react';

// Declare Leaflet global since we are loading it via script tag
declare const L: any;

interface InteractiveMapProps {
  entities: BaseEntity[];
  onEntitySelect: (entity: BaseEntity) => void;
  crisis?: Crisis | null;
  drawings?: MapDrawing[];
  onDrawingsChange?: (drawings: MapDrawing[]) => void;
}

const InteractiveMap: React.FC<InteractiveMapProps> = ({ 
    entities, 
    onEntitySelect, 
    crisis, 
    drawings = [], 
    onDrawingsChange 
}) => {
  const mapContainerRef = useRef<HTMLDivElement>(null);
  const mapInstanceRef = useRef<any>(null);
  const markersRef = useRef<any[]>([]);
  const crisisLayerRef = useRef<any>(null);
  const drawnItemsRef = useRef<any>(null);

  // State for Text Tool
  const [isTextMode, setIsTextMode] = useState(false);

  // Ref to keep track of the latest callback without re-triggering effect
  const onDrawingsChangeRef = useRef(onDrawingsChange);
  useEffect(() => {
      onDrawingsChangeRef.current = onDrawingsChange;
  }, [onDrawingsChange]);

  // Helper to extract data from Leaflet layers
  const serializeDrawings = (featureGroup: any): MapDrawing[] => {
      const results: MapDrawing[] = [];
      featureGroup.eachLayer((layer: any) => {
          const lId = layer._customId || Math.random().toString(36).substr(2, 9);
          layer._customId = lId; // Ensure ID is attached

          let lType: any = 'marker';
          let textContent = undefined;

          if (layer instanceof L.Circle) lType = 'circle';
          else if (layer instanceof L.Rectangle) lType = 'rectangle';
          else if (layer instanceof L.Polygon) lType = 'polygon';
          else if (layer instanceof L.Polyline) lType = 'polyline';
          else if (layer.options && layer.options.className?.includes('custom-text-label')) {
              lType = 'text';
              // Extract text from DivIcon HTML
              const divHtml = layer.getIcon().options.html;
              // Simple parsing to extract text between tags
              const tempDiv = document.createElement('div');
              tempDiv.innerHTML = divHtml;
              textContent = tempDiv.textContent || '';
          }

          // Extract Coordinates based on type
          let latlngs: any;
          if (lType === 'circle' || lType === 'marker' || lType === 'text') {
              latlngs = layer.getLatLng();
          } else {
              latlngs = layer.getLatLngs();
          }

          results.push({
              id: lId,
              layerType: lType,
              latlngs: latlngs,
              options: {
                  color: layer.options.color,
                  radius: lType === 'circle' ? layer.getRadius() : undefined,
                  fillColor: layer.options.fillColor,
                  text: textContent
              }
          });
      });
      return results;
  };

  // Initialize Map
  useEffect(() => {
    if (mapContainerRef.current && !mapInstanceRef.current) {
      
      // --- DEFINITION DES FONDS DE CARTE ---
      const darkLayer = L.tileLayer('https://{s}.basemaps.cartocdn.com/dark_all/{z}/{x}/{y}{r}.png', {
        attribution: '&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors &copy; <a href="https://carto.com/attributions">CARTO</a>',
        subdomains: 'abcd',
        maxZoom: 20
      });

      const lightLayer = L.tileLayer('https://{s}.basemaps.cartocdn.com/light_all/{z}/{x}/{y}{r}.png', {
        attribution: '&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors &copy; <a href="https://carto.com/attributions">CARTO</a>',
        subdomains: 'abcd',
        maxZoom: 20
      });

      const osmLayer = L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', {
        attribution: '&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors',
        maxZoom: 19
      });

      const satelliteLayer = L.tileLayer('https://server.arcgisonline.com/ArcGIS/rest/services/World_Imagery/MapServer/tile/{z}/{y}/{x}', {
        attribution: 'Tiles &copy; Esri &mdash; Source: Esri, i-cubed, USDA, USGS, AEX, GeoEye, Getmapping, Aerogrid, IGN, IGP, UPR-EGP, and the GIS User Community'
      });

      // Create Map
      const map = L.map(mapContainerRef.current, {
        center: [MAP_CENTER.lat, MAP_CENTER.lng],
        zoom: 13,
        zoomControl: false,
        attributionControl: false,
        layers: [darkLayer] // Default layer
      });
      
      // Layer Controls
      const baseMaps = {
          "Sombre (Nuit)": darkLayer,
          "Clair (Jour)": lightLayer,
          "Plan Rues (OSM)": osmLayer,
          "Satellite (Esri)": satelliteLayer
      };

      L.control.layers(baseMaps, null, { position: 'topright' }).addTo(map);
      L.control.zoom({ position: 'bottomright' }).addTo(map);

      // --- DRAWING INIT ---
      const drawnItems = new L.FeatureGroup();
      map.addLayer(drawnItems);
      drawnItemsRef.current = drawnItems;

      // We always initialize Leaflet Draw controls, but we hide/show based on props later if needed
      // actually the prop onDrawingsChange determines if we want editing enabled.
      // Ideally we reconstruct control if this changes, but for now we assume it's static per usage.
      
      if (true) { // We always enable the group, controls depend on props
          const drawControl = new L.Control.Draw({
            edit: {
              featureGroup: drawnItems,
              remove: true,
              edit: {
                  selectedPathOptions: {
                      dashArray: '10, 10',
                      fill: true,
                      fillColor: '#fe57a1',
                      fillOpacity: 0.1,
                      maintainColor: true
                  }
              }
            },
            draw: {
              polygon: {
                allowIntersection: false,
                showArea: true,
                shapeOptions: { color: '#a855f7' }
              },
              rectangle: { shapeOptions: { color: '#22c55e' } },
              circle: { shapeOptions: { color: '#ef4444' } },
              polyline: { shapeOptions: { color: '#3b82f6', weight: 5 } },
              marker: true,
              circlemarker: false
            }
          });
          
          // Only add controls if we are in editing mode (callback provided)
          if (onDrawingsChangeRef.current) {
              map.addControl(drawControl);
          }

          // --- EVENT HANDLERS FOR DRAWING ---
          const handleUpdate = () => {
               // Check if we have a callback ref
               if (!onDrawingsChangeRef.current) return;
               
               const allDrawings = serializeDrawings(drawnItems);
               // Direct call via ref to avoid stale closures in event listeners
               onDrawingsChangeRef.current(allDrawings);
          };

          map.on('draw:created', function (e: any) {
            const layer = e.layer;
            layer._customId = Math.random().toString(36).substr(2, 9);
            drawnItems.addLayer(layer);
            handleUpdate();
          });

          map.on('draw:edited', function () {
             handleUpdate();
          });

          map.on('draw:deleted', function () {
             handleUpdate();
          });
      }

      mapInstanceRef.current = map;
    }

    // Cleanup
    return () => {
        // We don't destroy map to avoid issues with React Strict Mode double mount
    };
  }, []); // Run once

  // --- HANDLE TEXT MODE CLICK ---
  useEffect(() => {
      const map = mapInstanceRef.current;
      if (!map) return;

      const handleMapClick = (e: any) => {
          if (!isTextMode) return;

          const text = prompt("Texte à afficher sur la carte :");
          if (text && text.trim() !== "") {
              // Create Drawing Object for text
              // We rely on the 'useEffect' below to actually render it on the map
              // But since state update is async and we are inside an event listener,
              // we might want to push it to the parent directly.
              
              // However, sticking to the pattern: Parent (Source of Truth) -> Props -> Map
              if (onDrawingsChangeRef.current) {
                  const newId = Math.random().toString(36).substr(2, 9);
                  const newDrawing: MapDrawing = {
                      id: newId,
                      layerType: 'text',
                      latlngs: e.latlng,
                      options: {
                          text: text
                      }
                  };
                  
                  // Get current drawings from the map state via serialization to be safe + new one
                  // OR trust props. But props inside listener might be stale.
                  // Best bet: Serialize current map state + new text.
                  const currentDrawings = serializeDrawings(drawnItemsRef.current);
                  onDrawingsChangeRef.current([...currentDrawings, newDrawing]);
              }
          }
          
          setIsTextMode(false);
          L.DomUtil.removeClass(map.getContainer(), 'leaflet-crosshair');
      };

      if (isTextMode) {
          L.DomUtil.addClass(map.getContainer(), 'leaflet-crosshair');
          map.on('click', handleMapClick);
      } else {
          L.DomUtil.removeClass(map.getContainer(), 'leaflet-crosshair');
          map.off('click', handleMapClick);
      }

      return () => {
          map.off('click', handleMapClick);
      };
  }, [isTextMode]);


  // --- SYNCHRONIZE DRAWINGS FROM PROPS TO MAP ---
  useEffect(() => {
      if (!mapInstanceRef.current || !drawnItemsRef.current) return;

      const drawnItems = drawnItemsRef.current;
      
      // 1. Identify IDs currently on map
      const mapLayersById: Record<string, any> = {};
      drawnItems.eachLayer((l: any) => {
          if (l._customId) mapLayersById[l._customId] = l;
      });

      const propIds = new Set(drawings.map(d => d.id));

      // 2. Remove layers not in props (External deletion)
      Object.keys(mapLayersById).forEach(id => {
          if (!propIds.has(id)) {
              drawnItems.removeLayer(mapLayersById[id]);
          }
      });

      // 3. Add or Update layers
      drawings.forEach(d => {
          const existingLayer = mapLayersById[d.id];

          if (!existingLayer) {
              // CREATE
              let layer: any;
              const opts = { color: d.options.color || '#3388ff', fillColor: d.options.fillColor };
              
              if (d.layerType === 'circle') {
                  layer = L.circle(d.latlngs, { ...opts, radius: d.options.radius });
              } else if (d.layerType === 'rectangle') {
                  layer = L.rectangle(d.latlngs, opts);
              } else if (d.layerType === 'polygon') {
                  layer = L.polygon(d.latlngs, opts);
              } else if (d.layerType === 'polyline') {
                  layer = L.polyline(d.latlngs, opts);
              } else if (d.layerType === 'marker') {
                  layer = L.marker(d.latlngs);
              } else if (d.layerType === 'text' && d.options.text) {
                  // Create Text Label using DivIcon
                  const icon = L.divIcon({
                      className: 'custom-text-label',
                      html: `<div class="bg-slate-900/80 text-white border border-slate-500 px-2 py-1 rounded text-xs font-bold shadow-lg whitespace-nowrap backdrop-blur-sm transform -translate-x-1/2 -translate-y-1/2">${d.options.text}</div>`,
                      iconSize: [null, null] as any,
                  });
                  layer = L.marker(d.latlngs, { icon: icon });
              }

              if (layer) {
                  layer._customId = d.id;
                  drawnItems.addLayer(layer);
              }
          } else {
              // UPDATE
              // We only update geometry/radius to avoid flicker
              if (d.layerType === 'circle') {
                  existingLayer.setLatLng(d.latlngs);
                  if (d.options.radius) existingLayer.setRadius(d.options.radius);
              } else if (d.layerType === 'marker' || d.layerType === 'text') {
                  existingLayer.setLatLng(d.latlngs);
              } else {
                  existingLayer.setLatLngs(d.latlngs);
              }
          }
      });

  }, [drawings]);

  // --- EXISTING LOGIC (Markers, Crisis, Resize) ---
  
  // Handle Crisis Layer
  useEffect(() => {
      if (!mapInstanceRef.current) return;

      // Clear previous crisis layer
      if (crisisLayerRef.current) {
          crisisLayerRef.current.remove();
          crisisLayerRef.current = null;
      }

      if (crisis && crisis.isActive) {
          const color = 
            crisis.level === 'Rouge' ? '#ef4444' : 
            crisis.level === 'Orange' ? '#f97316' : 
            crisis.level === 'Jaune' ? '#eab308' : '#22c55e';

          crisisLayerRef.current = L.circle([crisis.location.lat, crisis.location.lng], {
              color: color,
              fillColor: color,
              fillOpacity: 0.3,
              radius: crisis.radius,
              weight: 2,
              dashArray: '5, 10'
          }).addTo(mapInstanceRef.current);

          mapInstanceRef.current.flyTo([crisis.location.lat, crisis.location.lng], 15);
          
          crisisLayerRef.current.bindPopup(`
            <div class="text-center">
                <strong class="text-red-500 uppercase">ZONE D'IMPACT</strong><br/>
                ${crisis.type}<br/>
                Rayon: ${crisis.radius}m
            </div>
          `).openPopup();
      } else if (crisis && !crisis.isActive) {
          const color = '#94a3b8'; 
          crisisLayerRef.current = L.circle([crisis.location.lat, crisis.location.lng], {
              color: color,
              fillColor: color,
              fillOpacity: 0.1,
              radius: crisis.radius,
              weight: 1,
              dashArray: '2, 5'
          }).addTo(mapInstanceRef.current);
          
           mapInstanceRef.current.setView([crisis.location.lat, crisis.location.lng], 14);
           
           // Add extra context for history
            if (entities.length > 0) {
                 // Just fit bounds if there are entities
                 const bounds = L.latLngBounds([
                     [crisis.location.lat, crisis.location.lng],
                     ...entities.map(e => [e.location.lat, e.location.lng])
                 ]);
                 mapInstanceRef.current.fitBounds(bounds, { padding: [50, 50] });
            }
      }

  }, [crisis, entities]);

  // Update Markers
  useEffect(() => {
    if (!mapInstanceRef.current) return;

    markersRef.current.forEach(marker => marker.remove());
    markersRef.current = [];

    const getColor = (type: EntityType) => {
      switch (type) {
        case EntityType.SITE_SENSIBLE: return '#ef4444';
        case EntityType.INTERVENANT: return '#60a5fa';
        case EntityType.SALLE: return '#4ade80';
        case EntityType.MATERIEL: return '#fbbf24';
        default: return '#94a3b8';
      }
    };

    const getRadius = (type: EntityType) => {
        return type === EntityType.SITE_SENSIBLE ? 10 : 7;
    }

    entities.forEach(entity => {
      const marker = L.circleMarker([entity.location.lat, entity.location.lng], {
        color: getColor(entity.type),
        fillColor: getColor(entity.type),
        fillOpacity: 0.6,
        radius: getRadius(entity.type),
        weight: 2
      }).addTo(mapInstanceRef.current);

      // Build Rich Popup Content
      let details = '';
      if (entity.type === EntityType.SITE_SENSIBLE) {
          const s = entity as SensitiveSite;
          details = `
            <div class="mt-1 space-y-1">
                <div class="flex justify-between"><span class="text-slate-400">Risque:</span> <span class="text-red-400 font-bold">${s.riskLevel}</span></div>
                <div class="flex justify-between"><span class="text-slate-400">Pop:</span> <span class="text-white">${s.population}</span></div>
                <div class="text-slate-400 text-[10px]">Contact: ${s.contactPhone || '-'}</div>
            </div>
          `;
      } else if (entity.type === EntityType.SALLE) {
           const s = entity as Room;
           details = `
             <div class="mt-1 space-y-1">
                <div class="flex justify-between"><span class="text-slate-400">Cap:</span> <span class="text-green-400 font-bold">${s.capacity}</span></div>
                <div class="flex justify-between"><span class="text-slate-400">Occupé:</span> <span class="text-white">${s.isOccupied ? 'Oui' : 'Non'}</span></div>
            </div>
           `;
      } else if (entity.type === EntityType.MATERIEL) {
           const m = entity as Material;
           details = `
             <div class="mt-1 space-y-1">
                <div class="flex justify-between"><span class="text-slate-400">Qté:</span> <span class="text-amber-400 font-bold">${m.quantity}</span></div>
                <div class="text-slate-400 text-[10px]">${m.category}</div>
            </div>
           `;
      } else if (entity.type === EntityType.INTERVENANT) {
           const i = entity as Intervener;
           details = `
             <div class="mt-1 space-y-1">
                <div class="text-blue-400 font-bold text-xs">${i.role}</div>
                <div class="text-slate-400 text-[10px]">${i.phone}</div>
                <div class="text-slate-400 text-[10px]">${i.email}</div>
            </div>
           `;
      }

      const popupContent = `
        <div class="text-slate-200 min-w-[160px] font-sans">
            <strong class="block text-sm font-bold uppercase mb-1 border-b border-slate-600 pb-1">${entity.name}</strong>
            ${details}
            <div class="mt-2 text-[10px] text-slate-500 italic text-center">Cliquez pour détails complets</div>
        </div>
      `;

      marker.bindPopup(popupContent);
      
      marker.on('click', () => {
        onEntitySelect(entity);
      });

      markersRef.current.push(marker);
    });
  }, [entities, onEntitySelect]);

  // Resize fix
  useEffect(() => {
     if (mapInstanceRef.current) {
        setTimeout(() => {
            mapInstanceRef.current.invalidateSize();
        }, 200);
    } 
  });

  return (
    <div className="relative w-full h-full bg-slate-900 rounded-xl overflow-hidden border border-slate-700 shadow-2xl z-0">
      <div ref={mapContainerRef} className="w-full h-full" />
      
      {/* Legend Overlay */}
      <div className="absolute bottom-6 left-6 bg-slate-900/90 backdrop-blur p-4 rounded-lg border border-slate-700 text-xs z-[1000] shadow-xl pointer-events-none">
            <h4 className="font-bold mb-3 text-white uppercase tracking-wider">Légende</h4>
            <div className="space-y-2">
                <div className="flex items-center gap-3">
                    <span className="w-3 h-3 rounded-full bg-red-500 border border-red-400 shadow-[0_0_8px_rgba(239,68,68,0.6)]"></span>
                    <span className="text-slate-300">Site Sensible</span>
                </div>
                <div className="flex items-center gap-3">
                    <span className="w-3 h-3 rounded-full bg-blue-400 border border-blue-300"></span>
                    <span className="text-slate-300">Intervenant</span>
                </div>
                <div className="flex items-center gap-3">
                    <span className="w-3 h-3 rounded-full bg-green-400 border border-green-300"></span>
                    <span className="text-slate-300">Salle</span>
                </div>
                <div className="flex items-center gap-3">
                    <span className="w-3 h-3 rounded-full bg-amber-400 border border-amber-300"></span>
                    <span className="text-slate-300">Matériel</span>
                </div>
                 {crisis && crisis.isActive && (
                    <div className="flex items-center gap-3 mt-2 pt-2 border-t border-slate-700">
                        <span className="w-4 h-4 rounded-full border-2 border-red-500 bg-red-500/20 animate-pulse"></span>
                        <span className="text-red-400 font-bold">Zone Crise</span>
                    </div>
                )}
                {onDrawingsChange && (
                     <div className="flex items-center gap-3 mt-2 pt-2 border-t border-slate-700">
                        <span className="text-purple-400 font-bold flex items-center gap-1">
                            <span className="w-3 h-3 border border-purple-500 bg-purple-500/30"></span>
                            Outils Tactiques
                        </span>
                    </div>
                )}
            </div>
        </div>

        {/* Custom TEXT Tool Button */}
        {onDrawingsChange && (
            <div className="absolute top-[200px] left-[10px] z-[2000]">
                 <button 
                    onClick={(e) => {
                        e.preventDefault();
                        e.stopPropagation();
                        setIsTextMode(!isTextMode);
                    }}
                    className={`w-[34px] h-[34px] rounded bg-[#1e293b] border border-[#334155] text-white flex items-center justify-center hover:bg-[#334155] transition-colors shadow-lg ${isTextMode ? 'bg-blue-600 border-blue-500 text-white' : ''}`}
                    title="Ajouter du texte"
                 >
                     <TextT size={20} weight="bold" />
                 </button>
                 {isTextMode && (
                     <div className="absolute left-10 top-1 bg-slate-900 text-white text-xs px-2 py-1 rounded whitespace-nowrap pointer-events-none border border-slate-700">
                         Cliquez sur la carte
                     </div>
                 )}
            </div>
        )}

    </div>
  );
};

export default InteractiveMap;
