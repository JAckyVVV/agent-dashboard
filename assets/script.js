// Agent Dashboard JavaScript
// Auto-refreshes data from agents.json

let agentsData = null;

// Load data on page load
document.addEventListener('DOMContentLoaded', function() {
    loadData();
    // Refresh every 5 minutes
    setInterval(loadData, 5 * 60 * 1000);
});

async function loadData() {
    try {
        const response = await fetch('data/agents.json');
        agentsData = await response.json();
        updateDashboard();
        updateLastUpdated();
    } catch (error) {
        console.error('Error loading data:', error);
        showError('Failed to load agent data. Please refresh the page.');
    }
}

function updateDashboard() {
    if (!agentsData) return;
    
    updateStats();
    updateActiveAgents();
    updateStandbyAgents();
    updateDisabledAgents();
    updateSchedule();
    updateRecentReports();
    updateJobIdTable();
}

function updateStats() {
    const agents = agentsData.agents;
    const active = agents.filter(a => a.status === 'active').length;
    const standby = agents.filter(a => a.status === 'standby').length;
    const disabled = agents.filter(a => a.status === 'disabled').length;
    
    document.getElementById('totalAgents').textContent = agents.length;
    document.getElementById('activeAgents').textContent = active;
    document.getElementById('standbyAgents').textContent = standby;
    document.getElementById('disabledAgents').textContent = disabled;
}

function createAgentCard(agent) {
    return `
        <div class="agent-card ${agent.status}">
            <div class="agent-header">
                <div class="agent-name">${agent.name}</div>
                <span class="agent-status ${agent.status}">${agent.status}</span>
            </div>
            <div class="agent-details">
                <span>📅 <strong>Schedule:</strong> ${agent.schedule}</span>
                <span>🎯 <strong>Output:</strong> ${agent.output}</span>
                <span>⏰ <strong>Next Run:</strong> ${agent.nextRun}</span>
                <span>📦 <strong>Focus:</strong> ${agent.focus}</span>
            </div>
            <div class="job-id">Job ID: ${agent.id}</div>
        </div>
    `;
}

function updateActiveAgents() {
    const container = document.getElementById('activeAgentsList');
    const agents = agentsData.agents.filter(a => a.status === 'active');
    
    if (agents.length === 0) {
        container.innerHTML = '<p style="color: #666;">No active agents</p>';
        return;
    }
    
    container.innerHTML = agents.map(createAgentCard).join('');
}

function updateStandbyAgents() {
    const container = document.getElementById('standbyAgentsList');
    const agents = agentsData.agents.filter(a => a.status === 'standby');
    
    if (agents.length === 0) {
        container.innerHTML = '<p style="color: #666;">No standby agents</p>';
        return;
    }
    
    container.innerHTML = agents.map(createAgentCard).join('');
}

function updateDisabledAgents() {
    const container = document.getElementById('disabledAgentsList');
    const agents = agentsData.agents.filter(a => a.status === 'disabled');
    
    if (agents.length === 0) {
        container.innerHTML = '<p style="color: #666;">No disabled agents</p>';
        return;
    }
    
    container.innerHTML = agents.map(createAgentCard).join('');
}

function updateSchedule() {
    const tbody = document.getElementById('scheduleTable');
    
    if (!agentsData.schedule || agentsData.schedule.length === 0) {
        tbody.innerHTML = '<tr><td colspan="4" style="color: #666;">No schedule data</td></tr>';
        return;
    }
    
    tbody.innerHTML = agentsData.schedule.map(item => `
        <tr>
            <td>${item.time}</td>
            <td>${item.agent}</td>
            <td>${item.deliverable}</td>
            <td><span style="color: ${item.status === 'active' ? '#4ade80' : '#ef4444'};">●</span> ${item.status}</td>
        </tr>
    `).join('');
}

function updateRecentReports() {
    const container = document.getElementById('recentReports');
    
    if (!agentsData.recentReports || agentsData.recentReports.length === 0) {
        container.innerHTML = '<p style="color: #666;">No recent reports</p>';
        return;
    }
    
    container.innerHTML = agentsData.recentReports.map(report => {
        const date = new Date(report.date);
        const timeString = date.toLocaleDateString() + ' ' + date.toLocaleTimeString([], {hour: '2-digit', minute:'2-digit'});
        
        return `
            <div class="report-card">
                <div class="report-header">
                    <div class="report-title">${report.agent} - ${report.title}</div>
                    <div class="report-time">${timeString}</div>
                </div>
                <div class="report-preview">${report.summary}</div>
            </div>
        `;
    }).join('');
}

function updateJobIdTable() {
    const tbody = document.getElementById('jobIdTable');
    
    if (!agentsData.agents || agentsData.agents.length === 0) {
        tbody.innerHTML = '<tr><td colspan="2" style="color: #666;">No agent data</td></tr>';
        return;
    }
    
    tbody.innerHTML = agentsData.agents.map(agent => `
        <tr>
            <td>${agent.name}</td>
            <td><code style="font-family: monospace; color: #58a6ff;">${agent.id}</code></td>
        </tr>
    `).join('');
}

function updateLastUpdated() {
    const element = document.getElementById('lastUpdated');
    
    if (agentsData && agentsData.lastUpdated) {
        const date = new Date(agentsData.lastUpdated);
        element.textContent = date.toLocaleString();
    } else {
        element.textContent = 'Unknown';
    }
}

function showError(message) {
    const container = document.querySelector('.container');
    const errorDiv = document.createElement('div');
    errorDiv.style.cssText = 'background: rgba(239, 68, 68, 0.2); color: #ef4444; padding: 15px; border-radius: 8px; margin-bottom: 20px; border: 1px solid rgba(239, 68, 68, 0.3);';
    errorDiv.textContent = message;
    container.insertBefore(errorDiv, container.firstChild);
}

// Manual refresh button (if added to HTML)
function refreshData() {
    loadData();
}
