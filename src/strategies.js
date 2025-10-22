// strategies.js

// Chiến lược cho Map 1 (Underwater)
export const STRATEGY_MAP_1 = {
    mapName: "Underwater",
    priorityChests: [
        { row: 3, col: 1 }, { row: 3, col: 2 }, { row: 3, col: 3 }, { row: 3, col: 4 }, { row: 3, col: 5 }, { row: 3, col: 7 }, { row: 3, col: 8 }, { row: 3, col: 9 }, { row: 3, col: 10 }, { row: 3, col: 11 },
        { row: 9, col: 1 }, { row: 9, col: 2 }, { row: 9, col: 3 }, { row: 9, col: 4 }, { row: 9, col: 5 }, { row: 9, col: 7 }, { row: 9, col: 8 }, { row: 9, col: 9 }, { row: 9, col: 10 }, { row: 9, col: 11 },
    ]
};

// Chiến lược cho Map 2 (Forest)
export const STRATEGY_MAP_2 = {
    mapName: "Forest",
    priorityChests: [
        { row: 3, col: 1 }, { row: 3, col: 2 }, { row: 3, col: 3 },
        { row: 3, col: 9 }, { row: 3, col: 10 }, { row: 3, col: 11 },
        { row: 9, col: 1 }, { row: 9, col: 2 }, { row: 9, col: 3 },
        { row: 9, col: 9 }, { row: 9, col: 10 }, { row: 9, col: 11 },
        { row: 6, col: 1 }, { row: 6, col: 2 }, { row: 6, col: 3 }, // Phá vào trung tâm
        { row: 6, col: 9 }, { row: 6, col: 10 }, { row: 6, col: 11 },
    ]
};

// Chiến lược cho Map 3 (Stone)
export const STRATEGY_MAP_3 = {
    mapName: "Stone",
    priorityChests: [
        { row: 3, col: 1 }, { row: 3, col: 2 }, { row: 3, col: 3 }, { row: 3, col: 4 }, { row: 3, col: 5 }, { row: 3, col: 6 }, { row: 3, col: 7 }, { row: 3, col: 8 }, { row: 3, col: 9 }, { row: 3, col: 10 }, { row: 3, col: 11 },
        { row: 9, col: 1 }, { row: 9, col: 2 }, { row: 9, col: 3 }, { row: 9, col: 4 }, { row: 9, col: 5 }, { row: 9, col: 6 }, { row: 9, col: 7 }, { row: 9, col: 8 }, { row: 9, col: 9 }, { row: 9, col: 10 }, { row: 9, col: 11 },
    ]
};