const mongoose = require('mongoose');

// MongoDB connection
const mongoURL = process.env.MONGO_URL || 'mongodb+srv://prem:Chem1234@cluster0.evfdg.mongodb.net/collegerms';

async function debugStudentProfile() {
    try {
        // Connect to MongoDB
        await mongoose.connect(mongoURL);
        console.log('Connected to MongoDB');

        // Get the Student model
        const Student = mongoose.model('Student', new mongoose.Schema({}, { strict: false }));

        // Find the student by email
        const student = await Student.findOne({ email: 'premthakare@gmail.com' });

        if (!student) {
            console.log('❌ Student not found');
            return;
        }

        console.log('\n=== COMPLETE STUDENT PROFILE ===');
        console.log('Email:', student.email);
        console.log('Name:', student.name);
        
        console.log('\n--- EXPERIENCE ---');
        if (student.experience && student.experience.length > 0) {
            student.experience.forEach((exp, index) => {
                console.log(`Experience ${index + 1}:`, {
                    title: exp.title,
                    company: exp.company,
                    description: exp.description ? exp.description.substring(0, 200) + '...' : 'No description',
                    startDate: exp.startDate,
                    endDate: exp.endDate
                });
            });
        } else {
            console.log('No experience data found');
        }

        console.log('\n--- EDUCATION ---');
        if (student.education && student.education.length > 0) {
            student.education.forEach((edu, index) => {
                console.log(`Education ${index + 1}:`, {
                    degree: edu.degree,
                    field: edu.field,
                    institution: edu.institution,
                    gpa: edu.gpa
                });
            });
        } else {
            console.log('No education data found');
        }

        console.log('\n--- SKILLS ---');
        if (student.skills && student.skills.length > 0) {
            console.log('Skills:', student.skills.map(s => s.name || s).join(', '));
        } else {
            console.log('No skills data found');
        }

        console.log('\n--- PROJECTS ---');
        if (student.projects && student.projects.length > 0) {
            student.projects.forEach((proj, index) => {
                console.log(`Project ${index + 1}:`, {
                    title: proj.title,
                    description: proj.description ? proj.description.substring(0, 100) + '...' : 'No description'
                });
            });
        } else {
            console.log('No projects data found');
        }

        console.log('\n--- RESUME ANALYSIS ---');
        if (student.resumeAnalysis) {
            console.log('Resume Analysis:', {
                skills: student.resumeAnalysis.skills?.slice(0, 5),
                experience: student.resumeAnalysis.experience?.length || 0,
                education: student.resumeAnalysis.education?.length || 0
            });
        } else {
            console.log('No resumeAnalysis data found');
        }

        console.log('\n--- RAW STUDENT DATA (First 1000 chars) ---');
        const studentJson = JSON.stringify(student.toObject(), null, 2);
        console.log(studentJson.substring(0, 1000) + '...');

    } catch (error) {
        console.error('Error:', error);
    } finally {
        await mongoose.disconnect();
    }
}

debugStudentProfile();
