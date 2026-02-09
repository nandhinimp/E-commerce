# E-commerce Product API (Assessment Project)

This project is a backend API built using Node.js and Express for an e-commerce product system.  
It includes product listing, cart management, authentication, admin controls, performance fixes, and security improvements.

The original starter code had performance and security issues. Those were identified and fixed as part of the assessment work.

---

## Tech Stack Used

- Node.js
- Express.js
- JSON Web Token (JWT)
- express-rate-limit
- dotenv
- lodash

---

## Project Setup

1. Clone the repository

git clone <your-repo-url>

2. Go inside the project folder

cd assessment-2-ecommerce-api

3. Install dependencies

npm install

---

## Environment Variables

Create a `.env` file in the root folder and add:

JWT_SECRET=your_secret_key_here
PORT=3002

You can use any random string as JWT_SECRET.

---

## Running the Server

Start the server using:

npm run dev

or

node server.js

If everything runs correctly, you should see:

E-commerce Product API running on http://localhost:3002

---

## Base URL

http://localhost:3002

---

## Main API Endpoints

### Products

Get all products with pagination and filters

GET /api/products

Examples:

/api/products?page=1&limit=10  
/api/products?search=phone  
/api/products?category=Electronics  

---

Get single product

GET /api/products/:id

Example:

/api/products/1

---

Create product (Admin only)

POST /api/products

Requires:
Authorization header with admin JWT token

Body example:

{
  "name": "New Item",
  "price": 120,
  "category": "Electronics"
}

---

Update product (Admin only)

PUT /api/products/:id

---

Delete product (Admin only)

DELETE /api/products/:id

---

## Cart Endpoints (Login Required)

All cart routes require JWT token.

Header:

Authorization: Bearer <token>

Get cart:

GET /api/cart

Add item:

POST /api/cart

{
  "productId": "1",
  "quantity": 2
}

Update quantity:

PUT /api/cart

Remove item:

DELETE /api/cart?productId=1

---

## Authentication

JWT based authentication is used.

A sample token generator file is included:

token.js

Run:

node token.js

This prints:
- admin token
- normal user token

Use these tokens in API tools like Bruno or Postman.

---

## Security Fixes Implemented

- Removed admin query parameter bypass
- Removed internal product data exposure
- Added JWT authentication
- Added admin role check for write operations
- Input validation added
- Error responses cleaned (no stack traces)
- Secret endpoint protected
- Rate limiting added

---

## Performance Improvements

- Products generated once at startup (not per request)
- Pagination limits enforced
- Response caching added
- Search indexing added
- Cart total optimized (no repeated recalculation)

---

## Rate Limiting

API has request limits enabled to prevent abuse.

Too many requests will return HTTP 429.

---

## Testing

You can test using:

- Bruno
- Postman
- curl
- Browser (for GET endpoints)

Protected routes must include Authorization header.

---

## Notes

This project was done as part of an assessment.  
Focus was on fixing performance issues, removing security problems, and adding authentication and validation.

Some data is stored in memory (Map objects) since database was not required for this task.

Server restart will reset products and cart data.

---


