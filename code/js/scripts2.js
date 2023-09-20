// ! Variables
const grid = document.querySelector('.grid');
const pauseText = document.querySelector('.pause-text');
const width = 10;
const height = 20;
const cellCount = width * height;
let cells = [];
let currentShape;
let currentPosition = Math.floor(width / 2);
let timerId; // rate of fall
let baseInterval = 2000;
let interval = baseInterval; //speed control
let deletedRows = 0;
let isPaused = false; // Make sure the game is not paused
let score = 0;
let speedRank = 1;  
let maxSpeedRank = Infinity;  
let nextShape;  



// shapes

const tShape = { indices: [1, width + 1, width * 2 + 1, width + 2], type: 'tShape' };
const zigzagShape = { indices: [width, width + 1, 1, 2], type: 'zigzagShape' };
const lineShape = { indices: [1, width + 1, width * 2 + 1, width * 3 + 1], type: 'lineShape' };
const squareShape = { indices: [0, 1, width, width + 1], type: 'squareShape' };
const lShape = { indices: [1, width + 1, width * 2 + 1, width * 2 + 2], type: 'lShape' };
const mirroredZigzagShape = { indices: [width + 1, width + 2, 0, 1], type: 'mirroredZigzagShape' };
const mirroredLShape = { indices: [1, width + 1, width * 2 + 1, width * 2], type: 'mirroredLShape' };

const shapes = [tShape, zigzagShape, lineShape, lineShape, lineShape, squareShape, lShape, mirroredZigzagShape, mirroredLShape];





// ! Functions

// grid
function createGrid() {
    for (let i = 0; i < cellCount; i++) {
        const cell = document.createElement('div');
        cell.dataset.index = i;
        grid.appendChild(cell);
        cells.push(cell);
    }
    // drawShape();
}


// draw shape
function drawShape() {
    currentShape.indices.forEach(index => {
        const cell = cells[currentPosition + index];
        cell.classList.add('currentShape');
        cell.classList.add(currentShape.type);
    });
}


// remove shape
function removeShape() {
    currentShape.indices.forEach(index => {
        const cell = cells[currentPosition + index];
        cell.classList.remove('currentShape');
        cell.classList.remove(currentShape.type);
    });
}

// Random selection of shape
function getRandomShape() {
    const randomIndex = Math.floor(Math.random() * shapes.length);
    return shapes[randomIndex];
}

// movement
function handleMovement(event) {
    console.log("New Position:", newPosition);
console.log("Is In Bounds:", isInBounds(currentShape, newPosition));

    let newPosition = currentPosition;
    const key = event.key;

    removeShape();
    if (key === 's') {
        newPosition += width;
    } else if (key === 'a') {
        newPosition--;
    } else if (key === 'd') {
        newPosition++;
    } else if (key === 'j') {
        rotateShape();
    } else if (key === 'p') {
        togglePause();
        return;
    }

    removeShape();

    if (isInBounds(currentShape, newPosition)) {
        currentPosition = newPosition;
    }

    drawShape();
    console.log("New Position:", newPosition);
console.log("Is In Bounds:", isInBounds(currentShape, newPosition));

}


// rotate shape 90 degrees
function rotateShape() {
    console.log("Old Shape Indices:", currentShape.indices);
console.log("New Shape Indices:", newShape.indices);

    console.log("Before rotation:", currentShape.indices);
    const pivot = currentShape.indices[1]; // anchor of pivot is the second index
    const newShape = { indices: [], type: currentShape.type };

    currentShape.indices.forEach(index => {
        const x = (index % width) - (pivot % width);
        const y = Math.floor(index / width) - Math.floor(pivot / width);

        const rotatedX = -y;
        const rotatedY = x;

        const newIndex = pivot + rotatedX + rotatedY * width;

        newShape.indices.push(newIndex);
    });
    console.log("Old Shape Indices:", currentShape.indices);
console.log("New Shape Indices:", newShape.indices);

}

    // check out of bounds or overlap
    function isInBounds(shape, position) {
        return shape.indices.every(index => {
            const cellIndex = position + index;
            const isInGrid = cellIndex >= 0 && cellIndex < cellCount;
            const isNotFull = !cells[cellIndex]?.classList.contains('full');
            const isInLBoundary = (cellIndex % width) >= (position % width);
            const isInRBoundary = (cellIndex % width) <= (position % width) + (shape.indices.reduce((max, cur) => Math.max(max, cur % width), 0));
            
            return isInGrid && isNotFull && isInLBoundary && isInRBoundary;
        });
    }
    




// make sure shape can rotate within boundaries of grid/other shapes
function isInBounds(shape, position) {
    
    return shape.indices.every(index => {
        const cellIndex = position + index;
        const isInGrid = cellIndex >= 0 && cellIndex < cellCount;
        const isNotFull = !cells[cellIndex]?.classList.contains('full');
        
        // L and R boundaries
        const isInLBoundary = (cellIndex % width) >= (position % width);
        const isInRBoundary = (cellIndex % width) <= (position % width) + (shape.indices.reduce((max, cur) => Math.max(max, cur % width), 0));
        
        console.log("cellIndex:", cellIndex, "isInGrid:", isInGrid, "isNotFull:", isNotFull, "isInLBoundary:", isInLBoundary, "isInRBoundary:", isInRBoundary);
        
        return isInGrid && isNotFull && isInLBoundary && isInRBoundary;
    });
    console.log("cellIndex:", cellIndex, "isInGrid:", isInGrid, "isNotFull:", isNotFull, "isInLBoundary:", isInLBoundary, "isInRBoundary:", isInRBoundary);

}



// row deletion
function deleteRow() {
    let rowsToDelete = [];
    for (let y = height - 1; y >= 0; y--) {
        const row = Array.from({ length: width }, (_, x) => y * width + x);
        if (row.every(index => cells[index].classList.contains('full'))) {
            rowsToDelete.push(y);
        }
    }
    // delete multiple rows at once
    rowsToDelete.forEach(y => {
        const row = Array.from({ length: width }, (_, x) => y * width + x);
        row.forEach(index => {
            cells[index].classList.remove('full');
            cells[index].className = '';
        });
    });
    // move all rows above the deleted ones down
    rowsToDelete.forEach(y => {
        for (let aboveY = y - 1; aboveY >= 0; aboveY--) {
            const aboveRow = Array.from({ length: width }, (_, x) => aboveY * width + x);
            aboveRow.forEach(index => {
                if (cells[index].classList.contains('full')) {
                    cells[index + width].classList.add('full');
                    cells[index + width].className = cells[index].className;
                    cells[index].classList.remove('full');
                    cells[index].className = '';
                }
            });
        }
    });
    // Update the score
    scoreCal(rowsToDelete.length);
    console.log("Rows to delete:", rowsToDelete);
    deletedRows += rowsToDelete.length;
    speedRank = Math.min(Math.floor(deletedRows / 10) + 1, maxSpeedRank);
    interval = baseInterval / speedRank;
    clearInterval(timerId);
    timerId = setInterval(moveDown, interval);
    document.querySelector('.speed-rank').innerText = `Speed Rank: ${speedRank}`;
}

// move down
function moveDown() {
    if (isPaused) return;
    removeShape();
    let newPosition = currentPosition + width;

    if (isInBounds(currentShape, newPosition)) {
        currentPosition = newPosition;
    } else {
        // shape has landed, mark it as 'full'
        currentShape.indices.forEach(index => {
            const cell = cells[currentPosition + index];
            cell.classList.add('full');
            cell.classList.add(currentShape.type); // Add the shape type class for color
        });

        // delete rows BEFORE checking if the game is over
        deleteRow();

        // Check if game over
        if (isGameOver()) {
            return;
        }

        // generate a new shape
        currentShape = nextShape;
        nextShape = getRandomShape();
        currentPosition = Math.floor(width / 2);
        drawShape();
    }

    drawShape();
    document.querySelector('.next-shape').innerText = `Next Shape: ${nextShape.type}`;
}



// game over 
function isGameOver() {
    console.log("Top Row Full Cells:", topRows.filter(index => cells[index].classList.contains('full')));
    const topRows = Array.from({ length: width }, (_, i) => i);
    if (topRows.some(index => cells[index]?.classList.contains('full'))) {
        clearInterval(timerId);
        if (confirm('Game Over. Click OK to restart.')) {
            restartGame();
        }
        return true;
    }
    return false;
}


function scoreCal(rowsDeleted) {
    // scoring based on google 
    if (rowsDeleted === 1) {
        score += 100;
    } else if (rowsDeleted === 2) {
        score += 300;
    } else if (rowsDeleted === 3) {
        score += 500;
    } else if (rowsDeleted >= 4) {
        score += 800 + (rowsDeleted - 4) * 400;
    }
    document.querySelector('.score').innerText = `Score: ${score}`;
}




// sound







// Toggle pause
function togglePause() {
    //console.log("Clearing interval");
    //clearInterval(timerId);  // clear existing timer

    if (isPaused) {
        //console.log("Setting interval");
        //timerId = setInterval(moveDown, interval);  // Set new timer
        pauseText.style.display = 'none'; // hide
    } else {
        pauseText.style.display = 'block'; // show
    }
    isPaused = !isPaused;
}

// start game
function startGame() {
    currentPosition = Math.floor(width / 2);
    currentShape = getRandomShape();
    nextShape = getRandomShape();
    drawShape();
    timerId = setInterval(moveDown, interval);
    document.querySelector('.speed-rank').innerText = `Speed Rank: ${speedRank}`;
    document.querySelector('.next-shape').innerText = `Next Shape: ${nextShape.type}`;
}


// Reset score function
function resetScore() {
    score = 0;
    document.querySelector('.score').innerText = `Score: ${score}`;
}
// Restart Game
function restartGame() {
    clearInterval(timerId);
    interval = baseInterval;
    cells.forEach(cell => {
        cell.classList.remove('full');
        cell.className = '';
    });
    resetScore();
    startGame();
}



// ! buttons

// pause

// sound button

// play again

// controls

currentShape = getRandomShape() // make random shape

document.addEventListener('keydown', handleMovement);
window.addEventListener('DOMContentLoaded', () => {
    createGrid();
    startGame(); // start  game when DOM fully loaded
    //score
    document.querySelector('.score').innerText = `Score: ${score}`;
    document.querySelector('.speed-rank').innerText = `Speed Rank: ${speedRank}`;
    document.querySelector('.next-shape').innerText = `Next Shape: ${nextShape.type}`;
});

const restartButton = document.querySelector('.restart');
restartButton.addEventListener('click', () => {
    restartGame();
    togglePause();
});

