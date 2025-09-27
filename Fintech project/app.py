from flask import Flask, render_template, request, jsonify
import sqlite3

app = Flask(__name__)

# ---------- Database Helper ----------
def get_db():
    conn = sqlite3.connect("finance.db")
    conn.row_factory = sqlite3.Row
    return conn

# ---------- Home ----------
@app.route("/")
def index():
    return render_template("index.html")

# ---------- Profile ----------
@app.route("/api/profile")
def api_profile():
    conn = get_db()
    c = conn.cursor()
    c.execute("SELECT * FROM profile WHERE id=1")
    row = c.fetchone()
    conn.close()
    if row:
        return jsonify(dict(row))
    return jsonify({})

@app.route("/save_profile", methods=["POST"])
def save_profile():
    name = request.form.get("name")
    email = request.form.get("email")
    income = request.form.get("income")

    conn = get_db()
    c = conn.cursor()
    c.execute("""
        UPDATE profile SET name=?, email=?, income=? WHERE id=1
    """, (name, email, income))
    conn.commit()
    conn.close()

    return jsonify({"status": "success"})

# ---------- Salary ----------
@app.route("/set_salary", methods=["POST"])
def set_salary():
    salary = request.form.get("salary")
    if not salary:
        return jsonify({"status": "error", "message": "No salary provided"}), 400

    conn = get_db()
    c = conn.cursor()
    c.execute("UPDATE profile SET income=? WHERE id=1", (salary,))
    conn.commit()
    conn.close()

    return jsonify({"status": "success", "salary": salary})

@app.route("/api/salary")
def api_salary():
    conn = get_db()
    c = conn.cursor()
    c.execute("SELECT income FROM profile WHERE id=1")
    row = c.fetchone()
    conn.close()
    salary = row["income"] if row else 0
    return jsonify({"salary": salary})

# ---------- Expenses ----------
@app.route("/api/expenses")
def api_expenses():
    conn = get_db()
    c = conn.cursor()
    c.execute("SELECT * FROM expenses")
    rows = c.fetchall()
    conn.close()
    return jsonify([dict(r) for r in rows])

@app.route("/add_expense", methods=["POST"])
def add_expense():
    title = request.form.get("title")
    amount = request.form.get("amount")

    conn = get_db()
    c = conn.cursor()
    c.execute("INSERT INTO expenses (title, amount) VALUES (?, ?)", (title, amount))
    conn.commit()
    conn.close()

    return jsonify({"status": "success"})

@app.route("/delete_expense/<int:expense_id>", methods=["POST"])
def delete_expense(expense_id):
    conn = get_db()
    c = conn.cursor()
    c.execute("DELETE FROM expenses WHERE id=?", (expense_id,))
    conn.commit()
    conn.close()
    return jsonify({"status": "success"})

@app.route("/clear_expenses", methods=["POST"])
def clear_expenses():
    conn = get_db()
    c = conn.cursor()
    c.execute("DELETE FROM expenses")
    conn.commit()
    conn.close()
    return jsonify({"status": "success"})

# ---------- Dashboard ----------
@app.route("/api/dashboard")
def api_dashboard():
    conn = get_db()
    c = conn.cursor()

    c.execute("SELECT income FROM profile WHERE id=1")
    row = c.fetchone()
    income = row["income"] if row else 0

    c.execute("SELECT SUM(amount) as total FROM expenses")
    row = c.fetchone()
    total_expenses = row["total"] if row["total"] else 0

    savings = max(income - total_expenses, 0)
    potential_savings = income * 0.2

    conn.close()
    return jsonify({
        "income": income,
        "expenses": total_expenses,
        "savings": savings,
        "potential_savings": potential_savings
    })

# ---------- Init & Run ----------
if __name__ == "__main__":
    conn = get_db()
    c = conn.cursor()
    c.execute("""
        CREATE TABLE IF NOT EXISTS profile (
            id INTEGER PRIMARY KEY,
            name TEXT,
            email TEXT,
            income INTEGER
        )
    """)
    c.execute("""
        CREATE TABLE IF NOT EXISTS expenses (
            id INTEGER PRIMARY KEY AUTOINCREMENT,
            title TEXT,
            amount INTEGER
        )
    """)
    # Ensure one profile exists
    c.execute("SELECT id FROM profile WHERE id=1")
    if not c.fetchone():
        c.execute("INSERT INTO profile (id, name, email, income) VALUES (1, '', '', 30000)")
    conn.commit()
    conn.close()

    app.run(debug=True)

@app.route("/allocate_salary", methods=["POST"])
def allocate_salary():
    salary = float(request.form.get("salary", 0))

    allocations = {
        "Rent": round(salary * 0.15, 2),
        "Groceries": round(salary * 0.05, 2),
        "Savings": round(salary * 0.20, 2),
        "Investments": round(salary * 0.20, 2),
        "Emergency Fund": round(salary * 0.10, 2),
        "Lifestyle": round(salary * 0.30, 2)
    }

    conn = get_db()
    c = conn.cursor()

    # Create table if not exists
    c.execute("""
        CREATE TABLE IF NOT EXISTS budget_allocation (
            id INTEGER PRIMARY KEY AUTOINCREMENT,
            category TEXT,
            amount REAL
        )
    """)

    # Clear old data
    c.execute("DELETE FROM budget_allocation")

    # Insert new allocation
    for category, amount in allocations.items():
        c.execute("INSERT INTO budget_allocation (category, amount) VALUES (?, ?)", (category, amount))

    conn.commit()
    conn.close()

    return jsonify({"status": "success", "allocations": allocations})

