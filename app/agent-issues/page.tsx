export default function AgentIssuesPage() {
  return (
    <div className="h-screen">
      <iframe
        src="/agent-analytics.html"
        className="w-full h-full border-0"
        title="AI Agent Analytics — Issue & Capability Tracker"
      />
    </div>
  );
}
