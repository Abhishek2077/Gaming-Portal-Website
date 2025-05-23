(() => {
  // Game constants
  const canvas = document.getElementById('gameCanvas');
  const ctx = canvas.getContext('2d');
  const rows = 20;
  const cols = 20;
  const cellSize = canvas.width / cols;
  const speedBase = 200;  // base snake speed in ms per move
  const speedStep = 20;   // speed increase per 5 points
  const speedIncreasePoints = 5; // points interval for speed increase

  // Controls elements
  const snakeSkinSelector = document.getElementById('snakeSkinSelector');
  const foodSkinSelector = document.getElementById('foodSkinSelector');
  const pauseResumeBtn = document.getElementById('pauseResumeBtn');
  const statusBar = document.getElementById('status-bar');

  // Game variables
  let snake;
  let food;
  let obstacles;
  let direction;
  let nextDirection; // For buffered inputs to avoid reversal
  let score;
  let speedLevel;
  let gameInterval;
  let gameRunning = false;
  let pauseRequested = false;
  let skins = {
    snake: 'green',
    food: 'red'
  };

  // Save/load keys for localStorage
  const storageKey = 'snake-game-save';

  // Utility - Draw rounded rect
  function drawRoundedRect(x, y, w, h, r, fillStyle, strokeStyle) {
    ctx.beginPath();
    ctx.moveTo(x+r, y);
    ctx.lineTo(x+w-r, y);
    ctx.quadraticCurveTo(x+w, y, x+w, y+r);
    ctx.lineTo(x+w, y+h-r);
    ctx.quadraticCurveTo(x+w, y+h, x+w-r, y+h);
    ctx.lineTo(x+r, y+h);
    ctx.quadraticCurveTo(x, y+h, x, y+h-r);
    ctx.lineTo(x, y+r);
    ctx.quadraticCurveTo(x, y, x+r, y);
    ctx.closePath();
    if (fillStyle) {
      ctx.fillStyle = fillStyle;
      ctx.fill();
    }
    if (strokeStyle) {
      ctx.strokeStyle = strokeStyle;
      ctx.stroke();
    }
  }

  // Generate gradient for snake or food
  function createGradientForRect(x, y, w, h, colors) {
    let gradient = ctx.createLinearGradient(x, y, x+w, y+h);
    const step = 1/(colors.length-1);
    colors.forEach((color, i) => {
      gradient.addColorStop(i*step, color);
    });
    return gradient;
  }

  // Draw snake cell with skins
  function drawSnakeCell(pos, index) {
    const x = pos.x * cellSize;
    const y = pos.y * cellSize;

    switch(skins.snake) {
      case 'green':
        drawRoundedRect(x+2, y+2, cellSize-4, cellSize-4, 4, '#3c9a3c');
        break;
      case 'blue':
        drawRoundedRect(x+2, y+2, cellSize-4, cellSize-4, 4, '#3a8adb');
        break;
      case 'red':
        drawRoundedRect(x+2, y+2, cellSize-4, cellSize-4, 4, '#db3a3a');
        break;
      case 'yellow':
        drawRoundedRect(x+2, y+2, cellSize-4, cellSize-4, 4, '#dbd63a');
        break;
      case 'purple':
        drawRoundedRect(x+2, y+2, cellSize-4, cellSize-4, 4, '#9b3adb');
        break;
      case 'gradient':
        let gradColors = ['#32CD32', '#006400', '#32CD32'];
        let gradient = createGradientForRect(x+2, y+2, cellSize-4, cellSize-4, gradColors);
        drawRoundedRect(x+2, y+2, cellSize-4, cellSize-4, 6, gradient);
        break;
      case 'pattern':
        // Simple diagonal stripes pattern
        ctx.save();
        ctx.beginPath();
        ctx.rect(x+2, y+2, cellSize-4, cellSize-4);
        ctx.clip();
        ctx.fillStyle = '#3c9a3c';
        ctx.fillRect(x+2, y+2, cellSize-4, cellSize-4);
        ctx.strokeStyle = 'rgba(255,255,255,0.3)';
        ctx.lineWidth = 2;
        for(let i = -cellSize; i < cellSize*2; i+=6) {
          ctx.beginPath();
          ctx.moveTo(x+i, y+2);
          ctx.lineTo(x+i-cellSize+4, y+cellSize-2);
          ctx.stroke();
        }
        ctx.restore();
        break;
      default:
        drawRoundedRect(x+2, y+2, cellSize-4, cellSize-4, 4, '#3c9a3c');
    }
  }

  // Draw food cell with skins
  function drawFoodCell(pos) {
    const x = pos.x * cellSize;
    const y = pos.y * cellSize;

    switch(skins.food) {
      case 'red':
        ctx.fillStyle = '#e63946';
        ctx.beginPath();
        ctx.ellipse(x + cellSize/2, y + cellSize/2, cellSize/3, cellSize/3, 0, 0, 2*Math.PI);
        ctx.fill();
        ctx.strokeStyle = '#b22222';
        ctx.lineWidth = 1.5;
        ctx.stroke();
        break;
      case 'lime':
        ctx.fillStyle = '#8fd14f';
        ctx.beginPath();
        ctx.ellipse(x + cellSize/2, y + cellSize/2, cellSize/3, cellSize/3, 0, 0, 2*Math.PI);
        ctx.fill();
        ctx.strokeStyle = '#4a6f1b';
        ctx.lineWidth = 1.5;
        ctx.stroke();
        break;
      case 'orange':
        ctx.fillStyle = '#f77f00';
        ctx.beginPath();
        ctx.ellipse(x + cellSize/2, y + cellSize/2, cellSize/3, cellSize/3, 0, 0, 2*Math.PI);
        ctx.fill();
        ctx.strokeStyle = '#b35400';
        ctx.lineWidth = 1.5;
        ctx.stroke();
        break;
      case 'pink':
        ctx.fillStyle = '#ff6f91';
        ctx.beginPath();
        ctx.ellipse(x + cellSize/2, y + cellSize/2, cellSize/3, cellSize/3, 0, 0, 2*Math.PI);
        ctx.fill();
        ctx.strokeStyle = '#a8445a';
        ctx.lineWidth = 1.5;
        ctx.stroke();
        break;
      case 'cyan':
        ctx.fillStyle = '#00b8cc';
        ctx.beginPath();
        ctx.ellipse(x + cellSize/2, y + cellSize/2, cellSize/3, cellSize/3, 0, 0, 2*Math.PI);
        ctx.fill();
        ctx.strokeStyle = '#006374';
        ctx.lineWidth = 1.5;
        ctx.stroke();
        break;
      case 'gradient':
        let grad = ctx.createRadialGradient(x + cellSize/2, y + cellSize/2, cellSize/7, x + cellSize/2, y + cellSize/2, cellSize/3);
        grad.addColorStop(0, '#ff3e00');
        grad.addColorStop(1, '#ffa500');
        ctx.fillStyle = grad;
        ctx.beginPath();
        ctx.ellipse(x + cellSize/2, y + cellSize/2, cellSize/3, cellSize/3, 0, 0, 2*Math.PI);
        ctx.fill();
        ctx.strokeStyle = '#b25000';
        ctx.lineWidth = 1.5;
        ctx.stroke();
        break;
      case 'pattern':
        // Circle with dots pattern
        ctx.save();
        let patternCanvas = document.createElement('canvas');
        patternCanvas.width = 8;
        patternCanvas.height = 8;
        let pctx = patternCanvas.getContext('2d');
        pctx.fillStyle = '#ff4b3e';
        pctx.fillRect(0, 0, 8, 8);
        pctx.fillStyle = '#ffa07a';
        pctx.beginPath();
        pctx.arc(4, 4, 2, 0, 2 * Math.PI);
        pctx.fill();
        let pattern = ctx.createPattern(patternCanvas, 'repeat');
        ctx.fillStyle = pattern;
        ctx.beginPath();
        ctx.ellipse(x + cellSize/2, y + cellSize/2, cellSize/3, cellSize/3, 0, 0, 2*Math.PI);
        ctx.fill();
        ctx.strokeStyle = '#aa3723';
        ctx.lineWidth = 1.5;
        ctx.stroke();
        ctx.restore();
        break;
      default:
        ctx.fillStyle = '#e63946';
        ctx.beginPath();
        ctx.ellipse(x + cellSize/2, y + cellSize/2, cellSize/3, cellSize/3, 0, 0, 2*Math.PI);
        ctx.fill();
        ctx.strokeStyle = '#b22222';
        ctx.lineWidth = 1.5;
        ctx.stroke();
    }
  }

  // Draw obstacles
  function drawObstacleCell(pos) {
    const x = pos.x * cellSize;
    const y = pos.y * cellSize;
    ctx.fillStyle = '#444444';
    ctx.shadowColor = '#222222';
    ctx.shadowBlur = 6;
    drawRoundedRect(x+2, y+2, cellSize-4, cellSize-4, 4, '#555555');
    ctx.shadowBlur = 0;
  }

  // Initialize game state
  function initGameState() {
    snake = [
      {x: 8, y: 10},
      {x: 7, y: 10},
      {x: 6, y: 10},
    ];
    direction = {x:1, y:0};
    nextDirection = direction;
    score = 0;
    speedLevel = 1;
    obstacles = [];
    generateFood();
    generateObstacles();
  }

  // Draw everything
  function draw() {
    // Clear canvas - dark background
    ctx.clearRect(0, 0, canvas.width, canvas.height);
    ctx.fillStyle = '#111';
    ctx.fillRect(0, 0, canvas.width, canvas.height);

    // Draw obstacles
    obstacles.forEach(pos => drawObstacleCell(pos));

    // Draw food
    drawFoodCell(food);

    // Draw snake
    snake.forEach((pos, i) => drawSnakeCell(pos, i));
  }

  // Check if two positions are equal
  function positionsEqual(p1, p2) {
    return p1.x === p2.x && p1.y === p2.y;
  }

  // Generate new food location (not on snake or obstacles)
  function generateFood() {
    let possible = [];
    for(let x=0; x<cols; x++) {
      for(let y=0; y<rows; y++) {
        let pos = {x, y};
        if (
          snake.some(s => positionsEqual(s, pos)) ||
          obstacles.some(o => positionsEqual(o, pos))
        ) continue;
        possible.push(pos);
      }
    }
    food = possible[Math.floor(Math.random() * possible.length)];
  }

  // Generate obstacles based on score: increase obstacles every 3 points, max one obstacle per 5 cells approx.
  function generateObstacles() {
    const maxObstacles = Math.min(Math.floor(score / 3) + 2, Math.floor((rows*cols)/28));
    // Keep existing obstacles initially
    while (obstacles.length < maxObstacles) {
      let candidate = {
        x: Math.floor(Math.random()*cols),
        y: Math.floor(Math.random()*rows)
      };
      if (
        obstacles.some(o => positionsEqual(o, candidate)) ||
        snake.some(s => positionsEqual(s, candidate)) ||
        positionsEqual(food, candidate)
      ) continue;
      obstacles.push(candidate);
    }
    // If too many obstacles (score drop scenario), slice
    obstacles = obstacles.slice(0,maxObstacles);
  }

  // Handle snake movement and game logic
  function gameStep() {
    // Update direction buffered
    direction = nextDirection;

    // Compute new head position with teleport walls
    let newHead = {
      x: (snake[0].x + direction.x + cols) % cols,
      y: (snake[0].y + direction.y + rows) % rows
    };

    // Check collision with self
    if (snake.some(s => positionsEqual(s, newHead))) {
      gameOver();
      return;
    }

    // Check collision with obstacle
    if (obstacles.some(o => positionsEqual(o, newHead))) {
      gameOver();
      return;
    }

    // Add new head
    snake.unshift(newHead);

    // Check if food eaten
    if (positionsEqual(newHead, food)) {
      score++;
      generateFood();
      generateObstacles();
      updateSpeedLevel();
      saveGameState();
    } else {
      // Remove tail
      snake.pop();
    }

    draw();
    updateStatusBar();
  }

  // Game over
  function gameOver() {
    clearInterval(gameInterval);
    gameRunning = false;
    pauseRequested = false;
    pauseResumeBtn.textContent = 'Start';
    pauseResumeBtn.setAttribute('aria-pressed', 'false');
    alert(`Game Over! Your final score was ${score}. Press Start to play again.`);
    initGameState();
    draw();
    updateStatusBar();
    clearSavedGame();
  }

  // Update speed level according to score
  function updateSpeedLevel() {
    const oldSpeedLevel = speedLevel;
    speedLevel = 1 + Math.floor(score / speedIncreasePoints);
    if(speedLevel !== oldSpeedLevel && gameRunning) {
      clearInterval(gameInterval);
      gameInterval = setInterval(gameStep, speedBase - speedStep * (speedLevel - 1));
      updateStatusBar();
    }
  }

  // Pause or resume the game
  function togglePauseResume() {
    if (!gameRunning) {
      // Start or resume game
      if (!gameInterval) {
        // Starting game first time or from gameOver
        initGameState();
        updateSpeedLevel();
        draw();
      }
      gameInterval = setInterval(gameStep, speedBase - speedStep * (speedLevel - 1));
      gameRunning = true;
      pauseResumeBtn.textContent = 'Pause';
      pauseResumeBtn.setAttribute('aria-pressed', 'true');
      saveGameState();
    } else {
      // Pause game
      clearInterval(gameInterval);
      gameInterval = null;
      gameRunning = false;
      pauseResumeBtn.textContent = 'Resume';
      pauseResumeBtn.setAttribute('aria-pressed', 'false');
      saveGameState();
    }
  }

  // Update status bar text
  function updateStatusBar() {
    statusBar.textContent = `Score: ${score} | Speed Level: ${speedLevel} | Obstacles: ${obstacles.length}`;
  }

  // Key handlers for arrow keys and WASD
  function onKeyDown(e) {
    if (!gameRunning) return;
    const key = e.key;
    switch(key) {
      case 'ArrowUp':
      case 'w':
      case 'W':
        if (direction.y !== 1) nextDirection = {x:0, y:-1};
        break;
      case 'ArrowDown':
      case 's':
      case 'S':
        if (direction.y !== -1) nextDirection = {x:0, y:1};
        break;
      case 'ArrowLeft':
      case 'a':
      case 'A':
        if (direction.x !== 1) nextDirection = {x:-1, y:0};
        break;
      case 'ArrowRight':
      case 'd':
      case 'D':
        if (direction.x !== -1) nextDirection = {x:1, y:0};
        break;
      case ' ':
        // Space bar toggles pause/resume
        e.preventDefault();
        togglePauseResume();
        break;
    }
  }

  // Save game state to localStorage
  function saveGameState() {
    if (!gameRunning && !pauseRequested) {
      // Don't save if game over or fresh start
      localStorage.removeItem(storageKey);
      return;
    }
    try {
      const saveData = {
        snake,
        food,
        obstacles,
        direction,
        nextDirection,
        score,
        speedLevel,
        skins,
        gameRunning,
        pauseRequested
      };
      localStorage.setItem(storageKey, JSON.stringify(saveData));
    } catch(e) {
      console.warn('Game save failed:', e);
    }
  }

  // Clear saved game
  function clearSavedGame() {
    localStorage.removeItem(storageKey);
  }

  // Load game state from localStorage if any
  function loadGameState() {
    try {
      const savedJson = localStorage.getItem(storageKey);
      if (!savedJson) return false;
      const saved = JSON.parse(savedJson);
      if (!saved) return false;
      // Validate saved fields minimally
      if (
        !Array.isArray(saved.snake) ||
        typeof saved.food !== 'object' ||
        !Array.isArray(saved.obstacles) ||
        typeof saved.direction !== 'object' ||
        typeof saved.score !== 'number'
      ) return false;
      snake = saved.snake;
      food = saved.food;
      obstacles = saved.obstacles;
      direction = saved.direction;
      nextDirection = saved.nextDirection;
      score = saved.score;
      speedLevel = saved.speedLevel || 1;
      skins = saved.skins || skins;
      gameRunning = saved.gameRunning || false;
      pauseRequested = saved.pauseRequested || false;
      return true;
    } catch(e) {
      console.warn('Invalid saved game:', e);
      return false;
    }
  }

  // Sync selectors with skins
  function updateSkinSelectors() {
    snakeSkinSelector.value = skins.snake;
    foodSkinSelector.value = skins.food;
  }

  // Apply skins and redraw
  function applySkins() {
    skins.snake = snakeSkinSelector.value;
    skins.food = foodSkinSelector.value;
    draw();
    saveGameState();
  }

  // Initialize event listeners and game
  function init() {
    // Load saved game
    const loaded = loadGameState();
    if (loaded) {
      updateSkinSelectors();
      draw();
      updateStatusBar();
      if (gameRunning) {
        // Restart interval if game was running
        gameInterval = setInterval(gameStep, speedBase - speedStep * (speedLevel -1));
        pauseResumeBtn.textContent = 'Pause';
        pauseResumeBtn.setAttribute('aria-pressed', 'true');
      } else {
        pauseResumeBtn.textContent = pauseRequested ? 'Resume' : 'Start';
        pauseResumeBtn.setAttribute('aria-pressed', 'false');
      }
    } else {
      initGameState();
      updateSkinSelectors();
      draw();
      updateStatusBar();
      pauseResumeBtn.textContent = 'Start';
      pauseResumeBtn.setAttribute('aria-pressed', 'false');
    }
  }

  // Event listeners for controls
  pauseResumeBtn.addEventListener('click', () => {
    togglePauseResume();
    pauseRequested = !gameRunning;
    saveGameState();
  });

  snakeSkinSelector.addEventListener('change', () => {
    applySkins();
  });

  foodSkinSelector.addEventListener('change', () => {
    applySkins();
  });

  window.addEventListener('keydown', onKeyDown);

  // Prevent arrow keys from scrolling the page when playing
  window.addEventListener('keydown', function(e) {
    if(["ArrowUp","ArrowDown","ArrowLeft","ArrowRight","Space"].indexOf(e.code) > -1) {
      e.preventDefault();
    }
  }, false);

  // On page unload or hide, save game state
  window.addEventListener('beforeunload', () => {
    saveGameState();
  });

  // Initialize game on load
  window.onload = init;

})();