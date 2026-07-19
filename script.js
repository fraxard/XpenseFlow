/* ═══════════════════════════════════════════════════
   NAMESPACE SHIM
   Intercepts the four data keys so that logged-in users
   get their own isolated localStorage namespace.
   Must run before any other code in script.js.
═══════════════════════════════════════════════════ */
(function () {
    const DATA_KEYS = ['transactions', 'recurringTemplates', 'budgets', 'customCategories'];

    const _origGet    = localStorage.getItem.bind(localStorage);
    const _origSet    = localStorage.setItem.bind(localStorage);
    const _origRemove = localStorage.removeItem.bind(localStorage);

    function _resolve(key) {
        if (!DATA_KEYS.includes(key)) return key;
        const user = JSON.parse(_origGet('xf_user') || 'null');
        return user ? `${key}_${user.id}` : key;
    }

    localStorage.getItem = function (key) {
        return _origGet(_resolve(key));
    };
    localStorage.setItem = function (key, value) {
        return _origSet(_resolve(key), value);
    };
    localStorage.removeItem = function (key) {
        return _origRemove(_resolve(key));
    };
})();

const balance = document.getElementById('balance');
const money_plus = document.getElementById('money-plus');
const money_minus = document.getElementById('money-minus');
const list = document.getElementById('list');
const emptyState = document.getElementById('empty-state');
const form = document.getElementById('form');
const text = document.getElementById('text');
const amount = document.getElementById('amount');
const category = document.getElementById('category');
const dateInput = document.getElementById('date');
const typeExpense = document.getElementById('type-expense');
const typeIncome = document.getElementById('type-income');
const submitBtn = document.getElementById('submit-btn');
const cancelBtn = document.getElementById('cancel-btn');
const currencySelect = document.getElementById('currency');
const themeToggle = document.getElementById('theme-toggle');
const textError = document.getElementById('text-error');
const amountError = document.getElementById('amount-error');
const dateError = document.getElementById('date-error');
const welcomeModal = document.getElementById('welcome-modal');
const getStartedBtn = document.getElementById('get-started-btn');
const guideTip = document.getElementById('guide-tip');
const addCategoryToggle = document.getElementById('add-category-toggle');
const addCategoryPanel = document.getElementById('add-category-panel');
const newCategoryInput = document.getElementById('new-category-input');
const newCategoryError = document.getElementById('new-category-error');
const saveCategoryBtn = document.getElementById('save-category-btn');
const categoryChips = document.getElementById('category-chips');
const receiptInput = document.getElementById('receipt');
const receiptDropzone = document.getElementById('receipt-dropzone');
const receiptPreview = document.getElementById('receipt-preview');
const receiptError = document.getElementById('receipt-error');
const receiptLightbox = document.getElementById('receipt-lightbox');
const lightboxImg = document.getElementById('lightbox-img');
const lightboxClose = document.getElementById('lightbox-close');
const ITEMS_PER_PAGE = 7;
let currentPage = 1;
const paginationEl = document.getElementById('pagination');
const searchToggle = document.getElementById('search-toggle');
const searchBar = document.getElementById('search-bar');
const searchInput = document.getElementById('search-input');
const filterBtn = document.getElementById('filter-btn');
const filterDropdown = document.getElementById('filter-dropdown');
const noResults = document.getElementById('no-results');
// FIX 3: grab the new close button
const searchClose = document.getElementById('search-close');

let searchQuery = '';
let filterBy = 'name';

// The currently attached receipt image, as a base64 data URL, or null if none.
let receiptImage = null;

// Category choices depend on whether the transaction is an expense or income
const categoryOptions = {
    expense: ['Food', 'Rent', 'Utilities', 'Transport', 'Entertainment', 'Health', 'Shopping', 'Other'],
    income: ['Salary', 'Freelance', 'Gift', 'Investment', 'Other']
};

let customCategories = JSON.parse(localStorage.getItem('customCategories')) || { expense: [], income: [] };

function saveCustomCategories() {
    localStorage.setItem('customCategories', JSON.stringify(customCategories));
}

const ICON_PATHS = {
    Food: '<path d="M7 3v7a2 2 0 0 0 4 0V3"/><path d="M9 10v11"/><path d="M17 3c-1.6 0-3 1.6-3 4v3h3"/><path d="M17 10v11"/>',
    Rent: '<path d="M3 11l9-8 9 8"/><path d="M5 10v10h14V10"/><path d="M9 20v-6h6v6"/>',
    Utilities: '<path d="M13 2 3 14h7l-1 8 10-12h-7l1-8z"/>',
    Transport: '<path d="M3 13l2-6a2 2 0 0 1 2-1h10a2 2 0 0 1 2 1l2 6"/><rect x="2" y="13" width="20" height="6" rx="2"/><circle cx="7" cy="19" r="1.4"/><circle cx="17" cy="19" r="1.4"/>',
    Entertainment: '<circle cx="12" cy="12" r="9"/><path d="M10 8l6 4-6 4V8z"/>',
    Health: '<path d="M12 21s-7-4.35-9.5-8.5C0.7 8.8 2 5 5.5 5c2 0 3.5 1.5 4.5 3 1-1.5 2.5-3 4.5-3 3.5 0 4.8 3.8 3 7.5C19 16.65 12 21 12 21z"/>',
    Shopping: '<path d="M6 8h12l1 12H5L6 8z"/><path d="M9 8V6a3 3 0 0 1 6 0v2"/>',
    Salary: '<rect x="3" y="7" width="18" height="12" rx="2"/><path d="M8 7V5a2 2 0 0 1 2-2h4a2 2 0 0 1 2 1v2"/><path d="M3 12h18"/>',
    Freelance: '<rect x="4" y="5" width="16" height="10" rx="1"/><path d="M2 19h20"/>',
    Gift: '<rect x="4" y="9" width="16" height="11" rx="1"/><path d="M4 9h16v4H4z"/><path d="M12 9v11"/>',
    Investment: '<path d="M3 17l6-6 4 4 8-8"/><path d="M15 7h6v6"/>',
    Other: '<circle cx="12" cy="12" r="9"/><circle cx="12" cy="12" r="2" fill="currentColor" stroke="none"/>',
    edit: '<path d="M12 20h9"/><path d="M16.5 3.5a2.1 2.1 0 0 1 3 3L7 19l-4 1 1-4 12.5-12.5z"/>',
    delete: '<path d="M3 6h18"/><path d="M8 6V4a2 2 0 0 1 2-2h4a2 2 0 0 1 2 2v2"/><path d="M19 6l-1 14a2 2 0 0 1-2 2H8a2 2 0 0 1-2-2L5 6"/><path d="M10 11v6"/><path d="M14 11v6"/>',
    receipt: '<path d="M6 2h9l3 3v17l-3-2-3 2-3-2-3 2V2z"/><path d="M9 8h6"/><path d="M9 12h6"/>'
};

function icon(name) {
    const inner = ICON_PATHS[name] || ICON_PATHS.Other;
    return `<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round">${inner}</svg>`;
}

function detectDefaultCurrency() {
    const localeToCurrency = {
        'en-US': 'USD', 'en-GB': 'GBP', 'en-IN': 'INR', 'en-AU': 'AUD',
        'en-CA': 'CAD', 'de': 'EUR', 'fr': 'EUR', 'it': 'EUR', 'es': 'EUR',
        'pt-BR': 'BRL', 'ja': 'JPY', 'zh': 'CNY', 'ko': 'KRW', 'ru': 'RUB',
        'ar': 'AED', 'hi': 'INR', 'bn': 'BDT', 'tr': 'TRY', 'nl': 'EUR',
        'pl': 'PLN', 'sv': 'SEK', 'da': 'DKK', 'nb': 'NOK', 'fi': 'EUR',
    };
    const supported = ['USD','EUR','GBP','INR','JPY','AUD','CAD'];
    const locale = navigator.language || 'en-US';
    const exact = localeToCurrency[locale];
    if (exact && supported.includes(exact)) return exact;
    const lang = locale.split('-')[0];
    const fromLang = localeToCurrency[lang];
    if (fromLang && supported.includes(fromLang)) return fromLang;
    return 'USD';
}

let currentCurrency = localStorage.getItem('currency') || detectDefaultCurrency();
currencySelect.value = currentCurrency;

function formatCurrency(value) {
    return new Intl.NumberFormat('en-US', {
        style: 'currency',
        currency: currentCurrency
    }).format(value);
}

const dummyTransactions = [
    { id: 1, text: 'Groceries', amount: -20, category: 'Food', date: '2026-07-01' },
    { id: 2, text: 'Wages', amount: 300, category: 'Salary', date: '2026-07-01' },
    { id: 3, text: 'Gym membership', amount: -10, category: 'Health', date: '2026-07-03' },
    { id: 4, text: 'Camera', amount: 150, category: 'Other', date: '2026-07-05' }
];

const localStorageTransactions = JSON.parse(localStorage.getItem('transactions'));
let transactions = localStorage.getItem('transactions') !== null ? localStorageTransactions : dummyTransactions;

let editingId = null;

function populateCategories(type, selected) {
    category.innerHTML = '';
    const allCategories = [...categoryOptions[type], ...customCategories[type]];
    if (selected && !allCategories.includes(selected)) {
        allCategories.push(selected);
    }
    allCategories.forEach(cat => {
        const opt = document.createElement('option');
        opt.value = cat;
        opt.textContent = cat;
        if (cat === selected) opt.selected = true;
        category.appendChild(opt);
    });
    renderCategoryChips(type);
}

function renderCategoryChips(type) {
    if (!categoryChips) return;
    categoryChips.innerHTML = '';
    if (customCategories[type].length === 0) {
        categoryChips.innerHTML = '<span class="chips-empty">No custom categories yet.</span>';
        return;
    }
    customCategories[type].forEach(cat => {
        const chip = document.createElement('span');
        chip.className = 'category-chip';
        chip.innerHTML = `${cat} <button type="button" class="chip-remove" data-category="${cat}" title="Remove ${cat}">&times;</button>`;
        categoryChips.appendChild(chip);
    });
}

function currentType() {
    return typeIncome.checked ? 'income' : 'expense';
}

function openAddCategoryPanel() {
    addCategoryPanel.classList.add('is-visible');
    addCategoryToggle.classList.add('is-active');
    addCategoryToggle.setAttribute('aria-expanded', 'true');
    newCategoryInput.focus();
}

function closeAddCategoryPanel() {
    addCategoryPanel.classList.remove('is-visible');
    addCategoryToggle.classList.remove('is-active');
    addCategoryToggle.setAttribute('aria-expanded', 'false');
    newCategoryInput.value = '';
    clearError(newCategoryInput, newCategoryError);
}

function toggleAddCategoryPanel() {
    if (addCategoryPanel.classList.contains('is-visible')) {
        closeAddCategoryPanel();
    } else {
        openAddCategoryPanel();
    }
}

function addCustomCategory() {
    const type = currentType();
    const name = newCategoryInput.value.trim();
    if (!name) {
        setError(newCategoryInput, newCategoryError, 'Enter a category name');
        return;
    }
    const alreadyExists = [...categoryOptions[type], ...customCategories[type]]
        .some(cat => cat.toLowerCase() === name.toLowerCase());
    if (alreadyExists) {
        setError(newCategoryInput, newCategoryError, 'That category already exists');
        return;
    }
    customCategories[type].push(name);
    saveCustomCategories();
    populateCategories(type, name);
    closeAddCategoryPanel();
}

function removeCustomCategory(type, name) {
    customCategories[type] = customCategories[type].filter(cat => cat !== name);
    saveCustomCategories();
    populateCategories(type, category.value === name ? undefined : category.value);
}

function todayString() {
    const d = new Date();
    const month = String(d.getMonth() + 1).padStart(2, '0');
    const day = String(d.getDate()).padStart(2, '0');
    return `${d.getFullYear()}-${month}-${day}`;
}

function formatDate(dateStr) {
    if (!dateStr) return 'No date';
    const [year, month, day] = dateStr.split('-').map(Number);
    const d = new Date(year, month - 1, day);
    return d.toLocaleDateString(undefined, { year: 'numeric', month: 'short', day: 'numeric' });
}

function setError(input, errorEl, message) {
    input.classList.add('invalid');
    errorEl.textContent = message;
}

function clearError(input, errorEl) {
    input.classList.remove('invalid');
    errorEl.textContent = '';
}

function clearAllErrors() {
    clearError(text, textError);
    clearError(amount, amountError);
    clearError(dateInput, dateError);
    clearError(receiptInput, receiptError);
}

const MAX_RECEIPT_BYTES = 3 * 1024 * 1024;

function renderReceiptPreview() {
    if (!receiptImage) {
        receiptPreview.classList.remove('is-visible');
        receiptPreview.innerHTML = '';
        receiptDropzone.classList.remove('is-hidden');
        return;
    }
    receiptDropzone.classList.add('is-hidden');
    receiptPreview.classList.add('is-visible');
    receiptPreview.innerHTML = `
    <div class="receipt-preview-item">
      <img src="${receiptImage}" class="receipt-thumb" id="receipt-thumb-preview" title="Click to enlarge">
      <button type="button" class="receipt-remove" id="receipt-remove-btn" title="Remove image">&times;</button>
    </div>
    `;
}

function clearReceipt() {
    receiptImage = null;
    receiptInput.value = '';
    clearError(receiptInput, receiptError);
    renderReceiptPreview();
}

function validateForm() {
    let isValid = true;
    if (text.value.trim() === '') {
        setError(text, textError, 'Please enter a transaction name');
        isValid = false;
    } else {
        clearError(text, textError);
    }
    const amountValue = +amount.value;
    if (amount.value.trim() === '' || isNaN(amountValue) || amountValue <= 0) {
        setError(amount, amountError, 'Enter an amount greater than 0');
        isValid = false;
    } else {
        clearError(amount, amountError);
    }
    if (dateInput.value.trim() === '') {
        setError(dateInput, dateError, 'Please choose a date');
        isValid = false;
    } else {
        clearError(dateInput, dateError);
    }
    return isValid;
}

function addTrans(e) {
    e.preventDefault();
    if (!validateForm()) return;

    const rawAmount = Math.abs(+amount.value);
    const isIncome = typeIncome.checked;
    const signedAmount = isIncome ? rawAmount : -rawAmount;
    const chosenDate = dateInput.value || todayString();
    const chosenCategory = category.value;

    if (editingId !== null) {
        transactions = transactions.map(transaction =>
            transaction.id === editingId
                ? { ...transaction, text: text.value, amount: signedAmount, category: chosenCategory, date: chosenDate, receipt: receiptImage }
                : transaction
        );
    } else {
        transactions.push({
            id: generateID(),
            text: text.value,
            amount: signedAmount,
            category: chosenCategory,
            date: chosenDate,
            receipt: receiptImage
        });
    }

    updateLocalStorage();
    resetForm();
    init();
}

function generateID() {
    return Math.floor(Math.random() * 1000000);
}

function addTransDOM(transaction) {
    const sign = transaction.amount < 0 ? '-' : '+';
    const item = document.createElement('li');
    item.classList.add(transaction.amount < 0 ? 'minus' : 'plus');

    const categoryLabel = transaction.category || 'Uncategorized';
    const dateLabel = formatDate(transaction.date);
    const hasReceipt = Boolean(transaction.receipt);

    item.innerHTML = `
    <div class="trans-left">
      <span class="category-avatar${hasReceipt ? ' has-receipt' : ''}" ${hasReceipt ? `onclick="viewReceipt(${transaction.id})" title="View receipt"` : ''}>
        ${icon(transaction.category)}
        ${hasReceipt ? `<span class="receipt-badge">${icon('receipt')}</span>` : ''}
      </span>
      <div class="trans-info">
        <span class="trans-text">${transaction.text}</span>
        <span class="trans-meta">${categoryLabel} &bull; ${dateLabel}</span>
      </div>
    </div>
    <span class="trans-amount">${sign}${formatCurrency(Math.abs(transaction.amount))}</span>
    <div class="trans-actions">
      <button class="icon-btn edit-btn" title="Edit" onclick="editTransaction(${transaction.id})">${icon('edit')}</button>
      <button class="icon-btn delete-btn" title="Delete" onclick="removeTransaction(${transaction.id})">${icon('delete')}</button>
    </div>
    `;

    list.appendChild(item);
}

function viewReceipt(id) {
    const transaction = transactions.find(t => t.id === id);
    if (!transaction || !transaction.receipt) return;
    openLightbox(transaction.receipt);
}

function updateValues() {
    const amounts = transactions.map(transaction => transaction.amount);
    const total = amounts.reduce((acc, item) => (acc += item), 0);
    const income = amounts.filter(item => item > 0).reduce((acc, item) => (acc += item), 0);
    const expense = amounts.filter(item => item < 0).reduce((acc, item) => (acc += item), 0) * -1;

    balance.innerText = formatCurrency(total);
    money_plus.innerText = formatCurrency(income);
    money_minus.innerText = formatCurrency(expense);
}

function editTransaction(id) {
    const transaction = transactions.find(t => t.id === id);
    if (!transaction) return;

    const isIncome = transaction.amount > 0;
    text.value = transaction.text;
    amount.value = Math.abs(transaction.amount);
    dateInput.value = transaction.date || todayString();
    typeIncome.checked = isIncome;
    typeExpense.checked = !isIncome;
    populateCategories(isIncome ? 'income' : 'expense', transaction.category);

    receiptImage = transaction.receipt || null;
    renderReceiptPreview();

    editingId = id;
    submitBtn.textContent = 'Update transaction';
    cancelBtn.classList.add('is-visible');
    form.scrollIntoView({ behavior: 'smooth', block: 'center' });
}

function resetForm() {
    editingId = null;
    text.value = '';
    amount.value = '';
    dateInput.value = todayString();
    typeExpense.checked = true;
    populateCategories('expense');
    clearReceipt();
    submitBtn.textContent = 'Add transaction';
    cancelBtn.classList.remove('is-visible');
    clearAllErrors();
    closeAddCategoryPanel();
}

function removeTransaction(id) {
    transactions = transactions.filter(transaction => transaction.id !== id);
    updateLocalStorage();
    if (editingId === id) resetForm();
    init();
}

function updateLocalStorage() {
    localStorage.setItem('transactions', JSON.stringify(transactions));
}

function applyTheme(theme) {
    document.body.classList.toggle('light-theme', theme === 'light');
    document.body.classList.toggle('dark-theme', theme === 'dark');
    localStorage.setItem('theme', theme);
    if (themeToggle) {
        themeToggle.setAttribute('aria-pressed', String(theme === 'light'));
        themeToggle.title = theme === 'light' ? 'Switch to dark mode' : 'Switch to light mode';
    }
}

function initTheme() {
    const savedTheme = localStorage.getItem('theme');
    applyTheme(savedTheme || 'dark');
}

function renderPagination(total) {
    if (!paginationEl) return;
    const totalPages = Math.ceil(total / ITEMS_PER_PAGE);
    paginationEl.innerHTML = '';
    if (totalPages <= 1) return;

    const prev = document.createElement('button');
    prev.className = 'page-btn';
    prev.textContent = '←';
    prev.disabled = currentPage === 1;
    prev.addEventListener('click', () => { currentPage--; init(); });
    paginationEl.appendChild(prev);

    for (let i = 1; i <= totalPages; i++) {
        const btn = document.createElement('button');
        btn.className = 'page-btn' + (i === currentPage ? ' active' : '');
        btn.textContent = i;
        btn.addEventListener('click', () => { currentPage = i; init(); });
        paginationEl.appendChild(btn);
    }

    const next = document.createElement('button');
    next.className = 'page-btn';
    next.textContent = '→';
    next.disabled = currentPage === totalPages;
    next.addEventListener('click', () => { currentPage++; init(); });
    paginationEl.appendChild(next);
}

function getFilteredTransactions() {
    const q = searchQuery.trim().toLowerCase();
    if (!q) return transactions;

    return transactions.filter(t => {
        switch (filterBy) {
            case 'name':     return t.text.toLowerCase().includes(q);
            case 'category': return (t.category || '').toLowerCase().includes(q);
            case 'date':     return (t.date || '').includes(q) || formatDate(t.date).toLowerCase().includes(q);
            case 'type':     return (t.amount > 0 ? 'income' : 'expense').includes(q);
            case 'amount':   return String(Math.abs(t.amount)).includes(q);
            default:         return true;
        }
    });
}

function init() {
    list.innerHTML = '';
    const filtered = [...getFilteredTransactions()].reverse();
    const totalPages = Math.max(1, Math.ceil(filtered.length / ITEMS_PER_PAGE));
    if (currentPage > totalPages) currentPage = totalPages;

    const start = (currentPage - 1) * ITEMS_PER_PAGE;
    const pageItems = filtered.slice(start, start + ITEMS_PER_PAGE);
    pageItems.forEach(addTransDOM);

    updateValues();
    renderPagination(filtered.length);

    const hasTransactions = transactions.length > 0;
    const hasResults = filtered.length > 0;
    emptyState.classList.toggle('is-visible', !hasTransactions);
    if (noResults) noResults.classList.toggle('is-visible', hasTransactions && !hasResults);
}

// ---- Helper: close the search bar ----
function closeSearchBar() {
    searchBar.classList.remove('is-open');
    searchToggle.classList.remove('is-active');
    searchInput.value = '';
    searchQuery = '';
    filterDropdown.classList.remove('is-open');
    filterBtn.classList.remove('is-active');
    currentPage = 1;
    init();
}

populateCategories('expense');
dateInput.value = todayString();
initTheme();
currentPage = 1;
init();

form.addEventListener('submit', addTrans);
cancelBtn.addEventListener('click', resetForm);
typeExpense.addEventListener('change', () => populateCategories('expense'));
typeIncome.addEventListener('change', () => populateCategories('income'));
text.addEventListener('input', () => clearError(text, textError));
amount.addEventListener('input', () => clearError(amount, amountError));
dateInput.addEventListener('input', () => clearError(dateInput, dateError));
currencySelect.addEventListener('change', () => {
    currentCurrency = currencySelect.value;
    localStorage.setItem('currency', currentCurrency);
    init();
});

themeToggle?.addEventListener('click', () => {
    const nextTheme = document.body.classList.contains('light-theme') ? 'dark' : 'light';
    applyTheme(nextTheme);
});

addCategoryToggle.addEventListener('click', toggleAddCategoryPanel);
saveCategoryBtn.addEventListener('click', addCustomCategory);
newCategoryInput.addEventListener('input', () => clearError(newCategoryInput, newCategoryError));
newCategoryInput.addEventListener('keydown', (e) => {
    if (e.key === 'Enter') { e.preventDefault(); addCustomCategory(); }
    else if (e.key === 'Escape') closeAddCategoryPanel();
});

categoryChips.addEventListener('click', (e) => {
    const removeBtn = e.target.closest('.chip-remove');
    if (!removeBtn) return;
    removeCustomCategory(currentType(), removeBtn.dataset.category);
});

/* ===== Onboarding ===== */
const ONBOARDING_DEV_MODE = false;

document.addEventListener("DOMContentLoaded", () => {
    const guideSteps = [
        "👋 Start by adding your first transaction above.",
        "✏️ Nice! Hover a transaction and use the icons to edit or delete it.",
        "🎉 You're all set — explore your dashboard anytime!"
    ];
    let guideStep = -1;
    let guideHideTimer = null;
    let transactionCountAtStepStart = 0;

    function showGuideStep(step) {
        if (!guideTip) return;
        guideStep = step;
        guideTip.textContent = guideSteps[step];
        guideTip.style.display = "block";
        clearTimeout(guideHideTimer);
        if (step === guideSteps.length - 1) {
            guideHideTimer = setTimeout(completeOnboarding, 4000);
        }
    }

    function completeOnboarding() {
        if (guideTip) guideTip.style.display = "none";
    }

    function closeModalAndStartGuide() {
        welcomeModal.classList.remove("is-visible");
        if (!ONBOARDING_DEV_MODE) localStorage.setItem("xpenseflow-onboarding", "true");
        transactionCountAtStepStart = transactions.length;
        showGuideStep(0);
        text.focus();
    }

    const hasSeenOnboarding = localStorage.getItem("xpenseflow-onboarding");
    if (ONBOARDING_DEV_MODE || !hasSeenOnboarding) welcomeModal.classList.add("is-visible");

    getStartedBtn.addEventListener("click", closeModalAndStartGuide);
    document.querySelector(".feature-income").addEventListener("click", () => {
        typeIncome.checked = true;
        populateCategories("income");
        closeModalAndStartGuide();
    });
    document.querySelector(".feature-expense").addEventListener("click", () => {
        typeExpense.checked = true;
        populateCategories("expense");
        closeModalAndStartGuide();
    });
    document.querySelector(".feature-category").addEventListener("click", closeModalAndStartGuide);
    document.querySelector(".feature-report").addEventListener("click", closeModalAndStartGuide);

    document.addEventListener("keydown", (e) => {
        if (e.key === "Escape" && welcomeModal.classList.contains("is-visible")) closeModalAndStartGuide();
    });

    form.addEventListener("submit", () => {
        if (guideStep === 0 && transactions.length > transactionCountAtStepStart) showGuideStep(1);
    });

    list.addEventListener("click", (e) => {
        if (guideStep === 1 && e.target.closest(".edit-btn, .delete-btn")) showGuideStep(2);
    });
});

/* ===== Receipt upload ===== */
receiptInput.addEventListener('change', (e) => {
    const file = e.target.files[0];
    if (!file) return;
    if (!file.type.startsWith('image/')) {
        setError(receiptInput, receiptError, 'Please choose an image file');
        receiptInput.value = '';
        return;
    }
    if (file.size > MAX_RECEIPT_BYTES) {
        setError(receiptInput, receiptError, 'Image is too large (max 3MB)');
        receiptInput.value = '';
        return;
    }
    clearError(receiptInput, receiptError);
    const reader = new FileReader();
    reader.onload = () => { receiptImage = reader.result; renderReceiptPreview(); };
    reader.onerror = () => setError(receiptInput, receiptError, 'Could not read that image, please try again');
    reader.readAsDataURL(file);
});

receiptPreview.addEventListener('click', (e) => {
    if (e.target.closest('#receipt-remove-btn')) { clearReceipt(); return; }
    if (e.target.closest('#receipt-thumb-preview') && receiptImage) openLightbox(receiptImage);
});

function openLightbox(src) {
    lightboxImg.src = src;
    receiptLightbox.classList.add('is-visible');
}

function closeLightbox() {
    receiptLightbox.classList.remove('is-visible');
    lightboxImg.src = '';
}

lightboxClose.addEventListener('click', closeLightbox);
receiptLightbox.addEventListener('click', (e) => { if (e.target === receiptLightbox) closeLightbox(); });
document.addEventListener('keydown', (e) => {
    if (e.key === 'Escape' && receiptLightbox.classList.contains('is-visible')) closeLightbox();
});

/* ===== Search ===== */

// Search toggle (open)
searchToggle.addEventListener('click', () => {
    const isOpen = searchBar.classList.toggle('is-open');
    searchToggle.classList.toggle('is-active', isOpen);
    if (isOpen) {
        searchInput.focus();
    } else {
        closeSearchBar();
    }
});

// FIX 3: close button inside the search bar
searchClose.addEventListener('click', closeSearchBar);

// Search input
searchInput.addEventListener('input', () => {
    searchQuery = searchInput.value;
    currentPage = 1;
    init();
});

// Filter button toggle
filterBtn.addEventListener('click', (e) => {
    e.stopPropagation();
    const isOpen = filterDropdown.classList.toggle('is-open');
    filterBtn.classList.toggle('is-active', isOpen);
});

// FIX 1: listen for changes on the individual radio inputs, not the dropdown container.
// The container approach missed events in some browsers because the change event fires
// on the input, not necessarily its label parent, and the dropdown div is not the input.
filterDropdown.querySelectorAll('input[type="radio"]').forEach(radio => {
    radio.addEventListener('change', () => {
        filterBy = radio.value;
        currentPage = 1;
        filterDropdown.classList.remove('is-open');
        filterBtn.classList.remove('is-active');
        init();
        if (searchInput.value) searchInput.focus();
    });
});

// Close filter dropdown when clicking outside
document.addEventListener('click', (e) => {
    if (!filterDropdown.contains(e.target) && e.target !== filterBtn) {
        filterDropdown.classList.remove('is-open');
        filterBtn.classList.remove('is-active');
    }
});

// Close search on Escape
searchInput.addEventListener('keydown', (e) => {
    if (e.key === 'Escape') closeSearchBar();
});




/* ═══════════════════════════════════════════════════════
   RECURRING TRANSACTIONS v2
   Append this entire block to the bottom of script.js
   (replaces the previous recurring block entirely)
   ═══════════════════════════════════════════════════════ */

const FREQ_LABELS = { daily: 'Daily', weekly: 'Weekly', monthly: 'Monthly' };

/* ── Storage helpers ── */
function getTemplates() {
  return JSON.parse(localStorage.getItem('recurringTemplates')) || [];
}
function saveTemplates(t) {
  localStorage.setItem('recurringTemplates', JSON.stringify(t));
}

/* ── Timezone-safe date key ── */
function localDateKey(d = new Date()) {
  return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}`;
}

/* ── Auto-insert overdue recurring entries on page load ── */
function processRecurring() {
  const templates = getTemplates();
  if (templates.length === 0) return;
  const todayKey = localDateKey();
  let changed = false;

  templates.forEach(tpl => {
    const [y, m, d] = tpl.nextDate.split('-').map(Number);
    let cursor = new Date(y, m - 1, d);

    while (localDateKey(cursor) <= todayKey) {
      const cursorKey = localDateKey(cursor);
      const alreadyExists = transactions.some(
        t => t.recurringId === tpl.id && t.date === cursorKey
      );
      if (!alreadyExists) {
        transactions.push({
          id: generateID(),
          text: tpl.name,
          amount: tpl.type === 'income' ? tpl.amount : -tpl.amount,
          category: tpl.category,
          date: cursorKey,
          receipt: null,
          recurringId: tpl.id
        });
        changed = true;
      }
      const next = new Date(cursor);
      if (tpl.frequency === 'daily')        next.setDate(next.getDate() + 1);
      else if (tpl.frequency === 'weekly')  next.setDate(next.getDate() + 7);
      else if (tpl.frequency === 'monthly') next.setMonth(next.getMonth() + 1);
      cursor = next;
    }
    tpl.nextDate = localDateKey(cursor);
  });

  saveTemplates(templates);
  if (changed) { updateLocalStorage(); init(); }
}

/* ── Render the recurring list card ── */
function renderRecurringList() {
  const listEl  = document.getElementById('recurring-list');
  const emptyEl = document.getElementById('recurring-empty');
  if (!listEl) return;

  const templates = getTemplates();
  listEl.innerHTML = '';

  if (templates.length === 0) {
    emptyEl.classList.add('is-visible');
    return;
  }
  emptyEl.classList.remove('is-visible');

  templates.forEach(tpl => {
    const isIncome = tpl.type === 'income';
    const sign     = isIncome ? '+' : '-';
    const cls      = isIncome ? 'r-income' : 'r-expense';
    const typeLabel = isIncome ? 'Income' : 'Expense';
    const typeCls   = isIncome ? 'rec-badge-income' : 'rec-badge-expense';

    const li = document.createElement('li');
    li.className = `recurring-item ${cls}`;
    li.dataset.id = tpl.id;
    li.innerHTML = `
      <span class="recurring-avatar">${icon(tpl.category)}</span>
      <div class="recurring-info">
        <span class="recurring-name">${tpl.name}</span>
        <div class="recurring-meta-row">
          <span class="rec-type-badge ${typeCls}">${typeLabel}</span>
          <span class="recurring-meta">${FREQ_LABELS[tpl.frequency]} · next ${formatDate(tpl.nextDate)}</span>
        </div>
      </div>
      <span class="recurring-amount">${sign}${formatCurrency(tpl.amount)}</span>
      <div class="recurring-actions">
        <button class="recurring-action-btn recurring-edit-btn" title="Edit">
          <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
            <path d="M12 20h9"/><path d="M16.5 3.5a2.1 2.1 0 0 1 3 3L7 19l-4 1 1-4 12.5-12.5z"/>
          </svg>
        </button>
        <button class="recurring-action-btn recurring-delete-btn" title="Remove">
          <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round">
            <path d="M18 6L6 18M6 6l12 12"/>
          </svg>
        </button>
      </div>
    `;
    listEl.appendChild(li);
  });

  /* Delegated click handler for edit + delete */
  listEl.addEventListener('click', e => {
    const item = e.target.closest('.recurring-item');
    if (!item) return;
    const id = +item.dataset.id;

    if (e.target.closest('.recurring-delete-btn')) {
      const updated = getTemplates().filter(t => t.id !== id);
      saveTemplates(updated);
      renderRecurringList();
    } else if (e.target.closest('.recurring-edit-btn')) {
      openRecurringModal(id);
    }
  });
}

/* ── Build & inject the modal (once) ── */
function buildRecurringModal() {
  if (document.getElementById('recurring-modal-overlay')) return;

  const overlay = document.createElement('div');
  overlay.id = 'recurring-modal-overlay';
  overlay.className = 'recurring-modal-overlay';
  overlay.innerHTML = `
    <div class="recurring-modal" role="dialog" aria-modal="true" aria-labelledby="rec-modal-title">
      <h3 id="rec-modal-title">Add Recurring Transaction</h3>

      <div class="form-control">
        <label for="rec-name">Name</label>
        <input type="text" id="rec-name" placeholder="e.g. Netflix, Rent, Salary" maxlength="40">
        <span class="error-message" id="rec-name-error"></span>
      </div>

      <div class="form-control">
        <label>Type</label>
        <div class="type-toggle" role="radiogroup">
          <input type="radio" id="rec-type-expense" name="rec-type" value="expense" checked>
          <label for="rec-type-expense" class="type-btn expense-btn">
            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M12 5v14"/><path d="M19 12l-7 7-7-7"/></svg>
            Expense
          </label>
          <input type="radio" id="rec-type-income" name="rec-type" value="income">
          <label for="rec-type-income" class="type-btn income-btn">
            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M12 19V5"/><path d="M5 12l7-7 7 7"/></svg>
            Income
          </label>
        </div>
      </div>

      <div class="form-row">
        <div class="form-control">
          <label for="rec-amount">Amount</label>
          <input type="number" id="rec-amount" placeholder="0.00" min="0" step="0.01">
          <span class="error-message" id="rec-amount-error"></span>
        </div>
        <div class="form-control">
          <label for="rec-frequency">Frequency</label>
          <select id="rec-frequency">
            <option value="monthly">Monthly</option>
            <option value="weekly">Weekly</option>
            <option value="daily">Daily</option>
          </select>
        </div>
      </div>

      <div class="form-row">
        <div class="form-control">
          <label for="rec-category">Category</label>
          <select id="rec-category"></select>
        </div>
        <div class="form-control">
          <label for="rec-start">Next date</label>
          <input type="date" id="rec-start">
          <span class="error-message" id="rec-start-error"></span>
        </div>
      </div>

      <div class="recurring-modal-actions">
        <button class="btn btn-ghost" id="rec-cancel-btn">Cancel</button>
        <button class="btn" id="rec-save-btn">Add Recurring</button>
      </div>
    </div>
  `;
  document.body.appendChild(overlay);

  function syncRecCats() {
    const type = document.querySelector('input[name="rec-type"]:checked').value;
    const sel  = document.getElementById('rec-category');
    sel.innerHTML = '';
    [...(categoryOptions[type] || []), ...(customCategories[type] || [])].forEach(c => {
      const opt = document.createElement('option');
      opt.value = c; opt.textContent = c;
      sel.appendChild(opt);
    });
  }

  overlay.querySelectorAll('input[name="rec-type"]').forEach(r => r.addEventListener('change', syncRecCats));
  overlay.addEventListener('click', e => { if (e.target === overlay) closeRecurringModal(); });
  document.addEventListener('keydown', e => {
    if (e.key === 'Escape' && overlay.classList.contains('is-open')) closeRecurringModal();
  });
  document.getElementById('rec-cancel-btn').addEventListener('click', closeRecurringModal);

  document.getElementById('rec-save-btn').addEventListener('click', () => {
    const nameEl  = document.getElementById('rec-name');
    const amtEl   = document.getElementById('rec-amount');
    const startEl = document.getElementById('rec-start');
    const errName  = document.getElementById('rec-name-error');
    const errAmt   = document.getElementById('rec-amount-error');
    const errStart = document.getElementById('rec-start-error');
    let valid = true;

    const clearE = (el, eEl) => { el.classList.remove('invalid'); eEl.textContent = ''; };
    const showE  = (el, eEl, msg) => { el.classList.add('invalid'); eEl.textContent = msg; valid = false; };

    if (!nameEl.value.trim()) showE(nameEl, errName, 'Enter a name');
    else clearE(nameEl, errName);

    const amt = parseFloat(amtEl.value);
    if (!amtEl.value || isNaN(amt) || amt <= 0) showE(amtEl, errAmt, 'Enter an amount > 0');
    else clearE(amtEl, errAmt);

    if (!startEl.value) showE(startEl, errStart, 'Pick a date');
    else clearE(startEl, errStart);

    if (!valid) return;

    const type     = document.querySelector('input[name="rec-type"]:checked').value;
    const editingRecId = +overlay.dataset.editingId || null;

    const tpl = {
      id:        editingRecId || generateID(),
      name:      nameEl.value.trim(),
      type,
      amount:    amt,
      frequency: document.getElementById('rec-frequency').value,
      category:  document.getElementById('rec-category').value,
      nextDate:  startEl.value
    };

    let templates = getTemplates();
    if (editingRecId) {
      templates = templates.map(t => t.id === editingRecId ? tpl : t);
    } else {
      templates.push(tpl);
    }
    saveTemplates(templates);

    closeRecurringModal();
    processRecurring();
    renderRecurringList();
  });
}

/* ── Open modal, optionally pre-filled for editing ── */
function openRecurringModal(editId = null) {
  buildRecurringModal();
  const overlay  = document.getElementById('recurring-modal-overlay');
  const titleEl  = document.getElementById('rec-modal-title');
  const saveBtn  = document.getElementById('rec-save-btn');

  /* Reset form */
  document.getElementById('rec-name').value = '';
  document.getElementById('rec-name').classList.remove('invalid');
  document.getElementById('rec-name-error').textContent = '';
  document.getElementById('rec-amount').value = '';
  document.getElementById('rec-amount').classList.remove('invalid');
  document.getElementById('rec-amount-error').textContent = '';
  document.getElementById('rec-start').value = localDateKey();
  document.getElementById('rec-start').classList.remove('invalid');
  document.getElementById('rec-start-error').textContent = '';
  document.getElementById('rec-type-expense').checked = true;
  document.getElementById('rec-frequency').value = 'monthly';

  /* Sync cats after resetting type */
  const type = 'expense';
  const sel = document.getElementById('rec-category');
  sel.innerHTML = '';
  [...(categoryOptions[type] || []), ...(customCategories[type] || [])].forEach(c => {
    const opt = document.createElement('option');
    opt.value = c; opt.textContent = c;
    sel.appendChild(opt);
  });

  if (editId) {
    const tpl = getTemplates().find(t => t.id === editId);
    if (tpl) {
      titleEl.textContent = 'Edit Recurring Transaction';
      saveBtn.textContent = 'Save Changes';
      overlay.dataset.editingId = editId;

      document.getElementById('rec-name').value = tpl.name;
      document.getElementById('rec-amount').value = tpl.amount;
      document.getElementById('rec-frequency').value = tpl.frequency;
      document.getElementById('rec-start').value = tpl.nextDate;

      const typeRadio = document.getElementById(tpl.type === 'income' ? 'rec-type-income' : 'rec-type-expense');
      typeRadio.checked = true;

      /* Re-populate categories for the correct type, then select the saved one */
      const catSel = document.getElementById('rec-category');
      catSel.innerHTML = '';
      [...(categoryOptions[tpl.type] || []), ...(customCategories[tpl.type] || [])].forEach(c => {
        const opt = document.createElement('option');
        opt.value = c; opt.textContent = c;
        if (c === tpl.category) opt.selected = true;
        catSel.appendChild(opt);
      });
    }
  } else {
    titleEl.textContent = 'Add Recurring Transaction';
    saveBtn.textContent = 'Add Recurring';
    delete overlay.dataset.editingId;
  }

  overlay.classList.add('is-open');
  setTimeout(() => document.getElementById('rec-name')?.focus(), 50);
}

function closeRecurringModal() {
  document.getElementById('recurring-modal-overlay')?.classList.remove('is-open');
}

/* ── Wire the + button ── */
document.getElementById('add-recurring-btn')?.addEventListener('click', () => openRecurringModal());

/* ── Run on page load ── */
processRecurring();
renderRecurringList();


/* ═══════════════════════════════════════════════════════
   BUDGETS
   ═══════════════════════════════════════════════════════ */

const BUDGET_PERIOD_LABELS = { daily: 'Daily', weekly: 'Weekly', monthly: 'Monthly' };

/* ── Storage ── */
function getBudgets() {
  return JSON.parse(localStorage.getItem('budgets')) || [];
}
function saveBudgets(b) {
  localStorage.setItem('budgets', JSON.stringify(b));
}

/* ── Compute how much has been spent for a budget in its current period ── */
function computeSpent(budget) {
  const now = new Date();
  const y = now.getFullYear(), m = now.getMonth(), d = now.getDate();

  let start;
  if (budget.period === 'daily') {
    start = new Date(y, m, d);
  } else if (budget.period === 'weekly') {
    // Monday-based week
    const day = now.getDay();
    const diff = day === 0 ? -6 : 1 - day;
    start = new Date(y, m, d + diff);
  } else {
    start = new Date(y, m, 1);
  }
  start.setHours(0, 0, 0, 0);

  return transactions
    .filter(t => {
      if (t.amount >= 0) return false; // expenses only
      if (budget.category !== 'All' && t.category !== budget.category) return false;
      if (!t.date) return false;
      const [ty, tm, td] = t.date.split('-').map(Number);
      const txDate = new Date(ty, tm - 1, td);
      return txDate >= start;
    })
    .reduce((sum, t) => sum + Math.abs(t.amount), 0);
}

/* ── Render ── */
function renderBudgetList() {
  const listEl  = document.getElementById('budget-list');
  const emptyEl = document.getElementById('budget-empty');
  if (!listEl) return;

  const budgets = getBudgets();
  listEl.innerHTML = '';

  if (budgets.length === 0) {
    emptyEl.classList.add('is-visible');
    return;
  }
  emptyEl.classList.remove('is-visible');

  budgets.forEach(b => {
    const spent = computeSpent(b);
    const pct   = b.limit > 0 ? Math.min((spent / b.limit) * 100, 100) : 0;
    const rawPct = b.limit > 0 ? (spent / b.limit) * 100 : 0;
    const isOver = spent > b.limit;
    const isWarn = !isOver && rawPct >= 80;

    const fillCls = isOver ? 'over' : isWarn ? 'warn' : '';
    const remaining = b.limit - spent;

    const li = document.createElement('li');
    li.className = `budget-item${isOver ? ' is-over' : ''}`;
    li.dataset.id = b.id;

    li.innerHTML = `
      <div class="budget-top-row">
        <div class="budget-info">
          <span class="budget-name">${b.category === 'All' ? 'All Expenses' : b.category}</span>
          <div class="budget-meta">
            <span class="budget-period-badge">${BUDGET_PERIOD_LABELS[b.period]}</span>
            ${isOver
              ? `<span style="color:var(--color-expense);font-size:11px;font-weight:600">↑ ${formatCurrency(Math.abs(remaining))} over limit</span>`
              : `<span>${formatCurrency(remaining)} left</span>`
            }
          </div>
        </div>
        <div style="display:flex;align-items:center;gap:8px">
          <div class="budget-amounts">
            <span class="budget-spent">${formatCurrency(spent)}</span>
            <span class="budget-limit">/ ${formatCurrency(b.limit)}</span>
          </div>
          <div class="budget-actions">
            <button class="budget-action-btn budget-edit-btn" title="Edit">
              <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M12 20h9"/><path d="M16.5 3.5a2.1 2.1 0 0 1 3 3L7 19l-4 1 1-4 12.5-12.5z"/></svg>
            </button>
            <button class="budget-action-btn budget-delete-btn" title="Remove">
              <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round"><path d="M18 6L6 18M6 6l12 12"/></svg>
            </button>
          </div>
        </div>
      </div>
      <div class="budget-bar-wrap">
        <div class="budget-bar-fill ${fillCls}" style="width:${pct}%"></div>
      </div>
      <div class="budget-bottom-row">
        <span class="budget-pct">${Math.round(rawPct)}% used</span>
        <span class="budget-over-badge">⚠ Over budget</span>
      </div>
    `;
    listEl.appendChild(li);
  });

  /* Delegated events */
  listEl.addEventListener('click', e => {
    const item = e.target.closest('.budget-item');
    if (!item) return;
    const id = +item.dataset.id;
    if (e.target.closest('.budget-delete-btn')) {
      saveBudgets(getBudgets().filter(b => b.id !== id));
      renderBudgetList();
    } else if (e.target.closest('.budget-edit-btn')) {
      openBudgetModal(id);
    }
  });
}

/* ── Build modal (once) ── */
function buildBudgetModal() {
  if (document.getElementById('budget-modal-overlay')) return;

  /* Gather all expense categories for the dropdown */
  const allExpenseCats = ['All', ...categoryOptions.expense, ...customCategories.expense];

  const overlay = document.createElement('div');
  overlay.id = 'budget-modal-overlay';
  overlay.className = 'budget-modal-overlay';
  overlay.innerHTML = `
    <div class="budget-modal" role="dialog" aria-modal="true" aria-labelledby="budget-modal-title">
      <h3 id="budget-modal-title">Add Budget</h3>

      <div class="form-control">
        <label for="budget-category">Category</label>
        <select id="budget-category">
          ${allExpenseCats.map(c => `<option value="${c}">${c === 'All' ? 'All Expenses' : c}</option>`).join('')}
        </select>
      </div>

      <div class="form-row">
        <div class="form-control">
          <label for="budget-limit">Limit (${currentCurrency})</label>
          <input type="number" id="budget-limit" placeholder="0.00" min="0" step="0.01">
          <span class="error-message" id="budget-limit-error"></span>
        </div>
        <div class="form-control">
          <label for="budget-period">Period</label>
          <select id="budget-period">
            <option value="monthly">Monthly</option>
            <option value="weekly">Weekly</option>
            <option value="daily">Daily</option>
          </select>
        </div>
      </div>

      <div class="budget-modal-actions">
        <button class="btn btn-ghost" id="budget-cancel-btn">Cancel</button>
        <button class="btn" id="budget-save-btn">Add Budget</button>
      </div>
    </div>
  `;
  document.body.appendChild(overlay);

  overlay.addEventListener('click', e => { if (e.target === overlay) closeBudgetModal(); });
  document.addEventListener('keydown', e => {
    if (e.key === 'Escape' && overlay.classList.contains('is-open')) closeBudgetModal();
  });
  document.getElementById('budget-cancel-btn').addEventListener('click', closeBudgetModal);

  document.getElementById('budget-save-btn').addEventListener('click', () => {
    const limitEl    = document.getElementById('budget-limit');
    const limitErrEl = document.getElementById('budget-limit-error');
    const limit = parseFloat(limitEl.value);

    if (!limitEl.value || isNaN(limit) || limit <= 0) {
      limitEl.classList.add('invalid');
      limitErrEl.textContent = 'Enter a limit greater than 0';
      return;
    }
    limitEl.classList.remove('invalid');
    limitErrEl.textContent = '';

    const editId = +overlay.dataset.editingId || null;
    const b = {
      id:       editId || generateID(),
      category: document.getElementById('budget-category').value,
      limit,
      period:   document.getElementById('budget-period').value
    };

    let budgets = getBudgets();
    if (editId) {
      budgets = budgets.map(x => x.id === editId ? b : x);
    } else {
      budgets.push(b);
    }
    saveBudgets(budgets);
    closeBudgetModal();
    renderBudgetList();
  });
}

function openBudgetModal(editId = null) {
  buildBudgetModal();
  const overlay  = document.getElementById('budget-modal-overlay');
  const titleEl  = document.getElementById('budget-modal-title');
  const saveBtn  = document.getElementById('budget-save-btn');
  const limitEl  = document.getElementById('budget-limit');
  const limitErr = document.getElementById('budget-limit-error');

  /* Reset */
  limitEl.value = '';
  limitEl.classList.remove('invalid');
  limitErr.textContent = '';
  document.getElementById('budget-period').value = 'monthly';
  delete overlay.dataset.editingId;

  /* Re-populate categories (custom cats may have been added since last build) */
  const catSel = document.getElementById('budget-category');
  catSel.innerHTML = '';
  ['All', ...categoryOptions.expense, ...customCategories.expense].forEach(c => {
    const opt = document.createElement('option');
    opt.value = c;
    opt.textContent = c === 'All' ? 'All Expenses' : c;
    catSel.appendChild(opt);
  });

  if (editId) {
    const b = getBudgets().find(x => x.id === editId);
    if (b) {
      titleEl.textContent   = 'Edit Budget';
      saveBtn.textContent   = 'Save Changes';
      overlay.dataset.editingId = editId;
      catSel.value          = b.category;
      limitEl.value         = b.limit;
      document.getElementById('budget-period').value = b.period;
    }
  } else {
    titleEl.textContent = 'Add Budget';
    saveBtn.textContent = 'Add Budget';
  }

  overlay.classList.add('is-open');
  setTimeout(() => limitEl.focus(), 50);
}

function closeBudgetModal() {
  document.getElementById('budget-modal-overlay')?.classList.remove('is-open');
}

/* ── Wire + button ── */
document.getElementById('add-budget-btn')?.addEventListener('click', () => openBudgetModal());

/* ── Re-render budgets whenever transactions change ── */
const _origUpdateLS = updateLocalStorage;
// Patch updateLocalStorage to also refresh budgets
const _patchedUpdateLS = function() {
  _origUpdateLS();
  renderBudgetList();
};
// Override the global reference used in addTrans / removeTransaction
window.updateLocalStorage = _patchedUpdateLS;

/* ── Initial render ── */
renderBudgetList();