from flask import Flask, render_template, request, redirect, url_for, session
import random
import time

app = Flask(__name__)
app.secret_key = 'your_secret_key'  # Replace with your secret key

@app.after_request
def set_csp(response):
    response.headers['Content-Security-Policy'] = "default-src 'self'; script-src 'self'; style-src 'self';"
    return response

@app.route('/', methods=['GET', 'POST'])
def index():
    if request.method == 'POST':
        # Get selected operations
        operations = []
        if 'add' in request.form:
            operations.append('add')
        if 'sub' in request.form:
            operations.append('sub')
        if 'mul' in request.form:
            operations.append('mul')
        if 'div' in request.form:
            operations.append('div')

        # Get number ranges
        add_left_min = int(request.form.get('add_left_min', 2))
        add_left_max = int(request.form.get('add_left_max', 100))
        add_right_min = int(request.form.get('add_right_min', 2))
        add_right_max = int(request.form.get('add_right_max', 100))

        mul_left_min = int(request.form.get('mul_left_min', 2))
        mul_left_max = int(request.form.get('mul_left_max', 12))
        mul_right_min = int(request.form.get('mul_right_min', 2))
        mul_right_max = int(request.form.get('mul_right_max', 100))

        # Get duration
        duration = int(request.form.get('duration', 120))
        session['duration'] = duration


        session['operations'] = operations
        session['add_range'] = (add_left_min, add_left_max, add_right_min, add_right_max)
        session['mul_range'] = (mul_left_min, mul_left_max, mul_right_min, mul_right_max)
        session['duration'] = duration

        # Initialize game state
        session['score'] = 0
        session['problems_answered'] = 0
        session['start_time'] = time.time()
        session['problem'], session['answer'] = generate_problem()

        return redirect(url_for('game'))
    return render_template('index.html')



@app.route('/game', methods=['GET', 'POST'])
def game():
    if 'start_time' not in session:
        return redirect(url_for('index'))

    elapsed_time = time.time() - session['start_time']
    remaining_time = session['duration'] - int(elapsed_time)

    if remaining_time <= 0:
        return redirect(url_for('result'))

    if request.method == 'POST':
        user_answer = request.form.get('answer')
        if user_answer:
            try:
                user_answer = float(user_answer)
                correct_answer = session.get('answer')
                if abs(user_answer - correct_answer) < 1e-6:
                    session['score'] += 1
                session['problems_answered'] += 1
            except ValueError:
                pass  # Invalid input, treat as incorrect
        # Generate new problem
        session['problem'], session['answer'] = generate_problem()

    return render_template('game.html',problem=session['problem'],remaining_time=remaining_time,score=session['score']
)

@app.route('/result')
def result():
    score = session.get('score', 0)
    problems_answered = session.get('problems_answered', 0)
    session.clear()
    return render_template('result.html', score=score, problems_answered=problems_answered)

def generate_problem():
    operations = session.get('operations', ['add', 'sub', 'mul', 'div'])
    op = random.choice(operations)
    if op == 'add':
        add_left_min, add_left_max, add_right_min, add_right_max = session.get('add_range', (2, 100, 2, 100))
        a = random.randint(add_left_min, add_left_max)
        b = random.randint(add_right_min, add_right_max)
        problem = f"{a} + {b}"
        answer = a + b
    elif op == 'sub':
        add_left_min, add_left_max, add_right_min, add_right_max = session.get('add_range', (2, 100, 2, 100))
        a = random.randint(add_left_min, add_left_max)
        b = random.randint(add_right_min, add_right_max)
        if b > a:
            a, b = b, a
        problem = f"{a} - {b}"
        answer = a - b
    elif op == 'mul':
        mul_left_min, mul_left_max, mul_right_min, mul_right_max = session.get('mul_range', (2, 12, 2, 100))
        a = random.randint(mul_left_min, mul_left_max)
        b = random.randint(mul_right_min, mul_right_max)
        problem = f"{a} × {b}"
        answer = a * b
    elif op == 'div':
        mul_left_min, mul_left_max, mul_right_min, mul_right_max = session.get('mul_range', (2, 12, 2, 100))
        b = random.randint(mul_left_min, mul_left_max)
        answer = random.randint(mul_right_min, mul_right_max)
        a = b * answer
        problem = f"{a} ÷ {b}"
    else:
        # Default to addition
        a = random.randint(2, 100)
        b = random.randint(2, 100)
        problem = f"{a} + {b}"
        answer = a + b
    return problem, answer


if __name__ == '__main__':
    app.run()
