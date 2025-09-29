# Bus Express Backend

A comprehensive, production-ready Node.js TypeScript backend API for a bus booking system with enterprise-grade features and role-based authentication.

## 🚀 Features

### Core Features
- **Authentication & Authorization**: JWT-based authentication with role-based access control
- **User Management**: Admin, Operator, and Customer roles with different permissions
- **Bus Management**: CRUD operations for buses with operator-specific access
- **Route Management**: Route creation and management with stop management
- **Booking System**: Complete booking workflow with payment status tracking

### Enhanced Features
- **ES Modules Support**: Modern JavaScript module system with TypeScript
- **Centralized Configuration**: dotenv-flow based configuration management
- **Service Layer Architecture**: Clean separation of concerns with dedicated service classes
- **Comprehensive Logging**: Winston-based logging with multiple transports and log levels
- **API Documentation**: Swagger/OpenAPI documentation with interactive UI
- **Health Monitoring**: Comprehensive health checks for database, memory, disk, and environment
- **Email Service**: Automated email notifications for bookings, cancellations, and user actions
- **File Upload Service**: Secure file handling with validation and cleanup utilities
- **Database Seeding**: Automated data seeding for development and testing
- **Error Handling**: Comprehensive error handling with custom response utilities
- **Request Validation**: Input validation using express-validator
- **Security**: Rate limiting, CORS, Helmet security headers, and input sanitization
- **Testing**: Comprehensive test suite with Jest and Supertest

## 🛠 Tech Stack

- **Runtime**: Node.js with TypeScript (ES Modules)
- **Framework**: Express.js
- **Database**: MongoDB with Mongoose ODM
- **Authentication**: JWT (JSON Web Tokens) with refresh tokens
- **Configuration**: dotenv-flow for environment management
- **Validation**: express-validator
- **Logging**: Winston with multiple transports
- **Documentation**: Swagger/OpenAPI
- **Email**: Nodemailer with SMTP support
- **File Upload**: Multer with validation
- **Security**: Helmet, CORS, Rate Limiting
- **Testing**: Jest with Supertest
- **Environment**: dotenv-flow

## 📁 Project Structure

```
src/
├── config/
│   ├── database.ts          # Database connection configuration
│   └── swagger.ts          # Swagger/OpenAPI configuration
├── constants/
│   └── index.ts            # Application constants and enums
├── controllers/
│   ├── authController.ts    # Authentication and user management
│   ├── busController.ts     # Bus management operations
│   ├── routeController.ts   # Route management operations
│   └── bookingController.ts # Booking operations
├── middleware/
│   ├── auth.ts             # Authentication and authorization middleware
│   ├── validation.ts       # Request validation middleware
│   └── customValidation.ts # Custom validation utilities
├── models/
│   ├── User.ts            # User model with authentication
│   ├── Bus.ts             # Bus model with operator relationship
│   ├── Route.ts           # Route model with coordinates
│   └── Booking.ts         # Booking model with payment tracking
├── routes/
│   ├── auth.ts            # Authentication routes
│   ├── bus.ts             # Bus management routes
│   ├── route.ts           # Route management routes
│   ├── booking.ts         # Booking routes
│   └── index.ts           # Main router
├── services/
│   ├── userService.ts     # User business logic
│   ├── busService.ts      # Bus business logic
│   ├── routeService.ts    # Route business logic
│   ├── bookingService.ts  # Booking business logic
│   ├── emailService.ts    # Email service
│   ├── fileService.ts     # File upload service
│   └── healthService.ts   # Health monitoring service
├── tests/
│   └── auth.test.ts       # Authentication tests
├── utils/
│   ├── auth.ts            # Authentication utilities
│   ├── responseHandler.ts # Response handling utilities
│   ├── logger.ts          # Winston logging configuration
│   └── seeder.ts          # Database seeding utilities
└── server.ts              # Main server file
```

## API Endpoints

### Authentication (`/api/v1/auth`)
- `POST /register` - User registration
- `POST /login` - User login
- `POST /refresh-token` - Refresh JWT token
- `GET /profile` - Get user profile (Protected)
- `PUT /profile` - Update user profile (Protected)
- `PUT /change-password` - Change password (Protected)
- `GET /users` - Get all users (Admin only)
- `GET /users/:id` - Get user by ID (Admin only)
- `PUT /users/:id` - Update user by ID (Admin only)
- `DELETE /users/:id` - Delete user (Admin only)

### Bus Management (`/api/v1/buses`)
- `GET /` - Get all buses (Public)
- `GET /:id` - Get bus by ID (Public)
- `POST /` - Create bus (Operator/Admin)
- `PUT /:id` - Update bus (Operator/Admin)
- `DELETE /:id` - Delete bus (Operator/Admin)
- `PUT /:id/status` - Update bus status (Operator/Admin)
- `GET /:id/statistics` - Get bus statistics (Operator/Admin)
- `GET /operator/:operatorId` - Get buses by operator

### Route Management (`/api/v1/routes`)
- `GET /` - Get all routes (Public)
- `GET /search` - Search routes by cities (Public)
- `GET /popular` - Get popular routes (Public)
- `GET /:id` - Get route by ID (Public)
- `POST /` - Create route (Admin only)
- `PUT /:id` - Update route (Admin only)
- `DELETE /:id` - Delete route (Admin only)
- `PUT /:id/status` - Update route status (Admin only)
- `POST /:id/stops` - Add stop to route (Admin only)
- `DELETE /:id/stops` - Remove stop from route (Admin only)

### Booking Management (`/api/v1/bookings`)
- `POST /` - Create booking (Protected)
- `GET /` - Get all bookings (Protected)
- `GET /statistics` - Get booking statistics (Admin only)
- `GET /reference/:reference` - Get booking by reference (Protected)
- `GET /:id` - Get booking by ID (Protected)
- `PUT /:id/status` - Update booking status (Operator/Admin)
- `PUT /:id/cancel` - Cancel booking (Protected)

## User Roles

### Admin
- Full access to all operations
- User management
- Route management
- System statistics

### Operator
- Bus management (own buses only)
- Booking management for own buses
- Bus statistics

### Customer
- View buses and routes
- Create and manage own bookings
- Profile management

## 🚀 Quick Start

### Prerequisites
- Node.js (v16 or higher)
- MongoDB (v4.4 or higher)
- npm or yarn

### Installation

1. **Clone the repository**
   ```bash
   git clone <repository-url>
   cd bus-express-backend
   ```

2. **Install dependencies**
   ```bash
   npm install
   ```

3. **Set up environment variables**
   ```bash
   cp env.example .env
   ```
   
   Update `.env` with your configuration:
   ```env
   NODE_ENV=development
   PORT=3000
   MONGODB_URI=mongodb://localhost:27017/bus-express
   JWT_SECRET=your-super-secret-jwt-key-change-this-in-production
   JWT_EXPIRE=7d
   JWT_REFRESH_SECRET=your-super-secret-refresh-key-change-this-in-production
   JWT_REFRESH_EXPIRE=30d
   EMAIL_HOST=smtp.gmail.com
   EMAIL_PORT=587
   EMAIL_USER=your-email@gmail.com
   EMAIL_PASS=your-app-password
   ```

4. **Start MongoDB**
   ```bash
   # Using Docker
   docker run -d -p 27017:27017 --name mongodb mongo:latest
   
   # Or start your local MongoDB service
   ```

5. **Seed the database (optional)**
   ```bash
   npm run seed
   ```

6. **Start the development server**
   ```bash
   npm run dev
   ```

7. **Access the application**
   - API: http://localhost:3000
   - API Documentation: http://localhost:3000/api-docs
   - Health Check: http://localhost:3000/health

## 📋 Available Scripts

- `npm start` - Start production server
- `npm run dev` - Start development server with nodemon
- `npm run build` - Build TypeScript to JavaScript
- `npm run test` - Run test suite
- `npm run lint` - Run ESLint
- `npm run lint:fix` - Fix ESLint errors
- `npm run seed` - Seed database with sample data
- `npm run seed:clear` - Clear all database data

## ⚙️ Environment Variables

| Variable | Description | Default | Required |
|----------|-------------|---------|----------|
| `NODE_ENV` | Environment mode | `development` | No |
| `PORT` | Server port | `3000` | No |
| `MONGODB_URI` | MongoDB connection string | `mongodb://localhost:27017/bus-express` | Yes |
| `JWT_SECRET` | JWT secret key | - | Yes |
| `JWT_EXPIRE` | JWT expiration time | `7d` | No |
| `JWT_REFRESH_SECRET` | Refresh token secret | - | Yes |
| `JWT_REFRESH_EXPIRE` | Refresh token expiration | `30d` | No |
| `EMAIL_HOST` | SMTP host for emails | - | No |
| `EMAIL_PORT` | SMTP port | `587` | No |
| `EMAIL_USER` | SMTP username | - | No |
| `EMAIL_PASS` | SMTP password | - | No |
| `CORS_ORIGIN` | CORS origin | `*` | No |
| `RATE_LIMIT_WINDOW_MS` | Rate limit window | `900000` (15 min) | No |
| `RATE_LIMIT_MAX_REQUESTS` | Max requests per window | `100` | No |
| `UPLOAD_PATH` | File upload directory | `uploads/` | No |
| `MAX_FILE_SIZE` | Maximum file size | `5242880` (5MB) | No |
| `BASE_URL` | Base URL for file serving | `http://localhost:3000` | No |
| `FRONTEND_URL` | Frontend URL for email links | - | No |

## Response Format

All API responses follow a consistent format:

### Success Response
```json
{
  "success": true,
  "message": "Success message",
  "data": {},
  "timestamp": "2024-01-01T00:00:00.000Z"
}
```

### Error Response
```json
{
  "success": false,
  "message": "Error message",
  "error": "Error details (development only)",
  "timestamp": "2024-01-01T00:00:00.000Z"
}
```

## Authentication

The API uses JWT tokens for authentication. Include the token in the Authorization header:

```
Authorization: Bearer <your-jwt-token>
```

## Error Handling

The API includes comprehensive error handling with:
- Validation errors
- Authentication errors
- Authorization errors
- Database errors
- Custom error responses

## Security Features

- JWT-based authentication
- Role-based authorization
- Rate limiting
- CORS protection
- Security headers (Helmet)
- Input validation
- Password hashing (bcrypt)

## Database Models

### User Model
- Authentication fields
- Role-based access
- Profile information
- Address details

### Bus Model
- Operator relationship
- Seat management
- Features and amenities
- Status tracking

### Route Model
- Geographic coordinates
- Stop management
- Distance calculation
- Duration estimation

### Booking Model
- User relationship
- Bus and route references
- Seat details
- Payment tracking
- Status management

## 📊 Monitoring & Health Checks

The application includes comprehensive health monitoring:

### Health Check Endpoints
- `GET /health` - Overall system health
- `GET /health/database` - Database connectivity
- `GET /health/memory` - Memory usage statistics
- `GET /health/ready` - Readiness probe (for load balancers)
- `GET /health/live` - Liveness probe (for load balancers)

### Logging
- **Winston Logger**: Multi-level logging with file and console outputs
- **Request Logging**: HTTP request/response logging with Morgan
- **Error Logging**: Comprehensive error tracking and stack traces
- **Log Levels**: error, warn, info, http, debug

### API Documentation
- **Swagger UI**: Interactive API documentation at `/api-docs`
- **OpenAPI Spec**: JSON specification at `/api-docs.json`
- **Schema Validation**: Request/response schema documentation

## 🧪 Testing

### Running Tests
```bash
# Run all tests
npm test

# Run tests in watch mode
npm run test:watch

# Run tests with coverage
npm run test:coverage
```

### Test Structure
- **Unit Tests**: Service layer testing
- **Integration Tests**: API endpoint testing
- **Authentication Tests**: JWT and role-based access testing
- **Database Tests**: Model and database operation testing

## 🔧 Development

### Database Seeding
```bash
# Seed with sample data
npm run seed

# Clear all data
npm run seed:clear
```

### Code Quality
```bash
# Lint code
npm run lint

# Fix linting issues
npm run lint:fix

# Type checking
npm run build
```

## 🤝 Contributing

1. Fork the repository
2. Create a feature branch (`git checkout -b feature/amazing-feature`)
3. Commit your changes (`git commit -m 'Add some amazing feature'`)
4. Push to the branch (`git push origin feature/amazing-feature`)
5. Open a Pull Request

### Development Guidelines
- Follow TypeScript best practices
- Write tests for new features
- Update documentation as needed
- Follow the existing code style
- Use meaningful commit messages

## 📄 License

This project is licensed under the MIT License - see the [LICENSE](LICENSE) file for details.

## 🙏 Acknowledgments

- Express.js team for the amazing framework
- MongoDB team for the robust database
- Winston team for comprehensive logging
- Swagger team for API documentation tools
