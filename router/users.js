const express = require('express');
const bcrypt = require('bcryptjs'); // Thư viện để mã hóa mật khẩu 
const router = express.Router();
const { admin, db } = require('../config');

// Định nghĩa các route
router.get('/', (req, res) => {
    res.send('Get all users');
});

// dang ki
router.post('/create', async (req, res) => {
    try {
      const { username, email, password } = req.body;
      
      // Mã hóa mật khẩu
      const hashedPassword = await bcrypt.hash(password, 10);
      
      const userJson = {
        username,
        email,
        password: hashedPassword,
      };
      
      // Thêm người dùng vào Firestore
      const response = await admin.firestore().collection('users').add(userJson);
      console.log(response.id);
      res.status(201).send({user:{id: response.id, ...userJson} });
    } catch (err) {
      console.error(err);
      res.status(500).send({ error: 'Internal server error' });
    }
  });

  //login
  router.post('/login', async (req, res) => {
    try {
      const { email, password } = req.body;
  
      // Tìm người dùng trong Firestore
      const usersSnapshot = await db.collection('users').where('email', '==', email).get();
  
      if (usersSnapshot.empty) {
        return res.status(401).send({ error: 'Invalid email or password' });
      }
  
      const userDoc = usersSnapshot.docs[0];
      const userData = userDoc.data();
  
      // So sánh mật khẩu
      const isMatch = await bcrypt.compare(password, userData.password);
  
      if (!isMatch) {
        return res.status(401).send({ error: 'Invalid email or password' });
      }
  
      // Xác thực thành công
      res.status(200).send({ message: 'Login successful', user: {id: usersSnapshot.docs[0].id, email: userData.email, username: userData.username } });
    } catch (err) {
      console.error(err);
      res.status(500).send({ error: 'Internal server error' });
    }
  });

router.get("/read/all", async (req, res) => {
    try{
        const response = await db.collection("users").get();
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
        const response = await db.collection("users").doc(id).get();
        res.send({id: response.id, ...response.data()})
    }catch (error){
        res.send(error)
    }
});

//update
router.post("/update/:id", async (req, res) => {
    try{
        const id = req.params.id;
        const userJson = {
            username: req.body.username,
            email: req.body.email,
            password: req.body.password,
        }
        const response = await db.collection("users").doc(id).update(userJson);
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
        const response = await db.collection("users").doc(id).delete();
        console.log(response);
        res.send({id: response.id, ...response.data()})
    }catch(err){
        res.send(err);
        console.log(err);
     }
});

module.exports = router;