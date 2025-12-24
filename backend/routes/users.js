import express from 'express';
import User from '../models/User.js';
import { requireAuth, adminAuth } from '../middleware/auth.js';

const router = express.Router();

// Get all users (Admin only)
router.get('/', adminAuth, async (req, res) => {
    try {
        const users = await User.find({}).select('-password').sort({ createdAt: -1 });
        res.json(users);
    } catch (error) {
        res.status(500).json({ message: error.message });
    }
});

// Get user's saved addresses
router.get('/addresses', requireAuth, async (req, res) => {
    try {
        const user = await User.findById(req.user._id).select('savedAddresses');
        res.json({ addresses: user.savedAddresses || [] });
    } catch (error) {
        res.status(500).json({ message: error.message });
    }
});

// Add new address
router.post('/addresses', requireAuth, async (req, res) => {
    try {
        const { name, phone, street, city, state, zip, isDefault } = req.body;

        const user = await User.findById(req.user._id);

        // If this is set as default, unset all other defaults
        if (isDefault) {
            user.savedAddresses.forEach(addr => {
                addr.isDefault = false;
            });
        }

        // If this is the first address, make it default
        const makeDefault = user.savedAddresses.length === 0 || isDefault;

        user.savedAddresses.push({
            name,
            phone,
            street,
            city,
            state,
            zip,
            isDefault: makeDefault,
        });

        await user.save();

        res.status(201).json({
            message: 'Address added successfully',
            addresses: user.savedAddresses,
        });
    } catch (error) {
        res.status(400).json({ message: error.message });
    }
});

// Update address
router.put('/addresses/:addressId', requireAuth, async (req, res) => {
    try {
        const { addressId } = req.params;
        const { name, phone, street, city, state, zip, isDefault } = req.body;

        const user = await User.findById(req.user._id);
        const address = user.savedAddresses.id(addressId);

        if (!address) {
            return res.status(404).json({ message: 'Address not found' });
        }

        // If setting as default, unset all others
        if (isDefault) {
            user.savedAddresses.forEach(addr => {
                addr.isDefault = false;
            });
        }

        address.name = name || address.name;
        address.phone = phone || address.phone;
        address.street = street || address.street;
        address.city = city || address.city;
        address.state = state || address.state;
        address.zip = zip || address.zip;
        address.isDefault = isDefault !== undefined ? isDefault : address.isDefault;

        await user.save();

        res.json({
            message: 'Address updated successfully',
            addresses: user.savedAddresses,
        });
    } catch (error) {
        res.status(400).json({ message: error.message });
    }
});

// Delete address
router.delete('/addresses/:addressId', requireAuth, async (req, res) => {
    try {
        const { addressId } = req.params;

        const user = await User.findById(req.user._id);
        const address = user.savedAddresses.id(addressId);

        if (!address) {
            return res.status(404).json({ message: 'Address not found' });
        }

        const wasDefault = address.isDefault;
        address.remove();

        // If we deleted the default address, make the first remaining address default
        if (wasDefault && user.savedAddresses.length > 0) {
            user.savedAddresses[0].isDefault = true;
        }

        await user.save();

        res.json({
            message: 'Address deleted successfully',
            addresses: user.savedAddresses,
        });
    } catch (error) {
        res.status(500).json({ message: error.message });
    }
});

// Set default address
router.patch('/addresses/:addressId/default', requireAuth, async (req, res) => {
    try {
        const { addressId } = req.params;

        const user = await User.findById(req.user._id);
        const address = user.savedAddresses.id(addressId);

        if (!address) {
            return res.status(404).json({ message: 'Address not found' });
        }

        // Unset all defaults
        user.savedAddresses.forEach(addr => {
            addr.isDefault = false;
        });

        // Set this one as default
        address.isDefault = true;

        await user.save();

        res.json({
            message: 'Default address updated',
            addresses: user.savedAddresses,
        });
    } catch (error) {
        res.status(500).json({ message: error.message });
    }
});

export default router;
