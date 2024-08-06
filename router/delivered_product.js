const express = require('express');
const router = express.Router();
const { db } = require('../config');

// Định nghĩa các route
router.get('/', (req, res) => {
    res.send('Get all delivered_product');
});

router.post("/create", async (req, res) => {
    try{
        const delivered_product_json = {
            id_user: req.body.id_user,
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
        // const response = await db.collection("delivered_product").doc(id).set(delivered_product_json);
        const response = await db.collection("delivered_product").add(delivered_product_json);
        console.log(response.id);
        res.send(delivered_product_json)
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
        const response = await db.collection("delivered_product").get();
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
router.get("/read/:userId", async (req, res) => {
    try {
        const userId = req.params.userId;
        
        // Truy vấn tất cả các sản phẩm của người dùng dựa trên userId
        const process_delivered_productnapshot = await db.collection("delivered_product")
            .where("id_user", "==", userId) // Giả sử bạn có trường userId trong collection "delivered_product"
            .get();

        if (process_delivered_productnapshot.empty) {
            return res.status(404).send({ message: "No delivered_product found for this user" });
        }

        // Lấy dữ liệu từ query snapshot
        const delivered_product = process_delivered_productnapshot.docs.map(doc => ({
            id: doc.id,
            ...doc.data(),
            brandName: doc.data().brandName, 
            discount: doc.data().discount  
        }));

        res.send(delivered_product);
    } catch (error) {
        console.error("Error fetching delivered_product:", error);
        res.status(500).send({ error: "Internal Server Error" });
    }
});



//delete
router.delete("/delete/:id", async (req, res) => {
    try{
        const id = req.params.id;
        const response = await db.collection("delivered_product").doc(id).delete();
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
        // Fetch all delivered_product
        const delivered_productResponse = await db.collection("delivered_product").get();
        let delivered_productArr = [];
        delivered_productResponse.forEach(doc => {
            delivered_productArr.push({ id: doc.id, ...doc.data() });
        });

        // Fetch all brands
        const brandsResponse = await db.collection("brands").get();
        let brandsMap = {};
        brandsResponse.forEach(doc => {
            brandsMap[doc.id] = doc.data().name;
        });
        // console.log(brandsMap);

        // Add brand_name to each product
        delivered_productArr = delivered_productArr.map(product => ({
            ...product,
            brand_name: brandsMap[product.brand_id] || "Unknown Brand",
            discount: product.price > 0 
                ? parseFloat(((product.price - product.sale_price) / product.price * 100).toFixed(1))
                : 0
        }));

        // Shuffle the delivered_product array
        delivered_productArr = shuffleArray(delivered_productArr);
        // console.log(delivered_productArr);

        res.send(delivered_productArr);
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

        // Fetch delivered_product by category
        const process_delivered_productnapshot = await db.collection("delivered_product").where("id_cate", "==", id_cate).get();
        let delivered_productArr = [];
        process_delivered_productnapshot.forEach(doc => {
            delivered_productArr.push({ id: doc.id, ...doc.data() });
        });

        // Fetch all brands
        const brandsResponse = await db.collection("brands").get();
        let brandsMap = {};
        brandsResponse.forEach(doc => {
            brandsMap[doc.id] = doc.data().name;
        });

        // Add brand_name and discount to each product
        delivered_productArr = delivered_productArr.map(product => ({
            ...product,
            brand_name: brandsMap[product.brand_id] || "Unknown Brand",
            discount: product.price > 0 
                ? parseFloat(((product.price - product.sale_price) / product.price * 100).toFixed(1))
                : 0
        }));

        res.send(delivered_productArr);
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
      const delivered_productRef = db.collection('delivered_product');
      const brandsRef = db.collection('brands');
  
      // Search in delivered_product collection
      const process_delivered_productnapshot = await delivered_productRef.where('name', '>=', query).where('name', '<=', query + '\uf8ff').get();
      
      // Fetch all brands
      const brandsSnapshot = await brandsRef.get();
      let brandsMap = {};
      brandsSnapshot.forEach(doc => {
          brandsMap[doc.id] = doc.data().name;
      });

      // Process delivered_product and add brand_name and discount
      const delivered_product = process_delivered_productnapshot.docs.map(doc => {
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
        delivered_product: delivered_product,
      });
    } catch (error) {
      console.error('Error searching:', error);
      res.status(500).send('Internal Server Error');
    }
});



//delivered_productWithFilter
router.get('/delivered_productWithFilter', async (req, res) => {
    const { size, priceRange, sort } = req.query;

    let query = db.collection('delivered_product');

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
        let filtereddelivered_product = [];

        // Fetch all brands
        const brandsRef = db.collection('brands');
        const brandsSnapshot = await brandsRef.get();
        let brandsMap = {};
        brandsSnapshot.forEach(doc => {
            brandsMap[doc.id] = doc.data().name;
        });

        response.forEach(doc => {
            const productData = doc.data();
            filtereddelivered_product.push({
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
                filtereddelivered_product.sort((a, b) => a.price - b.price);
            } else if (sort === 'priceHighToLow') {
                filtereddelivered_product.sort((a, b) => b.price - a.price);
            } else if (sort === 'rating') {
                filtereddelivered_product.sort((a, b) => b.rating - a.rating);
            }
        }

        res.json(filtereddelivered_product);
    } catch (error) {
        res.status(500).send(error.message);
    }
});

module.exports = router;