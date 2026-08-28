// ==========================================================
// INTERNATIONAL FUTURE SCHOOL
// PRESENTER + FINAL ANIMATION + AI CUSTOM MISSION
// ==========================================================


let currentEvent = null;
let currentVotes = [];

let timerInterval = null;

let soundPlayed = false;
let finalStarted = false;


// ==========================================================
// ELEMENTS
// ==========================================================

const votingScreen =
    document.getElementById('votingScreen');

const finalScene =
    document.getElementById('finalScene');

const keywordCloud =
    document.getElementById('keywordCloud');

const missionResult =
    document.getElementById('missionResult');

const finalMissionText =
    document.getElementById('finalMissionText');

const finalVisionLabel =
    document.getElementById('finalVisionLabel');

const tieResult =
    document.getElementById('tieResult');

const customWinnerResult =
    document.getElementById('customWinnerResult');


const schoolName =
    document.getElementById('schoolName');

const schoolSlogan =
    document.getElementById('schoolSlogan');

const pageTitle =
    document.getElementById('pageTitle');


const vision1Text =
    document.getElementById('vision1Text');

const vision2Text =
    document.getElementById('vision2Text');

const vision3Text =
    document.getElementById('vision3Text');

const customTitle =
    document.getElementById('customTitle');


const percent1 =
    document.getElementById('percent1');

const percent2 =
    document.getElementById('percent2');

const percent3 =
    document.getElementById('percent3');

const percentCustom =
    document.getElementById('percentCustom');


const bar1 =
    document.getElementById('bar1');

const bar2 =
    document.getElementById('bar2');

const bar3 =
    document.getElementById('bar3');

const barCustom =
    document.getElementById('barCustom');


const joinedCount =
    document.getElementById('joinedCount');

const votedCount =
    document.getElementById('votedCount');


const presenterTimer =
    document.getElementById('presenterTimer');

const timerLabel =
    document.getElementById('timerLabel');


const finishSound =
    document.getElementById('finishSound');


const resetVotingButton =
    document.getElementById('resetVotingButton');

const testFinalButton =
    document.getElementById('testFinalButton');


// ==========================================================
// START
// ==========================================================

document.addEventListener(
    'DOMContentLoaded',
    async () => {

        try {

            await loadEvent();

            await loadStats();

            setupResetButton();

            setupTestFinalButton();

            subscribeToRealtime();

            startTimer();

        }
        catch (error) {

            console.error(
                'Presenter start error:',
                error
            );

        }

    }
);


// ==========================================================
// LOAD EVENT
// ==========================================================

async function loadEvent() {

    const { data, error } =
        await supabaseClient
            .from('vision_event')
            .select('*')
            .eq(
                'event_key',
                EVENT_KEY
            )
            .single();


    if (error) {
        throw error;
    }


    currentEvent = data;

    renderEvent();

}


// ==========================================================
// RENDER EVENT
// ==========================================================

function renderEvent() {

    if (!currentEvent) {
        return;
    }


    schoolName.textContent =
        currentEvent.school_name;

    schoolSlogan.textContent =
        currentEvent.slogan;

    pageTitle.textContent =
        currentEvent.page_title;

    vision1Text.textContent =
        currentEvent.vision_1;

    vision2Text.textContent =
        currentEvent.vision_2;

    vision3Text.textContent =
        currentEvent.vision_3;

    customTitle.textContent =
        currentEvent.custom_title;

}


// ==========================================================
// LOAD STATS
// ==========================================================

async function loadStats() {

    if (!currentEvent) {
        return;
    }


    const sessionsResult =
        await supabaseClient
            .from('vision_sessions')
            .select(
                'id',
                {
                    count: 'exact',
                    head: true
                }
            )
            .eq(
                'event_id',
                currentEvent.id
            );


    const votesResult =
        await supabaseClient
            .from('vision_votes')
            .select(
                'choice, custom_text'
            )
            .eq(
                'event_id',
                currentEvent.id
            );


    joinedCount.textContent =
        sessionsResult.count || 0;


    currentVotes =
        votesResult.data || [];


    votedCount.textContent =
        currentVotes.length;


    calculatePercentages(
        currentVotes
    );

}


// ==========================================================
// VOTE COUNTS
// ==========================================================

function getVoteCounts(votes) {

    const counts = {

        vision_1: 0,
        vision_2: 0,
        vision_3: 0,
        custom: 0

    };


    votes.forEach(
        vote => {

            if (
                Object.prototype.hasOwnProperty.call(
                    counts,
                    vote.choice
                )
            ) {

                counts[vote.choice]++;

            }

        }
    );


    return counts;

}


// ==========================================================
// PERCENTAGES
// ==========================================================

function calculatePercentages(votes) {

    const total =
        votes.length;


    const counts =
        getVoteCounts(votes);


    if (total === 0) {

        updatePercentage(
            percent1,
            bar1,
            0
        );

        updatePercentage(
            percent2,
            bar2,
            0
        );

        updatePercentage(
            percent3,
            bar3,
            0
        );

        updatePercentage(
            percentCustom,
            barCustom,
            0
        );

        return;

    }


    updatePercentage(
        percent1,
        bar1,
        Math.round(
            counts.vision_1 /
            total *
            100
        )
    );


    updatePercentage(
        percent2,
        bar2,
        Math.round(
            counts.vision_2 /
            total *
            100
        )
    );


    updatePercentage(
        percent3,
        bar3,
        Math.round(
            counts.vision_3 /
            total *
            100
        )
    );


    updatePercentage(
        percentCustom,
        barCustom,
        Math.round(
            counts.custom /
            total *
            100
        )
    );

}


// ==========================================================
// UPDATE PERCENTAGE
// ==========================================================

function updatePercentage(
    textElement,
    barElement,
    target
) {

    const current =
        Number(
            textElement.dataset.value ||
            0
        );


    animateNumber(
        textElement,
        current,
        target
    );


    barElement.style.width =
        `${target}%`;


    textElement.dataset.value =
        target;

}


// ==========================================================
// ANIMATE NUMBER
// ==========================================================

function animateNumber(
    element,
    from,
    to
) {

    const duration =
        450;


    const start =
        performance.now();


    function frame(now) {

        const progress =
            Math.min(
                1,
                (now - start) /
                duration
            );


        const value =
            Math.round(
                from +
                (to - from) *
                progress
            );


        element.textContent =
            `${value}%`;


        if (progress < 1) {

            requestAnimationFrame(
                frame
            );

        }

    }


    requestAnimationFrame(
        frame
    );

}


// ==========================================================
// TIMER
// ==========================================================

function startTimer() {

    if (timerInterval) {

        clearInterval(
            timerInterval
        );

    }


    updateTimer();


    timerInterval =
        setInterval(
            updateTimer,
            500
        );

}


function updateTimer() {

    if (!currentEvent) {
        return;
    }


    if (!currentEvent.started_at) {

        presenterTimer.textContent =
            formatSeconds(
                currentEvent.duration_seconds ||
                300
            );


        timerLabel.textContent =
            'Ожидаем первого участника';


        return;

    }


    const start =
        new Date(
            currentEvent.started_at
        ).getTime();


    const end =
        start +
        currentEvent.duration_seconds *
        1000;


    const remaining =
        Math.max(
            0,
            Math.ceil(
                (end - Date.now()) /
                1000
            )
        );


    presenterTimer.textContent =
        formatSeconds(
            remaining
        );


    timerLabel.textContent =
        remaining > 0
            ? 'До завершения голосования'
            : 'Голосование завершено';


    if (
        remaining <= 10 &&
        remaining > 0
    ) {

        presenterTimer.classList.add(
            'timer-warning'
        );

    }
    else {

        presenterTimer.classList.remove(
            'timer-warning'
        );

    }


    if (
        remaining <= 0 &&
        !finalStarted
    ) {

        finalStarted =
            true;


        if (!soundPlayed) {

            soundPlayed =
                true;

            playFinishSound();

        }


        setTimeout(
            () => {

                startFinalSequence();

            },
            900
        );

    }

}


// ==========================================================
// FORMAT TIMER
// ==========================================================

function formatSeconds(
    totalSeconds
) {

    const minutes =
        Math.floor(
            totalSeconds / 60
        );


    const seconds =
        totalSeconds % 60;


    return (
        String(minutes)
            .padStart(2, '0')
        +
        ':'
        +
        String(seconds)
            .padStart(2, '0')
    );

}


// ==========================================================
// SOUND
// ==========================================================

function playFinishSound() {

    if (!finishSound) {
        return;
    }


    finishSound.currentTime =
        0;


    finishSound
        .play()
        .catch(
            error => {

                console.warn(
                    'Sound blocked:',
                    error
                );

            }
        );

}


// ==========================================================
// DETERMINE WINNER
// ==========================================================

function determineWinner() {

    const counts =
        getVoteCounts(
            currentVotes
        );


    const entries =
        Object.entries(
            counts
        );


    const highest =
        Math.max(
            ...entries.map(
                entry => entry[1]
            )
        );


    if (highest === 0) {

        return {
            type: 'none'
        };

    }


    const winners =
        entries.filter(
            entry =>
                entry[1] === highest
        );


    if (
        winners.length > 1
    ) {

        return {
            type: 'tie'
        };

    }


    return {

        type: 'winner',

        winner:
            winners[0][0]

    };

}


// ==========================================================
// FINAL SEQUENCE
// ==========================================================

async function startFinalSequence() {

    await loadStats();


    const result =
        determineWinner();


    votingScreen.classList.add(
        'voting-screen-exit'
    );


    await wait(900);


    votingScreen.classList.add(
        'hidden'
    );


    finalScene.classList.remove(
        'hidden'
    );


    requestAnimationFrame(
        () => {

            finalScene.classList.add(
                'final-scene-visible'
            );

        }
    );


    if (
        result.type === 'tie' ||
        result.type === 'none'
    ) {

        showTieResult();

        return;

    }


    /*
        СВОЁ ВИДЕНИЕ
        Теперь здесь НЕ заглушка.
        Запускаем AI-сцену.
    */

    if (
        result.winner === 'custom'
    ) {

        await runCustomMissionAnimation();

        return;

    }


    /*
        Обычные три видения
    */

    await runVisionMissionAnimation(
        result.winner
    );

}


// ==========================================================
// READY VISION → MISSION
// ==========================================================

async function runVisionMissionAnimation(
    winner
) {

    resetFinalElements();


    const data =
        getWinnerData(
            winner
        );


    finalVisionLabel.textContent =
        data.label;


    const keywords =
        parseKeywords(
            data.keywords
        );


    await animateKeywordsToMission(
        keywords,
        data.mission
    );

}


// ==========================================================
// CUSTOM VISION → AI → MISSION
// ==========================================================

async function runCustomMissionAnimation() {

    resetFinalElements();


    finalVisionLabel.textContent =
        'СВОЁ ВИДЕНИЕ';


    /*
        Берём реальные предложения участников.
    */

    const customIdeas =
        currentVotes
            .filter(
                vote =>
                    vote.choice ===
                    'custom'
            )
            .map(
                vote =>
                    String(
                        vote.custom_text || ''
                    ).trim()
            )
            .filter(Boolean);


    if (
        customIdeas.length === 0
    ) {

        showAIError(
            'Не найдено предложений участников.'
        );

        return;

    }


    /*
        ВАЖНО:

        Сразу запускаем AI в фоне.

        Пока люди смотрят на плавающие идеи,
        OpenAI уже формирует миссию.
    */

    const aiPromise =
        generateCustomMission();


    /*
        ШАГ 1
        Показываем реальные идеи участников.
    */

    await showParticipantIdeas(
        customIdeas
    );


    /*
        Даём им немного попарить.
    */

    await wait(3500);


    /*
        К этому моменту AI обычно уже ответил.
    */

    let aiResult;


    try {

        aiResult =
            await aiPromise;

    }
    catch (error) {

        console.error(
            'AI mission failed:',
            error
        );


        showAIError(
            'Не удалось сформулировать миссию.'
        );

        return;

    }


    /*
        Убираем пользовательские фразы.
    */

    const ideaElements =
        Array.from(
            document.querySelectorAll(
                '.floating-keyword'
            )
        );


    ideaElements.forEach(
        element => {

            element.classList.add(
                'keyword-disappear'
            );

        }
    );


    await wait(800);


    keywordCloud.innerHTML =
        '';


    /*
        Теперь появляются именно ключевые смыслы,
        которые выделил AI.
    */

    await animateKeywordsToMission(
        aiResult.keywords,
        aiResult.mission
    );

}


// ==========================================================
// CALL SUPABASE EDGE FUNCTION
// ==========================================================

async function generateCustomMission() {

    console.log(
        'Calling generate-custom-mission...'
    );


    const {
        data,
        error
    } =
        await supabaseClient.functions.invoke(
            'generate-custom-mission',
            {

                body: {

                    event_key:
                        EVENT_KEY

                }

            }
        );


    if (error) {

        console.error(
            'Edge Function error:',
            error
        );


        throw error;

    }


    if (
        !data ||
        data.ok !== true
    ) {

        console.error(
            'AI result:',
            data
        );


        throw new Error(
            data?.error ||
            'AI returned invalid result'
        );

    }


    console.log(
        'AI mission:',
        data
    );


    return data;

}


// ==========================================================
// SHOW REAL PARTICIPANT IDEAS
// ==========================================================

async function showParticipantIdeas(
    ideas
) {

    keywordCloud.innerHTML =
        '';


    /*
        Чтобы экран не перегрузился,
        одновременно показываем максимум 12 идей.
    */

    const visibleIdeas =
        ideas.slice(
            0,
            12
        );


    const positions =
        createPositions(
            visibleIdeas.length
        );


    visibleIdeas.forEach(
        (idea, index) => {

            const element =
                document.createElement(
                    'div'
                );


            element.className =
                'floating-keyword';


            /*
                Если предложение очень длинное,
                визуально немного сокращаем его.

                В AI всё равно уходит ПОЛНЫЙ текст.
            */

            element.textContent =
                shortenIdea(
                    idea
                );


            element.style.left =
                `${positions[index].x}%`;


            element.style.top =
                `${positions[index].y}%`;


            element.style.setProperty(
                '--delay',
                `${index * 0.11}s`
            );


            element.style.setProperty(
                '--float-x',
                `${positions[index].dx}px`
            );


            element.style.setProperty(
                '--float-y',
                `${positions[index].dy}px`
            );


            /*
                Для предложений участников
                делаем текст чуть меньше.
            */

            element.style.fontSize =
                'clamp(17px, 1.5vw, 25px)';


            element.style.maxWidth =
                '360px';


            element.style.whiteSpace =
                'normal';


            element.style.textAlign =
                'center';


            keywordCloud.appendChild(
                element
            );

        }
    );


    await wait(120);


    document
        .querySelectorAll(
            '.floating-keyword'
        )
        .forEach(
            element => {

                element.classList.add(
                    'keyword-visible'
                );

            }
        );

}


// ==========================================================
// SHORTEN IDEA ONLY FOR SCREEN
// ==========================================================

function shortenIdea(
    text
) {

    const limit =
        90;


    if (
        text.length <= limit
    ) {

        return text;

    }


    return (
        text.slice(
            0,
            limit
        ).trim()
        +
        '…'
    );

}


// ==========================================================
// KEYWORDS → MISSION
// ==========================================================

async function animateKeywordsToMission(
    keywords,
    mission
) {

    keywordCloud.innerHTML =
        '';


    missionResult.classList.remove(
        'mission-visible'
    );


    const positions =
        createPositions(
            keywords.length
        );


    keywords.forEach(
        (word, index) => {

            const element =
                document.createElement(
                    'div'
                );


            element.className =
                'floating-keyword';


            element.textContent =
                word;


            element.style.left =
                `${positions[index].x}%`;


            element.style.top =
                `${positions[index].y}%`;


            element.style.setProperty(
                '--delay',
                `${index * 0.13}s`
            );


            element.style.setProperty(
                '--float-x',
                `${positions[index].dx}px`
            );


            element.style.setProperty(
                '--float-y',
                `${positions[index].dy}px`
            );


            keywordCloud.appendChild(
                element
            );

        }
    );


    /*
        Слова появляются.
    */

    await wait(150);


    document
        .querySelectorAll(
            '.floating-keyword'
        )
        .forEach(
            element => {

                element.classList.add(
                    'keyword-visible'
                );

            }
        );


    /*
        Немного парят.
    */

    await wait(3000);


    /*
        Собираются в центр.
    */

    const elements =
        Array.from(
            document.querySelectorAll(
                '.floating-keyword'
            )
        );


    elements.forEach(
        (element, index) => {

            setTimeout(
                () => {

                    element.classList.add(
                        'keyword-assemble'
                    );

                },
                index * 140
            );

        }
    );


    await wait(
        1300 +
        elements.length *
        140
    );


    /*
        Растворяются.
    */

    elements.forEach(
        element => {

            element.classList.add(
                'keyword-disappear'
            );

        }
    );


    await wait(650);


    /*
        И появляется итоговая миссия.
    */

    finalMissionText.textContent =
        mission;


    missionResult.classList.add(
        'mission-visible'
    );

}


// ==========================================================
// WINNER DATA
// ==========================================================

function getWinnerData(
    winner
) {

    if (
        winner === 'vision_1'
    ) {

        return {

            label:
                'ВИДЕНИЕ 01',

            mission:
                currentEvent.mission_1,

            keywords:
                currentEvent.keywords_1

        };

    }


    if (
        winner === 'vision_2'
    ) {

        return {

            label:
                'ВИДЕНИЕ 02',

            mission:
                currentEvent.mission_2,

            keywords:
                currentEvent.keywords_2

        };

    }


    return {

        label:
            'ВИДЕНИЕ 03',

        mission:
            currentEvent.mission_3,

        keywords:
            currentEvent.keywords_3

    };

}


// ==========================================================
// PARSE KEYWORDS
// ==========================================================

function parseKeywords(
    value
) {

    if (!value) {
        return [];
    }


    return value
        .split(',')
        .map(
            item =>
                item.trim()
        )
        .filter(Boolean);

}


// ==========================================================
// POSITIONS
// ==========================================================

function createPositions(
    count
) {

    const basePositions = [

        {
            x: 18,
            y: 26,
            dx: 18,
            dy: -12
        },

        {
            x: 43,
            y: 20,
            dx: -14,
            dy: 13
        },

        {
            x: 70,
            y: 25,
            dx: 17,
            dy: 14
        },

        {
            x: 85,
            y: 42,
            dx: -17,
            dy: -11
        },

        {
            x: 25,
            y: 48,
            dx: -18,
            dy: 12
        },

        {
            x: 56,
            y: 45,
            dx: 16,
            dy: -14
        },

        {
            x: 14,
            y: 70,
            dx: 17,
            dy: 13
        },

        {
            x: 38,
            y: 72,
            dx: -15,
            dy: -12
        },

        {
            x: 65,
            y: 69,
            dx: 18,
            dy: 11
        },

        {
            x: 84,
            y: 68,
            dx: -16,
            dy: -13
        },

        {
            x: 47,
            y: 58,
            dx: 13,
            dy: 16
        },

        {
            x: 74,
            y: 53,
            dx: -14,
            dy: 14
        }

    ];


    return Array.from(
        {
            length: count
        },
        (_, index) => {

            return (
                basePositions[
                    index %
                    basePositions.length
                ]
            );

        }
    );

}


// ==========================================================
// RESET FINAL ELEMENTS
// ==========================================================

function resetFinalElements() {

    keywordCloud.innerHTML =
        '';


    keywordCloud.classList.remove(
        'hidden'
    );


    missionResult.classList.remove(
        'hidden'
    );


    missionResult.classList.remove(
        'mission-visible'
    );


    tieResult.className =
        'tie-result hidden';


    customWinnerResult.className =
        'custom-winner-result hidden';


    finalVisionLabel.classList.remove(
        'hidden'
    );

}


// ==========================================================
// TIE
// ==========================================================

function showTieResult() {

    finalVisionLabel.classList.add(
        'hidden'
    );


    keywordCloud.classList.add(
        'hidden'
    );


    missionResult.classList.add(
        'hidden'
    );


    customWinnerResult.classList.add(
        'hidden'
    );


    tieResult.classList.remove(
        'hidden'
    );


    requestAnimationFrame(
        () => {

            tieResult.classList.add(
                'tie-visible'
            );

        }
    );

}


// ==========================================================
// AI ERROR
// ==========================================================

function showAIError(
    message
) {

    keywordCloud.innerHTML =
        '';


    finalVisionLabel.textContent =
        'СВОЁ ВИДЕНИЕ';


    customWinnerResult.classList.remove(
        'hidden'
    );


    customWinnerResult.innerHTML = `

        <div class="mission-eyebrow">
            НЕ УДАЛОСЬ СФОРМУЛИРОВАТЬ МИССИЮ
        </div>

        <div
            class="custom-winner-title"
            style="font-size: 38px;"
        >
            ${escapeHtml(message)}
        </div>

    `;


    requestAnimationFrame(
        () => {

            customWinnerResult.classList.add(
                'custom-winner-visible'
            );

        }
    );

}


// ==========================================================
// ESCAPE HTML
// ==========================================================

function escapeHtml(
    text
) {

    const div =
        document.createElement(
            'div'
        );


    div.textContent =
        text;


    return div.innerHTML;

}


// ==========================================================
// TEST FINAL
// ==========================================================

function setupTestFinalButton() {

    if (!testFinalButton) {
        return;
    }


    testFinalButton.addEventListener(
        'click',
        async () => {

            if (finalStarted) {
                return;
            }


            await loadStats();


            finalStarted =
                true;


            startFinalSequence();

        }
    );

}


// ==========================================================
// RESET BUTTON
// ==========================================================

function setupResetButton() {

    if (!resetVotingButton) {
        return;
    }


    resetVotingButton.addEventListener(
        'click',
        resetVoting
    );

}


// ==========================================================
// RESET VOTING
// ==========================================================

async function resetVoting() {

    const confirmed =
        confirm(
            'Начать голосование заново?\n\n' +
            'Все предыдущие голоса и подключения будут удалены.'
        );


    if (!confirmed) {
        return;
    }


    resetVotingButton.disabled =
        true;


    resetVotingButton.textContent =
        'Сбрасываем...';


    try {

        const {
            data,
            error
        } =
            await supabaseClient.rpc(
                'reset_vision_voting'
            );


        if (error) {

            throw new Error(
                error.message
            );

        }


        if (
            data &&
            data.ok === false
        ) {

            throw new Error(
                data.message ||
                'Reset failed'
            );

        }


        soundPlayed =
            false;


        finalStarted =
            false;


        await loadEvent();

        await loadStats();


        restoreVotingScreen();


        startTimer();


        resetVotingButton.textContent =
            '✓ Готово';


        setTimeout(
            () => {

                resetVotingButton.textContent =
                    '↻ Начать заново';


                resetVotingButton.disabled =
                    false;

            },
            1000
        );

    }
    catch (error) {

        console.error(
            'RESET FAILED:',
            error
        );


        alert(
            'Не удалось сбросить голосование.\n\n' +
            'Ошибка: ' +
            error.message
        );


        resetVotingButton.textContent =
            '↻ Начать заново';


        resetVotingButton.disabled =
            false;

    }

}


// ==========================================================
// RESTORE SCREEN
// ==========================================================

function restoreVotingScreen() {

    finalScene.className =
        'final-scene hidden';


    keywordCloud.innerHTML =
        '';


    keywordCloud.className =
        'keyword-cloud';


    missionResult.className =
        'mission-result';


    tieResult.className =
        'tie-result hidden';


    customWinnerResult.className =
        'custom-winner-result hidden';


    finalVisionLabel.className =
        'final-vision-label';


    votingScreen.className =
        'presenter-screen';


    updatePercentage(
        percent1,
        bar1,
        0
    );


    updatePercentage(
        percent2,
        bar2,
        0
    );


    updatePercentage(
        percent3,
        bar3,
        0
    );


    updatePercentage(
        percentCustom,
        barCustom,
        0
    );

}


// ==========================================================
// REALTIME
// ==========================================================

function subscribeToRealtime() {

    if (!currentEvent) {
        return;
    }


    supabaseClient

        .channel(
            `presenter-${currentEvent.id}`
        )


        .on(
            'postgres_changes',
            {
                event: 'UPDATE',
                schema: 'public',
                table: 'vision_event',
                filter:
                    `id=eq.${currentEvent.id}`
            },
            payload => {

                currentEvent =
                    payload.new;

                renderEvent();

            }
        )


        .on(
            'postgres_changes',
            {
                event: '*',
                schema: 'public',
                table: 'vision_sessions',
                filter:
                    `event_id=eq.${currentEvent.id}`
            },
            async () => {

                await loadStats();

                await loadEvent();

            }
        )


        .on(
            'postgres_changes',
            {
                event: '*',
                schema: 'public',
                table: 'vision_votes',
                filter:
                    `event_id=eq.${currentEvent.id}`
            },
            async () => {

                await loadStats();

            }
        )


        .subscribe();

}


// ==========================================================
// WAIT
// ==========================================================

function wait(ms) {

    return new Promise(
        resolve =>
            setTimeout(
                resolve,
                ms
            )
    );

}
