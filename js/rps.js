(() => {
    const choices = ['rock', 'paper', 'scissors'];
    const emojiMap = {
      rock: '✊',
      paper: '✋',
      scissors: '✌️'
    };

    const buttons = document.querySelectorAll('.choice-btn');
    const playerHand = document.getElementById('player-hand');
    const computerHand = document.getElementById('computer-hand');
    const playerHpBar = document.getElementById('player-hp-bar');
    const computerHpBar = document.getElementById('computer-hp-bar');
    const playerHpText = document.getElementById('player-hp-text');
    const computerHpText = document.getElementById('computer-hp-text');
    const resultMessage = document.getElementById('result-message');
    const statusMsg = document.getElementById('status-msg');
    const leaderboardList = document.getElementById('leaderboard-list');
    const resetBtn = document.getElementById('reset-btn');

    // Battle settings
    const MAX_HP = 3;

    let playerHp = MAX_HP;
    let computerHp = MAX_HP;
    let isPlaying = false; // disables input during animation
    let gameOver = false;

    const LEADERBOARD_KEY = 'rps_battle_leaderboard';
    const MAX_LEADERBOARD_ENTRIES = 5;

    function getComputerChoice() {
      const randomIndex = Math.floor(Math.random() * choices.length);
      return choices[randomIndex];
    }

    function determineWinner(player, computer) {
      if (player === computer) return 'draw';
      if (
        (player === 'rock' && computer === 'scissors') ||
        (player === 'paper' && computer === 'rock') ||
        (player === 'scissors' && computer === 'paper')
      ) return 'win';
      return 'lose';
    }

    function updateHpBars() {
      const pPercent = (playerHp / MAX_HP) * 100;
      const cPercent = (computerHp / MAX_HP) * 100;
      playerHpBar.style.width = pPercent + '%';
      computerHpBar.style.width = cPercent + '%';

      // color gradient from green to red based on HP%
      playerHpBar.style.backgroundColor = hpColor(pPercent);
      computerHpBar.style.backgroundColor = hpColor(cPercent);

      playerHpText.textContent = `${playerHp} HP`;
      computerHpText.textContent = `${computerHp} HP`;
    }

    // Helper: green->yellow->red color for HP
    function hpColor(percent) {
      if (percent > 66) return '#4caf50'; // green
      if (percent > 33) return '#ffca28'; // yellow
      return '#e53935'; // red
    }

    function disableChoices(disable) {
      buttons.forEach(btn => {
        if (disable) {
          btn.classList.add('disabled');
          btn.setAttribute('aria-disabled', 'true');
        } else {
          btn.classList.remove('disabled');
          btn.removeAttribute('aria-disabled');
        }
      });
    }

    // Add shaking animation and then reveal
    function animateHands(playerChoice, computerChoice) {
      isPlaying = true;
      disableChoices(true);
      resultMessage.textContent = '';
      statusMsg.textContent = 'Fighting...';

      // Reset hands to rock pose before shake
      playerHand.textContent = emojiMap.rock;
      computerHand.textContent = emojiMap.rock;

      playerHand.classList.add('shaking');
      computerHand.classList.add('shaking');

      setTimeout(() => {
        playerHand.classList.remove('shaking');
        computerHand.classList.remove('shaking');

        // Reveal choices
        playerHand.textContent = emojiMap[playerChoice];
        computerHand.textContent = emojiMap[computerChoice];

        // Compute winner and update HP
        playRound(playerChoice, computerChoice);

        isPlaying = false;
        disableChoices(gameOver);

      }, 800);
    }

    function playRound(playerChoice, computerChoice) {
      const result = determineWinner(playerChoice, computerChoice);

      if (result === 'win') {
        computerHp--;
        resultMessage.textContent = 'You Hit! 🎯';
        resultMessage.style.color = '#4CAF50';
      } else if (result === 'lose') {
        playerHp--;
        resultMessage.textContent = 'You Took Damage! 😣';
        resultMessage.style.color = '#E53935';
      } else {
        resultMessage.textContent = "It's a Draw! 🤝";
        resultMessage.style.color = '#FFA726';
      }

      updateHpBars();

      if (playerHp === 0 || computerHp === 0) {
        gameOver = true;
        announceGameOver();
      } else {
        statusMsg.textContent = 'Choose your next move!';
      }
    }

    function announceGameOver() {
      disableChoices(true);
      if (playerHp === 0 && computerHp === 0) {
        statusMsg.textContent = "It's a Tie!";
        resultMessage.textContent = "Game Over: Draw!";
        resultMessage.style.color = '#ff9800';
      } else if (playerHp === 0) {
        statusMsg.textContent = 'You Lost! ☹️';
        resultMessage.textContent = 'Game Over: You Lose!';
        resultMessage.style.color = '#e53935';
      } else {
        statusMsg.textContent = 'You Won! 🎉';
        resultMessage.textContent = 'Game Over: You Win!';
        resultMessage.style.color = '#4caf50';
        // Add to leaderboard
        addScoreToLeaderboard(1); // 1 win for battle mode
        renderLeaderboard();
      }
    }

    function resetGame() {
      playerHp = MAX_HP;
      computerHp = MAX_HP;
      gameOver = false;
      isPlaying = false;
      updateHpBars();
      playerHand.textContent = emojiMap.rock;
      computerHand.textContent = emojiMap.rock;
      statusMsg.textContent = 'Click a choice to start!';
      resultMessage.textContent = '';
      disableChoices(false);
    }

    // Leaderboard code

    function loadLeaderboard() {
      const stored = localStorage.getItem(LEADERBOARD_KEY);
      if (!stored) return [];
      try {
        return JSON.parse(stored);
      } catch {
        return [];
      }
    }

    function saveLeaderboard(board) {
      localStorage.setItem(LEADERBOARD_KEY, JSON.stringify(board));
    }

    function addScoreToLeaderboard(score) {
      if (score === 0) return;
      const board = loadLeaderboard();
      const entry = {
        score,
        date: new Date().toISOString()
      };
      board.push(entry);
      board.sort((a, b) => b.score - a.score);
      const trimmed = board.slice(0, MAX_LEADERBOARD_ENTRIES);
      saveLeaderboard(trimmed);
      return trimmed;
    }

    function formatDate(dateStr) {
      const d = new Date(dateStr);
      return d.toLocaleDateString(undefined, {
        year: 'numeric',
        month: 'short',
        day: 'numeric'
      }) + ' ' +
      d.toLocaleTimeString(undefined, {
        hour: '2-digit',
        minute: '2-digit'
      });
    }

    function renderLeaderboard() {
      const board = loadLeaderboard();
      leaderboardList.innerHTML = '';
      if (board.length === 0) {
        const li = document.createElement('li');
        li.textContent = 'No wins yet. Play to add your score!';
        li.style.fontStyle = 'italic';
        li.style.textAlign = 'center';
        leaderboardList.appendChild(li);
        return;
      }
      board.forEach(({score, date}) => {
        const li = document.createElement('li');
        const scoreSpan = document.createElement('span');
        scoreSpan.className = 'leaderboard-score';
        scoreSpan.textContent = `Wins: ${score}`;

        const dateSpan = document.createElement('span');
        dateSpan.className = 'leaderboard-date';
        dateSpan.textContent = formatDate(date);

        li.appendChild(scoreSpan);
        li.appendChild(dateSpan);
        li.style.justifyContent = 'space-between';
        leaderboardList.appendChild(li);
      });
    }

    function onChoiceClick(e) {
      if (isPlaying || gameOver) return;

      const playerChoice = e.currentTarget.getAttribute('data-choice');
      if (!playerChoice) return;

      const computerChoice = getComputerChoice();

      animateHands(playerChoice, computerChoice);
    }

    buttons.forEach(btn => btn.addEventListener('click', onChoiceClick));
    resetBtn.addEventListener('click', resetGame);

    // Initialize game 
    resetGame();
    renderLeaderboard();

  })();