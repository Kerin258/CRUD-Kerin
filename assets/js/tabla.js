/**
 * CRUD de Personas - Sistema Escolar
 *
 * Este script maneja todas las operaciones CRUD (Crear, Leer, Actualizar, Borrar)
 * para la entidad 'Persona' usando AJAX (Fetch API) y Bootstrap 5 para
 * los modales y notificaciones.
 *
 */

// --- CONSTANTES GLOBALES ---
const API_URL = 'https://fi.jcaguilar.dev/v1/escuela/persona';

// --- ELEMENTOS DEL DOM (PRINCIPALES) ---
const tableContainer = document.getElementById('table-container');
const newPersonButton = document.getElementById('newPersonButton');
const tableLoader = document.getElementById('table-loader'); // Spinner overlay

// --- ELEMENTOS DEL MODAL DE REGISTRO ---
const registroModalElement = document.getElementById('registroModal');
const registroModal = new bootstrap.Modal(registroModalElement);
const modalTitle = document.getElementById('modalTitle');
const registroForm = document.getElementById('registroForm');
const btnGuardar = document.getElementById('btnGuardar');
const alertMessage = document.getElementById('alertMessage'); // Alerta DENTRO del modal
const personIdInput = document.getElementById('personId'); // Input oculto

// --- ELEMENTOS DEL MODAL DE BORRADO ---
const deleteModalElement = document.getElementById('deleteModal');
const deleteModal = new bootstrap.Modal(deleteModalElement);
const deleteModalBody = document.getElementById('deleteModalBody');
const btnConfirmDelete = document.getElementById('btnConfirmDelete');

// --- DATOS GLOBALES ---
let allPeopleData = []; // Caché de los datos para búsquedas rápidas al editar

// --- FUNCIONES DE UTILIDAD (ALERTAS Y NOTIFICACIONES) ---

/**
 * Muestra una alerta DENTRO del modal de registro.
 * @param {string} message - El mensaje a mostrar.
 * @param {string} type - El tipo de alerta de Bootstrap (e.g., 'danger', 'warning').
 */
function showModalAlert(message, type) {
    alertMessage.textContent = message;
    alertMessage.className = `alert alert-${type} d-block`;
}

/**
 * Muestra una notificación "Toast" en la esquina inferior derecha.
 * @param {string} message - El mensaje a mostrar.
 * @param {string} type - 'success' o 'danger'.
 */
function showGlobalAlert(message, type) {
    const toastContainer = document.querySelector('.toast-container');
    if (!toastContainer) return;

    // Define el estilo y el ícono según el tipo
    const isSuccess = type === 'success';
    const toastBgClass = isSuccess ? 'text-bg-success' : 'text-bg-danger';
    const toastIcon = isSuccess ? '✅' : '❌';

    // Crea el elemento Toast
    const toastElement = document.createElement('div');
    toastElement.className = `toast align-items-center ${toastBgClass} border-0`;
    toastElement.setAttribute('role', 'alert');
    toastElement.setAttribute('aria-live', 'assertive');
    toastElement.setAttribute('aria-atomic', 'true');
    toastElement.dataset.bsDelay = 4000; // Se oculta a los 4 seg

    toastElement.innerHTML = `
        <div class="d-flex">
            <div class="toast-body">
                ${toastIcon} ${message}
            </div>
            <button type="button" class="btn-close btn-close-white me-2 m-auto" data-bs-dismiss="toast" aria-label="Close"></button>
        </div>
    `;

    // Añade el toast al contenedor y lo muestra
    toastContainer.appendChild(toastElement);
    const toast = new bootstrap.Toast(toastElement);
    
    // (Buena práctica) Limpia el toast del DOM después de que se oculte
    toastElement.addEventListener('hidden.bs.toast', () => {
        toastElement.remove();
    });

    toast.show();
}

// --- LÓGICA DE CRUD ---

/**
 * 1. READ: Carga los datos de la API y llama a createTable.
 * Muestra el overlay de carga (spinner) durante la petición.
 */
async function loadTableData() {
    tableLoader.classList.remove('d-none'); // Muestra el spinner
    
    try {
        const response = await fetch(API_URL);
        const text = await response.text();
        let data;

        try { 
            data = text ? JSON.parse(text) : []; 
        } catch (e) { 
            data = { message: text };
        }

        if (!response.ok) {
            throw new Error(data.message || `Error HTTP: ${response.status}`);
        }
        
        allPeopleData = data; // Actualiza la caché de datos
        createTable(data); // Dibuja la tabla

    } catch (error) {
        console.error('Error al cargar la tabla:', error);
        tableContainer.innerHTML = `<p class="text-center p-4 text-danger">⚠️ Error al cargar los datos: ${error.message}</p>`;
    } finally {
        tableLoader.classList.add('d-none'); // Oculta el spinner
    }
}

/**
 * Función auxiliar para crear la tabla en el DOM.
 * @param {Array} data - El array de personas.
 */
function createTable(data) {
    tableContainer.innerHTML = ''; // Limpia el contenedor
    
    if (!Array.isArray(data) || data.length === 0) {
        tableContainer.innerHTML = '<p class="text-center p-4 text-danger">No se encontraron datos de personas.</p>';
        return;
    }

    const table = document.createElement('table');
    table.className = 'table table-striped table-hover shadow-sm';
    
    const thead = document.createElement('thead');
    const headerRow = document.createElement('tr');
    
    const displayedHeaders = ['Id', 'Nombre', 'Apellido', 'Sexo', 'Fh nac', 'Rol', 'Acciones'];

    displayedHeaders.forEach(headerText => {
        const th = document.createElement('th');
        th.textContent = headerText;
        th.setAttribute('scope', 'col'); // Buena práctica (accesibilidad)
        headerRow.appendChild(th);
    });

    thead.appendChild(headerRow);
    table.appendChild(thead);
    const tbody = document.createElement('tbody');

    data.forEach(person => {
        const row = document.createElement('tr');
        row.dataset.personId = person.id; // Almacena el ID en la fila

        // Evento click en la fila (para UPDATE)
        row.addEventListener('click', (e) => {
            // Evita que el clic en los botones active la edición de la fila
            if (e.target.closest('button')) return; 
            handleEdit(person.id);
        });

        // Celdas de datos
        const displayedKeys = ['id', 'nombre', 'apellido', 'sexo', 'fh_nac', 'rol'];
        displayedKeys.forEach(key => {
            const cell = document.createElement('td');
            cell.textContent = person[key];
            row.appendChild(cell);
        });
        
        // Celda de Acciones (Botones)
        const actionsCell = document.createElement('td');
        actionsCell.className = 'actions-cell';
        
        const editButton = document.createElement('button');
        editButton.innerHTML = 'Editar';
        editButton.className = 'btn btn-warning btn-sm';
        editButton.addEventListener('click', () => handleEdit(person.id));
        
        const deleteButton = document.createElement('button');
        deleteButton.innerHTML = 'Borrar';
        deleteButton.className = 'btn btn-danger btn-sm';
        deleteButton.addEventListener('click', () => handleDelete(person.id, `${person.nombre} ${person.apellido}`));
        
        actionsCell.appendChild(editButton);
        actionsCell.appendChild(deleteButton);
        row.appendChild(actionsCell);

        tbody.appendChild(row);
    });

    table.appendChild(tbody);
    tableContainer.appendChild(table);
    tableLoader.classList.add('d-none'); // Asegura que el loader esté oculto
}

/**
 * 2. CREATE: Prepara y muestra el modal para un nuevo registro.
 */
function handleCreateNew() {
    registroForm.reset(); // Limpia campos
    personIdInput.value = ''; // Asegura que no haya ID
    modalTitle.textContent = 'Registrar Nueva Persona';
    registroForm.classList.remove('was-validated'); // Quita estilos de validación
    alertMessage.className = 'alert d-none'; // Oculta alertas internas
    registroModal.show();
}

/**
 * 3. UPDATE: Carga los datos de una persona en el modal para editar.
 * @param {number} id - El ID de la persona a editar (obtenido de la caché 'allPeopleData').
 */
function handleEdit(id) {
    const person = allPeopleData.find(p => p.id === id);
    if (!person) {
        console.error("No se encontró la persona con id:", id);
        return;
    }

    registroForm.reset();
    registroForm.classList.remove('was-validated');
    alertMessage.className = 'alert d-none';
    
    // Llenar el formulario con los datos
    personIdInput.value = person.id;
    document.getElementById('nombre').value = person.nombre || '';
    document.getElementById('apellido').value = person.apellido || '';
    document.getElementById('fecha').value = person.fh_nac || '';
    
    // Mapeo de Rol (maneja inconsistencias si 'id_rol' está vacío)
    let rolValue = person.id_rol || '';
    if (!rolValue && person.rol) {
        if (person.rol.toLowerCase() === 'profesor') rolValue = '2';
        else if (person.rol.toLowerCase() === 'estudiante') rolValue = '1';
    }
    document.getElementById('rol').value = rolValue;

    // Mapeo de Sexo
    const sexoValue = (person.sexo || '').toUpperCase();
    document.getElementsByName('sexo').forEach(radio => {
        radio.checked = (radio.value.toUpperCase() === sexoValue);
    });

    modalTitle.textContent = 'Editar Persona';
    registroModal.show();
}

/**
 * 4. DELETE (Paso 1): Prepara y muestra el modal de confirmación.
 * @param {number} id - El ID de la persona a borrar.
 * @param {string} nombre - El nombre (para el mensaje de confirmación).
 */
function handleDelete(id, nombre) {
    // Guarda el ID y nombre en el botón de confirmar para usarlos después
    btnConfirmDelete.dataset.deleteId = id;
    btnConfirmDelete.dataset.deleteName = nombre;
    // Personaliza el mensaje del modal
    deleteModalBody.textContent = `¿Estás seguro de que deseas borrar a ${nombre} (ID: ${id})?`;
    // Muestra el modal de borrado
    deleteModal.show();
}

/**
 * 4. DELETE (Paso 2): Ejecuta la eliminación (función llamada por el botón 'btnConfirmDelete').
 * Muestra el spinner overlay durante la petición.
 * @param {number} id - El ID de la persona a borrar.
 * @param {string} nombre - El nombre de la persona.
 */
async function executeDelete(id, nombre) {
    tableLoader.classList.remove('d-none'); // Muestra el spinner
    let lastRaw = '';
    
    try {
        // La API parece tener múltiples formas de borrar, intentamos varias.
        
        // Intento 1: DELETE por ruta con id (DELETE /.../persona/123)
        let res = await fetch(`${API_URL}/${id}`, { method: 'DELETE' });
        lastRaw = await res.text();
        let data;
        try { data = lastRaw ? JSON.parse(lastRaw) : {}; } catch { data = { message: lastRaw }; }
        if (res.ok) {
            showGlobalAlert(`Persona (ID: ${id}) borrada exitosamente.`, 'success');
            loadTableData(); // Recarga la tabla (esto oculta el spinner)
            return;
        }

        // Intento 2: DELETE a la colección con body (DELETE /.../persona)
        const bodyPayload = { id_persona: parseInt(id), id: parseInt(id) };
        res = await fetch(API_URL, {
            method: 'DELETE',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify(bodyPayload)
        });
        lastRaw = await res.text();
        try { data = lastRaw ? JSON.parse(lastRaw) : {}; } catch { data = { message: lastRaw }; }
        if (res.ok) {
            showGlobalAlert(`Persona (ID: ${id}) borrada exitosamente.`, 'success');
            loadTableData(); // Recarga la tabla
            return;
        }
        
        // Intento 3: POST con override
        res = await fetch(API_URL, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json', 'X-HTTP-Method-Override': 'DELETE' },
            body: JSON.stringify(bodyPayload)
        });
        lastRaw = await res.text();
        try { data = lastRaw ? JSON.parse(lastRaw) : {}; } catch { data = { message: lastRaw }; }
        if (res.ok) {
            showGlobalAlert(`Persona (ID: ${id}) borrada exitosamente.`, 'success');
            loadTableData(); // Recarga la tabla
            return;
        }

        // Si todos fallan, lanza un error
        const serverMsg = (data && data.message) ? data.message : (lastRaw || `Error ${res.status}`);
        throw new Error(serverMsg);

    } catch (error) {
        console.error('Error en executeDelete:', error);
        tableLoader.classList.add('d-none'); // Oculta el spinner si hay error
        const rawPreview = lastRaw ? `\n\nRespuesta del servidor:\n${String(lastRaw).substring(0, 2000)}` : '';
        showGlobalAlert(`Error al borrar: ${error.message}${rawPreview}`, 'danger');
    }
}

/**
 * --- MANEJADOR DEL FORMULARIO (CREATE O UPDATE) ---
 * Se activa al presionar "Guardar Cambios" en el modal de registro.
 * @param {Event} event - El evento 'submit' del formulario.
 */
async function handleSubmit(event) {
    event.preventDefault(); // Evita el envío tradicional
    event.stopPropagation();

    // Requisito: Validación del lado del cliente
    if (!registroForm.checkValidity()) {
        registroForm.classList.add('was-validated');
        showModalAlert('Por favor, completa todos los campos obligatorios.', 'warning');
        return;
    }
    registroForm.classList.add('was-validated');

    // Requisito: Mensaje de proceso (deshabilitar botón)
    btnGuardar.disabled = true;
    btnGuardar.textContent = 'Guardando...';

    // 1. Recolectar datos del formulario
    const formData = new FormData(registroForm);
    const payload = {};
    formData.forEach((value, key) => {
        payload[key] = value;
    });
    
    // Asegura que el id_rol sea numérico
    if (payload.id_rol) {
        payload.id_rol = parseInt(payload.id_rol);
    }
    
    // 2. Decidir si es CREATE (POST) o UPDATE (PATCH)
    const id = personIdInput.value;
    const isUpdate = !!id; // Si hay un ID, es un Update

    const fetchUrl = API_URL;
    const fetchMethod = isUpdate ? 'PATCH' : 'POST';

    // Si es actualización (PATCH), la API espera 'id_persona' en el body
    if (isUpdate) {
        payload.id_persona = parseInt(id);
    }

    try {
        // 3. Enviar petición
        const response = await fetch(fetchUrl, {
            method: fetchMethod,
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify(payload)
        });

        const text = await response.text();
        let data;
        
        // JSON.parse() puede parsear texto que sea un número (ej: "1324")
        try { data = text ? JSON.parse(text) : {}; } catch { data = { message: text }; }

        if (!response.ok) {
            throw new Error(data.message || `Error HTTP: ${response.status}`);
        }
        
        // 4. Éxito: Preparar mensaje
        let finalId;
        if (isUpdate) {
            finalId = id; // Si es UPDATE, ya teníamos el ID
        } else {
            finalId = data || '(sin id en respuesta)'; // Si es CREATE, la API devuelve el ID
        }

        const successMessage = isUpdate 
            ? `Persona (ID: ${finalId}) actualizada exitosamente.`
            : `Persona (ID: ${finalId}) registrada exitosamente.`;
        
        showGlobalAlert(successMessage, 'success');
        registroModal.hide();
        loadTableData(); // Recarga la tabla (mostrará el spinner)

    } catch (error) {
        // 5. Error
        console.error('Error al guardar:', error);
        showModalAlert(`Falló el registro: ${error.message}`, 'danger');
    
    } finally {
        // 6. Siempre volver a habilitar el botón
        btnGuardar.disabled = false;
        btnGuardar.textContent = 'Guardar Cambios';
    }
}

// --- INICIALIZACIÓN ---
// Se ejecuta cuando el DOM está completamente cargado
document.addEventListener('DOMContentLoaded', () => {
    // 1. Carga la tabla por primera vez
    loadTableData();
    
    // 2. Asigna el evento al botón de "Agregar Nueva Persona"
    newPersonButton.addEventListener('click', handleCreateNew);
    
    // 3. Asigna el evento al 'submit' del formulario de registro
    registroForm.addEventListener('submit', handleSubmit);

    // 4. Asigna el evento al botón de "Sí, Eliminar" en el modal de borrado
    btnConfirmDelete.addEventListener('click', () => {
        // Obtiene el id y nombre guardados en el botón
        const id = btnConfirmDelete.dataset.deleteId;
        const nombre = btnConfirmDelete.dataset.deleteName;
        
        deleteModal.hide(); // Oculta el modal
        executeDelete(id, nombre); // Llama a la función de borrado
    });
});