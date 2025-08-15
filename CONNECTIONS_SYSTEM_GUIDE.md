# 🔗 CONNECTIONS SYSTEM - COMPLETE GUIDE

## Overview
The Connections system allows recruiters and colleges to establish professional relationships on the CampusPe platform.

## System Architecture

### 🗄️ Database Schema
```javascript
// Connection Model
{
  requester: ObjectId,    // User who initiated the connection
  target: ObjectId,       // User who received the connection request
  targetType: String,     // 'company' or 'college'
  status: String,         // 'pending', 'accepted', 'declined'
  message: String,        // Optional message with the request
  createdAt: Date,
  acceptedAt: Date
}
```

### 🔙 Backend API Endpoints

#### 1. Create Connection Request
```
POST /api/connections/request
Headers: Authorization: Bearer <token>
Body: {
  "targetId": "user_id_here",
  "targetType": "college", 
  "message": "Would love to connect!"
}
```

#### 2. Get User's Connections
```
GET /api/connections
Headers: Authorization: Bearer <token>
Response: [
  {
    "_id": "connection_id",
    "requester": {
      "_id": "user_id",
      "name": "John Doe",
      "email": "john@example.com",
      "userType": "recruiter"
    },
    "target": {
      "_id": "user_id",
      "name": "ABC College",
      "email": "admin@abc.edu",
      "userType": "college"
    },
    "status": "pending",
    "message": "Would love to connect!",
    "createdAt": "2025-08-15T10:00:00Z"
  }
]
```

#### 3. Accept Connection
```
POST /api/connections/:id/accept
Headers: Authorization: Bearer <token>
```

#### 4. Decline Connection
```
POST /api/connections/:id/decline
Headers: Authorization: Bearer <token>
```

### 🎨 Frontend Implementation

#### State Management
```typescript
interface Connection {
  _id: string;
  requester: {
    _id: string;
    name: string;
    email: string;
    userType: string;
  };
  target: {
    _id: string;
    name: string;
    email: string;
    userType: string;
  };
  status: 'pending' | 'accepted' | 'declined';
  message?: string;
  createdAt: string;
  acceptedAt?: string;
}

const [connections, setConnections] = useState<Connection[]>([]);
const [connectionsLoading, setConnectionsLoading] = useState(false);
```

#### Fetching Connections
```typescript
const fetchConnections = async () => {
  try {
    setConnectionsLoading(true);
    
    // Browser-only check for SSR compatibility
    if (typeof window === 'undefined') return;
    
    const token = localStorage.getItem('token');
    if (!token) {
      setError('Please log in to view connections');
      return;
    }

    const response = await axios.get('/api/connections', {
      headers: { Authorization: `Bearer ${token}` }
    });
    
    setConnections(response.data || []);
  } catch (error) {
    console.error('Error fetching connections:', error);
    handleConnectionError(error);
  } finally {
    setConnectionsLoading(false);
  }
};
```

#### Error Handling
```typescript
const handleConnectionError = (error: any) => {
  if (error.response?.status === 401) {
    setError('Authentication failed. Please log in again.');
    localStorage.removeItem('token');
    router.push('/login');
  } else if (error.response?.status === 500) {
    setError('Server error. Please try again later.');
  } else {
    setError(`Failed to load connections: ${error.message}`);
  }
};
```

## 🔧 How It Works - Step by Step

### For Recruiters:
1. **View Connections Tab**: Click on "Connections" in the dashboard
2. **See Three Sections**:
   - **Incoming Requests**: Connections requested by colleges
   - **Sent Requests**: Connections you've requested from colleges  
   - **Established Connections**: Accepted connections

### For Colleges:
1. **Receive Connection Requests**: From recruiters wanting to establish relationships
2. **Accept/Decline**: Review and respond to requests
3. **Manage Connections**: View all established connections

### Authentication Flow:
1. **User logs in** → Gets JWT token
2. **Token stored** in localStorage as 'token'
3. **API requests** include `Authorization: Bearer <token>` header
4. **Backend validates** token and user permissions
5. **Data returned** with proper user information populated

## 🐛 Troubleshooting Common Issues

### "Failed to load connections" Error
**Cause**: Usually authentication or network issues
**Solutions**:
1. Check if user is logged in (`localStorage.getItem('token')`)
2. Verify API server is running on port 5001
3. Check browser console for detailed error messages
4. Ensure CORS is configured properly

### 500 Internal Server Error
**Cause**: Server-side issues
**Solutions**:
1. Check API server logs
2. Verify database connection
3. Ensure all required environment variables are set
4. Check if authentication middleware is working

### Empty Connections List
**Cause**: No connections exist or data not loading
**Solutions**:
1. Create test connections in database
2. Verify user has proper permissions
3. Check if API endpoint returns data correctly

## 🧪 Testing the System

### Manual Testing:
1. Start API server: `cd apps/api && npm start`
2. Start web server: `cd apps/web && npm run dev`
3. Login as recruiter: `test_recruiter@campuspe.com` / `pppppp`
4. Navigate to Connections tab
5. Should see test connections

### API Testing:
```bash
# Login
curl -X POST http://localhost:5001/api/auth/login \
  -H "Content-Type: application/json" \
  -d '{"email":"test_recruiter@campuspe.com","password":"pppppp"}'

# Use the token from login response
curl -X GET http://localhost:5001/api/connections \
  -H "Authorization: Bearer YOUR_TOKEN_HERE"
```

## 📈 Future Enhancements

1. **Real-time notifications** when connection requests are received
2. **Connection recommendations** based on user profiles
3. **Bulk connection management** for large organizations
4. **Connection analytics** and insights
5. **Message threads** for ongoing communication

## 🔒 Security Considerations

1. **Authentication required** for all connection operations
2. **Authorization checks** to ensure users can only manage their own connections
3. **Rate limiting** to prevent spam connection requests
4. **Input validation** on all connection data
5. **HTTPS enforcement** in production

## 📱 UI/UX Best Practices

1. **Loading states** while fetching connections
2. **Error messages** that guide user action
3. **Empty states** with helpful instructions
4. **Responsive design** for mobile devices
5. **Accessible components** following WCAG guidelines
