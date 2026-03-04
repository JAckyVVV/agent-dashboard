// Agent Dashboard JavaScript
// Auto-refreshes data from agents.json
// Supports expandable report cards

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

function createExpandableReport(report, index) {
    const date = new Date(report.date);
    const timeString = date.toLocaleDateString() + ' ' + date.toLocaleTimeString([], {hour: '2-digit', minute:'2-digit'});
    const hasDetails = report.products || report.details || report.hooks;
    
    // Build expandable content
    let expandableContent = '';
    
    if (report.products && report.products.length > 0) {
        expandableContent += `
            <div class="report-section">
                <h4>🛒 Products Found (${report.products.length})</h4>
                ${report.products.map((p, i) => `
                    <div class="product-item">
                        <div class="product-header">
                            <span class="product-rank">#${i + 1}</span>
                            <span class="product-name">${p.name}</span>
                            <span class="product-price">$${p.price}</span>
                        </div>
                        <div class="product-meta">
                            <span class="saturation">Saturation: ${p.saturation}/10</span>
                            <span class="margin">Margin: ${p.margin}</span>
                        </div>
                        <p class="product-problem"><strong>Problem:</strong> ${p.problem}</p>
                        ${p.link ? `<a href="${p.link}" target="_blank" class="product-link">View Product →</a>` : ''}
                    </div>
                `).join('')}
            </div>
        `;
    }
    
    if (report.details) {
        expandableContent += `
            <div class="report-section">
                <h4>📋 Full Report</h4>
                <div class="report-details-content">${report.details}</div>
            </div>
        `;
    }
    
    if (report.hooks && report.hooks.length > 0) {
        expandableContent += `
            <div class="report-section">
                <h4>🎯 Hook Templates</h4>
                <ul class="hook-list">
                    ${report.hooks.map(h => `<li>${h}</li>`).join('')}
                </ul>
            </div>
        `;
    }
    
    if (report.topProduct) {
        expandableContent += `
            <div class="report-section top-product-section">
                <h4>⭐ Top Recommendation</h4>
                <div class="top-product">
                    <h5>${report.topProduct.name}</h5>
                    <p>${report.topProduct.why}</p>
                    ${report.topProduct.link ? `<a href="${report.topProduct.link}" target="_blank">View Supplier →</a>` : ''}
                </div>
            </div>
        `;
    }
    
    return `
        <div class="report-card ${hasDetails ? 'expandable' : ''}" data-report-index="${index}">
            <div class="report-header" onclick="toggleReport(${index})">
                <div class="report-title-section">
                    <span class="report-agent">${report.agent}</span>
                    <span class="report-title-text">${report.title}</span>
                    ${hasDetails ? '<span class="expand-icon">▼</span>' : ''}
                </div>
                <div class="report-time">${timeString}</div>
            </div>
            <div class="report-preview">${report.summary}</div>
            ${hasDetails ? `
                <div class="report-expandable" id="report-content-${index}">
                    ${expandableContent}
                </div>
            ` : ''}
        </div>
    `;
}

function updateRecentReports() {
    const container = document.getElementById('recentReports');
    
    if (!agentsData.recentReports || agentsData.recentReports.length === 0) {
        container.innerHTML = '<p style="color: #666;">No recent reports</p>';
        return;
    }
    
    container.innerHTML = agentsData.recentReports.map((report, index) => 
        createExpandableReport(report, index)
    ).join('');
}

function toggleReport(index) {
    const content = document.getElementById(`report-content-${index}`);
    const card = document.querySelector(`[data-report-index="${index}"]`);
    
    if (!content || !card) return;
    
    const isExpanded = content.classList.contains('expanded');
    const icon = card.querySelector('.expand-icon');
    
    if (isExpanded) {
        content.classList.remove('expanded');
        if (icon) icon.textContent = '▼';
        card.classList.remove('expanded');
    } else {
        // Close other expanded reports
        document.querySelectorAll('.report-expandable.expanded').forEach(el => {
            el.classList.remove('expanded');
        });
        document.querySelectorAll('.report-card.expanded').forEach(el => {
            el.classList.remove('expanded');
        });
        document.querySelectorAll('.expand-icon').forEach(el => {
            el.textContent = '▼';
        });
        
        // Open this one
        content.classList.add('expanded');
        if (icon) icon.textContent = '▲';
        card.classList.add('expanded');
    }
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

// Manual refresh
function refreshData() {
    loadData();
}

// Expose toggle function globally
window.toggleReport = toggleReport;
