// ==========================================================
// INTERNATIONAL FUTURE SCHOOL
// PRESENTER SCREEN
// ==========================================================


let currentEvent = null;

let timerInterval = null;

let soundPlayed = false;


// ==========================================================
// ELEMENTS
// ==========================================================

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
// LOAD STATISTICS
// ==========================================================

async function loadStats() {

    if (!currentEvent) {
        return;
    }


    const [
        sessionsResult,
        votesResult
    ] =
        await Promise.all([


            supabaseClient
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
                ),


            supabaseClient
                .from('vision_votes')
                .select('choice')
                .eq(
                    'event_id',
                    currentEvent.id
                )


        ]);


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

    const total =
        votes.length;


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


    const value1 =
        Math.round(
            counts.vision_1 /
            total *
            100
        );


    const value2 =
        Math.round(
            counts.vision_2 /
            total *
            100
        );


    const value3 =
        Math.round(
            counts.vision_3 /
            total *
            100
        );


    const valueCustom =
        Math.round(
            counts.custom /
            total *
            100
        );


    updatePercentage(
        percent1,
        bar1,
        value1
    );


    updatePercentage(
        percent2,
        bar2,
        value2
    );


    updatePercentage(
        percent3,
        bar3,
        value3
    );


    updatePercentage(
        percentCustom,
        barCustom,
        valueCustom
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

            requestAnimationFrame(frame);

        }

    }


    requestAnimationFrame(frame);

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


    /*
        Никто ещё не вошёл.

        Показываем полные 5 минут,
        но отсчёт пока НЕ идёт.
    */

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


    const duration =
        currentEvent.duration_seconds *
        1000;


    const end =
        start +
        duration;


    const now =
        Date.now();


    const remaining =
        Math.max(
            0,
            Math.ceil(
                (end - now) /
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


    /*
        Последние десять секунд.
    */

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
        Когда время закончилось,
        один раз воспроизводим звук.
    */

    if (
        remaining <= 0 &&
        !soundPlayed
    ) {

        soundPlayed = true;


        playFinishSound();

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
// FINISH SOUND
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
                    'Автоматический звук заблокирован браузером:',
                    error
                );

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
            'Начать новое голосование?\n\n' +
            'Все предыдущие тестовые голоса ' +
            'и подключения будут удалены.'
        );


    if (!confirmed) {
        return;
    }


    resetVotingButton.disabled =
        true;


    resetVotingButton.textContent =
        'Сбрасываем...';


    try {


        const { error } =
            await supabaseClient.rpc(
                'reset_vision_voting',
                {
                    p_event_key:
                        EVENT_KEY
                }
            );


        if (error) {

            throw error;

        }


        /*
            Новый раунд:
            разрешаем снова сыграть
            звук завершения.
        */

        soundPlayed =
            false;


        /*
            Снова читаем мероприятие.
        */

        await loadEvent();


        /*
            Сразу обновляем статистику.
        */

        await loadStats();


        /*
            Перезапускаем отображение таймера.

            В этот момент он будет показывать 05:00,
            но отсчёт начнётся только после того,
            как первый человек откроет vote.html.
        */

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
            1200
        );


    }
    catch (error) {


        console.error(
            'Reset voting error:',
            error
        );


        alert(
            'Не удалось сбросить голосование.\n' +
            'Проверьте Supabase.'
        );


        resetVotingButton.textContent =
            '↻ Начать заново';


        resetVotingButton.disabled =
            false;

    }

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


        /*
            Изменилось само мероприятие:
            например первый человек вошёл,
            и Supabase записал started_at.
        */

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


                /*
                    Если начался новый раунд,
                    разрешаем звук снова.
                */

                if (
                    currentEvent.status ===
                    'open'
                ) {

                    soundPlayed =
                        false;

                }

            }

        )


        /*
            Новый человек открыл страницу.
        */

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
                    Первый человек запускает trigger,
                    поэтому перечитываем event,
                    чтобы получить started_at.
                */

                await loadEvent();

            }

        )


        /*
            Новый голос.
        */

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
