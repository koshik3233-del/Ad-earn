class CounterApp {
    constructor() {
        this.apiBase = 'http://localhost:3000/api';
        this.token = localStorage.getItem('token');
        this.user = JSON.parse(localStorage.getItem('user'));
        this.isListening = false;
        this.recognition = null;
        this.socket = null;
        this.coins = 0;
        this.balance = 0;
        this.totalEarned = 0;
        
        this.initialize();
    }

    initialize() {
        this.setupEventListeners();
        this.checkAuth();
        this.initSpeechRecognition();
        this.initSocket();
        this.showNarayanAnimation();
    }

    setupEventListeners() {
        // Auth
        document.getElementById('login-btn').addEventListener('click', () => this.login());
        document.getElementById('register-btn').addEventListener('click', () => this.register());
        document.querySelectorAll('.auth-tab').forEach(tab => {
            tab.addEventListener('click', (e) => this.switchAuthTab(e.target));
        });

        // App
        document.getElementById('wallet-btn').addEventListener('click', () => this.showWalletModal());
        document.getElementById('logout-btn').addEventListener('click', () => this.logout());
        document.getElementById('transactions-link').addEventListener('click', (e) => {
            e.preventDefault();
            this.showWalletModal();
        });
        document.getElementById('profile-link').addEventListener('click', (e) => {
            e.preventDefault();
            this.showProfileModal();
        });

        // Voice Control
        document.getElementById('toggle-mic').addEventListener('click', () => this.toggleListening());

        // Manual Coin Add
        document.querySelectorAll('.coin-btn').forEach(btn => {
            btn.addEventListener('click', (e) => {
                const coins = parseInt(e.target.dataset.coins);
                this.addCoins(coins);
            });
        });

        // Wallet Modal
        document.querySelector('.close-modal').addEventListener('click', () => this.hideModals());
        document.querySelectorAll('.withdraw-option').forEach(btn => {
            btn.addEventListener('click', (e) => {
                const amount = parseInt(e.target.dataset.amount);
                document.getElementById('withdraw-amount').value = amount;
            });
        });

        document.querySelectorAll('input[name="payment-method"]').forEach(radio => {
            radio.addEventListener('change', (e) => {
                this.updatePaymentDetails(e.target.value);
            });
        });

        document.getElementById('request-withdraw').addEventListener('click', () => this.requestWithdrawal());

        // Close modals on outside click
        document.querySelectorAll('.modal').forEach(modal => {
            modal.addEventListener('click', (e) => {
                if (e.target === modal) this.hideModals();
            });
        });
    }

    checkAuth() {
        if (this.token && this.user) {
            this.showApp();
            this.loadWalletData();
            this.loadTransactions();
        } else {
            this.showAuth();
        }
    }

    showAuth() {
        document.getElementById('auth-screen').classList.remove('hidden');
        document.getElementById('app-screen').classList.add('hidden');
    }

    showApp() {
        document.getElementById('auth-screen').classList.add('hidden');
        document.getElementById('app-screen').classList.remove('hidden');
        document.getElementById('user-name').textContent = this.user.name;
    }

    async login() {
        const email = document.getElementById('login-email').value;
        const password = document.getElementById('login-password').value;
        const errorEl = document.getElementById('login-error');

        try {
            const response = await fetch(`${this.apiBase}/login`, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ email, password })
            });

            const data = await response.json();

            if (response.ok) {
                this.token = data.token;
                this.user = data.user;
                localStorage.setItem('token', this.token);
                localStorage.setItem('user', JSON.stringify(this.user));
                this.showNotification('Login successful!', 'success');
                this.showApp();
                this.loadWalletData();
            } else {
                errorEl.textContent = data.error;
            }
        } catch (error) {
            errorEl.textContent = 'Network error. Please try again.';
        }
    }

    async register() {
        const name = document.getElementById('register-name').value;
        const email = document.getElementById('register-email').value;
        const password = document.getElementById('register-password').value;
        const errorEl = document.getElementById('register-error');

        try {
            const response = await fetch(`${this.apiBase}/register`, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ name, email, password })
            });

            const data = await response.json();

            if (response.ok) {
                this.token = data.token;
                this.user = data.user;
                localStorage.setItem('token', this.token);
                localStorage.setItem('user', JSON.stringify(this.user));
                this.showNotification('Registration successful!', 'success');
                this.showApp();
            } else {
                errorEl.textContent = data.error;
            }
        } catch (error) {
            errorEl.textContent = 'Network error. Please try again.';
        }
    }

    switchAuthTab(tab) {
        document.querySelectorAll('.auth-tab').forEach(t => t.classList.remove('active'));
        document.querySelectorAll('.auth-form').forEach(f => f.classList.remove('active'));
        
        tab.classList.add('active');
        document.getElementById(`${tab.dataset.tab}-form`).classList.add('active');
    }

    logout() {
        localStorage.removeItem('token');
        localStorage.removeItem('user');
        this.token = null;
        this.user = null;
        this.showAuth();
        this.showNotification('Logged out successfully', 'info');
    }

    initSpeechRecognition() {
        if ('webkitSpeechRecognition' in window) {
            this.recognition = new webkitSpeechRecognition();
            this.recognition.continuous = true;
            this.recognition.interimResults = true;
            this.recognition.lang = 'en-US';

            this.recognition.onresult = (event) => {
                const transcript = Array.from(event.results)
                    .map(result => result[0].transcript)
                    .join('');

                if (transcript.toLowerCase().includes('narayan')) {
                    this.addCoins(1);
                    this.showNotification('Narayan detected! +1 coin added', 'success');
                    document.getElementById('last-detected').textContent = 
                        `"Narayan" detected at ${new Date().toLocaleTimeString()}`;
                    
                    // Reset recognition to prevent multiple detections
                    this.recognition.stop();
                    setTimeout(() => {
                        if (this.isListening) this.recognition.start();
                    }, 1000);
                }
            };

            this.recognition.onerror = (event) => {
                console.error('Speech recognition error:', event.error);
            };
        } else {
            document.getElementById('voice-status').textContent = 
                'Speech recognition not supported in this browser.';
            document.getElementById('toggle-mic').disabled = true;
        }
    }

    toggleListening() {
        if (!this.recognition) return;

        const micBtn = document.getElementById('toggle-mic');
        const micIcon = document.getElementById('mic-icon');

        if (this.isListening) {
            this.recognition.stop();
            micBtn.innerHTML = '<i class="fas fa-microphone"></i><span>Start Listening</span>';
            micBtn.style.background = 'linear-gradient(to right, #ff9500, #ff5e3a)';
            micIcon.classList.remove('listening');
            document.getElementById('voice-status').textContent = 'Click microphone to start listening';
        } else {
            this.recognition.start();
            micBtn.innerHTML = '<i class="fas fa-microphone-slash"></i><span>Stop Listening</span>';
            micBtn.style.background = 'linear-gradient(to right, #ff4757, #ff6b81)';
            micIcon.classList.add('listening');
            document.getElementById('voice-status').textContent = 'Listening for "Narayan"...';
        }

        this.isListening = !this.isListening;
    }

    async addCoins(coins) {
        try {
            const response = await fetch(`${this.apiBase}/add-coins`, {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                    'Authorization': `Bearer ${this.token}`
                },
                body: JSON.stringify({ coins })
            });

            const data = await response.json();
            
            if (response.ok) {
                this.updateWalletDisplay(data.wallet);
                this.showNotification(`+${coins} coin${coins > 1 ? 's' : ''} added!`, 'success');
            }
        } catch (error) {
            this.showNotification('Failed to add coins', 'error');
        }
    }

    async loadWalletData() {
        try {
            const response = await fetch(`${this.apiBase}/wallet`, {
                headers: {
                    'Authorization': `Bearer ${this.token}`
                }
            });

            if (response.ok) {
                const wallet = await response.json();
                this.updateWalletDisplay(wallet);
            }
        } catch (error) {
            console.error('Failed to load wallet:', error);
        }
    }

    async loadTransactions() {
        try {
            const response = await fetch(`${this.apiBase}/transactions`, {
                headers: {
                    'Authorization': `Bearer ${this.token}`
                }
            });

            if (response.ok) {
                const transactions = await response.json();
                this.updateTransactionsDisplay(transactions);
            }
        } catch (error) {
            console.error('Failed to load transactions:', error);
        }
    }

    updateWalletDisplay(wallet) {
        this.coins = wallet.coins || 0;
        this.balance = wallet.balance || 0;
        this.totalEarned = wallet.totalEarned || 0;

        // Update all displays
        document.getElementById('live-coins').textContent = this.coins;
        document.getElementById('wallet-balance').textContent = `${this.coins} Coins`;
        document.getElementById('total-coins').textContent = this.coins;
        document.getElementById('total-balance').textContent = `₹${this.balance.toFixed(2)}`;
        document.getElementById('total-earned').textContent = this.totalEarned;
        document.getElementById('today-coins').textContent = Math.floor(this.coins / 10); // Example calculation

        // Modal displays
        document.getElementById('modal-coins').textContent = `${this.coins} Coins`;
        document.getElementById('modal-balance').textContent = `≈ ₹${this.balance.toFixed(2)}`;
        document.getElementById('profile-total-coins').textContent = `${this.totalEarned} Coins`;
    }

    showWalletModal() {
        document.getElementById('wallet-modal').classList.remove('hidden');
        this.loadTransactions();
    }

    showProfileModal() {
        document.getElementById('profile-modal').classList.remove('hidden');
        document.getElementById('profile-name').textContent = this.user.name;
        document.getElementById('profile-email').textContent = this.user.email;
        document.getElementById('member-since').textContent = 'Today'; // Add actual date from backend
    }

    hideModals() {
        document.querySelectorAll('.modal').forEach(modal => {
            modal.classList.add('hidden');
        });
    }

    updatePaymentDetails(method) {
        const detailsDiv = document.getElementById('payment-details');
        if (method === 'upi') {
            detailsDiv.innerHTML = '<input type="text" id="upi-id" placeholder="Enter UPI ID" required>';
        } else {
            detailsDiv.innerHTML = `
                <input type="text" id="account-number" placeholder="Account Number" required>
                <input type="text" id="ifsc-code" placeholder="IFSC Code" required>
                <input type="text" id="account-name" placeholder="Account Holder Name" required>
            `;
        }
    }

    async requestWithdrawal() {
        const amount = parseFloat(document.getElementById('withdraw-amount').value);
        const method = document.querySelector('input[name="payment-method"]:checked').value;
        
        let paymentDetails = {};
        if (method === 'upi') {
            const upiId = document.getElementById('upi-id').value;
            if (!upiId) {
                this.showNotification('Please enter UPI ID', 'error');
                return;
            }
            paymentDetails.upiId = upiId;
        } else {
            const accountNumber = document.getElementById('account-number').value;
            const ifscCode = document.getElementById('ifsc-code').value;
            const accountName = document.getElementById('account-name').value;
            
            if (!accountNumber || !ifscCode || !accountName) {
                this.showNotification('Please fill all bank details', 'error');
                return;
            }
            paymentDetails.accountNumber = accountNumber;
            paymentDetails.ifscCode = ifscCode;
            paymentDetails.accountName = accountName;
        }

        if (amount < 50 || amount > 500) {
            this.showNotification('Amount must be between ₹50 and ₹500', 'error');
            return;
        }

        try {
            const response = await fetch(`${this.apiBase}/withdraw`, {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                    'Authorization': `Bearer ${this.token}`
                },
                body: JSON.stringify({
                    amount,
                    method,
                    ...paymentDetails
                })
            });

            const data = await response.json();

            if (response.ok) {
                this.showNotification('Withdrawal request submitted successfully!', 'success');
                this.updateWalletDisplay(data.wallet);
                this.hideModals();
                this.loadTransactions();
            } else {
                this.showNotification(data.error, 'error');
            }
        } catch (error) {
            this.showNotification('Failed to process withdrawal', 'error');
        }
    }

    updateTransactionsDisplay(transactions) {
        const container = document.getElementById('transactions-list');
        
        if (transactions.length === 0) {
            container.innerHTML = '<p class="empty-transactions">No transactions yet</p>';
            return;
        }

        container.innerHTML = transactions.map(transaction => `
            <div class="transaction-item">
                <div class="transaction-info">
                    <h4>Withdrawal - ${transaction.method.toUpperCase()}</h4>
                    <p>${new Date(transaction.date).toLocaleDateString()} • ${transaction.status}</p>
                </div>
                <div class="transaction-amount debit">
                    -₹${transaction.amount}
                </div>
            </div>
        `).join('');
    }

    initSocket() {
        this.socket = io('http://localhost:3000');

        this.socket.on('wallet-update', (data) => {
            if (data.userId === this.user?.id) {
                this.updateWalletDisplay(data.wallet);
            }
        });

        this.socket.on('transaction', (transaction) => {
            if (transaction.userId === this.user?.id) {
                this.showNotification('New withdrawal request processed', 'info');
                this.loadTransactions();
            }
        });
    }

    showNarayanAnimation() {
        const narayanText = document.getElementById('narayan-text');
        let count = 4;
        
        const timer = setInterval(() => {
            narayanText.textContent = count;
            count--;
            
            if (count < 0) {
                clearInterval(timer);
                narayanText.textContent = 'NARAYAN';
                narayanText.style.animation = 'glow 2s infinite alternate';
            }
        }, 1000);
    }

    showNotification(message, type = 'info') {
        const container = document.getElementById('notification-container');
        const notification = document.createElement('div');
        notification.className = `notification ${type}`;
        notification.innerHTML = `
            <i class="fas fa-${type === 'success' ? 'check-circle' : type === 'error' ? 'exclamation-circle' : 'info-circle'}"></i>
            <span>${message}</span>
        `;
        
        container.appendChild(notification);
        
        setTimeout(() => {
            notification.remove();
        }, 3000);
    }
}

// Initialize app when page loads
document.addEventListener('DOMContentLoaded', () => {
    window.app = new CounterApp();
});
