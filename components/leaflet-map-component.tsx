'use client';

import { MapContainer, TileLayer, Marker, Popup, useMap } from 'react-leaflet';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { useState, useEffect } from 'react';
import L from 'leaflet';
import { FaMapMarkerAlt, FaCar, FaUser } from 'react-icons/fa';

// Fix for default marker icon in Next.js
if (typeof window !== 'undefined') {
    delete (L.Icon.Default.prototype as any)._getIconUrl;
    L.Icon.Default.mergeOptions({
        iconRetinaUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.7.1/images/marker-icon-2x.png',
        iconUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.7.1/images/marker-icon.png',
        shadowUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.7.1/images/marker-shadow.png',
    });
}

// Custom marker icons
const createCustomIcon = (color: string) => {
    return L.divIcon({
        className: 'custom-marker',
        html: `<div style="background-color: ${color}; width: 30px; height: 30px; border-radius: 50%; border: 3px solid white; box-shadow: 0 2px 5px rgba(0,0,0,0.3);"></div>`,
        iconSize: [30, 30],
        iconAnchor: [15, 15],
    });
};

// Sample locations
const locations = [
    { id: 1, name: 'Pickup Location', position: [28.6139, 77.2090] as [number, number], type: 'pickup' },
    { id: 2, name: 'Driver 1', position: [28.6189, 77.2140] as [number, number], type: 'driver' },
    { id: 3, name: 'Driver 2', position: [28.6089, 77.2040] as [number, number], type: 'driver' },
    { id: 4, name: 'Drop Location', position: [28.6239, 77.2190] as [number, number], type: 'dropoff' },
];

// Component to handle map center changes
function ChangeMapView({ center }: { center: [number, number] }) {
    const map = useMap();
    useEffect(() => {
        map.setView(center, map.getZoom());
    }, [center, map]);
    return null;
}

export default function LeafletMapComponent() {
    const [center, setCenter] = useState<[number, number]>([28.6139, 77.2090]);

    return (
        <Card>
            <CardHeader>
                <CardTitle>Leaflet Map Example</CardTitle>
                <CardDescription>
                    Interactive map with markers for taxi tracking
                </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
                {/* Map Controls */}
                <div className="flex gap-2 flex-wrap">
                    {locations.map((location) => (
                        <Button
                            key={location.id}
                            variant="outline"
                            size="sm"
                            onClick={() => setCenter(location.position)}
                        >
                            {location.type === 'pickup' && <FaUser className="mr-2" />}
                            {location.type === 'driver' && <FaCar className="mr-2" />}
                            {location.type === 'dropoff' && <FaMapMarkerAlt className="mr-2" />}
                            {location.name}
                        </Button>
                    ))}
                </div>

                {/* Map Container */}
                <div className="h-[500px] w-full rounded-lg overflow-hidden border">
                    <MapContainer
                        center={center}
                        zoom={13}
                        style={{ height: '100%', width: '100%' }}
                        scrollWheelZoom={true}
                    >
                        <ChangeMapView center={center} />

                        <TileLayer
                            attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors'
                            url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
                        />

                        {locations.map((location) => {
                            const iconColor =
                                location.type === 'pickup' ? '#3b82f6' :
                                    location.type === 'driver' ? '#10b981' :
                                        '#ef4444';

                            return (
                                <Marker
                                    key={location.id}
                                    position={location.position}
                                    icon={createCustomIcon(iconColor)}
                                >
                                    <Popup>
                                        <div className="p-2">
                                            <h3 className="font-semibold">{location.name}</h3>
                                            <p className="text-sm text-muted-foreground">
                                                Type: {location.type}
                                            </p>
                                            <p className="text-xs text-muted-foreground">
                                                Lat: {location.position[0]}, Lng: {location.position[1]}
                                            </p>
                                        </div>
                                    </Popup>
                                </Marker>
                            );
                        })}
                    </MapContainer>
                </div>

                {/* Map Info */}
                <div className="text-sm text-muted-foreground">
                    <p>Click on markers to see details. Use the buttons above to navigate to different locations.</p>
                </div>
            </CardContent>
        </Card>
    );
}
