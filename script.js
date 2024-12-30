let validChains;
let currentWord;
let chainHistory;
let currentGuess = '';
let revealedLetters = 1;
let completeChain = [];
let currentWordScore = 20;  // Score for current word
let totalScore = 0;         // Total score for the game
let wrongGuesses = 0;       // Track wrong guesses for current word
let wordScores = [];  // Array to store scores for completed words

// Color palette for the tiles (from purple to orange)
const colorPalette = [
    '#7B68EE', // Purple
    '#9370DB',
    '#BA55D3',
    '#FF69B4',
    '#FF6347',
    '#FFA07A',
    '#FFA500'  // Orange
];

function createLetterTile(letter, color, revealed = true, isActive = false) {
    const tile = document.createElement('div');
    tile.className = 'letter-tile' + (isActive ? ' active' : '');
    tile.style.backgroundColor = revealed ? color : '#313131';
    tile.textContent = revealed ? letter.toUpperCase() : '';
    return tile;
}

function createEmptyTile() {
    const tile = document.createElement('div');
    tile.className = 'letter-tile empty-tile';
    return tile;
}

function updateGrid() {
    const grid = document.getElementById('word-grid');
    grid.innerHTML = '';
    
    // Show completed words
    chainHistory.forEach((word, index) => {
        const row = document.createElement('div');
        row.className = 'word-row';
        
        word.split('').forEach((letter) => {
            const tile = createLetterTile(letter, colorPalette[index % colorPalette.length]);
            row.appendChild(tile);
        });

        // Only show score if we have a score for this word
        if (wordScores[index] !== undefined) {
            const score = document.createElement('div');
            score.className = 'score';
            score.textContent = '+' + wordScores[index];
            row.appendChild(score);
        }

        grid.appendChild(row);
    });

    // Show current word with guess if exists
    if (currentWord) {
        const row = document.createElement('div');
        row.className = 'word-row';
        
        currentWord.split('').forEach((letter, index) => {
            const guessLetter = currentGuess[index] || '';
            const revealed = index === 0 || index < revealedLetters;
            const isActive = !revealed && (
                (currentGuess.length === 0 && index === 1) || 
                index === currentGuess.length
            );
            const tile = createLetterTile(
                revealed ? letter : guessLetter,
                revealed ? colorPalette[chainHistory.length % colorPalette.length] : '#404040',
                true,
                isActive
            );
            row.appendChild(tile);
        });

        grid.appendChild(row);
    }

    // Show future words (only first letter)
    const currentIndex = completeChain.indexOf(currentWord);
    if (currentIndex !== -1) {
        for (let i = currentIndex + 1; i < completeChain.length; i++) {
            const word = completeChain[i];
            const row = document.createElement('div');
            row.className = 'word-row';
            
            word.split('').forEach((letter, index) => {
                const revealed = index === 0;
                const tile = createLetterTile(
                    letter,
                    colorPalette[i % colorPalette.length],
                    revealed
                );
                row.appendChild(tile);
            });
            grid.appendChild(row);
        }
    }
}

function handleKey(key) {
    if (!currentWord) return;
    
    if (key === 'enter') {
        // Check if we have enough letters for the remaining part of the word
        if (currentGuess.length === currentWord.length) {
            checkGuess();
        }
    } else if (key === 'backspace' && currentGuess.length > revealedLetters) {
        // Only allow backspace if we're not at the revealed letters
        currentGuess = currentGuess.slice(0, -1);
        updateGrid();
    } else if (/^[a-z]$/.test(key)) {
        // Only add letter if we haven't filled the word yet
        if (currentGuess.length < currentWord.length) {
            currentGuess += key;
            updateGrid();
        }
    }
}

function checkGuess() {
    if (!currentWord) return;
    
    const guessLower = currentGuess.toLowerCase();
    const currentWordLower = currentWord.toLowerCase();
    
    if (guessLower === currentWordLower || wrongGuesses >= 4 || currentWordScore <= 0) {
        // Add word to history first
        chainHistory.push(currentWord);
        // Then store score for this word
        wordScores[chainHistory.length - 1] = guessLower === currentWordLower ? currentWordScore : 0;
        // Update total score only if guess was correct
        if (guessLower === currentWordLower) {
            totalScore += currentWordScore;
        }
        
        // Find the next word in the complete chain
        const currentIndex = completeChain.indexOf(currentWord);
        const nextWord = completeChain[currentIndex + 1];
        
        if (nextWord) {
            currentWord = nextWord;
            currentGuess = nextWord[0];
            revealedLetters = 1;
            currentWordScore = 20;  // Reset score for new word
            wrongGuesses = 0;
        } else {
            currentWord = null;
            document.querySelectorAll('.key').forEach(key => key.disabled = true);
            showFinalScore();
        }
    } else {
        wrongGuesses++;
        currentWordScore = Math.max(0, currentWordScore - 5);
        revealedLetters = Math.min(revealedLetters + 1, currentWord.length);
        currentGuess = currentWord.slice(0, revealedLetters);
    }
    updateGrid();
}

function showFinalScore() {
    const scoreDisplay = document.getElementById('score-display');
    const scoreText = document.getElementById('score-text');
    const closeBtn = document.getElementById('close-score-btn');
    
    scoreText.textContent = `Final Score: ${totalScore}`;
    scoreDisplay.style.display = 'block';
    
    // Setup close button handler
    closeBtn.onclick = () => {
        scoreDisplay.style.display = 'none';
    };
    
    // Auto-fade after 5 seconds
    setTimeout(() => {
        scoreDisplay.classList.add('fade-out');
        setTimeout(() => {
            scoreDisplay.style.display = 'none';
            scoreDisplay.classList.remove('fade-out');
        }, 500); // Wait for fade animation to complete
    }, 5000);
}

function startNewGame() {
    // Reset all scores
    totalScore = 0;
    currentWordScore = 20;
    wrongGuesses = 0;
    wordScores = [];  // Reset word scores array
    
    // During development, always use the first game (COFFEE chain)
    const game = games[Math.floor(Math.random() * games.length)];
    validChains = {};
    
    // Store chains with lowercase keys and lowercase values for comparison
    Object.entries(game.chains).forEach(([key, values]) => {
        validChains[key.toLowerCase()] = values.map(v => v.toLowerCase());
    });
    
    // Build the entire chain (keep original case for display)
    let chain = [game.startWord];
    let word = game.startWord;  
    let lowerWord = word.toLowerCase();
    
    while (validChains[lowerWord] && validChains[lowerWord].length > 0) {
        // Find the original cased version from the game data
        const nextLowerWord = validChains[lowerWord][0];
        const nextWord = game.chains[word].find(w => w.toLowerCase() === nextLowerWord);
        chain.push(nextWord);
        word = nextWord;
        lowerWord = word.toLowerCase();
    }
    
    // Store the complete chain for reference
    completeChain = chain;
    
    // First word is fully revealed, rest show only first letter
    chainHistory = [chain[0]];  // First word fully revealed
    currentWord = chain[1];     // Second word is current
    
    currentGuess = currentWord[0];
    revealedLetters = 1;
    updateGrid();

    console.log('Chain initialized:', {
        completeChain,
        currentWord,
        validChains
    });
}

// Update timer
function updateTimer() {
    const now = new Date();
    const midnight = new Date();
    midnight.setHours(24, 0, 0, 0);
    const diff = midnight - now;
    
    const hours = Math.floor(diff / 3600000);
    const minutes = Math.floor((diff % 3600000) / 60000);
    const seconds = Math.floor((diff % 60000) / 1000);
    
    document.getElementById('timer').textContent = 
        `Next word in ${String(hours).padStart(2, '0')}:${String(minutes).padStart(2, '0')}:${String(seconds).padStart(2, '0')}`;
}

// Create example grid in modal with animation
function createExampleGrid() {
    const example = document.querySelector('.example');
    example.innerHTML = ''; // Clear existing content
    
    const words = [
        { text: 'CHAIN', color: '#7B68EE' },
        { text: 'REACTION', color: '#9370DB' },
        { text: 'TIME', color: '#BA55D3' }
    ];

    // Create all rows first but only show first word
    words.forEach((word, index) => {
        const row = document.createElement('div');
        row.className = 'word-row example-row';
        if (index > 0) {
            row.style.opacity = '0';
        }
        
        word.text.split('').forEach((letter, letterIndex) => {
            const tile = createLetterTile(
                index === 0 || letterIndex === 0 ? letter : '',
                word.color,
                index === 0 || letterIndex === 0
            );
            if (index > 0 && letterIndex > 0) {
                tile.style.backgroundColor = '#313131';
            }
            row.appendChild(tile);
        });
        
        example.appendChild(row);
    });

    function startAnimation() {
        const rows = example.querySelectorAll('.example-row');
        let currentRowIndex = 1;

        function resetAnimation() {
            // Reset all rows except first to initial state
            rows.forEach((row, index) => {
                if (index > 0) {
                    row.style.opacity = '0';
                    const tiles = row.querySelectorAll('.letter-tile');
                    tiles.forEach((tile, tileIndex) => {
                        if (tileIndex > 0) {
                            tile.textContent = '';
                            tile.style.backgroundColor = '#313131';
                        }
                    });
                }
            });
            currentRowIndex = 1;
            animateGuess(rows[1], words[1].text);
        }

        function animateGuess(row, word) {
            row.style.opacity = '1';
            const tiles = row.querySelectorAll('.letter-tile');
            let currentLetterIndex = 1;

            function typeNextLetter() {
                if (currentLetterIndex < word.length) {
                    const tile = tiles[currentLetterIndex];
                    tile.textContent = word[currentLetterIndex].toUpperCase();
                    tile.style.backgroundColor = row.firstChild.style.backgroundColor;
                    currentLetterIndex++;
                    setTimeout(typeNextLetter, 200);
                } else if (currentRowIndex < words.length) {
                    setTimeout(() => {
                        currentRowIndex++;
                        if (currentRowIndex < words.length) {
                            animateGuess(rows[currentRowIndex], words[currentRowIndex].text);
                        } else {
                            // When animation completes, wait and restart
                            setTimeout(resetAnimation, 2000);
                        }
                    }, 1000);
                }
            }

            setTimeout(typeNextLetter, 500);
        }

        // Start the animation
        resetAnimation();
    }

    // Start the initial animation after a short delay
    setTimeout(startAnimation, 500);
}

// Initialize game
document.addEventListener('DOMContentLoaded', () => {
    // Setup keyboard input handling
    document.addEventListener('keydown', (e) => {
        if (e.key === 'Enter') {
            e.preventDefault(); // Prevent default form submission
            handleKey('enter');
        } else if (e.key === 'Backspace') {
            handleKey('backspace');
        } else if (/^[a-z]$/.test(e.key.toLowerCase())) {
            handleKey(e.key.toLowerCase());
        }
    });

    // Setup modal functionality
    const helpBtn = document.getElementById('help-btn');
    const modal = document.getElementById('how-to-play-modal');
    const modalOverlay = document.getElementById('modal-overlay');
    const closeModalBtn = document.getElementById('close-modal-btn');
    const gotItBtn = document.getElementById('got-it-btn');
    const newGameBtn = document.getElementById('new-game-btn');

    function showModal() {
        modal.style.display = 'block';
        modalOverlay.style.display = 'block';
        createExampleGrid(); // Recreate and replay animation when modal opens
    }

    function hideModal() {
        modal.style.display = 'none';
        modalOverlay.style.display = 'none';
    }

    helpBtn.addEventListener('click', showModal);
    closeModalBtn.addEventListener('click', hideModal);
    gotItBtn.addEventListener('click', hideModal);
    modalOverlay.addEventListener('click', hideModal);
    newGameBtn.addEventListener('click', startNewGame);

    // Start game
    startNewGame();
    createExampleGrid();

    // Start timer
    setInterval(updateTimer, 1000);
    updateTimer();
}); 