const express = require('express');
const router = express.Router();
const { db } = require('../config');

// Định nghĩa các route
router.get('/', (req, res) => {
    res.send('Get all cart');
});

router.post("/create", async (req, res) => {
    try{
        const cartJson = {
            userId: req.body.userId,
            productId: req.body.productId,
            quantity: req.body.quantity,
        }
        const response = db.collection("cart").add(cartJson);
        console.log(response);
        res.send(cartJson)
    }
    catch(err){
        res.send(err);
        console.log(err)
     }
});

router.get("/read/all", async (req, res) => {
    try{
        const response = await db.collection("cart").get();
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

        const cartSnapshot = await db.collection("cart").where("userId", "==", userId).get();
        
        if (cartSnapshot.empty) {
            return res.status(404).send('No items found in this user\'s cart.');
        }

        // Fetch all brands
        const brandsResponse = await db.collection("brands").get();
        let brandsMap = {};
        brandsResponse.forEach(doc => {
            brandsMap[doc.id] = doc.data().name;
        });

        const cartItems = await Promise.all(cartSnapshot.docs.map(async (doc) => {
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

        res.send(cartItems);
    } catch (error) {
        console.error('Error retrieving cart items:', error);
        res.status(500).send(`An error occurred while retrieving data: ${error.message}`);
    }
});

//update
router.post("/update/:userId/:productId", async (req, res) => {
    try {
        const { userId, productId } = req.params; // Retrieve userId and productId from URL parameters
        const { quantity } = req.body; // Retrieve the updated quantity from the request body

        if (quantity == null || quantity < 0) { // Ensure quantity is provided and is non-negative
            return res.status(400).send({ error: 'Valid quantity is required' });
        }

        // Reference to the cart collection and find the specific document with the given userId and productId
        const cartRef = db.collection("cart");
        const querySnapshot = await cartRef.where("userId", "==", userId)
                                          .where("productId", "==", productId)
                                          .get();

        if (querySnapshot.empty) {
            return res.status(404).send({ error: 'Cart item not found' });
        }

        // Update the quantity of the specific cart item
        const doc = querySnapshot.docs[0]; // Get the first document from the query results
        await doc.ref.update({ quantity: quantity });

        res.send({ success: true, message: 'Quantity updated successfully' });
    } catch (err) {
        console.error(err);
        res.status(500).send({ error: 'Failed to update quantity' });
    }
});



//delete
router.delete("/delete/:userId/:productId", async (req, res) => {
    try {
        const userId = req.params.userId;
        const productId = req.params.productId;

        const cartQuery = await db.collection("cart")
            .where("userId", "==", userId)
            .where("productId", "==", productId)
            .get();

        if (cartQuery.empty) {
            return res.status(404).send("Item not found in cart");
        }
        const cartDoc = cartQuery.docs[0];
        
        await cartDoc.ref.delete();

        res.status(200).send({ message: "Item successfully deleted from cart" });
    } catch (err) {
        console.error("Error deleting item from cart:", err);
        res.status(500).send("An error occurred while deleting the item");
    }
});

module.exports = router;