// App-wide internationalisation — 7 UI languages
// App UI language = user's native language. Learning content = user's target language.
// No mixed-language strings anywhere — each string comes from one language only.

import { createContext, useContext, useState, useEffect, type ReactNode } from "react";
import { createElement } from "react";

export type LangCode = "ar" | "en" | "fr" | "it" | "de" | "es" | "pt";

export const APP_LANGUAGES: { code: LangCode; label: string; native: string }[] = [
  { code: "ar", label: "Arabic",     native: "العربية"    },
  { code: "en", label: "English",    native: "English"    },
  { code: "fr", label: "French",     native: "Français"   },
  { code: "it", label: "Italian",    native: "Italiano"   },
  { code: "de", label: "German",     native: "Deutsch"    },
  { code: "es", label: "Spanish",    native: "Español"    },
  { code: "pt", label: "Portuguese", native: "Português"  },
];

export const LANG_NAME_TO_CODE: Record<string, LangCode> = {
  Arabic: "ar", العربية: "ar",
  English: "en",
  French: "fr", Français: "fr",
  Italian: "it", Italiano: "it",
  German: "de", Deutsch: "de",
  Spanish: "es", Español: "es",
  Portuguese: "pt", Português: "pt",
};

const RTL_CODES = new Set<LangCode>(["ar"]);
const RTL_NAMES = new Set(["Arabic", "Hebrew", "Persian", "Urdu", "العربية"]);

export function isRTLLang(lang: LangCode): boolean { return RTL_CODES.has(lang); }
export function isRTLName(name: string): boolean { return RTL_NAMES.has(name); }

type T = Record<string, string>;

const dict: Record<LangCode, T> = {
  ar: {
    // ── Nav ──
    home: "الرئيسية", cards: "البطاقات", dictionary: "القاموس",
    topics: "المواضيع", videos: "الفيديوهات", laxa_ai: "لاكسا AI", friends: "الأصدقاء", rooms: "الغرف",
    settings: "الإعدادات", sign_out: "تسجيل الخروج", profile: "الملف الشخصي",
    // ── Home ──
    greeting_morning: "صباح الخير", greeting_afternoon: "مساء الخير",
    greeting_evening: "مساء الخير", greeting_night: "تصبح على خير",
    stat_streak: "سلسلة الأيام", stat_xp: "مجموع النقاط",
    stat_words: "كلمات", stat_cards_r: "بطاقات",
    weekly_activity: "النشاط الأسبوعي",
    xp_progress: "تقدم النقاط", to_milestone: "للهدف",
    cefr_label: "المستوى", target_label: "اللغة المستهدفة",
    native_label: "اللغة الأم", keep_growing: "استمر في النمو كل يوم 🌴",
    learning_prefix: "تعلم",
    // ── Flashcards ──
    flashcards: "بطاقات التعلم",
    flashcards_subtitle: "مراجعة متكررة · تقنية الاسترجاع · علم الذاكرة",
    your_decks: "ملفاتك", create_deck: "إنشاء ملف",
    preset_decks: "ملفات جاهزة", study_now: "ادرس الآن",
    add_word: "إضافة كلمة", word_front: "الكلمة", word_back: "الترجمة",
    example: "جملة مثال", mastered: "متقن", new_card: "جديدة",
    hard: "صعبة", okay: "مقبولة", good: "جيدة", great: "ممتازة",
    due_today: "مستحقة اليوم", cards_count: "بطاقة", no_decks: "لا توجد ملفات",
    tap_to_reveal: "اضغط للكشف", how_well: "ما مدى معرفتك؟",
    try_recall: "حاول التذكر قبل القلب",
    back_to_deck: "العودة للملف", study_again: "دراسة مجدداً",
    no_cards_yet: "لا توجد بطاقات بعد",
    create_first_deck_desc: "أنشئ ملفك الأول وابدأ في إضافة الكلمات",
    create_my_first_deck: "إنشاء ملفي الأول",
    total_label: "المجموع", due_short: "مستحق", study_all: "مراجعة جميع البطاقات",
    all_words: "جميع الكلمات", icon: "أيقونة", description_opt: "الوصف (اختياري)",
    // ── Flashcard study ──
    flip: "اقلب", got_it: "تعلمته", again: "مرة أخرى", easy: "سهل",
    study_complete: "اكتملت الجلسة!", well_done: "أحسنت!",
    total_cards: "مجموع البطاقات", correct: "صحيح",
    deck_name: "اسم الملف", deck_lang: "لغة الملف", create: "إنشاء",
    spaced_rep_note: "البطاقات الصعبة ستظهر مجدداً قريباً — هذه هي قوة التكرار المتباعد",
    // ── Dictionary ──
    smart_dictionary: "القاموس الذكي",
    dict_subtitle: "شرح بالذكاء الاصطناعي · أمثلة حسب المستوى · النطق",
    search_placeholder: "ابحث عن أي كلمة...", search_btn: "بحث",
    history: "السجل", pronounce: "نطق", save_to_cards: "حفظ في البطاقات",
    meaning: "المعنى", examples: "أمثلة", related: "كلمات مرتبطة",
    // ── Settings ──
    app_language: "لغة التطبيق", learning_lang: "لغة التعلم",
    appearance: "المظهر", dark_mode: "الوضع الليلي",
    save_settings: "حفظ الإعدادات", saved: "تم الحفظ!",
    app_language_desc: "اختر لغة واجهة التطبيق. ستتغير جميع النصوص.",
    light: "فاتح", dark: "داكن",
    // ── Common ──
    back: "رجوع", save: "حفظ", cancel: "إلغاء", delete: "حذف",
    done: "تم", next: "التالي", loading: "جاري التحميل...",
    // ── Tutor / Laxa ──
    type_message: "اكتب رسالة...", listening_msg: "أستمع...",
    live_mode_msg: "وضع مباشر — تحدث في أي وقت...",
    talk_to_laxa: "تحدث مع لاكسا", replay: "إعادة",
    tutor_ready: "جاهز عندما تكون جاهزاً",
    tutor_subtitle: "مدرب لغوي بالذكاء الاصطناعي — يتكيف مع مستواك، ويصحح بلطف.",
    start_new_conv: "محادثة جديدة",
    search_conversations: "ابحث في المحادثات...",
    no_conversations: "لا توجد محادثات محفوظة بعد.",
    history_empty_search: "لا توجد محادثات تطابق بحثك.",
    session_settings: "إعدادات الجلسة",
    suggestion_coffee: "لنتمرن على طلب القهوة ☕",
    suggestion_grammar: "صحح قواعدي النحوية 📝",
    suggestion_interview: "ابدأ مقابلة عمل 💼",
    laxa_thinking: "لاكسا تفكر...",
    attach_file: "إرفاق ملف", toggle_mic: "تبديل الميكروفون",
    conv_history: "سجل المحادثات", open_sidebar: "فتح القائمة",
  },

  en: {
    home: "Home", cards: "Cards", dictionary: "Dictionary",
    topics: "Topics", videos: "Videos", laxa_ai: "Laxa AI", friends: "Friends", rooms: "Rooms",
    settings: "Settings", sign_out: "Sign out", profile: "Profile",
    greeting_morning: "Good morning", greeting_afternoon: "Good afternoon",
    greeting_evening: "Good evening", greeting_night: "Good night",
    stat_streak: "Streak", stat_xp: "Total XP",
    stat_words: "Words", stat_cards_r: "Cards",
    weekly_activity: "Weekly Activity",
    xp_progress: "XP Progress", to_milestone: "to milestone",
    cefr_label: "CEFR Level", target_label: "Target",
    native_label: "Native", keep_growing: "Keep growing every day 🌴",
    learning_prefix: "Learning",
    flashcards: "Flashcards",
    flashcards_subtitle: "Spaced repetition · Retrieval practice · Make It Stick",
    your_decks: "Your Decks", create_deck: "Create Deck",
    preset_decks: "Starter Decks", study_now: "Study Now",
    add_word: "Add Word", word_front: "Word", word_back: "Translation",
    example: "Example sentence", mastered: "Mastered", new_card: "New",
    hard: "Hard", okay: "Okay", good: "Good", great: "Great",
    due_today: "Due today", cards_count: "cards", no_decks: "No decks yet",
    tap_to_reveal: "Tap to reveal", how_well: "How well did you know this?",
    try_recall: "Try to recall the answer before flipping",
    back_to_deck: "Back to Deck", study_again: "Study Again",
    no_cards_yet: "No cards yet",
    create_first_deck_desc: "Create your first deck and start adding words",
    create_my_first_deck: "Create My First Deck",
    total_label: "Total", due_short: "due", study_all: "Study All Cards",
    all_words: "All words", icon: "Icon", description_opt: "Description (optional)",
    flip: "Flip", got_it: "Got it", again: "Again", easy: "Easy",
    study_complete: "Session Complete!", well_done: "Well done!",
    total_cards: "Total cards", correct: "Correct",
    deck_name: "Deck name", deck_lang: "Deck language", create: "Create",
    spaced_rep_note: "Cards you found difficult will appear again sooner — spaced repetition at work",
    smart_dictionary: "Smart Dictionary",
    dict_subtitle: "AI explanations · Level-based examples · Pronunciation",
    search_placeholder: "Look up any word...", search_btn: "Search",
    history: "History", pronounce: "Pronounce", save_to_cards: "Save to Cards",
    meaning: "Meaning", examples: "Examples", related: "Related words",
    app_language: "App Language", learning_lang: "Learning Language",
    appearance: "Appearance", dark_mode: "Dark Mode",
    save_settings: "Save Settings", saved: "Saved!",
    app_language_desc: "Choose the language for the app interface. All text will change.",
    light: "Light", dark: "Dark",
    back: "Back", save: "Save", cancel: "Cancel", delete: "Delete",
    done: "Done", next: "Next", loading: "Loading...",
    type_message: "Type a message...", listening_msg: "Listening...",
    live_mode_msg: "Live mode — speak anytime...",
    talk_to_laxa: "Talk to Laxa", replay: "Replay",
    tutor_ready: "Ready when you are",
    tutor_subtitle: "Your AI language coach — adapts to your level, corrects gently.",
    start_new_conv: "Start New Conversation",
    search_conversations: "Search conversations...",
    no_conversations: "No saved conversations yet.",
    history_empty_search: "No conversations match your search.",
    session_settings: "Session Settings",
    suggestion_coffee: "Let's practice ordering coffee ☕",
    suggestion_grammar: "Correct my grammar 📝",
    suggestion_interview: "Start a job interview 💼",
    laxa_thinking: "Laxa is thinking...",
    attach_file: "Attach file", toggle_mic: "Toggle microphone",
    conv_history: "Conversation history", open_sidebar: "Open sidebar",
  },

  fr: {
    home: "Accueil", cards: "Cartes", dictionary: "Dictionnaire",
    topics: "Sujets", videos: "Vidéos", laxa_ai: "Laxa AI", friends: "Amis", rooms: "Salles",
    settings: "Paramètres", sign_out: "Se déconnecter", profile: "Profil",
    greeting_morning: "Bonjour", greeting_afternoon: "Bon après-midi",
    greeting_evening: "Bonsoir", greeting_night: "Bonne nuit",
    stat_streak: "Série", stat_xp: "XP total",
    stat_words: "Mots", stat_cards_r: "Cartes",
    weekly_activity: "Activité hebdomadaire",
    xp_progress: "Progression XP", to_milestone: "vers l'objectif",
    cefr_label: "Niveau CECR", target_label: "Cible",
    native_label: "Natif", keep_growing: "Continuez à progresser chaque jour 🌴",
    learning_prefix: "Apprentissage",
    flashcards: "Fiches",
    flashcards_subtitle: "Répétition espacée · Rappel actif · Mémorisation",
    your_decks: "Vos paquets", create_deck: "Créer un paquet",
    preset_decks: "Paquets de départ", study_now: "Étudier maintenant",
    add_word: "Ajouter un mot", word_front: "Mot", word_back: "Traduction",
    example: "Exemple", mastered: "Maîtrisé", new_card: "Nouveau",
    hard: "Difficile", okay: "Correct", good: "Bien", great: "Excellent",
    due_today: "À réviser aujourd'hui", cards_count: "cartes", no_decks: "Aucun paquet",
    tap_to_reveal: "Appuyer pour révéler", how_well: "Dans quelle mesure le saviez-vous?",
    try_recall: "Essayez de vous souvenir avant de retourner",
    back_to_deck: "Retour au paquet", study_again: "Étudier à nouveau",
    no_cards_yet: "Aucune carte pour l'instant",
    create_first_deck_desc: "Créez votre premier paquet et commencez à ajouter des mots",
    create_my_first_deck: "Créer mon premier paquet",
    total_label: "Total", due_short: "dû", study_all: "Étudier toutes les cartes",
    all_words: "Tous les mots", icon: "Icône", description_opt: "Description (optionnel)",
    flip: "Retourner", got_it: "Compris", again: "Encore", easy: "Facile",
    study_complete: "Session terminée!", well_done: "Bravo!",
    total_cards: "Total cartes", correct: "Correct",
    deck_name: "Nom du paquet", deck_lang: "Langue du paquet", create: "Créer",
    spaced_rep_note: "Les cartes difficiles réapparaîtront bientôt — répétition espacée en action",
    smart_dictionary: "Dictionnaire intelligent",
    dict_subtitle: "Explications IA · Exemples par niveau · Prononciation",
    search_placeholder: "Rechercher un mot...", search_btn: "Rechercher",
    history: "Historique", pronounce: "Prononcer", save_to_cards: "Sauvegarder",
    meaning: "Signification", examples: "Exemples", related: "Mots associés",
    app_language: "Langue de l'app", learning_lang: "Langue d'apprentissage",
    appearance: "Apparence", dark_mode: "Mode sombre",
    save_settings: "Enregistrer", saved: "Enregistré!",
    app_language_desc: "Choisissez la langue de l'interface. Tous les textes changeront.",
    light: "Clair", dark: "Sombre",
    back: "Retour", save: "Sauvegarder", cancel: "Annuler", delete: "Supprimer",
    done: "Terminé", next: "Suivant", loading: "Chargement...",
    type_message: "Écrire un message...", listening_msg: "En écoute...",
    live_mode_msg: "Mode direct — parlez à tout moment...",
    talk_to_laxa: "Parler à Laxa", replay: "Rejouer",
    tutor_ready: "Prêt quand vous l'êtes",
    tutor_subtitle: "Votre coach linguistique IA — s'adapte à votre niveau.",
    start_new_conv: "Nouvelle conversation",
    search_conversations: "Rechercher des conversations...",
    no_conversations: "Aucune conversation sauvegardée.",
    history_empty_search: "Aucune conversation ne correspond.",
    session_settings: "Paramètres de session",
    suggestion_coffee: "Pratiquons commander un café ☕",
    suggestion_grammar: "Corrige ma grammaire 📝",
    suggestion_interview: "Commençons un entretien 💼",
    laxa_thinking: "Laxa réfléchit...",
    attach_file: "Joindre un fichier", toggle_mic: "Basculer micro",
    conv_history: "Historique des conversations", open_sidebar: "Ouvrir le menu",
  },

  it: {
    home: "Home", cards: "Carte", dictionary: "Dizionario",
    topics: "Argomenti", videos: "Video", laxa_ai: "Laxa AI", friends: "Amici", rooms: "Stanze",
    settings: "Impostazioni", sign_out: "Esci", profile: "Profilo",
    greeting_morning: "Buongiorno", greeting_afternoon: "Buon pomeriggio",
    greeting_evening: "Buonasera", greeting_night: "Buonanotte",
    stat_streak: "Serie", stat_xp: "XP totale",
    stat_words: "Parole", stat_cards_r: "Carte",
    weekly_activity: "Attività settimanale",
    xp_progress: "Progressione XP", to_milestone: "all'obiettivo",
    cefr_label: "Livello CEFR", target_label: "Obiettivo",
    native_label: "Madrelingua", keep_growing: "Continua a crescere ogni giorno 🌴",
    learning_prefix: "Studio",
    flashcards: "Flashcard",
    flashcards_subtitle: "Ripetizione spaziata · Recupero attivo · Memorizzazione",
    your_decks: "I tuoi mazzi", create_deck: "Crea mazzo",
    preset_decks: "Mazzi iniziali", study_now: "Studia ora",
    add_word: "Aggiungi parola", word_front: "Parola", word_back: "Traduzione",
    example: "Esempio", mastered: "Padroneggiato", new_card: "Nuovo",
    hard: "Difficile", okay: "Ok", good: "Bene", great: "Ottimo",
    due_today: "Da rivedere oggi", cards_count: "carte", no_decks: "Nessun mazzo",
    tap_to_reveal: "Tocca per rivelare", how_well: "Quanto lo conoscevi?",
    try_recall: "Cerca di ricordare prima di girare",
    back_to_deck: "Torna al mazzo", study_again: "Studia di nuovo",
    no_cards_yet: "Nessuna carta ancora",
    create_first_deck_desc: "Crea il tuo primo mazzo e inizia ad aggiungere parole",
    create_my_first_deck: "Crea il mio primo mazzo",
    total_label: "Totale", due_short: "da fare", study_all: "Studia tutte le carte",
    all_words: "Tutte le parole", icon: "Icona", description_opt: "Descrizione (opzionale)",
    flip: "Gira", got_it: "Capito", again: "Di nuovo", easy: "Facile",
    study_complete: "Sessione completata!", well_done: "Ottimo lavoro!",
    total_cards: "Totale carte", correct: "Corretto",
    deck_name: "Nome mazzo", deck_lang: "Lingua mazzo", create: "Crea",
    spaced_rep_note: "Le carte difficili riappariranno presto — ripetizione spaziata in azione",
    smart_dictionary: "Dizionario intelligente",
    dict_subtitle: "Spiegazioni IA · Esempi per livello · Pronuncia",
    search_placeholder: "Cerca una parola...", search_btn: "Cerca",
    history: "Cronologia", pronounce: "Pronunciare", save_to_cards: "Salva nelle carte",
    meaning: "Significato", examples: "Esempi", related: "Parole correlate",
    app_language: "Lingua dell'app", learning_lang: "Lingua di studio",
    appearance: "Aspetto", dark_mode: "Modalità scura",
    save_settings: "Salva impostazioni", saved: "Salvato!",
    app_language_desc: "Scegli la lingua dell'interfaccia. Tutto il testo cambierà.",
    light: "Chiaro", dark: "Scuro",
    back: "Indietro", save: "Salva", cancel: "Annulla", delete: "Elimina",
    done: "Fatto", next: "Avanti", loading: "Caricamento...",
    type_message: "Scrivi un messaggio...", listening_msg: "In ascolto...",
    live_mode_msg: "Modalità live — parla quando vuoi...",
    talk_to_laxa: "Parla con Laxa", replay: "Riproduci",
    tutor_ready: "Pronto quando sei pronto",
    tutor_subtitle: "Il tuo coach linguistico IA — si adatta al tuo livello.",
    start_new_conv: "Nuova conversazione",
    search_conversations: "Cerca conversazioni...",
    no_conversations: "Nessuna conversazione salvata.",
    history_empty_search: "Nessuna conversazione corrisponde.",
    session_settings: "Impostazioni sessione",
    suggestion_coffee: "Proviamo a ordinare un caffè ☕",
    suggestion_grammar: "Correggi la mia grammatica 📝",
    suggestion_interview: "Inizia un colloquio di lavoro 💼",
    laxa_thinking: "Laxa sta pensando...",
    attach_file: "Allega file", toggle_mic: "Attiva/disattiva microfono",
    conv_history: "Cronologia conversazioni", open_sidebar: "Apri menu",
  },

  de: {
    home: "Startseite", cards: "Karten", dictionary: "Wörterbuch",
    topics: "Themen", videos: "Videos", laxa_ai: "Laxa AI", friends: "Freunde", rooms: "Räume",
    settings: "Einstellungen", sign_out: "Abmelden", profile: "Profil",
    greeting_morning: "Guten Morgen", greeting_afternoon: "Guten Nachmittag",
    greeting_evening: "Guten Abend", greeting_night: "Gute Nacht",
    stat_streak: "Serie", stat_xp: "Gesamt-XP",
    stat_words: "Wörter", stat_cards_r: "Karten",
    weekly_activity: "Wöchentliche Aktivität",
    xp_progress: "XP-Fortschritt", to_milestone: "zum Ziel",
    cefr_label: "GER-Niveau", target_label: "Ziel",
    native_label: "Muttersprache", keep_growing: "Jeden Tag wachsen 🌴",
    learning_prefix: "Lerne",
    flashcards: "Lernkarten",
    flashcards_subtitle: "Spaced Repetition · Aktives Erinnern · Gedächtnisforschung",
    your_decks: "Deine Stapel", create_deck: "Stapel erstellen",
    preset_decks: "Starter-Stapel", study_now: "Jetzt lernen",
    add_word: "Wort hinzufügen", word_front: "Wort", word_back: "Übersetzung",
    example: "Beispiel", mastered: "Beherrscht", new_card: "Neu",
    hard: "Schwer", okay: "Ok", good: "Gut", great: "Sehr gut",
    due_today: "Heute fällig", cards_count: "Karten", no_decks: "Keine Stapel",
    tap_to_reveal: "Tippen zum Aufdecken", how_well: "Wie gut wusstest du das?",
    try_recall: "Versuche dich zu erinnern, bevor du umdrehst",
    back_to_deck: "Zurück zum Stapel", study_again: "Nochmal lernen",
    no_cards_yet: "Noch keine Karten",
    create_first_deck_desc: "Erstelle deinen ersten Stapel und füge Wörter hinzu",
    create_my_first_deck: "Meinen ersten Stapel erstellen",
    total_label: "Gesamt", due_short: "fällig", study_all: "Alle Karten lernen",
    all_words: "Alle Wörter", icon: "Symbol", description_opt: "Beschreibung (optional)",
    flip: "Umdrehen", got_it: "Verstanden", again: "Nochmal", easy: "Einfach",
    study_complete: "Sitzung abgeschlossen!", well_done: "Gut gemacht!",
    total_cards: "Karten gesamt", correct: "Richtig",
    deck_name: "Stapelname", deck_lang: "Stapelsprache", create: "Erstellen",
    spaced_rep_note: "Schwierige Karten erscheinen bald wieder — Spaced Repetition",
    smart_dictionary: "Intelligentes Wörterbuch",
    dict_subtitle: "KI-Erklärungen · Beispiele nach Niveau · Aussprache",
    search_placeholder: "Wort suchen...", search_btn: "Suchen",
    history: "Verlauf", pronounce: "Aussprechen", save_to_cards: "In Karten speichern",
    meaning: "Bedeutung", examples: "Beispiele", related: "Verwandte Wörter",
    app_language: "App-Sprache", learning_lang: "Lernsprache",
    appearance: "Darstellung", dark_mode: "Dunkelmodus",
    save_settings: "Einstellungen speichern", saved: "Gespeichert!",
    app_language_desc: "Wähle die Sprache der App-Oberfläche. Alle Texte ändern sich.",
    light: "Hell", dark: "Dunkel",
    back: "Zurück", save: "Speichern", cancel: "Abbrechen", delete: "Löschen",
    done: "Fertig", next: "Weiter", loading: "Laden...",
    type_message: "Nachricht eingeben...", listening_msg: "Zuhören...",
    live_mode_msg: "Live-Modus — jederzeit sprechen...",
    talk_to_laxa: "Mit Laxa sprechen", replay: "Wiederholen",
    tutor_ready: "Bereit, wenn du bereit bist",
    tutor_subtitle: "Dein KI-Sprachcoach — passt sich deinem Niveau an.",
    start_new_conv: "Neue Unterhaltung",
    search_conversations: "Unterhaltungen suchen...",
    no_conversations: "Noch keine gespeicherten Unterhaltungen.",
    history_empty_search: "Keine Unterhaltungen gefunden.",
    session_settings: "Sitzungseinstellungen",
    suggestion_coffee: "Lass uns Kaffee bestellen üben ☕",
    suggestion_grammar: "Korrigiere meine Grammatik 📝",
    suggestion_interview: "Starte ein Vorstellungsgespräch 💼",
    laxa_thinking: "Laxa denkt nach...",
    attach_file: "Datei anhängen", toggle_mic: "Mikrofon umschalten",
    conv_history: "Gesprächsverlauf", open_sidebar: "Menü öffnen",
  },

  es: {
    home: "Inicio", cards: "Tarjetas", dictionary: "Diccionario",
    topics: "Temas", videos: "Videos", laxa_ai: "Laxa AI", friends: "Amigos", rooms: "Salas",
    settings: "Ajustes", sign_out: "Cerrar sesión", profile: "Perfil",
    greeting_morning: "Buenos días", greeting_afternoon: "Buenas tardes",
    greeting_evening: "Buenas tardes", greeting_night: "Buenas noches",
    stat_streak: "Racha", stat_xp: "XP total",
    stat_words: "Palabras", stat_cards_r: "Tarjetas",
    weekly_activity: "Actividad semanal",
    xp_progress: "Progresión XP", to_milestone: "al objetivo",
    cefr_label: "Nivel MCER", target_label: "Objetivo",
    native_label: "Nativo", keep_growing: "Sigue creciendo cada día 🌴",
    learning_prefix: "Aprendiendo",
    flashcards: "Tarjetas de estudio",
    flashcards_subtitle: "Repetición espaciada · Recuperación activa · Ciencia de la memoria",
    your_decks: "Tus mazos", create_deck: "Crear mazo",
    preset_decks: "Mazos iniciales", study_now: "Estudiar ahora",
    add_word: "Añadir palabra", word_front: "Palabra", word_back: "Traducción",
    example: "Ejemplo", mastered: "Dominado", new_card: "Nuevo",
    hard: "Difícil", okay: "Bien", good: "Bien", great: "Excelente",
    due_today: "Para hoy", cards_count: "tarjetas", no_decks: "Sin mazos",
    tap_to_reveal: "Toca para revelar", how_well: "¿Cuánto lo sabías?",
    try_recall: "Intenta recordar antes de voltear",
    back_to_deck: "Volver al mazo", study_again: "Estudiar de nuevo",
    no_cards_yet: "Aún no hay tarjetas",
    create_first_deck_desc: "Crea tu primer mazo y empieza a añadir palabras",
    create_my_first_deck: "Crear mi primer mazo",
    total_label: "Total", due_short: "pendiente", study_all: "Estudiar todas las tarjetas",
    all_words: "Todas las palabras", icon: "Icono", description_opt: "Descripción (opcional)",
    flip: "Voltear", got_it: "Entendido", again: "Otra vez", easy: "Fácil",
    study_complete: "¡Sesión completa!", well_done: "¡Bien hecho!",
    total_cards: "Total tarjetas", correct: "Correcto",
    deck_name: "Nombre del mazo", deck_lang: "Idioma del mazo", create: "Crear",
    spaced_rep_note: "Las tarjetas difíciles aparecerán pronto — repetición espaciada",
    smart_dictionary: "Diccionario inteligente",
    dict_subtitle: "Explicaciones IA · Ejemplos por nivel · Pronunciación",
    search_placeholder: "Buscar una palabra...", search_btn: "Buscar",
    history: "Historial", pronounce: "Pronunciar", save_to_cards: "Guardar en tarjetas",
    meaning: "Significado", examples: "Ejemplos", related: "Palabras relacionadas",
    app_language: "Idioma de la app", learning_lang: "Idioma de aprendizaje",
    appearance: "Apariencia", dark_mode: "Modo oscuro",
    save_settings: "Guardar ajustes", saved: "¡Guardado!",
    app_language_desc: "Elige el idioma de la interfaz. Todo el texto cambiará.",
    light: "Claro", dark: "Oscuro",
    back: "Volver", save: "Guardar", cancel: "Cancelar", delete: "Eliminar",
    done: "Hecho", next: "Siguiente", loading: "Cargando...",
    type_message: "Escribe un mensaje...", listening_msg: "Escuchando...",
    live_mode_msg: "Modo en vivo — habla en cualquier momento...",
    talk_to_laxa: "Hablar con Laxa", replay: "Repetir",
    tutor_ready: "Listo cuando tú lo estés",
    tutor_subtitle: "Tu coach de idiomas IA — se adapta a tu nivel.",
    start_new_conv: "Nueva conversación",
    search_conversations: "Buscar conversaciones...",
    no_conversations: "Aún no hay conversaciones guardadas.",
    history_empty_search: "Ninguna conversación coincide.",
    session_settings: "Configuración de sesión",
    suggestion_coffee: "Practiquemos pedir un café ☕",
    suggestion_grammar: "Corrige mi gramática 📝",
    suggestion_interview: "Empieza una entrevista de trabajo 💼",
    laxa_thinking: "Laxa está pensando...",
    attach_file: "Adjuntar archivo", toggle_mic: "Activar/desactivar micrófono",
    conv_history: "Historial de conversaciones", open_sidebar: "Abrir menú",
  },

  pt: {
    home: "Início", cards: "Cartões", dictionary: "Dicionário",
    topics: "Tópicos", videos: "Vídeos", laxa_ai: "Laxa AI", friends: "Amigos", rooms: "Salas",
    settings: "Configurações", sign_out: "Sair", profile: "Perfil",
    greeting_morning: "Bom dia", greeting_afternoon: "Boa tarde",
    greeting_evening: "Boa tarde", greeting_night: "Boa noite",
    stat_streak: "Sequência", stat_xp: "XP total",
    stat_words: "Palavras", stat_cards_r: "Cartões",
    weekly_activity: "Atividade semanal",
    xp_progress: "Progressão XP", to_milestone: "para o objetivo",
    cefr_label: "Nível QECR", target_label: "Objetivo",
    native_label: "Nativo", keep_growing: "Continue crescendo cada dia 🌴",
    learning_prefix: "Aprendendo",
    flashcards: "Flashcards",
    flashcards_subtitle: "Repetição espaçada · Prática de recuperação · Ciência da memória",
    your_decks: "Seus baralhos", create_deck: "Criar baralho",
    preset_decks: "Baralhos iniciais", study_now: "Estudar agora",
    add_word: "Adicionar palavra", word_front: "Palavra", word_back: "Tradução",
    example: "Exemplo", mastered: "Dominado", new_card: "Novo",
    hard: "Difícil", okay: "Ok", good: "Bom", great: "Ótimo",
    due_today: "Para hoje", cards_count: "cartões", no_decks: "Sem baralhos",
    tap_to_reveal: "Toque para revelar", how_well: "Quanto você sabia isso?",
    try_recall: "Tente lembrar antes de virar",
    back_to_deck: "Voltar ao baralho", study_again: "Estudar novamente",
    no_cards_yet: "Nenhum cartão ainda",
    create_first_deck_desc: "Crie seu primeiro baralho e comece a adicionar palavras",
    create_my_first_deck: "Criar meu primeiro baralho",
    total_label: "Total", due_short: "pendente", study_all: "Estudar todos os cartões",
    all_words: "Todas as palavras", icon: "Ícone", description_opt: "Descrição (opcional)",
    flip: "Virar", got_it: "Entendi", again: "De novo", easy: "Fácil",
    study_complete: "Sessão completa!", well_done: "Muito bem!",
    total_cards: "Total cartões", correct: "Correto",
    deck_name: "Nome do baralho", deck_lang: "Idioma do baralho", create: "Criar",
    spaced_rep_note: "Cartões difíceis aparecerão em breve — repetição espaçada",
    smart_dictionary: "Dicionário inteligente",
    dict_subtitle: "Explicações IA · Exemplos por nível · Pronúncia",
    search_placeholder: "Procurar uma palavra...", search_btn: "Pesquisar",
    history: "Histórico", pronounce: "Pronunciar", save_to_cards: "Salvar nos cartões",
    meaning: "Significado", examples: "Exemplos", related: "Palavras relacionadas",
    app_language: "Idioma do app", learning_lang: "Idioma de aprendizagem",
    appearance: "Aparência", dark_mode: "Modo escuro",
    save_settings: "Salvar configurações", saved: "Salvo!",
    app_language_desc: "Escolha o idioma da interface. Todo o texto mudará.",
    light: "Claro", dark: "Escuro",
    back: "Voltar", save: "Salvar", cancel: "Cancelar", delete: "Excluir",
    done: "Feito", next: "Próximo", loading: "Carregando...",
    type_message: "Digite uma mensagem...", listening_msg: "Ouvindo...",
    live_mode_msg: "Modo ao vivo — fale a qualquer momento...",
    talk_to_laxa: "Falar com Laxa", replay: "Reproduzir",
    tutor_ready: "Pronto quando você estiver",
    tutor_subtitle: "Seu coach de idiomas com IA — adapta-se ao seu nível.",
    start_new_conv: "Nova conversa",
    search_conversations: "Pesquisar conversas...",
    no_conversations: "Nenhuma conversa salva ainda.",
    history_empty_search: "Nenhuma conversa corresponde.",
    session_settings: "Configurações de sessão",
    suggestion_coffee: "Vamos praticar pedir um café ☕",
    suggestion_grammar: "Corrija minha gramática 📝",
    suggestion_interview: "Começar uma entrevista de emprego 💼",
    laxa_thinking: "Laxa está pensando...",
    attach_file: "Anexar arquivo", toggle_mic: "Ligar/desligar microfone",
    conv_history: "Histórico de conversas", open_sidebar: "Abrir menu",
  },
};

/* ── Context ───────────────────────────────────────────── */

interface I18nCtx {
  lang: LangCode;
  t: (key: string) => string;
  isRTL: boolean;
  setLang: (l: LangCode) => void;
}

const I18nContext = createContext<I18nCtx>({
  lang: "en", t: (k) => k, isRTL: false, setLang: () => {},
});

const LANG_KEY = "palmingo:lang";

function applyDir(lang: LangCode) {
  const rtl = RTL_CODES.has(lang);
  document.documentElement.dir  = rtl ? "rtl" : "ltr";
  document.documentElement.lang = lang;
}

function resolveInitialLang(): LangCode {
  try {
    const stored = localStorage.getItem(LANG_KEY) as LangCode | null;
    if (stored && dict[stored]) return stored;
    const raw = localStorage.getItem("palmingo:user");
    if (raw) {
      const user = JSON.parse(raw) as { nativeLang?: string };
      if (user.nativeLang) {
        const code = LANG_NAME_TO_CODE[user.nativeLang];
        if (code) return code;
      }
    }
  } catch { /* ignore */ }
  return "en";
}

export function I18nProvider({ children }: { children: ReactNode }) {
  const [lang, setLangState] = useState<LangCode>(resolveInitialLang);

  useEffect(() => { applyDir(lang); }, [lang]);

  // Auto-sync UI language when user profile changes (onboarding, settings, login)
  useEffect(() => {
    const handler = (e: Event) => {
      const user = (e as CustomEvent<{ nativeLang?: string }>).detail;
      if (user?.nativeLang) {
        const code = LANG_NAME_TO_CODE[user.nativeLang];
        if (code && dict[code]) {
          setLangState(code);
          try { localStorage.setItem(LANG_KEY, code); } catch {}
          applyDir(code);
        }
      }
    };
    window.addEventListener("palmingo:userUpdated", handler);
    return () => window.removeEventListener("palmingo:userUpdated", handler);
  }, []);

  const setLang = (l: LangCode) => {
    setLangState(l);
    try { localStorage.setItem(LANG_KEY, l); } catch {}
    applyDir(l);
  };

  const t = (key: string): string =>
    dict[lang]?.[key] ?? dict.en?.[key] ?? key;

  return createElement(
    I18nContext.Provider,
    { value: { lang, t, isRTL: RTL_CODES.has(lang), setLang } },
    children
  );
}

export function useI18n(): I18nCtx {
  return useContext(I18nContext);
}
