const { faker } = require('@faker-js/faker');
const { Category } = require('../src/models/product');

class ProductFactory {
  static build(overrides = {}) {
    return {
      name: faker.commerce.productName(),
      description: faker.commerce.productDescription(),
      price: parseFloat(faker.commerce.price({ min: 1, max: 1000, dec: 2 })),
      available: faker.datatype.boolean(),
      category: faker.helpers.arrayElement(Object.values(Category)),
      ...overrides
    };
  }

  static buildList(count = 1, overrides = {}) {
    return Array.from({ length: count }, () => this.build(overrides));
  }
}

module.exports = { ProductFactory };
