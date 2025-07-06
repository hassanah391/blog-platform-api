# Blog Platform API

A robust RESTful API for a blog platform built with Node.js, Express, and MongoDB. Features comprehensive user authentication, blog post management (CRUD operations), and secure route protection using JWT tokens. Designed as a backend-only portfolio project with full test coverage and modern development practices.

## 🚀 Features

### Authentication & Authorization
- **JWT-based authentication** with secure token management
- **User registration and login** with password hashing using Argon2
- **Protected routes** with middleware-based authorization
- **Token refresh** functionality for extended sessions
- **Secure password storage** with industry-standard hashing

### User Management
- **User registration** with email/password validation
- **User profile management** with customizable profile information
- **Public user profiles** accessible without authentication
- **User deletion** with proper cleanup
- **User posts retrieval** for public viewing

### Blog Post Management
- **Full CRUD operations** for blog posts
- **Post ownership validation** - users can only modify their own posts
- **Public post viewing** with authentication for private posts
- **Post search and filtering** capabilities
- **Rich post content** support

### Technical Features
- **MongoDB integration** with optimized database operations
- **Comprehensive error handling** with meaningful error messages
- **Input validation** and sanitization
- **RESTful API design** following best practices
- **Modular architecture** with separation of concerns
- **Environment-based configuration** management

## 🛠️ Tech Stack

- **Runtime**: Node.js with ES6+ modules
- **Framework**: Express.js 5.1.0
- **Database**: MongoDB 6.17
- **Authentication**: JSON Web Tokens (JWT)
- **Password Hashing**: Argon2
- **Testing**: Jest with Supertest
- **Code Quality**: ESLint with Airbnb config
- **Development**: Babel for ES6+ transpilation
- **Environment**: dotenv for configuration management

## 📋 Prerequisites

- Node.js (v16 or higher)
- MongoDB (v4.4 or higher)
- npm or yarn package manager

## 🚀 Installation & Setup

1. **Clone the repository**
   ```bash
   git clone https://github.com/hassanah391/blog-platform-api.git
   cd blog-platform-api
   ```

2. **Install dependencies**
   ```bash
   npm install
   ```

3. **Environment Configuration**
   Create a `.env` file in the root directory:
   ```env
   # Database Configuration
   DB_HOST=localhost
   DB_PORT=27017
   DB_USER=your_db_user
   DB_PASSWORD=your_db_password
   DB_NAME=blog_app

   # Server Configuration
   SERVER_HOST=0.0.0.0
   SERVER_PORT=3000

   # JWT Configuration
   SECRETKEY=your_jwt_secret_key_here
   ```

4. **Start MongoDB**
   Ensure MongoDB is running on your system or use a cloud MongoDB instance.

5. **Run the application**
   ```bash
   # Development mode with auto-reload
   npm run dev

   # Production mode
   npm run start-server
   ```

## 🧪 Testing

The project includes comprehensive test coverage for all major functionality:

```bash
# Run all tests
npm test

# Run tests with coverage report
npm test -- --coverage

# Run specific test files
npm test -- tests/auth.test.js
```

### Test Coverage
- **Authentication tests**: User registration, login, token refresh
- **User management tests**: Profile operations, user retrieval
- **Post management tests**: CRUD operations, authorization
- **Database tests**: Connection and operation validation

## 📚 API Documentation

### Base URL
```
http://localhost:3000
```

### Authentication Endpoints

#### Register User
```http
POST /auth/signup
Content-Type: application/json

{
  "email": "user@example.com",
  "password": "securepassword123",
  "firstName": "hassan",
  "lastName": "ahmed",
  "phoneNumber": "01234567890"
}
```

#### Login User
```http
POST /auth/signin
Content-Type: application/json

{
  "email": "user@example.com",
  "password": "securepassword123"
}
```

#### Refresh Token
```http
POST /auth/refresh-token
Content-Type: application/json

{
  "refreshToken": "your_refresh_token_here"
}
```

#### Protected Route Test
```http
GET /auth/protected
Authorization: Bearer your_jwt_token_here
```

### User Management Endpoints

#### Get Current User Profile
```http
GET /users/me
Authorization: Bearer your_jwt_token_here
```

#### Update User Profile
```http
PUT /users/me/profile
Authorization: Bearer your_jwt_token_here
Content-Type: application/json

{
  "bio": "Software developer and blogger"
}
```

#### Delete Current User
```http
DELETE /users/me
Authorization: Bearer your_jwt_token_here
```

#### Get Public User Info
```http
GET /users/:userId
```

#### Get User's Posts
```http
GET /users/:userId/posts
```

### Blog Post Endpoints

#### Get All Posts
```http
GET /posts
```

#### Create New Post
```http
POST /posts
Authorization: Bearer your_jwt_token_here
Content-Type: application/json

{
  "title": "My First Blog Post",
  "content": "This is the content of my blog post...",
  "tags": ["technology", "programming"]
}
```

#### Get Specific Post
```http
GET /posts/:postId
Authorization: Bearer your_jwt_token_here
```

#### Update Post
```http
PUT /posts/:postId
Authorization: Bearer your_jwt_token_here
Content-Type: application/json

{
  "title": "Updated Blog Post Title",
  "content": "Updated content...",
  "tags": ["updated", "tags"]
}
```

#### Delete Post
```http
DELETE /posts/:postId
Authorization: Bearer your_jwt_token_here
```

## 📁 Project Structure

```
blog-platform-api/
├── controllers/          # Business logic handlers
│   ├── authController.js    # Authentication operations
│   ├── usersController.js   # User management operations
│   └── postsController.js   # Blog post operations
├── routes/              # API route definitions
│   ├── index.js            # Main router configuration
│   ├── authRoutes.js       # Authentication routes
│   ├── usersRoutes.js      # User management routes
│   ├── postsRoutes.js      # Blog post routes
│   └── middlewares.js      # Custom middleware functions
├── utils/               # Utility functions
│   └── db.js              # Database connection and operations
├── tests/               # Test files
│   ├── auth.test.js        # Authentication tests
│   ├── users.test.js       # User management tests
│   ├── posts.test.js       # Blog post tests
│   └── db.test.js          # Database tests
├── config.js            # Environment configuration
├── server.js            # Express server setup
├── package.json         # Dependencies and scripts
├── jest.config.js       # Jest testing configuration
├── .eslintrc.cjs        # ESLint configuration
├── babel.config.cjs     # Babel configuration
└── README.md            # Project documentation
```

## 🔧 Development Scripts

```bash
# Development
npm run dev              # Start development server with auto-reload
npm run start-server     # Start production server
npm run start-worker     # Start worker process (if applicable)

# Code Quality
npm run lint             # Run ESLint
npm run check-lint       # Check specific files with ESLint

# Testing
npm test                 # Run all tests with coverage
```

## 🔒 Security Features

- **JWT Token Authentication**: Secure stateless authentication
- **Password Hashing**: Argon2 for secure password storage
- **Protected Routes**: Middleware-based authorization
- **Input Validation**: Request data sanitization and validation
- **Environment Variables**: Secure configuration management
- **CORS Protection**: Cross-origin request handling

## 🧪 Testing Strategy

The project implements a comprehensive testing strategy:

- **Unit Tests**: Individual function and component testing
- **Integration Tests**: API endpoint testing with Supertest
- **Database Tests**: MongoDB connection and operation validation
- **Authentication Tests**: JWT token and user authentication flow
- **Coverage Reporting**: Detailed test coverage analysis

## 📈 Performance Considerations

- **Database Indexing**: Optimized MongoDB queries
- **Connection Pooling**: Efficient database connections
- **Async/Await**: Non-blocking operations
- **Error Handling**: Graceful error management
- **Input Validation**: Early request validation

## 🤝 Contributing

1. Fork the repository
2. Create a feature branch (`git checkout -b feature/amazing-feature`)
3. Commit your changes (`git commit -m 'Add some amazing feature'`)
4. Push to the branch (`git push origin feature/amazing-feature`)
5. Open a Pull Request

## 📄 License

This project is licensed under the ISC License - see the [LICENSE](LICENSE) file for details.

## 👨‍💻 Author

**Hassan Ahmed**

## 🔗 Links

- **Live Demo**: []

---

*This project serves as a comprehensive backend API demonstrating modern Node.js development practices, secure authentication, and scalable architecture for a blog platform.*
