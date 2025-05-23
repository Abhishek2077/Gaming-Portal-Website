(() => {
  // Card themes
  const themes = {
    emojis: ['🍎','🍌','🍇','🍉','🍊','🍓','🍒','🍍'],
    animals: ['🐶','🐱','🐻','🐼','🦊','🐸','🐵','🐰'],
    icons: ['★','❄','☂','☀','☯','☮','☘','⚡'],
    numbers: ['1','2','3','4','5','6','7','8']
  };

  // Config
  const gridSize = 4; // 4x4 grid by default, even number only
  const totalCards = gridSize * gridSize; // 16 cards
  const symbolsPerGame = totalCards / 2;

  // UI elements
  const grid = document.getElementById('grid');
  const moveCountSpan = document.getElementById('moveCount');
  const timerSpan = document.getElementById('timer');
  const restartBtn = document.getElementById('restart');
  const winMessage = document.getElementById('winMessage');

  // Game state
  let cards = [];
  let flippedCards = [];
  let matchedCount = 0;
  let moves = 0;
  let timer = null;
  let elapsedSeconds = 0;
  let started = false;
  let starRating = 3; // Based on moves

  // Accessibility
  let keyboardFocusIndex = 0;

  // Sound effects
  const sounds = {
    flip: new Audio('https://actions.google.com/sounds/v1/cartoon/wood_plank_flicks.ogg'),
    match: new Audio('https://actions.google.com/sounds/v1/cartoon/clang_and_wobble.ogg'),
    mismatch: new Audio('https://actions.google.com/sounds/v1/cartoon/bounce.ogg')
  };

  function playSound(name) {
    if (sounds[name]) {
      sounds[name].currentTime = 0;
      sounds[name].play().catch(() => {});
    }
  }

  function shuffleArray(array) {
    for (let i = array.length -1; i > 0; i--) {
      const j = Math.floor(Math.random() * (i + 1));
      [array[i],array[j]] = [array[j],array[i]];
    }
    return array;
  }

  // Create cards array for the current theme & grid size
  function generateCards(theme='emojis'){
    let selectedSymbols = themes[theme].slice(0, symbolsPerGame);
    let pairSymbols = [...selectedSymbols, ...selectedSymbols];
    return shuffleArray(pairSymbols);
  }

  // Create card element
  function createCardElement(symbol, index){
    const card = document.createElement('div');
    card.classList.add('card');
    card.setAttribute('data-symbol', symbol);
    card.setAttribute('tabindex', '-1');
    card.setAttribute('role', 'button');
    card.setAttribute('aria-label', 'Card face down');
    card.setAttribute('aria-pressed', 'false');
    card.dataset.index = index;
    card.innerHTML = `
      <div class="front" aria-hidden="true">${symbol}</div>
      <div class="back" aria-hidden="true"></div>
    `;

    card.addEventListener('click', () => {
      if (!started) startTimer();
      handleCardFlip(card);
    });
    return card;
  }

  // Update star rating UI - will just log for now or extend later if needed
  function updateStarRating() {
    if(moves < 12) starRating = 3;
    else if(moves < 20) starRating = 2;
    else starRating = 1;
  }

  // Flip logic
  function handleCardFlip(card) {
    if (
      flippedCards.length === 2 ||
      card.classList.contains('flipped') ||
      card.classList.contains('matched')
    ) {
      return;
    }

    playSound('flip');

    card.classList.add('flipped');
    card.setAttribute('aria-label', 'Card face up ' + card.dataset.symbol);
    card.setAttribute('aria-pressed', 'true');
    flippedCards.push(card);

    if (flippedCards.length === 2) {
      moves++;
      moveCountSpan.textContent = moves;
      updateStarRating();

      const [cardA, cardB] = flippedCards;
      if(cardA.dataset.symbol === cardB.dataset.symbol) {
        // Match
        playSound('match');
        matchedCount += 2;
        cardA.classList.add('matched');
        cardB.classList.add('matched');
        flippedCards = [];
        if(matchedCount === totalCards) {
          stopTimer();
          setTimeout(() => {
            winMessage.style.display = 'block';
            winMessage.textContent = `🎉 You Won! Moves: ${moves}, Time: ${elapsedSeconds}s, Stars: ${'★'.repeat(starRating)}`;
          }, 400);
        }
      } else {
        // Mismatch - flip back after 1s
        playSound('mismatch');
        setTimeout(() => {
          cardA.classList.remove('flipped');
          cardB.classList.remove('flipped');
          cardA.setAttribute('aria-label', 'Card face down');
          cardB.setAttribute('aria-label', 'Card face down');
          cardA.setAttribute('aria-pressed', 'false');
          cardB.setAttribute('aria-pressed', 'false');
          flippedCards = [];
        }, 1000);
      }
    }
  }

  // Timer functions
  function startTimer() {
    if(started) return;
    started = true;
    timer = setInterval(() => {
      elapsedSeconds++;
      timerSpan.textContent = elapsedSeconds;
    }, 1000);
  }
  function stopTimer() {
    clearInterval(timer);
    started = false;
  }
  function resetTimer() {
    stopTimer();
    elapsedSeconds = 0;
    timerSpan.textContent = elapsedSeconds;
  }

  // Keyboard accessibility - navigate cards and flip on Enter/Space
  grid.addEventListener('keydown', (e) => {
    const cardsOnGrid = grid.querySelectorAll('.card');
    if(cardsOnGrid.length === 0) return;

    if(e.key === 'ArrowRight') {
      e.preventDefault();
      keyboardFocusIndex = (keyboardFocusIndex + 1) % cardsOnGrid.length;
      cardsOnGrid[keyboardFocusIndex].focus();
    }
    else if(e.key === 'ArrowLeft') {
      e.preventDefault();
      keyboardFocusIndex = (keyboardFocusIndex - 1 + cardsOnGrid.length) % cardsOnGrid.length;
      cardsOnGrid[keyboardFocusIndex].focus();
    }
    else if(e.key === 'ArrowDown') {
      e.preventDefault();
      keyboardFocusIndex = (keyboardFocusIndex + gridSize) % cardsOnGrid.length;
      cardsOnGrid[keyboardFocusIndex].focus();
    }
    else if(e.key === 'ArrowUp') {
      e.preventDefault();
      keyboardFocusIndex = (keyboardFocusIndex - gridSize + cardsOnGrid.length) % cardsOnGrid.length;
      cardsOnGrid[keyboardFocusIndex].focus();
    }
    else if(e.key === 'Enter' || e.key === ' ') {
      e.preventDefault();
      cardsOnGrid[keyboardFocusIndex].click();
    }
  });

 (function () {
  // Only run if the grid exists
  const grid = document.getElementById('grid');
  if (!grid) return;

  // ...your memory game code that creates and shows the cards...
})();

  // Initialize the game
  function initGame() {
    // Reset Variables/UI
    grid.innerHTML = '';
    flippedCards = [];
    matchedCount = 0;
    moves = 0;
    moveCountSpan.textContent = moves;
    winMessage.style.display = 'none';
    resetTimer();
    keyboardFocusIndex = 0;

    // Generate shuffled cards with chosen theme
    cards = generateCards('emojis');
    cards.forEach((symbol, i) => {
      const cardElement = createCardElement(symbol, i);
      grid.appendChild(cardElement);
    });
    // Set focus on first card for accessibility
    setTimeout(() => {
      const firstCard = grid.querySelector('.card');
      if(firstCard) firstCard.focus();
    }, 100);
  }

  restartBtn.addEventListener('click', () => {
    stopTimer();
    initGame();
  });

  // Initialize on page load
  initGame();

})();