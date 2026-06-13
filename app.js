/**
 * Bokeo International Airport POS - Application Controller
 */

document.addEventListener('DOMContentLoaded', async () => {
  // Initialize Database
  try {
    await window.BokeoDB.init();
    console.log('Database initialized successfully.');
  } catch (error) {
    alert('ບໍ່ສາມາດເຊື່ອມຕໍ່ຖານຂໍ້ມູນໄດ້: ' + error);
    return;
  }

  // App State
  const state = {
    cart: [],
    cashiers: [],
    products: [],
    members: [],
    selectedMember: null,
    settings: {},
    currentCashier: null,
    currentPOS: null,
    currentCurrency: 'LAK', // Selected checkout checkout currency
    activeCategory: 'ທັງໝົດ',
    pettyCashSession: null,
    currentView: 'pos',
    pinTargetAction: null, // Callback to run on PIN success
    shiftStartTime: null,
    lastTransaction: null,
  };

  // DOM Elements Cache
  const els = {
    setupOverlay: document.getElementById('setup-overlay'),
    setupPOS: document.getElementById('setup-pos'),
    setupCashier: document.getElementById('setup-cashier'),
    setupPettyLak: document.getElementById('setup-petty-lak'),
    setupPettyThb: document.getElementById('setup-petty-thb'),
    setupPettyCny: document.getElementById('setup-petty-cny'),
    setupPettyGroup: document.getElementById('setup-petty-group'),
    setupBtn: document.getElementById('setup-btn'),

    headerPOSName: document.getElementById('header-pos-name'),
    headerCashierName: document.getElementById('header-cashier-name'),
    headerRefreshBtn: document.getElementById('header-refresh-btn'),
    headerCloseCounterBtn: document.getElementById('header-close-counter-btn'),

    navItems: document.querySelectorAll('.nav-item'),
    viewPanels: document.querySelectorAll('.view-panel'),

    categoryNav: document.getElementById('category-nav'),
    catalogSearch: document.getElementById('catalog-search'),
    productGrid: document.getElementById('product-grid'),
    cartItems: document.getElementById('cart-items'),
    clearCartBtn: document.getElementById('clear-cart-btn'),

    currencyOpts: document.querySelectorAll('.currency-opt'),
    cartSubtotal: document.getElementById('cart-subtotal'),
    cartTotal: document.getElementById('cart-total'),
    equivLak: document.getElementById('equiv-lak'),
    equivThb: document.getElementById('equiv-thb'),
    equivCny: document.getElementById('equiv-cny'),
    checkoutBtn: document.getElementById('checkout-btn'),

    // Receipt Preview Modal
    receiptModal: document.getElementById('receipt-modal'),
    receiptPreviewContent: document.getElementById('receipt-preview-content'),
    receiptPrintBtn: document.getElementById('receipt-print-btn'),
    receiptDownloadBtn: document.getElementById('receipt-download-btn'),
    receiptDoneBtn: document.getElementById('receipt-done-btn'),

    // Checkout Modal
    checkoutModal: document.getElementById('checkout-modal'),
    modalCloseBtn: document.querySelector('.close-modal-btn'),
    checkoutTotalDisplay: document.getElementById('checkout-total-display'),
    paymentMethodOpts: document.querySelectorAll('.method-card'),
    cashPaymentSection: document.getElementById('cash-payment-section'),
    transferPaymentSection: document.getElementById('transfer-payment-section'),
    amountPaidInput: document.getElementById('amount-paid'),
    changeDueDisplay: document.getElementById('change-due'),
    bankSelect: document.getElementById('bank-select'),
    qrContainer: document.getElementById('qr-container'),
    qrCodeImg: document.getElementById('qr-code-img'),
    qrText: document.getElementById('qr-text'),
    confirmPaymentBtn: document.getElementById('confirm-payment-btn'),

    // PIN Modal
    pinModal: document.getElementById('pin-modal'),
    pinDots: document.querySelectorAll('.pin-dot'),
    pinKeys: document.querySelectorAll('.pin-key'),

    // Dashboard View
    dashPOSFilter: document.getElementById('dash-pos-filter'),
    startDateFilter: document.getElementById('dash-start-date'),
    endDateFilter: document.getElementById('dash-end-date'),
    dashStatsContainer: document.getElementById('dash-stats'),
    dashTableBody: document.getElementById('dash-table-body'),
    btnExportLaoPDF: document.getElementById('btn-export-lao-pdf'),
    btnExportCnyPDF: document.getElementById('btn-export-cny-pdf'),

    // Stock View
    stockSearch: document.getElementById('stock-search'),
    stockTableBody: document.getElementById('stock-table-body'),
    restockModal: document.getElementById('restock-modal'),
    restockProductSelect: document.getElementById('restock-product-select'),
    restockQtyInput: document.getElementById('restock-qty'),
    confirmRestockBtn: document.getElementById('confirm-restock-btn'),

    // Settings View
    settingsRatesThbLak: document.getElementById('settings-rate-thb-lak'),
    settingsRatesThbCny: document.getElementById('settings-rate-thb-cny'),
    settingsAdminPin: document.getElementById('settings-admin-pin'),
    settingsFirebaseConfig: document.getElementById('settings-firebase-config'),
    settingsCashiersList: document.getElementById('settings-cashiers-list'),
    newCashierNameInput: document.getElementById('new-cashier-name'),
    btnAddCashier: document.getElementById('btn-add-cashier'),
    settingsPOSList: document.getElementById('settings-pos-list'),
    newPOSNameInput: document.getElementById('new-pos-name'),
    newPOSServiceInput: document.getElementById('new-pos-service'),
    btnAddPOS: document.getElementById('btn-add-pos'),
    settingsSaveBtn: document.getElementById('settings-save-btn'),

    // Printer Hidden Box
    billPrintBox: document.getElementById('bill-print-box'),

    // Google Drive script URL in Settings
    settingsGDriveScriptUrl: document.getElementById('settings-gdrive-script-url'),
    settingsGDriveFolderId: document.getElementById('settings-gdrive-folder-id'),
    settingsReceiptAddress: document.getElementById('settings-receipt-address'),
    settingsReceiptPhone: document.getElementById('settings-receipt-phone'),
    settingsReceiptFooterLao: document.getElementById('settings-receipt-footer-lao'),
    settingsReceiptFooterEng: document.getElementById('settings-receipt-footer-eng'),
    settingsReceiptSloganLao: document.getElementById('settings-receipt-slogan-lao'),
    settingsReceiptSloganEng: document.getElementById('settings-receipt-slogan-eng'),

    // Close Counter Modal bindings
    closeCounterModal: document.getElementById('close-counter-modal'),
    shiftReportCashier: document.getElementById('shift-report-cashier'),
    shiftReportPOS: document.getElementById('shift-report-pos'),
    shiftReportDate: document.getElementById('shift-report-date'),
    shiftStartLak: document.getElementById('shift-start-lak'),
    shiftStartThb: document.getElementById('shift-start-thb'),
    shiftStartCny: document.getElementById('shift-start-cny'),
    shiftSalesCashLak: document.getElementById('shift-sales-cash-lak'),
    shiftSalesCashThb: document.getElementById('shift-sales-cash-thb'),
    shiftSalesCashCny: document.getElementById('shift-sales-cash-cny'),
    shiftSalesTransLak: document.getElementById('shift-sales-trans-lak'),
    shiftSalesTransThb: document.getElementById('shift-sales-trans-thb'),
    shiftSalesTransCny: document.getElementById('shift-sales-trans-cny'),
    shiftEndLak: document.getElementById('shift-end-lak'),
    shiftEndThb: document.getElementById('shift-end-thb'),
    shiftEndCny: document.getElementById('shift-end-cny'),
    btnPrintShiftReport: document.getElementById('btn-print-shift-report'),
    confirmCloseShiftBtn: document.getElementById('confirm-close-shift-btn'),

    // Membership DOM Elements
    cartMemberSection: document.getElementById('cart-member-section'),
    memberSearchContainer: document.getElementById('member-search-container'),
    cartMemberSearch: document.getElementById('cart-member-search'),
    memberSearchResults: document.getElementById('member-search-results'),
    btnOpenRegisterModal: document.getElementById('btn-open-register-modal'),
    selectedMemberCard: document.getElementById('selected-member-card'),
    selectedMemberName: document.getElementById('selected-member-name'),
    selectedMemberId: document.getElementById('selected-member-id'),
    btnClearMember: document.getElementById('btn-clear-member'),
    selectedMemberPoints: document.getElementById('selected-member-points'),
    selectedMemberEarned: document.getElementById('selected-member-earned'),
    registerMemberModal: document.getElementById('register-member-modal'),
    regMemberName: document.getElementById('reg-member-name'),
    regMemberSurname: document.getElementById('reg-member-surname'),
    regMemberPhone: document.getElementById('reg-member-phone'),
    regMemberEmail: document.getElementById('reg-member-email'),
    confirmRegisterMemberBtn: document.getElementById('confirm-register-member-btn'),
    registerCloseBtn: document.getElementById('register-close-btn'),
    settingsMemberThreshold: document.getElementById('settings-member-threshold'),
    settingsMemberBelow: document.getElementById('settings-member-below'),
    settingsMemberAbove: document.getElementById('settings-member-above'),
    btnSyncMembersSettings: document.getElementById('btn-sync-members-settings'),
    settingsMemberSearch: document.getElementById('settings-member-search'),
    settingsMembersTableBody: document.getElementById('settings-members-table-body')
  };


  /* =========================================================================
     APP SETUP / INITIALIZATION
     ========================================================================= */

  async function loadInitialData() {
    state.settings = await window.BokeoDB.getSettings();
    
    // Ensure settings and pos_points are fully initialized
    if (!state.settings) {
      state.settings = {
        id: 'global',
        exchange_rate_lak: 700,
        exchange_rate_cny: 0.2,
        admin_pin: '1234',
        gdrive_script_url: '',
        gdrive_folder_id: '1ao3TJesHPrdVCflFPnU6ndcGKAyVPXyC',
        pos_points: [
          { name: 'ຫ້ອງຂາຍເຄື່ອງ (Consumer Shop)', serviceType: 'ຮ້ານຂາຍເຄື່ອງບໍລິໂພກ' },
          { name: 'ຫ້ອງ VIP (VIP Lounge)', serviceType: 'ຫ້ອງ VIP' },
          { name: 'ບໍລິການຫຸ້ມຫໍ່ເຄື່ອງ (Wrapping Counter)', serviceType: 'ບໍລິການຫຸ້ມຫໍ່ເຄື່ອງ' },
          { name: 'ເຄົາເຕີ້ແທັກຊີ່ (Taxi Counter)', serviceType: 'ບໍລິການແທັກຊີ່' },
          { name: 'ລານຈອດລົດ (Parking Lot)', serviceType: 'ບໍລິການລານຈອດ' },
          { name: 'ແອດມິນ ພະແນກ ບັນຊີ-ການເງິນ', serviceType: 'ຮ້ານຂາຍເຄື່ອງບໍລິໂພກ' },
          { name: 'ແອດມິນ ພະແນກ ຈັດຊື້-ຊັບສິນ', serviceType: 'ຮ້ານຂາຍເຄື່ອງບໍລິໂພກ' },
          { name: 'ແອດມິນ ພະແນກ ອາຄານແລະລານຈອດ', serviceType: 'ບໍລິການລານຈອດ' }
        ],
        firebase_config: null,
        qr_codes: {
          bcel_lak: '',
          bcel_thb: '',
          bcel_cny: '',
          ldb_lak: '',
          ldb_thb: '',
          ldb_cny: ''
        }
      };
      await window.BokeoDB.saveSettings(state.settings);
    } else {
      let settingsUpdated = false;
      if (!state.settings.pos_points || !Array.isArray(state.settings.pos_points)) {
        state.settings.pos_points = [];
      }
      
      const oldIndex = state.settings.pos_points.findIndex(p => p.name === 'ຈຸດຂາຍ ລານຈອດລົດ (Parking Lot)');
      if (oldIndex !== -1) {
        state.settings.pos_points.splice(oldIndex, 1);
        settingsUpdated = true;
      }
      
      const defaultPOSPoints = [
        { name: 'ຫ້ອງຂາຍເຄື່ອງ (Consumer Shop)', serviceType: 'ຮ້ານຂາຍເຄື່ອງບໍລິໂພກ' },
        { name: 'ຫ້ອງ VIP (VIP Lounge)', serviceType: 'ຫ້ອງ VIP' },
        { name: 'ບໍລິການຫຸ້ມຫໍ່ເຄື່ອງ (Wrapping Counter)', serviceType: 'ບໍລິການຫຸ້ມຫໍ່ເຄື່ອງ' },
        { name: 'ເຄົາເຕີ້ແທັກຊີ່ (Taxi Counter)', serviceType: 'ບໍລິການແທັກຊີ່' },
        { name: 'ລານຈອດລົດ (Parking Lot)', serviceType: 'ບໍລິການລານຈອດ' },
        { name: 'ແອດມິນ ພະແນກ ບັນຊີ-ການເງິນ', serviceType: 'ຮ້ານຂາຍເຄື່ອງບໍລິໂພກ' },
        { name: 'ແອດມິນ ພະແນກ ຈັດຊື້-ຊັບສິນ', serviceType: 'ຮ້ານຂາຍເຄື່ອງບໍລິໂພກ' },
        { name: 'ແອດມິນ ພະແນກ ອາຄານແລະລານຈອດ', serviceType: 'ບໍລິການລານຈອດ' }
      ];

      defaultPOSPoints.forEach(p => {
        const exists = state.settings.pos_points.some(existing => existing.name === p.name);
        if (!exists) {
          state.settings.pos_points.push(p);
          settingsUpdated = true;
        }
      });
      if (!state.settings.hasOwnProperty('gdrive_folder_id')) {
        state.settings.gdrive_folder_id = '1ao3TJesHPrdVCflFPnU6ndcGKAyVPXyC';
        settingsUpdated = true;
      }
      if (!state.settings.hasOwnProperty('receipt_address')) {
        state.settings.receipt_address = 'ຈຸດບໍລິການ POS, ສະໜາມບິນສາກົນບໍ່ແກ້ວ';
        settingsUpdated = true;
      }
      if (!state.settings.hasOwnProperty('receipt_phone')) {
        state.settings.receipt_phone = '020 9999-8888';
        settingsUpdated = true;
      }
      if (!state.settings.hasOwnProperty('receipt_footer_lao')) {
        state.settings.receipt_footer_lao = 'ຂໍຂອບໃຈ ແລະ ຍິນດີຕ້ອນຮັບອີກຄັ້ງ';
        settingsUpdated = true;
      }
      if (!state.settings.hasOwnProperty('receipt_footer_eng')) {
        state.settings.receipt_footer_eng = 'Thank you, Please visit again!';
        settingsUpdated = true;
      }
      if (!state.settings.hasOwnProperty('receipt_slogan_lao')) {
        state.settings.receipt_slogan_lao = 'ບໍລິການດ້ວຍໃຈ ຫ່ວງໃຍທຸກການເດີນທາງ';
        settingsUpdated = true;
      }
      if (!state.settings.hasOwnProperty('receipt_slogan_eng')) {
        state.settings.receipt_slogan_eng = 'Service with heart, caring for every journey';
        settingsUpdated = true;
      }
      if (settingsUpdated) {
        await window.BokeoDB.saveSettings(state.settings);
      }
    }

    state.cashiers = await window.BokeoDB.getCashiers();
    state.products = await window.BokeoDB.getProducts();
    state.members = await window.BokeoDB.getMembers();

    // Populate Cashier and POS dropdowns in Setup Overlay first so they are visible while syncing
    populateSetupOptions();

    // Show loading status and disable "Start POS" button during startup sync
    let infoDiv = document.getElementById('setup-petty-info');
    if (!infoDiv) {
      infoDiv = document.createElement('div');
      infoDiv.id = 'setup-petty-info';
      infoDiv.style.fontSize = '0.82rem';
      infoDiv.style.marginTop = '8px';
      infoDiv.style.color = '#025c8a'; // Darker blue for readability
      infoDiv.style.fontWeight = '700';
      infoDiv.style.padding = '8px 12px';
      infoDiv.style.backgroundColor = '#f0f9ff';
      infoDiv.style.border = '1px solid #bae6fd';
      infoDiv.style.borderRadius = '8px';
      
      const pettyGroup = els.setupPettyLak.closest('.form-group');
      if (pettyGroup) {
        pettyGroup.appendChild(infoDiv);
      }
    }
    infoDiv.innerHTML = `<i class="fas fa-spinner fa-spin"></i> ກຳລັງດຶງຂໍ້ມູນເງິນທອນຫຼ້າສຸດຈາກ Google Sheets, ກະລຸນາລໍຖ້າ...`;
    
    if (els.setupBtn) {
      els.setupBtn.disabled = true;
      els.setupBtn.innerHTML = `<i class="fas fa-spinner fa-spin"></i> ກຳລັງອັບເດດຂໍ້ມູນ... ກະລຸນາລໍຖ້າ`;
      els.setupBtn.style.backgroundColor = '#9ca3af'; // Gray disabled style
    }

    // Sync from Google Sheets on startup to get the latest prices, stock, and petty cash sessions
    try {
      await window.BokeoDB.syncWithGoogleSheets();
      // Reload products and cashiers after sync
      state.products = await window.BokeoDB.getProducts();
      state.cashiers = await window.BokeoDB.getCashiers();
      // Repopulate options with the freshly synced cashier list
      populateSetupOptions();
    } catch (e) {
      console.warn('Startup sync failed, using local database:', e);
    } finally {
      // Re-enable "Start POS" button
      if (els.setupBtn) {
        els.setupBtn.disabled = false;
        els.setupBtn.innerHTML = `<i class="fas fa-check-circle"></i> ເຂົ້າສູ່ລະບົບ (Start POS)`;
        els.setupBtn.style.backgroundColor = ''; // Restore original style
      }
      await updateSetupStartingCash();
    }

    els.setupPOS.addEventListener('change', updateSetupStartingCash);
    checkLowStockAlerts();

    // Listen to Products changes and reload UI
    window.BokeoDB.on('products', async () => {
      state.products = await window.BokeoDB.getProducts();
      if (state.currentView === 'pos') renderProducts();
      else if (state.currentView === 'stock') renderStockTable();
      checkLowStockAlerts();
    });

    // Listen to Members changes and reload UI
    window.BokeoDB.on('members', async () => {
      state.members = await window.BokeoDB.getMembers();
      if (state.currentView === 'settings') {
        renderSettingsMembersTable();
      }
    });

    // Initial Google Sheets Auto-Sync on startup
    window.BokeoDB.syncWithGoogleSheets().then(async () => {
      state.products = await window.BokeoDB.getProducts();
      if (state.currentView === 'pos') renderProducts();
      checkLowStockAlerts();
    });

    // Auto-polling Google Sheets every 30 seconds for real-time catalog & stock updates
    setInterval(async () => {
      console.log('Polling Google Sheets for updates...');
      await window.BokeoDB.syncWithGoogleSheets();
    }, 30000);

    // Setup format-as-you-type input formatters
    setupFormattedInputListener(els.setupPettyLak);
    setupFormattedInputListener(els.setupPettyThb);
    setupFormattedInputListener(els.setupPettyCny);
    setupFormattedInputListener(els.amountPaidInput);

    // Bind catalog search input and key events
    if (els.catalogSearch) {
      els.catalogSearch.addEventListener('input', () => {
        renderProducts();
      });
      els.catalogSearch.addEventListener('keydown', (e) => {
        if (e.key === 'Enter') {
          const searchQuery = els.catalogSearch.value.trim().toLowerCase();
          if (searchQuery) {
            const serviceType = state.currentPOS.serviceType;
            let filtered = state.products.filter(p => p.category === serviceType);
            if (state.activeCategory !== 'ທັງໝົດ') {
              filtered = filtered.filter(p => (p.unit || 'ສິນຄ້າ') === state.activeCategory);
            }
            filtered = filtered.filter(p => {
              const nameLo = (p.name_lo || '').toLowerCase();
              const nameEn = (p.name_en || '').toLowerCase();
              const code = (p.code || '').toLowerCase();
              return nameLo.includes(searchQuery) || nameEn.includes(searchQuery) || code.includes(searchQuery);
            });

            if (filtered.length === 1 && filtered[0].stock !== 0) {
              addToCart(filtered[0]);
              els.catalogSearch.value = '';
              renderProducts();
              e.preventDefault();
            }
          }
        }
      });
    }

    // Bind modal currency toggle click events
    const modalOpts = document.querySelectorAll('#checkout-modal .currency-opt');
    modalOpts.forEach(btn => {
      btn.addEventListener('click', (e) => {
        const curr = e.currentTarget.getAttribute('data-curr');
        setCurrency(curr);
      });
    });

    // Bind Discount and VAT input change events
    const discountInput = document.getElementById('checkout-discount-input');
    const vatInput = document.getElementById('checkout-vat-input');
    if (discountInput) {
      discountInput.addEventListener('input', () => {
        let val = parseFloat(discountInput.value);
        if (val < 0) discountInput.value = '0';
        if (val > 100) discountInput.value = '100';
        recalculateCheckoutTotals();
      });
    }
    if (vatInput) {
      vatInput.addEventListener('input', () => {
        let val = parseFloat(vatInput.value);
        if (val < 0) vatInput.value = '0';
        if (val > 100) vatInput.value = '100';
        recalculateCheckoutTotals();
      });
    }

    // Receipt Modal controls
    if (els.receiptPrintBtn) {
      els.receiptPrintBtn.addEventListener('click', () => {
        if (state.lastTransaction) {
          handlePDFAndPrintInvoice(state.lastTransaction);
        }
      });
    }

    if (els.receiptDownloadBtn) {
      els.receiptDownloadBtn.addEventListener('click', () => {
        if (state.lastTransaction) {
          downloadReceiptPDF(state.lastTransaction);
        }
      });
    }

    const closeReceiptModal = async () => {
      els.receiptModal.classList.remove('active');
      state.lastTransaction = null;
      renderProducts();
      
      // Real-time Petty Cash Sync to Google Sheets
      if (state.pettyCashSession) {
        await syncPettyCashToGoogleSheets(state.pettyCashSession);
      }
    };

    if (els.receiptDoneBtn) {
      els.receiptDoneBtn.addEventListener('click', closeReceiptModal);
    }

    const receiptCloseBtn = els.receiptModal.querySelector('.close-modal-btn');
    if (receiptCloseBtn) {
      receiptCloseBtn.addEventListener('click', closeReceiptModal);
    }
  }

  async function updateSetupStartingCash() {
    if (!els.setupPOS.value) return;
    try {
      const posObj = JSON.parse(els.setupPOS.value);
      const isAdminPOS = posObj && [
        'ແອດມິນ ພະແນກ ອາຄານແລະລານຈອດ',
        'ແອດມິນ ພະແນກ ບັນຊີ-ການເງິນ',
        'ແອດມິນ ພະແນກ ຈັດຊື້-ຊັບສິນ'
      ].includes(posObj.name);

      if (isAdminPOS) {
        if (els.setupPettyGroup) els.setupPettyGroup.style.display = 'none';
        els.setupPettyLak.value = '0';
        els.setupPettyThb.value = '0';
        els.setupPettyCny.value = '0';
        
        let infoDiv = document.getElementById('setup-petty-info');
        if (infoDiv) infoDiv.style.display = 'none';
        
        if (els.setupBtn) {
          els.setupBtn.innerHTML = `<i class="fas fa-user-shield"></i> ເຂົ້າສູ່ລະບົບແອດມິນ (Enter Admin)`;
        }
        return;
      }

      // Restore elements for cashier
      if (els.setupPettyGroup) els.setupPettyGroup.style.display = '';
      if (els.setupBtn) {
        els.setupBtn.innerHTML = `<i class="fas fa-check-circle"></i> ເຂົ້າສູ່ລະບົບ (Start POS)`;
      }

      const todayStr = new Date().toISOString().split('T')[0];
      const allPetty = await window.BokeoDB.getPettyCashSessions();
      
      // Filter sessions for this POS on the same calendar date safely
      const todaySessions = allPetty.filter(p => isSameDay(p.date, todayStr) && p.pos === posObj.name);
      
      // Find or create info element to show the tip
      let infoDiv = document.getElementById('setup-petty-info');
      if (!infoDiv) {
        infoDiv = document.createElement('div');
        infoDiv.id = 'setup-petty-info';
        infoDiv.style.fontSize = '0.82rem';
        infoDiv.style.marginTop = '8px';
        infoDiv.style.color = '#0f766e';
        infoDiv.style.fontWeight = '700';
        infoDiv.style.padding = '8px 12px';
        infoDiv.style.backgroundColor = '#f0fdf4';
        infoDiv.style.border = '1px solid #bbf7d0';
        infoDiv.style.borderRadius = '8px';
        
        const pettyGroup = els.setupPettyLak.closest('.form-group');
        if (pettyGroup) {
          pettyGroup.appendChild(infoDiv);
        }
      }
      infoDiv.style.display = ''; // Ensure it's shown for cashiers
      
      if (todaySessions.length > 0) {
        // Last session's remaining cash becomes starting cash
        const lastSession = todaySessions[todaySessions.length - 1];
        els.setupPettyLak.value = formatNumber(lastSession.lak_remaining);
        els.setupPettyThb.value = formatNumber(lastSession.thb_remaining);
        els.setupPettyCny.value = formatNumber(lastSession.cny_remaining);
        
        // Disable editing for subsequent shifts of the day
        els.setupPettyLak.readOnly = true;
        els.setupPettyThb.readOnly = true;
        els.setupPettyCny.readOnly = true;
        els.setupPettyLak.style.backgroundColor = '#f3f4f6';
        els.setupPettyThb.style.backgroundColor = '#f3f4f6';
        els.setupPettyCny.style.backgroundColor = '#f3f4f6';
        
        infoDiv.innerHTML = `<i class="fas fa-info-circle"></i> ເງິນທອນຄົງເຫຼືອຫຼ້າສຸດຂອງມື້ນີ້ (ບໍ່ສາມາດແກ້ໄຂໄດ້): <br> LAK: <span style="color:#0f766e">${formatNumber(lastSession.lak_remaining)} ₭</span> | THB: <span style="color:#0f766e">${formatNumber(lastSession.thb_remaining)} ฿</span> | CNY: <span style="color:#0f766e">${formatNumber(lastSession.cny_remaining)} ¥</span>`;
      } else {
        // First cashier of the day: reset to 0 and allow editing
        els.setupPettyLak.value = '0';
        els.setupPettyThb.value = '0';
        els.setupPettyCny.value = '0';
        
        els.setupPettyLak.readOnly = false;
        els.setupPettyThb.readOnly = false;
        els.setupPettyCny.readOnly = false;
        els.setupPettyLak.style.backgroundColor = '';
        els.setupPettyThb.style.backgroundColor = '';
        els.setupPettyCny.style.backgroundColor = '';
        
        infoDiv.innerHTML = `<i class="fas fa-info-circle"></i> ເປີດກະທຳອິດຂອງມື້ນີ້ (ເລີ່ມຕົ້ນສະຕັອກເງິນທອນໃໝ່)`;
      }
    } catch (e) {
      console.error('Error updating setup starting cash:', e);
    }
  }

  function populateSetupOptions() {
    // Cashiers Datalist
    const datalist = document.getElementById('cashier-list');
    if (datalist) {
      datalist.innerHTML = '';
      state.cashiers.forEach(c => {
        const opt = document.createElement('option');
        opt.value = c.name;
        datalist.appendChild(opt);
      });
    }

    // POS Points
    els.setupPOS.innerHTML = '';
    state.settings.pos_points.forEach(p => {
      const opt = document.createElement('option');
      opt.value = JSON.stringify(p);
      const trimmedName = p.name.trim();
      const isAdmin = trimmedName.startsWith('ແອດມິນ') || 
                      trimmedName.startsWith('ແອັດມິນ') || 
                      trimmedName.includes('ແອດມິນ') || 
                      trimmedName.includes('ແອັດມິນ') || 
                      trimmedName.includes('Admin') || 
                      trimmedName.includes('admin');
      if (isAdmin) {
        opt.textContent = p.name;
      } else {
        opt.textContent = `${p.name} (${p.serviceType})`;
      }
      els.setupPOS.appendChild(opt);
    });
  }

  // Handle POS Setup Submission
  els.setupBtn.addEventListener('click', async () => {
    const cashierName = els.setupCashier.value.trim();
    if (!cashierName) {
      alert('ກະລຸນາປ້ອນ ຫຼື ເລືອກ ພະນັກງານຂາຍ');
      return;
    }

    const posObj = JSON.parse(els.setupPOS.value);
    const pettyLak = getCleanFloat(els.setupPettyLak.value) || 0;
    const pettyThb = getCleanFloat(els.setupPettyThb.value) || 0;
    const pettyCny = getCleanFloat(els.setupPettyCny.value) || 0;

    if (!posObj) {
      alert('ກະລຸນາເລືອກ ຈຸດຂາຍ');
      return;
    }

    const isAdminPOS = [
      'ແອດມິນ ພະແນກ ອາຄານແລະລານຈອດ',
      'ແອດມິນ ພະແນກ ບັນຊີ-ການເງິນ',
      'ແອດມິນ ພະແນກ ຈັດຊື້-ຊັບສິນ'
    ].includes(posObj.name);

    // Save Cashier if new
    const cashierExists = state.cashiers.some(c => c.name.toLowerCase() === cashierName.toLowerCase());
    if (!cashierExists) {
      const newCashier = { id: 'cashier_' + Date.now(), name: cashierName };
      await window.BokeoDB.saveCashier(newCashier);
      state.cashiers.push(newCashier);
      renderSettingsCashiers();
      populateSetupOptions();
    }

    state.currentCashier = cashierName;
    state.currentPOS = posObj;
    state.shiftStartTime = new Date();

    // Load or create petty cash session for today
    const todayStr = new Date().toISOString().split('T')[0];
    const sessionId = `${todayStr}_${posObj.name.replace(/\s+/g, '_')}_${cashierName.replace(/\s+/g, '_')}_${Date.now()}`;

    let session = await window.BokeoDB.getPettyCashSession(sessionId);
    if (!session) {
      session = {
        id: sessionId,
        date: todayStr,
        pos: posObj.name,
        cashier: cashierName,
        lak_start: pettyLak,
        thb_start: pettyThb,
        cny_start: pettyCny,
        lak_remaining: pettyLak,
        thb_remaining: pettyThb,
        cny_remaining: pettyCny,
        closed: isAdminPOS ? true : false
      };
      await window.BokeoDB.savePettyCashSession(session);
    }
    state.pettyCashSession = session;

    // Update Header UI
    els.headerPOSName.innerHTML = `<i class="fas fa-terminal"></i> ${posObj.name}`;
    els.headerCashierName.innerHTML = `<i class="fas fa-user-tie"></i> ${cashierName}`;

    // Close setup screen
    els.setupOverlay.style.display = 'none';

    // Apply role UI adjustments
    applyRoleUI();

    // Redirect to view
    if (isAdminPOS) {
      switchView('dashboard');
    } else {
      switchView('pos');
    }

    // Load view
    renderProducts();
    updateCartUI();
  });

  // Refresh Button click handler
  els.headerRefreshBtn.addEventListener('click', async () => {
    // Add rotating animation
    const icon = els.headerRefreshBtn.querySelector('i');
    icon.classList.add('fa-spin');
    
    const success = await window.BokeoDB.syncWithGoogleSheets();
    
    // Stop spin
    setTimeout(() => {
      icon.classList.remove('fa-spin');
      if (success) {
        alert('ອັບເດດຂໍ້ມູນສິນຄ້າ ແລະ ສະຕັອກຈາກ Google Sheet ສຳເລັດ!');
      } else {
        alert('ບໍ່ສາມາດອັບເດດຂໍ້ມູນໄດ້, ກະລຸນາກວດສອບການເຊື່ອມຕໍ່ອິນເຕີເນັດ');
      }
    }, 800);
  });

  // Close Counter Button click handler
  els.headerCloseCounterBtn.addEventListener('click', async () => {
    if (!state.currentPOS || !state.currentCashier) return;

    const isAdminPOS = [
      'ແອດມິນ ພະແນກ ອາຄານແລະລານຈອດ',
      'ແອດມິນ ພະແນກ ບັນຊີ-ການເງິນ',
      'ແອດມິນ ພະແນກ ຈັດຊື້-ຊັບສິນ'
    ].includes(state.currentPOS.name);

    if (isAdminPOS) {
      const confirmLogout = confirm('ທ່ານຕ້ອງການອອກຈາກລະບົບແທ້ຫຼືບໍ່?');
      if (confirmLogout) {
        state.currentCashier = null;
        state.currentPOS = null;
        state.pettyCashSession = null;
        state.shiftStartTime = null;
        state.cart = [];

        els.setupCashier.value = '';
        els.setupOverlay.style.display = 'flex';
        await updateSetupStartingCash();
        updateCartUI();
      }
      return;
    }

    // Open Close Shift summary modal
    const todayStr = new Date().toISOString().split('T')[0];
    const allTx = await window.BokeoDB.getTransactions();
    
    // Filter transactions made today at this POS (accumulated sales on the same day)
    const shiftTx = allTx.filter(tx => {
      const isThisPOS = tx.pos === state.currentPOS.name;
      const txDate = tx.timestamp.split('T')[0];
      return isThisPOS && isSameDay(txDate, todayStr);
    });

    // Sum up shift sales
    let cashLAK = 0, cashTHB = 0, cashCNY = 0;
    let transLAK = 0, transTHB = 0, transCNY = 0;

    shiftTx.forEach(tx => {
      if (tx.payment_type === 'ເງິນສົດ') {
        cashLAK += tx.total_lak;
        cashTHB += tx.total_thb;
        cashCNY += tx.total_cny;
      } else {
        transLAK += tx.total_lak;
        transTHB += tx.total_thb;
        transCNY += tx.total_cny;
      }
    });

    // Populate UI Fields
    els.shiftReportCashier.textContent = state.currentCashier;
    els.shiftReportPOS.textContent = state.currentPOS.name;
    els.shiftReportDate.textContent = new Date().toLocaleString('lo-LA');

    // Find starting petty cash of the first session of today safely
    const allPetty = await window.BokeoDB.getPettyCashSessions();
    const posSessions = allPetty.filter(p => isSameDay(p.date, todayStr) && p.pos === state.currentPOS.name);
    const firstSession = posSessions[0] || state.pettyCashSession;

    // Starting Petty cash
    els.shiftStartLak.textContent = formatNumber(firstSession.lak_start) + ' ₭';
    els.shiftStartThb.textContent = formatNumber(firstSession.thb_start) + ' ฿';
    els.shiftStartCny.textContent = formatNumber(firstSession.cny_start) + ' ¥';

    // Cash sales
    els.shiftSalesCashLak.textContent = formatNumber(cashLAK) + ' ₭';
    els.shiftSalesCashThb.textContent = formatNumber(cashTHB) + ' ฿';
    els.shiftSalesCashCny.textContent = formatNumber(cashCNY) + ' ¥';

    // Transfer sales
    els.shiftSalesTransLak.textContent = formatNumber(transLAK) + ' ₭';
    els.shiftSalesTransThb.textContent = formatNumber(transTHB) + ' ฿';
    els.shiftSalesTransCny.textContent = formatNumber(transCNY) + ' ¥';

    // Remaining Drawer Cash (Starting Petty Cash - Total Change Given)
    const endLakVal = state.pettyCashSession.lak_remaining;
    const endThbVal = state.pettyCashSession.thb_remaining;
    const endCnyVal = state.pettyCashSession.cny_remaining;

    els.shiftEndLak.textContent = formatNumber(endLakVal) + ' ₭';
    els.shiftEndThb.textContent = formatNumber(endThbVal) + ' ฿';
    els.shiftEndCny.textContent = formatNumber(endCnyVal) + ' ¥';

    els.closeCounterModal.classList.add('active');
  });

  // Close Counter Close Modal Button
  els.closeCounterModal.querySelector('.close-modal-btn').addEventListener('click', () => {
    els.closeCounterModal.classList.remove('active');
  });

  // Print Shift Report PDF
  els.btnPrintShiftReport.addEventListener('click', async () => {
    if (typeof html2pdf !== 'undefined') {
      const element = els.closeCounterModal.querySelector('.payment-summary-box').cloneNode(true);
      element.style.padding = '20px';
      element.style.background = '#fff';
      element.style.color = '#000';
      element.style.fontFamily = 'var(--font-family)';

      // Title header
      const header = document.createElement('div');
      header.style.textAlign = 'center';
      header.style.marginBottom = '20px';
      header.innerHTML = `
        <h2 style="font-size:1.4rem;">ໃບບັນທຶກປິດເຄົາເຕີ້ (Shift Report)</h2>
        <h4 style="font-weight:500; color:#444;">Bokeo International Airport</h4>
      `;
      element.insertBefore(header, element.firstChild);

      const options = {
        margin: 5,
        filename: `Shift_Report_${state.currentCashier}_${new Date().toISOString().split('T')[0]}.pdf`,
        image: { type: 'jpeg', quality: 0.98 },
        html2canvas: { scale: 2 },
        jsPDF: { unit: 'mm', format: [100, 180], orientation: 'portrait' }
      };

      await html2pdf().set(options).from(element).save();
    }
  });

  // Confirm Close Shift & Return to Setup
  els.confirmCloseShiftBtn.addEventListener('click', async () => {
    const confirmClose = confirm('ທ່ານຕ້ອງການປິດກະ ແລະ ອອກຈາກລະບົບແທ້ຫຼືບໍ່?');
    if (confirmClose) {
      // Mark petty cash session as closed
      state.pettyCashSession.closed = true;
      await window.BokeoDB.savePettyCashSession(state.pettyCashSession);

      // Sync daily petty cash drawer balance to Google Sheet
      syncPettyCashToGoogleSheets(state.pettyCashSession);

      // Clear state
      state.currentCashier = null;
      state.currentPOS = null;
      state.pettyCashSession = null;
      state.shiftStartTime = null;
      state.cart = [];

      // Update UI & show overlay
      els.setupCashier.value = '';
      els.closeCounterModal.classList.remove('active');
      els.setupOverlay.style.display = 'flex';
      await updateSetupStartingCash();
      
      updateCartUI();
    }
  });

  /* =========================================================================
     VIEW ROUTING & NAVIGATION
     ========================================================================= */

  els.navItems.forEach(item => {
    item.addEventListener('click', (e) => {
      const targetView = e.currentTarget.getAttribute('data-view');
      
      // Check permission for admin areas (Stock, Settings)
      if (targetView === 'stock' || targetView === 'settings') {
        const isAdminPOS = state.currentPOS && [
          'ແອດມິນ ພະແນກ ອາຄານແລະລານຈອດ',
          'ແອດມິນ ພະແນກ ບັນຊີ-ການເງິນ',
          'ແອດມິນ ພະແນກ ຈັດຊື້-ຊັບສິນ'
        ].includes(state.currentPOS.name);

        if (isAdminPOS) {
          switchView(targetView);
        } else {
          promptPIN(() => {
            switchView(targetView);
          });
        }
      } else {
        switchView(targetView);
      }
    });
  });

  function switchView(viewName) {
    state.currentView = viewName;
    
    // Tabs Active State
    els.navItems.forEach(item => {
      if (item.getAttribute('data-view') === viewName) {
        item.classList.add('active');
      } else {
        item.classList.remove('active');
      }
    });

    // View panels toggles
    els.viewPanels.forEach(panel => {
      if (panel.id === `${viewName}-view`) {
        panel.classList.add('active');
      } else {
        panel.classList.remove('active');
      }
    });

    // Run view specific initializers
    if (viewName === 'pos') {
      renderProducts();
    } else if (viewName === 'dashboard') {
      initDashboard();
    } else if (viewName === 'stock') {
      renderStockTable();
    } else if (viewName === 'settings') {
      renderSettingsPage();
    }
  }

  function applyRoleUI() {
    if (!state.currentPOS) return;
    
    const isAdminPOS = [
      'ແອດມິນ ພະແນກ ອາຄານແລະລານຈອດ',
      'ແອດມິນ ພະແນກ ບັນຊີ-ການເງິນ',
      'ແອດມິນ ພະແນກ ຈັດຊື້-ຊັບສິນ'
    ].includes(state.currentPOS.name);

    els.navItems.forEach(item => {
      const view = item.getAttribute('data-view');
      if (isAdminPOS) {
        if (view === 'pos') {
          item.style.display = 'none';
        } else {
          item.style.display = 'flex';
        }
      } else {
        if (view === 'pos' || view === 'dashboard') {
          item.style.display = 'flex';
        } else {
          item.style.display = 'none';
        }
      }
    });

    if (els.headerCloseCounterBtn) {
      if (isAdminPOS) {
        els.headerCloseCounterBtn.innerHTML = `<i class="fas fa-sign-out-alt"></i> ອອກຈາກລະບົບ`;
        els.headerCloseCounterBtn.style.color = 'var(--text-secondary)';
        els.headerCloseCounterBtn.style.borderColor = 'var(--border-color)';
      } else {
        els.headerCloseCounterBtn.innerHTML = `<i class="fas fa-power-off"></i> ປິດເຄົາເຕີ້`;
        els.headerCloseCounterBtn.style.color = 'var(--danger-color)';
        els.headerCloseCounterBtn.style.borderColor = '#fca5a5';
      }
    }
  }

  /* =========================================================================
     PRODUCT RENDER & CATEGORY FILTERING (Lao: ໝວດໝູ່)
     ========================================================================= */

  function renderProducts() {
    if (!state.currentPOS) return;

    // Extract current POS service type
    const serviceType = state.currentPOS.serviceType;
    
    // Filter products that belong to this service type
    let filtered = state.products.filter(p => p.category === serviceType);

    // Build unique categories list from filtered products
    const subCategories = ['ທັງໝົດ', ...new Set(filtered.map(p => p.unit || 'ສິນຄ້າ'))];
    
    // Render Category Tab Nav Bar
    els.categoryNav.innerHTML = '';
    subCategories.forEach(cat => {
      const tab = document.createElement('button');
      tab.className = `category-tab ${state.activeCategory === cat ? 'active' : ''}`;
      tab.textContent = cat;
      tab.addEventListener('click', () => {
        state.activeCategory = cat;
        renderProducts();
      });
      els.categoryNav.appendChild(tab);
    });

    // Filter by selected tab
    if (state.activeCategory !== 'ທັງໝົດ') {
      filtered = filtered.filter(p => (p.unit || 'ສິນຄ້າ') === state.activeCategory);
    }

    // Filter by search query (Lao name, English name, or barcode)
    const searchQuery = els.catalogSearch ? els.catalogSearch.value.trim().toLowerCase() : '';
    if (searchQuery) {
      filtered = filtered.filter(p => {
        const nameLo = (p.name_lo || '').toLowerCase();
        const nameEn = (p.name_en || '').toLowerCase();
        const code = (p.code || '').toLowerCase();
        return nameLo.includes(searchQuery) || nameEn.includes(searchQuery) || code.includes(searchQuery);
      });
    }

    // Render Grid
    els.productGrid.innerHTML = '';
    if (filtered.length === 0) {
      els.productGrid.innerHTML = `<div style="grid-column: 1/-1; text-align: center; color: var(--text-secondary); padding: 40px;">ບໍ່ມີລາຍການສິນຄ້າໃນໝວດໝູ່ນີ້</div>`;
      return;
    }

    filtered.forEach(p => {
      const card = document.createElement('div');
      card.className = `product-card ${serviceType === 'ຫ້ອງ VIP' ? 'vip' : serviceType === 'ບໍລິການຫຸ້ມຫໍ່ເຄື່ອງ' ? 'wrapping' : serviceType === 'ບໍລິການແທັກຊີ່' ? 'taxi' : serviceType === 'ບໍລິການລານຈອດ' ? 'parking' : ''}`;
      
      // Stock Status
      let stockHtml = '';
      let isOutOfStock = false;
      if (p.category === 'ຮ້ານຂາຍເຄື່ອງບໍລິໂພກ' || p.category === 'ບໍລິການຫຸ້ມຫໍ່ເຄື່ອງ') {
        if (p.stock === 0) {
          stockHtml = `<span class="stock-badge out">ໝົດສາງ</span>`;
          isOutOfStock = true;
        } else if (p.stock <= 5) {
          stockHtml = `<span class="stock-badge low">ເຫຼືອ ${p.stock}</span>`;
        } else {
          stockHtml = `<span class="stock-badge">ເຫຼືອ ${p.stock}</span>`;
        }
      }

      // Map Category to FontAwesome Icon
      let iconClass = 'fa-shopping-basket';
      if (p.category === 'ຮ້ານຂາຍເຄື່ອງບໍລິໂພກ') iconClass = 'fa-cookie-bite';
      else if (p.category === 'ຫ້ອງ VIP') iconClass = 'fa-couch';
      else if (p.category === 'ບໍລິການຫຸ້ມຫໍ່ເຄື່ອງ') iconClass = 'fa-box-open';
      else if (p.category === 'ບໍລິການແທັກຊີ່') iconClass = 'fa-taxi';

      // Format price highlight depending on current currency selection
      let mainPriceHtml = '';
      let secondaryPriceHtml = '';

      if (state.currentCurrency === 'LAK') {
        mainPriceHtml = `<div class="main-price">${formatNumber(p.price_lak)} ₭</div>`;
        secondaryPriceHtml = `<div class="sub-prices">${formatNumber(p.price_thb)} ฿ • ${formatNumber(p.price_cny)} ¥</div>`;
      } else if (state.currentCurrency === 'THB') {
        mainPriceHtml = `<div class="main-price">${formatNumber(p.price_thb)} ฿</div>`;
        secondaryPriceHtml = `<div class="sub-prices">${formatNumber(p.price_lak)} ₭ • ${formatNumber(p.price_cny)} ¥</div>`;
      } else if (state.currentCurrency === 'CNY') {
        mainPriceHtml = `<div class="main-price">${formatNumber(p.price_cny)} ¥</div>`;
        secondaryPriceHtml = `<div class="sub-prices">${formatNumber(p.price_lak)} ₭ • ${formatNumber(p.price_thb)} ฿</div>`;
      }

      card.innerHTML = `
        <div class="img-container">
          ${stockHtml}
          ${p.image ? `<img src="${p.image}" alt="${p.name_lo}">` : `<i class="fas ${iconClass}"></i>`}
          <div class="img-upload-overlay" onclick="window.triggerImageUpload(event, '${p.id}')">
            <i class="fas fa-camera"></i>
          </div>
        </div>
        <div class="product-info">
          <span class="product-name-lo">${p.name_lo}</span>
          <span class="product-name-en">${p.name_en || ''}</span>
          <div class="product-prices">
            ${mainPriceHtml}
            ${secondaryPriceHtml}
          </div>
        </div>
      `;

      if (!isOutOfStock) {
        card.addEventListener('click', () => addToCart(p));
      } else {
        card.style.opacity = '0.5';
      }

      els.productGrid.appendChild(card);
    });
  }

  /* =========================================================================
     SHOPPING CART LOGIC & CURRENCY CONVERSION
     ========================================================================= */

  function addToCart(product) {
    const existing = state.cart.find(item => item.product.id === product.id);
    if (existing) {
      if ((product.category !== 'ຮ້ານຂາຍເຄື່ອງບໍລິໂພກ' && product.category !== 'ບໍລິການຫຸ້ມຫໍ່ເຄື່ອງ') || product.stock >= 9999 || existing.qty < product.stock) {
        existing.qty++;
      } else {
        alert('ບໍ່ສາມາດເພີ່ມໄດ້ເນື່ອງຈາກສິນຄ້າໃນສະຕັອກບໍ່ພໍ');
        return;
      }
    } else {
      state.cart.push({ product, qty: 1 });
    }
    updateCartUI();
  }

  function updateQty(productId, delta) {
    const item = state.cart.find(item => item.product.id === productId);
    if (!item) return;

    const newQty = item.qty + delta;
    if (newQty <= 0) {
      state.cart = state.cart.filter(i => i.product.id !== productId);
    } else if ((item.product.category !== 'ຮ້ານຂາຍເຄື່ອງບໍລິໂພກ' && item.product.category !== 'ບໍລິການຫຸ້ມຫໍ່ເຄື່ອງ') || item.product.stock >= 9999 || newQty <= item.product.stock) {
      item.qty = newQty;
    } else {
      alert('ບໍ່ສາມາດເພີ່ມໄດ້ເນື່ອງຈາກສິນຄ້າໃນສະຕັອກບໍ່ພໍ');
    }
    updateCartUI();
  }

  function removeFromCart(productId) {
    state.cart = state.cart.filter(item => item.product.id !== productId);
    updateCartUI();
  }

  els.clearCartBtn.addEventListener('click', () => {
    state.cart = [];
    state.selectedMember = null;
    if (els.selectedMemberCard) els.selectedMemberCard.style.display = 'none';
    if (els.memberSearchContainer) els.memberSearchContainer.style.display = 'flex';
    updateCartUI();
  });

  // Set payment currency globally (updates both sidebar and modal displays)
  function setCurrency(curr) {
    state.currentCurrency = curr;

    // Update active class on sidebar currency toggle
    els.currencyOpts.forEach(btn => {
      if (btn.getAttribute('data-curr') === curr) {
        btn.classList.add('active');
      } else {
        btn.classList.remove('active');
      }
    });

    // Update active class on modal currency toggle
    const modalOpts = document.querySelectorAll('#checkout-modal .currency-opt');
    modalOpts.forEach(btn => {
      if (btn.getAttribute('data-curr') === curr) {
        btn.classList.add('active');
      } else {
        btn.classList.remove('active');
      }
    });

    updateCartUI();
    renderProducts();

    // If checkout modal is active, update modal displays
    if (els.checkoutModal.classList.contains('active')) {
      recalculateCheckoutTotals();
    }
  }

  // Toggle Sales currency
  els.currencyOpts.forEach(btn => {
    btn.addEventListener('click', (e) => {
      const curr = e.currentTarget.getAttribute('data-curr');
      setCurrency(curr);
    });
  });

  function updateCartUI() {
    els.cartItems.innerHTML = '';
    
    if (state.cart.length === 0) {
      els.cartItems.innerHTML = `<div style="text-align: center; color: var(--text-secondary); padding: 40px 0;">ບໍ່ມີສິນຄ້າໃນກະຕ່າ</div>`;
      els.checkoutBtn.disabled = true;
      els.cartSubtotal.textContent = '0';
      els.cartTotal.textContent = '0';
      els.equivLak.textContent = '0 ₭';
      els.equivThb.textContent = '0 ฿';
      els.equivCny.textContent = '0 ¥';
      return;
    }

    els.checkoutBtn.disabled = false;

    let totalTHB = 0;
    let totalLAK = 0;
    let totalCNY = 0;

    state.cart.forEach(item => {
      const p = item.product;
      const itemRow = document.createElement('div');
      itemRow.className = 'cart-item';
      
      // Calculate totals
      totalTHB += p.price_thb * item.qty;
      totalLAK += p.price_lak * item.qty;
      totalCNY += p.price_cny * item.qty;

      // Price displayed in item row matches base currency
      let displayPrice = '';
      if (state.currentCurrency === 'LAK') displayPrice = formatNumber(p.price_lak) + ' ₭';
      else if (state.currentCurrency === 'THB') displayPrice = formatNumber(p.price_thb) + ' ฿';
      else if (state.currentCurrency === 'CNY') displayPrice = formatNumber(p.price_cny) + ' ¥';

      itemRow.innerHTML = `
        <div class="cart-item-details">
          <div class="cart-item-name">${p.name_lo}</div>
          <div class="cart-item-price">${displayPrice} x ${item.qty}</div>
        </div>
        <div class="cart-item-actions">
          <div class="qty-controls">
            <button class="qty-btn" onclick="window.updateCartQty('${p.id}', -1)">-</button>
            <span class="qty-val">${item.qty}</span>
            <button class="qty-btn" onclick="window.updateCartQty('${p.id}', 1)">+</button>
          </div>
          <button class="remove-item-btn" onclick="window.removeFromCart('${p.id}')">
            <i class="fas fa-trash-alt"></i>
          </button>
        </div>
      `;
      els.cartItems.appendChild(itemRow);
    });

    // Determine values to show
    let subtotalDisplay = 0;
    let totalDisplay = 0;
    let currencySymbol = '';

    if (state.currentCurrency === 'LAK') {
      subtotalDisplay = totalLAK;
      totalDisplay = totalLAK;
      currencySymbol = ' ₭';
    } else if (state.currentCurrency === 'THB') {
      subtotalDisplay = totalTHB;
      totalDisplay = totalTHB;
      currencySymbol = ' ฿';
    } else if (state.currentCurrency === 'CNY') {
      subtotalDisplay = totalCNY;
      totalDisplay = totalCNY;
      currencySymbol = ' ¥';
    }

    els.cartSubtotal.textContent = formatNumber(subtotalDisplay) + currencySymbol;
    els.cartTotal.textContent = formatNumber(totalDisplay) + currencySymbol;

    // Currency Equivalents Table
    els.equivLak.textContent = formatNumber(totalLAK) + ' ₭';
    els.equivThb.textContent = formatNumber(totalTHB) + ' ฿';
    els.equivCny.textContent = formatNumber(totalCNY) + ' ¥';

    // Update member details display
    if (state.selectedMember) {
      if (els.memberSearchContainer) els.memberSearchContainer.style.display = 'none';
      if (els.selectedMemberCard) {
        els.selectedMemberCard.style.display = 'block';
        if (els.selectedMemberName) els.selectedMemberName.textContent = `${state.selectedMember.name} ${state.selectedMember.surname}`;
        if (els.selectedMemberId) els.selectedMemberId.textContent = `ID: ${state.selectedMember.id} | ເບີໂທ: ${state.selectedMember.phone}`;
        if (els.selectedMemberPoints) els.selectedMemberPoints.textContent = formatNumber(state.selectedMember.points);
      }
      updateEarnedPointsDisplay();
    } else {
      if (els.selectedMemberCard) els.selectedMemberCard.style.display = 'none';
      if (els.memberSearchContainer) els.memberSearchContainer.style.display = 'flex';
    }
  }

  // Global bindings so inline HTML click attributes work
  window.updateCartQty = (id, delta) => updateQty(id, delta);
  window.removeFromCart = (id) => removeFromCart(id);

  /* =========================================================================
     CHECKOUT FLOW & PAYMENT MODAL
     ========================================================================= */

  let activePaymentMethod = 'cash'; // 'cash' or 'transfer'

  els.checkoutBtn.addEventListener('click', () => {
    openCheckoutModal();
  });

  function openCheckoutModal() {
    // Reset Discount and VAT inputs
    const discountInput = document.getElementById('checkout-discount-input');
    const vatInput = document.getElementById('checkout-vat-input');
    if (discountInput) discountInput.value = '0';
    if (vatInput) vatInput.value = '0';

    recalculateCheckoutTotals();

    // Sync modal currency toggle buttons
    const modalOpts = document.querySelectorAll('#checkout-modal .currency-opt');
    modalOpts.forEach(btn => {
      if (btn.getAttribute('data-curr') === state.currentCurrency) {
        btn.classList.add('active');
      } else {
        btn.classList.remove('active');
      }
    });

    // Reset Form
    els.amountPaidInput.value = '';
    els.qrContainer.classList.remove('active');
    
    selectPaymentMethod('cash');

    els.checkoutModal.classList.add('active');
  }

  function recalculateCheckoutTotals() {
    let subtotal = 0;
    state.cart.forEach(item => {
      if (state.currentCurrency === 'LAK') subtotal += item.product.price_lak * item.qty;
      else if (state.currentCurrency === 'THB') subtotal += item.product.price_thb * item.qty;
      else if (state.currentCurrency === 'CNY') subtotal += item.product.price_cny * item.qty;
    });

    const discountInput = document.getElementById('checkout-discount-input');
    const vatInput = document.getElementById('checkout-vat-input');
    const discountPercent = discountInput ? (parseFloat(discountInput.value) || 0) : 0;
    const vatPercent = vatInput ? (parseFloat(vatInput.value) || 0) : 0;

    const discountAmount = subtotal * (discountPercent / 100);
    const vatAmount = (subtotal - discountAmount) * (vatPercent / 100);
    const grandTotal = subtotal - discountAmount + vatAmount;

    const currencySymbol = state.currentCurrency === 'LAK' ? ' ₭' : state.currentCurrency === 'THB' ? ' ฿' : ' ¥';
    els.checkoutTotalDisplay.textContent = formatNumber(grandTotal) + currencySymbol;

    // Recalculate change due
    const paid = getCleanFloat(els.amountPaidInput.value) || 0;
    const change = Math.max(0, paid - grandTotal);
    els.changeDueDisplay.textContent = formatNumber(change) + currencySymbol;

    // Real-time petty cash warning
    let warnEl = document.getElementById('checkout-change-warning');
    if (activePaymentMethod === 'cash' && change > 0) {
      let availableChange = 0;
      if (state.currentCurrency === 'LAK') {
        availableChange = state.pettyCashSession ? state.pettyCashSession.lak_remaining : 0;
      } else if (state.currentCurrency === 'THB') {
        availableChange = state.pettyCashSession ? state.pettyCashSession.thb_remaining : 0;
      } else if (state.currentCurrency === 'CNY') {
        availableChange = state.pettyCashSession ? state.pettyCashSession.cny_remaining : 0;
      }

      if (change > availableChange) {
        els.changeDueDisplay.style.color = 'var(--danger-color)';
        if (!warnEl) {
          warnEl = document.createElement('div');
          warnEl.id = 'checkout-change-warning';
          warnEl.style.color = 'var(--danger-color)';
          warnEl.style.fontSize = '0.8rem';
          warnEl.style.marginTop = '4px';
          warnEl.style.fontWeight = 'bold';
          warnEl.style.textAlign = 'right';
          els.changeDueDisplay.parentNode.appendChild(warnEl);
        }
        warnEl.textContent = `⚠️ ເງິນທອນບໍ່ພໍ (ມີພຽງ ${formatNumber(availableChange)} ${state.currentCurrency})! ກະລຸນາເລືອກວິທີຊຳລະແບບອື່ນ`;
        els.confirmPaymentBtn.disabled = true;
        els.confirmPaymentBtn.style.opacity = '0.5';
      } else {
        if (warnEl) warnEl.remove();
        els.changeDueDisplay.style.color = 'var(--text-primary)';
        els.confirmPaymentBtn.disabled = false;
        els.confirmPaymentBtn.style.opacity = '';
      }
    } else {
      if (warnEl) warnEl.remove();
      els.changeDueDisplay.style.color = 'var(--text-primary)';
      els.confirmPaymentBtn.disabled = false;
      els.confirmPaymentBtn.style.opacity = '';
    }

    // Update QR code if transfer
    if (activePaymentMethod === 'transfer') {
      displayQR();
    }

    // Update pending points if a member is selected
    updateEarnedPointsDisplay();
  }

  // Handle Payment Method Selection
  els.paymentMethodOpts.forEach(card => {
    card.addEventListener('click', (e) => {
      const method = e.currentTarget.getAttribute('data-method');
      selectPaymentMethod(method);
    });
  });

  function selectPaymentMethod(method) {
    activePaymentMethod = method;
    els.paymentMethodOpts.forEach(c => {
      if (c.getAttribute('data-method') === method) c.classList.add('active');
      else c.classList.remove('active');
    });

    if (method === 'cash') {
      els.cashPaymentSection.style.display = 'block';
      els.transferPaymentSection.style.display = 'none';
      els.qrContainer.classList.remove('active');
    } else {
      els.cashPaymentSection.style.display = 'none';
      els.transferPaymentSection.style.display = 'block';
      displayQR();
    }
    recalculateCheckoutTotals();
  }

  // Handle Cash Calculator Change input
  els.amountPaidInput.addEventListener('input', () => {
    recalculateCheckoutTotals();
  });

  // Display QR Code depending on selected Bank (BCEL/LDB) and Currency
  els.bankSelect.addEventListener('change', () => {
    displayQR();
  });

  function displayQR() {
    if (activePaymentMethod !== 'transfer') return;
    const bank = els.bankSelect.value;
    const currency = state.currentCurrency;
    
    // Locate image source from settings database
    const key = `${bank.toLowerCase()}_${currency.toLowerCase()}`;
    const qrSrc = state.settings.qr_codes[key];

    els.qrContainer.classList.add('active');
    
    if (qrSrc && qrSrc.startsWith('data:image')) {
      els.qrCodeImg.src = qrSrc;
      els.qrText.textContent = `ສະແດງຄິວອາໂຄດ ${bank} (${currency})`;
    } else {
      // Dynamic fallback placeholder QR generator using API
      let subtotal = 0;
      state.cart.forEach(item => {
        if (state.currentCurrency === 'LAK') subtotal += item.product.price_lak * item.qty;
        else if (state.currentCurrency === 'THB') subtotal += item.product.price_thb * item.qty;
        else if (state.currentCurrency === 'CNY') subtotal += item.product.price_cny * item.qty;
      });

      const discountInput = document.getElementById('checkout-discount-input');
      const vatInput = document.getElementById('checkout-vat-input');
      const discountPercent = discountInput ? (parseFloat(discountInput.value) || 0) : 0;
      const vatPercent = vatInput ? (parseFloat(vatInput.value) || 0) : 0;

      const discountAmount = subtotal * (discountPercent / 100);
      const vatAmount = (subtotal - discountAmount) * (vatPercent / 100);
      const grandTotal = subtotal - discountAmount + vatAmount;

      const qrPayload = `bokeoairport-${bank}-${currency}-total-${grandTotal}`;
      els.qrCodeImg.src = `https://api.qrserver.com/v1/create-qr-code/?size=180x180&data=${encodeURIComponent(qrPayload)}`;
      els.qrText.textContent = `ຄິວອາໂຄດທົດລອງ: ${bank} ບັນຊີ (${currency})`;
    }
  }

  els.modalCloseBtn.addEventListener('click', () => {
    els.checkoutModal.classList.remove('active');
  });

  // Confirm Sale & Print
  els.confirmPaymentBtn.addEventListener('click', async () => {
    await completeSale();
  });

  async function completeSale() {
    let grandTotalLAK = 0;
    let grandTotalTHB = 0;
    let grandTotalCNY = 0;

    state.cart.forEach(item => {
      grandTotalLAK += item.product.price_lak * item.qty;
      grandTotalTHB += item.product.price_thb * item.qty;
      grandTotalCNY += item.product.price_cny * item.qty;
    });

    const discountInput = document.getElementById('checkout-discount-input');
    const vatInput = document.getElementById('checkout-vat-input');
    const discountPercent = discountInput ? (parseFloat(discountInput.value) || 0) : 0;
    const vatPercent = vatInput ? (parseFloat(vatInput.value) || 0) : 0;

    const discountLAK = grandTotalLAK * (discountPercent / 100);
    const discountTHB = grandTotalTHB * (discountPercent / 100);
    const discountCNY = grandTotalCNY * (discountPercent / 100);

    const vatLAK = (grandTotalLAK - discountLAK) * (vatPercent / 100);
    const vatTHB = (grandTotalTHB - discountTHB) * (vatPercent / 100);
    const vatCNY = (grandTotalCNY - discountCNY) * (vatPercent / 100);

    const finalTotalLAK = grandTotalLAK - discountLAK + vatLAK;
    const finalTotalTHB = grandTotalTHB - discountTHB + vatTHB;
    const finalTotalCNY = grandTotalCNY - discountCNY + vatCNY;

    const paidStr = els.amountPaidInput.value;
    const targetTotal = state.currentCurrency === 'LAK' ? finalTotalLAK : state.currentCurrency === 'THB' ? finalTotalTHB : finalTotalCNY;
    const paid = activePaymentMethod === 'cash' ? (getCleanFloat(paidStr) || 0) : targetTotal;
    
    if (activePaymentMethod === 'cash' && paid < targetTotal) {
      alert('ຈຳນວນເງິນທີ່ຈ່າຍບໍ່ພຽງພໍ');
      return;
    }

    const change = activePaymentMethod === 'cash' ? (paid - targetTotal) : 0;
    if (activePaymentMethod === 'cash' && change > 0) {
      let availableChange = 0;
      if (state.currentCurrency === 'LAK') {
        availableChange = state.pettyCashSession ? state.pettyCashSession.lak_remaining : 0;
      } else if (state.currentCurrency === 'THB') {
        availableChange = state.pettyCashSession ? state.pettyCashSession.thb_remaining : 0;
      } else if (state.currentCurrency === 'CNY') {
        availableChange = state.pettyCashSession ? state.pettyCashSession.cny_remaining : 0;
      }
      
      if (change > availableChange) {
        alert(`ເງິນທອນບໍ່ພໍ! ຕ້ອງການທອນ ${formatNumber(change)} ${state.currentCurrency} ແຕ່ມີເຫຼືອພຽງ ${formatNumber(availableChange)} ${state.currentCurrency}.\nກະລຸນາເລືອກປະເພດການຊຳລະແບບອື່ນແທນ.`);
        return;
      }
    }

    let costTHB = 0;
    state.cart.forEach(item => {
      costTHB += (item.product.cost_thb || 0) * item.qty;
    });

    const rateLak = state.settings.exchange_rate_lak;
    const rateCny = state.settings.exchange_rate_cny;

    const costLAK = costTHB * rateLak;
    const costCNY = costTHB * rateCny;

    const profitLAK = finalTotalLAK - costLAK;
    const profitTHB = finalTotalTHB - costTHB;
    const profitCNY = finalTotalCNY - costCNY;

    const invoiceNo = `INV-${Date.now().toString().slice(-6)}`;
    const timestamp = new Date().toISOString();

    const transaction = {
      id: invoiceNo,
      timestamp: timestamp,
      pos: state.currentPOS.name,
      serviceType: state.currentPOS.serviceType,
      cashier: state.currentCashier,
      items: state.cart.map(item => ({
        id: item.product.id,
        code: item.product.code,
        name_lo: item.product.name_lo,
        name_en: item.product.name_en,
        price_lak: item.product.price_lak,
        price_thb: item.product.price_thb,
        price_cny: item.product.price_cny,
        cost_thb: item.product.cost_thb || 0,
        qty: item.qty
      })),
      subtotal_lak: grandTotalLAK,
      subtotal_thb: grandTotalTHB,
      subtotal_cny: grandTotalCNY,
      discount_percent: discountPercent,
      discount_amount_lak: discountLAK,
      discount_amount_thb: discountTHB,
      discount_amount_cny: discountCNY,
      vat_percent: vatPercent,
      vat_amount_lak: vatLAK,
      vat_amount_thb: vatTHB,
      vat_amount_cny: vatCNY,
      total_lak: finalTotalLAK,
      total_thb: finalTotalTHB,
      total_cny: finalTotalCNY,
      cost_lak: costLAK,
      cost_thb: costTHB,
      cost_cny: costCNY,
      profit_lak: profitLAK,
      profit_thb: profitTHB,
      profit_cny: profitCNY,
      paid_currency: state.currentCurrency,
      paid_amount: paid,
      change_amount: change,
      payment_type: activePaymentMethod === 'cash' ? 'ເງິນສົດ' : 'ໂອນ',
      bank: activePaymentMethod === 'transfer' ? els.bankSelect.value : null,
      member_id: state.selectedMember ? state.selectedMember.id : '-',
      earned_points: state.selectedMember ? calculateEarnedPoints(finalTotalTHB) : 0
    };

    // 1. Deduct Stock Locally & Sync Sales to Google Sheets
    for (const item of state.cart) {
      await window.BokeoDB.deductStock(item.product.id, item.qty);
      if (state.settings.gdrive_script_url) {
        syncSaleToGoogleSheets(item.product.id, item.qty);
      }
    }

    // 2. Save Transaction to database
    await window.BokeoDB.saveTransaction(transaction);

    // Update local member points in IndexedDB
    if (state.selectedMember) {
      state.selectedMember.points += transaction.earned_points;
      await window.BokeoDB.saveMember(state.selectedMember);
    }

    // 3. Update Remaining Petty Cash Session (only cash change reduces petty float)
    if (activePaymentMethod === 'cash') {
      if (state.currentCurrency === 'LAK') {
        state.pettyCashSession.lak_remaining -= change;
      } else if (state.currentCurrency === 'THB') {
        state.pettyCashSession.thb_remaining -= change;
      } else if (state.currentCurrency === 'CNY') {
        state.pettyCashSession.cny_remaining -= change;
      }
      await window.BokeoDB.savePettyCashSession(state.pettyCashSession);
      syncPettyCashToGoogleSheets(state.pettyCashSession);
    }

    // Reload Products to get fresh stock counts
    state.products = await window.BokeoDB.getProducts();

    // 4. Generate & Save PDF invoice to Google Drive in the background
    if (typeof html2pdf !== 'undefined' && state.settings.gdrive_script_url) {
      generateReceiptPDFBlob(transaction).then(pdfBlob => {
        if (pdfBlob) {
          const dateStr = new Date(transaction.timestamp).toISOString().split('T')[0];
          const sanitizedPOS = transaction.pos.replace(/[\\\/:*?"<>|]/g, '_');
          const sanitizedType = transaction.payment_type.replace(/[\\\/:*?"<>|]/g, '_');
          const filename = `${dateStr}/${sanitizedPOS}/${sanitizedType}/${transaction.id}.pdf`;
          uploadPDFToGoogleDrive(pdfBlob, filename, transaction);
        }
      }).catch(err => {
        console.error('Error generating PDF for Drive upload:', err);
      });
    }

    // 5. Reset Cart and Close Checkout Modal
    state.cart = [];
    state.selectedMember = null;
    if (els.selectedMemberCard) els.selectedMemberCard.style.display = 'none';
    if (els.memberSearchContainer) els.memberSearchContainer.style.display = 'flex';
    updateCartUI();
    els.checkoutModal.classList.remove('active');
    
    // Show the Receipt Modal for printing/local download
    showReceiptModal(transaction);
  }

  /* =========================================================================
     INVOICE PRINTING & PDF EXPORT
     ========================================================================= */

  function buildReceiptHTML(tx) {
    const currency = tx.paid_currency;
    const symbol = currency === 'LAK' ? '₭' : currency === 'THB' ? '฿' : '¥';
    
    let subtotal = 0;
    let discountAmount = 0;
    let vatAmount = 0;
    let finalTotal = 0;

    if (currency === 'LAK') {
      subtotal = tx.subtotal_lak !== undefined ? tx.subtotal_lak : tx.total_lak;
      discountAmount = tx.discount_amount_lak || 0;
      vatAmount = tx.vat_amount_lak || 0;
      finalTotal = tx.total_lak;
    } else if (currency === 'THB') {
      subtotal = tx.subtotal_thb !== undefined ? tx.subtotal_thb : tx.total_thb;
      discountAmount = tx.discount_amount_thb || 0;
      vatAmount = tx.vat_amount_thb || 0;
      finalTotal = tx.total_thb;
    } else if (currency === 'CNY') {
      subtotal = tx.subtotal_cny !== undefined ? tx.subtotal_cny : tx.total_cny;
      discountAmount = tx.discount_amount_cny || 0;
      vatAmount = tx.vat_amount_cny || 0;
      finalTotal = tx.total_cny;
    }

    const formattedSubtotal = formatNumber(subtotal);
    const formattedTotal = formatNumber(finalTotal);
    const formattedPaid = formatNumber(tx.paid_amount);
    const formattedChange = formatNumber(tx.change_amount);

    const formattedDate = new Date(tx.timestamp).toLocaleString('lo-LA', {
      day: 'numeric',
      month: 'numeric',
      year: 'numeric',
      hour: '2-digit',
      minute: '2-digit',
      hour12: true
    });

    const itemsHtml = tx.items.map(item => {
      let itemPrice = 0;
      if (currency === 'LAK') itemPrice = item.price_lak;
      else if (currency === 'THB') itemPrice = item.price_thb;
      else if (currency === 'CNY') itemPrice = item.price_cny;

      return `
        <div style="margin-bottom: 8px;">
          <div style="display: flex; justify-content: space-between; font-weight: 600; color: #000; font-size: 11px;">
            <span style="flex: 1; text-align: left;">${item.name_lo}</span>
            <span style="width: 50px; text-align: center; color: #000; font-weight: 500;">${item.qty}</span>
            <span style="width: 90px; text-align: right;">${formatNumber(itemPrice * item.qty)}</span>
          </div>
          ${item.name_en ? `<div style="font-size: 10px; color: #666; margin-top: 1px; padding-left: 0; text-align: left;">${item.name_en}</div>` : ''}
        </div>
      `;
    }).join('');

    let discountRowHtml = '';
    if (tx.discount_percent > 0) {
      discountRowHtml = `
        <div style="display: flex; justify-content: space-between;">
          <span>ສ່ວນຫຼຸດ (Discount ${tx.discount_percent}%)</span>
          <span style="font-weight: 600; color: #000;">-${formatNumber(discountAmount)} ${symbol}</span>
        </div>
      `;
    }

    let vatRowHtml = '';
    if (tx.vat_percent > 0) {
      vatRowHtml = `
        <div style="display: flex; justify-content: space-between;">
          <span>ອາກອນ (VAT ${tx.vat_percent}%)</span>
          <span style="font-weight: 600; color: #000;">+${formatNumber(vatAmount)} ${symbol}</span>
        </div>
      `;
    }

    const addr = state.settings.receipt_address || 'ຈຸດບໍລິການ POS, ສະໜາມບິນສາກົນບໍ່ແກ້ວ';
    const phone = state.settings.receipt_phone || '020 9999-8888';
    const footerLao = state.settings.receipt_footer_lao || 'ຂໍຂອບໃຈ ແລະ ຍິນດີຕ້ອນຮັບອີກຄັ້ງ';
    const footerEng = state.settings.receipt_footer_eng || 'Thank you, Please visit again!';
    const sloganLao = state.settings.receipt_slogan_lao || '';
    const sloganEng = state.settings.receipt_slogan_eng || '';

    return `
      <div style="text-align: center; margin-bottom: 16px;">
        <div style="font-size: 15px; font-weight: 800; text-transform: uppercase; color: #000; margin-bottom: 4px; letter-spacing: 0.5px;">${tx.pos}</div>
        <div style="font-size: 11px; color: #666; margin-bottom: 2px; font-weight: 500;">${addr}</div>
        <div style="font-size: 11px; color: #666; font-weight: 500;">ໂທ: ${phone}</div>
      </div>

      <div style="font-size: 11px; color: #444; margin-bottom: 12px; display: flex; flex-direction: column; gap: 4px; border-bottom: 1px dashed #ccc; padding-bottom: 10px; text-align: left;">
        <div style="display: flex; justify-content: space-between;">
          <span>ເລກບິນ: <strong style="color:#000;">${tx.id}</strong></span>
        </div>
        <div style="display: flex; justify-content: space-between;">
          <span>ວັນທີ: <strong style="color:#000;">${formattedDate}</strong></span>
        </div>
        <div style="display: flex; justify-content: space-between;">
          <span>ຊຳລະໂດຍ: <strong style="color:#000;">${tx.payment_type} ${tx.bank ? `(${tx.bank})` : ''}</strong></span>
        </div>
      </div>

      <div style="display: flex; justify-content: space-between; font-weight: 700; font-size: 11px; text-transform: uppercase; color: #666; border-bottom: 1px dashed #ccc; padding-bottom: 6px; margin-bottom: 8px;">
        <span style="flex: 1; text-align: left;">ລາຍການ</span>
        <span style="width: 50px; text-align: center;">ຈຳນວນ</span>
        <span style="width: 90px; text-align: right;">ລາຄາ (${symbol})</span>
      </div>

      <div style="margin-bottom: 12px; border-bottom: 1px dashed #ccc; padding-bottom: 8px;">
        ${itemsHtml}
      </div>

      <div style="font-size: 11px; display: flex; flex-direction: column; gap: 6px; border-bottom: 1px dashed #ccc; padding-bottom: 8px; margin-bottom: 8px; color: #444;">
        <div style="display: flex; justify-content: space-between;">
          <span>ລວມຍອດ (Subtotal)</span>
          <span style="font-weight: 600; color: #000;">${formattedSubtotal} ${symbol}</span>
        </div>
        ${discountRowHtml}
        ${vatRowHtml}
      </div>

      <div style="font-size: 13px; font-weight: 800; color: #000; display: flex; justify-content: space-between; border-bottom: 1px dashed #ccc; padding-bottom: 8px; margin-bottom: 12px;">
        <span>ລວມທັງໝົດ</span>
        <span>${formattedTotal} ${symbol}</span>
      </div>

      ${tx.payment_type === 'ເງິນສົດ' ? `
        <div style="font-size: 11px; display: flex; flex-direction: column; gap: 6px; color: #444; border-bottom: 1px dashed #ccc; padding-bottom: 8px; margin-bottom: 12px;">
          <div style="display: flex; justify-content: space-between;">
            <span>ຮັບເງິນສົດ:</span>
            <span style="font-weight: 600; color: #000;">${formattedPaid} ${symbol}</span>
          </div>
          <div style="display: flex; justify-content: space-between;">
            <span>ເງິນທອນ:</span>
            <span style="font-weight: 700; color: #e11d48;">${formattedChange} ${symbol}</span>
          </div>
        </div>
      ` : ''}

      ${tx.member_id && tx.member_id !== '-' ? `
        <div style="font-size: 11px; display: flex; flex-direction: column; gap: 6px; color: #444; border-bottom: 1px dashed #ccc; padding-bottom: 8px; margin-bottom: 12px; text-align: left;">
          <div style="display: flex; justify-content: space-between;">
            <span>ລະຫັດສະມາຊິກ (Member ID):</span>
            <span style="font-weight: 600; color: #000;">${tx.member_id}</span>
          </div>
          <div style="display: flex; justify-content: space-between;">
            <span>ແຕ້ມສະສົມໃນບິນ (Earned Points):</span>
            <span style="font-weight: 700; color: #10b981;">+${tx.earned_points || 0}</span>
          </div>
        </div>
      ` : ''}

      <div style="text-align: center; font-size: 11px; color: #666; line-height: 1.4; margin-top: 10px;">
        <div style="font-weight: 600; color: #000;">${footerLao}</div>
        ${footerEng ? `<div style="font-weight: 600; color: #000;">${footerEng}</div>` : ''}
        ${sloganLao ? `<div style="margin-top: 4px; font-weight: 500; color: #444;">${sloganLao}</div>` : ''}
        ${sloganEng ? `<div style="font-weight: 500; color: #444;">${sloganEng}</div>` : ''}
      </div>
    `;
  }

  async function handlePDFAndPrintInvoice(tx) {
    const printHTML = buildReceiptHTML(tx);
    els.billPrintBox.innerHTML = printHTML;

    // Trigger Print after a short delay to allow rendering/paint
    setTimeout(() => {
      window.print();
    }, 150);
  }

  async function generateReceiptPDFBlob(tx) {
    if (typeof html2pdf === 'undefined') return null;

    // Create an invisible wrapper in the DOM
    const wrapper = document.createElement('div');
    wrapper.style.position = 'fixed';
    wrapper.style.left = '0';
    wrapper.style.top = '0';
    wrapper.style.width = '0';
    wrapper.style.height = '0';
    wrapper.style.overflow = 'hidden';
    wrapper.style.opacity = '0';
    wrapper.style.zIndex = '-9999';
    
    const tempDiv = document.createElement('div');
    tempDiv.innerHTML = buildReceiptHTML(tx);
    
    // Style it with explicit pixel dimensions matching 80mm width
    tempDiv.style.width = '300px';
    tempDiv.style.backgroundColor = '#fff';
    tempDiv.style.color = '#000';
    tempDiv.style.fontFamily = "'Outfit', 'Noto Sans Lao', system-ui, -apple-system, sans-serif";
    tempDiv.style.fontSize = '11px';
    tempDiv.style.boxSizing = 'border-box';
    tempDiv.style.padding = '15px';
    
    wrapper.appendChild(tempDiv);
    document.body.appendChild(wrapper);

    // Calculate dynamic height based on content to match the receipt size
    const elementHeightMm = Math.ceil((tempDiv.scrollHeight * 25.4) / 96) + 2;

    const options = {
      margin: 0,
      filename: `${tx.id}.pdf`,
      image: { type: 'jpeg', quality: 0.98 },
      html2canvas: { scale: 2, useCORS: true },
      jsPDF: { unit: 'mm', format: [80, elementHeightMm], orientation: 'portrait' }
    };

    try {
      return await html2pdf().set(options).from(tempDiv).output('blob');
    } finally {
      // Clean up the wrapper from DOM immediately
      document.body.removeChild(wrapper);
    }
  }

  async function downloadReceiptPDF(tx) {
    if (typeof html2pdf !== 'undefined') {
      // Create an invisible wrapper in the DOM
      const wrapper = document.createElement('div');
      wrapper.style.position = 'fixed';
      wrapper.style.left = '0';
      wrapper.style.top = '0';
      wrapper.style.width = '0';
      wrapper.style.height = '0';
      wrapper.style.overflow = 'hidden';
      wrapper.style.opacity = '0';
      wrapper.style.zIndex = '-9999';
      
      const tempDiv = document.createElement('div');
      tempDiv.innerHTML = buildReceiptHTML(tx);
      
      tempDiv.style.width = '300px';
      tempDiv.style.backgroundColor = '#fff';
      tempDiv.style.color = '#000';
      tempDiv.style.fontFamily = "'Outfit', 'Noto Sans Lao', system-ui, -apple-system, sans-serif";
      tempDiv.style.fontSize = '11px';
      tempDiv.style.boxSizing = 'border-box';
      tempDiv.style.padding = '15px';
      
      wrapper.appendChild(tempDiv);
      document.body.appendChild(wrapper);

      const dateStr = new Date(tx.timestamp).toISOString().split('T')[0];
      const sanitizedPOS = tx.pos.replace(/[\\\/:*?"<>|]/g, '_');
      const sanitizedType = tx.payment_type.replace(/[\\\/:*?"<>|]/g, '_');
      const filename = `${dateStr}_${sanitizedPOS}_${sanitizedType}_${tx.id}.pdf`;

      const elementHeightMm = Math.ceil((tempDiv.scrollHeight * 25.4) / 96) + 2;

      const options = {
        margin: 0,
        filename: filename,
        image: { type: 'jpeg', quality: 0.98 },
        html2canvas: { scale: 2, useCORS: true },
        jsPDF: { unit: 'mm', format: [80, elementHeightMm], orientation: 'portrait' }
      };

      try {
        await html2pdf().set(options).from(tempDiv).save();
      } finally {
        document.body.removeChild(wrapper);
      }
    }
  }

  function showReceiptModal(tx) {
    state.lastTransaction = tx;
    els.receiptPreviewContent.innerHTML = buildReceiptHTML(tx);
    els.receiptModal.classList.add('active');
    
    // Automatically trigger printing
    handlePDFAndPrintInvoice(tx);
  }

  /**
   * Client-side Google Drive PDF Upload
   * Recreates folder structures: YYYY-MM-DD -> POS Name -> Payment Type -> File
   */
  async function uploadPDFToGoogleDrive(blob, fullPath, transaction) {
    const scriptUrl = state.settings.gdrive_script_url;
    if (!scriptUrl) {
      console.log('Google Drive script URL not configured. Skipping upload.');
      return;
    }

    try {
      // Convert Blob to Base64
      const reader = new FileReader();
      const base64Promise = new Promise((resolve) => {
        reader.onloadend = () => {
          const base64data = reader.result.split(',')[1];
          resolve(base64data);
        };
      });
      reader.readAsDataURL(blob);
      const base64Data = await base64Promise;

      const folderId = state.settings.gdrive_folder_id || '1ao3TJesHPrdVCflFPnU6ndcGKAyVPXyC';

      const payload = {
        action: 'upload_invoice',
        file: base64Data,
        filename: fullPath,
        folderId: folderId,
        transaction: transaction
      };

      const response = await fetch(scriptUrl, {
        method: 'POST',
        mode: 'cors',
        headers: {
          'Content-Type': 'text/plain'
        },
        body: JSON.stringify(payload)
      });

      const resData = await response.json();
      if (resData.success) {
        console.log('PDF uploaded and transaction logged successfully via Apps Script. File ID:', resData.fileId);
        if (resData.sheetError) {
          console.error('Google Sheet log error:', resData.sheetError);
          alert('ລະບົບບັນທຶກບິນໄປ Google Drive ສຳເລັດ ແຕ່ບໍ່ສາມາດບັນທຶກລົງ Google Sheet ໄດ້: ' + resData.sheetError);
        }
      } else {
        console.error('Apps Script upload/logging failed:', resData.error);
        throw new Error(resData.error);
      }
    } catch (err) {
      console.error('Failed to upload PDF and log transaction via Apps Script:', err);
      throw err;
    }
  }

  async function syncPettyCashToGoogleSheets(session) {
    const scriptUrl = state.settings.gdrive_script_url;
    if (!scriptUrl) {
      console.log('Google Drive script URL not configured. Skipping petty cash sync.');
      return;
    }

    try {
      const payload = {
        action: 'sync_petty_cash',
        session: session
      };

      const response = await fetch(scriptUrl, {
        method: 'POST',
        mode: 'cors',
        headers: {
          'Content-Type': 'text/plain'
        },
        body: JSON.stringify(payload)
      });

      const resData = await response.json();
      if (resData.success) {
        console.log('Petty cash session logged successfully via Apps Script.');
      } else {
        console.error('Apps Script petty cash sync failed:', resData.error);
      }
    } catch (err) {
      console.error('Failed to sync petty cash session via Apps Script:', err);
    }
  }

  async function syncProductStockToGoogleSheets(codeOrId, addedQty, newStock) {
    const scriptUrl = state.settings.gdrive_script_url;
    if (!scriptUrl) {
      console.log('Google Drive script URL not configured. Skipping stock sync.');
      return;
    }

    try {
      const payload = {
        action: 'update_stock',
        code: codeOrId,
        addedQty: addedQty,
        newStock: newStock
      };

      const response = await fetch(scriptUrl, {
        method: 'POST',
        mode: 'cors',
        headers: {
          'Content-Type': 'text/plain'
        },
        body: JSON.stringify(payload)
      });

      const resData = await response.json();
      if (resData.success) {
        console.log('Stock sync successful via Apps Script.');
      } else {
        console.error('Apps Script stock sync failed:', resData.error);
      }
    } catch (err) {
      console.error('Failed to sync stock via Apps Script:', err);
    }
  }

  async function syncSaleToGoogleSheets(codeOrId, qty) {
    const scriptUrl = state.settings.gdrive_script_url;
    if (!scriptUrl) return;

    try {
      const payload = {
        action: 'update_sales',
        code: codeOrId,
        qty: qty
      };

      const response = await fetch(scriptUrl, {
        method: 'POST',
        mode: 'cors',
        headers: {
          'Content-Type': 'text/plain'
        },
        body: JSON.stringify(payload)
      });

      const resData = await response.json();
      if (resData.success) {
        console.log('Sales sync successful via Apps Script.');
      } else {
        console.error('Apps Script sales sync failed:', resData.error);
      }
    } catch (err) {
      console.error('Failed to sync sales via Apps Script:', err);
    }
  }

  /* =========================================================================
     ADMIN PIN SECURITY SYSTEM
     ========================================================================= */

  let pinInput = '';

  function promptPIN(onSuccess) {
    state.pinTargetAction = onSuccess;
    pinInput = '';
    updatePinDots();
    els.pinModal.classList.add('active');
  }

  els.pinKeys.forEach(key => {
    key.addEventListener('click', (e) => {
      const val = e.currentTarget.getAttribute('data-val');
      if (val === 'clear') {
        pinInput = '';
      } else if (val === 'back') {
        pinInput = pinInput.slice(0, -1);
      } else {
        if (pinInput.length < 4) {
          pinInput += val;
        }
      }
      
      updatePinDots();

      if (pinInput.length === 4) {
        // Verify PIN
        if (pinInput === state.settings.admin_pin) {
          els.pinModal.classList.remove('active');
          if (state.pinTargetAction) {
            state.pinTargetAction();
            state.pinTargetAction = null;
          }
        } else {
          alert('ລະຫັດ PIN ບໍ່ຖືກຕ້ອງ!');
          pinInput = '';
          updatePinDots();
        }
      }
    });
  });

  function updatePinDots() {
    els.pinDots.forEach((dot, index) => {
      if (index < pinInput.length) {
        dot.classList.add('filled');
      } else {
        dot.classList.remove('filled');
      }
    });
  }

  // Close PIN modal clicking overlay
  els.pinModal.addEventListener('click', (e) => {
    if (e.target === els.pinModal) {
      els.pinModal.classList.remove('active');
      state.pinTargetAction = null;
    }
  });

  /* =========================================================================
     DASHBOARD & REPORTS ENGINE
     ========================================================================= */

  let dashboardTransactions = [];
  let salesChartInstance = null;
  let chartMode = 'daily'; // 'daily', 'monthly', 'allmonths'
  let posChartInstance = null;
  let posChartMode = 'daily'; // 'daily', 'monthly', 'yearly'
  let dashboardListenersBound = false;

  function initDashboard() {
    // Populate default date fields
    const today = new Date().toISOString().split('T')[0];
    els.startDateFilter.value = today;
    els.endDateFilter.value = today;

    // Populate POS Filters
    els.dashPOSFilter.innerHTML = '';
    
    const isAdminPOS = state.currentPOS && [
      'ແອດມິນ ພະແນກ ອາຄານແລະລານຈອດ',
      'ແອດມິນ ພະແນກ ບັນຊີ-ການເງິນ',
      'ແອດມິນ ພະແນກ ຈັດຊື້-ຊັບສິນ'
    ].includes(state.currentPOS.name);

    if (!isAdminPOS) {
      const opt = document.createElement('option');
      opt.value = `pos:${state.currentPOS.name}`;
      opt.textContent = `ຈຸດຂາຍ: ${state.currentPOS.name}`;
      els.dashPOSFilter.appendChild(opt);
      els.dashPOSFilter.disabled = true;
    } else {
      els.dashPOSFilter.disabled = false;
      
      const optAll = document.createElement('option');
      optAll.value = 'all';
      optAll.textContent = 'ຈຸດຂາຍທັງໝົດ (All POS)';
      els.dashPOSFilter.appendChild(optAll);
      
      // Group 1: Service Types (ປະເພດບໍລິການ)
      const optGroupService = document.createElement('optgroup');
      optGroupService.label = 'ປະເພດບໍລິການ (Service Types)';
      
      const serviceTypes = [...new Set(state.settings.pos_points.map(p => p.serviceType).filter(Boolean))];
      serviceTypes.forEach(st => {
        const opt = document.createElement('option');
        opt.value = `service:${st}`;
        opt.textContent = `ປະເພດ: ${st}`;
        optGroupService.appendChild(opt);
      });
      if (serviceTypes.length > 0) {
        els.dashPOSFilter.appendChild(optGroupService);
      }
      
      // Group 2: Individual POS Outlets (ຈຸດຂາຍ)
      const optGroupPOS = document.createElement('optgroup');
      optGroupPOS.label = 'ຈຸດຂາຍ (POS Outlets)';
      state.settings.pos_points.forEach(p => {
        const opt = document.createElement('option');
        opt.value = `pos:${p.name}`;
        opt.textContent = `ຈຸດຂາຍ: ${p.name}`;
        optGroupPOS.appendChild(opt);
      });
      els.dashPOSFilter.appendChild(optGroupPOS);
    }

    if (!dashboardListenersBound) {
      els.startDateFilter.addEventListener('change', loadDashboardData);
      els.endDateFilter.addEventListener('change', loadDashboardData);
      els.dashPOSFilter.addEventListener('change', loadDashboardData);

      // Bind new chart toggles
      const btnDaily = document.getElementById('chart-btn-daily');
      const btnMonthly = document.getElementById('chart-btn-monthly');
      const btnAllMonths = document.getElementById('chart-btn-allmonths');
      const selectCurrency = document.getElementById('chart-currency');
      
      if (btnDaily) {
        btnDaily.addEventListener('click', () => {
          chartMode = 'daily';
          updateChartToggles();
          loadDashboardData();
        });
      }
      if (btnMonthly) {
        btnMonthly.addEventListener('click', () => {
          chartMode = 'monthly';
          updateChartToggles();
          loadDashboardData();
        });
      }
      if (btnAllMonths) {
        btnAllMonths.addEventListener('click', () => {
          chartMode = 'allmonths';
          updateChartToggles();
          loadDashboardData();
        });
      }
      if (selectCurrency) {
        selectCurrency.addEventListener('change', () => {
          loadDashboardData();
        });
      }

      const btnPosDaily = document.getElementById('pos-chart-btn-daily');
      const btnPosMonthly = document.getElementById('pos-chart-btn-monthly');
      const btnPosYearly = document.getElementById('pos-chart-btn-yearly');
      
      if (btnPosDaily) {
        btnPosDaily.addEventListener('click', () => {
          posChartMode = 'daily';
          updatePOSChartToggles();
          loadDashboardData();
        });
      }
      if (btnPosMonthly) {
        btnPosMonthly.addEventListener('click', () => {
          posChartMode = 'monthly';
          updatePOSChartToggles();
          loadDashboardData();
        });
      }
      if (btnPosYearly) {
        btnPosYearly.addEventListener('click', () => {
          posChartMode = 'yearly';
          updatePOSChartToggles();
          loadDashboardData();
        });
      }
      
      dashboardListenersBound = true;
    }

    updateChartToggles();
    updatePOSChartToggles();
    loadDashboardData();
  }

  function updateChartToggles() {
    const btnDaily = document.getElementById('chart-btn-daily');
    const btnMonthly = document.getElementById('chart-btn-monthly');
    const btnAllMonths = document.getElementById('chart-btn-allmonths');
    
    if (btnDaily) btnDaily.classList.toggle('active', chartMode === 'daily');
    if (btnMonthly) btnMonthly.classList.toggle('active', chartMode === 'monthly');
    if (btnAllMonths) btnAllMonths.classList.toggle('active', chartMode === 'allmonths');
  }

  async function loadDashboardData() {
    const start = els.startDateFilter.value;
    const end = els.endDateFilter.value;
    const selectedPOS = els.dashPOSFilter.value;

    const isAdminPOS = state.currentPOS && [
      'ແອດມິນ ພະແນກ ອາຄານແລະລານຈອດ',
      'ແອດມິນ ພະແນກ ບັນຊີ-ການເງິນ',
      'ແອດມິນ ພະແນກ ຈັດຊື້-ຊັບສິນ'
    ].includes(state.currentPOS.name);

    const allTx = await window.BokeoDB.getTransactions();
    const allPetty = await window.BokeoDB.getPettyCashSessions();

    // Filter by Date Range and POS
    dashboardTransactions = allTx.filter(tx => {
      const txDate = tx.timestamp.split('T')[0];
      const matchDate = txDate >= start && txDate <= end;
      
      let matchPOS = false;
      if (selectedPOS === 'all') {
        matchPOS = true;
      } else if (selectedPOS.startsWith('service:')) {
        const targetService = selectedPOS.substring(8);
        const txServiceType = tx.serviceType || (state.settings.pos_points.find(p => p.name === tx.pos)?.serviceType);
        matchPOS = txServiceType === targetService;
      } else if (selectedPOS.startsWith('pos:')) {
        const targetPOS = selectedPOS.substring(4);
        matchPOS = tx.pos === targetPOS;
      } else {
        matchPOS = tx.pos === selectedPOS;
      }
      return matchDate && matchPOS;
    });

    // Calculate report statistics
    let sumLAK = 0;
    let sumTHB = 0;
    let sumCNY = 0;

    let transferLAK = 0;
    let transferTHB = 0;
    let transferCNY = 0;

    let bcelCount = 0;
    let ldbCount = 0;

    dashboardTransactions.forEach(tx => {
      sumLAK += tx.total_lak;
      sumTHB += tx.total_thb;
      sumCNY += tx.total_cny;

      if (tx.payment_type === 'ໂອນ') {
        transferLAK += tx.total_lak;
        transferTHB += tx.total_thb;
        transferCNY += tx.total_cny;

        if (tx.bank === 'BCEL') bcelCount++;
        else if (tx.bank === 'LDB') ldbCount++;
      }
    });

    // Calculate Petty Cash Balances for the filter range
    let startLAK = 0, startTHB = 0, startCNY = 0;
    let remainLAK = 0, remainTHB = 0, remainCNY = 0;

    // Filter petty cash sessions inside selected ranges
    const rangePetty = allPetty.filter(p => {
      const matchDate = p.date >= start && p.date <= end;
      
      let matchPOS = false;
      if (selectedPOS === 'all') {
        matchPOS = true;
      } else if (selectedPOS.startsWith('service:')) {
        const targetService = selectedPOS.substring(8);
        const matchingPOS = state.settings.pos_points.find(point => point.name === p.pos);
        matchPOS = matchingPOS && matchingPOS.serviceType === targetService;
      } else if (selectedPOS.startsWith('pos:')) {
        const targetPOS = selectedPOS.substring(4);
        matchPOS = p.pos === targetPOS;
      } else {
        matchPOS = p.pos === selectedPOS;
      }
      return matchDate && matchPOS;
    });

    rangePetty.forEach(p => {
      startLAK += p.lak_start;
      startTHB += p.thb_start;
      startCNY += p.cny_start;
      
      remainLAK += p.lak_remaining;
      remainTHB += p.thb_remaining;
      remainCNY += p.cny_remaining;
    });

    // Render Stats
    els.dashStatsContainer.innerHTML = `
      <div class="stat-card">
        <span class="stat-title">ຍອດຂາຍລວມ ກີບ (LAK)</span>
        <div class="stat-value">${formatNumber(sumLAK)} ₭</div>
        <div class="stat-sub">ໂອນ: <span>${formatNumber(transferLAK)} ₭</span></div>
      </div>
      <div class="stat-card">
        <span class="stat-title">ຍອດຂາຍລວມ ບາດ (THB)</span>
        <div class="stat-value">${formatNumber(sumTHB)} ฿</div>
        <div class="stat-sub">ໂອນ: <span>${formatNumber(transferTHB)} ฿</span></div>
      </div>
      <div class="stat-card">
        <span class="stat-title">ຍອດຂາຍລວມ ຢວນ (CNY)</span>
        <div class="stat-value">${formatNumber(sumCNY)} ¥</div>
        <div class="stat-sub">ໂອນ: <span>${formatNumber(transferCNY)} ¥</span></div>
      </div>
      <div class="stat-card">
        <span class="stat-title">ຂໍ້ມູນເງິນທອນຄົງເຫຼືອ</span>
        <div style="font-size: 0.85rem; font-weight: 700; margin-top: 4px;">
          LAK: ${formatNumber(remainLAK)} ₭ (ເລີ່ມ: ${formatNumber(startLAK)})<br>
          THB: ${formatNumber(remainTHB)} ฿ (ເລີ່ມ: ${formatNumber(startTHB)})<br>
          CNY: ${formatNumber(remainCNY)} ¥ (ເລີ່ມ: ${formatNumber(startCNY)})
        </div>
        <div class="stat-sub">ທະນາຄານໂອນ: BCEL: ${bcelCount} | LDB: ${ldbCount}</div>
      </div>
    `;

    // Render Report Table
    els.dashTableBody.innerHTML = '';
    if (dashboardTransactions.length === 0) {
      els.dashTableBody.innerHTML = `<tr><td colspan="7" style="text-align: center; color: var(--text-secondary);">ບໍ່ມີຂໍ້ມູນການຂາຍໃນໄລຍະເວລານີ້</td></tr>`;
    } else {
      dashboardTransactions.forEach(tx => {
        const tr = document.createElement('tr');
        
        let amountDisplay = '';
        if (tx.paid_currency === 'LAK') amountDisplay = formatNumber(tx.total_lak) + ' ₭';
        else if (tx.paid_currency === 'THB') amountDisplay = formatNumber(tx.total_thb) + ' ฿';
        else if (tx.paid_currency === 'CNY') amountDisplay = formatNumber(tx.total_cny) + ' ¥';

        tr.innerHTML = `
          <td style="font-weight:700;">${tx.id}</td>
          <td>${new Date(tx.timestamp).toLocaleString('lo-LA')}</td>
          <td>${tx.pos}</td>
          <td>${tx.cashier}</td>
          <td><span class="badge ${tx.payment_type === 'ເງິນສົດ' ? 'cash' : 'transfer'}">${tx.payment_type} ${tx.bank ? `(${tx.bank})` : ''}</span></td>
          <td style="font-weight:700;">${amountDisplay}</td>
          <td>
            <button class="secondary-btn" style="padding: 4px 8px; font-size: 0.75rem;" onclick="window.reprintInvoice('${tx.id}')">
              <i class="fas fa-print"></i>
            </button>
            ${isAdminPOS ? `
            <button class="secondary-btn" style="padding: 4px 8px; font-size: 0.75rem; color:var(--danger-color);" onclick="window.deleteInvoice('${tx.id}')">
              <i class="fas fa-trash-alt"></i>
            </button>
            ` : ''}
          </td>
        `;
        els.dashTableBody.appendChild(tr);
      });
    }

    // =========================================================================
    // SALES TREND CHART GENERATOR (Chart.js)
    // =========================================================================
    let labels = [];
    let dataValues = [];

    const chartCurrency = document.getElementById('chart-currency');
    const selectedCurrency = chartCurrency ? chartCurrency.value : 'COMBINED_LAK';
    const symbol = getCurrencySymbol(selectedCurrency);

    function getTxAmount(tx, currency) {
      if (currency === 'COMBINED_LAK') return tx.total_lak || 0;
      if (currency === 'COMBINED_THB') return tx.total_thb || 0;
      if (currency === 'LAK') return tx.paid_currency === 'LAK' ? (tx.total_lak || 0) : 0;
      if (currency === 'THB') return tx.paid_currency === 'THB' ? (tx.total_thb || 0) : 0;
      if (currency === 'CNY') return tx.paid_currency === 'CNY' ? (tx.total_cny || 0) : 0;
      return 0;
    }

    function getCurrencySymbol(currency) {
      if (currency === 'COMBINED_LAK' || currency === 'LAK') return '₭';
      if (currency === 'COMBINED_THB' || currency === 'THB') return '฿';
      if (currency === 'CNY') return '¥';
      return '';
    }

    function getDatesInRange(startDateStr, endDateStr) {
      const dates = [];
      let [y1, m1, d1] = startDateStr.split('-').map(Number);
      let [y2, m2, d2] = endDateStr.split('-').map(Number);
      let start = new Date(y1, m1 - 1, d1);
      const end = new Date(y2, m2 - 1, d2);
      while (start <= end) {
        const y = start.getFullYear();
        const m = String(start.getMonth() + 1).padStart(2, '0');
        const d = String(start.getDate()).padStart(2, '0');
        dates.push(`${y}-${m}-${d}`);
        start.setDate(start.getDate() + 1);
      }
      return dates;
    }

    function getMonthsInRange(startDateStr, endDateStr) {
      const months = [];
      let [y1, m1] = startDateStr.split('-').map(Number);
      let [y2, m2] = endDateStr.split('-').map(Number);
      let start = new Date(y1, m1 - 1, 1);
      const end = new Date(y2, m2 - 1, 1);
      while (start <= end) {
        const y = start.getFullYear();
        const m = String(start.getMonth() + 1).padStart(2, '0');
        months.push(`${y}-${m}`);
        start.setMonth(start.getMonth() + 1);
      }
      return months;
    }

    if (chartMode === 'daily') {
      labels = getDatesInRange(start, end);
      const sums = {};
      labels.forEach(l => sums[l] = 0);
      
      dashboardTransactions.forEach(tx => {
        const dateStr = tx.timestamp.split('T')[0];
        if (sums[dateStr] !== undefined) {
          sums[dateStr] += getTxAmount(tx, selectedCurrency);
        }
      });
      dataValues = labels.map(l => sums[l]);
    } else if (chartMode === 'monthly') {
      let [y1, m1] = start.split('-').map(Number);
      let monthStart = `${y1}-${String(m1).padStart(2, '0')}-01`;
      
      let [y2, m2] = end.split('-').map(Number);
      let lastDay = new Date(y2, m2, 0).getDate();
      let monthEnd = `${y2}-${String(m2).padStart(2, '0')}-${String(lastDay).padStart(2, '0')}`;

      labels = getDatesInRange(monthStart, monthEnd);
      const sums = {};
      labels.forEach(l => sums[l] = 0);
      
      const chartTxs = allTx.filter(tx => {
        const txDate = tx.timestamp.split('T')[0];
        const matchDate = txDate >= monthStart && txDate <= monthEnd;
        
        let matchPOS = false;
        if (selectedPOS === 'all') {
          matchPOS = true;
        } else if (selectedPOS.startsWith('service:')) {
          const targetService = selectedPOS.substring(8);
          const txServiceType = tx.serviceType || (state.settings.pos_points.find(p => p.name === tx.pos)?.serviceType);
          matchPOS = txServiceType === targetService;
        } else if (selectedPOS.startsWith('pos:')) {
          const targetPOS = selectedPOS.substring(4);
          matchPOS = tx.pos === targetPOS;
        } else {
          matchPOS = tx.pos === selectedPOS;
        }
        return matchDate && matchPOS;
      });

      chartTxs.forEach(tx => {
        const dateStr = tx.timestamp.split('T')[0];
        if (sums[dateStr] !== undefined) {
          sums[dateStr] += getTxAmount(tx, selectedCurrency);
        }
      });
      dataValues = labels.map(l => sums[l]);
    } else if (chartMode === 'allmonths') {
      const chartTxs = allTx.filter(tx => {
        let matchPOS = false;
        if (selectedPOS === 'all') {
          matchPOS = true;
        } else if (selectedPOS.startsWith('service:')) {
          const targetService = selectedPOS.substring(8);
          const txServiceType = tx.serviceType || (state.settings.pos_points.find(p => p.name === tx.pos)?.serviceType);
          matchPOS = txServiceType === targetService;
        } else if (selectedPOS.startsWith('pos:')) {
          const targetPOS = selectedPOS.substring(4);
          matchPOS = tx.pos === targetPOS;
        } else {
          matchPOS = tx.pos === selectedPOS;
        }
        return matchPOS;
      });
      
      let minDate = new Date().toISOString().split('T')[0];
      let maxDate = minDate;
      if (chartTxs.length > 0) {
        const sortedTimestamps = chartTxs.map(t => t.timestamp).sort();
        minDate = sortedTimestamps[0].split('T')[0];
        maxDate = sortedTimestamps[sortedTimestamps.length - 1].split('T')[0];
      }
      labels = getMonthsInRange(minDate, maxDate);
      const sums = {};
      labels.forEach(l => sums[l] = 0);
      
      chartTxs.forEach(tx => {
        const monthStr = tx.timestamp.split('T')[0].slice(0, 7);
        if (sums[monthStr] !== undefined) {
          sums[monthStr] += getTxAmount(tx, selectedCurrency);
        }
      });
      dataValues = labels.map(l => sums[l]);
    }

    const displayLabels = labels.map(l => {
      if (l.length === 10) {
        const [y, m, d] = l.split('-');
        return `${d}/${m}/${y}`;
      }
      if (l.length === 7) {
        const [y, m] = l.split('-');
        return `${m}/${y}`;
      }
      return l;
    });

    if (salesChartInstance) {
      salesChartInstance.destroy();
      salesChartInstance = null;
    }

    const canvasEl = document.getElementById('salesChart');
    if (canvasEl && typeof Chart !== 'undefined') {
      const ctx = canvasEl.getContext('2d');
      const gradient = ctx.createLinearGradient(0, 0, 0, 300);
      gradient.addColorStop(0, 'rgba(15, 118, 110, 0.4)');
      gradient.addColorStop(1, 'rgba(15, 118, 110, 0.0)');
      
      salesChartInstance = new Chart(ctx, {
        type: 'line',
        data: {
          labels: displayLabels,
          datasets: [{
            label: 'ຍອດຂາຍ (Sales)',
            data: dataValues,
            borderColor: '#0f766e',
            borderWidth: 2,
            backgroundColor: gradient,
            fill: true,
            tension: 0.3,
            pointBackgroundColor: '#0f766e',
            pointBorderColor: '#fff',
            pointHoverRadius: 6,
            pointHoverBackgroundColor: '#0f766e',
            pointHoverBorderColor: '#fff',
            pointRadius: 4
          }]
        },
        options: {
          responsive: true,
          maintainAspectRatio: false,
          plugins: {
            legend: {
              display: false
            },
            tooltip: {
              bodyFont: {
                family: 'Outfit, Noto Sans Lao'
              },
              titleFont: {
                family: 'Outfit, Noto Sans Lao'
              },
              callbacks: {
                label: function(context) {
                  return 'ຍອດຂາຍ: ' + formatNumber(context.parsed.y) + ' ' + symbol;
                }
              }
            }
          },
          scales: {
            x: {
              grid: {
                display: false
              },
              ticks: {
                font: {
                  family: 'Outfit, Noto Sans Lao',
                  size: 11
                }
              }
            },
            y: {
              grid: {
                color: '#e6dfd3'
              },
              ticks: {
                font: {
                  family: 'Outfit, Noto Sans Lao',
                  size: 11
                },
                callback: function(value) {
                  return formatNumber(value) + ' ' + symbol;
                }
              }
            }
          }
        }
      });
    }

    // =========================================================================
    // DAILY REVENUE SUMMARY BY POS CARD
    // =========================================================================
    const posDailyData = {};
    dashboardTransactions.forEach(tx => {
      const dateStr = tx.timestamp.split('T')[0];
      const posName = tx.pos;
      if (!posDailyData[dateStr]) {
        posDailyData[dateStr] = {};
      }
      if (!posDailyData[dateStr][posName]) {
        posDailyData[dateStr][posName] = { lak: 0, thb: 0, cny: 0 };
      }
      posDailyData[dateStr][posName].lak += tx.total_lak || 0;
      posDailyData[dateStr][posName].thb += tx.total_thb || 0;
      posDailyData[dateStr][posName].cny += tx.total_cny || 0;
    });

    const sortedDates = Object.keys(posDailyData).sort().reverse();
    let posSummaryHTML = '';

    if (sortedDates.length === 0) {
      posSummaryHTML = `<div style="text-align: center; color: var(--text-secondary); padding: 20px; font-size: 0.85rem;">ບໍ່ມີຂໍ້ມູນສະຫຼຸບຈຸດຂາຍ</div>`;
    } else {
      sortedDates.forEach(dateStr => {
        const [y, m, d] = dateStr.split('-');
        const formattedDate = `${d}/${m}/${y}`;
        
        let rowsHtml = '';
        let dayTotalLak = 0;
        let dayTotalThb = 0;
        let dayTotalCny = 0;
        
        const posNames = Object.keys(posDailyData[dateStr]).sort();
        posNames.forEach(posName => {
          const metrics = posDailyData[dateStr][posName];
          dayTotalLak += metrics.lak;
          dayTotalThb += metrics.thb;
          dayTotalCny += metrics.cny;
          
          rowsHtml += `
            <tr>
              <td style="font-weight: 500; font-size: 0.8rem; padding: 6px 8px;">${posName}</td>
              <td class="right" style="font-size: 0.8rem; padding: 6px 8px;">${formatNumber(metrics.lak)} ₭</td>
              <td class="right" style="font-size: 0.8rem; padding: 6px 8px;">${formatNumber(metrics.thb)} ฿</td>
              <td class="right" style="font-size: 0.8rem; padding: 6px 8px;">${formatNumber(metrics.cny)} ¥</td>
            </tr>
          `;
        });
        
        const rateLak = state.settings.exchange_rate_lak;
        const rateCny = state.settings.exchange_rate_cny;
        const dayCombinedLak = dayTotalLak + (dayTotalThb * rateLak) + (dayTotalCny * (rateLak / rateCny));
        
        posSummaryHTML += `
          <div style="margin-bottom: 24px; border: 1px solid var(--border-color); border-radius: var(--radius-md); padding: 12px; background: #fff;">
            <div style="font-weight: 700; font-size: 0.9rem; margin-bottom: 8px; color: var(--primary-accent); border-bottom: 1px solid var(--border-color); padding-bottom: 4px;">
              <i class="fas fa-calendar-day"></i> ວັນທີ ${formattedDate}
            </div>
            <table class="report-table" style="width: 100%; font-size: 0.8rem; margin-bottom: 8px;">
              <thead>
                <tr style="background: #faf9f6;">
                  <th style="padding: 6px 8px; font-size: 0.75rem;">ຈຸດຂາຍ (POS)</th>
                  <th class="right" style="padding: 6px 8px; font-size: 0.75rem;">ກີບ (LAK)</th>
                  <th class="right" style="padding: 6px 8px; font-size: 0.75rem;">ບາດ (THB)</th>
                  <th class="right" style="padding: 6px 8px; font-size: 0.75rem;">ຢວນ (CNY)</th>
                </tr>
              </thead>
              <tbody>
                ${rowsHtml}
                <tr style="background: #f5f4f0; font-weight: 700;">
                  <td style="padding: 6px 8px; font-size: 0.8rem;">ລວມຍອດ (Daily Total)</td>
                  <td class="right" style="padding: 6px 8px; font-size: 0.8rem; color: var(--success-color);">${formatNumber(dayTotalLak)} ₭</td>
                  <td class="right" style="padding: 6px 8px; font-size: 0.8rem; color: var(--success-color);">${formatNumber(dayTotalThb)} ฿</td>
                  <td class="right" style="padding: 6px 8px; font-size: 0.8rem; color: var(--success-color);">${formatNumber(dayTotalCny)} ¥</td>
                </tr>
              </tbody>
            </table>
            <div style="font-size: 0.75rem; color: var(--text-secondary); text-align: right; font-weight: 600; padding-top: 4px;">
              ລວມທັງໝົດທຽບເທົ່າກີບ: <span style="color: var(--primary-accent);">${formatNumber(dayCombinedLak)} ₭</span>
            </div>
          </div>
        `;
      });
    }

    const posContainer = document.getElementById('pos-summary-container');
    if (posContainer) {
      posContainer.innerHTML = posSummaryHTML;
    }

    renderPOSChart(allTx);
  }

  function updatePOSChartToggles() {
    const btnDaily = document.getElementById('pos-chart-btn-daily');
    const btnMonthly = document.getElementById('pos-chart-btn-monthly');
    const btnYearly = document.getElementById('pos-chart-btn-yearly');
    
    if (btnDaily) btnDaily.classList.toggle('active', posChartMode === 'daily');
    if (btnMonthly) btnMonthly.classList.toggle('active', posChartMode === 'monthly');
    if (btnYearly) btnYearly.classList.toggle('active', posChartMode === 'yearly');
  }

  function renderPOSChart(allTx) {
    const start = els.startDateFilter.value;
    const end = els.endDateFilter.value;
    const selectedPOS = els.dashPOSFilter.value;

    const chartCurrency = document.getElementById('chart-currency');
    const selectedCurrency = chartCurrency ? chartCurrency.value : 'COMBINED_LAK';
    const symbol = getCurrencySymbol(selectedCurrency);

    function getTxAmount(tx, currency) {
      if (currency === 'COMBINED_LAK') return tx.total_lak || 0;
      if (currency === 'COMBINED_THB') return tx.total_thb || 0;
      if (currency === 'LAK') return tx.paid_currency === 'LAK' ? (tx.total_lak || 0) : 0;
      if (currency === 'THB') return tx.paid_currency === 'THB' ? (tx.total_thb || 0) : 0;
      if (currency === 'CNY') return tx.paid_currency === 'CNY' ? (tx.total_cny || 0) : 0;
      return 0;
    }

    function getCurrencySymbol(currency) {
      if (currency === 'COMBINED_LAK' || currency === 'LAK') return '₭';
      if (currency === 'COMBINED_THB' || currency === 'THB') return '฿';
      if (currency === 'CNY') return '¥';
      return '';
    }

    function getDatesInRange(startDateStr, endDateStr) {
      const dates = [];
      let [y1, m1, d1] = startDateStr.split('-').map(Number);
      let [y2, m2, d2] = endDateStr.split('-').map(Number);
      let start = new Date(y1, m1 - 1, d1);
      const end = new Date(y2, m2 - 1, d2);
      while (start <= end) {
        const y = start.getFullYear();
        const m = String(start.getMonth() + 1).padStart(2, '0');
        const d = String(start.getDate()).padStart(2, '0');
        dates.push(`${y}-${m}-${d}`);
        start.setDate(start.getDate() + 1);
      }
      return dates;
    }

    function getMonthsInRange(startDateStr, endDateStr) {
      const months = [];
      let [y1, m1] = startDateStr.split('-').map(Number);
      let [y2, m2] = endDateStr.split('-').map(Number);
      let start = new Date(y1, m1 - 1, 1);
      const end = new Date(y2, m2 - 1, 1);
      while (start <= end) {
        const y = start.getFullYear();
        const m = String(start.getMonth() + 1).padStart(2, '0');
        months.push(`${y}-${m}`);
        start.setMonth(start.getMonth() + 1);
      }
      return months;
    }

    let labels = [];
    if (posChartMode === 'daily') {
      labels = getDatesInRange(start, end);
    } else if (posChartMode === 'monthly') {
      let [y1, m1] = start.split('-').map(Number);
      let monthStart = `${y1}-${String(m1).padStart(2, '0')}-01`;
      let [y2, m2] = end.split('-').map(Number);
      let lastDay = new Date(y2, m2, 0).getDate();
      let monthEnd = `${y2}-${String(m2).padStart(2, '0')}-${String(lastDay).padStart(2, '0')}`;
      labels = getDatesInRange(monthStart, monthEnd);
    } else if (posChartMode === 'yearly') {
      let [y] = start.split('-');
      let yearStart = `${y}-01-01`;
      let yearEnd = `${y}-12-31`;
      labels = getMonthsInRange(yearStart, yearEnd);
    }

    const displayLabels = labels.map(l => {
      if (l.length === 10) {
        const [y, m, d] = l.split('-');
        return `${d}/${m}/${y}`;
      }
      if (l.length === 7) {
        const [y, m] = l.split('-');
        return `${m}/${y}`;
      }
      return l;
    });

    const activePOSList = state.settings.pos_points.filter(p => {
      if (selectedPOS === 'all') return true;
      if (selectedPOS.startsWith('service:')) {
        return p.serviceType === selectedPOS.substring(8);
      }
      if (selectedPOS.startsWith('pos:')) {
        return p.name === selectedPOS.substring(4);
      }
      return p.name === selectedPOS;
    });

    const colorPalette = [
      { border: '#0f766e', background: 'rgba(15, 118, 110, 0.05)' }, // Teal
      { border: '#3b82f6', background: 'rgba(59, 130, 246, 0.05)' }, // Blue
      { border: '#8b5cf6', background: 'rgba(139, 92, 246, 0.05)' }, // Purple
      { border: '#f59e0b', background: 'rgba(245, 158, 11, 0.05)' }, // Amber
      { border: '#ec4899', background: 'rgba(236, 72, 153, 0.05)' }, // Pink
      { border: '#10b981', background: 'rgba(16, 185, 129, 0.05)' }, // Emerald
      { border: '#6366f1', background: 'rgba(99, 102, 241, 0.05)' }, // Indigo
      { border: '#ef4444', background: 'rgba(239, 68, 68, 0.05)' },  // Red
      { border: '#06b6d4', background: 'rgba(6, 182, 212, 0.05)' },  // Cyan
      { border: '#84cc16', background: 'rgba(132, 204, 22, 0.05)' }   // Lime
    ];

    const posDatasets = activePOSList.map((p, idx) => {
      const color = colorPalette[idx % colorPalette.length];
      const data = labels.map(labelDate => {
        const txsOnDate = allTx.filter(tx => {
          const txDate = tx.timestamp.split('T')[0];
          let dateMatches = false;
          if (posChartMode === 'daily') {
            dateMatches = txDate === labelDate;
          } else if (posChartMode === 'monthly') {
            dateMatches = txDate === labelDate;
          } else if (posChartMode === 'yearly') {
            const txMonth = txDate.slice(0, 7);
            dateMatches = txMonth === labelDate;
          }
          return dateMatches && tx.pos === p.name;
        });

        let sum = 0;
        txsOnDate.forEach(tx => {
          sum += getTxAmount(tx, selectedCurrency);
        });
        return sum;
      });

      return {
        label: p.name,
        data: data,
        borderColor: color.border,
        borderWidth: 2,
        backgroundColor: color.background,
        fill: false,
        tension: 0.3,
        pointBackgroundColor: color.border,
        pointBorderColor: '#fff',
        pointHoverRadius: 6,
        pointHoverBackgroundColor: color.border,
        pointHoverBorderColor: '#fff',
        pointRadius: 4
      };
    });

    if (posChartInstance) {
      posChartInstance.destroy();
      posChartInstance = null;
    }

    const canvasEl = document.getElementById('posSalesChart');
    if (canvasEl && typeof Chart !== 'undefined') {
      const ctx = canvasEl.getContext('2d');
      posChartInstance = new Chart(ctx, {
        type: 'line',
        data: {
          labels: displayLabels,
          datasets: posDatasets
        },
        options: {
          responsive: true,
          maintainAspectRatio: false,
          plugins: {
            legend: {
              display: true,
              position: 'top',
              labels: {
                font: {
                  family: 'Outfit, Noto Sans Lao',
                  size: 11
                },
                boxWidth: 12,
                usePointStyle: true
              }
            },
            tooltip: {
              bodyFont: {
                family: 'Outfit, Noto Sans Lao'
              },
              titleFont: {
                family: 'Outfit, Noto Sans Lao'
              },
              callbacks: {
                label: function(context) {
                  return context.dataset.label + ': ' + formatNumber(context.parsed.y) + ' ' + symbol;
                }
              }
            }
          },
          scales: {
            x: {
              grid: {
                display: false
              },
              ticks: {
                font: {
                  family: 'Outfit, Noto Sans Lao',
                  size: 11
                }
              }
            },
            y: {
              grid: {
                color: 'rgba(0, 0, 0, 0.05)'
              },
              ticks: {
                font: {
                  family: 'Outfit, Noto Sans Lao',
                  size: 11
                },
                callback: function(value) {
                  return formatNumber(value) + ' ' + symbol;
                }
              }
            }
          }
        }
      });
    }
  }

  // Global reprints helper
  window.reprintInvoice = async (txId) => {
    const txs = await window.BokeoDB.getTransactions();
    const tx = txs.find(t => t.id === txId);
    if (tx) {
      await handlePDFAndPrintInvoice(tx);
    }
  };

  // Delete invoice with passcode PIN confirmation
  window.deleteInvoice = (txId) => {
    const isAdminPOS = state.currentPOS && [
      'ແອດມິນ ພະແນກ ອາຄານແລະລານຈອດ',
      'ແອດມິນ ພະແນກ ບັນຊີ-ການເງິນ',
      'ແອດມິນ ພະແນກ ຈັດຊື້-ຊັບສິນ'
    ].includes(state.currentPOS.name);

    const performDelete = async () => {
      const confirmDelete = confirm(`ທ່ານຕ້ອງການລຶບບິນ ${txId} ແທ້ຫຼືບໍ່?`);
      if (confirmDelete) {
        await window.BokeoDB.deleteTransaction(txId);
        // Reload products/dashboard
        state.products = await window.BokeoDB.getProducts();
        await loadDashboardData();
        renderProducts();
      }
    };

    if (isAdminPOS) {
      performDelete();
    } else {
      promptPIN(performDelete);
    }
  };

  /* =========================================================================
     PDF BILINGUAL SALES SUMMARY REPORTS (Lao & Chinese 100% correct)
     ========================================================================= */

  els.btnExportLaoPDF.addEventListener('click', () => {
    exportSalesSummaryPDF('lo');
  });

  els.btnExportCnyPDF.addEventListener('click', () => {
    exportSalesSummaryPDF('cn');
  });

  async function exportSalesSummaryPDF(lang) {
    if (dashboardTransactions.length === 0) {
      alert('ບໍ່ມີຂໍ້ມູນເພື່ອສົ່ງອອກລາຍງານ');
      return;
    }

    const start = els.startDateFilter.value;
    const end = els.endDateFilter.value;
    const selectedPOS = els.dashPOSFilter.value;

    const posTranslations = {
      // Service Types
      'ຮ້ານຂາຍເຄື່ອງບໍລິໂພກ': { lo: 'ຮ້ານຂາຍເຄື່ອງບໍລິໂພກ', cn: '零售商品店' },
      'ຫ້ອງ VIP': { lo: 'ຫ້ອງ VIP', cn: '贵宾厅' },
      'ບໍລິການຫຸ້ມຫໍ່ເຄື່ອງ': { lo: 'ບໍລິການຫຸ້ມຫໍ່ເຄື່ອງ', cn: '行李打包服务' },
      'ບໍລິການແທັກຊີ່': { lo: 'ບໍລິການແທັກຊີ່', cn: '出租车服务' },
      'ບໍລິການລານຈອດ': { lo: 'ບໍລິການລານຈອດ', cn: '停车场服务' },
      // POS Names
      'ຫ້ອງຂາຍເຄື່ອງ (Consumer Shop)': { lo: 'ຫ້ອງຂາຍເຄື່ອງ (Consumer Shop)', cn: '商品销售处 (Consumer Shop)' },
      'ຫ້ອງ VIP (VIP Lounge)': { lo: 'ຫ້ອງ VIP (VIP Lounge)', cn: '贵宾厅 (VIP Lounge)' },
      'ບໍລິການຫຸ້ມຫໍ່ເຄື່ອງ (Wrapping Counter)': { lo: 'ບໍລິການຫຸ້ມຫໍ່ເຄື່ອງ (Wrapping Counter)', cn: '行李打包处 (Wrapping Counter)' },
      'ເຄົາເຕີ້ແທັກຊີ່ (Taxi Counter)': { lo: 'ເຄົາເຕີ້ແທັກຊີ່ (Taxi Counter)', cn: '出租车柜台 (Taxi Counter)' },
      'ລານຈອດລົດ (Parking Lot)': { lo: 'ລານຈອດລົດ (Parking Lot)', cn: '停车场收费处 (Parking Lot)' }
    };

    let friendlyPOSLao = '';
    let friendlyPOSCn = '';

    if (selectedPOS === 'all') {
      friendlyPOSLao = 'ທັງໝົດ (All POS)';
      friendlyPOSCn = '全部销售点 (All POS)';
    } else if (selectedPOS.startsWith('service:')) {
      const serviceVal = selectedPOS.substring(8);
      const translatedService = posTranslations[serviceVal]?.cn || serviceVal;
      friendlyPOSLao = `ປະເພດບໍລິການ: ${serviceVal}`;
      friendlyPOSCn = `服务类型: ${translatedService}`;
    } else if (selectedPOS.startsWith('pos:')) {
      const posVal = selectedPOS.substring(4);
      const translatedPOS = posTranslations[posVal]?.cn || posVal;
      friendlyPOSLao = `ຈຸດຂາຍ: ${posVal}`;
      friendlyPOSCn = `销售点: ${translatedPOS}`;
    } else {
      const translatedPOS = posTranslations[selectedPOS]?.cn || selectedPOS;
      friendlyPOSLao = `ຈຸດຂາຍ: ${selectedPOS}`;
      friendlyPOSCn = `销售点: ${translatedPOS}`;
    }

    let totalLAK = 0, totalTHB = 0, totalCNY = 0;
    let transLAK = 0, transTHB = 0, transCNY = 0;
    let cashLAK = 0, cashTHB = 0, cashCNY = 0;
    let bcel = 0, ldb = 0;

    dashboardTransactions.forEach(tx => {
      totalLAK += tx.total_lak;
      totalTHB += tx.total_thb;
      totalCNY += tx.total_cny;

      if (tx.payment_type === 'ໂອນ') {
        transLAK += tx.total_lak;
        transTHB += tx.total_thb;
        transCNY += tx.total_cny;
        if (tx.bank === 'BCEL') bcel++;
        else if (tx.bank === 'LDB') ldb++;
      } else {
        cashLAK += tx.total_lak;
        cashTHB += tx.total_thb;
        cashCNY += tx.total_cny;
      }
    });

    // Petty Cash Sessions
    const allPetty = await window.BokeoDB.getPettyCashSessions();
    let startLAK = 0, startTHB = 0, startCNY = 0;
    let remainLAK = 0, remainTHB = 0, remainCNY = 0;

    allPetty.filter(p => {
      const matchDate = p.date >= start && p.date <= end;
      
      let matchPOS = false;
      if (selectedPOS === 'all') {
        matchPOS = true;
      } else if (selectedPOS.startsWith('service:')) {
        const targetService = selectedPOS.substring(8);
        const matchingPOS = state.settings.pos_points.find(point => point.name === p.pos);
        matchPOS = matchingPOS && matchingPOS.serviceType === targetService;
      } else if (selectedPOS.startsWith('pos:')) {
        const targetPOS = selectedPOS.substring(4);
        matchPOS = p.pos === targetPOS;
      } else {
        matchPOS = p.pos === selectedPOS;
      }
      return matchDate && matchPOS;
    }).forEach(p => {
      startLAK += p.lak_start;
      startTHB += p.thb_start;
      startCNY += p.cny_start;
      remainLAK += p.lak_remaining;
      remainTHB += p.thb_remaining;
      remainCNY += p.cny_remaining;
    });

    // Content translations
    const texts = {
      lo: {
        title: 'ລາຍງານສະຫຼຸບຍອດຂາຍປະຈຳວັນ',
        sub: 'ສະໜາມບິນສາກົນບໍ່ແກ້ວ - Bokeo International Airport',
        date: `ໄລຍະເວລາ: ວັນທີ ${start} ຫາ ${end}`,
        pos: `ຈຸດຂາຍ: ${friendlyPOSLao}`,
        totalSales: 'ຍອດຂາຍລວມທັງໝົດ',
        cashSales: 'ຍອດຂາຍເງິນສົດ',
        transSales: 'ຍອດຂາຍເງິນໂອນ',
        bankCount: 'ຈຳນວນທຸລະກຳໂອນ',
        pettyStart: 'ເງິນທອນເລີ່ມຕົ້ນ',
        pettyRemain: 'ເງິນທອນຄົງເຫຼືອ',
        txList: 'ລາຍການທຸລະກຳການຂາຍ',
        invNo: 'ເລກບິນ',
        time: 'ເວລາ',
        cashier: 'ພະນັກງານຂາຍ',
        type: 'ປະເພດການຊຳລະ',
        amount: 'ຍອດຊຳລະ',
        posSummaryTitle: 'ສະຫຼຸບລາຍຮັບແຍກຕາມຈຸດຂາຍລາຍວັນ',
        posCol: 'ຈຸດຂາຍ',
        lakCol: 'ກີບ (LAK)',
        thbCol: 'ບາດ (THB)',
        cnyCol: 'ຢວນ (CNY)',
        dailyTotal: 'ລວມຍອດປະຈຳວັນ',
        combinedLak: 'ລວມທັງໝົດທຽບເທົ່າກີບ',
        deptTitle: 'ພະແນກ ບັນຊີ - ການເງິນ',
        deptSub: 'Accounting Department',
        middleTitle: 'ຫົວໜ້າພະແນກ ອາຄານ ແລະ ລານຈອດ',
        middleSub: 'Terminal & Parking Lot Dept',
        cashierTitle: 'ພະນັກງານຂາຍຜູ້ສະຫຼຸບ',
        cashierSub: 'Cashier Signature'
      },
      cn: {
        title: '机场销售日结汇总报告',
        sub: '博胶国际机场 - Bokeo International Airport',
        date: `报告周期: ${start} 至 ${end}`,
        pos: `销售点: ${friendlyPOSCn}`,
        totalSales: '总销售营业额',
        cashSales: '现金销售额',
        transSales: '银行转账额',
        bankCount: '转账交易笔数',
        pettyStart: '期初零花钱备用金',
        pettyRemain: '期末零花钱备用金',
        txList: '交易流水明细',
        invNo: '账单号',
        time: '交易时间',
        cashier: '收银员',
        type: '结算方式',
        amount: '实付金额',
        posSummaryTitle: '各销售点日销售额汇总',
        posCol: '销售点',
        lakCol: '基普 (LAK)',
        thbCol: '泰铢 (THB)',
        cnyCol: '人民币 (CNY)',
        dailyTotal: '日结总计',
        combinedLak: '折合基普总额',
        deptTitle: '财务与会计部',
        deptSub: 'Accounting & Finance Dept',
        middleTitle: '站楼与停车场部',
        middleSub: 'Terminal & Parking Lot Dept',
        cashierTitle: '收银员签字',
        cashierSub: 'Cashier Signature'
      }
    };

    const t = texts[lang];

    // Generate Daily POS Summary table for PDF
    const pdfPosDailyData = {};
    dashboardTransactions.forEach(tx => {
      const dateStr = tx.timestamp.split('T')[0];
      const posName = tx.pos;
      if (!pdfPosDailyData[dateStr]) {
        pdfPosDailyData[dateStr] = {};
      }
      if (!pdfPosDailyData[dateStr][posName]) {
        pdfPosDailyData[dateStr][posName] = { lak: 0, thb: 0, cny: 0 };
      }
      pdfPosDailyData[dateStr][posName].lak += tx.total_lak || 0;
      pdfPosDailyData[dateStr][posName].thb += tx.total_thb || 0;
      pdfPosDailyData[dateStr][posName].cny += tx.total_cny || 0;
    });

    const pdfSortedDates = Object.keys(pdfPosDailyData).sort().reverse();
    let pdfPosSummaryHTML = '';

    if (pdfSortedDates.length > 0) {
      pdfPosSummaryHTML = `
        <h3 style="font-size: 1.1rem; border-bottom: 2px solid #333; padding-bottom: 6px; margin-top: 24px; margin-bottom: 12px;">${t.posSummaryTitle}</h3>
      `;
      
      pdfSortedDates.forEach(dateStr => {
        const [y, m, d] = dateStr.split('-');
        const formattedDate = `${d}/${m}/${y}`;
        
        let rowsHtml = '';
        let dayTotalLak = 0;
        let dayTotalThb = 0;
        let dayTotalCny = 0;
        
        const posNames = Object.keys(pdfPosDailyData[dateStr]).sort();
        posNames.forEach(posName => {
          const metrics = pdfPosDailyData[dateStr][posName];
          dayTotalLak += metrics.lak;
          dayTotalThb += metrics.thb;
          dayTotalCny += metrics.cny;
          
          const translatedPOSName = lang === 'cn' ? (posTranslations[posName]?.cn || posName) : posName;
          rowsHtml += `
            <tr style="page-break-inside: avoid; break-inside: avoid;">
              <td style="padding: 6px 8px; border: 1px solid #ddd; font-size: 0.75rem;">${translatedPOSName}</td>
              <td style="padding: 6px 8px; border: 1px solid #ddd; text-align: right; font-size: 0.75rem;">${formatNumber(metrics.lak)} ₭</td>
              <td style="padding: 6px 8px; border: 1px solid #ddd; text-align: right; font-size: 0.75rem;">${formatNumber(metrics.thb)} ฿</td>
              <td style="padding: 6px 8px; border: 1px solid #ddd; text-align: right; font-size: 0.75rem;">${formatNumber(metrics.cny)} ¥</td>
            </tr>
          `;
        });
        
        const rateLak = state.settings.exchange_rate_lak;
        const rateCny = state.settings.exchange_rate_cny;
        const dayCombinedLak = dayTotalLak + (dayTotalThb * rateLak) + (dayTotalCny * (rateLak / rateCny));
        
        pdfPosSummaryHTML += `
          <div style="margin-bottom: 16px; page-break-inside: avoid; break-inside: avoid;">
            <div style="font-weight: 700; font-size: 0.85rem; margin-bottom: 4px; color: #115e59;">
              📅 ${formattedDate}
            </div>
            <table style="width: 100%; border-collapse: collapse; text-align: left; font-size: 0.75rem; margin-bottom: 4px;">
              <thead>
                <tr style="background-color: #f2f2f2;">
                  <th style="padding: 6px 8px; border: 1px solid #ddd; font-size: 0.75rem; width: 40%;">${t.posCol}</th>
                  <th style="padding: 6px 8px; border: 1px solid #ddd; text-align: right; font-size: 0.75rem;">${t.lakCol}</th>
                  <th style="padding: 6px 8px; border: 1px solid #ddd; text-align: right; font-size: 0.75rem;">${t.thbCol}</th>
                  <th style="padding: 6px 8px; border: 1px solid #ddd; text-align: right; font-size: 0.75rem;">${t.cnyCol}</th>
                </tr>
              </thead>
              <tbody>
                ${rowsHtml}
                <tr style="background-color: #fafafa; font-weight: 700; page-break-inside: avoid; break-inside: avoid;">
                  <td style="padding: 6px 8px; border: 1px solid #ddd; font-size: 0.75rem;">${t.dailyTotal}</td>
                  <td style="padding: 6px 8px; border: 1px solid #ddd; text-align: right; font-size: 0.75rem; color: #115e59;">${formatNumber(dayTotalLak)} ₭</td>
                  <td style="padding: 6px 8px; border: 1px solid #ddd; text-align: right; font-size: 0.75rem; color: #115e59;">${formatNumber(dayTotalThb)} ฿</td>
                  <td style="padding: 6px 8px; border: 1px solid #ddd; text-align: right; font-size: 0.75rem; color: #115e59;">${formatNumber(dayTotalCny)} ¥</td>
                </tr>
              </tbody>
            </table>
            <div style="font-size: 0.75rem; color: #555; text-align: right; font-weight: 600; padding-top: 2px;">
              ${t.combinedLak}: <span style="color: #0f766e;">${formatNumber(dayCombinedLak)} ₭</span>
            </div>
          </div>
        `;
      });
    }

    // Create Report DOM for PDF conversion
    const reportDiv = document.createElement('div');
    reportDiv.style.padding = '20px';
    reportDiv.style.fontFamily = 'var(--font-family)';
    reportDiv.style.color = '#000';

    reportDiv.innerHTML = `
      <div style="text-align:center; margin-bottom: 24px;">
        <h2 style="font-size: 1.6rem; margin-bottom: 4px;">${t.title}</h2>
        <h4 style="font-size: 0.95rem; font-weight: 500; color: #444; margin-bottom: 8px;">${t.sub}</h4>
        <p style="font-size: 0.85rem; color: #555;">${t.date} | ${t.pos}</p>
      </div>

      <div style="display: grid; grid-template-columns: repeat(2, 1fr); gap: 16px; margin-bottom: 24px; page-break-inside: avoid; break-inside: avoid;">
        <div style="border: 1px solid #ddd; padding: 16px; border-radius: 8px; background: #fafafa;">
          <h4 style="margin-bottom: 12px; border-bottom: 1px solid #ddd; padding-bottom: 6px;">${t.totalSales}</h4>
          <p><strong>LAK:</strong> ${formatNumber(totalLAK)} ₭</p>
          <p><strong>THB:</strong> ${formatNumber(totalTHB)} ฿</p>
          <p><strong>CNY:</strong> ${formatNumber(totalCNY)} ¥</p>
        </div>
        <div style="border: 1px solid #ddd; padding: 16px; border-radius: 8px; background: #fafafa;">
          <h4 style="margin-bottom: 12px; border-bottom: 1px solid #ddd; padding-bottom: 6px;">${t.cashSales} & ${t.pettyRemain}</h4>
          <p><strong>LAK (ເງິນສົດ/零花钱备用金):</strong> ${formatNumber(remainLAK)} ₭ (ເລີ່ມ: ${formatNumber(startLAK)})</p>
          <p><strong>THB (ເງິນສົດ/零花钱备用金):</strong> ${formatNumber(remainTHB)} ฿ (ເລີ່ມ: ${formatNumber(startTHB)})</p>
          <p><strong>CNY (ເງິນສົດ/零花钱备用金):</strong> ${formatNumber(remainCNY)} ¥ (ເລີ່ມ: ${formatNumber(startCNY)})</p>
        </div>
        <div style="border: 1px solid #ddd; padding: 16px; border-radius: 8px; background: #fafafa;">
          <h4 style="margin-bottom: 12px; border-bottom: 1px solid #ddd; padding-bottom: 6px;">${t.transSales}</h4>
          <p><strong>LAK:</strong> ${formatNumber(transLAK)} ₭</p>
          <p><strong>THB:</strong> ${formatNumber(transTHB)} ฿</p>
          <p><strong>CNY:</strong> ${formatNumber(transCNY)} ¥</p>
        </div>
        <div style="border: 1px solid #ddd; padding: 16px; border-radius: 8px; background: #fafafa;">
          <h4 style="margin-bottom: 12px; border-bottom: 1px solid #ddd; padding-bottom: 6px;">${t.bankCount}</h4>
          <p><strong>BCEL OnePay:</strong> ${bcel} 笔 / 笔</p>
          <p><strong>LDB Bank:</strong> ${ldb} 笔 / 笔</p>
        </div>
      </div>

      ${pdfPosSummaryHTML}

      <h3 style="font-size: 1.1rem; border-bottom: 2px solid #333; padding-bottom: 6px; margin-top: 24px; margin-bottom: 12px; page-break-inside: avoid; break-inside: avoid;">${t.txList}</h3>
      <table style="width: 100%; border-collapse: collapse; text-align: left; font-size: 0.8rem;">
        <thead>
          <tr style="background-color: #f2f2f2;">
            <th style="padding: 8px; border: 1px solid #ddd;">${t.invNo}</th>
            <th style="padding: 8px; border: 1px solid #ddd;">${t.time}</th>
            <th style="padding: 8px; border: 1px solid #ddd;">${lang === 'cn' ? '销售点' : 'ຈຸດຂາຍ'}</th>
            <th style="padding: 8px; border: 1px solid #ddd;">${t.cashier}</th>
            <th style="padding: 8px; border: 1px solid #ddd;">${t.type}</th>
            <th style="padding: 8px; border: 1px solid #ddd; text-align: right;">${t.amount}</th>
          </tr>
        </thead>
        <tbody>
          ${dashboardTransactions.map(tx => {
            let val = 0;
            let sym = '';
            if (tx.paid_currency === 'LAK') { val = tx.total_lak; sym = '₭'; }
            else if (tx.paid_currency === 'THB') { val = tx.total_thb; sym = '฿'; }
            else if (tx.paid_currency === 'CNY') { val = tx.total_cny; sym = '¥'; }

            let displayPaymentType = tx.payment_type;
            if (lang === 'cn') {
              if (displayPaymentType === 'ເງິນສົດ') {
                displayPaymentType = '现金';
              } else if (displayPaymentType === 'ໂອນ') {
                displayPaymentType = '转账';
              }
            }

            const displayPOS = lang === 'cn' ? (posTranslations[tx.pos]?.cn || tx.pos) : tx.pos;

            return `
              <tr style="page-break-inside: avoid; break-inside: avoid;">
                <td style="padding: 8px; border: 1px solid #ddd; font-weight: 700;">${tx.id}</td>
                <td style="padding: 8px; border: 1px solid #ddd;">${new Date(tx.timestamp).toLocaleTimeString('lo-LA')}</td>
                <td style="padding: 8px; border: 1px solid #ddd;">${displayPOS}</td>
                <td style="padding: 8px; border: 1px solid #ddd;">${tx.cashier}</td>
                <td style="padding: 8px; border: 1px solid #ddd;">${displayPaymentType} ${tx.bank ? `(${tx.bank})` : ''}</td>
                <td style="padding: 8px; border: 1px solid #ddd; text-align: right; font-weight: 700;">${formatNumber(val)} ${sym}</td>
              </tr>
            `;
          }).join('')}
        </tbody>
      </table>

      <div style="margin-top: 40px; display: flex; justify-content: space-between; font-size: 0.85rem; page-break-inside: avoid; break-inside: avoid;">
        <div style="text-align: center; width: 220px; page-break-inside: avoid; break-inside: avoid;">
          <p>${t.deptTitle}</p>
          <p style="margin-top: 40px; border-top: 1px dashed #333; padding-top: 4px;">${t.deptSub}</p>
        </div>
        <div style="text-align: center; width: 220px; page-break-inside: avoid; break-inside: avoid;">
          <p>${t.middleTitle}</p>
          <p style="margin-top: 40px; border-top: 1px dashed #333; padding-top: 4px;">${t.middleSub}</p>
        </div>
        <div style="text-align: center; width: 200px; page-break-inside: avoid; break-inside: avoid;">
          <p>${t.cashierTitle}</p>
          <p style="margin-top: 40px; border-top: 1px dashed #333; padding-top: 4px;">${t.cashierSub}</p>
        </div>
      </div>
    `;

    document.body.appendChild(reportDiv);

    if (typeof html2pdf !== 'undefined') {
      const options = {
        margin: 10,
        filename: `Sales_Report_${lang.toUpperCase()}_${start}_to_${end}.pdf`,
        image: { type: 'jpeg', quality: 0.98 },
        html2canvas: { scale: 2 },
        jsPDF: { unit: 'mm', format: 'a4', orientation: 'portrait' },
        pagebreak: { mode: ['css', 'legacy'] }
      };

      await html2pdf().set(options).from(reportDiv).save();
    }
    
    document.body.removeChild(reportDiv);
  }

  /* =========================================================================
     STOCK MANAGEMENT (Replenishment & Deduction)
     ========================================================================= */

  function renderStockTable() {
    els.stockTableBody.innerHTML = '';
    const query = els.stockSearch.value.toLowerCase();

    // Show products
    const filtered = state.products.filter(p => 
      p.id.toLowerCase().includes(query) || 
      p.name_lo.toLowerCase().includes(query) || 
      p.name_en.toLowerCase().includes(query) ||
      p.category.toLowerCase().includes(query)
    );

    filtered.forEach(p => {
      const tr = document.createElement('tr');
      
      let stockHtml = p.stock;
      if (p.stock >= 9999) {
        stockHtml = `<span style="color:var(--text-secondary);">ບໍ່ຈຳກັດ (Service)</span>`;
      } else if (p.stock === 0) {
        stockHtml = `<span class="badge" style="background-color:#fee2e2; color:var(--danger-color); font-weight:700;">ໝົດສາງ (0)</span>`;
      } else if (p.stock < (p.max_stock || p.stock || 100) * 0.03 || p.stock <= 3) {
        stockHtml = `<span class="badge" style="background-color:#fef3c7; color:var(--warning-color); font-weight:700;">ໃກ້ໝົດ (${p.stock})</span>`;
      }

      tr.innerHTML = `
        <td style="font-weight:700;">${p.code || p.id}</td>
        <td>${p.name_lo}</td>
        <td>${p.category}</td>
        <td>${p.unit || 'ຊິ້ນ'}</td>
        <td>${formatNumber(p.cost_thb)} ฿</td>
        <td style="font-weight:700; text-align: center;">${stockHtml}</td>
        <td>
          <button class="secondary-btn" style="padding: 4px 8px; font-size: 0.75rem;" onclick="window.openRestockModal('${p.id}')">
            <i class="fas fa-plus"></i> ເຕີມສິນຄ້າ
          </button>
        </td>
      `;
      els.stockTableBody.appendChild(tr);
    });
    checkLowStockAlerts();
  }

  els.stockSearch.addEventListener('input', renderStockTable);

  // Open Restock Modal
  window.openRestockModal = (productId) => {
    els.restockProductSelect.innerHTML = '';
    
    state.products.forEach(p => {
      if (p.stock < 9999) { // Only restock physical items
        const opt = document.createElement('option');
        opt.value = p.id;
        opt.textContent = `${p.name_lo} (ຄັງເຫຼືອ: ${p.stock})`;
        if (p.id === productId) opt.selected = true;
        els.restockProductSelect.appendChild(opt);
      }
    });

    els.restockQtyInput.value = '';
    els.restockModal.classList.add('active');
  };

  els.confirmRestockBtn.addEventListener('click', async () => {
    const pId = els.restockProductSelect.value;
    const qty = parseInt(els.restockQtyInput.value) || 0;

    if (qty <= 0) {
      alert('ກະລຸນາໃສ່ຈຳນວນທີ່ຖືກຕ້ອງ');
      return;
    }

    const product = state.products.find(p => p.id === pId);
    if (product) {
      // replenishing stock
      product.stock += qty;
      await window.BokeoDB.saveProduct(product);
      
      // Sync to Google Sheet in background
      if (state.settings.gdrive_script_url) {
        syncProductStockToGoogleSheets(product.id, qty, product.stock);
      }
      
      // reload
      state.products = await window.BokeoDB.getProducts();
      renderStockTable();
      renderProducts();
      els.restockModal.classList.remove('active');
    }
  });

  // Close restock modal
  document.querySelector('#restock-modal .close-modal-btn').addEventListener('click', () => {
    els.restockModal.classList.remove('active');
  });

  /* =========================================================================
     SETTINGS & CALIBRATION (PIN, Rates, QR uploads, Cashiers, POS)
     ========================================================================= */

  function renderSettingsPage() {
    const s = state.settings;
    els.settingsRatesThbLak.value = s.exchange_rate_lak;
    els.settingsRatesThbCny.value = s.exchange_rate_cny;
    els.settingsAdminPin.value = s.admin_pin;
    els.settingsFirebaseConfig.value = s.firebase_config ? JSON.stringify(s.firebase_config, null, 2) : '';
    els.settingsGDriveScriptUrl.value = s.gdrive_script_url || '';
    if (els.settingsGDriveFolderId) {
      els.settingsGDriveFolderId.value = s.gdrive_folder_id || '1ao3TJesHPrdVCflFPnU6ndcGKAyVPXyC';
    }
    if (els.settingsReceiptAddress) {
      els.settingsReceiptAddress.value = s.receipt_address || 'ຈຸດບໍລິການ POS, ສະໜາມບິນສາກົນບໍ່ແກ້ວ';
    }
    if (els.settingsReceiptPhone) {
      els.settingsReceiptPhone.value = s.receipt_phone || '020 9999-8888';
    }
    if (els.settingsReceiptFooterLao) {
      els.settingsReceiptFooterLao.value = s.receipt_footer_lao || 'ຂໍຂອບໃຈ ແລະ ຍິນດີຕ້ອນຮັບອີກຄັ້ງ';
    }
    if (els.settingsReceiptFooterEng) {
      els.settingsReceiptFooterEng.value = s.receipt_footer_eng || 'Thank you, Please visit again!';
    }
    if (els.settingsReceiptSloganLao) {
      els.settingsReceiptSloganLao.value = s.receipt_slogan_lao || 'ບໍລິການດ້ວຍໃຈ ຫ່ວງໃຍທຸກການເດີນທາງ';
    }
    if (els.settingsReceiptSloganEng) {
      els.settingsReceiptSloganEng.value = s.receipt_slogan_eng || 'Service with heart, caring for every journey';
    }

    // Render QR Code Previews
    renderSettingsQRPreview('bcel_lak');
    renderSettingsQRPreview('bcel_thb');
    renderSettingsQRPreview('bcel_cny');
    renderSettingsQRPreview('ldb_lak');
    renderSettingsQRPreview('ldb_thb');
    renderSettingsQRPreview('ldb_cny');

    // Render Cashier List
    renderSettingsCashiers();

    // Render POS List
    renderSettingsPOSList();

    // Load and render membership settings
    if (els.settingsMemberThreshold) {
      els.settingsMemberThreshold.value = s.member_points_threshold !== undefined ? s.member_points_threshold : 500;
    }
    if (els.settingsMemberBelow) {
      els.settingsMemberBelow.value = s.member_points_below !== undefined ? s.member_points_below : 1;
    }
    if (els.settingsMemberAbove) {
      els.settingsMemberAbove.value = s.member_points_above !== undefined ? s.member_points_above : 10;
    }
    renderSettingsMembersTable();
  }

  function renderSettingsQRPreview(key) {
    const src = state.settings.qr_codes[key];
    const previewBox = document.getElementById(`preview-${key.replace('_', '-')}`);
    
    if (src && src.startsWith('data:image')) {
      previewBox.innerHTML = `<img src="${src}" alt="QR">`;
    } else {
      previewBox.innerHTML = `<i class="fas fa-qrcode"></i>`;
    }

    // Set up file upload trigger
    const fileInput = document.getElementById(`upload-${key.replace('_', '-')}`);
    fileInput.onchange = (e) => {
      const file = e.target.files[0];
      if (file) {
        const reader = new FileReader();
        reader.onload = async (event) => {
          state.settings.qr_codes[key] = event.target.result;
          await window.BokeoDB.saveSettings(state.settings);
          renderSettingsQRPreview(key);
        };
        reader.readAsDataURL(file);
      }
    };
  }

  function renderSettingsCashiers() {
    els.settingsCashiersList.innerHTML = '';
    state.cashiers.forEach(c => {
      const li = document.createElement('div');
      li.style.display = 'flex';
      li.style.justifyContent = 'space-between';
      li.style.alignItems = 'center';
      li.style.padding = '8px 12px';
      li.style.borderBottom = '1px solid var(--border-color)';
      
      li.innerHTML = `
        <span>${c.name}</span>
        <button class="secondary-btn" style="padding:4px 8px; color:var(--danger-color);" onclick="window.deleteCashier('${c.id}')">
          <i class="fas fa-trash-alt"></i>
        </button>
      `;
      els.settingsCashiersList.appendChild(li);
    });
  }

  window.deleteCashier = async (id) => {
    // Restrict deletion of cashiers locally
    const tx = window.BokeoDB.db.transaction('cashiers', 'readwrite');
    tx.objectStore('cashiers').delete(id);
    tx.oncomplete = async () => {
      state.cashiers = await window.BokeoDB.getCashiers();
      renderSettingsCashiers();
      populateSetupOptions();
    };
  };

  els.btnAddCashier.addEventListener('click', async () => {
    const name = els.newCashierNameInput.value.trim();
    if (!name) return;

    const newCashier = {
      id: 'cashier_' + Date.now(),
      name: name
    };

    await window.BokeoDB.saveCashier(newCashier);
    state.cashiers = await window.BokeoDB.getCashiers();
    els.newCashierNameInput.value = '';
    renderSettingsCashiers();
    populateSetupOptions();
  });

  function renderSettingsPOSList() {
    els.settingsPOSList.innerHTML = '';
    state.settings.pos_points.forEach((p, index) => {
      const li = document.createElement('div');
      li.style.display = 'flex';
      li.style.justifyContent = 'space-between';
      li.style.alignItems = 'center';
      li.style.padding = '8px 12px';
      li.style.borderBottom = '1px solid var(--border-color)';

      const trimmedName = p.name.trim();
      const isAdmin = trimmedName.startsWith('ແອດມິນ') || 
                      trimmedName.startsWith('ແອັດມິນ') || 
                      trimmedName.includes('ແອດມິນ') || 
                      trimmedName.includes('ແອັດມິນ') || 
                      trimmedName.includes('Admin') || 
                      trimmedName.includes('admin');
      const text = isAdmin ? `<strong>${p.name}</strong>` : `<strong>${p.name}</strong> (${p.serviceType})`;
      li.innerHTML = `
        <span>${text}</span>
        <button class="secondary-btn" style="padding:4px 8px; color:var(--danger-color);" onclick="window.deletePOS(${index})">
          <i class="fas fa-trash-alt"></i>
        </button>
      `;
      els.settingsPOSList.appendChild(li);
    });
  }

  window.deletePOS = async (index) => {
    state.settings.pos_points.splice(index, 1);
    await window.BokeoDB.saveSettings(state.settings);
    renderSettingsPOSList();
    populateSetupOptions();
  };

  els.btnAddPOS.addEventListener('click', async () => {
    const name = els.newPOSNameInput.value.trim();
    const service = els.newPOSServiceInput.value;
    if (!name) return;

    state.settings.pos_points.push({ name, serviceType: service });
    await window.BokeoDB.saveSettings(state.settings);
    
    els.newPOSNameInput.value = '';
    renderSettingsPOSList();
    populateSetupOptions();
  });

  // Save Settings page details
  els.settingsSaveBtn.addEventListener('click', async () => {
    const rateLak = parseFloat(els.settingsRatesThbLak.value) || DEFAULT_LAK_RATE;
    const rateCny = parseFloat(els.settingsRatesThbCny.value) || DEFAULT_CNY_RATE;
    const adminPin = els.settingsAdminPin.value.trim();
    const fbRaw = els.settingsFirebaseConfig.value.trim();

    if (adminPin.length !== 4 || isNaN(adminPin)) {
      alert('ລະຫັດ PIN ຕ້ອງເປັນຕົວເລກ 4 ຕົວ');
      return;
    }

    let fbConfig = null;
    if (fbRaw) {
      try {
        fbConfig = JSON.parse(fbRaw);
      } catch (err) {
        alert('ໂຄງສ້າງ Firebase Config JSON ບໍ່ຖືກຕ້ອງ');
        return;
      }
    }

    state.settings.exchange_rate_lak = rateLak;
    state.settings.exchange_rate_cny = rateCny;
    state.settings.admin_pin = adminPin;
    state.settings.firebase_config = fbConfig;
    state.settings.gdrive_script_url = els.settingsGDriveScriptUrl.value.trim();

    if (els.settingsMemberThreshold) {
      state.settings.member_points_threshold = parseFloat(els.settingsMemberThreshold.value) || 500;
    }
    if (els.settingsMemberBelow) {
      state.settings.member_points_below = parseFloat(els.settingsMemberBelow.value) || 1;
    }
    if (els.settingsMemberAbove) {
      state.settings.member_points_above = parseFloat(els.settingsMemberAbove.value) || 10;
    }
    if (els.settingsGDriveFolderId) {
      state.settings.gdrive_folder_id = els.settingsGDriveFolderId.value.trim();
    }
    if (els.settingsReceiptAddress) {
      state.settings.receipt_address = els.settingsReceiptAddress.value.trim();
    }
    if (els.settingsReceiptPhone) {
      state.settings.receipt_phone = els.settingsReceiptPhone.value.trim();
    }
    if (els.settingsReceiptFooterLao) {
      state.settings.receipt_footer_lao = els.settingsReceiptFooterLao.value.trim();
    }
    if (els.settingsReceiptFooterEng) {
      state.settings.receipt_footer_eng = els.settingsReceiptFooterEng.value.trim();
    }
    if (els.settingsReceiptSloganLao) {
      state.settings.receipt_slogan_lao = els.settingsReceiptSloganLao.value.trim();
    }
    if (els.settingsReceiptSloganEng) {
      state.settings.receipt_slogan_eng = els.settingsReceiptSloganEng.value.trim();
    }

    // Apply Rate Updates to Product lists
    state.products.forEach(p => {
      // Recalculate price in LAK & CNY
      p.price_lak = Math.round(p.price_thb * rateLak);
      p.price_cny = parseFloat((p.price_thb * rateCny).toFixed(2));
      window.BokeoDB.saveProduct(p);
    });

    await window.BokeoDB.saveSettings(state.settings);
    alert('ບັນທຶກການຕັ້ງຄ່າສຳເລັດແລ້ວ');
    
    // Refresh products in memory
    state.products = await window.BokeoDB.getProducts();
    renderProducts();
    updateCartUI();
  });

  /* =========================================================================
     UTIL HELPERS
     ========================================================================= */

  function formatNumber(num) {
    if (isNaN(num) || num === null || num === undefined) return '0';
    return Number(num).toLocaleString('en-US', {
      minimumFractionDigits: num % 1 === 0 ? 0 : 2,
      maximumFractionDigits: 2
    });
  }

  function getCleanFloat(val) {
    if (!val) return 0;
    const clean = String(val).replace(/[^\d\.\-]/g, '');
    return parseFloat(clean) || 0;
  }

  function isSameDay(d1Str, d2Str) {
    if (!d1Str || !d2Str) return false;
    const parse = (s) => {
      s = String(s).trim();
      if (/^\d{4}-\d{2}-\d{2}/.test(s)) {
        const p = s.split('-');
        return new Date(p[0], p[1] - 1, p[2]);
      }
      if (/^\d{1,2}\/\d{1,2}\/\d{4}/.test(s)) {
        const p = s.split('/');
        return new Date(p[2], p[1] - 1, p[0]);
      }
      const d = new Date(s);
      return isNaN(d.getTime()) ? null : d;
    };
    const date1 = parse(d1Str);
    const date2 = parse(d2Str);
    if (!date1 || !date2) return false;
    return date1.getFullYear() === date2.getFullYear() &&
           date1.getMonth() === date2.getMonth() &&
           date1.getDate() === date2.getDate();
  }

  function setupFormattedInputListener(inputEl) {
    if (!inputEl) return;
    inputEl.addEventListener('input', (e) => {
      let cursorStart = inputEl.selectionStart;
      let originalLen = inputEl.value.length;
      
      let val = inputEl.value;
      // Allow only digits and a single period
      let cleanVal = val.replace(/[^\d\.]/g, '');
      
      let parts = cleanVal.split('.');
      if (parts.length > 2) {
        parts = [parts[0], parts.slice(1).join('')];
      }
      
      parts[0] = parts[0].replace(/\B(?=(\d{3})+(?!\d))/g, ',');
      
      let formatted = parts.join('.');
      inputEl.value = formatted;
      
      // Restore cursor position
      let diff = formatted.length - originalLen;
      let newCursor = cursorStart + diff;
      inputEl.setSelectionRange(newCursor, newCursor);
    });
  }

  // Window trigger for file input on card click
  window.triggerImageUpload = (event, productId) => {
    event.stopPropagation(); // Avoid adding product to cart
    const uploader = document.getElementById('hidden-product-image-uploader');
    if (uploader) {
      uploader.value = '';
      uploader.dataset.productId = productId;
      uploader.click();
    }
  };

  // Setup hidden product image uploader listener
  const productImageUploader = document.getElementById('hidden-product-image-uploader');
  if (productImageUploader) {
    productImageUploader.addEventListener('change', (e) => {
      const file = e.target.files[0];
      const pId = productImageUploader.dataset.productId;
      if (!file || !pId) return;

      const reader = new FileReader();
      reader.onload = function(evt) {
        const img = new Image();
        img.onload = function() {
          // Compress image to 250x250 max dimensions using Canvas
          const canvas = document.createElement('canvas');
          const ctx = canvas.getContext('2d');
          const maxDim = 250;
          let w = img.width;
          let h = img.height;
          if (w > h) {
            if (w > maxDim) {
              h = Math.round(h * (maxDim / w));
              w = maxDim;
            }
          } else {
            if (h > maxDim) {
              w = Math.round(w * (maxDim / h));
              h = maxDim;
            }
          }
          canvas.width = w;
          canvas.height = h;
          ctx.drawImage(img, 0, 0, w, h);
          
          const compressedBase64 = canvas.toDataURL('image/jpeg', 0.85);
          updateProductImage(pId, compressedBase64);
        };
        img.src = evt.target.result;
      };
      reader.readAsDataURL(file);
    });
  }

  async function updateProductImage(productId, base64Image) {
    try {
      const product = state.products.find(p => p.id === productId);
      if (product) {
        product.image = base64Image;
        await window.BokeoDB.saveProduct(product);
        
        // Reload in state and re-render
        state.products = await window.BokeoDB.getProducts();
        renderProducts();
        alert('ອັບໂຫຼດຮູບພາບສິນຄ້າສຳເລັດ!');
      }
    } catch (err) {
      console.error('Failed to save product image:', err);
      alert('ບໍ່ສາມາດບັນທຶກຮູບພາບໄດ້: ' + err.message);
    }
  }

  function checkLowStockAlerts() {
    if (!state.products) return;

    // Filter low stock items: physical products with stock < 9999 and stock < 3% of max_stock (or <= 3)
    const lowStockItems = state.products.filter(p => {
      const maxStock = p.max_stock || p.stock || 100;
      const threshold = Math.max(3, Math.round(maxStock * 0.03));
      return p.stock < 9999 && p.stock < threshold;
    });

    const renderAlertHTML = (items) => {
      if (items.length === 0) return '';
      return `
        <h3><i class="fas fa-exclamation-triangle"></i> ແຈ້ງເຕືອນສະຕັອກສິນຄ້າເຫຼືອໜ້ອຍ (Low Stock Warning)</h3>
        <p style="font-size: 0.8rem; margin-bottom: 10px;">ລາຍການສິນຄ້າຕໍ່ໄປນີ້ມີຈຳນວນເຫຼືອຕ່ຳກວ່າ 3% ຫຼື ຕ່ຳກວ່າເກນປົກກະຕິ:</p>
        <ul style="margin-left: 10px;">
          ${items.map(p => {
            const max = p.max_stock || p.stock;
            const pct = max > 0 ? Math.round((p.stock / max) * 100) : 0;
            return `
              <li style="margin-bottom: 4px;">
                <i class="fas fa-circle-exclamation" style="color:var(--danger-color);"></i>
                <strong>${p.name_lo}</strong>: ເຫຼືອ ${p.stock} ${p.unit || 'ຊິ້ນ'} (${pct}% ຂອງ ${max})
              </li>
            `;
          }).join('')}
        </ul>
      `;
    };

    const alertHTML = renderAlertHTML(lowStockItems);

    // Dashboard low-stock alert disabled per user request
    // const dashAlert = document.getElementById('dash-low-stock-alert');
    const stockAlert = document.getElementById('stock-low-stock-alert');

    if (stockAlert) {
      if (alertHTML) {
        stockAlert.innerHTML = alertHTML;
        stockAlert.style.display = 'block';
      } else {
        stockAlert.style.display = 'none';
      }
    }
  }

  /* =========================================================================
     MEMBERSHIP & POINTS SYSTEM
     ========================================================================= */

  function calculateEarnedPoints(totalThb) {
    const threshold = parseFloat(state.settings.member_points_threshold) || 500;
    const below = parseFloat(state.settings.member_points_below) || 1;
    const above = parseFloat(state.settings.member_points_above) || 10;
    return totalThb < threshold ? below : above;
  }

  function calculateGrandTotalThb() {
    let subtotalThb = 0;
    state.cart.forEach(item => {
      subtotalThb += item.product.price_thb * item.qty;
    });
    const discountInput = document.getElementById('checkout-discount-input');
    const vatInput = document.getElementById('checkout-vat-input');
    const discountPercent = discountInput ? (parseFloat(discountInput.value) || 0) : 0;
    const vatPercent = vatInput ? (parseFloat(vatInput.value) || 0) : 0;

    const discountAmount = subtotalThb * (discountPercent / 100);
    const vatAmount = (subtotalThb - discountAmount) * (vatPercent / 100);
    return subtotalThb - discountAmount + vatAmount;
  }

  function updateEarnedPointsDisplay() {
    if (!state.selectedMember) return;
    const finalTotalThb = calculateGrandTotalThb();
    const earnedPoints = calculateEarnedPoints(finalTotalThb);
    if (els.selectedMemberEarned) {
      els.selectedMemberEarned.textContent = `+${earnedPoints}`;
    }
  }

  function selectCartMember(member) {
    state.selectedMember = member;
    if (els.cartMemberSearch) els.cartMemberSearch.value = '';
    if (els.memberSearchResults) els.memberSearchResults.style.display = 'none';
    if (els.memberSearchContainer) els.memberSearchContainer.style.display = 'none';
    if (els.selectedMemberCard) {
      els.selectedMemberCard.style.display = 'block';
      if (els.selectedMemberName) els.selectedMemberName.textContent = `${member.name} ${member.surname}`;
      if (els.selectedMemberId) els.selectedMemberId.textContent = `ID: ${member.id} | ເບີໂທ: ${member.phone}`;
      if (els.selectedMemberPoints) els.selectedMemberPoints.textContent = formatNumber(member.points);
      updateEarnedPointsDisplay();
    }
  }

  async function registerMemberToGoogleSheets(member) {
    const scriptUrl = state.settings.gdrive_script_url;
    if (!scriptUrl) {
      throw new Error('ກະລຸນາຕັ້ງຄ່າ Apps Script Web App URL ໃນການຕັ້ງຄ່າກ່ອນ');
    }
    const payload = {
      action: 'register_member',
      member: member
    };
    const response = await fetch(scriptUrl, {
      method: 'POST',
      mode: 'cors',
      headers: {
        'Content-Type': 'text/plain'
      },
      body: JSON.stringify(payload)
    });
    if (!response.ok) {
      throw new Error('Network response was not ok');
    }
    const resData = await response.json();
    if (resData.success) {
      return resData.member;
    } else {
      throw new Error(resData.error || 'Failed to register member on Google Sheets.');
    }
  }

  function renderSettingsMembersTable() {
    if (!els.settingsMembersTableBody) return;
    els.settingsMembersTableBody.innerHTML = '';
    
    const query = els.settingsMemberSearch ? els.settingsMemberSearch.value.trim().toLowerCase() : '';
    
    let filtered = state.members || [];
    if (query) {
      filtered = filtered.filter(m => {
        const id = (m.id || '').toLowerCase();
        const fullName = `${m.name || ''} ${m.surname || ''}`.toLowerCase();
        const phone = (m.phone || '').toLowerCase();
        const email = (m.email || '').toLowerCase();
        return id.includes(query) || fullName.includes(query) || phone.includes(query) || email.includes(query);
      });
    }

    if (filtered.length === 0) {
      els.settingsMembersTableBody.innerHTML = `<tr><td colspan="4" style="text-align:center; color:var(--text-secondary);">ບໍ່ມີຂໍ້ມູນສະມາຊິກ</td></tr>`;
      return;
    }

    filtered.forEach(m => {
      const tr = document.createElement('tr');
      tr.innerHTML = `
        <td><strong>${m.id}</strong></td>
        <td>${m.name || ''} ${m.surname || ''}</td>
        <td>${m.phone || ''}</td>
        <td style="text-align:center; font-weight:bold; color:var(--primary-accent);">${formatNumber(m.points || 0)}</td>
      `;
      els.settingsMembersTableBody.appendChild(tr);
    });
  }

  // Bind Membership events
  if (els.cartMemberSearch) {
    els.cartMemberSearch.addEventListener('input', () => {
      const query = els.cartMemberSearch.value.trim().toLowerCase();
      if (!query) {
        els.memberSearchResults.style.display = 'none';
        return;
      }
      
      const filtered = (state.members || []).filter(m => {
        const id = (m.id || '').toLowerCase();
        const fullName = `${m.name || ''} ${m.surname || ''}`.toLowerCase();
        const phone = (m.phone || '').toLowerCase();
        return id.includes(query) || fullName.includes(query) || phone.includes(query);
      });

      if (filtered.length === 0) {
        els.memberSearchResults.innerHTML = `<div style="padding: 10px; text-align: center; color: var(--text-secondary); font-size: 0.8rem;">ບໍ່ພົບສະມາຊິກ</div>`;
      } else {
        els.memberSearchResults.innerHTML = filtered.map(m => `
          <div class="search-result-item" data-id="${m.id}" style="padding: 8px 12px; cursor: pointer; border-bottom: 1px solid var(--border-color); font-size: 0.8rem; display: flex; justify-content: space-between; align-items: center;">
            <div>
              <strong style="color: var(--text-primary);">${m.name} ${m.surname}</strong>
              <div style="font-size: 0.7rem; color: var(--text-secondary);">${m.id}</div>
            </div>
            <div style="text-align: right;">
              <div style="font-size: 0.72rem; color: var(--text-secondary);">${m.phone}</div>
              <div style="font-size: 0.72rem; color: var(--primary-accent); font-weight: bold;">${m.points} ແຕ້ມ</div>
            </div>
          </div>
        `).join('');

        els.memberSearchResults.querySelectorAll('.search-result-item').forEach(item => {
          item.addEventListener('click', () => {
            const id = item.getAttribute('data-id');
            const member = state.members.find(m => m.id === id);
            if (member) {
              selectCartMember(member);
            }
          });
        });
      }
      els.memberSearchResults.style.display = 'block';
    });

    document.addEventListener('click', (e) => {
      if (els.memberSearchResults && !els.memberSearchResults.contains(e.target) && e.target !== els.cartMemberSearch) {
        els.memberSearchResults.style.display = 'none';
      }
    });
  }

  if (els.btnClearMember) {
    els.btnClearMember.addEventListener('click', () => {
      state.selectedMember = null;
      els.selectedMemberCard.style.display = 'none';
      els.memberSearchContainer.style.display = 'flex';
    });
  }

  if (els.btnOpenRegisterModal) {
    els.btnOpenRegisterModal.addEventListener('click', () => {
      els.regMemberName.value = '';
      els.regMemberSurname.value = '';
      els.regMemberPhone.value = '';
      els.regMemberEmail.value = '';
      els.registerMemberModal.classList.add('active');
    });
  }

  if (els.registerCloseBtn) {
    els.registerCloseBtn.addEventListener('click', () => {
      els.registerMemberModal.classList.remove('active');
    });
  }

  if (els.confirmRegisterMemberBtn) {
    els.confirmRegisterMemberBtn.addEventListener('click', async () => {
      const name = els.regMemberName.value.trim();
      const surname = els.regMemberSurname.value.trim();
      const phone = els.regMemberPhone.value.trim();
      const email = els.regMemberEmail.value.trim();

      if (!name || !surname || !phone) {
        alert('ກະລຸນາປ້ອນຂໍ້ມູນ ຊື່, ນາມສະກຸນ ແລະ ເບີໂທ ໃຫ້ຄົບຖ້ວນ');
        return;
      }

      els.confirmRegisterMemberBtn.disabled = true;
      els.confirmRegisterMemberBtn.innerHTML = `<i class="fas fa-spinner fa-spin"></i> ກຳລັງລົງທະບຽນ...`;

      try {
        const tempMember = {
          name: name,
          surname: surname,
          phone: phone,
          email: email || '-'
        };

        const registered = await registerMemberToGoogleSheets(tempMember);
        await window.BokeoDB.saveMember(registered);
        
        state.members = await window.BokeoDB.getMembers();
        selectCartMember(registered);
        els.registerMemberModal.classList.remove('active');
        alert('ລົງທະບຽນສະມາຊິກໃໝ່ ສຳເລັດ: ' + registered.id);
      } catch (error) {
        console.error('Registration failed:', error);
        alert('ບໍ່ສາມາດລົງທະບຽນສະມາຊິກໄດ້: ' + error.message);
      } finally {
        els.confirmRegisterMemberBtn.disabled = false;
        els.confirmRegisterMemberBtn.innerHTML = `<i class="fas fa-save"></i> ຢືນຢັນການລົງທະບຽນ (Register)`;
      }
    });
  }

  if (els.btnSyncMembersSettings) {
    els.btnSyncMembersSettings.addEventListener('click', async () => {
      els.btnSyncMembersSettings.disabled = true;
      els.btnSyncMembersSettings.innerHTML = `<i class="fas fa-spinner fa-spin"></i> ກຳລັງອັບເດດ...`;
      try {
        await window.BokeoDB.syncWithGoogleSheets();
        state.members = await window.BokeoDB.getMembers();
        renderSettingsMembersTable();
        alert('ອັບເດດຂໍ້ມູນສະມາຊິກຈາກ Google Sheets ສຳເລັດ');
      } catch (error) {
        console.error('Sync failed:', error);
        alert('ບໍ່ສາມາດອັບເດດຂໍ້ມູນໄດ້: ' + error.message);
      } finally {
        els.btnSyncMembersSettings.disabled = false;
        els.btnSyncMembersSettings.innerHTML = `<i class="fas fa-sync-alt"></i> ອັບເດດ`;
      }
    });
  }

  if (els.settingsMemberSearch) {
    els.settingsMemberSearch.addEventListener('input', () => {
      renderSettingsMembersTable();
    });
  }

  // Load database content on start
  await loadInitialData();
});
