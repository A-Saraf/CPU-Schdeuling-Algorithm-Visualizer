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
        // this.sampleBtn = document.getElementById("sampleBtn");
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
        // this.sampleBtn.addEventListener("click", () => this.loadSample());
        this.clearAllBtn.addEventListener("click", () => this.clearAll());

        this.processIdInput.addEventListener("keypress", (e) => {
            if (e.key === "Enter") this.addProcess();
        });
    }

    handleAlgorithmChange() {
        const algo = this.algorithmSelect.value;

        // Show TQ only for RR
        this.timeQuantumCard.style.display = (algo === "RoundRobin") ? "block" : "none";

        // Show priority for ALL except FCFS
        const showPriority = (algo !== "FCFS");
        this.priorityInput.style.display = showPriority ? "block" : "none";
        this.priorityLabel.style.display = showPriority ? "block" : "none";


        this.renderProcesses();
    }

    /* ----------------------------------------------
       SAMPLE DATA
    ----------------------------------------------*/
    loadSample() {
        this.processes = [
            { id: "P1", arrival: 0, burst: 6, priority: 1 },
            { id: "P2", arrival: 2, burst: 4, priority: 2 },
            { id: "P3", arrival: 4, burst: 3, priority: 3 }
        ];
        this.renderProcesses();
    }

    /* ----------------------------------------------
       PROCESS MGMT
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
        if (this.processes.some((p) => p.id === id)) return alert("Process ID already exists.");
        if (burst <= 0) return alert("Burst Time must be at least 1.");

        this.processes.push({ id, arrival, burst, priority });

        this.processIdInput.value = "";
        this.arrivalTimeInput.value = "0";
        this.burstTimeInput.value = "1";
        this.priorityInput.value = "1";

        this.renderProcesses();
    }

    deleteProcess(id) {
        this.processes = this.processes.filter((p) => p.id !== id);
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

        this.processes.forEach((p) => {
            const div = document.createElement("div");
            div.className = "process-item";

            const detail = `AT:${p.arrival} • BT:${p.burst}` +
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
       ALGORITHMS
    ----------------------------------------------*/
    fcfs() {
        const result = [];
        const sorted = [...this.processes].sort((a, b) => a.arrival - b.arrival);
        let time = 0;

        for (const p of sorted) {
            if (time < p.arrival) time = p.arrival;
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
            const available = remaining.filter((p) => p.arrival <= time);

            if (available.length === 0) {
                time = Math.min(...remaining.map((p) => p.arrival));
                continue;
            }

            const p = available.reduce((min, cur) => cur.burst < min.burst ? cur : min);
            result.push({ process: p.id, start: time, end: time + p.burst, arrival: p.arrival });
            time += p.burst;

            remaining.splice(remaining.indexOf(p), 1);
        }

        return result;
    }

    srtf() {
        const procs = this.processes.map((p) => ({ ...p, remaining: p.burst }));
        const result = [];
        let time = 0;
        let active = null;
        let startTime = 0;

        while (procs.some((p) => p.remaining > 0)) {
            const available = procs.filter((p) => p.arrival <= time && p.remaining > 0);

            if (available.length === 0) {
                time = Math.min(...procs.filter((p) => p.remaining > 0).map((p) => p.arrival));
                continue;
            }

            const shortest = available.reduce((m, c) => c.remaining < m.remaining ? c : m);

            if (active !== shortest) {
                if (active !== null) {
                    result.push({ process: active.id, start: startTime, end: time });
                }
                active = shortest;
                startTime = time;
            }

            active.remaining -= 1;
            time++;

            if (active.remaining === 0) {
                result.push({ process: active.id, start: startTime, end: time, arrival: active.arrival });
                active = null;
            }
        }

        return result;
    }

    priority() {
        const result = [];
        const remaining = [...this.processes];
        let time = 0;

        while (remaining.length > 0) {
            const available = remaining.filter((p) => p.arrival <= time);

            if (available.length === 0) {
                time = Math.min(...remaining.map((p) => p.arrival));
                continue;
            }

            const highest = available.reduce((m, c) => c.priority < m.priority ? c : m);

            result.push({
                process: highest.id,
                start: time,
                end: time + highest.burst,
                arrival: highest.arrival
            });

            time += highest.burst;
            remaining.splice(remaining.indexOf(highest), 1);
        }

        return result;
    }

    roundRobin(tq) {
        const result = [];
        const queue = [];
        const procs = this.processes.map((p) => ({ ...p, remaining: p.burst }));
        let time = 0;

        while (queue.length > 0 || procs.some((p) => p.remaining > 0)) {
            const newArrivals = procs.filter((p) => p.arrival === time && p.remaining > 0);
            newArrivals.forEach((p) => queue.push(p));

            if (queue.length === 0) {
                time++;
                continue;
            }

            const p = queue.shift();
            const exec = Math.min(tq, p.remaining);

            result.push({ process: p.id, start: time, end: time + exec, arrival: p.arrival });

            p.remaining -= exec;
            time += exec;

            procs.forEach((px) => {
                if (px.arrival <= time && px.remaining > 0 && !queue.includes(px) && px !== p) {
                    queue.push(px);
                }
            });

            if (p.remaining > 0) queue.push(p);
        }

        return result;
    }

    /* ----------------------------------------------
       RUN SCHEDULER
    ----------------------------------------------*/
    run() {
        if (this.processes.length === 0) return alert("Please add at least one process.");

        const algo = this.algorithmSelect.value;

        switch (algo) {
            case "FCFS": this.timeline = this.fcfs(); break;
            case "SJF": this.timeline = this.sjf(); break;
            case "SRTF": this.timeline = this.srtf(); break;
            case "Priority": this.timeline = this.priority(); break;
            case "RoundRobin":
                this.timeline = this.roundRobin(parseInt(this.timeQuantumInput.value) || 2);
                break;
        }

        this.calculateMetrics();
        this.renderGantt();
        this.updateMetrics();
        this.renderExecutionDetails();
    }

    /* ----------------------------------------------
       METRICS CALCULATION
    ----------------------------------------------*/
    calculateMetrics() {
        const completion = {};

        this.timeline.forEach((item) => completion[item.process] = item.end);

        let totalWait = 0;
        let totalTurn = 0;

        this.processes.forEach((p) => {
            const c = completion[p.id];
            const tat = c - p.arrival;
            const wt = tat - p.burst;

            totalWait += wt;
            totalTurn += tat;
        });

        const totalTime = Math.max(...this.timeline.map((t) => t.end), 0);
        const totalBurst = this.processes.reduce((s, p) => s + p.burst, 0);

        this.metrics = {
            avgWait: totalWait / this.processes.length,
            avgTurn: totalTurn / this.processes.length,
            totalTime: totalTime,
            totalTurnSum: totalTurn,
            cpuUtil: totalTime ? (totalBurst / totalTime) * 100 : 0
        };
    }

    /* ----------------------------------------------
       GANTT CHART RENDER
    ----------------------------------------------*/
    renderGantt() {
        if (!this.timeline.length) {
            this.ganttPlaceholder.style.display = "flex";
            this.ganttContainer.innerHTML = "";
            this.ganttContainer.appendChild(this.ganttPlaceholder);
            return;
        }

        this.ganttPlaceholder.style.display = "none";

        const maxTime = Math.max(...this.timeline.map((t) => t.end));
        const colors = ["c0", "c1", "c2", "c3", "c4", "c5"];

        const chart = document.createElement("div");
        chart.className = "gantt-chart";

        this.timeline.forEach((item, i) => {
            const width = ((item.end - item.start) / maxTime) * 100;

            const bar = document.createElement("div");
            bar.className = `gantt-bar ${colors[i % colors.length]}`;
            bar.style.width = width + "%";
            bar.textContent = item.process;

            chart.appendChild(bar);
        });

        const axis = document.createElement("div");
        axis.className = "time-axis";
        
        // Create time markers that align with the bars
        for (let i = 0; i <= maxTime; i++) {
            const t = document.createElement("div");
            t.className = "time-marker";
            t.style.left = `${(i / maxTime) * 100}%`;
            t.textContent = i;
            axis.appendChild(t);
        }

        this.ganttContainer.innerHTML = "";
        this.ganttContainer.appendChild(chart);
        this.ganttContainer.appendChild(axis);
    }

    /* ----------------------------------------------
       METRICS UI UPDATE
    ----------------------------------------------*/
    updateMetrics() {
        // Numbers
        this.avgWaitEl.textContent = this.metrics.avgWait.toFixed(2);
        this.avgTurnEl.textContent = this.metrics.avgTurn.toFixed(2);
        this.totalTimeEl.textContent = this.metrics.totalTime;
        this.totalTATEl.textContent = this.metrics.totalTurnSum;

        // Progress (glass bars)
        const waitPerc = Math.min(100, (this.metrics.avgWait / (this.metrics.avgTurn || 1)) * 100);
        const turnPerc = Math.min(100, (this.metrics.avgTurn / (this.metrics.totalTime || 1)) * 100);

        this.avgWaitBar.style.width = waitPerc + "%";
        this.avgTurnBar.style.width = turnPerc + "%";

        // CPU Circular Ring
        const cpu = Math.round(this.metrics.cpuUtil);
        this.cpuPercent.textContent = cpu + "%";

        const r = 45;
        const circ = 2 * Math.PI * r;
        const offset = circ * (1 - cpu / 100);

        this.cpuProgress.style.strokeDashoffset = offset;
    }

    /* ----------------------------------------------
       CPU RING INIT
    ----------------------------------------------*/
    injectCPUSVGGradient() {
        const defs = `
      <svg width="0" height="0" style="position:absolute">
        <defs>
          <linearGradient id="cpuGrad" x1="0%" x2="100%">
            <stop offset="0%" stop-color="#5b9cff"/>
            <stop offset="100%" stop-color="#8b5cf6"/>
          </linearGradient>
        </defs>
      </svg>
    `;
        document.body.insertAdjacentHTML("afterbegin", defs);
    }

    setupCPUInitial() {
        const r = 45;
        const circ = 2 * Math.PI * r;
        this.cpuProgress.style.strokeDasharray = `${circ} ${circ}`;
        this.cpuProgress.style.strokeDashoffset = circ;
    }

    /* ----------------------------------------------
       EXECUTION DETAILS
    ----------------------------------------------*/
    renderExecutionDetails() {
        if (!this.timeline.length) {
            this.executionDetails.innerHTML =
                `<p class="placeholder-text">Execute scheduler to see process execution details</p>`;
            return;
        }

        const completion = {};
        this.timeline.forEach((t) => completion[t.process] = t.end);

        let html = `
      <table class="execution-table">
        <thead>
          <tr>
            <th>Process</th><th>AT</th><th>BT</th>
            <th>Start</th><th>End</th>
            <th>Waiting</th><th>Turnaround</th>
          </tr>
        </thead>
        <tbody>
    `;

        this.processes.forEach((p) => {
            const comp = completion[p.id];
            const tat = comp - p.arrival;
            const wait = tat - p.burst;

            const firstStart =
                this.timeline.find((t) => t.process === p.id)?.start ?? "-";

            html += `
        <tr>
          <td>${p.id}</td>
          <td>${p.arrival}</td>
          <td>${p.burst}</td>
          <td>${firstStart}</td>
          <td>${comp}</td>
          <td>${wait}</td>
          <td>${tat}</td>
        </tr>
      `;
        });

        html += `</tbody></table>`;
        this.executionDetails.innerHTML = html;
    }

    /* ----------------------------------------------
       RESET UI
    ----------------------------------------------*/
    reset() {
        this.timeline = [];

        // Restore placeholder
        this.ganttContainer.innerHTML = "";
        this.ganttContainer.appendChild(this.ganttPlaceholder);
        this.ganttPlaceholder.style.display = "flex";

        // Reset metrics
        this.avgWaitEl.textContent = "0.00";
        this.avgTurnEl.textContent = "0.00";
        this.totalTimeEl.textContent = "0";
        this.totalTATEl.textContent = "0";

        this.avgWaitBar.style.width = "0%";
        this.avgTurnBar.style.width = "0%";

        this.cpuPercent.textContent = "0%";
        this.setupCPUInitial();

        this.executionDetails.innerHTML =
            `<p class="placeholder-text">Execute scheduler to see process execution details</p>`;
    }
}

/* GLOBAL INSTANCE */
let scheduler;

document.addEventListener("DOMContentLoaded", () => {
    scheduler = new Scheduler();
});