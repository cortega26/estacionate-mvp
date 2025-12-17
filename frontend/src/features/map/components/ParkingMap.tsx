import React from 'react';
import type { Spot } from '../../../types/app-models';

interface ParkingMapProps {
    spots: Spot[];
    onSelect: (spot: Spot) => void;
    selectedSpotId?: string;
    buildingName?: string;
}

export const ParkingMap: React.FC<ParkingMapProps> = ({ spots, onSelect, selectedSpotId, buildingName }) => {
    // Helper to find spot status
    const getSpotStatus = (spotNumber: string) => {
        const spot = spots.find(s => s.spot?.spotNumber === spotNumber);
        if (!spot) return 'unknown'; // Not in result set (or filtered out)
        if (spot.status !== 'available') return 'unavailable';
        return 'available';
    };

    const getSpot = (spotNumber: string) => spots.find(s => s.spot?.spotNumber === spotNumber);

    const handleSpotClick = (spotNumber: string) => {
        const spot = getSpot(spotNumber);
        if (spot && spot.status === 'available') {
            onSelect(spot);
        }
    };

    // Color logic
    const getFillColor = (spotNumber: string) => {
        const spot = getSpot(spotNumber);
        const status = getSpotStatus(spotNumber);

        if (selectedSpotId && spot?.id === selectedSpotId) return '#3B82F6'; // Blue-500 (Selected)
        if (status === 'available') return '#10B981'; // Green-500
        if (status === 'unavailable') return '#EF4444'; // Red-500
        return '#E5E7EB'; // Gray-200 (Unknown/Inactive)
    };

    const getCursor = (spotNumber: string) => {
        return getSpotStatus(spotNumber) === 'available' ? 'pointer' : 'not-allowed';
    };

    // Layout configuration (Example: 2 rows of 5 for MVP)
    // We assume spots 101-110 top, 111-120 bottom
    const topRow = ['101', '102', '103', '104', '105'];
    const bottomRow = ['106', '107', '108', '109', '110'];

    return (
        <div className="w-full overflow-x-auto bg-gray-50 p-8 rounded-xl border border-gray-200">
            <h3 className="text-center text-lg font-semibold text-gray-700 mb-4">
                Map View: {buildingName || 'Level -1'}
            </h3>

            <svg viewBox="0 0 600 300" className="w-full h-full max-w-2xl mx-auto shadow-sm bg-white rounded-lg">
                {/* Background / Floor */}
                <rect x="0" y="0" width="600" height="300" fill="#F3F4F6" rx="8" />

                {/* Driveway */}
                <rect x="50" y="120" width="500" height="60" fill="#E5E7EB" />
                <text x="300" y="155" textAnchor="middle" fill="#9CA3AF" fontSize="14" fontWeight="bold" letterSpacing="2">DRIVEWAY</text>

                {/* Top Row */}
                {topRow.map((num, i) => (
                    <g key={num} onClick={() => handleSpotClick(num)} style={{ cursor: getCursor(num) }}>
                        <rect
                            x={60 + (i * 100)}
                            y={20}
                            width="80"
                            height="80"
                            fill={getFillColor(num)}
                            stroke="#D1D5DB"
                            strokeWidth="2"
                            rx="4"
                        />
                        <text x={100 + (i * 100)} y={65} textAnchor="middle" fill="white" fontWeight="bold" fontSize="14">
                            {num}
                        </text>
                    </g>
                ))}

                {/* Bottom Row */}
                {bottomRow.map((num, i) => (
                    <g key={num} onClick={() => handleSpotClick(num)} style={{ cursor: getCursor(num) }}>
                        <rect
                            x={60 + (i * 100)}
                            y={200}
                            width="80"
                            height="80"
                            fill={getFillColor(num)}
                            stroke="#D1D5DB"
                            strokeWidth="2"
                            rx="4"
                        />
                        <text x={100 + (i * 100)} y={245} textAnchor="middle" fill="white" fontWeight="bold" fontSize="14">
                            {num}
                        </text>
                    </g>
                ))}

                {/* Legend */}
                <g transform="translate(480, 10)">
                    <circle cx="0" cy="0" r="4" fill="#10B981" />
                    <text x="10" y="4" fontSize="10" fill="#4B5563">Free</text>

                    <circle cx="0" cy="15" r="4" fill="#EF4444" />
                    <text x="10" y="19" fontSize="10" fill="#4B5563">Taken</text>

                    <circle cx="0" cy="30" r="4" fill="#3B82F6" />
                    <text x="10" y="34" fontSize="10" fill="#4B5563">Your Selection</text>
                </g>
            </svg>
            <p className="text-center text-xs text-gray-400 mt-4">
                * Layout is schematic. Actual distances may vary.
            </p>
        </div>
    );
};
