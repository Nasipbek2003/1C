import axios, { AxiosInstance } from 'axios';

class C1Client {
  private client: AxiosInstance;
  private isOnline: boolean = true;

  constructor() {
    const baseURL = process.env.C1_API_URL;
    const username = process.env.C1_API_USERNAME;
    const password = process.env.C1_API_PASSWORD;

    if (!baseURL) {
      console.warn('C1_API_URL not configured, running in offline mode');
      this.isOnline = false;
    }

    this.client = axios.create({
      baseURL,
      auth: username && password ? { username, password } : undefined,
      timeout: 30000,
      headers: {
        'Content-Type': 'application/json'
      }
    });

    // Add response interceptor for error handling
    this.client.interceptors.response.use(
      (response) => response,
      (error) => {
        console.error('1C API Error:', error.message);
        this.isOnline = false;
        throw error;
      }
    );
  }

  async getProducts() {
    if (!this.isOnline) {
      throw new Error('1C System is offline');
    }

    try {
      const response = await this.client.get('/api/products');
      this.isOnline = true;
      return response.data.products;
    } catch (error) {
      this.isOnline = false;
      throw error;
    }
  }

  async getCustomers() {
    if (!this.isOnline) {
      throw new Error('1C System is offline');
    }

    try {
      const response = await this.client.get('/api/customers');
      this.isOnline = true;
      return response.data.customers;
    } catch (error) {
      this.isOnline = false;
      throw error;
    }
  }

  async createOrder(orderData: any) {
    if (!this.isOnline) {
      throw new Error('1C System is offline');
    }

    try {
      const response = await this.client.post('/api/orders', orderData);
      this.isOnline = true;
      return response.data;
    } catch (error) {
      this.isOnline = false;
      throw error;
    }
  }

  async getOrderStatus(orderId: string) {
    if (!this.isOnline) {
      throw new Error('1C System is offline');
    }

    try {
      const response = await this.client.get(`/api/orders/${orderId}`);
      this.isOnline = true;
      return response.data;
    } catch (error) {
      this.isOnline = false;
      throw error;
    }
  }

  isSystemOnline(): boolean {
    return this.isOnline;
  }
}

export const c1Client = new C1Client();
