/**
 * Inventory Management Core Module
 * Implemented by Alex Mercer (Senior Software Engineer)
 * Based on Architecture Specification by CTO Marcus Vance
 */

export interface Product {
  id: string;
  name: string;
  sku: string;
  stockQuantity: number;
  price: number;
}

export class InventoryManager {
  private products: Map<string, Product> = new Map();

  constructor(initialProducts: Product[] = []) {
    for (const p of initialProducts) {
      this.products.set(p.id, p);
    }
  }

  listProducts(): Product[] {
    return Array.from(this.products.values());
  }

  getProduct(id: string): Product | undefined {
    return this.products.get(id);
  }

  addProduct(product: Omit<Product, 'id'> & { id?: string }): Product {
    if (!product.name || product.name.trim() === '') {
      throw new Error('Product name is required.');
    }
    if (product.stockQuantity < 0) {
      throw new Error('Stock quantity cannot be negative.');
    }
    if (product.price < 0) {
      throw new Error('Price cannot be negative.');
    }

    const id = product.id || 'prod_' + Math.random().toString(36).substring(2, 9);
    const newProduct: Product = {
      id,
      name: product.name.trim(),
      sku: product.sku,
      stockQuantity: product.stockQuantity,
      price: product.price,
    };

    this.products.set(id, newProduct);
    return newProduct;
  }

  updateStock(id: string, delta: number): Product {
    const existing = this.products.get(id);
    if (!existing) {
      throw new Error('Product not found: ' + id);
    }

    const updatedQuantity = existing.stockQuantity + delta;
    if (updatedQuantity < 0) {
      throw new Error('Insufficient stock for product ' + existing.name);
    }

    existing.stockQuantity = updatedQuantity;
    this.products.set(id, existing);
    return existing;
  }

  getTotalInventoryValue(): number {
    let total = 0;
    for (const p of this.products.values()) {
      total += p.stockQuantity * p.price;
    }
    return total;
  }
}
