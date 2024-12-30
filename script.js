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
    const scrollTop = grid.scrollTop; // Store current scroll position
    const isMobile = /mobile|android|iphone/i.test(navigator.userAgent);
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
        
        // If this is the active row, ensure it's visible
        if (isMobile) {
            const activeRow = grid.lastElementChild;
            const container = document.querySelector('.game-container');
            const rowRect = activeRow.getBoundingClientRect();
            const containerRect = container.getBoundingClientRect();
            
            if (rowRect.bottom > containerRect.bottom) {
                container.scrollTo({
                    top: container.scrollTop + (rowRect.bottom - containerRect.bottom) + 50,
                    behavior: 'smooth'
                });
            }
        }
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
    
    grid.scrollTop = scrollTop; // Restore scroll position
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

function generateShareText() {
    const today = new Date();
    const dateStr = today.toLocaleDateString('en-US', { month: 'numeric', day: 'numeric', year: 'numeric' });
    
    let shareText = `Chain Link ${dateStr}\n`;
    shareText += `Score: ${totalScore}\n\n`;
    
    // Add grid representation
    chainHistory.forEach((word, index) => {
        // Show first letter and hide rest with ⬛
        shareText += word[0]; // First letter
        for (let i = 1; i < word.length; i++) {
            shareText += '⬛';
        }
        shareText += '\n';
    });
    
    return shareText;
}

function generateShareImage() {
    // Create canvas
    const canvas = document.createElement('canvas');
    const ctx = canvas.getContext('2d');
    
    // Set canvas size
    const tileSize = 40;
    const padding = 20;
    const titleHeight = 60;
    const scoreHeight = 40;
    const maxWordLength = Math.max(...chainHistory.map(word => word.length));
    
    canvas.width = (maxWordLength * (tileSize + 5)) + (padding * 2);
    canvas.height = (chainHistory.length * (tileSize + 5)) + titleHeight + scoreHeight + (padding * 2);
    
    // Set background
    ctx.fillStyle = '#1a1a1a';
    ctx.fillRect(0, 0, canvas.width, canvas.height);
    
    // Draw title
    ctx.fillStyle = 'white';
    ctx.font = 'bold 24px "Courier New"';
    ctx.textAlign = 'center';
    const today = new Date();
    const dateStr = today.toLocaleDateString('en-US', { month: 'numeric', day: 'numeric', year: 'numeric' });
    ctx.fillText(`Chain Link ${dateStr}`, canvas.width / 2, padding + 24);
    
    // Draw score
    ctx.font = '20px "Courier New"';
    ctx.fillText(`Score: ${totalScore}`, canvas.width / 2, padding + 50);
    
    // Draw grid
    chainHistory.forEach((word, rowIndex) => {
        const y = titleHeight + padding + rowIndex * (tileSize + 5);
        
        word.split('').forEach((letter, colIndex) => {
            const x = padding + colIndex * (tileSize + 5) + (canvas.width - (word.length * (tileSize + 5))) / 2;
            
            // Draw tile background
            ctx.fillStyle = colIndex === 0 ? colorPalette[rowIndex % colorPalette.length] : '#313131';
            ctx.beginPath();
            ctx.roundRect(x, y, tileSize, tileSize, 8);
            ctx.fill();
            
            // Draw letter
            if (colIndex === 0) {
                ctx.fillStyle = 'white';
                ctx.font = 'bold 24px "Courier New"';
                ctx.textAlign = 'center';
                ctx.textBaseline = 'middle';
                ctx.fillText(letter.toUpperCase(), x + tileSize/2, y + tileSize/2);
            }
        });
    });
    
    return canvas.toDataURL('image/png');
}

function showFinalScore() {
    const scoreDisplay = document.getElementById('score-display');
    const scoreText = document.getElementById('score-text');
    const closeBtn = document.getElementById('close-score-btn');
    const shareBtn = document.getElementById('share-score-btn');
    const shareResultsBtn = document.getElementById('share-results-btn');
    
    scoreText.textContent = `Final Score: ${totalScore}`;
    scoreDisplay.style.display = 'block';
    
    // Setup share functionality
    const shareResults = async () => {
        const imageUrl = generateShareImage();
        
        try {
            // Convert data URL to blob
            const response = await fetch(imageUrl);
            const blob = await response.blob();
            const file = new File([blob], 'chain-link-results.png', { type: 'image/png' });
            
            // Check if Web Share API Level 2 is supported (for sharing files)
            if (navigator.canShare && navigator.canShare({ files: [file] })) {
                await navigator.share({
                    files: [file],
                    title: 'Chain Link Results',
                });
            } else if (navigator.share) {
                // Fallback to basic Web Share API
                await navigator.share({
                    title: 'Chain Link Results',
                    text: generateShareText()
                });
            } else {
                // Fallback for desktop: download the image
                const link = document.createElement('a');
                link.download = 'chain-link-results.png';
                link.href = imageUrl;
                link.click();
                
                const button = event.target;
                button.textContent = 'Saved!';
                setTimeout(() => {
                    button.textContent = button === shareBtn ? 'Share' : 'Share Results';
                }, 2000);
            }
        } catch (err) {
            console.error('Error sharing:', err);
            const button = event.target;
            button.textContent = 'Error';
            setTimeout(() => {
                button.textContent = button === shareBtn ? 'Share' : 'Share Results';
            }, 2000);
        }
    };
    
    // Setup close button handler
    closeBtn.onclick = () => {
        scoreDisplay.style.display = 'none';
        // Show the persistent share button when modal is closed
        shareResultsBtn.style.display = 'block';
    };
    
    // Setup share buttons handlers
    shareBtn.onclick = shareResults;
    shareResultsBtn.onclick = shareResults;
    
    // Auto-fade after 5 seconds
    setTimeout(() => {
        scoreDisplay.classList.add('fade-out');
        setTimeout(() => {
            scoreDisplay.style.display = 'none';
            scoreDisplay.classList.remove('fade-out');
            // Show the persistent share button when modal fades out
            shareResultsBtn.style.display = 'block';
        }, 500);
    }, 5000);
}

function startNewGame() {
    // Reset all game state
    totalScore = 0;
    currentWordScore = 20;
    wrongGuesses = 0;
    wordScores = [];
    currentGuess = '';
    revealedLetters = 1;
    chainHistory = [];
    currentWord = null;
    completeChain = [];
    
    const game = games[Math.floor(Math.random() * games.length)];
    const firstFiveKeys = Object.keys(game.chains).slice(0, 5); 
    validChains = {};

    firstFiveKeys.forEach(key => {
        validChains[key.toLowerCase()] = game.chains[key].map(v => v.toLowerCase());
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
    
    // Hide share results button when starting new game
    const shareResultsBtn = document.getElementById('share-results-btn');
    shareResultsBtn.style.display = 'none';
    
    updateGrid();
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
    const mobileInput = document.getElementById('mobile-input');
    const helpBtn = document.getElementById('help-btn');
    const modal = document.getElementById('how-to-play-modal');
    const modalOverlay = document.getElementById('modal-overlay');
    const closeModalBtn = document.getElementById('close-modal-btn');
    const gotItBtn = document.getElementById('got-it-btn');
    const newGameBtn = document.getElementById('new-game-btn');
    const isMobile = /mobile|android|iphone/i.test(navigator.userAgent);
    
    // Focus input when grid is clicked (for mobile)
    document.getElementById('word-grid').addEventListener('click', () => {
        if (isMobile) {
            mobileInput.focus();
        }
    });

    // Handle mobile input
    if (isMobile) {
        mobileInput.addEventListener('input', (e) => {
            const value = e.target.value.toLowerCase();
            if (value) {
                handleKey(value[value.length - 1]);
                mobileInput.value = ''; // Clear input after handling
            }
        });

        mobileInput.addEventListener('keydown', (e) => {
            if (e.key === 'Enter') {
                e.preventDefault();
                handleKey('enter');
            } else if (e.key === 'Backspace') {
                handleKey('backspace');
            }
        });
    } else {
        // Setup keyboard input handling for desktop only
        document.addEventListener('keydown', (e) => {
            if (e.key === 'Enter') {
                e.preventDefault();
                handleKey('enter');
            } else if (e.key === 'Backspace') {
                handleKey('backspace');
            } else if (/^[a-z]$/.test(e.key.toLowerCase())) {
                handleKey(e.key.toLowerCase());
            }
        });
    }

    function showModal() {
        modal.style.display = 'block';
        modalOverlay.style.display = 'block';
        createExampleGrid();
        if (isMobile) {
            mobileInput.blur();
        }
    }

    function hideModal() {
        modal.style.display = 'none';
        modalOverlay.style.display = 'none';
        if (isMobile) {
            mobileInput.focus();
        }
    }

    // Setup modal event listeners
    helpBtn.addEventListener('click', showModal);
    closeModalBtn.addEventListener('click', hideModal);
    gotItBtn.addEventListener('click', hideModal);
    modalOverlay.addEventListener('click', hideModal);
    newGameBtn.addEventListener('click', () => {
        startNewGame();
        if (isMobile) {
            mobileInput.focus();
        }
    });

    // Start game
    startNewGame();
    createExampleGrid();
    
    // Focus input for mobile
    if (isMobile) {
        mobileInput.focus();
    }

    // Start timer
    setInterval(updateTimer, 1000);
    updateTimer();
}); 