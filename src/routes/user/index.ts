import { Router } from 'express';

import controller from '../../controllers/User';
import { Schemas, ValidateJoi } from '../../middleware/Joi';
import { validateAdmin, validateToken } from '../../middleware/validate';
const router = Router();

//Auth routes
router.post('/signup', ValidateJoi(Schemas.user.create), controller.signup);
router.post('/login', ValidateJoi(Schemas.user.login), controller.login);
router.post('/logout', validateToken, controller.logout);
router.post('/refresh_token', controller.refreshToken);

//User Routes (role==='USER')
router.get('/getself', validateToken, controller.getSelfUser);
router.patch('/update_self', validateToken, controller.updateSelfUser);

//User Router (role==='ADMIN')
router.get('/get/:id', validateToken, validateAdmin, controller.getUser);
router.get('/all', validateToken, validateAdmin, controller.getAllUser);
router.delete(
  '/delete/:id',
  validateToken,
  validateAdmin,
  controller.deleteUser
);

router.patch(
  '/update/:id',
  validateToken,
  validateAdmin,
  ValidateJoi(Schemas.user.update),
  controller.updateUser
);

export default router;