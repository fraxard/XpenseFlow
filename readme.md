<div align="center">

# XpenseFlow

### A modern, lightweight expense tracker built with Vanilla JavaScript, as of v0.5

Track your income and expenses, organize transactions with categories, attach receipts, and manage your finances — all locally in your browser.

![Version](https://img.shields.io/badge/version-v0.5-blue)
![HTML](https://img.shields.io/badge/HTML-5-orange)
![CSS](https://img.shields.io/badge/CSS-3-blue)
![JavaScript](https://img.shields.io/badge/JavaScript-ES6-yellow)
![License](https://img.shields.io/badge/license-MIT-green)

</div>

---

## Overview

XpenseFlow is a clean and responsive expense tracking web application designed to help users record daily transactions without requiring an account or backend server.

Everything is stored locally using the browser's Local Storage, making the application fast, private, and completely offline-friendly.

The goal of this project is to demonstrate how far modern web applications can be built using only HTML, CSS, and Vanilla JavaScript.

---

# Features

## Dashboard

- Live balance calculation
- Total income
- Total expenses
- Beautiful financial summary card
- Currency formatting

---

## Transaction Management

- Add new transactions
- Edit existing transactions
- Delete transactions
- Transaction history
- Automatic balance updates
- Date selection
- Category selection
- Income / Expense toggle

---

## Receipt Upload

Attach receipt images to transactions.

Features include:

- Image upload
- Image preview
- Remove uploaded receipt
- Receipt indicator inside transaction history
- Click to enlarge receipt
- Full-screen image viewer (Lightbox)
- Image validation
- Maximum upload size protection

---

## Categories

Built-in categories for both income and expenses.

Supports:

- Custom categories
- Add categories
- Remove custom categories
- Categories stored separately
- Persistent category storage

---

## Theme Support

- Dark mode
- Light mode
- Theme persistence
- Smooth transitions

---

## Currency Support

Switch instantly between:

- USD
- EUR
- GBP
- INR
- JPY
- AUD
- CAD

Currency preference is automatically remembered.

---

## User Experience

- Responsive design
- Modern UI
- Animated cards
- Onboarding modal
- First-time user guide
- Empty states
- Inline validation
- Hover actions
- SVG icons
- Keyboard accessibility

---

## Data Persistence

All application data is stored inside Local Storage.

Stored data includes:

- Transactions
- Categories
- Theme
- Currency
- Onboarding progress

No external database is required.

---

# Tech Stack

- HTML5
- CSS3
- Vanilla JavaScript (ES6)
- Local Storage API
- FileReader API
- Intl.NumberFormat API

No frameworks.

No libraries.

No backend.

---

# Screenshots

> Screenshots will be added soon.

---

# Project Structure

```
XpenseFlow/
│
├── index.html
├── style.css
├── script.js
├── favicon.svg
├── README.md
└── .gitignore
```

---

# Installation

Clone the repository

```bash
git clone https://github.com/fraxard/XpenseFlow.git
```

Open the project

```bash
cd XpenseFlow
```

Run locally

Simply open

```
index.html
```

inside your browser.

No build tools required.

---

# Current Version

## v0.5

### Added

- Receipt upload
- Receipt preview
- Receipt lightbox
- Transaction editing
- Transaction deletion
- Custom categories
- Theme switcher
- Currency selector
- Onboarding experience
- Better UI
- Improved validation
- Modern dashboard
- Responsive layout

---

# Roadmap

## v0.6

- Search transactions
- Filters
- Better statistics
- Monthly summary
- Export data
- Import data

---

## v0.7

- Charts
- Category analytics
- Budget goals
- Recurring transactions
- Transaction pagination

---

## v0.8

- IndexedDB support
- Performance improvements
- Keyboard shortcuts
- Better accessibility

---

## v1.0

- User authentication
- Cloud sync
- Database support
- Multi-device access
- PWA support
- Production release

---

# Why I Built This

XpenseFlow started as a personal project to improve my JavaScript skills by building a real-world application without relying on frameworks.

Instead of using React or Vue, the goal was to understand:

- DOM manipulation
- State management
- Local Storage
- File uploads
- Event handling
- Responsive UI design
- Component organization using plain JavaScript

The project continues to evolve with each version.

---

# Contributing

Contributions, suggestions and issue reports are welcome.

If you'd like to improve XpenseFlow:

1. Fork the repository
2. Create a new branch

```
git checkout -b feature/my-feature
```

3. Commit your changes

```
git commit -m "Add my feature"
```

4. Push your branch

```
git push origin feature/my-feature
```

5. Open a Pull Request

---

# License

This project is licensed under the MIT License.

---

<div align="center">

Built by **fraxard**

If you found this project useful, consider giving it a ⭐ on GitHub.

</div>