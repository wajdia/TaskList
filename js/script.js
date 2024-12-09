/**
 *
 */
class Task {
    constructor(taskName, category, priority, dueTo, description) {
        this.taskName = taskName;
        this.dueTo = dueTo;
        this.priority = priority;
        this.description = description;
        this.category = category;
    }
}

/**
 * module for fields check - returns object of functions
 * @type {{legalTaskName: (function(*): boolean), isEmpty: (function(*): boolean), legalDescription: (function(*): boolean)}}
 */
const FieldsChecker = (() => {
    return {
        isEmpty: str => str.trim().length === 0,
        legalTaskName: taskName => /^[a-zA-Z0-9\s]+$/.test(taskName),
        legalDescription: description => /^[a-zA-Z0-9\s.,!?'" -]*$/.test(description)
    };
})();

/**
 * module validating each task, return the main function validateTask, and object of err msgs
 * @type {{validateTask: validateTask, messages: {DUE_TO_MSG: string, TASK_NAME_INVALID_MSG: string, CHOOSE_CATEGORY_MSG: string, EMPTY_FIELD: string, DESCRIPTION_INVALID_MSG: string}}}
 */
const TaskValidator = (() => {
    const EMPTY_FIELD = 'This field cannot be empty!';
    const TASK_NAME_INVALID_MSG = "Task name can only include letters, numbers, and spaces.";
    const DESCRIPTION_INVALID_MSG = "Description can only include letters, numbers, and usual punctuation.";
    const CHOOSE_CATEGORY_MSG = "Category must be chosen.";
    const DUE_TO_MSG = "Due date and time must be chosen.";

    const validateTask = task => {
        if (!(task instanceof Task)) {
            throw new Error("Invalid task object!");
        }
        const errors = {};

        if (FieldsChecker.isEmpty(task.taskName)) {
            errors.taskName = EMPTY_FIELD;
        } else if (!FieldsChecker.legalTaskName(task.taskName)) {
            errors.taskName = TASK_NAME_INVALID_MSG;
        }

        if (FieldsChecker.isEmpty(task.category)) {
            errors.category = CHOOSE_CATEGORY_MSG;
        }

        if (FieldsChecker.isEmpty(task.dueTo)) {
            errors.dueTo = DUE_TO_MSG;
        }

        if (!FieldsChecker.legalDescription(task.description)) {
            errors.description = DESCRIPTION_INVALID_MSG;
        }

        if (Object.keys(errors).length > 0) {
            throw errors;
        }
    };

    return {
        validateTask,
        messages : {
            EMPTY_FIELD,
            TASK_NAME_INVALID_MSG,
            DESCRIPTION_INVALID_MSG,
            CHOOSE_CATEGORY_MSG,
            DUE_TO_MSG,
        },
    };
})();

/**
 *module for managing tasks, retuerns object of functions to add,delete,sort and get all tasks
 * @type {{getTasksList: (function(): *[]), deleteTask: deleteTask, addTask: addTask, sortByDueDate: sortByDueDate}}
 */
const Tasks = (() => {
    let tasksList = [];

    const addTask = (taskName, category, priority, dueTo, description) => {
        const task = new Task(taskName, category, priority, dueTo, description);
        TaskValidator.validateTask(task);
        tasksList.push(task);
    };

    const deleteTask = (taskName) => {
        tasksList = tasksList.filter(task => task.taskName !== taskName);
    };

    const sortByDueDate = () => {
        tasksList.sort((a, b) => new Date(a.dueTo) - new Date(b.dueTo));
    };

    return {
        getTasksList: () => tasksList,
        addTask,
        deleteTask,
        sortByDueDate,
    };
})();

/**
 *function that applies sort or filter on tasks
 */
const applyFiltersAndSort = () => {
    const categoryFilter = document.getElementById('fulter').value;
    const sortOrder = document.querySelector('input[name="sort"]:checked')?.value;

    let tasks = Tasks.getTasksList();

    if (categoryFilter && categoryFilter !== 'all') {
        tasks = tasks.filter(task => task.category === categoryFilter);
    }

    if (sortOrder === 'asc') {
        tasks.sort((a, b) => new Date(a.dueTo) - new Date(b.dueTo));
    } else if (sortOrder === 'desc') {
        tasks.sort((a, b) => new Date(b.dueTo) - new Date(a.dueTo));
    }

    DOM.updateTaskList(tasks);
};

/**
 * function calculate remaining time for each task in XD XH XM
 * @param dueDate
 * @returns {string}
 */
const calculateRemainingTime = (dueDate) => {
    const now = new Date();
    const due = new Date(dueDate);
    const diff = due - now;

    if (diff < 0) return "Overdue";

    const minutes = Math.floor(diff / 1000 / 60) % 60;
    const hours = Math.floor(diff / 1000 / 60 / 60) % 24;
    const days = Math.floor(diff / 1000 / 60 / 60 / 24);

    let timeString = '';
    if (days > 0) timeString += `${days}D `;
    if (hours > 0) timeString += `${hours}H `;
    if (minutes >= 0) timeString += `${minutes}M `;

    return timeString.trim();
};
/**
 *module manipulating the dom, returns object of functions
 * @type {
 * {displayError: DOM.displayError,
 * clearError: DOM.clearError,
 * updateTaskList: DOM.updateTaskList}}
 */
const DOM = (() => {
    let updateInterval = null;

    return {
        displayError: (elementId, error) => {
            document.getElementById(elementId).innerHTML = error;
        },
        clearError: (elementId) => {
            document.getElementById(elementId).innerHTML = '';
        },
        updateTaskList: (tasksList) => {
            const emptyList = document.getElementById('emptyList');
            emptyList.innerHTML = tasksList.length > 0 ? 'Tasks List' : 'Your Task List is empty!';
            const taskList = document.getElementById('taskList');
            taskList.innerHTML = '';

            tasksList.forEach(task => {
                const taskItem = document.createElement('li');
                taskItem.className = 'list-group-item d-flex justify-content-between align-items-center';

                const taskDetails = document.createElement('div');
                taskDetails.className = 'task-details';

                const taskName = document.createElement('strong');
                taskName.textContent = task.taskName;

                const taskInfo = document.createElement('span');
                taskInfo.textContent = task.priority ?` - (${task.category}) - ${task.priority} priority - `:`- (${task.category}) -`;

                const taskDescription = document.createElement('p');
                taskDescription.textContent = task.description;
                taskDescription.classList.add('fw-light');

                const remainingTime = document.createElement('span');
                remainingTime.className = 'remaining-time';
                remainingTime.textContent = ` ${calculateRemainingTime(task.dueTo)}`;
                remainingTime.dataset.dueTo = task.dueTo;
                remainingTime.classList.add('fw-bolder');
                if (remainingTime.textContent.trim() === 'Overdue') {
                    taskItem.classList.add('bg-danger');
                    taskItem.classList.add('bg-gradient');
                }
                taskDetails.appendChild(taskName);
                taskDetails.appendChild(taskInfo);
                taskDetails.appendChild(remainingTime);
                taskDetails.appendChild(taskDescription);

                const buttonContainer = document.createElement('div');

                const editButton = document.createElement('button');
                editButton.textContent = 'Edit';
                editButton.className = 'btn btn-sm btn-warning me-2';
                editButton.addEventListener('click', () => {
                    document.getElementById('mainList').style.display = 'none';
                    document.getElementById('taskForm').style.display = 'block';

                    UI.setTaskBeingEdited(task);

                    document.getElementById('taskName').value = task.taskName;
                    document.getElementById('category').value = task.category;
                    document.querySelector(`input[name="priority"][value="${task.priority}"]`).checked = true;
                    document.getElementById('dueDate').value = task.dueTo;
                    document.getElementById('description').value = task.description;

                    Tasks.deleteTask(task.taskName);
                    DOM.updateTaskList(Tasks.getTasksList());
                });

                const deleteButton = document.createElement('button');
                deleteButton.textContent = 'Delete';
                deleteButton.className = 'btn btn-sm btn-danger';
                deleteButton.addEventListener('click', () => {
                    Tasks.deleteTask(task.taskName);
                    DOM.updateTaskList(Tasks.getTasksList());
                });

                buttonContainer.appendChild(editButton);
                buttonContainer.appendChild(deleteButton);

                taskItem.appendChild(taskDetails);
                taskItem.appendChild(buttonContainer);
                taskList.appendChild(taskItem);
            });

            if (updateInterval) clearInterval(updateInterval);

            updateInterval = setInterval(() => {
                const taskItems = document.querySelectorAll('.remaining-time');
                taskItems.forEach(remainingTimeElem => {
                    const dueTo = remainingTimeElem.dataset.dueTo;

                    const taskItem = remainingTimeElem.closest('.list-group-item');
                    remainingTimeElem.textContent = `${calculateRemainingTime(dueTo)}`;
                    if (remainingTimeElem.textContent.trim() === 'Overdue') {
                        taskItem.classList.add('bg-danger');
                        taskItem.classList.add('bg-gradient');
                    } else {
                        taskItem.classList.remove('bg-danger');
                    }
                });
            }, 60000);
        },
    };
})();



/**
 *module managing the form of adding tasks, checking/clearing errors, returns initiatizing function
 * @type {{init: UI.init}}
 */
const UI = (() => {
    let taskBeingEdited = null;

    const formHandler = (event) => {
        event.preventDefault();
        const taskName = document.getElementById('taskName').value;
        const category = document.getElementById('category').value;
        const priority = document.querySelector('input[name="priority"]:checked')?.value || '';
        const dueTo = document.getElementById('dueDate').value;
        const description = document.getElementById('description').value;

        try {
            const task = new Task(taskName, category, priority, dueTo, description);
            TaskValidator.validateTask(task);

            Tasks.addTask(taskName, category, priority, dueTo, description);

            DOM.clearError('taskNameErrMsg');
            DOM.clearError('categoryErrMsg');
            DOM.clearError('dueDateErrMsg');
            DOM.clearError('descriptionErrMsg');

            document.getElementById('taskForm').reset();
            const successModal = new bootstrap.Modal(document.getElementById('successModal'));
            successModal.show();
            DOM.updateTaskList(Tasks.getTasksList());

            document.getElementById('taskForm').style.display = 'none';
            document.getElementById('mainList').style.display = 'block';
            taskBeingEdited = null;

        } catch (errors) {
            if (errors.taskName) DOM.displayError('taskNameErrMsg', errors.taskName);
            if (errors.category) DOM.displayError('categoryErrMsg', errors.category);
            if (errors.dueTo) DOM.displayError('dueDateErrMsg', errors.dueTo);
            if (errors.description) DOM.displayError('descriptionErrMsg', errors.description);
        }
    };

    const cancelHandler = () => {
        const mainList = document.getElementById('mainList');
        const taskForm = document.getElementById('taskForm');

        taskForm.style.display = 'none';
        mainList.style.display = 'block';

        if (taskBeingEdited) {
            Tasks.addTask(
                taskBeingEdited.taskName,
                taskBeingEdited.category,
                taskBeingEdited.priority,
                taskBeingEdited.dueTo,
                taskBeingEdited.description
            );
            DOM.updateTaskList(Tasks.getTasksList());
            taskBeingEdited = null;
        }
    };

    const clearErrorListeners = () => {
        document.getElementById('taskName').addEventListener('input', () => {
            DOM.clearError('taskNameErrMsg');
        });
        document.getElementById('category').addEventListener('change', () => {
            DOM.clearError('categoryErrMsg');
        });
        document.getElementById('dueDate').addEventListener('input', () => {
            DOM.clearError('dueDateErrMsg');
        });
        document.getElementById('description').addEventListener('input', () => {
            DOM.clearError('descriptionErrMsg');
        });
    };

    return {
        init: () => {
            document.getElementById('taskForm').addEventListener('submit', formHandler);
            document.getElementById('cancelButton').addEventListener('click', cancelHandler);
            clearErrorListeners();
        },
        setTaskBeingEdited: (task) => {
            taskBeingEdited = task;
        },
    };
})();
/**
 *module that manages the oprions of priority and category, fill them in dom, returns obj of the functions:
 * @type {{fillCategoryOptions: fillCategoryOptions, fillPriorityOptions: fillPriorityOptions}}
 */
const OptionsManager = (() => {
    const categorys = ['Work', 'Home', 'Shopping', 'College'];
    const prioritys = ['High', 'Medium', 'Low'];

    const fillCategoryOptions = (selectElementId) => {
        const categorySelect = document.getElementById(selectElementId);
        categorys.forEach(category => {
            const option = document.createElement('option');
            option.textContent = category;
            categorySelect.appendChild(option);
        });
    };

    const fillPriorityOptions = (containerElementId) => {
        const priorityContainer = document.getElementById(containerElementId);
        prioritys.forEach(priority => {
            const div = document.createElement('div');
            div.className = 'form-check m-2';
            const input = document.createElement('input');
            input.className = 'form-check-input';
            input.type = 'radio';
            input.name = 'priority';
            input.id = `${priority.toLowerCase()}Priority`;
            const label = document.createElement('label');
            label.className = 'form-check-label';
            label.setAttribute('for',`${priority.toLowerCase()}Priority`);
            label.textContent = priority;

            div.appendChild(input);
            div.appendChild(label);
            priorityContainer.appendChild(div);
        });
    };

    return {
        fillCategoryOptions,
        fillPriorityOptions,
    };
})();

/**
 * function to be called when the Dom fully loaded managing the app
 */
document.addEventListener('DOMContentLoaded', () => {

    OptionsManager.fillCategoryOptions('category');
    OptionsManager.fillCategoryOptions('fulter');
    OptionsManager.fillPriorityOptions('priorityGroup');

    const mainList = document.getElementById('mainList');
    const taskForm = document.getElementById('taskForm');
    const addTaskButton = mainList.querySelector('.btn-primary');
    const cancelButton = document.getElementById('cancelButton');
    const categoryFilter = document.getElementById('fulter');
    const sortInputs = document.querySelectorAll('input[name="sort"]');

    mainList.style.display = 'block';
    taskForm.style.display = 'none';

    addTaskButton.addEventListener('click', () => {
        DOM.updateTaskList(Tasks.getTasksList());
        document.getElementById('taskListForm').reset();
        mainList.style.display = 'none';
        taskForm.style.display = 'block';
    });

    cancelButton.addEventListener('click', () => {
        document.getElementById('taskForm').reset();
        taskForm.style.display = 'none';
        mainList.style.display = 'block';
    });

    categoryFilter.addEventListener('change', applyFiltersAndSort);

    sortInputs.forEach(input => {
        input.addEventListener('change', applyFiltersAndSort);
    });

    UI.init();
});
