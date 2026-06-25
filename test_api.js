const userId = "anonymous";
const chatHistory = [
  { role: "user", content: "Hello" },
  { role: "bot", content: "Hi" }
];

async function testCreate() {
  console.log("Testing ticket creation...");
  try {
    const response = await fetch("http://localhost:3000/api/escalation/create", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        userId,
        title: "Test Ticket",
        description: "Test Description",
        summary: "Test Summary",
        priority: "LOW",
        chatHistory: JSON.stringify(chatHistory)
      })
    });
    
    const data = await response.json();
    console.log("Response Status:", response.status);
    console.log("Response Data:", data);
  } catch (err) {
    console.error("Fetch failed:", err);
  }
}

testCreate();
