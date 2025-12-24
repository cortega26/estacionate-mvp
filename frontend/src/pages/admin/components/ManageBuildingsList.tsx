import { useState } from 'react';

interface Building {
    id: string;
    name: string;
    salesRepId?: string;
    salesRepCommissionRate?: number;
    salesRep?: { id: string; email: string };
}

interface User {
    id: string;
    email: string;
}

interface UpdateBuildingInput {
    buildingId: string;
    salesRepId: string | null;
    commissionRate: number;
}

interface ManageRepProps {
    rep: User;
    assignedBuildings: Building[];
    allBuildings: Building[];
    onUpdate: (data: UpdateBuildingInput) => void;
}

interface BuildingRowProps {
    building: Building;
    onUpdate: (data: UpdateBuildingInput) => void;
    repId: string;
}

export const ManageRepBuildings = ({ rep, assignedBuildings, allBuildings, onUpdate }: ManageRepProps) => {
    const [selectedBuildingId, setSelectedBuildingId] = useState('');
    const [commissionRate, setCommissionRate] = useState(0.05);

    const handleAssign = () => {
        if (!selectedBuildingId) return;
        onUpdate({
            buildingId: selectedBuildingId,
            salesRepId: rep.id,
            commissionRate: commissionRate
        });
        setSelectedBuildingId('');
    };

    return (
        <div className="space-y-4">
            <h3 className="font-semibold text-gray-700">Managed Buildings for {rep.email}</h3>

            <div className="flex items-end gap-2 bg-white p-3 rounded border">
                <div className="flex-1">
                    <label className="block text-xs text-gray-500 mb-1">Assign Building</label>
                    <select
                        className="w-full border rounded p-1 text-sm"
                        value={selectedBuildingId}
                        onChange={(e) => setSelectedBuildingId(e.target.value)}
                    >
                        <option value="">Select Building...</option>
                        {allBuildings
                            .filter((b: Building) => b.salesRepId !== rep.id)
                            .map((b: Building) => (
                                <option key={b.id} value={b.id}>
                                    {b.name} {b.salesRepId ? '(Has other rep)' : ''}
                                </option>
                            ))}
                    </select>
                </div>
                <div>
                    <label className="block text-xs text-gray-500 mb-1">Comm. Rate (0-1)</label>
                    <input
                        type="number"
                        step="0.01"
                        className="w-24 border rounded p-1 text-sm"
                        value={commissionRate}
                        onChange={e => setCommissionRate(parseFloat(e.target.value))}
                    />
                </div>
                <button
                    onClick={handleAssign}
                    disabled={!selectedBuildingId}
                    className="bg-green-600 text-white px-3 py-1 rounded text-sm hover:bg-green-700 disabled:opacity-50"
                >
                    Assign
                </button>
            </div>

            <div className="border rounded overflow-hidden">
                <table className="min-w-full divide-y divide-gray-200">
                    <thead className="bg-gray-100">
                        <tr>
                            <th className="px-4 py-2 text-left text-xs font-semibold text-gray-600">Building Name</th>
                            <th className="px-4 py-2 text-left text-xs font-semibold text-gray-600">Commission Rate</th>
                            <th className="px-4 py-2 text-right text-xs font-semibold text-gray-600">Actions</th>
                        </tr>
                    </thead>
                    <tbody className="bg-white divide-y divide-gray-200">
                        {assignedBuildings.map((b: Building) => (
                            <BuildingRow key={b.id} building={b} onUpdate={onUpdate} repId={rep.id} />
                        ))}
                        {assignedBuildings.length === 0 && (
                            <tr>
                                <td colSpan={3} className="px-4 py-2 text-sm text-gray-500 text-center">No buildings assigned.</td>
                            </tr>
                        )}
                    </tbody>
                </table>
            </div>
        </div>
    );
};

const BuildingRow = ({ building, onUpdate, repId }: BuildingRowProps) => {
    const [isEditing, setIsEditing] = useState(false);
    const [rate, setRate] = useState(building.salesRepCommissionRate || 0.05);

    const handleSave = () => {
        onUpdate({
            buildingId: building.id,
            salesRepId: repId,
            commissionRate: rate
        });
        setIsEditing(false);
    };

    const handleRemove = () => {
        if (!confirm('Remove Rep from this building?')) return;
        onUpdate({
            buildingId: building.id,
            salesRepId: null,
            commissionRate: 0.05
        });
    };

    return (
        <tr>
            <td className="px-4 py-2 text-sm text-gray-900">{building.name}</td>
            <td className="px-4 py-2 text-sm text-gray-900">
                {isEditing ? (
                    <input
                        type="number"
                        step="0.01"
                        className="w-20 border rounded p-1"
                        value={rate}
                        onChange={e => setRate(parseFloat(e.target.value))}
                    />
                ) : (
                    <span>{(building.salesRepCommissionRate! * 100).toFixed(1)}%</span>
                )}
            </td>
            <td className="px-4 py-2 text-right text-sm space-x-2">
                {isEditing ? (
                    <>
                        <button onClick={handleSave} className="text-green-600 font-medium">Save</button>
                        <button onClick={() => setIsEditing(false)} className="text-gray-500">Cancel</button>
                    </>
                ) : (
                    <>
                        <button onClick={() => setIsEditing(true)} className="text-indigo-600 hover:text-indigo-900">Edit %</button>
                        <button onClick={handleRemove} className="text-red-600 hover:text-red-900 ml-2">Remove</button>
                    </>
                )}
            </td>
        </tr>
    );
};
