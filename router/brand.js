const express = require('express');
const router = express.Router();
const { db } = require('../config');

// Định nghĩa các route
router.get('/', (req, res) => {
    res.send('Get all brands');
});

router.post("/create", async (req, res) => {
    try{
        const brandJson = {
            name: req.body.name,
            image_path: req.body.image_path,
            description: req.body.description
        }
        // const response = await db.collection("brands").doc(id).set(brandJson);
        const response = await db.collection("brands").add(brandJson);
        console.log(response.id);
        res.send(brandJson)
    }
    catch(err){
        res.send(err);
        console.log(err)
     }
});

router.get("/read/all", async (req, res) => {
    try{
        const response = await db.collection("brands").get();
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
        const response = await db.collection("brands").doc(id).get();
        res.send({id: response.id, ...response.data()})
    }catch (error){
        res.send(error)
    }
});

//update
router.post("/update/:id", async (req, res) => {
    try{
        const id = req.params.id;
        const brandJson = {
            name: req.body.name,
            image_path: req.body.image_path,
            list_cate: req.body.list_cate,
            list_product: req.body.list_product,
            description: req.body.description
        }
        const response = await db.collection("brands").doc(id).update(brandJson);
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
        const response = await db.collection("brands").doc(id).delete();
        console.log(response);
        res.send({id: response.id, ...response.data()})
    }catch(err){
        res.send(err);
        console.log(err);
     }
});

//productByCate
router.get("/productByCate/:id_cate", async (req, res) => {
    try {
        // res.send("vao product by cate")
        const id_cate = req.params.id_cate;
        const categoryDoc = await db.collection("category").doc(id_cate).get();
        console.log(categoryDoc.data())
        if (!categoryDoc.exists) {
            return res.status(404).send("Danh mục không tồn tại");
        }
        const categoryData = categoryDoc.data();

        const brandsSnapshot = await db.collection("brands").where("id_cate", "==", id_cate).get();
        let brandsArr = [];
        brandsSnapshot.forEach(doc => {
            brandsArr.push({ id: doc.id, ...doc.data() });
        });
        
        const result = {
            category: {
                id: id_cate,
                ...categoryData
            },
            brands: brandsArr
        };

        res.send(result);
    } catch (error) {
        res.status(500).send(error);
        console.log(error);
    }
});

module.exports = router;