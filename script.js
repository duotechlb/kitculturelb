/**
 * Kit Culture – Final Working Script
 * CORS fix + all close buttons functional
 */

// ======================== CONFIGURATION ========================
const APPS_SCRIPT_URL = "https://script.google.com/macros/s/AKfycbxqneQf-Uq23qPeGRbb1woB7cXnCvVij-pftM7WZzd8KGh8GRJdSfRCdZUx9hdUX9p0xQ/exec";
const CORS_PROXY = "";
const PRODUCTS_PER_PAGE = 12;

// Global state
let allProducts = [];
let filteredProducts = [];
let currentPage = 1;
let currentCategory = "all";
let currentSubcategory = null;
let currentSearchTerm = "";
let currentSort = "default";
let cart = [];

// DOM Elements (verify they exist)
const productsGrid = document.getElementById("products-grid");
const noResultsDiv = document.getElementById("no-results");
const paginationDiv = document.getElementById("pagination");
const productsTitle = document.getElementById("products-title");
const sortSelect = document.getElementById("sort-select");
const searchInput = document.getElementById("search-input");
const searchToggle = document.getElementById("search-toggle");
const searchBar = document.getElementById("search-bar");
const searchClose = document.getElementById("search-close");
const cartSidebar = document.getElementById("cart-sidebar");
const cartOverlay = document.getElementById("cart-overlay");
const cartToggle = document.getElementById("cart-toggle");
const cartClose = document.getElementById("cart-close");
const cartItemsList = document.getElementById("cart-items");
const cartEmptyDiv = document.getElementById("cart-empty");
const cartFooter = document.getElementById("cart-footer");
const cartTotalSpan = document.getElementById("cart-total-price");
const cartCountSpan = document.getElementById("cart-count");
const checkoutBtn = document.getElementById("checkout-btn");
const productModal = document.getElementById("product-modal");
const modalInner = document.getElementById("modal-inner");
const modalClose = document.getElementById("modal-close");
const modalBackdrop = document.getElementById("modal-backdrop");
const toast = document.getElementById("toast");

// ======================== Helper Functions ========================
function showToast(message, duration = 3000) {
    if (!toast) return;
    toast.textContent = message;
    toast.classList.add("show");
    setTimeout(() => toast.classList.remove("show"), duration);
}

function updateCartCount() {
    const totalItems = cart.reduce((sum, item) => sum + item.quantity, 0);
    if (totalItems > 0) {
        cartCountSpan.textContent = totalItems;
        cartCountSpan.classList.add("visible");
    } else {
        cartCountSpan.classList.remove("visible");
    }
}

function saveCart() {
    localStorage.setItem("kitCultureCart", JSON.stringify(cart));
    updateCartCount();
}

function loadCart() {
    const saved = localStorage.getItem("kitCultureCart");
    if (saved) {
        try { cart = JSON.parse(saved); } catch(e) { cart = []; }
    } else { cart = []; }
    updateCartCount();
    renderCartSidebar();
}

function addToCart(product, size, quantity = 1) {
    const existingIndex = cart.findIndex(item => item.id === product.id && item.size === size);
    if (existingIndex !== -1) {
        cart[existingIndex].quantity += quantity;
    } else {
        cart.push({
            id: product.id,
            name: product.name,
            price: product.price,
            size: size,
            quantity: quantity,
            imageUrl: product.imageUrl || ""
        });
    }
    saveCart();
    renderCartSidebar();
    showToast(`Added ${product.name} (${size}) to cart`);
}

function removeFromCart(index) {
    cart.splice(index, 1);
    saveCart();
    renderCartSidebar();
}

function updateCartQuantity(index, newQuantity) {
    if (newQuantity <= 0) removeFromCart(index);
    else { cart[index].quantity = newQuantity; saveCart(); renderCartSidebar(); }
}

function renderCartSidebar() {
    if (!cartItemsList) return;
    if (cart.length === 0) {
        cartEmptyDiv.hidden = false;
        cartItemsList.innerHTML = "";
        cartFooter.hidden = true;
        return;
    }
    cartEmptyDiv.hidden = true;
    cartItemsList.innerHTML = "";
    let total = 0;
    cart.forEach((item, idx) => {
        total += item.price * item.quantity;
        const li = document.createElement("li");
        li.className = "cart-item";
        li.innerHTML = `
            <div class="cart-item__img">
                ${item.imageUrl ? `<img src="${item.imageUrl}" alt="${escapeHtml(item.name)}">` : '<span>👕</span>'}
            </div>
            <div class="cart-item__info">
                <div class="cart-item__name">${escapeHtml(item.name)}</div>
                <div class="cart-item__meta">Size: ${item.size}</div>
                <div class="cart-item__controls">
                    <div class="cart-item__qty">
                        <button data-action="decr" data-index="${idx}">−</button>
                        <span>${item.quantity}</span>
                        <button data-action="incr" data-index="${idx}">+</button>
                    </div>
                    <button class="cart-item__remove" data-index="${idx}">Remove</button>
                </div>
            </div>
            <div class="cart-item__price">$${(item.price * item.quantity).toFixed(2)}</div>
        `;
        cartItemsList.appendChild(li);
    });
    cartTotalSpan.textContent = `$${total.toFixed(2)}`;
    cartFooter.hidden = false;

    document.querySelectorAll(".cart-item__qty button[data-action='decr']").forEach(btn => {
        btn.addEventListener("click", () => {
            const idx = parseInt(btn.dataset.index);
            if (cart[idx].quantity > 1) updateCartQuantity(idx, cart[idx].quantity - 1);
            else removeFromCart(idx);
        });
    });
    document.querySelectorAll(".cart-item__qty button[data-action='incr']").forEach(btn => {
        btn.addEventListener("click", () => {
            const idx = parseInt(btn.dataset.index);
            updateCartQuantity(idx, cart[idx].quantity + 1);
        });
    });
    document.querySelectorAll(".cart-item__remove").forEach(btn => {
        btn.addEventListener("click", () => removeFromCart(parseInt(btn.dataset.index)));
    });
}

function checkoutWhatsApp() {
    if (cart.length === 0) { showToast("Your cart is empty"); return; }
    let message = "🛒 *Kit Culture Order*%0A";
    cart.forEach(item => {
        message += `- ${item.name} (${item.size}) x${item.quantity} = $${(item.price * item.quantity).toFixed(2)}%0A`;
    });
    const total = cart.reduce((sum, i) => sum + i.price * i.quantity, 0);
    message += `%0A*Total: $${total.toFixed(2)}*%0A%0A📍 Delivery in Lebanon (COD)`;
    const phone = "96171234567"; // Replace with your WhatsApp number
    window.open(`https://wa.me/${phone}?text=${message}`, "_blank");
}

function escapeHtml(str) {
    if (!str) return '';
    return str.replace(/[&<>]/g, m => m === "&" ? "&amp;" : m === "<" ? "&lt;" : "&gt;");
}

// ======================== Product Fetching (with working CORS proxy) ========================
async function fetchProductsFromSheet() {
    try {
        showToast("Loading products...", 1500);

        const response = await fetch(APPS_SCRIPT_URL);

        if (!response.ok) {
            throw new Error(`HTTP ${response.status}`);
        }

        const data = await response.json();

        if (!Array.isArray(data) || data.length === 0) {
            throw new Error("No product data");
        }

        allProducts = data.map(row => ({
            id: row["Product ID"] || row["id"] || Math.random(),
            sku: row["SKU"] || "",
            name: row["Product Name"] || "Unnamed",
            category: row["Category"] || "Football",
            subcategory: row["Subcategory"] || "",
            team: row["Team/Club"] || "",
            season: row["Season"] || "",
            kitType: row["Kit Type"] || "",
            color: row["Color"] || "",
            sizes: (row["Sizes Available"] || "S,M,L,XL").split(",").map(s => s.trim()),
            price: parseFloat(String(row["Price (USD)"]).replace("$", "")) || 0,
            stockStatus: row["Stock Status"] || "In Stock",
            imageUrl: row["Image URL"] || "",
            description: row["Description"] || ""
        }));

        applyFiltersAndRender();

        showToast(`Loaded ${allProducts.length} products`, 2000);

    } catch (error) {
        console.error("Fetch error:", error);

        productsGrid.innerHTML = `
            <div class="no-results" style="grid-column:1/-1;">
                <p>❌ Failed to load products.</p>
                <button class="btn btn--primary" onclick="location.reload()">Retry</button>
            </div>
        `;
    }
}

// ======================== Filter, Sort, Pagination ========================
function applyFiltersAndRender() {
    if (!allProducts.length) return;
    let filtered = [...allProducts];
    if (currentCategory !== "all") {
        filtered = filtered.filter(p => p.category === currentCategory);
        if (currentSubcategory) filtered = filtered.filter(p => p.subcategory === currentSubcategory);
    }
    if (currentSearchTerm.trim() !== "") {
        const term = currentSearchTerm.toLowerCase();
        filtered = filtered.filter(p => p.name.toLowerCase().includes(term) || (p.team && p.team.toLowerCase().includes(term)) || p.category.toLowerCase().includes(term));
    }
    switch(currentSort) {
        case "price-asc": filtered.sort((a,b) => a.price - b.price); break;
        case "price-desc": filtered.sort((a,b) => b.price - a.price); break;
        case "name-asc": filtered.sort((a,b) => a.name.localeCompare(b.name)); break;
        case "name-desc": filtered.sort((a,b) => b.name.localeCompare(a.name)); break;
        default: break;
    }
    filteredProducts = filtered;
    currentPage = 1;
    renderProductsGrid();
    renderPagination();
    updateNoResults();
    updateTitle();
}

function updateTitle() {
    if (!productsTitle) return;
    if (currentCategory !== "all") {
        let title = currentCategory;
        if (currentSubcategory) title += ` / ${currentSubcategory}`;
        productsTitle.textContent = title;
    } else if (currentSearchTerm) {
        productsTitle.textContent = `Search: "${currentSearchTerm}"`;
    } else {
        productsTitle.textContent = "All Products";
    }
}

function updateNoResults() {
    if (!noResultsDiv) return;
    if (filteredProducts.length === 0) {
        noResultsDiv.hidden = false;
        if (productsGrid) productsGrid.innerHTML = "";
        if (paginationDiv) paginationDiv.innerHTML = "";
    } else {
        noResultsDiv.hidden = true;
    }
}

function renderProductsGrid() {
    if (!productsGrid) return;
    if (filteredProducts.length === 0) { updateNoResults(); return; }
    const start = (currentPage - 1) * PRODUCTS_PER_PAGE;
    const pageProducts = filteredProducts.slice(start, start + PRODUCTS_PER_PAGE);
    productsGrid.innerHTML = "";
    pageProducts.forEach(product => {
        const card = document.createElement("div");
        card.className = "product-card";
        card.dataset.id = product.id;
        let badgeHtml = product.stockStatus === "Low Stock" ? `<div class="product-card__badge">Low Stock</div>` : "";
        card.innerHTML = `
            <div class="product-card__img-wrap">
                ${product.imageUrl ? `<img src="${product.imageUrl}" alt="${escapeHtml(product.name)}" loading="lazy" onerror="this.onerror=null;this.parentElement.innerHTML='<div class=\'product-card__placeholder\'>👕</div>'">` : `<div class="product-card__placeholder">👕</div>`}
                ${badgeHtml}
                <div class="product-card__quick-add" data-id="${product.id}">Quick Add</div>
            </div>
            <div class="product-card__body">
                <div class="product-card__team">${escapeHtml(product.team || product.category)}</div>
                <div class="product-card__name">${escapeHtml(product.name)}</div>
                <div class="product-card__footer">
                    <span class="product-card__price">$${product.price.toFixed(2)}</span>
                    <span class="product-card__sizes">${product.sizes.join(", ")}</span>
                </div>
            </div>
        `;
        productsGrid.appendChild(card);
    });
    // Attach quick add & card click listeners
    document.querySelectorAll(".product-card__quick-add").forEach(btn => {
        btn.addEventListener("click", (e) => {
            e.stopPropagation();
            const product = allProducts.find(p => p.id == btn.dataset.id);
            if (product) openProductModal(product);
        });
    });
    document.querySelectorAll(".product-card").forEach(card => {
        card.addEventListener("click", (e) => {
            if (e.target.classList.contains("product-card__quick-add")) return;
            const product = allProducts.find(p => p.id == card.dataset.id);
            if (product) openProductModal(product);
        });
    });
}

function renderPagination() {
    if (!paginationDiv) return;
    const totalPages = Math.ceil(filteredProducts.length / PRODUCTS_PER_PAGE);
    if (totalPages <= 1) { paginationDiv.innerHTML = ""; return; }
    let html = `<button class="pagination__btn" data-page="prev" ${currentPage === 1 ? "disabled" : ""}>‹</button>`;
    for (let i = 1; i <= totalPages; i++) {
        if (i === 1 || i === totalPages || (i >= currentPage-1 && i <= currentPage+1)) {
            html += `<button class="pagination__btn ${i === currentPage ? "active" : ""}" data-page="${i}">${i}</button>`;
        } else if (i === currentPage-2 || i === currentPage+2) {
            html += `<span class="pagination__dots">...</span>`;
        }
    }
    html += `<button class="pagination__btn" data-page="next" ${currentPage === totalPages ? "disabled" : ""}>›</button>`;
    paginationDiv.innerHTML = html;
    document.querySelectorAll(".pagination__btn").forEach(btn => {
        btn.addEventListener("click", () => {
            const page = btn.dataset.page;
            if (page === "prev" && currentPage > 1) currentPage--;
            else if (page === "next" && currentPage < totalPages) currentPage++;
            else if (!isNaN(parseInt(page))) currentPage = parseInt(page);
            renderProductsGrid();
            renderPagination();
            window.scrollTo({ top: productsGrid.offsetTop - 100, behavior: "smooth" });
        });
    });
}

// ======================== Product Modal ========================
function openProductModal(product) {
    let selectedSize = product.sizes[0] || "M";
    let quantity = 1;
    function renderModal() {
        modalInner.innerHTML = `
            <div class="modal-img">
                ${product.imageUrl ? `<img src="${product.imageUrl}" alt="${escapeHtml(product.name)}">` : `<span>👕</span>`}
            </div>
            <div class="modal-info">
                <div class="modal-brand">${escapeHtml(product.team || product.category)}</div>
                <div class="modal-name">${escapeHtml(product.name)}</div>
                <div class="modal-price">$${product.price.toFixed(2)}</div>
                <div class="modal-meta">
                    <div class="modal-meta-row"><strong>Season:</strong> ${product.season || "Current"}</div>
                    <div class="modal-meta-row"><strong>Kit Type:</strong> ${product.kitType || "Standard"}</div>
                    <div class="modal-meta-row"><strong>Stock:</strong> ${product.stockStatus}</div>
                </div>
                <div class="size-label">Size</div>
                <div class="size-buttons" id="modal-size-buttons">
                    ${product.sizes.map(s => `<button class="size-btn ${s === selectedSize ? 'selected' : ''}" data-size="${s}">${s}</button>`).join('')}
                </div>
                <div class="qty-wrap">
                    <div class="qty-control">
                        <button id="modal-qty-minus">−</button>
                        <span id="modal-qty">${quantity}</span>
                        <button id="modal-qty-plus">+</button>
                    </div>
                </div>
                <div class="modal-actions">
                    <button class="btn btn--primary" id="modal-add-to-cart">Add to Cart</button>
                    <button class="btn btn--primary btn--buy-now" id="modal-buy-now">Buy Now (WhatsApp)</button>
                </div>
                <div class="modal-desc">${escapeHtml(product.description)}</div>
            </div>
        `;
        // Attach size listeners
        document.querySelectorAll("#modal-size-buttons .size-btn").forEach(btn => {
            btn.addEventListener("click", () => {
                selectedSize = btn.dataset.size;
                document.querySelectorAll("#modal-size-buttons .size-btn").forEach(b => b.classList.remove("selected"));
                btn.classList.add("selected");
            });
        });
        const qtySpan = document.getElementById("modal-qty");
        document.getElementById("modal-qty-minus").addEventListener("click", () => {
            if (quantity > 1) { quantity--; qtySpan.textContent = quantity; }
        });
        document.getElementById("modal-qty-plus").addEventListener("click", () => {
            quantity++; qtySpan.textContent = quantity;
        });
        document.getElementById("modal-add-to-cart").addEventListener("click", () => {
            addToCart(product, selectedSize, quantity);
            productModal.hidden = true;
        });
        document.getElementById("modal-buy-now").addEventListener("click", () => {
            const msg = `🛒 *Kit Culture Order*%0A- ${product.name} (${selectedSize}) x${quantity} = $${(product.price * quantity).toFixed(2)}%0A%0A*Total: $${(product.price * quantity).toFixed(2)}*%0A📍 Delivery in Lebanon (COD)`;
            window.open(`https://wa.me/96171234567?text=${msg}`, "_blank");
            productModal.hidden = true;
        });
    }
    renderModal();
    productModal.hidden = false;
}

function closeProductModal() {
    if (productModal) productModal.hidden = true;
}

// ======================== Event Listeners (ensuring all close buttons work) ========================
function initEventListeners() {
    // Search
    if (searchToggle) {
        searchToggle.addEventListener("click", () => {
            if (searchBar) searchBar.classList.toggle("open");
            if (searchBar && searchBar.classList.contains("open") && searchInput) searchInput.focus();
        });
    }
    if (searchClose) {
        searchClose.addEventListener("click", () => {
            if (searchBar) searchBar.classList.remove("open");
        });
    }
    if (searchInput) {
        searchInput.addEventListener("input", (e) => {
            currentSearchTerm = e.target.value;
            applyFiltersAndRender();
        });
    }
    // Sorting
    if (sortSelect) {
        sortSelect.addEventListener("change", (e) => {
            currentSort = e.target.value;
            applyFiltersAndRender();
        });
    }
    // Category links (desktop + mobile + footer)
    document.querySelectorAll("[data-category]").forEach(link => {
        link.addEventListener("click", (e) => {
            e.preventDefault();
            currentCategory = link.dataset.category;
            currentSubcategory = link.dataset.sub || null;
            currentSearchTerm = "";
            if (searchInput) searchInput.value = "";
            currentSort = "default";
            if (sortSelect) sortSelect.value = "default";
            applyFiltersAndRender();
            // Close mobile menu
            const mobileNav = document.getElementById("mobile-nav");
            const mobileOverlay = document.getElementById("mobile-overlay");
            const hamburger = document.getElementById("hamburger");
            if (mobileNav) mobileNav.classList.remove("open");
            if (mobileOverlay) mobileOverlay.classList.remove("open");
            if (hamburger) hamburger.classList.remove("open");
            document.getElementById("products-section")?.scrollIntoView({ behavior: "smooth" });
        });
    });
    // Hero buttons
    document.querySelectorAll(".hero__actions .btn").forEach(btn => {
        btn.addEventListener("click", (e) => {
            e.preventDefault();
            if (btn.dataset.category) {
                currentCategory = btn.dataset.category;
                currentSubcategory = btn.dataset.sub || null;
                applyFiltersAndRender();
                document.getElementById("products-section")?.scrollIntoView({ behavior: "smooth" });
            }
        });
    });
    // Reset filter
    window.resetFilter = () => {
        currentCategory = "all";
        currentSubcategory = null;
        currentSearchTerm = "";
        if (searchInput) searchInput.value = "";
        currentSort = "default";
        if (sortSelect) sortSelect.value = "default";
        applyFiltersAndRender();
    };
    // Cart toggle
    if (cartToggle) {
        cartToggle.addEventListener("click", () => {
            if (cartSidebar) cartSidebar.classList.add("open");
            if (cartOverlay) cartOverlay.classList.add("open");
        });
    }
    // Cart close (the X)
    if (cartClose) {
        cartClose.addEventListener("click", () => {
            if (cartSidebar) cartSidebar.classList.remove("open");
            if (cartOverlay) cartOverlay.classList.remove("open");
        });
    }
    if (cartOverlay) {
        cartOverlay.addEventListener("click", () => {
            if (cartSidebar) cartSidebar.classList.remove("open");
            if (cartOverlay) cartOverlay.classList.remove("open");
        });
    }
    const cartContinue = document.getElementById("cart-continue");
    if (cartContinue) {
        cartContinue.addEventListener("click", () => {
            if (cartSidebar) cartSidebar.classList.remove("open");
            if (cartOverlay) cartOverlay.classList.remove("open");
        });
    }
    if (checkoutBtn) checkoutBtn.addEventListener("click", checkoutWhatsApp);
    // Mobile menu
    const hamburger = document.getElementById("hamburger");
    const mobileNav = document.getElementById("mobile-nav");
    const mobileOverlay = document.getElementById("mobile-overlay");
    const mobileClose = document.getElementById("mobile-close");
    function closeMobileMenu() {
        if (mobileNav) mobileNav.classList.remove("open");
        if (mobileOverlay) mobileOverlay.classList.remove("open");
        if (hamburger) hamburger.classList.remove("open");
    }
    if (hamburger) {
        hamburger.addEventListener("click", () => {
            if (mobileNav) mobileNav.classList.toggle("open");
            if (mobileOverlay) mobileOverlay.classList.toggle("open");
            hamburger.classList.toggle("open");
        });
    }
    if (mobileOverlay) mobileOverlay.addEventListener("click", closeMobileMenu);
    if (mobileClose) mobileClose.addEventListener("click", closeMobileMenu);
    // Mobile accordion
    document.querySelectorAll(".mobile-accordion__btn").forEach(btn => {
        btn.addEventListener("click", () => {
            const parent = btn.closest(".mobile-accordion");
            if (parent) parent.classList.toggle("open");
        });
    });
    // Modal close (the X)
    if (modalClose) modalClose.addEventListener("click", closeProductModal);
    if (modalBackdrop) modalBackdrop.addEventListener("click", closeProductModal);
    // Escape key
    document.addEventListener("keydown", (e) => {
        if (e.key === "Escape") {
            if (productModal && !productModal.hidden) closeProductModal();
            if (cartSidebar && cartSidebar.classList.contains("open")) {
                cartSidebar.classList.remove("open");
                if (cartOverlay) cartOverlay.classList.remove("open");
            }
        }
    });
    // Newsletter
    const newsletterForm = document.getElementById("newsletter-form");
    const newsletterSuccess = document.getElementById("newsletter-success");
    if (newsletterForm) {
        newsletterForm.addEventListener("submit", (e) => {
            e.preventDefault();
            const email = newsletterForm.querySelector("input[type='email']")?.value;
            if (email && newsletterSuccess) {
                newsletterSuccess.hidden = false;
                newsletterForm.reset();
                setTimeout(() => { if (newsletterSuccess) newsletterSuccess.hidden = true; }, 4000);
                showToast("Subscribed! (demo)", 2000);
            }
        });
    }
    // Logo reset
    const logoHome = document.getElementById("logo-home");
    if (logoHome) {
        logoHome.addEventListener("click", (e) => {
            e.preventDefault();
            window.resetFilter();
            window.scrollTo({ top: 0, behavior: "smooth" });
        });
    }
}

// ======================== Initialization ========================
async function init() {
    loadCart();
    initEventListeners();
    await fetchProductsFromSheet();
    if (typeof feather !== "undefined") feather.replace();
}

// Start everything when DOM is ready
if (document.readyState === "loading") {
    document.addEventListener("DOMContentLoaded", init);
} else {
    init();
}