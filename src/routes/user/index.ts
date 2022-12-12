import { Router } from 'express';

import controller from '../../controllers/User';
import { Schemas, ValidateJoi } from '../../middleware/Joi';
import { validateToken } from '../../middleware/validate';
const router = Router();

//Auth routes
router.post('/signup', ValidateJoi(Schemas.user.create), controller.signup);
router.post('/login', ValidateJoi(Schemas.user.login), controller.login);
router.post('/logout', validateToken, controller.logout);
router.post('/refresh_token', controller.refreshToken);

//User Routes (role==='USER')
router.get('/getself', validateToken, controller.getSelfUser);
router.patch('/update_self', validateToken, controller.updateSelfUser);

export default router;
