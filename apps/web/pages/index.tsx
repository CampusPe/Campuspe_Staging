'use client';

import Image from 'next/image';
import { motion } from 'framer-motion';
import { 
  Star, 
  ArrowRight, 
  PlayCircle, 
  Users, 
  Building2, 
  GraduationCap,
  TrendingUp,
  Plus,
  Search,
  Briefcase,
  FileText,
  CheckCircle,
  Phone,
  Mail,
  Calendar,
  ChevronDown,
  CreditCard
} from 'lucide-react';

import Navbar from '../components/Navbar';
import Footer from '../components/Footer';
import { Button } from '../components/ui/Button';
import { Card } from '../components/ui/Card';
import { 
  MotionCard, 
  FloatingElement, 
  FadeInView, 
  StaggerContainer, 
  StaggerItem 
} from '../components/ui/MotionComponents';

export default function Home() {
  const stats = [
    { value: '50K+', label: 'Students Placed', icon: Users },
    { value: '500+', label: 'Partner Colleges', icon: Building2 },
    { value: '1K+', label: 'Hiring Companies', icon: GraduationCap },
    { value: '95%', label: 'Success Rate', icon: TrendingUp }
  ];

  const processSteps = [
    {
      step: '01',
      title: 'Choose Your Path',
      description: 'Select whether you\'re a student, college, or company',
      icon: '🎯',
      color: 'from-blue-500 to-purple-500'
    },
    {
      step: '02',
      title: 'Complete Profile',
      description: 'Build your comprehensive profile with all relevant details',
      icon: '📝',
      color: 'from-green-500 to-blue-500'
    },
    {
      step: '03',
      title: 'Smart Matching',
      description: 'Our AI connects you with the best opportunities',
      icon: '💝',
      color: 'from-pink-500 to-red-500'
    },
    {
      step: '04',
      title: 'Achieve Success',
      description: 'Land your dream job, find perfect students, or build partnerships',
      icon: '🚀',
      color: 'from-orange-500 to-yellow-500'
    }
  ];

  const studentFeatures = [
    {
      icon: '🔍',
      title: 'Search hundreds',
      description: 'Find and compare colleges easily, all in one place.',
      subtitle: 'of colleges'
    },
    {
      icon: '📚',
      title: 'One form, many colleges',
      description: 'Apply to multiple colleges that suit you from Swayam, under, post-free.',
      subtitle: ''
    },
    {
      icon: '🚀',
      title: 'Start your career early',
      description: 'Explore and apply to part-time jobs, internships, and full-time jobs with your skill, interests, and career goals.',
      subtitle: ''
    },
    {
      icon: '💰',
      title: 'Hassle-free fee payments',
      description: 'Pay securely, save bank slips, get instant updates, and access student loans.',
      subtitle: ''
    }
  ];

  const collegeFeatures = [
    {
      icon: '👥',
      title: 'Struggling to Reach Students?',
      description: 'Boost your college\'s online presence and connect with thousands of students instantly.'
    },
    {
      icon: '🤝',
      title: 'Struggling to Bring Companies for Placements?',
      description: 'Connect directly with company HRs, schedule job drives, and increase placement opportunities for your students.'
    },
    {
      icon: '👨‍🎓',
      title: 'Missing Out on Student Leads?',
      description: 'Manage all admissions leads in one place. Track, follow up faster, and boost admissions.'
    },
    {
      icon: '💰',
      title: 'Messy Fee Collections?',
      description: 'Collect fees hassle-free through unique QR codes, capture student details and track everything in real-time.'
    }
  ];

  const companyFeatures = [
    {
      icon: '🎯',
      title: 'Struggling to Hire from the Right Colleges?',
      description: 'Hire fresh graduates and interns directly from premier colleges, including Tier I Tier II, for campus drives.'
    },
    {
      icon: '📋',
      title: 'Posting Jobs One by One?',
      description: 'Post jobs to multiple colleges at once based on your hiring criteria.'
    },
    {
      icon: '📊',
      title: 'Messy Hiring Process?',
      description: 'Track and manage every application in one simple dashboard.'
    },
    {
      icon: '⏰',
      title: 'Hiring Taking Too Much Time & Cost?',
      description: 'Save time with AI-powered applicant ranking by their hiring costs.'
    }
  ];

  const testimonials = [
    {
      name: 'Angelina',
      role: 'American Girl Chief',
      avatar: '/88e21d9821e24bd22f3f4cd331e57683038b99c6.png',
      quote: 'Lorem ipsum lorem, calendar, timeline, kanban, and more! The easy-to-use, visual interface lets any team member jump in and get started, no training required.',
      rating: 5
    },
    {
      name: 'Sara Ferrmante',
      role: 'Head of CS',
      avatar: '/fd93682fe6f18f4cba2ab29e72ad44c57d791012.png',
      quote: 'We ensure that any information you need is stored immediately in our systems and can be retrieved by simply contacting our team!',
      rating: 5
    }
  ];

  const faqItems = [
    "What makes CampusPe different from other learning platforms?",
    "CampusPe focuses on project-based learning with real-world applications. Our courses are taught by industry experts currently working at top companies, and we provide comprehensive career support including resume reviews, interview prep, and job placement assistance.",
    "Do I get lifetime access to the courses?", 
    "What level of support do I get as a student?",
    "Are the certificates recognized by employers?",
    "Can I get a refund if I'm not satisfied?",
    "What if I'm a complete beginner?",
    "How much time do I need to commit to learning?",
    "Do you offer team or corporate training?"
  ];

  return (
    <>
      <Navbar />
      
      {/* Hero Section */}
      <section className="min-h-screen bg-gradient-to-br from-blue-50 via-white to-purple-50 pt-20 overflow-hidden relative">
        {/* Background Motion Elements */}
        <div className="absolute inset-0 overflow-hidden">
          <FloatingElement className="absolute top-32 left-20" duration={6}>
            <div className="w-4 h-4 bg-teal-400 rounded-full opacity-80"></div>
          </FloatingElement>
          <FloatingElement className="absolute top-48 right-32" duration={8}>
            <div className="w-3 h-3 bg-blue-500 rounded-full opacity-80"></div>
          </FloatingElement>
          <FloatingElement className="absolute bottom-48 left-32" duration={7}>
            <div className="w-4 h-4 bg-purple-500 rounded-full opacity-80"></div>
          </FloatingElement>
          <FloatingElement className="absolute bottom-32 right-24" duration={9}>
            <div className="w-3 h-3 bg-yellow-500 rounded-full opacity-80"></div>
          </FloatingElement>
          <FloatingElement className="absolute top-1/2 left-1/4" duration={5}>
            <div className="w-2 h-2 bg-green-400 rounded-full opacity-80"></div>
          </FloatingElement>
          <FloatingElement className="absolute top-1/3 right-1/3" duration={6}>
            <div className="w-3 h-3 bg-pink-500 rounded-full opacity-80"></div>
          </FloatingElement>
          <FloatingElement className="absolute bottom-1/3 left-1/3" duration={4}>
            <div className="w-2 h-2 bg-orange-400 rounded-full opacity-80"></div>
          </FloatingElement>
          <FloatingElement className="absolute top-2/3 right-1/4" duration={7}>
            <div className="w-4 h-4 bg-indigo-400 rounded-full opacity-80"></div>
          </FloatingElement>
        </div>

        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-16 relative">
          {/* Floating Student Images Around the Content */}
          {/* Top Left - Student in green striped shirt */}
          <FloatingElement duration={4} className="absolute top-16 left-16 hidden lg:block z-10">
            <motion.div 
              whileHover={{ scale: 1.05 }}
              className="w-40 h-48 overflow-hidden shadow-2xl border-4 border-white hover:border-purple-200 transition-all duration-300 cursor-pointer"
              style={{ borderRadius: '60px 60px 60px 60px / 80px 80px 80px 80px' }}
            >
              <Image
                src="/07d8c7576ff7b5bcd8eccf277fb5e24bffa55244.png"
                alt="Student in green striped shirt"
                width={160}
                height={192}
                className="w-full h-full object-cover"
              />
            </motion.div>
          </FloatingElement>

          {/* Bottom Left - Female Student with Green Background */}
          <FloatingElement duration={5} className="absolute bottom-32 left-8 hidden lg:block z-10">
            <motion.div 
              whileHover={{ scale: 1.05 }}
              className="w-44 h-52 overflow-hidden shadow-2xl border-4 border-white bg-green-400 flex items-center justify-center hover:border-blue-200 transition-all duration-300 cursor-pointer"
              style={{ borderRadius: '70px 70px 70px 70px / 90px 90px 90px 90px' }}
            >
              <Image
                src="/3b4d5529440969da813eeb7824f7dd1c42a63f19.png"
                alt="Female Student with laptop"
                width={176}
                height={208}
                className="w-full h-full object-cover"
              />
            </motion.div>
          </FloatingElement>

          {/* Top Right - Student in dark sweater */}
          <FloatingElement duration={6} className="absolute top-24 right-16 hidden lg:block z-10">
            <motion.div 
              whileHover={{ scale: 1.05 }}
              className="w-40 h-48 overflow-hidden shadow-2xl border-4 border-white hover:border-purple-200 transition-all duration-300 cursor-pointer"
              style={{ borderRadius: '60px 60px 60px 60px / 80px 80px 80px 80px' }}
            >
              <Image
                src="/59097144faeb455019e32469d7d11758d5fdaed4.png"
                alt="Student in dark sweater"
                width={160}
                height={192}
                className="w-full h-full object-cover"
              />
            </motion.div>
          </FloatingElement>

          {/* Bottom Right - Female Student with backpack */}
          <FloatingElement duration={4} className="absolute bottom-16 right-8 hidden lg:block z-10">
            <motion.div 
              whileHover={{ scale: 1.05 }}
              className="w-36 h-44 overflow-hidden shadow-2xl border-4 border-white hover:border-blue-200 transition-all duration-300 cursor-pointer"
              style={{ borderRadius: '55px 55px 55px 55px / 75px 75px 75px 75px' }}
            >
              <Image
                src="/c31e00fa1e3a6aa0b76326f5b4b6c78555c1e960.png"
                alt="Female student with backpack"
                width={144}
                height={176}
                className="w-full h-full object-cover"
              />
            </motion.div>
          </FloatingElement>

          {/* Centered Content */}
          <div className="text-center min-h-[80vh] flex flex-col justify-center items-center relative z-10">
            <motion.div 
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.6, delay: 0.3 }}
              className="inline-flex items-center space-x-2 bg-blue-100 text-blue-700 px-4 py-2 rounded-full text-sm font-medium hover:bg-blue-200 transition-colors cursor-pointer mb-8"
            >
              <Star className="w-4 h-4" />
              <span>Your AI-Powered Education Journey</span>
            </motion.div>

            <motion.h1 
              initial={{ opacity: 0, y: 30 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.8, delay: 0.4 }}
              className="text-4xl md:text-5xl lg:text-6xl font-bold text-gray-900 leading-tight mb-12 max-w-4xl"
              style={{ fontFamily: 'Inter, sans-serif' }}
            >
              College{' '}
              <span className="bg-gradient-to-r from-blue-600 to-purple-600 bg-clip-text text-transparent">Admissions</span>{' '}
              & Placements<br />
              Made Simple-On{' '}
              <span className="bg-gradient-to-r from-green-500 to-blue-500 bg-clip-text text-transparent">WhatsApp</span>
            </motion.h1>

            <motion.div 
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.6, delay: 0.6 }}
              className="grid md:grid-cols-2 gap-6 max-w-4xl mx-auto"
            >
              {/* Colleges Card */}
              <motion.div 
                whileHover={{ scale: 1.02, y: -5 }}
                className="bg-white p-6 rounded-2xl shadow-lg border border-gray-100 hover:shadow-xl transition-all duration-300 cursor-pointer"
              >
                <div className="flex items-center space-x-3 mb-4">
                  <div className="w-12 h-12 bg-blue-100 rounded-2xl flex items-center justify-center">
                    <Building2 className="w-6 h-6 text-blue-600" />
                  </div>
                  <div className="text-left">
                    <div className="text-sm text-gray-500">1200+ Colleges</div>
                    <div className="text-xl font-bold text-gray-900">Colleges</div>
                  </div>
                </div>
                <p className="text-gray-600 text-sm text-left">
                  Simplify your college admissions
                </p>
                <div className="mt-4 text-xs text-gray-500 text-left">
                  Explore top colleges and programs, apply once, pay fees instantly, and grab spot admission offers - everything handle
                </div>
              </motion.div>

              {/* Jobs Card */}
              <motion.div 
                whileHover={{ scale: 1.02, y: -5 }}
                className="bg-white p-6 rounded-2xl shadow-lg border border-gray-100 hover:shadow-xl transition-all duration-300 cursor-pointer"
              >
                <div className="flex items-center space-x-3 mb-4">
                  <div className="w-12 h-12 bg-purple-100 rounded-2xl flex items-center justify-center">
                    <Briefcase className="w-6 h-6 text-purple-600" />
                  </div>
                  <div className="text-left">
                    <div className="text-sm text-gray-500">15,000+ Opportunities</div>
                    <div className="text-xl font-bold text-gray-900">Jobs</div>
                  </div>
                </div>
                <p className="text-gray-600 text-sm text-left">
                  Find Part-Time, Full-Time, Freelance, or Internship opportunities
                </p>
                <div className="mt-4 text-xs text-gray-500 text-left">
                  Explore diverse career opportunities with AI-powered matching based on your skills, interests, and career goals.
                </div>
              </motion.div>
            </motion.div>
          </div>
        </div>
      </section>

      {/* Who It's For Section */}
      <section className="py-20 bg-white">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          {/* Section Header */}
          <motion.div
            initial={{ opacity: 0, y: 30 }}
            whileInView={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6 }}
            className="text-center mb-16"
          >
            <p className="text-blue-600 font-medium mb-2"> Who It's For</p>
            <h2 className="text-4xl font-bold text-gray-900">
              Built for Students, Colleges & Companies
            </h2>
          </motion.div>

          {/* For Students - Content Left, Image Right */}
          <div className="mb-20">
            <div className="grid lg:grid-cols-2 gap-16 items-center">
              {/* Left side - Content Cards with alternating positions */}
              <div className="space-y-6 relative">
                {/* Title centered above the cards */}
                <motion.div
                  initial={{ opacity: 0, y: 30 }}
                  whileInView={{ opacity: 1, y: 0 }}
                  transition={{ duration: 0.6 }}
                  className="mb-8 text-center"
                >
                  <h3 className="text-3xl font-bold text-blue-600">For Students</h3>
                </motion.div>

                {/* Feature 1 - Search hundreds of colleges - Left positioned */}
                <motion.div
                  initial={{ opacity: 0, y: 20 }}
                  whileInView={{ opacity: 1, y: 0 }}
                  transition={{ duration: 0.5, delay: 0.1 }}
                  className="bg-gradient-to-r from-purple-50 to-blue-50 p-6 rounded-2xl border border-purple-100 hover:shadow-2xl hover:scale-[1.02] hover:border-purple-200 transition-all duration-300 mr-8 cursor-pointer"
                >
                  <div className="flex items-start space-x-4">
                    <div className="w-12 h-12 bg-gradient-to-r from-purple-500 to-blue-500 rounded-xl flex items-center justify-center flex-shrink-0 hover:scale-110 transition-transform duration-300">
                      <Search className="w-6 h-6 text-white" />
                    </div>
                    <div className="flex-1">
                      <h4 className="font-bold text-gray-900 mb-2 text-lg">
                        Search hundreds <span className="text-purple-600">of colleges</span>
                      </h4>
                      <p className="text-gray-600 text-sm leading-relaxed">
                        Find and compare colleges easily, all in one place.
                      </p>
                    </div>
                  </div>
                </motion.div>

                {/* Feature 2 - One form, many colleges - Right positioned */}
                <motion.div
                  initial={{ opacity: 0, y: 20 }}
                  whileInView={{ opacity: 1, y: 0 }}
                  transition={{ duration: 0.5, delay: 0.2 }}
                  className="bg-gradient-to-r from-blue-50 to-purple-50 p-6 rounded-2xl border border-blue-100 hover:shadow-2xl hover:scale-[1.02] hover:border-blue-200 transition-all duration-300 ml-8 cursor-pointer"
                >
                  <div className="flex items-start space-x-4">
                    <div className="w-12 h-12 bg-gradient-to-r from-blue-500 to-purple-500 rounded-xl flex items-center justify-center flex-shrink-0 hover:scale-110 transition-transform duration-300">
                      <FileText className="w-6 h-6 text-white" />
                    </div>
                    <div className="flex-1">
                      <h4 className="font-bold text-gray-900 mb-2 text-lg">
                        <span className="text-blue-600">One form,</span> many colleges
                      </h4>
                      <p className="text-gray-600 text-sm leading-relaxed">
                        Apply to multiple colleges with one simple form-faster, easier, stress-free.
                      </p>
                    </div>
                  </div>
                </motion.div>

                {/* Feature 3 - Start your career early - Left positioned */}
                <motion.div
                  initial={{ opacity: 0, y: 20 }}
                  whileInView={{ opacity: 1, y: 0 }}
                  transition={{ duration: 0.5, delay: 0.3 }}
                  className="bg-gradient-to-r from-purple-50 to-blue-50 p-6 rounded-2xl border border-purple-100 hover:shadow-2xl hover:scale-[1.02] hover:border-purple-200 transition-all duration-300 mr-8 cursor-pointer"
                >
                  <div className="flex items-start space-x-4">
                    <div className="w-12 h-12 bg-gradient-to-r from-purple-500 to-blue-500 rounded-xl flex items-center justify-center flex-shrink-0 hover:scale-110 transition-transform duration-300">
                      <TrendingUp className="w-6 h-6 text-white" />
                    </div>
                    <div className="flex-1">
                      <h4 className="font-bold text-gray-900 mb-2 text-lg">
                        Start <span className="text-purple-600">your career early</span>
                      </h4>
                      <p className="text-gray-600 text-sm leading-relaxed">
                        "Explore and apply to part-time jobs, internships, and full-time roles-with real-time alerts."
                      </p>
                    </div>
                  </div>
                </motion.div>

                {/* Feature 4 - Hassle-free fee payments - Right positioned */}
                <motion.div
                  initial={{ opacity: 0, y: 20 }}
                  whileInView={{ opacity: 1, y: 0 }}
                  transition={{ duration: 0.5, delay: 0.4 }}
                  className="bg-gradient-to-r from-blue-50 to-purple-50 p-6 rounded-2xl border border-blue-100 hover:shadow-2xl hover:scale-[1.02] hover:border-blue-200 transition-all duration-300 ml-8 cursor-pointer"
                >
                  <div className="flex items-start space-x-4">
                    <div className="w-12 h-12 bg-gradient-to-r from-blue-500 to-purple-500 rounded-xl flex items-center justify-center flex-shrink-0 hover:scale-110 transition-transform duration-300">
                      <CheckCircle className="w-6 h-6 text-white" />
                    </div>
                    <div className="flex-1">
                      <h4 className="font-bold text-gray-900 mb-2 text-lg">
                        <span className="text-blue-600">Hassle-free</span> fee payments
                      </h4>
                      <p className="text-gray-600 text-sm leading-relaxed">
                        Pay securely, cash back offers, get instant updates, and access student loans.
                      </p>
                    </div>
                  </div>
                </motion.div>

                {/* Explore Button */}
                <motion.div
                  initial={{ opacity: 0, y: 20 }}
                  whileInView={{ opacity: 1, y: 0 }}
                  transition={{ duration: 0.5, delay: 0.5 }}
                  className="pt-6 text-center"
                >
                  <button className="bg-gradient-to-r from-purple-600 to-blue-600 text-white px-8 py-4 rounded-xl hover:from-purple-700 hover:to-blue-700 hover:scale-105 hover:shadow-2xl transition-all duration-300 font-semibold text-lg shadow-lg">
                    Explore Colleges & Jobs
                  </button>
                </motion.div>
              </div>

              {/* Right side - Image */}
              <div className="relative">
                <motion.div 
                  initial={{ opacity: 0, x: 50 }}
                  whileInView={{ opacity: 1, x: 0 }}
                  transition={{ duration: 0.8 }}
                  className="relative rounded-3xl overflow-hidden shadow-2xl hover:scale-[1.02] transition-transform duration-300 cursor-pointer"
                >
                  <Image
                    src="/9b8314d0fa4d8e29be5d546499a9494a0c5b8dc7.jpg"
                    alt="Students sitting together"
                    width={600}
                    height={450}
                    className="w-full h-[450px] object-cover"
                    priority
                  />
                </motion.div>
              </div>
            </div>
          </div>

          {/* For Colleges - Images Left, Content Right */}
          <div className="mb-20">
            <div className="grid lg:grid-cols-2 gap-16 items-center">
              {/* Left side - Images Grid */}
              <div className="relative">
                <div className="grid grid-cols-2 gap-4">
                  {/* Top left */}
                  <motion.div 
                    initial={{ opacity: 0, y: 50 }}
                    whileInView={{ opacity: 1, y: 0 }}
                    transition={{ duration: 0.8, delay: 0.1 }}
                    className="relative rounded-2xl overflow-hidden shadow-xl hover:scale-[1.02] transition-transform duration-300 cursor-pointer"
                  >
                    <Image
                      src="/9b8314d0fa4d8e29be5d546499a9494a0c5b8dc7.jpg"
                      alt="College building"
                      width={200}
                      height={150}
                      className="w-full h-32 object-cover"
                    />
                  </motion.div>

                  {/* Top right */}
                  <motion.div 
                    initial={{ opacity: 0, y: 50 }}
                    whileInView={{ opacity: 1, y: 0 }}
                    transition={{ duration: 0.8, delay: 0.2 }}
                    className="relative rounded-2xl overflow-hidden shadow-xl hover:scale-[1.02] transition-transform duration-300 cursor-pointer"
                  >
                    <Image
                      src="/59a78b0511f4680d63e4da78954e55d310d7f67b.jpg"
                      alt="College campus"
                      width={200}
                      height={150}
                      className="w-full h-32 object-cover"
                    />
                  </motion.div>

                  {/* Bottom - Full width */}
                  <motion.div 
                    initial={{ opacity: 0, y: 50 }}
                    whileInView={{ opacity: 1, y: 0 }}
                    transition={{ duration: 0.8, delay: 0.3 }}
                    className="col-span-2 relative rounded-2xl overflow-hidden shadow-xl hover:scale-[1.02] transition-transform duration-300 cursor-pointer"
                  >
                    <Image
                      src="/c5b0a7b4156f17ba1a6a8a2ad3549156ff210e7f.jpg"
                      alt="Students in college"
                      width={400}
                      height={200}
                      className="w-full h-40 object-cover"
                    />
                  </motion.div>
                </div>
              </div>

              {/* Right side - Content Cards with alternating positions */}
              <div className="space-y-6 relative">
                {/* Title centered above the cards */}
                <motion.div
                  initial={{ opacity: 0, y: 30 }}
                  whileInView={{ opacity: 1, y: 0 }}
                  transition={{ duration: 0.6 }}
                  className="mb-8 text-center"
                >
                  <h3 className="text-3xl font-bold text-blue-600">For Colleges</h3>
                </motion.div>

                {/* Feature 1 - Struggling to Reach Students - Left positioned */}
                <motion.div
                  initial={{ opacity: 0, y: 20 }}
                  whileInView={{ opacity: 1, y: 0 }}
                  transition={{ duration: 0.5, delay: 0.1 }}
                  className="bg-gradient-to-r from-purple-50 to-blue-50 p-6 rounded-2xl border border-purple-100 hover:shadow-xl transition-all duration-300 mr-8"
                >
                  <div className="flex items-start space-x-4">
                    <div className="w-12 h-12 bg-gradient-to-r from-purple-500 to-blue-500 rounded-xl flex items-center justify-center flex-shrink-0">
                      <Building2 className="w-6 h-6 text-white" />
                    </div>
                    <div className="flex-1">
                      <h4 className="font-bold text-gray-900 mb-2 text-lg">
                        Struggling to <span className="text-purple-600">Reach Students?</span>
                      </h4>
                      <p className="text-gray-600 text-sm leading-relaxed">
                        Boost your college's online presence and connect with thousands of students instantly.
                      </p>
                    </div>
                  </div>
                </motion.div>

                {/* Feature 2 - Struggling to Bring Companies - Right positioned */}
                <motion.div
                  initial={{ opacity: 0, y: 20 }}
                  whileInView={{ opacity: 1, y: 0 }}
                  transition={{ duration: 0.5, delay: 0.2 }}
                  className="bg-gradient-to-r from-blue-50 to-purple-50 p-6 rounded-2xl border border-blue-100 hover:shadow-xl transition-all duration-300 ml-8"
                >
                  <div className="flex items-start space-x-4">
                    <div className="w-12 h-12 bg-gradient-to-r from-blue-500 to-purple-500 rounded-xl flex items-center justify-center flex-shrink-0">
                      <Users className="w-6 h-6 text-white" />
                    </div>
                    <div className="flex-1">
                      <h4 className="font-bold text-gray-900 mb-2 text-lg">
                        Struggling to <span className="text-blue-600">Bring</span> Companies for Placements?
                      </h4>
                      <p className="text-gray-600 text-sm leading-relaxed">
                        Connect directly with company HRs, invite them for campus drives, and increase opportunities for your students.
                      </p>
                    </div>
                  </div>
                </motion.div>

                {/* Feature 3 - Missing Out on Student Leads - Left positioned */}
                <motion.div
                  initial={{ opacity: 0, y: 20 }}
                  whileInView={{ opacity: 1, y: 0 }}
                  transition={{ duration: 0.5, delay: 0.3 }}
                  className="bg-gradient-to-r from-purple-50 to-blue-50 p-6 rounded-2xl border border-purple-100 hover:shadow-xl transition-all duration-300 mr-8"
                >
                  <div className="flex items-start space-x-4">
                    <div className="w-12 h-12 bg-gradient-to-r from-purple-500 to-blue-500 rounded-xl flex items-center justify-center flex-shrink-0">
                      <Users className="w-6 h-6 text-white" />
                    </div>
                    <div className="flex-1">
                      <h4 className="font-bold text-gray-900 mb-2 text-lg">
                        <span className="text-purple-600">Missing Out</span> on Student Leads?
                      </h4>
                      <p className="text-gray-600 text-sm leading-relaxed">
                        Manage all admissions leads in one place. Track, follow up faster, and boost admissions.
                      </p>
                    </div>
                  </div>
                </motion.div>

                {/* Feature 4 - Messy Fee Collections - Right positioned */}
                <motion.div
                  initial={{ opacity: 0, y: 20 }}
                  whileInView={{ opacity: 1, y: 0 }}
                  transition={{ duration: 0.5, delay: 0.4 }}
                  className="bg-gradient-to-r from-blue-50 to-purple-50 p-6 rounded-2xl border border-blue-100 hover:shadow-xl transition-all duration-300 ml-8"
                >
                  <div className="flex items-start space-x-4">
                    <div className="w-12 h-12 bg-gradient-to-r from-blue-500 to-purple-500 rounded-xl flex items-center justify-center flex-shrink-0">
                      <CreditCard className="w-6 h-6 text-white" />
                    </div>
                    <div className="flex-1">
                      <h4 className="font-bold text-gray-900 mb-2 text-lg">
                        <span className="text-blue-600">Messy Fee</span> Collections?
                      </h4>
                      <p className="text-gray-600 text-sm leading-relaxed">
                        Collect fees hassle-free through unique QR codes, capture student details and track everything in real-time.
                      </p>
                    </div>
                  </div>
                </motion.div>

                {/* Register Button */}
                <motion.div
                  initial={{ opacity: 0, y: 20 }}
                  whileInView={{ opacity: 1, y: 0 }}
                  transition={{ duration: 0.5, delay: 0.5 }}
                  className="pt-6 text-center"
                >
                  <button className="bg-gradient-to-r from-purple-600 to-blue-600 text-white px-8 py-4 rounded-xl hover:from-purple-700 hover:to-blue-700 transition-all duration-300 font-semibold text-lg shadow-lg hover:shadow-xl">
                    Register as a College
                  </button>
                </motion.div>
              </div>
            </div>
          </div>

          {/* For Companies - Content Left, Image Right */}
          <div className="mb-20">
            <div className="grid lg:grid-cols-2 gap-16 items-center">
              {/* Left side - Content Cards with alternating positions */}
              <div className="space-y-6 relative">
                {/* Title centered above the cards */}
                <motion.div
                  initial={{ opacity: 0, y: 30 }}
                  whileInView={{ opacity: 1, y: 0 }}
                  transition={{ duration: 0.6 }}
                  className="mb-8 text-center"
                >
                  <h3 className="text-3xl font-bold text-blue-600">For Companies</h3>
                </motion.div>

                {/* Feature 1 - Struggling to Hire from Right Colleges - Left positioned */}
                <motion.div
                  initial={{ opacity: 0, y: 20 }}
                  whileInView={{ opacity: 1, y: 0 }}
                  transition={{ duration: 0.5, delay: 0.1 }}
                  className="bg-gradient-to-r from-purple-50 to-blue-50 p-6 rounded-2xl border border-purple-100 hover:shadow-xl transition-all duration-300 mr-8"
                >
                  <div className="flex items-start space-x-4">
                    <div className="w-12 h-12 bg-gradient-to-r from-purple-500 to-blue-500 rounded-xl flex items-center justify-center flex-shrink-0">
                      <Building2 className="w-6 h-6 text-white" />
                    </div>
                    <div className="flex-1">
                      <h4 className="font-bold text-gray-900 mb-2 text-lg">
                        Struggling to <span className="text-purple-600">Hire from the Right Colleges?</span>
                      </h4>
                      <p className="text-gray-600 text-sm leading-relaxed">
                        Hire fresh graduates and interns directly from premier colleges, including Tier I Tier II, for campus drives.
                      </p>
                    </div>
                  </div>
                </motion.div>

                {/* Feature 2 - Posting jobs One by One - Right positioned */}
                <motion.div
                  initial={{ opacity: 0, y: 20 }}
                  whileInView={{ opacity: 1, y: 0 }}
                  transition={{ duration: 0.5, delay: 0.2 }}
                  className="bg-gradient-to-r from-blue-50 to-purple-50 p-6 rounded-2xl border border-blue-100 hover:shadow-xl transition-all duration-300 ml-8"
                >
                  <div className="flex items-start space-x-4">
                    <div className="w-12 h-12 bg-gradient-to-r from-blue-500 to-purple-500 rounded-xl flex items-center justify-center flex-shrink-0">
                      <Briefcase className="w-6 h-6 text-white" />
                    </div>
                    <div className="flex-1">
                      <h4 className="font-bold text-gray-900 mb-2 text-lg">
                        <span className="text-blue-600">Posting jobs</span> One by One?
                      </h4>
                      <p className="text-gray-600 text-sm leading-relaxed">
                        Post jobs to multiple colleges at once based on your hiring criteria.
                      </p>
                    </div>
                  </div>
                </motion.div>

                {/* Feature 3 - Messy Hiring Process - Left positioned */}
                <motion.div
                  initial={{ opacity: 0, y: 20 }}
                  whileInView={{ opacity: 1, y: 0 }}
                  transition={{ duration: 0.5, delay: 0.3 }}
                  className="bg-gradient-to-r from-purple-50 to-blue-50 p-6 rounded-2xl border border-purple-100 hover:shadow-xl transition-all duration-300 mr-8"
                >
                  <div className="flex items-start space-x-4">
                    <div className="w-12 h-12 bg-gradient-to-r from-purple-500 to-blue-500 rounded-xl flex items-center justify-center flex-shrink-0">
                      <FileText className="w-6 h-6 text-white" />
                    </div>
                    <div className="flex-1">
                      <h4 className="font-bold text-gray-900 mb-2 text-lg">
                        <span className="text-purple-600">Messy</span> Hiring Process?
                      </h4>
                      <p className="text-gray-600 text-sm leading-relaxed">
                        Track and manage every application in one simple dashboard.
                      </p>
                    </div>
                  </div>
                </motion.div>

                {/* Feature 4 - Hiring Taking Too Much Time & Cost - Right positioned */}
                <motion.div
                  initial={{ opacity: 0, y: 20 }}
                  whileInView={{ opacity: 1, y: 0 }}
                  transition={{ duration: 0.5, delay: 0.4 }}
                  className="bg-gradient-to-r from-blue-50 to-purple-50 p-6 rounded-2xl border border-blue-100 hover:shadow-xl transition-all duration-300 ml-8"
                >
                  <div className="flex items-start space-x-4">
                    <div className="w-12 h-12 bg-gradient-to-r from-blue-500 to-purple-500 rounded-xl flex items-center justify-center flex-shrink-0">
                      <Calendar className="w-6 h-6 text-white" />
                    </div>
                    <div className="flex-1">
                      <h4 className="font-bold text-gray-900 mb-2 text-lg">
                        <span className="text-blue-600">Hiring Taking</span> Too Much Time & Cost?
                      </h4>
                      <p className="text-gray-600 text-sm leading-relaxed">
                        Save time with AI-powered applicant ranking by their hiring costs.
                      </p>
                    </div>
                  </div>
                </motion.div>

                {/* Register Button */}
                <motion.div
                  initial={{ opacity: 0, y: 20 }}
                  whileInView={{ opacity: 1, y: 0 }}
                  transition={{ duration: 0.5, delay: 0.5 }}
                  className="pt-6 text-center"
                >
                  <button className="bg-gradient-to-r from-purple-600 to-blue-600 text-white px-8 py-4 rounded-xl hover:from-purple-700 hover:to-blue-700 transition-all duration-300 font-semibold text-lg shadow-lg hover:shadow-xl">
                    Register as a Company
                  </button>
                </motion.div>
              </div>

              {/* Right side - Image */}
              <div className="relative">
                <motion.div 
                  initial={{ opacity: 0, x: 50 }}
                  whileInView={{ opacity: 1, x: 0 }}
                  transition={{ duration: 0.8 }}
                  className="relative rounded-3xl overflow-hidden shadow-2xl hover:scale-[1.02] transition-transform duration-300 cursor-pointer"
                >
                  <Image
                    src="/035983e2bf746be19a4ec95fcd501fd434b3a9c3.jpg"
                    alt="Company meeting room with team collaboration"
                    width={500}
                    height={400}
                    className="w-full h-auto object-cover"
                  />
                </motion.div>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* How CampusPe Platform Works Section */}
      <section className="py-20 bg-white">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <motion.div
            initial={{ opacity: 0, y: 30 }}
            whileInView={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6 }}
            className="text-center mb-16"
          >
            <h2 className="text-4xl font-bold text-gray-900 mb-4">
              How CampusPe <span className="text-blue-600">Platform Works</span>
            </h2>
            <p className="text-gray-600 text-lg max-w-2xl mx-auto">
              Simple steps to connect talent with opportunity
            </p>
          </motion.div>

          <div className="grid md:grid-cols-2 lg:grid-cols-4 gap-8">
            {/* Step 1 */}
            <motion.div
              initial={{ opacity: 0, y: 30 }}
              whileInView={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.5, delay: 0.1 }}
              className="bg-white p-8 rounded-3xl shadow-lg border border-gray-100 hover:shadow-xl transition-all duration-300 text-center relative"
            >
              <div className="w-16 h-16 bg-blue-100 rounded-2xl flex items-center justify-center mx-auto mb-6">
                <div className="w-12 h-12 bg-blue-500 rounded-xl flex items-center justify-center">
                  <CheckCircle className="w-6 h-6 text-white" />
                </div>
              </div>
              <h3 className="text-xl font-bold text-gray-900 mb-3">Choose Your Path</h3>
              <p className="text-gray-600 text-sm leading-relaxed">
                Select whether you're a student, college, or company
              </p>
              
              {/* Step indicator */}
              <div className="absolute -top-3 left-1/2 transform -translate-x-1/2">
                <div className="bg-blue-500 text-white text-xs font-bold px-3 py-1 rounded-full">
                  Step 01
                </div>
              </div>
            </motion.div>

            {/* Step 2 */}
            <motion.div
              initial={{ opacity: 0, y: 30 }}
              whileInView={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.5, delay: 0.2 }}
              className="bg-white p-8 rounded-3xl shadow-lg border border-gray-100 hover:shadow-xl transition-all duration-300 text-center relative"
            >
              <div className="w-16 h-16 bg-green-100 rounded-2xl flex items-center justify-center mx-auto mb-6">
                <div className="w-12 h-12 bg-green-500 rounded-xl flex items-center justify-center">
                  <FileText className="w-6 h-6 text-white" />
                </div>
              </div>
              <h3 className="text-xl font-bold text-gray-900 mb-3">Complete Profile</h3>
              <p className="text-gray-600 text-sm leading-relaxed">
                Build your comprehensive profile with all relevant details
              </p>
              
              {/* Step indicator */}
              <div className="absolute -top-3 left-1/2 transform -translate-x-1/2">
                <div className="bg-green-500 text-white text-xs font-bold px-3 py-1 rounded-full">
                  Step 02
                </div>
              </div>
            </motion.div>

            {/* Step 3 */}
            <motion.div
              initial={{ opacity: 0, y: 30 }}
              whileInView={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.5, delay: 0.3 }}
              className="bg-white p-8 rounded-3xl shadow-lg border border-gray-100 hover:shadow-xl transition-all duration-300 text-center relative"
            >
              <div className="w-16 h-16 bg-purple-100 rounded-2xl flex items-center justify-center mx-auto mb-6">
                <div className="w-12 h-12 bg-purple-500 rounded-xl flex items-center justify-center">
                  <Users className="w-6 h-6 text-white" />
                </div>
              </div>
              <h3 className="text-xl font-bold text-gray-900 mb-3">Smart Matching</h3>
              <p className="text-gray-600 text-sm leading-relaxed">
                Our AI connects you with the best opportunities
              </p>
              
              {/* Step indicator */}
              <div className="absolute -top-3 left-1/2 transform -translate-x-1/2">
                <div className="bg-purple-500 text-white text-xs font-bold px-3 py-1 rounded-full">
                  Step 03
                </div>
              </div>
            </motion.div>

            {/* Step 4 */}
            <motion.div
              initial={{ opacity: 0, y: 30 }}
              whileInView={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.5, delay: 0.4 }}
              className="bg-white p-8 rounded-3xl shadow-lg border border-gray-100 hover:shadow-xl transition-all duration-300 text-center relative"
            >
              <div className="w-16 h-16 bg-red-100 rounded-2xl flex items-center justify-center mx-auto mb-6">
                <div className="w-12 h-12 bg-red-500 rounded-xl flex items-center justify-center">
                  <TrendingUp className="w-6 h-6 text-white" />
                </div>
              </div>
              <h3 className="text-xl font-bold text-gray-900 mb-3">Achieve Success</h3>
              <p className="text-gray-600 text-sm leading-relaxed">
                Land your dream job, find perfect students, or build partnerships
              </p>
              
              {/* Step indicator */}
              <div className="absolute -top-3 left-1/2 transform -translate-x-1/2">
                <div className="bg-red-500 text-white text-xs font-bold px-3 py-1 rounded-full">
                  Step 04
                </div>
              </div>
            </motion.div>
          </div>
        </div>
      </section>

      {/* Save time with Automations Section */}
      <section className="py-20 bg-white">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="grid lg:grid-cols-2 gap-16 items-center">
            {/* Left side - Circular Image with decorative elements */}
            <div className="relative">
              <motion.div
                initial={{ opacity: 0, x: -50 }}
                whileInView={{ opacity: 1, x: 0 }}
                transition={{ duration: 0.8 }}
                className="relative w-full max-w-lg mx-auto h-96 flex items-center justify-center"
              >
                {/* Outer dashed circle - properly centered */}
                <div className="absolute inset-0 w-96 h-96 rounded-full border-2 border-gray-300 border-dashed mx-auto"></div>
                
                {/* Inner gradient circle with image - centered */}
                <div className="relative w-80 h-80 flex items-center justify-center">
                  <div className="w-full h-full rounded-full bg-gradient-to-br from-orange-400 via-pink-400 to-purple-500 p-1 shadow-2xl">
                    <div className="w-full h-full rounded-full overflow-hidden bg-white p-3">
                      <div className="w-full h-full rounded-full overflow-hidden">
                        <Image
                          src="/2af36fa8acaa80e0e2b028fea9915a5e0f5a2157.jpg"
                          alt="Woman using phone for automation"
                          width={320}
                          height={320}
                          className="w-full h-full object-cover"
                        />
                      </div>
                    </div>
                  </div>
                </div>

                {/* Floating decorative dots - positioned relative to the container */}
                <FloatingElement duration={4} className="absolute top-12 left-12">
                  <div className="w-4 h-4 bg-blue-500 rounded-full opacity-90 shadow-lg"></div>
                </FloatingElement>
                
                <FloatingElement duration={5} className="absolute top-16 right-8">
                  <div className="w-3 h-3 bg-pink-500 rounded-full opacity-90 shadow-lg"></div>
                </FloatingElement>
                
                <FloatingElement duration={6} className="absolute bottom-16 left-8">
                  <div className="w-4 h-4 bg-orange-500 rounded-full opacity-90 shadow-lg"></div>
                </FloatingElement>

                {/* Additional decorative dots for better balance */}
                <FloatingElement duration={7} className="absolute bottom-12 right-12">
                  <div className="w-3 h-3 bg-purple-500 rounded-full opacity-90 shadow-lg"></div>
                </FloatingElement>
              </motion.div>
            </div>

            {/* Right side - Content */}
            <div>
              <motion.div
                initial={{ opacity: 0, y: 30 }}
                whileInView={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.6 }}
                className="mb-8"
              >
                <div className="flex items-center space-x-2 mb-4">
                  <div className="w-3 h-3 bg-purple-600 rounded-full"></div>
                  <span className="text-purple-600 font-medium">Got Questions?</span>
                </div>
                
                <h2 className="text-4xl font-bold text-gray-900 mb-6">
                  Save time with <span className="text-blue-600">Automations</span>
                </h2>
                
                <div className="w-16 h-1 bg-orange-400 rounded-full mb-8"></div>

                <div className="space-y-6">
                  {/* Students Section */}
                  <motion.div
                    initial={{ opacity: 0, y: 20 }}
                    whileInView={{ opacity: 1, y: 0 }}
                    transition={{ duration: 0.5, delay: 0.1 }}
                    className="flex items-start space-x-3"
                  >
                    <div className="w-6 h-6 bg-blue-100 rounded-lg flex items-center justify-center flex-shrink-0 mt-1">
                      <Users className="w-4 h-4 text-blue-600" />
                    </div>
                    <div>
                      <h3 className="font-semibold text-gray-900 mb-1">Students</h3>
                      <p className="text-gray-600 text-sm leading-relaxed">
                        WhatsApp alerts keep you focused on what matters - CampusPe tracks everything with instant alerts and smart workflows.
                      </p>
                    </div>
                  </motion.div>

                  {/* College Section */}
                  <motion.div
                    initial={{ opacity: 0, y: 20 }}
                    whileInView={{ opacity: 1, y: 0 }}
                    transition={{ duration: 0.5, delay: 0.2 }}
                    className="flex items-start space-x-3"
                  >
                    <div className="w-6 h-6 bg-green-100 rounded-lg flex items-center justify-center flex-shrink-0 mt-1">
                      <Building2 className="w-4 h-4 text-green-600" />
                    </div>
                    <div>
                      <h3 className="font-semibold text-gray-900 mb-1">College</h3>
                      <p className="text-gray-600 text-sm leading-relaxed">
                        Streamlined admissions with lead assignment, fee tracking via unique QR codes, and real-time dashboards.
                      </p>
                    </div>
                  </motion.div>

                  {/* Companies Section */}
                  <motion.div
                    initial={{ opacity: 0, y: 20 }}
                    whileInView={{ opacity: 1, y: 0 }}
                    transition={{ duration: 0.5, delay: 0.3 }}
                    className="flex items-start space-x-3"
                  >
                    <div className="w-6 h-6 bg-purple-100 rounded-lg flex items-center justify-center flex-shrink-0 mt-1">
                      <Briefcase className="w-4 h-4 text-purple-600" />
                    </div>
                    <div>
                      <h3 className="font-semibold text-gray-900 mb-1">Companies</h3>
                      <p className="text-gray-600 text-sm leading-relaxed">
                        AI-powered matching and one-click shortlists reduce time-to-hire and costs significantly.
                      </p>
                    </div>
                  </motion.div>
                </div>
              </motion.div>
            </div>
          </div>
        </div>
      </section>

      {/* Support Section */}
      <section className="py-20 bg-gray-50">
        <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8">
          <motion.div
            initial={{ opacity: 0, y: 30 }}
            whileInView={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6 }}
            className="text-center bg-white rounded-3xl p-12 shadow-lg border border-gray-100"
          >
            <h3 className="text-3xl font-bold text-gray-900 mb-4">
              Still have questions?
            </h3>
            <p className="text-gray-600 text-lg mb-8 max-w-md mx-auto">
              Our support team is here to help you succeed. Get in touch anytime.
            </p>
            <div className="flex flex-col sm:flex-row gap-4 justify-center">
              <button className="bg-blue-600 hover:bg-blue-700 text-white px-8 py-3 rounded-xl font-semibold transition-colors duration-300">
                Contact Support
              </button>
              <button className="border-2 border-gray-300 hover:bg-gray-50 text-gray-700 px-8 py-3 rounded-xl font-semibold transition-colors duration-300">
                Schedule a Call
              </button>
            </div>
          </motion.div>
        </div>
      </section>

      {/* Call to Action Section */}
      <section className="py-20 bg-gradient-to-br from-gray-50 to-blue-50">
        <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8 text-center">
          <motion.div
            initial={{ opacity: 0, y: 30 }}
            whileInView={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.8 }}
            className="mb-12"
          >
            {/* Trust indicator */}
            <div className="flex items-center justify-center space-x-2 mb-4">
              <div className="flex items-center space-x-1">
                {[...Array(5)].map((_, i) => (
                  <div key={i} className="w-4 h-4 text-yellow-400">⭐</div>
                ))}
              </div>
              <span className="text-gray-600 text-sm">Trusted by 50,000+ users</span>
            </div>

            {/* Main heading */}
            <h2 className="text-4xl md:text-5xl font-bold text-gray-900 mb-6">
              Your Career Starts Here — <span className="text-purple-600">Don't Wait</span>
            </h2>
            
            <p className="text-gray-600 text-lg max-w-3xl mx-auto mb-8">
              Whether you're a student aiming for your dream job, a college looking to empower placements, or a 
              company hiring the next big talent — we've built the perfect platform for you.
            </p>

            {/* Action buttons */}
            <div className="flex flex-col sm:flex-row gap-4 justify-center mb-16">
              <motion.button
                whileHover={{ scale: 1.05 }}
                whileTap={{ scale: 0.95 }}
                className="bg-blue-600 hover:bg-blue-700 text-white px-8 py-4 rounded-xl font-semibold flex items-center justify-center space-x-2 transition-colors duration-300"
              >
                <span>👨‍🎓</span>
                <span>Join as a Student</span>
                <ArrowRight className="w-4 h-4" />
              </motion.button>
              
              <motion.button
                whileHover={{ scale: 1.05 }}
                whileTap={{ scale: 0.95 }}
                className="border-2 border-blue-600 text-blue-600 hover:bg-blue-50 px-8 py-4 rounded-xl font-semibold flex items-center justify-center space-x-2 transition-colors duration-300"
              >
                <span>🏫</span>
                <span>Join as a College</span>
                <ArrowRight className="w-4 h-4" />
              </motion.button>
              
              <motion.button
                whileHover={{ scale: 1.05 }}
                whileTap={{ scale: 0.95 }}
                className="border-2 border-gray-400 text-gray-700 hover:bg-gray-50 px-8 py-4 rounded-xl font-semibold flex items-center justify-center space-x-2 transition-colors duration-300"
              >
                <span>💼</span>
                <span>Join as an Employer</span>
                <ArrowRight className="w-4 h-4" />
              </motion.button>
            </div>

            {/* Stats */}
            <div className="grid grid-cols-2 md:grid-cols-4 gap-8">
              <motion.div
                initial={{ opacity: 0, y: 20 }}
                whileInView={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.5, delay: 0.1 }}
                className="text-center"
              >
                <div className="text-3xl md:text-4xl font-bold text-purple-600 mb-2">50K+</div>
                <div className="text-gray-600 text-sm font-medium">Students Placed</div>
              </motion.div>
              
              <motion.div
                initial={{ opacity: 0, y: 20 }}
                whileInView={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.5, delay: 0.2 }}
                className="text-center"
              >
                <div className="text-3xl md:text-4xl font-bold text-purple-600 mb-2">500+</div>
                <div className="text-gray-600 text-sm font-medium">Partner Colleges</div>
              </motion.div>
              
              <motion.div
                initial={{ opacity: 0, y: 20 }}
                whileInView={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.5, delay: 0.3 }}
                className="text-center"
              >
                <div className="text-3xl md:text-4xl font-bold text-purple-600 mb-2">1K+</div>
                <div className="text-gray-600 text-sm font-medium">Hiring Companies</div>
              </motion.div>
              
              <motion.div
                initial={{ opacity: 0, y: 20 }}
                whileInView={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.5, delay: 0.4 }}
                className="text-center"
              >
                <div className="text-3xl md:text-4xl font-bold text-purple-600 mb-2">95%</div>
                <div className="text-gray-600 text-sm font-medium">Success Rate</div>
              </motion.div>
            </div>
          </motion.div>
        </div>
      </section>

      <Footer />
    </>
  );
}
