// ---------------- Page Switching ----------------
function showPage(pageId) {
  document.querySelectorAll('.page').forEach(p => p.classList.remove('active'));
  document.getElementById(pageId).classList.add('active');

  if (pageId === "savings") loadSavings();
  if (pageId === "expenses") loadExpensesList();
  if (pageId === "analytics") loadAnalytics();
}

// ---------------- Savings ----------------
let savingsChart;

async function loadSavings() {
  try {
    const res = await fetch("/api/dashboard");
    const data = await res.json();

    // Update summary
    document.getElementById("summary-salary").textContent = data.income;
    document.getElementById("summary-expenses").textContent = data.expenses;
    document.getElementById("summary-savings").textContent = data.savings;
    document.getElementById("summary-potential").textContent = data.potential_savings;

    // Update progress bar
    let percent = data.income > 0 ? Math.round((data.savings / data.income) * 100) : 0;
    document.getElementById("savings-progress").style.width = percent + "%";
    document.getElementById("savings-percent").textContent = `You saved ${percent}% of your salary`;

    // Column chart
    const ctx = document.getElementById("savingsChart").getContext("2d");
    if (savingsChart) savingsChart.destroy();
    savingsChart = new Chart(ctx, {
      type: "bar",
      data: {
        labels: ["Salary", "Expenses", "Savings", "Potential Savings"],
        datasets: [{
          label: "Amount (₹)",
          data: [data.income, data.expenses, data.savings, data.potential_savings],
          backgroundColor: ["#3498db", "#e74c3c", "#27ae60", "#f1c40f"]
        }]
      },
      options: {
        plugins: { legend: { display: false } },
        scales: { y: { beginAtZero: true } }
      }
    });

  } catch (err) {
    console.error("Error loading savings:", err);
  }
}

// ---------------- Expenses ----------------
async function loadExpensesList() {
  try {
    const res = await fetch("/api/expenses");
    const expenses = await res.json();

    const list = document.getElementById("expense-list");
    list.innerHTML = "";
    let total = 0;

    expenses.forEach(exp => {
      const li = document.createElement("li");
      li.textContent = `${exp.title} - ₹${exp.amount}`;
      list.appendChild(li);
      total += exp.amount;
    });

    document.getElementById("total-expense").textContent = total;

    // Salary & remaining
    const dashRes = await fetch("/api/dashboard");
    const dash = await dashRes.json();
    const remaining = dash.income - total;

    let salaryInfo = document.getElementById("salary-info");
    if (!salaryInfo) {
      salaryInfo = document.createElement("p");
      salaryInfo.id = "salary-info";
      list.parentNode.appendChild(salaryInfo);
    }
    salaryInfo.innerHTML = `<b>Salary:</b> ₹${dash.income} | <b>Remaining:</b> ₹${remaining}`;
  } catch (err) {
    console.error("Error loading expenses:", err);
  }
}

// ---------------- Expense Form ----------------
document.getElementById("expense-form").addEventListener("submit", async (e) => {
  e.preventDefault();
  const formData = new FormData(e.target);
  await fetch("/add_expense", { method: "POST", body: formData });
  e.target.reset();
  loadExpensesList();
  loadSavings();
  loadAnalytics();
});

// ---------------- Salary Form ----------------
document.getElementById("salary-form").addEventListener("submit", async (e) => {
  e.preventDefault();
  const formData = new FormData(e.target);
  try {
    const res = await fetch("/set_salary", { method: "POST", body: formData });
    const data = await res.json();
    if (data.status === "success") {
      e.target.reset();
      loadExpensesList();
      loadSavings();
      loadAnalytics();
      alert("Salary updated to ₹" + data.salary);
    } else {
      alert("Failed to update salary: " + data.message);
    }
  } catch (err) {
    console.error("Error updating salary:", err);
    alert("Error updating salary");
  }
});

// ---------------- Clear All Expenses ----------------
document.getElementById("clear-expenses").addEventListener("click", async () => {
  if (confirm("Are you sure you want to clear all expenses?")) {
    const res = await fetch("/clear_expenses", { method: "POST" });
    const data = await res.json();
    if (data.status === "success") {
      loadExpensesList();
      loadSavings();
      loadAnalytics();
      alert("All expenses cleared!");
    } else {
      alert("Failed to clear expenses!");
    }
  }
});

// ---------------- Investments ----------------
function suggestInvestment() {
  document.getElementById("investment-suggestions").innerHTML = `
    <ul>
      <li>💹 30% in Mutual Funds</li>
      <li>📊 20% in Stocks</li>
      <li>🏦 20% in Fixed Deposits</li>
      <li>🪙 10% in Gold</li>
      <li>💼 20% keep in Savings Account</li>
    </ul>`;
}

// ---------------- Analytics ----------------
let analyticsChart;
async function loadAnalytics() {
  try {
    const dashRes = await fetch("/api/dashboard");
    const dashboardData = await dashRes.json();

    const res = await fetch("/api/expenses");
    const expenses = await res.json();

    const categories = {};
    expenses.forEach(exp => {
      categories[exp.title] = (categories[exp.title] || 0) + exp.amount;
    });

    if (analyticsChart) analyticsChart.destroy();

    const ctx = document.getElementById("analyticsChart").getContext("2d");
    analyticsChart = new Chart(ctx, {
      type: "pie",
      data: {
        labels: Object.keys(categories),
        datasets: [{ data: Object.values(categories), backgroundColor: ["#e74c3c","#3498db","#2ecc71","#f1c40f","#9b59b6","#34495e"] }]
      },
      options: { plugins: { legend: { position: "bottom" } } }
    });

    const totalExpenses = Object.values(categories).reduce((a,b)=>a+b,0);
    document.getElementById("remaining-salary").textContent = dashboardData.income - totalExpenses;

  } catch(err) {
    console.error("Error loading analytics:", err);
  }
}

// ---------------- Initial Load ----------------
document.addEventListener("DOMContentLoaded", () => {
  loadSavings();
  loadExpensesList();
  loadAnalytics();
});

document.addEventListener("DOMContentLoaded", function () {
    let ctx = document.getElementById("budgetChart").getContext("2d");

    new Chart(ctx, {
        type: "pie", // or "doughnut", "bar"
        data: {
            labels: ["Rent (15%)", "Groceries (5%)", "Savings (50%)", "Investments (30%)"],
            datasets: [{
                data: [7500, 2500, 25000, 15000], // Example for ₹50,000 salary
                backgroundColor: ["#ff6384", "#36a2eb", "#4bc0c0", "#ffcd56"]
            }]
        },
        options: {
            responsive: true,
            plugins: {
                legend: { position: "bottom" }
            }
        }
    });
});
