// bot.js
import { io } from "socket.io-client";

// ⭐️ IMPORT MAPS & STRATEGIES
import { 
    FINGERPRINT_1, 
    FINGERPRINT_2, 
    FINGERPRINT_3 
} from './map_templates.js';
import { 
    STRATEGY_MAP_1, 
    STRATEGY_MAP_2, 
    STRATEGY_MAP_3 
} from './strategies.js';

// --- CẤU HÌNH ---
const SOCKET_SERVER_ADDR = "https://zarena-dev2.zinza.com.vn"; // Sửa khi BTC cung cấp
const YOUR_TOKEN = "W3vn7UkP"; // Sửa khi BTC cung cấp

// ⭐️ FLAG MÔI TRƯỜNG: Đặt là 'true' khi thi đấu, 'false' khi luyện tập
const IS_COMPETITION_MODE = false; 

// --- HẰNG SỐ GAME ---
const TILE_SIZE = 40; // Giả định kích thước 1 ô là 40px
const ITEM_TYPES = ['S', 'B', 'R']; // Các loại vật phẩm
const WALL_TYPES = ['W', 'C']; // Các loại tường (Hòm 'C' cũng là tường)

// --- BIẾN TRẠNG THÁI GAME (BỘ NÃO) ---
let gameState = {
    map: [],
    bombers: [],
    bombs: [],
    myUid: null,
    gameHasStarted: false,
    currentStrategy: null // Chiến lược đang áp dụng
};
let gameLogicInterval = null; // Biến kiểm soát vòng lặp
let currentTarget = null; // Trí nhớ: mục tiêu bot đang đi tới

// --- KHỞI TẠO KẾT NỐI ---
console.log("Đang kết nối tới server...");
const socket = io(SOCKET_SERVER_ADDR, {
    auth: {
        token: YOUR_TOKEN
    }
});

// --- CÁC HÀM TIỆN ÍCH & GỬI LỆNH ---

/**
 * Chuyển đổi tọa độ pixel (x, y) sang tọa độ ô (row, col) trên map
 */
function getTileCoordinates(x, y) {
    const row = Math.floor(y / TILE_SIZE);
    const col = Math.floor(x / TILE_SIZE);
    return { row, col };
}

function sendMove(direction) {
    socket.emit("move", { orient: direction });
}

function placeBomb() {
    socket.emit("place_bomb", {});
}

// --- CÁC HÀM TÌM ĐƯỜNG (BFS) ---

/**
 * 1. findPathToNearestTarget: Tìm ITEM ('S','B','R') hoặc ô TRỐNG ('null') gần nhất
 * Dùng để: Nhặt item, hoặc tìm đường thoát hiểm khẩn cấp
 * @returns {object | null} Trả về { row, col, type: 'ITEM' } hoặc { row, col, type: 'NULL' }
 */
function findPathToNearestTarget(start, targetTypes, bombs) {
    const map = gameState.map;
    const numRows = map.length;
    if (numRows === 0) return null;
    const numCols = map[0].length;

    const bombTiles = new Set();
    bombs.forEach(bomb => {
        const { row, col } = getTileCoordinates(bomb.x, bomb.y);
        bombTiles.add(`${row},${col}`);
    });

    const queue = [{ row: start.row, col: start.col, firstMove: null }];
    const visited = new Set([`${start.row},${start.col}`]);
    const directions = [
        { dr: -1, dc: 0, move: 'UP' }, { dr: 1, dc: 0, move: 'DOWN' },
        { dr: 0, dc: -1, move: 'LEFT' }, { dr: 0, dc: 1, move: 'RIGHT' }
    ];

    while (queue.length > 0) {
        const current = queue.shift();
        for (const dir of directions) {
            const newRow = current.row + dir.dr;
            const newCol = current.col + dir.dc;
            const newPosKey = `${newRow},${newCol}`;

            if (newRow < 0 || newRow >= numRows || newCol < 0 || newCol >= numCols || visited.has(newPosKey)) {
                continue;
            }
            const tile = map[newRow][newCol];
            
            if (targetTypes.includes(tile)) {
                return { row: newRow, col: newCol, type: ITEM_TYPES.includes(tile) ? 'ITEM' : 'NULL' }; 
            }
            if (WALL_TYPES.includes(tile) || bombTiles.has(newPosKey)) {
                continue;
            }
            visited.add(newPosKey);
            queue.push({
                row: newRow,
                col: newCol,
                firstMove: current.firstMove || dir.move
            });
        }
    }
    return null;
}

/**
 * 2. findPathToChestAdjacent: Tìm ô TRỐNG cạnh BẤT KỲ hòm 'C' nào gần nhất
 * Dùng để: Chế độ dự phòng (khi không có chiến lược)
 * @returns {object | null} Trả về { row, col, type: 'CHEST_ADJACENT' }
 */
function findPathToChestAdjacent(start, bombs) {
    const map = gameState.map;
    const numRows = map.length;
    if (numRows === 0) return null;
    const numCols = map[0].length;
    
    const bombTiles = new Set();
    bombs.forEach(bomb => {
        const { row, col } = getTileCoordinates(bomb.x, bomb.y);
        bombTiles.add(`${row},${col}`);
    });

    const queue = [{ row: start.row, col: start.col, firstMove: null }];
    const visited = new Set([`${start.row},${start.col}`]);
    const directions = [
        { dr: -1, dc: 0, move: 'UP' }, { dr: 1, dc: 0, move: 'DOWN' },
        { dr: 0, dc: -1, move: 'LEFT' }, { dr: 0, dc: 1, move: 'RIGHT' }
    ];

    while (queue.length > 0) {
        const current = queue.shift();
        for (const dir of directions) {
            const adjRow = current.row + dir.dr;
            const adjCol = current.col + dir.dc;
            
            if (adjRow >= 0 && adjRow < numRows && adjCol >= 0 && adjCol < numCols) {
                if (map[adjRow][adjCol] === 'C') {
                    return { row: current.row, col: current.col, type: 'CHEST_ADJACENT' };
                }
            }
        }
        for (const dir of directions) {
            const newRow = current.row + dir.dr;
            const newCol = current.col + dir.dc;
            const newPosKey = `${newRow},${newCol}`;

            if (newRow < 0 || newRow >= numRows || newCol < 0 || newCol >= numCols || visited.has(newPosKey)) {
                continue;
            }
            const tile = map[newRow][newCol];
            if (bombTiles.has(newPosKey)) {
                continue;
            }
            if (tile === null || ITEM_TYPES.includes(tile)) {
                visited.add(newPosKey);
                queue.push({
                    row: newRow,
                    col: newCol,
                    firstMove: current.firstMove || dir.move
                });
            }
        }
    }
    return null;
}

/**
 * 3. findFirstMoveToTarget: Tìm bước đi ĐẦU TIÊN đến 1 tọa độ ĐÍCH cụ thể
 * Dùng để: Di chuyển bot sau khi đã có mục tiêu (currentTarget)
 * @returns {string | null} Hướng đi ('UP', 'DOWN', 'LEFT', 'RIGHT'), 'STAY', hoặc null
 */
function findFirstMoveToTarget(start, target, bombs) {
    const map = gameState.map;
    const numRows = map.length;
    if (numRows === 0) return null;
    const numCols = map[0].length;

    if (start.row === target.row && start.col === target.col) {
        return 'STAY'; // Đã đến nơi
    }
    
    const bombTiles = new Set();
    bombs.forEach(bomb => {
        const { row, col } = getTileCoordinates(bomb.x, bomb.y);
        bombTiles.add(`${row},${col}`);
    });

    const queue = [{ row: start.row, col: start.col, firstMove: null }];
    const visited = new Set([`${start.row},${start.col}`]);
    const directions = [
        { dr: -1, dc: 0, move: 'UP' }, { dr: 1, dc: 0, move: 'DOWN' },
        { dr: 0, dc: -1, move: 'LEFT' }, { dr: 0, dc: 1, move: 'RIGHT' }
    ];

    while (queue.length > 0) {
        const current = queue.shift();
        for (const dir of directions) {
            const newRow = current.row + dir.dr;
            const newCol = current.col + dir.dc;
            const newPosKey = `${newRow},${newCol}`;

            if (newRow < 0 || newRow >= numRows || newCol < 0 || newCol >= numCols || visited.has(newPosKey)) {
                continue;
            }
            
            if (newRow === target.row && newCol === target.col) {
                return current.firstMove || dir.move;
            }

            const tile = map[newRow][newCol];
            if (WALL_TYPES.includes(tile) || bombTiles.has(newPosKey)) {
                continue;
            }
            visited.add(newPosKey);
            queue.push({
                row: newRow,
                col: newCol,
                firstMove: current.firstMove || dir.move
            });
        }
    }
    return null; // Không tìm thấy đường
}

/**
 * 4. findPathToAdjacentTile: Tìm ô TRỐNG/ITEM cạnh 1 hòm MỤC TIÊU CỤ THỂ
 * Dùng để: Chế độ chiến lược (tìm đường đến hòm ưu tiên)
 * @returns {object | null} Trả về 1 currentTarget (ví dụ: {row: 2, col: 1, type: 'CHEST_ADJACENT'})
 */
function findPathToAdjacentTile(start, targetChestPos, bombs) {
    const map = gameState.map;
    const numRows = map.length;
    if (numRows === 0) return null;
    const numCols = map[0].length;

    const bombTiles = new Set();
    bombs.forEach(bomb => {
        const { row, col } = getTileCoordinates(bomb.x, bomb.y);
        bombTiles.add(`${row},${col}`);
    });

    const validTargetTiles = [];
    const directions = [
        { dr: -1, dc: 0 }, { dr: 1, dc: 0 },
        { dr: 0, dc: -1 }, { dr: 0, dc: 1 }
    ];

    for (const dir of directions) {
        const adjRow = targetChestPos.row + dir.dr;
        const adjCol = targetChestPos.col + dir.dc;
        
        if (adjRow < 0 || adjRow >= numRows || adjCol < 0 || adjCol >= numCols) continue;
        
        const tile = map[adjRow][adjCol];
        if ((tile === null || ITEM_TYPES.includes(tile)) && !bombTiles.has(`${adjRow},${adjCol}`)) {
            validTargetTiles.push({ row: adjRow, col: adjCol, type: 'CHEST_ADJACENT' });
        }
    }

    if (validTargetTiles.length === 0) return null;

    const queue = [{ row: start.row, col: start.col, firstMove: null }];
    const visited = new Set([`${start.row},${start.col}`]);

    while (queue.length > 0) {
        const current = queue.shift();

        for (const target of validTargetTiles) {
            if (current.row === target.row && current.col === target.col) {
                return target;
            }
        }

        for (const dir of directions) {
            const newRow = current.row + dir.dr;
            const newCol = current.col + dir.dc;
            const newPosKey = `${newRow},${newCol}`;

            if (newRow < 0 || newRow >= numRows || newCol < 0 || newCol >= numCols || visited.has(newPosKey)) {
                continue;
            }

            const tile = map[newRow][newCol];
            if (WALL_TYPES.includes(tile) || bombTiles.has(newPosKey)) {
                continue;
            }
            
            visited.add(newPosKey);
            queue.push({
                row: newRow,
                col: newCol,
                firstMove: current.firstMove || dir.move
            });
        }
    }
    return null;
}

// --- VÒNG LẶP LOGIC CHÍNH ---
function runGameLogic() {
    if (!gameState.gameHasStarted) return; 

    const myBot = gameState.bombers.find(b => b.uid === gameState.myUid);
    if (!myBot || !myBot.isAlive) {
        return;
    }
    
    const myPos = getTileCoordinates(myBot.x, myBot.y);

    // ⭐️ ƯU TIÊN 0: THOÁT HIỂM KHẨN CẤP (ĐÃ SỬA LỖI) ⭐️
    let isStandingOnBomb = false;
    for (const bomb of gameState.bombs) {
        const bombPos = getTileCoordinates(bomb.x, bomb.y);
        if (bombPos.row === myPos.row && bombPos.col === myPos.col) {
            isStandingOnBomb = true;
            break;
        }
    }

    if (isStandingOnBomb) {
        // NẾU ĐANG ĐỨNG TRÊN BOM:
        console.log("!!! KHẨN CẤP: ĐANG ĐỨNG TRÊN BOM !!!");
        
        // Chỉ tìm đường thoát mới NẾU mục tiêu hiện tại KHÔNG PHẢI là 'ESCAPE'
        if (!currentTarget || currentTarget.type !== 'ESCAPE') {
            console.log("...Đang tìm đường thoát hiểm MỚI!");
            const escapeTarget = findPathToNearestTarget(myPos, [null], gameState.bombs);
            
            if (escapeTarget) {
                // GÁN MỤC TIÊU THOÁT HIỂM VÀO "TRÍ NHỚ"
                currentTarget = { row: escapeTarget.row, col: escapeTarget.col, type: 'ESCAPE' };
            } else {
                console.log("KHÔNG CÓ LỐI THOÁT KHẨN CẤP!");
                currentTarget = null; // Không có chỗ thoát, chấp nhận số phận
            }
        }
        // ⭐️ BỎ `return` ở đây.
        // Để code "rơi" xuống PHẦN 1, nơi sẽ xử lý di chuyển đến
        // mục tiêu 'ESCAPE' mà chúng ta vừa gán.
    }

    // --- 1. XỬ LÝ MỤC TIÊU HIỆN TẠI (NẾU CÓ) ---
    // (Logic này bây giờ cũng xử lý 'ESCAPE')
    if (currentTarget) {
        const { row, col, type } = currentTarget;
        const tile = (gameState.map[row] && gameState.map[row][col] !== undefined) ? gameState.map[row][col] : null;

        // Kiểm tra xem mục tiêu còn hợp lệ không
        let isTargetValid = false;
        if (type === 'ITEM' && ITEM_TYPES.includes(tile)) {
            isTargetValid = true;
        } else if (type === 'CHEST_ADJACENT' && (tile === null || ITEM_TYPES.includes(tile))) {
            isTargetValid = true; 
        } else if (type === 'ESCAPE' && (tile === null || ITEM_TYPES.includes(tile))) {
            // Mục tiêu thoát hiểm (ô trống) là hợp lệ
            isTargetValid = true;
        }
        
        if (!isTargetValid) {
            console.log("Mục tiêu không còn hợp lệ.");
            currentTarget = null;
        } else {
            // MỤC TIÊU HỢP LỆ, TIẾP TỤC DI CHUYỂN
            const move = findFirstMoveToTarget(myPos, currentTarget, gameState.bombs);

            if (move === 'STAY') {
                // ĐÃ ĐẾN NƠI
                console.log(`ĐÃ ĐẾN MỤC TIÊU: ${type} tại [${row}, ${col}]`);
                if (type === 'CHEST_ADJACENT') {
                    console.log("Hành động: ĐẶT BOM và TÌM ĐƯỜNG THOÁT");
                    placeBomb();
                    
                    // Tìm mục tiêu thoát hiểm mới
                    const escapeTarget = findPathToNearestTarget(myPos, [null], gameState.bombs);
                    if (escapeTarget) {
                        currentTarget = { row: escapeTarget.row, col: escapeTarget.col, type: 'ESCAPE' }; 
                    } else {
                        console.log("BỊ KẸT! Không tìm thấy đường thoát!");
                        currentTarget = null;
                    }
                } else {
                    // Đã nhặt item hoặc đã thoát hiểm an toàn
                    currentTarget = null;
                }
            } else if (move) {
                // VẪN ĐANG DI CHUYỂN (đến item, hòm, hoặc điểm thoát)
                sendMove(move);
            } else {
                console.log("Bị kẹt! Không tìm thấy đường đến mục tiêu.");
                currentTarget = null;
            }
            return; 
        }
    }

    // --- 2. TÌM MỤC TIÊU MỚI (NẾU KHÔNG CÓ) ---
    // (Logic này chỉ chạy khi bot đang an toàn)
    if (!currentTarget) {
        // Ưu tiên 1: Nhặt vật phẩm
        let newTarget = findPathToNearestTarget(myPos, ITEM_TYPES, gameState.bombs);
        if (newTarget) {
            console.log(`Tìm thấy ITEM tại [${newTarget.row}, ${newTarget.col}]`);
            currentTarget = newTarget;
            return;
        }

        // Ưu tiên 2: Phá hòm THEO CHIẾN LƯỢC
        if (gameState.currentStrategy) {
            for (const chestPos of gameState.currentStrategy.priorityChests) {
                if (gameState.map[chestPos.row] && gameState.map[chestPos.row][chestPos.col] === 'C') {
                    newTarget = findPathToAdjacentTile(myPos, chestPos, gameState.bombs);
                    if (newTarget) {
                        console.log(`Chiến lược: Nhắm hòm ưu tiên [${chestPos.row}, ${chestPos.col}]. Di chuyển đến [${newTarget.row}, ${newTarget.col}]`);
                        currentTarget = newTarget; 
                        return;
                    }
                }
            }
            console.log("Đã phá hết hòm ưu tiên. Chuyển sang chế độ cơ bản.");
            gameState.currentStrategy = null; // Chuyển sang chế độ cơ bản
        }

        // Ưu tiên 3: DỰ PHÒNG (Không có chiến lược)
        newTarget = findPathToChestAdjacent(myPos, gameState.bombs);
        if (newTarget) {
            console.log(`Chiến lược (Dự phòng): Tìm thấy ô cạnh HÒM tại [${newTarget.row}, ${newTarget.col}]`);
            currentTarget = newTarget;
            return;
        }
        
        // console.log("Không có mục tiêu. Đứng im.");
    }
}


// --- LẮNG NGHE SỰ KIỆN TỪ SERVER ---

socket.on("connect", () => {
    console.log(`Kết nối thành công! Socket ID: ${socket.id}`);
    console.log("Đang tham gia phòng chơi...");
    socket.emit("join", {}); 
});

socket.on("disconnect", (reason) => {
    console.log(`Bị ngắt kết nối: ${reason}`);
    gameState.gameHasStarted = false;
    if (gameLogicInterval) clearInterval(gameLogicInterval);
    gameLogicInterval = null;
});

socket.on("connect_error", (err) => {
    console.error(`Lỗi kết nối: ${err.message}`);
});

// 2. Nhận thông tin phòng (sau khi join)
socket.on("user", (data) => {
    console.log("Đã tham gia phòng! Nhận dữ liệu game ban đầu.");
    
    // 1. Lưu map "thật" của server
    gameState.map = data.map;
    
    // 2. Lưu thông tin khác
    gameState.bombers = data.bombers;
    gameState.bombs = data.bombs;
    gameState.myUid = socket.id;
    console.log(`UID của tôi: ${gameState.myUid}`);

    // ⭐️ 3. NHẬN DIỆN MAP BẰNG FINGERPRINT ⭐️
    // QUAN TRỌNG: Chạy 1 lần, copy log và dán vào file map_templates.js
    // console.log("FINGERPRINT:", JSON.stringify(data.map));
    
    const serverMapFingerprint = JSON.stringify(data.map);

    if (serverMapFingerprint === FINGERPRINT_1) {
        console.log("NHẬN DIỆN: Map 1 (Underwater). Kích hoạt chiến lược 1.");
        gameState.currentStrategy = { ...STRATEGY_MAP_1 }; // Clone strategy
    } else if (serverMapFingerprint === FINGERPRINT_2) {
        console.log("NHẬN DIỆN: Map 2 (Forest). Kích hoạt chiến lược 2.");
        gameState.currentStrategy = { ...STRATEGY_MAP_2 }; // Clone strategy
    } else if (serverMapFingerprint === FINGERPRINT_3) {
        console.log("NHẬN DIỆN: Map 3 (Stone). Kích hoạt chiến lược 3.");
        gameState.currentStrategy = { ...STRATEGY_MAP_3 }; // Clone strategy
    } else {
        console.log("CẢNH BÁO: Không nhận diện được map! Chạy chế độ cơ bản.");
        gameState.currentStrategy = null;
    }

    // 4. Logic khởi động game
    if (IS_COMPETITION_MODE) {
        console.log("Đang chạy ở MÔI TRƯỜNG THI ĐẤU. Chờ sự kiện 'start'...");
    } else {
        console.log("Đang chạy ở MÔI TRƯỜNG LUYỆN TẬP. Bắt đầu logic ngay.");
        gameState.gameHasStarted = true;
        if (!gameLogicInterval) {
            gameLogicInterval = setInterval(runGameLogic, 3); // 60ms
        }
    }
});

// 3. Game bắt đầu (Môi trường thi đấu)
socket.on("start", (data) => {
    console.log(`--- TRẬN ĐẤU BẮT ĐẦU (lúc ${data.start_at}) ---`); 
    gameState.gameHasStarted = true;
    if (!gameLogicInterval) {
        gameLogicInterval = setInterval(runGameLogic, 3); // 60ms
    }
});

// 4. Game kết thúc (Môi trường thi đấu)
socket.on("finish", (data) => {
    console.log("--- TRẬN ĐẤU KẾT THÚC ---");
    gameState.gameHasStarted = false;
    if (gameLogicInterval) clearInterval(gameLogicInterval);
    gameLogicInterval = null;
    currentTarget = null;
});

// --- CÁC SỰ KIỆN CẬP NHẬT TRẠNG THÁI GAME ---

/**
 * Lắng nghe sự kiện hòm bị phá
 * Cập nhật 'gameState.map' của chúng ta
 */
socket.on("chest_destroyed", (data) => {
    const { row, col } = getTileCoordinates(data.x, data.y);

    if (data.item) {
        console.log(`Map update: Hòm [${row}, ${col}] bị phá, rơi ra ${data.item.type}`);
        gameState.map[row][col] = data.item.type; 
    } else {
        console.log(`Map update: Hòm [${row}, ${col}] bị phá, không có item.`);
        gameState.map[row][col] = null;
    }
});

/**
 * Lắng nghe sự kiện vật phẩm bị nhặt
 * Cập nhật 'gameState.map' của chúng ta
 */
socket.on("item_collected", (data) => {
    const { row, col } = getTileCoordinates(data.item.x, data.item.y);
    console.log(`Map update: Item [${row}, ${col}] đã bị nhặt.`);
    gameState.map[row][col] = null;
    
    if (data.bomber && data.bomber.uid === gameState.myUid) {
        console.log(">>> TÔI ĐÃ NHẶT ĐƯỢC ITEM! <<<");
    }
});

// --- CÁC SỰ KIỆN KHÁC (Cập nhật trạng thái) ---

socket.on("player_move", (data) => {
    const index = gameState.bombers.findIndex(b => b.uid === data.uid);
    if (index !== -1) {
        gameState.bombers[index] = { ...gameState.bombers[index], ...data };
    }
});

socket.on("new_bomb", (data) => {
    gameState.bombs.push(data);
});

socket.on("bomb_explode", (data) => {
    gameState.bombs = gameState.bombs.filter(b => b.id !== data.id);
});

socket.on("user_die_update", (data) => {
    console.log(`Bot ${data.killed.name} đã bị hạ gục bởi ${data.killer.name}`);
    const index = gameState.bombers.findIndex(b => b.uid === data.killed.uid);
    if (index !== -1) {
        gameState.bombers[index].isAlive = false;
    }
});

socket.on("new_life", (data) => {
    console.log(`Bot ${data.name} đã hồi sinh.`);
    const index = gameState.bombers.findIndex(b => b.uid === data.uid);
    if (index !== -1) {
        gameState.bombers[index] = data;
    } else {
        gameState.bombers.push(data);
    }
});