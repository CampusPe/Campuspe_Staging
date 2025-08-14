'use client';

import { useEffect, useState } from 'react';
import Link from 'next/link';
import Image from 'next/image';
import Navbar from '../components/Navbar';
import Footer from '../components/Footer';

export default function Home() {
  const [isLoggedIn, setIsLoggedIn] = useState(false);

  useEffect(() => {
    const token = localStorage.getItem('token');
    setIsLoggedIn(!!token);
  }, []);

  const stats = [
    { value: '50K+', label: 'Students Placed' },
    { value: '500+', label: 'Partner Colleges' },
    { value: '1K+', label: 'Hiring Companies' },
    { value: '95%', label: 'Success Rate' }
  ];

  const features = [
    {
      icon: '🎯',
      title: 'Verified Candidates',
      description: 'Access pre-verified student profiles with comprehensive skill assessments.'
    },
    {
      icon: '⚡',
      title: 'Match Multiple Candidates Faster',
      description: 'Our AI-powered matching system finds the best candidates for your requirements.'
    },
    {
      icon: '📊',
      title: 'Real-time Analytics',
      description: 'Get detailed analytics and insights about your recruitment campaigns.'
    },
    {
      icon: '🤝',
      title: 'AI-Powered Matching',
      description: 'Advanced algorithms to match skills with job requirements perfectly.'
    }
  ];

  const courses = [
    {
      title: 'Complete React Development 2024',
      instructor: 'Sarah Mitchell',
      rating: 4.8,
      students: '24 Lessons',
      price: '$79',
      image: '/images/7b326c01bcac877a19ceacd6e8faf8bb09181288.png'
    },
    {
      title: 'Advanced Machine Learning Masterclass',
      instructor: 'Dr. Alex Chen',
      rating: 4.9,
      students: '32 Lessons',
      price: '$99',
      image: '/images/4b2dbb9454ca133be52e9d3f7d9ab87c840fb841.png'
    },
    {
      title: 'Modern UI/UX Design System',
      instructor: 'Emma Rodriguez',
      rating: 4.7,
      students: '18 Lessons',
      price: '$65',
      image: '/images/88e21d9821e24bd22f3f4cd331e57683038b99c6.png'
    },
    {
      title: 'Modern UI/UX Design System',
      instructor: 'Emma Rodriguez',
      rating: 4.7,
      students: '18 Lessons',
      price: '$65',
      image: '/images/fd93682fe6f18f4cba2ab29e72ad44c57d791012.png'
    }
  ];

  const placementFeatures = [
    {
      icon: '🤖',
      title: 'Complete Automation',
      description: 'End-to-end automated recruitment process that finds the best candidates.'
    },
    {
      icon: '🎯',
      title: 'Boost Your Online Presence',
      description: 'Enhanced digital visibility to attract top talent and improve company branding.'
    },
    {
      icon: '💼',
      title: 'Connect with Top Recruiters',
      description: 'Direct access to hiring managers from leading companies across industries.'
    },
    {
      icon: '💻',
      title: 'Virtual Placement Drives',
      description: 'Seamless virtual placement sessions with real-time candidate evaluations.'
    }
  ];

  return (
    <>
      <Navbar />
      
      {/* Hero Section */}
      <section className="bg-gradient-to-br from-blue-50 via-white to-green-50 min-h-screen flex items-center">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 grid lg:grid-cols-2 gap-12 items-center">
          <div className="space-y-8">
            <div className="space-y-4">
              <h1 className="text-5xl lg:text-6xl font-bold text-gray-900 leading-tight">
                Connecting Talent, Campuses
                <br />
                <span className="text-transparent bg-clip-text bg-gradient-to-r from-green-400 to-blue-600">
                  & Companies — Smarter, Faster, Better
                </span>
              </h1>
              <p className="text-xl text-gray-600 max-w-2xl">
                CampusPe is an innovative platform that transforms students into job-ready 
                professionals, empowers colleges with digital placements, and helps 
                employers hire top talent more quickly.
              </p>
            </div>
            
            <div className="flex flex-wrap gap-4">
              <button className="bg-blue-600 text-white px-8 py-4 rounded-lg text-lg font-semibold hover:bg-blue-700 transition-all duration-200 shadow-lg">
                Campus Placements
              </button>
              <button className="border-2 border-blue-600 text-blue-600 px-8 py-4 rounded-lg text-lg font-semibold hover:bg-blue-50 transition-all duration-200">
                Start Hiring
              </button>
            </div>

            <div className="flex items-center space-x-8 text-sm text-gray-600">
              <div className="flex items-center space-x-2">
                <span className="text-2xl">📍</span>
                <span>500+ Colleges</span>
              </div>
              <div className="flex items-center space-x-2">
                <span className="text-2xl">🎓</span>
                <span>50K+ Students Placed</span>
              </div>
            </div>
            
            <button className="text-blue-600 font-medium hover:text-blue-700 transition-colors">
              Explore Now →
            </button>
          </div>
          
          <div className="relative">
            <div className="relative bg-gradient-to-br from-blue-100 to-green-100 rounded-full p-8 shadow-2xl">
              <img
                src="./fd93682fe6f18f4cba2ab29e72ad44c57d791012.png"
                alt="Professional woman pointing"
                width={500}
                height={500}
                className="rounded-full"
         
              />
              
              {/* Floating stats */}
              <div className="absolute top-4 right-4 bg-white rounded-lg p-3 shadow-lg">
                <div className="text-center">
                  <div className="text-2xl font-bold text-blue-600">500K+</div>
                  <div className="text-xs text-gray-600">Active Students</div>
                </div>
              </div>
              
              <div className="absolute top-1/3 -left-4 bg-white rounded-lg p-3 shadow-lg">
                <div className="text-center">
                  <div className="text-2xl font-bold text-green-600">2K+</div>
                  <div className="text-xs text-gray-600">Partner Companies</div>
                </div>
              </div>
              
              <div className="absolute bottom-12 -right-8 bg-white rounded-lg p-3 shadow-lg">
                <div className="text-center">
                  <div className="text-2xl font-bold text-purple-600">250+</div>
                  <div className="text-xs text-gray-600">Courses Available</div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Featured Courses Section */}
      <section className="py-20 bg-white">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center mb-16">
            <div className="inline-block bg-purple-100 text-purple-600 px-4 py-2 rounded-full text-sm font-medium mb-4">
              ★ Featured Courses
            </div>
            <h2 className="text-4xl font-bold text-gray-900 mb-4">
              Start Learning <span className="text-transparent bg-clip-text bg-gradient-to-r from-blue-600 to-purple-600">Today</span>
            </h2>
            <p className="text-xl text-gray-600 max-w-3xl mx-auto">
              Join thousands of students in our most popular courses, designed by industry experts.
            </p>
          </div>
          
          <div className="grid md:grid-cols-2 lg:grid-cols-4 gap-8">
            {courses.map((course, index) => (
              <div key={index} className="bg-white rounded-xl shadow-lg overflow-hidden hover:shadow-2xl transition-all duration-300 transform hover:-translate-y-2">
                <div className="relative h-48 bg-gradient-to-br from-blue-50 to-purple-50">
                  <Image
                    src={course.image}
                    alt={course.title}
                    fill
                    className="object-cover"
                  />
                </div>
                <div className="p-6">
                  <div className="flex items-center justify-between mb-2">
                    <span className="text-sm text-gray-500">{course.instructor}</span>
                    <div className="flex items-center space-x-1">
                      <span className="text-yellow-400">★</span>
                      <span className="text-sm font-medium">{course.rating}</span>
                    </div>
                  </div>
                  <h3 className="font-semibold text-gray-900 mb-2">{course.title}</h3>
                  <div className="flex items-center justify-between">
                    <span className="text-sm text-gray-500">{course.students}</span>
                    <span className="text-lg font-bold text-blue-600">{course.price}</span>
                  </div>
                  <button className="w-full mt-4 bg-blue-600 text-white py-2 rounded-lg hover:bg-blue-700 transition-colors">
                    Enroll Now
                  </button>
                </div>
              </div>
            ))}
          </div>
          
          <div className="text-center mt-12">
            <div className="inline-flex items-center space-x-2 text-blue-600 hover:text-blue-700 transition-colors cursor-pointer">
              <span className="text-2xl">📚</span>
              <span className="font-medium">300+ More Courses Available</span>
            </div>
            <p className="text-gray-600 mt-2">
              Explore our complete library of courses across development, design, AI, marketing, and more.
            </p>
            <div className="flex justify-center space-x-4 mt-6">
              <button className="bg-blue-600 text-white px-6 py-3 rounded-lg hover:bg-blue-700 transition-colors">
                Browse All Courses
              </button>
              <button className="border border-gray-300 text-gray-700 px-6 py-3 rounded-lg hover:bg-gray-50 transition-colors">
                Get Course Recommendations
              </button>
            </div>
          </div>
        </div>
      </section>

      {/* Students Section */}
      <section className="py-20 bg-gradient-to-br from-blue-50 to-green-50">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="grid lg:grid-cols-2 gap-16 items-center">
            <div>
              <div className="inline-block bg-green-100 text-green-600 px-4 py-2 rounded-full text-sm font-medium mb-4">
                🎓 For Students
              </div>
              <h2 className="text-4xl font-bold text-gray-900 mb-6">
                Launch Your Career <span className="text-transparent bg-clip-text bg-gradient-to-r from-green-400 to-blue-600">with Confidence</span>
              </h2>
              <p className="text-xl text-gray-600 mb-8">
                Everything you need to transform from a student into a successful professional.
              </p>
              
              <div className="space-y-6">
                <div className="flex items-start space-x-4">
                  <div className="flex-shrink-0 w-8 h-8 bg-blue-100 rounded-full flex items-center justify-center">
                    <span className="text-blue-600 font-bold">A</span>
                  </div>
                  <div>
                    <h3 className="font-semibold text-gray-900">Discover Colleges</h3>
                    <p className="text-gray-600">Explore top colleges and universities.</p>
                  </div>
                </div>
                
                <div className="flex items-start space-x-4">
                  <div className="flex-shrink-0 w-8 h-8 bg-green-100 rounded-full flex items-center justify-center">
                    <span className="text-green-600 font-bold">B</span>
                  </div>
                  <div>
                    <h3 className="font-semibold text-gray-900">Pay Fees Securely</h3>
                    <p className="text-gray-600">Safe and secure payment options.</p>
                  </div>
                </div>
                
                <div className="flex items-start space-x-4">
                  <div className="flex-shrink-0 w-8 h-8 bg-blue-100 rounded-full flex items-center justify-center">
                    <span className="text-blue-600 font-bold">C</span>
                  </div>
                  <div>
                    <h3 className="font-semibold text-gray-900">Discover Colleges</h3>
                    <p className="text-gray-600">Create a perfect student profile.</p>
                  </div>
                </div>
              </div>
              
              <button className="mt-8 bg-blue-600 text-white px-8 py-4 rounded-lg text-lg font-semibold hover:bg-blue-700 transition-colors">
                Get Started as a Free
              </button>
              <p className="text-sm text-gray-500 mt-2">No credit card required • 100% students</p>
            </div>
            
            <div className="relative">
              <div className="bg-white rounded-2xl p-8 shadow-2xl">
                <img
                  src="./88e21d9821e24bd22f3f4cd331e57683038b99c6.png"
                  alt="Students collaborating"
                  width={500}
                  height={300}
                  className="rounded-lg w-full"
                />
                
                {/* Course Completion Certificate */}
                <div className="absolute top-4 right-4 bg-green-500 text-white px-3 py-1 rounded-full text-sm font-medium">
                  ✓ Course Completion Certificate Earned
                </div>
                
                {/* Community Support */}
                <div className="absolute bottom-4 left-4 bg-blue-500 text-white px-3 py-1 rounded-full text-sm font-medium flex items-center space-x-2">
                  <span>👥</span>
                  <span>Community Support Always Available</span>
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Employers Section */}
      <section className="py-20 bg-white">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="grid lg:grid-cols-2 gap-16 items-center">
            <div className="relative order-2 lg:order-1">
              <div className="bg-gradient-to-br from-purple-50 to-blue-50 rounded-2xl p-8 shadow-2xl">
                <img
                  src="./e81b6bf004478a3cb7bd4cf9b243743b4d5d2d52.jpg"
                  alt="Professional team meeting"
                  width={500}
                  height={300}
                  className="rounded-lg w-full"
                />
                
                {/* Join our team badge */}
                <div className="absolute top-4 right-4 bg-green-500 text-white px-3 py-1 rounded-full text-sm font-medium">
                  ✓ Join our team, bring possibilities!
                </div>
                
                {/* Community Support */}
                <div className="absolute bottom-4 left-4 bg-blue-500 text-white px-3 py-1 rounded-full text-sm font-medium flex items-center space-x-2">
                  <span>👥</span>
                  <span>Community Support Always Available</span>
                </div>
              </div>
            </div>
            
            <div className="order-1 lg:order-2">
              <div className="inline-block bg-purple-100 text-purple-600 px-4 py-2 rounded-full text-sm font-medium mb-4">
                🏢 For Employers
              </div>
              <h2 className="text-4xl font-bold text-gray-900 mb-6">
                Hire the Right <span className="text-transparent bg-clip-text bg-gradient-to-r from-purple-600 to-blue-600">Talent, Faster</span>
              </h2>
              <p className="text-xl text-gray-600 mb-8">
                Connect with top talent from leading colleges and accelerate your hiring process.
              </p>
              
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-6 mb-8">
                {features.map((feature, index) => (
                  <div key={index} className="flex items-start space-x-3">
                    <div className="flex-shrink-0 w-10 h-10 bg-gradient-to-br from-purple-100 to-blue-100 rounded-lg flex items-center justify-center text-lg">
                      {feature.icon}
                    </div>
                    <div>
                      <h3 className="font-semibold text-gray-900 mb-1">{feature.title}</h3>
                      <p className="text-sm text-gray-600">{feature.description}</p>
                    </div>
                  </div>
                ))}
              </div>
              
              <button className="bg-purple-600 text-white px-8 py-4 rounded-lg text-lg font-semibold hover:bg-purple-700 transition-colors">
                Start Hiring Today
              </button>
              <p className="text-sm text-gray-500 mt-2">Free 30-day trial • No credit card • 10+ days free</p>
            </div>
          </div>
        </div>
      </section>

      {/* Placement Section */}
      <section className="py-20 bg-gradient-to-br from-green-50 to-blue-50">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center mb-16">
            <div className="inline-block bg-green-100 text-green-600 px-4 py-2 rounded-full text-sm font-medium mb-4">
              💼 For Colleges
            </div>
            <h2 className="text-4xl font-bold text-gray-900 mb-4">
              Your Placement Cell, <span className="text-transparent bg-clip-text bg-gradient-to-r from-green-400 to-blue-600">Now 100% Digital</span>
            </h2>
            <p className="text-xl text-gray-600 max-w-3xl mx-auto">
              Streamline your placement process and enhance student outcomes with powerful automation.
            </p>
          </div>
          
          <div className="grid lg:grid-cols-2 gap-16 items-center">
            <div className="relative">
              <div className="w-80 h-80 mx-auto bg-gradient-to-br from-pink-200 via-purple-200 to-blue-200 rounded-full flex items-center justify-center shadow-2xl">
                <img
                  src="./be531b68118296421962ec0af9482838a102bed0.png"
                  alt="Professional woman giving thumbs up"
                  width={300}
                  height={300}
                  className="rounded-full"
                />
              </div>
              
              {/* Floating elements */}
              <div className="absolute top-8 left-8 bg-orange-500 text-white w-16 h-16 rounded-lg flex items-center justify-center text-2xl transform rotate-12">
                🎯
              </div>
              <div className="absolute top-16 right-8 bg-blue-500 text-white w-12 h-12 rounded-full flex items-center justify-center text-xl transform -rotate-12">
                📊
              </div>
              <div className="absolute bottom-16 left-16 bg-green-500 text-white w-14 h-14 rounded-lg flex items-center justify-center text-xl transform rotate-45">
                ⚡
              </div>
              <div className="absolute bottom-8 right-16 bg-purple-500 text-white w-10 h-10 rounded-full flex items-center justify-center text-lg transform -rotate-45">
                💻
              </div>
            </div>
            
            <div className="grid grid-cols-1 gap-6">
              {placementFeatures.map((feature, index) => (
                <div key={index} className="bg-white rounded-xl p-6 shadow-lg hover:shadow-xl transition-all duration-300">
                  <div className="flex items-center space-x-4">
                    <div className="flex-shrink-0 w-12 h-12 bg-gradient-to-br from-green-100 to-blue-100 rounded-lg flex items-center justify-center text-xl">
                      {feature.icon}
                    </div>
                    <div>
                      <h3 className="font-semibold text-gray-900 mb-1">{feature.title}</h3>
                      <p className="text-gray-600">{feature.description}</p>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </div>
          
          <div className="text-center mt-12">
            <button className="bg-green-600 text-white px-8 py-4 rounded-lg text-lg font-semibold hover:bg-green-700 transition-colors">
              Get started as a Free
            </button>
            <p className="text-sm text-gray-500 mt-2">No credit card required • 100% colleges online</p>
          </div>
        </div>
      </section>

      {/* Automation Section */}
      <section className="py-20 bg-white">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="grid lg:grid-cols-2 gap-16 items-center">
            <div>
              <h2 className="text-4xl font-bold text-gray-900 mb-6">
                Save time with <span className="text-transparent bg-clip-text bg-gradient-to-r from-blue-600 to-green-600">Automations</span>
              </h2>
              <p className="text-xl text-gray-600 mb-8">
                Automate the repetitive work in seconds so you can avoid human error and focus on what matters. It gives the impression of software that is highly automated which implies that it is good for client far who want to save time and manage team members easily.
              </p>
            </div>
            
            <div className="relative">
              <div className="w-80 h-80 mx-auto bg-gradient-to-br from-orange-100 to-yellow-100 rounded-full flex items-center justify-center shadow-2xl">
                <img
                  src="./be531b68118296421962ec0af9482838a102bed0.png"
                  alt="Professional using automation"
                  width={300}
                  height={300}
                  className="rounded-full"
                />
              </div>
              
              {/* Floating automation elements */}
              <div className="absolute top-4 right-4 bg-orange-500 text-white w-6 h-6 rounded-full"></div>
              <div className="absolute bottom-8 left-8 bg-pink-500 text-white w-4 h-4 rounded-full"></div>
              <div className="absolute top-1/2 -right-4 bg-blue-500 text-white w-8 h-8 rounded-full"></div>
            </div>
          </div>
        </div>
      </section>

      {/* FAQ Section */}
      <section className="py-20 bg-gradient-to-br from-blue-50 to-purple-50">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="grid lg:grid-cols-2 gap-16 items-start">
            <div>
              <div className="inline-block bg-blue-100 text-blue-600 px-4 py-2 rounded-full text-sm font-medium mb-4">
                ❓ Get Guidance
              </div>
              <h2 className="text-4xl font-bold text-gray-900 mb-6">
                Frequently Asked <span className="text-transparent bg-clip-text bg-gradient-to-r from-blue-600 to-purple-600">Questions</span>
              </h2>
              <p className="text-xl text-gray-600 mb-8">
                Everything you need to know about EduFlow. Can't find what you're looking for? Contact our support team.
              </p>
              
              <div className="space-y-4">
                {[
                  "What makes EduFlow different from other learning platforms?",
                  "Do I get lifetime access to the courses?",
                  "What level of support do I get as a student?",
                  "Are the certificates recognized by employers?",
                  "Can I get a refund if I'm not satisfied?",
                  "What if I'm a complete beginner?",
                  "How much time do I need to commit to learning?",
                  "Do you offer team or corporate training?"
                ].map((question, index) => (
                  <div key={index} className="border border-gray-200 rounded-lg p-4 bg-white hover:shadow-md transition-shadow cursor-pointer">
                    <div className="flex items-center justify-between">
                      <span className="font-medium text-gray-900">{question}</span>
                      <span className="text-gray-400">+</span>
                    </div>
                  </div>
                ))}
              </div>
              
              <div className="mt-8 text-center">
                <h3 className="text-xl font-semibold text-gray-900 mb-4">Still have questions?</h3>
                <p className="text-gray-600 mb-6">Our support team is here to help you succeed. Get in touch anytime.</p>
                <div className="flex justify-center space-x-4">
                  <button className="bg-blue-600 text-white px-6 py-3 rounded-lg hover:bg-blue-700 transition-colors">
                    Contact Support
                  </button>
                  <button className="border border-gray-300 text-gray-700 px-6 py-3 rounded-lg hover:bg-gray-50 transition-colors">
                    Schedule a Call
                  </button>
                </div>
              </div>
            </div>
            
            <div className="relative">
              <div className="bg-gradient-to-br from-yellow-100 to-orange-100 rounded-2xl p-8 shadow-2xl">
                <img
                  src="./2af36fa8acaa80e0e2b028fea9915a5e0f5a2157.jpg"
                  alt="Support representative"
                  width={400}
                  height={300}
                  className="rounded-lg w-full"
                />
                
                <div className="absolute top-4 right-4 bg-white rounded-lg p-3 shadow-lg">
                  <div className="text-center">
                    <div className="text-sm font-medium text-gray-900">"We ensure that any information you</div>
                    <div className="text-sm font-medium text-gray-900">need is served immediately by</div>
                    <div className="text-sm font-medium text-gray-900">simply contacting our team"</div>
                    <div className="text-xs text-gray-500 mt-2">Sara Feminmore</div>
                    <div className="text-xs text-gray-400">Head of CS</div>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* CTA Section */}
      <section className="py-20 bg-gray-900">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 text-center">
          <div className="inline-block bg-yellow-400 text-gray-900 px-4 py-2 rounded-full text-sm font-medium mb-6">
            ⭐⭐⭐⭐⭐ Trusted by 50,000+ users
          </div>
          <h2 className="text-4xl lg:text-5xl font-bold text-white mb-6">
            Your Career Starts Here — <span className="text-transparent bg-clip-text bg-gradient-to-r from-blue-400 to-green-400">Don't Wait</span>
          </h2>
          <p className="text-xl text-gray-300 mb-12 max-w-3xl mx-auto">
            Whether you're a student aiming for your dream job, a college looking to empower placements, or a 
            company hiring the next big talent — we've built the perfect platform for you.
          </p>
          
          <div className="flex flex-wrap justify-center gap-6 mb-16">
            <button className="bg-blue-600 text-white px-8 py-4 rounded-lg text-lg font-semibold hover:bg-blue-700 transition-colors">
              👨‍🎓 Join as a Student
            </button>
            <button className="bg-green-600 text-white px-8 py-4 rounded-lg text-lg font-semibold hover:bg-green-700 transition-colors">
              🎓 Join as a College
            </button>
            <button className="bg-purple-600 text-white px-8 py-4 rounded-lg text-lg font-semibold hover:bg-purple-700 transition-colors">
              🏢 Join as an Employer
            </button>
          </div>
          
          <div className="grid grid-cols-2 md:grid-cols-4 gap-8 text-center">
            {stats.map((stat, index) => (
              <div key={index} className="text-white">
                <div className="text-3xl font-bold mb-2">{stat.value}</div>
                <div className="text-gray-400">{stat.label}</div>
              </div>
            ))}
          </div>
        </div>
      </section>

      <Footer />
    </>
  );
}
