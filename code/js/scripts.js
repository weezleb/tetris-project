// ! Variables
const grid = document.querySelector('.grid')
const width = 10
const height = 20
const cellCount = width * height
let cells = []
let currentShape = []
let currentPosition = Math.floor(width / 2)
let timerId // rate of fall
let interval = 500 //speed control

// shapes
const tShape = [1, width + 1, width * 2 + 1, 2]
const zigzagShape = [width, width + 1, 1, 2]
const lineShape = [1, width + 1, width * 2 + 1, width * 3 + 1]
const squareShape = [0, 1, width, width + 1]
const lShape = [1, width + 1, width * 2 + 1, width * 2 + 2]

const shapes = [tShape, zigzagShape, lineShape, squareShape, lShape]




// ! Functions

// grid
function createGrid() {
    for (let i = 0; i < cellCount; i++) {
        const cell = document.createElement('div')
        cell.dataset.index = i
        cell.style.height = `${100 / height}%`
        cell.style.width = `${100 / width}%`
        grid.appendChild(cell)
        cells.push(cell)
    }
    drawShape()
}

// draw shape
function drawShape() {
    currentShape.forEach(index => {
        cells[currentPosition + index].classList.add('zigzagShape');
        cells[currentPosition + index].classList.add('tShape');
        cells[currentPosition + index].classList.add('squareShape');
        cells[currentPosition + index].classList.add('lShape');
        cells[currentPosition + index].classList.add('lineShape');
    });
}


// remove shape
function removeShape() {
    currentShape.forEach(index => {
        cells[currentPosition + index].classList.remove('zigzagShape');
        cells[currentPosition + index].classList.remove('tShape');
        cells[currentPosition + index].classList.remove('squareShape');
        cells[currentPosition + index].classList.remove('lShape');
        cells[currentPosition + index].classList.remove('lineShape');
    });
}

// Random selection of shape
function getRandomShape() {
    return shapes[Math.floor(Math.random() * shapes.length)]
}
currentShape = getRandomShape() // make random shape

// movement
function handleMovement(event) {
    const key = event.keyCode

    removeShape()
    // down
    if (key === 's') {
        currentPosition += width
    }
    // left
    else if (key === 'a') {
        currentPosition--
    }
    // right
    else if (key === 'd') {
        currentPosition++
    }
    // rotate
    else if (key === 'j') {
        rotateShape()
    }
    drawShape()
}

// rotate shape 90 degrees
function rotateShape() {

}

// move down
function moveDown() {
    removeShape()
    currentPosition += width
    drawShape()
}

// fall
function moveDown() {
    removeShape()
    currentPosition += width
    drawShape()
}

// timer to move the shape down
timerId = setInterval(moveDown, interval)

// ! Event Listeners
document.addEventListener('keydown', handleMovement)
window.addEventListener('DOMContentLoaded', createGrid)
