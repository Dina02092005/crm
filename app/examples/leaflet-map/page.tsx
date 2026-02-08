'use client';

import dynamic from 'next/dynamic';
import { Card, CardContent } from '@/components/ui/card';

// Dynamically import the map component with no SSR
const LeafletMapComponent = dynamic(() => import('@/components/leaflet-map-component'), {
    ssr: false,
    loading: () => (
        <Card>
            <CardContent className="pt-6">
                <p>Loading map...</p>
            </CardContent>
        </Card>
    ),
});

export default function LeafletMapExample() {
    return <LeafletMapComponent />;
}
