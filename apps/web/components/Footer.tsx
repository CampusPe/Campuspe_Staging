import Link from 'next/link';
import { motion } from 'framer-motion';
import { 
  Facebook, 
  Instagram, 
  Twitter, 
  Youtube, 
  Mail, 
  Phone, 
  MapPin,
  ArrowRight 
} from 'lucide-react';
import { Button } from './ui/Button';

export default function Footer() {
  const currentYear = new Date().getFullYear();

  const footerSections = [
    {
      title: 'Home',
      links: [
        { label: 'Company', href: '/company' },
        { label: 'About us', href: '/about' },
        { label: 'Refund policy', href: '/refund' },
        { label: 'Partners', href: '/partners' },
        { label: 'Affiliates', href: '/affiliates' },
        { label: 'Integrations', href: '/integrations' }
      ]
    },
    {
      title: 'Claim your college',
      links: [
        { label: 'Register your college', href: '/register/college' },
        { label: 'Privacy policy', href: '/privacy' },
        { label: 'Careers', href: '/careers' },
        { label: 'Find a Partner', href: '/partners' },
        { label: 'In the News', href: '/news' }
      ]
    },
    {
      title: 'Solutions',
      links: [
        { label: 'Project Management', href: '/solutions/project-management' },
        { label: 'Marketing', href: '/solutions/marketing' },
        { label: 'CRM and Sales', href: '/solutions/crm' },
        { label: 'Software Development', href: '/solutions/development' },
        { label: 'Constructions', href: '/solutions/construction' },
        { label: 'Creative Production', href: '/solutions/creative' }
      ]
    },
    {
      title: 'Contact us',
      isContact: true,
      content: (
        <div className="space-y-4">
          <div className="flex items-center space-x-3 text-gray-300">
            <Phone className="w-4 h-4" />
            <span>+1 (555) 123-4567</span>
          </div>
          <div className="flex items-center space-x-3 text-gray-300">
            <Mail className="w-4 h-4" />
            <span>campuspe@gmail.com</span>
          </div>
          <div className="flex items-center space-x-3 text-gray-300">
            <MapPin className="w-4 h-4" />
            <span>123 Education St, Learning City</span>
          </div>
        </div>
      )
    }
  ];

  const socialLinks = [
    { icon: Facebook, href: '#', label: 'Facebook' },
    { icon: Instagram, href: '#', label: 'Instagram' },
    { icon: Twitter, href: '#', label: 'Twitter' },
    { icon: Youtube, href: '#', label: 'YouTube' }
  ];

  return (
    <footer className="bg-slate-800 text-white">
      {/* Main Footer Content */}
      <div className="max-w-7xl mx-auto container-padding section-padding">
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-8 lg:gap-12">
          {footerSections.map((section, index) => (
            <motion.div
              key={section.title}
              initial={{ opacity: 0, y: 20 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              transition={{ duration: 0.5, delay: index * 0.1 }}
              className="space-y-4"
            >
              <h3 className="font-semibold text-lg text-white">
                {section.title}
              </h3>
              
              {section.isContact ? (
                section.content
              ) : (
                <ul className="space-y-3">
                  {section.links?.map((link) => (
                    <li key={link.label}>
                      <Link
                        href={link.href}
                        className="text-gray-300 hover:text-white transition-colors duration-200 text-sm"
                      >
                        {link.label}
                      </Link>
                    </li>
                  ))}
                </ul>
              )}
            </motion.div>
          ))}
        </div>

        {/* CTA Section */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          transition={{ duration: 0.5, delay: 0.4 }}
          className="mt-16 pt-8 border-t border-gray-700"
        >
          <div className="text-center space-y-6">
            <h2 className="text-2xl md:text-3xl font-bold">
              From schools, colleges and share their<br />
              stories, campus life, achievements<br />
              and build their brand to grab the<br />
              attention of students and companies.
            </h2>
            <p className="text-gray-300 max-w-2xl mx-auto">
              Now schools, colleges can share their facilities, placements stories and connect directly to students.
            </p>
            <Button variant="gradient" size="lg" className="group">
              Join as a Student
              <ArrowRight className="w-4 h-4 ml-2 group-hover:translate-x-1 transition-transform" />
            </Button>
          </div>
        </motion.div>

        {/* Social Media Section */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          transition={{ duration: 0.5, delay: 0.5 }}
          className="mt-12 pt-8 border-t border-gray-700"
        >
          <div className="text-center space-y-6">
            <h3 className="text-lg font-semibold">Social Media</h3>
            <div className="flex justify-center space-x-6">
              {socialLinks.map((social) => {
                const Icon = social.icon;
                return (
                  <Link
                    key={social.label}
                    href={social.href}
                    className="w-10 h-10 bg-gray-700 rounded-full flex items-center justify-center hover:bg-primary-600 transition-colors duration-200 group"
                    aria-label={social.label}
                  >
                    <Icon className="w-5 h-5 group-hover:scale-110 transition-transform" />
                  </Link>
                );
              })}
            </div>
          </div>
        </motion.div>
      </div>

      {/* Bottom Bar */}
      <div className="border-t border-gray-700 bg-white">
        <div className="max-w-7xl mx-auto container-padding py-6">
          <div className="flex flex-col md:flex-row justify-between items-center space-y-4 md:space-y-0">
          <div>
                    <img src="/logo.svg" alt="CampusPe" className="h-8" />
            </div>
            
            <p className="text-gray-400 text-sm text-center md:text-left">
              &copy; {currentYear} CampusPe. All rights reserved.
            </p>
            
            <div className="flex items-center space-x-6 text-sm">
              <Link href="/privacy" className="text-gray-400 hover:text-white transition-colors">
                Privacy Policy
              </Link>
              <Link href="/terms" className="text-gray-400 hover:text-white transition-colors">
                Terms
              </Link>
              <Link href="mailto:support@campuspe.com" className="text-gray-400 hover:text-white transition-colors">
                Contact
              </Link>
            </div>
          </div>
        </div>
      </div>
    </footer>
  );
}
  