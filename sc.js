
        function createBarChart(canvasId, title, labels, data, backgroundColor, borderColor) {
            const ctx = document.getElementById(canvasId).getContext('2d');
            const existingChart = Chart.getChart(ctx);
            if (existingChart) {
                existingChart.destroy();
            }
            new Chart(ctx, {
                type: 'bar',
                data: {
                    labels: labels,
                    datasets: [{
                        label: title,
                        data: data,
                        backgroundColor: backgroundColor,
                        borderColor: borderColor,
                        borderWidth: 1
                    }]
                },
                options: {
                    responsive: true,
                    scales: {
                        y: {
                            beginAtZero: true
                        }
                    },
                    plugins: {
                        title: {
                            display: true,
                            text: title
                        }
                    }
                }
            });
        }
        function displayResults(simulationResults) {
            const comparisonTableBody = document.querySelector('#comparison-table tbody');
            comparisonTableBody.innerHTML = ''; 

            const algorithms = Object.keys(simulationResults); // e.g., ['FCFS', 'SJF', 'Priority', 'RR']

            const avgWaitingTimes = [];
            const avgTurnaroundTimes = [];
            const avgResponseTimes = [];
            const cpuUtilizations = [];
            const throughputs = [];

            algorithms.forEach(algo => {
                const result = simulationResults[algo];
                const row = comparisonTableBody.insertRow();
                row.insertCell().textContent = algo;
                row.insertCell().textContent = result.avgWaitingTime.toFixed(2);
                row.insertCell().textContent = result.avgTurnaroundTime.toFixed(2);
                row.insertCell().textContent = result.avgResponseTime.toFixed(2);
                row.insertCell().textContent = result.cpuUtilization.toFixed(2);
                row.insertCell().textContent = result.throughput.toFixed(2);
                row.insertCell().textContent = result.totalTime.toFixed(2);

                avgWaitingTimes.push(result.avgWaitingTime);
                avgTurnaroundTimes.push(result.avgTurnaroundTime);
                avgResponseTimes.push(result.avgResponseTime);
                cpuUtilizations.push(result.cpuUtilization);
                throughputs.push(result.throughput);
            });

            createBarChart(
                'waitingTimeChart',
                'Average Waiting Time',
                algorithms,
                avgWaitingTimes,
                'rgba(255, 99, 132, 0.6)',
                'rgba(255, 99, 132, 1)'
            );

            createBarChart(
                'turnaroundTimeChart',
                'Average Turnaround Time',
                algorithms,
                avgTurnaroundTimes,
                'rgba(54, 162, 235, 0.6)',
                'rgba(54, 162, 235, 1)'
            );

            createBarChart(
                'responseTimeChart',
                'Average Response Time',
                algorithms,
                avgResponseTimes,
                'rgba(255, 206, 86, 0.6)',
                'rgba(255, 206, 86, 1)'
            );

            createBarChart(
                'cpuUtilizationChart',
                'CPU Utilization (%)',
                algorithms,
                cpuUtilizations,
                'rgba(75, 192, 192, 0.6)',
                'rgba(75, 192, 192, 1)'
            );

            createBarChart(
                'throughputChart',
                'Throughput (P/unit time)',
                algorithms,
                throughputs,
                'rgba(153, 102, 255, 0.6)',
                'rgba(153, 102, 255, 1)'
            );

            document.getElementById('results-section').style.display = 'block';
            document.getElementById('loading-spinner').style.display = 'none';
    
        }


        document.addEventListener('DOMContentLoaded', () => {
            addProcessEntry();
        });

        function addProcessEntry() {
            const container = document.getElementById('process-entries-container');
            const newEntry = document.createElement('div');
            newEntry.classList.add('process-entry');
            newEntry.innerHTML = `
                <label>Process ID: <input type="text" class="process-id" value="P${container.children.length + 1}"></label>
                <label>Arrival Time: <input type="number" class="arrival-time" value="0" min="0"></label>
                <label>Burst Time: <input type="number" class="burst-time" value="5" min="1"></label>
                <label>Priority: <input type="number" class="priority" value="1" min="1"></label>
                <button class="remove-process-btn">Remove</button>
            `;
            container.appendChild(newEntry);

            newEntry.querySelector('.remove-process-btn').addEventListener('click', () => {
                newEntry.remove();
            });
        }

        document.getElementById('add-process-btn').addEventListener('click', addProcessEntry);

        function getProcessData() {
            const processEntries = document.querySelectorAll('.process-entry');
            const processes = [];
            processEntries.forEach(entry => {
                processes.push({
                    id: entry.querySelector('.process-id').value,
                    arrivalTime: parseInt(entry.querySelector('.arrival-time').value),
                    burstTime: parseInt(entry.querySelector('.burst-time').value),
                    priority: parseInt(entry.querySelector('.priority').value)
                });
            });
            return processes;
        }

        function runAllSimulations(processes, simulateDeadlock) {
            
            function runFCFS(procs) {
                let sortedProcs = [...procs].sort((a, b) => a.arrivalTime - b.arrivalTime);
                let currentTime = 0;
                let totalWaitingTime = 0;
                let totalTurnaroundTime = 0;
                let totalResponseTime = 0;
                let cpuIdleTime = 0;
                let completedProcesses = 0;
                let lastCompletionTime = 0;
                const processCompletionTimes = {};
                const processResponseTimes = {};
                const processStartTimes = {};

                sortedProcs.forEach(p => {
                    if (currentTime < p.arrivalTime) {
                        cpuIdleTime += (p.arrivalTime - currentTime);
                        currentTime = p.arrivalTime; // CPU waits for process arrival
                    }

                    processStartTimes[p.id] = currentTime;
                    totalResponseTime += (currentTime - p.arrivalTime);

                    totalWaitingTime += (currentTime - p.arrivalTime);
                    currentTime += p.burstTime;
                    totalTurnaroundTime += (currentTime - p.arrivalTime);
                    processCompletionTimes[p.id] = currentTime;
                    lastCompletionTime = Math.max(lastCompletionTime, currentTime);
                    completedProcesses++;
                });

                const totalSimulationTime = lastCompletionTime;
                const cpuBusyTime = totalSimulationTime - cpuIdleTime;
                const cpuUtilization = (cpuBusyTime / totalSimulationTime) * 100;
                const throughput = completedProcesses / totalSimulationTime;

                return {
                    avgWaitingTime: totalWaitingTime / procs.length,
                    avgTurnaroundTime: totalTurnaroundTime / procs.length,
                    avgResponseTime: totalResponseTime / procs.length,
                    cpuUtilization: isNaN(cpuUtilization) ? 0 : cpuUtilization, // Handle division by zero
                    throughput: isNaN(throughput) ? 0 : throughput,
                    totalTime: totalSimulationTime
                };
            }

            function runSJF(procs) {
                let processesCopy = [...procs];
                let currentTime = 0;
                let totalWaitingTime = 0;
                let totalTurnaroundTime = 0;
                let totalResponseTime = 0;
                let cpuIdleTime = 0;
                let completedProcesses = 0;
                let lastCompletionTime = 0;
                const processStartTimes = {};

                let readyQueue = [];

                while (completedProcesses < processesCopy.length) {
                    processesCopy.forEach(p => {
                        if (p.arrivalTime <= currentTime && !readyQueue.includes(p) && !p.completed) {
                            readyQueue.push(p);
                        }
                    });
                    readyQueue = readyQueue.filter(p => !p.completed);

                    if (readyQueue.length === 0) {
                        let nextArrivalTime = Infinity;
                        processesCopy.forEach(p => {
                            if (!p.completed && p.arrivalTime > currentTime) {
                                nextArrivalTime = Math.min(nextArrivalTime, p.arrivalTime);
                            }
                        });

                        if (nextArrivalTime === Infinity) {
                            break;
                        }
                        cpuIdleTime += (nextArrivalTime - currentTime);
                        currentTime = nextArrivalTime;
                        continue; // Re-evaluate ready queue
                    }

                    readyQueue.sort((a, b) => a.burstTime - b.burstTime);

                    let currentProcess = readyQueue[0];

                    if (processStartTimes[currentProcess.id] === undefined) {
                        processStartTimes[currentProcess.id] = currentTime;
                        totalResponseTime += (currentTime - currentProcess.arrivalTime);
                    }

                    totalWaitingTime += (currentTime - currentProcess.arrivalTime);
                    currentTime += currentProcess.burstTime;
                    totalTurnaroundTime += (currentTime - currentProcess.arrivalTime);
                    currentProcess.completed = true; // Mark as completed
                    lastCompletionTime = Math.max(lastCompletionTime, currentTime);
                    completedProcesses++;
                }

                const totalSimulationTime = lastCompletionTime;
                const cpuBusyTime = totalSimulationTime - cpuIdleTime;
                const cpuUtilization = (cpuBusyTime / totalSimulationTime) * 100;
                const throughput = completedProcesses / totalSimulationTime;


                return {
                    avgWaitingTime: totalWaitingTime / procs.length,
                    avgTurnaroundTime: totalTurnaroundTime / procs.length,
                    avgResponseTime: totalResponseTime / procs.length,
                    cpuUtilization: isNaN(cpuUtilization) ? 0 : cpuUtilization,
                    throughput: isNaN(throughput) ? 0 : throughput,
                    totalTime: totalSimulationTime
                };
            }

            function runPriority(procs) {
                let processesCopy = [...procs];
                let currentTime = 0;
                let totalWaitingTime = 0;
                let totalTurnaroundTime = 0;
                let totalResponseTime = 0;
                let cpuIdleTime = 0;
                let completedProcesses = 0;
                let lastCompletionTime = 0;
                const processStartTimes = {};

                let readyQueue = [];

                while (completedProcesses < processesCopy.length) {
                    processesCopy.forEach(p => {
                        if (p.arrivalTime <= currentTime && !readyQueue.includes(p) && !p.completed) {
                            readyQueue.push(p);
                        }
                    });

                    readyQueue = readyQueue.filter(p => !p.completed);

                    if (readyQueue.length === 0) {
                        let nextArrivalTime = Infinity;
                        processesCopy.forEach(p => {
                            if (!p.completed && p.arrivalTime > currentTime) {
                                nextArrivalTime = Math.min(nextArrivalTime, p.arrivalTime);
                            }
                        });

                        if (nextArrivalTime === Infinity) break;
                        cpuIdleTime += (nextArrivalTime - currentTime);
                        currentTime = nextArrivalTime;
                        continue;
                    }

                    readyQueue.sort((a, b) => a.priority - b.priority);

                    let currentProcess = readyQueue[0];

                    if (processStartTimes[currentProcess.id] === undefined) {
                        processStartTimes[currentProcess.id] = currentTime;
                        totalResponseTime += (currentTime - currentProcess.arrivalTime);
                    }

                    totalWaitingTime += (currentTime - currentProcess.arrivalTime);
                    currentTime += currentProcess.burstTime;
                    totalTurnaroundTime += (currentTime - currentProcess.arrivalTime);
                    currentProcess.completed = true;
                    lastCompletionTime = Math.max(lastCompletionTime, currentTime);
                    completedProcesses++;
                }

                const totalSimulationTime = lastCompletionTime;
                const cpuBusyTime = totalSimulationTime - cpuIdleTime;
                const cpuUtilization = (cpuBusyTime / totalSimulationTime) * 100;
                const throughput = completedProcesses / totalSimulationTime;

                return {
                    avgWaitingTime: totalWaitingTime / procs.length,
                    avgTurnaroundTime: totalTurnaroundTime / procs.length,
                    avgResponseTime: totalResponseTime / procs.length,
                    cpuUtilization: isNaN(cpuUtilization) ? 0 : cpuUtilization,
                    throughput: isNaN(throughput) ? 0 : throughput,
                    totalTime: totalSimulationTime
                };
            }

            function runRR(procs, quantum = 2) { 
                let processesCopy = procs.map(p => ({ ...p, remainingBurst: p.burstTime }));
                let currentTime = 0;
                let totalWaitingTime = 0;
                let totalTurnaroundTime = 0;
                let totalResponseTime = 0;
                let cpuIdleTime = 0;
                let completedProcesses = 0;
                let lastCompletionTime = 0;
                const processCompletionTimes = {};
                const processResponseTimes = {};
                const processStartTimes = {};
                
                let queue = [];
                let arrived = new Set();

                processesCopy.sort((a, b) => a.arrivalTime - b.arrivalTime);

                let initialTime = processesCopy.length > 0 ? processesCopy[0].arrivalTime : 0;
                if (initialTime > 0) {
                    cpuIdleTime += initialTime;
                    currentTime = initialTime;
                }

                while (completedProcesses < processesCopy.length) {
                    processesCopy.forEach(p => {
                        if (p.arrivalTime <= currentTime && !arrived.has(p.id) && p.remainingBurst > 0) {
                            queue.push(p);
                            arrived.add(p.id);
                        }
                    });
                    
                    queue.sort((a, b) => a.arrivalTime - b.arrivalTime);

                    if (queue.length === 0) {
                        let nextArrivalTime = Infinity;
                        processesCopy.forEach(p => {
                            if (!arrived.has(p.id) && p.remainingBurst > 0 && p.arrivalTime > currentTime) {
                                nextArrivalTime = Math.min(nextArrivalTime, p.arrivalTime);
                            }
                        });
                        
                        if (nextArrivalTime === Infinity) { 
                             break;
                        }
                        cpuIdleTime += (nextArrivalTime - currentTime);
                        currentTime = nextArrivalTime;
                        continue; 
                    }

                    let currentProcess = queue.shift();

                    if (processStartTimes[currentProcess.id] === undefined) {
                        processStartTimes[currentProcess.id] = currentTime;
                        totalResponseTime += (currentTime - currentProcess.arrivalTime);
                    }

                    let executionTime = Math.min(quantum, currentProcess.remainingBurst);
                    currentTime += executionTime;
                    currentProcess.remainingBurst -= executionTime;

                    processesCopy.forEach(p => {
                        if (p.arrivalTime > (currentTime - executionTime) && p.arrivalTime <= currentTime && !arrived.has(p.id) && p.remainingBurst > 0) {
                            queue.push(p);
                            arrived.add(p.id);
                        }
                    });
                    queue.sort((a,b) => a.arrivalTime - b.arrivalTime); 
                    if (currentProcess.remainingBurst === 0) {
                        completedProcesses++;
                        totalTurnaroundTime += (currentTime - currentProcess.arrivalTime);
                        totalWaitingTime += (currentTime - currentProcess.burstTime - currentProcess.arrivalTime); // This needs careful calculation for RR
                        lastCompletionTime = Math.max(lastCompletionTime, currentTime);
                    } else {
                        queue.push(currentProcess);
                    }
                }
                
                let finalTotalWaitingTime = 0;
                let finalTotalTurnaroundTime = 0;
                let finalTotalResponseTime = 0;

                processesCopy.forEach(p => {
                    const turnaround = p.completionTime || 0;
                    const waiting = turnaround - p.burstTime;
                    finalTotalWaitingTime += waiting;
                    finalTotalTurnaroundTime += turnaround;
                    finalTotalResponseTime += (processStartTimes[p.id] - p.arrivalTime);
                });

                const totalSimulationTime = lastCompletionTime;
                const cpuBusyTime = totalSimulationTime - cpuIdleTime;
                const cpuUtilization = (cpuBusyTime / totalSimulationTime) * 100;
                const throughput = completedProcesses / totalSimulationTime;

                return {
                    avgWaitingTime: totalWaitingTime / procs.length, 
                    avgTurnaroundTime: totalTurnaroundTime / procs.length, 
                    avgResponseTime: totalResponseTime / procs.length,
                    cpuUtilization: isNaN(cpuUtilization) ? 0 : cpuUtilization,
                    throughput: isNaN(throughput) ? 0 : throughput,
                    totalTime: totalSimulationTime
                };
            }

            const results = {};
            const clonedProcesses = JSON.parse(JSON.stringify(processes));

            results['FCFS'] = runFCFS(clonedProcesses);
            results['SJF'] = runSJF(JSON.parse(JSON.stringify(processes))); // Clone again for independent run
            results['Priority'] = runPriority(JSON.parse(JSON.stringify(processes))); // Clone again
            results['RR'] = runRR(JSON.parse(JSON.stringify(processes)), 2); // Default quantum 2, can be user-defined

            return results;
        }


        document.getElementById('run-simulation-btn').addEventListener('click', () => {
            document.getElementById('loading-spinner').style.display = 'block';
            document.getElementById('results-section').style.display = 'none';

            const processes = getProcessData();
            const simulateDeadlock = document.getElementById('simulate-deadlock-checkbox').checked;

            setTimeout(() => {
                const simulationResults = runAllSimulations(processes, simulateDeadlock);
                displayResults(simulationResults);
                let bestAlgo = '';
                let minAvgTurnaroundTime = Infinity;
                let maxCpuUtilization = -Infinity;
                let maxThroughput = -Infinity;
                let minAvgWaitingTime = Infinity;

                for (const algo in simulationResults) {
                    const result = simulationResults[algo];

                    if (result.avgTurnaroundTime < minAvgTurnaroundTime) {
                        minAvgTurnaroundTime = result.avgTurnaroundTime;
                        bestAlgo = algo;
                    }
                    if (result.cpuUtilization > maxCpuUtilization) {
                        maxCpuUtilization = result.cpuUtilization;
                    }
                    if (result.throughput > maxThroughput) {
                        maxThroughput = result.throughput;
                    }
                     if (result.avgWaitingTime < minAvgWaitingTime) {
                        minAvgWaitingTime = result.avgWaitingTime;
                    }
                }
                
                let analysisText = `<p>Based on the simulations with the given process details:</p>`;
                analysisText += `<ul>`;
                analysisText += `<li><strong>${bestAlgo}</strong> generally showed a good balance in reducing turnaround time.</li>`;
                analysisText += `<li>Algorithms with lower Average Waiting Time (e.g., ${Object.keys(simulationResults).find(a => simulationResults[a].avgWaitingTime === minAvgWaitingTime)}) are good for processes that need quick access to CPU.</li>`;
                analysisText += `<li>Algorithms with higher CPU Utilization (e.g., ${Object.keys(simulationResults).find(a => simulationResults[a].cpuUtilization === maxCpuUtilization)}) are efficient at keeping the CPU busy.</li>`;
                analysisText += `<li>Algorithms with higher Throughput (e.g., ${Object.keys(simulationResults).find(a => simulationResults[a].throughput === maxThroughput)}) are effective at completing more processes per unit of time.</li>`;
                analysisText += `</ul>`;
                analysisText += `<p>The "best" algorithm depends on the specific goals (e.g., minimize waiting time, maximize throughput, ensure fairness). For interactive systems, Round Robin often performs well due to good response times, while for batch systems, SJF might be optimal for throughput.</p>`;

                document.getElementById('best-algo-analysis').innerHTML = analysisText;

                const deadlockSection = document.getElementById('deadlock-results-section');
                const deadlockInfo = document.getElementById('deadlock-info');
                if (simulateDeadlock) {
                    deadlockSection.style.display = 'block';
                    deadlockInfo.innerHTML = '<p>A predefined deadlock scenario was simulated (this simulation does not implement actual deadlock detection logic, but demonstrates the concept).</p><p>In a real system, a deadlock detection algorithm (like a resource-allocation graph or Banker\'s Algorithm) would identify:</p><ul><li>Which processes are involved in the deadlock.</li><li>Which resources they are holding and requesting.</li><li>Possible strategies for recovery (e.g., process termination, resource preemption).</li></ul>';
                } else {
                    deadlockSection.style.display = 'none';
                }
            }, 1000); 
        });