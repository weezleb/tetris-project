// ! Firebase
import { initializeApp } from "firebase/app";
import { getFirestore, collection, getDocs, addDoc } from "firebase/firestore";


const firebaseConfig = {
    apiKey: "AIzaSyDhHIajXHYyG-oV8MRTs-b3s8xx3qGCfnI",
    authDomain: "tetrishighscores-e010d.firebaseapp.com",
    projectId: "tetrishighscores-e010d",
    storageBucket: "tetrishighscores-e010d.appspot.com",
    messagingSenderId: "854037572598",
    appId: "1:854037572598:web:4910a05ce559be9e9675d7",
    measurementId: "G-PYQX7LF9CX"
  };

// initialise Firebase
const app = initializeApp(firebaseConfig);
const db = getFirestore();
const highScoresCollection = collection(db, "highScores");
//add firt name and high score
async function addHighScore(firstName, score) {
  await addDoc(highScoresCollection, {
    firstName: firstName,
    score: score,
  });
}
import { query, orderBy, limit } from "firebase/firestore";

async function getTop10HighScores() {
  const highScoresQuery = query(highScoresCollection, orderBy("score", "desc"), limit(10));
  const querySnapshot = await getDocs(highScoresQuery);
  const highScores = [];
  querySnapshot.forEach((doc) => {
    highScores.push(doc.data());
  });
  return highScores;
}





// ! Variables
const grid = document.querySelector('.grid');
const pauseText = document.querySelector('.pause-text');
const bgMusic = document.getElementById('bg-music');
const dropSound = document.getElementById('drop-sound');
const speedRankUpSound = document.getElementById('speed-rank-up-sound');
const gameOverSound = document.getElementById('game-over-sound');
const speedRankElement = document.querySelector('.speed-rank');
const rowDeletionSound = document.getElementById('row-deletion-sound');
const tetrisSound = document.getElementById('tetrisSound');
const gotTetris = document.querySelector('.got-tetris');
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
let isBgMusicOn = true;
let isDropSoundOn = true;
let previousSpeedRank = 1;
let ghostShape;
let ghostPosition;

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
    if (!currentShape) return;
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

function nextShapePreview() {
    if (!nextShape) return;
    const imgElement = document.getElementById('next-shape-img');
    imgElement.src = `assets/${nextShape.type}.png`;
    imgElement.alt = `${nextShape.type} image`;
}

// Update the ghost position
function updateGhostPosition() {
    let tempPosition = currentPosition;
    while (isInBounds(currentShape, tempPosition + width)) {
        tempPosition += width;
    }
    ghostPosition = tempPosition;
}

// Draw the ghost shape
function drawGhostShape() {
    currentShape.indices.forEach(index => {
        const cell = cells[ghostPosition + index];
        if (cell) {  // Check if cell exists
            cell.classList.add('ghostShape');
        }
    });
}

// Remove the ghost shape from the grid
function removeGhostShape() {
    currentShape.indices.forEach(index => {
        const cell = cells[ghostPosition + index];
        if (cell) {  // Check if cell exists
            cell.classList.remove('ghostShape');
        }
    });
}

function hardDrop() {
    let newPosition = currentPosition;
    removeShape();
    while (isInBounds(currentShape, newPosition + width)) {
        newPosition += width;
    }
    currentPosition = newPosition;
    drawShape();

    if (isDropSoundOn) {
        dropSound.currentTime = 0;
        dropSound.play();
    }

    // Mark the shape's cells as "full"
    currentShape.indices.forEach(index => {
        const cell = cells[currentPosition + index];
        if (cell) {  // Check if cell exists before trying to modify it
            cell.classList.add('full');
            cell.classList.add(currentShape.type);
        }
    });

    deleteRow();

    // Update shape and position 
    currentShape = nextShape;
    nextShape = getRandomShape();
    currentPosition = Math.floor(width / 2);

    // Draw new shape and update next shape preview
    drawShape();
    nextShapePreview();
}




// movement
function handleMovement(event) {

    if (!currentShape) return;
    const key = event.key;
    let newPosition = currentPosition;

    removeShape();
    removeGhostShape();

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
    } else if (key === ' ') {
        hardDrop();
        return;
    }


    // Correct shape
    newPosition = naughtyShape(currentShape, newPosition);

    if (isInBounds(currentShape, newPosition)) {
        currentPosition = newPosition;
    }

    drawShape();
    updateGhostPosition();
    updateGhostShape();
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

    // Sort rows in descending order
    rowsToDelete.sort((a, b) => b - a);

    // Add animation and schedule removal
    rowsToDelete.forEach(y => {
        const row = Array.from({ length: width }, (_, x) => y * width + x);
        row.forEach(index => {
            cells[index].classList.add('row-deletion-animation');
        });
    });

    // Handle animation completion, delete rows, and move cells down
    setTimeout(() => {
        // Delete the rows
        rowsToDelete.forEach(y => {
            const row = Array.from({ length: width }, (_, x) => y * width + x);
            row.forEach(index => {
                cells[index].classList.remove('row-deletion-animation', 'full');
                cells[index].className = '';
            });
        });

        // Move above deleted rows down, AFTER all deletions
        if (rowsToDelete.length > 0) {
            for (let aboveY = rowsToDelete[0] - 1; aboveY >= 0; aboveY--) {
                const aboveRow = Array.from({ length: width }, (_, x) => aboveY * width + x);
                const rowsBelow = rowsToDelete.filter(row => row > aboveY).length;
                aboveRow.forEach(index => {
                    if (cells[index].classList.contains('full')) {
                        cells[index + (width * rowsBelow)].className = cells[index].className;
                        cells[index + (width * rowsBelow)].classList.add('full');
                        cells[index].classList.remove('full');
                        cells[index].className = '';
                    }
                });
            }
        }
        // Update the score
        scoreCal(rowsToDelete.length);
        deletedRows += rowsToDelete.length;
        speedRank = Math.min(Math.floor(deletedRows / 10) + 1, maxSpeedRank);
        interval = baseInterval / speedRank;
        clearInterval(timerId);
        timerId = setInterval(moveDown, interval);
        // row deletion sound
        if (rowsToDelete.length >= 1 && rowsToDelete.length <= 3) {
            rowDeletionSound.currentTime = 0;
            rowDeletionSound.play();
        }
        // Check if 4 rows are deleted at once (Tetris!)
        if (rowsToDelete.length === 4) {
            tetrisSound.currentTime = 0;
            tetrisSound.play();
            gotTetris.style.display = 'block';
            gotTetris.classList.add('tetris-animation');

            // Hide the tetris + remove animation after
            setTimeout(() => {
                gotTetris.style.display = 'none';
                gotTetris.classList.remove('tetris-animation');
            }, 3000);
        }

        // Check if speed rank has increased

        if (speedRank > previousSpeedRank) {
            speedRankUpSound.currentTime = 0;
            speedRankUpSound.play();
            speedRankElement.innerText = `Speed Rank: ${speedRank}`;
            speedRankElement.classList.add('level-up-animation');
            // Speed up  bg music by 10%
            bgMusic.playbackRate += 0.1;
            // Remove the animation class after it completes
            setTimeout(() => {
                speedRankElement.classList.remove('level-up-animation');
            }, 1000);
        }

        // Update the previous speed rank
        previousSpeedRank = speedRank;
    }, 500);
}


function updateGhostShape() {
    // Remove existing ghost shape from the grid
    removeGhostShape();

    // Duplicate the current shape to create a ghost shape
    ghostShape = JSON.parse(JSON.stringify(currentShape));

    // Find the lowest possible position for the ghost shape
    let ghostPosition = currentPosition;
    while (isInBounds(ghostShape, ghostPosition + width)) {
        ghostPosition += width;
    }

    // Draw the ghost shape at that position
    ghostShape.indices.forEach(index => {
        const cell = cells[ghostPosition + index];
        if (cell) {
            cell.classList.add('ghostShape');
        }
    });
}



// move down
function moveDown() {

    if (isPaused) return;
    removeShape();
    removeGhostShape();
    let newPosition = currentPosition + width;

    if (isInBounds(currentShape, newPosition)) {
        currentPosition = newPosition;
    } else {
        // Shape has landed
        // drop sound
        if (isDropSoundOn) {
            dropSound.currentTime = 0;  // Start from the beginning
            dropSound.play();  // Play the sound
        }


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

            nextShapePreview();

            canSpawnShape = true;  // allow new shape spawn
        }
    }

    drawShape();
    updateGhostPosition();
    updateGhostShape();
    document.querySelector('.next-shape-name').innerText = `Next Shape: ${nextShape.type}`;

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
        gameOverSound.currentTime = 0;
        gameOverSound.play();
        if (confirm('Game Over. Click OK to restart.')) {
            restartGame();
        }
        return true;
    }
    return false;
    bgMusic.pause();
    bgMusic.currentTime = 0;
}

async function gameOver(finalScore) {
    document.getElementById("finalScore").innerText = finalScore;
    document.getElementById("gameOverModal").classList.remove("hidden");

    // Prompt for name and add high score
    const firstName = prompt('Enter your first name:');
    if (firstName) {
        await addHighScore(firstName, finalScore);
    }

    // Update the high scores display
    const newHighScores = await getTop10HighScores();
    updateHighScoresDisplay(newHighScores);
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
    document.querySelector('#score').innerText = `Score: ${score}`;
}

// Toggle pause
function togglePause() {
    if (isPaused) {
        pauseText.style.display = 'none'; // hide
        if (isBgMusicOn) {
            bgMusic.play();
        }
    } else {
        pauseText.style.display = 'block'; // show
        bgMusic.pause(); // pause the background music
    }
    isPaused = !isPaused;
}


// Start game
async function startGame() {
    nextShape = getRandomShape(); // Set nextShape first
    nextShapePreview(); // Update the next shape preview immediately
    currentPosition = Math.floor(width / 2);
    currentShape = nextShape; // Set currentShape as nextShape
    nextShape = getRandomShape(); // Get a new nextShape
    nextShapePreview();  // Update the next shape preview again

    drawShape();
    document.querySelector('.speed-rank').innerText = `Speed Rank: ${speedRank}`;
    document.querySelector('.next-shape-name').innerText = `Next Shape: ${nextShape.type}`;
    clearInterval(timerId);  // Clear any existing interval
    timerId = setInterval(moveDown, interval);  // Set a new interval
    if (isBgMusicOn) {
        bgMusic.play();
    }
    const newHighScores = await getTop10HighScores(); 
    updateHighScoresDisplay(newHighScores); 
}

async function initialiseGame() {
    startGame();
    // start the music
    if (isBgMusicOn) {
        bgMusic.play();
    }
    document.getElementById('start-game').style.display = 'none';  // Hide 
    const imgElement = document.getElementById('next-shape-img');
    imgElement.style.display = 'block'; // Show the image
    setInterval(async () => {
        const refreshedHighScores = await getTop10HighScores();
        updateHighScoresDisplay(refreshedHighScores);
    }, 30000);  
}

// Reset score function
function resetScore() {
    score = 0;
    document.querySelector('#score').innerText = `Score: ${score}`;
}

// Restart Game
async function restartGame() {
    clearInterval(timerId);
    interval = baseInterval;
    cells.forEach(cell => {
        cell.classList.remove('full');
        cell.className = '';
    });
    resetScore();
    startGame();
    const newHighScores = await getTop10HighScores();
    updateHighScoresDisplay(newHighScores);
}

function updateHighScoresDisplay(highScores) {
    const highScoreDiv = document.getElementById("highScores");
    highScoreDiv.innerHTML = ""; // Clear previous high scores
    
    highScores.forEach((score) => {
      const scoreElement = document.createElement("p");
      scoreElement.innerText = `${score.firstName}: ${score.score}`;
      highScoreDiv.appendChild(scoreElement);
    });
  }
  
// ! Remaining buttons and event listeners

const restartButton = document.querySelector('.restart');
restartButton.addEventListener('click', () => {
    restartGame();
    togglePause();
});
const toggleBgMusicButton = document.getElementById('toggle-bg-music');
const toggleDropSoundButton = document.getElementById('toggle-sfx');

// Toggle background music
document.getElementById('toggle-bg-music').addEventListener('click', function () {
    if (isBgMusicOn) {
        bgMusic.pause();
        this.textContent = 'Background Music: Off';
    } else {
        bgMusic.play();
        this.textContent = 'Background Music: On';
    }
    isBgMusicOn = !isBgMusicOn;
});

// Toggle sound effects
document.getElementById('toggle-sfx').addEventListener('click', function () {
    if (isDropSoundOn) {
        this.textContent = 'Sound Effects: Off';
        dropSound.pause();  // Pause the sound
        dropSound.currentTime = 0;  // Reset to start
    } else {
        this.textContent = 'Sound Effects: On';
    }
    isDropSoundOn = !isDropSoundOn;
});

// set the volume
gameOverSound.volume = 1.0;
tetrisSound.volume = 1.0;
// Main game loop
document.getElementById('start-game').addEventListener('click', function () {
    initialiseGame();
});
document.addEventListener('keydown', handleMovement);
window.addEventListener('DOMContentLoaded', () => {
    createGrid();
    // score
    document.querySelector('#score').innerText = `Score: ${score}`;
    //SR
    document.querySelector('.speed-rank').innerText = `Speed Rank: ${speedRank}`;
    // NS
    if (nextShape) {
        document.querySelector('.next-shape-name').innerText = `Next Shape: ${nextShape.type}`;
    }
});
window.onload = async () => {
    const initialHighScores = await getTop10HighScores();
    updateHighScoresDisplay(initialHighScores);
    
  };
  