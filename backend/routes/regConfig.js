const router = require('express').Router();
const { protect } = require('../middleware/auth');
const { requireAdminType } = require('../middleware/role');
const ctrl = require('../controllers/regConfigController');

router.use(protect, requireAdminType('super_admin'));

router.get('/configs',         ctrl.getConfigs);
router.post('/configs',        ctrl.upsertConfig);
router.delete('/configs/:id',  ctrl.deleteConfig);
router.get('/admin-limits',    ctrl.getAdminLimits);
router.put('/admin-limits',    ctrl.updateAdminLimits);

module.exports = router;
