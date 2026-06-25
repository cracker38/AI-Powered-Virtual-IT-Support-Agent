"use client";

import { useState, useEffect } from "react";

export default function IntegrationHub() {
  const [integrations, setIntegrations] = useState<any[]>([]);

  useEffect(() => {
    // In a real app we would fetch from /api/admin/integrations
    // For now we render the mock representation of the new DB models
    setIntegrations([
      { id: '1', serviceName: 'JIRA', isActive: true, webhookUrl: 'https://avisa.cypadi.com/api/webhooks/jira' },
      { id: '2', serviceName: 'SERVICENOW', isActive: false, webhookUrl: null },
      { id: '3', serviceName: 'LDAP', isActive: true, webhookUrl: null },
    ]);
  }, []);

  return (
    <div>
      <h1 style={{ fontSize: "2rem", marginBottom: "2rem" }}>Integration Webhook Hub</h1>
      <p style={{ color: "rgba(255,255,255,0.7)", marginBottom: "2rem" }}>Connect the AVISA support platform directly to your corporate services.</p>

      <div style={{ display: "grid", gap: "1rem" }}>
        
        {integrations.map((integration) => (
          <div key={integration.id} style={{ background: "rgba(255, 255, 255, 0.05)", padding: "1.5rem", borderRadius: "8px", border: "1px solid rgba(255,255,255,0.1)", display: "flex", justifyContent: "space-between", alignItems: "center" }}>
            <div>
              <h3 style={{ marginBottom: "0.25rem", textTransform: 'capitalize' }}>{integration.serviceName.toLowerCase()} Sync</h3>
              {integration.webhookUrl && <p style={{ color: "rgba(255,255,255,0.6)", fontSize: "0.85rem", marginTop: "0.25rem" }}>Webhook: {integration.webhookUrl}</p>}
            </div>
            <button style={{ 
              background: integration.isActive ? "rgba(16,185,129,0.2)" : "rgba(255,255,255,0.1)", 
              color: integration.isActive ? "#10b981" : "white", 
              border: `1px solid ${integration.isActive ? 'rgba(16,185,129,0.5)' : 'rgba(255,255,255,0.2)'}`, 
              padding: "0.5rem 1rem", borderRadius: "4px", cursor: "pointer" 
            }}>
              {integration.isActive ? "Connected" : "Configure"}
            </button>
          </div>
        ))}

        <div style={{ background: "rgba(255, 255, 255, 0.05)", padding: "1.5rem", borderRadius: "8px", border: "1px solid rgba(255,255,255,0.1)", display: "flex", justifyContent: "space-between", alignItems: "center" }}>
          <div>
            <h3 style={{ marginBottom: "0.25rem" }}>Groq AI Endpoint</h3>
            <p style={{ color: "rgba(255,255,255,0.6)", fontSize: "0.9rem" }}>NLP Processing Engine using LLaMA3.</p>
          </div>
          <button style={{ background: "rgba(16,185,129,0.2)", color: "#10b981", border: "1px solid rgba(16,185,129,0.5)", padding: "0.5rem 1rem", borderRadius: "4px", cursor: "pointer" }}>Active</button>
        </div>

      </div>
    </div>
  );
}
