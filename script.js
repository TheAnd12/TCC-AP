/* =========================================================
   ROOMFLOW
   SISTEMA DE RESERVA DE SALAS
========================================================= */


/* =========================================================
   CONFIGURAÇÃO
========================================================= */

const ROOMS = [

    {
        id: "sala-01",
        name: "Sala 01",
        capacity: 20,
        description: "Sala para reuniões e atividades administrativas.",
        icon: "▣"
    },

    {
        id: "sala-02",
        name: "Sala 02",
        capacity: 15,
        description: "Ambiente ideal para reuniões menores.",
        icon: "◇"
    },

    {
        id: "sala-03",
        name: "Sala 03",
        capacity: 30,
        description: "Espaço amplo para treinamentos e apresentações.",
        icon: "▦"
    },

    {
        id: "sala-04",
        name: "Sala 04",
        capacity: 10,
        description: "Sala compacta para reuniões rápidas.",
        icon: "○"
    },

    {
        id: "sala-05",
        name: "Sala 05",
        capacity: 20,
        description: "Sala equipada para encontros de equipe.",
        icon: "△"
    },

    {
        id: "sala-06",
        name: "Sala 06",
        capacity: 12,
        description: "Ambiente reservado para pequenas equipes.",
        icon: "□"
    }

];


const TIMES = [

    "08:00",
    "09:00",
    "10:00",
    "11:00",
    "12:00",
    "13:00",
    "14:00",
    "15:00",
    "16:00",
    "17:00"

];


let reservations =
    JSON.parse(
        localStorage.getItem("roomflow_reservations")
    ) || [];


let selectedAgendaDate =
    new Date();


let editingReservationId = null;


/* =========================================================
   ELEMENTOS
========================================================= */

const $ = selector =>
    document.querySelector(selector);


const $$ = selector =>
    document.querySelectorAll(selector);


/* =========================================================
   INICIALIZAÇÃO
========================================================= */

document.addEventListener(
    "DOMContentLoaded",
    initialize
);


function initialize() {

    populateRoomSelects();

    populateTimeSelect();

    setMinimumDate();

    setupNavigation();

    setupModal();

    setupFilters();

    setupAgendaControls();

    setupTheme();

    setupExport();

    renderAll();

}


/* =========================================================
   NAVEGAÇÃO
========================================================= */

function setupNavigation() {

    $$(".nav-item").forEach(button => {

        button.addEventListener(
            "click",
            () => {

                const section =
                    button.dataset.section;

                navigateTo(section);

                $("#sidebar").classList.remove("open");

            }
        );

    });


    $$("[data-go]").forEach(button => {

        button.addEventListener(
            "click",
            () => {

                navigateTo(
                    button.dataset.go
                );

            }
        );

    });


    $("#mobileMenu")
        .addEventListener(
            "click",
            () => {

                $("#sidebar")
                    .classList.toggle("open");

            }
        );

}


function navigateTo(section) {

    $$(".page-section")
        .forEach(page => {

            page.classList.remove("active");

        });


    const target =
        document.getElementById(section);

    if (!target) return;

    target.classList.add("active");


    $$(".nav-item")
        .forEach(button => {

            button.classList.toggle(
                "active",
                button.dataset.section === section
            );

        });


    const titles = {

        dashboard: "Dashboard",

        agenda: "Agenda",

        salas: "Salas",

        reservas: "Reservas"

    };


    $("#pageTitle").textContent =
        titles[section] || "Dashboard";


    if (section === "agenda") {

        renderAgenda();

    }

    if (section === "reservas") {

        renderReservationsTable();

    }

}


/* =========================================================
   MODAL
========================================================= */

function setupModal() {

    $("#newReservationButton")
        .addEventListener(
            "click",
            () => openReservationModal()
        );


    $("#closeModal")
        .addEventListener(
            "click",
            closeReservationModal
        );


    $("#cancelModal")
        .addEventListener(
            "click",
            closeReservationModal
        );


    $("#closeDetails")
        .addEventListener(
            "click",
            closeDetailsModal
        );


    $("#reservationModal")
        .addEventListener(
            "click",
            event => {

                if (
                    event.target ===
                    $("#reservationModal")
                ) {

                    closeReservationModal();

                }

            }
        );


    $("#detailsModal")
        .addEventListener(
            "click",
            event => {

                if (
                    event.target ===
                    $("#detailsModal")
                ) {

                    closeDetailsModal();

                }

            }
        );


    $("#reservationForm")
        .addEventListener(
            "submit",
            handleReservationSubmit
        );


    $("#room")
        .addEventListener(
            "change",
            checkConflict
        );


    $("#date")
        .addEventListener(
            "change",
            checkConflict
        );


    $("#time")
        .addEventListener(
            "change",
            checkConflict
        );

}


function openReservationModal(options = {}) {

    editingReservationId =
        options.id || null;


    $("#reservationForm").reset();

    $("#conflictMessage")
        .classList.remove("active");


    if (options.room) {

        $("#room").value =
            options.room;

    }


    if (options.date) {

        $("#date").value =
            options.date;

    }


    if (options.time) {

        $("#time").value =
            options.time;

    }


    if (options.id) {

        const reservation =
            reservations.find(
                item => item.id === options.id
            );


        if (!reservation) return;


        $("#room").value =
            reservation.room;

        $("#date").value =
            reservation.date;

        $("#time").value =
            reservation.time;

        $("#responsible").value =
            reservation.responsible;

        $("#purpose").value =
            reservation.purpose || "";

    }


    $("#reservationModal")
        .classList.add("active");


    setTimeout(() => {

        $("#responsible").focus();

    }, 100);

}


function closeReservationModal() {

    $("#reservationModal")
        .classList.remove("active");

    editingReservationId = null;

}


/* =========================================================
   FORMULÁRIO
========================================================= */

function handleReservationSubmit(event) {

    event.preventDefault();


    const room =
        $("#room").value;

    const date =
        $("#date").value;

    const time =
        $("#time").value;

    const responsible =
        $("#responsible")
            .value
            .trim();

    const purpose =
        $("#purpose")
            .value
            .trim();


    if (
        !room ||
        !date ||
        !time ||
        !responsible
    ) {

        showToast(
            "Preencha todos os campos obrigatórios.",
            "error"
        );

        return;

    }


    const conflict =
        reservations.some(item =>

            item.room === room &&
            item.date === date &&
            item.time === time &&
            item.id !== editingReservationId

        );


    if (conflict) {

        $("#conflictMessage")
            .classList.add("active");

        showToast(
            "Este horário já está reservado.",
            "error"
        );

        return;

    }


    const roomInfo =
        ROOMS.find(
            item => item.id === room
        );


    if (editingReservationId) {

        const index =
            reservations.findIndex(
                item =>
                    item.id ===
                    editingReservationId
            );


        if (index !== -1) {

            reservations[index] = {

                ...reservations[index],

                room,

                date,

                time,

                responsible,

                purpose,

                roomName:
                    roomInfo.name

            };

        }


        saveReservations();

        closeReservationModal();

        renderAll();

        showToast(
            "Reserva atualizada com sucesso."
        );

        return;

    }


    const reservation = {

        id:
            crypto.randomUUID
            ? crypto.randomUUID()
            : String(Date.now()),

        room,

        roomName:
            roomInfo.name,

        date,

        time,

        responsible,

        purpose,

        createdAt:
            new Date().toISOString()

    };


    reservations.push(reservation);

    saveReservations();

    closeReservationModal();

    renderAll();

    showToast(
        "Reserva criada com sucesso."
    );

}


/* =========================================================
   CONFLITO
========================================================= */

function checkConflict() {

    const room =
        $("#room").value;

    const date =
        $("#date").value;

    const time =
        $("#time").value;


    if (!room || !date || !time) {

        $("#conflictMessage")
            .classList.remove("active");

        return;

    }


    const conflict =
        reservations.some(item =>

            item.room === room &&
            item.date === date &&
            item.time === time &&
            item.id !== editingReservationId

        );


    $("#conflictMessage")
        .classList.toggle(
            "active",
            conflict
        );


    $("#submitReservation")
        .disabled = conflict;

}


/* =========================================================
   SELECTS
========================================================= */

function populateRoomSelects() {

    const roomSelect =
        $("#room");

    const filterRoom =
        $("#filterRoom");


    ROOMS.forEach(room => {

        roomSelect.insertAdjacentHTML(
            "beforeend",
            `
                <option value="${room.id}">
                    ${room.name}
                </option>
            `
        );


        filterRoom.insertAdjacentHTML(
            "beforeend",
            `
                <option value="${room.id}">
                    ${room.name}
                </option>
            `
        );

    });

}


function populateTimeSelect() {

    const select =
        $("#time");


    TIMES.forEach(time => {

        select.insertAdjacentHTML(
            "beforeend",
            `
                <option value="${time}">
                    ${time}
                </option>
            `
        );

    });

}


/* =========================================================
   DATA
========================================================= */

function getTodayString() {

    const date =
        new Date();

    const year =
        date.getFullYear();

    const month =
        String(
            date.getMonth() + 1
        ).padStart(2, "0");

    const day =
        String(
            date.getDate()
        ).padStart(2, "0");


    return `${year}-${month}-${day}`;

}


function formatDate(dateString) {

    if (!dateString) return "";

    const [
        year,
        month,
        day
    ] =
        dateString.split("-");


    return `${day}/${month}/${year}`;

}


function formatLongDate(dateString) {

    const [
        year,
        month,
        day
    ] =
        dateString.split("-");


    const date =
        new Date(
            Number(year),
            Number(month) - 1,
            Number(day)
        );


    return date.toLocaleDateString(
        "pt-BR",
        {
            weekday: "long",
            day: "numeric",
            month: "long",
            year: "numeric"
        }
    );

}


function setMinimumDate() {

    $("#date").min =
        getTodayString();

    $("#date").value =
        getTodayString();

}


/* =========================================================
   STORAGE
========================================================= */

function saveReservations() {

    localStorage.setItem(
        "roomflow_reservations",
        JSON.stringify(reservations)
    );

}


/* =========================================================
   RENDER GERAL
========================================================= */

function renderAll() {

    renderStats();

    renderTodaySchedule();

    renderRecentReservations();

    renderRooms();

    renderAgenda();

    renderReservationsTable();

}


/* =========================================================
   ESTATÍSTICAS
========================================================= */

function renderStats() {

    const today =
        getTodayString();


    const todayReservations =
        reservations.filter(
            item => item.date === today
        );


    const occupiedRooms =
        new Set(
            todayReservations.map(
                item => item.room
            )
        );


    const available =
        ROOMS.length -
        occupiedRooms.size;


    const totalSlots =
        ROOMS.length *
        TIMES.length;


    const occupancy =
        totalSlots === 0
            ? 0
            : Math.round(
                (
                    todayReservations.length /
                    totalSlots
                ) * 100
            );


    $("#totalRooms")
        .textContent =
        ROOMS.length;


    $("#availableRooms")
        .textContent =
        available;


    $("#todayReservations")
        .textContent =
        todayReservations.length;


    $("#occupancy")
        .textContent =
        `${occupancy}%`;

}


/* =========================================================
   AGENDA DE HOJE
========================================================= */

function renderTodaySchedule() {

    const container =
        $("#todaySchedule");


    const today =
        getTodayString();


    const items =
        reservations

            .filter(
                item =>
                    item.date === today
            )

            .sort(
                (a, b) =>
                    a.time.localeCompare(b.time)
            );


    if (!items.length) {

        container.innerHTML = `
            <div class="empty-state">

                <div class="empty-icon">
                    ✓
                </div>

                <p>
                    Nenhuma reserva para hoje.
                </p>

            </div>
        `;

        return;

    }


    container.innerHTML =
        items.map(item => `

            <div
                class="schedule-item"
                data-id="${item.id}"
            >

                <div class="schedule-time">
                    ${item.time}
                </div>

                <div class="schedule-main">

                    <strong>
                        ${escapeHTML(item.roomName)}
                    </strong>

                    <span>
                        ${escapeHTML(item.responsible)}
                    </span>

                </div>

                <span class="schedule-status">
                    Reservado
                </span>

            </div>

        `).join("");


    container
        .querySelectorAll(".schedule-item")
        .forEach(element => {

            element.addEventListener(
                "click",
                () =>
                    showReservationDetails(
                        element.dataset.id
                    )
            );

        });

}


/* =========================================================
   RECENTES
========================================================= */

function renderRecentReservations() {

    const container =
        $("#recentReservations");


    const items =
        [...reservations]

            .sort(
                (a, b) => {

                    const first =
                        `${a.date} ${a.time}`;

                    const second =
                        `${b.date} ${b.time}`;

                    return first.localeCompare(
                        second
                    );

                }
            )

            .slice(0, 5);


    if (!items.length) {

        container.innerHTML = `
            <div class="empty-state">

                <div class="empty-icon">
                    +
                </div>

                <p>
                    Nenhuma reserva cadastrada.
                </p>

            </div>
        `;

        return;

    }


    container.innerHTML =
        items.map(item => `

            <div
                class="schedule-item"
                data-id="${item.id}"
            >

                <div class="schedule-time">
                    ${formatDate(item.date)}
                </div>

                <div class="schedule-main">

                    <strong>
                        ${escapeHTML(item.roomName)}
                    </strong>

                    <span>
                        ${item.time} ·
                        ${escapeHTML(item.responsible)}
                    </span>

                </div>

                <span class="schedule-status">
                    ${getReservationStatus(item)}
                </span>

            </div>

        `).join("");


    container
        .querySelectorAll(".schedule-item")
        .forEach(element => {

            element.addEventListener(
                "click",
                () =>
                    showReservationDetails(
                        element.dataset.id
                    )
            );

        });

}


/* =========================================================
   SALAS
========================================================= */

function renderRooms() {

    const container =
        $("#roomsGrid");


    container.innerHTML =
        ROOMS.map(room => {

            const today =
                getTodayString();


            const roomBusy =
                reservations.some(
                    item =>
                        item.room === room.id &&
                        item.date === today
                );


            return `

                <article class="room-card">

                    <div class="room-cover">
                        ${room.icon}
                    </div>

                    <div class="room-body">

                        <h3>
                            ${room.name}
                        </h3>

                        <p>
                            ${room.description}
                        </p>

                        <div class="room-meta">

                            <span class="capacity">
                                👥 Até ${room.capacity} pessoas
                            </span>

                            <span
                                class="room-available"
                                style="
                                    ${
                                        roomBusy
                                            ? `
                                                background:
                                                    var(--warning-light);
                                                color:
                                                    var(--warning);
                                              `
                                            : ""
                                    }
                                "
                            >
                                ${
                                    roomBusy
                                        ? "Em uso"
                                        : "Disponível"
                                }
                            </span>

                        </div>

                    </div>

                </article>

            `;

        }).join("");

}


/* =========================================================
   AGENDA
========================================================= */

function renderAgenda() {

    const dateString =
        toDateString(
            selectedAgendaDate
        );


    $("#agendaDate")
        .textContent =
        formatDate(dateString);


    $("#agendaDateFull")
        .textContent =
        capitalize(
            formatLongDate(
                dateString
            )
        );


    renderAgendaRooms();

    renderAgendaTimes();

}


function renderAgendaRooms() {

    const header =
        $("#agendaRooms");

    const grid =
        $("#agendaGrid");


    header.style.gridTemplateColumns =
        `repeat(${ROOMS.length}, minmax(130px, 1fr))`;


    grid.style.gridTemplateColumns =
        `repeat(${ROOMS.length}, minmax(130px, 1fr))`;


    header.innerHTML =
        ROOMS.map(
            room =>
                `
                    <div class="room-heading">
                        ${room.name}
                    </div>
                `
        ).join("");


    grid.innerHTML =
        ROOMS.map(
            room => `

                <div
                    class="grid-column"
                    data-room="${room.id}"
                >

                    ${TIMES.map(
                        time => `

                            <div
                                class="grid-cell"
                                data-room="${room.id}"
                                data-time="${time}"
                            ></div>

                        `
                    ).join("")}

                </div>

            `
        ).join("");


    renderBookings();

}


function renderAgendaTimes() {

    const column =
        $("#timeColumn");


    column.innerHTML =
        TIMES.map(
            time =>
                `
                    <div class="time-slot">
                        ${time}
                    </div>
                `
        ).join("");

}


function renderBookings() {

    const dateString =
        toDateString(
            selectedAgendaDate
        );


    const grid =
        $("#agendaGrid");


    reservations

        .filter(
            item =>
                item.date === dateString
        )

        .forEach(reservation => {

            const column =
                grid.querySelector(
                    `[data-room="${reservation.room}"]`
                );


            if (!column) return;


            const index =
                TIMES.indexOf(
                    reservation.time
                );


            if (index < 0) return;


            const booking =
                document.createElement("div");


            booking.className =
                "booking";


            booking.style.top =
                `${index * 65 + 5}px`;


            booking.style.height =
                "55px";


            booking.innerHTML = `

                <strong>
                    ${escapeHTML(
                        reservation.responsible
                    )}
                </strong>

                <span>
                    ${reservation.time} ·
                    ${escapeHTML(
                        reservation.purpose ||
                        "Reserva"
                    )}
                </span>

            `;


            booking.addEventListener(
                "click",
                event => {

                    event.stopPropagation();

                    showReservationDetails(
                        reservation.id
                    );

                }
            );


            column.appendChild(
                booking
            );

        });


    $$("#agendaGrid .grid-cell")
        .forEach(cell => {

            cell.addEventListener(
                "dblclick",
                () => {

                    openReservationModal({

                        room:
                            cell.dataset.room,

                        date:
                            dateString,

                        time:
                            cell.dataset.time

                    });

                }
            );

        });

}


/* =========================================================
   CONTROLES AGENDA
========================================================= */

function setupAgendaControls() {

    $("#previousDay")
        .addEventListener(
            "click",
            () => {

                selectedAgendaDate =
                    new Date(
                        selectedAgendaDate
                    );

                selectedAgendaDate
                    .setDate(
                        selectedAgendaDate.getDate() - 1
                    );

                renderAgenda();

            }
        );


    $("#nextDay")
        .addEventListener(
            "click",
            () => {

                selectedAgendaDate =
                    new Date(
                        selectedAgendaDate
                    );

                selectedAgendaDate
                    .setDate(
                        selectedAgendaDate.getDate() + 1
                    );

                renderAgenda();

            }
        );


    $("#todayButton")
        .addEventListener(
            "click",
            () => {

                selectedAgendaDate =
                    new Date();

                renderAgenda();

            }
        );

}


/* =========================================================
   TABELA DE RESERVAS
========================================================= */

function renderReservationsTable() {

    const table =
        $("#reservationsTable");


    const search =
        $("#searchInput")
            .value
            .toLowerCase()
            .trim();


    const roomFilter =
        $("#filterRoom")
            .value;


    const dateFilter =
        $("#filterDate")
            .value;


    const today =
        getTodayString();


    let filtered =
        reservations.filter(item => {

            const text = [

                item.roomName,

                item.responsible,

                item.purpose,

                item.date,

                item.time

            ]
                .join(" ")
                .toLowerCase();


            if (
                search &&
                !text.includes(search)
            ) {
                return false;
            }


            if (
                roomFilter !== "all" &&
                item.room !== roomFilter
            ) {
                return false;
            }


            if (
                dateFilter === "today" &&
                item.date !== today
            ) {
                return false;
            }


            if (
                dateFilter === "future" &&
                item.date < today
            ) {
                return false;
            }


            if (
                dateFilter === "past" &&
                item.date >= today
            ) {
                return false;
            }


            return true;

        });


    filtered.sort(
        (a, b) =>
            `${a.date} ${a.time}`
                .localeCompare(
                    `${b.date} ${b.time}`
                )
    );


    if (!filtered.length) {

        table.innerHTML = `

            <tr>

                <td
                    colspan="7"
                    class="empty-state"
                >

                    Nenhuma reserva encontrada.

                </td>

            </tr>

        `;

        return;

    }


    table.innerHTML =
        filtered.map(item => `

            <tr>

                <td>

                    <span class="room-badge">
                        ${escapeHTML(item.roomName)}
                    </span>

                </td>

                <td>
                    ${formatDate(item.date)}
                </td>

                <td>
                    <strong>
                        ${item.time}
                    </strong>
                </td>

                <td>
                    ${escapeHTML(item.responsible)}
                </td>

                <td>
                    ${escapeHTML(
                        item.purpose || "—"
                    )}
                </td>

                <td>

                    <span
                        class="
                            status-badge
                            ${
                                isPast(item)
                                    ? "past"
                                    : "upcoming"
                            }
                        "
                    >
                        ${
                            isPast(item)
                                ? "Finalizada"
                                : "Agendada"
                        }
                    </span>

                </td>

                <td>

                    <button
                        class="action-button"
                        title="Detalhes"
                        data-action="details"
                        data-id="${item.id}"
                    >
                        ⋯
                    </button>

                </td>

            </tr>

        `).join("");


    table
        .querySelectorAll(
            "[data-action='details']"
        )
        .forEach(button => {

            button.addEventListener(
                "click",
                () =>
                    showReservationDetails(
                        button.dataset.id
                    )
            );

        });

}


/* =========================================================
   FILTROS
========================================================= */

function setupFilters() {

    $("#searchInput")
        .addEventListener(
            "input",
            renderReservationsTable
        );


    $("#filterRoom")
        .addEventListener(
            "change",
            renderReservationsTable
        );


    $("#filterDate")
        .addEventListener(
            "change",
            renderReservationsTable
        );

}


/* =========================================================
   DETALHES
========================================================= */

function showReservationDetails(id) {

    const reservation =
        reservations.find(
            item => item.id === id
        );


    if (!reservation) return;


    $("#reservationDetails")
        .innerHTML = `

            <div class="details-list">

                <div class="detail-row">

                    <span>Sala</span>

                    <strong>
                        ${escapeHTML(
                            reservation.roomName
                        )}
                    </strong>

                </div>


                <div class="detail-row">

                    <span>Data</span>

                    <strong>
                        ${formatDate(
                            reservation.date
                        )}
                    </strong>

                </div>


                <div class="detail-row">

                    <span>Horário</span>

                    <strong>
                        ${reservation.time}
                    </strong>

                </div>


                <div class="detail-row">

                    <span>Responsável</span>

                    <strong>
                        ${escapeHTML(
                            reservation.responsible
                        )}
                    </strong>

                </div>


                <div class="detail-row">

                    <span>Finalidade</span>

                    <strong>
                        ${escapeHTML(
                            reservation.purpose ||
                            "Não informada"
                        )}
                    </strong>

                </div>


                <div class="modal-footer">

                    <button
                        class="secondary-button"
                        id="editReservation"
                    >
                        Editar
                    </button>

                    <button
                        class="primary-button"
                        id="deleteReservation"
                        style="
                            background:
                                var(--danger);
                        "
                    >
                        Cancelar reserva
                    </button>

                </div>

            </div>

        `;


    $("#detailsModal")
        .classList.add("active");


    $("#editReservation")
        .addEventListener(
            "click",
            () => {

                closeDetailsModal();

                openReservationModal({
                    id
                });

            }
        );


    $("#deleteReservation")
        .addEventListener(
            "click",
            () =>
                deleteReservation(id)
        );

}


function closeDetailsModal() {

    $("#detailsModal")
        .classList.remove("active");

}


/* =========================================================
   EXCLUSÃO
========================================================= */

function deleteReservation(id) {

    const reservation =
        reservations.find(
            item => item.id === id
        );


    if (!reservation) return;


    const confirmed =
        confirm(
            `Cancelar a reserva da ${reservation.roomName} em ${formatDate(reservation.date)} às ${reservation.time}?`
        );


    if (!confirmed) return;


    reservations =
        reservations.filter(
            item => item.id !== id
        );


    saveReservations();

    closeDetailsModal();

    renderAll();

    showToast(
        "Reserva cancelada."
    );

}


/* =========================================================
   EXPORTAÇÃO CSV
========================================================= */

function setupExport() {

    $("#exportButton")
        .addEventListener(
            "click",
            exportCSV
        );

}


function exportCSV() {

    if (!reservations.length) {

        showToast(
            "Não existem reservas para exportar.",
            "warning"
        );

        return;

    }


    const header = [

        "Sala",

        "Data",

        "Horário",

        "Responsável",

        "Finalidade"

    ];


    const rows =
        reservations.map(item => [

            item.roomName,

            formatDate(item.date),

            item.time,

            item.responsible,

            item.purpose || ""

        ]);


    const csv = [

        header,

        ...rows

    ]

        .map(
            row =>
                row
                    .map(
                        value =>
                            `"${String(value)
                                .replaceAll(
                                    '"',
                                    '""'
                                )}"`
                    )
                    .join(";")
        )

        .join("\n");


    const blob =
        new Blob(
            ["\ufeff" + csv],
            {
                type:
                    "text/csv;charset=utf-8;"
            }
        );


    const url =
        URL.createObjectURL(blob);


    const link =
        document.createElement("a");


    link.href = url;

    link.download =
        `reservas-${getTodayString()}.csv`;

    link.click();


    URL.revokeObjectURL(url);


    showToast(
        "Arquivo exportado com sucesso."
    );

}


/* =========================================================
   TEMA
========================================================= */

function setupTheme() {

    const saved =
        localStorage.getItem(
            "roomflow_theme"
        );


    if (saved === "dark") {

        document.body
            .classList.add("dark");

        $("#themeToggle")
            .textContent = "☀";

    }


    $("#themeToggle")
        .addEventListener(
            "click",
            () => {

                const dark =
                    document.body
                        .classList.toggle("dark");


                localStorage.setItem(
                    "roomflow_theme",
                    dark
                        ? "dark"
                        : "light"
                );


                $("#themeToggle")
                    .textContent =
                    dark
                        ? "☀"
                        : "☾";

            }
        );

}


/* =========================================================
   TOAST
========================================================= */

function showToast(
    message,
    type = "success"
) {

    const container =
        $("#toastContainer");


    const toast =
        document.createElement("div");


    toast.className =
        `toast ${type}`;


    const icon =
        type === "error"
            ? "!"
            : type === "warning"
                ? "!"
                : "✓";


    toast.innerHTML = `

        <div class="toast-icon">
            ${icon}
        </div>

        <div>

            <strong>
                ${
                    type === "error"
                        ? "Atenção"
                        : type === "warning"
                            ? "Aviso"
                            : "Tudo certo"
                }
            </strong>

            <p>
                ${escapeHTML(message)}
            </p>

        </div>

    `;


    container.appendChild(toast);


    setTimeout(
        () => {

            toast.style.opacity = "0";

            toast.style.transform =
                "translateX(20px)";

            setTimeout(
                () =>
                    toast.remove(),
                250
            );

        },
        3500
    );

}


/* =========================================================
   STATUS
========================================================= */

function isPast(item) {

    const now =
        new Date();


    const target =
        new Date(
            `${item.date}T${item.time}:00`
        );


    return target < now;

}


function getReservationStatus(item) {

    return isPast(item)
        ? "Finalizada"
        : "Agendada";

}


/* =========================================================
   UTILITÁRIOS
========================================================= */

function toDateString(date) {

    const year =
        date.getFullYear();

    const month =
        String(
            date.getMonth() + 1
        ).padStart(2, "0");

    const day =
        String(
            date.getDate()
        ).padStart(2, "0");


    return `${year}-${month}-${day}`;

}


function capitalize(text) {

    if (!text) return "";

    return text.charAt(0).toUpperCase() +
        text.slice(1);

}


function escapeHTML(value) {

    return String(value)
        .replaceAll("&", "&amp;")
        .replaceAll("<", "&lt;")
        .replaceAll(">", "&gt;")
        .replaceAll('"', "&quot;")
        .replaceAll("'", "&#039;");

}


/* =========================================================
   ATALHOS
========================================================= */

document.addEventListener(
    "keydown",
    event => {

        /*
         ESC fecha modais
        */

        if (event.key === "Escape") {

            closeReservationModal();

            closeDetailsModal();

        }


        /*
         N cria nova reserva
        */

        if (
            event.key.toLowerCase() === "n" &&
            !isTyping()
        ) {

            openReservationModal();

        }

    }
);


function isTyping() {

    const tag =
        document.activeElement?.tagName;

    return (
        tag === "INPUT" ||
        tag === "TEXTAREA" ||
        tag === "SELECT"
    );

}
