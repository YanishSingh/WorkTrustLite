# 🛡️ WorkTrustLite

[![Security](https://img.shields.io/badge/Security-Enterprise%20Grade-green)](https://github.com/yourusername/worktrust-lite)
[![Node.js](https://img.shields.io/badge/Node.js-18%2B-brightgreen)](https://nodejs.org)
[![React](https://img.shields.io/badge/React-19-blue)](https://reactjs.org)
[![TypeScript](https://img.shields.io/badge/TypeScript-5.8-blue)](https://www.typescriptlang.org)
[![MongoDB](https://img.shields.io/badge/MongoDB-Latest-green)](https://www.mongodb.com)

**WorkTrustLite** is a secure, full-stack web application designed for freelancers and clients to manage invoices and payments with enterprise-grade security features. Built with modern web technologies and comprehensive security measures including Multi-Factor Authentication, role-based access control, and advanced threat protection.

## 🌟 Key Features

### 💼 **Core Functionality**
- **Invoice Management**: Create, track, and manage invoices with real-time status updates
- **Secure Payments**: Stripe integration with webhook verification for reliable payment processing
- **User Profiles**: Customizable profiles with role-based permissions (Client/Freelancer)
- **Dashboard Analytics**: Comprehensive dashboard with payment summaries and statistics
- **Real-time Updates**: Live polling for invoice status changes

### 🔐 **Enterprise Security Features**
- **Multi-Factor Authentication (MFA)**: Email-based OTP verification for all logins
- **Brute Force Protection**: Account lockout after failed attempts + IP-based rate limiting
- **Advanced Password Security**: 
  - Complex password policies with real-time strength assessment
  - Password history prevention (last 5 passwords)
  - Automatic password expiry (90 days + usage-based)
- **Role-Based Access Control (RBAC)**: Granular permissions for clients and freelancers
- **Session Management**: Secure JWT tokens with automatic expiration
- **Data Encryption**: AES-256-CBC encryption for sensitive data
- **Comprehensive Audit Logging**: All user actions logged for security reviews
- **Input Validation & Sanitization**: Protection against XSS and injection attacks

## 🏗️ Technology Stack

### **Backend**
- **Runtime**: Node.js with Express.js 5.1.0
- **Database**: MongoDB with Mongoose ODM
- **Authentication**: JWT with bcryptjs (12 salt rounds)
- **Security**: Helmet.js, express-rate-limit, crypto module
- **Payment Processing**: Stripe API with webhook verification
- **Email**: Nodemailer for MFA delivery
- **Validation**: Zxcvbn for password strength assessment

### **Frontend**
- **Framework**: React 19.1.0 with TypeScript 5.8
- **Build Tool**: Vite 7.0.4 for optimized development and production builds
- **Styling**: Tailwind CSS 3.4.17 for responsive design
- **State Management**: React Context API
- **Routing**: React Router DOM 7.6.3
- **Payment UI**: Stripe.js for secure payment forms
- **Notifications**: Sonner for user feedback

## 🚀 Quick Start

### Prerequisites
- Node.js 18+ installed
- MongoDB running locally or MongoDB Atlas account
- Stripe account for payment processing
- Email service for MFA (SMTP credentials)

### Installation

1. **Clone the repository**
   ```bash
   git clone https://github.com/yourusername/worktrust-lite.git
   cd worktrust-lite
   ```

2. **Install dependencies**
   ```bash
   # Install root dependencies
   npm install
   
   # Install backend dependencies
   cd backend
   npm install
   
   # Install frontend dependencies
   cd ../frontend
   npm install
   ```

3. **Environment Configuration**
   
   Create `.env` file in the `backend` directory:
   ```env
   # Database
   MONGO_URI=mongodb://localhost:27017/worktrust-lite
   
   # JWT Secret (use a strong, random string)
   JWT_SECRET=your-super-secret-jwt-key-here
   
   # Stripe Configuration
   STRIPE_SECRET_KEY=sk_test_your_stripe_secret_key
   STRIPE_WEBHOOK_SECRET=whsec_your_webhook_secret
   
   # Frontend URL
   FRONTEND_URL=http://localhost:5173
   
   # Email Configuration (for MFA)
   SMTP_HOST=smtp.gmail.com
   SMTP_PORT=587
   SMTP_USER=your-email@gmail.com
   SMTP_PASS=your-app-password
   
   # Environment
   NODE_ENV=development
   ```

   Create `.env.local` file in the `frontend` directory:
   ```env
   VITE_STRIPE_PUBLISHABLE_KEY=pk_test_your_stripe_publishable_key
   ```

4. **Migrate existing emails (if upgrading)**
   ```bash
   # Run email encryption migration (from backend directory)
   node migrate-emails.js
   ```

5. **Start the application**
   ```bash
   # Start backend (from backend directory)
   npm run dev
   
   # Start frontend (from frontend directory, new terminal)
   npm run dev
   ```

5. **Access the application**
   - Frontend: http://localhost:5173
   - Backend API: http://localhost:5000

## 📚 API Documentation

### Authentication Endpoints
- `POST /api/auth/register` - User registration with password validation
- `POST /api/auth/login` - Initial login (triggers MFA)
- `POST /api/auth/verify-mfa` - Complete login with OTP verification
- `POST /api/auth/request-mfa` - Request new OTP code

### User Endpoints
- `GET /api/user/profile` - Get user profile
- `PUT /api/user/profile` - Update user profile
- `POST /api/user/reset-expired-password` - Reset expired password
- `GET /api/user/clients` - Get clients list (for freelancers)
- `GET /api/user/freelancers` - Get freelancers list (for clients)

### Invoice Endpoints
- `POST /api/invoice` - Create new invoice
- `GET /api/invoice/freelancer` - Get freelancer's invoices
- `GET /api/invoice/client` - Get client's invoices

### Payment Endpoints
- `POST /api/payment/invoice/:id` - Create payment session for invoice
- `POST /api/payment/webhook` - Stripe webhook handler

## 🔒 Security Architecture

### **Authentication Flow**
1. **Registration**: Email + password with strength validation
2. **Login**: Email/password verification → MFA OTP generation
3. **MFA Verification**: OTP validation → JWT token issuance
4. **Session Management**: JWT-based authentication with auto-expiry

### **Password Security Policy**
- **Length**: 8-32 characters
- **Complexity**: Must include uppercase, lowercase, numbers, and symbols
- **Strength**: Minimum Zxcvbn score of 3/4
- **History**: Cannot reuse last 5 passwords
- **Expiry**: 90 days OR 5 successful logins

### **Brute Force Protection**
- **Account Level**: 5 failed attempts → 10-minute lockout
- **IP Level**: 5 login attempts per 10 minutes
- **API Level**: 30 requests per minute per IP

### **Data Protection**
- **Email Encryption**: AES-256-CBC encryption for user emails
- **Password Hashing**: bcrypt with 12 salt rounds
- **JWT Security**: RS256 signing with secure expiration
- **Input Sanitization**: Comprehensive validation and sanitization

## 📁 Project Structure

```
WorkTrustLite/
├── backend/
│   ├── config/
│   │   ├── constants.js          # Security policies & configuration
│   │   ├── db.js                 # Database connection
│   │   └── stripe.js             # Stripe configuration
│   ├── controllers/
│   │   ├── authController.js     # Authentication logic
│   │   ├── userController.js     # User management
│   │   ├── invoiceController.js  # Invoice operations
│   │   └── paymentController.js  # Payment processing
│   ├── middleware/
│   │   ├── authMiddleware.js     # JWT verification
│   │   ├── errorHandler.js       # Centralized error handling
│   │   └── rateLimiter.js        # Rate limiting configuration
│   ├── models/
│   │   ├── User.js              # User schema with security fields
│   │   └── Invoice.js           # Invoice schema
│   ├── routes/
│   │   ├── auth.js              # Authentication routes
│   │   ├── user.js              # User routes
│   │   ├── invoice.js           # Invoice routes
│   │   └── payment.js           # Payment routes
│   ├── utils/
│   │   ├── passwordValidator.js  # Password validation utility
│   │   ├── encrypt.js           # Encryption utilities
│   │   ├── logger.js            # Activity logging
│   │   └── mailer.js            # Email utilities
│   └── server.js                # Express server setup
├── frontend/
│   ├── src/
│   │   ├── components/
│   │   │   ├── PasswordStrengthMeter.tsx
│   │   │   ├── ProtectedRoute.tsx
│   │   │   └── BackToDashboardButton.tsx
│   │   ├── context/
│   │   │   ├── AuthContext.tsx   # Authentication state
│   │   │   └── useAuth.ts        # Auth hooks
│   │   ├── pages/
│   │   │   ├── Login.tsx         # Login with MFA
│   │   │   ├── Register.tsx      # Registration with validation
│   │   │   ├── Dashboard.tsx     # User dashboard
│   │   │   ├── Profile.tsx       # Profile management
│   │   │   ├── Invoice.tsx       # Invoice management
│   │   │   ├── Payment.tsx       # Payment history
│   │   │   └── ChangePassword.tsx # Password change
│   │   ├── utils/
│   │   │   └── constants.ts      # Frontend constants
│   │   └── api/
│   │       └── axios.ts          # API client configuration
│   └── public/                   # Static assets
└── README.md                     # This file
```

## 🛡️ Security Audit & Testing

### **Implemented Security Measures**
- ✅ **OWASP Top 10 Protection**
- ✅ **Input Validation & Sanitization**
- ✅ **SQL Injection Prevention**
- ✅ **XSS Protection** 
- ✅ **CSRF Protection**
- ✅ **Security Headers** (Helmet.js)
- ✅ **Rate Limiting**
- ✅ **Secure Session Management**
- ✅ **Comprehensive Logging**

### **Penetration Testing Checklist**
- [ ] Authentication bypass attempts
- [ ] Brute force attack simulation
- [ ] Session hijacking tests
- [ ] Input validation testing
- [ ] Payment flow security assessment
- [ ] API endpoint enumeration
- [ ] Rate limiting validation

## 🚀 Deployment

### **Production Environment Variables**
```env
NODE_ENV=production
MONGO_URI=mongodb+srv://your-production-db
JWT_SECRET=your-production-jwt-secret
STRIPE_SECRET_KEY=sk_live_your_production_key
FRONTEND_URL=https://your-domain.com
```

### **Security Considerations for Production**
1. **HTTPS Only**: Ensure SSL/TLS certificates are properly configured
2. **Environment Variables**: Use secure secret management
3. **Database Security**: Enable MongoDB authentication and encryption
4. **Monitoring**: Implement logging and monitoring solutions
5. **Backup Strategy**: Regular database backups with encryption

## 🤝 Contributing

1. Fork the repository
2. Create a feature branch (`git checkout -b feature/amazing-feature`)
3. Commit your changes (`git commit -m 'Add amazing feature'`)
4. Push to the branch (`git push origin feature/amazing-feature`)
5. Open a Pull Request

### **Development Guidelines**
- Follow the existing code style and security patterns
- Add comprehensive tests for new features
- Update documentation for API changes
- Ensure all security checks pass

## 📄 License

This project is licensed under the MIT License - see the [LICENSE](LICENSE) file for details.

## 🙏 Acknowledgments

- **Security Frameworks**: OWASP guidelines for web application security
- **Stripe**: Secure payment processing infrastructure
- **MongoDB**: Robust document database with security features
- **React Community**: For excellent development tools and libraries

## 📞 Support

For support, email support@worktrust.com or create an issue in this repository.

---

**Built with ❤️ and 🔒 Security in Mind**

*WorkTrustLite demonstrates enterprise-grade security implementation in a modern web application, suitable for production environments requiring high security standards.*