const express = require('express');
const router = express.Router();
const { db } = require('../config');

// Định nghĩa các route
router.get('/', (req, res) => {
    res.send('Get all process_product');
});

router.post("/create", async (req, res) => {
    try{
        const process_product_json = {
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
        // const response = await db.collection("process_product").doc(id).set(process_product_json);
        const response = await db.collection("process_product").add(process_product_json);
        console.log(response.id);
        res.send(process_product_json)
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
        const response = await db.collection("process_product").get();
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
        const process_process_productnapshot = await db.collection("process_product")
            .where("id_user", "==", userId) // Giả sử bạn có trường userId trong collection "process_product"
            .get();

        if (process_process_productnapshot.empty) {
            return res.status(404).send({ message: "No process_product found for this user" });
        }

        // Lấy dữ liệu từ query snapshot
        const process_product = process_process_productnapshot.docs.map(doc => ({
            id: doc.id,
            ...doc.data(),
            brandName: doc.data().brandName, 
            discount: doc.data().discount  
        }));

        res.send(process_product);
    } catch (error) {
        console.error("Error fetching process_product:", error);
        res.status(500).send({ error: "Internal Server Error" });
    }
});



//delete
router.delete("/delete/:id", async (req, res) => {
    try{
        const id = req.params.id;
        const response = await db.collection("process_product").doc(id).delete();
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
        // Fetch all process_product
        const process_productResponse = await db.collection("process_product").get();
        let process_productArr = [];
        process_productResponse.forEach(doc => {
            process_productArr.push({ id: doc.id, ...doc.data() });
        });

        // Fetch all brands
        const brandsResponse = await db.collection("brands").get();
        let brandsMap = {};
        brandsResponse.forEach(doc => {
            brandsMap[doc.id] = doc.data().name;
        });
        // console.log(brandsMap);

        // Add brand_name to each product
        process_productArr = process_productArr.map(product => ({
            ...product,
            brand_name: brandsMap[product.brand_id] || "Unknown Brand",
            discount: product.price > 0 
                ? parseFloat(((product.price - product.sale_price) / product.price * 100).toFixed(1))
                : 0
        }));

        // Shuffle the process_product array
        process_productArr = shuffleArray(process_productArr);
        // console.log(process_productArr);

        res.send(process_productArr);
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

        // Fetch process_product by category
        const process_process_productnapshot = await db.collection("process_product").where("id_cate", "==", id_cate).get();
        let process_productArr = [];
        process_process_productnapshot.forEach(doc => {
            process_productArr.push({ id: doc.id, ...doc.data() });
        });

        // Fetch all brands
        const brandsResponse = await db.collection("brands").get();
        let brandsMap = {};
        brandsResponse.forEach(doc => {
            brandsMap[doc.id] = doc.data().name;
        });

        // Add brand_name and discount to each product
        process_productArr = process_productArr.map(product => ({
            ...product,
            brand_name: brandsMap[product.brand_id] || "Unknown Brand",
            discount: product.price > 0 
                ? parseFloat(((product.price - product.sale_price) / product.price * 100).toFixed(1))
                : 0
        }));

        res.send(process_productArr);
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
      const process_productRef = db.collection('process_product');
      const brandsRef = db.collection('brands');
  
      // Search in process_product collection
      const process_process_productnapshot = await process_productRef.where('name', '>=', query).where('name', '<=', query + '\uf8ff').get();
      
      // Fetch all brands
      const brandsSnapshot = await brandsRef.get();
      let brandsMap = {};
      brandsSnapshot.forEach(doc => {
          brandsMap[doc.id] = doc.data().name;
      });

      // Process process_product and add brand_name and discount
      const process_product = process_process_productnapshot.docs.map(doc => {
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
        process_product: process_product,
      });
    } catch (error) {
      console.error('Error searching:', error);
      res.status(500).send('Internal Server Error');
    }
});



//process_productWithFilter
router.get('/process_productWithFilter', async (req, res) => {
    const { size, priceRange, sort } = req.query;

    let query = db.collection('process_product');

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
        let filteredprocess_product = [];

        // Fetch all brands
        const brandsRef = db.collection('brands');
        const brandsSnapshot = await brandsRef.get();
        let brandsMap = {};
        brandsSnapshot.forEach(doc => {
            brandsMap[doc.id] = doc.data().name;
        });

        response.forEach(doc => {
            const productData = doc.data();
            filteredprocess_product.push({
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
                filteredprocess_product.sort((a, b) => a.price - b.price);
            } else if (sort === 'priceHighToLow') {
                filteredprocess_product.sort((a, b) => b.price - a.price);
            } else if (sort === 'rating') {
                filteredprocess_product.sort((a, b) => b.rating - a.rating);
            }
        }

        res.json(filteredprocess_product);
    } catch (error) {
        res.status(500).send(error.message);
    }
});

module.exports = router;