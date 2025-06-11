const express = require('express');
const router = express.Router();

// Giỏ hàng lưu tạm trong bộ nhớ (chưa dùng DB)
let cart = [];

// Lấy danh sách sản phẩm trong giỏ hàng
router.get('/cart', (req, res) => {
  res.json(cart);
});

// Thêm sản phẩm vào giỏ hàng
router.post('/cart', (req, res) => {
  const item = req.body;
  const existing = cart.find(p => p.id === item.id);

  if (existing) {
    existing.quantity += item.quantity;
  } else {
    cart.push(item);
  }

  res.status(201).json({ message: 'Added to cart', cart });
});

// Cập nhật số lượng sản phẩm
router.put('/cart/:id', (req, res) => {
  const id = req.params.id;
  const { quantity } = req.body;
  const item = cart.find(p => p.id === id);

  if (item) {
    item.quantity = quantity;
    res.json({ message: 'Quantity updated', cart });
  } else {
    res.status(404).json({ message: 'Item not found' });
  }
});

// Xóa một sản phẩm khỏi giỏ
router.delete('/cart/:id', (req, res) => {
  const id = req.params.id;
  cart = cart.filter(p => p.id !== id);
  res.json({ message: 'Item deleted', cart });
});

// Xóa toàn bộ giỏ hàng
router.delete('/cart', (req, res) => {
  cart = [];
  res.json({ message: 'Cart cleared' });
});

module.exports = router;
