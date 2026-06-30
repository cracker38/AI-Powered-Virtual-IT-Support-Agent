import { NextResponse } from "next/server";
import Groq from "groq-sdk";
import prisma from "@/lib/prisma";

const groq = new Groq({
  apiKey: process.env.GROQ_API_KEY || "dummy-key-for-now",
});

function detectLanguage(text: string): string {
  const frenchPatterns = /\b(bonjour|salut|merci|s'il|vous|je|vous|comment|problème|aide|besoin|oui|non|pourquoi|quoi|où|quand|mon|ma|mes|un|une|le|la|les|de|du|et|est|ou|à|en|par|pour|avec|sans|chez|dans|sous|sur|entre|vers|vers|pendant|depuis|avant|après|plus|moins|très|bien|mal|bon|mauvais|grand|petit|nouveau|ancien|même|tel|tel|quel|aucun|quelque|tout|autre|certain|divers|plusieurs|seul|simple|double|triple|commun|propre|vrai|faux|léger|lourd|clair|sombre|fort|faible|sec|mouillé|chaud|froid|nouveau|vieux|haut|bas|long|court|large|étroit|riche|pauvre|savant|ignorant|sage|fou|juste|injuste|beau|laid|doux|dur|mou|rigide|souple|flexible|raide|libre|captif|prisonnier|prisonnier|roi|reine|prince|princesse|duc|duchesse|comte|comtesse|marquis|marquise|baron|baronne|chevalier|dame|demoiselle|monsieur|madame|mademoiselle|frère|sœur|père|mère|fils|fille|oncle|tante|cousin|cousine|grand-père|grand-mère|petit-fils|petite-fille|mari|femme|époux|épouse|fiancé|fiancée|amant|amante|amis|amie)\b/gi;
  const frenchCount = (text.match(frenchPatterns) || []).length;

  const englishPatterns = /\b(hello|hi|thank|please|you|are|is|the|a|an|and|or|but|not|can|could|would|should|do|does|have|has|am|be|been|being|go|went|gone|get|got|getting|give|gave|given|make|made|making|take|took|taken|think|thought|thinking|know|knew|knowing|find|found|finding|come|came|coming|see|saw|seen|say|said|saying|tell|told|telling|ask|asked|asking|work|worked|working|call|called|calling|try|tried|trying|use|used|using|help|helped|helping|turn|turned|turning|start|started|starting|show|showed|showing|hear|heard|hearing|let|letting|mean|meant|meaning|set|setting|meet|meeting|run|ran|running|pay|paid|paying|sit|sat|sitting|stand|stood|standing|lose|lost|losing|cut|cutting|reach|reached|reaching|kill|killed|killing|remain|remained|remaining|suggest|suggested|suggesting|raise|raised|raising|buy|bought|buying|throw|threw|throwing|catch|caught|catching|deal|dealt|dealing|perform|performed|performing|begin|began|beginning|seem|seemed|seeming|understand|understood|understanding|watch|watched|watching|follow|followed|following|stop|stopped|stopping|create|created|creating|speak|spoke|speaking|read|reading|allow|allowed|allowing|add|added|adding|spend|spent|spending|grow|grew|growing|open|opened|opening|walk|walked|walking|win|won|winning|offer|offered|offering|remember|remembered|remembering|appear|appeared|appearing|buy|bought|buying|wait|waited|waiting|serve|served|serving|die|died|dying|send|sent|sending|expect|expected|expecting|build|built|building|stay|stayed|staying|fall|fell|falling|cut|cutting|reach|reached|reaching|kill|killed|killing|last|lasted|lasting|should|shouldn't|couldn't|wouldn't|wasn't|weren't|haven't|hasn't|hadn't|isn't|aren't|am|i|we|he|she|it|they|me|him|her|us|them|my|your|his|her|its|our|their|mine|yours|hers|ours|theirs|this|that|these|those|what|which|who|whom|whose|why|where|when|how)\b/gi;
  const englishCount = (text.match(englishPatterns) || []).length;

  const kinyarwandaPatterns = /\b(muraho|salamu|asante|mwaramutse|ese|iki|nde|kuki|nihe|ahe|ryari|mwami|wanjye|wacu|ubwire|ubwoko|aho|ico|izo|ubwoko|umuntu|abantu|inzira|igiti|amazi|umuceri|icyo|aba|umu|igi|ama|ibi|ivi|aka)\b/gi;
  const kinyarwandaCount = (text.match(kinyarwandaPatterns) || []).length;

  if (frenchCount > englishCount && frenchCount > kinyarwandaCount) {
    return "fr";
  } else if (kinyarwandaCount > englishCount && kinyarwandaCount > frenchCount) {
    return "rw";
  }

  return "en";
}

const getSystemPrompt = (detectedLanguage: string) => {
  const basePrompt = `You are AVISA, an intelligent Virtual IT Support Agent for CYPADI Ltd.
Your job is to assist users with password resets, software troubleshooting, connectivity issues, and general IT inquiries.
- Be polite, professional, and concise.
- Use a helpful, technical but accessible tone.
- If an issue is extremely complex or requires physical intervention, advise that you will escalate it to a human IT technician.
- Stay strictly within the scope of the AI Powered Virtual IT Support Agent and technical support topics.
- If the user asks something unrelated to IT support, AVISA, company systems, troubleshooting, accounts, devices, software, connectivity, tickets, knowledge base, or cybersecurity, do not answer the unrelated question directly.
- For unrelated questions, briefly explain that you are the AI Powered Virtual IT Support Agent and that you handle technical issues, then invite the user to ask a technical support question instead.
- Always output a valid JSON object matching this schema. Do not output any prose outside of the JSON object.
Schema:
{
  "reply": "Your response text to the user in the language specified below",
  "sentiment": "POSITIVE" | "NEUTRAL" | "NEGATIVE",
  "intent": "PASSWORD_RESET" | "VPN_ISSUE" | "SOFTWARE_CRASH" | "SECURITY" | "GENERAL",
  "confidence": 0.0 to 1.0 (number indicating confidence in understanding/helping the user),
  "suggestedQuestions": ["Suggested follow-up question 1", "Suggested follow-up question 2"]
}`;

  const languageInstructions = {
    fr: `- RÔLE: Vous êtes un expert en support informatique français natif. Votre ton est professionnel, courtois et fluide.
- IMPORTANT: Ne traduisez JAMAIS littéralement de l'anglais. Pensez et répondez directement en français idiomatique.
- STYLE:
  * Utilisez le "Vouvoiement" pour marquer le respect.
  * Évitez les structures de phrases passives typiques de l'anglais.
  * Utilisez des transitions naturelles: "Tout d'abord", "Ensuite", "Je vous suggère de", "Il se peut que".
  * Ne dites pas "S'il vous plaît" à la fin de chaque phrase (très anglais) ; utilisez plutôt "Je vous prie de bien vouloir..." ou "Pourriez-vous...".
- TERMINOLOGIE AUTHENTIQUE:
  * "Identifiants" ou "Coordonnées de connexion" (Credentials)
  * "Dysfonctionnement" ou "Panne" (Issue/Problem)
  * "Valider" ou "Confirmer" (Submit/Confirm)
  * "Bureau à distance" (Remote desktop)
  * "Barre des tâches" (Taskbar)
- EXEMPLE DE TON: "Bonjour, j'ai bien pris note de votre problème. Je vais vous accompagner pour résoudre cela étape par étape."`,
    rw: `- IMPORTANT: The user is writing in KINYARWANDA. You MUST respond entirely in Kinyarwanda. Never mix languages in your response.`,
    en: `- IMPORTANT: The user is writing in ENGLISH. You MUST respond entirely in English. Never mix languages in your response.
- Answer in the same language the user uses.
- Use clear, professional IT terminology and support best practices.
- Respond with a helpful and accessible tone.`,
  };

  const corporateNote = `- **IMPORTANT**: If the context provided below contains relevant troubleshooting steps, prioritize using those specific corporate procedures over general AI knowledge.`;

  return basePrompt + "\n" + languageInstructions[detectedLanguage as keyof typeof languageInstructions] + "\n" + corporateNote;
};

function isSupportScopedQuestion(message: string): boolean {
  const scopedPatterns = [
    /\bavisa\b/i,
    /\bai powered virtual it support agent\b/i,
    /\bit support\b/i,
    /\btechnical issue(s)?\b/i,
    /\btroubleshoot(ing)?\b/i,
    /\bpassword(s)?\b/i,
    /\breset\b/i,
    /\blog[ -]?in\b/i,
    /\bsign[ -]?in\b/i,
    /\baccount\b/i,
    /\baccess\b/i,
    /\bvpn\b/i,
    /\bnetwork\b/i,
    /\bconnect(ion|ivity)?\b/i,
    /\binternet\b/i,
    /\bwi-?fi\b/i,
    /\bemail\b/i,
    /\bsoftware\b/i,
    /\bapplication\b/i,
    /\bapp\b/i,
    /\bsystem\b/i,
    /\bcomputer\b/i,
    /\blaptop\b/i,
    /\bprinter\b/i,
    /\bdevice\b/i,
    /\bbug\b/i,
    /\berror\b/i,
    /\bcrash\b/i,
    /\bfail(ed|ure)?\b/i,
    /\bsecurity\b/i,
    /\bvirus\b/i,
    /\bmalware\b/i,
    /\btechnician\b/i,
    /\bticket\b/i,
    /\bknowledge base\b/i,
    /\bhelp desk\b/i,
    /\bsupport\b/i,
  ];

  return scopedPatterns.some((pattern) => pattern.test(message));
}

function buildOutOfScopeReply(language: string): string {
  if (language === "fr") {
    return "Je suis AVISA, l'agent virtuel de support informatique. Je traite les problemes techniques, le depannage, les comptes, les logiciels, la connectivite et les questions IT. Veuillez me poser une question liee au support informatique.";
  }

  if (language === "rw") {
    return "Ndi AVISA, umukozi w'ikoranabuhanga wunganira abakoresha. Nkora ku bibazo bya tekiniki, gukemura ibibazo, konti, porogaramu, imiyoboro n'ibindi bibazo bya IT. Mbaza ikibazo gifitanye isano na tekiniki.";
  }

  return "I am AVISA, the AI Powered Virtual IT Support Agent. I deal with technical issues, troubleshooting, accounts, software, connectivity, and other IT support questions. Please ask me a technical support question.";
}

const DEFAULT_GREETING = {
  id: "welcome",
  role: "bot",
  content: "Bonjour ! Je suis AVISA, votre agent virtuel de support informatique. Comment puis-je vous aider aujourd'hui ? / Hello! I am AVISA, your Virtual IT Support Agent. How can I assist you today?",
};

function resolveUserId(req: Request, bodyUserId?: string) {
  const url = new URL(req.url);
  const queryId = url.searchParams.get("userId");
  return bodyUserId || queryId || "anonymous";
}

function buildDiagnosticFlow(intent: string) {
  const normalized = intent ? intent.toUpperCase() : "GENERAL";

  switch (normalized) {
    case "PASSWORD_RESET":
      return {
        step: 1,
        options: [
          "Reset my password now",
          "I am locked out of my account",
          "My password still doesn't work",
        ],
      };
    case "VPN_ISSUE":
      return {
        step: 1,
        options: [
          "Check VPN gateway status",
          "Try reconnecting to the network",
          "Verify my VPN credentials",
        ],
      };
    case "SOFTWARE_CRASH":
      return {
        step: 1,
        options: [
          "Restart the application",
          "Update the software",
          "Collect the crash details",
        ],
      };
    default:
      return {
        step: 1,
        options: [
          "Show me relevant help articles",
          "Escalate to a technician",
          "Try a different troubleshooting path",
        ],
      };
  }
}

export async function GET(req: Request) {
  try {
    const userId = resolveUserId(req);
    const messages = await prisma.chatMessage.findMany({
      where: { userId },
      orderBy: { createdAt: "asc" },
    });

    if (messages.length === 0) {
      return NextResponse.json([DEFAULT_GREETING]);
    }

    return NextResponse.json(
      messages.map((message) => ({
        id: message.id,
        role: message.role as "user" | "bot",
        content: message.content,
        sentiment: message.sentiment,
        intent: message.detectedIntent,
        confidence: message.confidence,
      }))
    );
  } catch (error) {
    console.error("Chat API Error:", error);
    return NextResponse.json({ error: "Failed to load chat history" }, { status: 500 });
  }
}

export async function POST(req: Request) {
  try {
    let body: any;
    try {
      body = await req.json();
    } catch (jsonError) {
      const text = await req.text();
      console.error("Chat API invalid JSON body:", text, jsonError);
      return NextResponse.json({ error: "Invalid JSON request body." }, { status: 400 });
    }

    const { message, history, userId: bodyUserId } = body;
    const userId = resolveUserId(req, bodyUserId);
    const detectedLanguage = detectLanguage(message);
    const isScopedQuestion = isSupportScopedQuestion(message);

    const keywords = message
      .split(/\s+/)
      .filter((w: string) => w.length > 3)
      .map((word: string) => word.replace(/[^A-Za-z0-9'-]/g, ""));

    let relevantArticles: any[] = [];
    if (keywords.length > 0) {
      relevantArticles = await prisma.knowledgeArticle.findMany({
        where: {
          OR: [
            ...keywords.map((word: string) => ({ title: { contains: word } })),
            ...keywords.map((word: string) => ({ content: { contains: word } })),
          ],
        },
        take: 3,
      });
    }

    const contextText = relevantArticles.length > 0
      ? "\n\nVERIFIED CORPORATE KNOWLEDGE:\n" + relevantArticles.map((a: any) => `[Title: ${a.title}]\n${a.content}`).join("\n\n")
      : "";

    const systemPrompt = getSystemPrompt(detectedLanguage);
    const botMessages = [
      { role: "system", content: systemPrompt + contextText },
      ...(history || []).map((msg: any) => ({
        role: msg.role === "bot" ? "assistant" : "user",
        content: msg.content,
      })),
      { role: "user", content: message },
    ];

    let parsedResponse = {
      reply: "",
      sentiment: "NEUTRAL",
      intent: "GENERAL",
      confidence: 0.8,
      suggestedQuestions: [] as string[],
    };

    const frustrationMatch = /\b(annoyed|angry|crap|broken|worst|sucks|fail|error|crashes|locked|urgent|help|frustrated|stuck)\b/i.test(message);
    const isDemoMode = !process.env.GROQ_API_KEY;

    if (!isScopedQuestion) {
      parsedResponse.reply = buildOutOfScopeReply(detectedLanguage);
      parsedResponse.sentiment = "NEUTRAL";
      parsedResponse.intent = "GENERAL";
      parsedResponse.confidence = 0.98;
      parsedResponse.suggestedQuestions = detectedLanguage === "fr"
        ? [
            "Comment reinitialiser mon mot de passe ?",
            "Pourquoi mon application ne fonctionne pas ?",
            "Comment ouvrir un ticket de support ?",
          ]
        : detectedLanguage === "rw"
          ? [
              "Nabasha nte gusubizaho ijambo banga?",
              "Ni gute nakemura ikibazo cya porogaramu?",
              "Nafungura nte tike ya support?",
            ]
          : [
              "How do I reset my password?",
              "Why is my application not working?",
              "How do I open a support ticket?",
            ];
    } else if (isDemoMode) {
      await new Promise((res) => setTimeout(res, 1200));
      const demoReplyText = detectedLanguage === "fr"
        ? `Je suis actuellement en 'Mode Démo'. J'ai analysé votre demande : '${message}'. ${contextText ? "Des guides internes pertinents ont été trouvés." : "Aucun guide interne spécifique n'a été trouvé pour cela."}`
        : detectedLanguage === "rw"
          ? `Muri 'Demo Mode' ubu. Nasanze ikibazo cyanyu: '${message}'. ${contextText ? "Nabonye inyandiko zifatika muri sisitemu yacu." : "Sinabonye inyandiko zihariye kuri iki kibazo."}`
          : `I am currently in Demo Mode. I reviewed your request: '${message}'. ${contextText ? "I found relevant internal guidance." : "I did not find a specific internal guide for this."}`;

      parsedResponse.reply = demoReplyText;
      parsedResponse.sentiment = frustrationMatch ? "NEGATIVE" : "NEUTRAL";
      if (/password|login|account|reset/i.test(message)) parsedResponse.intent = "PASSWORD_RESET";
      else if (/vpn|network|connectivity|internet/i.test(message)) parsedResponse.intent = "VPN_ISSUE";
      else if (/crash|error|failed|bug|freeze/i.test(message)) parsedResponse.intent = "SOFTWARE_CRASH";
      else if (/security|locked|account|unauthorized/i.test(message)) parsedResponse.intent = "SECURITY";
      parsedResponse.confidence = 0.92;
      parsedResponse.suggestedQuestions = parsedResponse.intent === "PASSWORD_RESET"
        ? ["How do I reset my password?", "What if my account is locked?", "Can I use self-service recovery?"]
        : parsedResponse.intent === "VPN_ISSUE"
          ? ["How do I configure GlobalProtect?", "What is the VPN gateway address?", "How can I reconnect to VPN?"]
          : ["I need password reset help", "I can't connect to VPN", "Software keeps crashing"];
    } else {
      const chatCompletion = await groq.chat.completions.create({
        messages: botMessages as any,
        model: "llama-3.3-70b-versatile",
        temperature: 0.5,
        max_tokens: 1024,
        response_format: { type: "json_object" },
      });

      const rawReply = chatCompletion.choices?.[0]?.message?.content || "";
      let cleaned = rawReply.trim();
      if (cleaned.startsWith("```")) {
        cleaned = cleaned.replace(/^```json\s*/i, "").replace(/```$/, "").trim();
      }

      try {
        const parsed = JSON.parse(cleaned);
        parsedResponse.reply = parsed.reply || rawReply;
        parsedResponse.sentiment = (parsed.sentiment || "NEUTRAL").toUpperCase();
        parsedResponse.intent = (parsed.intent || "GENERAL").toUpperCase();
        parsedResponse.confidence = typeof parsed.confidence === "number" ? parsed.confidence : 0.8;
        parsedResponse.suggestedQuestions = Array.isArray(parsed.suggestedQuestions) ? parsed.suggestedQuestions : [];
      } catch (error) {
        console.warn("Failed to parse JSON response, falling back:", error);
        parsedResponse.reply = rawReply || "I could not parse the assistant response.";
      }
    }

    const diagnosticFlow = buildDiagnosticFlow(parsedResponse.intent);

    await prisma.chatMessage.createMany({
      data: [
        {
          userId,
          role: "user",
          content: message,
          sentiment: parsedResponse.sentiment,
          detectedIntent: parsedResponse.intent,
        },
        {
          userId,
          role: "bot",
          content: parsedResponse.reply,
          sentiment: parsedResponse.sentiment,
          detectedIntent: parsedResponse.intent,
          confidence: parsedResponse.confidence,
        },
      ],
    });

    return NextResponse.json({
      reply: parsedResponse.reply,
      shouldEscalate: frustrationMatch || parsedResponse.sentiment === "NEGATIVE",
      language: detectedLanguage,
      sentiment: parsedResponse.sentiment,
      intent: parsedResponse.intent,
      confidence: parsedResponse.confidence,
      suggestedQuestions: parsedResponse.suggestedQuestions,
      diagnosticFlow,
    });
  } catch (error) {
    console.error("Chat API Error:", error);
    return NextResponse.json(
      { error: "Failed to process the request." },
      { status: 500 }
    );
  }
}
