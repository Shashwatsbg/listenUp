// News Sources Configuration
const newsSources = [
    { id: 'bbc', region: 'intl', name: 'BBC News', rss: 'http://feeds.bbci.co.uk/news/rss.xml' },
    { id: 'cnn', region: 'intl', name: 'CNN Top Stories', rss: 'http://rss.cnn.com/rss/cnn_topstories.rss' },
    { id: 'nyt', region: 'intl', name: 'New York Times', rss: 'https://rss.nytimes.com/services/xml/rss/nyt/HomePage.xml' },
    { id: 'bloomberg', region: 'intl', name: 'Bloomberg', rss: 'https://feeds.bloomberg.com/markets/news.rss' },
    { id: 'reuters', region: 'intl', name: 'Reuters', rss: 'https://www.reuters.com/rssFeed/topNews' },
    { id: 'fp', region: 'intl', name: 'Foreign Policy', rss: 'https://foreignpolicy.com/feed/' },
    { id: 'bs', region: 'india', name: 'Business Standard', rss: 'https://www.business-standard.com/rss/home_page_top_stories.rss' },
    { id: 'wion', region: 'india', name: 'WION', rss: 'https://www.wionews.com/feeds/wion-world.rss' },
    { id: 'aajtak', region: 'india', name: 'AajTak', rss: 'https://feed.aajtak.in/rss/1471018/rss.xml' },
    { id: 'rt', region: 'intl', name: 'Russia Today', rss: 'https://www.rt.com/rss/news/' },
    { id: 'gt', region: 'intl', name: 'Global Times', rss: 'https://www.globaltimes.cn/rss/rss.xml' },
    { id: 'sputnik', region: 'intl', name: 'Sputnik', rss: 'https://sputniknews.com/export/pool/custom_all/' },
    { id: 'france24', region: 'intl', name: 'France 24', rss: 'https://www.france24.com/en/rss' },
    { id: 'ndtv', region: 'india', name: 'NDTV', rss: 'https://feeds.feedburner.com/ndtvnews-top-stories' },
    { id: 'thehindu', region: 'india', name: 'The Hindu', rss: 'https://www.thehindu.com/feeder/default.rss' },
    { id: 'ht', region: 'india', name: 'Hindustan Times', rss: 'https://www.hindustantimes.com/feeds/topnews/rss' },
    { id: 'theprint', region: 'india', name: 'The Print', rss: 'https://theprint.in/feed/' },
    { id: 'abp', region: 'india', name: 'ABP News', rss: 'https://news.abplive.com/home/feed' },
    { id: 'fars', region: 'intl', name: 'Fars News', rss: 'https://en.farsnews.ir/rss' },
    { id: 'aljazeera', region: 'intl', name: 'Al Jazeera', rss: 'https://www.aljazeera.com/xml/rss/all.xml' }
];

let articles = [];
let currentArticleIndex = 0;
let synth = window.speechSynthesis;
let utterance = null;
let isPlaying = false;
let voices = [];

let secondsUntilRefresh = 300; // 5 minutes

// DOM Elements
const titleEl = document.getElementById('article-title');
const contentEl = document.getElementById('article-content');
const progressEl = document.getElementById('article-progress');
const statusText = document.getElementById('status-text');
const timerTextEl = document.getElementById('timer-text');
const btnPlayPause = document.getElementById('btn-play-pause');
const playPauseIcon = document.getElementById('play-pause-icon');
const playPauseText = document.getElementById('play-pause-text');
const btnNext = document.getElementById('btn-next');
const btnPrev = document.getElementById('btn-prev');
const btnStop = document.getElementById('btn-stop');
const sourceSelect = document.getElementById('source-select');
const voiceSelect = document.getElementById('voice-select');
const rateRange = document.getElementById('rate-range');
const rateValue = document.getElementById('rate-value');
const appShell = document.querySelector('.app-shell');
const commandPalette = document.getElementById('command-palette');
const commandInput = document.getElementById('command-input');
const commandTrigger = document.getElementById('command-trigger');
const commandClose = document.getElementById('command-close');
const searchTrigger = document.getElementById('search-trigger');
const themeToggle = document.getElementById('theme-toggle');
const voiceCommandToggle = document.getElementById('voice-command-toggle');
const voiceCommandStatus = document.getElementById('voice-command-status');
const voiceTalkButton = document.getElementById('voice-talk-button');
const voiceTranscript = document.getElementById('voice-transcript');
const voiceCommandLog = document.getElementById('voice-command-log');
const onboardingOverlay = document.getElementById('onboarding-overlay');
const onboardingStepTitle = document.getElementById('onboarding-step-title');
const onboardingStepBody = document.getElementById('onboarding-step-body');
const onboardingBackButton = document.getElementById('onboarding-back');
const onboardingNextButton = document.getElementById('onboarding-next');
const onboardingSkipButton = document.getElementById('onboarding-skip');
const onboardingCloseButton = document.getElementById('onboarding-close');
const onboardingProgressDots = document.querySelectorAll('.onboarding-progress-dot');
const toastStack = document.getElementById('toast-stack');
const commandItems = document.querySelectorAll('.command-item');
const SpeechRecognitionAPI = window.SpeechRecognition || window.webkitSpeechRecognition;

let voiceCommandsEnabled = false;
let recognition = null;
let voicePushToTalkActive = false;
let voiceContinuousListening = false;
let onboardingStepIndex = 0;

const onboardingSteps = [
    {
        title: 'Pick a source fast',
        body: 'Use the sidebar, command palette, or voice search to jump straight to Reuters, BBC, India news, or a mixed digest.',
    },
    {
        title: 'Use voice commands',
        body: 'Say play, pause, next, previous, stop, source Reuters, load India news, or speed 1.25 to control the experience hands-free.',
    },
    {
        title: 'Stay keyboard-first',
        body: 'Cmd K opens the command palette, Space toggles playback, and the voice assistant can guide you through the entire app.',
    },
];

function setLoadingState(isLoading) {
    document.body.classList.toggle('is-loading', isLoading);
}

function showToast(title, detail = '') {
    if (!toastStack) return;

    const toast = document.createElement('div');
    toast.className = 'toast';
    toast.innerHTML = `<strong>${title}</strong>${detail ? `<small>${detail}</small>` : ''}`;
    toastStack.appendChild(toast);

    window.setTimeout(() => {
        toast.remove();
    }, 3200);
}

function pushVoiceLog(label, detail) {
    if (!voiceCommandLog) return;

    const entry = document.createElement('li');
    entry.textContent = detail ? `${label} - ${detail}` : label;
    voiceCommandLog.prepend(entry);

    while (voiceCommandLog.children.length > 5) {
        voiceCommandLog.lastElementChild?.remove();
    }
}

function openCommandPalette() {
    if (!commandPalette) return;

    commandPalette.hidden = false;
    commandPalette.setAttribute('aria-hidden', 'false');
    commandPalette.classList.add('is-open');
    commandInput?.focus();
    showToast('Command palette opened', 'Search actions with the keyboard.');
}

function closeCommandPalette() {
    if (!commandPalette) return;

    commandPalette.hidden = true;
    commandPalette.setAttribute('aria-hidden', 'true');
    commandPalette.classList.remove('is-open');
    commandTrigger?.focus();
}

function setVoiceCommandStatus(message) {
    if (voiceCommandStatus) {
        voiceCommandStatus.textContent = message;
    }
}

function updateVoiceToggleUI() {
    if (!voiceCommandToggle) return;

    voiceCommandToggle.textContent = voiceCommandsEnabled ? 'Voice commands on' : 'Voice commands off';
    voiceCommandToggle.classList.toggle('is-active', voiceCommandsEnabled);
    voiceCommandToggle.setAttribute('aria-pressed', String(voiceCommandsEnabled));
    setVoiceCommandStatus(
        voiceCommandsEnabled
            ? 'Listening for commands like play, pause, next, previous, source BBC, voice Samantha, or mixed digest.'
            : 'Enable microphone support to speak commands like play, next, source BBC, or voice Samantha.'
    );
}

function updateVoiceTalkButton() {
    if (!voiceTalkButton) return;

    voiceTalkButton.classList.toggle('is-recording', voicePushToTalkActive);
    voiceTalkButton.textContent = voicePushToTalkActive ? 'Listening...' : 'Press to talk';
}

function renderOnboardingStep() {
    if (!onboardingStepTitle || !onboardingStepBody) return;

    const step = onboardingSteps[onboardingStepIndex];
    onboardingStepTitle.textContent = step.title;
    onboardingStepBody.textContent = step.body;

    onboardingBackButton.disabled = onboardingStepIndex === 0;
    onboardingNextButton.textContent = onboardingStepIndex === onboardingSteps.length - 1 ? 'Finish' : 'Next';

    onboardingProgressDots.forEach((dot, index) => {
        dot.classList.toggle('is-active', index === onboardingStepIndex);
    });
}

function openOnboarding() {
    if (!onboardingOverlay) return;

    onboardingStepIndex = 0;
    renderOnboardingStep();
    onboardingOverlay.hidden = false;
    onboardingOverlay.setAttribute('aria-hidden', 'false');
    onboardingNextButton?.focus();
}

function closeOnboarding() {
    if (!onboardingOverlay) return;

    onboardingOverlay.hidden = true;
    onboardingOverlay.setAttribute('aria-hidden', 'true');
    window.localStorage?.setItem('listenUp-onboarding-dismissed', 'true');
}

function advanceOnboardingStep(direction) {
    onboardingStepIndex = Math.min(onboardingSteps.length - 1, Math.max(0, onboardingStepIndex + direction));
    renderOnboardingStep();
}

function normalizeVoiceText(text) {
    return text.toLowerCase().replace(/[^ -]/g, ' ').replace(/[^a-z0-9\s.]/g, ' ').replace(/\s+/g, ' ').trim();
}

function scrollToSection(sectionId) {
    const section = document.getElementById(sectionId);
    if (!section) return false;

    section.scrollIntoView({ behavior: 'smooth', block: 'start' });
    section.setAttribute('tabindex', '-1');
    section.focus({ preventScroll: true });
    showToast('Navigation', `Moved to ${sectionId}.`);
    return true;
}

function adjustSpeechRate(delta) {
    const currentRate = Number.parseFloat(rateRange.value);
    const nextRate = Math.min(2, Math.max(0.5, currentRate + delta));
    rateRange.value = String(nextRate.toFixed(2));
    rateValue.textContent = `${Number.parseFloat(rateRange.value)}x`;
    showToast('Speech speed updated', `Now set to ${rateValue.textContent}.`);
    return true;
}

function isRegionQuery(command, region) {
    const tokensByRegion = {
        india: ['india', 'indian'],
        intl: ['global', 'international', 'world', 'worldwide'],
    };

    return tokensByRegion[region]?.some((token) => command.includes(token)) ?? false;
}

function buildRegionalDigestUrls(region) {
    return newsSources
        .filter((source) => source.region === region)
        .sort(() => 0.5 - Math.random())
        .slice(0, 4)
        .map((source) => source.rss);
}

function scrollToSection(sectionId) {
    const section = document.getElementById(sectionId);
    if (!section) return false;

    section.scrollIntoView({ behavior: 'smooth', block: 'start' });
    section.setAttribute('tabindex', '-1');
    section.focus({ preventScroll: true });
    showToast('Navigation', `Moved to ${sectionId}.`);
    return true;
}

function adjustSpeechRate(delta) {
    const currentRate = Number.parseFloat(rateRange.value);
    const nextRate = Math.min(2, Math.max(0.5, currentRate + delta));
    rateRange.value = String(nextRate.toFixed(2));
    rateValue.textContent = `${Number.parseFloat(rateRange.value)}x`;
    showToast('Speech speed updated', `Now set to ${rateValue.textContent}.`);
    return true;
}

async function fetchRegionalDigest(region) {
    stopReading();
    secondsUntilRefresh = 300;
    setLoadingState(true);

    const regionLabel = region === 'india' ? 'India' : 'Global';
    titleEl.textContent = `Loading ${regionLabel} News...`;
    contentEl.textContent = `Curating the latest ${regionLabel.toLowerCase()} stories. Please wait...`;
    progressEl.textContent = '';
    articles = [];
    currentArticleIndex = 0;

    try {
        const fetchArticles = async (urls) => {
            let fetched = [];

            for (const url of urls) {
                try {
                    const response = await fetch(`https://api.rss2json.com/v1/api.json?rss_url=${encodeURIComponent(url)}`);
                    const data = await response.json();

                    if (data.status === 'ok') {
                        const parsed = data.items.map((item) => {
                            const tmp = document.createElement('DIV');
                            tmp.innerHTML = item.description || item.content || '';
                            return { title: item.title, content: tmp.textContent || tmp.innerText || '' };
                        });

                        fetched = fetched.concat(parsed);
                    }
                } catch (error) {
                    console.error(error);
                }
            }

            return fetched;
        };

        const regionalArticles = await fetchArticles(buildRegionalDigestUrls(region));
        const finalArticles = regionalArticles.slice(0, 18);

        if (finalArticles.length > 0) {
            articles = finalArticles;
            loadArticle(0);
            showToast(`${regionLabel} digest ready`, `${articles.length} stories curated.`);
            pushVoiceLog('Digest loaded', `${regionLabel} news`);
            return;
        }

        titleEl.textContent = 'Error';
        contentEl.textContent = `Failed to load ${regionLabel.toLowerCase()} articles. Please try again.`;
        showToast('Digest unavailable', `No ${regionLabel.toLowerCase()} stories could be aggregated right now.`);
    } catch (error) {
        console.error(`Error fetching ${regionLabel.toLowerCase()} digest:`, error);
        titleEl.textContent = 'Error';
        contentEl.textContent = `A network error occurred while loading ${regionLabel.toLowerCase()} news.`;
        showToast('Aggregation failed', 'Please try again in a moment.');
    } finally {
        setLoadingState(false);
    }
}

function findSourceByQuery(query) {
    const normalizedQuery = normalizeVoiceText(query);
    const allOptions = Array.from(sourceSelect.options).filter((option) => option.value !== 'mixed');

    const exactMatch = allOptions.find((option) => normalizeVoiceText(option.textContent).includes(normalizedQuery));
    if (exactMatch) {
        sourceSelect.value = exactMatch.value;
        sourceSelect.dispatchEvent(new Event('change', { bubbles: true }));
        showToast('Source selected', exactMatch.textContent);
        pushVoiceLog('Source selected', exactMatch.textContent);
        return true;
    }

    if (isRegionQuery(normalizedQuery, 'india')) {
        fetchRegionalDigest('india');
        return true;
    }

    if (isRegionQuery(normalizedQuery, 'intl')) {
        fetchRegionalDigest('intl');
        return true;
    }

    const looseMatch = allOptions.find((option) => {
        const optionText = normalizeVoiceText(option.textContent);
        return normalizedQuery.split(' ').some((token) => token.length > 2 && optionText.includes(token));
    });

    if (looseMatch) {
        sourceSelect.value = looseMatch.value;
        sourceSelect.dispatchEvent(new Event('change', { bubbles: true }));
        showToast('Source selected', looseMatch.textContent);
        pushVoiceLog('Source selected', looseMatch.textContent);
        return true;
    }

    showToast('Source not found', `Could not match "${query}".`);
    return false;
}

function setSourceByName(sourceName) {
    const searchTerm = normalizeVoiceText(sourceName);
    const matchingOption = Array.from(sourceSelect.options).find((option) => {
        if (option.value === 'mixed') return false;
        return normalizeVoiceText(option.textContent).includes(searchTerm);
    });

    if (!matchingOption) {
        showToast('Source not found', `Could not match "${sourceName}".`);
        return false;
    }

    sourceSelect.value = matchingOption.value;
    sourceSelect.dispatchEvent(new Event('change', { bubbles: true }));
    showToast('Source selected', matchingOption.textContent);
    return true;
}

function setVoiceByName(voiceName) {
    const searchTerm = normalizeVoiceText(voiceName);
    const matchingOption = Array.from(voiceSelect.options).find((option) =>
        normalizeVoiceText(option.textContent).includes(searchTerm)
    );

    if (!matchingOption) {
        showToast('Voice not found', `Could not match "${voiceName}".`);
        return false;
    }

    voiceSelect.value = matchingOption.value;
    showToast('Voice selected', matchingOption.textContent);
    return true;
}

function setSpeechRate(rateText) {
    const parsedRate = Number.parseFloat(rateText);
    if (Number.isNaN(parsedRate)) {
        showToast('Invalid speed', 'Try a value like 1, 1.25, or 1.5.');
        return false;
    }

    const clampedRate = Math.min(2, Math.max(0.5, parsedRate));
    rateRange.value = String(clampedRate);
    rateValue.textContent = `${clampedRate}x`;
    showToast('Speed updated', `Speech rate set to ${clampedRate}x.`);
    return true;
}

function handleVoiceCommand(rawTranscript) {
    const command = normalizeVoiceText(rawTranscript);

    if (voiceTranscript) {
        voiceTranscript.textContent = rawTranscript || 'No voice command yet.';
    }

    pushVoiceLog('Heard', rawTranscript || '');

    if (!command) return;

    if (command.includes('help') || command.includes('what can i say')) {
        openCommandPalette();
        showToast('Voice commands', 'Try play, pause, next, previous, stop, mixed digest, source BBC, voice Samantha, or speed 1.25.');
        return;
    }

    if (command.includes('open command palette')) {
        openCommandPalette();
        return;
    }

    if (command.includes('show shortcuts') || command.includes('voice help') || command.includes('assistant help')) {
        openCommandPalette();
        showToast('Assistant help', 'Use play, pause, next, previous, stop, source, voice, speed, open dashboard, open settings, or mixed digest.');
        return;
    }

    if (command.includes('open dashboard') || command.includes('go to dashboard')) {
        scrollToSection('dashboard');
        return;
    }

    if (command.includes('open feed') || command.includes('go to feed') || command.includes('open player')) {
        scrollToSection('player');
        return;
    }

    if (command.includes('open settings') || command.includes('go to settings')) {
        scrollToSection('settings');
        return;
    }

    if (command.includes('open insights') || command.includes('go to insights')) {
        scrollToSection('insights');
        return;
    }

    if (command.includes('close command palette') || command === 'close') {
        closeCommandPalette();
        return;
    }

    if (command.includes('mixed digest') || command.includes('load mixed') || command.includes('mixed news')) {
        fetchMixedNews();
        return;
    }

    const sourceMatch = command.match(/\bsource\s+(.+)$/);
    if (sourceMatch && setSourceByName(sourceMatch[1])) return;

    const voiceMatch = command.match(/\bvoice\s+(.+)$/);
    if (voiceMatch && setVoiceByName(voiceMatch[1])) return;

    const speedMatch = command.match(/\b(?:speed|rate)\s+([0-9]+(?:\.[0-9]+)?)/);
    if (speedMatch && setSpeechRate(speedMatch[1])) return;

    if (command.includes('faster') || command.includes('speed up') || command.includes('increase speed')) {
        adjustSpeechRate(0.1);
        return;
    }

    if (command.includes('slower') || command.includes('slow down') || command.includes('decrease speed')) {
        adjustSpeechRate(-0.1);
        return;
    }

    if (command.includes('next article') || command === 'next' || command.startsWith('next ')) {
        btnNext.click();
        return;
    }

    if (command.includes('previous article') || command.includes('go back') || command === 'previous' || command.startsWith('previous ')) {
        btnPrev.click();
        return;
    }

    if (command.includes('play') && !command.includes('pause')) {
        if (!isPlaying) togglePlayPause();
        return;
    }

    if (command.includes('pause') || command.includes('stop reading') || command === 'stop') {
        if (isPlaying || synth.speaking) {
            if (command.includes('stop')) {
                stopReading();
            } else if (isPlaying) {
                togglePlayPause();
            }
        }
        return;
    }

    if (command.includes('repeat') || command.includes('read again')) {
        if (titleEl?.textContent) {
            showToast('Current story', `${titleEl.textContent}.`);
        }
        if (!isPlaying) togglePlayPause();
        return;
    }

    showToast('Command not recognized', 'Try help for a list of available voice commands.');
}

function getRecognition() {
    if (!SpeechRecognitionAPI) return null;

    if (recognition) return recognition;

    recognition = new SpeechRecognitionAPI();
    recognition.lang = 'en-US';
    recognition.continuous = true;
    recognition.interimResults = false;
    recognition.maxAlternatives = 1;

    recognition.onresult = (event) => {
        const result = event.results[event.results.length - 1];
        const transcript = result?.[0]?.transcript || '';
        handleVoiceCommand(transcript);
    };

    recognition.onerror = (event) => {
        if (event.error === 'not-allowed' || event.error === 'service-not-allowed') {
            voiceCommandsEnabled = false;
            updateVoiceToggleUI();
            setVoiceCommandStatus('Microphone access was blocked. Allow access to use voice commands.');
            openCommandPalette();
            showToast('Voice commands', 'Try play, pause, next, previous, stop, mixed digest, source Reuters, load India news, or speed 1.25.');
        }

        if (event.error !== 'aborted') {
            showToast('Voice control error', 'Try again or use keyboard shortcuts.');
        }
    };

    recognition.onend = () => {
        if (!voiceCommandsEnabled || !voiceContinuousListening) return;

        try {
            recognition.start();
        } catch (error) {
            console.warn('Voice recognition restart skipped:', error);
        }
    };

    return recognition;
}

function startVoiceCommands() {
    if (!SpeechRecognitionAPI) {
        showToast('Voice commands unavailable', 'Use a Chromium browser with speech recognition support.');
        setVoiceCommandStatus('This browser does not support speech recognition.');
        return;
    }

    voiceCommandsEnabled = true;
    voiceContinuousListening = true;
    updateVoiceToggleUI();

    const activeRecognition = getRecognition();
    if (!activeRecognition) return;

    try {
        activeRecognition.start();
        showToast('Voice commands enabled', 'Say play, pause, next, previous, source BBC, voice Samantha, or mixed digest.');

function stopVoiceCommands() {
    voiceCommandsEnabled = false;
    voiceContinuousListening = false;
    updateVoiceToggleUI();

    if (recognition) {
        try {
            recognition.stop();
        } catch (error) {
            console.warn('Voice recognition stop skipped:', error);
        }
    }

    showToast('Voice commands disabled', 'Microphone listening has stopped.');
    pushVoiceLog('Voice assistant', 'Listening disabled');
}

function startPushToTalk() {
    if (!SpeechRecognitionAPI || !recognition) return;

    voiceCommandsEnabled = true;
    voiceContinuousListening = false;
    voicePushToTalkActive = true;
    updateVoiceTalkButton();
    updateVoiceToggleUI();

    try {
        recognition.start();
    } catch (error) {
        console.warn('Push to talk start skipped:', error);
    }
}

        if (command.includes('repeat') || command.includes('read again')) {
            if (titleEl?.textContent) {
                showToast('Current story', `${titleEl.textContent}.`);
            }
            if (!isPlaying) togglePlayPause();
            return;
        }
function stopPushToTalk() {
    voicePushToTalkActive = false;
    updateVoiceTalkButton();

    if (recognition) {
        try {
            recognition.stop();
        } catch (error) {
            console.warn('Push to talk stop skipped:', error);
        }
    }

    voiceCommandsEnabled = false;
    updateVoiceToggleUI();
}

function toggleVoiceCommands() {
    if (voiceCommandsEnabled) {
        stopVoiceCommands();
    } else {
        startVoiceCommands();
    }
}

function applyTheme(isLight) {
    document.body.classList.toggle('light-mode', isLight);
    if (themeToggle) {
        themeToggle.setAttribute('aria-label', isLight ? 'Switch to dark mode' : 'Toggle light mode');
    }
    window.localStorage?.setItem('listenUp-theme', isLight ? 'light' : 'dark');
}

const savedTheme = window.localStorage?.getItem('listenUp-theme');
applyTheme(savedTheme === 'light');

// Initialize voices
function populateVoiceList() {
    voices = synth.getVoices();
    voiceSelect.innerHTML = '';
    
    // Prioritize English voices
    const englishVoices = voices.filter(voice => voice.lang.startsWith('en'));
    const voicesToUse = englishVoices.length > 0 ? englishVoices : voices;
    
    voicesToUse.forEach((voice, i) => {
        const option = document.createElement('option');
        option.textContent = `${voice.name} (${voice.lang})`;
        option.setAttribute('data-lang', voice.lang);
        option.setAttribute('data-name', voice.name);
        voiceSelect.appendChild(option);
    });
}

populateVoiceList();
if (speechSynthesis.onvoiceschanged !== undefined) {
    speechSynthesis.onvoiceschanged = populateVoiceList;
}

// Initialize News Sources
function populateSourceList() {
    sourceSelect.innerHTML = '';
    
    // Add Mixed Option
    const mixedOption = document.createElement('option');
    mixedOption.value = 'mixed';
    mixedOption.textContent = 'Mixed Daily Digest (25 Articles)';
    sourceSelect.appendChild(mixedOption);

    newsSources.forEach(source => {
        const option = document.createElement('option');
        option.value = source.rss;
        option.textContent = source.name;
        sourceSelect.appendChild(option);
    });
}
populateSourceList();
updateVoiceToggleUI();
updateVoiceTalkButton();
renderOnboardingStep();

async function fetchNews(rssUrl) {
    stopReading();
    secondsUntilRefresh = 300;
    setLoadingState(true);
    titleEl.textContent = 'Loading News...';
    contentEl.textContent = 'Please wait while we fetch the latest articles.';
    progressEl.textContent = '';
    articles = [];
    currentArticleIndex = 0;

    try {
        const response = await fetch(`https://api.rss2json.com/v1/api.json?rss_url=${encodeURIComponent(rssUrl)}`);
        const data = await response.json();
        
        if (data.status === 'ok' && data.items.length > 0) {
            articles = data.items.map(item => {
                // Strip HTML from description
                const tmp = document.createElement("DIV");
                tmp.innerHTML = item.description || item.content || '';
                const cleanContent = tmp.textContent || tmp.innerText || "";
                
                return {
                    title: item.title,
                    content: cleanContent
                };
            });
            loadArticle(0);
            showToast('Digest loaded', `${articles.length} articles ready.`);
        } else {
            titleEl.textContent = 'Error';
            contentEl.textContent = 'Failed to load news articles. Please try another source.';
            showToast('Unable to load articles', 'The selected source returned no usable stories.');
        }
    } catch (error) {
        console.error("Error fetching news:", error);
        titleEl.textContent = 'Error';
        contentEl.textContent = 'A network error occurred. Please try another source.';
        showToast('Network error', 'Try another source or load the mixed digest.');
    } finally {
        setLoadingState(false);
    }
}

sourceSelect.addEventListener('change', (e) => {
    if (e.target.value === 'mixed') {
        fetchMixedNews();
    } else {
        fetchNews(e.target.value);
    }
});

async function fetchMixedNews() {
    stopReading();
    secondsUntilRefresh = 300;
    setLoadingState(true);
    titleEl.textContent = 'Loading Daily Digest...';
    contentEl.textContent = 'Aggregating 25 articles (15 India, 10 International). Please wait...';
    progressEl.textContent = '';
    articles = [];
    currentArticleIndex = 0;

    try {
        const indianUrls = newsSources.filter(s => s.region === 'india').map(s => s.rss);
        const intlUrls = newsSources.filter(s => s.region === 'intl').map(s => s.rss);
        
        // Randomly pick a few sources from each to distribute the load
        const selectedIndianUrls = indianUrls.sort(() => 0.5 - Math.random()).slice(0, 4);
        const selectedIntlUrls = intlUrls.sort(() => 0.5 - Math.random()).slice(0, 4);
        
        const fetchArticles = async (urls) => {
            let fetched = [];
            for (const url of urls) {
                try {
                    const response = await fetch(`https://api.rss2json.com/v1/api.json?rss_url=${encodeURIComponent(url)}`);
                    const data = await response.json();
                    if (data.status === 'ok') {
                        const parsed = data.items.map(item => {
                            const tmp = document.createElement("DIV");
                            tmp.innerHTML = item.description || item.content || '';
                            return { title: item.title, content: tmp.textContent || tmp.innerText || "" };
                        });
                        fetched = fetched.concat(parsed);
                    }
                } catch(e) { console.error(e); }
            }
            return fetched;
        };

        const [indianArticles, intlArticles] = await Promise.all([
            fetchArticles(selectedIndianUrls),
            fetchArticles(selectedIntlUrls)
        ]);
        
        const finalIndian = indianArticles.slice(0, 15);
        const finalIntl = intlArticles.slice(0, 10);
        
        let combined = [...finalIndian, ...finalIntl];
        
        if (combined.length > 0) {
            articles = combined;
            loadArticle(0);
            showToast('Mixed digest ready', `${articles.length} stories curated from multiple sources.`);
        } else {
            titleEl.textContent = 'Error';
            contentEl.textContent = 'Failed to load any articles. Please try again.';
            showToast('Digest unavailable', 'No stories could be aggregated right now.');
        }
    } catch (error) {
        console.error("Error fetching mixed news:", error);
        titleEl.textContent = 'Error';
        contentEl.textContent = 'A network error occurred while aggregating news.';
        showToast('Aggregation failed', 'Please try again in a moment.');
    } finally {
        setLoadingState(false);
    }
}

function loadArticle(index) {
    if (articles.length === 0) return;
    if (index < 0) index = 0;
    if (index >= articles.length) index = articles.length - 1;
    
    currentArticleIndex = index;
    const article = articles[currentArticleIndex];
    
    titleEl.textContent = article.title;
    contentEl.textContent = article.content;
    progressEl.textContent = `Article ${currentArticleIndex + 1} of ${articles.length}`;
    
    stopReading(); // Stop reading previous when changing article
}

function prepareUtterance() {
    if (articles.length === 0) return;
    const article = articles[currentArticleIndex];
    const textToRead = `${article.title}. ${article.content}`;
    
    utterance = new SpeechSynthesisUtterance(textToRead);
    
    // Set selected voice
    const selectedVoiceName = voiceSelect.selectedOptions[0]?.getAttribute('data-name');
    const voice = voices.find(v => v.name === selectedVoiceName);
    if (voice) {
        utterance.voice = voice;
    }
    
    // Set rate
    utterance.rate = rateRange.value;
    
    utterance.onend = () => {
        isPlaying = false;
        updateUI();
        // Auto-play next article if there is one
        if (currentArticleIndex < articles.length - 1) {
            loadArticle(currentArticleIndex + 1);
            setTimeout(() => togglePlayPause(), 500); // slight pause between articles
        }
    };
    
    utterance.onerror = (e) => {
        console.error('SpeechSynthesis error:', e);
        isPlaying = false;
        updateUI();
    };
}

function togglePlayPause() {
    if (synth.speaking && !synth.paused && isPlaying) {
        synth.pause();
        isPlaying = false;
    } else if (synth.paused) {
        synth.resume();
        isPlaying = true;
    } else {
        prepareUtterance();
        synth.speak(utterance);
        isPlaying = true;
    }
    updateUI();
    showToast(isPlaying ? 'Playback started' : 'Playback paused', 'Use the controls or spacebar to continue.');
}

function stopReading() {
    synth.cancel();
    isPlaying = false;
    updateUI();
}

function updateUI() {
    if (isPlaying) {
        playPauseIcon.textContent = '⏸';
        playPauseText.textContent = 'Pause';
        statusText.textContent = 'Status: Playing';
        btnPlayPause.setAttribute('aria-label', 'Pause News');
    } else {
        playPauseIcon.textContent = '▶';
        playPauseText.textContent = 'Play';
        statusText.textContent = 'Status: Paused';
        btnPlayPause.setAttribute('aria-label', 'Play News');
    }
}

// Event Listeners
btnPlayPause.addEventListener('click', togglePlayPause);
btnStop.addEventListener('click', stopReading);

btnNext.addEventListener('click', () => {
    loadArticle(currentArticleIndex + 1);
    if(isPlaying) togglePlayPause(); // auto-play on next if it was playing
});

btnPrev.addEventListener('click', () => {
    loadArticle(currentArticleIndex - 1);
    if(isPlaying) togglePlayPause(); // auto-play on prev if it was playing
});

rateRange.addEventListener('input', () => {
    rateValue.textContent = rateRange.value + 'x';
});

themeToggle?.addEventListener('click', () => {
    const isLight = !document.body.classList.contains('light-mode');
    applyTheme(isLight);
    showToast(isLight ? 'Light mode enabled' : 'Dark mode enabled', 'The workspace theme has been updated.');
});

commandTrigger?.addEventListener('click', openCommandPalette);
searchTrigger?.addEventListener('click', openCommandPalette);
commandClose?.addEventListener('mousedown', (event) => {
    event.preventDefault();
    closeCommandPalette();
});
commandClose?.addEventListener('click', closeCommandPalette);
voiceCommandToggle?.addEventListener('click', toggleVoiceCommands);
voiceTalkButton?.addEventListener('mousedown', startPushToTalk);
voiceTalkButton?.addEventListener('touchstart', startPushToTalk, { passive: true });
voiceTalkButton?.addEventListener('mouseup', stopPushToTalk);
voiceTalkButton?.addEventListener('mouseleave', stopPushToTalk);
voiceTalkButton?.addEventListener('touchend', stopPushToTalk);

onboardingBackButton?.addEventListener('click', () => advanceOnboardingStep(-1));
onboardingNextButton?.addEventListener('click', () => {
    if (onboardingStepIndex === onboardingSteps.length - 1) {
        closeOnboarding();
        return;
    }

    advanceOnboardingStep(1);
});
onboardingSkipButton?.addEventListener('click', closeOnboarding);
onboardingCloseButton?.addEventListener('click', closeOnboarding);
onboardingOverlay?.addEventListener('click', (event) => {
    if (event.target === onboardingOverlay) {
        closeOnboarding();
    }
});

commandItems.forEach((item) => {
    item.addEventListener('click', () => {
        const action = item.dataset.command;
        if (action === 'play') {
            togglePlayPause();
        } else if (action === 'mixed') {
            fetchMixedNews();
        } else if (action === 'source') {
            sourceSelect.focus();
        } else if (action === 'voice') {
            voiceSelect.focus();
        }
        closeCommandPalette();
    });
});

commandPalette?.addEventListener('click', (event) => {
    if (event.target === commandPalette) {
        closeCommandPalette();
    }
});

commandInput?.addEventListener('keydown', (event) => {
    if (event.key === 'Escape') {
        closeCommandPalette();
    }
});

// Keyboard shortcuts for blind users (very important)
document.addEventListener('keydown', (e) => {
    if ((e.metaKey || e.ctrlKey) && e.key.toLowerCase() === 'k') {
        e.preventDefault();
        openCommandPalette();
        return;
    }

    if (e.key === 'Escape' && !commandPalette.hidden) {
        closeCommandPalette();
        return;
    }

    // Space to play/pause (if not focused on a button or select to avoid double firing)
    if (e.code === 'Space' && document.activeElement.tagName !== 'BUTTON') {
        e.preventDefault();
        togglePlayPause();
    }
    // Right Arrow for Next
    if (e.code === 'ArrowRight' && document.activeElement.tagName !== 'INPUT' && document.activeElement.tagName !== 'SELECT') {
        btnNext.click();
    }
    // Left Arrow for Prev
    if (e.code === 'ArrowLeft' && document.activeElement.tagName !== 'INPUT' && document.activeElement.tagName !== 'SELECT') {
        btnPrev.click();
    }
});

// Initial load
fetchMixedNews();

if (!window.localStorage?.getItem('listenUp-onboarding-dismissed')) {
    window.setTimeout(() => {
        openOnboarding();
    }, 900);
}

function updateTimerDisplay() {
    if (isPlaying) {
        timerTextEl.textContent = 'Update paused while reading';
    } else {
        const minutes = Math.floor(secondsUntilRefresh / 60);
        const seconds = secondsUntilRefresh % 60;
        timerTextEl.textContent = `Next update in ${String(minutes).padStart(2, '0')}:${String(seconds).padStart(2, '0')}`;
    }
}

// Auto-update countdown timer
setInterval(() => {
    if (isPlaying) {
        updateTimerDisplay();
        return;
    }

    secondsUntilRefresh--;
    
    if (secondsUntilRefresh <= 0) {
        timerTextEl.textContent = 'Updating...';
        if (sourceSelect.value === 'mixed') {
            fetchMixedNews();
        } else {
            fetchNews(sourceSelect.value);
        }
    } else {
        updateTimerDisplay();
    }
}, 1000);
