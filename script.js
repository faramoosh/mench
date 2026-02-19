// ==================== تنظیمات اولیه ====================
const PLAYERS = [
    { id: 0, name: 'قرمز', emoji: '🔴', color: '#ff5252', pieces: [0,1,2,3], positions: [-1,-1,-1,-1], startIndex: 0 },
    { id: 1, name: 'آبی', emoji: '🔵', color: '#4287f5', pieces: [4,5,6,7], positions: [-1,-1,-1,-1], startIndex: 10 },
    { id: 2, name: 'سبز', emoji: '🟢', color: '#4caf50', pieces: [8,9,10,11], positions: [-1,-1,-1,-1], startIndex: 20 },
    { id: 3, name: 'زرد', emoji: '🟡', color: '#ffeb3b', pieces: [12,13,14,15], positions: [-1,-1,-1,-1], startIndex: 30 }
];

// مسیر حرکت (۴۰ خانه اصلی)
const MAIN_PATH = [...Array(40).keys()]; // 0 تا 39

// خانه‌های امن (که مهره نمی‌تونه خورده بشه)
const SAFE_POSITIONS = [0, 8, 13, 21, 26, 34, 39]; // خانه‌های رنگی و شروع

// متغیرهای اصلی
let players = [];
let currentPlayerIndex = 0;
let gameActive = false;
let isMoving = false;
let extraTurn = false; // برای تاس ۶

// ==================== ساخت صفحه منچ ====================
function createBoard() {
    const board = document.getElementById('board');
    board.innerHTML = '';
    board.className = 'board ludo-board';
    
    // ساخت ۱۱x۱۱ خانه (۴۰ خانه اصلی + ۴ منطقه شروع)
    for (let i = 0; i < 121; i++) {
        const cell = document.createElement('div');
        cell.className = 'ludo-cell';
        cell.dataset.index = i;
        
        // تعیین نوع خانه
        if (isMainPath(i)) {
            const pathIndex = getPathIndex(i);
            cell.classList.add(getPathColor(pathIndex));
            if (isSafePosition(pathIndex)) {
                cell.classList.add('safe');
            }
        } else if (isStartArea(i)) {
            const areaColor = getStartAreaColor(i);
            cell.classList.add(`start-${areaColor}`);
        }
        
        board.appendChild(cell);
    }
}

// توابع کمکی برای تشخیص خانه‌ها
function isMainPath(index) {
    // خانه‌های مسیر اصلی (الگوی خاص)
    const mainPathCells = [
        12,13,14,15,16,17,18,19,20,21, // ردیف پایین
        32,43,54,65,76,87,98,109,       // ستون راست
        97,96,95,94,93,92,91,90,89,     // ردیف بالا (برعکس)
        77,66,55,44,33,22,11,            // ستون چپ
        23,24,25,26,27,28,29,30,31       // برگشت به پایین
    ];
    return mainPathCells.includes(index);
}

function getPathIndex(cellIndex) {
    const mapping = {
        12:0, 13:1, 14:2, 15:3, 16:4, 17:5, 18:6, 19:7, 20:8, 21:9,
        32:10, 43:11, 54:12, 65:13, 76:14, 87:15, 98:16, 109:17,
        97:18, 96:19, 95:20, 94:21, 93:22, 92:23, 91:24, 90:25, 89:26,
        77:27, 66:28, 55:29, 44:30, 33:31, 22:32, 11:33,
        23:34, 24:35, 25:36, 26:37, 27:38, 28:39, 29:40, 30:41, 31:42
    };
    return mapping[cellIndex] || -1;
}

function getPathColor(pathIndex) {
    if (pathIndex < 10) return 'red-path';
    if (pathIndex < 20) return 'blue-path';
    if (pathIndex < 30) return 'green-path';
    return 'yellow-path';
}

function isSafePosition(pathIndex) {
    return [0, 8, 13, 21, 26, 34, 39].includes(pathIndex);
}

function isStartArea(index) {
    const startAreas = [0,1,2,3,4,5,6,7,8,9,10]; // منطقه قرمز
    // بقیه مناطق ...
    return index < 11;
}

function getStartAreaColor(index) {
    if (index < 11) return 'red';
    if (index < 22) return 'blue';
    if (index < 33) return 'green';
    return 'yellow';
}

// ==================== شروع بازی جدید ====================
function startNewGame(playerCount = 2) {
    players = [];
    for (let i = 0; i < playerCount; i++) {
        players.push({
            ...PLAYERS[i],
            positions: [-1, -1, -1, -1] // -1 یعنی توی خونه
        });
    }
    
    currentPlayerIndex = 0;
    gameActive = true;
    isMoving = false;
    extraTurn = false;
    
    document.getElementById('playerSelector').style.display = 'none';
    document.getElementById('gameStatus').style.display = 'flex';
    document.getElementById('dice').textContent = '🎲';
    document.getElementById('diceValue').textContent = '-';
    
    updateBoard();
    
    document.getElementById('gameMessage').textContent = 
        `بازی شروع شد! ${players[0].emoji} تاس بنداز.`;
    
    document.getElementById('rollDiceBtn').disabled = false;
}

// ==================== به‌روزرسانی صفحه ====================
function updateBoard() {
    // پاک کردن همه مهره‌ها
    document.querySelectorAll('.piece').forEach(p => p.remove());
    
    // نمایش مهره‌های هر بازیکن
    players.forEach((player, playerIdx) => {
        player.positions.forEach((pos, pieceIdx) => {
            if (pos >= 0 && pos < 40) {
                // مهره در مسیر اصلی
                const cellIndex = getCellIndexFromPath(pos);
                const cell = document.querySelector(`[data-index="${cellIndex}"]`);
                if (cell) {
                    const piece = createPiece(playerIdx, pieceIdx);
                    cell.appendChild(piece);
                }
            } else if (pos === -1) {
                // مهره در خونه (خانه اصلی)
                const startCell = getStartCell(playerIdx, pieceIdx);
                if (startCell) {
                    const piece = createPiece(playerIdx, pieceIdx);
                    startCell.appendChild(piece);
                }
            }
        });
    });
}

function createPiece(playerId, pieceId) {
    const piece = document.createElement('span');
    piece.className = `piece ${getPlayerColor(playerId)}`;
    piece.textContent = pieceId + 1;
    piece.dataset.player = playerId;
    piece.dataset.piece = pieceId;
    return piece;
}

function getPlayerColor(playerId) {
    return ['red', 'blue', 'green', 'yellow'][playerId];
}

// ==================== پرتاب تاس ====================
async function handleRoll() {
    if (!gameActive || isMoving) return;
    
    isMoving = true;
    document.getElementById('rollDiceBtn').disabled = true;
    
    const diceNumber = Math.floor(Math.random() * 6) + 1;
    await animateDice(diceNumber);
    document.getElementById('diceValue').textContent = diceNumber;
    
    // منطق حرکت بر اساس تاس
    await handleMove(diceNumber);
    
    isMoving = false;
    document.getElementById('rollDiceBtn').disabled = false;
}

// ==================== انیمیشن تاس ====================
async function animateDice(finalValue) {
    const diceElement = document.getElementById('dice');
    const diceFaces = ['⚀', '⚁', '⚂', '⚃', '⚄', '⚅'];
    
    for (let i = 0; i < 10; i++) {
        const randomIndex = Math.floor(Math.random() * 6);
        diceElement.textContent = diceFaces[randomIndex];
        await new Promise(r => setTimeout(r, 50));
    }
    
    const diceEmoji = ['1️⃣', '2️⃣', '3️⃣', '4️⃣', '5️⃣', '6️⃣'];
    diceElement.textContent = diceEmoji[finalValue - 1];
}

// ==================== حرکت مهره ====================
async function handleMove(diceNumber) {
    const currentPlayer = players[currentPlayerIndex];
    
    // اگه ۶ اومد، یه مهره می‌تونه از خونه بیاد بیرون
    if (diceNumber === 6) {
        const hasPieceInHome = currentPlayer.positions.some(p => p === -1);
        if (hasPieceInHome) {
            // پیدا کردن اولین مهره در خونه
            const pieceIndex = currentPlayer.positions.findIndex(p => p === -1);
            currentPlayer.positions[pieceIndex] = 0; // بذار روی شروع
            document.getElementById('gameMessage').textContent = 
                `${currentPlayer.emoji} یه مهره وارد بازی شد!`;
            updateBoard();
            extraTurn = true;
            return;
        }
    }
    
    // حرکت مهره‌های داخل بازی
    const activePieces = currentPlayer.positions
        .map((pos, idx) => ({ pos, idx }))
        .filter(p => p.pos >= 0 && p.pos < 40);
    
    if (activePieces.length === 0) {
        document.getElementById('gameMessage').textContent = 
            `${currentPlayer.emoji} مهره‌ای برای حرکت نداری!`;
        nextTurn();
        return;
    }
    
    // برای سادگی، اولین مهره رو حرکت می‌دیم
    const pieceToMove = activePieces[0];
    let newPos = pieceToMove.pos + diceNumber;
    
    if (newPos >= 40) {
        // رسیدن به خونه آخر
        const overshoot = newPos - 40;
        if (overshoot <= 4) { // ۴ خونه نهایی
            // به خونه‌های نهایی برو
            newPos = 40 + overshoot;
        } else {
            document.getElementById('gameMessage').textContent = 
                `${currentPlayer.emoji} نمی‌تونی این تعداد حرکت کنی!`;
            nextTurn();
            return;
        }
    }
    
    // حرکت تکه‌تکه
    for (let i = pieceToMove.pos + 1; i <= newPos; i++) {
        currentPlayer.positions[pieceToMove.idx] = i;
        updateBoard();
        await new Promise(r => setTimeout(r, 200));
    }
    
    // چک کردن خوردن مهره‌های حریف
    checkAndEat(currentPlayer, pieceToMove.idx, newPos);
    
    // بررسی برد
    if (checkWin(currentPlayer)) {
        document.getElementById('gameMessage').textContent = 
            `🏆 ${currentPlayer.emoji} برنده شد! 🏆`;
        gameActive = false;
        return;
    }
    
    if (diceNumber !== 6) {
        nextTurn();
    } else {
        document.getElementById('gameMessage').textContent = 
            `${currentPlayer.emoji} دوباره تاس بنداز! (۶ آوردی)`;
        extraTurn = true;
    }
}

// ==================== نوبت بعدی ====================
function nextTurn() {
    do {
        currentPlayerIndex = (currentPlayerIndex + 1) % players.length;
    } while (players[currentPlayerIndex].positions.every(p => p >= 40)); // بازیکنایی که بردند رو رد کن
    
    document.getElementById('turnEmoji').textContent = players[currentPlayerIndex].emoji;
    document.getElementById('turnText').textContent = `نوبت بازیکن ${players[currentPlayerIndex].name}`;
    extraTurn = false;
}

// ==================== خوردن مهره حریف ====================
function checkAndEat(currentPlayer, pieceIdx, newPos) {
    if (SAFE_POSITIONS.includes(newPos)) return; // خانه امن
    
    players.forEach((player, idx) => {
        if (idx !== currentPlayerIndex) {
            player.positions.forEach((pos, pIdx) => {
                if (pos === newPos) {
                    player.positions[pIdx] = -1; // برگرد به خونه
                    document.getElementById('gameMessage').textContent = 
                        `🎯 ${currentPlayer.emoji} مهره ${player.emoji} رو خورد!`;
                }
            });
        }
    });
    updateBoard();
}

// ==================== بررسی برد ====================
function checkWin(player) {
    return player.positions.every(p => p >= 40);
}

// ==================== رویدادها ====================
document.addEventListener('DOMContentLoaded', () => {
    createBoard();
    
    document.querySelectorAll('.player-count-btn').forEach(btn => {
        btn.addEventListener('click', (e) => {
            document.querySelectorAll('.player-count-btn').forEach(b => 
                b.classList.remove('active'));
            btn.classList.add('active');
        });
    });
    
    document.getElementById('startGameBtn').addEventListener('click', () => {
        const activeBtn = document.querySelector('.player-count-btn.active');
        const count = parseInt(activeBtn.dataset.count);
        startNewGame(count);
    });
    
    document.getElementById('rollDiceBtn').addEventListener('click', handleRoll);
    
    document.getElementById('board').addEventListener('click', (e) => {
        if (gameActive && !isMoving) {
            handleRoll();
        }
    });
});
