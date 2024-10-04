const startButton = document.getElementById('start-button');
const restartButton = document.getElementById('restart-button');
const answerInput = document.getElementById('answer');
const timeElement = document.getElementById('time');
const scoreElement = document.getElementById('current-score');
const finalScoreElement = document.getElementById('final-score');
const gameOverElement = document.getElementById('game-over');
const feedbackElement = document.getElementById('feedback');
const settingsElement = document.getElementById('settings');
const gameElement = document.getElementById('game');
const repeatButton = document.getElementById('repeat-button');
const digitCountSelect = document.getElementById('digit-count');
const operationCheckboxes = document.querySelectorAll('.operation');
const problemElement = document.getElementById('problem');
const enableTextCheckbox = document.getElementById('enable-text');
const enableSpeechCheckbox = document.getElementById('enable-speech');

let timeLeft = 60;
let score = 0;
let currentProblem;
let timerInterval;
let selectedOperators = [];
let digitCount = 1;
let enableText = true;
let enableSpeech = true;
let problemMode = 'text'; // 'text' or 'speech'

function startGame() {
    // Get settings
    digitCount = parseInt(digitCountSelect.value);
    selectedOperators = [];
    operationCheckboxes.forEach(checkbox => {
        if (checkbox.checked) {
            selectedOperators.push(checkbox.value);
        }
    });

    enableText = enableTextCheckbox.checked;
    enableSpeech = enableSpeechCheckbox.checked;

    if (selectedOperators.length === 0) {
        alert('Please select at least one operation.');
        return;
    }

    if (!enableText && !enableSpeech) {
        alert('Please enable at least one question presentation method (Text or Speech).');
        return;
    }

    settingsElement.style.display = 'none';
    gameElement.style.display = 'block';
    answerInput.style.display = 'block';
    answerInput.focus();
    score = 0;
    scoreElement.textContent = score;
    timeLeft = 60;
    timeElement.textContent = timeLeft;
    gameOverElement.style.display = 'none';
    feedbackElement.textContent = '';
    problemElement.style.display = 'none';
    repeatButton.style.display = 'none';

    generateProblem();

    timerInterval = setInterval(() => {
        timeLeft--;
        timeElement.textContent = timeLeft;
        if (timeLeft <= 0) {
            timeLeft = 0;
            timeElement.textContent = timeLeft;
            endGame();
        }
    }, 1000);
}

function generateProblem() {
    const maxNumber = Math.pow(10, digitCount) - 1;
    const minNumber = Math.pow(10, digitCount - 1);
    let num1 = Math.floor(Math.random() * (maxNumber - minNumber + 1)) + minNumber;
    let num2 = Math.floor(Math.random() * (maxNumber - minNumber + 1)) + minNumber;
    const operator = selectedOperators[Math.floor(Math.random() * selectedOperators.length)];
    let problemText;
    let solution;

    switch (operator) {
        case '+':
            problemText = `${num1} + ${num2}`;
            solution = num1 + num2;
            break;
        case '-':
            problemText = `${num1} - ${num2}`;
            solution = num1 - num2;
            break;
        case '×':
            problemText = `${num1} × ${num2}`;
            solution = num1 * num2;
            break;
        case '÷':
            solution = num1 / num2;
            num1 = num2 * solution;
            problemText = `${num1} ÷ ${num2}`;
            break;
    }

    currentProblem = { problemText, solution };
    answerInput.value = '';
    feedbackElement.textContent = '';

    // Determine problem presentation mode
    if (enableText && enableSpeech) {
        problemMode = Math.random() < 0.5 ? 'text' : 'speech';
    } else if (enableText) {
        problemMode = 'text';
    } else if (enableSpeech) {
        problemMode = 'speech';
    }

    if (problemMode === 'text') {
        problemElement.style.display = 'block';
        problemElement.textContent = currentProblem.problemText;
        repeatButton.style.display = 'none';
        window.speechSynthesis.cancel(); // Stop any ongoing speech
    } else if (problemMode === 'speech') {
        problemElement.style.display = 'none';
        speakProblem();
        repeatButton.style.display = 'inline-block';
    }
}

function speakProblem() {
    let speechText = currentProblem.problemText
        .replace('+', 'plus')
        .replace('-', 'minus')
        .replace('×', 'times')
        .replace('÷', 'divided by');

    const utterance = new SpeechSynthesisUtterance(speechText);
    window.speechSynthesis.speak(utterance);
}

function checkAnswer(event) {
    if (event.key === 'Enter') {
        const userAnswer = parseInt(answerInput.value.trim(), 10);
        if (userAnswer === currentProblem.solution) {
            score++;
            scoreElement.textContent = score;
            feedbackElement.textContent = '';
            generateProblem();
        } else {
            answerInput.value = '';
            feedbackElement.textContent = 'Incorrect, try again!';
        }
    }
}

function endGame() {
    clearInterval(timerInterval);
    answerInput.style.display = 'none';
    problemElement.style.display = 'none';
    repeatButton.style.display = 'none';
    gameOverElement.style.display = 'block';
    finalScoreElement.textContent = score;
    feedbackElement.textContent = '';
    window.speechSynthesis.cancel(); // Stop any ongoing speech

    // Send score to server
    fetch('/submit_score', {
        method: 'POST',
        headers: {
            'Content-Type': 'application/json'
        },
        body: JSON.stringify({ score: score })
    })
    .then(response => response.json())
    .then(data => {
        if (data.status !== 'success') {
            alert('Error submitting score: ' + data.message);
        }
    })
    .catch(error => {
        console.error('Error:', error);
    });
}

function repeatQuestion() {
    window.speechSynthesis.cancel(); // Stop any ongoing speech
    speakProblem();
}

startButton.addEventListener('click', startGame);
restartButton.addEventListener('click', () => {
    settingsElement.style.display = 'block';
    gameElement.style.display = 'none';
    answerInput.style.display = 'block';
    answerInput.value = '';
    feedbackElement.textContent = '';
    window.speechSynthesis.cancel();
});
answerInput.addEventListener('keydown', checkAnswer);
repeatButton.addEventListener('click', repeatQuestion);

