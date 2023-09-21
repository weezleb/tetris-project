// ! Variables
const grid = document.querySelector('.grid');
const pauseText = document.querySelector('.pause-text');
const width = 10;
const height = 20;
const cellCount = width * height;
let cells = [];
let currentShape;
let currentPosition = Math.floor(width / 2) - 1;
let timerId; // rate of fall
let baseInterval = 800;
let interval = baseInterval; //speed control
let deletedRows = 0;
let isPaused = false; // Make sure the game is not paused
let score = 0;
let speedRank = 1;
let maxSpeedRank = Infinity;
let nextShape;
let canSpawnShape = true;

// shapes
const tShape = { indices: [1, width + 1, width * 2 + 1, width + 2], type: 'tShape' };
const zigzagShape = { indices: [width, width + 1, 1, 2], type: 'zigzagShape' };
const lineShape = { indices: [1, width + 1, width * 2 + 1, width * 3 + 1], type: 'lineShape', rotationState: 0 };
const squareShape = { indices: [0, 1, width, width + 1], type: 'squareShape' };
const lShape = { indices: [1, width + 1, width * 2 + 1, width * 2 + 2], type: 'lShape' };
const mirroredZigzagShape = { indices: [width + 1, width + 2, 0, 1], type: 'mirroredZigzagShape', rotationState: 0 };
const mirroredLShape = { indices: [1, width + 1, width * 2 + 1, width * 2], type: 'mirroredLShape' };

const shapes = [tShape, zigzagShape, lineShape, lineShape, lineShape, squareShape, lShape, mirroredZigzagShape, mirroredLShape];


// ! Functions

// Create the grid
function createGrid() {
    for (let i = 0; i < cellCount; i++) {
        const cell = document.createElement('div');
        cell.dataset.index = i;
        grid.appendChild(cell);
        cells.push(cell);
    }
}

// Draw the shape on the grid
function drawShape() {
    currentShape.indices.forEach(index => {
        const cell = cells[currentPosition + index];
        if (cell) {  // Check if cell exists
            cell.classList.add('currentShape');
            cell.classList.add(currentShape.type);
        }
    });
}

// Remove the shape from the grid
function removeShape() {
    currentShape.indices.forEach(index => {
        const cell = cells[currentPosition + index];
        if (cell) {  // Check if cell exists
            cell.classList.remove('currentShape');
            cell.classList.remove(currentShape.type);
        }
    });
}


// Randomly select a shape
function getRandomShape() {
    const randomIndex = Math.floor(Math.random() * shapes.length);
    return shapes[randomIndex];
}

// movement
function handleMovement(event) {
    const key = event.key;
    let newPosition = currentPosition;

    removeShape();

    if (key === 's') {
        newPosition += width;
    } else if (key === 'a') {
        // Only move left if not at LB
        if (!isAtLeftBoundary(currentShape, currentPosition)) {
            newPosition--;
        }
    } else if (key === 'd') {
        // Only move right if not at RB
        if (!isAtRightBoundary(currentShape, currentPosition)) {
            newPosition++;
        }
    } else if (key === 'j') {
        rotateShape();
    } else if (key === 'p') {
        togglePause();
        return;
    }

    // Correct shape
    newPosition = naughtyShape(currentShape, newPosition);

    if (isInBounds(currentShape, newPosition)) {
        currentPosition = newPosition;
    }

    drawShape();
}

//LB function
function isAtLeftBoundary(shape, position) {
    return shape.indices.some(index => {
        const cellIndex = position + index;
        const relativeX = cellIndex % width;
        return relativeX === 0;
    });
}
// RB function
function isAtRightBoundary(shape, position) {
    return shape.indices.some(index => {
        const cellIndex = position + index;
        const relativeX = cellIndex % width;
        return relativeX === width - 1;
    });
}


// Rotate the shape 90 degrees
function rotateShape() {
    const newShape = {
        indices: [],
        type: currentShape.type,
        orientation: currentShape.orientation || null,
        rotationState: (currentShape.rotationState || 0)
    };

    // specific for mean MZZS >:(
    if (currentShape.type === 'mirroredZigzagShape') {
        // first block pivot point
        const pivotIndex = currentShape.indices[0];
        const pivotX = pivotIndex % width;
        const pivotY = Math.floor(pivotIndex / width);

        // rotate around pivot point
        newShape.indices = currentShape.indices.map(index => {
            const x = index % width - pivotX;
            const y = Math.floor(index / width) - pivotY;

            // rotation logic
            const rotatedX = -y;
            const rotatedY = x;

            // translate to the grid
            return (pivotY + rotatedY) * width + (pivotX + rotatedX);
        });
    }
    // specific for stinky LS
    else if (currentShape.type === 'lineShape') {
        console.log("Before Rotation, currentShape.rotationState:", currentShape.rotationState);

        const lineRotations = [
            [1, width + 1, width * 2 + 1, width * 3 + 1], // State 0 (Vertical)
            [0, 1, 2, 3], // State 1 (Horizontal)
        ];

        newShape.indices = lineRotations[currentShape.rotationState || 0];
        newShape.rotationState = ((currentShape.rotationState || 0) + 1) % 2;

        console.log("After Rotation, newShape.rotationState:", newShape.rotationState);
    }

    else {
        pivot = currentShape.indices[1];  // anchor of pivot is the second index

        currentShape.indices.forEach(index => {
            const x = (index % width) - (pivot % width);
            const y = Math.floor(index / width) - Math.floor(pivot / width);

            // Rotate 90 degrees clockwise
            const rotatedX = -y;
            const rotatedY = x;

            const newIndex = pivot + rotatedX + rotatedY * width;
            newShape.indices.push(newIndex);
        });
    }

    if (isInBounds(newShape, currentPosition)) {
        removeShape();
        currentShape.indices = newShape.indices;
        if (newShape.rotationState !== undefined) {
            currentShape.rotationState = newShape.rotationState;
        }
        drawShape();
    }


    else {
        // Try to "kick" the shape into a valid position
        const kickOffsets = [-1, 1, -width, width];
        for (const offset of kickOffsets) {
            if (isInBounds(newShape, currentPosition + offset)) {
                removeShape();
                currentPosition += offset;
                currentShape.indices = newShape.indices;
                if (newShape.rotationState !== undefined) {
                    currentShape.rotationState = newShape.rotationState; // Update the rotation state if it exists
                }
                drawShape();
                break;
            }
        }
    }
}





// Check if shape is in boundaries of grid and other shapes
function isInBounds(shape, position) {
    let isInsideLeftBoundary = true;
    let isInsideRightBoundary = true;

    const isInGridAndNotFull = shape.indices.every(index => {
        const cellIndex = position + index;
        const isInGrid = cellIndex >= 0 && cellIndex < cellCount;
        const isNotFull = !cells[cellIndex]?.classList.contains('full');
        return isInGrid && isNotFull;
    });

    if (isInGridAndNotFull) {
        // Check the boundary conditions
        shape.indices.forEach(index => {
            const cellIndex = position + index;
            const relativeX = cellIndex % width;

            // If any part of shape would be outside LB, set the flag
            if (relativeX < 0) isInsideLeftBoundary = false;

            // If any part of shape would be outside RB, set the flag
            if (relativeX >= width) isInsideRightBoundary = false;
        });
    }

    return isInGridAndNotFull && isInsideLeftBoundary && isInsideRightBoundary;
}

// function to stop the shape being naughty and escaping the boundary
function naughtyShape(shape, position) {
    let minX = Infinity, maxX = -Infinity;
    shape.indices.forEach(index => {
        const cellIndex = position + index;
        const relativeX = cellIndex % width;
        minX = Math.min(minX, relativeX);
        maxX = Math.max(maxX, relativeX);
    });

    if (minX < 0) {
        return position - minX;
    } else if (maxX >= width) {
        return position - (maxX - width + 1);
    }
    return position;
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

    // Log the rows to delete
    console.log("Rows to Delete:", rowsToDelete);

    // Sort rows in descending order
    rowsToDelete.sort((a, b) => b - a);

    // Delete multiple rows at once
    rowsToDelete.forEach(y => {
        console.log("Deleting row:", y); // Log the row being deleted

        // Remove 'full' and clear className
        const row = Array.from({ length: width }, (_, x) => y * width + x);
        row.forEach(index => {
            cells[index].classList.remove('full');
            cells[index].className = '';
        });

        // Debug log
        console.log("Deleted row", y);

        // Move all rows above the deleted ones down
        for (let aboveY = y - 1; aboveY >= 0; aboveY--) {
            const aboveRow = Array.from({ length: width }, (_, x) => aboveY * width + x);
            aboveRow.forEach(index => {
                if (cells[index].classList.contains('full')) {
                    cells[index + width].className = cells[index].className;  // Update this line
                    cells[index + width].classList.add('full');  // Update this line
                    cells[index].classList.remove('full');
                    cells[index].className = '';
                }
            });
        }
    });

    // Update the score
    scoreCal(rowsToDelete.length);
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
        // Shape has landed
        currentShape.indices.forEach(index => {
            const cell = cells[currentPosition + index];
            cell.classList.add('full');
            cell.classList.add(currentShape.type);
        });

        // Only spawn a new shape if it's okay to do so
        if (canSpawnShape) {
            canSpawnShape = false;

            // Delete rows BEFORE checking if the game is over
            deleteRow();

            // Check if game over
            if (isGameOver()) {
                return;
            }

            // Generate a new shape
            currentShape = nextShape;
            nextShape = getRandomShape();
            currentPosition = Math.floor(width / 2);
            canSpawnShape = true;  // allow new shape spawn
        }
    }

    drawShape();
    document.querySelector('.next-shape').innerText = `Next Shape: ${nextShape.type}`;
}



// game over
function isGameOver() {
    // Check the TL corner
    const topLeftCorner = [0, 1, width, width + 1];
    const topLeftFull = topLeftCorner.some(index => cells[index]?.classList.contains('full'));

    // check AFTER landing if in top row
    const shapeInTopRow = currentShape.indices.some(index => (currentPosition + index) < width);

    if (topLeftFull || shapeInTopRow) {
        clearInterval(timerId);
        if (confirm('Game Over. Click OK to restart.')) {
            restartGame();
        }
        return true;
    }
    return false;
}


// Scoring function
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

// Toggle pause
function togglePause() {
    if (isPaused) {
        pauseText.style.display = 'none'; // hide
    } else {
        pauseText.style.display = 'block'; // show
    }
    isPaused = !isPaused;
}

// Start game
function startGame() {
    nextShape = getRandomShape();  // nextShape first
    currentPosition = Math.floor(width / 2);
    currentShape = getRandomShape();
    drawShape();
    document.querySelector('.speed-rank').innerText = `Speed Rank: ${speedRank}`;
    document.querySelector('.next-shape').innerText = `Next Shape: ${nextShape.type}`;
    clearInterval(timerId);  // Clear any existing interval
    timerId = setInterval(moveDown, interval);  // Set a new interval
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

// ! Remaining buttons and event listeners

const restartButton = document.querySelector('.restart');
restartButton.addEventListener('click', () => {
    restartGame();
    togglePause();
});

// Main game loop

document.addEventListener('keydown', handleMovement);
window.addEventListener('DOMContentLoaded', () => {
    createGrid();
    startGame(); // start the game when DOM fully loaded
    // score
    document.querySelector('.score').innerText = `Score: ${score}`;
    //SR
    document.querySelector('.speed-rank').innerText = `Speed Rank: ${speedRank}`;
    // NS
    document.querySelector('.next-shape').innerText = `Next Shape: ${nextShape.type}`;
});