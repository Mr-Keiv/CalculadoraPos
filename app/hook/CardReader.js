import { NativeModules, NativeEventEmitter } from 'react-native';

const { CardReaderModule } = NativeModules;
const cardReaderEventEmitter = new NativeEventEmitter(CardReaderModule);

/**
 * Class to handle card reader operations for Nexgo payment terminals
 */
class CardReader {
  /**
   * Constructor for CardReader
   */
  constructor() {
    this.isConnected = false;
    this.listeners = [];

    // Setup event listeners
    this.setupEventListeners();
  }

  /**
   * Setup event listeners for card reader events
   */
  setupEventListeners() {
    // Listen for card reader status updates
    this.statusListener = cardReaderEventEmitter.addListener(
      'cardReaderStatus',
      (message) => {
        this.notifyListeners('status', message);
      }
    );

    // Listen for card reader errors
    this.errorListener = cardReaderEventEmitter.addListener(
      'cardReaderError',
      (message) => {
        this.notifyListeners('error', message);
      }
    );
  }

  /**
   * Connect to the card reader service
   * @returns {Promise<boolean>} - Promise resolving to true if connection was successful
   */
  async connect() {
    try {
      // Si ya estamos conectados, simplemente devolver true
      if (this.isConnected) {
        const stillConnected = await this.isServiceConnected();
        if (stillConnected) return true;
      }
      
      // Si no estamos conectados, intentar conectar
      const result = await CardReaderModule.connectService();
      this.isConnected = result;
      return result;
    } catch (error) {
      console.error('Failed to connect to card reader service:', error);
      throw error;
    }
  }

  /**
   * Check if the card reader service is connected
   * @returns {Promise<boolean>} - Promise resolving to the connection state
   */
  async isServiceConnected() {
    try {
      const connected = await CardReaderModule.isServiceConnected();
      this.isConnected = connected;
      return connected;
    } catch (error) {
      console.error('Failed to check card reader service connection:', error);
      this.isConnected = false;
      return false;
    }
  }

  /**
   * Process a payment transaction
   * @param {Object} options - Transaction options
   * @param {number} options.amount - Transaction amount
   * @param {string} options.documentNumber - Customer document number/ID
   * @param {string} options.referenceNo - Reference number for the transaction
   * @param {string} options.waiterNum - Waiter number (if applicable)
   * @param {number} options.transType - Transaction type (consult Nexgo documentation for valid values)
   * @returns {Promise<Object>} - Promise resolving to transaction result
   */
  async processPayment(options) {
    // Intentar conectar primero si no está conectado
    if (!this.isConnected) {
      try {
        await this.connect();
        // Verificar conexión después de intentar conectar
        this.isConnected = await this.isServiceConnected();
      } catch (error) {
        console.error('Failed to connect to card reader before processing payment:', error);
      }
    }

    if (!this.isConnected) {
      throw new Error('Card reader service is not connected');
    }

    try {
      // Asegurar que todos los campos requeridos estén presentes
      const transactionDetails = {
        amount: options.amount || '0',
        documentNumber: options.documentNumber || '',
        referenceNo: options.referenceNo || '',
        waiterNum: options.waiterNum || '',
        transType: options.transType || 1, // Default to sale transaction
      };

      return await CardReaderModule.doTransaction(transactionDetails);
    } catch (error) {
      console.error('Payment processing failed:', error);
      throw error;
    }
  }

  /**
   * Get device information
   * @returns {Promise<Object>} - Promise resolving to device information
   */
  async getDeviceInfo() {
    try {
      return await CardReaderModule.getDeviceInfo();
    } catch (error) {
      console.error('Failed to get device info:', error);
      throw error;
    }
  }

  /**
   * Disconnect from the card reader service
   * @returns {Promise<string>} - Promise resolving to success message
   */
  async disconnect() {
    try {
      if (!this.isConnected) return "Already disconnected";
      
      const result = await CardReaderModule.disconnect();
      this.isConnected = false;
      return result;
    } catch (error) {
      console.error('Failed to disconnect card reader service:', error);
      throw error;
    }
  }

  /**
   * Add event listener
   * @param {string} event - Event name ('status' or 'error')
   * @param {Function} callback - Callback function
   * @returns {string} - Listener ID
   */
  addEventListener(event, callback) {
    if (!callback || typeof callback !== 'function') {
      console.warn('Invalid callback provided to addEventListener');
      return null;
    }
    
    const id = Math.random().toString(36).substr(2, 9);
    this.listeners.push({ id, event, callback });
    return id;
  }

  /**
   * Remove event listener
   * @param {string} id - Listener ID
   */
  removeEventListener(id) {
    if (!id) return;
    this.listeners = this.listeners.filter(listener => listener.id !== id);
  }

  /**
   * Notify all listeners of an event
   * @param {string} event - Event name
   * @param {*} data - Event data
   */
  notifyListeners(event, data) {
    this.listeners
      .filter(listener => listener.event === event)
      .forEach(listener => {
        try {
          listener.callback(data);
        } catch (error) {
          console.error('Error in CardReader event listener callback:', error);
        }
      });
  }

  /**
   * Clean up resources when component unmounts
   */
  cleanup() {
    try {
      if (this.statusListener) {
        this.statusListener.remove();
      }
      if (this.errorListener) {
        this.errorListener.remove();
      }
      this.listeners = [];
      
      // Intentar desconectar el servicio
      if (this.isConnected) {
        this.disconnect().catch(error => {
          console.error('Error disconnecting card reader during cleanup:', error);
        });
      }
    } catch (error) {
      console.error('Error during CardReader cleanup:', error);
    }
  }
}

export default new CardReader();