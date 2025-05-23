(() => {
  // Elements
  const welcomePage = document.getElementById('welcome-page');
  const startBtn = document.getElementById('start-btn');
  const playerIdInput = document.getElementById('player-id');
  const nameError = document.getElementById('name-error');
  const livesDisplay = document.getElementById('lives-display');
  const scoreDisplay = document.getElementById('score-display');
  const leaderboardList = document.getElementById('leaderboard-list');
  const countdownOverlay = document.getElementById('countdown-overlay');
  const gameOverOverlay = document.getElementById('game-over-overlay');
  const gameOverMsg = document.getElementById('game-over-msg');
  const restartBtn = document.getElementById('restart-btn');
  const returnBtn = document.getElementById('return-btn');
  const jumpSound = document.getElementById('jump-sound');
  const hitSound = document.getElementById('hit-sound');
  const gameoverSound = document.getElementById('gameover-sound');
  const canvas = document.getElementById('game-canvas');
  const ctx = canvas.getContext('2d');
  const mainLayout = document.getElementById('main-layout');

  // Game vars
  let playerName = '';
  let isGameRunning = false;
  let isGamePaused = false;
  let lives = 3;
  let score = 0;
  let pipes = [];
  let pipeWidth = 50;
  let pipeGap = 150;
  let pipeSpeed = 2;
  let bird;
  let gravity = 0.25;
  let liftForce = -6;
  let countdown = 3;
  let countdownInterval = null;
  let animationId = null;

  // Leaderboard storage key
  const LB_STORAGE_KEY = 'flappybird_leaderboard';

  // Bird class
  class Bird {
    constructor() {
      this.x = 120;
      this.y = canvas.height / 2;
      this.radius = 16;
      this.velocity = 0;
      this.color = '#ffdd00';
      this.rotation = 0;
    }
    update() {
      this.velocity += gravity;
      if(this.velocity > 6) this.velocity = 6;
      this.y += this.velocity;
      this.rotation = Math.min(this.velocity / 10, 0.5);
      if(this.y < this.radius) {
        this.y = this.radius;
        this.velocity = 0;
      }
    }
    flap() {
      this.velocity = liftForce;
    }
    draw() {
      ctx.save();
      ctx.translate(this.x, this.y);
      ctx.rotate(this.rotation);
      ctx.fillStyle = this.color;
      ctx.beginPath();
      ctx.ellipse(0, 0, this.radius+2, this.radius-4, 0, 0, Math.PI * 2);
      ctx.fill();
      ctx.fillStyle = '#222';
      ctx.beginPath();
      ctx.ellipse(6, -4, 4, 5, 0, 0, Math.PI * 2);
      ctx.fill();
      ctx.fillStyle = '#fff';
      ctx.beginPath();
      ctx.ellipse(8, -5, 2, 3, 0, 0, Math.PI * 2);
      ctx.fill();
      ctx.fillStyle = '#ff6600';
      ctx.beginPath();
      ctx.moveTo(this.radius+2, 0);
      ctx.lineTo(this.radius+10, -4);
      ctx.lineTo(this.radius+10, 4);
      ctx.closePath();
      ctx.fill();
      ctx.restore();
    }
    getBounds() {
      return {
        top: this.y - this.radius,
        bottom: this.y + this.radius,
        left: this.x - this.radius,
        right: this.x + this.radius
      }
    }
  }

  // Pipe class
  class Pipe {
    constructor() {
      this.x = canvas.width;
      this.width = pipeWidth;
      this.topHeight = Math.floor(Math.random() * (canvas.height - pipeGap - 100)) + 50;
      this.bottomY = this.topHeight + pipeGap;
      this.passed = false;
      this.color = '#3581b8';
    }
    update() {
      this.x -= pipeSpeed;
    }
    draw() {
      ctx.fillStyle = this.color;
      ctx.fillRect(this.x, 0, this.width, this.topHeight);
      ctx.fillRect(this.x, this.bottomY, this.width, canvas.height - this.bottomY);
      ctx.fillStyle = '#2a6898';
      ctx.beginPath();
      ctx.ellipse(this.x + this.width/2, this.topHeight, this.width/2, 15, 0, 0, Math.PI * 2);
      ctx.fill();
      ctx.beginPath();
      ctx.ellipse(this.x + this.width/2, this.bottomY, this.width/2, 15, 0, 0, Math.PI * 2);
      ctx.fill();
    }
    getBounds() {
      return [
        {top: 0, bottom: this.topHeight, left: this.x, right: this.x + this.width},
        {top: this.bottomY, bottom: canvas.height, left: this.x, right: this.x + this.width}
      ];
    }
  }

  function initGame(resetAll = true) {
    if (resetAll) {
      lives = 3;
      score = 0;
    }
    updateLivesDisplay();
    updateScoreDisplay();
    bird = new Bird();
    pipes = [];
    for(let i=0; i<3; i++) {
      let pipe = new Pipe();
      pipe.x += i * (canvas.width / 2) + 300;
      pipes.push(pipe);
    }
    isGameRunning = false;
    isGamePaused = false;
    countdown = 3;
    countdownOverlay.textContent = '';
    gameOverOverlay.style.display = 'none';
  }

  function updateLivesDisplay() {
    livesDisplay.innerHTML = '';
    for(let i=0; i<lives; i++) {
      const heart = document.createElement('span');
      heart.className = 'heart';
      livesDisplay.appendChild(heart);
    }
  }
  function updateScoreDisplay() {
    scoreDisplay.textContent = 'Score: ' + score;
  }

  function getLeaderboard() {
    let lb = JSON.parse(localStorage.getItem(LB_STORAGE_KEY));
    if(lb && Array.isArray(lb)) return lb;
    return [];
  }
  function saveLeaderboard(lb) {
    localStorage.setItem(LB_STORAGE_KEY, JSON.stringify(lb));
  }
  function updateLeaderboard() {
    let lb = getLeaderboard();
    lb = lb.filter(item => item.name.toLowerCase() !== playerName.toLowerCase());
    lb.push({name: playerName, score});
    lb.sort((a,b) => b.score - a.score);
    lb = lb.slice(0, 5);
    saveLeaderboard(lb);
    renderLeaderboard();
  }
  function renderLeaderboard() {
    let lb = getLeaderboard();
    leaderboardList.innerHTML = '';
    if(lb.length === 0) {
      const li = document.createElement('li');
      li.innerHTML = `<span class="name">No players yet</span>`;
      leaderboardList.appendChild(li);
    } else {
      for(let i = 0; i < lb.length; i++) {
        const li = document.createElement('li');
        li.innerHTML = `<span class="name">${lb[i].name}</span><span class="score">${lb[i].score}</span>
          <button class="delete-btn" data-name="${encodeURIComponent(lb[i].name)}" title="Delete">&#10006;</button>`;
        leaderboardList.appendChild(li);
      }
    }
    // Add delete event listeners
    document.querySelectorAll('.delete-btn').forEach(btn => {
      btn.onclick = function(e) {
        e.stopPropagation();
        const delName = decodeURIComponent(this.getAttribute('data-name'));
        let lb = getLeaderboard();
        lb = lb.filter(item => item.name !== delName);
        saveLeaderboard(lb);
        // If the deleted name is the current player, reset last_player so user can re-register
        const lastPlayer = localStorage.getItem('flappybird_last_player');
        if (lastPlayer && lastPlayer === delName) {
          localStorage.removeItem('flappybird_last_player');
        }
        renderLeaderboard();
      };
    });
  }

  function checkCollision(pipe) {
    const birdBounds = bird.getBounds();
    const pipeBounds = pipe.getBounds();
    for (let bound of pipeBounds) {
      if (
        birdBounds.right > bound.left &&
        birdBounds.left < bound.right &&
        birdBounds.bottom > bound.top &&
        birdBounds.top < bound.bottom
      ) {
        return true;
      }
    }
    return false;
  }
  function checkFloorCollision() {
    return bird.y + bird.radius >= canvas.height;
  }
  function drawBackground() {
    ctx.clearRect(0, 0, canvas.width, canvas.height);
  }

  function gameLoop() {
    if (!isGameRunning || isGamePaused) return;
    drawBackground();
    for (let i = 0; i < pipes.length; i++) {
      let pipe = pipes[i];
      pipe.update();
      pipe.draw();
      if (!pipe.passed && pipe.x + pipe.width < bird.x) {
        score++;
        pipe.passed = true;
        updateScoreDisplay();
      }
      if(pipe.x + pipe.width < 0) {
        pipes.splice(i,1);
        i--;
        let newPipe = new Pipe();
        newPipe.x = pipes[pipes.length - 1].x + (canvas.width / 2);
        pipes.push(newPipe);
      }
      if(checkCollision(pipe)) {
        handleDeath();
        return;
      }
    }
    bird.update();
    bird.draw();
    if(checkFloorCollision()) {
      handleDeath();
      return;
    }
    animationId = requestAnimationFrame(gameLoop);
  }

  function handleDeath() {
    lives--;
    updateLivesDisplay();
    hitSound.currentTime = 0;
    hitSound.play();
    if(lives > 0) {
      bird.y = canvas.height / 2;
      bird.velocity = 0;
      pipes = [];
      for(let i=0; i<3; i++) {
        let pipe = new Pipe();
        pipe.x += i * (canvas.width / 2) + 300;
        pipes.push(pipe);
      }
      isGameRunning = false;
      showGameOver(false);
    } else {
      isGameRunning = false;
      showGameOver(true);
    }
    cancelAnimationFrame(animationId);
  }

  function showGameOver(finalGameOver) {
    countdownOverlay.textContent = '';
    gameOverOverlay.style.display = 'block';
    gameOverOverlay.style.left = '50%';
    gameOverOverlay.style.top = '50%';
    gameOverOverlay.style.transform = 'translate(-50%, -50%)';
    if(finalGameOver) {
      gameOverMsg.textContent = `Game Over! Your Score: ${score}`;
      gameOverMsg.className = 'game-over';
      restartBtn.textContent = 'Restart Game';
      updateLeaderboard();
      gameoverSound.currentTime = 0;
      gameoverSound.play();
    } else {
      gameOverMsg.textContent = `You lost a life! Score: ${score}`;
      gameOverMsg.className = 'lost-life';
      restartBtn.textContent = 'Resume Game';
    }
  }

  function startCountdown(doneCallback) {
    countdown = 3;
    countdownOverlay.textContent = countdown;
    countdownInterval = setInterval(() => {
      countdown--;
      if (countdown === 0) {
        clearInterval(countdownInterval);
        countdownOverlay.textContent = '';
        doneCallback();
        return;
      } else if (countdown > 0) {
        countdownOverlay.textContent = countdown;
      }
    }, 1300);
  }
  function onSpacePress(e) {
    if(e.code === 'Space') {
      e.preventDefault();
      if(isGameRunning && !isGamePaused) {
        bird.flap();
        jumpSound.currentTime = 0;
        jumpSound.play();
      }
    }
  }

  // --- Name uniqueness logic ---
  function isNameAllowed(name) {
    const lb = getLeaderboard();
    const lastPlayer = localStorage.getItem('flappybird_last_player');
    // Allow if name is not in leaderboard
    if (!lb.some(item => item.name.toLowerCase() === name.toLowerCase())) return true;
    // Allow if name is in leaderboard and is the last player (even if deleted from leaderboard)
    if (lastPlayer && lastPlayer.toLowerCase() === name.toLowerCase()) return true;
    // If name is in leaderboard but not last player, block
    return false;
  }

  playerIdInput.addEventListener('input', () => {
    const name = playerIdInput.value.trim();
    if(name.length === 0) {
      startBtn.disabled = true;
      nameError.style.display = 'none';
      return;
    }
    // Always allow if last_player is this name (even if not in leaderboard)
    const lastPlayer = localStorage.getItem('flappybird_last_player');
    if (lastPlayer && lastPlayer.toLowerCase() === name.toLowerCase()) {
      startBtn.disabled = false;
      nameError.style.display = 'none';
      return;
    }
    if(isNameAllowed(name)) {
      startBtn.disabled = false;
      nameError.style.display = 'none';
    } else {
      startBtn.disabled = true;
      nameError.textContent = 'Name already exists in leaderboard. Choose another!';
      nameError.style.display = 'block';
    }
  });

  startBtn.addEventListener('click', () => {
    playerName = playerIdInput.value.trim();
    if(!playerName) return;
    let lb = getLeaderboard();
    const lastPlayer = localStorage.getItem('flappybird_last_player');
    const exists = lb.some(item => item.name.toLowerCase() === playerName.toLowerCase());
    // Always allow if last_player is this name (even if not in leaderboard)
    if (exists && (!lastPlayer || lastPlayer.toLowerCase() !== playerName.toLowerCase())) {
      nameError.textContent = 'Name already exists in leaderboard. Choose another!';
      nameError.style.display = 'block';
      return;
    }
    localStorage.setItem('flappybird_last_player', playerName);
    welcomePage.style.display = 'none';
    mainLayout.style.display = 'flex';
    if (!exists) {
      lb.push({name: playerName, score: 0});
      saveLeaderboard(lb);
    }
    renderLeaderboard();
    initGame(true);
    startCountdown(() => {
      isGameRunning = true;
      gameLoop();
    });
  });

  restartBtn.addEventListener('click', () => {
    gameOverOverlay.style.display = 'none';
    if (lives > 0) {
      initGame(false);
      startCountdown(() => {
        isGameRunning = true;
        gameLoop();
      });
    } else {
      initGame(true);
      startCountdown(() => {
        isGameRunning = true;
        gameLoop();
      });
    }
  });

  window.addEventListener('keydown', onSpacePress);

  returnBtn.addEventListener('click', () => {
    gameOverOverlay.style.display = 'none';
    mainLayout.style.display = 'none';
    welcomePage.style.display = 'flex';
    playerIdInput.value = '';
    startBtn.disabled = true;
    nameError.style.display = 'none';
  });

  // Show leaderboard on load
  mainLayout.style.display = 'none';
  renderLeaderboard();

  // Autofill last player name for convenience
  const lastPlayer = localStorage.getItem('flappybird_last_player');
  if (lastPlayer) {
    playerIdInput.value = lastPlayer;
    playerIdInput.dispatchEvent(new Event('input'));
  }
})();