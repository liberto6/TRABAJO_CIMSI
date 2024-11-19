const express = require('express');
const path = require('path');
const { isAuthenticated } = require('../middlewares/auth');
const router = express.Router();

router.get('/', isAuthenticated, (req, res) => {
    res.sendFile(path.join(__dirname, '../../front-end/private/encargado.html'));
});

module.exports = router;
