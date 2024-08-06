const express = require('express');
const router = express.Router();
const { db } = require('../config');

// Định nghĩa các route
router.get('/', (req, res) => {
    res.send('Get all reviews');
});

router.post("/create", async (req, res) => {
    try{
        const reviewJson = {
            userId: req.body.userId,
            productId: req.body.productId,
            rating: req.body.rating,
            comment: req.body.comment,
            timestamp: req.body.timestamp,
            title: req.body.title,
        }
        // const response = await db.collection("reviews").doc(id).set(reviewJson);
        const response = await db.collection("reviews").add(reviewJson);
        console.log(response.id);
        res.send(reviewJson)
    }
    catch(err){
        res.send(err);
        console.log(err)
     }
});

router.get("/read/all", async (req, res) => {
    try{
        const response = await db.collection("reviews").get();
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
        const response = await db.collection("reviews").doc(id).get();
        res.send({id: response.id, ...response.data()})
    }catch (error){
        res.send(error)
    }
});

//update
router.post("/update/:id", async (req, res) => {
    try{
        const id = req.params.id;
        const reviewJson = {
            userId: req.body.userId,
            productId: req.body.productId,
            rating: req.body.rating,
            comment: req.body.comment,
            timestamp: req.body.timestamp,
            title: req.body.title,
        }
        const response = await db.collection("reviews").doc(id).update(reviewJson);
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
        const response = await db.collection("reviews").doc(id).delete();
        console.log(response);
        res.send({id: response.id, ...response.data()})
    }catch(err){
        res.send(err);
        console.log(err);
     }
});

//review by product
router.get("/by-product/:productId", async (req, res) => {
    try {
        const productId = req.params.productId;

        // Lấy các đánh giá liên quan đến productId
        const reviewsSnapshot = await db.collection("reviews")
            .where("productId", "==", productId)
            .get();
        
        let reviewsWithUsers = [];
        const userPromises = [];

        reviewsSnapshot.forEach(doc => {
            const reviewData = { id: doc.id, ...doc.data() };
            
            // Thực hiện truy vấn để lấy thông tin người dùng dựa trên userId
            userPromises.push(
                db.collection("users").doc(reviewData.userId).get().then(userDoc => {
                    const userData = userDoc.data();
                    reviewData.user = {
                        ...userData,
                        id: userDoc.id  // Thêm userId vào đối tượng user
                    };
                    reviewsWithUsers.push(reviewData);
                })
            );
        });
        await Promise.all(userPromises);
        res.send(reviewsWithUsers);
    } catch (error) {
        res.status(500).send(error);
    }
});

module.exports = router;