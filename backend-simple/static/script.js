// static/script.js

document.addEventListener('DOMContentLoaded', function() {
    var gameDiv = document.getElementById('game');
    var remaining_time = parseInt(gameDiv.getAttribute('data-remaining-time'));
    var answerInput = document.querySelector('.answer');
    var timerElement = document.getElementById('timer');
    var scoreElement = document.getElementById('score');
    var problemElement = document.getElementById('problem');

    startCountdown(remaining_time, timerElement);
    setupAutomaticChecking(answerInput, problemElement, scoreElement);
});

function startCountdown(remaining_time, timerElement) {
    function countdown() {
        if (remaining_time <= 0) {
            window.location.href = '/result'; // Navigate to result page when time is up
        } else {
            timerElement.innerText = remaining_time;
            remaining_time -= 1;
            setTimeout(countdown, 1000);
        }
    }
    countdown();
}

function setupAutomaticChecking(answerInput, problemElement, scoreElement) {
    var isSubmitting = false; // Flag to prevent multiple submissions

    answerInput.addEventListener('input', function() {
        if (isSubmitting) return; // Prevent if already submitting

        var userAnswer = answerInput.value.trim();

        // Only proceed if userAnswer is not empty and is a valid number
        if (userAnswer !== '' && !isNaN(userAnswer)) {
            // Optionally, implement a small delay to avoid too many requests
            clearTimeout(answerInput.timer);
            answerInput.timer = setTimeout(function() {
                isSubmitting = true;
                submitAnswer(userAnswer, function(response) {
                    if (response.correct) {
                        // Provide visual feedback
                        flashCorrect();

                        // Update the score and problem
                        scoreElement.innerText = response.score;
                        problemElement.innerText = response.problem;

                        // Clear the input for the next problem
                        answerInput.value = '';
                    }
                    isSubmitting = false;
                });
            }, 300); // 300ms delay
        }
    });
}

function submitAnswer(answer, callback) {
    fetch('/submit_answer', {
        method: 'POST',
        headers: {
            'Content-Type': 'application/json',
            'X-Requested-With': 'XMLHttpRequest' // Optional, but good practice
        },
        body: JSON.stringify({ answer: answer })
    })
    .then(response => response.json())
    .then(data => {
        if (data.redirect) {
            window.location.href = data.redirect;
        } else {
            callback(data);
        }
    })
    .catch(error => {
        console.error('Error:', error);
    });
}

function flashCorrect() {
    var answerInput = document.querySelector('.answer');
    answerInput.classList.add('correct');
    setTimeout(function() {
        answerInput.classList.remove('correct');
    }, 300); // Remove the class after 300ms
}
