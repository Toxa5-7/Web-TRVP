document.addEventListener("DOMContentLoaded", async () => {
    const addCourierBtn = document.getElementById("add-courier-btn");
    const courierModal = document.getElementById("add-courier-modal");
    const saveCourierBtn = document.getElementById("save-courier-btn");
    const cancelCourierBtn = document.getElementById("cancel-btn");
    const taskModal = document.getElementById("add-task-modal");
    const saveTaskBtn = document.getElementById("save-task-btn");
    const cancelTaskBtn = document.getElementById("cancel-task-btn");
    const couriersList = document.getElementById("couriers-list");
    const transferModal = document.getElementById("transfer-task-modal");
    const transferTaskSelect = document.getElementById("transfer-task-select");
    const transferCourierSelect = document.getElementById("transfer-courier-select");
    const transferTaskBtn = document.getElementById("transfer-task-btn");
    const cancelTransferTaskBtn = document.getElementById("cancel-transfer-task-btn");

    const API_URL = "http://localhost:7777/api";

    let currentCourierId = null;

    const clearTransferModalFields = () => {
        transferTaskSelect.innerHTML = "";
        transferCourierSelect.innerHTML = "";
    };

    const populateTransferModal = (courier) => {
        transferTaskSelect.innerHTML = courier.tasks
            .map(task => `<option value="${task.id}">ID: ${task.id} - ${task.description}</option>`)
            .join("");

        fetchCouriers().then(couriers => {
            transferCourierSelect.innerHTML = couriers
                .filter(c => c.id !== courier.id)
                .map(c => `<option value="${c.id}">${c.full_name} (ID: ${c.id})</option>`)
                .join("");
        });
    };

    const canAssignTaskBasedOnCells = (courier, task) => {
        const totalCells = courier.tasks.reduce((sum, t) => sum + t.cells, 0) + task.cells;
        if (totalCells > courier.max_cells) {
            alert(`У курьера ${courier.full_name} превышен лимит по ячейкам!`);
            return false;
        }
        return true;
    };

    const canTransferTaskToCourier = (courier, task) => {
        if (courier.region_id !== task.region_id) {
            alert(`Курьер ${courier.full_name} работает в другом районе!`);
            return false;
        }
        return true;
    };

    transferTaskBtn.addEventListener("click", async () => {
        const taskId = transferTaskSelect.value;
        const newCourierId = transferCourierSelect.value;

        if (!taskId || !newCourierId) {
            alert("Пожалуйста, выберите задание и нового курьера!");
            return;
        }

        const couriers = await fetchCouriers();
        const targetCourier = couriers.find(c => c.id === parseInt(newCourierId, 10));
        const task = couriers.flatMap(c => c.tasks).find(t => t.id === parseInt(taskId, 10));

        if (!canTransferTaskToCourier(targetCourier, task)) {
            return;
        }

        try {
            const response = await fetch(`${API_URL}/tasks/${taskId}`, {
                method: "PATCH",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({ courier_id: newCourierId }),
            });

            if (!response.ok) {
                const errorData = await response.json();
                throw new Error(errorData.error || "Ошибка передачи задания");
            }

            alert("Задание успешно передано!");
            hideModal(transferModal);
            await displayCouriers();
        } catch (error) {
            alert(`Ошибка при передаче задания: ${error.message}`);
        }
    });

    cancelTransferTaskBtn.addEventListener("click", () => {
        clearTransferModalFields();
        hideModal(transferModal);
    });

    const showModal = (modal) => modal.style.display = "flex";
    const hideModal = (modal) => modal.style.display = "none";

    const fetchCouriers = async () => {
        try {
            const response = await fetch(`${API_URL}/couriers`);
            if (!response.ok) throw new Error("Ошибка загрузки курьеров");
            return await response.json();
        } catch (error) {
            console.error("Ошибка при получении курьеров:", error);
            return [];
        }
    };

    const displayCouriers = async () => {
        const couriers = await fetchCouriers();
        couriersList.innerHTML = "";
        couriers.forEach(createCourierBlock);
    };

    const createTaskBlock = (task, index) => `
        <li class="task">
            <div class="task__info">
                <span class="task__number"><strong>Задание #${index + 1}</strong></span>
                <span class="task__name">Описание: ${task.description}</span>
                <span class="task__region">Район: ${task.region_id}</span>
                <span class="task__cells">Требуемые ячейки: ${task.cells}</span>
                <span class="task__id">ID: ${task.id}</span>
            </div>
        </li>`;

    const createCourierBlock = (courier) => {
        const courierBlock = document.createElement("li");
        courierBlock.classList.add("tasklist");

        courierBlock.innerHTML = `
            <h3 class="tasklist__header">${courier.full_name} (ID: ${courier.id})</h3>
            <p class="tasklist__region">Район: ${courier.region_id} (${courier.region_name || "не указан"})</p>
            <ul class="tasklist__tasks-list">
                ${courier.tasks.map((task, index) => createTaskBlock(task, index)).join("")}
            </ul>
            <button type="button" class="tasklist__add-task-btn">Добавить задание</button>
            <div class="tasklist__delete-task">
                <label for="delete-task-select-${courier.id}">Удалить задание:</label>
                <select id="delete-task-select-${courier.id}" class="delete-task-select">
                    <option value="" selected>Выберите задание</option>
                    ${courier.tasks.map(task => `<option value="${task.id}">ID: ${task.id} - ${task.description}</option>`).join("")}
                </select>
                <button type="button" class="tasklist__delete-task-btn" data-courier-id="${courier.id}">Удалить</button>
            </div>
            <div class="tasklist__transfer-task">
                <button type="button" class="tasklist__transfer-task-btn" data-courier-id="${courier.id}">Передать задание</button>
            </div>
        `;

        const addTaskBtn = courierBlock.querySelector(".tasklist__add-task-btn");
        addTaskBtn.addEventListener("click", () => {
            currentCourierId = courier.id;
            showModal(taskModal);
        });

        const deleteTaskBtn = courierBlock.querySelector(".tasklist__delete-task-btn");
        deleteTaskBtn.addEventListener("click", async () => {
            const select = courierBlock.querySelector(`#delete-task-select-${courier.id}`);
            const taskId = select.value;

            if (!taskId) {
                alert("Пожалуйста, выберите задание для удаления!");
                return;
            }

            try {
                await fetch(`${API_URL}/tasks/${taskId}`, { method: "DELETE" });
                alert("Задание успешно удалено!");
                await displayCouriers();
            } catch (error) {
                alert("Ошибка при удалении задания!");
            }
        });

        const transferTaskBtn = courierBlock.querySelector(".tasklist__transfer-task-btn");
        transferTaskBtn.addEventListener("click", () => {
            currentCourierId = courier.id;
            showModal(transferModal);
            populateTransferModal(courier);
        });

        couriersList.appendChild(courierBlock);
    };


    // Check if the task can be assigned based on cell limits
// Check if the task can be assigned based on cell limits


// Task Assignment (Save Task)
// Функция для отображения сообщений об успехе
const showSuccessMessage = (message) => {
    alert(message);
    hideModal(taskModal);
    hideModal(transferModal);
    displayCouriers();
};

// Добавление задания
saveTaskBtn.addEventListener("click", async () => {
    const description = document.getElementById("task-description").value;
    const cells = parseInt(document.getElementById("task-cells").value, 10);
    const regionId = parseInt(document.getElementById("task-region-id").value, 10);
    const address = document.getElementById("task-address").value;

    if (!description || isNaN(regionId) || !address) {
        alert("Пожалуйста, заполните все поля!");
        return;
    }

    const task = { description, cells, region_id: regionId, address, courier_id: currentCourierId };

    const couriers = await fetchCouriers();
    const currentCourier = couriers.find(c => c.id === currentCourierId);

    if (!canTransferTaskToCourier(currentCourier, task)) {
        return;
    }

    // Проверка ячеек перед добавлением задания
    if (!canAssignTaskBasedOnCells(currentCourier, task)) {
        return;
    }

    try {
        await fetch(`${API_URL}/tasks`, {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify(task),
        });
        showSuccessMessage("Задание успешно добавлено!");
    } catch (error) {
        alert("Ошибка при добавлении задания!");
    }
});

// Передача задания
transferTaskBtn.addEventListener("click", async () => {
    const taskId = transferTaskSelect.value;
    const newCourierId = transferCourierSelect.value;

    if (!taskId || !newCourierId) {
        alert("Пожалуйста, выберите задание и нового курьера!");
        return;
    }

    const couriers = await fetchCouriers();
    const targetCourier = couriers.find(c => c.id === parseInt(newCourierId, 10));
    const task = couriers.flatMap(c => c.tasks).find(t => t.id === parseInt(taskId, 10));

    if (!canTransferTaskToCourier(targetCourier, task)) {
        return;
    }

    // Проверка ячеек перед передачей задания
    if (!canAssignTaskBasedOnCells(targetCourier, task)) {
        return;
    }

    try {
        const response = await fetch(`${API_URL}/tasks/${taskId}`, {
            method: "PATCH",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({ courier_id: newCourierId }),
        });

        if (!response.ok) {
            const errorData = await response.json();
            throw new Error(errorData.error || "Ошибка передачи задания");
        }

        showSuccessMessage("Задание успешно передано!");
    } catch (error) {
        alert(`Ошибка при передаче задания: ${error.message}`);
    }
});




    cancelTaskBtn.addEventListener("click", () => hideModal(taskModal));
    addCourierBtn.addEventListener("click", () => showModal(courierModal));
    cancelCourierBtn.addEventListener("click", () => hideModal(courierModal));

    saveCourierBtn.addEventListener("click", async () => {
        const fullName = document.getElementById("courier-full-name").value;
        const regionId = parseInt(document.getElementById("courier-region-id").value, 10);
        const maxCells = parseInt(document.getElementById("courier-max-cells").value, 10);

        if (!fullName || isNaN(regionId) || isNaN(maxCells)) {
            alert("Пожалуйста, заполните все поля!");
            return;
        }

        try {
            await fetch(`${API_URL}/couriers`, {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({ full_name: fullName, region_id: regionId, max_cells: maxCells }),
            });
            alert("Курьер успешно добавлен!");
            hideModal(courierModal);
            await displayCouriers();
        } catch (error) {
            alert("Ошибка при добавлении курьера!");
        }
    });

    await displayCouriers();
});
