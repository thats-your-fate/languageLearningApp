import { createContext, createElement, ReactNode, useContext, useEffect, useMemo, useState } from "react";
import { NativeModules, Platform } from "react-native";
import { getSettings } from "./services/settingsService";
import { DifficultyGrade } from "./types/progress";
import { LanguageCode } from "./types/vocabulary";

type TranslationKey =
  | "app.name"
  | "common.loading"
  | "common.back"
  | "common.next"
  | "common.save"
  | "common.saved"
  | "common.pass"
  | "common.check"
  | "common.stop"
  | "common.listen"
  | "common.tryAgain"
  | "common.practice"
  | "common.settings"
  | "common.stats"
  | "common.learn"
  | "common.wordList"
  | "common.practiceHub"
  | "common.aiWriting"
  | "common.aiSpeaking"
  | "home.subtitle"
  | "home.startPractice"
  | "learn.chooseCategory"
  | "learn.openList"
  | "learn.leftKnown"
  | "wordList.practiceThisList"
  | "wordList.practiceSentences"
  | "wordList.counts"
  | "wordList.knownHelper"
  | "settings.title"
  | "settings.subtitle"
  | "settings.nativeLanguage"
  | "settings.learningLanguage"
  | "settings.learningLevel"
  | "settings.appearance"
  | "settings.system"
  | "settings.light"
  | "settings.dark"
  | "settings.savedMessage"
  | "onboarding.welcome"
  | "onboarding.iSpeak"
  | "onboarding.iWantToLearn"
  | "onboarding.myLevel"
  | "onboarding.sourceSubtitle"
  | "onboarding.targetSubtitle"
  | "onboarding.levelSubtitle"
  | "onboarding.startLearning"
  | "practice.loadingCards"
  | "practice.noCards"
  | "practice.noCardsBody"
  | "practice.remainingCompleted"
  | "practice.selectLevel"
  | "practice.translate"
  | "practice.answer"
  | "practice.typeAnswer"
  | "practice.reveal"
  | "practice.gradeInfo"
  | "practice.writingPractice"
  | "practice.speakingPractice"
  | "practiceHub.title"
  | "practiceHub.subtitle"
  | "practiceHub.discoveryTitle"
  | "practiceHub.discoveryDescription"
  | "practiceHub.flashcardsTitle"
  | "practiceHub.flashcardsDescription"
  | "practiceHub.writingTitle"
  | "practiceHub.writingDescription"
  | "practiceHub.speakingTitle"
  | "practiceHub.speakingDescription"
  | "sentence.title"
  | "sentence.loading"
  | "sentence.noKnownTitle"
  | "sentence.noKnownBody"
  | "sentence.practiceCards"
  | "sentence.knownRemaining"
  | "sentence.chooseMissing"
  | "sentence.fillBlank"
  | "sentence.typeMissing"
  | "sentence.nativeTranslation"
  | "sentence.correctAnswer"
  | "stats.cardsToday"
  | "stats.knownCards"
  | "stats.knownHelper"
  | "stats.byGrade"
  | "stats.gradeHelper"
  | "stats.weakCards"
  | "stats.weakHelper"
  | "discovery.title"
  | "discovery.loading"
  | "discovery.cardProgress"
  | "discovery.learnerLanguage"
  | "discovery.nativeTranslation"
  | "discovery.playing"
  | "discovery.playSequence"
  | "discovery.pauseAutoplay"
  | "discovery.resumeAutoplay"
  | "discovery.nextCard"
  | "aiWriting.title"
  | "aiWriting.loading"
  | "aiWriting.noKnown"
  | "aiWriting.prompt"
  | "aiWriting.reference"
  | "aiWriting.placeholder"
  | "aiWriting.feedback"
  | "aiWriting.offlineFeedback"
  | "aiWriting.explainInMyLanguage"
  | "aiWriting.explanation"
  | "aiWriting.exampleSentence"
  | "aiWriting.practiceSpeaking"
  | "aiSpeaking.title"
  | "aiSpeaking.loading"
  | "aiSpeaking.speakSentence"
  | "aiSpeaking.startRecording"
  | "aiSpeaking.submitRecording"
  | "aiSpeaking.transcriptPlaceholder"
  | "aiSpeaking.submitTranscript"
  | "aiSpeaking.playCorrect"
  | "card.details"
  | "card.notFound"
  | "card.learningWord"
  | "card.nativeMeaning"
  | "card.category"
  | "card.examples"
  | "card.meaning"
  | "card.sourceExample"
  | "card.targetExample"
  | "card.practiceWriting"
  | "card.practiceSpeaking"
  | "card.regularPractice"
  | "card.playPronunciation"
  | "flashcard.playPronunciation"
  | "flashcard.revealAnswer"
  | "result.exampleSentence";

type Variables = Record<string, string | number>;
type Dictionary = Record<TranslationKey, string>;

type I18nContextValue = {
  language: LanguageCode;
  setLanguage: (language: LanguageCode) => void;
  categoryName: (category: string) => string;
  gradeName: (grade: DifficultyGrade) => string;
  languageName: (language: LanguageCode) => string;
  t: (key: TranslationKey, variables?: Variables) => string;
};

type DictionaryLanguage = "en" | "de" | "pt-BR" | "it" | "es" | "fr";

const dictionaries: Record<DictionaryLanguage, Dictionary> = {
  en: {
    "app.name": "Lighthouse",
    "common.loading": "Loading...",
    "common.back": "Back",
    "common.next": "Next",
    "common.save": "Save",
    "common.saved": "Saved",
    "common.pass": "Pass",
    "common.check": "Check",
    "common.stop": "Stop",
    "common.listen": "Listen",
    "common.tryAgain": "Try again",
    "common.practice": "Practice",
    "common.settings": "Settings",
    "common.stats": "Stats",
    "common.learn": "Learn",
    "common.wordList": "Word list",
    "common.practiceHub": "Practice Hub",
    "common.aiWriting": "AI Writing",
    "common.aiSpeaking": "AI Speaking",
    "home.subtitle": "Practice words, then use them in sentences.",
    "home.startPractice": "Start Practice",
    "learn.chooseCategory": "Choose a category",
    "learn.openList": "Open list",
    "learn.leftKnown": "{left} left · {known} known",
    "wordList.practiceThisList": "Practice this list",
    "wordList.practiceSentences": "Practice sentences",
    "wordList.counts": "{left} left · {known} known · {total} total",
    "wordList.knownHelper": "Good and Easy cards count as known.",
    "settings.title": "Language settings",
    "settings.subtitle": "Update your native and learning language.",
    "settings.nativeLanguage": "Native language",
    "settings.learningLanguage": "Learning language",
    "settings.learningLevel": "Learning level",
    "settings.appearance": "Appearance",
    "settings.system": "System",
    "settings.light": "Light",
    "settings.dark": "Dark",
    "settings.savedMessage": "Language settings updated.",
    "onboarding.welcome": "Welcome",
    "onboarding.iSpeak": "I speak",
    "onboarding.iWantToLearn": "I want to learn",
    "onboarding.myLevel": "My level",
    "onboarding.sourceSubtitle": "Choose your original language.",
    "onboarding.targetSubtitle": "Choose your learner language.",
    "onboarding.levelSubtitle": "Pick a level available in your content.",
    "onboarding.startLearning": "Start learning",
    "practice.loadingCards": "Loading practice cards...",
    "practice.noCards": "NO CARDS",
    "practice.noCardsBody": "There are no cards in this practice list yet.",
    "practice.remainingCompleted": "Remaining: {remaining} | Completed: {completed} / {total}",
    "practice.selectLevel": "Select level",
    "practice.translate": "TRANSLATE",
    "practice.answer": "ANSWER",
    "practice.typeAnswer": "Type the learner-language answer",
    "practice.reveal": "Reveal",
    "practice.gradeInfo": "Again and Hard repeat in this session. Good and Easy move to known words.",
    "practice.writingPractice": "Writing practice",
    "practice.speakingPractice": "Speaking practice",
    "practiceHub.title": "Practice",
    "practiceHub.subtitle": "Pick one focused exercise.",
    "practiceHub.discoveryTitle": "Discovery mode",
    "practiceHub.discoveryDescription": "Autoplay new words and examples.",
    "practiceHub.flashcardsTitle": "Practice known words",
    "practiceHub.flashcardsDescription": "Review cards with spaced repetition.",
    "practiceHub.writingTitle": "Practice writing with AI",
    "practiceHub.writingDescription": "Write your own sentence and get feedback.",
    "practiceHub.speakingTitle": "Practice speaking with AI",
    "practiceHub.speakingDescription": "Speak a sentence and review the transcript.",
    "sentence.title": "Sentence practice",
    "sentence.loading": "Loading sentence practice...",
    "sentence.noKnownTitle": "No known sentences yet",
    "sentence.noKnownBody": "Mark cards as Good or Easy first. Sentence practice uses known words only.",
    "sentence.practiceCards": "Practice cards",
    "sentence.knownRemaining": "Known words {mode} · Remaining: {remaining}",
    "sentence.chooseMissing": "Choose the missing word",
    "sentence.fillBlank": "Fill in the blank",
    "sentence.typeMissing": "Type the missing word",
    "sentence.nativeTranslation": "Native translation: {text}",
    "sentence.correctAnswer": "Correct answer: {answer}",
    "stats.cardsToday": "Cards practiced today",
    "stats.knownCards": "Known cards",
    "stats.knownHelper": "Tap to practice known words",
    "stats.byGrade": "By grade",
    "stats.gradeHelper": "Tap a grade group to practice those cards again",
    "stats.weakCards": "Weak cards",
    "stats.weakHelper": "Tap to practice weak cards",
    "discovery.title": "Discovery",
    "discovery.loading": "Loading discovery cards...",
    "discovery.cardProgress": "Card {current} / {total}",
    "discovery.learnerLanguage": "Learner language",
    "discovery.nativeTranslation": "Native translation",
    "discovery.playing": "Playing...",
    "discovery.playSequence": "Play sequence",
    "discovery.pauseAutoplay": "Pause autoplay",
    "discovery.resumeAutoplay": "Resume autoplay",
    "discovery.nextCard": "Next card",
    "aiWriting.title": "Writing practice",
    "aiWriting.loading": "Loading AI writing practice...",
    "aiWriting.noKnown": "Mark a few cards as Good or Easy first. AI writing practice uses your known words only.",
    "aiWriting.prompt": "Please compose a sentence in {language} with the given word:",
    "aiWriting.reference": "Reference example (your language, optional)",
    "aiWriting.placeholder": "Write your sentence",
    "aiWriting.feedback": "AI feedback",
    "aiWriting.offlineFeedback": "Offline feedback",
    "aiWriting.explainInMyLanguage": "Explain in my language",
    "aiWriting.explanation": "Explanation",
    "aiWriting.exampleSentence": "Example sentence",
    "aiWriting.practiceSpeaking": "Practice this sentence by speaking",
    "aiSpeaking.title": "AI Speaking",
    "aiSpeaking.loading": "Loading AI speaking practice...",
    "aiSpeaking.speakSentence": "Speak this sentence",
    "aiSpeaking.startRecording": "Start recording",
    "aiSpeaking.submitRecording": "Submit recording",
    "aiSpeaking.transcriptPlaceholder": "Transcript",
    "aiSpeaking.submitTranscript": "Submit transcript",
    "aiSpeaking.playCorrect": "Play correct sentence",
    "card.details": "Word details",
    "card.notFound": "Card not found.",
    "card.learningWord": "Learning word",
    "card.nativeMeaning": "Meaning in your language",
    "card.category": "Category",
    "card.examples": "Examples",
    "card.meaning": "Meaning",
    "card.sourceExample": "Source example",
    "card.targetExample": "Target example",
    "card.practiceWriting": "Practice writing",
    "card.practiceSpeaking": "Practice speaking",
    "card.regularPractice": "Regular practice",
    "card.playPronunciation": "Play pronunciation",
    "flashcard.playPronunciation": "Play pronunciation",
    "flashcard.revealAnswer": "Reveal answer",
    "result.exampleSentence": "Example sentence"
  },
  de: {
    "app.name": "Lighthouse",
    "common.loading": "Wird geladen...",
    "common.back": "Zurück",
    "common.next": "Weiter",
    "common.save": "Speichern",
    "common.saved": "Gespeichert",
    "common.pass": "Überspringen",
    "common.check": "Prüfen",
    "common.stop": "Stopp",
    "common.listen": "Anhören",
    "common.tryAgain": "Nochmal",
    "common.practice": "Üben",
    "common.settings": "Einstellungen",
    "common.stats": "Statistik",
    "common.learn": "Lernen",
    "common.wordList": "Wortliste",
    "common.practiceHub": "Übungen",
    "common.aiWriting": "KI-Schreiben",
    "common.aiSpeaking": "KI-Sprechen",
    "home.subtitle": "Übe Wörter und verwende sie dann in Sätzen.",
    "home.startPractice": "Übung starten",
    "learn.chooseCategory": "Kategorie wählen",
    "learn.openList": "Liste öffnen",
    "learn.leftKnown": "{left} übrig · {known} bekannt",
    "wordList.practiceThisList": "Diese Liste üben",
    "wordList.practiceSentences": "Sätze üben",
    "wordList.counts": "{left} übrig · {known} bekannt · {total} gesamt",
    "wordList.knownHelper": "Good- und Easy-Karten zählen als bekannt.",
    "settings.title": "Spracheinstellungen",
    "settings.subtitle": "Aktualisiere deine native und deine Lernsprache.",
    "settings.nativeLanguage": "Native Sprache",
    "settings.learningLanguage": "Lernsprache",
    "settings.learningLevel": "Lernniveau",
    "settings.appearance": "Darstellung",
    "settings.system": "System",
    "settings.light": "Hell",
    "settings.dark": "Dunkel",
    "settings.savedMessage": "Spracheinstellungen aktualisiert.",
    "onboarding.welcome": "Willkommen",
    "onboarding.iSpeak": "Ich spreche",
    "onboarding.iWantToLearn": "Ich möchte lernen",
    "onboarding.myLevel": "Mein Niveau",
    "onboarding.sourceSubtitle": "Wähle deine Ausgangssprache.",
    "onboarding.targetSubtitle": "Wähle deine Lernsprache.",
    "onboarding.levelSubtitle": "Wähle ein verfügbares Niveau.",
    "onboarding.startLearning": "Lernen starten",
    "practice.loadingCards": "Übungskarten werden geladen...",
    "practice.noCards": "KEINE KARTEN",
    "practice.noCardsBody": "In dieser Übungsliste gibt es noch keine Karten.",
    "practice.remainingCompleted": "Übrig: {remaining} | Fertig: {completed} / {total}",
    "practice.selectLevel": "Niveau wählen",
    "practice.translate": "ÜBERSETZEN",
    "practice.answer": "ANTWORT",
    "practice.typeAnswer": "Antwort in der Lernsprache eingeben",
    "practice.reveal": "Aufdecken",
    "practice.gradeInfo": "Again und Hard kommen in dieser Sitzung wieder. Good und Easy werden bekannt.",
    "practice.writingPractice": "Schreiben üben",
    "practice.speakingPractice": "Sprechen üben",
    "practiceHub.title": "Üben",
    "practiceHub.subtitle": "Wähle eine fokussierte Übung.",
    "practiceHub.discoveryTitle": "Entdeckungsmodus",
    "practiceHub.discoveryDescription": "Neue Wörter und Beispiele automatisch abspielen.",
    "practiceHub.flashcardsTitle": "Bekannte Wörter üben",
    "practiceHub.flashcardsDescription": "Karten mit Wiederholung üben.",
    "practiceHub.writingTitle": "Schreiben mit KI üben",
    "practiceHub.writingDescription": "Schreibe einen eigenen Satz und erhalte Feedback.",
    "practiceHub.speakingTitle": "Sprechen mit KI üben",
    "practiceHub.speakingDescription": "Sprich einen Satz und prüfe das Transkript.",
    "sentence.title": "Satzübung",
    "sentence.loading": "Satzübung wird geladen...",
    "sentence.noKnownTitle": "Noch keine bekannten Sätze",
    "sentence.noKnownBody": "Markiere zuerst Karten als Good oder Easy. Satzübungen nutzen nur bekannte Wörter.",
    "sentence.practiceCards": "Karten üben",
    "sentence.knownRemaining": "Bekannte Wörter {mode} · Übrig: {remaining}",
    "sentence.chooseMissing": "Fehlendes Wort wählen",
    "sentence.fillBlank": "Lücke ausfüllen",
    "sentence.typeMissing": "Fehlendes Wort eingeben",
    "sentence.nativeTranslation": "Übersetzung: {text}",
    "sentence.correctAnswer": "Richtige Antwort: {answer}",
    "stats.cardsToday": "Heute geübte Karten",
    "stats.knownCards": "Bekannte Karten",
    "stats.knownHelper": "Tippen, um bekannte Wörter zu üben",
    "stats.byGrade": "Nach Bewertung",
    "stats.gradeHelper": "Tippe eine Gruppe an, um diese Karten erneut zu üben",
    "stats.weakCards": "Schwache Karten",
    "stats.weakHelper": "Tippen, um schwache Karten zu üben",
    "discovery.title": "Entdecken",
    "discovery.loading": "Entdeckungskarten werden geladen...",
    "discovery.cardProgress": "Karte {current} / {total}",
    "discovery.learnerLanguage": "Lernsprache",
    "discovery.nativeTranslation": "Übersetzung",
    "discovery.playing": "Läuft...",
    "discovery.playSequence": "Sequenz abspielen",
    "discovery.pauseAutoplay": "Autoplay pausieren",
    "discovery.resumeAutoplay": "Autoplay fortsetzen",
    "discovery.nextCard": "Nächste Karte",
    "aiWriting.title": "Schreibübung",
    "aiWriting.loading": "KI-Schreibübung wird geladen...",
    "aiWriting.noKnown": "Markiere zuerst ein paar Karten als Good oder Easy. KI-Schreiben nutzt nur bekannte Wörter.",
    "aiWriting.prompt": "Schreibe bitte einen Satz auf {language} mit diesem Wort:",
    "aiWriting.reference": "Referenzbeispiel (deine Sprache, optional)",
    "aiWriting.placeholder": "Schreibe deinen Satz",
    "aiWriting.feedback": "KI-Feedback",
    "aiWriting.offlineFeedback": "Offline-Feedback",
    "aiWriting.explainInMyLanguage": "In meiner Sprache erklären",
    "aiWriting.explanation": "Erklärung",
    "aiWriting.exampleSentence": "Beispielsatz",
    "aiWriting.practiceSpeaking": "Diesen Satz sprechen üben",
    "aiSpeaking.title": "KI-Sprechen",
    "aiSpeaking.loading": "KI-Sprechübung wird geladen...",
    "aiSpeaking.speakSentence": "Sprich diesen Satz",
    "aiSpeaking.startRecording": "Aufnahme starten",
    "aiSpeaking.submitRecording": "Aufnahme senden",
    "aiSpeaking.transcriptPlaceholder": "Getipptes Transkript",
    "aiSpeaking.submitTranscript": "Transkript senden",
    "aiSpeaking.playCorrect": "Richtigen Satz abspielen",
    "card.details": "Wortdetails",
    "card.notFound": "Karte nicht gefunden.",
    "card.learningWord": "Lernwort",
    "card.nativeMeaning": "Bedeutung in deiner Sprache",
    "card.category": "Kategorie",
    "card.examples": "Beispiele",
    "card.meaning": "Bedeutung",
    "card.sourceExample": "Ausgangsbeispiel",
    "card.targetExample": "Zielbeispiel",
    "card.practiceWriting": "Schreiben üben",
    "card.practiceSpeaking": "Sprechen üben",
    "card.regularPractice": "Normale Übung",
    "card.playPronunciation": "Aussprache abspielen",
    "flashcard.playPronunciation": "Aussprache abspielen",
    "flashcard.revealAnswer": "Antwort aufdecken",
    "result.exampleSentence": "Beispielsatz"
  },
  "pt-BR": {} as Dictionary,
  it: {} as Dictionary,
  es: {} as Dictionary,
  fr: {} as Dictionary
};

dictionaries["pt-BR"] = {
  ...dictionaries.en,
  "common.loading": "Carregando...",
  "common.back": "Voltar",
  "common.next": "Próximo",
  "common.save": "Salvar",
  "common.saved": "Salvo",
  "common.pass": "Pular",
  "common.check": "Verificar",
  "common.stop": "Parar",
  "common.listen": "Ouvir",
  "common.tryAgain": "Tentar de novo",
  "common.practice": "Praticar",
  "common.settings": "Ajustes",
  "common.stats": "Estatísticas",
  "common.learn": "Aprender",
  "common.wordList": "Lista de palavras",
  "common.practiceHub": "Central de prática",
  "common.aiWriting": "Escrita com IA",
  "common.aiSpeaking": "Fala com IA",
  "home.startPractice": "Começar prática",
  "settings.title": "Configurações de idioma",
  "settings.subtitle": "Atualize seu idioma nativo e o idioma de estudo.",
  "settings.nativeLanguage": "Idioma nativo",
  "settings.learningLanguage": "Idioma de estudo",
  "settings.learningLevel": "Nível",
  "settings.appearance": "Aparência",
  "settings.system": "Sistema",
  "settings.light": "Claro",
  "settings.dark": "Escuro",
  "settings.savedMessage": "Configurações atualizadas.",
  "onboarding.welcome": "Boas-vindas",
  "onboarding.iSpeak": "Eu falo",
  "onboarding.iWantToLearn": "Quero aprender",
  "onboarding.myLevel": "Meu nível",
  "onboarding.sourceSubtitle": "Escolha seu idioma original.",
  "onboarding.targetSubtitle": "Escolha o idioma que quer aprender.",
  "onboarding.levelSubtitle": "Escolha um nível disponível.",
  "onboarding.startLearning": "Começar",
  "practice.loadingCards": "Carregando cartões de prática...",
  "practice.noCards": "SEM CARTÕES",
  "practice.noCardsBody": "Ainda não há cartões nesta lista de prática.",
  "practice.remainingCompleted": "Restantes: {remaining} | Concluídos: {completed} / {total}",
  "practice.selectLevel": "Selecionar nível",
  "practice.translate": "TRADUZIR",
  "practice.answer": "RESPOSTA",
  "practice.typeAnswer": "Digite a resposta no idioma de estudo",
  "practice.reveal": "Revelar",
  "practice.gradeInfo": "Again e Hard repetem nesta sessão. Good e Easy viram palavras conhecidas.",
  "practice.writingPractice": "Prática de escrita",
  "practice.speakingPractice": "Prática de fala",
  "learn.chooseCategory": "Escolha uma categoria",
  "learn.openList": "Abrir lista",
  "learn.leftKnown": "{left} restantes · {known} conhecidas",
  "wordList.practiceThisList": "Praticar esta lista",
  "wordList.practiceSentences": "Praticar frases",
  "wordList.counts": "{left} restantes · {known} conhecidas · {total} total",
  "wordList.knownHelper": "Cartões Good e Easy contam como conhecidos.",
  "practiceHub.title": "Prática",
  "practiceHub.subtitle": "Escolha um exercício focado.",
  "practiceHub.discoveryTitle": "Modo descoberta",
  "practiceHub.discoveryDescription": "Reproduz automaticamente palavras novas e exemplos.",
  "practiceHub.flashcardsTitle": "Praticar palavras conhecidas",
  "practiceHub.flashcardsDescription": "Revise cartões com repetição espaçada.",
  "practiceHub.writingTitle": "Praticar escrita com IA",
  "practiceHub.writingDescription": "Escreva sua própria frase e receba feedback.",
  "practiceHub.speakingTitle": "Praticar fala com IA",
  "practiceHub.speakingDescription": "Fale uma frase e revise a transcrição.",
  "sentence.title": "Prática de frases",
  "sentence.loading": "Carregando prática de frases...",
  "sentence.noKnownTitle": "Ainda não há frases conhecidas",
  "sentence.noKnownBody": "Marque cartões como Good ou Easy primeiro. A prática de frases usa apenas palavras conhecidas.",
  "sentence.practiceCards": "Praticar cartões",
  "sentence.knownRemaining": "Palavras conhecidas {mode} · Restantes: {remaining}",
  "sentence.chooseMissing": "Escolha a palavra que falta",
  "sentence.fillBlank": "Preencha a lacuna",
  "sentence.typeMissing": "Digite a palavra que falta",
  "sentence.nativeTranslation": "Tradução: {text}",
  "sentence.correctAnswer": "Resposta correta: {answer}",
  "stats.cardsToday": "Cartões praticados hoje",
  "stats.knownCards": "Cartões conhecidos",
  "stats.knownHelper": "Toque para praticar palavras conhecidas",
  "stats.byGrade": "Por avaliação",
  "stats.gradeHelper": "Toque em um grupo para praticar esses cartões novamente",
  "stats.weakCards": "Cartões fracos",
  "stats.weakHelper": "Toque para praticar cartões fracos",
  "aiWriting.title": "Prática de escrita",
  "aiWriting.loading": "Carregando prática de escrita com IA...",
  "aiWriting.noKnown": "Marque alguns cartões como Good ou Easy primeiro. A prática de escrita com IA usa apenas palavras conhecidas.",
  "aiWriting.prompt": "Escreva uma frase em {language} com a palavra dada:",
  "aiWriting.reference": "Exemplo de referência (seu idioma, opcional)",
  "aiWriting.placeholder": "Escreva sua frase",
  "aiWriting.feedback": "Feedback da IA",
  "aiWriting.offlineFeedback": "Feedback offline",
  "aiWriting.explainInMyLanguage": "Explicar no meu idioma",
  "aiWriting.explanation": "Explicação",
  "aiWriting.exampleSentence": "Frase de exemplo",
  "aiWriting.practiceSpeaking": "Praticar esta frase falando",
  "aiSpeaking.title": "Fala com IA",
  "aiSpeaking.loading": "Carregando prática de fala com IA...",
  "aiSpeaking.speakSentence": "Fale esta frase",
  "aiSpeaking.startRecording": "Iniciar gravação",
  "aiSpeaking.submitRecording": "Enviar gravação",
  "aiSpeaking.transcriptPlaceholder": "Transcrição digitada",
  "aiSpeaking.submitTranscript": "Enviar transcrição",
  "aiSpeaking.playCorrect": "Ouvir frase correta",
  "discovery.title": "Descoberta",
  "discovery.loading": "Carregando cartões de descoberta...",
  "discovery.cardProgress": "Cartão {current} / {total}",
  "discovery.learnerLanguage": "Idioma de estudo",
  "discovery.nativeTranslation": "Tradução",
  "discovery.playing": "Reproduzindo...",
  "discovery.playSequence": "Reproduzir sequência",
  "discovery.pauseAutoplay": "Pausar reprodução automática",
  "discovery.resumeAutoplay": "Retomar reprodução automática",
  "discovery.nextCard": "Próximo cartão",
  "card.details": "Detalhes da palavra",
  "card.notFound": "Cartão não encontrado.",
  "card.learningWord": "Palavra de estudo",
  "card.nativeMeaning": "Significado no seu idioma",
  "card.category": "Categoria",
  "card.examples": "Exemplos",
  "card.meaning": "Significado",
  "card.sourceExample": "Exemplo no idioma original",
  "card.targetExample": "Exemplo no idioma de estudo",
  "card.practiceWriting": "Praticar escrita",
  "card.practiceSpeaking": "Praticar fala",
  "card.regularPractice": "Prática normal",
  "card.playPronunciation": "Ouvir pronúncia",
  "flashcard.playPronunciation": "Ouvir pronúncia",
  "flashcard.revealAnswer": "Revelar resposta",
  "result.exampleSentence": "Frase de exemplo",
  "home.subtitle": "Pratique palavras e depois use-as em frases."
};
dictionaries.it = {
  ...dictionaries.en,
  "common.loading": "Caricamento...",
  "common.back": "Indietro",
  "common.next": "Avanti",
  "common.save": "Salva",
  "common.saved": "Salvato",
  "common.pass": "Salta",
  "common.check": "Controlla",
  "common.stop": "Stop",
  "common.listen": "Ascolta",
  "common.tryAgain": "Riprova",
  "common.practice": "Pratica",
  "common.settings": "Impostazioni",
  "common.stats": "Statistiche",
  "common.learn": "Impara",
  "common.wordList": "Lista parole",
  "common.practiceHub": "Centro pratica",
  "common.aiWriting": "Scrittura AI",
  "common.aiSpeaking": "Parlato AI",
  "home.startPractice": "Inizia pratica",
  "settings.title": "Impostazioni lingua",
  "settings.subtitle": "Aggiorna la tua lingua madre e la lingua di studio.",
  "settings.nativeLanguage": "Lingua madre",
  "settings.learningLanguage": "Lingua di studio",
  "settings.learningLevel": "Livello",
  "settings.appearance": "Aspetto",
  "settings.system": "Sistema",
  "settings.light": "Chiaro",
  "settings.dark": "Scuro",
  "settings.savedMessage": "Impostazioni aggiornate.",
  "onboarding.welcome": "Benvenuto",
  "onboarding.iSpeak": "Parlo",
  "onboarding.iWantToLearn": "Voglio imparare",
  "onboarding.myLevel": "Il mio livello",
  "onboarding.sourceSubtitle": "Scegli la tua lingua originale.",
  "onboarding.targetSubtitle": "Scegli la lingua da imparare.",
  "onboarding.levelSubtitle": "Scegli un livello disponibile.",
  "onboarding.startLearning": "Inizia",
  "learn.chooseCategory": "Scegli una categoria",
  "learn.openList": "Apri lista",
  "learn.leftKnown": "{left} rimaste · {known} conosciute",
  "wordList.practiceThisList": "Pratica questa lista",
  "wordList.practiceSentences": "Pratica frasi",
  "wordList.counts": "{left} rimaste · {known} conosciute · {total} totale",
  "wordList.knownHelper": "Le carte Good e Easy contano come conosciute.",
  "practice.loadingCards": "Caricamento carte di pratica...",
  "practice.noCards": "NESSUNA CARTA",
  "practice.noCardsBody": "Non ci sono ancora carte in questa lista.",
  "practice.remainingCompleted": "Rimaste: {remaining} | Completate: {completed} / {total}",
  "practice.selectLevel": "Seleziona livello",
  "practice.translate": "TRADUCI",
  "practice.answer": "RISPOSTA",
  "practice.typeAnswer": "Scrivi la risposta nella lingua di studio",
  "practice.reveal": "Mostra",
  "practice.gradeInfo": "Again e Hard tornano in questa sessione. Good e Easy diventano parole conosciute.",
  "practice.writingPractice": "Pratica scrittura",
  "practice.speakingPractice": "Pratica parlato",
  "practiceHub.title": "Pratica",
  "practiceHub.subtitle": "Scegli un esercizio mirato.",
  "practiceHub.discoveryTitle": "Modalità scoperta",
  "practiceHub.discoveryDescription": "Riproduci automaticamente parole nuove ed esempi.",
  "practiceHub.flashcardsTitle": "Pratica parole conosciute",
  "practiceHub.flashcardsDescription": "Ripassa le carte con ripetizione.",
  "practiceHub.writingTitle": "Pratica scrittura con AI",
  "practiceHub.writingDescription": "Scrivi una frase e ricevi feedback.",
  "practiceHub.speakingTitle": "Pratica parlato con AI",
  "practiceHub.speakingDescription": "Pronuncia una frase e controlla la trascrizione.",
  "sentence.title": "Pratica frasi",
  "sentence.loading": "Caricamento pratica frasi...",
  "sentence.noKnownTitle": "Ancora nessuna frase conosciuta",
  "sentence.noKnownBody": "Segna prima alcune carte come Good o Easy. La pratica frasi usa solo parole conosciute.",
  "sentence.practiceCards": "Pratica carte",
  "sentence.knownRemaining": "Parole conosciute {mode} · Rimaste: {remaining}",
  "sentence.chooseMissing": "Scegli la parola mancante",
  "sentence.fillBlank": "Completa lo spazio",
  "sentence.typeMissing": "Scrivi la parola mancante",
  "sentence.nativeTranslation": "Traduzione: {text}",
  "sentence.correctAnswer": "Risposta corretta: {answer}",
  "stats.cardsToday": "Carte praticate oggi",
  "stats.knownCards": "Carte conosciute",
  "stats.knownHelper": "Tocca per praticare parole conosciute",
  "stats.byGrade": "Per valutazione",
  "stats.gradeHelper": "Tocca un gruppo per praticare di nuovo quelle carte",
  "stats.weakCards": "Carte deboli",
  "stats.weakHelper": "Tocca per praticare carte deboli",
  "aiWriting.title": "Pratica di scrittura",
  "aiWriting.loading": "Caricamento pratica scrittura AI...",
  "aiWriting.noKnown": "Segna prima alcune carte come Good o Easy. La scrittura AI usa solo parole conosciute.",
  "aiWriting.prompt": "Componi una frase in {language} con la parola data:",
  "aiWriting.reference": "Esempio di riferimento (la tua lingua, opzionale)",
  "aiWriting.placeholder": "Scrivi la tua frase",
  "aiWriting.feedback": "Feedback AI",
  "aiWriting.offlineFeedback": "Feedback offline",
  "aiWriting.explainInMyLanguage": "Spiega nella mia lingua",
  "aiWriting.explanation": "Spiegazione",
  "aiWriting.exampleSentence": "Frase di esempio",
  "aiWriting.practiceSpeaking": "Pratica questa frase parlando",
  "aiSpeaking.title": "Parlato AI",
  "aiSpeaking.loading": "Caricamento pratica parlato AI...",
  "aiSpeaking.speakSentence": "Pronuncia questa frase",
  "aiSpeaking.startRecording": "Avvia registrazione",
  "aiSpeaking.submitRecording": "Invia registrazione",
  "aiSpeaking.transcriptPlaceholder": "Trascrizione digitata",
  "aiSpeaking.submitTranscript": "Invia trascrizione",
  "aiSpeaking.playCorrect": "Riproduci frase corretta",
  "discovery.title": "Scoperta",
  "discovery.loading": "Caricamento carte scoperta...",
  "discovery.cardProgress": "Carta {current} / {total}",
  "discovery.learnerLanguage": "Lingua di studio",
  "discovery.nativeTranslation": "Traduzione",
  "discovery.playing": "Riproduzione...",
  "discovery.playSequence": "Riproduci sequenza",
  "discovery.pauseAutoplay": "Pausa autoplay",
  "discovery.resumeAutoplay": "Riprendi autoplay",
  "discovery.nextCard": "Carta successiva",
  "card.details": "Dettagli parola",
  "card.notFound": "Carta non trovata.",
  "card.learningWord": "Parola da imparare",
  "card.nativeMeaning": "Significato nella tua lingua",
  "card.category": "Categoria",
  "card.examples": "Esempi",
  "card.meaning": "Significato",
  "card.sourceExample": "Esempio nella lingua originale",
  "card.targetExample": "Esempio nella lingua di studio",
  "card.practiceWriting": "Pratica scrittura",
  "card.practiceSpeaking": "Pratica parlato",
  "card.regularPractice": "Pratica normale",
  "card.playPronunciation": "Riproduci pronuncia",
  "flashcard.playPronunciation": "Riproduci pronuncia",
  "flashcard.revealAnswer": "Mostra risposta",
  "result.exampleSentence": "Frase di esempio",
  "home.subtitle": "Pratica le parole, poi usale nelle frasi."
};
dictionaries.es = {
  ...dictionaries.en,
  "common.loading": "Cargando...",
  "common.back": "Atrás",
  "common.next": "Siguiente",
  "common.save": "Guardar",
  "common.saved": "Guardado",
  "common.pass": "Saltar",
  "common.check": "Comprobar",
  "common.stop": "Parar",
  "common.listen": "Escuchar",
  "common.tryAgain": "Intentar de nuevo",
  "common.practice": "Practicar",
  "common.settings": "Ajustes",
  "common.stats": "Estadísticas",
  "common.learn": "Aprender",
  "common.wordList": "Lista de palabras",
  "common.practiceHub": "Centro de práctica",
  "common.aiWriting": "Escritura con IA",
  "common.aiSpeaking": "Habla con IA",
  "home.subtitle": "Practica palabras y luego úsalas en frases.",
  "home.startPractice": "Empezar práctica",
  "learn.chooseCategory": "Elige una categoría",
  "learn.openList": "Abrir lista",
  "learn.leftKnown": "{left} restantes · {known} conocidas",
  "wordList.practiceThisList": "Practicar esta lista",
  "wordList.practiceSentences": "Practicar frases",
  "wordList.counts": "{left} restantes · {known} conocidas · {total} total",
  "wordList.knownHelper": "Las tarjetas Good y Easy cuentan como conocidas.",
  "settings.title": "Configuración de idioma",
  "settings.subtitle": "Actualiza tu idioma nativo y el idioma que estudias.",
  "settings.nativeLanguage": "Idioma nativo",
  "settings.learningLanguage": "Idioma de estudio",
  "settings.learningLevel": "Nivel",
  "settings.appearance": "Apariencia",
  "settings.system": "Sistema",
  "settings.light": "Claro",
  "settings.dark": "Oscuro",
  "settings.savedMessage": "Configuración actualizada.",
  "onboarding.welcome": "Bienvenido",
  "onboarding.iSpeak": "Hablo",
  "onboarding.iWantToLearn": "Quiero aprender",
  "onboarding.myLevel": "Mi nivel",
  "onboarding.sourceSubtitle": "Elige tu idioma original.",
  "onboarding.targetSubtitle": "Elige el idioma que quieres aprender.",
  "onboarding.levelSubtitle": "Elige un nivel disponible.",
  "onboarding.startLearning": "Empezar",
  "practice.loadingCards": "Cargando tarjetas de práctica...",
  "practice.noCards": "SIN TARJETAS",
  "practice.noCardsBody": "Todavía no hay tarjetas en esta lista de práctica.",
  "practice.remainingCompleted": "Restantes: {remaining} | Completadas: {completed} / {total}",
  "practice.selectLevel": "Seleccionar nivel",
  "practice.translate": "TRADUCIR",
  "practice.answer": "RESPUESTA",
  "practice.typeAnswer": "Escribe la respuesta en el idioma de estudio",
  "practice.reveal": "Mostrar",
  "practice.gradeInfo": "Again y Hard se repiten en esta sesión. Good y Easy pasan a palabras conocidas.",
  "practice.writingPractice": "Práctica de escritura",
  "practice.speakingPractice": "Práctica oral",
  "practiceHub.title": "Práctica",
  "practiceHub.subtitle": "Elige un ejercicio enfocado.",
  "practiceHub.discoveryTitle": "Modo descubrimiento",
  "practiceHub.discoveryDescription": "Reproduce automáticamente palabras nuevas y ejemplos.",
  "practiceHub.flashcardsTitle": "Practicar palabras conocidas",
  "practiceHub.flashcardsDescription": "Repasa tarjetas con repetición espaciada.",
  "practiceHub.writingTitle": "Practicar escritura con IA",
  "practiceHub.writingDescription": "Escribe tu propia frase y recibe comentarios.",
  "practiceHub.speakingTitle": "Practicar habla con IA",
  "practiceHub.speakingDescription": "Di una frase y revisa la transcripción.",
  "sentence.title": "Práctica de frases",
  "sentence.loading": "Cargando práctica de frases...",
  "sentence.noKnownTitle": "Aún no hay frases conocidas",
  "sentence.noKnownBody": "Marca primero algunas tarjetas como Good o Easy. La práctica de frases usa solo palabras conocidas.",
  "sentence.practiceCards": "Practicar tarjetas",
  "sentence.knownRemaining": "Palabras conocidas {mode} · Restantes: {remaining}",
  "sentence.chooseMissing": "Elige la palabra que falta",
  "sentence.fillBlank": "Rellena el espacio",
  "sentence.typeMissing": "Escribe la palabra que falta",
  "sentence.nativeTranslation": "Traducción: {text}",
  "sentence.correctAnswer": "Respuesta correcta: {answer}",
  "stats.cardsToday": "Tarjetas practicadas hoy",
  "stats.knownCards": "Tarjetas conocidas",
  "stats.knownHelper": "Toca para practicar palabras conocidas",
  "stats.byGrade": "Por valoración",
  "stats.gradeHelper": "Toca un grupo para practicar esas tarjetas otra vez",
  "stats.weakCards": "Tarjetas débiles",
  "stats.weakHelper": "Toca para practicar tarjetas débiles",
  "discovery.title": "Descubrimiento",
  "discovery.loading": "Cargando tarjetas de descubrimiento...",
  "discovery.cardProgress": "Tarjeta {current} / {total}",
  "discovery.learnerLanguage": "Idioma de estudio",
  "discovery.nativeTranslation": "Traducción",
  "discovery.playing": "Reproduciendo...",
  "discovery.playSequence": "Reproducir secuencia",
  "discovery.pauseAutoplay": "Pausar reproducción automática",
  "discovery.resumeAutoplay": "Reanudar reproducción automática",
  "discovery.nextCard": "Siguiente tarjeta",
  "aiWriting.title": "Práctica de escritura",
  "aiWriting.loading": "Cargando práctica de escritura con IA...",
  "aiWriting.noKnown": "Marca primero algunas tarjetas como Good o Easy. La escritura con IA usa solo palabras conocidas.",
  "aiWriting.prompt": "Escribe una frase en {language} con la palabra dada:",
  "aiWriting.reference": "Ejemplo de referencia (tu idioma, opcional)",
  "aiWriting.placeholder": "Escribe tu frase",
  "aiWriting.feedback": "Comentarios de IA",
  "aiWriting.offlineFeedback": "Comentarios sin conexión",
  "aiWriting.explainInMyLanguage": "Explicar en mi idioma",
  "aiWriting.explanation": "Explicación",
  "aiWriting.exampleSentence": "Frase de ejemplo",
  "aiWriting.practiceSpeaking": "Practicar esta frase hablando",
  "aiSpeaking.title": "Habla con IA",
  "aiSpeaking.loading": "Cargando práctica oral con IA...",
  "aiSpeaking.speakSentence": "Di esta frase",
  "aiSpeaking.startRecording": "Iniciar grabación",
  "aiSpeaking.submitRecording": "Enviar grabación",
  "aiSpeaking.transcriptPlaceholder": "Transcripción",
  "aiSpeaking.submitTranscript": "Enviar transcripción",
  "aiSpeaking.playCorrect": "Reproducir frase correcta",
  "card.details": "Detalles de la palabra",
  "card.notFound": "Tarjeta no encontrada.",
  "card.learningWord": "Palabra de estudio",
  "card.nativeMeaning": "Significado en tu idioma",
  "card.category": "Categoría",
  "card.examples": "Ejemplos",
  "card.meaning": "Significado",
  "card.sourceExample": "Ejemplo en idioma original",
  "card.targetExample": "Ejemplo en idioma de estudio",
  "card.practiceWriting": "Practicar escritura",
  "card.practiceSpeaking": "Practicar habla",
  "card.regularPractice": "Práctica normal",
  "card.playPronunciation": "Reproducir pronunciación",
  "flashcard.playPronunciation": "Reproducir pronunciación",
  "flashcard.revealAnswer": "Mostrar respuesta",
  "result.exampleSentence": "Frase de ejemplo"
};
dictionaries.fr = {
  ...dictionaries.en,
  "common.loading": "Chargement...",
  "common.back": "Retour",
  "common.next": "Suivant",
  "common.save": "Enregistrer",
  "common.saved": "Enregistré",
  "common.pass": "Passer",
  "common.check": "Vérifier",
  "common.stop": "Stop",
  "common.listen": "Écouter",
  "common.tryAgain": "Réessayer",
  "common.practice": "Pratique",
  "common.settings": "Réglages",
  "common.stats": "Stats",
  "common.learn": "Apprendre",
  "common.wordList": "Liste de mots",
  "common.practiceHub": "Centre de pratique",
  "common.aiWriting": "Écriture IA",
  "common.aiSpeaking": "Oral IA",
  "home.startPractice": "Commencer",
  "settings.title": "Paramètres de langue",
  "settings.subtitle": "Mets à jour ta langue native et ta langue d’apprentissage.",
  "settings.nativeLanguage": "Langue native",
  "settings.learningLanguage": "Langue apprise",
  "settings.learningLevel": "Niveau",
  "settings.appearance": "Apparence",
  "settings.system": "Système",
  "settings.light": "Clair",
  "settings.dark": "Sombre",
  "settings.savedMessage": "Paramètres mis à jour.",
  "onboarding.welcome": "Bienvenue",
  "onboarding.iSpeak": "Je parle",
  "onboarding.iWantToLearn": "Je veux apprendre",
  "onboarding.myLevel": "Mon niveau",
  "onboarding.sourceSubtitle": "Choisis ta langue d’origine.",
  "onboarding.targetSubtitle": "Choisis la langue à apprendre.",
  "onboarding.levelSubtitle": "Choisis un niveau disponible.",
  "onboarding.startLearning": "Commencer",
  "learn.chooseCategory": "Choisis une catégorie",
  "learn.openList": "Ouvrir la liste",
  "learn.leftKnown": "{left} restantes · {known} connues",
  "wordList.practiceThisList": "Pratiquer cette liste",
  "wordList.practiceSentences": "Pratiquer les phrases",
  "wordList.counts": "{left} restantes · {known} connues · {total} total",
  "wordList.knownHelper": "Les cartes Good et Easy comptent comme connues.",
  "practice.loadingCards": "Chargement des cartes...",
  "practice.noCards": "AUCUNE CARTE",
  "practice.noCardsBody": "Il n’y a pas encore de cartes dans cette liste.",
  "practice.remainingCompleted": "Restantes : {remaining} | Terminées : {completed} / {total}",
  "practice.selectLevel": "Choisir le niveau",
  "practice.translate": "TRADUIRE",
  "practice.answer": "RÉPONSE",
  "practice.typeAnswer": "Tape la réponse dans la langue apprise",
  "practice.reveal": "Révéler",
  "practice.gradeInfo": "Again et Hard reviennent dans cette session. Good et Easy deviennent connues.",
  "practice.writingPractice": "Pratique d’écriture",
  "practice.speakingPractice": "Pratique orale",
  "practiceHub.title": "Pratique",
  "practiceHub.subtitle": "Choisis un exercice ciblé.",
  "practiceHub.discoveryTitle": "Mode découverte",
  "practiceHub.discoveryDescription": "Lecture automatique des nouveaux mots et exemples.",
  "practiceHub.flashcardsTitle": "Pratiquer les mots connus",
  "practiceHub.flashcardsDescription": "Réviser les cartes avec répétition.",
  "practiceHub.writingTitle": "Pratique d’écriture avec IA",
  "practiceHub.writingDescription": "Écris ta phrase et reçois un retour.",
  "practiceHub.speakingTitle": "Pratique orale avec IA",
  "practiceHub.speakingDescription": "Dis une phrase et vérifie la transcription.",
  "sentence.title": "Pratique de phrases",
  "sentence.loading": "Chargement de la pratique de phrases...",
  "sentence.noKnownTitle": "Aucune phrase connue pour l’instant",
  "sentence.noKnownBody": "Marque d’abord des cartes comme Good ou Easy. Les phrases utilisent seulement les mots connus.",
  "sentence.practiceCards": "Pratiquer les cartes",
  "sentence.knownRemaining": "Mots connus {mode} · Restantes : {remaining}",
  "sentence.chooseMissing": "Choisis le mot manquant",
  "sentence.fillBlank": "Complète le blanc",
  "sentence.typeMissing": "Tape le mot manquant",
  "sentence.nativeTranslation": "Traduction : {text}",
  "sentence.correctAnswer": "Bonne réponse : {answer}",
  "stats.cardsToday": "Cartes pratiquées aujourd’hui",
  "stats.knownCards": "Cartes connues",
  "stats.knownHelper": "Appuie pour pratiquer les mots connus",
  "stats.byGrade": "Par note",
  "stats.gradeHelper": "Appuie sur un groupe pour pratiquer ces cartes à nouveau",
  "stats.weakCards": "Cartes faibles",
  "stats.weakHelper": "Appuie pour pratiquer les cartes faibles",
  "aiWriting.title": "Pratique d’écriture",
  "aiWriting.loading": "Chargement de l’écriture IA...",
  "aiWriting.noKnown": "Marque d’abord quelques cartes comme Good ou Easy. L’écriture IA utilise seulement les mots connus.",
  "aiWriting.prompt": "Écris une phrase en {language} avec le mot donné :",
  "aiWriting.reference": "Exemple de référence (ta langue, facultatif)",
  "aiWriting.placeholder": "Écris ta phrase",
  "aiWriting.feedback": "Retour IA",
  "aiWriting.offlineFeedback": "Retour hors ligne",
  "aiWriting.explainInMyLanguage": "Expliquer dans ma langue",
  "aiWriting.explanation": "Explication",
  "aiWriting.exampleSentence": "Phrase exemple",
  "aiWriting.practiceSpeaking": "Pratiquer cette phrase à l’oral",
  "aiSpeaking.title": "Oral IA",
  "aiSpeaking.loading": "Chargement de la pratique orale IA...",
  "aiSpeaking.speakSentence": "Dis cette phrase",
  "aiSpeaking.startRecording": "Démarrer l’enregistrement",
  "aiSpeaking.submitRecording": "Envoyer l’enregistrement",
  "aiSpeaking.transcriptPlaceholder": "Transcription tapée",
  "aiSpeaking.submitTranscript": "Envoyer la transcription",
  "aiSpeaking.playCorrect": "Lire la phrase correcte",
  "discovery.title": "Découverte",
  "discovery.loading": "Chargement des cartes de découverte...",
  "discovery.cardProgress": "Carte {current} / {total}",
  "discovery.learnerLanguage": "Langue apprise",
  "discovery.nativeTranslation": "Traduction",
  "discovery.playing": "Lecture...",
  "discovery.playSequence": "Lire la séquence",
  "discovery.pauseAutoplay": "Mettre l’autoplay en pause",
  "discovery.resumeAutoplay": "Reprendre l’autoplay",
  "discovery.nextCard": "Carte suivante",
  "card.details": "Détails du mot",
  "card.notFound": "Carte introuvable.",
  "card.learningWord": "Mot à apprendre",
  "card.nativeMeaning": "Sens dans votre langue",
  "card.category": "Catégorie",
  "card.examples": "Exemples",
  "card.meaning": "Sens",
  "card.sourceExample": "Exemple dans la langue d’origine",
  "card.targetExample": "Exemple dans la langue apprise",
  "card.practiceWriting": "Pratique d’écriture",
  "card.practiceSpeaking": "Pratique orale",
  "card.regularPractice": "Pratique normale",
  "card.playPronunciation": "Lire la prononciation",
  "flashcard.playPronunciation": "Lire la prononciation",
  "flashcard.revealAnswer": "Révéler la réponse",
  "result.exampleSentence": "Phrase exemple",
  "home.subtitle": "Pratique des mots, puis utilise-les dans des phrases."
};

const I18nContext = createContext<I18nContextValue | null>(null);

const languageNames: Record<DictionaryLanguage, Record<LanguageCode, string>> = {
  en: { en: "English", de: "German", "pt-BR": "Portuguese (Brazil)", it: "Italian", es: "Spanish", fr: "French" },
  de: { en: "Englisch", de: "Deutsch", "pt-BR": "Portugiesisch (Brasilien)", it: "Italienisch", es: "Spanisch", fr: "Französisch" },
  "pt-BR": { en: "Inglês", de: "Alemão", "pt-BR": "Português (Brasil)", it: "Italiano", es: "Espanhol", fr: "Francês" },
  it: { en: "Inglese", de: "Tedesco", "pt-BR": "Portoghese (Brasile)", it: "Italiano", es: "Spagnolo", fr: "Francese" },
  es: { en: "Inglés", de: "Alemán", "pt-BR": "Portugués (Brasil)", it: "Italiano", es: "Español", fr: "Francés" },
  fr: { en: "Anglais", de: "Allemand", "pt-BR": "Portugais (Brésil)", it: "Italien", es: "Espagnol", fr: "Français" }
};

const gradeNames: Record<DictionaryLanguage, Record<DifficultyGrade, string>> = {
  en: { again: "Again", hard: "Hard", good: "Good", easy: "Easy" },
  de: { again: "Nochmal", hard: "Schwer", good: "Gut", easy: "Einfach" },
  "pt-BR": { again: "De novo", hard: "Difícil", good: "Bom", easy: "Fácil" },
  it: { again: "Di nuovo", hard: "Difficile", good: "Bene", easy: "Facile" },
  es: { again: "De nuevo", hard: "Difícil", good: "Bien", easy: "Fácil" },
  fr: { again: "Encore", hard: "Difficile", good: "Bien", easy: "Facile" }
};

const categoryNames: Record<string, Record<DictionaryLanguage, string>> = {
  ability: { en: "Ability", de: "Fähigkeit", "pt-BR": "Habilidade", it: "Abilità", es: "Habilidad", fr: "Capacité" },
  abstract: { en: "Abstract", de: "Abstrakt", "pt-BR": "Abstrato", it: "Astratto", es: "Abstracto", fr: "Abstrait" },
  action: { en: "Action", de: "Handlung", "pt-BR": "Ação", it: "Azione", es: "Acción", fr: "Action" },
  actions: { en: "Actions", de: "Handlungen", "pt-BR": "Ações", it: "Azioni", es: "Acciones", fr: "Actions" },
  activities: { en: "Activities", de: "Aktivitäten", "pt-BR": "Atividades", it: "Attività", es: "Actividades", fr: "Activités" },
  adjectives: { en: "Adjectives", de: "Adjektive", "pt-BR": "Adjetivos", it: "Aggettivi", es: "Adjetivos", fr: "Adjectifs" },
  adverbs: { en: "Adverbs", de: "Adverbien", "pt-BR": "Advérbios", it: "Avverbi", es: "Adverbios", fr: "Adverbes" },
  animals: { en: "Animals", de: "Tiere", "pt-BR": "Animais", it: "Animali", es: "Animales", fr: "Animaux" },
  appearance: { en: "Appearance", de: "Aussehen", "pt-BR": "Aparência", it: "Aspetto", es: "Apariencia", fr: "Apparence" },
  art: { en: "Art", de: "Kunst", "pt-BR": "Arte", it: "Arte", es: "Arte", fr: "Art" },
  basic: { en: "Basic", de: "Grundlagen", "pt-BR": "Básico", it: "Base", es: "Básico", fr: "Base" },
  body: { en: "Body", de: "Körper", "pt-BR": "Corpo", it: "Corpo", es: "Cuerpo", fr: "Corps" },
  business: { en: "Business", de: "Geschäft", "pt-BR": "Negócios", it: "Affari", es: "Negocios", fr: "Affaires" },
  clothing: { en: "Clothing", de: "Kleidung", "pt-BR": "Roupas", it: "Abbigliamento", es: "Ropa", fr: "Vêtements" },
  colors: { en: "Colors", de: "Farben", "pt-BR": "Cores", it: "Colori", es: "Colores", fr: "Couleurs" },
  communication: { en: "Communication", de: "Kommunikation", "pt-BR": "Comunicação", it: "Comunicazione", es: "Comunicación", fr: "Communication" },
  comparisons: { en: "Comparisons", de: "Vergleiche", "pt-BR": "Comparações", it: "Confronti", es: "Comparaciones", fr: "Comparaisons" },
  condition: { en: "Condition", de: "Zustand", "pt-BR": "Condição", it: "Condizione", es: "Condición", fr: "Condition" },
  conjunctions: { en: "Conjunctions", de: "Konjunktionen", "pt-BR": "Conjunções", it: "Congiunzioni", es: "Conjunciones", fr: "Conjonctions" },
  culture: { en: "Culture", de: "Kultur", "pt-BR": "Cultura", it: "Cultura", es: "Cultura", fr: "Culture" },
  "daily life": { en: "Daily life", de: "Alltag", "pt-BR": "Vida diária", it: "Vita quotidiana", es: "Vida diaria", fr: "Vie quotidienne" },
  descriptions: { en: "Descriptions", de: "Beschreibungen", "pt-BR": "Descrições", it: "Descrizioni", es: "Descripciones", fr: "Descriptions" },
  descriptive: { en: "Descriptive", de: "Beschreibend", "pt-BR": "Descritivo", it: "Descrittivo", es: "Descriptivo", fr: "Descriptif" },
  determiners: { en: "Determiners", de: "Begleiter", "pt-BR": "Determinantes", it: "Determinanti", es: "Determinantes", fr: "Déterminants" },
  direction: { en: "Direction", de: "Richtung", "pt-BR": "Direção", it: "Direzione", es: "Dirección", fr: "Direction" },
  economics: { en: "Economics", de: "Wirtschaft", "pt-BR": "Economia", it: "Economia", es: "Economía", fr: "Économie" },
  education: { en: "Education", de: "Bildung", "pt-BR": "Educação", it: "Istruzione", es: "Educación", fr: "Éducation" },
  emotions: { en: "Emotions", de: "Emotionen", "pt-BR": "Emoções", it: "Emozioni", es: "Emociones", fr: "Émotions" },
  entertainment: { en: "Entertainment", de: "Unterhaltung", "pt-BR": "Entretenimento", it: "Intrattenimento", es: "Entretenimiento", fr: "Divertissement" },
  environment: { en: "Environment", de: "Umwelt", "pt-BR": "Meio ambiente", it: "Ambiente", es: "Medio ambiente", fr: "Environnement" },
  events: { en: "Events", de: "Ereignisse", "pt-BR": "Eventos", it: "Eventi", es: "Eventos", fr: "Événements" },
  everyday: { en: "Everyday", de: "Alltag", "pt-BR": "Cotidiano", it: "Quotidiano", es: "Cotidiano", fr: "Quotidien" },
  family: { en: "Family", de: "Familie", "pt-BR": "Família", it: "Famiglia", es: "Familia", fr: "Famille" },
  feelings: { en: "Feelings", de: "Gefühle", "pt-BR": "Sentimentos", it: "Sentimenti", es: "Sentimientos", fr: "Sentiments" },
  finance: { en: "Finance", de: "Finanzen", "pt-BR": "Finanças", it: "Finanza", es: "Finanzas", fr: "Finances" },
  food: { en: "Food", de: "Essen", "pt-BR": "Comida", it: "Cibo", es: "Comida", fr: "Nourriture" },
  "food and drink": { en: "Food and Drink", de: "Essen und Trinken", "pt-BR": "Comida e bebida", it: "Cibo e bevande", es: "Comida y bebida", fr: "Nourriture et boissons" },
  frequency: { en: "Frequency", de: "Häufigkeit", "pt-BR": "Frequência", it: "Frequenza", es: "Frecuencia", fr: "Fréquence" },
  furniture: { en: "Furniture", de: "Möbel", "pt-BR": "Móveis", it: "Mobili", es: "Muebles", fr: "Meubles" },
  games: { en: "Games", de: "Spiele", "pt-BR": "Jogos", it: "Giochi", es: "Juegos", fr: "Jeux" },
  general: { en: "General", de: "Allgemein", "pt-BR": "Geral", it: "Generale", es: "General", fr: "Général" },
  geography: { en: "Geography", de: "Geografie", "pt-BR": "Geografia", it: "Geografia", es: "Geografía", fr: "Géographie" },
  government: { en: "Government", de: "Regierung", "pt-BR": "Governo", it: "Governo", es: "Gobierno", fr: "Gouvernement" },
  grammar: { en: "Grammar", de: "Grammatik", "pt-BR": "Gramática", it: "Grammatica", es: "Gramática", fr: "Grammaire" },
  health: { en: "Health", de: "Gesundheit", "pt-BR": "Saúde", it: "Salute", es: "Salud", fr: "Santé" },
  hobbies: { en: "Hobbies", de: "Hobbys", "pt-BR": "Hobbies", it: "Hobby", es: "Pasatiempos", fr: "Loisirs" },
  home: { en: "Home", de: "Zuhause", "pt-BR": "Casa", it: "Casa", es: "Casa", fr: "Maison" },
  information: { en: "Information", de: "Information", "pt-BR": "Informação", it: "Informazione", es: "Información", fr: "Information" },
  jobs: { en: "Jobs", de: "Berufe", "pt-BR": "Trabalhos", it: "Lavori", es: "Trabajos", fr: "Emplois" },
  language: { en: "Language", de: "Sprache", "pt-BR": "Idioma", it: "Lingua", es: "Idioma", fr: "Langue" },
  law: { en: "Law", de: "Recht", "pt-BR": "Direito", it: "Diritto", es: "Derecho", fr: "Droit" },
  learning: { en: "Learning", de: "Lernen", "pt-BR": "Aprendizagem", it: "Apprendimento", es: "Aprendizaje", fr: "Apprentissage" },
  leisure: { en: "Leisure", de: "Freizeit", "pt-BR": "Lazer", it: "Tempo libero", es: "Ocio", fr: "Loisirs" },
  life: { en: "Life", de: "Leben", "pt-BR": "Vida", it: "Vita", es: "Vida", fr: "Vie" },
  location: { en: "Location", de: "Ort", "pt-BR": "Localização", it: "Posizione", es: "Ubicación", fr: "Lieu" },
  material: { en: "Material", de: "Material", "pt-BR": "Material", it: "Materiale", es: "Material", fr: "Matériau" },
  measurement: { en: "Measurement", de: "Messung", "pt-BR": "Medida", it: "Misura", es: "Medida", fr: "Mesure" },
  media: { en: "Media", de: "Medien", "pt-BR": "Mídia", it: "Media", es: "Medios", fr: "Médias" },
  money: { en: "Money", de: "Geld", "pt-BR": "Dinheiro", it: "Denaro", es: "Dinero", fr: "Argent" },
  movement: { en: "Movement", de: "Bewegung", "pt-BR": "Movimento", it: "Movimento", es: "Movimiento", fr: "Mouvement" },
  music: { en: "Music", de: "Musik", "pt-BR": "Música", it: "Musica", es: "Música", fr: "Musique" },
  nature: { en: "Nature", de: "Natur", "pt-BR": "Natureza", it: "Natura", es: "Naturaleza", fr: "Nature" },
  nouns: { en: "Nouns", de: "Substantive", "pt-BR": "Substantivos", it: "Sostantivi", es: "Sustantivos", fr: "Noms" },
  numbers: { en: "Numbers", de: "Zahlen", "pt-BR": "Números", it: "Numeri", es: "Números", fr: "Nombres" },
  objects: { en: "Objects", de: "Objekte", "pt-BR": "Objetos", it: "Oggetti", es: "Objetos", fr: "Objets" },
  opinions: { en: "Opinions", de: "Meinungen", "pt-BR": "Opiniões", it: "Opinioni", es: "Opiniones", fr: "Opinions" },
  other: { en: "Other", de: "Sonstiges", "pt-BR": "Outros", it: "Altro", es: "Otros", fr: "Autre" },
  people: { en: "People", de: "Menschen", "pt-BR": "Pessoas", it: "Persone", es: "Personas", fr: "Personnes" },
  personality: { en: "Personality", de: "Persönlichkeit", "pt-BR": "Personalidade", it: "Personalità", es: "Personalidad", fr: "Personnalité" },
  places: { en: "Places", de: "Orte", "pt-BR": "Lugares", it: "Luoghi", es: "Lugares", fr: "Lieux" },
  politics: { en: "Politics", de: "Politik", "pt-BR": "Política", it: "Politica", es: "Política", fr: "Politique" },
  prepositions: { en: "Prepositions", de: "Präpositionen", "pt-BR": "Preposições", it: "Preposizioni", es: "Preposiciones", fr: "Prépositions" },
  pronouns: { en: "Pronouns", de: "Pronomen", "pt-BR": "Pronomes", it: "Pronomi", es: "Pronombres", fr: "Pronoms" },
  quality: { en: "Quality", de: "Qualität", "pt-BR": "Qualidade", it: "Qualità", es: "Calidad", fr: "Qualité" },
  quantity: { en: "Quantity", de: "Menge", "pt-BR": "Quantidade", it: "Quantità", es: "Cantidad", fr: "Quantité" },
  relationships: { en: "Relationships", de: "Beziehungen", "pt-BR": "Relações", it: "Relazioni", es: "Relaciones", fr: "Relations" },
  religion: { en: "Religion", de: "Religion", "pt-BR": "Religião", it: "Religione", es: "Religión", fr: "Religion" },
  school: { en: "School", de: "Schule", "pt-BR": "Escola", it: "Scuola", es: "Escuela", fr: "École" },
  science: { en: "Science", de: "Wissenschaft", "pt-BR": "Ciência", it: "Scienza", es: "Ciencia", fr: "Science" },
  shopping: { en: "Shopping", de: "Einkaufen", "pt-BR": "Compras", it: "Shopping", es: "Compras", fr: "Shopping" },
  society: { en: "Society", de: "Gesellschaft", "pt-BR": "Sociedade", it: "Società", es: "Sociedad", fr: "Société" },
  sound: { en: "Sound", de: "Klang", "pt-BR": "Som", it: "Suono", es: "Sonido", fr: "Son" },
  sports: { en: "Sports", de: "Sport", "pt-BR": "Esportes", it: "Sport", es: "Deportes", fr: "Sports" },
  state: { en: "State", de: "Zustand", "pt-BR": "Estado", it: "Stato", es: "Estado", fr: "État" },
  technology: { en: "Technology", de: "Technologie", "pt-BR": "Tecnologia", it: "Tecnologia", es: "Tecnología", fr: "Technologie" },
  time: { en: "Time", de: "Zeit", "pt-BR": "Tempo", it: "Tempo", es: "Tiempo", fr: "Temps" },
  transport: { en: "Transport", de: "Transport", "pt-BR": "Transporte", it: "Trasporto", es: "Transporte", fr: "Transport" },
  travel: { en: "Travel", de: "Reisen", "pt-BR": "Viagem", it: "Viaggi", es: "Viajes", fr: "Voyage" },
  verbs: { en: "Verbs", de: "Verben", "pt-BR": "Verbos", it: "Verbi", es: "Verbos", fr: "Verbes" },
  weather: { en: "Weather", de: "Wetter", "pt-BR": "Clima", it: "Meteo", es: "Clima", fr: "Météo" },
  work: { en: "Work", de: "Arbeit", "pt-BR": "Trabalho", it: "Lavoro", es: "Trabajo", fr: "Travail" },
  writing: { en: "Writing", de: "Schreiben", "pt-BR": "Escrita", it: "Scrittura", es: "Escritura", fr: "Écriture" }
};

export function I18nProvider({ children }: { children: ReactNode }) {
  const [language, setLanguage] = useState<LanguageCode>(getDeviceLanguage());

  useEffect(() => {
    getSettings().then((settings) => {
      setLanguage(settings.hasCompletedOnboarding ? settings.sourceLanguage : getDeviceLanguage());
    });
  }, []);

  const value = useMemo<I18nContextValue>(
    () => ({
      language,
      setLanguage,
      categoryName: (category) => getCategoryName(language, category),
      gradeName: (grade) => getGradeName(language, grade),
      languageName: (code) => getLanguageName(language, code),
      t: (key, variables) => translate(language, key, variables)
    }),
    [language]
  );

  return createElement(I18nContext.Provider, { value }, children);
}

export function useI18n(): I18nContextValue {
  const context = useContext(I18nContext);
  if (!context) {
    return {
      language: "en",
      setLanguage: () => undefined,
      categoryName: (category) => getCategoryName("en", category),
      gradeName: (grade) => getGradeName("en", grade),
      languageName: (code) => getLanguageName("en", code),
      t: (key, variables) => translate("en", key, variables)
    };
  }
  return context;
}

function translate(language: LanguageCode, key: TranslationKey, variables: Variables = {}): string {
  const dictionary = getDictionary(language);
  const template = dictionary[key] ?? dictionaries.en[key] ?? key;
  return template.replace(/\{(\w+)\}/g, (_match, name) => String(variables[name] ?? ""));
}

function getLanguageName(uiLanguage: LanguageCode, language: LanguageCode): string {
  return (getDictionaryLanguage(uiLanguage) && languageNames[getDictionaryLanguage(uiLanguage)]?.[language]) || languageNames.en[language];
}

function getGradeName(uiLanguage: LanguageCode, grade: DifficultyGrade): string {
  const dictionaryLanguage = getDictionaryLanguage(uiLanguage);
  return gradeNames[dictionaryLanguage][grade] ?? gradeNames.en[grade];
}

function getCategoryName(uiLanguage: LanguageCode, category: string): string {
  const dictionaryLanguage = getDictionaryLanguage(uiLanguage);
  const normalized = normalizeCategoryName(category);
  return categoryNames[normalized]?.[dictionaryLanguage] ?? categoryNames[normalized]?.en ?? category;
}

function normalizeCategoryName(category: string): string {
  return category.replace(/&/g, "and").replace(/\s+/g, " ").trim().toLowerCase();
}

function getDictionary(language: LanguageCode): Dictionary {
  return dictionaries[getDictionaryLanguage(language)];
}

function getDictionaryLanguage(language: LanguageCode): DictionaryLanguage {
  if (language === "de" || language === "pt-BR" || language === "it" || language === "es" || language === "fr") return language;
  return "en";
}

export function getDeviceLanguage(): LanguageCode {
  const locale =
    Platform.OS === "ios"
      ? NativeModules.SettingsManager?.settings?.AppleLocale ||
        NativeModules.SettingsManager?.settings?.AppleLanguages?.[0]
      : NativeModules.I18nManager?.localeIdentifier ||
        NativeModules.PlatformConstants?.locale ||
        Intl.DateTimeFormat().resolvedOptions().locale;
  const normalized = String(locale || "en").replace("_", "-").toLowerCase();
  if (normalized.startsWith("de")) return "de";
  if (normalized.startsWith("pt")) return "pt-BR";
  if (normalized.startsWith("it")) return "it";
  if (normalized.startsWith("es")) return "es";
  if (normalized.startsWith("fr")) return "fr";
  return "en";
}
