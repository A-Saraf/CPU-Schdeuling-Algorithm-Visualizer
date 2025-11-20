// ---------- GLOBAL STORAGE ----------
let processes = [];
const colors = ["var(--color1)", "var(--color2)", "var(--color3)", "var(--color4)", "var(--color5)", "var(--color6)"];

// ---------- ADD PROCESS ----------
document.getElementById("process-form").addEventListener("submit", (e) => {
    e.preventDefault();
    const pid = document.getElementById("pid").value;
    const at = parseInt(document.getElementById("arrival").value);
    const bt = parseInt(document.getElementById("burst").value);
    const pr = parseInt(document.getElementById("priority").value) || 0;

    processes.push({ pid, arrival: at, burst: bt, priority: pr });
    alert("Process added!");
    e.target.reset();
});

// ---------- RUN SIMULATION ----------
document.getElementById("run-btn").addEventListener("click", () => {
    const algo = document.getElementById("algorithm").value;
    const quantum = parseInt(document.getElementById("quantum").value);

    let result = [];

    switch (algo) {
        case "fcfs": result = fcfs(processes); break;
        case "sjf-non": result = sjfNonPreemptive(processes); break;
        case "sjf-pre": result = sjfPreemptive(processes); break;
        case "priority-non": result = priorityNon(processes); break;
        case "priority-pre": result = priorityPre(processes); break;
        case "rr": result = roundRobin(processes, quantum); break;
    }

    renderGantt(result.timeline);
    renderTable(result.stats);
});

// ---------- FCFS ----------
function fcfs(proc) {
    let time = 0;
    let timeline = [];
    let stats = [];

    let sorted = [...proc].sort((a, b) => a.arrival - b.arrival);

    sorted.forEach((p) => {
        if (time < p.arrival) time = p.arrival;
        let start = time;
        time += p.burst;
        let end = time;

        timeline.push({ pid: p.pid, start, end });

        stats.push({
            pid: p.pid,
            arrival: p.arrival,
            burst: p.burst,
            ct: end,
            tat: end - p.arrival,
            wt: start - p.arrival,
            rt: start - p.arrival
        });
    });

    return { timeline, stats };
}

// ---------- SJF NON-PREEMPTIVE ----------
function sjfNonPreemptive(proc) {
    let time = 0;
    let completed = 0;
    let n = proc.length;
    let visited = new Array(n).fill(false);
    let timeline = [];
    let stats = [];

    while (completed < n) {
        let idx = -1;
        let minBT = Infinity;

        proc.forEach((p, i) => {
            if (!visited[i] && p.arrival <= time && p.burst < minBT) {
                idx = i;
                minBT = p.burst;
            }
        });

        if (idx === -1) { time++; continue; }

        let p = proc[idx];
        visited[idx] = true;

        let start = time;
        time += p.burst;
        let end = time;

        timeline.push({ pid: p.pid, start, end });

        stats.push({
            pid: p.pid,
            arrival: p.arrival,
            burst: p.burst,
            ct: end,
            tat: end - p.arrival,
            wt: start - p.arrival,
            rt: start - p.arrival
        });

        completed++;
    }

    return { timeline, stats };
}

// ---------- GANTT CHART RENDER ----------
function renderGantt(timeline) {
    const gantt = document.getElementById("gantt-chart");
    gantt.innerHTML = "";

    timeline.forEach((block, i) => {
        let div = document.createElement("div");
        div.className = "gantt-block";
        div.style.background = colors[i % colors.length];
        div.style.width = (block.end - block.start) * 25 + "px";
        div.innerText = block.pid + "\n" + block.start + "→" + block.end;
        gantt.appendChild(div);
    });
}

// ---------- STATS TABLE RENDER ----------
function renderTable(stats) {
    const tbody = document.querySelector("#stats-table tbody");
    tbody.innerHTML = "";

    stats.forEach((s) => {
        let row = document.createElement("tr");
        row.innerHTML = `
            <td>${s.pid}</td>
            <td>${s.arrival}</td>
            <td>${s.burst}</td>
            <td>${s.ct}</td>
            <td>${s.tat}</td>
            <td>${s.wt}</td>
            <td>${s.rt}</td>
        `;
        tbody.appendChild(row);
    });
}
