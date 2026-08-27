// ==========================================================
// FUTURE SCHOOL — PARTICIPANT VOTING PAGE
// ==========================================================


let currentEvent = null;
let sessionId = null;
let timerInterval = null;


// ==========================================================
// DOM
// ==========================================================

const loadingBlock = document.getElementById('loadingBlock');
const votingBlock = document.getElementById('votingBlock');
const successBlock = document.getElementById('successBlock');
const closedBlock = document.getElementById('closedBlock');

const technicalError = document.getElementById('technicalError');
const technicalErrorText =
    document.getElementById('technicalErrorText');

const schoolName = document.getElementById('schoolName');
const schoolSlogan = document.getElementById('schoolSlogan');

const vision1Text = document.getElementById('vision1Text');
const vision2Text = document.getElementById('vision2Text');
const vision3Text = document.getElementById('vision3Text');

const customTitle = document.getElementById('customTitle');
const customVision = document.getElementById('customVision');
const customCounter = document.getElementById('customCounter');

const submitVote = document.getElementById('submitVote');
const formError = document.getElementById('formError');

const participantTimer =
    document.getElementById('participantTimer');


// ==========================================================
// START
// ==========================================================

document.addEventListener('DOMContentLoaded', async () => {

    try {

        sessionId = getOrCreateSessionId();

        await loadEvent();

        await registerParticipant();

        await checkExistingVote();

        startTimer();

        subscribeToEventChanges();

        setupUI();

    } catch (error) {

        console.error(error);

        showTechnicalError(
            error.message ||
            'Не удалось подключиться к голосованию.'
        );

    }

});


// ==========================================================
// SESSION ID
// ==========================================================

function getOrCreateSessionId() {

    const storageKey =
        `future_school_session_${EVENT_KEY}`;

    let storedId =
        localStorage.getItem(storageKey);

    if (storedId) {
        return storedId;
    }

    const newId = crypto.randomUUID();

    localStorage.setItem(
        storageKey,
        newId
    );

    return newId;
}


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
        throw new Error(
            'Не удалось загрузить мероприятие.'
        );
    }

    currentEvent = data;

    renderEvent();

}


// ==========================================================
// RENDER TEXT FROM SUPABASE
// ==========================================================

function renderEvent() {

    schoolName.textContent =
        currentEvent.school_name;

    schoolSlogan.textContent =
        currentEvent.slogan;

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
// REGISTER PARTICIPANT
// ==========================================================

async function registerParticipant() {

    const { error } = await supabaseClient
        .from('vision_sessions')
        .insert({
            event_id: currentEvent.id,
            session_id: sessionId
        });

    /*
        23505 означает:
        эта сессия уже есть.

        Например человек просто обновил страницу.

        Это НЕ ошибка.
    */

    if (
        error &&
        error.code !== '23505'
    ) {

        throw new Error(
            'Не удалось зарегистрировать участника.'
        );

    }

    /*
        Важно!

        Первый INSERT запускает PostgreSQL trigger,
        который записывает started_at.

        Поэтому после регистрации ещё раз
        перечитываем vision_event.
    */

    const { data, error: refreshError } =
        await supabaseClient
            .from('vision_event')
            .select('*')
            .eq('id', currentEvent.id)
            .single();

    if (refreshError) {
        throw new Error(
            'Не удалось получить время начала голосования.'
        );
    }

    currentEvent = data;

}


// ==========================================================
// CHECK EXISTING VOTE
// ==========================================================

async function checkExistingVote() {

    const { data, error } = await supabaseClient
        .from('vision_votes')
        .select('id, choice')
        .eq('event_id', currentEvent.id)
        .eq('session_id', sessionId)
        .maybeSingle();

    if (error) {

        throw new Error(
            'Не удалось проверить предыдущий голос.'
        );

    }

    loadingBlock.classList.add('hidden');

    /*
        Если этот телефон уже голосовал,
        сразу показываем Спасибо.
    */

    if (data) {

        successBlock.classList.remove('hidden');
        return;

    }

    /*
        Если время уже закончилось,
        голосовать нельзя.
    */

    if (isVotingExpired()) {

        closedBlock.classList.remove('hidden');
        return;

    }

    votingBlock.classList.remove('hidden');

}


// ==========================================================
// UI
// ==========================================================

function setupUI() {

    const cards =
        document.querySelectorAll('.vision-card');

    const radios =
        document.querySelectorAll(
            'input[name="vision"]'
        );


    cards.forEach(card => {

        card.addEventListener('click', () => {

            cards.forEach(item =>
                item.classList.remove('selected')
            );

            card.classList.add('selected');

        });

    });


    radios.forEach(radio => {

        radio.addEventListener('change', () => {

            hideFormError();

            if (radio.value !== 'custom') {
                customVision.blur();
            }

        });

    });


    /*
        Если человек начинает писать своё видение,
        автоматически выбираем CUSTOM.
    */

    customVision.addEventListener('focus', () => {

        selectCustomVision();

    });


    customVision.addEventListener('input', () => {

        selectCustomVision();

        customCounter.textContent =
            `${customVision.value.length} / 500`;

        hideFormError();

    });


    submitVote.addEventListener(
        'click',
        submitVoteHandler
    );

}


// ==========================================================
// AUTO SELECT CUSTOM
// ==========================================================

function selectCustomVision() {

    const customRadio =
        document.querySelector(
            'input[value="custom"]'
        );

    customRadio.checked = true;

    document
        .querySelectorAll('.vision-card')
        .forEach(card =>
            card.classList.remove('selected')
        );

    document
        .querySelector(
            '[data-choice="custom"]'
        )
        .classList.add('selected');

}


// ==========================================================
// SUBMIT
// ==========================================================

async function submitVoteHandler() {

    hideFormError();


    if (isVotingExpired()) {

        showClosed();
        return;

    }


    const selected =
        document.querySelector(
            'input[name="vision"]:checked'
        );


    if (!selected) {

        showFormError(
            'Выберите один из вариантов.'
        );

        return;

    }


    const choice = selected.value;

    let customText = null;


    if (choice === 'custom') {

        customText =
            customVision.value.trim();

        const validation =
            validateCustomVision(customText);

        if (!validation.valid) {

            showFormError(
                validation.message
            );

            return;

        }

    }


    submitVote.disabled = true;
    submitVote.textContent =
        'Отправляем...';


    const { error } = await supabaseClient
        .from('vision_votes')
        .insert({
            event_id: currentEvent.id,
            session_id: sessionId,
            choice: choice,
            custom_text: customText
        });


    /*
        Повторный голос с той же сессии.
    */

    if (
        error &&
        error.code === '23505'
    ) {

        showSuccess();
        return;

    }


    if (error) {

        console.error(error);

        submitVote.disabled = false;
        submitVote.textContent =
            'Отправить';

        showFormError(
            'Не удалось отправить голос. Попробуйте ещё раз.'
        );

        return;

    }


    showSuccess();

}


// ==========================================================
// CUSTOM VISION VALIDATION
// ==========================================================

function validateCustomVision(text) {

    if (!text) {

        return {
            valid: false,
            message:
                'Напишите своё видение школы.'
        };

    }


    /*
        Убираем знаки пунктуации
        и смотрим только на слова из букв.
    */

    const words = text
        .match(/[A-Za-zА-Яа-яЁёӘәҒғҚқҢңӨөҰұҮүҺһІі]+/g);


    if (!words || words.length < 2) {

        return {
            valid: false,
            message:
                'Напишите хотя бы два содержательных слова.'
        };

    }


    /*
        Не принимаем слишком короткие наборы.
    */

    const meaningfulWords =
        words.filter(word =>
            word.length >= 3
        );


    if (meaningfulWords.length < 2) {

        return {
            valid: false,
            message:
                'Пожалуйста, сформулируйте ваше видение чуть подробнее.'
        };

    }


    /*
        Не принимаем бессмысленное повторение:
        ааааааааа
    */

    const normalized =
        text
            .toLowerCase()
            .replace(/\s+/g, '')
            .replace(/[^a-zа-яёәғқңөұүһі]/gi, '');


    if (
        normalized.length > 0 &&
        /^(.)(\1)+$/i.test(normalized)
    ) {

        return {
            valid: false,
            message:
                'Пожалуйста, напишите осмысленный вариант.'
        };

    }


    return {
        valid: true
    };

}


// ==========================================================
// TIMER
// ==========================================================

function startTimer() {

    updateTimer();

    timerInterval = setInterval(
        updateTimer,
        500
    );

}


function updateTimer() {

    if (
        !currentEvent ||
        !currentEvent.started_at
    ) {

        participantTimer.textContent =
            formatSeconds(
                currentEvent?.duration_seconds || 300
            );

        return;

    }


    const start =
        new Date(currentEvent.started_at)
            .getTime();

    const duration =
        currentEvent.duration_seconds * 1000;

    const end =
        start + duration;

    const now =
        Date.now();

    const remaining =
        Math.max(
            0,
            Math.ceil(
                (end - now) / 1000
            )
        );


    participantTimer.textContent =
        formatSeconds(remaining);


    if (remaining <= 0) {

        clearInterval(timerInterval);

        showClosed();

    }

}


function formatSeconds(totalSeconds) {

    const minutes =
        Math.floor(totalSeconds / 60);

    const seconds =
        totalSeconds % 60;

    return (
        String(minutes).padStart(2, '0') +
        ':' +
        String(seconds).padStart(2, '0')
    );

}


// ==========================================================
// CHECK EXPIRATION
// ==========================================================

function isVotingExpired() {

    if (
        !currentEvent ||
        !currentEvent.started_at
    ) {
        return false;
    }


    const start =
        new Date(currentEvent.started_at)
            .getTime();


    const end =
        start +
        (
            currentEvent.duration_seconds *
            1000
        );


    return Date.now() >= end;

}


// ==========================================================
// REALTIME EVENT CHANGES
// ==========================================================

function subscribeToEventChanges() {

    supabaseClient
        .channel(
            `vision-event-${currentEvent.id}`
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

                /*
                    Если ведущий или сервер
                    закроет голосование раньше.
                */

                if (
                    currentEvent.status ===
                    'closed'
                ) {

                    showClosed();

                }

            }
        )
        .subscribe();

}


// ==========================================================
// STATES
// ==========================================================

function showSuccess() {

    votingBlock.classList.add('hidden');
    loadingBlock.classList.add('hidden');
    closedBlock.classList.add('hidden');

    successBlock.classList.remove('hidden');

}


function showClosed() {

    votingBlock.classList.add('hidden');
    loadingBlock.classList.add('hidden');
    successBlock.classList.add('hidden');

    closedBlock.classList.remove('hidden');

}


function showTechnicalError(message) {

    loadingBlock.classList.add('hidden');
    votingBlock.classList.add('hidden');

    technicalErrorText.textContent =
        message;

    technicalError.classList.remove('hidden');

}


function showFormError(message) {

    formError.textContent = message;
    formError.classList.remove('hidden');

}


function hideFormError() {

    formError.classList.add('hidden');

}
