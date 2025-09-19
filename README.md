ש
SuperSmart – Backend

SuperSmart is the server-side application of a smart grocery shopping comparison platform.
It was built with Node.js + Express, uses MongoDB as the main database, and provides RESTful APIs with full documentation through Swagger.

🚀 Technologies

*Node.js + Express – backend framework
*MongoDB + Mongoose – database and ORM
*JWT (jsonwebtoken) – authentication & authorization
*Google Auth Library – Google login integration
*Bcrypt – password hashing
*Swagger (swagger-ui-express + swagger-jsdoc) – API documentation
*Dotenv – environment configuration
*CORS – cross-origin support
*Nodemon – development hot-reload

✨ Main Features

User Authentication & Authorization
*Login with Google or JWT
*Password encryption with Bcrypt

Shopping Cart APIs
*Create, update, and manage shopping carts
*Share carts with other users

Price Tracking APIs
*Historical price data for products
*Real-time price drop notifications

*WebSockets Integration for real-time communication
*Swagger API Docs available at /api-docs


📂 Project Structure
/src
  /controllers   -> Business logic for each feature
  /models        -> Mongoose schemas & data models
  /routes        -> Express routes for APIs
  /services      -> Helper services (auth, price analysis, etc.)
  /middlewares   -> Authentication, validation, error handling
  /config        -> Environment variables, DB connection


⚙️ Installation & Running Locally
# Clone repository
git clone https://github.com/noagedo/SuperSmart-server.git

cd supersmart-backend

# Install dependencies
npm install

# Run with nodemon - local
npm run dev


📦 Main Dependencies
Production
*express
*mongoose
*dotenv
*cors
*swagger-ui-express
*swagger-jsdoc
*bcrypt
*jsonwebtoken
*google-auth-library
*Development
*nodemon
*@types/node
*@types/dotenv
*@types/mongoose
*@types/swagger-ui-express
*@types/cors
*@types/swagger-jsdoc
*@types/bcrypt
*@types/jsonwebtoken
*@types/google-auth-library
*@types/validator
