# Profile System Testing Guide

## 🧪 Testing Checklist

### Prerequisites
- Both API and Web servers running
- Test users created for each role (Student, College, Recruiter)
- Sample data in database

### 1. **Student Profile Testing**

#### Test Cases:
- [ ] **View Own Profile**: Student can view their own profile from dashboard
- [ ] **Edit Profile**: Student can edit their profile information
- [ ] **Profile Completeness**: All fields (education, experience, skills) display correctly
- [ ] **Resume Integration**: Resume data and analysis display properly
- [ ] **Social Links**: LinkedIn, GitHub, Portfolio links work correctly

#### Navigation Testing:
- [ ] **From Recruiter Dashboard**: Recruiter can view student profile from applications
- [ ] **From College Dashboard**: College can view student profiles from student list
- [ ] **Direct URL Access**: `/profile/student/:id` loads correctly

#### API Testing:
```bash
# Test student profile endpoint
curl -H "Authorization: Bearer <token>" \
  http://localhost:5001/api/students/:id/profile

# Expected: Complete student data with populated college information
```

### 2. **College Profile Testing**

#### Test Cases:
- [ ] **View Own Profile**: College can view their own profile from dashboard
- [ ] **Public Profile Access**: Students/Recruiters can view college profile
- [ ] **Statistics Display**: Placement stats, student numbers display correctly
- [ ] **Programs Display**: Academic programs show with details
- [ ] **Contact Information**: Contact details properly formatted

#### Navigation Testing:
- [ ] **From Student Dashboard**: "View College Profile" link works in "My College" section
- [ ] **From Recruiter Dashboard**: Links to college profiles from connections
- [ ] **Direct URL Access**: `/profile/college/:id` loads correctly

#### API Testing:
```bash
# Test college profile endpoint (this was broken before)
curl -H "Authorization: Bearer <token>" \
  http://localhost:5001/api/colleges/:id/profile

# Expected: Complete college data with statistics and programs
```

### 3. **Recruiter Profile Testing**

#### Test Cases:
- [ ] **View Own Profile**: Recruiter can view their own company profile
- [ ] **Public Profile Access**: Students/Colleges can view recruiter profiles
- [ ] **Company Information**: All company details display correctly
- [ ] **Job Statistics**: Active jobs, applications, selections show correctly
- [ ] **Hiring Information**: Preferred colleges, locations display properly

#### Navigation Testing:
- [ ] **From Student Dashboard**: Links to recruiter profiles from job applications
- [ ] **From College Dashboard**: Links to recruiter profiles from invitations
- [ ] **Direct URL Access**: `/profile/recruiter/:id` loads correctly

#### API Testing:
```bash
# Test recruiter profile endpoint
curl -H "Authorization: Bearer <token>" \
  http://localhost:5001/api/recruiters/:id

# Expected: Complete recruiter data with company info and statistics
```

### 4. **Cross-Platform Navigation Testing**

#### Student Dashboard Testing:
- [ ] **My College Section**: "View College Profile" button works
- [ ] **Applications Section**: Can view recruiter profiles from job applications
- [ ] **Profile Section**: Can edit own profile

#### Recruiter Dashboard Testing:
- [ ] **Applications Section**: "View Profile" links work for students
- [ ] **College Connections**: Can view college profiles
- [ ] **Own Profile**: Can access and edit company profile

#### College Dashboard Testing:
- [ ] **Students Section**: Can view individual student profiles
- [ ] **Recruiters Section**: Can view recruiter/company profiles
- [ ] **Own Profile**: Can access and edit college profile

### 5. **Data Integrity Testing**

#### Student Data:
- [ ] **Education Array**: All education entries display with proper formatting
- [ ] **Experience Array**: Work experience shows with dates and descriptions
- [ ] **Skills Array**: Skills display correctly (handles both string and object formats)
- [ ] **Resume Analysis**: AI analysis data integrates properly
- [ ] **College Population**: College information populates correctly

#### College Data:
- [ ] **Statistics Calculation**: Numbers calculate correctly from database
- [ ] **Programs Data**: Academic programs display with all details
- [ ] **Contact Information**: Primary and placement contacts show
- [ ] **Address Information**: Location data displays properly

#### Recruiter Data:
- [ ] **Company Information**: All company fields populate correctly
- [ ] **Statistics Calculation**: Job and application metrics calculate properly
- [ ] **Hiring Preferences**: Preferred colleges and locations display
- [ ] **Profile Completeness**: Completion percentage calculates correctly

### 6. **Error Handling Testing**

#### Invalid IDs:
- [ ] **Invalid Student ID**: Returns proper 404 error
- [ ] **Invalid College ID**: Returns proper 404 error  
- [ ] **Invalid Recruiter ID**: Returns proper 404 error

#### Unauthorized Access:
- [ ] **No Token**: Redirects to login properly
- [ ] **Invalid Token**: Handles authentication errors
- [ ] **Unapproved Recruiters**: Hidden from public view

#### Missing Data:
- [ ] **Incomplete Profiles**: Handles missing data gracefully
- [ ] **No College Association**: Student profiles work without college
- [ ] **Empty Arrays**: Handles empty education/experience arrays

### 7. **UI/UX Testing**

#### Profile Display Component:
- [ ] **Responsive Design**: Works on mobile and desktop
- [ ] **Loading States**: Shows loading spinners appropriately
- [ ] **Error States**: Displays error messages clearly
- [ ] **Action Buttons**: Contact/Edit buttons work correctly
- [ ] **Social Links**: Open in new tabs properly

#### Navigation Component:
- [ ] **Icons Display**: Profile type icons show correctly
- [ ] **Permission Handling**: Disabled states work for unauthorized access
- [ ] **Link Generation**: URLs generate correctly for all profile types

### 8. **Performance Testing**

#### Database Queries:
- [ ] **Population Efficiency**: Related data populates efficiently
- [ ] **Statistics Calculation**: Stats calculate without timeout
- [ ] **Large Data Sets**: Works with many students/applications
- [ ] **Concurrent Access**: Multiple users can view profiles simultaneously

#### Frontend Performance:
- [ ] **Page Load Speed**: Profile pages load quickly
- [ ] **Component Rendering**: ProfileDisplay component renders efficiently
- [ ] **Navigation Speed**: Links navigate without delays

## 🐛 Common Issues to Watch For

### API Issues:
1. **Missing Population**: College/User data not populated in responses
2. **Data Type Mismatches**: Skills array handling (string vs object)
3. **Statistics Calculation**: Incorrect counts or percentages
4. **Authentication**: Token validation failures

### Frontend Issues:
1. **TypeScript Errors**: Type mismatches in profile interfaces
2. **Null Reference Errors**: Accessing undefined nested properties
3. **Navigation Failures**: Broken links to profile pages
4. **Component Rendering**: ProfileDisplay component errors

### Data Issues:
1. **Legacy Data Compatibility**: Old data format not supported
2. **Missing Required Fields**: Profiles with incomplete information
3. **Broken Relationships**: Student-College or Recruiter-Job associations
4. **Statistics Accuracy**: Calculated numbers don't match reality

## 🔧 Debugging Commands

### Check Database Data:
```bash
# Connect to MongoDB and check collections
mongosh
use campuspe_db
db.students.findOne({}, {firstName: 1, collegeId: 1, skills: 1})
db.colleges.findOne({}, {name: 1, stats: 1})
db.recruiters.findOne({}, {companyInfo: 1, approvalStatus: 1})
```

### Check API Responses:
```bash
# Test all profile endpoints
curl -H "Authorization: Bearer <token>" http://localhost:5001/api/students/profile
curl -H "Authorization: Bearer <token>" http://localhost:5001/api/colleges/profile  
curl -H "Authorization: Bearer <token>" http://localhost:5001/api/recruiters/profile
```

### Frontend Console Checks:
```javascript
// Check profile data in browser console
console.log('Profile Data:', profileData);
console.log('User Type:', userType);
console.log('Navigation State:', router.query);
```

## ✅ Success Criteria

- [ ] All profile pages load without errors
- [ ] Cross-platform navigation works seamlessly
- [ ] All profile data displays correctly and completely
- [ ] Statistics and calculations are accurate
- [ ] TypeScript compilation passes without errors
- [ ] Performance is acceptable (<2 seconds page load)
- [ ] Error handling works gracefully
- [ ] Mobile responsiveness works properly

This testing guide ensures comprehensive validation of the enhanced profile system implementation.
