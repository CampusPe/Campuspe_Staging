import { parse } from 'csv-parse/sync';
import { promises as fs } from 'fs';
import { Student, IStudent } from '../models/Student';
import { ResumeData } from '../types/index';

export class ResumeParser {
    static async parseResume(filePath: string): Promise<ResumeData> {
        try {
            const fileContent = await fs.readFile(filePath);
            const records = parse(fileContent, {
                columns: true,
                skip_empty_lines: true,
            });

            // Assuming the records contain fields like name, email, skills, etc.
            const record = records[0] as any;
            const resumeData: ResumeData = {
                personalInfo: {
                    name: record?.name || '',
                    email: record?.email || '',
                    phone: record?.phone || '',
                    address: record?.address
                },
                education: [{
                    degree: record?.degree || '',
                    institution: record?.institution || '',
                    year: record?.year || '',
                    grade: record?.grade
                }],
                experience: [{
                    title: record?.title || '',
                    company: record?.company || '',
                    duration: record?.duration || '',
                    description: record?.description || ''
                }],
                skills: record?.skills ? record.skills.split(',') : [],
                projects: [],
                certifications: [],
                languages: []
            };

            return resumeData;
        } catch (error: any) {
            throw new Error(`Error parsing resume: ${error?.message || 'Unknown error'}`);
        }
    }

    static async saveParsedResume(resumeData: ResumeData): Promise<IStudent> {
        try {
            // This is a simplified implementation
            // In reality, you'd match this with existing student or create new one
            const studentData = {
                firstName: resumeData.personalInfo.name.split(' ')[0] || '',
                lastName: resumeData.personalInfo.name.split(' ').slice(1).join(' ') || '',
                skills: resumeData.skills.map(skill => ({ name: skill, level: 'intermediate' as const, category: 'technical' as const })),
                education: resumeData.education.map(edu => ({
                    degree: edu.degree,
                    field: '',
                    institution: edu.institution,
                    startDate: new Date(),
                    isCompleted: true
                }))
            };
            
            // Return a placeholder - in real implementation, create or update student
            return {} as IStudent;
        } catch (error: any) {
            throw new Error(`Error saving parsed resume: ${error?.message || 'Unknown error'}`);
        }
    }
}