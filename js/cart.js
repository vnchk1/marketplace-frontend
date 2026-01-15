// Работа с корзиной
let cartGoods = [];

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

async function initCart() {
    await loadCartItems();
    setupOrderForm();
    updateTotalPrice();
}

async function loadCartItems() {
    const cartIds = JSON.parse(localStorage.getItem('cart') || '[]');
    
    if (cartIds.length === 0) {
        document.getElementById('cartItems').style.display = 'none';
        document.getElementById('emptyCart').style.display = 'block';
        return;
    }

    document.getElementById('cartItems').style.display = 'grid';
    document.getElementById('emptyCart').style.display = 'none';

    try {
        cartGoods = await Promise.all(cartIds.map(id => getGood(id)));
        renderCartItems();
    } catch (error) {
        showNotification('Ошибка при загрузке товаров: ' + error.message, 'error');
    }
}

function renderCartItems() {
    const cartItems = document.getElementById('cartItems');
    if (!cartItems) return;

    cartItems.innerHTML = '';

    cartGoods.forEach(good => {
        const card = createCartItemCard(good);
        cartItems.appendChild(card);
    });
}

function createCartItemCard(good) {
    const card = document.createElement('div');
    card.className = 'cart-item-card';

    const hasDiscount = good.discount_price && good.discount_price < good.actual_price;
    const displayPrice = hasDiscount ? good.discount_price : good.actual_price;
    const discountPercent = hasDiscount 
        ? Math.round((1 - good.discount_price / good.actual_price) * 100) 
        : 0;

    card.innerHTML = `
        <img src="${good.image_url}" alt="${good.name}" class="product-image" onerror="this.src='data:image/svg+xml,%3Csvg xmlns=\'http://www.w3.org/2000/svg\' width=\'200\' height=\'200\'%3E%3Crect width=\'200\' height=\'200\' fill=\'%23f0f0f0\'/%3E%3Ctext x=\'50%25\' y=\'50%25\' text-anchor=\'middle\' dy=\'.3em\' fill=\'%23999\'%3EНет изображения%3C/text%3E%3C/svg%3E'">
        <div class="product-name">${good.name}</div>
        <div class="product-rating">
            <span class="rating-value">${good.rating.toFixed(1)}</span>
            <div class="stars">
                ${generateStars(good.rating)}
            </div>
        </div>
        <div class="product-price">
            <span class="price-current">${displayPrice} ₽</span>
            ${hasDiscount ? `
                <span class="price-original">${good.actual_price} ₽</span>
                <span class="discount-badge">-${discountPercent}%</span>
            ` : ''}
        </div>
        <button class="delete-button" onclick="removeFromCart(${good.id})">Удалить</button>
    `;

    return card;
}

function generateStars(rating) {
    const fullStars = Math.floor(rating);
    const hasHalfStar = rating % 1 >= 0.5;
    let starsHTML = '';

    for (let i = 0; i < 5; i++) {
        if (i < fullStars) {
            starsHTML += '<svg class="star" viewBox="0 0 24 24"><path d="M12 2l3.09 6.26L22 9.27l-5 4.87 1.18 6.88L12 17.77l-6.18 3.25L7 14.14 2 9.27l6.91-1.01L12 2z"/></svg>';
        } else if (i === fullStars && hasHalfStar) {
            starsHTML += '<svg class="star" viewBox="0 0 24 24"><path d="M12 2l3.09 6.26L22 9.27l-5 4.87 1.18 6.88L12 17.77l-6.18 3.25L7 14.14 2 9.27l6.91-1.01L12 2z"/></svg>';
        } else {
            starsHTML += '<svg class="star empty" viewBox="0 0 24 24"><path d="M12 2l3.09 6.26L22 9.27l-5 4.87 1.18 6.88L12 17.77l-6.18 3.25L7 14.14 2 9.27l6.91-1.01L12 2z"/></svg>';
        }
    }

    return starsHTML;
}

function removeFromCart(goodId) {
    let cart = JSON.parse(localStorage.getItem('cart') || '[]');
    cart = cart.filter(id => id !== goodId);
    localStorage.setItem('cart', JSON.stringify(cart));
    
    cartGoods = cartGoods.filter(good => good.id !== goodId);
    renderCartItems();
    updateTotalPrice();
    
    if (cart.length === 0) {
        document.getElementById('cartItems').style.display = 'none';
        document.getElementById('emptyCart').style.display = 'block';
    }
    
    showNotification('Товар удален из корзины', 'info');
}

function setupOrderForm() {
    const orderForm = document.getElementById('orderForm');
    if (!orderForm) return;

    const deliveryDate = document.getElementById('deliveryDate');
    const deliveryInterval = document.getElementById('deliveryInterval');
    
    if (deliveryDate) {
        deliveryDate.addEventListener('change', updateTotalPrice);
    }
    if (deliveryInterval) {
        deliveryInterval.addEventListener('change', updateTotalPrice);
    }

    orderForm.addEventListener('submit', handleOrderSubmit);
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

function updateTotalPrice() {
    const totalPriceElement = document.getElementById('totalPrice');
    if (!totalPriceElement) return;

    let goodsTotal = 0;
    cartGoods.forEach(good => {
        const price = good.discount_price && good.discount_price < good.actual_price 
            ? good.discount_price 
            : good.actual_price;
        goodsTotal += price;
    });

    const deliveryDate = document.getElementById('deliveryDate')?.value;
    const deliveryInterval = document.getElementById('deliveryInterval')?.value;
    const deliveryCost = calculateDeliveryCost(deliveryDate, deliveryInterval);

    const total = goodsTotal + deliveryCost;

    totalPriceElement.textContent = 
        `Итоговая стоимость: ${total} ₽ (стоимость доставки ${deliveryCost} ₽)`;
}

async function handleOrderSubmit(event) {
    event.preventDefault();

    if (cartGoods.length === 0) {
        showNotification('Корзина пуста', 'error');
        return;
    }

    const form = event.target;
    const formData = new FormData(form);

    const orderData = {
        full_name: formData.get('full_name'),
        email: formData.get('email'),
        phone: formData.get('phone'),
        subscribe: formData.get('subscribe') === 'on',
        delivery_address: formData.get('delivery_address'),
        delivery_date: formatDateForAPI(formData.get('delivery_date')),
        delivery_interval: formData.get('delivery_interval'),
        comment: formData.get('comment') || '',
        good_ids: cartGoods.map(good => good.id)
    };

    try {
        await createOrder(orderData);
        showNotification('Заказ успешно оформлен!', 'success');
        
        localStorage.removeItem('cart');
        
        setTimeout(() => {
            window.location.href = 'index.html';
        }, 1000);
    } catch (error) {
        showNotification('Ошибка при оформлении заказа: ' + error.message, 'error');
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

if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', initCart);
} else {
    initCart();
}
