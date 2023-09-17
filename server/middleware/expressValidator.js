const { body, validationResult } = require('express-validator');

// User login Validation using express validator
const validateUserLogin = [
    body('email').isEmail().withMessage('Email is not valid'),
    body('password').isLength({ min: 5 }).withMessage('Password must be at least 5 characters long.').trim(), 
    (req, res, next) => {
        const errors = validationResult(req);
        if (!errors.isEmpty()) {
            return res.status(400).json({ errors: errors.array() });
        }
        next();
    },
];

// User Signup Validation using express validator
const validateUserSignup = [
    body('firstName').notEmpty().isString().withMessage('First name is required.'),
    body('lastName').notEmpty().isString().withMessage('Last name is required'),
    body('email').isEmail().withMessage('Invalid email address.'),
    body('phoneNumber').isMobilePhone().withMessage('Invalid phone number format.'),
    body('password').isLength({ min: 5 }).withMessage('Password must be at least 5 characters long.').trim(),
    (req, res, next) => {
        const errors = validationResult(req);
        if (!errors.isEmpty()) {
            return res.status(400).json({ errors: errors.array() });
        }
        next();
    },
];

module.exports = {validateUserLogin,validateUserSignup};
