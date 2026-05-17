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
let isPlaying = false;
let voices = [];
let utterance = null;
let refreshSeconds = 300;
let refreshTimer = null;
let onboardingStepIndex = 0;
let recognition = null;
let voiceCommandsEnabled = false;
let voiceContinuousListening = false;
let voicePushToTalkActive = false;
let suppressAutoAdvance = false;
let lastVoiceCommandSignature = '';
let lastVoiceCommandAt = 0;

const synth = window.speechSynthesis;
const SpeechRecognitionAPI = window.SpeechRecognition || window.webkitSpeechRecognition;

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

    window.setTimeout(() => toast.remove(), 3200);
}

function pushVoiceLog(label, detail = '') {
    if (!voiceCommandLog) return;

    const entry = document.createElement('li');
    entry.textContent = detail ? `${label} - ${detail}` : label;
    voiceCommandLog.prepend(entry);

    while (voiceCommandLog.children.length > 5) {
        voiceCommandLog.lastElementChild?.remove();
    }
}

function normalizeText(text) {
    return String(text || '')
        .toLowerCase()
        .replace(/[^a-z0-9\s.]/g, ' ')
        .replace(/\s+/g, ' ')
        .trim();
}

function matchesAny(command, phrases) {
    return phrases.some((phrase) => command.includes(phrase));
}

function matchesToken(command, token) {
    return new RegExp(`(?:^|\\s)${token}(?:$|\\s)`).test(command);
}

function matchesAnyToken(command, tokens) {
    return tokens.some((token) => matchesToken(command, token));
}

function getBestRecognitionTranscript(result) {
    if (!result) return '';

    const alternatives = Array.from(result || []);
    if (alternatives.length === 0) return '';

    const commandLike = alternatives.find((alternative) => {
        const transcript = normalizeText(alternative?.transcript || '');
        return /^(play|pause|stop|next|previous|today|headlines|mixed|source|voice)\b/.test(transcript);
    });

    const bestAlternative = [...alternatives].sort((left, right) => (right.confidence || 0) - (left.confidence || 0))[0];
    return normalizeText(commandLike?.transcript || bestAlternative?.transcript || '');
}

function resolveVoiceIntent(command) {
    const normalized = normalizeText(command);
    if (!normalized) return null;

    if (matchesAny(normalized, ['turn voice off', 'disable voice commands', 'voice off'])) return 'voice-off';
    if (matchesAny(normalized, ['turn voice on', 'enable voice commands', 'voice on'])) return 'voice-on';

    if (matchesAny(normalized, ['close command palette', 'close palette', 'close window'])) return 'close-palette';
    if (matchesAny(normalized, ['open command palette', 'open palette'])) return 'open-palette';

    if (matchesAny(normalized, ['open dashboard', 'go to dashboard', 'show dashboard'])) return 'dashboard';
    if (matchesAny(normalized, ['open feed', 'go to feed', 'open player', 'show player'])) return 'player';
    if (matchesAny(normalized, ['open settings', 'go to settings', 'show settings'])) return 'settings';
    if (matchesAny(normalized, ['open insights', 'go to insights', 'show insights'])) return 'insights';

    if (matchesAny(normalized, ['today news', 'today s news', 'todays news', 'today headline', 'today headlines', 'headlines news', 'headings news', 'headlines', 'daily digest', 'read today s news', 'read today news', 'play today s news', 'play todays news', 'play today news', 'play the news', 'load today s news', 'load todays news', 'load today news', 'start today s news', 'start today news', 'read me the news'])) {
        return 'today-news';
    }

    if (matchesAny(normalized, ['mixed digest', 'load mixed', 'mixed news', 'daily brief', 'latest news', 'open news'])) return 'mixed-news';

    if (matchesAny(normalized, ['source '])) return 'source';
    if (matchesAny(normalized, ['voice '])) return 'voice';
    if (matchesAny(normalized, ['speed ', 'rate '])) return 'speed';

    if (matchesAny(normalized, ['stop reading', 'stop playback', 'stop speaking', 'stop the news']) || matchesToken(normalized, 'stop')) return 'stop';
    if (matchesAny(normalized, ['pause reading', 'pause playback', 'pause the news', 'hold on', 'stop for a moment']) || matchesToken(normalized, 'pause')) return 'pause';
    if (matchesAny(normalized, ['next article', 'next story', 'next news', 'skip ahead', 'next item', 'move next']) || matchesToken(normalized, 'next')) return 'next';
    if (matchesAny(normalized, ['previous article', 'previous story', 'previous news', 'go back', 'back', 'previous item', 'move back', 'go previous']) || matchesToken(normalized, 'previous') || matchesToken(normalized, 'back')) return 'previous';
    if (matchesAny(normalized, ['play', 'resume', 'continue', 'start reading', 'read this', 'read current article', 'start the news', 'resume reading'])) return 'play';
    if (matchesAny(normalized, ['read headlines', 'headline news', 'latest headlines'])) return 'today-news';

    return null;
}

function shouldProcessVoiceCommand(command) {
    const signature = normalizeText(command);
    if (!signature) return false;

    const now = Date.now();
    if (signature === lastVoiceCommandSignature && now - lastVoiceCommandAt < 1200) {
        return false;
    }

    lastVoiceCommandSignature = signature;
    lastVoiceCommandAt = now;
    return true;
}

function applyTheme(isLight) {
    document.body.classList.toggle('light-mode', isLight);
    themeToggle?.setAttribute('aria-label', isLight ? 'Switch to dark mode' : 'Toggle light mode');
    window.localStorage?.setItem('listenUp-theme', isLight ? 'light' : 'dark');
}

function openCommandPalette() {
    if (!commandPalette) return;

    commandPalette.hidden = false;
    commandPalette.setAttribute('aria-hidden', 'false');
    commandInput?.focus();
    showToast('Command palette opened', 'Search actions or type a voice command.');
}

function closeCommandPalette() {
    if (!commandPalette) return;

    commandPalette.hidden = true;
    commandPalette.setAttribute('aria-hidden', 'true');
    commandTrigger?.focus();
}

function updateVoiceCommandUI() {
    if (!voiceCommandToggle) return;

    voiceCommandToggle.textContent = voiceCommandsEnabled ? 'Voice commands on' : 'Voice commands off';
    voiceCommandToggle.classList.toggle('is-active', voiceCommandsEnabled);
    voiceCommandToggle.setAttribute('aria-pressed', String(voiceCommandsEnabled));
    if (voiceCommandStatus) {
        voiceCommandStatus.textContent = voiceCommandsEnabled
            ? 'Listening for commands like play, pause, next, previous, source BBC, voice Samantha, or mixed digest.'
            : 'Enable microphone support to speak commands like play, next, source BBC, or voice Samantha.';
    }
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
    if (onboardingBackButton) onboardingBackButton.disabled = onboardingStepIndex === 0;
    if (onboardingNextButton) onboardingNextButton.textContent = onboardingStepIndex === onboardingSteps.length - 1 ? 'Finish' : 'Next';

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
    const currentRate = Number.parseFloat(rateRange?.value || '1');
    const nextRate = Math.min(2, Math.max(0.5, currentRate + delta));
    if (rateRange) rateRange.value = String(nextRate.toFixed(2));
    if (rateValue) rateValue.textContent = `${nextRate.toFixed(2).replace(/0$/, '').replace(/\.$/, '')}x`;
    showToast('Speech speed updated', `Now set to ${rateValue?.textContent || `${nextRate}x`}.`);
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

function populateVoiceList() {
    if (!voiceSelect) return;

    voices = synth.getVoices();
    voiceSelect.innerHTML = '';

    const englishVoices = voices.filter((voice) => voice.lang?.startsWith('en'));
    const voicesToUse = englishVoices.length > 0 ? englishVoices : voices;

    voicesToUse.forEach((voice) => {
        const option = document.createElement('option');
        option.textContent = `${voice.name} (${voice.lang})`;
        option.setAttribute('data-lang', voice.lang);
        option.setAttribute('data-name', voice.name);
        voiceSelect.appendChild(option);
    });
}

function populateSourceList() {
    if (!sourceSelect) return;

    sourceSelect.innerHTML = '';

    const mixedOption = document.createElement('option');
    mixedOption.value = 'mixed';
    mixedOption.textContent = 'Mixed Daily Digest';
    sourceSelect.appendChild(mixedOption);

    newsSources.forEach((source) => {
        const option = document.createElement('option');
        option.value = source.rss;
        option.textContent = source.name;
        sourceSelect.appendChild(option);
    });
}

async function fetchArticlesFromUrls(urls) {
    let fetched = [];

    for (const url of urls) {
        try {
            const response = await fetch(`https://api.rss2json.com/v1/api.json?rss_url=${encodeURIComponent(url)}`);
            const data = await response.json();

            if (data.status === 'ok' && Array.isArray(data.items)) {
                const parsed = data.items.map((item) => {
                    const tmp = document.createElement('div');
                    tmp.innerHTML = item.description || item.content || '';
                    return {
                        title: item.title,
                        content: tmp.textContent || tmp.innerText || '',
                    };
                });
                fetched = fetched.concat(parsed);
            }
        } catch (error) {
            console.error(error);
        }
    }

    return fetched;
}

async function fetchNews(rssUrl) {
    stopReading();
    refreshSeconds = 300;
    setLoadingState(true);

    articles = [];
    currentArticleIndex = 0;
    if (titleEl) titleEl.textContent = 'Loading News...';
    if (contentEl) contentEl.textContent = 'Please wait while we fetch the latest articles.';
    if (progressEl) progressEl.textContent = '';

    try {
        const response = await fetch(`https://api.rss2json.com/v1/api.json?rss_url=${encodeURIComponent(rssUrl)}`);
        const data = await response.json();

        if (data.status === 'ok' && data.items.length > 0) {
            articles = data.items.map((item) => {
                const tmp = document.createElement('div');
                tmp.innerHTML = item.description || item.content || '';
                return {
                    title: item.title,
                    content: tmp.textContent || tmp.innerText || '',
                };
            });
            loadArticle(0);
            showToast('Digest loaded', `${articles.length} articles ready.`);
        } else {
            if (titleEl) titleEl.textContent = 'Error';
            if (contentEl) contentEl.textContent = 'Failed to load news articles. Please try another source.';
            showToast('Unable to load articles', 'The selected source returned no usable stories.');
        }
    } catch (error) {
        console.error('Error fetching news:', error);
        if (titleEl) titleEl.textContent = 'Error';
        if (contentEl) contentEl.textContent = 'A network error occurred. Please try another source.';
        showToast('Network error', 'Try another source or load the mixed digest.');
    } finally {
        setLoadingState(false);
    }
}

async function fetchMixedNews() {
    stopReading();
    refreshSeconds = 300;
    setLoadingState(true);

    articles = [];
    currentArticleIndex = 0;
    if (titleEl) titleEl.textContent = 'Loading Daily Digest...';
    if (contentEl) contentEl.textContent = 'Aggregating articles from India and global sources. Please wait...';
    if (progressEl) progressEl.textContent = '';

    try {
        const indianUrls = newsSources.filter((source) => source.region === 'india').map((source) => source.rss);
        const intlUrls = newsSources.filter((source) => source.region === 'intl').map((source) => source.rss);
        const selectedIndianUrls = indianUrls.sort(() => 0.5 - Math.random()).slice(0, 4);
        const selectedIntlUrls = intlUrls.sort(() => 0.5 - Math.random()).slice(0, 4);

        const [indianArticles, intlArticles] = await Promise.all([
            fetchArticlesFromUrls(selectedIndianUrls),
            fetchArticlesFromUrls(selectedIntlUrls),
        ]);

        const combined = [...indianArticles.slice(0, 15), ...intlArticles.slice(0, 10)];

        if (combined.length > 0) {
            articles = combined;
            loadArticle(0);
            showToast('Mixed digest ready', `${articles.length} stories curated from multiple sources.`);
            return true;
        } else {
            if (titleEl) titleEl.textContent = 'Error';
            if (contentEl) contentEl.textContent = 'Failed to load any articles. Please try again.';
            showToast('Digest unavailable', 'No stories could be aggregated right now.');
            return false;
        }
    } catch (error) {
        console.error('Error fetching mixed news:', error);
        if (titleEl) titleEl.textContent = 'Error';
        if (contentEl) contentEl.textContent = 'A network error occurred while aggregating news.';
        showToast('Aggregation failed', 'Please try again in a moment.');
        return false;
    } finally {
        setLoadingState(false);
    }
}

async function fetchRegionalDigest(region) {
    stopReading();
    refreshSeconds = 300;
    setLoadingState(true);

    const regionLabel = region === 'india' ? 'India' : 'Global';
    articles = [];
    currentArticleIndex = 0;
    if (titleEl) titleEl.textContent = `Loading ${regionLabel} News...`;
    if (contentEl) contentEl.textContent = `Curating the latest ${regionLabel.toLowerCase()} stories. Please wait...`;
    if (progressEl) progressEl.textContent = '';

    try {
        const urls = buildRegionalDigestUrls(region);
        const regionalArticles = await fetchArticlesFromUrls(urls);
        const finalArticles = regionalArticles.slice(0, 18);

        if (finalArticles.length > 0) {
            articles = finalArticles;
            loadArticle(0);
            showToast(`${regionLabel} digest ready`, `${articles.length} stories curated.`);
            pushVoiceLog('Digest loaded', `${regionLabel} news`);
        } else {
            if (titleEl) titleEl.textContent = 'Error';
            if (contentEl) contentEl.textContent = `Failed to load ${regionLabel.toLowerCase()} articles. Please try again.`;
            showToast('Digest unavailable', `No ${regionLabel.toLowerCase()} stories could be aggregated right now.`);
        }
    } catch (error) {
        console.error(`Error fetching ${regionLabel.toLowerCase()} digest:`, error);
        if (titleEl) titleEl.textContent = 'Error';
        if (contentEl) contentEl.textContent = `A network error occurred while loading ${regionLabel.toLowerCase()} news.`;
        showToast('Aggregation failed', 'Please try again in a moment.');
    } finally {
        setLoadingState(false);
    }
}

function loadArticle(index) {
    if (articles.length === 0) return;

    currentArticleIndex = Math.min(Math.max(index, 0), articles.length - 1);
    const article = articles[currentArticleIndex];

    if (titleEl) titleEl.textContent = article.title;
    if (contentEl) contentEl.textContent = article.content;
    if (progressEl) progressEl.textContent = `Article ${currentArticleIndex + 1} of ${articles.length}`;

    suppressAutoAdvance = true;
    synth.cancel();
    isPlaying = false;
    updateUI();
}

function playCurrentArticle() {
    if (!articles.length) return;

    suppressAutoAdvance = true;
    synth.cancel();
    const nextUtterance = prepareUtterance();
    if (!nextUtterance) return;

    synth.speak(nextUtterance);
    isPlaying = true;
    updateUI();
}

function advanceArticle(delta, shouldResumePlayback = isPlaying || synth.speaking) {
    if (!articles.length) return;

    const resumePlayback = shouldResumePlayback;
    loadArticle(currentArticleIndex + delta);

    if (resumePlayback) {
        window.setTimeout(playCurrentArticle, 150);
    }
}

function prepareUtterance() {
    if (articles.length === 0) return null;

    const article = articles[currentArticleIndex];
    utterance = new SpeechSynthesisUtterance(`${article.title}. ${article.content}`);

    const selectedVoiceName = voiceSelect?.selectedOptions[0]?.getAttribute('data-name');
    const voice = voices.find((v) => v.name === selectedVoiceName);
    if (voice) utterance.voice = voice;

    utterance.rate = Number.parseFloat(rateRange?.value || '1');

    utterance.onend = () => {
        if (suppressAutoAdvance) {
            suppressAutoAdvance = false;
            return;
        }

        isPlaying = false;
        updateUI();
        if (currentArticleIndex < articles.length - 1) {
            loadArticle(currentArticleIndex + 1);
            window.setTimeout(playCurrentArticle, 400);
        }
    };

    utterance.onerror = (event) => {
        console.error('SpeechSynthesis error:', event);
        isPlaying = false;
        updateUI();
        showToast('Speech playback error', 'Try another voice or source.');
    };

    return utterance;
}

function updateUI() {
    if (playPauseIcon) playPauseIcon.textContent = isPlaying ? '⏸' : '▶';
    if (playPauseText) playPauseText.textContent = isPlaying ? 'Pause' : 'Play';
    if (statusText) statusText.textContent = isPlaying ? 'Status: Playing' : 'Status: Paused';
    btnPlayPause?.setAttribute('aria-label', isPlaying ? 'Pause News' : 'Play News');
}

function togglePlayPause() {
    if (!articles.length) {
        showToast('Nothing loaded yet', 'Loading a digest first.');
        return;
    }

    if (synth.speaking && !synth.paused && isPlaying) {
        synth.pause();
        isPlaying = false;
    } else if (synth.paused) {
        synth.resume();
        isPlaying = true;
    } else {
        const nextUtterance = prepareUtterance();
        if (!nextUtterance) return;
        synth.speak(nextUtterance);
        isPlaying = true;
    }

    updateUI();
    showToast(isPlaying ? 'Playback started' : 'Playback paused', 'Use the controls or spacebar to continue.');
}

function stopReading() {
    suppressAutoAdvance = true;
    synth.cancel();
    isPlaying = false;
    updateUI();
}

function setSourceByName(sourceName) {
    const searchTerm = normalizeText(sourceName);
    const matchingOption = Array.from(sourceSelect?.options || []).find((option) => {
        if (option.value === 'mixed') return false;
        return normalizeText(option.textContent).includes(searchTerm);
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
    const searchTerm = normalizeText(voiceName);
    const matchingOption = Array.from(voiceSelect?.options || []).find((option) => normalizeText(option.textContent).includes(searchTerm));

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
    if (rateRange) rateRange.value = String(clampedRate);
    if (rateValue) rateValue.textContent = `${clampedRate}x`;
    showToast('Speed updated', `Speech rate set to ${clampedRate}x.`);
    return true;
}

function handleVoiceCommand(rawTranscript) {
    const command = normalizeText(rawTranscript);
    if (!shouldProcessVoiceCommand(command)) return;
    if (voiceTranscript) voiceTranscript.textContent = rawTranscript || 'No voice command yet.';
    pushVoiceLog('Heard', rawTranscript || '');

    if (!command) return;

    if (matchesAnyToken(command, ['help'])) {
        openCommandPalette();
        showToast('Voice commands', 'Try play, pause, next, previous, stop, today\'s news, headlines, source Reuters, voice Samantha, or speed 1.25.');
        return;
    }

    if (matchesAny(command, ['show shortcuts', 'voice help', 'assistant help', 'what can i say'])) {
        openCommandPalette();
        showToast('Assistant help', 'Use play, pause, next, previous, stop, today\'s news, source, voice, speed, open dashboard, open feed, or open settings.');
        return;
    }

    const sourceMatch = command.match(/\bsource\s+(.+)$/);
    if (sourceMatch && setSourceByName(sourceMatch[1])) return;

    const voiceMatch = command.match(/\bvoice\s+(.+)$/);
    if (voiceMatch && setVoiceByName(voiceMatch[1])) return;

    const speedMatch = command.match(/\b(?:speed|rate)\s+([0-9]+(?:\.[0-9]+)?)/);
    if (speedMatch && setSpeechRate(speedMatch[1])) return;

    const intent = resolveVoiceIntent(command);

    if (intent === 'dashboard') return void scrollToSection('dashboard');
    if (intent === 'player') return void scrollToSection('player');
    if (intent === 'settings') return void scrollToSection('settings');
    if (intent === 'insights') return void scrollToSection('insights');
    if (intent === 'close-palette') return void closeCommandPalette();
    if (intent === 'open-palette') return void openCommandPalette();
    if (intent === 'voice-off') {
        if (voiceCommandsEnabled) stopVoiceCommands();
        return;
    }
    if (intent === 'voice-on') {
        if (!voiceCommandsEnabled) startVoiceCommands();
        return;
    }
    if (intent === 'today-news' || intent === 'mixed-news') {
        void fetchMixedNews().then((loaded) => {
            if (loaded && intent === 'today-news') playCurrentArticle();
        });
        return;
    }
    if (intent === 'stop') {
        stopReading();
        return;
    }
    if (intent === 'pause') {
        if (isPlaying || synth.speaking) togglePlayPause();
        return;
    }
    if (intent === 'next') {
        advanceArticle(1);
        return;
    }
    if (intent === 'previous') {
        advanceArticle(-1);
        return;
    }
    if (intent === 'play') {
        if (!isPlaying) {
            if (articles.length === 0) {
                void fetchMixedNews().then((loaded) => {
                    if (loaded) playCurrentArticle();
                });
            } else {
                playCurrentArticle();
            }
        }
        return;
    }
    if (intent === 'source') {
        const sourceValue = sourceMatch?.[1];
        if (sourceValue) setSourceByName(sourceValue);
        return;
    }
    if (intent === 'voice') {
        const voiceValue = voiceMatch?.[1];
        if (voiceValue) setVoiceByName(voiceValue);
        return;
    }
    if (intent === 'speed') {
        const speedValue = speedMatch?.[1];
        if (speedValue) setSpeechRate(speedValue);
        return;
    }

    if (matchesAny(command, ['faster', 'speed up', 'increase speed', 'louder'])) return void adjustSpeechRate(0.1);
    if (matchesAny(command, ['slower', 'slow down', 'decrease speed', 'quieter'])) return void adjustSpeechRate(-0.1);

    if (matchesAny(command, ['repeat', 'read again'])) {
        if (titleEl?.textContent) showToast('Current story', `${titleEl.textContent}.`);
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
    recognition.maxAlternatives = 5;

    recognition.onresult = (event) => {
        for (let index = event.resultIndex; index < event.results.length; index += 1) {
            const result = event.results[index];
            if (!result?.isFinal && index !== event.results.length - 1) continue;

            const transcript = getBestRecognitionTranscript(result);
            if (transcript) {
                handleVoiceCommand(transcript);
                break;
            }
        }
    };

    recognition.onerror = (event) => {
        if (event.error === 'not-allowed' || event.error === 'service-not-allowed') {
            voiceCommandsEnabled = false;
            voiceContinuousListening = false;
            updateVoiceCommandUI();
            showToast('Voice commands blocked', 'Allow microphone access to use voice commands.');
        } else if (event.error !== 'aborted') {
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
        if (voiceCommandStatus) voiceCommandStatus.textContent = 'This browser does not support speech recognition.';
        return;
    }

    voiceCommandsEnabled = true;
    voiceContinuousListening = true;
    updateVoiceCommandUI();

    const activeRecognition = getRecognition();
    if (!activeRecognition) return;

    try {
        activeRecognition.start();
        showToast('Voice commands enabled', 'Say play, pause, next, previous, source BBC, voice Samantha, or mixed digest.');
    } catch (error) {
        console.warn('Voice recognition start skipped:', error);
    }
}

function stopVoiceCommands() {
    voiceCommandsEnabled = false;
    voiceContinuousListening = false;
    voicePushToTalkActive = false;
    updateVoiceCommandUI();
    updateVoiceTalkButton();

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

function toggleVoiceCommands() {
    if (voiceCommandsEnabled) stopVoiceCommands();
    else startVoiceCommands();
}

function startPushToTalk() {
    if (!SpeechRecognitionAPI) return;

    const activeRecognition = getRecognition();
    if (!activeRecognition) return;

    voiceCommandsEnabled = true;
    voiceContinuousListening = false;
    voicePushToTalkActive = true;
    updateVoiceTalkButton();
    updateVoiceCommandUI();

    try {
        activeRecognition.start();
    } catch (error) {
        console.warn('Push to talk start skipped:', error);
    }
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
    updateVoiceCommandUI();
}

function setupEventListeners() {
    btnPlayPause?.addEventListener('click', togglePlayPause);
    btnStop?.addEventListener('click', stopReading);
    btnNext?.addEventListener('click', () => {
        advanceArticle(1);
    });
    btnPrev?.addEventListener('click', () => {
        advanceArticle(-1);
    });

    rateRange?.addEventListener('input', () => {
        if (rateValue && rateRange) rateValue.textContent = `${rateRange.value}x`;
    });

    themeToggle?.addEventListener('click', () => {
        const isLight = !document.body.classList.contains('light-mode');
        applyTheme(isLight);
        showToast(isLight ? 'Light mode enabled' : 'Dark mode enabled', 'The workspace theme has been updated.');
    });

    commandTrigger?.addEventListener('click', openCommandPalette);
    searchTrigger?.addEventListener('click', openCommandPalette);
    commandClose?.addEventListener('click', closeCommandPalette);
    commandClose?.addEventListener('mousedown', (event) => {
        event.preventDefault();
        closeCommandPalette();
    });

    voiceCommandToggle?.addEventListener('click', toggleVoiceCommands);
    voiceTalkButton?.addEventListener('mousedown', startPushToTalk);
    voiceTalkButton?.addEventListener('touchstart', startPushToTalk, { passive: true });
    voiceTalkButton?.addEventListener('mouseup', stopPushToTalk);
    voiceTalkButton?.addEventListener('mouseleave', stopPushToTalk);
    voiceTalkButton?.addEventListener('touchend', stopPushToTalk);

    onboardingBackButton?.addEventListener('click', () => advanceOnboardingStep(-1));
    onboardingNextButton?.addEventListener('click', () => {
        if (onboardingStepIndex === onboardingSteps.length - 1) closeOnboarding();
        else advanceOnboardingStep(1);
    });
    onboardingSkipButton?.addEventListener('click', closeOnboarding);
    onboardingCloseButton?.addEventListener('click', closeOnboarding);
    onboardingOverlay?.addEventListener('click', (event) => {
        if (event.target === onboardingOverlay) closeOnboarding();
    });

    commandItems.forEach((item) => {
        item.addEventListener('click', () => {
            const action = item.dataset.command;
            if (action === 'play') togglePlayPause();
            else if (action === 'mixed') void fetchMixedNews();
            else if (action === 'source') sourceSelect?.focus();
            else if (action === 'voice') voiceSelect?.focus();
            closeCommandPalette();
        });
    });

    commandInput?.addEventListener('keydown', (event) => {
        if (event.key === 'Enter') {
            event.preventDefault();
            handleVoiceCommand(commandInput.value);
            commandInput.value = '';
        } else if (event.key === 'Escape') {
            closeCommandPalette();
        }
    });

    document.addEventListener('keydown', (event) => {
        if (event.key === 'Escape') {
            closeCommandPalette();
            if (onboardingOverlay && !onboardingOverlay.hidden) closeOnboarding();
        }

        if (event.key === ' ' && !['INPUT', 'TEXTAREA', 'SELECT'].includes(document.activeElement?.tagName || '')) {
            event.preventDefault();
            togglePlayPause();
        }

        if ((event.metaKey || event.ctrlKey) && event.key.toLowerCase() === 'k') {
            event.preventDefault();
            openCommandPalette();
        }
    });

    sourceSelect?.addEventListener('change', (event) => {
        if (event.target.value === 'mixed') void fetchMixedNews();
        else fetchNews(event.target.value);
    });
}

function startRefreshTimer() {
    if (refreshTimer) window.clearInterval(refreshTimer);

    refreshTimer = window.setInterval(() => {
        refreshSeconds -= 1;
        if (timerTextEl) {
            const minutes = String(Math.floor(refreshSeconds / 60)).padStart(2, '0');
            const seconds = String(refreshSeconds % 60).padStart(2, '0');
            timerTextEl.textContent = `Next update in ${minutes}:${seconds}`;
        }

        if (refreshSeconds <= 0) {
            refreshSeconds = 300;
            const currentSource = sourceSelect?.value || 'mixed';
            if (currentSource === 'mixed') fetchMixedNews();
            else fetchNews(currentSource);
        }
    }, 1000);
}

function init() {
    populateVoiceList();
    populateSourceList();
    updateVoiceCommandUI();
    updateVoiceTalkButton();
    renderOnboardingStep();
    setupEventListeners();
    startRefreshTimer();

    const savedTheme = window.localStorage?.getItem('listenUp-theme');
    applyTheme(savedTheme === 'light');

    if (window.speechSynthesis?.onvoiceschanged !== undefined) {
        window.speechSynthesis.onvoiceschanged = populateVoiceList;
    }

    const onboardingDismissed = window.localStorage?.getItem('listenUp-onboarding-dismissed');
    if (!onboardingDismissed) {
        window.setTimeout(openOnboarding, 350);
    }

    // Load content immediately so playback has something to read.
    fetchMixedNews();
}

init();
