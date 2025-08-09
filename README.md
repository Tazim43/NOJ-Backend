# NaiveOJ Backend

A robust and scalable backend API for the NaiveOJ (Naive Online Judge) platform built with Node.js, Express.js, and MongoDB. This backend powers a comprehensive online judge system supporting competitive programming contests, problem management, and automated code evaluation.

## 🚀 Overview

NaiveOJ Backend is a RESTful API service that provides comprehensive functionality for an online judge platform. It handles user management, problem administration, contest organization, code submission processing, and automated judging through Judge0 integration. The system is designed with scalability, security, and performance in mind.

## ✨ Features

### 🔐 Authentication & Authorization

- JWT-based authentication with refresh tokens
- Email verification and password reset functionality
- Role-based access control (User, Admin, Moderator, Problem Setter)
- Session management with secure cookie handling
- Rate limiting and brute force protection

### 👥 User Management

- User registration and profile management
- Email verification workflow
- Password reset and change functionality
- User statistics and performance tracking
- Admin user management capabilities

### 📝 Problem Management

- CRUD operations for programming problems
- Rich text problem statements with image support
- Test case management and validation
- Problem difficulty categorization
- Tag-based problem organization
- Bulk problem import/export

### 🏆 Contest System

- Contest creation and management
- Participant registration and tracking
- Real-time leaderboard generation
- Contest-specific problem sets
- Time-based contest controls
- Performance analytics and statistics

### 💻 Submission & Judging

- Multi-language code submission support
- Integration with Judge0 for automated evaluation
- Real-time submission status tracking
- Detailed verdict reporting (AC, WA, TLE, MLE, etc.)
- Submission history and analytics
- Code plagiarism detection

### 📊 Analytics & Statistics

- User performance metrics
- Problem solving statistics
- Contest participation analytics
- System usage monitoring
- Administrative dashboards

## 🛠️ Tech Stack

- **Runtime**: [Node.js](https://nodejs.org/) (v18+)
- **Framework**: [Express.js](https://expressjs.com/)
- **Database**: [MongoDB](https://www.mongodb.com/) with [Mongoose ODM](https://mongoosejs.com/)
- **Authentication**: [JWT](https://jwt.io/) with [bcrypt](https://www.npmjs.com/package/bcrypt)
- **Judging System**: [Judge0](https://judge0.com/) API integration
- **File Storage**: [Multer](https://www.npmjs.com/package/multer) with local/cloud storage
- **Email Service**: [Nodemailer](https://nodemailer.com/)
- **Validation**: [Joi](https://joi.dev/) / [express-validator](https://express-validator.github.io/)
- **Logging**: [Winston](https://github.com/winstonjs/winston)
- **Process Management**: [PM2](https://pm2.keymetrics.io/)

## 🏗️ Architecture

### System Architecture

```
┌─────────────────┐    ┌─────────────────┐    ┌─────────────────┐
│   Frontend      │    │   Backend API   │    │   Judge0 API    │
│   (Next.js)     │◄──►│   (Express.js)  │◄──►│   (Judging)     │
└─────────────────┘    └─────────────────┘    └─────────────────┘
                                │
                                ▼
                        ┌─────────────────┐
                        │   MongoDB       │
                        │   (Database)    │
                        └─────────────────┘
```

### API Architecture

The backend follows a layered architecture pattern:

- **Controller Layer**: Handles HTTP requests and responses
- **Service Layer**: Contains business logic and data processing
- **Repository Layer**: Manages database operations and queries
- **Middleware Layer**: Authentication, validation, and request processing
- **Utility Layer**: Helper functions and shared utilities

## 📁 Project Structure

```
src/
├── config/                 # Configuration files
│   ├── database.js        # MongoDB connection setup
│   ├── judge0.js          # Judge0 API configuration
│   ├── email.js           # Email service configuration
│   └── constants.js       # Application constants
├── controllers/           # Request handlers
│   ├── authController.js  # Authentication endpoints
│   ├── userController.js  # User management endpoints
│   ├── problemController.js # Problem management endpoints
│   ├── contestController.js # Contest management endpoints
│   └── submissionController.js # Submission endpoints
├── middleware/            # Custom middleware functions
│   ├── auth.js           # Authentication middleware
│   ├── validation.js     # Request validation middleware
│   ├── rateLimiter.js    # Rate limiting middleware
│   ├── upload.js         # File upload middleware
│   └── errorHandler.js   # Global error handling
├── models/               # Mongoose schemas and models
│   ├── User.js          # User model
│   ├── Problem.js       # Problem model
│   ├── Contest.js       # Contest model
│   ├── Submission.js    # Submission model
│   └── TestCase.js      # Test case model
├── routes/              # API route definitions
│   ├── auth.js         # Authentication routes
│   ├── users.js        # User management routes
│   ├── problems.js     # Problem management routes
│   ├── contests.js     # Contest management routes
│   └── submissions.js  # Submission routes
├── services/           # Business logic services
│   ├── authService.js  # Authentication service
│   ├── problemService.js # Problem management service
│   ├── contestService.js # Contest management service
│   ├── submissionService.js # Submission processing service
│   └── judgeService.js # Judge0 integration service
├── utils/              # Utility functions
│   ├── logger.js       # Logging utility
│   ├── emailSender.js  # Email sending utility
│   ├── fileHandler.js  # File handling utility
│   └── validators.js   # Custom validators
├── tests/              # Test files
│   ├── unit/          # Unit tests
│   ├── integration/   # Integration tests
│   └── fixtures/      # Test fixtures
└── app.js             # Express application setup
```

## 🔧 API Endpoints

### Authentication Endpoints

```
POST   /api/auth/register          # User registration
POST   /api/auth/login             # User login
POST   /api/auth/logout            # User logout
POST   /api/auth/refresh           # Refresh access token
POST   /api/auth/forgot-password   # Request password reset
POST   /api/auth/reset-password    # Reset password
GET    /api/auth/verify-email      # Email verification
```

### User Management

```
GET    /api/users                  # Get all users (admin)
GET    /api/users/:id              # Get user by ID
PUT    /api/users/:id              # Update user profile
DELETE /api/users/:id              # Delete user (admin)
GET    /api/users/:id/statistics   # Get user statistics
```

### Problem Management

```
GET    /api/problems               # Get all problems
GET    /api/problems/:id           # Get problem by ID
POST   /api/problems               # Create new problem
PUT    /api/problems/:id           # Update problem
DELETE /api/problems/:id           # Delete problem
POST   /api/problems/:id/testcases # Add test cases
```

### Contest Management

```
GET    /api/contests               # Get all contests
GET    /api/contests/:id           # Get contest by ID
POST   /api/contests               # Create new contest
PUT    /api/contests/:id           # Update contest
DELETE /api/contests/:id           # Delete contest
POST   /api/contests/:id/register  # Register for contest
GET    /api/contests/:id/leaderboard # Get contest leaderboard
```

### Submission Management

```
GET    /api/submissions            # Get all submissions
GET    /api/submissions/:id        # Get submission by ID
POST   /api/submissions            # Submit solution
GET    /api/submissions/:id/status # Get submission status
GET    /api/users/:id/submissions  # Get user submissions
```

## 🚀 Getting Started

### Prerequisites

- Node.js 18.x or higher
- MongoDB 5.x or higher
- Judge0 API access (local or hosted)
- npm or yarn package manager

### Installation

1. **Clone the repository**

   ```bash
   git clone <repository-url>
   cd NOJ-Backend
   ```

2. **Install dependencies**

   ```bash
   npm install
   # or
   yarn install
   ```

3. **Environment Setup**

   Create a `.env` file in the root directory:

   ```env
   # Server Configuration
   PORT=3000
   NODE_ENV=development

   # Database Configuration
   MONGODB_URI=mongodb://localhost:27017/naiveoj
   MONGODB_TEST_URI=mongodb://localhost:27017/naiveoj_test

   # JWT Configuration
   JWT_SECRET=your_jwt_secret_key_here
   JWT_REFRESH_SECRET=your_jwt_refresh_secret_here
   JWT_EXPIRE_TIME=1h
   JWT_REFRESH_EXPIRE_TIME=7d

   # Judge0 Configuration
   JUDGE0_API_URL=http://localhost:2358
   JUDGE0_API_KEY=your_judge0_api_key

   # Email Configuration
   SMTP_HOST=smtp.gmail.com
   SMTP_PORT=587
   SMTP_USER=your_email@gmail.com
   SMTP_PASS=your_app_password

   # File Upload Configuration
   MAX_FILE_SIZE=5MB
   UPLOAD_PATH=./uploads

   # Rate Limiting
   RATE_LIMIT_WINDOW=15
   RATE_LIMIT_MAX_REQUESTS=100
   ```

4. **Database Setup**

   ```bash
   # Start MongoDB service
   sudo systemctl start mongod

   # Create database indexes (optional)
   npm run setup-db
   ```

5. **Start the development server**

   ```bash
   npm run dev
   # or
   yarn dev
   ```

6. **Verify the installation**

   Navigate to [http://localhost:3000](http://localhost:3000)

### Production Deployment

```bash
# Build the application
npm run build

# Start with PM2
npm run start:prod

# Or start directly
npm start
```

## 🧪 Testing

### Running Tests

```bash
# Run all tests
npm test

# Run unit tests only
npm run test:unit

# Run integration tests only
npm run test:integration

# Run tests with coverage
npm run test:coverage

# Run tests in watch mode
npm run test:watch
```

### Test Structure

- **Unit Tests**: Test individual functions and modules
- **Integration Tests**: Test API endpoints and database operations
- **Performance Tests**: Load testing and performance benchmarks

## 🔧 Available Scripts

- `npm start` - Start production server
- `npm run dev` - Start development server with nodemon
- `npm run build` - Build application for production
- `npm test` - Run test suite
- `npm run lint` - Run ESLint
- `npm run lint:fix` - Fix ESLint issues
- `npm run setup-db` - Initialize database with indexes
- `npm run seed` - Seed database with sample data

## 🌟 Key Components

### Judge0 Integration

The system integrates with Judge0 for automated code evaluation:

```javascript
// Example submission flow
1. Receive code submission
2. Validate input and constraints
3. Submit to Judge0 API
4. Poll for results
5. Process verdict and update database
6. Notify user of results
```

### Authentication Flow

```javascript
// JWT-based authentication with refresh tokens
1. User login with credentials
2. Generate access token (short-lived) and refresh token (long-lived)
3. Store refresh token securely
4. Use access token for API requests
5. Refresh access token when expired
```

### Contest Management

- Real-time leaderboard updates
- Time-based problem access control
- Participant registration and tracking
- Performance analytics and rankings

## 🔒 Security Features

- **Input Validation**: Comprehensive request validation using Joi
- **Authentication**: JWT-based with secure token handling
- **Authorization**: Role-based access control
- **Rate Limiting**: Protection against brute force attacks
- **CORS Configuration**: Secure cross-origin resource sharing
- **Helmet.js**: Security headers and protection
- **Data Sanitization**: XSS and NoSQL injection prevention

## 📈 Performance Optimizations

- **Database Indexing**: Optimized MongoDB indexes for query performance
- **Caching**: Redis-based caching for frequently accessed data
- **Connection Pooling**: MongoDB connection pooling
- **Compression**: Response compression using gzip
- **Pagination**: Efficient data pagination for large datasets
- **Background Jobs**: Queue-based processing for heavy operations

## 🐛 Error Handling

The application implements comprehensive error handling:

- **Global Error Handler**: Centralized error processing
- **Custom Error Classes**: Specific error types for different scenarios
- **Logging**: Winston-based logging with different levels
- **Validation Errors**: Detailed validation error responses
- **Database Errors**: MongoDB error handling and recovery

## 📊 Monitoring & Logging

### Logging Levels

- **Error**: Application errors and exceptions
- **Warn**: Warning messages and potential issues
- **Info**: General application information
- **Debug**: Detailed debugging information

### Monitoring Endpoints

```
GET    /api/health                 # Health check endpoint
GET    /api/metrics                # Application metrics
GET    /api/status                 # System status
```

## 🌍 Database Design

You can explore the comprehensive Entity-Relationship (ER) diagram for NaiveOJ [here](https://app.eraser.io/workspace/Q4gc6zQylAn8EwUflISf?origin=share).

### Key Collections

- **Users**: User accounts and profiles
- **Problems**: Programming problems and metadata
- **Contests**: Contest information and settings
- **Submissions**: Code submissions and verdicts
- **TestCases**: Problem test cases and expected outputs

## 🤝 Contributing

1. Fork the repository
2. Create a feature branch (`git checkout -b feature/amazing-feature`)
3. Commit your changes (`git commit -m 'Add amazing feature'`)
4. Push to the branch (`git push origin feature/amazing-feature`)
5. Open a Pull Request

### Development Guidelines

- Follow ESLint configuration for code style
- Write comprehensive tests for new features
- Update documentation for API changes
- Use conventional commit messages
- Ensure all tests pass before submitting PR

## 📝 API Documentation

Detailed API documentation is available at:

- **Development**: `http://localhost:3000/api-docs`
- **Production**: `https://your-domain.com/api-docs`

The API documentation is generated using Swagger/OpenAPI specifications.

## 🔧 Configuration

### Environment Variables

| Variable         | Description               | Default                             |
| ---------------- | ------------------------- | ----------------------------------- |
| `PORT`           | Server port               | `3000`                              |
| `NODE_ENV`       | Environment mode          | `development`                       |
| `MONGODB_URI`    | MongoDB connection string | `mongodb://localhost:27017/naiveoj` |
| `JWT_SECRET`     | JWT signing secret        | `required`                          |
| `JUDGE0_API_URL` | Judge0 API endpoint       | `http://localhost:2358`             |

### Judge0 Configuration

The system supports both local and hosted Judge0 instances:

```javascript
// Local Judge0 setup
JUDGE0_API_URL=http://localhost:2358

// Hosted Judge0 (RapidAPI)
JUDGE0_API_URL=https://judge0-ce.p.rapidapi.com
JUDGE0_API_KEY=your_rapidapi_key
```

## 📄 License

This project is licensed under the MIT License - see the [LICENSE](LICENSE) file for details.

## 🙏 Acknowledgments

- Built with [Node.js](https://nodejs.org/) and [Express.js](https://expressjs.com/)
- Database powered by [MongoDB](https://www.mongodb.com/)
- Code evaluation by [Judge0](https://judge0.com/)
- Authentication using [JWT](https://jwt.io/)

## 📞 Support

For support, please open an issue in the repository or contact the development team.

## 🔗 Related Projects

- [NaiveOJ Frontend](../noj-frontend/) - React-based frontend application
- [Judge0](https://github.com/judge0/judge0) - Open source online judge

---

**Note**: This is the backend API for NaiveOJ. For the complete system, you'll also need to set up the [frontend application](../noj-frontend/) and configure the Judge0 judging system.
