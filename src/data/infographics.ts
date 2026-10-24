/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import type { InfographicItem } from '../types/index.ts';

function svgToDataUrl(svg: string): string {
  return `data:image/svg+xml;utf8,${encodeURIComponent(svg.trim())}`;
}

const CBDC_SVG = `
<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 900 500" width="900" height="500">
  <defs>
    <linearGradient id="bg" x1="0%" y1="0%" x2="100%" y2="100%">
      <stop offset="0%" stop-color="#0b1329"/>
      <stop offset="100%" stop-color="#141f38"/>
    </linearGradient>
    <linearGradient id="gold" x1="0%" y1="0%" x2="100%" y2="100%">
      <stop offset="0%" stop-color="#f59e0b"/>
      <stop offset="100%" stop-color="#d97706"/>
    </linearGradient>
    <linearGradient id="blue" x1="0%" y1="0%" x2="100%" y2="100%">
      <stop offset="0%" stop-color="#38bdf8"/>
      <stop offset="100%" stop-color="#0284c7"/>
    </linearGradient>
    <linearGradient id="emerald" x1="0%" y1="0%" x2="100%" y2="100%">
      <stop offset="0%" stop-color="#34d399"/>
      <stop offset="100%" stop-color="#059669"/>
    </linearGradient>
  </defs>

  <rect width="900" height="500" rx="16" fill="url(#bg)"/>
  <rect x="2" y="2" width="896" height="496" rx="14" fill="none" stroke="#1e293b" stroke-width="2"/>

  <!-- Header Banner -->
  <rect x="30" y="30" width="840" height="60" rx="8" fill="#1e293b" opacity="0.6"/>
  <text x="50" y="65" font-family="system-ui, -apple-system, sans-serif" font-weight="bold" font-size="20" fill="#f8fafc">
    UPSC GS-3 INFOGRAPHIC: RBI Digital Rupee (e₹) Two-Tier Architecture
  </text>
  <text x="50" y="82" font-family="system-ui, -apple-system, sans-serif" font-size="12" fill="#94a3b8">
    Reserve Bank of India Act 1934 (Sec 2(aiv)) · BIS Project mBridge Cross-Border Protocols
  </text>

  <!-- Node 1: Reserve Bank of India (Central Issuer) -->
  <g transform="translate(50, 120)">
    <rect width="240" height="150" rx="12" fill="#1e293b" stroke="#f59e0b" stroke-width="2"/>
    <rect x="16" y="16" width="208" height="30" rx="6" fill="url(#gold)"/>
    <text x="120" y="36" text-anchor="middle" font-family="system-ui, sans-serif" font-weight="bold" font-size="13" fill="#090d16">
      RESERVE BANK OF INDIA
    </text>
    <text x="20" y="70" font-family="system-ui, sans-serif" font-size="11" fill="#cbd5e1">• Centralized Token Minting</text>
    <text x="20" y="90" font-family="system-ui, sans-serif" font-size="11" fill="#cbd5e1">• Sovereign Liability (Tier-0)</text>
    <text x="20" y="110" font-family="system-ui, sans-serif" font-size="11" fill="#cbd5e1">• Wholesale Clearing (CBDC-W)</text>
    <text x="20" y="130" font-family="system-ui, sans-serif" font-size="11" fill="#cbd5e1">• Post-Quantum Cryptography</text>
  </g>

  <!-- Arrow 1 -->
  <path d="M 290 195 L 340 195" stroke="#f59e0b" stroke-width="3" stroke-dasharray="4,4"/>
  <polygon points="340,195 330,190 330,200" fill="#f59e0b"/>
  <text x="315" y="185" text-anchor="middle" font-family="system-ui, sans-serif" font-size="10" fill="#f59e0b">Issuance</text>

  <!-- Node 2: Intermediaries (Banks & Fintechs) -->
  <g transform="translate(340, 120)">
    <rect width="240" height="150" rx="12" fill="#1e293b" stroke="#38bdf8" stroke-width="2"/>
    <rect x="16" y="16" width="208" height="30" rx="6" fill="url(#blue)"/>
    <text x="120" y="36" text-anchor="middle" font-family="system-ui, sans-serif" font-weight="bold" font-size="13" fill="#090d16">
      COMMERCIAL BANKS / PSPs
    </text>
    <text x="20" y="70" font-family="system-ui, sans-serif" font-size="11" fill="#cbd5e1">• Digital Rupee Wallet Apps</text>
    <text x="20" y="90" font-family="system-ui, sans-serif" font-size="11" fill="#cbd5e1">• KYC / AML Compliance Rail</text>
    <text x="20" y="110" font-family="system-ui, sans-serif" font-size="11" fill="#cbd5e1">• Zero Intermediation Leakage</text>
    <text x="20" y="130" font-family="system-ui, sans-serif" font-size="11" fill="#cbd5e1">• Non-Interest Bearing Caps</text>
  </g>

  <!-- Arrow 2 -->
  <path d="M 580 195 L 630 195" stroke="#38bdf8" stroke-width="3" stroke-dasharray="4,4"/>
  <polygon points="630,195 620,190 620,200" fill="#38bdf8"/>
  <text x="605" y="185" text-anchor="middle" font-family="system-ui, sans-serif" font-size="10" fill="#38bdf8">Distribute</text>

  <!-- Node 3: End Users (Retail CBDC-R) -->
  <g transform="translate(630, 120)">
    <rect width="230" height="150" rx="12" fill="#1e293b" stroke="#34d399" stroke-width="2"/>
    <rect x="16" y="16" width="198" height="30" rx="6" fill="url(#emerald)"/>
    <text x="115" y="36" text-anchor="middle" font-family="system-ui, sans-serif" font-weight="bold" font-size="13" fill="#090d16">
      CITIZENS &amp; MERCHANTS (CBDC-R)
    </text>
    <text x="20" y="70" font-family="system-ui, sans-serif" font-size="11" fill="#cbd5e1">• Offline NFC Smartcards</text>
    <text x="20" y="90" font-family="system-ui, sans-serif" font-size="11" fill="#cbd5e1">• Programmable Subsidies (DBT)</text>
    <text x="20" y="110" font-family="system-ui, sans-serif" font-size="11" fill="#cbd5e1">• Interoperable with UPI QR</text>
    <text x="20" y="130" font-family="system-ui, sans-serif" font-size="11" fill="#cbd5e1">• Small-Value Anonymity Guard</text>
  </g>

  <!-- Bottom Panel: Cross-Border & Settlement Protocols -->
  <g transform="translate(50, 300)">
    <rect width="810" height="160" rx="12" fill="#0f172a" stroke="#334155" stroke-width="1.5"/>
    <text x="25" y="32" font-family="system-ui, sans-serif" font-weight="bold" font-size="14" fill="#f8fafc">
      CROSS-BORDER SETTLEMENT BRIDGE: BIS Project mBridge &amp; Project Nexus
    </text>
    
    <!-- Three Key Columns -->
    <rect x="25" y="50" width="240" height="90" rx="8" fill="#1e293b"/>
    <text x="40" y="74" font-family="system-ui, sans-serif" font-weight="bold" font-size="12" fill="#f59e0b">Instant Finality (T+0)</text>
    <text x="40" y="96" font-family="system-ui, sans-serif" font-size="10" fill="#94a3b8">Bypasses correspondent banking fees &amp; time latency across UAE &amp; ASEAN corridors.</text>

    <rect x="285" y="50" width="240" height="90" rx="8" fill="#1e293b"/>
    <text x="300" y="74" font-family="system-ui, sans-serif" font-weight="bold" font-size="12" fill="#38bdf8">De-Dollarization Hedge</text>
    <text x="300" y="96" font-family="system-ui, sans-serif" font-size="10" fill="#94a3b8">Sovereign settlement in local currencies reduces exposure to Western sanctions &amp; SWIFT chokepoints.</text>

    <rect x="545" y="50" width="265" height="90" rx="8" fill="#1e293b"/>
    <text x="560" y="74" font-family="system-ui, sans-serif" font-weight="bold" font-size="12" fill="#34d399">Prudential Cap Safeguard</text>
    <text x="560" y="96" font-family="system-ui, sans-serif" font-size="10" fill="#94a3b8">Non-interest bearing wallet limits protect commercial banks against systemic deposit runs during market stress.</text>
  </g>
</svg>
`;

const FINANCE_COMMISSION_SVG = `
<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 900 500" width="900" height="500">
  <defs>
    <linearGradient id="fc-bg" x1="0%" y1="0%" x2="100%" y2="100%">
      <stop offset="0%" stop-color="#0b1329"/>
      <stop offset="100%" stop-color="#141f38"/>
    </linearGradient>
  </defs>

  <rect width="900" height="500" rx="16" fill="url(#fc-bg)"/>
  <rect x="2" y="2" width="896" height="496" rx="14" fill="none" stroke="#1e293b" stroke-width="2"/>

  <!-- Header Banner -->
  <rect x="30" y="25" width="840" height="60" rx="8" fill="#1e293b" opacity="0.6"/>
  <text x="50" y="58" font-family="system-ui, sans-serif" font-weight="bold" font-size="19" fill="#f8fafc">
    16th FINANCE COMMISSION: Horizontal Tax Devolution Matrix (Article 280)
  </text>
  <text x="50" y="75" font-family="system-ui, sans-serif" font-size="12" fill="#94a3b8">
    Comparative weights, equity vs efficiency trade-offs &amp; shrinking divisible pool (Article 271)
  </text>

  <!-- Horizontal Bars / Breakdown -->
  <g transform="translate(50, 105)">
    <!-- 1: Income Distance (45%) -->
    <text x="0" y="20" font-family="system-ui, sans-serif" font-weight="bold" font-size="12" fill="#f8fafc">
      Income Distance (Equity Criteria) · 45.0%
    </text>
    <rect x="0" y="28" width="800" height="24" rx="6" fill="#1e293b"/>
    <rect x="0" y="28" width="360" height="24" rx="6" fill="#f59e0b"/>
    <text x="370" y="45" font-family="system-ui, sans-serif" font-size="11" fill="#cbd5e1">
      Distance of state's per-capita GSDP from benchmark state (Goa/Haryana)
    </text>

    <!-- 2: Population (15%) -->
    <text x="0" y="80" font-family="system-ui, sans-serif" font-weight="bold" font-size="12" fill="#f8fafc">
      Population 2011 Census (Need Criteria) · 15.0%
    </text>
    <rect x="0" y="88" width="800" height="24" rx="6" fill="#1e293b"/>
    <rect x="0" y="88" width="120" height="24" rx="6" fill="#38bdf8"/>
    <text x="130" y="105" font-family="system-ui, sans-serif" font-size="11" fill="#cbd5e1">
      Shift from 1971 to 2011 Census population basis (major contention with southern states)
    </text>

    <!-- 3: Area (15%) -->
    <text x="0" y="140" font-family="system-ui, sans-serif" font-weight="bold" font-size="12" fill="#f8fafc">
      Geographical Area (Administrative Cost) · 15.0%
    </text>
    <rect x="0" y="148" width="800" height="24" rx="6" fill="#1e293b"/>
    <rect x="0" y="148" width="120" height="24" rx="6" fill="#a855f7"/>
    <text x="130" y="165" font-family="system-ui, sans-serif" font-size="11" fill="#cbd5e1">
      Compensates larger states (e.g. Rajasthan, MP) for higher public service delivery cost
    </text>

    <!-- 4: Forest & Ecology (10%) -->
    <text x="0" y="200" font-family="system-ui, sans-serif" font-weight="bold" font-size="12" fill="#f8fafc">
      Forest &amp; Ecology (Green Fiscal Federalism) · 10.0%
    </text>
    <rect x="0" y="208" width="800" height="24" rx="6" fill="#1e293b"/>
    <rect x="0" y="208" width="80" height="24" rx="6" fill="#10b981"/>
    <text x="90" y="225" font-family="system-ui, sans-serif" font-size="11" fill="#cbd5e1">
      Opportunity cost of carbon sink conservation &amp; dense forest cover protection
    </text>

    <!-- 5: Demographic Performance (12.5%) -->
    <text x="0" y="260" font-family="system-ui, sans-serif" font-weight="bold" font-size="12" fill="#f8fafc">
      Demographic Performance (Fertility Stabilization) · 12.5%
    </text>
    <rect x="0" y="268" width="800" height="24" rx="6" fill="#1e293b"/>
    <rect x="0" y="268" width="100" height="24" rx="6" fill="#ec4899"/>
    <text x="110" y="285" font-family="system-ui, sans-serif" font-size="11" fill="#cbd5e1">
      Rewards states with Total Fertility Rate (TFR) below replacement level (2.1)
    </text>

    <!-- 6: Tax & Fiscal Effort (2.5%) -->
    <text x="0" y="320" font-family="system-ui, sans-serif" font-weight="bold" font-size="12" fill="#f8fafc">
      Tax &amp; Fiscal Effort (Fiscal Discipline) · 2.5%
    </text>
    <rect x="0" y="328" width="800" height="24" rx="6" fill="#1e293b"/>
    <rect x="0" y="328" width="20" height="24" rx="6" fill="#6366f1"/>
    <text x="30" y="345" font-family="system-ui, sans-serif" font-size="11" fill="#cbd5e1">
      Higher revenue mobilization relative to state GSDP potential
    </text>
  </g>

  <!-- Key Takeaway Footnote -->
  <g transform="translate(50, 460)">
    <rect width="800" height="30" rx="6" fill="#0f172a" stroke="#334155"/>
    <text x="15" y="20" font-family="system-ui, sans-serif" font-size="11" fill="#94a3b8">
      <tspan fill="#f59e0b" font-weight="bold">Core UPSC Tension:</tspan> Balancing Equity (Income Distance 45%) with Efficiency &amp; Demographic Rewards (12.5% + 2.5%).
    </text>
  </g>
</svg>
`;

export const SEED_INFOGRAPHICS: Record<string, InfographicItem[]> = {
  'topic-1': [
    {
      id: 'info-1-1',
      url: svgToDataUrl(CBDC_SVG),
      title: 'Digital Rupee (e₹) Two-Tier Architecture & Project mBridge Rails',
      caption: 'Detailed structural diagram illustrating sovereign token issuance, interbank wholesale clearing, and retail wallet distribution.',
      source: 'RBI Financial Stability Report & BIS Innovation Hub',
      uploadedAt: new Date().toISOString(),
    },
  ],
  'topic-2': [
    {
      id: 'info-2-1',
      url: svgToDataUrl(FINANCE_COMMISSION_SVG),
      title: '16th Finance Commission Horizontal Tax Devolution Formula',
      caption: 'Visual breakdown of the 6 devolution criteria balancing equity (income distance) and performance (fertility stabilization & tax effort).',
      source: 'Article 280, Constitutional Provisions & 15th FC Award',
      uploadedAt: new Date().toISOString(),
    },
  ],
};
