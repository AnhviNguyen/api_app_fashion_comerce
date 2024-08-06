const express = require('express');
const router = express.Router();
const { db } = require('../config');

// Định nghĩa các route
router.get('/', (req, res) => {
    res.send('Get all bookmark');
});

router.post("/create", async (req, res) => {
    try{
        const bookmarkJson = {
            userId: req.body.userId,
            productId: req.body.productId,
            quantity: req.body.quantity,
        }
        const response = db.collection("bookmark").add(bookmarkJson);
        console.log(response);
        res.send(bookmarkJson)
    }
    catch(err){
        res.send(err);
        console.log(err)
     }
});

router.get("/read/all", async (req, res) => {
    try{
        const response = await db.collection("bookmark").get();
        let responeArr =[];
        response.forEach(doc => {
            responeArr.push(doc.data())
        });
        res.send(responeArr)
    }catch(error){
        res.send(error)
    }
});

router.get("/read/:id", async (req, res) => {
    try {
        const userId = req.params.id;

        // Query all bookmark items for the user based on userId
        const bookmarkSnapshot = await db.collection("bookmark").where("userId", "==", userId).get();
        
        if (bookmarkSnapshot.empty) {
            return res.status(404).send('No items found in this user\'s bookmark.');
        }

        // Fetch all brands
        const brandsResponse = await db.collection("brands").get();
        let brandsMap = {};
        brandsResponse.forEach(doc => {
            brandsMap[doc.id] = doc.data().name;
        });

        const bookmarkItems = await Promise.all(bookmarkSnapshot.docs.map(async (doc) => {
            const data = doc.data();
            const productDoc = await db.collection("products").doc(data.productId).get();
            let product = null;

            if (productDoc.exists) {
                product = {
                    id: productDoc.id,
                    ...productDoc.data()
                };
                product.brand_name = brandsMap[product.brand_id] || "Unknown Brand";
                product.discount = product.price > 0 
                    ? parseFloat(((product.price - product.sale_price) / product.price * 100).toFixed(1))
                    : 0;
            }

            return {
                product: product,
                quantity: data.quantity
            };
        }));

        res.send(bookmarkItems);
    } catch (error) {
        console.error('Error retrieving bookmark items:', error);
        res.status(500).send(`An error occurred while retrieving data: ${error.message}`);
    }
});

//update
router.post("/update/:id", async (req, res) => {
    try{
        const id = req.params.id;
        const bookmarkJson = {
            userId: req.body.userId,
            productId: req.body.productId,
            quantity: req.body.quantity,
        }
        const response = await db.collection("bookmark").doc(id).update(bookmarkJson);
        console.log(response);
        
        res.send(response);
    }catch(err){
        res.send(err);
        console.log(err);
     }
});

//delete
router.delete("/delete/:userId/:productId", async (req, res) => {
    try {
        const userId = req.params.userId;
        const productId = req.params.productId;

        const bookmarkQuery = await db.collection("bookmark")
            .where("userId", "==", userId)
            .where("productId", "==", productId)
            .get();

        if (bookmarkQuery.empty) {
            return res.status(404).send("Item not found in bookmark");
        }
        const bookmarkDoc = bookmarkQuery.docs[0];
        
        await bookmarkDoc.ref.delete();

        res.status(200).send({ message: "Item successfully deleted from bookmark" });
    } catch (err) {
        console.error("Error deleting item from bookmark:", err);
        res.status(500).send("An error occurred while deleting the item");
    }
});

module.exports = router;