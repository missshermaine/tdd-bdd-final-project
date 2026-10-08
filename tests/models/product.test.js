const { Product, Category } = require('../../src/models/product');
const { ProductFactory } = require('../factories');

describe('Product Model', () => {
  describe('Product Creation', () => {
    test('should create a product and assert that it exists', () => {
      const productData = {
        name: 'Fedora',
        description: 'A red hat',
        price: 12.50,
        available: true,
        category: Category.CLOTHS
      };
      
      const product = new Product(productData);
      
      expect(product).toBeDefined();
      expect(product.id).toBeNull(); // Not saved yet
      expect(product.name).toBe('Fedora');
      expect(product.description).toBe('A red hat');
      expect(product.available).toBe(true);
      expect(product.price).toBe(12.50);
      expect(product.category).toBe(Category.CLOTHS);
    });
    
    test('should add a product to the database', async () => {
      // Check database is empty
      const products = await Product.findAll();
      expect(products).toEqual([]);
      
      // Create product using factory
      const productData = ProductFactory.build();
      delete productData.id; // Remove ID so database assigns one
      
      const product = await Product.create(productData);
      
      // Assert that it was assigned an id and shows up in the database
      expect(product.id).toBeDefined();
      
      const allProducts = await Product.findAll();
      expect(allProducts.length).toBe(1);
      
      // Check that it matches the original product
      const newProduct = allProducts[0];
      expect(newProduct.name).toBe(productData.name);
      expect(newProduct.description).toBe(productData.description);
      expect(parseFloat(newProduct.price)).toBe(productData.price);
      expect(newProduct.available).toBe(productData.available);
      expect(newProduct.category).toBe(productData.category);
    });
  });

  describe('Product Persistence', () => {
    test('should read a product', async () => {
      const product = Product.build(ProductFactory.build());
      console.log('Product before save:', product.serialize());

      await product.save();
      expect(product.id).not.toBeNull();

      const foundProduct = await Product.findByPk(product.id);
      expect(foundProduct).not.toBeNull();
      expect(foundProduct.name).toBe(product.name);
      expect(foundProduct.description).toBe(product.description);
      expect(parseFloat(foundProduct.price)).toBe(parseFloat(product.price));
      expect(foundProduct.available).toBe(product.available);
      expect(foundProduct.category).toBe(product.category);
    });

    test('should update a product', async () => {
      const product = Product.build(ProductFactory.build());
      console.log('Product before save:', product.serialize());

      await product.save();
      const originalId = product.id;
      console.log('Product after save:', product.serialize());

      product.description = 'Updated product description';
      await product.save();

      expect(product.id).toBe(originalId);
      expect(product.description).toBe('Updated product description');

      const products = await Product.findAll();
      expect(products).toHaveLength(1);
      expect(products[0].id).toBe(originalId);
      expect(products[0].description).toBe('Updated product description');
    });

    test('should delete a product', async () => {
      const product = await Product.create(ProductFactory.build());
      expect(await Product.count()).toBe(1);

      await product.destroy();

      expect(await Product.count()).toBe(0);
      expect(await Product.findByPk(product.id)).toBeNull();
    });

    test('should list all products', async () => {
      expect(await Product.findAll()).toHaveLength(0);

      const products = ProductFactory.buildList(5);
      await Product.bulkCreate(products);

      expect(await Product.findAll()).toHaveLength(5);
    });

    test('should find products by name', async () => {
      const products = ProductFactory.buildList(5);
      await Product.bulkCreate(products);
      const expectedName = products[0].name;
      const expectedCount = products.filter(product => product.name === expectedName).length;

      const foundProducts = await Product.findByName(expectedName);

      expect(foundProducts).toHaveLength(expectedCount);
      foundProducts.forEach(product => expect(product.name).toBe(expectedName));
    });

    test('should find products by category', async () => {
      const products = ProductFactory.buildList(10);
      await Product.bulkCreate(products);
      const expectedCategory = products[0].category;
      const expectedCount = products.filter(product => product.category === expectedCategory).length;

      const foundProducts = await Product.findByCategory(expectedCategory);

      expect(foundProducts).toHaveLength(expectedCount);
      foundProducts.forEach(product => expect(product.category).toBe(expectedCategory));
    });

    test('should find products by availability', async () => {
      const products = ProductFactory.buildList(10);
      await Product.bulkCreate(products);
      const expectedAvailability = products[0].available;
      const expectedCount = products.filter(product => product.available === expectedAvailability).length;

      const foundProducts = await Product.findByAvailability(expectedAvailability);

      expect(foundProducts).toHaveLength(expectedCount);
      foundProducts.forEach(product => expect(product.available).toBe(expectedAvailability));
    });
  });
});
