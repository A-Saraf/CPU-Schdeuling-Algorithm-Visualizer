class Scheduler {
    constructor() {
        this.processes = [];
        this.timeline = [];
        this.metrics = null;

        this.initElements();
        this.attachEvents();
        this.injectCPUSVGGradient();
        this.setupCPUInitial();
    }

    /* ----------------------------------------------
       INITIAL ELEMENT BINDING
    ----------------------------------------------*/
    initElements() {
        this.algorithmSelect = document.getElementById("algorithmSelect");
        this.timeQuantumInput = document.getElementById("timeQuantum");
        this.timeQuantumCard = document.getElementById("timeQuantumCard");

        this.addBtn = document.getElementById("addBtn");
        this.runBtn = document.getElementById("runBtn");
        this.resetBtn = document.getElementById("resetBtn");
        this.clearAllBtn = document.getElementById("clearAllBtn");

        this.processIdInput = document.getElementById("processId");
        this.arrivalTimeInput = document.getElementById("arrivalTime");
        this.burstTimeInput = document.getElementById("burstTime");
        this.priorityInput = document.getElementById("priority");
        this.priorityLabel = document.getElementById("priorityLabel");

        this.processList = document.getElementById("processList");

        this.ganttContainer = document.getElementById("ganttContainer");
        this.ganttPlaceholder = document.getElementById("ganttPlaceholder");

        this.avgWaitEl = document.getElementById("avgWait");
        this.avgTurnEl = document.getElementById("avgTurnaround");
        this.totalTimeEl = document.getElementById("totalTime");
        this.totalTATEl = document.getElementById("totalTAT");

        this.avgWaitBar = document.getElementById("avgWaitBar");
        this.avgTurnBar = document.getElementById("avgTurnBar");

        this.cpuProgress = document.getElementById("cpuProgress");
        this.cpuPercent = document.getElementById("cpuPercent");

        this.executionDetails = document.getElementById("executionDetails");
    }

    /* ----------------------------------------------
       EVENT LISTENERS
    ----------------------------------------------*/
    attachEvents() {
        this.algorithmSelect.addEventListener("change", () => this.handleAlgorithmChange());
        this.addBtn.addEventListener("click", () => this.addProcess());
        this.runBtn.addEventListener("click", () => this.run());
        this.resetBtn.addEventListener("click", () => this.reset());
        this.clearAllBtn.addEventListener("click", () => this.clearAll());

        this.processIdInput.addEventListener("keypress", (e) => {
            if (e.key === "Enter") this.addProcess();
        });
    }

    handleAlgorithmChange() {
    const algo = this.algorithmSelect.value;

    // Show Time Quantum only for Round Robin
    this.timeQuantumCard.style.display =
        (algo === "RoundRobin") ? "block" : "none";

    // Show Priority ONLY for Priority Scheduling
    const showPriority = (algo === "Priority");
    this.priorityInput.style.display = showPriority ? "block" : "none";
    this.priorityLabel.style.display = showPriority ? "block" : "none";

    this.renderProcesses();
}


    /* ----------------------------------------------
       PROCESS MANAGEMENT
    ----------------------------------------------*/
    clearAll() {
        this.processes = [];
        this.renderProcesses();
        this.reset();
    }

    addProcess() {
        const id = this.processIdInput.value.trim();
        const arrival = parseInt(this.arrivalTimeInput.value) || 0;
        const burst = parseInt(this.burstTimeInput.value) || 1;
        const priority = parseInt(this.priorityInput.value) || 1;

        if (!id) return alert("Please provide a Process ID.");
        if (this.processes.some(p => p.id === id)) return alert("Process ID already exists.");
        if (burst <= 0) return alert("Burst Time must be at least 1.");

        this.processes.push({ id, arrival, burst, priority });

        this.processIdInput.value = "";
        this.arrivalTimeInput.value = "0";
        this.burstTimeInput.value = "1";
        this.priorityInput.value = "1";

        this.renderProcesses();
    }

    deleteProcess(id) {
        this.processes = this.processes.filter(p => p.id !== id);
        this.renderProcesses();
    }

    renderProcesses() {
        this.processList.innerHTML = "";

        if (this.processes.length === 0) {
            this.processList.innerHTML = `<p class="placeholder-text">No processes added</p>`;
            this.clearAllBtn.style.display = "none";
            return;
        }

        this.clearAllBtn.style.display = "block";
        const isPriority = this.algorithmSelect.value === "Priority";

        this.processes.forEach(p => {
            const div = document.createElement("div");
            div.className = "process-item";

            const detail =
                `AT:${p.arrival} • BT:${p.burst}` +
                (isPriority ? ` • P:${p.priority}` : "");

            div.innerHTML = `
              <div>
                <div class="process-id">${p.id}</div>
                <div class="process-details">${detail}</div>
              </div>
              <button class="btn btn-danger" onclick="scheduler.deleteProcess('${p.id}')">✕</button>
            `;

            this.processList.appendChild(div);
        });
    }

    /* ----------------------------------------------
       SCHEDULING ALGORITHMS (FIXED)
    ----------------------------------------------*/

    fcfs() {
        const result = [];
        const sorted = [...this.processes].sort((a, b) => a.arrival - b.arrival);
        let time = 0;

        for (const p of sorted) {
            if (time < p.arrival) {
                result.push({ process: "IDLE", start: time, end: p.arrival });
                time = p.arrival;
            }

            result.push({ process: p.id, start: time, end: time + p.burst, arrival: p.arrival });
            time += p.burst;
        }

        return result;
    }

    sjf() {
        const result = [];
        const remaining = [...this.processes];
        let time = 0;

        while (remaining.length > 0) {
            const available = remaining.filter(p => p.arrival <= time);

            if (available.length === 0) {
                const nextArrival = Math.min(...remaining.map(p => p.arrival));
                result.push({ process: "IDLE", start: time, end: nextArrival });
                time = nextArrival;
                continue;
            }

            const p = available.reduce((a, b) => a.burst < b.burst ? a : b);
            result.push({ process: p.id, start: time, end: time + p.burst, arrival: p.arrival });
            time += p.burst;
            remaining.splice(remaining.indexOf(p), 1);
        }

        return result;
    }

    priority() {
        const result = [];
        const remaining = [...this.processes];
        let time = 0;

        while (remaining.length > 0) {
            const available = remaining.filter(p => p.arrival <= time);

            if (available.length === 0) {
                const nextArrival = Math.min(...remaining.map(p => p.arrival));
                result.push({ process: "IDLE", start: time, end: nextArrival });
                time = nextArrival;
                continue;
            }

            const p = available.reduce((a, b) => a.priority < b.priority ? a : b);
            result.push({ process: p.id, start: time, end: time + p.burst, arrival: p.arrival });
            time += p.burst;
            remaining.splice(remaining.indexOf(p), 1);
        }

        return result;
    }

    srtf() {
        const procs = this.processes.map(p => ({ ...p, remaining: p.burst }));
        const result = [];
        let time = 0;
        let active = null;
        let startTime = 0;

        while (procs.some(p => p.remaining > 0)) {
            const available = procs.filter(p => p.arrival <= time && p.remaining > 0);

            if (available.length === 0) {
                const nextArrival = Math.min(...procs.filter(p => p.remaining > 0).map(p => p.arrival));
                result.push({ process: "IDLE", start: time, end: nextArrival });
                time = nextArrival;
                continue;
            }

            const shortest = available.reduce((a, b) => a.remaining < b.remaining ? a : b);

            if (active !== shortest) {
                if (active !== null) {
                    result.push({ process: active.id, start: startTime, end: time });
                }
                active = shortest;
                startTime = time;
            }

            active.remaining--;
            time++;

            if (active.remaining === 0) {
                result.push({ process: active.id, start: startTime, end: time, arrival: active.arrival });
                active = null;
            }
        }

        return result;
    }

    roundRobin(tq) {
        const result = [];
        const queue = [];
        const procs = this.processes.map(p => ({ ...p, remaining: p.burst }));
        let time = 0;

        while (queue.length > 0 || procs.some(p => p.remaining > 0)) {
            procs.filter(p => p.arrival === time).forEach(p => queue.push(p));

            if (queue.length === 0) {
                time++;
                continue;
            }

            const p = queue.shift();
            const exec = Math.min(tq, p.remaining);

            result.push({ process: p.id, start: time, end: time + exec, arrival: p.arrival });
            time += exec;
            p.remaining -= exec;

            procs.filter(px => px.arrival <= time && px.remaining > 0 && !queue.includes(px))
                 .forEach(px => queue.push(px));

            if (p.remaining > 0) queue.push(p);
        }

        return result;
    }

    /* ----------------------------------------------
       RUN
    ----------------------------------------------*/
    run() {
        if (this.processes.length === 0) return alert("Please add at least one process.");

        const algo = this.algorithmSelect.value;

        if (algo === "FCFS") this.timeline = this.fcfs();
        else if (algo === "SJF") this.timeline = this.sjf();
        else if (algo === "Priority") this.timeline = this.priority();
        else if (algo === "SRTF") this.timeline = this.srtf();
        else this.timeline = this.roundRobin(parseInt(this.timeQuantumInput.value) || 2);

        this.calculateMetrics();
        this.renderGantt();
        this.updateMetrics();
        this.renderExecutionDetails();
    }

    /* ----------------------------------------------
       METRICS
    ----------------------------------------------*/
    calculateMetrics() {
        const completion = {};
        this.timeline.forEach(item => {
            if (item.process !== "IDLE") completion[item.process] = item.end;
        });

        let totalWait = 0;
        let totalTurn = 0;

        this.processes.forEach(p => {
            const c = completion[p.id];
            const tat = c - p.arrival;
            const wt = tat - p.burst;
            totalWait += wt;
            totalTurn += tat;
        });

        const totalTime = Math.max(...this.timeline.map(t => t.end));
        const totalBurst = this.processes.reduce((s, p) => s + p.burst, 0);

        this.metrics = {
            avgWait: totalWait / this.processes.length,
            avgTurn: totalTurn / this.processes.length,
            totalTime,
            totalTurnSum: totalTurn,
            cpuUtil: (totalBurst / totalTime) * 100
        };
    }

    renderGantt() {
    if (!this.timeline.length) {
        this.ganttPlaceholder.style.display = "flex";
        this.ganttContainer.innerHTML = "";
        this.ganttContainer.appendChild(this.ganttPlaceholder);
        return;
    }

    this.ganttPlaceholder.style.display = "none";

    const maxTime = Math.max(...this.timeline.map(t => t.end));
    const colors = ["c0", "c1", "c2", "c3", "c4", "c5"];

    /* -------- GANTT BARS -------- */
    const chart = document.createElement("div");
    chart.className = "gantt-chart";

    this.timeline.forEach((item, i) => {
        const bar = document.createElement("div");
        const width = ((item.end - item.start) / maxTime) * 100;
        bar.style.width = width + "%";

        if (item.process === "IDLE") {
            bar.className = "gantt-bar idle-bar";
            bar.textContent = "IDLE";
        } else {
            bar.className = `gantt-bar ${colors[i % colors.length]}`;
            bar.textContent = item.process;
        }

        chart.appendChild(bar);
    });

    /* -------- TIME AXIS -------- */
    const axis = document.createElement("div");
    axis.className = "time-axis";

    for (let t = 0; t <= maxTime; t++) {
        const marker = document.createElement("div");
        marker.className = "time-marker";
        marker.style.left = `${(t / maxTime) * 100}%`;
        marker.textContent = t;
        axis.appendChild(marker);
    }

    /* -------- RENDER -------- */
    this.ganttContainer.innerHTML = "";
    this.ganttContainer.appendChild(chart);
    this.ganttContainer.appendChild(axis);
}


    updateMetrics() {
        this.avgWaitEl.textContent = this.metrics.avgWait.toFixed(2);
        this.avgTurnEl.textContent = this.metrics.avgTurn.toFixed(2);
        this.totalTimeEl.textContent = this.metrics.totalTime;
        this.totalTATEl.textContent = this.metrics.totalTurnSum;

        this.avgWaitBar.style.width = "100%";
        this.avgTurnBar.style.width = "100%";

        const cpu = Math.round(this.metrics.cpuUtil);
        this.cpuPercent.textContent = cpu + "%";

        const r = 45;
        const circ = 2 * Math.PI * r;
        this.cpuProgress.style.strokeDasharray = `${circ} ${circ}`;
        this.cpuProgress.style.strokeDashoffset = circ * (1 - cpu / 100);
    }

    injectCPUSVGGradient() {
        const defs = `
        <svg width="0" height="0">
          <defs>
            <linearGradient id="cpuGrad" x1="0%" x2="100%">
              <stop offset="0%" stop-color="#5b9cff"/>
              <stop offset="100%" stop-color="#8b5cf6"/>
            </linearGradient>
          </defs>
        </svg>`;
        document.body.insertAdjacentHTML("afterbegin", defs);
    }

    setupCPUInitial() {
        const r = 45;
        const circ = 2 * Math.PI * r;
        this.cpuProgress.style.strokeDasharray = `${circ} ${circ}`;
        this.cpuProgress.style.strokeDashoffset = circ;
    }

    renderExecutionDetails() {
        const completion = {};
        this.timeline.forEach(t => {
            if (t.process !== "IDLE") completion[t.process] = t.end;
        });

        let html = `
        <table class="execution-table">
          <thead>
            <tr>
              <th>Process</th><th>AT</th><th>BT</th>
              <th>Start</th><th>End</th>
              <th>Waiting</th><th>Turnaround</th>
            </tr>
          </thead>
          <tbody>`;

        this.processes.forEach(p => {
            const comp = completion[p.id];
            const tat = comp - p.arrival;
            const wt = tat - p.burst;

            const firstStart =
                this.timeline.find(t => t.process === p.id)?.start ?? "-";

            html += `
            <tr>
              <td>${p.id}</td>
              <td>${p.arrival}</td>
              <td>${p.burst}</td>
              <td>${firstStart}</td>
              <td>${comp}</td>
              <td>${wt}</td>
              <td>${tat}</td>
            </tr>`;
        });

        html += `</tbody></table>`;
        this.executionDetails.innerHTML = html;
    }

    reset() {
        this.timeline = [];
        this.ganttContainer.innerHTML = "";
        this.ganttContainer.appendChild(this.ganttPlaceholder);
        this.ganttPlaceholder.style.display = "flex";
        this.cpuPercent.textContent = "0%";
        this.setupCPUInitial();
    }
}

let scheduler;
document.addEventListener("DOMContentLoaded", () => {
    scheduler = new Scheduler();
});
