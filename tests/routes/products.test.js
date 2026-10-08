const request = require('supertest');
const app = require('../../src/app');
const { Product } = require('../../src/models/product');
const { ProductFactory } = require('../factories');
const BASE_URL = '/api/products';

describe('Product Routes', () => {

  
  /**
   * Utility function to bulk create products
   */
  async function createProducts(count = 1) {
    const products = [];
    for (let i = 0; i < count; i++) {
      const productData = ProductFactory.build();
      const product = await Product.create(productData);
      products.push(product);
    }
    return products;
  }
  
  /**
   * Utility function to get product count
   */
  async function getProductCount() {
    const response = await request(app)
      .get(BASE_URL)
      .expect(200);
    return response.body.length;
  }
  
  describe('Basic Endpoints', () => {
    test('should return the index page', async () => {
      const response = await request(app)
        .get('/')
        .expect(200);
      
      expect(response.text).toContain('Product Catalog Administration');
    });
    
    test('should be healthy', async () => {
      const response = await request(app)
        .get(`${BASE_URL}/health`)
        .expect(200);
      
      expect(response.body.message).toBe('OK');
    });
  });

  
  
  describe('CREATE Product', () => {
    test('should create a new product', async () => {
      const testProduct = ProductFactory.build();

      
      const response = await request(app)
        .post(BASE_URL)
        .send(testProduct)
        .expect(201);
      
      // Make sure location header is set
      expect(response.headers.location).toBeDefined();
      
      // Check the data is correct
      const newProduct = response.body;
      expect(newProduct.name).toBe(testProduct.name);
      expect(newProduct.description).toBe(testProduct.description);
      expect(newProduct.price).toBe(testProduct.price);
      expect(newProduct.available).toBe(testProduct.available);
      expect(newProduct.category).toBe(testProduct.category);
      
      
      
      
    });
    
    test('should not create a product without a name', async () => {
      const productData = ProductFactory.build();
      delete productData.name;
      

      
      const response = await request(app)
        .post(BASE_URL)
        .send(productData)
        .expect(400);
      
      expect(response.body.error).toBe('Validation Error');
    });
    
    test('should not create a product with no Content-Type', async () => {
      await request(app)
        .post(BASE_URL)
        .send('bad data')
        .expect(415);
    });
    
    test('should not create a product with wrong Content-Type', async () => {
      await request(app)
        .post(BASE_URL)
        .set('Content-Type', 'text/plain')
        .send('some plain text data')
        .expect(415);
    });

    test('should proceed if content type is correct but has extra parameters', async () => {
      const productData = ProductFactory.build();
      const response = await request(app)
        .post(BASE_URL)
        .set('Content-Type', 'application/json; charset=utf-8')
        .send(productData);

      // We expect a 201, not a 415, because the base type is correct.
      expect(response.status).toBe(201);
    });
  });

  describe('READ Product', () => {
    test('should get a single product', async () => {
      const products = await createProducts(1);
      const testProduct = products[0];

      const response = await request(app)
        .get(`${BASE_URL}/${testProduct.id}`)
        .expect(200);

      expect(response.body).toEqual(testProduct.serialize());
    });

    test('should not get a product that is not found', async () => {
      await request(app)
        .get(`${BASE_URL}/99999`)
        .expect(404);
    });
  });

  describe('UPDATE Product', () => {
    test('should update a product', async () => {
      const products = await createProducts(1);
      const testProduct = products[0];
      const updateData = testProduct.serialize();
      updateData.description = 'Updated description';
      delete updateData.id;

      const response = await request(app)
        .put(`${BASE_URL}/${testProduct.id}`)
        .send(updateData)
        .expect(200);

      expect(response.body.id).toBe(testProduct.id);
      expect(response.body.description).toBe('Updated description');
      const savedProduct = await Product.findByPk(testProduct.id);
      expect(savedProduct.description).toBe('Updated description');
    });

    test('should not update a product that is not found', async () => {
      const updateData = ProductFactory.build();

      await request(app)
        .put(`${BASE_URL}/99999`)
        .send(updateData)
        .expect(404);
    });

    test('should reject an invalid product update', async () => {
      const products = await createProducts(1);
      const updateData = products[0].serialize();
      delete updateData.id;
      updateData.name = '';

      const response = await request(app)
        .put(`${BASE_URL}/${products[0].id}`)
        .send(updateData)
        .expect(400);

      expect(response.body.error).toBe('Validation Error');
    });
  });

  describe('DELETE Product', () => {
    test('should delete a product', async () => {
      const products = await createProducts(1);
      const testProduct = products[0];

      await request(app)
        .delete(`${BASE_URL}/${testProduct.id}`)
        .expect(204);

      expect(await getProductCount()).toBe(0);
    });

    test('should return no content when deleting a missing product', async () => {
      await request(app)
        .delete(`${BASE_URL}/99999`)
        .expect(204);
    });
  });

  describe('LIST Products', () => {
    test('should list all products', async () => {
      await createProducts(5);

      const response = await request(app)
        .get(BASE_URL)
        .expect(200);

      expect(response.body).toHaveLength(5);
    });

    test('should list products by name', async () => {
      await Product.create(ProductFactory.build({ name: 'Fedora' }));
      await Product.create(ProductFactory.build({ name: 'Fedora' }));
      await Product.create(ProductFactory.build({ name: 'Shoes' }));

      const response = await request(app)
        .get(`${BASE_URL}?name=Fedora`)
        .expect(200);

      expect(response.body).toHaveLength(2);
      response.body.forEach(product => expect(product.name).toBe('Fedora'));
    });

    test('should list products by category', async () => {
      await Product.create(ProductFactory.build({ category: 'CLOTHS' }));
      await Product.create(ProductFactory.build({ category: 'CLOTHS' }));
      await Product.create(ProductFactory.build({ category: 'FOOD' }));

      const response = await request(app)
        .get(`${BASE_URL}?category=CLOTHS`)
        .expect(200);

      expect(response.body).toHaveLength(2);
      response.body.forEach(product => expect(product.category).toBe('CLOTHS'));
    });

    test('should list products by availability', async () => {
      await Product.create(ProductFactory.build({ available: true }));
      await Product.create(ProductFactory.build({ available: false }));
      await Product.create(ProductFactory.build({ available: false }));

      const response = await request(app)
        .get(`${BASE_URL}?availability=false`)
        .expect(200);

      expect(response.body).toHaveLength(2);
      response.body.forEach(product => expect(product.available).toBe(false));
    });
  });
});
