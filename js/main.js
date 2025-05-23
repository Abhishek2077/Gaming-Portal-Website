(function () {
    'use strict';
    // Game data with thumbnails, category and popularity
    const gamesData = [
        {
            id: 'rps',
            name: 'Rock-Paper-Scissors',
            description: 'Battle Mode: Defeat the computer in a best-of-3 HP match with leaderboard!',
            details: 'Choose rock, paper, or scissors. Each win deals damage to the opponent. First to 0 HP loses. Track your wins on the leaderboard!',
            thumbnail: 'images/Rock-paper-scissior.png',
            category: 'Casual',
            popularity: 4
        },
        {
            id: 'snake',
            name: 'Snake Game',
            description: 'Control the snake and eat the food to grow longer without hitting walls or yourself.',
            details: 'Use arrow keys to move the snake. Eat food to grow. Don’t crash into yourself or boundaries.',
            thumbnail: 'images/snake.png',
            category: 'Skills',
            popularity: 5
        },
        {
            id: 'memory',
            name: 'Memory Match Game',
            description: 'Flip cards and match pairs to clear the board. Test your memory skills!',
            details: 'Click cards to flip. Try to find matching pairs. Clear all pairs to win.',
            thumbnail: 'images/memory.png',
            category: 'Puzzle',
            popularity: 3
        },
        {
            id: 'hangman',
            name: 'Hangman Game',
            description: 'Guess the hidden word by suggesting letters before you run out of chances.',
            details: 'Make letter guesses to reveal the hidden word. Don’t run out of tries!',
            thumbnail: 'images/hangman.png',
            category: 'Words',
            popularity: 4
        },
        {
            id: 'typing',
            name: 'Typing Test Game',
            description: 'Test your typing speed and accuracy on timed text.',
            details: 'Start typing the displayed text. Try to be fast and accurate before time runs out.',
            thumbnail: 'images/typing-test.png',
            category: 'Skills',
            popularity: 4
        },
        {
            id: 'flappybird',
            name: 'Flappy Bird',
            description: 'Fly the bird through pipes and get the highest score!',
            details: 'Press space to flap. Avoid the pipes. Try to beat your high score!',
            thumbnail: 'images/flappy-bird.png',
            category: 'Skills',
            popularity: 5
        },
        
    ];

    // Cached DOM elements
    const navFavoritesBtn = document.getElementById('toggle-favorites-btn');
    const gamesListEl = document.getElementById('games-list');
    const gameContainerEl = document.getElementById('game-container');
    const searchInput = document.getElementById('search-input');
    const suggestionsEl = document.getElementById('suggestions');
    const recentlyPlayedSection = document.getElementById('recently-played');
    const recentlyPlayedList = document.getElementById('recently-played-list');
    const categoryFilter = document.getElementById('category-filter');
    const popularityFilter = document.getElementById('popularity-filter');

    // State
    let favoritesViewActive = false;
    let favoritesSet = new Set();
    let recentlyPlayed = [];
    let filteredGames = [...gamesData];
    let categoriesSet = new Set();

    // Save favorites to localStorage
    function saveFavorites() {
        localStorage.setItem('favorites', JSON.stringify(Array.from(favoritesSet)));
    }

    // Load favorites from localStorage
    function loadFavorites() {
        const favs = localStorage.getItem('favorites');
        if (favs) {
            try {
                const arr = JSON.parse(favs);
                if (Array.isArray(arr)) favoritesSet = new Set(arr);
            } catch {
                favoritesSet = new Set();
            }
        }
    }

    // Save recently played to localStorage
    function saveRecentlyPlayed() {
        localStorage.setItem('recentlyPlayed', JSON.stringify(recentlyPlayed));
    }

    // Load recently played from localStorage
    function loadRecentlyPlayed() {
        const rp = localStorage.getItem('recentlyPlayed');
        if (rp) {
            try {
                const arr = JSON.parse(rp);
                if (Array.isArray(arr)) recentlyPlayed = arr;
            } catch {
                recentlyPlayed = [];
            }
        }
    }

    // Clamp number of recently played
    function addRecentlyPlayed(gameId) {
        const index = recentlyPlayed.indexOf(gameId);
        if (index !== -1) {
            recentlyPlayed.splice(index, 1);
        }
        recentlyPlayed.unshift(gameId);
        if (recentlyPlayed.length > 7) recentlyPlayed.pop();
        saveRecentlyPlayed();
        renderRecentlyPlayed();
    }

    // Generate categories set for filter dropdown
    function populateCategoryFilter() {
        categoriesSet.clear();
        gamesData.forEach(g => categoriesSet.add(g.category));
        while (categoryFilter.options.length > 1) {
            categoryFilter.remove(1);
        }
        Array.from(categoriesSet).sort().forEach(cat => {
            const opt = document.createElement('option');
            opt.value = cat;
            opt.textContent = cat;
            categoryFilter.appendChild(opt);
        });
    }

    // Render Recently Played section
    function renderRecentlyPlayed() {
        if (recentlyPlayed.length === 0) {
            recentlyPlayedSection.hidden = true;
            return;
        }
        recentlyPlayedSection.hidden = false;
        recentlyPlayedList.innerHTML = '';
        recentlyPlayed.forEach(id => {
            const game = gamesData.find(g => g.id === id);
            if (!game) return;
            const card = document.createElement('div');
            card.className = 'recent-game-card';
            card.tabIndex = 0;
            card.title = `Play ${game.name}`;
            card.setAttribute('role', 'button');
            card.addEventListener('click', () => loadGame(game.id));
            card.addEventListener('keydown', (e) => {
                if (e.key === 'Enter' || e.key === ' ') {
                    e.preventDefault();
                    loadGame(game.id);
                }
            });
            card.innerHTML = `
                <div class="recent-thumb" style="background-image: url('${game.thumbnail}')"></div>
                <div class="recent-title">${game.name}</div>
            `;
            recentlyPlayedList.appendChild(card);
        });
    }

    // Render games list (filtered)
    function renderGamesList(games) {
        gamesListEl.innerHTML = '';
        if (games.length === 0) {
            gamesListEl.innerHTML = '<p style="text-align:center; color:#888;">No games found.</p>';
            return;
        }
        games.forEach(game => {
            const card = document.createElement('article');
            card.className = 'game-card';
            card.tabIndex = 0;
            card.setAttribute('role', 'region');
            card.setAttribute('aria-label', `Game card for ${game.name}`);
            card.innerHTML = `
                <img src="${game.thumbnail}" alt="Thumbnail for ${game.name}" class="thumb-img" loading="lazy" />
                <div class="game-meta">
                    <span title="Category"><span class="meta-icon">📂</span>${game.category}</span>
                    <span title="Popularity"><span class="meta-icon">🔥</span>${game.popularity}</span>
                </div>
                <h3 class="game-title">${game.name}</h3>
                <p class="game-desc">${game.description}</p>
                <div class="card-action-row">
                    <button class="play-btn" aria-label="Play ${game.name}">Play Now</button>
                    <button class="fav-toggle" aria-pressed="false" aria-label="Add to favorites" title="Add to favorites">☆</button>
                </div>
            `;
            // play button event handler
            card.querySelector('.play-btn').addEventListener('click', () => {
                loadGame(game.id);
                if (!recentlyPlayed.includes(game.id)) addRecentlyPlayed(game.id);
            });
            // favorite toggle
            const favToggleBtn = card.querySelector('.fav-toggle');
            function updateFavUI() {
                if (favoritesSet.has(game.id)) {
                    favToggleBtn.classList.add('fav-active');
                    favToggleBtn.textContent = '★';
                    favToggleBtn.setAttribute('aria-label', `Remove ${game.name} from favorites`);
                    favToggleBtn.setAttribute('aria-pressed', 'true');
                    favToggleBtn.title = 'Remove from favorites';
                } else {
                    favToggleBtn.classList.remove('fav-active');
                    favToggleBtn.textContent = '☆';
                    favToggleBtn.setAttribute('aria-label', `Add ${game.name} to favorites`);
                    favToggleBtn.setAttribute('aria-pressed', 'false');
                    favToggleBtn.title = 'Add to favorites';
                }
            }
            updateFavUI();
            favToggleBtn.addEventListener('click', (e) => {
                e.stopPropagation();
                if (favoritesSet.has(game.id)) {
                    favoritesSet.delete(game.id);
                } else {
                    favoritesSet.add(game.id);
                }
                saveFavorites();
                updateFavUI();
                if (favoritesViewActive) {
                    applyFiltersAndRender();
                }
            });
            gamesListEl.appendChild(card);
        });
    }
    // Get selected category from filter
    function getSelectedCategory() {
        return categoryFilter.value || 'all';
    }
    // Get popularity sort order
    function getPopularitySortOrder() {
        return popularityFilter.value || 'none';
    }
    // Apply search, filtering and sorting then render
    function applyFiltersAndRender() {
        let filtered = [...gamesData];
        if (favoritesViewActive) {
            filtered = filtered.filter(g => favoritesSet.has(g.id));
        }
        const category = getSelectedCategory();
        if (category !== 'all') {
            filtered = filtered.filter(g => g.category === category);
        }
        const searchTerm = searchInput.value.trim().toLowerCase();
        if (searchTerm.length > 0) {
            filtered = filtered.filter(g => g.name.toLowerCase().includes(searchTerm));
        }
        const popOrder = getPopularitySortOrder();
        if (popOrder === 'asc') {
            filtered.sort((a, b) => a.popularity - b.popularity);
        } else if (popOrder === 'desc') {
            filtered.sort((a, b) => b.popularity - a.popularity);
        }
        filteredGames = filtered;
        renderGamesList(filteredGames);
    }
    // --- SEARCH SUGGESTIONS
    function updateSuggestions() {
        const input = searchInput.value.trim().toLowerCase();
        if (input.length === 0) {
            suggestionsEl.hidden = true;
            applyFiltersAndRender();
            return;
        }
        let baseSet = favoritesViewActive ? gamesData.filter(g => favoritesSet.has(g.id)) : gamesData;
        const cat = getSelectedCategory();
        if (cat !== 'all') baseSet = baseSet.filter(g => g.category === cat);
        const filtered = baseSet.filter(g => g.name.toLowerCase().includes(input));
        if (filtered.length === 0) {
            suggestionsEl.innerHTML = '<div>No matching games.</div>';
            suggestionsEl.hidden = false;
            return;
        }
        suggestionsEl.innerHTML = '';
        filtered.forEach(game => {
            const div = document.createElement('div');
            div.textContent = game.name;
            div.tabIndex = 0;
            div.setAttribute('role', 'option');
            div.addEventListener('click', () => {
                searchInput.value = game.name;
                suggestionsEl.hidden = true;
                loadGame(game.id);
                if (!recentlyPlayed.includes(game.id)) addRecentlyPlayed(game.id);
            });
            div.addEventListener('keydown', (e) => {
                if (e.key === 'Enter' || e.key === ' ') {
                    e.preventDefault();
                    searchInput.value = game.name;
                    suggestionsEl.hidden = true;
                    loadGame(game.id);
                    if (!recentlyPlayed.includes(game.id)) addRecentlyPlayed(game.id);
                }
            });
            suggestionsEl.appendChild(div);
        });
        suggestionsEl.hidden = false;
    }

    document.addEventListener('click', (e) => {
        if (!searchInput.contains(e.target) && !suggestionsEl.contains(e.target)) {
            suggestionsEl.hidden = true;
        }
    });

    navFavoritesBtn.addEventListener('click', () => {
        favoritesViewActive = !favoritesViewActive;
        navFavoritesBtn.classList.toggle('active', favoritesViewActive);
        navFavoritesBtn.setAttribute('aria-pressed', favoritesViewActive.toString());
        applyFiltersAndRender();
    });

    searchInput.addEventListener('input', () => {
        updateSuggestions();
    });

    categoryFilter.addEventListener('change', () => {
        suggestionsEl.hidden = true;
        applyFiltersAndRender();
    });

    popularityFilter.addEventListener('change', () => {
        applyFiltersAndRender();
    });

    function showGamesList() {
        recentlyPlayedSection.hidden = recentlyPlayed.length === 0;
        gameContainerEl.hidden = true;
        gamesListEl.style.display = '';
    }

    function showGameContainer() {
        recentlyPlayedSection.hidden = true;
        gameContainerEl.hidden = false;
        gamesListEl.style.display = 'none';
    }

    function loadGame(gameId) {
        const game = gamesData.find(g => g.id === gameId);
        if (!game) return;
        showGameContainer();
        gameContainerEl.scrollIntoView({ behavior: 'smooth' });
        gameContainerEl.focus();
        gameContainerEl.innerHTML = `
            <h2 id="game-header">${game.name}</h2>
            <p id="game-desc">${game.details}</p>
            <div id="game-play-area"></div>
            <button class="small-btn" id="back-btn" aria-label="Back to games list">Back to games</button>
        `;
        document.getElementById('back-btn').addEventListener('click', () => {
            showGamesList();
            searchInput.focus();
        });
        const playArea = document.getElementById('game-play-area');
        playArea.innerHTML = '';
        addRecentlyPlayed(game.id);
        switch (gameId) {
            case 'rps': loadRPS(playArea); break;
            case 'snake': loadSnake(playArea); break;
            case 'memory': loadMemory(playArea); break;
            case 'hangman': loadHangman(playArea); break;
            case 'typing': loadTypingTest(playArea); break;
            case 'flappybird': loadFlappyBird(playArea); break;
            default:
                playArea.textContent = 'Game not implemented yet.';
        }
    }

    // Initialize
    async function loadRPS(playArea) {
    // Fetch the RPS HTML file
    const response = await fetch('./games/rps.html');
    const text = await response.text();

    // Parse the HTML and extract the main game container
    const parser = new DOMParser();
    const doc = parser.parseFromString(text, 'text/html');
    const rpsMain = doc.querySelector('main.game-container');

    // Remove previous children
    while (playArea.firstChild) playArea.removeChild(playArea.firstChild);

    // Import and append the RPS game node
    if (rpsMain) playArea.appendChild(rpsMain);

    // Dynamically load the RPS JS if not already loaded
    if (!window.rpsLoaded) {
        const script = document.createElement('script');
        script.src = './js/rps.js';
        script.onload = () => { window.rpsLoaded = true; };
        document.body.appendChild(script);
    }
}

async function loadSnake(playArea) {
    // Fetch the Snake HTML file
    const response = await fetch('./games/snake.html');
    const text = await response.text();

    // Parse the HTML and extract the main game container
    const parser = new DOMParser();
    const doc = parser.parseFromString(text, 'text/html');
    const snakeMain = doc.querySelector('main.game-container');

    // Remove previous children
    while (playArea.firstChild) playArea.removeChild(playArea.firstChild);

    // Import and append the Snake game node
    if (snakeMain) playArea.appendChild(snakeMain);

    // Dynamically load the Snake JS if not already loaded
    if (!window.snakeLoaded) {
        const script = document.createElement('script');
        script.src = './js/snake.js';
        script.onload = () => { window.snakeLoaded = true; };
        document.body.appendChild(script);
    }
}

async function loadMemory(playArea) {
    const response = await fetch('./games/memory.html');
    const text = await response.text();
    const parser = new DOMParser();
    const doc = parser.parseFromString(text, 'text/html');
    const memoryMain = doc.querySelector('main.game-container');

    while (playArea.firstChild) playArea.removeChild(playArea.firstChild);

    if (memoryMain) playArea.appendChild(memoryMain);

    // Always reload the script to re-initialize the game
    const oldScript = document.getElementById('memory-script');
    if (oldScript) oldScript.remove();
    const script = document.createElement('script');
    script.src = './js/memory.js';
    script.id = 'memory-script';
    document.body.appendChild(script);
}

async function loadHangman(playArea) {
    // Fetch the Hangman HTML file
    const response = await fetch('./games/hangman.html');
    const text = await response.text();

    // Parse the HTML and extract the main game container
    const parser = new DOMParser();
    const doc = parser.parseFromString(text, 'text/html');
    const hangmanRoot = doc.querySelector('.hangman-root');

    // Remove previous children
    while (playArea.firstChild) playArea.removeChild(playArea.firstChild);

    // Import and append the Hangman game node
    if (hangmanRoot) playArea.appendChild(hangmanRoot);

    // Always reload the script to re-initialize the game
    const oldScript = document.getElementById('hangman-script');
    if (oldScript) oldScript.remove();
    const script = document.createElement('script');
    script.src = './js/hangman.js';
    script.id = 'hangman-script';
    document.body.appendChild(script);

    // Add the CSS if not already present
    if (!document.getElementById('hangman-css')) {
        const link = document.createElement('link');
        link.rel = 'stylesheet';
        link.href = './css/hangman.css';
        link.id = 'hangman-css';
        document.head.appendChild(link);
    }
}

async function loadTypingTest(playArea) {
    // Fetch the Typing Test HTML file
    const response = await fetch('./games/typing.html');
    const text = await response.text();

    // Parse the HTML and extract the main game container
    const parser = new DOMParser();
    const doc = parser.parseFromString(text, 'text/html');
    const typingRoot = doc.querySelector('.typing-root');

    // Remove previous children
    while (playArea.firstChild) playArea.removeChild(playArea.firstChild);

    // Import and append the Typing Test game node
    if (typingRoot) playArea.appendChild(typingRoot);

    // Always reload the script to re-initialize the game
    const oldScript = document.getElementById('typing-script');
    if (oldScript) oldScript.remove();
    const script = document.createElement('script');
    script.src = './js/typing.js';
    script.id = 'typing-script';
    document.body.appendChild(script);

    // Add the CSS if not already present
    if (!document.getElementById('typing-css')) {
        const link = document.createElement('link');
        link.rel = 'stylesheet';
        link.href = './css/typing.css';
        link.id = 'typing-css';
        document.head.appendChild(link);
    }
}

async function loadFlappyBird(playArea) {
    // Fetch the Flappy Bird HTML file
    const response = await fetch('./games/flappybird.html');
    const text = await response.text();

    // Parse the HTML and extract the main game container
    const parser = new DOMParser();
    const doc = parser.parseFromString(text, 'text/html');
    const flappyRoot = doc.querySelector('.flappybird-root');

    // Remove previous children
    while (playArea.firstChild) playArea.removeChild(playArea.firstChild);

    // Import and append the Flappy Bird game node
    if (flappyRoot) playArea.appendChild(flappyRoot);

    // Always reload the script to re-initialize the game
    const oldScript = document.getElementById('flappybird-script');
    if (oldScript) oldScript.remove();
    const script = document.createElement('script');
    script.src = './js/flappybird.js';
    script.id = 'flappybird-script';
    document.body.appendChild(script);

    // Add the CSS if not already present
    if (!document.getElementById('flappybird-css')) {
        const link = document.createElement('link');
        link.rel = 'stylesheet';
        link.href = './css/flappybird.css';
        link.id = 'flappybird-css';
        document.head.appendChild(link);
    }
}


const hamburger = document.getElementById('hamburger');
        const navLinks = document.getElementById('nav-links');

        hamburger.addEventListener('click', () => {
            navLinks.classList.toggle('active');
        });

    loadFavorites();
    loadRecentlyPlayed();
    populateCategoryFilter();
    renderRecentlyPlayed();
    applyFiltersAndRender();


})();



