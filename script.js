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
let searchQuery = '';
let filterBy = 'name';

// The currently attached receipt image, as a base64 data URL, or null if none.
let receiptImage = null;

// Category choices depend on whether the transaction is an expense or income
const categoryOptions = {
    expense: ['Food', 'Rent', 'Utilities', 'Transport', 'Entertainment', 'Health', 'Shopping', 'Other'],
    income: ['Salary', 'Freelance', 'Gift', 'Investment', 'Other']
};

// Categories the user has added themselves (e.g. "Pets", "Gym", "College"),
// kept separate from the built-in defaults above and persisted on their own.
let customCategories = JSON.parse(localStorage.getItem('customCategories')) || { expense: [], income: [] };

function saveCustomCategories() {
    localStorage.setItem('customCategories', JSON.stringify(customCategories));
}

// Minimal custom line-icon set (24x24, stroke = currentColor). Self-contained —
// no external icon font/library needed.
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

// Which currency amounts are displayed in — a display preference, not a conversion.
// Stored amounts are always plain numbers; only the formatting changes.
let currentCurrency = localStorage.getItem('currency') || 'USD';
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
]

const localStorageTransactions = JSON.parse(localStorage.getItem('transactions'));

let transactions = localStorage.getItem('transactions') !== null ? localStorageTransactions : dummyTransactions;

// id of the transaction currently being edited, or null when adding a new one
let editingId = null;

// Fill the category dropdown for the given type ('expense' | 'income'),
// optionally pre-selecting a specific category (used when editing)
function populateCategories(type, selected) {
    category.innerHTML = '';

    const allCategories = [...categoryOptions[type], ...customCategories[type]];

    // If we're editing a transaction whose category was later removed
    // (e.g. a custom category got deleted), keep it selectable so editing
    // doesn't silently swap the category out from under the user.
    if (selected && !allCategories.includes(selected)) {
        allCategories.push(selected);
    }

    allCategories.forEach(cat => {
        const opt = document.createElement('option');
        opt.value = cat;
        opt.textContent = cat;
        if (cat === selected) {
            opt.selected = true;
        }
        category.appendChild(opt);
    });

    renderCategoryChips(type);
}

// Show the user's custom categories (for the current type) as removable chips
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

// The type currently selected in the Expense/Income toggle
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

// Add a new custom category for the currently selected type (expense/income)
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

// Remove a custom category. Existing transactions keep showing it (see the
// "selected" defense in populateCategories), only new ones stop offering it.
function removeCustomCategory(type, name) {
    customCategories[type] = customCategories[type].filter(cat => cat !== name);
    saveCustomCategories();
    populateCategories(type, category.value === name ? undefined : category.value);
}

// Today's date as YYYY-MM-DD, for the date input's default value
function todayString() {
    const d = new Date();
    const month = String(d.getMonth() + 1).padStart(2, '0');
    const day = String(d.getDate()).padStart(2, '0');
    return `${d.getFullYear()}-${month}-${day}`;
}

// Turn 'YYYY-MM-DD' into a friendlier display date, e.g. 'Jul 9, 2026'
function formatDate(dateStr) {
    if (!dateStr) return 'No date';
    const [year, month, day] = dateStr.split('-').map(Number);
    const d = new Date(year, month - 1, day);
    return d.toLocaleDateString(undefined, { year: 'numeric', month: 'short', day: 'numeric' });
}

// Inline validation helpers
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

// Max size for a receipt image, kept modest since it's stored as base64 in localStorage.
const MAX_RECEIPT_BYTES = 3 * 1024 * 1024; // 3MB

// Show the attached receipt as a thumbnail with a remove button, and hide the dropzone.
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

// Clear the currently attached receipt (used on remove, reset, and cancel-edit)
function clearReceipt() {
    receiptImage = null;
    receiptInput.value = '';
    clearError(receiptInput, receiptError);
    renderReceiptPreview();
}

// Validate the form, setting inline error states as needed.
// Returns true only if every field is valid.
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

// Add or update a transaction
function addTrans(e) {
    e.preventDefault();

    if (!validateForm()) {
        return;
    }

    // Amount is always entered as a positive number;
    // the selected type (Expense/Income) decides the sign internally.
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

// Generate random ID
function generateID() {
    return Math.floor(Math.random() * 1000);
}

// Add transaction to DOM list
function addTransDOM(transaction) {
    // Get sign
    const sign = transaction.amount < 0 ? '-' : '+';

    const item = document.createElement('li');

    // Add class based on value
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

// Open the lightbox showing a transaction's attached receipt image
function viewReceipt(id) {
    const transaction = transactions.find(t => t.id === id);
    if (!transaction || !transaction.receipt) return;
    openLightbox(transaction.receipt);
}

// Update balance, income and expense
function updateValues() {
    const amounts = transactions.map(transaction => transaction.amount);

    const total = amounts.reduce((acc, item) => (acc += item), 0);

    const income = amounts
        .filter(item => item > 0)
        .reduce((acc, item) => (acc += item), 0);

    const expense = amounts
        .filter(item => item < 0)
        .reduce((acc, item) => (acc += item), 0) * -1;

    balance.innerText = formatCurrency(total);
    money_plus.innerText = formatCurrency(income);
    money_minus.innerText = formatCurrency(expense);
}

// Load a transaction's values into the form so it can be edited
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

// Reset the form back to "add new transaction" mode
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

// Remove transaction by ID
function removeTransaction(id) {
    transactions = transactions.filter(transaction => transaction.id !== id);

    updateLocalStorage();

    if (editingId === id) {
        resetForm();
    }

    init();
}

// Update local storage transactions
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
    const initialTheme = savedTheme || 'dark';
    applyTheme(initialTheme);
}


function renderPagination(total) {
    if (!paginationEl) return;

    const totalPages = Math.ceil(total / ITEMS_PER_PAGE);
    paginationEl.innerHTML = '';

    if (totalPages <= 1) return;

    // Prev button
    const prev = document.createElement('button');
    prev.className = 'page-btn';
    prev.textContent = '←';
    prev.disabled = currentPage === 1;
    prev.addEventListener('click', () => {
        currentPage--;
        init();
    });
    paginationEl.appendChild(prev);

    // Page number buttons
    for (let i = 1; i <= totalPages; i++) {
        const btn = document.createElement('button');
        btn.className = 'page-btn' + (i === currentPage ? ' active' : '');
        btn.textContent = i;

        btn.addEventListener('click', () => {
            currentPage = i;
            init();
        });

        paginationEl.appendChild(btn);
    }

    // Next button
    const next = document.createElement('button');
    next.className = 'page-btn';
    next.textContent = '→';
    next.disabled = currentPage === totalPages;

    next.addEventListener('click', () => {
        currentPage++;
        init();
    });

    paginationEl.appendChild(next);
}



function getFilteredTransactions() {
    const q = searchQuery.trim().toLowerCase();
    if (!q) return transactions;

    return transactions.filter(t => {
        switch (filterBy) {
            case 'name':
                return t.text.toLowerCase().includes(q);
            case 'category':
                return (t.category || '').toLowerCase().includes(q);
            case 'date':
                return (t.date || '').includes(q) || formatDate(t.date).toLowerCase().includes(q);
            case 'type':
                return (t.amount > 0 ? 'income' : 'expense').includes(q);
            case 'amount':
                return String(Math.abs(t.amount)).includes(q);
            default:
                return true;
        }
    });
}

function init() {
    list.innerHTML = '';

    // Get filtered transactions and reverse them (newest first)
    const filtered = [...getFilteredTransactions()].reverse();

    // Clamp current page based on FILTERED results
    const totalPages = Math.max(1, Math.ceil(filtered.length / ITEMS_PER_PAGE));

    if (currentPage > totalPages) {
        currentPage = totalPages;
    }

    // Paginate filtered list
    const start = (currentPage - 1) * ITEMS_PER_PAGE;
    const pageItems = filtered.slice(start, start + ITEMS_PER_PAGE);

    // Render current page
    pageItems.forEach(addTransDOM);

    // Totals should always use ALL transactions
    updateValues();

    // Render pagination based on filtered results
    renderPagination(filtered.length);

    // Empty state logic
    const hasTransactions = transactions.length > 0;
    const hasResults = filtered.length > 0;

    emptyState.classList.toggle('is-visible', !hasTransactions);

    if (typeof noResults !== 'undefined' && noResults) {
        noResults.classList.toggle('is-visible', hasTransactions && !hasResults);
    }
}


populateCategories('expense');
dateInput.value = todayString();
initTheme();
currentPage = 1; // Reset to first page on load
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
    if (e.key === 'Enter') {
        e.preventDefault();
        addCustomCategory();
    } else if (e.key === 'Escape') {
        closeAddCategoryPanel();
    }
});

// Event delegation: chips are re-rendered often, so listen on the container
categoryChips.addEventListener('click', (e) => {
    const removeBtn = e.target.closest('.chip-remove');
    if (!removeBtn) return;
    removeCustomCategory(currentType(), removeBtn.dataset.category);
});


/* ===========================
   XpenseFlow Onboarding
   --------------------------------------------------
   Onboarding mode — pick ONE of the two lines below.

   PRODUCTION (default): tour shows once for new users,
   then never again on that browser, via localStorage.
   const ONBOARDING_DEV_MODE = false;

   DEVELOPMENT: tour shows on every single page refresh,
   regardless of localStorage. Handy while you're testing
   changes to the modal or guide tips.
   const ONBOARDING_DEV_MODE = true;
=========================== */
const ONBOARDING_DEV_MODE = false;

document.addEventListener("DOMContentLoaded", () => {

    // A tiny state machine: each step's message, and (optionally) what the
    // user needs to do to move on to the next one.
    const guideSteps = [
        "👋 Start by adding your first transaction above.",
        "✏️ Nice! Hover a transaction and use the icons to edit or delete it.",
        "🎉 You're all set — explore your dashboard anytime!"
    ];
    let guideStep = -1; // -1 = guide not started yet
    let guideHideTimer = null;
    let transactionCountAtStepStart = 0; // baseline to detect a genuinely new transaction

    function showGuideStep(step) {
        if (!guideTip) return;

        guideStep = step;
        guideTip.textContent = guideSteps[step];
        guideTip.style.display = "block";

        clearTimeout(guideHideTimer);

        // The last step is just a confirmation, not a call to action —
        // let it linger a moment, then wrap up the tour on its own.
        if (step === guideSteps.length - 1) {
            guideHideTimer = setTimeout(completeOnboarding, 4000);
        }
    }

    function completeOnboarding() {
        if (guideTip) {
            guideTip.style.display = "none";
        }
    }

    function closeModalAndStartGuide() {
        welcomeModal.classList.remove("is-visible");

        // The welcome modal itself only needs to be seen once — save that
        // immediately on close, rather than waiting for the whole guide
        // (add + edit/delete) to be completed.
        if (!ONBOARDING_DEV_MODE) {
            localStorage.setItem("xpenseflow-onboarding", "true");
        }
        transactionCountAtStepStart = transactions.length;
        showGuideStep(0);
        text.focus();
    }

    const hasSeenOnboarding = localStorage.getItem("xpenseflow-onboarding");
    if (ONBOARDING_DEV_MODE || !hasSeenOnboarding) {
        welcomeModal.classList.add("is-visible");
    }

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
        if (e.key === "Escape" && welcomeModal.classList.contains("is-visible")) {
            closeModalAndStartGuide();
        }
    });

    // Advance to step 2 once a transaction has actually been added —
    // not on every submit attempt, since validation might have failed
    // and addTrans() would have bailed out without changing the list.
    // (Comparing against a baseline, rather than just checking length > 0,
    // because new users start with a few demo transactions preloaded.)
    form.addEventListener("submit", () => {
        if (guideStep === 0 && transactions.length > transactionCountAtStepStart) {
            showGuideStep(1);
        }
    });

    // Advance to the final step once they actually try editing/deleting
    list.addEventListener("click", (e) => {
        if (guideStep === 1 && e.target.closest(".edit-btn, .delete-btn")) {
            showGuideStep(2);
        }
    });
});




// Receipt / image upload
receiptInput.addEventListener('change', (e) => {
    const file = e.target.files[0];

    if (!file) {
        return;
    }

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

    reader.onload = () => {
        receiptImage = reader.result;
        renderReceiptPreview();
    };

    reader.onerror = () => {
        setError(receiptInput, receiptError, 'Could not read that image, please try again');
    };

    reader.readAsDataURL(file);
});

// Event delegation: the remove button and thumbnail are re-rendered often
receiptPreview.addEventListener('click', (e) => {
    if (e.target.closest('#receipt-remove-btn')) {
        clearReceipt();
        return;
    }

    if (e.target.closest('#receipt-thumb-preview') && receiptImage) {
        openLightbox(receiptImage);
    }
});

// Receipt lightbox (used both from the form preview and the history list)
function openLightbox(src) {
    lightboxImg.src = src;
    receiptLightbox.classList.add('is-visible');
}

function closeLightbox() {
    receiptLightbox.classList.remove('is-visible');
    lightboxImg.src = '';
}

lightboxClose.addEventListener('click', closeLightbox);

receiptLightbox.addEventListener('click', (e) => {
    if (e.target === receiptLightbox) {
        closeLightbox();
    }
});

document.addEventListener('keydown', (e) => {
    if (e.key === 'Escape' && receiptLightbox.classList.contains('is-visible')) {
        closeLightbox();
    }
});


// Search toggle
searchToggle.addEventListener('click', () => {
    const isOpen = searchBar.classList.toggle('is-open');
    searchToggle.classList.toggle('is-active', isOpen);
    if (isOpen) {
        searchInput.focus();
    } else {
        searchInput.value = '';
        searchQuery = '';
        filterDropdown.classList.remove('is-open');
        filterBtn.classList.remove('is-active');
        currentPage = 1;
        init();
    }
});

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

// Filter radio selection
filterDropdown.addEventListener('change', (e) => {
    if (e.target.name === 'filter') {
        filterBy = e.target.value;
        currentPage = 1;
        init();
        filterDropdown.classList.remove('is-open');
        filterBtn.classList.remove('is-active');
        if (searchInput.value) searchInput.focus();
    }
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
    if (e.key === 'Escape') {
        searchToggle.click();
    }
});