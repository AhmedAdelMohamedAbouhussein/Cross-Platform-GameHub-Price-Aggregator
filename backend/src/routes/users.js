import express from 'express';
import {addUser, restoreUser} from '../controllers/users/create/addAndRestoreUsers.js'
import {getUserByID, loginUser} from '../controllers/users/record/getUser.js'
import {updateUser} from '../controllers/users/update/updateUserInfo.js'
import {softDeletUser, hardDeleteUser} from '../controllers/users/delete/softAndHardDeleteUser.js'


const router = express.Router();

router.post('/adduser', addUser) 
router.patch('/:email/restore', restoreUser)

router.get('/getbyid/:id', getUserByID)
router.post('/login', loginUser)

router.put('/update/:email', updateUser);

router.delete('/delete/:email', softDeletUser)
router.patch('/:email/permanentDelete', hardDeleteUser)

export default router;