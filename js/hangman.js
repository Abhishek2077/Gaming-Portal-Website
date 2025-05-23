const words = [
    "javascript", "hangman", "programming", "developer", "challenge",
    "function", "variable", "constant", "object", "array",
    "element", "browser", "document", "window", "syntax",
    "iterator", "closure", "callback", "promise", "asynchronous",
    "frontend", "backend", "framework", "library", "component",
    "algorithm", "recursion", "inheritance", "prototype", "constructor",
    "selector", "attribute", "event", "listener", "parameter"
];

let selectedWord, guessedLetters, remainingAttempts, playerName, score;
let xp = 0;
const wordDisplay = document.getElementById("wordDisplay");
const guessedLettersDisplay = document.getElementById("guessedLetters");
const remainingAttemptsDisplay = document.getElementById("remainingAttempts");
const messageDisplay = document.getElementById("message");
const buttonContainer = document.getElementById("buttonContainer");
const restartButton = document.getElementById("restartButton");
const parts = [
    document.getElementById("head"),
    document.getElementById("body"),
    document.getElementById("armLeft"),
    document.getElementById("armRight"),
    document.getElementById("legLeft"),
    document.getElementById("legRight")
];
const leaderboardList = document.getElementById("leaderboardList");
const nameInputContainer = document.getElementById("nameInputContainer");
const playerNameInput = document.getElementById("playerName");
const startGameBtn = document.getElementById("startGameBtn");
const gameArea = document.getElementById("gameArea");
const xpDisplay = document.getElementById("xpDisplay");
const hintButton = document.getElementById("hintButton");
const backButton = document.getElementById("backButton");

function getLeaderboard() {
    let lb = localStorage.getItem("hangman_leaderboard");
    return lb ? JSON.parse(lb) : [];
}
function saveLeaderboard(lb) {
    localStorage.setItem("hangman_leaderboard", JSON.stringify(lb));
}
function updateLeaderboardDisplay() {
    const lb = getLeaderboard();
    leaderboardList.innerHTML = "";
    lb.slice(0, 10).forEach((entry, idx) => {
        const li = document.createElement("li");
        li.textContent = `${entry.name}: ${entry.score}`;
        if (playerName && entry.name === playerName) li.classList.add("you");
        leaderboardList.appendChild(li);
    });
}
function addToLeaderboard(name, score) {
    let lb = getLeaderboard();
    lb.push({ name, score });
    lb.sort((a, b) => b.score - a.score);
    lb = lb.slice(0, 20);
    saveLeaderboard(lb);
    updateLeaderboardDisplay();
}
function resetGameArea() {
    wordDisplay.textContent = "_ _ _ _ _";
    guessedLettersDisplay.textContent = "";
    remainingAttemptsDisplay.textContent = "6";
    messageDisplay.textContent = "";
    buttonContainer.innerHTML = "";
    parts.forEach(p => p.classList.remove("visible", "dead", "happy"));
}
function getRandomLetter(word, exclude=[]) {
    let letters = word.split('').filter((l, i, arr) => arr.indexOf(l) === i && !exclude.includes(l));
    if (letters.length === 0) return null;
    return letters[Math.floor(Math.random() * letters.length)];
}
function initGame() {
    selectedWord = words[Math.floor(Math.random() * words.length)];
    guessedLetters = [];
    remainingAttempts = 6;
    score = 0;
    // Add 1 XP every time user starts game
    xp = Number(localStorage.getItem("hangman_xp") || 0) + 1;
    localStorage.setItem("hangman_xp", xp);
    xpDisplay.textContent = xp;
    hintButton.disabled = xp < 1;
    resetGameArea();
    // Reveal 1 random letter at start
    let firstLetter = getRandomLetter(selectedWord);
    guessedLetters.push(firstLetter);
    updateWordDisplay();
    updateGuessedLetters();
    createLetterButtons();
    updateLeaderboardDisplay();
}
function createLetterButtons() {
    buttonContainer.innerHTML = "";
    for (let i = 97; i <= 122; i++) {
        const letter = String.fromCharCode(i);
        const button = document.createElement("button");
        button.textContent = letter;
        button.className = "button";
        button.onclick = () => guessLetter(letter);
        if (guessedLetters.includes(letter)) button.disabled = true;
        buttonContainer.appendChild(button);
    }
}
function guessLetter(letter) {
    if (guessedLetters.includes(letter) || remainingAttempts <= 0) return;
    guessedLetters.push(letter);
    if (selectedWord.includes(letter)) {
        updateWordDisplay();
        score += 10;
    } else {
        remainingAttempts--;
        updateHangmanDisplay();
        score -= 2;
    }
    updateGuessedLetters();
    createLetterButtons();
    checkGameOver();
}
function updateWordDisplay() {
    const displayWord = selectedWord.split('').map(letter => guessedLetters.includes(letter) ? letter : "_").join(" ");
    wordDisplay.textContent = displayWord;
}
function updateHangmanDisplay() {
    const index = 6 - remainingAttempts - 1;
    if (parts[index]) {
        parts[index].classList.add("visible");
    }
    remainingAttemptsDisplay.textContent = remainingAttempts;
}
function updateGuessedLetters() {
    guessedLettersDisplay.textContent = guessedLetters.join(", ");
}
function checkGameOver() {
    if (!wordDisplay.textContent.includes("_")) {
        messageDisplay.textContent = `🎉 You Won! Score: ${score}`;
        parts.forEach(p => p.classList.add("happy"));
        disableButtons();
        addToLeaderboard(playerName, score);
        hintButton.disabled = true;
    } else if (remainingAttempts <= 0) {
        messageDisplay.textContent = `💀 You Died! Word was "${selectedWord}". Score: ${score}`;
        parts.forEach(p => p.classList.add("dead", "visible"));
        disableButtons();
        addToLeaderboard(playerName, score);
        hintButton.disabled = true;
    }
}
function disableButtons() {
    const buttons = buttonContainer.getElementsByTagName("button");
    for (let button of buttons) {
        button.disabled = true;
    }
}
restartButton.onclick = () => {
    initGame();
};
document.addEventListener("keydown", (event) => {
    if (gameArea.style.display === "none") return;
    const letter = event.key.toLowerCase();
    if (letter >= 'a' && letter <= 'z') {
        guessLetter(letter);
    }
});
startGameBtn.onclick = () => {
    const name = playerNameInput.value.trim();
    if (!name) {
        playerNameInput.focus();
        return;
    }
    playerName = name;
    nameInputContainer.style.display = "none";
    gameArea.style.display = "";
    backButton.style.display = "";
    initGame();
};
hintButton.onclick = () => {
    if (xp < 1 || !selectedWord) return;
    // Find a letter not guessed yet
    let hintLetter = getRandomLetter(selectedWord, guessedLetters);
    if (!hintLetter) return;
    guessedLetters.push(hintLetter);
    xp -= 1;
    localStorage.setItem("hangman_xp", xp);
    xpDisplay.textContent = xp;
    updateWordDisplay();
    updateGuessedLetters();
    createLetterButtons();
    checkGameOver();
    hintButton.disabled = xp < 1;
};
backButton.onclick = () => {
    gameArea.style.display = "none";
    nameInputContainer.style.display = "";
    backButton.style.display = "none";
    messageDisplay.textContent = "";
};
window.onload = () => {
    xp = Number(localStorage.getItem("hangman_xp") || 0);
    xpDisplay.textContent = xp;
    updateLeaderboardDisplay();
};