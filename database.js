/**
 * Bokeo International Airport POS - Database Manager
 * Handles local IndexedDB storage and optional Firebase Firestore synchronization.
 */

const DB_NAME = 'BokeoAirportPOS_DB_v2';
const DB_VERSION = 2;

// Default Exchange Rates (1 THB = LAK / 1 THB = CNY)
const DEFAULT_LAK_RATE = 700;
const DEFAULT_CNY_RATE = 0.2; // 1 THB = 0.2 CNY (1 CNY = 5 THB)

// Default Cashiers
const DEFAULT_CASHIERS = [
  { id: 'c1', name: 'ທ້າວ ສົມພອນ' },
  { id: 'c2', name: 'ນາງ ຈັນທະວີ' },
  { id: 'c3', name: 'ທ້າວ ພອນສະຫວັນ' }
];

// Default Products & Stock Levels seeded from Google Sheets
const DEFAULT_PRODUCTS = [
  // 1. ຮ້ານຂາຍເຄື່ອງບໍລິໂພກ (Consumer Goods Shop / Retail)
  { id: 'TMN-VIPL-001', code: '200001', name_en: 'Beerlao (Can)', name_lo: 'ເບຍລາວປ໋ອງນ້ອຍ', category: 'ຮ້ານຂາຍເຄື່ອງບໍລິໂພກ', cost_thb: 20.00, price_thb: 50.00, price_lak: 35000, price_cny: 10.00, stock: 267, unit: 'ປ໋ອງ' },
  { id: 'TMN-VIPL-002', code: '200002', name_en: 'Heineken', name_lo: 'ເບຍໄຮນີເກັ້ນປ໋ອງນ້ອຍ', category: 'ຮ້ານຂາຍເຄື່ອງບໍລິໂພກ', cost_thb: 22.00, price_thb: 60.00, price_lak: 42000, price_cny: 12.00, stock: 212, unit: 'ປ໋ອງ' },
  { id: 'TMN-VIPL-003', code: '200003', name_en: 'Schweppes', name_lo: 'ສະເວພສ໌', category: 'ຮ້ານຂາຍເຄື່ອງບໍລິໂພກ', cost_thb: 15.00, price_thb: 50.00, price_lak: 35000, price_cny: 10.00, stock: 0, unit: 'ປ໋ອງ' },
  { id: 'TMN-VIPL-004', code: '200004', name_en: 'Pepsi', name_lo: 'ເປບຊີ', category: 'ຮ້ານຂາຍເຄື່ອງບໍລິໂພກ', cost_thb: 15.00, price_thb: 50.00, price_lak: 35000, price_cny: 10.00, stock: 59, unit: 'ປ໋ອງ' },
  { id: 'TMN-VIPL-005', code: '200005', name_en: 'Cocacola', name_lo: 'ໂຄກ', category: 'ຮ້ານຂາຍເຄື່ອງບໍລິໂພກ', cost_thb: 17.00, price_thb: 50.00, price_lak: 35000, price_cny: 10.00, stock: 179, unit: 'ປ໋ອງ' },
  { id: 'TMN-VIPL-006', code: '200006', name_en: 'Juice', name_lo: 'ນ້ຳໝາກໄມ້', category: 'ຮ້ານາຍເຄື່ອງບໍລິໂພກ', cost_thb: 28.00, price_thb: 50.00, price_lak: 35000, price_cny: 10.00, stock: 80, unit: 'ປ໋ອງ' },
  { id: 'TMN-VIPL-007', code: '200007', name_en: 'Energy Drink (M150)', name_lo: 'M150', category: 'ຮ້ານຂາຍເຄື່ອງບໍລິໂພກ', cost_thb: 10.00, price_thb: 50.00, price_lak: 35000, price_cny: 10.00, stock: 57, unit: 'ຕຸກ' },
  { id: 'TMN-VIPL-008', code: '200008', name_en: 'Drinking Water(Tiger Head 350ml)', name_lo: 'ນ້ຳດື່ມຫົວເສືອ 350ml', category: 'ຮ້ານຂາຍເຄື່ອງບໍລິໂພກ', cost_thb: 4.50, price_thb: 20.00, price_lak: 14000, price_cny: 4.00, stock: 1218, unit: 'ຕຸກ' },
  { id: 'TMN-VIPL-009', code: '200022', name_en: 'Sponsor (Can)', name_lo: 'ສະປອນເຊີ', category: 'ຮ້ານຂາຍເຄື່ອງບໍລິໂພກ', cost_thb: 13.00, price_thb: 50.00, price_lak: 35000, price_cny: 10.00, stock: 74, unit: 'ປ໋ອງ' },
  { id: 'TMN-VIPL-010', code: '200013', name_en: 'Sting', name_lo: 'ສະຕິງ', category: 'ຮ້ານຂາຍເຄື່ອງບໍລິໂພກ', cost_thb: 14.00, price_thb: 50.00, price_lak: 35000, price_cny: 10.00, stock: 90, unit: 'ຕຸກ' },
  { id: 'TMN-VIPL-011', code: '200011', name_en: 'Eurocake (Box)', name_lo: 'ຢູ່ໂລເຄັກກ່ອງ', category: 'ຮ້ານຂາຍເຄື່ອງບໍລິໂພກ', cost_thb: 55.00, price_thb: 60.00, price_lak: 42000, price_cny: 12.00, stock: 25, unit: 'ກ່ອງ' },
  { id: 'TMN-VIPL-012', code: '200028_1', name_en: 'Eurocake (Sachet)', name_lo: 'ຢູ່ໂລເຄັກຊອງ', category: 'ຮ້ານຂາຍເຄື່ອງບໍລິໂພກ', cost_thb: 4.60, price_thb: 5.00, price_lak: 3500, price_cny: 1.00, stock: 134, unit: 'ຊອງ' },
  { id: 'TMN-VIPL-013', code: '200028_2', name_en: 'Sunbright', name_lo: 'ຊັນໄບ', category: 'ຮ້ານຂາຍເຄື່ອງບໍລິໂພກ', cost_thb: 24.00, price_thb: 70.00, price_lak: 49000, price_cny: 14.00, stock: 134, unit: 'ຊອງ' },
  { id: 'TMN-VIPL-014', code: '200017_1', name_en: 'Lay Stack (Big)', name_lo: 'ເລສະເຕັກໃຫຍ່', category: 'ຮ້ານຂາຍເຄື່ອງບໍລິໂພກ', cost_thb: 48.00, price_thb: 120.00, price_lak: 84000, price_cny: 24.00, stock: 97, unit: 'ກະປ໋ອງ' },
  { id: 'TMN-VIPL-015', code: '200017_2', name_en: 'Lay Stack (Small)', name_lo: 'ເລສະເຕັກນ້ອຍ', category: 'ຮ້ານຂາຍເຄື່ອງບໍລິໂພກ', cost_thb: 34.00, price_thb: 90.00, price_lak: 63000, price_cny: 18.00, stock: 97, unit: 'ກະປ໋ອງ' },
  { id: 'TMN-VIPL-016', code: '200016', name_en: 'Butter Cake', name_lo: 'ເຄັກເນີຍສົດ', category: 'ຮ້ານຂາຍເຄື່ອງບໍລິໂພກ', cost_thb: 55.00, price_thb: 140.00, price_lak: 98000, price_cny: 28.00, stock: 15, unit: 'ຊິ້ນ' },
  { id: 'TMN-VIPL-017', code: '200019', name_en: 'Oishi', name_lo: 'ໂອອີຊິ', category: 'ຮ້ານຂາຍເຄື່ອງບໍລິໂພກ', cost_thb: 16.00, price_thb: 50.00, price_lak: 35000, price_cny: 10.00, stock: 183, unit: 'ຕຸກ' },
  { id: 'TMN-VIPL-018', code: '200020', name_en: 'Coconut juice (Can)', name_lo: 'ນ້ຳໜາກພ້າວ', category: 'ຮ້ານຂາຍເຄື່ອງບໍລິໂພກ', cost_thb: 12.00, price_thb: 50.00, price_lak: 35000, price_cny: 10.00, stock: 129, unit: 'ປ໋ອງ' },
  { id: 'TMN-VIPL-019', code: '200023', name_en: 'Civit', name_lo: 'ນ້ຳຊີວິດ', category: 'ຮ້ານຂາຍເຄື່ອງບໍລິໂພກ', cost_thb: 14.00, price_thb: 50.00, price_lak: 35000, price_cny: 10.00, stock: 184, unit: 'ຕຸກ' },
  { id: 'TMN-VIPL-020', code: '200021', name_en: 'Instant Noodles', name_lo: 'ຫມີ່ກ່ອງ', category: 'ຮ້ານຂາຍເຄື່ອງບໍລິໂພກ', cost_thb: 15.00, price_thb: 50.00, price_lak: 35000, price_cny: 10.00, stock: 264, unit: 'ຖ້ວຍ' },
  { id: 'DK-0041', code: '200027', name_en: 'Croissant Ordinaire', name_lo: 'ຂະຫນົມຄົວຊອງ', category: 'ຮ້ານຂາຍເຄື່ອງບໍລິໂພກ', cost_thb: 20.29, price_thb: 60.00, price_lak: 42000, price_cny: 12.00, stock: 16, unit: 'ຊອງ' },
  { id: 'DK-0043', code: '200043', name_en: 'Vitamilk', name_lo: 'ນົມໄວຕາມິວ', category: 'ຮ້ານຂາຍເຄື່ອງບໍລິໂພກ', cost_thb: 15.83, price_thb: 50.00, price_lak: 35000, price_cny: 10.00, stock: 124, unit: 'ກ່ອງ' },
  { id: 'DK-0044', code: '200044', name_en: 'Homey', name_lo: 'ຂະໜົມໂຮມມີ້', category: 'ຮ້ານຂາຍເຄື່ອງບໍລິໂພກ', cost_thb: 8.81, price_thb: 30.00, price_lak: 21000, price_cny: 6.00, stock: 160, unit: 'ຊອງ' },
  { id: 'DK-0045', code: '200045', name_en: 'Cookies', name_lo: 'ຄຸກກີ້ເດັນມາກ', category: 'ຮ້ານຂາຍເຄື່ອງບໍລິໂພກ', cost_thb: 70.00, price_thb: 200.00, price_lak: 140000, price_cny: 40.00, stock: 10, unit: 'ກ່ອງ' },
  { id: 'DK-049', code: '200127', name_en: 'Singha soda', name_lo: 'ໂຊດາສິງ Singha soda', category: 'ຮ້ານຂາຍເຄື່ອງບໍລິໂພກ', cost_thb: 15.00, price_thb: 50.00, price_lak: 35000, price_cny: 10.00, stock: 51, unit: 'ຕຸກ' },
  { id: 'DK-050', code: '200128', name_en: 'Chewing gum', name_lo: 'ໜາກຝຣັງແທັງ', category: 'ຮ້ານຂາຍເຄື່ອງບໍລິໂພກ', cost_thb: 5.50, price_thb: 20.00, price_lak: 14000, price_cny: 4.00, stock: 136, unit: 'ອັນ' },
  { id: 'DK-051', code: '200024', name_en: 'Birdy Coffee', name_lo: 'ກາເຟປ໋ອງ Birdy', category: 'ຮ້ານຂາຍເຄື່ອງບໍລິໂພກ', cost_thb: 12.00, price_thb: 40.00, price_lak: 28000, price_cny: 8.00, stock: 143, unit: 'ປ໋ອງ' },
  { id: 'DK-052', code: '200025', name_en: 'Wong Lo Kat Tea', name_lo: 'ຊາຈີນ ຫວັງເລົ່າຈີ', category: 'ຮ້ານຂາຍເຄື່ອງບໍລິໂພກ', cost_thb: 15.00, price_thb: 50.00, price_lak: 35000, price_cny: 10.00, stock: 128, unit: 'ປ໋ອງ' },
  { id: 'DK-053', code: '200064', name_en: 'Dutch Mill', name_lo: 'ນົມດັດຊ໌ມິວ', category: 'ຮ້ានຂາຍເຄື່ອງບໍລິໂພກ', cost_thb: 10.00, price_thb: 30.00, price_lak: 21000, price_cny: 6.00, stock: 49, unit: 'ກ່ອງ' },

  // 2. ບໍລິການຫຸ້ມຫໍ່ເຄື່ອງ (Wrapping Service)
  { id: 'WRP-001', code: '200029', name_en: 'Box (C+8)', name_lo: 'ແກັດ (C+8)', category: 'ບໍລິການຫຸ້ມຫໍ່ເຄື່ອງ', cost_thb: 7.00, price_thb: 80.00, price_lak: 56000, price_cny: 16.00, stock: 200, unit: 'ກ່ອງ' },
  { id: 'WRP-002', code: '200030', name_en: 'Box (H)', name_lo: 'ແກັດ (H)', category: 'ບໍລິການຫຸ້ມຫໍ່ເຄື່ອງ', cost_thb: 21.00, price_thb: 100.00, price_lak: 70000, price_cny: 20.00, stock: 173, unit: 'ກ່ອງ' },
  { id: 'WRP-003', code: '200039', name_en: 'Box (E)', name_lo: 'ແກັດ (E)', category: 'ບໍລິການຫຸ້ມຫໍ່ເຄື່ອງ', cost_thb: 9.00, price_thb: 85.00, price_lak: 59500, price_cny: 17.00, stock: 306, unit: 'ກ່ອງ' },
  { id: 'WRP-004', code: '200035', name_en: 'Document Envelope 6*9', name_lo: '6*9 ຊອງເອກະສານ', category: 'ບໍລິການຫຸ້ມຫໍ່ເຄື່ອງ', cost_thb: 1.90, price_thb: 25.00, price_lak: 17500, price_cny: 5.00, stock: 61, unit: 'ຊອງ' },
  { id: 'WRP-005', code: '200036', name_en: 'Document Envelope 7*10', name_lo: '7*10 ຊອງເອກະສານ', category: 'ບໍລິການຫຸ້ມຫໍ່ເຄື່ອງ', cost_thb: 2.20, price_thb: 30.00, price_lak: 21000, price_cny: 6.00, stock: 10, unit: 'ຊອງ' },
  { id: 'WRP-006', code: '200037', name_en: 'Document Envelope 9*12.75', name_lo: '9*12.75 ຊອງເອກະສານ', category: 'ບໍລິການຫຸ້ມຫໍ່ເຄື່ອງ', cost_thb: 2.50, price_thb: 35.00, price_lak: 24500, price_cny: 7.00, stock: 50, unit: 'ຊອງ' },
  { id: 'WRP-007', code: '200040', name_en: 'Foam Box 5KG', name_lo: '5KG ກ່ອງໂຟມ', category: 'ບໍລິການຫຸ້ມຫໍ່ເຄື່ອງ', cost_thb: 84.00, price_thb: 150.00, price_lak: 105000, price_cny: 30.00, stock: 10, unit: 'ກ່ອງ' },
  { id: 'WRP-008', code: '200041', name_en: 'Foam Box 15KG', name_lo: '15KG ກ່ອງໂຟມ', category: 'ບໍລິການຫຸ້ມຫໍ່ເຄື່ອງ', cost_thb: 109.00, price_thb: 200.00, price_lak: 140000, price_cny: 40.00, stock: 10, unit: 'ກ່ອງ' },
  { id: 'WRP-009', code: '200042', name_en: 'Foam Box 25KG', name_lo: '25KG ກ່ອງໂຟມ', category: 'ບໍລິການຫຸ້ມຫໍ່ເຄື່ອງ', cost_thb: 140.00, price_thb: 300.00, price_lak: 210000, price_cny: 60.00, stock: 10, unit: 'ກ່ອງ' },

  // 3. ຫ້ອງ VIP (VIP Lounge)
  { id: 'VIP-001', code: 'VIP01', name_en: 'VIP Lounge Silver Package', name_lo: 'ບໍລິການຫ້ອງ VIP Silver Package', category: 'ຫ້ອງ VIP', cost_thb: 150.00, price_thb: 500.00, price_lak: 350000, price_cny: 100.00, stock: 9999, unit: 'ຄັ້ງ' },
  { id: 'VIP-002', code: 'VIP02', name_en: 'Lounge Premium Package', name_lo: 'ບໍລິການຫ້ອງ VIP Premium Package', category: 'ຫ້ອງ VIP', cost_thb: 250.00, price_thb: 800.00, price_lak: 560000, price_cny: 160.00, stock: 9999, unit: 'ຄັ້ງ' },
  { id: 'VIP-003', code: 'VIP03', name_en: 'VIP Lounge Gold Package', name_lo: 'ບໍລິການຫ້ອງ VIP Gold Package', category: 'ຫ້ອງ VIP', cost_thb: 350.00, price_thb: 1200.00, price_lak: 840000, price_cny: 240.00, stock: 9999, unit: 'ຄັ້ງ' },

  // 4. ບໍລິການແທັກຊີ່ (Taxi Counter)
  { id: 'TAX-001', code: 'TAX01', name_en: 'Taxi to Bokeo Town', name_lo: 'ແທັກຊີ່ ໄປເທດສະບານເມືອງຫ້ວຍຊາຍ', category: 'ບໍລິການແທັກຊີ່', cost_thb: 100.00, price_thb: 300.00, price_lak: 210000, price_cny: 60.00, stock: 9999, unit: 'ທ່ຽວ' },
  { id: 'TAX-002', code: 'TAX02', name_en: 'Taxi to Lao-Thai Border', name_lo: 'ແທັກຊີ່ ໄປດ່ານຊາຍແດນ ລາວ-ໄທ', category: 'ບໍລິການແທັກຊີ່', cost_thb: 150.00, price_thb: 500.00, price_lak: 350000, price_cny: 100.00, stock: 9999, unit: 'ທ່ຽວ' },
  { id: 'TAX-003', code: 'TAX03', name_en: 'Taxi to Golden Triangle SEZ', name_lo: 'ແທັກຊີ່ ໄປເຂດເສດຖະກິດພິເສດ ສາມຫຼ່ຽມຄຳ', category: 'ບໍລິການແທັກຊີ່', cost_thb: 120.00, price_thb: 400.00, price_lak: 280000, price_cny: 80.00, stock: 9999, unit: 'ທ່ຽວ' }
];

class BokeoPOSDB {
  constructor() {
    this.db = null;
    this.isFirebaseEnabled = false;
    this.firestore = null;
    this.listeners = {};
  }

  /**
   * Initialize IndexedDB and (if configured) Firebase Firestore
   */
  async init() {
    return new Promise((resolve, reject) => {
      const request = indexedDB.open(DB_NAME, DB_VERSION);

      request.onerror = (event) => {
        console.error('IndexedDB open error:', event.target.error);
        reject(event.target.error);
      };

      request.onsuccess = async (event) => {
        this.db = event.target.result;
        await this._seedDatabaseIfEmpty();
        await this._loadSettingsAndInitFirebase();
        resolve(this);
      };

      request.onupgradeneeded = (event) => {
        const db = event.target.result;

        // Products Store
        if (!db.objectStoreNames.contains('products')) {
          db.createObjectStore('products', { keyPath: 'id' });
        }

        // Transactions Store
        if (!db.objectStoreNames.contains('transactions')) {
          const txStore = db.createObjectStore('transactions', { keyPath: 'id' });
          txStore.createIndex('timestamp', 'timestamp', { unique: false });
          txStore.createIndex('pos', 'pos', { unique: false });
        }

        // Cashiers Store
        if (!db.objectStoreNames.contains('cashiers')) {
          db.createObjectStore('cashiers', { keyPath: 'id' });
        }

        // Settings Store
        if (!db.objectStoreNames.contains('settings')) {
          db.createObjectStore('settings', { keyPath: 'id' });
        }

        // Petty Cash Store
        if (!db.objectStoreNames.contains('petty_cash')) {
          db.createObjectStore('petty_cash', { keyPath: 'id' });
        }
      };
    });
  }

  /**
   * Load settings and initialize Firebase if configured
   */
  async _loadSettingsAndInitFirebase() {
    try {
      const settings = await this.getSettings();
      if (settings && settings.firebase_config && settings.firebase_config.apiKey) {
        this._initFirebase(settings.firebase_config);
      }
    } catch (e) {
      console.warn('Failed to load settings or initialize Firebase:', e);
    }
  }

  /**
   * Set up Firebase App & Firestore
   */
  _initFirebase(config) {
    try {
      if (typeof firebase !== 'undefined') {
        // Prevent duplicate app initialization
        const app = firebase.apps.length ? firebase.app() : firebase.initializeApp(config);
        this.firestore = firebase.firestore(app);
        this.isFirebaseEnabled = true;
        console.log('Firebase Firestore Initialized Successfully.');
        
        // Setup real-time listener for products and stock
        this._setupRealtimeSyncListeners();
      } else {
        console.warn('Firebase SDK not loaded. Dynamic Cloud Sync is disabled.');
      }
    } catch (error) {
      console.error('Firebase initialization failed:', error);
      this.isFirebaseEnabled = false;
    }
  }

  /**
   * Seed DB with default data if empty
   */
  async _seedDatabaseIfEmpty() {
    // Check Products
    const productsCount = await this._countRows('products');
    if (productsCount === 0) {
      console.log('Seeding default products from Google Sheet data...');
      const tx = this.db.transaction('products', 'readwrite');
      const store = tx.objectStore('products');
      DEFAULT_PRODUCTS.forEach(p => {
        p.max_stock = p.stock;
        store.put(p);
      });
      await new Promise(resolve => tx.oncomplete = resolve);
    }

    // Check Cashiers
    const cashiersCount = await this._countRows('cashiers');
    if (cashiersCount === 0) {
      console.log('Seeding default cashiers...');
      const tx = this.db.transaction('cashiers', 'readwrite');
      const store = tx.objectStore('cashiers');
      DEFAULT_CASHIERS.forEach(c => store.put(c));
      await new Promise(resolve => tx.oncomplete = resolve);
    }

    // Check Settings
    const settings = await this.getSettings();
    if (!settings) {
      console.log('Seeding default settings...');
      const defaultSettings = {
        id: 'global',
        exchange_rate_lak: DEFAULT_LAK_RATE,
        exchange_rate_cny: DEFAULT_CNY_RATE,
        admin_pin: '1234',
        gdrive_script_url: '',
        pos_points: [
          { name: 'ຫ້ອງຂາຍເຄື່ອງ (Consumer Shop)', serviceType: 'ຮ້ານຂາຍເຄື່ອງບໍລິໂພກ' },
          { name: 'ຫ້ອງ VIP (VIP Lounge)', serviceType: 'ຫ້ອງ VIP' },
          { name: 'ບໍລິການຫຸ້ມຫໍ່ເຄື່ອງ (Wrapping Counter)', serviceType: 'ບໍລິການຫຸ້ມຫໍ່ເຄື່ອງ' },
          { name: 'ເຄົາເຕີ້ແທັກຊີ່ (Taxi Counter)', serviceType: 'ບໍລິການແທັກຊີ່' }
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
      await this.saveSettings(defaultSettings);
    }
  }

  /**
   * Helper to count records in IndexedDB store
   */
  _countRows(storeName) {
    return new Promise((resolve) => {
      const tx = this.db.transaction(storeName, 'readonly');
      const store = tx.objectStore(storeName);
      const req = store.count();
      req.onsuccess = () => resolve(req.result);
      req.onerror = () => resolve(0);
    });
  }

  /* =========================================================================
     PRODUCTS MANAGEMENT
     ========================================================================= */

  async getProducts() {
    return new Promise((resolve) => {
      const tx = this.db.transaction('products', 'readonly');
      const store = tx.objectStore('products');
      const req = store.getAll();
      req.onsuccess = () => resolve(req.result);
      req.onerror = () => resolve([]);
    });
  }

  async saveProduct(product) {
    return new Promise((resolve, reject) => {
      const tx = this.db.transaction('products', 'readwrite');
      const store = tx.objectStore('products');
      const req = store.put(product);
      
      req.onsuccess = async () => {
        if (this.isFirebaseEnabled && this.firestore) {
          try {
            await this.firestore.collection('products').doc(product.id).set(product);
          } catch (e) {
            console.error('Firestore saveProduct error:', e);
          }
        }
        this._notifyListener('products');
        resolve(product);
      };
      req.onerror = () => reject(req.error);
    });
  }

  async deleteProduct(productId) {
    return new Promise((resolve, reject) => {
      const tx = this.db.transaction('products', 'readwrite');
      const store = tx.objectStore('products');
      const req = store.delete(productId);

      req.onsuccess = async () => {
        if (this.isFirebaseEnabled && this.firestore) {
          try {
            await this.firestore.collection('products').doc(productId).delete();
          } catch (e) {
            console.error('Firestore deleteProduct error:', e);
          }
        }
        this._notifyListener('products');
        resolve();
      };
      req.onerror = () => reject(req.error);
    });
  }

  /**
   * Automatically deduct product stock after purchase
   */
  async deductStock(productId, qty) {
    return new Promise((resolve, reject) => {
      const tx = this.db.transaction('products', 'readwrite');
      const store = tx.objectStore('products');
      const req = store.get(productId);

      req.onsuccess = async () => {
        const product = req.result;
        if (product) {
          // Do not deduct if product is service package with arbitrary large stock
          if (product.stock < 9999) {
            product.stock = Math.max(0, product.stock - qty);
            store.put(product);
          }
          
          tx.oncomplete = async () => {
            if (this.isFirebaseEnabled && this.firestore && product.stock < 9999) {
              try {
                await this.firestore.collection('products').doc(productId).update({
                  stock: product.stock
                });
              } catch (e) {
                console.error('Firestore stock sync error:', e);
              }
            }
            this._notifyListener('products');
            resolve(product);
          };
        } else {
          resolve(null);
        }
      };
      req.onerror = () => reject(req.error);
    });
  }

  /* =========================================================================
     TRANSACTIONS MANAGEMENT
     ========================================================================= */

  async getTransactions() {
    return new Promise((resolve) => {
      const tx = this.db.transaction('transactions', 'readonly');
      const store = tx.objectStore('transactions');
      const req = store.getAll();
      req.onsuccess = () => {
        // Sort by timestamp descending
        const res = req.result.sort((a, b) => new Date(b.timestamp) - new Date(a.timestamp));
        resolve(res);
      };
      req.onerror = () => resolve([]);
    });
  }

  async saveTransaction(txData) {
    return new Promise((resolve, reject) => {
      const tx = this.db.transaction('transactions', 'readwrite');
      const store = tx.objectStore('transactions');
      const req = store.put(txData);

      req.onsuccess = async () => {
        // Sync to cloud if online
        if (this.isFirebaseEnabled && this.firestore) {
          try {
            await this.firestore.collection('transactions').doc(txData.id).set(txData);
          } catch (e) {
            console.error('Firestore saveTransaction error:', e);
          }
        }
        this._notifyListener('transactions');
        resolve(txData);
      };
      req.onerror = () => reject(req.error);
    });
  }

  async deleteTransaction(txId) {
    return new Promise((resolve, reject) => {
      const tx = this.db.transaction('transactions', 'readwrite');
      const store = tx.objectStore('transactions');
      const req = store.delete(txId);

      req.onsuccess = async () => {
        if (this.isFirebaseEnabled && this.firestore) {
          try {
            await this.firestore.collection('transactions').doc(txId).delete();
          } catch (e) {
            console.error('Firestore deleteTransaction error:', e);
          }
        }
        this._notifyListener('transactions');
        resolve();
      };
      req.onerror = () => reject(req.error);
    });
  }

  /* =========================================================================
     CASHIERS MANAGEMENT
     ========================================================================= */

  async getCashiers() {
    return new Promise((resolve) => {
      const tx = this.db.transaction('cashiers', 'readonly');
      const store = tx.objectStore('cashiers');
      const req = store.getAll();
      req.onsuccess = () => resolve(req.result);
      req.onerror = () => resolve([]);
    });
  }

  async saveCashier(cashier) {
    return new Promise((resolve, reject) => {
      const tx = this.db.transaction('cashiers', 'readwrite');
      const store = tx.objectStore('cashiers');
      const req = store.put(cashier);

      req.onsuccess = async () => {
        if (this.isFirebaseEnabled && this.firestore) {
          try {
            await this.firestore.collection('cashiers').doc(cashier.id).set(cashier);
          } catch (e) {
            console.error('Firestore saveCashier error:', e);
          }
        }
        this._notifyListener('cashiers');
        resolve(cashier);
      };
      req.onerror = () => reject(req.error);
    });
  }

  /* =========================================================================
     PETTY CASH (ເງິນທອນເລີ່ມຕົ້ນ)
     ========================================================================= */

  async getPettyCashSessions() {
    return new Promise((resolve) => {
      const tx = this.db.transaction('petty_cash', 'readonly');
      const store = tx.objectStore('petty_cash');
      const req = store.getAll();
      req.onsuccess = () => resolve(req.result);
      req.onerror = () => resolve([]);
    });
  }

  async getPettyCashSession(id) {
    return new Promise((resolve) => {
      const tx = this.db.transaction('petty_cash', 'readonly');
      const store = tx.objectStore('petty_cash');
      const req = store.get(id);
      req.onsuccess = () => resolve(req.result || null);
      req.onerror = () => resolve(null);
    });
  }

  async savePettyCashSession(session) {
    return new Promise((resolve, reject) => {
      const tx = this.db.transaction('petty_cash', 'readwrite');
      const store = tx.objectStore('petty_cash');
      const req = store.put(session);

      req.onsuccess = async () => {
        if (this.isFirebaseEnabled && this.firestore) {
          try {
            await this.firestore.collection('petty_cash').doc(session.id).set(session);
          } catch (e) {
            console.error('Firestore savePettyCashSession error:', e);
          }
        }
        resolve(session);
      };
      req.onerror = () => reject(req.error);
    });
  }

  /* =========================================================================
     SETTINGS MANAGEMENT
     ========================================================================= */

  async getSettings() {
    return new Promise((resolve) => {
      const tx = this.db.transaction('settings', 'readonly');
      const store = tx.objectStore('settings');
      const req = store.get('global');
      req.onsuccess = () => resolve(req.result || null);
      req.onerror = () => resolve(null);
    });
  }

  async saveSettings(settings) {
    return new Promise((resolve, reject) => {
      const tx = this.db.transaction('settings', 'readwrite');
      const store = tx.objectStore('settings');
      settings.id = 'global';
      const req = store.put(settings);

      req.onsuccess = async () => {
        // Re-init Firebase configuration if changed
        if (settings.firebase_config && settings.firebase_config.apiKey) {
          if (!this.isFirebaseEnabled) {
            this._initFirebase(settings.firebase_config);
          }
        } else {
          this.isFirebaseEnabled = false;
          this.firestore = null;
        }
        resolve(settings);
      };
      req.onerror = () => reject(req.error);
    });
  }

  /* =========================================================================
     REAL-TIME CLOUD SYNCHRONIZATION (FIREBASE FIRESTORE)
     ========================================================================= */

  _setupRealtimeSyncListeners() {
    if (!this.firestore) return;

    // Listen to Products Changes in Firestore (to sync stock & items real-time)
    this.firestore.collection('products').onSnapshot((snapshot) => {
      snapshot.docChanges().forEach(async (change) => {
        const data = change.doc.data();
        if (change.type === 'added' || change.type === 'modified') {
          await this._saveProductLocalOnly(data);
        } else if (change.type === 'removed') {
          await this._deleteProductLocalOnly(change.doc.id);
        }
      });
      this._notifyListener('products');
    });

    // Listen to Cashier Changes
    this.firestore.collection('cashiers').onSnapshot((snapshot) => {
      snapshot.docChanges().forEach(async (change) => {
        const data = change.doc.data();
        if (change.type === 'added' || change.type === 'modified') {
          await this._saveCashierLocalOnly(data);
        }
      });
      this._notifyListener('cashiers');
    });

    // Listen to Transactions (For cross-terminal dashboard update)
    this.firestore.collection('transactions').onSnapshot((snapshot) => {
      snapshot.docChanges().forEach(async (change) => {
        const data = change.doc.data();
        if (change.type === 'added' || change.type === 'modified') {
          await this._saveTransactionLocalOnly(data);
        } else if (change.type === 'removed') {
          await this._deleteTransactionLocalOnly(change.doc.id);
        }
      });
      this._notifyListener('transactions');
    });
  }

  // Local-only database writes (called by firebase event listeners to avoid infinite loops)
  _saveProductLocalOnly(product) {
    return new Promise((resolve) => {
      const tx = this.db.transaction('products', 'readwrite');
      tx.objectStore('products').put(product);
      tx.oncomplete = resolve;
    });
  }

  _deleteProductLocalOnly(productId) {
    return new Promise((resolve) => {
      const tx = this.db.transaction('products', 'readwrite');
      tx.objectStore('products').delete(productId);
      tx.oncomplete = resolve;
    });
  }

  _saveCashierLocalOnly(cashier) {
    return new Promise((resolve) => {
      const tx = this.db.transaction('cashiers', 'readwrite');
      tx.objectStore('cashiers').put(cashier);
      tx.oncomplete = resolve;
    });
  }

  _saveTransactionLocalOnly(txData) {
    return new Promise((resolve) => {
      const tx = this.db.transaction('transactions', 'readwrite');
      tx.objectStore('transactions').put(txData);
      tx.oncomplete = resolve;
    });
  }

  _deleteTransactionLocalOnly(txId) {
    return new Promise((resolve) => {
      const tx = this.db.transaction('transactions', 'readwrite');
      tx.objectStore('transactions').delete(txId);
      tx.oncomplete = resolve;
    });
  }

  async syncWithGoogleSheets() {
    try {
      console.log('Starting Google Sheets Sync...');
      
      const pricesUrl = 'https://docs.google.com/spreadsheets/d/1K3_qyglY9K_DXw9aSOHZWj8wanQwFjX2THaf1Rprojg/export?format=csv&gid=0';
      const stockUrl = 'https://docs.google.com/spreadsheets/d/1K3_qyglY9K_DXw9aSOHZWj8wanQwFjX2THaf1Rprojg/export?format=csv&gid=756509904';

      let pricesText = '';
      let stockText = '';
      const settings = await this.getSettings();

      if (settings && settings.gdrive_script_url) {
        try {
          console.log('Attempting fetch via Apps Script Web App...');
          const pricesRes = await fetch(`${settings.gdrive_script_url}?sheet=prices`);
          if (!pricesRes.ok) throw new Error('Failed to fetch prices from Apps Script');
          pricesText = await pricesRes.text();

          const stockRes = await fetch(`${settings.gdrive_script_url}?sheet=stock`);
          if (!stockRes.ok) throw new Error('Failed to fetch stock from Apps Script');
          stockText = await stockRes.text();
          console.log('Apps Script Web App fetch successful.');
        } catch (err) {
          console.warn('Apps Script Web App fetch failed, falling back to direct Gviz fetch:', err);
          pricesText = '';
          stockText = '';
        }
      }

      // Method B: Direct Google Sheets fetch using gviz/tq endpoint (CORS-free, 100% stable Google servers)
      if (!pricesText || !stockText) {
        try {
          console.log('Attempting direct Google Sheets Gviz fetch...');
          const pricesGvizUrl = 'https://docs.google.com/spreadsheets/d/1K3_qyglY9K_DXw9aSOHZWj8wanQwFjX2THaf1Rprojg/gviz/tq?tqx=out:csv&gid=0';
          const stockGvizUrl = 'https://docs.google.com/spreadsheets/d/1K3_qyglY9K_DXw9aSOHZWj8wanQwFjX2THaf1Rprojg/gviz/tq?tqx=out:csv&gid=756509904';

          const pricesRes = await fetch(pricesGvizUrl);
          if (!pricesRes.ok) throw new Error('Failed to fetch prices from direct Gviz endpoint');
          pricesText = await pricesRes.text();

          const stockRes = await fetch(stockGvizUrl);
          if (!stockRes.ok) throw new Error('Failed to fetch stock from direct Gviz endpoint');
          stockText = await stockRes.text();
          console.log('Direct Google Sheets Gviz fetch successful.');
        } catch (err) {
          console.warn('Direct Google Sheets Gviz fetch failed, falling back to AllOrigins proxy:', err);
          pricesText = '';
          stockText = '';
        }
      }

      // Method C: Last-resort fallback to AllOrigins JSON CORS proxy
      if (!pricesText || !stockText) {
        console.log('Attempting fetch via AllOrigins proxy...');
        const pricesRes = await fetch(`https://api.allorigins.win/get?url=${encodeURIComponent(pricesUrl)}`);
        if (!pricesRes.ok) throw new Error('Failed to fetch prices sheet CSV via proxy');
        const pricesJson = await pricesRes.json();
        pricesText = pricesJson.contents;

        const stockRes = await fetch(`https://api.allorigins.win/get?url=${encodeURIComponent(stockUrl)}`);
        if (!stockRes.ok) throw new Error('Failed to fetch stock sheet CSV via proxy');
        const stockJson = await stockRes.json();
        stockText = stockJson.contents;
        console.log('AllOrigins proxy fetch successful.');
      }

      const pricesRows = this._parseCSV(pricesText);
      const stockRows = this._parseCSV(stockText);

      // Get current local products
      const localProducts = await this.getProducts();

      // Parse Exchange Rates from prices sheet
      let rateLak = settings.exchange_rate_lak;
      let rateCny = settings.exchange_rate_cny;

      pricesRows.forEach(row => {
        const rowStr = row.join(',');
        if (rowStr.includes('ອັດຕາແລກປ່ຽນ ບາດ-ກີບ')) {
          const val = parseFloat(row[row.length - 2] || row[row.length - 1]);
          if (val) rateLak = val;
        }
        if (rowStr.includes('ອັດຕາແລກປ່ຽນ ບາດ-ຢວນ')) {
          const val = parseFloat(row[row.length - 2] || row[row.length - 1]);
          if (val) rateCny = val;
        }
      });

      // Update local settings if rate changed
      if (rateLak !== settings.exchange_rate_lak || rateCny !== settings.exchange_rate_cny) {
        settings.exchange_rate_lak = rateLak;
        settings.exchange_rate_cny = rateCny;
        await this.saveSettings(settings);
      }

      // Parse and update products
      pricesRows.forEach(row => {
        if (row.length < 5) return;
        const productId = row[0] ? row[0].trim() : '';
        const nameEn = row[1] ? row[1].trim() : '';
        const nameLo = row[2] ? row[2].trim() : '';
        
        let costThb = parseFloat(row[3] ? row[3].replace(/[^\d\.]/g, '') : '0') || 0;
        let priceThb = parseFloat(row[4] ? row[4].replace(/[^\d\.]/g, '') : '0') || 0;
        let priceLak = parseFloat(row[5] ? row[5].replace(/[^\d\.]/g, '') : '0') || 0;
        let priceCny = parseFloat(row[6] ? row[6].replace(/[^\d\.]/g, '') : '0') || 0;

        if (!priceLak && priceThb) priceLak = Math.round(priceThb * rateLak);
        if (!priceCny && priceThb) priceCny = parseFloat((priceThb * rateCny).toFixed(2));

        // Try to match product in our database
        let matchedProduct = null;

        if (productId) {
          matchedProduct = localProducts.find(p => p.id === productId);
        } else if (nameLo) {
          // Match by name keyword (specifically for wrapping service)
          matchedProduct = localProducts.find(p => {
            const cleanName = p.name_lo.toLowerCase();
            const cleanTarget = nameLo.toLowerCase();
            return cleanName.includes(cleanTarget) || cleanTarget.includes(cleanName);
          });
        }

        if (matchedProduct) {
          if (costThb) matchedProduct.cost_thb = costThb;
          if (priceThb) matchedProduct.price_thb = priceThb;
          if (priceLak) matchedProduct.price_lak = priceLak;
          if (priceCny) matchedProduct.price_cny = priceCny;
          if (nameEn) matchedProduct.name_en = nameEn;
          if (nameLo) matchedProduct.name_lo = nameLo;
          if (!matchedProduct.max_stock) matchedProduct.max_stock = matchedProduct.stock;
        }
      });

      // Parse and update stock
      stockRows.forEach(row => {
        if (row.length < 8) return;
        const code = row[1] ? row[1].trim() : '';
        const name = row[2] ? row[2].trim() : '';
        const stockVal = Math.round(parseFloat(row[7] ? row[7].replace(/[^\d\.]/g, '') : '0') || 0);

        if (code) {
          const matchedProduct = localProducts.find(p => p.code === code);
          if (matchedProduct) {
            matchedProduct.stock = stockVal;
            matchedProduct.max_stock = Math.max(matchedProduct.max_stock || 0, stockVal);
          }
        } else if (name) {
          const matchedProduct = localProducts.find(p => {
            const cleanName = p.name_lo.toLowerCase();
            const cleanTarget = name.toLowerCase();
            return cleanName.includes(cleanTarget) || cleanTarget.includes(cleanName);
          });
          if (matchedProduct && matchedProduct.stock < 9999) {
            matchedProduct.stock = stockVal;
            matchedProduct.max_stock = Math.max(matchedProduct.max_stock || 0, stockVal);
          }
        }
      });

      // Save all products back to IndexedDB
      const tx = this.db.transaction('products', 'readwrite');
      const store = tx.objectStore('products');
      localProducts.forEach(p => store.put(p));
      await new Promise(resolve => tx.oncomplete = resolve);

      // Sync with Firebase Firestore if online
      if (this.isFirebaseEnabled && this.firestore) {
        const batch = this.firestore.batch();
        localProducts.forEach(p => {
          const docRef = this.firestore.collection('products').doc(p.id);
          batch.set(docRef, p);
        });
        await batch.commit();
      }

      this._notifyListener('products');
      console.log('Google Sheets Sync Completed Successfully!');
      return true;
    } catch (error) {
      console.error('Google Sheets Sync Failed:', error);
      return false;
    }
  }

  /**
   * Helper to parse CSV lines respecting quotes
   */
  _parseCSV(text) {
    const lines = text.split(/\r?\n/);
    return lines.map(line => {
      const result = [];
      let current = '';
      let inQuotes = false;
      for (let i = 0; i < line.length; i++) {
        const char = line[i];
        if (char === '"') {
          inQuotes = !inQuotes;
        } else if (char === ',' && !inQuotes) {
          result.push(current.trim());
          current = '';
        } else {
          current += char;
        }
      }
      result.push(current.trim());
      return result;
    });
  }

  /* =========================================================================
     LISTENER PATTERN (For UI Auto-Updates)
     ========================================================================= */

  on(event, callback) {
    if (!this.listeners[event]) {
      this.listeners[event] = [];
    }
    this.listeners[event].push(callback);
  }

  _notifyListener(event) {
    if (this.listeners[event]) {
      this.listeners[event].forEach(cb => {
        try {
          cb();
        } catch (e) {
          console.error(`Error in ${event} database listener callback:`, e);
        }
      });
    }
  }
}

// Create Global DB Instance
const dbInstance = new BokeoPOSDB();
window.BokeoDB = dbInstance;
