const express = require('express');
const router = express.Router();
const { db } = require('../config');

// Định nghĩa các route
router.get('/', (req, res) => {
    res.send('Get all category');
});

router.post("/create", async (req, res) => {
    try{
        const cateJson = {
            name: req.body.name,
            image_path: req.body.image_path,
            description: req.body.description,
        }
        // const response = await db.collection("category").doc(id).set(cateJson);
        const response = await db.collection("category").add(cateJson);
        console.log(response.id);
        res.send(cateJson)
    }
    catch(err){
        res.send(err);
        console.log(err)
     }
});

router.get("/read/all", async (req, res) => {
    try{
        const response = await db.collection("category").get();
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
        const response = await db.collection("category").doc(id).get();
        res.send({id: response.id, ...response.data()})
    }catch (error){
        res.send(error)
    }
});

//update
router.post("/update/:id", async (req, res) => {
    try{
        const id = req.params.id;
        const cateJson = {
            name: req.body.name,
            image_path: req.body.image_path,
            description: req.body.description,
        }
        const response = await db.collection("category").doc(id).update(cateJson);
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
        const response = await db.collection("category").doc(id).delete();
        console.log(response);
        res.send({id: response.id, ...response.data()})
    }catch(err){
        res.send(err);
        console.log(err);
     }
});

module.exports = router;