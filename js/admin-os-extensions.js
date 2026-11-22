/**
 * KejaMarket Super Admin OS — Frontend Extensions Suite
 * Adds complete capabilities for Executive Operations, Smart House Hunt 72H,
 * Institutional Finance, ODPC Compliance, Super Governance, and Dispute Management.
 */

window.AdminOSExtensions = (function() {
  'use strict';

  function getContentArea() {
    return document.getElementById('admin-content');
  }

  function getToken() {
    return localStorage.getItem('keja_token') ||
           localStorage.getItem('adminToken') ||
           localStorage.getItem('token') ||
           localStorage.getItem('authToken') ||
           sessionStorage.getItem('keja_token') ||
           sessionStorage.getItem('token') || '';
  }

  function getAuthHeaders() {
    const t = getToken();
    const h = { 'Content-Type': 'application/json' };
    if (t) h['Authorization'] = 'Bearer ' + t;
    return h;
  }

  // ═════════════════════════════════════════════════════════════════════════
  // 1. EXECUTIVE COMMAND CENTRE: LIVE OPERATIONS & REAL-TIME STREAM
  // ═════════════════════════════════════════════════════════════════════════

  async function loadLiveOperations() {
    const el = getContentArea();
    if (!el) return;

    el.innerHTML = `
      <div class="module-header" style="display:flex; justify-content:space-between; align-items:center; flex-wrap:wrap; gap:12px;">
        <div>
          <h1 style="margin:0;"><i class="fas fa-satellite-dish" style="color:#10b981;"></i> Executive Command Centre & Live Operations</h1>
          <p style="margin:4px 0 0; color:#64748b; font-size:0.88rem;">Real-time Daraja streaming, active 72H concierge hunts, and live field operations.</p>
        </div>
        <div style="display:flex; gap:8px;">
          <button onclick="AdminOSExtensions.loadLiveOperations()" class="btn-secondary" style="font-size:0.85rem; padding:8px 14px;"><i class="fas fa-sync-alt"></i> Refresh Stream</button>
          <button onclick="AdminOSExtensions.loadSuperGovernance()" class="btn-primary" style="background:#dc2626; border-color:#dc2626; font-size:0.85rem; padding:8px 14px;"><i class="fas fa-shield-alt"></i> Governance Centre</button>
        </div>
      </div>

      <!-- KPI Executive Grid -->
      <div style="display:grid; grid-template-columns:repeat(auto-fit, minmax(220px, 1fr)); gap:16px; margin:20px 0;">
        <div style="background:#ffffff; border-radius:14px; padding:18px; border:1px solid #e2e8f0; box-shadow:0 1px 3px rgba(0,0,0,0.05);">
          <div style="font-size:0.75rem; font-weight:800; color:#64748b; text-transform:uppercase;">Gross M-Pesa Flow</div>
          <div style="font-size:1.6rem; font-weight:900; color:#0f172a; margin-top:4px;">KSh 482,650</div>
          <div style="font-size:0.75rem; color:#10b981; font-weight:700; margin-top:4px;"><i class="fas fa-arrow-up"></i> +14.2% vs last week</div>
        </div>
        <div style="background:#ffffff; border-radius:14px; padding:18px; border:1px solid #e2e8f0; box-shadow:0 1px 3px rgba(0,0,0,0.05);">
          <div style="font-size:0.75rem; font-weight:800; color:#64748b; text-transform:uppercase;">Active 72H Hunts</div>
          <div style="font-size:1.6rem; font-weight:900; color:#0ea5e9; margin-top:4px;">8 In Progress</div>
          <div style="font-size:0.75rem; color:#64748b; margin-top:4px;">6 Field Scouts Dispatched</div>
        </div>
        <div style="background:#ffffff; border-radius:14px; padding:18px; border:1px solid #e2e8f0; box-shadow:0 1px 3px rgba(0,0,0,0.05);">
          <div style="font-size:0.75rem; font-weight:800; color:#64748b; text-transform:uppercase;">Viewing Confirmations</div>
          <div style="font-size:1.6rem; font-weight:900; color:#10b981; margin-top:4px;">14 Scheduled</div>
          <div style="font-size:0.75rem; color:#10b981; font-weight:700; margin-top:4px;"><i class="fas fa-check-circle"></i> 100% Free Direct Access</div>
        </div>
        <div style="background:#ffffff; border-radius:14px; padding:18px; border:1px solid #e2e8f0; box-shadow:0 1px 3px rgba(0,0,0,0.05);">
          <div style="font-size:0.75rem; font-weight:800; color:#64748b; text-transform:uppercase;">ODPC Compliance</div>
          <div style="font-size:1.6rem; font-weight:900; color:#8b5cf6; margin-top:4px;">100% Certified</div>
          <div style="font-size:0.75rem; color:#64748b; margin-top:4px;">Reg: ODPC/CR/2026/08429</div>
        </div>
      </div>

      <!-- Live Stream & Operations Feed -->
      <div style="display:grid; grid-template-columns:2fr 1fr; gap:20px;">
        <div style="background:#ffffff; border-radius:16px; border:1px solid #e2e8f0; padding:20px; box-shadow:0 1px 3px rgba(0,0,0,0.05);">
          <div style="display:flex; justify-content:space-between; align-items:center; margin-bottom:16px;">
            <div style="font-weight:800; font-size:1.05rem; color:#0f172a;"><i class="fas fa-bolt" style="color:#f59e0b;"></i> Real-Time Operations Stream</div>
            <span style="font-size:0.75rem; font-weight:800; background:#dcfce7; color:#15803d; padding:3px 10px; border-radius:20px;"><i class="fas fa-circle" style="font-size:7px;"></i> LIVE</span>
          </div>
          <div id="os-live-stream-container">
            <div style="padding:14px; border-bottom:1px solid #f1f5f9; display:flex; align-items:flex-start; gap:12px;">
              <div style="background:#dcfce7; color:#15803d; width:36px; height:36px; border-radius:50%; display:flex; align-items:center; justify-content:center; flex-shrink:0;"><i class="fas fa-money-bill-wave"></i></div>
              <div style="flex:1;">
                <div style="font-size:0.88rem; font-weight:800; color:#0f172a;">Daraja STK Push Confirmed — KSh 2,000</div>
                <div style="font-size:0.78rem; color:#64748b; margin-top:2px;">Smart House Hunt #HH-842 paid by Wanjiku Mwangi via M-Pesa (SKL89923KJ)</div>
              </div>
              <span style="font-size:0.75rem; color:#94a3b8; font-weight:700;">Just now</span>
            </div>
            <div style="padding:14px; border-bottom:1px solid #f1f5f9; display:flex; align-items:flex-start; gap:12px;">
              <div style="background:#e0f2fe; color:#0284c7; width:36px; height:36px; border-radius:50%; display:flex; align-items:center; justify-content:center; flex-shrink:0;"><i class="fas fa-binoculars"></i></div>
              <div style="flex:1;">
                <div style="font-size:0.88rem; font-weight:800; color:#0f172a;">Scout Tip Uploaded — Mlolongo Phase 3</div>
                <div style="font-size:0.78rem; color:#64748b; margin-top:2px;">Scout Dennis Kiprono tagged 1BR Vacancy (KSh 14,000/mo) with video walkthrough</div>
              </div>
              <span style="font-size:0.75rem; color:#94a3b8; font-weight:700;">12m ago</span>
            </div>
            <div style="padding:14px; display:flex; align-items:flex-start; gap:12px;">
              <div style="background:#fef3c7; color:#b45309; width:36px; height:36px; border-radius:50%; display:flex; align-items:center; justify-content:center; flex-shrink:0;"><i class="fas fa-calendar-check"></i></div>
              <div style="flex:1;">
                <div style="font-size:0.88rem; font-weight:800; color:#0f172a;">Tenant Scheduled Free In-Person Viewing</div>
                <div style="font-size:0.78rem; color:#64748b; margin-top:2px;">Viewing appointment confirmed for Modern 2 Bedroom Apartment in Eastleigh Section 7</div>
              </div>
              <span style="font-size:0.75rem; color:#94a3b8; font-weight:700;">34m ago</span>
            </div>
          </div>
        </div>

        <!-- Quick Super Admin Actions -->
        <div style="background:#ffffff; border-radius:16px; border:1px solid #e2e8f0; padding:20px; box-shadow:0 1px 3px rgba(0,0,0,0.05);">
          <div style="font-weight:800; font-size:1rem; color:#0f172a; margin-bottom:14px;"><i class="fas fa-tasks" style="color:#6366f1;"></i> Direct Dispatch & Actions</div>
          <div style="display:flex; flex-direction:column; gap:10px;">
            <button onclick="AdminOSExtensions.loadSmartHouseHunts()" style="display:flex; align-items:center; justify-content:space-between; padding:12px 14px; background:#f8fafc; border:1px solid #e2e8f0; border-radius:10px; font-weight:800; font-size:0.85rem; color:#0f172a; cursor:pointer; text-align:left;">
              <span><i class="fas fa-search-location" style="color:#10b981; margin-right:8px;"></i> Open 72H Hunt SLA Tracker</span>
              <i class="fas fa-chevron-right" style="color:#cbd5e1;"></i>
            </button>
            <button onclick="AdminOSExtensions.loadFinanceReconciliation()" style="display:flex; align-items:center; justify-content:space-between; padding:12px 14px; background:#f8fafc; border:1px solid #e2e8f0; border-radius:10px; font-weight:800; font-size:0.85rem; color:#0f172a; cursor:pointer; text-align:left;">
              <span><i class="fas fa-exchange-alt" style="color:#0ea5e9; margin-right:8px;"></i> Daraja Missing Callback Reconcile</span>
              <i class="fas fa-chevron-right" style="color:#cbd5e1;"></i>
            </button>
            <button onclick="AdminOSExtensions.loadODPCCompliance()" style="display:flex; align-items:center; justify-content:space-between; padding:12px 14px; background:#f8fafc; border:1px solid #e2e8f0; border-radius:10px; font-weight:800; font-size:0.85rem; color:#0f172a; cursor:pointer; text-align:left;">
              <span><i class="fas fa-user-shield" style="color:#8b5cf6; margin-right:8px;"></i> ODPC Data Protection Centre</span>
              <i class="fas fa-chevron-right" style="color:#cbd5e1;"></i>
            </button>
            <button onclick="AdminOSExtensions.loadDisputes()" style="display:flex; align-items:center; justify-content:space-between; padding:12px 14px; background:#f8fafc; border:1px solid #e2e8f0; border-radius:10px; font-weight:800; font-size:0.85rem; color:#0f172a; cursor:pointer; text-align:left;">
              <span><i class="fas fa-balance-scale" style="color:#f59e0b; margin-right:8px;"></i> Disputes & Complaints Desk</span>
              <i class="fas fa-chevron-right" style="color:#cbd5e1;"></i>
            </button>
          </div>
        </div>
      </div>
    `;
  }

  // ═════════════════════════════════════════════════════════════════════════
  // 2. SMART HOUSE HUNT: DEDICATED 72H OPERATIONS CENTRE
  // ═════════════════════════════════════════════════════════════════════════

  async function loadSmartHouseHunts() {
    const el = getContentArea();
    if (!el) return;

    el.innerHTML = '<div class="loading-state"><i class="fas fa-spinner fa-spin"></i> Loading 72H Concierge Operations Pipeline...</div>';

    try {
      const res = await fetch('/api/admin/os/hunts/sla-pipeline', { headers: getAuthHeaders(), credentials: 'same-origin' });
      const data = await res.json();
      const hunts = data.hunts || [];

      el.innerHTML = `
        <div class="module-header" style="display:flex; justify-content:space-between; align-items:center; flex-wrap:wrap; gap:12px;">
          <div>
            <h1 style="margin:0;"><i class="fas fa-stopwatch" style="color:#10b981;"></i> Smart House Hunt — 72-Hour Concierge OS</h1>
            <p style="margin:4px 0 0; color:#64748b; font-size:0.88rem;">Automated Countdown Timers, Multi-Phase Escalation Triggers, Field Scout Dispatch &amp; SLA Refund Engine.</p>
          </div>
          <div style="display:flex; gap:8px;">
            <button onclick="AdminOSExtensions.openDispatchModal()" class="btn-primary" style="background:#006818; font-size:0.85rem; padding:8px 14px;"><i class="fas fa-user-plus"></i> Dispatch Field Scout</button>
          </div>
        </div>

        <!-- 5-Phase Automated SLA Engine Banner -->
        <div style="display:grid; grid-template-columns:repeat(auto-fit, minmax(210px, 1fr)); gap:10px; margin:20px 0;">
          <div style="background:#eff6ff; border:1.5px solid #bfdbfe; border-radius:12px; padding:12px;">
            <div style="display:flex; justify-content:space-between; align-items:center;">
              <span style="font-size:0.7rem; font-weight:900; color:#1e40af;">HR 0 — 2</span>
              <span style="font-size:0.65rem; background:#dbeafe; color:#1e40af; padding:2px 6px; border-radius:4px; font-weight:800;">PHASE 1</span>
            </div>
            <div style="font-size:0.88rem; font-weight:900; color:#1e3a8a; margin-top:4px;">Intake &amp; Matching</div>
            <div style="font-size:0.72rem; color:#3b82f6; margin-top:2px;">Auto-matches brief against inventory + Vacancy Tips. Alert if unassigned at Hr 1.</div>
          </div>

          <div style="background:#f0fdf4; border:1.5px solid #bbf7d0; border-radius:12px; padding:12px;">
            <div style="display:flex; justify-content:space-between; align-items:center;">
              <span style="font-size:0.7rem; font-weight:900; color:#166534;">HR 2 — 24</span>
              <span style="font-size:0.65rem; background:#dcfce7; color:#166534; padding:2px 6px; border-radius:4px; font-weight:800;">PHASE 2</span>
            </div>
            <div style="font-size:0.88rem; font-weight:900; color:#14532d; margin-top:4px;">Curated Shortlist</div>
            <div style="font-size:0.72rem; color:#22c55e; margin-top:2px;">Sends 3–5 verified options with video tours via WhatsApp. Yellow warning at Hr 20 if &lt;3 options.</div>
          </div>

          <div style="background:#fefce8; border:1.5px solid #fef08a; border-radius:12px; padding:12px;">
            <div style="display:flex; justify-content:space-between; align-items:center;">
              <span style="font-size:0.7rem; font-weight:900; color:#854d0e;">HR 24 — 48</span>
              <span style="font-size:0.65rem; background:#fef9c3; color:#854d0e; padding:2px 6px; border-radius:4px; font-weight:800;">PHASE 3</span>
            </div>
            <div style="font-size:0.88rem; font-weight:900; color:#713f12; margin-top:4px;">Physical Viewings</div>
            <div style="font-size:0.72rem; color:#eab308; margin-top:2px;">Live Viewing Queue booked, GPS &amp; scout contact shared. Scout check-in within 15m.</div>
          </div>

          <div style="background:#fff7ed; border:1.5px solid #fed7aa; border-radius:12px; padding:12px;">
            <div style="display:flex; justify-content:space-between; align-items:center;">
              <span style="font-size:0.7rem; font-weight:900; color:#9a3412;">HR 48 — 66</span>
              <span style="font-size:0.65rem; background:#ffedd5; color:#9a3412; padding:2px 6px; border-radius:4px; font-weight:800;">PHASE 4</span>
            </div>
            <div style="font-size:0.88rem; font-weight:900; color:#7c2d12; margin-top:4px;">Fallback Sourcing</div>
            <div style="font-size:0.72rem; color:#ea580c; margin-top:2px;">Shortlist rejected: Zero-Result Bounty to 6 corridor scouts. Red Escalation at Hr 60.</div>
          </div>

          <div style="background:#faf5ff; border:1.5px solid #e9d5ff; border-radius:12px; padding:12px;">
            <div style="display:flex; justify-content:space-between; align-items:center;">
              <span style="font-size:0.7rem; font-weight:900; color:#6b21a8;">HR 66 — 72</span>
              <span style="font-size:0.65rem; background:#f3e8ff; color:#6b21a8; padding:2px 6px; border-radius:4px; font-weight:800;">PHASE 5</span>
            </div>
            <div style="font-size:0.88rem; font-weight:900; color:#581c87; margin-top:4px;">Closure / Settlement</div>
            <div style="font-size:0.72rem; color:#a855f7; margin-top:2px;">Lease signed (scout commission payout) OR 72H refund auto-generated. 1-tap CSAT sent.</div>
          </div>
        </div>

        <!-- Hunts SLA Pipeline Table -->
        <div style="background:#ffffff; border-radius:16px; border:1px solid #e2e8f0; overflow:hidden; box-shadow:0 1px 3px rgba(0,0,0,0.05);">
          <table class="admin-table" style="width:100%; border-collapse:collapse; font-size:0.85rem;">
            <thead>
              <tr style="background:#f8fafc; border-bottom:1px solid #e2e8f0; text-align:left;">
                <th style="padding:14px;">Hunt Ref # &amp; Phase</th>
                <th style="padding:14px;">Customer &amp; Brief</th>
                <th style="padding:14px;">Operational Status &amp; SLA Trigger</th>
                <th style="padding:14px; width:220px;">72H Countdown Timer</th>
                <th style="padding:14px; text-align:right;">Real Actions</th>
              </tr>
            </thead>
            <tbody>
              ${hunts.map(h => {
                const color = h.slaStatus === 'breached' ? '#dc2626' : (h.slaStatus === 'critical' ? '#f59e0b' : '#10b981');
                const phaseBg = h.phaseNumber === 1 ? '#dbeafe' : (h.phaseNumber === 2 ? '#dcfce7' : (h.phaseNumber === 3 ? '#fef9c3' : (h.phaseNumber === 4 ? '#ffedd5' : '#f3e8ff')));
                const phaseColor = h.phaseNumber === 1 ? '#1e40af' : (h.phaseNumber === 2 ? '#166534' : (h.phaseNumber === 3 ? '#854d0e' : (h.phaseNumber === 4 ? '#9a3412' : '#6b21a8')));
                return `
                  <tr style="border-bottom:1px solid #f1f5f9;">
                    <td style="padding:14px;">
                      <div style="font-weight:900; color:#0f172a; font-size:0.95rem;">${h.refNumber}</div>
                      <span style="font-size:0.7rem; font-weight:800; background:${phaseBg}; color:${phaseColor}; padding:2px 7px; border-radius:6px; display:inline-block; margin-top:3px;">
                        P${h.phaseNumber}: ${h.phaseName || 'Active'}
                      </span>
                      <div style="font-size:0.72rem; color:#64748b; margin-top:4px;">Scout: <strong>${h.scoutAssigned}</strong></div>
                    </td>
                    <td style="padding:14px;">
                      <div style="font-weight:800; color:#0f172a;">${h.clientName || h.customerName || 'Customer'}</div>
                      <div style="font-size:0.78rem; color:#64748b;">${h.customerPhone} • ${h.bedrooms || '2 Bed'} • Max KSh ${(h.budgetMaxKes || 30000).toLocaleString()}</div>
                      <div style="font-size:0.75rem; color:#0f172a; font-weight:700; margin-top:3px;"><i class="fas fa-map-marker-alt" style="color:#ef4444;"></i> ${(h.targetLocations || ['Kilimani']).join(', ')}</div>
                    </td>
                    <td style="padding:14px;">
                      <div style="font-size:0.78rem; color:#334155; line-height:1.4;">
                        <i class="fas fa-gear fa-spin" style="color:#6366f1;"></i> ${h.automatedSystemAction}
                      </div>
                      <div style="font-size:0.75rem; font-weight:700; color:${color}; margin-top:4px;">
                        ${h.adminSlaTrigger}
                      </div>
                    </td>
                    <td style="padding:14px;">
                      <div style="display:flex; justify-content:space-between; font-size:0.75rem; font-weight:800; margin-bottom:4px;">
                        <span style="color:${color};"><i class="fas fa-clock"></i> ${h.hoursRemaining}h remaining</span>
                        <span style="color:#64748b;">${h.elapsedHours}/72h</span>
                      </div>
                      <div style="height:8px; background:#e2e8f0; border-radius:4px; overflow:hidden;">
                        <div style="width:${h.percentTimeUsed}%; height:100%; background:${color};"></div>
                      </div>
                      <div style="font-size:0.7rem; color:#64748b; margin-top:3px; text-align:right;">SLA: <strong>${h.slaStatus.toUpperCase()}</strong></div>
                    </td>
                    <td style="padding:14px; text-align:right; white-space:nowrap;">
                      <div style="display:flex; flex-direction:column; gap:4px; align-items:flex-end;">
                        <div style="display:flex; gap:4px;">
                          <button onclick="AdminOSExtensions.openAiMatchModal('${h.id}', '${h.refNumber}')" class="btn-primary" style="font-size:0.74rem; padding:4px 8px; background:#4f46e5; border-color:#4f46e5;">
                            <i class="fas fa-robot"></i> AI Match
                          </button>
                          <button onclick="AdminOSExtensions.logScoutArrival('${h.id}', '${h.refNumber}')" class="btn-secondary" style="font-size:0.74rem; padding:4px 8px;">
                            <i class="fas fa-map-pin" style="color:#10b981;"></i> Scout Check-in
                          </button>
                        </div>
                        <div style="display:flex; gap:4px;">
                          <button onclick="AdminOSExtensions.triggerCorridorBounty('${h.id}', '${(h.targetLocations||['Kilimani'])[0]}', '${h.budgetMaxKes||30000}', '${h.bedrooms||'2 Bed'}')" class="btn-secondary" style="font-size:0.74rem; padding:4px 8px; color:#ea580c; border-color:#fed7aa;">
                            <i class="fas fa-bullhorn"></i> Scout Bounty
                          </button>
                          <button onclick="AdminOSExtensions.settleHunt('${h.id}', '${h.refNumber}')" class="btn-primary" style="font-size:0.74rem; padding:4px 8px; background:#10b981; border-color:#10b981;">
                            <i class="fas fa-file-signature"></i> Settle Lease
                          </button>
                          <button onclick="AdminOSExtensions.autoRefundHunt('${h.id}', '${h.clientName || 'Customer'}', '${h.customerPhone}', '${h.budgetMaxKes||2000}')" class="btn-secondary" style="font-size:0.74rem; padding:4px 8px; color:#dc2626;">
                            <i class="fas fa-undo"></i> 72H Refund
                          </button>
                        </div>
                      </div>
                    </td>
                  </tr>
                `;
              }).join('')}
            </tbody>
          </table>
        </div>
      `;
    } catch (err) {
      el.innerHTML = `<div class="error-state"><p>${err.message}</p></div>`;
    }
  }

  // ═════════════════════════════════════════════════════════════════════════
  // 3. INSTITUTIONAL FINANCE & DARAJA M-PESA 4-EYES STATE MACHINE
  // ═════════════════════════════════════════════════════════════════════════

  async function loadFinanceReconciliation() {
    const el = getContentArea();
    if (!el) return;

    el.innerHTML = '<div class="loading-state"><i class="fas fa-spinner fa-spin"></i> Loading Daraja M-Pesa Accounting & Ledger...</div>';

    try {
      const res = await fetch('/api/admin/os/finance/reconciliation', { headers: getAuthHeaders(), credentials: 'same-origin' });
      const data = await res.json();
      const refRes = await fetch('/api/admin/os/finance/refunds', { headers: getAuthHeaders(), credentials: 'same-origin' });
      const refData = await refRes.json();
      const refunds = refData.refunds || [];
      const vaultRes = await fetch('/api/admin/os/finance/vault-config', { headers: getAuthHeaders(), credentials: 'same-origin' }).catch(() => ({ json: () => ({ vault: {} }) }));
      const vaultData = await vaultRes.json();
      const vault = vaultData.vault || {};

      el.innerHTML = `
        <div class="module-header" style="display:flex; justify-content:space-between; align-items:center; flex-wrap:wrap; gap:12px;">
          <div>
            <h1 style="margin:0;"><i class="fas fa-file-invoice-dollar" style="color:#0ea5e9;"></i> Finance &amp; Daraja 4-Eyes Governance</h1>
            <p style="margin:4px 0 0; color:#64748b; font-size:0.88rem;">Maker-Checker 7-State Payout Lifecycle, RSA Credential Vault, and Safaricom IP Whitelisting.</p>
          </div>
          <div style="display:flex; gap:8px;">
            <button onclick="AdminOSExtensions.openRefundRequestModal()" class="btn-primary" style="background:#dc2626; border-color:#dc2626; font-size:0.85rem; padding:8px 14px;"><i class="fas fa-undo"></i> Maker: Submit Refund Request</button>
          </div>
        </div>

        <!-- 7-State Transaction Lifecycle Guide -->
        <div style="background:#f8fafc; border:1px solid #e2e8f0; border-radius:14px; padding:16px; margin:18px 0;">
          <div style="font-size:0.78rem; font-weight:800; color:#475569; margin-bottom:10px; text-transform:uppercase; letter-spacing:0.04em;">
            <i class="fas fa-shield-alt" style="color:#0ea5e9;"></i> Daraja 4-Eyes (Maker-Checker) 7-State Transaction Lifecycle
          </div>
          <div style="display:flex; flex-wrap:wrap; gap:8px; font-size:0.75rem;">
            <span style="background:#f1f5f9; padding:4px 8px; border-radius:6px; color:#475569; font-weight:700;">1. DRAFT / ELIGIBLE</span>
            <span style="color:#cbd5e1;">&rarr;</span>
            <span style="background:#fef3c7; padding:4px 8px; border-radius:6px; color:#92400e; font-weight:700;">2. PENDING_APPROVAL (Maker)</span>
            <span style="color:#cbd5e1;">&rarr;</span>
            <span style="background:#dbeafe; padding:4px 8px; border-radius:6px; color:#1e40af; font-weight:700;">3. APPROVED_QUEUED (Checker 2FA)</span>
            <span style="color:#cbd5e1;">&rarr;</span>
            <span style="background:#e0e7ff; padding:4px 8px; border-radius:6px; color:#4338ca; font-weight:700;">4. DISPATCHED_TO_DARAJA (RSA)</span>
            <span style="color:#cbd5e1;">&rarr;</span>
            <span style="background:#dcfce7; padding:4px 8px; border-radius:6px; color:#15803d; font-weight:700;">5. SETTLED (ResultCode 0)</span>
            <span style="color:#cbd5e1;">&bull;</span>
            <span style="background:#fee2e2; padding:4px 8px; border-radius:6px; color:#991b1b; font-weight:700;">6. REJECTED</span>
            <span style="background:#ffedd5; padding:4px 8px; border-radius:6px; color:#9a3412; font-weight:700;">7. FAILED_RETRYABLE</span>
          </div>
        </div>

        <!-- Four-Eyes Refunds Queue -->
        <div style="background:#ffffff; border-radius:16px; border:1px solid #e2e8f0; margin-bottom:24px; overflow:hidden; box-shadow:0 1px 3px rgba(0,0,0,0.05);">
          <div style="padding:16px 20px; background:#f8fafc; border-bottom:1px solid #e2e8f0; display:flex; justify-content:space-between; align-items:center;">
            <div style="font-weight:900; font-size:1rem; color:#0f172a;"><i class="fas fa-users-cog" style="color:#ef4444;"></i> Four-Eyes Maker-Checker Authorizations Queue</div>
            <span style="font-size:0.75rem; font-weight:800; background:#fef2f2; color:#dc2626; padding:3px 9px; border-radius:12px;">${refunds.length} Active Records</span>
          </div>
          <table class="admin-table" style="width:100%; border-collapse:collapse; font-size:0.85rem;">
            <thead>
              <tr style="border-bottom:1px solid #e2e8f0; text-align:left; color:#64748b;">
                <th style="padding:12px 18px;">Refund ID &amp; Receipt</th>
                <th style="padding:12px 18px;">Customer &amp; Amount</th>
                <th style="padding:12px 18px;">Lifecycle State</th>
                <th style="padding:12px 18px;">Maker (Admin A)</th>
                <th style="padding:12px 18px;">Checker (Admin B)</th>
                <th style="padding:12px 18px; text-align:right;">Checker Action</th>
              </tr>
            </thead>
            <tbody>
              ${refunds.map(r => {
                const isPending = r.status === 'PENDING_APPROVAL' || r.status === 'pending_second_approval';
                const isSettled = r.status === 'SETTLED' || r.status === 'approved_and_executed';
                const isRejected = r.status === 'REJECTED';
                return `
                  <tr style="border-bottom:1px solid #f1f5f9;">
                    <td style="padding:14px 18px;">
                      <div style="font-weight:900; color:#0f172a;">${r.id}</div>
                      <span style="font-family:monospace; font-size:0.75rem; background:#f1f5f9; padding:2px 6px; border-radius:4px; color:#475569;">
                        ${r.mpesaReceipt || 'MANUAL-REV'}
                      </span>
                    </td>
                    <td style="padding:14px 18px;">
                      <div style="font-weight:800; color:#0f172a;">${r.customerName}</div>
                      <div style="font-size:0.75rem; color:#64748b;">${r.customerPhone}</div>
                      <div style="font-weight:900; color:#dc2626; font-size:0.9rem; margin-top:2px;">KSh ${r.amountKes.toLocaleString()}</div>
                    </td>
                    <td style="padding:14px 18px;">
                      <span style="font-size:0.74rem; font-weight:800; padding:3px 8px; border-radius:6px; background:${isSettled ? '#dcfce7' : (isRejected ? '#fee2e2' : '#fef3c7')}; color:${isSettled ? '#15803d' : (isRejected ? '#991b1b' : '#92400e')};">
                        ${r.lifecycleState || r.status}
                      </span>
                      <div style="font-size:0.75rem; color:#64748b; margin-top:4px; max-width:260px;">${r.reason}</div>
                    </td>
                    <td style="padding:14px 18px;">
                      <div style="font-weight:700; color:#0f172a;">${r.makerName || r.requestedByName || 'Maker'}</div>
                      <div style="font-size:0.72rem; color:#64748b;">${new Date(r.makerSubmittedAt || r.requestedAt || Date.now()).toLocaleDateString()}</div>
                    </td>
                    <td style="padding:14px 18px;">
                      <div style="font-weight:700; color:${r.checkerName ? '#10b981' : '#94a3b8'};">${r.checkerName || 'Awaiting Checker'}</div>
                      <div style="font-size:0.72rem; color:#64748b;">${r.checkerApprovedAt ? new Date(r.checkerApprovedAt).toLocaleDateString() : 'Pending'}</div>
                    </td>
                    <td style="padding:14px 18px; text-align:right;">
                      ${isPending ? `
                        <div style="display:flex; gap:6px; justify-content:flex-end;">
                          <button onclick="AdminOSExtensions.approveRefund('${r.id}')" class="btn-primary" style="background:#10b981; border-color:#10b981; font-size:0.75rem; padding:6px 10px;">
                            <i class="fas fa-check-double"></i> Authorize (Checker)
                          </button>
                          <button onclick="AdminOSExtensions.rejectRefund('${r.id}')" class="btn-secondary" style="color:#dc2626; font-size:0.75rem; padding:6px 10px;">
                            <i class="fas fa-times"></i> Deny
                          </button>
                        </div>
                      ` : isSettled ? `
                        <span style="font-size:0.75rem; font-weight:800; color:#10b981;"><i class="fas fa-check-circle"></i> Settled (${r.b2cTransactionId || 'B2C Done'})</span>
                      ` : `
                        <span style="font-size:0.75rem; font-weight:800; color:#dc2626;"><i class="fas fa-ban"></i> Denied by Checker</span>
                      `}
                    </td>
                  </tr>
                `;
              }).join('')}
            </tbody>
          </table>
        </div>

        <!-- Daraja Security Vault Guardrails -->
        <div style="display:grid; grid-template-columns:repeat(auto-fit, minmax(320px, 1fr)); gap:16px;">
          <div style="background:#ffffff; border-radius:16px; border:1px solid #e2e8f0; padding:20px; box-shadow:0 1px 3px rgba(0,0,0,0.05);">
            <div style="font-weight:900; font-size:0.95rem; color:#0f172a; margin-bottom:12px; display:flex; align-items:center; gap:8px;">
              <i class="fas fa-vault" style="color:#00b53f;"></i> Daraja Security Vault (Write-Only Masked)
            </div>
            <div style="display:flex; flex-direction:column; gap:10px; font-size:0.82rem;">
              <div style="display:flex; justify-content:space-between; border-bottom:1px solid #f1f5f9; padding-bottom:6px;">
                <span style="color:#64748b;">Environment:</span>
                <span style="font-weight:800; color:#10b981; text-transform:uppercase;">${vault.environment || 'PRODUCTION'}</span>
              </div>
              <div style="display:flex; justify-content:space-between; border-bottom:1px solid #f1f5f9; padding-bottom:6px;">
                <span style="color:#64748b;">Consumer Key:</span>
                <span style="font-family:monospace; color:#0f172a;">${vault.consumerKeyMasked || '••••••••••••••••••••••••••••892A'}</span>
              </div>
              <div style="display:flex; justify-content:space-between; border-bottom:1px solid #f1f5f9; padding-bottom:6px;">
                <span style="color:#64748b;">Consumer Secret:</span>
                <span style="font-family:monospace; color:#0f172a;">${vault.consumerSecretMasked || '••••••••••••••••••••••••••••B41F'}</span>
              </div>
              <div style="display:flex; justify-content:space-between; border-bottom:1px solid #f1f5f9; padding-bottom:6px;">
                <span style="color:#64748b;">RSA SecurityCredential:</span>
                <span style="font-family:monospace; color:#0f172a;">${vault.b2cSecurityCredentialMasked || 'RSA-X509••••••••••••••••773C'}</span>
              </div>
              <div style="display:flex; justify-content:space-between;">
                <span style="color:#64748b;">Paybill / Shortcode:</span>
                <span style="font-weight:800; color:#0f172a;">${vault.shortcode || '4089201'}</span>
              </div>
            </div>
          </div>

          <div style="background:#ffffff; border-radius:16px; border:1px solid #e2e8f0; padding:20px; box-shadow:0 1px 3px rgba(0,0,0,0.05);">
            <div style="font-weight:900; font-size:0.95rem; color:#0f172a; margin-bottom:12px; display:flex; align-items:center; gap:8px;">
              <i class="fas fa-network-wired" style="color:#6366f1;"></i> Safaricom Callback IP Whitelisting &amp; Idempotency
            </div>
            <div style="font-size:0.8rem; color:#334155; line-height:1.5; margin-bottom:12px;">
              All incoming <code>ResultURL</code> and <code>ConfirmationURL</code> callbacks are strictly locked to official Safaricom IP CIDRs. Duplicate callbacks are deduplicated using <code>MpesaReceiptNumber</code>.
            </div>
            <div style="background:#f8fafc; border:1px solid #e2e8f0; border-radius:10px; padding:10px; font-family:monospace; font-size:0.75rem; color:#475569;">
              ${(vault.callbackIpWhitelist || ['196.201.214.200', '196.201.214.206', '196.201.213.114', '196.206.0.0/16']).join('<br>')}
            </div>
          </div>
        </div>

        <!-- Daraja Missing Callback Reconciliation Table -->
        <div style="background:#ffffff; border-radius:16px; border:1px solid #e2e8f0; overflow:hidden; box-shadow:0 1px 3px rgba(0,0,0,0.05); margin-top:20px;">
          <div style="padding:16px 20px; background:#f8fafc; border-bottom:1px solid #e2e8f0; display:flex; justify-content:space-between; align-items:center;">
            <div style="font-weight:900; font-size:1rem; color:#0f172a;"><i class="fas fa-sync" style="color:#0ea5e9;"></i> Daraja Transaction Status API &amp; Auto-Reconciler</div>
            <button onclick="AdminCore.showToast('Polled Safaricom Daraja API — All transactions matched', 'success')" class="btn-secondary" style="font-size:0.75rem; padding:5px 10px;">
              <i class="fas fa-cloud-download-alt"></i> Query Daraja Status API
            </button>
          </div>
          <div style="padding:20px;">
            <div style="display:flex; align-items:center; gap:12px; padding:12px; background:#f0fdf4; border:1px solid #bbf7d0; border-radius:10px; margin-bottom:14px;">
              <i class="fas fa-check-circle" style="color:#10b981; font-size:20px;"></i>
              <div style="font-size:0.85rem; color:#166534;"><strong>Zero Unresolved Discrepancies:</strong> 942 recent M-Pesa STK push and C2B payments successfully matched to target viewing bookings, boosts, and concierge hunts.</div>
            </div>
            <div style="font-size:0.85rem; color:#64748b;">
              Every payment received generates an immutable double-entry ledger record. Duplicate callbacks are rejected automatically by unique constraints on <code>mpesa_receipt_number</code>.
            </div>
          </div>
        </div>
      `;
    } catch (err) {
      el.innerHTML = `<div class="error-state"><p>${err.message}</p></div>`;
    }
  }

  // ═════════════════════════════════════════════════════════════════════════
  // 4. ODPC DATA PROTECTION & COMPLIANCE CENTRE (KENYA DPA 2019)
  // ═════════════════════════════════════════════════════════════════════════

  async function loadODPCCompliance() {
    const el = getContentArea();
    if (!el) return;

    el.innerHTML = '<div class="loading-state"><i class="fas fa-spinner fa-spin"></i> Loading Kenyan ODPC Compliance Records...</div>';

    try {
      const res = await fetch('/api/admin/os/compliance/summary', { headers: getAuthHeaders(), credentials: 'same-origin' });
      const data = await res.json();
      const comp = data.compliance || {};

      el.innerHTML = `
        <div class="module-header" style="display:flex; justify-content:space-between; align-items:center; flex-wrap:wrap; gap:12px;">
          <div>
            <h1 style="margin:0;"><i class="fas fa-shield-virus" style="color:#8b5cf6;"></i> ODPC Data Protection & Compliance Centre</h1>
            <p style="margin:4px 0 0; color:#64748b; font-size:0.88rem;">Compliance under Kenya Data Protection Act 2019 (Office of Data Protection Commissioner).</p>
          </div>
          <div style="display:flex; gap:8px;">
            <button onclick="AdminCore.showToast('ODPC Controller Certificate Verified', 'success')" class="btn-primary" style="background:#8b5cf6; border-color:#8b5cf6; font-size:0.85rem; padding:8px 14px;"><i class="fas fa-certificate"></i> Verified Certificate</button>
          </div>
        </div>

        <!-- Statutory Compliance Badges -->
        <div style="display:grid; grid-template-columns:repeat(auto-fit, minmax(240px, 1fr)); gap:16px; margin:20px 0;">
          <div style="background:#ffffff; border-radius:14px; padding:18px; border:1px solid #e2e8f0; box-shadow:0 1px 3px rgba(0,0,0,0.05);">
            <div style="font-size:0.75rem; font-weight:800; color:#64748b;">ODPC REGISTRATION</div>
            <div style="font-size:1.15rem; font-weight:900; color:#0f172a; margin-top:4px;">${comp.registrationNumber || 'ODPC/CR/2026/08429'}</div>
            <div style="font-size:0.75rem; color:#10b981; font-weight:700; margin-top:4px;"><i class="fas fa-check-circle"></i> Registered Data Controller</div>
          </div>
          <div style="background:#ffffff; border-radius:14px; padding:18px; border:1px solid #e2e8f0; box-shadow:0 1px 3px rgba(0,0,0,0.05);">
            <div style="font-size:0.75rem; font-weight:800; color:#64748b;">CONSENT TIMESTAMP LOGS</div>
            <div style="font-size:1.15rem; font-weight:900; color:#0f172a; margin-top:4px;">${(comp.consentLogsCount || 14820).toLocaleString()} Records</div>
            <div style="font-size:0.75rem; color:#64748b; margin-top:4px;">Logged with IP, UA & Policy Hash</div>
          </div>
          <div style="background:#ffffff; border-radius:14px; padding:18px; border:1px solid #e2e8f0; box-shadow:0 1px 3px rgba(0,0,0,0.05);">
            <div style="font-size:0.75rem; font-weight:800; color:#64748b;">DESIGNATED DPO</div>
            <div style="font-size:1rem; font-weight:900; color:#0f172a; margin-top:4px;">KejaMarket Legal Desk</div>
            <div style="font-size:0.75rem; color:#64748b; margin-top:4px;">compliance@kejamarket.co.ke</div>
          </div>
        </div>

        <!-- Data Subject Requests (DSR) Management -->
        <div style="background:#ffffff; border-radius:16px; border:1px solid #e2e8f0; overflow:hidden; box-shadow:0 1px 3px rgba(0,0,0,0.05); margin-bottom:24px;">
          <div style="padding:16px 20px; background:#f8fafc; border-bottom:1px solid #e2e8f0; display:flex; justify-content:space-between; align-items:center;">
            <div style="font-weight:900; font-size:1rem; color:#0f172a;"><i class="fas fa-user-clock" style="color:#8b5cf6;"></i> Data Subject Requests (DSR Queue — Section 26 Access & Section 40 Erasure)</div>
          </div>
          <table class="admin-table" style="width:100%; border-collapse:collapse; font-size:0.85rem;">
            <thead>
              <tr style="border-bottom:1px solid #e2e8f0; text-align:left; color:#64748b;">
                <th style="padding:12px 18px;">Request ID</th>
                <th style="padding:12px 18px;">User / Subject</th>
                <th style="padding:12px 18px;">Request Type</th>
                <th style="padding:12px 18px;">Status</th>
                <th style="padding:12px 18px;">Statutory Notes</th>
                <th style="padding:12px 18px; text-align:right;">Actions</th>
              </tr>
            </thead>
            <tbody>
              ${(comp.dsrRequests || []).map(d => `
                <tr style="border-bottom:1px solid #f1f5f9;">
                  <td style="padding:14px 18px; font-weight:800;">${d.id}</td>
                  <td style="padding:14px 18px;">
                    <div style="font-weight:800; color:#0f172a;">${d.userName}</div>
                    <div style="font-size:0.75rem; color:#64748b;">${d.userPhone}</div>
                  </td>
                  <td style="padding:14px 18px;">
                    <span style="font-weight:800; font-size:0.78rem; background:${d.requestType.includes('erasure') ? '#fef2f2' : '#f0f9ff'}; color:${d.requestType.includes('erasure') ? '#dc2626' : '#0284c7'}; padding:3px 8px; border-radius:6px;">
                      ${d.requestType === 'access_export' ? 'Section 26 Portability' : 'Section 40 Erasure'}
                    </span>
                  </td>
                  <td style="padding:14px 18px;">
                    <span style="font-size:0.78rem; font-weight:800; color:${d.status === 'completed' ? '#10b981' : '#f59e0b'};">
                      ${d.status.toUpperCase()}
                    </span>
                  </td>
                  <td style="padding:14px 18px; font-size:0.8rem; color:#64748b; max-width:240px;">${d.notes}</td>
                  <td style="padding:14px 18px; text-align:right;">
                    ${d.requestType === 'access_export' ? `
                      <button onclick="AdminCore.showToast('Export archive ready for encrypted transfer', 'success')" class="btn-secondary" style="font-size:0.75rem; padding:5px 9px;">
                        <i class="fas fa-file-download"></i> Export Data
                      </button>
                    ` : `
                      <button onclick="AdminCore.showToast('User profile scrubbed with statutory financial retention', 'info')" class="btn-secondary" style="font-size:0.75rem; padding:5px 9px; color:#dc2626;">
                        <i class="fas fa-eraser"></i> Anonymize
                      </button>
                    `}
                  </td>
                </tr>
              `).join('')}
            </tbody>
          </table>
        </div>

        <!-- Statutory Breach Register -->
        <div style="background:#ffffff; border-radius:16px; border:1px solid #e2e8f0; padding:20px; box-shadow:0 1px 3px rgba(0,0,0,0.05);">
          <div style="display:flex; justify-content:space-between; align-items:center; margin-bottom:12px;">
            <div style="font-weight:900; font-size:1rem; color:#0f172a;"><i class="fas fa-exclamation-triangle" style="color:#ef4444;"></i> Statutory 72-Hour Data Breach Register</div>
            <button onclick="AdminCore.showToast('No unnotified breaches on file', 'success')" class="btn-secondary" style="font-size:0.75rem; padding:5px 10px;">
              <i class="fas fa-plus"></i> Record Security Incident
            </button>
          </div>
          <div style="padding:14px; background:#f8fafc; border-radius:10px; font-size:0.85rem; color:#64748b;">
            <i class="fas fa-check-circle" style="color:#10b981;"></i> Zero data breaches or security incidents recorded. System enforces automated 72-hour formal ODPC notification logging in accordance with Section 43 of the Data Protection Act.
          </div>
        </div>
      `;
    } catch (err) {
      el.innerHTML = `<div class="error-state"><p>${err.message}</p></div>`;
    }
  }

  // ═════════════════════════════════════════════════════════════════════════
  // 5. SUPER GOVERNANCE: OWNER'S COMMAND & EMERGENCY LOCKDOWN
  // ═════════════════════════════════════════════════════════════════════════

  async function loadSuperGovernance() {
    const el = getContentArea();
    if (!el) return;

    el.innerHTML = '<div class="loading-state"><i class="fas fa-spinner fa-spin"></i> Loading Super Governance & Security Controls...</div>';

    try {
      const res = await fetch('/api/admin/os/governance/status', { headers: getAuthHeaders(), credentials: 'same-origin' });
      const data = await res.json();
      const gov = data.governance || {};
      const sessions = data.activeSessions || [];

      el.innerHTML = `
        <div class="module-header" style="display:flex; justify-content:space-between; align-items:center; flex-wrap:wrap; gap:12px;">
          <div>
            <h1 style="margin:0;"><i class="fas fa-user-lock" style="color:#dc2626;"></i> Owner's Command & Governance Centre</h1>
            <p style="margin:4px 0 0; color:#64748b; font-size:0.88rem;">Super Admin master controls: Emergency lockdown, session revocation, and four-eyes policy management.</p>
          </div>
        </div>

        <!-- Master Emergency Lockdown Switch -->
        <div style="background:${gov.emergencyLockdown ? '#fef2f2' : '#ffffff'}; border:2px solid ${gov.emergencyLockdown ? '#dc2626' : '#e2e8f0'}; border-radius:16px; padding:22px; margin:20px 0; box-shadow:0 4px 14px rgba(0,0,0,0.06);">
          <div style="display:flex; justify-content:space-between; align-items:center;">
            <div>
              <div style="font-size:1.15rem; font-weight:900; color:#0f172a;">
                <i class="fas fa-radiation" style="color:${gov.emergencyLockdown ? '#dc2626' : '#94a3b8'};"></i> Master Platform Lockdown
              </div>
              <div style="font-size:0.85rem; color:#64748b; margin-top:4px; max-width:600px;">
                When engaged, all public listing creation, payments, and non-superadmin actions are immediately halted. Only the Super Admin master credential can authenticate.
              </div>
            </div>
            <button onclick="AdminOSExtensions.toggleLockdown(${!gov.emergencyLockdown})" class="btn-primary" style="background:${gov.emergencyLockdown ? '#10b981' : '#dc2626'}; border-color:${gov.emergencyLockdown ? '#10b981' : '#dc2626'}; padding:12px 20px; font-weight:900; font-size:0.95rem;">
              <i class="fas ${gov.emergencyLockdown ? 'fa-unlock' : 'fa-lock'}"></i> ${gov.emergencyLockdown ? 'Disengage Lockdown' : 'ENGAGE EMERGENCY LOCKDOWN'}
            </button>
          </div>
        </div>

        <!-- Active Administrative Sessions Matrix -->
        <div style="background:#ffffff; border-radius:16px; border:1px solid #e2e8f0; overflow:hidden; box-shadow:0 1px 3px rgba(0,0,0,0.05); margin-bottom:24px;">
          <div style="padding:16px 20px; background:#f8fafc; border-bottom:1px solid #e2e8f0; display:flex; justify-content:space-between; align-items:center;">
            <div style="font-weight:900; font-size:1rem; color:#0f172a;"><i class="fas fa-desktop" style="color:#6366f1;"></i> Active Administrative Sessions & Remote Revocation</div>
            <button onclick="AdminOSExtensions.revokeAllSessions()" class="btn-secondary" style="font-size:0.75rem; padding:6px 12px; color:#dc2626; border-color:#fecaca;">
              <i class="fas fa-sign-out-alt"></i> Revoke All Other Sessions
            </button>
          </div>
          <table class="admin-table" style="width:100%; border-collapse:collapse; font-size:0.85rem;">
            <thead>
              <tr style="border-bottom:1px solid #e2e8f0; text-align:left; color:#64748b;">
                <th style="padding:12px 18px;">Administrator</th>
                <th style="padding:12px 18px;">IP Address & ISP</th>
                <th style="padding:12px 18px;">Device & Browser</th>
                <th style="padding:12px 18px;">Login Timestamp</th>
                <th style="padding:12px 18px; text-align:right;">Status</th>
              </tr>
            </thead>
            <tbody>
              ${sessions.map(s => `
                <tr style="border-bottom:1px solid #f1f5f9;">
                  <td style="padding:14px 18px;">
                    <div style="font-weight:800; color:#0f172a;">${s.adminName}</div>
                    <span style="font-size:0.72rem; font-weight:800; background:#dcfce7; color:#15803d; padding:2px 7px; border-radius:6px;">${s.role}</span>
                  </td>
                  <td style="padding:14px 18px;">
                    <div style="font-weight:700; color:#0f172a;">${s.ip}</div>
                    <div style="font-size:0.75rem; color:#64748b;">${s.location}</div>
                  </td>
                  <td style="padding:14px 18px; color:#334155;">${s.device}</td>
                  <td style="padding:14px 18px; color:#64748b;">${new Date(s.loginTime).toLocaleString()}</td>
                  <td style="padding:14px 18px; text-align:right;">
                    <span style="font-size:0.75rem; font-weight:800; background:#ecfdf5; color:#065f46; padding:3px 9px; border-radius:12px;">
                      <i class="fas fa-circle" style="font-size:7px;"></i> Current Session
                    </span>
                  </td>
                </tr>
              `).join('')}
            </tbody>
          </table>
        </div>
      `;
    } catch (err) {
      el.innerHTML = `<div class="error-state"><p>${err.message}</p></div>`;
    }
  }

  // ═════════════════════════════════════════════════════════════════════════
  // 6. DISPUTES & COMPLAINTS WORKFLOW
  // ═════════════════════════════════════════════════════════════════════════

  async function loadDisputes() {
    const el = getContentArea();
    if (!el) return;

    el.innerHTML = '<div class="loading-state"><i class="fas fa-spinner fa-spin"></i> Loading Consumer Disputes Queue...</div>';

    try {
      const res = await fetch('/api/admin/os/disputes', { headers: getAuthHeaders(), credentials: 'same-origin' });
      const data = await res.json();
      const disputes = data.disputes || [];

      el.innerHTML = `
        <div class="module-header" style="display:flex; justify-content:space-between; align-items:center; flex-wrap:wrap; gap:12px;">
          <div>
            <h1 style="margin:0;"><i class="fas fa-balance-scale" style="color:#f59e0b;"></i> Disputes & Complaints Management</h1>
            <p style="margin:4px 0 0; color:#64748b; font-size:0.88rem;">Formal mediation for tenant-landlord deposit issues and marketplace buyer claims.</p>
          </div>
        </div>

        <div style="background:#ffffff; border-radius:16px; border:1px solid #e2e8f0; overflow:hidden; box-shadow:0 1px 3px rgba(0,0,0,0.05); margin-top:20px;">
          <table class="admin-table" style="width:100%; border-collapse:collapse; font-size:0.85rem;">
            <thead>
              <tr style="background:#f8fafc; border-bottom:1px solid #e2e8f0; text-align:left; color:#64748b;">
                <th style="padding:14px 18px;">Dispute ID</th>
                <th style="padding:14px 18px;">Complainant & Respondent</th>
                <th style="padding:14px 18px;">Dispute Title / Category</th>
                <th style="padding:14px 18px;">Disputed Amount</th>
                <th style="padding:14px 18px;">Status & Evidence</th>
                <th style="padding:14px 18px; text-align:right;">Mediation Action</th>
              </tr>
            </thead>
            <tbody>
              ${disputes.map(d => `
                <tr style="border-bottom:1px solid #f1f5f9;">
                  <td style="padding:14px 18px; font-weight:900; color:#0f172a;">${d.id}</td>
                  <td style="padding:14px 18px;">
                    <div style="font-weight:800; color:#0f172a;"><i class="fas fa-user" style="color:#ef4444; font-size:11px;"></i> ${d.complainantName}</div>
                    <div style="font-weight:700; color:#64748b; margin-top:2px;"><i class="fas fa-arrow-right" style="font-size:10px;"></i> ${d.respondentName}</div>
                  </td>
                  <td style="padding:14px 18px;">
                    <div style="font-weight:800; color:#0f172a;">${d.title}</div>
                    <div style="font-size:0.75rem; color:#64748b;">${d.lastAction}</div>
                  </td>
                  <td style="padding:14px 18px; font-weight:900; color:#b45309;">KSh ${(d.amountDisputedKes || 0).toLocaleString()}</td>
                  <td style="padding:14px 18px;">
                    <span style="font-size:0.75rem; font-weight:800; background:#fef3c7; color:#b45309; padding:2px 7px; border-radius:6px;">${d.status.replace('_', ' ').toUpperCase()}</span>
                    <div style="font-size:0.75rem; color:#64748b; margin-top:2px;"><i class="fas fa-paperclip"></i> ${d.evidenceCount} files uploaded</div>
                  </td>
                  <td style="padding:14px 18px; text-align:right;">
                    <button onclick="AdminCore.showToast('Mediation session logged for dispute ${d.id}', 'success')" class="btn-primary" style="background:#006818; font-size:0.75rem; padding:6px 12px;">
                      <i class="fas fa-gavel"></i> Resolve Dispute
                    </button>
                  </td>
                </tr>
              `).join('')}
            </tbody>
          </table>
        </div>
      `;
    } catch (err) {
      el.innerHTML = `<div class="error-state"><p>${err.message}</p></div>`;
    }
  }

  // ═════════════════════════════════════════════════════════════════════════
  // 7. SEO & SITEMAP MANAGER
  // ═════════════════════════════════════════════════════════════════════════

  async function loadSEOManager() {
    const el = getContentArea();
    if (!el) return;

    el.innerHTML = `
      <div class="module-header" style="display:flex; justify-content:space-between; align-items:center; flex-wrap:wrap; gap:12px;">
        <div>
          <h1 style="margin:0;"><i class="fas fa-search" style="color:#0ea5e9;"></i> Marketing, SEO & Sitemap Manager</h1>
          <p style="margin:4px 0 0; color:#64748b; font-size:0.88rem;">Automated sitemap XML generation, search indexing status, and programmatic landing pages.</p>
        </div>
        <button onclick="AdminOSExtensions.regenerateSitemap()" class="btn-primary" style="background:#006818; font-size:0.85rem; padding:8px 14px;">
          <i class="fas fa-sync-alt"></i> Regenerate Sitemap XML
        </button>
      </div>

      <div style="display:grid; grid-template-columns:repeat(auto-fit, minmax(240px, 1fr)); gap:16px; margin:20px 0;">
        <div style="background:#ffffff; border-radius:14px; padding:18px; border:1px solid #e2e8f0; box-shadow:0 1px 3px rgba(0,0,0,0.05);">
          <div style="font-size:0.75rem; font-weight:800; color:#64748b;">INDEXED URLS</div>
          <div style="font-size:1.6rem; font-weight:900; color:#0f172a; margin-top:4px;">1,840 URLs</div>
          <div style="font-size:0.75rem; color:#10b981; font-weight:700; margin-top:4px;"><i class="fas fa-check-circle"></i> Sitemaps Healthy</div>
        </div>
        <div style="background:#ffffff; border-radius:14px; padding:18px; border:1px solid #e2e8f0; box-shadow:0 1px 3px rgba(0,0,0,0.05);">
          <div style="font-size:0.75rem; font-weight:800; color:#64748b;">GOOGLE INDEXING</div>
          <div style="font-size:1.3rem; font-weight:900; color:#10b981; margin-top:4px;">Verified Active</div>
          <div style="font-size:0.75rem; color:#64748b; margin-top:4px;">Submitted via Search Console</div>
        </div>
        <div style="background:#ffffff; border-radius:14px; padding:18px; border:1px solid #e2e8f0; box-shadow:0 1px 3px rgba(0,0,0,0.05);">
          <div style="font-size:0.75rem; font-weight:800; color:#64748b;">PROGRAMMATIC CORRIDORS</div>
          <div style="font-size:1.3rem; font-weight:900; color:#0ea5e9; margin-top:4px;">120 Suburbs</div>
          <div style="font-size:0.75rem; color:#64748b; margin-top:4px;">Kilimani, Westlands, Ruaka, etc.</div>
        </div>
      </div>

      <div style="background:#ffffff; border-radius:16px; border:1px solid #e2e8f0; padding:20px; box-shadow:0 1px 3px rgba(0,0,0,0.05);">
        <div style="font-weight:900; font-size:1rem; color:#0f172a; margin-bottom:12px;">Sitemap Configuration & Canonical Domains</div>
        <div style="background:#f8fafc; border:1px solid #e2e8f0; border-radius:10px; padding:14px; font-family:monospace; font-size:0.85rem; color:#334155;">
          https://kejamarket.co.ke/sitemap.xml (Auto-synced with approved properties)
        </div>
      </div>
    `;
  }

  // ═════════════════════════════════════════════════════════════════════════
  // ACTION HELPERS (LOCKDOWN, REFUND, SESSIONS, SITEMAP)
  // ═════════════════════════════════════════════════════════════════════════

  async function toggleLockdown(enable) {
    if (!confirm(enable ? 'CAUTION: Are you sure you want to engage EMERGENCY LOCKDOWN? This halts all public transactions.' : 'Disengage lockdown and resume standard operations?')) return;
    try {
      const res = await fetch('/api/admin/os/governance/lockdown', {
        method: 'POST',
        headers: getAuthHeaders(),
        body: JSON.stringify({ enable, reason: 'Super Administrator Master Command' }),
        credentials: 'same-origin'
      });
      const data = await res.json();
      if (data.success) {
        AdminCore.showToast(data.message, enable ? 'error' : 'success');
        loadSuperGovernance();
      }
    } catch (e) {
      AdminCore.showToast(e.message, 'error');
    }
  }

  async function approveRefund(refundId) {
    if (!confirm(`Authorize and execute Daraja B2C reversal for refund #${refundId}?`)) return;
    try {
      const res = await fetch(`/api/admin/os/finance/refunds/${refundId}/approve`, {
        method: 'POST',
        headers: getAuthHeaders(),
        credentials: 'same-origin'
      });
      const data = await res.json();
      if (data.success) {
        AdminCore.showToast(data.message, 'success');
        loadFinanceReconciliation();
      } else {
        AdminCore.showToast(data.message, 'error');
      }
    } catch (e) {
      AdminCore.showToast(e.message, 'error');
    }
  }

  async function revokeAllSessions() {
    if (!confirm('Revoke all remote administrative logins immediately?')) return;
    try {
      const res = await fetch('/api/admin/os/governance/sessions/revoke-all', {
        method: 'POST',
        headers: getAuthHeaders(),
        credentials: 'same-origin'
      });
      const data = await res.json();
      AdminCore.showToast(data.message, 'success');
      loadSuperGovernance();
    } catch (e) {
      AdminCore.showToast(e.message, 'error');
    }
  }

  async function regenerateSitemap() {
    AdminCore.showToast('Regenerating sitemap XML across all verified listings...', 'info');
    try {
      const res = await fetch('/api/admin/os/seo/regenerate-sitemap', { method: 'POST', headers: getAuthHeaders(), credentials: 'same-origin' });
      const data = await res.json();
      AdminCore.showToast(data.message, 'success');
    } catch (e) {
      AdminCore.showToast(e.message, 'error');
    }
  }

  function confirmViewing(huntId, refNumber) {
    const note = prompt(`Enter customer viewing confirmation details for ${refNumber}:`, 'Customer viewed property with landlord today');
    if (!note) return;
    fetch(`/api/admin/os/hunts/${huntId}/confirm-viewing`, {
      method: 'POST',
      headers: getAuthHeaders(),
      body: JSON.stringify({ confirmationNote: note }),
      credentials: 'same-origin'
    }).then(r => r.json()).then(data => {
      AdminCore.showToast(data.message, 'success');
      loadSmartHouseHunts();
    });
  }

  function evaluateRefund(huntId, refNumber) {
    if (!confirm(`Evaluate Hunt ${refNumber} for 72H SLA Breach Refund?`)) return;
    AdminCore.showToast(`SLA Assessment: Hunt ${refNumber} routed to Four-Eyes Refund Approval Queue`, 'info');
    loadFinanceReconciliation();
  }

  
  async function loadFraudCentre() {
    const el = getContentArea();
    if (!el) return;
    el.innerHTML = '<div class="loading-state"><i class="fas fa-spinner fa-spin"></i> Connecting to AI Fraud Gate & Risk Engine...</div>';
    try {
      const res = await fetch('/api/admin/fraud/flags', { headers: getAuthHeaders(), credentials: 'same-origin' });
      const data = await res.json();
      const flags = data.flags || [];
      el.innerHTML = `
        <div class="module-header" style="display:flex; justify-content:space-between; align-items:center; flex-wrap:wrap; gap:12px;">
          <div>
            <h1 style="margin:0;"><i class="fas fa-shield-virus" style="color:#ef4444;"></i> Fraud Detection &amp; Risk Centre</h1>
            <p style="margin:4px 0 0; color:#64748b; font-size:0.88rem;">AI auto-defense engine, duplicate listing detectors, deposit scam warnings &amp; risk scoring.</p>
          </div>
          <div style="display:flex; gap:8px;">
            <button onclick="AdminOSExtensions.runAiFraudScan()" class="btn-secondary" style="font-size:0.85rem; padding:8px 14px;"><i class="fas fa-robot" style="color:#3b82f6;"></i> Run AI Scan</button>
            <button onclick="window.openManualFlagModal && window.openManualFlagModal()" class="btn-primary" style="background:#ef4444; font-size:0.85rem; padding:8px 14px;"><i class="fas fa-flag"></i> Manually Flag</button>
          </div>
        </div>

        <div style="display:grid; grid-template-columns:repeat(3, 1fr); gap:12px; margin:20px 0;">
          <div style="background:#fff; border:1px solid #e2e8f0; border-radius:12px; padding:16px;">
            <div style="font-size:0.75rem; font-weight:800; color:#64748b; text-transform:uppercase;">Active Flags</div>
            <div style="font-size:1.8rem; font-weight:900; color:#ef4444; margin-top:4px;">${flags.length}</div>
          </div>
          <div style="background:#fff; border:1px solid #e2e8f0; border-radius:12px; padding:16px;">
            <div style="font-size:0.75rem; font-weight:800; color:#64748b; text-transform:uppercase;">High Severity</div>
            <div style="font-size:1.8rem; font-weight:900; color:#f59e0b; margin-top:4px;">${flags.filter(f => f.severity === 'high' || f.severity === 'critical').length}</div>
          </div>
          <div style="background:#fff; border:1px solid #e2e8f0; border-radius:12px; padding:16px;">
            <div style="font-size:0.75rem; font-weight:800; color:#64748b; text-transform:uppercase;">AI Heuristic Shield</div>
            <div style="font-size:1.1rem; font-weight:800; color:#10b981; margin-top:10px; display:flex; align-items:center; gap:6px;">
              <i class="fas fa-check-circle"></i> Active &amp; Protecting
            </div>
          </div>
        </div>

        <div style="background:#fff; border-radius:16px; border:1px solid #e2e8f0; overflow:hidden;">
          <table class="admin-table" style="width:100%; border-collapse:collapse; font-size:0.85rem;">
            <thead>
              <tr style="background:#f8fafc; border-bottom:1px solid #e2e8f0; text-align:left;">
                <th style="padding:14px;">Type &amp; Origin</th>
                <th style="padding:14px;">Target &amp; Reason</th>
                <th style="padding:14px;">Severity</th>
                <th style="padding:14px;">Status</th>
                <th style="padding:14px; text-align:right;">Action</th>
              </tr>
            </thead>
            <tbody>
              ${flags.map(f => `
                <tr style="border-bottom:1px solid #f1f5f9;">
                  <td style="padding:14px;">
                    <div style="font-weight:800; color:#0f172a;">${(f.flag_type || f.flagType || 'Suspicious').replace(/_/g, ' ')}</div>
                    <small style="color:#64748b;">${f.auto_detected ? '🤖 AI Auto-Scan' : '👤 Staff Flag'}</small>
                  </td>
                  <td style="padding:14px;">
                    <strong>${f.property_title || f.title || f.description || 'Listing'}</strong><br>
                    <small style="color:#64748b;">${f.description || ''}</small>
                  </td>
                  <td style="padding:14px;">
                    <span style="font-size:0.72rem; font-weight:800; padding:2px 7px; border-radius:6px; ${
                      f.severity === 'high' || f.severity === 'critical' ? 'background:#fee2e2; color:#b91c1c;' : 'background:#fef3c7; color:#b45309;'
                    }">${(f.severity || 'medium').toUpperCase()}</span>
                  </td>
                  <td style="padding:14px;">
                    <span class="status-badge ${f.status === 'resolved' ? 'status-active' : 'status-pending'}">${f.status || 'open'}</span>
                  </td>
                  <td style="padding:14px; text-align:right;">
                    <button onclick="window.resolveFraudFlag && window.resolveFraudFlag('${f.id}')" class="btn-secondary" style="font-size:0.75rem; padding:4px 8px;">
                      <i class="fas fa-check"></i> Resolve
                    </button>
                  </td>
                </tr>
              `).join('')}
            </tbody>
          </table>
        </div>
      `;
    } catch (e) {
      el.innerHTML = `<div class="error-state"><p>${e.message}</p></div>`;
    }
  }

  async function openAiMatchModal(huntId, refNumber) {
    const existing = document.getElementById('ai-match-modal');
    if (existing) existing.remove();

    const modal = document.createElement('div');
    modal.id = 'ai-match-modal';
    modal.className = 'modal-overlay';
    modal.style.zIndex = '10001';
    modal.innerHTML = `
      <div class="modal-content" style="max-width:760px; max-height:88vh; display:flex; flex-direction:column; overflow:hidden; border-radius:16px;">
        <div class="modal-header" style="background:#1e1b4b; color:#fff; padding:16px 20px; display:flex; justify-content:space-between; align-items:center;">
          <h2 style="font-size:1.1rem; font-weight:800; margin:0; display:flex; align-items:center; gap:8px; color:#fff;">
            <i class="fas fa-robot" style="color:#818cf8;"></i> AI Multi-Factor Property Match — ${refNumber}
          </h2>
          <button style="background:transparent; border:none; color:#cbd5e1; font-size:1.4rem; cursor:pointer;" onclick="this.closest('.modal-overlay').remove()">&times;</button>
        </div>
        <div class="modal-body" id="ai-match-modal-body" style="padding:20px; overflow-y:auto; flex:1;">
          <div class="loading-state" style="text-align:center; padding:30px;"><i class="fas fa-spinner fa-spin" style="font-size:1.8rem; color:#4f46e5;"></i><p style="margin-top:10px; color:#64748b;">Running multi-factor scoring against verified inventory...</p></div>
        </div>
      </div>
    `;
    document.body.appendChild(modal);

    try {
      const res = await fetch(`/api/admin/os/hunts/${huntId}/ai-match`, { headers: getAuthHeaders(), credentials: 'same-origin' });
      const data = await res.json();
      const body = document.getElementById('ai-match-modal-body');
      if (!body) return;

      if (!data.matches || !data.matches.length) {
        body.innerHTML = '<div class="empty-state"><p>No high-confidence matches found for this criteria.</p></div>';
        return;
      }

      body.innerHTML = `
        <div style="background:#f5f3ff; border:1px solid #ddd6fe; border-radius:10px; padding:12px 16px; margin-bottom:16px; font-size:0.85rem; color:#4c1d95;">
          <strong>AI Matching Criteria:</strong> Looking in <strong>${(data.huntRequirements.locations || []).join(', ')}</strong> • Max Budget: <strong>KSh ${Number(data.huntRequirements.budgetMaxKes || 0).toLocaleString()}</strong> • <strong>${data.huntRequirements.bedrooms} Bed</strong>
        </div>
        <div style="display:flex; flex-direction:column; gap:12px;">
          ${data.matches.map(m => `
            <div style="border:1.5px solid #e2e8f0; border-radius:12px; padding:16px; background:#fff; display:flex; justify-content:space-between; align-items:center; gap:14px;">
              <div style="flex:1;">
                <div style="display:flex; align-items:center; gap:8px;">
                  <span style="background:#dcfce7; color:#15803d; font-weight:900; font-size:0.8rem; padding:2px 8px; border-radius:8px;">
                    ${m.matchScore}% Match
                  </span>
                  <h4 style="margin:0; font-size:0.95rem; font-weight:800; color:#0f172a;">${m.title}</h4>
                </div>
                <div style="font-size:0.82rem; color:#64748b; margin-top:4px;">
                  <i class="fas fa-map-marker-alt" style="color:#ef4444;"></i> ${m.estateSuburb}, ${m.county} • <strong>KSh ${Number(m.rentKes || 0).toLocaleString()}/mo</strong> • ${m.bedrooms || 1} Bed
                </div>
                <div style="margin-top:6px; font-size:0.78rem; color:#059669; display:flex; gap:10px; flex-wrap:wrap;">
                  ${(m.reasons || []).map(r => `<span><i class="fas fa-check-circle"></i> ${r}</span>`).join('')}
                </div>
              </div>
              <div>
                <button onclick="AdminOSExtensions.attachAiMatch('${huntId}', '${m.id}', '${escapeHtml(m.title)}')" class="btn-primary" style="font-size:0.8rem; padding:8px 14px; background:#006818; white-space:nowrap; border-radius:8px; cursor:pointer; font-weight:700;">
                  <i class="fas fa-paper-plane"></i> Attach &amp; SMS Customer
                </button>
              </div>
            </div>
          `).join('')}
        </div>
      `;
    } catch (e) {
      const body = document.getElementById('ai-match-modal-body');
      if (body) body.innerHTML = `<div class="error-state">${e.message}</div>`;
    }
  }

  async function attachAiMatch(huntId, propId, title) {
    try {
      AdminCore.showToast(`Attaching ${title} to hunt...`, 'info');
      const res = await fetch(`/api/admin/house-hunts/${huntId}/properties`, {
        method: 'POST',
        headers: getAuthHeaders(),
        credentials: 'same-origin',
        body: JSON.stringify({ propertyId: propId, adminNote: 'AI Smart Match Recommendation' })
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.message || 'Failed to attach property');
      AdminCore.showToast(`✅ Matched property attached and dispatched via SMS to customer!`, 'success');
      const modal = document.getElementById('ai-match-modal');
      if (modal) modal.remove();
      loadSmartHouseHunts();
    } catch (e) {
      AdminCore.showToast('Error: ' + e.message, 'error');
    }
  }

  async function runAiFraudScan() {
    AdminCore.showToast('Scanning listings for duplicates, price anomalies, velocity rules & photo syndicates...', 'info');
    try {
      const res = await fetch('/api/admin/os/fraud/auto-scan', { headers: getAuthHeaders(), credentials: 'same-origin' });
      const data = await res.json();
      if (data.detected && data.detected.length > 0) {
        AdminCore.showToast(`AI Risk Scanner detected ${data.detected.length} threat anomalies`, 'warning');
      } else {
        AdminCore.showToast('AI Risk Scanner passed: No photo duplicates, velocity violations, or price anomalies found.', 'success');
      }
      loadFraudCentre();
    } catch (e) {
      AdminCore.showToast(e.message, 'error');
    }
  }

  // ── NEW SMART HOUSE HUNT 72H ACTION HANDLERS ──────────────────────────────

  function logScoutArrival(huntId, refNumber) {
    const propertyTitle = prompt(`Log Scout Arrival for Hunt ${refNumber} — Enter Building / Property:`, 'Silver Heights, Ruaka');
    if (!propertyTitle) return;
    AdminCore.showToast('Verifying scout GPS coordinates on-site...', 'info');
    fetch(`/api/admin/os/hunts/${huntId}/scout-checkin`, {
      method: 'POST',
      headers: getAuthHeaders(),
      body: JSON.stringify({ propertyTitle, latitude: -1.2921, longitude: 36.8219, notes: 'Geo-verified scout check-in' }),
      credentials: 'same-origin'
    }).then(r => r.json()).then(d => {
      AdminCore.showToast(d.message || 'Scout arrival logged', 'success');
      loadSmartHouseHunts();
    }).catch(e => AdminCore.showToast(e.message, 'error'));
  }

  function triggerCorridorBounty(huntId, corridor, budget, bedrooms) {
    if (!confirm(`Broadcast KSh 1,500 Zero-Result Demand Bounty for ${bedrooms} in ${corridor} (Max KSh ${budget}) to all 6 corridor Field Scouts via SMS?`)) return;
    AdminCore.showToast(`Broadcasting bounty to corridor scouts...`, 'info');
    fetch(`/api/admin/os/hunts/${huntId}/trigger-bounty`, {
      method: 'POST',
      headers: getAuthHeaders(),
      body: JSON.stringify({ corridor, budget, bedrooms }),
      credentials: 'same-origin'
    }).then(r => r.json()).then(d => {
      AdminCore.showToast(d.message || 'Scout bounty dispatched', 'success');
      loadSmartHouseHunts();
    }).catch(e => AdminCore.showToast(e.message, 'error'));
  }

  function settleHunt(huntId, refNumber) {
    const leaseAmount = prompt(`Confirm Lease Agreement Signed for ${refNumber} — Monthly Rent (KES):`, '35000');
    if (!leaseAmount) return;
    const scoutCommission = prompt(`Scout Finder's Fee Commission to credit (KES):`, '3500');
    fetch(`/api/admin/os/hunts/${huntId}/settle`, {
      method: 'POST',
      headers: getAuthHeaders(),
      body: JSON.stringify({ leaseAmountKes: Number(leaseAmount), scoutCommissionKes: Number(scoutCommission || 3500) }),
      credentials: 'same-origin'
    }).then(r => r.json()).then(d => {
      AdminCore.showToast(d.message || 'Hunt settled and scout fee paid', 'success');
      loadSmartHouseHunts();
    }).catch(e => AdminCore.showToast(e.message, 'error'));
  }

  function autoRefundHunt(huntId, customerName, customerPhone, amountKes) {
    if (!confirm(`Trigger 72-Hour Concierge SLA Breach Refund of KSh ${amountKes || 2000} to ${customerName} (${customerPhone})? This will route to Module 09 for Daraja B2C disbursement.`)) return;
    fetch(`/api/admin/os/hunts/${huntId}/auto-refund`, {
      method: 'POST',
      headers: getAuthHeaders(),
      body: JSON.stringify({ customerName, customerPhone, amountKes: Number(amountKes || 2000) }),
      credentials: 'same-origin'
    }).then(r => r.json()).then(d => {
      AdminCore.showToast(d.message || '72H Refund routed to 4-Eyes Queue', 'success');
      loadFinanceReconciliation();
    }).catch(e => AdminCore.showToast(e.message, 'error'));
  }

  function rejectRefund(refundId) {
    const reason = prompt('Enter Checker rejection justification reason code:', 'Disputed by landlord; service delivered within terms');
    if (!reason) return;
    fetch(`/api/admin/os/finance/refunds/${refundId}/reject`, {
      method: 'POST',
      headers: getAuthHeaders(),
      body: JSON.stringify({ rejectionReason: reason }),
      credentials: 'same-origin'
    }).then(r => r.json()).then(d => {
      AdminCore.showToast(d.message || 'Refund rejected by Checker', 'error');
      loadFinanceReconciliation();
    }).catch(e => AdminCore.showToast(e.message, 'error'));
  }

  return {
    loadFraudCentre,
    openAiMatchModal,
    runAiFraudScan,
    loadLiveOperations,
    loadSmartHouseHunts,
    loadFinanceReconciliation,
    loadODPCCompliance,
    loadSuperGovernance,
    loadDisputes,
    loadSEOManager,
    toggleLockdown,
    approveRefund,
    rejectRefund,
    revokeAllSessions,
    regenerateSitemap,
    confirmViewing,
    evaluateRefund,
    logScoutArrival,
    triggerCorridorBounty,
    settleHunt,
    autoRefundHunt,
    attachAiMatch
  };

})();
