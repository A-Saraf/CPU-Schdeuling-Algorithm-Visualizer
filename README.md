# 🖥️ CPU Scheduling Visualizer

An interactive **web-based CPU Scheduling Algorithm Visualizer** that helps students understand and compare different CPU scheduling algorithms using **Gantt charts**, **execution tables**, and **performance metrics**.

Designed for **Operating Systems labs, coursework, and conceptual learning**.

---

## ✨ Features

- 📊 **Dynamic Gantt Chart**
  - Correctly aligned with arrival times
  - Displays **CPU idle time**
  - Animated execution blocks

- 🧠 **Supported Algorithms**
  - FCFS (First Come First Served)
  - SJF (Shortest Job First – Non-Preemptive)
  - SRTF (Shortest Remaining Time First – Preemptive)
  - Priority Scheduling
  - Round Robin (with Time Quantum)

- 📈 **Performance Metrics**
  - Average Waiting Time
  - Average Turnaround Time
  - CPU Utilization
  - Total Execution Time

- 📋 **Execution Details Table**
  - Arrival Time
  - Burst Time
  - Start Time
  - Completion Time
  - Waiting Time
  - Turnaround Time

- 🎨 **Modern UI**
  - Dark theme
  - Responsive layout
  - Clean and intuitive controls

---

## 🛠️ Tech Stack

| Technology | Usage |
|-----------|------|
| HTML5 | UI structure |
| CSS3 | Styling & dark theme |
| JavaScript (ES6) | Scheduling logic & visualization |

> No external libraries or frameworks used.

---

## 📂 Project Structure

```text
CPU-Scheduling-Visualizer/
│
├── index.html        # Main UI layout
├── style.css         # Styling and theme
├── scheduler.js      # Scheduling algorithms & logic
└── README.md         # Project documentation
