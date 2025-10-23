# Admin Panel Documentation

## Overview

The Digital Career Center Admin Panel provides a comprehensive management interface for administrators to manage users, courses, and monitor system analytics.

## Features

- **User Management**: View and manage all registered users
- **Dashboard**: Overview of key metrics and recent activity
- **Authentication**: Secure admin login with JWT tokens
- **Responsive Design**: Works on desktop and mobile devices
- **Role-based Access**: Different permission levels for different admin roles

## Admin Account Setup

### Initial Setup

1. **Start the application**:
   ```bash
   npm run dev
   ```

2. **Create Admin Account**:
   - Navigate to: `http://localhost:3000/admin/setup`
   - Click "Create Admin Account"
   - The system will create the admin account with the following credentials:
     - **Email**: admin@gmail.com
     - **Password**: Admin@786786
     - **Role**: Super Admin

3. **Login to Admin Panel**:
   - Navigate to: `http://localhost:3000/admin/login`
   - Use the credentials created above

## Admin Panel Structure

### Pages

- `/admin/setup` - Initial admin account creation
- `/admin/login` - Admin login page
- `/admin/dashboard` - Main dashboard with statistics
- `/admin/users` - User management (planned)
- `/admin/courses` - Course management (planned)
- `/admin/analytics` - Analytics and reports (planned)
- `/admin/settings` - System settings (planned)

### API Endpoints

- `POST /api/admin/seed` - Create admin account
- `POST /api/admin/login` - Admin authentication
- `GET /api/admin/users` - Fetch users data (protected)

## Admin Model

The Admin model includes the following fields:

```javascript
{
  email: String (required, unique)
  password: String (required, hashed)
  name: String (required)
  role: String (enum: ['super_admin', 'admin', 'moderator'])
  isActive: Boolean (default: true)
  lastLogin: Date
  createdAt: Date
  updatedAt: Date
}
```

## Security Features

- **Password Hashing**: Uses bcryptjs with 12 salt rounds
- **JWT Authentication**: Secure token-based authentication
- **Role-based Access**: Different permission levels
- **Token Expiration**: 24-hour token validity
- **Protected Routes**: All admin routes require authentication

## Usage

### Dashboard

The admin dashboard provides:
- Total users count
- Active users count
- Total revenue (placeholder)
- Recent signups count
- Recent users table
- Quick action buttons

### User Management

- View all registered users
- Search functionality
- Pagination support
- User details display

## Environment Variables

Make sure to set the following environment variables:

```env
MONGODB_URI=mongodb://localhost:27017/dcc
NEXTAUTH_SECRET=your-secret-key-here
NODE_ENV=development
```

## Development

### Adding New Admin Features

1. **Create API Endpoint**: Add new endpoints in `/pages/api/admin/`
2. **Add Page Component**: Create new pages in `/app/admin/`
3. **Update Navigation**: Add new menu items in `admin/layout.jsx`
4. **Add Authentication**: Use `verifyAdminToken` middleware for protected routes

### Database Operations

- All admin operations use the Admin model
- User data is fetched from the User model
- MongoDB connection is handled by `lib/mongodb.js`

## Troubleshooting

### Common Issues

1. **Admin Account Not Created**:
   - Ensure MongoDB is running
   - Check database connection
   - Verify environment variables

2. **Login Issues**:
   - Verify admin account exists
   - Check password correctness
   - Ensure JWT secret is set

3. **Permission Errors**:
   - Check admin role permissions
   - Verify token validity
   - Ensure proper authentication

### Debug Mode

To enable debug logging, set:
```env
NODE_ENV=development
```

## Security Considerations

- Change default admin password after first login
- Use strong JWT secrets in production
- Implement rate limiting for login attempts
- Regular security audits
- Monitor admin activity logs

## Support

For technical support or questions about the admin panel, please contact the development team.
