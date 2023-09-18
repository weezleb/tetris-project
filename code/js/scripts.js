// ! Variables
const grid = document.querySelector('.grid');
const width = 10;
const height = 20;
const cellCount = width * height;
let cells = [];
let currentShape;
let currentPosition = Math.floor(width / 2);
let timerId; // rate of fall
let interval = 500; //speed control
let deletedRows = 0;
let isPaused = false; // Make sure the game is not paused

// shapes
const tShape = { indices: [1, width + 1, width * 2 + 1, width + 2], type: 'tShape' };
const zigzagShape = { indices: [width, width + 1, 1, 2], type: 'zigzagShape' };
const lineShape = { indices: [1, width + 1, width * 2 + 1, width * 3 + 1], type: 'lineShape' };
const squareShape = { indices: [0, 1, width, width + 1], type: 'squareShape' };
const lShape = { indices: [1, width + 1, width * 2 + 1, width * 2 + 2], type: 'lShape' };

const shapes = [tShape, zigzagShape, lineShape, squareShape, lShape];




// ! Functions

// grid
function createGrid() {
    for (let i = 0; i < cellCount; i++) {
        console.log(cells.length)
        const cell = document.createElement('div');
        cell.dataset.index = i;
        grid.appendChild(cell);
        cells.push(cell);
    }
    drawShape();
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
currentShape = getRandomShape() // make random shape

// movement
function handleMovement(event) {
    const key = event.key;

    removeShape();
    let newPosition = currentPosition;

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
    }

    if (isInBounds(currentShape, newPosition)) {
        currentPosition = newPosition;
    }

    drawShape();
}


// rotate shape 90 degrees
function rotateShape() {
    const pivot = currentShape.indices[1];
    const newShape = { indices: [], type: currentShape.type };

    currentShape.indices.forEach(index => {
        const x = (index % width) - (pivot % width);
        const y = Math.floor(index / width) - Math.floor(pivot / width);

        const rotatedX = -y;
        const rotatedY = x;

        const newIndex = pivot + rotatedX + rotatedY * width;
        newShape.indices.push(newIndex);
    });

    if (isInBounds(newShape, currentPosition)) {
        currentShape = newShape;
    }
}

// make sure shape can rotate within boundaries of grid/other shapes
function isInBounds(shape, position) {
    console.log("Shape and Indices: ", shape, shape.indices);
    return shape.indices.every(index => {
        const cellIndex = position + index;
        return (
            cellIndex >= 0 &&
            cellIndex < cellCount &&
            !cells[cellIndex].classList.contains('occupied')
        );
    });
}


// move down
function moveDown() {
    removeShape();
    let newPosition = currentPosition + width;
    deleteRow();
    if (isInBounds(currentShape, newPosition)) {
        currentPosition = newPosition;
    } else {
        // shape has landed, mark it as 'occupied'
        currentShape.indices.forEach(index => {
            const cell = cells[currentPosition + index];
            cell.classList.add('occupied');
            cell.classList.add(currentShape.type); // Add the shape type class for color
        });

        // Check for game over condition
        if (currentPosition < width * 3) {
            clearInterval(timerId);
            if (confirm('Game Over. Click OK to restart.')) {
                resetGame(); // Reset the game
            }
            return;
        }

        // generate a new shape
        currentShape = getRandomShape();
        currentPosition = Math.floor(width / 2);
    }

    drawShape();
}


// timer to move the shape down
timerId = setInterval(moveDown, interval)


// sound

// shape stacking

// row deletion
function deleteRow() {
    let rowsToDelete = [];
    for (let y = height - 1; y >= 0; y--) {
      const row = Array.from({ length: width }, (_, x) => y * width + x);
      if (row.every(index => cells[index].classList.contains('occupied'))) {
        rowsToDelete.push(y);
      }
    }
    rowsToDelete.forEach(y => {
      const row = Array.from({ length: width }, (_, x) => y * width + x);
      row.forEach(index => {
        cells[index].classList.remove('occupied');
        cells[index].className = '';
      });
      const cellsAbove = cells.splice(0, y * width);
      cells = cells.concat(cellsAbove);
      cells.forEach(cell => grid.appendChild(cell));
    });
  }

// increase speed after multiple row deletions
function increaseSpeed() {
    if (deletedRows % 10 === 0) {
        interval *= 0.9;
        clearInterval(timerId);
        timerId = setInterval(moveDown, interval);
    }
}

// Toggle pause
function togglePause() {
    if (isPaused) {
        timerId = setInterval(moveDown, interval);
    } else {
        clearInterval(timerId);
    }
    isPaused = !isPaused;
}

// start game
function startGame() {
    currentShape = getRandomShape(); // generate random shape
    drawShape(); // show random shape
    timerId = setInterval(moveDown, interval); // start the timer
}

// Reset Game
function resetGame() {
    cells.forEach(cell => {
      cell.classList.remove('occupied');
      cell.className = '';
    });
    startGame();
  }



// ! buttons

// pause

// sound button

// play again

// controls


document.addEventListener('keydown', handleMovement);
window.addEventListener('DOMContentLoaded', () => {
    console.log("DOM fully loaded");
    createGrid();
    startGame(); // start  game when DOM fully loaded
});
