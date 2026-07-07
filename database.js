/**
 * Bokeo International Airport POS - Database Manager
 * Handles local IndexedDB storage and Google Sheets synchronization.
 */

const DB_NAME = 'BokeoAirportPOS_DB_v2';
const DB_VERSION = 5;

// Helper to fetch with a timeout (default 15 seconds). Always bypasses HTTP cache
// so a freshly-edited Google Sheet is never served from a stale cached response.
async function fetchWithTimeout(resource, options = {}) {
  const { timeout = 15000 } = options;
  const controller = new AbortController();
  const id = setTimeout(() => controller.abort(), timeout);
  try {
    const response = await fetch(resource, {
      cache: 'no-store',
      ...options,
      signal: controller.signal
    });
    clearTimeout(id);
    return response;
  } catch (error) {
    clearTimeout(id);
    throw error;
  }
}

// Default Exchange Rates (1 THB = LAK / 1 THB = CNY)
const DEFAULT_LAK_RATE = 700;
const DEFAULT_CNY_RATE = 0.2; // 1 THB = 0.2 CNY (1 CNY = 5 THB)

// ===== ໃສ່ URL Apps Script /exec ຂອງເຈົ້າທີ່ນີ້ ໃຫ້ທຸກເຄື່ອງເຊື່ອມຕໍ່ໂดยไม่ต้องตั้งใน Settings =====
// ตัวอย่าง: 'https://script.google.com/macros/s/AKfycbx..../exec'
const DEFAULT_GAS_URL = 'https://script.google.com/macros/s/AKfycbx7yBLkEA50BMKqhv-h7swHhMaEAs-U0jSRCY0xyJBdf8fAM-RH3g5zjavmWcKWkvXk/exec';

// Staff roles (privilege levels). 'cashier' is the default when the role is empty/unknown.
//   root       = super admin (manages everyone, including admins)
//   admin      = manages cashiers, settings and reports
//   accountant = finance/accounting staff (reports & financial data, no selling)
//   cashier    = sells only
const VALID_ROLES = ['root', 'admin', 'accountant', 'cashier'];

// Normalize a role string coming from the cashiers Google Sheet to a known role.
// When the role cell is blank, fall back to the department: Finance/Accounting -> accountant.
function normalizeRole(raw, department) {
  const r = (raw || '').toString().trim().toLowerCase();
  if (VALID_ROLES.includes(r)) return r;
  const dept = (department || '').toString().toLowerCase();
  if (dept.includes('finance') || dept.includes('account') || dept.includes('ບັນຊີ')) return 'accountant';
  return 'cashier';
}


class BokeoPOSDB {
  constructor() {
    this.db = null;
    this.listeners = {};
  }

  /**
   * Initialize IndexedDB
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
        await this._loadSettings();
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

        // Members Store
        if (!db.objectStoreNames.contains('members')) {
          db.createObjectStore('members', { keyPath: 'id' });
        }

        // Activity Log Store (audit trail) — created at DB version 4
        if (!db.objectStoreNames.contains('activity_log')) {
          const logStore = db.createObjectStore('activity_log', { keyPath: 'id' });
          logStore.createIndex('timestamp', 'timestamp', { unique: false });
          logStore.createIndex('action', 'action', { unique: false });
          logStore.createIndex('cashier', 'cashier', { unique: false });
        }
      };
    });
  }

  /**
   * Load settings and apply the shared Apps Script URL if unset
   */
  async _loadSettings() {
    try {
      const settings = await this.getSettings();
      // Auto-apply the shared Apps Script URL so every device connects without manual entry.
      if (settings && !settings.gdrive_script_url && DEFAULT_GAS_URL) {
        settings.gdrive_script_url = DEFAULT_GAS_URL;
        await this.saveSettings(settings);
        console.log('Applied shared Apps Script URL from DEFAULT_GAS_URL.');
      }
    } catch (e) {
      console.warn('Failed to load settings:', e);
    }
  }

  /**
   * Seed only the app configuration (settings) on first run.
   * Products, cashiers, members, etc. are NOT seeded — they come entirely from Google Sheets.
   */
  async _seedDatabaseIfEmpty() {
    // Check Settings (app configuration only — no default products/cashiers)
    const settings = await this.getSettings();
    if (!settings) {
      console.log('Seeding default settings...');
      const defaultSettings = {
        id: 'global',
        exchange_rate_lak: DEFAULT_LAK_RATE,
        exchange_rate_cny: DEFAULT_CNY_RATE,
        admin_pin: '1234',
        gdrive_script_url: '',
        gdrive_folder_id: '1ao3TJesHPrdVCflFPnU6ndcGKAyVPXyC',
        receipt_address: 'ຈຸດບໍລິການ POS, ສະໜາມບິນສາກົນບໍ່ແກ້ວ',
        receipt_phone: '020 9999-8888',
        receipt_footer_lao: 'ຂໍຂອບໃຈ ແລະ ຍິນດີຕ້ອນຮັບອີກຄັ້ງ',
        receipt_footer_eng: 'Thank you, Please visit again!',
        receipt_slogan_lao: 'ບໍລິການດ້ວຍໃຈ ຫ່ວງໃຍທຸກການເດີນທາງ',
        receipt_slogan_eng: 'Service with heart, caring for every journey',
        pos_points: [
          { name: 'ຫ້ອງຂາຍເຄື່ອງ (Consumer Shop)', serviceType: 'ຮ້ານຂາຍເຄື່ອງບໍລິໂພກ' },
          { name: 'ຫ້ອງ VIP (VIP Lounge)', serviceType: 'ຫ້ອງ VIP' },
          { name: 'ບໍລິການຫຸ້ມຫໍ່ເຄື່ອງ (Wrapping Counter)', serviceType: 'ບໍລິການຫຸ້ມຫໍ່ເຄື່ອງ' },
          { name: 'ເຄົາເຕີ້ແທັກຊີ່ (Taxi Counter)', serviceType: 'ບໍລິການແທັກຊີ່' },
          { name: 'ລານຈອດລົດ (Parking Lot)', serviceType: 'ບໍລິການລານຈອດ' }
        ],
        member_points_threshold: 500,
        member_points_below: 1,
        member_points_above: 10,
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
      
      req.onsuccess = () => {
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

      req.onsuccess = () => {
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

      req.onsuccess = () => {
        const product = req.result;
        if (product) {
          // Do not deduct stock if it's a service package
          const serviceCategories = ['ຫ້ອງ VIP', 'ບໍລິການແທັກຊີ່', 'ບໍລິການລານຈອດ'];
          if (!serviceCategories.includes(product.category) && product.stock < 9999) {
            product.stock = Math.max(0, product.stock - qty);
            store.put(product);
          }
          
          tx.oncomplete = () => {
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

      req.onsuccess = () => {
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

      req.onsuccess = () => {
        this._notifyListener('transactions');
        resolve();
      };
      req.onerror = () => reject(req.error);
    });
  }

  /* =========================================================================
     ACTIVITY LOG (AUDIT TRAIL)
     ========================================================================= */
  async logActivity(entry) {
    try {
      const record = {
        id: 'LOG-' + Date.now() + '-' + Math.random().toString(36).slice(2, 7),
        timestamp: new Date().toISOString(),
        action: (entry && entry.action) || 'UNKNOWN',
        detail: (entry && entry.detail) || '',
        cashier: (entry && entry.cashier) || '-',
        pos: (entry && entry.pos) || '-'
      };
      await new Promise((resolve) => {
        const tx = this.db.transaction('activity_log', 'readwrite');
        tx.objectStore('activity_log').put(record);
        tx.oncomplete = () => resolve();
        tx.onerror = () => resolve();
      });
      return record;
    } catch (e) {
      console.error('logActivity failed:', e);
      return null;
    }
  }

  async getActivityLogs(limit = 500) {
    return new Promise((resolve) => {
      try {
        const tx = this.db.transaction('activity_log', 'readonly');
        const req = tx.objectStore('activity_log').getAll();
        req.onsuccess = () => {
          const all = (req.result || []).sort((a, b) => (b.timestamp || '').localeCompare(a.timestamp || ''));
          resolve(limit ? all.slice(0, limit) : all);
        };
        req.onerror = () => resolve([]);
      } catch (e) { resolve([]); }
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

      req.onsuccess = () => {
        this._notifyListener('cashiers');
        resolve(cashier);
      };
      req.onerror = () => reject(req.error);
    });
  }

  async deleteCashier(id) {
    return new Promise((resolve, reject) => {
      const tx = this.db.transaction('cashiers', 'readwrite');
      const store = tx.objectStore('cashiers');
      const req = store.delete(id);

      req.onsuccess = () => {
        this._notifyListener('cashiers');
        resolve();
      };
      req.onerror = () => reject(req.error);
    });
  }

  /* =========================================================================
     MEMBERS MANAGEMENT
     ========================================================================= */

  async getMembers() {
    return new Promise((resolve) => {
      const tx = this.db.transaction('members', 'readonly');
      const store = tx.objectStore('members');
      const req = store.getAll();
      req.onsuccess = () => resolve(req.result);
      req.onerror = () => resolve([]);
    });
  }

  async getMember(id) {
    return new Promise((resolve) => {
      const tx = this.db.transaction('members', 'readonly');
      const store = tx.objectStore('members');
      const req = store.get(id);
      req.onsuccess = () => resolve(req.result || null);
      req.onerror = () => resolve(null);
    });
  }

  async saveMember(member) {
    return new Promise((resolve, reject) => {
      const tx = this.db.transaction('members', 'readwrite');
      const store = tx.objectStore('members');
      const req = store.put(member);

      req.onsuccess = () => {
        this._notifyListener('members');
        resolve(member);
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

      req.onsuccess = () => {
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

      req.onsuccess = () => {
        resolve(settings);
      };
      req.onerror = () => reject(req.error);
    });
  }

  // Public entry: serialize syncs so two never run at once. Overlapping syncs hammer the
  // Apps Script endpoint and cause some sheet fetches to fail — meaning an edit in the Sheet
  // would appear "not updated". Chaining guarantees each sync runs alone, with fresh data.
  async syncWithGoogleSheets() {
    const run = () => this._doSyncWithGoogleSheets();
    this._syncChain = (this._syncChain ? this._syncChain.catch(() => {}) : Promise.resolve()).then(run);
    return this._syncChain;
  }

  async _doSyncWithGoogleSheets() {
    try {
      console.log('Starting Google Sheets Sync...');
      
      const cacheBust = Date.now();
      const pricesUrl = 'https://docs.google.com/spreadsheets/d/1K3_qyglY9K_DXw9aSOHZWj8wanQwFjX2THaf1Rprojg/gviz/tq?tqx=out:csv&sheet=' + encodeURIComponent('ລາຄາສິນຄ້າ') + '&t=' + cacheBust;
      const stockUrl = 'https://docs.google.com/spreadsheets/d/1K3_qyglY9K_DXw9aSOHZWj8wanQwFjX2THaf1Rprojg/gviz/tq?tqx=out:csv&sheet=' + encodeURIComponent('ສະຕັອກສິນຄ້າລ່າສຸດ') + '&t=' + cacheBust;

      let pricesText = '';
      let stockText = '';
      let pettyText = '';
      let membersText = '';
      let salesText = '';
      let cashiersText = '';
      let qrText = '';
      let productImagesText = '';
      const settings = await this.getSettings();

      if (settings && settings.gdrive_script_url) {
        try {
          console.log('Attempting fetch via Apps Script Web App...');
          const pricesRes = await fetchWithTimeout(`${settings.gdrive_script_url}?sheet=prices&t=${cacheBust}`);
          if (!pricesRes.ok) throw new Error('Failed to fetch prices from Apps Script');
          pricesText = await pricesRes.text();
          if (pricesText.trim().startsWith('Error:')) throw new Error(pricesText);

          const stockRes = await fetchWithTimeout(`${settings.gdrive_script_url}?sheet=stock&t=${cacheBust}`);
          if (!stockRes.ok) throw new Error('Failed to fetch stock from Apps Script');
          stockText = await stockRes.text();
          if (stockText.trim().startsWith('Error:')) throw new Error(stockText);
          
          const pettyRes = await fetchWithTimeout(`${settings.gdrive_script_url}?sheet=petty_cash&t=${cacheBust}`);
          if (pettyRes.ok) {
            pettyText = await pettyRes.text();
            if (pettyText.trim().startsWith('Error:')) {
              console.warn('Apps Script petty_cash fetch returned error:', pettyText);
              pettyText = '';
            }
          }
          
          const membersRes = await fetchWithTimeout(`${settings.gdrive_script_url}?sheet=members&t=${cacheBust}`);
          if (membersRes.ok) {
            membersText = await membersRes.text();
            if (membersText.trim().startsWith('Error:')) {
              console.warn('Apps Script members fetch returned error:', membersText);
              membersText = '';
            }
          }

          const salesRes = await fetchWithTimeout(`${settings.gdrive_script_url}?sheet=sales&t=${cacheBust}`);
          if (salesRes.ok) {
            salesText = await salesRes.text();
            if (salesText.trim().startsWith('Error:')) {
              console.warn('Apps Script sales fetch returned error:', salesText);
              salesText = '';
            }
          }

          const cashiersRes = await fetchWithTimeout(`${settings.gdrive_script_url}?sheet=cashiers&t=${cacheBust}`);
          if (cashiersRes.ok) {
            cashiersText = await cashiersRes.text();
            if (cashiersText.trim().startsWith('Error:')) {
              console.warn('Apps Script cashiers fetch returned error:', cashiersText);
              cashiersText = '';
            }
          }

          const qrRes = await fetchWithTimeout(`${settings.gdrive_script_url}?sheet=qr&t=${cacheBust}`);
          if (qrRes.ok) {
            qrText = await qrRes.text();
            if (qrText.trim().startsWith('Error:')) {
              console.warn('Apps Script qr fetch returned error:', qrText);
              qrText = '';
            }
          }

          const piRes = await fetchWithTimeout(`${settings.gdrive_script_url}?sheet=product_images&t=${cacheBust}`);
          if (piRes.ok) {
            productImagesText = await piRes.text();
            if (productImagesText.trim().startsWith('Error:')) {
              console.warn('Apps Script product_images fetch returned error:', productImagesText);
              productImagesText = '';
            }
          }
          console.log('Apps Script Web App fetch successful.');
        } catch (err) {
          console.warn('Apps Script Web App fetch failed, falling back to direct Gviz fetch:', err);
          pricesText = '';
          stockText = '';
          pettyText = '';
          membersText = '';
        }
      }

      // Method B: Direct Google Sheets fetch using gviz/tq endpoint (CORS-free, 100% stable Google servers)
      if (!pricesText || !stockText) {
        try {
          console.log('Attempting direct Google Sheets Gviz fetch...');
          const pricesGvizUrl = 'https://docs.google.com/spreadsheets/d/1K3_qyglY9K_DXw9aSOHZWj8wanQwFjX2THaf1Rprojg/gviz/tq?tqx=out:csv&sheet=' + encodeURIComponent('ລາຄາສິນຄ້າ') + '&t=' + cacheBust;
          const stockGvizUrl = 'https://docs.google.com/spreadsheets/d/1K3_qyglY9K_DXw9aSOHZWj8wanQwFjX2THaf1Rprojg/gviz/tq?tqx=out:csv&sheet=' + encodeURIComponent('ສະຕັອກສິນຄ້າລ່າສຸດ') + '&t=' + cacheBust;

          const pricesRes = await fetchWithTimeout(pricesGvizUrl);
          if (!pricesRes.ok) throw new Error('Failed to fetch prices from direct Gviz endpoint');
          pricesText = await pricesRes.text();

          const stockRes = await fetchWithTimeout(stockGvizUrl);
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
        const pricesRes = await fetchWithTimeout(`https://api.allorigins.win/get?url=${encodeURIComponent(pricesUrl)}`);
        if (!pricesRes.ok) throw new Error('Failed to fetch prices sheet CSV via proxy');
        const pricesJson = await pricesRes.json();
        pricesText = pricesJson.contents;

        const stockRes = await fetchWithTimeout(`https://api.allorigins.win/get?url=${encodeURIComponent(stockUrl)}`);
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
      let currentCategory = 'ຮ້ານຂາຍເຄື່ອງບໍລິໂພກ';
      const categoriesList = ['ຮ້ານຂາຍເຄື່ອງບໍລິໂພກ', 'ຫ້ອງ VIP', 'ບໍລິການຫຸ້ມຫໍ່ເຄື່ອງ', 'ບໍລິການແທັກຊີ່', 'ບໍລິການລານຈອດ', 'ບໍລິການລານຈອດລົດ'];
      const importedIds = new Set();
      // Shared product images from Google Drive (file name = product id) -> { productId: url }
      const _imgUrlByCode = {};
      if (productImagesText) {
        this._parseCSV(productImagesText).forEach((row, idx) => {
          if (idx === 0) return;
          const code = row[0] ? row[0].trim() : '';
          const url = row[1] ? row[1].trim() : '';
          if (code && url) _imgUrlByCode[code] = url;
        });
      }

      pricesRows.forEach(row => {
        if (row.length < 1) return;
        const colA = row[0] ? row[0].replace(/\s+/g, ' ').trim() : '';
        const colB = row[1] ? row[1].trim() : '';
        const colC = row[2] ? row[2].trim() : '';

        // Check if this is a category header row (normalised colA; B/C not required to be empty,
        // because a product row's colA is an ID that will never match a category name)
        if (categoriesList.includes(colA)) {
          currentCategory = (colA === 'ບໍລິການລານຈອດລົດ') ? 'ບໍລິການລານຈອດ' : colA;
          return;
        }

        // Skip table header lines or empty rows
        if (!colA || colA.toLowerCase().includes('id') || colA.toLowerCase().includes('product') || colA.includes('ລຳດັບ')) {
          return;
        }

        if (row.length < 3) return;

        const productId = colA;
        importedIds.add(productId);
        const nameEn = colB;
        const nameLo = colC;
        
        let costThb = parseFloat(row[3] ? row[3].replace(/[^\d\.]/g, '') : '0') || 0;
        let priceThb = parseFloat(row[4] ? row[4].replace(/[^\d\.]/g, '') : '0') || 0;
        let priceLak = parseFloat(row[5] ? row[5].replace(/[^\d\.]/g, '') : '0') || 0;
        let priceCny = parseFloat(row[6] ? row[6].replace(/[^\d\.]/g, '') : '0') || 0;

        if (!priceLak && priceThb) priceLak = Math.round(priceThb * rateLak);
        if (!priceCny && priceThb) priceCny = parseFloat((priceThb * rateCny).toFixed(2));

        // Try to match product in our database
        let matchedProduct = localProducts.find(p => p.id === productId);

        if (!matchedProduct && nameLo) {
          // Fallback match by name
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
          matchedProduct.category = currentCategory;
          if (_imgUrlByCode[productId]) matchedProduct.image = _imgUrlByCode[productId];
          if (!matchedProduct.max_stock) matchedProduct.max_stock = matchedProduct.stock;
        } else {
          // Create new product
          const defaultStock = (currentCategory === 'ຫ້ອງ VIP' || currentCategory === 'ບໍລິການແທັກຊີ່' || currentCategory === 'ບໍລິການລານຈອດ') ? 9999 : 0;
          const defaultUnit = (currentCategory === 'ບໍລິການແທັກຊີ່') ? 'ທ່ຽວ' : (currentCategory === 'ຫ້ອງ VIP' || currentCategory === 'ບໍລິການລານຈອດ' ? 'ຄັ້ງ' : 'ຊິ້ນ');
          
          const newProduct = {
            id: productId,
            code: productId, // default code to ID
            name_en: nameEn || productId,
            name_lo: nameLo || nameEn || productId,
            category: currentCategory,
            cost_thb: costThb,
            price_thb: priceThb,
            price_lak: priceLak,
            price_cny: priceCny,
            stock: defaultStock,
            max_stock: defaultStock,
            unit: defaultUnit
          };
          if (_imgUrlByCode[productId]) newProduct.image = _imgUrlByCode[productId];
          localProducts.push(newProduct);
        }
      });

      // Parse and update stock
      stockRows.forEach(row => {
        if (row.length < 5) return;
        const code = row[0] ? row[0].trim() : '';
        const name = row[2] ? row[2].trim() : '';
        
        // คงเหลือจริง = คอลัมน์ I (index 8, "ຈຳນວນລວມໃໝ່" = หลังเติม), fallback G(6) แล้ว E(4)
        let stockStr = row[8] ? row[8].trim() : '';
        if (!stockStr || stockStr === '') stockStr = row[6] ? row[6].trim() : '';
        if (!stockStr || stockStr === '') stockStr = row[4] ? row[4].trim() : '0';
        const stockVal = Math.round(parseFloat(stockStr.replace(/[^\d\.\-]/g, '')) || 0);
        // ขายออก (F=5) และ เพิ่มเข้า (H=7) สำหรับรายงานสต๊อก
        const soldVal = Math.round(parseFloat((row[5] ? row[5].trim() : '0').replace(/[^\d\.\-]/g, '')) || 0);
        const addedVal = Math.round(parseFloat((row[7] ? row[7].trim() : '0').replace(/[^\d\.\-]/g, '')) || 0);
        const noteVal = row[9] ? row[9].trim() : '';

        const serviceCategories = ['ຫ້ອງ VIP', 'ບໍລິການແທັກຊີ່', 'ບໍລິການລານຈອດ'];
        if (code) {
          const matchedProduct = localProducts.find(p => p.code === code || p.id === code);
          if (matchedProduct) {
            if (!serviceCategories.includes(matchedProduct.category)) {
              matchedProduct.stock = stockVal;
              matchedProduct.sold = soldVal;
              matchedProduct.added = addedVal;
              matchedProduct.note = noteVal;
              matchedProduct.max_stock = Math.max(matchedProduct.max_stock || 0, stockVal);
            } else {
              matchedProduct.stock = 9999;
              matchedProduct.max_stock = 9999;
            }
          }
        } else if (name) {
          const matchedProduct = localProducts.find(p => {
            const cleanName = p.name_lo.toLowerCase();
            const cleanTarget = name.toLowerCase();
            return cleanName.includes(cleanTarget) || cleanTarget.includes(cleanName);
          });
          if (matchedProduct) {
            if (!serviceCategories.includes(matchedProduct.category)) {
              matchedProduct.stock = stockVal;
              matchedProduct.sold = soldVal;
              matchedProduct.added = addedVal;
              matchedProduct.note = noteVal;
              matchedProduct.max_stock = Math.max(matchedProduct.max_stock || 0, stockVal);
            } else {
              matchedProduct.stock = 9999;
              matchedProduct.max_stock = 9999;
            }
          }
        }
      });

      if (importedIds.size > 0) {
        // Filter out obsolete products that are not present in the spreadsheet
        const updatedProducts = [];
        const idsToDelete = [];
        
        localProducts.forEach(p => {
          if (importedIds.has(p.id)) {
            updatedProducts.push(p);
          } else {
            idsToDelete.push(p.id);
          }
        });

        // Save all products back to IndexedDB and delete obsolete ones
        const tx = this.db.transaction('products', 'readwrite');
        const store = tx.objectStore('products');
        updatedProducts.forEach(p => store.put(p));
        idsToDelete.forEach(id => {
          console.log('Deleting obsolete product from local DB:', id);
          store.delete(id);
        });
        await new Promise(resolve => tx.oncomplete = resolve);
      } else {
        // Fallback safety if no products imported (should not happen since we return earlier on error)
        const tx = this.db.transaction('products', 'readwrite');
        const store = tx.objectStore('products');
        localProducts.forEach(p => store.put(p));
        await new Promise(resolve => tx.oncomplete = resolve);
      }

      this._notifyListener('products');

      // Sync members from Google Sheets if available
      if (qrText) {
        try {
          console.log('Parsing QR code links from Google Drive...');
          const qrRows = this._parseCSV(qrText);
          const validKeys = ['bcel_lak','bcel_thb','bcel_cny','ldb_lak','ldb_thb','ldb_cny'];
          if (!settings.qr_codes) settings.qr_codes = {};
          let changed = false;
          qrRows.forEach((row, idx) => {
            if (idx === 0) return; // header: name,url
            const name = row[0] ? row[0].trim().toLowerCase() : '';
            const url = row[1] ? row[1].trim() : '';
            if (validKeys.indexOf(name) !== -1 && url) {
              settings.qr_codes[name] = url;
              changed = true;
            }
          });
          if (changed) await this.saveSettings(settings);
          console.log('QR code links synced from Google Drive.');
        } catch (err) {
          console.error('Failed to parse QR links:', err);
        }
      }

      if (cashiersText) {
        try {
          console.log('Parsing and updating cashiers from Google Sheets...');
          const cashierRows = this._parseCSV(cashiersText);
          const txC = this.db.transaction('cashiers', 'readwrite');
          const storeC = txC.objectStore('cashiers');
          // The Sheet is the master source for staff accounts: clear the local list first,
          // then repopulate so removed staff and changed roles/PINs are reflected exactly.
          storeC.clear();
          cashierRows.forEach((row, idx) => {
            if (idx === 0) return; // skip header row
            // Columns: A=employee_id, B=name, C=department, D=role, E=pin
            const empId = row[0] ? row[0].trim() : '';
            const name = row[1] ? row[1].trim() : '';
            if (!empId || !name) return; // both employee_id and name are required
            // Columns: A=employee_id, B=name, C=department, D=role, E=pin, F=pos (POS key)
            storeC.put({
              id: empId,
              employee_id: empId,
              name: name,
              department: row[2] ? row[2].trim() : '',
              role: normalizeRole(row[3], row[2]),
              pin: row[4] ? row[4].toString().trim() : '',
              pos: row[5] ? row[5].trim() : ''
            });
          });
          await new Promise(resolve => txC.oncomplete = resolve);
          console.log('Cashiers synced successfully from Google Sheets.');
          this._notifyListener('cashiers');
        } catch (err) {
          console.error('Failed to parse or save synced cashiers:', err);
        }
      }

      if (membersText) {
        try {
          console.log('Parsing and updating members from Google Sheets...');
          const memberRows = this._parseCSV(membersText);
          const txSess = this.db.transaction('members', 'readwrite');
          const storeSess = txSess.objectStore('members');
          
          memberRows.forEach((row, idx) => {
            if (idx === 0 || row.length < 6) return; // Skip header or invalid rows
            const memberId = row[0] ? row[0].trim() : '';
            if (!memberId) return;
            
            const memberObj = {
              id: memberId,
              name: row[1] ? row[1].trim() : '',
              surname: row[2] ? row[2].trim() : '',
              phone: row[3] ? row[3].trim() : '',
              email: row[4] ? row[4].trim() : '',
              points: parseFloat(row[5] ? row[5].toString().replace(/[^\d\.]/g, '') : '0') || 0,
              date_registered: row[6] ? row[6].trim() : ''
            };
            storeSess.put(memberObj);
          });
          await new Promise(resolve => txSess.oncomplete = resolve);
          console.log('Members synced successfully from Google Sheets.');
          this._notifyListener('members');
        } catch (err) {
          console.error('Failed to parse or save synced members:', err);
        }
      }
      if (pettyText) {
        try {
          console.log('Parsing and updating petty cash sessions from Google Sheets...');
          const pettyRows = this._parseCSV(pettyText);
          const txSess = this.db.transaction('petty_cash', 'readwrite');
          const storeSess = txSess.objectStore('petty_cash');
          
          pettyRows.forEach((row, idx) => {
            if (idx === 0 || row.length < 11) return; // Skip header or invalid rows
            const sessionId = row[10] ? row[10].trim() : '';
            if (!sessionId) return;
            
            const sessionObj = {
              id: sessionId,
              date: row[0] ? row[0].trim() : '',
              pos: row[1] ? row[1].trim() : '',
              cashier: row[2] ? row[2].trim() : '',
              lak_start: parseFloat(row[3] ? row[3].replace(/[^\d\.\-]/g, '') : '0') || 0,
              thb_start: parseFloat(row[4] ? row[4].replace(/[^\d\.\-]/g, '') : '0') || 0,
              cny_start: parseFloat(row[5] ? row[5].replace(/[^\d\.\-]/g, '') : '0') || 0,
              lak_remaining: parseFloat(row[6] ? row[6].replace(/[^\d\.\-]/g, '') : '0') || 0,
              thb_remaining: parseFloat(row[7] ? row[7].replace(/[^\d\.\-]/g, '') : '0') || 0,
              cny_remaining: parseFloat(row[8] ? row[8].replace(/[^\d\.\-]/g, '') : '0') || 0,
              closed: row[11] ? row[11].trim().toUpperCase() === 'TRUE' : true
            };
            storeSess.put(sessionObj);
          });
          await new Promise(resolve => txSess.oncomplete = resolve);
          console.log('Petty cash sessions synced successfully from Google Sheets.');
        } catch (err) {
          console.error('Failed to parse or save synced petty cash sessions:', err);
        }
      }

      if (salesText) {
        try {
          console.log('Parsing and updating sales transactions from Google Sheets...');
          const salesRows = this._parseCSV(salesText);
          const _sheetIds = new Set();
          const txSess = this.db.transaction('transactions', 'readwrite');
          const storeSess = txSess.objectStore('transactions');

          salesRows.forEach((row, idx) => {
            if (idx === 0 || row.length < 10) return; // Skip header or invalid rows
            const txId = row[0] ? row[0].trim() : '';
            if (!txId) return;
            _sheetIds.add(txId);

            // Reconstruct transaction object
            const totalThb = parseFloat(row[18] ? row[18].replace(/[^\d\.\-]/g, '') : '0') || 0;
            const totalLak = parseFloat(row[17] ? row[17].replace(/[^\d\.\-]/g, '') : '0') || 0;
            const totalCny = parseFloat(row[19] ? row[19].replace(/[^\d\.\-]/g, '') : '0') || 0;

            const subtotalLak = parseFloat(row[10] ? row[10].replace(/[^\d\.\-]/g, '') : '0') || 0;
            const subtotalThb = parseFloat(row[11] ? row[11].replace(/[^\d\.\-]/g, '') : '0') || 0;
            const subtotalCny = parseFloat(row[12] ? row[12].replace(/[^\d\.\-]/g, '') : '0') || 0;

            const costLak = parseFloat(row[20] ? row[20].replace(/[^\d\.\-]/g, '') : '0') || 0;
            const costThb = parseFloat(row[21] ? row[21].replace(/[^\d\.\-]/g, '') : '0') || 0;
            const costCny = parseFloat(row[22] ? row[22].replace(/[^\d\.\-]/g, '') : '0') || 0;

            const profitLak = parseFloat(row[23] ? row[23].replace(/[^\d\.\-]/g, '') : '0') || 0;
            const profitThb = parseFloat(row[24] ? row[24].replace(/[^\d\.\-]/g, '') : '0') || 0;
            const profitCny = parseFloat(row[25] ? row[25].replace(/[^\d\.\-]/g, '') : '0') || 0;

            const discountPercent = parseFloat(row[13] ? row[13].replace(/[^\d\.\-]/g, '') : '0') || 0;
            const discountAmountLak = parseFloat(row[14] ? row[14].replace(/[^\d\.\-]/g, '') : '0') || 0;

            const vatPercent = parseFloat(row[15] ? row[15].replace(/[^\d\.\-]/g, '') : '0') || 0;
            const vatAmountLak = parseFloat(row[16] ? row[16].replace(/[^\d\.\-]/g, '') : '0') || 0;

            const paidAmount = parseFloat(row[8] ? row[8].replace(/[^\d\.\-]/g, '') : '0') || 0;
            const changeAmount = parseFloat(row[9] ? row[9].replace(/[^\d\.\-]/g, '') : '0') || 0;

            const earnedPoints = parseFloat(row[27] ? row[27].replace(/[^\d\.\-]/g, '') : '0') || 0;

            let timestampStr = row[1] ? row[1].trim() : '';
            let parsedTimestamp = new Date().toISOString();
            if (timestampStr) {
              // รองรับ "YYYY-MM-DD H:M:S" (ชั่วโมง/นาที หลักเดียว) โดยไม่ให้ throw
              const _m = timestampStr.match(/^(\d{4})-(\d{1,2})-(\d{1,2})[ T](\d{1,2}):(\d{1,2})(?::(\d{1,2}))?/);
              let _d = null;
              if (_m) {
                _d = new Date(Number(_m[1]), Number(_m[2]) - 1, Number(_m[3]), Number(_m[4]), Number(_m[5]), Number(_m[6] || 0));
              } else {
                const _t = new Date(timestampStr);
                if (!isNaN(_t.getTime())) _d = _t;
              }
              if (_d && !isNaN(_d.getTime())) parsedTimestamp = _d.toISOString();
            }

            const itemsStr = row[4] ? row[4].trim() : '';
            const items = itemsStr.split(',').map(part => {
              part = part.trim();
              const match = part.match(/(.+)\s*\((\d+)\s*items?\)/);
              if (match) {
                const name = match[1].trim();
                const qty = parseInt(match[2], 10) || 1;
                const p = localProducts.find(prod => prod.name_lo === name || prod.name_en === name);
                return {
                  id: p ? p.id : '',
                  code: p ? p.code : '',
                  name_lo: name,
                  name_en: p ? p.name_en : name,
                  price_lak: p ? p.price_lak : 0,
                  price_thb: p ? p.price_thb : 0,
                  price_cny: p ? p.price_cny : 0,
                  cost_thb: p ? p.cost_thb : 0,
                  qty: qty
                };
              }
              const p = localProducts.find(prod => prod.name_lo === part || prod.name_en === part);
              return {
                id: p ? p.id : '',
                code: p ? p.code : '',
                name_lo: part,
                name_en: p ? p.name_en : part,
                price_lak: p ? p.price_lak : 0,
                price_thb: p ? p.price_thb : 0,
                price_cny: p ? p.price_cny : 0,
                cost_thb: p ? p.cost_thb : 0,
                qty: 1
              };
            });

            const posName = row[2] ? row[2].trim() : '';
            const matchingPOS = settings.pos_points ? settings.pos_points.find(p => p.name === posName) : null;
            const serviceType = matchingPOS ? matchingPOS.serviceType : 'ຮ້ານຂາຍເຄື່ອງບໍລິໂພກ';

            const txObj = {
              id: txId,
              timestamp: parsedTimestamp,
              pos: posName,
              serviceType: serviceType,
              cashier: row[3] ? row[3].trim() : '',
              items: items,
              subtotal_lak: subtotalLak,
              subtotal_thb: subtotalThb,
              subtotal_cny: subtotalCny,
              discount_percent: discountPercent,
              discount_amount_lak: discountAmountLak,
              discount_amount_thb: parseFloat((discountAmountLak / (settings.exchange_rate_lak || 700)).toFixed(2)),
              discount_amount_cny: parseFloat((discountAmountLak / (settings.exchange_rate_lak || 700) * (settings.exchange_rate_cny || 0.2)).toFixed(2)),
              vat_percent: vatPercent,
              vat_amount_lak: vatAmountLak,
              vat_amount_thb: parseFloat((vatAmountLak / (settings.exchange_rate_lak || 700)).toFixed(2)),
              vat_amount_cny: parseFloat((vatAmountLak / (settings.exchange_rate_lak || 700) * (settings.exchange_rate_cny || 0.2)).toFixed(2)),
              total_lak: totalLak,
              total_thb: totalThb,
              total_cny: totalCny,
              cost_lak: costLak,
              cost_thb: costThb,
              cost_cny: costCny,
              profit_lak: profitLak,
              profit_thb: profitThb,
              profit_cny: profitCny,
              paid_currency: row[7] ? row[7].trim() : 'LAK',
              paid_amount: paidAmount,
              change_amount: changeAmount,
              payment_type: row[5] ? row[5].trim() : 'ເງິນສົດ',
              bank: row[6] && row[6].trim() !== '-' ? row[6].trim() : null,
              member_id: row[26] && row[26].trim() !== '-' ? row[26].trim() : '-',
              earned_points: earnedPoints
            };

            storeSess.put(txObj);
          });

          await new Promise(resolve => txSess.oncomplete = resolve);

          // Sheet = ฐานข้อมูลจริง: ลบรายการใน local ที่ไม่มีใน Sheet (orphan) ยกเว้นที่เพิ่งสร้าง < 15 นาที (รอ sync ขึ้น Sheet)
          try {
            const _allLocal = await this.getTransactions();
            const _cutoff = Date.now() - 15 * 60 * 1000;
            const _orphans = _allLocal.filter(t => !_sheetIds.has(t.id) && (new Date(t.timestamp).getTime() || 0) < _cutoff);
            if (_orphans.length > 0) {
              const _delTx = this.db.transaction('transactions', 'readwrite');
              const _delStore = _delTx.objectStore('transactions');
              _orphans.forEach(t => _delStore.delete(t.id));
              await new Promise(r => _delTx.oncomplete = r);
              console.log('Removed ' + _orphans.length + ' local orphan transaction(s) not in Sheet.');
            }
          } catch (e) { console.warn('Orphan reconcile skipped:', e); }

          console.log('Transactions synced successfully from Google Sheets.');
          this._notifyListener('transactions');
        } catch (err) {
          console.error('Failed to parse or save synced transactions:', err);
        }
      }

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
