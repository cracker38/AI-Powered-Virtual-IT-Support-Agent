import prisma from "@/lib/prisma";

// We use a Server Component here since it's just a data display page
export const dynamic = 'force-dynamic';

export default async function AccessLogsPage() {
  const logs = await prisma.accessLog.findMany({
    orderBy: { createdAt: "desc" },
    include: {
      user: {
        select: { name: true, email: true, role: true }
      }
    },
    take: 100 // Limit to recent 100 logs for performance
  });

  return (
    <div>
      <h1 style={{ fontSize: "2rem", marginBottom: "1rem" }}>System Access Logs</h1>
      <p style={{ color: "rgba(255,255,255,0.7)", marginBottom: "2rem" }}>
        Monitor recent logins and user activity across the system.
      </p>

      <div style={{ background: "rgba(255, 255, 255, 0.05)", borderRadius: "12px", border: "1px solid rgba(255,255,255,0.1)", overflow: "hidden" }}>
        <table style={{ width: "100%", borderCollapse: "collapse", textAlign: "left" }}>
          <thead>
            <tr style={{ background: "rgba(0,0,0,0.4)" }}>
              <th style={{ padding: "1rem", borderBottom: "1px solid rgba(255,255,255,0.1)" }}>Timestamp</th>
              <th style={{ padding: "1rem", borderBottom: "1px solid rgba(255,255,255,0.1)" }}>User</th>
              <th style={{ padding: "1rem", borderBottom: "1px solid rgba(255,255,255,0.1)" }}>Action</th>
              <th style={{ padding: "1rem", borderBottom: "1px solid rgba(255,255,255,0.1)" }}>IP Address</th>
              <th style={{ padding: "1rem", borderBottom: "1px solid rgba(255,255,255,0.1)" }}>User Agent</th>
            </tr>
          </thead>
          <tbody>
            {logs.length === 0 ? (
              <tr>
                <td colSpan={5} style={{ padding: "2rem", textAlign: "center", color: "rgba(255,255,255,0.5)" }}>
                  No access logs found.
                </td>
              </tr>
            ) : (
              logs.map((log) => (
                <tr key={log.id} style={{ borderBottom: "1px solid rgba(255,255,255,0.05)" }}>
                  <td style={{ padding: "1rem", color: "rgba(255,255,255,0.8)" }}>
                    {new Date(log.createdAt).toLocaleString()}
                  </td>
                  <td style={{ padding: "1rem" }}>
                    <div>{log.user?.name || "Unknown User"}</div>
                    <div style={{ fontSize: "0.85rem", color: "rgba(255,255,255,0.5)" }}>{log.user?.email} • {log.user?.role}</div>
                  </td>
                  <td style={{ padding: "1rem" }}>
                    <span style={{ 
                      background: log.action === "LOGIN" ? "rgba(16, 185, 129, 0.2)" : "rgba(245, 158, 11, 0.2)",
                      color: log.action === "LOGIN" ? "#10b981" : "#f59e0b",
                      padding: "0.25rem 0.5rem",
                      borderRadius: "4px",
                      fontSize: "0.85rem",
                      fontWeight: "bold"
                    }}>
                      {log.action}
                    </span>
                  </td>
                  <td style={{ padding: "1rem", fontFamily: "monospace", color: "rgba(255,255,255,0.8)" }}>
                    {log.ipAddress || "Unknown"}
                  </td>
                  <td style={{ padding: "1rem", fontSize: "0.85rem", color: "rgba(255,255,255,0.6)", maxWidth: "300px", whiteSpace: "nowrap", overflow: "hidden", textOverflow: "ellipsis" }} title={log.userAgent || ""}>
                    {log.userAgent || "Unknown"}
                  </td>
                </tr>
              ))
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
}
