// Работа с заказами
let orders = [];
let currentOrderId = null;

function showNotification(message, type = 'info') {
    const notificationArea = document.getElementById('notificationArea');
    if (!notificationArea) return;

    const notification = document.createElement('div');
    notification.className = `notification ${type}`;
    notification.textContent = message;

    notificationArea.appendChild(notification);

    setTimeout(() => {
        notification.style.animation = 'slideOut 0.3s ease-out';
        setTimeout(() => {
            notification.remove();
        }, 300);
    }, 5000);
}

if (!document.getElementById('notificationStyles')) {
    const style = document.createElement('style');
    style.id = 'notificationStyles';
    style.textContent = `
        @keyframes slideOut {
            from {
                transform: translateX(0);
                opacity: 1;
            }
            to {
                transform: translateX(100%);
                opacity: 0;
            }
        }
    `;
    document.head.appendChild(style);
}

async function initOrders() {
    await loadOrders();
    setupModalHandlers();
}

async function loadOrders() {
    try {
        orders = await getOrders();
        renderOrders();
    } catch (error) {
        showNotification('Ошибка при загрузке заказов: ' + error.message, 'error');
    }
}

function renderOrders() {
    const tableBody = document.getElementById('ordersTableBody');
    if (!tableBody) return;

    tableBody.innerHTML = '';

    if (orders.length === 0) {
        tableBody.innerHTML = '<tr><td colspan="6" style="text-align: center; padding: 2rem; color: #7f8c8d;">Заказы не найдены</td></tr>';
        return;
    }

    orders.forEach((order, index) => {
        const row = createOrderRow(order, index + 1);
        tableBody.appendChild(row);
    });
}

function createOrderRow(order, number) {
    const row = document.createElement('tr');

    const createdAt = new Date(order.created_at);
    const dateStr = createdAt.toLocaleDateString('ru-RU', {
        day: '2-digit',
        month: '2-digit',
        year: 'numeric'
    });
    const timeStr = createdAt.toLocaleTimeString('ru-RU', {
        hour: '2-digit',
        minute: '2-digit'
    });

    const deliveryDate = new Date(order.delivery_date);
    const deliveryDateStr = deliveryDate.toLocaleDateString('ru-RU', {
        day: '2-digit',
        month: '2-digit',
        year: 'numeric'
    });

    const orderComposition = order.good_ids ? 
        `Товар ${order.good_ids.join(', ')}` : 
        'Состав не указан';

    row.innerHTML = `
        <td>${number}</td>
        <td>${dateStr} ${timeStr}</td>
        <td>${orderComposition}</td>
        <td>${calculateOrderTotal(order)} ₽</td>
        <td>${deliveryDateStr} ${order.delivery_interval}</td>
        <td>
            <div class="action-buttons">
                <button class="action-button" onclick="viewOrder(${order.id})" title="Просмотр">
                    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                        <path d="M1 12s4-8 11-8 11 8 11 8-4 8-11 8-11-8-11-8z"/>
                        <circle cx="12" cy="12" r="3"/>
                    </svg>
                </button>
                <button class="action-button" onclick="editOrder(${order.id})" title="Редактирование">
                    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                        <path d="M11 4H4a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2v-7"/>
                        <path d="M18.5 2.5a2.121 2.121 0 0 1 3 3L12 15l-4 1 1-4 9.5-9.5z"/>
                    </svg>
                </button>
                <button class="action-button" onclick="openDeleteOrderModal(${order.id})" title="Удаление">
                    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                        <polyline points="3 6 5 6 21 6"/>
                        <path d="M19 6v14a2 2 0 0 1-2 2H7a2 2 0 0 1-2-2V6m3 0V4a2 2 0 0 1 2-2h4a2 2 0 0 1 2 2v2"/>
                    </svg>
                </button>
            </div>
        </td>
    `;

    return row;
}

function calculateOrderTotal(order) {
    const deliveryCost = calculateDeliveryCost(order.delivery_date, order.delivery_interval);
    const estimatedGoodsCost = order.good_ids ? order.good_ids.length * 2000 : 0;
    return estimatedGoodsCost + deliveryCost;
}

function calculateDeliveryCost(deliveryDate, deliveryInterval) {
    if (!deliveryDate) return 200;

    const date = new Date(deliveryDate);
    const dayOfWeek = date.getDay();
    const isWeekend = dayOfWeek === 0 || dayOfWeek === 6;
    
    let cost = 200;

    if (isWeekend) {
        cost += 300;
    }

    if (!isWeekend && deliveryInterval === '18:00-22:00') {
        cost += 200;
    }

    return cost;
}

async function viewOrder(orderId) {
    try {
        const order = await getOrder(orderId);
        showViewOrderModal(order);
    } catch (error) {
        showNotification('Ошибка при загрузке заказа: ' + error.message, 'error');
    }
}

function showViewOrderModal(order) {
    const modal = document.getElementById('viewOrderModal');
    const content = document.getElementById('viewOrderContent');
    
    if (!modal || !content) return;

    const createdAt = new Date(order.created_at);
    const dateStr = createdAt.toLocaleDateString('ru-RU', {
        day: '2-digit',
        month: '2-digit',
        year: 'numeric'
    });
    const timeStr = createdAt.toLocaleTimeString('ru-RU', {
        hour: '2-digit',
        minute: '2-digit'
    });

    const deliveryDate = new Date(order.delivery_date);
    const deliveryDateStr = deliveryDate.toLocaleDateString('ru-RU', {
        day: '2-digit',
        month: '2-digit',
        year: 'numeric'
    });

    content.innerHTML = `
        <div><strong>Дата оформления:</strong></div>
        <div>${dateStr} ${timeStr}</div>
        <div><strong>Имя:</strong></div>
        <div>${order.full_name}</div>
        <div><strong>Номер телефона:</strong></div>
        <div>${order.phone}</div>
        <div><strong>Email:</strong></div>
        <div>${order.email}</div>
        <div><strong>Адрес доставки:</strong></div>
        <div>${order.delivery_address}</div>
        <div><strong>Дата доставки:</strong></div>
        <div>${deliveryDateStr}</div>
        <div><strong>Время доставки:</strong></div>
        <div>${order.delivery_interval}</div>
        <div><strong>Состав заказа:</strong></div>
        <div>${order.good_ids ? `Товар ${order.good_ids.join(', ')}` : 'Не указан'}</div>
        <div><strong>Стоимость:</strong></div>
        <div>${calculateOrderTotal(order)} ₽</div>
        <div><strong>Комментарий:</strong></div>
        <div>${order.comment || 'Нет комментария'}</div>
    `;

    modal.classList.add('show');
}

async function editOrder(orderId) {
    try {
        const order = await getOrder(orderId);
        currentOrderId = orderId;
        showEditOrderModal(order);
    } catch (error) {
        showNotification('Ошибка при загрузке заказа: ' + error.message, 'error');
    }
}

function showEditOrderModal(order) {
    const modal = document.getElementById('editOrderModal');
    const form = document.getElementById('editOrderForm');
    
    if (!modal || !form) return;

    const createdAt = new Date(order.created_at);
    const dateStr = createdAt.toLocaleDateString('ru-RU', {
        day: '2-digit',
        month: '2-digit',
        year: 'numeric'
    });
    const timeStr = createdAt.toLocaleTimeString('ru-RU', {
        hour: '2-digit',
        minute: '2-digit'
    });

    const deliveryDate = new Date(order.delivery_date);
    const deliveryDateInput = deliveryDate.toISOString().split('T')[0];

    form.innerHTML = `
        <div>
            <label>Дата оформления:</label>
            <div class="readonly-field">${dateStr} ${timeStr}</div>
        </div>
        <div>
            <label for="editFullName">Имя:</label>
            <input type="text" id="editFullName" name="full_name" value="${order.full_name}" required>
        </div>
        <div>
            <label for="editPhone">Номер телефона:</label>
            <input type="text" id="editPhone" name="phone" value="${order.phone}" required>
        </div>
        <div>
            <label for="editEmail">Email:</label>
            <input type="email" id="editEmail" name="email" value="${order.email}" required>
        </div>
        <div>
            <label for="editDeliveryAddress">Адрес доставки:</label>
            <input type="text" id="editDeliveryAddress" name="delivery_address" value="${order.delivery_address}" required>
        </div>
        <div>
            <label for="editDeliveryDate">Дата доставки:</label>
            <input type="date" id="editDeliveryDate" name="delivery_date" value="${deliveryDateInput}" required>
        </div>
        <div>
            <label for="editDeliveryInterval">Временной интервал доставки:</label>
            <select id="editDeliveryInterval" name="delivery_interval" required>
                <option value="08:00-12:00" ${order.delivery_interval === '08:00-12:00' ? 'selected' : ''}>08:00-12:00</option>
                <option value="12:00-14:00" ${order.delivery_interval === '12:00-14:00' ? 'selected' : ''}>12:00-14:00</option>
                <option value="14:00-18:00" ${order.delivery_interval === '14:00-18:00' ? 'selected' : ''}>14:00-18:00</option>
                <option value="18:00-22:00" ${order.delivery_interval === '18:00-22:00' ? 'selected' : ''}>18:00-22:00</option>
            </select>
        </div>
        <div>
            <label for="editOrderComposition">Состав заказа:</label>
            <textarea id="editOrderComposition" name="good_ids" rows="3" readonly>${order.good_ids ? order.good_ids.join(', ') : ''}</textarea>
        </div>
        <div>
            <label>Стоимость:</label>
            <div class="readonly-field">${calculateOrderTotal(order)} ₽</div>
        </div>
        <div>
            <label for="editComment">Комментарий:</label>
            <input type="text" id="editComment" name="comment" value="${order.comment || ''}">
        </div>
    `;

    modal.classList.add('show');
}

async function handleEditOrderSubmit(event) {
    event.preventDefault();

    if (!currentOrderId) return;

    const form = event.target;
    const formData = new FormData(form);

    const orderData = {
        full_name: formData.get('full_name'),
        email: formData.get('email'),
        phone: formData.get('phone'),
        delivery_address: formData.get('delivery_address'),
        delivery_date: formatDateForAPI(formData.get('delivery_date')),
        delivery_interval: formData.get('delivery_interval'),
        comment: formData.get('comment') || ''
    };

    try {
        await updateOrder(currentOrderId, orderData);
        showNotification('Заказ успешно обновлен', 'success');
        closeModal('editOrderModal');
        await loadOrders();
    } catch (error) {
        showNotification('Ошибка при обновлении заказа: ' + error.message, 'error');
    }
}

function openDeleteOrderModal(orderId) {
    currentOrderId = orderId;
    const modal = document.getElementById('deleteOrderModal');
    if (modal) {
        modal.classList.add('show');
    }
}

async function confirmDeleteOrder() {
    if (!currentOrderId) return;

    try {
        await deleteOrder(currentOrderId);
        showNotification('Заказ успешно удален', 'success');
        closeModal('deleteOrderModal');
        await loadOrders();
        currentOrderId = null;
    } catch (error) {
        showNotification('Ошибка при удалении заказа: ' + error.message, 'error');
    }
}

function formatDateForAPI(dateString) {
    if (!dateString) return '';
    
    const date = new Date(dateString);
    const day = String(date.getDate()).padStart(2, '0');
    const month = String(date.getMonth() + 1).padStart(2, '0');
    const year = date.getFullYear();
    
    return `${day}.${month}.${year}`;
}

function setupModalHandlers() {
    document.querySelectorAll('.modal-close, .cancel-button').forEach(button => {
        button.addEventListener('click', function() {
            const modalId = this.getAttribute('data-modal');
            if (modalId) {
                closeModal(modalId);
            }
        });
    });

    document.querySelectorAll('.modal').forEach(modal => {
        modal.addEventListener('click', function(event) {
            if (event.target === this) {
                this.classList.remove('show');
            }
        });
    });

    const editForm = document.getElementById('editOrderForm');
    if (editForm) {
        editForm.addEventListener('submit', handleEditOrderSubmit);
    }

    const confirmDeleteButton = document.getElementById('confirmDeleteButton');
    if (confirmDeleteButton) {
        confirmDeleteButton.addEventListener('click', confirmDeleteOrder);
    }
}

function closeModal(modalId) {
    const modal = document.getElementById(modalId);
    if (modal) {
        modal.classList.remove('show');
    }
}

if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', initOrders);
} else {
    initOrders();
}
