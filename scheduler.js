/**
 * ============================================================================
 * CPU SCHEDULER VISUALIZER
 * ============================================================================
 * A comprehensive web application for visualizing various CPU scheduling 
 * algorithms including FCFS, SJF, SRTF, Priority, and Round Robin.
 * 
 * Features:
 * - Manual process entry
 * - CSV/Excel file upload
 * - Interactive Gantt chart visualization
 * - Real-time performance metrics
 * - Algorithm descriptions
 * ============================================================================
 */

class Scheduler {
    constructor() {
        // Core data structures
        this.processes = [];      // Array to store all processes
        this.timeline = [];       // Array to store execution timeline
        this.metrics = null;      // Object to store calculated metrics

        // Algorithm descriptions for the info modal
        this.algorithmDescriptions = {
            FCFS: "First Come First Served (FCFS) is the simplest CPU scheduling algorithm that executes processes in the exact order they arrive in the ready queue. It uses a FIFO (First In, First Out) approach where the first process to arrive gets CPU access first. While it's easy to understand and implement with no starvation, FCFS suffers from the convoy effect where short processes must wait for long processes to complete, leading to poor average waiting times. It's non-preemptive, meaning once a process starts execution, it runs to completion.",
            
            SJF: "Shortest Job First (SJF) selects the process with the smallest burst time from the ready queue. This non-preemptive algorithm is provably optimal for minimizing average waiting time when all processes are available simultaneously. However, it requires prior knowledge of burst times, which is often unavailable in practice. SJF can cause starvation for longer processes if shorter ones keep arriving. It's best suited for batch systems where execution times can be estimated accurately.",
            
            SRTF: "Shortest Remaining Time First (SRTF) is the preemptive version of SJF that can interrupt a running process if a new process arrives with a shorter remaining time. This allows for better average turnaround times and response times compared to non-preemptive SJF. However, the frequent context switching can add overhead, and longer processes may face significant starvation. SRTF is ideal for time-sharing systems where responsiveness is critical, but it requires accurate burst time prediction.",
            
            Priority: "Priority Scheduling assigns a priority value to each process and executes them in order of priority, with lower numbers typically indicating higher priority. This implementation uses preemptive priority scheduling, where a running process can be interrupted if a higher-priority process arrives. Processes with equal priority can be scheduled using FCFS. This flexible algorithm allows the system to favor important tasks, but it can lead to indefinite blocking or starvation of low-priority processes. This can be mitigated using aging, where priority increases as processes wait longer. Priority scheduling works well in systems with clear process importance hierarchies and dynamic workload requirements.",
            
            RoundRobin: "Round Robin (RR) is a preemptive algorithm designed for time-sharing systems that allocates a fixed time quantum to each process in circular order. When a process's time slice expires, it's moved to the back of the ready queue, ensuring fair CPU distribution and good response times. The performance heavily depends on the time quantum size: too small causes excessive context switching overhead, while too large degenerates into FCFS. RR prevents starvation and works excellently for interactive systems where all processes should get regular CPU access."
        };

        // Initialize the application
        this.initElements();
        this.attachEvents();
        this.injectCPUSVGGradient();
        this.setupCPUInitial();
    }

    /* ============================================================================
       INITIALIZATION
       Initialize all DOM element references
    ============================================================================ */
    initElements() {
        // Algorithm controls
        this.algorithmSelect = document.getElementById("algorithmSelect");
        this.timeQuantumInput = document.getElementById("timeQuantum");
        this.timeQuantumCard = document.getElementById("timeQuantumCard");

        // Action buttons
        this.addBtn = document.getElementById("addBtn");
        this.runBtn = document.getElementById("runBtn");
        this.resetBtn = document.getElementById("resetBtn");
        this.clearAllBtn = document.getElementById("clearAllBtn");

        // Manual entry inputs
        this.processIdInput = document.getElementById("processId");
        this.arrivalTimeInput = document.getElementById("arrivalTime");
        this.burstTimeInput = document.getElementById("burstTime");
        this.priorityInput = document.getElementById("priority");
        this.priorityLabel = document.getElementById("priorityLabel");

        // Process list display
        this.processList = document.getElementById("processList");

        // Gantt chart elements
        this.ganttContainer = document.getElementById("ganttContainer");
        this.ganttPlaceholder = document.getElementById("ganttPlaceholder");

        // Metric display elements
        this.avgWaitEl = document.getElementById("avgWait");
        this.avgTurnEl = document.getElementById("avgTurnaround");
        this.avgRespEl = document.getElementById("avgResponse");
        this.totalTimeEl = document.getElementById("totalTime");
        this.totalTATEl = document.getElementById("totalTAT");

        // Metric progress bars
        this.avgWaitBar = document.getElementById("avgWaitBar");
        this.avgTurnBar = document.getElementById("avgTurnBar");
        this.avgRespBar = document.getElementById("avgRespBar");
        this.totalTimeBar = document.getElementById("totalTimeBar");
        this.totalTATBar = document.getElementById("totalTATBar");

        // CPU utilization circle
        this.cpuProgress = document.getElementById("cpuProgress");
        this.cpuPercent = document.getElementById("cpuPercent");

        // Execution details table
        this.executionDetails = document.getElementById("executionDetails");

        // Algorithm info modal elements
        this.algoInfoBtn = document.getElementById("algoInfoBtn");
        this.algoModal = document.getElementById("algoModal");
        this.modalOverlay = document.getElementById("modalOverlay");
        this.modalClose = document.getElementById("modalClose");
        this.modalTitle = document.getElementById("modalTitle");
        this.modalDescription = document.getElementById("modalDescription");

        // File upload elements
        this.fileInput = document.getElementById("fileInput");
        this.uploadArea = document.getElementById("uploadArea");
        this.downloadTemplate = document.getElementById("downloadTemplate");

        // Tab elements
        this.tabBtns = document.querySelectorAll(".tab-btn");
        this.manualTab = document.getElementById("manualTab");
        this.uploadTab = document.getElementById("uploadTab");
    }

    /* ============================================================================
       EVENT LISTENERS
       Attach all event handlers
    ============================================================================ */
    attachEvents() {
        // Algorithm and control events
        this.algorithmSelect.addEventListener("change", () => this.handleAlgorithmChange());
        this.addBtn.addEventListener("click", () => this.addProcess());
        this.runBtn.addEventListener("click", () => this.run());
        this.resetBtn.addEventListener("click", () => this.reset());
        this.clearAllBtn.addEventListener("click", () => this.clearAll());

        // Enter key to add process
        this.processIdInput.addEventListener("keypress", (e) => {
            if (e.key === "Enter") this.addProcess();
        });

        // Modal events
        this.algoInfoBtn.addEventListener("click", () => this.showAlgorithmInfo());
        this.modalClose.addEventListener("click", () => this.hideAlgorithmInfo());
        this.modalOverlay.addEventListener("click", () => this.hideAlgorithmInfo());

        // Tab switching
        this.tabBtns.forEach(btn => {
            btn.addEventListener("click", () => this.switchTab(btn.dataset.tab));
        });

        // File upload events
        this.uploadArea.addEventListener("click", () => this.fileInput.click());
        this.fileInput.addEventListener("change", (e) => this.handleFileUpload(e));
        
        // Drag and drop events
        this.uploadArea.addEventListener("dragover", (e) => {
            e.preventDefault();
            this.uploadArea.classList.add("dragover");
        });
        
        this.uploadArea.addEventListener("dragleave", () => {
            this.uploadArea.classList.remove("dragover");
        });
        
        this.uploadArea.addEventListener("drop", (e) => {
            e.preventDefault();
            this.uploadArea.classList.remove("dragover");
            if (e.dataTransfer.files.length) {
                this.fileInput.files = e.dataTransfer.files;
                this.handleFileUpload({ target: { files: e.dataTransfer.files } });
            }
        });

        // Download template button
        this.downloadTemplate.addEventListener("click", () => this.downloadSampleTemplate());
    }

    /* ============================================================================
       TAB MANAGEMENT
    ============================================================================ */
    
    /**
     * Switch between Manual Entry and Upload Table tabs
     * @param {string} tabName - Name of the tab to activate ('manual' or 'upload')
     */
    switchTab(tabName) {
        this.tabBtns.forEach(btn => {
            btn.classList.toggle("active", btn.dataset.tab === tabName);
        });

        this.manualTab.classList.toggle("active", tabName === "manual");
        this.uploadTab.classList.toggle("active", tabName === "upload");
    }

    /* ============================================================================
       FILE UPLOAD AND PARSING
    ============================================================================ */

    /**
     * Handle file upload event
     * Supports both CSV and Excel files
     */
    async handleFileUpload(event) {
        const file = event.target.files[0];
        if (!file) return;

        const fileName = file.name.toLowerCase();

        try {
            let data;
            
            // Parse based on file extension
            if (fileName.endsWith('.csv')) {
                data = await this.parseCSV(file);
            } else if (fileName.endsWith('.xlsx') || fileName.endsWith('.xls')) {
                data = await this.parseExcel(file);
            } else {
                alert("Unsupported file format. Please upload CSV or Excel files.");
                return;
            }

            this.processUploadedData(data);
            this.fileInput.value = ''; // Reset file input
        } catch (error) {
            alert("Error reading file: " + error.message);
            console.error(error);
        }
    }

    /**
     * Parse CSV file using PapaParse library
     * @param {File} file - CSV file to parse
     * @returns {Promise<Array>} Parsed data as array of objects
     */
    parseCSV(file) {
        return new Promise((resolve, reject) => {
            Papa.parse(file, {
                header: true,
                dynamicTyping: true,
                skipEmptyLines: true,
                complete: (results) => resolve(results.data),
                error: (error) => reject(error)
            });
        });
    }

    /**
     * Parse Excel file using SheetJS library
     * @param {File} file - Excel file to parse
     * @returns {Promise<Array>} Parsed data as array of objects
     */
    parseExcel(file) {
        return new Promise((resolve, reject) => {
            const reader = new FileReader();
            
            reader.onload = (e) => {
                try {
                    const data = new Uint8Array(e.target.result);
                    const workbook = XLSX.read(data, { type: 'array' });
                    const firstSheet = workbook.Sheets[workbook.SheetNames[0]];
                    const jsonData = XLSX.utils.sheet_to_json(firstSheet);
                    resolve(jsonData);
                } catch (error) {
                    reject(error);
                }
            };
            
            reader.onerror = () => reject(new Error("Failed to read file"));
            reader.readAsArrayBuffer(file);
        });
    }

    /**
     * Process and validate uploaded data
     * Handles column name variations and validates all fields
     * @param {Array} data - Parsed data from CSV/Excel
     */
    processUploadedData(data) {
        if (!data || data.length === 0) {
            alert("No data found in the file.");
            return;
        }

        let successCount = 0;
        let errorCount = 0;
        const errors = [];

        data.forEach((row, index) => {
            // Normalize column names (case-insensitive, trim whitespace)
            const normalizedRow = {};
            Object.keys(row).forEach(key => {
                normalizedRow[key.toLowerCase().trim()] = row[key];
            });

            // Extract values with explicit checks to handle 0 values correctly
            let process = null;
            let arrival = null;
            let burst = null;
            let priority = 1;

            // Find Process ID (supports: Process, ProcessID, PID)
            if (normalizedRow.hasOwnProperty('process')) process = normalizedRow.process;
            else if (normalizedRow.hasOwnProperty('processid')) process = normalizedRow.processid;
            else if (normalizedRow.hasOwnProperty('pid')) process = normalizedRow.pid;

            // Find Arrival Time (supports: ArrivalTime, Arrival, AT)
            // Using hasOwnProperty to correctly handle arrival time = 0
            if (normalizedRow.hasOwnProperty('arrivaltime')) arrival = normalizedRow.arrivaltime;
            else if (normalizedRow.hasOwnProperty('arrival')) arrival = normalizedRow.arrival;
            else if (normalizedRow.hasOwnProperty('at')) arrival = normalizedRow.at;

            // Find Burst Time (supports: BurstTime, Burst, BT)
            if (normalizedRow.hasOwnProperty('bursttime')) burst = normalizedRow.bursttime;
            else if (normalizedRow.hasOwnProperty('burst')) burst = normalizedRow.burst;
            else if (normalizedRow.hasOwnProperty('bt')) burst = normalizedRow.bt;

            // Find Priority (optional, supports: Priority, P)
            if (normalizedRow.hasOwnProperty('priority')) priority = normalizedRow.priority;
            else if (normalizedRow.hasOwnProperty('p')) priority = normalizedRow.p;

            // Validation checks
            if (!process) {
                errors.push(`Row ${index + 2}: Missing process ID`);
                errorCount++;
                return;
            }

            if (this.processes.some(p => p.id === String(process))) {
                errors.push(`Row ${index + 2}: Process ${process} already exists`);
                errorCount++;
                return;
            }

            // Check if arrival exists (including 0)
            if (arrival === undefined || arrival === null || arrival === '') {
                errors.push(`Row ${index + 2}: Missing arrival time for ${process}`);
                errorCount++;
                return;
            }

            const arrivalNum = Number(arrival);
            if (isNaN(arrivalNum) || arrivalNum < 0) {
                errors.push(`Row ${index + 2}: Invalid arrival time for ${process}`);
                errorCount++;
                return;
            }

            if (!burst || burst <= 0) {
                errors.push(`Row ${index + 2}: Invalid burst time for ${process}`);
                errorCount++;
                return;
            }

            // Add valid process
            this.processes.push({
                id: String(process),
                arrival: arrivalNum,
                burst: parseInt(burst),
                priority: parseInt(priority) || 1
            });

            successCount++;
        });

        // Show results with detailed feedback
        if (successCount > 0) {
            this.renderProcesses();
            alert(`✅ Successfully imported ${successCount} process(es).${errorCount > 0 ? `\n\n⚠️ ${errorCount} error(s) found:\n${errors.slice(0, 5).join('\n')}${errors.length > 5 ? '\n...' : ''}` : ''}`);
        } else {
            alert(`❌ No processes imported.\n\nErrors:\n${errors.slice(0, 5).join('\n')}${errors.length > 5 ? '\n...' : ''}`);
        }
    }

    /**
     * Download a sample CSV template for users
     * Creates a CSV file with example data and triggers download
     */
    downloadSampleTemplate() {
        const csvContent = `Process,ArrivalTime,BurstTime,Priority
P1,0,5,2
P2,1,3,1
P3,2,8,3
P4,3,6,2
P5,4,4,1`;

        const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
        const link = document.createElement('a');
        
        // Handle IE 10+ separately
        if (navigator.msSaveBlob) {
            navigator.msSaveBlob(blob, 'cpu_scheduler_template.csv');
        } else {
            const url = URL.createObjectURL(blob);
            link.href = url;
            link.download = 'cpu_scheduler_template.csv';
            link.style.display = 'none';
            document.body.appendChild(link);
            link.click();
            // Clean up after download
            setTimeout(() => {
                document.body.removeChild(link);
                URL.revokeObjectURL(url);
            }, 100);
        }
    }

    /* ============================================================================
       ALGORITHM INFO MODAL
    ============================================================================ */

    /**
     * Show algorithm information modal
     * Displays detailed description of the selected algorithm
     */
    showAlgorithmInfo() {
        const algo = this.algorithmSelect.value;
        const algoNames = {
            FCFS: "First Come First Served (FCFS)",
            SJF: "Shortest Job First (SJF)",
            SRTF: "Shortest Remaining Time First (SRTF)",
            Priority: "Priority Scheduling (Preemptive)",
            RoundRobin: "Round Robin"
        };
        
        this.modalTitle.textContent = algoNames[algo];
        this.modalDescription.textContent = this.algorithmDescriptions[algo];
        this.algoModal.classList.add("active");
    }

    /**
     * Hide algorithm information modal
     */
    hideAlgorithmInfo() {
        this.algoModal.classList.remove("active");
    }

    /* ============================================================================
       PROCESS MANAGEMENT
    ============================================================================ */

    /**
     * Handle algorithm selection change
     * Shows/hides relevant inputs based on selected algorithm
     */
    handleAlgorithmChange() {
        const algo = this.algorithmSelect.value;
        
        // Show Time Quantum only for Round Robin
        this.timeQuantumCard.style.display = (algo === "RoundRobin") ? "block" : "none";
        
        // Show Priority input only for Priority Scheduling
        const showPriority = (algo === "Priority");
        this.priorityInput.style.display = showPriority ? "block" : "none";
        this.priorityLabel.style.display = showPriority ? "block" : "none";
        
        this.renderProcesses();
    }

    /**
     * Clear all processes
     * Removes all processes and resets the visualization
     */
    clearAll() {
        this.processes = [];
        this.renderProcesses();
        this.reset();
    }

    /**
     * Add a new process manually
     * Validates input and adds process to the list
     */
    addProcess() {
        const id = this.processIdInput.value.trim();
        const arrival = parseInt(this.arrivalTimeInput.value) || 0;
        const burst = parseInt(this.burstTimeInput.value) || 1;
        const priority = parseInt(this.priorityInput.value) || 1;

        // Validation
        if (!id) return alert("Please provide a Process ID.");
        if (this.processes.some(p => p.id === id)) return alert("Process ID already exists.");
        if (burst <= 0) return alert("Burst Time must be at least 1.");

        // Add process
        this.processes.push({ id, arrival, burst, priority });

        // Clear input fields
        this.processIdInput.value = "";
        this.arrivalTimeInput.value = "0";
        this.burstTimeInput.value = "1";
        this.priorityInput.value = "1";

        this.renderProcesses();
    }

    /**
     * Delete a specific process
     * @param {string} id - Process ID to delete
     */
    deleteProcess(id) {
        this.processes = this.processes.filter(p => p.id !== id);
        this.renderProcesses();
    }

    /**
     * Render the process list
     * Updates the UI to show all added processes
     */
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

            // Show priority only for Priority Scheduling
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

    /* ============================================================================
       SCHEDULING ALGORITHMS
       Each method implements a specific CPU scheduling algorithm
    ============================================================================ */

    /**
     * FCFS - First Come First Served (Non-Preemptive)
     * Executes processes in order of arrival
     * @returns {Array} Timeline of process execution
     */
    fcfs() {
        const result = [];
        const sorted = [...this.processes].sort((a, b) => a.arrival - b.arrival);
        let time = 0;

        for (const p of sorted) {
            // Add idle time if CPU is waiting for process arrival
            if (time < p.arrival) {
                result.push({ process: "IDLE", start: time, end: p.arrival });
                time = p.arrival;
            }

            // Execute process
            result.push({ process: p.id, start: time, end: time + p.burst, arrival: p.arrival });
            time += p.burst;
        }

        return result;
    }

    /**
     * SJF - Shortest Job First (Non-Preemptive)
     * Selects process with shortest burst time
     * @returns {Array} Timeline of process execution
     */
    sjf() {
        const result = [];
        const remaining = [...this.processes];
        let time = 0;

        while (remaining.length > 0) {
            // Get all processes that have arrived
            const available = remaining.filter(p => p.arrival <= time);

            if (available.length === 0) {
                // No process available, jump to next arrival
                const nextArrival = Math.min(...remaining.map(p => p.arrival));
                result.push({ process: "IDLE", start: time, end: nextArrival });
                time = nextArrival;
                continue;
            }

            // Select process with shortest burst time
            const p = available.reduce((a, b) => a.burst < b.burst ? a : b);
            result.push({ process: p.id, start: time, end: time + p.burst, arrival: p.arrival });
            time += p.burst;
            remaining.splice(remaining.indexOf(p), 1);
        }

        return result;
    }

    /**
     * Priority Scheduling (Preemptive)
     * Executes highest priority process, can preempt lower priority
     * Lower priority number = Higher priority
     * @returns {Array} Timeline of process execution
     */
    priority() {
        const procs = this.processes.map(p => ({ ...p, remaining: p.burst }));
        const result = [];
        let time = 0;
        let active = null;
        let startTime = 0;

        while (procs.some(p => p.remaining > 0)) {
            // Get all available processes
            const available = procs.filter(p => p.arrival <= time && p.remaining > 0);

            if (available.length === 0) {
                // No process available, add idle time
                const nextArrival = Math.min(...procs.filter(p => p.remaining > 0).map(p => p.arrival));
                result.push({ process: "IDLE", start: time, end: nextArrival });
                time = nextArrival;
                continue;
            }

            // Get highest priority process (lower number = higher priority)
            const highestPriority = available.reduce((a, b) => a.priority < b.priority ? a : b);

            // Preemption: switch to higher priority process
            if (active !== highestPriority) {
                if (active !== null) {
                    result.push({ process: active.id, start: startTime, end: time });
                }
                active = highestPriority;
                startTime = time;
            }

            // Execute for 1 time unit
            active.remaining--;
            time++;

            // Process completed
            if (active.remaining === 0) {
                result.push({ process: active.id, start: startTime, end: time, arrival: active.arrival });
                active = null;
            }
        }

        return result;
    }

    /**
     * SRTF - Shortest Remaining Time First (Preemptive SJF)
     * Preempts if a process with shorter remaining time arrives
     * @returns {Array} Timeline of process execution
     */
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

            // Select process with shortest remaining time
            const shortest = available.reduce((a, b) => a.remaining < b.remaining ? a : b);

            // Preemption check
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

    /**
     * Round Robin (Preemptive)
     * Each process gets a fixed time quantum in circular order
     * @param {number} tq - Time quantum
     * @returns {Array} Timeline of process execution
     */
    roundRobin(tq) {
        const result = [];
        const queue = [];
        const procs = this.processes.map(p => ({ ...p, remaining: p.burst }));
        let time = 0;

        while (queue.length > 0 || procs.some(p => p.remaining > 0)) {
            // Add newly arrived processes to queue
            procs.filter(p => p.arrival === time).forEach(p => queue.push(p));

            if (queue.length === 0) {
                time++;
                continue;
            }

            // Get next process from queue
            const p = queue.shift();
            const exec = Math.min(tq, p.remaining); // Execute for quantum or remaining time

            result.push({ process: p.id, start: time, end: time + exec, arrival: p.arrival });
            time += exec;
            p.remaining -= exec;

            // Add newly arrived processes
            procs.filter(px => px.arrival <= time && px.remaining > 0 && !queue.includes(px))
                 .forEach(px => queue.push(px));

            // Re-queue if process not finished
            if (p.remaining > 0) queue.push(p);
        }

        return result;
    }

    /* ============================================================================
       EXECUTION & VISUALIZATION
    ============================================================================ */

    /**
     * Run the selected scheduling algorithm
     * Executes algorithm, calculates metrics, and updates UI
     */
    run() {
        if (this.processes.length === 0) {
            return alert("Please add at least one process.");
        }

        const algo = this.algorithmSelect.value;

        // Execute selected algorithm
        if (algo === "FCFS") this.timeline = this.fcfs();
        else if (algo === "SJF") this.timeline = this.sjf();
        else if (algo === "Priority") this.timeline = this.priority();
        else if (algo === "SRTF") this.timeline = this.srtf();
        else this.timeline = this.roundRobin(parseInt(this.timeQuantumInput.value) || 2);

        // Update all visualizations
        this.calculateMetrics();
        this.renderGantt();
        this.updateMetrics();
        this.renderExecutionDetails();
    }

    /**
     * Calculate performance metrics
     * Computes waiting time, turnaround time, response time, and CPU utilization
     */
    calculateMetrics() {
        const completion = {};      // Completion time for each process
        const responseTime = {};    // First execution time for each process
        
        // Find completion and response times from timeline
        this.timeline.forEach(item => {
            if (item.process !== "IDLE") {
                completion[item.process] = item.end;
                if (responseTime[item.process] === undefined) {
                    responseTime[item.process] = item.start;
                }
            }
        });

        let totalWait = 0;
        let totalTurn = 0;
        let totalResp = 0;

        // Calculate metrics for each process
        this.processes.forEach(p => {
            const c = completion[p.id];
            const tat = c - p.arrival;                    // Turnaround Time
            const wt = tat - p.burst;                     // Waiting Time
            const rt = responseTime[p.id] - p.arrival;    // Response Time
            
            totalWait += wt;
            totalTurn += tat;
            totalResp += rt;
        });

        const totalTime = Math.max(...this.timeline.map(t => t.end));
        const totalBurst = this.processes.reduce((s, p) => s + p.burst, 0);

        // Store all calculated metrics
        this.metrics = {
            avgWait: totalWait / this.processes.length,
            avgTurn: totalTurn / this.processes.length,
            avgResp: totalResp / this.processes.length,
            totalTime,
            totalTurnSum: totalTurn,
            cpuUtil: (totalBurst / totalTime) * 100,
            responseTime
        };
    }

    /**
     * Render the Gantt chart visualization
     * Creates visual timeline of process execution
     */
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

        // Create Gantt chart bars
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

        // Create time axis
        const axis = document.createElement("div");
        axis.className = "time-axis";

        for (let t = 0; t <= maxTime; t++) {
            const marker = document.createElement("div");
            marker.className = "time-marker";
            marker.style.left = `${(t / maxTime) * 100}%`;
            marker.textContent = t;
            axis.appendChild(marker);
        }

        // Render chart and axis
        this.ganttContainer.innerHTML = "";
        this.ganttContainer.appendChild(chart);
        this.ganttContainer.appendChild(axis);
    }

    /**
     * Update metrics display with calculated values
     * Animates progress bars and updates all metric displays
     */
    updateMetrics() {
        // Update text values
        this.avgWaitEl.textContent = this.metrics.avgWait.toFixed(2);
        this.avgTurnEl.textContent = this.metrics.avgTurn.toFixed(2);
        this.avgRespEl.textContent = this.metrics.avgResp.toFixed(2);
        this.totalTimeEl.textContent = this.metrics.totalTime + " ms";
        this.totalTATEl.textContent = this.metrics.totalTurnSum + " ms";

        // Animate progress bars
        this.avgWaitBar.style.width = "100%";
        this.avgTurnBar.style.width = "100%";
        this.avgRespBar.style.width = "100%";
        this.totalTimeBar.style.width = "100%";
        this.totalTATBar.style.width = "100%";

        // Update CPU utilization circle
        const cpu = Math.round(this.metrics.cpuUtil);
        this.cpuPercent.textContent = cpu + "%";

        const r = 45;
        const circ = 2 * Math.PI * r;
        this.cpuProgress.style.strokeDasharray = `${circ} ${circ}`;
        this.cpuProgress.style.strokeDashoffset = circ * (1 - cpu / 100);
    }

    /**
     * Inject SVG gradient definition for CPU utilization circle
     * Creates a gradient from blue to purple
     */
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

    /**
     * Setup initial CPU circle (empty state)
     */
    setupCPUInitial() {
        const r = 45;
        const circ = 2 * Math.PI * r;
        this.cpuProgress.style.strokeDasharray = `${circ} ${circ}`;
        this.cpuProgress.style.strokeDashoffset = circ;
    }

    /**
     * Render execution details table
     * Shows detailed information for each process
     */
    renderExecutionDetails() {
        const completion = {};
        this.timeline.forEach(t => {
            if (t.process !== "IDLE") completion[t.process] = t.end;
        });

        let html = `
        <table class="execution-table">
          <thead>
            <tr>
              <th>Process</th><th>AT (in ms)</th><th>BT (in ms)</th>
              <th>Start (in ms)</th><th>End (in ms)</th>
              <th>Waiting (in ms)</th><th>Turnaround (in ms)</th><th>Response (in ms)</th>
            </tr>
          </thead>
          <tbody>`;

        this.processes.forEach(p => {
            const comp = completion[p.id];
            const tat = comp - p.arrival;                    // Turnaround Time
            const wt = tat - p.burst;                        // Waiting Time
            const rt = this.metrics.responseTime[p.id] - p.arrival;  // Response Time

            const firstStart = this.timeline.find(t => t.process === p.id)?.start ?? "-";

            html += `
            <tr>
              <td>${p.id}</td>
              <td>${p.arrival}</td>
              <td>${p.burst}</td>
              <td>${firstStart}</td>
              <td>${comp}</td>
              <td>${wt}</td>
              <td>${tat}</td>
              <td>${rt}</td>
            </tr>`;
        });

        html += `</tbody></table>`;
        this.executionDetails.innerHTML = html;
    }

    /**
     * Reset visualization
     * Clears Gantt chart and metrics, keeps processes
     */
    reset() {
        this.timeline = [];
        this.ganttContainer.innerHTML = "";
        this.ganttContainer.appendChild(this.ganttPlaceholder);
        this.ganttPlaceholder.style.display = "flex";
        
        // Reset all metric displays
        this.cpuPercent.textContent = "0%";
        this.avgWaitEl.textContent = "0.00";
        this.avgTurnEl.textContent = "0.00";
        this.avgRespEl.textContent = "0.00";
        this.totalTimeEl.textContent = "0 ms";
        this.totalTATEl.textContent = "0 ms";
        
        // Reset progress bars
        this.avgWaitBar.style.width = "0%";
        this.avgTurnBar.style.width = "0%";
        this.avgRespBar.style.width = "0%";
        this.totalTimeBar.style.width = "0%";
        this.totalTATBar.style.width = "0%";
        
        this.setupCPUInitial();
        this.executionDetails.innerHTML = '<p class="placeholder-text">Execute scheduler to see process execution details</p>';
    }
}

/* ============================================================================
   APPLICATION INITIALIZATION
   Create scheduler instance when DOM is ready
============================================================================ */
let scheduler;
document.addEventListener("DOMContentLoaded", () => {
    scheduler = new Scheduler();
});