// ==========================================================
// FUTURE SCHOOL — PRESENTER SCREEN
// ==========================================================

let currentEvent = null;
let timerInterval = null;

const schoolName = document.getElementById('schoolName');
const schoolSlogan = document.getElementById('schoolSlogan');
const pageTitle = document.getElementById('pageTitle');

const vision1Text = document.getElementById('vision1Text');
const vision2Text = document.getElementById('vision2Text');
const vision3Text = document.getElementById('vision3Text');
const customTitle = document.getElementById('customTitle');

const percent1 = document.getElementById('percent1');
const percent2 = document.getElementById('percent2');
const percent3 = document.getElementById('percent3');
const percentCustom = document.getElementById('percentCustom');

const bar1 = document.getElementById('bar1');
const bar2 = document.getElementById('bar2');
const bar3 = document.getElementById('bar3');
const barCustom = document.getElementById('barCustom');

const joinedCount = document.getElementById('joinedCount');
const votedCount = document.getElementById('votedCount');

const presenterTimer = document.getElementById('presenterTimer');
const timerLabel = document.getElementById('timerLabel');

const finishSound = document.getElementById('finishSound');

let soundPlayed = false;


// ==========================================================
// START
// ==========================================================

document.addEventListener('DOMContentLoaded', async () => {

    try {

        await loadEvent();

        await loadStats();

        startTimer();

        subscribeToRealtime();

    } catch (error) {

        console.error(error);

    }

});


// ==========================================================
// LOAD EVENT
// ==========================================================

async function loadEvent() {

    const { data, error } = await supabaseClient
        .from('vision_event')
        .select('*')
        .eq('event_key', EVENT_KEY)
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

    const [
        sessionsResult,
        votesResult
    ] = await Promise.all([

        supabaseClient
            .from('vision_sessions')
            .select('id', {
                count: 'exact',
                head: true
            })
            .eq('event_id', currentEvent.id),

        supabaseClient
            .from('vision_votes')
            .select('choice')
            .eq('event_id', currentEvent.id)

    ]);


    if (sessionsResult.error) {
        console.error(sessionsResult.error);
    }

    if (votesResult.error) {
        console.error(votesResult.error);
    }


    joinedCount.textContent =
        sessionsResult.count || 0;


    const votes =
        votesResult.data || [];


    votedCount.textContent =
        votes.length;


    calculatePercentages(votes);

}


// ==========================================================
// CALCULATE PERCENTAGES
// ==========================================================

function calculatePercentages(votes) {

    const total = votes.length;


    const counts = {
        vision_1: 0,
        vision_2: 0,
        vision_3: 0,
        custom: 0
    };


    votes.forEach(vote => {

        if (
            counts.hasOwnProperty(
                vote.choice
            )
        ) {

            counts[vote.choice]++;

        }

    });


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
// ANIMATE PERCENTAGE
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

    const duration = 500;

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

            requestAnimationFrame(frame);

        }

    }


    requestAnimationFrame(frame);

}


// ==========================================================
// TIMER
// ==========================================================

function startTimer() {

    updateTimer();

    timerInterval =
        setInterval(
            updateTimer,
            500
        );

}


function updateTimer() {

    if (
        !currentEvent ||
        !currentEvent.started_at
    ) {

        presenterTimer.textContent =
            formatSeconds(
                currentEvent?.duration_seconds ||
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
        (
            currentEvent.duration_seconds *
            1000
        );


    const remaining =
        Math.max(
            0,
            Math.ceil(
                (end - Date.now()) /
                1000
            )
        );


    presenterTimer.textContent =
        formatSeconds(remaining);


    timerLabel.textContent =
        remaining > 0
            ? 'До завершения голосования'
            : 'Голосование завершено';


    if (remaining <= 10) {

        presenterTimer.classList.add(
            'timer-warning'
        );

    } else {

        presenterTimer.classList.remove(
            'timer-warning'
        );

    }


    if (
        remaining <= 0 &&
        !soundPlayed
    ) {

        soundPlayed = true;

        playFinishSound();

    }

}


// ==========================================================
// SOUND
// ==========================================================

function playFinishSound() {

    if (!finishSound) {
        return;
    }

    finishSound.currentTime = 0;

    finishSound
        .play()
        .catch(error => {

            console.warn(
                'Браузер заблокировал автоматический звук:',
                error
            );

        });

}


// ==========================================================
// FORMAT TIME
// ==========================================================

function formatSeconds(totalSeconds) {

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
// REALTIME
// ==========================================================

function subscribeToRealtime() {

    supabaseClient
        .channel(
            `presenter-${currentEvent.id}`
        )

        // --------------------------------------------------
        // EVENT
        // --------------------------------------------------

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

        // --------------------------------------------------
        // SESSIONS
        // --------------------------------------------------

        .on(
            'postgres_changes',
            {
                event: 'INSERT',
                schema: 'public',
                table: 'vision_sessions',
                filter:
                    `event_id=eq.${currentEvent.id}`
            },
            async () => {

                await loadStats();

                /*
                    После первого участника
                    trigger меняет started_at.

                    На всякий случай перечитываем
                    событие.
                */

                await loadEvent();

            }
        )

        // --------------------------------------------------
        // VOTES
        // --------------------------------------------------

        .on(
            'postgres_changes',
            {
                event: 'INSERT',
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
