// API для взаимодействия с сервером
const API_BASE_URL = 'https://edu.std-900.ist.mospolytech.ru/exam-2024-1/api';
const API_KEY = '13e357d1-1f58-4491-91a5-427d5c6c0f59';

// Выполняет HTTP запрос к API
async function apiRequest(endpoint, method = 'GET', data = null) {
    const separator = endpoint.includes('?') ? '&' : '?';
    const url = `${API_BASE_URL}${endpoint}${separator}api_key=${API_KEY}`;
    
    const options = {
        method: method,
        headers: {}
    };

    if (data && (method === 'POST' || method === 'PUT')) {
        options.headers['Content-Type'] = 'application/json';
        options.body = JSON.stringify(data);
    }

    try {
        const response = await fetch(url, options);
        const result = await response.json();

        if (result.error) {
            throw new Error(result.error);
        }

        return result;
    } catch (error) {
        console.error('API Error:', error);
        throw error;
    }
}

// Получение товаров
async function getGoods(params = {}) {
    let endpoint = '/goods';
    const queryParams = new URLSearchParams();
    
    if (params.page) queryParams.append('page', params.page);
    if (params.per_page) queryParams.append('per_page', params.per_page);
    if (params.query) queryParams.append('query', params.query);
    
    if (queryParams.toString()) {
        endpoint += '?' + queryParams.toString();
    }
    
    return await apiRequest(endpoint);
}

async function getGood(goodId) {
    return await apiRequest(`/goods/${goodId}`);
}

async function getAutocomplete(query) {
    const endpoint = `/autocomplete?query=${encodeURIComponent(query)}`;
    return await apiRequest(endpoint);
}

// Работа с заказами
async function getOrders() {
    return await apiRequest('/orders');
}

async function getOrder(orderId) {
    return await apiRequest(`/orders/${orderId}`);
}

async function createOrder(orderData) {
    return await apiRequest('/orders', 'POST', orderData);
}

async function updateOrder(orderId, orderData) {
    return await apiRequest(`/orders/${orderId}`, 'PUT', orderData);
}

async function deleteOrder(orderId) {
    return await apiRequest(`/orders/${orderId}`, 'DELETE');
}
