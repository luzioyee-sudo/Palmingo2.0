import { Router, type IRouter } from "express";
import { GoogleGenerativeAI } from "@google/generative-ai";

const router: IRouter = Router();

function getAI() {
  const key = process.env.GEMINI_API_KEY;
  if (!key) throw new Error("GEMINI_API_KEY is not configured");
  return new GoogleGenerativeAI(key);
}

async function chat(messages: { role: string; content: string }[]) {
  const ai = getAI();
  const model = ai.getGenerativeModel({ model: "gemini-2.5-flash" });

  const system = messages.find((m) => m.role === "system")?.content ?? "";
  const history = messages
    .filter((m) => m.role !== "system")
    .slice(0, -1)
    .map((m) => ({
      role: m.role === "assistant" ? "model" : "user",
      parts: [{ text: m.content }],
    }));
  const lastMsg = messages.filter((m) => m.role !== "system").at(-1)?.content ?? "";

  const chatSession = model.startChat({
    history,
    systemInstruction: system ? { role: "system", parts: [{ text: system }] } : undefined,
  });

  const result = await chatSession.sendMessage(lastMsg);
  return result.response.text();
}

/* ── Dictionary — returns structured JSON ─────────────── */
router.post("/ai/dictionary", async (req, res): Promise<void> => {
  const { word, nativeLang, targetLang, level } = req.body as {
    word?: string;
    nativeLang?: string;
    targetLang?: string;
    level?: string;
  };
  if (!word || word.length > 80) {
    res.status(400).json({ error: "Invalid word" });
    return;
  }
  const native = nativeLang || "Arabic";
  const target = targetLang || "English";
  const userLevel = level || "B1";

  try {
    const raw = await chat([
      {
        role: "system",
        content: `You are a bilingual dictionary and language coach. The learner's native language is ${native} and they are learning ${target} at CEFR level ${userLevel}.

Return ONLY a valid JSON object (no markdown fences, no extra text) with this exact shape:
{
  "ipa": "phonetic pronunciation string",
  "translation": "short translation in ${native} (2-5 words)",
  "meaning": "clear explanation in ${native} (1-2 sentences, max 40 words)",
  "sentences": [
    {"level":"A2","en":"simple example in ${target}","native":"translation in ${native}"},
    {"level":"B1","en":"intermediate example in ${target}","native":"translation in ${native}"},
    {"level":"B2","en":"advanced example in ${target}","native":"translation in ${native}"}
  ],
  "relatedWords": ["word1","word2","word3"]
}

Rules:
- sentences must be real, natural examples not just definitions
- relatedWords are synonyms or thematically connected words (not translations)
- meaning must be in ${native}
- return ONLY the JSON object, nothing else`,
      },
      { role: "user", content: `Word: ${word}` },
    ]);

    try {
      const clean = raw.replace(/```json|```/g, "").trim();
      const data = JSON.parse(clean) as {
        ipa: string; translation: string; meaning: string;
        sentences: { level: string; en: string; native: string }[];
        relatedWords: string[];
      };
      res.json({ word, ...data });
    } catch {
      res.json({
        word,
        ipa: "",
        translation: "",
        meaning: raw,
        sentences: [],
        relatedWords: [],
      });
    }
  } catch (err) {
    req.log.error({ err }, "Dictionary error");
    res.status(500).json({ error: err instanceof Error ? err.message : "AI error" });
  }
});

router.post("/ai/translate", async (req, res): Promise<void> => {
  const { word, context, targetLang } = req.body as {
    word?: string;
    context?: string;
    targetLang?: string;
  };
  if (!word || word.length > 80) {
    res.status(400).json({ error: "Invalid word" });
    return;
  }
  const target = targetLang || "Arabic";
  try {
    const text = await chat([
      {
        role: "system",
        content: `You translate one word/phrase. Respond ONLY with JSON: {"translation":"...","ipa":"...","meaning":"short English meaning","example":"one short example sentence"}. Translate to ${target}.`,
      },
      {
        role: "user",
        content: `Word: "${word}"${context ? `\nContext: "${context}"` : ""}`,
      },
    ]);
    try {
      const clean = text.replace(/```json|```/g, "").trim();
      res.json(JSON.parse(clean));
    } catch {
      res.json({ translation: text, ipa: "", meaning: "", example: "" });
    }
  } catch (err) {
    req.log.error({ err }, "Translate error");
    res.status(500).json({ error: err instanceof Error ? err.message : "AI error" });
  }
});

router.post("/ai/tutor", async (req, res): Promise<void> => {
  const { messages, level, targetLang, nativeLang, scenario, profile } = req.body as {
    messages?: { role: "user" | "assistant"; content: string }[];
    level?: string;
    targetLang?: string;
    nativeLang?: string;
    scenario?: string;
    profile?: { xp: number; streak: number; wordsLearned: number; cardsReviewed: number };
  };
  if (!Array.isArray(messages)) {
    res.status(400).json({ error: "Invalid messages" });
    return;
  }
  const lvl = level || "B1";
  const target = targetLang || "English";
  const native = nativeLang || "Arabic";
  const scen = scenario || "free conversation";

  const profileBlock = profile
    ? `LEARNER PROGRESS:\n- XP: ${profile.xp}\n- Streak: ${profile.streak} days\n- Words learned: ${profile.wordsLearned}\n- Cards reviewed: ${profile.cardsReviewed}\nUse this to personalise difficulty and to give encouragement when streak is hot.`
    : "";

  const system = `You are Laxa, a warm and natural AI conversation partner powered by Gemini.

LEARNER PROFILE:
- Native language: ${native}
- Practising: ${target}
- CEFR level: ${lvl}
- Scenario: ${scen}
${profileBlock}

HOW TO TALK:
- Have a completely natural conversation in ${target} — talk like a real person, not a teacher.
- Keep replies SHORT: 2-3 sentences. Feel like a real chat message, not a lesson.
- Match vocabulary to CEFR level ${lvl}: simple and slow for A1/A2, richer for B1+.
- Always end with ONE natural follow-up question to keep the conversation going.
- Be warm, curious, encouraging. Never robotic or templated.

CORRECTIONS (only when the learner makes a clear mistake):
- Weave the correction naturally into your reply, e.g. "By the way, we say '...' not '...'" then keep talking.
- Never over-correct small mistakes — focus on the most important one only.
- If the learner writes perfectly, just respond naturally without mentioning it.

VOCABULARY HINTS:
- Only add a ${native} translation for a word if it might genuinely confuse the learner — in parentheses at the end of the sentence, e.g. (يعني: ...).
- Don't add hints for every message, only when truly needed.

FORMAT:
- Plain conversational text only. No rigid section headers like "Reply:", "Correction:", "Hint:", "Your turn:".
- You may use **bold** for a corrected word or a key vocabulary word, nothing else.
- Keep total reply under 80 words.`;

  try {
    const text = await chat([{ role: "system", content: system }, ...messages]);
    res.json({ text });
  } catch (err) {
    req.log.error({ err }, "Tutor error");
    const isQuota = err instanceof Error && (err.message.includes("429") || err.message.includes("quota"));
    if (isQuota) {
      res.status(429).json({ error: "AI quota reached — please retry in a minute." });
    } else {
      res.status(500).json({ error: err instanceof Error ? err.message : "AI error" });
    }
  }
});

router.post("/ai/transcript", async (req, res): Promise<void> => {
  const { title, topic } = req.body as { title?: string; topic?: string };
  if (!title) {
    res.status(400).json({ error: "Invalid title" });
    return;
  }
  try {
    const text = await chat([
      {
        role: "system",
        content: `Generate a short realistic transcript (8-14 sentences) for a language-learning video. Return ONLY plain text, one sentence per line, no numbering, no speaker labels, no Markdown.`,
      },
      { role: "user", content: `Video title: ${title}${topic ? `\nTopic: ${topic}` : ""}` },
    ]);
    res.json({ transcript: text });
  } catch (err) {
    req.log.error({ err }, "Transcript error");
    res.status(500).json({ error: err instanceof Error ? err.message : "AI error" });
  }
});

router.post("/ai/search-youtube", async (req, res): Promise<void> => {
  const { q } = req.body as { q?: string };
  if (!q || q.length > 120) {
    res.status(400).json({ error: "Invalid query" });
    return;
  }
  try {
    const url = `https://www.youtube.com/results?search_query=${encodeURIComponent(q)}&sp=EgIQAQ%253D%253D`;
    const ytRes = await fetch(url, {
      headers: {
        "User-Agent":
          "Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120 Safari/537.36",
        "Accept-Language": "en-US,en;q=0.9",
      },
    });
    if (!ytRes.ok) { res.json({ results: [] }); return; }
    const html = await ytRes.text();
    const match = html.match(/var ytInitialData = (\{[\s\S]*?\});<\/script>/);
    if (!match) { res.json({ results: [] }); return; }
    let parsed: unknown;
    try { parsed = JSON.parse(match[1]); } catch { res.json({ results: [] }); return; }
    const items: { id: string; title: string; channel: string }[] = [];
    const sections =
      (parsed as any)?.contents?.twoColumnSearchResultsRenderer?.primaryContents
        ?.sectionListRenderer?.contents ?? [];
    for (const s of sections) {
      const list = s?.itemSectionRenderer?.contents ?? [];
      for (const it of list) {
        const v = it?.videoRenderer;
        if (!v?.videoId) continue;
        items.push({ id: v.videoId, title: v.title?.runs?.[0]?.text ?? "", channel: v.ownerText?.runs?.[0]?.text ?? "" });
        if (items.length >= 12) break;
      }
      if (items.length >= 12) break;
    }
    res.json({ results: items });
  } catch (err) {
    req.log.error({ err }, "YouTube search error");
    res.status(500).json({ error: "Search failed" });
  }
});

router.post("/ai/grammar", async (req, res): Promise<void> => {
  const { word, sentence } = req.body as { word?: string; sentence?: string };
  if (!word || word.length > 120) { res.status(400).json({ error: "Invalid word" }); return; }
  try {
    const text = await chat([
      {
        role: "system",
        content: "You are a concise grammar coach. Explain the grammatical role of the given word in the sentence. Include: part of speech, tense/form if a verb, and why this word works here. Max 55 words. Plain prose, no Markdown, no bullet points.",
      },
      { role: "user", content: `Word: "${word}"\nSentence: "${sentence || word}"` },
    ]);
    res.json({ text });
  } catch (err) {
    req.log.error({ err }, "Grammar error");
    res.status(500).json({ error: err instanceof Error ? err.message : "AI error" });
  }
});

router.post("/ai/youtube-captions", async (req, res): Promise<void> => {
  const { videoId } = req.body as { videoId?: string };
  if (!videoId || !/^[\w-]{11}$/.test(videoId)) { res.status(400).json({ error: "Invalid video ID" }); return; }
  type CaptionEvent = { tStartMs: number; dDurationMs: number; segs?: { utf8: string }[] };
  type TimedText = { events?: CaptionEvent[] };
  const tryFetch = async (lang: string) => {
    const url = `https://www.youtube.com/api/timedtext?v=${videoId}&lang=${lang}&fmt=json3`;
    const r = await fetch(url, { headers: { "User-Agent": "Mozilla/5.0 AppleWebKit/537.36" } });
    if (!r.ok) return null;
    return (await r.json()) as TimedText;
  };
  try {
    for (const lang of ["en", "en-US", "a.en"]) {
      const data = await tryFetch(lang);
      if (!data?.events?.length) continue;
      const captions = data.events
        .filter((e) => e.segs?.some((s) => s.utf8?.trim()))
        .map((e) => ({
          startMs: e.tStartMs, endMs: e.tStartMs + (e.dDurationMs ?? 2000),
          text: (e.segs ?? []).map((s) => s.utf8).join("").replace(/\n/g, " ").trim(),
        }))
        .filter((c) => c.text);
      if (captions.length > 0) { res.json({ captions, source: "youtube" }); return; }
    }
    res.json({ captions: [], source: "none" });
  } catch (err) {
    req.log.error({ err }, "YouTube captions error");
    res.json({ captions: [], source: "none" });
  }
});

/* ── TTS — Gemini native voice (female: Aoede) ─────────── */
function pcmToWav(pcm: Buffer, sampleRate: number, channels: number, bitsPerSample: number): Buffer {
  const dataLen = pcm.length;
  const buf = Buffer.alloc(44 + dataLen);
  buf.write("RIFF", 0);
  buf.writeUInt32LE(36 + dataLen, 4);
  buf.write("WAVE", 8);
  buf.write("fmt ", 12);
  buf.writeUInt32LE(16, 16);
  buf.writeUInt16LE(1, 20);
  buf.writeUInt16LE(channels, 22);
  buf.writeUInt32LE(sampleRate, 24);
  buf.writeUInt32LE((sampleRate * channels * bitsPerSample) / 8, 28);
  buf.writeUInt16LE((channels * bitsPerSample) / 8, 32);
  buf.writeUInt16LE(bitsPerSample, 34);
  buf.write("data", 36);
  buf.writeUInt32LE(dataLen, 40);
  pcm.copy(buf, 44);
  return buf;
}

router.post("/ai/tts", async (req, res): Promise<void> => {
  const { text, voice } = req.body as { text?: string; voice?: string };
  if (!text || text.length > 600) { res.status(400).json({ error: "Invalid text" }); return; }
  try {
    const ai = getAI();
    const model = ai.getGenerativeModel({ model: "gemini-2.5-flash-preview-tts" });
    const result = await model.generateContent({
      contents: [{ role: "user", parts: [{ text }] }],
      generationConfig: {
        responseModalities: ["AUDIO"] as unknown as string[],
        speechConfig: {
          voiceConfig: { prebuiltVoiceConfig: { voiceName: voice || "Aoede" } },
        },
      } as Parameters<typeof model.generateContent>[0]["generationConfig"],
    });
    const part = result.response.candidates?.[0]?.content?.parts?.[0] as
      | { inlineData?: { data: string; mimeType: string } }
      | undefined;
    if (!part?.inlineData?.data) {
      res.status(500).json({ error: "No audio returned" });
      return;
    }
    const { data: b64, mimeType } = part.inlineData;
    const rateMatch = mimeType.match(/rate=(\d+)/);
    const sampleRate = rateMatch ? parseInt(rateMatch[1], 10) : 24000;
    const pcm = Buffer.from(b64, "base64");
    const wav = pcmToWav(pcm, sampleRate, 1, 16);
    res.json({ audio: wav.toString("base64"), mimeType: "audio/wav" });
  } catch (err) {
    req.log.error({ err }, "TTS error");
    res.status(500).json({ error: err instanceof Error ? err.message : "TTS error" });
  }
});

export default router;
