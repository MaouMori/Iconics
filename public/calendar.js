(function () {
  function initCalendar() {
    const monthLabel = document.getElementById("calendarMonthLabel");
    const calendarGrid = document.getElementById("calendarGrid");
    const eventsList = document.getElementById("eventsList");
    const prevMonthBtn = document.getElementById("prevMonth");
    const nextMonthBtn = document.getElementById("nextMonth");

    if (!monthLabel || !calendarGrid || !eventsList || !prevMonthBtn || !nextMonthBtn) {
      return;
    }

    const monthNames = [
      "Janeiro", "Fevereiro", "Marco", "Abril", "Maio", "Junho",
      "Julho", "Agosto", "Setembro", "Outubro", "Novembro", "Dezembro"
    ];

    let events = [];

    const today = new Date();
    let currentDate = new Date(today.getFullYear(), today.getMonth(), 1);
    let selectedDate = formatDate(today);

    function formatDate(date) {
      const y = date.getFullYear();
      const m = String(date.getMonth() + 1).padStart(2, "0");
      const d = String(date.getDate()).padStart(2, "0");
      return `${y}-${m}-${d}`;
    }

    function formatDisplayDate(dateString) {
      const [year, month, day] = dateString.split("-");
      return `${day}/${month}/${year}`;
    }

    function getEventsByDate(dateString) {
      return events.filter((event) => event.date === dateString);
    }

    function getFirstEventDateInMonth(year, month) {
      const monthString = String(month + 1).padStart(2, "0");

      const monthEvents = events
        .filter((event) => event.date.startsWith(`${year}-${monthString}-`))
        .sort((a, b) => a.date.localeCompare(b.date));

      return monthEvents.length > 0 ? monthEvents[0].date : null;
    }

    function renderCalendar(date) {
      const year = date.getFullYear();
      const month = date.getMonth();

      monthLabel.textContent = `${monthNames[month]} ${year}`;
      calendarGrid.innerHTML = "";

      const firstDayOfMonth = new Date(year, month, 1).getDay();
      const daysInMonth = new Date(year, month + 1, 0).getDate();
      const daysInPrevMonth = new Date(year, month, 0).getDate();
      const totalCells = 42;

      for (let i = 0; i < totalCells; i++) {
        const dayElement = document.createElement("button");
        dayElement.className = "calendar-day";

        let cellDate;
        let dayNumber;

        if (i < firstDayOfMonth) {
          dayNumber = daysInPrevMonth - firstDayOfMonth + i + 1;
          cellDate = new Date(year, month - 1, dayNumber);
          dayElement.classList.add("other-month");
        } else if (i >= firstDayOfMonth + daysInMonth) {
          dayNumber = i - (firstDayOfMonth + daysInMonth) + 1;
          cellDate = new Date(year, month + 1, dayNumber);
          dayElement.classList.add("other-month");
        } else {
          dayNumber = i - firstDayOfMonth + 1;
          cellDate = new Date(year, month, dayNumber);
        }

        const cellDateString = formatDate(cellDate);

        if (cellDateString === formatDate(today)) {
          dayElement.classList.add("today");
        }

        if (cellDateString === selectedDate) {
          dayElement.classList.add("selected");
        }

        const numberSpan = document.createElement("span");
        numberSpan.className = "day-number";
        numberSpan.textContent = dayNumber;
        dayElement.appendChild(numberSpan);

        const dayEvents = getEventsByDate(cellDateString);
        if (dayEvents.length > 0) {
          const marker = document.createElement("span");
          marker.className = "event-marker";
          dayElement.appendChild(marker);
        }

        dayElement.addEventListener("click", () => {
          selectedDate = cellDateString;
          renderCalendar(currentDate);
          renderEvents();
        });

        calendarGrid.appendChild(dayElement);
      }
    }

    function renderEvents() {
      const selectedEvents = getEventsByDate(selectedDate);
      eventsList.innerHTML = "";

      if (selectedEvents.length === 0) {
        const empty = document.createElement("div");
        empty.className = "event-empty";
        empty.textContent = "Nenhum evento marcado para esta data.";
        eventsList.appendChild(empty);
        return;
      }

      selectedEvents.forEach((event) => {
        const card = document.createElement("div");
        card.className = "event-card";

        const imageArea =
          event.image && event.image.trim() !== ""
            ? `
              <div class="event-image-box has-image">
                <img src="${event.image}" alt="${event.title}">
              </div>
            `
            : `
              <div class="event-image-box image-placeholder-event">
                <span>Area para imagem do evento</span>
              </div>
            `;

        card.innerHTML = `
          <div class="event-card-layout">
            <div class="event-info">
              <div class="event-date">${formatDisplayDate(event.date)} - ${event.time || "Sem horario"}</div>
              <div class="event-title">${event.title}</div>
              <div class="event-location">${event.location || "Sem local"}</div>
              <div class="event-description">${event.description || "Sem descricao"}</div>
            </div>

            <div class="event-visual">
              ${imageArea}
            </div>
          </div>
        `;

        eventsList.appendChild(card);
      });
    }

    function syncSelectedDateWithMonth() {
      const year = currentDate.getFullYear();
      const month = currentDate.getMonth();

      const selected = new Date(selectedDate);
      const isSameMonth =
        selected.getFullYear() === year && selected.getMonth() === month;

      if (!isSameMonth) {
        const firstEventDate = getFirstEventDateInMonth(year, month);
        if (firstEventDate) {
          selectedDate = firstEventDate;
        } else {
          selectedDate = formatDate(new Date(year, month, 1));
        }
      }
    }

    async function loadEventsFromApi() {
      try {
        const response = await fetch("/api/public-events", { cache: "no-store" });

        if (!response.ok) {
          throw new Error("Falha ao buscar eventos.");
        }

        const data = await response.json();

        events = (data || []).map((event) => ({
          id: event.id,
          date: event.data_evento,
          title: event.titulo,
          time: event.horario || "",
          location: event.local || "",
          description: event.descricao || "",
          image: event.imagem_url || "",
        }));

        const todayEvents = getEventsByDate(formatDate(today));
        if (todayEvents.length > 0) {
          selectedDate = formatDate(today);
        } else {
          const firstEventDate = getFirstEventDateInMonth(
            currentDate.getFullYear(),
            currentDate.getMonth()
          );

          if (firstEventDate) {
            selectedDate = firstEventDate;
          }
        }
      } catch (error) {
        console.error("Erro ao carregar eventos:", error);
        events = [];
      }

      renderCalendar(currentDate);
      renderEvents();
    }

    prevMonthBtn.addEventListener("click", () => {
      currentDate = new Date(
        currentDate.getFullYear(),
        currentDate.getMonth() - 1,
        1
      );
      syncSelectedDateWithMonth();
      renderCalendar(currentDate);
      renderEvents();
    });

    nextMonthBtn.addEventListener("click", () => {
      currentDate = new Date(
        currentDate.getFullYear(),
        currentDate.getMonth() + 1,
        1
      );
      syncSelectedDateWithMonth();
      renderCalendar(currentDate);
      renderEvents();
    });

    loadEventsFromApi();
  }

  if (document.readyState === "loading") {
    document.addEventListener("DOMContentLoaded", initCalendar);
  } else {
    initCalendar();
  }
})();
