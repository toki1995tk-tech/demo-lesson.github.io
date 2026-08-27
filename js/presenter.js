// ==========================================================
// INTERNATIONAL FUTURE SCHOOL
// PRESENTER + FINAL ANIMATION
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

        console.error(
            'Load event error:',
            error
        );

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
// LOAD STATISTICS
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
            .select('choice, custom_text')
            .eq(
                'event_id',
                currentEvent.id
            );


    if (sessionsResult.error) {

        console.error(
            'Sessions error:',
            sessionsResult.error
        );

    }


    if (votesResult.error) {

        console.error(
            'Votes error:',
            votesResult.error
        );

    }


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
// COUNTS
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
// NUMBER ANIMATION
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


// ==========================================================
// UPDATE TIMER
// ==========================================================

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


        presenterTimer.classList.remove(
            'timer-warning'
        );


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


    if (remaining > 0) {

        timerLabel.textContent =
            'До завершения голосования';

    }
    else {

        timerLabel.textContent =
            'Голосование завершено';

    }


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


    /*
        00:00

        Проигрываем звук и запускаем финал.
    */

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


    /*
        Голосов вообще нет.
    */

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


    /*
        Ничья.
    */

    if (winners.length > 1) {

        return {
            type: 'tie',
            winners: winners.map(
                item => item[0]
            )
        };

    }


    return {
        type: 'winner',
        winner: winners[0][0],
        count: highest
    };

}


// ==========================================================
// FINAL SEQUENCE
// ==========================================================

async function startFinalSequence() {

    await loadStats();


    const result =
        determineWinner();


    /*
        Плавно убираем весь экран голосования.
    */

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


    /*
        Ничья.
    */

    if (
        result.type === 'tie' ||
        result.type === 'none'
    ) {

        showTieResult();

        return;

    }


    /*
        Победило Своё видение.
        Полную AI-сцену сделаем следующим этапом.
    */

    if (
        result.winner === 'custom'
    ) {

        showCustomWinner();

        return;

    }


    /*
        Готовое видение.
    */

    runVisionMissionAnimation(
        result.winner
    );

}


// ==========================================================
// READY VISION → MISSION
// ==========================================================

async function runVisionMissionAnimation(
    winner
) {

    const data =
        getWinnerData(
            winner
        );


    finalVisionLabel.textContent =
        data.label;


    /*
        Получаем ключевые слова из Supabase.
    */

    const keywords =
        parseKeywords(
            data.keywords
        );


    /*
        Очищаем предыдущий тест.
    */

    keywordCloud.innerHTML =
        '';


    missionResult.classList.remove(
        'mission-visible'
    );


    /*
        Создаём слова.
    */

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
        ШАГ 1
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
        ШАГ 2
        Они немного парят.
    */

    await wait(3300);


    /*
        ШАГ 3
        Каждое слово начинает находить
        своё место в центре.
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
        1400 +
        elements.length * 140
    );


    /*
        ШАГ 4
        Ключевые смыслы растворяются.
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
        ШАГ 5
        Появляется миссия.
    */

    finalMissionText.textContent =
        data.mission;


    missionResult.classList.add(
        'mission-visible'
    );

}


// ==========================================================
// WINNER DATA
// ==========================================================

function getWinnerData(winner) {

    if (winner === 'vision_1') {

        return {

            label:
                'ВИДЕНИЕ 01',

            mission:
                currentEvent.mission_1,

            keywords:
                currentEvent.keywords_1

        };

    }


    if (winner === 'vision_2') {

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

function parseKeywords(value) {

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
// KEYWORD POSITIONS
// ==========================================================

function createPositions(count) {

    const basePositions = [

        {
            x: 22,
            y: 28,
            dx: 18,
            dy: -14
        },

        {
            x: 51,
            y: 21,
            dx: -15,
            dy: 12
        },

        {
            x: 76,
            y: 31,
            dx: 14,
            dy: 16
        },

        {
            x: 31,
            y: 51,
            dx: -19,
            dy: -10
        },

        {
            x: 64,
            y: 48,
            dx: 18,
            dy: -13
        },

        {
            x: 18,
            y: 69,
            dx: 15,
            dy: 14
        },

        {
            x: 50,
            y: 70,
            dx: -16,
            dy: 12
        },

        {
            x: 79,
            y: 66,
            dx: -14,
            dy: -16
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
// CUSTOM WINNER
// ==========================================================

function showCustomWinner() {

    finalVisionLabel.classList.add(
        'hidden'
    );


    keywordCloud.classList.add(
        'hidden'
    );


    missionResult.classList.add(
        'hidden'
    );


    tieResult.classList.add(
        'hidden'
    );


    customWinnerResult.classList.remove(
        'hidden'
    );


    requestAnimationFrame(
        () => {

            customWinnerResult.classList.add(
                'custom-winner-visible'
            );

        }
    );

}


// ==========================================================
// TEST FINAL BUTTON
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
