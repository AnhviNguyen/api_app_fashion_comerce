const express = require('express');
const router = express.Router();
const { db } = require('../config');

// Định nghĩa các route
router.get('/', (req, res) => {
    res.send('Get all products');
});

//random  color
function generateRandomColor() {
    const r = Math.floor(Math.random() * 256);
    const g = Math.floor(Math.random() * 256);
    const b = Math.floor(Math.random() * 256);
    const a = (Math.random() * (1 - 0.5) + 0.5).toFixed(2); // Alpha value between 0.5 and 1 for better visibility
    return `rgba(${r}, ${g}, ${b}, ${a})`;
  }

router.post("/create", async (req, res) => {
    try{
        const productJson = {
            name: req.body.name,
            image_path: req.body.image_path,
            id_cate: req.body.id_cate,
            brand_id: req.body.brand_id,
            price: req.body.price,
            sale_price: req.body.sale_price,
            product_description: req.body.product_description,
            available_size: req.body.available_size,
            available_colors: req.body.available_colors,
            sizes: req.body.sizes,
            colors: req.body.sizes,
            sizes: req.body.sizes,
            raking: req.body.raking,
        }
        // const response = await db.collection("products").doc(id).set(productJson);
        const response = await db.collection("products").add(productJson);
        console.log(response.id);
        res.send(productJson)
    }
    catch(err){
        res.send(err);
        console.log(err)
     }
});

const shuffleArray = (array) => {
    for (let i = array.length - 1; i > 0; i--) {
        const j = Math.floor(Math.random() * (i + 1));
        [array[i], array[j]] = [array[j], array[i]];
    }
    return array;
};


router.get("/read/all", async (req, res) => {
    try{
        const response = await db.collection("products").get();
        let responeArr =[];
        response.forEach(doc => {
            responeArr.push( {id: doc.id,  ...doc.data()})
        });
        res.send(responeArr)
    }catch(error){
        res.send(error)
    }
});

//read by id
router.get("/read/:id", async (req, res) => {
    try{
        const id = req.params.id;
        const response = await db.collection("products").doc(id).get();
        res.send({id: response.id, ...response.data()})
    }catch (error){
        res.send(error)
    }
});

//update
router.post("/update/:id", async (req, res) => {

    const colors = req.body.colors.map(() => generateRandomColor());

    try{
        const id = req.params.id;
        const productJson = {
            name: req.body.name,
            image_path: req.body.image_path,
            id_cate: req.body.id_cate,
            price: req.body.price,
            sale_price: req.body.sale_price,
            product_description: req.body.product_description,
            available_size: req.body.available_size,
            available_colors: req.body.available_colors,
            sizes: req.body.sizes,
            colors: colors,
            sizes: req.body.sizes,
            raking: req.body.raking,
        }
        const response = await db.collection("products").doc(id).update(productJson);
        console.log(response);
        
        res.send({id: response.id, ...response.data()})
    }catch(err){
        res.send(err);
        console.log(err);
     }
});

//delete
router.delete("/delete/:id", async (req, res) => {
    try{
        const id = req.params.id;
        const response = await db.collection("products").doc(id).delete();
        console.log(response);
        res.send({id: response.id, ...response.data()})
    }catch(err){
        res.send(err);
        console.log(err);
     }
});

//product popular
router.get("/popular", async (req, res) => {
    try {
        // Fetch all products
        const productsResponse = await db.collection("products").get();
        let productsArr = [];
        productsResponse.forEach(doc => {
            productsArr.push({ id: doc.id, ...doc.data() });
        });

        // Fetch all brands
        const brandsResponse = await db.collection("brands").get();
        let brandsMap = {};
        brandsResponse.forEach(doc => {
            brandsMap[doc.id] = doc.data().name;
        });
        // console.log(brandsMap);

        // Add brand_name to each product
        productsArr = productsArr.map(product => ({
            ...product,
            brand_name: brandsMap[product.brand_id] || "Unknown Brand",
            discount: product.price > 0 
                ? parseFloat(((product.price - product.sale_price) / product.price * 100).toFixed(1))
                : 0
        }));

        // Shuffle the products array
        productsArr = shuffleArray(productsArr);
        // console.log(productsArr);

        res.send(productsArr);
    } catch (error) {
        res.send(error);
    }
});

//productByCate
router.get("/productByCate/:id_cate", async (req, res) => {
    try {
        const id_cate = req.params.id_cate;
        const categoryDoc = await db.collection("category").doc(id_cate).get();
        
        if (!categoryDoc.exists) {
            return res.status(404).send("Danh mục không tồn tại");
        }
        
        const categoryData = categoryDoc.data();

        // Fetch products by category
        const productsSnapshot = await db.collection("products").where("id_cate", "==", id_cate).get();
        let productsArr = [];
        productsSnapshot.forEach(doc => {
            productsArr.push({ id: doc.id, ...doc.data() });
        });

        // Fetch all brands
        const brandsResponse = await db.collection("brands").get();
        let brandsMap = {};
        brandsResponse.forEach(doc => {
            brandsMap[doc.id] = doc.data().name;
        });

        // Add brand_name and discount to each product
        productsArr = productsArr.map(product => ({
            ...product,
            brand_name: brandsMap[product.brand_id] || "Unknown Brand",
            discount: product.price > 0 
                ? parseFloat(((product.price - product.sale_price) / product.price * 100).toFixed(1))
                : 0
        }));

        res.send(productsArr);
    } catch (error) {
        res.status(500).send(error);
        console.log(error);
    }
});

router.get('/search', async (req, res) => {
    const query = req.query.query;
  
    if (!query) {
      return res.status(400).send('Query parameter is required');
    }
  
    try {
      const productsRef = db.collection('products');
      const brandsRef = db.collection('brands');
  
      // Search in products collection
      const productsSnapshot = await productsRef.where('name', '>=', query).where('name', '<=', query + '\uf8ff').get();
      
      // Fetch all brands
      const brandsSnapshot = await brandsRef.get();
      let brandsMap = {};
      brandsSnapshot.forEach(doc => {
          brandsMap[doc.id] = doc.data().name;
      });

      // Process products and add brand_name and discount
      const products = productsSnapshot.docs.map(doc => {
          const productData = doc.data();
          return {
              id: doc.id,
              ...productData,
              brand_name: brandsMap[productData.brand_id] || "Unknown Brand",
              discount: productData.price > 0 
                  ? parseFloat(((productData.price - productData.sale_price) / productData.price * 100).toFixed(1))
                  : 0
          };
      });
  
      res.json({
        products: products,
      });
    } catch (error) {
      console.error('Error searching:', error);
      res.status(500).send('Internal Server Error');
    }
});



//productsWithFilter
router.get('/productsWithFilter', async (req, res) => {
    const { size, priceRange, sort } = req.query;

    let query = db.collection('products');

    // Lọc theo kích thước
    if (size) {
        query = query.where('sizes', 'array-contains', size);
    }

    // Lọc theo khoảng giá
    if (priceRange) {
        const [minPrice, maxPrice] = priceRange.split('-').map(Number);
        if (!isNaN(minPrice) && !isNaN(maxPrice)) {
            query = query.where('price', '>=', minPrice).where('price', '<=', maxPrice);
        } else {
            // Handle invalid price range
            return res.status(400).json({ error: 'Invalid price range' });
        }
    }

    try {
        const response = await query.get();
        let filteredProducts = [];

        // Fetch all brands
        const brandsRef = db.collection('brands');
        const brandsSnapshot = await brandsRef.get();
        let brandsMap = {};
        brandsSnapshot.forEach(doc => {
            brandsMap[doc.id] = doc.data().name;
        });

        response.forEach(doc => {
            const productData = doc.data();
            filteredProducts.push({
                id: doc.id,
                ...productData,
                brand_name: brandsMap[productData.brand_id] || "Unknown Brand",
                discount: productData.price > 0 
                    ? parseFloat(((productData.price - productData.sale_price) / productData.price * 100).toFixed(1))
                    : 0
            });
        });

        // Sắp xếp
        if (sort) {
            if (sort === 'priceLowToHigh') {
                filteredProducts.sort((a, b) => a.price - b.price);
            } else if (sort === 'priceHighToLow') {
                filteredProducts.sort((a, b) => b.price - a.price);
            } else if (sort === 'rating') {
                filteredProducts.sort((a, b) => b.rating - a.rating);
            }
        }

        res.json(filteredProducts);
    } catch (error) {
        res.status(500).send(error.message);
    }
});

module.exports = router;