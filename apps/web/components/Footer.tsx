export default function Footer() {
    return (
      <footer className="bg-gray-100 mt-12 border-t">
        <div className="max-w-7xl mx-auto px-4 py-6 flex flex-col md:flex-row justify-between items-center text-sm text-gray-600">
          <p>&copy; {new Date().getFullYear()} CampusPe. All rights reserved.</p>
          <div className="flex gap-4 mt-2 md:mt-0">
            <a href="#" className="hover:text-blue-600">Privacy Policy</a>
            <a href="#" className="hover:text-blue-600">Terms</a>
            <a href="mailto:support@campuspe.com" className="hover:text-blue-600">Contact</a>
          </div>
        </div>
      </footer>
    );
  }
  