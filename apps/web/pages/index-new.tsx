'use client';

import { useEffect, useState } from 'react';
import Link from 'next/link';
import Image from 'next/image';
import { motion } from 'framer-motion';
import { 
  Star, 
  ArrowRight, 
  PlayCircle, 
  CheckCircle, 
  Users, 
  Building2, 
  GraduationCap,
  TrendingUp,
  Zap,
  Heart,
  Award,
  ChevronDown,
  Plus
} from 'lucide-react';

import Navbar from '../components/Navbar';
import Footer from '../components/Footer';
import { Button } from '../components/ui/Button';
import { Card, CardContent } from '../components/ui/Card';
import { 
  MotionCard, 
  FloatingElement, 
  FadeInView, 
  StaggerContainer, 
  StaggerItem 
} from '../components/ui/MotionComponents';

export default function Home() {
  const [isLoggedIn, setIsLoggedIn] = useState(false);

  useEffect(() => {
    const token = localStorage.getItem('token');
    setIsLoggedIn(!!token);
  }, []);

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

  const collegeFeatures = [
    {
      icon: '🌟',
      title: 'Boost your online presence',
      description: 'Connecting lakhs of students with a single click'
    },
    {
      icon: '🤝',
      title: 'Connect with top company recruiters',
      description: 'College placements made easy'
    },
    {
      icon: '👥',
      title: 'Get fresh and best talents for your colleges',
      description: 'connect with 100000+ students in one go'
    }
  ];

  const companyFeatures = [
    {
      icon: '💼',
      title: 'Hire fresh talents',
      description: 'Reach to correct audience'
    },
    {
      icon: '🎯',
      title: 'Reach to multiple candidates in one click',
      description: 'Apply to multiple college through one single application'
    },
    {
      icon: '📊',
      title: 'Manage each application',
      description: 'Use dashboard to track the application'
    }
  ];

  const faqItems = [
    "What makes CampusPe different from other learning platforms?",
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
      <section className="min-h-screen bg-gradient-to-br from-blue-50 via-white to-purple-50 pt-16 overflow-hidden relative">
        {/* Background Elements */}
        <div className="absolute inset-0 overflow-hidden">
          <FloatingElement className="absolute top-20 left-10" duration={4}>
            <div className="w-4 h-4 bg-blue-400 rounded-full"></div>
          </FloatingElement>
          <FloatingElement className="absolute top-40 right-20" duration={3}>
            <div className="w-6 h-6 bg-green-400 rounded-full"></div>
          </FloatingElement>
          <FloatingElement className="absolute bottom-40 left-20" duration={5}>
            <div className="w-3 h-3 bg-pink-400 rounded-full"></div>
          </FloatingElement>
          <FloatingElement className="absolute bottom-20 right-10" duration={3.5}>
            <div className="w-5 h-5 bg-yellow-400 rounded-full"></div>
          </FloatingElement>
          <FloatingElement className="absolute top-1/2 left-1/4" duration={4.5}>
            <div className="w-2 h-2 bg-purple-400 rounded-full"></div>
          </FloatingElement>
        </div>

        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-16 sm:py-20 lg:py-24">
          <div className="grid lg:grid-cols-2 gap-12 items-center">
            {/* Hero Content */}
            <motion.div 
              initial={{ opacity: 0, x: -50 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ duration: 0.8, ease: "easeOut" }}
              className="space-y-8 z-10 relative"
            >
              <div className="inline-flex items-center space-x-2 bg-blue-100 text-blue-700 px-4 py-2 rounded-full text-sm font-medium">
                <Star className="w-4 h-4" />
                <span>Admission & Placements-Made Simple on WhatsApp</span>
              </div>

              <h1 className="text-4xl md:text-5xl lg:text-6xl font-bold text-gray-900 leading-tight">
                Your AI-Powered{' '}
                <span className="bg-gradient-to-r from-primary-600 to-secondary-600 bg-clip-text text-transparent">Education</span>{' '}
                Journey
              </h1>

              <p className="text-xl text-gray-600 max-w-2xl leading-relaxed">
                From college admissions to fee payments, connecting with officials, and placements - everything happens on WhatsApp, 
                with instant alerts to keep you updated.
              </p>

              <div className="flex flex-col sm:flex-row gap-4">
                <Button variant="gradient" size="xl" className="group">
                  Get Started
                  <ArrowRight className="w-5 h-5 ml-2 group-hover:translate-x-1 transition-transform" />
                </Button>
                <Button variant="outline" size="xl" className="group">
                  <PlayCircle className="w-5 h-5 mr-2" />
                  Watch Demo
                </Button>
              </div>

              <div className="flex items-center space-x-8 text-gray-600">
                <div className="flex items-center space-x-2">
                  <span className="text-2xl">🏫</span>
                  <span className="text-sm font-medium">1200+ Colleges</span>
                </div>
                <div className="flex items-center space-x-2">
                  <span className="text-2xl">💼</span>
                  <span className="text-sm font-medium">15,000+ Opportunities</span>
                </div>
              </div>
            </motion.div>

            {/* Hero Visual */}
            <motion.div 
              initial={{ opacity: 0, x: 50 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ duration: 0.8, delay: 0.2, ease: "easeOut" }}
              className="relative z-10"
            >
              <div className="relative">
                {/* Main Image Container */}
                <div className="relative bg-gradient-to-br from-blue-100 to-purple-100 rounded-full p-8 shadow-2xl">
                  <div className="grid grid-cols-2 gap-6">
                    {/* Students Images */}
                    <div className="space-y-4">
                      <FloatingElement duration={3}>
                        <div className="w-32 h-32 rounded-full overflow-hidden shadow-lg">
                          <Image
                            src="/88e21d9821e24bd22f3f4cd331e57683038b99c6.png"
                            alt="Student"
                            width={128}
                            height={128}
                            className="w-full h-full object-cover"
                          />
                        </div>
                      </FloatingElement>
                      <FloatingElement duration={4}>
                        <div className="w-24 h-24 rounded-full overflow-hidden shadow-lg ml-8">
                          <Image
                            src="/fd93682fe6f18f4cba2ab29e72ad44c57d791012.png"
                            alt="Professional"
                            width={96}
                            height={96}
                            className="w-full h-full object-cover"
                          />
                        </div>
                      </FloatingElement>
                    </div>
                    
                    <div className="space-y-4 pt-8">
                      <FloatingElement duration={3.5}>
                        <div className="w-28 h-28 rounded-full overflow-hidden shadow-lg">
                          <Image
                            src="/be531b68118296421962ec0af9482838a102bed0.png"
                            alt="Graduate"
                            width={112}
                            height={112}
                            className="w-full h-full object-cover"
                          />
                        </div>
                      </FloatingElement>
                      <FloatingElement duration={2.5}>
                        <div className="w-20 h-20 rounded-full overflow-hidden shadow-lg">
                          <Image
                            src="/7b326c01bcac877a19ceacd6e8faf8bb09181288.png"
                            alt="Student"
                            width={80}
                            height={80}
                            className="w-full h-full object-cover"
                          />
                        </div>
                      </FloatingElement>
                    </div>
                  </div>

                  {/* Floating Stats */}
                  <FloatingElement className="absolute -top-4 -right-4">
                    <Card className="p-4 bg-white shadow-lg">
                      <div className="text-center">
                        <div className="text-2xl font-bold text-blue-600">500K+</div>
                        <div className="text-xs text-gray-600">Students Placed</div>
                      </div>
                    </Card>
                  </FloatingElement>

                  <FloatingElement className="absolute -bottom-4 -left-4" duration={4}>
                    <Card className="p-4 bg-white shadow-lg">
                      <div className="text-center">
                        <div className="text-2xl font-bold text-green-600">95%</div>
                        <div className="text-xs text-gray-600">Success Rate</div>
                      </div>
                    </Card>
                  </FloatingElement>
                </div>
              </div>
            </motion.div>
          </div>
        </div>
      </section>

      {/* Process Section */}
      <section className="py-16 sm:py-20 lg:py-24 bg-white">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <FadeInView className="text-center mb-16">
            <div className="inline-block bg-blue-100 text-blue-600 px-4 py-2 rounded-full text-sm font-medium mb-4">
              ⭐ Process
            </div>
            <h2 className="text-4xl md:text-5xl font-bold text-gray-900 mb-4">
              How CampusPe <span className="bg-gradient-to-r from-primary-600 to-secondary-600 bg-clip-text text-transparent">Platform Works</span>
            </h2>
            <p className="text-xl text-gray-600 max-w-3xl mx-auto">
              Simple steps to connect talent with opportunity
            </p>
          </FadeInView>

          <StaggerContainer className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-8">
            {processSteps.map((step, index) => (
              <StaggerItem key={index}>
                <MotionCard className="relative h-full p-8 text-center group" hover={true}>
                  <div className={`w-16 h-16 mx-auto mb-6 rounded-full bg-gradient-to-r ${step.color} flex items-center justify-center text-2xl`}>
                    {step.icon}
                  </div>
                  <div className="absolute top-4 right-4 text-sm font-bold text-gray-300 group-hover:text-gray-400 transition-colors">
                    {step.step}
                  </div>
                  <h3 className="text-xl font-semibold text-gray-900 mb-4">{step.title}</h3>
                  <p className="text-gray-600">{step.description}</p>
                </MotionCard>
              </StaggerItem>
            ))}
          </StaggerContainer>
        </div>
      </section>

      {/* Stats Section */}
      <section className="py-16 sm:py-20 lg:py-24 bg-gradient-to-r from-primary-600 to-secondary-600">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <StaggerContainer className="grid grid-cols-2 lg:grid-cols-4 gap-8 text-center text-white">
            {stats.map((stat, index) => {
              const Icon = stat.icon;
              return (
                <StaggerItem key={index}>
                  <div className="space-y-4">
                    <Icon className="w-12 h-12 mx-auto opacity-80" />
                    <div className="text-4xl font-bold">{stat.value}</div>
                    <div className="text-lg opacity-90">{stat.label}</div>
                  </div>
                </StaggerItem>
              );
            })}
          </StaggerContainer>
        </div>
      </section>

      {/* Colleges Section */}
      <section className="py-16 sm:py-20 lg:py-24 bg-gradient-to-br from-blue-50 to-purple-50">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="grid lg:grid-cols-2 gap-16 items-center">
            <motion.div
              initial={{ opacity: 0, x: -50 }}
              whileInView={{ opacity: 1, x: 0 }}
              viewport={{ once: true }}
              transition={{ duration: 0.8 }}
            >
              <div className="grid grid-cols-2 gap-4">
                <FloatingElement duration={3}>
                  <div className="aspect-square rounded-xl overflow-hidden shadow-lg">
                    <Image
                      src="/88e21d9821e24bd22f3f4cd331e57683038b99c6.png"
                      alt="College campus"
                      width={300}
                      height={300}
                      className="w-full h-full object-cover"
                    />
                  </div>
                </FloatingElement>
                <FloatingElement duration={4} className="pt-8">
                  <div className="aspect-square rounded-xl overflow-hidden shadow-lg">
                    <Image
                      src="/e81b6bf004478a3cb7bd4cf9b243743b4d5d2d52.jpg"
                      alt="Students"
                      width={300}
                      height={300}
                      className="w-full h-full object-cover"
                    />
                  </div>
                </FloatingElement>
              </div>
            </motion.div>

            <FadeInView className="space-y-8">
              <div>
                <div className="inline-block bg-blue-100 text-blue-600 px-4 py-2 rounded-full text-sm font-medium mb-4">
                  🏫 Colleges
                </div>
                <h2 className="text-4xl font-bold text-gray-900 mb-6">
                  Colleges
                </h2>
              </div>

              <div className="space-y-6">
                {collegeFeatures.map((feature, index) => (
                  <MotionCard key={index} className="p-6" delay={index * 0.1}>
                    <div className="flex items-start space-x-4">
                      <div className="w-12 h-12 bg-blue-100 rounded-lg flex items-center justify-center text-xl flex-shrink-0">
                        {feature.icon}
                      </div>
                      <div>
                        <h3 className="text-lg font-semibold text-gray-900 mb-2">{feature.title}</h3>
                        <p className="text-gray-600">{feature.description}</p>
                      </div>
                    </div>
                  </MotionCard>
                ))}
              </div>
            </FadeInView>
          </div>
        </div>
      </section>

      {/* Companies Section */}
      <section className="py-16 sm:py-20 lg:py-24 bg-white">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="grid lg:grid-cols-2 gap-16 items-center">
            <FadeInView className="order-2 lg:order-1 space-y-8">
              <div>
                <div className="inline-block bg-purple-100 text-purple-600 px-4 py-2 rounded-full text-sm font-medium mb-4">
                  🏢 Companies
                </div>
                <h2 className="text-4xl font-bold text-gray-900 mb-6">
                  Companies
                </h2>
              </div>

              <div className="space-y-6">
                {companyFeatures.map((feature, index) => (
                  <MotionCard key={index} className="p-6" delay={index * 0.1}>
                    <div className="flex items-start space-x-4">
                      <div className="w-12 h-12 bg-purple-100 rounded-lg flex items-center justify-center text-xl flex-shrink-0">
                        {feature.icon}
                      </div>
                      <div>
                        <h3 className="text-lg font-semibold text-gray-900 mb-2">{feature.title}</h3>
                        <p className="text-gray-600">{feature.description}</p>
                      </div>
                    </div>
                  </MotionCard>
                ))}
              </div>
            </FadeInView>

            <motion.div
              initial={{ opacity: 0, x: 50 }}
              whileInView={{ opacity: 1, x: 0 }}
              viewport={{ once: true }}
              transition={{ duration: 0.8 }}
              className="order-1 lg:order-2"
            >
              <FloatingElement duration={3.5}>
                <div className="aspect-[4/3] rounded-xl overflow-hidden shadow-2xl">
                  <Image
                    src="/e81b6bf004478a3cb7bd4cf9b243743b4d5d2d52.jpg"
                    alt="Corporate meeting"
                    width={500}
                    height={375}
                    className="w-full h-full object-cover"
                  />
                </div>
              </FloatingElement>
            </motion.div>
          </div>
        </div>
      </section>

      {/* Automation Section */}
      <section className="py-16 sm:py-20 lg:py-24 bg-gradient-to-br from-orange-50 to-yellow-50">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="grid lg:grid-cols-2 gap-16 items-center">
            <FadeInView className="space-y-8">
              <h2 className="text-4xl font-bold text-gray-900">
                Save time with <span className="bg-gradient-to-r from-primary-600 to-secondary-600 bg-clip-text text-transparent">Automations</span>
              </h2>
              <p className="text-xl text-gray-600 leading-relaxed">
                Automate the repetitive work in seconds so you can avoid human error and focus on what matters. 
                It gives the impression of software that its highly automated which implies that it is good for 
                client far who want to save time and manage team members easily.
              </p>
            </FadeInView>

            <motion.div
              initial={{ opacity: 0, scale: 0.8 }}
              whileInView={{ opacity: 1, scale: 1 }}
              viewport={{ once: true }}
              transition={{ duration: 0.8 }}
              className="relative"
            >
              <FloatingElement duration={3}>
                <div className="w-80 h-80 mx-auto bg-gradient-to-br from-orange-100 to-yellow-100 rounded-full flex items-center justify-center shadow-2xl">
                  <div className="w-64 h-64 rounded-full overflow-hidden">
                    <Image
                      src="/be531b68118296421962ec0af9482838a102bed0.png"
                      alt="Automation illustration"
                      width={256}
                      height={256}
                      className="w-full h-full object-cover"
                    />
                  </div>
                </div>
              </FloatingElement>

              {/* Floating decoration */}
              <FloatingElement className="absolute top-4 right-4" duration={4}>
                <div className="w-6 h-6 bg-orange-500 rounded-full"></div>
              </FloatingElement>
              <FloatingElement className="absolute bottom-8 left-8" duration={3.5}>
                <div className="w-4 h-4 bg-pink-500 rounded-full"></div>
              </FloatingElement>
              <FloatingElement className="absolute top-1/2 -right-4" duration={5}>
                <div className="w-8 h-8 bg-blue-500 rounded-full"></div>
              </FloatingElement>
            </motion.div>
          </div>
        </div>
      </section>

      {/* FAQ Section */}
      <section className="py-16 sm:py-20 lg:py-24 bg-gradient-to-br from-blue-50 to-purple-50">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="grid lg:grid-cols-2 gap-16 items-start">
            <FadeInView>
              <div className="inline-block bg-blue-100 text-blue-600 px-4 py-2 rounded-full text-sm font-medium mb-4">
                ❓ Get Guidance
              </div>
              <h2 className="text-4xl font-bold text-gray-900 mb-6">
                Frequently Asked <span className="bg-gradient-to-r from-primary-600 to-secondary-600 bg-clip-text text-transparent">Questions</span>
              </h2>
              <p className="text-xl text-gray-600 mb-8">
                Everything you need to know about CampusPe. Can't find what you're looking for? Contact our support team.
              </p>
              
              <div className="space-y-4">
                {faqItems.map((question, index) => (
                  <MotionCard key={index} className="p-4 cursor-pointer hover:shadow-md transition-shadow" delay={index * 0.1}>
                    <div className="flex items-center justify-between">
                      <span className="font-medium text-gray-900">{question}</span>
                      <Plus className="w-5 h-5 text-gray-400" />
                    </div>
                  </MotionCard>
                ))}
              </div>
              
              <div className="mt-8 text-center">
                <h3 className="text-xl font-semibold text-gray-900 mb-4">Still have questions?</h3>
                <p className="text-gray-600 mb-6">Our support team is here to help you succeed. Get in touch anytime.</p>
                <div className="flex flex-col sm:flex-row justify-center gap-4">
                  <Button variant="gradient">Contact Support</Button>
                  <Button variant="outline">Schedule a Call</Button>
                </div>
              </div>
            </FadeInView>
            
            <motion.div
              initial={{ opacity: 0, x: 50 }}
              whileInView={{ opacity: 1, x: 0 }}
              viewport={{ once: true }}
              transition={{ duration: 0.8 }}
              className="relative"
            >
              <div className="bg-gradient-to-br from-yellow-100 to-orange-100 rounded-2xl p-8 shadow-2xl">
                <Image
                  src="/2af36fa8acaa80e0e2b028fea9915a5e0f5a2157.jpg"
                  alt="Support representative"
                  width={400}
                  height={300}
                  className="rounded-lg w-full"
                />
                
                <FloatingElement className="absolute top-4 right-4" duration={3}>
                  <Card className="p-3 bg-white shadow-lg max-w-xs">
                    <div className="text-center">
                      <div className="text-sm font-medium text-gray-900 mb-2">
                        "We ensure that any information you need is served immediately by simply contacting our team"
                      </div>
                      <div className="text-xs text-gray-500">Sara Feminmore</div>
                      <div className="text-xs text-gray-400">Head of CS</div>
                    </div>
                  </Card>
                </FloatingElement>
              </div>
            </motion.div>
          </div>
        </div>
      </section>

      {/* CTA Section */}
      <section className="py-16 sm:py-20 lg:py-24 bg-gray-900">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 text-center">
          <FadeInView>
            <div className="inline-block bg-yellow-400 text-gray-900 px-4 py-2 rounded-full text-sm font-medium mb-6">
              ⭐⭐⭐⭐⭐ Trusted by 50,000+ users
            </div>
            <h2 className="text-4xl lg:text-5xl font-bold text-white mb-6">
              Your Career Starts Here — <span className="bg-gradient-to-r from-blue-400 to-green-400 bg-clip-text text-transparent">Don't Wait</span>
            </h2>
            <p className="text-xl text-gray-300 mb-12 max-w-3xl mx-auto">
              Whether you're a student aiming for your dream job, a college looking to empower placements, or a 
              company hiring the next big talent — we've built the perfect platform for you.
            </p>
            
            <div className="flex flex-wrap justify-center gap-6 mb-16">
              <Button variant="gradient" size="xl">
                👨‍🎓 Join as a Student
              </Button>
              <Button variant="secondary" size="xl">
                🎓 Join as a College
              </Button>
              <Button variant="outline" size="xl" className="border-white text-white hover:bg-white hover:text-gray-900">
                🏢 Join as an Employer
              </Button>
            </div>
            
            <div className="grid grid-cols-2 md:grid-cols-4 gap-8 text-center">
              {stats.map((stat, index) => (
                <motion.div
                  key={index}
                  initial={{ opacity: 0, y: 20 }}
                  whileInView={{ opacity: 1, y: 0 }}
                  viewport={{ once: true }}
                  transition={{ duration: 0.5, delay: index * 0.1 }}
                  className="text-white"
                >
                  <div className="text-3xl font-bold mb-2">{stat.value}</div>
                  <div className="text-gray-400">{stat.label}</div>
                </motion.div>
              ))}
            </div>
          </FadeInView>
        </div>
      </section>

      <Footer />
    </>
  );
}
