import express from 'express';
import {addUser} from '../controllers/users/create/addAndRestoreUsers.js'
import {getUserByID, getUserIdByEmail, loginUser} from '../controllers/users/record/getUser.js'
import {updateUser} from '../controllers/users/update/updateUserInfo.js'
import {softDeletUser} from '../controllers/users/delete/softAndHardDeleteUser.js'


const router = express.Router();

router.post('/adduser', addUser) 

router.post('/getuseridbyemail', getUserIdByEmail)
router.get('/getbyid/:id', getUserByID)
router.post('/login', loginUser)

router.put('/update/:email', updateUser);

router.delete('/delete/:email', softDeletUser)

export default router;