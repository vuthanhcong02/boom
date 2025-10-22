// map_templates.js
// Chú thích: 'W' = Tường (Wall), 'C' = Hòm (Chest), 'null' = Ô trống

// Map 1: Underwater (image_0afc94.jpg)
// Legend: Brown = W, Green = C, Blue = null
const MAP_TEMPLATE_1 = [
    ['W','W','W','W','W','W','W','W','W','W','W','W','W'],
    ['W',null,null,'C','C',null,'C',null,'C','C',null,null,'W'],
    ['W',null,'W','C','W','C','W','C','W','C','W',null,'W'],
    ['W','C','C','C','C','C','W','C','C','C','C','C','W'],
    ['W','C','W','C','W','C',null,null,'W','C','W','C','W'],
    ['W','C','C','W','C','W','C','W','C','W','C','C','W'],
    ['W','W','W','C','C','C','W','C','C','C','W','W','W'],
    ['W','C','C','W','C','W','C','W','C','W','C','C','W'],
    ['W','C','W','C','W',null,null,'C','W','C','W','C','W'],
    ['W','C','C','C','C','C','W','C','C','C','C','C','W'],
    ['W',null,'W','C','W','C','W','C','W','C','W',null,'W'],
    ['W',null,null,'C','C',null,'C',null,'C','C',null,null,'W'],
    ['W','W','W','W','W','W','W','W','W','W','W','W','W']
];

// Map 2: Forest (image_0aff7a.jpg)
// Legend: Grey = W, Red = C, Green = null
const MAP_TEMPLATE_2 = [
    ['W','W','W','W','W','W','W','W','W','W','W','W','W'],
    ['W',null,null,'C','C',null,'C',null,'C','C',null,null,'W'],
    ['W',null,'W',null,'C',null,'C',null,'C',null,'W',null,'W'],
    ['W','C','C','C','W','W','C','W','W','C','C','C','W'],
    ['W','C',null,null,null,'C',null,'C',null,null,null,'C','W'],
    ['W',null,'W',null,'W','C','W','C','W',null,'W',null,'W'],
    ['W','C','C','C',null,null,null,null,null,'C','C','C','W'],
    ['W',null,'W',null,'W','C','W','C','W',null,'W',null,'W'],
    ['W','C',null,null,null,'C',null,'C',null,null,null,'C','W'],
    ['W','C','C','C','W','W','C','W','W','C','C','C','W'],
    ['W',null,'W',null,'C',null,'C',null,'C',null,'W',null,'W'],
    ['W',null,null,'C','C',null,'C',null,'C','C',null,null,'W'],
    ['W','W','W','W','W','W','W','W','W','W','W','W','W']
];

// Map 3: Stone (image_0affc1.jpg)
// Legend: Red = W, Blue = C, Grey = null
const MAP_TEMPLATE_3 = [
    ['W','W','W','W','W','W','W','W','W','W','W','W','W'],
    ['W',null,null,'C','C','C',null,'C','C','C',null,null,'W'],
    ['W',null,'W','C','W','C','W','C','W','C','W',null,'W'],
    ['W','C','C','C','C','C','C','C','C','C','C','C','W'],
    ['W','C','W','C','W','C','W','C','W','C','W','C','W'],
    ['W','C','C','C','C','W','W','W','C','C','C','C','W'],
    ['W',null,'W','C','W','W','W','W','W','C','W',null,'W'],
    ['W','C','C','C','C','W','W','W','C','C','C','C','W'],
    ['W','C','W','C','W','C','W','C','W','C','W','C','W'],
    ['W','C','C','C','C','C','C','C','C','C','C','C','W'],
    ['W',null,'W','C','W','C','W','C','W','C','W',null,'W'],
    ['W',null,null,'C','C','C',null,'C','C','C',null,null,'W'],
    ['W','W','W','W','W','W','W','W','W','W','W','W','W']
];

// ⭐️ "Dấu vân tay" (Fingerprint) - BẠN PHẢI CẬP NHẬT CHUỖI NÀY
export const FINGERPRINT_1 = JSON.stringify(MAP_TEMPLATE_1);
export const FINGERPRINT_2 = JSON.stringify(MAP_TEMPLATE_2);
export const FINGERPRINT_3 = JSON.stringify(MAP_TEMPLATE_3);