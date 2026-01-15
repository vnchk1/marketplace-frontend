// Работа с каталогом товаров
let allGoods = [];
let filteredGoods = [];
let currentPage = 1;
const perPage = 12;

async function loadGoods() {
    try {
        allGoods = await getGoods();
        filteredGoods = [...allGoods];
        renderGoods();
        populateCategories();
    } catch (error) {
        showNotification('Ошибка при загрузке товаров: ' + error.message, 'error');
    }
}

function renderGoods() {
    const productsGrid = document.getElementById('productsGrid');
    if (!productsGrid) return;

    const sortValue = document.getElementById('sortSelect')?.value || 'rating-desc';
    const sortedGoods = sortGoods([...filteredGoods], sortValue);
    
    const startIndex = 0;
    const endIndex = currentPage * perPage;
    const goodsToShow = sortedGoods.slice(startIndex, endIndex);

    productsGrid.innerHTML = '';

    if (goodsToShow.length === 0) {
        productsGrid.innerHTML = '<p style="grid-column: 1 / -1; text-align: center; padding: 2rem; color: #7f8c8d;">Товары не найдены</p>';
        return;
    }

    goodsToShow.forEach(good => {
        const card = createProductCard(good);
        productsGrid.appendChild(card);
    });

    const loadMoreButton = document.getElementById('loadMoreButton');
    if (loadMoreButton) {
        if (endIndex < sortedGoods.length) {
            loadMoreButton.style.display = 'block';
        } else {
            loadMoreButton.style.display = 'none';
        }
    }
}

function createProductCard(good) {
    const card = document.createElement('div');
    card.className = 'product-card';

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
        <button class="add-button" onclick="addToCart(${good.id})">Добавить</button>
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

function sortGoods(goods, sortValue) {
    const sorted = [...goods];

    switch (sortValue) {
        case 'rating-desc':
            return sorted.sort((a, b) => b.rating - a.rating);
        case 'rating-asc':
            return sorted.sort((a, b) => a.rating - b.rating);
        case 'price-desc':
            return sorted.sort((a, b) => {
                const priceA = a.discount_price && a.discount_price < a.actual_price ? a.discount_price : a.actual_price;
                const priceB = b.discount_price && b.discount_price < b.actual_price ? b.discount_price : b.actual_price;
                return priceB - priceA;
            });
        case 'price-asc':
            return sorted.sort((a, b) => {
                const priceA = a.discount_price && a.discount_price < a.actual_price ? a.discount_price : a.actual_price;
                const priceB = b.discount_price && b.discount_price < b.actual_price ? b.discount_price : b.actual_price;
                return priceA - priceB;
            });
        default:
            return sorted;
    }
}

function populateCategories() {
    const categoriesList = document.getElementById('categoriesList');
    if (!categoriesList) return;

    const categories = [...new Set(allGoods.map(good => good.main_category))].sort();

    categoriesList.innerHTML = '';

    categories.forEach(category => {
        const label = document.createElement('label');
        label.className = 'checkbox-label';
        label.innerHTML = `
            <input type="checkbox" value="${category}" class="category-checkbox">
            ${category}
        `;
        categoriesList.appendChild(label);
    });
}

function applyFilters() {
    const categoryCheckboxes = document.querySelectorAll('.category-checkbox:checked');
    const selectedCategories = Array.from(categoryCheckboxes).map(cb => cb.value);
    
    const priceFrom = parseFloat(document.getElementById('priceFrom')?.value) || 0;
    const priceTo = parseFloat(document.getElementById('priceTo')?.value) || Infinity;
    const discountOnly = document.getElementById('discountOnly')?.checked || false;

    filteredGoods = allGoods.filter(good => {
        if (selectedCategories.length > 0 && !selectedCategories.includes(good.main_category)) {
            return false;
        }

        const price = good.discount_price && good.discount_price < good.actual_price 
            ? good.discount_price 
            : good.actual_price;

        if (price < priceFrom || price > priceTo) {
            return false;
        }

        if (discountOnly && (!good.discount_price || good.discount_price >= good.actual_price)) {
            return false;
        }

        return true;
    });

    currentPage = 1;
    renderGoods();
}

function addToCart(goodId) {
    let cart = JSON.parse(localStorage.getItem('cart') || '[]');
    
    if (!cart.includes(goodId)) {
        cart.push(goodId);
        localStorage.setItem('cart', JSON.stringify(cart));
        showNotification('Товар добавлен в корзину', 'success');
    } else {
        showNotification('Товар уже в корзине', 'info');
    }
}

function loadMore() {
    currentPage++;
    renderGoods();
}
